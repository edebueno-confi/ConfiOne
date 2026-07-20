-- Analytics/Dashboard Gerencial: fundacao de dados sincronizados do HubSpot.
-- Escopo v1: Comercial (Deals - pipeline Aftersale) e CS/Suporte (Tickets).
-- Principios:
--   * IDs de pipeline sao configuracao (analytics_source_config), nunca hardcode.
--   * Tabelas locais alimentadas por Edge Function (service role). Leitura read-only
--     restrita a platform_admin. Multi-tenant do SaaS nao se aplica aqui: os dados
--     do HubSpot sao globais da operacao, entao o gate e por papel global.
--   * Fetch (Edge Function) e agregacao (views) ficam desacoplados: esta migration
--     nao contem regra de metrica, apenas o modelo de dados.

-- ---------------------------------------------------------------------------
-- Configuracao de fontes (adapter por dominio)
-- ---------------------------------------------------------------------------
create table public.analytics_source_config (
  id uuid primary key default extensions.gen_random_uuid(),
  domain_key text not null,
  object_type text not null check (object_type in ('deal', 'ticket')),
  hubspot_pipeline_id text not null,
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (domain_key, object_type)
);

comment on table public.analytics_source_config is
  'Configuracao por dominio das fontes HubSpot do modulo Analytics. Um registro por (dominio, tipo de objeto). Pipeline IDs sao parametros de ambiente, nao valores fixos no codigo.';

create trigger analytics_source_config_set_updated_at
before update on public.analytics_source_config
for each row
execute function app_private.touch_updated_at();

-- Seed inicial confirmado neste portal HubSpot (outro portal/ambiente sobrescreve).
insert into public.analytics_source_config (domain_key, object_type, hubspot_pipeline_id, label)
values
  ('commercial', 'deal', '892833861', 'Comercial Aftersale'),
  ('cs', 'ticket', '5034314', 'Suporte')
on conflict (domain_key, object_type) do nothing;

-- ---------------------------------------------------------------------------
-- Owners (responsaveis) resolvidos via GET /crm/v3/owners
-- ---------------------------------------------------------------------------
create table public.hubspot_owners (
  owner_id text primary key,
  email text,
  first_name text,
  last_name text,
  full_name text,
  archived boolean not null default false,
  raw jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default timezone('utc', now())
);

comment on table public.hubspot_owners is
  'Cache de owners do HubSpot para resolver hubspot_owner_id em nome legivel no dashboard.';

-- ---------------------------------------------------------------------------
-- Estagios de pipeline (deals e tickets) via GET /crm/v3/pipelines/{obj}/{id}
-- Rotulos e ordem vem da API, nunca de parsing de string.
-- ---------------------------------------------------------------------------
create table public.hubspot_pipeline_stages (
  id uuid primary key default extensions.gen_random_uuid(),
  object_type text not null check (object_type in ('deal', 'ticket')),
  pipeline_id text not null,
  stage_id text not null,
  label text not null,
  display_order integer not null default 0,
  is_closed boolean not null default false,
  is_won boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default timezone('utc', now()),
  unique (object_type, pipeline_id, stage_id)
);

comment on table public.hubspot_pipeline_stages is
  'Estagios de pipeline resolvidos da API do HubSpot. is_won/is_closed derivados dos metadados do estagio (deals: isClosed/probability; tickets: ticketState).';

create index hubspot_pipeline_stages_lookup_idx
  on public.hubspot_pipeline_stages (object_type, pipeline_id, stage_id);

-- ---------------------------------------------------------------------------
-- Deals (Comercial). Somente campos confiaveis hoje.
-- ---------------------------------------------------------------------------
create table public.hubspot_deals (
  deal_id text primary key,
  pipeline_id text not null,
  dealstage text,
  owner_id text,
  amount_home numeric,
  dealtype text,
  deal_name text,
  hs_created_at timestamptz,
  hs_closed_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default timezone('utc', now())
);

comment on table public.hubspot_deals is
  'Deals sincronizados do HubSpot filtrados pelo pipeline configurado. amount_home = amount_in_home_currency (multi-moeda). Campos customizados (mrr_*, sdr/closer/bdr owner, motivo de perda) ficam de fora da v1 por estarem vazios no portal.';

