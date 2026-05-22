import { toAppError } from '../../app/errors';
import { readRuntimeConfig } from '../../app/runtime-config';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';
import type {
  CustomerIntegrationEnvironment,
  CustomerIntegrationStatus,
  CustomerIntegrationType,
  CustomerOperationalStatus,
  CustomerProductLine,
  EngineeringWorkItemType,
  InternalActionUpdateKind,
  KnowledgeArticleStatus,
  KnowledgeArticleVisibility,
  RpcAddInternalTicketNotePayload,
  RpcAddInternalTicketNoteResponse,
  RpcAddTicketMessagePayload,
  RpcAddTicketMessageResponse,
  RpcAssignTicketPayload,
  RpcAssignTicketResponse,
  RpcCloseTicketPayload,
  RpcCloseTicketResponse,
  RpcCreateTicketPayload,
  RpcCreateTicketResponse,
  RpcInternalActionAddEvidenceLinkPayload,
  RpcInternalActionAddEvidenceLinkResponse,
  RpcSupportAcceptInternalActionReturnPayload,
  RpcSupportAcceptInternalActionReturnResponse,
  RpcSupportCloseInternalActionPayload,
  RpcSupportCloseInternalActionResponse,
  RpcSupportCreateInternalActionPayload,
  RpcSupportCreateInternalActionResponse,
  RpcSupportCreateTicketAttachmentUploadResponse,
  RpcSupportGetTicketAttachmentDownloadUrlResponse,
  RpcSupportRequestInternalActionFollowupPayload,
  RpcSupportRequestInternalActionFollowupResponse,
  RpcSupportRegisterTicketAttachmentResponse,
  RpcSupportUpdateTicketClassificationPayload,
  RpcSupportUpdateTicketClassificationResponse,
  RpcSupportUpdateTicketPrioritySeverityPayload,
  RpcSupportUpdateTicketPrioritySeverityResponse,
  RpcReopenTicketPayload,
  RpcReopenTicketResponse,
  RpcSupportArchiveTicketArticleLinkPayload,
  RpcSupportArchiveTicketArticleLinkResponse,
  RpcSupportCreateEngineeringWorkItemFromTicketPayload,
  RpcSupportCreateEngineeringWorkItemFromTicketResponse,
  RpcSupportLinkTicketArticlePayload,
  RpcSupportLinkTicketArticleResponse,
  RpcSupportLinkTicketToEngineeringWorkItemPayload,
  RpcSupportLinkTicketToEngineeringWorkItemResponse,
  RpcSupportMarkArticleNeedsUpdatePayload,
  RpcSupportMarkArticleNeedsUpdateResponse,
  RpcSupportMarkDocumentationGapPayload,
  RpcSupportMarkDocumentationGapResponse,
  RpcUpdateTicketStatusPayload,
  RpcUpdateTicketStatusResponse,
  SupportAssignableAgent,
  SupportTicketIntakeContact,
  SupportTicketIntakeTenant,
  SupportCustomerAccountAlert,
  SupportCustomerAccountContext,
  SupportCustomerAccountCustomization,
  SupportCustomerAccountFeature,
  SupportCustomerAccountIntegration,
  SupportCustomer360,
  SupportKnowledgeArticlePickerItem,
  SupportInternalActionTargetArea,
  SupportInternalActionDetail,
  SupportInternalActionTimelineEntry,
  SupportCustomerRecentEventsWindow,
  SupportCustomerRecentTicketsWindow,
  SupportTicketAttachment,
  SupportTicketClassificationOption,
  SupportTicketDetail,
  SupportTicketEngineeringLink,
  SupportTicketInternalAction,
  SupportTicketKnowledgeLink,
  SupportTicketQueueItem,
  SupportTicketTimelineItem,
  SupportTicketTimelineRecentWindow,
  TicketPriority,
  TicketSeverity,
  TicketStatus,
  Uuid,
  JsonObject,
} from '../../contracts/support-contracts';

function requireClient() {
  return requireSupabaseBrowserClient();
}

function requireSupabaseFunctionBaseUrl() {
  const config = readRuntimeConfig();

  if (!config.ok) {
    throw new Error('As funções seguras do Supabase não estão disponíveis neste ambiente.');
  }

  return {
    supabaseUrl: config.config.supabaseUrl.replace(/\/$/, ''),
    supabaseAnonKey: config.config.supabaseAnonKey,
  };
}

async function requireActiveSessionToken() {
  const client = requireClient();
  const {
    data: { session },
    error,
  } = await client.auth.getSession();

  if (error) {
    throw new Error('Falha ao recuperar a sessão ativa antes de chamar o backend seguro.');
  }

  if (!session?.access_token) {
    throw new Error('A sessão ativa expirou antes da chamada segura.');
  }

  return session.access_token;
}

