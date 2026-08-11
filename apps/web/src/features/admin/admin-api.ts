import { toAppError } from '../../app/errors';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';
import type {
  AdminAuditFeedRow,
  AdminAccessMembershipRow,
  AdminAccessUserRow,
  AdminInternalAccessUserRow,
  AdminInternalAccessAreaRow,
  AdminInternalFunctionRow,
  AdminInternalInviteRow,
  AdminInternalOverrideRow,
  AdminInternalProfileRow,
  AdminCustomerAccountAlert,
  AdminCustomerAccountCustomization,
  AdminCustomerAccountFeature,
  AdminCustomerAccountIntegration,
  AdminCustomerAccountProfileDetail,
  AdminCommercialProduct,
  AdminCommercialProductDetail,
  AdminCommercialProductDetailFeature,
  AdminCommercialProductDetailModule,
  AdminCommercialProductDetailOwnership,
  AdminCommercialProductDetailPlan,
  AdminCustomerProductSubscription,
  AdminCustomerProductSubscriptionDetail,
  AdminCustomerProductSubscriptionEntitlement,
  AdminCustomerProductSubscriptionOwner,
  AdminInternalActionTargetArea,
  AdminInternalAreaMembership,
  AdminInternalAccessProfile,
  AdminInternalMembershipScreenGrantRow,
  AdminInternalScreenCatalogRow,
  InternalActorWorkspaceContextRow,
  InternalScreenKey,
  AdminCustomerPortalAccessOverviewRow,
  AdminCustomerPortalArticleCandidateRow,
  AdminCustomerPortalTicketCandidateRow,
  AdminCustomerPortalTenantAccessRow,
  AdminCustomerPortalUserDetailRow,
  AdminCustomerPortalUserRow,
  AdminKnowledgeArticleDetailV2Row,
  AdminKnowledgeArticleEditorialDraftRow,
  AdminKnowledgeArticleAssetRow,
  AdminKnowledgeArticleListItemV2Row,
  AdminKnowledgeArticleReviewAdvisoryRow,
  AdminKnowledgeEntitlementDetailRow,
  AdminKnowledgeEntitlementRow,
  AdminKnowledgeCategoryRecordRow,
  AdminKnowledgeCategoryV2Row,
  AdminKnowledgeSpaceRow,
  AdminTenantContactRecordRow,
  AdminTenantContactViewRow,
  AdminTenantDetailRow,
  AdminTenantMembershipRecordRow,
  AdminTenantMembershipRow,
  AdminTenantRecordRow,
  AdminTenantsListItemRow,
  AdminAiActionPolicyRow,
  AdminAiContextSourcePolicyRow,
  AdminAiOperationalContextReadinessRow,
  AdminSystemAuditEventRow,
  AdminCommunicationChannelReadinessRow,
  AdminSystemHealthCheckRow,
  AdminSystemOperationalSummaryRow,
  AdminTicketKnowledgeLinkRow,
  AdminUserLookupRow,
  CustomerPortalRole,
  KnowledgeAdvisoryClassification,
  KnowledgeArticleStatus,
  KnowledgeArticleReviewStatus,
  KnowledgeReviewHumanConfirmations,
  KnowledgeVisibility,
  RpcAdminAddTenantMemberPayload,
  RpcAdminAddTenantMemberResponse,
  RpcAdminAddCustomerAccountAlertPayload,
  RpcAdminAddCustomerCustomizationPayload,
  RpcAdminAddCustomerIntegrationPayload,
  RpcAdminAddInternalAreaMembershipPayload,
  RpcAdminAddInternalAreaMembershipResponse,
  RpcAdminArchiveCustomerAccountAlertPayload,
  RpcAdminArchiveCustomerCustomizationPayload,
  RpcAdminArchiveCustomerIntegrationPayload,
  RpcAdminArchiveInternalAreaMembershipPayload,
  RpcAdminArchiveInternalAreaMembershipResponse,
  RpcAdminArchiveKnowledgeArticleV2Response,
  RpcAdminArticleSpaceActionV2Payload,
  RpcAdminBeginKnowledgeArticleEditorialRevisionV2Response,
  RpcAdminCreateKnowledgeArticleDraftV2Payload,
  RpcAdminCreateKnowledgeArticleDraftV2Response,
  RpcAdminCreateKnowledgeCategoryV2Payload,
  RpcAdminCreateKnowledgeCategoryV2Response,
  RpcAdminCreateTenantContactPayload,
  RpcAdminCreateTenantContactResponse,
  RpcAdminCreateTenantPayload,
  RpcAdminCreateTenantResponse,
  RpcAdminArchiveKnowledgeArticleEntitlementPayload,
  RpcAdminArchiveKnowledgeArticleEntitlementResponse,
  RpcAdminDiscardKnowledgeArticleEditorialRevisionV2Response,
  RpcAdminGrantKnowledgeArticleEntitlementPayload,
  RpcAdminGrantKnowledgeArticleEntitlementResponse,
  RpcAdminLinkKnowledgeArticleToTicketPayload,
  RpcAdminLinkKnowledgeArticleToTicketResponse,
  RpcAdminMarkKnowledgeArticleReviewedPayload,
  RpcAdminMarkKnowledgeArticleReviewedResponse,
  RpcAdminPrepareKnowledgeArticlePublicationEvidencePayload,
  RpcAdminPrepareKnowledgeArticlePublicationEvidenceResponse,
  RpcAdminPublishKnowledgeArticleV2Response,
  RpcAdminPublishKnowledgeArticleEditorialRevisionV2Response,
  RpcAdminReplaceKnowledgeArticleTagsV1Payload,
  RpcAdminReplaceKnowledgeArticleTagsV1Response,
  RpcAdminSubmitKnowledgeArticleForReviewV2Response,
  RpcAdminUnlinkKnowledgeArticleFromTicketPayload,
  RpcAdminUnlinkKnowledgeArticleFromTicketResponse,
  RpcAdminUpdateKnowledgeArticleReviewStatusPayload,
  RpcAdminUpdateKnowledgeArticleReviewStatusResponse,
  RpcAdminUpsertKnowledgeArticleAssetPayload,
  RpcAdminUpsertKnowledgeArticleAssetResponse,
  RpcAdminUpdateKnowledgeArticleAssetReviewPayload,
  RpcAdminUpdateKnowledgeArticleAssetReviewResponse,
  RpcAdminUpdateKnowledgeArticleDraftV2Payload,
  RpcAdminUpdateKnowledgeArticleDraftV2Response,
  RpcAdminUpdateKnowledgeArticleEditorialRevisionV2Payload,
  RpcAdminUpdateKnowledgeArticleEditorialRevisionV2Response,
  RpcAdminUpdateTenantContactPayload,
  RpcAdminUpdateTenantContactResponse,
  RpcAdminUpdateTenantMemberRolePayload,
  RpcAdminUpdateTenantMemberRoleResponse,
  RpcAdminUpdateTenantMemberStatusPayload,
  RpcAdminUpdateTenantMemberStatusResponse,
  RpcAdminUpdateTenantStatusPayload,
  RpcAdminUpdateTenantStatusResponse,
  RpcAdminSetCustomerFeatureFlagPayload,
  RpcAdminUpdateCustomerAccountAlertPayload,
  RpcAdminUpdateCustomerCustomizationPayload,
  RpcAdminUpdateCustomerIntegrationPayload,
  RpcAdminUpdateInternalAreaMembershipPayload,
  RpcAdminUpdateInternalAreaMembershipResponse,
  RpcAdminReplaceInternalMembershipScreensPayload,
  RpcAdminReplaceInternalMembershipScreensResponse,
  RpcAdminUpsertCustomerAccountProfilePayload,
} from '../../contracts/admin-contracts';

function requireClient() {
  return requireSupabaseBrowserClient();
}

function mapAdminInternalActionTargetArea(
  row: Record<string, unknown>,
): AdminInternalActionTargetArea {
  return {
    activeMembershipCount: Number(row.active_membership_count ?? 0),
    allowsSpecializedBridge: Boolean(row.allows_specialized_bridge),
    areaKey: String(row.area_key),
    displayName: String(row.display_name),
    isSystem: Boolean(row.is_system),
    openActionCount: Number(row.open_action_count ?? 0),
    status: row.status as AdminInternalActionTargetArea['status'],
    updatedAt: String(row.updated_at),
  };
}

