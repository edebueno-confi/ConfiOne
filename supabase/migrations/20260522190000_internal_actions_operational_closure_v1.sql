create or replace view public.vw_internal_action_detail_by_area
with (security_barrier = true)
as
  with latest_update as (
    select distinct on (iau.internal_action_id)
      iau.internal_action_id,
      iau.update_kind as last_update_kind,
      iau.body as last_update_summary,
      iau.created_at as last_update_at
    from public.internal_action_updates as iau
    order by iau.internal_action_id, iau.created_at desc
  ),
  evidence_counts as (
    select
      link.internal_action_id,
      count(*)::integer as linked_evidence_count
    from public.internal_action_evidence_links as link
    group by link.internal_action_id
  )
  select
    ia.id as internal_action_id,
    ia.ticket_id,
    ticket.title as ticket_title,
    ticket.status as ticket_status,
    ticket.priority as ticket_priority,
    ticket.severity as ticket_severity,
    ticket.updated_at as ticket_updated_at,
    ia.tenant_id,
    tenant.slug as tenant_slug,
    tenant.display_name as tenant_display_name,
    tenant.legal_name as tenant_legal_name,
    ia.target_area,
    area.display_name as target_area_label,
    ia.support_type,
    ia.priority,
    ia.status,
    ia.summary,
    ia.context,
    ia.requested_by_user_id,
    requester.full_name as requested_by_user_name,
    ia.assigned_area_user_id,
    assignee.full_name as assigned_area_user_name,
    lu.last_update_kind,
    lu.last_update_summary,
    lu.last_update_at,
    ia.returned_to_support_at,
    ia.closed_at,
    ia.cancelled_at,
    ia.created_at,
    ia.updated_at,
    ia.updated_by_user_id,
    updater.full_name as updated_by_user_name,
    coalesce(ec.linked_evidence_count, 0) as linked_evidence_count
  from public.internal_actions as ia
  join public.tickets as ticket
    on ticket.id = ia.ticket_id
   and ticket.tenant_id = ia.tenant_id
  join public.tenants as tenant
    on tenant.id = ia.tenant_id
  join public.internal_action_target_areas as area
    on area.area_key = ia.target_area
  left join public.profiles as requester
    on requester.id = ia.requested_by_user_id
  left join public.profiles as assignee
    on assignee.id = ia.assigned_area_user_id
  left join public.profiles as updater
    on updater.id = ia.updated_by_user_id
  left join latest_update as lu
    on lu.internal_action_id = ia.id
  left join evidence_counts as ec
    on ec.internal_action_id = ia.id
  where app_private.can_access_internal_action_area(ia.tenant_id, ia.target_area);

create or replace view public.vw_internal_action_timeline_by_area
with (security_barrier = true)
as
  select
    iau.id as internal_action_update_id,
    iau.internal_action_id,
    ia.ticket_id,
    ia.tenant_id,
    ia.target_area,
    area.display_name as target_area_label,
    iau.update_kind,
    iau.status_before,
    iau.status_after,
    iau.body,
    iau.metadata,
    iau.created_by_user_id,
    actor.full_name as created_by_user_name,
    iau.created_at
  from public.internal_action_updates as iau
  join public.internal_actions as ia
    on ia.id = iau.internal_action_id
   and ia.tenant_id = iau.tenant_id
  join public.internal_action_target_areas as area
    on area.area_key = ia.target_area
  left join public.profiles as actor
    on actor.id = iau.created_by_user_id
  where app_private.can_access_internal_action_area(ia.tenant_id, ia.target_area);

