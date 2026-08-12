import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.GSO_BASE_URL ?? 'http://127.0.0.1:4177';
const qaEnvPath = process.env.GSO_QA_ENV_PATH;
const outputDir = path.resolve(process.env.GSO_RESPONSIVE_OUTPUT ?? 'output/playwright/responsive-audit');
const allViewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
];
const viewports = (process.env.GSO_VIEWPORTS
  ? process.env.GSO_VIEWPORTS.split(',').map((value) => value.trim())
  : [])
  .map((value) => {
    const [width, height] = value.split('x').map(Number);
    return { width, height };
  })
  .filter(({ width, height }) => Number.isFinite(width) && Number.isFinite(height));
const selectedViewports = viewports.length > 0 ? viewports : allViewports;

const routes = [
  '/help',
  '/help/genius',
  '/help/genius/articles',
  '/login',
  '/access-denied',
  '/portal',
  '/portal/tickets',
  '/portal/help',
  '/admin/analytics',
  '/admin/visao-geral',
  '/admin/tenants',
  '/admin/knowledge',
  '/admin/knowledge/new',
  '/admin/customer-portal',
  '/admin/access?tab=users',
  '/admin/access?tab=structure',
  '/admin/build-journal',
  '/admin/product-docs',
  '/admin/system',
  '/admin/settings',
  '/admin/settings/brands',
  '/admin/settings/help-center',
  '/admin/settings/integrations',
  '/admin/settings/dashboard-sources',
  '/admin/settings/sync-history',
  '/cs/portfolio',
  '/support/inbox',
  '/support/queue',
  '/support/tickets',
  '/support/clientes',
  '/support/customers',
  '/inicio',
  '/engineering',
  '/meu-perfil',
  '/internal-actions',
];

function loadEnv(filePath) {
  if (!filePath) return {};
  return Object.fromEntries(
    filePath.split(/\r?\n/)
      .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, value.replace(/^"|"$/g, '')]),
  );
}

async function readQaEnv() {
  if (!qaEnvPath) return {};
  try {
    return loadEnv(await readFile(qaEnvPath, 'utf8'));
  } catch {
    return {};
  }
}

function routeSlug(route) {
  return route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root';
}

