-- ANALYTICS-QUEUE-ROLE — FASES 2 E 3
--
-- Fase 2: a decisão sobre o papel de cada pipeline passa a ser gravável, com
-- autoria e data. Fase 3: os indicadores de Suporte passam a respeitar essa
-- decisão.
--
-- O que muda para quem lê o painel
-- --------------------------------
-- "Fila atual" sai de 2.851 para a ordem de 650, porque para de contar caixas de
-- entrada que ninguém trabalha. Os 2.199 restantes não somem: viram um indicador
-- próprio, "Passivo sem movimentação", porque são um problema real que merece
-- decisão — só não é o mesmo problema.
--
-- O fallback é a parte mais importante desta migration
-- ----------------------------------------------------
-- Enquanto ninguém classificar nada, os indicadores devolvem exatamente o que
-- devolviam ontem, com estado `partial` e motivo declarado. Sem isso, aplicar a
-- migration zeraria a fila do dia para a noite e o painel diria "0 aguardando
-- atendimento" — número falso, com a mesma cara de número medido.
--
-- Faixas em vez de um limiar só
-- -----------------------------
-- O corte de 180 dias foi escolhido olhando a distribuição real, onde o volume
-- quase triplica entre 91-180 e 181-365 dias. Ainda assim é escolha minha, e
-- quem lê não tem como conferir. As faixas resolvem isso: um atendimento parado
-- há 200 dias e outro há 700 aparecem separados, e a decisão sobre o que cada
-- faixa merece deixa de depender do meu número.

-- ---------------------------------------------------------------------------
-- 1. Gravar a decisão (Fase 2)
-- ---------------------------------------------------------------------------

