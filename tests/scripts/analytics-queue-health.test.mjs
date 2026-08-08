import assert from 'node:assert/strict';
import test from 'node:test';
import {
  queueRoleLabel,
  readQueueHealth,
} from '../../apps/web/src/features/analytics/analytics-queue-health.mjs';

const producao = {
  stagnation_threshold_days: 180,
  total_in_queue: 2851,
  total_stagnant: 2207,
  total_unknown_activity: 0,
  total_waiting_third_party: 130,
  total_unowned: 2070,
  total_waiting_undecided: 2,
  classified_pipelines: 0,
  by_group_company: [
    { group_company: 'Confi', pipelines: 3, in_queue: 2469, unowned: 2053, waiting_third_party: 27, confirmed_pipelines: 0 },
    { group_company: 'Neotrust', pipelines: 1, in_queue: 210, unowned: 11, waiting_third_party: 103, confirmed_pipelines: 0 },
    { group_company: 'Aftersale', pipelines: 1, in_queue: 170, unowned: 4, waiting_third_party: 0, confirmed_pipelines: 1 },
  ],
  total_pipelines: 6,
  pipelines: [
    { pipeline_id: '23949674', pipeline_name: '🔎 Fale conosco | Confi', pipeline_alias: 'Fale conosco | Confi', group_company: 'Confi', group_company_source: 'suggested', queue_role: 'a_classificar', in_queue: 1443, stagnant: 1120, unowned: 1100, waiting_third_party: 20, waiting_undecided: 0, stagnant_rate: 77.6, arrived_30d: 66, median_age_days: 316 },
    { pipeline_id: '1429283', pipeline_name: '📊 CS | Neotrust', pipeline_alias: 'Suporte', group_company: 'Neotrust', group_company_source: 'suggested', queue_role: 'a_classificar', in_queue: 210, stagnant: 114, unowned: 11, waiting_third_party: 103, waiting_undecided: 0, stagnant_rate: 54.3, arrived_30d: 16, median_age_days: 240 },
    { pipeline_id: '5034314', pipeline_name: '💜 Criadouro de Tíquetes | Aftersale', pipeline_alias: 'Criadouro de Tíquetes | Aftersale', group_company: 'Aftersale', group_company_source: 'confirmed', queue_role: 'a_classificar', in_queue: 170, stagnant: 6, unowned: 4, waiting_third_party: 0, waiting_undecided: 2, stagnant_rate: 3.5, arrived_30d: 39, median_age_days: 79 },
  ],
};

test('payload ausente não vira zero', () => {
  const leitura = readQueueHealth(null);
  assert.equal(leitura.available, false);
  assert.equal(leitura.stagnantRate, null);
  assert.deepEqual(leitura.pipelines, []);
});

test('a fila é decomposta em movimento e parado, e a soma fecha', () => {
  const leitura = readQueueHealth(producao);
  assert.equal(leitura.inQueue, 2851);
  assert.equal(leitura.stagnant, 2207);
  assert.equal(leitura.moving, 644);
  assert.equal(leitura.moving + leitura.stagnant, leitura.inQueue);
});

test('a proporção de parados é calculada, não recebida pronta', () => {
  assert.equal(readQueueHealth(producao).stagnantRate, 77.4);
});

test('fila vazia devolve proporção nula em vez de zero por cento', () => {
  // 0% afirmaria que nada está parado; a verdade é que não há o que avaliar.
  const leitura = readQueueHealth({ total_in_queue: 0, total_stagnant: 0, pipelines: [] });
  assert.equal(leitura.stagnantRate, null);
  assert.equal(leitura.available, false);
});

test('sem nenhuma data de atividade, a leitura é indisponível e não "0 em movimento"', () => {
  // O defeito real: a tela publicava "0 em movimento · 100% parados" contra uma
  // base sem o campo ingerido, com a mesma tipografia de um zero medido.
  const semDado = {
    ...producao,
    total_unknown_activity: 2851,
    total_stagnant: 0,
    pipelines: producao.pipelines.map((p) => ({
      ...p, unknown_activity: p.in_queue, stagnant: 0, stagnant_rate: null,
    })),
  };
  const leitura = readQueueHealth(semDado);
  assert.equal(leitura.available, false);
  assert.equal(leitura.stagnantRate, null);
  assert.match(leitura.coverageWarning, /não é possível separar/);
});

