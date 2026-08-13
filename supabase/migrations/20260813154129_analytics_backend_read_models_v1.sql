-- Read models v1: the backend owns operational classifications and derived
-- aggregates; the frontend only normalizes the wire format for rendering.

create or replace function public.rpc_analytics_support_customer_debt_read_model()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_base jsonb;
  v_companies jsonb;
  v_high_priority integer;
  v_in_worked_queue integer;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  v_base := public.rpc_analytics_support_customer_debt();

  with source_rows as (
    select value as company
    from jsonb_array_elements(coalesce(v_base -> 'companies', '[]'::jsonb))
  ), enriched as (
    select
      company || jsonb_build_object(
        'priority', case
          when coalesce((company ->> 'oldest_days_silent')::integer, 0) >= 365
            or coalesce((company ->> 'tickets')::integer, 0) >= 10 then 'alta'
          when coalesce((company ->> 'oldest_days_silent')::integer, 0) >= 270
            or coalesce((company ->> 'tickets')::integer, 0) >= 3 then 'media'
          else 'baixa'
        end
      ) as company
    from source_rows
  )
  select
    coalesce(jsonb_agg(company order by coalesce((company ->> 'tickets')::integer, 0) desc, coalesce((company ->> 'oldest_days_silent')::integer, 0) desc), '[]'::jsonb),
    count(*) filter (where company ->> 'priority' = 'alta')::integer,
    coalesce(sum(coalesce((company ->> 'tickets_in_worked_queue')::integer, 0)), 0)::integer
  into v_companies, v_high_priority, v_in_worked_queue
  from enriched;

  return v_base || jsonb_build_object(
    'companies', v_companies,
    'high_priority', coalesce(v_high_priority, 0),
    'in_worked_queue', coalesce(v_in_worked_queue, 0)
  );
end;
$$;

comment on function public.rpc_analytics_support_customer_debt_read_model() is
  'Read model da divida com clientes. Publica prioridade e agregados derivados no backend; preserva o RPC operacional legado.';

revoke all on function public.rpc_analytics_support_customer_debt_read_model() from public, anon;
grant execute on function public.rpc_analytics_support_customer_debt_read_model() to authenticated, service_role;

