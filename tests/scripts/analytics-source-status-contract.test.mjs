import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const migration = await read('supabase/migrations/20260802100000_dashboard_source_truth_v2.sql');
const csGuard = await read('supabase/migrations/20260802100100_dashboard_cs_denominator_guard_v1.sql');
const state = await read('apps/web/src/features/analytics/analytics-state.ts');
const ui = await read('apps/web/src/features/analytics/analytics-ui.tsx');
const shell = await read('apps/web/src/features/analytics/AnalyticsShell.tsx');
const retryMetric = await read('supabase/migrations/20260803120000_dashboard_hubspot_retry_count_v1.sql');
const hubspotWorker = await read('supabase/functions/hubspot-orchestrator-worker/index.ts');

test('o contrato publica somente estados canônicos das fontes', () => {
  for (const status of ['never_synced', 'syncing', 'fresh', 'stale', 'partial', 'failed', 'unavailable']) {
    assert.match(migration, new RegExp(`'${status}'`));
  }
  assert.match(migration, /rpc_analytics_source_status/);
  assert.match(migration, /A sincronização OMIE não foi concluída/);
  assert.doesNotMatch(migration, /error_message/);
});

test('o estado sem sucesso anterior não vira atualizado nem zero', () => {
  assert.match(state, /if \(!input\.lastSuccessfulSyncAt\) return 'never_synced'/);
  assert.match(ui, /Sincronização ainda não realizada/);
  assert.doesNotMatch(ui, /state\.status === 'fresh' && !state\.lastSuccessfulSyncAt/);
});

test('Customer Success não publica catálogo como carteira', () => {
  assert.match(csGuard, /status', 'unavailable'/);
  assert.match(csGuard, /denominador aprovado/);
  assert.match(csGuard, /by_owner', '\[\]'/);
});

test('o shell lê status agregado de HubSpot e OMIE', () => {
  assert.match(shell, /getAnalyticsSourceStatus/);
  assert.match(shell, /sourceStatus\?\.hubspot/);
  assert.match(shell, /sourceStatus\?\.omie/);
  assert.doesNotMatch(shell, /getLatestSyncRun/);
});

test('progresso do HubSpot conta somente retries adicionais', () => {
  assert.match(retryMetric, /sum\(greatest\(item\.attempts - 1, 0\)\)/);
  assert.doesNotMatch(retryMetric, /sum\(item\.attempts\)/);
});

test('empresas compartilhadas respeitam o watermark incremental do HubSpot', () => {
  assert.match(hubspotWorker, /fetchCompaniesPage\([\s\S]*item\.source_updated_after_ms/);
});

console.log('analytics-source-status-contract: ok');
