import { mkdirSync, rmSync, cpSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve('output/review-packages/local-qa-rehydration');
const screenshotRoot = resolve('output/local-qa');
rmSync(root, { recursive: true, force: true });
mkdirSync(join(root, 'reports'), { recursive: true });
mkdirSync(join(root, 'screenshots'), { recursive: true });
mkdirSync(join(root, 'assets'), { recursive: true });

const reportFiles = [
  'docs/reports/LOCAL_QA_REHYDRATION_2026-07-25.md',
  'docs/runbooks/LOCAL_QA_ENVIRONMENT.md',
  'docs/reports/local-qa/LOCAL_QA_PERMISSION_MATRIX.md',
  'docs/reports/local-qa/LOCAL_QA_FIXTURE_INVENTORY.md',
  'docs/reports/local-qa/LOCAL_QA_VERIFICATION_RESULTS.md',
  'docs/reports/local-qa/LOCAL_QA_BROWSER_SMOKE_RESULTS.md',
  'docs/reports/local-qa/LOCAL_QA_CREDENTIAL_HYGIENE.md',
];
for (const file of reportFiles) cpSync(file, join(root, 'reports', file.split(/[\\/]/).at(-1)));

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
const imageEntries = screenshots.map((file) => {
  const match = file.match(/^browser-(.+)-(desktop|mobile)\.png$/);
  return {
    name: file,
    path: `screenshots/${file}`,
    type: 'screenshot',
    size: statSync(join(root, 'screenshots', file)).size,
    viewport: match[2],
    state: 'baseline',
    profile: match[1],
    description: `Smoke autenticado da persona ${match[1]} em ${match[2]}.`,
    commit: 'working-tree-local-qa',
    generated_at: new Date().toISOString(),
  };
});
const manifest = {
  package: 'local-qa-rehydration',
  generated_at: new Date().toISOString(),
  files: [
    ...files.filter((file) => !file.endsWith('.png')).map((file) => ({
      name: file.split(/[\\/]/).at(-1),
      path: relative(root, file).replaceAll('\\', '/'),
      type: file.endsWith('.md') ? 'report' : 'document',
      size: statSync(file).size,
      viewport: null,
      state: null,
      profile: null,
      description: 'Artefato técnico sanitizado do lote local.',
      commit: 'working-tree-local-qa',
      generated_at: new Date().toISOString(),
    })),
    ...imageEntries,
  ],
};
writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest, null, 2));
const cards = imageEntries.map((entry) => `<figure><a href="${entry.path}"><img src="${entry.path}" alt="${entry.description}"></a><figcaption><strong>${entry.name}</strong><br>Viewport: ${entry.viewport} · Perfil: ${entry.profile} · Estado: ${entry.state}<br>${entry.description}</figcaption></figure>`).join('\n');
writeFileSync(join(root, 'index.html'), `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>LOCAL-QA-01.1 — Pacote de revisão</title><style>body{font:16px system-ui;max-width:1200px;margin:32px auto;padding:0 20px;color:#172033}section{margin:32px 0}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px}figure{margin:0;border:1px solid #d9e0ea;border-radius:12px;padding:12px}img{width:100%;height:auto;border-radius:8px}figcaption{line-height:1.5;margin-top:10px}code{background:#eef2f7;padding:2px 5px;border-radius:4px}</style><body><h1>LOCAL-QA-01.1 — Pacote de revisão</h1><section><h2>Resumo do lote</h2><p>Reidratação local, permissões, smoke browser, JWT, cenários Analytics, idempotência e higiene de credenciais. Nenhum dado operacional real, segredo ou sincronização externa foi usado.</p></section><section><h2>Comparação antes e depois</h2><p>Este lote valida o estado funcional baseline após hidratação e os bloqueios por persona; as imagens são evidências do estado final local.</p></section><section><h2>Desktop e mobile</h2><main>${cards}</main></section><section><h2>Estados</h2><p>Cenários <code>fresh/baseline</code>, <code>empty</code>, <code>partial</code>, <code>stale</code>, <code>unavailable</code> e <code>zero-real</code> foram executados e restaurados.</p></section><section><h2>Relatórios técnicos</h2><ul>${reportFiles.map((file) => `<li><a href="reports/${file.split(/[\\/]/).at(-1)}">${file.split(/[\\/]/).at(-1)}</a></li>`).join('')}</ul></section><section><h2>Manifesto dos arquivos</h2><p><a href="manifest.json">manifest.json</a> lista tamanho, viewport, perfil, estado e descrição de cada arquivo.</p></section></body></html>`);
console.log(JSON.stringify({ package: root, files: manifest.files.length, screenshots: screenshots.length }));
