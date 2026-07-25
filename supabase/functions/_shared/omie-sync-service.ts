import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { enrichReceivablesWithClients, fetchOmieClientsIndex, fetchOmieReceivablesWithMetadata, normalizeOmieApiReceivables, type OmieCredentials } from './omie.ts';

export const OMIE_STAGING_BATCH_SIZE = 500;

export async function stageOmieRowsInBatches(client: SupabaseClient, rows: Array<Record<string, unknown>>) {
  let batchCount = 0;
  for (let index = 0; index < rows.length; index += OMIE_STAGING_BATCH_SIZE) {
    const batch = rows.slice(index, index + OMIE_STAGING_BATCH_SIZE);
    const { error } = await client.from('analytics_finance_receivables_staging').insert(batch);
    if (error) throw new Error(`Falha no lote OMIE ${batchCount + 1}: ${error.message}`);
    batchCount += 1;
  }
  return { stagedRows: rows.length, batchCount };
}

function rejectionCounts(rejected: Array<{ reasonCode: string }>) {
  return rejected.reduce<Record<string, number>>((result, item) => { result[item.reasonCode] = (result[item.reasonCode] ?? 0) + 1; return result; }, {});
}

export async function runOmieSnapshot(client: SupabaseClient, credentials: OmieCredentials, actorId: string | null, correlationId: string) {
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  await client.from('analytics_finance_sync_runs').update({ status: 'abandoned', error_message: 'Execucao abandonada pelo worker e encerrada automaticamente.', finished_at: new Date().toISOString() }).eq('status', 'processing').lt('started_at', staleBefore);
  const { data: syncRun, error: syncRunError } = await client.from('analytics_finance_sync_runs').insert({ status: 'processing', triggered_by_user_id: actorId, correlation_id: correlationId }).select('id').single();
  if (syncRunError?.code === '23505') { const error = new Error('Ja existe uma sincronizacao OMIE em andamento. Aguarde a conclusao antes de tentar novamente.'); Object.assign(error, { code: 'OMIE_SYNC_IN_PROGRESS' }); throw error; }
  if (syncRunError || !syncRun) throw new Error(syncRunError?.message ?? 'Nao foi possivel criar a execucao financeira.');
  const syncRunId = String(syncRun.id);
  const failRun = async (status: string, message: string, patch: Record<string, unknown> = {}) => { await client.from('analytics_finance_sync_runs').update({ status, error_message: message.slice(0, 500), finished_at: new Date().toISOString(), ...patch }).eq('id', syncRunId); };
  try {
    const fetched = await fetchOmieReceivablesWithMetadata(credentials);
    if (fetched.rows.length === 0) { await failRun('empty', 'Resposta autoritativa vazia; snapshot anterior preservado.', { total_rows: fetched.metadata.totalRecords ?? 0, metadata: { ...fetched.metadata, authoritativeEmpty: true } }); return { syncRunId, correlationId, totalRows: fetched.metadata.totalRecords ?? 0, acceptedRows: 0, rejectedRows: 0, status: 'empty', promotion: null }; }
    const normalized = normalizeOmieApiReceivables(fetched.rows, syncRunId);
    const counts = rejectionCounts(normalized.rejected);
    await client.from('analytics_finance_sync_runs').update({ total_rows: normalized.summary.received, accepted_rows: normalized.summary.accepted, rejected_rows: normalized.summary.rejected, rejected_by_reason: counts, metadata: fetched.metadata }).eq('id', syncRunId);
    if (normalized.accepted.length === 0) { await failRun('failed', 'OMIE_ALL_RECORDS_REJECTED; snapshot anterior preservado.', { total_rows: normalized.summary.received, accepted_rows: 0, rejected_rows: normalized.summary.rejected, rejected_by_reason: counts, metadata: fetched.metadata }); return { syncRunId, correlationId, totalRows: normalized.summary.received, acceptedRows: 0, rejectedRows: normalized.summary.rejected, status: 'failed', promotion: null }; }
    if (normalized.rejected.length > 0) { await failRun('partial', 'Rejeicao parcial impede promocao automatica neste lote.', { total_rows: normalized.summary.received, accepted_rows: normalized.summary.accepted, rejected_rows: normalized.summary.rejected, rejected_by_reason: counts, metadata: fetched.metadata }); return { syncRunId, correlationId, totalRows: normalized.summary.received, acceptedRows: normalized.summary.accepted, rejectedRows: normalized.summary.rejected, status: 'partial', promotion: null }; }
    const identityKeys = new Set<string>();
    for (const row of normalized.accepted) { const key = `${row.source_key}:${row.source_record_id}`; if (identityKeys.has(key)) throw new Error('Colisao de identidade Omie detectada.'); identityKeys.add(key); }
    const enrichment = { status: 'unavailable', matched: 0, unmatched: normalized.accepted.length, errors: 0 } as { status: 'complete'|'partial'|'unavailable'; matched: number; unmatched: number; errors: number };
    try { const clients = await fetchOmieClientsIndex(credentials); enrichReceivablesWithClients(normalized.accepted as any, clients); enrichment.matched = normalized.accepted.filter((row: any) => row.client_name || row.client_tax_id || row.client_trade_name).length; enrichment.unmatched = normalized.accepted.length - enrichment.matched; enrichment.status = enrichment.unmatched ? 'partial' : 'complete'; } catch { enrichment.errors = 1; }
    const staged = await stageOmieRowsInBatches(client, normalized.accepted);
    const batchCount = staged.batchCount;
    await client.from('analytics_finance_sync_runs').update({ staged_rows: normalized.accepted.length, batch_count: batchCount, enrichment }).eq('id', syncRunId);
    const { data: promotion, error: promotionError } = await client.rpc('rpc_service_promote_omie_snapshot', { p_sync_run_id: syncRunId });
    if (promotionError) throw new Error(`Falha ao promover snapshot Omie: ${promotionError.message}`);
    return { syncRunId, correlationId, totalRows: normalized.summary.received, acceptedRows: normalized.summary.accepted, rejectedRows: normalized.summary.rejected, enrichment, batchCount, status: 'completed', promotion };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await failRun('failed', message);
    throw Object.assign(new Error(message), { syncRunId });
  }
}
