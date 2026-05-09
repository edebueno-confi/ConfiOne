create or replace function app_private.ticket_attachment_customer_allowed_content_types()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[];
$$;

create or replace function app_private.ticket_attachment_customer_max_bytes()
returns bigint
language sql
immutable
set search_path = ''
as $$
  select 10 * 1024 * 1024;
$$;

create or replace function app_private.can_upload_customer_ticket_evidence_object(
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
      and intent.visibility = 'customer'::public.message_visibility
      and intent.created_by_user_id = auth.uid()
      and intent.registered_at is null
      and intent.failed_at is null
      and intent.expires_at > timezone('utc', now())
      and intent.content_type = any(app_private.ticket_attachment_customer_allowed_content_types())
      and intent.size_bytes <= app_private.ticket_attachment_customer_max_bytes()
      and app_private.can_access_customer_ticket(intent.ticket_id, intent.tenant_id)
  );
$$;

create or replace function app_private.can_download_customer_ticket_evidence_object(
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
    from public.ticket_attachments as attachment
    where attachment.storage_bucket = p_bucket_id
      and attachment.storage_object_path = p_object_name
      and attachment.visibility = 'customer'::public.message_visibility
      and attachment.status = 'available'::public.ticket_attachment_status
      and attachment.archived_at is null
      and app_private.can_access_customer_ticket(attachment.ticket_id, attachment.tenant_id)
  );
$$;

drop policy if exists ticket_evidence_customer_insert on storage.objects;
create policy ticket_evidence_customer_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ticket-evidence'
  and app_private.can_upload_customer_ticket_evidence_object(bucket_id, name)
);

drop policy if exists ticket_evidence_customer_select on storage.objects;
create policy ticket_evidence_customer_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ticket-evidence'
  and app_private.can_download_customer_ticket_evidence_object(bucket_id, name)
);

create or replace view public.vw_customer_portal_ticket_attachments
with (security_barrier = true)
as
select
  ta.id as attachment_id,
  ta.ticket_id,
  ta.tenant_id,
  ta.file_name as display_name,
  ta.content_type,
  ta.byte_size as size_bytes,
  case
    when ta.byte_size >= 1048576 then round((ta.byte_size::numeric / 1048576::numeric), 1)::text || ' MB'
    when ta.byte_size >= 1024 then round((ta.byte_size::numeric / 1024::numeric), 1)::text || ' KB'
    else ta.byte_size::text || ' B'
  end as size_label,
  app_private.customer_portal_actor_label(ta.tenant_id, ta.uploaded_by_user_id) as uploaded_by_label,
  ta.created_at,
  ta.status,
  true as can_download
from public.ticket_attachments as ta
where ta.visibility = 'customer'::public.message_visibility
  and ta.status = 'available'::public.ticket_attachment_status
  and ta.archived_at is null
  and app_private.can_access_customer_ticket(ta.ticket_id, ta.tenant_id);

