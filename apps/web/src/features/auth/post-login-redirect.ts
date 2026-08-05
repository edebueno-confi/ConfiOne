import { toAppError } from '../../app/errors';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';
import type { InternalScreenKey, PlatformRole } from '../../contracts/admin-contracts';
import {
  canOpenInternalRoute,
  getDefaultInternalLandingRoute,
  type InternalRouteContext,
} from './internal-route-access';
import { resolveReleaseRedirect } from '../../app/release-surface.mjs';

export type PostLoginDenialReason =
  | 'missing-profile'
  | 'inactive-profile'
  | 'missing-authorized-workspace';

export interface PostLoginRedirectResolution {
  destination: string | null;
  denialReason: PostLoginDenialReason | null;
  roles: PlatformRole[];
  screenKeys: InternalScreenKey[];
  hasCustomerPortalAccess: boolean;
  hasInternalActionAreaAccess: boolean;
  hasCsPortfolioAccess: boolean;
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

/**
 * Applies the release manifest's technical redirects before permission checks.
 *
 * `/inicio` is retained as a compatibility entry point, but the reduced
 * release publishes `/admin/analytics`. Checking the compatibility pathname
 * directly would incorrectly deny a valid platform administrator session.
 */
export function normalizePostLoginRedirectTarget(rawValue: string | null) {
  const normalized = normalizeRedirectTo(rawValue);
  if (!normalized) return null;

  const match = normalized.match(/^([^?#]*)([?#].*)?$/);
  const pathname = match?.[1] ?? normalized;
  const technicalTarget = resolveReleaseRedirect(pathname);
  if (!technicalTarget) return normalized;

  return `${technicalTarget}${match?.[2] ?? ''}`;
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
    .from('vw_internal_action_area_auth_context')
    .select('tenant_id')
    .limit(1);

  if (error) {
    throw toAppError(error, 'Falha ao validar o contexto de áreas internas.');
  }

  return (data ?? []).length > 0;
}

async function hasCsPortfolioAccess() {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_cs_customer_portfolio')
    .select('tenant_id')
    .limit(1);

  if (error) {
    throw toAppError(error, 'Falha ao validar o contexto de Customer Success.');
  }

  return (data ?? []).length > 0;
}

async function loadWorkspaceScreenKeys() {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_internal_actor_workspace_context');

  if (error) {
    throw toAppError(error, 'Falha ao validar as telas autorizadas do usuário.');
  }

  return Array.from(
    new Set(
      [...(data ?? [])]
        .sort((left, right) => Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0))
        .map((row) => row.screen_key as InternalScreenKey)
        .filter(Boolean),
    ),
  );
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
      screenKeys: [],
      hasCustomerPortalAccess: false,
      hasInternalActionAreaAccess: false,
      hasCsPortfolioAccess: false,
    };
  }

  const roles = ((data.roles ?? []) as PlatformRole[]).filter(Boolean);

  if (!data.is_active) {
    return {
      destination: null,
      denialReason: 'inactive-profile',
      roles,
      screenKeys: [],
      hasCustomerPortalAccess: false,
      hasInternalActionAreaAccess: false,
      hasCsPortfolioAccess: false,
    };
  }

  const [customerPortalAccess, internalActionAreaAccess, csPortfolioAccess, screenKeys] = await Promise.all([
    hasCustomerPortalAccess(),
    hasInternalActionAreaAccess(),
    hasCsPortfolioAccess(),
    loadWorkspaceScreenKeys(),
  ]);
  const context: InternalRouteContext = {
    roles,
    screenKeys,
    hasCustomerPortalAccess: customerPortalAccess,
    hasInternalActionAreaAccess: internalActionAreaAccess,
    hasCsPortfolioAccess: csPortfolioAccess,
  };
  const redirectTo = normalizePostLoginRedirectTarget(rawRedirectTo);
  const requestedRouteAllowed = redirectTo ? canOpenInternalRoute(redirectTo, context) : null;
  const destination = redirectTo
    ? requestedRouteAllowed
      ? redirectTo
      : '/access-denied'
    : getDefaultInternalLandingRoute(context);

  return {
    destination,
    denialReason: redirectTo && requestedRouteAllowed === false
      ? 'missing-authorized-workspace'
      : destination
        ? null
        : 'missing-authorized-workspace',
    roles,
    screenKeys,
    hasCustomerPortalAccess: customerPortalAccess,
    hasInternalActionAreaAccess: internalActionAreaAccess,
    hasCsPortfolioAccess: csPortfolioAccess,
  };
}
