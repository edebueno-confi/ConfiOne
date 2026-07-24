import { requireSupabaseBrowserClient } from '../../app/supabase-browser';

export interface InboxItem {
  id: string;
  title: string;
  tenantId: string | null;
  tenantDisplayName: string | null;
  requesterName: string | null;
  status: string;
  priority: string;
  severity: string;
  categoryName: string | null;
  conversationTypeKey: string | null;
  conversationTypeLabel: string | null;
  originLabel: string;
  slaStatus: string;
  slaStatusLabel: string;
  isSlaAvailable: boolean;
  assignedToFullName: string | null;
  isUnassigned: boolean;
  isWaitingCustomer: boolean;
  isWaitingSupport: boolean;
  customerMessageCount: number;
  lastMessageAt: string | null;
  updatedAt: string;
  createdAt: string;
}

const QUEUE_COLUMNS = [
  'id',
  'title',
  'tenant_id',
  'tenant_display_name',
  'requester_contact_full_name',
  'status',
  'priority',
  'severity',
  'category_name',
  'conversation_type_key',
  'conversation_type_label',
  'origin_label',
  'sla_status',
  'sla_status_label',
  'is_sla_available',
  'assigned_to_full_name',
  'is_unassigned',
  'is_waiting_customer',
  'is_waiting_support',
  'customer_message_count',
  'last_message_at',
  'updated_at',
  'created_at',
].join(', ');

export async function listInboxItems(): Promise<InboxItem[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_support_tickets_queue')
    .select(QUEUE_COLUMNS)
    .order('updated_at', { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(
    (row: Record<string, unknown>): InboxItem => ({
      id: String(row.id),
      title: String(row.title),
      tenantId: (row.tenant_id as string | null) ?? null,
      tenantDisplayName: (row.tenant_display_name as string | null) ?? null,
      requesterName: (row.requester_contact_full_name as string | null) ?? null,
      status: String(row.status),
      priority: String(row.priority),
      severity: String(row.severity),
      categoryName: (row.category_name as string | null) ?? null,
      conversationTypeKey: (row.conversation_type_key as string | null) ?? null,
      conversationTypeLabel: (row.conversation_type_label as string | null) ?? null,
      originLabel: String(row.origin_label ?? 'Origem indisponível'),
      slaStatus: String(row.sla_status ?? 'unavailable'),
      slaStatusLabel: String(row.sla_status_label ?? 'Sem política definida'),
      isSlaAvailable: row.is_sla_available === true,
      assignedToFullName: (row.assigned_to_full_name as string | null) ?? null,
      isUnassigned: row.is_unassigned === true,
      isWaitingCustomer: row.is_waiting_customer === true,
      isWaitingSupport: row.is_waiting_support === true,
      customerMessageCount: Number(row.customer_message_count ?? 0),
      lastMessageAt: (row.last_message_at as string | null) ?? null,
      updatedAt: String(row.updated_at),
      createdAt: String(row.created_at),
    }),
  );
}

export type ConversationEntryKind =
  | 'customer_message'
  | 'public_reply'
  | 'internal_note'
  | 'system_event';

export interface ConversationEntry {
  id: string;
  kind: ConversationEntryKind;
  body: string | null;
  actorName: string | null;
  occurredAt: string;
}

const TIMELINE_COLUMNS = [
  'ticket_id',
  'timeline_entry_id',
  'entry_type',
  'visibility',
  'occurred_at',
  'actor_full_name',
  'body',
  'communication_direction',
  'is_customer_visible',
].join(', ');

function classifyEntry(row: Record<string, unknown>): ConversationEntryKind {
  const body = (row.body as string | null) ?? null;
  const visibility = String(row.visibility ?? '');
  const direction = String(row.communication_direction ?? '');

  if (!body) {
    return 'system_event';
  }
  if (visibility === 'internal') {
    return 'internal_note';
  }
  if (direction === 'inbound') {
    return 'customer_message';
  }
  return 'public_reply';
}

export async function listConversation(ticketId: string): Promise<ConversationEntry[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_support_ticket_timeline_recent')
    .select(TIMELINE_COLUMNS)
    .eq('ticket_id', ticketId)
    .order('occurred_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(
    (row: Record<string, unknown>): ConversationEntry => ({
      id: String(row.timeline_entry_id),
      kind: classifyEntry(row),
      body: (row.body as string | null) ?? null,
      actorName: (row.actor_full_name as string | null) ?? null,
      occurredAt: String(row.occurred_at),
    }),
  );
}

export async function sendPublicReply(ticketId: string, body: string): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_add_ticket_message', {
    p_ticket_id: ticketId,
    p_body: body,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveInternalNote(ticketId: string, body: string): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_add_internal_ticket_note', {
    p_ticket_id: ticketId,
    p_body: body,
  });

  if (error) {
    throw new Error(error.message);
  }
}


