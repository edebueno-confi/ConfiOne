begin;
select plan(7);

select ok(
  to_regclass('public.analytics_finance_receivables') is not null,
  'read model financeiro existe'
);
select ok(
  has_table_privilege('authenticated', 'public.analytics_finance_receivables', 'select'),
  'authenticated pode ler somente o contrato financeiro'
);
select ok(
  not has_table_privilege('anon', 'public.analytics_finance_receivables', 'select'),
  'anon nao pode ler o read model financeiro'
);
select ok(
  has_function_privilege('authenticated', 'public.rpc_analytics_finance_snapshot(date,date,text,text,text)', 'execute'),
  'authenticated pode executar o snapshot financeiro'
);
select ok(
  not has_function_privilege('anon', 'public.rpc_analytics_finance_snapshot(date,date,text,text,text)', 'execute'),
  'anon nao pode executar o snapshot financeiro'
);
select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rpc_analytics_finance_snapshot'
      and p.proconfig @> array['search_path=""']
  ),
  'snapshot financeiro fixa search_path'
);
select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rpc_analytics_finance_snapshot'
      and p.prorettype = 'jsonb'::regtype
  ),
  'snapshot financeiro retorna jsonb'
);

select * from finish();
rollback;
