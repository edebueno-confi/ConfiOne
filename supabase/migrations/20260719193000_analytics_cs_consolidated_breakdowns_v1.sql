-- Consolida categorias repetidas entre pipelines no retorno do snapshot CS.
-- A decomposicao por pipeline permanece no payload para explicar a origem.

drop function if exists public.rpc_analytics_cs_snapshot(date, date, text, text, text[]);

create or replace function public.rpc_analytics_cs_snapshot(
  p_from date,
  p_to date,
  p_stage_id text,
  p_priority text,
  p_excluded_pipeline_ids text[]
)
returns jsonb
language sql stable security definer set search_path = ''
as $$
with cfg as (
  select hubspot_pipeline_id as pipeline_id, label as pipeline_label from public.analytics_source_config
  where domain_key = 'cs' and object_type = 'ticket' and is_active
), scoped as (
  select t.*, cfg.pipeline_label, coalesce(s.is_closed, false) is_closed, s.label stage_label, s.display_order, s.is_closed stage_is_closed
  from public.hubspot_tickets t join cfg on cfg.pipeline_id = t.pipeline_id
  left join public.hubspot_pipeline_stages s on s.object_type = 'ticket' and s.pipeline_id = t.pipeline_id and s.stage_id = t.pipeline_stage
  where (p_excluded_pipeline_ids is null or t.pipeline_id <> all(p_excluded_pipeline_ids))
    and (p_from is null or t.hs_created_at >= p_from::timestamptz)
    and (p_to is null or t.hs_created_at < (p_to + 1)::timestamptz)
    and (p_stage_id is null or t.pipeline_stage = any(string_to_array(p_stage_id, ',')))
    and (p_priority is null or t.priority = p_priority)
), kpis as (
  select count(*)::integer total_tickets, count(*) filter (where not is_closed)::integer open_tickets, count(*) filter (where is_closed)::integer closed_tickets,
    case when count(*) > 0 then round(count(*) filter (where is_closed)::numeric / count(*)::numeric, 4) else 0 end closed_rate from scoped
), status_by_pipeline as (
  select coalesce(stage_label, 'Status sem rotulo') label, pipeline_id, pipeline_label, coalesce(pipeline_stage, '') stage_id,
    coalesce(display_order, 0) display_order, coalesce(stage_is_closed, false) is_closed, count(*)::integer ticket_count
  from scoped group by coalesce(stage_label, 'Status sem rotulo'), pipeline_id, pipeline_label, coalesce(pipeline_stage, ''), coalesce(display_order, 0), coalesce(stage_is_closed, false)
), statuses as (
  select label, coalesce(string_agg(distinct nullif(stage_id, ''), ',' order by nullif(stage_id, '')), '') stage_id,
    min(display_order)::integer display_order, bool_and(is_closed) is_closed, sum(ticket_count)::integer ticket_count,
    coalesce(jsonb_agg(jsonb_build_object('pipeline_id', pipeline_id, 'pipeline_label', pipeline_label, 'stage_id', stage_id, 'ticket_count', ticket_count) order by ticket_count desc, pipeline_label), '[]'::jsonb) pipeline_breakdown
  from status_by_pipeline group by label
), monthly as (
  select coalesce(created.month_start, closed.month_start) month_start, coalesce(created.created_count, 0) created_count, coalesce(closed.closed_count, 0) closed_count
  from (select date_trunc('month', hs_created_at)::date month_start, count(*)::integer created_count from scoped where hs_created_at is not null group by 1) created
  full outer join (select date_trunc('month', hs_closed_at)::date month_start, count(*)::integer closed_count from scoped where hs_closed_at is not null group by 1) closed using (month_start)
), sources as (
  select coalesce(nullif(source_type, ''), 'Sem fonte') label, count(*)::integer ticket_count from scoped group by 1 order by ticket_count desc
), pipeline_sources as (
  select pipeline_id, coalesce(nullif(source_type, ''), 'Sem fonte') source_label, count(*)::integer ticket_count from scoped group by pipeline_id, source_label
), pipelines as (
  select s.pipeline_label label, s.pipeline_id, count(*)::integer ticket_count,
    coalesce((select jsonb_agg(jsonb_build_object('label', ps.source_label, 'ticket_count', ps.ticket_count) order by ps.ticket_count desc, ps.source_label) from pipeline_sources ps where ps.pipeline_id = s.pipeline_id), '[]'::jsonb) source_summary
  from scoped s group by s.pipeline_label, s.pipeline_id order by ticket_count desc
), owner_by_pipeline as (
  select coalesce(nullif(o.full_name, ''), nullif(o.email, ''), 'Sem responsavel') owner_name,
    case when count(distinct nullif(s.owner_id, '')) = 1 then min(nullif(s.owner_id, '')) else null end owner_id,
    s.pipeline_id, s.pipeline_label, count(*)::integer ticket_count
  from scoped s left join public.hubspot_owners o on o.owner_id = s.owner_id group by owner_name, s.pipeline_id, s.pipeline_label
), owners as (
  select owner_name, case when count(distinct nullif(owner_id, '')) = 1 then min(nullif(owner_id, '')) else null end owner_id, sum(ticket_count)::integer ticket_count,
    coalesce(jsonb_agg(jsonb_build_object('pipeline_id', pipeline_id, 'pipeline_label', pipeline_label, 'ticket_count', ticket_count) order by ticket_count desc, pipeline_label), '[]'::jsonb) pipeline_breakdown
  from owner_by_pipeline group by owner_name
)
select case when app_private.can_read_analytics() then jsonb_build_object(
  'kpis', (select to_jsonb(kpis) from kpis),
  'by_status', coalesce((select jsonb_agg(to_jsonb(statuses) order by display_order, label) from statuses), '[]'::jsonb),
  'monthly', coalesce((select jsonb_agg(to_jsonb(monthly) order by month_start) from monthly), '[]'::jsonb),
  'by_source', coalesce((select jsonb_agg(to_jsonb(sources) order by ticket_count desc) from sources), '[]'::jsonb),
  'by_pipeline', coalesce((select jsonb_agg(to_jsonb(pipelines) order by ticket_count desc) from pipelines), '[]'::jsonb),
  'by_owner', coalesce((select jsonb_agg(to_jsonb(owners) order by ticket_count desc, owner_name) from owners), '[]'::jsonb),
  'latest_ticket_created_at', (select max(hs_created_at) from scoped)
) else '{}'::jsonb end;
$$;

revoke all on function public.rpc_analytics_cs_snapshot(date, date, text, text, text[]) from public, anon;
grant execute on function public.rpc_analytics_cs_snapshot(date, date, text, text, text[]) to authenticated, service_role;

comment on function public.rpc_analytics_cs_snapshot(date, date, text, text, text[]) is
  'Snapshot CS com status e responsaveis consolidados entre pipelines e decomposicao por pipeline para explicacao.';
