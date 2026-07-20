-- Analytics: snapshots filtraveis para navegacao historica e analises gerenciais.
-- A agregacao permanece no Postgres; o frontend apenas envia filtros e renderiza o contrato.

create or replace function public.rpc_analytics_commercial_snapshot(
  p_from date default null,
  p_to date default null,
  p_owner_id text default null,
  p_stage_id text default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with cfg as (
    select hubspot_pipeline_id as pipeline_id
    from public.analytics_source_config
    where domain_key = 'commercial' and object_type = 'deal' and is_active
    limit 1
  ),
  scoped as (
    select d.*, coalesce(s.is_won, false) as is_won,
      coalesce(s.is_closed, false) as is_closed,
      s.label as stage_label, s.display_order, s.is_won as stage_is_won,
      s.is_closed as stage_is_closed,
      coalesce(nullif(btrim(o.full_name), ''), o.email, 'Sem responsavel') as owner_name
    from public.hubspot_deals d
    join cfg on cfg.pipeline_id = d.pipeline_id
    left join public.hubspot_pipeline_stages s
      on s.object_type = 'deal' and s.pipeline_id = d.pipeline_id and s.stage_id = d.dealstage
    left join public.hubspot_owners o on o.owner_id = d.owner_id
    where (p_from is null or d.hs_created_at >= p_from::timestamptz)
      and (p_to is null or d.hs_created_at < (p_to + 1)::timestamptz)
      and (p_owner_id is null or d.owner_id = p_owner_id)
      and (p_stage_id is null or d.dealstage = p_stage_id)
  ),
  kpis as (
    select count(*)::integer as total_deals,
      count(*) filter (where not is_closed)::integer as open_deals,
      count(*) filter (where is_won)::integer as won_deals,
      count(*) filter (where is_closed and not is_won)::integer as lost_deals,
      coalesce(sum(amount_home) filter (where is_won), 0)::numeric as won_revenue,
      case when count(*) filter (where is_closed) > 0 then round(count(*) filter (where is_won)::numeric / count(*) filter (where is_closed)::numeric, 4) else 0 end as conversion_rate,
      case when count(*) filter (where is_won) > 0 then round(coalesce(sum(amount_home) filter (where is_won), 0)::numeric / count(*) filter (where is_won)::numeric, 2) else 0 end as avg_ticket
    from scoped
  ),
  funnel as (
    select coalesce(stage_label, 'Estagio sem rotulo') as label,
      coalesce(dealstage, '') as stage_id, coalesce(display_order, 0) as display_order,
      coalesce(stage_is_won, false) as is_won, coalesce(stage_is_closed, false) as is_closed,
      count(*)::integer as deal_count, coalesce(sum(amount_home), 0)::numeric as stage_revenue
    from scoped group by stage_id, stage_label, display_order, stage_is_won, stage_is_closed
    order by display_order
  ),
  owners as (
    select owner_id, owner_name, count(*)::integer as deal_count,
      count(*) filter (where is_won)::integer as won_count,
      coalesce(sum(amount_home) filter (where is_won), 0)::numeric as won_revenue
    from scoped group by owner_id, owner_name order by deal_count desc
  ),
  monthly as (
    select date_trunc('month', hs_created_at)::date as month_start,
      count(*)::integer as created_count,
      count(*) filter (where is_won)::integer as won_count,
      coalesce(sum(amount_home) filter (where is_won), 0)::numeric as won_revenue
    from scoped where hs_created_at is not null group by 1 order by 1
  )
  select case when app_private.can_read_analytics() then jsonb_build_object(
    'kpis', (select to_jsonb(kpis) from kpis),
    'funnel', coalesce((select jsonb_agg(to_jsonb(funnel) order by display_order) from funnel), '[]'::jsonb),
    'by_owner', coalesce((select jsonb_agg(to_jsonb(owners) order by deal_count desc) from owners), '[]'::jsonb),
    'monthly', coalesce((select jsonb_agg(to_jsonb(monthly) order by month_start) from monthly), '[]'::jsonb)
  ) else '{}'::jsonb end;
$$;

create or replace function public.rpc_analytics_cs_snapshot(
  p_from date default null,
  p_to date default null,
  p_stage_id text default null,
  p_priority text default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with cfg as (
    select hubspot_pipeline_id as pipeline_id
    from public.analytics_source_config
    where domain_key = 'cs' and object_type = 'ticket' and is_active
    limit 1
  ),
  scoped as (
    select t.*, coalesce(s.is_closed, false) as is_closed,
      s.label as stage_label, s.display_order, s.is_closed as stage_is_closed
    from public.hubspot_tickets t
    join cfg on cfg.pipeline_id = t.pipeline_id
    left join public.hubspot_pipeline_stages s
      on s.object_type = 'ticket' and s.pipeline_id = t.pipeline_id and s.stage_id = t.pipeline_stage
    where (p_from is null or t.hs_created_at >= p_from::timestamptz)
      and (p_to is null or t.hs_created_at < (p_to + 1)::timestamptz)
      and (p_stage_id is null or t.pipeline_stage = p_stage_id)
      and (p_priority is null or t.priority = p_priority)
  ),
  kpis as (
    select count(*)::integer as total_tickets,
      count(*) filter (where not is_closed)::integer as open_tickets,
      count(*) filter (where is_closed)::integer as closed_tickets,
      case when count(*) > 0 then round(count(*) filter (where is_closed)::numeric / count(*)::numeric, 4) else 0 end as closed_rate
    from scoped
  ),
  statuses as (
    select coalesce(stage_label, 'Status sem rotulo') as label,
      coalesce(pipeline_stage, '') as stage_id, coalesce(display_order, 0) as display_order,
      coalesce(stage_is_closed, false) as is_closed, count(*)::integer as ticket_count
    from scoped group by stage_id, stage_label, display_order, stage_is_closed
    order by display_order
  ),
  monthly as (
    select coalesce(created.month_start, closed.month_start) as month_start,
      coalesce(created.created_count, 0) as created_count,
      coalesce(closed.closed_count, 0) as closed_count
    from (select date_trunc('month', hs_created_at)::date as month_start, count(*)::integer as created_count from scoped where hs_created_at is not null group by 1) created
    full outer join (select date_trunc('month', hs_closed_at)::date as month_start, count(*)::integer as closed_count from scoped where hs_closed_at is not null group by 1) closed using (month_start)
    order by month_start
  )
  select case when app_private.can_read_analytics() then jsonb_build_object(
    'kpis', (select to_jsonb(kpis) from kpis),
    'by_status', coalesce((select jsonb_agg(to_jsonb(statuses) order by display_order) from statuses), '[]'::jsonb),
    'monthly', coalesce((select jsonb_agg(to_jsonb(monthly) order by month_start) from monthly), '[]'::jsonb)
  ) else '{}'::jsonb end;
$$;

revoke all on function public.rpc_analytics_commercial_snapshot(date, date, text, text) from public, anon;
revoke all on function public.rpc_analytics_cs_snapshot(date, date, text, text) from public, anon;
grant execute on function public.rpc_analytics_commercial_snapshot(date, date, text, text) to authenticated, service_role;
grant execute on function public.rpc_analytics_cs_snapshot(date, date, text, text) to authenticated, service_role;

comment on function public.rpc_analytics_commercial_snapshot(date, date, text, text) is 'Snapshot comercial historico filtravel por criacao, responsavel e estagio.';
comment on function public.rpc_analytics_cs_snapshot(date, date, text, text) is 'Snapshot de CS historico filtravel por criacao, status e prioridade.';
