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
    const [dealPipelines, ticketPipelines] = await Promise.all([
      fetchPipelineDefinitions('deals', token),
      fetchPipelineDefinitions('tickets', token),
    ]);
    const pipelines = [...dealPipelines, ...ticketPipelines];
    const nonArchived = pipelines.filter((pipeline) => !pipeline.archived);
    const archived = pipelines.filter((pipeline) => pipeline.archived);
    const { data: localCatalog, error: catalogError } = await client
      .from('analytics_source_config')
      .select('object_type,hubspot_pipeline_id')
      .eq('is_archived', false);
    if (catalogError) throw new Error(`Falha ao ler cobertura local do catálogo: ${catalogError.message}`);
    const liveKeys = new Set([
      ...dealPipelines.filter((pipeline) => !pipeline.archived).map((pipeline) => `deal:${pipeline.pipelineId}`),
      ...ticketPipelines.filter((pipeline) => !pipeline.archived).map((pipeline) => `ticket:${pipeline.pipelineId}`),
    ]);
    const localKeys = new Set((localCatalog ?? []).map((row) => `${row.object_type}:${row.hubspot_pipeline_id}`));
    const missingFromCatalog = [...liveKeys].filter((key) => !localKeys.has(key)).length;
    const localOnly = [...localKeys].filter((key) => !liveKeys.has(key)).length;
    return jsonResponse({
      status: 'ready',
      provider: 'hubspot',
      correlationId,
      credentialConfigured: true,
      endpointReachable: true,
      responseValid: Array.isArray(dealPipelines) && Array.isArray(ticketPipelines),
      pipelinesCount: pipelines.length,
      pipelineCounts: {
        deals: dealPipelines.length,
        tickets: ticketPipelines.length,
      },
      nonArchivedPipelineCounts: {
        total: nonArchived.length,
        deals: dealPipelines.filter((pipeline) => !pipeline.archived).length,
        tickets: ticketPipelines.filter((pipeline) => !pipeline.archived).length,
      },
      archivedPipelineCount: archived.length,
      catalogCoverage: {
        liveNonArchived: liveKeys.size,
        localNonArchived: localKeys.size,
        missingFromLocalCatalog: missingFromCatalog,
        localOnlyNonArchived: localOnly,
      },
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
