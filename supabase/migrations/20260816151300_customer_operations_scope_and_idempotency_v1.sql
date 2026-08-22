create unique index if not exists customer_migration_validation_execution_store_key
  on public.customer_migration_validation_results (execution_request_id, store_id);

create or replace function public.rpc_admin_link_migration_project_store(
  p_project_id uuid,
  p_store_id uuid
)
returns public.customer_migration_project_stores
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_project public.customer_projects;
  v_store public.customer_account_stores;
  v_link public.customer_migration_project_stores;
begin
  v_actor := app_private.require_customer_operations_admin();
  select * into v_project from public.customer_projects where id = p_project_id and project_type = 'migration';
  select * into v_store from public.customer_account_stores where id = p_store_id;
  if v_project.id is null or v_store.id is null then raise exception 'migration project or store not found'; end if;
  if v_project.tenant_id <> v_store.tenant_id or v_project.source_id <> v_store.source_id then
    raise exception 'store is outside the migration client or source scope';
  end if;
  insert into public.customer_migration_project_stores (project_id, store_id, created_by_user_id)
  values (p_project_id, p_store_id, v_actor)
  on conflict (project_id, store_id) do update set created_by_user_id = excluded.created_by_user_id
  returning * into v_link;
  return v_link;
end;
$$;