function mapAdminInternalAreaMembership(
  row: Record<string, unknown>,
): AdminInternalAreaMembership {
  return {
    areaKey: String(row.area_key),
    areaLabel: String(row.area_label),
    areaStatus: row.area_status as AdminInternalAreaMembership['areaStatus'],
    canArchive: Boolean(row.can_archive),
    canUpdateRole: Boolean(row.can_update_role),
    canUpdateStatus: Boolean(row.can_update_status),
    accessProfileId: (row.access_profile_id as string | null) ?? null,
    accessProfileName: (row.access_profile_name as string | null) ?? null,
    permissionMode: row.permission_mode === 'profile' ? 'profile' : 'custom',
    createdAt: String(row.created_at),
    createdByFullName: (row.created_by_full_name as string | null) ?? null,
    createdByUserId: (row.created_by_user_id as string | null) ?? null,
    membershipId: String(row.membership_id),
    role: row.role as AdminInternalAreaMembership['role'],
    status: row.status as AdminInternalAreaMembership['status'],
    tenantDisplayName: String(row.tenant_display_name),
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantStatus: String(row.tenant_status),
    updatedAt: String(row.updated_at),
    updatedByFullName: (row.updated_by_full_name as string | null) ?? null,
    updatedByUserId: (row.updated_by_user_id as string | null) ?? null,
    userEmail: (row.user_email as string | null) ?? null,
    userFullName: (row.user_full_name as string | null) ?? null,
    userId: String(row.user_id),
    userIsActive: Boolean(row.user_is_active),
  };
}

function escapeLookupTerm(value: string) {
  return value.replace(/[%_,]/g, ' ').trim();
}

const KNOWLEDGE_ASSET_BUCKET = 'knowledge-assets';
const KNOWLEDGE_ASSET_MAX_BYTES = 10 * 1024 * 1024;
const KNOWLEDGE_ASSET_ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

function normalizeStorageFilename(fileName: string) {
  const fallback = 'knowledge-asset';
  const sanitized = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return sanitized || fallback;
}

async function digestFileSha256(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function readImageDimensions(file: File) {
  if (!file.type.startsWith('image/')) {
    return { width: null, height: null };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Não foi possível ler as dimensões da imagem.'));
      image.src = objectUrl;
    });

    return {
      width: Number.isFinite(image.naturalWidth) ? image.naturalWidth : null,
      height: Number.isFinite(image.naturalHeight) ? image.naturalHeight : null,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function listAdminTenants() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_tenants_list')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar a lista de clientes.');
  }

  return (data ?? []) as AdminTenantsListItemRow[];
}

export async function getAdminTenantDetail(tenantId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_tenant_detail')
    .select('*')
    .eq('id', tenantId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o detalhe do cliente.');
  }

  if (!data) {
    return null;
  }

  return {
    ...(data as AdminTenantDetailRow),
    contacts: Array.isArray(data.contacts) ? (data.contacts as AdminTenantDetailRow['contacts']) : [],
  } satisfies AdminTenantDetailRow;
}

function mapAdminCustomerAccountProfile(
  row: Record<string, unknown>,
): AdminCustomerAccountProfileDetail {
  return {
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: String(row.tenant_display_name),
    tenantLegalName: String(row.tenant_legal_name),
    tenantStatus: String(row.tenant_status),
    profileId: (row.profile_id as string | null) ?? null,
    productLine: (row.product_line as AdminCustomerAccountProfileDetail['productLine']) ?? null,
    operationalStatus:
      (row.operational_status as AdminCustomerAccountProfileDetail['operationalStatus']) ?? null,
    accountTier: (row.account_tier as string | null) ?? null,
    internalNotes: (row.internal_notes as string | null) ?? null,
    operationalFlags:
      row.operational_flags && typeof row.operational_flags === 'object' && !Array.isArray(row.operational_flags)
        ? (row.operational_flags as AdminCustomerAccountProfileDetail['operationalFlags'])
        : {},
    createdAt: (row.created_at as string | null) ?? null,
    updatedAt: (row.updated_at as string | null) ?? null,
    createdByUserId: (row.created_by_user_id as string | null) ?? null,
    createdByFullName: (row.created_by_full_name as string | null) ?? null,
    updatedByUserId: (row.updated_by_user_id as string | null) ?? null,
    updatedByFullName: (row.updated_by_full_name as string | null) ?? null,
    canUpdateProfile: Boolean(row.can_update_profile),
  };
}

function mapAdminCustomerAccountIntegration(
  row: Record<string, unknown>,
): AdminCustomerAccountIntegration {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: String(row.tenant_display_name),
    integrationType: row.integration_type as AdminCustomerAccountIntegration['integrationType'],
    provider: String(row.provider),
    status: row.status as AdminCustomerAccountIntegration['status'],
    environment: row.environment as AdminCustomerAccountIntegration['environment'],
    notes: (row.notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    createdByUserId: String(row.created_by_user_id),
    updatedByUserId: String(row.updated_by_user_id),
    canUpdate: Boolean(row.can_update),
    canArchive: Boolean(row.can_archive),
  };
}

function mapAdminCustomerAccountCustomization(
  row: Record<string, unknown>,
): AdminCustomerAccountCustomization {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: String(row.tenant_display_name),
    title: String(row.title),
    description: String(row.description),
    riskLevel: row.risk_level as AdminCustomerAccountCustomization['riskLevel'],
    operationalNote: (row.operational_note as string | null) ?? null,
    status: String(row.status),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    createdByUserId: String(row.created_by_user_id),
    updatedByUserId: String(row.updated_by_user_id),
    canUpdate: Boolean(row.can_update),
    canArchive: Boolean(row.can_archive),
  };
}

function mapAdminCustomerAccountAlert(
  row: Record<string, unknown>,
): AdminCustomerAccountAlert {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: String(row.tenant_display_name),
    severity: row.severity as AdminCustomerAccountAlert['severity'],
    title: String(row.title),
    description: String(row.description),
    active: Boolean(row.active),
    expiresAt: (row.expires_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    createdByUserId: String(row.created_by_user_id),
    updatedByUserId: String(row.updated_by_user_id),
    canUpdate: Boolean(row.can_update),
    canArchive: Boolean(row.can_archive),
  };
}

function mapAdminCustomerAccountFeature(
  row: Record<string, unknown>,
): AdminCustomerAccountFeature {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: String(row.tenant_display_name),
    featureKey: String(row.feature_key),
    enabled: Boolean(row.enabled),
    source: String(row.source),
    notes: (row.notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    createdByUserId: String(row.created_by_user_id),
    updatedByUserId: String(row.updated_by_user_id),
    canUpdate: Boolean(row.can_update),
  };
}

function mapAdminCustomerProductSubscription(
  row: Record<string, unknown>,
): AdminCustomerProductSubscription {
  return {
    subscriptionId: String(row.subscription_id),
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: String(row.tenant_display_name),
    tenantLegalName: String(row.tenant_legal_name),
    tenantStatus: String(row.tenant_status),
    productId: String(row.product_id),
    productKey: String(row.product_key),
    productDisplayName: String(row.product_display_name),
    planId: String(row.plan_id),
    planKey: String(row.plan_key),
    planDisplayName: String(row.plan_display_name),
    status: row.status as AdminCustomerProductSubscription['status'],
    startedAt: (row.started_at as string | null) ?? null,
    endedAt: (row.ended_at as string | null) ?? null,
    renewalAt: (row.renewal_at as string | null) ?? null,
    contractReference: (row.contract_reference as string | null) ?? null,
    source: String(row.source),
    notesInternal: (row.notes_internal as string | null) ?? null,
    metadata:
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as AdminCustomerProductSubscription['metadata'])
        : {},
    activeEntitlementCount: Number(row.active_entitlement_count ?? 0),
    activeOwnerCount: Number(row.active_owner_count ?? 0),
    archivedAt: (row.archived_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapAdminCustomerProductSubscriptionEntitlement(
  value: unknown,
): AdminCustomerProductSubscriptionEntitlement {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    entitlementId: String(row.entitlementId),
    featureId: String(row.featureId),
    featureKey: String(row.featureKey),
    displayName: String(row.displayName),
    status: row.status as AdminCustomerProductSubscriptionEntitlement['status'],
    entitlementSource:
      row.entitlementSource as AdminCustomerProductSubscriptionEntitlement['entitlementSource'],
    reason: (row.reason as string | null) ?? null,
    startsAt: (row.startsAt as string | null) ?? null,
    endsAt: (row.endsAt as string | null) ?? null,
  };
}

function mapAdminCustomerProductSubscriptionOwner(
  value: unknown,
): AdminCustomerProductSubscriptionOwner {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    ownerId: String(row.ownerId),
    ownerUserId: (row.ownerUserId as string | null) ?? null,
    ownerFullName: (row.ownerFullName as string | null) ?? null,
    ownerEmail: (row.ownerEmail as string | null) ?? null,
    areaKey: (row.areaKey as AdminCustomerProductSubscriptionOwner['areaKey']) ?? null,
    areaDisplayName: (row.areaDisplayName as string | null) ?? null,
    ownerRole: row.ownerRole as AdminCustomerProductSubscriptionOwner['ownerRole'],
    status: row.status as AdminCustomerProductSubscriptionOwner['status'],
  };
}

