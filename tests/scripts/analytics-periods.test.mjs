import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ANALYTICS_TIMEZONE,
  matchAnalyticsPeriodPreset,
  resolveAnalyticsPeriod,
  resolveAnalyticsTimeseriesPeriod,
} from '../../apps/web/src/features/analytics/analytics-periods.ts';

test('usa o calendario operacional de Sao Paulo perto da meia-noite UTC', () => {
  assert.equal(ANALYTICS_TIMEZONE, 'America/Sao_Paulo');
  assert.deepEqual(
    resolveAnalyticsPeriod('month', new Date('2026-08-01T02:30:00Z')),
    { from: '2026-07-01', to: '2026-07-31' },
  );
});

test('usa as regras historicas de horario de verao, sem offset fixo', () => {
  assert.deepEqual(
    resolveAnalyticsPeriod('month', new Date('2018-12-01T01:30:00Z')),
    { from: '2018-11-01', to: '2018-11-30' },
  );
});

test('a janela padrao de serie usa o mesmo calendario operacional', () => {
  assert.deepEqual(
    resolveAnalyticsTimeseriesPeriod('month', new Date('2026-08-01T02:30:00Z')),
    { from: '2025-08-01', to: '2026-07-31' },
  );
});

test('identifica o preset do mês atual antes da primeira renderização', () => {
  assert.equal(
    matchAnalyticsPeriodPreset(
      { from: '2026-07-01', to: '2026-07-23' },
      new Date(2026, 6, 23),
    ),
    'month',
  );
});

test('mantém personalizado quando as datas não correspondem a um preset', () => {
  assert.equal(
    matchAnalyticsPeriodPreset(
      { from: '2026-07-02', to: '2026-07-23' },
      new Date(2026, 6, 23),
    ),
    '',
  );
});
