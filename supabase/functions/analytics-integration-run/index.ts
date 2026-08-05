// Facade de compatibilidade: a coleta OMIE vive em _shared/omie-sync-service.ts.
// Este caminho nao escreve dados externos; o ciclo sequencial e o orquestrador atual.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { createServiceClient, getAuthorizationHeader, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { parseOmieCredentials } from '../_shared/omie.ts';
import { runOmieSnapshot } from '../_shared/omie-sync-service.ts';

async function authorize(req: Request, client: SupabaseClient): Promise<string | 'scheduled' | null> {
  const scheduledSecret = Deno.env.get('ANALYTICS_SYNC_SECRET');
  if (scheduledSecret && req.headers.get('x-analytics-sync-secret') === scheduledSecret) return 'scheduled';
  const token = getAuthorizationHeader(req).replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data } = await client.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: roleRow } = await client.from('user_global_roles').select('user_id').eq('user_id', String(userId)).eq('role', 'platform_admin').maybeSingle();
  return roleRow ? String(userId) : null;
}

async function getSecret(client: SupabaseClient, key: string): Promise<string> {
  const { data, error } = await client.rpc('rpc_service_get_managed_integration_secret', { p_integration_key: key });
  if (!error && typeof data === 'string' && data.trim()) return data.trim();
  const fallback = Deno.env.get(key === 'hubspot' ? 'HUBSPOT_PRIVATE_APP_TOKEN' : 'OMIE_CREDENTIALS')?.trim();
  if (fallback) return fallback;
  throw new Error(`Credencial gerenciada '${key}' indisponivel.`);
}

function isDue(frequency: string, lastRunAt: string | null): boolean {
  if (!lastRunAt) return true;
  const last = new Date(lastRunAt).getTime();
  if (frequency === 'hourly') return Date.now() - last >= 55 * 60 * 1000;
  if (frequency === 'daily') return new Date(last).toISOString().slice(0, 10) !== new Date().toISOString().slice(0, 10);
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
  const client = createServiceClient();
  const mode = await authorize(req, client);
  if (!mode) return jsonResponse({ error: 'Acesso negado.' }, { status: 403 });
  const { data: schedule } = await client.from('analytics_integration_schedule').select('enabled,frequency,last_run_at').limit(1).maybeSingle();
  if (mode === 'scheduled') {
    const enabled = schedule?.enabled === true;
    const frequency = String(schedule?.frequency ?? 'off');
    if (!enabled || frequency === 'off' || !isDue(frequency, schedule?.last_run_at ?? null)) {
      return jsonResponse({ ok: true, skipped: true, reason: !enabled || frequency === 'off' ? 'desativado' : 'ainda nao vencido' });
    }
  }
  const rawCorrelation = req.headers.get('x-analytics-correlation-id')?.trim() ?? '';
  const correlationId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawCorrelation) ? rawCorrelation : crypto.randomUUID();
  try {
    await client.rpc('rpc_service_mark_integration_run', { p_status: 'running', p_message: `Iniciado (${mode === 'scheduled' ? 'scheduled' : 'admin'})` });
    const omie = await runOmieSnapshot(client, parseOmieCredentials(await getSecret(client, 'omie')), mode === 'scheduled' ? null : mode, correlationId);
    const hubspot = { updated: 0, failed: 0, companies: 0 };
    const status = 'success';
    await client.rpc('rpc_service_mark_integration_run', { p_status: status, p_message: `OMIE ${omie.acceptedRows} titulos; nenhum write externo executado.` });
    return jsonResponse({ ok: true, mode: mode === 'scheduled' ? 'scheduled' : 'admin', correlationId, omie, hubspot, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await client.rpc('rpc_service_mark_integration_run', { p_status: 'error', p_message: 'Falha na orquestracao das integracoes.' });
    if (/OMIE_SYNC_IN_PROGRESS|REDUNDANT|8020/i.test(message)) return jsonResponse({ error: 'A API Omie esta ocupada ou ja existe uma sincronizacao em andamento.', code: 'OMIE_PROVIDER_BUSY' }, { status: 409, headers: { 'retry-after': '30' } });
    if (/Credencial gerenciada .* indisponivel|Credencial.*indispon[ií]vel/i.test(message)) return jsonResponse({ error: 'Configure as credenciais do OMIE e do HubSpot em Configurações → Integrações antes de sincronizar.', code: 'INTEGRATION_CREDENTIALS_MISSING', correlationId }, { status: 424 });
    return jsonResponse({ error: 'Falha na orquestracao das integracoes.', correlationId }, { status: 502 });
  }
});
