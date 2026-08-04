#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { summarizeFindings } from './check-project-patterns.mjs';

const argv = process.argv.slice(2);
const mode = argv[0] ?? 'fast';
const modulePath = mode === 'module' ? argv[1] : undefined;
const asJson = argv.includes('--json');
const strict = argv.includes('--strict');
const root = path.resolve(process.cwd());
const validModes = new Set(['fast', 'changed', 'staged', 'module', 'full']);
const commands = [];

function redact(value) {
  return String(value ?? '')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[JWT REDACTED]')
    .replace(/(SERVICE_ROLE_KEY|ACCESS_TOKEN|REFRESH_TOKEN)\s*[:=]\s*[^\s]+/gi, '$1=[REDACTED]');
}

function run(command, args, options = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    shell: options.shell ?? false,
    timeout: options.timeout ?? 120000,
    windowsHide: true,
  });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const output = redact(`${stdout}${stderr}`).trim();
  const record = {
    command: [command, ...args].join(' '),
    result: result.error ? 'error' : result.status === 0 ? 'pass' : 'fail',
    exitCode: result.status ?? null,
    durationMs: Date.now() - started,
    output: `${result.error ? `${result.error.message}\n` : ''}${output}`.slice(-4000),
    stdout: redact(stdout),
    stderr: redact(stderr),
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
  const diffCheck = mode === 'staged' ? git(['diff', '--cached', '--check']) : git(['diff', '--check']);
  const unstaged = git(['diff', '--name-only', '--diff-filter=ACMRTUXB']);
  const staged = git(['diff', '--cached', '--name-only', '--diff-filter=ACMRTUXB']);
  const untracked = git(['ls-files', '--others', '--exclude-standard']);
  const allChangedFiles = [...unstaged.stdout.split(/\r?\n/), ...staged.stdout.split(/\r?\n/), ...untracked.stdout.split(/\r?\n/)].filter(Boolean).filter((file, index, all) => all.indexOf(file) === index);
  const changedFiles = mode === 'staged'
    ? staged.stdout.split(/\r?\n/).filter(Boolean).filter((file, index, all) => all.indexOf(file) === index)
    : allChangedFiles;
  return {
    status: status.stdout.trim(),
    branch: branch.stdout.trim(),
    head: head.stdout.trim(),
    dirty: Boolean(status.stdout.replace(/^##[^\n]*\n?/, '').trim()),
    diffCheck: diffCheck.result,
    changedFiles,
    baseComparison: mode === 'changed' ? 'working-tree' : mode === 'staged' ? 'index' : 'origin/main',
  };
}

function packageScripts() {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts ?? {};
  } catch {
    return {};
  }
}

function npmScript(name, timeout = 240000) {
  const scripts = packageScripts();
  if (!scripts[name]) {
    commands.push({ command: `npm run ${name}`, result: 'not-configured', exitCode: null, durationMs: 0, output: 'script não configurado no package.json raiz', stdout: '', stderr: '' });
    return;
  }
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', name], { timeout, shell: process.platform === 'win32' });
}

function runPatterns(scope, files = []) {
  const script = path.join(root, '.agents', 'skills', 'genius-code-quality', 'scripts', 'check-project-patterns.mjs');
  const args = [script];
  if (scope) args.push(scope);
  args.push('--mode', mode);
  if (files.length) args.push('--files', ...files);
  const result = run(process.execPath, args, { timeout: 180000 });
  try {
    return JSON.parse(result.stdout.replace(/^\uFEFF/, ''));
  } catch {
    return { scope: scope ?? '.', filesScanned: 0, findings: [], groups: [], summary: summarizeFindings([]), truncated: false, parseError: true };
  }
}

function walk(directory, extensions = new Set(['.cjs', '.css', '.js', '.jsx', '.mjs', '.sql', '.ts', '.tsx'])) {
  if (!fs.existsSync(directory)) return [];
  const ignored = new Set(['.git', '.next', '.turbo', 'coverage', 'dist', 'node_modules', 'output', 'tmp']);
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.agents') continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name)) files.push(...walk(full, extensions));
    } else if (extensions.has(path.extname(entry.name).toLowerCase()) && !/(^|[\\/])\.env(?:\.|$)|(?:token|secret|credential|cookie)/i.test(full)) {
      files.push(full);
    }
  }
  return files;
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function moduleAudit(scope) {
  const scopeAbsolute = path.resolve(root, scope);
  const directFiles = walk(scopeAbsolute);
  const directSet = new Set(directFiles.map((file) => path.resolve(file)));
  const imports = new Set();
  const contracts = new Set();
  const states = { loading: 0, empty: 0, error: 0, unavailable: 0 };
  for (const file of directFiles) {
    const content = readText(file);
    for (const match of content.matchAll(/(?:import|export)\s+(?:[^'";]+\s+from\s+)?['"]([^'"]+)['"]/g)) imports.add(match[1]);
    for (const match of content.matchAll(/\b(?:vw|rpc)_[a-zA-Z0-9_]+/g)) contracts.add(match[0]);
    for (const match of content.matchAll(/\.from\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) contracts.add(match[1]);
    for (const state of Object.keys(states)) if (new RegExp(`\\b${state}\\b`, 'i').test(content)) states[state] += 1;
  }
  const allSourceFiles = walk(path.join(root, 'apps', 'web'));
  const consumers = [];
  for (const file of allSourceFiles) {
    if (directSet.has(path.resolve(file))) continue;
    const content = readText(file);
    if (content.includes('features/analytics') || /analytics-api|analyticsContent|\/admin\/analytics/.test(content)) consumers.push(path.relative(root, file).replaceAll('\\', '/'));
  }
  const relatedTests = walk(path.join(root, 'tests'), new Set(['.js', '.mjs', '.ts', '.tsx'])).filter((file) => /analytics/i.test(readText(file)) || /analytics/i.test(path.basename(file))).map((file) => path.relative(root, file).replaceAll('\\', '/'));
  const relatedDbTests = walk(path.join(root, 'supabase', 'tests'), new Set(['.sql'])).filter((file) => /analytics/i.test(readText(file)) || /analytics/i.test(path.basename(file))).map((file) => path.relative(root, file).replaceAll('\\', '/'));
  const docs = walk(path.join(root, 'docs'), new Set(['.md'])).filter((file) => /analytics/i.test(path.basename(file)) || /analytics/i.test(readText(file))).slice(0, 80).map((file) => path.relative(root, file).replaceAll('\\', '/'));
  const routes = allSourceFiles.filter((file) => /router|route|manifest|navigation/i.test(path.basename(file)) && /analytics|admin\/analytics/i.test(readText(file))).map((file) => path.relative(root, file).replaceAll('\\', '/'));
  return {
    directScope: path.relative(root, scopeAbsolute).replaceAll('\\', '/') || '.',
    directFiles: directFiles.map((file) => path.relative(root, file).replaceAll('\\', '/')),
    dependencies: [...imports].sort(),
    contracts: [...contracts].sort(),
    consumers: [...new Set(consumers)].sort(),
    tests: [...new Set([...relatedTests, ...relatedDbTests])].sort(),
    documentation: docs,
    routes,
    mainStates: states,
    itemsNotAnalyzed: ['banco em execução', 'navegador/QA visual', 'credenciais externas', 'performance de runtime', 'migrações aplicadas fora do checkout'],
  };
}

function chooseGates() {
  if (!validModes.has(mode) || (mode === 'module' && !modulePath)) throw new Error('Uso: fast | changed | staged | module <caminho> | full [--json]');
  const gitState = globalThis.__gitState;
  const scope = mode === 'module' ? modulePath : undefined;
  const patterns = runPatterns(scope, ['fast', 'changed', 'staged'].includes(mode) ? gitState.changedFiles : []);
  npmScript('lint');
  if (mode === 'fast' || mode === 'staged' || mode === 'full') npmScript('local:qa:secret-scan', 180000);
  if (mode === 'fast' || mode === 'staged' || mode === 'full') npmScript('security:audit:prod', 180000);
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

function markdownFindings(findings) {
  const protectedFindings = findings.filter((finding) => finding.blocksMergeOrRelease || (finding.status === 'confirmed' && ['crítico', 'alto'].includes(finding.severity)));
  const candidates = findings.filter((finding) => !protectedFindings.includes(finding));
  return [...protectedFindings, ...candidates.slice(0, 60)];
}

let gitState;
let patterns;
let moduleInventory = null;
let error;
try {
  gitState = readGit();
  globalThis.__gitState = gitState;
  patterns = chooseGates();
  if (mode === 'module') moduleInventory = moduleAudit(modulePath);
} catch (caught) {
  error = caught instanceof Error ? caught.message : String(caught);
  gitState ??= { branch: '', head: '', dirty: false, changedFiles: [], diffCheck: 'error', baseComparison: mode === 'changed' ? 'working-tree' : mode === 'staged' ? 'index' : 'origin/main' };
  patterns ??= { scope: modulePath ?? '.', filesScanned: 0, findings: [], groups: [], summary: summarizeFindings([]), truncated: false };
}

const summary = summarizeFindings(patterns.findings ?? []);
const failedCommands = commands.filter((command) => command.result === 'fail' || command.result === 'error').length;
const unavailableCommands = commands.filter((command) => command.result === 'not-configured').map((command) => command.command);
const diffCheckFailed = gitState.diffCheck !== 'pass';
const blockers = summary.blockers;
const verdict = error || failedCommands || diffCheckFailed ? 'não conclusivo' : summary.verdict;
const findings = patterns.findings ?? [];
const displayedFindings = markdownFindings(findings);
const truncation = {
  total: findings.length,
  displayed: displayedFindings.length,
  omitted: Math.max(0, findings.length - displayedFindings.length),
  rulesAffected: [...new Set(findings.filter((finding) => !displayedFindings.includes(finding)).map((finding) => finding.id))],
  canHideCritical: false,
};
const reportCommands = commands.map(({ stdout, stderr, ...safe }) => safe);
const report = {
  summary: { mode, scope: modulePath ?? (mode === 'changed' ? 'working tree changes' : mode === 'staged' ? 'staged changes' : 'repository'), risk: summary.risk, blockers, verdict },
  findings,
  findingGroups: summary.groups,
  moduleAudit: moduleInventory,
  commands: reportCommands,
  metrics: {
    filesAnalyzed: patterns.filesScanned ?? 0,
    totalFindings: findings.length,
    displayedFindings: displayedFindings.length,
    omittedFindings: truncation.omitted,
    patternCandidates: findings.filter((finding) => finding.status === 'candidate').length,
    probableFindings: findings.filter((finding) => finding.status === 'probable').length,
    confirmedFindings: findings.filter((finding) => finding.status === 'confirmed').length,
    failedCommands: failedCommands + (diffCheckFailed ? 1 : 0),
    unavailableCommands,
  },
  truncation,
  git: { branch: gitState.branch, head: gitState.head, dirty: gitState.dirty, diffCheck: gitState.diffCheck, changedFiles: gitState.changedFiles, baseComparison: gitState.baseComparison },
  limitations: [
    'Heurísticas permanecem candidatas até revisão contextual; somente findings confirmed bloqueiam merge/release.',
    'Banco, navegador, sync externo, migration remota e credenciais externas não são executados por padrão.',
    ...(unavailableCommands.length ? [`Comandos não configurados: ${unavailableCommands.join(', ')}`] : []),
    ...(diffCheckFailed ? ['git diff --check falhou no escopo analisado.'] : []),
    ...(error ? [error] : []),
  ],
};

if (asJson) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  const relevant = displayedFindings;
  const lines = [
    '# Auditoria de Qualidade de Código',
    '',
    '## 1. Resumo executivo',
    `- Escopo: ${report.summary.scope}`,
    `- Resultado: ${verdict}`,
    `- Risco contextual: ${summary.risk}`,
    `- Blockers confirmados: ${blockers}`,
    `- Findings totais: ${findings.length}; exibidos: ${displayedFindings.length}; omitidos: ${truncation.omitted}`,
    '',
    '## 2. Comandos executados',
    ...reportCommands.map((command) => `- \`${command.command}\` — ${command.result} (${command.durationMs} ms)`),
    '',
    '## 3. Achados agrupados',
    ...(summary.groups.length ? summary.groups.map((group) => `- [${group.severity}] ${group.rule} / ${group.layer} / ${group.status}: ${group.count} ocorrência(s)`) : ['- Nenhum candidato encontrado.']),
    '',
    '## 4. Achados relevantes',
    ...(relevant.length ? relevant.map((finding) => `- [${finding.severity}] ${finding.status} ${finding.category} — ${finding.file}:${finding.line} — ${finding.impact}`) : ['- Nenhum achado relevante.']),
    '',
    '## 5. Auditoria do módulo',
    ...(moduleInventory ? [
      `- Escopo direto: ${moduleInventory.directFiles.length} arquivo(s)`,
      `- Dependências: ${moduleInventory.dependencies.length}`,
      `- Consumidores: ${moduleInventory.consumers.length}`,
      `- Contratos: ${moduleInventory.contracts.length}`,
      `- Testes: ${moduleInventory.tests.length}`,
      `- Documentação: ${moduleInventory.documentation.length}`,
      `- Rotas: ${moduleInventory.routes.length}`,
      '- Não analisado: banco em execução, navegador/QA visual, credenciais externas e performance de runtime',
    ] : ['- Não aplicável fora do modo module.']),
    '',
    '## 6. Truncamento e completude',
    `- Total preservado no JSON: ${truncation.total}`,
    `- Exibidos no Markdown: ${truncation.displayed}`,
    `- Omitidos apenas do resumo: ${truncation.omitted}`,
    `- Regras afetadas: ${truncation.rulesAffected.join(', ') || 'nenhuma'}`,
    '- Findings críticos/altos confirmados nunca são truncados.',
    '',
    '## 7. Dívida técnica',
    '- Confirmar somente candidatos com contrato, consumidor e evidência atual.',
    '',
    '## 8. Pontos positivos',
    '- O gate separa candidato, provável, confirmado e histórico corrigido.',
    '',
    '## 9. Falsos positivos e incertezas',
    ...report.limitations.map((limitation) => `- ${limitation}`),
    '',
    '## 10. Plano recomendado',
    '- Revisar os grupos prováveis no contexto do contrato; não editar produto automaticamente.',
    '',
    '## 11. Estado Git',
    `- Branch: ${gitState.branch}`,
    `- HEAD: ${gitState.head}`,
    `- Base: ${gitState.baseComparison}`,
    `- Arquivos alterados: ${gitState.changedFiles.length}`,
    '',
    '## 12. Limitações',
    '- Lint é reportado como não configurado quando ausente no package.json.',
    '- Banco, navegador e integrações não são executados por este gate.',
    '',
    '## 13. Veredito',
    `- ${verdict}`,
  ];
  process.stdout.write(`${lines.join('\n')}\n`);
}

process.exitCode = error || failedCommands || diffCheckFailed || blockers || (strict && findings.some((finding) => finding.status === 'probable' && ['crítico', 'alto'].includes(finding.severity))) ? 1 : 0;
