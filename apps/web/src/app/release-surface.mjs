/**
 * Release surface manifest.
 *
 * Single source of truth for which product surfaces are published in the
 * current release. The whole system stays in the repository; this manifest
 * only decides what is reachable.
 *
 * Everything that depends on the published surface must read from here:
 * navigation building, direct URL access, post-login destination, technical
 * redirects and the surface tests. Do not duplicate route allowlists.
 *
 * Validation order enforced by the consumers:
 *   1. release surface (this module)
 *   2. profile permission
 *   3. route gate
 *   4. page rendering
 *
 * The manifest applies to every profile, including `platform_admin`: being an
 * administrator must not make an unfinished module reappear during this phase.
 *
 * Authored as `.mjs` with a `.d.mts` declaration, following the repository
 * convention for logic shared between the Vite/TypeScript app and the
 * `node --test` suites.
 */

export const RELEASE_SURFACE_MODES = ['first-release', 'full'];

/** Internal route families owned by the product. Public routes are never gated here. */
const INTERNAL_ROUTE_FAMILIES = [
  '/admin',
  '/inicio',
  '/support',
  '/cs',
  '/engineering',
  '/internal-actions',
  '/portal',
];

/** Screens published in the first release. */
const FIRST_RELEASE_SCREEN_KEYS = ['home', 'analytics', 'knowledge', 'settings', 'access'];

/**
 * Internal routes published in the first release.
 *
 * `/admin/knowledge` covers `/admin/knowledge/new` and
 * `/admin/knowledge/:articleId/edit` by prefix: article authoring is part of
 * the knowledge surface and depends on the same screen key, so it must not be
 * a separate release decision.
 */
const FIRST_RELEASE_ROUTES = [
  {
    path: '/inicio',
    screenKey: 'home',
    rationale: 'Recepção autenticada neutra, sem exigir acesso a uma área operacional.',
  },
  {
    path: '/admin/analytics',
    screenKey: 'analytics',
    rationale: 'Dashboard gerencial: superficie madura aprovada para o primeiro release.',
  },
  {
    path: '/admin/knowledge',
    screenKey: 'knowledge',
    rationale:
      'Administracao de artigos, criacao e edicao. As subrotas /new e /:articleId/edit pertencem a mesma tela e a mesma permissao.',
  },
  {
    path: '/admin/settings',
    screenKey: 'settings',
    rationale:
      'Configuracoes necessarias ao Dashboard, a Central de Ajuda e as integracoes autorizadas.',
  },
  {
    path: '/admin/cockpit',
    screenKey: 'settings',
    rationale:
      'Cockpit administrativo das fontes, etapas e execucoes do Dashboard, operado pela mesma permissao de Configuracoes.',
  },
  {
    path: '/admin/access',
    screenKey: 'access',
    rationale:
      'Administracao de usuarios, convites, areas e permissoes para perfis autorizados.',
  },
];

/**
 * Technical redirects applied while the reduced surface is active.
 *
 * These are not denials: they are entry points that must land on a published
 * surface instead of failing. Forbidden product routes are never silently
 * redirected — they resolve to an explicit denial.
 */
const FIRST_RELEASE_REDIRECTS = [
  ['/admin', '/admin/analytics'],
];

/** Landing route after a successful login while the reduced surface is active. */
const FIRST_RELEASE_LANDING_ROUTE = '/inicio';

/**
 * Sub-superfícies dentro de telas publicadas.
 *
 * Uma allowlist de rota não alcança abas e seções internas. Sem isto, uma tela
 * publicada continua listando parâmetros e áreas de módulos ocultos.
 */

/** Domínios do Dashboard visíveis no release. `logs` e `config` migraram para Configurações. */
const FIRST_RELEASE_ANALYTICS_DOMAINS = ['ceo', 'commercial', 'customer_success', 'support', 'finance', 'product-development', 'product', 'development'];

/**
 * Seções de Configurações publicadas, cada uma com a capacidade exigida.
 *
 * `screenKey` é a tela cuja permissão o usuário precisa ter para ver a seção.
 * Assim Configurações passa a exibir apenas o que o perfil pode operar, em vez
 * de listar todos os parâmetros do sistema.
 */
// `categorias` NÃO entra aqui de propósito. Apesar do nome genérico, a seção
// gerencia `ticket_categories` — parâmetro do módulo de Suporte, que não está
// publicado. Publicá-la fazia Configurações consultar uma tabela que a RLS nega
// (HTTP 403) e exibir um painel de um módulo oculto. As categorias de
// conhecimento são gerenciadas dentro da própria tela de Conhecimento.
const FIRST_RELEASE_SETTINGS_SECTIONS = [
  { id: 'marcas', screenKey: 'settings' },
  { id: 'central-ajuda', screenKey: 'settings' },
  { id: 'integracoes', screenKey: 'settings' },
  { id: 'dashboard-fontes', screenKey: 'analytics' },
  { id: 'dashboard-historico', screenKey: 'analytics' },
];

/** Public help center entry point offered from the internal shell. */
export const PUBLIC_HELP_CENTER_HREF = '/help/genius';

