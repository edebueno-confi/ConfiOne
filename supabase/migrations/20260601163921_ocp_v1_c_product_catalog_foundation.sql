do $$
begin
  if not exists (select 1 from pg_type where typname = 'commercial_product_status') then
    create type public.commercial_product_status as enum (
      'draft',
      'active',
      'deprecated',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'commercial_product_plan_status') then
    create type public.commercial_product_plan_status as enum (
      'draft',
      'active',
      'deprecated',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'commercial_product_module_status') then
    create type public.commercial_product_module_status as enum (
      'draft',
      'active',
      'deprecated',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'commercial_product_feature_status') then
    create type public.commercial_product_feature_status as enum (
      'draft',
      'active',
      'deprecated',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'commercial_plan_feature_inclusion_type') then
    create type public.commercial_plan_feature_inclusion_type as enum (
      'included',
      'optional',
      'addon_available',
      'excluded'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'product_area_ownership_role') then
    create type public.product_area_ownership_role as enum (
      'business_owner',
      'technical_owner',
      'support_owner',
      'contributor'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'product_area_ownership_status') then
    create type public.product_area_ownership_status as enum (
      'active',
      'inactive',
      'archived'
    );
  end if;
end;
$$;

create table public.commercial_products (
  id uuid primary key default gen_random_uuid(),
  product_key text not null,
  display_name text not null,
  description text,
  status public.commercial_product_status not null default 'draft',
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles(id) on delete set null,
  updated_by_user_id uuid references public.profiles(id) on delete set null,
  constraint commercial_products_product_key_unique unique (product_key),
  constraint commercial_products_product_key_format check (product_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint commercial_products_display_name_present check (btrim(display_name) <> ''),
  constraint commercial_products_archived_status_consistent check (
    (status = 'archived'::public.commercial_product_status and archived_at is not null)
    or (status <> 'archived'::public.commercial_product_status and archived_at is null)
  )
);

create table public.commercial_product_plans (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.commercial_products(id) on delete restrict,
  plan_key text not null,
  display_name text not null,
  description text,
  status public.commercial_product_plan_status not null default 'draft',
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles(id) on delete set null,
  updated_by_user_id uuid references public.profiles(id) on delete set null,
  constraint commercial_product_plans_product_plan_key_unique unique (product_id, plan_key),
  constraint commercial_product_plans_plan_key_format check (plan_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint commercial_product_plans_display_name_present check (btrim(display_name) <> ''),
  constraint commercial_product_plans_sort_order_nonnegative check (sort_order >= 0),
  constraint commercial_product_plans_archived_status_consistent check (
    (status = 'archived'::public.commercial_product_plan_status and archived_at is not null)
    or (status <> 'archived'::public.commercial_product_plan_status and archived_at is null)
  )
);

create table public.commercial_product_modules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.commercial_products(id) on delete restrict,
  module_key text not null,
  display_name text not null,
  description text,
  status public.commercial_product_module_status not null default 'draft',
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles(id) on delete set null,
  updated_by_user_id uuid references public.profiles(id) on delete set null,
  constraint commercial_product_modules_product_module_key_unique unique (product_id, module_key),
  constraint commercial_product_modules_module_key_format check (module_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint commercial_product_modules_display_name_present check (btrim(display_name) <> ''),
  constraint commercial_product_modules_sort_order_nonnegative check (sort_order >= 0),
  constraint commercial_product_modules_archived_status_consistent check (
    (status = 'archived'::public.commercial_product_module_status and archived_at is not null)
    or (status <> 'archived'::public.commercial_product_module_status and archived_at is null)
  )
);

create table public.commercial_product_features (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.commercial_products(id) on delete restrict,
  module_id uuid references public.commercial_product_modules(id) on delete restrict,
  feature_key text not null,
  display_name text not null,
  description text,
  status public.commercial_product_feature_status not null default 'draft',
  customer_visible_default boolean not null default false,
  support_visible_default boolean not null default true,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles(id) on delete set null,
  updated_by_user_id uuid references public.profiles(id) on delete set null,
  constraint commercial_product_features_product_feature_key_unique unique (product_id, feature_key),
  constraint commercial_product_features_feature_key_format check (feature_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint commercial_product_features_display_name_present check (btrim(display_name) <> ''),
  constraint commercial_product_features_sort_order_nonnegative check (sort_order >= 0),
  constraint commercial_product_features_archived_status_consistent check (
    (status = 'archived'::public.commercial_product_feature_status and archived_at is not null)
    or (status <> 'archived'::public.commercial_product_feature_status and archived_at is null)
  )
);

create table public.commercial_plan_features (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.commercial_product_plans(id) on delete cascade,
  feature_id uuid not null references public.commercial_product_features(id) on delete restrict,
  inclusion_type public.commercial_plan_feature_inclusion_type not null,
  default_enabled boolean not null default false,
  limit_key text,
  limit_value integer,
  limit_unit text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles(id) on delete set null,
  updated_by_user_id uuid references public.profiles(id) on delete set null,
  constraint commercial_plan_features_plan_feature_unique unique (plan_id, feature_id),
  constraint commercial_plan_features_limit_key_format check (
    limit_key is null or limit_key ~ '^[a-z][a-z0-9_]{1,63}$'
  ),
  constraint commercial_plan_features_limit_value_nonnegative check (
    limit_value is null or limit_value >= 0
  ),
  constraint commercial_plan_features_limit_unit_safe check (
    limit_unit is null or (btrim(limit_unit) <> '' and char_length(limit_unit) <= 40)
  )
);

create table public.product_area_ownerships (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.commercial_products(id) on delete cascade,
  module_id uuid references public.commercial_product_modules(id) on delete cascade,
  feature_id uuid references public.commercial_product_features(id) on delete cascade,
  area_key text not null references public.internal_action_target_areas(area_key) on delete restrict,
  ownership_role public.product_area_ownership_role not null,
  status public.product_area_ownership_status not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles(id) on delete set null,
  updated_by_user_id uuid references public.profiles(id) on delete set null,
  constraint product_area_ownerships_scope_unique unique nulls not distinct (
    product_id,
    module_id,
    feature_id,
    area_key,
    ownership_role
  ),
  constraint product_area_ownerships_archived_status_consistent check (
    (status = 'archived'::public.product_area_ownership_status and archived_at is not null)
    or (status <> 'archived'::public.product_area_ownership_status and archived_at is null)
  )
);

create index commercial_product_plans_product_status_idx
  on public.commercial_product_plans (product_id, status, sort_order);

create index commercial_product_modules_product_status_idx
  on public.commercial_product_modules (product_id, status, sort_order);

create index commercial_product_features_product_module_status_idx
  on public.commercial_product_features (product_id, module_id, status, sort_order);

create index commercial_plan_features_feature_idx
  on public.commercial_plan_features (feature_id);

create index product_area_ownerships_area_status_idx
  on public.product_area_ownerships (area_key, status);

create or replace function app_private.require_commercial_catalog_admin()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'commercial catalog admin access denied';
  end if;

  return v_actor_user_id;
end;
$$;

create or replace function app_private.assert_commercial_catalog_key(
  field_name text,
  field_value text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_normalized text;
begin
  v_normalized := lower(nullif(regexp_replace(btrim(coalesce(field_value, '')), '\s+', '_', 'g'), ''));

  if v_normalized is null then
    raise exception '% is required', field_name;
  end if;

  if char_length(v_normalized) > 64 or v_normalized !~ '^[a-z][a-z0-9_]{1,63}$' then
    raise exception '% must be a stable lowercase key', field_name;
  end if;

  if app_private.contains_secret_like_text(array[v_normalized]) then
    raise exception '% cannot contain secrets or credentials', field_name;
  end if;

  return v_normalized;
end;
$$;

create or replace function app_private.assert_commercial_catalog_text(
  field_name text,
  field_value text,
  max_length integer,
  allow_null boolean default false
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_normalized text;
begin
  v_normalized := nullif(regexp_replace(btrim(coalesce(field_value, '')), '\s+', ' ', 'g'), '');

  if v_normalized is null then
    if allow_null then
      return null;
    end if;

    raise exception '% is required', field_name;
  end if;

  if max_length is not null and char_length(v_normalized) > max_length then
    raise exception '% exceeds max length %', field_name, max_length;
  end if;

  if app_private.contains_secret_like_text(array[v_normalized]) then
    raise exception '% cannot contain secrets or credentials', field_name;
  end if;

  return v_normalized;
end;
$$;

create or replace function app_private.assert_commercial_catalog_product_links()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan_product_id uuid;
  v_feature_product_id uuid;
  v_feature_module_id uuid;
  v_module_product_id uuid;
begin
  if tg_table_name = 'commercial_product_features' then
    if new.module_id is not null then
      select module.product_id
      into v_module_product_id
      from public.commercial_product_modules as module
      where module.id = new.module_id;

      if v_module_product_id is null or v_module_product_id <> new.product_id then
        raise exception 'commercial feature module must reference same product';
      end if;
    end if;
  elsif tg_table_name = 'commercial_plan_features' then
    select plan.product_id
    into v_plan_product_id
    from public.commercial_product_plans as plan
    where plan.id = new.plan_id;

    select feature.product_id
    into v_feature_product_id
    from public.commercial_product_features as feature
    where feature.id = new.feature_id;

    if v_plan_product_id is null or v_feature_product_id is null or v_plan_product_id <> v_feature_product_id then
      raise exception 'commercial plan feature must reference same product';
    end if;
  elsif tg_table_name = 'product_area_ownerships' then
    if new.module_id is not null then
      select module.product_id
      into v_module_product_id
      from public.commercial_product_modules as module
      where module.id = new.module_id;

      if v_module_product_id is null or v_module_product_id <> new.product_id then
        raise exception 'product ownership module must reference same product';
      end if;
    end if;

    if new.feature_id is not null then
      select feature.product_id, feature.module_id
      into v_feature_product_id, v_feature_module_id
      from public.commercial_product_features as feature
      where feature.id = new.feature_id;

      if v_feature_product_id is null or v_feature_product_id <> new.product_id then
        raise exception 'product ownership feature must reference same product';
      end if;

      if new.module_id is not null and v_feature_module_id is not null and v_feature_module_id <> new.module_id then
        raise exception 'product ownership feature must reference same module';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger commercial_products_touch_updated_at
before update on public.commercial_products
for each row
execute function app_private.touch_updated_at();

create trigger commercial_product_plans_touch_updated_at
before update on public.commercial_product_plans
for each row
execute function app_private.touch_updated_at();

create trigger commercial_product_modules_touch_updated_at
before update on public.commercial_product_modules
for each row
execute function app_private.touch_updated_at();

create trigger commercial_product_features_touch_updated_at
before update on public.commercial_product_features
for each row
execute function app_private.touch_updated_at();

create trigger commercial_plan_features_touch_updated_at
before update on public.commercial_plan_features
for each row
execute function app_private.touch_updated_at();

create trigger product_area_ownerships_touch_updated_at
before update on public.product_area_ownerships
for each row
execute function app_private.touch_updated_at();

create trigger commercial_product_features_validate_product_links
before insert or update on public.commercial_product_features
for each row
execute function app_private.assert_commercial_catalog_product_links();

create trigger commercial_plan_features_validate_product_links
before insert or update on public.commercial_plan_features
for each row
execute function app_private.assert_commercial_catalog_product_links();

create trigger product_area_ownerships_validate_product_links
before insert or update on public.product_area_ownerships
for each row
execute function app_private.assert_commercial_catalog_product_links();

create trigger commercial_products_audit_row_change
after insert or update or delete on public.commercial_products
for each row
execute function audit.capture_row_change();

create trigger commercial_product_plans_audit_row_change
after insert or update or delete on public.commercial_product_plans
for each row
execute function audit.capture_row_change();

create trigger commercial_product_modules_audit_row_change
after insert or update or delete on public.commercial_product_modules
for each row
execute function audit.capture_row_change();

create trigger commercial_product_features_audit_row_change
after insert or update or delete on public.commercial_product_features
for each row
execute function audit.capture_row_change();

create trigger commercial_plan_features_audit_row_change
after insert or update or delete on public.commercial_plan_features
for each row
execute function audit.capture_row_change();

create trigger product_area_ownerships_audit_row_change
after insert or update or delete on public.product_area_ownerships
for each row
execute function audit.capture_row_change();

alter table public.commercial_products enable row level security;
alter table public.commercial_product_plans enable row level security;
alter table public.commercial_product_modules enable row level security;
alter table public.commercial_product_features enable row level security;
alter table public.commercial_plan_features enable row level security;
alter table public.product_area_ownerships enable row level security;

create policy commercial_products_select_platform_admin
on public.commercial_products
for select
using (app_private.has_global_role('platform_admin'::public.platform_role));

create policy commercial_product_plans_select_platform_admin
on public.commercial_product_plans
for select
using (app_private.has_global_role('platform_admin'::public.platform_role));

create policy commercial_product_modules_select_platform_admin
on public.commercial_product_modules
for select
using (app_private.has_global_role('platform_admin'::public.platform_role));

create policy commercial_product_features_select_platform_admin
on public.commercial_product_features
for select
using (app_private.has_global_role('platform_admin'::public.platform_role));

create policy commercial_plan_features_select_platform_admin
on public.commercial_plan_features
for select
using (app_private.has_global_role('platform_admin'::public.platform_role));

create policy product_area_ownerships_select_platform_admin
on public.product_area_ownerships
for select
using (app_private.has_global_role('platform_admin'::public.platform_role));

create or replace view public.vw_admin_commercial_products
with (security_barrier = true)
as
  select
    product.id as product_id,
    product.product_key,
    product.display_name,
    product.description,
    product.status,
    count(distinct plan.id)::integer as plan_count,
    count(distinct plan.id) filter (
      where plan.status = 'active'::public.commercial_product_plan_status
    )::integer as active_plan_count,
    count(distinct module.id)::integer as module_count,
    count(distinct feature.id)::integer as feature_count,
    count(distinct ownership.id) filter (
      where ownership.status = 'active'::public.product_area_ownership_status
    )::integer as active_ownership_count,
    product.created_at,
    product.updated_at
  from public.commercial_products as product
  left join public.commercial_product_plans as plan
    on plan.product_id = product.id
  left join public.commercial_product_modules as module
    on module.product_id = product.id
  left join public.commercial_product_features as feature
    on feature.product_id = product.id
  left join public.product_area_ownerships as ownership
    on ownership.product_id = product.id
  where app_private.has_global_role('platform_admin'::public.platform_role)
  group by product.id;

create or replace view public.vw_admin_commercial_product_detail
with (security_barrier = true)
as
  select
    product.id as product_id,
    product.product_key,
    product.display_name,
    product.description,
    product.status,
    product.created_at,
    product.updated_at,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'planId', plan.id,
            'planKey', plan.plan_key,
            'displayName', plan.display_name,
            'description', plan.description,
            'status', plan.status,
            'sortOrder', plan.sort_order
          )
          order by plan.sort_order, plan.plan_key
        )
        from public.commercial_product_plans as plan
        where plan.product_id = product.id
      ),
      '[]'::jsonb
    ) as plans,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'moduleId', module.id,
            'moduleKey', module.module_key,
            'displayName', module.display_name,
            'description', module.description,
            'status', module.status,
            'sortOrder', module.sort_order
          )
          order by module.sort_order, module.module_key
        )
        from public.commercial_product_modules as module
        where module.product_id = product.id
      ),
      '[]'::jsonb
    ) as modules,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'featureId', feature.id,
            'moduleId', feature.module_id,
            'featureKey', feature.feature_key,
            'displayName', feature.display_name,
            'description', feature.description,
            'status', feature.status,
            'customerVisibleDefault', feature.customer_visible_default,
            'supportVisibleDefault', feature.support_visible_default,
            'sortOrder', feature.sort_order
          )
          order by feature.sort_order, feature.feature_key
        )
        from public.commercial_product_features as feature
        where feature.product_id = product.id
      ),
      '[]'::jsonb
    ) as features,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'ownershipId', ownership.id,
            'areaKey', ownership.area_key,
            'areaLabel', area.display_name,
            'ownershipRole', ownership.ownership_role,
            'status', ownership.status,
            'moduleId', ownership.module_id,
            'featureId', ownership.feature_id
          )
          order by area.display_name, ownership.ownership_role
        )
        from public.product_area_ownerships as ownership
        join public.internal_action_target_areas as area
          on area.area_key = ownership.area_key
        where ownership.product_id = product.id
      ),
      '[]'::jsonb
    ) as ownerships
  from public.commercial_products as product
  where app_private.has_global_role('platform_admin'::public.platform_role);