function mapAdminCustomerProductSubscriptionDetail(
  row: Record<string, unknown>,
): AdminCustomerProductSubscriptionDetail {
  return {
    ...mapAdminCustomerProductSubscription(row),
    entitlements: Array.isArray(row.entitlements)
      ? row.entitlements.map(mapAdminCustomerProductSubscriptionEntitlement)
      : [],
    owners: Array.isArray(row.owners)
      ? row.owners.map(mapAdminCustomerProductSubscriptionOwner)
      : [],
  };
}

function mapAdminCommercialProduct(row: Record<string, unknown>): AdminCommercialProduct {
  return {
    productId: String(row.product_id),
    productKey: String(row.product_key),
    displayName: String(row.display_name),
    description: (row.description as string | null) ?? null,
    status: row.status as AdminCommercialProduct['status'],
    planCount: Number(row.plan_count ?? 0),
    activePlanCount: Number(row.active_plan_count ?? 0),
    moduleCount: Number(row.module_count ?? 0),
    featureCount: Number(row.feature_count ?? 0),
    activeOwnershipCount: Number(row.active_ownership_count ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapAdminCommercialProductDetailPlan(
  value: unknown,
): AdminCommercialProductDetailPlan {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    planId: String(row.planId),
    planKey: String(row.planKey),
    displayName: String(row.displayName),
    description: (row.description as string | null) ?? null,
    status: row.status as AdminCommercialProductDetailPlan['status'],
    sortOrder: Number(row.sortOrder ?? 0),
  };
}

function mapAdminCommercialProductDetailModule(
  value: unknown,
): AdminCommercialProductDetailModule {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    moduleId: String(row.moduleId),
    moduleKey: String(row.moduleKey),
    displayName: String(row.displayName),
    description: (row.description as string | null) ?? null,
    status: row.status as AdminCommercialProductDetailModule['status'],
    sortOrder: Number(row.sortOrder ?? 0),
  };
}

function mapAdminCommercialProductDetailFeature(
  value: unknown,
): AdminCommercialProductDetailFeature {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    featureId: String(row.featureId),
    moduleId: (row.moduleId as string | null) ?? null,
    featureKey: String(row.featureKey),
    displayName: String(row.displayName),
    description: (row.description as string | null) ?? null,
    status: row.status as AdminCommercialProductDetailFeature['status'],
    customerVisibleDefault: Boolean(row.customerVisibleDefault),
    supportVisibleDefault: Boolean(row.supportVisibleDefault),
    sortOrder: Number(row.sortOrder ?? 0),
  };
}

function mapAdminCommercialProductDetailOwnership(
  value: unknown,
): AdminCommercialProductDetailOwnership {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    ownershipId: String(row.ownershipId),
    areaKey: row.areaKey as AdminCommercialProductDetailOwnership['areaKey'],
    areaLabel: String(row.areaLabel),
    ownershipRole: row.ownershipRole as AdminCommercialProductDetailOwnership['ownershipRole'],
    status: row.status as AdminCommercialProductDetailOwnership['status'],
    moduleId: (row.moduleId as string | null) ?? null,
    featureId: (row.featureId as string | null) ?? null,
  };
}

function mapAdminCommercialProductDetail(
  row: Record<string, unknown>,
): AdminCommercialProductDetail {
  return {
    productId: String(row.product_id),
    productKey: String(row.product_key),
    displayName: String(row.display_name),
    description: (row.description as string | null) ?? null,
    status: row.status as AdminCommercialProductDetail['status'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    plans: Array.isArray(row.plans)
      ? row.plans.map(mapAdminCommercialProductDetailPlan)
      : [],
    modules: Array.isArray(row.modules)
      ? row.modules.map(mapAdminCommercialProductDetailModule)
      : [],
    features: Array.isArray(row.features)
      ? row.features.map(mapAdminCommercialProductDetailFeature)
      : [],
    ownerships: Array.isArray(row.ownerships)
      ? row.ownerships.map(mapAdminCommercialProductDetailOwnership)
      : [],
  };
}

interface RpcAdminCreateCustomerProductSubscriptionParams {
  p_tenant_id: string;
  p_product_id: string;
  p_plan_id: string;
  p_status?: AdminCustomerProductSubscription['status'];
  p_started_at?: string | null;
  p_renewal_at?: string | null;
  p_contract_reference?: string | null;
  p_source?: string;
  p_notes_internal?: string | null;
  p_metadata?: Record<string, never>;
}

interface RpcAdminUpdateCustomerProductSubscriptionParams {
  p_subscription_id: string;
  p_plan_id?: string | null;
  p_status?: AdminCustomerProductSubscription['status'] | null;
  p_started_at?: string | null;
  p_ended_at?: string | null;
  p_renewal_at?: string | null;
  p_contract_reference?: string | null;
  p_notes_internal?: string | null;
  p_metadata?: Record<string, never> | null;
}

interface RpcAdminArchiveCustomerProductSubscriptionParams {
  p_subscription_id: string;
}

export async function getAdminCustomerAccountProfile(tenantId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_account_profile_detail')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o perfil operacional da conta B2B.');
  }

  return data ? mapAdminCustomerAccountProfile(data as Record<string, unknown>) : null;
}

export async function listAdminCustomerAccountIntegrations(tenantId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_account_integrations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar integrações da conta B2B.');
  }

  return (data ?? []).map((row) =>
    mapAdminCustomerAccountIntegration(row as Record<string, unknown>),
  );
}

export async function listAdminCustomerAccountCustomizations(tenantId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_account_customizations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar customizações da conta B2B.');
  }

  return (data ?? []).map((row) =>
    mapAdminCustomerAccountCustomization(row as Record<string, unknown>),
  );
}

export async function listAdminCustomerAccountAlerts(tenantId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_account_alerts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar alertas internos da conta B2B.');
  }

  return (data ?? []).map((row) =>
    mapAdminCustomerAccountAlert(row as Record<string, unknown>),
  );
}

export async function listAdminCustomerAccountFeatures(tenantId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_account_features')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('feature_key', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar features da conta B2B.');
  }

  return (data ?? []).map((row) =>
    mapAdminCustomerAccountFeature(row as Record<string, unknown>),
  );
}

export async function listAdminCustomerProductSubscriptions(tenantId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_product_subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar subscriptions comerciais da conta B2B.');
  }

  return (data ?? []).map((row) =>
    mapAdminCustomerProductSubscription(row as Record<string, unknown>),
  );
}

export async function getAdminCustomerProductSubscriptionDetail(subscriptionId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_product_subscription_detail')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar detalhe da subscription comercial.');
  }

  return data
    ? mapAdminCustomerProductSubscriptionDetail(data as Record<string, unknown>)
    : null;
}

export async function listAdminCommercialProducts() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_commercial_products')
    .select('*')
    .order('display_name', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar o catálogo comercial.');
  }

  return (data ?? []).map((row) =>
    mapAdminCommercialProduct(row as Record<string, unknown>),
  );
}

