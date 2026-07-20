-- Empresas HubSpot para reconciliação financeira e visão executiva.
-- Escopo read-only: não altera empresas, pipelines ou tickets no HubSpot.

create table public.hubspot_companies (
  company_id text primary key,
  name text,
  domain text,
  tax_id text,
  mrr numeric(18, 2),
  client_status text,
  contract_status text,
  cs_owner_id text,
  raw jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default timezone('utc', now())
);

create index hubspot_companies_tax_id_idx on public.hubspot_companies (tax_id);
create index hubspot_companies_name_idx on public.hubspot_companies (name);
create index hubspot_companies_owner_idx on public.hubspot_companies (cs_owner_id);

comment on table public.hubspot_companies is
  'Cache read-only de empresas HubSpot usado para reconciliar Contas a Receber OMIE e compor alertas executivos.';

alter table public.hubspot_companies enable row level security;
create policy hubspot_companies_admin_read on public.hubspot_companies
  for select to authenticated using (app_private.can_read_analytics());
revoke all on public.hubspot_companies from public, anon;
grant select on public.hubspot_companies to authenticated, service_role;
grant insert, update, delete on public.hubspot_companies to service_role;

create trigger hubspot_companies_audit_row_change
after insert or update or delete on public.hubspot_companies
for each row execute function audit.capture_row_change();

alter table public.hubspot_sync_runs add column if not exists companies_synced integer not null default 0;

comment on column public.hubspot_sync_runs.companies_synced is
  'Quantidade de empresas HubSpot atualizadas no cache de reconciliação.';
