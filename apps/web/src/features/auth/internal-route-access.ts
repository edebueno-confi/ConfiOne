import type { InternalScreenKey, PlatformRole } from '../../contracts/admin-contracts';

export interface InternalRouteContext {
  roles: PlatformRole[];
  screenKeys?: InternalScreenKey[];
  hasCustomerPortalAccess: boolean;
  hasInternalActionAreaAccess: boolean;
  hasCsPortfolioAccess: boolean;
}

function matchesRoute(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function hasAnyRole(roles: PlatformRole[], candidates: PlatformRole[]) {
  return candidates.some((candidate) => roles.includes(candidate));
}

function hasScreen(context: InternalRouteContext, screenKey: InternalScreenKey) {
  return context.roles.includes('platform_admin') || context.screenKeys?.includes(screenKey) === true;
}

export function canOpenInternalRoute(
  redirectTo: string,
  context: InternalRouteContext,
) {
  if (matchesRoute(redirectTo, '/inicio')) {
    return (
      context.roles.includes('platform_admin') ||
      hasAnyRole(context.roles, [
        'support_manager',
        'support_agent',
        'engineering_manager',
        'engineering_member',
        'knowledge_manager',
        'audit_reviewer',
        'dashboard_viewer',
      ]) ||
      (context.screenKeys?.length ?? 0) > 0 ||
      context.hasInternalActionAreaAccess ||
      context.hasCsPortfolioAccess
    );
  }

  if (matchesRoute(redirectTo, '/admin')) {
    if (context.roles.includes('platform_admin')) {
      return true;
    }

    if (context.roles.includes('dashboard_viewer')) {
      return (
        matchesRoute(redirectTo, '/admin/analytics') ||
        matchesRoute(redirectTo, '/admin/customer-portal') ||
        matchesRoute(redirectTo, '/admin/knowledge') ||
        matchesRoute(redirectTo, '/admin/settings')
      );
    }

    const adminScreenByRoute: Array<[string, InternalScreenKey]> = [
      ['/admin/analytics', 'analytics'],
      ['/admin/customer-portal', 'customer_portal_admin'],
      ['/admin/knowledge', 'knowledge'],
      ['/admin/settings', 'settings'],
      ['/admin/visao-geral', 'admin_overview'],
      ['/admin/tenants', 'tenants'],
      ['/admin/internal-areas', 'internal_areas'],
      ['/admin/access', 'access'],
      ['/admin/system', 'system'],
      ['/admin/product-docs', 'product_docs'],
    ];
    const adminScreen = adminScreenByRoute.find(([path]) => matchesRoute(redirectTo, path));
    if (adminScreen) {
      return hasScreen(context, adminScreen[1]);
    }

    if (matchesRoute(redirectTo, '/admin/knowledge')) {
      return context.roles.includes('knowledge_manager');
    }

    if (matchesRoute(redirectTo, '/admin/system')) {
      return context.roles.includes('audit_reviewer');
    }

    return false;
  }

  if (matchesRoute(redirectTo, '/cs')) {
    return hasScreen(context, 'cs_portfolio') || context.hasCsPortfolioAccess;
  }

  if (matchesRoute(redirectTo, '/support')) {
    return (
      context.roles.includes('platform_admin') ||
      hasAnyRole(context.roles, ['support_manager', 'support_agent']) ||
      ['support_inbox', 'support_queue', 'support_tickets', 'customers_b2b'].some((key) => hasScreen(context, key as InternalScreenKey))
    );
  }

  if (matchesRoute(redirectTo, '/internal-actions')) {
    return hasScreen(context, 'internal_actions') || context.hasInternalActionAreaAccess;
  }

  if (matchesRoute(redirectTo, '/engineering')) {
    return (
      context.roles.includes('platform_admin') ||
      hasAnyRole(context.roles, ['engineering_manager', 'engineering_member']) ||
      hasScreen(context, 'product')
    );
  }

  if (matchesRoute(redirectTo, '/portal')) {
    return context.hasCustomerPortalAccess;
  }

  return matchesRoute(redirectTo, '/help');
}

export function getDefaultInternalLandingRoute(context: InternalRouteContext) {
  if (context.roles.includes('platform_admin')) {
    return '/inicio';
  }

  const preferredScreens: Array<[InternalScreenKey, string]> = [
    ['home', '/inicio'],
    ['analytics', '/admin/analytics'],
    ['support_inbox', '/support/inbox'],
    ['support_queue', '/support/queue'],
    ['cs_portfolio', '/cs/portfolio'],
    ['internal_actions', '/internal-actions'],
    ['product', '/engineering'],
  ];
  const screenLanding = preferredScreens.find(([screenKey]) => context.screenKeys?.includes(screenKey));
  if (screenLanding) {
    return screenLanding[1];
  }

  if (context.roles.includes('dashboard_viewer')) {
    return '/admin/analytics';
  }

  if (hasAnyRole(context.roles, ['support_manager', 'support_agent'])) {
    return '/inicio';
  }

  if (context.hasCsPortfolioAccess) {
    return '/cs/portfolio';
  }

  if (context.hasInternalActionAreaAccess) {
    return '/internal-actions';
  }

  if (hasAnyRole(context.roles, ['engineering_manager', 'engineering_member'])) {
    return '/engineering';
  }

  if (context.hasCustomerPortalAccess) {
    return '/portal';
  }

  return null;
}
