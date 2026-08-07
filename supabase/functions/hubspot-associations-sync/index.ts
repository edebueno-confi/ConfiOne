// Ingestao das associations do HubSpot: Ticket -> Company e Deal -> Company.
//
// Motivo: o discovery de 2026-08-07 provou que nenhuma association estava
// ingerida, o que bloqueava clientes com atendimento aberto, MRR com ticket
// critico, MRR com SLA vencido e tickets por cliente.
//
// Caracteristicas:
//   - somente leitura no HubSpot; nenhum vinculo e criado ou removido la;
//   - idempotente, pela chave composta da tabela canonica;
//   - orientado a lote, com limite de tempo por execucao para nao estourar o
//     tempo maximo da funcao; reexecutar continua de onde parou.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { authorizeCsRunner, resolveHubSpotToken, runnerError } from '../_shared/hubspot-cs-runner.ts';
import { chunkIds, fetchAssociationsBatch, HUBSPOT_ASSOCIATION_BATCH_LIMIT } from '../_shared/hubspot.ts';

/** Margem de seguranca para encerrar antes do limite de execucao da funcao. */
const TIME_BUDGET_MS = 90_000;

type Scope = 'tickets' | 'deals';

async function loadObjectIds(
  client: ReturnType<typeof createServiceClient>,
  scope: Scope,
  afterId: string | null,
  limit: number,
): Promise<string[]> {
  const table = scope === 'tickets' ? 'hubspot_tickets' : 'hubspot_deals';
  const column = scope === 'tickets' ? 'ticket_id' : 'deal_id';
  let query = client.from(table).select(column).order(column, { ascending: true }).limit(limit);
  if (afterId) query = query.gt(column, afterId);
  const { data, error } = await query;
  if (error) throw new Error(`Falha ao listar registros locais: ${error.message}`);
  return (data ?? []).map((row: Record<string, unknown>) => String(row[column])).filter(Boolean);
}

// A marca d'agua vive no banco, nao no processo. Sem isso cada invocacao
// recomecaria do primeiro registro e a ingestao nunca alcancaria o fim da base.
async function loadCursor(
  client: ReturnType<typeof createServiceClient>,
  scope: Scope,
): Promise<string | null> {
  const { data, error } = await client
    .from('analytics_hubspot_associations_sync_state')
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
    const scope: Scope = body.scope === 'deals' ? 'deals' : 'tickets';
    const maxObjects = Math.min(Math.max(Number(body.maxObjects) || 5_000, 100), 20_000);
    const token = await resolveHubSpotToken(client);

    let cursor: string | null = body.restart === true ? null : await loadCursor(client, scope);
    let processed = 0;
    let associations = 0;
    let exhausted = false;

    while (processed < maxObjects && Date.now() - startedAt < TIME_BUDGET_MS) {
      const ids = await loadObjectIds(client, scope, cursor, HUBSPOT_ASSOCIATION_BATCH_LIMIT);
      if (ids.length === 0) { exhausted = true; break; }

      const rows = await fetchAssociationsBatch(scope, 'companies', ids, token);
      cursor = ids[ids.length - 1];
      processed += ids.length;
      if (ids.length < HUBSPOT_ASSOCIATION_BATCH_LIMIT) exhausted = true;

      // A gravacao e o avanco da marca d'agua acontecem na mesma transacao,
      // inclusive quando a pagina nao trouxe nenhum vinculo: um objeto sem
      // empresa associada tambem precisa ser considerado processado.
      const { error } = await client.rpc('rpc_service_upsert_hubspot_associations', {
        p_from_object_type: scope,
        p_to_object_type: 'companies',
        p_rows: rows,
        p_last_object_id: cursor,
        p_objects_processed: ids.length,
        p_completed: exhausted,
      });
      if (error) throw new Error(`Falha ao gravar vinculos: ${error.message}`);
      associations += rows.length;

      if (exhausted) break;
    }

    return jsonResponse({
      scope,
      objectsProcessed: processed,
      associationsIngested: associations,
      cursor: exhausted ? null : cursor,
      completed: exhausted,
      durationMs: Date.now() - startedAt,
    }, { status: 200 });
  } catch (error) {
    return runnerError(error, 500);
  }
});