create or replace function public.rpc_analytics_support_queue_health_read_model(
  p_group_company text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_base jsonb;
  v_in_queue integer;
  v_stagnant integer;
  v_unknown integer;
  v_measured integer;
  v_classified integer;
  v_total integer;
  v_rate numeric;
  v_coverage_warning text;
  v_notice text;
  v_pipelines jsonb;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  v_base := public.rpc_analytics_support_queue_health_by_operation(p_group_company);
  v_in_queue := coalesce((v_base ->> 'total_in_queue')::integer, 0);
  v_stagnant := coalesce((v_base ->> 'total_stagnant')::integer, 0);
  v_unknown := coalesce((v_base ->> 'total_unknown_activity')::integer, 0);
  v_measured := greatest(0, v_in_queue - v_unknown);
  v_classified := coalesce((v_base ->> 'classified_pipelines')::integer, 0);
  v_total := coalesce((v_base ->> 'total_pipelines')::integer, 0);
  v_rate := case when v_measured > 0 then round((100.0 * v_stagnant / v_measured)::numeric, 1) else null end;

  v_coverage_warning := case
    when v_in_queue = 0 or v_unknown = 0 then null
    when v_unknown >= v_in_queue then 'Nenhum atendimento da fila tem registro de última atividade, então não é possível separar o que está em andamento do que está parado. A sincronização precisa trazer esse dado.'
    else v_unknown::text || ' atendimentos (' || round(100.0 * v_unknown / v_in_queue)::integer::text || '%) não têm registro de última atividade e ficam fora desta leitura.'
  end;

  v_notice := case
    when v_total = 0 then null
    when v_classified = 0 then 'Nenhum pipeline teve o papel definido ainda, então "Fila atual" segue contando todos eles. A contagem só muda depois que alguém decidir quais são filas de trabalho.'
    when v_classified < v_total and v_total - v_classified = 1 then 'Um pipeline ainda não teve o papel definido e segue contando na fila.'
    when v_classified < v_total then (v_total - v_classified)::text || ' pipelines ainda não tiveram o papel definido e seguem contando na fila.'
    else null
  end;

  with source_rows as (
    select value as pipeline
    from jsonb_array_elements(coalesce(v_base -> 'pipelines', '[]'::jsonb))
  ), enriched as (
    select pipeline || jsonb_build_object(
      'suggests_inbox',
      coalesce((pipeline ->> 'in_queue')::integer, 0) >= 20
      and coalesce((pipeline ->> 'stagnant_rate')::numeric, -1) >= 60
      and coalesce((pipeline ->> 'arrived_30d')::integer, 0) <= 5
    ) as pipeline
    from source_rows
  )
  select coalesce(jsonb_agg(pipeline), '[]'::jsonb)
  into v_pipelines
  from enriched;

  return v_base || jsonb_build_object(
    'available', v_in_queue > 0 and jsonb_array_length(v_pipelines) > 0 and v_measured > 0,
    'measured', v_measured,
    'moving', greatest(0, v_measured - v_stagnant),
    'partial', v_in_queue > 0 and v_unknown > 0,
    'stagnant_rate', v_rate,
    'coverage_warning', v_coverage_warning,
    'notice', v_notice,
    'pipelines', v_pipelines
  );
end;
$$;

comment on function public.rpc_analytics_support_queue_health_read_model(text) is
  'Read model da saúde da fila. Publica cobertura, taxa, aviso, movimento e sugestões derivadas no backend; preserva os RPCs de medição legados.';

revoke all on function public.rpc_analytics_support_queue_health_read_model(text) from public, anon;
grant execute on function public.rpc_analytics_support_queue_health_read_model(text) to authenticated, service_role;

create or replace function app_private.analytics_ceo_executive_sections(p_snapshot jsonb)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with pipeline_rows as (
    select value as pipeline
    from jsonb_array_elements(coalesce(p_snapshot #> '{support,by_pipeline}', '[]'::jsonb))
    where nullif(value ->> 'pipeline_id', '') is not null
      and coalesce((value ->> 'ticket_count')::integer, 0) > 0
  ), ranked_pipelines as (
    select jsonb_build_object(
      'pipeline_id', pipeline ->> 'pipeline_id',
      'label', coalesce(nullif(pipeline ->> 'label', ''), 'Pipeline sem nome'),
      'ticket_count', coalesce((pipeline ->> 'ticket_count')::integer, 0)
    ) as item
    from pipeline_rows
    order by coalesce((pipeline ->> 'ticket_count')::integer, 0) desc,
      lower(coalesce(pipeline ->> 'label', '')) asc,
      pipeline ->> 'pipeline_id' asc
    limit 5
  ), exception_rows as (
    select jsonb_build_object(
      'key', 'support-high-priority',
      'domain', 'Suporte',
      'severity', 2,
      'count', (p_snapshot #>> '{support,high_priority_open}')::integer,
      'amount', 0
    ) as item, 2 as severity, 'support-high-priority' as key
    where coalesce((p_snapshot #>> '{support,high_priority_open}')::integer, 0) > 0
    union all
    select jsonb_build_object(
      'key', 'finance-overdue',
      'domain', 'Financeiro',
      'severity', 3,
      'count', (p_snapshot #>> '{finance,overdue_titles}')::integer,
      'amount', (p_snapshot #>> '{finance,overdue_balance}')::numeric
    ) as item, 3 as severity, 'finance-overdue' as key
    where coalesce((p_snapshot #>> '{finance,overdue_balance}')::numeric, 0) > 0
  ), ranked_exceptions as (
    select item
    from exception_rows
    order by severity desc, key asc
    limit 3
  )
  select jsonb_build_object(
    'executive_pipelines', coalesce((select jsonb_agg(item) from ranked_pipelines), '[]'::jsonb),
    'executive_exceptions', coalesce((select jsonb_agg(item) from ranked_exceptions), '[]'::jsonb)
  );
$$;

revoke all on function app_private.analytics_ceo_executive_sections(jsonb) from public, anon, authenticated, service_role;

create or replace function public.rpc_analytics_ceo_dashboard(
  p_from date default null,
  p_to date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
set statement_timeout = '30s'
as $$
declare
  current_from date := coalesce(p_from, date_trunc('month', current_date)::date);
  current_to date := coalesce(p_to, current_date);
  period_days integer;
  previous_from date;
  previous_to date;
  current_payload jsonb;
  previous_payload jsonb;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado a visao executiva.' using errcode = '42501';
  end if;

  if current_to < current_from then
    raise exception 'Periodo invalido: data final anterior a data inicial';
  end if;

  period_days := (current_to - current_from) + 1;
  previous_to := current_from - 1;
  previous_from := previous_to - period_days + 1;

  current_payload := public.rpc_analytics_ceo_snapshot(current_from, current_to);
  previous_payload := public.rpc_analytics_ceo_snapshot(previous_from, previous_to);
  current_payload := current_payload || app_private.analytics_ceo_executive_sections(current_payload);
  previous_payload := previous_payload || app_private.analytics_ceo_executive_sections(previous_payload);

  return jsonb_build_object(
    'snapshot', current_payload,
    'history', jsonb_build_object(
      'current_from', current_from,
      'current_to', current_to,
      'previous_from', previous_from,
      'previous_to', previous_to,
      'current', current_payload,
      'previous', previous_payload
    )
  );
end;
$$;

revoke all on function public.rpc_analytics_ceo_dashboard(date, date) from public, anon;
grant execute on function public.rpc_analytics_ceo_dashboard(date, date) to authenticated, service_role;

comment on function public.rpc_analytics_ceo_dashboard(date, date) is
  'Leitura combinada da visao executiva com ranking de pipelines e excecoes operacionais derivados no backend.';
