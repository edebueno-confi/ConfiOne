import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServiceClient, jsonResponse, optionsResponse } from '../_shared/ticket-evidence.ts';
import { fetchCompaniesPage, fetchDealsPageByPipeline, fetchTicketsPageByPipeline, fetchOwnersPage, fetchPipelineDefinitions } from '../_shared/hubspot.ts';
import { authorizeCsRunner, classifyHubSpotError, HUBSPOT_DEAL_PROPERTIES, CS_TICKET_PROPERTIES, resolveHubSpotToken, runnerError, runnerMessage, toDealStagingRow, toIsoTimestamp, toTicketStagingRow } from '../_shared/hubspot-cs-runner.ts';
import { createSyncRequestTelemetryBuffer } from '../_shared/sync-request-telemetry.ts';

/**
 * Orcamento de retentativa medido em falhas, nao em progresso.
 *
 * `attempts` incrementa a cada reivindicacao do item, ou seja uma vez por
 * pagina processada. Comparar `attempts` com um teto fixo tornava qualquer erro
 * transitorio permanente a partir da sexta pagina. Numa carga completa, com mais
 * de 470 paginas, bastava um unico timeout de 20s do HubSpot para reprovar o
 * item, e a promocao descarta todo o trabalho quando um item falha.
 *
 * `page_number` so avanca quando uma pagina e concluida com sucesso. A diferenca
 * entre as duas contagens e, portanto, o numero de falhas acumuladas naquele
 * item -- que e o que deve consumir o orcamento.
 */
const MAX_CONSECUTIVE_FAILURES = 5;

