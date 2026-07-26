import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { authorizeCsRunner, runnerError } from '../_shared/hubspot-cs-runner.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
  const client = createServiceClient();
  const actor = await authorizeCsRunner(req, client);
  if (!actor) return jsonResponse({ error: 'Acesso negado. Requer platform_admin.' }, { status: 403 });
  try {
    const body = await req.json().catch(() => ({})) as { correlationId?: string };
    const { data, error } = await client.rpc('rpc_analytics_cs_start_run', { p_correlation_id: body.correlationId ?? crypto.randomUUID() });
    if (error) return runnerError(error, /andamento/i.test(error.message) ? 409 : 400);
    return jsonResponse(data, { status: 202 });
  } catch (error) {
    return runnerError(error, 500);
  }
});
