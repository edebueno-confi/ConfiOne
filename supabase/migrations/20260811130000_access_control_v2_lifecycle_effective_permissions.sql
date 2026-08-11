-- ACCESS CONTROL V2: ciclo de vida seguro da estrutura e evidência de
-- permissões efetivas. O catálogo organizacional continua separado do
-- catálogo legado de áreas-alvo dos acionamentos internos.

create or replace view public.vw_admin_access_areas
with (security_barrier = true)
as
select
  a.area_key,
  a.display_name,
  a.description,
  a.manager_user_id,
  manager.full_name as manager_name,
  a.is_system,
  a.is_active,
  count(distinct m.user_id) filter (where m.status = 'active'::public.internal_area_membership_status)::integer as active_user_count,
  count(distinct f.id) filter (where f.is_active)::integer as active_function_count,
  app_private.has_internal_capability('access.areas.manage') as can_manage,
  (
    count(distinct m.id)
    + count(distinct f.id)
    + count(distinct i.id)
    + case when exists (
        select 1
        from public.internal_action_target_areas legacy_area
        where legacy_area.area_key = a.area_key
      ) then 1 else 0 end
  )::integer as dependency_count,
  count(distinct m.id)::integer as membership_reference_count,
  count(distinct f.id)::integer as function_reference_count,
  count(distinct i.id)::integer as invite_reference_count,
  exists (
    select 1
    from public.internal_action_target_areas legacy_area
    where legacy_area.area_key = a.area_key
  ) as legacy_action_area_reference,
  (
    not a.is_system
    and count(distinct m.id) = 0
    and count(distinct f.id) = 0
    and count(distinct i.id) = 0
    and not exists (
      select 1
      from public.internal_action_target_areas legacy_area
      where legacy_area.area_key = a.area_key
    )
  ) as can_delete
from public.internal_organizational_areas a
left join public.profiles manager on manager.id = a.manager_user_id
left join public.internal_area_memberships m on m.organizational_area_key = a.area_key
left join public.internal_functions f on f.organizational_area_key = a.area_key
left join public.internal_invites i on i.organizational_area_key = a.area_key
where app_private.has_internal_capability('access.view')
group by a.area_key, manager.full_name;

drop trigger if exists internal_organizational_areas_audit_row_change
  on public.internal_organizational_areas;
create trigger internal_organizational_areas_audit_row_change
after insert or update or delete on public.internal_organizational_areas
for each row execute function audit.capture_row_change();

create or replace function public.rpc_admin_update_internal_area(
  p_area_key text,
  p_display_name text,
  p_description text,
  p_is_active boolean,
  p_manager_user_id uuid
)
returns public.internal_organizational_areas
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_row public.internal_organizational_areas;
begin
  v_actor := app_private.require_active_actor();
  perform app_private.require_internal_capability('access.areas.manage');

  update public.internal_organizational_areas
  set display_name = btrim(p_display_name),
      description = nullif(btrim(p_description), ''),
      is_active = p_is_active,
      manager_user_id = p_manager_user_id,
      updated_by_user_id = v_actor,
      updated_at = timezone('utc', now())
  where area_key = p_area_key
  returning * into v_row;

  if v_row.area_key is null then
    raise exception 'organizational area not found' using errcode = 'P0002';
  end if;

  return v_row;
end;
$$;

