-- Runner assíncrono e particionado da carga de tickets CS/Support.
-- Forward-only: preserva hubspot_sync_runs e os snapshots já confirmados.

alter table public.hubspot_sync_runs
  drop constraint if exists hubspot_sync_runs_status_check;

alter table public.hubspot_sync_runs
  add constraint hubspot_sync_runs_status_check
  check (status in ('queued', 'running', 'success', 'succeeded', 'partial', 'error', 'failed', 'abandoned', 'cancelled'));

alter table public.hubspot_sync_runs
  add column if not exists provider text not null default 'hubspot',
  add column if not exists mode text not null default 'incremental',
  add column if not exists heartbeat_at timestamptz,
  add column if not exists records_normalized integer not null default 0,
  add column if not exists records_accepted integer not null default 0,
  add column if not exists records_rejected integer not null default 0,
  add column if not exists records_promoted integer not null default 0,
  add column if not exists pipelines_total integer not null default 0,
  add column if not exists pipelines_completed integer not null default 0,
  add column if not exists error_code text;

create table if not exists public.analytics_cs_sync_work_items (
  id uuid primary key default extensions.gen_random_uuid(),
  parent_run_id uuid not null references public.hubspot_sync_runs(id) on delete cascade,
  pipeline_id text not null,
  pipeline_label text,
  cursor text,
  next_cursor text,
  page_number integer not null default 0,
  range_start_ms bigint not null default 0,
  range_end_ms bigint not null default 4102444800000,
  status text not null default 'pending',
  attempts integer not null default 0,
  lease_owner text,
  lease_expires_at timestamptz,
  heartbeat_at timestamptz,
  received integer not null default 0,
  accepted integer not null default 0,
  rejected integer not null default 0,
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint analytics_cs_sync_work_item_status_check
    check (status in ('pending', 'leased', 'running', 'retrying', 'succeeded', 'failed', 'abandoned')),
  constraint analytics_cs_sync_work_item_range_check
    check (range_start_ms >= 0 and range_end_ms > range_start_ms),
  constraint analytics_cs_sync_work_item_attempts_check
    check (attempts >= 0)
);

create unique index if not exists analytics_cs_sync_work_items_identity_idx
  on public.analytics_cs_sync_work_items(parent_run_id, pipeline_id, range_start_ms, range_end_ms, coalesce(cursor, ''));
create index if not exists analytics_cs_sync_work_items_claim_idx
  on public.analytics_cs_sync_work_items(status, lease_expires_at, created_at);
create index if not exists analytics_cs_sync_work_items_parent_idx
  on public.analytics_cs_sync_work_items(parent_run_id, status);

create table if not exists public.analytics_cs_ticket_staging (
  id uuid primary key default extensions.gen_random_uuid(),
  parent_run_id uuid not null references public.hubspot_sync_runs(id) on delete cascade,
  pipeline_id text not null,
  ticket_id text not null,
  pipeline_stage text,
  owner_id text,
  source_type text,
  priority text,
  hs_created_at timestamptz,
  hs_closed_at timestamptz,
  time_to_first_response_sla_status text,
  time_to_close_sla_status text,
  raw jsonb not null default '{}'::jsonb,
  source_page integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(parent_run_id, ticket_id)
);
create index if not exists analytics_cs_ticket_staging_parent_idx
  on public.analytics_cs_ticket_staging(parent_run_id, pipeline_id);

alter table public.analytics_cs_sync_work_items enable row level security;
alter table public.analytics_cs_ticket_staging enable row level security;
revoke all on public.analytics_cs_sync_work_items from public, anon, authenticated, service_role;
revoke all on public.analytics_cs_ticket_staging from public, anon, authenticated, service_role;

create unique index if not exists hubspot_sync_runs_active_cs_idx
  on public.hubspot_sync_runs(provider, domain_key)
  where provider = 'hubspot' and domain_key = 'cs' and status in ('queued', 'running', 'partial');

