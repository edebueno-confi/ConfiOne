begin;
select plan(5);
select has_function('public', 'rpc_analytics_ceo_reconciliation_quality_grouped', ARRAY['date', 'date', 'text', 'text', 'text', 'integer', 'integer']);
select function_privs_are('public', 'rpc_analytics_ceo_reconciliation_quality_grouped', ARRAY['date', 'date', 'text', 'text', 'text', 'integer', 'integer'], 'anon', ARRAY[]::text[]);
select function_privs_are('public', 'rpc_analytics_ceo_reconciliation_quality_grouped', ARRAY['date', 'date', 'text', 'text', 'text', 'integer', 'integer'], 'authenticated', ARRAY['EXECUTE']);
select function_privs_are('public', 'rpc_analytics_ceo_reconciliation_quality_grouped', ARRAY['date', 'date', 'text', 'text', 'text', 'integer', 'integer'], 'service_role', ARRAY['EXECUTE']);
select results_eq($$select pg_get_function_result('public.rpc_analytics_ceo_reconciliation_quality_grouped(date,date,text,text,text,integer,integer)'::regprocedure)$$, $$values ('jsonb'::text)$$);
select * from finish();
rollback;
