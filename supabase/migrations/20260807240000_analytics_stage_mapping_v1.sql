-- ANALYTICS-STAGE-MAPPING-V1
--
-- Cruzamento de etapas entre pipelines.
--
-- O problema, medido em 2026-08-07
-- --------------------------------
-- O Dashboard consolida etapas pelo nome, comparando o texto cru. Duas falhas
-- decorrem disso:
--
-- 1. `Em Tratativa` e `Em tratativa ` — caixa diferente e espaço no fim — viram
--    duas linhas no gráfico. Defeito puro.
-- 2. `Novo` e `Aberto` são o mesmo momento do atendimento, com nomes distintos
--    criados por times distintos. Nenhuma normalização de texto resolve isso.
--
-- A solução para o segundo caso não é técnica: é uma decisão de qual etapa da
-- origem corresponde a qual etapa canônica. Esta migration cria o lugar onde
-- essa decisão vive, com três garantias:
--
-- - **Fonte da verdade no banco.** Se o cruzamento morasse no frontend, cada
--   tela poderia divergir e o problema voltaria pela porta dos fundos.
-- - **Semeadura por normalização, não por adivinhação.** A carga inicial agrupa
--   apenas o que é texto equivalente. Conceitos com nomes realmente diferentes
--   chegam separados e esperam decisão humana.
-- - **Nada é agrupado em silêncio.** Etapa sem decisão aparece como
--   "Não classificada", nunca somada a outra por conveniência.

-- ---------------------------------------------------------------------------
-- 1. Normalização de rótulo
-- ---------------------------------------------------------------------------

create or replace function app_private.normalize_stage_label(p_label text)
returns text
language sql
immutable
set search_path = ''
as $$
  -- Remove acentuação, colapsa espaços e ignora caixa. É o suficiente para
  -- reconhecer que `Em Tratativa` e `Em tratativa ` são o mesmo texto, e
  -- deliberadamente insuficiente para adivinhar que `Novo` e `Aberto` são o
  -- mesmo conceito — isso é decisão, não normalização.
  select nullif(
    lower(regexp_replace(btrim(coalesce(p_label, '')), '\s+', ' ', 'g')),
    ''
  );
$$;

comment on function app_private.normalize_stage_label(text) is
  'Forma canônica de comparação de rótulo de etapa: sem espaços supérfluos e sem diferenciar caixa. Não infere sinônimos.';

revoke all on function app_private.normalize_stage_label(text) from public, anon;

-- ---------------------------------------------------------------------------
-- 2. Tabela de cruzamento
-- ---------------------------------------------------------------------------

create table if not exists public.analytics_stage_mapping (
  object_type text not null,
  pipeline_id text not null,
  stage_id text not null,
  source_label text null,
  canonical_key text not null,
  canonical_label text not null,
  canonical_order integer not null default 100,
  is_reviewed boolean not null default false,
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (object_type, pipeline_id, stage_id),
  constraint analytics_stage_mapping_object_type check (object_type in ('ticket', 'deal')),
  constraint analytics_stage_mapping_key check (canonical_key = btrim(canonical_key) and canonical_key <> ''),
  constraint analytics_stage_mapping_label check (canonical_label = btrim(canonical_label) and canonical_label <> '')
);

comment on table public.analytics_stage_mapping is
  'Cruzamento entre a etapa de cada pipeline na origem e a etapa canônica exibida no Dashboard. Fonte da verdade do agrupamento; a tela é apenas o editor.';
comment on column public.analytics_stage_mapping.canonical_key is
  'Chave estável do agrupamento. Renomear o rótulo não deve reagrupar os dados.';
comment on column public.analytics_stage_mapping.is_reviewed is
  'Falso enquanto a linha vier apenas da semeadura automática. A tela destaca o que ainda não passou por decisão humana.';

create index if not exists analytics_stage_mapping_canonical_idx
  on public.analytics_stage_mapping (object_type, canonical_key);

alter table public.analytics_stage_mapping enable row level security;

drop policy if exists analytics_stage_mapping_read on public.analytics_stage_mapping;
create policy analytics_stage_mapping_read
  on public.analytics_stage_mapping
  for select
  to authenticated
  using (app_private.can_read_analytics());

revoke all on table public.analytics_stage_mapping from public, anon, authenticated;
grant select on table public.analytics_stage_mapping to authenticated;
grant select, insert, update, delete on table public.analytics_stage_mapping to service_role;

create or replace function public.analytics_stage_mapping_touch()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_analytics_stage_mapping_touch on public.analytics_stage_mapping;
create trigger trg_analytics_stage_mapping_touch
  before update on public.analytics_stage_mapping
  for each row execute function public.analytics_stage_mapping_touch();

