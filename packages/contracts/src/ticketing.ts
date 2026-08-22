export type Uuid = string;
export type IsoTimestamp = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export const TICKET_STATUSES = [
  'new',
  'triage',
  'waiting_customer',
  'waiting_support',
  'waiting_engineering',
  'in_progress',
  'resolved',
  'closed',
  'cancelled',
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type TicketSeverity = (typeof TICKET_SEVERITIES)[number];

export const TICKET_SOURCES = [
  'portal',
  'email',
  'chat',
  'phone',
  'api',
  'internal',
] as const;
export type TicketSource = (typeof TICKET_SOURCES)[number];

export const TICKET_MESSAGE_VISIBILITIES = ['internal', 'customer'] as const;
export type TicketMessageVisibility = (typeof TICKET_MESSAGE_VISIBILITIES)[number];

export const TICKET_EVENT_TYPES = [
  'ticket_created',
  'status_changed',
  'priority_changed',
  'assigned',
  'unassigned',
  'message_added',
  'internal_note_added',
  'attachment_added',
  'classification_changed',
  'escalated_to_engineering',
  'linked_to_work_item',
  'engineering_update_added',
  'engineering_status_updated',
  'engineering_returned_to_support',
  'internal_action_created',
  'internal_action_assigned',
  'internal_action_status_updated',
  'internal_action_comment_added',
  'internal_action_evidence_linked',
  'internal_action_returned_to_support',
  'internal_action_follow_up_requested',
  'internal_action_return_accepted',
  'internal_action_closed',
  'internal_action_cancelled',
  'sla_updated',
  'resolved',
  'closed',
  'reopened',
  'cancelled',
] as const;
export type TicketEventType = (typeof TICKET_EVENT_TYPES)[number];
export type TicketAttachmentStatus = 'available' | 'archived';
export type TicketReferenceStatus = 'active' | 'inactive' | 'archived';
export type TicketOperationalReasonType =
  | 'classification_update'
  | 'status_transition'
  | 'priority_change'
  | 'resolution'
  | 'cancellation'
  | 'reopen';
export type TicketSlaStatus =
  | 'unavailable'
  | 'on_track'
  | 'at_risk'
  | 'breached'
  | 'complete';

export type TicketSlaPolicyScope = 'none' | 'global_fallback' | 'tenant';

export type TicketOriginKey =
  | 'suporte_manual'
  | 'customer_portal'
  | 'email_future'
  | 'whatsapp_future'
  | 'chat_future'
  | 'api_future'
  | 'import_future'
  | 'system_future'
  | 'unknown';

export type TicketChannelKey =
  | 'internal_support'
  | 'customer_portal'
  | 'public_help'
  | 'email'
  | 'whatsapp'
  | 'chat'
  | 'api'
  | 'unknown';

export type TicketCommunicationDirection =
  | 'inbound'
  | 'outbound'
  | 'internal'
  | 'system';

export type TicketReplyMode =
  | 'customer_portal_public_reply'
  | 'support_public_message'
  | 'unavailable';

export type TicketDeliveryChannel =
  | 'customer_portal'
  | 'email_future'
  | 'whatsapp_future'
  | 'chat_future'
  | 'api_future';

export type TicketDeliveryStatus =
  | 'not_required'
  | 'pending'
  | 'delivered'
  | 'blocked'
  | 'failed'
  | 'cancelled';

export type TicketDeliveryDirection =
  | 'inbound'
  | 'outbound'
  | 'internal'
  | 'system';

export type TicketDeliveryProviderState =
  | 'native'
  | 'not_configured'
  | 'disabled'
  | 'future';

export type CommunicationChannelReadinessStatus =
  | 'active'
  | 'disabled'
  | 'not_configured'
  | 'future'
  | 'blocked'
  | 'unavailable';

export type AiSourceType =
  | 'support_ticket'
  | 'ticket_timeline'
  | 'customer_account'
  | 'knowledge_article_public'
  | 'knowledge_article_internal'
  | 'knowledge_article_restricted'
  | 'customer_portal_ticket'
  | 'engineering_work_item'
  | 'internal_action'
  | 'documentation'
  | 'audit_summary';

export type AiSourceStatus = 'allowed' | 'restricted' | 'forbidden' | 'future';

export type AiSourceVisibility =
  | 'support_only'
  | 'admin_only'
  | 'engineering_only'
  | 'customer_facing'
  | 'public'
  | 'system_only';

export type AiIntendedUse =
  | 'summarize'
  | 'suggest_reply'
  | 'suggest_article'
  | 'detect_gap'
  | 'classify_suggestion'
  | 'risk_warning'
  | 'explain_context'
  | 'draft_internal_note'
  | 'draft_article';

export type AiActionKey =
  | 'summarize_ticket'
  | 'suggest_reply'
  | 'suggest_article'
  | 'suggest_category'
  | 'suggest_priority'
  | 'detect_documentation_gap'
  | 'summarize_customer'
  | 'risk_warning'
  | 'draft_internal_note'
  | 'draft_article'
  | 'auto_send'
  | 'auto_publish'
  | 'auto_close_ticket'
  | 'auto_change_status'
  | 'auto_create_provider_delivery'
  | 'auto_expose_internal'
  | 'auto_modify_entitlement'
  | 'auto_modify_rls'
  | 'auto_create_internal_action'
  | 'auto_create_engineering_work_item'
  | 'read_storage_path'
  | 'read_secret';

export type AiPolicyDecision = 'allowed' | 'denied' | 'requires_review' | 'future';

export type AiReviewDecision = 'pending' | 'approved' | 'rejected' | 'discarded';

export interface AiContextSourcePolicy {
  policyKey: string;
  sourceType: AiSourceType;
  sourceStatus: AiSourceStatus;
  visibility: AiSourceVisibility;
  allowedUses: AiIntendedUse[];
  requiresTenant: boolean;
  requiresEntitlement: boolean;
  requiresCitation: boolean;
  requiresRedaction: boolean;
  allowedDestinations: string[];
  forbiddenDestinations: string[];
  policySummary: string;
  updatedAt: IsoTimestamp;
}

export interface AiActionPolicy {
  actionKey: AiActionKey;
  decision: AiPolicyDecision;
  requiresHumanReview: boolean;
  allowedSourceTypes: AiSourceType[];
  allowedDestinations: string[];
  forbiddenReason: string | null;
  auditRequired: boolean;
  policySummary: string;
  updatedAt: IsoTimestamp;
}

export interface AiOperationalContextReadiness {
  readinessKey: string;
  readinessStatus: 'prepared_not_active';
  readinessLabel: string;
  allowedSourceCount: number;
  restrictedSourceCount: number;
  futureSourceCount: number;
  citationRequiredCount: number;
  redactionRequiredCount: number;
  humanReviewRequired: boolean;
  auditRequired: boolean;
  llmProviderConfigured: boolean;
  embeddingsEnabled: boolean;
  autoSendEnabled: boolean;
  autoPublishEnabled: boolean;
}

export interface AiContextAccessDecision {
  allowed: boolean;
  decision: AiPolicyDecision;
  requiresHumanReview: boolean;
  reason: string;
  policyKey: string | null;
}

export interface AiUsageAuditEvent {
  id: Uuid;
  tenantId: Uuid | null;
  tenantSlug: string | null;
  tenantDisplayName: string | null;
  actorUserId: Uuid;
  actorFullName: string | null;
  actorEmail: string | null;
  sourceType: AiSourceType;
  intendedUse: AiIntendedUse;
  policyKey: string | null;
  sourceIds: JsonValue[];
  outputType: string;
  allowedDestination: string;
  requiresHumanReview: boolean;
  reviewDecision: AiReviewDecision;
  reviewedByUserId: Uuid | null;
  reviewedByFullName: string | null;
  reviewedByEmail: string | null;
  reviewedAt: IsoTimestamp | null;
  reviewNote: string | null;
  metadata: JsonObject;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  providerConfigured: boolean;
  promptStored: boolean;
  outputStored: boolean;
}

export interface RpcAiValidateContextAccessPayload {
  p_source_type: AiSourceType;
  p_tenant_id?: Uuid | null;
  p_source_id?: Uuid | null;
  p_intended_use?: AiIntendedUse | null;
  p_destination?: string | null;
}

export type RpcAiValidateContextAccessResponse = AiContextAccessDecision;

export interface RpcAiLogUsageEventPayload {
  p_tenant_id: Uuid;
  p_source_type: AiSourceType;
  p_intended_use: AiIntendedUse;
  p_source_ids?: JsonValue[];
  p_output_type?: string;
  p_allowed_destination?: string;
  p_metadata?: JsonObject;
}

export interface RpcAiLogUsageEventResponse {
  id: Uuid;
}

export interface RpcAiRegisterHumanReviewDecisionPayload {
  p_usage_event_id: Uuid;
  p_review_decision: Exclude<AiReviewDecision, 'pending'>;
  p_review_note?: string | null;
}

export interface RpcAiRegisterHumanReviewDecisionResponse {
  id: Uuid;
}

export interface CommunicationChannelReadiness {
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  tenantStatus: string;
  channelKey: TicketDeliveryChannel;
  channelLabel: string;
  directionSupported: string;
  isExternal: boolean;
  isRealChannel: boolean;
  providerRequired: boolean;
  statusGlobal: CommunicationChannelReadinessStatus;
  futureProviderType: string | null;
  description: string;
  readinessStatus: CommunicationChannelReadinessStatus;
  isEnabled: boolean;
  canSend: boolean;
  canReceive: boolean;
  reasonIfUnavailable: string | null;
  requiredSetupSummary: string | null;
  operationalNote: string | null;
  lastCheckedAt: IsoTimestamp | null;
  managedByUserId: Uuid | null;
  managedByFullName: string | null;
  managedByEmail: string | null;
  updatedAt: IsoTimestamp | null;
  canMarkActive: boolean;
  activationBlockedByContract: boolean;
}

export interface TicketCommunicationCapability {
  originKey: TicketOriginKey;
  originLabel: string;
  channelKey: TicketChannelKey;
  channelLabel: string;
  canReplyNow: boolean;
  replyMode: TicketReplyMode;
  reasonIfUnavailable: string | null;
}

export const TICKET_TIMELINE_ENTRY_TYPES = ['message', 'event'] as const;
export type TicketTimelineEntryType = (typeof TICKET_TIMELINE_ENTRY_TYPES)[number];

export const TICKET_KNOWLEDGE_LINK_TYPES = [
  'reference_internal',
  'sent_to_customer',
  'suggested_article',
  'documentation_gap',
  'needs_update',
] as const;
export type TicketKnowledgeLinkType = (typeof TICKET_KNOWLEDGE_LINK_TYPES)[number];

export const ENGINEERING_WORK_ITEM_TYPES = [
  'bug',
  'improvement',
  'technical_task',
  'investigation',
] as const;
export type EngineeringWorkItemType = (typeof ENGINEERING_WORK_ITEM_TYPES)[number];

export const ENGINEERING_WORK_ITEM_STATUSES = [
  'triage',
  'accepted',
  'rejected',
  'in_progress',
  'waiting_external',
  'returned_to_support',
  'released',
  'cancelled',
] as const;
export type EngineeringWorkItemStatus =
  (typeof ENGINEERING_WORK_ITEM_STATUSES)[number];

export const ENGINEERING_WORK_ITEM_UPDATE_KINDS = [
  'progress_update',
  'status_update',
  'support_return',
] as const;
export type EngineeringWorkItemUpdateKind =
  (typeof ENGINEERING_WORK_ITEM_UPDATE_KINDS)[number];

export const INTERNAL_AREA_MEMBERSHIP_ROLES = [
  'member',
  'manager',
  'viewer',
] as const;
export type InternalAreaMembershipRole =
  (typeof INTERNAL_AREA_MEMBERSHIP_ROLES)[number];

export const INTERNAL_AREA_MEMBERSHIP_STATUSES = [
  'active',
  'inactive',
  'archived',
] as const;
export type InternalAreaMembershipStatus =
  (typeof INTERNAL_AREA_MEMBERSHIP_STATUSES)[number];

export const INTERNAL_PERMISSION_MODES = ['custom', 'profile'] as const;
export type InternalPermissionMode = (typeof INTERNAL_PERMISSION_MODES)[number];

export type InternalActionAreaKey = string;

export const INTERNAL_ACTION_STATUSES = [
  'open',
  'assigned',
  'in_progress',
  'waiting_support',
  'waiting_external',
  'returned_to_support',
  'follow_up_requested',
  'closed',
  'cancelled',
] as const;
export type InternalActionStatus = (typeof INTERNAL_ACTION_STATUSES)[number];

export const INTERNAL_ACTION_SUPPORT_TYPES = [
  'analysis',
  'execution',
  'approval',
  'information_request',
  'external_follow_up',
  'technical_investigation',
] as const;
export type InternalActionSupportType =
  (typeof INTERNAL_ACTION_SUPPORT_TYPES)[number];

export const INTERNAL_ACTION_UPDATE_KINDS = [
  'comment',
  'assignment_changed',
  'status_changed',
  'evidence_linked',
  'returned_to_support',
  'support_acceptance',
  'follow_up_requested',
  'closed',
  'cancelled',
] as const;
export type InternalActionUpdateKind =
  (typeof INTERNAL_ACTION_UPDATE_KINDS)[number];

export type TicketStatusUpdateTarget = Exclude<TicketStatus, 'closed'>;

export type KnowledgeArticleVisibility = 'public' | 'internal' | 'restricted';
export type KnowledgeArticleStatus = 'draft' | 'review' | 'published' | 'archived';

export interface TicketRecord {
  id: Uuid;
  tenantId: Uuid;
  requesterContactId: Uuid | null;
  title: string;
  description: string;
  source: TicketSource;
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity;
  categoryId: Uuid | null;
  initialOperationalReasonId: Uuid | null;
  currentOperationalReasonId: Uuid | null;
  slaPolicyId: Uuid | null;
  firstResponseDueAt: IsoTimestamp | null;
  resolutionDueAt: IsoTimestamp | null;
  closeReason: string | null;
  createdByUserId: Uuid;
  assignedToUserId: Uuid | null;
  resolvedAt: IsoTimestamp | null;
  closedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  updatedByUserId: Uuid | null;
}

export interface TicketMessageRecord {
  id: Uuid;
  tenantId: Uuid;
  ticketId: Uuid;
  visibility: TicketMessageVisibility;
  body: string;
  createdByUserId: Uuid;
  metadata: JsonObject;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface TicketViewPermissionFlags {
  canViewInternal: boolean;
  canAddMessage: boolean;
  canUpdateStatus: boolean;
  canAddInternalNote: boolean;
  canAssign: boolean;
  canClose: boolean;
  canReopen: boolean;
}

export interface TicketListItem extends TicketViewPermissionFlags {
  id: Uuid;
  tenantId: Uuid;
  requesterContactId: Uuid | null;
  title: string;
  source: TicketSource;
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity;
  categoryId: Uuid | null;
  categorySlug: string | null;
  categoryName: string | null;
  categoryDescription: string | null;
  currentOperationalReasonId: Uuid | null;
  currentOperationalReasonName: string | null;
  slaPolicyId: Uuid | null;
  slaPolicyName: string | null;
  slaPolicyScope: TicketSlaPolicyScope;
  slaBusinessCalendarName: string | null;
  slaBusinessCalendarTimezone: string | null;
  firstResponseDueAt: IsoTimestamp | null;
  resolutionDueAt: IsoTimestamp | null;
  slaStatus: TicketSlaStatus;
  slaStatusLabel: string;
  isSlaAvailable: boolean;
  slaReference: string;
  createdByUserId: Uuid;
  createdByFullName: string | null;
  assignedToUserId: Uuid | null;
  assignedToFullName: string | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  resolvedAt: IsoTimestamp | null;
  closedAt: IsoTimestamp | null;
  lastMessageAt: IsoTimestamp | null;
  customerMessageCount: number;
  internalMessageCount: number;
}

export interface TicketDetail extends TicketViewPermissionFlags {
  id: Uuid;
  tenantId: Uuid;
  requesterContactId: Uuid | null;
  requesterContactFullName: string | null;
  requesterContactEmail: string | null;
  title: string;
  description: string;
  source: TicketSource;
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity;
  categoryId: Uuid | null;
  categorySlug: string | null;
  categoryName: string | null;
  categoryDescription: string | null;
  initialOperationalReasonId: Uuid | null;
  initialOperationalReasonName: string | null;
  currentOperationalReasonId: Uuid | null;
  currentOperationalReasonName: string | null;
  slaPolicyId: Uuid | null;
  slaPolicyName: string | null;
  slaPolicyScope: TicketSlaPolicyScope;
  slaBusinessCalendarKey: string | null;
  slaBusinessCalendarName: string | null;
  slaBusinessCalendarTimezone: string | null;
  firstResponseDueAt: IsoTimestamp | null;
  resolutionDueAt: IsoTimestamp | null;
  slaStatus: TicketSlaStatus;
  slaStatusLabel: string;
  isSlaAvailable: boolean;
  slaReference: string;
  allowedNextStatuses: TicketStatus[];
  closeReason: string | null;
  createdByUserId: Uuid;
  createdByFullName: string | null;
  assignedToUserId: Uuid | null;
  assignedToFullName: string | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  resolvedAt: IsoTimestamp | null;
  closedAt: IsoTimestamp | null;
  lastMessageAt: IsoTimestamp | null;
  customerMessageCount: number;
  internalMessageCount: number;
  customerAttachmentCount: number;
  internalAttachmentCount: number;
}

export interface TicketTimelineMessageItem {
  ticketId: Uuid;
  tenantId: Uuid;
  timelineEntryId: Uuid;
  entryType: 'message';
  visibility: TicketMessageVisibility;
  occurredAt: IsoTimestamp;
  actorUserId: Uuid | null;
  messageId: Uuid;
  eventId: null;
  eventType: null;
  assignmentId: null;
  body: string;
  metadata: JsonObject;
}

export interface TicketTimelineEventItem {
  ticketId: Uuid;
  tenantId: Uuid;
  timelineEntryId: Uuid;
  entryType: 'event';
  visibility: TicketMessageVisibility;
  occurredAt: IsoTimestamp;
  actorUserId: Uuid | null;
  messageId: Uuid | null;
  eventId: Uuid;
  eventType: TicketEventType;
  assignmentId: Uuid | null;
  body: null;
  metadata: JsonObject;
}

export type TicketTimelineItem = TicketTimelineMessageItem | TicketTimelineEventItem;

export interface SupportTicketQueueItem extends TicketViewPermissionFlags {
  id: Uuid;
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string | null;
  tenantLegalName: string | null;
  requesterContactId: Uuid | null;
  requesterContactFullName: string | null;
  requesterContactEmail: string | null;
  title: string;
  source: TicketSource;
  originKey: TicketOriginKey;
  originLabel: string;
  channelKey: TicketChannelKey;
  channelLabel: string;
  canReplyNow: boolean;
  replyMode: TicketReplyMode;
  reasonIfUnavailable: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity;
  categoryId: Uuid | null;
  categorySlug: string | null;
  categoryName: string | null;
  categoryDescription: string | null;
  currentOperationalReasonId: Uuid | null;
  currentOperationalReasonName: string | null;
  slaPolicyId: Uuid | null;
  slaPolicyName: string | null;
  slaPolicyScope: TicketSlaPolicyScope;
  slaBusinessCalendarName: string | null;
  slaBusinessCalendarTimezone: string | null;
  firstResponseDueAt: IsoTimestamp | null;
  resolutionDueAt: IsoTimestamp | null;
  slaStatus: TicketSlaStatus;
  slaStatusLabel: string;
  isSlaAvailable: boolean;
  slaReference: string;
  createdByUserId: Uuid;
  createdByFullName: string | null;
  assignedToUserId: Uuid | null;
  assignedToFullName: string | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  resolvedAt: IsoTimestamp | null;
  closedAt: IsoTimestamp | null;
  lastMessageAt: IsoTimestamp | null;
  customerMessageCount: number;
  internalMessageCount: number;
  isUnassigned: boolean;
  isWaitingCustomer: boolean;
  isWaitingSupport: boolean;
  isWaitingEngineering: boolean;
}

export interface SupportTicketQueuePage {
  items: SupportTicketQueueItem[];
  totalCount: number;
  scopeCounts: {
    open: number;
    closed: number;
  };
  filterCounts: Record<string, number>;
}

export interface SupportTicketDetail extends TicketViewPermissionFlags {
  id: Uuid;
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string | null;
  tenantLegalName: string | null;
  tenantStatus: string;
  requesterContactId: Uuid | null;
  requesterContactFullName: string | null;
  requesterContactEmail: string | null;
  title: string;
  description: string;
  source: TicketSource;
  originKey: TicketOriginKey;
  originLabel: string;
  channelKey: TicketChannelKey;
  channelLabel: string;
  canReplyNow: boolean;
  replyMode: TicketReplyMode;
  reasonIfUnavailable: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity;
  categoryId: Uuid | null;
  categorySlug: string | null;
  categoryName: string | null;
  categoryDescription: string | null;
  initialOperationalReasonId: Uuid | null;
  initialOperationalReasonName: string | null;
  currentOperationalReasonId: Uuid | null;
  currentOperationalReasonName: string | null;
  slaPolicyId: Uuid | null;
  slaPolicyName: string | null;
  slaPolicyScope: TicketSlaPolicyScope;
  slaBusinessCalendarKey: string | null;
  slaBusinessCalendarName: string | null;
  slaBusinessCalendarTimezone: string | null;
  firstResponseDueAt: IsoTimestamp | null;
  resolutionDueAt: IsoTimestamp | null;
  slaStatus: TicketSlaStatus;
  slaStatusLabel: string;
  isSlaAvailable: boolean;
  slaReference: string;
  allowedNextStatuses: TicketStatus[];
  closeReason: string | null;
  createdByUserId: Uuid;
  createdByFullName: string | null;
  assignedToUserId: Uuid | null;
  assignedToFullName: string | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  resolvedAt: IsoTimestamp | null;
  closedAt: IsoTimestamp | null;
  lastMessageAt: IsoTimestamp | null;
  customerMessageCount: number;
  internalMessageCount: number;
  customerAttachmentCount: number;
  internalAttachmentCount: number;
}

export interface SupportTicketTimelineMessageItem {
  ticketId: Uuid;
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string | null;
  timelineEntryId: Uuid;
  entryType: 'message';
  visibility: TicketMessageVisibility;
  occurredAt: IsoTimestamp;
  actorUserId: Uuid | null;
  actorFullName: string | null;
  actorEmail: string | null;
  messageId: Uuid;
  eventId: null;
  eventType: null;
  assignmentId: null;
  body: string;
  metadata: JsonObject;
  communicationDirection: TicketCommunicationDirection;
  communicationChannel: TicketChannelKey;
  communicationChannelLabel: string;
  isCustomerVisible: boolean;
  deliveryChannel: TicketDeliveryChannel | null;
  deliveryStatus: TicketDeliveryStatus | null;
  deliveryProviderState: TicketDeliveryProviderState | null;
  deliveryStatusLabel: string | null;
  deliveryReasonIfBlocked: string | null;
  deliveryDeliveredAt: IsoTimestamp | null;
  deliveryFailedAt: IsoTimestamp | null;
}

export interface SupportTicketTimelineEventItem {
  ticketId: Uuid;
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string | null;
  timelineEntryId: Uuid;
  entryType: 'event';
  visibility: TicketMessageVisibility;
  occurredAt: IsoTimestamp;
  actorUserId: Uuid | null;
  actorFullName: string | null;
  actorEmail: string | null;
  messageId: Uuid | null;
  eventId: Uuid;
  eventType: TicketEventType;
  assignmentId: Uuid | null;
  body: null;
  metadata: JsonObject;
  communicationDirection: TicketCommunicationDirection;
  communicationChannel: TicketChannelKey;
  communicationChannelLabel: string;
  isCustomerVisible: boolean;
  deliveryChannel: TicketDeliveryChannel | null;
  deliveryStatus: TicketDeliveryStatus | null;
  deliveryProviderState: TicketDeliveryProviderState | null;
  deliveryStatusLabel: string | null;
  deliveryReasonIfBlocked: string | null;
  deliveryDeliveredAt: IsoTimestamp | null;
  deliveryFailedAt: IsoTimestamp | null;
}

export type SupportTicketTimelineItem =
  | SupportTicketTimelineMessageItem
  | SupportTicketTimelineEventItem;

export interface SupportCustomer360Contact {
  id: Uuid;
  fullName: string;
  email: string;
  isPrimary: boolean;
  linkedUserId: Uuid | null;
  createdAt: IsoTimestamp;
}

export interface SupportCustomer360RecentTicket {
  id: Uuid;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity;
  assignedToUserId: Uuid | null;
  assignedToFullName: string | null;
  updatedAt: IsoTimestamp;
}

export interface SupportCustomer360RecentEvent {
  ticketId: Uuid;
  ticketTitle: string;
  eventType: TicketEventType;
  visibility: TicketMessageVisibility;
  occurredAt: IsoTimestamp;
  actorUserId: Uuid | null;
}

export interface SupportCustomer360 {
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string | null;
  tenantLegalName: string | null;
  tenantStatus: string;
  tenantCreatedAt: IsoTimestamp;
  tenantUpdatedAt: IsoTimestamp;
  activeContactsCount: number;
  totalTicketCount: number;
  openTicketCount: number;
  ticketStatusCounts: JsonObject;
  activeContacts: SupportCustomer360Contact[];
  recentTickets: SupportCustomer360RecentTicket[];
  recentEvents: SupportCustomer360RecentEvent[];
}

export interface SupportRecentWindowMeta {
  totalAvailableCount: number;
  recentLimit: number;
  hasMore: boolean;
}

export interface SupportTicketTimelineRecentWindow extends SupportRecentWindowMeta {
  entries: SupportTicketTimelineItem[];
}

export interface SupportCustomerRecentTicketsWindow extends SupportRecentWindowMeta {
  tickets: SupportCustomer360RecentTicket[];
}

export interface SupportCustomerRecentEventsWindow extends SupportRecentWindowMeta {
  events: SupportCustomer360RecentEvent[];
}

export interface SupportAssignableAgent {
  userId: Uuid;
  fullName: string;
  email: string;
  tenantId: Uuid;
  tenantName: string;
  role: 'platform_admin' | 'support_agent' | 'support_manager';
  membershipStatus: 'active';
  isActive: boolean;
}

export interface SupportTicketIntakeTenant {
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string | null;
  tenantLegalName: string | null;
  tenantStatus: string;
  tenantCreatedAt: IsoTimestamp;
  tenantUpdatedAt: IsoTimestamp;
  activeContactsCount: number;
  hasActiveContacts: boolean;
}

export interface SupportTicketIntakeContact {
  id: Uuid;
  tenantId: Uuid;
  linkedUserId: Uuid | null;
  fullName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  isPrimary: boolean;
  createdAt: IsoTimestamp;
}

export interface SupportTicketClassificationOption {
  optionKind: 'category' | 'operational_reason';
  optionId: Uuid;
  slug: string;
  name: string;
  description: string | null;
  reasonType: TicketOperationalReasonType | null;
  appliesToStatus: TicketStatus | null;
  status: TicketReferenceStatus;
  sortOrder: number;
}

export type CustomerProductLine =
  | 'genius_returns'
  | 'after_sale'
  | 'hybrid'
  | 'other';

export type CustomerOperationalStatus =
  | 'onboarding'
  | 'active'
  | 'limited'
  | 'suspended'
  | 'legacy';

export type CustomerIntegrationType =
  | 'ecommerce_platform'
  | 'erp'
  | 'oms'
  | 'logistics_provider'
  | 'carrier'
  | 'gateway'
  | 'refund_provider'
  | 'custom_api'
  | 'other';

export type CustomerIntegrationStatus =
  | 'planned'
  | 'active'
  | 'degraded'
  | 'disabled'
  | 'deprecated';

export type CustomerIntegrationEnvironment =
  | 'production'
  | 'sandbox'
  | 'staging'
  | 'other';

export type CustomerCustomizationRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type CustomerAlertSeverity = 'info' | 'warning' | 'high' | 'critical';

export interface SupportCustomerAccountIntegration {
  id: Uuid;
  integrationType: CustomerIntegrationType;
  provider: string;
  status: CustomerIntegrationStatus;
  environment: CustomerIntegrationEnvironment;
  notes: string | null;
}

export interface SupportCustomerAccountFeature {
  featureKey: string;
  enabled: boolean;
  source: string;
  notes: string | null;
}

export interface SupportCustomerAccountCustomization {
  id: Uuid;
  title: string;
  description: string;
  riskLevel: CustomerCustomizationRiskLevel;
  operationalNote: string | null;
  status: string;
}

export interface SupportCustomerAccountAlert {
  id: Uuid;
  severity: CustomerAlertSeverity;
  title: string;
  description: string;
  expiresAt: IsoTimestamp | null;
}

export interface SupportCustomerAccountContext {
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string | null;
  tenantLegalName: string | null;
  tenantStatus: string;
  profileId: Uuid | null;
  productLine: CustomerProductLine | null;
  operationalStatus: CustomerOperationalStatus | null;
  accountTier: string | null;
  internalNotes: string | null;
  operationalFlags: JsonObject;
  activeContactsCount: number;
  totalTicketCount: number;
  openTicketCount: number;
  ticketStatusCounts: JsonObject;
  activeContacts: SupportCustomer360Contact[];
  integrations: SupportCustomerAccountIntegration[];
  enabledFeatures: SupportCustomerAccountFeature[];
  activeCustomizations: SupportCustomerAccountCustomization[];
  activeAlerts: SupportCustomerAccountAlert[];
}

export interface AdminCustomerAccountProfileDetail {
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  tenantLegalName: string;
  tenantStatus: string;
  profileId: Uuid | null;
  productLine: CustomerProductLine | null;
  operationalStatus: CustomerOperationalStatus | null;
  accountTier: string | null;
  internalNotes: string | null;
  operationalFlags: JsonObject;
  createdAt: IsoTimestamp | null;
  updatedAt: IsoTimestamp | null;
  createdByUserId: Uuid | null;
  createdByFullName: string | null;
  updatedByUserId: Uuid | null;
  updatedByFullName: string | null;
  canUpdateProfile: boolean;
}

export interface AdminCustomerAccountIntegration extends SupportCustomerAccountIntegration {
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  createdByUserId: Uuid;
  updatedByUserId: Uuid;
  canUpdate: boolean;
  canArchive: boolean;
}

export interface AdminCustomerAccountFeature extends SupportCustomerAccountFeature {
  id: Uuid;
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  createdByUserId: Uuid;
  updatedByUserId: Uuid;
  canUpdate: boolean;
}

export interface AdminCustomerAccountCustomization
  extends SupportCustomerAccountCustomization {
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  createdByUserId: Uuid;
  updatedByUserId: Uuid;
  canUpdate: boolean;
  canArchive: boolean;
}

export interface AdminCustomerAccountAlert extends SupportCustomerAccountAlert {
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  active: boolean;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  createdByUserId: Uuid;
  updatedByUserId: Uuid;
  canUpdate: boolean;
  canArchive: boolean;
}

export const CUSTOMER_GROUP_TYPES = [
  'economic_group',
  'service_umbrella',
] as const;
export type CustomerGroupType = (typeof CUSTOMER_GROUP_TYPES)[number];
export type CustomerGroupTypeRecord = CustomerGroupType | 'portfolio';

export const CUSTOMER_GROUP_MEMBER_KINDS = ['tenant', 'brand'] as const;
export type CustomerGroupMemberKind = (typeof CUSTOMER_GROUP_MEMBER_KINDS)[number];

export const CUSTOMER_GROUP_MEMBER_RELATIONSHIPS = [
  'contract_holder',
  'served_brand',
  'operational_member',
] as const;
export type CustomerGroupMemberRelationship =
  (typeof CUSTOMER_GROUP_MEMBER_RELATIONSHIPS)[number];

export interface CustomerAccountGroupRecord {
  id: Uuid;
  slug: string;
  display_name: string;
  group_type: CustomerGroupTypeRecord;
  status: 'active' | 'archived';
  description: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_user_id: Uuid | null;
  updated_by_user_id: Uuid | null;
}

export interface AdminCustomerAccountGroupListRow {
  id: Uuid;
  slug: string;
  display_name: string;
  group_type: CustomerGroupTypeRecord;
  status: 'active' | 'archived';
  description: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_user_id: Uuid | null;
  created_by_full_name: string | null;
  updated_by_user_id: Uuid | null;
  updated_by_full_name: string | null;
  active_member_count: number;
  active_tenant_member_count: number;
  active_brand_member_count: number;
}

export interface AdminCustomerAccountGroupMemberRow {
  id: Uuid;
  tenant_id: Uuid | null;
  tenant_slug: string | null;
  tenant_display_name: string | null;
  member_kind: CustomerGroupMemberKind;
  member_name: string;
  relationship: CustomerGroupMemberRelationship;
  source_system: string;
  source_external_id: string | null;
  is_primary: boolean;
  status: 'active' | 'archived';
  notes: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
}

export interface AdminCustomerAccountGroupDetailRow extends AdminCustomerAccountGroupListRow {
  members: AdminCustomerAccountGroupMemberRow[];
}

export interface RpcAdminCreateCustomerAccountGroupPayload {
  p_slug: string;
  p_display_name: string;
  p_group_type?: CustomerGroupType;
  p_description?: string | null;
}

export type RpcAdminCreateCustomerAccountGroupResponse = CustomerAccountGroupRecord;

export interface RpcAdminAddCustomerAccountGroupMemberPayload {
  p_group_id: Uuid;
  p_member_kind: CustomerGroupMemberKind;
  p_tenant_id?: Uuid | null;
  p_member_name?: string | null;
  p_relationship?: CustomerGroupMemberRelationship;
  p_source_system?: string;
  p_source_external_id?: string | null;
  p_is_primary?: boolean;
  p_notes?: string | null;
}

export type RpcAdminAddCustomerAccountGroupMemberResponse = {
  id: Uuid;
  group_id: Uuid;
  tenant_id: Uuid | null;
  member_kind: CustomerGroupMemberKind;
  member_name: string | null;
  relationship: CustomerGroupMemberRelationship;
  source_system: string;
  source_external_id: string | null;
  is_primary: boolean;
  status: 'active' | 'archived';
  notes: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by_user_id: Uuid | null;
  updated_by_user_id: Uuid | null;
};

export interface RpcAdminArchiveCustomerAccountGroupMemberPayload {
  p_member_id: Uuid;
}

export type RpcAdminArchiveCustomerAccountGroupMemberResponse =
  RpcAdminAddCustomerAccountGroupMemberResponse;

export interface RpcAdminUpsertCustomerAccountProfilePayload {
  p_tenant_id: Uuid;
  p_product_line: CustomerProductLine;
  p_operational_status: CustomerOperationalStatus;
  p_account_tier: string;
  p_internal_notes?: string | null;
  p_operational_flags?: JsonObject;
  p_features?: Array<{
    feature_key: string;
    enabled: boolean;
    source: string;
    notes?: string | null;
  }> | null;
}

export interface RpcAdminAddCustomerIntegrationPayload {
  p_tenant_id: Uuid;
  p_integration_type: CustomerIntegrationType;
  p_provider: string;
  p_status: CustomerIntegrationStatus;
  p_environment: CustomerIntegrationEnvironment;
  p_notes?: string | null;
}

export interface RpcAdminUpdateCustomerIntegrationPayload {
  p_integration_id: Uuid;
  p_status: CustomerIntegrationStatus;
  p_environment: CustomerIntegrationEnvironment;
  p_notes?: string | null;
}

export interface RpcAdminArchiveCustomerIntegrationPayload {
  p_integration_id: Uuid;
}

export interface RpcAdminAddCustomerCustomizationPayload {
  p_tenant_id: Uuid;
  p_title: string;
  p_description: string;
  p_risk_level: CustomerCustomizationRiskLevel;
  p_operational_note?: string | null;
  p_status?: string;
}

export interface RpcAdminUpdateCustomerCustomizationPayload {
  p_customization_id: Uuid;
  p_title: string;
  p_description: string;
  p_risk_level: CustomerCustomizationRiskLevel;
  p_operational_note?: string | null;
  p_status?: string;
}

export interface RpcAdminArchiveCustomerCustomizationPayload {
  p_customization_id: Uuid;
}

export interface RpcAdminAddCustomerAccountAlertPayload {
  p_tenant_id: Uuid;
  p_severity: CustomerAlertSeverity;
  p_title: string;
  p_description: string;
  p_expires_at?: IsoTimestamp | null;
}

export interface RpcAdminUpdateCustomerAccountAlertPayload {
  p_alert_id: Uuid;
  p_severity: CustomerAlertSeverity;
  p_title: string;
  p_description: string;
  p_active?: boolean;
  p_expires_at?: IsoTimestamp | null;
}

export interface RpcAdminArchiveCustomerAccountAlertPayload {
  p_alert_id: Uuid;
}

export interface RpcAdminSetCustomerFeatureFlagPayload {
  p_tenant_id: Uuid;
  p_feature_key: string;
  p_enabled: boolean;
  p_source?: string;
  p_notes?: string | null;
}

export interface TicketKnowledgeLinkRecord {
  id: Uuid;
  tenantId: Uuid;
  ticketId: Uuid;
  articleId: Uuid | null;
  linkType: TicketKnowledgeLinkType;
  note: string | null;
  createdByUserId: Uuid;
  createdAt: IsoTimestamp;
  archivedAt: IsoTimestamp | null;
  archivedByUserId: Uuid | null;
}

export interface SupportTicketKnowledgeLink {
  ticketKnowledgeLinkId: Uuid;
  ticketId: Uuid;
  linkType: TicketKnowledgeLinkType;
  note: string | null;
  createdAt: IsoTimestamp;
  createdByUserId: Uuid;
  createdByFullName: string | null;
  articleId: Uuid | null;
  articleTitle: string | null;
  articleSlug: string | null;
  articleVisibility: KnowledgeArticleVisibility | null;
  articleStatus: KnowledgeArticleStatus | null;
  publicArticlePath: string | null;
  canSendToCustomer: boolean;
  isCustomerSendAllowed: boolean;
  reasonIfBlocked: string | null;
}

export interface SupportTicketAttachment {
  attachmentId: Uuid;
  ticketId: Uuid;
  displayName: string;
  contentType: string | null;
  sizeBytes: number;
  uploadedByName: string | null;
  createdAt: IsoTimestamp;
  status: TicketAttachmentStatus;
  canDownload: boolean;
  canArchive: boolean;
}

export interface RpcSupportCreateTicketAttachmentUploadPayload {
  ticketId: Uuid;
  tenantId: Uuid;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
}

export interface RpcSupportCreateTicketAttachmentUploadResponse {
  attachmentId: Uuid;
  uploadIntentId: Uuid;
  ticketId: Uuid;
  tenantId: Uuid;
  displayName: string;
  contentType: string;
  sizeBytes: number;
  maxSizeBytes: number;
  expiresAt: IsoTimestamp;
  uploadUrl: string;
}

export interface RpcSupportRegisterTicketAttachmentPayload {
  uploadIntentId: Uuid;
}

export type RpcSupportRegisterTicketAttachmentResponse = SupportTicketAttachment;

export interface RpcSupportGetTicketAttachmentDownloadUrlPayload {
  attachmentId: Uuid;
}

export interface RpcSupportGetTicketAttachmentDownloadUrlResponse {
  attachmentId: Uuid;
  expiresAt: IsoTimestamp;
  downloadUrl: string;
}

export interface EngineeringWorkItemRecord {
  id: Uuid;
  tenantId: Uuid;
  workItemType: EngineeringWorkItemType;
  status: EngineeringWorkItemStatus;
  priority: TicketPriority;
  title: string;
  description: string;
  createdByUserId: Uuid;
  assignedToUserId: Uuid | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  updatedByUserId: Uuid | null;
}

export interface EngineeringTicketLinkRecord {
  id: Uuid;
  tenantId: Uuid;
  ticketId: Uuid;
  engineeringWorkItemId: Uuid;
  handoffNote: string | null;
  createdByUserId: Uuid;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  updatedByUserId: Uuid | null;
}

export interface InternalActionRecord {
  id: Uuid;
  tenantId: Uuid;
  ticketId: Uuid;
  targetArea: InternalActionAreaKey;
  supportType: InternalActionSupportType;
  priority: TicketPriority;
  status: InternalActionStatus;
  summary: string;
  context: string;
  requestedByUserId: Uuid;
  assignedAreaUserId: Uuid | null;
  returnedToSupportAt: IsoTimestamp | null;
  closedAt: IsoTimestamp | null;
  cancelledAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  updatedByUserId: Uuid | null;
}

export interface InternalActionUpdateRecord {
  id: Uuid;
  tenantId: Uuid;
  internalActionId: Uuid;
  updateKind: InternalActionUpdateKind;
  statusBefore: InternalActionStatus | null;
  statusAfter: InternalActionStatus | null;
  body: string;
  metadata: JsonObject;
  createdByUserId: Uuid;
  createdAt: IsoTimestamp;
}

export interface InternalActionEvidenceLinkRecord {
  id: Uuid;
  tenantId: Uuid;
  internalActionId: Uuid;
  internalActionUpdateId: Uuid;
  ticketAttachmentId: Uuid;
  note: string | null;
  linkedByUserId: Uuid;
  createdAt: IsoTimestamp;
}

export interface InternalAreaMembershipRecord {
  id: Uuid;
  tenantId: Uuid;
  userId: Uuid;
  areaKey: InternalActionAreaKey;
  role: InternalAreaMembershipRole;
  status: InternalAreaMembershipStatus;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  createdByUserId: Uuid | null;
  updatedByUserId: Uuid | null;
}

export interface SupportTicketEngineeringLink {
  engineeringTicketLinkId: Uuid;
  ticketId: Uuid;
  tenantId: Uuid;
  handoffNote: string | null;
  createdByUserId: Uuid;
  createdByFullName: string | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  engineeringWorkItemId: Uuid;
  workItemType: EngineeringWorkItemType;
  workItemStatus: EngineeringWorkItemStatus;
  workItemPriority: TicketPriority;
  workItemTitle: string;
  workItemDescription: string;
  assignedToUserId: Uuid | null;
  assignedToFullName: string | null;
  workItemCreatedAt: IsoTimestamp;
  workItemUpdatedAt: IsoTimestamp;
  lastUpdateKind: EngineeringWorkItemUpdateKind | null;
  lastUpdateSummary: string | null;
  lastUpdateNextStep: string | null;
  lastUpdateAt: IsoTimestamp | null;
}

export interface SupportTicketInternalAction {
  internalActionId: Uuid;
  ticketId: Uuid;
  tenantId: Uuid;
  targetArea: InternalActionAreaKey;
  targetAreaLabel: string;
  supportType: InternalActionSupportType;
  priority: TicketPriority;
  status: InternalActionStatus;
  summary: string;
  assignedAreaUserId: Uuid | null;
  assignedAreaUserName: string | null;
  requestedByUserId: Uuid;
  requestedByUserName: string | null;
  lastUpdateKind: InternalActionUpdateKind | null;
  lastUpdateSummary: string | null;
  lastUpdateAt: IsoTimestamp | null;
  hasPendingReturn: boolean;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface SupportInternalActionTargetArea {
  areaKey: InternalActionAreaKey;
  displayName: string;
  status: TicketReferenceStatus;
  allowsSpecializedBridge: boolean;
  canCreateAction: boolean;
  unavailableReason: string | null;
}

export interface SupportInternalActionDetail {
  internalActionId: Uuid;
  ticketId: Uuid;
  ticketTitle: string;
  ticketStatus: TicketStatus;
  ticketPriority: TicketPriority;
  ticketSeverity: TicketSeverity;
  tenantId: Uuid;
  targetArea: InternalActionAreaKey;
  targetAreaLabel: string;
  supportType: InternalActionSupportType;
  priority: TicketPriority;
  status: InternalActionStatus;
  summary: string;
  context: string;
  requestedByUserId: Uuid;
  requestedByUserName: string | null;
  assignedAreaUserId: Uuid | null;
  assignedAreaUserName: string | null;
  returnedToSupportAt: IsoTimestamp | null;
  closedAt: IsoTimestamp | null;
  cancelledAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  updatedByUserId: Uuid | null;
  updatedByUserName: string | null;
  lastUpdateId: Uuid | null;
  lastUpdateKind: InternalActionUpdateKind | null;
  lastUpdateSummary: string | null;
  lastUpdateAt: IsoTimestamp | null;
  lastUpdateByUserId: Uuid | null;
  lastUpdateByUserName: string | null;
  linkedEvidenceCount: number;
  hasPendingReturn: boolean;
}

export interface SupportInternalActionTimelineEntry {
  internalActionUpdateId: Uuid;
  internalActionId: Uuid;
  ticketId: Uuid;
  tenantId: Uuid;
  targetArea: InternalActionAreaKey;
  targetAreaLabel: string;
  updateKind: InternalActionUpdateKind;
  statusBefore: InternalActionStatus | null;
  statusAfter: InternalActionStatus | null;
  body: string;
  metadata: JsonObject;
  createdByUserId: Uuid;
  createdByUserName: string | null;
  createdAt: IsoTimestamp;
}

export interface InternalActionAreaQueueItem {
  internalActionId: Uuid;
  ticketId: Uuid;
  ticketTitle: string;
  ticketStatus: TicketStatus;
  ticketPriority: TicketPriority;
  ticketSeverity: TicketSeverity;
  ticketUpdatedAt: IsoTimestamp;
  tenantId: Uuid;
  targetArea: InternalActionAreaKey;
  targetAreaLabel: string;
  supportType: InternalActionSupportType;
  priority: TicketPriority;
  status: InternalActionStatus;
  summary: string;
  context: string;
  requestedByUserId: Uuid;
  requestedByUserName: string | null;
  assignedAreaUserId: Uuid | null;
  assignedAreaUserName: string | null;
  lastUpdateKind: InternalActionUpdateKind | null;
  lastUpdateSummary: string | null;
  lastUpdateAt: IsoTimestamp | null;
  returnedToSupportAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface InternalActionAreaAuthContext {
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string | null;
  areaKey: InternalActionAreaKey;
  areaLabel: string;
  role: InternalAreaMembershipRole;
  status: InternalAreaMembershipStatus;
  visibleOpenActionCount: number;
  canViewQueue: boolean;
}

export type PlatformRole =
  | 'platform_admin'
  | 'support_agent'
  | 'support_manager'
  | 'engineering_member'
  | 'engineering_manager'
  | 'knowledge_manager'
  | 'audit_reviewer'
  | 'dashboard_viewer';

export const COMMERCIAL_PRODUCT_STATUSES = [
  'draft',
  'active',
  'deprecated',
  'archived',
] as const;
export type CommercialProductStatus =
  (typeof COMMERCIAL_PRODUCT_STATUSES)[number];

export const COMMERCIAL_PRODUCT_PLAN_STATUSES = [
  'draft',
  'active',
  'deprecated',
  'archived',
] as const;
export type CommercialProductPlanStatus =
  (typeof COMMERCIAL_PRODUCT_PLAN_STATUSES)[number];

export const COMMERCIAL_PRODUCT_MODULE_STATUSES = [
  'draft',
  'active',
  'deprecated',
  'archived',
] as const;
export type CommercialProductModuleStatus =
  (typeof COMMERCIAL_PRODUCT_MODULE_STATUSES)[number];

export const COMMERCIAL_PRODUCT_FEATURE_STATUSES = [
  'draft',
  'active',
  'deprecated',
  'archived',
] as const;
export type CommercialProductFeatureStatus =
  (typeof COMMERCIAL_PRODUCT_FEATURE_STATUSES)[number];

export const COMMERCIAL_PLAN_FEATURE_INCLUSION_TYPES = [
  'included',
  'optional',
  'addon_available',
  'excluded',
] as const;
export type CommercialPlanFeatureInclusionType =
  (typeof COMMERCIAL_PLAN_FEATURE_INCLUSION_TYPES)[number];

export const PRODUCT_AREA_OWNERSHIP_ROLES = [
  'business_owner',
  'technical_owner',
  'support_owner',
  'contributor',
] as const;
export type ProductAreaOwnershipRole =
  (typeof PRODUCT_AREA_OWNERSHIP_ROLES)[number];

export const PRODUCT_AREA_OWNERSHIP_STATUSES = [
  'active',
  'inactive',
  'archived',
] as const;
export type ProductAreaOwnershipStatus =
  (typeof PRODUCT_AREA_OWNERSHIP_STATUSES)[number];

export interface CommercialProductRecord {
  id: Uuid;
  productKey: string;
  displayName: string;
  description: string | null;
  status: CommercialProductStatus;
  archivedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  createdByUserId: Uuid | null;
  updatedByUserId: Uuid | null;
}

export interface CommercialProductPlanRecord {
  id: Uuid;
  productId: Uuid;
  planKey: string;
  displayName: string;
  description: string | null;
  status: CommercialProductPlanStatus;
  sortOrder: number;
  archivedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  createdByUserId: Uuid | null;
  updatedByUserId: Uuid | null;
}

export interface CommercialProductModuleRecord {
  id: Uuid;
  productId: Uuid;
  moduleKey: string;
  displayName: string;
  description: string | null;
  status: CommercialProductModuleStatus;
  sortOrder: number;
  archivedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  createdByUserId: Uuid | null;
  updatedByUserId: Uuid | null;
}

export interface CommercialProductFeatureRecord {
  id: Uuid;
  productId: Uuid;
  moduleId: Uuid | null;
  featureKey: string;
  displayName: string;
  description: string | null;
  status: CommercialProductFeatureStatus;
  customerVisibleDefault: boolean;
  supportVisibleDefault: boolean;
  sortOrder: number;
  archivedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  createdByUserId: Uuid | null;
  updatedByUserId: Uuid | null;
}

export interface CommercialPlanFeatureRecord {
  id: Uuid;
  planId: Uuid;
  featureId: Uuid;
  inclusionType: CommercialPlanFeatureInclusionType;
  defaultEnabled: boolean;
  limitKey: string | null;
  limitValue: number | null;
  limitUnit: string | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  createdByUserId: Uuid | null;
  updatedByUserId: Uuid | null;
}

export interface ProductAreaOwnershipRecord {
  id: Uuid;
  productId: Uuid;
  moduleId: Uuid | null;
  featureId: Uuid | null;
  areaKey: InternalActionAreaKey;
  ownershipRole: ProductAreaOwnershipRole;
  status: ProductAreaOwnershipStatus;
  archivedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  createdByUserId: Uuid | null;
  updatedByUserId: Uuid | null;
}

export interface AdminCommercialProduct {
  productId: Uuid;
  productKey: string;
  displayName: string;
  description: string | null;
  status: CommercialProductStatus;
  planCount: number;
  activePlanCount: number;
  moduleCount: number;
  featureCount: number;
  activeOwnershipCount: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface AdminCommercialProductDetailPlan {
  planId: Uuid;
  planKey: string;
  displayName: string;
  description: string | null;
  status: CommercialProductPlanStatus;
  sortOrder: number;
}

export interface AdminCommercialProductDetailModule {
  moduleId: Uuid;
  moduleKey: string;
  displayName: string;
  description: string | null;
  status: CommercialProductModuleStatus;
  sortOrder: number;
}

export interface AdminCommercialProductDetailFeature {
  featureId: Uuid;
  moduleId: Uuid | null;
  featureKey: string;
  displayName: string;
  description: string | null;
  status: CommercialProductFeatureStatus;
  customerVisibleDefault: boolean;
  supportVisibleDefault: boolean;
  sortOrder: number;
}

export interface AdminCommercialProductDetailOwnership {
  ownershipId: Uuid;
  areaKey: InternalActionAreaKey;
  areaLabel: string;
  ownershipRole: ProductAreaOwnershipRole;
  status: ProductAreaOwnershipStatus;
  moduleId: Uuid | null;
  featureId: Uuid | null;
}

export interface AdminCommercialProductDetail {
  productId: Uuid;
  productKey: string;
  displayName: string;
  description: string | null;
  status: CommercialProductStatus;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  plans: AdminCommercialProductDetailPlan[];
  modules: AdminCommercialProductDetailModule[];
  features: AdminCommercialProductDetailFeature[];
  ownerships: AdminCommercialProductDetailOwnership[];
}

export interface AdminCommercialProductPlan {
  planId: Uuid;
  productId: Uuid;
  productKey: string;
  productDisplayName: string;
  planKey: string;
  displayName: string;
  description: string | null;
  status: CommercialProductPlanStatus;
  sortOrder: number;
  featureCount: number;
  includedFeatureCount: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface AdminProductAreaOwnership {
  ownershipId: Uuid;
  productId: Uuid;
  productKey: string;
  productDisplayName: string;
  moduleId: Uuid | null;
  moduleKey: string | null;
  moduleDisplayName: string | null;
  featureId: Uuid | null;
  featureKey: string | null;
  featureDisplayName: string | null;
  areaKey: InternalActionAreaKey;
  areaDisplayName: string;
  areaStatus: TicketReferenceStatus;
  ownershipRole: ProductAreaOwnershipRole;
  status: ProductAreaOwnershipStatus;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface RpcAdminCreateCommercialProductPayload {
  productKey: string;
  displayName: string;
  description?: string | null;
  status?: CommercialProductStatus;
}
export type RpcAdminCreateCommercialProductResponse = CommercialProductRecord;

export interface RpcAdminUpdateCommercialProductPayload {
  productId: Uuid;
  displayName?: string | null;
  description?: string | null;
  status?: CommercialProductStatus | null;
}
export type RpcAdminUpdateCommercialProductResponse = CommercialProductRecord;

export interface RpcAdminCreateCommercialProductPlanPayload {
  productId: Uuid;
  planKey: string;
  displayName: string;
  description?: string | null;
  status?: CommercialProductPlanStatus;
  sortOrder?: number;
}
export type RpcAdminCreateCommercialProductPlanResponse =
  CommercialProductPlanRecord;

export interface RpcAdminUpdateCommercialProductPlanPayload {
  planId: Uuid;
  displayName?: string | null;
  description?: string | null;
  status?: CommercialProductPlanStatus | null;
  sortOrder?: number | null;
}
export type RpcAdminUpdateCommercialProductPlanResponse =
  CommercialProductPlanRecord;

export interface RpcAdminCreateCommercialProductModulePayload {
  productId: Uuid;
  moduleKey: string;
  displayName: string;
  description?: string | null;
  status?: CommercialProductModuleStatus;
  sortOrder?: number;
}
export type RpcAdminCreateCommercialProductModuleResponse =
  CommercialProductModuleRecord;

export interface RpcAdminUpdateCommercialProductModulePayload {
  moduleId: Uuid;
  displayName?: string | null;
  description?: string | null;
  status?: CommercialProductModuleStatus | null;
  sortOrder?: number | null;
}
export type RpcAdminUpdateCommercialProductModuleResponse =
  CommercialProductModuleRecord;

export interface RpcAdminCreateCommercialProductFeaturePayload {
  productId: Uuid;
  featureKey: string;
  displayName: string;
  moduleId?: Uuid | null;
  description?: string | null;
  status?: CommercialProductFeatureStatus;
  customerVisibleDefault?: boolean;
  supportVisibleDefault?: boolean;
  sortOrder?: number;
}
export type RpcAdminCreateCommercialProductFeatureResponse =
  CommercialProductFeatureRecord;

export interface RpcAdminUpdateCommercialProductFeaturePayload {
  featureId: Uuid;
  displayName?: string | null;
  moduleId?: Uuid | null;
  description?: string | null;
  status?: CommercialProductFeatureStatus | null;
  customerVisibleDefault?: boolean | null;
  supportVisibleDefault?: boolean | null;
  sortOrder?: number | null;
}
export type RpcAdminUpdateCommercialProductFeatureResponse =
  CommercialProductFeatureRecord;

export interface RpcAdminSetCommercialPlanFeaturePayload {
  planId: Uuid;
  featureId: Uuid;
  inclusionType: CommercialPlanFeatureInclusionType;
  defaultEnabled?: boolean;
  limitKey?: string | null;
  limitValue?: number | null;
  limitUnit?: string | null;
}
export type RpcAdminSetCommercialPlanFeatureResponse =
  CommercialPlanFeatureRecord;

export interface RpcAdminAssignProductAreaOwnershipPayload {
  productId: Uuid;
  areaKey: InternalActionAreaKey;
  ownershipRole: ProductAreaOwnershipRole;
  moduleId?: Uuid | null;
  featureId?: Uuid | null;
  status?: ProductAreaOwnershipStatus;
}
export type RpcAdminAssignProductAreaOwnershipResponse =
  ProductAreaOwnershipRecord;

export interface RpcAdminArchiveProductAreaOwnershipPayload {
  ownershipId: Uuid;
}
export type RpcAdminArchiveProductAreaOwnershipResponse =
  ProductAreaOwnershipRecord;

export const CUSTOMER_PRODUCT_SUBSCRIPTION_STATUSES = [
  'pending',
  'active',
  'suspended',
  'cancelled',
  'expired',
] as const;
export type CustomerProductSubscriptionStatus =
  (typeof CUSTOMER_PRODUCT_SUBSCRIPTION_STATUSES)[number];

export const CUSTOMER_PRODUCT_FEATURE_ENTITLEMENT_STATUSES = [
  'active',
  'inactive',
  'archived',
] as const;
export type CustomerProductFeatureEntitlementStatus =
  (typeof CUSTOMER_PRODUCT_FEATURE_ENTITLEMENT_STATUSES)[number];

export const CUSTOMER_PRODUCT_FEATURE_ENTITLEMENT_SOURCES = [
  'plan',
  'addon',
  'pilot',
  'ops_override',
  'migration',
] as const;
export type CustomerProductFeatureEntitlementSource =
  (typeof CUSTOMER_PRODUCT_FEATURE_ENTITLEMENT_SOURCES)[number];

export const CUSTOMER_PRODUCT_INTERNAL_OWNER_ROLES = [
  'account_owner',
  'cs_owner',
  'support_owner',
  'technical_owner',
  'finance_owner',
  'implementation_owner',
] as const;
export type CustomerProductInternalOwnerRole =
  (typeof CUSTOMER_PRODUCT_INTERNAL_OWNER_ROLES)[number];

export const CUSTOMER_PRODUCT_INTERNAL_OWNER_STATUSES = [
  'active',
  'inactive',
  'archived',
] as const;
export type CustomerProductInternalOwnerStatus =
  (typeof CUSTOMER_PRODUCT_INTERNAL_OWNER_STATUSES)[number];

export interface CustomerProductSubscriptionRecord {
  id: Uuid;
  tenantId: Uuid;
  productId: Uuid;
  planId: Uuid;
  status: CustomerProductSubscriptionStatus;
  startedAt: IsoTimestamp | null;
  endedAt: IsoTimestamp | null;
  renewalAt: IsoTimestamp | null;
  contractReference: string | null;
  source: string;
  notesInternal: string | null;
  metadata: JsonObject;
  archivedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  createdByUserId: Uuid | null;
  updatedByUserId: Uuid | null;
}

export interface CustomerProductFeatureEntitlementRecord {
  id: Uuid;
  subscriptionId: Uuid;
  featureId: Uuid;
  status: CustomerProductFeatureEntitlementStatus;
  entitlementSource: CustomerProductFeatureEntitlementSource;
  reason: string | null;
  startsAt: IsoTimestamp | null;
  endsAt: IsoTimestamp | null;
  metadata: JsonObject;
  archivedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  createdByUserId: Uuid | null;
  updatedByUserId: Uuid | null;
}

export interface CustomerProductInternalOwnerRecord {
  id: Uuid;
  subscriptionId: Uuid;
  ownerUserId: Uuid | null;
  areaKey: InternalActionAreaKey | null;
  ownerRole: CustomerProductInternalOwnerRole;
  status: CustomerProductInternalOwnerStatus;
  notesInternal: string | null;
  archivedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  createdByUserId: Uuid | null;
  updatedByUserId: Uuid | null;
}

export interface AdminCustomerProductSubscription {
  subscriptionId: Uuid;
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  tenantLegalName: string;
  tenantStatus: string;
  productId: Uuid;
  productKey: string;
  productDisplayName: string;
  planId: Uuid;
  planKey: string;
  planDisplayName: string;
  status: CustomerProductSubscriptionStatus;
  startedAt: IsoTimestamp | null;
  endedAt: IsoTimestamp | null;
  renewalAt: IsoTimestamp | null;
  contractReference: string | null;
  source: string;
  notesInternal: string | null;
  metadata: JsonObject;
  activeEntitlementCount: number;
  activeOwnerCount: number;
  archivedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface AdminCustomerProductSubscriptionEntitlement {
  entitlementId: Uuid;
  featureId: Uuid;
  featureKey: string;
  displayName: string;
  status: CustomerProductFeatureEntitlementStatus;
  entitlementSource: CustomerProductFeatureEntitlementSource;
  reason: string | null;
  startsAt: IsoTimestamp | null;
  endsAt: IsoTimestamp | null;
}

export interface AdminCustomerProductSubscriptionOwner {
  ownerId: Uuid;
  ownerUserId: Uuid | null;
  ownerFullName: string | null;
  ownerEmail: string | null;
  areaKey: InternalActionAreaKey | null;
  areaDisplayName: string | null;
  ownerRole: CustomerProductInternalOwnerRole;
  status: CustomerProductInternalOwnerStatus;
}

export interface AdminCustomerProductSubscriptionDetail
  extends AdminCustomerProductSubscription {
  entitlements: AdminCustomerProductSubscriptionEntitlement[];
  owners: AdminCustomerProductSubscriptionOwner[];
}

export interface AdminCustomerProductFeatureEntitlement {
  entitlementId: Uuid;
  subscriptionId: Uuid;
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  productId: Uuid;
  productKey: string;
  productDisplayName: string;
  featureId: Uuid;
  featureKey: string;
  featureDisplayName: string;
  status: CustomerProductFeatureEntitlementStatus;
  entitlementSource: CustomerProductFeatureEntitlementSource;
  reason: string | null;
  startsAt: IsoTimestamp | null;
  endsAt: IsoTimestamp | null;
  metadata: JsonObject;
  archivedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface AdminCustomerProductInternalOwner {
  ownerId: Uuid;
  subscriptionId: Uuid;
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  productId: Uuid;
  productKey: string;
  productDisplayName: string;
  ownerUserId: Uuid | null;
  ownerFullName: string | null;
  ownerEmail: string | null;
  areaKey: InternalActionAreaKey | null;
  areaDisplayName: string | null;
  ownerRole: CustomerProductInternalOwnerRole;
  status: CustomerProductInternalOwnerStatus;
  notesInternal: string | null;
  archivedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface SupportCustomerProductContextFeature {
  featureKey: string;
  displayName: string;
  entitlementSource: CustomerProductFeatureEntitlementSource;
}

export interface SupportCustomerProductContextOwner {
  areaKey: InternalActionAreaKey | null;
  areaDisplayName: string | null;
  ownerRole: CustomerProductInternalOwnerRole;
}

export interface SupportCustomerProductContext {
  subscriptionId: Uuid;
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  productKey: string;
  productDisplayName: string;
  planKey: string;
  planDisplayName: string;
  status: Extract<CustomerProductSubscriptionStatus, 'active' | 'suspended'>;
  startedAt: IsoTimestamp | null;
  endedAt: IsoTimestamp | null;
  renewalAt: IsoTimestamp | null;
  activeSupportFeatures: SupportCustomerProductContextFeature[];
  activeInternalOwners: SupportCustomerProductContextOwner[];
}

export interface CsCustomerPortfolioProductContext {
  subscriptionId: Uuid;
  productKey: string;
  productDisplayName: string;
  planKey: string;
  planDisplayName: string;
  status: Extract<CustomerProductSubscriptionStatus, 'active' | 'suspended'>;
  startedAt: IsoTimestamp | null;
  endedAt: IsoTimestamp | null;
  renewalAt: IsoTimestamp | null;
  activeFeatureCount: number;
  activeOwnerCount: number;
}

export type CsPortfolioAssignmentStatus = 'active' | 'paused' | 'archived' | 'unconfigured';

export interface CsCustomerPortfolioAssignment {
  assignmentId: Uuid | null;
  name: string;
  status: CsPortfolioAssignmentStatus;
  ownerUserId: Uuid | null;
  ownerFullName: string | null;
  ownerEmail: string | null;
  clusterKey: string | null;
  serviceModel: string | null;
  contactFrequency: string | null;
  healthStatus: string | null;
  priority: string | null;
  source: string | null;
  updatedAt: IsoTimestamp | null;
}

export interface CsCustomerPortfolio {
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  tenantLegalName: string;
  tenantStatus: string;
  portfolioScope: 'customer_success_area';
  csOwnerUserId: Uuid | null;
  csOwnerFullName: string | null;
  csOwnerEmail: string | null;
  csOwnerAreaKey: InternalActionAreaKey | null;
  csOwnerAreaDisplayName: string | null;
  activeSubscriptionCount: number;
  activeProductCount: number;
  productContexts: CsCustomerPortfolioProductContext[];
  openTicketCount: number;
  totalTicketCount: number;
  ticketStatusCounts: Partial<Record<TicketStatus, number>>;
  customerSuccessMemberCount: number;
  healthSummaryStatus: 'unavailable';
  healthSummaryReason: string;
  portfolioAssignment: CsCustomerPortfolioAssignment;
  lastOperationalUpdateAt: IsoTimestamp;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface RpcAdminCreateCustomerProductSubscriptionPayload {
  tenantId: Uuid;
  productId: Uuid;
  planId: Uuid;
  status?: CustomerProductSubscriptionStatus;
  startedAt?: IsoTimestamp | null;
  renewalAt?: IsoTimestamp | null;
  contractReference?: string | null;
  source?: string;
  notesInternal?: string | null;
  metadata?: JsonObject;
}
export type RpcAdminCreateCustomerProductSubscriptionResponse =
  CustomerProductSubscriptionRecord;

export interface RpcAdminUpdateCustomerProductSubscriptionPayload {
  subscriptionId: Uuid;
  planId?: Uuid | null;
  status?: CustomerProductSubscriptionStatus | null;
  startedAt?: IsoTimestamp | null;
  endedAt?: IsoTimestamp | null;
  renewalAt?: IsoTimestamp | null;
  contractReference?: string | null;
  notesInternal?: string | null;
  metadata?: JsonObject | null;
}
export type RpcAdminUpdateCustomerProductSubscriptionResponse =
  CustomerProductSubscriptionRecord;

export interface RpcAdminArchiveCustomerProductSubscriptionPayload {
  subscriptionId: Uuid;
}
export type RpcAdminArchiveCustomerProductSubscriptionResponse =
  CustomerProductSubscriptionRecord;

export interface RpcAdminSetCustomerProductFeatureEntitlementPayload {
  subscriptionId: Uuid;
  featureId: Uuid;
  entitlementSource?: CustomerProductFeatureEntitlementSource;
  status?: CustomerProductFeatureEntitlementStatus;
  reason?: string | null;
  startsAt?: IsoTimestamp | null;
  endsAt?: IsoTimestamp | null;
  metadata?: JsonObject;
}
export type RpcAdminSetCustomerProductFeatureEntitlementResponse =
  CustomerProductFeatureEntitlementRecord;

export interface RpcAdminArchiveCustomerProductFeatureEntitlementPayload {
  entitlementId: Uuid;
}
export type RpcAdminArchiveCustomerProductFeatureEntitlementResponse =
  CustomerProductFeatureEntitlementRecord;

export interface RpcAdminAssignCustomerProductInternalOwnerPayload {
  subscriptionId: Uuid;
  ownerRole: CustomerProductInternalOwnerRole;
  ownerUserId?: Uuid | null;
  areaKey?: InternalActionAreaKey | null;
  status?: CustomerProductInternalOwnerStatus;
  notesInternal?: string | null;
}
export type RpcAdminAssignCustomerProductInternalOwnerResponse =
  CustomerProductInternalOwnerRecord;

export interface RpcAdminArchiveCustomerProductInternalOwnerPayload {
  ownerId: Uuid;
}
export type RpcAdminArchiveCustomerProductInternalOwnerResponse =
  CustomerProductInternalOwnerRecord;

export interface AdminInternalArea {
  areaKey: InternalActionAreaKey;
  displayName: string;
  status: TicketReferenceStatus;
  isSystem: boolean;
  allowsSpecializedBridge: boolean;
  sourceTable: 'internal_action_target_areas';
  canUseAsOperationalArea: boolean;
  totalMembershipCount: number;
  activeMembershipCount: number;
  activeUserCount: number;
  activeTenantCount: number;
  openActionCount: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface AdminInternalCollaborator {
  userId: Uuid;
  userFullName: string | null;
  userEmail: string | null;
  locale: string;
  timezone: string;
  userIsActive: boolean;
  globalRoles: PlatformRole[];
  totalAreaMembershipCount: number;
  activeAreaMembershipCount: number;
  activeAreaTenantCount: number;
  activeAreaKeys: InternalActionAreaKey[];
  lastAreaMembershipUpdatedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  canManageInternalMemberships: boolean;
}

export interface InternalAreaLandingContext extends InternalActionAreaAuthContext {
  defaultLandingPath: '/internal-actions';
}

export interface EngineeringWorkspaceWorkItem {
  engineeringWorkItemId: Uuid;
  tenantId: Uuid;
  tenantSlug: string;
  tenantName: string | null;
  workItemType: EngineeringWorkItemType;
  status: EngineeringWorkItemStatus;
  priority: TicketPriority;
  title: string;
  description: string;
  createdByUserId: Uuid;
  createdByFullName: string | null;
  assignedToUserId: Uuid | null;
  assignedToFullName: string | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  updatedByUserId: Uuid | null;
  updatedByFullName: string | null;
  linkedTicketsCount: number;
  originTicketId: Uuid | null;
  originTicketTitle: string | null;
  originTicketStatus: TicketStatus | null;
  originTicketPriority: TicketPriority | null;
  originTicketSeverity: TicketSeverity | null;
  lastUpdateKind: EngineeringWorkItemUpdateKind | null;
  lastUpdateSummary: string | null;
  lastUpdateNextStep: string | null;
  lastUpdateAt: IsoTimestamp | null;
  lastUpdateByUserId: Uuid | null;
  lastUpdateByFullName: string | null;
  canManageEngineering: boolean;
}

export interface EngineeringWorkspaceTicketLink {
  engineeringTicketLinkId: Uuid;
  tenantId: Uuid;
  tenantSlug: string;
  tenantName: string | null;
  engineeringWorkItemId: Uuid;
  workItemTitle: string;
  workItemStatus: EngineeringWorkItemStatus;
  workItemPriority: TicketPriority;
  ticketId: Uuid;
  ticketTitle: string;
  ticketStatus: TicketStatus;
  ticketPriority: TicketPriority;
  ticketSeverity: TicketSeverity;
  ticketUpdatedAt: IsoTimestamp;
  handoffNote: string | null;
  createdByUserId: Uuid;
  createdByFullName: string | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface EngineeringWorkspaceUpdate {
  engineeringWorkItemUpdateId: Uuid;
  tenantId: Uuid;
  engineeringWorkItemId: Uuid;
  updateKind: EngineeringWorkItemUpdateKind;
  status: EngineeringWorkItemStatus | null;
  summary: string;
  nextStep: string | null;
  createdByUserId: Uuid;
  createdByFullName: string | null;
  createdAt: IsoTimestamp;
}

export interface SupportKnowledgeArticlePickerItem {
  ticketId: Uuid;
  articleId: Uuid;
  articleTitle: string;
  articleSlug: string;
  articleSummary: string | null;
  categoryName: string | null;
  articleVisibility: KnowledgeArticleVisibility;
  articleStatus: KnowledgeArticleStatus;
  publicArticlePath: string | null;
  canSendToCustomer: boolean;
  isCustomerSendAllowed: boolean;
  reasonIfBlocked: string | null;
}

export interface RpcCreateTicketPayload {
  tenantId: Uuid;
  title: string;
  description: string;
  source: TicketSource;
  priority?: TicketPriority;
  severity?: TicketSeverity;
  requesterContactId?: Uuid | null;
  categoryId?: Uuid | null;
  operationalReasonId?: Uuid | null;
}
export type RpcCreateTicketResponse = TicketRecord;

export interface RpcUpdateTicketStatusPayload {
  ticketId: Uuid;
  status: TicketStatusUpdateTarget;
  note?: string | null;
  operationalReasonId?: Uuid | null;
}
export type RpcUpdateTicketStatusResponse = TicketRecord;

export interface RpcSupportUpdateTicketClassificationPayload {
  ticketId: Uuid;
  categoryId: Uuid;
  operationalReasonId?: Uuid | null;
  note?: string | null;
}
export type RpcSupportUpdateTicketClassificationResponse = TicketRecord;

export interface RpcSupportUpdateTicketPrioritySeverityPayload {
  ticketId: Uuid;
  priority: TicketPriority;
  severity: TicketSeverity;
  operationalReasonId?: Uuid | null;
  note?: string | null;
}
export type RpcSupportUpdateTicketPrioritySeverityResponse = TicketRecord;

export interface RpcAssignTicketPayload {
  ticketId: Uuid;
  assignedToUserId?: Uuid | null;
}
export type RpcAssignTicketResponse = TicketRecord;

export interface RpcAddTicketMessagePayload {
  ticketId: Uuid;
  body: string;
}
export type RpcAddTicketMessageResponse = TicketMessageRecord;

export interface RpcAddInternalTicketNotePayload {
  ticketId: Uuid;
  body: string;
}
export type RpcAddInternalTicketNoteResponse = TicketMessageRecord;

export interface RpcCloseTicketPayload {
  ticketId: Uuid;
  closeReason: string;
}
export type RpcCloseTicketResponse = TicketRecord;

export interface RpcReopenTicketPayload {
  ticketId: Uuid;
  reopenReason?: string | null;
}
export type RpcReopenTicketResponse = TicketRecord;

export interface RpcSupportLinkTicketArticlePayload {
  ticketId: Uuid;
  articleId?: Uuid | null;
  linkType?: TicketKnowledgeLinkType;
  note?: string | null;
}
export type RpcSupportLinkTicketArticleResponse = TicketKnowledgeLinkRecord;

export interface RpcSupportArchiveTicketArticleLinkPayload {
  ticketKnowledgeLinkId: Uuid;
}
export type RpcSupportArchiveTicketArticleLinkResponse = TicketKnowledgeLinkRecord;

export interface RpcSupportMarkDocumentationGapPayload {
  ticketId: Uuid;
  note?: string | null;
  articleId?: Uuid | null;
}
export type RpcSupportMarkDocumentationGapResponse = TicketKnowledgeLinkRecord;

export interface RpcSupportMarkArticleNeedsUpdatePayload {
  ticketId: Uuid;
  articleId: Uuid;
  note?: string | null;
}
export type RpcSupportMarkArticleNeedsUpdateResponse = TicketKnowledgeLinkRecord;

export interface RpcSupportCreateEngineeringWorkItemFromTicketPayload {
  ticketId: Uuid;
  workItemType: EngineeringWorkItemType;
  title: string;
  description: string;
  handoffNote?: string | null;
}
export type RpcSupportCreateEngineeringWorkItemFromTicketResponse =
  EngineeringTicketLinkRecord;

export interface RpcSupportLinkTicketToEngineeringWorkItemPayload {
  ticketId: Uuid;
  engineeringWorkItemId: Uuid;
  handoffNote?: string | null;
}
export type RpcSupportLinkTicketToEngineeringWorkItemResponse =
  EngineeringTicketLinkRecord;

export interface RpcEngineeringAssignWorkItemPayload {
  engineeringWorkItemId: Uuid;
  tenantId: Uuid;
  assignedToUserId?: Uuid | null;
}
export type RpcEngineeringAssignWorkItemResponse = EngineeringWorkItemRecord;

export interface RpcEngineeringUnassignWorkItemPayload {
  engineeringWorkItemId: Uuid;
  tenantId: Uuid;
}
export type RpcEngineeringUnassignWorkItemResponse = EngineeringWorkItemRecord;

export interface RpcEngineeringUpdateWorkItemStatusPayload {
  engineeringWorkItemId: Uuid;
  tenantId: Uuid;
  status: EngineeringWorkItemStatus;
  summary: string;
  nextStep?: string | null;
}
export type RpcEngineeringUpdateWorkItemStatusResponse = EngineeringWorkItemRecord;

export interface RpcEngineeringAddWorkItemUpdatePayload {
  engineeringWorkItemId: Uuid;
  tenantId: Uuid;
  summary: string;
  nextStep?: string | null;
}
export type RpcEngineeringAddWorkItemUpdateResponse = EngineeringWorkspaceUpdate;

export interface RpcEngineeringReturnWorkItemToSupportPayload {
  engineeringWorkItemId: Uuid;
  tenantId: Uuid;
  summary: string;
  nextStep: string;
}
export type RpcEngineeringReturnWorkItemToSupportResponse = EngineeringWorkItemRecord;

export interface RpcEngineeringLinkExistingWorkItemToTicketPayload {
  engineeringWorkItemId: Uuid;
  ticketId: Uuid;
  tenantId: Uuid;
  handoffNote?: string | null;
}
export type RpcEngineeringLinkExistingWorkItemToTicketResponse =
  EngineeringTicketLinkRecord;

export interface RpcSupportCreateInternalActionPayload {
  ticketId: Uuid;
  targetArea: InternalActionAreaKey;
  supportType: InternalActionSupportType;
  priority?: TicketPriority;
  summary: string;
  context: string;
  evidenceAttachmentIds?: Uuid[] | null;
  assignedAreaUserId?: Uuid | null;
}
export type RpcSupportCreateInternalActionResponse = InternalActionRecord;

export interface RpcInternalActionAssignPayload {
  internalActionId: Uuid;
  tenantId: Uuid;
  assignedAreaUserId: Uuid;
}
export type RpcInternalActionAssignResponse = InternalActionRecord;

export interface RpcInternalActionAssignToSelfPayload {
  internalActionId: Uuid;
  tenantId: Uuid;
}
export type RpcInternalActionAssignToSelfResponse = InternalActionRecord;

export interface RpcInternalActionAddCommentPayload {
  internalActionId: Uuid;
  tenantId: Uuid;
  body: string;
}
export type RpcInternalActionAddCommentResponse = InternalActionUpdateRecord;

export interface RpcInternalActionUpdateStatusPayload {
  internalActionId: Uuid;
  tenantId: Uuid;
  status: InternalActionStatus;
  body?: string | null;
}
export type RpcInternalActionUpdateStatusResponse = InternalActionRecord;

export interface RpcInternalActionAddEvidenceLinkPayload {
  internalActionId: Uuid;
  tenantId: Uuid;
  ticketAttachmentId: Uuid;
  note?: string | null;
}
export type RpcInternalActionAddEvidenceLinkResponse =
  InternalActionEvidenceLinkRecord;

export interface RpcInternalActionReturnToSupportPayload {
  internalActionId: Uuid;
  tenantId: Uuid;
  body: string;
}
export type RpcInternalActionReturnToSupportResponse = InternalActionRecord;

export interface RpcSupportAcceptInternalActionReturnPayload {
  internalActionId: Uuid;
  tenantId: Uuid;
  note?: string | null;
}
export type RpcSupportAcceptInternalActionReturnResponse = InternalActionRecord;

export interface RpcSupportRequestInternalActionFollowupPayload {
  internalActionId: Uuid;
  tenantId: Uuid;
  note: string;
}
export type RpcSupportRequestInternalActionFollowupResponse =
  InternalActionRecord;

export interface RpcSupportCloseInternalActionPayload {
  internalActionId: Uuid;
  tenantId: Uuid;
  note?: string | null;
}
export type RpcSupportCloseInternalActionResponse = InternalActionRecord;

export interface InternalActionAreaDetail
  extends InternalActionAreaQueueItem {
  tenantSlug: string;
  tenantDisplayName: string | null;
  tenantLegalName: string | null;
  updatedByUserId: Uuid | null;
  updatedByUserName: string | null;
  closedAt: IsoTimestamp | null;
  cancelledAt: IsoTimestamp | null;
  linkedEvidenceCount: number;
}

export interface InternalActionAreaTimelineEntry {
  internalActionUpdateId: Uuid;
  internalActionId: Uuid;
  ticketId: Uuid;
  tenantId: Uuid;
  targetArea: InternalActionAreaKey;
  targetAreaLabel: string;
  updateKind: InternalActionUpdateKind;
  statusBefore: InternalActionStatus | null;
  statusAfter: InternalActionStatus | null;
  body: string;
  metadata: JsonObject;
  createdByUserId: Uuid | null;
  createdByUserName: string | null;
  createdAt: IsoTimestamp;
}

export interface AdminInternalActionTargetArea {
  areaKey: InternalActionAreaKey;
  displayName: string;
  status: TicketReferenceStatus;
  isSystem: boolean;
  allowsSpecializedBridge: boolean;
  activeMembershipCount: number;
  openActionCount: number;
  updatedAt: IsoTimestamp;
}

export interface AdminInternalAreaMembership {
  membershipId: Uuid;
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  tenantStatus: string;
  areaKey: InternalActionAreaKey;
  areaLabel: string;
  areaStatus: TicketReferenceStatus;
  userId: Uuid;
  userFullName: string | null;
  userEmail: string | null;
  userIsActive: boolean;
  role: InternalAreaMembershipRole;
  status: InternalAreaMembershipStatus;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  createdByUserId: Uuid | null;
  createdByFullName: string | null;
  updatedByUserId: Uuid | null;
  updatedByFullName: string | null;
  canUpdateRole: boolean;
  canUpdateStatus: boolean;
  canArchive: boolean;
  accessProfileId: Uuid | null;
  accessProfileName: string | null;
  permissionMode: InternalPermissionMode;
}

export interface AdminInternalAccessProfile {
  accessProfileId: Uuid;
  areaKey: InternalActionAreaKey | null;
  areaLabel: string | null;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  screenCount: number;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  canManage: boolean;
}

export interface RpcAdminAddInternalAreaMembershipPayload {
  tenantId: Uuid;
  userId: Uuid;
  areaKey: InternalActionAreaKey;
  role: InternalAreaMembershipRole;
  status?: InternalAreaMembershipStatus;
}
export type RpcAdminAddInternalAreaMembershipResponse =
  InternalAreaMembershipRecord;

export interface RpcAdminUpdateInternalAreaMembershipPayload {
  membershipId: Uuid;
  role: InternalAreaMembershipRole;
  status: InternalAreaMembershipStatus;
}
export type RpcAdminUpdateInternalAreaMembershipResponse =
  InternalAreaMembershipRecord;

export interface RpcAdminArchiveInternalAreaMembershipPayload {
  membershipId: Uuid;
}
export type RpcAdminArchiveInternalAreaMembershipResponse =
  InternalAreaMembershipRecord;

export type CustomerPortalRole = 'customer_user' | 'customer_manager';

export interface CustomerPortalAvailableTenant {
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  portalRole: CustomerPortalRole;
  accessStatus: string;
  canViewTickets: boolean;
  canCreateTicket: boolean;
  canViewAllTenantTickets: boolean;
  isActiveContext: boolean;
  availableTenantCount: number;
  hasMultipleTenants: boolean;
}

export interface CustomerPortalAuthContext {
  userId: Uuid;
  userFullName: string | null;
  userEmail: string | null;
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  tenantLegalName: string;
  portalRole: CustomerPortalRole;
  contactId: Uuid;
  contactFullName: string;
  contactEmail: string | null;
  contactJobTitle: string | null;
  canViewTickets: boolean;
  canCreateTicket: boolean;
  canViewAllTenantTickets: boolean;
}

export interface CustomerPortalProfileContext extends CustomerPortalAuthContext {
  productLine: string;
  operationalStatus: string;
  accountTier: string;
}

export interface CustomerPortalActiveTenantContext
  extends CustomerPortalProfileContext {
  availableTenantCount: number;
  hasMultipleTenants: boolean;
  contextVersion: IsoTimestamp;
}

export type CustomerPortalSessionState =
  | 'ready'
  | 'access_revoked'
  | 'tenant_unavailable';

export type CustomerPortalSessionReasonCode =
  | 'profile_missing'
  | 'profile_inactive'
  | 'membership_revoked'
  | 'tenant_unavailable'
  | 'returns_portal_disabled'
  | 'tenant_inactive'
  | 'contact_inactive'
  | 'no_active_tenant';

export interface CustomerPortalSessionStatus {
  sessionState: CustomerPortalSessionState;
  reasonCode: CustomerPortalSessionReasonCode | null;
  reasonMessage: string | null;
  activeTenantId: Uuid | null;
  activeTenantName: string | null;
  availableTenantCount: number;
  contextVersion: IsoTimestamp | null;
}

export interface CustomerPortalTicketListItem {
  ticketId: Uuid;
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  requesterContactId: Uuid | null;
  requesterContactFullName: string | null;
  title: string;
  customerStatusLabel: string;
  internalStatus: TicketStatus;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  lastMessageAt: IsoTimestamp | null;
  customerMessageCount: number;
  customerAttachmentCount: number;
  publicArticleCount: number;
  customerOriginLabel: string;
}

export interface CustomerPortalTicketDetail {
  ticketId: Uuid;
  tenantId: Uuid;
  tenantSlug: string;
  tenantDisplayName: string;
  requesterContactId: Uuid | null;
  requesterContactFullName: string | null;
  title: string;
  description: string;
  customerStatusLabel: string;
  internalStatus: TicketStatus;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  resolvedAt: IsoTimestamp | null;
  closedAt: IsoTimestamp | null;
  canAddMessage: boolean;
  canViewAttachments: boolean;
  canViewPublicArticles: boolean;
  customerOriginLabel: string;
}

export interface CustomerPortalTicketCollaborationState {
  ticketId: Uuid;
  tenantId: Uuid;
  internalStatus: TicketStatus;
  customerStatusLabel: string;
  canReply: boolean;
  canAcknowledge: boolean;
  canConfirmResolution: boolean;
  canRequestReopen: boolean;
  latestTimelineEntryId: Uuid | null;
  latestTimelineEntryAt: IsoTimestamp | null;
  lastAcknowledgedAt: IsoTimestamp | null;
  lastAcknowledgedTimelineEntryId: Uuid | null;
  unreadCount: number;
  hasNewUpdates: boolean;
  lastCustomerMessageAt: IsoTimestamp | null;
  lastSupportResponseAt: IsoTimestamp | null;
}

export interface CustomerPortalTicketTimelineItem {
  ticketId: Uuid;
  tenantId: Uuid;
  timelineEntryId: Uuid;
  entryType: TicketTimelineEntryType;
  occurredAt: IsoTimestamp;
  actorLabel: string;
  eventType: TicketEventType | null;
  eventLabel: string | null;
  body: string | null;
  customerEntryLabel: string;
  customerDeliveryLabel: string | null;
}

export interface CustomerPortalTicketAttachment {
  attachmentId: Uuid;
  ticketId: Uuid;
  tenantId: Uuid;
  displayName: string;
  contentType: string | null;
  sizeBytes: number;
  sizeLabel: string;
  uploadedByLabel: string;
  createdAt: IsoTimestamp;
  status: TicketAttachmentStatus;
  canDownload: boolean;
}

export type CustomerPortalKnowledgeSource =
  | 'public'
  | 'customer_portal'
  | 'ticket_linked';

export interface CustomerPortalKnowledgeArticle {
  tenantId: Uuid;
  articleId: Uuid;
  slug: string;
  title: string;
  summary: string | null;
  categoryName: string | null;
  publishedAt: IsoTimestamp | null;
  updatedAt: IsoTimestamp | null;
  relationReason: string | null;
  source: CustomerPortalKnowledgeSource;
  sourceLabel: string;
}

export interface CustomerPortalKnowledgeSearchResult
  extends CustomerPortalKnowledgeArticle {
  matchReason: string | null;
}

export interface CustomerPortalKnowledgeArticleDetail
  extends CustomerPortalKnowledgeArticle {
  bodyMd: string;
}

export interface CustomerPortalTicketKnowledgeLink
  extends CustomerPortalKnowledgeArticle {
  ticketId: Uuid;
}

export interface RpcCustomerCreateTicketPayload {
  tenantId: Uuid;
  title: string;
  description: string;
}
export interface RpcCustomerCreateTicketResponse {
  ticketId: Uuid;
  tenantId: Uuid;
  title: string;
  customerStatusLabel: string;
  createdAt: IsoTimestamp;
}

export interface RpcCustomerAddTicketMessagePayload {
  ticketId: Uuid;
  body: string;
}
export interface RpcCustomerAddTicketMessageResponse {
  messageId: Uuid;
  ticketId: Uuid;
  tenantId: Uuid;
  body: string;
  createdAt: IsoTimestamp;
}

export interface RpcCustomerGetAttachmentDownloadUrlPayload {
  attachmentId: Uuid;
}
export interface RpcCustomerGetAttachmentDownloadUrlResponse {
  attachmentId: Uuid;
  expiresAt: IsoTimestamp;
  downloadUrl: string;
}

export interface RpcCustomerCreateTicketAttachmentUploadPayload {
  ticketId: Uuid;
  tenantId: Uuid;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
}

export interface RpcCustomerCreateTicketAttachmentUploadResponse {
  attachmentId: Uuid;
  uploadIntentId: Uuid;
  ticketId: Uuid;
  tenantId: Uuid;
  displayName: string;
  contentType: string;
  sizeBytes: number;
  maxSizeBytes: number;
  expiresAt: IsoTimestamp;
  uploadUrl: string;
}

export interface RpcCustomerRegisterTicketAttachmentPayload {
  uploadIntentId: Uuid;
}

export type RpcCustomerRegisterTicketAttachmentResponse = CustomerPortalTicketAttachment;

export interface RpcCustomerAcknowledgeTicketUpdatePayload {
  ticketId: Uuid;
  lastTimelineEntryId?: Uuid | null;
}
export interface RpcCustomerAcknowledgeTicketUpdateResponse {
  ticketId: Uuid;
  tenantId: Uuid;
  acknowledgedAt: IsoTimestamp;
  lastTimelineEntryId: Uuid | null;
}

export interface RpcCustomerConfirmTicketResolvedPayload {
  ticketId: Uuid;
}
export interface RpcCustomerConfirmTicketResolvedResponse {
  ticketId: Uuid;
  tenantId: Uuid;
  customerStatusLabel: string;
  status: TicketStatus;
  closedAt: IsoTimestamp | null;
}

export interface RpcCustomerRequestTicketReopenPayload {
  ticketId: Uuid;
  reason: string;
}
export interface RpcCustomerRequestTicketReopenResponse {
  ticketId: Uuid;
  tenantId: Uuid;
  customerStatusLabel: string;
  status: TicketStatus;
  updatedAt: IsoTimestamp;
}

export interface RpcCustomerSearchKnowledgeArticlesPayload {
  tenantId: Uuid;
  searchQuery?: string | null;
  categoryName?: string | null;
  source?: CustomerPortalKnowledgeSource | 'all';
  ticketId?: Uuid | null;
  limit?: number;
  offset?: number;
}

export interface RpcCustomerSetActiveTenantPayload {
  tenantId: Uuid;
}

export type RpcCustomerSetActiveTenantResponse = CustomerPortalActiveTenantContext;

export type RpcCustomerGetPortalSessionStatusResponse = CustomerPortalSessionStatus;
