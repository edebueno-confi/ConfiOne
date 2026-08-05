import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { loadQaEnv } from './assert-local-supabase.mjs';

const root = process.cwd();
const baseUrl = process.env.GSO_GENIE_QA_URL ?? 'http://127.0.0.1:4184';
const outputDir = process.env.GSO_GENIE_QA_OUTPUT ?? 'C:\\Projetos\\GSO-artifacts\\high-density-ui-rebuild-20260803\\qa-genie-states';
const port = new URL(baseUrl).port || '4184';
const qa = loadQaEnv();
const account = { email: qa.LOCAL_QA_ADMIN_EMAIL, password: qa.LOCAL_QA_ADMIN_PASSWORD };
const cases = [
  { key: 'blocking', theme: 'light', viewport: { width: 1440, height: 900 }, validSnapshot: false, status: 'syncing', runStatus: 'running' },
  { key: 'nonblocking', theme: 'dark', viewport: { width: 1440, height: 900 }, validSnapshot: true, status: 'syncing', runStatus: 'running' },
  { key: 'failed', theme: 'light', viewport: { width: 390, height: 844 }, validSnapshot: true, status: 'failed', runStatus: 'failed' },
  { key: 'timed-out', theme: 'dark', viewport: { width: 768, height: 1024 }, validSnapshot: false, status: 'syncing', runStatus: 'running', fastForwardClock: true },
  { key: 'abandoned-reduced-motion', theme: 'light', viewport: { width: 390, height: 844 }, validSnapshot: true, status: 'failed', runStatus: 'abandoned', reducedMotion: true },
];

await mkdir(outputDir, { recursive: true });

