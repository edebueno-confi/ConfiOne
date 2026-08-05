-- Contrato publicado do Financeiro: somente o read model OMIE API alimenta
-- o Dashboard. Dados históricos de planilhas continuam armazenados para
-- auditoria/migração, mas deixam de ser fallback de publicação.

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
  v_source_key text;
  v_source text;
  v_status text;
  v_reason text;
  v_api_configured boolean;
  v_last_status text;
  v_last_successful_sync_at timestamptz;
  v_last_sync_run_id uuid;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado ao Analytics Financeiro';
  end if;

  select exists (
    select 1
    from public.managed_integrations
    where integration_key = 'omie'
      and is_enabled
      and credential_secret_id is not null
  ) into v_api_configured;

  select r.status, r.id
    into v_last_status, v_last_sync_run_id
  from public.analytics_finance_sync_runs r
  order by r.created_at desc
  limit 1;

  select max(r.finished_at)
    into v_last_successful_sync_at
  from public.analytics_finance_sync_runs r
  where r.status = 'completed'
    and r.finished_at is not null;

  select case
    when exists (
      select 1
      from public.analytics_finance_receivables
      where source_key = 'omie_receivables_api'
        and is_current
    ) then 'omie_receivables_api'
    else null
  end into v_source_key;

  v_source := case when v_source_key = 'omie_receivables_api' then 'api' else 'none' end;
  v_status := case
    when not v_api_configured then 'not_configured'
    when v_last_status = 'processing' then 'syncing'
    when v_last_status = 'failed' then 'error'
    when v_source_key is null then 'empty'
    when v_last_successful_sync_at is not null
      and v_last_successful_sync_at < timezone('utc', now()) - interval '24 hours' then 'stale'
    when v_last_status = 'partial' then 'stale'
    else 'fresh'
  end;
  v_reason := case v_status
    when 'not_configured' then 'A integração OMIE não está configurada.'
    when 'syncing' then 'A sincronização OMIE está em andamento.'
    when 'error' then 'A última sincronização OMIE falhou.'
    when 'empty' then 'A sincronização OMIE respondeu sem registros válidos.'
    when 'stale' then 'O último snapshot OMIE válido está desatualizado.'
    else 'Snapshot OMIE válido disponível.'
  end;

  with book as (
    select r.*
    from public.analytics_finance_receivables r
    where v_source_key is not null
      and r.source_key = v_source_key
      and r.is_current
      and (nullif(trim(p_client_query), '') is null or r.client_name ilike '%' || trim(p_client_query) || '%')
  ),
  filtered as (
    select b.* from book b
    where (p_from is null or coalesce(b.due_date, b.issued_date) >= p_from)
      and (p_to is null or coalesce(b.due_date, b.issued_date) <= p_to)
      and (nullif(trim(p_status), '') is null or b.status_original = trim(p_status))
      and (nullif(trim(p_aging_bucket), '') is null or b.aging_bucket = trim(p_aging_bucket))
  ),
  open_book as (
    select * from book where balance > 0
  ),
  cs_book as (
    select
      o.balance,
      o.aging_bucket,
      exists (
        select 1 from public.hubspot_companies c
        where nullif(regexp_replace(coalesce(o.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
          and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(o.client_tax_id, ''), '[^0-9]', '', 'g')
      ) as matched,
      (
        select c.client_status from public.hubspot_companies c
        where nullif(regexp_replace(coalesce(o.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
          and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(o.client_tax_id, ''), '[^0-9]', '', 'g')
        limit 1
      ) as client_status
    from open_book o
  ),
  kpis as (
    select
      count(*)::integer as total_titles,
      coalesce(sum(net_amount), 0)::numeric as net_amount,
      coalesce(sum(received_amount), 0)::numeric as received_amount,
      coalesce(sum(balance), 0)::numeric as balance,
      case when coalesce(sum(net_amount), 0) = 0 then 0 else round(coalesce(sum(received_amount), 0) / sum(net_amount) * 100, 1) end as received_rate
    from filtered
  ),
  book_kpis as (
    select
      count(*) filter (where balance > 0)::integer as open_titles,
      coalesce(sum(balance), 0)::numeric as open_balance,
      count(*) filter (where aging_bucket = 'atrasado')::integer as overdue_titles,
      coalesce(sum(balance) filter (where aging_bucket = 'atrasado'), 0)::numeric as overdue_balance,
      case when coalesce(sum(balance), 0) = 0 then 0 else round(coalesce(sum(balance) filter (where aging_bucket = 'atrasado'), 0) / sum(balance) * 100, 1) end as overdue_rate,
      coalesce(round(avg(current_date - due_date) filter (where aging_bucket = 'atrasado' and due_date is not null), 0), 0)::integer as avg_days_overdue,
      coalesce(sum(balance) filter (where aging_bucket in ('a_vencer', 'vence_hoje') and due_date is not null and due_date <= current_date + 30), 0)::numeric as due_30,
      coalesce(sum(balance) filter (where aging_bucket in ('a_vencer', 'vence_hoje') and due_date is not null and due_date <= current_date + 60), 0)::numeric as due_60,
      coalesce(sum(balance) filter (where aging_bucket in ('a_vencer', 'vence_hoje') and due_date is not null and due_date <= current_date + 90), 0)::numeric as due_90
    from book
  ),
  by_status as (
    select jsonb_agg(jsonb_build_object('status', status_original, 'titles', titles, 'balance', balance) order by titles desc) value
    from (select status_original, count(*)::integer titles, coalesce(sum(balance), 0)::numeric balance from filtered group by status_original) x
  ),
  by_aging as (
    select jsonb_agg(jsonb_build_object('bucket', aging_bucket, 'titles', titles, 'balance', balance) order by titles desc) value
    from (select aging_bucket, count(*)::integer titles, coalesce(sum(balance), 0)::numeric balance from filtered group by aging_bucket) x
  ),
  aging_days as (
    select jsonb_agg(jsonb_build_object('bucket', bucket, 'titles', titles, 'balance', balance) order by ord) value
    from (
      select bucket, min(ord) ord, count(*)::integer titles, coalesce(sum(balance), 0)::numeric balance
      from (
        select
          case
            when aging_bucket <> 'atrasado' or due_date is null then 'A vencer'
            when current_date - due_date <= 30 then '1-30 dias'
            when current_date - due_date <= 60 then '31-60 dias'
            when current_date - due_date <= 90 then '61-90 dias'
            else '90+ dias'
          end as bucket,
          case
            when aging_bucket <> 'atrasado' or due_date is null then 0
            when current_date - due_date <= 30 then 1
            when current_date - due_date <= 60 then 2
            when current_date - due_date <= 90 then 3
            else 4
          end as ord,
          balance
        from open_book
      ) t
      group by bucket
    ) x
  ),
  monthly as (
    select jsonb_agg(jsonb_build_object('month', month_start, 'titles', titles, 'balance', balance) order by month_start) value
    from (
      select date_trunc('month', coalesce(due_date, issued_date))::date month_start, count(*)::integer titles, coalesce(sum(balance), 0)::numeric balance
      from filtered where coalesce(due_date, issued_date) is not null group by 1
    ) x
  ),
  projection as (
    select jsonb_agg(jsonb_build_object('month', month_start, 'titles', titles, 'balance', balance) order by month_start) value
    from (
      select date_trunc('month', due_date)::date month_start, count(*)::integer titles, coalesce(sum(balance), 0)::numeric balance
      from open_book where due_date is not null and due_date >= current_date group by 1
    ) x
  ),
  by_category as (
    select jsonb_agg(jsonb_build_object('key', key, 'titles', titles, 'balance', balance) order by balance desc) value
    from (
      select coalesce(nullif(raw_payload->>'codigo_categoria', ''), 'Sem categoria') key, count(*)::integer titles, coalesce(sum(balance), 0)::numeric balance
      from open_book group by 1 order by balance desc limit 12
    ) x
  ),
  top_debtors as (
    select jsonb_agg(jsonb_build_object('client', client, 'tax_id', tax_id, 'titles', titles, 'balance', balance) order by balance desc) value
    from (
      select coalesce(client_name, '(sem nome)') client, max(client_tax_id) tax_id, count(*)::integer titles, coalesce(sum(balance), 0)::numeric balance
      from open_book group by client_name order by balance desc limit 10
    ) x
  ),
  cs_by_status as (
    select jsonb_agg(jsonb_build_object('key', key, 'titles', titles, 'balance', balance, 'overdue_balance', overdue_balance) order by balance desc) value
    from (
      select
        coalesce(nullif(client_status, ''), case when matched then 'Sem status CS' else 'Sem empresa no HubSpot' end) key,
        count(*)::integer titles,
        coalesce(sum(balance), 0)::numeric balance,
        coalesce(sum(balance) filter (where aging_bucket = 'atrasado'), 0)::numeric overdue_balance
      from cs_book group by 1 order by balance desc limit 12
    ) x
  ),
  cs_summary as (
    select
      coalesce(sum(balance) filter (where matched), 0)::numeric as matched_balance,
      coalesce(sum(balance) filter (where not matched), 0)::numeric as unmatched_balance
    from cs_book
  )
  select jsonb_build_object(
    'source', v_source,
    'status', v_status,
    'reason', v_reason,
    'last_successful_sync_at', v_last_successful_sync_at,
    'stale_after_minutes', 1440,
    'sync_run_id', v_last_sync_run_id,
    'kpis', coalesce((select to_jsonb(kpis) from kpis), '{}'::jsonb) || coalesce((select to_jsonb(book_kpis) from book_kpis), '{}'::jsonb),
    'by_status', coalesce((select value from by_status), '[]'::jsonb),
    'by_aging', coalesce((select value from by_aging), '[]'::jsonb),
    'aging_days', coalesce((select value from aging_days), '[]'::jsonb),
    'monthly', coalesce((select value from monthly), '[]'::jsonb),
    'projection', coalesce((select value from projection), '[]'::jsonb),
    'by_category', coalesce((select value from by_category), '[]'::jsonb),
    'top_debtors', coalesce((select value from top_debtors), '[]'::jsonb),
    'cs_reconciliation', jsonb_build_object(
      'matched_balance', (select matched_balance from cs_summary),
      'unmatched_balance', (select unmatched_balance from cs_summary),
      'by_client_status', coalesce((select value from cs_by_status), '[]'::jsonb)
    )
  ) into result;

  return result;
end;
$$;

comment on function public.rpc_analytics_finance_snapshot(date, date, text, text, text) is
  'Cockpit financeiro: somente snapshot OMIE API publicado; planilhas permanecem históricas e não são fallback. Expõe estado de configuração, execução, frescor e vazio.';

revoke all on function public.rpc_analytics_finance_snapshot(date, date, text, text, text) from public, anon;
grant execute on function public.rpc_analytics_finance_snapshot(date, date, text, text, text) to authenticated, service_role;

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
    'fallback', 'Planilhas históricas não alimentam o Dashboard financeiro; configure e sincronize o OMIE API.'
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

create or replace function public.rpc_analytics_finance_unmatched_clients(
  p_client_query text default null,
  p_limit integer default 100
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

  with grouped as (
    select
      coalesce(f.client_name, '(sem nome)') client,
      max(f.client_tax_id) tax_id,
      max(f.client_trade_name) trade_name,
      count(*)::integer titles,
      coalesce(sum(f.balance), 0)::numeric balance,
      coalesce(sum(f.balance) filter (where f.aging_bucket = 'atrasado'), 0)::numeric overdue_balance,
      nullif(regexp_replace(upper(coalesce(f.client_name, '')), '(\s+(LTDA|EIRELI|ME|EPP|S/?A|S\.?A\.?)\b.*)$', ''), '') core_name,
      nullif(regexp_replace(upper(coalesce(f.client_trade_name, '')), '(\s+(LTDA|EIRELI|ME|EPP|S/?A|S\.?A\.?)\b.*)$', ''), '') core_trade
    from public.analytics_finance_receivables f
    where f.source_key = 'omie_receivables_api'
      and f.is_current
      and f.balance > 0
      and (nullif(trim(p_client_query), '') is null or f.client_name ilike '%' || trim(p_client_query) || '%')
      and not exists (
        select 1 from public.hubspot_companies c
        where nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
          and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g')
      )
    group by f.client_name, f.client_trade_name
    order by balance desc
    limit greatest(least(coalesce(p_limit, 100), 500), 1)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'client', client,
      'tax_id', tax_id,
      'trade_name', trade_name,
      'titles', titles,
      'balance', balance,
      'overdue_balance', overdue_balance,
      'name_matches', name_matches
    ) order by balance desc), '[]'::jsonb)
  into result
  from (
    select g.*, (
      select count(*) from public.hubspot_companies c
      where (g.core_name is not null and length(g.core_name) >= 4 and upper(coalesce(c.name, '')) like '%' || g.core_name || '%')
         or (g.core_trade is not null and length(g.core_trade) >= 4 and upper(coalesce(c.name, '')) like '%' || g.core_trade || '%')
    )::integer name_matches
    from grouped g
  ) y;

  return result;
end;
$$;

comment on function public.rpc_analytics_finance_unmatched_clients(text, integer) is
  'Clientes OMIE atuais sem empresa correspondente no HubSpot por CNPJ. Planilhas históricas não são fallback. Somente leitura.';

revoke all on function public.rpc_analytics_finance_unmatched_clients(text, integer) from public, anon;
grant execute on function public.rpc_analytics_finance_unmatched_clients(text, integer) to authenticated, service_role;
