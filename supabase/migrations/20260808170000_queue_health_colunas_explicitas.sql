-- QUEUE-HEALTH — colunas explícitas no CTE de marcação
--
-- O gate de qualidade apontou a seleção ampla do CTE `marcada`. Era seleção
-- sobre um CTE próprio e não sobre tabela, então não havia risco de custo nem de
-- contrato — mas o aviso é justo por outro motivo: seleção ampla dentro de um
-- CTE esconde quais colunas a etapa seguinte realmente usa, e quem lê precisa
-- subir o arquivo para descobrir.
--
-- Nenhuma mudança de comportamento. Só a lista explícita do que passa adiante.

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
