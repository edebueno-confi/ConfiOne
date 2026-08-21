#!/usr/bin/env node
/**
 * Quality gates objetivos do ConfiOne.
 *
 * Executa verificacoes deterministicas sobre documentacao, contratos backend,
 * cobertura de teste e higiene de QA. O gate compara o resultado atual com
 * `.review/baseline.json` e falha apenas em REGRESSAO: achado novo que nao
 * existia no debito congelado. Isso permite adotar o gate imediatamente sem
 * enfraquecer nenhuma verificacao e sem bloquear trabalho legado.
 *
 * O gate NUNCA remove, move ou altera arquivo do produto. Ele apenas le e
 * relata. `--update-baseline` grava exclusivamente `.review/baseline.json`.
 *
 * Uso:
 *   node scripts/review/quality-gates.mjs
 *   node scripts/review/quality-gates.mjs --json
 *   node scripts/review/quality-gates.mjs --gate=RLS_WITHOUT_POLICY
 *   node scripts/review/quality-gates.mjs --update-baseline
 */
import { readdirSync, readFileSync, existsSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const reviewDir = join(root, '.review');
const baselinePath = join(reviewDir, 'baseline.json');
const allowlistPath = join(reviewDir, 'rls-deny-all-allowlist.json');
const args = process.argv.slice(2);
const asJson = args.includes('--json');
const updateBaseline = args.includes('--update-baseline');
const onlyGate = (args.find((a) => a.startsWith('--gate=')) ?? '').slice('--gate='.length) || null;

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'output', '.tmp', '.worktrees', 'coverage', 'raw_knowledge',
]);
const rel = (p) => relative(root, p).split('\\').join('/');
const read = (p) => readFileSync(p, 'utf8');

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

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
  return null;
}

