import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOmieReceivablesRequest, parseOmieCredentials, extractOmieReceivablesPage, fetchOmieReceivables, fetchOmieReceivablesWithMetadata, normalizeOmieApiReceivables, buildOmieClientsRequest, extractOmieClientsPage, fetchOmieClientsIndex, fetchOmieClientsIndexWithMetadata, enrichReceivablesWithClients, deriveOmieSourceRecordId, classifyOmieError, OmieProviderError } from '../../supabase/functions/_shared/omie.ts';
import { stageOmieRowsInBatches, OMIE_STAGING_BATCH_SIZE, publishOmieClientIndexCache, OMIE_CLIENT_INDEX_RPC_BATCH_SIZE } from '../../supabase/functions/_shared/omie-sync-service.ts';

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

test('classifica erro OMIE sem devolver detalhe sensível à camada de apresentação', () => {
  const error = classifyOmieError(new Error('Omie Contas a Receber falhou (500): SOAP-ENV:Server SOAP-ERROR: Unexpected response from server.'));
  assert.ok(error instanceof OmieProviderError);
  assert.equal(error.code, 'provider_transient_error');
  assert.equal(error.retryable, true);
  assert.match(error.sanitizedMessage, /não concluiu/i);
  assert.doesNotMatch(error.sanitizedMessage, /SOAP|endpoint|secret/i);
  assert.match(error.internalMessage, /500/);
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

test('classifica cobertura vazia autoritativa, ambigua e inconsistente', async () => {
  const fetchPage = (payload) => async () => new Response(JSON.stringify(payload), { status: 200 });
  const authoritative = await fetchOmieReceivablesWithMetadata({ appKey: 'a', appSecret: 'b' }, fetchPage({ pagina: 1, total_de_paginas: 1, total_de_registros: 0, conta_receber_cadastro: [] }), { maxRetries: 0 });
  assert.deepEqual(authoritative.metadata, { totalPages: 1, totalRecords: 0, returnedRecords: 0 });
  const ambiguous = await fetchOmieReceivablesWithMetadata({ appKey: 'a', appSecret: 'b' }, fetchPage({ pagina: 1, total_de_paginas: 1, conta_receber_cadastro: [] }), { maxRetries: 0 });
  assert.equal(ambiguous.metadata.totalRecords, null);
  await assert.rejects(fetchOmieReceivablesWithMetadata({ appKey: 'a', appSecret: 'b' }, fetchPage({ pagina: 1, total_de_paginas: 1, total_de_registros: 2, conta_receber_cadastro: [] }), { maxRetries: 0 }), /COUNT_MISMATCH/);
});

test('rejeita página vazia intermediária e fault funcional em HTTP 200', async () => {
  await assert.rejects(fetchOmieReceivablesWithMetadata({ appKey: 'a', appSecret: 'b' }, async () => new Response(JSON.stringify({ pagina: 1, total_de_paginas: 2, total_de_registros: 1, conta_receber_cadastro: [] }), { status: 200 }), { maxRetries: 0 }), /EMPTY_PAGE_BEFORE_END/);
  await assert.rejects(fetchOmieReceivablesWithMetadata({ appKey: 'a', appSecret: 'b' }, async () => new Response(JSON.stringify({ faultcode: 'E', faultstring: 'erro funcional' }), { status: 200 }), { maxRetries: 0 }), /FUNCTIONAL_FAULT/);
});

test('faz retry apenas para falhas transitórias da API Omie', async () => {
  let calls = 0;
  const rows = await fetchOmieReceivables({ appKey: 'a', appSecret: 'b' }, async () => {
    calls += 1;
    if (calls === 1) return new Response('temporário', { status: 503 });
    return new Response(JSON.stringify({ pagina: 1, total_de_paginas: 1, total_de_registros: 1, conta_receber_cadastro: [{ codigo_lancamento_omie: 10 }] }), { status: 200 });
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
      total_de_registros: 4,
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
  const result = enrichReceivablesWithClients(rows, clients);
  assert.deepEqual(result.stats, { matched: 1, unmatched: 0, fieldsUpdated: 2 });
  assert.equal(rows[0].client_name, 'ACME LTDA');
  assert.equal(rows[0].client_tax_id, '12345678000199');
});

test('enriches a title when OMIE nests the customer code in details', () => {
  const rows = [{ client_name: null, client_tax_id: null, raw_payload: { detalhes: { codigo_cliente_fornecedor: 99 } } }];
  const clients = new Map([['99', { name: 'ACME LTDA', taxId: '12345678000199', tradeName: 'ACME' }]]);

  const result = enrichReceivablesWithClients(rows, clients);

  assert.deepEqual(result.stats, { matched: 1, unmatched: 0, fieldsUpdated: 3 });
  assert.equal(rows[0].client_name, 'ACME LTDA');
  assert.equal(rows[0].client_tax_id, '12345678000199');
  assert.equal(rows[0].client_trade_name, 'ACME');
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
test('publica indice OMIE em lotes e troca o ponteiro somente no commit', async () => {
  const calls = [];
  const client = {
    rpc: async (name, args) => {
      calls.push({ name, args });
      if (name === 'rpc_service_begin_omie_client_index') return { data: 'snapshot-1', error: null };
      if (name === 'rpc_service_commit_omie_client_index') return { data: { row_count: OMIE_CLIENT_INDEX_RPC_BATCH_SIZE + 1 }, error: null };
      return { data: OMIE_CLIENT_INDEX_RPC_BATCH_SIZE, error: null };
    },
  };
  const index = new Map(Array.from({ length: OMIE_CLIENT_INDEX_RPC_BATCH_SIZE + 1 }, (_, value) => [String(value + 1), { name: `Cliente ${value + 1}`, taxId: null, tradeName: null }]));
  const count = await publishOmieClientIndexCache(client, 'run-1', index, '2026-08-12T00:00:00.000Z');
  assert.equal(count, OMIE_CLIENT_INDEX_RPC_BATCH_SIZE + 1);
  assert.equal(calls[0].name, 'rpc_service_begin_omie_client_index');
  assert.deepEqual(calls.slice(1).map(({ name, args }) => [name, args.p_rows?.length ?? null]), [
    ['rpc_service_append_omie_client_index', OMIE_CLIENT_INDEX_RPC_BATCH_SIZE],
    ['rpc_service_append_omie_client_index', 1],
    ['rpc_service_commit_omie_client_index', null],
  ]);
});
test('indice OMIE parcial nunca e classificado como snapshot completo', async () => {
  const result = await fetchOmieClientsIndexWithMetadata({ appKey: 'a', appSecret: 'b' }, async (_url, init) => {
    const page = JSON.parse(String(init?.body ?? '{}')).param[0].pagina;
    if (page === 1) {
      return new Response(JSON.stringify({ pagina: 1, total_de_paginas: 2, clientes_cadastro_resumido: [{ codigo_cliente: 1, razao_social: 'Cliente 1' }] }), { status: 200 });
    }
    return new Response('falha controlada', { status: 503 });
  }, { timeoutMs: 1000, maxRetries: 0, maxPages: 10 });

  assert.equal(result.complete, false);
  assert.equal(result.pages, 1);
  assert.deepEqual([...result.index.keys()], ['1']);
});

test('limite de paginas nunca transforma indice truncado em snapshot completo', async () => {
  const result = await fetchOmieClientsIndexWithMetadata({ appKey: 'a', appSecret: 'b' }, async (_url, init) => {
    const page = JSON.parse(String(init?.body ?? '{}')).param[0].pagina;
    return new Response(JSON.stringify({
      pagina: page,
      total_de_paginas: 3,
      clientes_cadastro_resumido: [{ codigo_cliente: page, razao_social: `Cliente ${page}` }],
    }), { status: 200 });
  }, { timeoutMs: 1000, maxRetries: 0, maxPages: 2 });

  assert.equal(result.complete, false);
  assert.equal(result.pages, 1);
  assert.deepEqual([...result.index.keys()], ['1']);
});

test('pagina OMIE vazia antes do fim invalida o snapshot do indice', async () => {
  const result = await fetchOmieClientsIndexWithMetadata({ appKey: 'a', appSecret: 'b' }, async (_url, init) => {
    const page = JSON.parse(String(init?.body ?? '{}')).param[0].pagina;
    return new Response(JSON.stringify({ pagina: page, total_de_paginas: 2, clientes_cadastro_resumido: [] }), { status: 200 });
  }, { timeoutMs: 1000, maxRetries: 0, maxPages: 10 });

  assert.equal(result.complete, false);
  assert.equal(result.pages, 1);
  assert.equal(result.records, 0);
});
