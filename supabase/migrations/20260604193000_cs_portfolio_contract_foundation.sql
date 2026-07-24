create or replace function app_private.can_access_cs_customer_portfolio(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    app_private.has_global_role('platform_admin'::public.platform_role)
    or exists (
      select 1
      from public.internal_area_memberships as iam
      join public.tenant_memberships as tm
        on tm.tenant_id = iam.tenant_id
       and tm.user_id = iam.user_id
       and tm.status = 'active'::public.membership_status
      join public.profiles as profile
        on profile.id = iam.user_id
       and profile.is_active
      join public.internal_action_target_areas as area
        on area.area_key = iam.area_key
       and area.status = 'active'::public.ticket_reference_status
      where iam.tenant_id = target_tenant_id
        and iam.user_id = auth.uid()
        and iam.area_key = 'customer_success'
        and iam.status = 'active'::public.internal_area_membership_status
        and iam.role in (
          'viewer'::public.internal_area_membership_role,
          'member'::public.internal_area_membership_role,
          'manager'::public.internal_area_membership_role
        )
    );
$$;

create or replace view public.vw_cs_customer_portfolio
with (security_barrier = true)
as
  select
    tenant.id as tenant_id,
    tenant.slug as tenant_slug,
    tenant.display_name as tenant_display_name,
    tenant.legal_name as tenant_legal_name,
    tenant.status as tenant_status,
    'customer_success_area'::text as portfolio_scope,
    cs_owner.owner_user_id as cs_owner_user_id,
    cs_owner.owner_full_name as cs_owner_full_name,
    cs_owner.owner_email as cs_owner_email,
    cs_owner.area_key as cs_owner_area_key,
    cs_owner.area_display_name as cs_owner_area_display_name,
    coalesce(products.active_subscription_count, 0) as active_subscription_count,
    coalesce(products.active_product_count, 0) as active_product_count,
    coalesce(products.product_contexts, '[]'::jsonb) as product_contexts,
    coalesce(ticket_counts.open_ticket_count, 0) as open_ticket_count,
    coalesce(ticket_counts.total_ticket_count, 0) as total_ticket_count,
    coalesce(ticket_counts.ticket_status_counts, '{}'::jsonb) as ticket_status_counts,
    coalesce(cs_members.customer_success_member_count, 0) as customer_success_member_count,
    'unavailable'::text as health_summary_status,
    'Health score nao materializado neste contrato.'::text as health_summary_reason,
    greatest(
      tenant.updated_at,
      coalesce(products.last_subscription_updated_at, tenant.updated_at),
      coalesce(ticket_counts.last_ticket_updated_at, tenant.updated_at)
    ) as last_operational_update_at,
    tenant.created_at,
    tenant.updated_at
  from public.tenants as tenant
  left join lateral (
    select
      count(*)::integer as active_subscription_count,
      count(distinct subscription.product_id)::integer as active_product_count,
      max(subscription.updated_at) as last_subscription_updated_at,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'subscriptionId', subscription.id,
            'productKey', product.product_key,
            'productDisplayName', product.display_name,
            'planKey', plan.plan_key,
            'planDisplayName', plan.display_name,
            'status', subscription.status,
            'startedAt', subscription.started_at,
            'endedAt', subscription.ended_at,
            'renewalAt', subscription.renewal_at,
            'activeFeatureCount', coalesce(feature_counts.active_feature_count, 0),
            'activeOwnerCount', coalesce(owner_counts.active_owner_count, 0)
          )
          order by product.display_name, plan.display_name, subscription.created_at
        ),
        '[]'::jsonb
      ) as product_contexts
    from public.customer_product_subscriptions as subscription
    join public.commercial_products as product
      on product.id = subscription.product_id
    join public.commercial_product_plans as plan
      on plan.id = subscription.plan_id
    left join lateral (
      select count(*)::integer as active_feature_count
      from public.customer_product_feature_entitlements as entitlement
      where entitlement.subscription_id = subscription.id
        and entitlement.status = 'active'::public.customer_product_feature_entitlement_status
    ) as feature_counts on true
    left join lateral (
      select count(*)::integer as active_owner_count
      from public.customer_product_internal_owners as owner
      where owner.subscription_id = subscription.id
        and owner.status = 'active'::public.customer_product_internal_owner_status
    ) as owner_counts on true
    where subscription.tenant_id = tenant.id
      and subscription.status in (
        'active'::public.customer_product_subscription_status,
        'suspended'::public.customer_product_subscription_status
      )
  ) as products on true
  left join lateral (
    select
      coalesce(sum(status_counts.status_count), 0)::integer as total_ticket_count,
      coalesce(
        sum(status_counts.status_count) filter (
          where status_counts.status <> all(array['resolved', 'closed', 'cancelled']::public.ticket_status[])
        ),
        0
      )::integer as open_ticket_count,
      max(status_counts.last_status_updated_at) as last_ticket_updated_at,
      coalesce(
        jsonb_object_agg(status_counts.status, status_counts.status_count order by status_counts.status),
        '{}'::jsonb
      ) as ticket_status_counts
    from (
      select
        grouped.status,
        count(*)::integer as status_count,
        max(grouped.updated_at) as last_status_updated_at
      from public.tickets as grouped
      where grouped.tenant_id = tenant.id
      group by grouped.status
    ) as status_counts
  ) as ticket_counts on true
  left join lateral (
    select
      owner.owner_user_id,
      profile.full_name as owner_full_name,
      profile.email as owner_email,
      owner.area_key,
      area.display_name as area_display_name
    from public.customer_product_subscriptions as subscription
    join public.customer_product_internal_owners as owner
      on owner.subscription_id = subscription.id
    left join public.profiles as profile
      on profile.id = owner.owner_user_id
    left join public.internal_action_target_areas as area
      on area.area_key = owner.area_key
    where subscription.tenant_id = tenant.id
      and subscription.status in (
        'active'::public.customer_product_subscription_status,
        'suspended'::public.customer_product_subscription_status
      )
      and owner.status = 'active'::public.customer_product_internal_owner_status
      and owner.owner_role = 'cs_owner'::public.customer_product_internal_owner_role
    order by (owner.owner_user_id is null), profile.full_name nulls last, owner.updated_at desc
    limit 1
  ) as cs_owner on true
  left join lateral (
    select count(distinct iam.user_id)::integer as customer_success_member_count
    from public.internal_area_memberships as iam
    join public.profiles as profile
      on profile.id = iam.user_id
     and profile.is_active
    where iam.tenant_id = tenant.id
      and iam.area_key = 'customer_success'
      and iam.status = 'active'::public.internal_area_membership_status
  ) as cs_members on true
  where app_private.can_access_cs_customer_portfolio(tenant.id);

revoke all on function app_private.can_access_cs_customer_portfolio(uuid) from public, anon, authenticated, service_role;
grant execute on function app_private.can_access_cs_customer_portfolio(uuid) to authenticated, service_role;

revoke all on public.vw_cs_customer_portfolio from public, anon, authenticated, service_role;
grant select on public.vw_cs_customer_portfolio to authenticated, service_role;

comment on function app_private.can_access_cs_customer_portfolio(uuid) is
  'Gate inicial read-only para Portfolio CS. Autoriza platform_admin ou membership ativa na area customer_success do tenant, sem criar role global nova.';

comment on view public.vw_cs_customer_portfolio is
  'Read model inicial do CS Portfolio. Exibe carteira por tenant com produto/plano, contadores de tickets e health indisponivel, sem billing, financeiro, mutacao ou regra no frontend.';
