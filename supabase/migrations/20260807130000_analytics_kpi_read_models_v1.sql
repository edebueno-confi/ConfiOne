-- ANALYTICS-KPI-READ-MODELS-V1
--
-- Read models de KPI P0 para Resumo, Comercial, Customer Success, Suporte e
-- Financeiro. Toda a regra vive no Postgres; o frontend apenas renderiza.
--
-- Contrato de cada KPI
-- --------------------
-- Cada indicador é devolvido como um objeto com estado explícito:
--
--   state   : available | partial | unavailable | awaiting_history
--   value   : número, ou null quando o estado não é available/partial
--   basis   : qual data define a coorte do indicador
--   reason  : código estável do motivo, quando não está available
--
-- Um KPI nunca devolve 0 para representar ausência de fonte. Quando o dado não
-- pode ser calculado com segurança, value é null e state explica por quê.
--
-- Bloqueios reais confirmados contra a conta em 2026-08-07
-- --------------------------------------------------------
--   ticket_close_date_missing : a conta não preenche `closedate` em tickets.
--       31.530 tickets estão em estágios com ticketState = CLOSED e nenhum tem
--       data de fechamento. Tickets resolvidos por período, Time to Resolution e
--       backlog histórico ficam indisponíveis até haver série de snapshot.
--   ticket_first_response_missing : a ingestão não traz hs_time_to_first_response.
--       Só existe o status de SLA, e com cobertura de 4%.
--   associations_missing : nenhuma association do HubSpot é ingerida.
--       Ticket ↔ Company e Deal ↔ Company não existem, o que bloqueia tickets
--       por cliente, MRR com ticket crítico e MRR com SLA violado.
--   activity_dates_missing : não há data de última atividade por Company, o que
--       bloqueia clientes sem interação recente.
--   history_insufficient : churn, NRR, GRR, expansão e contração exigem série
--       histórica que começa na primeira captura de snapshot.

-- ---------------------------------------------------------------------------
-- Helper de construção de KPI
-- ---------------------------------------------------------------------------

create or replace function app_private.kpi_entry(
  p_value numeric,
  p_basis text,
  p_state text default 'available',
  p_reason text default null
)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'state', case when p_state = 'available' and p_value is null then 'unavailable' else p_state end,
    'value', case when p_state in ('unavailable', 'awaiting_history') then null else p_value end,
    'basis', p_basis,
    'reason', case
      when p_state = 'available' and p_value is null then coalesce(p_reason, 'no_data_in_period')
      else p_reason
    end
  );
$$;

comment on function app_private.kpi_entry(numeric, text, text, text) is
  'Constrói a entrada padrão de um KPI com estado, valor, coorte de data e motivo. Impede que ausência de fonte seja representada por zero.';

revoke all on function app_private.kpi_entry(numeric, text, text, text) from public, anon;

-- Divisão protegida: devolve NULL quando o denominador é zero ou nulo, para que
-- o KPI apareça como indisponível em vez de produzir percentual artificial.
create or replace function app_private.kpi_ratio(p_numerator numeric, p_denominator numeric)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case
    when p_denominator is null or p_denominator = 0 then null
    else round((coalesce(p_numerator, 0) / p_denominator) * 100, 2)
  end;
$$;

comment on function app_private.kpi_ratio(numeric, numeric) is
  'Percentual protegido contra divisão por zero. Denominador zero ou nulo devolve NULL, nunca 0.';

revoke all on function app_private.kpi_ratio(numeric, numeric) from public, anon;

-- ---------------------------------------------------------------------------
-- Comercial
-- ---------------------------------------------------------------------------

