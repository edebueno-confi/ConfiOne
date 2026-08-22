import { assertLocalSupabaseEnvironment, loadQaEnv, readLocalSupabaseStatus } from './assert-local-supabase.mjs';
import { runSql } from './sql.mjs';

const qa = loadQaEnv();
const status = readLocalSupabaseStatus({ ...process.env, ...qa });
assertLocalSupabaseEnvironment({ ...process.env, ...qa }, { status });
const expected = [qa.LOCAL_QA_ADMIN_EMAIL, qa.LOCAL_QA_DASHBOARD_VIEWER_EMAIL, qa.LOCAL_QA_SUPPORT_MANAGER_EMAIL, qa.LOCAL_QA_SUPPORT_AGENT_EMAIL, qa.LOCAL_QA_CLIENT_EMAIL];
const count = runSql(`
select
  (select count(*) from auth.users where email in ('${expected.join("','")}'))::int as users,
  (select count(*) from public.tenants where slug in ('qa-local-aurora','qa-local-horizonte','qa-local-atlas'))::int as tenants,
  (select count(*) from public.tickets where title like '[QA LOCAL]%')::int as tickets,
  (select count(*) from public.analytics_finance_receivables where source_key='local_qa_finance')::int as receivables,
  (select count(*) from public.hubspot_deals where deal_id like 'qa-local-%')::int as deals,
  (select count(*) from public.hubspot_tickets where ticket_id like 'qa-local-%')::int as hubspot_tickets,
  (select count(*) from public.analytics_integration_schedule where id=true and not enabled and frequency='off')::int as schedules_off,
  (select count(*) from public.user_global_roles r join public.profiles p on p.id=r.user_id where p.email in ('${expected.join("','")}'))::int as roles;
`);
const row = count.rows?.[0] ?? {};
if (Number(row.users) !== 5 || Number(row.tenants) !== 3 || Number(row.tickets) !== 18 || Number(row.receivables) !== 6 || Number(row.schedules_off) !== 1 || Number(row.roles) < 4) {
  throw new Error(`LOCAL_QA_VERIFY_FAILED: contagens inesperadas ${JSON.stringify(row)}`);
}
const isolation = runSql(`
select
  (select count(*) from public.tenant_memberships tm join public.profiles p on p.id=tm.user_id where p.email='${qa.LOCAL_QA_CLIENT_EMAIL}' and tm.tenant_id='a1111111-1111-4111-8111-111111111111' and tm.role='customer_user')::int as client_membership,
  (select count(*) from public.tenant_memberships tm join public.profiles p on p.id=tm.user_id where p.email='${qa.LOCAL_QA_CLIENT_EMAIL}' and tm.tenant_id<>'a1111111-1111-4111-8111-111111111111')::int as client_other_memberships,
  (select count(*) from public.analytics_finance_receivables where source_key='omie_receivables_api' and raw_payload->>'fixture'='true')::int as fake_omie_rows;
`);
const isolationRow = isolation.rows?.[0] ?? {};
if (Number(isolationRow.client_membership) !== 1 || Number(isolationRow.client_other_memberships) !== 0 || Number(isolationRow.fake_omie_rows) !== 0) throw new Error(`LOCAL_QA_ISOLATION_FAILED: ${JSON.stringify(isolationRow)}`);
console.log(JSON.stringify({ environment: 'local', verified: true, counts: row, isolation: isolationRow, passwords: 'configured locally and omitted' }));
