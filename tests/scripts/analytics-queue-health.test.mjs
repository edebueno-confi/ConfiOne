import assert from 'node:assert/strict';
import test from 'node:test';
import { queueRoleLabel, readQueueHealth } from '../../apps/web/src/features/analytics/analytics-queue-health.mjs';

const producao = {
  available: true,
  stagnation_threshold_days: 180,
  total_in_queue: 2851,
  total_stagnant: 2207,
  total_unknown_activity: 0,
  measured: 2851,
  moving: 644,
  stagnant_rate: 77.4,
  partial: false,
  coverage_warning: null,
  notice: 'Nenhum pipeline teve o papel definido ainda, então "Fila atual" segue contando todos eles.',
  total_waiting_third_party: 130,
  total_unowned: 2070,
  total_waiting_undecided: 2,
  classified_pipelines: 0,
  total_pipelines: 6,
  by_group_company: [
    { group_company: 'Confi', pipelines: 3, in_queue: 2469, unowned: 2053, waiting_third_party: 27, confirmed_pipelines: 0 },
    { group_company: 'Neotrust', pipelines: 1, in_queue: 210, unowned: 11, waiting_third_party: 103, confirmed_pipelines: 0 },
  ],
  pipelines: [
    { pipeline_id: '23949674', pipeline_name: 'Fale conosco | Confi', pipeline_alias: 'Fale conosco | Confi', group_company: 'Confi', group_company_source: 'suggested', queue_role: 'a_classificar', in_queue: 1443, stagnant: 1120, unowned: 1100, waiting_third_party: 20, waiting_undecided: 0, stagnant_rate: 77.6, suggests_inbox: false, arrived_30d: 66, median_age_days: 316 },
    { pipeline_id: '1429283', pipeline_name: 'CS | Neotrust', pipeline_alias: 'Suporte', group_company: 'Neotrust', group_company_source: 'suggested', queue_role: 'a_classificar', in_queue: 210, stagnant: 114, unowned: 11, waiting_third_party: 103, waiting_undecided: 0, stagnant_rate: 54.3, suggests_inbox: false, arrived_30d: 16, median_age_days: 240 },
  ],
};

test('payload ausente não vira zero', () => {
  const leitura = readQueueHealth(null);
  assert.equal(leitura.available, false);
  assert.equal(leitura.stagnantRate, null);
  assert.deepEqual(leitura.pipelines, []);
});

test('agregados e taxa vêm prontos do backend', () => {
  const leitura = readQueueHealth(producao);
  assert.equal(leitura.inQueue, 2851);
  assert.equal(leitura.stagnant, 2207);
  assert.equal(leitura.moving, 644);
  assert.equal(leitura.measured, 2851);
  assert.equal(leitura.stagnantRate, 77.4);
});

test('ausência de cobertura é publicada pelo backend', () => {
  const leitura = readQueueHealth({ ...producao, available: false, measured: 0, moving: 0, partial: true, stagnant_rate: null, coverage_warning: 'Nenhum atendimento da fila tem registro de última atividade' });
  assert.equal(leitura.available, false);
  assert.equal(leitura.stagnantRate, null);
  assert.equal(leitura.partial, true);
  assert.match(leitura.coverageWarning, /não é possível|Nenhum atendimento/);
});

test('cobertura parcial informa o texto recebido', () => {
  const leitura = readQueueHealth({ ...producao, total_unknown_activity: 285, measured: 2566, moving: 359, partial: true, coverage_warning: '285 atendimentos (10%) não têm registro de última atividade.' });
  assert.equal(leitura.measured, 2566);
  assert.equal(leitura.moving, 359);
  assert.match(leitura.coverageWarning, /285 atendimentos \(10%\)/);
});

test('avisos de classificação vêm prontos do backend', () => {
  assert.match(readQueueHealth(producao).notice, /Nenhum pipeline/);
  assert.match(readQueueHealth({ ...producao, classified_pipelines: 5, notice: 'Um pipeline ainda não teve o papel definido.' }).notice, /Um pipeline/);
  assert.equal(readQueueHealth({ ...producao, classified_pipelines: 6, notice: null }).notice, null);
});

test('papel desconhecido não vaza código técnico para a tela', () => {
  assert.equal(queueRoleLabel('trabalhada'), 'Fila de trabalho');
  assert.equal(queueRoleLabel('caixa_de_entrada'), 'Caixa de entrada');
  assert.equal(queueRoleLabel('a_classificar'), 'A classificar');
  assert.equal(queueRoleLabel('valor_novo_do_backend'), 'A classificar');
});

test('o nome oficial, operação e sugestão vêm do read model', () => {
  const pipeline = readQueueHealth(producao).pipelines[1];
  assert.equal(pipeline.label, 'CS | Neotrust');
  assert.equal(pipeline.alias, 'Suporte');
  assert.equal(pipeline.groupCompany, 'Neotrust');
  assert.equal(pipeline.suggestsInbox, false);
});
