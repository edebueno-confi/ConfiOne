begin;

select plan(5);

select has_function(
  'public',
  'rpc_service_reconcile_hubspot_pipeline_catalog',
  array['text', 'jsonb']::text[],
  'o RPC de reconciliação do catálogo permanece disponível'
);

select ok(
  position(
    'app_private.is_internal_service_request()' in
      pg_get_functiondef('public.rpc_service_reconcile_hubspot_pipeline_catalog(text,jsonb)'::regprocedure)
  ) > 0,
  'o RPC usa a identidade interna canônica do serviço'
);

select is(
  has_function_privilege(
    'service_role',
    'public.rpc_service_reconcile_hubspot_pipeline_catalog(text,jsonb)',
    'EXECUTE'
  ),
  true,
  'service_role mantém permissão para reconciliar o catálogo'
);

select is(
  has_function_privilege(
    'authenticated',
    'public.rpc_service_reconcile_hubspot_pipeline_catalog(text,jsonb)',
    'EXECUTE'
  ),
  false,
  'usuários autenticados não podem reconciliar o catálogo'
);

select is(
  has_function_privilege(
    'anon',
    'public.rpc_service_reconcile_hubspot_pipeline_catalog(text,jsonb)',
    'EXECUTE'
  ),
  false,
  'anon não pode reconciliar o catálogo'
);

select * from finish();

rollback;
