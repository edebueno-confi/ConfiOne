#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.cwd());
const args = process.argv.slice(2);
const mode = args[0] ?? 'fast';
const target = ['domain', 'apply'].includes(mode) ? args[1] : undefined;
const asJson = args.includes('--json');
const strict = args.includes('--strict');
const baselinePath = args.includes('--baseline') ? args[args.indexOf('--baseline') + 1] : undefined;
const validModes = new Set(['fast', 'changed', 'domain', 'full', 'apply', 'scheduled']);
const docExtensions = new Set(['.md', '.markdown', '.mdx']);
const codeExtensions = new Set(['.cjs', '.js', '.jsx', '.mjs', '.sql', '.ts', '.tsx']);
const ignoredDirectories = new Set(['.git', '.next', '.turbo', 'coverage', 'dist', 'node_modules', 'output', 'tmp', '.supabase']);
const commands = [];

function relative(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function safePath(file) {
  const rel = relative(file);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function redacted(value) {
  return String(value)
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[REDACTED_JWT]')
    .replace(/(authorization|cookie|password|secret|token|service[_-]?role)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]');
}

function walk(directory, extensions) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name) && entry.name !== '.agents') files.push(...walk(fullPath, extensions));
      continue;
    }
    if (!extensions.has(path.extname(entry.name).toLowerCase())) continue;
    if (/(^|[\\/])\.env(?:\.|$)|(?:credential|cookie|private-key|service-role)/i.test(fullPath)) continue;
    if (safePath(fullPath)) files.push(fullPath);
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

function lineOf(content, offset) {
  return content.slice(0, Math.max(0, offset)).split('\n').length;
}

function git(args) {
  const started = Date.now();
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', shell: false, timeout: 30000, windowsHide: true });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  commands.push({ command: `git ${args.join(' ')}`, result: result.status === 0 ? 'pass' : 'fail', exitCode: result.status, durationMs: Date.now() - started, output: redacted(`${stdout}${stderr}`).trim().slice(-2000) });
  return stdout.trim();
}

function runSafeCommand(command, args) {
  const started = Date.now();
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32', timeout: 120000, windowsHide: true });
  const output = redacted(`${result.stdout ?? ''}${result.stderr ?? ''}`).trim();
  commands.push({ command: [command, ...args].join(' '), result: result.status === 0 ? 'pass' : result.error ? 'error' : 'fail', exitCode: result.status, durationMs: Date.now() - started, output: output.slice(-2000) });
}

