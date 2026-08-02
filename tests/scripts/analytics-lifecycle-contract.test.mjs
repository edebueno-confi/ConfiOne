import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const edge = await readFile(new URL('../../supabase/functions/analytics-sequential-sync/index.ts', import.meta.url), 'utf8');
const omieService = await readFile(new URL('../../supabase/functions/_shared/omie-sync-service.ts', import.meta.url), 'utf8');
const migration = await readFile(new URL('../../supabase/migrations/20260802130000_dashboard_runtime_truth_v3.sql', import.meta.url), 'utf8');

test('falha de start ou dispatcher do HubSpot encerra a etapa do ciclo', () => {
  assert.match(edge, /started\.status >= 400[\s\S]+updateStep\(client, cycleId, 'hubspot', \{ status: 'failed'/);
  assert.match(edge, /dispatched\.status >= 400[\s\S]+updateStep\(client, cycleId, 'hubspot', \{ status: 'failed'/);
});

test('abandono de OMIE preserva lifecycle interno e erro sanitizado', () => {
  assert.match(omieService, /internal_error_code: 'execution_abandoned'/);
  assert.match(omieService, /internal_message: 'Execucao abandonada pelo worker/);
  assert.match(omieService, /sanitized_error: 'A execucao do OMIE/);
  assert.match(omieService, /error_occurred_at: abandonedAt/);
});

test('reconciliacao atualiza as etapas que ficaram pendentes', () => {
  assert.match(migration, /update public\.analytics_sync_cycle_steps s/);
  assert.match(migration, /c\.status = 'timed_out'/);
  assert.match(migration, /r\.cycle_id = s\.cycle_id and r\.status = 'timed_out'/);
});
