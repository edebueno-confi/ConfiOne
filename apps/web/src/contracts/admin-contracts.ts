import type {
  AdminInternalActionTargetArea,
  AdminInternalAreaMembership,
  AdminCustomerAccountAlert,
  AdminCustomerAccountCustomization,
  AdminCustomerAccountFeature,
  AdminCustomerAccountIntegration,
  AdminCustomerAccountProfileDetail,
  CustomerAlertSeverity,
  CustomerCustomizationRiskLevel,
  CustomerIntegrationEnvironment,
  CustomerIntegrationStatus,
  CustomerIntegrationType,
  CustomerOperationalStatus,
  CustomerProductLine,
  InternalAreaMembershipRecord,
  InternalAreaMembershipRole,
  InternalAreaMembershipStatus,
  IsoTimestamp,
  JsonValue,
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
  RpcAdminSetCustomerFeatureFlagPayload,
  RpcAdminUpdateCustomerAccountAlertPayload,
  RpcAdminUpdateCustomerCustomizationPayload,
  RpcAdminUpdateCustomerIntegrationPayload,
  RpcAdminUpdateInternalAreaMembershipPayload,
  RpcAdminUpdateInternalAreaMembershipResponse,
  RpcAdminUpsertCustomerAccountProfilePayload,
  Uuid,
} from '@genius-support-os/contracts';

export type {
  AdminCustomerAccountAlert,
  AdminCustomerAccountCustomization,
  AdminCustomerAccountFeature,
  AdminCustomerAccountIntegration,
  AdminCustomerAccountProfileDetail,
  AdminInternalActionTargetArea,
  AdminInternalAreaMembership,
  CustomerAlertSeverity,
  CustomerCustomizationRiskLevel,
  CustomerIntegrationEnvironment,
  CustomerIntegrationStatus,
  CustomerIntegrationType,
  CustomerOperationalStatus,
  CustomerProductLine,
  InternalAreaMembershipRecord,
  InternalAreaMembershipRole,
  InternalAreaMembershipStatus,
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
  RpcAdminSetCustomerFeatureFlagPayload,
  RpcAdminUpdateCustomerAccountAlertPayload,
  RpcAdminUpdateCustomerCustomizationPayload,
  RpcAdminUpdateCustomerIntegrationPayload,
  RpcAdminUpdateInternalAreaMembershipPayload,
  RpcAdminUpdateInternalAreaMembershipResponse,
  RpcAdminUpsertCustomerAccountProfilePayload,
};

export const CUSTOMER_PRODUCT_LINES = [
  'genius_returns',
  'after_sale',
  'hybrid',
  'other',
] as const satisfies readonly CustomerProductLine[];

export const CUSTOMER_OPERATIONAL_STATUSES = [
  'onboarding',
  'active',
  'limited',
  'suspended',
  'legacy',
] as const satisfies readonly CustomerOperationalStatus[];

export const CUSTOMER_INTEGRATION_TYPES = [
  'ecommerce_platform',
  'erp',
  'oms',
  'logistics_provider',
  'carrier',
  'gateway',
  'refund_provider',
  'custom_api',
  'other',
] as const satisfies readonly CustomerIntegrationType[];

export const CUSTOMER_INTEGRATION_STATUSES = [
  'planned',
  'active',
  'degraded',
  'disabled',
  'deprecated',
] as const satisfies readonly CustomerIntegrationStatus[];

export const CUSTOMER_INTEGRATION_ENVIRONMENTS = [
  'production',
  'sandbox',
  'staging',
  'other',
] as const satisfies readonly CustomerIntegrationEnvironment[];

export const CUSTOMER_CUSTOMIZATION_RISK_LEVELS = [
  'low',
  'medium',
  'high',
  'critical',
] as const satisfies readonly CustomerCustomizationRiskLevel[];

export const CUSTOMER_ALERT_SEVERITIES = [
  'info',
  'warning',
  'high',
  'critical',
] as const satisfies readonly CustomerAlertSeverity[];

export const INTERNAL_AREA_MEMBERSHIP_ROLES = [
  'member',
  'manager',
  'viewer',
] as const satisfies readonly InternalAreaMembershipRole[];

export const INTERNAL_AREA_MEMBERSHIP_STATUSES = [
  'active',
  'inactive',
  'archived',
] as const satisfies readonly InternalAreaMembershipStatus[];

export const TENANT_STATUSES = ['active', 'suspended', 'archived'] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

export const MEMBERSHIP_STATUSES = ['invited', 'active', 'revoked'] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const TENANT_ROLES = [
  'tenant_admin',
  'tenant_manager',
  'tenant_requester',
  'tenant_viewer',
] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];

export const CUSTOMER_PORTAL_ROLES = [
  'customer_user',
  'customer_manager',
] as const;
export type CustomerPortalRole = (typeof CUSTOMER_PORTAL_ROLES)[number];

