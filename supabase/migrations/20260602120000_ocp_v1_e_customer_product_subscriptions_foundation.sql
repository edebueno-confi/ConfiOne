do $$
begin
  if not exists (select 1 from pg_type where typname = 'customer_product_subscription_status') then
    create type public.customer_product_subscription_status as enum (
      'pending',
      'active',
      'suspended',
      'cancelled',
      'expired'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'customer_product_feature_entitlement_status') then
    create type public.customer_product_feature_entitlement_status as enum (
      'active',
      'inactive',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'customer_product_feature_entitlement_source') then
    create type public.customer_product_feature_entitlement_source as enum (
      'plan',
      'addon',
      'pilot',
      'ops_override',
      'migration'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'customer_product_internal_owner_role') then
    create type public.customer_product_internal_owner_role as enum (
      'account_owner',
      'cs_owner',
      'support_owner',
      'technical_owner',
      'finance_owner',
      'implementation_owner'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'customer_product_internal_owner_status') then
    create type public.customer_product_internal_owner_status as enum (
      'active',
      'inactive',
      'archived'
    );
  end if;
end;
$$;

create table public.customer_product_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.commercial_products(id) on delete restrict,
  plan_id uuid not null references public.commercial_product_plans(id) on delete restrict,
  status public.customer_product_subscription_status not null default 'pending',
  started_at timestamptz,
  ended_at timestamptz,
  renewal_at timestamptz,
  contract_reference text,
  source text not null default 'manual_admin',
  notes_internal text,
  metadata jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles(id) on delete set null,
  updated_by_user_id uuid references public.profiles(id) on delete set null,
  constraint customer_product_subscriptions_source_format check (source ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint customer_product_subscriptions_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint customer_product_subscriptions_dates_consistent check (
    ended_at is null or started_at is null or ended_at >= started_at
  ),
  constraint customer_product_subscriptions_renewal_consistent check (
    renewal_at is null or ended_at is null or renewal_at <= ended_at
  ),
  constraint customer_product_subscriptions_archived_status_consistent check (
    archived_at is null
    or status in (
      'cancelled'::public.customer_product_subscription_status,
      'expired'::public.customer_product_subscription_status
    )
  )
);

create unique index customer_product_subscriptions_current_product_key
  on public.customer_product_subscriptions (tenant_id, product_id)
  where archived_at is null
    and status in (
      'pending'::public.customer_product_subscription_status,
      'active'::public.customer_product_subscription_status,
      'suspended'::public.customer_product_subscription_status
    );

create index customer_product_subscriptions_tenant_status_idx
  on public.customer_product_subscriptions (tenant_id, status, updated_at desc);

create index customer_product_subscriptions_product_plan_idx
  on public.customer_product_subscriptions (product_id, plan_id, status);

create table public.customer_product_feature_entitlements (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.customer_product_subscriptions(id) on delete cascade,
  feature_id uuid not null references public.commercial_product_features(id) on delete restrict,
  status public.customer_product_feature_entitlement_status not null default 'active',
  entitlement_source public.customer_product_feature_entitlement_source not null default 'plan',
  reason text,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles(id) on delete set null,
  updated_by_user_id uuid references public.profiles(id) on delete set null,
  constraint customer_product_feature_entitlements_unique unique (
    subscription_id,
    feature_id,
    entitlement_source
  ),
  constraint customer_product_feature_entitlements_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint customer_product_feature_entitlements_dates_consistent check (
    ends_at is null or starts_at is null or ends_at >= starts_at
  ),
  constraint customer_product_feature_entitlements_archived_consistent check (
    (status = 'archived'::public.customer_product_feature_entitlement_status and archived_at is not null)
    or (status <> 'archived'::public.customer_product_feature_entitlement_status and archived_at is null)
  )
);

create index customer_product_feature_entitlements_subscription_status_idx
  on public.customer_product_feature_entitlements (subscription_id, status, entitlement_source);

create index customer_product_feature_entitlements_feature_idx
  on public.customer_product_feature_entitlements (feature_id, status);

