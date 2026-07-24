-- Reconcile approved public knowledge assets whose object already exists in
-- the public bucket but whose article link retained the private bucket name.
-- A duplicate private row is removed only when the same article/hash/path is
-- already represented by an approved public row; no unique asset is removed.
delete from public.knowledge_article_assets as private_asset
where private_asset.review_status = 'approved'
  and private_asset.visibility = 'public'
  and private_asset.storage_bucket <> 'knowledge-public-assets'
  and exists (
    select 1
    from public.knowledge_article_assets as public_asset
    where public_asset.article_id = private_asset.article_id
      and public_asset.source_hash = private_asset.source_hash
      and public_asset.storage_object_path = private_asset.storage_object_path
      and public_asset.storage_bucket = 'knowledge-public-assets'
      and public_asset.review_status = 'approved'
      and public_asset.visibility = 'public'
  );

update public.knowledge_article_assets as asset
set
  storage_bucket = 'knowledge-public-assets',
  updated_at = timezone('utc', now())
where asset.review_status = 'approved'
  and asset.visibility = 'public'
  and asset.storage_bucket <> 'knowledge-public-assets'
  and exists (
    select 1
    from storage.objects as object_row
    where object_row.bucket_id = 'knowledge-public-assets'
      and object_row.name = asset.storage_object_path
  );
