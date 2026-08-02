import { mkdir, writeFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { loadQaEnv } from './assert-local-supabase.mjs';

const root = process.cwd();
const baseUrl = process.env.GSO_PREVIEW_URL ?? 'http://127.0.0.1:4183';
const outputDir = join(root, 'output', 'dashboard-runtime-v3-preview');
const qa = loadQaEnv();
const account = { email: qa.LOCAL_QA_ADMIN_EMAIL, password: qa.LOCAL_QA_ADMIN_PASSWORD };
const surfaces = [
  { key: 'overview', path: '/admin/analytics?tab=overview' },
  { key: 'finance', path: '/admin/analytics?tab=finance' },
  { key: 'integrations', path: '/admin/settings/integrations' },
  { key: 'dashboard-sources', path: '/admin/settings/dashboard-sources' },
  { key: 'sync-history', path: '/admin/settings/sync-history' },
];
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

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

async function login(page, path) {
  await page.goto(`${baseUrl}/login?redirectTo=${encodeURIComponent(path)}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Senha').fill(account.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL((url) => new URL(url).pathname !== '/login', { timeout: 20_000 });
  const current = new URL(page.url());
  if (current.pathname + current.search !== path) {
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(700);
}

async function inspect(browser, surface, theme, viewport) {
  const context = await browser.newContext({ viewport, colorScheme: theme });
  await context.addInitScript(({ preferredTheme }) => {
    try { window.localStorage.setItem('genius.theme-preference', preferredTheme); } catch {}
  }, { preferredTheme: theme });
  const page = await context.newPage();
  const events = { consoleErrors: [], pageErrors: [], requestFailures: [], unexpectedResponses: [] };
  page.on('console', (message) => { if (message.type() === 'error') events.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => events.pageErrors.push(error.message));
  page.on('requestfailed', (request) => events.requestFailures.push(`${request.method()} ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`));
  page.on('response', (response) => { if (response.status() >= 400) events.unexpectedResponses.push(`${response.status()} ${response.url()}`); });
  try {
    await login(page, surface.path);
    const bodyText = await page.locator('body').innerText();
    const overflow = await page.evaluate(() => ({
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    const forbiddenCopy = [
      'SOAP-ENV',
      'SOAP-ERROR',
      'APP_KEY',
      'APP_SECRET',
      'Token privado',
      'service_role',
      'Modo de execução',
      'Diagnóstico read-only',
      'Sincronizar CS / Suporte',
    ];
    const forbiddenFound = forbiddenCopy.filter((value) => bodyText.includes(value));
    const financeDirectRetry = surface.key === 'finance' && bodyText.includes('Tentar novamente');
    const statusContradiction = bodyText.includes('Atualizada') && bodyText.includes('sincronização não registrada');
    const duplicateSourceStatus = surface.key === 'overview' && bodyText.includes('Pulso das fontes');
    const integrationFields = surface.key === 'integrations'
      ? { hasApplicationKey: bodyText.includes('Chave da aplicação'), hasApplicationSecret: bodyText.includes('Segredo da aplicação'), exposesInternalNames: bodyText.includes('APP_KEY') || bodyText.includes('APP_SECRET'), hasModeField: bodyText.includes('Modo') }
      : null;
    const screenshot = `${surface.key}-${theme}-${viewport.name}.png`;
    await page.screenshot({ path: join(outputDir, screenshot), fullPage: true });
    const blockingRequestFailures = events.requestFailures.filter((failure) => !failure.includes('net::ERR_ABORTED'));
    return {
      surface: surface.key,
      requestedRoute: surface.path,
      route: new URL(page.url()).pathname + new URL(page.url()).search,
      theme,
      viewport,
      screenshot,
      forbiddenFound,
      financeDirectRetry,
      statusContradiction,
      duplicateSourceStatus,
      integrationFields,
      overflow,
      blockingRequestFailures,
      ...events,
    };
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
      for (const viewport of viewports) captures.push(await inspect(browser, surface, theme, viewport));
    }
  }
} finally {
  if (browser) await browser.close();
  await stopPreview(preview);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  checkout: root,
  baseUrl,
  surfaces: surfaces.map((surface) => surface.key),
  viewports,
  captures,
  screenshotTotal: captures.length,
  noConsoleErrors: captures.every((item) => item.consoleErrors.length === 0 && item.pageErrors.length === 0),
  noRequestFailures: captures.every((item) => item.requestFailures.length === 0),
  noBlockingRequestFailures: captures.every((item) => item.blockingRequestFailures.length === 0),
  abortedRequestFailureCount: captures.reduce((sum, item) => sum + item.requestFailures.filter((failure) => failure.includes('net::ERR_ABORTED')).length, 0),
  noUnexpectedResponses: captures.every((item) => item.unexpectedResponses.length === 0),
  noHorizontalOverflow: captures.every((item) => !item.overflow.horizontalOverflow),
  noForbiddenCopy: captures.every((item) => item.forbiddenFound.length === 0),
  noFinanceDirectRetry: captures.every((item) => !item.financeDirectRetry),
  noStatusContradictions: captures.every((item) => !item.statusContradiction),
  noDuplicateSourceStatus: captures.every((item) => !item.duplicateSourceStatus),
  integrationsExposeRequiredFields: captures.filter((item) => item.surface === 'integrations').every((item) => item.integrationFields?.hasApplicationKey && item.integrationFields?.hasApplicationSecret && !item.integrationFields?.exposesInternalNames && !item.integrationFields?.hasModeField),
};
await writeFile(join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: join(outputDir, 'manifest.json'), screenshotTotal: manifest.screenshotTotal, noConsoleErrors: manifest.noConsoleErrors, noRequestFailures: manifest.noRequestFailures, noBlockingRequestFailures: manifest.noBlockingRequestFailures, abortedRequestFailureCount: manifest.abortedRequestFailureCount, noUnexpectedResponses: manifest.noUnexpectedResponses, noHorizontalOverflow: manifest.noHorizontalOverflow, noForbiddenCopy: manifest.noForbiddenCopy, noFinanceDirectRetry: manifest.noFinanceDirectRetry, noStatusContradictions: manifest.noStatusContradictions, noDuplicateSourceStatus: manifest.noDuplicateSourceStatus, integrationsExposeRequiredFields: manifest.integrationsExposeRequiredFields }));
if (!manifest.noConsoleErrors || !manifest.noBlockingRequestFailures || !manifest.noUnexpectedResponses || !manifest.noHorizontalOverflow || !manifest.noForbiddenCopy || !manifest.noFinanceDirectRetry || !manifest.noStatusContradictions || !manifest.noDuplicateSourceStatus || !manifest.integrationsExposeRequiredFields) process.exitCode = 1;
