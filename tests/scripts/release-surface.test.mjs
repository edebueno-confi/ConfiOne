import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  PUBLIC_HELP_CENTER_HREF,
  findReleaseSurfaceInconsistencies,
  getReleaseLandingRoute,
  getReleaseSurfaceMode,
  isInternalRoute,
  isRoutePublishedInRelease,
  isScreenPublishedInRelease,
  listPublishedScreenKeys,
  listReleaseRoutes,
  resolveReleaseRedirect,
  resolveReleaseRouteScreenKey,
  setReleaseSurfaceModeForTests,
} from '../../apps/web/src/app/release-surface.mjs';
import {
  canOpenInternalRoute,
  getDefaultInternalLandingRoute,
} from '../../apps/web/src/features/auth/internal-route-access.ts';
import { buildMinimalNavigation } from '../../apps/web/src/features/navigation/minimal-navigation.ts';

const postLoginSource = await readFile(
  new URL('../../apps/web/src/features/auth/post-login-redirect.ts', import.meta.url),
  'utf8',
);

const PUBLISHED_ROUTES = [
  '/engineering/control',
  '/admin/analytics',
  '/admin/knowledge',
  '/admin/knowledge/new',
  '/admin/knowledge/1f0d9b6e-0000-4000-8000-000000000000/edit',
  '/admin/settings',
  '/admin/cockpit',
  // `/admin/access` passou a ser publicada no manifesto (tela `access`).
  '/admin/access',
];

const HIDDEN_ROUTES = [
  '/inicio',
  '/support',
  '/support/inbox',
  '/support/queue',
  '/support/tickets',
  '/support/tickets/abc',
  '/support/clientes',
  '/support/customers',
  '/support/customers/abc',
  '/cs/portfolio',
  '/portal',
  '/portal/tickets',
  '/portal/help',
  '/engineering',
  '/engineering/work-items/abc',
  '/internal-actions',
  '/internal-actions/abc',
  '/admin/tenants',
  // `/admin/access` saiu daqui: passou a ser rota publicada no manifesto.
  // `/admin/internal-areas` continua oculta — nao e prefixo de nenhuma rota publicada.
  '/admin/internal-areas',
  '/admin/system',
  '/admin/customer-portal',
  '/admin/build-journal',
  '/admin/product-docs',
  '/admin/visao-geral',
];

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/access-denied',
  '/help',
  '/help/genius',
  '/help/genius/articles',
  '/help/genius/articles/como-autenticar-uma-integracao',
];

function platformAdminContext() {
  return {
    roles: ['platform_admin'],
    screenKeys: [
      'home', 'support_inbox', 'support_queue', 'support_tickets', 'customers_b2b',
      'cs_portfolio', 'internal_actions', 'product', 'admin_overview', 'analytics',
      'tenants', 'customer_portal_admin', 'internal_areas', 'access', 'system',
      'settings', 'knowledge', 'product_docs',
    ],
    hasCustomerPortalAccess: true,
    hasInternalActionAreaAccess: true,
    hasCsPortfolioAccess: true,
  };
}

function dashboardViewerContext() {
  return {
    roles: ['dashboard_viewer'],
    screenKeys: ['analytics'],
    hasCustomerPortalAccess: false,
    hasInternalActionAreaAccess: false,
    hasCsPortfolioAccess: false,
  };
}

test.afterEach(() => {
  setReleaseSurfaceModeForTests('first-release');
});

// ---------------------------------------------------------------- manifest

test('defaults to the first-release surface', () => {
  assert.equal(getReleaseSurfaceMode(), 'first-release');
});

test('manifest has no internal inconsistency', () => {
  assert.deepEqual(findReleaseSurfaceInconsistencies(), []);
});

// O painel de desenvolvimento passou a integrar o release reduzido para
// permitir o acompanhamento operacional do produto.
test('publishes exactly the approved screens', () => {
  assert.deepEqual([...listPublishedScreenKeys()], ['analytics', 'knowledge', 'settings', 'access', 'product']);
  for (const key of ['analytics', 'knowledge', 'settings', 'access', 'product']) {
    assert.equal(isScreenPublishedInRelease(key), true, key);
  }
  // `access` saiu desta lista de negados junto com a publicacao da tela.
  for (const key of ['tenants', 'system', 'support_queue', 'cs_portfolio', 'product_docs']) {
    assert.equal(isScreenPublishedInRelease(key), false, key);
  }
});

test('publishes exactly the approved internal routes', () => {
  assert.deepEqual(
    listReleaseRoutes().map((route) => route.path),
    // `/admin/access` acompanha a publicacao da tela `access`.
    ['/engineering/control', '/admin/analytics', '/admin/knowledge', '/admin/settings', '/admin/cockpit', '/admin/access'],
  );
});

