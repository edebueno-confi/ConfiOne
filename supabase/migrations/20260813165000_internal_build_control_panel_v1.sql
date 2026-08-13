create type public.internal_build_task_status as enum (
  'backlog',
  'in_progress',
  'blocked',
  'done',
  'cancelled'
);

create type public.internal_build_task_priority as enum (
  'low',
  'normal',
  'high'
);

create table public.internal_build_tasks (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_key text not null default 'confi_one_development',
  title text not null,
  description text not null,
  status public.internal_build_task_status not null default 'backlog',
  priority public.internal_build_task_priority not null default 'normal',
  area text,
  outcome text,
  validation_summary text,
  blocked_reason text,
  related_document_slugs text[] not null default '{}'::text[],
  assigned_to_user_id uuid references public.profiles (id) on delete set null,
  created_by_user_id uuid not null references public.profiles (id),
  updated_by_user_id uuid references public.profiles (id),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint internal_build_tasks_workspace_key_check
    check (workspace_key = 'confi_one_development'),
  constraint internal_build_tasks_title_not_blank_check
    check (nullif(btrim(title), '') is not null),
  constraint internal_build_tasks_description_not_blank_check
    check (nullif(btrim(description), '') is not null),
  constraint internal_build_tasks_area_not_blank_check
    check (area is null or nullif(btrim(area), '') is not null),
  constraint internal_build_tasks_done_evidence_check
    check (
      status <> 'done'
      or (
        nullif(btrim(outcome), '') is not null
        and nullif(btrim(validation_summary), '') is not null
      )
    ),
  constraint internal_build_tasks_blocked_reason_check
    check (
      status <> 'blocked'
      or nullif(btrim(blocked_reason), '') is not null
    )
);

create table public.internal_build_task_updates (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_key text not null default 'confi_one_development',
  task_id uuid not null references public.internal_build_tasks (id) on delete cascade,
  summary text not null,
  next_step text,
  created_by_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  constraint internal_build_task_updates_workspace_key_check
    check (workspace_key = 'confi_one_development'),
  constraint internal_build_task_updates_summary_not_blank_check
    check (nullif(btrim(summary), '') is not null),
  constraint internal_build_task_updates_next_step_not_blank_check
    check (next_step is null or nullif(btrim(next_step), '') is not null)
);

create index internal_build_tasks_board_idx
  on public.internal_build_tasks (workspace_key, status, priority, updated_at desc);

create index internal_build_tasks_assignee_idx
  on public.internal_build_tasks (workspace_key, assigned_to_user_id, updated_at desc);

create index internal_build_task_updates_task_idx
  on public.internal_build_task_updates (task_id, created_at desc);

create or replace function app_private.can_access_internal_build_control()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile_row
    where profile_row.id = auth.uid()
      and profile_row.is_active
      and (
        app_private.has_global_role('platform_admin'::public.platform_role)
        or app_private.has_global_role('engineering_member'::public.platform_role)
        or app_private.has_global_role('engineering_manager'::public.platform_role)
        or app_private.has_internal_capability('screen.product.view')
      )
  );
$$;

