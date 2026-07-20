-- Agendamento configuravel da sincronizacao de integracao (OMIE -> read model ->
-- propriedades HubSpot). A cadencia fica editavel no produto; um runner
-- server-side (cron) chama a orquestracao e ela respeita esta configuracao.

create table public.analytics_integration_schedule (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  frequency text not null default 'daily' check (frequency in ('hourly', 'daily', 'off')),
  last_run_at timestamptz,
  last_status text check (last_status is null or last_status in ('success', 'partial', 'error', 'running')),
  last_message text,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by_user_id uuid references auth.users(id) on delete set null
);

insert into public.analytics_integration_schedule (id) values (true) on conflict (id) do nothing;

alter table public.analytics_integration_schedule enable row level security;
create policy analytics_integration_schedule_read
on public.analytics_integration_schedule for select to authenticated
using (app_private.can_read_analytics());

revoke all on public.analytics_integration_schedule from public, anon;
grant select on public.analytics_integration_schedule to authenticated, service_role;
grant insert, update on public.analytics_integration_schedule to service_role;

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
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_frequency not in ('hourly', 'daily', 'off') then
    raise exception 'Frequência inválida.' using errcode = '22023';
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

-- Marca inicio/fim de execucao (usado pela orquestracao/cron).
create or replace function public.rpc_service_mark_integration_run(
  p_status text,
  p_message text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.analytics_integration_schedule
  set last_run_at = timezone('utc', now()),
      last_status = p_status,
      last_message = left(coalesce(p_message, ''), 500)
  where id = true;
end;
$$;

revoke all on function public.rpc_service_mark_integration_run(text, text) from public, anon, authenticated;
grant execute on function public.rpc_service_mark_integration_run(text, text) to service_role;
