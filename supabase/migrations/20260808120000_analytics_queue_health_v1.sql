-- ANALYTICS-QUEUE-HEALTH-V1
--
-- Fase 1 da especificação `specs/2026-08-08_saude-da-fila-e-papel-do-pipeline.md`:
-- tornar a estagnação visível **sem mudar nenhum número já publicado**.
--
-- O problema medido em produção
-- -----------------------------
-- A fila publica 2.851 atendimentos, e 2.199 deles — 77% — não têm atividade há
-- mais de seis meses. Dois pipelines concentram 84% do total, quase tudo em
-- "Novo", nunca triado. Um deles recebeu dois atendimentos em trinta dias e
-- carrega 947 parados: é um depósito, não uma fila.
--
-- Quem lê "Fila atual: 2.851" entende que 2.851 pessoas esperam atendimento. A
-- leitura correta é 652 aguardando e 2.199 abandonados. São conclusões
-- operacionais opostas a partir do mesmo número.
--
-- Por que esta migration não corrige o indicador
-- ----------------------------------------------
-- Corrigir exige decidir quais pipelines são fila de trabalho, e essa decisão é
-- da operação, não do código. Adivinhar pelo nome ou pelo volume seria a mesma
-- armadilha da etapa "Concluída": funcionaria hoje e quebraria no próximo
-- pipeline criado.
--
-- Então esta migration faz duas coisas e nenhuma terceira. Cria o lugar onde a
-- decisão vai morar, vazio, com todos em "a classificar". E publica a medição de
-- estagnação, que não depende de decisão alguma para ser verdadeira.
--
-- Nenhum read model existente é alterado. `open_backlog` continua contando
-- exatamente o que contava ontem.

-- ---------------------------------------------------------------------------
-- 1. Onde a decisão vai morar
-- ---------------------------------------------------------------------------

alter table public.analytics_source_config
  add column if not exists queue_role text not null default 'a_classificar',
  add column if not exists queue_role_decided_by uuid,
  add column if not exists queue_role_decided_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'analytics_source_config_queue_role_check'
  ) then
    alter table public.analytics_source_config
      add constraint analytics_source_config_queue_role_check
      check (queue_role in ('trabalhada', 'caixa_de_entrada', 'a_classificar'));
  end if;
end $$;

comment on column public.analytics_source_config.queue_role is
  'Papel do pipeline, decidido por pessoa: trabalhada, caixa_de_entrada ou a_classificar. Pipeline novo entra como a_classificar e fica fora do indicador de fila — o padrão seguro é não entrar sem ninguém saber.';

-- ---------------------------------------------------------------------------
-- 2. O limiar de estagnação, em um lugar só
-- ---------------------------------------------------------------------------
--
-- 180 dias foi escolhido por ser o ponto em que a distribuição real se separa
-- com clareza, não por convenção. Fica como função para que a tela possa
-- imprimir o número que a fórmula usa, em vez de repeti-lo por conta própria e
-- divergir no dia em que ele mudar.

create or replace function app_private.queue_stagnation_days()
returns integer
language sql
immutable
set search_path = ''
as $$ select 180 $$;

comment on function app_private.queue_stagnation_days() is
  'Dias sem atividade a partir dos quais um atendimento é considerado estagnado. Fonte única para o cálculo e para o texto da tela.';

-- ---------------------------------------------------------------------------
-- 3. A medição
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
      t.last_activity_at,
      -- Atendimento sem data de atividade conta como estagnado, e a tela diz
      -- isso. Tratar ausência como "recente" inverteria o sinal justamente nos
      -- registros mais suspeitos.
      (t.last_activity_at is null or t.last_activity_at < now() - make_interval(days => v_limiar)) as estagnado
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
     and s.metadata ->> 'ticketState' = 'OPEN'
  ),
  por_pipeline as (
    select
      pipeline_id,
      pipeline_label,
      queue_role,
      count(*)::integer as in_queue,
      count(*) filter (where estagnado)::integer as stagnant,
      count(*) filter (where hs_created_at >= now() - interval '30 days')::integer as arrived_30d,
      round(percentile_cont(0.5) within group (
        order by extract(epoch from (now() - hs_created_at)) / 86400
      )::numeric, 0) as median_age_days
    from fila
    group by 1, 2, 3
  )
  select jsonb_build_object(
    'stagnation_threshold_days', v_limiar,
    'total_in_queue', coalesce((select sum(in_queue) from por_pipeline), 0),
    'total_stagnant', coalesce((select sum(stagnant) from por_pipeline), 0),
    'pipelines', coalesce((
      select jsonb_agg(row_to_json(x) order by x.in_queue desc)
      from (
        select
          pipeline_id, pipeline_label, queue_role,
          in_queue, stagnant, arrived_30d, median_age_days,
          case when in_queue > 0
            then round(100.0 * stagnant / in_queue, 1)
            else null end as stagnant_rate
        from por_pipeline
      ) x
    ), '[]'::jsonb),
    -- Cobertura da decisão, no mesmo formato que o resto do painel usa. Enquanto
    -- for zero, a tela diz que nenhuma classificação foi feita em vez de sugerir
    -- que o recorte já vale.
    'classified_pipelines', (
      select count(*)::integer from public.analytics_source_config
      where object_type = 'ticket' and is_active and not coalesce(is_archived, false)
        and queue_role <> 'a_classificar'
    ),
    'total_pipelines', (
      select count(*)::integer from public.analytics_source_config
      where object_type = 'ticket' and is_active and not coalesce(is_archived, false)
    )
  ) into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_support_queue_health() is
  'Saúde da fila por pipeline: quantos esperam, quantos estão parados além do limiar, quantos entraram no mês e qual o papel decidido. Mede o que é verdade independentemente de decisão; não altera nenhum indicador publicado.';

revoke all on function public.rpc_analytics_support_queue_health() from public, anon;
grant execute on function public.rpc_analytics_support_queue_health() to authenticated, service_role;

revoke all on function app_private.queue_stagnation_days() from public, anon;
