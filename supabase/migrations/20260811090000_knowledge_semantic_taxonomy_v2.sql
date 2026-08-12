-- Taxonomia semântica do Help Center Genius Returns.
-- A migração separa conteúdo de uso da plataforma, integrações externas e
-- documentação técnica para integração com a API do Genius.

alter table public.knowledge_categories
  add column if not exists sort_order integer not null default 100;

do $block$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'knowledge_categories_sort_order_non_negative_check'
      and conrelid = 'public.knowledge_categories'::regclass
  ) then
    alter table public.knowledge_categories
      add constraint knowledge_categories_sort_order_non_negative_check
      check (sort_order >= 0);
  end if;
end;
$block$;

create index if not exists knowledge_categories_space_parent_order_idx
  on public.knowledge_categories (knowledge_space_id, parent_category_id, sort_order, name);

do $block$
declare
  v_space_id uuid;
  v_actor_id uuid;
begin
  select id into v_space_id
  from public.knowledge_spaces
  where slug = 'genius'
  limit 1;

  if v_space_id is null then
    raise exception 'knowledge space genius not found';
  end if;

  select id into v_actor_id
  from public.profiles
  where id = 'f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0'::uuid
  limit 1;

  insert into public.knowledge_categories (
    knowledge_space_id,
    tenant_id,
    parent_category_id,
    visibility,
    name,
    slug,
    description,
    sort_order,
    created_by_user_id,
    updated_by_user_id
  )
  select
    v_space_id,
    null,
    null,
    seed.visibility::public.knowledge_visibility,
    seed.name,
    seed.slug,
    seed.description,
    seed.sort_order,
    v_actor_id,
    v_actor_id
  from (values
    ('public', 'Primeiros passos', 'primeiros-passos', 'Orientações iniciais para começar a operar o Genius Returns.', 10),
    ('public', 'Configurações da plataforma', 'configuracoes-da-plataforma', 'Configurações gerais, parâmetros e comportamentos da operação no Genius Returns.', 20),
    ('public', 'Cadastros e regras', 'cadastros-e-regras', 'Cadastros, produtos, motivos e regras que determinam o funcionamento da operação.', 30),
    ('public', 'Solicitações e operação', 'solicitacoes-e-operacao', 'Como criar, consultar e operar solicitações de troca e devolução.', 40),
    ('public', 'Status e pendências', 'status-e-pendencias', 'Leitura e tratamento de status e pendências operacionais.', 50),
    ('public', 'Estornos, reembolsos e vale-compras', 'estornos-reembolsos-e-vale-compras', 'Configuração e operação de estornos, reembolsos e vale-compras.', 60),
    ('public', 'Integrações de plataformas', 'integracoes-de-plataformas', 'Configuração das integrações do Genius Returns com plataformas de e-commerce e transportadoras.', 70),
    ('public', 'Logística reversa', 'logistica-reversa', 'Prazos, regras e fluxos relacionados à logística reversa.', 80),
    ('public', 'Sellers e lojas', 'sellers-e-lojas', 'Cadastro e configuração de sellers, lojas físicas e lojas virtuais.', 90),
    ('public', 'Comunicação e notificações', 'comunicacao-e-notificacoes', 'E-mails, textos do portal e notificações enviadas ao cliente.', 100),
    ('public', 'Erros e soluções', 'erros-e-solucoes', 'Soluções para erros de operação que não pertencem a uma integração específica.', 110),
    ('public', 'Integrações e API', 'integracoes', 'Documentação técnica para equipes de tecnologia integrarem seus sistemas ao Genius Returns.', 120),
    ('public', 'Acessos e segurança', 'acessos-e-seguranca', 'Usuários, acesso e padrões de segurança da operação.', 130)
  ) as seed(visibility, name, slug, description, sort_order)
  where not exists (
    select 1
    from public.knowledge_categories as existing
    where existing.knowledge_space_id = v_space_id
      and existing.parent_category_id is null
      and existing.slug = seed.slug
  );

  update public.knowledge_categories as kc
  set visibility = seed.visibility::public.knowledge_visibility,
      name = seed.name,
      description = seed.description,
      sort_order = seed.sort_order,
      updated_by_user_id = coalesce(v_actor_id, kc.updated_by_user_id)
  from (values
    ('public', 'Primeiros passos', 'primeiros-passos', 'Orientações iniciais para começar a operar o Genius Returns.', 10),
    ('public', 'Configurações da plataforma', 'configuracoes-da-plataforma', 'Configurações gerais, parâmetros e comportamentos da operação no Genius Returns.', 20),
    ('public', 'Cadastros e regras', 'cadastros-e-regras', 'Cadastros, produtos, motivos e regras que determinam o funcionamento da operação.', 30),
    ('public', 'Solicitações e operação', 'solicitacoes-e-operacao', 'Como criar, consultar e operar solicitações de troca e devolução.', 40),
    ('public', 'Status e pendências', 'status-e-pendencias', 'Leitura e tratamento de status e pendências operacionais.', 50),
    ('public', 'Estornos, reembolsos e vale-compras', 'estornos-reembolsos-e-vale-compras', 'Configuração e operação de estornos, reembolsos e vale-compras.', 60),
    ('public', 'Integrações de plataformas', 'integracoes-de-plataformas', 'Configuração das integrações do Genius Returns com plataformas de e-commerce e transportadoras.', 70),
    ('public', 'Logística reversa', 'logistica-reversa', 'Prazos, regras e fluxos relacionados à logística reversa.', 80),
    ('public', 'Sellers e lojas', 'sellers-e-lojas', 'Cadastro e configuração de sellers, lojas físicas e lojas virtuais.', 90),
    ('public', 'Comunicação e notificações', 'comunicacao-e-notificacoes', 'E-mails, textos do portal e notificações enviadas ao cliente.', 100),
    ('public', 'Erros e soluções', 'erros-e-solucoes', 'Soluções para erros de operação que não pertencem a uma integração específica.', 110),
    ('public', 'Integrações e API', 'integracoes', 'Documentação técnica para equipes de tecnologia integrarem seus sistemas ao Genius Returns.', 120),
    ('public', 'Acessos e segurança', 'acessos-e-seguranca', 'Usuários, acesso e padrões de segurança da operação.', 130)
  ) as seed(visibility, name, slug, description, sort_order)
  where kc.knowledge_space_id = v_space_id
    and kc.parent_category_id is null
    and kc.slug = seed.slug;

  -- Categorias legadas deixam de aparecer como áreas públicas depois que os
  -- artigos são movidos para a taxonomia semântica acima.
  update public.knowledge_categories
  set visibility = case when slug = 'integracoes' then 'public'::public.knowledge_visibility else 'internal'::public.knowledge_visibility end,
      sort_order = case when slug = 'integracoes' then 120 else 900 end,
      updated_by_user_id = coalesce(v_actor_id, updated_by_user_id)
  where knowledge_space_id = v_space_id
    and slug not in (
      'primeiros-passos',
      'configuracoes-da-plataforma',
      'cadastros-e-regras',
      'solicitacoes-e-operacao',
      'status-e-pendencias',
      'estornos-reembolsos-e-vale-compras',
      'integracoes-de-plataformas',
      'logistica-reversa',
      'sellers-e-lojas',
      'comunicacao-e-notificacoes',
      'erros-e-solucoes',
      'integracoes',
      'acessos-e-seguranca'
    );


  update public.knowledge_categories
  set visibility = 'public'::public.knowledge_visibility,
      name = 'Integrações e API',
      description = 'Documentação técnica para equipes de tecnologia integrarem seus sistemas ao Genius Returns.',
      sort_order = 120,
      updated_by_user_id = coalesce(v_actor_id, updated_by_user_id)
  where knowledge_space_id = v_space_id
    and slug = 'integracoes';

  update public.knowledge_articles as ka
  set category_id = target.id,
      updated_by_user_id = coalesce(v_actor_id, ka.updated_by_user_id)
  from (
    values
      ('como-alterar-ou-aprovar-os-produtos-de-uma-solicitacao', 'solicitacoes-e-operacao'),
      ('como-atualizar-os-dados-de-integracao-do-e-commerce', 'integracoes-de-plataformas'),
      ('como-automatizar-a-conclusao-de-uma-solicitacao', 'configuracoes-da-plataforma'),
      ('como-automatizar-o-pagamento-de-estorno-e-vale-compra', 'estornos-reembolsos-e-vale-compras'),
      ('como-cadastrar-lojas-fisicas', 'sellers-e-lojas'),
      ('como-cadastrar-motivos-para-troca-ou-devolucao', 'cadastros-e-regras'),
      ('como-cadastrar-os-e-mails-para-notificacoes-automaticas', 'comunicacao-e-notificacoes'),
      ('como-configurar-a-cor-exibida-nos-filtros-basicos-das-solicitacoes', 'configuracoes-da-plataforma'),
      ('como-configurar-o-blocklist', 'cadastros-e-regras'),
      ('como-configurar-o-calculo-do-estorno', 'estornos-reembolsos-e-vale-compras'),
      ('como-configurar-o-estorno-automatico-via-pix', 'estornos-reembolsos-e-vale-compras'),
      ('como-configurar-o-prazo-logistico-por-estado', 'logistica-reversa'),
      ('como-configurar-o-vale-compras-retencao', 'estornos-reembolsos-e-vale-compras'),
      ('como-configurar-os-textos-do-front', 'comunicacao-e-notificacoes'),
      ('como-criar-um-usuario', 'acessos-e-seguranca'),
      ('como-informar-a-sku-durantge-a-troca', 'cadastros-e-regras'),
      ('como-o-consumidor-solicita-uma-reversa', 'solicitacoes-e-operacao'),
      ('como-realizar-alteracoes-em-um-vale-compra-pendente', 'estornos-reembolsos-e-vale-compras'),
      ('configuracao-de-sellers-permitidos', 'sellers-e-lojas'),
      ('fique-com-o-item', 'logistica-reversa'),
      ('configurando-as-formas-de-estorno', 'estornos-reembolsos-e-vale-compras'),
      ('configurando-parametrizacao-geral', 'configuracoes-da-plataforma'),
      ('configurar-padroes-de-seguranca', 'acessos-e-seguranca'),
      ('criando-e-atualizando-o-cadastro', 'cadastros-e-regras'),
      ('criar-lojas-virtuais', 'sellers-e-lojas'),
      ('erro-nao-autorizado-ao-gerar-codigo-reverso-postagem', 'integracoes-de-plataformas'),
      ('erro-ao-tentar-realizar-o-estorno', 'erros-e-solucoes'),
      ('erro-de-autorizacao-ao-acessar-pedidos-na-vtex', 'integracoes-de-plataformas'),
      ('erro-no-cep-ou-endereco-incorreto', 'erros-e-solucoes'),
      ('erros-na-integracao-do-contrato-do-correios', 'integracoes-de-plataformas'),
      ('formas-de-estorno-por-motivo', 'estornos-reembolsos-e-vale-compras'),
      ('habilitar-a-api-de-logistica-reversa-do-correios', 'integracoes-de-plataformas'),
      ('intalacao-e-integracao-nuvemshop', 'integracoes-de-plataformas'),
      ('integracao-e-configuracao-com-os-correios', 'integracoes-de-plataformas'),
      ('limitando-o-valor-maximo-de-um-estorno', 'estornos-reembolsos-e-vale-compras'),
      ('modo-sac', 'solicitacoes-e-operacao'),
      ('operacoes-permitidas-durante-a-criacao-de-sua-solicitacao', 'configuracoes-da-plataforma'),
      ('pedidos-pagos-com-vale-compras', 'estornos-reembolsos-e-vale-compras'),
      ('pendencia-de-logistica-reversa', 'status-e-pendencias'),
      ('permissoes-shopify', 'integracoes-de-plataformas'),
      ('permissoes-tray', 'integracoes-de-plataformas'),
      ('permissoes-vtex', 'integracoes-de-plataformas'),
      ('politica-para-estorno-do-frete', 'estornos-reembolsos-e-vale-compras'),
      ('posso-alterar-a-forma-de-reembolso-do-meu-consumidor', 'estornos-reembolsos-e-vale-compras'),
      ('posso-alterar-o-e-mail-e-o-endereco-da-solicitacao', 'solicitacoes-e-operacao'),
      ('posso-alterar-o-status-de-uma-solicitacao', 'status-e-pendencias'),
      ('posso-enviar-uma-notificacao-de-analise-ao-cliente', 'comunicacao-e-notificacoes'),
      ('posso-filtrar-as-solicitacoes-de-reversas', 'solicitacoes-e-operacao'),
      ('produtos-em-excecao', 'cadastros-e-regras'),
      ('reenviar-um-e-mail-ao-consumidor', 'comunicacao-e-notificacoes'),
      ('regra-de-excecao-para-motivos-nao-gerar-logistica-reversa', 'logistica-reversa'),
      ('regra-para-segunda-solicitacao', 'cadastros-e-regras'),
      ('regra-por-motivo', 'cadastros-e-regras'),
      ('regras-de-cadastro-e-configuracoes-de-sellers-estorno-e-logistica', 'sellers-e-lojas'),
      ('sellers-permitidos-para-criar-vale-compras', 'sellers-e-lojas'),
      ('valor-manual-para-estorno-automatico', 'estornos-reembolsos-e-vale-compras'),
      ('variacao-do-produto', 'cadastros-e-regras'),
      ('ambientes-de-producao-qa-e-testes', 'integracoes'),
      ('api-docs-swagger-e-referencia-tecnica', 'integracoes'),
      ('como-autenticar-uma-integracao', 'integracoes'),
      ('como-consultar-processos-e-acompanhar-status', 'integracoes'),
      ('como-importar-uma-solicitacao-criada-em-outro-sistema', 'integracoes'),
      ('como-informar-avaliacoes-de-produtos', 'integracoes'),
      ('como-iniciar-uma-troca-ou-devolucao-pelo-e-commerce', 'integracoes'),
      ('como-integrar-notas-fiscais-de-devolucao', 'integracoes'),
      ('como-solicitar-credenciais-ou-habilitacao', 'integracoes'),
      ('erros-comuns-em-integracoes-api', 'integracoes'),
      ('integracoes-e-api-do-genius-returns', 'integracoes'),
      ('qual-recurso-de-integracao-devo-usar', 'integracoes')
  ) as mapping(article_slug, category_slug)
  join public.knowledge_categories as target
    on target.knowledge_space_id = v_space_id
   and target.parent_category_id is null
   and target.slug = mapping.category_slug
  where ka.knowledge_space_id = v_space_id
    and ka.slug = mapping.article_slug;

  if (
    select count(*)
    from public.knowledge_articles
    where knowledge_space_id = v_space_id
      and status <> 'archived'
      and slug <> 'space-aware-ci-fixture'
      and category_id is null
  ) > 0 then
    raise exception 'semantic taxonomy left non-fixture articles without category';
  end if;
