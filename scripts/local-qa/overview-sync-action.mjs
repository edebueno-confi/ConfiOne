import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { loadQaEnv } from './assert-local-supabase.mjs';

const root = process.cwd();
const baseUrl = process.env.GSO_OVERVIEW_SYNC_URL ?? 'http://127.0.0.1:4186';
const outputDir = process.env.GSO_OVERVIEW_SYNC_OUTPUT ?? 'output/high-density-overview-sync-action-20260803';
const qa = loadQaEnv();
const account = { email: qa.LOCAL_QA_ADMIN_EMAIL, password: qa.LOCAL_QA_ADMIN_PASSWORD };

await mkdir(outputDir, { recursive: true });

function startPreview() {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return spawn(npm, ['run', 'preview', '--workspace', '@genius-support-os/web', '--', '--host', '127.0.0.1', '--port', new URL(baseUrl).port], {
    cwd: root,
    env: process.env,
    stdio: ['ignore', 'ignore', 'ignore'],
    windowsHide: true,
    shell: process.platform === 'win32',
  });
}

async function waitForPreview() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${baseUrl}/login`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('QA_PREVIEW_HEALTHCHECK_FAILED');
}

async function stopPreview(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
  else child.kill('SIGTERM');
}

async function login(page) {
  const path = '/admin/analytics?tab=overview';
  await page.goto(`${baseUrl}/login?redirectTo=${encodeURIComponent(path)}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Senha').fill(account.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL((url) => new URL(url).pathname !== '/login', { timeout: 20_000 });
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(700);
}

const preview = startPreview();
let browser;
try {
  await waitForPreview();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  const page = await context.newPage();
  const events = { consoleErrors: [], pageErrors: [], requestFailures: [], unexpectedResponses: [] };
  let syncStarted = false;
  let activeStatusReads = 0;
  page.on('console', (message) => { if (message.type() === 'error') events.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => events.pageErrors.push(error.message));
  page.on('requestfailed', (request) => events.requestFailures.push(`${request.method()} ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`));
  page.on('response', (response) => { if (response.status() >= 400) events.unexpectedResponses.push(`${response.status()} ${response.url()}`); });

  await page.route('**/rest/v1/rpc/rpc_analytics_source_status', async (route) => {
    const response = await route.fetch();
    const payload = await response.json();
    if (syncStarted) {
      const activeRead = activeStatusReads++ === 0;
      for (const key of ['hubspot', 'omie']) payload[key] = { ...payload[key], status: activeRead ? 'syncing' : 'fresh', currentRunStatus: activeRead ? 'running' : null, hasValidSnapshot: true };
      payload.globalStatus = activeRead ? 'syncing' : 'fresh';
    }
    await route.fulfill({ response, body: JSON.stringify(payload) });
  });
  await page.route('**/functions/v1/analytics-sequential-sync', async (route) => {
    syncStarted = true;
    await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ status: 'partial', message: 'qa overview action' }) });
  });

  await login(page);
  const button = page.getByTestId('overview-sync-sources');
  await button.waitFor({ timeout: 15_000 });
  await button.click();
  await page.locator('.gso-genie-sync-overlay, .gso-genie-sync-banner').waitFor({ timeout: 5_000 });
  await page.screenshot({ path: join(outputDir, 'overview-sync-active.png'), fullPage: true });
  const active = await page.evaluate(() => ({
    overlay: Boolean(document.querySelector('.gso-genie-sync-overlay')),
    banner: Boolean(document.querySelector('.gso-genie-sync-banner')),
    buttonDisabled: document.querySelector('[data-testid="overview-sync-sources"]')?.hasAttribute('disabled') ?? false,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));
  await page.waitForTimeout(2_200);
  await page.screenshot({ path: join(outputDir, 'overview-sync-published.png'), fullPage: true });
  const published = await page.evaluate(() => ({
    overlay: Boolean(document.querySelector('.gso-genie-sync-overlay')),
    banner: Boolean(document.querySelector('.gso-genie-sync-banner')),
    buttonDisabled: document.querySelector('[data-testid="overview-sync-sources"]')?.hasAttribute('disabled') ?? false,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));
  const manifest = {
    generatedAt: new Date().toISOString(),
    checkout: root,
    baseUrl,
    active,
    published,
    ...events,
    noConsoleErrors: events.consoleErrors.length === 0 && events.pageErrors.length === 0,
    noRequestFailures: events.requestFailures.filter((failure) => !failure.includes('net::ERR_ABORTED')).length === 0,
    abortedRequestFailureCount: events.requestFailures.filter((failure) => failure.includes('net::ERR_ABORTED')).length,
    noUnexpectedResponses: events.unexpectedResponses.length === 0,
    activeStateCaptured: (active.overlay || active.banner) && active.buttonDisabled,
    publishedStateCaptured: !published.overlay && !published.banner && !published.buttonDisabled,
    noHorizontalOverflow: !active.horizontalOverflow && !published.horizontalOverflow,
  };
  await writeFile(join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: join(root, outputDir, 'manifest.json'), ...manifest }));
  if (!manifest.noConsoleErrors || !manifest.noRequestFailures || !manifest.noUnexpectedResponses || !manifest.activeStateCaptured || !manifest.publishedStateCaptured || !manifest.noHorizontalOverflow) process.exitCode = 1;
  await context.close();
} finally {
  if (browser) await browser.close();
  await stopPreview(preview);
}
