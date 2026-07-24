create or replace view public.vw_admin_internal_areas
with (security_barrier = true)
as
  select
    area.area_key,
    area.display_name,
    area.status,
    area.is_system,
    area.allows_specialized_bridge,
    'internal_action_target_areas'::text as source_table,
    true as can_use_as_operational_area,
    coalesce(membership_counts.total_membership_count, 0) as total_membership_count,
    coalesce(membership_counts.active_membership_count, 0) as active_membership_count,
    coalesce(membership_counts.active_user_count, 0) as active_user_count,
    coalesce(membership_counts.active_tenant_count, 0) as active_tenant_count,
    coalesce(action_counts.open_action_count, 0) as open_action_count,
    area.created_at,
    area.updated_at
  from public.internal_action_target_areas as area
  left join (
    select
      iam.area_key,
      count(*)::integer as total_membership_count,
      count(*) filter (
        where iam.status = 'active'::public.internal_area_membership_status
      )::integer as active_membership_count,
      count(distinct iam.user_id) filter (
        where iam.status = 'active'::public.internal_area_membership_status
      )::integer as active_user_count,
      count(distinct iam.tenant_id) filter (
        where iam.status = 'active'::public.internal_area_membership_status
      )::integer as active_tenant_count
    from public.internal_area_memberships as iam
    group by iam.area_key
  ) as membership_counts
    on membership_counts.area_key = area.area_key
  left join (
    select
      ia.target_area,
      count(*) filter (
        where ia.status not in (
          'closed'::public.internal_action_status,
          'cancelled'::public.internal_action_status
        )
      )::integer as open_action_count
    from public.internal_actions as ia
    group by ia.target_area
  ) as action_counts
    on action_counts.target_area = area.area_key
  where app_private.has_global_role('platform_admin'::public.platform_role);

create or replace view public.vw_admin_internal_collaborators
with (security_barrier = true)
as
  with global_roles as (
    select
      ugr.user_id,
      array_agg(distinct ugr.role order by ugr.role)::public.platform_role[] as global_roles
    from public.user_global_roles as ugr
    group by ugr.user_id
  ),
  area_membership_summary as (
    select
      iam.user_id,
      count(*)::integer as total_area_membership_count,
      count(*) filter (
        where iam.status = 'active'::public.internal_area_membership_status
      )::integer as active_area_membership_count,
      count(distinct iam.tenant_id) filter (
        where iam.status = 'active'::public.internal_area_membership_status
      )::integer as active_area_tenant_count,
      array_agg(distinct iam.area_key order by iam.area_key) filter (
        where iam.status = 'active'::public.internal_area_membership_status
      )::text[] as active_area_keys,
      max(iam.updated_at) as last_area_membership_updated_at
    from public.internal_area_memberships as iam
    group by iam.user_id
  )
  select
    profile.id as user_id,
    profile.full_name as user_full_name,
    profile.email as user_email,
    profile.locale,
    profile.timezone,
    profile.is_active as user_is_active,
    coalesce(global_roles.global_roles, array[]::public.platform_role[]) as global_roles,
    coalesce(area_membership_summary.total_area_membership_count, 0) as total_area_membership_count,
    coalesce(area_membership_summary.active_area_membership_count, 0) as active_area_membership_count,
    coalesce(area_membership_summary.active_area_tenant_count, 0) as active_area_tenant_count,
    coalesce(area_membership_summary.active_area_keys, array[]::text[]) as active_area_keys,
    area_membership_summary.last_area_membership_updated_at,
    profile.created_at,
    profile.updated_at,
    true as can_manage_internal_memberships
  from public.profiles as profile
  left join global_roles
    on global_roles.user_id = profile.id
  left join area_membership_summary
    on area_membership_summary.user_id = profile.id
  where app_private.has_global_role('platform_admin'::public.platform_role)
    and (
      global_roles.user_id is not null
      or area_membership_summary.user_id is not null
    );

create or replace view public.vw_internal_area_landing_context
with (security_barrier = true)
as
  select
    auth_context.tenant_id,
    auth_context.tenant_slug,
    auth_context.tenant_display_name,
    auth_context.area_key,
    auth_context.area_label,
    auth_context.role,
    auth_context.status,
    auth_context.visible_open_action_count,
    auth_context.can_view_queue,
    '/internal-actions'::text as default_landing_path
  from public.vw_internal_action_area_auth_context as auth_context
  where auth_context.can_view_queue;

revoke all on public.vw_admin_internal_areas from public, anon, authenticated, service_role;
revoke all on public.vw_admin_internal_collaborators from public, anon, authenticated, service_role;
revoke all on public.vw_internal_area_landing_context from public, anon, authenticated, service_role;

grant select on public.vw_admin_internal_areas to authenticated, service_role;
grant select on public.vw_admin_internal_collaborators to authenticated, service_role;
grant select on public.vw_internal_area_landing_context to authenticated, service_role;

comment on view public.vw_admin_internal_areas is
  'Read model canonico OCP V1-A de areas internas. Reaproveita internal_action_target_areas como catalogo inicial sem criar tabela paralela.';

comment on view public.vw_admin_internal_collaborators is
  'Read model canonico OCP V1-A de colaboradores internos. Reaproveita profiles, user_global_roles e internal_area_memberships sem duplicar identidade.';

comment on view public.vw_internal_area_landing_context is
  'Contexto canonico OCP V1-A para roteamento futuro de area interna, derivado do auth context existente de internal actions.';
