import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOmieReceivablesRequest, parseOmieCredentials, extractOmieReceivablesPage, fetchOmieReceivables, normalizeOmieApiReceivables, buildOmieClientsRequest, extractOmieClientsPage, fetchOmieClientsIndex, enrichReceivablesWithClients, deriveOmieSourceRecordId } from '../../supabase/functions/_shared/omie.ts';
import { stageOmieRowsInBatches, OMIE_STAGING_BATCH_SIZE } from '../../supabase/functions/_shared/omie-sync-service.ts';

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
  const { accepted: [row] } = normalizeOmieApiReceivables([
    { nCodTitulo: 10, nValorTitulo: '1234.56', nValorPago: '234,56', dDtVenc: '31/12/2030', cStatus: 'A vencer' },
  ], 'sync-1');
  assert.equal(row.net_amount, 1234.56);
  assert.equal(row.received_amount, 234.56);
  assert.equal(row.balance, 1000);
});

test('deriva identidade Omie estavel sem depender da ordem da carga', () => {
  const first = deriveOmieSourceRecordId({ codigo_cliente_fornecedor: 42, cNumDocFiscal: 'NF-9', nParcela: 2, dDtVenc: '31/12/2030', nValorTitulo: '1234.56' });
  const reordered = deriveOmieSourceRecordId({ nValorTitulo: '1234.56', dDtVenc: '31/12/2030', nParcela: 2, cNumDocFiscal: 'NF-9', codigo_cliente_fornecedor: 42 });
  assert.ok(first);
  assert.equal(first, reordered);
  assert.match(first, /^omie-v3:/);
});

test('diferencia vencimento, valor e normaliza formatos equivalentes', () => {
  const base = { codigo_cliente_fornecedor: 42, cNumDocFiscal: 'NF-9', nParcela: 2, dDtVenc: '31/12/2030', nValorTitulo: '1.234,56' };
  assert.equal(deriveOmieSourceRecordId(base), deriveOmieSourceRecordId({ ...base, dDtVenc: '2030-12-31', nValorTitulo: '1234.560' }));
  assert.notEqual(deriveOmieSourceRecordId(base), deriveOmieSourceRecordId({ ...base, dDtVenc: '01/01/2031' }));
  assert.notEqual(deriveOmieSourceRecordId(base), deriveOmieSourceRecordId({ ...base, nValorTitulo: '1234.57' }));
  assert.notEqual(deriveOmieSourceRecordId(base), deriveOmieSourceRecordId({ ...base, nParcela: 3 }));
});

test('prioriza ID oficial e retorna rejeicoes explicitas sem payload sensivel', () => {
  const normalized = normalizeOmieApiReceivables([
    { nCodTitulo: 10, nValorTitulo: '10,00', dDtVenc: '31/12/2030', cCNPJ: '12345678000199' },
    { nValorTitulo: '10,00', dDtVenc: '31/12/2030' },
  ], 'sync-1');
  assert.match(String(normalized.accepted[0].source_record_id), /^omie-v3:id:/);
  assert.equal(normalized.summary.rejected, 1);
  assert.equal(normalized.rejected[0].reasonCode, 'missing_official_id_and_composite_fields');
  assert.equal(JSON.stringify(normalized.rejected).includes('12345678000199'), false);
});

test('nao cria identidade posicional para titulo sem identificador estavel', () => {
  assert.equal(deriveOmieSourceRecordId({ cStatus: 'A vencer', nValorTitulo: 10 }), null);
});

