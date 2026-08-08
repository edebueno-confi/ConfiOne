-- ANALYTICS-QUEUE-HEALTH-V2
--
-- A v1 tratava atendimento sem data de atividade como estagnado. Numa base com o
-- campo preenchido isso é conservador e correto. Numa base onde o campo ainda
-- não foi ingerido, produz "100% parado, 0 em movimento" — uma afirmação
-- confiante sobre um dado que não existe, que é exatamente o que o painel
-- inteiro foi construído para não fazer.
--
-- O defeito apareceu no QA visual contra o banco local, e não em nenhuma
-- verificação de código: a tela dizia "0 em movimento" com a mesma tipografia
-- que usaria para um zero medido.
--
-- A v2 separa as duas coisas. Estagnado passa a exigir data de atividade
-- conhecida e antiga. Sem data vira uma terceira contagem, publicada, e a
-- proporção passa a ser calculada apenas sobre o que tem data — de modo que a
-- tela possa declarar a medição como parcial quando a lacuna pesar.

create or replace function public.rpc_analytics_support_queue_health()
returns jsonb language plpgsql stable security definer set search_path = ''
as $fn$
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
      t.last_activity_at,
      t.last_activity_at is null as sem_data,
      (t.last_activity_at is not null and t.last_activity_at < now() - make_interval(days => v_limiar)) as estagnado
    from public.hubspot_tickets t
    join public.analytics_source_config c
      on c.object_type = 'ticket' and c.hubspot_pipeline_id = t.pipeline_id
     and c.is_active and not coalesce(c.is_archived, false)
    join public.hubspot_pipeline_stages s
      on s.object_type = 'ticket' and s.pipeline_id = t.pipeline_id
     and s.stage_id = t.pipeline_stage and s.metadata ->> 'ticketState' = 'OPEN'
  ),
  por_pipeline as (
    select pipeline_id, pipeline_label, queue_role,
      count(*)::integer as in_queue,
      count(*) filter (where estagnado)::integer as stagnant,
      count(*) filter (where sem_data)::integer as unknown_activity,
      count(*) filter (where hs_created_at >= now() - interval '30 days')::integer as arrived_30d,
      round(percentile_cont(0.5) within group (
        order by extract(epoch from (now() - hs_created_at)) / 86400)::numeric, 0) as median_age_days
    from fila group by 1, 2, 3
  )
  select jsonb_build_object(
    'stagnation_threshold_days', v_limiar,
    'total_in_queue', coalesce((select sum(in_queue) from por_pipeline), 0),
    'total_stagnant', coalesce((select sum(stagnant) from por_pipeline), 0),
    'total_unknown_activity', coalesce((select sum(unknown_activity) from por_pipeline), 0),
    'pipelines', coalesce((
      select jsonb_agg(row_to_json(x) order by x.in_queue desc)
      from (
        select pipeline_id, pipeline_label, queue_role, in_queue, stagnant,
          unknown_activity, arrived_30d, median_age_days,
          -- A proporcao considera apenas o que tem data. Dividir pelo total
          -- diluiria o percentual com registros que nao sabemos classificar.
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
$fn$;

comment on function public.rpc_analytics_support_queue_health() is
  'Saude da fila por pipeline. Estagnado exige data de atividade conhecida e antiga; sem data e contado a parte, para que ausencia de dado nunca seja publicada como certeza de abandono.';

revoke all on function public.rpc_analytics_support_queue_health() from public, anon;
grant execute on function public.rpc_analytics_support_queue_health() to authenticated, service_role;
