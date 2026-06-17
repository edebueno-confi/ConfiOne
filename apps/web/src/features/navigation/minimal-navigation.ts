export interface MinimalNavigationPermissions {
  isPlatformAdmin: boolean;
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
  id: 'work' | 'engineering' | 'administration';
  label: string;
  items: MinimalNavigationItem[];
}

function matchesBase(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function buildMinimalNavigation({
  pathname,
  permissions,
}: {
  pathname: string;
  permissions: MinimalNavigationPermissions;
}): MinimalNavigationSection[] {
  const isPlatformAdmin = permissions.isPlatformAdmin;
  const hasSupportAccess = isPlatformAdmin || matchesBase(pathname, '/support');
  const hasEngineeringAccess = isPlatformAdmin || matchesBase(pathname, '/engineering');
  const hasInternalActionAccess =
    isPlatformAdmin ||
    permissions.hasInternalActionAreaAccess === true ||
    matchesBase(pathname, '/internal-actions');
  const hasCsAccess =
    isPlatformAdmin ||
    permissions.hasCsPortfolioAccess === true ||
    matchesBase(pathname, '/cs');

  const workItems: MinimalNavigationItem[] = [];
  const engineeringItems: MinimalNavigationItem[] = [];
  const administrationItems: MinimalNavigationItem[] = [];

  if (hasCsAccess) {
    workItems.push({
      id: 'cs-portfolio',
      label: 'Carteira CS',
      to: '/cs/portfolio',
      icon: 'users',
      matches: (path) => matchesBase(path, '/cs'),
    });
  }

  if (hasSupportAccess) {
    workItems.push(
      {
        id: 'support-queue',
        label: 'Fila operacional',
        to: '/support/queue',
        icon: 'inbox',
        matches: (path) => path === '/support' || path === '/support/queue',
      },
      {
        id: 'support-tickets',
        label: 'Tickets',
        to: '/support/tickets',
        icon: 'ticket',
        matches: (path) => matchesBase(path, '/support/tickets'),
      },
      {
        id: 'support-customers',
        label: 'Clientes B2B',
        to: '/support/customers',
        icon: 'users',
        matches: (path) => matchesBase(path, '/support/customers'),
      },
    );
  }

  if (hasInternalActionAccess) {
    workItems.push({
      id: 'internal-actions',
      label: 'Acionamentos',
      to: '/internal-actions',
      icon: 'workflow',
      matches: (path) => matchesBase(path, '/internal-actions'),
    });
  }

  if (hasEngineeringAccess) {
    engineeringItems.push({
      id: 'engineering',
      label: 'Fila técnica',
      to: '/engineering',
      icon: 'engineering',
      matches: (path) => matchesBase(path, '/engineering'),
    });
  }

  if (isPlatformAdmin) {
    administrationItems.push(
      {
        id: 'admin-tenants',
        label: 'Contas B2B',
        to: '/admin/tenants',
        icon: 'users',
        matches: (path) => path === '/admin' || matchesBase(path, '/admin/tenants'),
      },
      {
        id: 'admin-customer-portal',
        label: 'Portal do cliente',
        to: '/admin/customer-portal',
        icon: 'workflow',
        matches: (path) => matchesBase(path, '/admin/customer-portal'),
      },
      {
        id: 'admin-internal-areas',
        label: 'Áreas internas',
        to: '/admin/internal-areas',
        icon: 'workflow',
        matches: (path) => matchesBase(path, '/admin/internal-areas'),
      },
      {
        id: 'admin-access',
        label: 'Acessos',
        to: '/admin/access',
        icon: 'shield',
        matches: (path) => matchesBase(path, '/admin/access'),
      },
      {
        id: 'admin-system',
        label: 'Sistema',
        to: '/admin/system',
        icon: 'settings',
        matches: (path) => matchesBase(path, '/admin/system'),
      },
      {
        id: 'admin-knowledge',
        label: 'Conhecimento',
        to: '/admin/knowledge',
        icon: 'book',
        matches: (path) => matchesBase(path, '/admin/knowledge'),
      },
      {
        id: 'admin-build-journal',
        label: 'Diário de construção',
        to: '/admin/build-journal',
        icon: 'document',
        matches: (path) => matchesBase(path, '/admin/build-journal'),
      },
      {
        id: 'admin-product-docs',
        label: 'Documentos',
        to: '/admin/product-docs',
        icon: 'document',
        matches: (path) => matchesBase(path, '/admin/product-docs'),
      },
    );
  }

  return [
    { id: 'work', label: 'Trabalho', items: workItems },
    { id: 'engineering', label: 'Engenharia', items: engineeringItems },
    { id: 'administration', label: 'Administração', items: administrationItems },
  ].filter((section) => section.items.length > 0) as MinimalNavigationSection[];
}

export function resolveMinimalRouteLabel(pathname: string) {
  if (/^\/support\/tickets\/[^/]+/.test(pathname)) {
    return 'Ticket';
  }

  const routes: Array<[string, string]> = [
    ['/support/queue', 'Fila operacional'],
    ['/support/tickets', 'Tickets'],
    ['/support/customers', 'Clientes B2B'],
    ['/cs/portfolio', 'Carteira CS'],
    ['/internal-actions', 'Acionamentos'],
    ['/engineering', 'Engenharia'],
    ['/admin/tenants', 'Contas B2B'],
    ['/admin/customer-portal', 'Portal do cliente'],
    ['/admin/internal-areas', 'Áreas internas'],
    ['/admin/access', 'Acessos'],
    ['/admin/system', 'Sistema'],
    ['/admin/knowledge', 'Conhecimento'],
    ['/admin/build-journal', 'Diário de construção'],
    ['/admin/product-docs', 'Documentos'],
  ];

  return routes.find(([basePath]) => matchesBase(pathname, basePath))?.[1] ?? 'Genius';
}
