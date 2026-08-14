import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { authorizeCsRunner, runnerMessage } from '../_shared/hubspot-cs-runner.ts';
import { claimCycleOmieStep, finishCycleAfterOmie } from '../_shared/analytics-sequential-continuation.ts';

type FunctionPayload = Record<string, unknown> | null;

function runtimeConfig() {
  const baseUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')?.trim();
  const secret = Deno.env.get('ANALYTICS_SYNC_SECRET')?.trim() || null;
  if (!baseUrl || !anonKey) throw new Error('Runtime sem configuracao segura para continuar o ciclo.');
  return { baseUrl, anonKey, secret };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });

  const client = createServiceClient();
  const requester = await authorizeCsRunner(req, client);
  if (!requester) return jsonResponse({ error: 'Acesso negado.' }, { status: 403 });

  try {
    const config = runtimeConfig();
    const claim = await claimCycleOmieStep(client);
    if (claim.status !== 'claimed') return jsonResponse({ status: claim.status, omie: { status: 'not_started' } }, { status: 200 });

    const authorization = requester === 'scheduler' ? null : req.headers.get('authorization');
    let responseStatus = 502;
    let payload: FunctionPayload = { error: 'Não foi possível alcançar a função local do OMIE.' };
    try {
      const response = await fetch(`${config.baseUrl}/functions/v1/omie-sync`, {
        method: 'POST',
        headers: {
          apikey: config.anonKey,
          'Content-Type': 'application/json',
          ...(authorization ? { Authorization: authorization } : {}),
          ...(config.secret ? { 'x-analytics-sync-secret': config.secret } : {}),
          'x-analytics-correlation-id': claim.cycle.correlation_id,
          'x-analytics-cycle-id': claim.cycle.id,
        },
        body: '{}',
      });
      responseStatus = response.status;
      payload = await response.json().catch(() => null) as FunctionPayload;
    } catch (error) {
      payload = { error: runnerMessage(error) };
    }
    const result = await finishCycleAfterOmie(client, claim.cycle.id, claim.hubspotSucceeded, responseStatus, payload);
    return jsonResponse({ ...result, cycleId: claim.cycle.id, omie: payload }, { status: responseStatus >= 500 ? 502 : 200 });
  } catch (error) {
    return jsonResponse({ status: 'failed', error: runnerMessage(error) }, { status: 502 });
  }
});
