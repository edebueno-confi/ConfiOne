-- Configuração administrativa de integrações e credenciais server-side.
-- Segredos são armazenados no Supabase Vault; a UI recebe apenas has_secret.

create extension if not exists supabase_vault with schema vault;

create table public.managed_integrations (
  id uuid primary key default extensions.gen_random_uuid(),
  integration_key text not null unique,
  label text not null,
  provider text not null check (provider in ('hubspot', 'omie', 'google_sheets', 'spreadsheet_upload', 'github')),
  mode text not null default 'manual' check (mode in ('api', 'manual', 'hybrid')),
  is_enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  credential_secret_id uuid,
  credential_updated_at timestamptz,
  last_run_at timestamptz,
  last_run_status text check (last_run_status is null or last_run_status in ('success', 'partial', 'error', 'never')),
  last_error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid references auth.users(id) on delete set null,
  updated_by_user_id uuid references auth.users(id) on delete set null
);

comment on table public.managed_integrations is
  'Configuração não sensível e referência de segredo das integrações gerenciais. O valor do segredo existe somente no Vault.';

alter table public.managed_integrations enable row level security;

create policy managed_integrations_admin_read
on public.managed_integrations
for select to authenticated
using (app_private.can_read_analytics());

revoke all on public.managed_integrations from public, anon, authenticated;
grant select on public.managed_integrations to authenticated, service_role;
grant select, insert, update on public.managed_integrations to service_role;

create or replace view public.vw_admin_managed_integrations
with (security_invoker = true)
as
select
  id,
  integration_key,
  label,
  provider,
  mode,
  is_enabled,
  config,
  credential_secret_id is not null as has_credentials,
  credential_updated_at,
  last_run_at,
  coalesce(last_run_status, 'never') as last_run_status,
  last_error_message,
  updated_at
from public.managed_integrations
where app_private.can_read_analytics();

revoke all on public.vw_admin_managed_integrations from public, anon;
grant select on public.vw_admin_managed_integrations to authenticated, service_role;

create or replace function public.rpc_admin_upsert_managed_integration(
  p_integration_key text,
  p_label text,
  p_provider text,
  p_mode text,
  p_is_enabled boolean,
  p_config jsonb default '{}'::jsonb,
  p_secret text default null
)
returns public.vw_admin_managed_integrations
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  existing public.managed_integrations;
  saved public.managed_integrations;
  secret_id uuid;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if nullif(trim(p_integration_key), '') is null
     or nullif(trim(p_label), '') is null
     or p_provider not in ('hubspot', 'omie', 'google_sheets', 'spreadsheet_upload', 'github')
     or p_mode not in ('api', 'manual', 'hybrid') then
    raise exception 'Configuração de integração inválida.' using errcode = '22023';
  end if;

  select * into existing
  from public.managed_integrations
  where integration_key = trim(p_integration_key)
  for update;

  secret_id := existing.credential_secret_id;
  if nullif(trim(coalesce(p_secret, '')), '') is not null then
    if secret_id is null then
      secret_id := vault.create_secret(trim(p_secret), 'gso_' || trim(p_integration_key), p_label);
    else
      perform vault.update_secret(secret_id, trim(p_secret), 'gso_' || trim(p_integration_key), p_label);
    end if;
  end if;

  insert into public.managed_integrations (
    integration_key, label, provider, mode, is_enabled, config,
    credential_secret_id, credential_updated_at, created_by_user_id,
    updated_by_user_id
  ) values (
    trim(p_integration_key), trim(p_label), p_provider, p_mode, coalesce(p_is_enabled, false),
    coalesce(p_config, '{}'::jsonb), secret_id,
    case when nullif(trim(coalesce(p_secret, '')), '') is not null then timezone('utc', now()) else existing.credential_updated_at end,
    actor, actor
  )
  on conflict (integration_key) do update set
    label = excluded.label,
    provider = excluded.provider,
    mode = excluded.mode,
    is_enabled = excluded.is_enabled,
    config = excluded.config,
    credential_secret_id = excluded.credential_secret_id,
    credential_updated_at = excluded.credential_updated_at,
    updated_by_user_id = actor,
    updated_at = timezone('utc', now())
  returning * into saved;

  return (saved.id, saved.integration_key, saved.label, saved.provider,
    saved.mode, saved.is_enabled, saved.config, saved.credential_secret_id is not null,
    saved.credential_updated_at, saved.last_run_at, coalesce(saved.last_run_status, 'never'),
    saved.last_error_message, saved.updated_at)::public.vw_admin_managed_integrations;
end;
$$;

revoke all on function public.rpc_admin_upsert_managed_integration(text, text, text, text, boolean, jsonb, text)
from public, anon, authenticated;
grant execute on function public.rpc_admin_upsert_managed_integration(text, text, text, text, boolean, jsonb, text)
to authenticated, service_role;

create or replace function public.rpc_service_get_managed_integration_secret(p_integration_key text)
returns text
language sql
security definer
set search_path = ''
as $$
  select ds.decrypted_secret
  from public.managed_integrations mi
  join vault.decrypted_secrets ds on ds.id = mi.credential_secret_id
  where mi.integration_key = p_integration_key
    and mi.is_enabled = true
  limit 1;
$$;

revoke all on function public.rpc_service_get_managed_integration_secret(text)
from public, anon, authenticated;
grant execute on function public.rpc_service_get_managed_integration_secret(text)
to service_role;

create trigger managed_integrations_touch_updated_at
before update on public.managed_integrations
for each row execute function app_private.touch_updated_at();

create trigger managed_integrations_audit_row_change
after insert or update or delete on public.managed_integrations
for each row execute function audit.capture_row_change();

insert into public.managed_integrations (integration_key, label, provider, mode, is_enabled, config)
values
  ('hubspot', 'HubSpot', 'hubspot', 'api', true, '{"domains":["commercial","cs"],"pipeline_selection":"analytics_source_config"}'::jsonb),
  ('omie', 'Omie Financeiro', 'omie', 'hybrid', false, '{"resource":"contas_a_receber","fallback":"spreadsheet_upload"}'::jsonb),
  ('cs_spreadsheet', 'Planilha CS', 'google_sheets', 'manual', true, '{"source_key":"cs_ops_consolidated","refresh":"manual"}'::jsonb),
  ('commercial_spreadsheet', 'Planilha Comercial', 'spreadsheet_upload', 'manual', true, '{"source_key":"commercial_daily_tabs","refresh":"manual"}'::jsonb)
on conflict (integration_key) do nothing;
