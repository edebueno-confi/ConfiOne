-- Visão executiva V2: reconciliação OMIE x empresas HubSpot e alertas acionáveis.

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
with commercial_cfg as (
  select hubspot_pipeline_id as pipeline_id from public.analytics_source_config
  where domain_key = 'commercial' and object_type = 'deal' and is_active limit 1
), commercial as (
  select d.*, coalesce(s.is_won, false) as is_won, coalesce(s.is_closed, false) as is_closed
  from public.hubspot_deals d join commercial_cfg c on c.pipeline_id = d.pipeline_id
  left join public.hubspot_pipeline_stages s on s.object_type = 'deal' and s.pipeline_id = d.pipeline_id and s.stage_id = d.dealstage
  where (p_from is null or d.hs_created_at >= p_from::timestamptz)
    and (p_to is null or d.hs_created_at < (p_to + 1)::timestamptz)
), support_cfg as (
  select hubspot_pipeline_id as pipeline_id from public.analytics_source_config
  where domain_key = 'cs' and object_type = 'ticket' and is_active limit 1
), support as (
  select t.*, coalesce(s.is_closed, false) as is_closed
  from public.hubspot_tickets t join support_cfg c on c.pipeline_id = t.pipeline_id
  left join public.hubspot_pipeline_stages s on s.object_type = 'ticket' and s.pipeline_id = t.pipeline_id and s.stage_id = t.pipeline_stage
  where (p_from is null or t.hs_created_at >= p_from::timestamptz)
    and (p_to is null or t.hs_created_at < (p_to + 1)::timestamptz)
), finance as (
  select r.*, ir.created_at as finance_source_at from public.analytics_finance_receivables r
  left join public.analytics_spreadsheet_import_runs ir on ir.id = r.import_run_id
  -- Na visão CEO, Financeiro é posição em aberto até a data final: títulos
  -- vencidos em meses anteriores continuam compondo o risco atual.
  where (p_to is null or coalesce(r.due_date, r.issued_date) <= p_to)
), matched_finance as (
  select f.*, match.company_id, match.company_name, match.mrr, match.client_status,
    match.contract_status, match.cs_owner_id, match.candidate_count,
    match.cs_owner_name, match.company_synced_at, match.match_confidence, match.match_method
  from finance f
  left join lateral (
    select c.company_id, c.name as company_name, c.mrr, c.client_status,
      c.contract_status, c.cs_owner_id,
      (select o.full_name from public.hubspot_owners o where o.owner_id = c.cs_owner_id limit 1) as cs_owner_name,
      c.synced_at as company_synced_at,
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
    order by case when regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g') and nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null then 0 else 1 end, c.company_id
    limit 1
  ) match on true
), financial_alerts as (
  select
    coalesce(company_id, 'unmatched:' || lower(regexp_replace(coalesce(client_name, 'Sem cliente'), '[^[:alnum:]]', '', 'g'))) as alert_key,
    max(company_id) as company_id,
    max(company_name) as company_name,
    max(client_name) as source_client_name,
    max(cs_owner_id) as cs_owner_id,
    max(cs_owner_name) as cs_owner_name,
    max(mrr) as mrr,
    max(client_status) as client_status,
    max(contract_status) as contract_status,
    sum(balance)::numeric as overdue_balance,
    count(*)::integer as overdue_titles,
    max((current_date - due_date))::integer as max_days_overdue,
    min(due_date) as oldest_due_date,
    max(match_confidence) as match_confidence,
    max(match_method) as match_method,
    max(candidate_count) as candidate_count
  from matched_finance
  where aging_bucket = 'atrasado' and balance > 0
  group by 1
), data_quality as (
  select
    count(*)::integer as finance_titles,
    count(*) filter (where company_id is not null and match_confidence >= 0.8)::integer as matched_finance_titles,
    count(*) filter (where company_id is null)::integer as unmatched_finance_titles,
    count(*) filter (where candidate_count > 1)::integer as ambiguous_finance_titles,
    max(finance_source_at) as finance_source_at,
    (select max(finished_at) from public.hubspot_sync_runs where status = 'success') as hubspot_source_at
  from matched_finance
), payload as (
  select jsonb_build_object(
    'commercial', jsonb_build_object(
      'total_deals', (select count(*) from commercial), 'open_deals', (select count(*) from commercial where not is_closed),
      'won_deals', (select count(*) from commercial where is_won), 'lost_deals', (select count(*) from commercial where is_closed and not is_won),
      'open_pipeline_value', (select coalesce(sum(amount_home), 0) from commercial where not is_closed), 'won_revenue', (select coalesce(sum(amount_home), 0) from commercial where is_won),
      'conversion_rate', (select case when count(*) filter (where is_closed) > 0 then round(count(*) filter (where is_won)::numeric / count(*) filter (where is_closed)::numeric, 4) else 0 end from commercial),
      'avg_ticket', (select case when count(*) filter (where is_won) > 0 then round(coalesce(sum(amount_home) filter (where is_won), 0) / count(*) filter (where is_won), 2) else 0 end from commercial),
      'avg_sales_cycle_days', (select round(avg(extract(epoch from (hs_closed_at - hs_created_at)) / 86400)::numeric, 1) from commercial where is_won and hs_closed_at is not null and hs_created_at is not null),
      'unassigned_deals', (select count(*) from commercial where nullif(owner_id, '') is null)
    ),
    'support', jsonb_build_object(
      'total_tickets', (select count(*) from support), 'open_tickets', (select count(*) from support where not is_closed), 'closed_tickets', (select count(*) from support where is_closed),
      'closed_rate', (select case when count(*) > 0 then round(count(*) filter (where is_closed)::numeric / count(*)::numeric, 4) else 0 end from support),
      'high_priority_open', (select count(*) from support where not is_closed and upper(coalesce(priority, '')) = 'HIGH'),
      'first_response_sla_tracked', (select count(*) from support where nullif(time_to_first_response_sla_status, '') is not null),
      'close_sla_tracked', (select count(*) from support where nullif(time_to_close_sla_status, '') is not null),
      'source_filled', (select count(*) from support where nullif(source_type, '') is not null)
    ),
    'finance', jsonb_build_object(
      'titles', (select count(*) from finance), 'net_amount', (select coalesce(sum(net_amount), 0) from finance), 'balance', (select coalesce(sum(balance), 0) from finance),
      'overdue_titles', (select count(*) from finance where aging_bucket = 'atrasado'), 'overdue_balance', (select coalesce(sum(balance) filter (where aging_bucket = 'atrasado'), 0) from finance),
      'matched_titles', (select matched_finance_titles from data_quality), 'unmatched_titles', (select unmatched_finance_titles from data_quality)
    ),
    'financial_alerts', coalesce((select jsonb_agg(to_jsonb(financial_alerts) order by overdue_balance desc) from financial_alerts), '[]'::jsonb),
    'data_quality', (select to_jsonb(data_quality) from data_quality)
  ) as payload
)
select case when app_private.can_read_analytics() then (select payload from payload) else '{}'::jsonb end;
$$;

comment on function public.rpc_analytics_ceo_snapshot(date, date) is
  'Snapshot executivo com KPIs comerciais, suporte preservado, financeiro e alertas OMIE reconciliados com empresas HubSpot.';
