
create type public.engineering_work_item_update_kind as enum (
  'progress_update',
  'status_update',
  'support_return'
);

create table public.engineering_work_item_updates (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  engineering_work_item_id uuid not null,
  update_kind public.engineering_work_item_update_kind not null,
  status public.engineering_work_item_status,
  summary text not null,
  next_step text,
  created_by_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by_user_id uuid references public.profiles (id),
  constraint engineering_work_item_updates_work_item_fk
    foreign key (engineering_work_item_id, tenant_id)
    references public.engineering_work_items (id, tenant_id)
    on delete cascade,
  constraint engineering_work_item_updates_summary_not_blank_check
    check (nullif(btrim(summary), '') is not null),
  constraint engineering_work_item_updates_next_step_not_blank_check
    check (
      next_step is null
      or nullif(btrim(next_step), '') is not null
    )
);

create index engineering_work_item_updates_work_item_created_at_idx
  on public.engineering_work_item_updates (engineering_work_item_id, created_at desc);

create index engineering_work_item_updates_tenant_kind_created_at_idx
  on public.engineering_work_item_updates (tenant_id, update_kind, created_at desc);

create or replace function app_private.can_access_engineering_workspace(target_tenant_id uuid)
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
          'engineering_member',
          'engineering_manager'
        ]::public.platform_role[]
      )
    );
$$;

create or replace function app_private.can_assign_engineering_work_item(
  target_tenant_id uuid,
  target_user_id uuid
)
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
     and tm.tenant_id = target_tenant_id
     and tm.status = 'active'
    join public.user_global_roles as ugr
      on ugr.user_id = p.id
    where p.id = target_user_id
      and p.is_active
      and ugr.role = any(
        array[
          'platform_admin',
          'engineering_member',
          'engineering_manager'
        ]::public.platform_role[]
      )
  );
$$;

