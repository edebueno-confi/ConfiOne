// Entry point canonico da sincronizacao read-only de Contas a Receber via Omie.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, getAuthorizationHeader, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { parseOmieCredentials } from '../_shared/omie.ts';
import { runOmieSnapshot } from '../_shared/omie-sync-service.ts';

async function authorize(req: Request, client: ReturnType<typeof createServiceClient>): Promise<string | null> {
  const configured = Deno.env.get('ANALYTICS_SYNC_SECRET');
  if (configured && req.headers.get('x-analytics-sync-secret') === configured) return null;
  const token = getAuthorizationHeader(req).replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data } = await client.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: role } = await client.from('user_global_roles').select('user_id').eq('user_id', String(userId)).eq('role', 'platform_admin').maybeSingle();
  return role ? String(userId) : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
  const client = createServiceClient();
  const actorId = await authorize(req, client);
  const scheduled = Boolean(Deno.env.get('ANALYTICS_SYNC_SECRET') && req.headers.get('x-analytics-sync-secret') === Deno.env.get('ANALYTICS_SYNC_SECRET'));
  if (!actorId && !scheduled) return jsonResponse({ error: 'Acesso negado. Requer platform_admin.' }, { status: 403 });

  const { data: secret, error: secretError } = await client.rpc('rpc_service_get_managed_integration_secret', { p_integration_key: 'omie' });
  if (secretError) return jsonResponse({ error: 'Falha ao ler credencial Omie.' }, { status: 500 });
  if (typeof secret !== 'string' || !secret.trim()) return jsonResponse({ error: 'Credencial Omie nao configurada.' }, { status: 409 });

  const rawCorrelation = req.headers.get('x-analytics-correlation-id')?.trim() ?? '';
  const correlationId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawCorrelation) ? rawCorrelation : crypto.randomUUID();
  try {
    const result = await runOmieSnapshot(client, parseOmieCredentials(secret), scheduled ? null : actorId, correlationId);
    return jsonResponse({ ok: true, mode: scheduled ? 'scheduled' : 'api', ...result, message: 'Consulta Omie concluida e snapshot financeiro promovido.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/OMIE_SYNC_IN_PROGRESS|REDUNDANT|8020/i.test(message)) return jsonResponse({ error: 'A API Omie esta ocupada ou ja existe uma sincronizacao em andamento.', code: 'OMIE_PROVIDER_BUSY' }, { status: 409, headers: { 'retry-after': '30' } });
    return jsonResponse({ error: 'Falha ao concluir a sincronizacao Omie.', syncRunId: (error as { syncRunId?: string }).syncRunId ?? null }, { status: 502 });
  }
});
