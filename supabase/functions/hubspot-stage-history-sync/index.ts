// Reconstrucao do historico de estagio a partir do HubSpot.
//
// Motivo: a conta nao preenche `closedate` em tickets. Em 2026-08-07 havia
// 31.530 tickets em estagios com ticketState = CLOSED e nenhum com data de
// fechamento. Ficou provado que `hs_lastmodifieddate` nao serve de substituto:
// 19.888 deles se concentram em tres dias de julho de 2026, rastro de operacao
// em massa, com mediana de 912 dias entre criacao e ultima modificacao.
//
// O historico da propriedade de estagio e a unica fonte fiel. Dele derivam a
// data real de resolucao, o tempo de resolucao, o tempo em estagio e a taxa de
// reabertura -- inclusive retroativamente.
//
// Caracteristicas:
//   - somente leitura no HubSpot;
//   - idempotente pela chave (objeto, instante da mudanca);
//   - retomavel: a marca d'agua fica no banco, entao reexecutar continua de
//     onde parou em vez de reprocessar dezenas de milhares de objetos.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { authorizeCsRunner, resolveHubSpotToken, runnerError } from '../_shared/hubspot-cs-runner.ts';
import { fetchStageHistoryBatch, HUBSPOT_HISTORY_BATCH_LIMIT } from '../_shared/hubspot.ts';

const TIME_BUDGET_MS = 90_000;

type Scope = 'ticket' | 'deal';

async function loadObjectIds(
  client: ReturnType<typeof createServiceClient>,
  scope: Scope,
  afterId: string | null,
  limit: number,
): Promise<string[]> {
  const table = scope === 'ticket' ? 'hubspot_tickets' : 'hubspot_deals';
  const column = scope === 'ticket' ? 'ticket_id' : 'deal_id';
  let query = client.from(table).select(column).order(column, { ascending: true }).limit(limit);
  if (afterId) query = query.gt(column, afterId);
  const { data, error } = await query;
  if (error) throw new Error(`Falha ao listar registros locais: ${error.message}`);
  return (data ?? []).map((row: Record<string, unknown>) => String(row[column])).filter(Boolean);
}

async function loadCursor(
  client: ReturnType<typeof createServiceClient>,
  scope: Scope,
): Promise<string | null> {
  const { data, error } = await client
    .from('analytics_hubspot_history_sync_state')
    .select('last_object_id')
    .eq('object_type', scope)
    .maybeSingle();
  if (error) throw new Error(`Falha ao ler o progresso da ingestao: ${error.message}`);
  return (data?.last_object_id as string | null) ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });

  const client = createServiceClient();
  if (!(await authorizeCsRunner(req, client))) {
    return jsonResponse({ error: 'Acesso negado. Requer platform_admin.' }, { status: 403 });
  }

  const startedAt = Date.now();
  try {
    const body = await req.json().catch(() => ({})) as { scope?: string; restart?: boolean; maxObjects?: number };
    const scope: Scope = body.scope === 'deal' ? 'deal' : 'ticket';
    const maxObjects = Math.min(Math.max(Number(body.maxObjects) || 2_000, 50), 10_000);
    const token = await resolveHubSpotToken(client);

    let cursor: string | null = body.restart === true ? null : await loadCursor(client, scope);
    let processed = 0;
    let events = 0;
    let exhausted = false;

    while (processed < maxObjects && Date.now() - startedAt < TIME_BUDGET_MS) {
      const ids = await loadObjectIds(client, scope, cursor, HUBSPOT_HISTORY_BATCH_LIMIT);
      if (ids.length === 0) { exhausted = true; break; }

      const rows = await fetchStageHistoryBatch(scope === 'ticket' ? 'tickets' : 'deals', ids, token);
      cursor = ids[ids.length - 1];
      processed += ids.length;
      const isLastPage = ids.length < HUBSPOT_HISTORY_BATCH_LIMIT;
      if (isLastPage) exhausted = true;

      // A marca d'agua avanca junto com a gravacao, na mesma transacao, para
      // que uma interrupcao no meio nao pule objetos nem os reprocesse.
      const { error } = await client.rpc('rpc_service_upsert_hubspot_stage_events', {
        p_object_type: scope,
        p_rows: rows,
        p_last_object_id: cursor,
        p_objects_processed: ids.length,
        p_completed: exhausted,
      });
      if (error) throw new Error(`Falha ao gravar o historico de estagio: ${error.message}`);
      events += rows.length;

      if (exhausted) break;
    }

    return jsonResponse({
      scope,
      objectsProcessed: processed,
      stageEventsIngested: events,
      cursor: exhausted ? null : cursor,
      completed: exhausted,
      durationMs: Date.now() - startedAt,
    }, { status: 200 });
  } catch (error) {
    return runnerError(error, 500);
  }
});
