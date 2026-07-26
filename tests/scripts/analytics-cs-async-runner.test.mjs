import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migration = await readFile(new URL('../../supabase/migrations/20260726211256_analytics_cs_async_runner_v1.sql', import.meta.url), 'utf8');
const worker = await readFile(new URL('../../supabase/functions/hubspot-cs-worker/index.ts', import.meta.url), 'utf8');
const dispatcher = await readFile(new URL('../../supabase/functions/hubspot-cs-dispatcher/index.ts', import.meta.url), 'utf8');
const start = await readFile(new URL('../../supabase/functions/hubspot-cs-start/index.ts', import.meta.url), 'utf8');
const schedule = await readFile(new URL('../../supabase/functions/analytics-scheduled-run/index.ts', import.meta.url), 'utf8');
const api = await readFile(new URL('../../apps/web/src/features/analytics/analytics-api.ts', import.meta.url), 'utf8');

test('start assíncrono retorna 202 e exige platform_admin', () => {
  assert.match(start, /status: 202/);
  assert.match(start, /rpc_analytics_cs_start_run/);
  assert.match(start, /platform_admin/);
});

test('parent e work items possuem estados, lease e checkpoint', () => {
  assert.match(migration, /status in \('queued'.*'abandoned'.*'cancelled'\)/s);
  assert.match(migration, /analytics_cs_sync_work_items/);
  assert.match(migration, /lease_expires_at/);
  assert.match(migration, /rpc_analytics_cs_claim_work_item/);
  assert.match(migration, /rpc_analytics_cs_checkpoint_work_item/);
});

test('seis pipelines independentes são materializados pela configuração ativa', () => {
  assert.match(migration, /select distinct on \(hubspot_pipeline_id\)/);
  assert.match(migration, /domain_key = 'cs'/);
  assert.match(migration, /object_type = 'ticket'/);
  assert.match(migration, /pipelines_total/);
});

test('worker processa uma página, salva staging e cursor antes de finalizar', () => {
  assert.match(worker, /fetchTicketsPageByPipeline/);
  assert.match(worker, /analytics_cs_ticket_staging/);
  assert.match(worker, /rpc_analytics_cs_checkpoint_work_item/);
  assert.match(worker, /rpc_analytics_cs_finalize_run/);
});

test('particionamento evita o limite de 10 mil e retry distingue transitório de permanente', () => {
  assert.match(worker, /page\.total > 10000/);
  assert.match(worker, /rpc_analytics_cs_split_work_item/);
  assert.match(worker, /RETRY_/);
  assert.match(migration, /p_error_code like 'RETRY_%'/);
  assert.match(worker, /FORBIDDEN/);
});

test('abandono preserva snapshot e watermark', () => {
  assert.match(migration, /status = 'abandoned'/);
  assert.match(migration, /error_code = 'WORKER_TIMEOUT'/);
  assert.match(migration, /watermark_advanced = false/);
  assert.match(migration, /rpc_analytics_cs_abandon_stale_runs/);
});

test('promoção só ocorre quando todos os work items terminam', () => {
  assert.match(migration, /v_completed < v_total/);
  assert.match(migration, /insert into public\.hubspot_tickets/);
  assert.match(migration, /watermark_advanced = true/);
});

test('dispatcher é limitado e o schedule não executa o CS monolítico', () => {
  assert.match(dispatcher, /index < 6/);
  assert.match(dispatcher, /hubspot-cs-worker/);
  assert.match(schedule, /hubspot-cs-dispatcher/);
  assert.match(schedule, /scope: 'commercial'/);
});

test('frontend inicia e consulta progresso sem manter request aberto', () => {
  assert.match(api, /hubspot-cs-start/);
  assert.match(api, /vw_analytics_cs_sync_progress/);
  assert.match(api, /status: 'queued'/);
});
