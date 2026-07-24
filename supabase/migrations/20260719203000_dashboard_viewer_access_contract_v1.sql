-- Contrato de leitura e seed seguro do acesso restrito.

create or replace function app_private.can_read_analytics()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select app_private.has_global_role('platform_admin'::public.platform_role)
    or app_private.has_global_role('dashboard_viewer'::public.platform_role);
$$;

comment on function app_private.can_read_analytics() is
  'Gate de leitura do Dashboard Gerencial para platform_admin e dashboard_viewer; escrita permanece administrativa ou service_role.';

insert into public.user_global_roles (user_id, role)
select p.id, 'dashboard_viewer'::public.platform_role
from public.profiles p
where lower(p.email::text) = 'mauricio.baum@confi.com.vc'
on conflict (user_id, role) do nothing;
