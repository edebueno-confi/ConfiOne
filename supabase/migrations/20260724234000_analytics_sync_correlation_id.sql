-- DASHBOARD-02.1: correlação opcional entre execuções de fontes existentes.
-- Nullable e forward-only: não altera runs históricos nem cria tabela paralela.
alter table public.hubspot_sync_runs
  add column if not exists correlation_id uuid;

alter table public.analytics_finance_sync_runs
  add column if not exists correlation_id uuid;

create index if not exists hubspot_sync_runs_correlation_id_idx
  on public.hubspot_sync_runs (correlation_id)
  where correlation_id is not null;

create index if not exists analytics_finance_sync_runs_correlation_id_idx
  on public.analytics_finance_sync_runs (correlation_id)
  where correlation_id is not null;

comment on column public.hubspot_sync_runs.correlation_id is
  'Correlação opcional do lote entre fontes; não substitui o id da execução.';

comment on column public.analytics_finance_sync_runs.correlation_id is
  'Correlação opcional do lote entre fontes; não substitui o id da execução.';

create or replace view public.vw_analytics_dashboard_sync_status
with (security_barrier = true)
as
select id, domain_key, status, started_at, finished_at,
       deals_synced, tickets_synced, owners_synced, stages_synced,
       companies_synced, error_message, correlation_id
from public.hubspot_sync_runs
where app_private.can_read_analytics();