export async function getAdminCommercialProductDetail(productId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_commercial_product_detail')
    .select('*')
    .eq('product_id', productId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o detalhe do produto comercial.');
  }

  return data ? mapAdminCommercialProductDetail(data as Record<string, unknown>) : null;
}

export async function listAdminMemberships() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_tenant_memberships')
    .select('*')
    .order('tenant_display_name', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os vínculos administrativos.');
  }

  return (data ?? []) as AdminTenantMembershipRow[];
}

export async function listAdminAccessUsers() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_access_users')
    .select('*')
    .order('last_access_updated_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar o control plane de usuários.');
  }

  return (data ?? []) as AdminAccessUserRow[];
}

export async function listAdminAccessMemberships() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_access_memberships')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os vínculos de acesso.');
  }

  return (data ?? []) as AdminAccessMembershipRow[];
}

export async function listAdminInternalActionTargetAreas() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_internal_action_target_areas')
    .select('*')
    .order('display_name', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar as áreas internas acionáveis.');
  }

  return (data ?? []).map((row) =>
    mapAdminInternalActionTargetArea(row as Record<string, unknown>),
  );
}

export async function listAdminInternalAreaMemberships() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_internal_area_memberships')
    .select('*')
    .order('tenant_display_name', { ascending: true })
    .order('area_label', { ascending: true })
    .order('user_full_name', { ascending: true, nullsFirst: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar memberships de áreas internas.');
  }

  return (data ?? []).map((row) =>
    mapAdminInternalAreaMembership(row as Record<string, unknown>),
  );
}

export async function lookupAdminUsers(rawQuery: string, limit = 8) {
  const client = requireClient();
  const query = escapeLookupTerm(rawQuery);

  if (!query) {
    return [] as AdminUserLookupRow[];
  }

  const { data, error } = await client
    .from('vw_admin_user_lookup')
    .select('*')
    .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw toAppError(error, 'Falha ao buscar usuários para os vínculos.');
  }

  return (data ?? []) as AdminUserLookupRow[];
}

export async function listAdminAuditFeed(limit = 120) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_audit_feed')
    .select('*')
    .limit(limit)
    .order('occurred_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar o feed de auditoria.');
  }

  return (data ?? []) as AdminAuditFeedRow[];
}

export async function listAdminSystemAuditEvents(limit = 120) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_system_audit_events')
    .select('*')
    .limit(limit)
    .order('occurred_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar a auditoria administrativa sanitizada.');
  }

  return (data ?? []) as AdminSystemAuditEventRow[];
}

export async function listAdminSystemHealthChecks() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_system_health_checks')
    .select('*')
    .order('area', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os checks operacionais.');
  }

  return (data ?? []) as AdminSystemHealthCheckRow[];
}

export async function getAdminSystemOperationalSummary() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_system_operational_summary')
    .select('*')
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o resumo operacional do sistema.');
  }

  return data as AdminSystemOperationalSummaryRow | null;
}

export async function listAdminCommunicationChannelReadiness() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_communication_channel_readiness')
    .select('*')
    .order('tenant_display_name', { ascending: true })
    .order('channel_key', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar a governança dos canais de comunicação.');
  }

  return (data ?? []) as AdminCommunicationChannelReadinessRow[];
}

export async function getAdminAiOperationalContextReadiness() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_ai_operational_context_readiness')
    .select('*')
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o readiness AI-native.');
  }

  return data as AdminAiOperationalContextReadinessRow | null;
}

export async function listAdminAiContextSourcePolicies() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_ai_context_source_policies')
    .select('*')
    .order('source_type', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar as políticas de fonte AI-native.');
  }

  return (data ?? []) as AdminAiContextSourcePolicyRow[];
}

export async function listAdminAiActionPolicies() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_ai_action_policies')
    .select('*')
    .order('action_key', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar as políticas de ação AI-native.');
  }

  return (data ?? []) as AdminAiActionPolicyRow[];
}

export async function disableAdminTenantCommunicationChannel(
  tenantId: string,
  channelKey: AdminCommunicationChannelReadinessRow['channel_key'],
  reasonIfUnavailable: string,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_disable_tenant_channel', {
    p_tenant_id: tenantId,
    p_channel: channelKey,
    p_reason_if_unavailable: reasonIfUnavailable,
  });

  if (error) {
    throw toAppError(error, 'Falha ao desabilitar o canal de comunicação.');
  }

  return data as AdminCommunicationChannelReadinessRow;
}

export async function getAdminCustomerPortalAccessOverview() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_portal_access_overview')
    .select('*')
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o resumo do portal cliente.');
  }

  return data as AdminCustomerPortalAccessOverviewRow | null;
}

export async function listAdminCustomerPortalTenantAccess() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_portal_tenant_access')
    .select('*')
    .order('tenant_display_name', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar o panorama por tenant do portal cliente.');
  }

  return (data ?? []) as AdminCustomerPortalTenantAccessRow[];
}

export async function listAdminCustomerPortalUsers() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_portal_users')
    .select('*')
    .order('tenant_display_name', { ascending: true })
    .order('user_full_name', { ascending: true, nullsFirst: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os usuários customer-facing.');
  }

  return (data ?? []) as AdminCustomerPortalUserRow[];
}

export async function getAdminCustomerPortalUserDetail(membershipId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_portal_user_detail')
    .select('*')
    .eq('membership_id', membershipId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o detalhe do usuário customer-facing.');
  }

  return data as AdminCustomerPortalUserDetailRow | null;
}

export async function listAdminKnowledgeEntitlements() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_knowledge_entitlements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os entitlements do portal cliente.');
  }

  return (data ?? []) as AdminKnowledgeEntitlementRow[];
}

export async function getAdminKnowledgeEntitlementDetail(entitlementId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_knowledge_entitlement_detail')
    .select('*')
    .eq('entitlement_id', entitlementId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o detalhe do entitlement.');
  }

  return data as AdminKnowledgeEntitlementDetailRow | null;
}

export async function listAdminTicketKnowledgeLinks() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_ticket_knowledge_links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os vínculos de artigo por ticket.');
  }

  return (data ?? []) as AdminTicketKnowledgeLinkRow[];
}

export async function listAdminCustomerPortalArticleCandidates() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_portal_article_candidates')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('article_title', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar artigos elegíveis para o portal cliente.');
  }

  return (data ?? []) as AdminCustomerPortalArticleCandidateRow[];
}

export async function listAdminCustomerPortalTicketCandidates() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_portal_ticket_candidates')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar tickets elegíveis para vínculo com Knowledge.');
  }

  return (data ?? []) as AdminCustomerPortalTicketCandidateRow[];
}

export async function listAdminKnowledgeSpaces() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_knowledge_spaces')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar as áreas de conhecimento administrativas.');
  }

  return (data ?? []) as AdminKnowledgeSpaceRow[];
}

export async function listAdminKnowledgeCategoriesV2(knowledgeSpaceId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_knowledge_categories_v2')
    .select('*')
    .eq('knowledge_space_id', knowledgeSpaceId)
    .order('category_sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw toAppError(
      error,
      'Falha ao carregar as categorias administrativas da central de ajuda.',
    );
  }

  return (data ?? []) as AdminKnowledgeCategoryV2Row[];
}

export async function listAdminKnowledgeArticlesV2(options: {
  knowledgeSpaceId: string;
  status?: KnowledgeArticleStatus | 'all';
  visibility?: KnowledgeVisibility | 'all';
}) {
  const client = requireClient();
  let query = client
    .from('vw_admin_knowledge_articles_list_v2')
    .select('*')
    .eq('knowledge_space_id', options.knowledgeSpaceId)
    .order('updated_at', { ascending: false });

  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options.visibility && options.visibility !== 'all') {
    query = query.eq('visibility', options.visibility);
  }

  const { data, error } = await query;

  if (error) {
    throw toAppError(
      error,
      'Falha ao carregar a lista administrativa de artigos da central de ajuda.',
    );
  }

  return (data ?? []) as AdminKnowledgeArticleListItemV2Row[];
}

