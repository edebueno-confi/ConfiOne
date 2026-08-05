import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { loadQaEnv } from './assert-local-supabase.mjs';

const root = process.cwd();
const baseUrl = process.env.GSO_PREVIEW_URL ?? 'http://127.0.0.1:4181';
const outputDir = join(root, 'output', 'dashboard-pilot-v2-preview');
const qa = loadQaEnv();
const account = { email: qa.LOCAL_QA_ADMIN_EMAIL, password: qa.LOCAL_QA_ADMIN_PASSWORD };
const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };
const surfaces = [
  { key: 'summary', path: '/admin/analytics?tab=ceo' },
  { key: 'commercial', path: '/admin/analytics?tab=commercial' },
  { key: 'settings-integrations', path: '/admin/settings?section=analytics' },
];

await mkdir(outputDir, { recursive: true });

async function login(page, redirectPath) {
  await page.goto(`${baseUrl}/login?redirectTo=${encodeURIComponent(redirectPath)}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Senha').fill(account.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL((url) => new URL(url).pathname !== '/login', { timeout: 20_000 });
}

async function capture(browser, surface, theme, viewport) {
  const context = await browser.newContext({ viewport, colorScheme: theme });
  await context.addInitScript(({ preferredTheme }) => {
    try { window.localStorage.setItem('genius.theme-preference', preferredTheme); } catch {}
  }, { preferredTheme: theme });
  const page = await context.newPage();
  const events = { consoleErrors: [], pageErrors: [], requestFailures: [], unexpectedResponses: [] };
  page.on('console', (message) => { if (message.type() === 'error') events.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => events.pageErrors.push(error.message));
  page.on('requestfailed', (request) => events.requestFailures.push(`${request.method()} ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`));
  page.on('response', (response) => {
    if (response.status() >= 400 && response.status() < 600) events.unexpectedResponses.push(`${response.status()} ${response.url()}`);
  });
  const filename = `${surface.key}-${theme}-${viewport.width}x${viewport.height}.png`;
  try {
    await login(page, surface.path);
    if (new URL(page.url()).pathname + new URL(page.url()).search !== surface.path) {
      await page.goto(`${baseUrl}${surface.path}`, { waitUntil: 'domcontentloaded' });
    }
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1_500);
    const overflow = await page.evaluate(() => ({
      documentScrollWidth: document.documentElement.scrollWidth,
      documentScrollHeight: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    await page.screenshot({ path: join(outputDir, filename), fullPage: true });
    return {
      surface: surface.key,
      requestedPath: surface.path,
      route: new URL(page.url()).pathname + new URL(page.url()).search,
      theme,
      viewport,
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
const captures = [];
try {
  for (const surface of surfaces) {
    for (const theme of ['light', 'dark']) {
      for (const viewport of [desktop, mobile]) {
        captures.push(await capture(browser, surface, theme, viewport));
      }
    }
  }
} finally {
  await browser.close();
}

const manifest = {
  generatedAt: new Date().toISOString(),
  checkout: root,
  branch: process.env.GSO_GIT_BRANCH ?? 'codex/dashboard-management-rebuild-20260802',
  head: process.env.GSO_GIT_HEAD ?? 'not-injected',
  baseUrl,
  captures,
  total: captures.length,
  noConsoleErrors: captures.every((item) => item.consoleErrors.length === 0 && item.pageErrors.length === 0),
  noRequestFailures: captures.every((item) => item.requestFailures.length === 0),
  noUnexpectedResponses: captures.every((item) => item.unexpectedResponses.length === 0),
  noHorizontalOverflow: captures.every((item) => !item.overflow.horizontalOverflow),
};
await writeFile(join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: join(outputDir, 'manifest.json'), total: manifest.total, noConsoleErrors: manifest.noConsoleErrors, noRequestFailures: manifest.noRequestFailures, noUnexpectedResponses: manifest.noUnexpectedResponses, noHorizontalOverflow: manifest.noHorizontalOverflow }));
