-- Contrato canônico de perfil operacional: identidade, área/função e telas.
-- Não cria uma segunda tabela de usuários nem substitui internal_area_memberships.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'internal_screen_category'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.internal_screen_category as enum (
      'workspace',
      'intelligence',
      'administration'
    );
  end if;
end
$$;

create table if not exists public.internal_screen_catalog (
  screen_key text primary key,
  display_name text not null,
  route_path text not null unique,
  category public.internal_screen_category not null,
  sort_order integer not null default 0,
  is_system boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint internal_screen_catalog_key_format_check
    check (screen_key = lower(screen_key) and screen_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint internal_screen_catalog_display_name_not_blank_check
    check (btrim(display_name) <> ''),
  constraint internal_screen_catalog_route_path_check
    check (route_path like '/%'),
  constraint internal_screen_catalog_sort_order_nonnegative_check
    check (sort_order >= 0)
);

create table if not exists public.internal_area_membership_screen_grants (
  id uuid primary key default extensions.gen_random_uuid(),
  membership_id uuid not null references public.internal_area_memberships (id) on delete cascade,
  screen_key text not null references public.internal_screen_catalog (screen_key) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles (id),
  updated_by_user_id uuid references public.profiles (id),
  unique (membership_id, screen_key)
);

-- Perfis nomeados permitem reutilizar uma função de operação (por exemplo,
-- "CS Gestor" ou "QA - Dashboard") sem transformar cada exceção em papel global.
do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'internal_permission_mode'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.internal_permission_mode as enum ('custom', 'profile');
  end if;
end
$$;

create table if not exists public.internal_access_profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  area_key text references public.internal_action_target_areas (area_key) on delete restrict,
  name text not null,
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles (id),
  updated_by_user_id uuid references public.profiles (id),
  constraint internal_access_profiles_name_not_blank_check
    check (nullif(btrim(name), '') is not null),
  constraint internal_access_profiles_description_length_check
    check (description is null or length(description) <= 500)
);

create unique index if not exists internal_access_profiles_scope_name_key
  on public.internal_access_profiles (coalesce(area_key, ''), lower(name));

create table if not exists public.internal_access_profile_screen_grants (
  id uuid primary key default extensions.gen_random_uuid(),
  access_profile_id uuid not null references public.internal_access_profiles (id) on delete cascade,
  screen_key text not null references public.internal_screen_catalog (screen_key) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles (id),
  updated_by_user_id uuid references public.profiles (id),
  unique (access_profile_id, screen_key)
);

alter table public.internal_area_memberships
  add column if not exists access_profile_id uuid
    references public.internal_access_profiles (id) on delete set null,
  add column if not exists permission_mode public.internal_permission_mode
    not null default 'custom'::public.internal_permission_mode;

create index if not exists internal_access_profiles_area_idx
  on public.internal_access_profiles (area_key, is_active, lower(name));

create index if not exists internal_access_profile_screen_grants_profile_idx
  on public.internal_access_profile_screen_grants (access_profile_id, screen_key);

create index if not exists internal_area_memberships_access_profile_idx
  on public.internal_area_memberships (access_profile_id, permission_mode, status);

alter table public.internal_access_profiles enable row level security;
alter table public.internal_access_profile_screen_grants enable row level security;

drop policy if exists internal_access_profiles_admin_read on public.internal_access_profiles;
create policy internal_access_profiles_admin_read
on public.internal_access_profiles
for select to authenticated
using (app_private.has_global_role('platform_admin'::public.platform_role));

drop policy if exists internal_access_profile_screen_grants_admin_read on public.internal_access_profile_screen_grants;
create policy internal_access_profile_screen_grants_admin_read
on public.internal_access_profile_screen_grants
for select to authenticated
using (app_private.has_global_role('platform_admin'::public.platform_role));

create or replace view public.vw_admin_internal_access_profiles
with (security_barrier = true)
as
  select
    profile.id as access_profile_id,
    profile.area_key,
    area.display_name as area_label,
    profile.name,
    profile.description,
    profile.is_system,
    profile.is_active,
    count(grant_row.screen_key)::integer as screen_count,
    profile.created_at,
    profile.updated_at,
    app_private.has_global_role('platform_admin'::public.platform_role) as can_manage
  from public.internal_access_profiles as profile
  left join public.internal_action_target_areas as area
    on area.area_key = profile.area_key
  left join public.internal_access_profile_screen_grants as grant_row
    on grant_row.access_profile_id = profile.id
  where app_private.has_global_role('platform_admin'::public.platform_role)
  group by profile.id, area.display_name;

