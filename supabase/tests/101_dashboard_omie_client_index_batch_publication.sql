begin;

select plan(8);

set local request.jwt.claim.role = 'service_role';

select has_function(
  'public',
  'rpc_service_begin_omie_client_index',
  array['uuid', 'timestamp with time zone']::text[],
  'RPC de inicio do snapshot OMIE existe'
);

select has_function(
  'public',
  'rpc_service_append_omie_client_index',
  array['uuid', 'uuid', 'jsonb', 'timestamp with time zone']::text[],
  'RPC de lote do snapshot OMIE existe'
);

select has_function(
  'public',
  'rpc_service_commit_omie_client_index',
  array['uuid', 'uuid', 'timestamp with time zone', 'integer']::text[],
  'RPC de commit do snapshot OMIE existe'
);

select is(
  has_function_privilege('service_role', 'public.rpc_service_append_omie_client_index(uuid,uuid,jsonb,timestamptz)', 'EXECUTE'),
  true,
  'service_role pode anexar lotes OMIE'
);

select is(
  has_function_privilege('authenticated', 'public.rpc_service_append_omie_client_index(uuid,uuid,jsonb,timestamptz)', 'EXECUTE'),
  false,
  'authenticated nao anexa lotes OMIE'
);

create temporary table test_omie_batch_context (run_id uuid, snapshot_id uuid) on commit drop;

with inserted as (
  insert into public.analytics_finance_sync_runs (source_key, status)
  values ('omie_receivables_api', 'completed')
  returning id
)
insert into test_omie_batch_context (run_id)
select id from inserted;

update test_omie_batch_context
set snapshot_id = public.rpc_service_begin_omie_client_index(run_id, timezone('utc', now()));

select is(
  public.rpc_service_append_omie_client_index(
    snapshot_id,
    run_id,
    jsonb_build_array(
      jsonb_build_object('client_code', 'batch-1', 'client_name', 'Cliente 1'),
      jsonb_build_object('client_code', 'batch-2', 'client_name', 'Cliente 2')
    ),
    timezone('utc', now())
  ),
  2,
  'lote OMIE preserva a contagem de linhas validas'
)
from test_omie_batch_context;

select is(
  (public.rpc_service_commit_omie_client_index(snapshot_id, run_id, timezone('utc', now()), 2)->>'complete')::boolean,
  true,
  'commit OMIE publica somente apos validar a contagem'
)
from test_omie_batch_context;

select is(
  (select row_count from public.analytics_finance_client_index_state where cache_key = 'omie_clients'),
  2,
  'ponteiro OMIE registra as linhas do snapshot'
);

select * from finish();
rollback;
