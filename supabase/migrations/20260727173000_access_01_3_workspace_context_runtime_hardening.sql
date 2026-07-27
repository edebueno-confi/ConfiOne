-- ACCESS-01.3: estabiliza a leitura autenticada do workspace interno.
--
-- A view anterior avaliava requisitos de capacidade correlacionados e varias
-- tabelas protegidas por RLS durante a consulta do PostgREST. Em PostgreSQL
-- 17 isso reproduziu uma falha do processo backend, convertida pelo gateway
-- em 503/PGRST001. O read model continua actor-bound e preserva as mesmas
-- regras de grants e capabilities; a avaliacao passa a ocorrer em uma funcao
-- privada security definer, com o RPC como entrada segura do PostgREST.

create or replace function app_private.internal_actor_workspace_context()
returns table (
  actor_user_id uuid,
  tenant_id uuid,
  area_key text,
  area_role public.internal_area_membership_role,
  permission_source text,
  screen_key text,
  display_name text,
  route_path text,
  category public.internal_screen_category,
  sort_order integer
)
language sql
stable
security definer
set search_path = ''
as $function$
  select distinct
    auth.uid() as actor_user_id,
    null::uuid as tenant_id,
    null::text as area_key,
    null::public.internal_area_membership_role as area_role,
    'global_role'::text as permission_source,
    screen.screen_key,
    screen.display_name,
    screen.route_path,
    screen.category,
    screen.sort_order
  from public.profiles as profile
  join public.user_global_roles as role_grant
    on role_grant.user_id = profile.id
  join public.internal_role_screen_grants as screen_grant
    on screen_grant.role = role_grant.role
  join public.internal_screen_catalog as screen
    on screen.screen_key = screen_grant.screen_key
  where profile.id = auth.uid()
    and profile.is_active
    and screen.is_active
    and screen.release_enabled
    and app_private.has_internal_capability(
      coalesce(
        (
          select min(requirement.capability_key)
          from public.internal_screen_capability_requirements as requirement
          where requirement.screen_key = screen.screen_key
        ),
        'screen.' || screen.screen_key || '.view'
      )
    )
  union all
  select distinct
    auth.uid(),
    membership.tenant_id,
    membership.area_key,
    membership.role,
    'area_membership'::text,
    screen.screen_key,
    screen.display_name,
    screen.route_path,
    screen.category,
    screen.sort_order
  from public.internal_area_memberships as membership
  join public.internal_area_membership_screen_grants as screen_grant
    on screen_grant.membership_id = membership.id
  join public.internal_screen_catalog as screen
    on screen.screen_key = screen_grant.screen_key
  where membership.user_id = auth.uid()
    and membership.status = 'active'::public.internal_area_membership_status
    and screen.is_active
    and screen.release_enabled
    and app_private.has_internal_capability(
      coalesce(
        (
          select min(requirement.capability_key)
          from public.internal_screen_capability_requirements as requirement
          where requirement.screen_key = screen.screen_key
        ),
        'screen.' || screen.screen_key || '.view'
      )
    );
$function$;

revoke all on function app_private.internal_actor_workspace_context() from public, anon, authenticated;

create or replace function public.rpc_internal_actor_workspace_context()
returns table (
  actor_user_id uuid,
  tenant_id uuid,
  area_key text,
  area_role public.internal_area_membership_role,
  permission_source text,
  screen_key text,
  display_name text,
  route_path text,
  category public.internal_screen_category,
  sort_order integer
)
language sql
stable
security definer
set search_path = ''
as $function$
  select * from app_private.internal_actor_workspace_context();
$function$;

revoke all on function public.rpc_internal_actor_workspace_context() from public, anon;
grant execute on function public.rpc_internal_actor_workspace_context() to authenticated, service_role;

alter view public.vw_internal_actor_workspace_context reset (security_barrier);

create or replace view public.vw_internal_actor_workspace_context
as
select *
from public.rpc_internal_actor_workspace_context();

notify pgrst, 'reload schema';
