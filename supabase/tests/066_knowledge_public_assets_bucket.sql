create extension if not exists pgtap with schema extensions;

begin;

select plan(5);

select is(
  (
    select public
    from storage.buckets
    where id = 'knowledge-public-assets'
  ),
  true,
  'bucket público de assets Knowledge existe separado do bucket privado'
);

select has_function(
  'public',
  'rpc_admin_set_knowledge_article_asset_storage_v1',
  array['uuid', 'text', 'text'],
  'RPC governada para mover asset entre buckets existe'
);

select is(
  (
    select count(*)::integer
    from information_schema.routine_privileges
    where specific_schema = 'public'
      and routine_name = 'rpc_admin_set_knowledge_article_asset_storage_v1'
      and grantee = 'authenticated'
      and privilege_type = 'EXECUTE'
  ),
  1,
  'somente usuarios autenticados recebem EXECUTE da RPC de storage'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'knowledge_public_assets_admin_insert'
      and roles = array['authenticated']::name[]
  ),
  1,
  'upload para bucket público permanece restrito a administradores autenticados'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'knowledge_public_assets_admin_delete'
      and roles = array['authenticated']::name[]
  ),
  1,
  'remoção do bucket público permanece restrita a administradores autenticados'
);

select * from finish();

rollback;
