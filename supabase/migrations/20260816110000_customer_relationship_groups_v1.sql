-- Customer Relationship Groups V1
--
-- Esta camada representa agrupamentos internos de relacionamento. Ela nao
-- afirma relacao societaria, juridica ou financeira e nao substitui tenants,
-- organizations ou a reconciliacao financeira do Analytics.

create type public.customer_group_status as enum ('active', 'archived');
create type public.customer_group_type as enum (
  'economic_group',
  'service_umbrella',
  'portfolio'
);
create type public.customer_group_member_kind as enum ('tenant', 'brand');
create type public.customer_group_member_relationship as enum (
  'contract_holder',
  'served_brand',
  'operational_member'
);

create table public.customer_account_groups (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null,
  display_name text not null,
  group_type public.customer_group_type not null default 'service_umbrella',
  status public.customer_group_status not null default 'active',
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles (id),
  updated_by_user_id uuid references public.profiles (id),
  constraint customer_account_groups_slug_format_check
    check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint customer_account_groups_display_name_not_blank_check
    check (nullif(btrim(display_name), '') is not null)
);

create unique index customer_account_groups_slug_key
  on public.customer_account_groups (lower(slug));

create table public.customer_account_group_members (
  id uuid primary key default extensions.gen_random_uuid(),
  group_id uuid not null references public.customer_account_groups (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete cascade,
  member_kind public.customer_group_member_kind not null,
  member_name text,
  relationship public.customer_group_member_relationship not null default 'operational_member',
  source_system text not null default 'manual',
  source_external_id text,
  is_primary boolean not null default false,
  status public.customer_group_status not null default 'active',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles (id),
  updated_by_user_id uuid references public.profiles (id),
  constraint customer_account_group_members_target_check
    check (
      (member_kind = 'tenant' and tenant_id is not null)
      or (member_kind = 'brand' and nullif(btrim(member_name), '') is not null)
    ),
  constraint customer_account_group_members_source_check
    check (nullif(btrim(source_system), '') is not null)
);

create unique index customer_account_group_members_tenant_relation_key
  on public.customer_account_group_members (group_id, tenant_id, relationship)
  where tenant_id is not null;

create unique index customer_account_group_members_brand_label_key
  on public.customer_account_group_members (group_id, lower(btrim(member_name)), relationship)
  where tenant_id is null and member_name is not null;

create unique index customer_account_group_members_primary_tenant_key
  on public.customer_account_group_members (tenant_id)
  where tenant_id is not null and is_primary and status = 'active';

create index customer_account_group_members_group_lookup_idx
  on public.customer_account_group_members (group_id, status, relationship, created_at desc);

create index customer_account_group_members_tenant_lookup_idx
  on public.customer_account_group_members (tenant_id, status, created_at desc)
  where tenant_id is not null;

create trigger customer_account_groups_touch_updated_at
before update on public.customer_account_groups
for each row
execute function app_private.touch_updated_at();

create trigger customer_account_group_members_touch_updated_at
before update on public.customer_account_group_members
for each row
execute function app_private.touch_updated_at();

create trigger customer_account_groups_audit_row_change
after insert or update or delete on public.customer_account_groups
for each row
execute function audit.capture_row_change();

create trigger customer_account_group_members_audit_row_change
after insert or update or delete on public.customer_account_group_members
for each row
execute function audit.capture_row_change();

alter table public.customer_account_groups enable row level security;
alter table public.customer_account_group_members enable row level security;

create policy customer_account_groups_select_managed
on public.customer_account_groups
for select to authenticated
using (app_private.can_manage_multi_brand_foundation());

create policy customer_account_groups_write_managed
on public.customer_account_groups
for all to authenticated
using (app_private.can_manage_multi_brand_foundation())
with check (app_private.can_manage_multi_brand_foundation());

create policy customer_account_group_members_select_managed
on public.customer_account_group_members
for select to authenticated
using (app_private.can_manage_multi_brand_foundation());

create policy customer_account_group_members_write_managed
on public.customer_account_group_members
for all to authenticated
using (app_private.can_manage_multi_brand_foundation())
with check (app_private.can_manage_multi_brand_foundation());

revoke all on public.customer_account_groups from public, anon, authenticated;
revoke all on public.customer_account_group_members from public, anon, authenticated;
grant select on public.customer_account_groups to authenticated, service_role;
grant select on public.customer_account_group_members to authenticated, service_role;

create or replace function public.rpc_admin_create_customer_account_group(
  p_slug text,
  p_display_name text,
  p_group_type public.customer_group_type default 'service_umbrella',
  p_description text default null
)
returns public.customer_account_groups
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_group public.customer_account_groups;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_create_customer_account_group denied';
  end if;

  insert into public.customer_account_groups (
    slug,
    display_name,
    group_type,
    description,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    lower(btrim(p_slug)),
    btrim(p_display_name),
    coalesce(p_group_type, 'service_umbrella'::public.customer_group_type),
    nullif(btrim(p_description), ''),
    v_actor_user_id,
    v_actor_user_id
  )
  returning * into v_group;

  return v_group;
end;
$$;

create or replace function public.rpc_admin_add_customer_account_group_member(
  p_group_id uuid,
  p_member_kind public.customer_group_member_kind,
  p_tenant_id uuid default null,
  p_member_name text default null,
  p_relationship public.customer_group_member_relationship default 'operational_member',
  p_source_system text default 'manual',
  p_source_external_id text default null,
  p_is_primary boolean default false,
  p_notes text default null
)
returns public.customer_account_group_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_member public.customer_account_group_members;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_add_customer_account_group_member denied';
  end if;

  if not exists (
    select 1
    from public.customer_account_groups as g
    where g.id = p_group_id
      and g.status = 'active'
  ) then
    raise exception 'customer account group not found or archived';
  end if;

  if p_member_kind = 'tenant' and not exists (
    select 1 from public.tenants as t where t.id = p_tenant_id
  ) then
    raise exception 'tenant not found';
  end if;

  if p_member_kind = 'brand' and nullif(btrim(p_member_name), '') is null then
    raise exception 'brand member name required';
  end if;

  insert into public.customer_account_group_members (
    group_id,
    tenant_id,
    member_kind,
    member_name,
    relationship,
    source_system,
    source_external_id,
    is_primary,
    notes,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_group_id,
    case when p_member_kind = 'tenant' then p_tenant_id else null end,
    p_member_kind,
    nullif(btrim(p_member_name), ''),
    coalesce(p_relationship, 'operational_member'::public.customer_group_member_relationship),
    coalesce(nullif(btrim(p_source_system), ''), 'manual'),
    nullif(btrim(p_source_external_id), ''),
    coalesce(p_is_primary, false),
    nullif(btrim(p_notes), ''),
    v_actor_user_id,
    v_actor_user_id
  )
  returning * into v_member;

  return v_member;
end;
$$;

create or replace function public.rpc_admin_archive_customer_account_group_member(
  p_member_id uuid
)
returns public.customer_account_group_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_member public.customer_account_group_members;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_archive_customer_account_group_member denied';
  end if;

  update public.customer_account_group_members
  set status = 'archived',
      is_primary = false,
      updated_by_user_id = v_actor_user_id
  where id = p_member_id
  returning * into v_member;

  if v_member.id is null then
    raise exception 'customer account group member not found';
  end if;

  return v_member;
end;
$$;

revoke all on function public.rpc_admin_create_customer_account_group(text, text, public.customer_group_type, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_add_customer_account_group_member(uuid, public.customer_group_member_kind, uuid, text, public.customer_group_member_relationship, text, text, boolean, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_archive_customer_account_group_member(uuid) from public, anon, authenticated, service_role;

grant execute on function public.rpc_admin_create_customer_account_group(text, text, public.customer_group_type, text) to authenticated;
grant execute on function public.rpc_admin_add_customer_account_group_member(uuid, public.customer_group_member_kind, uuid, text, public.customer_group_member_relationship, text, text, boolean, text) to authenticated;
grant execute on function public.rpc_admin_archive_customer_account_group_member(uuid) to authenticated;

create or replace view public.vw_admin_customer_account_groups_list
with (security_barrier = true)
as
  with current_actor as (
    select p.id
    from public.profiles as p
    where p.id = auth.uid()
      and p.is_active
      and app_private.has_global_role('platform_admin'::public.platform_role)
  ), member_stats as (
    select
      m.group_id,
      count(*) filter (where m.status = 'active')::integer as active_member_count,
      count(*) filter (where m.status = 'active' and m.member_kind = 'tenant')::integer as active_tenant_member_count,
      count(*) filter (where m.status = 'active' and m.member_kind = 'brand')::integer as active_brand_member_count
    from public.customer_account_group_members as m
    group by m.group_id
  )
  select
    g.id,
    g.slug,
    g.display_name,
    g.group_type,
    g.status,
    g.description,
    g.created_at,
    g.updated_at,
    g.created_by_user_id,
    creator.full_name as created_by_full_name,
    g.updated_by_user_id,
    updater.full_name as updated_by_full_name,
    coalesce(ms.active_member_count, 0) as active_member_count,
    coalesce(ms.active_tenant_member_count, 0) as active_tenant_member_count,
    coalesce(ms.active_brand_member_count, 0) as active_brand_member_count
  from current_actor as ca
  join public.customer_account_groups as g on true
  left join public.profiles as creator on creator.id = g.created_by_user_id
  left join public.profiles as updater on updater.id = g.updated_by_user_id
  left join member_stats as ms on ms.group_id = g.id
  order by g.status asc, g.display_name asc;

create or replace view public.vw_admin_customer_account_group_detail
with (security_barrier = true)
as
  with current_actor as (
    select p.id
    from public.profiles as p
    where p.id = auth.uid()
      and p.is_active
      and app_private.has_global_role('platform_admin'::public.platform_role)
  ), member_payload as (
    select
      m.group_id,
      jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'tenant_id', m.tenant_id,
          'tenant_slug', t.slug,
          'tenant_display_name', t.display_name,
          'member_kind', m.member_kind,
          'member_name', coalesce(m.member_name, t.display_name),
          'relationship', m.relationship,
          'source_system', m.source_system,
          'source_external_id', m.source_external_id,
          'is_primary', m.is_primary,
          'status', m.status,
          'notes', m.notes,
          'created_at', m.created_at,
          'updated_at', m.updated_at
        )
        order by m.status asc, m.is_primary desc, coalesce(m.member_name, t.display_name) asc, m.created_at asc
      ) as members
    from public.customer_account_group_members as m
    left join public.tenants as t on t.id = m.tenant_id
    group by m.group_id
  )
  select
    g.id,
    g.slug,
    g.display_name,
    g.group_type,
    g.status,
    g.description,
    g.created_at,
    g.updated_at,
    g.created_by_user_id,
    creator.full_name as created_by_full_name,
    g.updated_by_user_id,
    updater.full_name as updated_by_full_name,
    coalesce(mp.members, '[]'::jsonb) as members
  from current_actor as ca
  join public.customer_account_groups as g on true
  left join public.profiles as creator on creator.id = g.created_by_user_id
  left join public.profiles as updater on updater.id = g.updated_by_user_id
  left join member_payload as mp on mp.group_id = g.id;

create or replace view public.vw_admin_tenant_group_context
with (security_barrier = true)
as
  with current_actor as (
    select p.id
    from public.profiles as p
    where p.id = auth.uid()
      and p.is_active
      and app_private.has_global_role('platform_admin'::public.platform_role)
  ), ranked_groups as (
    select
      m.tenant_id,
      g.id as group_id,
      g.display_name as group_display_name,
      g.group_type,
      m.relationship,
      m.is_primary,
      count(*) over (partition by m.tenant_id)::integer as group_count,
      row_number() over (
        partition by m.tenant_id
        order by m.is_primary desc, g.display_name asc, g.id
      ) as rank
    from public.customer_account_group_members as m
    join public.customer_account_groups as g on g.id = m.group_id
    where m.tenant_id is not null
      and m.status = 'active'
      and g.status = 'active'
  )
  select
    rg.tenant_id,
    rg.group_id,
    rg.group_display_name,
    rg.group_type,
    rg.relationship,
    rg.is_primary,
    rg.group_count
  from current_actor as ca
  join ranked_groups as rg on true
  where rg.rank = 1;

revoke all on public.vw_admin_customer_account_groups_list from public, anon, authenticated, service_role;
revoke all on public.vw_admin_customer_account_group_detail from public, anon, authenticated, service_role;
revoke all on public.vw_admin_tenant_group_context from public, anon, authenticated, service_role;
grant select on public.vw_admin_customer_account_groups_list to authenticated, service_role;
grant select on public.vw_admin_customer_account_group_detail to authenticated, service_role;
grant select on public.vw_admin_tenant_group_context to authenticated, service_role;

comment on table public.customer_account_groups is
  'Agrupamento interno de relacionamento de contas e marcas; nao representa automaticamente grupo societario ou entidade juridica.';

comment on table public.customer_account_group_members is
  'Membros de um agrupamento interno, podendo ser tenants operacionais ou marcas representadas no contrato.';

comment on view public.vw_admin_customer_account_groups_list is
  'Read model administrativo de agrupamentos internos de clientes, restrito a platform_admin.';

comment on view public.vw_admin_customer_account_group_detail is
  'Read model administrativo detalhado de um agrupamento interno com seus tenants e marcas.';

comment on view public.vw_admin_tenant_group_context is
  'Contexto resumido do agrupamento principal de cada tenant operacional.';
