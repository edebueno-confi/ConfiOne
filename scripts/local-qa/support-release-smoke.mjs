import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { chromium } from 'playwright';

import {
  assertLocalSupabaseEnvironment,
  loadQaEnv,
  readLocalSupabaseStatus,
} from './assert-local-supabase.mjs';

const root = process.cwd();
const webRoot = join(root, 'apps', 'web');
const logDir = join(root, 'output', 'local-qa');
const manifestPath = join(logDir, 'support-release-smoke.json');
const baseUrl = process.env.LOCAL_QA_SUPPORT_WEB_URL ?? 'http://127.0.0.1:4174';
const port = Number(new URL(baseUrl).port || 4174);
const routes = ['/support/queue', '/support/tickets'];

if (port !== 4174) throw new Error('LOCAL_QA_SUPPORT_WEB_PORT_MUST_BE_4174');

const qa = loadQaEnv();
const status = readLocalSupabaseStatus({ ...process.env, ...qa });
assertLocalSupabaseEnvironment({ ...process.env, ...qa }, { status });

const accounts = [
  { role: 'platform_admin', email: qa.LOCAL_QA_ADMIN_EMAIL, password: qa.LOCAL_QA_ADMIN_PASSWORD, authorized: true },
  { role: 'support_manager', email: qa.LOCAL_QA_SUPPORT_MANAGER_EMAIL, password: qa.LOCAL_QA_SUPPORT_MANAGER_PASSWORD, authorized: true },
  { role: 'support_agent', email: qa.LOCAL_QA_SUPPORT_AGENT_EMAIL, password: qa.LOCAL_QA_SUPPORT_AGENT_PASSWORD, authorized: true },
  { role: 'dashboard_viewer', email: qa.LOCAL_QA_DASHBOARD_VIEWER_EMAIL, password: qa.LOCAL_QA_DASHBOARD_VIEWER_PASSWORD, authorized: false },
  { role: 'customer_user', email: qa.LOCAL_QA_CLIENT_EMAIL, password: qa.LOCAL_QA_CLIENT_PASSWORD, authorized: false },
];

for (const account of accounts) {
  if (!account.email || !account.password) throw new Error(`LOCAL_QA_CONFIG_MISSING: ${account.role}`);
}

mkdirSync(logDir, { recursive: true });

const serverLog = join(logDir, 'support-release-web-server.log');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const server = spawn(npmCommand, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], {
  cwd: webRoot,
  env: { ...process.env, VITE_RELEASE_SURFACE: 'full' },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
  shell: process.platform === 'win32',
});

const releasePreviewScript = join(root, 'supabase', 'qa', 'local-release-preview.mjs');
let releasePreviewEnabled = false;

server.stdout.on('data', (chunk) => appendFileSync(serverLog, chunk));
server.stderr.on('data', (chunk) => appendFileSync(serverLog, chunk));