create table public.customer_product_internal_owners (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.customer_product_subscriptions(id) on delete cascade,
  owner_user_id uuid references public.profiles(id) on delete set null,
  area_key text references public.internal_action_target_areas(area_key) on delete restrict,
  owner_role public.customer_product_internal_owner_role not null,
  status public.customer_product_internal_owner_status not null default 'active',
  notes_internal text,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references public.profiles(id) on delete set null,
  updated_by_user_id uuid references public.profiles(id) on delete set null,
  constraint customer_product_internal_owners_target_required check (
    owner_user_id is not null or area_key is not null
  ),
  constraint customer_product_internal_owners_unique unique nulls not distinct (
    subscription_id,
    owner_user_id,
    area_key,
    owner_role
  ),
  constraint customer_product_internal_owners_archived_status_consistent check (
    (status = 'archived'::public.customer_product_internal_owner_status and archived_at is not null)
    or (status <> 'archived'::public.customer_product_internal_owner_status and archived_at is null)
  )
);

create index customer_product_internal_owners_subscription_status_idx
  on public.customer_product_internal_owners (subscription_id, status, owner_role);

create index customer_product_internal_owners_user_status_idx
  on public.customer_product_internal_owners (owner_user_id, status)
  where owner_user_id is not null;

create index customer_product_internal_owners_area_status_idx
  on public.customer_product_internal_owners (area_key, status)
  where area_key is not null;

create or replace function app_private.require_customer_product_subscription_admin()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  return app_private.require_commercial_catalog_admin();
end;
$$;