create or replace view public.vw_admin_commercial_product_plans
with (security_barrier = true)
as
  select
    plan.id as plan_id,
    plan.product_id,
    product.product_key,
    product.display_name as product_display_name,
    plan.plan_key,
    plan.display_name,
    plan.description,
    plan.status,
    plan.sort_order,
    count(plan_feature.id)::integer as feature_count,
    count(plan_feature.id) filter (
      where plan_feature.inclusion_type = 'included'::public.commercial_plan_feature_inclusion_type
    )::integer as included_feature_count,
    plan.created_at,
    plan.updated_at
  from public.commercial_product_plans as plan
  join public.commercial_products as product
    on product.id = plan.product_id
  left join public.commercial_plan_features as plan_feature
    on plan_feature.plan_id = plan.id
  where app_private.has_global_role('platform_admin'::public.platform_role)
  group by plan.id, product.id;

create or replace view public.vw_admin_product_area_ownerships
with (security_barrier = true)
as
  select
    ownership.id as ownership_id,
    ownership.product_id,
    product.product_key,
    product.display_name as product_display_name,
    ownership.module_id,
    module.module_key,
    module.display_name as module_display_name,
    ownership.feature_id,
    feature.feature_key,
    feature.display_name as feature_display_name,
    ownership.area_key,
    area.display_name as area_display_name,
    area.status as area_status,
    ownership.ownership_role,
    ownership.status,
    ownership.created_at,
    ownership.updated_at
  from public.product_area_ownerships as ownership
  join public.commercial_products as product
    on product.id = ownership.product_id
  left join public.commercial_product_modules as module
    on module.id = ownership.module_id
  left join public.commercial_product_features as feature
    on feature.id = ownership.feature_id
  join public.internal_action_target_areas as area
    on area.area_key = ownership.area_key
  where app_private.has_global_role('platform_admin'::public.platform_role);

