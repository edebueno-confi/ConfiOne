import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { authorizeCsRunner, runnerError, runnerMessage } from '../_shared/hubspot-cs-runner.ts';

type FunctionResult = { status: number; payload: Record<string, unknown> | null };

const TERMINAL_HUBSPOT_STATUSES = new Set(['success', 'succeeded', 'failed', 'error', 'abandoned', 'timed_out', 'cancelled']);

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
  cycleId?: string,
): Promise<FunctionResult> {
  const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
      'x-analytics-sync-secret': secret,
      'x-analytics-correlation-id': correlationId,
      ...(cycleId ? { 'x-analytics-cycle-id': cycleId } : {}),
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  return { status: response.status, payload };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function activeHubspotRun(client: ReturnType<typeof createServiceClient>, correlationId: string) {
  const { data, error } = await client
    .from('hubspot_sync_runs')
    .select('id,status,correlation_id')
    .eq('provider', 'hubspot')
    .eq('domain_key', 'all')
    .eq('correlation_id', correlationId)
    .in('status', ['queued', 'running', 'partial'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; status: string; correlation_id: string | null } | null;
}

async function updateCycle(
  client: ReturnType<typeof createServiceClient>,
  cycleId: string,
  patch: Record<string, unknown>,
) {
  const { error } = await client.from('analytics_sync_cycles').update({ ...patch, last_heartbeat_at: new Date().toISOString() }).eq('id', cycleId);
  if (error) throw error;
}

async function updateStep(
  client: ReturnType<typeof createServiceClient>,
  cycleId: string,
  stepKey: 'hubspot' | 'omie',
  patch: Record<string, unknown>,
) {
  const { error } = await client.from('analytics_sync_cycle_steps').update({ ...patch, last_heartbeat_at: new Date().toISOString() }).eq('cycle_id', cycleId).eq('step_key', stepKey);
  if (error) throw error;
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
  cycleId: string,
) {
  let run = await activeHubspotRun(client, correlationId);
  if (!run) {
    let started: FunctionResult;
    try {
      started = await callFunction(config.baseUrl, config.anonKey, config.secret, 'hubspot-orchestrator-start', correlationId, { correlationId });
    } catch (error) {
      await updateStep(client, cycleId, 'hubspot', { status: 'failed', finished_at: new Date().toISOString(), sanitized_error: runnerMessage(error) });
      return { runId: null, status: 'failed', recordsPromoted: 0, message: runnerMessage(error) };
    }
    if (started.status >= 400) {
      const message = String(started.payload?.error ?? 'Falha ao iniciar o HubSpot.');
      await updateStep(client, cycleId, 'hubspot', { status: 'failed', finished_at: new Date().toISOString(), sanitized_error: message });
      return { runId: null, status: 'failed', recordsPromoted: 0, message };
    }
    const runId = String(started.payload?.run_id ?? '');
    if (!runId) {
      const message = 'O HubSpot nao retornou o identificador da execucao.';
      await updateStep(client, cycleId, 'hubspot', { status: 'failed', finished_at: new Date().toISOString(), sanitized_error: message });
      return { runId: null, status: 'failed', recordsPromoted: 0, message };
    }
    await client.from('hubspot_sync_runs').update({ cycle_id: cycleId }).eq('id', runId);
    run = { id: runId, status: String(started.payload?.status ?? 'queued'), correlation_id: correlationId };
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const progress = await hubspotProgress(client, run.id);
    await updateCycle(client, cycleId, { current_step: 'hubspot' });
    await updateStep(client, cycleId, 'hubspot', { status: 'running', run_id: run.id });
    if (progress && TERMINAL_HUBSPOT_STATUSES.has(progress.status)) {
      if (progress.status !== 'success' && progress.status !== 'succeeded') {
        await updateStep(client, cycleId, 'hubspot', { status: progress.status === 'timed_out' ? 'timed_out' : 'failed', finished_at: progress.finished_at, sanitized_error: progress.error_message });
        return { runId: run.id, status: 'failed', recordsPromoted: Number(progress.records_promoted ?? 0), message: progress.error_message || `A execucao HubSpot terminou com status ${progress.status}.` };
      }
      await updateStep(client, cycleId, 'hubspot', { status: 'succeeded', finished_at: progress.finished_at, processed_count: Number(progress.records_promoted ?? 0) });
      return { runId: run.id, status: progress.status, recordsPromoted: Number(progress.records_promoted ?? 0) };
    }

    let dispatched: FunctionResult;
    try {
      dispatched = await callFunction(config.baseUrl, config.anonKey, config.secret, 'hubspot-orchestrator-dispatcher', correlationId, {});
    } catch (error) {
      await updateStep(client, cycleId, 'hubspot', { status: 'failed', finished_at: new Date().toISOString(), sanitized_error: runnerMessage(error) });
      return { runId: run.id, status: 'failed', recordsPromoted: 0, message: runnerMessage(error) };
    }
    if (dispatched.status >= 400) {
      const message = String(dispatched.payload?.error ?? 'Falha ao processar a fila HubSpot.');
      await updateStep(client, cycleId, 'hubspot', { status: 'failed', finished_at: new Date().toISOString(), sanitized_error: message });
      return { runId: run.id, status: 'failed', recordsPromoted: 0, message };
    }
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
    const startedCycle = await client.rpc('rpc_service_start_analytics_sync_cycle', { p_trigger_kind: 'manual', p_requested_by: null });
    if (startedCycle.error) throw startedCycle.error;
    const cycle = startedCycle.data as { accepted?: boolean; cycle_id?: string; correlation_id?: string; status?: string; reason?: string } | null;
    if (!cycle?.accepted) {
      return jsonResponse({ status: 'blocked', cycleId: cycle?.cycle_id ?? null, correlationId: cycle?.correlation_id ?? null, message: 'Já existe uma atualização em andamento. Acompanhe o Histórico antes de iniciar outra.' }, { status: 409 });
    }
    const cycleId = String(cycle.cycle_id);
    const correlationId = String(cycle.correlation_id);
    const hubspot = await runHubspotToCompletion(client, config, correlationId, cycleId);

    if (hubspot.status === 'running') {
      await updateCycle(client, cycleId, { status: 'running', current_step: 'hubspot' });
      return jsonResponse({
        status: 'blocked',
        cycleId,
        correlationId,
        hubspot,
        omie: { status: 'not_started' },
        message: 'O HubSpot ainda esta processando; o OMIE nao foi iniciado.',
      }, { status: 202 });
    }

    // HubSpot e OMIE são fontes independentes. Uma falha terminal do HubSpot
    // não deve impedir a atualização financeira, mas o ciclo precisa retornar
    // parcial para que a UI e o agendamento não confundam isso com sucesso.
    await updateCycle(client, cycleId, { status: 'running', current_step: 'omie' });
    await updateStep(client, cycleId, 'omie', { status: 'running', started_at: new Date().toISOString() });
    const omie = await callFunction(config.baseUrl, config.anonKey, config.secret, 'omie-sync', correlationId, {}, cycleId).catch((error) => ({
      status: 503,
      payload: { error: runnerMessage(error) },
    }));
    const omieOk = omie.status < 400;
    const hubspotOk = hubspot.status === 'success' || hubspot.status === 'succeeded';
    const status = hubspotOk && omieOk ? 'success' : 'partial';
    const omiePayload = omie.payload ?? { status: 'error' };
    await updateStep(client, cycleId, 'omie', {
      status: omieOk ? 'succeeded' : 'failed',
      run_id: omiePayload.syncRunId ?? null,
      finished_at: new Date().toISOString(),
      processed_count: Number(omiePayload.acceptedRows ?? 0),
      sanitized_error: omieOk ? null : 'A atualização do OMIE não foi concluída.',
    });
    await updateCycle(client, cycleId, {
      status: status === 'success' ? 'succeeded' : 'partial',
      current_step: 'complete',
      overall_result: status === 'success' ? 'success' : 'partial',
      finished_at: new Date().toISOString(),
      sanitized_error: status === 'success' ? null : 'Uma ou mais fontes não concluíram a atualização.',
    });
    const messages = [
      !hubspotOk ? `HubSpot: ${hubspot.message ?? 'falha terminal'}.` : null,
      !omieOk ? `OMIE: ${String(omie.payload?.error ?? 'falha ao sincronizar')}.` : null,
    ].filter(Boolean).join(' ');
    return jsonResponse({ status, cycleId, correlationId, hubspot, omie: omiePayload, message: messages || undefined }, { status: 200 });
  } catch (error) {
    return runnerError({ message: runnerMessage(error) }, 502);
  }
});
