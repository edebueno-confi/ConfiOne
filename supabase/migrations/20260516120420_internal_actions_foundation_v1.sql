alter type public.ticket_event_type add value if not exists 'internal_action_created';
alter type public.ticket_event_type add value if not exists 'internal_action_assigned';
alter type public.ticket_event_type add value if not exists 'internal_action_status_updated';
alter type public.ticket_event_type add value if not exists 'internal_action_comment_added';
alter type public.ticket_event_type add value if not exists 'internal_action_evidence_linked';
alter type public.ticket_event_type add value if not exists 'internal_action_returned_to_support';
alter type public.ticket_event_type add value if not exists 'internal_action_follow_up_requested';
alter type public.ticket_event_type add value if not exists 'internal_action_return_accepted';
alter type public.ticket_event_type add value if not exists 'internal_action_closed';
alter type public.ticket_event_type add value if not exists 'internal_action_cancelled';

create type public.internal_area_membership_role as enum (
  'member',
  'manager',
  'viewer'
);

create type public.internal_area_membership_status as enum (
  'active',
  'inactive',
  'archived'
);

create type public.internal_action_status as enum (
  'open',
  'assigned',
  'in_progress',
  'waiting_support',
  'waiting_external',
  'returned_to_support',
  'follow_up_requested',
  'closed',
  'cancelled'
);

create type public.internal_action_support_type as enum (
  'analysis',
  'execution',
  'approval',
  'information_request',
  'external_follow_up',
  'technical_investigation'
);

create type public.internal_action_update_kind as enum (
  'comment',
  'assignment_changed',
  'status_changed',
  'evidence_linked',
  'returned_to_support',
  'support_acceptance',
  'follow_up_requested',
  'closed',
  'cancelled'
);

