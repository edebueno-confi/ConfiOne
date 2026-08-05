import assert from 'node:assert/strict';
import test from 'node:test';

import {
  analyticsSyncError,
  describeAnalyticsSyncFailure,
  formatAnalyticsSyncError,
} from '../../apps/web/src/features/analytics/analytics-sync-errors.mjs';

/** Termos de infraestrutura que a interface nunca pode exibir. */
const FORBIDDEN = [/Edge Function/i, /HTTP/i, /503/, /546/, /endpoint/i, /function/i, /worker/i, /Supabase/i];

const CASES = [
  { name: 'indisponível', input: { operation: 'OMIE', status: 503, payload: null } },
  { name: 'indisponível por código', input: { operation: 'OMIE', status: 500, payload: { code: 'BOOT_ERROR' } } },
  { name: 'tempo excedido na rodada', input: { operation: 'HubSpot', status: 546, payload: { code: 'WORKER_LIMIT' } } },
  { name: 'sem resposta no tempo esperado', input: { operation: 'HubSpot', status: 504, payload: null } },
  { name: 'já em andamento', input: { operation: 'OMIE', status: 409, payload: { code: 'OMIE_PROVIDER_BUSY' } } },
  { name: 'sessão expirada', input: { operation: 'OMIE', status: 401, payload: null } },
  { name: 'sem permissão', input: { operation: 'OMIE', status: 403, payload: null } },
  { name: 'configuração incompleta', input: { operation: 'OMIE', status: 424, payload: null } },
  { name: 'recusa genérica', input: { operation: 'OMIE', status: 500, payload: null } },
];

test('nenhuma mensagem exibida carrega termo de infraestrutura', () => {
  for (const item of CASES) {
    const message = formatAnalyticsSyncError(item.input);
    for (const pattern of FORBIDDEN) {
      assert.doesNotMatch(message, pattern, `caso "${item.name}" expôs ${pattern} em: ${message}`);
    }
  }
});

test('classes de erro diferentes produzem mensagens diferentes', () => {
  const messages = CASES.map((item) => formatAnalyticsSyncError(item.input));
  const distinct = new Set([
    messages[0], // indisponível
    messages[2], // tempo excedido
    messages[3], // sem resposta
    messages[4], // já em andamento
    messages[5], // sessão expirada
    messages[6], // sem permissão
    messages[7], // configuração incompleta
    messages[8], // recusa genérica
  ]);
  assert.equal(distinct.size, 8);
});

test('indisponibilidade diz o efeito e o que fazer', () => {
  assert.equal(
    formatAnalyticsSyncError({ operation: 'OMIE', status: 503, payload: null }),
    'A atualização do OMIE não pôde ser iniciada agora. O painel mantém o último estado publicado. Tente novamente em alguns minutos; se continuar, avise a equipe responsável pela plataforma.',
  );
});

test('tempo excedido orienta refazer por períodos menores', () => {
  assert.equal(
    formatAnalyticsSyncError({ operation: 'HubSpot', status: 546, payload: { code: 'WORKER_LIMIT' } }),
    'A atualização do HubSpot passou do tempo permitido para uma única rodada e foi interrompida. O painel mantém o último estado publicado. Refaça a atualização por períodos menores.',
  );
});

test('orienta aguardar quando já existe atualização do OMIE em andamento', () => {
  const message = formatAnalyticsSyncError({ operation: 'OMIE', status: 409, payload: { code: 'OMIE_PROVIDER_BUSY' } });
  assert.match(message, /OMIE/);
  assert.match(message, /Aguarde/);
});

test('texto cru devolvido pela origem não chega à interface', () => {
  const message = formatAnalyticsSyncError({
    operation: 'OMIE',
    status: 500,
    payload: { error: 'Edge Function boot error at /functions/v1/omie-sync (HTTP 503)' },
  });
  assert.doesNotMatch(message, /Edge Function/i);
  assert.doesNotMatch(message, /omie-sync/);
  assert.match(message, /Histórico de atualizações/);
});

test('detalhe técnico continua disponível fora da interface', () => {
  const input = { operation: 'OMIE', status: 503, payload: { code: 'BOOT_ERROR', error: 'boot failed' } };
  const detail = describeAnalyticsSyncFailure(input);
  assert.match(detail, /status=503/);
  assert.match(detail, /code=BOOT_ERROR/);
  assert.match(detail, /error=boot failed/);

  const error = analyticsSyncError(input);
  assert.equal(error.message, formatAnalyticsSyncError(input));
  assert.equal(error.cause, detail);
  for (const pattern of FORBIDDEN) {
    assert.doesNotMatch(error.message, pattern);
  }
});
