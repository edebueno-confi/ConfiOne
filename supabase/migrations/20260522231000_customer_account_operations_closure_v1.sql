create or replace view public.vw_admin_customer_account_profile_detail
with (security_invoker = true)
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
with (security_invoker = true)
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
with (security_invoker = true)
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
with (security_invoker = true)
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
with (security_invoker = true)
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
with (security_invoker = true)
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
with (security_invoker = true)
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

create or replace function public.rpc_admin_archive_customer_integration(
  p_integration_id uuid
)
returns public.customer_account_integrations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_integration public.customer_account_integrations;
begin
  v_actor_user_id := app_private.require_customer_account_admin();

  update public.customer_account_integrations
  set
    status = 'disabled'::public.customer_integration_status,
    updated_by_user_id = v_actor_user_id
  where id = p_integration_id
  returning *
  into v_integration;

  if v_integration.id is null then
    raise exception 'customer integration not found';
  end if;

  return v_integration;
end;
$$;

create or replace function public.rpc_admin_archive_customer_customization(
  p_customization_id uuid
)
returns public.customer_account_customizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_customization public.customer_account_customizations;
begin
  v_actor_user_id := app_private.require_customer_account_admin();

  update public.customer_account_customizations
  set
    status = 'archived',
    updated_by_user_id = v_actor_user_id
  where id = p_customization_id
  returning *
  into v_customization;

  if v_customization.id is null then
    raise exception 'customer customization not found';
  end if;

  return v_customization;
end;
$$;

create or replace function public.rpc_admin_update_customer_account_alert(
  p_alert_id uuid,
  p_severity public.customer_alert_severity,
  p_title text,
  p_description text,
  p_active boolean default true,
  p_expires_at timestamptz default null
)
returns public.customer_account_alerts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_alert public.customer_account_alerts;
begin
  v_actor_user_id := app_private.require_customer_account_admin();

  update public.customer_account_alerts
  set
    severity = p_severity,
    title = app_private.assert_customer_account_safe_text('alert_title', p_title, 160, false),
    description = app_private.assert_customer_account_safe_text('alert_description', p_description, 1000, false),
    active = coalesce(p_active, true),
    expires_at = p_expires_at,
    updated_by_user_id = v_actor_user_id
  where id = p_alert_id
  returning *
  into v_alert;

  if v_alert.id is null then
    raise exception 'customer account alert not found';
  end if;

  return v_alert;
end;
$$;

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

revoke all on function public.rpc_admin_archive_customer_integration(uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_archive_customer_customization(uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_update_customer_account_alert(uuid, public.customer_alert_severity, text, text, boolean, timestamptz) from public, anon, authenticated, service_role;

grant execute on function public.rpc_admin_archive_customer_integration(uuid) to authenticated;
grant execute on function public.rpc_admin_archive_customer_customization(uuid) to authenticated;
grant execute on function public.rpc_admin_update_customer_account_alert(uuid, public.customer_alert_severity, text, text, boolean, timestamptz) to authenticated;

comment on view public.vw_admin_customer_account_profile_detail is
  'Detalhe administrativo governado da conta B2B, sem exigir SELECT direto nas tabelas base.';
comment on view public.vw_admin_customer_account_integrations is
  'Integrações operacionais sanitizadas da conta B2B para governança administrativa.';
comment on view public.vw_admin_customer_account_customizations is
  'Customizações e exceções operacionais sanitizadas da conta B2B para governança administrativa.';
comment on view public.vw_admin_customer_account_alerts is
  'Alertas internos sanitizados da conta B2B para governança administrativa.';
comment on view public.vw_admin_customer_account_features is
  'Feature flags operacionais da conta B2B para governança administrativa.';
comment on view public.vw_support_customers_list is
  'Lista operacional de clientes B2B para suporte, derivada de read models governados.';
comment on view public.vw_support_customer_detail is
  'Detalhe operacional de cliente B2B para suporte, sem dados sensíveis de portal ou audit bruto.';
