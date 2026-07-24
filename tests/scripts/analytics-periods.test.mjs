import assert from 'node:assert/strict';
import test from 'node:test';

import { matchAnalyticsPeriodPreset } from '../../apps/web/src/features/analytics/analytics-periods.ts';

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
