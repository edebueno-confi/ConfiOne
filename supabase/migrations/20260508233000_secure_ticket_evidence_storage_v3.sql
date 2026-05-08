create type public.ticket_attachment_status as enum (
  'available',
  'archived'
);

alter table public.ticket_attachments
  add column if not exists status public.ticket_attachment_status not null default 'available',
  add column if not exists archived_at timestamptz;

update public.ticket_attachments
set status = 'available'::public.ticket_attachment_status
where status is distinct from 'available'::public.ticket_attachment_status;

create table public.ticket_attachment_upload_intents (
  id uuid primary key default extensions.gen_random_uuid(),
  attachment_id uuid not null unique,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  ticket_id uuid not null,
  visibility public.message_visibility not null default 'internal',
  original_filename text not null,
  content_type text not null,
  size_bytes bigint not null,
  storage_bucket text not null,
  storage_object_path text not null,
  created_by_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  uploaded_at timestamptz,
  registered_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  constraint ticket_attachment_upload_intents_ticket_fk
    foreign key (ticket_id, tenant_id)
    references public.tickets (id, tenant_id)
    on delete cascade,
  constraint ticket_attachment_upload_intents_original_filename_not_blank_check
    check (nullif(btrim(original_filename), '') is not null),
  constraint ticket_attachment_upload_intents_content_type_not_blank_check
    check (nullif(btrim(content_type), '') is not null),
  constraint ticket_attachment_upload_intents_bucket_not_blank_check
    check (nullif(btrim(storage_bucket), '') is not null),
  constraint ticket_attachment_upload_intents_object_path_not_blank_check
    check (nullif(btrim(storage_object_path), '') is not null),
  constraint ticket_attachment_upload_intents_size_bytes_check
    check (size_bytes > 0),
  constraint ticket_attachment_upload_intents_expiry_check
    check (expires_at > created_at)
);

create unique index ticket_attachment_upload_intents_storage_object_key
  on public.ticket_attachment_upload_intents (storage_bucket, storage_object_path);

create index ticket_attachment_upload_intents_ticket_lookup_idx
  on public.ticket_attachment_upload_intents (ticket_id, created_at desc);

create index ticket_attachment_upload_intents_actor_lookup_idx
  on public.ticket_attachment_upload_intents (created_by_user_id, created_at desc);

create table public.ticket_attachment_download_grants (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  attachment_id uuid not null references public.ticket_attachments (id) on delete cascade,
  granted_to_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  resolved_at timestamptz,
  constraint ticket_attachment_download_grants_expiry_check
    check (expires_at > created_at)
);

create index ticket_attachment_download_grants_attachment_lookup_idx
  on public.ticket_attachment_download_grants (attachment_id, created_at desc);

create index ticket_attachment_download_grants_actor_lookup_idx
  on public.ticket_attachment_download_grants (granted_to_user_id, created_at desc);

create or replace function app_private.ticket_attachment_max_bytes()
returns bigint
language sql
immutable
set search_path = ''
as $$
  select 10 * 1024 * 1024;
$$;

create or replace function app_private.ticket_attachment_allowed_content_types()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'application/pdf',
    'application/json',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/csv',
    'text/plain'
  ]::text[];
$$;

