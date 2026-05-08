create or replace function public.rpc_admin_set_customer_feature_flag(
  p_tenant_id uuid,
  p_feature_key text,
  p_enabled boolean,
  p_source text default 'operations',
  p_notes text default null
)
returns public.customer_account_features
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_feature public.customer_account_features;
begin
  v_actor_user_id := app_private.require_customer_account_admin();

  if not exists (
    select 1
    from public.tenants as tenant
    where tenant.id = p_tenant_id
  ) then
    raise exception 'tenant not found';
  end if;

  insert into public.customer_account_features (
    tenant_id,
    feature_key,
    enabled,
    source,
    notes,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_tenant_id,
    app_private.assert_customer_account_safe_text('feature_key', p_feature_key, 120, false),
    coalesce(p_enabled, false),
    app_private.assert_customer_account_safe_text('feature_source', p_source, 120, false),
    app_private.assert_customer_account_safe_text('feature_notes', p_notes, 800, true),
    v_actor_user_id,
    v_actor_user_id
  )
  on conflict (tenant_id, lower(feature_key))
  do update
  set
    enabled = excluded.enabled,
    source = excluded.source,
    notes = excluded.notes,
    updated_by_user_id = v_actor_user_id
  returning *
  into v_feature;

  return v_feature;
end;
$$;

revoke all on function public.rpc_admin_set_customer_feature_flag(uuid, text, boolean, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.rpc_admin_set_customer_feature_flag(uuid, text, boolean, text, text)
  to authenticated;

comment on function public.rpc_admin_set_customer_feature_flag(uuid, text, boolean, text, text) is
  'Permite que platform_admin materialize ou atualize uma feature operacional segura do Customer Account Profile, com tenant explicito, validacao de texto e auditoria por trigger.';