async function login(page, email, password, redirectRoute) {
  await page.goto(`${baseUrl}/login?redirectTo=${encodeURIComponent(redirectRoute)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 15_000,
  });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 20_000 }),
    page.getByRole('button', { name: /entrar/i }).click(),
  ]);
  await page.waitForTimeout(250);
}

async function measure(page) {
  return page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const details = (element) => {
      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      return {
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        className: typeof element.className === 'string' ? element.className.slice(0, 180) : null,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        overflowX: styles.overflowX,
        overflowY: styles.overflowY,
      };
    };
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const elements = [...document.querySelectorAll('body *')].filter(visible);
    const overflowing = elements
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.right > viewportWidth + 2 || rect.left < -2;
      })
      .filter((element) => !['html', 'body'].includes(element.tagName.toLowerCase()))
      .slice(0, 12)
      .map(details);
    const scrollContainers = elements
      .filter((element) => element.scrollWidth > element.clientWidth + 2 && ['auto', 'scroll'].includes(window.getComputedStyle(element).overflowX))
      .slice(0, 12)
      .map(details);
    const dialogs = elements
      .filter((element) => element.getAttribute('role') === 'dialog' || element.hasAttribute('data-responsive-drawer'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);
        let ancestor = element.parentElement;
        let hasOverlayAncestor = false;
        while (ancestor) {
          if (['fixed', 'absolute'].includes(window.getComputedStyle(ancestor).position)) {
            hasOverlayAncestor = true;
            break;
          }
          ancestor = ancestor.parentElement;
        }
        const isViewportOverlay = ['fixed', 'absolute'].includes(styles.position)
          || hasOverlayAncestor;
        return {
          ...details(element),
          withinViewport: !isViewportOverlay || (rect.left >= -2 && rect.top >= -2 && rect.right <= viewportWidth + 2 && rect.bottom <= viewportHeight + 2),
        };
      });
    const main = document.querySelector('#conteudo-principal, main');
    const root = document.documentElement;
    return {
      viewport: { width: viewportWidth, height: viewportHeight },
      url: window.location.href,
      document: {
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        scrollHeight: root.scrollHeight,
        clientHeight: root.clientHeight,
      },
      verticalScroll: root.scrollHeight > root.clientHeight + 2 || Boolean(main && main.scrollHeight > main.clientHeight + 2),
      horizontalOverflow: root.scrollWidth > root.clientWidth + 2,
      overflowing,
      scrollContainers,
      tables: [...document.querySelectorAll('table')].filter(visible).map(details),
      dialogs,
      mobileNav: (() => {
        const nav = document.querySelector('#gso-mobile-navigation');
        return nav ? { present: true, role: nav.querySelector('[role="dialog"]')?.getAttribute('role') ?? null } : { present: false };
      })(),
    };
  });
}

async function audit() {
  await mkdir(outputDir, { recursive: true });
  const qa = await readQaEnv();
  const email = process.env.GSO_QA_EMAIL ?? qa.LOCAL_QA_ADMIN_EMAIL;
  const password = process.env.GSO_QA_PASSWORD ?? qa.LOCAL_QA_ADMIN_PASSWORD;
  const authenticated = Boolean(email && password);
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const viewport of selectedViewports) {
      const context = await browser.newContext({ viewport, colorScheme: 'dark' });
      const page = await context.newPage();
      const pageErrors = [];
      const failedRequests = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`));

      if (authenticated) await login(page, email, password, '/admin/analytics');

      for (const route of routes) {
        const startedAt = Date.now();
        let navigationError = null;
        let mobileNavInteractionError = null;
        try {
          await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 15_000 });
          await page.waitForTimeout(1_200);
          if (authenticated && route !== '/login' && new URL(page.url()).pathname.endsWith('/login')) {
            await login(page, email, password, route);
          }
          if (viewport.width < 1024 && route === '/admin/analytics') {
            const trigger = page.locator('button[aria-controls="gso-mobile-navigation"]');
            if (await trigger.count() === 0) {
              mobileNavInteractionError = 'botao de menu mobile nao encontrado';
            } else {
              await trigger.first().click();
              await page.waitForTimeout(200);
              const mobileNavigation = page.locator('#gso-mobile-navigation [role="dialog"]');
              if (await mobileNavigation.count() === 0) {
                mobileNavInteractionError = 'drawer de navegacao mobile nao abriu';
              } else {
                const mobileScreenshot = path.join(outputDir, `admin-analytics-mobile-nav-${viewport.width}x${viewport.height}.png`);
                await page.screenshot({ path: mobileScreenshot });
                await mobileNavigation.locator('button[aria-label*="Fechar"]').first().click();
              }
            }
          }
        } catch (error) {
          navigationError = error instanceof Error ? error.message : String(error);
        }
        const metrics = navigationError ? null : await measure(page);
        const screenshot = path.join(outputDir, `${routeSlug(route)}-${viewport.width}x${viewport.height}.png`);
        if (!navigationError) await page.screenshot({ path: screenshot });
        results.push({
          route,
          viewport,
          elapsedMs: Date.now() - startedAt,
          navigationError,
          mobileNavInteractionError,
          metrics,
          pageErrors: [...pageErrors],
          failedRequests: [...failedRequests],
          screenshot: navigationError ? null : path.relative(process.cwd(), screenshot),
        });
        pageErrors.length = 0;
        failedRequests.length = 0;
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const summary = {
    baseUrl,
    authenticated,
    viewports: selectedViewports,
    routes,
    results,
    counts: {
      total: results.length,
      navigationErrors: results.filter((item) => item.navigationError).length,
      horizontalOverflow: results.filter((item) => item.metrics?.horizontalOverflow).length,
      dialogOutsideViewport: results.filter((item) => item.metrics?.dialogs.some((dialog) => !dialog.withinViewport)).length,
      pageErrors: results.filter((item) => item.pageErrors.length > 0).length,
      mobileNavInteractionErrors: results.filter((item) => item.mobileNavInteractionError).length,
    },
  };
  await writeFile(path.join(outputDir, 'responsive-audit.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(summary.counts));
  for (const item of results.filter((entry) => entry.navigationError || entry.metrics?.horizontalOverflow || entry.metrics?.dialogs.some((dialog) => !dialog.withinViewport) || entry.pageErrors.length > 0 || entry.mobileNavInteractionError)) {
    console.log(JSON.stringify({ route: item.route, viewport: item.viewport, navigationError: item.navigationError, mobileNavInteractionError: item.mobileNavInteractionError, horizontalOverflow: item.metrics?.horizontalOverflow, dialogs: item.metrics?.dialogs, pageErrors: item.pageErrors }));
  }
  if (summary.counts.navigationErrors || summary.counts.horizontalOverflow || summary.counts.dialogOutsideViewport || summary.counts.pageErrors || summary.counts.mobileNavInteractionErrors) process.exitCode = 1;
}

await audit();