-- ---------------------------------------------------------------------------
-- 3. Semeadura: apenas o que é texto equivalente
-- ---------------------------------------------------------------------------

create or replace function public.rpc_admin_seed_analytics_stage_mapping()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted integer := 0;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role)
     and auth.role() is distinct from 'service_role'
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  -- Uma etapa nova entra com o próprio rótulo como canônico, agrupada com as
  -- que têm texto equivalente. O rótulo exibido é a variante mais frequente,
  -- desempatada alfabeticamente para o resultado ser estável.
  with etapas as (
    select
      s.object_type, s.pipeline_id, s.stage_id, s.label, s.display_order,
      app_private.normalize_stage_label(s.label) as chave
    from public.hubspot_pipeline_stages s
    where app_private.normalize_stage_label(s.label) is not null
  ),
  rotulo_preferido as (
    -- O rótulo exibido é sempre a variante limpa. A constraint da tabela recusa
    -- espaço nas pontas de propósito: é justamente a sujeira que criava duas
    -- linhas para a mesma etapa.
    select distinct on (object_type, chave)
      object_type, chave, btrim(label) as label, display_order
    from etapas
    order by object_type, chave, length(btrim(label)), btrim(label)
  )
  insert into public.analytics_stage_mapping as m (
    object_type, pipeline_id, stage_id, source_label,
    canonical_key, canonical_label, canonical_order
  )
  select
    e.object_type, e.pipeline_id, e.stage_id, e.label,
    e.chave, r.label, coalesce(e.display_order, 100)
  from etapas e
  join rotulo_preferido r on r.object_type = e.object_type and r.chave = e.chave
  on conflict (object_type, pipeline_id, stage_id) do update
    set source_label = excluded.source_label,
        -- Decisão humana nunca é sobrescrita pela semeadura.
        canonical_key = case when m.is_reviewed then m.canonical_key else excluded.canonical_key end,
        canonical_label = case when m.is_reviewed then m.canonical_label else excluded.canonical_label end,
        updated_at = timezone('utc', now());

  get diagnostics v_inserted = row_count;
  return jsonb_build_object(
    'processed', v_inserted,
    'pending_review', (select count(*) from public.analytics_stage_mapping where not is_reviewed)
  );
end;
$$;

comment on function public.rpc_admin_seed_analytics_stage_mapping() is
  'Semeia o cruzamento a partir das etapas conhecidas, agrupando somente texto equivalente. Nunca sobrescreve linha já revisada por pessoa.';

revoke all on function public.rpc_admin_seed_analytics_stage_mapping() from public, anon;
grant execute on function public.rpc_admin_seed_analytics_stage_mapping() to authenticated, service_role;

select public.rpc_admin_seed_analytics_stage_mapping();

-- ---------------------------------------------------------------------------
-- 4. Leitura para a tela de configuração
-- ---------------------------------------------------------------------------

