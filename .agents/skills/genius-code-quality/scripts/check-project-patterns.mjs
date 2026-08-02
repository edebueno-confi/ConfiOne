#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(process.cwd());
const sourceExtensions = new Set(['.cjs', '.css', '.js', '.jsx', '.mjs', '.sql', '.ts', '.tsx']);
const ignoredDirectories = new Set(['.git', '.next', '.turbo', 'coverage', 'dist', 'node_modules', 'output', 'tmp']);
const RULE_VERSION = '2';

function normalizePath(file) {
  return file.replaceAll('\\', '/');
}

function relativePath(file) {
  return normalizePath(path.relative(root, file));
}

export function classifyLayer(file) {
  const normalized = normalizePath(file);
  const lower = normalized.toLowerCase();
  if (lower.endsWith('.md')) return 'documentation';
  if (lower.startsWith('apps/web/src/')) return lower.includes('/test') || lower.includes('__tests__') ? 'frontend-test' : 'frontend';
  if (lower.startsWith('packages/contracts/')) return 'shared-contracts';
  if (lower.startsWith('supabase/functions/')) return 'backend/edge-function';
  if (lower.startsWith('supabase/migrations/')) return 'sql-migration';
  if (lower.startsWith('supabase/tests/')) return 'sql-test';
  if (lower.includes('/fixtures/') || lower.startsWith('supabase/qa/')) return 'fixture';
  if (lower.startsWith('tests/') || lower.includes('.test.')) return 'node-test';
  if (lower.startsWith('scripts/')) return /audit|check|validate|scan|inspect/i.test(path.basename(lower)) ? 'script/audit' : 'script/operational';
  if (lower.includes('tsconfig') || lower.includes('eslint') || lower.endsWith('.json')) return 'configuration';
  return 'unknown';
}

function applicability(rule, layer) {
  const notApplicable = {
    'security-definer-context': !['sql-migration'].includes(layer),
    'select-star-contract': ['sql-test', 'fixture', 'script/audit', 'node-test'].includes(layer),
    'direct-table-access': !['frontend', 'backend/edge-function'].includes(layer),
  };
  return notApplicable[rule] ? 'not-applicable' : 'applicable';
}

function currentCommit() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function lineOf(text, offset) {
  return text.slice(0, offset).split('\n').length;
}

function lineText(text, offset) {
  return text.slice(0, offset).split('\n').at(-1)?.trim() ?? '';
}

