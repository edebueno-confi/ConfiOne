-- DASHBOARD-OMIE-CLIENT-INDEX-CACHE-V1
-- O indice de clientes serve somente para enriquecimento dos recebiveis.
-- Recebiveis continuam sempre vindo da API; o cache evita repetir a carga
-- completa de clientes em toda execucao e preserva o ultimo snapshot integro.

create table if not exists public.analytics_finance_client_index_cache (
  snapshot_id uuid not null,
  client_code text not null,
  client_name text,
  client_tax_id text,
  client_trade_name text,
  cached_at timestamptz not null default timezone('utc', now()),
  source_run_id uuid references public.analytics_finance_sync_runs(id) on delete set null,
  primary key (snapshot_id, client_code)
);

create index if not exists analytics_finance_client_index_cache_snapshot_idx
  on public.analytics_finance_client_index_cache (snapshot_id, client_code);

create table if not exists public.analytics_finance_client_index_state (
  cache_key text primary key,
  current_snapshot_id uuid,
  cached_at timestamptz,
  row_count integer not null default 0,
  complete boolean not null default false,
  source_run_id uuid references public.analytics_finance_sync_runs(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint analytics_finance_client_index_state_key_check
    check (cache_key = 'omie_clients')
);

alter table public.analytics_finance_client_index_cache enable row level security;
alter table public.analytics_finance_client_index_state enable row level security;

revoke all on public.analytics_finance_client_index_cache from public, anon, authenticated;
revoke all on public.analytics_finance_client_index_state from public, anon, authenticated;
grant select, insert, update, delete on public.analytics_finance_client_index_cache to service_role;
grant select, insert, update, delete on public.analytics_finance_client_index_state to service_role;

create or replace function public.rpc_service_publish_omie_client_index(
  p_source_run_id uuid,
  p_rows jsonb,
  p_fetched_at timestamptz default timezone('utc', now())
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_snapshot_id uuid := extensions.gen_random_uuid();
  v_rows integer := 0;
  v_fetched_at timestamptz := coalesce(p_fetched_at, timezone('utc', now()));
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Acesso negado a publicacao do indice de clientes OMIE';
  end if;
  if jsonb_typeof(coalesce(p_rows, '[]'::jsonb)) <> 'array' then
    raise exception 'Indice de clientes OMIE deve ser um array JSON';
  end if;

  insert into public.analytics_finance_client_index_cache (
    snapshot_id, client_code, client_name, client_tax_id, client_trade_name,
    cached_at, source_run_id
  )
  select
    v_snapshot_id, row_data.client_code, row_data.client_name,
    row_data.client_tax_id, row_data.client_trade_name, v_fetched_at,
    p_source_run_id
  from jsonb_to_recordset(coalesce(p_rows, '[]'::jsonb)) as row_data(
    client_code text,
    client_name text,
    client_tax_id text,
    client_trade_name text
  )
  where nullif(btrim(row_data.client_code), '') is not null;
  get diagnostics v_rows = row_count;

  insert into public.analytics_finance_client_index_state (
    cache_key, current_snapshot_id, cached_at, row_count, complete,
    source_run_id, metadata, updated_at
  ) values (
    'omie_clients', v_snapshot_id, v_fetched_at, v_rows, true,
    p_source_run_id, jsonb_build_object('publication', 'atomic_snapshot'),
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
    'snapshot_id', v_snapshot_id,
    'row_count', v_rows,
    'cached_at', v_fetched_at,
    'complete', true
  );
end;
$$;

revoke all on function public.rpc_service_publish_omie_client_index(uuid, jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.rpc_service_publish_omie_client_index(uuid, jsonb, timestamptz) to service_role;

comment on table public.analytics_finance_client_index_cache is
  'Snapshot privado do indice de clientes OMIE usado somente para enriquecer recebiveis; nao substitui a consulta de contas a receber.';
comment on table public.analytics_finance_client_index_state is
  'Ponteiro atomico do snapshot completo vigente do indice de clientes OMIE.';
comment on function public.rpc_service_publish_omie_client_index(uuid, jsonb, timestamptz) is
  'Publica atomicamente um snapshot completo e validado do indice de clientes OMIE para reduzir chamadas repetidas.';
