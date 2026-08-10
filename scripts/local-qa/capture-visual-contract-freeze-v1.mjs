import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * QA visual do Macro-lote 01 — Frontend Visual Contract Freeze.
 *
 * Captura as superficies internas autenticadas e a Central Publica em varios
 * viewports, mede o DOM real (superficie, regua horizontal, altura do shell) e
 * registra overflow horizontal acidental.
 *
 * Nao reidrata banco, nao altera dado e nao executa provedor externo.
 */

const BASE_URL = process.env.QA_BASE_URL ?? 'http://127.0.0.1:4174';
const OUT_DIR = join(process.cwd(), 'output', 'playwright', 'visual-contract-freeze-v1');

const VIEWPORTS = [
  { key: '1920x1080', width: 1920, height: 1080 },
  { key: '1440x900', width: 1440, height: 900 },
  { key: '1366x768', width: 1366, height: 768 },
];

const INTERNAL_ROUTES = [
  { key: 'dashboard-visao-geral', route: '/admin/analytics', name: 'Dashboard / Visao Geral' },
  { key: 'conhecimento-artigos', route: '/admin/knowledge', name: 'Conhecimento / Artigos' },
  { key: 'conhecimento-novo-artigo', route: '/admin/knowledge/new', name: 'Conhecimento / Novo artigo' },
  { key: 'acessos-usuarios', route: '/admin/access', name: 'Usuarios e acessos' },
  { key: 'settings-integracoes', route: '/admin/settings/integrations', name: 'Integracoes' },
  { key: 'settings-fontes', route: '/admin/settings/dashboard-sources', name: 'Fontes do Dashboard' },
  { key: 'settings-historico', route: '/admin/settings/sync-history', name: 'Historico de sincronizacoes' },
  { key: 'settings-marcas', route: '/admin/settings/brands', name: 'Marcas' },
  { key: 'settings-central-ajuda', route: '/admin/settings/help-center', name: 'Central de Ajuda (config)' },
  { key: 'meu-perfil', route: '/meu-perfil', name: 'Meu perfil' },
];

const PUBLIC_ROUTES = [
  { key: 'public-help-home', route: '/help', name: 'Central Publica / diretorio' },
  { key: 'public-help-space', route: '/help/genius', name: 'Central Publica / home do espaco' },
  { key: 'public-help-articles', route: '/help/genius/articles', name: 'Central Publica / listagem' },
];

async function readQaCredentials() {
  const raw = await readFile(join(process.cwd(), '.env.local.qa'), 'utf8');
  const pick = (key) => {
    const line = raw.split(/\r?\n/).find((entry) => entry.startsWith(`${key}=`));
    return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') : null;
  };

  const email = pick('LOCAL_QA_ADMIN_EMAIL');
  const password = pick('LOCAL_QA_ADMIN_PASSWORD');
  if (!email || !password) {
    throw new Error('LOCAL_QA_ADMIN_EMAIL/LOCAL_QA_ADMIN_PASSWORD ausentes em .env.local.qa');
  }
  return { email, password };
}

