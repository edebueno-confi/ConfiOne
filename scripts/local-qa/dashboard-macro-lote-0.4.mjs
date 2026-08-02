import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { chromium } from 'playwright';

import { loadQaEnv, readLocalSupabaseStatus } from './assert-local-supabase.mjs';

const qa = loadQaEnv();
const status = readLocalSupabaseStatus({ ...process.env, ...qa });
const root = process.cwd();
const outputDir = join(root, 'output', 'dashboard-macro-lote-0.4');
mkdirSync(outputDir, { recursive: true });

const accounts = {
  admin: { email: qa.LOCAL_QA_ADMIN_EMAIL, password: qa.LOCAL_QA_ADMIN_PASSWORD },
  viewer: { email: qa.LOCAL_QA_DASHBOARD_VIEWER_EMAIL, password: qa.LOCAL_QA_DASHBOARD_VIEWER_PASSWORD },
};

function isPortOccupied(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
  });
}

async function waitForServer(url, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/login`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`LOCAL_QA_WEB_HEALTHCHECK_FAILED: ${url}`);
}

function startServer(port, env = {}) {
  const logPath = join(outputDir, `web-server-${port}.log`);
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npm, ['run', 'web:dev', '--', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    shell: process.platform === 'win32',
  });
  child.stdout.on('data', (chunk) => appendFileSync(logPath, chunk));
  child.stderr.on('data', (chunk) => appendFileSync(logPath, chunk));
  return child;
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
  await new Promise((resolve) => setTimeout(resolve, 750));
}

async function login(page, baseUrl, account) {
  await page.goto(`${baseUrl}/login?redirectTo=${encodeURIComponent('/admin/analytics')}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Senha').fill(account.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const pathname = new URL(page.url()).pathname;
    if (pathname !== '/login') {
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      return pathname;
    }
    await page.waitForTimeout(250);
  }
  throw new Error(`LOCAL_QA_LOGIN_ROUTE_FAILED: ${page.url()}`);
}

