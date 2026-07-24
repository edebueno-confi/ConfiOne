create extension if not exists pgtap with schema extensions;

begin;

select plan(7);

select is(
  (
    select name
    from public.knowledge_categories
    where knowledge_space_id = (select id from public.knowledge_spaces where slug = 'genius')
      and slug = 'integracoes'
    limit 1
  ),
  'Integrações e API',
  'categoria pública de Integrações e API existe'
);

select ok(
  (
    select count(*) >= 12
    from public.knowledge_articles
    where knowledge_space_id = (select id from public.knowledge_spaces where slug = 'genius')
      and category_id = (
        select id from public.knowledge_categories
        where knowledge_space_id = (select id from public.knowledge_spaces where slug = 'genius')
          and slug = 'integracoes'
      )
  ),
  'hub possui os artigos públicos previstos'
);

select is(
  (
    select count(*)
    from public.knowledge_articles
    where knowledge_space_id = (select id from public.knowledge_spaces where slug = 'genius')
      and category_id = (
        select id from public.knowledge_categories
        where knowledge_space_id = (select id from public.knowledge_spaces where slug = 'genius')
          and slug = 'integracoes'
      )
      and status = 'published'
      and visibility = 'public'
  ),
  (
    select count(*)
    from public.knowledge_articles
    where knowledge_space_id = (select id from public.knowledge_spaces where slug = 'genius')
      and category_id = (
        select id from public.knowledge_categories
        where knowledge_space_id = (select id from public.knowledge_spaces where slug = 'genius')
          and slug = 'integracoes'
      )
  ),
  'todos os artigos do hub estão publicados e públicos'
);

select ok(
  not exists (
    select 1
    from public.knowledge_articles
    where category_id = (
      select id from public.knowledge_categories
      where knowledge_space_id = (select id from public.knowledge_spaces where slug = 'genius')
        and slug = 'integracoes'
    )
      and body_md ~ 'eyJhbGciOiJIUzI1Ni'
  ),
  'hub não contém JWT de exemplo ou token real'
);

select ok(
  not exists (
    select 1
    from public.knowledge_articles
    where category_id = (
      select id from public.knowledge_categories
      where knowledge_space_id = (select id from public.knowledge_spaces where slug = 'genius')
        and slug = 'integracoes'
    )
      and body_md ~ 'https://(integration|apidocs)\\.geniusreturns\\.com\\.br'
  ),
  'links técnicos do hub permanecem tokenizados e centralizados'
);

select ok(
  exists (
    select 1
    from public.knowledge_articles
    where slug = 'como-autenticar-uma-integracao'
      and body_md like '%::api-reference authenticate%'
  ),
  'artigos usam o bloco técnico reutilizável'
);

select ok(
  exists (
    select 1
    from public.knowledge_articles
    where slug = 'api-docs-swagger-e-referencia-tecnica'
      and body_md like '%{{link:api_docs_spec}}%'
  ),
  'artigo de referência aponta para a especificação OpenAPI oficial'
);

select * from finish();
rollback;
