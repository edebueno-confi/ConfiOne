-- Promocao explicita e auditavel para o perfil global mais elevado.
create or replace function public.rpc_admin_promote_platform_admin(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app_private.require_active_actor();
  v_saved public.user_global_roles;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role)
     or p_user_id is null then
    raise exception 'platform admin promotion denied' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_user_id and p.is_active) then
    raise exception 'perfil alvo inexistente ou inativo' using errcode = '22023';
  end if;

  insert into public.user_global_roles (user_id, role, is_enabled, created_by_user_id, updated_by_user_id)
  values (p_user_id, 'platform_admin'::public.platform_role, true, v_actor, v_actor)
  on conflict (user_id, role) do update
    set is_enabled = true, updated_by_user_id = v_actor, updated_at = now()
  returning * into v_saved;

  return jsonb_build_object('user_id', v_saved.user_id, 'role', v_saved.role, 'enabled', v_saved.is_enabled, 'updated_at', v_saved.updated_at);
end;
$$;

revoke all on function public.rpc_admin_promote_platform_admin(uuid) from public, anon, authenticated;
grant execute on function public.rpc_admin_promote_platform_admin(uuid) to authenticated, service_role;
