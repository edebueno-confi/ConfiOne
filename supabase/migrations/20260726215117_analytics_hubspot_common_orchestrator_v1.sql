-- RELEASE-04: unifica a orquestracao assincrona do HubSpot.
-- Forward-only. Os RPCs legados de CS continuam disponiveis como compatibilidade,
-- mas o fluxo de producao passa a usar um parent run e work items comuns.

alter table public.hubspot_sync_runs
  add column if not exists domains text[] not null default '{}'::text[],
  add column if not exists source_updated_after_ms bigint,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists requested_by uuid;

alter table public.analytics_cs_sync_work_items
  add column if not exists domain_key text not null default 'cs',
  add column if not exists object_type text not null default 'ticket',
  add column if not exists next_attempt_at timestamptz,
  add column if not exists lease_attempt integer not null default 0;

create table if not exists public.analytics_hubspot_deal_staging (
  id uuid primary key default extensions.gen_random_uuid(),
  parent_run_id uuid not null references public.hubspot_sync_runs(id) on delete cascade,
  pipeline_id text not null,
  deal_id text not null,
  dealstage text,
  owner_id text,
  amount_home numeric,
  dealtype text,
  deal_name text,
  hs_created_at timestamptz,
  hs_closed_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  source_page integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(parent_run_id, deal_id)
);

alter table public.analytics_hubspot_deal_staging enable row level security;
revoke all on public.analytics_hubspot_deal_staging from public, anon, authenticated, service_role;

create unique index if not exists analytics_hubspot_common_work_identity_idx
  on public.analytics_cs_sync_work_items(parent_run_id, domain_key, object_type, pipeline_id, range_start_ms, range_end_ms, coalesce(cursor, ''));

create unique index if not exists hubspot_sync_runs_active_common_idx
  on public.hubspot_sync_runs(provider, domain_key)
  where provider='hubspot' and domain_key='all' and status in ('queued','running','partial');

create or replace view public.vw_analytics_hubspot_sync_progress
with (security_barrier = true)
as
select
  run.id as run_id,
  run.correlation_id,
  run.provider,
  run.domain_key,
  run.domains,
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

revoke all on public.vw_analytics_hubspot_sync_progress from public, anon;
grant select on public.vw_analytics_hubspot_sync_progress to authenticated, service_role;

