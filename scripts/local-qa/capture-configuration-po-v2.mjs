import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';

import { loadQaEnv, readLocalSupabaseStatus } from './assert-local-supabase.mjs';

const qa = loadQaEnv();
readLocalSupabaseStatus();

const baseUrl = process.env.LOCAL_QA_WEB_URL ?? 'http://127.0.0.1:5174';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(baseUrl)) {
  throw new Error('LOCAL_QA_BLOCKED: a captura V2 só pode apontar para o frontend local.');
}

const root = resolve('output/playwright/2026-08-09-configuration-po-v2-final');
const screenshotRoot = join(root, 'screenshots');
const referencesRoot = join(root, 'references');
const viewports = [
  ['1366x768', { width: 1366, height: 768 }],
  ['1440x900', { width: 1440, height: 900 }],
  ['1024x768', { width: 1024, height: 768 }],
  ['390x844', { width: 390, height: 844 }],
];
const screens = [
  ['settings-overview', 'Configurações', '/admin/settings', '02-settings-overview-approved.png'],
  ['access-users', 'Usuários e acessos', '/admin/access?tab=users', '03-users-access-approved.png'],
  ['help-center', 'Central de ajuda', '/admin/settings/help-center', '04-help-center-settings-approved.png'],
  ['sync-history', 'Histórico de sincronizações', '/admin/settings/sync-history', '05-sync-history-approved.png'],
  ['dashboard-sources', 'Fontes do Dashboard', '/admin/settings/dashboard-sources', '06-dashboard-sources-approved.png'],
  ['integrations', 'Integrações', '/admin/settings/integrations', '01-integrations-approved.png'],
];
const referenceRoot = resolve('docs/design/blueprint/Configuration PO/v2');
const generatedAt = new Date().toISOString();
const diagnostics = { consoleErrors: [], pageErrors: [], unexpectedResponses: [] };

mkdirSync(screenshotRoot, { recursive: true });
mkdirSync(referencesRoot, { recursive: true });

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(600);
}

async function login(page) {
  await page.goto(`${baseUrl}/login?redirectTo=${encodeURIComponent('/admin/settings')}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(qa.LOCAL_QA_ADMIN_EMAIL);
  await page.getByLabel('Senha').fill(qa.LOCAL_QA_ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 20_000 }),
    page.getByRole('button', { name: /entrar/i }).click(),
  ]);
  await settle(page);
}

async function captureDefault(page, viewportName, theme, id, title, route, files) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const reachedPath = new URL(page.url()).pathname;
  if (reachedPath === '/login' || reachedPath === '/access-denied') throw new Error(`CAPTURE_ROUTE_UNAVAILABLE: ${route} -> ${reachedPath}`);
  const filename = `${id}-${theme}-${viewportName}.png`;
  const output = join(screenshotRoot, viewportName, filename);
  mkdirSync(join(screenshotRoot, viewportName), { recursive: true });
  await page.screenshot({ path: output, fullPage: false });
  files.push({ id, title, route, state: 'default', theme, viewport: viewportName, path: relative(root, output).replaceAll('\\', '/'), size: statSync(output).size, sha256: sha256(output) });
}

async function captureAccessDetail(page, viewportName, theme, files) {
  if (viewportName === '390x844') return;
  await page.goto(`${baseUrl}/admin/access?tab=users`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const row = page.locator('tbody tr').first();
  if (!await row.isVisible().catch(() => false)) return;
  await row.click();
  await page.waitForTimeout(450);
  const filename = `access-users-detail-${theme}-${viewportName}.png`;
  const output = join(screenshotRoot, viewportName, filename);
  await page.screenshot({ path: output, fullPage: false });
  files.push({ id: 'access-users-detail', title: 'Usuários e acessos — detalhe', route: '/admin/access?tab=users', state: 'detail', theme, viewport: viewportName, path: relative(root, output).replaceAll('\\', '/'), size: statSync(output).size, sha256: sha256(output) });
}

const browser = await chromium.launch({ headless: true });
const files = [];
try {
  for (const [theme, colorScheme] of [['dark', 'dark'], ['light', 'light']]) {
    for (const [viewportName, viewport] of viewports) {
      const context = await browser.newContext({ colorScheme, viewport });
      await context.addInitScript((preference) => window.localStorage.setItem('genius.theme-preference', preference), theme);
      const page = await context.newPage();
      page.on('console', (message) => { if (message.type() === 'error') diagnostics.consoleErrors.push(`${theme}/${viewportName}: ${message.text()}`); });
      page.on('pageerror', (error) => diagnostics.pageErrors.push(`${theme}/${viewportName}: ${error.message}`));
      page.on('response', (response) => {
        if (response.status() >= 500) diagnostics.unexpectedResponses.push(`${theme}/${viewportName}: ${response.status()} ${response.url()}`);
      });
      await login(page);
      for (const [id, title, route] of screens) await captureDefault(page, viewportName, theme, id, title, route, files);
      await captureAccessDetail(page, viewportName, theme, files);
      await context.close();
    }
  }
} finally {
  await browser.close();
}

for (const [, , , reference] of screens) copyFileSync(join(referenceRoot, reference), join(referencesRoot, reference));

const hashes = readdirSync(screenshotRoot, { recursive: true })
  .filter((path) => typeof path === 'string' && path.endsWith('.png'))
  .map((path) => join(screenshotRoot, path))
  .concat(readdirSync(referencesRoot).filter((path) => path.endsWith('.png')).map((path) => join(referencesRoot, path)))
  .sort()
  .map((path) => `${sha256(path)}  ${relative(root, path).replaceAll('\\', '/')}`);
writeFileSync(join(root, 'SHA256SUMS.txt'), `${hashes.join('\n')}\n`, 'utf8');

const manifest = {
  generatedAt,
  source: { baseUrl, environment: 'local QA fixture', externalSync: false },
  references: screens.map(([id, title, route, reference]) => ({ id, title, route, path: `references/${reference}`, sha256: sha256(join(referencesRoot, reference)) })),
  captures: files,
  diagnostics,
  notes: [
    'A captura não executa sincronização, alteração de credencial, deploy ou chamada externa.',
    'Estados vazios e indisponíveis refletem a fixture QA local; eles não são dados operacionais fabricados.',
    'Acesso inclui captura adicional de detalhe quando a tabela possui um registro selecionável.',
  ],
};
writeFileSync(join(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const comparisons = screens.map(([id, title, , reference]) => `<section><h2>${title}</h2><div><figure><img src="references/${reference}" alt="Referência aprovada"><figcaption>Referência aprovada V2</figcaption></figure><figure><img src="screenshots/1366x768/${id}-dark-1366x768.png" alt="Implementação local dark"><figcaption>Implementação local · dark · 1366×768</figcaption></figure></div></section>`).join('\n');
writeFileSync(join(root, 'comparison.html'), `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Configuration PO V2 — comparativo</title><style>body{font:15px/1.45 system-ui;margin:24px;background:#111827;color:#e5e7eb}section{margin:0 auto 28px;max-width:1800px}h2{font-size:18px}section>div{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0;border:1px solid #334155;padding:10px;background:#172033}img{width:100%;height:auto;display:block}figcaption{margin-top:8px}@media(max-width:900px){section>div{grid-template-columns:1fr}}</style><h1>Configuration PO V2 — comparativo visual</h1><p>Referências versionadas e capturas autenticadas em fixture QA local. Consulte manifest.json e SHA256SUMS.txt.</p>${comparisons}`, 'utf8');
console.log(JSON.stringify({ root, captures: files.length, diagnostics }, null, 2));
