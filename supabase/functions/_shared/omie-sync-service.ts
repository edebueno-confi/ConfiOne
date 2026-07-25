import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { enrichReceivablesWithClients, fetchOmieClientsIndex, fetchOmieReceivables, normalizeOmieApiReceivables, type OmieCredentials } from './omie.ts';

export async function runOmieSnapshot(
  client: SupabaseClient,
  credentials: OmieCredentials,
  actorId: string | null,
  correlationId: string,
) {
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  await client.from('analytics_finance_sync_runs')
    .update({ status: 'failed', error_message: 'Execucao abandonada pelo worker e encerrada automaticamente.', finished_at: new Date().toISOString() })
    .eq('status', 'processing').lt('started_at', staleBefore);

  const { data: syncRun, error: syncRunError } = await client.from('analytics_finance_sync_runs')
    .insert({ status: 'processing', triggered_by_user_id: actorId, correlation_id: correlationId })
    .select('id').single();
  if (syncRunError?.code === '23505') {
    const error = new Error('Ja existe uma sincronizacao OMIE em andamento. Aguarde a conclusao antes de tentar novamente.');
    Object.assign(error, { code: 'OMIE_SYNC_IN_PROGRESS' });
    throw error;
  }
  if (syncRunError || !syncRun) throw new Error(syncRunError?.message ?? 'Nao foi possivel criar a execucao financeira.');

  const syncRunId = String(syncRun.id);
  try {
    const rows = await fetchOmieReceivables(credentials);
    if (rows.length === 0) throw new Error('A API Omie retornou um snapshot vazio; o snapshot anterior foi preservado para evitar apagamento indevido.');
    const normalized = normalizeOmieApiReceivables(rows, syncRunId).map((row) => ({ ...row, identity_version: 'omie-v2' }));
    const identityKeys = new Set<string>();
    for (const row of normalized) {
      if (identityKeys.has(row.source_record_id)) throw new Error(`Colisao de identidade Omie detectada para ${row.source_record_id}.`);
      identityKeys.add(row.source_record_id);
    }
    try {
      const clients = await fetchOmieClientsIndex(credentials);
      enrichReceivablesWithClients(normalized, clients);
    } catch { /* enriquecimento e opcional; snapshot continua auditavel */ }
    if (normalized.length > 0) {
      const { error: stagingError } = await client.from('analytics_finance_receivables_staging').insert(normalized);
      if (stagingError) throw new Error(`Falha ao persistir staging Omie: ${stagingError.message}`);
    }
    const { data: promotion, error: promotionError } = await client.rpc('rpc_service_promote_omie_snapshot', { p_sync_run_id: syncRunId });
    if (promotionError) throw new Error(`Falha ao promover snapshot Omie: ${promotionError.message}`);
    return { syncRunId, correlationId, totalRows: rows.length, acceptedRows: normalized.length, promotion };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await client.from('analytics_finance_sync_runs').update({ status: 'failed', error_message: message.slice(0, 500), finished_at: new Date().toISOString() }).eq('id', syncRunId);
    throw Object.assign(new Error(message), { syncRunId });
  }
}