create or replace view public.vw_analytics_cs_sync_progress
with (security_barrier = true)
as
  select
    run.id as run_id,
    run.correlation_id,
    run.provider,
    run.domain_key,
    run.mode,
    run.status,
    run.started_at,
    run.heartbeat_at,
    run.finished_at,
    run.source_total,
    run.source_records_received,
    run.records_normalized,
    run.records_accepted,
    run.records_rejected,
    run.records_promoted,
    run.source_pages,
    run.pipelines_total,
    run.pipelines_completed,
    run.source_pagination_complete,
    run.watermark_advanced,
    run.error_code,
    run.error_message,
    coalesce(count(item.id) filter (where item.status = 'succeeded'), 0)::integer as completed_items,
    coalesce(count(item.id) filter (where item.status in ('pending', 'leased', 'running', 'retrying')), 0)::integer as active_items,
    coalesce(sum(item.attempts), 0)::integer as retries,
    max(item.updated_at) as last_item_activity
  from public.hubspot_sync_runs as run
  left join public.analytics_cs_sync_work_items as item on item.parent_run_id = run.id
  where app_private.can_read_analytics()
  group by run.id;

revoke all on public.vw_analytics_cs_sync_progress from public, anon;
grant select on public.vw_analytics_cs_sync_progress to authenticated, service_role;

create or replace view public.vw_analytics_dashboard_sync_status
with (security_barrier = true)
as
select id, domain_key, status, started_at, finished_at,
       deals_synced, tickets_synced, owners_synced, stages_synced, companies_synced,
       case when status in ('error', 'failed', 'abandoned') then coalesce(error_message, 'A sincronização não foi concluída.') else null end as error_message,
       correlation_id, source_total, source_records_received, source_pages,
       source_pagination_complete, source_state, watermark_advanced,
       provider, mode, heartbeat_at, records_normalized, records_accepted,
       records_rejected, records_promoted, pipelines_total, pipelines_completed, error_code
from public.hubspot_sync_runs
where app_private.can_read_analytics();
revoke all on public.vw_analytics_dashboard_sync_status from public, anon;
grant select on public.vw_analytics_dashboard_sync_status to authenticated;

