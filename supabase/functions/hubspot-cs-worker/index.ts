import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { fetchTicketsPageByPipeline } from '../_shared/hubspot.ts';
import { authorizeCsRunner, CS_TICKET_PROPERTIES, resolveHubSpotToken, runnerError, toTicketStagingRow } from '../_shared/hubspot-cs-runner.ts';

function classifyFailure(error: unknown, attempts: number) {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/\((429|5\d\d)\)/);
  const retryable = Boolean(match) || /timeout|tempo limite|network|fetch failed|conex[aã]o/i.test(message);
  if (retryable && attempts < 5) return { code: `RETRY_${match?.[1] ?? 'TRANSIENT'}`, message };
  return { code: match?.[1] === '403' ? 'FORBIDDEN' : 'PERMANENT_FAILURE', message };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
  const client = createServiceClient();
  const actor = await authorizeCsRunner(req, client);
  if (!actor) return jsonResponse({ error: 'Acesso negado.' }, { status: 403 });
  const workerId = req.headers.get('x-cs-worker-id')?.trim() || crypto.randomUUID();
  try {
    const { data: claimed, error: claimError } = await client.rpc('rpc_analytics_cs_claim_work_item', { p_worker_id: workerId, p_lease_seconds: 90 });
    if (claimError) return runnerError(claimError, 409);
    const item = Array.isArray(claimed) ? claimed[0] : null;
    if (!item) return jsonResponse({ status: 'idle', workerId });

    try {
      const token = await resolveHubSpotToken(client);
      const page = await fetchTicketsPageByPipeline(item.pipeline_id, CS_TICKET_PROPERTIES, token, {
        cursor: item.cursor,
        rangeStartMs: Number(item.range_start_ms),
        rangeEndMs: Number(item.range_end_ms),
      });
      if (page.total !== null && page.total > 10000 && Number(item.page_number) === 0 && !item.cursor) {
        const { data: partitioned, error: partitionError } = await client.rpc('rpc_analytics_cs_split_work_item', { p_work_item_id: item.work_item_id, p_worker_id: workerId });
        if (partitionError) throw partitionError;
        return jsonResponse({ status: 'partitioned', runId: item.run_id, workItemId: item.work_item_id, total: page.total, partitioned });
      }
      const rows = page.records.map((record) => toTicketStagingRow(record, item.pipeline_id, item.run_id, item.page_number));
      if (rows.length > 0) {
        const { error: stagingError } = await client.from('analytics_cs_ticket_staging').upsert(rows, { onConflict: 'parent_run_id,ticket_id' });
        if (stagingError) throw new Error(`Falha ao gravar staging CS: ${stagingError.message}`);
      }
      const { error: checkpointError } = await client.rpc('rpc_analytics_cs_checkpoint_work_item', {
        p_work_item_id: item.work_item_id,
        p_worker_id: workerId,
        p_next_cursor: page.nextCursor,
        p_page_number: Number(item.page_number) + 1,
        p_received: rows.length,
        p_accepted: rows.length,
        p_rejected: 0,
        p_completed: !page.nextCursor,
        p_error_code: null,
        p_error_message: null,
      });
      if (checkpointError) throw checkpointError;
      const { data: finalized, error: finalizeError } = await client.rpc('rpc_analytics_cs_finalize_run', { p_run_id: item.run_id });
      if (finalizeError) throw finalizeError;
      if (finalized && typeof finalized === 'object' && 'status' in finalized && (finalized as { status?: string }).status === 'success') {
        await client.from('analytics_integration_schedule').update({
          hubspot_last_run_at: new Date().toISOString(),
          hubspot_last_status: 'success',
          hubspot_last_message: 'Carga assíncrona de CS concluída.',
        }).limit(1);
      }
      return jsonResponse({ status: page.nextCursor ? 'checkpointed' : 'completed', runId: item.run_id, workItemId: item.work_item_id, received: rows.length, nextCursor: page.nextCursor, finalized });
    } catch (error) {
      const failure = classifyFailure(error, Number(item.attempts));
      const { error: failureCheckpointError } = await client.rpc('rpc_analytics_cs_checkpoint_work_item', {
        p_work_item_id: item.work_item_id,
        p_worker_id: workerId,
        p_next_cursor: item.cursor,
        p_page_number: Number(item.page_number),
        p_received: 0,
        p_accepted: 0,
        p_rejected: 0,
        p_completed: false,
        p_error_code: failure.code,
        p_error_message: failure.message,
      });
      if (failureCheckpointError) throw failureCheckpointError;
      await client.rpc('rpc_analytics_cs_finalize_run', { p_run_id: item.run_id });
      return runnerError({ message: failure.message }, failure.code.startsWith('RETRY_') ? 503 : 422);
    }
  } catch (error) {
    return runnerError(error, 500);
  }
});
