const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);

function excelSerialToIso(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return new Date(EXCEL_EPOCH_MS + value * 86400000).toISOString().slice(0, 10);
}

function numberValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function agingBucket(status) {
  const normalized = status.toLowerCase();
  if (normalized.includes('cancel')) return 'cancelado';
  if (normalized.includes('parcial')) return 'recebido_parcialmente';
  if (normalized === 'recebido') return 'recebido';
  if (normalized.includes('atrasado')) return 'atrasado';
  if (normalized.includes('vence hoje')) return 'vence_hoje';
  if (normalized.includes('a vencer')) return 'a_vencer';
  return 'indisponivel';
}

export function normalizeOmieReceivables(rows) {
  return rows.map((raw, index) => {
    const statusOriginal = String(raw['Situação'] ?? '').trim();
    const clientName = String(raw['Cliente (Nome Fantasia)'] ?? '').trim();
    const netAmount = numberValue(raw['Valor Líquido']);
    const receivedAmount = numberValue(raw['Valor Recebido']) ?? 0;
    const rejectionReasons = [];
    if (!clientName) rejectionReasons.push('cliente ausente');
    if (netAmount === null) rejectionReasons.push('valor líquido ausente ou inválido');
    if (!statusOriginal) rejectionReasons.push('situação ausente');

    return {
      sourceRowNumber: index + 1,
      statusOriginal: statusOriginal || null,
      agingBucket: agingBucket(statusOriginal),
      documentNumber: String(raw['Nota Fiscal / Cupom Fiscal'] ?? '').trim() || null,
      clientName: clientName || null,
      clientTaxId: String(raw['Cliente (CNPJ/CPF)'] ?? '').trim() || null,
      netAmount,
      receivedAmount,
      balance: netAmount === null ? null : Math.max(netAmount - receivedAmount, 0),
      dueDate: excelSerialToIso(raw.Vencimento),
      issuedDate: excelSerialToIso(raw['Data de Emissão']),
      qualityStatus: rejectionReasons.length ? 'rejected' : 'valid',
      rejectionReason: rejectionReasons.join('; ') || null,
      raw,
    };
  });
}
