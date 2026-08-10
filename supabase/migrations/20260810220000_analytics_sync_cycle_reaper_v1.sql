-- ANALYTICS-SYNC-CYCLE-REAPER-V1
--
-- PROBLEMA
-- `rpc_analytics_hubspot_abandon_stale_runs` encerra a *run* do HubSpot e os
-- work items dela, mas nao toca em `public.analytics_sync_cycles` nem em
-- `public.analytics_sync_cycle_steps`. O resultado e um ciclo preso em
-- `running` indefinidamente. Caso real observado: ciclo iniciado em
-- 2026-08-10 00:49:14 com heartbeat congelado em 00:52:23 e a tela de
-- Historico exibindo "1260min em andamento" para uma execucao que ja nao
-- existe em nenhum provedor.
--
-- CORRECAO
-- 1. `app_private.abandon_stale_analytics_cycles(integer)` — a logica de
--    reaper. Sem guard de autorizacao porque nao e exposta ao PostgREST
--    (schema app_private) e precisa rodar sob pg_cron, que nao carrega claim
--    de JWT.
-- 2. `public.rpc_analytics_abandon_stale_cycles(integer)` — wrapper fino e
--    guardado (service_role ou platform_admin) para acionamento manual pela
--    aplicacao.
-- 3. Cron a cada 5 minutos chamando a funcao interna.
--
-- Idempotente. Nao altera schema, RLS, contrato ou dado operacional. Nao
-- reescreve execucoes ja concluidas: so fecha o que esta orfao, marcando
-- `abandoned` e registrando o motivo em `sanitized_error`.
--
-- Nao substitui `app_private.drive_hubspot_orchestrator()`, que permanece
-- exatamente como esta (retorno bigint, guard de run aberto).

begin;

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
  -- 1) Etapas sem heartbeat. Fecham antes do ciclo para que o detalhe do
  --    Historico nao fique inconsistente com o cabecalho.
  update public.analytics_sync_cycle_steps
  set status = 'abandoned',
      finished_at = coalesce(finished_at, timezone('utc', now())),
      sanitized_error = coalesce(sanitized_error, 'Etapa abandonada por ausencia de heartbeat.')
  where status in ('queued', 'running')
    and coalesce(last_heartbeat_at, started_at, created_at) < v_deadline;

  -- 2) Ciclos sem heartbeat.
  update public.analytics_sync_cycles
  set status = 'abandoned',
      overall_result = coalesce(overall_result, 'abandoned'),
      current_step = coalesce(current_step, 'complete'),
      finished_at = coalesce(finished_at, timezone('utc', now())),
      sanitized_error = coalesce(sanitized_error, 'Ciclo abandonado por ausencia de heartbeat; snapshot anterior preservado.')
  where status in ('queued', 'running')
    and coalesce(last_heartbeat_at, started_at, created_at) < v_deadline;

  get diagnostics v_count = row_count;

  -- 3) Ciclos com heartbeat ainda fresco mas sem nenhuma execucao viva em
  --    nenhum provedor — tipicamente quando o reaper de run ja abandonou a
  --    run e o ciclo ficaria preso ate estourar o timeout do item 2.
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
      select 1 from public.hubspot_sync_runs r
      where r.cycle_id = c.id and r.status in ('queued', 'running', 'partial')
    )
    and not exists (
      select 1 from public.analytics_finance_sync_runs f
      where f.cycle_id = c.id and f.status in ('processing', 'partial')
    );

  get diagnostics v_orphaned = row_count;

  -- Etapas que sobraram abertas sob um ciclo ja encerrado.
  update public.analytics_sync_cycle_steps s
  set status = 'abandoned',
      finished_at = coalesce(s.finished_at, timezone('utc', now())),
      sanitized_error = coalesce(s.sanitized_error, 'Etapa encerrada junto com o ciclo abandonado.')
  where s.status in ('queued', 'running')
    and exists (
      select 1 from public.analytics_sync_cycles c
      where c.id = s.cycle_id
        and c.status not in ('queued', 'running')
    );

  return v_count + v_orphaned;
end;
$$;

revoke all on function app_private.abandon_stale_analytics_cycles(integer) from public, anon, authenticated;

comment on function app_private.abandon_stale_analytics_cycles(integer) is
  'Reaper de ciclos e etapas de sincronizacao orfaos. Executado por pg_cron; sem guard de JWT porque nao e exposta ao PostgREST.';

create or replace function public.rpc_analytics_abandon_stale_cycles(
  p_timeout_seconds integer default 900
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     and not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'analytics cycle recovery denied';
  end if;

  return app_private.abandon_stale_analytics_cycles(p_timeout_seconds);
end;
$$;

revoke all on function public.rpc_analytics_abandon_stale_cycles(integer) from public, anon;
grant execute on function public.rpc_analytics_abandon_stale_cycles(integer) to authenticated, service_role;

comment on function public.rpc_analytics_abandon_stale_cycles(integer) is
  'Fecha ciclos e etapas de sincronizacao orfaos. Wrapper guardado de app_private.abandon_stale_analytics_cycles.';

-- Cron a cada 5 minutos. O custo e uma varredura indexada por status; quando
-- nao ha ciclo aberto, nenhuma linha e tocada.
select cron.unschedule('analytics-sync-cycle-reaper')
where exists (
  select 1 from cron.job where jobname = 'analytics-sync-cycle-reaper'
);

select cron.schedule(
  'analytics-sync-cycle-reaper',
  '*/5 * * * *',
  $cron$ select app_private.abandon_stale_analytics_cycles(900); $cron$
);

commit;
