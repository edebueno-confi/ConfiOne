do $$
begin
  create type public.knowledge_article_asset_review_status as enum (
    'pending',
    'approved',
    'blocked',
    'replaced'
  );
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.knowledge_article_assets (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.knowledge_articles (id) on delete cascade,
  source_url text,
  source_path text not null,
  source_hash text not null,
  storage_bucket text not null default 'knowledge-assets',
  storage_object_path text not null,
  detected_mime_type text not null,
  file_size_bytes integer not null,
  width integer,
  height integer,
  alt_text text,
  caption text,
  review_status public.knowledge_article_asset_review_status not null default 'pending',
  visibility public.knowledge_visibility not null default 'internal',
  is_blocked boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles (id),
  updated_by_user_id uuid references public.profiles (id),
  constraint knowledge_article_assets_source_path_not_blank_check
    check (nullif(btrim(source_path), '') is not null),
  constraint knowledge_article_assets_source_hash_not_blank_check
    check (nullif(btrim(source_hash), '') is not null),
  constraint knowledge_article_assets_storage_bucket_not_blank_check
    check (nullif(btrim(storage_bucket), '') is not null),
  constraint knowledge_article_assets_storage_object_path_not_blank_check
    check (nullif(btrim(storage_object_path), '') is not null),
  constraint knowledge_article_assets_detected_mime_type_not_blank_check
    check (nullif(btrim(detected_mime_type), '') is not null),
  constraint knowledge_article_assets_file_size_positive_check
    check (file_size_bytes > 0),
  constraint knowledge_article_assets_width_positive_check
    check (width is null or width > 0),
  constraint knowledge_article_assets_height_positive_check
    check (height is null or height > 0),
  constraint knowledge_article_assets_blocked_status_check
    check (
      (is_blocked = false)
      or (review_status = 'blocked'::public.knowledge_article_asset_review_status)
    )
);

create unique index if not exists knowledge_article_assets_article_source_hash_key
  on public.knowledge_article_assets (article_id, source_path, source_hash);

create unique index if not exists knowledge_article_assets_storage_object_key
  on public.knowledge_article_assets (storage_bucket, storage_object_path);

create index if not exists knowledge_article_assets_article_status_idx
  on public.knowledge_article_assets (article_id, review_status, visibility);

drop trigger if exists knowledge_article_assets_touch_updated_at on public.knowledge_article_assets;
create trigger knowledge_article_assets_touch_updated_at
before update on public.knowledge_article_assets
for each row execute function app_private.touch_updated_at();

drop trigger if exists knowledge_article_assets_audit_row_change on public.knowledge_article_assets;
create trigger knowledge_article_assets_audit_row_change
after insert or update or delete on public.knowledge_article_assets
for each row execute function audit.capture_row_change();

alter table public.knowledge_article_assets enable row level security;

create or replace function app_private.can_read_knowledge_article_asset(
  p_article_id uuid,
  p_asset_visibility public.knowledge_visibility,
  p_asset_review_status public.knowledge_article_asset_review_status,
  p_is_blocked boolean
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    app_private.can_manage_knowledge_base()
    or (
      p_asset_visibility = 'public'::public.knowledge_visibility
      and p_asset_review_status = 'approved'::public.knowledge_article_asset_review_status
      and not p_is_blocked
      and exists (
        select 1
        from public.knowledge_articles as article
        where article.id = p_article_id
          and article.status = 'published'::public.knowledge_article_status
          and article.visibility = 'public'::public.knowledge_visibility
          and app_private.can_read_knowledge_article(
            article.tenant_id,
            article.visibility,
            article.status
          )
      )
    );
$$;

drop policy if exists knowledge_article_assets_select_managed_or_public on public.knowledge_article_assets;
create policy knowledge_article_assets_select_managed_or_public
on public.knowledge_article_assets
for select
using (
  app_private.can_read_knowledge_article_asset(
    article_id,
    visibility,
    review_status,
    is_blocked
  )
);

drop policy if exists knowledge_article_assets_write_managed on public.knowledge_article_assets;
create policy knowledge_article_assets_write_managed
on public.knowledge_article_assets
for all
using (app_private.can_manage_knowledge_base())
with check (app_private.can_manage_knowledge_base());

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'knowledge-assets',
  'knowledge-assets',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists knowledge_assets_admin_write on storage.objects;
drop policy if exists knowledge_assets_admin_insert on storage.objects;
create policy knowledge_assets_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'knowledge-assets'
  and app_private.can_manage_knowledge_base()
);

