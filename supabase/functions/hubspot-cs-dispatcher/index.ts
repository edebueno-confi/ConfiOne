import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { authorizeCsRunner, runnerError } from '../_shared/hubspot-cs-runner.ts';

function isDue(frequency: string, lastRunAt: string | null) {
  if (!lastRunAt) return true;
  const last = Date.parse(lastRunAt);
  if (!Number.isFinite(last)) return true;
  if (frequency === 'hourly') return Date.now() - last >= 55 * 60 * 1000;
  if (frequency === 'daily') return new Date(last).toISOString().slice(0, 10) !== new Date().toISOString().slice(0, 10);
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
  const client = createServiceClient();
  const actor = await authorizeCsRunner(req, client);
  if (!actor) return jsonResponse({ error: 'Acesso negado.' }, { status: 403 });
  const { data: schedule } = await client.from('analytics_integration_schedule').select('hubspot_enabled,hubspot_frequency,hubspot_last_run_at').limit(1).maybeSingle();
  if (actor === 'scheduler' && (!schedule?.hubspot_enabled || !isDue(String(schedule.hubspot_frequency ?? 'off'), schedule.hubspot_last_run_at ?? null))) {
    return jsonResponse({ ok: true, skipped: true, reason: 'agendamento HubSpot desativado ou ainda não vencido' });
  }
  const secret = Deno.env.get('ANALYTICS_SYNC_SECRET')?.trim();
  const baseUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')?.trim();
  if (!secret || !baseUrl || !anonKey) return jsonResponse({ error: 'Runtime sem configuração segura do dispatcher.' }, { status: 503 });
  try {
    const { error: recoveryError } = await client.rpc('rpc_analytics_cs_abandon_stale_runs', { p_timeout_seconds: 900 });
    if (recoveryError) return runnerError(recoveryError, 500);
    const results: Array<{ status: number; payload: unknown }> = [];
    for (let index = 0; index < 6; index += 1) {
      const response = await fetch(`${baseUrl}/functions/v1/hubspot-cs-worker`, {
        method: 'POST',
        headers: { apikey: anonKey, 'Content-Type': 'application/json', 'x-analytics-sync-secret': secret, 'x-cs-worker-id': `dispatcher-${crypto.randomUUID()}` },
        body: '{}',
      });
      const payload = await response.json().catch(() => null);
      results.push({ status: response.status, payload });
      if (payload && typeof payload === 'object' && 'status' in payload && (payload as { status?: string }).status === 'idle') break;
    }
    return jsonResponse({ ok: results.every((result) => result.status < 400), workers: results });
  } catch (error) {
    return runnerError(error, 502);
  }
});