async function capture({ key, baseUrl, account, path, viewport, filename, releaseMode }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const events = { consoleErrors: [], pageErrors: [], requestFailures: [], unexpectedResponses: [] };
  page.on('console', (message) => { if (message.type() === 'error') events.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => events.pageErrors.push(error.message));
  page.on('requestfailed', (request) => events.requestFailures.push(`${request.method()} ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`));
  page.on('response', (response) => {
    if ([400, 401, 403, 404, 409, 422, 500].includes(response.status())) {
      events.unexpectedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  try {
    const loginPath = await login(page, baseUrl, account);
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1_500);
    const bodyText = await page.locator('body').innerText();
    const overflow = await page.evaluate(() => ({
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    const sourceState = bodyText.includes('OMIE indisponível') || bodyText.includes('Dados financeiros indisponíveis') || bodyText.includes('Fonte financeira não configurada')
      ? 'omie-unavailable'
      : bodyText.includes('Indicadores de Customer Success ainda não configurados') || bodyText.includes('não publicado')
        ? 'explicitly-unavailable'
        : bodyText.includes('Nenhum dado') || bodyText.includes('sem dados')
          ? 'empty'
          : 'rendered';
    await page.screenshot({ path: join(outputDir, filename), fullPage: true });
    return {
      key,
      route: new URL(page.url()).pathname + new URL(page.url()).search,
      requestedRoute: path,
      viewport,
      profile: account === accounts.viewer ? 'dashboard_viewer' : 'platform_admin',
      releaseMode,
      loginPath,
      sourceState,
      consoleErrors: events.consoleErrors,
      pageErrors: events.pageErrors,
      requestFailures: events.requestFailures,
      unexpectedResponses: events.unexpectedResponses,
      overflow,
      screenshot: filename,
    };
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
const checks = [];
let fullServer;
try {
  const firstReleasePort = 4177;
  if (await isPortOccupied(firstReleasePort)) throw new Error(`LOCAL_QA_WEB_PORT_OCCUPIED: ${firstReleasePort}`);
  const firstReleaseServer = startServer(firstReleasePort);
  const baseUrl = `http://127.0.0.1:${firstReleasePort}`;
  await waitForServer(baseUrl);
  const desktop = { width: 1440, height: 900 };
  const wide = { width: 1280, height: 900 };
  const intermediate = { width: 1024, height: 900 };
  checks.push(await capture({ key: 'executive-desktop', baseUrl, account: accounts.viewer, path: '/admin/analytics?tab=ceo', viewport: desktop, filename: '01-executive-desktop-1440.png', releaseMode: 'first-release' }));
  checks.push(await capture({ key: 'commercial-desktop', baseUrl, account: accounts.admin, path: '/admin/analytics?tab=commercial', viewport: desktop, filename: '02-commercial-desktop-1440.png', releaseMode: 'first-release' }));
  checks.push(await capture({ key: 'support-desktop', baseUrl, account: accounts.admin, path: '/admin/analytics?tab=support', viewport: desktop, filename: '03-support-desktop-1440.png', releaseMode: 'first-release' }));
  checks.push(await capture({ key: 'support-wide-1280', baseUrl, account: accounts.admin, path: '/admin/analytics?tab=support', viewport: wide, filename: '04-support-wide-1280.png', releaseMode: 'first-release' }));
  checks.push(await capture({ key: 'support-intermediate-1024', baseUrl, account: accounts.admin, path: '/admin/analytics?tab=support', viewport: intermediate, filename: '05-support-intermediate-1024.png', releaseMode: 'first-release' }));
  checks.push(await capture({ key: 'finance-desktop', baseUrl, account: accounts.admin, path: '/admin/analytics?tab=finance', viewport: desktop, filename: '06-finance-desktop-1440.png', releaseMode: 'first-release' }));
  checks.push(await capture({ key: 'finance-intermediate-1024', baseUrl, account: accounts.admin, path: '/admin/analytics?tab=finance', viewport: intermediate, filename: '07-finance-intermediate-1024.png', releaseMode: 'first-release' }));
  checks.push(await capture({ key: 'settings-integrations-desktop', baseUrl, account: accounts.admin, path: '/admin/settings?section=analytics', viewport: desktop, filename: '08-settings-integrations-desktop-1440.png', releaseMode: 'first-release' }));

  if (await isPortOccupied(4178)) throw new Error('LOCAL_QA_WEB_PORT_OCCUPIED: 4178');
  fullServer = startServer(4178, { VITE_RELEASE_SURFACE: 'full' });
  await waitForServer('http://127.0.0.1:4178');
  checks.push(await capture({ key: 'customer-success-full-mode', baseUrl: 'http://127.0.0.1:4178', account: accounts.admin, path: '/admin/analytics?tab=customer-success', viewport: desktop, filename: '09-customer-success-full-preview-1440.png', releaseMode: 'full-preview-only' }));
  await stopServer(firstReleaseServer);
} finally {
  await browser.close();
  await stopServer(fullServer);
}

const summary = {
  generatedAt: new Date().toISOString(),
  environment: 'local',
  sourceCheckout: root,
  supabaseApiHost: new URL(status.API_URL).host,
  checks,
  allRoutesAuthenticated: checks.every((check) => check.loginPath !== '/login'),
  noConsoleErrors: checks.every((check) => check.consoleErrors.length === 0 && check.pageErrors.length === 0),
  noRequestFailures: checks.every((check) => check.requestFailures.length === 0),
  noUnexpectedResponses: checks.every((check) => check.unexpectedResponses.length === 0),
  noHorizontalOverflow: checks.every((check) => !check.overflow.horizontalOverflow),
  customerSuccessIsExplicitlyUnavailable: checks.some((check) => check.key === 'customer-success-full-mode' && check.sourceState === 'explicitly-unavailable'),
  notes: [
    'Customer Success foi capturado em full-preview-only porque não está no allowlist da primeira release.',
    'Financeiro deve permanecer OMIE-only; a ausência de linhas atuais é registrada como indisponível/sem dados.',
    'Nenhuma credencial ou token é persistido no artefato.',
  ],
};
await import('node:fs/promises').then(({ writeFile }) => writeFile(join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8'));
console.log(JSON.stringify({ output: join(outputDir, 'summary.json'), checks: checks.length, noConsoleErrors: summary.noConsoleErrors, noHorizontalOverflow: summary.noHorizontalOverflow }));
