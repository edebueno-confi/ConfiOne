-- O orquestrador executa via Edge Functions com a service_role.
-- As RPCs de claim/finalizacao continuam sendo a fronteira de escrita,
-- mas o worker precisa ler o contexto da execucao e registrar falhas
-- sanitizadas diretamente em hubspot_sync_runs.
grant select, update on public.hubspot_sync_runs to service_role;

comment on table public.hubspot_sync_runs is
  'Execucoes do HubSpot; leitura/atualizacao direta restrita ao runner service_role e leitura administrativa via read model/RLS.';