export type CustomerPortalAccessStatus = 'active' | 'pending' | 'blocked';
export type CustomerPortalEntitlementScope = 'tenant' | 'customer_portal';
export type CustomerPortalEntitlementStatus = 'active' | 'archived';
export type CustomerPortalKnowledgeExposureSource =
  | 'public'
  | 'customer_portal'
  | 'ticket_linked';

export const PLATFORM_ROLES = [
  'platform_admin',
  'support_agent',
  'support_manager',
  'engineering_member',
  'engineering_manager',
  'knowledge_manager',
  'audit_reviewer',
] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export interface AdminGateProfileRow {
  id: Uuid;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface AdminAuthContextRow extends AdminGateProfileRow {
  roles: PlatformRole[];
}

export interface AdminTenantRecordRow {
  id: Uuid;
  slug: string;
  legal_name: string;
  display_name: string;
  status: TenantStatus;
  data_region: string;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_user_id: Uuid | null;
  updated_by_user_id: Uuid | null;
}

export interface AdminTenantContactRecordRow {
  id: Uuid;
  tenant_id: Uuid;
  linked_user_id: Uuid | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_user_id: Uuid | null;
  updated_by_user_id: Uuid | null;
}

export interface AdminTenantMembershipRecordRow {
  id: Uuid;
  tenant_id: Uuid;
  user_id: Uuid;
  role: TenantRole;
  status: MembershipStatus;
  invited_by_user_id: Uuid | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_user_id: Uuid | null;
  updated_by_user_id: Uuid | null;
}

export interface AdminTenantContactViewRow {
  id: Uuid;
  linked_user_id: Uuid | null;
  linked_user_full_name: string | null;
  linked_user_email: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
}

export interface AdminTenantsListItemRow extends AdminTenantRecordRow {
  created_by_full_name: string | null;
  updated_by_full_name: string | null;
  membership_count: number;
  active_membership_count: number;
  invited_membership_count: number;
  revoked_membership_count: number;
  contact_count: number;
  active_contact_count: number;
  primary_contact_id: Uuid | null;
  primary_contact_linked_user_id: Uuid | null;
  primary_contact_full_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  primary_contact_job_title: string | null;
}

export interface AdminTenantDetailRow extends AdminTenantRecordRow {
  created_by_full_name: string | null;
  updated_by_full_name: string | null;
  membership_count: number;
  active_membership_count: number;
  invited_membership_count: number;
  revoked_membership_count: number;
  contact_count: number;
  active_contact_count: number;
  contacts: AdminTenantContactViewRow[];
}

export interface AdminTenantMembershipRow {
  id: Uuid;
  tenant_id: Uuid;
  tenant_slug: string;
  tenant_display_name: string;
  tenant_status: TenantStatus;
  user_id: Uuid;
  user_full_name: string | null;
  user_email: string | null;
  user_avatar_url: string | null;
  user_is_active: boolean;
  role: TenantRole;
  status: MembershipStatus;
  invited_by_user_id: Uuid | null;
  invited_by_full_name: string | null;
  invited_by_email: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_user_id: Uuid | null;
  updated_by_user_id: Uuid | null;
  created_by_full_name?: string | null;
  updated_by_full_name?: string | null;
  access_state?: 'active' | 'pending' | 'blocked';
  can_update_role?: boolean;
  can_update_status?: boolean;
}

export interface AdminUserLookupRow {
  user_id: Uuid;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
  created_at: IsoTimestamp;
}

export interface AdminAuditFeedRow {
  id: Uuid;
  occurred_at: IsoTimestamp;
  actor_user_id: Uuid | null;
  actor_full_name: string | null;
  actor_email: string | null;
  tenant_id: Uuid | null;
  tenant_slug: string | null;
  tenant_display_name: string | null;
  entity_schema: string;
  entity_table: string;
  entity_id: Uuid | null;
  action: string;
  before_state: JsonValue | null;
  after_state: JsonValue | null;
  metadata: JsonValue | null;
}

export interface AdminAccessUserRow {
  user_id: Uuid;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  platform_roles: PlatformRole[];
  tenant_roles: TenantRole[];
  membership_count: number;
  active_membership_count: number;
  invited_membership_count: number;
  revoked_membership_count: number;
  last_access_updated_at: IsoTimestamp;
  memberships: JsonValue;
}

export type AdminAccessMembershipRow = AdminTenantMembershipRow & {
  access_state: 'active' | 'pending' | 'blocked';
  created_by_full_name: string | null;
  updated_by_full_name: string | null;
  can_update_role: boolean;
  can_update_status: boolean;
};

export type AdminSystemSeverity = 'ok' | 'attention' | 'critical';
export type AdminSystemCheckStatus = AdminSystemSeverity | 'unavailable';
export type CommunicationChannelReadinessStatus =
  | 'active'
  | 'disabled'
  | 'not_configured'
  | 'future'
  | 'blocked'
  | 'unavailable';

export type CommunicationDeliveryChannel =
  | 'customer_portal'
  | 'email_future'
  | 'whatsapp_future'
  | 'chat_future'
  | 'api_future';

export interface AdminSystemAuditEventRow {
  id: Uuid;
  occurred_at: IsoTimestamp;
  actor_user_id: Uuid | null;
  actor_display_name: string;
  actor_email: string | null;
  tenant_id: Uuid | null;
  tenant_slug: string | null;
  scope_label: string;
  entity_schema: string;
  service_key: string;
  service_label: string;
  entity_id: Uuid | null;
  action: string;
  action_label: string;
  severity: AdminSystemSeverity;
  impact_label: string;
  sanitized_context: JsonValue;
}

export interface AdminSystemHealthCheckRow {
  check_key: string;
  label: string;
  description: string;
  status: AdminSystemCheckStatus;
  area: string;
  checked_at: IsoTimestamp;
}

export interface AdminSystemOperationalSummaryRow {
  audit_event_count: number;
  audit_events_24h: number;
  critical_event_count: number;
  attention_event_count: number;
  observed_service_count: number;
  last_event_at: IsoTimestamp | null;
}

export interface AdminCommunicationChannelReadinessRow {
  tenant_id: Uuid;
  tenant_slug: string;
  tenant_display_name: string;
  tenant_status: TenantStatus;
  channel_key: CommunicationDeliveryChannel;
  channel_label: string;
  direction_supported: 'inbound' | 'outbound' | 'bidirectional';
  is_external: boolean;
  is_real_channel: boolean;
  provider_required: boolean;
  status_global: CommunicationChannelReadinessStatus;
  future_provider_type: string | null;
  description: string;
  readiness_status: CommunicationChannelReadinessStatus;
  is_enabled: boolean;
  can_send: boolean;
  can_receive: boolean;
  reason_if_unavailable: string | null;
  required_setup_summary: string;
  operational_note: string | null;
  last_checked_at: IsoTimestamp;
  managed_by_user_id: Uuid | null;
  managed_by_full_name: string | null;
  managed_by_email: string | null;
  updated_at: IsoTimestamp | null;
  can_mark_active: boolean;
  activation_blocked_by_contract: boolean;
}

export type InternalDocumentStatus = 'draft' | 'published' | 'archived' | 'blocked';
export type InternalDocumentSensitivity = 'internal' | 'restricted' | 'public_internal';
export type InternalDocumentValidationStatus = 'valid' | 'warning' | 'blocked';
export type InternalDocumentSurface = 'product-docs' | 'build-journal';

export interface AdminInternalDocumentCatalogRow {
  document_id: Uuid;
  slug: string;
  source_path: string;
  title: string;
  category: string;
  status: InternalDocumentStatus;
  sensitivity: InternalDocumentSensitivity;
  owner: string;
  surfaces: InternalDocumentSurface[];
  allow_inline_reader: boolean;
  description: string | null;
  current_source_hash: string;
  current_version_number: number;
  current_validation_status: InternalDocumentValidationStatus;
  updated_at: IsoTimestamp;
  published_at: IsoTimestamp | null;
}

export interface AdminInternalDocumentValidationWarning {
  id: string;
  count: number;
  severity: string;
}

export interface AdminInternalDocumentDetailRow
  extends AdminInternalDocumentCatalogRow {
  body_md_sanitized: string;
  validation_warnings: JsonValue;
  sanitized_size_bytes: number;
  original_size_bytes: number;
}

export interface AdminCustomerPortalAccessOverviewRow {
  tenant_count: number;
  active_tenant_count: number;
  portal_user_count: number;
  active_user_count: number;
  invited_user_count: number;
  blocked_user_count: number;
  manager_count: number;
  visible_ticket_count: number;
  authorized_article_count: number;
  tenant_without_manager_count: number;
  missing_contact_count: number;
  inactive_contact_count: number;
}

export interface AdminCustomerPortalTenantAccessRow {
  tenant_id: Uuid;
  tenant_slug: string;
  tenant_display_name: string;
  tenant_status: TenantStatus;
  portal_user_count: number;
  active_user_count: number;
  invited_user_count: number;
  blocked_user_count: number;
  manager_count: number;
  visible_ticket_count: number;
  authorized_article_count: number;
  active_entitlement_count: number;
  active_ticket_link_count: number;
  last_access_at: IsoTimestamp | null;
  has_active_manager: boolean;
  missing_contact_count: number;
  inactive_contact_count: number;
  risk_summary: string | null;
}

export interface AdminCustomerPortalUserRow {
  membership_id: Uuid;
  tenant_id: Uuid;
  tenant_slug: string;
  tenant_display_name: string;
  tenant_status: TenantStatus;
  user_id: Uuid;
  user_full_name: string | null;
  user_email: string | null;
  user_is_active: boolean;
  linked_contact_id: Uuid | null;
  linked_contact_full_name: string | null;
  linked_contact_email: string | null;
  linked_contact_job_title: string | null;
  linked_contact_is_primary: boolean;
  linked_contact_is_active: boolean;
  portal_role: CustomerPortalRole;
  membership_status: MembershipStatus;
  access_status: CustomerPortalAccessStatus;
  can_view_all_tenant_tickets: boolean;
  visible_ticket_count: number;
  authorized_article_count: number;
  last_access_at: IsoTimestamp | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_full_name: string | null;
  updated_by_full_name: string | null;
  risk_summary: string | null;
  missing_contact: boolean;
  inactive_contact: boolean;
}

export interface AdminCustomerPortalUserDetailRow
  extends AdminCustomerPortalUserRow {
  tenant_legal_name: string;
  public_article_count: number;
  tenant_article_count: number;
  customer_portal_article_count: number;
  ticket_linked_article_count: number;
}

export interface AdminKnowledgeEntitlementRow {
  entitlement_id: Uuid;
  tenant_id: Uuid;
  tenant_slug: string;
  tenant_display_name: string;
  article_id: Uuid;
  article_title: string;
  article_slug: string;
  category_name: string | null;
  article_visibility: KnowledgeVisibility;
  article_status: KnowledgeArticleStatus;
  entitlement_scope: CustomerPortalEntitlementScope;
  entitlement_status: CustomerPortalEntitlementStatus;
  relation_reason: string | null;
  exposure_source: Extract<
    CustomerPortalKnowledgeExposureSource,
    'public' | 'customer_portal'
  >;
  created_by_user_id: Uuid | null;
  created_by_full_name: string | null;
  created_at: IsoTimestamp;
  archived_at: IsoTimestamp | null;
  archived_by_user_id: Uuid | null;
  archived_by_full_name: string | null;
}

export interface AdminKnowledgeEntitlementDetailRow
  extends AdminKnowledgeEntitlementRow {
  published_at: IsoTimestamp | null;
  updated_at: IsoTimestamp | null;
  active_ticket_link_count: number;
}

export interface AdminTicketKnowledgeLinkRow {
  ticket_knowledge_link_id: Uuid;
  tenant_id: Uuid;
  tenant_slug: string;
  tenant_display_name: string;
  ticket_id: Uuid;
  ticket_title: string;
  ticket_status: string;
  article_id: Uuid;
  article_title: string;
  article_slug: string;
  category_name: string | null;
  article_visibility: KnowledgeVisibility;
  article_status: KnowledgeArticleStatus;
  relation_reason: string | null;
  link_status: CustomerPortalEntitlementStatus;
  exposure_source: Extract<CustomerPortalKnowledgeExposureSource, 'ticket_linked'>;
  created_by_user_id: Uuid | null;
  created_by_full_name: string | null;
  created_at: IsoTimestamp;
  archived_at: IsoTimestamp | null;
  archived_by_user_id: Uuid | null;
  archived_by_full_name: string | null;
}

export interface AdminCustomerPortalArticleCandidateRow {
  article_id: Uuid;
  article_title: string;
  article_slug: string;
  category_name: string | null;
  article_visibility: KnowledgeVisibility;
  article_status: KnowledgeArticleStatus;
  knowledge_space_slug: string | null;
  knowledge_space_display_name: string | null;
  published_at: IsoTimestamp | null;
}

export interface AdminCustomerPortalTicketCandidateRow {
  ticket_id: Uuid;
  tenant_id: Uuid;
  tenant_slug: string;
  tenant_display_name: string;
  ticket_title: string;
  customer_status_label: string;
  updated_at: IsoTimestamp;
  requester_contact_full_name: string | null;
}

export interface RpcAdminCreateTenantPayload {
  p_slug: string;
  p_legal_name: string;
  p_display_name: string;
  p_data_region?: string;
}

export type RpcAdminCreateTenantResponse = AdminTenantRecordRow;

export interface RpcAdminUpdateTenantStatusPayload {
  p_tenant_id: Uuid;
  p_status: TenantStatus;
}

export type RpcAdminUpdateTenantStatusResponse = AdminTenantRecordRow;

export interface RpcAdminAddTenantMemberPayload {
  p_tenant_id: Uuid;
  p_user_id: Uuid;
  p_role: TenantRole;
  p_status?: MembershipStatus;
}

export type RpcAdminAddTenantMemberResponse = AdminTenantMembershipRecordRow;

export interface RpcAdminUpdateTenantMemberRolePayload {
  p_membership_id: Uuid;
  p_role: TenantRole;
}

export type RpcAdminUpdateTenantMemberRoleResponse = AdminTenantMembershipRecordRow;

export interface RpcAdminUpdateTenantMemberStatusPayload {
  p_membership_id: Uuid;
  p_status: MembershipStatus;
}

export type RpcAdminUpdateTenantMemberStatusResponse = AdminTenantMembershipRecordRow;

export interface AdminKnowledgeEntitlementRecordRow {
  id: Uuid;
  tenant_id: Uuid;
  article_id: Uuid;
  entitlement_scope: CustomerPortalEntitlementScope;
  status: 'active';
  relation_reason: string | null;
  created_by_user_id: Uuid | null;
  updated_by_user_id: Uuid | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  archived_at: IsoTimestamp | null;
  archived_by_user_id: Uuid | null;
}

export interface AdminTicketKnowledgeLinkRecordRow {
  id: Uuid;
  tenant_id: Uuid;
  ticket_id: Uuid;
  article_id: Uuid | null;
  link_type: string;
  note: string | null;
  created_by_user_id: Uuid;
  created_at: IsoTimestamp;
  archived_at: IsoTimestamp | null;
  archived_by_user_id: Uuid | null;
}

export interface RpcAdminGrantKnowledgeArticleEntitlementPayload {
  p_tenant_id: Uuid;
  p_article_id: Uuid;
  p_entitlement_scope: CustomerPortalEntitlementScope;
  p_relation_reason?: string | null;
}

export type RpcAdminGrantKnowledgeArticleEntitlementResponse =
  AdminKnowledgeEntitlementRecordRow;

export interface RpcAdminArchiveKnowledgeArticleEntitlementPayload {
  p_entitlement_id: Uuid;
}

export type RpcAdminArchiveKnowledgeArticleEntitlementResponse =
  AdminKnowledgeEntitlementRecordRow;

export interface RpcAdminLinkKnowledgeArticleToTicketPayload {
  p_tenant_id: Uuid;
  p_ticket_id: Uuid;
  p_article_id: Uuid;
  p_relation_reason?: string | null;
}

export type RpcAdminLinkKnowledgeArticleToTicketResponse =
  AdminTicketKnowledgeLinkRecordRow;

export interface RpcAdminUnlinkKnowledgeArticleFromTicketPayload {
  p_ticket_knowledge_link_id: Uuid;
}

export type RpcAdminUnlinkKnowledgeArticleFromTicketResponse =
  AdminTicketKnowledgeLinkRecordRow;

export interface RpcAdminCreateTenantContactPayload {
  p_tenant_id: Uuid;
  p_full_name: string;
  p_email?: string | null;
  p_phone?: string | null;
  p_job_title?: string | null;
  p_is_primary?: boolean;
  p_is_active?: boolean;
  p_linked_user_id?: Uuid | null;
}

export type RpcAdminCreateTenantContactResponse = AdminTenantContactRecordRow;

export interface RpcAdminUpdateTenantContactPayload {
  p_contact_id: Uuid;
  p_full_name: string;
  p_email?: string | null;
  p_phone?: string | null;
  p_job_title?: string | null;
  p_is_primary?: boolean;
  p_is_active?: boolean;
  p_linked_user_id?: Uuid | null;
}

export type RpcAdminUpdateTenantContactResponse = AdminTenantContactRecordRow;

export const KNOWLEDGE_VISIBILITIES = ['public', 'internal', 'restricted'] as const;
export type KnowledgeVisibility = (typeof KNOWLEDGE_VISIBILITIES)[number];

export const KNOWLEDGE_ARTICLE_STATUSES = [
  'draft',
  'review',
  'published',
  'archived',
] as const;
export type KnowledgeArticleStatus = (typeof KNOWLEDGE_ARTICLE_STATUSES)[number];

export const KNOWLEDGE_ADVISORY_CLASSIFICATIONS = [
  'public',
  'internal',
  'restricted',
  'obsolete',
  'duplicate',
] as const;
export type KnowledgeAdvisoryClassification =
  (typeof KNOWLEDGE_ADVISORY_CLASSIFICATIONS)[number];

export const KNOWLEDGE_ARTICLE_REVIEW_STATUSES = [
  'pending',
  'in_review',
  'needs_changes',
  'ready_for_review',
  'ready_for_publish',
  'reviewed',
] as const;
export type KnowledgeArticleReviewStatus =
  (typeof KNOWLEDGE_ARTICLE_REVIEW_STATUSES)[number];

export const KNOWLEDGE_ARTICLE_ASSET_REVIEW_STATUSES = [
  'pending',
  'approved',
  'blocked',
  'replaced',
] as const;
export type KnowledgeArticleAssetReviewStatus =
  (typeof KNOWLEDGE_ARTICLE_ASSET_REVIEW_STATUSES)[number];

export const KNOWLEDGE_SPACE_STATUSES = ['draft', 'active', 'archived'] as const;
export type KnowledgeSpaceStatus = (typeof KNOWLEDGE_SPACE_STATUSES)[number];

export interface AdminKnowledgeSpaceRow {
  id: Uuid;
  organization_id: Uuid;
  organization_slug: string;
  organization_display_name: string;
  owner_tenant_id: Uuid | null;
  owner_tenant_slug: string | null;
  owner_tenant_display_name: string | null;
  slug: string;
  display_name: string;
  status: KnowledgeSpaceStatus;
  is_primary: boolean;
  default_locale: string;
  primary_domain_host: string | null;
  primary_domain_path_prefix: string | null;
  primary_domain_status: string | null;
  brand_name: string | null;
  logo_asset_url: string | null;
  category_count: number;
  article_count: number;
  published_article_count: number;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_user_id: Uuid | null;
  created_by_full_name: string | null;
  updated_by_user_id: Uuid | null;
  updated_by_full_name: string | null;
}

export interface AdminKnowledgeCategoryRecordRow {
  id: Uuid;
  tenant_id: Uuid | null;
  knowledge_space_id: Uuid | null;
  parent_category_id: Uuid | null;
  visibility: KnowledgeVisibility;
  name: string;
  slug: string;
  description: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_user_id: Uuid | null;
  updated_by_user_id: Uuid | null;
}

export interface AdminKnowledgeCategoryV2Row {
  id: Uuid;
  knowledge_space_id: Uuid;
  knowledge_space_slug: string;
  knowledge_space_display_name: string;
  knowledge_space_status: KnowledgeSpaceStatus;
  organization_id: Uuid;
  organization_slug: string;
  organization_display_name: string;
  owner_tenant_id: Uuid | null;
  owner_tenant_slug: string | null;
  owner_tenant_display_name: string | null;
  tenant_id: Uuid | null;
  tenant_slug: string | null;
  tenant_display_name: string | null;
  parent_category_id: Uuid | null;
  parent_slug: string | null;
  parent_name: string | null;
  visibility: KnowledgeVisibility;
  name: string;
  slug: string;
  description: string | null;
  article_count: number;
  draft_count: number;
  review_count: number;
  published_count: number;
  archived_count: number;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_full_name: string | null;
  updated_by_full_name: string | null;
}

export interface AdminKnowledgeArticleRecordRow {
  id: Uuid;
  tenant_id: Uuid | null;
  knowledge_space_id: Uuid | null;
  category_id: Uuid | null;
  visibility: KnowledgeVisibility;
  status: KnowledgeArticleStatus;
  title: string;
  slug: string;
  summary: string | null;
  body_md: string;
  tags: string[];
  source_path: string | null;
  source_hash: string | null;
  current_revision_number: number;
  submitted_for_review_at: IsoTimestamp | null;
  published_at: IsoTimestamp | null;
  archived_at: IsoTimestamp | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_user_id: Uuid | null;
  updated_by_user_id: Uuid | null;
}

export interface AdminKnowledgeArticleListItemV2Row {
  id: Uuid;
  knowledge_space_id: Uuid;
  knowledge_space_slug: string;
  knowledge_space_display_name: string;
  knowledge_space_status: KnowledgeSpaceStatus;
  organization_id: Uuid;
  organization_slug: string;
  organization_display_name: string;
  owner_tenant_id: Uuid | null;
  owner_tenant_slug: string | null;
  owner_tenant_display_name: string | null;
  tenant_id: Uuid | null;
  tenant_slug: string | null;
  tenant_display_name: string | null;
  category_id: Uuid | null;
  category_name: string | null;
  category_slug: string | null;
  visibility: KnowledgeVisibility;
  status: KnowledgeArticleStatus;
  title: string;
  slug: string;
  summary: string | null;
  tags: string[];
  source_path: string | null;
  source_hash: string | null;
  public_article_path: string | null;
  current_revision_number: number;
  revision_count: number;
  latest_revision_at: IsoTimestamp | null;
  submitted_for_review_at: IsoTimestamp | null;
  published_at: IsoTimestamp | null;
  archived_at: IsoTimestamp | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_full_name: string | null;
  updated_by_full_name: string | null;
  has_editorial_draft: boolean;
  editorial_draft_updated_at: IsoTimestamp | null;
}

export interface AdminKnowledgeArticleRevisionRow {
  id: Uuid;
  revision_number: number;
  status_snapshot: KnowledgeArticleStatus;
  visibility: KnowledgeVisibility;
  title: string;
  slug: string;
  summary: string | null;
  body_md: string;
  source_path: string | null;
  source_hash: string | null;
  change_note: string | null;
  created_at: IsoTimestamp;
  created_by_user_id: Uuid | null;
}

export interface AdminKnowledgeArticleSourceRow {
  id: Uuid;
  revision_id: Uuid | null;
  source_kind: string;
  source_path: string;
  source_hash: string;
  source_title: string | null;
  source_metadata: JsonValue | null;
  created_at: IsoTimestamp;
}

export interface AdminKnowledgeArticleEditorialDraftRow {
  id: Uuid;
  article_id: Uuid;
  knowledge_space_id: Uuid;
  tenant_id: Uuid | null;
  category_id: Uuid | null;
  visibility: KnowledgeVisibility;
  title: string;
  slug: string;
  summary: string | null;
  body_md: string;
  tags: string[];
  source_path: string | null;
  source_hash: string | null;
  based_on_revision_number: number;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_user_id: Uuid | null;
  updated_by_user_id: Uuid | null;
  created_by_full_name: string | null;
  updated_by_full_name: string | null;
}

export interface AdminKnowledgeArticleDetailV2Row {
  id: Uuid;
  knowledge_space_id: Uuid;
  knowledge_space_slug: string;
  knowledge_space_display_name: string;
  knowledge_space_status: KnowledgeSpaceStatus;
  organization_id: Uuid;
  organization_slug: string;
  organization_display_name: string;
  owner_tenant_id: Uuid | null;
  owner_tenant_slug: string | null;
  owner_tenant_display_name: string | null;
  tenant_id: Uuid | null;
  tenant_slug: string | null;
  tenant_display_name: string | null;
  category_id: Uuid | null;
  category_name: string | null;
  category_slug: string | null;
  visibility: KnowledgeVisibility;
  status: KnowledgeArticleStatus;
  title: string;
  slug: string;
  summary: string | null;
  body_md: string;
  tags: string[];
  source_path: string | null;
  source_hash: string | null;
  public_article_path: string | null;
  current_revision_number: number;
  submitted_for_review_at: IsoTimestamp | null;
  published_at: IsoTimestamp | null;
  archived_at: IsoTimestamp | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_full_name: string | null;
  updated_by_full_name: string | null;
  revisions: AdminKnowledgeArticleRevisionRow[];
  sources: AdminKnowledgeArticleSourceRow[];
  editorial_draft: AdminKnowledgeArticleEditorialDraftRow | null;
}

export interface AdminKnowledgeArticleAssetRow {
  id: Uuid;
  article_id: Uuid;
  article_title: string;
  article_slug: string;
  article_status: KnowledgeArticleStatus;
  article_visibility: KnowledgeVisibility;
  knowledge_space_id: Uuid;
  knowledge_space_slug: string;
  category_id: Uuid | null;
  category_name: string | null;
  source_url: string | null;
  source_path: string | null;
  source_hash: string;
  storage_bucket: string;
  storage_object_path: string;
  detected_mime_type: string;
  file_size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  caption: string | null;
  review_status: KnowledgeArticleAssetReviewStatus;
  visibility: KnowledgeVisibility;
  is_blocked: boolean;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  reviewed_by_full_name: string | null;
  signed_url?: string | null;
}

export interface KnowledgeReviewHumanConfirmations {
  title_reviewed?: boolean;
  summary_reviewed?: boolean;
  body_reviewed?: boolean;
  category_reviewed?: boolean;
  visibility_reviewed?: boolean;
  no_sensitive_data_exposed?: boolean;
  ready_for_review?: boolean;
  ready_for_publish?: boolean;
}

export interface AdminKnowledgeArticleReviewAdvisoryRecordRow {
  id: Uuid;
  article_id: Uuid;
  source_hash: string | null;
  suggested_visibility: KnowledgeVisibility;
  suggested_classification: KnowledgeAdvisoryClassification;
  classification_reason: string;
  duplicate_group_key: string | null;
  risk_flags: JsonValue;
  human_confirmations: JsonValue;
  review_status: KnowledgeArticleReviewStatus;
  review_notes: string | null;
  reviewed_by_user_id: Uuid | null;
  reviewed_at: IsoTimestamp | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_user_id: Uuid | null;
  updated_by_user_id: Uuid | null;
}

export interface AdminKnowledgeArticleReviewAdvisoryRow
  extends AdminKnowledgeArticleReviewAdvisoryRecordRow {
  knowledge_space_id: Uuid;
  knowledge_space_slug: string;
  knowledge_space_display_name: string;
  source_path: string | null;
  article_visibility: KnowledgeVisibility;
  article_status: KnowledgeArticleStatus;
  article_title: string;
  article_slug: string;
  article_summary: string | null;
  article_updated_at: IsoTimestamp;
  category_id: Uuid | null;
  category_name: string | null;
  category_slug: string | null;
  duplicate_group_article_count: number;
  reviewed_by_full_name: string | null;
  created_by_full_name: string | null;
  updated_by_full_name: string | null;
}

export interface RpcAdminCreateKnowledgeCategoryV2Payload {
  p_name: string;
  p_slug: string;
  p_description?: string | null;
  p_visibility?: KnowledgeVisibility;
  p_parent_category_id?: Uuid | null;
  p_knowledge_space_id: Uuid;
  p_tenant_id?: Uuid | null;
}

export type RpcAdminCreateKnowledgeCategoryV2Response =
  AdminKnowledgeCategoryRecordRow;

export interface RpcAdminCreateKnowledgeArticleDraftV2Payload {
  p_title: string;
  p_slug: string;
  p_summary?: string | null;
  p_body_md?: string;
  p_category_id?: Uuid | null;
  p_visibility?: KnowledgeVisibility;
  p_knowledge_space_id: Uuid;
  p_tenant_id?: Uuid | null;
  p_source_path?: string | null;
  p_source_hash?: string | null;
}

export type RpcAdminCreateKnowledgeArticleDraftV2Response =
  AdminKnowledgeArticleRecordRow;

export interface RpcAdminUpdateKnowledgeArticleDraftV2Payload {
  p_article_id: Uuid;
  p_knowledge_space_id: Uuid;
  p_title: string;
  p_slug: string;
  p_summary?: string | null;
  p_body_md?: string;
  p_category_id?: Uuid | null;
  p_visibility?: KnowledgeVisibility;
  p_source_path?: string | null;
  p_source_hash?: string | null;
}

export type RpcAdminUpdateKnowledgeArticleDraftV2Response =
  AdminKnowledgeArticleRecordRow;

export interface RpcAdminReplaceKnowledgeArticleTagsV1Payload {
  p_article_id: Uuid;
  p_knowledge_space_id: Uuid;
  p_tags?: string[];
}

export type RpcAdminReplaceKnowledgeArticleTagsV1Response = string[];

export interface RpcAdminArticleSpaceActionV2Payload {
  p_article_id: Uuid;
  p_knowledge_space_id: Uuid;
}

export type RpcAdminSubmitKnowledgeArticleForReviewV2Response =
  AdminKnowledgeArticleRecordRow;
export type RpcAdminPublishKnowledgeArticleV2Response =
  AdminKnowledgeArticleRecordRow;
export type RpcAdminArchiveKnowledgeArticleV2Response =
  AdminKnowledgeArticleRecordRow;

export type RpcAdminBeginKnowledgeArticleEditorialRevisionV2Response =
  AdminKnowledgeArticleEditorialDraftRow;

export interface RpcAdminUpdateKnowledgeArticleEditorialRevisionV2Payload {
  p_article_id: Uuid;
  p_knowledge_space_id: Uuid;
  p_title: string;
  p_slug: string;
  p_summary?: string | null;
  p_body_md?: string;
  p_category_id?: Uuid | null;
  p_visibility?: KnowledgeVisibility;
  p_source_path?: string | null;
  p_source_hash?: string | null;
}

export type RpcAdminUpdateKnowledgeArticleEditorialRevisionV2Response =
  AdminKnowledgeArticleEditorialDraftRow;

export type RpcAdminPublishKnowledgeArticleEditorialRevisionV2Response =
  AdminKnowledgeArticleRecordRow;

export type RpcAdminDiscardKnowledgeArticleEditorialRevisionV2Response =
  AdminKnowledgeArticleEditorialDraftRow;

export interface RpcAdminUpdateKnowledgeArticleReviewStatusPayload {
  p_article_id: Uuid;
  p_review_status: KnowledgeArticleReviewStatus;
  p_human_confirmations?: KnowledgeReviewHumanConfirmations | null;
  p_review_notes?: string | null;
}

export type RpcAdminUpdateKnowledgeArticleReviewStatusResponse =
  AdminKnowledgeArticleReviewAdvisoryRecordRow;

export interface RpcAdminMarkKnowledgeArticleReviewedPayload {
  p_article_id: Uuid;
  p_human_confirmations?: KnowledgeReviewHumanConfirmations | null;
  p_review_notes?: string | null;
}

export type RpcAdminMarkKnowledgeArticleReviewedResponse =
  AdminKnowledgeArticleReviewAdvisoryRecordRow;

export interface RpcAdminPrepareKnowledgeArticlePublicationEvidencePayload {
  p_article_id: Uuid;
  p_human_confirmations?: KnowledgeReviewHumanConfirmations | null;
  p_review_notes?: string | null;
}

export type RpcAdminPrepareKnowledgeArticlePublicationEvidenceResponse =
  AdminKnowledgeArticleReviewAdvisoryRecordRow;

export interface RpcAdminUpsertKnowledgeArticleAssetPayload {
  p_article_id: Uuid;
  p_knowledge_space_id: Uuid;
  p_source_url?: string | null;
  p_source_path: string;
  p_source_hash: string;
  p_storage_object_path: string;
  p_detected_mime_type: string;
  p_file_size_bytes: number;
  p_width?: number | null;
  p_height?: number | null;
  p_alt_text?: string | null;
  p_caption?: string | null;
  p_review_status?: KnowledgeArticleAssetReviewStatus;
  p_visibility?: KnowledgeVisibility;
  p_is_blocked?: boolean;
}

export type RpcAdminUpsertKnowledgeArticleAssetResponse =
  AdminKnowledgeArticleAssetRow;

export interface RpcAdminUpdateKnowledgeArticleAssetReviewPayload {
  p_asset_id: Uuid;
  p_review_status: KnowledgeArticleAssetReviewStatus;
  p_visibility?: KnowledgeVisibility;
  p_is_blocked?: boolean;
  p_alt_text?: string | null;
  p_caption?: string | null;
}

export type RpcAdminUpdateKnowledgeArticleAssetReviewResponse =
  AdminKnowledgeArticleAssetRow;
