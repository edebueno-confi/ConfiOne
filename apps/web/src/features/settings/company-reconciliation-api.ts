import { toAppError } from '../../app/errors';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';

type Row = Record<string, unknown>;
export type ReconciliationConfidence = 'exact' | 'probable' | 'weak' | 'inconclusive';
export type ReconciliationCandidate = {
  companyId: string;
  companyName: string;
  taxId: string | null;
  ownerId: string | null;
  clientStatus: string | null;
  mrr: number | null;
  score: number | null;
  confidence: ReconciliationConfidence;
  reason: string;
  matchedFields: string[];
  differences: Record<string, { omie: string | null; hubspot: string | null }>;
  source: string;
  decision: 'suggested' | 'confirmed' | 'discarded';
};
export type ReconciliationItem = {
  sourceKey: string;
  sourceName: string;
  sourceTradeName: string | null;
  sourceTaxId: string | null;
  omieClientCode: string | null;
  titleCount: number;
  totalBalance: number;
  overdueBalance: number;
  identityState: 'identified' | 'identity_unavailable';
  status: 'pending' | 'confirmed';
  candidates: ReconciliationCandidate[];
};
export type ReconciliationQueue = {
  summary: { total: number; confirmed: number; pending: number; identityUnavailable: number; clientIndexAvailable: boolean };
  items: ReconciliationItem[];
};

const asText = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const asNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0;

function mapCandidate(value: unknown): ReconciliationCandidate | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Row;
  const companyId = asText(row.company_id);
  const companyName = asText(row.company_name);
  if (!companyId || !companyName) return null;
  const confidence = asText(row.confidence);
  const differences = row.differences && typeof row.differences === 'object'
    ? Object.fromEntries(Object.entries(row.differences as Row).flatMap(([key, value]) => value && typeof value === 'object'
      ? [[key, { omie: asText((value as Row).omie) || null, hubspot: asText((value as Row).hubspot) || null }]]
      : []))
    : {};
  const decision = asText(row.decision);
  return {
    companyId,
    companyName,
    taxId: asText(row.tax_id) || null,
    ownerId: asText(row.owner_id) || null,
    clientStatus: asText(row.client_status) || null,
    mrr: typeof row.mrr === 'number' ? row.mrr : null,
    score: typeof row.score === 'number' ? row.score : null,
    confidence: confidence === 'exact' || confidence === 'probable' || confidence === 'weak' ? confidence : 'inconclusive',
    reason: asText(row.reason) || 'sem_classificacao',
    matchedFields: Array.isArray(row.matched_fields) ? row.matched_fields.filter((field): field is string => typeof field === 'string') : [],
    differences,
    source: asText(row.source) || 'HubSpot',
    decision: decision === 'confirmed' || decision === 'discarded' ? decision : 'suggested',
  };
}

function mapQueue(value: unknown): ReconciliationQueue {
  const root = value && typeof value === 'object' ? value as Row : {};
  const summary = root.summary && typeof root.summary === 'object' ? root.summary as Row : {};
  const items = Array.isArray(root.items) ? root.items.flatMap((value): ReconciliationItem[] => {
    if (!value || typeof value !== 'object') return [];
    const row = value as Row;
    const sourceKey = asText(row.source_key);
    const sourceName = asText(row.source_name);
    if (!sourceKey || !sourceName) return [];
    return [{
      sourceKey,
      sourceName,
      sourceTradeName: asText(row.source_trade_name) || null,
      sourceTaxId: asText(row.source_tax_id) || null,
      omieClientCode: asText(row.omie_client_code) || null,
      titleCount: asNumber(row.title_count),
      totalBalance: asNumber(row.total_balance),
      overdueBalance: asNumber(row.overdue_balance),
      identityState: row.identity_state === 'identity_unavailable' ? 'identity_unavailable' : 'identified',
      status: row.status === 'confirmed' ? 'confirmed' : 'pending',
      candidates: (Array.isArray(row.candidates) ? row.candidates : []).flatMap((candidate) => {
        const mapped = mapCandidate(candidate);
        return mapped ? [mapped] : [];
      }),
    }];
  }) : [];
  return {
    summary: {
      total: asNumber(summary.total),
      confirmed: asNumber(summary.confirmed),
      pending: asNumber(summary.pending),
      identityUnavailable: asNumber(summary.identity_unavailable),
      clientIndexAvailable: summary.client_index_available === true,
    },
    items,
  };
}

export async function getCompanyReconciliationQueue({ limit = 25, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<ReconciliationQueue> {
  const { data, error } = await requireSupabaseBrowserClient().rpc('rpc_analytics_company_reconciliation_queue', { p_limit: limit, p_offset: offset });
  if (error) throw toAppError(error, 'Falha ao carregar a fila de conciliação.');
  return mapQueue(data);
}

export async function decideCompanyReconciliation(input: { sourceKey: string; sourceName: string; sourceTaxId: string | null; companyId: string; decision: 'confirmed' | 'discarded'; evidence: string }): Promise<void> {
  const { error } = await requireSupabaseBrowserClient().rpc('rpc_admin_decide_company_reconciliation', {
    p_source_key: input.sourceKey,
    p_source_name: input.sourceName,
    p_source_tax_id: input.sourceTaxId,
    p_company_id: input.companyId,
    p_decision: input.decision,
    p_evidence: input.evidence.trim(),
  });
  if (error) throw toAppError(error, 'Não foi possível registrar a decisão.');
}

export async function revokeCompanyReconciliation(sourceKey: string, evidence: string): Promise<void> {
  const { error } = await requireSupabaseBrowserClient().rpc('rpc_admin_revoke_company_reconciliation', { p_source_key: sourceKey, p_evidence: evidence.trim() });
  if (error) throw toAppError(error, 'Não foi possível desfazer a conciliação.');
}
