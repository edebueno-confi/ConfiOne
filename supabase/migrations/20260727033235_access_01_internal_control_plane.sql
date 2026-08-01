-- ACCESS-01: control plane interno aditivo.
-- Mantem screenKeys/roles/memberships legados como compatibilidade e adiciona
-- contexto, capacidades, convites e allowlist de release no backend.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'internal_actor_type' and typnamespace = 'public'::regnamespace) then
    create type public.internal_actor_type as enum ('internal', 'customer');
  end if;
  if not exists (select 1 from pg_type where typname = 'internal_actor_context_status' and typnamespace = 'public'::regnamespace) then
    create type public.internal_actor_context_status as enum ('active', 'suspended', 'revoked');
  end if;
  if not exists (select 1 from pg_type where typname = 'internal_capability_effect' and typnamespace = 'public'::regnamespace) then
    create type public.internal_capability_effect as enum ('allow', 'deny');
  end if;
  if not exists (select 1 from pg_type where typname = 'internal_invitation_status' and typnamespace = 'public'::regnamespace) then
    create type public.internal_invitation_status as enum ('pending', 'sent', 'accepted', 'expired', 'revoked', 'failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'internal_release_stage' and typnamespace = 'public'::regnamespace) then
    create type public.internal_release_stage as enum ('released', 'internal_preview', 'disabled');
  end if;
end
$$;

create table if not exists public.user_actor_contexts (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_type public.internal_actor_type not null,
  is_primary boolean not null default false,
  status public.internal_actor_context_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles(id),
  updated_by_user_id uuid references public.profiles(id),
  unique (user_id, actor_type)
);
create unique index if not exists user_actor_contexts_primary_key
  on public.user_actor_contexts(user_id) where is_primary and status = 'active';

create table if not exists public.internal_functions (
  id uuid primary key default extensions.gen_random_uuid(),
  area_key text not null references public.internal_action_target_areas(area_key) on delete restrict,
  name text not null,
  description text,
  default_access_profile_id uuid references public.internal_access_profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles(id),
  updated_by_user_id uuid references public.profiles(id)
);
create unique index if not exists internal_functions_area_name_key on public.internal_functions(area_key, lower(name));

create table if not exists public.internal_capabilities (
  capability_key text primary key,
  display_name text not null,
  description text,
  domain text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint internal_capabilities_key_check check (capability_key = lower(capability_key) and capability_key ~ '^[a-z][a-z0-9_.]{1,127}$')
);

create table if not exists public.internal_role_capability_grants (
  id uuid primary key default extensions.gen_random_uuid(),
  role public.platform_role not null,
  capability_key text not null references public.internal_capabilities(capability_key) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique(role, capability_key)
);

create table if not exists public.internal_access_profile_capability_grants (
  id uuid primary key default extensions.gen_random_uuid(),
  access_profile_id uuid not null references public.internal_access_profiles(id) on delete cascade,
  capability_key text not null references public.internal_capabilities(capability_key) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique(access_profile_id, capability_key)
);

create table if not exists public.internal_user_capability_overrides (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  capability_key text not null references public.internal_capabilities(capability_key) on delete restrict,
  effect public.internal_capability_effect not null,
  justification text not null,
  valid_until timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  granted_by_user_id uuid not null references public.profiles(id),
  unique(user_id, capability_key)
);

create table if not exists public.internal_invites (
  id uuid primary key default extensions.gen_random_uuid(),
  email extensions.citext not null,
  full_name text not null,
  area_key text not null references public.internal_action_target_areas(area_key) on delete restrict,
  function_id uuid references public.internal_functions(id) on delete set null,
  access_profile_id uuid references public.internal_access_profiles(id) on delete set null,
  status public.internal_invitation_status not null default 'pending',
  token_hash text not null,
  expires_at timestamptz not null,
  invited_by_user_id uuid not null references public.profiles(id),
  accepted_by_user_id uuid references public.profiles(id),
  sent_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(token_hash)
);

alter table public.internal_screen_catalog
  add column if not exists release_enabled boolean not null default false,
  add column if not exists release_stage public.internal_release_stage not null default 'disabled',
  add column if not exists release_reason text;

create table if not exists public.internal_screen_capability_requirements (
  screen_key text not null references public.internal_screen_catalog(screen_key) on delete cascade,
  capability_key text not null references public.internal_capabilities(capability_key) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key(screen_key, capability_key)
);

insert into public.internal_capabilities(capability_key, display_name, description, domain)
values
  ('analytics.view', 'Ver Dashboard', 'Consultar as visões executiva, comercial, CS e financeira.', 'analytics'),
  ('analytics.executive.view', 'Ver visão executiva', null, 'analytics'),
  ('analytics.commercial.view', 'Ver comercial', null, 'analytics'),
  ('analytics.cs.view', 'Ver CS e suporte', null, 'analytics'),
  ('analytics.finance.view', 'Ver financeiro', null, 'analytics'),
  ('analytics.configure', 'Configurar Analytics', null, 'analytics'),
  ('analytics.sync', 'Executar sincronização', null, 'analytics'),
  ('analytics.logs.view', 'Ver logs técnicos', null, 'analytics'),
  ('analytics.export', 'Exportar relatório', null, 'analytics'),
  ('knowledge.view', 'Consultar conhecimento', null, 'knowledge'),
  ('knowledge.create', 'Criar artigo', null, 'knowledge'),
  ('knowledge.edit', 'Editar artigo', null, 'knowledge'),
  ('knowledge.review', 'Revisar artigo', null, 'knowledge'),
  ('knowledge.publish', 'Publicar artigo', null, 'knowledge'),
  ('knowledge.configure', 'Configurar conteúdo', null, 'knowledge'),
  ('access.view', 'Consultar acessos', null, 'access'),
  ('access.users.manage', 'Gerenciar usuários internos', null, 'access'),
  ('access.invites.manage', 'Gerenciar convites', null, 'access'),
  ('access.areas.manage', 'Gerenciar áreas', null, 'access'),
  ('access.functions.manage', 'Gerenciar funções', null, 'access'),
  ('access.profiles.manage', 'Gerenciar perfis', null, 'access'),
  ('access.permissions.manage', 'Gerenciar permissões', null, 'access'),
  ('settings.view', 'Consultar configurações', null, 'settings'),
  ('settings.analytics.manage', 'Gerenciar configurações de Analytics', null, 'settings'),
  ('screen.home.view', 'Abrir início', null, 'workspace'),
  ('screen.support.view', 'Abrir suporte', null, 'workspace'),
  ('screen.customers.view', 'Abrir clientes', null, 'workspace'),
  ('screen.internal_actions.view', 'Abrir acionamentos', null, 'workspace'),
  ('screen.product.view', 'Abrir Produto', null, 'workspace'),
  ('screen.system.view', 'Abrir sistema', null, 'administration')
on conflict (capability_key) do update set display_name = excluded.display_name, domain = excluded.domain, is_active = true;

insert into public.internal_screen_catalog(screen_key, display_name, route_path, category, sort_order, release_enabled, release_stage, release_reason)
values
  ('analytics', 'Dashboard gerencial', '/admin/analytics', 'intelligence', 120, true, 'released', 'Superfície operacional do MVP'),
  ('settings', 'Configurações', '/admin/settings', 'administration', 180, true, 'released', 'Configurações do Dashboard'),
  ('knowledge', 'Conhecimento', '/admin/knowledge', 'administration', 190, true, 'released', 'Gestão da Central de Ajuda'),
  ('access', 'Acessos', '/admin/access', 'administration', 160, true, 'released', 'Control plane interno')
on conflict (screen_key) do update set release_enabled = excluded.release_enabled, release_stage = excluded.release_stage, release_reason = excluded.release_reason;

insert into public.internal_screen_capability_requirements(screen_key, capability_key)
values
  ('analytics', 'analytics.view'), ('settings', 'settings.view'), ('knowledge', 'knowledge.view'), ('access', 'access.view'),
  ('home', 'screen.home.view'), ('support_inbox', 'screen.support.view'), ('support_queue', 'screen.support.view'),
  ('support_tickets', 'screen.support.view'), ('customers_b2b', 'screen.customers.view'), ('internal_actions', 'screen.internal_actions.view'),
  ('product', 'screen.product.view'), ('system', 'screen.system.view')
on conflict do nothing;

insert into public.internal_role_capability_grants(role, capability_key)
select r.role, c.capability_key
from (values
  ('platform_admin'::public.platform_role, 'analytics.view'),
  ('platform_admin'::public.platform_role, 'analytics.executive.view'),
  ('platform_admin'::public.platform_role, 'analytics.commercial.view'),
  ('platform_admin'::public.platform_role, 'analytics.cs.view'),
  ('platform_admin'::public.platform_role, 'analytics.finance.view'),
  ('platform_admin'::public.platform_role, 'analytics.configure'),
  ('platform_admin'::public.platform_role, 'analytics.sync'),
  ('platform_admin'::public.platform_role, 'analytics.logs.view'),
  ('platform_admin'::public.platform_role, 'analytics.export'),
  ('platform_admin'::public.platform_role, 'knowledge.view'),
  ('platform_admin'::public.platform_role, 'knowledge.create'),
  ('platform_admin'::public.platform_role, 'knowledge.edit'),
  ('platform_admin'::public.platform_role, 'knowledge.review'),
  ('platform_admin'::public.platform_role, 'knowledge.publish'),
  ('platform_admin'::public.platform_role, 'knowledge.configure'),
  ('platform_admin'::public.platform_role, 'access.view'),
  ('platform_admin'::public.platform_role, 'access.users.manage'),
  ('platform_admin'::public.platform_role, 'access.invites.manage'),
  ('platform_admin'::public.platform_role, 'access.areas.manage'),
  ('platform_admin'::public.platform_role, 'access.functions.manage'),
  ('platform_admin'::public.platform_role, 'access.profiles.manage'),
  ('platform_admin'::public.platform_role, 'access.permissions.manage'),
  ('platform_admin'::public.platform_role, 'settings.view'),
  ('platform_admin'::public.platform_role, 'settings.analytics.manage'),
  ('analytics_admin'::public.platform_role, 'analytics.view'),
  ('analytics_admin'::public.platform_role, 'analytics.executive.view'),
  ('analytics_admin'::public.platform_role, 'analytics.commercial.view'),
  ('analytics_admin'::public.platform_role, 'analytics.cs.view'),
  ('analytics_admin'::public.platform_role, 'analytics.finance.view'),
  ('analytics_admin'::public.platform_role, 'analytics.configure'),
  ('analytics_admin'::public.platform_role, 'settings.view'),
  ('analytics_admin'::public.platform_role, 'settings.analytics.manage'),
  ('dashboard_viewer'::public.platform_role, 'analytics.view'),
  ('dashboard_viewer'::public.platform_role, 'analytics.executive.view'),
  ('dashboard_viewer'::public.platform_role, 'analytics.commercial.view'),
  ('dashboard_viewer'::public.platform_role, 'analytics.cs.view'),
  ('dashboard_viewer'::public.platform_role, 'analytics.finance.view'),
  ('dashboard_viewer'::public.platform_role, 'analytics.export'),
  ('knowledge_manager'::public.platform_role, 'knowledge.view'),
  ('knowledge_manager'::public.platform_role, 'knowledge.create'),
  ('knowledge_manager'::public.platform_role, 'knowledge.edit'),
  ('knowledge_manager'::public.platform_role, 'knowledge.review'),
  ('knowledge_manager'::public.platform_role, 'knowledge.publish'),
  ('access_admin'::public.platform_role, 'access.view'),
  ('access_admin'::public.platform_role, 'access.users.manage'),
  ('access_admin'::public.platform_role, 'access.invites.manage'),
  ('access_admin'::public.platform_role, 'access.areas.manage'),
  ('access_admin'::public.platform_role, 'access.functions.manage'),
  ('access_admin'::public.platform_role, 'access.profiles.manage'),
  ('access_admin'::public.platform_role, 'access.permissions.manage')
) as r(role, capability_key)
join public.internal_capabilities c using (capability_key)
on conflict do nothing;

insert into public.internal_access_profiles(area_key, name, description, is_system)
values
  (null, 'Administrador de Analytics', 'Administra o Dashboard e suas integrações.', true),
  (null, 'Visualizador do Dashboard', 'Consulta as quatro visões do Dashboard em modo somente leitura.', true),
  (null, 'Gestor de Conhecimento', 'Cria, revisa e publica artigos da Central.', true),
  (null, 'Editor de Conhecimento', 'Cria e edita artigos sem publicar.', true),
  (null, 'Administrador de Acessos', 'Administra usuários, convites, áreas, funções e permissões.', true)
on conflict do nothing;

insert into public.internal_access_profile_capability_grants(access_profile_id, capability_key)
select p.id, c.capability_key
from public.internal_access_profiles p
join public.internal_capabilities c on c.capability_key = any(case
  when p.name = 'Administrador de Analytics' then array['analytics.view','analytics.executive.view','analytics.commercial.view','analytics.cs.view','analytics.finance.view','analytics.configure','analytics.sync','analytics.logs.view','analytics.export','settings.view','settings.analytics.manage']
  when p.name = 'Visualizador do Dashboard' then array['analytics.view','analytics.executive.view','analytics.commercial.view','analytics.cs.view','analytics.finance.view','analytics.export']
  when p.name = 'Gestor de Conhecimento' then array['knowledge.view','knowledge.create','knowledge.edit','knowledge.review','knowledge.publish','knowledge.configure']
  when p.name = 'Editor de Conhecimento' then array['knowledge.view','knowledge.create','knowledge.edit']
  when p.name = 'Administrador de Acessos' then array['access.view','access.users.manage','access.invites.manage','access.areas.manage','access.functions.manage','access.profiles.manage','access.permissions.manage']
  else array[]::text[] end)
where p.is_system and p.area_key is null
on conflict do nothing;

-- Compatibilidade: usuários internos que já tinham papel global recebem o
-- contexto explícito sem converter memberships de clientes.
insert into public.user_actor_contexts(user_id, actor_type, is_primary, status, created_by_user_id, updated_by_user_id)
select distinct r.user_id, 'internal'::public.internal_actor_type, true, 'active'::public.internal_actor_context_status, r.user_id, r.user_id
from public.user_global_roles r
where r.role in (
  'platform_admin'::public.platform_role, 'dashboard_viewer'::public.platform_role,
  'support_agent'::public.platform_role, 'support_manager'::public.platform_role,
  'engineering_member'::public.platform_role, 'engineering_manager'::public.platform_role,
  'knowledge_manager'::public.platform_role, 'audit_reviewer'::public.platform_role,
  'analytics_admin'::public.platform_role, 'access_admin'::public.platform_role
)
on conflict (user_id, actor_type) do update set status = 'active', is_primary = true, updated_at = timezone('utc', now());

create or replace function app_private.ensure_internal_context_for_global_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role in (
    'platform_admin'::public.platform_role, 'dashboard_viewer'::public.platform_role,
    'support_agent'::public.platform_role, 'support_manager'::public.platform_role,
    'engineering_member'::public.platform_role, 'engineering_manager'::public.platform_role,
    'knowledge_manager'::public.platform_role, 'audit_reviewer'::public.platform_role,
    'analytics_admin'::public.platform_role, 'access_admin'::public.platform_role
  ) then
    insert into public.user_actor_contexts(user_id, actor_type, is_primary, status, created_by_user_id, updated_by_user_id)
    values(new.user_id, 'internal', true, 'active', new.user_id, new.user_id)
    on conflict (user_id, actor_type) do update set status='active', is_primary=true, updated_at=timezone('utc', now());
  end if;
  return new;
end;
$$;
drop trigger if exists user_global_roles_internal_context on public.user_global_roles;
create trigger user_global_roles_internal_context after insert or update of role on public.user_global_roles
for each row execute function app_private.ensure_internal_context_for_global_role();

create or replace function app_private.has_internal_capability(p_capability_key text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.is_active
      and exists (
        select 1 from public.user_actor_contexts c
        where c.user_id = p.id and c.actor_type = 'internal'::public.internal_actor_type
          and c.status = 'active'::public.internal_actor_context_status
      )
      and not exists (
        select 1 from public.internal_user_capability_overrides o
        where o.user_id = p.id and o.capability_key = p_capability_key and o.effect = 'deny'::public.internal_capability_effect
          and (o.valid_until is null or o.valid_until > timezone('utc', now()))
      )
      and (
        exists (select 1 from public.user_global_roles r join public.internal_role_capability_grants g using(role)
                where r.user_id = p.id and g.capability_key = p_capability_key)
        or exists (select 1 from public.internal_area_memberships m
                   join public.internal_access_profile_capability_grants g on g.access_profile_id = m.access_profile_id
                   where m.user_id = p.id and m.status = 'active'::public.internal_area_membership_status
                     and m.permission_mode = 'profile'::public.internal_permission_mode and g.capability_key = p_capability_key)
        or exists (select 1 from public.internal_user_capability_overrides o
                   where o.user_id = p.id and o.capability_key = p_capability_key and o.effect = 'allow'::public.internal_capability_effect
                     and (o.valid_until is null or o.valid_until > timezone('utc', now())))
      )
  );
$$;

create or replace function app_private.require_internal_capability(p_capability_key text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not app_private.has_internal_capability(p_capability_key) then
    raise exception 'internal capability denied: %', p_capability_key using errcode = '42501';
  end if;
end;
$$;

create or replace view public.vw_internal_actor_capability_context
with (security_barrier = true) as
select c.capability_key, c.display_name, c.domain,
       case when exists (select 1 from public.internal_user_capability_overrides o where o.user_id = auth.uid() and o.capability_key = c.capability_key and o.effect = 'deny'::public.internal_capability_effect) then 'deny' else 'allow' end as effective_effect
from public.internal_capabilities c
where c.is_active and app_private.has_internal_capability(c.capability_key);

create or replace view public.vw_internal_actor_workspace_context
with (security_barrier = true) as
select distinct auth.uid() actor_user_id, null::uuid tenant_id, null::text area_key,
  null::public.internal_area_membership_role area_role, 'global_role'::text permission_source,
  s.screen_key, s.display_name, s.route_path, s.category, s.sort_order
from public.internal_screen_catalog s
join public.internal_role_screen_grants g on g.screen_key = s.screen_key
join public.user_global_roles r on r.role = g.role and r.user_id = auth.uid()
where s.is_active and s.release_enabled and app_private.has_internal_capability(coalesce((select min(requirement.capability_key) from public.internal_screen_capability_requirements requirement where requirement.screen_key=s.screen_key), 'screen.' || s.screen_key || '.view'))
union all
select distinct auth.uid(), m.tenant_id, m.area_key, m.role, 'area_membership'::text,
  s.screen_key, s.display_name, s.route_path, s.category, s.sort_order
from public.internal_area_memberships m
join public.internal_area_membership_screen_grants g on g.membership_id = m.id
join public.internal_screen_catalog s on s.screen_key = g.screen_key
where m.user_id = auth.uid() and m.status = 'active'::public.internal_area_membership_status
  and s.is_active and s.release_enabled and app_private.has_internal_capability(coalesce((select min(requirement.capability_key) from public.internal_screen_capability_requirements requirement where requirement.screen_key=s.screen_key), 'screen.' || s.screen_key || '.view'));

create or replace view public.vw_admin_internal_invites
with (security_barrier = true) as
select i.id, i.email, i.full_name, i.area_key, area.display_name area_label, i.function_id, f.name function_name,
  i.access_profile_id, p.name access_profile_name, i.status, i.expires_at, i.sent_at, i.accepted_at, i.revoked_at,
  i.created_at, i.updated_at, true can_manage
from public.internal_invites i
join public.internal_action_target_areas area on area.area_key=i.area_key
left join public.internal_functions f on f.id=i.function_id
left join public.internal_access_profiles p on p.id=i.access_profile_id
where app_private.has_internal_capability('access.view');

create or replace function public.rpc_admin_create_internal_invitation(
  p_email text, p_full_name text, p_area_key text, p_function_id uuid, p_access_profile_id uuid,
  p_token_hash text, p_expires_at timestamptz
) returns public.internal_invites language plpgsql security definer set search_path = '' as $$
declare v_actor uuid; v_row public.internal_invites;
begin
  v_actor := app_private.current_user_id(); perform app_private.require_internal_capability('access.invites.manage');
  if p_token_hash is null or length(p_token_hash) < 32 then raise exception 'invite token hash is required'; end if;
  if p_expires_at <= timezone('utc', now()) then raise exception 'invite expiry must be in the future'; end if;
  insert into public.internal_invites(email, full_name, area_key, function_id, access_profile_id, token_hash, expires_at, invited_by_user_id)
  values (lower(btrim(p_email)), btrim(p_full_name), p_area_key, p_function_id, p_access_profile_id, p_token_hash, p_expires_at, v_actor)
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.rpc_admin_revoke_internal_invitation(p_invite_id uuid)
returns public.internal_invites language plpgsql security definer set search_path = '' as $$
declare v_row public.internal_invites;
begin
  perform app_private.require_internal_capability('access.invites.manage');
  update public.internal_invites set status='revoked', revoked_at=timezone('utc', now()), updated_at=timezone('utc', now())
  where id=p_invite_id and status in ('pending','sent') returning * into v_row;
  if v_row.id is null then raise exception 'invite not found or not revocable'; end if;
  return v_row;
end;
$$;

create or replace function public.rpc_accept_internal_invitation(p_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_invite public.internal_invites; v_user uuid; v_tenant uuid;
begin
  v_user := auth.uid();
  if v_user is null then raise exception 'authenticated user required' using errcode = '42501'; end if;
  select * into v_invite from public.internal_invites
  where token_hash = p_token_hash and status in ('pending','sent') and expires_at > timezone('utc', now())
  for update;
  if v_invite.id is null then raise exception 'invite invalid, expired or revoked'; end if;
  if lower((select email from auth.users where id=v_user)) <> lower(v_invite.email::text) then raise exception 'invite email mismatch' using errcode = '42501'; end if;
  insert into public.user_actor_contexts(user_id, actor_type, is_primary, status, created_by_user_id, updated_by_user_id)
  values(v_user, 'internal', true, 'active', v_user, v_user)
  on conflict (user_id, actor_type) do update set status='active', is_primary=true, updated_at=timezone('utc', now());
  insert into public.tenants(slug, legal_name, display_name, status, data_region, created_by_user_id, updated_by_user_id)
  values('genius-internal', 'Genius Returns', 'Operação interna Genius Returns', 'active', 'sa-east-1', v_user, v_user)
  on conflict (lower(slug)) do update set status='active' returning id into v_tenant;
  if v_tenant is null then select id into v_tenant from public.tenants where slug='genius-internal'; end if;
  insert into public.tenant_memberships(tenant_id, user_id, role, status, created_by_user_id, updated_by_user_id)
  values(v_tenant, v_user, 'tenant_viewer', 'active', v_user, v_user)
  on conflict (tenant_id,user_id) do update set status='active';
  insert into public.internal_area_memberships(tenant_id, user_id, area_key, role, status, access_profile_id, permission_mode, created_by_user_id, updated_by_user_id)
  values(v_tenant, v_user, v_invite.area_key, 'member', 'active', v_invite.access_profile_id, case when v_invite.access_profile_id is null then 'custom' else 'profile' end::public.internal_permission_mode, v_user, v_user)
  on conflict (tenant_id,user_id,area_key) do update set status='active', access_profile_id=excluded.access_profile_id, permission_mode=excluded.permission_mode;
  update public.internal_invites set status='accepted', accepted_by_user_id=v_user, accepted_at=timezone('utc', now()), updated_at=timezone('utc', now()) where id=v_invite.id;
  return jsonb_build_object('invite_id', v_invite.id, 'status', 'accepted');
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['user_actor_contexts','internal_functions','internal_role_capability_grants','internal_access_profile_capability_grants','internal_user_capability_overrides','internal_invites'] loop
    execute format('drop trigger if exists %I_audit_row_change on public.%I', t, t);
    execute format('create trigger %I_audit_row_change after insert or update or delete on public.%I for each row execute function audit.capture_row_change()', t, t);
  end loop;
end $$;

alter table public.user_actor_contexts enable row level security;
alter table public.internal_functions enable row level security;
alter table public.internal_capabilities enable row level security;
alter table public.internal_role_capability_grants enable row level security;
alter table public.internal_access_profile_capability_grants enable row level security;
alter table public.internal_user_capability_overrides enable row level security;
alter table public.internal_invites enable row level security;
alter table public.internal_screen_capability_requirements enable row level security;

create policy user_actor_contexts_self_or_admin on public.user_actor_contexts for select to authenticated using (user_id=auth.uid() or app_private.has_global_role('platform_admin'::public.platform_role));
create policy access_control_admin_read on public.internal_functions for select to authenticated using (app_private.has_internal_capability('access.view'));
create policy capabilities_admin_read on public.internal_capabilities for select to authenticated using (app_private.has_internal_capability('access.view'));
create policy overrides_admin_read on public.internal_user_capability_overrides for select to authenticated using (app_private.has_internal_capability('access.permissions.manage'));
create policy invites_admin_read on public.internal_invites for select to authenticated using (app_private.has_internal_capability('access.view'));

revoke all on public.user_actor_contexts, public.internal_functions, public.internal_capabilities, public.internal_role_capability_grants, public.internal_access_profile_capability_grants, public.internal_user_capability_overrides, public.internal_invites, public.internal_screen_capability_requirements from public, anon, authenticated, service_role;
revoke all on public.vw_internal_actor_capability_context, public.vw_admin_internal_invites from public, anon, authenticated, service_role;
revoke all on function app_private.has_internal_capability(text) from public;
revoke all on function app_private.ensure_internal_context_for_global_role() from public, anon, authenticated, service_role;
grant execute on function app_private.ensure_internal_context_for_global_role() to service_role;
revoke all on function app_private.require_internal_capability(text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_create_internal_invitation(text,text,text,uuid,uuid,text,timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_revoke_internal_invitation(uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_accept_internal_invitation(text) from public, anon, authenticated, service_role;
grant execute on function app_private.has_internal_capability(text) to service_role;
grant execute on function app_private.require_internal_capability(text) to service_role;
grant select on public.vw_internal_actor_capability_context, public.vw_admin_internal_invites to authenticated, service_role;
grant execute on function public.rpc_admin_create_internal_invitation(text,text,text,uuid,uuid,text,timestamptz) to authenticated, service_role;
grant execute on function public.rpc_admin_revoke_internal_invitation(uuid) to authenticated, service_role;
grant execute on function public.rpc_accept_internal_invitation(text) to authenticated, service_role;

comment on table public.user_actor_contexts is 'Contexto explicito interno ou cliente; ausencia de contexto interno nega acesso ao shell.';
comment on table public.internal_invites is 'Convites internos; somente hash do token e metadados auditaveis sao persistidos.';
comment on view public.vw_internal_actor_workspace_context is 'Fonte backend de telas liberadas e autorizadas, filtrada por capacidades e release allowlist.';
