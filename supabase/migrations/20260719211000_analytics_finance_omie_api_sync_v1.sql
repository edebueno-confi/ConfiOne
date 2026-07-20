-- Execucoes read-only da API Omie. O payload original continua preservado no
-- read model de titulos, mas a origem e a ultima execucao ficam auditaveis.

create table public.analytics_finance_sync_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  source_key text not null default 'omie_receivables_api',
  status text not null check (status in ('processing', 'completed', 'partial', 'failed')),
  total_rows integer not null default 0,
  accepted_rows integer not null default 0,
  rejected_rows integer not null default 0,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  error_message text,
  triggered_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.analytics_finance_receivables
  add column if not exists sync_run_id uuid references public.analytics_finance_sync_runs(id) on delete set null;

create index analytics_finance_sync_runs_created_idx
  on public.analytics_finance_sync_runs (created_at desc);

create index analytics_finance_receivables_sync_run_idx
  on public.analytics_finance_receivables (sync_run_id);

alter table public.analytics_finance_sync_runs enable row level security;
create policy analytics_finance_sync_runs_read
on public.analytics_finance_sync_runs for select to authenticated
using (app_private.can_read_analytics());

revoke all on public.analytics_finance_sync_runs from public, anon;
grant select on public.analytics_finance_sync_runs to authenticated, service_role;
grant insert, update on public.analytics_finance_sync_runs to service_role;

create or replace function public.rpc_analytics_finance_source_status()
returns jsonb
language sql stable security definer set search_path = ''
as $$
select case when app_private.can_read_analytics() then jsonb_build_object(
  'api', jsonb_build_object(
    'provider', 'Omie',
    'resource', 'Contas a Receber',
    'configured', exists(select 1 from public.managed_integrations where integration_key = 'omie' and is_enabled and credential_secret_id is not null),
    'last_sync_at', (select max(coalesce(finished_at, started_at)) from public.analytics_finance_sync_runs),
    'last_status', (select status from public.analytics_finance_sync_runs order by created_at desc limit 1),
    'metrics', jsonb_build_array('saldo vencido', 'recebido', 'a vencer', 'taxa de recebimento', 'aging por vencimento', 'categoria e origem do titulo', 'previsao de recebimento'),
    'fallback', 'A planilha exportada do Omie continua sendo exibida enquanto a API nao estiver configurada.'
  ),
  'spreadsheet', jsonb_build_object(
    'provider', 'Planilha exportada do Omie',
    'available', exists(select 1 from public.analytics_finance_receivables where source_key = 'omie_receivables_xlsx_20260622'),
    'last_import_at', (select max(r.created_at) from public.analytics_spreadsheet_import_runs r join public.analytics_spreadsheet_sources s on s.id = r.source_id where s.source_key = 'omie_receivables_xlsx_20260622' and r.status in ('completed', 'partial'))
  )
) else '{}'::jsonb end;
$$;

revoke all on function public.rpc_analytics_finance_source_status() from public, anon;
grant execute on function public.rpc_analytics_finance_source_status() to authenticated, service_role;
