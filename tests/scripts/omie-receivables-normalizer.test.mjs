import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOmieReceivables } from '../../scripts/analytics/omie-receivables-normalizer.mjs';

test('normaliza contas a receber do export Omie sem transformar cancelamento em inadimplência', () => {
  const [row] = normalizeOmieReceivables([
    {
      'Situação': 'Cancelado',
      'Nota Fiscal / Cupom Fiscal': '123',
      'Cliente (Nome Fantasia)': 'Cliente A',
      'Cliente (CNPJ/CPF)': '00.000.000/0001-00',
      'Valor Líquido': 1000,
      'Valor Recebido': 0,
      Vencimento: 46100,
      'Data de Emissão': 46000,
    },
  ]);

  assert.equal(row.statusOriginal, 'Cancelado');
  assert.equal(row.balance, 1000);
  assert.equal(row.agingBucket, 'cancelado');
  assert.equal(row.qualityStatus, 'valid');
});

test('rejeita linha Omie sem cliente ou valor financeiro', () => {
  const [row] = normalizeOmieReceivables([
    { 'Situação': 'Atrasado', 'Cliente (Nome Fantasia)': '', 'Valor Líquido': null, 'Valor Recebido': 0 },
  ]);

  assert.equal(row.qualityStatus, 'rejected');
  assert.match(row.rejectionReason, /cliente|valor/i);
});