create or replace view public.vw_admin_internal_access_profile_screen_grants
with (security_barrier = true)
as
  select
    grant_row.id as grant_id,
    grant_row.access_profile_id,
    profile.area_key,
    profile.name as access_profile_name,
    grant_row.screen_key,
    screen.display_name as screen_display_name,
    screen.route_path,
    screen.category,
    grant_row.created_at,
    grant_row.updated_at
  from public.internal_access_profile_screen_grants as grant_row
  join public.internal_access_profiles as profile
    on profile.id = grant_row.access_profile_id
  join public.internal_screen_catalog as screen
    on screen.screen_key = grant_row.screen_key
  where app_private.has_global_role('platform_admin'::public.platform_role);

-- Perfis iniciais são templates de operação, não permissões implícitas.
insert into public.internal_access_profiles (area_key, name, description, is_system)
values
  ('customer_success', 'CS · Gestor', 'Acompanha carteira, gestão e indicadores de Customer Success.', true),
  ('customer_success', 'CS · Operador', 'Executa a rotina operacional de Customer Success.', true),
  ('finance', 'Financeiro · Gestor', 'Acompanha visão gerencial e operação financeira.', true),
  ('product', 'Produto · Operador', 'Acompanha acionamentos e rotina de Produto.', true),
  (null, 'QA · Dashboard e conhecimento', 'Acesso controlado para validação do dashboard e da central de conhecimento.', true)
on conflict do nothing;

insert into public.internal_access_profile_screen_grants (access_profile_id, screen_key)
select profile.id, screen.screen_key
from public.internal_access_profiles as profile
cross join public.internal_screen_catalog as screen
where (
  (profile.name = 'CS · Gestor' and screen.screen_key in ('home', 'analytics', 'cs_portfolio', 'customers_b2b'))
  or (profile.name = 'CS · Operador' and screen.screen_key in ('home', 'support_inbox', 'support_queue', 'support_tickets', 'customers_b2b', 'internal_actions'))
  or (profile.name = 'Financeiro · Gestor' and screen.screen_key in ('home', 'analytics'))
  or (profile.name = 'Produto · Operador' and screen.screen_key in ('home', 'internal_actions', 'product'))
  or (profile.name = 'QA · Dashboard e conhecimento' and screen.screen_key in ('home', 'analytics', 'knowledge', 'product_docs'))
)
on conflict (access_profile_id, screen_key) do nothing;

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
    (iam.status <> 'archived'::public.internal_area_membership_status) as can_archive,
    iam.access_profile_id,
    access_profile.name as access_profile_name,
    iam.permission_mode
  from public.internal_area_memberships as iam
  join public.tenants as tenant on tenant.id = iam.tenant_id
  join public.internal_action_target_areas as area on area.area_key = iam.area_key
  join public.profiles as profile on profile.id = iam.user_id
  left join public.profiles as created_by on created_by.id = iam.created_by_user_id
  left join public.profiles as updated_by on updated_by.id = iam.updated_by_user_id
  left join public.internal_access_profiles as access_profile
    on access_profile.id = iam.access_profile_id
  where app_private.has_global_role('platform_admin'::public.platform_role);

create index if not exists internal_area_membership_screen_grants_membership_idx
  on public.internal_area_membership_screen_grants (membership_id, screen_key);

create table if not exists public.internal_role_screen_grants (
  id uuid primary key default extensions.gen_random_uuid(),
  role public.platform_role not null,
  screen_key text not null references public.internal_screen_catalog (screen_key) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles (id),
  updated_by_user_id uuid references public.profiles (id),
  unique (role, screen_key)
);

create index if not exists internal_role_screen_grants_role_idx
  on public.internal_role_screen_grants (role, screen_key);

alter table public.internal_screen_catalog enable row level security;
alter table public.internal_area_membership_screen_grants enable row level security;
alter table public.internal_role_screen_grants enable row level security;

drop policy if exists internal_screen_catalog_admin_read on public.internal_screen_catalog;
create policy internal_screen_catalog_admin_read
on public.internal_screen_catalog
for select to authenticated
using (app_private.has_global_role('platform_admin'::public.platform_role));

