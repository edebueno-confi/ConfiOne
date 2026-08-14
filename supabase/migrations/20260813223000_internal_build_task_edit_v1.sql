create or replace function public.rpc_internal_build_task_edit(
  p_task_id uuid,
  p_title text,
  p_description text,
  p_priority public.internal_build_task_priority,
  p_area text default null,
  p_related_document_slugs text[] default null
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
    raise exception 'rpc_internal_build_task_edit denied';
  end if;

  if nullif(btrim(p_title), '') is null then
    raise exception 'internal build task title is required';
  end if;

  if nullif(btrim(p_description), '') is null then
    raise exception 'internal build task description is required';
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

  if v_task.status = 'cancelled' then
    raise exception 'cancelled internal build task cannot be edited';
  end if;

  update public.internal_build_tasks
  set title = btrim(p_title),
      description = btrim(p_description),
      priority = coalesce(p_priority, priority),
      area = nullif(btrim(p_area), ''),
      related_document_slugs = coalesce(p_related_document_slugs, related_document_slugs),
      updated_by_user_id = v_actor_user_id
  where id = v_task.id
  returning * into v_task;

  return v_task;
end;
$$;

revoke all on function public.rpc_internal_build_task_edit(uuid, text, text, public.internal_build_task_priority, text, text[]) from public, anon, authenticated, service_role;
grant execute on function public.rpc_internal_build_task_edit(uuid, text, text, public.internal_build_task_priority, text, text[]) to authenticated, service_role;

comment on function public.rpc_internal_build_task_edit(uuid, text, text, public.internal_build_task_priority, text, text[]) is
  'Edita os metadados de um card do Painel de Desenvolvimento com permissao, escopo e auditoria.';