create or replace function public.rpc_admin_create_commercial_product(
  p_product_key text,
  p_display_name text,
  p_description text default null,
  p_status public.commercial_product_status default 'draft'
)
returns public.commercial_products
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_product public.commercial_products;
begin
  v_actor_user_id := app_private.require_commercial_catalog_admin();

  insert into public.commercial_products (
    product_key,
    display_name,
    description,
    status,
    archived_at,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    app_private.assert_commercial_catalog_key('product_key', p_product_key),
    app_private.assert_commercial_catalog_text('display_name', p_display_name, 120, false),
    app_private.assert_commercial_catalog_text('description', p_description, 1000, true),
    coalesce(p_status, 'draft'::public.commercial_product_status),
    case when coalesce(p_status, 'draft'::public.commercial_product_status) = 'archived'::public.commercial_product_status then timezone('utc', now()) end,
    v_actor_user_id,
    v_actor_user_id
  )
  returning *
  into v_product;

  return v_product;
end;
$$;

create or replace function public.rpc_admin_update_commercial_product(
  p_product_id uuid,
  p_display_name text default null,
  p_description text default null,
  p_status public.commercial_product_status default null
)
returns public.commercial_products
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_product public.commercial_products;
begin
  v_actor_user_id := app_private.require_commercial_catalog_admin();

  update public.commercial_products
  set
    display_name = coalesce(app_private.assert_commercial_catalog_text('display_name', p_display_name, 120, true), display_name),
    description = case when p_description is null then description else app_private.assert_commercial_catalog_text('description', p_description, 1000, true) end,
    status = coalesce(p_status, status),
    archived_at = case
      when coalesce(p_status, status) = 'archived'::public.commercial_product_status then coalesce(archived_at, timezone('utc', now()))
      else null
    end,
    updated_by_user_id = v_actor_user_id
  where id = p_product_id
  returning *
  into v_product;

  if v_product.id is null then
    raise exception 'commercial product not found';
  end if;

  return v_product;
