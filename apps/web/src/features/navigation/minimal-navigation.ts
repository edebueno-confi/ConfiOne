import type { InternalScreenKey, PlatformRole } from '../../contracts/admin-contracts';

export interface MinimalNavigationPermissions {
  isPlatformAdmin: boolean;
  roles?: PlatformRole[];
  screenKeys?: InternalScreenKey[];
  hasDashboardViewerAccess?: boolean;
  hasInternalActionAreaAccess?: boolean;
  hasCsPortfolioAccess?: boolean;
}

export type MinimalNavigationIcon =
  | 'inbox'
  | 'ticket'
  | 'users'
  | 'workflow'
  | 'engineering'
  | 'shield'
  | 'book'
  | 'settings'
  | 'document';

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

function hasAnyRole(roles: PlatformRole[], candidates: PlatformRole[]) {
  return candidates.some((candidate) => roles.includes(candidate));
}

export function buildMinimalNavigation({
  permissions,
}: {
  pathname: string;
  permissions: MinimalNavigationPermissions;
}): MinimalNavigationSection[] {
  const roles = permissions.roles ?? [];
  const screenKeys = permissions.screenKeys ?? [];
  const isPlatformAdmin = permissions.isPlatformAdmin || roles.includes('platform_admin');
  const isDashboardViewer = !isPlatformAdmin && permissions.hasDashboardViewerAccess === true;

  if (isDashboardViewer) {
    return [{
      id: 'operations',
      label: 'Minha área',
      items: [
        { id: 'dashboard-operational', label: 'Dashboard gerencial', to: '/admin/analytics', icon: 'workflow', matches: (path) => matchesBase(path, '/admin/analytics') },
      ],
    }];
  }

  const hasScreen = (screenKey: InternalScreenKey) => isPlatformAdmin || screenKeys.includes(screenKey);
  const hasSupportAccess = isPlatformAdmin || hasAnyRole(roles, ['support_manager', 'support_agent']) || ['support_inbox', 'support_queue', 'support_tickets', 'customers_b2b'].some((key) => hasScreen(key as InternalScreenKey));
  const hasProductAccess = isPlatformAdmin || hasAnyRole(roles, ['engineering_manager', 'engineering_member']) || hasScreen('product');
  const hasInternalActionAccess = isPlatformAdmin || permissions.hasInternalActionAreaAccess === true || hasScreen('internal_actions');
  const hasCsAccess = isPlatformAdmin || permissions.hasCsPortfolioAccess === true || hasScreen('cs_portfolio');
  const hasInternalWorkspace = roles.length > 0 || hasInternalActionAccess || hasCsAccess;

  const workspaceItems: MinimalNavigationItem[] = [];
  const intelligenceItems: MinimalNavigationItem[] = [];
  const administrationItems: MinimalNavigationItem[] = [];

  if (hasInternalWorkspace || hasScreen('home')) {
    workspaceItems.push({
      id: 'home',
      label: 'Início',
      to: '/inicio',
      icon: 'inbox',
      matches: (path) => matchesBase(path, '/inicio'),
    });
  }

  if (hasSupportAccess) {
    workspaceItems.push(
      { id: 'support-inbox', label: 'Atendimento', to: '/support/inbox', icon: 'inbox', matches: (path) => matchesBase(path, '/support/inbox') },
      { id: 'support-queue', label: 'Fila operacional', to: '/support/queue', icon: 'inbox', matches: (path) => path === '/support' || path === '/support/queue' },
      { id: 'support-tickets', label: 'Tickets', to: '/support/tickets', icon: 'ticket', matches: (path) => matchesBase(path, '/support/tickets') },
      { id: 'support-customers', label: 'Clientes B2B', to: '/support/clientes', icon: 'users', matches: (path) => matchesBase(path, '/support/clientes') || matchesBase(path, '/support/customers') },
    );
  }

  if (hasCsAccess) {
    workspaceItems.push({ id: 'cs-portfolio', label: 'Carteira CS', to: '/cs/portfolio', icon: 'users', matches: (path) => matchesBase(path, '/cs') });
  }

  if (hasInternalActionAccess) {
    workspaceItems.push({ id: 'internal-actions', label: 'Acionamentos', to: '/internal-actions', icon: 'workflow', matches: (path) => matchesBase(path, '/internal-actions') });
  }

  if (hasProductAccess) {
    workspaceItems.push({ id: 'product-workspace', label: 'Produto', to: '/engineering', icon: 'engineering', matches: (path) => matchesBase(path, '/engineering') });
  }

  if (isPlatformAdmin || permissions.hasDashboardViewerAccess === true || hasScreen('analytics')) {
    intelligenceItems.push(
      { id: 'admin-analytics', label: 'Dashboard gerencial', to: '/admin/analytics', icon: 'workflow', matches: (path) => matchesBase(path, '/admin/analytics') },
      { id: 'admin-overview', label: 'Visão geral', to: '/admin/visao-geral', icon: 'inbox', matches: (path) => matchesBase(path, '/admin/visao-geral') },
    );
  }

  if (isPlatformAdmin) {
    administrationItems.push(
      { id: 'admin-settings', label: 'Configurações', to: '/admin/settings', icon: 'settings', matches: (path) => matchesBase(path, '/admin/settings') },
      { id: 'admin-tenants', label: 'Contas B2B', to: '/admin/tenants', icon: 'users', matches: (path) => path === '/admin' || matchesBase(path, '/admin/tenants') },
      { id: 'admin-customer-portal', label: 'Portal do cliente', to: '/admin/customer-portal', icon: 'workflow', matches: (path) => matchesBase(path, '/admin/customer-portal') },
      { id: 'admin-internal-areas', label: 'Áreas internas', to: '/admin/internal-areas', icon: 'workflow', matches: (path) => matchesBase(path, '/admin/internal-areas') },
      { id: 'admin-access', label: 'Acessos', to: '/admin/access', icon: 'shield', matches: (path) => matchesBase(path, '/admin/access') },
      { id: 'admin-system', label: 'Sistema', to: '/admin/system', icon: 'settings', matches: (path) => matchesBase(path, '/admin/system') },
      { id: 'admin-knowledge', label: 'Conhecimento', to: '/admin/knowledge', icon: 'book', matches: (path) => matchesBase(path, '/admin/knowledge') },
      { id: 'admin-build-journal', label: 'Diário de construção', to: '/admin/build-journal', icon: 'document', matches: (path) => matchesBase(path, '/admin/build-journal') },
      { id: 'admin-product-docs', label: 'Documentos', to: '/admin/product-docs', icon: 'document', matches: (path) => matchesBase(path, '/admin/product-docs') },
    );
  } else {
    if (hasScreen('settings')) {
      administrationItems.push({ id: 'admin-settings', label: 'Configurações', to: '/admin/settings', icon: 'settings', matches: (path) => matchesBase(path, '/admin/settings') });
    }
    if (hasScreen('customer_portal_admin')) {
      administrationItems.push({ id: 'admin-customer-portal', label: 'Portal do cliente', to: '/admin/customer-portal', icon: 'workflow', matches: (path) => matchesBase(path, '/admin/customer-portal') });
    }
    if (hasScreen('knowledge') || roles.includes('knowledge_manager')) {
      administrationItems.push({ id: 'admin-knowledge', label: 'Conhecimento', to: '/admin/knowledge', icon: 'book', matches: (path) => matchesBase(path, '/admin/knowledge') });
    }
    if (hasScreen('product_docs')) {
      administrationItems.push({ id: 'admin-product-docs', label: 'Documentos', to: '/admin/product-docs', icon: 'document', matches: (path) => matchesBase(path, '/admin/product-docs') });
    }
    if (hasScreen('system') || roles.includes('audit_reviewer')) {
      administrationItems.push({ id: 'admin-system', label: 'Sistema', to: '/admin/system', icon: 'settings', matches: (path) => matchesBase(path, '/admin/system') });
    }
  }

  const sections: MinimalNavigationSection[] = [
    { id: 'workspace', label: 'Minha rotina', items: workspaceItems },
    { id: 'intelligence', label: 'Inteligência', items: intelligenceItems },
    { id: 'administration', label: 'Administração', items: administrationItems },
  ];

  return sections.filter((section) => section.items.length > 0);
}

export function resolveMinimalRouteLabel(pathname: string) {
  if (/^\/support\/tickets\/[^/]+/.test(pathname)) {
    return 'Ticket';
  }

  const routes: Array<[string, string]> = [
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
    ['/admin/analytics', 'Dashboard gerencial'],
    ['/admin/tenants', 'Contas B2B'],
    ['/admin/settings', 'Configurações'],
    ['/admin/customer-portal', 'Portal do cliente'],
    ['/admin/internal-areas', 'Áreas internas'],
    ['/admin/access', 'Acessos'],
    ['/admin/system', 'Sistema'],
    ['/admin/knowledge', 'Conhecimento'],
    ['/admin/build-journal', 'Diário de construção'],
    ['/admin/product-docs', 'Documentos'],
  ];

  return routes.find(([basePath]) => matchesBase(pathname, basePath))?.[1] ?? 'GeniusOS';
}