drop policy if exists internal_area_membership_screen_grants_admin_read on public.internal_area_membership_screen_grants;
create policy internal_area_membership_screen_grants_admin_read
on public.internal_area_membership_screen_grants
for select to authenticated
using (app_private.has_global_role('platform_admin'::public.platform_role));

drop policy if exists internal_role_screen_grants_admin_read on public.internal_role_screen_grants;
create policy internal_role_screen_grants_admin_read
on public.internal_role_screen_grants
for select to authenticated
using (app_private.has_global_role('platform_admin'::public.platform_role));

insert into public.internal_screen_catalog (
  screen_key,
  display_name,
  route_path,
  category,
  sort_order
)
values
  ('home', 'Início', '/inicio', 'workspace', 10),
  ('support_inbox', 'Atendimento', '/support/inbox', 'workspace', 20),
  ('support_queue', 'Fila operacional', '/support/queue', 'workspace', 30),
  ('support_tickets', 'Tickets', '/support/tickets', 'workspace', 40),
  ('customers_b2b', 'Clientes B2B', '/support/clientes', 'workspace', 50),
  ('cs_portfolio', 'Carteira CS', '/cs/portfolio', 'workspace', 60),
  ('internal_actions', 'Acionamentos', '/internal-actions', 'workspace', 70),
  ('product', 'Produto', '/engineering', 'workspace', 80),
  ('admin_overview', 'Visão geral', '/admin/visao-geral', 'administration', 110),
  ('analytics', 'Dashboard gerencial', '/admin/analytics', 'intelligence', 120),
  ('tenants', 'Contas B2B', '/admin/tenants', 'administration', 130),
  ('customer_portal_admin', 'Portal do cliente', '/admin/customer-portal', 'administration', 140),
  ('internal_areas', 'Áreas internas', '/admin/internal-areas', 'administration', 150),
  ('access', 'Acessos', '/admin/access', 'administration', 160),
  ('system', 'Sistema', '/admin/system', 'administration', 170),
  ('settings', 'Configurações', '/admin/settings', 'administration', 180),
  ('knowledge', 'Conhecimento', '/admin/knowledge', 'administration', 190),
  ('product_docs', 'Documentos', '/admin/product-docs', 'administration', 200)
on conflict (screen_key) do update
set
  display_name = excluded.display_name,
  route_path = excluded.route_path,
  category = excluded.category,
  sort_order = excluded.sort_order,
  is_system = true,
  is_active = true,
  updated_at = timezone('utc', now());

-- Compatibilidade controlada para papéis globais já existentes.
-- Financeiro não vira papel global: usa membership de área + grants de tela.
insert into public.internal_role_screen_grants (role, screen_key)
select roles.role, screens.screen_key
from (
  values
    ('platform_admin'::public.platform_role),
    ('support_agent'::public.platform_role),
    ('support_manager'::public.platform_role),
    ('engineering_member'::public.platform_role),
    ('engineering_manager'::public.platform_role),
    ('knowledge_manager'::public.platform_role),
    ('audit_reviewer'::public.platform_role),
    ('dashboard_viewer'::public.platform_role)
) as roles(role)
cross join lateral (
  select screen_key
  from public.internal_screen_catalog
  where (
    roles.role = 'platform_admin'::public.platform_role
    or (
      roles.role in ('support_agent'::public.platform_role, 'support_manager'::public.platform_role)
      and screen_key in ('home', 'support_inbox', 'support_queue', 'support_tickets', 'customers_b2b', 'internal_actions')
    )
    or (
      roles.role in ('engineering_member'::public.platform_role, 'engineering_manager'::public.platform_role)
      and screen_key in ('home', 'internal_actions', 'product')
    )
    or (
      roles.role = 'knowledge_manager'::public.platform_role
      and screen_key in ('home', 'knowledge')
    )
    or (
      roles.role = 'audit_reviewer'::public.platform_role
      and screen_key in ('home', 'system')
    )
    or (
      roles.role = 'dashboard_viewer'::public.platform_role
      and screen_key in ('home', 'analytics', 'customer_portal_admin', 'knowledge', 'settings')
    )
  )
) as screens
on conflict (role, screen_key) do nothing;

