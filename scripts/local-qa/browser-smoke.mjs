import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

import { assertLocalSupabaseEnvironment, loadQaEnv, readLocalSupabaseStatus } from './assert-local-supabase.mjs';

const qa = loadQaEnv();
const status = readLocalSupabaseStatus({ ...process.env, ...qa });
assertLocalSupabaseEnvironment({ ...process.env, ...qa }, { status });

const root = process.cwd();
const baseUrl = process.env.LOCAL_QA_WEB_URL ?? 'http://127.0.0.1:4173';
const port = Number(new URL(baseUrl).port || 4173);
const logDir = join(root, 'output', 'local-qa');
const serverLog = join(logDir, 'web-server.log');
mkdirSync(logDir, { recursive: true });

function isPortOccupied(portNumber) {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port: portNumber });
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
  });
}

async function waitForWebServer() {
  const deadline = Date.now() + Number(process.env.LOCAL_QA_WEB_START_TIMEOUT_MS ?? 45_000);
  let lastError = 'healthcheck ainda sem resposta';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/login`);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`LOCAL_QA_WEB_HEALTHCHECK_FAILED: ${lastError}`);
}

function startWebServer() {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npm, ['run', 'web:dev', '--', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: root,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    shell: process.platform === 'win32',
  });
  child.stdout.on('data', (chunk) => appendFileSync(serverLog, chunk));
  child.stderr.on('data', (chunk) => appendFileSync(serverLog, chunk));
  return child;
}

async function stopWebServer(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

async function waitForPathChange(page, originalPath, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const pathname = new URL(page.url()).pathname;
    if (pathname !== originalPath) return pathname;
    await page.waitForTimeout(250);
  }
  return new URL(page.url()).pathname;
}

const accounts = [
  { role: 'platform_admin', email: qa.LOCAL_QA_ADMIN_EMAIL, password: qa.LOCAL_QA_ADMIN_PASSWORD, desktop: '/inicio', mobile: '/inicio' },
  { role: 'dashboard_viewer', email: qa.LOCAL_QA_DASHBOARD_VIEWER_EMAIL, password: qa.LOCAL_QA_DASHBOARD_VIEWER_PASSWORD, desktop: '/admin/analytics', mobile: '/admin/analytics' },
  { role: 'support_manager', email: qa.LOCAL_QA_SUPPORT_MANAGER_EMAIL, password: qa.LOCAL_QA_SUPPORT_MANAGER_PASSWORD, desktop: '/support/queue', mobile: '/support/queue' },
  { role: 'support_agent', email: qa.LOCAL_QA_SUPPORT_AGENT_EMAIL, password: qa.LOCAL_QA_SUPPORT_AGENT_PASSWORD, desktop: '/support/queue', mobile: '/support/queue' },
  { role: 'customer_user', email: qa.LOCAL_QA_CLIENT_EMAIL, password: qa.LOCAL_QA_CLIENT_PASSWORD, desktop: '/portal', mobile: '/portal' },
];

for (const account of accounts) {
  if (!account.email || !account.password) throw new Error(`LOCAL_QA_CONFIG_MISSING: ${account.role}`);
}

if (await isPortOccupied(port)) {
  throw new Error(`LOCAL_QA_WEB_PORT_OCCUPIED: ${port}`);
}
const server = startWebServer();
const results = [];
const screenshots = [];
let browser;
try {
  await waitForWebServer();
  browser = await chromium.launch({ headless: true });
  for (const account of accounts) {
    for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const page = await context.newPage();
      const events = { consoleErrors: [], pageErrors: [], requestFailures: [], unexpectedResponses: [], expectedForbidden: 0, administrativeRequests: [] };
      page.on('console', (message) => { if (message.type() === 'error') events.consoleErrors.push(message.text()); });
      page.on('pageerror', (error) => events.pageErrors.push(error.message));
      page.on('requestfailed', (request) => events.requestFailures.push(`${request.method()} ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`));
      page.on('request', (request) => {
        if (account.role !== 'platform_admin' && /\/rpc\/rpc_admin_|analytics_integration_schedule|managed_integrations/.test(request.url())) {
          events.administrativeRequests.push(`${request.method()} ${request.url()}`);
        }
      });
      page.on('response', (response) => {
        const status = response.status();
        if (status === 403) events.unexpectedResponses.push(`403 ${response.url()}`);
        if ([400, 401, 404, 409, 422, 500].includes(status)) events.unexpectedResponses.push(`${status} ${response.url()}`);
      });
      await page.goto(`${baseUrl}/login?redirectTo=${encodeURIComponent(account.desktop)}`, { waitUntil: 'domcontentloaded' });
      await page.getByLabel('Email').fill(account.email);
      await page.getByLabel('Senha').fill(account.password);
      await page.getByRole('button', { name: /entrar/i }).click();
      const loginPath = await waitForPathChange(page, '/login', 20_000);
      if (loginPath === '/login') throw new Error(`LOCAL_QA_LOGIN_ROUTE_FAILED: ${account.role} ${viewport.name}`);
      const expectedPath = viewport.name === 'desktop' ? account.desktop : account.mobile;
      if (!page.url().includes(expectedPath)) throw new Error(`LOCAL_QA_ROUTE_FAILED: ${account.role} expected ${expectedPath}, got ${page.url()}`);
      await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
      await page.waitForTimeout(500);
      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      if (horizontalOverflow) throw new Error(`LOCAL_QA_HORIZONTAL_OVERFLOW: ${account.role} ${viewport.name}`);
      if (account.role === 'dashboard_viewer') {
        const text = await page.locator('body').innerText();
        if (/Sincronizar HubSpot|Exportar relatório|Configuração|Logs/.test(text)) {
          throw new Error(`LOCAL_QA_VIEWER_UI_SCOPE_FAILED: ${text.slice(0, 260)}`);
        }
      }
      await page.screenshot({ path: join(logDir, `browser-${account.role}-${viewport.name}.png`), fullPage: true });
      screenshots.push(`browser-${account.role}-${viewport.name}.png`);
      if (account.role === 'dashboard_viewer') {
        await page.goto(`${baseUrl}/admin/settings`, { waitUntil: 'domcontentloaded' });
        const deniedPath = await waitForPathChange(page, '/admin/settings', 20_000);
        if (deniedPath !== '/access-denied') throw new Error(`LOCAL_QA_VIEWER_ROUTE_NOT_BLOCKED: ${page.url()}`);
      }
      if (account.role === 'customer_user') {
        await page.goto(`${baseUrl}/support/queue`, { waitUntil: 'domcontentloaded' });
        const deniedPath = await waitForPathChange(page, '/support/queue', 20_000);
        if (deniedPath !== '/access-denied') {
          await page.screenshot({ path: join(logDir, `browser-customer-route-check-${viewport.name}.png`), fullPage: true });
          throw new Error(`LOCAL_QA_CUSTOMER_ROUTE_NOT_BLOCKED: ${page.url()} body=${(await page.locator('body').innerText()).slice(0, 240)}`);
        }
      }
      if (account.role === 'support_manager' || account.role === 'support_agent') {
        await page.goto(`${baseUrl}/admin/settings`, { waitUntil: 'domcontentloaded' });
        const deniedPath = await waitForPathChange(page, '/admin/settings', 20_000);
        if (deniedPath !== '/access-denied') throw new Error(`LOCAL_QA_SUPPORT_SETTINGS_NOT_BLOCKED: ${account.role} ${page.url()}`);
      }
      if (account.role === 'customer_user') {
        await page.goto(`${baseUrl}/admin/analytics`, { waitUntil: 'domcontentloaded' });
        const deniedPath = await waitForPathChange(page, '/admin/analytics', 20_000);
        if (deniedPath !== '/access-denied') throw new Error(`LOCAL_QA_CUSTOMER_ANALYTICS_NOT_BLOCKED: ${page.url()}`);
      }
      if (events.administrativeRequests.length) throw new Error(`LOCAL_QA_VIEWER_ADMIN_REQUEST: ${events.administrativeRequests.join(', ')}`);
      results.push({ role: account.role, viewport: viewport.name, path: expectedPath, consoleErrors: events.consoleErrors.length, pageErrors: events.pageErrors.length, requestFailures: events.requestFailures.length, requestFailureDetails: events.requestFailures, unexpectedResponses: events.unexpectedResponses.length, unexpectedResponseDetails: events.unexpectedResponses, expectedForbidden: events.expectedForbidden, administrativeRequests: events.administrativeRequests.length });
      await context.close();
    }
  }
} finally {
  if (browser) await browser.close();
  await stopWebServer(server);
}

const failures = results.filter((item) => item.consoleErrors || item.pageErrors || item.requestFailures || item.unexpectedResponses);
if (failures.length) throw new Error(`LOCAL_QA_BROWSER_SMOKE_FAILED: ${JSON.stringify(failures)}`);
console.log(JSON.stringify({ environment: 'local', framework: 'playwright', server_started_automatically: true, healthcheck: true, personas: results, screenshots }));
