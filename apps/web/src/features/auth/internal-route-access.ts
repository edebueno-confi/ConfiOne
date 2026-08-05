import type { InternalScreenKey, PlatformRole } from '../../contracts/admin-contracts';
import {
  getReleaseLandingRoute,
  isRoutePublishedInRelease,
} from '../../app/release-surface.mjs';

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
  return context.screenKeys?.includes(screenKey) === true;
}

export function canOpenInternalRoute(
  redirectTo: string,
  context: InternalRouteContext,
) {
  // Access decisions are made against the pathname. Query parameters belong
  // to the destination state (for example, an analytics tab) and must not
  // turn an otherwise published route into a false denial.
  const routePathname = redirectTo.split(/[?#]/, 1)[0] || '/';

  // Step 1 of the validation order: a surface that is not published in the
  // current release is never reachable, regardless of the profile. This keeps
  // `platform_admin` inside the reduced surface during the release phase.
  if (!isRoutePublishedInRelease(routePathname)) {
    return false;
  }

  if (matchesRoute(routePathname, '/inicio')) {
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

  if (matchesRoute(routePathname, '/admin')) {
    if (routePathname === '/admin') {
      return (context.screenKeys ?? []).some((key) =>
        ['analytics', 'settings', 'knowledge', 'access'].includes(key),
      );
    }

    if (hasAnyRole(context.roles, ['support_manager', 'support_agent'])) {
      return matchesRoute(routePathname, '/admin/analytics') && hasScreen(context, 'analytics');
    }

    if (context.roles.includes('dashboard_viewer')) {
      return matchesRoute(routePathname, '/admin/analytics');
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
    const adminScreen = adminScreenByRoute.find(([path]) => matchesRoute(routePathname, path));
    if (adminScreen) {
      return hasScreen(context, adminScreen[1]);
    }

    if (matchesRoute(routePathname, '/admin/knowledge')) {
      return context.roles.includes('knowledge_manager');
    }

    if (matchesRoute(routePathname, '/admin/system')) {
      return context.roles.includes('audit_reviewer');
    }

    return false;
  }

  if (matchesRoute(routePathname, '/cs')) {
    return hasScreen(context, 'cs_portfolio') || context.hasCsPortfolioAccess;
  }

  if (matchesRoute(routePathname, '/support')) {
    return (
      context.roles.includes('platform_admin') ||
      hasAnyRole(context.roles, ['support_manager', 'support_agent']) ||
      ['support_inbox', 'support_queue', 'support_tickets', 'customers_b2b'].some((key) => hasScreen(context, key as InternalScreenKey))
    );
  }

  if (matchesRoute(routePathname, '/internal-actions')) {
    return hasScreen(context, 'internal_actions') || context.hasInternalActionAreaAccess;
  }

  if (matchesRoute(routePathname, '/engineering')) {
    return (
      context.roles.includes('platform_admin') ||
      hasAnyRole(context.roles, ['engineering_manager', 'engineering_member']) ||
      hasScreen(context, 'product')
    );
  }

  if (matchesRoute(routePathname, '/portal')) {
    return context.hasCustomerPortalAccess;
  }

  return matchesRoute(routePathname, '/help');
}

export function getDefaultInternalLandingRoute(context: InternalRouteContext) {
  // While a reduced surface is published, the post-login destination must be a
  // published route. The candidate list below stays intact for the full mode.
  const releaseLanding = getReleaseLandingRoute();
  if (releaseLanding && canOpenInternalRoute(releaseLanding, context)) {
    return releaseLanding;
  }

  if (context.roles.includes('platform_admin') && isRoutePublishedInRelease('/inicio')) {
    return '/inicio';
  }

  const preferredScreens: Array<[InternalScreenKey, string]> = [
    ['analytics', '/admin/analytics'],
    ['knowledge', '/admin/knowledge'],
    ['access', '/admin/access'],
    ['settings', '/admin/settings'],
    ['home', '/inicio'],
    ['support_inbox', '/support/inbox'],
    ['support_queue', '/support/queue'],
    ['cs_portfolio', '/cs/portfolio'],
    ['internal_actions', '/internal-actions'],
    ['product', '/engineering'],
  ];
  const screenLanding = preferredScreens.find(
    ([screenKey, route]) =>
      context.screenKeys?.includes(screenKey) && isRoutePublishedInRelease(route),
  );
  if (screenLanding) {
    return screenLanding[1];
  }

  if (context.roles.includes('dashboard_viewer')) {
    return '/admin/analytics';
  }

  if (hasAnyRole(context.roles, ['support_manager', 'support_agent']) && isRoutePublishedInRelease('/inicio')) {
    return '/inicio';
  }

  if (context.hasCsPortfolioAccess && isRoutePublishedInRelease('/cs/portfolio')) {
    return '/cs/portfolio';
  }

  if (context.hasInternalActionAreaAccess && isRoutePublishedInRelease('/internal-actions')) {
    return '/internal-actions';
  }

  if (
    hasAnyRole(context.roles, ['engineering_manager', 'engineering_member']) &&
    isRoutePublishedInRelease('/engineering')
  ) {
    return '/engineering';
  }

  if (context.hasCustomerPortalAccess && isRoutePublishedInRelease('/portal')) {
    return '/portal';
  }

  return null;
}
