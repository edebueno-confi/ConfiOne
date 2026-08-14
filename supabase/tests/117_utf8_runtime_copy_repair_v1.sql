create extension if not exists pgtap with schema extensions;

begin;

select plan(5);

select ok(
  exists (
    select 1
    from supabase_migrations.schema_migrations
    where version = '20260813195500'
      and name = 'utf8_runtime_copy_repair_v1'
  ),
  'migration de correção UTF-8 está registrada'
);

select ok(
  strpos(pg_get_functiondef('public.rpc_analytics_finance_snapshot(date,date,text,text,text)'::regprocedure), chr(195) || chr(167)) = 0
    and strpos(pg_get_functiondef('public.rpc_analytics_finance_snapshot(date,date,text,text,text)'::regprocedure), chr(195) || chr(163)) = 0
    and strpos(pg_get_functiondef('public.rpc_analytics_finance_snapshot(date,date,text,text,text)'::regprocedure), chr(195) || chr(161)) = 0,
  'snapshot financeiro não contém sequências mojibake conhecidas'
);

select ok(
  strpos(pg_get_functiondef('public.rpc_analytics_customer_success_kpis_v2()'::regprocedure), chr(195) || chr(161)) = 0,
  'KPIs de Customer Success não contém responsável corrompido'
);

select ok(
  obj_description('public.rpc_analytics_finance_snapshot(date,date,text,text,text)'::regprocedure, 'pg_proc')
    = 'Cockpit financeiro: somente snapshot OMIE API publicado; planilhas permanecem históricas e não são fallback. Expõe estado de configuração, execução, frescor e vazio.',
  'comentário do snapshot financeiro está legível'
);

select ok(
  not exists (
    select 1
    from public.internal_build_tasks
    where title like '%?%'
       or description like '%?%'
       or coalesce(area, '') like '%?%'
  ),
  'cards do painel não contêm interrogação de substituição'
);

select * from finish();

rollback;
