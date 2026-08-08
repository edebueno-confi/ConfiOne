-- EMPRESA DO GRUPO E ESPERA DE TERCEIRO
--
-- Duas correções que nasceram de uma verificação na tela do HubSpot, e que
-- invalidaram a classificação feita no lote anterior.
--
-- 1. O apelido escondia de quem era o pipeline
-- -------------------------------------------
-- O pipeline 1429283 chama-se "CS | Neotrust" no HubSpot e aparecia no painel
-- como "Suporte", por causa do apelido interno. A classificação foi decidida
-- sobre esse rótulo: quem aprovou pensava no suporte da Confi e estava
-- aprovando o CS da Neotrust.
--
-- O portal do HubSpot é compartilhado por três operações do grupo — Confi,
-- Neotrust e Aftersale — e "Fila atual" somava as três num número só. Um
-- indicador assim não serve para nenhuma delas.
--
-- A convenção de emoji no nome do pipeline já codifica a operação, e é
-- deliberada: 💜 Aftersale, 🔎 Confi, 📊 Neotrust, 👁 Confi Analytics. Ela serve
-- de **semeadura**, nunca de decisão: fica registrada como sugerida até alguém
-- confirmar, porque no dia em que criarem um pipeline sem emoji a heurística
-- erra em silêncio.
--
-- 2. "Parado" não é "abandonado"
-- ------------------------------
-- Dos 177 atendimentos parados nas filas de trabalho, 117 estavam em etapas como
-- "Aguardando CS", "Aguardando Cliente" e "Pendente N2". A bola não está com o
-- atendimento: é espera legítima que ninguém encerrou.
--
-- Tratar os dois como a mesma coisa inflou o problema em quase o triplo. A
-- etapa canônica passa a carregar essa decisão, semeada por padrão de nome e
-- revisável por pessoa.

-- ---------------------------------------------------------------------------
-- 1. A operação dona do pipeline
-- ---------------------------------------------------------------------------

alter table public.analytics_source_config
  add column if not exists group_company text not null default 'a_definir',
  add column if not exists group_company_source text not null default 'pending';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'analytics_source_config_group_company_source_check') then
    alter table public.analytics_source_config
      add constraint analytics_source_config_group_company_source_check
      check (group_company_source in ('pending', 'suggested', 'confirmed'));
  end if;
end $$;

comment on column public.analytics_source_config.group_company is
  'Operacao do grupo dona do pipeline. O portal do HubSpot e compartilhado, e sem esta coluna a fila soma operacoes independentes num numero unico.';
comment on column public.analytics_source_config.group_company_source is
  'pending, suggested ou confirmed. Sugestao vem da convencao de emoji no nome do pipeline e nao vale como decisao.';

-- Semeadura pela convenção de emoji. Só preenche o que ainda está pendente, para
-- nunca sobrescrever confirmação humana.
update public.analytics_source_config
   set group_company = case
         when hubspot_pipeline_label like '💜%' then 'Aftersale'
         when hubspot_pipeline_label like '🔎%' then 'Confi'
         when hubspot_pipeline_label like '📊%' then 'Neotrust'
         when hubspot_pipeline_label like '👁%' then 'Confi Analytics'
         else 'a_definir' end,
       -- Comparação por prefixo e não por expressão regular: os emojis são
       -- sequências de vários pontos de código, e alguns trazem seletor de
       -- variação, o que quebra o agrupamento numa regex.
       group_company_source = case
         when hubspot_pipeline_label like '💜%'
           or hubspot_pipeline_label like '🔎%'
           or hubspot_pipeline_label like '📊%'
           or hubspot_pipeline_label like '👁%' then 'suggested'
         else 'pending' end,
       updated_at = timezone('utc', now())
 where object_type = 'ticket' and group_company_source = 'pending';