const gitBin = resolveGitBin();
function git(argv) {
  if (!gitBin) return null;
  try {
    return execFileSync(gitBin, argv, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
}

const files = walk(root);
const mdFiles = files.filter((f) => f.toLowerCase().endsWith('.md'));
const migrationFiles = files.filter((f) => rel(f).startsWith('supabase/migrations/') && f.endsWith('.sql'));
const pgtapFiles = files.filter((f) => rel(f).startsWith('supabase/tests/') && f.endsWith('.sql'));
const webFiles = files.filter((f) => rel(f).startsWith('apps/web/src/') && /\.(ts|tsx)$/.test(f));
const qaFiles = files.filter((f) => rel(f).startsWith('scripts/local-qa/') && f.endsWith('.mjs'));

const migrationText = migrationFiles.map(read).join('\n');
const pgtapText = pgtapFiles.map(read).join('\n');
const consumerText = files
  .filter((f) => /\.(ts|tsx|mjs|js|sql)$/.test(f))
  .filter((f) => {
    const r = rel(f);
    return r.startsWith('apps/') || r.startsWith('packages/') || r.startsWith('scripts/') ||
      r.startsWith('supabase/functions/') || r.startsWith('supabase/tests/') || r.startsWith('tests/');
  })
  .map(read)
  .join('\n');

const uniq = (values) => [...new Set(values)].sort();
const collect = (text, regex, pick) => uniq([...text.matchAll(regex)].map(pick));

// ------------------------------------------------------------------ inventario
const rpcNames = collect(migrationText, /create\s+(?:or\s+replace\s+)?function\s+public\.(rpc_[a-z0-9_]+)/gi, (m) => m[1]);
const viewNames = collect(migrationText, /create\s+(?:or\s+replace\s+)?view\s+(?:public\.)?(vw_[a-z0-9_]+)/gi, (m) => m[1]);
const rlsTables = collect(migrationText, /alter\s+table\s+(?:public\.)?([a-z0-9_]+)\s+enable\s+row\s+level\s+security/gi, (m) => m[1]);
const policyTables = collect(migrationText, /create\s+policy\s+"?[^"\n]+"?\s+on\s+(?:public\.)?([a-z0-9_]+)/gi, (m) => m[1]);
const untracked = (git(['ls-files', '--others', '--exclude-standard']) ?? '')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);
const denyAllAllowlist = existsSync(allowlistPath)
  ? new Set(JSON.parse(read(allowlistPath)).tables ?? [])
  : new Set();

// --------------------------------------------------------------------- gates
const gates = [];
const addGate = (gate) => {
  if (!onlyGate || onlyGate === gate.id) gates.push(gate);
};

// 1. Links relativos de markdown que nao resolvem em arquivo existente.
{
  const findings = [];
  const linkRe = /\[[^\]]*\]\(([^)#\s]+)(?:#[^)\s]*)?\)/g;
  for (const file of mdFiles) {
    for (const match of read(file).matchAll(linkRe)) {
      const target = match[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue; // http:, mailto:, knowledge-asset: etc.
      if (target.startsWith('#')) continue;
      if (!existsSync(resolve(dirname(file), decodeURI(target)))) {
        findings.push({ key: `${rel(file)} -> ${target}`, detail: 'link relativo aponta para arquivo inexistente' });
      }
    }
  }
  addGate({ id: 'DOC_BROKEN_LINK', severity: 'major', title: 'Link de documentacao quebrado', findings });
}

// 2. Script npm apontando para arquivo inexistente.
{
  const pkg = JSON.parse(read(join(root, 'package.json')));
  const findings = [];
  for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
    for (const match of command.matchAll(/node\s+([\w\-./]+\.mjs)/g)) {
      if (!existsSync(join(root, match[1]))) {
        findings.push({ key: `${name} -> ${match[1]}`, detail: 'script npm referencia arquivo ausente' });
      }
    }
  }
  addGate({ id: 'NPM_SCRIPT_MISSING', severity: 'major', title: 'Script npm sem arquivo', findings });
}

// 3. RPC publica sem nenhuma mencao em pgTAP.
{
  const findings = rpcNames
    .filter((name) => !pgtapText.includes(name))
    .map((name) => ({ key: name, detail: 'RPC sem cobertura pgTAP' }));
  addGate({ id: 'PGTAP_MISSING_RPC', severity: 'major', title: 'RPC sem teste pgTAP', findings });
}

// 4. View publica sem nenhuma mencao em pgTAP.
{
  const findings = viewNames
    .filter((name) => !pgtapText.includes(name))
    .map((name) => ({ key: name, detail: 'view sem cobertura pgTAP' }));
  addGate({ id: 'PGTAP_MISSING_VIEW', severity: 'major', title: 'View sem teste pgTAP', findings });
}

// 5. Tabela com RLS habilitada, sem policy e sem declaracao de deny-all intencional.
{
  const findings = rlsTables
    .filter((table) => !policyTables.includes(table) && !denyAllAllowlist.has(table))
    .map((table) => ({
      key: table,
      detail: 'RLS habilitada sem policy; declare em .review/rls-deny-all-allowlist.json se o deny-all for intencional',
    }));
  addGate({ id: 'RLS_WITHOUT_POLICY', severity: 'blocker', title: 'RLS sem policy nem declaracao', findings });
}

// 6. Superficie backend pronta sem consumidor no repositorio.
//    ATENCAO: isto NAO significa codigo morto. O ConfiOne tem dominios
//    deliberadamente backend-only, aguardando release surface ou UI. O gate
//    apenas exige visibilidade; a decisao de publicar, cobrir ou aposentar e
//    humana e vive no roadmap.
{
  const findings = [...rpcNames, ...viewNames]
    .filter((name) => {
      const uses = consumerText.split(name).length - 1;
      return uses === 0;
    })
    .map((name) => ({ key: name, detail: 'objeto backend sem consumidor no repositorio (pendente de UI ou release)' }));
  addGate({ id: 'SURFACE_PENDING_UI', severity: 'info', title: 'Backend pronto sem consumidor', findings });
}

// 7. Estado React escrito e nunca lido: `const [, setX] = useState(...)`.
{
  const findings = [];
  for (const file of webFiles) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/const\s*\[\s*,\s*set[A-Z]\w*\s*\]\s*=\s*useState/.test(line)) {
        const setter = /set[A-Z]\w*/.exec(line)?.[0] ?? 'setter';
        findings.push({ key: `${rel(file)}:${setter}`, detail: `linha ${index + 1}: estado escrito e nunca lido` });
      }
    });
  }
  addGate({ id: 'FRONT_DISCARDED_STATE', severity: 'major', title: 'Estado React descartado', findings });
}

// 8. Catch vazio engolindo erro em codigo de produto ou QA.
{
  const findings = [];
  for (const file of [...webFiles, ...qaFiles]) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/catch\s*(\([^)]*\))?\s*\{\s*\}\s*$/.test(line)) {
        findings.push({ key: `${rel(file)}:${index + 1}`, detail: 'catch vazio sem comentario nem tratamento' });
      }
    });
  }
  addGate({ id: 'EMPTY_CATCH', severity: 'major', title: 'Catch vazio', findings });
}

// 9. pgTAP com asserção posicional sobre array jsonb (fragil a dados reais).
{
  const findings = [];
  for (const file of pgtapFiles) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/->\s*'[a-z_]+'\s*->\s*\d+/.test(line) || /->\s*\d+\s*->>/.test(line)) {
        findings.push({ key: `${rel(file)}:${index + 1}`, detail: 'assercao depende da posicao no array jsonb' });
      }
    });
  }
  addGate({ id: 'PGTAP_POSITIONAL_ASSERT', severity: 'major', title: 'pgTAP posicional', findings });
}