drop policy if exists knowledge_assets_admin_update on storage.objects;
create policy knowledge_assets_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'knowledge-assets'
  and app_private.can_manage_knowledge_base()
)
with check (
  bucket_id = 'knowledge-assets'
  and app_private.can_manage_knowledge_base()
);

drop policy if exists knowledge_assets_admin_select on storage.objects;
create policy knowledge_assets_admin_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'knowledge-assets'
  and app_private.can_manage_knowledge_base()
);

drop policy if exists knowledge_assets_admin_delete on storage.objects;
create policy knowledge_assets_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'knowledge-assets'
  and app_private.can_manage_knowledge_base()
);

drop policy if exists knowledge_assets_public_read_approved on storage.objects;
create policy knowledge_assets_public_read_approved
on storage.objects
for select
to anon
using (
  bucket_id = 'knowledge-assets'
  and exists (
    select 1
    from public.knowledge_article_assets as asset
    where asset.storage_bucket = storage.objects.bucket_id
      and asset.storage_object_path = storage.objects.name
      and app_private.can_read_knowledge_article_asset(
        asset.article_id,
        asset.visibility,
        asset.review_status,
        asset.is_blocked
      )
  )
);

create or replace view public.vw_admin_knowledge_article_assets
as
select
  asset.id,
  asset.article_id,
  article.knowledge_space_id,
  space.slug as knowledge_space_slug,
  article.tenant_id,
  article.title as article_title,
  article.slug as article_slug,
  article.status as article_status,
  article.visibility as article_visibility,
  asset.source_url,
  asset.source_path,
  asset.source_hash,
  asset.storage_bucket,
  asset.storage_object_path,
  asset.detected_mime_type,
  asset.file_size_bytes,
  asset.width,
  asset.height,
  asset.alt_text,
  asset.caption,
  asset.review_status,
  asset.visibility,
  asset.is_blocked,
  asset.created_at,
  asset.updated_at
from public.knowledge_article_assets as asset
join public.knowledge_articles as article
  on article.id = asset.article_id
join public.knowledge_spaces as space
  on space.id = article.knowledge_space_id
where app_private.can_manage_knowledge_base();

create or replace view public.vw_public_knowledge_article_assets
as
select
  asset.id,
  asset.article_id,
  article.knowledge_space_id,
  space.slug as knowledge_space_slug,
  article.slug as article_slug,
  asset.storage_bucket,
  asset.storage_object_path,
  asset.detected_mime_type,
  asset.width,
  asset.height,
  asset.alt_text,
  asset.caption,
  asset.updated_at
from public.knowledge_article_assets as asset
join public.knowledge_articles as article
  on article.id = asset.article_id
join public.knowledge_spaces as space
  on space.id = article.knowledge_space_id
where app_private.can_read_knowledge_article_asset(
  asset.article_id,
  asset.visibility,
  asset.review_status,
  asset.is_blocked
);

