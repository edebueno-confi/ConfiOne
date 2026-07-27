-- ACCESS-01.1: read models and audited commands for the internal control plane.
-- The legacy action-target catalog remains unchanged for support workflows. The
-- organizational catalog below is additive and is the source for /admin/access.

create table if not exists public.internal_organizational_areas (
  area_key text primary key,
  display_name text not null,
  description text,
  manager_user_id uuid references public.profiles(id) on delete set null,
  is_system boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles(id),
  updated_by_user_id uuid references public.profiles(id),
  constraint internal_org_areas_key_check check (area_key = lower(area_key) and area_key ~ '^[a-z][a-z0-9_]{1,79}$'),
  constraint internal_org_areas_name_check check (nullif(btrim(display_name), '') is not null),
  constraint internal_org_areas_description_check check (description is null or length(description) <= 500)
);

alter table public.internal_functions
  add column if not exists organizational_area_key text references public.internal_organizational_areas(area_key) on delete restrict;

alter table public.internal_invites
  add column if not exists organizational_area_key text references public.internal_organizational_areas(area_key) on delete restrict;

alter table public.internal_area_memberships
  add column if not exists organizational_area_key text references public.internal_organizational_areas(area_key) on delete restrict;

insert into public.internal_organizational_areas(area_key, display_name, description)
values
  ('executive', 'Diretoria', 'Decisões e acompanhamento executivo.'),
  ('operations', 'Operações', 'Rotinas operacionais e continuidade do serviço.'),
  ('customer_success', 'Customer Success', 'Carteira, relacionamento e sucesso do cliente.'),
  ('support', 'Suporte', 'Atendimento, triagem e resolução de solicitações.'),
  ('commercial', 'Comercial', 'Negócios, pipeline e relacionamento comercial.'),
  ('finance', 'Financeiro', 'Receitas, recebíveis e controles financeiros.'),
  ('product', 'Produto', 'Evolução do produto e necessidades operacionais.'),
  ('engineering', 'Engenharia', 'Desenvolvimento, integrações e confiabilidade.'),
  ('technology', 'Tecnologia', 'Plataforma, segurança e infraestrutura.'),
  ('content_knowledge', 'Conteúdo e Conhecimento', 'Curadoria e governança da Central de Ajuda.')
on conflict (area_key) do nothing;

update public.internal_functions f
set organizational_area_key = f.area_key
where f.organizational_area_key is null
  and exists (select 1 from public.internal_organizational_areas a where a.area_key = f.area_key);

update public.internal_invites i
set organizational_area_key = i.area_key
where i.organizational_area_key is null
  and exists (select 1 from public.internal_organizational_areas a where a.area_key = i.area_key);

update public.internal_area_memberships m
set organizational_area_key = m.area_key
where m.organizational_area_key is null
  and exists (select 1 from public.internal_organizational_areas a where a.area_key = m.area_key);

create index if not exists internal_functions_org_area_idx on public.internal_functions(organizational_area_key, is_active);
create index if not exists internal_invites_org_area_idx on public.internal_invites(organizational_area_key, status);
create index if not exists internal_memberships_org_area_idx on public.internal_area_memberships(organizational_area_key, status);

create or replace view public.vw_admin_access_internal_users
with (security_barrier = true)
as
select
  p.id as user_id,
  p.full_name,
  p.email,
  p.is_active,
  p.created_at,
  p.updated_at,
  coalesce(roles.platform_roles, array[]::public.platform_role[]) as platform_roles,
  coalesce(area_summary.areas, '[]'::jsonb) as areas,
  coalesce(area_summary.area_count, 0)::integer as area_count,
  coalesce(override_summary.override_count, 0)::integer as override_count,
  case when p.is_active and coalesce(ctx.status, 'active') = 'active' then 'active'
       when coalesce(ctx.status, 'active') = 'suspended' then 'suspended'
       else 'inactive' end as access_status,
  coalesce(ctx.last_access_at, p.updated_at) as last_access_at,
  app_private.has_internal_capability('access.users.manage') as can_manage
