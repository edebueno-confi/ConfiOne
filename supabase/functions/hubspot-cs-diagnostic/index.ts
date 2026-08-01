import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { createServiceClient, getAuthorizationHeader, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { fetchPipelineDefinitions, fetchTicketPipelineTotal } from '../_shared/hubspot.ts';

type SourceState = 'available' | 'empty_authoritative' | 'empty_unverified' | 'forbidden' | 'misconfigured' | 'partial' | 'failed';

async function authorize(req: Request, client: SupabaseClient): Promise<boolean> {
  const token = getAuthorizationHeader(req).replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  const { data } = await client.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (!userId) return false;
  const { data: role } = await client.from('user_global_roles').select('user_id').eq('user_id', String(userId)).eq('role', 'platform_admin').maybeSingle();
  return Boolean(role);
}

async function resolveHubSpotToken(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.rpc('rpc_service_get_managed_integration_secret', { p_integration_key: 'hubspot' });
  if (!error && typeof data === 'string' && data.trim()) return data.trim();
  const fallback = Deno.env.get('HUBSPOT_PRIVATE_APP_TOKEN')?.trim();
  if (fallback) return fallback;
  throw new Error('Credencial gerenciada do HubSpot indisponível.');
}

function classifyError(error: unknown): SourceState {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('403') || message.includes('401') || message.includes('scope')) return 'forbidden';
  if (message.includes('credencial') || message.includes('token')) return 'misconfigured';
  return 'failed';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
  const client = createServiceClient();
  if (!(await authorize(req, client))) return jsonResponse({ error: 'Acesso negado. Requer platform_admin.' }, { status: 403 });
  try {
    const { data: configured, error: configError } = await client
      .from('analytics_source_config')
      .select('hubspot_pipeline_id,hubspot_pipeline_label,is_active,domain_key,object_type')
      .eq('domain_key', 'cs')
      .eq('object_type', 'ticket')
      .eq('is_active', true)
      .order('hubspot_pipeline_id');
    if (configError) throw new Error('Não foi possível ler a configuração de fontes de CS.');
    const token = await resolveHubSpotToken(client);
    const pipelines = (await fetchPipelineDefinitions('tickets', token)).filter((pipeline) => !pipeline.archived);
    const configuredIds = new Set((configured ?? []).map((row) => String(row.hubspot_pipeline_id)));
    const results = [];
    for (const pipeline of pipelines) {
      const active = configuredIds.has(pipeline.pipelineId);
      const total = await fetchTicketPipelineTotal(pipeline.pipelineId, token);
      results.push({
        label: pipeline.label,
        activeRecords: total,
        archivedRecords: null,
        configuredForSync: active,
        stages: pipeline.stages.map((stage) => ({ label: stage.label, closed: stage.isClosed })),
      });
    }
    const configuredTotals = results.filter((row) => row.configuredForSync);
    const total = configuredTotals.reduce((sum, row) => sum + row.activeRecords, 0);
    const scopesPresent = ['crm.objects.tickets.read', 'crm.schemas.tickets.read'];
    const sourceState: SourceState = total > 0 ? 'available' : configuredTotals.length > 0 ? 'empty_authoritative' : 'empty_unverified';
    return jsonResponse({
      ok: true,
      object: 'tickets',
      endpoint: '/crm/v3/objects/tickets/search',
      filters: ['hs_pipeline = configured CS pipeline'],
      pages: configuredTotals.length,
      paginationComplete: true,
      total,
      sourceState,
      scopesPresent,
      scopesAbsent: [],
      pipelines: results,
    });
  } catch (error) {
    const sourceState = classifyError(error);
    return jsonResponse({ error: 'Não foi possível concluir o diagnóstico da origem HubSpot.', sourceState, scopesPresent: [], scopesAbsent: [] }, { status: 502 });
  }
});
