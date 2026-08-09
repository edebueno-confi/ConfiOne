import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';

import { loadQaEnv } from './assert-local-supabase.mjs';

const qa = loadQaEnv();
const baseUrl = process.env.LOCAL_QA_WEB_URL ?? 'http://127.0.0.1:4173';
const generatedAt = new Date().toISOString();
const stamp = generatedAt.replace(/[-:.TZ]/g, '').slice(0, 14);
const artifactRoot = resolve(process.env.DESIGN_REVIEW_ARTIFACT_ROOT ?? 'C:/Projetos/GSO-artifacts');
const packageName = `dashboard-configuration-review-${stamp}`;
const root = join(artifactRoot, packageName);
const screenshotsDir = join(root, 'screenshots');
const zipPath = join(artifactRoot, `${packageName}.zip`);
const viewport = { width: 1920, height: 1080 };

mkdirSync(screenshotsDir, { recursive: true });

function sha256(path) {
  // O manifesto e construido depois das imagens. A leitura sincrona evita
  // estado parcial durante a assinatura do pacote.
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function waitForContent(page) {
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(750);
}

async function capture(page, id, title, route, events) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  await waitForContent(page);
  const pathname = new URL(page.url()).pathname;
  if (pathname === '/login' || pathname === '/access-denied') {
    throw new Error(`CAPTURE_ROUTE_UNAVAILABLE: ${route} -> ${pathname}`);
  }
  const filename = `${id}.png`;
  await page.screenshot({ path: join(screenshotsDir, filename), fullPage: false });
  events.push({ id, title, route, filename, reachedPath: pathname });
}

async function captureCockpitSection(page, id, title, sectionId, events) {
  await page.goto(`${baseUrl}/admin/cockpit`, { waitUntil: 'domcontentloaded' });
  await waitForContent(page);
  await page.locator(`#${sectionId}`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const filename = `${id}.png`;
  await page.screenshot({ path: join(screenshotsDir, filename), fullPage: false });
  events.push({ id, title, route: '/admin/cockpit', filename, reachedPath: '/admin/cockpit', sectionId });
}

async function captureDashboardTab(page, id, title, label, events) {
  await page.goto(`${baseUrl}/admin/analytics`, { waitUntil: 'domcontentloaded' });
  await waitForContent(page);
  const tab = page.getByText(label, { exact: true }).first();
  await tab.waitFor({ state: 'visible', timeout: 12_000 });
  await tab.click();
  await page.waitForTimeout(900);
  const filename = `${id}.png`;
  await page.screenshot({ path: join(screenshotsDir, filename), fullPage: false });
  events.push({ id, title, route: '/admin/analytics', filename, reachedPath: new URL(page.url()).pathname, tab: label });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport });
const diagnostics = { consoleErrors: [], pageErrors: [], badResponses: [] };
page.on('console', (message) => {
  if (message.type() === 'error') diagnostics.consoleErrors.push(message.text());
});
page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
page.on('response', (response) => {
  if (response.status() >= 400) diagnostics.badResponses.push(`${response.status()} ${response.url()}`);
});

