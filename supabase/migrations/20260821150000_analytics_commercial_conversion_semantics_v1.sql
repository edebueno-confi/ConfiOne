-- Formaliza conversao comercial em pontos percentuais (0 a 100).
-- Numerador e denominador usam a mesma coorte de negocios fechados no periodo.

create or replace function app_private.kpi_ratio(p_numerator numeric, p_denominator numeric)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case
    when p_denominator is null
      or p_denominator <= 0
      or p_numerator is null
      or p_numerator < 0
      or p_numerator > p_denominator then null
    else round((p_numerator / p_denominator) * 100, 2)
  end;
$$;

comment on function app_private.kpi_ratio(numeric, numeric) is
  'Percentual em pontos percentuais, protegido contra denominador invalido e numerador fora do universo. Devolve NULL para ausencia ou dado inconsistente.';

create or replace view public.vw_analytics_commercial_kpis
with (security_barrier = true) as
  with cfg as (
    select hubspot_pipeline_id as pipeline_id
    from public.analytics_source_config
    where domain_key = 'commercial' and object_type = 'deal' and is_active
    limit 1
  ),
  deals as (
    select
      d.deal_id,
      d.amount_home,
      d.hs_closed_at,
      coalesce(s.is_won, false) as is_won,
      coalesce(s.is_closed, false) as is_closed
    from public.hubspot_deals d
    join cfg on cfg.pipeline_id = d.pipeline_id
    left join public.hubspot_pipeline_stages s
      on s.object_type = 'deal'
     and s.pipeline_id = d.pipeline_id
     and s.stage_id = d.dealstage
  )
  select
    count(*)::integer as total_deals,
    count(*) filter (where not is_closed)::integer as open_deals,
    count(*) filter (where is_won)::integer as won_deals,
    count(*) filter (where is_closed and not is_won)::integer as lost_deals,
    coalesce(sum(amount_home) filter (where is_won), 0)::numeric as won_revenue,
    app_private.kpi_ratio(
      count(*) filter (where is_closed and hs_closed_at is not null and is_won),
      count(*) filter (where is_closed and hs_closed_at is not null)
    ) as conversion_rate,
    case
      when count(*) filter (where is_won) > 0
      then round(
        coalesce(sum(amount_home) filter (where is_won), 0)::numeric
        / count(*) filter (where is_won)::numeric, 2)
      else 0
    end as avg_ticket
  from deals
  having app_private.can_read_analytics();

comment on view public.vw_analytics_commercial_kpis is
  'KPIs comerciais v1: conversao em pontos percentuais, calculada como ganhos / negocios fechados no mesmo universo; denominador zero ou universo invalido retorna NULL.';

