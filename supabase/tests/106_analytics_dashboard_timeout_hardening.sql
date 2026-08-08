-- Regressão do incidente de timeout do Dashboard: os dois read models que
-- materializam conjuntos amplos precisam de memória de trabalho limitada por
-- função, para não competir com o teto global do PostgREST.

begin;

select plan(4);

select has_function(
  'public',
  'rpc_analytics_support_kpis_v2',
  array['date', 'date', 'text', 'text'],
  'read model de Suporte existe'
);

select has_function(
  'public',
  'rpc_analytics_ceo_snapshot',
  array['date', 'date'],
  'snapshot executivo existe'
);

select is(
  (
    select setting
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral unnest(coalesce(p.proconfig, array[]::text[])) as cfg(setting)
    where n.nspname = 'public'
      and p.oid = 'public.rpc_analytics_support_kpis_v2(date,date,text,text)'::regprocedure
      and setting like 'work_mem=%'
  ),
  'work_mem=16MB',
  'Suporte recebe work_mem suficiente apenas durante sua execução'
);

select is(
  (
    select setting
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral unnest(coalesce(p.proconfig, array[]::text[])) as cfg(setting)
    where n.nspname = 'public'
      and p.oid = 'public.rpc_analytics_ceo_snapshot(date,date)'::regprocedure
      and setting like 'work_mem=%'
  ),
  'work_mem=64MB',
  'Snapshot executivo evita spill temporário durante sua execução'
);

select * from finish();

rollback;