create or replace function app_private.touch_internal_screen_access_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists internal_screen_catalog_touch_updated_at on public.internal_screen_catalog;
create trigger internal_screen_catalog_touch_updated_at
before update on public.internal_screen_catalog
for each row execute function app_private.touch_internal_screen_access_updated_at();

drop trigger if exists internal_area_membership_screen_grants_touch_updated_at on public.internal_area_membership_screen_grants;
create trigger internal_area_membership_screen_grants_touch_updated_at
before update on public.internal_area_membership_screen_grants
for each row execute function app_private.touch_internal_screen_access_updated_at();

drop trigger if exists internal_role_screen_grants_touch_updated_at on public.internal_role_screen_grants;
create trigger internal_role_screen_grants_touch_updated_at
before update on public.internal_role_screen_grants
for each row execute function app_private.touch_internal_screen_access_updated_at();

drop trigger if exists internal_access_profiles_touch_updated_at on public.internal_access_profiles;
create trigger internal_access_profiles_touch_updated_at
before update on public.internal_access_profiles
for each row execute function app_private.touch_internal_screen_access_updated_at();

drop trigger if exists internal_access_profile_screen_grants_touch_updated_at on public.internal_access_profile_screen_grants;
create trigger internal_access_profile_screen_grants_touch_updated_at
before update on public.internal_access_profile_screen_grants
for each row execute function app_private.touch_internal_screen_access_updated_at();

drop trigger if exists internal_screen_catalog_audit_row_change on public.internal_screen_catalog;
create trigger internal_screen_catalog_audit_row_change
after insert or update or delete on public.internal_screen_catalog
for each row execute function audit.capture_row_change();

drop trigger if exists internal_area_membership_screen_grants_audit_row_change on public.internal_area_membership_screen_grants;
create trigger internal_area_membership_screen_grants_audit_row_change
after insert or update or delete on public.internal_area_membership_screen_grants
for each row execute function audit.capture_row_change();

drop trigger if exists internal_role_screen_grants_audit_row_change on public.internal_role_screen_grants;
create trigger internal_role_screen_grants_audit_row_change
after insert or update or delete on public.internal_role_screen_grants
for each row execute function audit.capture_row_change();

drop trigger if exists internal_access_profiles_audit_row_change on public.internal_access_profiles;
create trigger internal_access_profiles_audit_row_change
after insert or update or delete on public.internal_access_profiles
for each row execute function audit.capture_row_change();

drop trigger if exists internal_access_profile_screen_grants_audit_row_change on public.internal_access_profile_screen_grants;
create trigger internal_access_profile_screen_grants_audit_row_change
after insert or update or delete on public.internal_access_profile_screen_grants
for each row execute function audit.capture_row_change();

create or replace view public.vw_admin_internal_screen_catalog
with (security_barrier = true)
as
  select
    screen.screen_key,
    screen.display_name,
    screen.route_path,
    screen.category,
    screen.sort_order,
    screen.is_system,
    screen.is_active,
    screen.created_at,
    screen.updated_at,
    app_private.has_global_role('platform_admin'::public.platform_role) as can_manage
  from public.internal_screen_catalog as screen
  where app_private.has_global_role('platform_admin'::public.platform_role);

create or replace view public.vw_admin_internal_membership_screen_grants
with (security_barrier = true)
as
  select
    grant_row.id as grant_id,
    grant_row.membership_id,
    membership.tenant_id,
    tenant.display_name as tenant_display_name,
    membership.user_id,
    profile.full_name as user_full_name,
    profile.email as user_email,
    membership.area_key,
    area.display_name as area_label,
    membership.role as area_role,
    membership.status as membership_status,
    grant_row.screen_key,
    screen.display_name as screen_display_name,
    screen.route_path,
    screen.category,
    grant_row.created_at,
    grant_row.updated_at,
    true as can_revoke
  from public.internal_area_membership_screen_grants as grant_row
  join public.internal_area_memberships as membership
    on membership.id = grant_row.membership_id
  join public.tenants as tenant
    on tenant.id = membership.tenant_id
  join public.profiles as profile
    on profile.id = membership.user_id
  join public.internal_action_target_areas as area
    on area.area_key = membership.area_key
  join public.internal_screen_catalog as screen
    on screen.screen_key = grant_row.screen_key
  where app_private.has_global_role('platform_admin'::public.platform_role);

