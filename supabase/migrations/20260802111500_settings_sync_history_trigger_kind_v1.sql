-- Ajuste forward-only do rótulo persistido no read model de histórico.
-- A interface traduz o valor para a linguagem operacional; o contrato usa
-- valores estáveis em inglês para não depender de copy.

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
  case when r.requested_by is null and r.triggered_by is null then 'automatic' else 'manual' end as trigger_kind
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
  case when r.triggered_by_user_id is null then 'automatic' else 'manual' end as trigger_kind
from public.analytics_finance_sync_runs r
where app_private.can_read_analytics();

revoke all on public.vw_admin_analytics_sync_history_v1 from public, anon;
grant select on public.vw_admin_analytics_sync_history_v1 to authenticated, service_role;
