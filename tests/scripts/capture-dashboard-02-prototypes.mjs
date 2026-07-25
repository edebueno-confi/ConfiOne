import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = join(process.cwd(), 'docs/prototypes/dashboard-02');
const output = join(root, 'evidence');
mkdirSync(output, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
const server = createServer((req, res) => {
  const file = join(root, new URL(req.url, 'http://localhost').pathname.replace(/^\//, '') || 'index.html');
  if (!existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': mime[extname(file)] ?? 'text/plain' }); res.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const viewports = [[1440,900],[1366,768],[1024,768],[768,1024],[390,844]];
for (const option of ['a','b','c']) for (const [width,height] of viewports) {
  const state = width === 1440 ? 'fresh' : width === 1366 ? 'stale' : width === 1024 ? 'partial' : 'fresh';
  await page.setViewportSize({ width, height });
  await page.goto(`http://127.0.0.1:${port}/index.html?option=${option}&state=${state}`, { waitUntil: 'networkidle' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (overflow) throw new Error(`overflow horizontal em ${option} ${width}x${height}`);
  await page.screenshot({ path: join(output, `option-${option}-${width}x${height}-${state}.png`), fullPage: true });
}
for (const state of ['error','zero']) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`http://127.0.0.1:${port}/index.html?option=a&state=${state}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(output, `option-a-1440x900-${state}.png`), fullPage: true });
}
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`http://127.0.0.1:${port}/index.html?option=a&state=fresh&theme=dark`, { waitUntil: 'networkidle' });
await page.screenshot({ path: join(output, 'option-a-1440x900-dark.png'), fullPage: true });
await page.goto(`http://127.0.0.1:${port}/comparison.html`, { waitUntil: 'networkidle' });
await page.screenshot({ path: join(output, 'comparison-current-a-b-c.png'), fullPage: true });
await browser.close(); server.close();
console.log(JSON.stringify({ output, options: 3, viewports: viewports.length, states: ['fresh','stale','partial','error','zero'], deterministic: true }, null, 2));