create or replace view public.vw_internal_actor_workspace_context
with (security_barrier = true)
as
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
   and screen.is_active
  where profile.id = auth.uid()
    and profile.is_active
  union all
  select distinct
    auth.uid() as actor_user_id,
    membership.tenant_id,
    membership.area_key,
    membership.role as area_role,
    'area_membership'::text as permission_source,
    screen.screen_key,
    screen.display_name,
    screen.route_path,
    screen.category,
    screen.sort_order
  from public.profiles as profile
  join public.internal_area_memberships as membership
    on membership.user_id = profile.id
   and membership.status = 'active'::public.internal_area_membership_status
  join public.tenant_memberships as tenant_membership
    on tenant_membership.tenant_id = membership.tenant_id
   and tenant_membership.user_id = membership.user_id
   and tenant_membership.status = 'active'::public.membership_status
  join public.internal_action_target_areas as area
    on area.area_key = membership.area_key
   and area.status = 'active'::public.ticket_reference_status
  join public.internal_area_membership_screen_grants as screen_grant
    on screen_grant.membership_id = membership.id
   and membership.permission_mode = 'custom'::public.internal_permission_mode
  join public.internal_screen_catalog as screen
    on screen.screen_key = screen_grant.screen_key
   and screen.is_active
  where profile.id = auth.uid()
    and profile.is_active
  union all
  select distinct
    auth.uid() as actor_user_id,
    membership.tenant_id,
    membership.area_key,
    membership.role as area_role,
    'area_membership'::text as permission_source,
    screen.screen_key,
    screen.display_name,
    screen.route_path,
    screen.category,
    screen.sort_order
  from public.profiles as profile
  join public.internal_area_memberships as membership
    on membership.user_id = profile.id
   and membership.status = 'active'::public.internal_area_membership_status
   and membership.permission_mode = 'profile'::public.internal_permission_mode
  join public.tenant_memberships as tenant_membership
    on tenant_membership.tenant_id = membership.tenant_id
   and tenant_membership.user_id = membership.user_id
   and tenant_membership.status = 'active'::public.membership_status
  join public.internal_action_target_areas as area
    on area.area_key = membership.area_key
   and area.status = 'active'::public.ticket_reference_status
  join public.internal_access_profiles as access_profile
    on access_profile.id = membership.access_profile_id
   and access_profile.is_active
   and (access_profile.area_key is null or access_profile.area_key = membership.area_key)
  join public.internal_access_profile_screen_grants as screen_grant
    on screen_grant.access_profile_id = access_profile.id
  join public.internal_screen_catalog as screen
    on screen.screen_key = screen_grant.screen_key
   and screen.is_active
  where profile.id = auth.uid()
    and profile.is_active;

