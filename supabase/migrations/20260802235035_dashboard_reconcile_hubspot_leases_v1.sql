-- DASHBOARD-RUNTIME-RECONCILE-HUBSPOT-LEASES-V1
-- Libera work items que ficaram ativos depois que o run pai foi encerrado.
-- Forward-only: nenhum staging, snapshot ou historico e apagado.

create or replace function public.rpc_admin_reconcile_analytics_sync_runs(
  p_timeout_seconds integer default 900
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_timeout integer := greatest(60, least(coalesce(p_timeout_seconds, 900), 86400));
  v_hubspot integer := 0;
  v_omie integer := 0;
  v_cycles integer := 0;
  v_hubspot_work_items integer := 0;
begin
  if not (app_private.has_global_role('platform_admin'::public.platform_role)
      or current_setting('request.jwt.claim.role', true) = 'service_role') then
    raise exception 'Acesso negado a reconciliacao de execucoes';
  end if;

  update public.hubspot_sync_runs
  set status = 'timed_out',
      finished_at = coalesce(finished_at, timezone('utc', now())),
      heartbeat_at = timezone('utc', now()),
      last_heartbeat_at = timezone('utc', now()),
      error_code = 'EXECUTION_TIMEOUT',
      internal_error_code = 'execution_timeout',
      sanitized_error = 'A execucao do HubSpot ultrapassou o tempo esperado e foi encerrada.',
      error_occurred_at = timezone('utc', now())
  where status in ('queued', 'running')
    and coalesce(last_heartbeat_at, heartbeat_at, started_at) < timezone('utc', now()) - make_interval(secs => v_timeout);
  get diagnostics v_hubspot = row_count;

  update public.analytics_finance_sync_runs
  set status = 'timed_out',
      finished_at = coalesce(finished_at, timezone('utc', now())),
      last_heartbeat_at = timezone('utc', now()),
      internal_error_code = 'execution_timeout',
      sanitized_error = 'A execucao do OMIE ultrapassou o tempo esperado e foi encerrada.',
      error_occurred_at = timezone('utc', now())
  where status = 'processing'
    and coalesce(last_heartbeat_at, started_at) < timezone('utc', now()) - make_interval(secs => v_timeout);
  get diagnostics v_omie = row_count;

  update public.analytics_sync_cycles
  set status = 'timed_out',
      overall_result = 'timed_out',
      finished_at = coalesce(finished_at, timezone('utc', now())),
      sanitized_error = 'O ciclo ultrapassou o tempo esperado e foi encerrado.',
      last_heartbeat_at = timezone('utc', now())
  where status in ('queued', 'running')
    and coalesce(last_heartbeat_at, started_at) < timezone('utc', now()) - make_interval(secs => v_timeout);
  get diagnostics v_cycles = row_count;

  update public.analytics_sync_cycle_steps s
  set status = 'timed_out',
      finished_at = coalesce(finished_at, timezone('utc', now())),
      last_heartbeat_at = timezone('utc', now()),
      sanitized_error = 'A etapa ultrapassou o tempo esperado e foi encerrada.'
  where s.status in ('queued', 'running')
    and (
      exists (
        select 1 from public.analytics_sync_cycles c
        where c.id = s.cycle_id and c.status = 'timed_out'
      )
      or (s.step_key = 'hubspot' and exists (
        select 1 from public.hubspot_sync_runs r
        where r.cycle_id = s.cycle_id and r.status = 'timed_out'
      ))
      or (s.step_key = 'omie' and exists (
        select 1 from public.analytics_finance_sync_runs r
        where r.cycle_id = s.cycle_id and r.status = 'timed_out'
      ))
    );

  update public.analytics_cs_sync_work_items item
  set status = 'abandoned',
      lease_owner = null,
      lease_expires_at = null,
      heartbeat_at = timezone('utc', now()),
      finished_at = coalesce(item.finished_at, timezone('utc', now())),
      error_code = coalesce(item.error_code, 'PARENT_RUN_RECONCILED'),
      error_message = coalesce(item.error_message, 'Execucao pai encerrada; lote pendente liberado pelo reconciliador.'),
      updated_at = timezone('utc', now())
  where item.status in ('pending', 'leased', 'running', 'retrying')
    and exists (
      select 1
      from public.hubspot_sync_runs run
      where run.id = item.parent_run_id
        and run.status in ('timed_out', 'abandoned')
    );
  get diagnostics v_hubspot_work_items = row_count;

  return jsonb_build_object(
    'hubspot', v_hubspot,
    'omie', v_omie,
    'cycles', v_cycles,
    'hubspot_work_items', v_hubspot_work_items,
    'timeout_seconds', v_timeout
  );
end;
$$;

revoke all on function public.rpc_admin_reconcile_analytics_sync_runs(integer) from public, anon;
grant execute on function public.rpc_admin_reconcile_analytics_sync_runs(integer) to authenticated, service_role;

comment on function public.rpc_admin_reconcile_analytics_sync_runs(integer) is
  'Reconciliacao idempotente de runs, ciclos e leases HubSpot expirados sem apagar snapshots ou historico.';
