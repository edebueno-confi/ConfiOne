// Sincronizacao read-only de Contas a Receber via API Omie.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getAuthorizationHeader, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { enrichReceivablesWithClients, fetchOmieClientsIndex, fetchOmieReceivables, normalizeOmieApiReceivables, parseOmieCredentials } from '../_shared/omie.ts';

async function authorize(req: Request, client: ReturnType<typeof createServiceClient>): Promise<string | null> {
  const configured = Deno.env.get('ANALYTICS_SYNC_SECRET');
  if (configured && req.headers.get('x-analytics-sync-secret') === configured) return 'scheduled';
  const token = getAuthorizationHeader(req).replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data } = await client.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: role } = await client.from('user_global_roles').select('user_id').eq('user_id', String(userId)).eq('role', 'platform_admin').maybeSingle();
  return role ? String(userId) : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
  const client = createServiceClient();
  const actorId = await authorize(req, client);
  if (!actorId) return jsonResponse({ error: 'Acesso negado. Requer platform_admin.' }, { status: 403 });

  const { data: secret, error: secretError } = await client.rpc('rpc_service_get_managed_integration_secret', { p_integration_key: 'omie' });
  if (secretError) return jsonResponse({ error: `Falha ao ler credencial Omie: ${secretError.message}` }, { status: 500 });
  if (typeof secret !== 'string' || !secret.trim()) return jsonResponse({ error: 'Credencial Omie nao configurada em Admin > Configuracoes > Integracoes.' }, { status: 409 });

  const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  await client.from('analytics_finance_sync_runs')
    .update({ status: 'failed', error_message: 'Execucao abandonada pelo worker e encerrada automaticamente.', finished_at: new Date().toISOString() })
    .eq('status', 'processing')
    .lt('started_at', staleBefore);
  const { data: activeRun } = await client.from('analytics_finance_sync_runs')
    .select('id, started_at')
    .eq('status', 'processing')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (activeRun) {
    return jsonResponse(
      { error: 'Já existe uma sincronização OMIE em andamento. Aguarde a conclusão antes de tentar novamente.', code: 'OMIE_SYNC_IN_PROGRESS', startedAt: activeRun.started_at },
      { status: 409, headers: { 'retry-after': '30' } },
    );
  }

  let syncRunId: string | null = null;
  try {
    const credentials = parseOmieCredentials(secret);
    const { data: syncRun, error: syncRunError } = await client.from('analytics_finance_sync_runs').insert({ status: 'processing', triggered_by_user_id: actorId === 'scheduled' ? null : actorId }).select('id').single();
    if (syncRunError?.code === '23505') {
      return jsonResponse(
        { error: 'Já existe uma sincronização OMIE em andamento. Aguarde a conclusão antes de tentar novamente.', code: 'OMIE_SYNC_IN_PROGRESS' },
        { status: 409, headers: { 'retry-after': '30' } },
      );
    }
    if (syncRunError || !syncRun) throw new Error(syncRunError?.message ?? 'Nao foi possivel criar a execucao financeira.');
    syncRunId = String(syncRun.id);
    const rows = await fetchOmieReceivables(credentials);
    const normalized = normalizeOmieApiReceivables(rows, syncRunId);
    // Enriquecimento best-effort de nome/CNPJ do cliente por codigo_cliente_fornecedor.
    let enrichedClients = 0;
    try {
      const clients = await fetchOmieClientsIndex(credentials);
      enrichReceivablesWithClients(normalized, clients);
      enrichedClients = normalized.filter((row) => row.client_tax_id || row.client_name).length;
    } catch (_error) { /* enriquecimento de clientes e opcional */ }
    const { error: upsertError } = await client.from('analytics_finance_receivables').upsert(normalized, { onConflict: 'source_key,source_record_id' });
    if (upsertError) throw new Error(`Falha ao persistir Contas a Receber da API: ${upsertError.message}`);
    const { error: expireError } = await client
      .from('analytics_finance_receivables')
      .update({ is_current: false, balance: 0, aging_bucket: 'recebido' })
      .eq('source_key', 'omie_receivables_api')
      .neq('sync_run_id', syncRunId);
    if (expireError) throw new Error(`Falha ao reconciliar títulos ausentes: ${expireError.message}`);
    const { error: legacyExpireError } = await client.from('analytics_finance_receivables')
      .update({ is_current: false, balance: 0, aging_bucket: 'recebido' })
      .eq('source_key', 'omie_receivables_api').is('sync_run_id', null);
    if (legacyExpireError) throw new Error(`Falha ao reconciliar títulos legados: ${legacyExpireError.message}`);
    if (normalized.length) {
      const { error: currentError } = await client
        .from('analytics_finance_receivables')
        .update({ is_current: true })
        .eq('sync_run_id', syncRunId);
      if (currentError) throw new Error(`Falha ao marcar títulos atuais: ${currentError.message}`);
    }
    await client.from('analytics_finance_sync_runs').update({ status: 'completed', total_rows: rows.length, accepted_rows: normalized.length, finished_at: new Date().toISOString() }).eq('id', syncRunId);
    return jsonResponse({ ok: true, mode: 'api', syncRunId, totalRows: rows.length, acceptedRows: normalized.length, enrichedClients, metrics: ['saldo vencido', 'recebido', 'a vencer', 'aging', 'previsao de recebimento'], message: 'Consulta Omie concluida e integrada ao read model financeiro.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (syncRunId) await client.from('analytics_finance_sync_runs').update({ status: 'failed', error_message: message.slice(0, 500), finished_at: new Date().toISOString() }).eq('id', syncRunId);
    if (/REDUNDANT|8020/i.test(message)) {
      return jsonResponse({ error: 'A API OMIE ainda está concluindo uma requisição anterior. Aguarde alguns segundos e tente novamente.', code: 'OMIE_PROVIDER_BUSY' }, { status: 409, headers: { 'retry-after': '46' } });
    }
    return jsonResponse({ error: message.slice(0, 500), syncRunId }, { status: 502 });
  }
});