end;
$block$;

create or replace view public.vw_admin_knowledge_categories_v2
with (security_barrier = true)
as
  with current_actor as (
    select p.id
    from public.profiles as p
    where p.id = auth.uid()
      and p.is_active
      and app_private.can_manage_knowledge_base()
  ),
  article_stats as (
    select
      ka.category_id,
      count(*)::integer as article_count,
      count(*) filter (where ka.status = 'draft')::integer as draft_count,
      count(*) filter (where ka.status = 'review')::integer as review_count,
      count(*) filter (where ka.status = 'published')::integer as published_count,
      count(*) filter (where ka.status = 'archived')::integer as archived_count
    from public.knowledge_articles as ka
    where ka.knowledge_space_id is not null
    group by ka.category_id
  )
  select
    kc.id,
    kc.knowledge_space_id,
    ks.slug as knowledge_space_slug,
    ks.display_name as knowledge_space_display_name,
    ks.status as knowledge_space_status,
    o.id as organization_id,
    o.slug as organization_slug,
    o.display_name as organization_display_name,
    ks.owner_tenant_id,
    owner_tenant.slug as owner_tenant_slug,
    owner_tenant.display_name as owner_tenant_display_name,
    kc.tenant_id,
    t.slug as tenant_slug,
    t.display_name as tenant_display_name,
    kc.parent_category_id,
    parent.slug as parent_slug,
    parent.name as parent_name,
    kc.visibility,
    kc.name,
    kc.slug,
    kc.description,
    coalesce(stats.article_count, 0) as article_count,
    coalesce(stats.draft_count, 0) as draft_count,
    coalesce(stats.review_count, 0) as review_count,
    coalesce(stats.published_count, 0) as published_count,
    coalesce(stats.archived_count, 0) as archived_count,
    kc.created_at,
    kc.updated_at,
    creator.full_name as created_by_full_name,
    updater.full_name as updated_by_full_name,
    kc.sort_order as category_sort_order
  from public.knowledge_categories as kc
  join current_actor on true
  join public.knowledge_spaces as ks on ks.id = kc.knowledge_space_id
  join public.organizations as o on o.id = ks.organization_id
  left join public.tenants as owner_tenant on owner_tenant.id = ks.owner_tenant_id
  left join public.tenants as t on t.id = kc.tenant_id
  left join public.knowledge_categories as parent on parent.id = kc.parent_category_id
  left join article_stats as stats on stats.category_id = kc.id
  left join public.profiles as creator on creator.id = kc.created_by_user_id
  left join public.profiles as updater on updater.id = kc.updated_by_user_id;

