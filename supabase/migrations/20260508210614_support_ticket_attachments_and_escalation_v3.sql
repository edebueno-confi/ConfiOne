create type public.engineering_work_item_type as enum (
  'bug',
  'improvement',
  'technical_task',
  'investigation'
);

create type public.engineering_work_item_status as enum (
  'triage',
  'accepted',
  'rejected',
  'in_progress',
  'waiting_external',
  'released',
  'cancelled'
);

create table public.engineering_work_items (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  work_item_type public.engineering_work_item_type not null,
  status public.engineering_work_item_status not null default 'triage',
  priority public.ticket_priority not null default 'normal',
  title text not null,
  description text not null,
  created_by_user_id uuid not null references public.profiles (id),
  assigned_to_user_id uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by_user_id uuid references public.profiles (id),
  constraint engineering_work_items_title_not_blank_check
    check (nullif(btrim(title), '') is not null),
  constraint engineering_work_items_description_not_blank_check
    check (nullif(btrim(description), '') is not null)
);

create unique index engineering_work_items_id_tenant_key
  on public.engineering_work_items (id, tenant_id);

create index engineering_work_items_tenant_status_priority_idx
  on public.engineering_work_items (tenant_id, status, priority, updated_at desc);

create index engineering_work_items_tenant_assignee_idx
  on public.engineering_work_items (tenant_id, assigned_to_user_id, updated_at desc);

create table public.engineering_ticket_links (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  ticket_id uuid not null,
  engineering_work_item_id uuid not null,
  handoff_note text,
  created_by_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by_user_id uuid references public.profiles (id),
  constraint engineering_ticket_links_ticket_fk
    foreign key (ticket_id, tenant_id)
    references public.tickets (id, tenant_id)
    on delete cascade,
  constraint engineering_ticket_links_work_item_fk
    foreign key (engineering_work_item_id, tenant_id)
    references public.engineering_work_items (id, tenant_id)
    on delete cascade,
  constraint engineering_ticket_links_handoff_note_not_blank_check
    check (
      handoff_note is null
      or nullif(btrim(handoff_note), '') is not null
    )
);

create unique index engineering_ticket_links_id_tenant_key
  on public.engineering_ticket_links (id, tenant_id);

create unique index engineering_ticket_links_ticket_work_item_key
  on public.engineering_ticket_links (ticket_id, engineering_work_item_id);

create index engineering_ticket_links_ticket_created_at_idx
  on public.engineering_ticket_links (ticket_id, created_at desc);

