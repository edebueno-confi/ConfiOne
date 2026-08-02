begin;
select plan(17);

select ok(
  to_regprocedure('public.rpc_analytics_customer_success_snapshot()') is not null,
  'read model de Customer Success HubSpot existe'
);
select ok(
  has_function_privilege('authenticated', 'public.rpc_analytics_customer_success_snapshot()', 'execute')
    and not has_function_privilege('anon', 'public.rpc_analytics_customer_success_snapshot()', 'execute'),
  'Customer Success respeita o grant autenticado'
);
select ok(
  pg_get_functiondef(to_regprocedure('public.rpc_analytics_customer_success_snapshot()')) like '%hubspot_companies%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_customer_success_snapshot()')) not like '%analytics_spreadsheet%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_customer_success_snapshot()')) not like '%fallback%',
  'Customer Success consulta somente o cache HubSpot oficial'
);

select ok(
  to_regprocedure('public.rpc_analytics_ceo_snapshot(date,date)') is not null,
  'snapshot executivo API-only existe'
);
select ok(
  pg_get_functiondef(to_regprocedure('public.rpc_analytics_ceo_snapshot(date,date)')) like '%omie_receivables_api%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_ceo_snapshot(date,date)')) like '%hubspot_companies%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_ceo_snapshot(date,date)')) not like '%analytics_spreadsheet%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_ceo_snapshot(date,date)')) not like '%spreadsheet_import%',
  'snapshot executivo separa HubSpot e OMIE sem planilha'
);

select ok(
  to_regclass('public.vw_analytics_finance_sync_runs_read') is not null,
  'read model de histórico OMIE existe'
);
select ok(
  has_table_privilege('authenticated', 'public.vw_analytics_finance_sync_runs_read', 'select')
    and not has_table_privilege('anon', 'public.vw_analytics_finance_sync_runs_read', 'select'),
  'histórico OMIE respeita o grant autenticado'
);
select ok(
  pg_get_viewdef('public.vw_analytics_finance_sync_runs_read'::regclass, true) like '%analytics_finance_sync_runs%'
    and pg_get_viewdef('public.vw_analytics_finance_sync_runs_read'::regclass, true) like '%can_read_analytics%',
  'histórico OMIE é filtrado pelo escopo de analytics'
);
select ok(
  pg_get_viewdef('public.vw_analytics_finance_sync_runs_read'::regclass, true) not like '%analytics_spreadsheet%'
    and pg_get_viewdef('public.vw_analytics_finance_sync_runs_read'::regclass, true) not like '%fallback%',
  'histórico publicado não expõe planilha nem fallback'
);

select ok(
  pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_source_status()')) like '%''api'', jsonb_build_object%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_source_status()')) like '%Omie%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_source_status()')) not like '%''spreadsheet''%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_source_status()')) not like '%fallback%',
  'status financeiro publica somente OMIE API'
);
select ok(
  has_function_privilege('authenticated', 'public.rpc_analytics_finance_source_status()', 'execute')
    and not has_function_privilege('anon', 'public.rpc_analytics_finance_source_status()', 'execute'),
  'status financeiro respeita o grant autenticado'
);

select ok(
  to_regclass('public.analytics_integration_schedule') is not null,
  'contrato de agenda única existe'
);
select ok(
  to_regprocedure('public.rpc_admin_set_sync_schedules(boolean,text,boolean,text)') is not null,
  'configuração da agenda única existe'
);
select ok(
  pg_get_functiondef(to_regprocedure('public.rpc_admin_set_sync_schedules(boolean,text,boolean,text)')) like '%hubspot_enabled = false%'
    and pg_get_functiondef(to_regprocedure('public.rpc_admin_set_sync_schedules(boolean,text,boolean,text)')) like '%hubspot_frequency = ''off''%'
    and pg_get_functiondef(to_regprocedure('public.rpc_admin_set_sync_schedules(boolean,text,boolean,text)')) like '%p_omie_frequency%',
  'agenda única desativa o legado HubSpot e preserva a frequência OMIE'
);

select ok(
  to_regclass('cron.job') is null
    or not exists (select 1 from cron.job where jobname = 'analytics-hubspot-daily-incremental'),
  'scheduler legado de HubSpot permanece desativado no banco local'
);
select ok(
  exists (
    select 1
    from information_schema.role_table_grants
    where grantee = 'authenticated'
      and table_schema = 'public'
      and table_name = 'vw_analytics_finance_sync_runs_read'
      and privilege_type = 'SELECT'
  ),
  'histórico OMIE possui leitura autenticada explícita'
);
select ok(
  not exists (
    select 1
    from information_schema.role_table_grants
    where grantee = 'anon'
      and table_schema = 'public'
      and table_name = 'vw_analytics_finance_sync_runs_read'
      and privilege_type = 'SELECT'
  ),
  'histórico OMIE não possui leitura anônima'
);

select * from finish();
rollback;
