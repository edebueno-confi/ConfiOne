#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const argv = process.argv.slice(2);
const mode = argv[0] ?? 'fast';
const modulePath = mode === 'module' ? argv[1] : undefined;
const asJson = argv.includes('--json');
const root = path.resolve(process.cwd());
const validModes = new Set(['fast', 'changed', 'module', 'full']);
const commands = [];

function run(command, args, options = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', shell: options.shell ?? false, timeout: options.timeout ?? 120000, windowsHide: true });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const output = `${stdout}${stderr}`.trim();
  const record = {
    command: [command, ...args].join(' '),
    result: result.error ? 'error' : result.status === 0 ? 'pass' : 'fail',
    exitCode: result.status ?? null,
    durationMs: Date.now() - started,
    output: `${result.error ? `${result.error.message}\n` : ''}${output}`.slice(-4000),
    stdout,
    stderr
  };
  commands.push(record);
  return record;
}

function git(args) {
  return run('git', args, { timeout: 30000 });
}

function readGit() {
  const status = git(['status', '--short', '--branch']);
  const head = git(['rev-parse', 'HEAD']);
  const branch = git(['branch', '--show-current']);
  const diffCheck = git(['diff', '--check']);
  const unstaged = git(['diff', '--name-only']);
  const staged = git(['diff', '--cached', '--name-only']);
  const untracked = git(['ls-files', '--others', '--exclude-standard']);
  return {
    status: status.stdout.trim(),
    branch: branch.stdout.trim(),
    head: head.stdout.trim(),
    dirty: Boolean(status.stdout.replace(/^##[^\n]*\n?/, '').trim()),
    diffCheck: diffCheck.result,
    changedFiles: [...unstaged.stdout.split(/\r?\n/), ...staged.stdout.split(/\r?\n/), ...untracked.stdout.split(/\r?\n/)].filter(Boolean).filter((file, index, all) => all.indexOf(file) === index)
  };
}

function packageScripts() {
  const packageFile = path.join(root, 'package.json');
  try {
    return JSON.parse(fs.readFileSync(packageFile, 'utf8')).scripts ?? {};
  } catch {
    return {};
  }
}

function npmScript(name, timeout = 240000) {
  const scripts = packageScripts();
  if (!scripts[name]) {
    commands.push({ command: `npm run ${name}`, result: 'not-configured', exitCode: null, durationMs: 0, output: 'script não encontrado no package.json raiz' });
    return;
  }
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', name], { timeout, shell: process.platform === 'win32' });
}

function runPatterns(scope, files = []) {
  const script = path.join(root, '.agents', 'skills', 'genius-code-quality', 'scripts', 'check-project-patterns.mjs');
  const args = [script, ...(scope ? [scope] : [])];
  if (files.length) args.push('--files', ...files);
  const result = run(process.execPath, args, { timeout: 120000 });
  try {
    return JSON.parse(result.stdout);
  } catch {
    return { scope: scope ?? '.', filesScanned: 0, findings: [], truncated: false, parseError: true };
  }
}

function chooseGates() {
  if (!validModes.has(mode) || (mode === 'module' && !modulePath)) {
    throw new Error('Uso: fast | changed | module <caminho> | full [--json]');
  }
  const scope = mode === 'module' ? modulePath : undefined;
  const changedFiles = gitState?.changedFiles ?? [];
  const patterns = runPatterns(scope, mode === 'fast' || mode === 'changed' ? changedFiles : []);
  if (mode === 'module' && scope?.startsWith('apps/web')) npmScript('web:typecheck');
  else if (mode === 'module' && scope?.startsWith('packages/contracts')) npmScript('contracts:typecheck');
  else if (mode !== 'module' || scope?.startsWith('apps')) {
    npmScript('contracts:typecheck');
    npmScript('web:typecheck');
  }
  if (mode === 'full') {
    npmScript('repository:check-root');
    npmScript('documentation:validate:internal-docs');
  }
  return patterns;
}

let gitState;
let patterns;
let error;
try {
  gitState = readGit();
  patterns = chooseGates();
} catch (caught) {
  error = caught instanceof Error ? caught.message : String(caught);
  gitState ??= { branch: '', head: '', dirty: false, changedFiles: [] };
  patterns ??= { scope: modulePath ?? '.', filesScanned: 0, findings: [], truncated: false };
}

const blockers = patterns.findings.filter((finding) => finding.blocksMergeOrRelease).length;
const failedCommands = commands.filter((command) => command.result === 'fail' || command.result === 'error').length;
const verdict = error || failedCommands || blockers ? 'não conclusivo' : 'aprovado com ressalvas';
const reportCommands = commands.map(({ stdout, stderr, ...safe }) => safe);
const report = {
  summary: { mode, scope: modulePath ?? (mode === 'changed' ? 'working tree changes' : 'repository'), risk: blockers ? 'alto' : 'a avaliar', blockers },
  findings: patterns.findings,
  commands: reportCommands,
  metrics: { filesAnalyzed: patterns.filesScanned, patternCandidates: patterns.findings.length, failedCommands },
  git: { branch: gitState.branch, head: gitState.head, dirty: gitState.dirty, diffCheck: gitState.diffCheck, changedFiles: gitState.changedFiles },
  verdict,
  limitations: [
    'A auditoria estática é candidata a falso positivo e exige revisão semântica.',
    'Banco, navegador, sync externo, migration, build gerador e testes demorados não são executados por padrão.',
    ...(error ? [error] : [])
  ]
};

if (asJson) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  const lines = [
    '# Auditoria de Qualidade de Código',
    '',
    '## 1. Resumo executivo',
    `- Escopo: ${report.summary.scope}`,
    `- Resultado: ${report.verdict}`,
    `- Risco geral: ${report.summary.risk}`,
    `- Bloqueadores: ${report.summary.blockers}`,
    '',
    '## 2. Comandos executados',
    ...reportCommands.map((command) => `- \`${command.command}\` — ${command.result} (${command.durationMs} ms)`),
    '',
    '## 3. Achados bloqueantes',
    ...(patterns.findings.filter((finding) => finding.blocksMergeOrRelease).slice(0, 20).map((finding) => `- [${finding.severity}] ${finding.file}:${finding.line} — ${finding.impact}`) || ['- Nenhum candidato bloqueante confirmado.']),
    '',
    '## 4. Achados por categoria',
    ...(patterns.findings.slice(0, 50).map((finding) => `- [${finding.severity}] ${finding.category} — ${finding.file}:${finding.line} — ${finding.impact}`) || ['- Nenhum candidato encontrado.']),
    '',
    '## 5. Dívida técnica',
    '- Priorizar somente após confirmar candidatos contra contratos e consumidores.',
    '',
    '## 6. Pontos positivos',
    '- Estado Git, limitações e origem dos candidatos são registrados separadamente.',
    '',
    '## 7. Falsos positivos e incertezas',
    ...report.limitations.map((limitation) => `- ${limitation}`),
    '',
    '## 8. Plano de correção recomendado',
    '- Lote imediato: investigar críticos/altos confirmados.',
    '- Curto prazo: cobrir contratos, erros e permissões ausentes.',
    '- Médio prazo: reduzir dívida somente com evidência de impacto.',
    '',
    '## 9. Estado Git',
    `- Branch: ${gitState.branch}`,
    `- HEAD: ${gitState.head}`,
    `- Arquivos analisados: ${gitState.changedFiles.length} alterados/novos; ${patterns.filesScanned} escaneados`,
    '',
    '## 10. Veredito',
    `- ${report.verdict}`
  ];
  process.stdout.write(`${lines.join('\n')}\n`);
}

process.exitCode = error || failedCommands ? 1 : 0;
