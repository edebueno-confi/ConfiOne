-- DASHBOARD-RUNTIME-TRUTH-V3
-- Ciclo pai, lifecycle explícito, reconciliação de órfãos e read model único.
-- Esta migration é forward-only: nenhum snapshot histórico é apagado.

alter table public.hubspot_sync_runs
  add column if not exists cycle_id uuid,
  add column if not exists last_heartbeat_at timestamptz,
  add column if not exists internal_error_code text,
  add column if not exists provider_code text,
  add column if not exists internal_message text,
  add column if not exists sanitized_error text,
  add column if not exists error_occurred_at timestamptz;

alter table public.analytics_finance_sync_runs
  add column if not exists cycle_id uuid,
  add column if not exists last_heartbeat_at timestamptz,
  add column if not exists internal_error_code text,
  add column if not exists provider_code text,
  add column if not exists internal_message text,
  add column if not exists sanitized_error text,
  add column if not exists error_occurred_at timestamptz;

alter table public.hubspot_sync_runs
  drop constraint if exists hubspot_sync_runs_status_check;

alter table public.hubspot_sync_runs
  add constraint hubspot_sync_runs_status_check
  check (status = any (array[
    'queued', 'running', 'success', 'succeeded', 'partial', 'error',
    'failed', 'abandoned', 'timed_out', 'cancelled'
  ]));

alter table public.analytics_finance_sync_runs
  drop constraint if exists analytics_finance_sync_runs_status_check;

alter table public.analytics_finance_sync_runs
  add constraint analytics_finance_sync_runs_status_check
  check (status = any (array[
    'processing', 'completed', 'partial', 'empty', 'failed', 'abandoned',
    'timed_out', 'cancelled'
  ]));

create table if not exists public.analytics_sync_cycles (
  id uuid primary key default gen_random_uuid(),
  correlation_id uuid not null unique,
  trigger_kind text not null default 'manual',
  requested_by uuid,
  status text not null default 'queued',
  current_step text,
  overall_result text,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  last_heartbeat_at timestamptz,
  sanitized_error text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint analytics_sync_cycles_trigger_kind_check check (trigger_kind in ('manual', 'automatic', 'diagnostic')),
  constraint analytics_sync_cycles_status_check check (status in ('queued', 'running', 'succeeded', 'failed', 'partial', 'cancelled', 'timed_out', 'abandoned')),
  constraint analytics_sync_cycles_step_check check (current_step is null or current_step in ('hubspot', 'omie', 'complete')),
  constraint analytics_sync_cycles_result_check check (overall_result is null or overall_result in ('success', 'partial', 'failed', 'cancelled', 'timed_out', 'abandoned'))
);

create table if not exists public.analytics_sync_cycle_steps (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.analytics_sync_cycles(id) on delete cascade,
  source_key text not null,
  step_key text not null,
  run_id uuid,
  status text not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  last_heartbeat_at timestamptz,
  processed_count integer not null default 0,
  rejected_count integer not null default 0,
  sanitized_error text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint analytics_sync_cycle_steps_source_check check (source_key in ('hubspot', 'omie')),
  constraint analytics_sync_cycle_steps_status_check check (status in ('queued', 'running', 'succeeded', 'failed', 'partial', 'cancelled', 'timed_out', 'abandoned')),
  unique (cycle_id, step_key)
);

create index if not exists analytics_sync_cycles_status_idx
  on public.analytics_sync_cycles (status, created_at desc);
create index if not exists analytics_sync_cycle_steps_cycle_idx
  on public.analytics_sync_cycle_steps (cycle_id, created_at);
create index if not exists hubspot_sync_runs_cycle_idx
  on public.hubspot_sync_runs (cycle_id, started_at desc);
create index if not exists analytics_finance_sync_runs_cycle_idx
  on public.analytics_finance_sync_runs (cycle_id, started_at desc);

alter table public.analytics_sync_cycles enable row level security;
alter table public.analytics_sync_cycle_steps enable row level security;

