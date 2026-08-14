export const INTERNAL_BUILD_TASK_STATUSES = [
  'backlog',
  'awaiting_agent',
  'in_progress',
  'blocked',
  'done',
  'cancelled',
] as const;

export type InternalBuildTaskStatus = (typeof INTERNAL_BUILD_TASK_STATUSES)[number];

export const INTERNAL_BUILD_TASK_PRIORITIES = ['low', 'normal', 'high'] as const;

export type InternalBuildTaskPriority = (typeof INTERNAL_BUILD_TASK_PRIORITIES)[number];

export interface InternalBuildTask {
  taskId: string;
  workspaceKey: string;
  title: string;
  description: string;
  status: InternalBuildTaskStatus;
  priority: InternalBuildTaskPriority;
  area: string | null;
  outcome: string | null;
  validationSummary: string | null;
  blockedReason: string | null;
  relatedDocumentSlugs: string[];
  assignedToUserId: string | null;
  assignedToFullName: string | null;
  createdByUserId: string;
  createdByFullName: string | null;
  updatedByUserId: string | null;
  updatedByFullName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastUpdateSummary: string | null;
  lastUpdateNextStep: string | null;
  lastUpdateAt: string | null;
  canManage: boolean;
}

export interface InternalBuildTaskUpdate {
  updateId: string;
  workspaceKey: string;
  taskId: string;
  summary: string;
  nextStep: string | null;
  createdByUserId: string;
  createdByFullName: string | null;
  createdAt: string;
}

export interface RpcInternalBuildTaskCreatePayload {
  title: string;
  description: string;
  priority?: InternalBuildTaskPriority;
  area?: string | null;
  relatedDocumentSlugs?: string[];
}

export interface RpcInternalBuildTaskClaimPayload {
  taskId: string;
}

export interface RpcInternalBuildTaskUpdatePayload {
  taskId: string;
  status: InternalBuildTaskStatus;
  outcome?: string | null;
  validationSummary?: string | null;
  blockedReason?: string | null;
  relatedDocumentSlugs?: string[] | null;
}

export interface RpcInternalBuildTaskAddUpdatePayload {
  taskId: string;
  summary: string;
  nextStep?: string | null;
}
