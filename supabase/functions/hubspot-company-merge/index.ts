import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { createServiceClient, getAuthorizationHeader, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { mergeCompanies } from '../_shared/hubspot.ts';

interface MergeRequest {
  primaryCompanyId?: unknown;
  objectIdToMerge?: unknown;
  confirmation?: unknown;
  reason?: unknown;
}

function text(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim();
}

async function authorize(req: Request, client: SupabaseClient): Promise<string | null> {
  const token = getAuthorizationHeader(req).replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  const userId = String(data.claims.sub);
  const { data: roleRow, error: roleError } = await client
    .from('user_global_roles')
    .select('user_id')
    .eq('user_id', userId)
    .eq('role', 'platform_admin')
    .maybeSingle();
  return roleError || !roleRow ? null : userId;
}

async function resolveHubSpotToken(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.rpc('rpc_service_get_managed_integration_secret', { p_integration_key: 'hubspot' });
  if (!error && typeof data === 'string' && data.trim()) return data.trim();
  const fallback = Deno.env.get('HUBSPOT_PRIVATE_APP_TOKEN')?.trim();
  if (fallback) return fallback;
  throw new Error(error?.message ?? 'Credencial gerenciada do HubSpot indisponível.');
}

function isCompanyId(value: string) {
  return /^\d{1,30}$/.test(value);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });

  const client = createServiceClient();
  const actorId = await authorize(req, client);
  if (!actorId) return jsonResponse({ error: 'Acesso negado. Requer platform_admin.' }, { status: 403 });

  try {
    const body = await req.json() as MergeRequest;
    const primaryCompanyId = text(body.primaryCompanyId);
    const objectIdToMerge = text(body.objectIdToMerge);
    const confirmation = text(body.confirmation);
    const reason = text(body.reason) || null;

    if (!isCompanyId(primaryCompanyId) || !isCompanyId(objectIdToMerge) || primaryCompanyId === objectIdToMerge) {
      return jsonResponse({ error: 'Informe dois IDs HubSpot de empresas diferentes.' }, { status: 422 });
    }
    if (confirmation !== 'UNIFICAR') {
      return jsonResponse({ error: 'Confirmação inválida. Digite UNIFICAR para autorizar esta ação.' }, { status: 422 });
    }

    const { data: companies, error: companyError } = await client
      .from('hubspot_companies')
      .select('company_id,name,tax_id,domain,contract_status,client_status,cs_owner_id')
      .in('company_id', [primaryCompanyId, objectIdToMerge]);
    if (companyError) throw new Error(`Falha ao validar empresas candidatas: ${companyError.message}`);
    if (!companies || companies.length !== 2) return jsonResponse({ error: 'As duas empresas precisam existir no cache sincronizado do HubSpot.' }, { status: 409 });

    const { data: audit, error: auditError } = await client.from('analytics_hubspot_merge_runs').insert({
      primary_company_id: primaryCompanyId,
      merged_company_id: objectIdToMerge,
      requested_by_user_id: actorId,
      status: 'running',
      reason,
    }).select('id').single();
    if (auditError || !audit) throw new Error(`Falha ao registrar auditoria do merge: ${auditError?.message ?? 'registro ausente'}`);

    try {
      const result = await mergeCompanies(primaryCompanyId, objectIdToMerge, await resolveHubSpotToken(client));
      await client.from('analytics_hubspot_merge_runs').update({ status: 'succeeded', hubspot_result: { id: result.id ?? null, archived: result.archived ?? null, url: result.url ?? null, objectWriteTraceId: result.objectWriteTraceId ?? null }, finished_at: new Date().toISOString() }).eq('id', audit.id);
      return jsonResponse({ ok: true, auditId: audit.id, mergedCompanyId: result.id ?? null, syncRecommended: true, message: 'Empresa unificada no HubSpot. Execute uma sincronização para atualizar o cache local.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha desconhecida ao unificar empresas.';
      await client.from('analytics_hubspot_merge_runs').update({ status: 'failed', error_message: message.slice(0, 1000), finished_at: new Date().toISOString() }).eq('id', audit.id);
      throw error;
    }
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Falha ao unificar empresas no HubSpot.' }, { status: 502 });
  }
});