end;
$$;

create or replace function public.rpc_admin_create_commercial_product_plan(
  p_product_id uuid,
  p_plan_key text,
  p_display_name text,
  p_description text default null,
  p_status public.commercial_product_plan_status default 'draft',
  p_sort_order integer default 0
)
returns public.commercial_product_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_plan public.commercial_product_plans;
begin
  v_actor_user_id := app_private.require_commercial_catalog_admin();

  if not exists (select 1 from public.commercial_products as product where product.id = p_product_id) then
    raise exception 'commercial product not found';
  end if;

  insert into public.commercial_product_plans (
    product_id,
    plan_key,
    display_name,
    description,
    status,
    sort_order,
    archived_at,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_product_id,
    app_private.assert_commercial_catalog_key('plan_key', p_plan_key),
    app_private.assert_commercial_catalog_text('display_name', p_display_name, 120, false),
    app_private.assert_commercial_catalog_text('description', p_description, 1000, true),
    coalesce(p_status, 'draft'::public.commercial_product_plan_status),
    greatest(coalesce(p_sort_order, 0), 0),
    case when coalesce(p_status, 'draft'::public.commercial_product_plan_status) = 'archived'::public.commercial_product_plan_status then timezone('utc', now()) end,
    v_actor_user_id,
    v_actor_user_id
  )
  returning *
  into v_plan;

  return v_plan;
