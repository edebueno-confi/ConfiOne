-- ANALYTICS-KPI-READ-MODELS-V3
--
-- Consolida os read models sobre as fontes nativas confirmadas pela sondagem da
-- API em 2026-08-07, que se mostraram muito melhores do que a reconstrução por
-- histórico prevista na versão anterior.
--
-- Passam a ter fonte real:
--   - tickets resolvidos e tempo de resolução, pela data nativa de encerramento;
--   - tempo de primeira resposta, por duração nativa medida em horas úteis;
--   - clientes sem interação recente, pela última interação registrada.
--
-- O histórico de estágio continua ingerido, mas deixa de ser pré-requisito:
-- vira reforço para tickets sem data nativa e fonte única de reabertura.
--
-- A regra de estado continua a mesma: cada KPI acompanha a cobertura medida em
-- tempo de consulta. Sem ingestão, indisponível. Parcial enquanto carrega.

-- ---------------------------------------------------------------------------
-- Suporte
-- ---------------------------------------------------------------------------

create or replace function public.rpc_analytics_support_kpis_v2(
  p_from date,
  p_to date,
  p_pipeline_id text default null,
  p_priority text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_version text;
  v_buckets integer[];
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  select calculation_version, backlog_aging_hours
    into v_version, v_buckets
  from public.analytics_kpi_settings where id;
  v_version := coalesce(v_version, 'kpi_v1');
  v_buckets := coalesce(v_buckets, array[4, 24, 72, 168]);

  with scoped as (
    select
      t.ticket_id, t.pipeline_id, t.owner_id, t.source_type, t.priority,
      t.hs_created_at,
      t.time_to_first_response_sla_status,
      t.time_to_close_sla_status,
      coalesce(s.metadata ->> 'ticketState', '') = 'OPEN' as is_open,
      coalesce(s.metadata ->> 'ticketState', '') = 'CLOSED' as is_closed,
      c.label as pipeline_label,
      c.hubspot_pipeline_label,
      r.resolved_at,
      r.resolution_days,
      r.resolution_source,
      r.first_response_hours,
      r.has_history,
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
      count(*) filter (
        where nullif(btrim(coalesce(time_to_first_response_sla_status, '')), '') is not null
      )::integer as frt_sla_rows,
      count(*) filter (
        where nullif(btrim(coalesce(time_to_close_sla_status, '')), '') is not null
      )::integer as close_sla_rows
    from scoped
  ),
  -- Estado dos indicadores de resolução, pela cobertura de data de encerramento
  -- entre os tickets que estão de fato encerrados.
  resolution_state as (
    select
      case
        when cv.closed_rows = 0 then 'unavailable'
        when cv.closed_with_date = 0 then 'unavailable'
        when cv.closed_with_date < cv.closed_rows then 'partial'
        else 'available'
      end as state,
      case
        when cv.closed_rows = 0 then 'no_data_in_period'
        when cv.closed_with_date = 0 then 'ticket_close_date_missing'
        when cv.closed_with_date < cv.closed_rows then 'ticket_close_date_partial'
        else null
      end as reason
    from coverage cv
  ),
  first_response_state as (
    select
      case
        when cv.with_first_response = 0 then 'unavailable'
        when cv.with_first_response < cv.total_rows then 'partial'
        else 'available'
      end as state,
      case
        when cv.with_first_response = 0 then 'ticket_first_response_missing'
        when cv.with_first_response < cv.total_rows then 'first_response_partial'
        else null
      end as reason
    from coverage cv
  ),
  -- Reabertura continua dependendo do histórico de estágio: a propriedade
  -- nativa informa quando encerrou, nunca quantas vezes reabriu.
  reopen_state as (
    select
      case
        when cv.with_history = 0 then 'awaiting_history'
        when cv.with_history < cv.total_rows then 'partial'
        else 'available'
      end as state,
      case
        when cv.with_history = 0 then 'history_insufficient'
        when cv.with_history < cv.total_rows then 'ticket_history_partial'
        else null
      end as reason
    from coverage cv
  ),
  backlog as (
    select
      count(*) filter (where is_open)::integer as open_tickets,
      round(percentile_cont(0.5) within group (
        order by extract(epoch from (timezone('utc', now()) - hs_created_at)) / 86400.0
      ) filter (where is_open)::numeric, 1) as median_backlog_age_days
    from scoped
  ),
  received as (
    select count(*)::integer as created_tickets
    from scoped
    where hs_created_at is not null and hs_created_at::date between p_from and p_to
  ),
  resolution as (
    select
      count(*)::integer as resolved_tickets,
      round(percentile_cont(0.5) within group (order by resolution_days)::numeric, 1) as median_resolution_days,
      round(avg(resolution_days)::numeric, 1) as avg_resolution_days,
      round(percentile_cont(0.9) within group (order by resolution_days)::numeric, 1) as p90_resolution_days,
      count(*) filter (where reopened_count > 0)::integer as reopened_tickets
    from scoped
    where resolved_at is not null and resolved_at::date between p_from and p_to
  ),
  first_response as (
    select
      round(percentile_cont(0.5) within group (order by first_response_hours)::numeric, 2) as median_hours,
      round(avg(first_response_hours)::numeric, 2) as avg_hours,
      round(percentile_cont(0.9) within group (order by first_response_hours)::numeric, 2) as p90_hours
    from scoped
    where first_response_hours is not null
      and hs_created_at::date between p_from and p_to
  ),
  aging as (
    select coalesce(jsonb_agg(row_to_json(a) order by a.sort_order), '[]'::jsonb) as payload
    from (
      select bucket, sort_order, count(*)::integer as tickets
      from (
        select
          case
            when hours < v_buckets[1] then '< ' || v_buckets[1] || 'h'
            when hours < v_buckets[2] then v_buckets[1] || '-' || v_buckets[2] || 'h'
            when hours < v_buckets[3] then v_buckets[2] || 'h-' || (v_buckets[3] / 24) || 'd'
            when hours < v_buckets[4] then (v_buckets[3] / 24) || '-' || (v_buckets[4] / 24) || 'd'
            else '> ' || (v_buckets[4] / 24) || 'd'
          end as bucket,
          case
            when hours < v_buckets[1] then 1
            when hours < v_buckets[2] then 2
            when hours < v_buckets[3] then 3
            when hours < v_buckets[4] then 4
            else 5
          end as sort_order
        from (
          select extract(epoch from (timezone('utc', now()) - hs_created_at)) / 3600.0 as hours
          from scoped where is_open and hs_created_at is not null
        ) h
      ) b
      group by bucket, sort_order
    ) a
  ),
  by_priority as (
    select coalesce(jsonb_agg(row_to_json(p) order by p.open_tickets desc), '[]'::jsonb) as payload
    from (
      select coalesce(priority, '_unset') as priority,
             count(*) filter (where is_open)::integer as open_tickets,
             count(*) filter (where hs_created_at::date between p_from and p_to)::integer as created_tickets,
             count(*) filter (where resolved_at::date between p_from and p_to)::integer as resolved_tickets
      from scoped group by 1
    ) p
  ),
  by_source as (
    select coalesce(jsonb_agg(row_to_json(s) order by s.open_tickets desc), '[]'::jsonb) as payload
    from (
      select coalesce(nullif(btrim(coalesce(source_type, '')), ''), '_unset') as source_type,
             count(*) filter (where is_open)::integer as open_tickets,
             count(*) filter (where hs_created_at::date between p_from and p_to)::integer as created_tickets
      from scoped group by 1
    ) s
  ),
  by_owner as (
    select coalesce(jsonb_agg(row_to_json(o) order by o.open_tickets desc), '[]'::jsonb) as payload
    from (
      select coalesce(sc.owner_id, '_unassigned') as owner_id,
             coalesce(ow.full_name, 'Sem responsável') as owner_name,
             count(*) filter (where sc.is_open)::integer as open_tickets,
             count(*) filter (where sc.hs_created_at::date between p_from and p_to)::integer as created_tickets,
             count(*) filter (where sc.resolved_at::date between p_from and p_to)::integer as resolved_tickets,
             round(percentile_cont(0.5) within group (order by sc.resolution_days) filter (
               where sc.resolved_at::date between p_from and p_to
             )::numeric, 1) as median_resolution_days
      from scoped sc
      left join public.hubspot_owners ow on ow.owner_id = sc.owner_id
      group by 1, 2
    ) o
  ),
  by_pipeline as (
    select coalesce(jsonb_agg(row_to_json(p) order by p.open_tickets desc), '[]'::jsonb) as payload
    from (
      select pipeline_id,
             coalesce(pipeline_label, hubspot_pipeline_label, 'Sem nome') as pipeline_label,
             count(*) filter (where is_open)::integer as open_tickets,
             count(*) filter (where hs_created_at::date between p_from and p_to)::integer as created_tickets,
             count(*) filter (where resolved_at::date between p_from and p_to)::integer as resolved_tickets
      from scoped group by 1, 2
    ) p
  ),
  snapshot_history as (
    select count(distinct snapshot_date)::integer as days
    from public.analytics_kpi_daily_snapshot where metric_key = 'support_backlog_open'
  )
  select jsonb_build_object(
    'meta', jsonb_build_object(
      'source', 'hubspot',
      'calculation_version', v_version,
      'freshness_at', (select max(synced_at) from public.hubspot_tickets),
      'period_from', p_from,
      'period_to', p_to,
      'coverage_percent', app_private.kpi_ratio(cv.closed_with_date, nullif(cv.closed_rows, 0)),
      'is_partial', cv.closed_with_date < cv.closed_rows or cv.with_first_response < cv.total_rows,
      'history_days', sh.days,
      'warning_codes',
        (case when rst.reason is not null then jsonb_build_array(rst.reason) else '[]'::jsonb end)
        || (case when fst.reason is not null then jsonb_build_array(fst.reason) else '[]'::jsonb end)
    ),
    'kpis', jsonb_build_object(
      'created_tickets', app_private.kpi_entry(rc.created_tickets::numeric, 'ticket_created_at'),
      'open_backlog', app_private.kpi_entry(bl.open_tickets::numeric, 'ticket_state_open_now'),
      'median_backlog_age_days', app_private.kpi_entry(bl.median_backlog_age_days, 'ticket_created_at'),
      'resolved_tickets', app_private.kpi_entry(
        rs.resolved_tickets::numeric, 'ticket_resolved_at', rst.state, rst.reason
      ),
      'median_time_to_resolution_days', app_private.kpi_entry(
        rs.median_resolution_days, 'ticket_resolved_at', rst.state, rst.reason
      ),
      'avg_time_to_resolution_days', app_private.kpi_entry(
        rs.avg_resolution_days, 'ticket_resolved_at', rst.state, rst.reason
      ),
      'p90_time_to_resolution_days', app_private.kpi_entry(
        rs.p90_resolution_days, 'ticket_resolved_at', rst.state, rst.reason
      ),
      'median_first_response_hours', app_private.kpi_entry(
        fr.median_hours, 'ticket_first_response_at', fst.state, fst.reason
      ),
      'avg_first_response_hours', app_private.kpi_entry(
        fr.avg_hours, 'ticket_first_response_at', fst.state, fst.reason
      ),
      'p90_first_response_hours', app_private.kpi_entry(
        fr.p90_hours, 'ticket_first_response_at', fst.state, fst.reason
      ),
      'reopen_rate', app_private.kpi_entry(
        app_private.kpi_ratio(rs.reopened_tickets, nullif(rs.resolved_tickets, 0)),
        'ticket_stage_transition', rot.state, rot.reason
      ),
      'first_response_sla_coverage_percent', app_private.kpi_entry(
        app_private.kpi_ratio(cv.frt_sla_rows, nullif(cv.total_rows, 0)),
        'ticket_sla_status',
        case when cv.frt_sla_rows = 0 then 'unavailable' else 'partial' end,
        case when cv.frt_sla_rows = 0 then 'sla_unavailable' else 'sla_partial_coverage' end
      ),
      'close_sla_coverage_percent', app_private.kpi_entry(
        app_private.kpi_ratio(cv.close_sla_rows, nullif(cv.total_rows, 0)),
        'ticket_sla_status',
        case when cv.close_sla_rows = 0 then 'unavailable' else 'partial' end,
        case when cv.close_sla_rows = 0 then 'sla_unavailable' else 'sla_partial_coverage' end
      ),
      'historic_backlog', app_private.kpi_entry(
        null, 'ticket_state_open_at_date', 'awaiting_history',
        case when sh.days > 1 then null else 'history_insufficient' end
      )
    ),
    'aging', ag.payload,
    'by_priority', bp.payload,
    'by_source', bs.payload,
    'by_owner', bo.payload,
    'by_pipeline', bpi.payload,
    'source_coverage', jsonb_build_object(
      'tickets', cv.total_rows,
      'closed', cv.closed_rows,
      'closed_with_date', cv.closed_with_date,
      'with_first_response', cv.with_first_response,
      'with_stage_history', cv.with_history
    )
  )
  into v_result
  from coverage cv
  cross join resolution_state rst
  cross join first_response_state fst
  cross join reopen_state rot
  cross join backlog bl
  cross join received rc
  cross join resolution rs
  cross join first_response fr
  cross join aging ag
  cross join by_priority bp
  cross join by_source bs
  cross join by_owner bo
  cross join by_pipeline bpi
  cross join snapshot_history sh;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_support_kpis_v2(date, date, text, text) is
  'KPIs de suporte P0 sobre as datas nativas do HubSpot: resolução, tempo de resolução e tempo de primeira resposta. Reabertura continua vindo do histórico de estágio. Cada estado acompanha a cobertura medida.';

-- ---------------------------------------------------------------------------
-- Customer Success
-- ---------------------------------------------------------------------------

create or replace function public.rpc_analytics_customer_success_kpis_v2()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_version text;
  v_mrr_source text;
  v_active_rule text;
  v_threshold integer;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  select calculation_version, mrr_source, active_customer_rule, inactivity_threshold_days
    into v_version, v_mrr_source, v_active_rule, v_threshold
  from public.analytics_kpi_settings where id;
  v_version := coalesce(v_version, 'kpi_v1');
  v_mrr_source := coalesce(v_mrr_source, 'UNRESOLVED');
  v_active_rule := coalesce(v_active_rule, 'UNRESOLVED');
  v_threshold := coalesce(v_threshold, 30);

  with base as (select * from public.vw_analytics_customer_financial_link),
  active as (select * from base where is_active_customer is true),
  assoc_coverage as (
    select
      (select count(*)::integer from public.hubspot_tickets) as tickets_total,
      (select count(distinct from_id)::integer from public.analytics_hubspot_associations
        where from_object_type = 'tickets' and to_object_type = 'companies') as tickets_linked
  ),
  tickets_by_company as (
    select tc.company_id,
           count(*) filter (where tc.is_open)::integer as open_tickets,
           count(*) filter (where tc.is_open and tc.priority = 'HIGH')::integer as open_critical_tickets
    from public.vw_analytics_ticket_company tc
    where tc.company_id is not null
    group by tc.company_id
  ),
  enriched as (
    select a.*, coalesce(t.open_tickets, 0) as open_tickets,
           coalesce(t.open_critical_tickets, 0) as open_critical_tickets
    from active a
    left join tickets_by_company t on t.company_id = a.company_id
  ),
  activity_coverage as (
    select
      count(*)::integer as total,
      count(*) filter (where last_activity_at is not null)::integer as with_activity
    from active
  ),
  totals as (
    select
      (select count(*)::integer from active) as active_customers,
      (select count(*)::integer from active where mrr is not null) as active_with_mrr,
      (select round(sum(mrr)::numeric, 2) from active where mrr is not null) as mrr_total,
      (select count(*)::integer from active where overdue_balance > 0) as overdue_customers,
      (select round(sum(mrr)::numeric, 2) from active where overdue_balance > 0 and mrr is not null) as mrr_overdue,
      (select round(sum(overdue_balance)::numeric, 2) from active where overdue_balance > 0) as overdue_amount,
      (select count(*)::integer from active where has_financial_link) as linked_customers,
      (select count(*)::integer from base where client_status = 'Churn') as churn_flagged,
      (select count(*)::integer from enriched where open_tickets > 0) as customers_with_tickets,
      (select round(sum(mrr)::numeric, 2) from enriched where open_critical_tickets > 0 and mrr is not null) as mrr_critical,
      (select count(*)::integer from active where days_since_last_activity > v_threshold) as inactive_customers,
      (select round(sum(mrr)::numeric, 2) from active
        where days_since_last_activity > v_threshold and mrr is not null) as mrr_inactive
  ),
  by_owner as (
    select coalesce(jsonb_agg(row_to_json(o) order by o.mrr desc nulls last), '[]'::jsonb) as payload
    from (
      select coalesce(e.cs_owner_id, '_unassigned') as owner_id,
             coalesce(e.cs_owner_name, 'Sem responsável') as owner_name,
             count(*)::integer as customers,
             round(sum(e.mrr)::numeric, 2) as mrr,
             count(*) filter (where e.overdue_balance > 0)::integer as overdue_customers,
             round(coalesce(sum(e.overdue_balance), 0)::numeric, 2) as overdue_amount,
             count(*) filter (where e.open_tickets > 0)::integer as customers_with_tickets,
             count(*) filter (where e.days_since_last_activity > v_threshold)::integer as inactive_customers
      from enriched e group by 1, 2
    ) o
  ),
  risk as (
    select coalesce(jsonb_agg(row_to_json(r) order by r.mrr_at_risk desc nulls last), '[]'::jsonb) as payload
    from (
      select 'financial_overdue' as signal, 'Títulos em atraso' as signal_label,
             count(*)::integer as customers, round(sum(mrr)::numeric, 2) as mrr_at_risk
      from enriched where overdue_balance > 0 and mrr is not null
      union all
      select 'contract_not_current', 'Contrato fora de vigência',
             count(*)::integer, round(sum(mrr)::numeric, 2)
      from enriched
      where mrr is not null and coalesce(contract_status, '') in ('Vencido', 'Encerrado')
      union all
      select 'critical_ticket_open', 'Atendimento crítico em aberto',
             count(*)::integer, round(sum(mrr)::numeric, 2)
      from enriched where open_critical_tickets > 0 and mrr is not null
      union all
      select 'no_recent_activity', 'Sem interação recente',
             count(*)::integer, round(sum(mrr)::numeric, 2)
      from enriched where days_since_last_activity > v_threshold and mrr is not null
    ) r
    where r.customers > 0
  ),
  top_overdue as (
    select coalesce(jsonb_agg(row_to_json(t) order by t.overdue_balance desc), '[]'::jsonb) as payload
    from (
      select company_id, company_name, cs_owner_name, mrr, overdue_balance,
             overdue_titles, max_overdue_days, open_tickets, days_since_last_activity
      from enriched where overdue_balance > 0
      order by overdue_balance desc limit 20
    ) t
  ),
  assoc_state as (
    select
      case
        when ac.tickets_linked = 0 then 'unavailable'
        when ac.tickets_linked < ac.tickets_total then 'partial'
        else 'available'
      end as state,
      case
        when ac.tickets_linked = 0 then 'associations_missing'
        when ac.tickets_linked < ac.tickets_total then 'associations_partial'
        else null
      end as reason
    from assoc_coverage ac
  ),
  activity_state as (
    select
      case
        when acv.with_activity = 0 then 'unavailable'
        when acv.with_activity < acv.total then 'partial'
        else 'available'
      end as state,
      case
        when acv.with_activity = 0 then 'activity_dates_missing'
        when acv.with_activity < acv.total then 'activity_partial'
        else null
      end as reason
    from activity_coverage acv
  )
  select jsonb_build_object(
    'meta', jsonb_build_object(
      'source', 'hubspot+omie',
      'calculation_version', v_version,
      'mrr_source', v_mrr_source,
      'active_customer_rule', v_active_rule,
      'inactivity_threshold_days', v_threshold,
      'freshness_at', (select max(synced_at) from public.hubspot_companies),
      'coverage_percent', app_private.kpi_ratio(tt.linked_customers, nullif(tt.active_customers, 0)),
      'is_partial', tt.linked_customers < tt.active_customers,
      'warning_codes',
        (case when v_mrr_source = 'UNRESOLVED' then jsonb_build_array('mrr_source_unresolved') else '[]'::jsonb end)
        || (case when v_active_rule = 'UNRESOLVED' then jsonb_build_array('active_customer_rule_unresolved') else '[]'::jsonb end)
        || (case when tt.linked_customers < tt.active_customers then jsonb_build_array('missing_hubspot_omie_mapping') else '[]'::jsonb end)
        || (case when ast.reason is not null then jsonb_build_array(ast.reason) else '[]'::jsonb end)
        || (case when act.reason is not null then jsonb_build_array(act.reason) else '[]'::jsonb end)
    ),
    'kpis', jsonb_build_object(
      'active_customers', app_private.kpi_entry(
        tt.active_customers::numeric, 'company_status_now',
        case when v_active_rule = 'UNRESOLVED' then 'unavailable' else 'available' end,
        case when v_active_rule = 'UNRESOLVED' then 'active_customer_rule_unresolved' else null end
      ),
      'mrr_total', app_private.kpi_entry(
        tt.mrr_total, 'company_recurring_revenue_now',
        case when v_mrr_source = 'UNRESOLVED' then 'unavailable'
             when tt.active_with_mrr < tt.active_customers then 'partial' else 'available' end,
        case when v_mrr_source = 'UNRESOLVED' then 'mrr_source_unresolved'
             when tt.active_with_mrr < tt.active_customers then 'mrr_partial_coverage' else null end
      ),
      'arpa', app_private.kpi_entry(
        case when tt.active_with_mrr > 0 then round(tt.mrr_total / tt.active_with_mrr, 2) else null end,
        'company_recurring_revenue_now',
        case when v_mrr_source = 'UNRESOLVED' then 'unavailable' else 'available' end,
        case when v_mrr_source = 'UNRESOLVED' then 'mrr_source_unresolved' else null end
      ),
      'overdue_customers', app_private.kpi_entry(tt.overdue_customers::numeric, 'title_due_date_now'),
      'overdue_amount', app_private.kpi_entry(nullif(tt.overdue_amount, 0), 'title_due_date_now'),
      'mrr_overdue', app_private.kpi_entry(
        tt.mrr_overdue, 'company_recurring_revenue_now',
        case when v_mrr_source = 'UNRESOLVED' then 'unavailable' else 'partial' end,
        case when v_mrr_source = 'UNRESOLVED' then 'mrr_source_unresolved'
             else 'missing_hubspot_omie_mapping' end
      ),
      'mapping_coverage_percent', app_private.kpi_entry(
        app_private.kpi_ratio(tt.linked_customers, nullif(tt.active_customers, 0)), 'company_tax_id_now'
      ),
      'customers_with_open_tickets', app_private.kpi_entry(
        tt.customers_with_tickets::numeric, 'ticket_state_open_now', ast.state, ast.reason
      ),
      'mrr_with_critical_ticket', app_private.kpi_entry(
        tt.mrr_critical, 'ticket_state_open_now', ast.state, ast.reason
      ),
      -- Desbloqueado pela ingestão da última interação registrada.
      'customers_without_recent_activity', app_private.kpi_entry(
        tt.inactive_customers::numeric, 'company_last_activity_at', act.state, act.reason
      ),
      'mrr_without_recent_activity', app_private.kpi_entry(
        tt.mrr_inactive, 'company_last_activity_at', act.state, act.reason
      ),
      'logo_churn_rate', app_private.kpi_entry(
        null, 'customer_status_transition', 'awaiting_history', 'history_insufficient'
      ),
      'churned_mrr', app_private.kpi_entry(
        null, 'customer_status_transition', 'awaiting_history', 'history_insufficient'
      ),
      'new_mrr', app_private.kpi_entry(
        null, 'customer_status_transition', 'awaiting_history', 'history_insufficient'
      ),
      'nrr', app_private.kpi_entry(
        null, 'customer_status_transition', 'awaiting_history', 'history_insufficient'
      ),
      'grr', app_private.kpi_entry(
        null, 'customer_status_transition', 'awaiting_history', 'history_insufficient'
      )
    ),
    'by_owner', bo.payload,
    'risk_signals', rk.payload,
    'top_overdue_customers', tov.payload,
    'churn_flagged_customers', tt.churn_flagged,
    'source_coverage', jsonb_build_object(
      'tickets', ac.tickets_total,
      'tickets_linked', ac.tickets_linked,
      'active_customers', acv.total,
      'with_activity', acv.with_activity
    )
  )
  into v_result
  from totals tt
  cross join assoc_coverage ac
  cross join activity_coverage acv
  cross join assoc_state ast
  cross join activity_state act
  cross join by_owner bo
  cross join risk rk
  cross join top_overdue tov;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_customer_success_kpis_v2() is
  'KPIs de Customer Success P0. Clientes sem interação recente passa a ter fonte real pela última interação registrada; atendimento por cliente depende das associations, com estado acompanhando a cobertura.';
