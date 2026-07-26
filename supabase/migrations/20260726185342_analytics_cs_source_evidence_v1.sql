alter table public.hubspot_sync_runs
  drop constraint if exists hubspot_sync_runs_status_check;

alter table public.hubspot_sync_runs
  add constraint hubspot_sync_runs_status_check
  check (status in ('running', 'success', 'partial', 'error'));

alter table public.hubspot_sync_runs
  add column if not exists source_total integer,
  add column if not exists source_records_received integer not null default 0,
  add column if not exists source_pages integer not null default 0,
  add column if not exists source_pagination_complete boolean not null default false,
  add column if not exists source_state text,
  add column if not exists watermark_advanced boolean not null default false;

alter table public.hubspot_sync_runs
  add constraint hubspot_sync_runs_source_state_check
  check (source_state is null or source_state in ('empty_authoritative', 'empty_unverified', 'failed', 'partial', 'complete'));

comment on column public.hubspot_sync_runs.source_total is
  'Total autoritativo informado pela origem para o escopo consultado, quando disponível.';
comment on column public.hubspot_sync_runs.source_state is
  'Classificação da evidência de origem; legado success/0 permanece sem estado e não pode criar watermark incremental.';
