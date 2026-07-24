-- Configuracao independente dos dois fluxos recorrentes do Dashboard:
-- 1) OMIE -> read model financeiro -> propriedades financeiras HubSpot;
-- 2) HubSpot -> read models de empresas, comercial, suporte, owners e estagios.

alter table public.analytics_integration_schedule
  add column if not exists hubspot_enabled boolean not null default false,
  add column if not exists hubspot_frequency text not null default 'off',
  add column if not exists hubspot_last_run_at timestamptz,
  add column if not exists hubspot_last_status text,
  add column if not exists hubspot_last_message text;

alter table public.analytics_integration_schedule
  drop constraint if exists analytics_integration_schedule_hubspot_frequency_check;

alter table public.analytics_integration_schedule
  add constraint analytics_integration_schedule_hubspot_frequency_check
  check (hubspot_frequency in ('hourly', 'daily', 'off'));

create or replace function public.rpc_admin_set_sync_schedules(
  p_omie_enabled boolean,
  p_omie_frequency text,
  p_hubspot_enabled boolean,
  p_hubspot_frequency text
)
returns public.analytics_integration_schedule
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved public.analytics_integration_schedule;
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_omie_frequency not in ('hourly', 'daily', 'off') then
    raise exception 'Frequencia OMIE invalida.' using errcode = '22023';
  end if;
  if p_hubspot_frequency not in ('hourly', 'daily', 'off') then
    raise exception 'Frequencia HubSpot invalida.' using errcode = '22023';
  end if;

  update public.analytics_integration_schedule
  set enabled = coalesce(p_omie_enabled, false),
      frequency = p_omie_frequency,
      hubspot_enabled = coalesce(p_hubspot_enabled, false),
      hubspot_frequency = p_hubspot_frequency,
      updated_at = timezone('utc', now()),
      updated_by_user_id = auth.uid()
  where id = true
  returning * into saved;
  return saved;
end;
$$;

revoke all on function public.rpc_admin_set_sync_schedules(boolean, text, boolean, text) from public, anon;
grant execute on function public.rpc_admin_set_sync_schedules(boolean, text, boolean, text) to authenticated, service_role;