end;
$$;

create or replace function public.rpc_admin_update_commercial_product_plan(
  p_plan_id uuid,
  p_display_name text default null,
  p_description text default null,
  p_status public.commercial_product_plan_status default null,
  p_sort_order integer default null
)
returns public.commercial_product_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_plan public.commercial_product_plans;
begin
  v_actor_user_id := app_private.require_commercial_catalog_admin();

  update public.commercial_product_plans
  set
    display_name = coalesce(app_private.assert_commercial_catalog_text('display_name', p_display_name, 120, true), display_name),
    description = case when p_description is null then description else app_private.assert_commercial_catalog_text('description', p_description, 1000, true) end,
    status = coalesce(p_status, status),
    sort_order = coalesce(greatest(p_sort_order, 0), sort_order),
    archived_at = case
      when coalesce(p_status, status) = 'archived'::public.commercial_product_plan_status then coalesce(archived_at, timezone('utc', now()))
      else null
    end,
    updated_by_user_id = v_actor_user_id
  where id = p_plan_id
  returning *
  into v_plan;

  if v_plan.id is null then
    raise exception 'commercial product plan not found';
  end if;

  return v_plan;
end;
$$;

create or replace function public.rpc_admin_create_commercial_product_module(
  p_product_id uuid,
  p_module_key text,
  p_display_name text,
  p_description text default null,
  p_status public.commercial_product_module_status default 'draft',
  p_sort_order integer default 0
)
returns public.commercial_product_modules
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_module public.commercial_product_modules;
begin
  v_actor_user_id := app_private.require_commercial_catalog_admin();

  if not exists (select 1 from public.commercial_products as product where product.id = p_product_id) then
    raise exception 'commercial product not found';
  end if;

  insert into public.commercial_product_modules (
    product_id,
    module_key,
    display_name,
    description,
    status,
    sort_order,
    archived_at,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_product_id,
    app_private.assert_commercial_catalog_key('module_key', p_module_key),
    app_private.assert_commercial_catalog_text('display_name', p_display_name, 120, false),
    app_private.assert_commercial_catalog_text('description', p_description, 1000, true),
    coalesce(p_status, 'draft'::public.commercial_product_module_status),
    greatest(coalesce(p_sort_order, 0), 0),
    case when coalesce(p_status, 'draft'::public.commercial_product_module_status) = 'archived'::public.commercial_product_module_status then timezone('utc', now()) end,
    v_actor_user_id,
    v_actor_user_id
  )
  returning *
  into v_module;

  return v_module;
end;
$$;

create or replace function public.rpc_admin_update_commercial_product_module(
  p_module_id uuid,
  p_display_name text default null,
  p_description text default null,
  p_status public.commercial_product_module_status default null,
  p_sort_order integer default null
)
returns public.commercial_product_modules
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_module public.commercial_product_modules;
begin
  v_actor_user_id := app_private.require_commercial_catalog_admin();

  update public.commercial_product_modules
  set
    display_name = coalesce(app_private.assert_commercial_catalog_text('display_name', p_display_name, 120, true), display_name),
    description = case when p_description is null then description else app_private.assert_commercial_catalog_text('description', p_description, 1000, true) end,
    status = coalesce(p_status, status),
    sort_order = coalesce(greatest(p_sort_order, 0), sort_order),
    archived_at = case
      when coalesce(p_status, status) = 'archived'::public.commercial_product_module_status then coalesce(archived_at, timezone('utc', now()))
      else null
    end,
    updated_by_user_id = v_actor_user_id
  where id = p_module_id
  returning *
  into v_module;

  if v_module.id is null then
    raise exception 'commercial product module not found';
  end if;

  return v_module;
end;
$$;