from public.profiles p
left join lateral (
  select array_agg(r.role order by r.role) as platform_roles
  from public.user_global_roles r where r.user_id = p.id
) roles on true
left join lateral (
  select
    jsonb_agg(jsonb_build_object(
      'membership_id', m.id,
      'area_key', coalesce(m.organizational_area_key, m.area_key),
      'area_label', coalesce(oa.display_name, legacy.display_name),
      'function_id', f.id,
      'function_name', f.name,
      'access_profile_id', ap.id,
      'access_profile_name', ap.name,
      'status', m.status,
      'permission_mode', m.permission_mode
    ) order by coalesce(oa.display_name, legacy.display_name)) as areas,
    count(*)::integer as area_count
  from public.internal_area_memberships m
  left join public.internal_organizational_areas oa on oa.area_key = m.organizational_area_key
  join public.internal_action_target_areas legacy on legacy.area_key = m.area_key
  left join public.internal_functions f on f.id = (
    select i.function_id from public.internal_invites i where i.accepted_by_user_id = m.user_id and i.organizational_area_key = m.organizational_area_key order by i.accepted_at desc nulls last limit 1
  )
  left join public.internal_access_profiles ap on ap.id = m.access_profile_id
  where m.user_id = p.id and m.status <> 'archived'::public.internal_area_membership_status
) area_summary on true
left join lateral (
  select max(c.updated_at) as last_access_at, max(c.updated_at) filter (where c.status = 'suspended') as suspended_at, max(c.created_at) as created_at,
    (array_agg(c.status order by c.is_primary desc, c.updated_at desc))[1] as status
  from public.user_actor_contexts c where c.user_id = p.id and c.actor_type = 'internal'::public.internal_actor_type
) ctx on true
left join lateral (
  select count(*)::integer as override_count from public.internal_user_capability_overrides o where o.user_id = p.id
) override_summary on true
where exists (
  select 1 from public.user_actor_contexts c where c.user_id = p.id and c.actor_type = 'internal'::public.internal_actor_type
) and app_private.has_internal_capability('access.view');

create or replace view public.vw_admin_access_invites
with (security_barrier = true)
as
select
  i.id as invite_id,
  i.email,
  i.full_name,
  i.organizational_area_key as area_key,
  oa.display_name as area_label,
  i.function_id,
  f.name as function_name,
  i.access_profile_id,
  ap.name as access_profile_name,
  i.status,
  i.expires_at,
  i.sent_at,
  i.accepted_at,
  i.revoked_at,
  i.created_at,
  i.updated_at,
  inviter.full_name as invited_by_name,
  app_private.has_internal_capability('access.invites.manage') as can_manage
from public.internal_invites i
join public.internal_organizational_areas oa on oa.area_key = i.organizational_area_key
left join public.internal_functions f on f.id = i.function_id
left join public.internal_access_profiles ap on ap.id = i.access_profile_id
left join public.profiles inviter on inviter.id = i.invited_by_user_id
where app_private.has_internal_capability('access.view');

create or replace view public.vw_admin_access_areas
with (security_barrier = true)
as
select
  a.area_key, a.display_name, a.description, a.manager_user_id,
  manager.full_name as manager_name, a.is_system, a.is_active,
  count(distinct m.user_id) filter (where m.status = 'active'::public.internal_area_membership_status)::integer as active_user_count,
  count(distinct f.id) filter (where f.is_active)::integer as active_function_count,
  app_private.has_internal_capability('access.areas.manage') as can_manage
from public.internal_organizational_areas a
left join public.profiles manager on manager.id = a.manager_user_id
left join public.internal_area_memberships m on m.organizational_area_key = a.area_key
left join public.internal_functions f on f.organizational_area_key = a.area_key
where app_private.has_internal_capability('access.view')
group by a.area_key, manager.full_name;

create or replace view public.vw_admin_access_functions
with (security_barrier = true)
as
select
  f.id as function_id, f.name, f.description, f.organizational_area_key as area_key,
  a.display_name as area_label, f.default_access_profile_id, ap.name as default_access_profile_name,
  f.is_active, f.created_at, f.updated_at,
  app_private.has_internal_capability('access.functions.manage') as can_manage
