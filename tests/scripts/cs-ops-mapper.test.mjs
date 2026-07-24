import test from 'node:test';
import assert from 'node:assert/strict';
import { isCsOpsHeaderRow, mapCsOpsRow, mapCsOpsRows } from '../../supabase/functions/_shared/cs-ops.ts';

test('reconhece o cabeçalho mesmo quando a exportação desloca as linhas iniciais', () => {
  assert.equal(isCsOpsHeaderRow(['início', 'observação']), false);
  assert.equal(isCsOpsHeaderRow(['Cliente_ID', 'Nome_Plataforma', 'CNPJ']), true);
});

test('mapeia a linha BD_Clientes preservando chaves e contexto operacional', () => {
  const result = mapCsOpsRow({
    Cliente_ID: 68,
    Nome_Plataforma: 'Zinco',
    Razao_Social: 'Morena Rosa',
    CNPJ: '15.315.817/0001-26',
    Hubspot_ID: '4147148759.0',
    Responsavel_Final: 'Mary Laurentino',
    Health: 'Amarelo',
    Prioridade_CS: 'P3',
  }, 5);
  assert.equal(result.qualityStatus, 'valid');
  assert.equal(result.sourceRecordId, '68');
  assert.equal(result.payload.cnpj_normalized, '15315817000126');
  assert.equal(result.payload.hubspot_id_normalized, '4147148759');
  assert.equal(result.payload.responsavel_final, 'Mary Laurentino');
});

test('rejeita somente linhas sem qualquer identidade operacional', () => {
  const result = mapCsOpsRows([{ Ativo: 'Sim' }, { Cliente_ID: '10', Nome_Plataforma: 'Acme' }]);
  assert.equal(result.accepted, 1);
  assert.equal(result.rejected, 1);
  assert.match(result.mapped[0].rejectionReason, /identificador/i);
});
