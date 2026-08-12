import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { authorizeCsRunner, runnerError } from '../_shared/hubspot-cs-runner.ts';

type WorkerResult = { status: number; payload: Record<string, unknown> | null };

function scheduleContinuation(base: string, key: string, secret: string | null, authorization: string | null) {
  // Cada invocacao consome no maximo 12 itens. A proxima e disparada em segundo
  // plano para nao prender a requisicao original nem criar uma cadeia de awaits.
  EdgeRuntime.waitUntil(
    fetch(`${base}/functions/v1/hubspot-orchestrator-dispatcher`, {
      method: 'POST',
      headers: {
        apikey: key,
        'Content-Type': 'application/json',
        ...(secret ? { 'x-analytics-sync-secret': secret } : {}),
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: '{}',
    }).then((response) => {
      if (!response.ok) console.warn(`Continuidade do dispatcher retornou HTTP ${response.status}.`);
    }).catch((error) => console.warn(`Nao foi possivel reagendar o dispatcher: ${error instanceof Error ? error.message : String(error)}`)),
  );
}

function scheduleAnalyticsContinuation(base: string, key: string, secret: string | null, authorization: string | null) {
  EdgeRuntime.waitUntil(
    fetch(`${base}/functions/v1/analytics-sequential-continue`, {
      method: 'POST',
      headers: {
        apikey: key,
        'Content-Type': 'application/json',
        ...(secret ? { 'x-analytics-sync-secret': secret } : {}),
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: '{}',
    }).then((response) => {
      if (!response.ok) console.warn(`Continuidade do ciclo OMIE retornou HTTP ${response.status}.`);
    }).catch((error) => console.warn(`Nao foi possivel avancar o ciclo OMIE: ${error instanceof Error ? error.message : String(error)}`)),
  );
}

async function finalizeIdleRuns(client: ReturnType<typeof createServiceClient>) {
  const { data: runs, error: runsError } = await client
    .from('hubspot_sync_runs')
    .select('id')
    .eq('provider', 'hubspot')
    .in('status', ['queued', 'running', 'partial']);
  if (runsError) throw runsError;

  const finalized: Array<{ runId: string; result: unknown }> = [];
  for (const run of runs ?? []) {
    const { data, error } = await client.rpc('rpc_analytics_hubspot_finalize_run', { p_run_id: run.id });
    if (error) throw error;
    finalized.push({ runId: run.id, result: data });
  }
  return finalized;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error:'Method not allowed.' },{status:405});
  const client=createServiceClient(); const requester = await authorizeCsRunner(req,client); if(!requester) return jsonResponse({error:'Acesso negado.'},{status:403});
  const secret=Deno.env.get('ANALYTICS_SYNC_SECRET')?.trim(); const base=Deno.env.get('SUPABASE_URL')?.replace(/\/$/,''); const key=Deno.env.get('SUPABASE_ANON_KEY')?.trim();
  const authorization = requester === 'scheduler' ? null : req.headers.get('authorization');
  if(!base||!key||(!secret&&!authorization)) return jsonResponse({error:'Runtime sem configuracao segura do dispatcher.'},{status:503});
  try {
    await client.rpc('rpc_analytics_hubspot_abandon_stale_runs', { p_timeout_seconds: 900 });
    const results: WorkerResult[] = [];
    let idle = false;

    for (let i = 0; i < 12; i += 1) {
      const response = await fetch(`${base}/functions/v1/hubspot-orchestrator-worker`, {
        method: 'POST',
        headers: { apikey: key, 'Content-Type': 'application/json', ...(secret ? { 'x-analytics-sync-secret': secret } : {}), ...(authorization ? { Authorization: authorization } : {}), 'x-hubspot-worker-id': `dispatcher-${crypto.randomUUID()}` },
        body: '{}',
      });
      const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
      results.push({ status: response.status, payload });
      if (payload?.status === 'idle') { idle = true; break; }
    }

    // O ultimo worker pode ter concluido a pagina antes de enxergar que era o
    // ultimo item. Quando a fila fica ociosa, a finalizacao e tentada de novo.
    const finalized = idle ? await finalizeIdleRuns(client) : [];
    if (idle) scheduleAnalyticsContinuation(base, key, secret, authorization);
    const continuationScheduled = Boolean(secret || authorization) && !idle && results.length === 12;
    if (continuationScheduled) scheduleContinuation(base, key, secret, authorization);

    return jsonResponse({
      ok: results.every((result) => result.status < 400),
      workers: results,
      finalized,
      continuationScheduled,
    });
  } catch (error) { return runnerError(error, 502); }
});
