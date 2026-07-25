import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('output/review-packages/dashboard-02-executive-v1-design-gate-review');
const source = path.resolve('output/playwright');
const old = path.resolve('output/review-packages/dashboard-02-executive-v1-implemented-review');
fs.rmSync(root, { recursive: true, force: true });
for (const dir of ['reports', 'screenshots/desktop', 'screenshots/tablet', 'screenshots/mobile', 'screenshots/states', 'screenshots/comparisons', 'assets']) fs.mkdirSync(path.join(root, dir), { recursive: true });

const copy = (from, to) => fs.copyFileSync(path.join(source, from), path.join(root, to));
copy('dashboard-02-3-1-admin-1440.png', 'screenshots/desktop/admin-1440x900.png');
copy('dashboard-02-3-1-admin-1366.png', 'screenshots/desktop/admin-1366x768.png');
copy('dashboard-02-3-1-viewer-1440.png', 'screenshots/desktop/viewer-1440x900.png');
copy('dashboard-02-3-1-admin-1024.png', 'screenshots/tablet/admin-1024x768.png');
copy('dashboard-02-3-1-admin-768.png', 'screenshots/tablet/admin-768x1024.png');
copy('dashboard-02-3-1-admin-390.png', 'screenshots/mobile/admin-390x844.png');
copy('dashboard-02-3-1-viewer-390.png', 'screenshots/mobile/viewer-390x844.png');
copy('dashboard-02-3-1-admin-dark-1440.png', 'screenshots/states/admin-dark-1440x900.png');
fs.copyFileSync(path.join(old, 'screenshots/comparisons/before-current-1440-reference.png'), path.join(root, 'screenshots/comparisons/before-current-1440-reference.png'));
fs.copyFileSync(path.join(old, 'screenshots/comparisons/after-executive-1440.png'), path.join(root, 'screenshots/comparisons/after-executive-1440.png'));
for (const state of ['fresh', 'stale', 'partial', 'empty', 'zero-real', 'error']) copy(`dashboard-02-3-1-state-${state}.png`, `screenshots/states/${state}-1440x900.png`);
for (const name of ['DASHBOARD_02_EXECUTIVE_V1_2026-07-24.md', 'DASHBOARD_02_EXECUTIVE_DESIGN_GATE_2026-07-25.md']) fs.copyFileSync(path.resolve('docs/reports', name), path.join(root, 'reports', name));
for (const name of ['DASHBOARD_02_FEATURE_CATALOG_2026-07-24.md', 'DASHBOARD_02_UX_UI_OPTIONS_2026-07-24.md']) {
  const from = path.join(old, 'reports', name);
  if (fs.existsSync(from)) fs.copyFileSync(from, path.join(root, 'reports', name));
}
fs.writeFileSync(path.join(root, 'assets/README.md'), 'Pacote local: sem assets externos, segredos, tokens ou dados pessoais.\n', 'utf8');

