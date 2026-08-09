import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { classifyOmieError, enrichReceivablesWithClients, fetchOmieClientsIndexWithMetadata, fetchOmieReceivablesWithMetadata, normalizeOmieApiReceivables, type OmieClientInfo, type OmieCredentials } from './omie.ts';
import { createSyncRequestTelemetryBuffer } from './sync-request-telemetry.ts';

export const OMIE_STAGING_BATCH_SIZE = 500;
export const OMIE_CLIENT_INDEX_CACHE_TTL_MS = 15 * 60 * 1000;

type OmieClientIndexCache = {
  index: Map<string, OmieClientInfo>;
  cachedAt: string | null;
  ageMs: number | null;
  fresh: boolean;
};

async function readOmieClientIndexCache(client: SupabaseClient, nowMs = Date.now()): Promise<OmieClientIndexCache | null> {
  const { data: state, error: stateError } = await client
    .from('analytics_finance_client_index_state')
    .select('current_snapshot_id,cached_at,row_count,complete')
    .eq('cache_key', 'omie_clients')
    .maybeSingle();
  if (stateError || !state?.complete || !state.current_snapshot_id) return null;

  const { data: rows, error: rowsError } = await client
    .from('analytics_finance_client_index_cache')
    .select('client_code,client_name,client_tax_id,client_trade_name')
    .eq('snapshot_id', state.current_snapshot_id);
  if (rowsError || !Array.isArray(rows)) return null;

  const index = new Map<string, OmieClientInfo>();
  for (const row of rows as Array<{ client_code?: string; client_name?: string | null; client_tax_id?: string | null; client_trade_name?: string | null }>) {
    const code = String(row.client_code ?? '').trim();
    if (!code) continue;
    index.set(code, { name: row.client_name ?? null, taxId: row.client_tax_id ?? null, tradeName: row.client_trade_name ?? null });
  }
  const cachedAt = typeof state.cached_at === 'string' ? state.cached_at : null;
  const ageMs = cachedAt ? Math.max(0, nowMs - Date.parse(cachedAt)) : null;
  return { index, cachedAt, ageMs, fresh: ageMs !== null && Number.isFinite(ageMs) && ageMs <= OMIE_CLIENT_INDEX_CACHE_TTL_MS };
}

async function publishOmieClientIndexCache(client: SupabaseClient, syncRunId: string, index: Map<string, OmieClientInfo>, fetchedAt: string) {
  const rows = [...index.entries()].map(([clientCode, info]) => ({
    client_code: clientCode,
    client_name: info.name,
    client_tax_id: info.taxId,
    client_trade_name: info.tradeName,
  }));
  const { error } = await client.rpc('rpc_service_publish_omie_client_index', {
    p_source_run_id: syncRunId,
    p_rows: rows,
    p_fetched_at: fetchedAt,
  });
  if (error) throw new Error(`Falha ao publicar cache de clientes OMIE: ${error.message}`);
  return rows.length;
}

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

