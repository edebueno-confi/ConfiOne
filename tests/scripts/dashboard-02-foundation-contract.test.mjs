import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyAnalyticsState, createAnalyticsMetricResult, hasInvalidAnalyticsNumber, parseAnalyticsNumber } from '../../apps/web/src/features/analytics/analytics-state.ts';

test('zero real permanece fresh e diferente de null', () => {
  assert.equal(parseAnalyticsNumber(0), 0);
  assert.equal(classifyAnalyticsState({ source: 'HubSpot', queried: true, received: 0 }), 'empty');
  assert.equal(createAnalyticsMetricResult(0, { source: 'HubSpot', queried: true, received: 1 }).value, 0);
});

test('ausência de configuração e indisponibilidade não viram empty', () => {
  assert.equal(classifyAnalyticsState({ source: 'OMIE', sourceConfigured: false }), 'not_configured');
  assert.equal(classifyAnalyticsState({ source: 'OMIE', unavailable: true }), 'unavailable');
});

test('stale e partial são estados governados', () => {
  assert.equal(classifyAnalyticsState({ source: 'HubSpot', lastSuccessfulSyncAt: '2026-07-24T10:00:00Z', now: '2026-07-24T12:00:00Z', staleAfterMinutes: 60 }), 'stale');
  assert.equal(classifyAnalyticsState({ source: 'HubSpot', partial: true, received: 3, expected: 5 }), 'partial');
});

test('drift numérico é rejeitado sem descartar zero', () => {
  assert.equal(hasInvalidAnalyticsNumber('not-a-number'), true);
  assert.equal(hasInvalidAnalyticsNumber(0), false);
  assert.equal(parseAnalyticsNumber('12.5'), 12.5);
});