create or replace function app_private.engineering_status_transition_allowed(
  current_status public.engineering_work_item_status,
  target_status public.engineering_work_item_status
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when current_status = target_status then false
    when current_status = 'triage' then target_status = any(
      array[
        'accepted',
        'rejected',
        'in_progress',
        'waiting_external',
        'returned_to_support',
        'cancelled'
      ]::public.engineering_work_item_status[]
    )
    when current_status = 'accepted' then target_status = any(
      array[
        'in_progress',
        'waiting_external',
        'returned_to_support',
        'released',
        'cancelled'
      ]::public.engineering_work_item_status[]
    )
    when current_status = 'in_progress' then target_status = any(
      array[
        'waiting_external',
        'returned_to_support',
        'released',
        'cancelled'
      ]::public.engineering_work_item_status[]
    )
    when current_status = 'waiting_external' then target_status = any(
      array[
        'in_progress',
        'returned_to_support',
        'released',
        'cancelled'
      ]::public.engineering_work_item_status[]
    )
    when current_status = 'returned_to_support' then target_status = any(
      array[
        'in_progress',
        'waiting_external',
        'released',
        'cancelled'
      ]::public.engineering_work_item_status[]
    )
    else false
  end;
$$;

create or replace function app_private.create_engineering_work_item_update(
  p_engineering_work_item_id uuid,
  p_tenant_id uuid,
  p_actor_user_id uuid,
  p_update_kind public.engineering_work_item_update_kind,
  p_status public.engineering_work_item_status,
  p_summary text,
  p_next_step text default null
)
returns public.engineering_work_item_updates
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_update public.engineering_work_item_updates;
begin
  insert into public.engineering_work_item_updates (
    tenant_id,
    engineering_work_item_id,
    update_kind,
    status,
    summary,
    next_step,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_tenant_id,
    p_engineering_work_item_id,
    p_update_kind,
    p_status,
    btrim(p_summary),
    nullif(btrim(p_next_step), ''),
    p_actor_user_id,
    p_actor_user_id
  )
  returning *
  into v_update;

  return v_update;
end;
$$;

create or replace function app_private.create_engineering_ticket_events(
  p_engineering_work_item_id uuid,
  p_tenant_id uuid,
  p_actor_user_id uuid,
  p_event_type public.ticket_event_type,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link record;
begin
  for v_link in
    select etl.ticket_id
    from public.engineering_ticket_links as etl
    where etl.engineering_work_item_id = p_engineering_work_item_id
      and etl.tenant_id = p_tenant_id
  loop
    perform app_private.create_ticket_event(
      v_link.ticket_id,
      p_tenant_id,
      p_event_type,
      'internal',
      p_actor_user_id,
      coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'engineering_work_item_id', p_engineering_work_item_id
      )
    );
  end loop;
end;
$$;

create or replace function public.rpc_engineering_assign_work_item(
  p_engineering_work_item_id uuid,
  p_tenant_id uuid,
  p_assigned_to_user_id uuid default null
)
returns public.engineering_work_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_target_user_id uuid;
  v_existing public.engineering_work_items;
  v_work_item public.engineering_work_items;
begin
  v_actor_user_id := app_private.require_active_actor();
  v_target_user_id := coalesce(p_assigned_to_user_id, v_actor_user_id);

  select *
  into v_existing
  from public.engineering_work_items as ewi
  where ewi.id = p_engineering_work_item_id
    and ewi.tenant_id = p_tenant_id
  for update;

  if v_existing.id is null then
    raise exception 'engineering work item not found';
  end if;

  if not app_private.can_access_engineering_workspace(p_tenant_id) then
    raise exception 'rpc_engineering_assign_work_item denied';
  end if;

  if not app_private.can_assign_engineering_work_item(p_tenant_id, v_target_user_id) then
    raise exception 'engineering assignee is not eligible';
  end if;

  if v_existing.status = any(array['released', 'rejected', 'cancelled']::public.engineering_work_item_status[]) then
    raise exception 'engineering work item is not assignable';
  end if;

  update public.engineering_work_items
  set assigned_to_user_id = v_target_user_id,
      updated_by_user_id = v_actor_user_id
  where id = v_existing.id
    and tenant_id = v_existing.tenant_id
  returning *
  into v_work_item;

  perform app_private.create_engineering_work_item_update(
    v_work_item.id,
    v_work_item.tenant_id,
    v_actor_user_id,
    'progress_update',
    v_work_item.status,
    'Responsável técnico atualizado.',
    null
  );

  return v_work_item;
end;
$$;

create or replace function public.rpc_engineering_unassign_work_item(
  p_engineering_work_item_id uuid,
  p_tenant_id uuid
)
returns public.engineering_work_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.engineering_work_items;
  v_work_item public.engineering_work_items;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_existing
  from public.engineering_work_items as ewi
  where ewi.id = p_engineering_work_item_id
    and ewi.tenant_id = p_tenant_id
  for update;

  if v_existing.id is null then
    raise exception 'engineering work item not found';
  end if;

  if not app_private.can_access_engineering_workspace(p_tenant_id) then
    raise exception 'rpc_engineering_unassign_work_item denied';
  end if;

  if v_existing.status = any(array['released', 'rejected', 'cancelled']::public.engineering_work_item_status[]) then
    raise exception 'engineering work item is not assignable';
  end if;

  update public.engineering_work_items
  set assigned_to_user_id = null,
      updated_by_user_id = v_actor_user_id
  where id = v_existing.id
    and tenant_id = v_existing.tenant_id
  returning *
  into v_work_item;

  perform app_private.create_engineering_work_item_update(
    v_work_item.id,
    v_work_item.tenant_id,
    v_actor_user_id,
    'progress_update',
    v_work_item.status,
    'Responsável técnico removido.',
    null
  );

  return v_work_item;
end;
$$;

create or replace function public.rpc_engineering_update_work_item_status(
  p_engineering_work_item_id uuid,
  p_tenant_id uuid,
  p_status public.engineering_work_item_status,
  p_summary text,
  p_next_step text default null
)
returns public.engineering_work_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.engineering_work_items;
  v_work_item public.engineering_work_items;
  v_update public.engineering_work_item_updates;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_existing
  from public.engineering_work_items as ewi
  where ewi.id = p_engineering_work_item_id
    and ewi.tenant_id = p_tenant_id
  for update;

  if v_existing.id is null then
    raise exception 'engineering work item not found';
  end if;

  if not app_private.can_access_engineering_workspace(p_tenant_id) then
    raise exception 'rpc_engineering_update_work_item_status denied';
  end if;

  if not app_private.engineering_status_transition_allowed(v_existing.status, p_status) then
    raise exception 'invalid engineering status transition: % -> %', v_existing.status, p_status;
  end if;

  update public.engineering_work_items
  set status = p_status,
      updated_by_user_id = v_actor_user_id
  where id = v_existing.id
    and tenant_id = v_existing.tenant_id
  returning *
  into v_work_item;

  v_update := app_private.create_engineering_work_item_update(
    v_work_item.id,
    v_work_item.tenant_id,
    v_actor_user_id,
    'status_update',
    v_work_item.status,
    p_summary,
    p_next_step
  );

  perform app_private.create_engineering_ticket_events(
    v_work_item.id,
    v_work_item.tenant_id,
    v_actor_user_id,
    'engineering_status_updated',
    jsonb_build_object(
      'engineering_update_id', v_update.id,
      'work_item_status', v_work_item.status,
      'summary', btrim(p_summary),
      'next_step', nullif(btrim(p_next_step), '')
    )
  );

  return v_work_item;
end;
$$;

create or replace function public.rpc_engineering_add_work_item_update(
  p_engineering_work_item_id uuid,
  p_tenant_id uuid,
  p_summary text,
  p_next_step text default null
)
returns public.engineering_work_item_updates
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_work_item public.engineering_work_items;
  v_update public.engineering_work_item_updates;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_work_item
  from public.engineering_work_items as ewi
  where ewi.id = p_engineering_work_item_id
    and ewi.tenant_id = p_tenant_id;

  if v_work_item.id is null then
    raise exception 'engineering work item not found';
  end if;

  if not app_private.can_access_engineering_workspace(p_tenant_id) then
    raise exception 'rpc_engineering_add_work_item_update denied';
  end if;

  if v_work_item.status = any(array['released', 'rejected', 'cancelled']::public.engineering_work_item_status[]) then
    raise exception 'engineering work item does not accept updates';
  end if;

  v_update := app_private.create_engineering_work_item_update(
    v_work_item.id,
    v_work_item.tenant_id,
    v_actor_user_id,
    'progress_update',
    v_work_item.status,
    p_summary,
    p_next_step
  );

  update public.engineering_work_items
  set updated_by_user_id = v_actor_user_id
  where id = v_work_item.id
    and tenant_id = v_work_item.tenant_id;

  perform app_private.create_engineering_ticket_events(
    v_work_item.id,
    v_work_item.tenant_id,
    v_actor_user_id,
    'engineering_update_added',
    jsonb_build_object(
      'engineering_update_id', v_update.id,
      'work_item_status', v_work_item.status,
      'summary', btrim(p_summary),
      'next_step', nullif(btrim(p_next_step), '')
    )
  );

  return v_update;
end;
$$;

create or replace function public.rpc_engineering_return_work_item_to_support(
  p_engineering_work_item_id uuid,
  p_tenant_id uuid,
  p_summary text,
  p_next_step text
)
returns public.engineering_work_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.engineering_work_items;
  v_work_item public.engineering_work_items;
  v_update public.engineering_work_item_updates;
  v_link record;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_existing
  from public.engineering_work_items as ewi
  where ewi.id = p_engineering_work_item_id
    and ewi.tenant_id = p_tenant_id
  for update;

  if v_existing.id is null then
    raise exception 'engineering work item not found';
  end if;

  if not app_private.can_access_engineering_workspace(p_tenant_id) then
    raise exception 'rpc_engineering_return_work_item_to_support denied';
  end if;

  if not app_private.engineering_status_transition_allowed(v_existing.status, 'returned_to_support'::public.engineering_work_item_status) then
    raise exception 'invalid engineering status transition: % -> returned_to_support', v_existing.status;
  end if;

  update public.engineering_work_items
  set status = 'returned_to_support',
      updated_by_user_id = v_actor_user_id
  where id = v_existing.id
    and tenant_id = v_existing.tenant_id
  returning *
  into v_work_item;

  v_update := app_private.create_engineering_work_item_update(
    v_work_item.id,
    v_work_item.tenant_id,
    v_actor_user_id,
    'support_return',
    v_work_item.status,
    p_summary,
    p_next_step
  );

  for v_link in
    select t.id, t.status
    from public.engineering_ticket_links as etl
    join public.tickets as t
      on t.id = etl.ticket_id
     and t.tenant_id = etl.tenant_id
    where etl.engineering_work_item_id = v_work_item.id
      and etl.tenant_id = v_work_item.tenant_id
  loop
    if app_private.ticket_status_transition_allowed(v_link.status, 'waiting_support'::public.ticket_status) then
      perform app_private.transition_ticket_status(
        v_link.id,
        v_actor_user_id,
        'waiting_support'::public.ticket_status,
        'status_changed'::public.ticket_event_type,
        jsonb_build_object(
          'reason', 'engineering_return',
          'engineering_work_item_id', v_work_item.id,
          'engineering_update_id', v_update.id
        )
      );
    end if;

    perform app_private.create_ticket_event(
      v_link.id,
      v_work_item.tenant_id,
      'engineering_returned_to_support',
      'internal',
      v_actor_user_id,
      jsonb_build_object(
        'engineering_work_item_id', v_work_item.id,
        'engineering_update_id', v_update.id,
        'work_item_status', v_work_item.status,
        'summary', btrim(p_summary),
        'next_step', btrim(p_next_step)
      )
    );
  end loop;

  return v_work_item;
end;
$$;

create or replace function public.rpc_engineering_link_existing_work_item_to_ticket(
  p_engineering_work_item_id uuid,
  p_ticket_id uuid,
  p_tenant_id uuid,
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
  into v_work_item
  from public.engineering_work_items as ewi
  where ewi.id = p_engineering_work_item_id
    and ewi.tenant_id = p_tenant_id;

  if v_work_item.id is null then
    raise exception 'engineering work item not found';
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

  if not app_private.can_access_engineering_workspace(p_tenant_id) then
    raise exception 'rpc_engineering_link_existing_work_item_to_ticket denied';
  end if;

  if v_ticket.status = any(array['closed', 'cancelled']::public.ticket_status[]) then
    raise exception 'ticket is not eligible for engineering link';
  end if;

  v_link := app_private.create_engineering_ticket_link(
    v_ticket.id,
    v_ticket.tenant_id,
    v_work_item.id,
    v_actor_user_id,
    p_handoff_note
  );

  if v_ticket.status <> 'waiting_engineering'
     and app_private.ticket_status_transition_allowed(v_ticket.status, 'waiting_engineering'::public.ticket_status) then
    perform app_private.transition_ticket_status(
      v_ticket.id,
      v_actor_user_id,
      'waiting_engineering'::public.ticket_status,
      'status_changed'::public.ticket_event_type,
      jsonb_build_object(
        'reason', 'engineering_link',
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

create trigger engineering_work_item_updates_set_updated_at
before update on public.engineering_work_item_updates
for each row
execute function app_private.touch_updated_at();

create trigger engineering_work_item_updates_audit_row_change
after insert or update or delete on public.engineering_work_item_updates
for each row
execute function audit.capture_row_change();

grant select on public.engineering_work_item_updates to service_role;
revoke all on public.engineering_work_item_updates from authenticated;

alter table public.engineering_work_item_updates enable row level security;

create policy engineering_work_item_updates_select_controlled
on public.engineering_work_item_updates
for select
to authenticated
using (
  app_private.can_access_ticket_engineering(tenant_id)
);

create or replace view public.vw_engineering_work_items_queue
with (security_barrier = true)
as
  with latest_update as (
    select distinct on (ewiu.engineering_work_item_id)
      ewiu.engineering_work_item_id,
      ewiu.update_kind as last_update_kind,
      ewiu.summary as last_update_summary,
      ewiu.next_step as last_update_next_step,
      ewiu.created_at as last_update_at,
      ewiu.created_by_user_id as last_update_by_user_id
    from public.engineering_work_item_updates as ewiu
    order by ewiu.engineering_work_item_id, ewiu.created_at desc
  ),
  primary_link as (
    select distinct on (etl.engineering_work_item_id)
      etl.engineering_work_item_id,
      etl.ticket_id as origin_ticket_id,
      t.title as origin_ticket_title,
      t.status as origin_ticket_status,
      t.priority as origin_ticket_priority,
      t.severity as origin_ticket_severity,
      etl.created_at as origin_link_created_at
    from public.engineering_ticket_links as etl
    join public.tickets as t
      on t.id = etl.ticket_id
     and t.tenant_id = etl.tenant_id
    order by etl.engineering_work_item_id, etl.created_at asc
  ),
  link_counts as (
    select
      etl.engineering_work_item_id,
      count(*)::integer as linked_tickets_count
    from public.engineering_ticket_links as etl
    group by etl.engineering_work_item_id
  )
  select
    ewi.id as engineering_work_item_id,
    ewi.tenant_id,
    t.slug as tenant_slug,
    coalesce(t.display_name, t.legal_name) as tenant_name,
    ewi.work_item_type,
    ewi.status,
    ewi.priority,
    ewi.title,
    ewi.description,
    ewi.created_by_user_id,
    creator.full_name as created_by_full_name,
    ewi.assigned_to_user_id,
    assignee.full_name as assigned_to_full_name,
    ewi.created_at,
    ewi.updated_at,
    ewi.updated_by_user_id,
    updater.full_name as updated_by_full_name,
    coalesce(lc.linked_tickets_count, 0) as linked_tickets_count,
    pl.origin_ticket_id,
    pl.origin_ticket_title,
    pl.origin_ticket_status,
    pl.origin_ticket_priority,
    pl.origin_ticket_severity,
    lu.last_update_kind,
    lu.last_update_summary,
    lu.last_update_next_step,
    lu.last_update_at,
    lu.last_update_by_user_id,
    last_actor.full_name as last_update_by_full_name,
    app_private.can_access_engineering_workspace(ewi.tenant_id) as can_manage_engineering
  from public.engineering_work_items as ewi
  join public.tenants as t
    on t.id = ewi.tenant_id
  left join public.profiles as creator
    on creator.id = ewi.created_by_user_id
  left join public.profiles as assignee
    on assignee.id = ewi.assigned_to_user_id
  left join public.profiles as updater
    on updater.id = ewi.updated_by_user_id
  left join latest_update as lu
    on lu.engineering_work_item_id = ewi.id
  left join public.profiles as last_actor
    on last_actor.id = lu.last_update_by_user_id
  left join primary_link as pl
    on pl.engineering_work_item_id = ewi.id
  left join link_counts as lc
    on lc.engineering_work_item_id = ewi.id
  where app_private.can_access_engineering_workspace(ewi.tenant_id);

create or replace view public.vw_support_ticket_engineering_links
with (security_barrier = true)
as
  with support_visible as (
    select
      t.id as ticket_id,
      t.tenant_id
    from public.tickets as t
    where app_private.can_access_support_workspace(t.tenant_id)
  ),
  latest_update as (
    select distinct on (ewiu.engineering_work_item_id)
      ewiu.engineering_work_item_id,
      ewiu.update_kind as last_update_kind,
      ewiu.summary as last_update_summary,
      ewiu.next_step as last_update_next_step,
      ewiu.created_at as last_update_at
    from public.engineering_work_item_updates as ewiu
    order by ewiu.engineering_work_item_id, ewiu.created_at desc
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
    ewi.updated_at as work_item_updated_at,
    lu.last_update_kind,
    lu.last_update_summary,
    lu.last_update_next_step,
    lu.last_update_at
  from support_visible as sv
  join public.engineering_ticket_links as etl
    on etl.ticket_id = sv.ticket_id
   and etl.tenant_id = sv.tenant_id
  join public.engineering_work_items as ewi
    on ewi.id = etl.engineering_work_item_id
   and ewi.tenant_id = etl.tenant_id
  left join latest_update as lu
    on lu.engineering_work_item_id = ewi.id
  left join public.profiles as creator
    on creator.id = etl.created_by_user_id
  left join public.profiles as assignee
    on assignee.id = ewi.assigned_to_user_id;

create or replace view public.vw_engineering_work_item_detail
with (security_barrier = true)
as
  select
    q.*,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'ticket_id', tl.ticket_id,
            'ticket_title', tl.ticket_title,
            'ticket_status', tl.ticket_status,
            'ticket_priority', tl.ticket_priority,
            'ticket_severity', tl.ticket_severity,
            'ticket_updated_at', tl.ticket_updated_at,
            'link_created_at', tl.link_created_at,
            'handoff_note', tl.handoff_note
          )
          order by tl.link_created_at desc
        )
        from (
          select
            etl.ticket_id,
            tk.title as ticket_title,
            tk.status as ticket_status,
            tk.priority as ticket_priority,
            tk.severity as ticket_severity,
            tk.updated_at as ticket_updated_at,
            etl.created_at as link_created_at,
            etl.handoff_note
          from public.engineering_ticket_links as etl
          join public.tickets as tk
            on tk.id = etl.ticket_id
           and tk.tenant_id = etl.tenant_id
          where etl.engineering_work_item_id = q.engineering_work_item_id
            and etl.tenant_id = q.tenant_id
        ) as tl
      ),
      '[]'::jsonb
    ) as linked_tickets
  from public.vw_engineering_work_items_queue as q
  where app_private.can_access_engineering_workspace(q.tenant_id);

create or replace view public.vw_engineering_work_item_ticket_links
with (security_barrier = true)
as
  select
    etl.id as engineering_ticket_link_id,
    etl.tenant_id,
    tenant.slug as tenant_slug,
    coalesce(tenant.display_name, tenant.legal_name) as tenant_name,
    etl.engineering_work_item_id,
    ewi.title as work_item_title,
    ewi.status as work_item_status,
    ewi.priority as work_item_priority,
    etl.ticket_id,
    ticket.title as ticket_title,
    ticket.status as ticket_status,
    ticket.priority as ticket_priority,
    ticket.severity as ticket_severity,
    ticket.updated_at as ticket_updated_at,
    etl.handoff_note,
    etl.created_by_user_id,
    creator.full_name as created_by_full_name,
    etl.created_at,
    etl.updated_at
  from public.engineering_ticket_links as etl
  join public.engineering_work_items as ewi
    on ewi.id = etl.engineering_work_item_id
   and ewi.tenant_id = etl.tenant_id
  join public.tickets as ticket
    on ticket.id = etl.ticket_id
   and ticket.tenant_id = etl.tenant_id
  join public.tenants as tenant
    on tenant.id = etl.tenant_id
  left join public.profiles as creator
    on creator.id = etl.created_by_user_id
  where app_private.can_access_engineering_workspace(etl.tenant_id);

create or replace view public.vw_engineering_work_item_updates
with (security_barrier = true)
as
  select
    ewiu.id as engineering_work_item_update_id,
    ewiu.tenant_id,
    ewiu.engineering_work_item_id,
    ewiu.update_kind,
    ewiu.status,
    ewiu.summary,
    ewiu.next_step,
    ewiu.created_by_user_id,
    actor.full_name as created_by_full_name,
    ewiu.created_at
  from public.engineering_work_item_updates as ewiu
  left join public.profiles as actor
    on actor.id = ewiu.created_by_user_id
  where app_private.can_access_engineering_workspace(ewiu.tenant_id);

revoke all on public.vw_engineering_work_items_queue from public, anon, authenticated, service_role;
revoke all on public.vw_engineering_work_item_detail from public, anon, authenticated, service_role;
revoke all on public.vw_engineering_work_item_ticket_links from public, anon, authenticated, service_role;
revoke all on public.vw_engineering_work_item_updates from public, anon, authenticated, service_role;

grant select on public.vw_engineering_work_items_queue to authenticated, service_role;
grant select on public.vw_engineering_work_item_detail to authenticated, service_role;
grant select on public.vw_engineering_work_item_ticket_links to authenticated, service_role;
grant select on public.vw_engineering_work_item_updates to authenticated, service_role;

revoke all on function app_private.can_access_engineering_workspace(uuid) from public, anon, authenticated, service_role;
revoke all on function app_private.can_assign_engineering_work_item(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function app_private.engineering_status_transition_allowed(public.engineering_work_item_status, public.engineering_work_item_status) from public, anon, authenticated, service_role;
revoke all on function app_private.create_engineering_work_item_update(uuid, uuid, uuid, public.engineering_work_item_update_kind, public.engineering_work_item_status, text, text) from public, anon, authenticated, service_role;
revoke all on function app_private.create_engineering_ticket_events(uuid, uuid, uuid, public.ticket_event_type, jsonb) from public, anon, authenticated, service_role;

grant execute on function app_private.can_access_engineering_workspace(uuid) to authenticated, service_role;
grant execute on function app_private.can_assign_engineering_work_item(uuid, uuid) to authenticated, service_role;

revoke all on function public.rpc_engineering_assign_work_item(uuid, uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_engineering_unassign_work_item(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_engineering_update_work_item_status(uuid, uuid, public.engineering_work_item_status, text, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_engineering_add_work_item_update(uuid, uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_engineering_return_work_item_to_support(uuid, uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_engineering_link_existing_work_item_to_ticket(uuid, uuid, uuid, text) from public, anon, authenticated, service_role;

grant execute on function public.rpc_engineering_assign_work_item(uuid, uuid, uuid) to authenticated;
grant execute on function public.rpc_engineering_unassign_work_item(uuid, uuid) to authenticated;
grant execute on function public.rpc_engineering_update_work_item_status(uuid, uuid, public.engineering_work_item_status, text, text) to authenticated;
grant execute on function public.rpc_engineering_add_work_item_update(uuid, uuid, text, text) to authenticated;
grant execute on function public.rpc_engineering_return_work_item_to_support(uuid, uuid, text, text) to authenticated;
grant execute on function public.rpc_engineering_link_existing_work_item_to_ticket(uuid, uuid, uuid, text) to authenticated;

comment on table public.engineering_work_item_updates is
  'Atualizacoes tecnicas estruturadas de work items de engenharia, separadas de ticket_messages.';

comment on view public.vw_engineering_work_items_queue is
  'Fila operacional do Engineering Workspace, filtrada por tenant e papeis tecnicos.';

comment on view public.vw_engineering_work_item_detail is
  'Detalhe operacional do Engineering Workspace com tickets vinculados e ultimo retorno tecnico.';

comment on view public.vw_engineering_work_item_ticket_links is
  'Read model dos vinculos entre work items tecnicos e tickets de suporte.';

comment on view public.vw_engineering_work_item_updates is
  'Feed estruturado de updates tecnicos do work item sem depender de ticket_messages.';
