import { toAppError } from '../../app/errors';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';
import type {
  InternalBuildTask,
  InternalBuildTaskPriority,
  InternalBuildTaskStatus,
  InternalBuildTaskUpdate,
} from '@genius-support-os/contracts';

function requireClient() {
  return requireSupabaseBrowserClient();
}

function mapTask(row: Record<string, unknown>): InternalBuildTask {
  return {
    taskId: String(row.task_id),
    workspaceKey: String(row.workspace_key),
    title: String(row.title),
    description: String(row.description),
    status: row.status as InternalBuildTaskStatus,
    priority: row.priority as InternalBuildTaskPriority,
    area: (row.area as string | null) ?? null,
    outcome: (row.outcome as string | null) ?? null,
    validationSummary: (row.validation_summary as string | null) ?? null,
    blockedReason: (row.blocked_reason as string | null) ?? null,
    relatedDocumentSlugs: Array.isArray(row.related_document_slugs)
      ? row.related_document_slugs.map(String)
      : [],
    assignedToUserId: (row.assigned_to_user_id as string | null) ?? null,
    assignedToFullName: (row.assigned_to_full_name as string | null) ?? null,
    createdByUserId: String(row.created_by_user_id),
    createdByFullName: (row.created_by_full_name as string | null) ?? null,
    updatedByUserId: (row.updated_by_user_id as string | null) ?? null,
    updatedByFullName: (row.updated_by_full_name as string | null) ?? null,
    startedAt: (row.started_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    lastUpdateSummary: (row.last_update_summary as string | null) ?? null,
    lastUpdateNextStep: (row.last_update_next_step as string | null) ?? null,
    lastUpdateAt: (row.last_update_at as string | null) ?? null,
    canManage: Boolean(row.can_manage),
  };
}

function mapUpdate(row: Record<string, unknown>): InternalBuildTaskUpdate {
  return {
    updateId: String(row.update_id),
    workspaceKey: String(row.workspace_key),
    taskId: String(row.task_id),
    summary: String(row.summary),
    nextStep: (row.next_step as string | null) ?? null,
    createdByUserId: String(row.created_by_user_id),
    createdByFullName: (row.created_by_full_name as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export async function listInternalBuildTasks() {
  const { data, error } = await requireClient()
    .from('vw_internal_build_tasks_board')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw toAppError(error, 'Falha ao carregar o painel de desenvolvimento.');
  return (data ?? []).map((row) => mapTask(row as Record<string, unknown>));
}

export async function listInternalBuildTaskUpdates(taskId: string) {
  const { data, error } = await requireClient()
    .from('vw_internal_build_task_updates')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) throw toAppError(error, 'Falha ao carregar o histórico da tarefa.');
  return (data ?? []).map((row) => mapUpdate(row as Record<string, unknown>));
}

export async function createInternalBuildTask(payload: {
  title: string;
  description: string;
  priority: InternalBuildTaskPriority;
  area: string | null;
  relatedDocumentSlugs: string[];
}) {
  const { data, error } = await requireClient().rpc('rpc_internal_build_task_create', {
    p_title: payload.title,
    p_description: payload.description,
    p_priority: payload.priority,
    p_area: payload.area,
    p_related_document_slugs: payload.relatedDocumentSlugs,
  });

  if (error) throw toAppError(error, 'Falha ao criar a tarefa.');
  return data as Record<string, unknown>;
}

export async function claimInternalBuildTask(taskId: string) {
  const { data, error } = await requireClient().rpc('rpc_internal_build_task_claim', {
    p_task_id: taskId,
  });

  if (error) throw toAppError(error, 'Falha ao assumir a tarefa.');
  return data as Record<string, unknown>;
}

export async function editInternalBuildTask(payload: {
  taskId: string;
  title: string;
  description: string;
  priority: InternalBuildTaskPriority;
  area: string | null;
  relatedDocumentSlugs: string[];
}) {
  const { data, error } = await requireClient().rpc('rpc_internal_build_task_edit', {
    p_task_id: payload.taskId,
    p_title: payload.title,
    p_description: payload.description,
    p_priority: payload.priority,
    p_area: payload.area,
    p_related_document_slugs: payload.relatedDocumentSlugs,
  });

  if (error) throw toAppError(error, 'Falha ao editar a tarefa.');
  return data as Record<string, unknown>;
}

export async function updateInternalBuildTask(payload: {
  taskId: string;
  status: InternalBuildTaskStatus;
  outcome: string | null;
  validationSummary: string | null;
  blockedReason: string | null;
  relatedDocumentSlugs: string[];
}) {
  const { data, error } = await requireClient().rpc('rpc_internal_build_task_update', {
    p_task_id: payload.taskId,
    p_status: payload.status,
    p_outcome: payload.outcome,
    p_validation_summary: payload.validationSummary,
    p_blocked_reason: payload.blockedReason,
    p_related_document_slugs: payload.relatedDocumentSlugs,
  });

  if (error) throw toAppError(error, 'Falha ao atualizar a tarefa.');
  return data as Record<string, unknown>;
}

export async function addInternalBuildTaskUpdate(payload: {
  taskId: string;
  summary: string;
  nextStep: string | null;
}) {
  const { data, error } = await requireClient().rpc('rpc_internal_build_task_add_update', {
    p_task_id: payload.taskId,
    p_summary: payload.summary,
    p_next_step: payload.nextStep,
  });

  if (error) throw toAppError(error, 'Falha ao registrar a atualização.');
  return data as Record<string, unknown>;
}
