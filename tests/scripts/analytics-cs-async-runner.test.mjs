import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migration = await readFile(new URL('../../supabase/migrations/20260726215117_analytics_hubspot_common_orchestrator_v1.sql', import.meta.url), 'utf8');
const worker = await readFile(new URL('../../supabase/functions/hubspot-orchestrator-worker/index.ts', import.meta.url), 'utf8');
const dispatcher = await readFile(new URL('../../supabase/functions/hubspot-orchestrator-dispatcher/index.ts', import.meta.url), 'utf8');
const start = await readFile(new URL('../../supabase/functions/hubspot-orchestrator-start/index.ts', import.meta.url), 'utf8');
const compatibility = await readFile(new URL('../../supabase/functions/hubspot-sync/index.ts', import.meta.url), 'utf8');
const schedule = await readFile(new URL('../../supabase/functions/analytics-scheduled-run/index.ts', import.meta.url), 'utf8');
const api = await readFile(new URL('../../apps/web/src/features/analytics/analytics-api.ts', import.meta.url), 'utf8');

test('um unico start assíncrono atende Comercial e CS e retorna 202', () => {
  assert.match(start, /status: 202/);
  assert.match(start, /rpc_analytics_hubspot_start_run/);
  assert.match(start, /cs_support/);
  assert.match(migration, /array\['commercial','cs'\]/);
});

test('parent e work items comuns têm lease, cursor, retry e domínio', () => {
  assert.match(migration, /analytics_hubspot_claim_work_item/);
  assert.match(migration, /analytics_hubspot_checkpoint_work_item/);
  assert.match(migration, /domain_key text not null default 'cs'/);
  assert.match(migration, /object_type text not null default 'ticket'/);
  assert.match(migration, /next_attempt_at/);
  assert.match(migration, /lease_expires_at/);
});

test('worker possui adaptadores para deals, tickets e entidades compartilhadas', () => {
  assert.match(worker, /fetchDealsPageByPipeline/);
  assert.match(worker, /fetchTicketsPageByPipeline/);
  assert.match(worker, /analytics_hubspot_deal_staging/);
  assert.match(worker, /analytics_cs_ticket_staging/);
  assert.match(worker, /fetchCompanies/);
  assert.match(worker, /fetchOwners/);
});

test('promoção é posterior à cobertura completa e usa chaves HubSpot estáveis', () => {
  assert.match(migration, /v_completed<v_total/);
  assert.match(migration, /insert into public\.hubspot_tickets/);
  assert.match(migration, /insert into public\.hubspot_deals/);
  assert.match(migration, /on conflict\(ticket_id\)/);
  assert.match(migration, /on conflict\(deal_id\)/);
  assert.match(migration, /watermark_advanced=true/);
});

test('schedule e compatibilidade usam somente o motor comum', () => {
  assert.match(schedule, /hubspot-orchestrator-dispatcher/);
  assert.doesNotMatch(schedule, /hubspot-cs-dispatcher/);
  assert.match(schedule, /analytics-integration-run/);
  assert.doesNotMatch(compatibility, /fetchDealsByPipeline|fetchTicketsByPipeline|updateCompaniesBatch/);
  assert.match(compatibility, /rpc_analytics_hubspot_start_run/);
  assert.match(dispatcher, /hubspot-orchestrator-worker/);
  assert.match(api, /hubspot-orchestrator-start/);
});

test('janela incremental usa marcador persistido com sobreposição de cinco minutos', () => {
  assert.match(migration, /source_updated_after_ms/);
  assert.match(migration, /interval '5 minutes'/);
  assert.match(worker, /source_updated_after_ms/);
});
