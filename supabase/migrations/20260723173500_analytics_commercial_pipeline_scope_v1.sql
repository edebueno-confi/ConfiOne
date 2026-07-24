-- Permite selecionar temporariamente quais pipelines de negocios entram no
-- recorte comercial, sem alterar a configuracao persistida.
-- O catalogo oficial e descoberto pelo hubspot-sync e armazenado em
-- analytics_source_config com o nome original separado do alias interno.

drop function if exists public.rpc_analytics_commercial_snapshot(date, date, text, text, text[]);

create or replace function public.rpc_analytics_commercial_snapshot(
  p_from date,
  p_to date,
  p_owner_id text,
  p_stage_id text,
  p_excluded_pipeline_ids text[]
)
returns jsonb
language sql stable security definer set search_path = ''
as $$
with cfg as (
  select
    hubspot_pipeline_id as pipeline_id,
    coalesce(nullif(btrim(label), ''), nullif(btrim(hubspot_pipeline_label), ''), hubspot_pipeline_id) as pipeline_label
  from public.analytics_source_config
  where domain_key = 'commercial'
    and object_type = 'deal'
    and is_active
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
    and (p_from is null or d.hs_created_at >= p_from::timestamptz)
    and (p_to is null or d.hs_created_at < (p_to + 1)::timestamptz)
    and (p_owner_id is null or d.owner_id = p_owner_id)
    and (p_stage_id is null or d.dealstage = p_stage_id)
), kpis as (
  select
    count(*)::integer as total_deals,
    count(*) filter (where not is_closed)::integer as open_deals,
    count(*) filter (where is_won)::integer as won_deals,
    count(*) filter (where is_closed and not is_won)::integer as lost_deals,
    coalesce(sum(amount_home) filter (where is_won), 0)::numeric as won_revenue,
    case when count(*) filter (where is_closed) > 0
      then round(count(*) filter (where is_won)::numeric / count(*) filter (where is_closed)::numeric, 4)
      else 0 end as conversion_rate,
    case when count(*) filter (where is_won) > 0
      then round(coalesce(sum(amount_home) filter (where is_won), 0)::numeric / count(*) filter (where is_won)::numeric, 2)
      else 0 end as avg_ticket
  from scoped
), funnel as (
  select
    coalesce(stage_label, 'Estagio sem rotulo') as label,
    coalesce(dealstage, '') as stage_id,
    coalesce(display_order, 0) as display_order,
    coalesce(stage_is_won, false) as is_won,
    coalesce(stage_is_closed, false) as is_closed,
    count(*)::integer as deal_count,
    coalesce(sum(amount_home), 0)::numeric as stage_revenue
  from scoped
  group by stage_id, stage_label, display_order, stage_is_won, stage_is_closed
), pipelines as (
  select
    pipeline_id,
    pipeline_label as label,
    count(*)::integer as deal_count,
    count(*) filter (where is_won)::integer as won_count,
    coalesce(sum(amount_home) filter (where is_won), 0)::numeric as won_revenue
  from scoped
  group by pipeline_id, pipeline_label
  order by deal_count desc, pipeline_label
), owners as (
  select
    owner_id,
    owner_name,
    count(*)::integer as deal_count,
    count(*) filter (where is_won)::integer as won_count,
    coalesce(sum(amount_home) filter (where is_won), 0)::numeric as won_revenue
  from scoped
  group by owner_id, owner_name
  order by deal_count desc
), monthly as (
  select
    date_trunc('month', hs_created_at)::date as month_start,
    count(*)::integer as created_count,
    count(*) filter (where is_won)::integer as won_count,
    coalesce(sum(amount_home) filter (where is_won), 0)::numeric as won_revenue
  from scoped
  where hs_created_at is not null
  group by 1
  order by 1
)
select case when app_private.can_read_analytics() then jsonb_build_object(
  'kpis', (select to_jsonb(kpis) from kpis),
  'funnel', coalesce((select jsonb_agg(to_jsonb(funnel) order by display_order, label) from funnel), '[]'::jsonb),
  'by_pipeline', coalesce((select jsonb_agg(to_jsonb(pipelines) order by deal_count desc, label) from pipelines), '[]'::jsonb),
  'by_owner', coalesce((select jsonb_agg(to_jsonb(owners) order by deal_count desc, owner_name) from owners), '[]'::jsonb),
  'monthly', coalesce((select jsonb_agg(to_jsonb(monthly) order by month_start) from monthly), '[]'::jsonb)
) else '{}'::jsonb end;
$$;

revoke all on function public.rpc_analytics_commercial_snapshot(date, date, text, text, text[]) from public, anon;
grant execute on function public.rpc_analytics_commercial_snapshot(date, date, text, text, text[]) to authenticated, service_role;

comment on function public.rpc_analytics_commercial_snapshot(date, date, text, text, text[]) is
  'Snapshot comercial historico filtravel por periodo, responsavel, estagio e exclusao temporaria de pipelines ativos.';

-- Compatibilidade para consumidores antigos que ainda chamam o contrato de
-- quatro argumentos.
create or replace function public.rpc_analytics_commercial_snapshot(
  p_from date default null,
  p_to date default null,
  p_owner_id text default null,
  p_stage_id text default null
)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select public.rpc_analytics_commercial_snapshot(p_from, p_to, p_owner_id, p_stage_id, '{}'::text[]);
$$;

revoke all on function public.rpc_analytics_commercial_snapshot(date, date, text, text) from public, anon;
grant execute on function public.rpc_analytics_commercial_snapshot(date, date, text, text) to authenticated, service_role;
