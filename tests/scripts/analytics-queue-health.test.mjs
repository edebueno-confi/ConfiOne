import assert from 'node:assert/strict';
import test from 'node:test';
import {
  queueRoleLabel,
  readQueueHealth,
  suggestsInbox,
} from '../../apps/web/src/features/analytics/analytics-queue-health.mjs';

const producao = {
  stagnation_threshold_days: 180,
  total_in_queue: 2851,
  total_stagnant: 2207,
  total_unknown_activity: 0,
  classified_pipelines: 0,
  total_pipelines: 6,
  pipelines: [
    { pipeline_id: '23949674', pipeline_label: 'Fale conosco | Confi', queue_role: 'a_classificar', in_queue: 1443, stagnant: 1120, stagnant_rate: 77.6, arrived_30d: 66, median_age_days: 316 },
    { pipeline_id: '95268403', pipeline_label: 'Confi | Whatsapp', queue_role: 'a_classificar', in_queue: 947, stagnant: 909, stagnant_rate: 96.0, arrived_30d: 2, median_age_days: 429 },
    { pipeline_id: '5034314', pipeline_label: 'Criadouro de Tíquetes | Aftersale', queue_role: 'a_classificar', in_queue: 170, stagnant: 6, stagnant_rate: 3.5, arrived_30d: 39, median_age_days: 79 },
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

test('a leitura de caixa de entrada exige acúmulo E ausência de entrada', () => {
  const [faleConosco, whatsapp, criadouro] = readQueueHealth(producao).pipelines;

  // 96% parado e 2 entradas no mês: o sinal mais forte do conjunto.
  assert.equal(suggestsInbox(whatsapp), true);

  // 77% parado, mas 66 entradas no mês. É acúmulo com demanda viva — problema de
  // capacidade, não de escopo. Apontar aqui levaria à decisão errada.
  assert.equal(suggestsInbox(faleConosco), false);

  // Saudável.
  assert.equal(suggestsInbox(criadouro), false);
});

test('pipeline pequeno não é apontado, para não decidir sobre ruído', () => {
  const minusculo = { inQueue: 2, stagnantRate: 100, arrived30d: 0 };
  assert.equal(suggestsInbox(minusculo), false);
});

test('o limiar vem do backend e não é reescrito na tela', () => {
  assert.equal(readQueueHealth(producao).threshold, 180);
  assert.equal(readQueueHealth({ ...producao, stagnation_threshold_days: 90 }).threshold, 90);
});
