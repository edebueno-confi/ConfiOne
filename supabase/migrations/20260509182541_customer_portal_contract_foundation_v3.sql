alter type public.tenant_role add value if not exists 'customer_user';
alter type public.tenant_role add value if not exists 'customer_manager';

create table if not exists public.customer_ticket_update_acknowledgements (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  ticket_id uuid not null,
  acknowledged_by_user_id uuid not null references public.profiles (id) on delete cascade,
  last_timeline_entry_id uuid,
  acknowledged_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles (id),
  updated_by_user_id uuid references public.profiles (id),
  constraint customer_ticket_update_acknowledgements_ticket_fk
    foreign key (ticket_id, tenant_id)
    references public.tickets (id, tenant_id)
    on delete cascade,
  constraint customer_ticket_update_acknowledgements_actor_pair_key
    unique (tenant_id, ticket_id, acknowledged_by_user_id)
);

create index if not exists customer_ticket_update_acknowledgements_actor_idx
  on public.customer_ticket_update_acknowledgements (
    acknowledged_by_user_id,
    acknowledged_at desc
  );

alter table public.customer_ticket_update_acknowledgements enable row level security;
alter table public.customer_ticket_update_acknowledgements force row level security;

drop policy if exists customer_ticket_update_acknowledgements_select_customer on public.customer_ticket_update_acknowledgements;
create policy customer_ticket_update_acknowledgements_select_customer
on public.customer_ticket_update_acknowledgements
for select
to authenticated
using (acknowledged_by_user_id = auth.uid());

create or replace function app_private.customer_ticket_status_label(p_status public.ticket_status)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_status
    when 'new' then 'Recebido'
    when 'triage' then 'Em análise'
    when 'waiting_customer' then 'Aguardando sua resposta'
    when 'waiting_support' then 'Com o suporte'
    when 'waiting_engineering' then 'Em validação técnica'
    when 'in_progress' then 'Em andamento'
    when 'resolved' then 'Resolvido'
    when 'closed' then 'Encerrado'
    when 'cancelled' then 'Cancelado'
    else 'Indisponível'
  end;
$$;

create or replace function app_private.customer_ticket_event_label(p_event_type public.ticket_event_type)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_event_type
    when 'ticket_created' then 'Ticket aberto'
    when 'message_added' then 'Atualização registrada'
    when 'attachment_added' then 'Evidência adicionada'
    when 'status_changed' then 'Status atualizado'
    when 'resolved' then 'Ticket resolvido'
    when 'closed' then 'Ticket encerrado'
    when 'reopened' then 'Ticket reaberto'
    when 'cancelled' then 'Ticket cancelado'
    else 'Atualização do ticket'
  end;
$$;

