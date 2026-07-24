create or replace view public.vw_support_internal_action_target_areas
with (security_barrier = true)
as
select
  tenant.id as tenant_id,
  area.area_key,
  area.display_name,
  area.status,
  area.allows_specialized_bridge,
  true as can_create_action,
  null::text as unavailable_reason
from public.tenants as tenant
cross join public.internal_action_target_areas as area
where tenant.status = 'active'::public.tenant_status
  and area.status = 'active'::public.ticket_reference_status
  and app_private.can_access_support_internal_actions(tenant.id);

create or replace function public.rpc_support_list_internal_action_target_areas(
  p_ticket_id uuid
)
returns table (
  area_key text,
  display_name text,
  status public.ticket_reference_status,
  allows_specialized_bridge boolean,
  can_create_action boolean,
  unavailable_reason text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.tickets;
begin
  select *
  into v_ticket
  from public.tickets as ticket
  where ticket.id = p_ticket_id;

  if not found then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_support_access_internal_action_ticket(v_ticket.id, v_ticket.tenant_id) then
    raise exception 'rpc_support_list_internal_action_target_areas denied';
  end if;

  return query
  select
    area.area_key,
    area.display_name,
    area.status,
    area.allows_specialized_bridge,
    area.can_create_action,
    area.unavailable_reason
  from public.vw_support_internal_action_target_areas as area
  where area.tenant_id = v_ticket.tenant_id
  order by area.display_name;
end;
$$;

revoke all on public.vw_support_internal_action_target_areas from public, anon, authenticated, service_role;
grant select on public.vw_support_internal_action_target_areas to authenticated, service_role;

revoke all on function public.rpc_support_list_internal_action_target_areas(uuid) from public, anon, authenticated, service_role;
grant execute on function public.rpc_support_list_internal_action_target_areas(uuid) to authenticated, service_role;

comment on view public.vw_support_internal_action_target_areas is
  'Read model seguro para o Support Workspace listar areas internas ativas acionaveis por tenant acessivel ao suporte.';

comment on function public.rpc_support_list_internal_action_target_areas(uuid) is
  'Lista areas internas ativas acionaveis para o ticket informado, sem expor tabela base nem exigir membership na area acionada.';