create or replace function public.rpc_admin_create_commercial_product_feature(
  p_product_id uuid,
  p_feature_key text,
  p_display_name text,
  p_module_id uuid default null,
  p_description text default null,
  p_status public.commercial_product_feature_status default 'draft',
  p_customer_visible_default boolean default false,
  p_support_visible_default boolean default true,
  p_sort_order integer default 0
)
returns public.commercial_product_features
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_feature public.commercial_product_features;
begin
  v_actor_user_id := app_private.require_commercial_catalog_admin();

  if not exists (select 1 from public.commercial_products as product where product.id = p_product_id) then
    raise exception 'commercial product not found';
  end if;

  insert into public.commercial_product_features (
    product_id,
    module_id,
    feature_key,
    display_name,
    description,
    status,
    customer_visible_default,
    support_visible_default,
    sort_order,
    archived_at,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_product_id,
    p_module_id,
    app_private.assert_commercial_catalog_key('feature_key', p_feature_key),
    app_private.assert_commercial_catalog_text('display_name', p_display_name, 120, false),
    app_private.assert_commercial_catalog_text('description', p_description, 1000, true),
    coalesce(p_status, 'draft'::public.commercial_product_feature_status),
    coalesce(p_customer_visible_default, false),
    coalesce(p_support_visible_default, true),
    greatest(coalesce(p_sort_order, 0), 0),
    case when coalesce(p_status, 'draft'::public.commercial_product_feature_status) = 'archived'::public.commercial_product_feature_status then timezone('utc', now()) end,
    v_actor_user_id,
    v_actor_user_id
  )
  returning *
  into v_feature;

  return v_feature;
end;
$$;

create or replace function public.rpc_admin_update_commercial_product_feature(
  p_feature_id uuid,
  p_display_name text default null,
  p_module_id uuid default null,
  p_description text default null,
  p_status public.commercial_product_feature_status default null,
  p_customer_visible_default boolean default null,
  p_support_visible_default boolean default null,
  p_sort_order integer default null
)
returns public.commercial_product_features
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_feature public.commercial_product_features;
begin
  v_actor_user_id := app_private.require_commercial_catalog_admin();

  update public.commercial_product_features
  set
    module_id = coalesce(p_module_id, module_id),
    display_name = coalesce(app_private.assert_commercial_catalog_text('display_name', p_display_name, 120, true), display_name),
    description = case when p_description is null then description else app_private.assert_commercial_catalog_text('description', p_description, 1000, true) end,
    status = coalesce(p_status, status),
    customer_visible_default = coalesce(p_customer_visible_default, customer_visible_default),
    support_visible_default = coalesce(p_support_visible_default, support_visible_default),
    sort_order = coalesce(greatest(p_sort_order, 0), sort_order),
    archived_at = case
      when coalesce(p_status, status) = 'archived'::public.commercial_product_feature_status then coalesce(archived_at, timezone('utc', now()))
      else null
    end,
    updated_by_user_id = v_actor_user_id
  where id = p_feature_id
  returning *
  into v_feature;

  if v_feature.id is null then
    raise exception 'commercial product feature not found';
  end if;

  return v_feature;
end;
$$;

create or replace function public.rpc_admin_set_commercial_plan_feature(
  p_plan_id uuid,
  p_feature_id uuid,
  p_inclusion_type public.commercial_plan_feature_inclusion_type,
  p_default_enabled boolean default false,
  p_limit_key text default null,
  p_limit_value integer default null,
  p_limit_unit text default null
)
returns public.commercial_plan_features
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_plan_product_id uuid;
  v_feature_product_id uuid;
  v_plan_feature public.commercial_plan_features;
begin
  v_actor_user_id := app_private.require_commercial_catalog_admin();

  select plan.product_id
  into v_plan_product_id
  from public.commercial_product_plans as plan
  where plan.id = p_plan_id;

  select feature.product_id
  into v_feature_product_id
  from public.commercial_product_features as feature
  where feature.id = p_feature_id;

  if v_plan_product_id is null then
    raise exception 'commercial product plan not found';
  end if;

  if v_feature_product_id is null then
    raise exception 'commercial product feature not found';
  end if;

  if v_plan_product_id <> v_feature_product_id then
    raise exception 'commercial plan feature must reference same product';
  end if;

  insert into public.commercial_plan_features (
    plan_id,
    feature_id,
    inclusion_type,
    default_enabled,
    limit_key,
    limit_value,
    limit_unit,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_plan_id,
    p_feature_id,
    p_inclusion_type,
    case when p_inclusion_type = 'excluded'::public.commercial_plan_feature_inclusion_type then false else coalesce(p_default_enabled, false) end,
    case when p_limit_key is null then null else app_private.assert_commercial_catalog_key('limit_key', p_limit_key) end,
    p_limit_value,
    app_private.assert_commercial_catalog_text('limit_unit', p_limit_unit, 40, true),
    v_actor_user_id,
    v_actor_user_id
  )
  on conflict (plan_id, feature_id)
  do update
  set
    inclusion_type = excluded.inclusion_type,
    default_enabled = excluded.default_enabled,
    limit_key = excluded.limit_key,
    limit_value = excluded.limit_value,
    limit_unit = excluded.limit_unit,
    updated_by_user_id = v_actor_user_id
  returning *
  into v_plan_feature;

  return v_plan_feature;
end;
$$;

create or replace function public.rpc_admin_assign_product_area_ownership(
  p_product_id uuid,
  p_area_key text,
  p_ownership_role public.product_area_ownership_role,
  p_module_id uuid default null,
  p_feature_id uuid default null,
  p_status public.product_area_ownership_status default 'active'
)
returns public.product_area_ownerships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_area_key text;
  v_ownership public.product_area_ownerships;
