create or replace view public.vw_internal_action_area_auth_context
with (security_barrier = true)
as
  select
    iam.tenant_id,
    tenant.slug as tenant_slug,
    tenant.display_name as tenant_display_name,
    iam.area_key,
    area.display_name as area_label,
    iam.role,
    iam.status,
    coalesce(action_counts.visible_open_action_count, 0) as visible_open_action_count,
    true as can_view_queue
  from public.internal_area_memberships as iam
  join public.tenant_memberships as tm
    on tm.tenant_id = iam.tenant_id
   and tm.user_id = iam.user_id
   and tm.status = 'active'::public.membership_status
  join public.profiles as profile
    on profile.id = iam.user_id
   and profile.is_active
  join public.tenants as tenant
    on tenant.id = iam.tenant_id
  join public.internal_action_target_areas as area
    on area.area_key = iam.area_key
   and area.status = 'active'::public.ticket_reference_status
  left join lateral (
    select count(*)::integer as visible_open_action_count
    from public.internal_actions as ia
    where ia.tenant_id = iam.tenant_id
      and ia.target_area = iam.area_key
      and ia.status not in (
        'closed'::public.internal_action_status,
        'cancelled'::public.internal_action_status
      )
      and app_private.can_access_internal_action_area(ia.tenant_id, ia.target_area)
  ) as action_counts on true
  where iam.user_id = auth.uid()
    and iam.status = 'active'::public.internal_area_membership_status
    and iam.role in (
      'viewer'::public.internal_area_membership_role,
      'member'::public.internal_area_membership_role,
      'manager'::public.internal_area_membership_role
    );

revoke all on public.vw_internal_action_area_auth_context from public, anon, authenticated, service_role;
grant select on public.vw_internal_action_area_auth_context to authenticated, service_role;

comment on view public.vw_internal_action_area_auth_context is
  'Contexto autenticado de areas internas do usuario atual. Diferencia membership ativo sem acionamentos de ausencia real de acesso, sem expor fila, ticket, portal ou dados de cliente.';
