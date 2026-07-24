import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { createServiceClient, getAuthorizationHeader, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { createCompanyProperty, createCompanyPropertyGroup, listCompanyPropertyGroupNames, listCompanyPropertyNames } from '../_shared/hubspot.ts';

const GROUP = { name: 'omie_financeiro', label: 'OMIE / Financeiro' };

const PROPERTIES: Array<Record<string, unknown>> = [
  { name: 'omie_saldo_aberto', label: 'OMIE - Saldo em aberto', type: 'number', fieldType: 'number', groupName: GROUP.name },
  { name: 'omie_saldo_vencido', label: 'OMIE - Saldo vencido', type: 'number', fieldType: 'number', groupName: GROUP.name },
  { name: 'omie_titulos_abertos', label: 'OMIE - Títulos em aberto', type: 'number', fieldType: 'number', groupName: GROUP.name },
  { name: 'omie_atraso_medio_dias', label: 'OMIE - Atraso médio (dias)', type: 'number', fieldType: 'number', groupName: GROUP.name },
  {
    name: 'omie_situacao_financeira', label: 'OMIE - Situação financeira', type: 'enumeration', fieldType: 'select', groupName: GROUP.name,
    options: [
      { label: 'Em dia', value: 'em_dia', displayOrder: 0 },
      { label: 'A vencer', value: 'a_vencer', displayOrder: 1 },
      { label: 'Vencido', value: 'vencido', displayOrder: 2 },
      { label: 'Crítico', value: 'critico', displayOrder: 3 },
    ],
  },
  { name: 'omie_ultima_sincronizacao', label: 'OMIE - Última sincronização', type: 'datetime', fieldType: 'date', groupName: GROUP.name },
];

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

  let body: { dryRun?: unknown; confirmation?: unknown };
  try { body = await req.json(); } catch { body = {}; }
  const dryRun = body.dryRun !== false;
  const confirmation = body.confirmation === null || body.confirmation === undefined ? '' : String(body.confirmation).trim();
  if (!dryRun && confirmation !== 'CRIAR') {
    return jsonResponse({ error: 'Confirmação inválida. Envie confirmation="CRIAR" e dryRun=false para criar as propriedades.' }, { status: 422 });
  }

  let token: string;
  try { token = await resolveHubSpotToken(client); }
  catch (error) { return jsonResponse({ error: error instanceof Error ? error.message : 'Token HubSpot indisponível.' }, { status: 409 }); }

  try {
    const existingProps = await listCompanyPropertyNames(token);
    const existingGroups = await listCompanyPropertyGroupNames(token);
    const groupExists = existingGroups.has(GROUP.name);
    const results: Array<Record<string, unknown>> = [];
    const { data: run, error: runError } = await client.from('analytics_hubspot_property_setup_runs')
      .insert({ mode: dryRun ? 'dry_run' : 'apply', status: 'running', requested_by_user_id: actorId, total_rows: PROPERTIES.length + (groupExists ? 0 : 1) })
      .select('id').single();
    if (runError || !run) throw new Error(`Falha ao registrar ledger do property-setup: ${runError?.message ?? 'run indisponivel'}`);
    const runId = String(run.id);
    const { error: itemError } = await client.from('analytics_hubspot_property_setup_items').insert(PROPERTIES.map((prop) => ({ run_id: runId, property_name: String(prop.name), status: 'planned', after_payload: prop })));
    if (itemError) throw new Error(`Falha ao registrar itens do property-setup: ${itemError.message}`);

    if (!dryRun && !groupExists) {
      await createCompanyPropertyGroup(GROUP.name, GROUP.label, token);
    }

    for (const prop of PROPERTIES) {
      const name = String(prop.name);
      const exists = existingProps.has(name);
      if (exists) { results.push({ name, action: 'exists' }); await client.from('analytics_hubspot_property_setup_items').update({ status: 'exists' }).eq('run_id', runId).eq('property_name', name); continue; }
      if (dryRun) { results.push({ name, action: 'would_create' }); continue; }
      try {
        await createCompanyProperty(prop, token);
        results.push({ name, action: 'created' });
        await client.from('analytics_hubspot_property_setup_items').update({ status: 'created' }).eq('run_id', runId).eq('property_name', name);
      } catch (error) {
        results.push({ name, action: 'failed', error: error instanceof Error ? error.message.slice(0, 300) : 'erro' });
        await client.from('analytics_hubspot_property_setup_items').update({ status: 'failed', error_message: error instanceof Error ? error.message.slice(0, 500) : 'erro' }).eq('run_id', runId).eq('property_name', name);
      }
    }

    await client.from('analytics_hubspot_property_setup_runs').update({ status: results.some((r) => r.action === 'failed') ? 'partial' : 'completed', created_rows: results.filter((r) => r.action === 'created').length, failed_rows: results.filter((r) => r.action === 'failed').length, finished_at: new Date().toISOString() }).eq('id', runId);
    return jsonResponse({
      ok: true,
      dryRun,
      group: { name: GROUP.name, exists: groupExists, action: groupExists ? 'exists' : (dryRun ? 'would_create' : 'created') },
      summary: {
        exists: results.filter((r) => r.action === 'exists').length,
        wouldCreate: results.filter((r) => r.action === 'would_create').length,
        created: results.filter((r) => r.action === 'created').length,
        failed: results.filter((r) => r.action === 'failed').length,
      },
      ledgerRunId: runId,
      results,
    });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Falha ao configurar propriedades no HubSpot.' }, { status: 502 });
  }
});
