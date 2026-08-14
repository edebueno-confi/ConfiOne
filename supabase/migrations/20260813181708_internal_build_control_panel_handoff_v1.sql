alter type public.internal_build_task_status
  add value if not exists 'awaiting_agent' after 'backlog';

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
      array['awaiting_agent', 'blocked', 'cancelled']::public.internal_build_task_status[]
    )
    when current_status = 'awaiting_agent' then target_status = any(
      array['in_progress', 'blocked', 'cancelled']::public.internal_build_task_status[]
    )
    when current_status = 'in_progress' then target_status = any(
      array['blocked', 'done', 'cancelled']::public.internal_build_task_status[]
    )
    when current_status = 'blocked' then target_status = any(
      array['awaiting_agent', 'cancelled']::public.internal_build_task_status[]
    )
    else false
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

  if v_task.status <> 'awaiting_agent' then
    raise exception 'internal build task must be awaiting agent';
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

comment on type public.internal_build_task_status is
  'Estados operacionais do Painel de Desenvolvimento; awaiting_agent representa uma entrega explícita para execução.';