export async function getAdminKnowledgeArticleDetailV2(articleId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_knowledge_article_detail_v2')
    .select('*')
    .eq('id', articleId)
    .maybeSingle();

  if (error) {
    throw toAppError(
      error,
      'Falha ao carregar o detalhe administrativo do artigo.',
    );
  }

  if (!data) {
    return null;
  }

  return {
    ...(data as AdminKnowledgeArticleDetailV2Row),
    revisions: Array.isArray(data.revisions)
      ? (data.revisions as AdminKnowledgeArticleDetailV2Row['revisions'])
      : [],
    sources: Array.isArray(data.sources)
      ? (data.sources as AdminKnowledgeArticleDetailV2Row['sources'])
      : [],
    editorial_draft:
      data.editorial_draft &&
      typeof data.editorial_draft === 'object' &&
      !Array.isArray(data.editorial_draft)
        ? (data.editorial_draft as AdminKnowledgeArticleDetailV2Row['editorial_draft'])
        : null,
  } satisfies AdminKnowledgeArticleDetailV2Row;
}

export async function listAdminKnowledgeArticleReviewAdvisories(
  knowledgeSpaceId: string,
) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_knowledge_article_review_advisories')
    .select('*')
    .eq('knowledge_space_id', knowledgeSpaceId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw toAppError(
      error,
      'Falha ao carregar os alertas editoriais da central de ajuda.',
    );
  }

  return (data ?? []) as AdminKnowledgeArticleReviewAdvisoryRow[];
}

export async function createTenant(payload: RpcAdminCreateTenantPayload) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_create_tenant', payload);

  if (error) {
    throw toAppError(error, 'Falha ao criar tenant.');
  }

  return data as RpcAdminCreateTenantResponse;
}

export async function updateTenantStatus(payload: RpcAdminUpdateTenantStatusPayload) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_update_tenant_status', payload);

  if (error) {
    throw toAppError(error, 'Falha ao atualizar o status do tenant.');
  }

  return data as RpcAdminUpdateTenantStatusResponse;
}

export async function createCustomerProductSubscription(
  payload: RpcAdminCreateCustomerProductSubscriptionParams,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_create_customer_product_subscription',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao criar subscription comercial da conta B2B.');
  }

  return data;
}

export async function updateCustomerProductSubscription(
  payload: RpcAdminUpdateCustomerProductSubscriptionParams,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_customer_product_subscription',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar subscription comercial da conta B2B.');
  }

  return data;
}

export async function archiveCustomerProductSubscription(
  payload: RpcAdminArchiveCustomerProductSubscriptionParams,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_archive_customer_product_subscription',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao arquivar subscription comercial da conta B2B.');
  }

  return data;
}

export async function upsertCustomerAccountProfile(
  payload: RpcAdminUpsertCustomerAccountProfilePayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_upsert_customer_account_profile',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao salvar o perfil operacional da conta B2B.');
  }

  return data;
}

export async function addCustomerAccountIntegration(
  payload: RpcAdminAddCustomerIntegrationPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_add_customer_integration', payload);

  if (error) {
    throw toAppError(error, 'Falha ao adicionar integração da conta B2B.');
  }

  return data;
}

export async function updateCustomerAccountIntegration(
  payload: RpcAdminUpdateCustomerIntegrationPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_update_customer_integration', payload);

  if (error) {
    throw toAppError(error, 'Falha ao atualizar integração da conta B2B.');
  }

  return data;
}

export async function archiveCustomerAccountIntegration(
  payload: RpcAdminArchiveCustomerIntegrationPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_archive_customer_integration', payload);

  if (error) {
    throw toAppError(error, 'Falha ao arquivar integração da conta B2B.');
  }

  return data;
}

export async function addCustomerAccountCustomization(
  payload: RpcAdminAddCustomerCustomizationPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_add_customer_customization', payload);

  if (error) {
    throw toAppError(error, 'Falha ao adicionar customização da conta B2B.');
  }

  return data;
}

export async function updateCustomerAccountCustomization(
  payload: RpcAdminUpdateCustomerCustomizationPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_update_customer_customization', payload);

  if (error) {
    throw toAppError(error, 'Falha ao atualizar customização da conta B2B.');
  }

  return data;
}

export async function archiveCustomerAccountCustomization(
  payload: RpcAdminArchiveCustomerCustomizationPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_archive_customer_customization', payload);

  if (error) {
    throw toAppError(error, 'Falha ao arquivar customização da conta B2B.');
  }

  return data;
}

export async function addCustomerAccountAlert(
  payload: RpcAdminAddCustomerAccountAlertPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_add_customer_account_alert', payload);

  if (error) {
    throw toAppError(error, 'Falha ao adicionar alerta interno da conta B2B.');
  }

  return data;
}

export async function updateCustomerAccountAlert(
  payload: RpcAdminUpdateCustomerAccountAlertPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_update_customer_account_alert', payload);

  if (error) {
    throw toAppError(error, 'Falha ao atualizar alerta interno da conta B2B.');
  }

  return data;
}

export async function archiveCustomerAccountAlert(
  payload: RpcAdminArchiveCustomerAccountAlertPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_archive_customer_account_alert', payload);

  if (error) {
    throw toAppError(error, 'Falha ao arquivar alerta interno da conta B2B.');
  }

  return data;
}

export async function setCustomerAccountFeatureFlag(
  payload: RpcAdminSetCustomerFeatureFlagPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_set_customer_feature_flag', payload);

  if (error) {
    throw toAppError(error, 'Falha ao atualizar feature da conta B2B.');
  }

  return data;
}

export async function addTenantMember(payload: RpcAdminAddTenantMemberPayload) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_add_tenant_member', payload);

  if (error) {
    throw toAppError(error, 'Falha ao adicionar membership.');
  }

  return data as RpcAdminAddTenantMemberResponse;
}

export async function updateTenantMemberRole(
  payload: RpcAdminUpdateTenantMemberRolePayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_tenant_member_role',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar a role do membership.');
  }

  return data as RpcAdminUpdateTenantMemberRoleResponse;
}

export async function updateTenantMemberStatus(
  payload: RpcAdminUpdateTenantMemberStatusPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_tenant_member_status',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar o status do membership.');
  }

  return data as RpcAdminUpdateTenantMemberStatusResponse;
}

export async function listAdminInternalScreenCatalog() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_internal_screen_catalog')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar o catálogo de telas internas.');
  }

  return (data ?? []).map((row) => ({
    ...(row as AdminInternalScreenCatalogRow),
    default_area_keys: Array.isArray(row.default_area_keys)
      ? row.default_area_keys.map(String)
      : [],
    dependency_screen_keys: Array.isArray(row.dependency_screen_keys)
      ? row.dependency_screen_keys
      : [],
  })) as AdminInternalScreenCatalogRow[];
}

export async function listAdminInternalAccessProfiles() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_internal_access_profiles')
    .select('*')
    .eq('is_active', true)
    .order('area_label', { ascending: true, nullsFirst: true })
    .order('name', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os perfis de acesso internos.');
  }

  return (data ?? []).map((row) => ({
    accessProfileId: String(row.access_profile_id),
    areaKey: (row.area_key as string | null) ?? null,
    areaLabel: (row.area_label as string | null) ?? null,
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    isSystem: Boolean(row.is_system),
    isActive: Boolean(row.is_active),
    screenCount: Number(row.screen_count ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    canManage: Boolean(row.can_manage),
  })) as AdminInternalAccessProfile[];
}

export async function listAdminInternalMembershipScreenGrants() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_internal_membership_screen_grants')
    .select('*')
    .order('tenant_display_name', { ascending: true })
    .order('area_label', { ascending: true })
    .order('user_full_name', { ascending: true, nullsFirst: false })
    .order('screen_display_name', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar as telas dos vínculos internos.');
  }

  return (data ?? []) as AdminInternalMembershipScreenGrantRow[];
}

export async function listAdminInternalAccessProfileScreenGrants() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_internal_access_profile_screen_grants')
    .select('access_profile_id, screen_key');
  if (error) throw toAppError(error, 'Falha ao carregar as telas dos perfis.');
  return (data ?? []).map((row) => ({ access_profile_id: String(row.access_profile_id), screen_key: String(row.screen_key) as InternalScreenKey }));
}

export async function replaceAdminInternalAccessProfileScreens(profileId: string, screenKeys: InternalScreenKey[]) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_replace_internal_access_profile_screens', {
    p_access_profile_id: profileId,
    p_screen_keys: screenKeys,
  });
  if (error) throw toAppError(error, 'Falha ao atualizar as telas do perfil.');
  return data;
}

