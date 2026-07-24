create extension if not exists pgtap with schema extensions;

begin;

select plan(3);

select is(
  (
    select count(*)::integer
    from information_schema.routine_privileges
    where specific_schema = 'app_private'
      and routine_name = 'can_read_knowledge_article_asset'
      and grantee = 'anon'
      and privilege_type = 'EXECUTE'
  ),
  1,
  'anon pode avaliar a regra de leitura de assets sem acesso direto a tabela'
);

select is(
  (
    select count(*)::integer
    from information_schema.routine_privileges
    where specific_schema = 'app_private'
      and routine_name = 'can_read_knowledge_article_asset'
      and grantee = 'authenticated'
      and privilege_type = 'EXECUTE'
  ),
  1,
  'authenticated pode avaliar a regra de leitura de assets'
);

select is(
  (
    select count(*)::integer
    from information_schema.table_privileges
    where table_schema = 'public'
      and table_name = 'knowledge_article_assets'
      and grantee = 'anon'
      and privilege_type = 'SELECT'
  ),
  0,
  'anon continua sem SELECT direto na tabela de assets'
);

select * from finish();

rollback;