create or replace function public.rpc_admin_unpublish_knowledge_article_v2(
  p_article_id uuid,
  p_knowledge_space_id uuid,
  p_reason text default 'removed from public help pending structured reprocessing'
)
returns public.knowledge_articles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.knowledge_articles;
  v_article public.knowledge_articles;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.can_manage_knowledge_base() then
    raise exception 'rpc_admin_unpublish_knowledge_article_v2 denied';
  end if;

  if p_knowledge_space_id is null then
    raise exception 'knowledge space is required';
  end if;

  select *
  into v_existing
  from public.knowledge_articles as article
  where article.id = p_article_id;

  if v_existing.id is null then
    raise exception 'knowledge article not found';
  end if;

  if v_existing.knowledge_space_id is distinct from p_knowledge_space_id then
    raise exception 'knowledge article space mismatch';
  end if;

  if v_existing.status <> 'published'::public.knowledge_article_status then
    raise exception 'knowledge article must be published before unpublish';
  end if;

  update public.knowledge_articles
  set
    status = 'review',
    visibility = 'internal',
    submitted_for_review_at = timezone('utc', now()),
    published_at = null,
    archived_at = null,
    current_revision_number = current_revision_number + 1,
    updated_by_user_id = v_actor_user_id
  where id = p_article_id
  returning *
  into v_article;

  perform app_private.capture_knowledge_revision(
    v_article.id,
    v_actor_user_id,
    coalesce(nullif(btrim(p_reason), ''), 'unpublished via v2')
  );

  return v_article;
end;
$$;

create or replace function public.rpc_admin_upsert_knowledge_article_asset_v1(
  p_article_id uuid,
  p_knowledge_space_id uuid,
  p_source_url text,
  p_source_path text,
  p_source_hash text,
  p_storage_object_path text,
  p_detected_mime_type text,
  p_file_size_bytes integer,
  p_width integer default null,
  p_height integer default null,
  p_alt_text text default null,
  p_caption text default null,
  p_review_status public.knowledge_article_asset_review_status default 'pending',
  p_visibility public.knowledge_visibility default 'internal',
  p_is_blocked boolean default false
)
returns public.knowledge_article_assets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_article public.knowledge_articles;
  v_asset public.knowledge_article_assets;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.can_manage_knowledge_base() then
    raise exception 'rpc_admin_upsert_knowledge_article_asset_v1 denied';
  end if;

  select *
  into v_article
  from public.knowledge_articles as article
  where article.id = p_article_id;

  if v_article.id is null then
    raise exception 'knowledge article not found';
  end if;

  if v_article.knowledge_space_id is distinct from p_knowledge_space_id then
    raise exception 'knowledge article space mismatch';
  end if;

  insert into public.knowledge_article_assets (
    article_id,
    source_url,
    source_path,
    source_hash,
    storage_bucket,
    storage_object_path,
    detected_mime_type,
    file_size_bytes,
    width,
    height,
    alt_text,
    caption,
    review_status,
    visibility,
    is_blocked,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_article_id,
    nullif(btrim(p_source_url), ''),
    btrim(p_source_path),
    btrim(p_source_hash),
    'knowledge-assets',
    btrim(p_storage_object_path),
    btrim(p_detected_mime_type),
    p_file_size_bytes,
    p_width,
    p_height,
    nullif(btrim(p_alt_text), ''),
    nullif(btrim(p_caption), ''),
    p_review_status,
    p_visibility,
    p_is_blocked,
    v_actor_user_id,
    v_actor_user_id
  )
  on conflict (article_id, source_path, source_hash)
  do update
  set
    source_url = excluded.source_url,
    storage_object_path = excluded.storage_object_path,
    detected_mime_type = excluded.detected_mime_type,
    file_size_bytes = excluded.file_size_bytes,
    width = excluded.width,
    height = excluded.height,
    alt_text = excluded.alt_text,
    caption = excluded.caption,
    review_status = excluded.review_status,
    visibility = excluded.visibility,
    is_blocked = excluded.is_blocked,
    updated_by_user_id = v_actor_user_id
  returning *
  into v_asset;

  return v_asset;
end;
$$;

