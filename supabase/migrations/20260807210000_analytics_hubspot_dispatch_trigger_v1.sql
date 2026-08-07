-- ANALYTICS-HUBSPOT-DISPATCH-TRIGGER-V1
--
-- Disparo avulso do dispatcher do HubSpot.
--
-- Por que existe
-- --------------
-- O ciclo `analytics-sequential-sync` aciona o dispatcher no máximo 30 vezes,
-- e cada dispatcher processa até 12 páginas. São 360 páginas por ciclo, o que
-- basta para a janela incremental do dia a dia.
--
-- Uma carga completa é outra ordem de grandeza: 34.371 tickets, 10.168 empresas
-- e 2.103 negócios passam de 470 páginas. O ciclo esgota as tentativas antes do
-- fim, e a promoção do staging só acontece quando **todos** os itens de trabalho
-- concluem — então uma carga completa interrompida no meio deixa o snapshot
-- anterior intacto e nada é publicado pela metade. Correto, mas exige retomada.
--
-- Esta função permite retomar o processamento sem reiniciar o ciclo, preservando
-- os itens já concluídos.
--
-- Segurança: mesmo padrão das demais. O segredo é lido do Vault dentro de uma
-- função `security definer` e nunca trafega por parâmetro, log ou retorno.

create or replace function app_private.enqueue_hubspot_dispatch()
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
$$;

comment on function app_private.enqueue_hubspot_dispatch() is
  'Retoma o processamento dos itens de trabalho pendentes do HubSpot sem reiniciar o ciclo. Necessária em cargas completas, que excedem o limite de dispatch de um ciclo único. Restrita a postgres e service_role.';

revoke all on function app_private.enqueue_hubspot_dispatch() from public, anon, authenticated;
grant execute on function app_private.enqueue_hubspot_dispatch() to postgres, service_role;
