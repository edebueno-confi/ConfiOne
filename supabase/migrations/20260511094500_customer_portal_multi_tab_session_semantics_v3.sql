drop view if exists public.vw_customer_portal_active_tenant_context;
drop function if exists public.rpc_customer_set_active_tenant(uuid);

create view public.vw_customer_portal_active_tenant_context
with (security_barrier = true)
as
with available_rollup as (
  select count(*)::integer as available_tenant_count
  from app_private.vw_customer_portal_available_tenant_scope
),
preference as (
  select
    customer_portal_user_preferences.active_tenant_id,
    customer_portal_user_preferences.updated_at
  from public.customer_portal_user_preferences
  where customer_portal_user_preferences.user_id = auth.uid()
  limit 1
)
select
  ctx.user_id,
  ctx.user_full_name,
  ctx.user_email,
  ctx.tenant_id,
  ctx.tenant_slug,
  ctx.tenant_display_name,
  ctx.tenant_legal_name,
  ctx.portal_role,
  ctx.contact_id,
  ctx.contact_full_name,
  ctx.contact_email,
  ctx.contact_job_title,
  ctx.product_line,
  ctx.operational_status,
  ctx.account_tier,
  ctx.can_view_tickets,
  ctx.can_create_ticket,
  ctx.can_view_all_tenant_tickets,
  available_rollup.available_tenant_count,
  (available_rollup.available_tenant_count > 1) as has_multiple_tenants,
  coalesce(
    case
      when preference.active_tenant_id = ctx.tenant_id then preference.updated_at
      else null::timestamptz
    end,
    '1970-01-01T00:00:00+00:00'::timestamptz
  ) as context_version
from public.vw_customer_portal_profile_context as ctx
cross join available_rollup
left join preference on true;

create or replace function public.rpc_customer_set_active_tenant(
  p_tenant_id uuid
)
returns table (
  user_id uuid,
  user_full_name text,
  user_email text,
  tenant_id uuid,
  tenant_slug text,
  tenant_display_name text,
  tenant_legal_name text,
  portal_role text,
  contact_id uuid,
  contact_full_name text,
  contact_email text,
  contact_job_title text,
  product_line text,
  operational_status text,
  account_tier text,
  can_view_tickets boolean,
  can_create_ticket boolean,
  can_view_all_tenant_tickets boolean,
  available_tenant_count integer,
  has_multiple_tenants boolean,
  context_version timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_actor_user_id uuid;
  v_existing_preference public.customer_portal_user_preferences;
begin
  v_actor_user_id := app_private.require_active_actor();

  if p_tenant_id is null then
    raise exception 'tenant_id is required';
  end if;

  if not app_private.is_customer_portal_member(p_tenant_id) then
    raise exception 'rpc_customer_set_active_tenant denied';
  end if;

  select *
  into v_existing_preference
  from public.customer_portal_user_preferences as preference
  where preference.user_id = v_actor_user_id
  limit 1;

  if v_existing_preference.user_id is not null
     and v_existing_preference.active_tenant_id = p_tenant_id then
    return query
    select
      ctx.user_id,
      ctx.user_full_name,
      ctx.user_email::text,
      ctx.tenant_id,
      ctx.tenant_slug,
      ctx.tenant_display_name,
      ctx.tenant_legal_name,
      ctx.portal_role,
      ctx.contact_id,
      ctx.contact_full_name,
      ctx.contact_email::text,
      ctx.contact_job_title,
      ctx.product_line,
      ctx.operational_status,
      ctx.account_tier,
      ctx.can_view_tickets,
      ctx.can_create_ticket,
      ctx.can_view_all_tenant_tickets,
      ctx.available_tenant_count,
      ctx.has_multiple_tenants,
      ctx.context_version
    from public.vw_customer_portal_active_tenant_context as ctx;
    return;
  end if;

  insert into public.customer_portal_user_preferences (
    user_id,
    active_tenant_id,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    v_actor_user_id,
    p_tenant_id,
    v_actor_user_id,
    v_actor_user_id
  )
  on conflict (user_id)
  do update
  set
    active_tenant_id = excluded.active_tenant_id,
    updated_by_user_id = excluded.updated_by_user_id
  where public.customer_portal_user_preferences.active_tenant_id is distinct from excluded.active_tenant_id;

  return query
  select
    ctx.user_id,
    ctx.user_full_name,
    ctx.user_email::text,
    ctx.tenant_id,
    ctx.tenant_slug,
    ctx.tenant_display_name,
    ctx.tenant_legal_name,
    ctx.portal_role,
    ctx.contact_id,
    ctx.contact_full_name,
    ctx.contact_email::text,
    ctx.contact_job_title,
    ctx.product_line,
    ctx.operational_status,
    ctx.account_tier,
    ctx.can_view_tickets,
    ctx.can_create_ticket,
    ctx.can_view_all_tenant_tickets,
    ctx.available_tenant_count,
    ctx.has_multiple_tenants,
    ctx.context_version
  from public.vw_customer_portal_active_tenant_context as ctx
  where ctx.tenant_id = p_tenant_id;
end;
$$;

revoke all on public.vw_customer_portal_active_tenant_context from public, anon, authenticated, service_role;
grant select on public.vw_customer_portal_active_tenant_context to authenticated, service_role;

revoke all on function public.rpc_customer_set_active_tenant(uuid) from public, anon, authenticated, service_role;
grant execute on function public.rpc_customer_set_active_tenant(uuid) to authenticated, service_role;

comment on view public.vw_customer_portal_active_tenant_context is
  'Contexto ativo customer-facing com context_version backend-governed para revalidacao segura de sessao multiaba.';

comment on function public.rpc_customer_set_active_tenant(uuid) is
  'Seleciona com seguranca o tenant ativo do portal cliente e devolve o context_version atualizado para sessao multiaba.';
