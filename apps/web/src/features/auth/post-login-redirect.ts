import { toAppError } from '../../app/errors';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';
import type { PlatformRole } from '../../contracts/admin-contracts';
import {
  canOpenInternalRoute,
  getDefaultInternalLandingRoute,
  type InternalRouteContext,
} from './internal-route-access';

export type PostLoginDenialReason =
  | 'missing-profile'
  | 'inactive-profile'
  | 'missing-authorized-workspace';

export interface PostLoginRedirectResolution {
  destination: string | null;
  denialReason: PostLoginDenialReason | null;
  roles: PlatformRole[];
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
      hasCsPortfolioAccess: false,
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
      hasCsPortfolioAccess: false,
    };
  }

  const [customerPortalAccess, internalActionAreaAccess, csPortfolioAccess] = await Promise.all([
    hasCustomerPortalAccess(),
    hasInternalActionAreaAccess(),
    hasCsPortfolioAccess(),
  ]);
  const context: InternalRouteContext = {
    roles,
    hasCustomerPortalAccess: customerPortalAccess,
    hasInternalActionAreaAccess: internalActionAreaAccess,
    hasCsPortfolioAccess: csPortfolioAccess,
  };
  const redirectTo = normalizeRedirectTo(rawRedirectTo);
  const destination =
    redirectTo && canOpenInternalRoute(redirectTo, context)
      ? redirectTo
      : getDefaultInternalLandingRoute(context);

  return {
    destination,
    denialReason: destination ? null : 'missing-authorized-workspace',
    roles,
    hasCustomerPortalAccess: customerPortalAccess,
    hasInternalActionAreaAccess: internalActionAreaAccess,
    hasCsPortfolioAccess: csPortfolioAccess,
  };
}