create or replace function public.rpc_admin_delete_internal_area(
  p_area_key text,
  p_confirmed boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_area public.internal_organizational_areas;
  v_actor uuid;
  v_membership_count integer;
  v_function_count integer;
  v_invite_count integer;
  v_legacy_reference boolean;
  v_dependency_count integer;
begin
  v_actor := app_private.require_active_actor();
  perform app_private.require_internal_capability('access.areas.manage');

  if not coalesce(p_confirmed, false) then
    raise exception 'explicit confirmation is required to permanently delete an organizational area'
      using errcode = '22023';
  end if;

  select area_key, display_name, description, manager_user_id, is_system, is_active,
         created_at, updated_at, created_by_user_id, updated_by_user_id
  into v_area
  from public.internal_organizational_areas
  where area_key = p_area_key
  for update;

  if v_area.area_key is null then
    raise exception 'organizational area not found' using errcode = 'P0002';
  end if;
  if v_area.is_system then
    raise exception 'system organizational areas cannot be permanently deleted'
      using errcode = '42501';
  end if;

  select count(*)::integer into v_membership_count
  from public.internal_area_memberships
  where organizational_area_key = p_area_key;

  select count(*)::integer into v_function_count
  from public.internal_functions
  where organizational_area_key = p_area_key;

  select count(*)::integer into v_invite_count
  from public.internal_invites
  where organizational_area_key = p_area_key;

  select exists (
    select 1
    from public.internal_action_target_areas
    where area_key = p_area_key
  ) into v_legacy_reference;

  v_dependency_count := v_membership_count + v_function_count + v_invite_count
    + case when v_legacy_reference then 1 else 0 end;

  if v_dependency_count > 0 then
    raise exception 'organizational area has references; deactivate it instead'
      using errcode = '23503',
        detail = format(
          'memberships=%s, functions=%s, invites=%s, legacy_action_area=%s',
          v_membership_count,
          v_function_count,
          v_invite_count,
          v_legacy_reference
        );
  end if;

  delete from public.internal_organizational_areas
  where area_key = p_area_key;

  return jsonb_build_object(
    'area_key', p_area_key,
    'deleted', true,
    'deleted_by', v_actor
  );
end;
$$;

create or replace function public.rpc_admin_get_internal_access_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user jsonb;
  v_permissions jsonb;
begin
  perform app_private.require_internal_capability('access.view');

  select to_jsonb(u)
  into v_user
  from public.vw_admin_access_internal_users u
  where u.user_id = p_user_id;

  if v_user is null then
    raise exception 'internal user not found' using errcode = 'P0002';
  end if;

  with permission_rows as (
    select
      c.capability_key,
      c.display_name,
      c.description,
      c.domain,
      exists (
        select 1
        from public.internal_user_capability_overrides o
        where o.user_id = p_user_id
          and o.capability_key = c.capability_key
          and o.effect = 'deny'::public.internal_capability_effect
          and (o.valid_until is null or o.valid_until > timezone('utc', now()))
      ) as has_deny,
      (
        exists (
          select 1
          from public.user_global_roles r
          join public.internal_role_capability_grants g on g.role = r.role
          where r.user_id = p_user_id
            and g.capability_key = c.capability_key
        )
        or exists (
          select 1
          from public.internal_area_memberships m
          join public.internal_access_profile_capability_grants g
            on g.access_profile_id = m.access_profile_id
          where m.user_id = p_user_id
            and m.status = 'active'::public.internal_area_membership_status
            and m.permission_mode = 'profile'::public.internal_permission_mode
            and g.capability_key = c.capability_key
        )
        or exists (
          select 1
          from public.internal_user_capability_overrides o
          where o.user_id = p_user_id
            and o.capability_key = c.capability_key
            and o.effect = 'allow'::public.internal_capability_effect
            and (o.valid_until is null or o.valid_until > timezone('utc', now()))
        )
      ) as has_allow,
      coalesce((
        select jsonb_agg(source_row.source order by source_row.source)
        from (
          select distinct 'Papel global: ' || r.role::text as source
          from public.user_global_roles r
          join public.internal_role_capability_grants g on g.role = r.role
          where r.user_id = p_user_id
            and g.capability_key = c.capability_key
          union
          select distinct 'Perfil: ' || ap.name || ' · ' || coalesce(oa.display_name, m.organizational_area_key, m.area_key)
          from public.internal_area_memberships m
          join public.internal_access_profile_capability_grants g
            on g.access_profile_id = m.access_profile_id
          join public.internal_access_profiles ap on ap.id = m.access_profile_id
          left join public.internal_organizational_areas oa on oa.area_key = m.organizational_area_key
          where m.user_id = p_user_id
            and m.status = 'active'::public.internal_area_membership_status
            and m.permission_mode = 'profile'::public.internal_permission_mode
            and g.capability_key = c.capability_key
          union
          select distinct 'Exceção individual: ' || o.effect::text
          from public.internal_user_capability_overrides o
          where o.user_id = p_user_id
            and o.capability_key = c.capability_key
            and (o.valid_until is null or o.valid_until > timezone('utc', now()))
        ) source_row
      ), '[]'::jsonb) as sources,
      coalesce((
        select jsonb_agg(scope_row.scope_label order by scope_row.scope_label)
        from (
          select distinct coalesce(oa.display_name, m.organizational_area_key, m.area_key) as scope_label
          from public.internal_area_memberships m
          left join public.internal_organizational_areas oa on oa.area_key = m.organizational_area_key
          join public.internal_access_profile_capability_grants g
            on g.access_profile_id = m.access_profile_id
          where m.user_id = p_user_id
            and m.status = 'active'::public.internal_area_membership_status
            and m.permission_mode = 'profile'::public.internal_permission_mode
            and g.capability_key = c.capability_key
        ) scope_row
      ), '[]'::jsonb) as scope_areas
    from public.internal_capabilities c
    where c.is_active
      and (
        exists (
          select 1
          from public.user_global_roles r
          join public.internal_role_capability_grants g on g.role = r.role
          where r.user_id = p_user_id and g.capability_key = c.capability_key
        )
        or exists (
          select 1
          from public.internal_area_memberships m
          join public.internal_access_profile_capability_grants g
            on g.access_profile_id = m.access_profile_id
          where m.user_id = p_user_id
            and m.status = 'active'::public.internal_area_membership_status
            and m.permission_mode = 'profile'::public.internal_permission_mode
            and g.capability_key = c.capability_key
        )
        or exists (
          select 1
          from public.internal_user_capability_overrides o
          where o.user_id = p_user_id
            and o.capability_key = c.capability_key
            and (o.valid_until is null or o.valid_until > timezone('utc', now()))
        )
      )
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'capability_key', capability_key,
    'display_name', display_name,
    'description', description,
    'domain', domain,
    'effective_effect', case when has_deny then 'deny' else 'allow' end,
    'has_conflict', has_deny and has_allow,
    'origin', case
      when has_allow and exists (
        select 1 from public.user_global_roles r
        join public.internal_role_capability_grants g on g.role = r.role
        where r.user_id = p_user_id and g.capability_key = permission_rows.capability_key
      ) then 'sistêmico'
      when has_allow then 'área/perfil'
      else 'exceção'
    end,
    'scope', case
      when exists (
        select 1 from public.user_global_roles r
        join public.internal_role_capability_grants g on g.role = r.role
        where r.user_id = p_user_id and g.capability_key = permission_rows.capability_key
      ) then 'sistêmico'
      when jsonb_array_length(scope_areas) > 0 then 'área'
      else 'usuário'
    end,
    'scope_areas', scope_areas,
    'sources', sources
  ) order by domain, display_name), '[]'::jsonb)
  into v_permissions
  from permission_rows;

  return v_user || jsonb_build_object(
    'overrides', coalesce((
      select jsonb_agg(to_jsonb(o) order by o.capability_key)
      from public.vw_admin_access_overrides o
      where o.user_id = p_user_id
    ), '[]'::jsonb),
    'capabilities', v_permissions,
    'effective_permissions', v_permissions
  );
end;
$$;

revoke all on public.vw_admin_access_areas from public, anon, authenticated, service_role;
grant select on public.vw_admin_access_areas to authenticated, service_role;

revoke all on function public.rpc_admin_delete_internal_area(text, boolean)
  from public, anon, authenticated, service_role;
grant execute on function public.rpc_admin_delete_internal_area(text, boolean)
  to authenticated, service_role;

grant execute on function public.rpc_admin_update_internal_area(text, text, text, boolean, uuid)
  to authenticated, service_role;
grant execute on function public.rpc_admin_get_internal_access_user(uuid)
  to authenticated, service_role;

comment on function public.rpc_admin_delete_internal_area(text, boolean) is
  'Exclusão permanente somente para área não sistêmica sem qualquer vínculo, função, convite ou referência legada; áreas com histórico devem ser desativadas.';