function failure(error: unknown, attempts: number, pageNumber: number) {
  const classified = classifyHubSpotError(error);
  const message = runnerMessage(error);
  const retryable = classified.retryable
    || /timeout|tempo limite|network|fetch failed|conex[aã]o/i.test(message);
  const failures = Math.max(0, Number(attempts) - Number(pageNumber));
  return retryable && failures < MAX_CONSECUTIVE_FAILURES
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
    const { data: runContext, error: runContextError } = await client
      .from('hubspot_sync_runs')
      .select('cycle_id')
      .eq('id', item.run_id)
      .maybeSingle();
    if (runContextError) return runnerError(runContextError, 500);
    const telemetry = createSyncRequestTelemetryBuffer({ provider: 'hubspot', hubspotRunId: item.run_id, cycleId: runContext?.cycle_id ?? null, workItemId: item.work_item_id, correlationId: item.correlation_id, pageNumber: Math.max(1, Number(item.page_number) || 1) });
    const flushTelemetry = async () => {
      const result = await telemetry.flush(client);
      if (result.error) console.warn(`Falha ao persistir telemetria HubSpot: ${result.error}`);
    };
    try {
      const token = await resolveHubSpotToken(client);
      let records = [] as Array<{ id: string; properties: Record<string, string | null> }>;
      let nextCursor: string | null = null;
      let receivedCount = 0;
      if (item.object_type === 'ticket') {
        const page = await fetchTicketsPageByPipeline(item.pipeline_id, CS_TICKET_PROPERTIES, token, { cursor: item.cursor, rangeStartMs: Number(item.range_start_ms), rangeEndMs: Number(item.range_end_ms), updatedAfterMs: item.source_updated_after_ms ? Number(item.source_updated_after_ms) : undefined, telemetry: telemetry.observer });
        if (!item.cursor && page.total !== null && page.total > 10_000) {
          const midpoint = Number(item.range_start_ms) + Math.floor((Number(item.range_end_ms) - Number(item.range_start_ms)) / 2);
          if (midpoint <= Number(item.range_start_ms) || midpoint >= Number(item.range_end_ms)) throw new Error('Intervalo de busca de tickets sem ponto de particionamento.');
          const { data: splitResult, error: splitError } = await client.rpc('rpc_analytics_hubspot_split_work_item', { p_work_item_id: item.work_item_id, p_worker_id: workerId, p_midpoint_ms: midpoint });
          if (splitError) throw splitError;
          await flushTelemetry();
          return jsonResponse({ status: 'split', runId: item.run_id, workItemId: item.work_item_id, total: page.total, split: splitResult });
        }
        records = page.records; nextCursor = page.nextCursor; receivedCount = records.length;
        const rows = records.map((r) => toTicketStagingRow(r, item.pipeline_id, item.run_id, Number(item.page_number)));
        if (rows.length) { const { error } = await client.from('analytics_cs_ticket_staging').upsert(rows, { onConflict: 'parent_run_id,ticket_id' }); if (error) throw error; }
      } else if (item.object_type === 'deal') {
        const page = await fetchDealsPageByPipeline(item.pipeline_id, HUBSPOT_DEAL_PROPERTIES, token, { cursor: item.cursor, updatedAfterMs: item.source_updated_after_ms ? Number(item.source_updated_after_ms) : undefined, telemetry: telemetry.observer });
        records = page.records; nextCursor = page.nextCursor; receivedCount = records.length;
        const rows = records.map((r) => toDealStagingRow(r, item.pipeline_id, item.run_id, Number(item.page_number)));
        if (rows.length) { const { error } = await client.from('analytics_hubspot_deal_staging').upsert(rows, { onConflict: 'parent_run_id,deal_id' }); if (error) throw error; }
      } else if (item.object_type === 'shared_companies') {
        const page = await fetchCompaniesPage(
          // `notes_last_contacted` foi confirmado em 100% das empresas marcadas
          // como cliente ativo pela sondagem de 2026-08-07. Sem ele, "clientes
          // sem interacao recente" nao tem fonte.
          ['name','domain','cnpj','aftersale___mrr','status_do_cliente___aftersale','status_do_contrato','cs_owner___aftersale','notes_last_contacted'],
          token,
          { cursor: item.cursor, updatedAfterMs: item.source_updated_after_ms ? Number(item.source_updated_after_ms) : undefined, observer: telemetry.observer },
        );
        const companies = page.records;
        nextCursor = page.nextCursor;
        receivedCount = companies.length;
        if (companies.length) { const rows = companies.map((r) => ({ parent_run_id:item.run_id, company_id:r.id,name:r.properties.name??null,domain:r.properties.domain??null,tax_id:(r.properties.cnpj??'').replace(/\D/g,'')||null,mrr:Number(r.properties.aftersale___mrr??0)||0,client_status:r.properties.status_do_cliente___aftersale??null,contract_status:r.properties.status_do_contrato??null,cs_owner_id:r.properties.cs_owner___aftersale??null,last_activity_at:toIsoTimestamp(r.properties.notes_last_contacted),raw:r.properties,synced_at:new Date().toISOString() })); for (let offset = 0; offset < rows.length; offset += 500) { const { error } = await client.from('analytics_hubspot_company_staging').upsert(rows.slice(offset, offset + 500),{onConflict:'parent_run_id,company_id'}); if(error) throw error; } }
      } else if (item.object_type === 'shared_owners') {
        const page = await fetchOwnersPage(token, { cursor: item.cursor, observer: telemetry.observer });
        nextCursor = page.nextCursor;
        receivedCount = page.records.length;
        const rows = page.records.map((o) => ({ parent_run_id:item.run_id,owner_id:o.ownerId,email:o.email,first_name:o.firstName,last_name:o.lastName,full_name:o.fullName,archived:o.archived,raw:o.raw,synced_at:new Date().toISOString() }));
        if (rows.length) { const { error } = await client.from('analytics_hubspot_owner_staging').upsert(rows,{onConflict:'parent_run_id,owner_id'}); if(error) throw error; }
      } else if (item.object_type === 'shared_catalog') {
        let definitionsCount = 0;
        for (const objectType of ['deals', 'tickets'] as const) {
          const definitions = await fetchPipelineDefinitions(objectType, token, telemetry.observer);
          definitionsCount += definitions.length;
          const catalogObjectType = objectType === 'deals' ? 'deal' : 'ticket';
          const pipelineRows = definitions.map((pipeline) => ({ parent_run_id:item.run_id,object_type:catalogObjectType,pipeline_id:pipeline.pipelineId,label:pipeline.label,archived:pipeline.archived }));
          if (pipelineRows.length) { const { error } = await client.from('analytics_hubspot_pipeline_staging').upsert(pipelineRows,{onConflict:'parent_run_id,object_type,pipeline_id'}); if(error) throw error; }
          for (const pipeline of definitions.filter((candidate) => !candidate.archived)) {
            for (const stage of pipeline.stages) {
              const { error } = await client.from('analytics_hubspot_stage_staging').upsert({
                parent_run_id:item.run_id,
                object_type: catalogObjectType,
                pipeline_id: pipeline.pipelineId,
                stage_id: stage.stageId,
                label: stage.label,
                display_order: stage.displayOrder,
                is_closed: stage.isClosed,
                is_won: stage.isWon,
                metadata: stage.metadata,
                synced_at: new Date().toISOString(),
              }, { onConflict: 'parent_run_id,object_type,pipeline_id,stage_id' });
              if (error) throw error;
            }
          }
        }
        receivedCount = definitionsCount;
      }
      await flushTelemetry();
      const { error: checkpointError } = await client.rpc('rpc_analytics_hubspot_checkpoint_work_item', { p_work_item_id:item.work_item_id,p_worker_id:workerId,p_next_cursor:nextCursor,p_page_number:Number(item.page_number)+1,p_received:receivedCount,p_accepted:receivedCount,p_rejected:0,p_completed:!nextCursor,p_error_code:null,p_error_message:null });
      if (checkpointError) throw checkpointError;
      // Paginacao concluida e promocao concluida sao responsabilidades distintas.
      // Uma falha ao promover -- tipicamente tempo limite ao publicar dezenas de
      // milhares de linhas -- nao pode desfazer o checkpoint da pagina, sob pena
      // de o item voltar para retentativa e a carga nunca convergir. O item
      // permanece concluido e a promocao e retentada pelo proximo dispatch.
      let finalized: unknown = null;
      let finalizeDeferred: string | null = null;
      try {
        const { data, error: finalizeError } = await client.rpc('rpc_analytics_hubspot_finalize_run',{p_run_id:item.run_id});
        if (finalizeError) throw finalizeError;
        finalized = data;
      } catch (finalizeError) {
        finalizeDeferred = classifyHubSpotError(finalizeError).sanitizedMessage;
        console.warn(`Promocao adiada para o proximo dispatch: ${runnerMessage(finalizeError)}`);
      }
      return jsonResponse({status:nextCursor?'checkpointed':'completed',runId:item.run_id,workItemId:item.work_item_id,received:receivedCount,nextCursor,finalized,finalizeDeferred});
    } catch (error) {
      await flushTelemetry();
      const f=failure(error,Number(item.attempts),Number(item.page_number));
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