begin
  v_actor_user_id := app_private.require_commercial_catalog_admin();
  v_area_key := app_private.assert_commercial_catalog_key('area_key', p_area_key);

  if not exists (select 1 from public.commercial_products as product where product.id = p_product_id) then
    raise exception 'commercial product not found';
  end if;

  if not exists (
    select 1
    from public.internal_action_target_areas as area
    where area.area_key = v_area_key
  ) then
    raise exception 'internal area not found';
  end if;

  insert into public.product_area_ownerships (
    product_id,
    module_id,
    feature_id,
    area_key,
    ownership_role,
    status,
    archived_at,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_product_id,
    p_module_id,
    p_feature_id,
    v_area_key,
    p_ownership_role,
    coalesce(p_status, 'active'::public.product_area_ownership_status),
    case when coalesce(p_status, 'active'::public.product_area_ownership_status) = 'archived'::public.product_area_ownership_status then timezone('utc', now()) end,
    v_actor_user_id,
    v_actor_user_id
  )
  on conflict on constraint product_area_ownerships_scope_unique
  do update
  set
    status = excluded.status,
    archived_at = excluded.archived_at,
    updated_by_user_id = v_actor_user_id
  returning *
  into v_ownership;

  return v_ownership;
end;
$$;

create or replace function public.rpc_admin_archive_product_area_ownership(
  p_ownership_id uuid
)
returns public.product_area_ownerships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_ownership public.product_area_ownerships;
begin
  v_actor_user_id := app_private.require_commercial_catalog_admin();

  update public.product_area_ownerships
  set
    status = 'archived'::public.product_area_ownership_status,
    archived_at = coalesce(archived_at, timezone('utc', now())),
    updated_by_user_id = v_actor_user_id
  where id = p_ownership_id
  returning *
  into v_ownership;

  if v_ownership.id is null then
    raise exception 'product area ownership not found';
  end if;

  return v_ownership;
end;
$$;

revoke all on public.commercial_products from public, anon, authenticated, service_role;
revoke all on public.commercial_product_plans from public, anon, authenticated, service_role;
revoke all on public.commercial_product_modules from public, anon, authenticated, service_role;
revoke all on public.commercial_product_features from public, anon, authenticated, service_role;
revoke all on public.commercial_plan_features from public, anon, authenticated, service_role;
revoke all on public.product_area_ownerships from public, anon, authenticated, service_role;

grant select on public.commercial_products to service_role;
grant select on public.commercial_product_plans to service_role;
grant select on public.commercial_product_modules to service_role;
grant select on public.commercial_product_features to service_role;
grant select on public.commercial_plan_features to service_role;
grant select on public.product_area_ownerships to service_role;

revoke all on public.vw_admin_commercial_products from public, anon, authenticated, service_role;
revoke all on public.vw_admin_commercial_product_detail from public, anon, authenticated, service_role;
revoke all on public.vw_admin_commercial_product_plans from public, anon, authenticated, service_role;
revoke all on public.vw_admin_product_area_ownerships from public, anon, authenticated, service_role;

grant select on public.vw_admin_commercial_products to authenticated, service_role;
grant select on public.vw_admin_commercial_product_detail to authenticated, service_role;
grant select on public.vw_admin_commercial_product_plans to authenticated, service_role;
grant select on public.vw_admin_product_area_ownerships to authenticated, service_role;

revoke all on function app_private.require_commercial_catalog_admin() from public, anon, authenticated, service_role;
revoke all on function app_private.assert_commercial_catalog_key(text, text) from public, anon, authenticated, service_role;
revoke all on function app_private.assert_commercial_catalog_text(text, text, integer, boolean) from public, anon, authenticated, service_role;
revoke all on function app_private.assert_commercial_catalog_product_links() from public, anon, authenticated, service_role;

grant execute on function app_private.require_commercial_catalog_admin() to service_role;
grant execute on function app_private.assert_commercial_catalog_key(text, text) to service_role;
grant execute on function app_private.assert_commercial_catalog_text(text, text, integer, boolean) to service_role;
grant execute on function app_private.assert_commercial_catalog_product_links() to service_role;

