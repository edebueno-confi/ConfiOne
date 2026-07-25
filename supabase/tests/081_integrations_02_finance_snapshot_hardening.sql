begin;
select plan(8);

select ok(to_regclass('public.analytics_finance_receivables_staging') is not null, 'staging financeiro existe');
select ok((select relrowsecurity from pg_class where oid = 'public.analytics_finance_receivables_staging'::regclass), 'staging financeiro possui RLS');
select ok(to_regprocedure('public.rpc_service_promote_omie_snapshot(uuid)') is not null, 'RPC de promocao atomica existe');
select is(
  has_function_privilege('anon', 'public.rpc_service_promote_omie_snapshot(uuid)', 'EXECUTE'),
  false,
  'anon nao executa promocao atomica'
);
select is(
  has_function_privilege('authenticated', 'public.rpc_service_promote_omie_snapshot(uuid)', 'EXECUTE'),
  false,
  'authenticated nao executa promocao atomica'
);
select is(
  has_function_privilege('service_role', 'public.rpc_service_promote_omie_snapshot(uuid)', 'EXECUTE'),
  true,
  'service_role executa promocao atomica'
);
select ok(position('can_read_analytics' in pg_get_functiondef('public.rpc_analytics_cs_snapshot(date,date,text,text,text[])'::regprocedure)) > 0, 'wrapper CS declara gate de leitura');
select ok(position('SECURITY DEFINER' in upper(pg_get_functiondef('public.rpc_analytics_cs_snapshot(date,date,text,text,text[])'::regprocedure))) > 0, 'wrapper CS permanece controlado');

select * from finish();
rollback;