create or replace function public.rpc_customer_create_ticket_attachment_upload(
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
  v_max_size := app_private.ticket_attachment_customer_max_bytes();
  v_allowed_types := app_private.ticket_attachment_customer_allowed_content_types();
  v_display_name := app_private.clean_ticket_attachment_display_name(p_original_filename);
  v_content_type := lower(nullif(btrim(coalesce(p_content_type, '')), ''));

  if p_ticket_id is null or p_tenant_id is null then
    raise exception 'ticket_id and tenant_id are required';
  end if;

  if v_content_type is null then
    raise exception 'content type is required';
  end if;

  if not v_content_type = any(v_allowed_types) then
    raise exception 'content type is not allowed for customer portal';
  end if;

  if p_size_bytes is null or p_size_bytes <= 0 then
    raise exception 'file size must be greater than zero';
  end if;

  if p_size_bytes > v_max_size then
    raise exception 'file size exceeds the customer portal limit';
  end if;

  select *
  into v_ticket
  from public.tickets as ticket
  where ticket.id = p_ticket_id
    and ticket.tenant_id = p_tenant_id
  for update;

  if v_ticket.id is null then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_access_customer_ticket(v_ticket.id, v_ticket.tenant_id) then
    raise exception 'rpc_customer_create_ticket_attachment_upload denied';
  end if;

  if v_ticket.status = any(array['closed', 'cancelled']::public.ticket_status[]) then
    raise exception 'ticket is not open for customer evidence upload';
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
    'customer'::public.message_visibility,
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
  upload_url := format('/functions/v1/ticket-evidence-upload?intent=%s&boundary=customer', v_intent.id);

  return next;
end;
$$;

create or replace function public.rpc_customer_register_ticket_attachment(
  p_upload_intent_id uuid
)
returns table (
  attachment_id uuid,
  ticket_id uuid,
  tenant_id uuid,
  display_name text,
  content_type text,
  size_bytes bigint,
  size_label text,
  uploaded_by_label text,
  created_at timestamptz,
  status public.ticket_attachment_status,
  can_download boolean
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
    raise exception 'upload intent does not belong to the active customer actor';
  end if;

  if v_intent.visibility <> 'customer'::public.message_visibility then
    raise exception 'upload intent is not customer-facing';
  end if;

  if not app_private.can_access_customer_ticket(v_intent.ticket_id, v_intent.tenant_id) then
    raise exception 'rpc_customer_register_ticket_attachment denied';
  end if;

  if not v_intent.content_type = any(app_private.ticket_attachment_customer_allowed_content_types()) then
    raise exception 'content type is not allowed for customer portal';
  end if;

  if v_intent.size_bytes > app_private.ticket_attachment_customer_max_bytes() then
    raise exception 'file size exceeds the customer portal limit';
  end if;

  if v_intent.expires_at <= timezone('utc', now()) then
    raise exception 'upload intent expired';
  end if;

  if v_intent.registered_at is null and not exists (
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
    'customer'::public.message_visibility,
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
  from public.ticket_attachments as attachment
  where attachment.id = v_intent.attachment_id;

  update public.ticket_attachment_upload_intents
  set
    uploaded_at = coalesce(uploaded_at, timezone('utc', now())),
    registered_at = coalesce(registered_at, timezone('utc', now())),
    failed_at = null,
    failure_reason = null
  where id = v_intent.id;

  if v_intent.registered_at is null then
    perform app_private.create_ticket_event(
      v_attachment.ticket_id,
      v_attachment.tenant_id,
      'attachment_added'::public.ticket_event_type,
      'customer'::public.message_visibility,
      v_actor_user_id,
      jsonb_build_object(
        'attachment_id', v_attachment.id,
        'attachment_name', v_attachment.file_name,
        'attachment_content_type', v_attachment.content_type,
        'attachment_size_bytes', v_attachment.byte_size,
        'attachment_size_label', app_private.ticket_attachment_size_label(v_attachment.byte_size),
        'source', 'customer_portal',
        'status', v_attachment.status
      )
    );
  end if;

  return query
  select
    view_row.attachment_id,
    view_row.ticket_id,
    view_row.tenant_id,
    view_row.display_name,
    view_row.content_type,
    view_row.size_bytes,
    view_row.size_label,
    view_row.uploaded_by_label,
    view_row.created_at,
    view_row.status,
    view_row.can_download
  from public.vw_customer_portal_ticket_attachments as view_row
  where view_row.attachment_id = v_attachment.id;
end;
$$;

revoke all on function app_private.ticket_attachment_customer_allowed_content_types() from public, anon, authenticated, service_role;
revoke all on function app_private.ticket_attachment_customer_max_bytes() from public, anon, authenticated, service_role;
revoke all on function app_private.can_upload_customer_ticket_evidence_object(text, text) from public, anon, authenticated, service_role;
revoke all on function app_private.can_download_customer_ticket_evidence_object(text, text) from public, anon, authenticated, service_role;

grant execute on function app_private.ticket_attachment_customer_allowed_content_types() to authenticated, service_role;
grant execute on function app_private.ticket_attachment_customer_max_bytes() to authenticated, service_role;
grant execute on function app_private.can_upload_customer_ticket_evidence_object(text, text) to authenticated, service_role;
grant execute on function app_private.can_download_customer_ticket_evidence_object(text, text) to authenticated, service_role;

revoke all on function public.rpc_customer_create_ticket_attachment_upload(uuid, uuid, text, text, bigint) from public, anon, authenticated, service_role;
revoke all on function public.rpc_customer_register_ticket_attachment(uuid) from public, anon, authenticated, service_role;

grant execute on function public.rpc_customer_create_ticket_attachment_upload(uuid, uuid, text, text, bigint) to authenticated, service_role;
grant execute on function public.rpc_customer_register_ticket_attachment(uuid) to authenticated, service_role;

comment on function app_private.ticket_attachment_customer_allowed_content_types() is
  'Whitelist customer-facing para upload de evidencias: imagens seguras e PDF, sem JSON/CSV/TXT do fluxo interno.';

comment on function app_private.ticket_attachment_customer_max_bytes() is
  'Limite customer-facing de upload de evidencias: 10 MB por arquivo.';

comment on function app_private.can_upload_customer_ticket_evidence_object(text, text) is
  'Policy helper de storage para upload customer-facing; valida intent ativa, ator, tenant, ticket e whitelist.';

comment on function app_private.can_download_customer_ticket_evidence_object(text, text) is
  'Policy helper de storage para leitura customer-facing de evidencias visiveis ao cliente.';

comment on function public.rpc_customer_create_ticket_attachment_upload(uuid, uuid, text, text, bigint) is
  'Cria uma intencao opaca de upload customer-facing para evidencia de ticket autorizado, sem expor bucket ou path.';

comment on function public.rpc_customer_register_ticket_attachment(uuid) is
  'Finaliza metadata sanitizada de evidencia enviada pelo cliente e gera evento customer-facing/audit trail.';
