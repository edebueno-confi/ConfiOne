create extension if not exists pgtap with schema extensions;

begin;

select plan(4);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.customer_account_groups'::regclass
      and conname = 'customer_account_groups_not_cs_portfolio_check'
  ),
  'agrupamentos nao aceitam carteira CS como tipo novo'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rpc_admin_create_customer_account_group'
      and pg_get_functiondef(p.oid) like '%customer success portfolios must use CS portfolio assignments%'
  ),
  'RPC orienta carteira CS para a atribuicao propria de Customer Success'
);

select is(
  (select count(*)::integer
   from pg_enum e
   join pg_type t on t.oid = e.enumtypid
   where t.typname = 'customer_group_type'
     and e.enumlabel in ('economic_group', 'service_umbrella')),
  2,
  'os tipos atuais de agrupamento sao grupo economico e guarda-chuva de servico'
);

select is(
  (select count(*)::integer
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = 'rpc_admin_upsert_cs_customer_portfolio'),
  1,
  'carteira CS continua sendo gerida pela RPC propria do dominio'
);

select * from finish();
rollback;