create or replace function public.rpc_admin_approve_customer_migration(
  p_project_id uuid,
  p_status public.customer_migration_approval_status,
  p_inventory_snapshot_id uuid,
  p_stores_confirmed boolean,
  p_origin_confirmed boolean,
  p_critical_blocker_present boolean,
  p_decision_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_project public.customer_projects;
  v_migration public.customer_migration_projects;
  v_eval public.customer_migration_eligibility_evaluations;
  v_approval_id uuid;
begin
  v_actor := app_private.require_customer_operations_admin();
  select p.* into v_project from public.customer_projects p where p.id = p_project_id and p.project_type = 'migration';
  select * into v_migration from public.customer_migration_projects where project_id = p_project_id;
  select * into v_eval from public.customer_migration_eligibility_evaluations e where e.project_id = p_project_id order by evaluated_at desc limit 1;
  if v_project.id is null or v_migration.project_id is null then raise exception 'migration project not found'; end if;
  if p_status = 'approved' and p_inventory_snapshot_id is null then raise exception 'approved migration requires inventory snapshot'; end if;
  if p_inventory_snapshot_id is not null and not exists (
    select 1 from public.customer_inventory_snapshots s
    where s.id = p_inventory_snapshot_id and s.tenant_id = v_project.tenant_id and s.source_id = v_project.source_id
      and exists (select 1 from public.customer_migration_project_stores ps where ps.project_id = p_project_id and ps.store_id = s.store_id)
  ) then raise exception 'approval inventory snapshot is outside migration scope'; end if;
  if p_status = 'approved' and (not p_stores_confirmed or not p_origin_confirmed or p_critical_blocker_present or v_eval.id is null or v_eval.result not in ('eligible', 'eligible_with_restrictions')) then
    raise exception 'migration approval requires current eligible evaluation, confirmed stores and origin, and no critical blocker';
  end if;
  if p_status = 'approved' and not exists (select 1 from public.customer_migration_project_stores where project_id = p_project_id) then
    raise exception 'migration approval requires at least one store';
  end if;
  insert into public.customer_migration_approvals (
    project_id, status, inventory_snapshot_id, stores_confirmed, origin_confirmed,
    critical_blocker_present, decision_note, approved_at, decided_by_user_id
  ) values (
    p_project_id, p_status, p_inventory_snapshot_id, p_stores_confirmed, p_origin_confirmed,
    p_critical_blocker_present, app_private.assert_customer_account_safe_text('approval_note', p_decision_note, 1600, false),
    case when p_status = 'approved' then timezone('utc', now()) else null end, v_actor
  ) returning id into v_approval_id;
  update public.customer_migration_projects set approval_status = p_status where project_id = p_project_id;
  if p_status = 'approved' then
    update public.customer_projects set status = 'ready_to_execute', updated_by_user_id = v_actor where id = p_project_id;
  end if;
  return v_approval_id;
end;
$$;

create or replace function public.rpc_admin_add_customer_migration_batch_item(
  p_batch_id uuid,
  p_project_id uuid,
  p_store_id uuid,
  p_wave_id uuid default null,
  p_position integer default 1
)
returns public.customer_migration_batch_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_project public.customer_projects;
  v_item public.customer_migration_batch_items;
begin
  v_actor := app_private.require_customer_operations_admin();
  if not exists (select 1 from public.customer_migration_batches where id = p_batch_id) then raise exception 'migration batch not found'; end if;
  if p_wave_id is not null and not exists (select 1 from public.customer_migration_waves where id = p_wave_id and batch_id = p_batch_id) then raise exception 'migration wave does not belong to batch'; end if;
  select * into v_project from public.customer_projects where id = p_project_id and project_type = 'migration';
  if v_project.id is null then raise exception 'migration project not found'; end if;
  if not exists (select 1 from public.customer_migration_project_stores where project_id = p_project_id and store_id = p_store_id) then raise exception 'batch store is outside migration scope'; end if;
  insert into public.customer_migration_batch_items (batch_id, wave_id, project_id, store_id, position, created_by_user_id)
  values (p_batch_id, p_wave_id, p_project_id, p_store_id, coalesce(p_position, 1), v_actor)
  on conflict (batch_id, project_id, store_id) do update set wave_id = excluded.wave_id, position = excluded.position
  returning * into v_item;
  update public.customer_migration_projects set batch_id = p_batch_id, wave_id = p_wave_id where project_id = p_project_id;
  return v_item;
end;
$$;

create or replace function public.rpc_admin_record_customer_migration_validation(
  p_execution_request_id uuid,
  p_store_id uuid,
  p_status public.customer_migration_validation_status,
  p_source_observed jsonb,
  p_target_applied jsonb,
  p_divergence text default null,
  p_next_action text default null,
  p_post_save_evidence_id uuid default null
)
returns public.customer_migration_validation_results
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_request public.customer_migration_execution_requests;
  v_result public.customer_migration_validation_results;
  v_total integer;
  v_done integer;
begin
  v_actor := app_private.require_customer_operations_admin();
  select * into v_request from public.customer_migration_execution_requests where id = p_execution_request_id;
  if v_request.id is null then raise exception 'execution request not found'; end if;
  if not exists (select 1 from public.customer_migration_project_stores where project_id = v_request.project_id and store_id = p_store_id) then raise exception 'validation store is outside execution project scope'; end if;
  insert into public.customer_migration_validation_results (
    execution_request_id, store_id, status, source_observed, target_applied,
    post_save_evidence_id, divergence, next_action, validated_by_user_id
  ) values (
    p_execution_request_id, p_store_id, p_status, coalesce(p_source_observed, '{}'::jsonb), coalesce(p_target_applied, '{}'::jsonb),
    p_post_save_evidence_id, app_private.assert_customer_account_safe_text('validation_divergence', p_divergence, 1600, true),
    app_private.assert_customer_account_safe_text('validation_next_action', p_next_action, 1000, true), v_actor
  ) on conflict (execution_request_id, store_id) do update set
    status = excluded.status, source_observed = excluded.source_observed, target_applied = excluded.target_applied,
    post_save_evidence_id = excluded.post_save_evidence_id, divergence = excluded.divergence,
    next_action = excluded.next_action, validated_by_user_id = excluded.validated_by_user_id,
    validated_at = timezone('utc', now())
  returning * into v_result;
  select count(*)::integer into v_total from public.customer_migration_project_stores where project_id = v_request.project_id;
  select count(*)::integer into v_done from public.customer_migration_validation_results r
    join public.customer_migration_execution_requests er on er.id = r.execution_request_id
    where er.project_id = v_request.project_id and r.status in ('validated', 'validated_with_reservation');
  if v_done >= v_total then
    update public.customer_projects set status = 'completed', updated_by_user_id = v_actor where id = v_request.project_id;
    update public.customer_migration_projects set execution_status = 'completed' where project_id = v_request.project_id;
  else
    update public.customer_projects set status = 'validating', updated_by_user_id = v_actor where id = v_request.project_id;
    update public.customer_migration_projects set execution_status = 'running' where project_id = v_request.project_id;
  end if;
  return v_result;
end;
$$;

revoke all on function public.rpc_admin_link_migration_project_store(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.rpc_admin_link_migration_project_store(uuid, uuid) to authenticated;
revoke all on function public.rpc_admin_approve_customer_migration(uuid, public.customer_migration_approval_status, uuid, boolean, boolean, boolean, text) from public, anon, authenticated, service_role;
grant execute on function public.rpc_admin_approve_customer_migration(uuid, public.customer_migration_approval_status, uuid, boolean, boolean, boolean, text) to authenticated;
revoke all on function public.rpc_admin_add_customer_migration_batch_item(uuid, uuid, uuid, uuid, integer) from public, anon, authenticated, service_role;
grant execute on function public.rpc_admin_add_customer_migration_batch_item(uuid, uuid, uuid, uuid, integer) to authenticated;
revoke all on function public.rpc_admin_record_customer_migration_validation(uuid, uuid, public.customer_migration_validation_status, jsonb, jsonb, text, text, uuid) from public, anon, authenticated, service_role;
grant execute on function public.rpc_admin_record_customer_migration_validation(uuid, uuid, public.customer_migration_validation_status, jsonb, jsonb, text, text, uuid) to authenticated;
