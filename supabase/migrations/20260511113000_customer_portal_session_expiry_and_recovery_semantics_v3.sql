create or replace function public.rpc_customer_get_portal_session_status()
returns table (
  session_state text,
  reason_code text,
  reason_message text,
  active_tenant_id uuid,
  active_tenant_name text,
  available_tenant_count integer,
  context_version timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_actor_user_id uuid;
begin
  v_actor_user_id := auth.uid();

  if v_actor_user_id is null then
    raise exception 'authenticated actor required';
  end if;

  return query
  with profile_state as (
    select
      profile.id as user_id,
      profile.is_active
    from public.profiles as profile
    where profile.id = v_actor_user_id
  ),
  active_membership_scope as (
    select
      membership.tenant_id,
      tenant.display_name as tenant_display_name
    from public.tenant_memberships as membership
    join public.tenants as tenant
      on tenant.id = membership.tenant_id
     and tenant.status = 'active'::public.tenant_status
    join lateral (
      select tenant_contact.id
      from public.tenant_contacts as tenant_contact
      where tenant_contact.tenant_id = membership.tenant_id
        and tenant_contact.linked_user_id = membership.user_id
        and tenant_contact.is_active
      order by tenant_contact.is_primary desc, tenant_contact.created_at asc
      limit 1
    ) as contact on true
    where membership.user_id = v_actor_user_id
      and membership.status = 'active'::public.membership_status
      and membership.role::text in ('customer_user', 'customer_manager')
  ),
  portal_enabled_scope as (
    select
      membership.tenant_id,
      tenant.display_name as tenant_display_name
    from public.tenant_memberships as membership
    join public.tenants as tenant
      on tenant.id = membership.tenant_id
     and tenant.status = 'active'::public.tenant_status
    join lateral (
      select tenant_contact.id
      from public.tenant_contacts as tenant_contact
      where tenant_contact.tenant_id = membership.tenant_id
        and tenant_contact.linked_user_id = membership.user_id
        and tenant_contact.is_active
      order by tenant_contact.is_primary desc, tenant_contact.created_at asc
      limit 1
    ) as contact on true
    join public.customer_account_features as feature
      on feature.tenant_id = membership.tenant_id
     and lower(feature.feature_key) = 'returns_portal'
     and feature.enabled
    where membership.user_id = v_actor_user_id
      and membership.status = 'active'::public.membership_status
      and membership.role::text in ('customer_user', 'customer_manager')
  ),
  available_scope as (
    select
      scope.tenant_id,
      scope.tenant_display_name
    from app_private.vw_customer_portal_available_tenant_scope as scope
  ),
  active_context as (
    select
      ctx.tenant_id,
      ctx.tenant_display_name,
      ctx.context_version
    from public.vw_customer_portal_active_tenant_context as ctx
    limit 1
  ),
  preference_state as (
    select preference.active_tenant_id
    from public.customer_portal_user_preferences as preference
    where preference.user_id = v_actor_user_id
    limit 1
  ),
  counts as (
    select
      (select count(*)::integer from available_scope) as available_tenant_count,
      (select count(*)::integer from active_membership_scope) as active_membership_count,
      (select count(*)::integer from portal_enabled_scope) as portal_enabled_count
  ),
  classification as (
    select
      case
        when exists (select 1 from active_context) then 'ready'
        when not exists (select 1 from profile_state) then 'access_revoked'
        when exists (select 1 from profile_state where not is_active) then 'access_revoked'
        when (select active_membership_count from counts) = 0 then 'access_revoked'
        else 'tenant_unavailable'
      end as session_state,
      case
        when exists (select 1 from active_context) then null::text
        when not exists (select 1 from profile_state) then 'profile_missing'
        when exists (select 1 from profile_state where not is_active) then 'profile_inactive'
        when (select active_membership_count from counts) = 0 then 'membership_revoked'
        when (select portal_enabled_count from counts) = 0 then 'returns_portal_disabled'
        when exists (
          select 1
          from preference_state
          where active_tenant_id is not null
        ) then 'no_active_tenant'
        else 'tenant_unavailable'
      end as reason_code,
      case
        when exists (select 1 from active_context) then null::text
        when not exists (select 1 from profile_state) then
          'Seu perfil customer-facing não está mais disponível para esta sessão.'
        when exists (select 1 from profile_state where not is_active) then
          'Seu acesso customer-facing foi desativado. Entre em contato com a equipe responsável.'
        when (select active_membership_count from counts) = 0 then
          'Seu vínculo customer-facing ativo não está mais disponível no portal.'
        when (select portal_enabled_count from counts) = 0 then
          'Nenhum tenant com portal habilitado está disponível para esta sessão agora.'
        when exists (
          select 1
          from preference_state
          where active_tenant_id is not null
        ) then
          'O tenant ativo anterior não está mais disponível para esta sessão. Atualize o contexto para continuar.'
        else
          'Nenhum tenant habilitado está disponível para esta sessão agora.'
      end as reason_message,
      (select tenant_id from active_context) as active_tenant_id,
      (select tenant_display_name from active_context) as active_tenant_name,
      (select available_tenant_count from counts) as available_tenant_count,
      (select context_version from active_context) as context_version
  )
  select
    classification.session_state,
    classification.reason_code,
    classification.reason_message,
    classification.active_tenant_id,
    classification.active_tenant_name,
    classification.available_tenant_count,
    classification.context_version
  from classification;
end;
$$;

revoke all on function public.rpc_customer_get_portal_session_status() from public, anon, authenticated, service_role;
grant execute on function public.rpc_customer_get_portal_session_status() to authenticated, service_role;

comment on function public.rpc_customer_get_portal_session_status() is
  'Classifica o estado operacional customer-facing do portal para expiração, revogação e indisponibilidade de tenant sem criar auth paralela.';
