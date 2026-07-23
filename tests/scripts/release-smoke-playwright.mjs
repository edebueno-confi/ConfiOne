import fs from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.env.GSO_BASE_URL ?? 'http://127.0.0.1:4173';
const qaAuthPath = 'docs/LOCAL_QA_AUTH.md';
const adminEmail = process.env.GSO_SMOKE_ADMIN_EMAIL ?? 'ede.oliveira@confi.com.vc';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readQaPassword() {
  const auth = fs.readFileSync(qaAuthPath, 'utf8');
  const match = auth.match(new RegExp(`${escapeRegex(adminEmail)}[\\s\\S]*?senha:\\s*([^\\r\\n]+)`));
  if (!match?.[1]) {
    throw new Error(`QA admin password not found in ${qaAuthPath} for ${adminEmail}`);
  }
  return match[1].trim().replace(/^`|`$/g, '');
}

async function loginIfNeeded(page, password) {
  if (!page.url().includes('/login')) return;

  await page.locator('input[type=email]').fill(adminEmail);
  await page.locator('input[type=password]').fill(password);
  await Promise.all([
    page.waitForURL((url) => !String(url).includes('/login'), { timeout: 20_000 }).catch(() => {}),
    page.getByRole('button', { name: /Entrar|Validando/i }).click(),
  ]);
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
}

async function visit(page, password, route, expectedText, screenshotName, readyText = expectedText) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await loginIfNeeded(page, password);
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await loginIfNeeded(page, password);
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.locator('body').waitFor({ timeout: 15_000 });

  if (readyText) {
    await page
      .getByText(readyText, { exact: false })
      .first()
      .waitFor({ timeout: 60_000 })
      .catch(() => {});
  }

  const metrics = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    text: document.body.innerText,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }));

  const expectedFound = readyText
    ? metrics.text.toLocaleLowerCase('pt-BR').includes(readyText.toLocaleLowerCase('pt-BR'))
    : true;

  if (readyText && !expectedFound) {
    await page.screenshot({ path: `output/playwright/${screenshotName.replace('.png', '-failure.png')}`, fullPage: true });
    throw new Error(
      [
        `Expected text "${readyText}" not found at ${metrics.url}.`,
        `Visible text starts with: ${metrics.text}`,
        `Console errors: ${consoleErrors.join(' | ') || 'none'}`,
        `Request failures: ${requestFailures.join(' | ') || 'none'}`,
        `Responses: ${responses.slice(-40).join(' | ') || 'none'}`,
      ].join('\n'),
    );
  }

  await page.screenshot({ path: `output/playwright/${screenshotName}`, fullPage: true });

  return {
    route,
    ...metrics,
    text: metrics.text.slice(0, 240),
    horizontalOverflow: metrics.scrollWidth > metrics.clientWidth + 2,
  };
}

const password = readQaPassword();
fs.mkdirSync('output/playwright', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const requestFailures = [];
const responses = [];

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));
page.on('requestfailed', (request) => {
  requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`.trim());
});
page.on('response', (response) => {
  const url = response.url();
  if (response.status() >= 400 || /\.(tsx?|jsx?)(\?|$)|\/@vite\/|\/src\//.test(url)) {
    responses.push(`${response.status()} ${url}`);
  }
});

const results = [];
results.push(await visit(page, password, '/admin/analytics', 'Dashboard gerencial', 'release-smoke-dashboard.png', 'Pipeline aberto'));
results.push(await visit(page, password, '/help/genius', 'Central', 'release-smoke-help-home.png'));
results.push(await visit(page, password, '/help/genius/articles', 'Central', 'release-smoke-help-articles.png'));

const articleLinks = await page
  .locator('a[href*="/help/genius/articles/"]')
  .evaluateAll((links) => links.map((link) => link.href).filter(Boolean));

if (articleLinks.length === 0) {
  throw new Error('No public article links found');
}

await page.goto(articleLinks[0], { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
await page.locator('body').waitFor({ timeout: 15_000 });
await page.screenshot({ path: 'output/playwright/release-smoke-help-article.png', fullPage: true });
results.push(
  await page.evaluate(() => ({
    route: location.pathname,
    url: location.href,
    title: document.title,
    text: document.body.innerText.slice(0, 240),
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  })),
);

await browser.close();

const relevantConsoleErrors = consoleErrors.filter(
  (error) => !/favicon|Download the React DevTools/i.test(error),
);

console.log(JSON.stringify({ results, consoleErrors: relevantConsoleErrors, requestFailures, responses }, null, 2));

if (
  relevantConsoleErrors.length > 0 ||
  requestFailures.length > 0 ||
  results.some((result) => result.horizontalOverflow)
) {
  process.exitCode = 1;
}