from public.internal_functions f
join public.internal_organizational_areas a on a.area_key = f.organizational_area_key
left join public.internal_access_profiles ap on ap.id = f.default_access_profile_id
where app_private.has_internal_capability('access.view');

create or replace view public.vw_admin_access_profiles
with (security_barrier = true)
as
select
  p.id as access_profile_id, p.name, p.description, p.is_system, p.is_active,
  count(distinct m.user_id) filter (where m.status = 'active'::public.internal_area_membership_status)::integer as user_count,
  count(distinct c.capability_key)::integer as capability_count,
  count(distinct s.screen_key)::integer as screen_count,
  app_private.has_internal_capability('access.profiles.manage') as can_manage
from public.internal_access_profiles p
left join public.internal_area_memberships m on m.access_profile_id = p.id
left join public.internal_access_profile_capability_grants c on c.access_profile_id = p.id
left join public.internal_access_profile_screen_grants s on s.access_profile_id = p.id
where app_private.has_internal_capability('access.view')
group by p.id;

create or replace view public.vw_admin_access_overrides
with (security_barrier = true)
as
select
  o.id as override_id, o.user_id, p.full_name, p.email, o.capability_key,
  c.display_name as capability_name, c.domain, o.effect, o.justification,
  o.valid_until, o.created_at, o.updated_at, grantor.full_name as granted_by_name
from public.internal_user_capability_overrides o
join public.profiles p on p.id = o.user_id
join public.internal_capabilities c on c.capability_key = o.capability_key
left join public.profiles grantor on grantor.id = o.granted_by_user_id
where app_private.has_internal_capability('access.permissions.manage');

create or replace view public.vw_admin_access_capabilities
with (security_barrier = true)
as
select capability_key, display_name, description, domain, is_active
from public.internal_capabilities
where is_active and app_private.has_internal_capability('access.view');

create or replace view public.vw_admin_access_profile_capabilities
with (security_barrier = true)
as
select access_profile_id, capability_key
from public.internal_access_profile_capability_grants
where app_private.has_internal_capability('access.view');

create or replace function public.rpc_admin_list_internal_access_users()
returns setof public.vw_admin_access_internal_users
language sql security definer set search_path = '' as $$
  select * from public.vw_admin_access_internal_users order by full_name nulls last, email;
$$;

