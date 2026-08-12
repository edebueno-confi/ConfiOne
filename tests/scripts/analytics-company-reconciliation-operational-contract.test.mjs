import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const migrationDir = 'supabase/migrations';
const migrationName = readdirSync(migrationDir).find((name) => name.endsWith('_analytics_company_reconciliation_operational_v2.sql'));
const sql = migrationName ? readFileSync(`${migrationDir}/${migrationName}`, 'utf8') : '';
const panel = readFileSync('apps/web/src/features/settings/CompanyReconciliationPanel.tsx', 'utf8');
const api = readFileSync('apps/web/src/features/settings/company-reconciliation-api.ts', 'utf8');

test('a Governança usa o índice real de clientes OMIE para explicar candidatos HubSpot', () => {
  assert.ok(migrationName, 'a evolução operacional da reconciliação precisa existir');
  for (const term of [
    'analytics_finance_client_index_cache',
    'identity_unavailable',
    'matched_fields',
    'differences',
    'confidence',
    'owner_id',
    'overdue_balance',
  ]) assert.match(sql, new RegExp(term));
  assert.match(panel, /rpc_admin_decide_company_reconciliation|Confirmar vínculo/);
  assert.doesNotMatch(sql, /hubspot.*(fetch|http|update|insert)/i);
});

test('a fila de Governança exibe impacto financeiro e contexto do CSM sem confirmar automaticamente', () => {
  for (const term of ['Código OMIE', 'vencido', 'CSM ID', 'Confirmar vínculo', 'apenas sugestão', 'Fonte:']) assert.match(panel, new RegExp(term));
  assert.match(api, /identityUnavailable/);
  assert.match(api, /matchedFields/);
  assert.match(api, /differences/);
});
