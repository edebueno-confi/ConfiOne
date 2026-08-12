-- ANALYTICS-SYNC-CYCLE-REAPER-SEQUENTIAL-V2
--
-- Mantem vivo um ciclo sequencial quando uma fonte terminou e a proxima etapa
-- ainda esta queued. O reaper anterior olhava apenas execucoes abertas nos
-- provedores; nesse intervalo, o ciclo HubSpot -> OMIE podia ser abandonado
-- antes de a continuacao assincrona iniciar o OMIE.

create or replace function app_private.abandon_stale_analytics_cycles(
  p_timeout_seconds integer default 900
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_timeout interval := make_interval(secs => greatest(60, least(coalesce(p_timeout_seconds, 900), 86400)));
  v_deadline timestamptz := timezone('utc', now()) - v_timeout;
  v_count integer := 0;
  v_orphaned integer := 0;
begin
  update public.analytics_sync_cycle_steps
  set status = 'abandoned',
      finished_at = coalesce(finished_at, timezone('utc', now())),
      sanitized_error = coalesce(sanitized_error, 'Etapa abandonada por ausencia de heartbeat.')
  where status in ('queued', 'running')
    and coalesce(last_heartbeat_at, started_at, created_at) < v_deadline;

  update public.analytics_sync_cycles
  set status = 'abandoned',
      overall_result = coalesce(overall_result, 'abandoned'),
      current_step = coalesce(current_step, 'complete'),
      finished_at = coalesce(finished_at, timezone('utc', now())),
      sanitized_error = coalesce(sanitized_error, 'Ciclo abandonado por ausencia de heartbeat; snapshot anterior preservado.')
  where status in ('queued', 'running')
    and coalesce(last_heartbeat_at, started_at, created_at) < v_deadline;

  get diagnostics v_count = row_count;

  -- Um ciclo com etapa queued/running ainda possui trabalho legitimo a ser
  -- conduzido, mesmo que a fonte anterior ja esteja terminal.
  update public.analytics_sync_cycles c
  set status = 'abandoned',
      overall_result = coalesce(c.overall_result, 'abandoned'),
      current_step = coalesce(c.current_step, 'complete'),
      finished_at = coalesce(c.finished_at, timezone('utc', now())),
      sanitized_error = coalesce(c.sanitized_error, 'Ciclo encerrado: nenhuma execucao ativa restante nos provedores.')
  where c.status in ('queued', 'running')
    and c.started_at < timezone('utc', now()) - interval '5 minutes'
    and exists (select 1 from public.analytics_sync_cycle_steps s where s.cycle_id = c.id)
    and not exists (
      select 1
      from public.analytics_sync_cycle_steps s
      where s.cycle_id = c.id
        and s.status in ('queued', 'running')
    )
    and not exists (
      select 1
      from public.hubspot_sync_runs r
      where r.cycle_id = c.id and r.status in ('queued', 'running', 'partial')
    )
    and not exists (
      select 1
      from public.analytics_finance_sync_runs f
      where f.cycle_id = c.id and f.status in ('processing', 'partial')
    );

  get diagnostics v_orphaned = row_count;

  update public.analytics_sync_cycle_steps s
  set status = 'abandoned',
      finished_at = coalesce(s.finished_at, timezone('utc', now())),
      sanitized_error = coalesce(s.sanitized_error, 'Etapa encerrada junto com o ciclo abandonado.')
  where s.status in ('queued', 'running')
    and exists (
      select 1
      from public.analytics_sync_cycles c
      where c.id = s.cycle_id
        and c.status not in ('queued', 'running')
    );

  return v_count + v_orphaned;
end;
$$;

comment on function app_private.abandon_stale_analytics_cycles(integer) is
  'Reaper de ciclos e etapas de sincronizacao orfaos. Preserva etapas queued/running da sequencia HubSpot -> OMIE para a continuacao assincrona.';