const imageFiles = [];
function walk(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const abs = path.join(dir, entry.name); if (entry.isDirectory()) walk(abs); else if (/\.png$/i.test(entry.name)) imageFiles.push(path.relative(root, abs).replaceAll('\\', '/')); } }
walk(path.join(root, 'screenshots'));
const meta = (file) => {
  const name = path.basename(file);
  const viewport = name.match(/(\d+x\d+)/)?.[1] ?? 'comparação';
  const profile = name.includes('viewer') ? 'dashboard_viewer' : 'platform_admin';
  const state = ['fresh', 'stale', 'partial', 'empty', 'error', 'zero-real'].find((value) => name.includes(value)) ?? (name.includes('dark') ? 'fresh/dark' : 'fresh');
  const section = file.includes('/comparisons/') ? 'Comparação antes e depois' : file.includes('/desktop/') ? 'Desktop' : file.includes('/tablet/') ? 'Tablet' : file.includes('/mobile/') ? 'Mobile' : 'Estados fresh, stale, partial, empty, error e zero real';
  return { file, viewport, profile, state, section, title: `${section} — ${viewport} — ${profile} — ${state}`, description: 'Captura local do shell real com dados/fixtures de QA, sem dependência externa.' };
};
const entries = imageFiles.map(meta);
const figure = (item) => `<figure><a href="${item.file}"><img src="${item.file}" alt="${item.title}"></a><figcaption><strong>${item.title}</strong><br><small>${item.description}<br><a href="${item.file}">Abrir imagem original</a></small></figcaption></figure>`;
const sections = ['Comparação antes e depois', 'Desktop', 'Tablet', 'Mobile', 'Tema claro', 'Tema escuro', 'Estados fresh, stale, partial, empty, error e zero real', 'Dashboard viewer', 'Perfil administrativo', 'Pipelines compactos', 'Filtros mobile', 'Acessibilidade'];
const sectionHtml = sections.map((section) => {
  const selected = entries.filter((item) => item.section === section || (section === 'Tema escuro' && item.state === 'fresh/dark') || (section === 'Tema claro' && item.state === 'fresh' && !item.file.includes('viewer')) || (section === 'Dashboard viewer' && item.profile === 'dashboard_viewer') || (section === 'Perfil administrativo' && item.profile === 'platform_admin') || (section === 'Pipelines compactos' && item.file.includes('desktop')) || (section === 'Filtros mobile' && item.file.includes('390')) || (section === 'Acessibilidade' && item.file.includes('390')));
  return `<section><h2>${section}</h2>${selected.length ? selected.map(figure).join('') : '<p>Verificação documentada nos relatórios técnicos; sem captura adicional exclusiva desta dimensão.</p>'}</section>`;
}).join('');
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>DASHBOARD-02.3.1 — Design gate</title><style>body{font:15px system-ui;max-width:1200px;margin:24px auto;padding:0 20px;color:#17233c}section{margin:32px 0;border-top:1px solid #ccd5e3;padding-top:14px}figure{display:inline-flex;vertical-align:top;flex-direction:column;width:30%;margin:8px}img{max-width:100%;max-height:520px;object-fit:contain;border:1px solid #ccd5e3;border-radius:8px;background:#fff}figcaption{line-height:1.4;margin-top:6px}small{color:#56657b}a{color:#135ee8}@media(max-width:760px){figure{width:46%}}</style></head><body><h1>DASHBOARD-02.3.1 — Gate de organização, design e preservação funcional</h1><p>Pacote navegável local. O escopo é exclusivamente a Visão Executiva em <code>/admin/analytics</code>. Capturas autenticadas e fixtures locais; nenhum segredo ou dado sensível foi incluído.</p><h2>1. Resumo do lote</h2><p>Hierarquia executiva, estados/frescor, responsividade, perfil viewer e preservação funcional validados sem alterar backend, migrations, RLS ou integrações externas.</p>${sectionHtml}<section><h2>14. Relatórios técnicos</h2><ul><li><a href="reports/DASHBOARD_02_EXECUTIVE_DESIGN_GATE_2026-07-25.md">Relatório do gate de design</a></li><li><a href="reports/DASHBOARD_02_EXECUTIVE_V1_2026-07-24.md">Relatório da Visão Executiva V1</a></li></ul></section><section><h2>15. Manifesto dos arquivos</h2><p>Todos os caminhos são relativos; as imagens são locais e o pacote não requer servidor nem URL externa.</p><p><a href="manifest.json">Abrir manifest.json</a></p></section></body></html>`;
fs.writeFileSync(path.join(root, 'index.html'), html, 'utf8');

const commit = process.env.REVIEW_COMMIT ?? 'working-tree';
const generatedAt = new Date().toISOString();
const allFiles = [];
function list(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const abs = path.join(dir, entry.name); if (entry.isDirectory()) list(abs); else allFiles.push(path.relative(root, abs).replaceAll('\\', '/')); } }
list(root);
const manifest = allFiles.sort().map((relative) => { const stat = fs.statSync(path.join(root, relative)); const item = entries.find((entry) => entry.file === relative); return { name: path.basename(relative), path: relative, type: path.extname(relative).slice(1) || 'file', size: stat.size, viewport: item?.viewport ?? null, state: item?.state ?? null, profile: item?.profile ?? null, description: item?.description ?? 'Artefato versionado de revisão técnica.', commit, generatedAt }; });
fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify({ package: 'dashboard-02-executive-v1-design-gate-review', generatedAt, files: manifest }, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ root, files: manifest.length, images: imageFiles.length }, null, 2));
