import type { IsoTimestamp, JsonObject, JsonValue, Uuid } from './ticketing.js';

export const CUSTOMER_SOURCE_PRODUCTS = ['after_sale', 'genius'] as const;
export type CustomerSourceProduct = (typeof CUSTOMER_SOURCE_PRODUCTS)[number];
export const CUSTOMER_SOURCE_VERSIONS = ['v1', 'current'] as const;
export type CustomerSourceVersion = (typeof CUSTOMER_SOURCE_VERSIONS)[number];
export const CUSTOMER_SOURCE_STATUSES = ['identified', 'confirmed', 'inactive'] as const;
export type CustomerSourceStatus = (typeof CUSTOMER_SOURCE_STATUSES)[number];
export const CUSTOMER_STORE_STATUSES = ['identified', 'active', 'inactive', 'archived'] as const;
export type CustomerStoreStatus = (typeof CUSTOMER_STORE_STATUSES)[number];
export const CUSTOMER_INVENTORY_SNAPSHOT_STATUSES = ['received', 'sanitized', 'accepted', 'rejected', 'superseded'] as const;
export type CustomerInventorySnapshotStatus = (typeof CUSTOMER_INVENTORY_SNAPSHOT_STATUSES)[number];
export const CUSTOMER_FEATURE_CONTRACT_STATUSES = ['unknown', 'contracted', 'not_contracted'] as const;
export type CustomerFeatureContractStatus = (typeof CUSTOMER_FEATURE_CONTRACT_STATUSES)[number];
export const CUSTOMER_FEATURE_BOSS_STATUSES = ['unknown', 'enabled', 'disabled', 'not_applicable'] as const;
export type CustomerFeatureBossStatus = (typeof CUSTOMER_FEATURE_BOSS_STATUSES)[number];
export const CUSTOMER_FEATURE_OBSERVED_STATUSES = ['unknown', 'configured', 'found', 'not_found', 'unavailable', 'stale'] as const;
export type CustomerFeatureObservedStatus = (typeof CUSTOMER_FEATURE_OBSERVED_STATUSES)[number];
export const CUSTOMER_FEATURE_USAGE_STATUSES = ['unknown', 'confirmed', 'not_confirmed'] as const;
export type CustomerFeatureUsageStatus = (typeof CUSTOMER_FEATURE_USAGE_STATUSES)[number];
export const CUSTOMER_PROJECT_TYPES = ['migration', 'implementation', 'integration', 'expansion', 'other'] as const;
export type CustomerProjectType = (typeof CUSTOMER_PROJECT_TYPES)[number];
export const CUSTOMER_PROJECT_STATUSES = ['draft', 'inventory_pending', 'inventory_in_progress', 'inventory_ready', 'eligibility_pending', 'eligible', 'eligible_with_restrictions', 'standby', 'planned', 'awaiting_approval', 'ready_to_execute', 'running', 'validating', 'completed', 'blocked', 'cancelled'] as const;
export type CustomerProjectStatus = (typeof CUSTOMER_PROJECT_STATUSES)[number];
export const CUSTOMER_PROJECT_RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export type CustomerProjectRiskLevel = (typeof CUSTOMER_PROJECT_RISK_LEVELS)[number];
export const CUSTOMER_MIGRATION_ELIGIBILITY_STATUSES = ['pending', 'eligible', 'eligible_with_restrictions', 'ineligible', 'stale'] as const;
export type CustomerMigrationEligibilityStatus = (typeof CUSTOMER_MIGRATION_ELIGIBILITY_STATUSES)[number];
export const CUSTOMER_MIGRATION_APPROVAL_STATUSES = ['pending', 'approved', 'rejected', 'revoked'] as const;
export type CustomerMigrationApprovalStatus = (typeof CUSTOMER_MIGRATION_APPROVAL_STATUSES)[number];
export const CUSTOMER_MIGRATION_EXECUTION_STATUSES = ['not_requested', 'requested', 'running', 'completed', 'failed', 'cancelled'] as const;
export type CustomerMigrationExecutionStatus = (typeof CUSTOMER_MIGRATION_EXECUTION_STATUSES)[number];
export const CUSTOMER_MIGRATION_VALIDATION_STATUSES = ['validated', 'validated_with_reservation', 'divergent', 'not_validated', 'interrupted'] as const;
export type CustomerMigrationValidationStatus = (typeof CUSTOMER_MIGRATION_VALIDATION_STATUSES)[number];
export const CUSTOMER_PROJECT_COMMENT_KINDS = ['operational_comment', 'internal_note', 'migration_decision'] as const;
export type CustomerProjectCommentKind = (typeof CUSTOMER_PROJECT_COMMENT_KINDS)[number];
export const CUSTOMER_PROJECT_ACTIVITY_TYPES = ['status_change', 'assignment_change', 'deadline_change', 'dependency_change', 'eligibility_change', 'approval_change', 'execution_change', 'validation_change', 'system'] as const;
export type CustomerProjectActivityType = (typeof CUSTOMER_PROJECT_ACTIVITY_TYPES)[number];

