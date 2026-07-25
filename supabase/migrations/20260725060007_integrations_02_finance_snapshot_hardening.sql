-- INTEGRATIONS-02: staging e promocao atomica do snapshot Omie.
-- Nenhum registro incompleto deve ser lido pelo Dashboard.

alter table public.analytics_finance_receivables
  add column if not exists identity_version text not null default 'legacy';

create table if not exists public.analytics_finance_receivables_staging (
  id uuid primary key default extensions.gen_random_uuid(),
  sync_run_id uuid not null references public.analytics_finance_sync_runs(id) on delete cascade,
  source_key text not null,
  source_record_id text not null,
  identity_version text not null default 'omie-v2',
  status_original text not null,
  aging_bucket text not null check (aging_bucket in ('recebido', 'recebido_parcialmente', 'atrasado', 'vence_hoje', 'a_vencer', 'cancelado', 'indisponivel')),
  document_number text,
  client_name text,
  client_trade_name text,
  client_tax_id text,
  net_amount numeric(18, 2),
  received_amount numeric(18, 2) not null default 0,
  balance numeric(18, 2) not null default 0,
  due_date date,
  issued_date date,
  last_received_date date,
  boleto_generated boolean not null default false,
  is_cancelled boolean not null default false,
  is_partial boolean not null default false,
  effective_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (sync_run_id, source_key, source_record_id)
);

alter table public.analytics_finance_receivables_staging enable row level security;
revoke all on public.analytics_finance_receivables_staging from public, anon, authenticated;
grant select, insert, update, delete on public.analytics_finance_receivables_staging to service_role;

create or replace function public.rpc_service_promote_omie_snapshot(p_sync_run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  staged_count integer;
  promoted_count integer;
begin
  if p_sync_run_id is null then raise exception 'sync_run_id obrigatorio'; end if;
  if not exists (select 1 from public.analytics_finance_sync_runs where id = p_sync_run_id and status = 'processing') then
    raise exception 'Execucao OMIE inexistente ou nao esta em processamento';
  end if;
  select count(*) into staged_count from public.analytics_finance_receivables_staging where sync_run_id = p_sync_run_id;

  update public.analytics_finance_receivables
  set is_current = false, updated_at = timezone('utc', now())
  where source_key = 'omie_receivables_api' and coalesce(is_current, true);

  insert into public.analytics_finance_receivables (
    source_key, source_record_id, identity_version, status_original, aging_bucket,
    document_number, client_name, client_trade_name, client_tax_id, net_amount,
    received_amount, balance, due_date, issued_date, last_received_date,
    boleto_generated, is_cancelled, is_partial, effective_at, raw_payload,
    sync_run_id, is_current, updated_at
  )
  select source_key, source_record_id, identity_version, status_original, aging_bucket,
    document_number, client_name, client_trade_name, client_tax_id, net_amount,
    received_amount, balance, due_date, issued_date, last_received_date,
    boleto_generated, is_cancelled, is_partial, effective_at, raw_payload,
    sync_run_id, true, timezone('utc', now())
  from public.analytics_finance_receivables_staging
  where sync_run_id = p_sync_run_id
  on conflict (source_key, source_record_id) do update set
    identity_version = excluded.identity_version,
    status_original = excluded.status_original,
    aging_bucket = excluded.aging_bucket,
    document_number = excluded.document_number,
    client_name = excluded.client_name,
    client_trade_name = excluded.client_trade_name,
    client_tax_id = excluded.client_tax_id,
    net_amount = excluded.net_amount,
    received_amount = excluded.received_amount,
    balance = excluded.balance,
    due_date = excluded.due_date,
    issued_date = excluded.issued_date,
    last_received_date = excluded.last_received_date,
    boleto_generated = excluded.boleto_generated,
    is_cancelled = excluded.is_cancelled,
    is_partial = excluded.is_partial,
    effective_at = excluded.effective_at,
    raw_payload = excluded.raw_payload,
    sync_run_id = excluded.sync_run_id,
    is_current = true,
    updated_at = timezone('utc', now());

  get diagnostics promoted_count = row_count;
  delete from public.analytics_finance_receivables_staging where sync_run_id = p_sync_run_id;
  update public.analytics_finance_sync_runs
  set status = 'completed', total_rows = staged_count, accepted_rows = promoted_count, finished_at = timezone('utc', now())
  where id = p_sync_run_id;
  return jsonb_build_object('staged', staged_count, 'promoted', promoted_count);
end;
$$;

revoke all on function public.rpc_service_promote_omie_snapshot(uuid) from public, anon, authenticated;
grant execute on function public.rpc_service_promote_omie_snapshot(uuid) to service_role;