export async function listInternalActorWorkspaceContext() {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_internal_actor_workspace_context');

  if (error) {
    throw toAppError(error, 'Falha ao carregar o contexto de telas do usuário.');
  }

  return ([...(data ?? [])].sort(
    (left, right) => Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0),
  ) ?? []) as InternalActorWorkspaceContextRow[];
}

export async function setGlobalRole(input: {
  userId: string;
  role: 'dashboard_viewer';
  enabled: boolean;
}) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_set_global_role', {
    p_user_id: input.userId,
    p_role: input.role,
    p_is_enabled: input.enabled,
  });

  if (error) {
    throw toAppError(error, 'Falha ao atualizar o papel global do usuário.');
  }

  return data;
}

export async function addInternalAreaMembership(
  payload: RpcAdminAddInternalAreaMembershipPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_add_internal_area_membership', {
    p_area_key: payload.areaKey,
    p_role: payload.role,
    p_status: payload.status ?? 'active',
    p_tenant_id: payload.tenantId,
    p_user_id: payload.userId,
  });

  if (error) {
    throw toAppError(error, 'Falha ao adicionar membership de área interna.');
  }

  return data as RpcAdminAddInternalAreaMembershipResponse;
}

export async function updateInternalAreaMembership(
  payload: RpcAdminUpdateInternalAreaMembershipPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_update_internal_area_membership', {
    p_membership_id: payload.membershipId,
    p_role: payload.role,
    p_status: payload.status,
  });

  if (error) {
    throw toAppError(error, 'Falha ao atualizar membership de área interna.');
  }

  return data as RpcAdminUpdateInternalAreaMembershipResponse;
}

export async function archiveInternalAreaMembership(
  payload: RpcAdminArchiveInternalAreaMembershipPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_archive_internal_area_membership', {
    p_membership_id: payload.membershipId,
  });

  if (error) {
    throw toAppError(error, 'Falha ao arquivar membership de área interna.');
  }

  return data as RpcAdminArchiveInternalAreaMembershipResponse;
}

export async function replaceInternalMembershipScreens(
  payload: RpcAdminReplaceInternalMembershipScreensPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_replace_internal_membership_screens',
    {
      p_membership_id: payload.membershipId,
      p_screen_keys: payload.screenKeys,
    },
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar as telas do vínculo interno.');
  }

  return data as RpcAdminReplaceInternalMembershipScreensResponse;
}

export async function assignInternalAccessProfile(input: {
  membershipId: string;
  accessProfileId: string;
}) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_assign_internal_access_profile', {
    p_membership_id: input.membershipId,
    p_access_profile_id: input.accessProfileId,
  });

  if (error) {
    throw toAppError(error, 'Falha ao atribuir o perfil de acesso interno.');
  }

  return data;
}

export async function listAdminInternalAccessUsers() {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_list_internal_access_users');
  if (error) throw toAppError(error, 'Falha ao carregar os usuários internos.');
  return (data ?? []) as AdminInternalAccessUserRow[];
}

export async function getAdminInternalAccessUser(userId: string) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_get_internal_access_user', { p_user_id: userId });
  if (error) throw toAppError(error, 'Falha ao carregar o detalhe do usuário.');
  return data as Record<string, unknown>;
}

export async function setAdminInternalUserStatus(userId: string, isActive: boolean, justification = 'Alteração realizada pelo administrador no control plane.') {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_set_internal_user_status', { p_user_id: userId, p_is_active: isActive, p_justification: justification });
  if (error) throw toAppError(error, 'Falha ao atualizar o status do usuário.');
  return data;
}

export async function updateAdminInternalAccessAssignment(input: { userId: string; areaKey: string; functionId?: string | null; accessProfileId?: string | null }) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_update_internal_access_assignment', {
    p_user_id: input.userId,
    p_area_key: input.areaKey,
    p_function_id: input.functionId ?? null,
    p_access_profile_id: input.accessProfileId ?? null,
  });
  if (error) throw toAppError(error, 'Falha ao atualizar a atribuição interna.');
  return data;
}

export async function listAdminInternalInvites() {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_list_internal_invites');
  if (error) throw toAppError(error, 'Falha ao carregar os convites internos.');
  return (data ?? []) as AdminInternalInviteRow[];
}

/**
 * Aposentado como caminho de liberação de acesso: a criação de convite saiu do
 * painel. O aceite continua exportado porque convites históricos ainda podem
 * chegar por link, e a revogação continua disponível para encerrá-los.
 */
export async function acceptAdminInternalInvitation(inviteId: string) {
  const client = requireClient();
  const { data, error } = await client.functions.invoke('internal-access-invite', { body: { action: 'accept', inviteId } });
  if (error) throw toAppError(error, 'Falha ao aceitar o convite interno.');
  return data as Record<string, unknown>;
}

export async function revokeAdminInternalInvitation(inviteId: string) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_revoke_internal_invitation', { p_invite_id: inviteId });
  if (error) throw toAppError(error, 'Falha ao revogar o convite interno.');
  return data;
}

/**
 * Criação direta de usuário interno. Caminho oficial de liberação de acesso:
 * a conta de autenticação e o vínculo interno são provisionados no servidor,
 * sem passar por `internal_invites` nem por `internal-access-invite`.
 */
export async function createAdminInternalUser(input: {
  email: string;
  fullName: string;
  areaKey: string;
  functionId?: string | null;
  accessProfileId?: string | null;
}) {
  const client = requireClient();
  const { data, error } = await client.functions.invoke('internal-access-user-create', {
    body: { action: 'create', ...input },
  });
  if (error) throw toAppError(error, 'Falha ao criar o usuário interno.');
  return data as AdminInternalUserCredentialResult & {
    created: boolean;
    alreadyExisted: boolean;
  };
}

/**
 * Resultado de uma operação que emite credencial. `temporaryPassword` só existe
 * nesta resposta: o servidor não persiste, não registra em log e não devolve o
 * valor em nenhuma consulta posterior.
 */
export interface AdminInternalUserCredentialResult {
  userId: string;
  credentialStatus: string;
  temporaryPassword: string | null;
  temporaryPasswordDisplayOnce: boolean;
}

/**
 * Redefinição administrativa de senha. Substituiu o disparo de e-mail depois da
 * decisão de produto de 2026-08-06: a senha é gerada no servidor, exibida uma
 * única vez ao administrador e marcada para troca obrigatória no próximo acesso.
 */
export async function resetAdminInternalUserPassword(userId: string) {
  const client = requireClient();
  const { data, error } = await client.functions.invoke('internal-access-user-create', {
    body: { action: 'password-reset', userId },
  });
  if (error) throw toAppError(error, 'Falha ao redefinir a senha do usuário.');
  return data as AdminInternalUserCredentialResult;
}

export async function listAdminInternalAccessAreas() {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_list_internal_areas');
  if (error) throw toAppError(error, 'Falha ao carregar as áreas internas.');
  return (data ?? []) as AdminInternalAccessAreaRow[];
}

export async function createAdminInternalAccessArea(input: { areaKey: string; displayName: string; description?: string }) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_create_internal_area', { p_area_key: input.areaKey, p_display_name: input.displayName, p_description: input.description ?? null });
  if (error) throw toAppError(error, 'Falha ao criar a área interna.');
  return data as AdminInternalAccessAreaRow;
}

export async function updateAdminInternalAccessArea(input: { areaKey: string; displayName: string; description?: string; isActive: boolean; managerUserId?: string | null }) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_update_internal_area', { p_area_key: input.areaKey, p_display_name: input.displayName, p_description: input.description ?? null, p_is_active: input.isActive, p_manager_user_id: input.managerUserId ?? null });
  if (error) throw toAppError(error, 'Falha ao atualizar a área interna.');
  return data as AdminInternalAccessAreaRow;
}

export async function listAdminInternalFunctions() {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_list_internal_functions');
  if (error) throw toAppError(error, 'Falha ao carregar as funções internas.');
  return (data ?? []) as AdminInternalFunctionRow[];
}

