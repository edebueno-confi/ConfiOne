import { chromium } from 'playwright';
import { readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const baseUrl = process.env.GSO_BASE_URL ?? 'http://127.0.0.1:4173';
const credentialsPath = process.env.GSO_QA_CREDENTIALS_PATH ?? '.tmp/dashboard-viewer-credentials.json';
const fixture = spawnSync(process.execPath, ['supabase/qa/create-local-dashboard-viewer-fixture.mjs'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});
if (fixture.status !== 0) {
  console.error(fixture.stderr || fixture.stdout);
  process.exit(fixture.status ?? 1);
}

const credentials = JSON.parse(readFileSync(credentialsPath, 'utf8'));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const requestFailures = [];
page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()));
page.on('pageerror', (error) => consoleErrors.push(error.message));
page.on('requestfailed', (request) => {
  const failure = request.failure()?.errorText ?? '';
  if (!/aborted|cancelled/i.test(failure)) requestFailures.push(`${request.method()} ${request.url()} (${failure})`);
});

const results = [];
try {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Senha').fill(credentials.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/\/inicio/, { timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

  const bodyText = await page.locator('body').innerText();
  results.push({
    route: new URL(page.url()).pathname,
    dashboardVisible: /Visão Executiva|VisÃ£o Executiva/.test(bodyText),
    forbiddenNavigationHidden: !/(Configuração|ConfiguraÃ§Ã£o|Logs|Portal do Cliente|Knowledge)/.test(bodyText),
    dashboardVisible: /Vis\u00e3o executiva/i.test(bodyText),
    forbiddenNavigationHidden: !/(Configura\u00e7\u00e3o|Logs|Portal do Cliente|Knowledge)/i.test(bodyText),
    dateFilters: await page.locator('input[type="date"]').count(),
    horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2),
  });

  for (const route of ['/admin/knowledge', '/admin/settings', '/admin/system', '/admin/logs', '/admin/customer-portal', '/portal', '/cs', '/support', '/engineering', '/internal-actions']) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_500);
    results.push({ route, redirectedToReception: new URL(page.url()).pathname === '/inicio' });
  }

  await page.goto(`${baseUrl}/admin/analytics`, { waitUntil: 'networkidle' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: 'output/playwright/dashboard-viewer-dark.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'output/playwright/dashboard-viewer-mobile.png', fullPage: true });
} finally {
  await browser.close();
  rmSync(credentialsPath, { force: true });
}

console.log(JSON.stringify({ results, consoleErrors, requestFailures }, null, 2));
const redirected = results.filter((item) => 'redirectedToReception' in item);
if (consoleErrors.length || requestFailures.length || results.some((item) => item.horizontalOverflow === false) || redirected.some((item) => !item.redirectedToReception)) process.exitCode = 1;
