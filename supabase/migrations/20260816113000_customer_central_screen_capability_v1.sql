-- Completa a ativacao da Central de Clientes no control plane de telas.

insert into public.internal_capabilities (capability_key, display_name, domain)
values ('screen.tenants.view', 'Abrir Central de Clientes', 'workspace')
on conflict (capability_key) do update
set display_name = excluded.display_name,
    domain = excluded.domain,
    is_active = true;

insert into public.internal_screen_capability_requirements (screen_key, capability_key)
values ('tenants', 'screen.tenants.view')
on conflict (screen_key, capability_key) do nothing;

insert into public.internal_role_capability_grants (role, capability_key)
values ('platform_admin'::public.platform_role, 'screen.tenants.view')
on conflict (role, capability_key) do nothing;
