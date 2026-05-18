create table public.internal_documents (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  source_path text not null unique,
  title text not null,
  category text not null,
  status text not null,
  sensitivity text not null,
  owner text not null,
  surfaces text[] not null,
  allow_inline_reader boolean not null default false,
  description text,
  current_version_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  constraint internal_documents_slug_format_check
    check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint internal_documents_source_path_format_check
    check (
      source_path = btrim(source_path)
      and source_path like '%.md'
      and source_path not like '/%'
      and position(chr(92) in source_path) = 0
      and source_path not like '%..%'
    ),
  constraint internal_documents_title_not_blank_check
    check (nullif(btrim(title), '') is not null),
  constraint internal_documents_category_not_blank_check
    check (nullif(btrim(category), '') is not null),
  constraint internal_documents_owner_not_blank_check
    check (nullif(btrim(owner), '') is not null),
  constraint internal_documents_description_not_blank_check
    check (description is null or nullif(btrim(description), '') is not null),
  constraint internal_documents_status_check
    check (status in ('draft', 'published', 'archived', 'blocked')),
  constraint internal_documents_sensitivity_check
    check (sensitivity in ('internal', 'restricted', 'public_internal')),
  constraint internal_documents_surfaces_not_empty_check
    check (array_length(surfaces, 1) > 0),
  constraint internal_documents_surfaces_allowed_check
    check (surfaces <@ array['product-docs', 'build-journal']::text[]),
  constraint internal_documents_archived_status_check
    check (
      (status = 'archived' and archived_at is not null)
      or (status <> 'archived')
    )
);

create table public.internal_document_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  document_id uuid not null references public.internal_documents (id) on delete restrict,
  source_hash text not null,
  body_md_sanitized text not null,
  original_size_bytes integer not null,
  sanitized_size_bytes integer not null,
  version_number integer not null,
  validation_status text not null,
  validation_warnings jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  synced_by_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint internal_document_versions_source_hash_format_check
    check (source_hash ~ '^[a-f0-9]{64}$'),
  constraint internal_document_versions_body_not_blank_check
    check (nullif(btrim(body_md_sanitized), '') is not null),
  constraint internal_document_versions_original_size_positive_check
    check (original_size_bytes > 0),
  constraint internal_document_versions_sanitized_size_positive_check
    check (sanitized_size_bytes > 0),
  constraint internal_document_versions_version_number_positive_check
    check (version_number > 0),
  constraint internal_document_versions_validation_status_check
    check (validation_status in ('valid', 'warning', 'blocked')),
  constraint internal_document_versions_validation_warnings_array_check
    check (jsonb_typeof(validation_warnings) = 'array'),
  constraint internal_document_versions_published_not_blocked_check
    check (validation_status <> 'blocked' or published_at is null),
  constraint internal_document_versions_document_version_unique
    unique (document_id, version_number),
  constraint internal_document_versions_document_hash_unique
    unique (document_id, source_hash)
);

alter table public.internal_documents
  add constraint internal_documents_current_version_fk
  foreign key (current_version_id)
  references public.internal_document_versions (id)
  on delete set null
  deferrable initially deferred;

create index internal_documents_status_category_idx
  on public.internal_documents (status, category, updated_at desc);

create index internal_documents_surface_lookup_idx
  on public.internal_documents using gin (surfaces);

create index internal_document_versions_document_lookup_idx
  on public.internal_document_versions (document_id, version_number desc);

create index internal_document_versions_hash_lookup_idx
  on public.internal_document_versions (source_hash);

create trigger internal_documents_touch_updated_at
before update on public.internal_documents
for each row
execute function app_private.touch_updated_at();

create or replace function app_private.ensure_internal_document_current_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.current_version_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.internal_document_versions as version_row
    where version_row.id = new.current_version_id
      and version_row.document_id = new.id
  ) then
    raise exception 'current_version_id must reference a version from the same internal document';
  end if;

  return new;
end;
$$;

