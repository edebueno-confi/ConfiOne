// Compatibilidade de rota: a persistencia do HubSpot foi consolidada no
// orquestrador assincrono comum. Nenhuma coleta monolitica permanece aqui.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { authorizeCsRunner, runnerError } from '../_shared/hubspot-cs-runner.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
  const client = createServiceClient();
  if (!(await authorizeCsRunner(req, client))) return jsonResponse({ error: 'Acesso negado.' }, { status: 403 });
  try {
    const body = await req.json().catch(() => ({})) as { domain?: string; scope?: string; full?: boolean; correlationId?: string };
    const domain = body.domain === 'commercial' || body.scope === 'commercial' ? 'commercial' : body.domain === 'cs' || body.scope === 'cs' ? 'cs' : null;
    const { data, error } = await client.rpc('rpc_analytics_hubspot_start_run', { p_domain_key: domain, p_mode: body.full ? 'full' : null, p_correlation_id: body.correlationId ?? crypto.randomUUID() });
    if (error) return runnerError(error, /andamento/i.test(error.message) ? 409 : 400);
    return jsonResponse({ ...(data as Record<string, unknown>), engine: 'hubspot-orchestrator' }, { status: 202 });
  } catch (error) { return runnerError(error, 500); }
});
