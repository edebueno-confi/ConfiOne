import fs from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.env.GSO_BASE_URL ?? 'http://127.0.0.1:4175';
const outputDir = 'output/playwright';
fs.mkdirSync(outputDir, { recursive: true });

const cases = [
  ['home-desktop', '/help/genius', { width: 1440, height: 900 }],
  ['home-mobile', '/help/genius', { width: 390, height: 844 }],
  ['categories-desktop', '/help/genius/articles', { width: 1440, height: 900 }],
  ['categories-mobile', '/help/genius/articles', { width: 390, height: 844 }],
  ['subcategory-refunds', '/help/genius/articles?category=8af13d3f-a539-436b-bc8d-30df9c7f3d91', { width: 1440, height: 900 }],
  ['breadcrumb-article', '/help/genius/articles/configurando-parametrizacao-geral', { width: 1440, height: 900 }],
  ['search-estorno', '/help/genius/articles?q=estorno', { width: 1440, height: 900 }],
  ['search-sellers', '/help/genius/articles?q=sellers', { width: 1440, height: 900 }],
  ['search-api', '/help/genius/articles?q=API', { width: 1440, height: 900 }],
  ['search-empty', '/help/genius/articles?q=termo-sem-resultado-taxonomy', { width: 1440, height: 900 }],
  ['restricted-not-found', '/help/genius/articles/permissoes-vtex', { width: 1440, height: 900 }],
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const consoleErrors = [];
const requestFailures = [];
page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()));
page.on('pageerror', (error) => consoleErrors.push(error.message));
page.on('requestfailed', (request) => requestFailures.push(`${request.method()} ${request.url()}`));

const results = [];
for (const [name, route, viewport] of cases) {
  await page.setViewportSize(viewport);
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 30_000 });
  const metrics = await page.evaluate(() => ({
    text: document.body.innerText,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  await page.screenshot({ path: `${outputDir}/taxonomy-01-${name}.png`, fullPage: true });
  results.push({ name, route, overflow: metrics.overflow, notFound: metrics.text.includes('Artigo não encontrado') });
}

await browser.close();
console.log(JSON.stringify({ results, consoleErrors, requestFailures }, null, 2));
if (consoleErrors.length || requestFailures.length || results.some((result) => result.overflow)) process.exitCode = 1;
