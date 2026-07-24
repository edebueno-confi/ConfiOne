require('module').Module._initPaths();

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const baseUrl = 'http://127.0.0.1:4173';
const runId = '2026-06-19-final-audit-r11';
const metricsDir = path.resolve('docs/reports/visual-audit/route-metrics', runId);
const screenshotsDir = path.resolve('docs/reports/visual-audit/screenshots', runId);

fs.rmSync(metricsDir, { recursive: true, force: true });
fs.rmSync(screenshotsDir, { recursive: true, force: true });
fs.mkdirSync(metricsDir, { recursive: true });
fs.mkdirSync(screenshotsDir, { recursive: true });

const authDoc = fs.readFileSync('docs/LOCAL_QA_AUTH.md', 'utf8');

function passwordAfter(email) {
  const idx = authDoc.indexOf('`' + email + '`');
  const match = authDoc.slice(idx, idx + 240).match(/senha:\s*`([^`]+)`/i);
  if (!match) throw new Error('missing local QA credential');
  return match[1];
}

const users = {
  admin: {
    email: 'qa.local.platform-admin@genius.local',
    password: passwordAfter('qa.local.platform-admin@genius.local'),
  },
  support: {
    email: 'qa.local.support-manager-a@genius.local',
    password: passwordAfter('qa.local.support-manager-a@genius.local'),
  },
  engineering: {
    email: 'qa.local.engineering-member-a@genius.local',
    password: passwordAfter('qa.local.engineering-member-a@genius.local'),
  },
  customer: {
    email: 'gestao.portal@support-qa-a.local',
    password: passwordAfter('gestao.portal@support-qa-a.local'),
  },
};

const viewports = [
  { name: 'desktop1920', width: 1920, height: 1080 },
  { name: 'desktop1440', width: 1440, height: 900 },
  { name: 'desktop1366', width: 1366, height: 768 },
];

const forbidden = [
  'RPC',
  'RLS',
  'backend',
  'read model',
  'payload',
  'metadata',
  'stack trace',
  'storage_bucket',
  'storage_object_path',
  'bucket',
  'Supabase',
  'fixture',
  'seed',
  'role global',
  'platform_admin',
  'source of truth',
];

function cleanHref(href) {
  if (!href) return null;
  try {
    const url = new URL(href, baseUrl);
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findTerms(text) {
  const hits = [];
  for (const term of forbidden) {
    const re = new RegExp('\\b' + escapeRegex(term) + '\\b', 'i');
    if (re.test(text)) hits.push(term);
  }
  if (/\bview\b/i.test(text)) hits.push('view');
  if (/\btenant\b/i.test(text.replace(/Support QA Tenant/gi, 'Support QA Cliente'))) {
    hits.push('tenant');
  }
  if (/\bmembership\b/i.test(text)) hits.push('membership');
  if (/\bcontrato\b/i.test(text)) hits.push('contrato');
  return [...new Set(hits)];
}

function currentPath(page) {
  const url = new URL(page.url());
  return url.pathname + url.search;
}

function assertRouteLoaded(page, route) {
  if (route.public) return;
  const actual = currentPath(page);
  const matchesExpectedPath =
    actual === route.path ||
    (route.acceptsPathPattern && route.acceptsPathPattern.test(actual));

  if (!matchesExpectedPath) {
    throw new Error(`route ${route.name} expected ${route.path} but loaded ${actual}`);
  }
}

async function login(page, role) {
  await page.goto(baseUrl + '/login', { waitUntil: 'networkidle' });
  const user = users[role];
  await page.locator('input[type="email"], input[name="email"]').first().fill(user.email);
  await page.locator('input[type="password"], input[name="password"]').first().fill(user.password);
  await Promise.all([
    page.waitForLoadState('networkidle').catch(() => {}),
    page.locator('button[type="submit"], button:has-text("Entrar")').first().click(),
  ]);
  await page.waitForTimeout(900);
  if (currentPath(page) === '/login') {
    const visibleText = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ');
    throw new Error(`login failed for role ${role}: still on /login (${visibleText.slice(0, 180)})`);
  }
}

async function firstHref(page, pattern) {
  const hrefs = await page
    .locator('a[href]')
    .evaluateAll((links) => links.map((anchor) => anchor.getAttribute('href')));
  return hrefs.map(cleanHref).find((href) => href && pattern.test(href)) || null;
}

async function discoverRoutes(browser) {
  const routes = [
    { name: 'login', role: null, path: '/login', public: true },
    { name: 'public-help-root', role: null, path: '/help', public: true },
    { name: 'public-help-space', role: null, path: '/help/genius', public: true },
    { name: 'public-help-articles', role: null, path: '/help/genius/articles', public: true },
    { name: 'access-denied', role: null, path: '/access-denied', public: true },
    { name: 'admin-tenants', role: 'admin', path: '/admin/tenants' },
    { name: 'admin-knowledge', role: 'admin', path: '/admin/knowledge' },
    { name: 'admin-knowledge-new', role: 'admin', path: '/admin/knowledge/new' },
    { name: 'admin-customer-portal', role: 'admin', path: '/admin/customer-portal' },
    { name: 'admin-internal-areas', role: 'admin', path: '/admin/internal-areas' },
    { name: 'admin-build-journal', role: 'admin', path: '/admin/build-journal' },
    { name: 'admin-product-docs', role: 'admin', path: '/admin/product-docs' },
    { name: 'admin-access', role: 'admin', path: '/admin/access' },
    { name: 'admin-system', role: 'admin', path: '/admin/system' },
    { name: 'cs-portfolio', role: 'admin', path: '/cs/portfolio' },
    { name: 'support-queue', role: 'support', path: '/support/queue' },
    { name: 'support-tickets', role: 'support', path: '/support/tickets' },
    { name: 'support-customers', role: 'support', path: '/support/customers' },
    { name: 'engineering', role: 'engineering', path: '/engineering' },
    {
      name: 'internal-actions',
      role: 'admin',
      path: '/internal-actions',
      acceptsPathPattern: /^\/internal-actions\/[0-9a-f-]{20,}$/i,
    },
    { name: 'portal', role: 'customer', path: '/portal' },
    { name: 'portal-tickets', role: 'customer', path: '/portal/tickets' },
    { name: 'portal-help', role: 'customer', path: '/portal/help' },
  ];

  const supportContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const supportPage = await supportContext.newPage();
  await login(supportPage, 'support');
  await supportPage.goto(baseUrl + '/support/queue', { waitUntil: 'networkidle' });
  await supportPage.waitForTimeout(1200);
  const ticket = await firstHref(supportPage, /^\/support\/tickets\/[0-9a-f-]{20,}/i);
  if (ticket) routes.push({ name: 'support-ticket-detail', role: 'support', path: ticket });
  await supportPage.goto(baseUrl + '/support/customers', { waitUntil: 'networkidle' });
  await supportPage.waitForTimeout(1000);
  const customer = await firstHref(supportPage, /^\/support\/customers\/[0-9a-f-]{20,}/i);
  if (customer) routes.push({ name: 'support-customer-detail', role: 'support', path: customer });
  await supportContext.close();

  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();
  await login(adminPage, 'admin');
  await adminPage.goto(baseUrl + '/admin/knowledge', { waitUntil: 'networkidle' });
  await adminPage.waitForTimeout(1000);
  const edit = await firstHref(adminPage, /^\/admin\/knowledge\/[0-9a-f-]{20,}\/edit/i);
  if (edit) routes.push({ name: 'admin-knowledge-edit', role: 'admin', path: edit });
  await adminPage.goto(baseUrl + '/internal-actions', { waitUntil: 'networkidle' });
  await adminPage.waitForTimeout(1000);
  const action = await firstHref(adminPage, /^\/internal-actions\/[0-9a-f-]{20,}/i);
  if (action) routes.push({ name: 'internal-action-detail', role: 'admin', path: action });
  await adminContext.close();

  const engContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const engPage = await engContext.newPage();
  await login(engPage, 'engineering');
  await engPage.goto(baseUrl + '/engineering', { waitUntil: 'networkidle' });
  await engPage.waitForTimeout(1000);
  const workItem = await firstHref(engPage, /^\/engineering\/work-items\/[0-9a-f-]{20,}/i);
  if (workItem) routes.push({ name: 'engineering-work-item', role: 'engineering', path: workItem });
  await engContext.close();

  const customerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const customerPage = await customerContext.newPage();
  await login(customerPage, 'customer');
  await customerPage.goto(baseUrl + '/portal/tickets', { waitUntil: 'networkidle' });
  await customerPage.waitForTimeout(1000);
  const portalTicket = await firstHref(customerPage, /^\/portal\/tickets\/[0-9a-f-]{20,}/i);
  if (portalTicket) routes.push({ name: 'portal-ticket-detail', role: 'customer', path: portalTicket });
  await customerPage.goto(baseUrl + '/portal/help', { waitUntil: 'networkidle' });
  await customerPage.waitForTimeout(1000);
  const portalArticle = await firstHref(customerPage, /^\/portal\/help\//i);
  if (portalArticle) routes.push({ name: 'portal-help-article', role: 'customer', path: portalArticle });
  await customerContext.close();

  return routes;
}

async function measure(page, route, viewport) {
  const data = await page.evaluate(() => {
    const root = document.scrollingElement || document.documentElement;
    const bodyText = document.body.innerText || '';
    const overflows = [];

    for (const el of [...document.querySelectorAll('body *')]) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      const scrollX = el.scrollWidth > el.clientWidth + 1;
      const protrudes = rect.right > window.innerWidth + 1 || rect.left < -1;
      if (scrollX || protrudes) {
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 180);
        if (!text) continue;
        overflows.push({
          tag: el.tagName,
          className: String(el.className || '').slice(0, 160),
          text,
          rect: {
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          },
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          protrudes,
        });
      }
      if (overflows.length >= 30) break;
    }

    return {
      bodyText,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scroll: {
        scrollHeight: root.scrollHeight,
        clientHeight: root.clientHeight,
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
      },
      hasHorizontalScroll:
        root.scrollWidth > root.clientWidth + 1 || document.body.scrollWidth > window.innerWidth + 1,
      hasGlobalScroll: root.scrollHeight > root.clientHeight + 1,
      overflowCount: overflows.length,
      protrusionCount: overflows.filter((overflow) => overflow.protrudes).length,
      overflows,
    };
  });

  const textForTerms = data.bodyText.replace(/Support QA Tenant/gi, 'Support QA Cliente');
  const termHits = findTerms(textForTerms);
  delete data.bodyText;

  return {
    ...route,
    viewportName: viewport.name,
    viewport: data.viewport,
    scroll: data.scroll,
    hasHorizontalScroll: data.hasHorizontalScroll,
    hasGlobalScroll: data.hasGlobalScroll,
    termHits,
    overflowCount: data.overflowCount,
    protrusionCount: data.protrusionCount,
    overflows: data.overflows,
  };
}

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const routes = await discoverRoutes(browser);
  fs.writeFileSync(path.join(metricsDir, 'routes.json'), JSON.stringify(routes, null, 2));

  const results = [];
  for (const viewport of viewports) {
    const contexts = {};
    for (const role of ['admin', 'support', 'engineering', 'customer']) {
      contexts[role] = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await contexts[role].newPage();
      await login(page, role);
      await page.close();
    }
    const publicContext = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });

    for (const route of routes) {
      const context = route.role ? contexts[route.role] : publicContext;
      const page = await context.newPage();
      let result;
      try {
        await page.goto(baseUrl + route.path, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(900);
        assertRouteLoaded(page, route);
        result = await measure(page, route, viewport);
        const fileBase = `${viewport.name}-${route.name}`.replace(/[^a-z0-9_-]/gi, '-');
        const screenshot = path.join(screenshotsDir, `${fileBase}.png`);
        await page.screenshot({ path: screenshot, fullPage: false });
        result.screenshot = screenshot;
        fs.writeFileSync(path.join(metricsDir, `${fileBase}.json`), JSON.stringify(result, null, 2));
      } catch (error) {
        result = { ...route, viewportName: viewport.name, error: String(error.message || error) };
      }
      results.push(result);
      await page.close();
    }

    await publicContext.close();
    for (const context of Object.values(contexts)) await context.close();
  }

  const summary = results.map((result) => ({
    name: result.name,
    role: result.role,
    path: result.path,
    public: result.public,
    viewportName: result.viewportName,
    hasHorizontalScroll: result.hasHorizontalScroll,
    hasGlobalScroll: result.hasGlobalScroll,
    termHits: result.termHits,
    overflowCount: result.overflowCount,
    protrusionCount: result.protrusionCount,
    error: result.error,
    screenshot: result.screenshot,
  }));
  fs.writeFileSync(path.join(metricsDir, 'summary.json'), JSON.stringify(summary, null, 2));

  const failures = summary.filter(
    (result) =>
      result.error ||
      result.hasHorizontalScroll ||
      (result.protrusionCount || 0) > 0 ||
      (result.termHits || []).length > 0 ||
      (!result.public && result.hasGlobalScroll),
  );
  fs.writeFileSync(path.join(metricsDir, 'failures.json'), JSON.stringify(failures, null, 2));
  console.log(JSON.stringify({ routes: routes.length, results: summary.length, failures: failures.length, sampleFailures: failures.slice(0, 20) }, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
