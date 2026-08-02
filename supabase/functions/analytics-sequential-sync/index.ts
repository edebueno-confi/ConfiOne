import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { authorizeCsRunner, runnerError, runnerMessage } from '../_shared/hubspot-cs-runner.ts';

type FunctionResult = { status: number; payload: Record<string, unknown> | null };

const TERMINAL_HUBSPOT_STATUSES = new Set(['success', 'succeeded', 'failed', 'error', 'abandoned', 'cancelled']);

function runtimeConfig() {
  const secret = Deno.env.get('ANALYTICS_SYNC_SECRET')?.trim();
  const baseUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')?.trim();
  if (!secret || !baseUrl || !anonKey) throw new Error('Runtime sem configuracao segura para orquestrar as fontes.');
  return { secret, baseUrl, anonKey };
}

async function callFunction(
  baseUrl: string,
  anonKey: string,
  secret: string,
  functionName: string,
  correlationId: string,
  body: Record<string, unknown>,
): Promise<FunctionResult> {
  const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
      'x-analytics-sync-secret': secret,
      'x-analytics-correlation-id': correlationId,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  return { status: response.status, payload };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function activeHubspotRun(client: ReturnType<typeof createServiceClient>) {
  const { data, error } = await client
    .from('hubspot_sync_runs')
    .select('id,status,correlation_id')
    .eq('provider', 'hubspot')
    .eq('domain_key', 'all')
    .in('status', ['queued', 'running', 'partial'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; status: string; correlation_id: string | null } | null;
}

async function hubspotProgress(client: ReturnType<typeof createServiceClient>, runId: string) {
  const { data, error } = await client
    .from('vw_analytics_hubspot_sync_progress')
    .select('run_id,correlation_id,status,records_promoted,error_code,error_message,finished_at')
    .eq('run_id', runId)
    .maybeSingle();
  if (error) throw error;
  return data as { run_id: string; correlation_id: string | null; status: string; records_promoted: number | null; error_code: string | null; error_message: string | null; finished_at: string | null } | null;
}

async function runHubspotToCompletion(
  client: ReturnType<typeof createServiceClient>,
  config: ReturnType<typeof runtimeConfig>,
  correlationId: string,
) {
  let run = await activeHubspotRun(client);
  if (!run) {
    const started = await callFunction(config.baseUrl, config.anonKey, config.secret, 'hubspot-orchestrator-start', correlationId, { correlationId });
    if (started.status >= 400) return { runId: null, status: 'failed', recordsPromoted: 0, message: String(started.payload?.error ?? 'Falha ao iniciar o HubSpot.') };
    const runId = String(started.payload?.run_id ?? '');
    if (!runId) return { runId: null, status: 'failed', recordsPromoted: 0, message: 'O HubSpot nao retornou o identificador da execucao.' };
    run = { id: runId, status: String(started.payload?.status ?? 'queued'), correlation_id: correlationId };
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const progress = await hubspotProgress(client, run.id);
    if (progress && TERMINAL_HUBSPOT_STATUSES.has(progress.status)) {
      if (progress.status !== 'success' && progress.status !== 'succeeded') {
        return { runId: run.id, status: 'failed', recordsPromoted: Number(progress.records_promoted ?? 0), message: progress.error_message || `A execucao HubSpot terminou com status ${progress.status}.` };
      }
      return { runId: run.id, status: progress.status, recordsPromoted: Number(progress.records_promoted ?? 0) };
    }

    const dispatched = await callFunction(config.baseUrl, config.anonKey, config.secret, 'hubspot-orchestrator-dispatcher', correlationId, {});
    if (dispatched.status >= 400) return { runId: run.id, status: 'failed', recordsPromoted: 0, message: String(dispatched.payload?.error ?? 'Falha ao processar a fila HubSpot.') };
    await wait(250);
  }

  return { runId: run.id, status: 'running', recordsPromoted: 0 };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });

  const client = createServiceClient();
  if (!(await authorizeCsRunner(req, client))) return jsonResponse({ error: 'Acesso negado. Requer platform_admin.' }, { status: 403 });

  try {
    const config = runtimeConfig();
    const body = await req.json().catch(() => ({})) as { correlationId?: string };
    const correlationId = body.correlationId ?? crypto.randomUUID();
    const hubspot = await runHubspotToCompletion(client, config, correlationId);

    if (hubspot.status === 'running') {
      return jsonResponse({
        status: 'blocked',
        correlationId,
        hubspot,
        omie: { status: 'not_started' },
        message: 'O HubSpot ainda esta processando; o OMIE nao foi iniciado.',
      }, { status: 202 });
    }

    // HubSpot e OMIE são fontes independentes. Uma falha terminal do HubSpot
    // não deve impedir a atualização financeira, mas o ciclo precisa retornar
    // parcial para que a UI e o agendamento não confundam isso com sucesso.
    const omie = await callFunction(config.baseUrl, config.anonKey, config.secret, 'omie-sync', correlationId, {}).catch((error) => ({
      status: 503,
      payload: { error: runnerMessage(error) },
    }));
    const omieOk = omie.status < 400;
    const hubspotOk = hubspot.status === 'success' || hubspot.status === 'succeeded';
    const status = hubspotOk && omieOk ? 'success' : 'partial';
    const messages = [
      !hubspotOk ? `HubSpot: ${hubspot.message ?? 'falha terminal'}.` : null,
      !omieOk ? `OMIE: ${String(omie.payload?.error ?? 'falha ao sincronizar')}.` : null,
    ].filter(Boolean).join(' ');
    return jsonResponse({ status, correlationId, hubspot, omie: omie.payload ?? { status: 'error' }, message: messages || undefined }, { status: 200 });
  } catch (error) {
    return runnerError({ message: runnerMessage(error) }, 502);
  }
});
