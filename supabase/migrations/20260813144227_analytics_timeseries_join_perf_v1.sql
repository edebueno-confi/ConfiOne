-- ANALYTICS-TIMESERIES-JOIN-PERF-V1
-- Mantem o contrato JSON e elimina o cross join entre cada periodo e todos os
-- registros. Cada dominio junta somente os registros que podem contribuir para
-- o bucket corrente.

begin;

create or replace function public.rpc_analytics_timeseries(
  p_domain text,
  p_from date,
  p_to date,
  p_grain text default 'month'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
set statement_timeout = '15s'
as $$
declare
  v_result jsonb;
  v_grain text;
  v_bucket text;
  v_step interval;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  v_grain := case when p_grain in ('day', 'week', 'month') then p_grain else 'month' end;
  v_bucket := v_grain;
  v_step := ('1 ' || v_bucket)::interval;

  if p_to < p_from then
    raise exception 'Periodo invalido: data final anterior a data inicial';
  end if;

  if p_domain = 'support' then
    with periodos as (
      select generate_series(
        date_trunc(v_bucket, p_from::timestamptz),
        date_trunc(v_bucket, p_to::timestamptz),
        v_step
      ) as inicio
    ),
    escopo as (
      select t.hs_created_at, r.resolved_at, r.resolution_days
      from public.hubspot_tickets t
      join public.analytics_source_config c
        on c.object_type = 'ticket'
       and c.hubspot_pipeline_id = t.pipeline_id
       and c.is_active
       and not coalesce(c.is_archived, false)
      left join public.vw_analytics_ticket_resolution r on r.ticket_id = t.ticket_id
    ),
    serie as (
      select
        p.inicio,
        count(e.*) filter (
          where e.hs_created_at >= p.inicio
            and e.hs_created_at < p.inicio + v_step
        )::integer as abertos,
        count(e.*) filter (
          where e.resolved_at >= p.inicio
            and e.resolved_at < p.inicio + v_step
        )::integer as resolvidos,
        round(percentile_cont(0.5) within group (order by e.resolution_days) filter (
          where e.resolved_at >= p.inicio
            and e.resolved_at < p.inicio + v_step
        )::numeric, 1) as tempo_mediano
      from periodos p
      left join escopo e
        on (e.hs_created_at >= p.inicio and e.hs_created_at < p.inicio + v_step)
        or (e.resolved_at >= p.inicio and e.resolved_at < p.inicio + v_step)
      group by p.inicio
    )
    select jsonb_build_object(
      'domain', 'support',
      'grain', v_grain,
      'period_from', p_from,
      'period_to', p_to,
      'series', coalesce((
        select jsonb_agg(row_to_json(x) order by x.period)
        from (
          select inicio::date as period,
            abertos as opened,
            resolvidos as resolved,
            abertos - resolvidos as balance,
            sum(abertos - resolvidos) over (order by inicio) as cumulative_balance,
            tempo_mediano as median_resolution_days
          from serie
        ) x
      ), '[]'::jsonb),
      'legend', jsonb_build_object(
        'opened', 'Considera a data de abertura do atendimento.',
        'resolved', 'Considera a data de encerramento.',
        'balance', 'Abertos menos resolvidos no período. Positivo significa fila crescendo.'
      )
    ) into v_result;

  elsif p_domain = 'commercial' then
    with periodos as (
      select generate_series(
        date_trunc(v_bucket, p_from::timestamptz),
        date_trunc(v_bucket, p_to::timestamptz),
        v_step
      ) as inicio
    ),
    escopo as (
      select d.hs_created_at, d.hs_closed_at, d.amount_home, s.is_won, s.is_closed
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
    ),
    serie as (
      select
        p.inicio,
        count(e.*) filter (
          where e.hs_created_at >= p.inicio
            and e.hs_created_at < p.inicio + v_step
        )::integer as criados,
        count(e.*) filter (
          where e.is_won
            and e.hs_closed_at >= p.inicio
            and e.hs_closed_at < p.inicio + v_step
        )::integer as ganhos,
        count(e.*) filter (
          where e.is_closed
            and not e.is_won
            and e.hs_closed_at >= p.inicio
            and e.hs_closed_at < p.inicio + v_step
        )::integer as perdidos,
        round(coalesce(sum(e.amount_home) filter (
          where e.is_won
            and e.hs_closed_at >= p.inicio
            and e.hs_closed_at < p.inicio + v_step
        ), 0)::numeric, 2) as receita
      from periodos p
      left join escopo e
        on (e.hs_created_at >= p.inicio and e.hs_created_at < p.inicio + v_step)
        or (e.hs_closed_at >= p.inicio and e.hs_closed_at < p.inicio + v_step)
      group by p.inicio
    )
    select jsonb_build_object(
      'domain', 'commercial',
      'grain', v_grain,
      'period_from', p_from,
      'period_to', p_to,
      'series', coalesce((
        select jsonb_agg(row_to_json(x) order by x.period)
        from (
          select inicio::date as period,
            criados as created,
            ganhos as won,
            perdidos as lost,
            receita as won_amount,
            case when ganhos + perdidos > 0
              then round((ganhos::numeric / (ganhos + perdidos)) * 100, 1)
              else null end as win_rate
          from serie
        ) x
      ), '[]'::jsonb),
      'legend', jsonb_build_object(
        'created', 'Considera a data de criação do negócio.',
        'won', 'Considera a data de fechamento.',
        'win_rate', 'Ganhos sobre encerrados no próprio período; vazio quando nada encerrou.'
      )
    ) into v_result;

  elsif p_domain = 'finance' then
    with periodos as (
      select generate_series(
        date_trunc(v_bucket, p_from::timestamptz),
        date_trunc(v_bucket, p_to::timestamptz),
        v_step
      ) as inicio
    ),
    escopo as (
      select r.due_date, r.last_received_date, r.received_amount, r.balance, r.is_cancelled
      from public.analytics_finance_receivables r
      where r.is_current and not coalesce(r.is_cancelled, false)
    ),
    serie as (
      select
        p.inicio,
        round(coalesce(sum(e.received_amount) filter (
          where e.last_received_date >= p.inicio
            and e.last_received_date < p.inicio + v_step
        ), 0)::numeric, 2) as recebido,
        round(coalesce(sum(e.balance) filter (
          where e.due_date >= p.inicio
            and e.due_date < p.inicio + v_step
            and coalesce(e.balance, 0) > 0
        ), 0)::numeric, 2) as previsto,
        round(coalesce(sum(e.balance) filter (
          where e.due_date >= p.inicio
            and e.due_date < p.inicio + v_step
            and coalesce(e.balance, 0) > 0
            and e.due_date < current_date
        ), 0)::numeric, 2) as vencido
      from periodos p
      left join escopo e
        on (e.last_received_date >= p.inicio and e.last_received_date < p.inicio + v_step)
        or (e.due_date >= p.inicio and e.due_date < p.inicio + v_step)
      group by p.inicio
    )
    select jsonb_build_object(
      'domain', 'finance',
      'grain', v_grain,
      'period_from', p_from,
      'period_to', p_to,
      'series', coalesce((
        select jsonb_agg(row_to_json(x) order by x.period)
        from (
          select inicio::date as period,
            recebido as received,
            previsto as expected,
            vencido as overdue
          from serie
        ) x
      ), '[]'::jsonb),
      'legend', jsonb_build_object(
        'received', 'Considera a data da baixa efetiva.',
        'expected', 'Considera o vencimento dos títulos ainda em aberto.',
        'overdue', 'Parcela do previsto cujo vencimento já passou.'
      )
    ) into v_result;

  else
    v_result := jsonb_build_object(
      'domain', p_domain,
      'grain', v_grain,
      'series', '[]'::jsonb,
      'unavailable_reason', 'history_insufficient'
    );
  end if;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

revoke all on function public.rpc_analytics_timeseries(text, date, date, text) from public, anon;
grant execute on function public.rpc_analytics_timeseries(text, date, date, text) to authenticated, service_role;

comment on function public.rpc_analytics_timeseries(text, date, date, text) is
  'Series temporais com junção restrita ao bucket, preservando o contrato e evitando cross join entre períodos e todos os registros.';

commit;
