-- Reconcile approved public knowledge assets whose object already exists in
-- the public bucket but whose article link retained the private bucket name.
-- This migration is intentionally non-destructive: duplicate rows remain
-- auditable and readers select the canonical public association by bucket,
-- approval, visibility and object path.

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
