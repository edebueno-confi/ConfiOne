import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
const telemetryMigration = await read('supabase/migrations/20260803140000_dashboard_sync_request_telemetry_v1.sql');
const stagingMigration = await read('supabase/migrations/20260803143000_dashboard_hubspot_shared_staging_atomic_v1.sql');
const metricsMigration = await read('supabase/migrations/20260803145000_dashboard_sync_request_metrics_contract_v1.sql');
const telemetry = await read('supabase/functions/_shared/sync-request-telemetry.ts');
const hubspot = await read('supabase/functions/_shared/hubspot.ts');
const omie = await read('supabase/functions/_shared/omie.ts');
const worker = await read('supabase/functions/hubspot-orchestrator-worker/index.ts');
const omieService = await read('supabase/functions/_shared/omie-sync-service.ts');

test('telemetria externa é sanitizada e protegida por RLS', () => {
  assert.match(telemetryMigration, /create table if not exists public\.analytics_sync_request_attempts/);
  assert.match(telemetryMigration, /enable row level security/);
  assert.match(telemetryMigration, /revoke all on public\.analytics_sync_request_attempts from public, anon, authenticated/);
  assert.match(telemetryMigration, /nunca guarda URL completa, payload, resposta ou credencial/);
  assert.match(telemetry, /endpoint_key: event\.endpoint/);
  assert.doesNotMatch(telemetry, /url|payload|response_body|authorization/i);
});

test('retries e falhas são agregados por execução sem contar a tentativa inicial como retry', () => {
  assert.match(telemetryMigration, /attempt_number > 1/);
  assert.match(telemetryMigration, /status_code = 429/);
  assert.match(metricsMigration, /request_retry_count/);
  assert.match(metricsMigration, /request_duration_ms/);
  assert.match(metricsMigration, /last_request_at/);
});

test('HubSpot e OMIE registram cada tentativa sem alterar o resultado do provedor', () => {
  assert.match(hubspot, /recordRequest\(observer/);
  assert.match(hubspot, /observer\?: HubSpotRequestObserver/);
  assert.match(hubspot, /retry-after/i);
  assert.match(omie, /observer\?\.record/);
  assert.match(worker, /createSyncRequestTelemetryBuffer/);
  assert.match(worker, /await flushTelemetry\(\)/);
  assert.match(omieService, /createSyncRequestTelemetryBuffer/);
  assert.match(telemetry, /must not trigger a duplicate/);
});

test('bloco compartilhado do HubSpot só grava staging antes da promoção atômica', () => {
  assert.match(worker, /analytics_hubspot_company_staging/);
  assert.match(worker, /analytics_hubspot_owner_staging/);
  assert.match(worker, /analytics_hubspot_pipeline_staging/);
  assert.match(worker, /analytics_hubspot_stage_staging/);
  assert.doesNotMatch(worker, /from\('hubspot_companies'\)|from\('hubspot_owners'\)|from\('hubspot_pipeline_stages'\)/);
  assert.match(stagingMigration, /rpc_analytics_hubspot_finalize_run/);
  assert.match(stagingMigration, /rpc_service_reconcile_hubspot_pipeline_catalog/);
  assert.match(stagingMigration, /watermark_advanced=true/);
});

test('falha do run limpa o staging da execução antes de preservar o snapshot anterior', () => {
  const failureBranch = stagingMigration.slice(stagingMigration.indexOf("status='failed'"));
  assert.match(failureBranch, /delete from public\.analytics_hubspot_company_staging/);
  assert.match(failureBranch, /delete from public\.analytics_cs_ticket_staging/);
  assert.match(failureBranch, /snapshot anterior preservado/);
});

console.log('analytics-sync-telemetry-contract: ok');
