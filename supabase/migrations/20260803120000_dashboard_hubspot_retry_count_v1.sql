-- DASHBOARD-HUBSPOT-RETRY-COUNT-V1
-- O progresso deve contar apenas tentativas adicionais, e nao a primeira chamada.
-- Migration forward-only; nao altera historico armazenado.

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
  case
    when run.status in ('failed', 'error', 'abandoned', 'timed_out', 'cancelled', 'partial')
      then coalesce(run.sanitized_error, 'A atualização do HubSpot não foi concluída.')
    else null
  end as error_message,
  coalesce(count(item.id) filter (where item.status = 'succeeded'), 0)::integer as completed_items,
  coalesce(count(item.id) filter (where item.status in ('pending', 'leased', 'running', 'retrying')), 0)::integer as active_items,
  coalesce(sum(greatest(item.attempts - 1, 0)), 0)::integer as retries,
  max(item.updated_at) as last_item_activity
from public.hubspot_sync_runs as run
left join public.analytics_cs_sync_work_items as item on item.parent_run_id = run.id
where app_private.can_read_analytics()
group by run.id;

revoke all on public.vw_analytics_hubspot_sync_progress from public, anon;
grant select on public.vw_analytics_hubspot_sync_progress to authenticated, service_role;
