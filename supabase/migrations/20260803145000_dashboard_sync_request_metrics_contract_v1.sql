-- DASHBOARD-SYNC-REQUEST-METRICS-CONTRACT-V1
-- Publica somente agregados sanitizados da telemetria por execução.

create or replace view public.vw_analytics_finance_sync_runs_read
with (security_barrier = true)
as
select
  r.id,
  r.source_key,
  r.status,
  r.total_rows,
  r.accepted_rows,
  r.rejected_rows,
  r.started_at,
  r.finished_at,
  case when r.status in ('failed', 'abandoned', 'timed_out', 'cancelled', 'partial')
    then coalesce(r.sanitized_error, 'A atualização do OMIE não foi concluída.')
    else null
  end as error_message,
  r.correlation_id,
  m.request_count,
  m.retry_count as request_retry_count,
  m.rate_limit_count,
  m.provider_error_count,
  m.failed_request_count,
  m.total_duration_ms as request_duration_ms,
  m.last_request_at
from public.analytics_finance_sync_runs r
left join public.vw_analytics_sync_request_metrics_read m
  on m.provider = 'omie' and m.run_id = r.id
where app_private.can_read_analytics();

revoke all on public.vw_analytics_finance_sync_runs_read from public, anon;
grant select on public.vw_analytics_finance_sync_runs_read to authenticated, service_role;

create or replace view public.vw_analytics_dashboard_sync_status
with (security_barrier = true)
as
select
  r.id, r.domain_key, r.status, r.started_at, r.finished_at,
  r.deals_synced, r.tickets_synced, r.owners_synced, r.stages_synced,
  r.companies_synced,
  case when r.status in ('error', 'failed', 'abandoned', 'timed_out', 'cancelled', 'partial')
    then coalesce(r.sanitized_error, 'A atualização do HubSpot não foi concluída.')
    else null
  end as error_message,
  r.correlation_id,
  r.source_total, r.source_records_received, r.source_pages,
  r.source_pagination_complete, r.source_state, r.watermark_advanced,
  r.provider, r.mode, r.heartbeat_at, r.records_normalized, r.records_accepted,
  r.records_rejected, r.records_promoted, r.pipelines_total, r.pipelines_completed,
  r.error_code,
  m.request_count,
  m.retry_count as request_retry_count,
  m.rate_limit_count,
  m.provider_error_count,
  m.failed_request_count,
  m.total_duration_ms as request_duration_ms,
  m.last_request_at
from public.hubspot_sync_runs r
left join public.vw_analytics_sync_request_metrics_read m
  on m.provider = 'hubspot' and m.run_id = r.id
where app_private.can_read_analytics();

revoke all on public.vw_analytics_dashboard_sync_status from public, anon;
grant select on public.vw_analytics_dashboard_sync_status to authenticated, service_role;
