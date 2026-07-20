create extension if not exists pgtap with schema extensions;

begin;
select plan(8);

select ok(has_function_privilege('authenticated'::name, 'public.rpc_analytics_commercial_snapshot(date,date,text,text)'::text, 'EXECUTE'), 'RPC comercial filtravel disponivel para autenticados');
select ok(has_function_privilege('authenticated'::name, 'public.rpc_analytics_cs_snapshot(date,date,text,text)'::text, 'EXECUTE'), 'RPC CS filtravel disponivel para autenticados');
select ok(not has_function_privilege('anon'::name, 'public.rpc_analytics_commercial_snapshot(date,date,text,text)'::text, 'EXECUTE'), 'anon nao executa snapshot comercial');
select ok(not has_function_privilege('anon'::name, 'public.rpc_analytics_cs_snapshot(date,date,text,text)'::text, 'EXECUTE'), 'anon nao executa snapshot CS');
select ok((select proconfig @> array['search_path=""'] from pg_proc where oid = 'public.rpc_analytics_commercial_snapshot(date,date,text,text)'::regprocedure), 'snapshot comercial fixa search_path');
select ok((select proconfig @> array['search_path=""'] from pg_proc where oid = 'public.rpc_analytics_cs_snapshot(date,date,text,text)'::regprocedure), 'snapshot CS fixa search_path');
select is(jsonb_typeof(public.rpc_analytics_commercial_snapshot(null, null, null, null)), 'object', 'snapshot comercial protegido retorna objeto');
select is(jsonb_typeof(public.rpc_analytics_cs_snapshot(null, null, null, null)), 'object', 'snapshot CS protegido retorna objeto');

select * from finish();
rollback;
