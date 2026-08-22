import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const router = await readFile(new URL('../../apps/web/src/app/router.tsx', import.meta.url), 'utf8');
const tenantsPage = await readFile(new URL('../../apps/web/src/features/tenants/TenantsPage.tsx', import.meta.url), 'utf8');
const adminApi = await readFile(new URL('../../apps/web/src/features/admin/admin-api.ts', import.meta.url), 'utf8');

test('Central de Clientes possui rota dedicada e reutiliza o workspace tenant-aware existente', () => {
  assert.match(router, /path: 'customer-central'[\s\S]*<TenantsPage \/>/);
  assert.match(tenantsPage, /Central de Clientes/);
  assert.match(tenantsPage, /listAdminTenants\(\)/);
  assert.match(tenantsPage, /getAdminTenantDetail\(tenantId\)/);
});

test('workspace preserva fontes administrativas reais e estados sem dados fictícios', () => {
  assert.match(adminApi, /vw_admin_tenants_list/);
  assert.match(adminApi, /vw_admin_customer_account_profile_detail/);
  assert.match(adminApi, /vw_admin_customer_operations_directory/);
  assert.match(tenantsPage, /ContractUnavailableState|EmptyState|ErrorState|LoadingState/);
  assert.doesNotMatch(tenantsPage, /customer-central-(mock|fixture|demo)/i);
});
