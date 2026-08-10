-- ANALYTICS-FINANCE-SOURCE-STATUS-OMIE-ONLY-V1

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
      'configured', exists(
        select 1 from public.managed_integrations
        where integration_key = 'omie' and is_enabled and credential_secret_id is not null
      ),
      'last_sync_at', (select max(coalesce(finished_at, started_at)) from public.analytics_finance_sync_runs),
      'last_status', (select status from public.analytics_finance_sync_runs order by created_at desc limit 1),
      'metrics', jsonb_build_array('saldo vencido', 'recebido', 'a vencer', 'taxa de recebimento', 'aging por vencimento', 'categoria e origem do titulo', 'previsao de recebimento')
    )
  ) else '{}'::jsonb end;
$$;