function startPreview() {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return spawn(npm, ['run', 'preview', '--workspace', '@genius-support-os/web', '--', '--host', '127.0.0.1', '--port', port], {
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
      const response = await fetch(`${baseUrl}/login`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('QA_PREVIEW_HEALTHCHECK_FAILED');
}

async function stopPreview(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
  else child.kill('SIGTERM');
  await new Promise((resolve) => setTimeout(resolve, 750));
}

async function login(page) {
  await page.goto(`${baseUrl}/login?redirectTo=${encodeURIComponent('/admin/settings/dashboard-sources')}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Senha').fill(account.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL((url) => new URL(url).pathname !== '/login', { timeout: 20_000 });
  await page.goto(`${baseUrl}/admin/settings/dashboard-sources`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function inspect(browser, item) {
  const context = await browser.newContext({ viewport: item.viewport, colorScheme: item.theme, reducedMotion: item.reducedMotion ? 'reduce' : 'no-preference' });
  await context.addInitScript(({ preferredTheme }) => {
    try { window.localStorage.setItem('genius.theme-preference', preferredTheme); } catch {}
  }, { preferredTheme: item.theme });
  const page = await context.newPage();
  const events = { consoleErrors: [], pageErrors: [], requestFailures: [], unexpectedResponses: [] };
  page.on('console', (message) => { if (message.type() === 'error') events.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => events.pageErrors.push(error.message));
  page.on('requestfailed', (request) => events.requestFailures.push(`${request.method()} ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`));
  page.on('response', (response) => { if (response.status() >= 400) events.unexpectedResponses.push(`${response.status()} ${response.url()}`); });

  await page.route('**/rest/v1/rpc/rpc_analytics_source_status', async (route) => {
    const response = await route.fetch();
    const payload = await response.json();
    for (const key of ['hubspot', 'omie']) {
      payload[key] = { ...payload[key], status: item.status, currentRunStatus: item.runStatus, hasValidSnapshot: item.validSnapshot };
    }
    payload.globalStatus = item.status;
    await route.fulfill({ response, body: JSON.stringify(payload) });
  });
  await page.route('**/functions/v1/analytics-sequential-sync', async (route) => {
    if (item.key === 'failed') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'blocked', message: 'qa_failure' }) });
      return;
    }
    await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ status: 'partial', message: 'qa visual state' }) });
  });

  try {
    await login(page);
    const button = page.getByRole('button', { name: 'Atualizar painel completo' });
    await button.click();
    if (item.fastForwardClock) {
      await page.waitForTimeout(2_000);
      await page.evaluate(() => {
        const originalNow = Date.now;
        Date.now = () => originalNow() + 6 * 60 * 1000;
      });
    }
    const expectedCopy = item.key === 'blocking'
      ? 'O Gênio está abrindo caminho para os dados'
      : item.key === 'nonblocking'
        ? 'O Gênio está abrindo caminho para os dados'
        : item.key === 'failed'
          ? 'O Gênio encontrou um desvio no caminho'
          : item.key === 'timed-out'
            ? 'O Gênio ainda está aguardando uma resposta'
            : 'O Gênio interrompeu esta tentativa';
    await page.getByText(expectedCopy, { exact: true }).waitFor({ timeout: 15_000 });
    const screenshot = `${item.key}.png`;
    await page.screenshot({ path: join(outputDir, screenshot), fullPage: true });
    const state = await page.evaluate(() => {
      const overlay = document.querySelector('.gso-genie-sync-overlay');
      const banner = document.querySelector('.gso-genie-sync-banner');
      const mascot = document.querySelector('.gso-genie-sync-mascot');
      return {
        hasBlockingOverlay: Boolean(overlay),
        hasNonBlockingBanner: Boolean(banner),
        ariaBusy: overlay?.getAttribute('aria-busy') ?? banner?.getAttribute('aria-busy') ?? null,
        animationDuration: mascot ? getComputedStyle(mascot).animationDuration : null,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    });
    return { ...item, screenshot, state, ...events };
  } finally {
    await context.close();
  }
}

const preview = startPreview();
const captures = [];
let browser;
try {
  await waitForPreview();
  browser = await chromium.launch({ headless: true });
  for (const item of cases) captures.push(await inspect(browser, item));
} finally {
  if (browser) await browser.close();
  await stopPreview(preview);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  checkout: root,
  baseUrl,
  captures,
  total: captures.length,
  noConsoleErrors: captures.every((item) => item.consoleErrors.length === 0 && item.pageErrors.length === 0),
  noRequestFailures: captures.every((item) => item.requestFailures.filter((failure) => !failure.includes('net::ERR_ABORTED')).length === 0),
  noUnexpectedResponses: captures.every((item) => item.unexpectedResponses.length === 0),
  noHorizontalOverflow: captures.every((item) => !item.state.horizontalOverflow),
  blockingStateCaptured: captures.some((item) => item.state.hasBlockingOverlay),
  nonBlockingStateCaptured: captures.some((item) => item.state.hasNonBlockingBanner),
  terminalStatesCaptured: captures.filter((item) => ['failed', 'timed-out', 'abandoned-reduced-motion'].includes(item.key)).every((item) => item.state.hasNonBlockingBanner && item.state.ariaBusy === 'false'),
  reducedMotionCaptured: captures.some((item) => item.key === 'abandoned-reduced-motion' && Number.parseFloat(item.state.animationDuration) <= 0.001),
};
await writeFile(join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: join(outputDir, 'manifest.json'), total: manifest.total, noConsoleErrors: manifest.noConsoleErrors, noRequestFailures: manifest.noRequestFailures, noUnexpectedResponses: manifest.noUnexpectedResponses, noHorizontalOverflow: manifest.noHorizontalOverflow, blockingStateCaptured: manifest.blockingStateCaptured, nonBlockingStateCaptured: manifest.nonBlockingStateCaptured, terminalStatesCaptured: manifest.terminalStatesCaptured, reducedMotionCaptured: manifest.reducedMotionCaptured }));
if (!manifest.noConsoleErrors || !manifest.noRequestFailures || !manifest.noUnexpectedResponses || !manifest.noHorizontalOverflow || !manifest.blockingStateCaptured || !manifest.nonBlockingStateCaptured || !manifest.terminalStatesCaptured || !manifest.reducedMotionCaptured) process.exitCode = 1;
