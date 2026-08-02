-- DASHBOARD-04: histórico publicado das fontes oficiais.
-- Tabelas de staging e importação históricas permanecem preservadas; a
-- superfície do Dashboard publica somente HubSpot e OMIE API.

create view public.vw_analytics_finance_sync_runs_read
with (security_barrier = true)
as
select
  id,
  source_key,
  status,
  total_rows,
  accepted_rows,
  rejected_rows,
  started_at,
  finished_at,
  case
    when status in ('failed', 'abandoned') then coalesce(error_message, 'A sincronização OMIE não foi concluída.')
    else null
  end as error_message,
  correlation_id
from public.analytics_finance_sync_runs
where app_private.can_read_analytics();

revoke all on public.vw_analytics_finance_sync_runs_read from public, anon;
grant select on public.vw_analytics_finance_sync_runs_read to authenticated, service_role;

create or replace function public.rpc_analytics_finance_source_status()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
select case when app_private.can_read_analytics() then jsonb_build_object(
  'api', jsonb_build_object(
    'provider', 'Omie',
    'resource', 'Contas a Receber',
    'configured', exists (
      select 1
      from public.managed_integrations
      where integration_key = 'omie'
        and is_enabled
        and credential_secret_id is not null
    ),
    'last_sync_at', (
      select max(coalesce(finished_at, started_at))
      from public.analytics_finance_sync_runs
    ),
    'last_status', (
      select status
      from public.analytics_finance_sync_runs
      order by created_at desc
      limit 1
    ),
    'metrics', jsonb_build_array(
      'saldo vencido',
      'recebido',
      'a vencer',
      'taxa de recebimento',
      'aging por vencimento',
      'categoria e origem do título',
      'previsão de recebimento'
    )
  )
) else '{}'::jsonb end;
$$;

revoke all on function public.rpc_analytics_finance_source_status() from public, anon;
grant execute on function public.rpc_analytics_finance_source_status() to authenticated, service_role;

comment on view public.vw_analytics_finance_sync_runs_read is
  'Read model de execuções OMIE; consulta autenticada sem acesso à tabela bruta por frontend.';

comment on function public.rpc_analytics_finance_source_status() is
  'Status da fonte financeira publicado somente para a API OMIE.';
