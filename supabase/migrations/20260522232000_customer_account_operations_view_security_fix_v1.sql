create or replace view public.vw_admin_customer_account_profile_detail
as
select
  tenant.id as tenant_id,
  tenant.slug as tenant_slug,
  tenant.display_name as tenant_display_name,
  tenant.legal_name as tenant_legal_name,
  tenant.status as tenant_status,
  profile.id as profile_id,
  profile.product_line,
  profile.operational_status,
  profile.account_tier,
  profile.internal_notes,
  coalesce(profile.operational_flags, '{}'::jsonb) as operational_flags,
  profile.created_at,
  profile.updated_at,
  profile.created_by_user_id,
  created_by.full_name as created_by_full_name,
  profile.updated_by_user_id,
  updated_by.full_name as updated_by_full_name,
  app_private.can_read_customer_account_admin() as can_update_profile
from public.tenants as tenant
left join public.customer_account_profiles as profile
  on profile.tenant_id = tenant.id
left join public.profiles as created_by
  on created_by.id = profile.created_by_user_id
left join public.profiles as updated_by
  on updated_by.id = profile.updated_by_user_id
where app_private.can_read_customer_account_admin();

create or replace view public.vw_admin_customer_account_integrations
as
select
  integration.id,
  integration.tenant_id,
  tenant.slug as tenant_slug,
  tenant.display_name as tenant_display_name,
  integration.integration_type,
  integration.provider,
  integration.status,
  integration.environment,
  integration.notes,
  integration.created_at,
  integration.updated_at,
  integration.created_by_user_id,
  integration.updated_by_user_id,
  app_private.can_read_customer_account_admin() as can_update,
  integration.status <> 'disabled'::public.customer_integration_status as can_archive
from public.customer_account_integrations as integration
join public.tenants as tenant
  on tenant.id = integration.tenant_id
where app_private.can_read_customer_account_admin();

create or replace view public.vw_admin_customer_account_customizations
as
select
  customization.id,
  customization.tenant_id,
  tenant.slug as tenant_slug,
  tenant.display_name as tenant_display_name,
  customization.title,
  customization.description,
  customization.risk_level,
  customization.operational_note,
  customization.status,
  customization.created_at,
  customization.updated_at,
  customization.created_by_user_id,
  customization.updated_by_user_id,
  app_private.can_read_customer_account_admin() as can_update,
  customization.status <> 'archived' as can_archive
from public.customer_account_customizations as customization
join public.tenants as tenant
  on tenant.id = customization.tenant_id
where app_private.can_read_customer_account_admin();

create or replace view public.vw_admin_customer_account_alerts
as
select
  alert.id,
  alert.tenant_id,
  tenant.slug as tenant_slug,
  tenant.display_name as tenant_display_name,
  alert.severity,
  alert.title,
  alert.description,
  alert.active,
  alert.expires_at,
  alert.created_at,
  alert.updated_at,
  alert.created_by_user_id,
  alert.updated_by_user_id,
  app_private.can_read_customer_account_admin() as can_update,
  alert.active as can_archive
from public.customer_account_alerts as alert
join public.tenants as tenant
  on tenant.id = alert.tenant_id
where app_private.can_read_customer_account_admin();

create or replace view public.vw_admin_customer_account_features
as
select
  feature.id,
  feature.tenant_id,
  tenant.slug as tenant_slug,
  tenant.display_name as tenant_display_name,
  feature.feature_key,
  feature.enabled,
  feature.source,
  feature.notes,
  feature.created_at,
  feature.updated_at,
  feature.created_by_user_id,
  feature.updated_by_user_id,
  app_private.can_read_customer_account_admin() as can_update
from public.customer_account_features as feature
join public.tenants as tenant
  on tenant.id = feature.tenant_id
where app_private.can_read_customer_account_admin();

create or replace view public.vw_support_customers_list
as
select
  customer.tenant_id,
  customer.tenant_slug,
  customer.tenant_display_name,
  customer.tenant_legal_name,
  customer.tenant_status,
  account.product_line,
  account.operational_status,
  account.account_tier,
  account.integrations,
  account.enabled_features,
  account.active_customizations,
  account.active_alerts,
  customer.active_contacts_count,
  customer.total_ticket_count,
  customer.open_ticket_count,
  customer.ticket_status_counts,
  customer.tenant_updated_at
from public.vw_support_customer_360 as customer
left join public.vw_support_customer_account_context as account
  on account.tenant_id = customer.tenant_id;

create or replace view public.vw_support_customer_detail
as
select
  account.*,
  recent.recent_tickets,
  events.recent_events
from public.vw_support_customer_account_context as account
left join lateral (
  select coalesce(jsonb_agg(to_jsonb(ticket_row) order by ticket_row.updated_at desc), '[]'::jsonb) as recent_tickets
  from public.vw_support_customer_recent_tickets as ticket_row
  where ticket_row.tenant_id = account.tenant_id
) as recent
  on true
left join lateral (
  select coalesce(jsonb_agg(to_jsonb(event_row) order by event_row.occurred_at desc), '[]'::jsonb) as recent_events
  from public.vw_support_customer_recent_events as event_row
  where event_row.tenant_id = account.tenant_id
) as events
  on true;

revoke all on public.vw_admin_customer_account_profile_detail from public, anon, authenticated, service_role;
revoke all on public.vw_admin_customer_account_integrations from public, anon, authenticated, service_role;
revoke all on public.vw_admin_customer_account_customizations from public, anon, authenticated, service_role;
revoke all on public.vw_admin_customer_account_alerts from public, anon, authenticated, service_role;
revoke all on public.vw_admin_customer_account_features from public, anon, authenticated, service_role;
revoke all on public.vw_support_customers_list from public, anon, authenticated, service_role;
revoke all on public.vw_support_customer_detail from public, anon, authenticated, service_role;

grant select on public.vw_admin_customer_account_profile_detail to authenticated, service_role;
grant select on public.vw_admin_customer_account_integrations to authenticated, service_role;
grant select on public.vw_admin_customer_account_customizations to authenticated, service_role;
grant select on public.vw_admin_customer_account_alerts to authenticated, service_role;
grant select on public.vw_admin_customer_account_features to authenticated, service_role;
grant select on public.vw_support_customers_list to authenticated, service_role;
grant select on public.vw_support_customer_detail to authenticated, service_role;
