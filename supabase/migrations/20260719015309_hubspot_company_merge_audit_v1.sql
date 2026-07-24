create table public.analytics_hubspot_merge_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  primary_company_id text not null,
  merged_company_id text not null,
  requested_by_user_id uuid not null references auth.users(id),
  status text not null check (status in ('requested', 'running', 'succeeded', 'failed', 'dry_run')),
  reason text,
  hubspot_result jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  check (primary_company_id <> merged_company_id)
);

create index analytics_hubspot_merge_runs_created_idx
  on public.analytics_hubspot_merge_runs (created_at desc);

create index analytics_hubspot_merge_runs_company_idx
  on public.analytics_hubspot_merge_runs (primary_company_id, merged_company_id);

alter table public.analytics_hubspot_merge_runs enable row level security;

create policy analytics_hubspot_merge_runs_admin_read
on public.analytics_hubspot_merge_runs
for select to authenticated
using (app_private.has_global_role('platform_admin'::public.platform_role));

revoke all on public.analytics_hubspot_merge_runs from public, anon;
grant select on public.analytics_hubspot_merge_runs to authenticated, service_role;
grant insert, update on public.analytics_hubspot_merge_runs to service_role;

create trigger analytics_hubspot_merge_runs_audit_row_change
after insert or update on public.analytics_hubspot_merge_runs
for each row execute function audit.capture_row_change();

comment on table public.analytics_hubspot_merge_runs is
  'Auditoria de merges de empresas HubSpot solicitados pelo Dashboard Gerencial; escrita somente pela Edge Function autorizada.';
