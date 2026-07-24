create extension if not exists pgtap with schema extensions;

begin;

select plan(8);

select is(
  (select public from storage.buckets where id = 'knowledge-public-assets'),
  true,
  'bucket publico de assets permanece habilitado para leitura'
);

select is(
  (select file_size_limit from storage.buckets where id = 'knowledge-public-assets'),
  10485760::bigint,
  'bucket publico limita arquivos a 10 MB'
);

select ok(
  (select allowed_mime_types @> array['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
   from storage.buckets
   where id = 'knowledge-public-assets'),
  'bucket publico aceita somente formatos de imagem previstos'
);

select ok(
  not exists (
    select 1
    from public.knowledge_article_assets as asset
    where asset.storage_bucket = 'knowledge-public-assets'
      and (
        asset.review_status <> 'approved'::public.knowledge_article_asset_review_status
        or asset.visibility <> 'public'::public.knowledge_visibility
        or asset.is_blocked
      )
  ),
  'bucket publico nao possui associacoes pendentes, restritas ou bloqueadas'
);

select is(
  (select count(*)::integer
   from pg_policies
   where schemaname = 'storage'
     and tablename = 'objects'
     and policyname = 'knowledge_assets_public_read_approved'
     and roles = array['anon']::name[]),
  1,
  'leitura anonima de assets governados usa a politica explicita de aprovacao'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'knowledge_public_assets%'
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
      and roles @> array['anon']::name[]
  ),
  'anon nao recebe escrita ou remocao no bucket publico'
);

select ok(
  position('can_manage_knowledge_base' in coalesce((select with_check from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'knowledge_public_assets_admin_insert'), '')) > 0,
  'upload publico continua dependente do gate editorial'
);

select ok(
  not exists (
    select 1
    from public.knowledge_article_assets as asset
    where asset.storage_bucket = 'knowledge-public-assets'
      and nullif(btrim(asset.storage_object_path), '') is null
  ),
  'associacoes publicas mantem caminho de objeto auditavel'
);

select * from finish();

rollback;