create or replace function public.rpc_analytics_commercial_kpis_v2(
  p_from date,
  p_to date,
  p_owner_id text default null,
  p_pipeline_id text default null
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
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  select calculation_version into v_version from public.analytics_kpi_settings where id;
  v_version := coalesce(v_version, 'kpi_v1');

  with scoped as (
    select
      d.deal_id,
      d.owner_id,
      d.amount_home,
      d.hs_created_at,
      d.hs_closed_at,
      d.pipeline_id,
      s.is_closed,
      s.is_won,
      s.label as stage_label,
      s.display_order,
      s.stage_id,
      nullif(s.metadata ->> 'probability', '')::numeric as stage_probability
    from public.hubspot_deals d
    join public.analytics_source_config c
      on c.object_type = 'deal'
     and c.hubspot_pipeline_id = d.pipeline_id
     and c.is_active
     and not coalesce(c.is_archived, false)
    join public.hubspot_pipeline_stages s
      on s.object_type = 'deal'
     and s.pipeline_id = d.pipeline_id
     and s.stage_id = d.dealstage
    where (p_owner_id is null or d.owner_id = p_owner_id)
      and (p_pipeline_id is null or d.pipeline_id = p_pipeline_id)
  ),
  -- Coorte "aberto agora": independe do período selecionado.
  open_now as (
    select
      count(*)::integer as open_deals,
      round(coalesce(sum(amount_home), 0)::numeric, 2) as open_amount,
      round(sum(amount_home * stage_probability)
              filter (where stage_probability is not null)::numeric, 2) as weighted_amount,
      count(*) filter (where stage_probability is not null)::integer as with_probability
    from scoped
    where not coalesce(is_closed, false)
  ),
  -- Coorte "criado no período".
  created_cohort as (
    select count(*)::integer as created_deals,
           round(coalesce(sum(amount_home), 0)::numeric, 2) as created_amount
    from scoped
    where hs_created_at is not null
      and hs_created_at::date between p_from and p_to
  ),
  -- Coorte "fechado no período". Win rate, ticket médio e ciclo usam esta.
  closed_cohort as (
    select
      count(*) filter (where is_won)::integer as won_deals,
      count(*) filter (where is_closed and not is_won)::integer as lost_deals,
      round(coalesce(sum(amount_home) filter (where is_won), 0)::numeric, 2) as won_amount,
      round(avg(amount_home) filter (where is_won)::numeric, 2) as avg_won_amount,
      round(percentile_cont(0.5) within group (
        order by amount_home
      ) filter (where is_won)::numeric, 2) as median_won_amount,
      round(percentile_cont(0.5) within group (
        order by extract(epoch from (hs_closed_at - hs_created_at)) / 86400.0
      ) filter (where is_won and hs_created_at is not null)::numeric, 1) as median_cycle_days,
      round(avg(extract(epoch from (hs_closed_at - hs_created_at)) / 86400.0)
              filter (where is_won and hs_created_at is not null)::numeric, 1) as avg_cycle_days
    from scoped
    where is_closed
      and hs_closed_at is not null
      and hs_closed_at::date between p_from and p_to
  ),
  by_owner as (
    select coalesce(jsonb_agg(row_to_json(o) order by o.won_amount desc nulls last), '[]'::jsonb) as payload
    from (
      select
        coalesce(sc.owner_id, '_unassigned') as owner_id,
        coalesce(ow.full_name, 'Sem responsável') as owner_name,
        count(*) filter (where not coalesce(sc.is_closed, false))::integer as open_deals,
        round(coalesce(sum(sc.amount_home) filter (where not coalesce(sc.is_closed, false)), 0)::numeric, 2) as open_amount,
        count(*) filter (
          where sc.is_won and sc.hs_closed_at::date between p_from and p_to
        )::integer as won_deals,
        count(*) filter (
          where sc.is_closed and not sc.is_won and sc.hs_closed_at::date between p_from and p_to
        )::integer as lost_deals,
        round(coalesce(sum(sc.amount_home) filter (
          where sc.is_won and sc.hs_closed_at::date between p_from and p_to
        ), 0)::numeric, 2) as won_amount,
        app_private.kpi_ratio(
          count(*) filter (where sc.is_won and sc.hs_closed_at::date between p_from and p_to),
          nullif(count(*) filter (
            where sc.is_closed and sc.hs_closed_at::date between p_from and p_to
          ), 0)
        ) as win_rate,
        round(percentile_cont(0.5) within group (
          order by extract(epoch from (sc.hs_closed_at - sc.hs_created_at)) / 86400.0
        ) filter (
          where sc.is_won and sc.hs_created_at is not null
            and sc.hs_closed_at::date between p_from and p_to
        )::numeric, 1) as median_cycle_days
      from scoped sc
      left join public.hubspot_owners ow on ow.owner_id = sc.owner_id
      group by 1, 2
    ) o
  ),
  funnel as (
    select coalesce(jsonb_agg(row_to_json(f) order by f.display_order nulls last), '[]'::jsonb) as payload
    from (
      select
        sc.stage_id,
        sc.stage_label,
        sc.display_order,
        count(*) filter (where not coalesce(sc.is_closed, false))::integer as open_deals,
        round(coalesce(sum(sc.amount_home) filter (where not coalesce(sc.is_closed, false)), 0)::numeric, 2) as open_amount,
        sc.stage_probability
      from scoped sc
      group by 1, 2, 3, 6
    ) f
  )
  select jsonb_build_object(
    'meta', jsonb_build_object(
      'source', 'hubspot',
      'calculation_version', v_version,
      'freshness_at', (select max(synced_at) from public.hubspot_deals),
      'period_from', p_from,
      'period_to', p_to,
      'coverage_percent', app_private.kpi_ratio(o.with_probability, nullif(o.open_deals, 0)),
      'is_partial', o.with_probability < o.open_deals,
      'warning_codes', case
        when o.with_probability < o.open_deals
          then jsonb_build_array('weighted_pipeline_partial_coverage')
        else '[]'::jsonb
      end
    ),
    'kpis', jsonb_build_object(
      'open_pipeline_amount', app_private.kpi_entry(nullif(o.open_amount, 0), 'stage_open_now'),
      'open_deals', app_private.kpi_entry(nullif(o.open_deals, 0)::numeric, 'stage_open_now'),
      'weighted_pipeline_amount', app_private.kpi_entry(
        o.weighted_amount, 'stage_open_now',
        case when o.with_probability = 0 then 'unavailable'
             when o.with_probability < o.open_deals then 'partial'
             else 'available' end,
        case when o.with_probability = 0 then 'stage_probability_missing'
             when o.with_probability < o.open_deals then 'stage_probability_partial'
             else null end
      ),
      'created_deals', app_private.kpi_entry(cr.created_deals::numeric, 'deal_created_at'),
      'created_amount', app_private.kpi_entry(nullif(cr.created_amount, 0), 'deal_created_at'),
      'won_deals', app_private.kpi_entry(cc.won_deals::numeric, 'deal_closed_at'),
      'lost_deals', app_private.kpi_entry(cc.lost_deals::numeric, 'deal_closed_at'),
      'won_amount', app_private.kpi_entry(nullif(cc.won_amount, 0), 'deal_closed_at'),
      'win_rate', app_private.kpi_entry(
        app_private.kpi_ratio(cc.won_deals, nullif(cc.won_deals + cc.lost_deals, 0)),
        'deal_closed_at', 'available', 'no_closed_deals_in_period'
      ),
      'avg_deal_amount', app_private.kpi_entry(cc.avg_won_amount, 'deal_closed_at'),
      'median_deal_amount', app_private.kpi_entry(cc.median_won_amount, 'deal_closed_at'),
      'median_sales_cycle_days', app_private.kpi_entry(cc.median_cycle_days, 'deal_closed_at'),
      'avg_sales_cycle_days', app_private.kpi_entry(cc.avg_cycle_days, 'deal_closed_at'),
      'stage_aging_days', app_private.kpi_entry(
        null, 'deal_stage_entered_at', 'awaiting_history', 'history_insufficient'
      ),
      'stage_conversion_rate', app_private.kpi_entry(
        null, 'deal_stage_transition', 'awaiting_history', 'history_insufficient'
      )
    ),
    'by_owner', bo.payload,
    'funnel', fn.payload
  )
  into v_result
  from open_now o
  cross join created_cohort cr
  cross join closed_cohort cc
  cross join by_owner bo
  cross join funnel fn;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_commercial_kpis_v2(date, date, text, text) is
  'KPIs comerciais P0 com coorte declarada por KPI: pipeline aberto e ponderado na data de corte, deals criados por data de criação, ganhos/perdidos/win rate/ticket/ciclo por data de fechamento.';

revoke all on function public.rpc_analytics_commercial_kpis_v2(date, date, text, text) from public, anon;
grant execute on function public.rpc_analytics_commercial_kpis_v2(date, date, text, text) to authenticated, service_role;

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
      t.ticket_id,
      t.pipeline_id,
      t.pipeline_stage,
      t.owner_id,
      t.source_type,
      t.priority,
      t.hs_created_at,
      t.hs_closed_at,
      t.time_to_first_response_sla_status,
      t.time_to_close_sla_status,
      coalesce(s.metadata ->> 'ticketState', '') = 'OPEN' as is_open,
      s.label as stage_label,
      s.display_order,
      c.label as pipeline_label,
      c.hubspot_pipeline_label
    from public.hubspot_tickets t
    join public.analytics_source_config c
      on c.object_type = 'ticket'
     and c.hubspot_pipeline_id = t.pipeline_id
     and c.is_active
     and not coalesce(c.is_archived, false)
    join public.hubspot_pipeline_stages s
      on s.object_type = 'ticket'
     and s.pipeline_id = t.pipeline_id
     and s.stage_id = t.pipeline_stage
    where (p_pipeline_id is null or t.pipeline_id = p_pipeline_id)
      and (p_priority is null or t.priority = p_priority)
  ),
  backlog as (
    select
      count(*) filter (where is_open)::integer as open_tickets,
      count(*) filter (where is_open and hs_created_at is not null)::integer as open_with_date,
      round(percentile_cont(0.5) within group (
        order by extract(epoch from (timezone('utc', now()) - hs_created_at)) / 86400.0
      ) filter (where is_open)::numeric, 1) as median_backlog_age_days
    from scoped
  ),
  received as (
    select count(*)::integer as created_tickets
    from scoped
    where hs_created_at is not null
      and hs_created_at::date between p_from and p_to
  ),
  close_coverage as (
    select
      count(*) filter (where not is_open)::integer as closed_stage_tickets,
      count(*) filter (where not is_open and hs_closed_at is not null)::integer as closed_with_date
    from scoped
  ),
  sla as (
    select
      count(*) filter (
        where nullif(btrim(coalesce(time_to_first_response_sla_status, '')), '') is not null
      )::integer as frt_sla_rows,
      count(*) filter (
        where nullif(btrim(coalesce(time_to_close_sla_status, '')), '') is not null
      )::integer as close_sla_rows,
      count(*)::integer as total_rows
    from scoped
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
          from scoped
          where is_open and hs_created_at is not null
        ) h
      ) b
      group by bucket, sort_order
    ) a
  ),
  by_priority as (
    select coalesce(jsonb_agg(row_to_json(p) order by p.open_tickets desc), '[]'::jsonb) as payload
    from (
      select
        coalesce(priority, '_unset') as priority,
        count(*) filter (where is_open)::integer as open_tickets,
        count(*) filter (
          where hs_created_at::date between p_from and p_to
        )::integer as created_tickets
      from scoped group by 1
    ) p
  ),
  by_source as (
    select coalesce(jsonb_agg(row_to_json(s) order by s.open_tickets desc), '[]'::jsonb) as payload
    from (
      select
        coalesce(nullif(btrim(coalesce(source_type, '')), ''), '_unset') as source_type,
        count(*) filter (where is_open)::integer as open_tickets,
        count(*) filter (
          where hs_created_at::date between p_from and p_to
        )::integer as created_tickets
      from scoped group by 1
    ) s
  ),
  by_owner as (
    select coalesce(jsonb_agg(row_to_json(o) order by o.open_tickets desc), '[]'::jsonb) as payload
    from (
      select
        coalesce(sc.owner_id, '_unassigned') as owner_id,
        coalesce(ow.full_name, 'Sem responsável') as owner_name,
        count(*) filter (where sc.is_open)::integer as open_tickets,
        count(*) filter (
          where sc.hs_created_at::date between p_from and p_to
        )::integer as created_tickets
      from scoped sc
      left join public.hubspot_owners ow on ow.owner_id = sc.owner_id
      group by 1, 2
    ) o
  ),
  by_pipeline as (
    select coalesce(jsonb_agg(row_to_json(p) order by p.open_tickets desc), '[]'::jsonb) as payload
    from (
      select
        pipeline_id,
        coalesce(pipeline_label, hubspot_pipeline_label, 'Sem nome') as pipeline_label,
        count(*) filter (where is_open)::integer as open_tickets,
        count(*) filter (
          where hs_created_at::date between p_from and p_to
        )::integer as created_tickets
      from scoped group by 1, 2
    ) p
  ),
  history as (
    select count(distinct snapshot_date)::integer as days
    from public.analytics_kpi_daily_snapshot
    where metric_key = 'support_backlog_open'
  )
  select jsonb_build_object(
    'meta', jsonb_build_object(
      'source', 'hubspot',
      'calculation_version', v_version,
      'freshness_at', (select max(synced_at) from public.hubspot_tickets),
      'period_from', p_from,
      'period_to', p_to,
      'coverage_percent', app_private.kpi_ratio(sl.close_sla_rows, nullif(sl.total_rows, 0)),
      'is_partial', true,
      'history_days', h.days,
      'warning_codes', jsonb_build_array(
        'ticket_close_date_missing',
        'ticket_first_response_missing',
        'associations_missing'
      ) || case
        when sl.close_sla_rows = 0 then jsonb_build_array('sla_unavailable')
        else jsonb_build_array('sla_partial_coverage')
      end
    ),
    'kpis', jsonb_build_object(
      'created_tickets', app_private.kpi_entry(rc.created_tickets::numeric, 'ticket_created_at'),
      'open_backlog', app_private.kpi_entry(bl.open_tickets::numeric, 'ticket_state_open_now'),
      'median_backlog_age_days', app_private.kpi_entry(bl.median_backlog_age_days, 'ticket_created_at'),
      -- Bloqueados por ausência de closedate na conta. Ver cabeçalho.
      'resolved_tickets', app_private.kpi_entry(
        null, 'ticket_closed_at', 'unavailable', 'ticket_close_date_missing'
      ),
      'median_time_to_resolution_days', app_private.kpi_entry(
        null, 'ticket_closed_at', 'unavailable', 'ticket_close_date_missing'
      ),
      'median_first_response_hours', app_private.kpi_entry(
        null, 'ticket_first_response_at', 'unavailable', 'ticket_first_response_missing'
      ),
      'first_response_sla_coverage_percent', app_private.kpi_entry(
        app_private.kpi_ratio(sl.frt_sla_rows, nullif(sl.total_rows, 0)),
        'ticket_sla_status',
        case when sl.frt_sla_rows = 0 then 'unavailable' else 'partial' end,
        case when sl.frt_sla_rows = 0 then 'sla_unavailable' else 'sla_partial_coverage' end
      ),
      'close_sla_coverage_percent', app_private.kpi_entry(
        app_private.kpi_ratio(sl.close_sla_rows, nullif(sl.total_rows, 0)),
        'ticket_sla_status',
        case when sl.close_sla_rows = 0 then 'unavailable' else 'partial' end,
        case when sl.close_sla_rows = 0 then 'sla_unavailable' else 'sla_partial_coverage' end
      ),
      'reopen_rate', app_private.kpi_entry(
        null, 'ticket_stage_transition', 'awaiting_history', 'history_insufficient'
      ),
      'historic_backlog', app_private.kpi_entry(
        null, 'ticket_state_open_at_date', 'awaiting_history',
        case when h.days > 1 then null else 'history_insufficient' end
      )
    ),
    'aging', ag.payload,
    'by_priority', bp.payload,
    'by_source', bs.payload,
    'by_owner', bo.payload,
    'by_pipeline', bpi.payload,
    'close_date_coverage', jsonb_build_object(
      'closed_stage_tickets', cvg.closed_stage_tickets,
      'closed_with_date', cvg.closed_with_date
    )
  )
  into v_result
  from backlog bl
  cross join received rc
  cross join close_coverage cvg
  cross join sla sl
  cross join aging ag
  cross join by_priority bp
  cross join by_source bs
  cross join by_owner bo
  cross join by_pipeline bpi
  cross join history h;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_support_kpis_v2(date, date, text, text) is
  'KPIs de suporte P0. Backlog, aging, prioridade, origem, owner e pipeline usam dado real. Resolvidos, TTR e FRT permanecem indisponíveis porque a conta não preenche a data de fechamento do ticket.';