create or replace function app_private.internal_build_task_status_allowed(
  current_status public.internal_build_task_status,
  target_status public.internal_build_task_status
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when current_status = target_status then true
    when current_status = 'backlog' then target_status = any(
      array['in_progress', 'blocked', 'cancelled']::public.internal_build_task_status[]
    )
    when current_status = 'in_progress' then target_status = any(
      array['blocked', 'done', 'cancelled']::public.internal_build_task_status[]
    )
    when current_status = 'blocked' then target_status = any(
      array['in_progress', 'cancelled']::public.internal_build_task_status[]
    )
    else false
  end;
$$;

create or replace function app_private.touch_internal_build_task_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger internal_build_tasks_set_updated_at
before update on public.internal_build_tasks
for each row execute function app_private.touch_internal_build_task_updated_at();

create trigger internal_build_tasks_audit_row_change
after insert or update or delete on public.internal_build_tasks
for each row execute function audit.capture_row_change();

create trigger internal_build_task_updates_audit_row_change
after insert or update or delete on public.internal_build_task_updates
for each row execute function audit.capture_row_change();

alter table public.internal_build_tasks enable row level security;
alter table public.internal_build_task_updates enable row level security;

revoke all on public.internal_build_tasks from public, anon, authenticated, service_role;
revoke all on public.internal_build_task_updates from public, anon, authenticated, service_role;

grant select on public.internal_build_tasks to service_role;
grant select on public.internal_build_task_updates to service_role;

create policy internal_build_tasks_service_role_all
on public.internal_build_tasks
for all
to service_role
using (true)
with check (true);

create policy internal_build_task_updates_service_role_all
on public.internal_build_task_updates
for all
to service_role
using (true)
with check (true);

create or replace function public.rpc_internal_build_task_create(
  p_title text,
  p_description text,
  p_priority public.internal_build_task_priority default 'normal',
  p_area text default null,
  p_related_document_slugs text[] default '{}'::text[]
)
returns public.internal_build_tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := app_private.require_active_actor();
  v_task public.internal_build_tasks;
begin
  if not app_private.can_access_internal_build_control() then
    raise exception 'rpc_internal_build_task_create denied';
  end if;

  insert into public.internal_build_tasks (
    title,
    description,
    priority,
    area,
    related_document_slugs,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    btrim(p_title),
    btrim(p_description),
    coalesce(p_priority, 'normal'::public.internal_build_task_priority),
    nullif(btrim(p_area), ''),
    coalesce(p_related_document_slugs, '{}'::text[]),
    v_actor_user_id,
    v_actor_user_id
  )
  returning * into v_task;

  return v_task;
end;
$$;

create or replace function public.rpc_internal_build_task_claim(
  p_task_id uuid
)
returns public.internal_build_tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := app_private.require_active_actor();
  v_task public.internal_build_tasks;
begin
  if not app_private.can_access_internal_build_control() then
    raise exception 'rpc_internal_build_task_claim denied';
  end if;

  select *
  into v_task
  from public.internal_build_tasks
  where id = p_task_id
    and workspace_key = 'confi_one_development'
  for update;

  if v_task.id is null then
    raise exception 'internal build task not found';
  end if;

  if v_task.status in ('done', 'cancelled') then
    raise exception 'internal build task is closed';
  end if;

  if v_task.assigned_to_user_id is not null
     and v_task.assigned_to_user_id <> v_actor_user_id then
    raise exception 'internal build task is already assigned';
  end if;

  update public.internal_build_tasks
  set assigned_to_user_id = v_actor_user_id,
      status = 'in_progress',
      started_at = coalesce(started_at, timezone('utc', now())),
      updated_by_user_id = v_actor_user_id
  where id = v_task.id
  returning * into v_task;

  return v_task;
end;
$$;

create or replace function public.rpc_internal_build_task_update(
  p_task_id uuid,
  p_status public.internal_build_task_status,
  p_outcome text default null,
  p_validation_summary text default null,
  p_blocked_reason text default null,
  p_related_document_slugs text[] default null
)
returns public.internal_build_tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := app_private.require_active_actor();
  v_current public.internal_build_tasks;
  v_task public.internal_build_tasks;
begin
  if not app_private.can_access_internal_build_control() then
    raise exception 'rpc_internal_build_task_update denied';
  end if;

  select *
  into v_current
  from public.internal_build_tasks
  where id = p_task_id
    and workspace_key = 'confi_one_development'
  for update;

  if v_current.id is null then
    raise exception 'internal build task not found';
  end if;

  if not app_private.internal_build_task_status_allowed(v_current.status, p_status) then
    raise exception 'internal build task status transition denied';
  end if;

  if p_status = 'done'
     and (nullif(btrim(p_outcome), '') is null or nullif(btrim(p_validation_summary), '') is null) then
    raise exception 'done task requires outcome and validation';
  end if;

  if p_status = 'blocked' and nullif(btrim(p_blocked_reason), '') is null then
    raise exception 'blocked task requires blocked reason';
  end if;

  update public.internal_build_tasks
  set status = p_status,
      outcome = coalesce(nullif(btrim(p_outcome), ''), outcome),
      validation_summary = coalesce(nullif(btrim(p_validation_summary), ''), validation_summary),
      blocked_reason = case
        when p_status = 'blocked' then nullif(btrim(p_blocked_reason), '')
        when p_status <> 'blocked' then null
        else blocked_reason
      end,
      related_document_slugs = coalesce(p_related_document_slugs, related_document_slugs),
      started_at = case
        when p_status = 'in_progress' then coalesce(started_at, timezone('utc', now()))
        else started_at
      end,
      completed_at = case
        when p_status = 'done' then timezone('utc', now())
        when p_status <> 'done' then null
        else completed_at
      end,
      updated_by_user_id = v_actor_user_id
  where id = v_current.id
  returning * into v_task;

  return v_task;
end;
$$;

create or replace function public.rpc_internal_build_task_add_update(
  p_task_id uuid,
  p_summary text,
  p_next_step text default null
)
returns public.internal_build_task_updates
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := app_private.require_active_actor();
  v_update public.internal_build_task_updates;
begin
  if not app_private.can_access_internal_build_control() then
    raise exception 'rpc_internal_build_task_add_update denied';
  end if;

  if not exists (
    select 1
    from public.internal_build_tasks as task_row
    where task_row.id = p_task_id
      and task_row.workspace_key = 'confi_one_development'
  ) then
    raise exception 'internal build task not found';
  end if;

  insert into public.internal_build_task_updates (
    task_id,
    summary,
    next_step,
    created_by_user_id
  )
  values (
    p_task_id,
    btrim(p_summary),
    nullif(btrim(p_next_step), ''),
    v_actor_user_id
  )
  returning * into v_update;

  update public.internal_build_tasks
  set updated_by_user_id = v_actor_user_id
  where id = p_task_id;

  return v_update;
end;
$$;

create or replace view public.vw_internal_build_tasks_board
with (security_barrier = true)
as
  select
    task_row.id as task_id,
    task_row.workspace_key,
    task_row.title,
    task_row.description,
    task_row.status,
    task_row.priority,
    task_row.area,
    task_row.outcome,
    task_row.validation_summary,
    task_row.blocked_reason,
    task_row.related_document_slugs,
    task_row.assigned_to_user_id,
    assigned_profile.full_name as assigned_to_full_name,
    task_row.created_by_user_id,
    created_profile.full_name as created_by_full_name,
    task_row.updated_by_user_id,
    updated_profile.full_name as updated_by_full_name,
    task_row.started_at,
    task_row.completed_at,
    task_row.created_at,
    task_row.updated_at,
    last_update.summary as last_update_summary,
    last_update.next_step as last_update_next_step,
    last_update.created_at as last_update_at,
    app_private.can_access_internal_build_control() as can_manage
  from public.internal_build_tasks as task_row
  left join public.profiles as assigned_profile on assigned_profile.id = task_row.assigned_to_user_id
  left join public.profiles as created_profile on created_profile.id = task_row.created_by_user_id
  left join public.profiles as updated_profile on updated_profile.id = task_row.updated_by_user_id
  left join lateral (
    select update_row.summary, update_row.next_step, update_row.created_at
    from public.internal_build_task_updates as update_row
    where update_row.task_id = task_row.id
    order by update_row.created_at desc
    limit 1
  ) as last_update on true
  where task_row.workspace_key = 'confi_one_development'
    and app_private.can_access_internal_build_control();

create or replace view public.vw_internal_build_task_updates
with (security_barrier = true)
as
  select
    update_row.id as update_id,
    update_row.workspace_key,
    update_row.task_id,
    update_row.summary,
    update_row.next_step,
    update_row.created_by_user_id,
    profile_row.full_name as created_by_full_name,
    update_row.created_at
  from public.internal_build_task_updates as update_row
  left join public.profiles as profile_row on profile_row.id = update_row.created_by_user_id
  where update_row.workspace_key = 'confi_one_development'
    and app_private.can_access_internal_build_control();

revoke all on function app_private.can_access_internal_build_control() from public, anon, authenticated, service_role;
revoke all on function app_private.internal_build_task_status_allowed(public.internal_build_task_status, public.internal_build_task_status) from public, anon, authenticated, service_role;
revoke all on function app_private.touch_internal_build_task_updated_at() from public, anon, authenticated, service_role;
grant execute on function app_private.can_access_internal_build_control() to authenticated, service_role;

revoke all on public.vw_internal_build_tasks_board from public, anon, authenticated, service_role;
revoke all on public.vw_internal_build_task_updates from public, anon, authenticated, service_role;
grant select on public.vw_internal_build_tasks_board to authenticated, service_role;
grant select on public.vw_internal_build_task_updates to authenticated, service_role;

revoke all on function public.rpc_internal_build_task_create(text, text, public.internal_build_task_priority, text, text[]) from public, anon, authenticated, service_role;
revoke all on function public.rpc_internal_build_task_claim(uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_internal_build_task_update(uuid, public.internal_build_task_status, text, text, text, text[]) from public, anon, authenticated, service_role;
revoke all on function public.rpc_internal_build_task_add_update(uuid, text, text) from public, anon, authenticated, service_role;
grant execute on function public.rpc_internal_build_task_create(text, text, public.internal_build_task_priority, text, text[]) to authenticated, service_role;
grant execute on function public.rpc_internal_build_task_claim(uuid) to authenticated, service_role;
grant execute on function public.rpc_internal_build_task_update(uuid, public.internal_build_task_status, text, text, text, text[]) to authenticated, service_role;
grant execute on function public.rpc_internal_build_task_add_update(uuid, text, text) to authenticated, service_role;

comment on table public.internal_build_tasks is
  'Cards simples do Painel de Desenvolvimento interno do ConfiOne, separados do Engineering Workspace de tickets.';

comment on table public.internal_build_task_updates is
  'Atualizacoes curtas e auditaveis da execucao de cards do Painel de Desenvolvimento.';

comment on view public.vw_internal_build_tasks_board is
  'Read model do board interno simples, restrito a perfis ativos de plataforma ou engenharia.';

comment on view public.vw_internal_build_task_updates is
  'Read model das atualizacoes curtas dos cards do Painel de Desenvolvimento.';
