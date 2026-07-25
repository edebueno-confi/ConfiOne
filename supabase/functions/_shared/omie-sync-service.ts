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
  const { error: abandonError } = await client.from('analytics_finance_sync_runs').update({ status: 'abandoned', error_message: 'Execucao abandonada pelo worker e encerrada automaticamente.', finished_at: new Date().toISOString() }).eq('status', 'processing').lt('started_at', staleBefore);
  if (abandonError) throw new Error(`Falha ao encerrar execucao OMIE antiga: ${abandonError.message}`);
  const { data: syncRun, error: syncRunError } = await client.from('analytics_finance_sync_runs').insert({ status: 'processing', triggered_by_user_id: actorId, correlation_id: correlationId }).select('id').single();
  if (syncRunError?.code === '23505') { const error = new Error('Ja existe uma sincronizacao OMIE em andamento. Aguarde a conclusao antes de tentar novamente.'); Object.assign(error, { code: 'OMIE_SYNC_IN_PROGRESS' }); throw error; }
  if (syncRunError || !syncRun) throw new Error(syncRunError?.message ?? 'Nao foi possivel criar a execucao financeira.');
  const syncRunId = String(syncRun.id);
  const updateRun = async (patch: Record<string, unknown>) => { const { error } = await client.from('analytics_finance_sync_runs').update(patch).eq('id', syncRunId); if (error) throw new Error(`Falha ao registrar estado da execução OMIE: ${error.message}`); };
  const failRun = async (status: string, message: string, patch: Record<string, unknown> = {}) => { await updateRun({ status, error_message: message.slice(0, 500), finished_at: new Date().toISOString(), ...patch }); };
  try {
    const fetched = await fetchOmieReceivablesWithMetadata(credentials);
    if (fetched.rows.length === 0) {
      if (fetched.metadata.totalRecords === 0) { await failRun('empty', 'Resposta autoritativa vazia; snapshot anterior preservado.', { total_rows: 0, metadata: { ...fetched.metadata, authoritativeEmpty: true } }); return { syncRunId, correlationId, totalRows: 0, acceptedRows: 0, rejectedRows: 0, status: 'empty', promotion: null }; }
      const code = fetched.metadata.totalRecords === null ? 'OMIE_EMPTY_RESPONSE_WITHOUT_AUTHORITATIVE_TOTAL' : 'OMIE_TOTAL_RECORDS_WITHOUT_ROWS';
      await failRun('failed', code, { total_rows: fetched.metadata.totalRecords ?? 0, metadata: { ...fetched.metadata, errorCode: code } });
      return { syncRunId, correlationId, totalRows: fetched.metadata.totalRecords ?? 0, acceptedRows: 0, rejectedRows: 0, status: 'failed', errorCode: code, promotion: null };
    }
    if (fetched.metadata.totalRecords !== null && fetched.metadata.totalRecords !== fetched.rows.length) { const code = 'OMIE_RECORD_COUNT_MISMATCH'; await failRun('failed', code, { total_rows: fetched.metadata.totalRecords, metadata: { ...fetched.metadata, errorCode: code } }); return { syncRunId, correlationId, totalRows: fetched.metadata.totalRecords, acceptedRows: 0, rejectedRows: 0, status: 'failed', errorCode: code, promotion: null }; }
    const normalized = normalizeOmieApiReceivables(fetched.rows, syncRunId);
    const counts = rejectionCounts(normalized.rejected);
    await updateRun({ total_rows: normalized.summary.received, accepted_rows: normalized.summary.accepted, rejected_rows: normalized.summary.rejected, rejected_by_reason: counts, metadata: fetched.metadata });
    if (normalized.accepted.length === 0) { await failRun('failed', 'OMIE_ALL_RECORDS_REJECTED; snapshot anterior preservado.', { total_rows: normalized.summary.received, accepted_rows: 0, rejected_rows: normalized.summary.rejected, rejected_by_reason: counts, metadata: fetched.metadata }); return { syncRunId, correlationId, totalRows: normalized.summary.received, acceptedRows: 0, rejectedRows: normalized.summary.rejected, status: 'failed', promotion: null }; }
    if (normalized.rejected.length > 0) { await failRun('partial', 'Rejeicao parcial impede promocao automatica neste lote.', { total_rows: normalized.summary.received, accepted_rows: normalized.summary.accepted, rejected_rows: normalized.summary.rejected, rejected_by_reason: counts, metadata: fetched.metadata }); return { syncRunId, correlationId, totalRows: normalized.summary.received, acceptedRows: normalized.summary.accepted, rejectedRows: normalized.summary.rejected, status: 'partial', promotion: null }; }
    const identityKeys = new Set<string>();
    let collisions = 0;
    for (const row of normalized.accepted) { const key = `${row.source_key}:${row.source_record_id}`; if (identityKeys.has(key)) collisions += 1; identityKeys.add(key); }
    if (collisions > 0) { const code = 'identity_collision'; const reasons = { ...counts, [code]: collisions }; await failRun('failed', 'OMIE_IDENTITY_COLLISION', { rejected_rows: normalized.rejected.length + collisions, rejected_by_reason: reasons, metadata: { ...fetched.metadata, collisionCount: collisions } }); return { syncRunId, correlationId, totalRows: normalized.summary.received, acceptedRows: 0, rejectedRows: normalized.rejected.length + collisions, status: 'failed', errorCode: 'OMIE_IDENTITY_COLLISION', promotion: null }; }
    const enrichment = { status: 'unavailable', matched: 0, unmatched: normalized.accepted.length, fieldsUpdated: 0, errors: 0 } as { status: 'complete'|'partial'|'unavailable'; matched: number; unmatched: number; fieldsUpdated: number; errors: number };
    try { const clients = await fetchOmieClientsIndex(credentials); const result = enrichReceivablesWithClients(normalized.accepted as any, clients); enrichment.matched = result.stats.matched; enrichment.unmatched = result.stats.unmatched; enrichment.fieldsUpdated = result.stats.fieldsUpdated; enrichment.status = enrichment.unmatched ? 'partial' : 'complete'; } catch { enrichment.errors = 1; }
    const staged = await stageOmieRowsInBatches(client, normalized.accepted);
    const batchCount = staged.batchCount;
    const coverage = { normalization: 'complete', enrichment: enrichment.status, received: normalized.summary.received, accepted: normalized.summary.accepted, rejected: normalized.summary.rejected, enriched: enrichment.matched, unmatched: enrichment.unmatched, errors: enrichment.errors };
    await updateRun({ staged_rows: normalized.accepted.length, batch_count: batchCount, enrichment, coverage, metadata: fetched.metadata });
    const { data: promotion, error: promotionError } = await client.rpc('rpc_service_promote_omie_snapshot', { p_sync_run_id: syncRunId });
    if (promotionError) throw new Error(`Falha ao promover snapshot Omie: ${promotionError.message}`);
    return { syncRunId, correlationId, totalRows: normalized.summary.received, acceptedRows: normalized.summary.accepted, rejectedRows: normalized.summary.rejected, enrichment, batchCount, status: 'completed', promotion };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const { error: cleanupError } = await client.from('analytics_finance_receivables_staging').delete().eq('sync_run_id', syncRunId);
    await failRun('failed', cleanupError ? `${message}; OMIE_STAGING_CLEANUP_FAILED` : message, cleanupError ? { metadata: { cleanupError: 'OMIE_STAGING_CLEANUP_FAILED' } } : {});
    throw Object.assign(new Error(message), { syncRunId });
  }
}