create or replace function app_private.assert_customer_product_subscription_text(
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
begin
  return app_private.assert_commercial_catalog_text(field_name, field_value, max_length, allow_null);
end;
$$;

create or replace function app_private.assert_customer_product_subscription_metadata(
  field_name text,
  field_value jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_value jsonb := coalesce(field_value, '{}'::jsonb);
begin
  if jsonb_typeof(v_value) <> 'object' then
    raise exception '% must be a JSON object', field_name;
  end if;

  if app_private.contains_secret_like_text(array[v_value::text]) then
    raise exception '% cannot contain secrets or credentials', field_name;
  end if;

  return v_value;
end;
$$;

create or replace function app_private.assert_customer_product_subscription_links()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan_product_id uuid;
  v_feature_product_id uuid;
  v_subscription_product_id uuid;
begin
  if tg_table_name = 'customer_product_subscriptions' then
    select plan.product_id
    into v_plan_product_id
    from public.commercial_product_plans as plan
    where plan.id = new.plan_id;

    if v_plan_product_id is null or v_plan_product_id <> new.product_id then
      raise exception 'subscription plan must reference same product';
    end if;
  elsif tg_table_name = 'customer_product_feature_entitlements' then
    select subscription.product_id
    into v_subscription_product_id
    from public.customer_product_subscriptions as subscription
    where subscription.id = new.subscription_id;

    select feature.product_id
    into v_feature_product_id
    from public.commercial_product_features as feature
    where feature.id = new.feature_id;

    if v_subscription_product_id is null or v_feature_product_id is null or v_subscription_product_id <> v_feature_product_id then
      raise exception 'subscription feature entitlement must reference same product';
    end if;
  end if;

  return new;
end;
$$;

create trigger customer_product_subscriptions_touch_updated_at
before update on public.customer_product_subscriptions
for each row
execute function app_private.touch_updated_at();

create trigger customer_product_feature_entitlements_touch_updated_at
before update on public.customer_product_feature_entitlements
for each row
execute function app_private.touch_updated_at();

create trigger customer_product_internal_owners_touch_updated_at
before update on public.customer_product_internal_owners
for each row
execute function app_private.touch_updated_at();

create trigger customer_product_subscriptions_validate_links
before insert or update on public.customer_product_subscriptions
for each row
execute function app_private.assert_customer_product_subscription_links();

create trigger customer_product_feature_entitlements_validate_links
before insert or update on public.customer_product_feature_entitlements
for each row
execute function app_private.assert_customer_product_subscription_links();

create trigger customer_product_subscriptions_audit_row_change
after insert or update or delete on public.customer_product_subscriptions
for each row
execute function audit.capture_row_change();

create trigger customer_product_feature_entitlements_audit_row_change
after insert or update or delete on public.customer_product_feature_entitlements
for each row
execute function audit.capture_row_change();

create trigger customer_product_internal_owners_audit_row_change
after insert or update or delete on public.customer_product_internal_owners
for each row
execute function audit.capture_row_change();

alter table public.customer_product_subscriptions enable row level security;
alter table public.customer_product_feature_entitlements enable row level security;
alter table public.customer_product_internal_owners enable row level security;

create policy customer_product_subscriptions_select_platform_admin
on public.customer_product_subscriptions
for select
using (app_private.has_global_role('platform_admin'::public.platform_role));

create policy customer_product_feature_entitlements_select_platform_admin
on public.customer_product_feature_entitlements
for select
using (app_private.has_global_role('platform_admin'::public.platform_role));

create policy customer_product_internal_owners_select_platform_admin
on public.customer_product_internal_owners
for select
using (app_private.has_global_role('platform_admin'::public.platform_role));

create or replace view public.vw_admin_customer_product_subscriptions
with (security_barrier = true)
as
  select
    subscription.id as subscription_id,
    subscription.tenant_id,
    tenant.slug as tenant_slug,
    tenant.display_name as tenant_display_name,
    tenant.legal_name as tenant_legal_name,
    tenant.status as tenant_status,
    subscription.product_id,
    product.product_key,
    product.display_name as product_display_name,
    subscription.plan_id,
    plan.plan_key,
    plan.display_name as plan_display_name,
    subscription.status,
    subscription.started_at,
    subscription.ended_at,
    subscription.renewal_at,
    subscription.contract_reference,
    subscription.source,
    subscription.notes_internal,
    subscription.metadata,
    count(entitlement.id) filter (
      where entitlement.status = 'active'::public.customer_product_feature_entitlement_status
    )::integer as active_entitlement_count,
    count(owner.id) filter (
      where owner.status = 'active'::public.customer_product_internal_owner_status
    )::integer as active_owner_count,
    subscription.archived_at,
    subscription.created_at,
    subscription.updated_at
  from public.customer_product_subscriptions as subscription
  join public.tenants as tenant
    on tenant.id = subscription.tenant_id
  join public.commercial_products as product
    on product.id = subscription.product_id
  join public.commercial_product_plans as plan
    on plan.id = subscription.plan_id
  left join public.customer_product_feature_entitlements as entitlement
    on entitlement.subscription_id = subscription.id
  left join public.customer_product_internal_owners as owner
    on owner.subscription_id = subscription.id
  where app_private.has_global_role('platform_admin'::public.platform_role)
  group by subscription.id, tenant.id, product.id, plan.id;

create or replace view public.vw_admin_customer_product_subscription_detail
with (security_barrier = true)
as
  select
    subscription.id as subscription_id,
    subscription.tenant_id,
    tenant.slug as tenant_slug,
    tenant.display_name as tenant_display_name,
    tenant.legal_name as tenant_legal_name,
    tenant.status as tenant_status,
    subscription.product_id,
    product.product_key,
    product.display_name as product_display_name,
    subscription.plan_id,
    plan.plan_key,
    plan.display_name as plan_display_name,
    subscription.status,
    subscription.started_at,
    subscription.ended_at,
    subscription.renewal_at,
    subscription.contract_reference,
    subscription.source,
    subscription.notes_internal,
    subscription.metadata,
    subscription.archived_at,
    subscription.created_at,
    subscription.updated_at,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'entitlementId', entitlement.id,
            'featureId', feature.id,
            'featureKey', feature.feature_key,
            'displayName', feature.display_name,
            'status', entitlement.status,
            'entitlementSource', entitlement.entitlement_source,
            'reason', entitlement.reason,
            'startsAt', entitlement.starts_at,
            'endsAt', entitlement.ends_at
          )
          order by feature.sort_order, feature.feature_key, entitlement.entitlement_source
        )
        from public.customer_product_feature_entitlements as entitlement
        join public.commercial_product_features as feature
          on feature.id = entitlement.feature_id
        where entitlement.subscription_id = subscription.id
      ),
      '[]'::jsonb
    ) as entitlements,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'ownerId', owner.id,
            'ownerUserId', owner.owner_user_id,
            'ownerFullName', profile.full_name,
            'ownerEmail', profile.email,
            'areaKey', owner.area_key,
            'areaDisplayName', area.display_name,
            'ownerRole', owner.owner_role,
            'status', owner.status
          )
          order by owner.owner_role, coalesce(profile.full_name, area.display_name, owner.area_key)
        )
        from public.customer_product_internal_owners as owner
        left join public.profiles as profile
          on profile.id = owner.owner_user_id
        left join public.internal_action_target_areas as area
          on area.area_key = owner.area_key
        where owner.subscription_id = subscription.id
      ),
      '[]'::jsonb
    ) as owners
  from public.customer_product_subscriptions as subscription
  join public.tenants as tenant
    on tenant.id = subscription.tenant_id
  join public.commercial_products as product
    on product.id = subscription.product_id
  join public.commercial_product_plans as plan
    on plan.id = subscription.plan_id
  where app_private.has_global_role('platform_admin'::public.platform_role);

