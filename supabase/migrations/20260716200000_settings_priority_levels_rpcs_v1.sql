-- RPCs administrativas para gerir Niveis de prioridade pela tela de Configuracoes.

create or replace function public.rpc_admin_create_priority_level(
  p_key text,
  p_label text,
  p_weight integer default 0,
  p_color_token text default null,
  p_sort_order integer default 0
)
returns public.priority_levels
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_row public.priority_levels;
begin
  v_actor := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_create_priority_level denied';
  end if;

  insert into public.priority_levels (key, label, weight, color_token, sort_order)
  values (
    lower(btrim(p_key)),
    btrim(p_label),
    coalesce(p_weight, 0),
    nullif(btrim(coalesce(p_color_token, '')), ''),
    coalesce(p_sort_order, 0)
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.rpc_admin_update_priority_level(
  p_id uuid,
  p_label text default null,
  p_weight integer default null,
  p_color_token text default null,
  p_sort_order integer default null,
  p_is_active boolean default null
)
returns public.priority_levels
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_row public.priority_levels;
begin
  v_actor := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_update_priority_level denied';
  end if;

  update public.priority_levels
  set
    label = coalesce(nullif(btrim(coalesce(p_label, '')), ''), label),
    weight = coalesce(p_weight, weight),
    color_token = coalesce(nullif(btrim(coalesce(p_color_token, '')), ''), color_token),
    sort_order = coalesce(p_sort_order, sort_order),
    is_active = coalesce(p_is_active, is_active)
  where id = p_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'rpc_admin_update_priority_level not found';
  end if;

  return v_row;
end;
$$;

create or replace function public.rpc_admin_archive_priority_level(
  p_id uuid
)
returns public.priority_levels
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_row public.priority_levels;
begin
  v_actor := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_archive_priority_level denied';
  end if;

  update public.priority_levels
  set is_active = false
  where id = p_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'rpc_admin_archive_priority_level not found';
  end if;

  return v_row;
end;
$$;

grant execute on function public.rpc_admin_create_priority_level(text, text, integer, text, integer) to authenticated;
grant execute on function public.rpc_admin_update_priority_level(uuid, text, integer, text, integer, boolean) to authenticated;
grant execute on function public.rpc_admin_archive_priority_level(uuid) to authenticated;
