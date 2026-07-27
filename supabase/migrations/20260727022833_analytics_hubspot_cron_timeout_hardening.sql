-- RELEASE-04.2: o dispatcher pode processar varios lotes incrementais.
-- Mantemos a chamada assincrona do pg_net, mas evitamos que uma execucao
-- normal seja marcada como timeout antes de o dispatcher concluir.

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
    raise exception 'Segredo do scheduler HubSpot nao configurado.' using errcode = '22023';
  end if;

  select net.http_post(
    url := 'https://jzmmvfcmruasqmrdmbup.supabase.co/functions/v1/analytics-scheduled-run',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-analytics-sync-secret', scheduler_secret
    ),
    timeout_milliseconds := 300000
  )
    into request_id;

  return request_id;
end;
$$;

revoke all on function app_private.enqueue_hubspot_daily_incremental() from public, anon, authenticated;
grant execute on function app_private.enqueue_hubspot_daily_incremental() to postgres, service_role;
