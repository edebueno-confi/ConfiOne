begin;
select plan(19);

select ok(to_regclass('public.analytics_sync_cycles') is not null, 'ciclo pai persistido existe');
select ok(to_regclass('public.analytics_sync_cycle_steps') is not null, 'etapas do ciclo persistidas existem');
select ok((select relrowsecurity from pg_class where oid = 'public.analytics_sync_cycles'::regclass), 'ciclo pai possui RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.analytics_sync_cycle_steps'::regclass), 'etapas possuem RLS');
select ok(has_table_privilege('authenticated', 'public.vw_admin_analytics_sync_history_v2', 'select') and not has_table_privilege('anon', 'public.vw_admin_analytics_sync_history_v2', 'select'), 'histórico v2 possui leitura autenticada');

select ok(to_regprocedure('public.rpc_admin_reconcile_analytics_sync_runs(integer)') is not null, 'RPC de reconciliação de órfãos existe');
select ok(to_regprocedure('public.rpc_service_start_analytics_sync_cycle(text,uuid)') is not null, 'RPC de início do ciclo existe');
select ok(has_function_privilege('service_role', 'public.rpc_service_start_analytics_sync_cycle(text,uuid)', 'execute') and not has_function_privilege('anon', 'public.rpc_service_start_analytics_sync_cycle(text,uuid)', 'execute'), 'início do ciclo não é anônimo');
select ok(pg_get_functiondef('public.rpc_admin_reconcile_analytics_sync_runs(integer)'::regprocedure) like '%timed_out%' and pg_get_functiondef('public.rpc_admin_reconcile_analytics_sync_runs(integer)'::regprocedure) like '%last_heartbeat_at%', 'reconciliação encerra execução por heartbeat');

select ok((select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'hubspot_sync_runs' and column_name in ('cycle_id', 'internal_error_code', 'provider_code', 'internal_message', 'sanitized_error')) = 5, 'HubSpot persiste erro interno e mensagem sanitizada separadamente');
select ok((select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'analytics_finance_sync_runs' and column_name in ('cycle_id', 'internal_error_code', 'provider_code', 'internal_message', 'sanitized_error')) = 5, 'OMIE persiste erro interno e mensagem sanitizada separadamente');
select ok(pg_get_viewdef('public.vw_analytics_finance_sync_runs_read'::regclass, true) like '%sanitized_error%' and pg_get_viewdef('public.vw_analytics_finance_sync_runs_read'::regclass, true) not like '%analytics_finance_sync_runs.error_message%', 'read model OMIE não expõe mensagem interna bruta');
select ok(pg_get_viewdef('public.vw_analytics_dashboard_sync_status'::regclass, true) like '%sanitized_error%' and pg_get_viewdef('public.vw_analytics_dashboard_sync_status'::regclass, true) not like '%hubspot_sync_runs.error_message%', 'read model HubSpot não expõe mensagem interna bruta');

select ok(position('currentRunStatus' in pg_get_functiondef('public.rpc_analytics_source_status()'::regprocedure)) > 0, 'status publica lifecycle da execução');
select ok(position('publishedSourceStatus' in pg_get_functiondef('public.rpc_analytics_source_status()'::regprocedure)) > 0, 'status publica frescor do snapshot');
select ok(position('hasValidSnapshot' in pg_get_functiondef('public.rpc_analytics_source_status()'::regprocedure)) > 0, 'status publica existência de snapshot válido');
select ok(position('timed_out' in pg_get_functiondef('public.rpc_analytics_source_status()'::regprocedure)) > 0, 'status distingue timeout de sincronização');
select ok(position('vw_admin_analytics_sync_history_v2' in pg_get_viewdef('public.vw_admin_analytics_sync_history_v2'::regclass, true)) = 0, 'histórico v2 não depende de si mesmo');
select ok(pg_get_viewdef('public.vw_admin_analytics_sync_history_v2'::regclass, true) like '%analytics_sync_cycles%' and pg_get_viewdef('public.vw_admin_analytics_sync_history_v2'::regclass, true) like '%analytics_sync_cycle_steps%', 'histórico v2 representa ciclo e etapas');

select * from finish();
rollback;