async function callSupabaseFunctionJson<T>(
  relativeUrl: string,
  init: RequestInit = {},
): Promise<T> {
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseFunctionBaseUrl();
  const accessToken = await requireActiveSessionToken();
  const response = await fetch(`${supabaseUrl}${relativeUrl}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      ...(init.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; [key: string]: unknown }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error ?? 'Falha ao chamar a função segura vinculada às evidências do ticket.',
    );
  }

  return payload as T;
}

function mapPermissionFlags(row: Record<string, unknown>) {
  return {
    canViewInternal: Boolean(row.can_view_internal),
    canAddMessage: Boolean(row.can_add_message),
    canUpdateStatus: Boolean(row.can_update_status),
    canAddInternalNote: Boolean(row.can_add_internal_note),
    canAssign: Boolean(row.can_assign),
    canClose: Boolean(row.can_close),
    canReopen: Boolean(row.can_reopen),
  };
}

function mapQueueItem(row: Record<string, unknown>): SupportTicketQueueItem {
  return {
    ...mapPermissionFlags(row),
    id: String(row.id),
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: (row.tenant_display_name as string | null) ?? null,
    tenantLegalName: (row.tenant_legal_name as string | null) ?? null,
    requesterContactId: (row.requester_contact_id as string | null) ?? null,
    requesterContactFullName: (row.requester_contact_full_name as string | null) ?? null,
    requesterContactEmail: (row.requester_contact_email as string | null) ?? null,
    title: String(row.title),
    source: row.source as SupportTicketQueueItem['source'],
    status: row.status as SupportTicketQueueItem['status'],
    priority: row.priority as SupportTicketQueueItem['priority'],
    severity: row.severity as SupportTicketQueueItem['severity'],
    categoryId: (row.category_id as string | null) ?? null,
    categorySlug: (row.category_slug as string | null) ?? null,
    categoryName: (row.category_name as string | null) ?? null,
    categoryDescription: (row.category_description as string | null) ?? null,
    currentOperationalReasonId:
      (row.current_operational_reason_id as string | null) ?? null,
    currentOperationalReasonName:
      (row.current_operational_reason_name as string | null) ?? null,
    slaPolicyId: (row.sla_policy_id as string | null) ?? null,
    slaPolicyName: (row.sla_policy_name as string | null) ?? null,
    slaPolicyScope:
      (row.sla_policy_scope as SupportTicketQueueItem['slaPolicyScope'] | null) ?? 'none',
    slaBusinessCalendarName: (row.sla_business_calendar_name as string | null) ?? null,
    slaBusinessCalendarTimezone: (row.sla_business_calendar_timezone as string | null) ?? null,
    firstResponseDueAt: (row.first_response_due_at as string | null) ?? null,
    resolutionDueAt: (row.resolution_due_at as string | null) ?? null,
    slaStatus: row.sla_status as SupportTicketQueueItem['slaStatus'],
    slaStatusLabel: String(row.sla_status_label ?? 'Sem politica definida'),
    isSlaAvailable: Boolean(row.is_sla_available),
    slaReference: String(row.sla_reference ?? 'Governanca interna.'),
    createdByUserId: String(row.created_by_user_id),
    createdByFullName: (row.created_by_full_name as string | null) ?? null,
    assignedToUserId: (row.assigned_to_user_id as string | null) ?? null,
    assignedToFullName: (row.assigned_to_full_name as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    resolvedAt: (row.resolved_at as string | null) ?? null,
    closedAt: (row.closed_at as string | null) ?? null,
    lastMessageAt: (row.last_message_at as string | null) ?? null,
    customerMessageCount: Number(row.customer_message_count ?? 0),
    internalMessageCount: Number(row.internal_message_count ?? 0),
    isUnassigned: Boolean(row.is_unassigned),
    isWaitingCustomer: Boolean(row.is_waiting_customer),
    isWaitingSupport: Boolean(row.is_waiting_support),
    isWaitingEngineering: Boolean(row.is_waiting_engineering),
  };
}

function mapTicketDetail(row: Record<string, unknown>): SupportTicketDetail {
  return {
    ...mapPermissionFlags(row),
    id: String(row.id),
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: (row.tenant_display_name as string | null) ?? null,
    tenantLegalName: (row.tenant_legal_name as string | null) ?? null,
    tenantStatus: String(row.tenant_status),
    requesterContactId: (row.requester_contact_id as string | null) ?? null,
    requesterContactFullName: (row.requester_contact_full_name as string | null) ?? null,
    requesterContactEmail: (row.requester_contact_email as string | null) ?? null,
    title: String(row.title),
    description: String(row.description),
    source: row.source as SupportTicketDetail['source'],
    status: row.status as SupportTicketDetail['status'],
    priority: row.priority as SupportTicketDetail['priority'],
    severity: row.severity as SupportTicketDetail['severity'],
    categoryId: (row.category_id as string | null) ?? null,
    categorySlug: (row.category_slug as string | null) ?? null,
    categoryName: (row.category_name as string | null) ?? null,
    categoryDescription: (row.category_description as string | null) ?? null,
    initialOperationalReasonId:
      (row.initial_operational_reason_id as string | null) ?? null,
    initialOperationalReasonName:
      (row.initial_operational_reason_name as string | null) ?? null,
    currentOperationalReasonId:
      (row.current_operational_reason_id as string | null) ?? null,
    currentOperationalReasonName:
      (row.current_operational_reason_name as string | null) ?? null,
    slaPolicyId: (row.sla_policy_id as string | null) ?? null,
    slaPolicyName: (row.sla_policy_name as string | null) ?? null,
    slaPolicyScope:
      (row.sla_policy_scope as SupportTicketDetail['slaPolicyScope'] | null) ?? 'none',
    slaBusinessCalendarKey: (row.sla_business_calendar_key as string | null) ?? null,
    slaBusinessCalendarName: (row.sla_business_calendar_name as string | null) ?? null,
    slaBusinessCalendarTimezone: (row.sla_business_calendar_timezone as string | null) ?? null,
    firstResponseDueAt: (row.first_response_due_at as string | null) ?? null,
    resolutionDueAt: (row.resolution_due_at as string | null) ?? null,
    slaStatus: row.sla_status as SupportTicketDetail['slaStatus'],
    slaStatusLabel: String(row.sla_status_label ?? 'Sem politica definida'),
    isSlaAvailable: Boolean(row.is_sla_available),
    slaReference: String(row.sla_reference ?? 'Governanca interna.'),
    allowedNextStatuses: Array.isArray(row.allowed_next_statuses)
      ? (row.allowed_next_statuses as SupportTicketDetail['allowedNextStatuses'])
      : [],
    closeReason: (row.close_reason as string | null) ?? null,
    createdByUserId: String(row.created_by_user_id),
    createdByFullName: (row.created_by_full_name as string | null) ?? null,
    assignedToUserId: (row.assigned_to_user_id as string | null) ?? null,
    assignedToFullName: (row.assigned_to_full_name as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    resolvedAt: (row.resolved_at as string | null) ?? null,
    closedAt: (row.closed_at as string | null) ?? null,
    lastMessageAt: (row.last_message_at as string | null) ?? null,
    customerMessageCount: Number(row.customer_message_count ?? 0),
    internalMessageCount: Number(row.internal_message_count ?? 0),
    customerAttachmentCount: Number(row.customer_attachment_count ?? 0),
    internalAttachmentCount: Number(row.internal_attachment_count ?? 0),
  };
}

function mapTimelineItem(row: Record<string, unknown>): SupportTicketTimelineItem {
  const base = {
    ticketId: String(row.ticket_id),
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: (row.tenant_display_name as string | null) ?? null,
    timelineEntryId: String(row.timeline_entry_id),
    entryType: row.entry_type as SupportTicketTimelineItem['entryType'],
    visibility: row.visibility as SupportTicketTimelineItem['visibility'],
    occurredAt: String(row.occurred_at),
    actorUserId: (row.actor_user_id as string | null) ?? null,
    actorFullName: (row.actor_full_name as string | null) ?? null,
    actorEmail: (row.actor_email as string | null) ?? null,
    messageId: (row.message_id as string | null) ?? null,
    eventId: (row.event_id as string | null) ?? null,
    eventType: (row.event_type as SupportTicketTimelineItem['eventType']) ?? null,
    assignmentId: (row.assignment_id as string | null) ?? null,
    body: (row.body as string | null) ?? null,
    metadata:
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as JsonObject)
        : ({} as JsonObject),
  };

  return base as SupportTicketTimelineItem;
}

function mapCustomerContact(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    email: String(row.email),
    isPrimary: Boolean(row.is_primary),
    linkedUserId: (row.linked_user_id as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

function mapRecentTicket(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: String(row.title),
    status: row.status as SupportCustomer360['recentTickets'][number]['status'],
    priority: row.priority as SupportCustomer360['recentTickets'][number]['priority'],
    severity: row.severity as SupportCustomer360['recentTickets'][number]['severity'],
    assignedToUserId: (row.assigned_to_user_id as string | null) ?? null,
    assignedToFullName: (row.assigned_to_full_name as string | null) ?? null,
    updatedAt: String(row.updated_at),
  };
}

function mapRecentEvent(row: Record<string, unknown>) {
  return {
    ticketId: String(row.ticket_id),
    ticketTitle: String(row.ticket_title),
    eventType: row.event_type as SupportCustomer360['recentEvents'][number]['eventType'],
    visibility: row.visibility as SupportCustomer360['recentEvents'][number]['visibility'],
    occurredAt: String(row.occurred_at),
    actorUserId: (row.actor_user_id as string | null) ?? null,
  };
}

function mapCustomer360(row: Record<string, unknown>): SupportCustomer360 {
  const activeContacts = Array.isArray(row.active_contacts)
    ? row.active_contacts.map((item) => mapCustomerContact(item as Record<string, unknown>))
    : [];
  const recentTickets = Array.isArray(row.recent_tickets)
    ? row.recent_tickets.map((item) => mapRecentTicket(item as Record<string, unknown>))
    : [];
  const recentEvents = Array.isArray(row.recent_events)
    ? row.recent_events.map((item) => mapRecentEvent(item as Record<string, unknown>))
    : [];

  return {
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: (row.tenant_display_name as string | null) ?? null,
    tenantLegalName: (row.tenant_legal_name as string | null) ?? null,
    tenantStatus: String(row.tenant_status),
    tenantCreatedAt: String(row.tenant_created_at),
    tenantUpdatedAt: String(row.tenant_updated_at),
    activeContactsCount: Number(row.active_contacts_count ?? 0),
    totalTicketCount: Number(row.total_ticket_count ?? 0),
    openTicketCount: Number(row.open_ticket_count ?? 0),
    ticketStatusCounts:
      row.ticket_status_counts && typeof row.ticket_status_counts === 'object'
        ? (row.ticket_status_counts as JsonObject)
        : ({} as JsonObject),
    activeContacts,
    recentTickets,
    recentEvents,
  };
}

function mapAssignableAgent(row: Record<string, unknown>): SupportAssignableAgent {
  return {
    userId: String(row.user_id),
    fullName: String(row.full_name),
    email: String(row.email),
    tenantId: String(row.tenant_id),
    tenantName: String(row.tenant_name),
    role: row.role as SupportAssignableAgent['role'],
    membershipStatus: row.membership_status as SupportAssignableAgent['membershipStatus'],
    isActive: Boolean(row.is_active),
  };
}

function mapCustomerAccountIntegration(
  row: Record<string, unknown>,
): SupportCustomerAccountIntegration {
  return {
    id: String(row.id),
    integrationType: row.integration_type as CustomerIntegrationType,
    provider: String(row.provider),
    status: row.status as CustomerIntegrationStatus,
    environment: row.environment as CustomerIntegrationEnvironment,
    notes: (row.notes as string | null) ?? null,
  };
}

function mapCustomerAccountFeature(
  row: Record<string, unknown>,
): SupportCustomerAccountFeature {
  return {
    featureKey: String(row.feature_key),
    enabled: Boolean(row.enabled),
    source: String(row.source),
    notes: (row.notes as string | null) ?? null,
  };
}

function mapCustomerAccountCustomization(
  row: Record<string, unknown>,
): SupportCustomerAccountCustomization {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    riskLevel: row.risk_level as SupportCustomerAccountCustomization['riskLevel'],
    operationalNote: (row.operational_note as string | null) ?? null,
    status: String(row.status),
  };
}

function mapCustomerAccountAlert(row: Record<string, unknown>): SupportCustomerAccountAlert {
  return {
    id: String(row.id),
    severity: row.severity as SupportCustomerAccountAlert['severity'],
    title: String(row.title),
    description: String(row.description),
    expiresAt: (row.expires_at as string | null) ?? null,
  };
}

function mapCustomerAccountContext(
  row: Record<string, unknown>,
): SupportCustomerAccountContext {
  const activeContacts = Array.isArray(row.active_contacts)
    ? row.active_contacts.map((item) => mapCustomerContact(item as Record<string, unknown>))
    : [];
  const integrations = Array.isArray(row.integrations)
    ? row.integrations.map((item) =>
        mapCustomerAccountIntegration(item as Record<string, unknown>),
      )
    : [];
  const enabledFeatures = Array.isArray(row.enabled_features)
    ? row.enabled_features.map((item) =>
        mapCustomerAccountFeature(item as Record<string, unknown>),
      )
    : [];
  const activeCustomizations = Array.isArray(row.active_customizations)
    ? row.active_customizations.map((item) =>
        mapCustomerAccountCustomization(item as Record<string, unknown>),
      )
    : [];
  const activeAlerts = Array.isArray(row.active_alerts)
    ? row.active_alerts.map((item) =>
        mapCustomerAccountAlert(item as Record<string, unknown>),
      )
    : [];

  return {
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: (row.tenant_display_name as string | null) ?? null,
    tenantLegalName: (row.tenant_legal_name as string | null) ?? null,
    tenantStatus: String(row.tenant_status),
    profileId: (row.profile_id as string | null) ?? null,
    productLine: (row.product_line as CustomerProductLine | null) ?? null,
    operationalStatus:
      (row.operational_status as CustomerOperationalStatus | null) ?? null,
    accountTier: (row.account_tier as string | null) ?? null,
    internalNotes: (row.internal_notes as string | null) ?? null,
    operationalFlags:
      row.operational_flags && typeof row.operational_flags === 'object'
        ? (row.operational_flags as JsonObject)
        : ({} as JsonObject),
    activeContactsCount: Number(row.active_contacts_count ?? 0),
    totalTicketCount: Number(row.total_ticket_count ?? 0),
    openTicketCount: Number(row.open_ticket_count ?? 0),
    ticketStatusCounts:
      row.ticket_status_counts && typeof row.ticket_status_counts === 'object'
        ? (row.ticket_status_counts as JsonObject)
        : ({} as JsonObject),
    activeContacts,
    integrations,
    enabledFeatures,
    activeCustomizations,
    activeAlerts,
  };
}

function mapTicketKnowledgeLink(row: Record<string, unknown>): SupportTicketKnowledgeLink {
  return {
    ticketKnowledgeLinkId: String(row.ticket_knowledge_link_id),
    ticketId: String(row.ticket_id),
    linkType: row.link_type as SupportTicketKnowledgeLink['linkType'],
    note: (row.note as string | null) ?? null,
    createdAt: String(row.created_at),
    createdByUserId: String(row.created_by_user_id),
    createdByFullName: (row.created_by_full_name as string | null) ?? null,
    articleId: (row.article_id as string | null) ?? null,
    articleTitle: (row.article_title as string | null) ?? null,
    articleSlug: (row.article_slug as string | null) ?? null,
    articleVisibility:
      (row.article_visibility as KnowledgeArticleVisibility | null) ?? null,
    articleStatus: (row.article_status as KnowledgeArticleStatus | null) ?? null,
    publicArticlePath: (row.public_article_path as string | null) ?? null,
    isCustomerSendAllowed: Boolean(row.is_customer_send_allowed),
  };
}

function mapKnowledgeArticlePickerItem(
  row: Record<string, unknown>,
): SupportKnowledgeArticlePickerItem {
  return {
    ticketId: String(row.ticket_id),
    articleId: String(row.article_id),
    articleTitle: String(row.article_title),
    articleSlug: String(row.article_slug),
    articleSummary: (row.article_summary as string | null) ?? null,
    categoryName: (row.category_name as string | null) ?? null,
    articleVisibility: row.article_visibility as KnowledgeArticleVisibility,
    articleStatus: row.article_status as KnowledgeArticleStatus,
    publicArticlePath: (row.public_article_path as string | null) ?? null,
    isCustomerSendAllowed: Boolean(row.is_customer_send_allowed),
  };
}

function mapRecentWindowMeta(row: Record<string, unknown> | null | undefined) {
  return {
    totalAvailableCount: Number(row?.total_available_count ?? 0),
    recentLimit: Number(row?.recent_limit ?? 0),
    hasMore: Boolean(row?.has_more),
  };
}

interface ListSupportTicketsQueueOptions {
  status?: TicketStatus | 'all';
  priority?: TicketPriority | 'all';
  severity?: TicketSeverity | 'all';
  tenantId?: Uuid | 'all';
  assignedToUserId?: Uuid | 'all' | 'unassigned';
  categoryId?: Uuid | 'all';
}

export async function listSupportTicketsQueue(
  options: ListSupportTicketsQueueOptions = {},
) {
  const client = requireClient();
  let query = client
    .from('vw_support_tickets_queue')
    .select('*')
    .order('updated_at', { ascending: false });

  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options.priority && options.priority !== 'all') {
    query = query.eq('priority', options.priority);
  }

  if (options.severity && options.severity !== 'all') {
    query = query.eq('severity', options.severity);
  }

  if (options.tenantId && options.tenantId !== 'all') {
    query = query.eq('tenant_id', options.tenantId);
  }

  if (options.assignedToUserId === 'unassigned') {
    query = query.is('assigned_to_user_id', null);
  } else if (options.assignedToUserId && options.assignedToUserId !== 'all') {
    query = query.eq('assigned_to_user_id', options.assignedToUserId);
  }

  if (options.categoryId && options.categoryId !== 'all') {
    query = query.eq('category_id', options.categoryId);
  }

  const { data, error } = await query;

  if (error) {
    throw toAppError(error, 'Falha ao carregar a fila oficial do Support Workspace.');
  }

  return (data ?? []).map((row) => mapQueueItem(row as Record<string, unknown>));
}

export async function getSupportTicketDetail(ticketId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_ticket_detail')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o detalhe do ticket.');
  }

  return data ? mapTicketDetail(data as Record<string, unknown>) : null;
}

export async function getSupportTicketTimelineRecent(
  ticketId: Uuid,
): Promise<SupportTicketTimelineRecentWindow> {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_ticket_timeline_recent')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('occurred_at', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar a timeline do ticket.');
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return {
    ...mapRecentWindowMeta(rows[0]),
    entries: rows.map((row) => mapTimelineItem(row)),
  };
}

function mapSupportTicketAttachment(
  row: Record<string, unknown>,
): SupportTicketAttachment {
  return {
    attachmentId: String(row.attachment_id),
    ticketId: String(row.ticket_id),
    displayName: String(row.display_name),
    contentType: (row.content_type as string | null) ?? null,
    sizeBytes: Number(row.size_bytes ?? 0),
    uploadedByName: (row.uploaded_by_name as string | null) ?? null,
    createdAt: String(row.created_at),
    status: row.status as SupportTicketAttachment['status'],
    canDownload: Boolean(row.can_download),
    canArchive: Boolean(row.can_archive),
  };
}

function mapTicketAttachmentUploadContractRow(
  row: Record<string, unknown>,
): RpcSupportCreateTicketAttachmentUploadResponse {
  return {
    attachmentId: String(row.attachment_id),
    uploadIntentId: String(row.upload_intent_id),
    ticketId: String(row.ticket_id),
    tenantId: String(row.tenant_id),
    displayName: String(row.display_name),
    contentType: String(row.content_type),
    sizeBytes: Number(row.size_bytes ?? 0),
    maxSizeBytes: Number(row.max_size_bytes ?? 0),
    expiresAt: String(row.expires_at),
    uploadUrl: String(row.upload_url),
  };
}

function mapTicketAttachmentDownloadContractRow(
  row: Record<string, unknown>,
): RpcSupportGetTicketAttachmentDownloadUrlResponse {
  return {
    attachmentId: String(row.attachment_id),
    expiresAt: String(row.expires_at),
    downloadUrl: String(row.download_url),
  };
}

function mapSupportTicketEngineeringLink(
  row: Record<string, unknown>,
): SupportTicketEngineeringLink {
  return {
    engineeringTicketLinkId: String(row.engineering_ticket_link_id),
    ticketId: String(row.ticket_id),
    tenantId: String(row.tenant_id),
    handoffNote: (row.handoff_note as string | null) ?? null,
    createdByUserId: String(row.created_by_user_id),
    createdByFullName: (row.created_by_full_name as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    engineeringWorkItemId: String(row.engineering_work_item_id),
    workItemType: row.work_item_type as EngineeringWorkItemType,
    workItemStatus: row.work_item_status as SupportTicketEngineeringLink['workItemStatus'],
    workItemPriority: row.work_item_priority as SupportTicketEngineeringLink['workItemPriority'],
    workItemTitle: String(row.work_item_title),
    workItemDescription: String(row.work_item_description),
    assignedToUserId: (row.assigned_to_user_id as string | null) ?? null,
    assignedToFullName: (row.assigned_to_full_name as string | null) ?? null,
    workItemCreatedAt: String(row.work_item_created_at),
    workItemUpdatedAt: String(row.work_item_updated_at),
    lastUpdateKind:
      (row.last_update_kind as SupportTicketEngineeringLink['lastUpdateKind']) ?? null,
    lastUpdateSummary: (row.last_update_summary as string | null) ?? null,
    lastUpdateNextStep: (row.last_update_next_step as string | null) ?? null,
    lastUpdateAt: (row.last_update_at as string | null) ?? null,
  };
}

function mapSupportTicketInternalAction(
  row: Record<string, unknown>,
): SupportTicketInternalAction {
  return {
    internalActionId: String(row.internal_action_id),
    ticketId: String(row.ticket_id),
    tenantId: String(row.tenant_id),
    targetArea: String(row.target_area),
    targetAreaLabel: String(row.target_area_label),
    supportType: row.support_type as SupportTicketInternalAction['supportType'],
    priority: row.priority as SupportTicketInternalAction['priority'],
    status: row.status as SupportTicketInternalAction['status'],
    summary: String(row.summary),
    assignedAreaUserId: (row.assigned_area_user_id as string | null) ?? null,
    assignedAreaUserName: (row.assigned_area_user_name as string | null) ?? null,
    requestedByUserId: String(row.requested_by_user_id),
    requestedByUserName: (row.requested_by_user_name as string | null) ?? null,
    lastUpdateKind: (row.last_update_kind as InternalActionUpdateKind | null) ?? null,
    lastUpdateSummary: (row.last_update_summary as string | null) ?? null,
    lastUpdateAt: (row.last_update_at as string | null) ?? null,
    hasPendingReturn: Boolean(row.has_pending_return),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapSupportInternalActionTargetArea(
  row: Record<string, unknown>,
): SupportInternalActionTargetArea {
  return {
    areaKey: String(row.area_key),
    displayName: String(row.display_name),
    status: row.status as SupportInternalActionTargetArea['status'],
    allowsSpecializedBridge: Boolean(row.allows_specialized_bridge),
    canCreateAction: Boolean(row.can_create_action),
    unavailableReason: (row.unavailable_reason as string | null) ?? null,
  };
}

function mapSupportInternalActionDetail(
  row: Record<string, unknown>,
): SupportInternalActionDetail {
  return {
    internalActionId: String(row.internal_action_id),
    ticketId: String(row.ticket_id),
    ticketTitle: String(row.ticket_title),
    ticketStatus: row.ticket_status as SupportInternalActionDetail['ticketStatus'],
    ticketPriority: row.ticket_priority as SupportInternalActionDetail['ticketPriority'],
    ticketSeverity: row.ticket_severity as SupportInternalActionDetail['ticketSeverity'],
    tenantId: String(row.tenant_id),
    targetArea: String(row.target_area),
    targetAreaLabel: String(row.target_area_label),
    supportType: row.support_type as SupportInternalActionDetail['supportType'],
    priority: row.priority as SupportInternalActionDetail['priority'],
    status: row.status as SupportInternalActionDetail['status'],
    summary: String(row.summary),
    context: String(row.context),
    requestedByUserId: String(row.requested_by_user_id),
    requestedByUserName: (row.requested_by_user_name as string | null) ?? null,
    assignedAreaUserId: (row.assigned_area_user_id as string | null) ?? null,
    assignedAreaUserName: (row.assigned_area_user_name as string | null) ?? null,
    returnedToSupportAt: (row.returned_to_support_at as string | null) ?? null,
    closedAt: (row.closed_at as string | null) ?? null,
    cancelledAt: (row.cancelled_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    updatedByUserId: (row.updated_by_user_id as string | null) ?? null,
    updatedByUserName: (row.updated_by_user_name as string | null) ?? null,
    lastUpdateId: (row.last_update_id as string | null) ?? null,
    lastUpdateKind: (row.last_update_kind as InternalActionUpdateKind | null) ?? null,
    lastUpdateSummary: (row.last_update_summary as string | null) ?? null,
    lastUpdateAt: (row.last_update_at as string | null) ?? null,
    lastUpdateByUserId: (row.last_update_by_user_id as string | null) ?? null,
    lastUpdateByUserName: (row.last_update_by_user_name as string | null) ?? null,
    linkedEvidenceCount: Number(row.linked_evidence_count ?? 0),
    hasPendingReturn: Boolean(row.has_pending_return),
  };
}

function mapSupportInternalActionTimelineEntry(
  row: Record<string, unknown>,
): SupportInternalActionTimelineEntry {
  return {
    internalActionUpdateId: String(row.internal_action_update_id),
    internalActionId: String(row.internal_action_id),
    ticketId: String(row.ticket_id),
    tenantId: String(row.tenant_id),
    targetArea: String(row.target_area),
    targetAreaLabel: String(row.target_area_label),
    updateKind: row.update_kind as SupportInternalActionTimelineEntry['updateKind'],
    statusBefore:
      (row.status_before as SupportInternalActionTimelineEntry['statusBefore']) ?? null,
    statusAfter:
      (row.status_after as SupportInternalActionTimelineEntry['statusAfter']) ?? null,
    body: String(row.body ?? ''),
    metadata: (row.metadata as JsonObject | null) ?? {},
    createdByUserId: String(row.created_by_user_id),
    createdByUserName: (row.created_by_user_name as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

function mapSupportTicketIntakeTenant(
  row: Record<string, unknown>,
): SupportTicketIntakeTenant {
  return {
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: (row.tenant_display_name as string | null) ?? null,
    tenantLegalName: (row.tenant_legal_name as string | null) ?? null,
    tenantStatus: String(row.tenant_status),
    tenantCreatedAt: String(row.tenant_created_at),
    tenantUpdatedAt: String(row.tenant_updated_at),
    activeContactsCount: Number(row.active_contacts_count ?? 0),
    hasActiveContacts: Boolean(row.has_active_contacts),
  };
}

function mapSupportTicketIntakeContact(
  row: Record<string, unknown>,
): SupportTicketIntakeContact {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    linkedUserId: (row.linked_user_id as string | null) ?? null,
    fullName: String(row.full_name),
    email: String(row.email),
    phone: (row.phone as string | null) ?? null,
    jobTitle: (row.job_title as string | null) ?? null,
    isPrimary: Boolean(row.is_primary),
    createdAt: String(row.created_at),
  };
}

function mapSupportTicketClassificationOption(
  row: Record<string, unknown>,
): SupportTicketClassificationOption {
  return {
    optionKind: row.option_kind as SupportTicketClassificationOption['optionKind'],
    optionId: String(row.option_id),
    slug: String(row.slug),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    reasonType:
      (row.reason_type as SupportTicketClassificationOption['reasonType']) ?? null,
    appliesToStatus:
      (row.applies_to_status as SupportTicketClassificationOption['appliesToStatus']) ??
      null,
    status: row.status as SupportTicketClassificationOption['status'],
    sortOrder: Number(row.sort_order ?? 0),
  };
}

interface GetSupportTicketTimelinePageOptions {
  limit?: number;
  beforeOccurredAt?: string | null;
  beforeTimelineEntryId?: Uuid | null;
}

export async function getSupportTicketTimelinePage(
  ticketId: Uuid,
  options: GetSupportTicketTimelinePageOptions = {},
): Promise<SupportTicketTimelineRecentWindow> {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_support_get_ticket_timeline', {
    p_ticket_id: ticketId,
    p_limit: options.limit ?? 50,
    p_before_occurred_at: options.beforeOccurredAt ?? null,
    p_before_timeline_entry_id: options.beforeTimelineEntryId ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao carregar a pagina da timeline do ticket.');
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return {
    totalAvailableCount: Number(rows[0]?.total_available_count ?? 0),
    recentLimit: Number(rows[0]?.page_limit ?? options.limit ?? 50),
    hasMore: Boolean(rows[0]?.has_more),
    entries: rows.map((row) => mapTimelineItem(row)),
  };
}

export async function listSupportCustomers360() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_customer_360')
    .select(
      'tenant_id, tenant_slug, tenant_display_name, tenant_legal_name, tenant_status, tenant_created_at, tenant_updated_at, active_contacts_count, total_ticket_count, open_ticket_count, ticket_status_counts',
    )
    .order('tenant_display_name', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar a visao 360 dos clientes.');
  }

  return (data ?? []).map((row) => mapCustomer360(row as Record<string, unknown>));
}

export async function getSupportCustomer360(tenantId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_customer_360')
    .select(
      'tenant_id, tenant_slug, tenant_display_name, tenant_legal_name, tenant_status, tenant_created_at, tenant_updated_at, active_contacts_count, total_ticket_count, open_ticket_count, ticket_status_counts, active_contacts',
    )
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o customer 360 do tenant.');
  }

  return data ? mapCustomer360(data as Record<string, unknown>) : null;
}

export async function getSupportCustomerAccountContext(tenantId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_customer_account_context')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o contexto operacional enriquecido do cliente.');
  }

  return data ? mapCustomerAccountContext(data as Record<string, unknown>) : null;
}

export async function getSupportCustomerRecentTickets(
  tenantId: Uuid,
): Promise<SupportCustomerRecentTicketsWindow> {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_customer_recent_tickets')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os tickets recentes do cliente.');
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return {
    ...mapRecentWindowMeta(rows[0]),
    tickets: rows.map((row) => mapRecentTicket(row)),
  };
}

export async function getSupportCustomerRecentEvents(
  tenantId: Uuid,
): Promise<SupportCustomerRecentEventsWindow> {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_customer_recent_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('occurred_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os eventos recentes do cliente.');
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return {
    ...mapRecentWindowMeta(rows[0]),
    events: rows.map((row) => mapRecentEvent(row)),
  };
}

export async function listSupportAssignableAgents(tenantId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_assignable_agents')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('role', { ascending: true })
    .order('full_name', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os agentes atribuiveis do tenant.');
  }

  return (data ?? []).map((row) => mapAssignableAgent(row as Record<string, unknown>));
}

export async function listSupportTicketIntakeTenants() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_ticket_intake_tenants')
    .select('*')
    .order('tenant_display_name', { ascending: true, nullsFirst: false })
    .order('tenant_legal_name', { ascending: true, nullsFirst: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os clientes elegíveis para abrir ticket.');
  }

  return (data ?? []).map((row) =>
    mapSupportTicketIntakeTenant(row as Record<string, unknown>),
  );
}

export async function listSupportTicketIntakeContacts(tenantId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_ticket_intake_contacts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('is_primary', { ascending: false })
    .order('full_name', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os contatos elegíveis para abrir ticket.');
  }

  return (data ?? []).map((row) =>
    mapSupportTicketIntakeContact(row as Record<string, unknown>),
  );
}

export async function listSupportTicketClassificationOptions() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_ticket_classification_options')
    .select('*')
    .order('option_kind', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar categorias e motivos operacionais.');
  }

  return (data ?? []).map((row) =>
    mapSupportTicketClassificationOption(row as Record<string, unknown>),
  );
}

export async function getSupportTicketKnowledgeLinks(ticketId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_ticket_knowledge_links')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar o conhecimento relacionado deste ticket.');
  }

  return (data ?? []).map((row) => mapTicketKnowledgeLink(row as Record<string, unknown>));
}

export async function listSupportTicketAttachments(ticketId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_ticket_attachments')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar as evidências vinculadas a este ticket.');
  }

  return (data ?? []).map((row) =>
    mapSupportTicketAttachment(row as Record<string, unknown>),
  );
}

export async function uploadSupportTicketAttachment(input: {
  ticketId: Uuid;
  tenantId: Uuid;
  file: File;
}): Promise<RpcSupportRegisterTicketAttachmentResponse> {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_support_create_ticket_attachment_upload', {
    p_ticket_id: input.ticketId,
    p_tenant_id: input.tenantId,
    p_original_filename: input.file.name,
    p_content_type: input.file.type,
    p_size_bytes: input.file.size,
  });

  if (error) {
    throw toAppError(error, 'Falha ao preparar o upload seguro da evidência.');
  }

  const contractRow = Array.isArray(data) ? data[0] : data;

  if (!contractRow) {
    throw new Error('O backend não retornou a intenção de upload esperada.');
  }

  const uploadContract = mapTicketAttachmentUploadContractRow(
    contractRow as Record<string, unknown>,
  );
  const formData = new FormData();
  formData.append('file', input.file);

  const payload = await callSupabaseFunctionJson<{
    attachment?: Record<string, unknown>;
  }>(uploadContract.uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!payload.attachment) {
    throw new Error('A função segura não devolveu o anexo registrado.');
  }

  return mapSupportTicketAttachment(payload.attachment);
}

export async function getSupportTicketAttachmentSignedUrl(
  attachmentId: Uuid,
): Promise<{ attachmentId: Uuid; signedUrl: string; expiresAt: string }> {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_support_get_ticket_attachment_download_url', {
    p_attachment_id: attachmentId,
  });

  if (error) {
    throw toAppError(error, 'Falha ao preparar o download seguro da evidência.');
  }

  const contractRow = Array.isArray(data) ? data[0] : data;

  if (!contractRow) {
    throw new Error('O backend não retornou a URL temporária esperada para download.');
  }

  const downloadContract = mapTicketAttachmentDownloadContractRow(
    contractRow as Record<string, unknown>,
  );

  return await callSupabaseFunctionJson<{
    attachmentId: Uuid;
    signedUrl: string;
    expiresAt: string;
  }>(downloadContract.downloadUrl, {
    method: 'GET',
  });
}

export async function listSupportTicketEngineeringLinks(ticketId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_ticket_engineering_links')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os handoffs técnicos deste ticket.');
  }

  return (data ?? []).map((row) =>
    mapSupportTicketEngineeringLink(row as Record<string, unknown>),
  );
}

export async function listSupportTicketInternalActions(ticketId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_ticket_internal_actions')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os acionamentos internos deste ticket.');
  }

  return (data ?? []).map((row) =>
    mapSupportTicketInternalAction(row as Record<string, unknown>),
  );
}

export async function listSupportInternalActionTargetAreas(
  ticketId: Uuid,
): Promise<SupportInternalActionTargetArea[]> {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_support_list_internal_action_target_areas',
    {
      p_ticket_id: ticketId,
    },
  );

  if (error) {
    throw toAppError(error, 'Falha ao carregar as áreas internas disponíveis.');
  }

  return ((data ?? []) as Record<string, unknown>[]).map((row) =>
    mapSupportInternalActionTargetArea(row as Record<string, unknown>),
  );
}

export async function getSupportInternalActionDetail(internalActionId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_internal_action_detail')
    .select('*')
    .eq('internal_action_id', internalActionId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o detalhe do acionamento interno.');
  }

  return data
    ? mapSupportInternalActionDetail(data as Record<string, unknown>)
    : null;
}

export async function listSupportInternalActionTimeline(internalActionId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_internal_action_timeline')
    .select('*')
    .eq('internal_action_id', internalActionId)
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar o histórico interno deste acionamento.');
  }

  return (data ?? []).map((row) =>
    mapSupportInternalActionTimelineEntry(row as Record<string, unknown>),
  );
}

export async function listSupportKnowledgeArticlePicker(ticketId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_support_knowledge_article_picker')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('is_customer_send_allowed', { ascending: false })
    .order('article_title', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os artigos disponiveis para este ticket.');
  }

  return (data ?? []).map((row) =>
    mapKnowledgeArticlePickerItem(row as Record<string, unknown>),
  );
}

export async function createTicket(payload: RpcCreateTicketPayload) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_create_ticket', {
    p_tenant_id: payload.tenantId,
    p_title: payload.title,
    p_description: payload.description,
    p_source: payload.source,
    p_priority: payload.priority,
    p_severity: payload.severity,
    p_requester_contact_id: payload.requesterContactId ?? null,
    p_category_id: payload.categoryId ?? null,
    p_operational_reason_id: payload.operationalReasonId ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao criar ticket.');
  }

  return data as RpcCreateTicketResponse;
}

export async function updateTicketStatus(payload: RpcUpdateTicketStatusPayload) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_support_update_ticket_status_v2', {
    p_ticket_id: payload.ticketId,
    p_status: payload.status,
    p_operational_reason_id: payload.operationalReasonId ?? null,
    p_note: payload.note ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao alterar o status do ticket.');
  }

  return data as RpcUpdateTicketStatusResponse;
}

export async function recalculateSupportTicketSla(ticketId: Uuid) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_support_recalculate_ticket_sla', {
    p_ticket_id: ticketId,
  });

  if (error) {
    throw toAppError(error, 'Falha ao recalcular o SLA interno do ticket.');
  }

  return data;
}

export async function updateTicketClassification(
  payload: RpcSupportUpdateTicketClassificationPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_support_update_ticket_classification', {
    p_ticket_id: payload.ticketId,
    p_category_id: payload.categoryId,
    p_operational_reason_id: payload.operationalReasonId ?? null,
    p_note: payload.note ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao atualizar a classificacao operacional do ticket.');
  }

  return data as RpcSupportUpdateTicketClassificationResponse;
}

export async function updateTicketPrioritySeverity(
  payload: RpcSupportUpdateTicketPrioritySeverityPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_support_update_ticket_priority_severity', {
    p_ticket_id: payload.ticketId,
    p_priority: payload.priority,
    p_severity: payload.severity,
    p_operational_reason_id: payload.operationalReasonId ?? null,
    p_note: payload.note ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao atualizar prioridade e severidade do ticket.');
  }

  return data as RpcSupportUpdateTicketPrioritySeverityResponse;
}

export async function assignTicket(payload: RpcAssignTicketPayload) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_assign_ticket', {
    p_ticket_id: payload.ticketId,
    p_assigned_to_user_id: payload.assignedToUserId ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao atualizar o responsavel do ticket.');
  }

  return data as RpcAssignTicketResponse;
}

export async function addTicketMessage(payload: RpcAddTicketMessagePayload) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_add_ticket_message', {
    p_ticket_id: payload.ticketId,
    p_body: payload.body,
  });

  if (error) {
    throw toAppError(error, 'Falha ao adicionar a resposta publica do ticket.');
  }

  return data as RpcAddTicketMessageResponse;
}

export async function addInternalTicketNote(
  payload: RpcAddInternalTicketNotePayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_add_internal_ticket_note', {
    p_ticket_id: payload.ticketId,
    p_body: payload.body,
  });

  if (error) {
    throw toAppError(error, 'Falha ao adicionar a nota interna do ticket.');
  }

  return data as RpcAddInternalTicketNoteResponse;
}

export async function closeTicket(payload: RpcCloseTicketPayload) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_close_ticket', {
    p_ticket_id: payload.ticketId,
    p_close_reason: payload.closeReason,
  });

  if (error) {
    throw toAppError(error, 'Falha ao fechar o ticket.');
  }

  return data as RpcCloseTicketResponse;
}

export async function reopenTicket(payload: RpcReopenTicketPayload) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_reopen_ticket', {
    p_ticket_id: payload.ticketId,
    p_reopen_reason: payload.reopenReason ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao reabrir o ticket.');
  }

  return data as RpcReopenTicketResponse;
}

export async function linkSupportTicketArticle(
  payload: RpcSupportLinkTicketArticlePayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_support_link_ticket_article', {
    p_ticket_id: payload.ticketId,
    p_article_id: payload.articleId ?? null,
    p_link_type: payload.linkType ?? 'reference_internal',
    p_note: payload.note ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao relacionar o artigo a este ticket.');
  }

  return data as RpcSupportLinkTicketArticleResponse;
}

export async function archiveSupportTicketArticleLink(
  payload: RpcSupportArchiveTicketArticleLinkPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_support_archive_ticket_article_link', {
    p_ticket_knowledge_link_id: payload.ticketKnowledgeLinkId,
  });

  if (error) {
    throw toAppError(error, 'Falha ao arquivar este vinculo de conhecimento.');
  }

  return data as RpcSupportArchiveTicketArticleLinkResponse;
}

export async function markSupportDocumentationGap(
  payload: RpcSupportMarkDocumentationGapPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_support_mark_documentation_gap', {
    p_ticket_id: payload.ticketId,
    p_note: payload.note ?? null,
    p_article_id: payload.articleId ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao registrar a lacuna de documentacao.');
  }

  return data as RpcSupportMarkDocumentationGapResponse;
}

export async function markSupportArticleNeedsUpdate(
  payload: RpcSupportMarkArticleNeedsUpdatePayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_support_mark_article_needs_update', {
    p_ticket_id: payload.ticketId,
    p_article_id: payload.articleId,
    p_note: payload.note ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao marcar que este artigo precisa de revisao.');
  }

  return data as RpcSupportMarkArticleNeedsUpdateResponse;
}

export async function createSupportEngineeringWorkItemFromTicket(
  payload: RpcSupportCreateEngineeringWorkItemFromTicketPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_support_create_engineering_work_item_from_ticket',
    {
      p_ticket_id: payload.ticketId,
      p_work_item_type: payload.workItemType,
      p_title: payload.title,
      p_description: payload.description,
      p_handoff_note: payload.handoffNote ?? null,
    },
  );

  if (error) {
    throw toAppError(error, 'Falha ao criar a demanda técnica vinculada ao ticket.');
  }

  return data as RpcSupportCreateEngineeringWorkItemFromTicketResponse;
}

export async function createSupportInternalAction(
  payload: RpcSupportCreateInternalActionPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_support_create_internal_action', {
    p_ticket_id: payload.ticketId,
    p_target_area: payload.targetArea,
    p_support_type: payload.supportType,
    p_priority: payload.priority ?? 'normal',
    p_summary: payload.summary,
    p_context: payload.context,
    p_evidence_attachment_ids: payload.evidenceAttachmentIds ?? null,
    p_assigned_area_user_id: payload.assignedAreaUserId ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao criar o acionamento interno.');
  }

  return data as RpcSupportCreateInternalActionResponse;
}

export async function addInternalActionEvidenceLink(
  payload: RpcInternalActionAddEvidenceLinkPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_internal_action_add_evidence_link', {
    p_internal_action_id: payload.internalActionId,
    p_tenant_id: payload.tenantId,
    p_ticket_attachment_id: payload.ticketAttachmentId,
    p_note: payload.note ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao vincular a evidência a este acionamento.');
  }

  return data as RpcInternalActionAddEvidenceLinkResponse;
}

export async function acceptSupportInternalActionReturn(
  payload: RpcSupportAcceptInternalActionReturnPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_support_accept_internal_action_return', {
    p_internal_action_id: payload.internalActionId,
    p_tenant_id: payload.tenantId,
    p_note: payload.note ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao aceitar o retorno deste acionamento.');
  }

  return data as RpcSupportAcceptInternalActionReturnResponse;
}

export async function requestSupportInternalActionFollowup(
  payload: RpcSupportRequestInternalActionFollowupPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_support_request_internal_action_followup', {
    p_internal_action_id: payload.internalActionId,
    p_tenant_id: payload.tenantId,
    p_note: payload.note,
  });

  if (error) {
    throw toAppError(error, 'Falha ao solicitar complemento deste acionamento.');
  }

  return data as RpcSupportRequestInternalActionFollowupResponse;
}

export async function closeSupportInternalAction(
  payload: RpcSupportCloseInternalActionPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_support_close_internal_action', {
    p_internal_action_id: payload.internalActionId,
    p_tenant_id: payload.tenantId,
    p_note: payload.note ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao encerrar este acionamento.');
  }

  return data as RpcSupportCloseInternalActionResponse;
}

export async function linkSupportTicketToEngineeringWorkItem(
  payload: RpcSupportLinkTicketToEngineeringWorkItemPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_support_link_ticket_to_engineering_work_item',
    {
      p_ticket_id: payload.ticketId,
      p_engineering_work_item_id: payload.engineeringWorkItemId,
      p_handoff_note: payload.handoffNote ?? null,
    },
  );

  if (error) {
    throw toAppError(error, 'Falha ao vincular este ticket a uma demanda técnica.');
  }

  return data as RpcSupportLinkTicketToEngineeringWorkItemResponse;
}
