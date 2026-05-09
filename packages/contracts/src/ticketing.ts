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
  isCustomerSendAllowed: boolean;
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
  isCustomerSendAllowed: boolean;
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

export type CustomerPortalRole = 'customer_user' | 'customer_manager';

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

export interface CustomerPortalKnowledgeArticle {
  ticketId: Uuid;
  tenantId: Uuid;
  articleId: Uuid;
  articleTitle: string;
  articleSlug: string;
  articleSummary: string | null;
  categoryName: string | null;
  publicArticlePath: string;
  sentAt: IsoTimestamp;
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
