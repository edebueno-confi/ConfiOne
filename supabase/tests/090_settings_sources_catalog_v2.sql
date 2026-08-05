begin;
select plan(15);

select ok(
  to_regclass('public.vw_admin_analytics_pipeline_catalog_v2') is not null,
  'catálogo administrativo v2 existe'
);
select ok(
  has_table_privilege('authenticated', 'public.vw_admin_analytics_pipeline_catalog_v2', 'select')
    and not has_table_privilege('anon', 'public.vw_admin_analytics_pipeline_catalog_v2', 'select'),
  'catálogo v2 respeita leitura autenticada'
);
select ok(
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'analytics_source_config' and column_name = 'area_key')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'analytics_source_config' and column_name = 'last_discovered_at'),
  'catálogo persiste área e última descoberta'
);
select ok(
  to_regprocedure('public.rpc_admin_update_analytics_pipeline_config(uuid,text,text,boolean)') is not null
    and has_function_privilege('authenticated', 'public.rpc_admin_update_analytics_pipeline_config(uuid,text,text,boolean)', 'execute')
    and not has_function_privilege('anon', 'public.rpc_admin_update_analytics_pipeline_config(uuid,text,text,boolean)', 'execute'),
  'RPC administrativo de classificação possui grant correto'
);
select ok(
  to_regprocedure('public.rpc_service_reconcile_hubspot_pipeline_catalog(text,jsonb)') is not null
    and has_function_privilege('service_role', 'public.rpc_service_reconcile_hubspot_pipeline_catalog(text,jsonb)', 'execute')
    and not has_function_privilege('authenticated', 'public.rpc_service_reconcile_hubspot_pipeline_catalog(text,jsonb)', 'execute'),
  'RPC de reconciliação fica restrito ao serviço'
);
select ok(
  pg_get_functiondef(to_regprocedure('public.rpc_service_reconcile_hubspot_pipeline_catalog(text,jsonb)')) like '%is_active = case when v_existing.classification_source = ''pending'' then true%'
    and pg_get_functiondef(to_regprocedure('public.rpc_service_reconcile_hubspot_pipeline_catalog(text,jsonb)')) like '%is_archived = true%',
  'reconciliação ativa novos pipelines e arquiva ausentes'
);
select ok(
  pg_get_functiondef(to_regprocedure('public.rpc_service_reconcile_hubspot_pipeline_catalog(text,jsonb)')) like '%classification_source%'
    and pg_get_functiondef(to_regprocedure('public.rpc_service_reconcile_hubspot_pipeline_catalog(text,jsonb)')) like '%a_classificar%',
  'reconciliação preserva classificação e usa A classificar'
);
select ok(
  pg_get_functiondef(to_regprocedure('public.rpc_admin_update_analytics_pipeline_config(uuid,text,text,boolean)')) like '%has_global_role%'
    and pg_get_functiondef(to_regprocedure('public.rpc_admin_update_analytics_pipeline_config(uuid,text,text,boolean)')) like '%is_archived then%',
  'classificação exige administrador e não reativa arquivados'
);
select ok(
  to_regprocedure('public.rpc_analytics_hubspot_start_run(text,text,uuid)') is not null
    and pg_get_functiondef(to_regprocedure('public.rpc_analytics_hubspot_start_run(text,text,uuid)')) like '%unclassified%',
  'carga HubSpot inclui fontes A classificar sem inventar área'
);
select ok(
  to_regclass('public.vw_admin_analytics_sync_history_v1') is not null,
  'read model de histórico administrativo existe'
);
select ok(
  has_table_privilege('authenticated', 'public.vw_admin_analytics_sync_history_v1', 'select')
    and not has_table_privilege('anon', 'public.vw_admin_analytics_sync_history_v1', 'select'),
  'histórico administrativo respeita leitura autenticada'
);
select ok(
  pg_get_viewdef('public.vw_admin_analytics_sync_history_v1'::regclass, true) like '%hubspot_sync_runs%'
    and pg_get_viewdef('public.vw_admin_analytics_sync_history_v1'::regclass, true) like '%analytics_finance_sync_runs%',
  'histórico separa HubSpot e OMIE'
);
select ok(
  pg_get_viewdef('public.vw_admin_analytics_sync_history_v1'::regclass, true) like '%correlation_id%'
    and pg_get_viewdef('public.vw_admin_analytics_sync_history_v1'::regclass, true) like '%duration_ms%',
  'histórico publica ciclo, duração e correlação'
);
select ok(
  exists (select 1 from public.managed_integrations where integration_key = 'omie' and mode = 'api'),
  'OMIE mantém modo interno API'
);
select ok(
  pg_get_viewdef('public.vw_admin_analytics_pipeline_catalog_v2'::regclass, true) like '%is_archived%'
    and pg_get_viewdef('public.vw_admin_analytics_pipeline_catalog_v2'::regclass, true) like '%has_alias%',
  'catálogo publica arquivamento e alias'
);

select * from finish();
rollback;
