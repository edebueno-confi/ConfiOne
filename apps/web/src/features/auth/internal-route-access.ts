import type { PlatformRole } from '../../contracts/admin-contracts';

export interface InternalRouteContext {
  roles: PlatformRole[];
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

export function canOpenInternalRoute(
  redirectTo: string,
  context: InternalRouteContext,
) {
  if (matchesRoute(redirectTo, '/admin')) {
    return context.roles.includes('platform_admin');
  }

  if (matchesRoute(redirectTo, '/cs')) {
    return context.roles.includes('platform_admin') || context.hasCsPortfolioAccess;
  }

  if (matchesRoute(redirectTo, '/support')) {
    return (
      context.roles.includes('platform_admin') ||
      hasAnyRole(context.roles, ['support_manager', 'support_agent'])
    );
  }

  if (matchesRoute(redirectTo, '/internal-actions')) {
    return context.roles.includes('platform_admin') || context.hasInternalActionAreaAccess;
  }

  if (matchesRoute(redirectTo, '/engineering')) {
    return (
      context.roles.includes('platform_admin') ||
      hasAnyRole(context.roles, ['engineering_manager', 'engineering_member'])
    );
  }

  if (matchesRoute(redirectTo, '/portal')) {
    return context.hasCustomerPortalAccess;
  }

  return matchesRoute(redirectTo, '/help');
}

export function getDefaultInternalLandingRoute(context: InternalRouteContext) {
  if (context.roles.includes('platform_admin')) {
    return '/admin';
  }

  if (hasAnyRole(context.roles, ['support_manager', 'support_agent'])) {
    return '/support/queue';
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
