-- RELEASE-04.1 follow-up: o service client das Edge Functions chega ao
-- PostgREST sem um sub de usuário. O grant continua limitado a
-- authenticated/service_role; esta identidade não pode ser confundida com anon.
create or replace function app_private.is_internal_service_request()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is null
    and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'anon';
$$;

create or replace function app_private.has_global_role(required_role public.platform_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_internal_service_request()
    or exists (
      select 1
      from public.user_global_roles as ugr
      where ugr.user_id = auth.uid()
        and ugr.role = required_role
    );
$$;

create or replace function public.rpc_analytics_hubspot_start_run(
  p_domain_key text default null,
  p_mode text default null,
  p_correlation_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_is_service_role boolean := app_private.is_internal_service_request();
  v_run public.hubspot_sync_runs;
  v_domains text[] := case when p_domain_key in ('commercial', 'cs') then array[p_domain_key] else array['commercial','cs'] end;
  v_mode text := case when p_mode in ('full','incremental') then p_mode else 'incremental' end;
  v_after bigint := null;
  v_count integer := 0;
begin
  if not v_is_service_role then
    v_actor := app_private.require_active_actor();
  end if;
  if not v_is_service_role and not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'analytics HubSpot start denied';
  end if;
  perform public.rpc_analytics_hubspot_abandon_stale_runs(900);
  if exists (select 1 from public.hubspot_sync_runs where provider = 'hubspot' and domain_key = 'all' and status in ('queued','running','partial')) then
    raise exception using errcode = 'P0001', message = 'Ja existe uma carga HubSpot em andamento.';
  end if;
  if p_mode is null and exists (select 1 from public.hubspot_sync_runs where provider = 'hubspot' and status in ('success','succeeded') and watermark_advanced order by finished_at desc limit 1) then
    v_mode := 'incremental';
  else
    v_mode := coalesce(p_mode, 'full');
  end if;
  if v_mode = 'incremental' then
    select greatest(0, extract(epoch from (coalesce(max(finished_at), timezone('utc', now())) - interval '5 minutes')) * 1000)::bigint
      into v_after from public.hubspot_sync_runs where provider = 'hubspot' and status in ('success','succeeded') and watermark_advanced;
  end if;
  insert into public.hubspot_sync_runs(provider, domain_key, domains, mode, status, triggered_by, requested_by, correlation_id, heartbeat_at, source_updated_after_ms, source_pagination_complete)
  values ('hubspot','all',v_domains,v_mode,'queued',v_actor,v_actor,coalesce(p_correlation_id, extensions.gen_random_uuid()),timezone('utc',now()),v_after,false)
  returning * into v_run;
  insert into public.analytics_cs_sync_work_items(parent_run_id, domain_key, object_type, pipeline_id, pipeline_label, range_start_ms, range_end_ms)
  select v_run.id, c.domain_key, c.object_type, c.hubspot_pipeline_id, coalesce(c.hubspot_pipeline_label,c.label), 0, 4102444800000
  from public.analytics_source_config c
  where c.is_active and c.domain_key = any(v_domains)
  on conflict do nothing;
  insert into public.analytics_cs_sync_work_items(parent_run_id, domain_key, object_type, pipeline_id, pipeline_label, range_start_ms, range_end_ms)
  values (v_run.id, 'shared', 'shared', '*', 'Empresas, owners e catalogo', 0, 4102444800000);
  select count(*)::integer into v_count from public.analytics_cs_sync_work_items where parent_run_id = v_run.id;
  if v_count = 0 then
    update public.hubspot_sync_runs set status='failed', finished_at=timezone('utc',now()), error_code='NO_ACTIVE_HUBSPOT_SOURCES', error_message='Nenhuma fonte ativa do HubSpot foi configurada.' where id=v_run.id;
    raise exception 'Nenhuma fonte ativa do HubSpot foi configurada.';
  end if;
  update public.hubspot_sync_runs set pipelines_total=v_count, source_state=null where id=v_run.id;
  return jsonb_build_object('status','queued','run_id',v_run.id,'correlation_id',v_run.correlation_id,'mode',v_mode,'domains',v_domains,'work_items_total',v_count,'source_updated_after_ms',v_after);
end;
$$;

revoke all on function app_private.is_internal_service_request() from public, anon, authenticated, service_role;
grant execute on function app_private.is_internal_service_request() to authenticated, service_role;
revoke all on function public.rpc_analytics_hubspot_start_run(text,text,uuid) from public, anon;
grant execute on function public.rpc_analytics_hubspot_start_run(text,text,uuid) to authenticated, service_role;
