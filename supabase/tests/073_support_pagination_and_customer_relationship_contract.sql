create extension if not exists pgtap with schema extensions;

begin;
select plan(7);

select ok(
  has_function_privilege('authenticated'::name, 'public.rpc_support_ticket_queue_page(text,text,text,text,text,text,text,text,text,integer,integer)'::text, 'EXECUTE'),
  'fila de suporte paginada disponivel para autenticados'
);

select ok(
  not has_function_privilege('anon'::name, 'public.rpc_support_ticket_queue_page(text,text,text,text,text,text,text,text,text,integer,integer)'::text, 'EXECUTE'),
  'anon nao executa fila de suporte paginada'
);

select ok(
  (select proconfig @> array['search_path=""'] from pg_proc where oid = 'public.rpc_support_ticket_queue_page(text,text,text,text,text,text,text,text,text,integer,integer)'::regprocedure),
  'fila paginada fixa search_path'
);

select ok(
  has_function_privilege('authenticated'::name, 'public.rpc_analytics_customer_relationship_contract(integer,integer)'::text, 'EXECUTE'),
  'contrato de relacionamento disponivel para autenticados'
);

select ok(
  not has_function_privilege('anon'::name, 'public.rpc_analytics_customer_relationship_contract(integer,integer)'::text, 'EXECUTE'),
  'anon nao executa contrato de relacionamento'
);

select ok(
  (select proconfig @> array['search_path=""'] from pg_proc where oid = 'public.rpc_analytics_customer_relationship_contract(integer,integer)'::regprocedure),
  'contrato de relacionamento fixa search_path'
);

select ok(
  exists (select 1 from pg_proc where proname = 'rpc_support_ticket_queue_page')
    and exists (select 1 from pg_proc where proname = 'rpc_analytics_customer_relationship_contract'),
  'contratos do lote materializados'
);

select * from finish();
rollback;