create or replace function public.rpc_analytics_hubspot_start_run(
  p_domain_key text default null,
  p_mode text default null,
  p_correlation_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := app_private.require_active_actor();
  v_run public.hubspot_sync_runs;
  v_domains text[] := case when p_domain_key in ('commercial', 'cs') then array[p_domain_key] else array['commercial','cs'] end;
  v_mode text := case when p_mode in ('full','incremental') then p_mode else 'incremental' end;
  v_after bigint := null;
  v_count integer := 0;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'analytics HubSpot start denied';
  end if;
  perform public.rpc_analytics_hubspot_abandon_stale_runs(900);
  if exists (select 1 from public.hubspot_sync_runs where provider = 'hubspot' and domain_key = 'all' and status in ('queued','running','partial')) then
    raise exception using errcode = 'P0001', message = 'Ja existe uma carga HubSpot em andamento.';
  end if;
  if p_mode is null and exists (select 1 from public.hubspot_sync_runs where provider = 'hubspot' and status in ('success','succeeded') and watermark_advanced order by finished_at desc limit 1) then
    v_mode := 'incremental';
  else
    v_mode := coalesce(p_mode, 'full');
  end if;
  if v_mode = 'incremental' then
    select greatest(0, extract(epoch from (coalesce(max(finished_at), timezone('utc', now())) - interval '5 minutes')) * 1000)::bigint
      into v_after from public.hubspot_sync_runs where provider = 'hubspot' and status in ('success','succeeded') and watermark_advanced;
  end if;
  insert into public.hubspot_sync_runs(provider, domain_key, domains, mode, status, triggered_by, requested_by, correlation_id, heartbeat_at, source_updated_after_ms, source_pagination_complete)
  values ('hubspot','all',v_domains,v_mode,'queued',v_actor,v_actor,coalesce(p_correlation_id, extensions.gen_random_uuid()),timezone('utc',now()),v_after,false)
  returning * into v_run;
  insert into public.analytics_cs_sync_work_items(parent_run_id, domain_key, object_type, pipeline_id, pipeline_label, range_start_ms, range_end_ms)
  select v_run.id, c.domain_key, c.object_type, c.hubspot_pipeline_id, coalesce(c.hubspot_pipeline_label,c.label), 0, 4102444800000
  from public.analytics_source_config c
  where c.is_active and c.domain_key = any(v_domains)
  on conflict do nothing;
  insert into public.analytics_cs_sync_work_items(parent_run_id, domain_key, object_type, pipeline_id, pipeline_label, range_start_ms, range_end_ms)
  values (v_run.id, 'shared', 'shared', '*', 'Empresas, owners e catalogo', 0, 4102444800000);
  select count(*)::integer into v_count from public.analytics_cs_sync_work_items where parent_run_id = v_run.id;
  if v_count = 0 then
    update public.hubspot_sync_runs set status='failed', finished_at=timezone('utc',now()), error_code='NO_ACTIVE_HUBSPOT_SOURCES', error_message='Nenhuma fonte ativa do HubSpot foi configurada.' where id=v_run.id;
    raise exception 'Nenhuma fonte ativa do HubSpot foi configurada.';
  end if;
  update public.hubspot_sync_runs set pipelines_total=v_count, source_state='queued' where id=v_run.id;
  return jsonb_build_object('status','queued','run_id',v_run.id,'correlation_id',v_run.correlation_id,'mode',v_mode,'domains',v_domains,'work_items_total',v_count,'source_updated_after_ms',v_after);
end;
$$;

revoke all on function public.rpc_analytics_hubspot_start_run(text,text,uuid) from public, anon;
grant execute on function public.rpc_analytics_hubspot_start_run(text,text,uuid) to authenticated, service_role;

comment on function public.rpc_analytics_hubspot_start_run(text,text,uuid) is 'Inicia uma unica execucao assincrona comum para Comercial e CS/Support; a janela incremental tem sobreposicao de cinco minutos.';

create or replace function public.rpc_analytics_hubspot_abandon_stale_runs(p_timeout_seconds integer default 900)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then raise exception 'analytics HubSpot recovery denied'; end if;
  update public.hubspot_sync_runs
  set status='abandoned', finished_at=timezone('utc',now()), heartbeat_at=timezone('utc',now()), watermark_advanced=false,
      error_code='WORKER_TIMEOUT', error_message='Execucao abandonada por ausencia de heartbeat; snapshot anterior preservado.'
  where provider='hubspot' and domain_key='all' and status in ('queued','running','partial')
    and coalesce(heartbeat_at,started_at) < timezone('utc',now())-make_interval(secs=>greatest(60,least(p_timeout_seconds,86400)));
  get diagnostics v_count=row_count;
  update public.analytics_cs_sync_work_items set status='abandoned',lease_owner=null,lease_expires_at=null,updated_at=timezone('utc',now())
  where parent_run_id in (select id from public.hubspot_sync_runs where provider='hubspot' and domain_key='all' and status='abandoned')
    and status in ('pending','leased','running','retrying');
  return v_count;
end; $$;

revoke all on function public.rpc_analytics_hubspot_abandon_stale_runs(integer) from public, anon;
grant execute on function public.rpc_analytics_hubspot_abandon_stale_runs(integer) to authenticated, service_role;

create or replace function public.rpc_analytics_hubspot_claim_work_item(
  p_worker_id text,
  p_lease_seconds integer default 90
)
returns table (
  work_item_id uuid,
  run_id uuid,
  domain_key text,
  object_type text,
  pipeline_id text,
  cursor text,
  page_number integer,
  range_start_ms bigint,
  range_end_ms bigint,
  attempts integer,
  correlation_id uuid,
  source_updated_after_ms bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.analytics_cs_sync_work_items;
  v_now timestamptz := timezone('utc', now());
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then raise exception 'analytics HubSpot worker denied'; end if;
  if nullif(btrim(p_worker_id), '') is null then raise exception 'worker id obrigatorio'; end if;
  select item.* into v_item
  from public.analytics_cs_sync_work_items item
  join public.hubspot_sync_runs run on run.id = item.parent_run_id
  where run.provider='hubspot' and run.domain_key='all' and run.status in ('queued','running','partial')
    and item.status in ('pending','retrying','leased','running')
    and (item.lease_expires_at is null or item.lease_expires_at <= v_now)
    and (item.next_attempt_at is null or item.next_attempt_at <= v_now)
  order by item.created_at
  for update of item skip locked limit 1;
  if v_item.id is null then return; end if;
  update public.analytics_cs_sync_work_items as item
  set status='running', attempts=item.attempts+1, lease_attempt=item.lease_attempt+1,
      lease_owner=p_worker_id, lease_expires_at=v_now+make_interval(secs=>greatest(30,least(p_lease_seconds,300))),
      heartbeat_at=v_now, started_at=coalesce(item.started_at,v_now), updated_at=v_now,
      error_code=null, error_message=null
  where id=v_item.id returning * into v_item;
  update public.hubspot_sync_runs set status='running', heartbeat_at=v_now, started_at=coalesce(started_at,v_now) where id=v_item.parent_run_id;
  return query select v_item.id,v_item.parent_run_id,v_item.domain_key,v_item.object_type,v_item.pipeline_id,v_item.cursor,v_item.page_number,v_item.range_start_ms,v_item.range_end_ms,v_item.attempts,run.correlation_id,run.source_updated_after_ms from public.hubspot_sync_runs run where run.id=v_item.parent_run_id;
end;
$$;

revoke all on function public.rpc_analytics_hubspot_claim_work_item(text,integer) from public, anon;
grant execute on function public.rpc_analytics_hubspot_claim_work_item(text,integer) to authenticated, service_role;

create or replace function public.rpc_analytics_hubspot_checkpoint_work_item(
  p_work_item_id uuid, p_worker_id text, p_next_cursor text, p_page_number integer,
  p_received integer, p_accepted integer, p_rejected integer, p_completed boolean,
  p_error_code text default null, p_error_message text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_item public.analytics_cs_sync_work_items; v_run_id uuid; v_now timestamptz:=timezone('utc',now()); v_status text;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then raise exception 'analytics HubSpot checkpoint denied'; end if;
  select * into v_item from public.analytics_cs_sync_work_items where id=p_work_item_id for update;
  if v_item.id is null or v_item.lease_owner<>p_worker_id then raise exception 'lease do item invalido ou expirado'; end if;
  v_run_id:=v_item.parent_run_id;
  v_status:=case when p_completed then 'succeeded' when p_error_code is null then 'pending' when p_error_code like 'RETRY_%' then 'retrying' else 'failed' end;
  update public.analytics_cs_sync_work_items set cursor=p_next_cursor,next_cursor=p_next_cursor,page_number=p_page_number,status=v_status,
    received=received+greatest(p_received,0),accepted=accepted+greatest(p_accepted,0),rejected=rejected+greatest(p_rejected,0),
    lease_owner=null,lease_expires_at=null,heartbeat_at=v_now,updated_at=v_now,finished_at=case when p_completed then v_now else null end,
    next_attempt_at=case when v_status='retrying' then v_now+make_interval(secs=>least(300,greatest(10,2^least(attempts,5)))) else null end,
    error_code=p_error_code,error_message=left(p_error_message,500) where id=p_work_item_id;
  update public.hubspot_sync_runs run set heartbeat_at=v_now,source_records_received=totals.received,records_normalized=totals.received,
    records_accepted=totals.accepted,records_rejected=totals.rejected,source_pages=totals.pages,pipelines_completed=totals.completed
  from (select coalesce(sum(received),0)::integer received,coalesce(sum(accepted),0)::integer accepted,coalesce(sum(rejected),0)::integer rejected,
    coalesce(sum(page_number),0)::integer pages,count(*) filter(where status='succeeded')::integer completed from public.analytics_cs_sync_work_items where parent_run_id=v_run_id) totals
  where run.id=v_run_id;
  return jsonb_build_object('work_item_id',p_work_item_id,'status',v_status,'completed',p_completed);
end; $$;

revoke all on function public.rpc_analytics_hubspot_checkpoint_work_item(uuid,text,text,integer,integer,integer,integer,boolean,text,text) from public, anon;
grant execute on function public.rpc_analytics_hubspot_checkpoint_work_item(uuid,text,text,integer,integer,integer,integer,boolean,text,text) to authenticated, service_role;

create or replace function public.rpc_analytics_hubspot_finalize_run(p_run_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_run public.hubspot_sync_runs; v_total integer; v_completed integer; v_promoted integer:=0; v_now timestamptz:=timezone('utc',now());
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then raise exception 'analytics HubSpot finalize denied'; end if;
  select * into v_run from public.hubspot_sync_runs where id=p_run_id for update;
  if v_run.id is null then raise exception 'run nao encontrado'; end if;
  if v_run.status in ('success','succeeded','failed','error','abandoned','cancelled') then return jsonb_build_object('status',v_run.status,'run_id',v_run.id,'watermark_advanced',v_run.watermark_advanced); end if;
  select count(*)::integer,count(*) filter(where status='succeeded')::integer into v_total,v_completed from public.analytics_cs_sync_work_items where parent_run_id=p_run_id;
  if exists(select 1 from public.analytics_cs_sync_work_items where parent_run_id=p_run_id and status='failed') then
    update public.hubspot_sync_runs set status='failed',finished_at=v_now,heartbeat_at=v_now,error_code='WORK_ITEM_FAILED',error_message='Um ou mais lotes do HubSpot falharam; snapshot anterior preservado.',watermark_advanced=false where id=p_run_id;
    return jsonb_build_object('status','failed','run_id',p_run_id,'watermark_advanced',false);
  end if;
  if v_total=0 or v_completed<v_total then return jsonb_build_object('status',v_run.status,'run_id',p_run_id,'watermark_advanced',false); end if;
  insert into public.hubspot_tickets(ticket_id,pipeline_id,pipeline_stage,owner_id,source_type,priority,hs_created_at,hs_closed_at,time_to_first_response_sla_status,time_to_close_sla_status,raw,synced_at)
    select ticket_id,pipeline_id,pipeline_stage,owner_id,source_type,priority,hs_created_at,hs_closed_at,time_to_first_response_sla_status,time_to_close_sla_status,raw,v_now from public.analytics_cs_ticket_staging where parent_run_id=p_run_id
    on conflict(ticket_id) do update set pipeline_id=excluded.pipeline_id,pipeline_stage=excluded.pipeline_stage,owner_id=excluded.owner_id,source_type=excluded.source_type,priority=excluded.priority,hs_created_at=excluded.hs_created_at,hs_closed_at=excluded.hs_closed_at,time_to_first_response_sla_status=excluded.time_to_first_response_sla_status,time_to_close_sla_status=excluded.time_to_close_sla_status,raw=excluded.raw,synced_at=excluded.synced_at;
  get diagnostics v_promoted=row_count;
  insert into public.hubspot_deals(deal_id,pipeline_id,dealstage,owner_id,amount_home,dealtype,deal_name,hs_created_at,hs_closed_at,raw,synced_at)
    select deal_id,pipeline_id,dealstage,owner_id,amount_home,dealtype,deal_name,hs_created_at,hs_closed_at,raw,v_now from public.analytics_hubspot_deal_staging where parent_run_id=p_run_id
    on conflict(deal_id) do update set pipeline_id=excluded.pipeline_id,dealstage=excluded.dealstage,owner_id=excluded.owner_id,amount_home=excluded.amount_home,dealtype=excluded.dealtype,deal_name=excluded.deal_name,hs_created_at=excluded.hs_created_at,hs_closed_at=excluded.hs_closed_at,raw=excluded.raw,synced_at=excluded.synced_at;
  v_promoted:=v_promoted+coalesce((select count(*)::integer from public.analytics_hubspot_deal_staging where parent_run_id=p_run_id),0);
  update public.hubspot_sync_runs set status='success',finished_at=v_now,heartbeat_at=v_now,records_promoted=v_promoted,source_pagination_complete=true,source_state='complete',watermark_advanced=true,error_code=null,error_message=null where id=p_run_id;
  return jsonb_build_object('status','success','run_id',p_run_id,'records_promoted',v_promoted,'watermark_advanced',true);
end; $$;

revoke all on function public.rpc_analytics_hubspot_finalize_run(uuid) from public, anon;
grant execute on function public.rpc_analytics_hubspot_finalize_run(uuid) to authenticated, service_role;
