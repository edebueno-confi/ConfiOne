-- ANALYTICS-HUBSPOT-FULL-RESYNC-TRIGGER-V1
--
-- Disparo operacional de carga completa do HubSpot.
--
-- Por que existe
-- --------------
-- A sincronização diária é incremental: usa a marca d'água e só busca registros
-- modificados desde a última execução. Isso é correto no dia a dia, mas é
-- insuficiente quando o **mapeamento de propriedades muda**, porque adicionar um
-- campo à consulta não altera a data de modificação do registro no HubSpot. Sem
-- carga completa, o campo novo continuaria nulo em todo o histórico.
--
-- Foi exatamente o que aconteceu em 2026-08-07: a correção da propriedade de
-- data de encerramento do ticket só produz efeito com uma releitura completa dos
-- 31.531 tickets já encerrados.
--
-- Segurança
-- ---------
-- Segue o mesmo padrão de `app_private.enqueue_hubspot_daily_incremental`: o
-- segredo do scheduler é lido do Vault dentro de uma função `security definer` e
-- nunca trafega por parâmetro, log ou retorno. A chamada é assíncrona por
-- `pg_net`; o tempo limite baixo apenas encerra a espera do Postgres, enquanto a
-- função continua executando do outro lado.

create or replace function app_private.enqueue_hubspot_full_resync()
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
    url := 'https://jzmmvfcmruasqmrdmbup.supabase.co/functions/v1/analytics-sequential-sync',
    body := jsonb_build_object('full', true),
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

comment on function app_private.enqueue_hubspot_full_resync() is
  'Dispara uma carga completa do HubSpot. Necessária sempre que o mapeamento de propriedades muda, porque a janela incremental não retorna campos recém-adicionados. Restrita a postgres e service_role.';

revoke all on function app_private.enqueue_hubspot_full_resync() from public, anon, authenticated;
grant execute on function app_private.enqueue_hubspot_full_resync() to postgres, service_role;

-- ---------------------------------------------------------------------------
-- Disparo da ingestão de vínculos
-- ---------------------------------------------------------------------------

create or replace function app_private.enqueue_hubspot_associations_sync(
  p_scope text default 'tickets'
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  scheduler_secret text;
  request_id bigint;
begin
  if p_scope not in ('tickets', 'deals') then
    raise exception 'Escopo inválido para ingestão de vínculos.' using errcode = '22023';
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
    url := 'https://jzmmvfcmruasqmrdmbup.supabase.co/functions/v1/hubspot-associations-sync',
    body := jsonb_build_object('scope', p_scope),
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

comment on function app_private.enqueue_hubspot_associations_sync(text) is
  'Dispara a ingestão de vínculos entre objetos do HubSpot e empresas. Restrita a postgres e service_role.';

revoke all on function app_private.enqueue_hubspot_associations_sync(text) from public, anon, authenticated;
grant execute on function app_private.enqueue_hubspot_associations_sync(text) to postgres, service_role;
