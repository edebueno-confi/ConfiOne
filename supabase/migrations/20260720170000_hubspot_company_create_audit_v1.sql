-- Auditoria da criacao governada de empresas no HubSpot a partir de clientes
-- OMIE sem correspondencia. Toda tentativa (criada, ignorada por duplicidade ou
-- falha) e registrada. A criacao real e gated (confirmacao + platform_admin) na
-- Edge Function hubspot-company-create.

create table public.analytics_hubspot_company_create_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  requested_by_user_id uuid references auth.users(id) on delete set null,
  source_client_name text not null,
  source_tax_id text,
  action text not null check (action in ('created', 'skipped_cnpj_exists', 'skipped_name_conflict', 'failed')),
  hubspot_company_id text,
  name_match_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz
);

create index analytics_hubspot_company_create_runs_created_idx
  on public.analytics_hubspot_company_create_runs (created_at desc);

alter table public.analytics_hubspot_company_create_runs enable row level security;
create policy analytics_hubspot_company_create_runs_read
on public.analytics_hubspot_company_create_runs for select to authenticated
using (app_private.can_read_analytics());

revoke all on public.analytics_hubspot_company_create_runs from public, anon;
grant select on public.analytics_hubspot_company_create_runs to authenticated, service_role;
grant insert, update on public.analytics_hubspot_company_create_runs to service_role;

create trigger analytics_hubspot_company_create_runs_audit_row_change
after insert or update or delete on public.analytics_hubspot_company_create_runs
for each row execute function audit.capture_row_change();
