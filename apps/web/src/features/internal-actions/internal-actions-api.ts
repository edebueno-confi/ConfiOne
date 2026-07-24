import { toAppError } from '../../app/errors';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';
import type {
  InternalActionAreaDetail,
  InternalActionAreaAuthContext,
  InternalActionAreaKey,
  InternalActionAreaQueueItem,
  InternalActionAreaTimelineEntry,
  InternalActionStatus,
  InternalActionSupportType,
  InternalActionUpdateKind,
  JsonObject,
  RpcInternalActionAddCommentPayload,
  RpcInternalActionAddCommentResponse,
  RpcInternalActionAssignToSelfPayload,
  RpcInternalActionAssignToSelfResponse,
  RpcInternalActionReturnToSupportPayload,
  RpcInternalActionReturnToSupportResponse,
  RpcInternalActionUpdateStatusPayload,
  RpcInternalActionUpdateStatusResponse,
  TicketPriority,
  TicketSeverity,
  TicketStatus,
  Uuid,
} from '../../contracts/support-contracts';

function requireClient() {
  return requireSupabaseBrowserClient();
}

function mapInternalActionQueueItem(
  row: Record<string, unknown>,
): InternalActionAreaQueueItem {
  return {
    internalActionId: String(row.internal_action_id),
    ticketId: String(row.ticket_id),
    ticketTitle: String(row.ticket_title),
    ticketStatus: row.ticket_status as TicketStatus,
    ticketPriority: row.ticket_priority as TicketPriority,
    ticketSeverity: row.ticket_severity as TicketSeverity,
    ticketUpdatedAt: String(row.ticket_updated_at),
    tenantId: String(row.tenant_id),
    targetArea: row.target_area as InternalActionAreaKey,
    targetAreaLabel: String(row.target_area_label),
    supportType: row.support_type as InternalActionSupportType,
    priority: row.priority as TicketPriority,
    status: row.status as InternalActionStatus,
    summary: String(row.summary),
    context: String(row.context),
    requestedByUserId: String(row.requested_by_user_id),
    requestedByUserName: (row.requested_by_user_name as string | null) ?? null,
    assignedAreaUserId: (row.assigned_area_user_id as string | null) ?? null,
    assignedAreaUserName: (row.assigned_area_user_name as string | null) ?? null,
    lastUpdateKind: (row.last_update_kind as InternalActionUpdateKind | null) ?? null,
    lastUpdateSummary: (row.last_update_summary as string | null) ?? null,
    lastUpdateAt: (row.last_update_at as string | null) ?? null,
    returnedToSupportAt: (row.returned_to_support_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapInternalActionAreaAuthContext(
  row: Record<string, unknown>,
): InternalActionAreaAuthContext {
  return {
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: (row.tenant_display_name as string | null) ?? null,
    areaKey: row.area_key as InternalActionAreaKey,
    areaLabel: String(row.area_label),
    role: row.role as InternalActionAreaAuthContext['role'],
    status: row.status as InternalActionAreaAuthContext['status'],
    visibleOpenActionCount: Number(row.visible_open_action_count ?? 0),
    canViewQueue: row.can_view_queue === true,
  };
}

function mapInternalActionDetail(
  row: Record<string, unknown>,
): InternalActionAreaDetail {
  return {
    ...mapInternalActionQueueItem(row),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: (row.tenant_display_name as string | null) ?? null,
    tenantLegalName: (row.tenant_legal_name as string | null) ?? null,
    updatedByUserId: (row.updated_by_user_id as string | null) ?? null,
    updatedByUserName: (row.updated_by_user_name as string | null) ?? null,
    closedAt: (row.closed_at as string | null) ?? null,
    cancelledAt: (row.cancelled_at as string | null) ?? null,
    linkedEvidenceCount: Number(row.linked_evidence_count ?? 0),
  };
}

function mapInternalActionTimelineEntry(
  row: Record<string, unknown>,
): InternalActionAreaTimelineEntry {
  return {
    internalActionUpdateId: String(row.internal_action_update_id),
    internalActionId: String(row.internal_action_id),
    ticketId: String(row.ticket_id),
    tenantId: String(row.tenant_id),
    targetArea: row.target_area as InternalActionAreaKey,
    targetAreaLabel: String(row.target_area_label),
    updateKind: row.update_kind as InternalActionUpdateKind,
    statusBefore: (row.status_before as InternalActionStatus | null) ?? null,
    statusAfter: (row.status_after as InternalActionStatus | null) ?? null,
    body: String(row.body),
    metadata:
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as JsonObject)
        : {},
    createdByUserId: (row.created_by_user_id as string | null) ?? null,
    createdByUserName: (row.created_by_user_name as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export interface ListInternalActionQueueOptions {
  status?: InternalActionStatus | 'all';
  targetArea?: InternalActionAreaKey | 'all';
  priority?: TicketPriority | 'all';
}

export async function listInternalActionAreaAuthContexts() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_internal_action_area_auth_context')
    .select('*')
    .order('tenant_slug', { ascending: true })
    .order('area_label', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao validar memberships de áreas internas.');
  }

  return (data ?? []).map((row) =>
    mapInternalActionAreaAuthContext(row as Record<string, unknown>),
  );
}

export async function listInternalActionAreaQueue(
  options: ListInternalActionQueueOptions = {},
) {
  const client = requireClient();
  let query = client
    .from('vw_internal_action_queue_by_area')
    .select('*')
    .order('updated_at', { ascending: false });

  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options.targetArea && options.targetArea !== 'all') {
    query = query.eq('target_area', options.targetArea);
  }

  if (options.priority && options.priority !== 'all') {
    query = query.eq('priority', options.priority);
  }

  const { data, error } = await query;

  if (error) {
    throw toAppError(error, 'Falha ao carregar a fila de acionamentos internos.');
  }

  return (data ?? []).map((row) =>
    mapInternalActionQueueItem(row as Record<string, unknown>),
  );
}

export async function getInternalActionAreaDetail(internalActionId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_internal_action_detail_by_area')
    .select('*')
    .eq('internal_action_id', internalActionId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o detalhe do acionamento interno.');
  }

  return data ? mapInternalActionDetail(data as Record<string, unknown>) : null;
}

export async function listInternalActionAreaTimeline(internalActionId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_internal_action_timeline_by_area')
    .select('*')
    .eq('internal_action_id', internalActionId)
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar a timeline do acionamento interno.');
  }

  return (data ?? []).map((row) =>
    mapInternalActionTimelineEntry(row as Record<string, unknown>),
  );
}

export async function assignInternalActionToSelf(
  payload: RpcInternalActionAssignToSelfPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_internal_action_assign_to_self', {
    p_internal_action_id: payload.internalActionId,
    p_tenant_id: payload.tenantId,
  });

  if (error) {
    throw toAppError(error, 'Falha ao assumir o acionamento interno.');
  }

  return data as RpcInternalActionAssignToSelfResponse;
}

export async function addInternalActionComment(
  payload: RpcInternalActionAddCommentPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_internal_action_add_comment', {
    p_internal_action_id: payload.internalActionId,
    p_tenant_id: payload.tenantId,
    p_body: payload.body,
  });

  if (error) {
    throw toAppError(error, 'Falha ao registrar atualização interna.');
  }

  return data as RpcInternalActionAddCommentResponse;
}

export async function updateInternalActionStatus(
  payload: RpcInternalActionUpdateStatusPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_internal_action_update_status', {
    p_internal_action_id: payload.internalActionId,
    p_tenant_id: payload.tenantId,
    p_status: payload.status,
    p_body: payload.body ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao atualizar o status do acionamento interno.');
  }

  return data as RpcInternalActionUpdateStatusResponse;
}

export async function returnInternalActionToSupport(
  payload: RpcInternalActionReturnToSupportPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_internal_action_return_to_support', {
    p_internal_action_id: payload.internalActionId,
    p_tenant_id: payload.tenantId,
    p_body: payload.body,
  });

  if (error) {
    throw toAppError(error, 'Falha ao devolver o acionamento ao suporte.');
  }

  return data as RpcInternalActionReturnToSupportResponse;
}
