import { toAppError } from '../../app/errors';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';
import type {
  CustomerIntegrationEnvironment,
  CustomerIntegrationStatus,
  CustomerIntegrationType,
  CustomerOperationalStatus,
  CustomerProductLine,
  EngineeringWorkItemType,
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
  SupportCustomerRecentEventsWindow,
  SupportCustomerRecentTicketsWindow,
  SupportTicketAttachment,
  SupportTicketDetail,
  SupportTicketEngineeringLink,
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
    tenantId: String(row.tenant_id),
    messageId: (row.message_id as string | null) ?? null,
    visibility: row.visibility as SupportTicketAttachment['visibility'],
    fileName: String(row.file_name),
    contentType: (row.content_type as string | null) ?? null,
    byteSize: Number(row.byte_size ?? 0),
    uploadedByUserId: String(row.uploaded_by_user_id),
    uploadedByFullName: (row.uploaded_by_full_name as string | null) ?? null,
    createdAt: String(row.created_at),
    bucketConfigured: Boolean(row.bucket_configured),
    storageObjectPresent: Boolean(row.storage_object_present),
    downloadAvailable: Boolean(row.download_available),
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
  });

  if (error) {
    throw toAppError(error, 'Falha ao criar ticket.');
  }

  return data as RpcCreateTicketResponse;
}

export async function updateTicketStatus(payload: RpcUpdateTicketStatusPayload) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_update_ticket_status', {
    p_ticket_id: payload.ticketId,
    p_status: payload.status,
    p_note: payload.note ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao alterar o status do ticket.');
  }

  return data as RpcUpdateTicketStatusResponse;
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
