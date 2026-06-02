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
    coalesce(entitlement_counts.active_entitlement_count, 0)::integer as active_entitlement_count,
    coalesce(owner_counts.active_owner_count, 0)::integer as active_owner_count,
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
  left join lateral (
    select count(*)::integer as active_entitlement_count
    from public.customer_product_feature_entitlements as entitlement
    where entitlement.subscription_id = subscription.id
      and entitlement.status = 'active'::public.customer_product_feature_entitlement_status
  ) as entitlement_counts on true
  left join lateral (
    select count(*)::integer as active_owner_count
    from public.customer_product_internal_owners as owner
    where owner.subscription_id = subscription.id
      and owner.status = 'active'::public.customer_product_internal_owner_status
  ) as owner_counts on true
  where app_private.has_global_role('platform_admin'::public.platform_role);

comment on view public.vw_admin_customer_product_subscriptions is
  'Read model administrativo OCP V1-E de assinaturas cliente-produto-plano com contagens independentes de entitlements e ownership.';
