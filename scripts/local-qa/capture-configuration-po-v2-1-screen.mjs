/**
 * Configuration PO V2.1 — captura e comparativo de uma tela.
 *
 * Uso: node scripts/local-qa/capture-configuration-po-v2-1-screen.mjs <id>
 *
 * Produz runtime-<id>-1366-dark.png, copia a referencia aprovada e monta
 * comparison-<id>.png no formato REFERENCE | RUNTIME, sem decoracao. Tambem
 * instrumenta o DOM da tela para o measurement map.
 *
 * Nao executa sincronizacao, escrita, deploy nem chamada externa.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';

import { loadQaEnv, readLocalSupabaseStatus } from './assert-local-supabase.mjs';

const SCREENS = {
  '01-integrations': {
    route: '/admin/settings/integrations',
    reference: '01-integrations-approved.png',
    regions: [
      ['header', '.gso-ui-header'],
      ['providers', '.gso-po-providers'],
      ['governance', '.gso-po-governance'],
      ['events', '.gso-po-table'],
    ],
  },
};

const id = process.argv[2] ?? '01-integrations';
const screen = SCREENS[id];
if (!screen) throw new Error(`SCREEN_UNKNOWN: ${id}`);

const qa = loadQaEnv();
readLocalSupabaseStatus();

const baseUrl = process.env.LOCAL_QA_WEB_URL ?? 'http://127.0.0.1:5174';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(baseUrl)) {
  throw new Error('LOCAL_QA_BLOCKED: a captura V2.1 só pode apontar para o frontend local.');
}

const root = resolve('output/playwright/2026-08-09-configuration-po-v2-1');
const runtimeDir = join(root, 'runtime');
const referenceDir = join(root, 'references');
const comparisonDir = join(root, 'comparisons');
for (const dir of [runtimeDir, referenceDir, comparisonDir]) mkdirSync(dir, { recursive: true });

const referenceSource = resolve('docs/design/blueprint/Configuration PO/v2', screen.reference);
const referenceTarget = join(referenceDir, screen.reference);
copyFileSync(referenceSource, referenceTarget);

const runtimePath = join(runtimeDir, `runtime-${id}-1366-dark.png`);
const comparisonPath = join(comparisonDir, `comparison-${id}.png`);
const diagnostics = { consoleErrors: [], pageErrors: [], requestFailures: [], httpErrors: [] };

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

const browser = await chromium.launch({ headless: true });
let measurements = null;
try {
  const context = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1366, height: 768 } });
  await context.addInitScript(() => {
    window.localStorage.setItem('genius.theme-preference', 'dark');
    window.localStorage.setItem('gso-shell-sidebar-collapsed', 'false');
  });
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') diagnostics.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
  page.on('requestfailed', (request) => diagnostics.requestFailures.push(`${request.method()} ${request.url()}`));
  page.on('response', (response) => { if (response.status() >= 400) diagnostics.httpErrors.push(`${response.status()} ${response.url()}`); });

  await page.goto(`${baseUrl}/login?redirectTo=${encodeURIComponent(screen.route)}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(qa.LOCAL_QA_ADMIN_EMAIL);
  await page.getByLabel('Senha').fill(qa.LOCAL_QA_ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 20_000 }),
    page.getByRole('button', { name: /entrar/i }).click(),
  ]);
  await page.goto(`${baseUrl}${screen.route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(600);

  const reached = new URL(page.url()).pathname;
  if (reached === '/login' || reached === '/access-denied') throw new Error(`CAPTURE_ROUTE_UNAVAILABLE: ${screen.route} -> ${reached}`);

  measurements = await page.evaluate((regions) => {
    const rect = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const box = node.getBoundingClientRect();
      return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
    };
    const fontOf = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const style = window.getComputedStyle(node);
      return { fontSize: style.fontSize, lineHeight: style.lineHeight };
    };
    const out = { regions: {}, typography: {}, overflowX: document.documentElement.scrollWidth > window.innerWidth };
    for (const [name, selector] of regions) out.regions[name] = rect(selector);
    out.typography.pageTitle = fontOf('.gso-ui-header h2');
    out.typography.sectionHeading = fontOf('.gso-po-region-head h3');
    out.typography.panelTitle = fontOf('.gso-po-panel-title h3');
    out.typography.body = fontOf('.gso-po-panel-title p');
    out.typography.metadata = fontOf('.gso-po-metric-detail');
    out.typography.tableRow = (() => {
      const cell = document.querySelector('.gso-po-table td');
      if (!cell) return null;
      const style = window.getComputedStyle(cell);
      return { fontSize: style.fontSize, height: `${Math.round(cell.getBoundingClientRect().height)}px` };
    })();
    out.controlHeight = (() => {
      const node = document.querySelector('.gso-po-action');
      return node ? Math.round(node.getBoundingClientRect().height) : null;
    })();
    out.providerPanels = document.querySelectorAll('.gso-po-panel').length;
    out.metricSlots = document.querySelectorAll('.gso-po-metric').length;
    out.kpiRailPresent = document.querySelector('.gso-ui-metric-row, .gso-po-v2-integrations .gso-ui-metric-row') !== null;
    out.eventColumns = Array.from(document.querySelectorAll('.gso-po-table thead th')).map((node) => node.textContent.trim());
    out.documentScrollWidth = document.documentElement.scrollWidth;
    out.viewportWidth = window.innerWidth;
    return out;
  }, screen.regions);

  await page.screenshot({ path: runtimePath, fullPage: false });

  // Comparativo REFERENCE | RUNTIME, lado a lado, sem decoracao alem do rotulo.
  const toDataUri = (path) => `data:image/png;base64,${readFileSync(path).toString('base64')}`;
  const comparison = await context.newPage();
  await comparison.setViewportSize({ width: 2400, height: 760 });
  await comparison.setContent(`<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;background:#0b1220;font:12px/1.3 system-ui,sans-serif;color:#cbd5f5}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px}
  figure{margin:0}
  figcaption{padding:4px 2px;letter-spacing:.06em;text-transform:uppercase}
  img{display:block;width:100%;height:auto}
</style>
<div class="pair">
  <figure><figcaption>REFERENCE</figcaption><img src="${toDataUri(referenceTarget)}"></figure>
  <figure><figcaption>RUNTIME</figcaption><img src="${toDataUri(runtimePath)}"></figure>
</div>`);
  await comparison.waitForTimeout(300);
  await comparison.locator('.pair').screenshot({ path: comparisonPath });

  await context.close();
} finally {
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  screen: id,
  route: screen.route,
  persona: 'local QA administrator fixture',
  viewport: '1366x768',
  theme: 'dark',
  artifacts: [runtimePath, comparisonPath, referenceTarget].map((path) => ({
    path: relative(root, path).replaceAll('\\', '/'),
    size: statSync(path).size,
    sha256: sha256(path),
  })),
  measurements,
  diagnostics,
};
writeFileSync(join(root, `screen-${id}.json`), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
