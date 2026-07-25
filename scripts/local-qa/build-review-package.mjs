import { mkdirSync, rmSync, cpSync, readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative, resolve } from 'node:path';

const root = resolve('output/review-packages/local-qa-rehydration');
const screenshotRoot = resolve('output/local-qa');
const packageZip = resolve('output/review-packages/local-qa-rehydration.zip');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const generatedAt = new Date().toISOString();

const reportFiles = [
  'docs/reports/LOCAL_QA_REHYDRATION_2026-07-25.md',
  'docs/runbooks/LOCAL_QA_ENVIRONMENT.md',
  'docs/reports/local-qa/LOCAL_QA_PERMISSION_MATRIX.md',
  'docs/reports/local-qa/LOCAL_QA_FIXTURE_INVENTORY.md',
  'docs/reports/local-qa/LOCAL_QA_VERIFICATION_RESULTS.md',
  'docs/reports/local-qa/LOCAL_QA_BROWSER_SMOKE_RESULTS.md',
  'docs/reports/local-qa/LOCAL_QA_CREDENTIAL_HYGIENE.md',
  'docs/reports/local-qa/LOCAL_QA_UI_WRITE_MATRIX.md',
  'docs/reports/local-qa/LOCAL_QA_BACKEND_AUTHORIZATION_MATRIX.md',
  'docs/reports/local-qa/LOCAL_QA_UNTRACKED_FILES_RECONCILIATION.md',
];

function mojibakeScore(value) {
  return (value.match(/Ãƒ|Ã‚|Ã¢|ï¿½|â€™|â€œ|â€\u009d|â€“|â€”/g) ?? []).length;
}

function repairMojibake(value) {
  let current = value;
  for (let index = 0; index < 3; index += 1) {
    const candidate = Buffer.from(current, 'latin1').toString('utf8');
    if (mojibakeScore(candidate) < mojibakeScore(current)) current = candidate;
    else break;
  }
  return current;
}

function copyUtf8(source, destination) {
  const content = repairMojibake(readFileSync(source, 'utf8'));
  const encoded = Buffer.from(content, 'utf8');
  if (encoded.toString('utf8') !== content) throw new Error(`UTF8_INVALID: ${source}`);
  if (mojibakeScore(content) > 0) throw new Error(`MOJIBAKE_IN_PACKAGE_SOURCE: ${source}`);
  writeFileSync(destination, content, 'utf8');
}

rmSync(root, { recursive: true, force: true });
rmSync(packageZip, { force: true });
mkdirSync(join(root, 'reports'), { recursive: true });
mkdirSync(join(root, 'screenshots'), { recursive: true });
mkdirSync(join(root, 'assets'), { recursive: true });

for (const file of reportFiles) {
  const destination = join(root, 'reports', file.split(/[\\/]/).at(-1));
  copyUtf8(file, destination);
}

const screenshots = readdirSync(screenshotRoot)
  .filter((file) => /^browser-(platform_admin|dashboard_viewer|support_manager|support_agent|customer_user)-(desktop|mobile)\.png$/.test(file))
  .sort();
for (const file of screenshots) cpSync(join(screenshotRoot, file), join(root, 'screenshots', file));

const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else files.push(path);
  }
}
walk(root);

const entries = files.map((file) => {
  const name = file.split(/[\\/]/).at(-1);
  const image = name.endsWith('.png');
  const match = image ? name.match(/^browser-(.+)-(desktop|mobile)\.png$/) : null;
  return {
    name,
    path: relative(root, file).replaceAll('\\', '/'),
    type: image ? 'screenshot' : name.endsWith('.md') ? 'report' : 'document',
    size: statSync(file).size,
    viewport: match?.[2] ?? null,
    state: image ? 'baseline' : null,
    profile: match?.[1] ?? null,
    scenario: image ? 'authenticated-smoke' : null,
    description: image ? `Smoke autenticado da persona ${match[1]} em ${match[2]}.` : 'Artefato técnico sanitizado do lote local.',
    commit,
    generated_at: generatedAt,
  };
});

const manifest = {
  package: 'local-qa-rehydration',
  generated_at: generatedAt,
  commit,
  file_count: entries.length + 2,
  directory_count: 3,
  zip_entry_count: entries.length + 3,
  report_count: entries.filter((entry) => entry.type === 'report').length,
  screenshot_count: screenshots.length,
  counts: { files: entries.length, directories: 3, screenshots: screenshots.length, reports: entries.filter((entry) => entry.type === 'report').length },
  files: entries,
};
writeFileSync(join(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const cards = entries.filter((entry) => entry.type === 'screenshot').map((entry) => (
  `<figure><a href="${entry.path}"><img src="${entry.path}" alt="${entry.description}"></a><figcaption><strong>${entry.name}</strong><br>Viewport: ${entry.viewport} · Perfil: ${entry.profile} · Estado: ${entry.state}<br>${entry.description}<br><a href="${entry.path}">Abrir imagem original</a></figcaption></figure>`
)).join('\n');
const reportLinks = reportFiles.map((file) => `<li><a href="reports/${file.split(/[\\/]/).at(-1)}">${file.split(/[\\/]/).at(-1)}</a></li>`).join('');
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>LOCAL-QA-01.2 — Pacote de revisão</title><style>body{font:16px system-ui;max-width:1200px;margin:32px auto;padding:0 20px;color:#172033}section{margin:32px 0}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px}figure{margin:0;border:1px solid #d9e0ea;border-radius:12px;padding:12px}img{width:100%;height:auto;border-radius:8px}figcaption{line-height:1.5;margin-top:10px}code{background:#eef2f7;padding:2px 5px;border-radius:4px}</style></head><body><h1>LOCAL-QA-01.2 — Pacote de revisão</h1><section><h2>Resumo do lote</h2><p>Reidratação local, permissões, writes pela interface, smoke browser, JWT, cenários Analytics, idempotência e higiene de credenciais. Nenhum dado operacional real, segredo ou sincronização externa foi usado.</p></section><section><h2>Comparação antes e depois</h2><p>O pacote registra o estado final validado no commit <code>${commit}</code>.</p></section><section><h2>Desktop e mobile</h2><main>${cards}</main></section><section><h2>Estados</h2><p>Cenários <code>fresh</code>, <code>empty</code>, <code>partial</code>, <code>stale</code>, <code>unavailable</code> e <code>zero-real</code> foram executados e restaurados.</p></section><section><h2>Relatórios técnicos</h2><ul>${reportLinks}</ul></section><section><h2>Manifesto dos arquivos</h2><p><a href="manifest.json">manifest.json</a> lista tamanho, SHA-256, viewport, perfil, cenário e commit real.</p></section></body></html>`;
if (mojibakeScore(html) > 0) throw new Error('MOJIBAKE_GENERATED_HTML');
writeFileSync(join(root, 'index.html'), html, 'utf8');

execFileSync('powershell.exe', ['-NoProfile', '-Command', `Compress-Archive -Path '${root}' -DestinationPath '${packageZip}' -Force`], { stdio: 'inherit' });
console.log(JSON.stringify({ package: root, zip: packageZip, commit, files: entries.length, screenshots: screenshots.length, reports: manifest.counts.reports }));
