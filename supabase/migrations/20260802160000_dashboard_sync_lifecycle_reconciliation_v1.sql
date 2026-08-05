-- DASHBOARD-SYNC-LIFECYCLE-RECONCILIATION-V1
-- Mantem a migration de fundacao imutavel e atualiza a RPC em uma migration forward-only.

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

  return jsonb_build_object('hubspot', v_hubspot, 'omie', v_omie, 'cycles', v_cycles, 'timeout_seconds', v_timeout);
end;
$$;

revoke all on function public.rpc_admin_reconcile_analytics_sync_runs(integer) from public, anon;
grant execute on function public.rpc_admin_reconcile_analytics_sync_runs(integer) to authenticated, service_role;