async function stopServer() {
  if (server.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawn('taskkill.exe', ['/pid', String(server.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
  } else {
    server.kill('SIGTERM');
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

async function waitForWebServer() {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/login`);
      if (response.ok) return;
    } catch {
      // O servidor Vite ainda pode estar inicializando.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error('LOCAL_QA_SUPPORT_WEB_HEALTHCHECK_FAILED');
}

async function waitForPathChange(page, originalPath) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const pathname = new URL(page.url()).pathname;
    if (pathname !== originalPath) return pathname;
    await page.waitForTimeout(250);
  }
  return new URL(page.url()).pathname;
}

function isSupportOperationalPath(path) {
  return /\/rest\/v1\/(vw_support_|rpc\/rpc_support_)/.test(path);
}

function isSensitiveBaseTablePath(path) {
  return /\/rest\/v1\/(tickets|ticket_messages|ticket_events|ticket_attachments|customers|customer_accounts|tenants|profiles)(?:[/?]|$)/.test(path);
}

function isToleratedBootstrap401(response, responses) {
  return response.status === 401
    && response.path === '/rest/v1/vw_admin_auth_context'
    && responses.some((candidate) => candidate.path === response.path && candidate.status === 200);
}

const results = [];
let browser;
try {
  execFileSync(process.execPath, [releasePreviewScript, '--enable', '--screens=support_queue,support_tickets'], {
    cwd: root,
    stdio: 'inherit',
  });
  releasePreviewEnabled = true;
  await waitForWebServer();
  browser = await chromium.launch({ headless: true });

  for (const account of accounts) {
    for (const route of routes) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const consoleErrors = [];
      const pageErrors = [];
      const requestFailures = [];
      const responses = [];

      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('requestfailed', (request) => requestFailures.push(`${request.method()} ${request.url()}`));
      page.on('response', (response) => {
        try {
          const parsed = new URL(response.url());
          if (parsed.port !== '54321' || !parsed.pathname.startsWith('/rest/v1/')) return;
          responses.push({ method: response.request().method(), path: parsed.pathname, status: response.status() });
        } catch {
          // Respostas que não são URLs HTTP não entram na matriz.
        }
      });

      const originalPath = '/login';
      await page.goto(`${baseUrl}/login?redirectTo=${encodeURIComponent(route)}`, { waitUntil: 'domcontentloaded' });
      await page.getByLabel('Email').fill(account.email);
      await page.getByLabel('Senha').fill(account.password);
      await page.getByRole('button', { name: /entrar/i }).click();
      const reached = await waitForPathChange(page, originalPath);
      await page.waitForTimeout(1_500);

      const expectedPath = account.authorized ? route : '/access-denied';
      const unexpectedResponses = responses.filter((response) => response.status >= 400 && !isToleratedBootstrap401(response, responses));
      const toleratedBootstrap401 = responses.filter((response) => isToleratedBootstrap401(response, responses));
      const supportRequests = responses.filter((response) => isSupportOperationalPath(response.path));
      const sensitiveBaseTableRequests = responses.filter((response) => isSensitiveBaseTablePath(response.path));
      const result = {
        role: account.role,
        route,
        expectedPath,
        reachedPath: reached,
        authorized: account.authorized,
        responses,
        supportRequestCount: supportRequests.length,
        toleratedBootstrap401Count: toleratedBootstrap401.length,
        unexpectedResponses,
        sensitiveBaseTableRequests,
        consoleErrors,
        pageErrors,
        requestFailures,
      };
      results.push(result);
      await page.close();
    }
  }
} finally {
  await browser?.close();
  await stopServer();
  if (releasePreviewEnabled) {
    execFileSync(process.execPath, [releasePreviewScript, '--disable'], {
      cwd: root,
      stdio: 'inherit',
    });
  }
}

const failures = results.filter((result) => (
  result.reachedPath !== result.expectedPath
  || result.consoleErrors.length > 0
  || result.pageErrors.length > 0
  || result.requestFailures.length > 0
  || result.unexpectedResponses.length > 0
  || result.sensitiveBaseTableRequests.length > 0
  || (result.authorized && result.supportRequestCount === 0)
  || (!result.authorized && result.supportRequestCount > 0)
));

const manifest = {
  environment: 'local',
  releaseSurface: 'full',
  baseUrl,
  routes,
  results,
  failures: failures.map((result) => ({ role: result.role, route: result.route })),
  generatedAt: new Date().toISOString(),
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

if (failures.length > 0) {
  throw new Error(`SUPPORT_RELEASE_SMOKE_FAILED: ${failures.map((result) => `${result.role}:${result.route}`).join(', ')}`);
}

console.log(JSON.stringify({
  environment: 'local',
  releaseSurface: 'full',
  combinations: results.length,
  authorized: results.filter((result) => result.authorized).length,
  denied: results.filter((result) => !result.authorized).length,
  failures: 0,
  manifest: manifestPath,
}));
