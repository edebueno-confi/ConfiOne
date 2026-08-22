export const UNRESOLVED_QUEUE_STATE = 'UNRESOLVED';

export const CANONICAL_QUEUE_STATES = [
  'BACKLOG',
  'READY',
  'IMPLEMENTING',
  'READY_FOR_REVIEW',
  'CHANGES_REQUESTED',
  'APPROVED',
  'DONE',
  'BLOCKED',
  'OWNER_DECISION_REQUIRED',
  UNRESOLVED_QUEUE_STATE,
];

export function toCanonicalQueueState(state) {
  const rawState = String(state || '').trim();
  if (rawState === 'PROPOSED') return 'BACKLOG';
  if (rawState === 'ACTIVE') return 'IMPLEMENTING';
  if (rawState === 'READY_FOR_IMPLEMENTATION') return 'READY';
  if (CANONICAL_QUEUE_STATES.includes(rawState)) return rawState;
  return UNRESOLVED_QUEUE_STATE;
}

export function createQueueCardModel(item) {
  const id = item.task_id || item.id || '—';

  return {
    id,
    title: item.title || item.título || item.summary || id,
    project: item.project || 'ConfiOne',
    priority: item.priority || '—',
    owner: item.owner || item.Owner || '—',
    approval: item.approval || '—',
    state: item.state || UNRESOLVED_QUEUE_STATE,
    canonicalState: item.canonicalState || toCanonicalQueueState(item.state),
    origin: item.origin || 'Origem indisponível',
    dependencies: item.dependencies || 'Sem dependências',
  };
}

export function formatWorktreeStatus(gitAvailable, dirtyCount) {
  if (gitAvailable === false || dirtyCount === null || dirtyCount === undefined) {
    return {
      value: 'Indisponível',
      helper: 'estado do Git desconhecido',
    };
  }

  if (dirtyCount === 0) {
    return {
      value: '0',
      helper: 'limpo',
    };
  }

  return {
    value: String(dirtyCount),
    helper: 'alterações locais',
  };
}

export function normalizeQueueItems(queue, currentTask, currentOwner, currentState) {
  return queue.map((item) => ({
    ...item,
    state: item.state || UNRESOLVED_QUEUE_STATE,
    owner: item.task_id === currentTask ? currentOwner : '—',
    canonicalState: item.task_id === currentTask && currentState
      ? toCanonicalQueueState(currentState)
      : toCanonicalQueueState(item.state),
  }));
}

export function groupQueueItems(queue, columns) {
  const fallbackState = columns.at(-1)?.[0];
  const grouped = Object.fromEntries(columns.map(([state]) => [state, []]));

  for (const item of queue) {
    const candidate = item.canonicalState || toCanonicalQueueState(item.state);
    const rawState = item.state || UNRESOLVED_QUEUE_STATE;
    const state = Object.hasOwn(grouped, candidate)
      ? candidate
      : Object.hasOwn(grouped, rawState)
        ? rawState
        : fallbackState;
    if (state) grouped[state].push(item);
  }

  return grouped;
}
