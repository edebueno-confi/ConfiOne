-- ANALYTICS-NATIVE-REOPEN-RATE-V1
--
-- A carga completa passou a trazer `hs_ticket_reopened_at`, mas a RPC de
-- Suporte ainda exigia eventos de historico para declarar a taxa. A propriedade
-- pedida ao HubSpot e preservada no JSON bruto para todos os tickets, inclusive
-- quando nula: essa presenca prova cobertura e permite distinguir "nao reabriu"
-- de "a origem nao informou".

create or replace function public.rpc_analytics_support_kpis_v2(
  p_from date, p_to date, p_pipeline_id text default null, p_priority text default null
)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  v_result jsonb;
  v_version text;
  v_buckets integer[];
  v_classificados integer;
  v_limiar integer := app_private.queue_stagnation_days();
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  select calculation_version, backlog_aging_hours into v_version, v_buckets
  from public.analytics_kpi_settings where id;
  v_version := coalesce(v_version, 'kpi_v1');
  v_buckets := coalesce(v_buckets, array[4, 24, 72, 168]);

  select count(*)::integer into v_classificados
  from public.analytics_source_config
  where object_type = 'ticket' and is_active and not coalesce(is_archived, false)
    and queue_role <> 'a_classificar';

  with scoped as (
    select
      t.ticket_id, t.pipeline_id, t.owner_id, t.source_type, t.priority,
      t.hs_created_at, t.last_activity_at,
      t.time_to_first_response_sla_status, t.time_to_close_sla_status,
      coalesce(s.metadata ->> 'ticketState', '') = 'OPEN' as is_open,
      coalesce(s.metadata ->> 'ticketState', '') = 'CLOSED' as is_closed,
      c.label as pipeline_label, c.hubspot_pipeline_label,
      c.queue_role,
      (v_classificados = 0 or c.queue_role = 'trabalhada') as conta_como_fila,
      r.resolved_at, r.resolution_days, r.resolution_source,
      r.first_response_hours, r.has_history,
      coalesce(t.raw ? 'hs_ticket_reopened_at', false) as has_native_reopen_property,
      coalesce(r.reopened_count, 0) as reopened_count
    from public.hubspot_tickets t
    join public.analytics_source_config c
      on c.object_type = 'ticket' and c.hubspot_pipeline_id = t.pipeline_id
     and c.is_active and not coalesce(c.is_archived, false)
    join public.hubspot_pipeline_stages s
      on s.object_type = 'ticket' and s.pipeline_id = t.pipeline_id and s.stage_id = t.pipeline_stage
    left join public.vw_analytics_ticket_resolution r on r.ticket_id = t.ticket_id
    where (p_pipeline_id is null or t.pipeline_id = p_pipeline_id)
      and (p_priority is null or t.priority = p_priority)
  ),
  coverage as (
    select
      count(*)::integer as total_rows,
      count(*) filter (where is_closed)::integer as closed_rows,
      count(*) filter (where is_closed and resolved_at is not null)::integer as closed_with_date,
      count(*) filter (where first_response_hours is not null)::integer as with_first_response,
      count(*) filter (where has_history)::integer as with_history,
      count(*) filter (where has_history or has_native_reopen_property)::integer as with_reopen_source,
      count(*) filter (where nullif(btrim(coalesce(time_to_first_response_sla_status, '')), '') is not null)::integer as frt_sla_rows,
      count(*) filter (where nullif(btrim(coalesce(time_to_close_sla_status, '')), '') is not null)::integer as close_sla_rows
    from scoped
  ),
  resolution_state as (
    select case when cv.closed_rows = 0 then 'unavailable'
                when cv.closed_with_date = 0 then 'unavailable'
                when cv.closed_with_date < cv.closed_rows then 'partial'
                else 'available' end as state,
           case when cv.closed_rows = 0 then 'no_data_in_period'
                when cv.closed_with_date = 0 then 'ticket_close_date_missing'
                when cv.closed_with_date < cv.closed_rows then 'ticket_close_date_partial'
                else null end as reason
    from coverage cv
  ),
  first_response_state as (
    select case when cv.with_first_response = 0 then 'unavailable'
                when cv.with_first_response < cv.total_rows then 'partial'
                else 'available' end as state,
           case when cv.with_first_response = 0 then 'ticket_first_response_missing'
                when cv.with_first_response < cv.total_rows then 'first_response_partial'
                else null end as reason
    from coverage cv
  ),
  reopen_state as (
    select case when cv.with_reopen_source = 0 then 'awaiting_history'
                when cv.with_reopen_source < cv.total_rows then 'partial'
                else 'available' end as state,
           case when cv.with_reopen_source = 0 then 'reopen_source_missing'
                when cv.with_reopen_source < cv.total_rows then 'reopen_source_partial'
                else null end as reason
    from coverage cv
  ),
  queue_state as (
    select case when v_classificados = 0 then 'partial' else 'available' end as state,
           case when v_classificados = 0 then 'queue_role_unclassified' else null end as reason
  ),
  split_state as (
    select case when v_classificados = 0 then 'unavailable' else 'available' end as state,
           case when v_classificados = 0 then 'queue_role_unclassified' else null end as reason
  ),
  activity_coverage as (
    select count(*) filter (where is_open and conta_como_fila)::integer as open_in_queue,
           count(*) filter (where is_open and conta_como_fila and last_activity_at is not null)::integer as with_activity
    from scoped
  ),
  stagnation_state as (
    select case when ac.open_in_queue = 0 then 'unavailable'
                when ac.with_activity = 0 then 'unavailable'
                when ac.with_activity < ac.open_in_queue then 'partial'
                when v_classificados = 0 then 'partial'
                else 'available' end as state,
           case when ac.open_in_queue = 0 then 'no_data_in_period'
                when ac.with_activity = 0 then 'ticket_last_activity_missing'
                when ac.with_activity < ac.open_in_queue then 'ticket_last_activity_partial'
                when v_classificados = 0 then 'queue_role_unclassified'
                else null end as reason
    from activity_coverage ac
  ),
  backlog as (
    select count(*) filter (where is_open and conta_como_fila)::integer as open_tickets,
           count(*) filter (where is_open and not conta_como_fila)::integer as dormant_tickets,
           round(percentile_cont(0.5) within group (order by extract(epoch from (timezone('utc', now()) - hs_created_at)) / 86400.0) filter (where is_open and conta_como_fila)::numeric, 1) as median_backlog_age_days,
           count(*) filter (where is_open and conta_como_fila and last_activity_at is not null and last_activity_at < now() - make_interval(days => v_limiar))::integer as stagnant_in_queue
    from scoped
  ),
  received as (
    select count(*)::integer as created_tickets from scoped
    where hs_created_at is not null and hs_created_at::date between p_from and p_to
  ),
  resolution as (
    select count(*)::integer as resolved_tickets,
           round(percentile_cont(0.5) within group (order by resolution_days)::numeric, 1) as median_resolution_days,
           round(avg(resolution_days)::numeric, 1) as avg_resolution_days,
           round(percentile_cont(0.9) within group (order by resolution_days)::numeric, 1) as p90_resolution_days,
           count(*) filter (where reopened_count > 0)::integer as reopened_tickets,
           count(*) filter (where resolution_days is not null and resolution_days < 0.0007)::integer as instant_resolutions
    from scoped where resolved_at is not null and resolved_at::date between p_from and p_to
  ),
  first_response as (
    select round(percentile_cont(0.5) within group (order by first_response_hours)::numeric, 2) as median_hours,
           round(avg(first_response_hours)::numeric, 2) as avg_hours,
           round(percentile_cont(0.9) within group (order by first_response_hours)::numeric, 2) as p90_hours
    from scoped where first_response_hours is not null and hs_created_at::date between p_from and p_to
  ),
  aging as (
    select coalesce(jsonb_agg(row_to_json(a) order by a.sort_order), '[]'::jsonb) as payload
    from (
      select bucket, sort_order, count(*)::integer as tickets
      from (
        select case when hours < v_buckets[1] then '< ' || v_buckets[1] || 'h'
                    when hours < v_buckets[2] then v_buckets[1] || '-' || v_buckets[2] || 'h'
                    when hours < v_buckets[3] then v_buckets[2] || 'h-' || (v_buckets[3] / 24) || 'd'
                    when hours < v_buckets[4] then (v_buckets[3] / 24) || '-' || (v_buckets[4] / 24) || 'd'
                    else '> ' || (v_buckets[4] / 24) || 'd' end as bucket,
               case when hours < v_buckets[1] then 1 when hours < v_buckets[2] then 2
                    when hours < v_buckets[3] then 3 when hours < v_buckets[4] then 4 else 5 end as sort_order
        from (select extract(epoch from (timezone('utc', now()) - hs_created_at)) / 3600.0 as hours from scoped where is_open and conta_como_fila and hs_created_at is not null) h
      ) b group by bucket, sort_order
    ) a
  ),
  by_priority as (
    select coalesce(jsonb_agg(row_to_json(p) order by p.open_tickets desc), '[]'::jsonb) as payload
    from (select coalesce(priority, '_unset') as priority, count(*) filter (where is_open)::integer as open_tickets,
                 count(*) filter (where hs_created_at::date between p_from and p_to)::integer as created_tickets,
                 count(*) filter (where resolved_at::date between p_from and p_to)::integer as resolved_tickets
          from scoped group by 1) p
  ),
  by_source as (
    select coalesce(jsonb_agg(row_to_json(s) order by s.open_tickets desc), '[]'::jsonb) as payload
    from (select coalesce(nullif(btrim(coalesce(source_type, '')), ''), '_unset') as source_type,
                 count(*) filter (where is_open)::integer as open_tickets,
                 count(*) filter (where hs_created_at::date between p_from and p_to)::integer as created_tickets
          from scoped group by 1) s
  ),
  by_owner as (
    select coalesce(jsonb_agg(row_to_json(o) order by o.open_tickets desc), '[]'::jsonb) as payload
    from (select coalesce(sc.owner_id, '_unassigned') as owner_id, coalesce(ow.full_name, 'Sem responsavel') as owner_name,
                 count(*) filter (where sc.is_open)::integer as open_tickets,
                 count(*) filter (where sc.hs_created_at::date between p_from and p_to)::integer as created_tickets,
                 count(*) filter (where sc.resolved_at::date between p_from and p_to)::integer as resolved_tickets,
                 round(percentile_cont(0.5) within group (order by sc.resolution_days) filter (where sc.resolved_at::date between p_from and p_to)::numeric, 1) as median_resolution_days
          from scoped sc left join public.hubspot_owners ow on ow.owner_id = sc.owner_id group by 1, 2) o
  ),
  by_pipeline as (
    select coalesce(jsonb_agg(row_to_json(p) order by p.open_tickets desc), '[]'::jsonb) as payload
    from (select pipeline_id, coalesce(pipeline_label, hubspot_pipeline_label, 'Sem nome') as pipeline_label,
                 max(queue_role) as queue_role, count(*) filter (where is_open)::integer as open_tickets,
                 count(*) filter (where hs_created_at::date between p_from and p_to)::integer as created_tickets,
                 count(*) filter (where resolved_at::date between p_from and p_to)::integer as resolved_tickets
          from scoped group by 1, 2) p
  ),
  snapshot_history as (
    select count(distinct snapshot_date)::integer as days
    from public.analytics_kpi_daily_snapshot where metric_key = 'support_backlog_open'
  )
  select jsonb_build_object(
    'meta', jsonb_build_object(
      'source', 'hubspot', 'calculation_version', v_version,
      'freshness_at', (select max(synced_at) from public.hubspot_tickets),
      'period_from', p_from, 'period_to', p_to,
      'coverage_percent', app_private.kpi_ratio(cv.closed_with_date, nullif(cv.closed_rows, 0)),
      'is_partial', cv.closed_with_date < cv.closed_rows or cv.with_first_response < cv.total_rows or cv.with_reopen_source < cv.total_rows or v_classificados = 0,
      'history_days', sh.days, 'classified_pipelines', v_classificados,
      'warning_codes',
        (case when rst.reason is not null then jsonb_build_array(rst.reason) else '[]'::jsonb end)
        || (case when fst.reason is not null then jsonb_build_array(fst.reason) else '[]'::jsonb end)
        || (case when rot.reason is not null then jsonb_build_array(rot.reason) else '[]'::jsonb end)
        || (case when qst.reason is not null then jsonb_build_array(qst.reason) else '[]'::jsonb end)
        || (case when sst.reason is not null and sst.reason <> qst.reason then jsonb_build_array(sst.reason) else '[]'::jsonb end)
    ),
    'kpis', jsonb_build_object(
      'created_tickets', app_private.kpi_entry(rc.created_tickets::numeric, 'ticket_created_at'),
      'open_backlog', app_private.kpi_entry(bl.open_tickets::numeric, 'ticket_state_open_now', qst.state, qst.reason),
      'dormant_backlog', app_private.kpi_entry(case when v_classificados = 0 then null else bl.dormant_tickets::numeric end, 'ticket_state_open_now', sps.state, sps.reason),
      'stagnant_in_queue', app_private.kpi_entry(case when v_classificados = 0 then null else bl.stagnant_in_queue::numeric end, 'ticket_last_activity_at', case when v_classificados = 0 then 'unavailable' else sst.state end, case when v_classificados = 0 then 'queue_role_unclassified' else sst.reason end),
      'instant_resolutions', app_private.kpi_entry(rs.instant_resolutions::numeric, 'ticket_resolved_at', rst.state, rst.reason),
      'median_backlog_age_days', app_private.kpi_entry(bl.median_backlog_age_days, 'ticket_created_at', qst.state, qst.reason),
      'resolved_tickets', app_private.kpi_entry(rs.resolved_tickets::numeric, 'ticket_resolved_at', rst.state, rst.reason),
      'median_time_to_resolution_days', app_private.kpi_entry(rs.median_resolution_days, 'ticket_resolved_at', rst.state, rst.reason),
      'avg_time_to_resolution_days', app_private.kpi_entry(rs.avg_resolution_days, 'ticket_resolved_at', rst.state, rst.reason),
      'p90_time_to_resolution_days', app_private.kpi_entry(rs.p90_resolution_days, 'ticket_resolved_at', rst.state, rst.reason),
      'median_first_response_hours', app_private.kpi_entry(fr.median_hours, 'ticket_first_response_at', fst.state, fst.reason),
      'avg_first_response_hours', app_private.kpi_entry(fr.avg_hours, 'ticket_first_response_at', fst.state, fst.reason),
      'p90_first_response_hours', app_private.kpi_entry(fr.p90_hours, 'ticket_first_response_at', fst.state, fst.reason),
      'reopen_rate', app_private.kpi_entry(app_private.kpi_ratio(rs.reopened_tickets, nullif(rs.resolved_tickets, 0)), 'ticket_reopened_at', rot.state, rot.reason),
      'first_response_sla_coverage_percent', app_private.kpi_entry(app_private.kpi_ratio(cv.frt_sla_rows, nullif(cv.total_rows, 0)), 'ticket_sla_status', case when cv.frt_sla_rows = 0 then 'unavailable' else 'partial' end, case when cv.frt_sla_rows = 0 then 'sla_unavailable' else 'sla_partial_coverage' end),
      'close_sla_coverage_percent', app_private.kpi_entry(app_private.kpi_ratio(cv.close_sla_rows, nullif(cv.total_rows, 0)), 'ticket_sla_status', case when cv.close_sla_rows = 0 then 'unavailable' else 'partial' end, case when cv.close_sla_rows = 0 then 'sla_unavailable' else 'sla_partial_coverage' end),
      'historic_backlog', app_private.kpi_entry(null, 'ticket_state_open_at_date', 'awaiting_history', case when sh.days > 1 then null else 'history_insufficient' end)
    ),
    'aging', ag.payload, 'by_priority', bp.payload, 'by_source', bs.payload,
    'by_owner', bo.payload, 'by_pipeline', bpi.payload,
    'source_coverage', jsonb_build_object(
      'tickets', cv.total_rows, 'closed', cv.closed_rows,
      'closed_with_date', cv.closed_with_date,
      'with_first_response', cv.with_first_response,
      'with_stage_history', cv.with_history,
      'with_reopen_source', cv.with_reopen_source,
      'classified_pipelines', v_classificados)
  ) into v_result
  from coverage cv
  cross join resolution_state rst cross join first_response_state fst
  cross join reopen_state rot cross join queue_state qst
  cross join activity_coverage ac cross join stagnation_state sst
  cross join split_state sps cross join backlog bl cross join received rc cross join resolution rs
  cross join first_response fr cross join aging ag cross join by_priority bp
  cross join by_source bs cross join by_owner bo cross join by_pipeline bpi
  cross join snapshot_history sh;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

alter function public.rpc_analytics_support_kpis_v2(date, date, text, text)
  set work_mem to '16MB';

comment on function public.rpc_analytics_support_kpis_v2(date, date, text, text) is
  'Indicadores de Suporte com fila classificada, cobertura declarada e taxa de reabertura baseada na propriedade nativa do HubSpot quando ela foi ingerida.';

revoke all on function public.rpc_analytics_support_kpis_v2(date, date, text, text) from public, anon;
grant execute on function public.rpc_analytics_support_kpis_v2(date, date, text, text) to authenticated, service_role;
