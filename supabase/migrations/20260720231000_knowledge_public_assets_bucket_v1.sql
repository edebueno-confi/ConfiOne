insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'knowledge-public-assets',
  'knowledge-public-assets',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists knowledge_public_assets_admin_insert on storage.objects;
create policy knowledge_public_assets_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'knowledge-public-assets'
  and app_private.can_manage_knowledge_base()
  and exists (
    select 1
    from public.knowledge_article_assets as asset
    where asset.storage_object_path = name
      and app_private.can_read_knowledge_article_asset(
        asset.article_id,
        asset.visibility,
        asset.review_status,
        asset.is_blocked
      )
  )
);

drop policy if exists knowledge_public_assets_admin_update on storage.objects;
create policy knowledge_public_assets_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'knowledge-public-assets'
  and app_private.can_manage_knowledge_base()
)
with check (
  bucket_id = 'knowledge-public-assets'
  and app_private.can_manage_knowledge_base()
);

drop policy if exists knowledge_public_assets_admin_delete on storage.objects;
create policy knowledge_public_assets_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'knowledge-public-assets'
  and app_private.can_manage_knowledge_base()
);

create or replace function public.rpc_admin_set_knowledge_article_asset_storage_v1(
  p_asset_id uuid,
  p_storage_bucket text,
  p_storage_object_path text
)
returns public.knowledge_article_assets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_asset public.knowledge_article_assets;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.can_manage_knowledge_base() then
    raise exception 'rpc_admin_set_knowledge_article_asset_storage_v1 denied';
  end if;

  if p_storage_bucket not in ('knowledge-assets', 'knowledge-public-assets') then
    raise exception 'knowledge asset storage bucket is not allowed';
  end if;

  select asset.*
  into v_asset
  from public.knowledge_article_assets as asset
  where asset.id = p_asset_id;

  if v_asset.id is null then
    raise exception 'knowledge article asset not found';
  end if;

  if p_storage_bucket = 'knowledge-public-assets'
     and not app_private.can_read_knowledge_article_asset(
       v_asset.article_id,
       v_asset.visibility,
       v_asset.review_status,
       v_asset.is_blocked
     ) then
    raise exception 'only publicly readable assets can use the public bucket';
  end if;

  update public.knowledge_article_assets
  set
    storage_bucket = p_storage_bucket,
    storage_object_path = btrim(p_storage_object_path),
    updated_by_user_id = v_actor_user_id
  where id = p_asset_id
  returning * into v_asset;

  return v_asset;
end;
$$;

revoke all on function public.rpc_admin_set_knowledge_article_asset_storage_v1(uuid, text, text) from public, anon;
grant execute on function public.rpc_admin_set_knowledge_article_asset_storage_v1(uuid, text, text) to authenticated, service_role;

comment on function public.rpc_admin_set_knowledge_article_asset_storage_v1(uuid, text, text) is
  'Move um asset entre buckets governados; a entrada no bucket publico exige que o artigo e o asset ja sejam publicamente legiveis.';
