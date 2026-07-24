import assert from 'node:assert/strict';
import test from 'node:test';

import { formatAnalyticsSyncError } from '../../apps/web/src/features/analytics/analytics-sync-errors.mjs';

test('identifica worker indisponivel quando a Edge Function responde 503', () => {
  assert.equal(
    formatAnalyticsSyncError({ operation: 'OMIE', status: 503, payload: null }),
    'O serviço de sincronização do OMIE está indisponível (HTTP 503). Verifique se a Edge Function está ativa e tente novamente.',
  );
});

test('orienta aguardar quando a API OMIE esta ocupada', () => {
  const message = formatAnalyticsSyncError({ operation: 'OMIE', status: 409, payload: { code: 'OMIE_PROVIDER_BUSY' } });
  assert.match(message, /OMIE/);
  assert.match(message, /Aguarde/);
});

test('explica limite de worker quando a Edge Function responde 546', () => {
  assert.equal(
    formatAnalyticsSyncError({ operation: 'HubSpot', status: 546, payload: { code: 'WORKER_LIMIT' } }),
    'A sincronização do HubSpot excedeu o limite de execução do worker (HTTP 546). Execute novamente em etapas menores.',
  );
});

test('preserva erro funcional retornado pela integração', () => {
  assert.equal(
    formatAnalyticsSyncError({ operation: 'OMIE', status: 502, payload: { error: 'Credencial Omie não configurada.' } }),
    'Credencial Omie não configurada.',
  );
});