function safeEvidence(value) {
  return String(value).replace(/(?:Bearer\s+)[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]').slice(0, 160);
}

function makeFinding({ id, category, severity, status = 'candidate', confidence = 'média', file, line, evidence, impact, recommendation, mode, commit, layer, analysisType = 'textual', object = null, occurrences = 1 }) {
  return {
    id,
    detector: id,
    ruleVersion: RULE_VERSION,
    category,
    severity,
    status,
    contextStatus: status,
    confidence,
    layer,
    ruleApplicability: applicability(id, layer),
    file,
    line,
    evidence: safeEvidence(evidence),
    evidenceOrigin: analysisType === 'structural' ? 'source-structure' : 'source-text',
    analysisType,
    object,
    occurrences,
    impact,
    recommendation,
    blocksMergeOrRelease: status === 'confirmed' && ['crítico', 'alto'].includes(severity),
    possibleFalsePositive: !['confirmed', 'historical-fixed'].includes(status),
    provenance: {
      detector: id,
      ruleVersion: RULE_VERSION,
      mode,
      layer,
      analysisType,
      commit: commit ?? null,
      generatedAt: new Date().toISOString(),
      baseComparison: mode === 'changed' ? 'working-tree' : 'origin/main',
    },
  };
}

function extractFunctionName(block) {
  return block.match(/function\s+(?:if\s+not\s+exists\s+)?(?:[\w$]+\.)?["']?([\w$]+)["']?\s*\(/i)?.[1] ?? null;
}

function functionBlocks(content) {
  const starts = [];
  const startPattern = /create\s+(?:or\s+replace\s+)?function\b/gi;
  let match;
  while ((match = startPattern.exec(content)) !== null) starts.push(match.index);
  return starts.map((start, index) => {
    const nextStart = starts[index + 1] ?? content.length;
    const block = content.slice(start, nextStart);
    return { start, block, name: extractFunctionName(block) };
  });
}

function securityFindings({ file, content, mode, commit, layer }) {
  if (layer !== 'sql-migration') return [];
  const findings = [];
  for (const blockInfo of functionBlocks(content)) {
    const { block, start, name } = blockInfo;
    if (!/security\s+definer/i.test(block)) continue;
    const searchPath = block.match(/set\s+(?:local\s+)?search_path\s*(?:=|to)\s*(''|""|[^;\n]+?)(?=\s+as\b|;|\n)/i)?.[1]?.trim() ?? null;
    if (searchPath === "''" || searchPath === '""') continue;
    if (searchPath && /\bpublic\b|\bpg_temp\b/i.test(searchPath)) {
      findings.push(makeFinding({
        id: 'security-definer-context',
        category: 'banco/segurança',
        severity: 'alto',
        status: 'probable',
        confidence: 'alta',
        file,
        line: lineOf(content, start),
        evidence: `SECURITY DEFINER com search_path ${searchPath}`,
        impact: 'função elevada usa search_path potencialmente controlável ou amplo',
        recommendation: "auditar e fixar search_path vazio, objetos qualificados, grants e autorização; não editar migration histórica aplicada",
        mode,
        commit,
        layer,
        analysisType: 'structural',
        object: name,
      }));
    } else {
      findings.push(makeFinding({
        id: 'security-definer-context',
        category: 'banco/segurança',
        severity: 'médio',
        status: 'candidate',
        confidence: 'média',
        file,
        line: lineOf(content, start),
        evidence: 'SECURITY DEFINER sem search_path vazio comprovado no bloco',
        impact: 'o contexto de resolução de objetos precisa ser confirmado',
        recommendation: "confirmar search_path vazio, objetos qualificados, grants, tenant e papel; não editar migration histórica aplicada",
        mode,
        commit,
        layer,
        analysisType: 'structural',
        object: name,
      }));
    }
    const grant = content.match(new RegExp(`grant\\s+execute\\s+on\\s+function[^;]*\\b${name ? name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&') : '___'}\\b[^;]*\\bto\\s+(public|anon)`, 'i'));
    if (grant) {
      findings.push(makeFinding({
        id: 'security-definer-grant',
        category: 'banco/segurança',
        severity: 'alto',
        status: 'probable',
        confidence: 'média',
        file,
        line: lineOf(content, grant.index),
        evidence: 'GRANT EXECUTE de função SECURITY DEFINER para papel amplo',
        impact: 'grant amplo pode expandir a superfície de execução privilegiada',
        recommendation: 'confirmar necessidade do papel, grants mínimos e autorização interna',
        mode,
        commit,
        layer,
        analysisType: 'structural',
        object: name,
      }));
    }
    if (/execute\s+(?:format|immediate)/i.test(block) && /\|\||\$\{|\binput\b/i.test(block)) {
      findings.push(makeFinding({
        id: 'security-definer-dynamic-sql',
        category: 'banco/segurança',
        severity: 'alto',
        status: 'probable',
        confidence: 'média',
        file,
        line: lineOf(content, start),
        evidence: 'SECURITY DEFINER com SQL dinâmico e composição de entrada',
        impact: 'composição dinâmica pode ampliar risco de injeção ou bypass de autorização',
        recommendation: 'confirmar parametrização, allowlist de objetos e autorização antes de qualquer alteração',
        mode,
        commit,
        layer,
        analysisType: 'structural',
        object: name,
      }));
    }
  }
  return findings;
}

function selectStarFindings({ file, content, mode, commit, layer }) {
  if (['sql-test', 'fixture', 'script/audit', 'node-test'].includes(layer)) return [];
  const findings = [];
  const pattern = /\bselect\s+\*/gi;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const prefix = content.slice(Math.max(0, match.index - 80), match.index);
    if (/exists\s*\([^)]*$/i.test(prefix)) continue;
    const persistent = layer === 'sql-migration' && /create\s+(?:or\s+replace\s+)?(?:view|function)\b/i.test(content.slice(Math.max(0, match.index - 1200), match.index));
    findings.push(makeFinding({
      id: 'select-star-contract',
      category: 'banco/contratos',
      severity: persistent ? 'médio' : 'informativo',
      status: 'candidate',
      confidence: persistent ? 'média' : 'baixa',
      file,
      line: lineOf(content, match.index),
      evidence: match[0],
      impact: persistent ? 'retorno persistente pode sofrer drift quando a forma do objeto mudar' : 'seleção ampla pode ter custo ou instabilidade fora de contrato público',
      recommendation: persistent ? 'revisar o objeto persistente e o consumidor; explicitar colunas no contrato vigente' : 'manter como sinal de revisão contextual, sem tratar teste ou inspeção como defeito',
      mode,
      commit,
      layer,
      analysisType: 'structural',
    }));
  }
  return findings;
}

function directTableFindings({ file, content, mode, commit, layer }) {
  if (!['frontend', 'backend/edge-function'].includes(layer)) return [];
  const findings = [];
  const pattern = /\.from\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const table = match[1];
    if (/^(vw_|rpc_)/i.test(table)) continue;
    if (layer === 'frontend') {
      findings.push(makeFinding({
        id: 'direct-table-access',
        category: 'arquitetura',
        severity: 'médio',
        status: 'candidate',
        confidence: 'baixa',
        file,
        line: lineOf(content, match.index),
        evidence: `.from('${table}')`,
        impact: 'frontend acessa estrutura interna sem evidência de view/RPC canônica no trecho',
        recommendation: 'confirmar contrato de leitura, tenant/RLS e consumidor; usar view/read model quando exigido pela arquitetura',
        mode,
        commit,
        layer,
        object: table,
      }));
      continue;
    }
    const sensitiveTable = /secret|credential|token|audit|profiles|memberships/i.test(table);
    const serviceRole = /service[_-]?role|service_role_key/i.test(content);
    const authorization = /authorize|can_access|tenant_id|membership|permission/i.test(content.replace(/service[_-]?role/gi, ''));
    if (sensitiveTable && serviceRole && !authorization) {
      findings.push(makeFinding({
        id: 'direct-table-access-backend',
        category: 'banco/segurança',
        severity: 'alto',
        status: 'probable',
        confidence: 'média',
        file,
        line: lineOf(content, match.index),
        evidence: `.from('${table}') com service role sem autorização aparente`,
        impact: 'worker privilegiado acessa dado sensível sem evidência local de autorização',
        recommendation: 'confirmar autorização, tenant, grants, idempotência e necessidade de RPC; não presumir violação só pelo .from()',
        mode,
        commit,
        layer,
        object: table,
        analysisType: 'structural',
      }));
    }
  }
  return findings;
}

function genericFindings({ file, content, mode, commit, layer }) {
  if (['sql-test', 'fixture'].includes(layer)) return [];
  const findings = [];
  const rules = [
    { id: 'unsafe-double-cast', category: 'tipos', regex: /as\s+unknown\s+as\s+/g, severity: 'médio', confidence: 'alta', status: 'probable', impact: 'cast duplo exige justificativa e validação do contrato', recommendation: 'confirmar o contrato compartilhado e substituir o cast quando houver tipo real' },
    { id: 'ts-ignore', category: 'tipos', regex: /@ts-(?:ignore|expect-error)/g, severity: 'médio', confidence: 'média', status: 'candidate', impact: 'supressão TypeScript exige justificativa próxima', recommendation: 'revisar a causa e manter a supressão somente com justificativa' },
    { id: 'explicit-any', category: 'tipos', regex: /(?::\s*any\b|\bas\s+any\b|Array\s*<\s*any\s*>)/g, severity: 'baixo', confidence: 'média', status: 'candidate', impact: 'uso de any é candidato a perda de contrato', recommendation: 'confirmar se a flexibilidade é necessária e preferir tipo explícito' },
    { id: 'dangerous-html', category: 'segurança/frontend', regex: /dangerouslySetInnerHTML/g, severity: 'médio', confidence: 'média', status: 'candidate', impact: 'HTML precisa de origem e sanitização comprovadas', recommendation: 'confirmar origem, sanitização e superfície de renderização' },
    { id: 'silent-catch', category: 'async/erros', regex: /catch\s*\([^)]*\)\s*\{\s*\}/g, severity: 'médio', confidence: 'média', status: 'candidate', impact: 'catch vazio pode ocultar falha operacional', recommendation: 'confirmar observabilidade, tratamento e impacto do erro' },
    { id: 'todo-fixme', category: 'manutenção', regex: /\b(?:TODO|FIXME)\b/g, severity: 'informativo', confidence: 'alta', status: 'candidate', impact: 'pendência textual exige contexto e prioridade', recommendation: 'revisar contexto antes de converter em trabalho' },
  ];
  for (const rule of rules) {
    rule.regex.lastIndex = 0;
    const match = rule.regex.exec(content);
    if (!match) continue;
    const occurrenceFlags = rule.regex.flags.includes('g') ? rule.regex.flags : rule.regex.flags + 'g';
    findings.push(makeFinding({ id: rule.id, category: rule.category, severity: rule.severity, status: rule.status, confidence: rule.confidence, file, line: lineOf(content, match.index), evidence: match[0], impact: rule.impact, recommendation: rule.recommendation, mode, commit, layer, occurrences: [...content.matchAll(new RegExp(rule.regex.source, occurrenceFlags))].length }));
  }
  return findings;
}

export function analyzeSource({ file, content, mode = 'fast', commit = currentCommit(), generatedAt = new Date().toISOString() }) {
  const layer = classifyLayer(file);
  const context = { file: normalizePath(file), content, mode, commit, generatedAt, layer };
  return [
    ...securityFindings(context),
    ...selectStarFindings(context),
    ...directTableFindings(context),
    ...genericFindings(context),
  ];
}

export function enrichHistoricalFindings(findings, sources) {
  const safeDefinitions = new Map();
  for (const source of sources) {
    if (classifyLayer(source.file) !== 'sql-migration') continue;
    for (const block of functionBlocks(source.content)) {
      if (!/security\s+definer/i.test(block.block)) continue;
      const searchPath = block.block.match(/set\s+(?:local\s+)?search_path\s*(?:=|to)\s*(''|""|[^;\n]+?)(?=\s+as\b|;|\n)/i)?.[1]?.trim();
      if (searchPath === "''" || searchPath === '""') safeDefinitions.set(block.name, source.file);
    }
  }
  return findings.map((finding) => {
    if (finding.id !== 'security-definer-context' || !finding.object) return finding;
    const fixedFile = safeDefinitions.get(finding.object);
    if (!fixedFile || fixedFile <= finding.file) return finding;
    return {
      ...finding,
      severity: 'informativo',
      status: 'historical-fixed',
      contextStatus: 'historical-fixed',
      blocksMergeOrRelease: false,
      possibleFalsePositive: false,
      impact: 'padrão histórico possui definição posterior com search_path vazio',
      recommendation: 'não editar migration histórica; auditar o contrato final e registrar o hardening posterior',
    };
  });
}

function groupFindings(findings) {
  const groups = new Map();
  for (const finding of findings) {
    const key = [finding.id, finding.layer, finding.severity, finding.status].join('|');
    const current = groups.get(key) ?? { rule: finding.id, layer: finding.layer, severity: finding.severity, status: finding.status, count: 0, files: [], representative: finding };
    current.count += finding.occurrences ?? 1;
    if (!current.files.includes(finding.file) && current.files.length < 8) current.files.push(finding.file);
    groups.set(key, current);
  }
  return [...groups.values()].sort((left, right) => right.count - left.count);
}

export function summarizeFindings(findings) {
  const active = findings.filter((finding) => !['dismissed', 'historical-fixed'].includes(finding.status));
  const confirmed = active.filter((finding) => finding.status === 'confirmed');
  const probable = active.filter((finding) => finding.status === 'probable');
  const confirmedCritical = confirmed.some((finding) => finding.severity === 'crítico');
  const confirmedHigh = confirmed.some((finding) => finding.severity === 'alto');
  const probableHigh = probable.some((finding) => ['crítico', 'alto'].includes(finding.severity));
  const risk = confirmedCritical ? 'crítico' : confirmedHigh ? 'alto' : probableHigh ? 'médio' : active.length ? 'baixo' : 'baixo';
  const verdict = confirmedCritical || confirmedHigh ? 'reprovado' : active.length ? 'aprovado com observações' : 'aprovado';
  const bySeverity = Object.fromEntries(['crítico', 'alto', 'médio', 'baixo', 'informativo'].map((severity) => [severity, findings.filter((finding) => finding.severity === severity).length]));
  const byStatus = Object.fromEntries(['candidate', 'probable', 'confirmed', 'dismissed', 'historical-fixed', 'requires-runtime-validation'].map((status) => [status, findings.filter((finding) => finding.status === status).length]));
  return {
    risk,
    verdict,
    blockers: findings.filter((finding) => finding.blocksMergeOrRelease).length,
    total: findings.length,
    bySeverity,
    byStatus,
    groups: groupFindings(findings),
    truncation: { total: findings.length, displayed: findings.length, omitted: 0, rulesAffected: [], canHideCritical: false },
  };
}

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.agents') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) files.push(...walk(fullPath));
      continue;
    }
    if (!sourceExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    if (/(^|[\\/])\.env(?:\.|$)|(?:token|secret|credential|cookie)/i.test(fullPath)) continue;
    files.push(fullPath);
  }
  return files;
}

