-- RELEASE-04.1 follow-up: Search API do HubSpot limita cada consulta a 10k
-- resultados. Divide o lote antes de persistir a primeira pagina, evitando
-- duplicacao e permitindo que o runner continue com cursores independentes.
create or replace function public.rpc_analytics_hubspot_split_work_item(
  p_work_item_id uuid,
  p_worker_id text,
  p_midpoint_ms bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.analytics_cs_sync_work_items;
  v_now timestamptz := timezone('utc', now());
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     and not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'analytics HubSpot split denied';
  end if;
  select * into v_item
  from public.analytics_cs_sync_work_items
  where id = p_work_item_id
  for update;
  if v_item.id is null or v_item.lease_owner <> p_worker_id or v_item.status <> 'running' then
    raise exception 'lease do item invalido para particionamento';
  end if;
  if v_item.object_type <> 'ticket' or p_midpoint_ms <= v_item.range_start_ms or p_midpoint_ms >= v_item.range_end_ms then
    raise exception 'intervalo invalido para particionamento';
  end if;

  update public.analytics_cs_sync_work_items
  set status = 'succeeded', lease_owner = null, lease_expires_at = null,
      heartbeat_at = v_now, finished_at = v_now, updated_at = v_now,
      error_code = null, error_message = null
  where id = v_item.id;

  insert into public.analytics_cs_sync_work_items(
    parent_run_id, domain_key, object_type, pipeline_id, pipeline_label,
    range_start_ms, range_end_ms
  ) values
    (v_item.parent_run_id, v_item.domain_key, v_item.object_type, v_item.pipeline_id, v_item.pipeline_label, v_item.range_start_ms, p_midpoint_ms),
    (v_item.parent_run_id, v_item.domain_key, v_item.object_type, v_item.pipeline_id, v_item.pipeline_label, p_midpoint_ms, v_item.range_end_ms)
  on conflict do nothing;

  update public.hubspot_sync_runs
  set heartbeat_at = v_now,
      pipelines_total = (select count(*)::integer from public.analytics_cs_sync_work_items where parent_run_id = v_item.parent_run_id),
      pipelines_completed = (select count(*)::integer from public.analytics_cs_sync_work_items where parent_run_id = v_item.parent_run_id and status = 'succeeded')
  where id = v_item.parent_run_id;

  return jsonb_build_object('status', 'split', 'work_item_id', p_work_item_id, 'midpoint_ms', p_midpoint_ms);
end;
$$;

revoke all on function public.rpc_analytics_hubspot_split_work_item(uuid,text,bigint) from public, anon;
grant execute on function public.rpc_analytics_hubspot_split_work_item(uuid,text,bigint) to authenticated, service_role;
