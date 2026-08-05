import assert from 'node:assert/strict';
import test from 'node:test';

const {
  DEFAULT_HISTORY_FILTERS,
  bucketTone,
  cycleRowOf,
  filterHistoryGroups,
  groupHistoryRows,
  hasActiveHistoryFilters,
  paginate,
  resolveGroupStatus,
  statusBucket,
  statusLabel,
} = await import('../../apps/web/src/features/settings/history/sync-history-view.mjs');

const NOW = new Date('2026-08-05T12:00:00Z').getTime();

function cycle(overrides = {}) {
  return {
    runId: null,
    cycleId: 'cycle-1',
    rowKind: 'cycle',
    sourceKey: null,
    sourceLabel: 'Ciclo',
    status: 'success',
    startedAt: '2026-08-05T10:00:00Z',
    finishedAt: '2026-08-05T10:05:00Z',
    durationMs: 300000,
    processedCount: 0,
    errorMessage: null,
    correlationId: 'corr-1',
    triggerKind: 'automatic',
    currentStep: null,
    ...overrides,
  };
}

function step(overrides = {}) {
  return cycle({ rowKind: 'step', sourceKey: 'hubspot', sourceLabel: 'HubSpot', processedCount: 10, ...overrides });
}

test('agrupa por ciclo e usa correlação como chave de reserva', () => {
  const groups = groupHistoryRows([
    cycle({ cycleId: 'a' }),
    step({ cycleId: 'a' }),
    cycle({ cycleId: '', correlationId: 'solta' }),
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].length, 2);
  assert.equal(cycleRowOf(groups[0]).rowKind, 'cycle');
});

test('etapa em andamento vence falha e sucesso no status do ciclo', () => {
  assert.equal(resolveGroupStatus([cycle(), step({ status: 'running' }), step({ status: 'failed' })]), 'running');
  assert.equal(resolveGroupStatus([cycle(), step({ status: 'failed' })]), 'failed');
  assert.equal(resolveGroupStatus([cycle(), step({ status: 'partial' })]), 'partial');
  assert.equal(resolveGroupStatus([cycle(), step()]), 'success');
});

test('ciclo marcado como parcial pelo backend tem precedência', () => {
  assert.equal(resolveGroupStatus([cycle({ status: 'partial' }), step({ status: 'success' })]), 'partial');
});

test('status do backend cai em cinco baldes operacionais', () => {
  assert.equal(statusBucket('succeeded'), 'success');
  assert.equal(statusBucket('timed_out'), 'failed');
  assert.equal(statusBucket('cancelled'), 'failed');
  assert.equal(statusBucket('queued'), 'running');
  assert.equal(statusBucket('empty'), 'empty');
  assert.equal(statusLabel('desconhecido'), 'Indisponível');
  assert.equal(bucketTone('partial'), 'warning');
  assert.equal(bucketTone('empty'), 'muted');
});

test('filtro de período recorta pela data de início do ciclo', () => {
  const groups = groupHistoryRows([
    cycle({ cycleId: 'recente', startedAt: '2026-08-04T10:00:00Z' }),
    cycle({ cycleId: 'antigo', startedAt: '2026-06-01T10:00:00Z' }),
  ]);
  const last7 = filterHistoryGroups(groups, { period: '7d' }, NOW);
  assert.equal(last7.length, 1);
  assert.equal(cycleRowOf(last7[0]).cycleId, 'recente');
  assert.equal(filterHistoryGroups(groups, { period: 'all' }, NOW).length, 2);
});

test('filtro de fonte considera as etapas do ciclo', () => {
  const groups = groupHistoryRows([
    cycle({ cycleId: 'com-omie' }),
    step({ cycleId: 'com-omie', sourceKey: 'omie', sourceLabel: 'OMIE' }),
    cycle({ cycleId: 'so-hubspot' }),
    step({ cycleId: 'so-hubspot' }),
  ]);
  assert.equal(filterHistoryGroups(groups, { source: 'omie' }, NOW).length, 1);
  assert.equal(filterHistoryGroups(groups, { source: 'hubspot' }, NOW).length, 1);
  assert.equal(filterHistoryGroups(groups, { source: 'all' }, NOW).length, 2);
});

test('filtro de resultado e de gatilho têm efeito', () => {
  const groups = groupHistoryRows([
    cycle({ cycleId: 'ok', triggerKind: 'automatic' }),
    cycle({ cycleId: 'falhou', status: 'failed', triggerKind: 'manual' }),
  ]);
  assert.equal(filterHistoryGroups(groups, { status: 'failed' }, NOW).length, 1);
  assert.equal(filterHistoryGroups(groups, { status: 'success' }, NOW).length, 1);
  assert.equal(filterHistoryGroups(groups, { trigger: 'manual' }, NOW).length, 1);
  assert.equal(filterHistoryGroups(groups, { trigger: 'diagnostic' }, NOW).length, 0);
});

test('data de início inválida não passa pelo recorte de período', () => {
  const groups = groupHistoryRows([cycle({ startedAt: 'sem-data' })]);
  assert.equal(filterHistoryGroups(groups, { period: '30d' }, NOW).length, 0);
  assert.equal(filterHistoryGroups(groups, { period: 'all' }, NOW).length, 1);
});

test('filtros padrão não são reportados como ativos', () => {
  assert.equal(hasActiveHistoryFilters(DEFAULT_HISTORY_FILTERS), false);
  assert.equal(hasActiveHistoryFilters({ ...DEFAULT_HISTORY_FILTERS, source: 'omie' }), true);
  assert.equal(hasActiveHistoryFilters({}), false);
});

test('paginação limita a página ao total disponível', () => {
  const items = Array.from({ length: 23 }, (_, index) => index);
  const first = paginate(items, 1, 10);
  assert.deepEqual([first.from, first.to, first.pageCount], [1, 10, 3]);
  const last = paginate(items, 99, 10);
  assert.deepEqual([last.page, last.from, last.to], [3, 21, 23]);
  const empty = paginate([], 1, 10);
  assert.deepEqual([empty.from, empty.to, empty.total, empty.pageCount], [0, 0, 0, 1]);
});
