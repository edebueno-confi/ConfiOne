import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { createServiceClient, getAuthorizationHeader, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { fetchOmieReceivables, normalizeOmieApiReceivables, parseOmieCredentials } from '../_shared/omie.ts';
import { updateCompaniesBatch } from '../_shared/hubspot.ts';

interface RollupRow {
  company_id: string; saldo_aberto: number; saldo_vencido: number; titulos_abertos: number; atraso_medio_dias: number; situacao: string;
}

async function authorize(req: Request, client: SupabaseClient): Promise<'admin' | 'scheduled' | null> {
  const scheduledSecret = Deno.env.get('ANALYTICS_SYNC_SECRET');
  if (scheduledSecret && req.headers.get('x-analytics-sync-secret') === scheduledSecret) return 'scheduled';
  const token = getAuthorizationHeader(req).replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  const userId = String(data.claims.sub);
  const { data: roleRow } = await client.from('user_global_roles').select('user_id').eq('user_id', userId).eq('role', 'platform_admin').maybeSingle();
  return roleRow ? 'admin' : null;
}

async function getSecret(client: SupabaseClient, key: string): Promise<string> {
  const { data, error } = await client.rpc('rpc_service_get_managed_integration_secret', { p_integration_key: key });
  if (!error && typeof data === 'string' && data.trim()) return data.trim();
  const fallback = Deno.env.get(key === 'hubspot' ? 'HUBSPOT_PRIVATE_APP_TOKEN' : 'OMIE_CREDENTIALS')?.trim();
  if (fallback) return fallback;
  throw new Error(`Credencial gerenciada '${key}' indisponível.`);
}

function isDue(frequency: string, lastRunAt: string | null): boolean {
  if (!lastRunAt) return true;
  const last = new Date(lastRunAt).getTime();
  const now = Date.now();
  if (frequency === 'hourly') return now - last >= 55 * 60 * 1000;
  if (frequency === 'daily') return new Date(last).toISOString().slice(0, 10) !== new Date(now).toISOString().slice(0, 10);
  return false;
}

async function updateCompaniesInBatches(
  rows: RollupRow[],
  token: string,
  nowDate: string,
) {
  const updates = rows.map((r) => ({ id: String(r.company_id), properties: {
      omie_saldo_aberto: String(r.saldo_aberto ?? 0),
      omie_saldo_vencido: String(r.saldo_vencido ?? 0),
      omie_titulos_abertos: String(r.titulos_abertos ?? 0),
      omie_atraso_medio_dias: String(r.atraso_medio_dias ?? 0),
      omie_situacao_financeira: String(r.situacao ?? ''),
      omie_ultima_sincronizacao: nowDate,
    } }));
  try {
    const updated = await updateCompaniesBatch(updates, token);
    return { updated, failed: rows.length - updated };
  } catch (error) {
    throw new Error(`Atualizacao HubSpot em lote falhou: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function claimFinanceSyncRun(client: SupabaseClient) {
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
    return { activeRun };
  }

  const { data: syncRun, error: syncRunError } = await client.from('analytics_finance_sync_runs')
    .insert({ status: 'processing', triggered_by_user_id: null })
    .select('id')
    .single();
  if (syncRunError?.code === '23505') return { activeRun: { id: null, started_at: null } };
  if (syncRunError || !syncRun) throw new Error(syncRunError?.message ?? 'Nao foi possivel criar a execucao financeira.');
  return { syncRun };
}

Deno.serve(async (req) => {
  const startedAt = Date.now();
  const phase = (label: string) => console.info(`[analytics-integration-run] ${label} +${Date.now() - startedAt}ms`);
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });

  const client = createServiceClient();
  phase('request accepted');
  const mode = await authorize(req, client);
  if (!mode) return jsonResponse({ error: 'Acesso negado.' }, { status: 403 });

  // A tabela possui uma unica linha. Evitar o filtro booleano no PostgREST
  // remove a dependencia do schema cache para o tipo de `id`.
  const { data: schedule } = await client.from('analytics_integration_schedule').select('enabled,frequency,last_run_at').limit(1).maybeSingle();
  if (mode === 'scheduled') {
    const enabled = schedule?.enabled === true;
    const frequency = String(schedule?.frequency ?? 'off');
    if (!enabled || frequency === 'off' || !isDue(frequency, schedule?.last_run_at ?? null)) {
      return jsonResponse({ ok: true, skipped: true, reason: !enabled || frequency === 'off' ? 'desativado' : 'ainda não vencido' });
    }
    const { data: activeRun } = await client.from('analytics_finance_sync_runs').select('id').eq('status', 'processing').order('started_at', { ascending: false }).limit(1).maybeSingle();
    if (activeRun) return jsonResponse({ ok: true, skipped: true, reason: 'execucao financeira ja em andamento' });
  }

  await client.rpc('rpc_service_mark_integration_run', { p_status: 'running', p_message: `Iniciado (${mode})` });
  let syncRunId: string | null = null;
  try {
    // 1) OMIE -> read model (read-only na OMIE)
    const omieSecret = await getSecret(client, 'omie');
    const credentials = parseOmieCredentials(omieSecret);
    phase('omie credentials loaded');
    const claimed = await claimFinanceSyncRun(client);
    if ('activeRun' in claimed && claimed.activeRun) {
      await client.rpc('rpc_service_mark_integration_run', { p_status: 'partial', p_message: 'Sincronizacao OMIE ignorada: outra execucao esta em andamento.' });
      return jsonResponse(
        { ok: false, status: 'blocked', code: 'OMIE_SYNC_IN_PROGRESS', error: 'Já existe uma sincronização OMIE em andamento. Aguarde a conclusão antes de tentar novamente.' },
        { status: 409, headers: { 'retry-after': '30' } },
      );
    }
    const syncRun = claimed.syncRun;
    syncRunId = String(syncRun.id);
    const omieRows = await fetchOmieReceivables(credentials);
    phase(`omie receivables fetched: ${omieRows.length}`);
    const normalized = normalizeOmieApiReceivables(omieRows, syncRunId);
    phase(`omie receivables normalized: ${normalized.length}`);
    // O enriquecimento por ListarClientesResumido e deliberadamente excluido
    // deste caminho combinado: ele pode paginar milhares de clientes e estourar
    // o limite do worker. O payload de Contas a Receber ja traz nome/CNPJ quando
    // disponiveis; o enriquecimento completo permanece no omie-sync dedicado.
    const { error: upsertError } = await client.from('analytics_finance_receivables').upsert(normalized, { onConflict: 'source_key,source_record_id' });
    if (upsertError) throw new Error(`Persistência OMIE falhou: ${upsertError.message}`);
    const { error: expireError } = await client.from('analytics_finance_receivables')
      .update({ is_current: false, balance: 0, aging_bucket: 'recebido' })
      .eq('source_key', 'omie_receivables_api').neq('sync_run_id', syncRunId);
    if (expireError) throw new Error(`Reconciliação OMIE falhou: ${expireError.message}`);
    const { error: legacyExpireError } = await client.from('analytics_finance_receivables')
      .update({ is_current: false, balance: 0, aging_bucket: 'recebido' })
      .eq('source_key', 'omie_receivables_api').is('sync_run_id', null);
    if (legacyExpireError) throw new Error(`Reconciliação OMIE legada falhou: ${legacyExpireError.message}`);
    if (normalized.length) {
      const { error: currentError } = await client.from('analytics_finance_receivables').update({ is_current: true }).eq('sync_run_id', syncRunId);
      if (currentError) throw new Error(`Marcação de títulos atuais falhou: ${currentError.message}`);
    }
    await client.from('analytics_finance_sync_runs').update({ status: 'completed', total_rows: omieRows.length, accepted_rows: normalized.length, finished_at: new Date().toISOString() }).eq('id', syncRun.id);

    // 2) read model -> propriedades HubSpot (fill dos campos omie_*).
    // A persistência OMIE já foi concluída acima. Se o enriquecimento de
    // propriedades do HubSpot falhar/estourar o limite do worker, o financeiro
    // continua disponível no read model e a execução é reportada como parcial,
    // em vez de mascarar uma carga financeira concluída como erro total.
    try {
      const { data: rollupData, error: rollupError } = await client.rpc('rpc_analytics_finance_company_rollup');
      if (rollupError) throw new Error(`Rollup falhou: ${rollupError.message}`);
      const rows = (Array.isArray(rollupData) ? rollupData : []) as RollupRow[];
      phase(`finance rollup loaded: ${rows.length}`);
      const hubToken = await getSecret(client, 'hubspot');
      const nowDate = new Date().toISOString().slice(0, 10);
      const { updated, failed } = await updateCompaniesInBatches(rows, hubToken, nowDate);
      phase(`hubspot batch update completed: ${updated}/${rows.length}`);

      const status = failed === 0 ? 'success' : 'partial';
      const message = `OMIE ${normalized.length} títulos; HubSpot ${updated}/${rows.length} empresas (${failed} falhas).`;
      await client.rpc('rpc_service_mark_integration_run', { p_status: status, p_message: message });
      return jsonResponse({ ok: true, status, mode, omieTitles: normalized.length, companies: rows.length, updated, failed, message });
    } catch (hubspotError) {
      const detail = hubspotError instanceof Error ? hubspotError.message : String(hubspotError);
      const message = `OMIE ${normalized.length} títulos salvos; atualização das propriedades HubSpot pendente: ${detail.slice(0, 260)}`;
      await client.rpc('rpc_service_mark_integration_run', { p_status: 'partial', p_message: message });
      return jsonResponse({ ok: true, status: 'partial', mode, omieTitles: normalized.length, companies: 0, updated: 0, failed: 0, message });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha na orquestração de integração.';
    if (syncRunId) {
      await client.from('analytics_finance_sync_runs').update({ status: 'failed', error_message: message.slice(0, 500), finished_at: new Date().toISOString() }).eq('id', syncRunId);
    }
    await client.rpc('rpc_service_mark_integration_run', { p_status: 'error', p_message: message });
    if (/REDUNDANT|8020/i.test(message)) {
      return jsonResponse({ error: 'A API OMIE ainda está concluindo uma requisição anterior. Aguarde alguns segundos e tente novamente.', code: 'OMIE_PROVIDER_BUSY' }, { status: 409, headers: { 'retry-after': '46' } });
    }
    return jsonResponse({ error: message.slice(0, 500) }, { status: 502 });
  }
});
