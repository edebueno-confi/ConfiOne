-- Analytics Financeiro V1: read model canonico de Contas a Receber.
-- A tabela preserva a situacao original do Omie e deixa os calculos do painel
-- no backend. Escrita futura ocorre por importador controlado/API read-only.

create table public.analytics_finance_receivables (
  id uuid primary key default extensions.gen_random_uuid(),
  import_run_id uuid references public.analytics_spreadsheet_import_runs (id) on delete set null,
  source_key text not null default 'omie_receivables',
  source_record_id text not null,
  status_original text not null,
  aging_bucket text not null check (aging_bucket in ('recebido', 'recebido_parcialmente', 'atrasado', 'vence_hoje', 'a_vencer', 'cancelado', 'indisponivel')),
  document_number text,
  client_name text,
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
  updated_at timestamptz not null default timezone('utc', now()),
  unique (source_key, source_record_id)
);

create index analytics_finance_receivables_due_idx on public.analytics_finance_receivables (due_date);
create index analytics_finance_receivables_status_idx on public.analytics_finance_receivables (status_original, aging_bucket);
create index analytics_finance_receivables_client_idx on public.analytics_finance_receivables (client_name);

alter table public.analytics_finance_receivables enable row level security;
create policy analytics_finance_receivables_admin_read
on public.analytics_finance_receivables for select to authenticated
using (app_private.can_read_analytics());

revoke all on public.analytics_finance_receivables from public, anon;
grant select on public.analytics_finance_receivables to authenticated, service_role;
grant select, insert, update, delete on public.analytics_finance_receivables to service_role;

create trigger analytics_finance_receivables_touch_updated_at
before update on public.analytics_finance_receivables
for each row execute function app_private.touch_updated_at();

create trigger analytics_finance_receivables_audit_row_change
after insert or update or delete on public.analytics_finance_receivables
for each row execute function audit.capture_row_change();

create or replace function public.rpc_analytics_finance_snapshot(
  p_from date default null,
  p_to date default null,
  p_status text default null,
  p_aging_bucket text default null,
  p_client_query text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado ao Analytics Financeiro';
  end if;

  with filtered as (
    select r.*
    from public.analytics_finance_receivables r
    where (p_from is null or coalesce(r.due_date, r.issued_date) >= p_from)
      and (p_to is null or coalesce(r.due_date, r.issued_date) <= p_to)
      and (nullif(trim(p_status), '') is null or r.status_original = trim(p_status))
      and (nullif(trim(p_aging_bucket), '') is null or r.aging_bucket = trim(p_aging_bucket))
      and (nullif(trim(p_client_query), '') is null or r.client_name ilike '%' || trim(p_client_query) || '%')
  ),
  kpis as (
    select
      count(*)::integer as total_titles,
      coalesce(sum(net_amount), 0)::numeric as net_amount,
      coalesce(sum(received_amount), 0)::numeric as received_amount,
      coalesce(sum(balance), 0)::numeric as balance,
      count(*) filter (where aging_bucket = 'atrasado')::integer as overdue_titles,
      coalesce(sum(balance) filter (where aging_bucket = 'atrasado'), 0)::numeric as overdue_balance,
      case when coalesce(sum(net_amount), 0) = 0 then 0 else round(coalesce(sum(received_amount), 0) / sum(net_amount) * 100, 1) end as received_rate
    from filtered
  ),
  by_status as (
    select jsonb_agg(jsonb_build_object('status', status_original, 'titles', titles, 'balance', balance) order by titles desc) value
    from (select status_original, count(*)::integer titles, coalesce(sum(balance), 0)::numeric balance from filtered group by status_original) x
  ),
  by_aging as (
    select jsonb_agg(jsonb_build_object('bucket', aging_bucket, 'titles', titles, 'balance', balance) order by titles desc) value
    from (select aging_bucket, count(*)::integer titles, coalesce(sum(balance), 0)::numeric balance from filtered group by aging_bucket) x
  ),
  monthly as (
    select jsonb_agg(jsonb_build_object('month', month_start, 'titles', titles, 'balance', balance) order by month_start) value
    from (select date_trunc('month', coalesce(due_date, issued_date))::date month_start, count(*)::integer titles, coalesce(sum(balance), 0)::numeric balance from filtered where coalesce(due_date, issued_date) is not null group by 1) x
  )
  select jsonb_build_object(
    'kpis', (select to_jsonb(kpis) from kpis),
    'by_status', coalesce((select value from by_status), '[]'::jsonb),
    'by_aging', coalesce((select value from by_aging), '[]'::jsonb),
    'monthly', coalesce((select value from monthly), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

comment on function public.rpc_analytics_finance_snapshot(date, date, text, text, text) is
  'Snapshot financeiro filtrado de Contas a Receber, preservando status original e calculando saldo/aging no backend.';

revoke all on function public.rpc_analytics_finance_snapshot(date, date, text, text, text) from public, anon;
grant execute on function public.rpc_analytics_finance_snapshot(date, date, text, text, text) to authenticated, service_role;
