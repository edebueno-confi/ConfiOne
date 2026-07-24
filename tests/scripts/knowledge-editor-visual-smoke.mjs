import fs from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.env.GSO_BASE_URL ?? 'http://127.0.0.1:4175';
const adminEmail = process.env.GSO_SMOKE_ADMIN_EMAIL ?? 'ede.oliveira@confi.com.vc';
const auth = fs.readFileSync('docs/LOCAL_QA_AUTH.md', 'utf8');
const password = auth.match(new RegExp(`${adminEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?senha:\\s*([^\\r\\n]+)`))?.[1]?.trim();
if (!password) throw new Error('QA admin password not found.');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const requestFailures = [];
page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()));
page.on('pageerror', (error) => consoleErrors.push(error.message));
page.on('requestfailed', (request) => requestFailures.push(request.url()));

await page.goto(`${baseUrl}/admin/knowledge/964e5bf7-7de7-4bf4-828e-f199ea40e45a/edit`, { waitUntil: 'domcontentloaded' });
if (page.url().includes('/login')) {
  await page.locator('input[type=email]').fill(adminEmail);
  await page.locator('input[type=password]').fill(password);
  await Promise.all([
    page.waitForURL((url) => !String(url).includes('/login'), { timeout: 20_000 }),
    page.getByRole('button', { name: /Entrar|Validando/i }).click(),
  ]);
}
await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
await page.getByText('Configurações editoriais', { exact: false }).waitFor({ timeout: 30_000 });

const snapshots = [];
for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
  await page.setViewportSize(viewport);
  const name = `output/playwright/knowledge-editor-${viewport.width}.png`;
  await page.screenshot({ path: name, fullPage: true });
  snapshots.push({
    viewport,
    path: name,
    sidebarWidth: await page.locator('aside').evaluate((element) => element.getBoundingClientRect().width).catch(() => null),
    hasLegacyPublishError: await page.getByText('published knowledge article requires a new editorial flow', { exact: false }).count() > 0,
    summaryPlaceholder: await page.locator('textarea').getAttribute('placeholder').catch(() => null),
    scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
    clientWidth: await page.evaluate(() => document.documentElement.clientWidth),
  });
}

await browser.close();
console.log(JSON.stringify({ snapshots, consoleErrors, requestFailures }, null, 2));
if (consoleErrors.length || requestFailures.length || snapshots.some((item) => item.hasLegacyPublishError || item.scrollWidth > item.clientWidth + 2)) process.exitCode = 1;
