import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOmieReceivablesRequest, parseOmieCredentials, extractOmieReceivablesPage, fetchOmieReceivables, normalizeOmieApiReceivables } from '../../supabase/functions/_shared/omie.ts';

test('monta requisição paginada da API Omie sem expor segredo', () => {
  const request = buildOmieReceivablesRequest({ appKey: 'key', appSecret: 'secret' }, 2, 500);
  assert.deepEqual(request.param, [{ pagina: 2, registros_por_pagina: 500, apenas_importado_api: 'N' }]);
  assert.equal(request.call, 'ListarContasReceber');
  assert.equal(request.app_key, 'key');
  assert.equal(request.app_secret, 'secret');
});

test('aceita credencial Omie em JSON ou formato app_key|app_secret', () => {
  assert.deepEqual(parseOmieCredentials('{"app_key":"a","app_secret":"b"}'), { appKey: 'a', appSecret: 'b' });
  assert.deepEqual(parseOmieCredentials('a|b'), { appKey: 'a', appSecret: 'b' });
  assert.throws(() => parseOmieCredentials('incompleta'), /credencial/i);
});

test('extrai página e metadados de contas a receber', () => {
  const page = extractOmieReceivablesPage({ pagina: 1, total_de_paginas: 3, conta_receber_cadastro: [{ codigo_lancamento_omie: 10 }] });
  assert.deepEqual(page.rows, [{ codigo_lancamento_omie: 10 }]);
  assert.equal(page.page, 1);
  assert.equal(page.totalPages, 3);
});

test('normaliza valores decimais da API sem transformar ponto decimal em milhar', () => {
  const [row] = normalizeOmieApiReceivables([
    { nCodTitulo: 10, nValorTitulo: '1234.56', nValorPago: '234,56', dDtVenc: '31/12/2030', cStatus: 'A vencer' },
  ], 'sync-1');
  assert.equal(row.net_amount, 1234.56);
  assert.equal(row.received_amount, 234.56);
  assert.equal(row.balance, 1000);
});

test('faz retry apenas para falhas transitórias da API Omie', async () => {
  let calls = 0;
  const rows = await fetchOmieReceivables({ appKey: 'a', appSecret: 'b' }, async () => {
    calls += 1;
    if (calls === 1) return new Response('temporário', { status: 503 });
    return new Response(JSON.stringify({ pagina: 1, total_de_paginas: 1, conta_receber_cadastro: [{ codigo_lancamento_omie: 10 }] }), { status: 200 });
  }, { timeoutMs: 1000, maxRetries: 1 });
  assert.equal(calls, 2);
  assert.deepEqual(rows, [{ codigo_lancamento_omie: 10 }]);
});
