import { toAppError } from '../../app/errors';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';
import type { PlatformRole } from '../../contracts/admin-contracts';

export type PostLoginDenialReason =
  | 'missing-profile'
  | 'inactive-profile'
  | 'missing-authorized-workspace';

interface AuthRouteContext {
  roles: PlatformRole[];
  hasCustomerPortalAccess: boolean;
  hasInternalActionAreaAccess: boolean;
}

export interface PostLoginRedirectResolution {
  destination: string | null;
  denialReason: PostLoginDenialReason | null;
  roles: PlatformRole[];
  hasCustomerPortalAccess: boolean;
  hasInternalActionAreaAccess: boolean;
}

function normalizeRedirectTo(rawValue: string | null) {
  if (!rawValue || !rawValue.startsWith('/') || rawValue.startsWith('//')) {
    return null;
  }

  if (rawValue.startsWith('/login') || rawValue.startsWith('/access-denied')) {
    return null;
  }

  return rawValue;
}

function matchesRoute(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function hasAnyRole(roles: PlatformRole[], candidates: PlatformRole[]) {
  return candidates.some((candidate) => roles.includes(candidate));
}

function canOpenRedirectTarget(redirectTo: string, context: AuthRouteContext) {
  if (matchesRoute(redirectTo, '/admin')) {
    return context.roles.includes('platform_admin');
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

  if (matchesRoute(redirectTo, '/help')) {
    return true;
  }

  return false;
}

function getDefaultLandingRoute(context: AuthRouteContext) {
  if (context.roles.includes('platform_admin')) {
    return '/admin';
  }

  if (hasAnyRole(context.roles, ['support_manager', 'support_agent'])) {
    return '/support/queue';
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

async function hasCustomerPortalAccess() {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_customer_portal_auth_context')
    .select('tenant_id')
    .limit(1);

  if (error) {
    throw toAppError(error, 'Falha ao validar o contexto do portal cliente.');
  }

  return (data ?? []).length > 0;
}

async function hasInternalActionAreaAccess() {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_internal_action_queue_by_area')
    .select('internal_action_id')
    .limit(1);

  if (error) {
    throw toAppError(error, 'Falha ao validar a fila de acionamentos internos.');
  }

  return (data ?? []).length > 0;
}

export async function resolvePostLoginRedirect(
  rawRedirectTo: string | null,
): Promise<PostLoginRedirectResolution> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_admin_auth_context')
    .select('id,is_active,roles')
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao validar o contexto autenticado.');
  }

  if (!data) {
    return {
      destination: null,
      denialReason: 'missing-profile',
      roles: [],
      hasCustomerPortalAccess: false,
      hasInternalActionAreaAccess: false,
    };
  }

  const roles = ((data.roles ?? []) as PlatformRole[]).filter(Boolean);

  if (!data.is_active) {
    return {
      destination: null,
      denialReason: 'inactive-profile',
      roles,
      hasCustomerPortalAccess: false,
      hasInternalActionAreaAccess: false,
    };
  }

  const [customerPortalAccess, internalActionAreaAccess] = await Promise.all([
    hasCustomerPortalAccess(),
    hasInternalActionAreaAccess(),
  ]);
  const context: AuthRouteContext = {
    roles,
    hasCustomerPortalAccess: customerPortalAccess,
    hasInternalActionAreaAccess: internalActionAreaAccess,
  };
  const redirectTo = normalizeRedirectTo(rawRedirectTo);
  const destination =
    redirectTo && canOpenRedirectTarget(redirectTo, context)
      ? redirectTo
      : getDefaultLandingRoute(context);

  return {
    destination,
    denialReason: destination ? null : 'missing-authorized-workspace',
    roles,
    hasCustomerPortalAccess: customerPortalAccess,
    hasInternalActionAreaAccess: internalActionAreaAccess,
  };
}