create or replace view public.vw_admin_internal_action_target_areas
with (security_barrier = true)
as
  select
    area.area_key,
    area.display_name,
    area.status,
    area.is_system,
    area.allows_specialized_bridge,
    coalesce(membership_counts.active_membership_count, 0) as active_membership_count,
    coalesce(action_counts.open_action_count, 0) as open_action_count,
    area.updated_at
  from public.internal_action_target_areas as area
  left join (
    select
      iam.area_key,
      count(*) filter (where iam.status = 'active'::public.internal_area_membership_status)::integer
        as active_membership_count
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

create or replace view public.vw_admin_internal_area_memberships
with (security_barrier = true)
as
  select
    iam.id as membership_id,
    iam.tenant_id,
    tenant.slug as tenant_slug,
    tenant.display_name as tenant_display_name,
    tenant.status as tenant_status,
    iam.area_key,
    area.display_name as area_label,
    area.status as area_status,
    iam.user_id,
    profile.full_name as user_full_name,
    profile.email as user_email,
    profile.is_active as user_is_active,
    iam.role,
    iam.status,
    iam.created_at,
    iam.updated_at,
    iam.created_by_user_id,
    created_by.full_name as created_by_full_name,
    iam.updated_by_user_id,
    updated_by.full_name as updated_by_full_name,
    true as can_update_role,
    true as can_update_status,
    (iam.status <> 'archived'::public.internal_area_membership_status) as can_archive
  from public.internal_area_memberships as iam
  join public.tenants as tenant
    on tenant.id = iam.tenant_id
  join public.internal_action_target_areas as area
    on area.area_key = iam.area_key
  join public.profiles as profile
    on profile.id = iam.user_id
  left join public.profiles as created_by
    on created_by.id = iam.created_by_user_id
  left join public.profiles as updated_by
    on updated_by.id = iam.updated_by_user_id
  where app_private.has_global_role('platform_admin'::public.platform_role);

create or replace function public.rpc_internal_action_assign_to_self(
  p_internal_action_id uuid,
  p_tenant_id uuid
)
returns public.internal_actions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.internal_actions;
  v_action public.internal_actions;
  v_target_status public.internal_action_status;
  v_update public.internal_action_updates;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_existing
  from public.internal_actions as ia
  where ia.id = p_internal_action_id
    and ia.tenant_id = p_tenant_id
  for update;

  if v_existing.id is null then
    raise exception 'internal action not found';
  end if;

  if not app_private.has_active_internal_area_membership(
    v_existing.tenant_id,
    v_actor_user_id,
    v_existing.target_area,
    array['member', 'manager']::public.internal_area_membership_role[]
  ) then
    raise exception 'rpc_internal_action_assign_to_self denied';
  end if;

  if v_existing.assigned_area_user_id is not null
     and v_existing.assigned_area_user_id <> v_actor_user_id then
    raise exception 'internal action is already assigned to another area member';
  end if;

  if v_existing.assigned_area_user_id = v_actor_user_id then
    raise exception 'internal action is already assigned to you';
  end if;

  v_target_status := case
    when v_existing.status in ('open', 'follow_up_requested') then 'assigned'::public.internal_action_status
    else v_existing.status
  end;

  if v_existing.status = any(array['closed', 'cancelled', 'returned_to_support']::public.internal_action_status[]) then
    raise exception 'internal action is not eligible for assignment';
  end if;

  if v_target_status <> v_existing.status
     and not app_private.internal_action_status_transition_allowed(v_existing.status, v_target_status) then
    raise exception 'invalid internal action status transition: % -> %', v_existing.status, v_target_status;
  end if;

  update public.internal_actions
  set
    assigned_area_user_id = v_actor_user_id,
    status = v_target_status,
    updated_by_user_id = v_actor_user_id
  where id = v_existing.id
    and tenant_id = v_existing.tenant_id
  returning *
  into v_action;

  v_update := app_private.create_internal_action_update(
    v_action.id,
    v_action.tenant_id,
    v_actor_user_id,
    'assignment_changed'::public.internal_action_update_kind,
    'Acionamento assumido pela área interna.',
    case when v_target_status <> v_existing.status then v_existing.status else null end,
    case when v_target_status <> v_existing.status then v_target_status else null end,
    jsonb_build_object('assigned_area_user_id', v_actor_user_id)
  );

  perform app_private.create_internal_action_ticket_event(
    v_action.id,
    'internal_action_assigned'::public.ticket_event_type,
    v_actor_user_id,
    jsonb_strip_nulls(
      jsonb_build_object(
        'internal_action_update_id', v_update.id,
        'assigned_area_user_id', v_actor_user_id,
        'status_before', case when v_target_status <> v_existing.status then v_existing.status else null end,
        'status_after', case when v_target_status <> v_existing.status then v_target_status else null end
      )
    )
  );

  return v_action;
end;
$$;

create or replace function public.rpc_admin_add_internal_area_membership(
  p_tenant_id uuid,
  p_user_id uuid,
  p_area_key text,
  p_role public.internal_area_membership_role,
  p_status public.internal_area_membership_status default 'active'
)
returns public.internal_area_memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_membership public.internal_area_memberships;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_add_internal_area_membership denied';
  end if;

  insert into public.internal_area_memberships (
    tenant_id,
    user_id,
    area_key,
    role,
    status,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_tenant_id,
    p_user_id,
    p_area_key,
    p_role,
    coalesce(p_status, 'active'::public.internal_area_membership_status),
    v_actor_user_id,
    v_actor_user_id
  )
  on conflict (tenant_id, user_id, area_key)
  do update
  set
    role = excluded.role,
    status = excluded.status,
    updated_by_user_id = v_actor_user_id
  returning *
  into v_membership;

  return v_membership;
end;
$$;

create or replace function public.rpc_admin_update_internal_area_membership(
  p_membership_id uuid,
  p_role public.internal_area_membership_role,
  p_status public.internal_area_membership_status
)
returns public.internal_area_memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_membership public.internal_area_memberships;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_update_internal_area_membership denied';
  end if;

  update public.internal_area_memberships
  set
    role = p_role,
    status = p_status,
    updated_by_user_id = v_actor_user_id
  where id = p_membership_id
  returning *
  into v_membership;

  if v_membership.id is null then
    raise exception 'internal area membership not found';
  end if;

  return v_membership;
end;
$$;

create or replace function public.rpc_admin_archive_internal_area_membership(
  p_membership_id uuid
)
returns public.internal_area_memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_membership public.internal_area_memberships;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_archive_internal_area_membership denied';
  end if;

  update public.internal_area_memberships
  set
    status = 'archived'::public.internal_area_membership_status,
    updated_by_user_id = v_actor_user_id
  where id = p_membership_id
  returning *
  into v_membership;

  if v_membership.id is null then
    raise exception 'internal area membership not found';
  end if;

  return v_membership;
end;
$$;

revoke all on public.vw_internal_action_detail_by_area from public, anon, authenticated, service_role;
revoke all on public.vw_internal_action_timeline_by_area from public, anon, authenticated, service_role;
revoke all on public.vw_admin_internal_action_target_areas from public, anon, authenticated, service_role;
revoke all on public.vw_admin_internal_area_memberships from public, anon, authenticated, service_role;

grant select on public.vw_internal_action_detail_by_area to authenticated, service_role;
grant select on public.vw_internal_action_timeline_by_area to authenticated, service_role;
grant select on public.vw_admin_internal_action_target_areas to authenticated, service_role;
grant select on public.vw_admin_internal_area_memberships to authenticated, service_role;

revoke all on function public.rpc_internal_action_assign_to_self(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_add_internal_area_membership(uuid, uuid, text, public.internal_area_membership_role, public.internal_area_membership_status) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_update_internal_area_membership(uuid, public.internal_area_membership_role, public.internal_area_membership_status) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_archive_internal_area_membership(uuid) from public, anon, authenticated, service_role;

grant execute on function public.rpc_internal_action_assign_to_self(uuid, uuid) to authenticated, service_role;
grant execute on function public.rpc_admin_add_internal_area_membership(uuid, uuid, text, public.internal_area_membership_role, public.internal_area_membership_status) to authenticated, service_role;
grant execute on function public.rpc_admin_update_internal_area_membership(uuid, public.internal_area_membership_role, public.internal_area_membership_status) to authenticated, service_role;
grant execute on function public.rpc_admin_archive_internal_area_membership(uuid) to authenticated, service_role;

comment on view public.vw_internal_action_detail_by_area is
  'Detalhe operacional de acionamento interno visível apenas a membros ativos da área ou platform_admin.';

comment on view public.vw_internal_action_timeline_by_area is
  'Timeline interna de acionamento visível apenas a membros ativos da área ou platform_admin.';

comment on view public.vw_admin_internal_action_target_areas is
  'Catálogo administrativo de áreas internas acionáveis, restrito a platform_admin.';

comment on view public.vw_admin_internal_area_memberships is
  'Read model administrativo de memberships por área interna, restrito a platform_admin.';

comment on function public.rpc_internal_action_assign_to_self(uuid, uuid) is
  'Permite que membro ativo da área assuma acionamento elegível sem alterar ticket.status.';

comment on function public.rpc_admin_add_internal_area_membership(uuid, uuid, text, public.internal_area_membership_role, public.internal_area_membership_status) is
  'Adiciona ou reativa membership de área interna por contrato administrativo auditado.';

comment on function public.rpc_admin_update_internal_area_membership(uuid, public.internal_area_membership_role, public.internal_area_membership_status) is
  'Atualiza role/status de membership de área interna por contrato administrativo auditado.';

comment on function public.rpc_admin_archive_internal_area_membership(uuid) is
  'Arquiva membership de área interna por contrato administrativo auditado.';