create or replace function public.rpc_admin_replace_internal_membership_screens(
  p_membership_id uuid,
  p_screen_keys text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_membership public.internal_area_memberships;
  v_requested_keys text[] := coalesce(p_screen_keys, array[]::text[]);
  v_unknown_keys text[];
  v_granted_keys text[];
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_replace_internal_membership_screens denied';
  end if;

  select * into v_membership
  from public.internal_area_memberships
  where id = p_membership_id;

  if v_membership.id is null then
    raise exception 'internal area membership not found';
  end if;

  select coalesce(array_agg(requested_key order by requested_key), array[]::text[])
  into v_unknown_keys
  from unnest(v_requested_keys) as requested_key
  where not exists (
    select 1
    from public.internal_screen_catalog as screen
    where screen.screen_key = requested_key
      and screen.is_active
  );

  if cardinality(v_unknown_keys) > 0 then
    raise exception 'unknown or inactive screen key: %', array_to_string(v_unknown_keys, ', ');
  end if;

  delete from public.internal_area_membership_screen_grants
  where membership_id = v_membership.id;

  update public.internal_area_memberships
  set
    access_profile_id = null,
    permission_mode = 'custom'::public.internal_permission_mode,
    updated_by_user_id = v_actor_user_id
  where id = v_membership.id;

  insert into public.internal_area_membership_screen_grants (
    membership_id,
    screen_key,
    created_by_user_id,
    updated_by_user_id
  )
  select distinct
    v_membership.id,
    requested_key,
    v_actor_user_id,
    v_actor_user_id
  from unnest(v_requested_keys) as requested_key;

  select coalesce(array_agg(screen_key order by screen_key), array[]::text[])
  into v_granted_keys
  from public.internal_area_membership_screen_grants
  where membership_id = v_membership.id;

  return jsonb_build_object(
    'membership_id', v_membership.id,
    'user_id', v_membership.user_id,
    'tenant_id', v_membership.tenant_id,
    'area_key', v_membership.area_key,
    'screen_keys', v_granted_keys
  );
end;
$$;

create or replace function public.rpc_admin_create_internal_access_profile(
  p_area_key text,
  p_name text,
  p_description text default null
)
returns public.internal_access_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_profile public.internal_access_profiles;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_create_internal_access_profile denied';
  end if;

  if p_area_key is not null and not exists (
    select 1 from public.internal_action_target_areas as area
    where area.area_key = p_area_key and area.status = 'active'::public.ticket_reference_status
  ) then
    raise exception 'internal access profile area not found or inactive';
  end if;

  insert into public.internal_access_profiles (
    area_key,
    name,
    description,
    is_system,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_area_key,
    p_name,
    nullif(btrim(p_description), ''),
    false,
    v_actor_user_id,
    v_actor_user_id
  )
  returning * into v_profile;

  return v_profile;
end;
$$;

create or replace function public.rpc_admin_update_internal_access_profile(
  p_access_profile_id uuid,
  p_name text,
  p_description text,
  p_is_active boolean
)
returns public.internal_access_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_profile public.internal_access_profiles;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_update_internal_access_profile denied';
  end if;

  update public.internal_access_profiles
  set
    name = p_name,
    description = nullif(btrim(p_description), ''),
    is_active = p_is_active,
    updated_by_user_id = v_actor_user_id
  where id = p_access_profile_id
  returning * into v_profile;

  if v_profile.id is null then
    raise exception 'internal access profile not found';
  end if;

  return v_profile;
end;
$$;

create or replace function public.rpc_admin_replace_internal_access_profile_screens(
  p_access_profile_id uuid,
  p_screen_keys text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_profile public.internal_access_profiles;
  v_requested_keys text[] := coalesce(p_screen_keys, array[]::text[]);
  v_unknown_keys text[];
  v_granted_keys text[];
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_replace_internal_access_profile_screens denied';
  end if;

  select * into v_profile
  from public.internal_access_profiles
  where id = p_access_profile_id;

  if v_profile.id is null then
    raise exception 'internal access profile not found';
  end if;

  select coalesce(array_agg(requested_key order by requested_key), array[]::text[])
  into v_unknown_keys
  from unnest(v_requested_keys) as requested_key
  where not exists (
    select 1 from public.internal_screen_catalog as screen
    where screen.screen_key = requested_key and screen.is_active
  );

  if cardinality(v_unknown_keys) > 0 then
    raise exception 'unknown or inactive screen key: %', array_to_string(v_unknown_keys, ', ');
  end if;

  delete from public.internal_access_profile_screen_grants
  where access_profile_id = v_profile.id;

  insert into public.internal_access_profile_screen_grants (
    access_profile_id,
    screen_key,
    created_by_user_id,
    updated_by_user_id
  )
  select distinct v_profile.id, requested_key, v_actor_user_id, v_actor_user_id
  from unnest(v_requested_keys) as requested_key;

  select coalesce(array_agg(screen_key order by screen_key), array[]::text[])
  into v_granted_keys
  from public.internal_access_profile_screen_grants
  where access_profile_id = v_profile.id;

  return jsonb_build_object(
    'access_profile_id', v_profile.id,
    'screen_keys', v_granted_keys
  );
end;
$$;

create or replace function public.rpc_admin_assign_internal_access_profile(
  p_membership_id uuid,
  p_access_profile_id uuid
)
returns public.internal_area_memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_membership public.internal_area_memberships;
  v_profile public.internal_access_profiles;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_assign_internal_access_profile denied';
  end if;

  select * into v_membership from public.internal_area_memberships where id = p_membership_id;
  select * into v_profile from public.internal_access_profiles where id = p_access_profile_id and is_active;

  if v_membership.id is null or v_profile.id is null then
    raise exception 'membership or active access profile not found';
  end if;

  if v_profile.area_key is not null and v_profile.area_key <> v_membership.area_key then
    raise exception 'access profile is not compatible with membership area';
  end if;

  update public.internal_area_memberships
  set
    access_profile_id = v_profile.id,
    permission_mode = 'profile'::public.internal_permission_mode,
    updated_by_user_id = v_actor_user_id
  where id = v_membership.id
  returning * into v_membership;

  return v_membership;
end;
$$;

create or replace function public.rpc_admin_clear_internal_access_profile(
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
    raise exception 'rpc_admin_clear_internal_access_profile denied';
  end if;

  update public.internal_area_memberships
  set
    access_profile_id = null,
    permission_mode = 'custom'::public.internal_permission_mode,
    updated_by_user_id = v_actor_user_id
  where id = p_membership_id
  returning * into v_membership;

  if v_membership.id is null then
    raise exception 'internal area membership not found';
  end if;

  return v_membership;
end;
$$;

revoke all on public.internal_screen_catalog from public, anon, authenticated, service_role;
revoke all on public.internal_area_membership_screen_grants from public, anon, authenticated, service_role;
revoke all on public.internal_role_screen_grants from public, anon, authenticated, service_role;
revoke all on public.internal_access_profiles from public, anon, authenticated, service_role;
revoke all on public.internal_access_profile_screen_grants from public, anon, authenticated, service_role;
revoke all on public.vw_admin_internal_screen_catalog from public, anon, authenticated, service_role;
revoke all on public.vw_admin_internal_membership_screen_grants from public, anon, authenticated, service_role;
revoke all on public.vw_admin_internal_access_profiles from public, anon, authenticated, service_role;
revoke all on public.vw_admin_internal_access_profile_screen_grants from public, anon, authenticated, service_role;
revoke all on public.vw_internal_actor_workspace_context from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_replace_internal_membership_screens(uuid, text[]) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_create_internal_access_profile(text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_update_internal_access_profile(uuid, text, text, boolean) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_replace_internal_access_profile_screens(uuid, text[]) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_assign_internal_access_profile(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_clear_internal_access_profile(uuid) from public, anon, authenticated, service_role;

grant select on public.vw_admin_internal_screen_catalog to authenticated, service_role;
grant select on public.vw_admin_internal_membership_screen_grants to authenticated, service_role;
grant select on public.vw_admin_internal_access_profiles to authenticated, service_role;
grant select on public.vw_admin_internal_access_profile_screen_grants to authenticated, service_role;
grant select on public.vw_internal_actor_workspace_context to authenticated, service_role;
grant execute on function public.rpc_admin_replace_internal_membership_screens(uuid, text[]) to authenticated, service_role;
grant execute on function public.rpc_admin_create_internal_access_profile(text, text, text) to authenticated, service_role;
grant execute on function public.rpc_admin_update_internal_access_profile(uuid, text, text, boolean) to authenticated, service_role;
grant execute on function public.rpc_admin_replace_internal_access_profile_screens(uuid, text[]) to authenticated, service_role;
grant execute on function public.rpc_admin_assign_internal_access_profile(uuid, uuid) to authenticated, service_role;
grant execute on function public.rpc_admin_clear_internal_access_profile(uuid) to authenticated, service_role;

comment on table public.internal_screen_catalog is
  'Catálogo backend de telas internas. Rota, nome e categoria são contratos do produto; o frontend não inventa acesso localmente.';

comment on table public.internal_area_membership_screen_grants is
  'Telas concedidas a um vínculo de usuário, tenant, área e função. Financeiro e Produto usam o mesmo contrato.';

comment on table public.internal_role_screen_grants is
  'Compatibilidade governada para papéis globais legados; novos perfis devem preferir área + função + grants explícitos.';

comment on table public.internal_access_profiles is
  'Named reusable profiles per area with explicit screen grants. They do not replace collaborator identity.';

comment on table public.internal_access_profile_screen_grants is
  'Screens belonging to a named access profile. Assignment is performed by an audited admin RPC.';

comment on view public.vw_internal_actor_workspace_context is
  'Contexto autenticado de telas por papel global ou membership de área. Fonte canônica para landing e navegação futura.';

comment on function public.rpc_admin_replace_internal_membership_screens(uuid, text[]) is
  'Substitui atomicamente as telas de um vínculo de área por chaves ativas do catálogo, sob platform_admin e auditoria de linha.';