create or replace function public.rpc_admin_update_pipeline_queue_role(
  p_pipeline_id text,
  p_queue_role text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_updated integer;
begin
  -- Classificar muda o número que a organização inteira lê. Exige o mesmo
  -- privilégio do editor de cruzamento de etapas, não o de quem só consulta.
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  if p_queue_role not in ('trabalhada', 'caixa_de_entrada', 'a_classificar') then
    raise exception 'Papel inválido.' using errcode = '22023';
  end if;

  update public.analytics_source_config
     set queue_role = p_queue_role,
         -- Autoria e data são gravadas aqui, nunca recebidas do cliente: quem
         -- decidiu é fato do servidor.
         queue_role_decided_by = case when p_queue_role = 'a_classificar' then null else v_actor end,
         queue_role_decided_at = case when p_queue_role = 'a_classificar' then null else timezone('utc', now()) end,
         updated_at = timezone('utc', now())
   where object_type = 'ticket'
     and hubspot_pipeline_id = p_pipeline_id;

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise exception 'Pipeline não encontrado.' using errcode = 'P0002';
  end if;

  return jsonb_build_object('pipeline_id', p_pipeline_id, 'queue_role', p_queue_role, 'updated', v_updated);
end;
$$;

comment on function public.rpc_admin_update_pipeline_queue_role(text, text) is
  'Registra o papel de um pipeline com autoria e data. Voltar para a_classificar limpa a autoria, porque deixa de haver decisão.';

revoke all on function public.rpc_admin_update_pipeline_queue_role(text, text) from public, anon;
grant execute on function public.rpc_admin_update_pipeline_queue_role(text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Saúde da fila com faixas de idade (v3)
-- ---------------------------------------------------------------------------

create or replace function public.rpc_analytics_support_queue_health()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_limiar integer := app_private.queue_stagnation_days();
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  with fila as (
    select
      c.hubspot_pipeline_id as pipeline_id,
      coalesce(nullif(c.label, ''), nullif(c.hubspot_pipeline_label, ''), c.hubspot_pipeline_id) as pipeline_label,
      c.queue_role,
      t.hs_created_at,
      t.last_activity_at is null as sem_data,
      case when t.last_activity_at is null then null
        else extract(epoch from (now() - t.last_activity_at)) / 86400.0
      end as dias_sem_toque
    from public.hubspot_tickets t
    join public.analytics_source_config c
      on c.object_type = 'ticket' and c.hubspot_pipeline_id = t.pipeline_id
     and c.is_active and not coalesce(c.is_archived, false)
    join public.hubspot_pipeline_stages s
      on s.object_type = 'ticket' and s.pipeline_id = t.pipeline_id
     and s.stage_id = t.pipeline_stage and s.metadata ->> 'ticketState' = 'OPEN'
  ),
  marcada as (
    -- Colunas explícitas: dentro de um CTE, listar o que passa adiante evita que
    -- quem lê precise subir o arquivo para saber o que a etapa seguinte usa.
    select
      pipeline_id, pipeline_label, queue_role, hs_created_at, sem_data, dias_sem_toque,
      (dias_sem_toque is not null and dias_sem_toque > v_limiar) as estagnado
    from fila
  ),
  por_pipeline as (
    select pipeline_id, pipeline_label, queue_role,
      count(*)::integer as in_queue,
      count(*) filter (where estagnado)::integer as stagnant,
      count(*) filter (where sem_data)::integer as unknown_activity,
      count(*) filter (where hs_created_at >= now() - interval '30 days')::integer as arrived_30d,
      round(percentile_cont(0.5) within group (
        order by extract(epoch from (now() - hs_created_at)) / 86400)::numeric, 0) as median_age_days
    from marcada group by 1, 2, 3
  ),
  -- Faixas fixas e nomeadas. Elas não dependem do limiar: existem para que o
  -- limiar possa ser conferido por quem lê, em vez de aceito como dado.
  faixas as (
    select coalesce(jsonb_agg(row_to_json(f) order by f.sort_order), '[]'::jsonb) as payload
    from (
      select 1 as sort_order, 'Até 30 dias' as bucket,
        count(*) filter (where dias_sem_toque <= 30)::integer as tickets from marcada
      union all select 2, 'De 1 a 3 meses', count(*) filter (where dias_sem_toque > 30 and dias_sem_toque <= 90)::integer from marcada
      union all select 3, 'De 3 a 6 meses', count(*) filter (where dias_sem_toque > 90 and dias_sem_toque <= 180)::integer from marcada
      union all select 4, 'De 6 meses a 1 ano', count(*) filter (where dias_sem_toque > 180 and dias_sem_toque <= 365)::integer from marcada
      union all select 5, 'De 1 a 2 anos', count(*) filter (where dias_sem_toque > 365 and dias_sem_toque <= 730)::integer from marcada
      union all select 6, 'Mais de 2 anos', count(*) filter (where dias_sem_toque > 730)::integer from marcada
      union all select 7, 'Sem registro de atividade', count(*) filter (where sem_data)::integer from marcada
    ) f
  )
  select jsonb_build_object(
    'stagnation_threshold_days', v_limiar,
    'total_in_queue', coalesce((select sum(in_queue) from por_pipeline), 0),
    'total_stagnant', coalesce((select sum(stagnant) from por_pipeline), 0),
    'total_unknown_activity', coalesce((select sum(unknown_activity) from por_pipeline), 0),
    'age_buckets', (select payload from faixas),
    'pipelines', coalesce((
      select jsonb_agg(row_to_json(x) order by x.in_queue desc)
      from (
        select pipeline_id, pipeline_label, queue_role, in_queue, stagnant,
          unknown_activity, arrived_30d, median_age_days,
          case when in_queue - unknown_activity > 0
            then round(100.0 * stagnant / (in_queue - unknown_activity), 1)
            else null end as stagnant_rate
        from por_pipeline
      ) x
    ), '[]'::jsonb),
    'classified_pipelines', (
      select count(*)::integer from public.analytics_source_config
      where object_type = 'ticket' and is_active and not coalesce(is_archived, false)
        and queue_role <> 'a_classificar'),
    'total_pipelines', (
      select count(*)::integer from public.analytics_source_config
      where object_type = 'ticket' and is_active and not coalesce(is_archived, false))
  ) into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_support_queue_health() is
  'Saude da fila por pipeline, com faixas de idade. Estagnado exige data de atividade conhecida e antiga; sem data e contado a parte.';

revoke all on function public.rpc_analytics_support_queue_health() from public, anon;
grant execute on function public.rpc_analytics_support_queue_health() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. A dívida com clientes
-- ---------------------------------------------------------------------------
--
-- Dos atendimentos parados, a maioria esmagadora não tem empresa no CRM: são
-- e-mails de formulário e mensagens de WhatsApp que nunca viraram relação. Não
-- há o que tratar um a um.
--
-- Os que **têm** empresa são outra coisa: clientes que pediram algo e nunca
-- tiveram resposta. Esses cabem numa lista, e a lista cabe numa semana de
-- trabalho. É o único recorte do passivo que devolve algo a alguém.

create or replace function public.rpc_analytics_support_customer_debt()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_limiar integer := app_private.queue_stagnation_days();
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  with parados as (
    select
      t.ticket_id, t.subject, t.hs_created_at, t.last_activity_at, t.owner_id,
      coalesce(nullif(c.label, ''), nullif(c.hubspot_pipeline_label, ''), c.hubspot_pipeline_id) as pipeline_label,
      v.company_id,
      round((extract(epoch from (now() - t.last_activity_at)) / 86400)::numeric, 0) as days_silent
    from public.hubspot_tickets t
    join public.analytics_source_config c
      on c.object_type = 'ticket' and c.hubspot_pipeline_id = t.pipeline_id
     and c.is_active and not coalesce(c.is_archived, false)
    join public.hubspot_pipeline_stages s
      on s.object_type = 'ticket' and s.pipeline_id = t.pipeline_id
     and s.stage_id = t.pipeline_stage and s.metadata ->> 'ticketState' = 'OPEN'
    join public.vw_analytics_ticket_company v on v.ticket_id = t.ticket_id
    where t.last_activity_at is not null
      and t.last_activity_at < now() - make_interval(days => v_limiar)
      and v.company_id is not null
  ),
  por_empresa as (
    select
      p.company_id,
      coalesce(nullif(co.name, ''), 'Empresa sem nome') as company_name,
      count(*)::integer as tickets,
      max(p.days_silent)::integer as oldest_days_silent,
      round(avg(p.days_silent)::numeric, 0)::integer as avg_days_silent,
      coalesce(jsonb_agg(jsonb_build_object(
        'ticket_id', p.ticket_id,
        'subject', coalesce(nullif(p.subject, ''), 'Sem assunto'),
        'pipeline_label', p.pipeline_label,
        'days_silent', p.days_silent,
        'owner_name', coalesce(ow.full_name, 'Sem responsável')
      ) order by p.days_silent desc), '[]'::jsonb) as tickets_detail
    from parados p
    left join public.hubspot_companies co on co.company_id = p.company_id
    left join public.hubspot_owners ow on ow.owner_id = p.owner_id
    group by 1, 2
  )
  select jsonb_build_object(
    'threshold_days', v_limiar,
    'total_tickets', coalesce((select sum(tickets) from por_empresa), 0),
    'total_companies', coalesce((select count(*) from por_empresa), 0),
    'companies', coalesce((
      select jsonb_agg(row_to_json(x) order by x.tickets desc, x.oldest_days_silent desc)
      from por_empresa x
    ), '[]'::jsonb)
  ) into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_support_customer_debt() is
  'Atendimentos sem resposta alem do limiar que pertencem a uma empresa do CRM, agrupados por empresa. E o recorte do passivo que representa divida com cliente, e nao ruido de caixa de entrada.';

revoke all on function public.rpc_analytics_support_customer_debt() from public, anon;
grant execute on function public.rpc_analytics_support_customer_debt() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Aplicar o recorte aos indicadores de Suporte (Fase 3)
-- ---------------------------------------------------------------------------
--
-- Três mudanças cirúrgicas em `rpc_analytics_support_kpis_v2`, e nada mais:
--
--   `open_backlog` passa a contar apenas pipelines de fila de trabalho;
--   `median_backlog_age_days` passa a ser calculada sobre essa mesma fila;
--   `dormant_backlog` aparece, com o que saiu.
--
-- Todo o resto — criados, resolvidos, primeira resposta, reabertura, aging,
-- quebras por prioridade, origem, responsável e pipeline — segue exatamente
-- como estava. Alargar o escopo desta migration seria trocar um número
-- publicado sem ter sido pedido.
--
-- O fallback: enquanto `classified = 0`, `open_backlog` volta a contar tudo, com
-- estado `partial` e motivo declarado. Sem ele, aplicar esta migration
-- publicaria "0 aguardando atendimento" — falso, e com cara de medido.

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
      -- Enquanto ninguém decidiu, todo pipeline conta como fila. É o
      -- comportamento de ontem, preservado de propósito.
      (v_classificados = 0 or c.queue_role = 'trabalhada') as conta_como_fila,
      r.resolved_at, r.resolution_days, r.resolution_source,
      r.first_response_hours, r.has_history,
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
      count(*) filter (where nullif(btrim(coalesce(time_to_first_response_sla_status, '')), '') is not null)::integer as frt_sla_rows,
      count(*) filter (where nullif(btrim(coalesce(time_to_close_sla_status, '')), '') is not null)::integer as close_sla_rows
    from scoped
  ),
  resolution_state as (
    select
      case when cv.closed_rows = 0 then 'unavailable'
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
    select
      case when cv.with_first_response = 0 then 'unavailable'
           when cv.with_first_response < cv.total_rows then 'partial'
           else 'available' end as state,
      case when cv.with_first_response = 0 then 'ticket_first_response_missing'
           when cv.with_first_response < cv.total_rows then 'first_response_partial'
           else null end as reason
    from coverage cv
  ),
  reopen_state as (
    select
      case when cv.with_history = 0 then 'awaiting_history'
           when cv.with_history < cv.total_rows then 'partial'
           else 'available' end as state,
      case when cv.with_history = 0 then 'history_insufficient'
           when cv.with_history < cv.total_rows then 'ticket_history_partial'
           else null end as reason
    from coverage cv
  ),
  -- O estado da fila deixa de depender só da ingestão e passa a depender também
  -- da decisão humana. Sem classificação, o número é o antigo e é declarado
  -- parcial — o painel diz que o recorte ainda não vale.
  queue_state as (
    select
      case when v_classificados = 0 then 'partial' else 'available' end as state,
      case when v_classificados = 0 then 'queue_role_unclassified' else null end as reason
  ),
  backlog as (
    select
      count(*) filter (where is_open and conta_como_fila)::integer as open_tickets,
      count(*) filter (where is_open and not conta_como_fila)::integer as dormant_tickets,
      round(percentile_cont(0.5) within group (
        order by extract(epoch from (timezone('utc', now()) - hs_created_at)) / 86400.0
      ) filter (where is_open and conta_como_fila)::numeric, 1) as median_backlog_age_days,
      count(*) filter (
        where is_open and conta_como_fila
          and last_activity_at is not null
          and last_activity_at < now() - make_interval(days => v_limiar)
      )::integer as stagnant_in_queue
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
      count(*) filter (where reopened_count > 0)::integer as reopened_tickets
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
        select
          case when hours < v_buckets[1] then '< ' || v_buckets[1] || 'h'
               when hours < v_buckets[2] then v_buckets[1] || '-' || v_buckets[2] || 'h'
               when hours < v_buckets[3] then v_buckets[2] || 'h-' || (v_buckets[3] / 24) || 'd'
               when hours < v_buckets[4] then (v_buckets[3] / 24) || '-' || (v_buckets[4] / 24) || 'd'
               else '> ' || (v_buckets[4] / 24) || 'd' end as bucket,
          case when hours < v_buckets[1] then 1 when hours < v_buckets[2] then 2
               when hours < v_buckets[3] then 3 when hours < v_buckets[4] then 4 else 5 end as sort_order
        from (
          select extract(epoch from (timezone('utc', now()) - hs_created_at)) / 3600.0 as hours
          from scoped where is_open and conta_como_fila and hs_created_at is not null
        ) h
      ) b group by bucket, sort_order
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
               where sc.resolved_at::date between p_from and p_to)::numeric, 1) as median_resolution_days
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
             max(queue_role) as queue_role,
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
      'period_from', p_from, 'period_to', p_to,
      'coverage_percent', app_private.kpi_ratio(cv.closed_with_date, nullif(cv.closed_rows, 0)),
      'is_partial', cv.closed_with_date < cv.closed_rows or cv.with_first_response < cv.total_rows or v_classificados = 0,
      'history_days', sh.days,
      'classified_pipelines', v_classificados,
      'warning_codes',
        (case when rst.reason is not null then jsonb_build_array(rst.reason) else '[]'::jsonb end)
        || (case when fst.reason is not null then jsonb_build_array(fst.reason) else '[]'::jsonb end)
        || (case when qst.reason is not null then jsonb_build_array(qst.reason) else '[]'::jsonb end)
    ),
    'kpis', jsonb_build_object(
      'created_tickets', app_private.kpi_entry(rc.created_tickets::numeric, 'ticket_created_at'),
      'open_backlog', app_private.kpi_entry(
        bl.open_tickets::numeric, 'ticket_state_open_now', qst.state, qst.reason),
      'dormant_backlog', app_private.kpi_entry(
        bl.dormant_tickets::numeric, 'ticket_state_open_now', qst.state, qst.reason),
      'stagnant_in_queue', app_private.kpi_entry(
        bl.stagnant_in_queue::numeric, 'ticket_last_activity_at', qst.state, qst.reason),
      'median_backlog_age_days', app_private.kpi_entry(
        bl.median_backlog_age_days, 'ticket_created_at', qst.state, qst.reason),
      'resolved_tickets', app_private.kpi_entry(rs.resolved_tickets::numeric, 'ticket_resolved_at', rst.state, rst.reason),
      'median_time_to_resolution_days', app_private.kpi_entry(rs.median_resolution_days, 'ticket_resolved_at', rst.state, rst.reason),
      'avg_time_to_resolution_days', app_private.kpi_entry(rs.avg_resolution_days, 'ticket_resolved_at', rst.state, rst.reason),
      'p90_time_to_resolution_days', app_private.kpi_entry(rs.p90_resolution_days, 'ticket_resolved_at', rst.state, rst.reason),
      'median_first_response_hours', app_private.kpi_entry(fr.median_hours, 'ticket_first_response_at', fst.state, fst.reason),
      'avg_first_response_hours', app_private.kpi_entry(fr.avg_hours, 'ticket_first_response_at', fst.state, fst.reason),
      'p90_first_response_hours', app_private.kpi_entry(fr.p90_hours, 'ticket_first_response_at', fst.state, fst.reason),
      'reopen_rate', app_private.kpi_entry(
        app_private.kpi_ratio(rs.reopened_tickets, nullif(rs.resolved_tickets, 0)),
        'ticket_stage_transition', rot.state, rot.reason),
      'first_response_sla_coverage_percent', app_private.kpi_entry(
        app_private.kpi_ratio(cv.frt_sla_rows, nullif(cv.total_rows, 0)), 'ticket_sla_status',
        case when cv.frt_sla_rows = 0 then 'unavailable' else 'partial' end,
        case when cv.frt_sla_rows = 0 then 'sla_unavailable' else 'sla_partial_coverage' end),
      'close_sla_coverage_percent', app_private.kpi_entry(
        app_private.kpi_ratio(cv.close_sla_rows, nullif(cv.total_rows, 0)), 'ticket_sla_status',
        case when cv.close_sla_rows = 0 then 'unavailable' else 'partial' end,
        case when cv.close_sla_rows = 0 then 'sla_unavailable' else 'sla_partial_coverage' end),
      'historic_backlog', app_private.kpi_entry(
        null, 'ticket_state_open_at_date', 'awaiting_history',
        case when sh.days > 1 then null else 'history_insufficient' end)
    ),
    'aging', ag.payload, 'by_priority', bp.payload, 'by_source', bs.payload,
    'by_owner', bo.payload, 'by_pipeline', bpi.payload,
    'source_coverage', jsonb_build_object(
      'tickets', cv.total_rows, 'closed', cv.closed_rows,
      'closed_with_date', cv.closed_with_date,
      'with_first_response', cv.with_first_response,
      'with_stage_history', cv.with_history,
      'classified_pipelines', v_classificados)
  ) into v_result
  from coverage cv
  cross join resolution_state rst cross join first_response_state fst
  cross join reopen_state rot cross join queue_state qst
  cross join backlog bl cross join received rc cross join resolution rs
  cross join first_response fr cross join aging ag cross join by_priority bp
  cross join by_source bs cross join by_owner bo cross join by_pipeline bpi
  cross join snapshot_history sh;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_support_kpis_v2(date, date, text, text) is
  'Indicadores de Suporte. A fila conta apenas pipelines classificados como fila de trabalho; o restante aparece como passivo. Sem nenhuma classificacao, devolve o comportamento anterior com estado parcial declarado.';

revoke all on function public.rpc_analytics_support_kpis_v2(date, date, text, text) from public, anon;
grant execute on function public.rpc_analytics_support_kpis_v2(date, date, text, text) to authenticated, service_role;