create or replace function public.rpc_admin_update_knowledge_article_asset_review_v1(
  p_asset_id uuid,
  p_review_status public.knowledge_article_asset_review_status,
  p_visibility public.knowledge_visibility,
  p_is_blocked boolean default false,
  p_alt_text text default null,
  p_caption text default null
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
    raise exception 'rpc_admin_update_knowledge_article_asset_review_v1 denied';
  end if;

  update public.knowledge_article_assets
  set
    review_status = p_review_status,
    visibility = p_visibility,
    is_blocked = p_is_blocked,
    alt_text = nullif(btrim(p_alt_text), ''),
    caption = nullif(btrim(p_caption), ''),
    updated_by_user_id = v_actor_user_id
  where id = p_asset_id
  returning *
  into v_asset;

  if v_asset.id is null then
    raise exception 'knowledge article asset not found';
  end if;

  return v_asset;
end;
$$;

revoke all on public.knowledge_article_assets from public, anon, authenticated, service_role;
revoke all on public.vw_admin_knowledge_article_assets from public, anon, authenticated, service_role;
revoke all on public.vw_public_knowledge_article_assets from public, anon, authenticated, service_role;
revoke all on function app_private.can_read_knowledge_article_asset(
  uuid,
  public.knowledge_visibility,
  public.knowledge_article_asset_review_status,
  boolean
) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_unpublish_knowledge_article_v2(uuid, uuid, text) from public, anon;
revoke all on function public.rpc_admin_upsert_knowledge_article_asset_v1(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  integer,
  integer,
  integer,
  text,
  text,
  public.knowledge_article_asset_review_status,
  public.knowledge_visibility,
  boolean
) from public, anon;
revoke all on function public.rpc_admin_update_knowledge_article_asset_review_v1(
  uuid,
  public.knowledge_article_asset_review_status,
  public.knowledge_visibility,
  boolean,
  text,
  text
) from public, anon;

grant select on public.knowledge_article_assets to authenticated, service_role;
grant select on public.vw_admin_knowledge_article_assets to authenticated, service_role;
grant select on public.vw_public_knowledge_article_assets to anon, authenticated, service_role;
grant execute on function public.rpc_admin_unpublish_knowledge_article_v2(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.rpc_admin_upsert_knowledge_article_asset_v1(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  integer,
  integer,
  integer,
  text,
  text,
  public.knowledge_article_asset_review_status,
  public.knowledge_visibility,
  boolean
) to authenticated, service_role;
grant execute on function public.rpc_admin_update_knowledge_article_asset_review_v1(
  uuid,
  public.knowledge_article_asset_review_status,
  public.knowledge_visibility,
  boolean,
  text,
  text
) to authenticated, service_role;

comment on table public.knowledge_article_assets is
  'Assets governados vinculados a artigos Knowledge. Preserva origem legado, storage interno e status de revisao antes de exposicao publica.';

comment on view public.vw_admin_knowledge_article_assets is
  'Read model administrativo para curadoria de assets de artigos Knowledge.';

comment on view public.vw_public_knowledge_article_assets is
  'Read model publico de assets aprovados, vinculados somente a artigos published/public.';

comment on function public.rpc_admin_unpublish_knowledge_article_v2(uuid, uuid, text) is
  'Remove artigo published da superficie publica, retornando para review/internal com auditoria.';

comment on function public.rpc_admin_upsert_knowledge_article_asset_v1(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  integer,
  integer,
  integer,
  text,
  text,
  public.knowledge_article_asset_review_status,
  public.knowledge_visibility,
  boolean
) is
  'Materializa ou atualiza asset legado de artigo Knowledge sem publicar automaticamente.';

comment on function public.rpc_admin_update_knowledge_article_asset_review_v1(
  uuid,
  public.knowledge_article_asset_review_status,
  public.knowledge_visibility,
  boolean,
  text,
  text
) is
  'Atualiza revisao editorial de um asset Knowledge, incluindo alt text, caption, bloqueio e visibilidade.';
