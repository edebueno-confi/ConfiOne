create extension if not exists pgtap with schema extensions;

begin;

select plan(7);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'knowledge_articles'
      and column_name = 'tags'
      and data_type = 'ARRAY'
  ),
  'knowledge_articles expõe campo tags normalizado por contrato'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vw_admin_knowledge_articles_list_v2'
      and column_name = 'tags'
  ),
  'lista administrativa v2 expõe tags'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vw_admin_knowledge_article_detail_v2'
      and column_name = 'tags'
  ),
  'detalhe administrativo v2 expõe tags'
);

select is(
  app_private.normalize_knowledge_article_tags(
    array[' Pix ', 'PIX', 'Reembolso rápido!', 'perigoso<script>', '']
  ),
  array['perigososcript', 'pix', 'reembolso-rapido']::text[],
  'normalização remove duplicadas, espaços, acentos e caracteres perigosos'
);

select is(
  cardinality(
    app_private.normalize_knowledge_article_tags(
      array['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']
    )
  ),
  11,
  'normalizador preserva cardinalidade suficiente para RPC bloquear acima de 10'
);

select ok(
  exists (
    select 1
    from information_schema.routine_privileges as gr
    where gr.grantee = 'authenticated'
      and gr.privilege_type = 'EXECUTE'
      and gr.specific_schema = 'public'
      and gr.routine_name = 'rpc_admin_replace_knowledge_article_tags_v1'
  ),
  'authenticated recebe EXECUTE na RPC governada de tags'
);

select is(
  (
    select count(*)::integer
    from information_schema.table_privileges as tp
    where tp.grantee = 'authenticated'
      and tp.privilege_type in ('INSERT', 'UPDATE', 'DELETE')
      and tp.table_schema = 'public'
      and tp.table_name = 'knowledge_articles'
  ),
  0,
  'authenticated continua sem DML direto em knowledge_articles'
);

select * from finish();

rollback;
