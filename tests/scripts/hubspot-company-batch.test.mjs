import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HUBSPOT_COMPANY_BATCH_SIZE,
  buildHubSpotCompanyBatchUpdatePayload,
  chunkCompanyUpdates,
} from '../../supabase/functions/_shared/hubspot-company-batch.mjs';

test('divide atualizacoes de empresas no limite suportado pela API em lote', () => {
  const updates = Array.from({ length: 201 }, (_, index) => ({ id: String(index + 1), properties: { omie_saldo_aberto: String(index) } }));
  const chunks = chunkCompanyUpdates(updates);
  assert.equal(HUBSPOT_COMPANY_BATCH_SIZE, 100);
  assert.deepEqual(chunks.map((chunk) => chunk.length), [100, 100, 1]);
  assert.equal(chunks[2][0].id, '201');
});

test('monta payload oficial de batch update sem alterar propriedades', () => {
  const updates = [{ id: '123', properties: { omie_situacao_financeira: 'atrasado' } }];
  assert.deepEqual(buildHubSpotCompanyBatchUpdatePayload(updates), {
    inputs: [{ id: '123', properties: { omie_situacao_financeira: 'atrasado' } }],
  });
});