export async function createAdminInternalFunction(input: { areaKey: string; name: string; description?: string; defaultAccessProfileId?: string | null }) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_create_internal_function', { p_area_key: input.areaKey, p_name: input.name, p_description: input.description ?? null, p_default_access_profile_id: input.defaultAccessProfileId ?? null });
  if (error) throw toAppError(error, 'Falha ao criar a função interna.');
  return data as AdminInternalFunctionRow;
}

export async function updateAdminInternalFunction(input: { functionId: string; name: string; description?: string; defaultAccessProfileId?: string | null; isActive: boolean }) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_update_internal_function', { p_function_id: input.functionId, p_name: input.name, p_description: input.description ?? null, p_default_access_profile_id: input.defaultAccessProfileId ?? null, p_is_active: input.isActive });
  if (error) throw toAppError(error, 'Falha ao atualizar a função interna.');
  return data as AdminInternalFunctionRow;
}

export async function listAdminAccessProfiles() {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_list_internal_access_profiles_v2');
  if (error) throw toAppError(error, 'Falha ao carregar os perfis internos.');
  return (Array.isArray(data) ? data : []) as AdminInternalProfileRow[];
}

export async function listAdminAccessCapabilities() {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_list_internal_access_capabilities_v2');
  if (error) throw toAppError(error, 'Falha ao carregar as capacidades.');
  return (Array.isArray(data) ? data : []) as Array<{ capability_key: string; display_name: string; description: string | null; domain: string; is_active: boolean }>;
}

export async function listAdminAccessProfileCapabilities() {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_list_internal_access_profile_capabilities_v2');
  if (error) throw toAppError(error, 'Falha ao carregar as capacidades dos perfis.');
  return (Array.isArray(data) ? data : []) as Array<{ access_profile_id: string; capability_key: string }>;
}

export async function replaceAdminAccessProfileCapabilities(profileId: string, capabilityKeys: string[]) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_replace_internal_profile_capabilities', { p_access_profile_id: profileId, p_capability_keys: capabilityKeys });
  if (error) throw toAppError(error, 'Falha ao atualizar as capacidades do perfil.');
  return data;
}

export async function createAdminAccessProfile(input: { areaKey?: string | null; name: string; description?: string }) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_create_internal_access_profile', { p_area_key: input.areaKey ?? null, p_name: input.name, p_description: input.description ?? null });
  if (error) throw toAppError(error, 'Falha ao criar o perfil interno.');
  return data;
}

export async function updateAdminAccessProfile(input: { profileId: string; name: string; description?: string; isActive: boolean }) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_update_internal_access_profile', { p_access_profile_id: input.profileId, p_name: input.name, p_description: input.description ?? null, p_is_active: input.isActive });
  if (error) throw toAppError(error, 'Falha ao atualizar o perfil interno.');
  return data;
}

export async function listAdminInternalOverrides() {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_list_internal_access_overrides_v2');
  if (error) throw toAppError(error, 'Falha ao carregar os overrides.');
  const rows = Array.isArray(data) ? data as AdminInternalOverrideRow[] : [];
  return [...rows].sort((left, right) => String(right.updated_at ?? '').localeCompare(String(left.updated_at ?? '')));
}

export async function upsertAdminInternalOverride(input: { userId: string; capabilityKey: string; effect: 'allow' | 'deny'; justification: string; validUntil?: string | null }) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_upsert_internal_override', { p_user_id: input.userId, p_capability_key: input.capabilityKey, p_effect: input.effect, p_justification: input.justification, p_valid_until: input.validUntil ?? null });
  if (error) throw toAppError(error, 'Falha ao salvar o override.');
  return data;
}

export async function removeAdminInternalOverride(overrideId: string) {
  const client = requireClient();
  const { error } = await client.rpc('rpc_admin_remove_internal_override', { p_override_id: overrideId });
  if (error) throw toAppError(error, 'Falha ao remover o override.');
}

export async function listAdminKnowledgeArticleAssets(articleId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_knowledge_article_assets')
    .select('*')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true });

  if (error) {
    throw toAppError(
      error,
      'Falha ao carregar os assets administrativos do artigo.',
    );
  }

  const rows = (data ?? []) as AdminKnowledgeArticleAssetRow[];
  const enriched = await Promise.all(
    rows.map(async (row) => {
      if (row.storage_bucket === 'knowledge-public-assets') {
        const { data: publicData } = client.storage
          .from(row.storage_bucket)
          .getPublicUrl(row.storage_object_path);

        return {
          ...row,
          signed_url: publicData.publicUrl,
        } satisfies AdminKnowledgeArticleAssetRow;
      }

      const { data: signedData } = await client.storage
        .from(row.storage_bucket)
        .createSignedUrl(row.storage_object_path, 60 * 10);

      return {
        ...row,
        signed_url: signedData?.signedUrl ?? null,
      } satisfies AdminKnowledgeArticleAssetRow;
    }),
  );

  return enriched;
}

export async function upsertKnowledgeArticleAsset(
  payload: RpcAdminUpsertKnowledgeArticleAssetPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_upsert_knowledge_article_asset_v1',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao registrar o asset governado do artigo.');
  }

  return data as RpcAdminUpsertKnowledgeArticleAssetResponse;
}