function readEnvMode() {
  // `import.meta.env` exists under Vite and is absent under plain Node (tests).
  const env = import.meta.env ?? {};
  const candidate = (env.VITE_RELEASE_SURFACE ?? '').trim();

  return RELEASE_SURFACE_MODES.includes(candidate) ? candidate : 'first-release';
}

let activeMode = readEnvMode();

export function getReleaseSurfaceMode() {
  return activeMode;
}

/**
 * Test-only override. Production code must not call this; the mode comes from
 * the environment so each environment can publish a different surface.
 */
export function setReleaseSurfaceModeForTests(mode) {
  activeMode = mode;
}

function matchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isInternalRoute(pathname) {
  return INTERNAL_ROUTE_FAMILIES.some((family) => matchesPrefix(pathname, family));
}

export function listReleaseRoutes() {
  return getReleaseSurfaceMode() === 'full' ? [] : FIRST_RELEASE_ROUTES;
}

export function listPublishedScreenKeys() {
  return getReleaseSurfaceMode() === 'full' ? [] : FIRST_RELEASE_SCREEN_KEYS;
}

/** True when the screen is part of the published surface. */
export function isScreenPublishedInRelease(screenKey) {
  if (getReleaseSurfaceMode() === 'full') return true;
  return FIRST_RELEASE_SCREEN_KEYS.includes(screenKey);
}

/**
 * True when the pathname may be reached in the current release.
 *
 * Public and technical routes are not internal product surfaces and are always
 * allowed here; their protection is the gate's business, not the release's.
 */
export function isRoutePublishedInRelease(pathname) {
  if (getReleaseSurfaceMode() === 'full') return true;
  if (!isInternalRoute(pathname)) return true;

  return FIRST_RELEASE_ROUTES.some((route) => matchesPrefix(pathname, route.path));
}

/** Screen key required by a published route, when the route is published. */
export function resolveReleaseRouteScreenKey(pathname) {
  const route = listReleaseRoutes().find((candidate) => matchesPrefix(pathname, candidate.path));
  return route?.screenKey ?? null;
}

/**
 * Technical redirect for an entry point that must land on a published surface.
 * Returns null when the pathname is not a redirect target.
 */
export function resolveReleaseRedirect(pathname) {
  if (getReleaseSurfaceMode() === 'full') return null;

  const match = FIRST_RELEASE_REDIRECTS.find(([from]) => from === pathname);
  return match ? match[1] : null;
}

export function getReleaseLandingRoute() {
  return getReleaseSurfaceMode() === 'full' ? null : FIRST_RELEASE_LANDING_ROUTE;
}

/** Domínios do Dashboard publicados no release. */
export function listPublishedAnalyticsDomains() {
  return getReleaseSurfaceMode() === 'full' ? null : FIRST_RELEASE_ANALYTICS_DOMAINS;
}

export function isAnalyticsDomainPublishedInRelease(domainKey) {
  if (getReleaseSurfaceMode() === 'full') return true;
  return FIRST_RELEASE_ANALYTICS_DOMAINS.includes(domainKey);
}

/** Seções de Configurações publicadas no release. */
export function listPublishedSettingsSections() {
  return getReleaseSurfaceMode() === 'full' ? null : FIRST_RELEASE_SETTINGS_SECTIONS;
}

export function isSettingsSectionPublishedInRelease(sectionId) {
  if (getReleaseSurfaceMode() === 'full') return true;
  return FIRST_RELEASE_SETTINGS_SECTIONS.some((section) => section.id === sectionId);
}

/**
 * Seção de Configurações visível para um perfil: publicada no release E
 * autorizada pela permissão de tela do usuário.
 */
export function canOpenSettingsSection(sectionId, { isPlatformAdmin = false, screenKeys = [] } = {}) {
  if (getReleaseSurfaceMode() === 'full') return true;

  const section = FIRST_RELEASE_SETTINGS_SECTIONS.find((candidate) => candidate.id === sectionId);
  if (!section) return false;

  return isPlatformAdmin || screenKeys.includes(section.screenKey);
}

/**
 * Integrity check for the manifest itself: every published route must point at
 * a published screen. Exposed so the surface test fails loudly on drift
 * instead of shipping a route whose permission can never be satisfied.
 */
export function findReleaseSurfaceInconsistencies() {
  if (getReleaseSurfaceMode() === 'full') return [];

  const problems = [];

  for (const route of FIRST_RELEASE_ROUTES) {
    if (!FIRST_RELEASE_SCREEN_KEYS.includes(route.screenKey)) {
      problems.push(
        `Rota publicada ${route.path} depende da tela "${route.screenKey}", que nao esta publicada.`,
      );
    }
    if (!isInternalRoute(route.path)) {
      problems.push(`Rota publicada ${route.path} nao pertence a nenhuma familia interna conhecida.`);
    }
  }

  for (const [from, to] of FIRST_RELEASE_REDIRECTS) {
    if (!isRoutePublishedInRelease(to)) {
      problems.push(`Redirect ${from} -> ${to} aponta para uma rota nao publicada.`);
    }
  }

  if (!isRoutePublishedInRelease(FIRST_RELEASE_LANDING_ROUTE)) {
    problems.push(`Landing route ${FIRST_RELEASE_LANDING_ROUTE} nao esta publicada.`);
  }

  return problems;
}
