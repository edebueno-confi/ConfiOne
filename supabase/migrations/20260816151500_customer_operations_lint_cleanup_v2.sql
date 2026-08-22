create or replace function public.rpc_admin_evaluate_customer_migration(
  p_project_id uuid,
  p_result public.customer_migration_eligibility_status,
  p_criteria jsonb,
  p_pending_items jsonb,
  p_limitations jsonb,
  p_catalog_version text,
  p_inventory_snapshot_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_eval_id uuid;
  v_project public.customer_projects;
begin
  v_actor := app_private.require_customer_operations_admin();
  select p.* into v_project from public.customer_projects p where p.id = p_project_id and p.project_type = 'migration';
  if v_project.id is null then raise exception 'migration project not found'; end if;
  if p_inventory_snapshot_id is not null and not exists (
    select 1 from public.customer_inventory_snapshots s
    where s.id = p_inventory_snapshot_id and s.tenant_id = v_project.tenant_id
      and s.source_id = v_project.source_id
      and exists (select 1 from public.customer_migration_project_stores ps where ps.project_id = p_project_id and ps.store_id = s.store_id)
  ) then raise exception 'inventory snapshot is outside the migration scope'; end if;
  insert into public.customer_migration_eligibility_evaluations (
    project_id, result, criteria, pending_items, limitations, catalog_version,
    inventory_snapshot_id, evaluated_by_user_id
  ) values (
    p_project_id, p_result, coalesce(p_criteria, '{}'::jsonb), coalesce(p_pending_items, '[]'::jsonb),
    coalesce(p_limitations, '[]'::jsonb), app_private.assert_customer_account_safe_text('eligibility_catalog_version', p_catalog_version, 120, false),
    p_inventory_snapshot_id, v_actor
  ) returning id into v_eval_id;
  update public.customer_migration_projects set eligibility_status = p_result where project_id = p_project_id;
  update public.customer_projects
  set status = case p_result
      when 'eligible' then 'eligible'::public.customer_project_status
      when 'eligible_with_restrictions' then 'eligible_with_restrictions'::public.customer_project_status
      when 'ineligible' then 'blocked'::public.customer_project_status
      else 'eligibility_pending'::public.customer_project_status end,
    blocked_reason = case when p_result = 'ineligible' then 'Elegibilidade reprovada; revisar pendencias e limitacoes.' else null end,
    updated_by_user_id = v_actor
  where id = p_project_id;
  return v_eval_id;
end;
$$;

revoke all on function public.rpc_admin_evaluate_customer_migration(uuid, public.customer_migration_eligibility_status, jsonb, jsonb, jsonb, text, uuid) from public, anon, authenticated, service_role;
grant execute on function public.rpc_admin_evaluate_customer_migration(uuid, public.customer_migration_eligibility_status, jsonb, jsonb, jsonb, text, uuid) to authenticated;
