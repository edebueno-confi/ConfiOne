-- RELEASE-04.2: materializa o schedule incremental do HubSpot no mecanismo
-- canônico do Supabase. OMIE permanece em contrato separado.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function app_private.enqueue_hubspot_daily_incremental()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  scheduler_secret text;
  request_id bigint;
begin
  select decrypted_secret
    into scheduler_secret
  from vault.decrypted_secrets
  where name = 'gso_analytics_sync_scheduler'
  limit 1;

  if nullif(trim(coalesce(scheduler_secret, '')), '') is null then
    raise exception 'Segredo do scheduler HubSpot não configurado.' using errcode = '22023';
  end if;

  select net.http_post(
    url := 'https://jzmmvfcmruasqmrdmbup.supabase.co/functions/v1/analytics-scheduled-run',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-analytics-sync-secret', scheduler_secret
    ),
    timeout_milliseconds := 5000
  )
    into request_id;

  return request_id;
end;
$$;

revoke all on function app_private.enqueue_hubspot_daily_incremental() from public, anon, authenticated;
grant execute on function app_private.enqueue_hubspot_daily_incremental() to postgres, service_role;

do $$
declare
  existing_job_id bigint;
begin
  if to_regclass('cron.job') is null then
    raise exception 'Extensão pg_cron não materializou o catálogo cron.job.';
  end if;

  select jobid
    into existing_job_id
  from cron.job
  where jobname = 'analytics-hubspot-daily-incremental'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'analytics-hubspot-daily-incremental',
    '0 8 * * *',
    'select app_private.enqueue_hubspot_daily_incremental();'
  );
end;
$$;
