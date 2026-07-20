import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOmieReceivablesRequest, parseOmieCredentials, extractOmieReceivablesPage, fetchOmieReceivables, normalizeOmieApiReceivables, buildOmieClientsRequest, extractOmieClientsPage, enrichReceivablesWithClients } from '../../supabase/functions/_shared/omie.ts';

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

test('monta requisição de clientes sem tag apenas_importados_api (clientes_list_request)', () => {
  const request = buildOmieClientsRequest({ appKey: 'k', appSecret: 's' }, 3, 500);
  assert.equal(request.call, 'ListarClientesResumido');
  assert.deepEqual(request.param, [{ pagina: 3, registros_por_pagina: 500 }]);
});

test('extrai clientes de clientes_cadastro_resumido', () => {
  const page = extractOmieClientsPage({ pagina: 1, total_de_paginas: 2, clientes_cadastro_resumido: [{ codigo_cliente: 99, razao_social: 'ACME LTDA', cnpj_cpf: '12345678000199' }] });
  assert.equal(page.rows.length, 1);
  assert.equal(page.totalPages, 2);
});

test('enriquece títulos com nome/CNPJ do cliente por codigo_cliente_fornecedor', () => {
  const rows = [{ client_name: null, client_tax_id: null, raw_payload: { codigo_cliente_fornecedor: 99 } }];
  const clients = new Map([['99', { name: 'ACME LTDA', taxId: '12345678000199' }]]);
  enrichReceivablesWithClients(rows, clients);
  assert.equal(rows[0].client_name, 'ACME LTDA');
  assert.equal(rows[0].client_tax_id, '12345678000199');
});
