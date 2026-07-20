-- Otimiza a reconciliação sem alterar o resultado: normalização indexada de
-- CNPJ e nome, e função base sem reconciliação duplicada.

create index if not exists hubspot_companies_tax_id_normalized_idx
  on public.hubspot_companies (regexp_replace(coalesce(tax_id, ''), '[^0-9]', '', 'g'));
create index if not exists hubspot_companies_name_normalized_idx
  on public.hubspot_companies (lower(regexp_replace(coalesce(name, ''), '[^[:alnum:]]', '', 'g')));
create index if not exists analytics_finance_receivables_tax_id_normalized_idx
  on public.analytics_finance_receivables (regexp_replace(coalesce(client_tax_id, ''), '[^0-9]', '', 'g'));
create index if not exists analytics_finance_receivables_name_normalized_idx
  on public.analytics_finance_receivables (lower(regexp_replace(coalesce(client_name, ''), '[^[:alnum:]]', '', 'g')));

-- A função legada é somente uma base interna para o wrapper executivo. A
-- reconciliação acontece uma única vez no wrapper atual.
create or replace function public.rpc_analytics_ceo_snapshot_legacy(
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
)
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
  'finance', '{}'::jsonb
);
$$;
