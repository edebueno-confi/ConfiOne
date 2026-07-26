import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { createServiceClient, getAuthorizationHeader, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { fetchPipelineDefinitions, fetchTicketPipelineTotal } from '../_shared/hubspot.ts';

async function authorize(req: Request, client: SupabaseClient): Promise<string | null> {
  const token = getAuthorizationHeader(req).replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data } = await client.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: role } = await client.from('user_global_roles').select('user_id').eq('user_id', String(userId)).eq('role', 'platform_admin').maybeSingle();
  return role ? String(userId) : null;
}

async function resolveHubSpotToken(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.rpc('rpc_service_get_managed_integration_secret', { p_integration_key: 'hubspot' });
  if (!error && typeof data === 'string' && data.trim()) return data.trim();
  const fallback = Deno.env.get('HUBSPOT_PRIVATE_APP_TOKEN')?.trim();
  if (fallback) return fallback;
  throw new Error('Credencial gerenciada do HubSpot indisponível.');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
  const client = createServiceClient();
  if (!(await authorize(req, client))) return jsonResponse({ error: 'Acesso negado. Requer platform_admin.' }, { status: 403 });
  try {
    const token = await resolveHubSpotToken(client);
    const pipelines = (await fetchPipelineDefinitions('tickets', token)).filter((pipeline) => !pipeline.archived);
    const results = [];
    for (const pipeline of pipelines) {
      const total = await fetchTicketPipelineTotal(pipeline.pipelineId, token);
      results.push({
        pipelineId: pipeline.pipelineId,
        label: pipeline.label,
        stages: pipeline.stages.map((stage) => ({ id: stage.stageId, label: stage.label, closed: stage.isClosed })),
        total,
      });
    }
    return jsonResponse({ ok: true, object: 'tickets', total: results.reduce((sum, row) => sum + row.total, 0), pipelines: results });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Falha ao consultar a origem HubSpot.' }, { status: 502 });
  }
});