create or replace view public.vw_admin_customer_product_feature_entitlements
with (security_barrier = true)
as
  select
    entitlement.id as entitlement_id,
    entitlement.subscription_id,
    subscription.tenant_id,
    tenant.slug as tenant_slug,
    tenant.display_name as tenant_display_name,
    subscription.product_id,
    product.product_key,
    product.display_name as product_display_name,
    entitlement.feature_id,
    feature.feature_key,
    feature.display_name as feature_display_name,
    entitlement.status,
    entitlement.entitlement_source,
    entitlement.reason,
    entitlement.starts_at,
    entitlement.ends_at,
    entitlement.metadata,
    entitlement.archived_at,
    entitlement.created_at,
    entitlement.updated_at
  from public.customer_product_feature_entitlements as entitlement
  join public.customer_product_subscriptions as subscription
    on subscription.id = entitlement.subscription_id
  join public.tenants as tenant
    on tenant.id = subscription.tenant_id
  join public.commercial_products as product
    on product.id = subscription.product_id
  join public.commercial_product_features as feature
    on feature.id = entitlement.feature_id
  where app_private.has_global_role('platform_admin'::public.platform_role);

create or replace view public.vw_admin_customer_product_internal_owners
with (security_barrier = true)
as
  select
    owner.id as owner_id,
    owner.subscription_id,
    subscription.tenant_id,
    tenant.slug as tenant_slug,
    tenant.display_name as tenant_display_name,
    subscription.product_id,
    product.product_key,
    product.display_name as product_display_name,
    owner.owner_user_id,
    profile.full_name as owner_full_name,
    profile.email as owner_email,
    owner.area_key,
    area.display_name as area_display_name,
    owner.owner_role,
    owner.status,
    owner.notes_internal,
    owner.archived_at,
    owner.created_at,
    owner.updated_at
  from public.customer_product_internal_owners as owner
  join public.customer_product_subscriptions as subscription
    on subscription.id = owner.subscription_id
  join public.tenants as tenant
    on tenant.id = subscription.tenant_id
  join public.commercial_products as product
    on product.id = subscription.product_id
  left join public.profiles as profile
    on profile.id = owner.owner_user_id
  left join public.internal_action_target_areas as area
    on area.area_key = owner.area_key
  where app_private.has_global_role('platform_admin'::public.platform_role);

