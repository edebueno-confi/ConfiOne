create or replace function public.rpc_admin_update_profile_display_name(
  p_user_id uuid,
  p_full_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_full_name text := nullif(btrim(p_full_name), '');
begin
  v_actor_user_id := app_private.require_active_actor();
  perform app_private.require_internal_capability('access.users.manage');

  if p_user_id is null or v_full_name is null then
    raise exception 'profile display name is required';
  end if;

  update public.profiles
  set full_name = v_full_name,
      updated_by_user_id = v_actor_user_id,
      updated_at = timezone('utc', now())
  where id = p_user_id
    and is_active;

  if not found then
    raise exception 'active profile not found';
  end if;

  return jsonb_build_object(
    'user_id', p_user_id,
    'full_name', v_full_name
  );
end;
$$;

revoke all on function public.rpc_admin_update_profile_display_name(uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function public.rpc_admin_update_profile_display_name(uuid, text)
  to authenticated, service_role;

comment on function public.rpc_admin_update_profile_display_name(uuid, text) is
  'Atualiza somente o nome exibido de um perfil ativo por comando administrativo auditável.';