test('every published route resolves to its screen key', () => {
  assert.equal(resolveReleaseRouteScreenKey('/admin/analytics'), 'analytics');
  assert.equal(resolveReleaseRouteScreenKey('/admin/knowledge/new'), 'knowledge');
  assert.equal(resolveReleaseRouteScreenKey('/admin/knowledge/abc/edit'), 'knowledge');
  assert.equal(resolveReleaseRouteScreenKey('/admin/settings'), 'settings');
  assert.equal(resolveReleaseRouteScreenKey('/admin/cockpit'), 'settings');
  // Rota publicada nova: precisa resolver para a propria tela `access`.
  assert.equal(resolveReleaseRouteScreenKey('/admin/access'), 'access');
  assert.equal(resolveReleaseRouteScreenKey('/admin/tenants'), null);
});

test('recognizes the internal route families', () => {
  for (const route of HIDDEN_ROUTES) assert.equal(isInternalRoute(route), true, route);
  for (const route of PUBLIC_ROUTES) assert.equal(isInternalRoute(route), false, route);
});

// ------------------------------------------------------- allowlist by route

test('published routes are reachable in the release', () => {
  for (const route of PUBLISHED_ROUTES) {
    assert.equal(isRoutePublishedInRelease(route), true, route);
  }
});

test('query parameters do not deny a published route', () => {
  const context = platformAdminContext();
  assert.equal(canOpenInternalRoute('/admin/analytics?tab=overview', context), true);
  assert.equal(canOpenInternalRoute('/admin/settings?section=integracoes', context), true);
});

test('hidden routes are not reachable in the release', () => {
  for (const route of HIDDEN_ROUTES) {
    assert.equal(isRoutePublishedInRelease(route), false, route);
  }
});

test('public routes are never restricted by the release manifest', () => {
  for (const route of PUBLIC_ROUTES) {
    assert.equal(isRoutePublishedInRelease(route), true, route);
  }
});

test('the full mode restores the complete system', () => {
  setReleaseSurfaceModeForTests('full');
  for (const route of [...PUBLISHED_ROUTES, ...HIDDEN_ROUTES, ...PUBLIC_ROUTES]) {
    assert.equal(isRoutePublishedInRelease(route), true, route);
  }
  assert.equal(resolveReleaseRedirect('/inicio'), null);
  assert.equal(getReleaseLandingRoute(), null);
});

test('cockpit administrativo usa a permissao de Configurações', () => {
  const context = platformAdminContext();
  assert.equal(canOpenInternalRoute('/admin/cockpit', context), true);
  assert.equal(canOpenInternalRoute('/admin/cockpit', {
    ...context,
    roles: [],
    screenKeys: ['analytics'],
  }), false);
});

// ------------------------------------------------------------- redirects

test('technical entry points redirect to a published surface', () => {
  assert.equal(resolveReleaseRedirect('/inicio'), '/admin/analytics');
  assert.equal(resolveReleaseRedirect('/admin'), '/admin/analytics');
});

test('post-login normalizes technical entry points before permission checks', () => {
  assert.match(postLoginSource, /export function normalizePostLoginRedirectTarget/);
  assert.match(postLoginSource, /const technicalTarget = resolveReleaseRedirect\(pathname\)/);
  assert.match(postLoginSource, /const redirectTo = normalizePostLoginRedirectTarget\(rawRedirectTo\)/);
  assert.match(postLoginSource, /return `\$\{technicalTarget\}\$\{match\?\.\[2\] \?\? ''\}`/);
});

test('forbidden product routes are not turned into silent redirects', () => {
  for (const route of ['/support/queue', '/cs/portfolio', '/portal', '/admin/access', '/admin/system']) {
    assert.equal(resolveReleaseRedirect(route), null, route);
  }
});

test('landing route is the dashboard', () => {
  assert.equal(getReleaseLandingRoute(), '/admin/analytics');
});

// --------------------------------------------------- platform_admin surface

test('platform_admin reaches every published route', () => {
  const context = platformAdminContext();
  for (const route of PUBLISHED_ROUTES) {
    assert.equal(canOpenInternalRoute(route, context), true, route);
  }
});

test('platform_admin is blocked on every hidden route despite full permissions', () => {
  const context = platformAdminContext();
  for (const route of HIDDEN_ROUTES) {
    assert.equal(canOpenInternalRoute(route, context), false, route);
  }
});

test('platform_admin lands on the dashboard instead of the internal home', () => {
  assert.equal(getDefaultInternalLandingRoute(platformAdminContext()), '/admin/analytics');
});

test('platform_admin keeps the complete surface in full mode', () => {
  setReleaseSurfaceModeForTests('full');
  const context = platformAdminContext();
  assert.equal(canOpenInternalRoute('/support/queue', context), true);
  assert.equal(canOpenInternalRoute('/admin/tenants', context), true);
  assert.equal(getDefaultInternalLandingRoute(context), '/inicio');
});

