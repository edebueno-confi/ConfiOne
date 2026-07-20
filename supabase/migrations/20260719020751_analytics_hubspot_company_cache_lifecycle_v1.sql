-- O cache de empresas representa o snapshot operacional atual do HubSpot.
-- Registros que deixaram de ser retornados pela API (por merge/arquivamento)
-- não devem continuar participando da reconciliação financeira.

create index if not exists hubspot_companies_synced_at_idx
  on public.hubspot_companies (synced_at);

comment on table public.hubspot_companies is
  'Snapshot read-only das empresas ativas retornadas pela última sincronização completa do HubSpot. Registros ausentes do snapshot são removidos após a carga bem-sucedida; histórico fica preservado em audit_log e hubspot_sync_runs.';
