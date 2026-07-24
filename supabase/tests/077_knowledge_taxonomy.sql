create extension if not exists pgtap with schema extensions;

begin;

select plan(9);

select is(
  (select count(*)::integer from public.knowledge_articles
   where knowledge_space_id=(select id from public.knowledge_spaces where slug='genius')
     and status='published' and visibility='public' and category_id is null),
  0,
  'nenhum artigo público fica sem categoria'
);

select is(
  (select count(*)::integer from public.knowledge_categories c
   where c.knowledge_space_id=(select id from public.knowledge_spaces where slug='genius')
     and c.visibility='public'
     and not exists (
       select 1 from public.knowledge_articles a
       where a.category_id=c.id and a.status='published' and a.visibility='public'
     )
     and not exists (
       select 1 from public.knowledge_categories child
       join public.knowledge_articles a on a.category_id=child.id
       where child.parent_category_id=c.id and a.status='published' and a.visibility='public'
     )),
  0,
  'nenhuma categoria pública fica vazia na navegação'
);

select is(
  (select count(*)::integer from public.knowledge_categories c
   where c.knowledge_space_id=(select id from public.knowledge_spaces where slug='genius')
     and c.parent_category_id is not null
     and exists (select 1 from public.knowledge_categories p where p.id=c.parent_category_id and p.parent_category_id is not null)),
  0,
  'a hierarquia possui no máximo dois níveis'
);

select ok(
  not exists (
    select 1 from public.knowledge_articles
    where slug in ('configuracao-de-sellers-permitidos','como-informar-a-sku-durantge-a-troca')
  )
  or (
    exists (select 1 from public.knowledge_categories where slug='configuracao-da-operacao' and parent_category_id is null)
    and exists (select 1 from public.knowledge_categories where slug='estornos-e-vale-compras' and parent_category_id=(select id from public.knowledge_categories where slug='configuracao-da-operacao'))
  ),
  'configuração da operação possui subcategoria de estornos'
);

select ok(
  not exists (
    select 1 from public.knowledge_articles
    where slug in ('configuracao-de-sellers-permitidos','como-informar-a-sku-durantge-a-troca')
  )
  or (
    exists (select 1 from public.knowledge_categories where slug='operacao-de-trocas-e-devolucoes' and parent_category_id is null)
    and exists (select 1 from public.knowledge_categories where slug='logistica-reversa' and parent_category_id=(select id from public.knowledge_categories where slug='operacao-de-trocas-e-devolucoes'))
  ),
  'operação possui subcategoria de logística reversa'
);

select is(
  (select count(*)::integer from public.vw_public_knowledge_articles_list where knowledge_space_slug='genius'),
  (select count(*)::integer from public.knowledge_articles where knowledge_space_id=(select id from public.knowledge_spaces where slug='genius') and status='published' and visibility='public'),
  'a lista pública não inclui artigos restritos'
);

select ok(
  not exists (
    select 1 from public.vw_public_knowledge_articles_list
    where knowledge_space_slug='genius' and slug in ('como-criar-um-usuario','permissoes-vtex','permissoes-shopify')
  ),
  'artigos restritos não aparecem na navegação pública'
);

select ok(
  not exists (
    select 1 from public.knowledge_articles
    where slug in ('configuracao-de-sellers-permitidos','como-informar-a-sku-durantge-a-troca')
  )
  or (
    exists (select 1 from public.knowledge_articles where slug='configuracao-de-sellers-permitidos')
    and exists (select 1 from public.knowledge_articles where slug='como-autenticar-uma-integracao')
  ),
  'slugs de artigos existentes foram preservados'
);

select is(
  (select count(*)::integer from (
    select parent_category_id, slug
    from public.knowledge_categories
    where knowledge_space_id=(select id from public.knowledge_spaces where slug='genius')
    group by parent_category_id, slug having count(*) > 1
  ) duplicates),
  0,
  'não existem categorias duplicadas no mesmo nível'
);

select * from finish();
rollback;
