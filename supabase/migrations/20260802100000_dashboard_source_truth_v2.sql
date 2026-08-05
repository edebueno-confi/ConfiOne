-- DASHBOARD-TRUTH-V2: uma leitura única e explícita do estado das fontes.
-- Não remove histórico. Desativa somente as configurações legadas de planilha
-- e publica um read model sanitizado para HubSpot e OMIE.

update public.managed_integrations
set is_enabled = false,
    updated_at = timezone('utc', now())
where integration_key in ('cs_spreadsheet', 'commercial_spreadsheet')
  and provider in ('google_sheets', 'spreadsheet_upload');

create or replace function public.rpc_analytics_source_status()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with integrations as (
  select integration_key, is_enabled, credential_secret_id is not null as has_credentials
  from public.managed_integrations
  where integration_key in ('hubspot', 'omie')
), hubspot_run as (
  select r.* from public.hubspot_sync_runs r order by r.started_at desc limit 1
), omie_run as (
  select r.* from public.analytics_finance_sync_runs r order by r.started_at desc limit 1
), raw as (
  select 'hubspot'::text as key, 'HubSpot'::text as label, 'hubspot'::text as origin,
    i.is_enabled and i.has_credentials as configured, r.id::text as run_id,
    coalesce(r.finished_at, r.started_at) as last_attempt_at,
    case when r.status = 'success' then r.finished_at else null end as last_success_at,
    case when r.finished_at is not null then extract(epoch from (r.finished_at - r.started_at)) * 1000 else null end as duration_ms,
    coalesce(r.records_promoted, r.records_normalized, 0)::integer as processed_count,
    r.status as run_status
  from integrations i left join hubspot_run r on true where i.integration_key = 'hubspot'
  union all
  select 'omie', 'OMIE', 'omie', i.is_enabled and i.has_credentials, r.id::text,
    coalesce(r.finished_at, r.started_at),
    case when r.status = 'completed' then r.finished_at else null end,
    case when r.finished_at is not null then extract(epoch from (r.finished_at - r.started_at)) * 1000 else null end,
    coalesce(r.accepted_rows, 0)::integer, r.status
  from integrations i left join omie_run r on true where i.integration_key = 'omie'
), states as (
  select key, label, origin, run_id, last_attempt_at, last_success_at, duration_ms, processed_count,
    case
      when not configured then 'unavailable'
      when run_status in ('running', 'queued', 'processing') then 'syncing'
      when run_status is null then 'never_synced'
      when run_status in ('partial', 'empty') then 'partial'
      when run_status in ('error', 'failed', 'abandoned') then 'failed'
      when last_success_at is not null and last_success_at < timezone('utc', now()) - interval '24 hours' then 'stale'
      when last_success_at is not null then 'fresh'
      else 'failed'
    end::text as status
  from raw
), payload as (
  select key, label, origin, status, last_attempt_at, last_success_at, duration_ms, processed_count,
    case when status = 'failed' then case when key = 'omie' then 'A sincronização OMIE não foi concluída.' else 'A última sincronização HubSpot falhou.' end else null end as error,
    case when last_success_at is null then null else greatest(0, floor(extract(epoch from (timezone('utc', now()) - last_success_at)) / 60))::integer end as freshness_minutes,
    run_id
  from states
), normalized as (
  select jsonb_object_agg(key, jsonb_build_object(
    'key', key, 'label', label, 'status', status,
    'lastAttemptAt', last_attempt_at, 'lastSuccessAt', last_success_at,
    'durationMs', duration_ms, 'processedCount', processed_count,
    'error', error, 'freshnessMinutes', freshness_minutes,
    'runId', run_id, 'origin', origin
  )) as sources from payload
)
select case when app_private.can_read_analytics() then
  (select sources from normalized) || jsonb_build_object(
    'globalStatus', case
      when exists (select 1 from payload where status = 'syncing') then 'syncing'
      when exists (select 1 from payload where status = 'failed') then 'failed'
      when exists (select 1 from payload where status = 'unavailable') then 'unavailable'
      when exists (select 1 from payload where status in ('never_synced', 'partial', 'stale')) then 'partial'
      else 'fresh'
    end
  )
else '{}'::jsonb end;
$$;

revoke all on function public.rpc_analytics_source_status() from public, anon;
grant execute on function public.rpc_analytics_source_status() to authenticated, service_role;

comment on function public.rpc_analytics_source_status() is
  'Read model sanitizado de frescor e resultado das únicas fontes publicadas do Dashboard: HubSpot e OMIE.';
