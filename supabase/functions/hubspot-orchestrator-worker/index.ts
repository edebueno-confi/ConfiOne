import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { fetchDealsPageByPipeline, fetchTicketsPageByPipeline, fetchOwners, fetchPipelineDefinitions, fetchPipelineStages } from '../_shared/hubspot.ts';
import { authorizeCsRunner, classifyHubSpotError, HUBSPOT_DEAL_PROPERTIES, CS_TICKET_PROPERTIES, resolveHubSpotToken, runnerError, toDealStagingRow, toTicketStagingRow } from '../_shared/hubspot-cs-runner.ts';

function failure(error: unknown, attempts: number) {
  const classified = classifyHubSpotError(error);
  // Retryable classification is preserved while the public message remains sanitized.
  const match = classified.retryable ? ['', 'TRANSIENT'] : null;
  const message = classified.internalMessage;
  const retryable = Boolean(match) || /timeout|tempo limite|network|fetch failed|conex[aã]o/i.test(message);
  return retryable && attempts < 5
    ? { ...classified, code: `RETRY_${classified.code.toUpperCase()}` }
    : classified;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req);
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
  const client = createServiceClient();
  if (!(await authorizeCsRunner(req, client))) return jsonResponse({ error: 'Acesso negado.' }, { status: 403 });
  const workerId = req.headers.get('x-hubspot-worker-id')?.trim() || crypto.randomUUID();
  try {
    const { data: claimed, error: claimError } = await client.rpc('rpc_analytics_hubspot_claim_work_item', { p_worker_id: workerId, p_lease_seconds: 300 });
    if (claimError) return runnerError(claimError, 409);
    const item = Array.isArray(claimed) ? claimed[0] : null;
    if (!item) return jsonResponse({ status: 'idle', workerId });
    try {
      const token = await resolveHubSpotToken(client);
      let records = [] as Array<{ id: string; properties: Record<string, string | null> }>;
      let nextCursor: string | null = null;
      if (item.object_type === 'ticket') {
        const page = await fetchTicketsPageByPipeline(item.pipeline_id, CS_TICKET_PROPERTIES, token, { cursor: item.cursor, rangeStartMs: Number(item.range_start_ms), rangeEndMs: Number(item.range_end_ms), updatedAfterMs: item.source_updated_after_ms ? Number(item.source_updated_after_ms) : undefined });
        if (!item.cursor && page.total !== null && page.total > 10_000) {
          const midpoint = Number(item.range_start_ms) + Math.floor((Number(item.range_end_ms) - Number(item.range_start_ms)) / 2);
          if (midpoint <= Number(item.range_start_ms) || midpoint >= Number(item.range_end_ms)) throw new Error('Intervalo de busca de tickets sem ponto de particionamento.');
          const { data: splitResult, error: splitError } = await client.rpc('rpc_analytics_hubspot_split_work_item', { p_work_item_id: item.work_item_id, p_worker_id: workerId, p_midpoint_ms: midpoint });
          if (splitError) throw splitError;
          return jsonResponse({ status: 'split', runId: item.run_id, workItemId: item.work_item_id, total: page.total, split: splitResult });
        }
        records = page.records; nextCursor = page.nextCursor;
        const rows = records.map((r) => toTicketStagingRow(r, item.pipeline_id, item.run_id, Number(item.page_number)));
        if (rows.length) { const { error } = await client.from('analytics_cs_ticket_staging').upsert(rows, { onConflict: 'parent_run_id,ticket_id' }); if (error) throw error; }
      } else if (item.object_type === 'deal') {
        const page = await fetchDealsPageByPipeline(item.pipeline_id, HUBSPOT_DEAL_PROPERTIES, token, { cursor: item.cursor, updatedAfterMs: item.source_updated_after_ms ? Number(item.source_updated_after_ms) : undefined });
        records = page.records; nextCursor = page.nextCursor;
        const rows = records.map((r) => toDealStagingRow(r, item.pipeline_id, item.run_id, Number(item.page_number)));
        if (rows.length) { const { error } = await client.from('analytics_hubspot_deal_staging').upsert(rows, { onConflict: 'parent_run_id,deal_id' }); if (error) throw error; }
      } else if (item.object_type === 'shared') {
        const companies = await (await import('../_shared/hubspot.ts')).fetchCompanies(['name','domain','cnpj','aftersale___mrr','status_do_cliente___aftersale','status_do_contrato','cs_owner___aftersale'], token);
        if (companies.length) { const rows = companies.map((r) => ({ company_id:r.id,name:r.properties.name??null,domain:r.properties.domain??null,tax_id:(r.properties.cnpj??'').replace(/\D/g,'')||null,mrr:Number(r.properties.aftersale___mrr??0)||0,client_status:r.properties.status_do_cliente___aftersale??null,contract_status:r.properties.status_do_contrato??null,cs_owner_id:r.properties.cs_owner___aftersale??null,raw:r.properties,synced_at:new Date().toISOString() })); for (let offset = 0; offset < rows.length; offset += 500) { const { error } = await client.from('hubspot_companies').upsert(rows.slice(offset, offset + 500),{onConflict:'company_id'}); if(error) throw error; } }
        const owners = await fetchOwners(token); if (owners.length) { const rows=owners.map((o)=>({owner_id:o.ownerId,email:o.email,first_name:o.firstName,last_name:o.lastName,full_name:o.fullName,archived:o.archived,raw:o.raw,synced_at:new Date().toISOString()})); const {error}=await client.from('hubspot_owners').upsert(rows,{onConflict:'owner_id'}); if(error) throw error; }
        for (const objectType of ['deals', 'tickets'] as const) {
          const definitions = await fetchPipelineDefinitions(objectType, token);
          const activeDefinitions = definitions.filter((pipeline) => !pipeline.archived);
          const catalogObjectType = objectType === 'deals' ? 'deal' : 'ticket';
          const { error: catalogError } = await client.rpc('rpc_service_reconcile_hubspot_pipeline_catalog', {
            p_object_type: catalogObjectType,
            p_pipelines: activeDefinitions.map((pipeline) => ({ pipeline_id: pipeline.pipelineId, label: pipeline.label })),
          });
          if (catalogError) throw catalogError;
          for (const pipeline of activeDefinitions) {
            for (const stage of pipeline.stages) {
              const { error } = await client.from('hubspot_pipeline_stages').upsert({
                object_type: catalogObjectType,
                pipeline_id: pipeline.pipelineId,
                stage_id: stage.stageId,
                label: stage.label,
                display_order: stage.displayOrder,
                is_closed: stage.isClosed,
                is_won: stage.isWon,
                metadata: stage.metadata,
                synced_at: new Date().toISOString(),
              }, { onConflict: 'object_type,pipeline_id,stage_id' });
              if (error) throw error;
            }
          }
        }
      }
      const { error: checkpointError } = await client.rpc('rpc_analytics_hubspot_checkpoint_work_item', { p_work_item_id:item.work_item_id,p_worker_id:workerId,p_next_cursor:nextCursor,p_page_number:Number(item.page_number)+1,p_received:records.length,p_accepted:records.length,p_rejected:0,p_completed:!nextCursor,p_error_code:null,p_error_message:null });
      if (checkpointError) throw checkpointError;
      const { data: finalized, error: finalizeError } = await client.rpc('rpc_analytics_hubspot_finalize_run',{p_run_id:item.run_id}); if(finalizeError) throw finalizeError;
      return jsonResponse({status:nextCursor?'checkpointed':'completed',runId:item.run_id,workItemId:item.work_item_id,received:records.length,nextCursor,finalized});
    } catch (error) {
      const f=failure(error,Number(item.attempts));
      await client.rpc('rpc_analytics_hubspot_checkpoint_work_item',{p_work_item_id:item.work_item_id,p_worker_id:workerId,p_next_cursor:item.cursor,p_page_number:Number(item.page_number),p_received:0,p_accepted:0,p_rejected:0,p_completed:false,p_error_code:f.code,p_error_message:f.sanitizedMessage});
      await client.rpc('rpc_analytics_hubspot_finalize_run',{p_run_id:item.run_id});
      await client.from('hubspot_sync_runs').update({
        error_code: f.code,
        error_message: f.sanitizedMessage,
        internal_error_code: f.code,
        provider_code: f.providerCode,
        internal_message: f.internalMessage,
        sanitized_error: f.sanitizedMessage,
        error_occurred_at: new Date().toISOString(),
      }).eq('id', item.run_id);
      return runnerError({message:f.internalMessage},f.code.startsWith('RETRY_')?503:422);
    }
  } catch (error) { return runnerError(error,500); }
});
