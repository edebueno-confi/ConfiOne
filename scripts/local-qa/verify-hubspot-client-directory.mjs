import { createClient } from '@supabase/supabase-js';
import { assertLocalSupabaseEnvironment, loadQaEnv, readLocalSupabaseStatus } from './assert-local-supabase.mjs';

const qa = loadQaEnv();
const status = readLocalSupabaseStatus({ ...process.env, ...qa });
assertLocalSupabaseEnvironment({ ...process.env, ...qa, SUPABASE_URL: status.API_URL }, { status });

const db = createClient(status.API_URL, status.ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { error: authError } = await db.auth.signInWithPassword({
  email: qa.LOCAL_QA_ADMIN_EMAIL,
  password: qa.LOCAL_QA_ADMIN_PASSWORD,
});
if (authError) throw new Error(`Autenticação QA falhou:${authError.code ?? 'unknown'}`);

const { data: sources, error: sourceError } = await db
  .from('customer_account_sources')
  .select('tenant_id,source_external_id,status,source_product,source_version,source_system')
  .eq('source_system', 'hubspot')
  .eq('source_product', 'after_sale')
  .eq('source_version', 'current')
  .limit(5000);
if (sourceError) throw new Error(`Leitura autenticada das fontes falhou:${sourceError.code ?? 'unknown'}`);

const { data: directory, error: directoryError } = await db
  .from('vw_admin_customer_operations_directory')
  .select('tenant_id,display_name,source_count,store_count,project_count,csm_user_id,csm_assignment_status')
  .limit(5000);
if (directoryError) throw new Error(`Leitura autenticada da view falhou:${directoryError.code ?? 'unknown'}`);

const sourceExternalIds = new Set((sources ?? []).map((source) => source.source_external_id));
const sourceTenantIds = new Set((sources ?? []).map((source) => source.tenant_id));
const directoryHubspot = (directory ?? []).filter((row) => sourceTenantIds.has(row.tenant_id));
console.log(JSON.stringify({
  authenticatedHubspotSources: sources?.length ?? 0,
  authenticatedDirectoryRows: directory?.length ?? 0,
  directoryRowsForImportedTenants: directoryHubspot.length,
  distinctSourceIds: sourceExternalIds.size,
  duplicateSourceIds: (sources ?? []).length - sourceExternalIds.size,
  unexpectedStores: (directoryHubspot ?? []).filter((row) => Number(row.store_count ?? 0) > 0).length,
  unexpectedProjects: (directoryHubspot ?? []).filter((row) => Number(row.project_count ?? 0) > 0).length,
  unexpectedCsmAssignments: (directoryHubspot ?? []).filter((row) => row.csm_user_id !== null || row.csm_assignment_status !== null).length,
}));
