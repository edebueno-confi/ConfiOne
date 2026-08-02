begin;
select plan(20);

select ok(
  to_regprocedure('public.rpc_analytics_finance_snapshot(date,date,text,text,text)') is not null,
  'snapshot financeiro OMIE existe'
);
select ok(
  has_function_privilege('authenticated', 'public.rpc_analytics_finance_snapshot(date,date,text,text,text)', 'execute'),
  'authenticated pode executar o snapshot financeiro OMIE'
);
select ok(
  has_function_privilege('service_role', 'public.rpc_analytics_finance_snapshot(date,date,text,text,text)', 'execute'),
  'service_role pode executar o snapshot financeiro OMIE'
);
select ok(
  not has_function_privilege('anon', 'public.rpc_analytics_finance_snapshot(date,date,text,text,text)', 'execute'),
  'anon não pode executar o snapshot financeiro OMIE'
);
select ok(
  exists (
    select 1
    from pg_proc p
    where p.oid = to_regprocedure('public.rpc_analytics_finance_snapshot(date,date,text,text,text)')
      and p.prorettype = 'jsonb'::regtype
  ),
  'snapshot financeiro OMIE retorna jsonb'
);
select ok(
  exists (
    select 1
    from pg_proc p
    where p.oid = to_regprocedure('public.rpc_analytics_finance_snapshot(date,date,text,text,text)')
      and p.proconfig @> array['search_path=""']
  ),
  'snapshot financeiro OMIE fixa search_path'
);
select ok(
  pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_snapshot(date,date,text,text,text)')) like '%source_key = ''omie_receivables_api''%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_snapshot(date,date,text,text,text)')) like '%r.is_current%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_snapshot(date,date,text,text,text)')) not like '%source_key <> ''omie_receivables_api''%',
  'snapshot financeiro OMIE publica somente linhas atuais da API'
);
select ok(
  pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_snapshot(date,date,text,text,text)')) like '%''status'', v_status%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_snapshot(date,date,text,text,text)')) like '%''reason'', v_reason%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_snapshot(date,date,text,text,text)')) like '%''last_successful_sync_at''%',
  'snapshot financeiro OMIE publica estado, motivo e frescor'
);
select ok(
  pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_snapshot(date,date,text,text,text)')) like '%''stale_after_minutes'', 1440%',
  'snapshot financeiro OMIE publica limite de frescor'
);
select ok(
  pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_snapshot(date,date,text,text,text)')) like '%''sync_run_id'', v_last_sync_run_id%',
  'snapshot financeiro OMIE publica a execução de sincronização'
);

select ok(
  to_regprocedure('public.rpc_analytics_finance_source_status()') is not null,
  'status da fonte financeira OMIE existe'
);
select ok(
  has_function_privilege('authenticated', 'public.rpc_analytics_finance_source_status()', 'execute'),
  'authenticated pode ler o status da fonte financeira OMIE'
);
select ok(
  not has_function_privilege('anon', 'public.rpc_analytics_finance_source_status()', 'execute'),
  'anon não pode ler o status da fonte financeira OMIE'
);
select ok(
  exists (
    select 1
    from pg_proc p
    where p.oid = to_regprocedure('public.rpc_analytics_finance_source_status()')
      and p.proconfig @> array['search_path=""']
  ),
  'status da fonte financeira OMIE fixa search_path'
);
select ok(
  pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_source_status()')) like '%''api'', jsonb_build_object%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_source_status()')) not like '%''spreadsheet''%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_source_status()')) not like '%analytics_spreadsheet_import_runs%',
  'status da fonte financeira publica somente o contrato OMIE'
);
select ok(
  pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_snapshot(date,date,text,text,text)')) like '%when not v_api_configured then ''not_configured''%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_snapshot(date,date,text,text,text)')) like '%when v_source_key is null then ''empty''%',
  'snapshot financeiro diferencia fonte não configurada e vazio'
);

select ok(
  to_regprocedure('public.rpc_analytics_finance_unmatched_clients(text,integer)') is not null,
  'fila de empresas sem correspondência OMIE existe'
);
select ok(
  has_function_privilege('authenticated', 'public.rpc_analytics_finance_unmatched_clients(text,integer)', 'execute')
    and not has_function_privilege('anon', 'public.rpc_analytics_finance_unmatched_clients(text,integer)', 'execute'),
  'fila de empresas sem correspondência respeita grants'
);
select ok(
  pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_unmatched_clients(text,integer)')) like '%source_key = ''omie_receivables_api''%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_unmatched_clients(text,integer)')) like '%f.is_current%'
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_finance_unmatched_clients(text,integer)')) not like '%source_key <> ''omie_receivables_api''%',
  'fila de empresas sem correspondência não usa planilha como fallback'
);
select ok(
  exists (
    select 1
    from pg_proc p
    where p.oid = to_regprocedure('public.rpc_analytics_finance_unmatched_clients(text,integer)')
      and p.proconfig @> array['search_path=""']
  ),
  'fila de empresas sem correspondência fixa search_path'
);

select * from finish();
rollback;