export async function uploadKnowledgeArticleAssetFile(options: {
  articleId: string;
  knowledgeSpaceId: string;
  file: File;
  sourceKind: 'upload' | 'paste';
}) {
  const client = requireClient();
  const { articleId, knowledgeSpaceId, file, sourceKind } = options;

  if (!KNOWLEDGE_ASSET_ALLOWED_TYPES.has(file.type)) {
    throw toAppError(
      new Error('Tipo de arquivo não permitido para assets da base de conhecimento.'),
      'Use PNG, JPG, WEBP ou GIF no editor de artigos.',
    );
  }

  if (file.size > KNOWLEDGE_ASSET_MAX_BYTES) {
    throw toAppError(
      new Error('Arquivo acima do limite de 10 MB.'),
      'O asset excede o limite de 10 MB do bucket governado.',
    );
  }

  const sourceHash = await digestFileSha256(file);
  const dimensions = await readImageDimensions(file);
  const safeName = normalizeStorageFilename(file.name);
  const extension = safeName.includes('.') ? safeName.split('.').pop() : 'bin';
  const objectPath = `${knowledgeSpaceId}/${articleId}/${sourceKind}-${sourceHash.slice(
    0,
    12,
  )}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await client.storage
    .from(KNOWLEDGE_ASSET_BUCKET)
    .upload(objectPath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw toAppError(
      new Error(uploadError.message),
      'Falha ao enviar a imagem para o bucket governado.',
    );
  }

  try {
    return await upsertKnowledgeArticleAsset({
      p_article_id: articleId,
      p_knowledge_space_id: knowledgeSpaceId,
      p_source_url: null,
      p_source_path: `manual/${sourceKind}/${safeName}`,
      p_source_hash: sourceHash,
      p_storage_object_path: objectPath,
      p_detected_mime_type: file.type,
      p_file_size_bytes: file.size,
      p_width: dimensions.width,
      p_height: dimensions.height,
      p_alt_text: file.name.replace(/\.[^.]+$/, ''),
      p_caption: null,
      p_review_status: 'pending',
      p_visibility: 'internal',
      p_is_blocked: false,
    });
  } catch (error) {
    await client.storage.from(KNOWLEDGE_ASSET_BUCKET).remove([objectPath]);
    throw error;
  }
}

export async function updateKnowledgeArticleAssetReview(
  payload: RpcAdminUpdateKnowledgeArticleAssetReviewPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_knowledge_article_asset_review_v1',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar a revisão do asset do artigo.');
  }

  return data as RpcAdminUpdateKnowledgeArticleAssetReviewResponse;
}

export async function updateCustomerPortalUserRole(payload: {
  p_membership_id: string;
  p_role: CustomerPortalRole;
}) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_tenant_member_role',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar o papel customer-facing.');
  }

  return data as RpcAdminUpdateTenantMemberRoleResponse;
}

export async function updateCustomerPortalUserStatus(
  payload: RpcAdminUpdateTenantMemberStatusPayload,
) {
  return updateTenantMemberStatus(payload);
}

export async function grantKnowledgeArticleEntitlement(
  payload: RpcAdminGrantKnowledgeArticleEntitlementPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_grant_knowledge_article_entitlement',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao conceder entitlement do portal cliente.');
  }

  return data as RpcAdminGrantKnowledgeArticleEntitlementResponse;
}

export async function archiveKnowledgeArticleEntitlement(
  payload: RpcAdminArchiveKnowledgeArticleEntitlementPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_archive_knowledge_article_entitlement',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao arquivar entitlement do portal cliente.');
  }

  return data as RpcAdminArchiveKnowledgeArticleEntitlementResponse;
}

export async function linkKnowledgeArticleToTicket(
  payload: RpcAdminLinkKnowledgeArticleToTicketPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_link_knowledge_article_to_ticket',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao vincular artigo autorizado ao ticket.');
  }

  return data as RpcAdminLinkKnowledgeArticleToTicketResponse;
}

export async function unlinkKnowledgeArticleFromTicket(
  payload: RpcAdminUnlinkKnowledgeArticleFromTicketPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_unlink_knowledge_article_from_ticket',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao remover o vínculo entre ticket e artigo.');
  }

  return data as RpcAdminUnlinkKnowledgeArticleFromTicketResponse;
}

export async function createTenantContact(
  payload: RpcAdminCreateTenantContactPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_create_tenant_contact',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao criar contato do tenant.');
  }

  return data as RpcAdminCreateTenantContactResponse;
}

export async function updateTenantContact(
  payload: RpcAdminUpdateTenantContactPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_tenant_contact',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar contato do tenant.');
  }

  return data as RpcAdminUpdateTenantContactResponse;
}

export async function createKnowledgeCategoryV2(
  payload: RpcAdminCreateKnowledgeCategoryV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_create_knowledge_category_v2',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao criar a categoria da central de ajuda.');
  }

  return data as RpcAdminCreateKnowledgeCategoryV2Response;
}

export async function createKnowledgeArticleDraftV2(
  payload: RpcAdminCreateKnowledgeArticleDraftV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_create_knowledge_article_draft_v2',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao criar o rascunho da central de ajuda.');
  }

  return data as RpcAdminCreateKnowledgeArticleDraftV2Response;
}

export async function updateKnowledgeArticleDraftV2(
  payload: RpcAdminUpdateKnowledgeArticleDraftV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_knowledge_article_draft_v2',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar o rascunho da central de ajuda.');
  }

  return data as RpcAdminUpdateKnowledgeArticleDraftV2Response;
}

export async function replaceKnowledgeArticleTagsV1(
  payload: RpcAdminReplaceKnowledgeArticleTagsV1Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_replace_knowledge_article_tags_v1',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao persistir as tags do artigo.');
  }

  return (data ?? []) as RpcAdminReplaceKnowledgeArticleTagsV1Response;
}

export async function beginKnowledgeArticleEditorialRevisionV2(
  payload: RpcAdminArticleSpaceActionV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_begin_knowledge_article_editorial_revision_v2',
    payload,
  );

  if (error) {
    throw toAppError(
      error,
      'Falha ao iniciar a revisão editorial do artigo publicado.',
    );
  }

  return data as RpcAdminBeginKnowledgeArticleEditorialRevisionV2Response;
}

export async function updateKnowledgeArticleEditorialRevisionV2(
  payload: RpcAdminUpdateKnowledgeArticleEditorialRevisionV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_knowledge_article_editorial_revision_v2',
    payload,
  );

  if (error) {
    throw toAppError(
      error,
      'Falha ao salvar a revisão editorial do artigo publicado.',
    );
  }

  return data as RpcAdminUpdateKnowledgeArticleEditorialRevisionV2Response;
}

export async function submitKnowledgeArticleForReviewV2(
  payload: RpcAdminArticleSpaceActionV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_submit_knowledge_article_for_review_v2',
    payload,
  );

  if (error) {
    throw toAppError(
      error,
      'Falha ao enviar o artigo para revisão editorial.',
    );
  }

  return data as RpcAdminSubmitKnowledgeArticleForReviewV2Response;
}

export async function publishKnowledgeArticleV2(
  payload: RpcAdminArticleSpaceActionV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_publish_knowledge_article_v2',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao publicar o artigo da central de ajuda.');
  }

  return data as RpcAdminPublishKnowledgeArticleV2Response;
}

export async function archiveKnowledgeArticleV2(
  payload: RpcAdminArticleSpaceActionV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_archive_knowledge_article_v2',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao arquivar o artigo da central de ajuda.');
  }

  return data as RpcAdminArchiveKnowledgeArticleV2Response;
}

export async function publishKnowledgeArticleEditorialRevisionV2(
  payload: RpcAdminArticleSpaceActionV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_publish_knowledge_article_editorial_revision_v2',
    payload,
  );

  if (error) {
    throw toAppError(
      error,
      'Falha ao publicar a atualização do artigo.',
    );
  }

  return data as RpcAdminPublishKnowledgeArticleEditorialRevisionV2Response;
}

export async function discardKnowledgeArticleEditorialRevisionV2(
  payload: RpcAdminArticleSpaceActionV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_discard_knowledge_article_editorial_revision_v2',
    payload,
  );

  if (error) {
    throw toAppError(
      error,
      'Falha ao descartar a revisão editorial do artigo.',
    );
  }

  return data as RpcAdminDiscardKnowledgeArticleEditorialRevisionV2Response;
}

export async function updateKnowledgeArticleReviewStatus(
  payload: RpcAdminUpdateKnowledgeArticleReviewStatusPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_knowledge_article_review_status',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar o status da revisão editorial.');
  }

  return data as RpcAdminUpdateKnowledgeArticleReviewStatusResponse;
}

export async function markKnowledgeArticleReviewed(
  payload: RpcAdminMarkKnowledgeArticleReviewedPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_mark_knowledge_article_reviewed',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao marcar a revisão editorial como concluída.');
  }

  return data as RpcAdminMarkKnowledgeArticleReviewedResponse;
}

export async function prepareKnowledgeArticlePublicationEvidence(
  payload: RpcAdminPrepareKnowledgeArticlePublicationEvidencePayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_prepare_knowledge_article_publication_evidence_v1',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao preparar evidência editorial pública.');
  }

  return data as RpcAdminPrepareKnowledgeArticlePublicationEvidenceResponse;
}

export type {
  AdminAccessMembershipRow,
  AdminAccessUserRow,
  AdminAuditFeedRow,
  AdminInternalAccessProfile,
  AdminInternalActionTargetArea,
  AdminInternalAreaMembership,
  AdminInternalMembershipScreenGrantRow,
  AdminInternalScreenCatalogRow,
  InternalActorWorkspaceContextRow,
  AdminCustomerPortalAccessOverviewRow,
  AdminCustomerPortalArticleCandidateRow,
  AdminCustomerPortalTicketCandidateRow,
  AdminCustomerPortalTenantAccessRow,
  AdminCustomerPortalUserDetailRow,
  AdminCustomerPortalUserRow,
  AdminKnowledgeArticleDetailV2Row,
  AdminKnowledgeArticleEditorialDraftRow,
  AdminKnowledgeArticleAssetRow,
  AdminKnowledgeArticleListItemV2Row,
  AdminKnowledgeArticleReviewAdvisoryRow,
  AdminKnowledgeEntitlementDetailRow,
  AdminKnowledgeEntitlementRow,
  AdminKnowledgeCategoryRecordRow,
  AdminKnowledgeCategoryV2Row,
  AdminKnowledgeSpaceRow,
  AdminTenantContactRecordRow,
  AdminTenantContactViewRow,
  AdminTenantDetailRow,
  AdminTenantMembershipRecordRow,
  AdminTenantMembershipRow,
  AdminTenantRecordRow,
  AdminTenantsListItemRow,
  AdminAiActionPolicyRow,
  AdminAiContextSourcePolicyRow,
  AdminAiOperationalContextReadinessRow,
  AdminSystemAuditEventRow,
  AdminCommunicationChannelReadinessRow,
  AdminSystemHealthCheckRow,
  AdminSystemOperationalSummaryRow,
  AdminTicketKnowledgeLinkRow,
  AdminUserLookupRow,
  CustomerPortalRole,
  KnowledgeAdvisoryClassification,
  KnowledgeArticleStatus,
  KnowledgeArticleReviewStatus,
  KnowledgeReviewHumanConfirmations,
  KnowledgeVisibility,
};