create index hubspot_deals_pipeline_idx on public.hubspot_deals (pipeline_id);
create index hubspot_deals_stage_idx on public.hubspot_deals (pipeline_id, dealstage);
create index hubspot_deals_owner_idx on public.hubspot_deals (owner_id);
create index hubspot_deals_created_idx on public.hubspot_deals (hs_created_at);

-- ---------------------------------------------------------------------------
-- Tickets (CS/Suporte). Somente campos confiaveis hoje.
-- ---------------------------------------------------------------------------
create table public.hubspot_tickets (
  ticket_id text primary key,
  pipeline_id text not null,
  pipeline_stage text,
  source_type text,
  priority text,
  hs_created_at timestamptz,
  hs_closed_at timestamptz,
  time_to_first_response_sla_status text,
  time_to_close_sla_status text,
  raw jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default timezone('utc', now())
);

comment on table public.hubspot_tickets is
  'Tickets sincronizados do HubSpot filtrados pelo hs_pipeline configurado. Campos SLA sao parciais hoje e servem de base para metricas futuras.';

create index hubspot_tickets_pipeline_idx on public.hubspot_tickets (pipeline_id);
create index hubspot_tickets_stage_idx on public.hubspot_tickets (pipeline_id, pipeline_stage);
create index hubspot_tickets_created_idx on public.hubspot_tickets (hs_created_at);

-- ---------------------------------------------------------------------------
-- Registro de execucoes de sincronizacao (observabilidade)
-- ---------------------------------------------------------------------------
create table public.hubspot_sync_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  domain_key text,
  status text not null default 'running' check (status in ('running', 'success', 'error')),
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  deals_synced integer not null default 0,
  tickets_synced integer not null default 0,
  owners_synced integer not null default 0,
  stages_synced integer not null default 0,
  error_message text,
  triggered_by uuid
);

comment on table public.hubspot_sync_runs is
  'Historico de execucoes da Edge Function hubspot-sync. Alimenta status "ultima sincronizacao" no dashboard.';

create index hubspot_sync_runs_started_idx on public.hubspot_sync_runs (started_at desc);

-- ---------------------------------------------------------------------------
-- Gate de leitura do modulo Analytics (papel global platform_admin)
-- ---------------------------------------------------------------------------
create or replace function app_private.can_read_analytics()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.has_global_role('platform_admin'::public.platform_role);
$$;

comment on function app_private.can_read_analytics() is
  'Gate read-only do modulo Analytics/Dashboard Gerencial. v1: apenas platform_admin.';

revoke all on function app_private.can_read_analytics() from public, anon, authenticated, service_role;
grant execute on function app_private.can_read_analytics() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS: negacao por padrao. Leitura via platform_admin; escrita apenas service role.
-- As tabelas nao sao expostas diretamente ao PostgREST (sem grant a authenticated);
-- o dashboard le pelas views vw_analytics_* (proxima migration).
-- ---------------------------------------------------------------------------
alter table public.analytics_source_config enable row level security;
alter table public.hubspot_owners enable row level security;
alter table public.hubspot_pipeline_stages enable row level security;
alter table public.hubspot_deals enable row level security;
alter table public.hubspot_tickets enable row level security;
alter table public.hubspot_sync_runs enable row level security;

create policy analytics_source_config_admin_read on public.analytics_source_config
  for select to authenticated using (app_private.can_read_analytics());
create policy hubspot_owners_admin_read on public.hubspot_owners
  for select to authenticated using (app_private.can_read_analytics());
create policy hubspot_pipeline_stages_admin_read on public.hubspot_pipeline_stages
  for select to authenticated using (app_private.can_read_analytics());
create policy hubspot_deals_admin_read on public.hubspot_deals
  for select to authenticated using (app_private.can_read_analytics());
create policy hubspot_tickets_admin_read on public.hubspot_tickets
  for select to authenticated using (app_private.can_read_analytics());
create policy hubspot_sync_runs_admin_read on public.hubspot_sync_runs
  for select to authenticated using (app_private.can_read_analytics());

revoke all on public.analytics_source_config from public, anon;
revoke all on public.hubspot_owners from public, anon;
revoke all on public.hubspot_pipeline_stages from public, anon;
revoke all on public.hubspot_deals from public, anon;
revoke all on public.hubspot_tickets from public, anon;
revoke all on public.hubspot_sync_runs from public, anon;

grant select on public.analytics_source_config to authenticated;
grant select on public.hubspot_sync_runs to authenticated;
