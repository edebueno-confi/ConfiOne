import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyCsSource,
  hasValidCsIncrementalBoundary,
  resolveCsLoadMode,
  shouldAdvanceCsWatermark,
} from '../../supabase/functions/_shared/analytics-cs-source-contract.mjs';

test('legado success/0 nao e fronteira incremental', () => {
  const legacy = { status: 'success', domain_key: 'cs', source_total: 0, source_state: null };
  assert.equal(hasValidCsIncrementalBoundary(legacy), false);
  assert.equal(resolveCsLoadMode(legacy), 'full');
});

test('fonte CS positiva sem registros recebidos fica partial', () => {
  assert.equal(classifyCsSource({ total: 12, recordsReceived: 0, pagesComplete: true, fullLoad: true }), 'partial');
});

test('fonte CS sem registros pode ser empty authoritative', () => {
  const state = classifyCsSource({ total: 0, recordsReceived: 0, pagesComplete: true, fullLoad: true });
  assert.equal(state, 'empty_authoritative');
  assert.equal(shouldAdvanceCsWatermark(state), true);
});

test('falha de acesso ou paginaçao nunca avanca watermark', () => {
  assert.equal(classifyCsSource({ statusCode: 403 }), 'failed');
  assert.equal(classifyCsSource({ total: 10, recordsReceived: 10, pagesComplete: false }), 'partial');
  assert.equal(shouldAdvanceCsWatermark('failed'), false);
  assert.equal(shouldAdvanceCsWatermark('partial'), false);
});

test('incremental sem alteracoes continua completo sem declarar fonte vazia', () => {
  assert.equal(classifyCsSource({ total: 0, recordsReceived: 0, pagesComplete: true, fullLoad: false }), 'complete');
});

test('evidencia completa positiva e fronteira valida', () => {
  const state = classifyCsSource({ total: 12, recordsReceived: 12, pagesComplete: true, fullLoad: true });
  assert.equal(state, 'complete');
  assert.equal(shouldAdvanceCsWatermark(state), true);
  assert.equal(hasValidCsIncrementalBoundary({ status: 'success', domain_key: 'cs', source_total: 12, source_state: 'complete' }), true);
});
