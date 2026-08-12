-- DASHBOARD-SCHEDULER-V1
-- A configuracao de integracoes ja permite o ciclo diario. Este lote
-- materializa o disparo server-side protegido sem expor segredo ao frontend.

begin;

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  existing_job_id bigint;
begin
  if to_regclass('cron.job') is null then
    raise exception 'Extensao pg_cron nao materializou o catalogo cron.job.';
  end if;

  select jobid
    into existing_job_id
  from cron.job
  where jobname = 'analytics-dashboard-daily-cycle'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'analytics-dashboard-daily-cycle',
    '0 8 * * *',
    'select app_private.enqueue_hubspot_daily_incremental();'
  );
end;
$$;

comment on function app_private.enqueue_hubspot_daily_incremental() is
  'Dispara o ciclo diario protegido HubSpot -> OMIE conforme analytics_integration_schedule; segredo permanece no Vault.';

commit;