create or replace function app_private.clean_ticket_attachment_display_name(p_filename text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_value text;
  v_extension text;
  v_basename text;
begin
  v_value := nullif(btrim(coalesce(p_filename, '')), '');

  if v_value is null then
    raise exception 'original filename is required';
  end if;

  v_value := replace(v_value, E'\\', '-');
  v_value := replace(v_value, '/', '-');
  v_value := regexp_replace(v_value, '[[:cntrl:]]', '', 'g');
  v_value := regexp_replace(v_value, '\s+', ' ', 'g');
  v_value := btrim(v_value);

  if v_value = '' then
    raise exception 'original filename is required';
  end if;

  if strpos(v_value, '.') > 0 then
    v_extension := lower(regexp_replace(v_value, '^.*(\.[^.]+)$', '\1'));
    v_basename := regexp_replace(v_value, '\.[^.]+$', '');
  else
    v_extension := '';
    v_basename := v_value;
  end if;

  v_basename := left(v_basename, 96);
  v_extension := left(v_extension, 16);

  return left(v_basename || v_extension, 120);
end;
$$;

create or replace function app_private.normalize_ticket_attachment_storage_name(p_filename text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_display_name text;
  v_extension text;
  v_basename text;
begin
  v_display_name := app_private.clean_ticket_attachment_display_name(p_filename);

  if strpos(v_display_name, '.') > 0 then
    v_extension := lower(regexp_replace(v_display_name, '^.*(\.[^.]+)$', '\1'));
    v_basename := regexp_replace(v_display_name, '\.[^.]+$', '');
  else
    v_extension := '';
    v_basename := v_display_name;
  end if;

  v_basename := lower(v_basename);
  v_basename := regexp_replace(v_basename, '[^a-z0-9]+', '-', 'g');
  v_basename := regexp_replace(v_basename, '-{2,}', '-', 'g');
  v_basename := trim(both '-' from v_basename);

  if v_basename = '' then
    v_basename := 'evidencia';
  end if;

  v_basename := left(v_basename, 72);
  v_extension := regexp_replace(v_extension, '[^a-z0-9.]', '', 'g');
  v_extension := left(v_extension, 16);

  return left(v_basename || v_extension, 96);
end;
$$;

create or replace function app_private.build_ticket_attachment_object_path(
  p_tenant_id uuid,
  p_ticket_id uuid,
  p_attachment_id uuid,
  p_filename text
)
returns text
language sql
immutable
set search_path = ''
as $$
  select format(
    'tenant/%s/ticket/%s/attachment/%s/%s',
    p_tenant_id,
    p_ticket_id,
    p_attachment_id,
    app_private.normalize_ticket_attachment_storage_name(p_filename)
  );
$$;

create or replace function app_private.ticket_attachment_size_label(p_size_bytes bigint)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_size_bytes is null or p_size_bytes <= 0 then 'Tamanho indisponível'
    when p_size_bytes < 1024 then format('%s B', p_size_bytes)
    when p_size_bytes < 1024 * 1024 then format('%s KB', greatest(1, round(p_size_bytes::numeric / 1024)))
    else format('%s MB', round(p_size_bytes::numeric / (1024 * 1024), 1))
  end;
$$;

create or replace function app_private.can_upload_ticket_evidence_object(
  p_bucket_id text,
  p_object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.ticket_attachment_upload_intents as intent
    where intent.storage_bucket = p_bucket_id
      and intent.storage_object_path = p_object_name
      and intent.created_by_user_id = auth.uid()
      and intent.registered_at is null
      and intent.failed_at is null
      and intent.expires_at > timezone('utc', now())
      and app_private.can_access_support_workspace(intent.tenant_id)
  );
$$;

create or replace function app_private.can_download_ticket_evidence_object(
  p_bucket_id text,
  p_object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.ticket_attachments as ta
    where ta.storage_bucket = p_bucket_id
      and ta.storage_object_path = p_object_name
      and ta.status = 'available'::public.ticket_attachment_status
      and ta.archived_at is null
      and app_private.can_access_support_workspace(ta.tenant_id)
      and (
        ta.visibility = 'customer'::public.message_visibility
        or app_private.can_view_internal_ticket_content(ta.tenant_id)
      )
  );
$$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'ticket-evidence',
  'ticket-evidence',
  false,
  app_private.ticket_attachment_max_bytes(),
  app_private.ticket_attachment_allowed_content_types()
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists ticket_evidence_authenticated_insert on storage.objects;
create policy ticket_evidence_authenticated_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ticket-evidence'
  and app_private.can_upload_ticket_evidence_object(bucket_id, name)
);

drop policy if exists ticket_evidence_authenticated_select on storage.objects;
create policy ticket_evidence_authenticated_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ticket-evidence'
  and app_private.can_download_ticket_evidence_object(bucket_id, name)
);