create or replace function public.rpc_admin_get_internal_access_user(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user jsonb;
begin
  perform app_private.require_internal_capability('access.view');
  select to_jsonb(u) into v_user from public.vw_admin_access_internal_users u where u.user_id = p_user_id;
  if v_user is null then raise exception 'internal user not found'; end if;
  return v_user || jsonb_build_object(
    'overrides', coalesce((select jsonb_agg(to_jsonb(o) order by o.capability_key) from public.vw_admin_access_overrides o where o.user_id = p_user_id), '[]'::jsonb),
    'capabilities', coalesce((select jsonb_agg(jsonb_build_object('capability_key', c.capability_key, 'display_name', c.display_name, 'domain', c.domain)) from public.internal_capabilities c where c.is_active and (
      exists(select 1 from public.user_global_roles r join public.internal_role_capability_grants g on g.role=r.role where r.user_id=p_user_id and g.capability_key=c.capability_key)
      or exists(select 1 from public.internal_area_memberships m join public.internal_access_profile_capability_grants g on g.access_profile_id=m.access_profile_id where m.user_id=p_user_id and m.status='active'::public.internal_area_membership_status and g.capability_key=c.capability_key)
      or exists(select 1 from public.internal_user_capability_overrides o where o.user_id=p_user_id and o.capability_key=c.capability_key and o.effect='allow'::public.internal_capability_effect)
    )), '[]'::jsonb)
  );
end;
$$;

create or replace function public.rpc_admin_set_internal_user_status(p_user_id uuid, p_is_active boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_actor uuid;
begin
  v_actor := app_private.require_active_actor();
  perform app_private.require_internal_capability('access.users.manage');
  if p_user_id = v_actor and not p_is_active then raise exception 'cannot suspend the current administrator'; end if;
  if not p_is_active and (select count(*) from public.user_global_roles where role = 'platform_admin'::public.platform_role and user_id <> p_user_id) = 0 then raise exception 'last platform administrator cannot be suspended'; end if;
  update public.profiles set is_active = p_is_active, updated_by_user_id = v_actor, updated_at = timezone('utc', now()) where id = p_user_id;
  update public.user_actor_contexts set status = case when p_is_active then 'active'::public.internal_actor_context_status else 'suspended'::public.internal_actor_context_status end, updated_by_user_id = v_actor, updated_at = timezone('utc', now()) where user_id = p_user_id and actor_type = 'internal'::public.internal_actor_type;
  update public.internal_area_memberships set status = case when p_is_active then 'active'::public.internal_area_membership_status else 'inactive'::public.internal_area_membership_status end, updated_by_user_id = v_actor, updated_at = timezone('utc', now()) where user_id = p_user_id and status <> 'archived'::public.internal_area_membership_status;
  return public.rpc_admin_get_internal_access_user(p_user_id);
end;
$$;

create or replace function public.rpc_admin_update_internal_access_assignment(p_user_id uuid, p_area_key text, p_function_id uuid, p_access_profile_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_actor uuid; v_tenant uuid; v_legacy_area text; v_profile public.internal_access_profiles; v_function public.internal_functions;
begin
  v_actor := app_private.require_active_actor();
  perform app_private.require_internal_capability('access.users.manage');
  if not exists (select 1 from public.internal_organizational_areas where area_key = p_area_key and is_active) then raise exception 'organizational area not found or inactive'; end if;
  select * into v_function from public.internal_functions where id = p_function_id and organizational_area_key = p_area_key and is_active;
  if p_function_id is not null and v_function.id is null then raise exception 'function not found for area'; end if;
  select * into v_profile from public.internal_access_profiles where id = p_access_profile_id and is_active;
  if p_access_profile_id is not null and v_profile.id is null then raise exception 'active access profile not found'; end if;
  select id into v_tenant from public.tenants where slug = 'genius-internal';
  if v_tenant is null then
    insert into public.tenants(slug, legal_name, display_name, status, data_region, created_by_user_id, updated_by_user_id) values ('genius-internal', 'Genius Returns', 'Operação interna Genius Returns', 'active', 'sa-east-1', v_actor, v_actor) returning id into v_tenant;
  end if;
  if not exists (select 1 from public.tenant_memberships where tenant_id=v_tenant and user_id=p_user_id and status='active'::public.membership_status) then
    insert into public.tenant_memberships(tenant_id,user_id,role,status,created_by_user_id,updated_by_user_id) values(v_tenant,p_user_id,'tenant_viewer','active',v_actor,v_actor) on conflict(tenant_id,user_id) do update set status='active', updated_by_user_id=v_actor;
  end if;
  select case when exists(select 1 from public.internal_action_target_areas where area_key=p_area_key) then p_area_key else 'other_internal' end into v_legacy_area;
  insert into public.user_actor_contexts(user_id,actor_type,is_primary,status,created_by_user_id,updated_by_user_id) values(p_user_id,'internal','true','active',v_actor,v_actor) on conflict(user_id,actor_type) do update set status='active',is_primary=true,updated_by_user_id=v_actor,updated_at=timezone('utc',now());
  insert into public.internal_area_memberships(tenant_id,user_id,area_key,organizational_area_key,role,status,access_profile_id,permission_mode,created_by_user_id,updated_by_user_id) values(v_tenant,p_user_id,v_legacy_area,p_area_key,'member','active',p_access_profile_id,case when p_access_profile_id is null then 'custom' else 'profile' end::public.internal_permission_mode,v_actor,v_actor) on conflict(tenant_id,user_id,area_key) do update set organizational_area_key=excluded.organizational_area_key,access_profile_id=excluded.access_profile_id,permission_mode=excluded.permission_mode,status='active',updated_by_user_id=v_actor,updated_at=timezone('utc',now());
  return public.rpc_admin_get_internal_access_user(p_user_id);
end;
$$;

create or replace function public.rpc_admin_list_internal_invites()
returns setof public.vw_admin_access_invites language sql security definer set search_path = '' as $$ select * from public.vw_admin_access_invites order by created_at desc; $$;

create or replace function public.rpc_admin_create_internal_invitation_v2(p_email text,p_full_name text,p_area_key text,p_function_id uuid,p_access_profile_id uuid,p_token_hash text,p_expires_at timestamptz)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_actor uuid; v_invite public.internal_invites;
begin
  v_actor := app_private.require_active_actor(); perform app_private.require_internal_capability('access.invites.manage');
  if not exists(select 1 from public.internal_organizational_areas where area_key=p_area_key and is_active) then raise exception 'organizational area not found or inactive'; end if;
  if p_token_hash is null or length(p_token_hash) < 32 then raise exception 'invite token hash is required'; end if;
  if p_expires_at <= timezone('utc',now()) then raise exception 'invite expiry must be in the future'; end if;
  if exists(select 1 from public.internal_invites where lower(email::text)=lower(btrim(p_email)) and status in ('pending','sent')) then raise exception 'active invite already exists for this email'; end if;
  insert into public.internal_invites(email,full_name,area_key,organizational_area_key,function_id,access_profile_id,token_hash,expires_at,invited_by_user_id) values(lower(btrim(p_email)),btrim(p_full_name),case when exists(select 1 from public.internal_action_target_areas where area_key=p_area_key) then p_area_key else 'other_internal' end,p_area_key,p_function_id,p_access_profile_id,p_token_hash,p_expires_at,v_actor) returning * into v_invite;
  return jsonb_build_object('invite_id',v_invite.id,'email',v_invite.email,'status',v_invite.status,'expires_at',v_invite.expires_at,'delivery_status','prepared_local_only');
end;
$$;

create or replace function public.rpc_admin_list_internal_areas()
returns setof public.vw_admin_access_areas language sql security definer set search_path = '' as $$ select * from public.vw_admin_access_areas order by display_name; $$;

create or replace function public.rpc_admin_create_internal_area(p_area_key text,p_display_name text,p_description text)
returns public.internal_organizational_areas language plpgsql security definer set search_path = '' as $$ declare v_actor uuid; v_row public.internal_organizational_areas; begin v_actor:=app_private.require_active_actor(); perform app_private.require_internal_capability('access.areas.manage'); insert into public.internal_organizational_areas(area_key,display_name,description,is_system,created_by_user_id,updated_by_user_id) values(lower(btrim(p_area_key)),btrim(p_display_name),nullif(btrim(p_description),''),false,v_actor,v_actor) returning * into v_row; return v_row; end; $$;

create or replace function public.rpc_admin_update_internal_area(p_area_key text,p_display_name text,p_description text,p_is_active boolean,p_manager_user_id uuid)
returns public.internal_organizational_areas language plpgsql security definer set search_path = '' as $$ declare v_actor uuid; v_row public.internal_organizational_areas; begin v_actor:=app_private.require_active_actor(); perform app_private.require_internal_capability('access.areas.manage'); if not p_is_active and exists(select 1 from public.internal_area_memberships where organizational_area_key=p_area_key and status='active'::public.internal_area_membership_status) then raise exception 'area with active members cannot be deactivated'; end if; update public.internal_organizational_areas set display_name=btrim(p_display_name),description=nullif(btrim(p_description),''),is_active=p_is_active,manager_user_id=p_manager_user_id,updated_by_user_id=v_actor,updated_at=timezone('utc',now()) where area_key=p_area_key returning * into v_row; if v_row.area_key is null then raise exception 'organizational area not found'; end if; return v_row; end; $$;

create or replace function public.rpc_admin_list_internal_functions()
returns setof public.vw_admin_access_functions language sql security definer set search_path = '' as $$ select * from public.vw_admin_access_functions order by area_label,name; $$;

create or replace function public.rpc_admin_create_internal_function(p_area_key text,p_name text,p_description text,p_default_access_profile_id uuid)
returns public.internal_functions language plpgsql security definer set search_path = '' as $$ declare v_actor uuid; v_row public.internal_functions; begin v_actor:=app_private.require_active_actor(); perform app_private.require_internal_capability('access.functions.manage'); if not exists(select 1 from public.internal_organizational_areas where area_key=p_area_key and is_active) then raise exception 'organizational area not found or inactive'; end if; insert into public.internal_functions(area_key,organizational_area_key,name,description,default_access_profile_id,created_by_user_id,updated_by_user_id) values(case when exists(select 1 from public.internal_action_target_areas where area_key=p_area_key) then p_area_key else 'other_internal' end,p_area_key,btrim(p_name),nullif(btrim(p_description),''),p_default_access_profile_id,v_actor,v_actor) returning * into v_row; return v_row; end; $$;

create or replace function public.rpc_admin_update_internal_function(p_function_id uuid,p_name text,p_description text,p_default_access_profile_id uuid,p_is_active boolean)
returns public.internal_functions language plpgsql security definer set search_path = '' as $$ declare v_actor uuid; v_row public.internal_functions; begin v_actor:=app_private.require_active_actor(); perform app_private.require_internal_capability('access.functions.manage'); update public.internal_functions set name=btrim(p_name),description=nullif(btrim(p_description),''),default_access_profile_id=p_default_access_profile_id,is_active=p_is_active,updated_by_user_id=v_actor,updated_at=timezone('utc',now()) where id=p_function_id returning * into v_row; if v_row.id is null then raise exception 'internal function not found'; end if; return v_row; end; $$;

create or replace function public.rpc_admin_replace_internal_profile_capabilities(p_access_profile_id uuid,p_capability_keys text[])
returns jsonb language plpgsql security definer set search_path = '' as $$ declare v_unknown integer; begin perform app_private.require_active_actor(); perform app_private.require_internal_capability('access.profiles.manage'); if not exists(select 1 from public.internal_access_profiles where id=p_access_profile_id) then raise exception 'access profile not found'; end if; select count(*) into v_unknown from unnest(coalesce(p_capability_keys,array[]::text[])) k where not exists(select 1 from public.internal_capabilities c where c.capability_key=k and c.is_active); if v_unknown > 0 then raise exception 'unknown capability'; end if; delete from public.internal_access_profile_capability_grants where access_profile_id=p_access_profile_id; insert into public.internal_access_profile_capability_grants(access_profile_id,capability_key) select p_access_profile_id,k from unnest(coalesce(p_capability_keys,array[]::text[])) k on conflict do nothing; return jsonb_build_object('access_profile_id',p_access_profile_id,'capability_keys',coalesce(p_capability_keys,array[]::text[])); end; $$;

create or replace function public.rpc_admin_upsert_internal_override(p_user_id uuid,p_capability_key text,p_effect public.internal_capability_effect,p_justification text,p_valid_until timestamptz)
returns public.internal_user_capability_overrides language plpgsql security definer set search_path = '' as $$ declare v_actor uuid; v_row public.internal_user_capability_overrides; begin v_actor:=app_private.require_active_actor(); perform app_private.require_internal_capability('access.permissions.manage'); if nullif(btrim(p_justification),'') is null then raise exception 'override justification is required'; end if; insert into public.internal_user_capability_overrides(user_id,capability_key,effect,justification,valid_until,granted_by_user_id) values(p_user_id,p_capability_key,p_effect,btrim(p_justification),p_valid_until,v_actor) on conflict(user_id,capability_key) do update set effect=excluded.effect,justification=excluded.justification,valid_until=excluded.valid_until,granted_by_user_id=v_actor,updated_at=timezone('utc',now()) returning * into v_row; return v_row; end; $$;

create or replace function public.rpc_admin_create_internal_access_profile(p_area_key text,p_name text,p_description text default null)
returns public.internal_access_profiles language plpgsql security definer set search_path = '' as $$ declare v_actor uuid; v_row public.internal_access_profiles; begin v_actor:=app_private.require_active_actor(); perform app_private.require_internal_capability('access.profiles.manage'); insert into public.internal_access_profiles(area_key,name,description,is_system,created_by_user_id,updated_by_user_id) values(case when p_area_key is null then null when exists(select 1 from public.internal_action_target_areas where area_key=p_area_key) then p_area_key else 'other_internal' end,btrim(p_name),nullif(btrim(p_description),''),false,v_actor,v_actor) returning * into v_row; return v_row; end; $$;

create or replace function public.rpc_admin_update_internal_access_profile(p_access_profile_id uuid,p_name text,p_description text,p_is_active boolean)
returns public.internal_access_profiles language plpgsql security definer set search_path = '' as $$ declare v_actor uuid; v_row public.internal_access_profiles; begin v_actor:=app_private.require_active_actor(); perform app_private.require_internal_capability('access.profiles.manage'); update public.internal_access_profiles set name=btrim(p_name),description=nullif(btrim(p_description),''),is_active=p_is_active,updated_by_user_id=v_actor,updated_at=timezone('utc',now()) where id=p_access_profile_id returning * into v_row; if v_row.id is null then raise exception 'internal access profile not found'; end if; return v_row; end; $$;

create or replace function public.rpc_admin_remove_internal_override(p_override_id uuid)
returns void language plpgsql security definer set search_path = '' as $$ begin perform app_private.require_active_actor(); perform app_private.require_internal_capability('access.permissions.manage'); delete from public.internal_user_capability_overrides where id=p_override_id; end; $$;

alter table public.internal_organizational_areas enable row level security;
create policy internal_org_areas_admin_read on public.internal_organizational_areas for select to authenticated using (app_private.has_internal_capability('access.view'));

revoke all on public.internal_organizational_areas from public, anon, authenticated, service_role;
revoke all on public.vw_admin_access_internal_users, public.vw_admin_access_invites, public.vw_admin_access_areas, public.vw_admin_access_functions, public.vw_admin_access_profiles, public.vw_admin_access_overrides, public.vw_admin_access_capabilities, public.vw_admin_access_profile_capabilities from public, anon, authenticated, service_role;
grant select on public.vw_admin_access_internal_users, public.vw_admin_access_invites, public.vw_admin_access_areas, public.vw_admin_access_functions, public.vw_admin_access_profiles, public.vw_admin_access_overrides, public.vw_admin_access_capabilities, public.vw_admin_access_profile_capabilities to authenticated, service_role;

grant execute on function public.rpc_admin_list_internal_access_users() to authenticated, service_role;
grant execute on function public.rpc_admin_get_internal_access_user(uuid) to authenticated, service_role;
grant execute on function public.rpc_admin_set_internal_user_status(uuid,boolean) to authenticated, service_role;
grant execute on function public.rpc_admin_update_internal_access_assignment(uuid,text,uuid,uuid) to authenticated, service_role;
grant execute on function public.rpc_admin_list_internal_invites() to authenticated, service_role;
grant execute on function public.rpc_admin_create_internal_invitation_v2(text,text,text,uuid,uuid,text,timestamptz) to authenticated, service_role;
grant execute on function public.rpc_admin_list_internal_areas() to authenticated, service_role;
grant execute on function public.rpc_admin_create_internal_area(text,text,text) to authenticated, service_role;
grant execute on function public.rpc_admin_update_internal_area(text,text,text,boolean,uuid) to authenticated, service_role;
grant execute on function public.rpc_admin_list_internal_functions() to authenticated, service_role;
grant execute on function public.rpc_admin_create_internal_function(text,text,text,uuid) to authenticated, service_role;
grant execute on function public.rpc_admin_update_internal_function(uuid,text,text,uuid,boolean) to authenticated, service_role;
grant execute on function public.rpc_admin_replace_internal_profile_capabilities(uuid,text[]) to authenticated, service_role;
grant execute on function public.rpc_admin_upsert_internal_override(uuid,text,public.internal_capability_effect,text,timestamptz) to authenticated, service_role;
grant execute on function public.rpc_admin_remove_internal_override(uuid) to authenticated, service_role;

comment on table public.internal_organizational_areas is 'Catalogo organizacional do control plane; distinto do catalogo de areas-alvo dos acionamentos legados.';
