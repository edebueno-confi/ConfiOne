import type { HubSpotOwner, HubSpotRecord } from './hubspot.ts';

export interface CsMigrationRow {
  id?: string;
  sheet_name?: string;
  row_number: number;
  source_record_id: string;
  quality_status: string;
  rejection_reason?: string | null;
  payload: Record<string, unknown>;
}

export interface CsCompanyMatch {
  status: 'unique' | 'ambiguous' | 'none';
  method: 'hubspot_id' | 'cnpj_unique' | 'name_unique' | 'ambiguous' | 'none';
  company: HubSpotRecord | null;
  candidates: HubSpotRecord[];
}

export interface CsMigrationPlanItemSummary {
  status: string;
  operation: 'update' | 'create' | null;
}

export interface CsMigrationPreflight {
  mode: 'dry_run' | 'apply';
  sourceRows: number;
  validSourceRows: number;
  hubspotCompaniesLoaded: number;
  hubspotOwnersLoaded: number;
  companyCatalog: 'local_cache' | 'hubspot_live';
  requiresRehydrate: boolean;
  canApply: boolean;
}

export function buildCsMigrationPreflight(
  mode: 'dry_run' | 'apply',
  sourceRows: number,
  validSourceRows: number,
  hubspotCompaniesLoaded: number,
  hubspotOwnersLoaded: number,
): CsMigrationPreflight {
  const companiesLoaded = Math.max(0, hubspotCompaniesLoaded);
  return {
    mode,
    sourceRows: Math.max(0, sourceRows),
    validSourceRows: Math.max(0, validSourceRows),
    hubspotCompaniesLoaded: companiesLoaded,
    hubspotOwnersLoaded: Math.max(0, hubspotOwnersLoaded),
    companyCatalog: mode === 'apply' ? 'hubspot_live' : 'local_cache',
    requiresRehydrate: mode === 'dry_run' && companiesLoaded === 0,
    canApply: companiesLoaded > 0,
  };
}

export function countCsMigrationPlan(items: ReadonlyArray<CsMigrationPlanItemSummary>) {
  return {
    total_rows: items.length,
    planned_rows: items.filter((item) => item.operation && ['planned', 'updated', 'created'].includes(item.status)).length,
    ambiguous_rows: items.filter((item) => item.status === 'ambiguous').length,
    create_rows: items.filter((item) => item.operation === 'create' && ['planned', 'created'].includes(item.status)).length,
    update_rows: items.filter((item) => item.operation === 'update' && ['planned', 'updated'].includes(item.status)).length,
    skipped_rows: items.filter((item) => item.status === 'skipped').length,
    failed_rows: items.filter((item) => item.status === 'failed').length,
  };
}

export function findDuplicateSourceRecordIds(rows: ReadonlyArray<Pick<CsMigrationRow, 'source_record_id'>>): string[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const sourceRecordId = text(row.source_record_id);
    if (!sourceRecordId) continue;
    counts.set(sourceRecordId, (counts.get(sourceRecordId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([sourceRecordId]) => sourceRecordId)
    .sort();
}

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

export function normalizeDigits(value: unknown): string {
  return text(value).replace(/\.0+$/, '').replace(/\D/g, '');
}

export function normalizeCompanyName(value: unknown): string {
  return text(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function readPayload(payload: Record<string, unknown>, key: string): string {
  return text(payload[key]);
}

function parseAmount(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const normalized = raw.replace(/R\$\s?/gi, '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const amount = Number(normalized);
  return normalized && Number.isFinite(amount) ? amount.toFixed(2) : null;
}

export function buildCompanyProperties(payload: Record<string, unknown>, ownerId?: string | null): Record<string, string> {
  const properties: Record<string, string> = {};
  const name = readPayload(payload, 'nome_plataforma') || readPayload(payload, 'razao_social');
  const cnpj = readPayload(payload, 'cnpj');
  const mrr = parseAmount(readPayload(payload, 'mrr_mensal') || readPayload(payload, 'valor_mrr'));
  if (name) properties.name = name;
  if (cnpj) properties.cnpj = cnpj;
  if (mrr !== null) properties.aftersale___mrr = mrr;
  for (const [sourceKey, hubspotKey] of [
    ['tipo_mrr', 'tipo_de_mrr'],
    ['ativo', 'status_do_cliente___aftersale'],
    ['status_contrato', 'status_do_contrato'],
  ] as const) {
    const value = readPayload(payload, sourceKey);
    if (value) properties[hubspotKey] = value;
  }
  if (ownerId && /^\d{1,30}$/.test(ownerId)) properties.cs_owner___aftersale = ownerId;
  return properties;
}

function companyCnpj(company: HubSpotRecord): string {
  return normalizeDigits(company.properties.cnpj ?? company.properties.tax_id);
}

function companyName(company: HubSpotRecord): string {
  return normalizeCompanyName(company.properties.name);
}

export function matchCsCompany(payload: Record<string, unknown>, companies: HubSpotRecord[]): CsCompanyMatch {
  const hubspotId = normalizeDigits(payload.hubspot_id_normalized || payload.hubspot_id);
  if (hubspotId) {
    const byId = companies.find((company) => company.id === hubspotId);
    if (byId) return { status: 'unique', method: 'hubspot_id', company: byId, candidates: [byId] };
  }

  const cnpj = normalizeDigits(payload.cnpj_normalized || payload.cnpj);
  if (cnpj) {
    const byCnpj = companies.filter((company) => companyCnpj(company) === cnpj);
    if (byCnpj.length === 1) return { status: 'unique', method: 'cnpj_unique', company: byCnpj[0], candidates: byCnpj };
    if (byCnpj.length > 1) return { status: 'ambiguous', method: 'ambiguous', company: null, candidates: byCnpj };
  }

  const name = normalizeCompanyName(payload.nome_plataforma || payload.razao_social);
  if (name) {
    const byName = companies.filter((company) => companyName(company) === name);
    if (byName.length === 1) return { status: 'unique', method: 'name_unique', company: byName[0], candidates: byName };
    if (byName.length > 1) return { status: 'ambiguous', method: 'ambiguous', company: null, candidates: byName };
  }
  return { status: 'none', method: 'none', company: null, candidates: [] };
}

export function resolveOwnerId(value: unknown, owners: HubSpotOwner[]): string | null {
  const requested = normalizeCompanyName(value);
  if (!requested) return null;
  const matches = owners.filter((owner) => normalizeCompanyName(owner.fullName) === requested);
  return matches.length === 1 ? matches[0].ownerId : null;
}

export function toHubSpotRecord(row: Record<string, unknown>): HubSpotRecord {
  const raw = row.raw && typeof row.raw === 'object' ? row.raw as Record<string, unknown> : {};
  return {
    id: text(row.company_id),
    properties: Object.fromEntries(Object.entries({
      ...raw,
      name: row.name ?? raw.name ?? null,
      cnpj: row.tax_id ?? raw.cnpj ?? null,
      aftersale___mrr: row.mrr ?? raw.aftersale___mrr ?? null,
      status_do_cliente___aftersale: row.client_status ?? raw.status_do_cliente___aftersale ?? null,
      status_do_contrato: row.contract_status ?? raw.status_do_contrato ?? null,
      cs_owner___aftersale: row.cs_owner_id ?? raw.cs_owner___aftersale ?? null,
    }).map(([key, value]) => [key, value === null || value === undefined ? null : String(value)])),
  };
}
