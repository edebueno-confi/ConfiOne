import fs from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.env.GSO_BASE_URL ?? 'http://127.0.0.1:4173';
const screenshotDir = process.env.PILOT_SCREENSHOT_DIR ?? 'output/playwright';
const routes = [
  ['/help/genius', 'pilot-03-help-home.png'],
  ['/help/genius/articles', 'pilot-03-help-articles.png'],
  ['/help/genius/articles?q=termo-sem-resultado-pilot-03', 'pilot-03-help-search-empty.png'],
  ['/help/genius/articles/artigo-inexistente-pilot-03', 'pilot-03-help-not-found.png'],
];

fs.mkdirSync(screenshotDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const requestFailures = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(error.message));
page.on('requestfailed', (request) => requestFailures.push(`${request.method()} ${request.url()}`));

const results = [];
for (const [route, fileName] of routes) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 30_000 });
  const metrics = await page.evaluate(() => ({
    route: location.pathname,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    text: document.body.innerText.slice(0, 240),
  }));
  await page.screenshot({ path: `${screenshotDir}/${fileName}`, fullPage: true });
  results.push({ ...metrics, horizontalOverflow: metrics.scrollWidth > metrics.clientWidth + 2 });
}

await browser.close();
console.log(JSON.stringify({ results, consoleErrors, requestFailures }, null, 2));
if (consoleErrors.length > 0 || requestFailures.length > 0 || results.some((result) => result.horizontalOverflow)) process.exitCode = 1;
