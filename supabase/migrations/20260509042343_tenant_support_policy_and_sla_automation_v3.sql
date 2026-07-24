create table public.business_calendars (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid references public.tenants (id),
  slug text not null unique,
  name text not null,
  timezone text not null default 'America/Sao_Paulo',
  status public.ticket_reference_status not null default 'active',
  created_by_user_id uuid references public.profiles (id),
  updated_by_user_id uuid references public.profiles (id),
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_calendars_slug_not_blank_check
    check (nullif(btrim(slug), '') is not null),
  constraint business_calendars_name_not_blank_check
    check (nullif(btrim(name), '') is not null),
  constraint business_calendars_timezone_not_blank_check
    check (nullif(btrim(timezone), '') is not null),
  constraint business_calendars_slug_format_check
    check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.business_calendar_weekly_hours (
  id uuid primary key default extensions.gen_random_uuid(),
  business_calendar_id uuid not null references public.business_calendars (id) on delete cascade,
  weekday integer not null,
  opens_at time not null,
  closes_at time not null,
  status public.ticket_reference_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_calendar_weekly_hours_weekday_check
    check (weekday between 0 and 6),
  constraint business_calendar_weekly_hours_range_check
    check (opens_at < closes_at)
);

create table public.business_calendar_holidays (
  id uuid primary key default extensions.gen_random_uuid(),
  business_calendar_id uuid not null references public.business_calendars (id) on delete cascade,
  local_date date not null,
  name text not null,
  is_closed boolean not null default true,
  opens_at time,
  closes_at time,
  status public.ticket_reference_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint business_calendar_holidays_name_not_blank_check
    check (nullif(btrim(name), '') is not null),
  constraint business_calendar_holidays_partial_hours_check
    check (
      (is_closed and opens_at is null and closes_at is null)
      or (
        not is_closed
        and opens_at is not null
        and closes_at is not null
        and opens_at < closes_at
      )
    )
);

create unique index business_calendar_weekly_hours_unique_idx
  on public.business_calendar_weekly_hours (business_calendar_id, weekday, opens_at, closes_at)
  where status = 'active';

create unique index business_calendar_holidays_unique_idx
  on public.business_calendar_holidays (business_calendar_id, local_date)
  where status = 'active';

alter table public.ticket_sla_policies
  add column tenant_id uuid references public.tenants (id),
  add column business_calendar_id uuid references public.business_calendars (id),
  add column archived_at timestamptz;

drop index if exists ticket_sla_policies_match_idx;

create index ticket_sla_policies_match_idx
  on public.ticket_sla_policies (
    status,
    tenant_id,
    category_id,
    priority,
    severity,
    sort_order
  );

create unique index ticket_sla_policies_active_match_unique_idx
  on public.ticket_sla_policies (
    tenant_id,
    category_id,
    priority,
    severity
  )
  nulls not distinct
  where status = 'active';

insert into public.business_calendars (
  slug,
  name,
  timezone,
  status
)
values (
  'continuous-24x7',
  'Calendario continuo 24x7',
  'America/Sao_Paulo',
  'active'
)
on conflict (slug) do update
set
  name = excluded.name,
  timezone = excluded.timezone,
  status = 'active'::public.ticket_reference_status,
  archived_at = null,
  updated_at = timezone('utc', now());

insert into public.business_calendar_weekly_hours (
  business_calendar_id,
  weekday,
  opens_at,
  closes_at,
  status
)
select
  bc.id,
  gs.weekday,
  '00:00'::time,
  '23:59:59'::time,
  'active'::public.ticket_reference_status
from public.business_calendars as bc
cross join generate_series(0, 6) as gs(weekday)
where bc.slug = 'continuous-24x7'
on conflict do nothing;

update public.ticket_sla_policies as p
set
  business_calendar_id = bc.id,
  business_calendar_key = 'continuous-24x7',
  updated_at = timezone('utc', now())
from public.business_calendars as bc
where bc.slug = 'continuous-24x7'
  and p.business_calendar_id is null;

create or replace function app_private.resolve_ticket_sla_policy(
  p_tenant_id uuid,
  p_category_id uuid,
  p_priority public.ticket_priority,
  p_severity public.ticket_severity
)
returns public.ticket_sla_policies
language sql
stable
security definer
set search_path = ''
as $$
  select p.*
  from public.ticket_sla_policies as p
  where p.status = 'active'::public.ticket_reference_status
    and (p.tenant_id is null or p.tenant_id = p_tenant_id)
    and (p.category_id is null or p.category_id = p_category_id)
    and (p.priority is null or p.priority = p_priority)
    and (p.severity is null or p.severity = p_severity)
  order by
    case when p.tenant_id is null then 0 else 1 end desc,
    case when p.category_id is null then 0 else 1 end desc,
    case when p.priority is null then 0 else 1 end desc,
    case when p.severity is null then 0 else 1 end desc,
    p.sort_order asc,
    p.created_at asc
  limit 1;
$$;

create or replace function app_private.resolve_ticket_sla_policy(
  p_category_id uuid,
  p_priority public.ticket_priority,
  p_severity public.ticket_severity
)
returns public.ticket_sla_policies
language sql
stable
security definer
set search_path = ''
as $$
  select *
  from app_private.resolve_ticket_sla_policy(
    null::uuid,
    p_category_id,
    p_priority,
    p_severity
  );
$$;

create or replace function app_private.apply_ticket_sla(
  p_ticket public.tickets,
  p_actor_user_id uuid
)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_policy public.ticket_sla_policies;
  v_ticket public.tickets;
begin
  select *
  into v_policy
  from app_private.resolve_ticket_sla_policy(
    p_ticket.tenant_id,
    p_ticket.category_id,
    p_ticket.priority,
    p_ticket.severity
  );

  update public.tickets
  set
    sla_policy_id = v_policy.id,
    first_response_due_at = case
      when v_policy.id is null then null
      else p_ticket.created_at + make_interval(mins => v_policy.first_response_minutes)
    end,
    resolution_due_at = case
      when v_policy.id is null then null
      else p_ticket.created_at + make_interval(mins => v_policy.resolution_minutes)
    end,
    updated_by_user_id = p_actor_user_id
  where id = p_ticket.id
  returning *
  into v_ticket;

  return v_ticket;
end;
$$;

create or replace function public.rpc_admin_upsert_business_calendar(
  p_business_calendar_id uuid default null,
  p_tenant_id uuid default null,
  p_slug text default null,
  p_name text default null,
  p_timezone text default 'America/Sao_Paulo',
  p_status public.ticket_reference_status default 'active'
)
returns public.business_calendars
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.business_calendars;
  v_calendar public.business_calendars;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_upsert_business_calendar denied';
  end if;

  if p_tenant_id is null then
    raise exception 'tenant_id is required for tenant business calendar';
  end if;

  if not exists (select 1 from public.tenants as t where t.id = p_tenant_id) then
    raise exception 'tenant not found';
  end if;

  if nullif(btrim(coalesce(p_slug, '')), '') is null
     or nullif(btrim(coalesce(p_name, '')), '') is null
     or nullif(btrim(coalesce(p_timezone, '')), '') is null then
    raise exception 'calendar slug, name and timezone are required';
  end if;

  if lower(btrim(p_slug)) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'calendar slug is invalid';
  end if;

  if p_business_calendar_id is not null then
    select *
    into v_existing
    from public.business_calendars as bc
    where bc.id = p_business_calendar_id
    for update;

    if v_existing.id is null then
      raise exception 'business calendar not found';
    end if;

    if v_existing.tenant_id is distinct from p_tenant_id then
      raise exception 'business calendar tenant cannot be changed';
    end if;

    update public.business_calendars
    set
      slug = lower(btrim(p_slug)),
      name = btrim(p_name),
      timezone = btrim(p_timezone),
      status = p_status,
      archived_at = case
        when p_status = 'archived'::public.ticket_reference_status then timezone('utc', now())
        else null
      end,
      updated_by_user_id = v_actor_user_id
    where id = p_business_calendar_id
    returning *
    into v_calendar;
  else
    insert into public.business_calendars (
      tenant_id,
      slug,
      name,
      timezone,
      status,
      created_by_user_id,
      updated_by_user_id
    )
    values (
      p_tenant_id,
      lower(btrim(p_slug)),
      btrim(p_name),
      btrim(p_timezone),
      p_status,
      v_actor_user_id,
      v_actor_user_id
    )
    returning *
    into v_calendar;
  end if;

  return v_calendar;
end;
$$;

create or replace function public.rpc_admin_upsert_ticket_sla_policy(
  p_policy_id uuid default null,
  p_tenant_id uuid default null,
  p_slug text default null,
  p_name text default null,
  p_description text default null,
  p_category_id uuid default null,
  p_priority public.ticket_priority default null,
  p_severity public.ticket_severity default null,
  p_first_response_minutes integer default null,
  p_resolution_minutes integer default null,
  p_business_calendar_id uuid default null,
  p_status public.ticket_reference_status default 'active'
)
returns public.ticket_sla_policies
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.ticket_sla_policies;
  v_calendar public.business_calendars;
  v_policy public.ticket_sla_policies;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_upsert_ticket_sla_policy denied';
  end if;

  if p_tenant_id is null then
    raise exception 'tenant_id is required for tenant SLA policy';
  end if;

  if not exists (select 1 from public.tenants as t where t.id = p_tenant_id) then
    raise exception 'tenant not found';
  end if;

  if p_category_id is not null and not exists (
    select 1
    from public.ticket_categories as tc
    where tc.id = p_category_id
      and tc.status = 'active'::public.ticket_reference_status
  ) then
    raise exception 'ticket category is not active';
  end if;

  if p_first_response_minutes is null
     or p_resolution_minutes is null
     or p_first_response_minutes <= 0
     or p_resolution_minutes < p_first_response_minutes then
    raise exception 'invalid SLA minutes';
  end if;

  if nullif(btrim(coalesce(p_slug, '')), '') is null
     or nullif(btrim(coalesce(p_name, '')), '') is null then
    raise exception 'policy slug and name are required';
  end if;

  if lower(btrim(p_slug)) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'policy slug is invalid';
  end if;

  if p_business_calendar_id is null then
    select *
    into v_calendar
    from public.business_calendars as bc
    where bc.slug = 'continuous-24x7'
      and bc.status = 'active'::public.ticket_reference_status;
  else
    select *
    into v_calendar
    from public.business_calendars as bc
    where bc.id = p_business_calendar_id
      and bc.status = 'active'::public.ticket_reference_status
      and (bc.tenant_id is null or bc.tenant_id = p_tenant_id);
  end if;

  if v_calendar.id is null then
    raise exception 'business calendar is not available for this tenant';
  end if;

  if p_policy_id is not null then
    select *
    into v_existing
    from public.ticket_sla_policies as tsp
    where tsp.id = p_policy_id
    for update;

    if v_existing.id is null then
      raise exception 'ticket SLA policy not found';
    end if;

    if v_existing.tenant_id is distinct from p_tenant_id then
      raise exception 'ticket SLA policy tenant cannot be changed';
    end if;

    update public.ticket_sla_policies
    set
      slug = lower(btrim(p_slug)),
      name = btrim(p_name),
      description = nullif(btrim(coalesce(p_description, '')), ''),
      category_id = p_category_id,
      priority = p_priority,
      severity = p_severity,
      first_response_minutes = p_first_response_minutes,
      resolution_minutes = p_resolution_minutes,
      business_calendar_id = v_calendar.id,
      business_calendar_key = v_calendar.slug,
      status = p_status,
      archived_at = case
        when p_status = 'archived'::public.ticket_reference_status then timezone('utc', now())
        else null
      end,
      updated_by_user_id = v_actor_user_id
    where id = p_policy_id
    returning *
    into v_policy;
  else
    insert into public.ticket_sla_policies (
      tenant_id,
      slug,
      name,
      description,
      category_id,
      priority,
      severity,
      first_response_minutes,
      resolution_minutes,
      business_calendar_id,
      business_calendar_key,
      status,
      created_by_user_id,
      updated_by_user_id
    )
    values (
      p_tenant_id,
      lower(btrim(p_slug)),
      btrim(p_name),
      nullif(btrim(coalesce(p_description, '')), ''),
      p_category_id,
      p_priority,
      p_severity,
      p_first_response_minutes,
      p_resolution_minutes,
      v_calendar.id,
      v_calendar.slug,
      p_status,
      v_actor_user_id,
      v_actor_user_id
    )
    returning *
    into v_policy;
  end if;

  return v_policy;
end;
$$;

create or replace function public.rpc_admin_archive_ticket_sla_policy(
  p_policy_id uuid
)
returns public.ticket_sla_policies
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_policy public.ticket_sla_policies;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_archive_ticket_sla_policy denied';
  end if;

  update public.ticket_sla_policies
  set
    status = 'archived'::public.ticket_reference_status,
    archived_at = timezone('utc', now()),
    updated_by_user_id = v_actor_user_id
  where id = p_policy_id
  returning *
  into v_policy;

  if v_policy.id is null then
    raise exception 'ticket SLA policy not found';
  end if;

  return v_policy;
end;
$$;

create or replace function public.rpc_support_recalculate_ticket_sla(
  p_ticket_id uuid
)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.tickets;
  v_ticket public.tickets;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_existing
  from public.tickets as t
  where t.id = p_ticket_id
  for update;

  if v_existing.id is null then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_manage_ticket(v_existing.tenant_id) then
    raise exception 'rpc_support_recalculate_ticket_sla denied';
  end if;

  v_ticket := app_private.apply_ticket_sla(v_existing, v_actor_user_id);

  if v_ticket.sla_policy_id is distinct from v_existing.sla_policy_id
     or v_ticket.first_response_due_at is distinct from v_existing.first_response_due_at
     or v_ticket.resolution_due_at is distinct from v_existing.resolution_due_at then
    perform app_private.create_ticket_event(
      v_ticket.id,
      v_ticket.tenant_id,
      'sla_updated',
      'internal',
      v_actor_user_id,
      jsonb_build_object(
        'previous_sla_policy_id', v_existing.sla_policy_id,
        'sla_policy_id', v_ticket.sla_policy_id,
        'previous_first_response_due_at', v_existing.first_response_due_at,
        'first_response_due_at', v_ticket.first_response_due_at,
        'previous_resolution_due_at', v_existing.resolution_due_at,
        'resolution_due_at', v_ticket.resolution_due_at
      )
    );
  end if;

  return v_ticket;
end;
$$;

create or replace view public.vw_support_ticket_sla_context
with (security_barrier = true)
as
  select
    t.id as ticket_id,
    t.tenant_id,
    t.sla_policy_id,
    p.name as sla_policy_name,
    p.business_calendar_key as sla_business_calendar_key,
    t.first_response_due_at,
    t.resolution_due_at,
    app_private.ticket_sla_status(t.status, t.resolution_due_at) as sla_status,
    app_private.ticket_sla_status_label(app_private.ticket_sla_status(t.status, t.resolution_due_at)) as sla_status_label,
    (t.sla_policy_id is not null) as is_sla_available,
    case
      when p.id is null then 'Sem politica definida para esta combinacao operacional.'::text
      when p.tenant_id is null then 'Governanca interna por fallback global controlado; nao e promessa publica automatica.'::text
      else 'Governanca interna especifica do tenant; nao e promessa publica automatica.'::text
    end as sla_reference,
    p.tenant_id as sla_policy_tenant_id,
    case
      when p.id is null then 'none'
      when p.tenant_id is null then 'global_fallback'
      else 'tenant'
    end::text as sla_policy_scope,
    bc.name as sla_business_calendar_name,
    bc.timezone as sla_business_calendar_timezone
  from public.tickets as t
  left join public.ticket_sla_policies as p
    on p.id = t.sla_policy_id
  left join public.business_calendars as bc
    on bc.id = p.business_calendar_id
  where app_private.can_access_support_workspace(t.tenant_id);

create or replace view public.vw_support_tickets_queue
with (security_barrier = true)
as
  with support_visible as (
    select
      q.*
    from public.vw_tickets_list as q
    where app_private.can_access_support_workspace(q.tenant_id)
  ),
  sla_context as (
    select *
    from public.vw_support_ticket_sla_context
  )
  select
    q.id,
    q.tenant_id,
    t.slug as tenant_slug,
    t.display_name as tenant_display_name,
    t.legal_name as tenant_legal_name,
    q.requester_contact_id,
    requester.full_name as requester_contact_full_name,
    requester.email as requester_contact_email,
    q.title,
    q.source,
    q.status,
    q.priority,
    q.severity,
    q.created_by_user_id,
    q.created_by_full_name,
    q.assigned_to_user_id,
    q.assigned_to_full_name,
    q.created_at,
    q.updated_at,
    q.resolved_at,
    q.closed_at,
    q.last_message_at,
    q.customer_message_count,
    q.internal_message_count,
    q.can_view_internal,
    q.can_add_message,
    q.can_update_status,
    q.can_add_internal_note,
    q.can_assign,
    q.can_close,
    q.can_reopen,
    (q.assigned_to_user_id is null) as is_unassigned,
    (q.status = 'waiting_customer') as is_waiting_customer,
    (q.status = 'waiting_support') as is_waiting_support,
    (q.status = 'waiting_engineering') as is_waiting_engineering,
    tk.category_id,
    category.slug as category_slug,
    category.name as category_name,
    category.description as category_description,
    tk.current_operational_reason_id,
    reason.name as current_operational_reason_name,
    sla.sla_policy_id,
    sla.sla_policy_name,
    sla.first_response_due_at,
    sla.resolution_due_at,
    sla.sla_status,
    sla.sla_status_label,
    sla.is_sla_available,
    sla.sla_reference,
    sla.sla_policy_scope,
    sla.sla_business_calendar_name,
    sla.sla_business_calendar_timezone
  from support_visible as q
  join public.tickets as tk
    on tk.id = q.id
   and tk.tenant_id = q.tenant_id
  join public.tenants as t
    on t.id = q.tenant_id
  left join public.tenant_contacts as requester
    on requester.id = q.requester_contact_id
   and requester.tenant_id = q.tenant_id
  left join public.ticket_categories as category
    on category.id = tk.category_id
  left join public.ticket_operational_reasons as reason
    on reason.id = tk.current_operational_reason_id
  left join sla_context as sla
    on sla.ticket_id = q.id;

create or replace view public.vw_support_ticket_detail
with (security_barrier = true)
as
  with support_visible as (
    select
      d.*
    from public.vw_ticket_detail as d
    where app_private.can_access_support_workspace(d.tenant_id)
  ),
  sla_context as (
    select *
    from public.vw_support_ticket_sla_context
  )
  select
    d.id,
    d.tenant_id,
    t.slug as tenant_slug,
    t.display_name as tenant_display_name,
    t.legal_name as tenant_legal_name,
    t.status as tenant_status,
    d.requester_contact_id,
    d.requester_contact_full_name,
    d.requester_contact_email,
    d.title,
    d.description,
    d.source,
    d.status,
    d.priority,
    d.severity,
    d.close_reason,
    d.created_by_user_id,
    d.created_by_full_name,
    d.assigned_to_user_id,
    d.assigned_to_full_name,
    d.created_at,
    d.updated_at,
    d.resolved_at,
    d.closed_at,
    d.last_message_at,
    d.customer_message_count,
    d.internal_message_count,
    d.customer_attachment_count,
    d.internal_attachment_count,
    d.can_view_internal,
    d.can_add_message,
    d.can_update_status,
    d.can_add_internal_note,
    d.can_assign,
    d.can_close,
    d.can_reopen,
    tk.category_id,
    category.slug as category_slug,
    category.name as category_name,
    category.description as category_description,
    tk.initial_operational_reason_id,
    initial_reason.name as initial_operational_reason_name,
    tk.current_operational_reason_id,
    current_reason.name as current_operational_reason_name,
    sla.sla_policy_id,
    sla.sla_policy_name,
    sla.sla_business_calendar_key,
    sla.first_response_due_at,
    sla.resolution_due_at,
    sla.sla_status,
    sla.sla_status_label,
    sla.is_sla_available,
    sla.sla_reference,
    app_private.allowed_next_ticket_statuses(d.status) as allowed_next_statuses,
    sla.sla_policy_scope,
    sla.sla_business_calendar_name,
    sla.sla_business_calendar_timezone
  from support_visible as d
  join public.tickets as tk
    on tk.id = d.id
   and tk.tenant_id = d.tenant_id
  join public.tenants as t
    on t.id = d.tenant_id
  left join public.ticket_categories as category
    on category.id = tk.category_id
  left join public.ticket_operational_reasons as initial_reason
    on initial_reason.id = tk.initial_operational_reason_id
  left join public.ticket_operational_reasons as current_reason
    on current_reason.id = tk.current_operational_reason_id
  left join sla_context as sla
    on sla.ticket_id = d.id;

create or replace view public.vw_admin_ticket_sla_policies
with (security_barrier = true)
as
  select
    p.id,
    p.tenant_id,
    t.slug as tenant_slug,
    t.display_name as tenant_display_name,
    p.slug,
    p.name,
    p.description,
    p.category_id,
    c.name as category_name,
    p.priority,
    p.severity,
    p.first_response_minutes,
    p.resolution_minutes,
    p.business_calendar_id,
    bc.name as business_calendar_name,
    bc.timezone as business_calendar_timezone,
    p.status,
    p.archived_at,
    p.created_by_user_id,
    p.updated_by_user_id,
    p.created_at,
    p.updated_at
  from public.ticket_sla_policies as p
  left join public.tenants as t
    on t.id = p.tenant_id
  left join public.ticket_categories as c
    on c.id = p.category_id
  left join public.business_calendars as bc
    on bc.id = p.business_calendar_id
  where app_private.has_global_role('platform_admin'::public.platform_role);

with recalculated as (
  select
    t.*,
    p.id as policy_id,
    p.first_response_minutes,
    p.resolution_minutes
  from public.tickets as t
  left join lateral app_private.resolve_ticket_sla_policy(
    t.tenant_id,
    t.category_id,
    t.priority,
    t.severity
  ) as p
    on true
)
update public.tickets as t
set
  sla_policy_id = r.policy_id,
  first_response_due_at = case
    when r.policy_id is null then null
    else r.created_at + make_interval(mins => r.first_response_minutes)
  end,
  resolution_due_at = case
    when r.policy_id is null then null
    else r.created_at + make_interval(mins => r.resolution_minutes)
  end
from recalculated as r
where r.id = t.id;

create trigger business_calendars_set_updated_at
before update on public.business_calendars
for each row
execute function app_private.touch_updated_at();

create trigger business_calendar_weekly_hours_set_updated_at
before update on public.business_calendar_weekly_hours
for each row
execute function app_private.touch_updated_at();

create trigger business_calendar_holidays_set_updated_at
before update on public.business_calendar_holidays
for each row
execute function app_private.touch_updated_at();

create trigger business_calendars_audit_row_change
after insert or update or delete on public.business_calendars
for each row
execute function audit.capture_row_change();

create trigger business_calendar_weekly_hours_audit_row_change
after insert or update or delete on public.business_calendar_weekly_hours
for each row
execute function audit.capture_row_change();

create trigger business_calendar_holidays_audit_row_change
after insert or update or delete on public.business_calendar_holidays
for each row
execute function audit.capture_row_change();

grant select on public.business_calendars to service_role;
grant select on public.business_calendar_weekly_hours to service_role;
grant select on public.business_calendar_holidays to service_role;

revoke all on public.business_calendars from authenticated;
revoke all on public.business_calendar_weekly_hours from authenticated;
revoke all on public.business_calendar_holidays from authenticated;

alter table public.business_calendars enable row level security;
alter table public.business_calendar_weekly_hours enable row level security;
alter table public.business_calendar_holidays enable row level security;

create policy business_calendars_select_support_controlled
on public.business_calendars
for select
to authenticated
using (
  app_private.has_global_role('platform_admin'::public.platform_role)
  or app_private.has_any_global_role(
    array['support_agent', 'support_manager']::public.platform_role[]
  )
);

create policy business_calendar_weekly_hours_select_support_controlled
on public.business_calendar_weekly_hours
for select
to authenticated
using (
  exists (
    select 1
    from public.business_calendars as bc
    where bc.id = business_calendar_weekly_hours.business_calendar_id
      and (
        app_private.has_global_role('platform_admin'::public.platform_role)
        or app_private.has_any_global_role(
          array['support_agent', 'support_manager']::public.platform_role[]
        )
      )
  )
);

create policy business_calendar_holidays_select_support_controlled
on public.business_calendar_holidays
for select
to authenticated
using (
  exists (
    select 1
    from public.business_calendars as bc
    where bc.id = business_calendar_holidays.business_calendar_id
      and (
        app_private.has_global_role('platform_admin'::public.platform_role)
        or app_private.has_any_global_role(
          array['support_agent', 'support_manager']::public.platform_role[]
        )
      )
  )
);

revoke all on function app_private.resolve_ticket_sla_policy(uuid, uuid, public.ticket_priority, public.ticket_severity) from public, anon, authenticated, service_role;
revoke all on function app_private.resolve_ticket_sla_policy(uuid, public.ticket_priority, public.ticket_severity) from public, anon, authenticated, service_role;
revoke all on function app_private.apply_ticket_sla(public.tickets, uuid) from public, anon, authenticated, service_role;

grant execute on function app_private.resolve_ticket_sla_policy(uuid, uuid, public.ticket_priority, public.ticket_severity) to service_role;
grant execute on function app_private.resolve_ticket_sla_policy(uuid, public.ticket_priority, public.ticket_severity) to service_role;

revoke all on function public.rpc_admin_upsert_business_calendar(uuid, uuid, text, text, text, public.ticket_reference_status) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_upsert_ticket_sla_policy(uuid, uuid, text, text, text, uuid, public.ticket_priority, public.ticket_severity, integer, integer, uuid, public.ticket_reference_status) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_archive_ticket_sla_policy(uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_support_recalculate_ticket_sla(uuid) from public, anon, authenticated, service_role;

grant execute on function public.rpc_admin_upsert_business_calendar(uuid, uuid, text, text, text, public.ticket_reference_status) to authenticated;
grant execute on function public.rpc_admin_upsert_ticket_sla_policy(uuid, uuid, text, text, text, uuid, public.ticket_priority, public.ticket_severity, integer, integer, uuid, public.ticket_reference_status) to authenticated;
grant execute on function public.rpc_admin_archive_ticket_sla_policy(uuid) to authenticated;
grant execute on function public.rpc_support_recalculate_ticket_sla(uuid) to authenticated;

revoke all on public.vw_support_ticket_sla_context from public, anon, authenticated, service_role;
revoke all on public.vw_support_tickets_queue from public, anon, authenticated, service_role;
revoke all on public.vw_support_ticket_detail from public, anon, authenticated, service_role;
revoke all on public.vw_admin_ticket_sla_policies from public, anon, authenticated, service_role;

grant select on public.vw_support_ticket_sla_context to authenticated, service_role;
grant select on public.vw_support_tickets_queue to authenticated, service_role;
grant select on public.vw_support_ticket_detail to authenticated, service_role;
grant select on public.vw_admin_ticket_sla_policies to authenticated, service_role;

comment on table public.business_calendars is
  'Calendarios de negocio para governanca interna de SLA. O calendario global 24x7 e fallback controlado; calendarios de tenant exigem tenant_id.';
comment on table public.business_calendar_weekly_hours is
  'Horas semanais declaradas para calendario de negocio. O calculo de due_at deste corte continua continuo e documentado.';
comment on table public.business_calendar_holidays is
  'Feriados e excecoes declaradas para calendario de negocio. Nao dispara promessa publica automatica.';
comment on column public.ticket_sla_policies.tenant_id is
  'Tenant especifico da politica. NULL e permitido apenas para fallback global controlado ja existente.';
comment on column public.ticket_sla_policies.business_calendar_id is
  'Calendario aplicado como metadado governado de SLA. O calculo MVP deste corte usa minutos corridos.';
comment on view public.vw_support_ticket_sla_context is
  'Contexto de SLA interno por ticket, com precedencia tenant > global e calendario sanitizado.';
comment on view public.vw_admin_ticket_sla_policies is
  'Read model administrativo seguro para politicas de SLA por tenant.';
comment on function public.rpc_admin_upsert_ticket_sla_policy(uuid, uuid, text, text, text, uuid, public.ticket_priority, public.ticket_severity, integer, integer, uuid, public.ticket_reference_status) is
  'Cria ou atualiza politica de SLA especifica por tenant com auditoria por trigger.';
comment on function public.rpc_support_recalculate_ticket_sla(uuid) is
  'Recalcula SLA de um ticket permitido e gera evento quando a politica/prazos mudam.';