// -------------------------------------------------- dashboard_viewer surface

test('dashboard_viewer reaches the dashboard', () => {
  assert.equal(canOpenInternalRoute('/admin/analytics', dashboardViewerContext()), true);
});

test('dashboard_viewer stays blocked on authoring and configuration', () => {
  const context = dashboardViewerContext();
  // `/admin/access` migrou de HIDDEN_ROUTES para ca: agora e publicada, e a
  // negacao para este perfil passa a ser garantida pela permissao de tela.
  for (const route of ['/admin/knowledge', '/admin/knowledge/new', '/admin/settings', '/admin/access']) {
    assert.equal(canOpenInternalRoute(route, context), false, route);
  }
});

test('dashboard_viewer stays blocked on every hidden route', () => {
  const context = dashboardViewerContext();
  for (const route of HIDDEN_ROUTES) {
    assert.equal(canOpenInternalRoute(route, context), false, route);
  }
});

test('dashboard_viewer lands on the dashboard', () => {
  assert.equal(getDefaultInternalLandingRoute(dashboardViewerContext()), '/admin/analytics');
});

// ------------------------------------------------------------- navigation

function navigationOf(permissions) {
  return buildMinimalNavigation({ pathname: '/admin/analytics', permissions });
}

function itemIds(navigation) {
  return navigation.flatMap((section) => section.items.map((item) => item.id));
}

test('platform_admin sidebar shows only the released surfaces', () => {
  const navigation = navigationOf({
    isPlatformAdmin: true,
    roles: ['platform_admin'],
    screenKeys: platformAdminContext().screenKeys,
  });

  assert.deepEqual(navigation.map((section) => section.id), ['intelligence', 'knowledge', 'operations', 'administration']);
  // O item generico `admin-settings` deu lugar ao submenu real de Configuracoes
  // na sidebar global; a segunda coluna de navegacao dentro da tela foi removida.
  assert.deepEqual(itemIds(navigation), [
    'admin-analytics',
    'admin-knowledge',
    'admin-knowledge-new',
    'public-help-center',
    'development-control',
    'admin-access',
    'admin-settings-integrations',
    'admin-settings-dashboard-sources',
    'admin-settings-sync-history',
    'admin-settings-brands',
    'admin-settings-help-center',
  ]);
});

test('sidebar never exposes a hidden module', () => {
  const navigation = navigationOf({
    isPlatformAdmin: true,
    roles: ['platform_admin'],
    screenKeys: platformAdminContext().screenKeys,
  });
  const targets = navigation.flatMap((section) => section.items.map((item) => item.to));

  // A invariante permanece: toda rota exibida na sidebar precisa estar
  // publicada no release. Agora ela cobre tambem os subitens de Configuracoes.
  for (const target of targets) {
    assert.equal(isRoutePublishedInRelease(target), true, target);
  }
  // `/admin/access` saiu da lista de proibidos porque passou a ser publicada e
  // e o unico ponto de entrada da tela de usuarios. As demais seguem ocultas.
  for (const forbidden of ['/inicio', '/support/queue', '/admin/tenants', '/admin/internal-areas', '/admin/system', '/cs/portfolio']) {
    assert.equal(targets.includes(forbidden), false, forbidden);
  }
});

test('the public help center entry opens outside the shell', () => {
  const navigation = navigationOf({
    isPlatformAdmin: true,
    roles: ['platform_admin'],
    screenKeys: platformAdminContext().screenKeys,
  });
  const item = navigation
    .flatMap((section) => section.items)
    .find((candidate) => candidate.id === 'public-help-center');

  assert.equal(item.external, true);
  assert.equal(item.to, PUBLIC_HELP_CENTER_HREF);
});

test('dashboard_viewer sidebar shows only the dashboard', () => {
  const navigation = navigationOf({
    isPlatformAdmin: false,
    roles: ['dashboard_viewer'],
    screenKeys: ['analytics'],
    hasDashboardViewerAccess: true,
  });

  assert.deepEqual(itemIds(navigation), ['admin-analytics']);
});

test('a profile without published screens gets no empty groups', () => {
  const navigation = navigationOf({
    isPlatformAdmin: false,
    roles: ['support_agent'],
    screenKeys: ['support_queue', 'support_tickets'],
  });

  assert.deepEqual(navigation, []);
});

test('a knowledge manager sees authoring without configuration', () => {
  const navigation = navigationOf({
    isPlatformAdmin: false,
    roles: ['knowledge_manager'],
    screenKeys: ['knowledge'],
  });

  assert.deepEqual(itemIds(navigation), ['admin-knowledge', 'admin-knowledge-new', 'public-help-center']);
});
