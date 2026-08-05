-- SETTINGS-01: catálogo administrativo de fontes HubSpot e integração OMIE.
-- Forward-only. Não remove linhas, pipelines, histórico ou segredos existentes.

alter table public.analytics_source_config
  add column if not exists area_key text not null default 'a_classificar',
  add column if not exists classification_source text not null default 'pending',
  add column if not exists is_archived boolean not null default false,
  add column if not exists discovery_status text not null default 'pending',
  add column if not exists last_discovered_at timestamptz;

alter table public.analytics_source_config
  drop constraint if exists analytics_source_config_area_key_check;

alter table public.analytics_source_config
  add constraint analytics_source_config_area_key_check
  check (area_key in ('commercial', 'customer_success', 'support', 'chat', 'a_classificar'));

alter table public.analytics_source_config
  drop constraint if exists analytics_source_config_discovery_status_check;

alter table public.analytics_source_config
  add constraint analytics_source_config_discovery_status_check
  check (discovery_status in ('pending', 'active', 'archived'));

update public.analytics_source_config
set area_key = case
      when domain_key = 'commercial' then 'commercial'
      when domain_key = 'cs' then 'support'
      else 'a_classificar'
    end,
    classification_source = case
      when domain_key in ('commercial', 'cs') then 'legacy'
      else 'pending'
    end
where area_key = 'a_classificar';

update public.managed_integrations
set mode = 'api',
    config = case
      when integration_key = 'omie' then jsonb_build_object(
        'credential_format', 'app_key_app_secret',
        'resource_label', 'Contas a receber'
      )
      else config
    end
where integration_key = 'omie';

create index if not exists analytics_source_config_catalog_status_idx
  on public.analytics_source_config (object_type, is_archived, area_key, label);

create or replace view public.vw_admin_analytics_pipeline_catalog_v2
with (security_barrier = true)
as
select
  c.id,
  c.domain_key,
  c.object_type,
  c.hubspot_pipeline_id,
  c.hubspot_pipeline_label,
  coalesce(nullif(btrim(c.label), ''), nullif(btrim(c.hubspot_pipeline_label), ''), c.hubspot_pipeline_id) as label,
  nullif(btrim(c.label), '') is not null
    and nullif(btrim(c.label), '') <> nullif(btrim(c.hubspot_pipeline_label), '') as has_alias,
  c.label as alias,
  c.area_key,
  c.classification_source,
  c.is_active,
  c.is_archived,
  c.discovery_status,
  c.last_discovered_at,
  c.updated_at
from public.analytics_source_config c
where app_private.can_read_analytics();

revoke all on public.vw_admin_analytics_pipeline_catalog_v2 from public, anon;
grant select on public.vw_admin_analytics_pipeline_catalog_v2 to authenticated, service_role;

