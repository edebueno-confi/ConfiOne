begin;
select plan(12);

select ok(
  position('has_global_role(''platform_admin''::public.platform_role)' in pg_get_functiondef('public.rpc_admin_set_integration_schedule(boolean,text)'::regprocedure)) > 0,
  'schedule write requires platform_admin'
);
select ok(
  position('has_global_role(''platform_admin''::public.platform_role)' in pg_get_functiondef('public.rpc_admin_upsert_analytics_source_config(uuid,text,text,text,text,boolean)'::regprocedure)) > 0,
  'source config write requires platform_admin'
);
select ok(
  position('has_global_role(''platform_admin''::public.platform_role)' in pg_get_functiondef('public.rpc_admin_upsert_managed_integration(text,text,text,text,boolean,jsonb,text)'::regprocedure)) > 0,
  'managed integration write requires platform_admin'
);

select has_column('public', 'analytics_finance_receivables', 'is_current', 'financial rows track current snapshot state');
select ok(to_regclass('public.analytics_finance_receivables_current_idx') is not null, 'current financial rows have reconciliation index');
select has_function('public', 'rpc_analytics_finance_company_rollup', ARRAY[]::text[], 'finance rollup remains available after zero-row hardening');
select has_table('public', 'analytics_hubspot_omie_property_sync_runs', 'property sync run ledger exists');
select has_table('public', 'analytics_hubspot_omie_property_sync_items', 'property sync item ledger exists');
select has_table('public', 'analytics_hubspot_property_setup_runs', 'property setup run ledger exists');
select has_table('public', 'analytics_hubspot_property_setup_items', 'property setup item ledger exists');
select ok(exists(select 1 from pg_trigger where tgrelid='public.analytics_source_config'::regclass and tgname='analytics_source_config_audit_row_change'), 'source config changes are audited');
select ok(exists(select 1 from pg_trigger where tgrelid='public.analytics_integration_schedule'::regclass and tgname='analytics_integration_schedule_audit_row_change'), 'schedule changes are audited');

select * from finish();
rollback;
