import { toAppError } from '../../app/errors';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';
import type {
  EngineeringWorkspaceTicketLink,
  EngineeringWorkspaceUpdate,
  EngineeringWorkspaceWorkItem,
  EngineeringWorkItemStatus,
  EngineeringWorkItemUpdateKind,
  EngineeringWorkItemType,
  JsonObject,
  RpcEngineeringAddWorkItemUpdatePayload,
  RpcEngineeringAddWorkItemUpdateResponse,
  RpcEngineeringAssignWorkItemPayload,
  RpcEngineeringAssignWorkItemResponse,
  RpcEngineeringReturnWorkItemToSupportPayload,
  RpcEngineeringReturnWorkItemToSupportResponse,
  RpcEngineeringUnassignWorkItemPayload,
  RpcEngineeringUnassignWorkItemResponse,
  RpcEngineeringUpdateWorkItemStatusPayload,
  RpcEngineeringUpdateWorkItemStatusResponse,
  TicketPriority,
  TicketSeverity,
  TicketStatus,
  Uuid,
} from '../../contracts/support-contracts';

function requireClient() {
  return requireSupabaseBrowserClient();
}

function mapEngineeringWorkItem(
  row: Record<string, unknown>,
): EngineeringWorkspaceWorkItem {
  return {
    engineeringWorkItemId: String(row.engineering_work_item_id),
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantName: (row.tenant_name as string | null) ?? null,
    workItemType: row.work_item_type as EngineeringWorkItemType,
    status: row.status as EngineeringWorkItemStatus,
    priority: row.priority as TicketPriority,
    title: String(row.title),
    description: String(row.description),
    createdByUserId: String(row.created_by_user_id),
    createdByFullName: (row.created_by_full_name as string | null) ?? null,
    assignedToUserId: (row.assigned_to_user_id as string | null) ?? null,
    assignedToFullName: (row.assigned_to_full_name as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    updatedByUserId: (row.updated_by_user_id as string | null) ?? null,
    updatedByFullName: (row.updated_by_full_name as string | null) ?? null,
    linkedTicketsCount: Number(row.linked_tickets_count ?? 0),
    originTicketId: (row.origin_ticket_id as string | null) ?? null,
    originTicketTitle: (row.origin_ticket_title as string | null) ?? null,
    originTicketStatus: (row.origin_ticket_status as TicketStatus | null) ?? null,
    originTicketPriority: (row.origin_ticket_priority as TicketPriority | null) ?? null,
    originTicketSeverity: (row.origin_ticket_severity as TicketSeverity | null) ?? null,
    lastUpdateKind: (row.last_update_kind as EngineeringWorkItemUpdateKind | null) ?? null,
    lastUpdateSummary: (row.last_update_summary as string | null) ?? null,
    lastUpdateNextStep: (row.last_update_next_step as string | null) ?? null,
    lastUpdateAt: (row.last_update_at as string | null) ?? null,
    lastUpdateByUserId: (row.last_update_by_user_id as string | null) ?? null,
    lastUpdateByFullName: (row.last_update_by_full_name as string | null) ?? null,
    canManageEngineering: Boolean(row.can_manage_engineering),
  };
}

function mapEngineeringTicketLink(
  row: Record<string, unknown>,
): EngineeringWorkspaceTicketLink {
  return {
    engineeringTicketLinkId: String(row.engineering_ticket_link_id),
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantName: (row.tenant_name as string | null) ?? null,
    engineeringWorkItemId: String(row.engineering_work_item_id),
    workItemTitle: String(row.work_item_title),
    workItemStatus: row.work_item_status as EngineeringWorkItemStatus,
    workItemPriority: row.work_item_priority as TicketPriority,
    ticketId: String(row.ticket_id),
    ticketTitle: String(row.ticket_title),
    ticketStatus: row.ticket_status as TicketStatus,
    ticketPriority: row.ticket_priority as TicketPriority,
    ticketSeverity: row.ticket_severity as TicketSeverity,
    ticketUpdatedAt: String(row.ticket_updated_at),
    handoffNote: (row.handoff_note as string | null) ?? null,
    createdByUserId: String(row.created_by_user_id),
    createdByFullName: (row.created_by_full_name as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapEngineeringUpdate(row: Record<string, unknown>): EngineeringWorkspaceUpdate {
  return {
    engineeringWorkItemUpdateId: String(row.engineering_work_item_update_id),
    tenantId: String(row.tenant_id),
    engineeringWorkItemId: String(row.engineering_work_item_id),
    updateKind: row.update_kind as EngineeringWorkItemUpdateKind,
    status: (row.status as EngineeringWorkItemStatus | null) ?? null,
    summary: String(row.summary),
    nextStep: (row.next_step as string | null) ?? null,
    createdByUserId: String(row.created_by_user_id),
    createdByFullName: (row.created_by_full_name as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export interface ListEngineeringQueueOptions {
  status?: EngineeringWorkItemStatus | 'all';
  workItemType?: EngineeringWorkItemType | 'all';
  assigned?: 'all' | 'me' | 'unassigned';
}

export async function listEngineeringWorkItemsQueue(
  options: ListEngineeringQueueOptions = {},
) {
  const client = requireClient();
  let query = client
    .from('vw_engineering_work_items_queue')
    .select('*')
    .order('updated_at', { ascending: false });

  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options.workItemType && options.workItemType !== 'all') {
    query = query.eq('work_item_type', options.workItemType);
  }

  if (options.assigned === 'unassigned') {
    query = query.is('assigned_to_user_id', null);
  }

  const { data, error } = await query;

  if (error) {
    throw toAppError(error, 'Falha ao carregar a fila técnica.');
  }

  return (data ?? []).map((row) => mapEngineeringWorkItem(row as Record<string, unknown>));
}

export async function getEngineeringWorkItemDetail(workItemId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_engineering_work_item_detail')
    .select('*')
    .eq('engineering_work_item_id', workItemId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o detalhe técnico.');
  }

  if (!data) {
    return null;
  }

  const workItem = mapEngineeringWorkItem(data as Record<string, unknown>);
  const linkedTickets =
    data.linked_tickets && typeof data.linked_tickets === 'object'
      ? (data.linked_tickets as JsonObject[])
      : [];

  return { ...workItem, linkedTickets };
}

export async function listEngineeringWorkItemTicketLinks(workItemId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_engineering_work_item_ticket_links')
    .select('*')
    .eq('engineering_work_item_id', workItemId)
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar tickets vinculados.');
  }

  return (data ?? []).map((row) =>
    mapEngineeringTicketLink(row as Record<string, unknown>),
  );
}

export async function listEngineeringWorkItemUpdates(workItemId: Uuid) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_engineering_work_item_updates')
    .select('*')
    .eq('engineering_work_item_id', workItemId)
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar atualizações técnicas.');
  }

  return (data ?? []).map((row) => mapEngineeringUpdate(row as Record<string, unknown>));
}

export async function assignEngineeringWorkItem(
  payload: RpcEngineeringAssignWorkItemPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_engineering_assign_work_item', {
    p_engineering_work_item_id: payload.engineeringWorkItemId,
    p_tenant_id: payload.tenantId,
    p_assigned_to_user_id: payload.assignedToUserId ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao assumir a demanda técnica.');
  }

  return data as RpcEngineeringAssignWorkItemResponse;
}

export async function unassignEngineeringWorkItem(
  payload: RpcEngineeringUnassignWorkItemPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_engineering_unassign_work_item', {
    p_engineering_work_item_id: payload.engineeringWorkItemId,
    p_tenant_id: payload.tenantId,
  });

  if (error) {
    throw toAppError(error, 'Falha ao remover o responsável técnico.');
  }

  return data as RpcEngineeringUnassignWorkItemResponse;
}