export interface CustomerAccountSourceRecord {
  id: Uuid;
  tenant_id: Uuid;
  source_product: CustomerSourceProduct;
  source_version: CustomerSourceVersion;
  source_system: string;
  source_external_id: string | null;
  status: CustomerSourceStatus;
  target_product: 'after_sale';
  target_version: 'v2';
  confirmed_at: IsoTimestamp | null;
  notes: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_user_id: Uuid;
  updated_by_user_id: Uuid;
}

export interface CustomerAccountStoreRecord {
  id: Uuid;
  tenant_id: Uuid;
  source_id: Uuid;
  external_store_id: string;
  display_name: string;
  platform_name: string | null;
  status: CustomerStoreStatus;
  notes: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_user_id: Uuid;
  updated_by_user_id: Uuid;
}

export interface CustomerInventorySnapshotRecord {
  id: Uuid;
  tenant_id: Uuid;
  source_id: Uuid;
  store_id: Uuid;
  source_system: string;
  schema_version: string;
  catalog_version: string;
  extracted_at: IsoTimestamp;
  received_at: IsoTimestamp;
  fingerprint: string;
  package_manifest: JsonObject;
  status: CustomerInventorySnapshotStatus;
  sanitized: boolean;
  notes: string | null;
  created_at: IsoTimestamp;
  created_by_user_id: Uuid;
}

export interface CustomerInventoryFeatureObservationRecord {
  id: Uuid;
  snapshot_id: Uuid;
  tenant_id: Uuid;
  store_id: Uuid;
  source_product: CustomerSourceProduct;
  source_version: CustomerSourceVersion;
  domain: string;
  feature_key: string;
  feature_name: string;
  feature_description: string | null;
  contracted_status: CustomerFeatureContractStatus;
  boss_enabled_status: CustomerFeatureBossStatus;
  observed_status: CustomerFeatureObservedStatus;
  usage_status: CustomerFeatureUsageStatus;
  confidence: 'high' | 'medium' | 'low' | 'unverified';
  evidence_id: Uuid | null;
  observed_at: IsoTimestamp;
  catalog_version: string;
  fingerprint: string;
  notes: string | null;
}

export interface CustomerOperationEvidenceRecord {
  id: Uuid;
  tenant_id: Uuid;
  store_id: Uuid | null;
  source_id: Uuid | null;
  inventory_snapshot_id: Uuid | null;
  project_id: Uuid | null;
  evidence_type: string;
  storage_bucket: string;
  storage_path: string;
  fingerprint: string;
  sanitized_status: 'pending' | 'sanitized' | 'rejected';
  captured_at: IsoTimestamp;
  captured_by_user_id: Uuid | null;
  metadata: JsonObject;
  created_at: IsoTimestamp;
}

export interface CustomerProjectRecord {
  id: Uuid;
  tenant_id: Uuid;
  project_type: CustomerProjectType;
  name: string;
  description: string | null;
  source_id: Uuid | null;
  owner_user_id: Uuid | null;
  csm_user_id: Uuid | null;
  priority: number;
  deadline: string | null;
  status: CustomerProjectStatus;
  risk_level: CustomerProjectRiskLevel;
  next_action: string | null;
  dependencies: JsonValue[];
  standby_reason: string | null;
  blocked_reason: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_user_id: Uuid;
  updated_by_user_id: Uuid;
}

export interface CustomerMigrationProjectRecord {
  project_id: Uuid;
  source_product: CustomerSourceProduct;
  source_version: CustomerSourceVersion;
  target_product: 'after_sale';
  target_version: 'v2';
  source_adapter: string;
  inventory_snapshot_id: Uuid | null;
  eligibility_status: CustomerMigrationEligibilityStatus;
  approval_status: CustomerMigrationApprovalStatus;
  execution_status: CustomerMigrationExecutionStatus;
  batch_id: Uuid | null;
  wave_id: Uuid | null;
  standby_reason: string | null;
  blocked_reason: string | null;
}

export interface AdminCustomerOperationsDirectoryRow {
  tenant_id: Uuid;
  slug: string;
  legal_name: string;
  display_name: string;
  status: string;
  organization_id: Uuid | null;
  group_id: Uuid | null;
  group_display_name: string | null;
  group_type: string | null;
  source_count: number;
  confirmed_source_count: number;
  store_count: number;
  active_store_count: number;
  project_count: number;
  active_project_count: number;
  csm_user_id: Uuid | null;
  csm_portfolio_name: string | null;
  csm_assignment_status: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
}

export interface AdminCustomerInventoryObservationRow extends CustomerInventoryFeatureObservationRecord {
  store_display_name: string;
  snapshot_fingerprint: string;
  snapshot_status: CustomerInventorySnapshotStatus;
}

