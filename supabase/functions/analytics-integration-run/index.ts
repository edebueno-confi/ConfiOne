import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { createServiceClient, getAuthorizationHeader, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { enrichReceivablesWithClients, fetchOmieClientsIndex, fetchOmieReceivables, normalizeOmieApiReceivables, parseOmieCredentials } from '../_shared/omie.ts';
import { updateCompany } from '../_shared/hubspot.ts';

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

async function updateCompaniesWithBoundedConcurrency(
  rows: RollupRow[],
  token: string,
  nowDate: string,
  concurrency = 6,
) {
  let updated = 0;
  let failed = 0;
  for (let index = 0; index < rows.length; index += concurrency) {
    const batch = rows.slice(index, index + concurrency);
    const results = await Promise.allSettled(batch.map((r) => updateCompany(String(r.company_id), {
      omie_saldo_aberto: String(r.saldo_aberto ?? 0),
      omie_saldo_vencido: String(r.saldo_vencido ?? 0),
      omie_titulos_abertos: String(r.titulos_abertos ?? 0),
      omie_atraso_medio_dias: String(r.atraso_medio_dias ?? 0),
      omie_situacao_financeira: String(r.situacao ?? ''),
      omie_ultima_sincronizacao: nowDate,
    }, token)));
    for (const result of results) {
      if (result.status === 'fulfilled') updated += 1;
      else failed += 1;
    }
  }
  return { updated, failed };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });

  const client = createServiceClient();
  const mode = await authorize(req, client);
  if (!mode) return jsonResponse({ error: 'Acesso negado.' }, { status: 403 });

  const { data: schedule } = await client.from('analytics_integration_schedule').select('enabled,frequency,last_run_at').eq('id', true).maybeSingle();
  if (mode === 'scheduled') {
    const enabled = schedule?.enabled === true;
    const frequency = String(schedule?.frequency ?? 'off');
    if (!enabled || frequency === 'off' || !isDue(frequency, schedule?.last_run_at ?? null)) {
      return jsonResponse({ ok: true, skipped: true, reason: !enabled || frequency === 'off' ? 'desativado' : 'ainda não vencido' });
    }
  }

  await client.rpc('rpc_service_mark_integration_run', { p_status: 'running', p_message: `Iniciado (${mode})` });
  try {
    // 1) OMIE -> read model (read-only na OMIE)
    const omieSecret = await getSecret(client, 'omie');
    const credentials = parseOmieCredentials(omieSecret);
    const { data: syncRun } = await client.from('analytics_finance_sync_runs').insert({ status: 'processing', triggered_by_user_id: null }).select('id').single();
    const syncRunId = String(syncRun?.id ?? crypto.randomUUID());
    const omieRows = await fetchOmieReceivables(credentials);
    const normalized = normalizeOmieApiReceivables(omieRows, syncRunId);
    try {
      const clients = await fetchOmieClientsIndex(credentials);
      enrichReceivablesWithClients(normalized, clients);
    } catch (_e) { /* enriquecimento opcional */ }
    const { error: upsertError } = await client.from('analytics_finance_receivables').upsert(normalized, { onConflict: 'source_key,source_record_id' });
    if (upsertError) throw new Error(`Persistência OMIE falhou: ${upsertError.message}`);
    if (syncRun?.id) await client.from('analytics_finance_sync_runs').update({ status: 'completed', total_rows: omieRows.length, accepted_rows: normalized.length, finished_at: new Date().toISOString() }).eq('id', syncRun.id);

    // 2) read model -> propriedades HubSpot (fill dos campos omie_*).
    // A persistência OMIE já foi concluída acima. Se o enriquecimento de
    // propriedades do HubSpot falhar/estourar o limite do worker, o financeiro
    // continua disponível no read model e a execução é reportada como parcial,
    // em vez de mascarar uma carga financeira concluída como erro total.
    try {
      const { data: rollupData, error: rollupError } = await client.rpc('rpc_analytics_finance_company_rollup');
      if (rollupError) throw new Error(`Rollup falhou: ${rollupError.message}`);
      const rows = (Array.isArray(rollupData) ? rollupData : []) as RollupRow[];
      const hubToken = await getSecret(client, 'hubspot');
      const nowDate = new Date().toISOString().slice(0, 10);
      const { updated, failed } = await updateCompaniesWithBoundedConcurrency(rows, hubToken, nowDate);

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
    await client.rpc('rpc_service_mark_integration_run', { p_status: 'error', p_message: message });
    return jsonResponse({ error: message.slice(0, 500) }, { status: 502 });
  }
});
