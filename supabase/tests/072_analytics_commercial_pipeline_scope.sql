create extension if not exists pgtap with schema extensions;

begin;
select plan(4);

select ok(
  has_function_privilege('authenticated'::name, 'public.rpc_analytics_commercial_snapshot(date,date,text,text,text[])'::text, 'EXECUTE'),
  'RPC comercial com exclusao de pipelines disponivel para autenticados'
);

select ok(
  not has_function_privilege('anon'::name, 'public.rpc_analytics_commercial_snapshot(date,date,text,text,text[])'::text, 'EXECUTE'),
  'anon nao executa RPC comercial com exclusao de pipelines'
);

select ok(
  (select proconfig @> array['search_path=""'] from pg_proc where oid = 'public.rpc_analytics_commercial_snapshot(date,date,text,text,text[])'::regprocedure),
  'RPC comercial com exclusao fixa search_path'
);

select ok(
  has_function_privilege('authenticated'::name, 'public.rpc_analytics_commercial_snapshot(date,date,text,text)'::text, 'EXECUTE'),
  'wrapper legado comercial de quatro argumentos permanece disponivel'
);

select * from finish();
rollback;