try {
  await page.goto(`${baseUrl}/login?redirectTo=${encodeURIComponent('/admin/analytics')}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(qa.LOCAL_QA_ADMIN_EMAIL);
  await page.getByLabel('Senha').fill(qa.LOCAL_QA_ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 20_000 }),
    page.getByRole('button', { name: /entrar/i }).click(),
  ]);
  await waitForContent(page);

  const captures = [];
  await captureDashboardTab(page, 'dashboard-visao-geral', 'Dashboard — Visão Geral', 'Visão Geral', captures);
  await captureDashboardTab(page, 'dashboard-comercial', 'Dashboard — Comercial', 'Comercial', captures);
  await captureDashboardTab(page, 'dashboard-customer-success', 'Dashboard — Customer Success', 'Customer Success', captures);
  await captureDashboardTab(page, 'dashboard-suporte-chat', 'Dashboard — Suporte & Chat', 'Suporte & Chat', captures);
  await captureDashboardTab(page, 'dashboard-financeiro', 'Dashboard — Financeiro', 'Financeiro', captures);
  await captureDashboardTab(page, 'dashboard-produto-desenvolvimento', 'Dashboard — Produto e Desenvolvimento', 'Produto e Desenvolvimento', captures);

  for (const [id, title, route] of [
    ['acesso-usuarios', 'Gestão de acesso — Usuários', '/admin/access?tab=users'],
    ['acesso-estrutura', 'Gestão de acesso — Estrutura', '/admin/access?tab=structure'],
    ['acesso-perfis', 'Gestão de acesso — Perfis', '/admin/access?tab=permissions'],
    ['acesso-convites', 'Gestão de acesso — Convites', '/admin/access?tab=invites'],
    ['integracoes', 'Configurações — Integrações', '/admin/settings/integrations'],
    ['fontes-dashboard', 'Configurações — Fontes do Dashboard', '/admin/settings/dashboard-sources'],
    ['historico-sincronizacoes', 'Configurações — Histórico de sincronizações', '/admin/settings/sync-history'],
    ['marcas', 'Configurações — Marcas', '/admin/settings/brands'],
    ['central-ajuda-configuracoes', 'Configurações — Central de ajuda', '/admin/settings/help-center'],
    ['central-ajuda-publica', 'Central de Ajuda pública', '/help/genius'],
  ]) {
    await capture(page, id, title, route, captures);
  }

  await captureCockpitSection(page, 'cockpit-fontes-escopo', 'Cockpit gerencial — Fontes e escopo', 'cockpit-fontes', captures);
  await captureCockpitSection(page, 'cockpit-leitura-fila', 'Cockpit gerencial — Leitura da fila', 'cockpit-etapas', captures);
  await captureCockpitSection(page, 'cockpit-execucoes', 'Cockpit gerencial — Execuções e rastreabilidade', 'cockpit-execucoes', captures);
  await captureCockpitSection(page, 'cockpit-conciliacao', 'Cockpit gerencial — Conciliação de empresas', 'cockpit-conciliacao', captures);

  const entries = readdirSync(screenshotsDir)
    .filter((file) => file.endsWith('.png'))
    .sort()
    .map((filename) => {
      const captureEntry = captures.find((item) => item.filename === filename);
      const path = join(screenshotsDir, filename);
      return {
        ...captureEntry,
        path: relative(root, path).replaceAll('\\', '/'),
        viewport: '1920x1080',
        size: statSync(path).size,
        sha256: sha256(path),
      };
    });

  const manifest = {
    package: packageName,
    generatedAt,
    baseUrl,
    viewport: '1920x1080',
    screenshots: entries.length,
    files: entries,
    diagnostics,
  };
  writeFileSync(join(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  writeFileSync(join(root, 'README.md'), [
    '# Revisão visual — Dashboard e Configurações',
    '',
    `Gerado em: ${generatedAt}`,
    `Origem: ${baseUrl} (ambiente local autenticado).`,
    `Viewport: 1920×1080.`,
    `Capturas: ${entries.length}.`,
    '',
    '## Escopo',
    '',
    '- Todas as abas do Dashboard Gerencial.',
    '- Gestão de acesso: Usuários, Estrutura, Perfis e Convites.',
    '- Cockpit gerencial: fontes, fila, execuções e conciliação.',
    '- Integrações, Fontes do Dashboard, Histórico, Marcas e Central de ajuda.',
    '- Central de Ajuda pública.',
    '',
    '## Uso',
    '',
    'Abra `index.html` para navegar pelas imagens. `manifest.json` contém rotas, dimensões, hashes SHA-256 e diagnósticos da captura.',
    '',
    'As imagens refletem a fixture local de QA; dados operacionais externos não são fabricados para o pacote.',
    '',
  ].join('\n'), 'utf8');

  const cards = entries.map((entry) => `<figure><a href="${entry.path}"><img src="${entry.path}" alt="${escapeHtml(entry.title)}"></a><figcaption><strong>${escapeHtml(entry.title)}</strong><br><code>${escapeHtml(entry.route)}</code><br><a href="${entry.path}">Abrir PNG original</a></figcaption></figure>`).join('\n');
  writeFileSync(join(root, 'index.html'), `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Revisão visual — Dashboard e Configurações</title><style>body{font:16px/1.5 system-ui,sans-serif;margin:32px auto;max-width:1440px;padding:0 24px;color:#15233d;background:#f8fafc}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:20px}figure{background:#fff;border:1px solid #dce3ee;border-radius:12px;margin:0;padding:12px}img{display:block;width:100%;height:auto;border:1px solid #dce3ee;border-radius:7px}figcaption{margin-top:10px}code{font-size:.85em;color:#43536c}</style></head><body><h1>Revisão visual — Dashboard e Configurações</h1><p>${entries.length} capturas autenticadas em viewport fixo de 1920×1080. Consulte <a href="manifest.json">manifest.json</a> para hashes, rotas e diagnósticos.</p><main>${cards}</main></body></html>`, 'utf8');

  execFileSync('powershell.exe', ['-NoProfile', '-Command', `Compress-Archive -Path '${root}' -DestinationPath '${zipPath}' -Force`], { stdio: 'inherit' });
  console.log(JSON.stringify({ root, zipPath, screenshots: entries.length, diagnostics }, null, 2));
} finally {
  await browser.close();
}
