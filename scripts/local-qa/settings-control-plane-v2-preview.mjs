import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { loadQaEnv } from './assert-local-supabase.mjs';

const root = process.cwd();
const baseUrl = process.env.GSO_PREVIEW_URL ?? 'http://127.0.0.1:4181';
const port = new URL(baseUrl).port || '4181';
const outputDir = join(root, 'output', 'settings-control-plane-v2-preview');
const qa = loadQaEnv();
const account = { email: qa.LOCAL_QA_ADMIN_EMAIL, password: qa.LOCAL_QA_ADMIN_PASSWORD };
const surfaces = [
  { key: 'integrations', path: '/admin/settings/integrations' },
  { key: 'dashboard-sources', path: '/admin/settings/dashboard-sources' },
  { key: 'sync-history', path: '/admin/settings/sync-history' },
];
const captureViewports = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];
const smokeViewport = { width: 1024, height: 768 };

await mkdir(outputDir, { recursive: true });

function startPreview() {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return spawn(npm, ['run', 'preview', '--workspace', '@genius-support-os/web', '--', '--host', '127.0.0.1', '--port', port], {
    cwd: root,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
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
  if (process.platform === 'win32') spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
  else child.kill('SIGTERM');
  await new Promise((resolve) => setTimeout(resolve, 500));
}

async function login(page, path) {
  await page.goto(`${baseUrl}/login?redirectTo=${encodeURIComponent(path)}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Senha').fill(account.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL((url) => new URL(url).pathname !== '/login', { timeout: 20_000 });
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function inspect(browser, surface, theme, viewport, screenshot) {
  const context = await browser.newContext({ viewport, colorScheme: theme });
  await context.addInitScript(({ preferredTheme }) => {
    try { window.localStorage.setItem('genius.theme-preference', preferredTheme); } catch {}
  }, { preferredTheme: theme });
  const page = await context.newPage();
  await login(page, surface.path);
  const events = { consoleErrors: [], pageErrors: [], requestFailures: [], unexpectedResponses: [] };
  page.on('console', (message) => { if (message.type() === 'error') events.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => events.pageErrors.push(error.message));
  page.on('requestfailed', (request) => events.requestFailures.push(`${request.method()} ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`));
  page.on('response', (response) => { if (response.status() >= 400) events.unexpectedResponses.push(`${response.status()} ${response.url()}`); });
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => ({
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    const bodyText = await page.locator('body').innerText();
    const forbiddenCopy = ['Dashboard e Analytics', 'Diagnóstico read-only', 'Executar diagnóstico', 'Substituir credencial no Vault', 'Modo de execução', 'contas_a_receber'];
    const forbiddenFound = forbiddenCopy.filter((value) => bodyText.includes(value));
    if (screenshot) await page.screenshot({ path: join(outputDir, `${surface.key}-${theme}-${viewport.width}x${viewport.height}.png`), fullPage: true });
    return { surface: surface.key, path: surface.path, route: new URL(page.url()).pathname + new URL(page.url()).search, theme, viewport, screenshot: screenshot ? `${surface.key}-${theme}-${viewport.width}x${viewport.height}.png` : null, forbiddenFound, overflow, ...events };
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
  for (const surface of surfaces) {
    for (const theme of ['light', 'dark']) {
      for (const viewport of captureViewports) captures.push(await inspect(browser, surface, theme, viewport, true));
      captures.push(await inspect(browser, surface, theme, smokeViewport, false));
    }
  }
} finally {
  if (browser) await browser.close();
  await stopPreview(preview);
}

const screenshotCaptures = captures.filter((item) => item.screenshot);
const manifest = {
  generatedAt: new Date().toISOString(),
  checkout: root,
  baseUrl,
  surfaces: surfaces.map((surface) => surface.key),
  captureViewports,
  smokeViewport,
  captures,
  screenshotTotal: screenshotCaptures.length,
  totalChecks: captures.length,
  noConsoleErrors: captures.every((item) => item.consoleErrors.length === 0 && item.pageErrors.length === 0),
  noRequestFailures: captures.every((item) => item.requestFailures.length === 0),
  noUnexpectedResponses: captures.every((item) => item.unexpectedResponses.length === 0),
  noHorizontalOverflow: captures.every((item) => !item.overflow.horizontalOverflow),
  noForbiddenCopy: captures.every((item) => item.forbiddenFound.length === 0),
};
await writeFile(join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: join(outputDir, 'manifest.json'), screenshotTotal: manifest.screenshotTotal, totalChecks: manifest.totalChecks, noConsoleErrors: manifest.noConsoleErrors, noRequestFailures: manifest.noRequestFailures, noUnexpectedResponses: manifest.noUnexpectedResponses, noHorizontalOverflow: manifest.noHorizontalOverflow, noForbiddenCopy: manifest.noForbiddenCopy }));
if (!manifest.noConsoleErrors || !manifest.noRequestFailures || !manifest.noUnexpectedResponses || !manifest.noHorizontalOverflow || !manifest.noForbiddenCopy) process.exitCode = 1;