export async function updateEngineeringWorkItemStatus(
  payload: RpcEngineeringUpdateWorkItemStatusPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_engineering_update_work_item_status', {
    p_engineering_work_item_id: payload.engineeringWorkItemId,
    p_tenant_id: payload.tenantId,
    p_status: payload.status,
    p_summary: payload.summary,
    p_next_step: payload.nextStep ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao atualizar o status técnico.');
  }

  return data as RpcEngineeringUpdateWorkItemStatusResponse;
}

export async function addEngineeringWorkItemUpdate(
  payload: RpcEngineeringAddWorkItemUpdatePayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_engineering_add_work_item_update', {
    p_engineering_work_item_id: payload.engineeringWorkItemId,
    p_tenant_id: payload.tenantId,
    p_summary: payload.summary,
    p_next_step: payload.nextStep ?? null,
  });

  if (error) {
    throw toAppError(error, 'Falha ao registrar atualização técnica.');
  }

  return data as RpcEngineeringAddWorkItemUpdateResponse;
}

export async function returnEngineeringWorkItemToSupport(
  payload: RpcEngineeringReturnWorkItemToSupportPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_engineering_return_work_item_to_support', {
    p_engineering_work_item_id: payload.engineeringWorkItemId,
    p_tenant_id: payload.tenantId,
    p_summary: payload.summary,
    p_next_step: payload.nextStep,
  });

  if (error) {
    throw toAppError(error, 'Falha ao devolver a demanda ao suporte.');
  }

  return data as RpcEngineeringReturnWorkItemToSupportResponse;
}