export async function runOmieSnapshot(client: SupabaseClient, credentials: OmieCredentials, actorId: string | null, correlationId: string, cycleId: string | null = null) {
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const abandonedAt = new Date().toISOString();
  const { error: abandonError } = await client.from('analytics_finance_sync_runs').update({
    status: 'abandoned',
    error_message: 'Execucao abandonada pelo worker e encerrada automaticamente.',
    internal_error_code: 'execution_abandoned',
    internal_message: 'Execucao abandonada pelo worker e encerrada automaticamente.',
    sanitized_error: 'A execucao do OMIE foi interrompida por falta de atualizacao do worker.',
    error_occurred_at: abandonedAt,
    last_heartbeat_at: abandonedAt,
    finished_at: abandonedAt,
  }).eq('status', 'processing').lt('started_at', staleBefore);
  if (abandonError) throw new Error(`Falha ao encerrar execucao OMIE antiga: ${abandonError.message}`);
  const { data: syncRun, error: syncRunError } = await client.from('analytics_finance_sync_runs').insert({ status: 'processing', triggered_by_user_id: actorId, correlation_id: correlationId, cycle_id: cycleId }).select('id').single();
  if (syncRunError?.code === '23505') { const error = new Error('Ja existe uma sincronizacao OMIE em andamento. Aguarde a conclusao antes de tentar novamente.'); Object.assign(error, { code: 'OMIE_SYNC_IN_PROGRESS' }); throw error; }
  if (syncRunError || !syncRun) throw new Error(syncRunError?.message ?? 'Nao foi possivel criar a execucao financeira.');
  const syncRunId = String(syncRun.id);
  const telemetry = createSyncRequestTelemetryBuffer({ provider: 'omie', omieRunId: syncRunId, cycleId, correlationId });
  const flushTelemetry = async () => {
    const result = await telemetry.flush(client);
    if (result.error) console.warn(`Falha ao persistir telemetria OMIE: ${result.error}`);
  };
  const updateRun = async (patch: Record<string, unknown>) => { const { error } = await client.from('analytics_finance_sync_runs').update(patch).eq('id', syncRunId); if (error) throw new Error(`Falha ao registrar estado da execução OMIE: ${error.message}`); };
  const failRun = async (status: string, error: unknown, patch: Record<string, unknown> = {}) => {
    const classified = classifyOmieError(error);
    await updateRun({
      status,
      error_message: classified.internalMessage,
      internal_error_code: classified.code,
      provider_code: classified.providerCode,
      internal_message: classified.internalMessage,
      sanitized_error: status === 'empty' ? null : classified.sanitizedMessage,
      error_occurred_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      ...patch,
    });
  };
  try {
    const fetched = await fetchOmieReceivablesWithMetadata(credentials, fetch, { observer: telemetry.observer });
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
    const enrichment = {
      status: 'unavailable',
      matched: 0,
      unmatched: normalized.accepted.length,
      fieldsUpdated: 0,
      errors: 0,
      cacheSource: 'unavailable',
      cacheAgeSeconds: null as number | null,
      cacheRows: 0,
      errorCode: null as string | null,
      errorMessage: null as string | null,
    } as { status: 'complete'|'partial'|'stale'|'unavailable'; matched: number; unmatched: number; fieldsUpdated: number; errors: number; cacheSource: 'cache'|'api'|'stale_cache'|'api_partial'|'unavailable'; cacheAgeSeconds: number | null; cacheRows: number; errorCode: string | null; errorMessage: string | null };
    try {
      const cache = await readOmieClientIndexCache(client);
      enrichment.cacheAgeSeconds = cache?.ageMs === null || cache?.ageMs === undefined ? null : Math.round(cache.ageMs / 1000);
      if (cache?.fresh) {
        const result = enrichReceivablesWithClients(normalized.accepted, cache.index);
        enrichment.matched = result.stats.matched;
        enrichment.unmatched = result.stats.unmatched;
        enrichment.fieldsUpdated = result.stats.fieldsUpdated;
        enrichment.cacheRows = cache.index.size;
        enrichment.cacheSource = 'cache';
        enrichment.status = enrichment.unmatched ? 'partial' : 'complete';
      } else {
        const fetchedClients = await fetchOmieClientsIndexWithMetadata(credentials, fetch, { observer: telemetry.observer });
        if (fetchedClients.complete) {
          enrichment.cacheRows = await publishOmieClientIndexCache(client, syncRunId, fetchedClients.index, new Date().toISOString());
          const result = enrichReceivablesWithClients(normalized.accepted, fetchedClients.index);
          enrichment.matched = result.stats.matched;
          enrichment.unmatched = result.stats.unmatched;
          enrichment.fieldsUpdated = result.stats.fieldsUpdated;
          enrichment.cacheSource = 'api';
          enrichment.status = enrichment.unmatched ? 'partial' : 'complete';
        } else if (cache) {
          const result = enrichReceivablesWithClients(normalized.accepted, cache.index);
          enrichment.matched = result.stats.matched;
          enrichment.unmatched = result.stats.unmatched;
          enrichment.fieldsUpdated = result.stats.fieldsUpdated;
          enrichment.cacheRows = cache.index.size;
          enrichment.cacheSource = 'stale_cache';
          enrichment.status = 'stale';
        } else {
          enrichment.cacheSource = 'api_partial';
          const result = enrichReceivablesWithClients(normalized.accepted, fetchedClients.index);
          enrichment.matched = result.stats.matched;
          enrichment.unmatched = result.stats.unmatched;
          enrichment.fieldsUpdated = result.stats.fieldsUpdated;
          enrichment.cacheRows = fetchedClients.index.size;
          enrichment.status = 'partial';
        }
      }
    } catch (error) {
      const classified = classifyOmieError(error);
      enrichment.errors = 1;
      enrichment.errorCode = classified.code;
      enrichment.errorMessage = classified.sanitizedMessage;
      console.warn('OMIE_CLIENT_ENRICHMENT_UNAVAILABLE', classified.code);
    }
    const staged = await stageOmieRowsInBatches(client, normalized.accepted);
    const batchCount = staged.batchCount;
    const coverage = { normalization: 'complete', enrichment: enrichment.status, enrichmentCache: enrichment.cacheSource, enrichmentCacheAgeSeconds: enrichment.cacheAgeSeconds, enrichmentCacheRows: enrichment.cacheRows, enrichmentErrorCode: enrichment.errorCode, received: normalized.summary.received, accepted: normalized.summary.accepted, rejected: normalized.summary.rejected, enriched: enrichment.matched, unmatched: enrichment.unmatched, errors: enrichment.errors };
    await updateRun({ staged_rows: normalized.accepted.length, batch_count: batchCount, enrichment, coverage, metadata: fetched.metadata });
    const { data: promotion, error: promotionError } = await client.rpc('rpc_service_promote_omie_snapshot', { p_sync_run_id: syncRunId });
    if (promotionError) throw new Error(`Falha ao promover snapshot Omie: ${promotionError.message}`);
    await flushTelemetry();
    return { syncRunId, correlationId, totalRows: normalized.summary.received, acceptedRows: normalized.summary.accepted, rejectedRows: normalized.summary.rejected, enrichment, batchCount, status: 'completed', promotion };
  } catch (error) {
    await flushTelemetry();
    const classified = classifyOmieError(error);
    const { error: cleanupError } = await client.from('analytics_finance_receivables_staging').delete().eq('sync_run_id', syncRunId);
    await failRun('failed', cleanupError ? `${classified.internalMessage}; OMIE_STAGING_CLEANUP_FAILED` : classified, cleanupError ? { metadata: { cleanupError: 'OMIE_STAGING_CLEANUP_FAILED' } } : {});
    throw Object.assign(new Error(classified.internalMessage), { syncRunId, omieError: classified });
  } finally {
    await flushTelemetry();
  }
}
