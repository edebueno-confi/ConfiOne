export type CustomerRelationshipSource = 'hubspot_cache' | 'unavailable';

export interface CustomerRelationshipSnapshot {
  contractVersion: string;
  sourceOfTruth: CustomerRelationshipSource;
  economicGroupsTotal: number;
  legalEntitiesTotal: number;
  dealsTotal: number;
  pageLimit: number;
  pageOffset: number;
}

export function normalizeCustomerRelationshipPage(limit: number, offset: number) {
  const safeLimit = Number.isFinite(limit) ? Math.trunc(limit) : 100;
  const safeOffset = Number.isFinite(offset) ? Math.trunc(offset) : 0;

  return {
    limit: Math.max(1, Math.min(safeLimit, 100)),
    offset: Math.max(0, safeOffset),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toNonNegativeInteger(value: unknown): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? Math.max(0, Math.trunc(numeric)) : 0;
}

function sourceOfTruth(value: unknown): CustomerRelationshipSource {
  return value === 'hubspot_cache' ? 'hubspot_cache' : 'unavailable';
}

export function mapCustomerRelationshipSnapshot(
  value: unknown,
): CustomerRelationshipSnapshot {
  const row = asRecord(value);
  const meta = asRecord(row.meta);

  return {
    contractVersion: String(row.contract_version ?? 'customer_relationship_v1'),
    sourceOfTruth: sourceOfTruth(row.source_of_truth),
    economicGroupsTotal: toNonNegativeInteger(meta.economic_groups_total),
    legalEntitiesTotal: toNonNegativeInteger(meta.legal_entities_total),
    dealsTotal: toNonNegativeInteger(meta.deals_total),
    pageLimit: toNonNegativeInteger(meta.page_limit),
    pageOffset: toNonNegativeInteger(meta.page_offset),
  };
}
