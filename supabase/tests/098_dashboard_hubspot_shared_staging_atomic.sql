begin;

select plan(13);

select has_table('public', 'analytics_hubspot_company_staging', 'staging de empresas existe');
select has_table('public', 'analytics_hubspot_owner_staging', 'staging de owners existe');
select has_table('public', 'analytics_hubspot_pipeline_staging', 'staging de pipelines existe');
select has_table('public', 'analytics_hubspot_stage_staging', 'staging de stages existe');

select has_function(
  'public',
  'rpc_analytics_hubspot_finalize_run',
  array['uuid']::text[],
  'finalizador atomico permanece disponivel'
);

select ok(
  position('for update' in pg_get_functiondef('public.rpc_analytics_hubspot_finalize_run(uuid)'::regprocedure)) > 0,
  'finalizador bloqueia o run durante a promocao'
);

select ok(
  position('hubspot_companies' in pg_get_functiondef('public.rpc_analytics_hubspot_finalize_run(uuid)'::regprocedure)) > 0
    and position('analytics_hubspot_company_staging' in pg_get_functiondef('public.rpc_analytics_hubspot_finalize_run(uuid)'::regprocedure)) > 0,
  'empresas sao promovidas do staging'
);

select ok(
  position('rpc_service_reconcile_hubspot_pipeline_catalog' in pg_get_functiondef('public.rpc_analytics_hubspot_finalize_run(uuid)'::regprocedure)) > 0,
  'catalogo e reconciliado no finalizador'
);

select ok(
  position('watermark_advanced=true' in pg_get_functiondef('public.rpc_analytics_hubspot_finalize_run(uuid)'::regprocedure)) > 0,
  'watermark so avanca apos promocao'
);

select ok(
  position('delete from public.analytics_hubspot_company_staging' in pg_get_functiondef('public.rpc_analytics_hubspot_finalize_run(uuid)'::regprocedure)) > 0
    and position('delete from public.analytics_hubspot_deal_staging' in pg_get_functiondef('public.rpc_analytics_hubspot_finalize_run(uuid)'::regprocedure)) > 0,
  'staging e removido apos sucesso ou falha'
);

select is(
  has_table_privilege('authenticated', 'public.analytics_hubspot_company_staging', 'SELECT'),
  false,
  'authenticated nao le staging privado'
);

select is(
  has_function_privilege('service_role', 'public.rpc_analytics_hubspot_finalize_run(uuid)', 'EXECUTE'),
  true,
  'service_role executa finalizacao'
);

select is(
  has_function_privilege('anon', 'public.rpc_analytics_hubspot_finalize_run(uuid)', 'EXECUTE'),
  false,
  'anon nao executa finalizacao'
);

select * from finish();

rollback;
