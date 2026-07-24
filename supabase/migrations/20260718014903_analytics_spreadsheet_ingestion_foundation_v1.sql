-- Analytics A1: fundacao de ingestao controlada de CSV/XLSX.
-- O lote nao implementa upload, parser ou dashboard. Ele cria apenas o
-- contrato persistente para registrar fonte, importacao e linhas de staging.
-- Escrita operacional futura deve ocorrer por Edge Function/service_role.

create table public.analytics_spreadsheet_sources (
  id uuid primary key default extensions.gen_random_uuid(),
  source_key text not null unique,
  label text not null,
  source_type text not null check (source_type in ('csv', 'xlsx')),
  mapping_version text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references auth.users (id) on delete set null
);

comment on table public.analytics_spreadsheet_sources is
  'Fontes de planilha autorizadas para o Analytics. V1 aceita importacao controlada de CSV/XLSX; Google Sheets fica fora deste contrato.';

create table public.analytics_spreadsheet_import_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  source_id uuid not null references public.analytics_spreadsheet_sources (id),
  status text not null default 'received'
    check (status in ('received', 'processing', 'completed', 'partial', 'failed')),
  original_filename text not null,
  file_sha256 text not null check (file_sha256 ~ '^[0-9a-fA-F]{64}$'),
  file_size_bytes bigint not null check (file_size_bytes >= 0),
  storage_path text,
  mapping_version text not null,
  started_at timestamptz,
  finished_at timestamptz,
  total_rows integer not null default 0 check (total_rows >= 0),
  accepted_rows integer not null default 0 check (accepted_rows >= 0),
  rejected_rows integer not null default 0 check (rejected_rows >= 0),
  error_message text,
  triggered_by_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  check (accepted_rows + rejected_rows <= total_rows),
  check (finished_at is null or started_at is null or finished_at >= started_at)
);

comment on table public.analytics_spreadsheet_import_runs is
  'Registro idempotente e auditavel de cada importacao de planilha no Analytics, incluindo hash, mapeamento, frescor e qualidade.';

create index analytics_spreadsheet_import_runs_source_started_idx
  on public.analytics_spreadsheet_import_runs (source_id, created_at desc);

create unique index analytics_spreadsheet_import_runs_source_hash_idx
  on public.analytics_spreadsheet_import_runs (source_id, file_sha256, mapping_version);

create table public.analytics_spreadsheet_rows (
  id uuid primary key default extensions.gen_random_uuid(),
  import_run_id uuid not null references public.analytics_spreadsheet_import_runs (id) on delete cascade,
  sheet_name text not null default '',
  row_number integer not null check (row_number > 0),
  external_row_key text,
  source_record_id text,
  payload jsonb not null default '{}'::jsonb,
  quality_status text not null default 'valid'
    check (quality_status in ('valid', 'partial', 'rejected')),
  rejection_reason text,
  effective_at timestamptz,
  ingested_at timestamptz not null default timezone('utc', now()),
  unique (import_run_id, sheet_name, row_number)
);

comment on table public.analytics_spreadsheet_rows is
  'Staging de linhas de CSV/XLSX. Payload permanece bruto e não é contrato de métrica até passar por mapeamento e validação.';

create index analytics_spreadsheet_rows_import_quality_idx
  on public.analytics_spreadsheet_rows (import_run_id, quality_status);

alter table public.analytics_spreadsheet_sources enable row level security;
alter table public.analytics_spreadsheet_import_runs enable row level security;
alter table public.analytics_spreadsheet_rows enable row level security;

create policy analytics_spreadsheet_sources_admin_read
on public.analytics_spreadsheet_sources
for select to authenticated
using (app_private.can_read_analytics());

create policy analytics_spreadsheet_import_runs_admin_read
on public.analytics_spreadsheet_import_runs
for select to authenticated
using (app_private.can_read_analytics());

-- Linhas brutas não são expostas ao frontend nesta fase; leitura futura deverá
-- ocorrer por contrato sanitizado e somente após a validação do mapeamento.

revoke all on public.analytics_spreadsheet_sources from public, anon;
revoke all on public.analytics_spreadsheet_import_runs from public, anon;
revoke all on public.analytics_spreadsheet_rows from public, anon, authenticated;

grant select on public.analytics_spreadsheet_sources to authenticated, service_role;
grant select on public.analytics_spreadsheet_import_runs to authenticated, service_role;
grant select, insert, update on public.analytics_spreadsheet_sources to service_role;
grant select, insert, update on public.analytics_spreadsheet_import_runs to service_role;
grant select, insert, update on public.analytics_spreadsheet_rows to service_role;

create trigger analytics_spreadsheet_sources_touch_updated_at
before update on public.analytics_spreadsheet_sources
for each row
execute function app_private.touch_updated_at();

create trigger analytics_spreadsheet_sources_audit_row_change
after insert or update or delete on public.analytics_spreadsheet_sources
for each row
execute function audit.capture_row_change();

create trigger analytics_spreadsheet_import_runs_audit_row_change
after insert or update or delete on public.analytics_spreadsheet_import_runs
for each row
execute function audit.capture_row_change();

create trigger analytics_spreadsheet_rows_audit_row_change
after insert or update or delete on public.analytics_spreadsheet_rows
for each row
execute function audit.capture_row_change();
