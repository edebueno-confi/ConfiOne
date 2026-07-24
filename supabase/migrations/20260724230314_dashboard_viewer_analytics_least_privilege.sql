-- DASHBOARD-02.1: reduz o perfil viewer ao shell do Dashboard.
-- Forward-only: não remove o papel global nem altera dados operacionais.

delete from public.internal_role_screen_grants
where role = 'dashboard_viewer'::public.platform_role
  and screen_key not in ('home', 'analytics');

insert into public.internal_role_screen_grants (role, screen_key)
select 'dashboard_viewer'::public.platform_role, screen_key
from public.internal_screen_catalog
where screen_key in ('home', 'analytics')
on conflict (role, screen_key) do nothing;

create or replace function app_private.can_read_analytics()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.user_global_roles r on r.user_id = p.id
    where p.id = auth.uid()
      and p.is_active = true
      and r.role in ('platform_admin'::public.platform_role, 'dashboard_viewer'::public.platform_role)
  );
$$;

create or replace view public.vw_analytics_dashboard_pipeline_catalog
with (security_barrier = true)
as
select id, domain_key, object_type, hubspot_pipeline_id, hubspot_pipeline_label,
       label, is_active
from public.analytics_source_config
where app_private.can_read_analytics();

create or replace view public.vw_analytics_dashboard_sync_status
with (security_barrier = true)
as
select id, domain_key, status, started_at, finished_at,
       deals_synced, tickets_synced, owners_synced, stages_synced,
       companies_synced, error_message
from public.hubspot_sync_runs
where app_private.can_read_analytics();

create or replace view public.vw_analytics_integration_schedule_read
with (security_barrier = true)
as
select id, enabled, frequency, last_run_at, last_status, last_message,
       hubspot_enabled, hubspot_frequency, hubspot_last_run_at,
       hubspot_last_status, hubspot_last_message
from public.analytics_integration_schedule
where app_private.can_read_analytics();

revoke all on public.vw_analytics_dashboard_pipeline_catalog,
  public.vw_analytics_dashboard_sync_status,
  public.vw_analytics_integration_schedule_read
from public, anon;
grant select on public.vw_analytics_dashboard_pipeline_catalog,
  public.vw_analytics_dashboard_sync_status,
  public.vw_analytics_integration_schedule_read to authenticated;

-- O viewer consulta somente contratos de leitura. Escritas continuam restritas
-- aos RPCs administrativos/service_role, mesmo que uma policy futura seja
-- alterada por engano.
revoke insert, update, delete, truncate, references
on public.analytics_source_config,
   public.analytics_integration_schedule,
   public.hubspot_companies,
   public.hubspot_deals,
   public.hubspot_tickets,
   public.hubspot_owners,
   public.hubspot_pipeline_stages,
   public.hubspot_sync_runs,
   public.analytics_finance_receivables,
   public.analytics_finance_sync_runs,
   public.analytics_spreadsheet_import_runs,
   public.analytics_spreadsheet_rows
from authenticated;

revoke select on public.analytics_source_config, public.hubspot_sync_runs,
  public.analytics_finance_receivables, public.analytics_finance_sync_runs,
  public.analytics_spreadsheet_import_runs, public.analytics_spreadsheet_rows
from authenticated;

comment on function app_private.can_read_analytics() is
  'Gate de leitura analítica. dashboard_viewer permanece limitado às superfícies e contratos de leitura do Dashboard; escritas são administrativas ou service_role.';