revoke all on function public.rpc_admin_create_commercial_product(text, text, text, public.commercial_product_status) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_update_commercial_product(uuid, text, text, public.commercial_product_status) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_create_commercial_product_plan(uuid, text, text, text, public.commercial_product_plan_status, integer) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_update_commercial_product_plan(uuid, text, text, public.commercial_product_plan_status, integer) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_create_commercial_product_module(uuid, text, text, text, public.commercial_product_module_status, integer) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_update_commercial_product_module(uuid, text, text, public.commercial_product_module_status, integer) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_create_commercial_product_feature(uuid, text, text, uuid, text, public.commercial_product_feature_status, boolean, boolean, integer) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_update_commercial_product_feature(uuid, text, uuid, text, public.commercial_product_feature_status, boolean, boolean, integer) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_set_commercial_plan_feature(uuid, uuid, public.commercial_plan_feature_inclusion_type, boolean, text, integer, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_assign_product_area_ownership(uuid, text, public.product_area_ownership_role, uuid, uuid, public.product_area_ownership_status) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_archive_product_area_ownership(uuid) from public, anon, authenticated, service_role;

grant execute on function public.rpc_admin_create_commercial_product(text, text, text, public.commercial_product_status) to authenticated;
grant execute on function public.rpc_admin_update_commercial_product(uuid, text, text, public.commercial_product_status) to authenticated;
grant execute on function public.rpc_admin_create_commercial_product_plan(uuid, text, text, text, public.commercial_product_plan_status, integer) to authenticated;
grant execute on function public.rpc_admin_update_commercial_product_plan(uuid, text, text, public.commercial_product_plan_status, integer) to authenticated;
grant execute on function public.rpc_admin_create_commercial_product_module(uuid, text, text, text, public.commercial_product_module_status, integer) to authenticated;
grant execute on function public.rpc_admin_update_commercial_product_module(uuid, text, text, public.commercial_product_module_status, integer) to authenticated;
grant execute on function public.rpc_admin_create_commercial_product_feature(uuid, text, text, uuid, text, public.commercial_product_feature_status, boolean, boolean, integer) to authenticated;
grant execute on function public.rpc_admin_update_commercial_product_feature(uuid, text, uuid, text, public.commercial_product_feature_status, boolean, boolean, integer) to authenticated;
grant execute on function public.rpc_admin_set_commercial_plan_feature(uuid, uuid, public.commercial_plan_feature_inclusion_type, boolean, text, integer, text) to authenticated;
grant execute on function public.rpc_admin_assign_product_area_ownership(uuid, text, public.product_area_ownership_role, uuid, uuid, public.product_area_ownership_status) to authenticated;
grant execute on function public.rpc_admin_archive_product_area_ownership(uuid) to authenticated;

comment on table public.commercial_products is
  'Catalogo canonico global de produtos comercializados OCP V1-C. Sem tenant, preco ou assinatura por cliente.';

comment on table public.commercial_product_plans is
  'Planos canonicos por produto comercial OCP V1-C. Nao representa assinatura de cliente.';

comment on table public.commercial_product_modules is
  'Modulos canonicos por produto comercial OCP V1-C.';

comment on table public.commercial_product_features is
  'Features comerciais canonicas por produto OCP V1-C, separadas de customer_account_features operacionais por tenant.';

comment on table public.commercial_plan_features is
  'Relacao plano-feature comercial OCP V1-C, sem preco ou valor financeiro.';

comment on table public.product_area_ownerships is
  'Ownership interno por area sobre produto, modulo ou feature comercial, sem conceder permissao individual.';

comment on view public.vw_admin_commercial_products is
  'Read model administrativo do catalogo comercial global, restrito a platform_admin.';

comment on view public.vw_admin_commercial_product_detail is
  'Read model administrativo de detalhe do produto comercial, com planos, modulos, features e ownerships sanitizados.';

comment on view public.vw_admin_commercial_product_plans is
  'Read model administrativo de planos comerciais por produto, restrito a platform_admin.';

comment on view public.vw_admin_product_area_ownerships is
  'Read model administrativo de ownerships por area interna sobre catalogo comercial.';

comment on function public.rpc_admin_create_commercial_product(text, text, text, public.commercial_product_status) is
  'Cria produto comercial canonico por contrato administrativo OCP V1-C.';

comment on function public.rpc_admin_update_commercial_product(uuid, text, text, public.commercial_product_status) is
  'Atualiza produto comercial canonico por contrato administrativo OCP V1-C.';

comment on function public.rpc_admin_create_commercial_product_plan(uuid, text, text, text, public.commercial_product_plan_status, integer) is
  'Cria plano comercial canonico por produto, sem assinatura de cliente.';

comment on function public.rpc_admin_update_commercial_product_plan(uuid, text, text, public.commercial_product_plan_status, integer) is
  'Atualiza plano comercial canonico por produto.';

comment on function public.rpc_admin_create_commercial_product_module(uuid, text, text, text, public.commercial_product_module_status, integer) is
  'Cria modulo comercial canonico por produto.';

comment on function public.rpc_admin_update_commercial_product_module(uuid, text, text, public.commercial_product_module_status, integer) is
  'Atualiza modulo comercial canonico por produto.';

comment on function public.rpc_admin_create_commercial_product_feature(uuid, text, text, uuid, text, public.commercial_product_feature_status, boolean, boolean, integer) is
  'Cria feature comercial canonica por produto, separada de feature operacional por tenant.';

comment on function public.rpc_admin_update_commercial_product_feature(uuid, text, uuid, text, public.commercial_product_feature_status, boolean, boolean, integer) is
  'Atualiza feature comercial canonica por produto.';

comment on function public.rpc_admin_set_commercial_plan_feature(uuid, uuid, public.commercial_plan_feature_inclusion_type, boolean, text, integer, text) is
  'Define relacao plano-feature comercial garantindo mesmo produto e sem valor financeiro.';

comment on function public.rpc_admin_assign_product_area_ownership(uuid, text, public.product_area_ownership_role, uuid, uuid, public.product_area_ownership_status) is
  'Atribui ownership de area interna sobre produto, modulo ou feature comercial.';

comment on function public.rpc_admin_archive_product_area_ownership(uuid) is
  'Arquiva ownership de area interna sobre catalogo comercial.';
