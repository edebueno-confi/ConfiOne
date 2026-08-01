create or replace view public.vw_analytics_dashboard_sync_status
with (security_barrier = true)
as
select id, domain_key, status, started_at, finished_at,
       deals_synced, tickets_synced, owners_synced, stages_synced,
       companies_synced,
       case when status = 'error' then 'A sincronizacao nao foi concluida.' else null end as error_message,
       correlation_id,
       source_total, source_records_received, source_pages,
       source_pagination_complete, source_state, watermark_advanced
from public.hubspot_sync_runs
where app_private.can_read_analytics();

revoke all on public.vw_analytics_dashboard_sync_status from public, anon;
grant select on public.vw_analytics_dashboard_sync_status to authenticated;
