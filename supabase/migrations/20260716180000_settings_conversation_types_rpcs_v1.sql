-- RPCs administrativas para gerir Tipos de conversa pela tela de Configuracoes.
-- SECURITY DEFINER + checagem platform_admin. Auditoria via trigger ja existente na tabela.

create or replace function public.rpc_admin_create_conversation_type(
  p_key text,
  p_label text,
  p_description text default null,
  p_default_area_key text default null,
  p_sort_order integer default 0
)
returns public.conversation_types
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_row public.conversation_types;
begin
  v_actor := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_create_conversation_type denied';
  end if;

  insert into public.conversation_types (key, label, description, default_area_key, sort_order)
  values (
    lower(btrim(p_key)),
    btrim(p_label),
    nullif(btrim(coalesce(p_description, '')), ''),
    nullif(btrim(coalesce(p_default_area_key, '')), ''),
    coalesce(p_sort_order, 0)
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.rpc_admin_update_conversation_type(
  p_id uuid,
  p_label text default null,
  p_description text default null,
  p_default_area_key text default null,
  p_sort_order integer default null,
  p_is_active boolean default null
)
returns public.conversation_types
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_row public.conversation_types;
begin
  v_actor := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_update_conversation_type denied';
  end if;

  update public.conversation_types
  set
    label = coalesce(nullif(btrim(coalesce(p_label, '')), ''), label),
    description = coalesce(nullif(btrim(coalesce(p_description, '')), ''), description),
    default_area_key = coalesce(nullif(btrim(coalesce(p_default_area_key, '')), ''), default_area_key),
    sort_order = coalesce(p_sort_order, sort_order),
    is_active = coalesce(p_is_active, is_active)
  where id = p_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'rpc_admin_update_conversation_type not found';
  end if;

  return v_row;
end;
$$;

create or replace function public.rpc_admin_archive_conversation_type(
  p_id uuid
)
returns public.conversation_types
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_row public.conversation_types;
begin
  v_actor := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_archive_conversation_type denied';
  end if;

  update public.conversation_types
  set is_active = false
  where id = p_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'rpc_admin_archive_conversation_type not found';
  end if;

  return v_row;
end;
$$;

grant execute on function public.rpc_admin_create_conversation_type(text, text, text, text, integer) to authenticated;
grant execute on function public.rpc_admin_update_conversation_type(uuid, text, text, text, integer, boolean) to authenticated;
grant execute on function public.rpc_admin_archive_conversation_type(uuid) to authenticated;
