import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';

// HubSpot e OMIE continuam agendados separadamente; somente HubSpot passa pelo
// orquestrador comum deste lote. A funcao OMIE nao e chamada por testes locais.
const SYNC_FUNCTIONS = ['hubspot-orchestrator-dispatcher', 'analytics-integration-run'] as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });

  const configuredSecret = Deno.env.get('ANALYTICS_SYNC_SECRET')?.trim();
  const providedSecret = req.headers.get('x-analytics-sync-secret')?.trim();
  if (!configuredSecret || !providedSecret || providedSecret !== configuredSecret) {
    return jsonResponse({ error: 'Acesso negado.' }, { status: 403 });
  }

  const baseUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')?.trim();
  if (!baseUrl || !anonKey) return jsonResponse({ error: 'Runtime Supabase sem URL ou chave publica configurada.' }, { status: 503 });

  const results: Array<{ function: string; status: number; payload: unknown }> = [];
  const correlationId = crypto.randomUUID();
  for (const functionName of SYNC_FUNCTIONS) {
    try {
      const body = '{}';
      const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          'Content-Type': 'application/json',
          'x-analytics-sync-secret': configuredSecret,
          'x-analytics-correlation-id': correlationId,
        },
        body,
      });
      const payload = await response.json().catch(() => null);
      results.push({ function: functionName, status: response.status, payload });
    } catch (error) {
      results.push({ function: functionName, status: 503, payload: { error: error instanceof Error ? error.message : String(error) } });
    }
  }

  const failed = results.filter((result) => result.status >= 400);
  return jsonResponse({ ok: failed.length === 0, correlationId, results }, { status: failed.length === 0 ? 200 : 502 });
});