// 10. Smoke que assere contagem literal de dados locais.
{
  const findings = [];
  for (const file of qaFiles) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/includes\(\s*'\d{2,}'\s*\)/.test(line)) {
        findings.push({ key: `${rel(file)}:${index + 1}`, detail: 'smoke acoplado a contagem literal de dados' });
      }
    });
  }
  addGate({ id: 'QA_MAGIC_COUNT', severity: 'major', title: 'Smoke com contagem literal', findings });
}

// 11. Segredo aparente em arquivo nao rastreado (o secret-scan oficial le apenas tracked).
{
  const secretRe = /(sb_secret_[A-Za-z0-9_-]{8,}|eyJhbGciOi[A-Za-z0-9_.-]{20,}|pat-na1-[A-Za-z0-9-]{8,}|hapikey=[A-Za-z0-9-]{8,})/;
  const findings = [];
  for (const relPath of untracked) {
    const full = join(root, relPath);
    if (!existsSync(full) || statSync(full).isDirectory()) continue;
    if (!/\.(ts|tsx|mjs|js|json|sql|md|env|txt|ya?ml)$/i.test(relPath)) continue;
    const body = read(full);
    if (secretRe.test(body)) {
      findings.push({ key: relPath, detail: 'possivel segredo em arquivo nao rastreado' });
    }
  }
  addGate({ id: 'SECRET_IN_UNTRACKED', severity: 'blocker', title: 'Segredo em arquivo nao rastreado', findings });
}

// 12. Documento markdown gigante: inviabiliza revisao humana.
{
  const findings = mdFiles
    .filter((file) => statSync(file).size > 120 * 1024)
    .map((file) => ({ key: rel(file), detail: `${Math.round(statSync(file).size / 1024)}KB acima do limite de revisao humana` }));
  addGate({ id: 'DOC_OVERSIZE', severity: 'info', title: 'Documento acima de 120KB', findings });
}

// ------------------------------------------------------- comparacao com baseline
const baseline = existsSync(baselinePath) ? JSON.parse(read(baselinePath)) : { gates: {} };
const result = {
  generatedAt: new Date().toISOString(),
  baselineExists: existsSync(baselinePath),
  gates: [],
  regressions: 0,
  resolved: 0,
};

for (const gate of gates) {
  const known = new Set(baseline.gates?.[gate.id]?.keys ?? []);
  const current = gate.findings.map((f) => f.key);
  const currentSet = new Set(current);
  const isNew = gate.findings.filter((f) => !known.has(f.key));
  const fixed = [...known].filter((key) => !currentSet.has(key));
  const blocking = gate.severity !== 'info' && isNew.length > 0;
  if (blocking) result.regressions += isNew.length;
  result.resolved += fixed.length;
  result.gates.push({
    id: gate.id,
    severity: gate.severity,
    title: gate.title,
    total: current.length,
    baseline: known.size,
    new: isNew,
    fixed,
    blocking,
  });
}

if (updateBaseline) {
  mkdirSync(reviewDir, { recursive: true });
  const payload = {
    updatedAt: new Date().toISOString(),
    note: 'Debito congelado. Reduzir por lote autorizado; nunca crescer. Atualize apenas quando um lote reduzir o numero.',
    gates: Object.fromEntries(gates.map((gate) => [gate.id, {
      severity: gate.severity,
      title: gate.title,
      count: gate.findings.length,
      keys: gate.findings.map((f) => f.key),
    }])),
  };
  writeFileSync(baselinePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`ConfiOne quality gates — ${result.generatedAt}`);
  console.log(`baseline: ${result.baselineExists ? rel(baselinePath) : 'ausente (rode --update-baseline para congelar o debito atual)'}`);
  console.log('');
  for (const gate of result.gates) {
    const status = gate.blocking ? 'REGRESSAO' : gate.new.length > 0 ? 'novo (info)' : 'ok';
    console.log(`[${gate.severity.toUpperCase().padEnd(7)}] ${gate.id.padEnd(24)} total=${String(gate.total).padStart(4)} baseline=${String(gate.baseline).padStart(4)} novos=${String(gate.new.length).padStart(3)} resolvidos=${String(gate.fixed.length).padStart(3)} ${status}`);
    for (const finding of gate.new.slice(0, 10)) {
      console.log(`            + ${finding.key} — ${finding.detail}`);
    }
    if (gate.new.length > 10) console.log(`            + ... e mais ${gate.new.length - 10}`);
  }
  console.log('');
  console.log(`regressoes bloqueantes: ${result.regressions}`);
  console.log(`itens do baseline resolvidos: ${result.resolved}`);
  if (!gitBin) console.log('aviso: binario git nao encontrado; o gate de segredo em arquivo nao rastreado foi pulado.');
}

// Ao congelar o debito o gate nao falha: a comparacao foi feita contra o
// baseline anterior, que acabou de ser substituido.
process.exit(!updateBaseline && result.regressions > 0 ? 1 : 0);
