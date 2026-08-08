import assert from 'node:assert/strict';
import test from 'node:test';
import {
  UNCLASSIFIED_LABEL,
  consolidatedStages,
  readStageBreakdown,
} from '../../apps/web/src/features/analytics/analytics-stage-breakdown.mjs';

// O que estes testes garantem: a tela não agrupa etapa por conta própria, e a
// pendência de configuração continua visível em vez de ser diluída no gráfico.

test('payload ausente não vira gráfico', () => {
  const reading = readStageBreakdown(null);
  assert.equal(reading.available, false);
  assert.deepEqual(reading.rows, []);
  assert.equal(reading.notice, null);
});

test('etapas seguem a ordem do fluxo, não o volume', () => {
  const reading = readStageBreakdown({
    stages: [
      { stage: 'Resolvido', stage_order: 90, open_tickets: 500, total_tickets: 500 },
      { stage: 'Novo', stage_order: 10, open_tickets: 30, total_tickets: 30 },
      { stage: 'Em tratativa', stage_order: 20, open_tickets: 120, total_tickets: 120 },
    ],
  });
  assert.deepEqual(reading.rows.map((row) => row.stage), ['Novo', 'Em tratativa', 'Resolvido']);
});

test('volume desempata etapas na mesma posição do fluxo', () => {
  const reading = readStageBreakdown({
    stages: [
      { stage: 'A', stage_order: 20, open_tickets: 5 },
      { stage: 'B', stage_order: 20, open_tickets: 40 },
    ],
  });
  assert.deepEqual(reading.rows.map((row) => row.stage), ['B', 'A']);
});

test('etapa sem cruzamento aparece separada e produz aviso', () => {
  const reading = readStageBreakdown({
    stages: [{ stage: UNCLASSIFIED_LABEL, stage_order: 999, open_tickets: 12 }],
    unmapped: 3,
    pending_review: 0,
  });
  assert.equal(reading.rows[0].stage, UNCLASSIFIED_LABEL);
  assert.match(reading.notice, /3 etapas ainda não foram cruzadas/);
  // O aviso fala com quem lê o painel: sem nome de tabela, sem termo técnico.
  assert.doesNotMatch(reading.notice, /analytics_stage_mapping|canonical|pipeline_id/i);
});

test('uma única etapa pendente usa concordância no singular', () => {
  const reading = readStageBreakdown({ stages: [{ stage: 'X', open_tickets: 1 }], unmapped: 1 });
  assert.match(reading.notice, /^Uma etapa ainda não foi cruzada/);
});

test('sem etapa pendente, revisão pendente ainda é comunicada', () => {
  const reading = readStageBreakdown({
    stages: [{ stage: 'Novo', stage_order: 10, open_tickets: 4 }],
    unmapped: 0,
    pending_review: 163,
  });
  assert.match(reading.notice, /163 etapa\(s\) ainda aguardam revisão/);
});

test('cruzamento completo e revisado não gera aviso', () => {
  const reading = readStageBreakdown({
    stages: [{ stage: 'Novo', stage_order: 10, open_tickets: 4 }],
    unmapped: 0,
    pending_review: 0,
  });
  assert.equal(reading.notice, null);
});

test('composição por pipeline é preservada para auditoria da barra', () => {
  const reading = readStageBreakdown({
    stages: [
      {
        stage: 'Em tratativa',
        stage_order: 20,
        open_tickets: 240,
        by_pipeline: [
          { pipeline_label: 'Suporte', open_tickets: 200 },
          { pipeline_label: 'Criadouro', open_tickets: 40 },
        ],
      },
    ],
  });
  const [row] = reading.rows;
  assert.equal(row.byPipeline.length, 2);
  assert.equal(row.byPipeline.reduce((sum, item) => sum + item.openTickets, 0), row.openTickets);
});

test('só é consolidada a etapa presente em mais de um pipeline', () => {
  const rows = readStageBreakdown({
    stages: [
      { stage: 'Em tratativa', stage_order: 20, open_tickets: 240, by_pipeline: [{ pipeline_label: 'A', open_tickets: 200 }, { pipeline_label: 'B', open_tickets: 40 }] },
      { stage: 'Aberto', stage_order: 10, open_tickets: 10, by_pipeline: [{ pipeline_label: 'A', open_tickets: 10 }] },
    ],
  }).rows;
  assert.deepEqual(consolidatedStages(rows), ['Em tratativa']);
});

test('etapa sem rótulo não desaparece: cai em não classificada', () => {
  const reading = readStageBreakdown({ stages: [{ stage: null, open_tickets: 7 }] });
  assert.equal(reading.rows[0].stage, UNCLASSIFIED_LABEL);
  assert.equal(reading.rows[0].openTickets, 7);
});