create or replace view public.vw_support_customer_product_context
with (security_barrier = true)
as
  select
    subscription.id as subscription_id,
    subscription.tenant_id,
    tenant.slug as tenant_slug,
    tenant.display_name as tenant_display_name,
    product.product_key,
    product.display_name as product_display_name,
    plan.plan_key,
    plan.display_name as plan_display_name,
    subscription.status,
    subscription.started_at,
    subscription.ended_at,
    subscription.renewal_at,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'featureKey', feature.feature_key,
            'displayName', feature.display_name,
            'entitlementSource', entitlement.entitlement_source
          )
          order by feature.sort_order, feature.feature_key
        )
        from public.customer_product_feature_entitlements as entitlement
        join public.commercial_product_features as feature
          on feature.id = entitlement.feature_id
        where entitlement.subscription_id = subscription.id
          and entitlement.status = 'active'::public.customer_product_feature_entitlement_status
          and feature.support_visible_default
      ),
      '[]'::jsonb
    ) as active_support_features,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'areaKey', owner.area_key,
            'areaDisplayName', area.display_name,
            'ownerRole', owner.owner_role
          )
          order by owner.owner_role, area.display_name
        )
        from public.customer_product_internal_owners as owner
        left join public.internal_action_target_areas as area
          on area.area_key = owner.area_key
        where owner.subscription_id = subscription.id
          and owner.status = 'active'::public.customer_product_internal_owner_status
      ),
      '[]'::jsonb
    ) as active_internal_owners
  from public.customer_product_subscriptions as subscription
  join public.tenants as tenant
    on tenant.id = subscription.tenant_id
  join public.commercial_products as product
    on product.id = subscription.product_id
  join public.commercial_product_plans as plan
    on plan.id = subscription.plan_id
  where subscription.status in (
      'active'::public.customer_product_subscription_status,
      'suspended'::public.customer_product_subscription_status
    )
    and app_private.can_access_support_workspace(subscription.tenant_id);

