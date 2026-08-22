import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCommercialStageScope,
  buildCommercialStageQueryPlan,
  commercialStageCatalogFilters,
  composeCommercialStageView,
  hasCompatibleAnalyticsStage,
  readAnalyticsStageScope,
  selectedAnalyticsPipelineIds,
} from '../../apps/web/src/features/analytics/analytics-stage-scope.mjs';

const rows = [
  {
    label: 'Aberto',
    pipelineBreakdown: [
      { pipelineId: 'pipeline-a', stageId: 'stage-a' },
      { pipelineId: 'pipeline-b', stageId: 'stage-b' },
    ],
  },
  {
    label: 'Sem cruzamento',
  },
];

test('stage options respeitam os pipelines efetivamente selecionados', () => {
  const reading = readAnalyticsStageScope(rows, ['pipeline-a']);
  assert.deepEqual(reading.options, [{ value: 'stage-a', label: 'Aberto' }]);
  assert.equal(reading.partial, true);
  assert.equal(hasCompatibleAnalyticsStage(rows, ['pipeline-a'], 'stage-b'), false);
});

test('stage compartilhado pelo backend preserva os ids compatíveis', () => {
  const reading = readAnalyticsStageScope([rows[0]], ['pipeline-a', 'pipeline-b']);
  assert.deepEqual(reading.options, [{ value: 'stage-a,stage-b', label: 'Aberto' }]);
  assert.equal(hasCompatibleAnalyticsStage([rows[0]], ['pipeline-a', 'pipeline-b'], 'stage-a,stage-b'), true);
});

test('pipeline sem operação não entra silenciosamente no recorte', () => {
  const configs = [
    { pipelineId: 'pipeline-a', groupCompany: 'Confi' },
    { pipelineId: 'pipeline-b', groupCompany: null },
    { pipelineId: 'pipeline-c', groupCompany: 'Aftersale' },
  ];
  assert.deepEqual(selectedAnalyticsPipelineIds(configs, 'Confi'), ['pipeline-a']);
  assert.deepEqual(selectedAnalyticsPipelineIds(configs, ''), ['pipeline-a', 'pipeline-b', 'pipeline-c']);
});

test('catálogo de stages não herda owner ou stage do recorte de dados', () => {
  const filters = { from: '2026-08-01', to: '2026-08-31', ownerId: 'owner-a', stageId: 'stage-b', priority: '' };
  assert.deepEqual(commercialStageCatalogFilters(filters), {
    from: '2026-08-01',
    to: '2026-08-31',
    ownerId: '',
    stageId: '',
    priority: '',
  });
  assert.deepEqual(filters, { from: '2026-08-01', to: '2026-08-31', ownerId: 'owner-a', stageId: 'stage-b', priority: '' });
});

test('preserva o stage no catálogo quando o owner não tem atividade e mantém o vazio dos dados', () => {
  const filters = { from: '2026-08-01', to: '2026-08-31', ownerId: 'owner-sem-atividade', stageId: 'stage-qualificacao', priority: '' };
  const plan = buildCommercialStageQueryPlan(filters, ['pipeline-b'], 'Confi');

  assert.deepEqual(plan.data.filters, filters);
  assert.deepEqual(plan.data.excludedPipelineIds, ['pipeline-b']);
  assert.deepEqual(plan.catalog, {
    filters: { from: '2026-08-01', to: '2026-08-31', ownerId: '', stageId: '', priority: '' },
    excludedPipelineIds: ['pipeline-b'],
    groupCompany: 'Confi',
  });

  const view = composeCommercialStageView(
    { funnel: [], state: { status: 'empty' } },
    { funnel: [{ label: 'Qualificação', pipelineBreakdown: [{ pipelineId: 'pipeline-a', stageId: 'stage-qualificacao' }] }] },
    ['pipeline-a'],
  );
  assert.deepEqual(view.stageScope.options, [{ value: 'stage-qualificacao', label: 'Qualificação' }]);
  assert.equal(view.dataState.status, 'empty');
});

test('payload parcial permanece explícito e não cria opção por inferência', () => {
  const reading = readAnalyticsStageScope([{ label: 'Sem payload de origem' }], ['pipeline-a']);
  assert.deepEqual(reading.options, []);
  assert.equal(reading.partial, true);
  assert.match(reading.notice, /não puderam ser vinculadas/);
});

test('snapshot comercial conserva o cruzamento publicado ao mapear o payload', () => {
  const mapped = applyCommercialStageScope(
    { funnel: [{ stageId: 'stage-a', label: 'Aberto' }] },
    { funnel: [{ stage_id: 'stage-a', label: 'Aberto', pipeline_breakdown: [{ pipeline_id: 'pipeline-a', stage_id: 'stage-a', pipeline_label: 'A', deal_count: 2 }] }] },
  );
  assert.deepEqual(mapped.funnel[0].pipelineBreakdown, [{ pipelineId: 'pipeline-a', pipelineLabel: 'A', stageId: 'stage-a', dealCount: 2 }]);
});
