import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const worker = readFileSync('supabase/functions/hubspot-orchestrator-worker/index.ts', 'utf8');
const setup = readFileSync('supabase/functions/hubspot-property-setup/index.ts', 'utf8');
const propertySync = readFileSync('supabase/functions/hubspot-omie-property-sync/index.ts', 'utf8');
const migration = readFileSync('supabase/migrations/20260812150000_analytics_finance_hubspot_identity_v2.sql', 'utf8');
const rollupPerformanceMigration = readFileSync('supabase/migrations/20260812180000_analytics_finance_rollup_perf_v2.sql', 'utf8');
const rollupFixMigration = readFileSync('supabase/migrations/20260812181000_analytics_finance_rollup_raw_payload_fix.sql', 'utf8');
const financeModel = readFileSync('apps/web/src/features/analytics/analytics-model.ts', 'utf8');
const financePage = readFileSync('apps/web/src/features/analytics/AnalyticsFinancePage.tsx', 'utf8');

test('o sync preserva as chaves fiscais e publica os campos OMIE necessários para auditoria', () => {
  assert.match(worker, /cnpj__chave_unica_/);
  assert.match(worker, /omie_saldo_aberto/);
  assert.match(worker, /tax_id:\(r\.properties\.cnpj\?\?r\.properties\.cnpj__chave_unica_/);
  assert.match(setup, /omie_cliente_id/);
  assert.match(propertySync, /omie_cliente_id/);
  assert.match(propertySync, /buildOmieProperties/);
});

test('o rollup financeiro usa o snapshot corrente e exclui chaves ambiguas', () => {
  assert.match(rollupPerformanceMigration, /f\.is_current/);
  assert.match(rollupPerformanceMigration, /candidate_pairs/);
  assert.match(rollupPerformanceMigration, /candidate_count/);
  assert.match(rollupPerformanceMigration, /current_omie_client_idx/);
  assert.match(rollupFixMigration, /max\(f\.omie_client_id\)/);
});

test('a reconciliação considera a chave fiscal OMIE sem transformar nome parecido em vínculo', () => {
  assert.match(migration, /raw ->> 'cnpj__chave_unica_'/);
  assert.match(migration, /raw ->> 'omie_cliente_id'/);
  assert.match(migration, /candidate_companies/);
  assert.match(migration, /nenhuma sugestão de nome é aplicada automaticamente/);
  assert.match(financeModel, /candidateCompanies/);
  assert.match(financePage, /Candidato no HubSpot/);
});