drop policy if exists analytics_sync_cycles_read on public.analytics_sync_cycles;
create policy analytics_sync_cycles_read on public.analytics_sync_cycles
  for select to authenticated using (app_private.can_read_analytics());
drop policy if exists analytics_sync_cycle_steps_read on public.analytics_sync_cycle_steps;
create policy analytics_sync_cycle_steps_read on public.analytics_sync_cycle_steps
  for select to authenticated using (app_private.can_read_analytics());

revoke all on public.analytics_sync_cycles from public, anon, authenticated;
revoke all on public.analytics_sync_cycle_steps from public, anon, authenticated;
grant select on public.analytics_sync_cycles to authenticated, service_role;
grant select on public.analytics_sync_cycle_steps to authenticated, service_role;

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
    raise exception 'Acesso negado à reconciliação de execuções';
  end if;

  update public.hubspot_sync_runs
  set status = 'timed_out',
      finished_at = coalesce(finished_at, timezone('utc', now())),
      heartbeat_at = timezone('utc', now()),
      last_heartbeat_at = timezone('utc', now()),
      error_code = 'EXECUTION_TIMEOUT',
      internal_error_code = 'execution_timeout',
      sanitized_error = 'A execução do HubSpot ultrapassou o tempo esperado e foi encerrada.',
      error_occurred_at = timezone('utc', now())
  where status in ('queued', 'running')
    and coalesce(last_heartbeat_at, heartbeat_at, started_at) < timezone('utc', now()) - make_interval(secs => v_timeout);
  get diagnostics v_hubspot = row_count;

  update public.analytics_finance_sync_runs
  set status = 'timed_out',
      finished_at = coalesce(finished_at, timezone('utc', now())),
      last_heartbeat_at = timezone('utc', now()),
      internal_error_code = 'execution_timeout',
      sanitized_error = 'A execução do OMIE ultrapassou o tempo esperado e foi encerrada.',
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

  return jsonb_build_object('hubspot', v_hubspot, 'omie', v_omie, 'cycles', v_cycles, 'timeout_seconds', v_timeout);
end;
$$;

revoke all on function public.rpc_admin_reconcile_analytics_sync_runs(integer) from public, anon;
grant execute on function public.rpc_admin_reconcile_analytics_sync_runs(integer) to authenticated, service_role;