create or replace function app_private.can_access_ticket_engineering(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    app_private.has_global_role('platform_admin'::public.platform_role)
    or (
      app_private.is_active_tenant_member(target_tenant_id)
      and app_private.has_any_global_role(
        array[
          'support_agent',
          'support_manager',
          'engineering_member',
          'engineering_manager'
        ]::public.platform_role[]
      )
    );
$$;

create or replace function app_private.create_engineering_ticket_link(
  p_ticket_id uuid,
  p_tenant_id uuid,
  p_engineering_work_item_id uuid,
  p_created_by_user_id uuid,
  p_handoff_note text default null
)
returns public.engineering_ticket_links
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link public.engineering_ticket_links;
begin
  insert into public.engineering_ticket_links (
    tenant_id,
    ticket_id,
    engineering_work_item_id,
    handoff_note,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_tenant_id,
    p_ticket_id,
    p_engineering_work_item_id,
    nullif(btrim(p_handoff_note), ''),
    p_created_by_user_id,
    p_created_by_user_id
  )
  returning *
  into v_link;

  return v_link;
end;
$$;

create or replace function public.rpc_support_create_engineering_work_item_from_ticket(
  p_ticket_id uuid,
  p_work_item_type public.engineering_work_item_type,
  p_title text,
  p_description text,
  p_handoff_note text default null
)
returns public.engineering_ticket_links
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_ticket public.tickets;
  v_work_item public.engineering_work_items;
  v_link public.engineering_ticket_links;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_ticket
  from public.tickets as t
  where t.id = p_ticket_id
  for update;

  if v_ticket.id is null then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_access_support_workspace(v_ticket.tenant_id) then
    raise exception 'rpc_support_create_engineering_work_item_from_ticket denied';
  end if;

  if v_ticket.status = any(array['closed', 'cancelled']::public.ticket_status[]) then
    raise exception 'ticket is not eligible for engineering handoff';
  end if;

  insert into public.engineering_work_items (
    tenant_id,
    work_item_type,
    status,
    priority,
    title,
    description,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    v_ticket.tenant_id,
    p_work_item_type,
    'triage',
    v_ticket.priority,
    btrim(p_title),
    btrim(p_description),
    v_actor_user_id,
    v_actor_user_id
  )
  returning *
  into v_work_item;

  v_link := app_private.create_engineering_ticket_link(
    v_ticket.id,
    v_ticket.tenant_id,
    v_work_item.id,
    v_actor_user_id,
    p_handoff_note
  );

  if v_ticket.status <> 'waiting_engineering'
     and app_private.ticket_status_transition_allowed(
       v_ticket.status,
       'waiting_engineering'::public.ticket_status
     ) then
    perform app_private.transition_ticket_status(
      v_ticket.id,
      v_actor_user_id,
      'waiting_engineering'::public.ticket_status,
      'status_changed'::public.ticket_event_type,
      jsonb_build_object(
        'reason', 'engineering_handoff',
        'engineering_work_item_id', v_work_item.id
      )
    );
  end if;

  perform app_private.create_ticket_event(
    v_ticket.id,
    v_ticket.tenant_id,
    'escalated_to_engineering',
    'internal',
    v_actor_user_id,
    jsonb_build_object(
      'engineering_work_item_id', v_work_item.id,
      'work_item_type', v_work_item.work_item_type,
      'work_item_status', v_work_item.status,
      'handoff_note', nullif(btrim(p_handoff_note), '')
    )
  );

  perform app_private.create_ticket_event(
    v_ticket.id,
    v_ticket.tenant_id,
    'linked_to_work_item',
    'internal',
    v_actor_user_id,
    jsonb_build_object(
      'engineering_ticket_link_id', v_link.id,
      'engineering_work_item_id', v_work_item.id,
      'work_item_type', v_work_item.work_item_type,
      'work_item_status', v_work_item.status,
      'handoff_note', nullif(btrim(p_handoff_note), '')
    )
  );

  return v_link;
end;
$$;

create or replace function public.rpc_support_link_ticket_to_engineering_work_item(
  p_ticket_id uuid,
  p_engineering_work_item_id uuid,
  p_handoff_note text default null
)
returns public.engineering_ticket_links
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_ticket public.tickets;
  v_work_item public.engineering_work_items;
  v_link public.engineering_ticket_links;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_ticket
  from public.tickets as t
  where t.id = p_ticket_id
  for update;

  if v_ticket.id is null then
    raise exception 'ticket not found';
  end if;

  select *
  into v_work_item
  from public.engineering_work_items as ewi
  where ewi.id = p_engineering_work_item_id;

  if v_work_item.id is null then
    raise exception 'engineering work item not found';
  end if;

  if v_work_item.tenant_id <> v_ticket.tenant_id then
    raise exception 'cross-tenant engineering work item link denied';
  end if;

  if not app_private.can_access_support_workspace(v_ticket.tenant_id) then
    raise exception 'rpc_support_link_ticket_to_engineering_work_item denied';
  end if;

  v_link := app_private.create_engineering_ticket_link(
    v_ticket.id,
    v_ticket.tenant_id,
    v_work_item.id,
    v_actor_user_id,
    p_handoff_note
  );

  if v_ticket.status <> 'waiting_engineering'
     and app_private.ticket_status_transition_allowed(
       v_ticket.status,
       'waiting_engineering'::public.ticket_status
     ) then
    perform app_private.transition_ticket_status(
      v_ticket.id,
      v_actor_user_id,
      'waiting_engineering'::public.ticket_status,
      'status_changed'::public.ticket_event_type,
      jsonb_build_object(
        'reason', 'engineering_handoff',
        'engineering_work_item_id', v_work_item.id
      )
    );
  end if;

  perform app_private.create_ticket_event(
    v_ticket.id,
    v_ticket.tenant_id,
    'linked_to_work_item',
    'internal',
    v_actor_user_id,
    jsonb_build_object(
      'engineering_ticket_link_id', v_link.id,
      'engineering_work_item_id', v_work_item.id,
      'work_item_type', v_work_item.work_item_type,
      'work_item_status', v_work_item.status,
      'handoff_note', nullif(btrim(p_handoff_note), '')
    )
  );

  return v_link;
end;
$$;

create trigger engineering_work_items_set_updated_at
before update on public.engineering_work_items
for each row
execute function app_private.touch_updated_at();

create trigger engineering_ticket_links_set_updated_at
before update on public.engineering_ticket_links
for each row
execute function app_private.touch_updated_at();

create trigger engineering_work_items_audit_row_change
after insert or update or delete on public.engineering_work_items
for each row
execute function audit.capture_row_change();

create trigger engineering_ticket_links_audit_row_change
after insert or update or delete on public.engineering_ticket_links
for each row
execute function audit.capture_row_change();

grant select on public.engineering_work_items to service_role;
grant select on public.engineering_ticket_links to service_role;

revoke all on public.engineering_work_items from authenticated;
revoke all on public.engineering_ticket_links from authenticated;

alter table public.engineering_work_items enable row level security;
alter table public.engineering_ticket_links enable row level security;

create policy engineering_work_items_select_controlled
on public.engineering_work_items
for select
to authenticated
using (
  app_private.can_access_ticket_engineering(tenant_id)
);

create policy engineering_ticket_links_select_controlled
on public.engineering_ticket_links
for select
to authenticated
using (
  app_private.can_access_ticket_engineering(tenant_id)
);

create or replace view public.vw_support_ticket_attachments
with (security_barrier = true)
as
  with support_visible as (
    select
      d.id as ticket_id,
      d.tenant_id,
      d.can_view_internal
    from public.vw_ticket_detail as d
    where app_private.can_access_support_workspace(d.tenant_id)
  )
  select
    ta.id as attachment_id,
    ta.ticket_id,
    ta.tenant_id,
    ta.message_id,
    ta.visibility,
    ta.file_name,
    ta.content_type,
    ta.byte_size,
    ta.uploaded_by_user_id,
    uploader.full_name as uploaded_by_full_name,
    ta.created_at,
    exists (
      select 1
      from storage.buckets as sb
      where sb.id = ta.storage_bucket
    ) as bucket_configured,
    exists (
      select 1
      from storage.objects as so
      where so.bucket_id = ta.storage_bucket
        and so.name = ta.storage_object_path
    ) as storage_object_present,
    exists (
      select 1
      from storage.buckets as sb
      join storage.objects as so
        on so.bucket_id = sb.id
       and so.name = ta.storage_object_path
      where sb.id = ta.storage_bucket
    ) as download_available
  from support_visible as sv
  join public.ticket_attachments as ta
    on ta.ticket_id = sv.ticket_id
   and ta.tenant_id = sv.tenant_id
   and (
     ta.visibility = 'customer'
     or sv.can_view_internal
   )
  left join public.profiles as uploader
    on uploader.id = ta.uploaded_by_user_id;

create or replace view public.vw_support_ticket_engineering_links
with (security_barrier = true)
as
  with support_visible as (
    select
      t.id as ticket_id,
      t.tenant_id
    from public.tickets as t
    where app_private.can_access_support_workspace(t.tenant_id)
  )
  select
    etl.id as engineering_ticket_link_id,
    etl.ticket_id,
    etl.tenant_id,
    etl.handoff_note,
    etl.created_by_user_id,
    creator.full_name as created_by_full_name,
    etl.created_at,
    etl.updated_at,
    ewi.id as engineering_work_item_id,
    ewi.work_item_type,
    ewi.status as work_item_status,
    ewi.priority as work_item_priority,
    ewi.title as work_item_title,
    ewi.description as work_item_description,
    ewi.assigned_to_user_id,
    assignee.full_name as assigned_to_full_name,
    ewi.created_at as work_item_created_at,
    ewi.updated_at as work_item_updated_at
  from support_visible as sv
  join public.engineering_ticket_links as etl
    on etl.ticket_id = sv.ticket_id
   and etl.tenant_id = sv.tenant_id
  join public.engineering_work_items as ewi
    on ewi.id = etl.engineering_work_item_id
   and ewi.tenant_id = etl.tenant_id
  left join public.profiles as creator
    on creator.id = etl.created_by_user_id
  left join public.profiles as assignee
    on assignee.id = ewi.assigned_to_user_id;

revoke all on public.vw_support_ticket_attachments from public, anon, authenticated, service_role;
revoke all on public.vw_support_ticket_engineering_links from public, anon, authenticated, service_role;

grant select on public.vw_support_ticket_attachments to authenticated, service_role;
grant select on public.vw_support_ticket_engineering_links to authenticated, service_role;

revoke all on function app_private.can_access_ticket_engineering(uuid) from public, anon, authenticated, service_role;
revoke all on function app_private.create_engineering_ticket_link(uuid, uuid, uuid, uuid, text) from public, anon, authenticated, service_role;

grant execute on function app_private.can_access_ticket_engineering(uuid) to authenticated, service_role;

revoke all on function public.rpc_support_create_engineering_work_item_from_ticket(uuid, public.engineering_work_item_type, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_support_link_ticket_to_engineering_work_item(uuid, uuid, text) from public, anon, authenticated, service_role;

grant execute on function public.rpc_support_create_engineering_work_item_from_ticket(uuid, public.engineering_work_item_type, text, text, text) to authenticated;
grant execute on function public.rpc_support_link_ticket_to_engineering_work_item(uuid, uuid, text) to authenticated;

comment on function public.rpc_support_create_engineering_work_item_from_ticket(uuid, public.engineering_work_item_type, text, text, text) is
  'Cria um work item técnico a partir do ticket, vincula os domínios, gera eventos internos e respeita tenant explícito.';

comment on function public.rpc_support_link_ticket_to_engineering_work_item(uuid, uuid, text) is
  'Vincula ticket existente a work item técnico do mesmo tenant com trilha interna e sem DML direto do frontend.';

comment on view public.vw_support_ticket_attachments is
  'Read model sanitizado de anexos do ticket para o Support Workspace. Não expõe bucket nem path de storage.';

comment on view public.vw_support_ticket_engineering_links is
  'Read model do handoff técnico do ticket para o Support Workspace, desacoplado do backlog de engenharia.';