async function measure(page) {
  return page.evaluate(() => {
    const read = (selector, props) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const out = { left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) };
      for (const prop of props) out[prop] = style.getPropertyValue(prop);
      return out;
    };

    const heading = document.querySelector('h1');
    const headingRect = heading?.getBoundingClientRect();
    const headingStyle = heading ? window.getComputedStyle(heading) : null;

    return {
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      h1Count: document.querySelectorAll('h1').length,
      h1Text: heading?.textContent?.trim().slice(0, 60) ?? null,
      h1Left: headingRect ? Math.round(headingRect.left) : null,
      h1FontSize: headingStyle?.fontSize ?? null,
      h1FontWeight: headingStyle?.fontWeight ?? null,
      sidebar: read('.gso-sidebar', ['background-color', 'border-right-color']),
      topbar: read('.gso-topbar', ['background-color', 'height']),
      accountTrigger: read('.gso-sidebar-account-trigger', ['background-color']),
      topbarActions: document.querySelectorAll('.gso-topbar-actions').length,
      canvas: read('.gso-main-canvas', ['background-color']),
      activeTabUnderline: (() => {
        const tab = document.querySelector('[aria-current="page"].gso-ui-tab, [aria-current="page"].gso-workspace-tab');
        if (!tab) return null;
        const style = window.getComputedStyle(tab);
        const after = window.getComputedStyle(tab, '::after');
        return {
          borderBottomColor: style.borderBottomColor,
          afterBackground: after.backgroundColor,
        };
      })(),
      tokens: (() => {
        const root = window.getComputedStyle(document.documentElement);
        const names = [
          '--one-canvas-bg',
          '--one-surface-1',
          '--one-shell-bg',
          '--one-space-page-x',
          '--selection-accent',
          '--help-surface-strong',
          '--help-ink-strong',
          '--one-font-page-title',
        ];
        return Object.fromEntries(names.map((name) => [name, root.getPropertyValue(name).trim()]));
      })(),
    };
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const { email: qaEmail, password } = await readQaCredentials();
  const browser = await chromium.launch({ headless: true });
  const matrix = [];

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // --- Login autenticado -----------------------------------------------------
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"]').fill(qaEmail);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /entrar|acessar/i }).first().click();
  try {
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 });
  } catch {
    const feedback = await page.locator('[role="alert"], .gso-login-form-surface').first().innerText().catch(() => '');
    throw new Error(`LOGIN_FAILED: a autenticacao local nao avancou. Mensagem na tela: ${feedback.replace(/\s+/g, ' ').slice(0, 240)}`);
  }
  await page.waitForTimeout(1200);

  const storageState = await context.storageState();

  for (const viewport of VIEWPORTS) {
    const viewCtx = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      storageState,
    });
    const viewPage = await viewCtx.newPage();

    for (const target of INTERNAL_ROUTES) {
      const name = `${target.key}--${viewport.key}`;
      try {
        await viewPage.goto(`${BASE_URL}${target.route}`, { waitUntil: 'networkidle', timeout: 30000 });
        await viewPage.waitForTimeout(900);
        const reached = new URL(viewPage.url()).pathname;
        const metrics = await measure(viewPage);
        await viewPage.screenshot({ path: join(OUT_DIR, `${name}.png`), fullPage: false });
        matrix.push({ ...target, viewport: viewport.key, state: 'default', reached, screenshot: `${name}.png`, metrics });
      } catch (error) {
        matrix.push({ ...target, viewport: viewport.key, state: 'default', error: String(error.message ?? error) });
      }
    }

    await viewCtx.close();
  }

  // --- Estados do shell ------------------------------------------------------
  const shellCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState });
  const shellPage = await shellCtx.newPage();
  await shellPage.goto(`${BASE_URL}/admin/analytics`, { waitUntil: 'networkidle' });
  await shellPage.waitForTimeout(900);

  await shellPage.screenshot({ path: join(OUT_DIR, 'shell-sidebar-aberta--1440x900.png') });
  matrix.push({ key: 'shell-sidebar-aberta', name: 'Sidebar aberta', route: '/admin/analytics', viewport: '1440x900', state: 'sidebar expandida', screenshot: 'shell-sidebar-aberta--1440x900.png', metrics: await measure(shellPage) });

  const accountTrigger = shellPage.locator('.gso-sidebar-account-trigger').first();
  if (!(await accountTrigger.count())) {
    throw new Error('SHELL_CONTRACT_VIOLATION: gatilho de identidade ausente no rodape da barra lateral.');
  }
  await accountTrigger.click();
  await shellPage.waitForTimeout(400);
  await shellPage.screenshot({ path: join(OUT_DIR, 'shell-menu-usuario-aberto--1440x900.png') });
  const menuVisible = await shellPage.locator('[role="menu"]').count();
  matrix.push({ key: 'shell-menu-usuario', name: 'Menu do usuario aberto', route: '/admin/analytics', viewport: '1440x900', state: 'popover aberto', screenshot: 'shell-menu-usuario-aberto--1440x900.png', metrics: { menuNodes: menuVisible } });
  await shellPage.keyboard.press('Escape');
  await shellPage.waitForTimeout(300);

  await shellPage.getByRole('button', { name: /recolher menu lateral/i }).click();
  await shellPage.waitForTimeout(500);
  await shellPage.screenshot({ path: join(OUT_DIR, 'shell-sidebar-recolhida--1440x900.png') });
  matrix.push({ key: 'shell-sidebar-recolhida', name: 'Sidebar recolhida', route: '/admin/analytics', viewport: '1440x900', state: 'sidebar recolhida', screenshot: 'shell-sidebar-recolhida--1440x900.png', metrics: await measure(shellPage) });

  const collapsedTrigger = shellPage.locator('.gso-sidebar-account-trigger').first();
  await collapsedTrigger.click();
  await shellPage.waitForTimeout(400);
  await shellPage.screenshot({ path: join(OUT_DIR, 'shell-menu-usuario-recolhido--1440x900.png') });
  matrix.push({ key: 'shell-menu-usuario-recolhido', name: 'Menu do usuario (sidebar recolhida)', route: '/admin/analytics', viewport: '1440x900', state: 'popover aberto', screenshot: 'shell-menu-usuario-recolhido--1440x900.png', metrics: { menuNodes: await shellPage.locator('[role="menu"]').count() } });
  await shellCtx.close();

  // --- Central Publica (anonima, light only) ---------------------------------
  for (const scheme of ['light', 'dark']) {
    const pubCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: scheme });
    const pubPage = await pubCtx.newPage();
    for (const target of PUBLIC_ROUTES) {
      const name = `${target.key}--os-${scheme}`;
      try {
        await pubPage.goto(`${BASE_URL}${target.route}`, { waitUntil: 'networkidle', timeout: 30000 });
        await pubPage.waitForTimeout(900);
        const theme = await pubPage.evaluate(() => document.documentElement.getAttribute('data-theme'));
        const metrics = await measure(pubPage);
        await pubPage.screenshot({ path: join(OUT_DIR, `${name}.png`), fullPage: false });
        matrix.push({ ...target, viewport: '1440x900', state: `SO em ${scheme}`, dataTheme: theme, screenshot: `${name}.png`, metrics });
      } catch (error) {
        matrix.push({ ...target, viewport: '1440x900', state: `SO em ${scheme}`, error: String(error.message ?? error) });
      }
    }
    await pubCtx.close();
  }

  // --- Mobile do portal publico ---------------------------------------------
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto(`${BASE_URL}/help/genius`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: join(OUT_DIR, 'public-help-space--390x844.png') });
  matrix.push({ key: 'public-help-space-mobile', name: 'Central Publica / mobile', route: '/help/genius', viewport: '390x844', state: 'default', screenshot: 'public-help-space--390x844.png', metrics: await measure(mobilePage) });
  await mobileCtx.close();

  await context.close();
  await browser.close();

  await writeFile(join(OUT_DIR, 'matrix.json'), JSON.stringify(matrix, null, 2), 'utf8');

  const overflow = matrix.filter((entry) => entry.metrics?.horizontalOverflow);
  const errors = matrix.filter((entry) => entry.error);
  const topbarLeak = matrix.filter((entry) => (entry.metrics?.topbarActions ?? 0) > 0);

  console.log(`Capturas: ${matrix.length}`);
  console.log(`Erros: ${errors.length}`);
  console.log(`Overflow horizontal: ${overflow.length}`);
  console.log(`Identidade duplicada na topbar: ${topbarLeak.length}`);
  for (const entry of errors) console.log(`  ERRO ${entry.key} ${entry.viewport}: ${entry.error}`);
  for (const entry of overflow) console.log(`  OVERFLOW ${entry.key} ${entry.viewport}: ${entry.metrics.scrollWidth} > ${entry.metrics.clientWidth}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