export async function assignTicketTo(ticketId: string, userId: string | null): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_assign_ticket', {
    p_ticket_id: ticketId,
    p_assigned_to_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateTicketStatus(ticketId: string, status: string): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_support_update_ticket_status_v2', {
    p_ticket_id: ticketId,
    p_status: status,
    p_operational_reason_id: null,
    p_note: null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateTicketPriority(
  ticketId: string,
  priority: string,
  severity: string,
): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_support_update_ticket_priority_severity', {
    p_ticket_id: ticketId,
    p_priority: priority,
    p_severity: severity,
    p_operational_reason_id: null,
    p_note: null,
  });

  if (error) {
    throw new Error(error.message);
  }
}


export interface QuickReplyOption {
  id: string;
  title: string;
  body: string;
}

export async function listQuickReplyOptions(): Promise<QuickReplyOption[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('quick_replies')
    .select('id, title, body, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    title: String(row.title),
    body: String(row.body),
  }));
}

export interface ConversationTypeOption {
  key: string;
  label: string;
}

export async function listConversationTypeOptions(): Promise<ConversationTypeOption[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('conversation_types')
    .select('key, label, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    key: String(row.key),
    label: String(row.label),
  }));
}

export async function setTicketConversationType(
  ticketId: string,
  conversationTypeKey: string | null,
): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_support_set_ticket_conversation_type', {
    p_ticket_id: ticketId,
    p_conversation_type_key: conversationTypeKey,
  });

  if (error) {
    throw new Error(error.message);
  }
}

// --- Acionamento entre áreas (internal actions) ---
// Contratos reais existentes: vw_support_ticket_internal_actions,
// rpc_support_list_internal_action_target_areas, rpc_support_create_internal_action,
// rpc_support_accept_internal_action_return, rpc_support_close_internal_action.

export interface TicketInternalAction {
  id: string;
  ticketId: string;
  tenantId: string;
  targetAreaKey: string;
  targetAreaLabel: string;
  supportType: string;
  priority: string;
  status: string;
  summary: string;
  assignedAreaUserName: string | null;
  requestedByUserName: string | null;
  lastUpdateSummary: string | null;
  lastUpdateAt: string | null;
  hasPendingReturn: boolean;
  createdAt: string;
}

const INTERNAL_ACTION_COLUMNS = [
  'internal_action_id',
  'ticket_id',
  'tenant_id',
  'target_area',
  'target_area_label',
  'support_type',
  'priority',
  'status',
  'summary',
  'assigned_area_user_name',
  'requested_by_user_name',
  'last_update_summary',
  'last_update_at',
  'has_pending_return',
  'created_at',
].join(', ');

export async function listTicketInternalActions(
  ticketId: string,
): Promise<TicketInternalAction[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_support_ticket_internal_actions')
    .select(INTERNAL_ACTION_COLUMNS)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(
    (row: Record<string, unknown>): TicketInternalAction => ({
      id: String(row.internal_action_id),
      ticketId: String(row.ticket_id),
      tenantId: String(row.tenant_id),
      targetAreaKey: String(row.target_area),
      targetAreaLabel: String(row.target_area_label ?? row.target_area),
      supportType: String(row.support_type),
      priority: String(row.priority),
      status: String(row.status),
      summary: String(row.summary ?? ''),
      assignedAreaUserName: (row.assigned_area_user_name as string | null) ?? null,
      requestedByUserName: (row.requested_by_user_name as string | null) ?? null,
      lastUpdateSummary: (row.last_update_summary as string | null) ?? null,
      lastUpdateAt: (row.last_update_at as string | null) ?? null,
      hasPendingReturn: row.has_pending_return === true,
      createdAt: String(row.created_at),
    }),
  );
}

export interface InternalActionTargetAreaOption {
  key: string;
  label: string;
  canCreateAction: boolean;
  unavailableReason: string | null;
}

export async function listInternalActionTargetAreas(
  ticketId: string,
): Promise<InternalActionTargetAreaOption[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_support_list_internal_action_target_areas', {
    p_ticket_id: ticketId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(
    (row: Record<string, unknown>): InternalActionTargetAreaOption => ({
      key: String(row.area_key),
      label: String(row.display_name ?? row.area_key),
      canCreateAction: row.can_create_action === true,
      unavailableReason: (row.unavailable_reason as string | null) ?? null,
    }),
  );
}

export interface CreateInternalActionInput {
  ticketId: string;
  targetAreaKey: string;
  supportType: string;
  priority: string;
  summary: string;
  context: string;
}

export async function createInternalAction(input: CreateInternalActionInput): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_support_create_internal_action', {
    p_ticket_id: input.ticketId,
    p_target_area: input.targetAreaKey,
    p_support_type: input.supportType,
    p_priority: input.priority,
    p_summary: input.summary,
    p_context: input.context,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function acceptInternalActionReturn(
  internalActionId: string,
  tenantId: string,
): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_support_accept_internal_action_return', {
    p_internal_action_id: internalActionId,
    p_tenant_id: tenantId,
    p_note: null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function closeInternalAction(
  internalActionId: string,
  tenantId: string,
): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_support_close_internal_action', {
    p_internal_action_id: internalActionId,
    p_tenant_id: tenantId,
    p_note: null,
  });

  if (error) {
    throw new Error(error.message);
  }
}
