import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migration = await readFile(new URL('../../supabase/migrations/20260726215117_analytics_hubspot_common_orchestrator_v1.sql', import.meta.url), 'utf8');
const startFixMigration = await readFile(new URL('../../supabase/migrations/20260726230100_analytics_hubspot_common_start_state_fix_v1.sql', import.meta.url), 'utf8');
const serviceIdentityMigration = await readFile(new URL('../../supabase/migrations/20260726234000_analytics_hubspot_service_identity_v1.sql', import.meta.url), 'utf8');
const stagingAclMigration = await readFile(new URL('../../supabase/migrations/20260726241000_analytics_hubspot_staging_service_acl_v1.sql', import.meta.url), 'utf8');
const worker = await readFile(new URL('../../supabase/functions/hubspot-orchestrator-worker/index.ts', import.meta.url), 'utf8');
const runner = await readFile(new URL('../../supabase/functions/_shared/hubspot-cs-runner.ts', import.meta.url), 'utf8');
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

test('workers agendados usam apenas a identidade service_role, sem ampliar o acesso interativo', () => {
  assert.match(migration, /current_setting\('request\.jwt\.claim\.role', true\)/);
  assert.match(migration, /v_is_service_role boolean/);
  assert.match(migration, /if not v_is_service_role and not app_private\.has_global_role\('platform_admin'/);
  assert.match(migration, /<> 'service_role'/);
  assert.match(migration, /v_actor uuid;/);
  assert.doesNotMatch(migration, /grant execute on function public\.rpc_analytics_hubspot_.* to anon/);
});

test('erros do runner preservam mensagem estruturada sem expor credenciais', () => {
  assert.match(runner, /JSON\.stringify\(error\)/);
  assert.match(worker, /runnerMessage\(error\)/);
  assert.match(runner, /\[REDACTED\]/);
});

test('service client interno nao depende de sub de usuario e nao abre acesso anonimo', () => {
  assert.match(serviceIdentityMigration, /auth\.uid\(\) is null/);
  assert.match(serviceIdentityMigration, /<> 'anon'/);
  assert.match(serviceIdentityMigration, /revoke all on function app_private\.is_internal_service_request/);
  assert.match(serviceIdentityMigration, /v_is_service_role boolean := app_private\.is_internal_service_request\(\)/);
});

test('workers escrevem apenas no staging privado com grant service_role', () => {
  assert.match(stagingAclMigration, /grant select, insert, update on public\.analytics_cs_ticket_staging to service_role/);
  assert.match(stagingAclMigration, /grant select, insert, update on public\.analytics_hubspot_deal_staging to service_role/);
  assert.doesNotMatch(stagingAclMigration, /to authenticated|to anon|to public/);
});

test('run enfileirado nao grava source evidence invalida', () => {
  assert.match(startFixMigration, /source_state=null/);
  assert.doesNotMatch(startFixMigration, /source_state='queued'/);
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