create or replace view public.vw_public_knowledge_navigation
  with (security_barrier = true)
as
  with recursive active_spaces as (
    select
      ks.id as knowledge_space_id,
      ks.slug as knowledge_space_slug,
      ks.display_name as knowledge_space_display_name,
      ks.default_locale,
      coalesce(bs.brand_name, ks.display_name) as brand_name
    from public.knowledge_spaces as ks
    join public.organizations as o on o.id = ks.organization_id
    left join public.brand_settings as bs on bs.knowledge_space_id = ks.id
    where ks.status = 'active' and o.status = 'active'
  ),
  default_space as (
    select s.knowledge_space_id
    from active_spaces as s
    where s.knowledge_space_slug = 'genius'
    limit 1
  ),
  public_categories as (
    select
      kc.id,
      coalesce(kc.knowledge_space_id, ds.knowledge_space_id) as knowledge_space_id,
      kc.parent_category_id,
      kc.name,
      kc.slug,
      kc.description,
      kc.sort_order
    from public.knowledge_categories as kc
    left join default_space as ds on true
    join active_spaces as s on s.knowledge_space_id = coalesce(kc.knowledge_space_id, ds.knowledge_space_id)
    where kc.visibility = 'public' and kc.parent_category_id is null
    union all
    select
      child.id,
      coalesce(child.knowledge_space_id, parent.knowledge_space_id),
      child.parent_category_id,
      child.name,
      child.slug,
      child.description,
      child.sort_order
    from public.knowledge_categories as child
    join public_categories as parent on parent.id = child.parent_category_id
    where child.visibility = 'public'
      and coalesce(child.knowledge_space_id, parent.knowledge_space_id) = parent.knowledge_space_id
  ),
  public_articles as (
    select
      ka.id,
      coalesce(ka.knowledge_space_id, ds.knowledge_space_id) as knowledge_space_id,
      ka.category_id,
      ka.title,
      ka.slug,
      ka.summary,
      ka.published_at,
      ka.updated_at
    from public.knowledge_articles as ka
    left join default_space as ds on true
    join active_spaces as s on s.knowledge_space_id = coalesce(ka.knowledge_space_id, ds.knowledge_space_id)
    left join public_categories as pc on pc.id = ka.category_id
      and pc.knowledge_space_id = coalesce(ka.knowledge_space_id, ds.knowledge_space_id)
    where ka.status = 'published' and ka.visibility = 'public'
      and (ka.category_id is null or pc.id is not null)
  ),
  category_closure as (
    select pc.id as ancestor_category_id, pc.id as descendant_category_id
    from public_categories as pc
    union all
    select cc.ancestor_category_id, child.id
    from category_closure as cc
    join public_categories as child on child.parent_category_id = cc.descendant_category_id
  ),
  category_direct_stats as (
    select
      pc.id as category_id,
      count(pa.id)::integer as article_count,
      coalesce(jsonb_agg(jsonb_build_object(
        'id', pa.id, 'slug', pa.slug, 'title', pa.title, 'summary', pa.summary,
        'published_at', pa.published_at
      ) order by lower(pa.title)) filter (where pa.id is not null), '[]'::jsonb) as articles
    from public_categories as pc
    left join public_articles as pa on pa.category_id = pc.id
    group by pc.id
  ),
  category_subtree_stats as (
    select cc.ancestor_category_id as category_id, count(pa.id)::integer as subtree_article_count
    from category_closure as cc
    left join public_articles as pa on pa.category_id = cc.descendant_category_id
    group by cc.ancestor_category_id
  )
  select
    s.knowledge_space_id,
    s.knowledge_space_slug,
    s.knowledge_space_display_name,
    s.brand_name,
    s.default_locale,
    pc.id as category_id,
    pc.parent_category_id,
    parent.slug as parent_category_slug,
    parent.name as parent_category_name,
    pc.name as category_name,
    pc.slug as category_slug,
    pc.description as category_description,
    coalesce(direct_stats.article_count, 0) as article_count,
    coalesce(subtree_stats.subtree_article_count, 0) as subtree_article_count,
    coalesce(direct_stats.articles, '[]'::jsonb) as articles,
    coalesce(parent.sort_order, pc.sort_order) as parent_category_sort_order,
    pc.sort_order as category_sort_order
  from public_categories as pc
  join active_spaces as s on s.knowledge_space_id = pc.knowledge_space_id
  left join public_categories as parent on parent.id = pc.parent_category_id
  left join category_direct_stats as direct_stats on direct_stats.category_id = pc.id
  left join category_subtree_stats as subtree_stats on subtree_stats.category_id = pc.id
  where coalesce(subtree_stats.subtree_article_count, 0) > 0;