create or replace function public.rpc_admin_create_customer_product_subscription(
  p_tenant_id uuid,
  p_product_id uuid,
  p_plan_id uuid,
  p_status public.customer_product_subscription_status default 'pending',
  p_started_at timestamptz default null,
  p_renewal_at timestamptz default null,
  p_contract_reference text default null,
  p_source text default 'manual_admin',
  p_notes_internal text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.customer_product_subscriptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_subscription public.customer_product_subscriptions;
begin
  v_actor_user_id := app_private.require_customer_product_subscription_admin();

  insert into public.customer_product_subscriptions (
    tenant_id,
    product_id,
    plan_id,
    status,
    started_at,
    renewal_at,
    contract_reference,
    source,
    notes_internal,
    metadata,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_tenant_id,
    p_product_id,
    p_plan_id,
    coalesce(p_status, 'pending'::public.customer_product_subscription_status),
    p_started_at,
    p_renewal_at,
    app_private.assert_customer_product_subscription_text('contract_reference', p_contract_reference, 120, true),
    app_private.assert_commercial_catalog_key('source', coalesce(p_source, 'manual_admin')),
    app_private.assert_customer_product_subscription_text('notes_internal', p_notes_internal, 1000, true),
    app_private.assert_customer_product_subscription_metadata('metadata', p_metadata),
    v_actor_user_id,
    v_actor_user_id
  )
  returning *
  into v_subscription;

  return v_subscription;
end;
$$;

create or replace function public.rpc_admin_update_customer_product_subscription(
  p_subscription_id uuid,
  p_plan_id uuid default null,
  p_status public.customer_product_subscription_status default null,
  p_started_at timestamptz default null,
  p_ended_at timestamptz default null,
  p_renewal_at timestamptz default null,
  p_contract_reference text default null,
  p_notes_internal text default null,
  p_metadata jsonb default null
)
returns public.customer_product_subscriptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_subscription public.customer_product_subscriptions;
begin
  v_actor_user_id := app_private.require_customer_product_subscription_admin();

  update public.customer_product_subscriptions
  set
    plan_id = coalesce(p_plan_id, plan_id),
    status = coalesce(p_status, status),
    started_at = coalesce(p_started_at, started_at),
    ended_at = case when p_ended_at is null then ended_at else p_ended_at end,
    renewal_at = case when p_renewal_at is null then renewal_at else p_renewal_at end,
    contract_reference = case
      when p_contract_reference is null then contract_reference
      else app_private.assert_customer_product_subscription_text('contract_reference', p_contract_reference, 120, true)
    end,
    notes_internal = case
      when p_notes_internal is null then notes_internal
      else app_private.assert_customer_product_subscription_text('notes_internal', p_notes_internal, 1000, true)
    end,
    metadata = case
      when p_metadata is null then metadata
      else app_private.assert_customer_product_subscription_metadata('metadata', p_metadata)
    end,
    archived_at = case
      when coalesce(p_status, status) in (
        'cancelled'::public.customer_product_subscription_status,
        'expired'::public.customer_product_subscription_status
      ) then archived_at
      else null
    end,
    updated_by_user_id = v_actor_user_id
  where id = p_subscription_id
  returning *
  into v_subscription;

  if v_subscription.id is null then
    raise exception 'customer product subscription not found';
  end if;

  return v_subscription;
end;
$$;

create or replace function public.rpc_admin_archive_customer_product_subscription(
  p_subscription_id uuid
)
returns public.customer_product_subscriptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_subscription public.customer_product_subscriptions;
begin
  v_actor_user_id := app_private.require_customer_product_subscription_admin();

  update public.customer_product_subscriptions
  set
    status = 'cancelled'::public.customer_product_subscription_status,
    ended_at = coalesce(ended_at, timezone('utc', now())),
    renewal_at = null,
    archived_at = coalesce(archived_at, timezone('utc', now())),
    updated_by_user_id = v_actor_user_id
  where id = p_subscription_id
  returning *
  into v_subscription;

  if v_subscription.id is null then
    raise exception 'customer product subscription not found';
  end if;

  return v_subscription;
end;
$$;

create or replace function public.rpc_admin_set_customer_product_feature_entitlement(
  p_subscription_id uuid,
  p_feature_id uuid,
  p_entitlement_source public.customer_product_feature_entitlement_source default 'plan',
  p_status public.customer_product_feature_entitlement_status default 'active',
  p_reason text default null,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.customer_product_feature_entitlements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_entitlement public.customer_product_feature_entitlements;
begin
  v_actor_user_id := app_private.require_customer_product_subscription_admin();

  insert into public.customer_product_feature_entitlements (
    subscription_id,
    feature_id,
    entitlement_source,
    status,
    reason,
    starts_at,
    ends_at,
    metadata,
    archived_at,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_subscription_id,
    p_feature_id,
    coalesce(p_entitlement_source, 'plan'::public.customer_product_feature_entitlement_source),
    coalesce(p_status, 'active'::public.customer_product_feature_entitlement_status),
    app_private.assert_customer_product_subscription_text('reason', p_reason, 500, true),
    p_starts_at,
    p_ends_at,
    app_private.assert_customer_product_subscription_metadata('metadata', p_metadata),
    case
      when coalesce(p_status, 'active'::public.customer_product_feature_entitlement_status) = 'archived'::public.customer_product_feature_entitlement_status
      then timezone('utc', now())
    end,
    v_actor_user_id,
    v_actor_user_id
  )
  on conflict (subscription_id, feature_id, entitlement_source)
  do update set
    status = excluded.status,
    reason = excluded.reason,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    metadata = excluded.metadata,
    archived_at = excluded.archived_at,
    updated_by_user_id = v_actor_user_id
  returning *
  into v_entitlement;

  return v_entitlement;
end;
$$;

create or replace function public.rpc_admin_archive_customer_product_feature_entitlement(
  p_entitlement_id uuid
)
returns public.customer_product_feature_entitlements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_entitlement public.customer_product_feature_entitlements;
begin
  v_actor_user_id := app_private.require_customer_product_subscription_admin();

  update public.customer_product_feature_entitlements
  set
    status = 'archived'::public.customer_product_feature_entitlement_status,
    archived_at = coalesce(archived_at, timezone('utc', now())),
    updated_by_user_id = v_actor_user_id
  where id = p_entitlement_id
  returning *
  into v_entitlement;

  if v_entitlement.id is null then
    raise exception 'customer product feature entitlement not found';
  end if;

  return v_entitlement;
end;
$$;

create or replace function public.rpc_admin_assign_customer_product_internal_owner(
  p_subscription_id uuid,
  p_owner_role public.customer_product_internal_owner_role,
  p_owner_user_id uuid default null,
  p_area_key text default null,
  p_status public.customer_product_internal_owner_status default 'active',
  p_notes_internal text default null
)
returns public.customer_product_internal_owners
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_owner public.customer_product_internal_owners;
begin
  v_actor_user_id := app_private.require_customer_product_subscription_admin();

  insert into public.customer_product_internal_owners (
    subscription_id,
    owner_user_id,
    area_key,
    owner_role,
    status,
    notes_internal,
    archived_at,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_subscription_id,
    p_owner_user_id,
    case
      when p_area_key is null then null
      else app_private.assert_commercial_catalog_key('area_key', p_area_key)
    end,
    p_owner_role,
    coalesce(p_status, 'active'::public.customer_product_internal_owner_status),
    app_private.assert_customer_product_subscription_text('notes_internal', p_notes_internal, 500, true),
    case
      when coalesce(p_status, 'active'::public.customer_product_internal_owner_status) = 'archived'::public.customer_product_internal_owner_status
      then timezone('utc', now())
    end,
    v_actor_user_id,
    v_actor_user_id
  )
  on conflict (subscription_id, owner_user_id, area_key, owner_role)
  do update set
    status = excluded.status,
    notes_internal = excluded.notes_internal,
    archived_at = excluded.archived_at,
    updated_by_user_id = v_actor_user_id
  returning *
  into v_owner;

  return v_owner;
end;
$$;

create or replace function public.rpc_admin_archive_customer_product_internal_owner(
  p_owner_id uuid
)
returns public.customer_product_internal_owners
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_owner public.customer_product_internal_owners;
begin
  v_actor_user_id := app_private.require_customer_product_subscription_admin();

  update public.customer_product_internal_owners
  set
    status = 'archived'::public.customer_product_internal_owner_status,
    archived_at = coalesce(archived_at, timezone('utc', now())),
    updated_by_user_id = v_actor_user_id
  where id = p_owner_id
  returning *
  into v_owner;

  if v_owner.id is null then
    raise exception 'customer product internal owner not found';
  end if;

  return v_owner;
end;
$$;

revoke all on public.customer_product_subscriptions from public, anon, authenticated, service_role;
revoke all on public.customer_product_feature_entitlements from public, anon, authenticated, service_role;
revoke all on public.customer_product_internal_owners from public, anon, authenticated, service_role;

grant select on public.customer_product_subscriptions to service_role;
grant select on public.customer_product_feature_entitlements to service_role;
grant select on public.customer_product_internal_owners to service_role;

revoke all on public.vw_admin_customer_product_subscriptions from public, anon, authenticated, service_role;
revoke all on public.vw_admin_customer_product_subscription_detail from public, anon, authenticated, service_role;
revoke all on public.vw_admin_customer_product_feature_entitlements from public, anon, authenticated, service_role;
revoke all on public.vw_admin_customer_product_internal_owners from public, anon, authenticated, service_role;
revoke all on public.vw_support_customer_product_context from public, anon, authenticated, service_role;

grant select on public.vw_admin_customer_product_subscriptions to authenticated, service_role;
grant select on public.vw_admin_customer_product_subscription_detail to authenticated, service_role;
grant select on public.vw_admin_customer_product_feature_entitlements to authenticated, service_role;
grant select on public.vw_admin_customer_product_internal_owners to authenticated, service_role;
grant select on public.vw_support_customer_product_context to authenticated, service_role;

revoke all on function app_private.require_customer_product_subscription_admin() from public, anon, authenticated, service_role;
revoke all on function app_private.assert_customer_product_subscription_text(text, text, integer, boolean) from public, anon, authenticated, service_role;
revoke all on function app_private.assert_customer_product_subscription_metadata(text, jsonb) from public, anon, authenticated, service_role;
revoke all on function app_private.assert_customer_product_subscription_links() from public, anon, authenticated, service_role;

grant execute on function app_private.require_customer_product_subscription_admin() to service_role;
grant execute on function app_private.assert_customer_product_subscription_text(text, text, integer, boolean) to service_role;
grant execute on function app_private.assert_customer_product_subscription_metadata(text, jsonb) to service_role;
grant execute on function app_private.assert_customer_product_subscription_links() to service_role;

revoke all on function public.rpc_admin_create_customer_product_subscription(uuid, uuid, uuid, public.customer_product_subscription_status, timestamptz, timestamptz, text, text, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_update_customer_product_subscription(uuid, uuid, public.customer_product_subscription_status, timestamptz, timestamptz, timestamptz, text, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_archive_customer_product_subscription(uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_set_customer_product_feature_entitlement(uuid, uuid, public.customer_product_feature_entitlement_source, public.customer_product_feature_entitlement_status, text, timestamptz, timestamptz, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_archive_customer_product_feature_entitlement(uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_assign_customer_product_internal_owner(uuid, public.customer_product_internal_owner_role, uuid, text, public.customer_product_internal_owner_status, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_archive_customer_product_internal_owner(uuid) from public, anon, authenticated, service_role;

grant execute on function public.rpc_admin_create_customer_product_subscription(uuid, uuid, uuid, public.customer_product_subscription_status, timestamptz, timestamptz, text, text, text, jsonb) to authenticated;
grant execute on function public.rpc_admin_update_customer_product_subscription(uuid, uuid, public.customer_product_subscription_status, timestamptz, timestamptz, timestamptz, text, text, jsonb) to authenticated;
grant execute on function public.rpc_admin_archive_customer_product_subscription(uuid) to authenticated;
grant execute on function public.rpc_admin_set_customer_product_feature_entitlement(uuid, uuid, public.customer_product_feature_entitlement_source, public.customer_product_feature_entitlement_status, text, timestamptz, timestamptz, jsonb) to authenticated;
grant execute on function public.rpc_admin_archive_customer_product_feature_entitlement(uuid) to authenticated;
grant execute on function public.rpc_admin_assign_customer_product_internal_owner(uuid, public.customer_product_internal_owner_role, uuid, text, public.customer_product_internal_owner_status, text) to authenticated;
grant execute on function public.rpc_admin_archive_customer_product_internal_owner(uuid) to authenticated;

comment on table public.customer_product_subscriptions is
  'OCP V1-E: assinatura operacional tenant-produto-plano. Nao contem preco, faturamento ou cobranca.';

comment on table public.customer_product_feature_entitlements is
  'OCP V1-E: entitlements comerciais por assinatura, separados de feature flags operacionais e entitlements de conhecimento.';

comment on table public.customer_product_internal_owners is
  'OCP V1-E: ownership operacional interno da assinatura. Nao concede permissao.';

comment on view public.vw_admin_customer_product_subscriptions is
  'Read model administrativo OCP V1-E de assinaturas por cliente/produto/plano.';

comment on view public.vw_admin_customer_product_subscription_detail is
  'Read model administrativo OCP V1-E de detalhe da assinatura com entitlements e ownership.';

comment on view public.vw_admin_customer_product_feature_entitlements is
  'Read model administrativo OCP V1-E de entitlements comerciais por assinatura.';

comment on view public.vw_admin_customer_product_internal_owners is
  'Read model administrativo OCP V1-E de owners internos por assinatura.';

comment on view public.vw_support_customer_product_context is
  'Read model support-safe OCP V1-E de contexto produto/plano/features, restrito por can_access_support_workspace.';
