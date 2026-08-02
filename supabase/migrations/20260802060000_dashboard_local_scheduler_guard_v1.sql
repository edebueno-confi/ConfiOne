-- O lote reconcilia o banco local sem ativar scheduler remoto automaticamente.
-- A migration histórica pode registrar o job pg_cron; este guard o remove no
-- mesmo push local. A execução manual e o contrato de agenda permanecem
-- disponíveis para QA autorizado.

do $$
declare
  legacy_job_id bigint;
begin
  if to_regclass('cron.job') is null then
    return;
  end if;

  for legacy_job_id in
    select jobid
    from cron.job
    where jobname = 'analytics-hubspot-daily-incremental'
  loop
    perform cron.unschedule(legacy_job_id);
  end loop;
end;
$$;