create constraint trigger internal_documents_current_version_integrity
after insert or update of current_version_id on public.internal_documents
deferrable initially deferred
for each row
execute function app_private.ensure_internal_document_current_version();

create trigger internal_documents_audit_row_change
after insert or update or delete on public.internal_documents
for each row
execute function audit.capture_row_change();

create trigger internal_document_versions_audit_row_change
after insert or update or delete on public.internal_document_versions
for each row
execute function audit.capture_row_change();

alter table public.internal_documents enable row level security;
alter table public.internal_document_versions enable row level security;

revoke all on public.internal_documents from public, anon, authenticated, service_role;
revoke all on public.internal_document_versions from public, anon, authenticated, service_role;

grant select, insert, update on public.internal_documents to service_role;
grant select, insert, update on public.internal_document_versions to service_role;

create policy internal_documents_select_platform_admin
on public.internal_documents
for select
to authenticated
using (app_private.has_global_role('platform_admin'::public.platform_role));

create policy internal_document_versions_select_platform_admin
on public.internal_document_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.internal_documents as document_row
    where document_row.id = internal_document_versions.document_id
      and app_private.has_global_role('platform_admin'::public.platform_role)
  )
);

create or replace view public.vw_internal_documents_catalog
with (security_barrier = true)
as
  select
    document_row.id as document_id,
    document_row.slug,
    document_row.source_path,
    document_row.title,
    document_row.category,
    document_row.status,
    document_row.sensitivity,
    document_row.owner,
    document_row.surfaces,
    document_row.allow_inline_reader,
    document_row.description,
    version_row.source_hash as current_source_hash,
    version_row.version_number as current_version_number,
    version_row.validation_status as current_validation_status,
    document_row.updated_at,
    version_row.published_at
  from public.internal_documents as document_row
  join public.internal_document_versions as version_row
    on version_row.id = document_row.current_version_id
   and version_row.document_id = document_row.id
  where document_row.status not in ('archived', 'blocked')
    and version_row.validation_status <> 'blocked'
    and app_private.has_global_role('platform_admin'::public.platform_role);

create or replace view public.vw_internal_document_detail
with (security_barrier = true)
as
  select
    catalog.document_id,
    catalog.slug,
    catalog.source_path,
    catalog.title,
    catalog.category,
    catalog.status,
    catalog.sensitivity,
    catalog.owner,
    catalog.surfaces,
    catalog.allow_inline_reader,
    catalog.description,
    catalog.current_source_hash,
    catalog.current_version_number,
    catalog.current_validation_status,
    catalog.updated_at,
    catalog.published_at,
    version_row.body_md_sanitized,
    version_row.validation_warnings,
    version_row.sanitized_size_bytes,
    version_row.original_size_bytes
  from public.vw_internal_documents_catalog as catalog
  join public.internal_document_versions as version_row
    on version_row.document_id = catalog.document_id
   and version_row.source_hash = catalog.current_source_hash
   and version_row.version_number = catalog.current_version_number;

revoke all on public.vw_internal_documents_catalog from public, anon, authenticated, service_role;
revoke all on public.vw_internal_document_detail from public, anon, authenticated, service_role;

grant select on public.vw_internal_documents_catalog to authenticated, service_role;
grant select on public.vw_internal_document_detail to authenticated, service_role;

revoke all on function app_private.ensure_internal_document_current_version() from public, anon, authenticated, service_role;

comment on table public.internal_documents is
  'Catalogo governado de documentos internos oficiais whitelisted, separado da Knowledge Base e sem leitura runtime de filesystem.';

comment on table public.internal_document_versions is
  'Versoes sanitizadas e versionadas dos markdowns internos oficiais, derivadas de sync controlado e hash de origem.';

comment on view public.vw_internal_documents_catalog is
  'Catalogo contratual de documentos internos oficiais publicados, restrito a platform_admin neste corte.';

comment on view public.vw_internal_document_detail is
  'Detalhe contratual com markdown sanitizado do documento interno oficial, restrito a platform_admin neste corte.';
