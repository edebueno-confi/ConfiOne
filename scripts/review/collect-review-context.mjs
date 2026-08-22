#!/usr/bin/env node
/**
 * Monta o pacote de revisao de um lote do ConfiOne.
 *
 * Somente leitura sobre o produto. Escreve apenas dentro de `.review/context/`.
 * O objetivo e dar ao revisor um recorte deterministico do lote em vez de
 * varrer o repositorio inteiro a cada ciclo: diff, frentes tocadas, objetos de
 * banco alterados, cobertura pgTAP correspondente e resultado dos gates.
 *
 * Uso:
 *   node scripts/review/collect-review-context.mjs
 *   node scripts/review/collect-review-context.mjs --base=origin/main
 *   node scripts/review/collect-review-context.mjs --request=.review/inbox/meu-lote.json
 */
import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const reviewDir = join(root, '.review');
const contextDir = join(reviewDir, 'context');
const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const base = argValue('base', 'HEAD');
const requestPath = argValue('request', null);

function resolveGitBin() {
  const candidates = [process.env.CONFIONE_GIT_BIN, 'git', 'C:/Program Files/Git/cmd/git.exe'];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      execFileSync(candidate, ['--version'], { stdio: 'ignore' });
      return candidate;
    } catch {
      // candidato indisponivel: tenta o proximo
    }
  }
  throw new Error('git nao encontrado. Defina CONFIONE_GIT_BIN com o caminho do binario.');
}
const gitBin = resolveGitBin();
const git = (argv) => {
  try {
    return execFileSync(gitBin, argv, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trimEnd();
  } catch (error) {
    return `ERRO: ${error.message.split('\n')[0]}`;
  }
};

const FRONTS = [
  ['Support Workspace', [/^apps\/web\/src\/features\/support\//, /support/i]],
  ['Central de Clientes', [/^apps\/web\/src\/features\/tenants\//, /customer_(account_group|relationship)/i]],
  ['Customer Operations', [/customer_operations/i, /customer_migration/i]],
  ['HubSpot local', [/hubspot/i]],
  ['Analytics', [/^apps\/web\/src\/features\/analytics\//, /analytics/i]],
  ['Autenticacao', [/^apps\/web\/src\/features\/auth\//, /auth/i]],
  ['Navegacao e release surface', [/^apps\/web\/src\/features\/navigation\//, /release-surface/, /router\.tsx$/]],
  ['Contratos compartilhados', [/^packages\/contracts\//]],
  ['Backend Supabase', [/^supabase\//]],
  ['QA e testes', [/^tests\//, /^scripts\/local-qa\//]],
  ['Documentacao', [/\.md$/]],
];
const classify = (path) => {
  for (const [name, patterns] of FRONTS) {
    if (patterns.some((re) => re.test(path))) return name;
  }
  return 'Outros';
};

// ------------------------------------------------------------------ git state
const branch = git(['branch', '--show-current']);
const head = git(['rev-parse', 'HEAD']);
const statusRaw = git(['status', '--short', '--branch']);
const statusLines = statusRaw.split(/\r?\n/).filter(Boolean);
const changed = statusLines
  .filter((line) => !line.startsWith('##'))
  .map((line) => ({ state: line.slice(0, 2).trim(), path: line.slice(3).trim().replace(/^"|"$/g, '') }));
const diffStat = git(['diff', '--stat']);
const diffCheck = git(['diff', '--check']);
const baseDiffStat = base && base !== 'HEAD' ? git(['diff', '--stat', `${base}...HEAD`]) : null;

// arquivos untracked entram como diretorios em `git status`; expande.
const untrackedFiles = git(['ls-files', '--others', '--exclude-standard']).split(/\r?\n/).filter(Boolean);
const touched = [...new Set([...changed.map((c) => c.path).filter((p) => !p.endsWith('/')), ...untrackedFiles])].sort();

const byFront = new Map();
for (const path of touched) {
  const front = classify(path);
  if (!byFront.has(front)) byFront.set(front, []);
  byFront.get(front).push(path);
}

// ------------------------------------------------- objetos de banco do lote
const sqlTouched = touched.filter((p) => p.startsWith('supabase/migrations/') && p.endsWith('.sql'));
const testDir = join(root, 'supabase/tests');
const pgtapText = existsSync(testDir)
  ? readdirSync(testDir).filter((f) => f.endsWith('.sql')).map((f) => readFileSync(join(testDir, f), 'utf8')).join('\n')
  : '';
const dbObjects = [];
for (const path of sqlTouched) {
  const body = readFileSync(join(root, path), 'utf8');
  const grab = (regex, kind, index = 1) => {
    for (const match of body.matchAll(regex)) {
      dbObjects.push({ migration: path, kind, name: match[index], pgtap: pgtapText.includes(match[index]) });
    }
  };
  grab(/create\s+(?:or\s+replace\s+)?function\s+(?:public|app_private)\.([a-z0-9_]+)/gi, 'function');
  grab(/create\s+(?:or\s+replace\s+)?view\s+(?:public\.)?([a-z0-9_]+)/gi, 'view');
  grab(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z0-9_]+)/gi, 'table');
  grab(/create\s+policy\s+"?([^"\n]+?)"?\s+on\s+/gi, 'policy');
  grab(/grant\s+([a-z, ]+?)\s+on\s+/gi, 'grant');
  grab(/revoke\s+([a-z, ]+?)\s+on\s+/gi, 'revoke');
}

// ------------------------------------------------------------------- gates
let gates = null;
try {
  const raw = execFileSync(process.execPath, [join(root, 'scripts/review/quality-gates.mjs'), '--json'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  gates = JSON.parse(raw);
} catch (error) {
  // exit code 1 = regressao; a saida JSON ainda e valida.
  try {
    gates = JSON.parse(error.stdout ?? '{}');
  } catch {
    gates = { error: 'nao foi possivel executar quality-gates.mjs' };
  }
}

// ------------------------------------------------------------------- pedidos
const inboxDir = join(reviewDir, 'inbox');
const requests = [];
if (requestPath) {
  if (existsSync(join(root, requestPath))) requests.push(JSON.parse(readFileSync(join(root, requestPath), 'utf8')));
} else if (existsSync(inboxDir)) {
  for (const file of readdirSync(inboxDir).filter((f) => f.endsWith('.json'))) {
    try {
      requests.push({ _file: `.review/inbox/${file}`, ...JSON.parse(readFileSync(join(inboxDir, file), 'utf8')) });
    } catch (error) {
      requests.push({ _file: `.review/inbox/${file}`, _erro: `JSON invalido: ${error.message.split('\n')[0]}` });
    }
  }
}

// -------------------------------------------------------------------- saida
mkdirSync(contextDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const jsonPath = join(contextDir, `${stamp}.json`);
const mdPath = join(contextDir, `${stamp}.md`);
const payload = { generatedAt: new Date().toISOString(), branch, head, base, statusLines, touched, byFront: Object.fromEntries(byFront), dbObjects, gates, requests };
writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

const lines = [];
lines.push(`# Pacote de revisao — ${payload.generatedAt}`);
lines.push('');
lines.push(`- Branch: \`${branch}\``);
lines.push(`- HEAD: \`${head}\``);
lines.push(`- Base comparada: \`${base}\``);
lines.push(`- Entradas no worktree: ${changed.length} rastreadas/nao rastreadas, ${touched.length} arquivos expandidos`);
lines.push(`- \`git diff --check\`: ${diffCheck ? 'ATENCAO — ver saida' : 'limpo'}`);
lines.push('');
lines.push('## Pedidos de revisao pendentes');
if (requests.length === 0) lines.push('Nenhum pedido em `.review/inbox/`.');
for (const request of requests) {
  lines.push(`### ${request.lote ?? request._file ?? 'sem identificacao'}`);
  lines.push('```json');
  lines.push(JSON.stringify(request, null, 2));
  lines.push('```');
}
lines.push('');
lines.push('## Frentes tocadas');
for (const [front, paths] of [...byFront.entries()].sort((a, b) => b[1].length - a[1].length)) {
  lines.push(`### ${front} (${paths.length})`);
  for (const path of paths) lines.push(`- \`${path}\``);
}
lines.push('');
lines.push('## Objetos de banco alterados pelo lote');
if (dbObjects.length === 0) lines.push('Nenhuma migration no recorte.');
for (const object of dbObjects) {
  lines.push(`- [${object.kind}] \`${object.name}\` — ${object.migration} — pgTAP: ${object.pgtap ? 'sim' : 'NAO'}`);
}
lines.push('');
lines.push('## Quality gates');
if (gates?.gates) {
  lines.push('| gate | severidade | total | baseline | novos | resolvidos |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const gate of gates.gates) {
    lines.push(`| ${gate.id} | ${gate.severity} | ${gate.total} | ${gate.baseline} | ${gate.new.length} | ${gate.fixed.length} |`);
  }
  lines.push('');
  lines.push(`Regressoes bloqueantes: **${gates.regressions}**`);
} else {
  lines.push('Gates nao executados.');
}
lines.push('');
lines.push('## diff --stat (worktree)');
lines.push('```');
lines.push(diffStat || '(vazio)');
lines.push('```');
if (baseDiffStat) {
  lines.push(`## diff --stat (${base}...HEAD)`);
  lines.push('```');
  lines.push(baseDiffStat || '(vazio)');
  lines.push('```');
}
writeFileSync(mdPath, `${lines.join('\n')}\n`, 'utf8');

console.log(`pacote de revisao gerado:\n  ${relative(root, mdPath).split('\\').join('/')}\n  ${relative(root, jsonPath).split('\\').join('/')}`);
console.log(`frentes: ${[...byFront.keys()].join(', ') || 'nenhuma'}`);
console.log(`objetos de banco no lote: ${dbObjects.length} (sem pgTAP: ${dbObjects.filter((o) => !o.pgtap).length})`);
console.log(`regressoes de gate: ${gates?.regressions ?? 'n/d'}`);
