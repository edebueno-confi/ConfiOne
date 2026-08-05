begin;

select plan(11);

set local request.jwt.claim.role = 'service_role';

select has_function(
  'public',
  'rpc_service_publish_omie_client_index',
  array['uuid', 'jsonb', 'timestamp with time zone']::text[],
  'RPC de publicacao atomica do indice OMIE existe'
);

select is(
  has_function_privilege('service_role', 'public.rpc_service_publish_omie_client_index(uuid,jsonb,timestamptz)', 'EXECUTE'),
  true,
  'service_role pode publicar o indice'
);

select is(
  has_function_privilege('authenticated', 'public.rpc_service_publish_omie_client_index(uuid,jsonb,timestamptz)', 'EXECUTE'),
  false,
  'authenticated nao publica o indice'
);

select ok(
  position('analytics_finance_client_index_cache' in pg_get_functiondef('public.rpc_service_publish_omie_client_index(uuid,jsonb,timestamptz)'::regprocedure)) > 0
    and position('analytics_finance_client_index_state' in pg_get_functiondef('public.rpc_service_publish_omie_client_index(uuid,jsonb,timestamptz)'::regprocedure)) > 0,
  'RPC publica cache e ponteiro de estado'
);

create temporary table test_omie_cache_context (run_id uuid, snapshot_id uuid) on commit drop;

with inserted as (
  insert into public.analytics_finance_sync_runs (source_key, status)
  values ('omie_receivables_api', 'completed')
  returning id
)
insert into test_omie_cache_context (run_id)
select id from inserted;

with published as (
  select public.rpc_service_publish_omie_client_index(
    (select run_id from test_omie_cache_context),
    jsonb_build_array(
      jsonb_build_object('client_code', '10', 'client_name', 'ACME', 'client_tax_id', '123', 'client_trade_name', 'ACME'),
      jsonb_build_object('client_code', '20', 'client_name', 'BETA', 'client_tax_id', null, 'client_trade_name', null)
    ),
    timezone('utc', now())
  ) as result
)
update test_omie_cache_context
set snapshot_id = (published.result->>'snapshot_id')::uuid
from published;

select is(
  (select count(*)::integer from public.analytics_finance_client_index_cache where snapshot_id = (select snapshot_id from test_omie_cache_context)),
  2,
  'snapshot completo preserva todas as linhas validas'
);

select is(
  (select current_snapshot_id from public.analytics_finance_client_index_state where cache_key = 'omie_clients'),
  (select snapshot_id from test_omie_cache_context),
  'ponteiro aponta para o snapshot publicado'
);

select is(
  (select complete from public.analytics_finance_client_index_state where cache_key = 'omie_clients'),
  true,
  'estado publicado e marcado como completo'
);

select is(
  (select row_count from public.analytics_finance_client_index_state where cache_key = 'omie_clients'),
  2,
  'estado registra a contagem publicada'
);

select throws_ok(
  $$select public.rpc_service_publish_omie_client_index((select run_id from test_omie_cache_context), '{}'::jsonb, timezone('utc', now()))$$,
  'P0001',
  'Indice de clientes OMIE deve ser um array JSON',
  'RPC rejeita payload que nao seja array'
);

select is(
  has_table_privilege('authenticated', 'public.analytics_finance_client_index_cache', 'SELECT'),
  false,
  'authenticated nao le o cache privado'
);

select is(
  has_table_privilege('service_role', 'public.analytics_finance_client_index_cache', 'SELECT'),
  true,
  'service_role le o cache privado'
);

select * from finish();
rollback;
