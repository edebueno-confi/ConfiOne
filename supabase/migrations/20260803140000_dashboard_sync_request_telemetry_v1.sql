-- DASHBOARD-SYNC-REQUEST-TELEMETRY-V1
-- Observabilidade sanitizada por tentativa de chamada externa.
-- Não armazena URL com parâmetros, payload, credencial ou resposta do provedor.

create table if not exists public.analytics_sync_request_attempts (
  id uuid primary key default extensions.gen_random_uuid(),
  provider text not null check (provider in ('hubspot', 'omie')),
  hubspot_run_id uuid references public.hubspot_sync_runs(id) on delete cascade,
  omie_run_id uuid references public.analytics_finance_sync_runs(id) on delete cascade,
  cycle_id uuid references public.analytics_sync_cycles(id) on delete set null,
  work_item_id uuid references public.analytics_cs_sync_work_items(id) on delete set null,
  correlation_id uuid,
  endpoint_key text not null,
  http_method text not null default 'POST',
  attempt_number integer not null check (attempt_number > 0),
  status_code integer check (status_code is null or status_code between 100 and 599),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  retry_after_ms integer check (retry_after_ms is null or retry_after_ms >= 0),
  page_number integer check (page_number is null or page_number >= 1),
  error_code text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint analytics_sync_request_attempts_provider_run_check check (
    (provider = 'hubspot' and hubspot_run_id is not null and omie_run_id is null)
    or (provider = 'omie' and omie_run_id is not null and hubspot_run_id is null)
  )
);

comment on table public.analytics_sync_request_attempts is
  'Telemetria sanitizada de tentativas externas do Analytics; nunca guarda URL completa, payload, resposta ou credencial.';

create index if not exists analytics_sync_request_attempts_hubspot_idx
  on public.analytics_sync_request_attempts (hubspot_run_id, created_at);
create index if not exists analytics_sync_request_attempts_omie_idx
  on public.analytics_sync_request_attempts (omie_run_id, created_at);
create index if not exists analytics_sync_request_attempts_provider_created_idx
  on public.analytics_sync_request_attempts (provider, created_at desc);

alter table public.analytics_sync_request_attempts enable row level security;
revoke all on public.analytics_sync_request_attempts from public, anon, authenticated;
grant insert on public.analytics_sync_request_attempts to service_role;

create or replace view public.vw_analytics_sync_request_metrics_read
with (security_barrier = true)
as
select
  'hubspot'::text as provider,
  hubspot_run_id as run_id,
  count(*)::integer as request_count,
  count(*) filter (where attempt_number > 1)::integer as retry_count,
  count(*) filter (where status_code = 429)::integer as rate_limit_count,
  count(*) filter (where status_code >= 500)::integer as provider_error_count,
  count(*) filter (where status_code is null or status_code >= 400)::integer as failed_request_count,
  coalesce(sum(duration_ms), 0)::bigint as total_duration_ms,
  max(created_at) as last_request_at
from public.analytics_sync_request_attempts
where hubspot_run_id is not null
  and app_private.can_read_analytics()
group by hubspot_run_id
union all
select
  'omie'::text as provider,
  omie_run_id as run_id,
  count(*)::integer as request_count,
  count(*) filter (where attempt_number > 1)::integer as retry_count,
  count(*) filter (where status_code = 429)::integer as rate_limit_count,
  count(*) filter (where status_code >= 500)::integer as provider_error_count,
  count(*) filter (where status_code is null or status_code >= 400)::integer as failed_request_count,
  coalesce(sum(duration_ms), 0)::bigint as total_duration_ms,
  max(created_at) as last_request_at
from public.analytics_sync_request_attempts
where omie_run_id is not null
  and app_private.can_read_analytics()
group by omie_run_id;

revoke all on public.vw_analytics_sync_request_metrics_read from public, anon;
grant select on public.vw_analytics_sync_request_metrics_read to authenticated, service_role;
comment on view public.vw_analytics_sync_request_metrics_read is
  'Read model agregado de carga externa por execução; sem payload, URL completa ou segredo.';
