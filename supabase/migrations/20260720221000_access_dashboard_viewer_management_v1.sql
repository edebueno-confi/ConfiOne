-- Integra o recorte dashboard_viewer ao control plane de Acessos.
-- O primeiro papel administrável por esta superfície é deliberadamente
-- limitado ao Dashboard/Portal/Knowledge/Integrações.
create or replace function public.rpc_admin_set_global_role(
  p_user_id uuid,
  p_role public.platform_role,
  p_is_enabled boolean
)
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
     or p_user_id is null
     or p_role is distinct from 'dashboard_viewer'::public.platform_role then
    raise exception 'rpc_admin_set_global_role denied' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.profiles as p
    where p.id = p_user_id
      and p.is_active
  ) then
    raise exception 'perfil alvo inexistente ou inativo' using errcode = '22023';
  end if;

  if coalesce(p_is_enabled, false) then
    insert into public.user_global_roles (
      user_id,
      role,
      created_by_user_id,
      updated_by_user_id
    )
    values (p_user_id, p_role, v_actor, v_actor)
    on conflict (user_id, role) do update set
      updated_by_user_id = v_actor,
      updated_at = timezone('utc', now())
    returning * into v_saved;

    return jsonb_build_object(
      'user_id', v_saved.user_id,
      'role', v_saved.role,
      'enabled', true,
      'updated_at', v_saved.updated_at
    );
  end if;

  delete from public.user_global_roles
  where user_id = p_user_id
    and role = p_role;

  return jsonb_build_object(
    'user_id', p_user_id,
    'role', p_role,
    'enabled', false,
    'updated_at', timezone('utc', now())
  );
end;
$$;

revoke all on function public.rpc_admin_set_global_role(uuid, public.platform_role, boolean)
from public, anon, authenticated;
grant execute on function public.rpc_admin_set_global_role(uuid, public.platform_role, boolean)
to authenticated, service_role;

comment on function public.rpc_admin_set_global_role(uuid, public.platform_role, boolean) is
  'Control plane de Acessos para conceder/remover o perfil dashboard_viewer; não é um gravador genérico de papéis globais.';
