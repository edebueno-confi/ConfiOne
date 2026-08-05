-- DASHBOARD-03: uma cadência server-side para o ciclo HubSpot -> OMIE.
-- Forward-only: os campos legados de HubSpot continuam no schema para
-- compatibilidade, mas não representam mais um segundo agendamento ativo.

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
    raise exception 'Frequencia do ciclo invalida.' using errcode = '22023';
  end if;
  if p_hubspot_frequency not in ('hourly', 'daily', 'off') then
    raise exception 'Frequencia legada invalida.' using errcode = '22023';
  end if;

  update public.analytics_integration_schedule
  set enabled = coalesce(p_omie_enabled, false),
      frequency = p_omie_frequency,
      hubspot_enabled = false,
      hubspot_frequency = 'off',
      updated_at = timezone('utc', now()),
      updated_by_user_id = auth.uid()
  where id = true
  returning * into saved;
  return saved;
end;
$$;

revoke all on function public.rpc_admin_set_sync_schedules(boolean, text, boolean, text) from public, anon;
grant execute on function public.rpc_admin_set_sync_schedules(boolean, text, boolean, text) to authenticated, service_role;

update public.managed_integrations
set config = jsonb_build_object(
  'domains', jsonb_build_array('commercial', 'customer_success', 'support'),
  'pipeline_selection', 'analytics_source_config'
)
where integration_key = 'hubspot';

update public.managed_integrations
set provider = 'omie',
    mode = 'api',
    config = jsonb_build_object('resource', 'contas_a_receber')
where integration_key = 'omie';

comment on column public.analytics_integration_schedule.enabled is
  'Ativa o único ciclo automático do Dashboard: HubSpot completo e depois OMIE Financeiro.';
