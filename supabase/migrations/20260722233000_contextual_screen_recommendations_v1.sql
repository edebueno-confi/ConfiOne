-- Recomendações de telas por área e dependências de navegação.
-- A recomendação orienta o administrador; a concessão continua sendo auditada
-- nas tabelas de grants e limitada pelos RPCs protegidos.

create table if not exists public.internal_screen_area_defaults (
  area_key text not null references public.internal_action_target_areas (area_key) on delete cascade,
  screen_key text not null references public.internal_screen_catalog (screen_key) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles (id),
  primary key (area_key, screen_key)
);

create table if not exists public.internal_screen_dependencies (
  screen_key text not null references public.internal_screen_catalog (screen_key) on delete cascade,
  dependency_screen_key text not null references public.internal_screen_catalog (screen_key) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles (id),
  primary key (screen_key, dependency_screen_key),
  constraint internal_screen_dependencies_not_self_check
    check (screen_key <> dependency_screen_key)
);

create index if not exists internal_screen_area_defaults_screen_idx
  on public.internal_screen_area_defaults (screen_key, area_key);

create index if not exists internal_screen_dependencies_dependency_idx
  on public.internal_screen_dependencies (dependency_screen_key, screen_key);

alter table public.internal_screen_area_defaults enable row level security;
alter table public.internal_screen_dependencies enable row level security;

drop policy if exists internal_screen_area_defaults_admin_read on public.internal_screen_area_defaults;
create policy internal_screen_area_defaults_admin_read
on public.internal_screen_area_defaults
for select to authenticated
using (app_private.has_global_role('platform_admin'::public.platform_role));

drop policy if exists internal_screen_dependencies_admin_read on public.internal_screen_dependencies;
create policy internal_screen_dependencies_admin_read
on public.internal_screen_dependencies
for select to authenticated
using (app_private.has_global_role('platform_admin'::public.platform_role));

insert into public.internal_screen_area_defaults (area_key, screen_key)
values
  ('customer_success', 'home'),
  ('customer_success', 'cs_portfolio'),
  ('customer_success', 'customers_b2b'),
  ('customer_success', 'internal_actions'),
  ('engineering', 'home'),
  ('engineering', 'product'),
  ('engineering', 'internal_actions'),
  ('finance', 'home'),
  ('finance', 'analytics'),
  ('operations', 'home'),
  ('operations', 'support_inbox'),
  ('operations', 'support_queue'),
  ('operations', 'support_tickets'),
  ('operations', 'customers_b2b'),
  ('operations', 'internal_actions'),
  ('other_internal', 'home'),
  ('product', 'home'),
  ('product', 'product'),
  ('product', 'internal_actions')
on conflict (area_key, screen_key) do nothing;

insert into public.internal_screen_dependencies (screen_key, dependency_screen_key)
values
  ('support_queue', 'support_inbox'),
  ('support_tickets', 'support_inbox'),
  ('customers_b2b', 'home'),
  ('cs_portfolio', 'home'),
  ('internal_actions', 'home'),
  ('product', 'home'),
  ('analytics', 'home')
on conflict (screen_key, dependency_screen_key) do nothing;

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
    app_private.has_global_role('platform_admin'::public.platform_role) as can_manage,
    coalesce(
      (
        select array_agg(default_area.area_key order by default_area.area_key)
        from public.internal_screen_area_defaults as default_area
        where default_area.screen_key = screen.screen_key
      ),
      array[]::text[]
    ) as default_area_keys,
    coalesce(
      (
        select array_agg(dependency.dependency_screen_key order by dependency.dependency_screen_key)
        from public.internal_screen_dependencies as dependency
        where dependency.screen_key = screen.screen_key
      ),
      array[]::text[]
    ) as dependency_screen_keys
  from public.internal_screen_catalog as screen
  where app_private.has_global_role('platform_admin'::public.platform_role);

create or replace function app_private.ensure_internal_membership_screen_dependencies()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.internal_area_membership_screen_grants (
    membership_id,
    screen_key,
    created_by_user_id,
    updated_by_user_id
  )
  select
    new.membership_id,
    dependency.dependency_screen_key,
    new.created_by_user_id,
    new.updated_by_user_id
  from public.internal_screen_dependencies as dependency
  where dependency.screen_key = new.screen_key
  on conflict (membership_id, screen_key) do nothing;

  return new;
end;
$$;

create or replace function app_private.ensure_internal_profile_screen_dependencies()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.internal_access_profile_screen_grants (
    access_profile_id,
    screen_key,
    created_by_user_id,
    updated_by_user_id
  )
  select
    new.access_profile_id,
    dependency.dependency_screen_key,
    new.created_by_user_id,
    new.updated_by_user_id
  from public.internal_screen_dependencies as dependency
  where dependency.screen_key = new.screen_key
  on conflict (access_profile_id, screen_key) do nothing;

  return new;
end;
$$;

drop trigger if exists internal_membership_screen_dependencies on public.internal_area_membership_screen_grants;
create trigger internal_membership_screen_dependencies
after insert on public.internal_area_membership_screen_grants
for each row execute function app_private.ensure_internal_membership_screen_dependencies();

drop trigger if exists internal_profile_screen_dependencies on public.internal_access_profile_screen_grants;
create trigger internal_profile_screen_dependencies
after insert on public.internal_access_profile_screen_grants
for each row execute function app_private.ensure_internal_profile_screen_dependencies();

drop trigger if exists internal_screen_area_defaults_audit_row_change on public.internal_screen_area_defaults;
create trigger internal_screen_area_defaults_audit_row_change
after insert or update or delete on public.internal_screen_area_defaults
for each row execute function audit.capture_row_change();

drop trigger if exists internal_screen_dependencies_audit_row_change on public.internal_screen_dependencies;
create trigger internal_screen_dependencies_audit_row_change
after insert or update or delete on public.internal_screen_dependencies
for each row execute function audit.capture_row_change();

comment on table public.internal_screen_area_defaults is
  'Telas sugeridas quando um administrador seleciona uma area interna.';

comment on table public.internal_screen_dependencies is
  'Dependencias de navegacao que devem acompanhar uma tela concedida.';