function filesFromArguments(requested, requestedFiles) {
  if (!requestedFiles.length) return walk(requested);
  const selected = requestedFiles.map((file) => path.resolve(root, file)).filter((file) => {
    const relative = path.relative(root, file);
    return !relative.startsWith('..') && fs.existsSync(file) && sourceExtensions.has(path.extname(file).toLowerCase());
  });
  return selected.length ? selected : walk(requested);
}

export function scanFiles(files, options = {}) {
  const findings = [];
  const sources = [];
  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const relative = relativePath(file);
    sources.push({ file: relative, content });
    findings.push(...analyzeSource({ file: relative, content, mode: options.mode ?? 'fast', commit: options.commit ?? currentCommit(), generatedAt: options.generatedAt }));
  }
  return { findings: enrichHistoricalFindings(findings, sources), filesScanned: files.length };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const fileFlag = args.indexOf('--files');
  const requestedFiles = fileFlag >= 0 ? args.slice(fileFlag + 1).filter((arg) => !arg.startsWith('--')) : [];
  const modeIndex = args.indexOf('--mode');
  const mode = modeIndex >= 0 ? args[modeIndex + 1] : 'fast';
  const positional = args.filter((arg, index) => arg !== '--files' && arg !== '--mode' && args[index - 1] !== '--mode' && !arg.startsWith('--'));
  return { requested: path.resolve(root, positional[0] ?? '.'), requestedFiles, mode };
}

function main() {
  const { requested, requestedFiles, mode } = parseArgs();
  const files = filesFromArguments(requested, requestedFiles);
  const commit = currentCommit();
  const result = scanFiles(files, { mode, commit, generatedAt: new Date().toISOString() });
  const summary = summarizeFindings(result.findings);
  process.stdout.write(`${JSON.stringify({ scope: relativePath(requested) || '.', filesScanned: result.filesScanned, findings: result.findings, groups: summary.groups, summary, truncated: false }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main();
