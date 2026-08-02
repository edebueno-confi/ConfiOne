-- DASHBOARD-RUNTIME-SERVICE-READ-MODEL-ACCESS-V4
-- Read models concedidos a serviços internos continuam protegidos contra anon.

create or replace function app_private.can_read_analytics()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_internal_service_request()
    or exists (
      select 1
      from public.profiles p
      join public.user_global_roles r on r.user_id = p.id
      where p.id = auth.uid()
        and p.is_active = true
        and r.role in ('platform_admin'::public.platform_role, 'dashboard_viewer'::public.platform_role)
    );
$$;

comment on function app_private.can_read_analytics() is
  'Leitura de Analytics para platform_admin/dashboard_viewer ou serviço interno autenticado; anon permanece bloqueado.';
