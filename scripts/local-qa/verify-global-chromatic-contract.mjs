import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { loadQaEnv, readLocalSupabaseStatus } from './assert-local-supabase.mjs';

const qa = loadQaEnv();
readLocalSupabaseStatus();

const BASE_URL = process.env.LOCAL_QA_WEB_URL || 'http://127.0.0.1:5174';
const OUTPUT_DIR = path.resolve(process.cwd(), 'output/playwright/2026-08-09-chromatic-qa');

async function login(page, route = '/admin/settings/integrations') {
  await page.goto(`${BASE_URL}/login?redirectTo=${encodeURIComponent(route)}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(qa.LOCAL_QA_ADMIN_EMAIL);
  await page.getByLabel('Senha').fill(qa.LOCAL_QA_ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 20_000 }),
    page.getByRole('button', { name: /entrar/i }).click(),
  ]);
  await page.waitForTimeout(1000);
}

async function run() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`[QA Chromatic Verification] Starting verification against ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    colorScheme: 'dark',
  });

  const page = await context.newPage();

  // 1. Authenticate
  await login(page);

  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(500);

  // 2. Single User Menu Trigger Assertion
  const userMenuTriggers = await page.evaluate(() => {
    const topbar = document.querySelector('.gso-topbar');
    const sidebar = document.querySelector('.gso-sidebar');
    const triggers = Array.from(document.querySelectorAll('button')).filter((btn) => {
      const label = btn.getAttribute('aria-label') || '';
      return label.includes('Menu de') || btn.getAttribute('aria-haspopup') === 'menu';
    });
    return {
      count: triggers.length,
      inTopbar: topbar ? triggers.some((el) => topbar.contains(el)) : false,
      inSidebar: sidebar ? triggers.some((el) => sidebar.contains(el)) : false,
    };
  });

  console.log(`[QA User Menu Check] Triggers count: ${userMenuTriggers.count}, inTopbar: ${userMenuTriggers.inTopbar}, inSidebar: ${userMenuTriggers.inSidebar}`);

  if (userMenuTriggers.count !== 1 || !userMenuTriggers.inTopbar || userMenuTriggers.inSidebar) {
    console.error('FAIL: User Menu Trigger assertion failed!', userMenuTriggers);
    process.exitCode = 1;
  } else {
    console.log('PASS: User Menu Trigger assertion (1 trigger in topbar, 0 in sidebar)');
  }

  // 3. Measure getComputedStyle RGB values
  const rgbMeasurements = await page.evaluate(() => {
    const sidebar = document.querySelector('.gso-sidebar');
    const topbar = document.querySelector('.gso-topbar');
    const canvas = document.querySelector('#conteudo-principal');
    const pageHeader = document.querySelector('.gso-ui-header, .gso-workspace-header');
    const surface1 = document.querySelector('.gso-ui-card, .gso-metric, article, section');

    return {
      sidebarBg: sidebar ? window.getComputedStyle(sidebar).backgroundColor : null,
      topbarBg: topbar ? window.getComputedStyle(topbar).backgroundColor : null,
      canvasBg: canvas ? window.getComputedStyle(canvas).backgroundColor : null,
      pageHeaderBg: pageHeader ? window.getComputedStyle(pageHeader).backgroundColor : null,
      surface1Bg: surface1 ? window.getComputedStyle(surface1).backgroundColor : null,
    };
  });

  console.log('[QA getComputedStyle Measurements]', JSON.stringify(rgbMeasurements, null, 2));

  // 4. Captures
  // 01-shell-clean-expanded.png
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01-shell-clean-expanded.png') });

  // 02-shell-clean-collapsed.png
  const collapseButton = await page.$('.gso-sidebar-collapse-action');
  if (collapseButton) {
    await collapseButton.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-shell-clean-collapsed.png') });
    await collapseButton.click();
    await page.waitForTimeout(400);
  }

  // 03-shell-user-menu-open.png
  // Macro-lote 01: a identidade migrou da topbar para o rodape da sidebar.
  // O seletor antigo ('.gso-topbar-actions button') passou a nao casar nunca e
  // a evidencia era gerada em silencio, sem o menu. Agora a ausencia do gatilho
  // e um erro explicito.
  const userMenuBtn = await page.$('.gso-sidebar-account-trigger');
  if (!userMenuBtn) {
    throw new Error('SHELL_CONTRACT_VIOLATION: gatilho de identidade ausente no rodape da barra lateral.');
  }
  await userMenuBtn.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03-shell-user-menu-open.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 04-dashboard-shell-color-check.png
  await page.goto(`${BASE_URL}/admin/analytics`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04-dashboard-shell-color-check.png') });

  // 05-users-access-shell-color-check.png
  await page.goto(`${BASE_URL}/admin/access`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05-users-access-shell-color-check.png') });

  // 06-integrations-shell-color-check.png
  await page.goto(`${BASE_URL}/admin/settings/integrations`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06-integrations-shell-color-check.png') });

  await browser.close();

  const summary = {
    userMenuAssertion: userMenuTriggers.count === 1 && userMenuTriggers.inTopbar && !userMenuTriggers.inSidebar,
    measurements: rgbMeasurements,
    outputDirectory: OUTPUT_DIR,
  };

  console.log('[QA Summary]', JSON.stringify(summary, null, 2));
}

run().catch((err) => {
  console.error('QA Script Error:', err);
  process.exit(1);
});
