import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';

function isDue(frequency: string, lastRunAt: string | null) {
  if (!lastRunAt) return true;
  const last = Date.parse(lastRunAt);
  if (!Number.isFinite(last)) return true;
  if (frequency === 'hourly') return Date.now() - last >= 55 * 60 * 1000;
  if (frequency === 'daily') return new Date(last).toISOString().slice(0, 10) !== new Date().toISOString().slice(0, 10);
  return false;
}

async function invokeFullCycle(baseUrl: string, anonKey: string, secret: string, correlationId: string) {
  const response = await fetch(`${baseUrl}/functions/v1/analytics-sequential-sync`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
      'x-analytics-sync-secret': secret,
      'x-analytics-correlation-id': correlationId,
    },
    body: JSON.stringify({ correlationId }),
  });
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  return { status: response.status, payload };
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
    .select('enabled,frequency,last_run_at')
    .limit(1)
    .maybeSingle();
  if (scheduleError) return jsonResponse({ error: 'Nao foi possivel ler o agendamento do Dashboard.' }, { status: 503 });
  if (!schedule?.enabled || !isDue(String(schedule.frequency ?? 'off'), schedule.last_run_at ?? null)) {
    return jsonResponse({ ok: true, skipped: true, reason: 'Agendamento do Dashboard desativado ou ainda nao vencido.' });
  }

  const correlationId = crypto.randomUUID();
  let cycle: { status: number; payload: Record<string, unknown> | null };
  try {
    cycle = await invokeFullCycle(baseUrl, anonKey, configuredSecret, correlationId);
  } catch (error) {
    cycle = { status: 503, payload: { status: 'error', error: error instanceof Error ? error.message : String(error) } };
  }
  const cycleStatus = String(cycle.payload?.status ?? (cycle.status >= 400 ? 'error' : 'success'));
  const status = cycleStatus === 'success' ? 'success' : cycleStatus === 'blocked' ? 'partial' : 'partial';
  const message = String(cycle.payload?.message ?? (status === 'success' ? 'Ciclo completo do Dashboard concluído.' : 'Ciclo completo concluído parcialmente; consulte o status de cada fonte.'));
  await client.from('analytics_integration_schedule').update({
    last_run_at: new Date().toISOString(),
    last_status: status,
    last_message: message,
  }).eq('id', true);
  return jsonResponse({ ok: status === 'success', correlationId, ...cycle.payload, scheduleStatus: status }, { status: cycle.status >= 500 ? 502 : 200 });
});