create or replace function public.rpc_service_start_analytics_sync_cycle(
  p_trigger_kind text default 'manual',
  p_requested_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.analytics_sync_cycles;
  v_cycle public.analytics_sync_cycles;
  v_correlation uuid := gen_random_uuid();
begin
  if not (app_private.has_global_role('platform_admin'::public.platform_role)
      or current_setting('request.jwt.claim.role', true) = 'service_role') then
    raise exception 'Acesso negado ao ciclo de Analytics';
  end if;

  perform public.rpc_admin_reconcile_analytics_sync_runs(900);
  select * into v_existing
  from public.analytics_sync_cycles
  where status in ('queued', 'running')
  order by created_at desc
  limit 1
  for update;

  if v_existing.id is not null then
    return jsonb_build_object('accepted', false, 'cycle_id', v_existing.id, 'correlation_id', v_existing.correlation_id, 'status', v_existing.status, 'reason', 'cycle_in_progress');
  end if;

  insert into public.analytics_sync_cycles (correlation_id, trigger_kind, requested_by, status, current_step, last_heartbeat_at)
  values (v_correlation, case when p_trigger_kind in ('manual', 'automatic', 'diagnostic') then p_trigger_kind else 'manual' end, coalesce(p_requested_by, auth.uid()), 'running', 'hubspot', timezone('utc', now()))
  returning * into v_cycle;

  insert into public.analytics_sync_cycle_steps (cycle_id, source_key, step_key, status, started_at, last_heartbeat_at)
  values
    (v_cycle.id, 'hubspot', 'hubspot', 'running', v_cycle.started_at, v_cycle.started_at),
    (v_cycle.id, 'omie', 'omie', 'queued', null, null);

  return jsonb_build_object('accepted', true, 'cycle_id', v_cycle.id, 'correlation_id', v_cycle.correlation_id, 'status', v_cycle.status, 'current_step', v_cycle.current_step);
end;
$$;

revoke all on function public.rpc_service_start_analytics_sync_cycle(text, uuid) from public, anon;
grant execute on function public.rpc_service_start_analytics_sync_cycle(text, uuid) to authenticated, service_role;

create or replace view public.vw_admin_analytics_sync_history_v2
with (security_barrier = true)
as
select
  c.id as cycle_id,
  c.correlation_id,
  'cycle'::text as row_kind,
  null::text as source_key,
  'Ciclo HubSpot → OMIE'::text as source_label,
  c.status,
  c.current_step,
  c.started_at,
  c.finished_at,
  extract(epoch from (coalesce(c.finished_at, timezone('utc', now())) - c.started_at))::bigint * 1000 as duration_ms,
  null::integer as processed_count,
  c.sanitized_error,
  c.trigger_kind,
  null::uuid as run_id
from public.analytics_sync_cycles c
where app_private.can_read_analytics()
union all
select
  s.cycle_id,
  c.correlation_id,
  'step'::text,
  s.source_key,
  case when s.source_key = 'hubspot' then 'HubSpot' else 'OMIE' end,
  s.status,
  s.step_key,
  s.started_at,
  s.finished_at,
  extract(epoch from (coalesce(s.finished_at, timezone('utc', now())) - coalesce(s.started_at, s.created_at)))::bigint * 1000,
  s.processed_count,
  s.sanitized_error,
  c.trigger_kind,
  s.run_id
from public.analytics_sync_cycle_steps s
join public.analytics_sync_cycles c on c.id = s.cycle_id
where app_private.can_read_analytics()
union all
select
  r.id as cycle_id,
  r.correlation_id,
  'step'::text as row_kind,
  'hubspot'::text as source_key,
  'HubSpot'::text as source_label,
  case when r.status in ('success', 'succeeded') then 'succeeded' when r.status in ('queued', 'running') then r.status when r.status = 'timed_out' then 'timed_out' when r.status in ('failed', 'error', 'abandoned', 'cancelled', 'partial') then r.status else 'failed' end,
  'hubspot'::text as current_step,
  r.started_at,
  r.finished_at,
  extract(epoch from (coalesce(r.finished_at, timezone('utc', now())) - r.started_at))::bigint * 1000,
  coalesce(r.records_promoted, r.records_accepted, r.records_normalized, 0)::integer,
  case when r.status in ('failed', 'error', 'abandoned', 'timed_out', 'cancelled', 'partial') then coalesce(r.sanitized_error, 'A atualização do HubSpot não foi concluída.') else null end,
  'manual'::text as trigger_kind,
  r.id as run_id
from public.hubspot_sync_runs r
where r.cycle_id is null and app_private.can_read_analytics()
union all
select
  r.id as cycle_id,
  r.correlation_id,
  'step'::text as row_kind,
  'omie'::text as source_key,
  'OMIE'::text as source_label,
  case when r.status = 'completed' then 'succeeded' when r.status = 'processing' then 'running' when r.status in ('timed_out', 'abandoned', 'cancelled', 'partial', 'failed') then r.status else 'failed' end,
  'omie'::text as current_step,
  r.started_at,
  r.finished_at,
  extract(epoch from (coalesce(r.finished_at, timezone('utc', now())) - r.started_at))::bigint * 1000,
  coalesce(r.accepted_rows, 0)::integer,
  case when r.status in ('failed', 'abandoned', 'timed_out', 'cancelled', 'partial') then coalesce(r.sanitized_error, 'A atualização do OMIE não foi concluída.') else null end,
  'manual'::text as trigger_kind,
  r.id as run_id
from public.analytics_finance_sync_runs r
where r.cycle_id is null and app_private.can_read_analytics();

revoke all on public.vw_admin_analytics_sync_history_v2 from public, anon;
grant select on public.vw_admin_analytics_sync_history_v2 to authenticated, service_role;

create or replace view public.vw_analytics_finance_sync_runs_read
with (security_barrier = true)
as
select
  id,
  source_key,
  status,
  total_rows,
  accepted_rows,
  rejected_rows,
  started_at,
  finished_at,
  case when status in ('failed', 'abandoned', 'timed_out', 'cancelled', 'partial')
    then coalesce(sanitized_error, 'A atualização do OMIE não foi concluída.')
    else null
  end as error_message,
  correlation_id
from public.analytics_finance_sync_runs
where app_private.can_read_analytics();

revoke all on public.vw_analytics_finance_sync_runs_read from public, anon;
grant select on public.vw_analytics_finance_sync_runs_read to authenticated, service_role;

create or replace view public.vw_analytics_dashboard_sync_status
with (security_barrier = true)
as
select id, domain_key, status, started_at, finished_at,
       deals_synced, tickets_synced, owners_synced, stages_synced,
       companies_synced,
       case when status in ('error', 'failed', 'abandoned', 'timed_out', 'cancelled', 'partial')
         then coalesce(sanitized_error, 'A atualização do HubSpot não foi concluída.')
         else null
       end as error_message,
       correlation_id,
       source_total, source_records_received, source_pages,
       source_pagination_complete, source_state, watermark_advanced,
       provider, mode, heartbeat_at, records_normalized, records_accepted,
       records_rejected, records_promoted, pipelines_total, pipelines_completed,
       error_code
from public.hubspot_sync_runs
where app_private.can_read_analytics();

revoke all on public.vw_analytics_dashboard_sync_status from public, anon;
grant select on public.vw_analytics_dashboard_sync_status to authenticated, service_role;

create or replace function public.rpc_analytics_source_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_payload jsonb;
begin
  if not app_private.can_read_analytics() then return '{}'::jsonb; end if;

  with integrations as (
    select integration_key, is_enabled and credential_secret_id is not null as configured
    from public.managed_integrations
    where integration_key in ('hubspot', 'omie')
  ), hubspot as (
    select
      'hubspot'::text as key,
      'HubSpot'::text as label,
      'hubspot'::text as origin,
      i.configured,
      r.id::text as current_run_id,
      case when r.status in ('queued', 'running') and coalesce(r.last_heartbeat_at, r.heartbeat_at, r.started_at) < timezone('utc', now()) - interval '15 minutes' then 'timed_out' when r.status in ('queued', 'running') then 'running' when r.status in ('success', 'succeeded') then 'succeeded' when r.status in ('partial', 'failed', 'error', 'abandoned', 'cancelled', 'timed_out') then case when r.status = 'partial' then 'partial' else r.status end else null end as current_run_status,
      coalesce(r.finished_at, r.started_at) as last_attempt_at,
      (select max(x.finished_at) from public.hubspot_sync_runs x where x.status in ('success', 'succeeded') and x.finished_at is not null) as last_success_at,
      (select max(x.finished_at) from public.hubspot_sync_runs x where x.status in ('failed', 'error', 'abandoned', 'timed_out', 'cancelled') and x.finished_at is not null) as last_failure_at,
      extract(epoch from (r.finished_at - r.started_at)) * 1000 as duration_ms,
      coalesce(r.records_promoted, r.records_accepted, r.records_normalized, 0)::integer as processed_count,
      coalesce(r.records_rejected, 0)::integer as rejected_count,
      coalesce(r.sanitized_error, case when r.status in ('failed', 'error', 'abandoned', 'timed_out') then 'A atualização do HubSpot não foi concluída.' else null end) as sanitized_error,
      exists(select 1 from public.hubspot_sync_runs x where x.status in ('success', 'succeeded') and x.finished_at is not null) as has_valid_snapshot
    from integrations i
    left join lateral (select * from public.hubspot_sync_runs order by started_at desc limit 1) r on true
    where i.integration_key = 'hubspot'
  ), omie as (
    select
      'omie'::text as key,
      'OMIE'::text as label,
      'omie'::text as origin,
      i.configured,
      r.id::text as current_run_id,
      case when r.status = 'processing' and coalesce(r.last_heartbeat_at, r.started_at) < timezone('utc', now()) - interval '15 minutes' then 'timed_out' when r.status = 'processing' then 'running' when r.status = 'completed' then 'succeeded' when r.status in ('partial', 'failed', 'abandoned', 'timed_out', 'cancelled') then r.status else null end as current_run_status,
      coalesce(r.finished_at, r.started_at) as last_attempt_at,
      (select max(x.finished_at) from public.analytics_finance_sync_runs x where x.status = 'completed' and x.finished_at is not null) as last_success_at,
      (select max(x.finished_at) from public.analytics_finance_sync_runs x where x.status in ('failed', 'abandoned', 'timed_out', 'cancelled') and x.finished_at is not null) as last_failure_at,
      extract(epoch from (r.finished_at - r.started_at)) * 1000 as duration_ms,
      coalesce(r.accepted_rows, 0)::integer as processed_count,
      coalesce(r.rejected_rows, 0)::integer as rejected_count,
      coalesce(r.sanitized_error, case when r.status in ('failed', 'abandoned', 'timed_out') then 'A atualização do OMIE não foi concluída.' else null end) as sanitized_error,
      exists(select 1 from public.analytics_finance_sync_runs x where x.status = 'completed' and x.finished_at is not null) as has_valid_snapshot
    from integrations i
    left join lateral (select * from public.analytics_finance_sync_runs order by started_at desc limit 1) r on true
    where i.integration_key = 'omie'
  ), raw as (
    select * from hubspot union all select * from omie
  ), normalized as (
    select *,
      case
        when not configured then 'unavailable'
        when current_run_status in ('running', 'queued') then 'syncing'
        when current_run_status in ('failed', 'error', 'abandoned', 'timed_out', 'cancelled') and coalesce(last_failure_at, timestamp 'epoch') >= coalesce(last_success_at, timestamp 'epoch') then 'failed'
        when not has_valid_snapshot then 'never_synced'
        when last_success_at < timezone('utc', now()) - interval '24 hours' then 'stale'
        else 'fresh'
      end as published_source_status
    from raw
  ), payload as (
    select jsonb_object_agg(key, jsonb_build_object(
      'key', key, 'label', label, 'origin', origin,
      'status', published_source_status,
      'executionStatus', coalesce(current_run_status, 'never_synced'),
      'currentRunId', current_run_id,
      'currentRunStatus', current_run_status,
      'publishedSourceStatus', published_source_status,
      'lastAttemptAt', last_attempt_at,
      'lastSuccessAt', last_success_at,
      'lastFailureAt', last_failure_at,
      'durationMs', duration_ms,
      'processedCount', processed_count,
      'rejectedCount', rejected_count,
      'sanitizedError', sanitized_error,
      'error', sanitized_error,
      'freshnessMinutes', case when last_success_at is null then null else greatest(0, floor(extract(epoch from (timezone('utc', now()) - last_success_at)) / 60))::integer end,
      'runId', current_run_id,
      'hasValidSnapshot', has_valid_snapshot
    )) as sources,
    case
      when exists(select 1 from normalized where current_run_status in ('running', 'queued')) then 'syncing'
      when exists(select 1 from normalized where published_source_status = 'failed') then 'failed'
      when every(published_source_status = 'unavailable') then 'unavailable'
      when exists(select 1 from normalized where published_source_status in ('never_synced', 'stale')) then 'partial'
      else 'fresh'
    end as global_status
    from normalized
  )
  select sources || jsonb_build_object('globalStatus', global_status) into v_payload from payload;
  return coalesce(v_payload, '{}'::jsonb);
end;
$$;

revoke all on function public.rpc_analytics_source_status() from public, anon;
grant execute on function public.rpc_analytics_source_status() to authenticated, service_role;

comment on function public.rpc_analytics_source_status() is
  'Contrato único de execução e frescor: currentRunStatus é lifecycle; publishedSourceStatus é o estado do snapshot publicado. Erros retornados são sempre sanitizados.';
