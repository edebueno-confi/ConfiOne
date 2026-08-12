-- ANALYTICS-OMIE-CLIENT-INDEX-BATCH-PUBLICATION-V2
-- Publica o indice de clientes OMIE em lotes pequenos e somente troca o
-- ponteiro depois que a contagem integral foi validada.

create or replace function public.rpc_service_begin_omie_client_index(
  p_source_run_id uuid,
  p_fetched_at timestamptz default timezone('utc', now())
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_snapshot_id uuid := extensions.gen_random_uuid();
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Acesso negado a publicacao do indice de clientes OMIE';
  end if;
  if p_source_run_id is null then
    raise exception 'Execucao OMIE obrigatoria para iniciar publicacao do indice';
  end if;
  return v_snapshot_id;
end;
$$;

create or replace function public.rpc_service_append_omie_client_index(
  p_snapshot_id uuid,
  p_source_run_id uuid,
  p_rows jsonb,
  p_fetched_at timestamptz default timezone('utc', now())
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer := 0;
  v_fetched_at timestamptz := coalesce(p_fetched_at, timezone('utc', now()));
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Acesso negado a publicacao do indice de clientes OMIE';
  end if;
  if p_snapshot_id is null or p_source_run_id is null then
    raise exception 'Snapshot e execucao OMIE sao obrigatorios';
  end if;
  if jsonb_typeof(coalesce(p_rows, '[]'::jsonb)) <> 'array' then
    raise exception 'Lote do indice de clientes OMIE deve ser um array JSON';
  end if;

  insert into public.analytics_finance_client_index_cache (
    snapshot_id, client_code, client_name, client_tax_id, client_trade_name,
    cached_at, source_run_id
  )
  select
    p_snapshot_id, row_data.client_code, row_data.client_name,
    row_data.client_tax_id, row_data.client_trade_name, v_fetched_at,
    p_source_run_id
  from jsonb_to_recordset(coalesce(p_rows, '[]'::jsonb)) as row_data(
    client_code text,
    client_name text,
    client_tax_id text,
    client_trade_name text
  )
  where nullif(btrim(row_data.client_code), '') is not null
  on conflict (snapshot_id, client_code) do update set
    client_name = excluded.client_name,
    client_tax_id = excluded.client_tax_id,
    client_trade_name = excluded.client_trade_name,
    cached_at = excluded.cached_at,
    source_run_id = excluded.source_run_id;
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function public.rpc_service_commit_omie_client_index(
  p_snapshot_id uuid,
  p_source_run_id uuid,
  p_fetched_at timestamptz default timezone('utc', now()),
  p_expected_rows integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer := 0;
  v_fetched_at timestamptz := coalesce(p_fetched_at, timezone('utc', now()));
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Acesso negado a publicacao do indice de clientes OMIE';
  end if;
  if p_snapshot_id is null or p_source_run_id is null then
    raise exception 'Snapshot e execucao OMIE sao obrigatorios';
  end if;
  if p_expected_rows is not null and p_expected_rows < 0 then
    raise exception 'Contagem esperada do indice de clientes OMIE invalida';
  end if;

  select count(*)::integer into v_rows
  from public.analytics_finance_client_index_cache
  where snapshot_id = p_snapshot_id;
  if p_expected_rows is not null and v_rows <> p_expected_rows then
    raise exception 'Contagem do indice de clientes OMIE divergente: esperado %, encontrado %', p_expected_rows, v_rows;
  end if;

  insert into public.analytics_finance_client_index_state (
    cache_key, current_snapshot_id, cached_at, row_count, complete,
    source_run_id, metadata, updated_at
  ) values (
    'omie_clients', p_snapshot_id, v_fetched_at, v_rows, true,
    p_source_run_id, jsonb_build_object('publication', 'atomic_snapshot_batch'),
    timezone('utc', now())
  )
  on conflict (cache_key) do update set
    current_snapshot_id = excluded.current_snapshot_id,
    cached_at = excluded.cached_at,
    row_count = excluded.row_count,
    complete = excluded.complete,
    source_run_id = excluded.source_run_id,
    metadata = excluded.metadata,
    updated_at = excluded.updated_at;

  return jsonb_build_object(
    'cache_key', 'omie_clients',
    'snapshot_id', p_snapshot_id,
    'row_count', v_rows,
    'cached_at', v_fetched_at,
    'complete', true
  );
end;
$$;

revoke all on function public.rpc_service_begin_omie_client_index(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.rpc_service_append_omie_client_index(uuid, uuid, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.rpc_service_commit_omie_client_index(uuid, uuid, timestamptz, integer) from public, anon, authenticated;
grant execute on function public.rpc_service_begin_omie_client_index(uuid, timestamptz) to service_role;
grant execute on function public.rpc_service_append_omie_client_index(uuid, uuid, jsonb, timestamptz) to service_role;
grant execute on function public.rpc_service_commit_omie_client_index(uuid, uuid, timestamptz, integer) to service_role;

comment on function public.rpc_service_begin_omie_client_index(uuid, timestamptz) is
  'Inicia snapshot privado do indice OMIE sem alterar o ponteiro vigente.';
comment on function public.rpc_service_append_omie_client_index(uuid, uuid, jsonb, timestamptz) is
  'Acrescenta um lote ao snapshot privado do indice OMIE.';
comment on function public.rpc_service_commit_omie_client_index(uuid, uuid, timestamptz, integer) is
  'Valida a contagem e publica atomicamente o snapshot completo do indice OMIE.';
