-- Ledger da migração controlada da planilha CS Ops para empresas HubSpot.
-- O ledger separa simulação de aplicação, preserva a procedência por linha e
-- impede que uma mesma linha seja aplicada duas vezes no mesmo lote de origem.

create table public.analytics_hubspot_cs_migration_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  source_import_run_id uuid not null references public.analytics_spreadsheet_import_runs (id),
  mode text not null check (mode in ('dry_run', 'apply')),
  status text not null default 'requested'
    check (status in ('requested', 'running', 'completed', 'partial', 'failed')),
  requested_by_user_id uuid not null references auth.users (id),
  total_rows integer not null default 0 check (total_rows >= 0),
  planned_rows integer not null default 0 check (planned_rows >= 0),
  ambiguous_rows integer not null default 0 check (ambiguous_rows >= 0),
  create_rows integer not null default 0 check (create_rows >= 0),
  update_rows integer not null default 0 check (update_rows >= 0),
  skipped_rows integer not null default 0 check (skipped_rows >= 0),
  failed_rows integer not null default 0 check (failed_rows >= 0),
  error_message text,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index analytics_hubspot_cs_migration_runs_source_idx
  on public.analytics_hubspot_cs_migration_runs (source_import_run_id, created_at desc);

create table public.analytics_hubspot_cs_migration_items (
  id uuid primary key default extensions.gen_random_uuid(),
  migration_run_id uuid not null references public.analytics_hubspot_cs_migration_runs (id) on delete cascade,
  source_import_run_id uuid not null references public.analytics_spreadsheet_import_runs (id) on delete cascade,
  sheet_row integer not null check (sheet_row > 0),
  source_record_id text not null,
  status text not null check (status in ('planned', 'updated', 'created', 'skipped', 'ambiguous', 'failed')),
  match_method text,
  hubspot_company_id text,
  candidate_company_ids jsonb not null default '[]'::jsonb,
  source_payload jsonb not null default '{}'::jsonb,
  hubspot_before jsonb,
  hubspot_after jsonb,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (migration_run_id, source_record_id)
);

create index analytics_hubspot_cs_migration_items_source_idx
  on public.analytics_hubspot_cs_migration_items (source_import_run_id, source_record_id, status);

create index analytics_hubspot_cs_migration_items_status_idx
  on public.analytics_hubspot_cs_migration_items (migration_run_id, status);

alter table public.analytics_hubspot_cs_migration_runs enable row level security;
alter table public.analytics_hubspot_cs_migration_items enable row level security;

create policy analytics_hubspot_cs_migration_runs_admin_read
on public.analytics_hubspot_cs_migration_runs
for select to authenticated
using (app_private.has_global_role('platform_admin'::public.platform_role));

create policy analytics_hubspot_cs_migration_items_admin_read
on public.analytics_hubspot_cs_migration_items
for select to authenticated
using (app_private.has_global_role('platform_admin'::public.platform_role));

revoke all on public.analytics_hubspot_cs_migration_runs from public, anon;
revoke all on public.analytics_hubspot_cs_migration_items from public, anon;
grant select on public.analytics_hubspot_cs_migration_runs to authenticated, service_role;
grant select on public.analytics_hubspot_cs_migration_items to authenticated, service_role;
grant insert, update on public.analytics_hubspot_cs_migration_runs to service_role;
grant insert, update on public.analytics_hubspot_cs_migration_items to service_role;

create trigger analytics_hubspot_cs_migration_runs_audit_row_change
after insert or update on public.analytics_hubspot_cs_migration_runs
for each row execute function audit.capture_row_change();

create trigger analytics_hubspot_cs_migration_items_audit_row_change
after insert or update on public.analytics_hubspot_cs_migration_items
for each row execute function audit.capture_row_change();

comment on table public.analytics_hubspot_cs_migration_runs is
  'Lotes simulados ou aplicados de migração CS Ops para empresas HubSpot, com contagens e operador.';

comment on table public.analytics_hubspot_cs_migration_items is
  'Resultado auditável por linha da planilha CS Ops; ambiguidades nunca são aplicadas automaticamente.';