create or replace function public.rpc_support_create_ticket_attachment_upload(
  p_ticket_id uuid,
  p_tenant_id uuid,
  p_original_filename text,
  p_content_type text,
  p_size_bytes bigint
)
returns table (
  attachment_id uuid,
  upload_intent_id uuid,
  ticket_id uuid,
  tenant_id uuid,
  display_name text,
  content_type text,
  size_bytes bigint,
  max_size_bytes bigint,
  expires_at timestamptz,
  upload_url text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_ticket public.tickets;
  v_attachment_id uuid;
  v_display_name text;
  v_content_type text;
  v_storage_path text;
  v_intent public.ticket_attachment_upload_intents;
  v_max_size bigint;
  v_allowed_types text[];
begin
  v_actor_user_id := app_private.require_active_actor();
  v_max_size := app_private.ticket_attachment_max_bytes();
  v_allowed_types := app_private.ticket_attachment_allowed_content_types();
  v_display_name := app_private.clean_ticket_attachment_display_name(p_original_filename);
  v_content_type := lower(nullif(btrim(coalesce(p_content_type, '')), ''));

  if p_ticket_id is null or p_tenant_id is null then
    raise exception 'ticket_id and tenant_id are required';
  end if;

  if v_content_type is null then
    raise exception 'content type is required';
  end if;

  if not v_content_type = any(v_allowed_types) then
    raise exception 'content type is not allowed';
  end if;

  if p_size_bytes is null or p_size_bytes <= 0 then
    raise exception 'file size must be greater than zero';
  end if;

  if p_size_bytes > v_max_size then
    raise exception 'file size exceeds the configured limit';
  end if;

  select *
  into v_ticket
  from public.tickets as t
  where t.id = p_ticket_id
    and t.tenant_id = p_tenant_id
  for update;

  if v_ticket.id is null then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_access_support_workspace(v_ticket.tenant_id) then
    raise exception 'rpc_support_create_ticket_attachment_upload denied';
  end if;

  if v_ticket.status = any(array['closed', 'cancelled']::public.ticket_status[]) then
    raise exception 'ticket is not eligible for evidence upload';
  end if;

  v_attachment_id := extensions.gen_random_uuid();
  v_storage_path := app_private.build_ticket_attachment_object_path(
    v_ticket.tenant_id,
    v_ticket.id,
    v_attachment_id,
    v_display_name
  );

  insert into public.ticket_attachment_upload_intents (
    attachment_id,
    tenant_id,
    ticket_id,
    visibility,
    original_filename,
    content_type,
    size_bytes,
    storage_bucket,
    storage_object_path,
    created_by_user_id,
    expires_at
  )
  values (
    v_attachment_id,
    v_ticket.tenant_id,
    v_ticket.id,
    'internal'::public.message_visibility,
    v_display_name,
    v_content_type,
    p_size_bytes,
    'ticket-evidence',
    v_storage_path,
    v_actor_user_id,
    timezone('utc', now()) + interval '15 minutes'
  )
  returning *
  into v_intent;

  attachment_id := v_intent.attachment_id;
  upload_intent_id := v_intent.id;
  ticket_id := v_intent.ticket_id;
  tenant_id := v_intent.tenant_id;
  display_name := v_intent.original_filename;
  content_type := v_intent.content_type;
  size_bytes := v_intent.size_bytes;
  max_size_bytes := v_max_size;
  expires_at := v_intent.expires_at;
  upload_url := format('/functions/v1/ticket-evidence-upload?intent=%s', v_intent.id);

  return next;
end;
$$;

create or replace function public.rpc_support_register_ticket_attachment(
  p_upload_intent_id uuid
)
returns table (
  attachment_id uuid,
  ticket_id uuid,
  display_name text,
  content_type text,
  size_bytes bigint,
  uploaded_by_name text,
  created_at timestamptz,
  status public.ticket_attachment_status,
  can_download boolean,
  can_archive boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_intent public.ticket_attachment_upload_intents;
  v_attachment public.ticket_attachments;
begin
  v_actor_user_id := app_private.require_active_actor();

  if p_upload_intent_id is null then
    raise exception 'upload intent is required';
  end if;

  select *
  into v_intent
  from public.ticket_attachment_upload_intents as intent
  where intent.id = p_upload_intent_id
  for update;

  if v_intent.id is null then
    raise exception 'upload intent not found';
  end if;

  if v_intent.created_by_user_id <> v_actor_user_id then
    raise exception 'upload intent does not belong to the active actor';
  end if;

  if not app_private.can_access_support_workspace(v_intent.tenant_id) then
    raise exception 'rpc_support_register_ticket_attachment denied';
  end if;

  if v_intent.expires_at <= timezone('utc', now()) then
    raise exception 'upload intent expired';
  end if;

 if v_intent.registered_at is not null then
    return query
    select
      ta.id as attachment_id,
      ta.ticket_id,
      ta.file_name as display_name,
      ta.content_type,
      ta.byte_size as size_bytes,
      uploader.full_name as uploaded_by_name,
      ta.created_at,
      ta.status,
      (
        ta.archived_at is null
        and ta.status = 'available'::public.ticket_attachment_status
        and (
          ta.visibility = 'customer'::public.message_visibility
          or app_private.can_view_internal_ticket_content(ta.tenant_id)
        )
      ) as can_download,
      false as can_archive
    from public.ticket_attachments as ta
    left join public.profiles as uploader
      on uploader.id = ta.uploaded_by_user_id
    where ta.id = v_intent.attachment_id;
    return;
  end if;

  if not exists (
    select 1
    from storage.objects as object_row
    where object_row.bucket_id = v_intent.storage_bucket
      and object_row.name = v_intent.storage_object_path
  ) then
    raise exception 'uploaded object not found';
  end if;

  insert into public.ticket_attachments (
    id,
    tenant_id,
    ticket_id,
    message_id,
    visibility,
    storage_bucket,
    storage_object_path,
    file_name,
    content_type,
    byte_size,
    uploaded_by_user_id,
    status,
    archived_at
  )
  values (
    v_intent.attachment_id,
    v_intent.tenant_id,
    v_intent.ticket_id,
    null,
    v_intent.visibility,
    v_intent.storage_bucket,
    v_intent.storage_object_path,
    v_intent.original_filename,
    v_intent.content_type,
    v_intent.size_bytes,
    v_intent.created_by_user_id,
    'available'::public.ticket_attachment_status,
    null
  )
  on conflict (id) do nothing;

  select *
  into v_attachment
  from public.ticket_attachments as ta
  where ta.id = v_intent.attachment_id;

  update public.ticket_attachment_upload_intents
  set
    uploaded_at = coalesce(uploaded_at, timezone('utc', now())),
    registered_at = timezone('utc', now()),
    failed_at = null,
    failure_reason = null
  where id = v_intent.id;

  perform app_private.create_ticket_event(
    v_attachment.ticket_id,
    v_attachment.tenant_id,
    'attachment_added'::public.ticket_event_type,
    'internal'::public.message_visibility,
    v_actor_user_id,
    jsonb_build_object(
      'attachment_id', v_attachment.id,
      'attachment_name', v_attachment.file_name,
      'attachment_content_type', v_attachment.content_type,
      'attachment_size_bytes', v_attachment.byte_size,
      'attachment_size_label', app_private.ticket_attachment_size_label(v_attachment.byte_size),
      'status', v_attachment.status
    )
  );

  return query
  select
    ta.id as attachment_id,
    ta.ticket_id,
    ta.file_name as display_name,
    ta.content_type,
    ta.byte_size as size_bytes,
    uploader.full_name as uploaded_by_name,
    ta.created_at,
    ta.status,
    (
      ta.archived_at is null
      and ta.status = 'available'::public.ticket_attachment_status
      and (
        ta.visibility = 'customer'::public.message_visibility
        or app_private.can_view_internal_ticket_content(ta.tenant_id)
      )
    ) as can_download,
    false as can_archive
  from public.ticket_attachments as ta
  left join public.profiles as uploader
    on uploader.id = ta.uploaded_by_user_id
  where ta.id = v_attachment.id;
end;
$$;

create or replace function public.rpc_support_get_ticket_attachment_download_url(
  p_attachment_id uuid
)
returns table (
  attachment_id uuid,
  expires_at timestamptz,
  download_url text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_attachment public.ticket_attachments;
  v_grant public.ticket_attachment_download_grants;
begin
  v_actor_user_id := app_private.require_active_actor();

  if p_attachment_id is null then
    raise exception 'attachment is required';
  end if;

  select *
  into v_attachment
  from public.ticket_attachments as ta
  where ta.id = p_attachment_id;

  if v_attachment.id is null then
    raise exception 'attachment not found';
  end if;

  if not app_private.can_access_support_workspace(v_attachment.tenant_id) then
    raise exception 'rpc_support_get_ticket_attachment_download_url denied';
  end if;

  if v_attachment.archived_at is not null
     or v_attachment.status <> 'available'::public.ticket_attachment_status then
    raise exception 'attachment is not available';
  end if;

  if v_attachment.visibility <> 'customer'::public.message_visibility
     and not app_private.can_view_internal_ticket_content(v_attachment.tenant_id) then
    raise exception 'attachment download is not allowed for the active actor';
  end if;

  insert into public.ticket_attachment_download_grants (
    tenant_id,
    attachment_id,
    granted_to_user_id,
    expires_at
  )
  values (
    v_attachment.tenant_id,
    v_attachment.id,
    v_actor_user_id,
    timezone('utc', now()) + interval '5 minutes'
  )
  returning *
  into v_grant;

  attachment_id := v_attachment.id;
  expires_at := v_grant.expires_at;
  download_url := format('/functions/v1/ticket-evidence-download?grant=%s', v_grant.id);

  return next;
end;
$$;

drop view if exists public.vw_support_ticket_attachments;
create view public.vw_support_ticket_attachments
with (security_barrier = true)
as
select
  ta.id as attachment_id,
  ta.ticket_id,
  ta.file_name as display_name,
  ta.content_type,
  ta.byte_size as size_bytes,
  uploader.full_name as uploaded_by_name,
  ta.created_at,
  ta.status,
  (
    ta.archived_at is null
    and ta.status = 'available'::public.ticket_attachment_status
    and app_private.can_access_support_workspace(ta.tenant_id)
    and (
      ta.visibility = 'customer'::public.message_visibility
      or app_private.can_view_internal_ticket_content(ta.tenant_id)
    )
  ) as can_download,
  false as can_archive
from public.ticket_attachments as ta
join public.tickets as t
  on t.id = ta.ticket_id
 and t.tenant_id = ta.tenant_id
left join public.profiles as uploader
  on uploader.id = ta.uploaded_by_user_id
where ta.archived_at is null
  and app_private.can_access_support_workspace(t.tenant_id)
  and (
    ta.visibility = 'customer'::public.message_visibility
    or app_private.can_view_internal_ticket_content(t.tenant_id)
  );

revoke all on public.ticket_attachment_upload_intents from public, anon, authenticated;
revoke all on public.ticket_attachment_download_grants from public, anon, authenticated;
grant select, update on public.ticket_attachment_upload_intents to service_role;
grant select, update on public.ticket_attachment_download_grants to service_role;

alter table public.ticket_attachment_upload_intents enable row level security;
alter table public.ticket_attachment_download_grants enable row level security;

create trigger ticket_attachment_upload_intents_set_updated_audit
after insert or update or delete on public.ticket_attachment_upload_intents
for each row
execute function audit.capture_row_change();

create trigger ticket_attachment_download_grants_set_updated_audit
after insert or update or delete on public.ticket_attachment_download_grants
for each row
execute function audit.capture_row_change();

revoke all on function app_private.ticket_attachment_max_bytes() from public, anon, authenticated, service_role;
revoke all on function app_private.ticket_attachment_allowed_content_types() from public, anon, authenticated, service_role;
revoke all on function app_private.clean_ticket_attachment_display_name(text) from public, anon, authenticated, service_role;
revoke all on function app_private.normalize_ticket_attachment_storage_name(text) from public, anon, authenticated, service_role;
revoke all on function app_private.build_ticket_attachment_object_path(uuid, uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function app_private.ticket_attachment_size_label(bigint) from public, anon, authenticated, service_role;
revoke all on function app_private.can_upload_ticket_evidence_object(text, text) from public, anon, authenticated, service_role;
revoke all on function app_private.can_download_ticket_evidence_object(text, text) from public, anon, authenticated, service_role;
grant execute on function app_private.ticket_attachment_max_bytes() to authenticated, service_role;
grant execute on function app_private.ticket_attachment_allowed_content_types() to authenticated, service_role;
grant execute on function app_private.can_upload_ticket_evidence_object(text, text) to authenticated, service_role;
grant execute on function app_private.can_download_ticket_evidence_object(text, text) to authenticated, service_role;

revoke all on function public.rpc_support_create_ticket_attachment_upload(uuid, uuid, text, text, bigint) from public, anon, authenticated, service_role;
revoke all on function public.rpc_support_register_ticket_attachment(uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_support_get_ticket_attachment_download_url(uuid) from public, anon, authenticated, service_role;
grant execute on function public.rpc_support_create_ticket_attachment_upload(uuid, uuid, text, text, bigint) to authenticated, service_role;
grant execute on function public.rpc_support_register_ticket_attachment(uuid) to authenticated, service_role;
grant execute on function public.rpc_support_get_ticket_attachment_download_url(uuid) to authenticated, service_role;

revoke all on public.vw_support_ticket_attachments from public, anon, authenticated, service_role;
grant select on public.vw_support_ticket_attachments to authenticated, service_role;

comment on function public.rpc_support_create_ticket_attachment_upload(uuid, uuid, text, text, bigint) is
  'Prepara um upload seguro de evidência para ticket, validando ator, tenant, ticket, tipo e tamanho antes de emitir uma intenção opaca de upload.';

comment on function public.rpc_support_register_ticket_attachment(uuid) is
  'Finaliza o registro de uma evidência já enviada ao storage governado, sem expor bucket ou path ao frontend.';

comment on function public.rpc_support_get_ticket_attachment_download_url(uuid) is
  'Emite uma URL temporária opaca para download seguro de evidência, mantendo bucket e path internos fora do contrato do frontend.';

comment on view public.vw_support_ticket_attachments is
  'Read model sanitizado de evidências do ticket para o Support Workspace, sem expor bucket, path interno ou URLs permanentes.';
