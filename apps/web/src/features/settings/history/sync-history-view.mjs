// Leitura pura do historico de sincronizacoes.
//
// A view `vw_admin_analytics_sync_history_v2` devolve ate 100 linhas, em dois
// niveis: `rowKind = 'cycle'` (o ciclo) e `rowKind = 'step'` (cada fonte dentro
// do ciclo). Agrupar, classificar, filtrar e contar acontece aqui, sem estado e
// sem acesso a rede, para que o filtro da tela tenha efeito comprovavel.

export const UNAVAILABLE_LABEL = 'Indisponível';

const STATUS_LABELS = {
  queued: 'Na fila',
  running: 'Em andamento',
  success: 'Concluído',
  succeeded: 'Concluído',
  partial: 'Parcial',
  failed: 'Falhou',
  error: 'Falhou',
  abandoned: 'Interrompida',
  timed_out: 'Tempo excedido',
  cancelled: 'Cancelada',
  empty: 'Sem dados',
};

const FAILURE_STATUSES = ['failed', 'error', 'abandoned', 'timed_out', 'cancelled'];
const ACTIVE_STATUSES = ['running', 'queued'];

export const PERIOD_OPTIONS = [
  { value: '7d', label: 'Últimos 7 dias', days: 7 },
  { value: '30d', label: 'Últimos 30 dias', days: 30 },
  { value: 'all', label: 'Todo o histórico', days: null },
];

export const SOURCE_OPTIONS = [
  { value: 'all', label: 'Todas as fontes' },
  { value: 'hubspot', label: 'HubSpot' },
  { value: 'omie', label: 'OMIE' },
];

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os resultados' },
  { value: 'success', label: 'Concluídas' },
  { value: 'partial', label: 'Parciais' },
  { value: 'failed', label: 'Com falha' },
  { value: 'running', label: 'Em andamento' },
];

export const TRIGGER_OPTIONS = [
  { value: 'all', label: 'Todos os gatilhos' },
  { value: 'manual', label: 'Ação manual' },
  { value: 'automatic', label: 'Atualização automática' },
  { value: 'diagnostic', label: 'Diagnóstico' },
];

export const DEFAULT_HISTORY_FILTERS = { period: '30d', source: 'all', status: 'all', trigger: 'all' };

/** @param {string} value */
export function statusLabel(value) {
  return STATUS_LABELS[value] ?? UNAVAILABLE_LABEL;
}

/**
 * Reduz os varios status do backend a cinco baldes operacionais.
 * @param {string} value
 */
export function statusBucket(value) {
  if (value === 'success' || value === 'succeeded') return 'success';
  if (value === 'partial') return 'partial';
  if (FAILURE_STATUSES.includes(value)) return 'failed';
  if (ACTIVE_STATUSES.includes(value)) return 'running';
  return 'empty';
}

/** @param {{ status: string, tone?: string }} _ */
export function bucketTone(bucket) {
  if (bucket === 'success') return 'success';
  if (bucket === 'partial') return 'warning';
  if (bucket === 'failed') return 'danger';
  if (bucket === 'running') return 'info';
  return 'muted';
}

/**
 * Linha que representa o ciclo. Quando a view nao publica a linha de ciclo, a
 * primeira etapa assume esse papel para a tela nao ficar sem cabecalho.
 * @param {Array<Record<string, unknown>>} rows
 */
export function cycleRowOf(rows) {
  return rows.find((row) => row.rowKind === 'cycle') ?? rows[0];
}

/**
 * Status efetivo do ciclo: em andamento vence tudo, depois falha, depois
 * parcial. Assim o operador nunca ve "concluido" em um ciclo com etapa falhada.
 * @param {Array<Record<string, unknown>>} rows
 */
export function resolveGroupStatus(rows) {
  const cycle = cycleRowOf(rows);
  if (cycle.rowKind === 'cycle' && cycle.status === 'partial') return 'partial';
  if (rows.some((row) => ACTIVE_STATUSES.includes(row.status))) return 'running';
  if (rows.some((row) => FAILURE_STATUSES.includes(row.status))) return 'failed';
  if (rows.some((row) => row.status === 'partial')) return 'partial';
  return cycle.status;
}

/**
 * Agrupa as linhas por ciclo, preservando a ordem de chegada (mais recente
 * primeiro, como a view ordena).
 * @param {Array<Record<string, unknown>>} rows
 */
export function groupHistoryRows(rows) {
  const grouped = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const key = row.cycleId || row.correlationId || row.runId || `${row.startedAt}-${row.status}`;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  return [...grouped.values()];
}

/**
 * Contagem por balde, sempre sobre os grupos que o filtro deixou visiveis.
 * @param {Array<Array<Record<string, unknown>>>} groups
 */
export function summarizeHistoryGroups(groups) {
  const list = Array.isArray(groups) ? groups : [];
  const counts = { total: list.length, success: 0, partial: 0, failed: 0, running: 0, processed: 0 };
  for (const group of list) {
    const bucket = statusBucket(resolveGroupStatus(group));
    if (bucket === 'success') counts.success += 1;
    else if (bucket === 'partial') counts.partial += 1;
    else if (bucket === 'failed') counts.failed += 1;
    else if (bucket === 'running') counts.running += 1;
    for (const row of group) {
      if (row.rowKind === 'step') counts.processed += Number(row.processedCount ?? 0);
    }
  }
  return counts;
}

/**
 * Aplica os quatro filtros da barra. `nowMs` entra por parametro para o
 * resultado ser deterministico em teste.
 * @param {Array<Array<Record<string, unknown>>>} groups
 * @param {{ period?: string, source?: string, status?: string, trigger?: string }} filters
 * @param {number} nowMs
 */
export function filterHistoryGroups(groups, filters, nowMs) {
  const active = { ...DEFAULT_HISTORY_FILTERS, ...(filters ?? {}) };
  const periodDays = PERIOD_OPTIONS.find((option) => option.value === active.period)?.days ?? null;
  const floor = periodDays === null ? null : nowMs - periodDays * 24 * 60 * 60 * 1000;

  return (Array.isArray(groups) ? groups : []).filter((group) => {
    const cycle = cycleRowOf(group);
    if (floor !== null) {
      const startedAt = new Date(cycle.startedAt).getTime();
      if (!Number.isFinite(startedAt) || startedAt < floor) return false;
    }
    if (active.source !== 'all' && !group.some((row) => row.sourceKey === active.source)) return false;
    if (active.status !== 'all' && statusBucket(resolveGroupStatus(group)) !== active.status) return false;
    if (active.trigger !== 'all' && cycle.triggerKind !== active.trigger) return false;
    return true;
  });
}

/** Verdadeiro quando algum filtro saiu do padrao. */
export function hasActiveHistoryFilters(filters) {
  const active = { ...DEFAULT_HISTORY_FILTERS, ...(filters ?? {}) };
  return Object.keys(DEFAULT_HISTORY_FILTERS).some((key) => active[key] !== DEFAULT_HISTORY_FILTERS[key]);
}

/**
 * Fatia de pagina, 1-indexada. Devolve tambem os limites para o rodape.
 * @param {Array<unknown>} items
 */
export function paginate(items, page, pageSize) {
  const list = Array.isArray(items) ? items : [];
  const size = Math.max(1, Number(pageSize) || 10);
  const pageCount = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(Math.max(1, Number(page) || 1), pageCount);
  const from = (current - 1) * size;
  const slice = list.slice(from, from + size);
  return { slice, page: current, pageCount, from: list.length ? from + 1 : 0, to: from + slice.length, total: list.length };
}
