import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { authorizeCsRunner, runnerError } from '../_shared/hubspot-cs-runner.ts';

function dispatchQueuedRun(req: Request) {
  const baseUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')?.trim();
  if (!baseUrl || !anonKey) return;

  EdgeRuntime.waitUntil(
    fetch(`${baseUrl}/functions/v1/hubspot-orchestrator-dispatcher`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        'Content-Type': 'application/json',
        ...(req.headers.get('authorization') ? { Authorization: req.headers.get('authorization')! } : {}),
      },
      body: '{}',
    }).then((response) => {
      if (!response.ok) console.warn(`Dispatcher HubSpot retornou HTTP ${response.status} após o start manual.`);
    }).catch((error) => console.warn(`Não foi possível disparar o dispatcher HubSpot: ${error instanceof Error ? error.message : String(error)}`)),
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
  const client = createServiceClient();
  if (!(await authorizeCsRunner(req, client))) return jsonResponse({ error: 'Acesso negado. Requer platform_admin.' }, { status: 403 });
  try {
    const body = await req.json().catch(() => ({})) as { domain?: string; full?: boolean; correlationId?: string };
    const domain = body.domain === 'commercial' ? 'commercial' : body.domain === 'cs' || body.domain === 'cs_support' ? 'cs' : null;
    const { data, error } = await client.rpc('rpc_analytics_hubspot_start_run', { p_domain_key: domain, p_mode: body.full ? 'full' : null, p_correlation_id: body.correlationId ?? crypto.randomUUID() });
    if (error) return runnerError(error, /andamento/i.test(error.message) ? 409 : 400);
    dispatchQueuedRun(req);
    return jsonResponse(data, { status: 202 });
  } catch (error) { return runnerError(error, 500); }
});
