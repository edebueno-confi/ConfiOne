-- DASHBOARD-OMIE-CLIENT-INDEX-METRICS-V1
-- Expõe no read model o custo e a frescura do enriquecimento sem expor payload.

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
    then coalesce(r.sanitized_error, 'A atualizacao do OMIE nao foi concluida.')
    else null
  end as error_message,
  r.correlation_id,
  m.request_count,
  m.retry_count as request_retry_count,
  m.rate_limit_count,
  m.provider_error_count,
  m.failed_request_count,
  m.total_duration_ms as request_duration_ms,
  m.last_request_at,
  nullif(r.enrichment->>'cacheSource', '') as enrichment_cache_source,
  nullif(r.enrichment->>'cacheAgeSeconds', '')::integer as enrichment_cache_age_seconds,
  nullif(r.enrichment->>'cacheRows', '')::integer as enrichment_cache_rows
from public.analytics_finance_sync_runs r
left join public.vw_analytics_sync_request_metrics_read m
  on m.provider = 'omie' and m.run_id = r.id
where app_private.can_read_analytics();

revoke all on public.vw_analytics_finance_sync_runs_read from public, anon;
grant select on public.vw_analytics_finance_sync_runs_read to authenticated, service_role;

comment on view public.vw_analytics_finance_sync_runs_read is
  'Read model OMIE com telemetria sanitizada e frescura do cache de enriquecimento de clientes.';