create or replace function public.rpc_analytics_commercial_snapshot(
  p_from date,
  p_to date,
  p_owner_id text,
  p_stage_id text,
  p_excluded_pipeline_ids text[]
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with cfg as (
  select
    hubspot_pipeline_id as pipeline_id,
    coalesce(nullif(btrim(label), ''), nullif(btrim(hubspot_pipeline_label), ''), hubspot_pipeline_id) as pipeline_label
  from public.analytics_source_config
  where domain_key = 'commercial'
    and object_type = 'deal'
    and is_active
    and not coalesce(is_archived, false)
), scoped as (
  select
    d.*,
    cfg.pipeline_label,
    coalesce(s.is_won, false) as is_won,
    coalesce(s.is_closed, false) as is_closed,
    s.label as stage_label,
    s.display_order,
    s.is_won as stage_is_won,
    s.is_closed as stage_is_closed,
    coalesce(nullif(btrim(o.full_name), ''), o.email, 'Sem responsavel') as owner_name
  from public.hubspot_deals d
  join cfg on cfg.pipeline_id = d.pipeline_id
  left join public.hubspot_pipeline_stages s
    on s.object_type = 'deal'
    and s.pipeline_id = d.pipeline_id
    and s.stage_id = d.dealstage
  left join public.hubspot_owners o on o.owner_id = d.owner_id
  where (coalesce(array_length(p_excluded_pipeline_ids, 1), 0) = 0 or d.pipeline_id <> all(p_excluded_pipeline_ids))
    and (p_owner_id is null or d.owner_id = p_owner_id)
    and (p_stage_id is null or d.dealstage = any(string_to_array(p_stage_id, ',')))
), created_cohort as (
  select *
  from scoped
  where hs_created_at is not null
    and (p_from is null or hs_created_at >= app_private.analytics_period_start(p_from))
    and (p_to is null or hs_created_at < app_private.analytics_period_end_exclusive(p_to))
), closed_cohort as (
  select *
  from scoped
  where is_closed
    and hs_closed_at is not null
    and (p_from is null or hs_closed_at >= app_private.analytics_period_start(p_from))
    and (p_to is null or hs_closed_at < app_private.analytics_period_end_exclusive(p_to))
), kpis as (
  select
    (select count(*)::integer from created_cohort) as total_deals,
    (select count(*)::integer from scoped where not is_closed) as open_deals,
    (select count(*)::integer from closed_cohort where is_won) as won_deals,
    (select count(*)::integer from closed_cohort where not is_won) as lost_deals,
    (select coalesce(sum(amount_home) filter (where is_won), 0)::numeric from closed_cohort) as won_revenue,
    (select app_private.kpi_ratio(
      count(*) filter (where is_won),
      count(*)
    ) from closed_cohort) as conversion_rate,
    (select case when count(*) filter (where is_won) > 0 then round(coalesce(sum(amount_home) filter (where is_won), 0)::numeric / count(*) filter (where is_won)::numeric, 2) else 0 end from closed_cohort) as avg_ticket
), funnel_by_pipeline as (
  select
    coalesce(stage_label, 'Estagio sem rotulo') as label,
    pipeline_id,
    pipeline_label,
    coalesce(dealstage, '') as stage_id,
    coalesce(display_order, 0) as display_order,
    coalesce(stage_is_won, false) as is_won,
    coalesce(stage_is_closed, false) as is_closed,
    count(*)::integer as deal_count,
    coalesce(sum(amount_home), 0)::numeric as stage_revenue
  from scoped
  group by
    coalesce(stage_label, 'Estagio sem rotulo'),
    pipeline_id,
    pipeline_label,
    coalesce(dealstage, ''),
    coalesce(display_order, 0),
    coalesce(stage_is_won, false),
    coalesce(stage_is_closed, false)
), funnel as (
  select
    label,
    stage_id,
    display_order,
    is_won,
    is_closed,
    sum(deal_count)::integer as deal_count,
    sum(stage_revenue)::numeric as stage_revenue,
    coalesce(jsonb_agg(jsonb_build_object(
      'pipeline_id', pipeline_id,
      'pipeline_label', pipeline_label,
      'stage_id', stage_id,
      'deal_count', deal_count
    ) order by deal_count desc, pipeline_label), '[]'::jsonb) as pipeline_breakdown
  from funnel_by_pipeline
  group by label, stage_id, display_order, is_won, is_closed
), pipelines as (
  select
    pipeline_id,
    pipeline_label as label,
    count(*)::integer as deal_count,
    count(*) filter (where is_won)::integer as won_count,
    coalesce(sum(amount_home) filter (where is_won), 0)::numeric as won_revenue
  from scoped
  group by pipeline_id, pipeline_label
), owners as (
  select
    owner_id,
    owner_name,
    count(*)::integer as deal_count,
    count(*) filter (where is_won)::integer as won_count,
    coalesce(sum(amount_home) filter (where is_won), 0)::numeric as won_revenue
  from scoped
  group by owner_id, owner_name
), monthly as (
  select
    date_trunc('month', hs_created_at at time zone 'America/Sao_Paulo')::date as month_start,
    count(*)::integer as created_count,
    count(*) filter (where is_won)::integer as won_count,
    coalesce(sum(amount_home) filter (where is_won), 0)::numeric as won_revenue
  from created_cohort
  where hs_created_at is not null
  group by 1
)
select case when app_private.can_read_analytics() then jsonb_build_object(
  'meta', jsonb_build_object(
    'source', 'hubspot',
    'period_from', p_from,
    'period_to', p_to,
    'cohorts', jsonb_build_object(
      'total_deals', 'created_at',
      'open_deals', 'current_stage',
      'won_deals', 'closed_at',
      'lost_deals', 'closed_at',
      'won_revenue', 'closed_at',
      'conversion_rate', 'closed_at'
    )
  ),
  'kpis', (select to_jsonb(kpis) from kpis),
  'funnel', coalesce((select jsonb_agg(to_jsonb(funnel) order by display_order, label) from funnel), '[]'::jsonb),
  'by_pipeline', coalesce((select jsonb_agg(to_jsonb(pipelines) order by deal_count desc, label) from pipelines), '[]'::jsonb),
  'by_owner', coalesce((select jsonb_agg(to_jsonb(owners) order by deal_count desc, owner_name) from owners), '[]'::jsonb),
  'monthly', coalesce((select jsonb_agg(to_jsonb(monthly) order by month_start) from monthly), '[]'::jsonb)
) else '{}'::jsonb end;
$$;

comment on function public.rpc_analytics_commercial_snapshot(date, date, text, text, text[]) is
  'Snapshot comercial reconciliado: conversao em pontos percentuais, ganhos / negocios fechados na mesma coorte de closed_at; denominador zero ou dados invalidos retornam NULL.';

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
  select hubspot_pipeline_id as pipeline_id
  from public.analytics_source_config
  where domain_key = 'commercial' and object_type = 'deal' and is_active
), commercial_base as (
  select d.*, coalesce(s.is_won, false) as is_won, coalesce(s.is_closed, false) as is_closed
  from public.hubspot_deals d
  join commercial_cfg c on c.pipeline_id = d.pipeline_id
  left join public.hubspot_pipeline_stages s
    on s.object_type = 'deal'
   and s.pipeline_id = d.pipeline_id
   and s.stage_id = d.dealstage
), commercial as (
  select *
  from commercial_base
  where (p_from is null or hs_created_at >= p_from::timestamptz)
    and (p_to is null or hs_created_at < (p_to + 1)::timestamptz)
), closed_commercial as (
  select *
  from commercial_base
  where is_closed
    and hs_closed_at is not null
    and (p_from is null or hs_closed_at >= app_private.analytics_period_start(p_from))
    and (p_to is null or hs_closed_at < app_private.analytics_period_end_exclusive(p_to))
), support_cfg as (
  select hubspot_pipeline_id as pipeline_id, label as pipeline_label
  from public.analytics_source_config
  where domain_key = 'cs' and object_type = 'ticket' and is_active
), support as (
  select t.*, c.pipeline_label, coalesce(s.is_closed, false) as is_closed
  from public.hubspot_tickets t
  join support_cfg c on c.pipeline_id = t.pipeline_id
  left join public.hubspot_pipeline_stages s
    on s.object_type = 'ticket'
   and s.pipeline_id = t.pipeline_id
   and s.stage_id = t.pipeline_stage
  where (p_from is null or t.hs_created_at >= p_from::timestamptz)
    and (p_to is null or t.hs_created_at < (p_to + 1)::timestamptz)
), support_sources as (
  select coalesce(nullif(source_type, ''), 'Sem fonte') as label, count(*)::integer as ticket_count
  from support
  group by 1
), support_pipelines as (
  select pipeline_label as label, pipeline_id, count(*)::integer as ticket_count
  from support
  group by pipeline_label, pipeline_id
), support_owners as (
  select coalesce(nullif(o.full_name, ''), nullif(o.email, ''), 'Sem responsavel') as owner_name,
    s.owner_id, count(*)::integer as ticket_count
  from support s
  left join public.hubspot_owners o on o.owner_id = s.owner_id
  group by s.owner_id, o.full_name, o.email
)
select jsonb_build_object(
  'commercial', jsonb_build_object(
    'total_deals', (select count(*) from commercial),
    'open_deals', (select count(*) from commercial where not is_closed),
    'won_deals', (select count(*) from commercial where is_won),
    'lost_deals', (select count(*) from commercial where is_closed and not is_won),
    'open_pipeline_value', (select coalesce(sum(amount_home), 0) from commercial where not is_closed),
    'won_revenue', (select coalesce(sum(amount_home), 0) from commercial where is_won),
    'conversion_rate', (select app_private.kpi_ratio(
      count(*) filter (where is_won), count(*)
    ) from closed_commercial),
    'avg_ticket', (select case when count(*) filter (where is_won) > 0
      then round(coalesce(sum(amount_home) filter (where is_won), 0) / count(*) filter (where is_won), 2)
      else 0 end from commercial),
    'avg_sales_cycle_days', (select round(avg(extract(epoch from (hs_closed_at - hs_created_at)) / 86400)::numeric, 1)
      from commercial where is_won and hs_closed_at is not null and hs_created_at is not null),
    'unassigned_deals', (select count(*) from commercial where nullif(owner_id, '') is null)
  ),
  'support', jsonb_build_object(
    'total_tickets', (select count(*) from support),
    'created_tickets', (select count(*) from support),
    'open_tickets', (select count(*) from support where not is_closed),
    'closed_tickets', (select count(*) from support where is_closed),
    'closed_rate', (select case when count(*) > 0 then round(count(*) filter (where is_closed)::numeric / count(*)::numeric, 4) else 0 end from support),
    'high_priority_open', (select count(*) from support where not is_closed and upper(coalesce(priority, '')) = 'HIGH'),
    'first_response_sla_tracked', (select count(*) from support where nullif(time_to_first_response_sla_status, '') is not null),
    'close_sla_tracked', (select count(*) from support where nullif(time_to_close_sla_status, '') is not null),
    'source_filled', (select count(*) from support where nullif(source_type, '') is not null),
    'by_source', coalesce((select jsonb_agg(to_jsonb(s) order by s.ticket_count desc) from support_sources s), '[]'::jsonb),
    'by_pipeline', coalesce((select jsonb_agg(to_jsonb(s) order by s.ticket_count desc) from support_pipelines s), '[]'::jsonb),
    'by_owner', coalesce((select jsonb_agg(to_jsonb(s) order by s.ticket_count desc) from support_owners s), '[]'::jsonb),
    'latest_ticket_created_at', (select max(hs_created_at) from support)
  ),
  'finance', '{}'::jsonb
);
$$;