create table public.internal_action_target_areas (
  area_key text primary key,
  display_name text not null,
  status public.ticket_reference_status not null default 'active',
  is_system boolean not null default true,
  allows_specialized_bridge boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint internal_action_target_areas_area_key_not_blank_check
    check (nullif(btrim(area_key), '') is not null),
  constraint internal_action_target_areas_display_name_not_blank_check
    check (nullif(btrim(display_name), '') is not null),
  constraint internal_action_target_areas_area_key_format_check
    check (area_key = lower(area_key) and area_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$')
);

create table public.internal_area_memberships (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  area_key text not null references public.internal_action_target_areas (area_key),
  role public.internal_area_membership_role not null,
  status public.internal_area_membership_status not null default 'inactive',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles (id),
  updated_by_user_id uuid references public.profiles (id),
  unique (tenant_id, user_id, area_key)
);

create index internal_area_memberships_user_lookup_idx
  on public.internal_area_memberships (user_id, status, area_key, tenant_id);

create index internal_area_memberships_tenant_area_lookup_idx
  on public.internal_area_memberships (tenant_id, area_key, status, role);

create table public.internal_actions (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  ticket_id uuid not null,
  target_area text not null references public.internal_action_target_areas (area_key),
  support_type public.internal_action_support_type not null,
  priority public.ticket_priority not null default 'normal',
  status public.internal_action_status not null default 'open',
  summary text not null,
  context text not null,
  requested_by_user_id uuid not null references public.profiles (id),
  assigned_area_user_id uuid references public.profiles (id),
  returned_to_support_at timestamptz,
  closed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by_user_id uuid references public.profiles (id),
  constraint internal_actions_ticket_fk
    foreign key (ticket_id, tenant_id)
    references public.tickets (id, tenant_id)
    on delete cascade,
  constraint internal_actions_id_tenant_key
    unique (id, tenant_id),
  constraint internal_actions_summary_not_blank_check
    check (nullif(btrim(summary), '') is not null),
  constraint internal_actions_context_not_blank_check
    check (nullif(btrim(context), '') is not null)
);

create index internal_actions_ticket_lookup_idx
  on public.internal_actions (ticket_id, created_at desc);

create index internal_actions_tenant_area_status_idx
  on public.internal_actions (tenant_id, target_area, status, updated_at desc);

create index internal_actions_assignee_lookup_idx
  on public.internal_actions (tenant_id, assigned_area_user_id, status, updated_at desc);

create table public.internal_action_updates (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  internal_action_id uuid not null,
  update_kind public.internal_action_update_kind not null,
  status_before public.internal_action_status,
  status_after public.internal_action_status,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  constraint internal_action_updates_id_tenant_key
    unique (id, tenant_id),
  constraint internal_action_updates_internal_action_fk
    foreign key (internal_action_id, tenant_id)
    references public.internal_actions (id, tenant_id)
    on delete cascade,
  constraint internal_action_updates_body_not_blank_check
    check (nullif(btrim(body), '') is not null)
);

create index internal_action_updates_action_lookup_idx
  on public.internal_action_updates (internal_action_id, created_at desc);

create index internal_action_updates_tenant_kind_idx
  on public.internal_action_updates (tenant_id, update_kind, created_at desc);

create table public.internal_action_evidence_links (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  internal_action_id uuid not null,
  internal_action_update_id uuid not null,
  ticket_attachment_id uuid not null,
  note text,
  linked_by_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  constraint internal_action_evidence_links_internal_action_fk
    foreign key (internal_action_id, tenant_id)
    references public.internal_actions (id, tenant_id)
    on delete cascade,
  constraint internal_action_evidence_links_update_fk
    foreign key (internal_action_update_id, tenant_id)
    references public.internal_action_updates (id, tenant_id)
    on delete cascade,
  constraint internal_action_evidence_links_attachment_fk
    foreign key (ticket_attachment_id)
    references public.ticket_attachments (id)
    on delete cascade,
  constraint internal_action_evidence_links_action_attachment_key
    unique (internal_action_id, ticket_attachment_id),
  constraint internal_action_evidence_links_note_not_blank_check
    check (
      note is null
      or nullif(btrim(note), '') is not null
    )
);

create index internal_action_evidence_links_action_lookup_idx
  on public.internal_action_evidence_links (internal_action_id, created_at desc);

create index internal_action_evidence_links_attachment_lookup_idx
  on public.internal_action_evidence_links (ticket_attachment_id, created_at desc);

insert into public.internal_action_target_areas (
  area_key,
  display_name,
  status,
  is_system,
  allows_specialized_bridge
)
values
  ('engineering', 'Engenharia', 'active', true, true),
  ('finance', 'Financeiro', 'active', true, false),
  ('customer_success', 'Customer Success', 'active', true, false),
  ('product', 'Produto', 'active', true, false),
  ('operations', 'Operações', 'active', true, false),
  ('other_internal', 'Outra área interna', 'active', true, false)
on conflict (area_key) do update
set
  display_name = excluded.display_name,
  status = excluded.status,
  is_system = excluded.is_system,
  allows_specialized_bridge = excluded.allows_specialized_bridge,
  updated_at = timezone('utc', now());

create or replace function app_private.ensure_internal_area_membership_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_area public.internal_action_target_areas;
begin
  select *
  into v_area
  from public.internal_action_target_areas as area
  where area.area_key = new.area_key;

  if v_area.area_key is null then
    raise exception 'internal action target area not found';
  end if;

  if new.status = 'active'::public.internal_area_membership_status then
    if v_area.status <> 'active'::public.ticket_reference_status then
      raise exception 'internal area membership requires active target area';
    end if;

    if not exists (
      select 1
      from public.tenant_memberships as tm
      join public.profiles as p
        on p.id = tm.user_id
      where tm.tenant_id = new.tenant_id
        and tm.user_id = new.user_id
        and tm.status = 'active'::public.membership_status
        and p.is_active
    ) then
      raise exception 'internal area membership requires active tenant membership';
    end if;
  end if;

  return new;
end;
$$;

create or replace function app_private.has_active_internal_area_membership(
  target_tenant_id uuid,
  target_user_id uuid,
  target_area_key text,
  allowed_roles public.internal_area_membership_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.internal_area_memberships as iam
    join public.tenant_memberships as tm
      on tm.tenant_id = iam.tenant_id
     and tm.user_id = iam.user_id
     and tm.status = 'active'::public.membership_status
    join public.profiles as p
      on p.id = iam.user_id
    join public.internal_action_target_areas as area
      on area.area_key = iam.area_key
    where iam.tenant_id = target_tenant_id
      and iam.user_id = target_user_id
      and iam.area_key = target_area_key
      and iam.status = 'active'::public.internal_area_membership_status
      and p.is_active
      and area.status = 'active'::public.ticket_reference_status
      and (
        allowed_roles is null
        or iam.role = any(allowed_roles)
      )
  );
$$;

create or replace function app_private.can_access_support_internal_actions(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.can_access_support_workspace(target_tenant_id);
$$;

create or replace function app_private.can_access_internal_action_area(
  target_tenant_id uuid,
  target_area_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    app_private.has_global_role('platform_admin'::public.platform_role)
    or app_private.has_active_internal_area_membership(
      target_tenant_id,
      auth.uid(),
      target_area_key,
      array[
        'viewer',
        'member',
        'manager'
      ]::public.internal_area_membership_role[]
    );
$$;

create or replace function app_private.can_manage_internal_action_area_assignment(
  target_tenant_id uuid,
  target_area_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    app_private.has_global_role('platform_admin'::public.platform_role)
    or app_private.can_access_support_internal_actions(target_tenant_id)
    or app_private.has_active_internal_area_membership(
      target_tenant_id,
      auth.uid(),
      target_area_key,
      array['manager']::public.internal_area_membership_role[]
    );
$$;

create or replace function app_private.can_support_access_internal_action_ticket(
  target_ticket_id uuid,
  target_tenant_id uuid
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
    where t.id = target_ticket_id
      and t.tenant_id = target_tenant_id
      and app_private.can_access_support_internal_actions(t.tenant_id)
  );
$$;

create or replace function app_private.internal_action_status_transition_allowed(
  current_status public.internal_action_status,
  target_status public.internal_action_status
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when current_status = target_status then false
    when current_status = 'open' then target_status = any(
      array[
        'assigned',
        'in_progress',
        'waiting_support',
        'waiting_external',
        'returned_to_support',
        'cancelled'
      ]::public.internal_action_status[]
    )
    when current_status = 'assigned' then target_status = any(
      array[
        'in_progress',
        'waiting_support',
        'waiting_external',
        'returned_to_support',
        'cancelled'
      ]::public.internal_action_status[]
    )
    when current_status = 'in_progress' then target_status = any(
      array[
        'waiting_support',
        'waiting_external',
        'returned_to_support',
        'cancelled'
      ]::public.internal_action_status[]
    )
    when current_status = 'waiting_support' then target_status = any(
      array[
        'in_progress',
        'waiting_external',
        'returned_to_support',
        'follow_up_requested',
        'closed',
        'cancelled'
      ]::public.internal_action_status[]
    )
    when current_status = 'waiting_external' then target_status = any(
      array[
        'in_progress',
        'returned_to_support',
        'cancelled'
      ]::public.internal_action_status[]
    )
    when current_status = 'returned_to_support' then target_status = any(
      array[
        'waiting_support',
        'follow_up_requested',
        'closed',
        'cancelled'
      ]::public.internal_action_status[]
    )
    when current_status = 'follow_up_requested' then target_status = any(
      array[
        'assigned',
        'in_progress',
        'waiting_support',
        'waiting_external',
        'returned_to_support',
        'cancelled'
      ]::public.internal_action_status[]
    )
    else false
  end;
$$;

create or replace function app_private.create_internal_action_update(
  p_internal_action_id uuid,
  p_tenant_id uuid,
  p_actor_user_id uuid,
  p_update_kind public.internal_action_update_kind,
  p_body text,
  p_status_before public.internal_action_status default null,
  p_status_after public.internal_action_status default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.internal_action_updates
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_update public.internal_action_updates;
begin
  insert into public.internal_action_updates (
    tenant_id,
    internal_action_id,
    update_kind,
    status_before,
    status_after,
    body,
    metadata,
    created_by_user_id
  )
  values (
    p_tenant_id,
    p_internal_action_id,
    p_update_kind,
    p_status_before,
    p_status_after,
    btrim(p_body),
    coalesce(p_metadata, '{}'::jsonb),
    p_actor_user_id
  )
  returning *
  into v_update;

  return v_update;
end;
$$;

create or replace function app_private.create_internal_action_ticket_event(
  p_internal_action_id uuid,
  p_event_type public.ticket_event_type,
  p_actor_user_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns public.ticket_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action record;
  v_event public.ticket_events;
begin
  select
    ia.id,
    ia.ticket_id,
    ia.tenant_id,
    ia.target_area,
    area.display_name as target_area_label
  into v_action
  from public.internal_actions as ia
  join public.internal_action_target_areas as area
    on area.area_key = ia.target_area
  where ia.id = p_internal_action_id;

  if v_action.id is null then
    raise exception 'internal action not found';
  end if;

  v_event := app_private.create_ticket_event(
    v_action.ticket_id,
    v_action.tenant_id,
    p_event_type,
    'internal'::public.message_visibility,
    p_actor_user_id,
    jsonb_strip_nulls(
      coalesce(p_metadata, '{}'::jsonb)
      || jsonb_build_object(
        'internal_action_id', v_action.id,
        'target_area', v_action.target_area,
        'target_area_label', v_action.target_area_label
      )
    )
  );

  return v_event;
end;
$$;

create or replace function app_private.prevent_internal_action_append_only_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% is append-only', tg_table_schema || '.' || tg_table_name;
end;
$$;

create or replace function public.rpc_support_create_internal_action(
  p_ticket_id uuid,
  p_target_area text,
  p_support_type public.internal_action_support_type,
  p_priority public.ticket_priority,
  p_summary text,
  p_context text,
  p_evidence_attachment_ids uuid[] default null,
  p_assigned_area_user_id uuid default null
)
returns public.internal_actions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_ticket public.tickets;
  v_action public.internal_actions;
  v_target_area public.internal_action_target_areas;
  v_update public.internal_action_updates;
  v_assignment_update public.internal_action_updates;
  v_attachment_id uuid;
  v_attachment public.ticket_attachments;
  v_evidence_update public.internal_action_updates;
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

  if not app_private.can_support_access_internal_action_ticket(v_ticket.id, v_ticket.tenant_id) then
    raise exception 'rpc_support_create_internal_action denied';
  end if;

  if v_ticket.status = any(array['closed', 'cancelled']::public.ticket_status[]) then
    raise exception 'ticket is not eligible for internal action';
  end if;

  select *
  into v_target_area
  from public.internal_action_target_areas as area
  where area.area_key = p_target_area
    and area.status = 'active'::public.ticket_reference_status;

  if v_target_area.area_key is null then
    raise exception 'internal action target area is not active';
  end if;

  if p_assigned_area_user_id is not null
     and not app_private.has_active_internal_area_membership(
       v_ticket.tenant_id,
       p_assigned_area_user_id,
       p_target_area,
       array['member', 'manager']::public.internal_area_membership_role[]
     ) then
    raise exception 'assigned area user is not eligible for the target area';
  end if;

  insert into public.internal_actions (
    tenant_id,
    ticket_id,
    target_area,
    support_type,
    priority,
    status,
    summary,
    context,
    requested_by_user_id,
    assigned_area_user_id,
    updated_by_user_id
  )
  values (
    v_ticket.tenant_id,
    v_ticket.id,
    p_target_area,
    p_support_type,
    coalesce(p_priority, 'normal'::public.ticket_priority),
    case
      when p_assigned_area_user_id is null then 'open'::public.internal_action_status
      else 'assigned'::public.internal_action_status
    end,
    btrim(p_summary),
    btrim(p_context),
    v_actor_user_id,
    p_assigned_area_user_id,
    v_actor_user_id
  )
  returning *
  into v_action;

  v_update := app_private.create_internal_action_update(
    v_action.id,
    v_action.tenant_id,
    v_actor_user_id,
    'status_changed'::public.internal_action_update_kind,
    'Acionamento interno criado pelo suporte.',
    null,
    v_action.status,
    jsonb_build_object(
      'support_type', v_action.support_type,
      'priority', v_action.priority
    )
  );

  perform app_private.create_internal_action_ticket_event(
    v_action.id,
    'internal_action_created'::public.ticket_event_type,
    v_actor_user_id,
    jsonb_build_object(
      'internal_action_update_id', v_update.id,
      'support_type', v_action.support_type,
      'priority', v_action.priority,
      'status_after', v_action.status
    )
  );

  if v_action.assigned_area_user_id is not null then
    v_assignment_update := app_private.create_internal_action_update(
      v_action.id,
      v_action.tenant_id,
      v_actor_user_id,
      'assignment_changed'::public.internal_action_update_kind,
      'Responsável da área definido na criação.',
      null,
      v_action.status,
      jsonb_build_object(
        'assigned_area_user_id', v_action.assigned_area_user_id
      )
    );

    perform app_private.create_internal_action_ticket_event(
      v_action.id,
      'internal_action_assigned'::public.ticket_event_type,
      v_actor_user_id,
      jsonb_build_object(
        'internal_action_update_id', v_assignment_update.id,
        'assigned_area_user_id', v_action.assigned_area_user_id,
        'status_after', v_action.status
      )
    );
  end if;

  foreach v_attachment_id in array coalesce(p_evidence_attachment_ids, array[]::uuid[])
  loop
    select *
    into v_attachment
    from public.ticket_attachments as ta
    where ta.id = v_attachment_id
      and ta.tenant_id = v_action.tenant_id
      and ta.ticket_id = v_action.ticket_id;

    if v_attachment.id is null then
      raise exception 'ticket attachment is not valid for this internal action';
    end if;

    if v_attachment.archived_at is not null
       or v_attachment.status <> 'available'::public.ticket_attachment_status then
      raise exception 'ticket attachment is not available for internal action';
    end if;

    v_evidence_update := app_private.create_internal_action_update(
      v_action.id,
      v_action.tenant_id,
      v_actor_user_id,
      'evidence_linked'::public.internal_action_update_kind,
      'Evidência do ticket vinculada ao acionamento interno.',
      null,
      null,
      jsonb_build_object(
        'ticket_attachment_id', v_attachment.id
      )
    );

    insert into public.internal_action_evidence_links (
      tenant_id,
      internal_action_id,
      internal_action_update_id,
      ticket_attachment_id,
      note,
      linked_by_user_id
    )
    values (
      v_action.tenant_id,
      v_action.id,
      v_evidence_update.id,
      v_attachment.id,
      null,
      v_actor_user_id
    );

    perform app_private.create_internal_action_ticket_event(
      v_action.id,
      'internal_action_evidence_linked'::public.ticket_event_type,
      v_actor_user_id,
      jsonb_build_object(
        'internal_action_update_id', v_evidence_update.id,
        'ticket_attachment_id', v_attachment.id
      )
    );
  end loop;

  return v_action;
end;
$$;

create or replace function public.rpc_internal_action_assign(
  p_internal_action_id uuid,
  p_tenant_id uuid,
  p_assigned_area_user_id uuid
)
returns public.internal_actions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.internal_actions;
  v_action public.internal_actions;
  v_target_status public.internal_action_status;
  v_update public.internal_action_updates;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_existing
  from public.internal_actions as ia
  where ia.id = p_internal_action_id
    and ia.tenant_id = p_tenant_id
  for update;

  if v_existing.id is null then
    raise exception 'internal action not found';
  end if;

  if not app_private.can_manage_internal_action_area_assignment(
    v_existing.tenant_id,
    v_existing.target_area
  ) then
    raise exception 'rpc_internal_action_assign denied';
  end if;

  if p_assigned_area_user_id is null then
    raise exception 'assigned_area_user_id is required';
  end if;

  if not app_private.has_active_internal_area_membership(
    v_existing.tenant_id,
    p_assigned_area_user_id,
    v_existing.target_area,
    array['member', 'manager']::public.internal_area_membership_role[]
  ) then
    raise exception 'assigned area user is not eligible for the target area';
  end if;

  if v_existing.assigned_area_user_id = p_assigned_area_user_id then
    raise exception 'internal action is already assigned to this user';
  end if;

  v_target_status := case
    when v_existing.status in ('open', 'follow_up_requested') then 'assigned'::public.internal_action_status
    else v_existing.status
  end;

  if v_target_status <> v_existing.status
     and not app_private.internal_action_status_transition_allowed(v_existing.status, v_target_status) then
    raise exception 'invalid internal action status transition: % -> %', v_existing.status, v_target_status;
  end if;

  update public.internal_actions
  set
    assigned_area_user_id = p_assigned_area_user_id,
    status = v_target_status,
    updated_by_user_id = v_actor_user_id
  where id = v_existing.id
    and tenant_id = v_existing.tenant_id
  returning *
  into v_action;

  v_update := app_private.create_internal_action_update(
    v_action.id,
    v_action.tenant_id,
    v_actor_user_id,
    'assignment_changed'::public.internal_action_update_kind,
    'Responsável da área atualizado.',
    case
      when v_target_status <> v_existing.status then v_existing.status
      else null
    end,
    case
      when v_target_status <> v_existing.status then v_target_status
      else null
    end,
    jsonb_strip_nulls(
      jsonb_build_object(
        'previous_assigned_area_user_id', v_existing.assigned_area_user_id,
        'assigned_area_user_id', v_action.assigned_area_user_id
      )
    )
  );

  perform app_private.create_internal_action_ticket_event(
    v_action.id,
    'internal_action_assigned'::public.ticket_event_type,
    v_actor_user_id,
    jsonb_strip_nulls(
      jsonb_build_object(
        'internal_action_update_id', v_update.id,
        'previous_assigned_area_user_id', v_existing.assigned_area_user_id,
        'assigned_area_user_id', v_action.assigned_area_user_id,
        'status_before', case when v_target_status <> v_existing.status then v_existing.status else null end,
        'status_after', case when v_target_status <> v_existing.status then v_target_status else null end
      )
    )
  );

  return v_action;
end;
$$;

create or replace function public.rpc_internal_action_add_comment(
  p_internal_action_id uuid,
  p_tenant_id uuid,
  p_body text
)
returns public.internal_action_updates
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_action public.internal_actions;
  v_update public.internal_action_updates;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_action
  from public.internal_actions as ia
  where ia.id = p_internal_action_id
    and ia.tenant_id = p_tenant_id;

  if v_action.id is null then
    raise exception 'internal action not found';
  end if;

  if not (
    app_private.can_access_support_internal_actions(v_action.tenant_id)
    or app_private.has_active_internal_area_membership(
      v_action.tenant_id,
      v_actor_user_id,
      v_action.target_area,
      array['member', 'manager']::public.internal_area_membership_role[]
    )
  ) then
    raise exception 'rpc_internal_action_add_comment denied';
  end if;

  if v_action.status = any(array['closed', 'cancelled']::public.internal_action_status[]) then
    raise exception 'internal action does not accept comments';
  end if;

  v_update := app_private.create_internal_action_update(
    v_action.id,
    v_action.tenant_id,
    v_actor_user_id,
    'comment'::public.internal_action_update_kind,
    p_body
  );

  update public.internal_actions
  set updated_by_user_id = v_actor_user_id
  where id = v_action.id
    and tenant_id = v_action.tenant_id;

  perform app_private.create_internal_action_ticket_event(
    v_action.id,
    'internal_action_comment_added'::public.ticket_event_type,
    v_actor_user_id,
    jsonb_build_object('internal_action_update_id', v_update.id)
  );

  return v_update;
end;
$$;

create or replace function public.rpc_internal_action_update_status(
  p_internal_action_id uuid,
  p_tenant_id uuid,
  p_status public.internal_action_status,
  p_body text default null
)
returns public.internal_actions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.internal_actions;
  v_action public.internal_actions;
  v_update public.internal_action_updates;
  v_update_kind public.internal_action_update_kind;
  v_body text;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_existing
  from public.internal_actions as ia
  where ia.id = p_internal_action_id
    and ia.tenant_id = p_tenant_id
  for update;

  if v_existing.id is null then
    raise exception 'internal action not found';
  end if;

  if not app_private.has_active_internal_area_membership(
    v_existing.tenant_id,
    v_actor_user_id,
    v_existing.target_area,
    array['member', 'manager']::public.internal_area_membership_role[]
  ) then
    raise exception 'rpc_internal_action_update_status denied';
  end if;

  if p_status = any(
    array[
      'returned_to_support',
      'follow_up_requested',
      'closed'
    ]::public.internal_action_status[]
  ) then
    raise exception 'use the dedicated RPC for this internal action transition';
  end if;

  if p_status = 'assigned'::public.internal_action_status
     and v_existing.assigned_area_user_id is null then
    raise exception 'assigned status requires assigned area user';
  end if;

  if not app_private.internal_action_status_transition_allowed(v_existing.status, p_status) then
    raise exception 'invalid internal action status transition: % -> %', v_existing.status, p_status;
  end if;

  v_update_kind := case
    when p_status = 'cancelled' then 'cancelled'::public.internal_action_update_kind
    else 'status_changed'::public.internal_action_update_kind
  end;

  v_body := coalesce(
    nullif(btrim(coalesce(p_body, '')), ''),
    case
      when p_status = 'cancelled' then 'Acionamento interno cancelado.'
      else 'Status do acionamento interno atualizado.'
    end
  );

  update public.internal_actions
  set
    status = p_status,
    cancelled_at = case
      when p_status = 'cancelled'::public.internal_action_status then timezone('utc', now())
      else v_existing.cancelled_at
    end,
    updated_by_user_id = v_actor_user_id
  where id = v_existing.id
    and tenant_id = v_existing.tenant_id
  returning *
  into v_action;

  v_update := app_private.create_internal_action_update(
    v_action.id,
    v_action.tenant_id,
    v_actor_user_id,
    v_update_kind,
    v_body,
    v_existing.status,
    v_action.status
  );

  perform app_private.create_internal_action_ticket_event(
    v_action.id,
    case
      when v_action.status = 'cancelled'::public.internal_action_status
        then 'internal_action_cancelled'::public.ticket_event_type
      else 'internal_action_status_updated'::public.ticket_event_type
    end,
    v_actor_user_id,
    jsonb_build_object(
      'internal_action_update_id', v_update.id,
      'status_before', v_existing.status,
      'status_after', v_action.status
    )
  );

  return v_action;
end;
$$;

create or replace function public.rpc_internal_action_add_evidence_link(
  p_internal_action_id uuid,
  p_tenant_id uuid,
  p_ticket_attachment_id uuid,
  p_note text default null
)
returns public.internal_action_evidence_links
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_action public.internal_actions;
  v_attachment public.ticket_attachments;
  v_update public.internal_action_updates;
  v_link public.internal_action_evidence_links;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_action
  from public.internal_actions as ia
  where ia.id = p_internal_action_id
    and ia.tenant_id = p_tenant_id;

  if v_action.id is null then
    raise exception 'internal action not found';
  end if;

  if not (
    app_private.can_access_support_internal_actions(v_action.tenant_id)
    or app_private.has_active_internal_area_membership(
      v_action.tenant_id,
      v_actor_user_id,
      v_action.target_area,
      array['member', 'manager']::public.internal_area_membership_role[]
    )
  ) then
    raise exception 'rpc_internal_action_add_evidence_link denied';
  end if;

  if v_action.status = any(array['closed', 'cancelled']::public.internal_action_status[]) then
    raise exception 'internal action does not accept evidence links';
  end if;

  select *
  into v_attachment
  from public.ticket_attachments as ta
  where ta.id = p_ticket_attachment_id
    and ta.tenant_id = v_action.tenant_id
    and ta.ticket_id = v_action.ticket_id;

  if v_attachment.id is null then
    raise exception 'ticket attachment is not valid for this internal action';
  end if;

  if v_attachment.archived_at is not null
     or v_attachment.status <> 'available'::public.ticket_attachment_status then
    raise exception 'ticket attachment is not available for internal action';
  end if;

  v_update := app_private.create_internal_action_update(
    v_action.id,
    v_action.tenant_id,
    v_actor_user_id,
    'evidence_linked'::public.internal_action_update_kind,
    coalesce(
      nullif(btrim(coalesce(p_note, '')), ''),
      'Evidência do ticket vinculada ao acionamento interno.'
    ),
    null,
    null,
    jsonb_build_object(
      'ticket_attachment_id', v_attachment.id
    )
  );

  insert into public.internal_action_evidence_links (
    tenant_id,
    internal_action_id,
    internal_action_update_id,
    ticket_attachment_id,
    note,
    linked_by_user_id
  )
  values (
    v_action.tenant_id,
    v_action.id,
    v_update.id,
    v_attachment.id,
    nullif(btrim(coalesce(p_note, '')), ''),
    v_actor_user_id
  )
  returning *
  into v_link;

  update public.internal_actions
  set updated_by_user_id = v_actor_user_id
  where id = v_action.id
    and tenant_id = v_action.tenant_id;

  perform app_private.create_internal_action_ticket_event(
    v_action.id,
    'internal_action_evidence_linked'::public.ticket_event_type,
    v_actor_user_id,
    jsonb_build_object(
      'internal_action_update_id', v_update.id,
      'internal_action_evidence_link_id', v_link.id,
      'ticket_attachment_id', v_attachment.id
    )
  );

  return v_link;
end;
$$;

create or replace function public.rpc_internal_action_return_to_support(
  p_internal_action_id uuid,
  p_tenant_id uuid,
  p_body text
)
returns public.internal_actions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.internal_actions;
  v_action public.internal_actions;
  v_update public.internal_action_updates;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_existing
  from public.internal_actions as ia
  where ia.id = p_internal_action_id
    and ia.tenant_id = p_tenant_id
  for update;

  if v_existing.id is null then
    raise exception 'internal action not found';
  end if;

  if not app_private.has_active_internal_area_membership(
    v_existing.tenant_id,
    v_actor_user_id,
    v_existing.target_area,
    array['member', 'manager']::public.internal_area_membership_role[]
  ) then
    raise exception 'rpc_internal_action_return_to_support denied';
  end if;

  if not app_private.internal_action_status_transition_allowed(
    v_existing.status,
    'returned_to_support'::public.internal_action_status
  ) then
    raise exception 'invalid internal action status transition: % -> returned_to_support', v_existing.status;
  end if;

  update public.internal_actions
  set
    status = 'returned_to_support',
    returned_to_support_at = timezone('utc', now()),
    updated_by_user_id = v_actor_user_id
  where id = v_existing.id
    and tenant_id = v_existing.tenant_id
  returning *
  into v_action;

  v_update := app_private.create_internal_action_update(
    v_action.id,
    v_action.tenant_id,
    v_actor_user_id,
    'returned_to_support'::public.internal_action_update_kind,
    p_body,
    v_existing.status,
    v_action.status
  );

  perform app_private.create_internal_action_ticket_event(
    v_action.id,
    'internal_action_returned_to_support'::public.ticket_event_type,
    v_actor_user_id,
    jsonb_build_object(
      'internal_action_update_id', v_update.id,
      'status_before', v_existing.status,
      'status_after', v_action.status
    )
  );

  return v_action;
end;
$$;

create or replace function public.rpc_support_accept_internal_action_return(
  p_internal_action_id uuid,
  p_tenant_id uuid,
  p_note text default null
)
returns public.internal_actions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.internal_actions;
  v_action public.internal_actions;
  v_update public.internal_action_updates;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_existing
  from public.internal_actions as ia
  where ia.id = p_internal_action_id
    and ia.tenant_id = p_tenant_id
  for update;

  if v_existing.id is null then
    raise exception 'internal action not found';
  end if;

  if not app_private.can_access_support_internal_actions(v_existing.tenant_id) then
    raise exception 'rpc_support_accept_internal_action_return denied';
  end if;

  if v_existing.status <> 'returned_to_support'::public.internal_action_status then
    raise exception 'internal action is not waiting for support acceptance';
  end if;

  if not app_private.internal_action_status_transition_allowed(
    v_existing.status,
    'waiting_support'::public.internal_action_status
  ) then
    raise exception 'invalid internal action status transition: % -> waiting_support', v_existing.status;
  end if;

  update public.internal_actions
  set
    status = 'waiting_support',
    updated_by_user_id = v_actor_user_id
  where id = v_existing.id
    and tenant_id = v_existing.tenant_id
  returning *
  into v_action;

  v_update := app_private.create_internal_action_update(
    v_action.id,
    v_action.tenant_id,
    v_actor_user_id,
    'support_acceptance'::public.internal_action_update_kind,
    coalesce(
      nullif(btrim(coalesce(p_note, '')), ''),
      'Retorno da área aceito pelo suporte.'
    ),
    v_existing.status,
    v_action.status
  );

  perform app_private.create_internal_action_ticket_event(
    v_action.id,
    'internal_action_return_accepted'::public.ticket_event_type,
    v_actor_user_id,
    jsonb_build_object(
      'internal_action_update_id', v_update.id,
      'status_before', v_existing.status,
      'status_after', v_action.status
    )
  );

  return v_action;
end;
$$;

create or replace function public.rpc_support_request_internal_action_followup(
  p_internal_action_id uuid,
  p_tenant_id uuid,
  p_note text
)
returns public.internal_actions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.internal_actions;
  v_action public.internal_actions;
  v_update public.internal_action_updates;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_existing
  from public.internal_actions as ia
  where ia.id = p_internal_action_id
    and ia.tenant_id = p_tenant_id
  for update;

  if v_existing.id is null then
    raise exception 'internal action not found';
  end if;

  if not app_private.can_access_support_internal_actions(v_existing.tenant_id) then
    raise exception 'rpc_support_request_internal_action_followup denied';
  end if;

  if v_existing.status not in (
    'returned_to_support'::public.internal_action_status,
    'waiting_support'::public.internal_action_status
  ) then
    raise exception 'internal action is not eligible for follow-up request';
  end if;

  if not app_private.internal_action_status_transition_allowed(
    v_existing.status,
    'follow_up_requested'::public.internal_action_status
  ) then
    raise exception 'invalid internal action status transition: % -> follow_up_requested', v_existing.status;
  end if;

  update public.internal_actions
  set
    status = 'follow_up_requested',
    updated_by_user_id = v_actor_user_id
  where id = v_existing.id
    and tenant_id = v_existing.tenant_id
  returning *
  into v_action;

  v_update := app_private.create_internal_action_update(
    v_action.id,
    v_action.tenant_id,
    v_actor_user_id,
    'follow_up_requested'::public.internal_action_update_kind,
    p_note,
    v_existing.status,
    v_action.status
  );

  perform app_private.create_internal_action_ticket_event(
    v_action.id,
    'internal_action_follow_up_requested'::public.ticket_event_type,
    v_actor_user_id,
    jsonb_build_object(
      'internal_action_update_id', v_update.id,
      'status_before', v_existing.status,
      'status_after', v_action.status
    )
  );

  return v_action;
end;
$$;

create or replace function public.rpc_support_close_internal_action(
  p_internal_action_id uuid,
  p_tenant_id uuid,
  p_note text default null
)
returns public.internal_actions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.internal_actions;
  v_action public.internal_actions;
  v_update public.internal_action_updates;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_existing
  from public.internal_actions as ia
  where ia.id = p_internal_action_id
    and ia.tenant_id = p_tenant_id
  for update;

  if v_existing.id is null then
    raise exception 'internal action not found';
  end if;

  if not app_private.can_access_support_internal_actions(v_existing.tenant_id) then
    raise exception 'rpc_support_close_internal_action denied';
  end if;

  if v_existing.status not in (
    'returned_to_support'::public.internal_action_status,
    'waiting_support'::public.internal_action_status
  ) then
    raise exception 'internal action is not eligible for closure';
  end if;

  if not app_private.internal_action_status_transition_allowed(
    v_existing.status,
    'closed'::public.internal_action_status
  ) then
    raise exception 'invalid internal action status transition: % -> closed', v_existing.status;
  end if;

  update public.internal_actions
  set
    status = 'closed',
    closed_at = timezone('utc', now()),
    updated_by_user_id = v_actor_user_id
  where id = v_existing.id
    and tenant_id = v_existing.tenant_id
  returning *
  into v_action;

  v_update := app_private.create_internal_action_update(
    v_action.id,
    v_action.tenant_id,
    v_actor_user_id,
    'closed'::public.internal_action_update_kind,
    coalesce(
      nullif(btrim(coalesce(p_note, '')), ''),
      'Acionamento interno encerrado pelo suporte.'
    ),
    v_existing.status,
    v_action.status
  );

  perform app_private.create_internal_action_ticket_event(
    v_action.id,
    'internal_action_closed'::public.ticket_event_type,
    v_actor_user_id,
    jsonb_build_object(
      'internal_action_update_id', v_update.id,
      'status_before', v_existing.status,
      'status_after', v_action.status
    )
  );

  return v_action;
end;
$$;

create trigger internal_action_target_areas_set_updated_at
before update on public.internal_action_target_areas
for each row
execute function app_private.touch_updated_at();

create trigger internal_area_memberships_set_updated_at
before insert or update on public.internal_area_memberships
for each row
execute function app_private.ensure_internal_area_membership_integrity();

create trigger internal_area_memberships_touch_updated_at
before update on public.internal_area_memberships
for each row
execute function app_private.touch_updated_at();

create trigger internal_actions_set_updated_at
before update on public.internal_actions
for each row
execute function app_private.touch_updated_at();

create trigger internal_action_updates_append_only
before update or delete on public.internal_action_updates
for each row
execute function app_private.prevent_internal_action_append_only_mutation();

create trigger internal_action_evidence_links_append_only
before update or delete on public.internal_action_evidence_links
for each row
execute function app_private.prevent_internal_action_append_only_mutation();

create trigger internal_action_target_areas_audit_row_change
after insert or update or delete on public.internal_action_target_areas
for each row
execute function audit.capture_row_change();

create trigger internal_area_memberships_audit_row_change
after insert or update or delete on public.internal_area_memberships
for each row
execute function audit.capture_row_change();

create trigger internal_actions_audit_row_change
after insert or update or delete on public.internal_actions
for each row
execute function audit.capture_row_change();

create trigger internal_action_updates_audit_row_change
after insert or update or delete on public.internal_action_updates
for each row
execute function audit.capture_row_change();

create trigger internal_action_evidence_links_audit_row_change
after insert or update or delete on public.internal_action_evidence_links
for each row
execute function audit.capture_row_change();

grant select on public.internal_action_target_areas to service_role;
grant select on public.internal_area_memberships to service_role;
grant select on public.internal_actions to service_role;
grant select on public.internal_action_updates to service_role;
grant select on public.internal_action_evidence_links to service_role;

revoke all on public.internal_action_target_areas from authenticated;
revoke all on public.internal_area_memberships from authenticated;
revoke all on public.internal_actions from authenticated;
revoke all on public.internal_action_updates from authenticated;
revoke all on public.internal_action_evidence_links from authenticated;

alter table public.internal_action_target_areas enable row level security;
alter table public.internal_area_memberships enable row level security;
alter table public.internal_actions enable row level security;
alter table public.internal_action_updates enable row level security;
alter table public.internal_action_evidence_links enable row level security;

create policy internal_action_target_areas_select_controlled
on public.internal_action_target_areas
for select
to authenticated
using (true);

create policy internal_area_memberships_select_controlled
on public.internal_area_memberships
for select
to authenticated
using (
  app_private.has_global_role('platform_admin'::public.platform_role)
  or app_private.can_access_support_internal_actions(tenant_id)
  or (
    user_id = app_private.current_user_id()
    and app_private.can_access_internal_action_area(tenant_id, area_key)
  )
  or app_private.can_manage_internal_action_area_assignment(tenant_id, area_key)
);

create policy internal_actions_select_controlled
on public.internal_actions
for select
to authenticated
using (
  app_private.can_access_support_internal_actions(tenant_id)
  or app_private.can_access_internal_action_area(tenant_id, target_area)
);

create policy internal_action_updates_select_controlled
on public.internal_action_updates
for select
to authenticated
using (
  exists (
    select 1
    from public.internal_actions as ia
    where ia.id = internal_action_updates.internal_action_id
      and ia.tenant_id = internal_action_updates.tenant_id
      and (
        app_private.can_access_support_internal_actions(ia.tenant_id)
        or app_private.can_access_internal_action_area(ia.tenant_id, ia.target_area)
      )
  )
);

create policy internal_action_evidence_links_select_controlled
on public.internal_action_evidence_links
for select
to authenticated
using (
  exists (
    select 1
    from public.internal_actions as ia
    where ia.id = internal_action_evidence_links.internal_action_id
      and ia.tenant_id = internal_action_evidence_links.tenant_id
      and (
        app_private.can_access_support_internal_actions(ia.tenant_id)
        or app_private.can_access_internal_action_area(ia.tenant_id, ia.target_area)
      )
  )
);

create or replace view public.vw_support_ticket_internal_actions
with (security_barrier = true)
as
  with support_visible as (
    select
      ia.*
    from public.internal_actions as ia
    where app_private.can_access_support_internal_actions(ia.tenant_id)
  ),
  latest_update as (
    select distinct on (iau.internal_action_id)
      iau.internal_action_id,
      iau.update_kind as last_update_kind,
      iau.body as last_update_summary,
      iau.created_at as last_update_at
    from public.internal_action_updates as iau
    order by iau.internal_action_id, iau.created_at desc
  )
  select
    ia.id as internal_action_id,
    ia.ticket_id,
    ia.tenant_id,
    ia.target_area,
    area.display_name as target_area_label,
    ia.support_type,
    ia.priority,
    ia.status,
    ia.summary,
    ia.assigned_area_user_id,
    assignee.full_name as assigned_area_user_name,
    ia.requested_by_user_id,
    requester.full_name as requested_by_user_name,
    lu.last_update_kind,
    lu.last_update_summary,
    lu.last_update_at,
    (ia.status = 'returned_to_support'::public.internal_action_status) as has_pending_return,
    ia.created_at,
    ia.updated_at
  from support_visible as ia
  join public.internal_action_target_areas as area
    on area.area_key = ia.target_area
  left join public.profiles as assignee
    on assignee.id = ia.assigned_area_user_id
  left join public.profiles as requester
    on requester.id = ia.requested_by_user_id
  left join latest_update as lu
    on lu.internal_action_id = ia.id;

create or replace view public.vw_support_internal_action_detail
with (security_barrier = true)
as
  with support_visible as (
    select
      ia.*
    from public.internal_actions as ia
    where app_private.can_access_support_internal_actions(ia.tenant_id)
  ),
  latest_update as (
    select distinct on (iau.internal_action_id)
      iau.internal_action_id,
      iau.id as last_update_id,
      iau.update_kind as last_update_kind,
      iau.body as last_update_summary,
      iau.created_at as last_update_at,
      iau.created_by_user_id as last_update_by_user_id
    from public.internal_action_updates as iau
    order by iau.internal_action_id, iau.created_at desc
  ),
  evidence_counts as (
    select
      link.internal_action_id,
      count(*)::integer as linked_evidence_count
    from public.internal_action_evidence_links as link
    group by link.internal_action_id
  )
  select
    ia.id as internal_action_id,
    ia.ticket_id,
    ticket.title as ticket_title,
    ticket.status as ticket_status,
    ticket.priority as ticket_priority,
    ticket.severity as ticket_severity,
    ia.tenant_id,
    ia.target_area,
    area.display_name as target_area_label,
    ia.support_type,
    ia.priority,
    ia.status,
    ia.summary,
    ia.context,
    ia.requested_by_user_id,
    requester.full_name as requested_by_user_name,
    ia.assigned_area_user_id,
    assignee.full_name as assigned_area_user_name,
    ia.returned_to_support_at,
    ia.closed_at,
    ia.cancelled_at,
    ia.created_at,
    ia.updated_at,
    ia.updated_by_user_id,
    updater.full_name as updated_by_user_name,
    lu.last_update_id,
    lu.last_update_kind,
    lu.last_update_summary,
    lu.last_update_at,
    lu.last_update_by_user_id,
    last_actor.full_name as last_update_by_user_name,
    coalesce(ec.linked_evidence_count, 0) as linked_evidence_count,
    (ia.status = 'returned_to_support'::public.internal_action_status) as has_pending_return
  from support_visible as ia
  join public.tickets as ticket
    on ticket.id = ia.ticket_id
   and ticket.tenant_id = ia.tenant_id
  join public.internal_action_target_areas as area
    on area.area_key = ia.target_area
  left join public.profiles as requester
    on requester.id = ia.requested_by_user_id
  left join public.profiles as assignee
    on assignee.id = ia.assigned_area_user_id
  left join public.profiles as updater
    on updater.id = ia.updated_by_user_id
  left join latest_update as lu
    on lu.internal_action_id = ia.id
  left join public.profiles as last_actor
    on last_actor.id = lu.last_update_by_user_id
  left join evidence_counts as ec
    on ec.internal_action_id = ia.id;

create or replace view public.vw_support_internal_action_timeline
with (security_barrier = true)
as
  select
    iau.id as internal_action_update_id,
    iau.internal_action_id,
    ia.ticket_id,
    ia.tenant_id,
    ia.target_area,
    area.display_name as target_area_label,
    iau.update_kind,
    iau.status_before,
    iau.status_after,
    iau.body,
    iau.metadata,
    iau.created_by_user_id,
    actor.full_name as created_by_user_name,
    iau.created_at
  from public.internal_action_updates as iau
  join public.internal_actions as ia
    on ia.id = iau.internal_action_id
   and ia.tenant_id = iau.tenant_id
  join public.internal_action_target_areas as area
    on area.area_key = ia.target_area
  left join public.profiles as actor
    on actor.id = iau.created_by_user_id
  where app_private.can_access_support_internal_actions(ia.tenant_id);

create or replace view public.vw_internal_action_queue_by_area
with (security_barrier = true)
as
  with latest_update as (
    select distinct on (iau.internal_action_id)
      iau.internal_action_id,
      iau.update_kind as last_update_kind,
      iau.body as last_update_summary,
      iau.created_at as last_update_at
    from public.internal_action_updates as iau
    order by iau.internal_action_id, iau.created_at desc
  )
  select
    ia.id as internal_action_id,
    ia.ticket_id,
    ticket.title as ticket_title,
    ticket.status as ticket_status,
    ticket.priority as ticket_priority,
    ticket.severity as ticket_severity,
    ticket.updated_at as ticket_updated_at,
    ia.tenant_id,
    ia.target_area,
    area.display_name as target_area_label,
    ia.support_type,
    ia.priority,
    ia.status,
    ia.summary,
    ia.context,
    ia.requested_by_user_id,
    requester.full_name as requested_by_user_name,
    ia.assigned_area_user_id,
    assignee.full_name as assigned_area_user_name,
    lu.last_update_kind,
    lu.last_update_summary,
    lu.last_update_at,
    ia.returned_to_support_at,
    ia.created_at,
    ia.updated_at
  from public.internal_actions as ia
  join public.tickets as ticket
    on ticket.id = ia.ticket_id
   and ticket.tenant_id = ia.tenant_id
  join public.internal_action_target_areas as area
    on area.area_key = ia.target_area
  left join public.profiles as requester
    on requester.id = ia.requested_by_user_id
  left join public.profiles as assignee
    on assignee.id = ia.assigned_area_user_id
  left join latest_update as lu
    on lu.internal_action_id = ia.id
  where app_private.can_access_internal_action_area(ia.tenant_id, ia.target_area);

revoke all on public.vw_support_ticket_internal_actions from public, anon, authenticated, service_role;
revoke all on public.vw_support_internal_action_detail from public, anon, authenticated, service_role;
revoke all on public.vw_support_internal_action_timeline from public, anon, authenticated, service_role;
revoke all on public.vw_internal_action_queue_by_area from public, anon, authenticated, service_role;

grant select on public.vw_support_ticket_internal_actions to authenticated, service_role;
grant select on public.vw_support_internal_action_detail to authenticated, service_role;
grant select on public.vw_support_internal_action_timeline to authenticated, service_role;
grant select on public.vw_internal_action_queue_by_area to authenticated, service_role;

revoke all on function app_private.ensure_internal_area_membership_integrity() from public, anon, authenticated, service_role;
revoke all on function app_private.has_active_internal_area_membership(uuid, uuid, text, public.internal_area_membership_role[]) from public, anon, authenticated, service_role;
revoke all on function app_private.can_access_support_internal_actions(uuid) from public, anon, authenticated, service_role;
revoke all on function app_private.can_access_internal_action_area(uuid, text) from public, anon, authenticated, service_role;
revoke all on function app_private.can_manage_internal_action_area_assignment(uuid, text) from public, anon, authenticated, service_role;
revoke all on function app_private.can_support_access_internal_action_ticket(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function app_private.internal_action_status_transition_allowed(public.internal_action_status, public.internal_action_status) from public, anon, authenticated, service_role;
revoke all on function app_private.create_internal_action_update(uuid, uuid, uuid, public.internal_action_update_kind, text, public.internal_action_status, public.internal_action_status, jsonb) from public, anon, authenticated, service_role;
revoke all on function app_private.create_internal_action_ticket_event(uuid, public.ticket_event_type, uuid, jsonb) from public, anon, authenticated, service_role;
revoke all on function app_private.prevent_internal_action_append_only_mutation() from public, anon, authenticated, service_role;

grant execute on function app_private.has_active_internal_area_membership(uuid, uuid, text, public.internal_area_membership_role[]) to authenticated, service_role;
grant execute on function app_private.can_access_support_internal_actions(uuid) to authenticated, service_role;
grant execute on function app_private.can_access_internal_action_area(uuid, text) to authenticated, service_role;
grant execute on function app_private.can_manage_internal_action_area_assignment(uuid, text) to authenticated, service_role;
grant execute on function app_private.can_support_access_internal_action_ticket(uuid, uuid) to authenticated, service_role;
grant execute on function app_private.internal_action_status_transition_allowed(public.internal_action_status, public.internal_action_status) to authenticated, service_role;

revoke all on function public.rpc_support_create_internal_action(uuid, text, public.internal_action_support_type, public.ticket_priority, text, text, uuid[], uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_internal_action_assign(uuid, uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_internal_action_add_comment(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_internal_action_update_status(uuid, uuid, public.internal_action_status, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_internal_action_add_evidence_link(uuid, uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_internal_action_return_to_support(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_support_accept_internal_action_return(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_support_request_internal_action_followup(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_support_close_internal_action(uuid, uuid, text) from public, anon, authenticated, service_role;

grant execute on function public.rpc_support_create_internal_action(uuid, text, public.internal_action_support_type, public.ticket_priority, text, text, uuid[], uuid) to authenticated, service_role;
grant execute on function public.rpc_internal_action_assign(uuid, uuid, uuid) to authenticated, service_role;
grant execute on function public.rpc_internal_action_add_comment(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.rpc_internal_action_update_status(uuid, uuid, public.internal_action_status, text) to authenticated, service_role;
grant execute on function public.rpc_internal_action_add_evidence_link(uuid, uuid, uuid, text) to authenticated, service_role;
grant execute on function public.rpc_internal_action_return_to_support(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.rpc_support_accept_internal_action_return(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.rpc_support_request_internal_action_followup(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.rpc_support_close_internal_action(uuid, uuid, text) to authenticated, service_role;

comment on table public.internal_action_target_areas is
  'Catalogo governado de areas internas que podem receber acionamentos vinculados a tickets.';

comment on table public.internal_area_memberships is
  'Membership explicito por tenant e area interna, separado dos roles globais e dos tenant_roles customer-facing.';

comment on table public.internal_actions is
  'Subfluxo interno ticket-centrico para apoio entre areas, sem alterar o status publico do ticket principal no V1.';

comment on table public.internal_action_updates is
  'Ledger append-only de comentarios, atribuicoes, transicoes e retornos de acionamentos internos.';

comment on table public.internal_action_evidence_links is
  'Vinculo entre acionamento interno e evidencias ja existentes no ticket, sem duplicar storage ou expor path interno.';

comment on view public.vw_support_ticket_internal_actions is
  'Read model do suporte para listar acionamentos internos vinculados a um ticket com ultimo update e retorno pendente.';

comment on view public.vw_support_internal_action_detail is
  'Read model do suporte para detalhe completo de um acionamento interno, sem conversa do ticket nem payload sensivel em excesso.';

comment on view public.vw_support_internal_action_timeline is
  'Timeline interna do acionamento para o suporte, derivada do ledger append-only de updates.';

comment on view public.vw_internal_action_queue_by_area is
  'Fila contratual por area interna, restrita por membership explicito e sem expor conversa completa do ticket.';

comment on function public.rpc_support_create_internal_action(uuid, text, public.internal_action_support_type, public.ticket_priority, text, text, uuid[], uuid) is
  'Cria acionamento interno ticket-centrico sem alterar o status do ticket principal e registra ledger, evento interno e audit trail.';

comment on function public.rpc_internal_action_assign(uuid, uuid, uuid) is
  'Atribui responsavel da area a um acionamento interno, mantendo o ticket principal fora do escopo de ownership da area.';

comment on function public.rpc_internal_action_add_comment(uuid, uuid, text) is
  'Registra comentario interno no ledger do acionamento sem expor conteudo ao portal cliente.';

comment on function public.rpc_internal_action_update_status(uuid, uuid, public.internal_action_status, text) is
  'Atualiza status operacional do acionamento interno no contexto da area, sem alterar ticket.status no V1.';

comment on function public.rpc_internal_action_add_evidence_link(uuid, uuid, uuid, text) is
  'Vincula evidencia ja existente do ticket ao acionamento interno, sem duplicar arquivo nem expor bucket/path.';

comment on function public.rpc_internal_action_return_to_support(uuid, uuid, text) is
  'Devolve o acionamento ao suporte com retorno estruturado, sem encerrar o ticket principal.';

comment on function public.rpc_support_accept_internal_action_return(uuid, uuid, text) is
  'Permite ao suporte aceitar o retorno da area e retomar a pendencia interna sem fechar o ticket principal.';

comment on function public.rpc_support_request_internal_action_followup(uuid, uuid, text) is
  'Permite ao suporte devolver o acionamento para complemento da area sem alterar ticket.status.';

comment on function public.rpc_support_close_internal_action(uuid, uuid, text) is
  'Permite ao suporte encerrar o acionamento interno de forma independente do encerramento do ticket principal.';
