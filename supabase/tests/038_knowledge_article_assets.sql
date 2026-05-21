create extension if not exists pgtap with schema extensions;

begin;

select plan(16);

select has_table(
  'public',
  'knowledge_article_assets',
  'knowledge_article_assets existe para materializar imagens governadas da Knowledge Base'
);

select has_view(
  'public',
  'vw_admin_knowledge_article_assets',
  'view administrativa de assets Knowledge existe'
);

select has_view(
  'public',
  'vw_public_knowledge_article_assets',
  'view pública de assets Knowledge existe'
);

select has_function(
  'public',
  'rpc_admin_unpublish_knowledge_article_v2',
  array['uuid', 'uuid', 'text'],
  'RPC administrativa para retirar artigo publicado do público existe'
);

select has_function(
  'public',
  'rpc_admin_upsert_knowledge_article_asset_v1',
  'RPC administrativa para upsert de asset Knowledge existe'
);

select has_function(
  'public',
  'rpc_admin_update_knowledge_article_asset_review_v1',
  array[
    'uuid',
    'public.knowledge_article_asset_review_status',
    'public.knowledge_visibility',
    'boolean',
    'text',
    'text'
  ],
  'RPC administrativa para revisão de asset Knowledge existe'
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
  'anon não recebe SELECT direto na tabela de assets Knowledge'
);

select is(
  (
    select count(*)::integer
    from information_schema.table_privileges
    where table_schema = 'public'
      and table_name = 'vw_public_knowledge_article_assets'
      and grantee = 'anon'
      and privilege_type = 'SELECT'
  ),
  1,
  'anon lê somente a view pública filtrada de assets Knowledge'
);

select is(
  (
    select count(*)::integer
    from information_schema.routine_privileges
    where specific_schema = 'public'
      and grantee = 'authenticated'
      and privilege_type = 'EXECUTE'
      and routine_name in (
        'rpc_admin_unpublish_knowledge_article_v2',
        'rpc_admin_upsert_knowledge_article_asset_v1',
        'rpc_admin_update_knowledge_article_asset_review_v1'
      )
  ),
  3,
  'authenticated recebe EXECUTE nas RPCs administrativas de assets/unpublish'
);

select is(
  (
    select public
    from storage.buckets
    where id = 'knowledge-assets'
  ),
  false,
  'bucket knowledge-assets permanece privado'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'knowledge_assets_public_read_approved'
      and cmd = 'SELECT'
      and roles = array['anon']::name[]
  ),
  1,
  'policy pública de storage é restrita ao papel anon'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'knowledge_assets_admin_insert',
        'knowledge_assets_admin_update',
        'knowledge_assets_admin_select',
        'knowledge_assets_admin_delete'
      )
      and roles = array['authenticated']::name[]
  ),
  4,
  'policies administrativas de storage são explícitas para authenticated'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'knowledge_article_assets'
      and column_name = 'review_status'
  ),
  'assets registram review_status'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'knowledge_article_assets'
      and column_name = 'storage_object_path'
  ),
  'assets preservam storage_object_path governado'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'knowledge_article_assets'
      and column_name = 'source_path'
  ),
  'assets preservam source_path legado'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'knowledge_article_assets'
      and column_name = 'is_blocked'
  ),
  'assets podem ser bloqueados editorialmente'
);

select * from finish();

rollback;
