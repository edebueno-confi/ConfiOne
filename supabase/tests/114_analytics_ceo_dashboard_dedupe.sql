begin;

select plan(6);

select has_function(
  'public',
  'rpc_analytics_ceo_dashboard',
  array['date', 'date'],
  'dashboard CEO combinado existe'
);

select results_eq(
  $$select pg_get_function_result('public.rpc_analytics_ceo_dashboard(date,date)'::regprocedure)$$,
  $$values ('jsonb'::text)$$,
  'dashboard CEO combinado publica JSONB'
);

select function_privs_are(
  'public', 'rpc_analytics_ceo_dashboard', array['date', 'date'],
  'anon', array[]::text[],
  'anon nao executa o dashboard CEO combinado'
);

select function_privs_are(
  'public', 'rpc_analytics_ceo_dashboard', array['date', 'date'],
  'authenticated', array['EXECUTE'],
  'authenticated executa o dashboard CEO combinado'
);

select function_privs_are(
  'public', 'rpc_analytics_ceo_dashboard', array['date', 'date'],
  'service_role', array['EXECUTE'],
  'service_role executa o dashboard CEO combinado'
);

select ok(
  pg_get_functiondef('public.rpc_analytics_ceo_dashboard(date,date)'::regprocedure) like '%rpc_analytics_ceo_snapshot(current_from, current_to)%'
    and pg_get_functiondef('public.rpc_analytics_ceo_dashboard(date,date)'::regprocedure) like '%''snapshot'', current_payload%'
    and pg_get_functiondef('public.rpc_analytics_ceo_dashboard(date,date)'::regprocedure) like '%''previous'', previous_payload%',
  'o RPC calcula o snapshot corrente uma vez e reutiliza o payload no historico'
);

select * from finish();
rollback;