create or replace function public.rpc_admin_update_analytics_pipeline_config(
  p_id uuid,
  p_area_key text,
  p_alias text default null,
  p_is_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.analytics_source_config;
  v_domain_key text;
  v_alias text;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_area_key not in ('commercial', 'customer_success', 'support', 'chat', 'a_classificar') then
    raise exception 'Área de pipeline inválida.' using errcode = '22023';
  end if;

  select * into v_row
  from public.analytics_source_config
  where id = p_id
  for update;
  if not found then
    raise exception 'Pipeline não encontrado.' using errcode = 'P0002';
  end if;
  if v_row.is_archived then
    raise exception 'Pipeline arquivado não pode ser reativado automaticamente.' using errcode = '22023';
  end if;

  v_domain_key := case
    when v_row.object_type = 'deal' then 'commercial'
    when p_area_key in ('customer_success', 'support') then 'cs'
    else 'unclassified'
  end;
  v_alias := nullif(btrim(coalesce(p_alias, '')), '');

  update public.analytics_source_config
  set domain_key = v_domain_key,
      area_key = p_area_key,
      classification_source = 'admin',
      label = coalesce(v_alias, nullif(btrim(hubspot_pipeline_label), ''), hubspot_pipeline_id),
      is_active = coalesce(p_is_active, false),
      updated_at = timezone('utc', now())
  where id = p_id
  returning * into v_row;

  return jsonb_build_object(
    'id', v_row.id,
    'domain_key', v_row.domain_key,
    'object_type', v_row.object_type,
    'hubspot_pipeline_id', v_row.hubspot_pipeline_id,
    'hubspot_pipeline_label', v_row.hubspot_pipeline_label,
    'label', v_row.label,
    'alias', case when v_row.label = v_row.hubspot_pipeline_label then null else v_row.label end,
    'area_key', v_row.area_key,
    'classification_source', v_row.classification_source,
    'is_active', v_row.is_active,
    'is_archived', v_row.is_archived,
    'discovery_status', v_row.discovery_status,
    'last_discovered_at', v_row.last_discovered_at,
    'updated_at', v_row.updated_at
  );
end;
$$;

revoke all on function public.rpc_admin_update_analytics_pipeline_config(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function public.rpc_admin_update_analytics_pipeline_config(uuid, text, text, boolean) to authenticated;

create or replace function public.rpc_service_reconcile_hubspot_pipeline_catalog(
  p_object_type text,
  p_pipelines jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pipeline jsonb;
  v_pipeline_id text;
  v_label text;
  v_count integer := 0;
  v_existing public.analytics_source_config;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Somente o serviço de sincronização pode reconciliar o catálogo.' using errcode = '42501';
  end if;
  if p_object_type not in ('deal', 'ticket') or jsonb_typeof(p_pipelines) <> 'array' then
    raise exception 'Catálogo de pipelines inválido.' using errcode = '22023';
  end if;

  for v_pipeline in select value from jsonb_array_elements(p_pipelines)
  loop
    v_pipeline_id := nullif(btrim(v_pipeline->>'pipeline_id'), '');
    v_label := nullif(btrim(v_pipeline->>'label'), '');
    if v_pipeline_id is null or v_label is null then
      continue;
    end if;

    select * into v_existing
    from public.analytics_source_config
    where object_type = p_object_type
      and hubspot_pipeline_id = v_pipeline_id
    order by case when domain_key in ('commercial', 'cs') then 0 else 1 end, created_at
    limit 1
    for update;

    if v_existing.id is null then
      insert into public.analytics_source_config (
        domain_key, object_type, hubspot_pipeline_id, hubspot_pipeline_label,
        label, is_active, area_key, classification_source, is_archived,
        discovery_status, last_discovered_at
      ) values (
        case when p_object_type = 'deal' then 'commercial' else 'unclassified' end,
        p_object_type, v_pipeline_id, v_label, v_label, true,
        case when p_object_type = 'deal' then 'commercial' else 'a_classificar' end,
        'pending', false, 'active', timezone('utc', now())
      );
    else
      update public.analytics_source_config
      set hubspot_pipeline_label = v_label,
          is_archived = false,
          discovery_status = 'active',
          last_discovered_at = timezone('utc', now()),
          is_active = case when v_existing.classification_source = 'pending' then true else v_existing.is_active end,
          updated_at = timezone('utc', now())
      where id = v_existing.id;
    end if;
    v_count := v_count + 1;
  end loop;

  update public.analytics_source_config c
  set is_archived = true,
      discovery_status = 'archived',
      is_active = false,
      updated_at = timezone('utc', now())
  where c.object_type = p_object_type
    and c.last_discovered_at is not null
    and not exists (
      select 1
      from jsonb_array_elements(p_pipelines) item
      where item->>'pipeline_id' = c.hubspot_pipeline_id
    );

  return v_count;
end;
$$;

revoke all on function public.rpc_service_reconcile_hubspot_pipeline_catalog(text, jsonb) from public, anon, authenticated;
grant execute on function public.rpc_service_reconcile_hubspot_pipeline_catalog(text, jsonb) to service_role;

comment on table public.analytics_source_config is
  'Catálogo HubSpot descoberto pela API, com classificação administrativa, alias, atividade, arquivamento e última descoberta preservados.';

-- O pipeline A classificar também precisa ser carregado para que a
-- administração possa decidir sua área. Ele permanece fora dos KPIs porque
-- mantém domain_key = unclassified até receber classificação segura.
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
  v_actor uuid;
  v_is_service_role boolean := coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
  v_run public.hubspot_sync_runs;
  v_domains text[] := case when p_domain_key in ('commercial', 'cs', 'unclassified') then array[p_domain_key] else array['commercial','cs','unclassified'] end;
  v_mode text := case when p_mode in ('full','incremental') then p_mode else 'incremental' end;
  v_after bigint := null;
  v_count integer := 0;
begin
  if not v_is_service_role then v_actor := app_private.require_active_actor(); end if;
  if not v_is_service_role and not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'analytics HubSpot start denied';
  end if;
  perform public.rpc_analytics_hubspot_abandon_stale_runs(900);
  if exists (select 1 from public.hubspot_sync_runs where provider = 'hubspot' and domain_key = 'all' and status in ('queued','running','partial')) then
    raise exception using errcode = 'P0001', message = 'Já existe uma carga HubSpot em andamento.';
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
  where c.is_active and not c.is_archived and c.domain_key = any(v_domains)
  on conflict do nothing;
  insert into public.analytics_cs_sync_work_items(parent_run_id, domain_key, object_type, pipeline_id, pipeline_label, range_start_ms, range_end_ms)
  values (v_run.id, 'shared', 'shared', '*', 'Empresas, owners e catálogo', 0, 4102444800000);
  select count(*)::integer into v_count from public.analytics_cs_sync_work_items where parent_run_id = v_run.id;
  if v_count = 0 then
    update public.hubspot_sync_runs set status='failed', finished_at=timezone('utc',now()), error_code='NO_ACTIVE_HUBSPOT_SOURCES', error_message='Nenhuma fonte ativa do HubSpot foi configurada.' where id=v_run.id;
    raise exception 'Nenhuma fonte ativa do HubSpot foi configurada.';
  end if;
  update public.hubspot_sync_runs set pipelines_total=v_count, source_state='queued' where id=v_run.id;
  return jsonb_build_object('status','queued','run_id',v_run.id,'correlation_id',v_run.correlation_id,'mode',v_mode,'domains',v_domains,'work_items_total',v_count,'source_updated_after_ms',v_after);
end;
$$;

revoke all on function public.rpc_analytics_hubspot_start_run(text, text, uuid) from public, anon;
grant execute on function public.rpc_analytics_hubspot_start_run(text, text, uuid) to authenticated, service_role;

create or replace view public.vw_admin_analytics_sync_history_v1
with (security_barrier = true)
as
select
  r.id as run_id,
  'hubspot'::text as source_key,
  'HubSpot'::text as source_label,
  r.status,
  r.started_at,
  r.finished_at,
  extract(epoch from (coalesce(r.finished_at, timezone('utc', now())) - r.started_at))::bigint * 1000 as duration_ms,
  coalesce(r.records_promoted, r.deals_synced + r.tickets_synced + r.companies_synced + r.owners_synced, 0)::integer as processed_count,
  case when r.status in ('failed', 'error', 'abandoned', 'cancelled', 'partial') then coalesce(r.error_message, 'A atualização não foi concluída.') else null end as error_message,
  r.correlation_id,
  case when r.requested_by is null and r.triggered_by is null then 'automática' else 'manual' end as trigger_kind
from public.hubspot_sync_runs r
where app_private.can_read_analytics()
union all
select
  r.id as run_id,
  'omie'::text as source_key,
  'OMIE'::text as source_label,
  r.status,
  r.started_at,
  r.finished_at,
  extract(epoch from (coalesce(r.finished_at, timezone('utc', now())) - r.started_at))::bigint * 1000 as duration_ms,
  coalesce(r.accepted_rows, 0)::integer as processed_count,
  case when r.status in ('failed', 'abandoned', 'partial', 'empty') then coalesce(r.error_message, 'A atualização não foi concluída.') else null end as error_message,
  r.correlation_id,
  case when r.triggered_by_user_id is null then 'automática' else 'manual' end as trigger_kind
from public.analytics_finance_sync_runs r
where app_private.can_read_analytics();

revoke all on public.vw_admin_analytics_sync_history_v1 from public, anon;
grant select on public.vw_admin_analytics_sync_history_v1 to authenticated, service_role;
