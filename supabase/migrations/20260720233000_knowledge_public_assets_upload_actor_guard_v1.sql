drop policy if exists knowledge_public_assets_admin_insert on storage.objects;
create policy knowledge_public_assets_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'knowledge-public-assets'
  and exists (
    select 1
    from public.knowledge_article_assets as asset
    where asset.storage_object_path = name
      and asset.updated_by_user_id = auth.uid()
      and app_private.can_read_knowledge_article_asset(
        asset.article_id,
        asset.visibility,
        asset.review_status,
        asset.is_blocked
      )
  )
);
