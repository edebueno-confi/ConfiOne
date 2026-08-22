import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCommercialComparisons,
  calculateComparisonDelta,
  resolvePreviousComparablePeriod,
} from '../../apps/web/src/features/analytics/analytics-commercial-comparison.mjs';

test('deriva o período anterior com a mesma duração inclusive', () => {
  assert.deepEqual(
    resolvePreviousComparablePeriod({ from: '2026-08-01', to: '2026-08-31' }),
    { from: '2026-07-01', to: '2026-07-31' },
  );
  assert.deepEqual(
    resolvePreviousComparablePeriod({ from: '2026-03-10', to: '2026-03-12' }),
    { from: '2026-03-07', to: '2026-03-09' },
  );
});

test('não inventa comparação para período aberto ou inválido', () => {
  assert.equal(resolvePreviousComparablePeriod({ from: '', to: '' }), null);
  assert.equal(resolvePreviousComparablePeriod({ from: '2026-03-12', to: '2026-03-10' }), null);
  assert.equal(resolvePreviousComparablePeriod({ from: '2026-02-30', to: '2026-03-02' }), null);
});

test('calcula delta absoluto e percentual relativo sem dividir por zero', () => {
  assert.deepEqual(calculateComparisonDelta(120, 100), { absolute: 20, relativePercent: 20 });
  assert.deepEqual(calculateComparisonDelta(50, 0), { absolute: 50, relativePercent: null });
  assert.equal(calculateComparisonDelta(null, 10), null);
});

test('preserva estados sem fonte e calcula win rate em pontos de leitura', () => {
  const current = {
    kpis: {
      created_deals: { state: 'available', value: 12 },
      won_deals: { state: 'partial', value: 6 },
      lost_deals: { state: 'available', value: 2 },
      won_amount: { state: 'available', value: 9000 },
      win_rate: { state: 'available', value: 75 },
      stage_aging_days: { state: 'awaiting_history', value: null },
    },
  };
  const previous = {
    kpis: {
      created_deals: { state: 'available', value: 8 },
      won_deals: { state: 'available', value: 4 },
      lost_deals: { state: 'available', value: 4 },
      won_amount: { state: 'available', value: 6000 },
      win_rate: { state: 'available', value: 50 },
    },
  };
  const rows = buildCommercialComparisons(current, previous);
  assert.deepEqual(rows.find((row) => row.key === 'created_deals').delta, { absolute: 4, relativePercent: 50 });
  assert.deepEqual(rows.find((row) => row.key === 'win_rate').delta, { absolute: 25, relativePercent: 50 });
  assert.equal(rows.find((row) => row.key === 'won_deals').current.state, 'partial');
});