function gitState() {
  const status = git(['status', '--short', '--branch']);
  const changed = [git(['diff', '--name-only']), git(['diff', '--cached', '--name-only']), git(['ls-files', '--others', '--exclude-standard'])]
    .flatMap((value) => value.split(/\r?\n/))
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);
  const diffCheckRecord = commands.at(-1);
  return {
    branch: git(['branch', '--show-current']),
    head: git(['rev-parse', 'HEAD']),
    base: git(['merge-base', 'HEAD', 'origin/main']) || null,
    status,
    dirty: Boolean(status.replace(/^##[^\n]*\n?/, '').trim()),
    changedFiles: changed,
    diffCheck: diffCheckRecord?.result === 'pass' ? 'pass' : 'fail'
  };
}

function packageScripts() {
  try {
    return JSON.parse(readText(path.join(root, 'package.json'))).scripts ?? {};
  } catch {
    return {};
  }
}

function titleFor(content, file) {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? path.basename(file, path.extname(file));
}

function inferType(file, content) {
  const value = `${file} ${content.slice(0, 500)}`.toLowerCase();
  if (/project_state/.test(value)) return 'project-state';
  if (/ledger/.test(value)) return 'decision';
  if (/architecture|contract|rpc|view|migration/.test(value)) return 'technical-contract';
  if (/security|auth|rls|permission/.test(value)) return 'security';
  if (/report|audit|validation|qa/.test(value)) return 'execution-report';
  if (/spec|screen|route/.test(value)) return 'specification';
  if (/roadmap|plan/.test(value)) return 'plan';
  if (/backlog|kanban/.test(value)) return 'backlog';
  if (/runbook|policy|governance/.test(value)) return 'runbook';
  if (/handoff|context/.test(value)) return 'handoff';
  if (/design|blueprint|screenshot|visual/.test(value)) return 'visual-evidence';
  return 'tutorial';
}

function inferDomain(file, content) {
  const value = `${file} ${content.slice(0, 1200)}`.toLowerCase();
  const domains = [
    ['analytics', /analytics|dashboard|metric/],
    ['knowledge', /knowledge|article|help-center|editor/],
    ['support', /support|ticket|conversation|sla/],
    ['customer-success', /customer-success|customer success|cs|portfolio/],
    ['integrations', /integration|hubspot|omie|sync|watermark/],
    ['security', /security|auth|rls|permission|grant/],
    ['tenancy', /tenant|membership|organization/],
    ['release', /release|roadmap|project_state|buildout/],
    ['architecture', /architecture|contract|rpc|view|migration/]
  ];
  return domains.find(([, pattern]) => pattern.test(value))?.[0] ?? 'general';
}

function inferStatus(file, content) {
  const explicit = content.match(/(?:^|\n)\s*(?:status|document status)\s*:\s*([A-Z_-]+)/i)?.[1]?.toUpperCase();
  if (explicit && ['CURRENT', 'CANONICAL', 'HISTORICAL', 'SUPERSEDED', 'DEPRECATED', 'EXPERIMENTAL', 'DRAFT', 'GENERATED', 'ARCHIVED', 'UNKNOWN'].includes(explicit)) return explicit;
  if (/superseded|substitu[ií]do por|deprecated|obsoleto/i.test(content)) return 'SUPERSEDED';
  const rel = relative(file);
  if (/\b(output|prototype|experimental)\b/i.test(rel)) return 'EXPERIMENTAL';
  if (/docs[\\/]reports[\\/]|context-handoff[\\/]/i.test(rel)) return 'HISTORICAL';
  if (/PROJECT_STATE|ARCHITECTURE_RULES|VIEW_RPC_CONTRACTS|AUTH_CONTEXT_STRATEGY|CODEX_EXECUTION_RULES|VALIDATION_CHECKLIST|DOCUMENTATION_LEDGER|DOCUMENTATION_UPDATE_POLICY|DOCUMENTATION_GOVERNANCE_RUNBOOK/i.test(rel)) return 'CANONICAL';
  if (/^README\.md$|^AGENTS\.md$|^CLAUDE\.md$/i.test(rel)) return 'CANONICAL';
  return 'UNKNOWN';
}

function findDates(content) {
  return [...new Set(content.match(/20\d{2}-\d{2}-\d{2}/g) ?? [])].slice(0, 10);
}

function gitMetadata(file) {
  if (!['full', 'domain', 'apply'].includes(mode)) return { lastChangedAt: null, sourceCommit: null };
  const relativePath = relative(file);
  const date = git(['log', '-1', '--format=%cI', '--', relativePath]);
  const commit = git(['log', '-1', '--format=%H', '--', relativePath]);
  return { lastChangedAt: date || null, sourceCommit: commit || null };
}

function extractRefs(content) {
  const refs = [];
  const regex = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const value = match[1].replace(/^<|>$/g, '').split('#')[0];
    if (!value || /^(?:https?:|mailto:|#)/i.test(value)) continue;
    refs.push({ value, line: lineOf(content, match.index) });
  }
  return refs;
}

function resolveReference(file, value) {
  const candidate = value.startsWith('/') ? path.join(root, value.slice(1)) : value.startsWith('docs/') || value.startsWith('apps/') || value.startsWith('packages/') || value.startsWith('supabase/') || value.startsWith('scripts/') ? path.join(root, value) : path.resolve(path.dirname(file), value);
  return path.normalize(candidate);
}

function relatedItems(content) {
  const code = [...content.matchAll(/`((?:apps|packages|supabase|scripts|tests)\/[A-Za-z0-9_./:-]+)`/g)].map((match) => match[1]);
  const routes = [...content.matchAll(/`(\/(?:admin|support|help|portal|internal-actions)[A-Za-z0-9_/:.?-]*)`/g)].map((match) => match[1]);
  const database = [...content.matchAll(/\b((?:rpc|vw)_[a-z0-9_]+)\b/gi)].map((match) => match[1]);
  return {
    code: [...new Set(code)].slice(0, 30),
    routes: [...new Set(routes)].slice(0, 30),
    database: [...new Set(database)].slice(0, 30)
  };
}

function securityFindings(file, content) {
  const checks = [
    ['jwt', /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, 'CRÍTICO'],
    ['secret-assignment', /\b[A-Z0-9_]*(?:SECRET|TOKEN|PRIVATE_KEY|API_KEY|SERVICE_ROLE)[A-Z0-9_]*\b\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{12,}/g, 'CRÍTICO'],
    ['signed-url', /https?:\/\/[^\s)]+(?:X-Amz-Signature|X-Amz-Credential|token=|signature=|signed)/gi, 'CRÍTICO'],
    ['sensitive-assignment', /\b(?:service[_-]?role|refresh[_-]?token|authorization|cookie)\b\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{12,}/gi, 'CRÍTICO']
  ];
  return checks.flatMap(([id, pattern, severity]) => {
    const matches = [...content.matchAll(pattern)];
    return matches.length ? [{ id, severity, file: relative(file), line: lineOf(content, matches[0].index), occurrences: matches.length, evidence: '[valor omitido]', blocksMergeOrRelease: severity === 'CRÍTICO' }] : [];
  });
}

function normalizeForComparison(content) {
  return content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/20\d{2}-\d{2}-\d{2}/g, '<date>')
    .replace(/\b\d+(?:[.,]\d+)?\b/g, '<number>')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(value) {
  return new Set(value.split(' ').filter((token) => token.length > 3));
}

function similarity(a, b) {
  const left = tokenSet(a);
  const right = tokenSet(b);
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / Math.max(1, left.size + right.size - intersection);
}

function collectDocuments(allFiles) {
  const packageScriptsMap = packageScripts();
  const documents = [];
  const byPath = new Map();
  for (const file of allFiles) {
    const content = readText(file);
    if (!content) continue;
    const rel = relative(file);
    const related = relatedItems(content);
    const metadata = gitMetadata(file);
    const document = {
      path: rel,
      title: titleFor(content, file),
      domain: inferDomain(file, content),
      type: inferType(file, content),
      status: inferStatus(file, content),
      declaredDates: findDates(content),
      lastChangedAt: metadata.lastChangedAt,
      sourceCommit: metadata.sourceCommit,
      canonicalFor: [],
      supersedes: [],
      supersededBy: [],
      relatedCode: related.code,
      relatedRoutes: related.routes,
      relatedDatabaseObjects: related.database,
      owner: content.match(/\b(?:owner|respons[aá]vel)\s*:\s*([^\n]+)/i)?.[1]?.trim() ?? null,
      audience: content.match(/\b(?:audience|audi[eê]ncia)\s*:\s*([^\n]+)/i)?.[1]?.trim() ? [content.match(/\b(?:audience|audi[eê]ncia)\s*:\s*([^\n]+)/i)[1].trim()] : [],
      sensitivity: /public|p[uú]blico/i.test(content) && !/internal|interno|restricted|restrito/i.test(content) ? 'public' : 'internal',
      inboundReferences: [],
      outboundReferences: extractRefs(content).map((ref) => ref.value),
      _content: content,
      _normalized: normalizeForComparison(content),
      _hash: createHash('sha256').update(content).digest('hex'),
      _scriptNames: Object.keys(packageScriptsMap)
    };
    byPath.set(rel, document);
    documents.push(document);
  }
  for (const document of documents) {
    const file = path.join(root, document.path);
    for (const ref of extractRefs(document._content)) {
      const destination = resolveReference(file, ref.value);
      const destinationRel = safePath(destination) ? relative(destination) : null;
      const targetDocument = destinationRel ? byPath.get(destinationRel) : null;
      if (targetDocument) targetDocument.inboundReferences.push(document.path);
    }
    delete document._content;
    delete document._normalized;
    delete document._hash;
    delete document._scriptNames;
  }
  return { documents, byPath };
}

function buildAnalysis(files) {
  const rawDocuments = [];
  const contentByPath = new Map();
  const hashByPath = new Map();
  for (const file of files) {
    const content = readText(file);
    if (!content) continue;
    rawDocuments.push({ file, content, path: relative(file), normalized: normalizeForComparison(content), hash: createHash('sha256').update(content).digest('hex') });
    contentByPath.set(relative(file), content);
    hashByPath.set(relative(file), createHash('sha256').update(content).digest('hex'));
  }
  const { documents, byPath } = collectDocuments(files);
  const brokenLinks = [];
  const drift = [];
  const securityFindings = [];
  const scripts = packageScripts();
  const codeFiles = walk(root, codeExtensions);
  const codeByPath = new Map(codeFiles.map((file) => [relative(file), readText(file)]));
  const codeText = [...codeByPath.values()].join('\n');
  for (const item of rawDocuments) {
    const file = item.file;
    for (const ref of extractRefs(item.content)) {
      const destination = resolveReference(file, ref.value);
      if (safePath(destination) && !fs.existsSync(destination)) brokenLinks.push({ file: item.path, line: ref.line, target: ref.value, severity: 'MÉDIO', confidence: 'alta', recommendation: 'corrigir o link ou marcar explicitamente o destino histórico' });
    }
    for (const match of item.content.matchAll(/\b(?:npm run)\s+([a-z0-9:_-]+)/gi)) {
      if (!scripts[match[1]]) drift.push({ type: 'command-not-found', file: item.path, line: lineOf(item.content, match.index), evidence: `npm run ${match[1]}`, impact: 'comando documentado não existe no package.json atual', severity: 'ALTO', confidence: 'alta', possibleFalsePositive: false, blocksMergeOrRelease: false });
    }
    for (const match of item.content.matchAll(/`((?:apps|packages|supabase|scripts|tests)\/[A-Za-z0-9_./:-]+)`/g)) {
      if (!fs.existsSync(path.join(root, match[1]))) drift.push({ type: 'path-not-found', file: item.path, line: lineOf(item.content, match.index), evidence: match[1], impact: 'caminho citado não existe no checkout', severity: 'MÉDIO', confidence: 'alta', possibleFalsePositive: false });
    }
    for (const match of item.content.matchAll(/\b((?:rpc|vw)_[a-z0-9_]+)\b/gi)) {
      if (!codeText.includes(match[1])) drift.push({ type: 'database-object-not-found', file: item.path, line: lineOf(item.content, match.index), evidence: match[1], impact: 'objeto de banco citado não foi encontrado no código/schema local', severity: 'MÉDIO', confidence: 'baixa', possibleFalsePositive: true, blocksMergeOrRelease: false });
    }
    securityFindings.push(...securityFindingsFor(item.file, item.content));
  }
  return { rawDocuments, documents, byPath, brokenLinks, drift, securityFindings, codeFiles, codeByPath, hashByPath, contentByPath };
}

function securityFindingsFor(file, content) {
  return securityFindings(file, content);
}

function exactDuplicates(rawDocuments) {
  const groups = new Map();
  for (const item of rawDocuments) {
    const list = groups.get(item.hash) ?? [];
    list.push(item.path);
    groups.set(item.hash, list);
  }
  return [...groups.values()].filter((paths) => paths.length > 1).map((paths) => ({ type: 'exact', documents: paths, severity: 'MÉDIO', confidence: 'alta', possibleFalsePositive: false, recommendation: 'confirmar fonte canônica; preservar histórico e substituir cópia por referência' }));
}

function semanticDuplicates(rawDocuments) {
  const candidates = [];
  const eligible = rawDocuments.filter((item) => item.normalized.split(' ').length >= 80);
  for (let index = 0; index < eligible.length && candidates.length < 100; index += 1) {
    for (let next = index + 1; next < eligible.length && candidates.length < 100; next += 1) {
      const left = eligible[index];
      const right = eligible[next];
      if (left.hash === right.hash) continue;
      const score = similarity(left.normalized, right.normalized);
      if (score >= 0.9) candidates.push({ type: 'semantic-candidate', documents: [left.path, right.path], similarity: Number(score.toFixed(3)), severity: 'MÉDIO', confidence: 'baixa', possibleFalsePositive: true, recommendation: 'comparar finalidade, status e histórico antes de consolidar' });
    }
  }
  return candidates;
}

function contradictionCandidates(documents, contentByPath) {
  const candidates = [];
  const topics = [
    ['release-status', /(?:publicad[oa]|pront[oa]|ativ[oa]|bloquead[oa]|fora do escopo|n[aã]o existe)/i],
    ['integration-status', /(?:hubspot|omie|integra[çc][aã]o).*(?:pront[oa]|ativ[oa]|bloquead[oa]|fixture|cache|pendente)/i],
    ['branch-or-head', /\b(?:branch|HEAD|checkout)\b/i]
  ];
  const candidatesDocs = documents.filter((document) => ['CANONICAL', 'CURRENT', 'UNKNOWN'].includes(document.status));
  for (let index = 0; index < candidatesDocs.length && candidates.length < 100; index += 1) {
    for (let next = index + 1; next < candidatesDocs.length && candidates.length < 100; next += 1) {
      const left = candidatesDocs[index];
      const right = candidatesDocs[next];
      if (left.domain !== right.domain) continue;
      const leftText = contentByPath.get(left.path) ?? '';
      const rightText = contentByPath.get(right.path) ?? '';
      for (const [topic, pattern] of topics) {
        if (!pattern.test(leftText) || !pattern.test(rightText)) continue;
        const leftPositive = /pront[oa]|publicad[oa]|ativ[oa]|existe/i.test(leftText);
        const rightPositive = /pront[oa]|publicad[oa]|ativ[oa]|existe/i.test(rightText);
        const leftNegative = /bloquead[oa]|fora do escopo|n[aã]o existe|pendente/i.test(leftText);
        const rightNegative = /bloquead[oa]|fora do escopo|n[aã]o existe|pendente/i.test(rightText);
        if ((leftPositive && rightNegative) || (leftNegative && rightPositive)) {
          candidates.push({ topic, documents: [left.path, right.path], domain: left.domain, severity: 'ALTO', confidence: 'baixa', possibleFalsePositive: true, evidence: 'afirmações de estado opostas; revisar datas/commits e contratos', decisionRequired: true });
        }
      }
    }
  }
  return candidates;
}

function missingDocumentation(gitInfo) {
  const changed = gitInfo.changedFiles.filter((file) => !file.startsWith('.agents/skills/'));
  const codeChanged = changed.filter((file) => codeExtensions.has(path.extname(file).toLowerCase()) || /^(supabase\/migrations|supabase\/functions)\//.test(file));
  const docsChanged = changed.some((file) => docExtensions.has(path.extname(file).toLowerCase()) || /^(AGENTS|CLAUDE)\.md$/i.test(file));
  if (codeChanged.length && !docsChanged) return [{ type: 'missing-proportional-doc', changedFiles: codeChanged.slice(0, 30), recommendation: 'revisar docs de área, PROJECT_STATE e DOCUMENTATION_LEDGER conforme o impacto', severity: 'MÉDIO', confidence: 'média', possibleFalsePositive: true }];
  return [];
}

function scheduledDelta(report, documents) {
  if (!baselinePath) return [{ type: 'missing-baseline', recommendation: 'fornecer --baseline com relatório JSON anterior para comparar novas/resolvidas divergências', severity: 'INFORMATIVO' }];
  try {
    const previous = JSON.parse(readText(path.resolve(root, baselinePath)));
    const previousMap = new Map((previous.documents ?? []).map((document) => [document.path, document.sourceCommit]));
    const currentMap = new Map(documents.map((document) => [document.path, document.sourceCommit]));
    return [
      ...documents.filter((document) => !previousMap.has(document.path)).map((document) => ({ type: 'new-document', path: document.path, severity: 'INFORMATIVO' })),
      ...[...previousMap.keys()].filter((file) => !currentMap.has(file)).map((file) => ({ type: 'removed-document', path: file, severity: 'MÉDIO' }))
    ];
  } catch {
    return [{ type: 'invalid-baseline', recommendation: 'não foi possível ler o baseline JSON; não afirmar delta', severity: 'MÉDIO' }];
  }
}

function publicDocument(document) {
  const copy = { ...document };
  delete copy._content;
  return copy;
}

function markdown(report) {
  const lines = [
    '# Auditoria de Governança Documental', '',
    '## 1. Resumo executivo',
    `- Escopo: ${report.summary.scope}`,
    `- Risco: ${report.summary.risk}`,
    `- Documentos analisados: ${report.summary.documentsAnalyzed}`,
    `- Bloqueadores: ${report.summary.blockers}`,
    '', '## 2. Estado Git',
    `- Branch: ${report.git.branch}`, `- HEAD: ${report.git.head}`, `- Base: ${report.git.base ?? 'não resolvida'}`, `- Diff check: ${report.git.diffCheck}`, `- Arquivos analisados: ${report.git.changedFiles.length} alterados/novos`,
    '', '## 3. Mapa documental',
    `- Canônicos: ${report.map.canonical.length}`, `- Históricos: ${report.map.historical.length}`, `- Sem classificação: ${report.map.unknown.length}`,
    ...report.map.canonical.slice(0, 20).map((document) => `- [CANONICAL] ${document.path} — ${document.title}`),
    '', '## 4. Divergências com o código',
    ...(report.drift.slice(0, 30).map((finding) => `- [${finding.severity}] ${finding.file}:${finding.line ?? '-'} — ${finding.impact ?? finding.evidence}`) || ['- Nenhuma.']),
    '', '## 5. Contradições',
    ...(report.conflicts.slice(0, 30).map((finding) => `- [${finding.severity}] ${finding.documents.join(' <> ')} — ${finding.evidence ?? 'revisar afirmações opostas'}`) || ['- Nenhuma confirmada; candidatos devem ser revisados semanticamente.']),
    '', '## 6. Duplicações',
    ...(report.duplicates.slice(0, 30).map((finding) => `- [${finding.type}] ${finding.documents.join(' <> ')} — confiança ${finding.confidence}`) || ['- Nenhuma candidata encontrada.']),
    '', '## 7. Documentação ausente',
    ...(report.missingDocumentation.map((finding) => `- [${finding.severity}] ${finding.recommendation}`) || ['- Nenhum gap automático confirmado.']),
    '', '## 8. Links e referências',
    ...(report.brokenLinks.slice(0, 30).map((finding) => `- [${finding.severity}] ${finding.file}:${finding.line} → ${finding.target}`) || ['- Nenhum link quebrado.']),
    '', '## 9. Segurança documental',
    ...(report.securityFindings.slice(0, 30).map((finding) => `- [${finding.severity}] ${finding.file}:${finding.line} — ${finding.id}; valor omitido`) || ['- Nenhum candidato encontrado.']),
    '', '## 10. Plano de reconciliação',
    ...report.proposedActions.slice(0, 30).map((action) => `- ${action}`),
    '', '## 11. Alterações propostas',
    `- ${report.applyPlan ? 'Plano APPLY gerado; nenhuma escrita realizada.' : 'Nenhuma alteração realizada no modo read-only.'}`,
    '', '## 12. Veredito',
    `- ${report.verdict}`,
    '', 'Limitações:', ...report.limitations.map((limitation) => `- ${limitation}`)
  ];
  return `${lines.join('\n')}\n`;
}

if (!validModes.has(mode) || (mode === 'domain' && !target)) {
  console.error('Uso: fast | changed | domain <domínio> | full | apply <relatório> | scheduled [--baseline arquivo.json] [--json] [--strict]');
  process.exit(2);
}

const gitInfo = gitState();
const allDocumentFiles = walk(root, docExtensions).filter((file) => !relative(file).startsWith('.agents/'));
const codeFiles = walk(root, codeExtensions);
const changedPathsForScope = new Set(gitInfo.changedFiles);
function applyDocumentFiles() {
  if (!target) return allDocumentFiles;
  const absoluteTarget = path.resolve(root, target);
  if (fs.existsSync(absoluteTarget) && docExtensions.has(path.extname(absoluteTarget).toLowerCase())) return allDocumentFiles.filter((file) => path.normalize(file) === path.normalize(absoluteTarget));
  if (fs.existsSync(absoluteTarget) && path.extname(absoluteTarget).toLowerCase() === '.json') {
    try {
      const approved = JSON.parse(readText(absoluteTarget));
      const approvedPaths = new Set((approved.documents ?? []).map((document) => document.path).concat(approved.proposedActions?.flatMap((action) => action.files ?? []) ?? []));
      return allDocumentFiles.filter((file) => approvedPaths.has(relative(file)));
    } catch {
      return [];
    }
  }
  return [];
}
const documentFilesForScope = mode === 'domain'
  ? allDocumentFiles.filter((file) => `${relative(file)} ${titleFor(readText(file), file)} ${inferDomain(file, readText(file))}`.toLowerCase().includes(target.toLowerCase()))
  : mode === 'changed'
    ? allDocumentFiles.filter((file) => {
        const rel = relative(file);
        const stemMatch = [...changedPathsForScope].some((changedFile) => rel.toLowerCase().includes(path.basename(changedFile, path.extname(changedFile)).toLowerCase()));
        return changedPathsForScope.has(rel) || stemMatch;
      })
    : mode === 'apply'
      ? applyDocumentFiles()
      : allDocumentFiles;
const analysis = buildAnalysis(documentFilesForScope);
let documents = analysis.documents;
let documentPaths = new Set(allDocumentFiles.map((file) => relative(file)));
if (mode === 'domain') {
  const needle = target.toLowerCase();
  documents = documents.filter((document) => `${document.path} ${document.title} ${document.domain}`.toLowerCase().includes(needle));
  documentPaths = new Set(documents.map((document) => document.path));
}
if (mode === 'changed') {
  const changed = gitInfo.changedFiles;
  documents = documents.filter((document) => changed.includes(document.path) || changed.some((file) => document.path.toLowerCase().includes(path.basename(file, path.extname(file)).toLowerCase())));
  documentPaths = new Set(documents.map((document) => document.path));
}

if (['fast', 'changed', 'domain', 'full', 'scheduled'].includes(mode)) runSafeCommand(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'documentation:validate:internal-docs']);
const selectedRawDocuments = analysis.rawDocuments.filter((item) => documentPaths.has(item.path));
const selectedPaths = new Set(selectedRawDocuments.map((item) => item.path));
const duplicates = [...exactDuplicates(selectedRawDocuments), ...(['full', 'domain', 'apply'].includes(mode) ? semanticDuplicates(selectedRawDocuments) : [])];
const conflicts = ['changed', 'full', 'domain', 'apply'].includes(mode) ? contradictionCandidates(documents, new Map(selectedRawDocuments.map((item) => [item.path, item.content]))) : [];
const drift = analysis.drift.filter((finding) => selectedPaths.has(finding.file));
const brokenLinks = analysis.brokenLinks.filter((finding) => selectedPaths.has(finding.file));
const security = analysis.securityFindings.filter((finding) => selectedPaths.has(finding.file));
const missing = mode === 'changed' ? missingDocumentation(gitInfo) : [];
const scheduled = mode === 'scheduled' ? scheduledDelta(null, documents) : [];
const limitFindings = (items) => items.slice(0, 40);
const limitedDrift = limitFindings(drift);
const limitedConflicts = limitFindings(conflicts);
const limitedDuplicates = limitFindings(duplicates);
const limitedMissing = limitFindings(missing);
const limitedBrokenLinks = limitFindings(brokenLinks);
const limitedSecurity = limitFindings(security);
const limitedScheduled = limitFindings(scheduled);
const blockers = [...limitedDrift, ...limitedConflicts, ...limitedSecurity, ...limitedBrokenLinks].filter((finding) => finding.blocksMergeOrRelease === true).length;
const findingsCount = limitedDrift.length + limitedConflicts.length + limitedDuplicates.length + limitedMissing.length + limitedBrokenLinks.length + limitedSecurity.length + limitedScheduled.length;
const map = {
  canonical: documents.filter((document) => ['CANONICAL', 'CURRENT'].includes(document.status)).map(publicDocument),
  historical: documents.filter((document) => ['HISTORICAL', 'SUPERSEDED', 'ARCHIVED'].includes(document.status)).map(publicDocument),
  unknown: documents.filter((document) => document.status === 'UNKNOWN').map(publicDocument)
};
const proposedActions = [
  ...(brokenLinks.length ? ['corrigir ou classificar links quebrados após confirmar a fonte substituta'] : []),
  ...(duplicates.length ? ['revisar pares duplicados, preservando snapshots históricos e escolhendo uma única fonte canônica'] : []),
  ...(conflicts.length ? ['revisar contradições com datas/commits e decisão do Product Owner quando necessário'] : []),
  ...(drift.length ? ['confirmar drift contra código/contratos e atualizar documentação proporcional no mesmo lote'] : []),
  ...(missing.length ? ['criar/atualizar documentação de área, PROJECT_STATE e ledger conforme o impacto'] : []),
  ...(security.length ? ['redigir e tratar qualquer exposição sensível sem reproduzir o valor'] : [])
];
const applyPlan = mode === 'apply' ? { approvedInput: target ?? null, requiresExplicitApproval: true, writesPerformed: false, proposedActions } : null;
const report = {
  summary: { mode, scope: target ?? (mode === 'changed' ? 'working tree changes' : 'repository'), risk: blockers ? 'alto' : findingsCount ? 'médio' : 'a avaliar', documentsAnalyzed: documents.length, blockers },
  documents: documents.map(publicDocument),
  map,
  conflicts: limitedConflicts,
  duplicates: limitedDuplicates,
  drift: limitedDrift,
  missingDocumentation: limitedMissing,
  brokenLinks: limitedBrokenLinks,
  securityFindings: limitedSecurity,
  proposedActions,
  applyPlan,
  scheduledDelta: limitedScheduled,
  commands,
  git: gitInfo,
  metrics: { documents: documents.length, codeFiles: codeFiles.length, exactDuplicateGroups: limitedDuplicates.filter((item) => item.type === 'exact').length, semanticCandidates: limitedDuplicates.filter((item) => item.type === 'semantic-candidate').length, conflicts: limitedConflicts.length, drift: limitedDrift.length, brokenLinks: limitedBrokenLinks.length, securityFindings: limitedSecurity.length },
  limitations: [
    'Status e tipo são inferidos por caminho/cabeçalho e exigem revisão humana.',
    'Duplicação semântica e contradições são candidatos heurísticos, não decisões automáticas.',
    'O auditor não abre .env, não reproduz valores sensíveis e não acessa banco, navegador, sync, produção ou serviços externos.',
    ...(mode === 'scheduled' && !baselinePath ? ['Nenhum baseline JSON foi fornecido para comparação temporal.'] : []),
    'Achados automáticos são limitados a 40 por categoria para preservar legibilidade; o inventário completo permanece disponível por escopo mais restrito.',
    ...(mode === 'apply' ? ['Modo APPLY apenas produziu plano; nenhuma escrita foi executada.'] : [])
  ],
  verdict: blockers ? 'inconsistente' : findingsCount ? 'consistente com ressalvas' : 'consistente'
};

if (asJson) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
else process.stdout.write(markdown(report));
process.exitCode = strict && blockers ? 1 : 0;
