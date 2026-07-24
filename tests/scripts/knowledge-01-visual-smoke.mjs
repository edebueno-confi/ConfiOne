import fs from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.env.GSO_BASE_URL ?? 'http://127.0.0.1:4175';
const outputDir = 'output/playwright';
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const requestFailures = [];
page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()));
page.on('pageerror', (error) => consoleErrors.push(error.message));
page.on('requestfailed', (request) => requestFailures.push(`${request.method()} ${request.url()}`));

async function capture(route, name, viewport = { width: 1440, height: 900 }) {
  await page.setViewportSize(viewport);
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.screenshot({ path: `${outputDir}/${name}.png`, fullPage: true });
  return page.evaluate(() => ({
    route: location.pathname + location.search,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    text: document.body.innerText.slice(0, 180),
  }));
}

const results = [];
results.push(await capture('/help/genius', 'knowledge-01-home-desktop'));
results.push(await capture('/help/genius', 'knowledge-01-home-mobile', { width: 390, height: 844 }));
results.push(await capture('/help/genius/articles', 'knowledge-01-list-desktop'));
results.push(await capture('/help/genius/articles', 'knowledge-01-list-mobile', { width: 390, height: 844 }));

const articleHref = await page.locator('a[href*="/help/genius/articles/"]').first().getAttribute('href');
if (articleHref) results.push(await capture(articleHref, 'knowledge-01-article-desktop'));

for (const slug of [
  'como-autenticar-uma-integracao',
  'configurando-parametrizacao-geral',
  'configuracao-de-sellers-permitidos',
]) {
  const href = `/help/genius/articles/${slug}`;
  if (await page.request.get(`${baseUrl}${href}`).then((response) => response.ok()).catch(() => false)) {
    results.push(await capture(href, `knowledge-01-${slug}`));
  }
}

results.push(await capture('/help/genius/articles?query=consulta-sem-resultado', 'knowledge-01-search-empty'));
results.push(await capture('/help/genius/articles/artigo-inexistente', 'knowledge-01-not-found'));

await page.setViewportSize({ width: 1440, height: 900 });
await page.route('**/rest/v1/**', async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await route.continue();
});
await page.goto(`${baseUrl}/help/genius`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.screenshot({ path: `${outputDir}/knowledge-01-loading.png`, fullPage: true });

await browser.close();
console.log(JSON.stringify({ results, consoleErrors, requestFailures }, null, 2));
if (consoleErrors.length || requestFailures.length || results.some((item) => item.scrollWidth > item.clientWidth + 2)) process.exitCode = 1;