create or replace function app_private.customer_portal_contact_id(
  p_tenant_id uuid,
  p_user_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select tc.id
  from public.tenant_contacts as tc
  where tc.tenant_id = p_tenant_id
    and tc.linked_user_id = p_user_id
    and tc.is_active
  order by tc.is_primary desc, tc.created_at asc
  limit 1;
$$;

create or replace function app_private.is_customer_portal_member(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as p
    join public.tenant_memberships as tm
      on tm.user_id = p.id
     and tm.tenant_id = p_tenant_id
     and tm.status = 'active'::public.membership_status
     and tm.role::text in ('customer_user', 'customer_manager')
    join public.tenant_contacts as tc
      on tc.tenant_id = tm.tenant_id
     and tc.linked_user_id = tm.user_id
     and tc.is_active
    where p.id = auth.uid()
      and p.is_active
  );
$$;

create or replace function app_private.is_customer_portal_manager(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_memberships as tm
    join public.tenant_contacts as tc
      on tc.tenant_id = tm.tenant_id
     and tc.linked_user_id = tm.user_id
     and tc.is_active
    where tm.tenant_id = p_tenant_id
      and tm.user_id = auth.uid()
      and tm.status = 'active'::public.membership_status
      and tm.role::text = 'customer_manager'
  );
$$;

create or replace function app_private.can_access_customer_ticket(
  p_ticket_id uuid,
  p_tenant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tickets as t
    where t.id = p_ticket_id
      and t.tenant_id = p_tenant_id
      and app_private.is_customer_portal_member(t.tenant_id)
      and (
        app_private.is_customer_portal_manager(t.tenant_id)
        or t.created_by_user_id = auth.uid()
        or t.requester_contact_id = app_private.customer_portal_contact_id(t.tenant_id, auth.uid())
      )
  );
$$;

create or replace function app_private.customer_portal_actor_label(
  p_tenant_id uuid,
  p_actor_user_id uuid
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_actor_user_id is null then 'Genius'
    when p_actor_user_id = auth.uid() then 'Você'
    when exists (
      select 1
      from public.tenant_contacts as tc
      where tc.tenant_id = p_tenant_id
        and tc.linked_user_id = p_actor_user_id
        and tc.is_active
    ) then coalesce((
      select tc.full_name
      from public.tenant_contacts as tc
      where tc.tenant_id = p_tenant_id
        and tc.linked_user_id = p_actor_user_id
        and tc.is_active
      order by tc.is_primary desc, tc.created_at asc
      limit 1
    ), 'Contato do cliente')
    else 'Equipe Genius'
  end;
$$;

create or replace view public.vw_customer_portal_auth_context
with (security_barrier = true)
as
select
  p.id as user_id,
  p.full_name as user_full_name,
  p.email as user_email,
  tm.tenant_id,
  tenant.slug as tenant_slug,
  tenant.display_name as tenant_display_name,
  tenant.legal_name as tenant_legal_name,
  tm.role::text as portal_role,
  tc.id as contact_id,
  tc.full_name as contact_full_name,
  tc.email as contact_email,
  tc.job_title as contact_job_title,
  true as can_view_tickets,
  true as can_create_ticket,
  (tm.role::text = 'customer_manager') as can_view_all_tenant_tickets
from public.profiles as p
join public.tenant_memberships as tm
  on tm.user_id = p.id
 and tm.status = 'active'::public.membership_status
 and tm.role::text in ('customer_user', 'customer_manager')
join public.tenants as tenant
  on tenant.id = tm.tenant_id
 and tenant.status = 'active'::public.tenant_status
join public.tenant_contacts as tc
  on tc.tenant_id = tm.tenant_id
 and tc.linked_user_id = p.id
 and tc.is_active
where p.id = auth.uid()
  and p.is_active;

create or replace view public.vw_customer_portal_profile_context
with (security_barrier = true)
as
select
  ctx.user_id,
  ctx.user_full_name,
  ctx.user_email,
  ctx.tenant_id,
  ctx.tenant_slug,
  ctx.tenant_display_name,
  ctx.tenant_legal_name,
  ctx.portal_role,
  ctx.contact_id,
  ctx.contact_full_name,
  ctx.contact_email,
  ctx.contact_job_title,
  coalesce(cap.product_line::text, 'Indisponivel') as product_line,
  coalesce(cap.operational_status::text, 'Indisponivel') as operational_status,
  coalesce(cap.account_tier, 'Indisponivel') as account_tier,
  ctx.can_view_tickets,
  ctx.can_create_ticket,
  ctx.can_view_all_tenant_tickets
from public.vw_customer_portal_auth_context as ctx
left join public.customer_account_profiles as cap
  on cap.tenant_id = ctx.tenant_id;

create or replace view public.vw_customer_portal_ticket_list
with (security_barrier = true)
as
select
  t.id as ticket_id,
  t.tenant_id,
  tenant.slug as tenant_slug,
  tenant.display_name as tenant_display_name,
  t.requester_contact_id,
  requester.full_name as requester_contact_full_name,
  t.title,
  app_private.customer_ticket_status_label(t.status) as customer_status_label,
  t.status as internal_status,
  t.created_at,
  t.updated_at,
  last_customer_message.last_message_at,
  coalesce(customer_messages.message_count, 0)::integer as customer_message_count,
  coalesce(customer_attachments.attachment_count, 0)::integer as customer_attachment_count,
  coalesce(public_links.article_count, 0)::integer as public_article_count
from public.tickets as t
join public.tenants as tenant
  on tenant.id = t.tenant_id
left join public.tenant_contacts as requester
  on requester.id = t.requester_contact_id
 and requester.tenant_id = t.tenant_id
left join lateral (
  select max(tm.created_at) as last_message_at
  from public.ticket_messages as tm
  where tm.ticket_id = t.id
    and tm.tenant_id = t.tenant_id
    and tm.visibility = 'customer'::public.message_visibility
) as last_customer_message on true
left join lateral (
  select count(*) as message_count
  from public.ticket_messages as tm
  where tm.ticket_id = t.id
    and tm.tenant_id = t.tenant_id
    and tm.visibility = 'customer'::public.message_visibility
) as customer_messages on true
left join lateral (
  select count(*) as attachment_count
  from public.ticket_attachments as ta
  where ta.ticket_id = t.id
    and ta.tenant_id = t.tenant_id
    and ta.visibility = 'customer'::public.message_visibility
    and ta.status = 'available'::public.ticket_attachment_status
    and ta.archived_at is null
) as customer_attachments on true
left join lateral (
  select count(*) as article_count
  from public.ticket_knowledge_links as tkl
  join public.knowledge_articles as ka
    on ka.id = tkl.article_id
  where tkl.ticket_id = t.id
    and tkl.tenant_id = t.tenant_id
    and tkl.archived_at is null
    and tkl.link_type = 'sent_to_customer'::public.ticket_knowledge_link_type
    and ka.visibility = 'public'::public.knowledge_visibility
    and ka.status = 'published'::public.knowledge_article_status
    and ka.published_at is not null
) as public_links on true
where app_private.can_access_customer_ticket(t.id, t.tenant_id);

create or replace view public.vw_customer_portal_ticket_detail
with (security_barrier = true)
as
select
  t.id as ticket_id,
  t.tenant_id,
  tenant.slug as tenant_slug,
  tenant.display_name as tenant_display_name,
  t.requester_contact_id,
  requester.full_name as requester_contact_full_name,
  t.title,
  t.description,
  app_private.customer_ticket_status_label(t.status) as customer_status_label,
  t.status as internal_status,
  t.created_at,
  t.updated_at,
  t.resolved_at,
  t.closed_at,
  (t.status <> all(array['closed', 'cancelled']::public.ticket_status[])) as can_add_message,
  true as can_view_attachments,
  true as can_view_public_articles
from public.tickets as t
join public.tenants as tenant
  on tenant.id = t.tenant_id
left join public.tenant_contacts as requester
  on requester.id = t.requester_contact_id
 and requester.tenant_id = t.tenant_id
where app_private.can_access_customer_ticket(t.id, t.tenant_id);

create or replace view public.vw_customer_portal_ticket_timeline
with (security_barrier = true)
as
select
  tm.ticket_id,
  tm.tenant_id,
  tm.id as timeline_entry_id,
  'message'::text as entry_type,
  tm.created_at as occurred_at,
  app_private.customer_portal_actor_label(tm.tenant_id, tm.created_by_user_id) as actor_label,
  null::public.ticket_event_type as event_type,
  null::text as event_label,
  tm.body,
  '{}'::jsonb as metadata
from public.ticket_messages as tm
where tm.visibility = 'customer'::public.message_visibility
  and app_private.can_access_customer_ticket(tm.ticket_id, tm.tenant_id)

union all

select
  te.ticket_id,
  te.tenant_id,
  te.id as timeline_entry_id,
  'event'::text as entry_type,
  te.occurred_at,
  app_private.customer_portal_actor_label(te.tenant_id, te.actor_user_id) as actor_label,
  te.event_type,
  app_private.customer_ticket_event_label(te.event_type) as event_label,
  null::text as body,
  '{}'::jsonb as metadata
from public.ticket_events as te
where te.visibility = 'customer'::public.message_visibility
  and te.event_type = any(
    array[
      'ticket_created',
      'message_added',
      'attachment_added',
      'status_changed',
      'resolved',
      'closed',
      'reopened',
      'cancelled'
    ]::public.ticket_event_type[]
  )
  and app_private.can_access_customer_ticket(te.ticket_id, te.tenant_id);

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
  coalesce(nullif(btrim(uploader.full_name), ''), 'Equipe Genius') as uploaded_by_label,
  ta.created_at,
  ta.status,
  true as can_download
from public.ticket_attachments as ta
left join public.profiles as uploader
  on uploader.id = ta.uploaded_by_user_id
where ta.visibility = 'customer'::public.message_visibility
  and ta.status = 'available'::public.ticket_attachment_status
  and ta.archived_at is null
  and app_private.can_access_customer_ticket(ta.ticket_id, ta.tenant_id);

create or replace view public.vw_customer_portal_knowledge_articles
with (security_barrier = true)
as
select
  tkl.ticket_id,
  tkl.tenant_id,
  tkl.article_id,
  ka.title as article_title,
  ka.slug as article_slug,
  ka.summary as article_summary,
  kc.name as category_name,
  pub.public_article_path,
  tkl.created_at as sent_at
from public.ticket_knowledge_links as tkl
join public.knowledge_articles as ka
  on ka.id = tkl.article_id
join app_private.vw_knowledge_articles_public_contract as pub
  on pub.article_id = ka.id
 and pub.public_article_path is not null
left join public.knowledge_categories as kc
  on kc.id = ka.category_id
where tkl.archived_at is null
  and tkl.link_type = 'sent_to_customer'::public.ticket_knowledge_link_type
  and ka.visibility = 'public'::public.knowledge_visibility
  and ka.status = 'published'::public.knowledge_article_status
  and ka.published_at is not null
  and app_private.can_access_customer_ticket(tkl.ticket_id, tkl.tenant_id);

create or replace function public.rpc_customer_create_ticket(
  p_tenant_id uuid,
  p_title text,
  p_description text
)
returns table (
  ticket_id uuid,
  tenant_id uuid,
  title text,
  customer_status_label text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_actor_user_id uuid;
  v_requester_contact_id uuid;
  v_ticket public.tickets;
begin
  v_actor_user_id := app_private.require_active_actor();

  if p_tenant_id is null then
    raise exception 'tenant_id is required';
  end if;

  if not app_private.is_customer_portal_member(p_tenant_id) then
    raise exception 'rpc_customer_create_ticket denied';
  end if;

  if nullif(btrim(p_title), '') is null then
    raise exception 'ticket title is required';
  end if;

  if nullif(btrim(p_description), '') is null then
    raise exception 'ticket description is required';
  end if;

  v_requester_contact_id := app_private.customer_portal_contact_id(p_tenant_id, v_actor_user_id);
  if v_requester_contact_id is null then
    raise exception 'customer contact not found for active actor';
  end if;

  insert into public.tickets (
    tenant_id,
    requester_contact_id,
    title,
    description,
    source,
    priority,
    severity,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_tenant_id,
    v_requester_contact_id,
    btrim(p_title),
    btrim(p_description),
    'portal'::public.ticket_source,
    'normal'::public.ticket_priority,
    'medium'::public.ticket_severity,
    v_actor_user_id,
    v_actor_user_id
  )
  returning *
  into v_ticket;

  v_ticket := app_private.apply_ticket_sla(v_ticket, v_actor_user_id);

  perform app_private.create_ticket_event(
    v_ticket.id,
    v_ticket.tenant_id,
    'ticket_created'::public.ticket_event_type,
    'customer'::public.message_visibility,
    v_actor_user_id,
    jsonb_build_object(
      'source', 'portal',
      'requester_contact_id', v_ticket.requester_contact_id
    )
  );

  ticket_id := v_ticket.id;
  tenant_id := v_ticket.tenant_id;
  title := v_ticket.title;
  customer_status_label := app_private.customer_ticket_status_label(v_ticket.status);
  created_at := v_ticket.created_at;

  return next;
end;
$$;

create or replace function public.rpc_customer_add_ticket_message(
  p_ticket_id uuid,
  p_body text
)
returns table (
  message_id uuid,
  ticket_id uuid,
  tenant_id uuid,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_actor_user_id uuid;
  v_ticket public.tickets;
  v_message public.ticket_messages;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_ticket
  from public.tickets as t
  where t.id = p_ticket_id;

  if v_ticket.id is null then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_access_customer_ticket(v_ticket.id, v_ticket.tenant_id) then
    raise exception 'rpc_customer_add_ticket_message denied';
  end if;

  if v_ticket.status = any(array['closed', 'cancelled']::public.ticket_status[]) then
    raise exception 'ticket is not open for customer messages';
  end if;

  if nullif(btrim(p_body), '') is null then
    raise exception 'ticket message body is required';
  end if;

  insert into public.ticket_messages (
    tenant_id,
    ticket_id,
    visibility,
    body,
    created_by_user_id
  )
  values (
    v_ticket.tenant_id,
    v_ticket.id,
    'customer'::public.message_visibility,
    btrim(p_body),
    v_actor_user_id
  )
  returning *
  into v_message;

  perform app_private.create_ticket_event(
    v_ticket.id,
    v_ticket.tenant_id,
    'message_added'::public.ticket_event_type,
    'customer'::public.message_visibility,
    v_actor_user_id,
    jsonb_build_object('visibility', 'customer'),
    v_message.id
  );

  message_id := v_message.id;
  ticket_id := v_message.ticket_id;
  tenant_id := v_message.tenant_id;
  body := v_message.body;
  created_at := v_message.created_at;

  return next;
end;
$$;

create or replace function public.rpc_customer_get_attachment_download_url(
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
#variable_conflict use_column
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

  if v_attachment.archived_at is not null
     or v_attachment.status <> 'available'::public.ticket_attachment_status
     or v_attachment.visibility <> 'customer'::public.message_visibility then
    raise exception 'attachment is not available for customer portal';
  end if;

  if not app_private.can_access_customer_ticket(v_attachment.ticket_id, v_attachment.tenant_id) then
    raise exception 'rpc_customer_get_attachment_download_url denied';
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

create or replace function public.rpc_customer_acknowledge_ticket_update(
  p_ticket_id uuid,
  p_last_timeline_entry_id uuid default null
)
returns table (
  ticket_id uuid,
  tenant_id uuid,
  acknowledged_at timestamptz,
  last_timeline_entry_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_actor_user_id uuid;
  v_ticket public.tickets;
  v_ack public.customer_ticket_update_acknowledgements;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_ticket
  from public.tickets as t
  where t.id = p_ticket_id;

  if v_ticket.id is null then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_access_customer_ticket(v_ticket.id, v_ticket.tenant_id) then
    raise exception 'rpc_customer_acknowledge_ticket_update denied';
  end if;

  insert into public.customer_ticket_update_acknowledgements (
    tenant_id,
    ticket_id,
    acknowledged_by_user_id,
    last_timeline_entry_id,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    v_ticket.tenant_id,
    v_ticket.id,
    v_actor_user_id,
    p_last_timeline_entry_id,
    v_actor_user_id,
    v_actor_user_id
  )
  on conflict (tenant_id, ticket_id, acknowledged_by_user_id)
  do update
  set
    last_timeline_entry_id = excluded.last_timeline_entry_id,
    acknowledged_at = timezone('utc', now()),
    updated_by_user_id = excluded.updated_by_user_id
  returning *
  into v_ack;

  ticket_id := v_ack.ticket_id;
  tenant_id := v_ack.tenant_id;
  acknowledged_at := v_ack.acknowledged_at;
  last_timeline_entry_id := v_ack.last_timeline_entry_id;

  return next;
end;
$$;

create trigger customer_ticket_update_acknowledgements_set_updated_at
before update on public.customer_ticket_update_acknowledgements
for each row
execute function app_private.touch_updated_at();

create trigger customer_ticket_update_acknowledgements_audit
after insert or update or delete on public.customer_ticket_update_acknowledgements
for each row
execute function audit.capture_row_change();

revoke select, insert, update, delete on public.customer_ticket_update_acknowledgements from authenticated;

revoke all on function app_private.customer_ticket_status_label(public.ticket_status) from public, anon, authenticated, service_role;
revoke all on function app_private.customer_ticket_event_label(public.ticket_event_type) from public, anon, authenticated, service_role;
revoke all on function app_private.customer_portal_contact_id(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function app_private.is_customer_portal_member(uuid) from public, anon, authenticated, service_role;
revoke all on function app_private.is_customer_portal_manager(uuid) from public, anon, authenticated, service_role;
revoke all on function app_private.can_access_customer_ticket(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function app_private.customer_portal_actor_label(uuid, uuid) from public, anon, authenticated, service_role;

grant execute on function app_private.customer_ticket_status_label(public.ticket_status) to authenticated, service_role;
grant execute on function app_private.customer_ticket_event_label(public.ticket_event_type) to authenticated, service_role;
grant execute on function app_private.customer_portal_contact_id(uuid, uuid) to authenticated, service_role;
grant execute on function app_private.is_customer_portal_member(uuid) to authenticated, service_role;
grant execute on function app_private.is_customer_portal_manager(uuid) to authenticated, service_role;
grant execute on function app_private.can_access_customer_ticket(uuid, uuid) to authenticated, service_role;
grant execute on function app_private.customer_portal_actor_label(uuid, uuid) to authenticated, service_role;

revoke all on public.vw_customer_portal_auth_context from public, anon, authenticated, service_role;
revoke all on public.vw_customer_portal_profile_context from public, anon, authenticated, service_role;
revoke all on public.vw_customer_portal_ticket_list from public, anon, authenticated, service_role;
revoke all on public.vw_customer_portal_ticket_detail from public, anon, authenticated, service_role;
revoke all on public.vw_customer_portal_ticket_timeline from public, anon, authenticated, service_role;
revoke all on public.vw_customer_portal_ticket_attachments from public, anon, authenticated, service_role;
revoke all on public.vw_customer_portal_knowledge_articles from public, anon, authenticated, service_role;

grant select on public.vw_customer_portal_auth_context to authenticated, service_role;
grant select on public.vw_customer_portal_profile_context to authenticated, service_role;
grant select on public.vw_customer_portal_ticket_list to authenticated, service_role;
grant select on public.vw_customer_portal_ticket_detail to authenticated, service_role;
grant select on public.vw_customer_portal_ticket_timeline to authenticated, service_role;
grant select on public.vw_customer_portal_ticket_attachments to authenticated, service_role;
grant select on public.vw_customer_portal_knowledge_articles to authenticated, service_role;

revoke all on function public.rpc_customer_create_ticket(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_customer_add_ticket_message(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_customer_get_attachment_download_url(uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_customer_acknowledge_ticket_update(uuid, uuid) from public, anon, authenticated, service_role;

grant execute on function public.rpc_customer_create_ticket(uuid, text, text) to authenticated, service_role;
grant execute on function public.rpc_customer_add_ticket_message(uuid, text) to authenticated, service_role;
grant execute on function public.rpc_customer_get_attachment_download_url(uuid) to authenticated, service_role;
grant execute on function public.rpc_customer_acknowledge_ticket_update(uuid, uuid) to authenticated, service_role;

comment on view public.vw_customer_portal_auth_context is
  'Contexto autenticado customer-facing: usuario, tenant, contato e papel do portal, sem roles internas ou audit bruto.';

comment on view public.vw_customer_portal_ticket_list is
  'Lista customer-facing de tickets do proprio tenant/contato, sem notas internas, SLA interno, engenharia ou audit.';

comment on view public.vw_customer_portal_ticket_detail is
  'Detalhe customer-facing de ticket, com status rotulado para cliente e sem contexto interno.';

comment on view public.vw_customer_portal_ticket_timeline is
  'Timeline customer-facing com mensagens publicas e eventos sanitizados, sem metadata interna.';

comment on view public.vw_customer_portal_ticket_attachments is
  'Evidencias customer-facing sanitizadas, sem bucket/path/storage interno.';

comment on view public.vw_customer_portal_knowledge_articles is
  'Artigos publicos enviados ao cliente no contexto de tickets autorizados.';

comment on function public.rpc_customer_create_ticket(uuid, text, text) is
  'Cria ticket pelo portal cliente B2B usando tenant explicito validado, contato vinculado e source portal.';

comment on function public.rpc_customer_add_ticket_message(uuid, text) is
  'Adiciona mensagem publica do cliente ao ticket autorizado do portal.';

comment on function public.rpc_customer_get_attachment_download_url(uuid) is
  'Gera grant curto de download para evidencia customer-facing autorizada.';

comment on function public.rpc_customer_acknowledge_ticket_update(uuid, uuid) is
  'Registra leitura/acknowledgement customer-facing de atualizacao do ticket.';
