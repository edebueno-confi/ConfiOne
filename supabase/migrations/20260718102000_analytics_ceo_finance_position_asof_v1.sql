-- Corrige a posição financeira da Visão Executiva: dívida vencida de meses
-- anteriores continua visível até a data final selecionada.

alter function public.rpc_analytics_ceo_snapshot(date, date)
  rename to rpc_analytics_ceo_snapshot_legacy;

revoke all on function public.rpc_analytics_ceo_snapshot_legacy(date, date)
  from public, anon, authenticated, service_role;

create or replace function public.rpc_analytics_ceo_snapshot(
  p_from date default null,
  p_to date default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with base as (
  select public.rpc_analytics_ceo_snapshot_legacy(p_from, p_to) as payload
), finance as (
  select r.*, ir.created_at as finance_source_at
  from public.analytics_finance_receivables r
  left join public.analytics_spreadsheet_import_runs ir on ir.id = r.import_run_id
  where p_to is null or coalesce(r.due_date, r.issued_date) <= p_to
), matched as (
  select f.*, m.company_id, m.company_name, m.mrr, m.client_status,
    m.contract_status, m.cs_owner_id, m.cs_owner_name, m.candidate_count,
    m.match_confidence, m.match_method
  from finance f
  left join lateral (
    select c.company_id, c.name as company_name, c.mrr, c.client_status,
      c.contract_status, c.cs_owner_id,
      (select o.full_name from public.hubspot_owners o where o.owner_id = c.cs_owner_id limit 1) as cs_owner_name,
      count(*) over ()::integer as candidate_count,
      case when nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
        and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g') then 1.0
        when lower(regexp_replace(coalesce(c.name, ''), '[^[:alnum:]]', '', 'g')) = lower(regexp_replace(coalesce(f.client_name, ''), '[^[:alnum:]]', '', 'g')) then 0.8
        else 0.0 end as match_confidence,
      case when nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
        and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g') then 'cnpj'
        when lower(regexp_replace(coalesce(c.name, ''), '[^[:alnum:]]', '', 'g')) = lower(regexp_replace(coalesce(f.client_name, ''), '[^[:alnum:]]', '', 'g')) then 'nome_exato'
        else null end as match_method
    from public.hubspot_companies c
    where (nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
      and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g'))
      or (nullif(trim(coalesce(f.client_name, '')), '') is not null
      and lower(regexp_replace(coalesce(c.name, ''), '[^[:alnum:]]', '', 'g')) = lower(regexp_replace(f.client_name, '[^[:alnum:]]', '', 'g')))
    order by case when nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
      and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g') then 0 else 1 end, c.company_id
    limit 1
  ) m on true
), alerts as (
  select coalesce(company_id, 'unmatched:' || lower(regexp_replace(coalesce(client_name, 'Sem cliente'), '[^[:alnum:]]', '', 'g'))) as alert_key,
    max(company_id) as company_id, max(company_name) as company_name,
    max(client_name) as source_client_name, max(cs_owner_id) as cs_owner_id,
    max(cs_owner_name) as cs_owner_name, max(mrr) as mrr,
    max(client_status) as client_status, max(contract_status) as contract_status,
    sum(balance)::numeric as overdue_balance, count(*)::integer as overdue_titles,
    max((current_date - due_date))::integer as max_days_overdue,
    min(due_date) as oldest_due_date, max(match_confidence) as match_confidence,
    max(match_method) as match_method, max(candidate_count) as candidate_count
  from matched
  where aging_bucket = 'atrasado' and balance > 0
  group by 1
), quality as (
  select count(*)::integer as finance_titles,
    count(*) filter (where company_id is not null and match_confidence >= 0.8)::integer as matched_finance_titles,
    count(*) filter (where company_id is null)::integer as unmatched_finance_titles,
    count(*) filter (where candidate_count > 1)::integer as ambiguous_finance_titles,
    max(finance_source_at) as finance_source_at,
    (select max(finished_at) from public.hubspot_sync_runs where status = 'success') as hubspot_source_at
  from matched
), finance_payload as (
  select jsonb_build_object(
    'titles', (select count(*) from finance),
    'net_amount', (select coalesce(sum(net_amount), 0) from finance),
    'balance', (select coalesce(sum(balance), 0) from finance),
    'overdue_titles', (select count(*) from finance where aging_bucket = 'atrasado'),
    'overdue_balance', (select coalesce(sum(balance) filter (where aging_bucket = 'atrasado'), 0) from finance),
    'matched_titles', (select matched_finance_titles from quality),
    'unmatched_titles', (select unmatched_finance_titles from quality)
  ) as value
)
select case when app_private.can_read_analytics() then
  (select payload from base) || jsonb_build_object(
    'finance', (select value from finance_payload),
    'financial_alerts', coalesce((select jsonb_agg(to_jsonb(alerts) order by overdue_balance desc) from alerts), '[]'::jsonb),
    'data_quality', (select to_jsonb(quality) from quality)
  )
  else '{}'::jsonb end;
$$;

revoke all on function public.rpc_analytics_ceo_snapshot(date, date) from public, anon;
grant execute on function public.rpc_analytics_ceo_snapshot(date, date) to authenticated, service_role;
