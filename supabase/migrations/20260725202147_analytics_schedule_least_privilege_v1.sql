-- LOCAL-QA-01.2: schedule bruto e mutacoes pertencem somente ao administrador.
-- Forward-only. O Dashboard usa somente read models sanitizados.

drop policy if exists analytics_integration_schedule_read on public.analytics_integration_schedule;
create policy analytics_integration_schedule_read
on public.analytics_integration_schedule for select to authenticated
using (app_private.has_global_role('platform_admin'::public.platform_role));

create or replace view public.vw_analytics_integration_schedule_read
with (security_barrier = true)
as
select id, enabled, frequency, last_run_at, last_status, last_message,
       hubspot_enabled, hubspot_frequency, hubspot_last_run_at,
       hubspot_last_status, hubspot_last_message
from public.analytics_integration_schedule
where app_private.has_global_role('platform_admin'::public.platform_role);

revoke all on public.vw_analytics_integration_schedule_read from public, anon;
grant select on public.vw_analytics_integration_schedule_read to authenticated;

revoke insert, update, delete, truncate, references
on public.analytics_integration_schedule
from authenticated;
grant select on public.analytics_integration_schedule to authenticated;

create or replace function public.rpc_admin_set_integration_schedule(
  p_enabled boolean,
  p_frequency text
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
  if p_frequency not in ('hourly', 'daily', 'off') then
    raise exception 'Frequencia invalida.' using errcode = '22023';
  end if;
  update public.analytics_integration_schedule
  set enabled = coalesce(p_enabled, false),
      frequency = p_frequency,
      updated_at = timezone('utc', now()),
      updated_by_user_id = auth.uid()
  where id = true
  returning * into saved;
  return saved;
end;
$$;

revoke all on function public.rpc_admin_set_integration_schedule(boolean, text) from public, anon;
grant execute on function public.rpc_admin_set_integration_schedule(boolean, text) to authenticated, service_role;

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