export interface AdminCustomerMigrationKanbanRow {
  project_id: Uuid;
  tenant_id: Uuid;
  tenant_display_name: string;
  name: string;
  description: string | null;
  project_type: 'migration';
  status: CustomerProjectStatus;
  risk_level: CustomerProjectRiskLevel;
  priority: number;
  deadline: string | null;
  next_action: string | null;
  standby_reason: string | null;
  blocked_reason: string | null;
  source_product: CustomerSourceProduct;
  source_version: CustomerSourceVersion;
  target_product: 'after_sale';
  target_version: 'v2';
  source_adapter: string;
  eligibility_status: CustomerMigrationEligibilityStatus;
  approval_status: CustomerMigrationApprovalStatus;
  execution_status: CustomerMigrationExecutionStatus;
  store_count: number;
  latest_eligibility_result: CustomerMigrationEligibilityStatus | null;
  pending_items: JsonValue[] | null;
  limitations: JsonValue[] | null;
  latest_catalog_version: string | null;
  latest_eligibility_at: IsoTimestamp | null;
  owner_user_id: Uuid | null;
  owner_full_name: string | null;
  csm_user_id: Uuid | null;
  csm_full_name: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
}

export interface RpcAdminUpsertCustomerSourcePayload {
  p_tenant_id: Uuid;
  p_source_product: CustomerSourceProduct;
  p_source_version: CustomerSourceVersion;
  p_source_system: string;
  p_source_external_id?: string | null;
  p_status?: CustomerSourceStatus;
  p_notes?: string | null;
}
export type RpcAdminUpsertCustomerSourceResponse = CustomerAccountSourceRecord;

export interface RpcAdminUpsertCustomerStorePayload {
  p_tenant_id: Uuid;
  p_source_id: Uuid;
  p_external_store_id: string;
  p_display_name: string;
  p_platform_name?: string | null;
  p_status?: CustomerStoreStatus;
  p_notes?: string | null;
}
export type RpcAdminUpsertCustomerStoreResponse = CustomerAccountStoreRecord;

export interface CustomerInventoryObservationInput {
  feature_key: string;
  feature_name: string;
  domain: string;
  feature_description?: string | null;
  contracted_status?: CustomerFeatureContractStatus;
  boss_enabled_status?: CustomerFeatureBossStatus;
  observed_status?: CustomerFeatureObservedStatus;
  usage_status?: CustomerFeatureUsageStatus;
  confidence?: 'high' | 'medium' | 'low' | 'unverified';
  evidence_id?: Uuid | null;
  observed_at?: IsoTimestamp;
  notes?: string | null;
}

export interface RpcAdminImportCustomerInventorySnapshotPayload {
  p_tenant_id: Uuid;
  p_source_id: Uuid;
  p_store_id: Uuid;
  p_source_system: string;
  p_schema_version: string;
  p_catalog_version: string;
  p_extracted_at: IsoTimestamp;
  p_fingerprint: string;
  p_package_manifest: JsonObject;
  p_observations: CustomerInventoryObservationInput[];
  p_sanitized?: boolean;
}
export type RpcAdminImportCustomerInventorySnapshotResponse = Uuid;

export interface RpcAdminCreateCustomerMigrationProjectPayload {
  p_tenant_id: Uuid;
  p_name: string;
  p_source_id: Uuid;
  p_source_adapter: string;
  p_description?: string | null;
  p_owner_user_id?: Uuid | null;
  p_csm_user_id?: Uuid | null;
  p_priority?: number;
  p_deadline?: string | null;
  p_risk_level?: CustomerProjectRiskLevel;
}
export type RpcAdminCreateCustomerMigrationProjectResponse = Uuid;

export interface RpcAdminLinkMigrationProjectStorePayload { p_project_id: Uuid; p_store_id: Uuid; }
export interface RpcAdminEvaluateCustomerMigrationPayload {
  p_project_id: Uuid;
  p_result: CustomerMigrationEligibilityStatus;
  p_criteria: JsonObject;
  p_pending_items: JsonValue[];
  p_limitations: JsonValue[];
  p_catalog_version: string;
  p_inventory_snapshot_id?: Uuid | null;
}
export interface RpcAdminTransitionCustomerProjectPayload { p_project_id: Uuid; p_status: CustomerProjectStatus; p_reason?: string | null; p_next_action?: string | null; }
export interface RpcAdminApproveCustomerMigrationPayload {
  p_project_id: Uuid;
  p_status: CustomerMigrationApprovalStatus;
  p_inventory_snapshot_id: Uuid;
  p_stores_confirmed: boolean;
  p_origin_confirmed: boolean;
  p_critical_blocker_present: boolean;
  p_decision_note: string;
}
export interface RpcAdminRequestCustomerMigrationExecutionPayload {
  p_project_id: Uuid;
  p_request_fingerprint: string;
  p_batch_id?: Uuid | null;
  p_wave_id?: Uuid | null;
  p_approved_item_ids?: JsonValue[];
  p_decisions?: JsonValue[];
}
export interface RpcAdminRecordCustomerMigrationValidationPayload {
  p_execution_request_id: Uuid;
  p_store_id: Uuid;
  p_status: CustomerMigrationValidationStatus;
  p_source_observed: JsonObject;
  p_target_applied: JsonObject;
  p_divergence?: string | null;
  p_next_action?: string | null;
  p_post_save_evidence_id?: Uuid | null;
}
