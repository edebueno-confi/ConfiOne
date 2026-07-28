import type { InternalScreenKey, PlatformRole } from '../../contracts/admin-contracts';

export interface MinimalNavigationPermissions {
  isPlatformAdmin: boolean;
  roles?: PlatformRole[];
  screenKeys?: InternalScreenKey[];
  hasDashboardViewerAccess?: boolean;
  hasInternalActionAreaAccess?: boolean;
  hasCsPortfolioAccess?: boolean;
}

export type MinimalNavigationIcon = 'inbox' | 'ticket' | 'users' | 'workflow' | 'engineering' | 'shield' | 'book' | 'settings' | 'document';

export interface MinimalNavigationItem {
  id: string;
  label: string;
  to: string;
  icon: MinimalNavigationIcon;
  matches: (pathname: string) => boolean;
}

export interface MinimalNavigationSection {
  id: 'workspace' | 'intelligence' | 'administration' | 'operations';
  label: string;
  items: MinimalNavigationItem[];
}

function matchesBase(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function buildMinimalNavigation({ permissions }: { pathname: string; permissions: MinimalNavigationPermissions }): MinimalNavigationSection[] {
  const roles = permissions.roles ?? [];
  const screenKeys = permissions.screenKeys ?? [];
  const isPlatformAdmin = permissions.isPlatformAdmin || roles.includes('platform_admin');
  const isDashboardViewer = !isPlatformAdmin && permissions.hasDashboardViewerAccess === true;
  const hasScreen = (screenKey: InternalScreenKey) => isPlatformAdmin || screenKeys.includes(screenKey);
  const sections: MinimalNavigationSection[] = [];

  if (isDashboardViewer || hasScreen('analytics')) {
    sections.push({
      id: 'intelligence',
      label: 'Inteligência',
      items: [{ id: 'admin-analytics', label: 'Dashboard gerencial', to: '/admin/analytics', icon: 'workflow', matches: (path) => matchesBase(path, '/admin/analytics') }],
    });
  }

  if (isPlatformAdmin || hasScreen('knowledge') || roles.includes('knowledge_manager')) {
    sections.push({
      id: 'workspace',
      label: 'Conteúdo',
      items: [{ id: 'admin-knowledge', label: 'Conhecimento', to: '/admin/knowledge', icon: 'book', matches: (path) => matchesBase(path, '/admin/knowledge') }],
    });
  }

  const administration: MinimalNavigationItem[] = [];
  if (isPlatformAdmin || hasScreen('settings')) {
    administration.push({ id: 'admin-settings', label: 'Configurações', to: '/admin/settings', icon: 'settings', matches: (path) => matchesBase(path, '/admin/settings') });
  }
  if (isPlatformAdmin || hasScreen('access')) {
    administration.push({ id: 'admin-access', label: 'Acessos e áreas', to: '/admin/access', icon: 'shield', matches: (path) => matchesBase(path, '/admin/access') || matchesBase(path, '/admin/internal-areas') });
  }
  if (administration.length) sections.push({ id: 'administration', label: 'Administração', items: administration });
  return sections;
}

export function resolveMinimalRouteLabel(pathname: string) {
  if (/^\/support\/tickets\/[^/]+/.test(pathname)) return 'Ticket';
  const routes: Array<[string, string]> = [
    ['/admin/analytics', 'Dashboard gerencial'],
    ['/admin/knowledge', 'Conhecimento'],
    ['/admin/settings', 'Configurações'],
    ['/admin/internal-areas', 'Acessos e áreas'],
    ['/admin/access', 'Acessos e áreas'],
    ['/inicio', 'Início'],
    ['/support/inbox', 'Atendimento'],
    ['/support/queue', 'Fila operacional'],
    ['/support/tickets', 'Tickets'],
    ['/support/clientes', 'Clientes B2B'],
    ['/support/customers', 'Clientes B2B'],
    ['/cs/portfolio', 'Carteira CS'],
    ['/internal-actions', 'Acionamentos'],
    ['/engineering', 'Produto'],
    ['/admin/visao-geral', 'Visão geral'],
    ['/admin/tenants', 'Contas B2B'],
    ['/admin/customer-portal', 'Portal do cliente'],
    ['/admin/system', 'Sistema'],
    ['/admin/build-journal', 'Diário de construção'],
    ['/admin/product-docs', 'Documentos'],
  ];
  return routes.find(([basePath]) => matchesBase(pathname, basePath))?.[1] ?? 'GeniusOS';
}