create or replace function public.rpc_analytics_cs_start_run(p_correlation_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app_private.require_active_actor();
  v_run public.hubspot_sync_runs;
  v_config record;
  v_count integer := 0;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'analytics CS sync start denied';
  end if;

  -- Recupera execuções antigas sem heartbeat antes de aplicar a unicidade de execução ativa.
  -- A recuperação é versionada e passa pela mesma função de lease usada pelo dispatcher.
  perform public.rpc_analytics_cs_abandon_stale_runs(900);

  if exists (
    select 1 from public.hubspot_sync_runs
    where provider = 'hubspot' and domain_key = 'cs'
      and status in ('queued', 'running', 'partial')
  ) then
    raise exception using errcode = 'P0001', message = 'Já existe uma carga de CS em andamento.';
  end if;

  insert into public.hubspot_sync_runs (
    provider, domain_key, mode, status, triggered_by, correlation_id,
    heartbeat_at, pipelines_total, source_pagination_complete
  ) values (
    'hubspot', 'cs', 'full', 'queued', v_actor, coalesce(p_correlation_id, extensions.gen_random_uuid()),
    timezone('utc', now()), 0, false
  ) returning * into v_run;

  for v_config in
    select distinct on (hubspot_pipeline_id)
      hubspot_pipeline_id, hubspot_pipeline_label
    from public.analytics_source_config
    where domain_key = 'cs' and object_type = 'ticket' and is_active
    order by hubspot_pipeline_id, updated_at desc
  loop
    insert into public.analytics_cs_sync_work_items (
      parent_run_id, pipeline_id, pipeline_label, range_start_ms, range_end_ms
    ) values (
      v_run.id, v_config.hubspot_pipeline_id, v_config.hubspot_pipeline_label, 0, 4102444800000
    );
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    update public.hubspot_sync_runs
    set status = 'failed', finished_at = timezone('utc', now()), heartbeat_at = timezone('utc', now()),
        error_code = 'NO_ACTIVE_CS_PIPELINES', error_message = 'Nenhum pipeline ativo de CS foi configurado.', pipelines_total = 0
    where id = v_run.id;
    raise exception 'Nenhum pipeline ativo de CS foi configurado.';
  end if;

  update public.hubspot_sync_runs set pipelines_total = v_count where id = v_run.id;
  return jsonb_build_object('status', 'queued', 'run_id', v_run.id, 'correlation_id', v_run.correlation_id, 'pipelines_total', v_count);
end;
$$;

create or replace function public.rpc_analytics_cs_claim_work_item(
  p_worker_id text,
  p_lease_seconds integer default 90
)
returns table (
  work_item_id uuid,
  run_id uuid,
  pipeline_id text,
  cursor text,
  page_number integer,
  range_start_ms bigint,
  range_end_ms bigint,
  attempts integer,
  correlation_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.analytics_cs_sync_work_items;
  v_now timestamptz := timezone('utc', now());
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'analytics CS worker denied';
  end if;
  if nullif(btrim(p_worker_id), '') is null then raise exception 'worker id obrigatório'; end if;

  select item.* into v_item
  from public.analytics_cs_sync_work_items item
  join public.hubspot_sync_runs run on run.id = item.parent_run_id
  where run.provider = 'hubspot' and run.domain_key = 'cs'
    and run.status in ('queued', 'running', 'partial')
    and item.status in ('pending', 'retrying', 'leased', 'running')
    and (item.lease_expires_at is null or item.lease_expires_at <= v_now)
  order by item.created_at
  for update of item skip locked
  limit 1;

  if v_item.id is null then return; end if;

  update public.analytics_cs_sync_work_items as item
  set status = 'running', attempts = item.attempts + 1, lease_owner = p_worker_id,
      lease_expires_at = v_now + make_interval(secs => greatest(30, least(p_lease_seconds, 300))),
      heartbeat_at = v_now, started_at = coalesce(started_at, v_now), updated_at = v_now,
      error_code = null, error_message = null
  where id = v_item.id
  returning * into v_item;

  update public.hubspot_sync_runs
  set status = 'running', heartbeat_at = v_now, started_at = coalesce(started_at, v_now)
  where id = v_item.parent_run_id;

  return query
  select v_item.id, v_item.parent_run_id, v_item.pipeline_id, v_item.cursor, v_item.page_number,
         v_item.range_start_ms, v_item.range_end_ms, v_item.attempts,
         run.correlation_id
  from public.hubspot_sync_runs run where run.id = v_item.parent_run_id;
end;
$$;

create or replace function public.rpc_analytics_cs_checkpoint_work_item(
  p_work_item_id uuid,
  p_worker_id text,
  p_next_cursor text,
  p_page_number integer,
  p_received integer,
  p_accepted integer,
  p_rejected integer,
  p_completed boolean,
  p_error_code text default null,
  p_error_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.analytics_cs_sync_work_items;
  v_run_id uuid;
  v_now timestamptz := timezone('utc', now());
  v_status text;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then raise exception 'analytics CS checkpoint denied'; end if;
  select * into v_item from public.analytics_cs_sync_work_items where id = p_work_item_id for update;
  if v_item.id is null or v_item.lease_owner <> p_worker_id then raise exception 'lease do item inválido ou expirado'; end if;
  v_run_id := v_item.parent_run_id;
  v_status := case
    when p_completed then 'succeeded'
    when p_error_code is null then 'pending'
    when p_error_code like 'RETRY_%' then 'retrying'
    else 'failed'
  end;
  update public.analytics_cs_sync_work_items
  set cursor = p_next_cursor, next_cursor = p_next_cursor, page_number = p_page_number,
      status = v_status, received = received + greatest(p_received, 0),
      accepted = accepted + greatest(p_accepted, 0), rejected = rejected + greatest(p_rejected, 0),
      lease_owner = null, lease_expires_at = null, heartbeat_at = v_now, updated_at = v_now,
      finished_at = case when p_completed then v_now else null end,
      error_code = p_error_code, error_message = left(p_error_message, 500)
  where id = v_item.id;

  update public.hubspot_sync_runs run
  set heartbeat_at = v_now,
      source_records_received = totals.received,
      records_normalized = totals.received,
      records_accepted = totals.accepted,
      records_rejected = totals.rejected,
      source_pages = totals.pages,
      pipelines_completed = totals.completed
  from (
    select coalesce(sum(received), 0)::integer received, coalesce(sum(accepted), 0)::integer accepted,
           coalesce(sum(rejected), 0)::integer rejected, coalesce(sum(page_number), 0)::integer pages,
           count(*) filter (where status = 'succeeded')::integer completed
    from public.analytics_cs_sync_work_items where parent_run_id = v_run_id
  ) totals
  where run.id = v_run_id;

  return jsonb_build_object('work_item_id', p_work_item_id, 'status', v_status, 'completed', p_completed);
end;
$$;

create or replace function public.rpc_analytics_cs_finalize_run(p_run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.hubspot_sync_runs;
  v_total integer;
  v_completed integer;
  v_promoted integer;
  v_now timestamptz := timezone('utc', now());
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then raise exception 'analytics CS finalize denied'; end if;
  select * into v_run from public.hubspot_sync_runs where id = p_run_id for update;
  if v_run.id is null then raise exception 'run não encontrado'; end if;
  if v_run.status in ('success', 'succeeded', 'failed', 'error', 'abandoned', 'cancelled') then
    return jsonb_build_object('status', v_run.status, 'run_id', v_run.id, 'watermark_advanced', v_run.watermark_advanced);
  end if;
  select count(*)::integer, count(*) filter (where status = 'succeeded')::integer
    into v_total, v_completed
  from public.analytics_cs_sync_work_items where parent_run_id = p_run_id;
  if exists (select 1 from public.analytics_cs_sync_work_items where parent_run_id = p_run_id and status = 'failed') then
    update public.hubspot_sync_runs set status = 'failed', finished_at = v_now, heartbeat_at = v_now,
      error_code = 'WORK_ITEM_FAILED', error_message = 'Um ou mais lotes de CS falharam; snapshot anterior preservado.', watermark_advanced = false
    where id = p_run_id;
    return jsonb_build_object('status', 'failed', 'run_id', p_run_id, 'watermark_advanced', false);
  end if;
  if v_total = 0 or v_completed < v_total then
    return jsonb_build_object('status', v_run.status, 'run_id', p_run_id, 'watermark_advanced', false);
  end if;
  insert into public.hubspot_tickets (
    ticket_id, pipeline_id, pipeline_stage, owner_id, source_type, priority,
    hs_created_at, hs_closed_at, time_to_first_response_sla_status,
    time_to_close_sla_status, raw, synced_at
  )
  select ticket_id, pipeline_id, pipeline_stage, owner_id, source_type, priority,
    hs_created_at, hs_closed_at, time_to_first_response_sla_status,
    time_to_close_sla_status, raw, v_now
  from public.analytics_cs_ticket_staging where parent_run_id = p_run_id
  on conflict (ticket_id) do update set
    pipeline_id = excluded.pipeline_id, pipeline_stage = excluded.pipeline_stage,
    owner_id = excluded.owner_id, source_type = excluded.source_type, priority = excluded.priority,
    hs_created_at = excluded.hs_created_at, hs_closed_at = excluded.hs_closed_at,
    time_to_first_response_sla_status = excluded.time_to_first_response_sla_status,
    time_to_close_sla_status = excluded.time_to_close_sla_status,
    raw = excluded.raw, synced_at = excluded.synced_at;
  get diagnostics v_promoted = row_count;
  update public.hubspot_sync_runs
  set status = 'success', finished_at = v_now, heartbeat_at = v_now,
      records_promoted = v_promoted, source_pagination_complete = true,
      source_state = 'complete', watermark_advanced = true,
      pipelines_completed = v_total, error_code = null, error_message = null
  where id = p_run_id;
  return jsonb_build_object('status', 'success', 'run_id', p_run_id, 'records_promoted', v_promoted, 'watermark_advanced', true);
end;
$$;

create or replace function public.rpc_analytics_cs_split_work_item(p_work_item_id uuid, p_worker_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.analytics_cs_sync_work_items;
  v_midpoint bigint;
  v_left uuid;
  v_right uuid;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then raise exception 'analytics CS partition denied'; end if;
  select * into v_item from public.analytics_cs_sync_work_items where id = p_work_item_id for update;
  if v_item.id is null or v_item.lease_owner <> p_worker_id then raise exception 'lease do item inválido'; end if;
  if v_item.page_number <> 0 or v_item.cursor is not null then raise exception 'partição só pode ocorrer na primeira página'; end if;
  v_midpoint := v_item.range_start_ms + ((v_item.range_end_ms - v_item.range_start_ms) / 2);
  if v_midpoint <= v_item.range_start_ms or v_midpoint >= v_item.range_end_ms then raise exception 'intervalo não particionável'; end if;
  update public.analytics_cs_sync_work_items
  set status = 'succeeded', lease_owner = null, lease_expires_at = null, finished_at = timezone('utc', now()), updated_at = timezone('utc', now())
  where id = v_item.id;
  insert into public.analytics_cs_sync_work_items(parent_run_id, pipeline_id, pipeline_label, range_start_ms, range_end_ms)
  values (v_item.parent_run_id, v_item.pipeline_id, v_item.pipeline_label, v_item.range_start_ms, v_midpoint)
  returning id into v_left;
  insert into public.analytics_cs_sync_work_items(parent_run_id, pipeline_id, pipeline_label, range_start_ms, range_end_ms)
  values (v_item.parent_run_id, v_item.pipeline_id, v_item.pipeline_label, v_midpoint, v_item.range_end_ms)
  returning id into v_right;
  update public.hubspot_sync_runs set pipelines_total = (select count(*) from public.analytics_cs_sync_work_items where parent_run_id = v_item.parent_run_id), heartbeat_at = timezone('utc', now()) where id = v_item.parent_run_id;
  return jsonb_build_object('left', v_left, 'right', v_right, 'parent_run_id', v_item.parent_run_id);
end;
$$;

create or replace function public.rpc_analytics_cs_abandon_stale_runs(p_timeout_seconds integer default 900)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_count integer;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then raise exception 'analytics CS recovery denied'; end if;
  with stale as (
    update public.hubspot_sync_runs
    set status = 'abandoned', finished_at = timezone('utc', now()), error_code = 'WORKER_TIMEOUT',
        error_message = 'Execução abandonada após expiração do lease/heartbeat; snapshot anterior preservado.', watermark_advanced = false
    where provider = 'hubspot' and domain_key = 'cs' and status in ('queued', 'running', 'partial')
      and coalesce(heartbeat_at, started_at) < timezone('utc', now()) - make_interval(secs => greatest(60, p_timeout_seconds))
    returning id
  ), abandoned_items as (
    update public.analytics_cs_sync_work_items set status = 'abandoned', lease_owner = null, lease_expires_at = null, updated_at = timezone('utc', now())
    where parent_run_id in (select id from stale) and status <> 'succeeded' returning id
  ) select count(*) into v_count from stale;
  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.rpc_analytics_cs_start_run(uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_analytics_cs_claim_work_item(text, integer) from public, anon, authenticated, service_role;
revoke all on function public.rpc_analytics_cs_checkpoint_work_item(uuid, text, text, integer, integer, integer, integer, boolean, text, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_analytics_cs_finalize_run(uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_analytics_cs_split_work_item(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_analytics_cs_abandon_stale_runs(integer) from public, anon, authenticated, service_role;
grant execute on function public.rpc_analytics_cs_start_run(uuid) to authenticated, service_role;
grant execute on function public.rpc_analytics_cs_claim_work_item(text, integer) to authenticated, service_role;
grant execute on function public.rpc_analytics_cs_checkpoint_work_item(uuid, text, text, integer, integer, integer, integer, boolean, text, text) to authenticated, service_role;
grant execute on function public.rpc_analytics_cs_finalize_run(uuid) to authenticated, service_role;
grant execute on function public.rpc_analytics_cs_split_work_item(uuid, text) to authenticated, service_role;
grant execute on function public.rpc_analytics_cs_abandon_stale_runs(integer) to authenticated, service_role;

comment on table public.analytics_cs_sync_work_items is 'Unidade retomável de carga HubSpot CS, particionada por pipeline e cursor.';
comment on table public.analytics_cs_ticket_staging is 'Staging isolado por parent run; só uma execução completa pode promover dados ao snapshot.';
comment on view public.vw_analytics_cs_sync_progress is 'Progresso sanitizado da carga assíncrona CS para a UI autenticada.';
