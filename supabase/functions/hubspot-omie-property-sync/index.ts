import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { createServiceClient, getAuthorizationHeader, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { updateCompaniesBatch } from '../_shared/hubspot.ts';

interface RollupRow {
  company_id: string;
  company_name?: string;
  saldo_aberto: number;
  saldo_vencido: number;
  titulos_abertos: number;
  atraso_medio_dias: number;
  situacao: string;
}

async function authorize(req: Request, client: SupabaseClient): Promise<string | null> {
  const token = getAuthorizationHeader(req).replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  const userId = String(data.claims.sub);
  const { data: roleRow, error: roleError } = await client
    .from('user_global_roles').select('user_id').eq('user_id', userId).eq('role', 'platform_admin').maybeSingle();
  return roleError || !roleRow ? null : userId;
}

async function resolveHubSpotToken(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.rpc('rpc_service_get_managed_integration_secret', { p_integration_key: 'hubspot' });
  if (!error && typeof data === 'string' && data.trim()) return data.trim();
  const fallback = Deno.env.get('HUBSPOT_PRIVATE_APP_TOKEN')?.trim();
  if (fallback) return fallback;
  throw new Error(error?.message ?? 'Credencial gerenciada do HubSpot indisponível.');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });

  const client = createServiceClient();
  const actorId = await authorize(req, client);
  if (!actorId) return jsonResponse({ error: 'Acesso negado. Requer platform_admin.' }, { status: 403 });

  let body: { dryRun?: unknown; confirmation?: unknown; limit?: unknown };
  try { body = await req.json(); } catch { body = {}; }
  const dryRun = body.dryRun !== false;
  const confirmation = body.confirmation === null || body.confirmation === undefined ? '' : String(body.confirmation).trim();
  const limit = Math.min(Math.max(Number(body.limit ?? 1000), 1), 5000);
  if (!dryRun && confirmation !== 'ATUALIZAR') {
    return jsonResponse({ error: 'Confirmação inválida. Envie confirmation="ATUALIZAR" e dryRun=false para escrever no HubSpot.' }, { status: 422 });
  }

  const { data: rollupData, error: rollupError } = await client.rpc('rpc_analytics_finance_company_rollup');
  if (rollupError) return jsonResponse({ error: `Falha ao calcular o rollup financeiro: ${rollupError.message}` }, { status: 500 });
  const rows = (Array.isArray(rollupData) ? rollupData : []) as RollupRow[];
  const targets = rows.slice(0, limit);
  const nowDate = new Date().toISOString().slice(0, 10);
  const { data: run, error: runError } = await client.from('analytics_hubspot_omie_property_sync_runs')
    .insert({ mode: dryRun ? 'dry_run' : 'apply', status: 'running', requested_by_user_id: actorId, total_rows: targets.length })
    .select('id').single();
  if (runError || !run) return jsonResponse({ error: `Falha ao registrar ledger do property-sync: ${runError?.message ?? 'run indisponivel'}` }, { status: 500 });
  const runId = String(run.id);
  const plannedItems = targets.map((row) => ({ run_id: runId, company_id: String(row.company_id), status: 'planned', after_payload: { omie_saldo_aberto: String(row.saldo_aberto ?? 0), omie_saldo_vencido: String(row.saldo_vencido ?? 0), omie_titulos_abertos: String(row.titulos_abertos ?? 0), omie_atraso_medio_dias: String(row.atraso_medio_dias ?? 0), omie_situacao_financeira: String(row.situacao ?? ''), omie_ultima_sincronizacao: nowDate } }));
  if (plannedItems.length) {
    const { error: itemError } = await client.from('analytics_hubspot_omie_property_sync_items').insert(plannedItems);
    if (itemError) return jsonResponse({ error: `Falha ao registrar itens do property-sync: ${itemError.message}` }, { status: 500 });
  }

  if (dryRun) {
    await client.from('analytics_hubspot_omie_property_sync_runs').update({ status: 'completed', finished_at: new Date().toISOString() }).eq('id', runId);
    return jsonResponse({
      ok: true,
      dryRun: true,
      totalCompanies: rows.length,
      wouldUpdate: targets.length,
      ledgerRunId: runId,
      sample: targets.slice(0, 10).map((r) => ({ companyId: r.company_id, name: r.company_name ?? null, saldoAberto: r.saldo_aberto, saldoVencido: r.saldo_vencido, titulos: r.titulos_abertos, atrasoMedioDias: r.atraso_medio_dias, situacao: r.situacao })),
    });
  }

  let token: string;
  try { token = await resolveHubSpotToken(client); }
  catch (error) { return jsonResponse({ error: error instanceof Error ? error.message : 'Token HubSpot indisponível.' }, { status: 409 }); }

  let updated = 0;
  let failed = 0;
  const failures: Array<Record<string, unknown>> = [];
  const batchSize = 100;
  for (let index = 0; index < targets.length; index += batchSize) {
    const batch = targets.slice(index, index + batchSize);
    const updates = batch.map((r) => ({ id: String(r.company_id), properties: {
      omie_saldo_aberto: String(r.saldo_aberto ?? 0),
      omie_saldo_vencido: String(r.saldo_vencido ?? 0),
      omie_titulos_abertos: String(r.titulos_abertos ?? 0),
      omie_atraso_medio_dias: String(r.atraso_medio_dias ?? 0),
      omie_situacao_financeira: String(r.situacao ?? ''),
      omie_ultima_sincronizacao: nowDate,
    }}));
    try {
      const batchUpdated = await updateCompaniesBatch(updates, token);
      updated += batchUpdated;
      await Promise.all(batch.map((row) => client.from('analytics_hubspot_omie_property_sync_items')
        .update({ status: 'updated' }).eq('run_id', runId).eq('company_id', String(row.company_id))));
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 200) : 'erro';
      failed += batch.length;
      if (failures.length < 20) failures.push({ companyId: batch[0]?.company_id, error: message });
      await Promise.all(batch.map((row) => client.from('analytics_hubspot_omie_property_sync_items')
        .update({ status: 'failed', error_message: message })
      .eq('run_id', runId).eq('company_id', String(row.company_id))));
    }
  }

  await client.from('analytics_hubspot_omie_property_sync_runs').update({ status: failed === 0 ? 'completed' : 'partial', updated_rows: updated, failed_rows: failed, finished_at: new Date().toISOString() }).eq('id', runId);
  return jsonResponse({ ok: true, dryRun: false, ledgerRunId: runId, totalCompanies: rows.length, updated, failed, failures });
});
