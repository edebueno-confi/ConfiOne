-- Driver agendado do orquestrador HubSpot.
--
-- PROBLEMA
-- O ciclo de sincronizacao parava no meio e o run ficava `running` para sempre.
-- Duas causas, ambas na conducao do ciclo (nao no worker, que processa uma
-- pagina por invocacao e faz checkpoint corretamente):
--
-- 1. hubspot-orchestrator-dispatcher consome no maximo 12 work items por
--    invocacao e reagenda a si mesmo via EdgeRuntime.waitUntil. Mas o
--    reagendamento exige ANALYTICS_SYNC_SECRET:
--        const continuationScheduled = Boolean(secret) && !idle && results.length === 12;
--    Sem o segredo, ou quando o isolate e terminado por wall clock antes do
--    waitUntil concluir, a cadeia morre e o trabalho restante nunca e retomado.
--
-- 2. O reaper de runs orfaos (rpc_analytics_hubspot_abandon_stale_runs, 900s)
--    roda DENTRO do dispatcher. Se ninguem invoca o dispatcher, o reaper nunca
--    executa e o run permanece `running` indefinidamente, segurando o lock de
--    concorrencia e bloqueando qualquer ciclo novo.
--
-- Evidencia local (2026-08-10): run 293effe0 parou em 9/34 pipelines com 326
-- registros recebidos e heartbeat congelado; run 8c041fcf parou em 31/34 com
-- 34.678 registros. Ambos com records_promoted = 0 e watermark_advanced = false.
--
-- CORRECAO
-- Um cron a cada 2 minutos aciona o dispatcher enquanto houver run aberto. Isso
-- cobre as duas falhas: substitui a continuacao perdida e garante que o reaper
-- execute. Quando nao ha run aberto, a funcao nao faz chamada HTTP alguma.
--
-- Espelha o padrao ja existente em app_private.enqueue_hubspot_associations_sync:
-- segredo lido do vault, POST via net.http_post, header x-analytics-sync-secret.
--
-- Nao altera o worker, o dispatcher, contrato, RLS ou dado operacional.

begin;

create or replace function app_private.drive_hubspot_orchestrator()
 returns bigint
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  scheduler_secret text;
  request_id bigint;
  has_open_run boolean;
begin
  -- Sem run aberto nao ha o que conduzir nem o que reapear.
  select exists (
    select 1
    from public.hubspot_sync_runs
    where provider = 'hubspot'
      and status in ('queued', 'running', 'partial')
  ) into has_open_run;

  if not has_open_run then
    return null;
  end if;

  select decrypted_secret
    into scheduler_secret
  from vault.decrypted_secrets
  where name = 'gso_analytics_sync_scheduler'
  limit 1;

  if nullif(trim(coalesce(scheduler_secret, '')), '') is null then
    raise exception 'Segredo do scheduler HubSpot não configurado.' using errcode = '22023';
  end if;

  select net.http_post(
    url := 'https://jzmmvfcmruasqmrdmbup.supabase.co/functions/v1/hubspot-orchestrator-dispatcher',
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
$function$;

revoke all on function app_private.drive_hubspot_orchestrator() from public;

-- Cron a cada 2 minutos. O guard de run aberto mantem o custo em zero quando
-- nao ha ciclo em andamento.
select cron.unschedule('analytics-hubspot-orchestrator-driver')
where exists (
  select 1 from cron.job where jobname = 'analytics-hubspot-orchestrator-driver'
);

select cron.schedule(
  'analytics-hubspot-orchestrator-driver',
  '*/2 * * * *',
  $cron$ select app_private.drive_hubspot_orchestrator(); $cron$
);

commit;