revoke all on function public.rpc_analytics_support_kpis_v2(date, date, text, text) from public, anon;
grant execute on function public.rpc_analytics_support_kpis_v2(date, date, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Customer Success (carteira + híbridos financeiros)
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
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  select calculation_version, mrr_source, active_customer_rule
    into v_version, v_mrr_source, v_active_rule
  from public.analytics_kpi_settings where id;
  v_version := coalesce(v_version, 'kpi_v1');
  v_mrr_source := coalesce(v_mrr_source, 'UNRESOLVED');
  v_active_rule := coalesce(v_active_rule, 'UNRESOLVED');

  with base as (
    select * from public.vw_analytics_customer_financial_link
  ),
  active as (
    select * from base where is_active_customer is true
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
      (select count(*)::integer from base where client_status = 'Churn') as churn_flagged
  ),
  by_owner as (
    select coalesce(jsonb_agg(row_to_json(o) order by o.mrr desc nulls last), '[]'::jsonb) as payload
    from (
      select
        coalesce(a.cs_owner_id, '_unassigned') as owner_id,
        coalesce(a.cs_owner_name, 'Sem responsável') as owner_name,
        count(*)::integer as customers,
        round(sum(a.mrr)::numeric, 2) as mrr,
        count(*) filter (where a.overdue_balance > 0)::integer as overdue_customers,
        round(coalesce(sum(a.overdue_balance), 0)::numeric, 2) as overdue_amount
      from active a
      group by 1, 2
    ) o
  ),
  -- Receita em risco por sinais transparentes. Só o sinal financeiro está
  -- disponível hoje; ticket crítico e SLA dependem de associations não ingeridas.
  risk as (
    select coalesce(jsonb_agg(row_to_json(r) order by r.mrr_at_risk desc nulls last), '[]'::jsonb) as payload
    from (
      select
        'financial_overdue' as signal,
        'Títulos em atraso' as signal_label,
        count(*)::integer as customers,
        round(sum(mrr)::numeric, 2) as mrr_at_risk
      from active where overdue_balance > 0 and mrr is not null
      union all
      select
        'contract_not_current',
        'Contrato fora de vigência',
        count(*)::integer,
        round(sum(mrr)::numeric, 2)
      from active
      where mrr is not null
        and coalesce(contract_status, '') in ('Vencido', 'Encerrado')
    ) r
    where r.customers > 0
  ),
  top_overdue as (
    select coalesce(jsonb_agg(row_to_json(t) order by t.overdue_balance desc), '[]'::jsonb) as payload
    from (
      select company_id, company_name, cs_owner_name, mrr,
             overdue_balance, overdue_titles, max_overdue_days
      from active
      where overdue_balance > 0
      order by overdue_balance desc
      limit 20
    ) t
  )
  select jsonb_build_object(
    'meta', jsonb_build_object(
      'source', 'hubspot+omie',
      'calculation_version', v_version,
      'mrr_source', v_mrr_source,
      'active_customer_rule', v_active_rule,
      'freshness_at', (select max(synced_at) from public.hubspot_companies),
      'coverage_percent', app_private.kpi_ratio(tt.linked_customers, nullif(tt.active_customers, 0)),
      'is_partial', tt.linked_customers < tt.active_customers,
      'warning_codes', (case
          when v_mrr_source = 'UNRESOLVED' then jsonb_build_array('mrr_source_unresolved')
          else '[]'::jsonb
        end)
        || (case
          when v_active_rule = 'UNRESOLVED' then jsonb_build_array('active_customer_rule_unresolved')
          else '[]'::jsonb
        end)
        || (case
          when tt.linked_customers < tt.active_customers
            then jsonb_build_array('missing_hubspot_omie_mapping')
          else '[]'::jsonb
        end)
        || jsonb_build_array('associations_missing', 'activity_dates_missing')
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
             when tt.active_with_mrr < tt.active_customers then 'partial'
             else 'available' end,
        case when v_mrr_source = 'UNRESOLVED' then 'mrr_source_unresolved'
             when tt.active_with_mrr < tt.active_customers then 'mrr_partial_coverage'
             else null end
      ),
      'arpa', app_private.kpi_entry(
        case when tt.active_with_mrr > 0
          then round(tt.mrr_total / tt.active_with_mrr, 2) else null end,
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
        app_private.kpi_ratio(tt.linked_customers, nullif(tt.active_customers, 0)),
        'company_tax_id_now'
      ),
      -- Bloqueados por ausência de associations e de data de atividade.
      'customers_with_open_tickets', app_private.kpi_entry(
        null, 'ticket_state_open_now', 'unavailable', 'associations_missing'
      ),
      'customers_without_recent_activity', app_private.kpi_entry(
        null, 'company_last_activity_at', 'unavailable', 'activity_dates_missing'
      ),
      -- Bloqueados por ausência de série histórica.
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
    'churn_flagged_customers', tt.churn_flagged
  )
  into v_result
  from totals tt
  cross join by_owner bo
  cross join risk rk
  cross join top_overdue tov;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_customer_success_kpis_v2() is
  'KPIs de Customer Success P0. Carteira, MRR, ARPA e inadimplência por cliente usam dado real, com a ligação HubSpot↔OMIE por CNPJ normalizado. Churn, NRR e GRR ficam aguardando histórico.';

revoke all on function public.rpc_analytics_customer_success_kpis_v2() from public, anon;
grant execute on function public.rpc_analytics_customer_success_kpis_v2() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Resumo executivo
-- ---------------------------------------------------------------------------

create or replace function public.rpc_analytics_executive_kpis_v2(
  p_from date,
  p_to date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_commercial jsonb;
  v_support jsonb;
  v_cs jsonb;
  v_finance jsonb;
  v_version text;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  select calculation_version into v_version from public.analytics_kpi_settings where id;
  v_version := coalesce(v_version, 'kpi_v1');

  v_commercial := public.rpc_analytics_commercial_kpis_v2(p_from, p_to, null, null);
  v_support := public.rpc_analytics_support_kpis_v2(p_from, p_to, null, null);
  v_cs := public.rpc_analytics_customer_success_kpis_v2();
  v_finance := public.rpc_analytics_finance_snapshot(p_from, p_to, null, null, null);

  return jsonb_build_object(
    'meta', jsonb_build_object(
      'source', 'hubspot+omie',
      'calculation_version', v_version,
      'period_from', p_from,
      'period_to', p_to,
      'freshness_at', greatest(
        coalesce((v_commercial -> 'meta' ->> 'freshness_at')::timestamptz, '-infinity'::timestamptz),
        coalesce((v_support -> 'meta' ->> 'freshness_at')::timestamptz, '-infinity'::timestamptz),
        coalesce((v_cs -> 'meta' ->> 'freshness_at')::timestamptz, '-infinity'::timestamptz)
      ),
      'warning_codes',
        coalesce(v_commercial -> 'meta' -> 'warning_codes', '[]'::jsonb)
        || coalesce(v_support -> 'meta' -> 'warning_codes', '[]'::jsonb)
        || coalesce(v_cs -> 'meta' -> 'warning_codes', '[]'::jsonb)
    ),
    'kpis', jsonb_build_object(
      'active_customers', v_cs -> 'kpis' -> 'active_customers',
      'mrr_total', v_cs -> 'kpis' -> 'mrr_total',
      'new_mrr', v_cs -> 'kpis' -> 'new_mrr',
      'churned_mrr', v_cs -> 'kpis' -> 'churned_mrr',
      'nrr', v_cs -> 'kpis' -> 'nrr',
      'open_pipeline_amount', v_commercial -> 'kpis' -> 'open_pipeline_amount',
      'win_rate', v_commercial -> 'kpis' -> 'win_rate',
      'won_amount', v_commercial -> 'kpis' -> 'won_amount',
      'open_backlog', v_support -> 'kpis' -> 'open_backlog',
      'created_tickets', v_support -> 'kpis' -> 'created_tickets',
      'first_response_sla_coverage_percent',
        v_support -> 'kpis' -> 'first_response_sla_coverage_percent',
      'received_amount', app_private.kpi_entry(
        nullif((v_finance -> 'kpis' ->> 'received_amount')::numeric, 0), 'title_paid_at'
      ),
      'open_receivables', app_private.kpi_entry(
        nullif((v_finance -> 'kpis' ->> 'open_balance')::numeric, 0), 'title_due_date_now'
      ),
      'overdue_receivables', app_private.kpi_entry(
        nullif((v_finance -> 'kpis' ->> 'overdue_balance')::numeric, 0), 'title_due_date_now'
      ),
      'overdue_rate', app_private.kpi_entry(
        (v_finance -> 'kpis' ->> 'overdue_rate')::numeric, 'title_due_date_now'
      ),
      'mrr_overdue', v_cs -> 'kpis' -> 'mrr_overdue'
    )
  );
end;
$$;

comment on function public.rpc_analytics_executive_kpis_v2(date, date) is
  'Resumo executivo consolidando Comercial, Suporte, Customer Success e Financeiro. Não recalcula fórmula: reusa os read models de cada área para impedir divergência entre abas.';

revoke all on function public.rpc_analytics_executive_kpis_v2(date, date) from public, anon;
grant execute on function public.rpc_analytics_executive_kpis_v2(date, date) to authenticated, service_role;
