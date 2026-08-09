/**
 * Configuration PO V2.1 — gate do shell.
 *
 * Captura as tres evidencias exigidas antes de tocar na tela 01 e instrumenta
 * as medidas reais do DOM (topbar, sidebar, conteudo). O flyout precisa ser
 * overlay: o retangulo do conteudo principal nao pode mudar quando ele abre.
 *
 * Nao executa sincronizacao, escrita, deploy nem chamada externa.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';

import { loadQaEnv, readLocalSupabaseStatus } from './assert-local-supabase.mjs';

const qa = loadQaEnv();
readLocalSupabaseStatus();

const baseUrl = process.env.LOCAL_QA_WEB_URL ?? 'http://127.0.0.1:5174';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(baseUrl)) {
  throw new Error('LOCAL_QA_BLOCKED: a captura V2.1 só pode apontar para o frontend local.');
}

const root = resolve('output/playwright/2026-08-09-configuration-po-v2-1');
const shellRoot = join(root, 'runtime');
mkdirSync(shellRoot, { recursive: true });

const route = '/admin/settings/integrations';
const diagnostics = { consoleErrors: [], pageErrors: [], requestFailures: [], httpErrors: [] };
const captures = [];

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function login(page) {
  await page.goto(`${baseUrl}/login?redirectTo=${encodeURIComponent(route)}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(qa.LOCAL_QA_ADMIN_EMAIL);
  await page.getByLabel('Senha').fill(qa.LOCAL_QA_ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 20_000 }),
    page.getByRole('button', { name: /entrar/i }).click(),
  ]);
  await settle(page);
}

/** Mede o DOM real. Sem estimativa visual. */
async function measure(page) {
  return page.evaluate(() => {
    const rect = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const box = node.getBoundingClientRect();
      return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      };
    };
    const navItems = Array.from(document.querySelectorAll('.gso-sidebar .gso-nav-section-items a, .gso-sidebar .gso-nav-group-rail-button'))
      .map((node) => Math.round(node.getBoundingClientRect().height))
      .filter((height) => height > 0);
    const active = document.querySelector('.gso-sidebar [aria-current="page"]');
    return {
      sidebar: rect('.gso-sidebar'),
      topbar: rect('.gso-topbar'),
      breadcrumb: rect('.gso-topbar-breadcrumb'),
      topbarSearch: rect('.gso-topbar-search'),
      main: rect('#conteudo-principal'),
      collapseAction: rect('.gso-sidebar-collapse-action'),
      flyout: rect('.gso-nav-flyout'),
      navItemHeights: Array.from(new Set(navItems)).sort((a, b) => a - b),
      groupHeadings: Array.from(document.querySelectorAll('.gso-sidebar .gso-nav-group-toggle')).map((node) => node.textContent.trim()),
      railButtons: document.querySelectorAll('.gso-sidebar .gso-nav-group-rail-button').length,
      activeNavItem: active ? active.textContent.trim() : null,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
}

async function shot(page, id, state) {
  const output = join(shellRoot, `${id}.png`);
  await page.screenshot({ path: output, fullPage: false });
  captures.push({
    id,
    route,
    viewport: '1366x768',
    theme: 'dark',
    persona: 'local QA administrator fixture',
    state,
    path: relative(root, output).replaceAll('\\', '/'),
    size: statSync(output).size,
    sha256: sha256(output),
  });
}

const browser = await chromium.launch({ headless: true });
const measurements = {};
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
  page.on('response', (response) => {
    if (response.status() >= 400) diagnostics.httpErrors.push(`${response.status()} ${response.url()}`);
  });

  await login(page);
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const reached = new URL(page.url()).pathname;
  if (reached === '/login' || reached === '/access-denied') {
    throw new Error(`CAPTURE_ROUTE_UNAVAILABLE: ${route} -> ${reached}`);
  }

  measurements.expanded = await measure(page);
  await shot(page, 'shell-admin-expanded-1366-dark', 'sidebar expandida');

  await page.getByRole('button', { name: /recolher menu lateral/i }).click();
  await page.waitForTimeout(400);
  measurements.collapsed = await measure(page);
  await shot(page, 'shell-admin-collapsed-1366-dark', 'sidebar recolhida');

  // O flyout so existe no estado recolhido. Mede-se o conteudo antes e depois
  // para provar que o overlay nao empurra o layout.
  const mainBeforeFlyout = measurements.collapsed.main;
  const flyoutTrigger = page.locator('.gso-sidebar .gso-nav-group-rail-button').first();
  if (await flyoutTrigger.count()) {
    await flyoutTrigger.hover();
    await flyoutTrigger.click();
    await page.waitForTimeout(400);
  }
  measurements.flyout = await measure(page);
  measurements.flyoutLayoutShift = {
    mainBefore: mainBeforeFlyout,
    mainAfter: measurements.flyout.main,
    shifted:
      mainBeforeFlyout === null ||
      measurements.flyout.main === null ||
      mainBeforeFlyout.x !== measurements.flyout.main.x ||
      mainBeforeFlyout.width !== measurements.flyout.main.width,
    flyoutRendered: measurements.flyout.flyout !== null,
  };
  await shot(page, 'shell-admin-flyout-1366-dark', 'submenu flutuante sobre a sidebar recolhida');

  await context.close();
} finally {
  await browser.close();
}

const report = { generatedAt: new Date().toISOString(), baseUrl, route, captures, measurements, diagnostics };
writeFileSync(join(root, 'shell-gate.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
