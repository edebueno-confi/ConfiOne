create extension if not exists pgtap with schema extensions;

begin;
select plan(6);
select ok(
  to_regclass('public.hubspot_companies') is not null,
  'hubspot_companies existe'
);
select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hubspot_sync_runs'
      and column_name = 'companies_synced'
  ),
  'hubspot_sync_runs possui companies_synced'
);
select has_function('public', 'rpc_analytics_ceo_snapshot', ARRAY['date', 'date']);
select function_privs_are('public', 'rpc_analytics_ceo_snapshot', ARRAY['date', 'date'], 'anon', ARRAY[]::text[]);
select function_privs_are('public', 'rpc_analytics_ceo_snapshot', ARRAY['date', 'date'], 'authenticated', ARRAY['EXECUTE']);
select function_privs_are('public', 'rpc_analytics_ceo_snapshot', ARRAY['date', 'date'], 'service_role', ARRAY['EXECUTE']);
select * from finish();
rollback;
