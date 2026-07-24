begin;
select plan(5);
select has_function('public', 'rpc_analytics_ceo_snapshot', ARRAY['date', 'date']);
select function_privs_are('public', 'rpc_analytics_ceo_snapshot', ARRAY['date', 'date'], 'anon', ARRAY[]::text[]);
select function_privs_are('public', 'rpc_analytics_ceo_snapshot', ARRAY['date', 'date'], 'authenticated', ARRAY['EXECUTE']);
select function_privs_are('public', 'rpc_analytics_ceo_snapshot', ARRAY['date', 'date'], 'service_role', ARRAY['EXECUTE']);
select results_eq($$select pg_get_function_result('public.rpc_analytics_ceo_snapshot(date,date)'::regprocedure)$$, $$values ('jsonb'::text)$$);
select * from finish();
rollback;
