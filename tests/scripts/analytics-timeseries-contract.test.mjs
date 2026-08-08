import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TIMESERIES_GRAINS,
  describeCohorts,
  grainLabel,
  measureBasis,
  readTimeseries,
} from '../../apps/web/src/features/analytics/analytics-timeseries-contract.mjs';

// A regra que estes testes protegem: a tela nunca desenha uma linha que o dado
// não sustenta. Série ausente, vazia ou inteiramente em zero são todas
// indisponíveis, e cada uma delas por um motivo diferente de código.

test('payload ausente é indisponível, não gráfico vazio', () => {
  const reading = readTimeseries(null);
  assert.equal(reading.available, false);
  assert.deepEqual(reading.points, []);
  assert.match(reading.reason, /histórico/i);
});

test('motivo declarado pelo backend chega traduzido para a tela', () => {
  const reading = readTimeseries({ series: [], unavailable_reason: 'history_insufficient', grain: 'month' });
  assert.equal(reading.available, false);
  assert.match(reading.reason, /histórico suficiente/i);
  // Nenhum código técnico pode vazar para a apresentação.
  assert.doesNotMatch(reading.reason, /history_insufficient/);
});

test('motivo desconhecido não vira texto cru na tela', () => {
  const reading = readTimeseries({ series: [], unavailable_reason: 'algo_novo_do_backend' });
  assert.equal(reading.available, false);
  assert.doesNotMatch(reading.reason, /algo_novo_do_backend/);
});

test('lista vazia é indisponível', () => {
  const reading = readTimeseries({ series: [], grain: 'month' });
  assert.equal(reading.available, false);
});

test('série inteiramente em zero é indisponível, não "nada aconteceu"', () => {
  const payload = {
    grain: 'month',
    series: [
      { period: '2026-01-01', opened: 0, resolved: 0 },
      { period: '2026-02-01', opened: 0, resolved: 0 },
    ],
  };
  assert.equal(readTimeseries(payload, ['opened', 'resolved']).available, false);
});

test('um único período com sinal já sustenta a série', () => {
  const payload = {
    grain: 'month',
    series: [
      { period: '2026-01-01', opened: 0, resolved: 0 },
      { period: '2026-02-01', opened: 12, resolved: 0 },
    ],
  };
  const reading = readTimeseries(payload, ['opened', 'resolved']);
  assert.equal(reading.available, true);
  assert.equal(reading.points.length, 2);
});

test('sem medidas declaradas, a checagem de sinal não é aplicada', () => {
  const payload = { grain: 'month', series: [{ period: '2026-01-01', opened: 0 }] };
  assert.equal(readTimeseries(payload).available, true);
});

test('grão inválido cai em mês em vez de propagar valor estranho', () => {
  assert.equal(readTimeseries({ grain: 'trimestre', series: [{ x: 1 }] }).grain, 'month');
  assert.deepEqual(TIMESERIES_GRAINS, ['day', 'week', 'month']);
});

test('rótulo do grão é sempre uma frase em português', () => {
  assert.equal(grainLabel('month'), 'Por mês');
  assert.equal(grainLabel('week'), 'Por semana');
  assert.equal(grainLabel('day'), 'Por dia');
  assert.equal(grainLabel('inexistente'), 'Por mês');
});

test('coorte sem legenda declarada devolve nulo em vez de texto inventado', () => {
  assert.equal(measureBasis({ opened: 'Considera a abertura.' }, 'opened'), 'Considera a abertura.');
  assert.equal(measureBasis({}, 'opened'), null);
  assert.equal(measureBasis(null, 'opened'), null);
  assert.equal(measureBasis({ opened: '' }, 'opened'), null);
});

test('coortes vêm na ordem pedida e sem lacunas', () => {
  const legend = { opened: 'A', balance: 'C' };
  assert.deepEqual(describeCohorts(legend, ['opened', 'resolved', 'balance']), ['A', 'C']);
});

test('legenda ausente não quebra a leitura', () => {
  const reading = readTimeseries({ series: [{ period: '2026-01-01', opened: 3 }] }, ['opened']);
  assert.deepEqual(reading.legend, {});
  assert.deepEqual(describeCohorts(reading.legend, ['opened']), []);
});