create or replace function public.rpc_admin_reorder_knowledge_categories_v1(
  p_knowledge_space_id uuid,
  p_ordered_category_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_expected_count integer;
  v_received_count integer;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.can_manage_knowledge_base() then
    raise exception 'rpc_admin_reorder_knowledge_categories_v1 denied';
  end if;

  if p_knowledge_space_id is null or p_ordered_category_ids is null then
    raise exception 'knowledge space and category order are required';
  end if;

  select count(*)::integer
  into v_expected_count
  from public.knowledge_categories
  where knowledge_space_id = p_knowledge_space_id;

  select count(*)::integer
  into v_received_count
  from unnest(p_ordered_category_ids) as item(category_id);

  if v_received_count <> v_expected_count
     or v_received_count <> (select count(distinct item) from unnest(p_ordered_category_ids) as item) then
    raise exception 'category order must contain every category exactly once';
  end if;

  if exists (
    select 1
    from unnest(p_ordered_category_ids) as item(category_id)
    left join public.knowledge_categories as kc
      on kc.id = item.category_id
     and kc.knowledge_space_id = p_knowledge_space_id
    where kc.id is null
  ) then
    raise exception 'category order contains a category from another space';
  end if;

  update public.knowledge_categories as kc
  set sort_order = ranked.position * 10,
      updated_by_user_id = v_actor_user_id
  from (
    select item.category_id, item.ordinality::integer as position
    from unnest(p_ordered_category_ids) with ordinality as item(category_id, ordinality)
  ) as ranked
  where kc.id = ranked.category_id
    and kc.knowledge_space_id = p_knowledge_space_id;

  return v_received_count;
end;
$$;

revoke all on function public.rpc_admin_reorder_knowledge_categories_v1(uuid, uuid[]) from public, anon;
grant execute on function public.rpc_admin_reorder_knowledge_categories_v1(uuid, uuid[]) to authenticated, service_role;

comment on function public.rpc_admin_reorder_knowledge_categories_v1(uuid, uuid[]) is
  'Reordena as categorias de uma central sem embutir ordem nos nomes ou no frontend.';
