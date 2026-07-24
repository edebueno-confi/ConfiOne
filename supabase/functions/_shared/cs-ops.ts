export const CS_OPS_SOURCE_KEY = 'cs_ops_consolidated';
export const CS_OPS_SHEET_NAME = 'BD_Clientes';
export const CS_OPS_MAPPING_VERSION = 'cs-ops-v1';

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

function normalizeHeader(value: unknown): string {
  return text(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeDigits(value: unknown): string {
  const raw = text(value).replace(/\.0+$/, '');
  return raw.replace(/\D/g, '');
}

function createReader(row: Record<string, unknown>) {
  const values = new Map(Object.entries(row).map(([key, value]) => [normalizeHeader(key), text(value)]));
  return (...aliases: string[]) => {
    for (const alias of aliases) {
      const value = values.get(normalizeHeader(alias));
      if (value) return value;
    }
    return '';
  };
}

export function isCsOpsHeaderRow(row: unknown[]): boolean {
  const headers = row.map(normalizeHeader);
  return headers.includes('clienteid') && headers.includes('nomeplataforma');
}

export interface CsOpsMappedRow {
  sourceRecordId: string;
  payload: Record<string, unknown>;
  qualityStatus: 'valid' | 'rejected';
  rejectionReason: string | null;
}

export function mapCsOpsRow(row: Record<string, unknown>, rowNumber: number): CsOpsMappedRow {
  const read = createReader(row);
  const clienteId = read('Cliente_ID', 'Cliente ID');
  const platformName = read('Nome_Plataforma', 'Nome Plataforma', 'Cliente');
  const legalName = read('Razao_Social', 'Razao Social');
  const cnpj = read('CNPJ', 'CPF/CNPJ');
  const hubspotId = read('Hubspot_ID', 'HubSpot ID', 'Hubspot ID');
  const payload = {
    cliente_id: clienteId || null,
    nome_plataforma: platformName || null,
    razao_social: legalName || null,
    cnpj: cnpj || null,
    cnpj_normalized: normalizeDigits(cnpj) || null,
    hubspot_id: hubspotId || null,
    hubspot_id_normalized: normalizeDigits(hubspotId) || null,
    ativo: read('Ativo') || null,
    teste: read('Teste') || null,
    status_contrato: read('Status_Contrato', 'Status Contrato') || null,
    servico: read('Servico', 'Serviço') || null,
    tipo_mrr: read('Tipo_MRR', 'Tipo MRR') || null,
    valor_mrr: read('Valor_MRR', 'Valor MRR') || null,
    mrr_mensal: read('MRR_Mensal', 'MRR Mensal') || null,
    status_migracao: read('Status_Migracao', 'Status Migração') || null,
    expectativa_migracao: read('Expectativa_Migracao', 'Expectativa Migração') || null,
    cluster_final: read('Cluster_Final', 'Cluster Final') || null,
    carteira_final: read('Carteira_Final', 'Carteira Final') || null,
    responsavel_final: read('Responsavel_Final', 'Responsável Final') || null,
    modelo_atendimento: read('Modelo_Atendimento', 'Modelo Atendimento') || null,
    frequencia_contato: read('Frequencia_Contato', 'Frequência Contato') || null,
    health: read('Health') || null,
    prioridade_cs: read('Prioridade_CS', 'Prioridade CS') || null,
    observacoes_cs: read('Observacoes_CS', 'Observações CS') || null,
    source_row_number: rowNumber,
  };
  const rejectionReason = platformName || legalName || clienteId ? null : 'cliente sem identificador, nome ou razão social';
  return {
    sourceRecordId: clienteId || `row:${rowNumber}`,
    payload,
    qualityStatus: rejectionReason ? 'rejected' : 'valid',
    rejectionReason,
  };
}

export function mapCsOpsRows(rows: Record<string, unknown>[]): { mapped: CsOpsMappedRow[]; accepted: number; rejected: number } {
  const mapped = rows.map((row, index) => mapCsOpsRow(row, index + 5));
  return {
    mapped,
    accepted: mapped.filter((row) => row.qualityStatus === 'valid').length,
    rejected: mapped.filter((row) => row.qualityStatus === 'rejected').length,
  };
}