test('cobertura parcial informa quantos ficam de fora, sem esconder a leitura', () => {
  const parcial = { ...producao, total_unknown_activity: 285 };
  const leitura = readQueueHealth(parcial);
  assert.equal(leitura.available, true);
  assert.equal(leitura.partial, true);
  assert.equal(leitura.measured, 2566);
  assert.match(leitura.coverageWarning, /285 atendimentos \(10%\)/);
});

test('cobertura total não gera aviso', () => {
  assert.equal(readQueueHealth({ ...producao, total_unknown_activity: 0 }).coverageWarning, null);
  assert.equal(readQueueHealth({ ...producao, total_unknown_activity: 0 }).partial, false);
});

test('enquanto ninguém classificar, a tela diz que a contagem não mudou', () => {
  const leitura = readQueueHealth(producao);
  assert.match(leitura.notice, /Nenhum pipeline teve o papel definido/);
  assert.match(leitura.notice, /segue contando todos eles/);
});

test('classificação parcial informa quantos faltam, com concordância', () => {
  assert.match(readQueueHealth({ ...producao, classified_pipelines: 5 }).notice, /^Um pipeline ainda não teve/);
  assert.match(readQueueHealth({ ...producao, classified_pipelines: 4 }).notice, /^2 pipelines ainda não tiveram/);
  assert.equal(readQueueHealth({ ...producao, classified_pipelines: 6 }).notice, null);
});

test('papel desconhecido não vaza código técnico para a tela', () => {
  assert.equal(queueRoleLabel('trabalhada'), 'Fila de trabalho');
  assert.equal(queueRoleLabel('caixa_de_entrada'), 'Caixa de entrada');
  assert.equal(queueRoleLabel('a_classificar'), 'A classificar');
  assert.equal(queueRoleLabel('valor_novo_do_backend'), 'A classificar');
});

test('o limiar vem do backend e não é reescrito na tela', () => {
  assert.equal(readQueueHealth(producao).threshold, 180);
  assert.equal(readQueueHealth({ ...producao, stagnation_threshold_days: 90 }).threshold, 90);
});

test('o nome oficial do pipeline é o rótulo, e o apelido vem à parte', () => {
  // Foi o apelido sozinho que fez "CS | Neotrust" ser classificado como se fosse
  // o suporte da Confi. O nome oficial não pode mais ser substituído.
  const neotrust = readQueueHealth(producao).pipelines.find((p) => p.pipelineId === '1429283');
  assert.equal(neotrust.label, '📊 CS | Neotrust');
  assert.equal(neotrust.alias, 'Suporte');
  assert.equal(neotrust.groupCompany, 'Neotrust');
});

test('operação sugerida pelo nome não conta como decidida', () => {
  const leitura = readQueueHealth(producao);
  const sugerida = leitura.pipelines.find((p) => p.pipelineId === '1429283');
  const confirmada = leitura.pipelines.find((p) => p.pipelineId === '5034314');
  assert.equal(sugerida.groupCompanyConfirmed, false);
  assert.equal(confirmada.groupCompanyConfirmed, true);
});

test('parado sem dono é separado de parado esperando terceiro', () => {
  // Somar os dois inflou o problema em quase o triplo na leitura anterior.
  const leitura = readQueueHealth(producao);
  assert.equal(leitura.unowned, 2070);
  assert.equal(leitura.waitingThirdParty, 130);
  assert.equal(leitura.waitingUndecided, 2);
});

test('etapa sem decisão de espera não é empurrada para nenhum dos dois grupos', () => {
  const aftersale = readQueueHealth(producao).pipelines.find((p) => p.pipelineId === '5034314');
  assert.equal(aftersale.unowned + aftersale.waitingThirdParty + aftersale.waitingUndecided, aftersale.stagnant);
});

test('a fila é quebrada por operação do grupo, e a soma fecha', () => {
  const leitura = readQueueHealth(producao);
  assert.equal(leitura.byGroupCompany.length, 3);
  assert.equal(leitura.byGroupCompany[0].company, 'Confi', 'a maior vem primeiro');
  assert.equal(leitura.byGroupCompany.reduce((s, g) => s + g.inQueue, 0), 2849);
});

test('sem quebra por operação, a leitura não inventa uma', () => {
  const leitura = readQueueHealth({ ...producao, by_group_company: undefined });
  assert.deepEqual(leitura.byGroupCompany, []);
});
