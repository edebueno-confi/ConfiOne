import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');
const financePage = readFileSync(
  path.join(repoRoot, 'apps', 'web', 'src', 'features', 'analytics', 'AnalyticsFinancePage.tsx'),
  'utf8',
);
const csPage = readFileSync(
  path.join(repoRoot, 'apps', 'web', 'src', 'features', 'analytics', 'AnalyticsCustomerSuccessPage.tsx'),
  'utf8',
);

const reconciliationMigrations = readdirSync(migrationsDir)
  .filter((name) => name.endsWith('_analytics_finance_identity_reconciliation_v1.sql'));

test('Financeiro separa identidade OMIE ausente de empresa sem cadastro no HubSpot', () => {
  assert.equal(reconciliationMigrations.length, 1, 'o contrato de reconciliação de identidade precisa existir');
  const sql = readFileSync(path.join(migrationsDir, reconciliationMigrations[0]), 'utf8');

  assert.match(sql, /identity_missing_balance/);
  assert.match(sql, /no_hubspot_company_balance/);
  assert.match(sql, /omie_client_code/);
  assert.doesNotMatch(financePage, /Saldo de títulos cujo CNPJ não existe no HubSpot/);
});

test('Customer Success não publica zero como ausência de inadimplência sem vínculo financeiro', () => {
  assert.equal(reconciliationMigrations.length, 1, 'o contrato de cobertura financeira precisa existir');
  const sql = readFileSync(path.join(migrationsDir, reconciliationMigrations[0]), 'utf8');

  assert.match(sql, /omie_customer_identity_missing/);
  assert.match(csPage, /missingIdentityOverdueTitles > 0/);
  assert.match(csPage, /Não foi possível identificar os clientes com títulos vencidos/);
});