test('rejeita pagina Omie que retrocede ou repete o numero informado', async () => {
  await assert.rejects(
    fetchOmieReceivables({ appKey: 'a', appSecret: 'b' }, async (_url, init) => {
      const page = JSON.parse(String(init?.body ?? '{}')).param[0].pagina;
      return new Response(JSON.stringify({ pagina: page === 1 ? 1 : 1, total_de_paginas: 2, conta_receber_cadastro: [{ codigo_lancamento_omie: page }] }), { status: 200 });
    }, { timeoutMs: 1000, maxRetries: 0 }),
    /pagina|progresso/i,
  );
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

test('busca páginas de contas a receber em série e preserva a ordem', async () => {
  let active = 0;
  let maxActive = 0;
  const rows = await fetchOmieReceivables({ appKey: 'a', appSecret: 'b' }, async (_url, init) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    const body = JSON.parse(String(init?.body ?? '{}'));
    const page = body.param[0].pagina;
    await new Promise((resolve) => setTimeout(resolve, page === 1 ? 1 : 10));
    active -= 1;
    return new Response(JSON.stringify({
      pagina: page,
      total_de_paginas: 4,
      conta_receber_cadastro: [{ codigo_lancamento_omie: page }],
    }), { status: 200 });
  }, { timeoutMs: 1000, maxRetries: 0 });

  assert.equal(maxActive, 1);
  assert.deepEqual(rows.map((row) => row.codigo_lancamento_omie), [1, 2, 3, 4]);
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

test('busca páginas de clientes em série', async () => {
  let active = 0;
  let maxActive = 0;
  const clients = await fetchOmieClientsIndex({ appKey: 'a', appSecret: 'b' }, async (_url, init) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    const body = JSON.parse(String(init?.body ?? '{}'));
    const page = body.param[0].pagina;
    await new Promise((resolve) => setTimeout(resolve, page === 1 ? 1 : 10));
    active -= 1;
    return new Response(JSON.stringify({
      pagina: page,
      total_de_paginas: 4,
      clientes_cadastro_resumido: [{ codigo_cliente: page, razao_social: `Cliente ${page}` }],
    }), { status: 200 });
  }, { timeoutMs: 1000, maxRetries: 0, maxPages: 10 });

  assert.equal(maxActive, 1);
  assert.deepEqual([...clients.keys()], ['1', '2', '3', '4']);
});

test('enriquece títulos com nome/CNPJ do cliente por codigo_cliente_fornecedor', () => {
  const rows = [{ client_name: null, client_tax_id: null, raw_payload: { codigo_cliente_fornecedor: 99 } }];
  const clients = new Map([['99', { name: 'ACME LTDA', taxId: '12345678000199' }]]);
  enrichReceivablesWithClients(rows, clients);
  assert.equal(rows[0].client_name, 'ACME LTDA');
  assert.equal(rows[0].client_tax_id, '12345678000199');
});

test('persiste staging em lotes governados e retorna contagens', async () => {
  const batches = [];
  const client = { from: () => ({ insert: async (rows) => { batches.push(rows); return { error: null }; } }) };
  const result = await stageOmieRowsInBatches(client, Array.from({ length: OMIE_STAGING_BATCH_SIZE + 2 }, (_, index) => ({ index })));
  assert.deepEqual(result, { stagedRows: OMIE_STAGING_BATCH_SIZE + 2, batchCount: 2 });
  assert.equal(batches[0].length, OMIE_STAGING_BATCH_SIZE);
  assert.equal(batches[1].length, 2);
});

test('falha de lote interrompe a persistência imediatamente', async () => {
  let calls = 0;
  const client = { from: () => ({ insert: async () => { calls += 1; return { error: new Error('falha controlada') }; } }) };
  await assert.rejects(stageOmieRowsInBatches(client, Array.from({ length: OMIE_STAGING_BATCH_SIZE + 2 }, (_, index) => ({ index }))), /falha controlada/);
  assert.equal(calls, 1);
});

test('falha em lote intermediário ou final não envia lotes seguintes', async () => {
  for (const failingBatch of [2, 3]) {
    let calls = 0;
    const client = { from: () => ({ insert: async () => { calls += 1; return calls === failingBatch ? { error: new Error(`falha lote ${failingBatch}`) } : { error: null }; } }) };
    const rows = Array.from({ length: OMIE_STAGING_BATCH_SIZE * 3 }, (_, index) => ({ index }));
    await assert.rejects(stageOmieRowsInBatches(client, rows), new RegExp(`falha lote ${failingBatch}`));
    assert.equal(calls, failingBatch);
  }
});
