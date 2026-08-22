create or replace function public.rpc_admin_import_customer_inventory_snapshot(
  p_tenant_id uuid,
  p_source_id uuid,
  p_store_id uuid,
  p_source_system text,
  p_schema_version text,
  p_catalog_version text,
  p_extracted_at timestamptz,
  p_fingerprint text,
  p_package_manifest jsonb,
  p_observations jsonb,
  p_sanitized boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_snapshot public.customer_inventory_snapshots;
  v_item jsonb;
  v_feature_key text;
begin
  v_actor := app_private.require_customer_operations_admin();
  if not p_sanitized then raise exception 'inventory package must be sanitized before import'; end if;
  if jsonb_typeof(coalesce(p_package_manifest, '{}'::jsonb)) <> 'object' or jsonb_typeof(coalesce(p_observations, '[]'::jsonb)) <> 'array' then
    raise exception 'inventory package manifest and observations must have valid JSON types';
  end if;
  if not exists (
    select 1 from public.customer_account_stores st
    join public.customer_account_sources src on src.id = st.source_id
    where st.id = p_store_id and st.tenant_id = p_tenant_id and st.source_id = p_source_id
  ) then raise exception 'inventory package client, source and store do not match'; end if;
  select * into v_snapshot from public.customer_inventory_snapshots s where s.store_id = p_store_id and s.fingerprint = p_fingerprint;
  if v_snapshot.id is not null then
    if v_snapshot.tenant_id <> p_tenant_id or v_snapshot.source_id <> p_source_id then raise exception 'inventory fingerprint belongs to another client or source'; end if;
    return v_snapshot.id;
  end if;
  insert into public.customer_inventory_snapshots (
    tenant_id, source_id, store_id, source_system, schema_version, catalog_version,
    extracted_at, fingerprint, package_manifest, status, sanitized, created_by_user_id
  ) values (
    p_tenant_id, p_source_id, p_store_id,
    app_private.assert_customer_account_safe_text('inventory_source_system', p_source_system, 120, false),
    app_private.assert_customer_account_safe_text('inventory_schema_version', p_schema_version, 80, false),
    app_private.assert_customer_account_safe_text('inventory_catalog_version', p_catalog_version, 120, false),
    p_extracted_at, app_private.assert_customer_account_safe_text('inventory_fingerprint', p_fingerprint, 240, false),
    p_package_manifest, 'accepted', true, v_actor
  ) returning * into v_snapshot;
  for v_item in select value from jsonb_array_elements(p_observations)
  loop
    v_feature_key := app_private.assert_customer_account_safe_text('feature_key', v_item ->> 'feature_key', 160, false);
    insert into public.customer_inventory_feature_observations (
      snapshot_id, tenant_id, store_id, source_product, source_version, domain,
      feature_key, feature_name, feature_description, contracted_status,
      boss_enabled_status, observed_status, usage_status, confidence, evidence_id,
      observed_at, catalog_version, fingerprint, notes
    )
    select v_snapshot.id, p_tenant_id, p_store_id, src.source_product, src.source_version,
      app_private.assert_customer_account_safe_text('feature_domain', v_item ->> 'domain', 120, false),
      v_feature_key,
      app_private.assert_customer_account_safe_text('feature_name', v_item ->> 'feature_name', 180, false),
      app_private.assert_customer_account_safe_text('feature_description', v_item ->> 'feature_description', 1000, true),
      coalesce((v_item ->> 'contracted_status')::public.customer_feature_contract_status, 'unknown'),
      coalesce((v_item ->> 'boss_enabled_status')::public.customer_feature_boss_status, 'not_applicable'),
      coalesce((v_item ->> 'observed_status')::public.customer_feature_observed_status, 'unknown'),
      coalesce((v_item ->> 'usage_status')::public.customer_feature_usage_status, 'unknown'),
      coalesce(nullif(v_item ->> 'confidence', ''), 'unverified'),
      nullif(v_item ->> 'evidence_id', '')::uuid,
      coalesce((v_item ->> 'observed_at')::timestamptz, p_extracted_at),
      p_catalog_version, p_fingerprint,
      app_private.assert_customer_account_safe_text('feature_notes', v_item ->> 'notes', 1000, true)
    from public.customer_account_sources src where src.id = p_source_id;
  end loop;
  return v_snapshot.id;
exception when unique_violation then
  select * into v_snapshot from public.customer_inventory_snapshots where store_id = p_store_id and fingerprint = p_fingerprint;
  if v_snapshot.id is null then raise; end if;
  return v_snapshot.id;
end;
$$;

revoke all on function public.rpc_admin_import_customer_inventory_snapshot(uuid, uuid, uuid, text, text, text, timestamptz, text, jsonb, jsonb, boolean) from public, anon, authenticated, service_role;
grant execute on function public.rpc_admin_import_customer_inventory_snapshot(uuid, uuid, uuid, text, text, text, timestamptz, text, jsonb, jsonb, boolean) to authenticated;