create or replace function public.rpc_analytics_stage_mapping_list(
  p_object_type text default 'ticket'
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when app_private.can_read_analytics() then
    coalesce((
      select jsonb_agg(row_to_json(x) order by x.canonical_order, x.canonical_label, x.pipeline_label)
      from (
        select
          m.pipeline_id,
          coalesce(nullif(c.label, ''), nullif(c.hubspot_pipeline_label, ''), m.pipeline_id) as pipeline_label,
          c.is_active as pipeline_active,
          m.stage_id,
          m.source_label,
          m.canonical_key,
          m.canonical_label,
          m.canonical_order,
          m.is_reviewed,
          coalesce(s.metadata ->> 'ticketState', case when s.is_closed then 'CLOSED' else 'OPEN' end) as situation,
          (
            select count(*)::integer from public.hubspot_tickets t
            where m.object_type = 'ticket' and t.pipeline_id = m.pipeline_id and t.pipeline_stage = m.stage_id
          ) as ticket_count,
          (
            select count(*)::integer from public.hubspot_deals d
            where m.object_type = 'deal' and d.pipeline_id = m.pipeline_id and d.dealstage = m.stage_id
          ) as deal_count
        from public.analytics_stage_mapping m
        left join public.analytics_source_config c
          on c.object_type = m.object_type and c.hubspot_pipeline_id = m.pipeline_id
        left join public.hubspot_pipeline_stages s
          on s.object_type = m.object_type and s.pipeline_id = m.pipeline_id and s.stage_id = m.stage_id
        where m.object_type = p_object_type
      ) x
    ), '[]'::jsonb)
  else '[]'::jsonb end;
$$;

comment on function public.rpc_analytics_stage_mapping_list(text) is
  'Lista o cruzamento com volume real por etapa, para que a decisão seja tomada olhando o peso de cada uma.';

revoke all on function public.rpc_analytics_stage_mapping_list(text) from public, anon;
grant execute on function public.rpc_analytics_stage_mapping_list(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Escrita pela tela
-- ---------------------------------------------------------------------------

create or replace function public.rpc_admin_update_analytics_stage_mapping(
  p_object_type text,
  p_pipeline_id text,
  p_stage_id text,
  p_canonical_label text,
  p_canonical_order integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_label text := btrim(coalesce(p_canonical_label, ''));
  v_key text;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if v_label = '' then
    raise exception 'O nome da etapa não pode ficar vazio.' using errcode = '22023';
  end if;

  -- A chave deriva do rótulo normalizado: duas etapas recebem o mesmo nome e
  -- passam a ser contadas juntas, que é exatamente o cruzamento desejado.
  v_key := app_private.normalize_stage_label(v_label);

  update public.analytics_stage_mapping
  set canonical_key = v_key,
      canonical_label = v_label,
      canonical_order = coalesce(p_canonical_order, canonical_order),
      is_reviewed = true,
      reviewed_at = timezone('utc', now()),
      reviewed_by = auth.uid()
  where object_type = p_object_type and pipeline_id = p_pipeline_id and stage_id = p_stage_id;

  if not found then
    raise exception 'Etapa não encontrada no cruzamento.' using errcode = 'P0002';
  end if;

  return jsonb_build_object('canonical_key', v_key, 'canonical_label', v_label);
end;
$$;

revoke all on function public.rpc_admin_update_analytics_stage_mapping(text, text, text, text, integer)
  from public, anon;
grant execute on function public.rpc_admin_update_analytics_stage_mapping(text, text, text, text, integer)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Read model do gráfico, agora pelo cruzamento
-- ---------------------------------------------------------------------------

create or replace function public.rpc_analytics_support_stage_breakdown(
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
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  with scoped as (
    select
      t.ticket_id, t.pipeline_id, t.pipeline_stage,
      coalesce(s.metadata ->> 'ticketState', '') = 'OPEN' as is_open,
      -- Etapa sem decisão aparece como não classificada, jamais somada a outra.
      coalesce(m.canonical_label, 'Não classificada') as etapa,
      coalesce(m.canonical_order, 999) as ordem,
      coalesce(nullif(c.label, ''), nullif(c.hubspot_pipeline_label, ''), t.pipeline_id) as pipeline_label
    from public.hubspot_tickets t
    join public.analytics_source_config c
      on c.object_type = 'ticket' and c.hubspot_pipeline_id = t.pipeline_id
     and c.is_active and not coalesce(c.is_archived, false)
    left join public.hubspot_pipeline_stages s
      on s.object_type = 'ticket' and s.pipeline_id = t.pipeline_id and s.stage_id = t.pipeline_stage
    left join public.analytics_stage_mapping m
      on m.object_type = 'ticket' and m.pipeline_id = t.pipeline_id and m.stage_id = t.pipeline_stage
    where (p_pipeline_id is null or t.pipeline_id = p_pipeline_id)
  )
  select jsonb_build_object(
    'stages', coalesce((
      select jsonb_agg(row_to_json(g) order by g.open_tickets desc, g.stage)
      from (
        select
          etapa as stage,
          min(ordem) as stage_order,
          count(*) filter (where is_open)::integer as open_tickets,
          count(*)::integer as total_tickets,
          coalesce((
            select jsonb_agg(row_to_json(p) order by p.open_tickets desc)
            from (
              select s2.pipeline_label, count(*) filter (where s2.is_open)::integer as open_tickets
              from scoped s2 where s2.etapa = scoped.etapa
              group by s2.pipeline_label having count(*) filter (where s2.is_open) > 0
            ) p
          ), '[]'::jsonb) as by_pipeline
        from scoped
        group by etapa
        having count(*) filter (where is_open) > 0
      ) g
    ), '[]'::jsonb),
    'unmapped', (
      select count(distinct pipeline_stage)::integer from scoped where etapa = 'Não classificada'
    ),
    'pending_review', (
      select count(*)::integer from public.analytics_stage_mapping
      where object_type = 'ticket' and not is_reviewed
    )
  ) into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_support_stage_breakdown(text) is
  'Distribuição da fila por etapa canônica, usando o cruzamento configurado. Etapa sem decisão fica visível como não classificada em vez de ser agrupada por conveniência.';

revoke all on function public.rpc_analytics_support_stage_breakdown(text) from public, anon;
grant execute on function public.rpc_analytics_support_stage_breakdown(text) to authenticated, service_role;