create or replace function public.rpc_admin_update_pipeline_group_company(
  p_pipeline_id text,
  p_group_company text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_label text := btrim(coalesce(p_group_company, ''));
  v_updated integer;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if v_label = '' then
    raise exception 'A operação não pode ficar vazia.' using errcode = '22023';
  end if;

  update public.analytics_source_config
     set group_company = v_label,
         -- Confirmar é o ato que transforma sugestão em decisão.
         group_company_source = 'confirmed',
         updated_at = timezone('utc', now())
   where object_type = 'ticket' and hubspot_pipeline_id = p_pipeline_id;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Pipeline não encontrado.' using errcode = 'P0002';
  end if;

  return jsonb_build_object('pipeline_id', p_pipeline_id, 'group_company', v_label);
end;
$$;

comment on function public.rpc_admin_update_pipeline_group_company(text, text) is
  'Confirma a operacao do grupo dona do pipeline. Confirmar e o que transforma a sugestao do emoji em decisao registrada.';

revoke all on function public.rpc_admin_update_pipeline_group_company(text, text) from public, anon;
grant execute on function public.rpc_admin_update_pipeline_group_company(text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Etapa que espera terceiro
-- ---------------------------------------------------------------------------

alter table public.analytics_stage_mapping
  add column if not exists awaits_third_party boolean;

comment on column public.analytics_stage_mapping.awaits_third_party is
  'Verdadeiro quando a etapa significa que a bola esta com o cliente ou com outra area. Nulo enquanto ninguem decidiu. Distingue espera legitima de atendimento sem dono.';

-- Semeadura por padrão de nome, apenas onde ainda não há decisão.
update public.analytics_stage_mapping
   set awaits_third_party = true
 where object_type = 'ticket'
   and awaits_third_party is null
   and canonical_label ~* '^(aguardando|pendente|avaliando)';

update public.analytics_stage_mapping
   set awaits_third_party = false
 where object_type = 'ticket'
   and awaits_third_party is null
   and canonical_label ~* '^(novo|aberto|em tratativa|em an[áa]lise|em ajuste)';

create or replace function public.rpc_admin_update_stage_waiting(
  p_pipeline_id text,
  p_stage_id text,
  p_awaits_third_party boolean
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  update public.analytics_stage_mapping
     set awaits_third_party = p_awaits_third_party,
         is_reviewed = true,
         updated_at = timezone('utc', now())
   where object_type = 'ticket' and pipeline_id = p_pipeline_id and stage_id = p_stage_id;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Etapa não encontrada.' using errcode = 'P0002';
  end if;

  return jsonb_build_object('pipeline_id', p_pipeline_id, 'stage_id', p_stage_id, 'awaits_third_party', p_awaits_third_party);
end;
$$;

comment on function public.rpc_admin_update_stage_waiting(text, text, boolean) is
  'Registra se uma etapa significa espera por terceiro. Marcar tambem conta como revisao da etapa.';

revoke all on function public.rpc_admin_update_stage_waiting(text, text, boolean) from public, anon;
grant execute on function public.rpc_admin_update_stage_waiting(text, text, boolean) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Saúde da fila por operação, separando espera de abandono
-- ---------------------------------------------------------------------------
--
-- Três mudanças de leitura:
--
-- O nome real do pipeline passa a viajar junto do apelido. Foi o apelido
-- sozinho que fez "CS | Neotrust" ser aprovado como se fosse "Suporte".
--
-- A operação do grupo entra como dimensão, com a origem da informação. Sugerido
-- e confirmado são coisas diferentes e a tela precisa poder distingui-las.
--
-- "Parado" divide-se em dois. Esperando terceiro é fila legítima que ninguém
-- encerrou; sem dono é o problema de atendimento de verdade. Etapa sem decisão
-- de espera fica num terceiro grupo, e não é empurrada para nenhum dos dois.

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
      -- O nome oficial vem primeiro na estrutura, e o apelido ao lado.
      coalesce(nullif(c.hubspot_pipeline_label, ''), c.hubspot_pipeline_id) as pipeline_name,
      nullif(c.label, '') as pipeline_alias,
      c.queue_role,
      c.group_company,
      c.group_company_source,
      t.hs_created_at,
      t.last_activity_at is null as sem_data,
      m.awaits_third_party,
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
    left join public.analytics_stage_mapping m
      on m.object_type = 'ticket' and m.pipeline_id = t.pipeline_id and m.stage_id = t.pipeline_stage
  ),
  marcada as (
    select
      pipeline_id, pipeline_name, pipeline_alias, queue_role, group_company,
      group_company_source, hs_created_at, sem_data, dias_sem_toque, awaits_third_party,
      (dias_sem_toque is not null and dias_sem_toque > v_limiar) as parado
    from fila
  ),
  por_pipeline as (
    select pipeline_id, pipeline_name, pipeline_alias, queue_role, group_company, group_company_source,
      count(*)::integer as in_queue,
      count(*) filter (where parado)::integer as stagnant,
      count(*) filter (where parado and awaits_third_party is true)::integer as waiting_third_party,
      count(*) filter (where parado and awaits_third_party is false)::integer as unowned,
      count(*) filter (where parado and awaits_third_party is null)::integer as waiting_undecided,
      count(*) filter (where sem_data)::integer as unknown_activity,
      count(*) filter (where hs_created_at >= now() - interval '30 days')::integer as arrived_30d,
      round(percentile_cont(0.5) within group (
        order by extract(epoch from (now() - hs_created_at)) / 86400)::numeric, 0) as median_age_days
    from marcada group by 1, 2, 3, 4, 5, 6
  ),
  por_operacao as (
    select coalesce(nullif(group_company, ''), 'a_definir') as group_company,
      count(*)::integer as pipelines,
      sum(in_queue)::integer as in_queue,
      sum(unowned)::integer as unowned,
      sum(waiting_third_party)::integer as waiting_third_party,
      count(*) filter (where group_company_source = 'confirmed')::integer as confirmed_pipelines
    from por_pipeline group by 1
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
    'total_waiting_third_party', coalesce((select sum(waiting_third_party) from por_pipeline), 0),
    'total_unowned', coalesce((select sum(unowned) from por_pipeline), 0),
    'total_waiting_undecided', coalesce((select sum(waiting_undecided) from por_pipeline), 0),
    'total_unknown_activity', coalesce((select sum(unknown_activity) from por_pipeline), 0),
    'age_buckets', (select payload from faixas),
    'by_group_company', coalesce((
      select jsonb_agg(row_to_json(g) order by g.in_queue desc) from por_operacao g), '[]'::jsonb),
    'pipelines', coalesce((
      select jsonb_agg(row_to_json(x) order by x.in_queue desc)
      from (
        select pipeline_id, pipeline_name, pipeline_alias, queue_role,
          group_company, group_company_source,
          in_queue, stagnant, waiting_third_party, unowned, waiting_undecided,
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
  'Saude da fila por pipeline e por operacao do grupo. Publica o nome oficial do pipeline junto do apelido, e separa parado esperando terceiro de parado sem dono.';

revoke all on function public.rpc_analytics_support_queue_health() from public, anon;
grant execute on function public.rpc_analytics_support_queue_health() to authenticated, service_role;
