import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { authorizeCsRunner, classifyHubSpotError, resolveHubSpotToken } from '../_shared/hubspot-cs-runner.ts';
import { fetchPipelineDefinitions } from '../_shared/hubspot.ts';

/**
 * Read-only local/operational preflight. It is intentionally not consumed by
 * the production dashboard: it validates configuration and one minimal API
 * response without creating a sync run or writing to HubSpot.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });

  const client = createServiceClient();
  if (!(await authorizeCsRunner(req, client))) return jsonResponse({ error: 'Acesso negado. Requer platform_admin.' }, { status: 403 });

  const correlationId = req.headers.get('x-analytics-correlation-id')?.trim() || crypto.randomUUID();
  let credentialConfigured = false;
  try {
    const token = await resolveHubSpotToken(client);
    credentialConfigured = true;
    const pipelines = await fetchPipelineDefinitions('deals', token);
    return jsonResponse({
      status: 'ready',
      provider: 'hubspot',
      correlationId,
      credentialConfigured: true,
      endpointReachable: true,
      responseValid: Array.isArray(pipelines),
      pipelinesCount: pipelines.length,
      writesExternalData: false,
    });
  } catch (error) {
    const classified = classifyHubSpotError(error);
    const endpointReachable = credentialConfigured && !['network_error', 'timeout'].includes(classified.code);
    return jsonResponse({
      status: 'failed',
      provider: 'hubspot',
      correlationId,
      credentialConfigured,
      endpointReachable,
      responseValid: false,
      writesExternalData: false,
      code: classified.code,
      error: classified.sanitizedMessage,
    }, { status: 502 });
  }
});
