import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { getAuthorizationHeader, jsonResponse } from './ticket-evidence.ts';

export const CS_TICKET_PROPERTIES = [
  'hs_pipeline', 'hs_pipeline_stage', 'hubspot_owner_id', 'source_type',
  'hs_ticket_priority', 'createdate', 'closedate',
  'hs_time_to_first_response_sla_status', 'hs_time_to_close_sla_status', 'subject',
];

export async function authorizeCsRunner(req: Request, client: SupabaseClient): Promise<string | null> {
  const configuredSecret = Deno.env.get('ANALYTICS_SYNC_SECRET')?.trim();
  const providedSecret = req.headers.get('x-analytics-sync-secret')?.trim();
  if (configuredSecret && providedSecret && providedSecret === configuredSecret) return 'scheduler';

  const authHeader = getAuthorizationHeader(req);
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  const userId = String(data.claims.sub);
  const { data: roleRow } = await client.from('user_global_roles').select('user_id').eq('user_id', userId).eq('role', 'platform_admin').maybeSingle();
  return roleRow ? userId : null;
}

export async function resolveHubSpotToken(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.rpc('rpc_service_get_managed_integration_secret', { p_integration_key: 'hubspot' });
  if (!error && typeof data === 'string' && data.trim()) return data.trim();
  const fallback = Deno.env.get('HUBSPOT_PRIVATE_APP_TOKEN')?.trim();
  if (fallback) return fallback;
  throw new Error(error ? `Falha ao ler credencial gerenciada do HubSpot: ${error.message}` : 'Credencial do HubSpot não configurada.');
}

export function runnerError(error: unknown, status = 502) {
  const raw = error instanceof Error ? error.message : String(error);
  const sanitized = raw.replace(/(Bearer\s+|pat-[A-Za-z0-9_-]+|sb_secret_[A-Za-z0-9_-]+)/gi, '[REDACTED]').slice(0, 500);
  return jsonResponse({ error: sanitized }, { status });
}

function toIsoTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function toTicketStagingRow(record: { id: string; properties: Record<string, string | null> }, pipelineId: string, parentRunId: string, pageNumber: number) {
  return {
    parent_run_id: parentRunId,
    pipeline_id: record.properties.hs_pipeline ?? pipelineId,
    ticket_id: record.id,
    pipeline_stage: record.properties.hs_pipeline_stage ?? null,
    owner_id: record.properties.hubspot_owner_id ?? null,
    source_type: record.properties.source_type ?? null,
    priority: record.properties.hs_ticket_priority ?? null,
    hs_created_at: toIsoTimestamp(record.properties.createdate),
    hs_closed_at: toIsoTimestamp(record.properties.closedate),
    time_to_first_response_sla_status: record.properties.hs_time_to_first_response_sla_status ?? null,
    time_to_close_sla_status: record.properties.hs_time_to_close_sla_status ?? null,
    raw: record.properties,
    source_page: pageNumber,
    updated_at: new Date().toISOString(),
  };
}
