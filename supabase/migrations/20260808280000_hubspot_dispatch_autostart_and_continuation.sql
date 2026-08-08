-- ANALYTICS-HUBSPOT-DISPATCH-AUTOSTART-AND-CONTINUATION-V1
--
-- A criação de uma execução só enfileirava itens. O dispatcher precisava ser
-- acionado manualmente quando a execução não vinha do ciclo sequencial. O
-- gatilho abaixo usa o enfileirador privado já existente, que lê o segredo no
-- Vault e não o expõe ao chamador do RPC.

create or replace function app_private.enqueue_hubspot_dispatch_after_start()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform app_private.enqueue_hubspot_dispatch();
  return new;
end;
$$;

comment on function app_private.enqueue_hubspot_dispatch_after_start() is
  'Dispara o dispatcher do HubSpot após uma execução assíncrona ser criada. O segredo permanece restrito ao Vault e ao enfileirador privado.';

revoke all on function app_private.enqueue_hubspot_dispatch_after_start() from public, anon, authenticated, service_role;

drop trigger if exists hubspot_sync_runs_enqueue_dispatch on public.hubspot_sync_runs;

create trigger hubspot_sync_runs_enqueue_dispatch
after insert on public.hubspot_sync_runs
for each row
when (new.provider = 'hubspot' and new.status = 'queued')
execute function app_private.enqueue_hubspot_dispatch_after_start();
