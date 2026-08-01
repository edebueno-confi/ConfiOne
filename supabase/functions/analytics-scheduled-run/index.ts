import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';

const SYNC_FUNCTIONS = ['hubspot-orchestrator-start', 'hubspot-orchestrator-dispatcher'] as const;

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

  const configuredSecret = Deno.env.get('ANALYTICS_SYNC_SECRET')?.trim();
  const providedSecret = req.headers.get('x-analytics-sync-secret')?.trim();
  if (!configuredSecret || !providedSecret || providedSecret !== configuredSecret) {
    return jsonResponse({ error: 'Acesso negado.' }, { status: 403 });
  }

  const baseUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')?.trim();
  if (!baseUrl || !anonKey) return jsonResponse({ error: 'Runtime Supabase sem URL ou chave publica configurada.' }, { status: 503 });

  const client = createServiceClient();
  const { data: schedule, error: scheduleError } = await client
    .from('analytics_integration_schedule')
    .select('hubspot_enabled,hubspot_frequency,hubspot_last_run_at')
    .limit(1)
    .maybeSingle();
  if (scheduleError) return jsonResponse({ error: 'Nao foi possivel ler o agendamento do HubSpot.' }, { status: 503 });
  if (!schedule?.hubspot_enabled || !isDue(String(schedule.hubspot_frequency ?? 'off'), schedule.hubspot_last_run_at ?? null)) {
    return jsonResponse({ ok: true, skipped: true, reason: 'Agendamento HubSpot desativado ou ainda nao vencido.' });
  }

  const results: Array<{ function: string; status: number; payload: unknown }> = [];
  const correlationId = crypto.randomUUID();
  for (const functionName of SYNC_FUNCTIONS) {
    try {
      const body = functionName === 'hubspot-orchestrator-start'
        ? JSON.stringify({ correlationId })
        : '{}';
      const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          'Content-Type': 'application/json',
          'x-analytics-sync-secret': configuredSecret,
          'x-analytics-correlation-id': correlationId,
        },
        body,
      });
      const payload = await response.json().catch(() => null);
      results.push({ function: functionName, status: response.status, payload });
    } catch (error) {
      results.push({ function: functionName, status: 503, payload: { error: error instanceof Error ? error.message : String(error) } });
    }
  }

  const failed = results.filter((result) => result.status >= 400);
  const status = failed.length === 0 ? 'success' : results.some((result) => result.status === 409) ? 'blocked' : 'error';
  const message = failed.length === 0
    ? 'Agendamento incremental do HubSpot concluido.'
    : `Falha no agendamento incremental do HubSpot (${failed.map((result) => result.function).join(', ')}).`;
  await client.from('analytics_integration_schedule').update({
    hubspot_last_run_at: new Date().toISOString(),
    hubspot_last_status: status,
    hubspot_last_message: message,
  }).eq('id', true);
  return jsonResponse({ ok: failed.length === 0, correlationId, results }, { status: failed.length === 0 ? 200 : 502 });
});
