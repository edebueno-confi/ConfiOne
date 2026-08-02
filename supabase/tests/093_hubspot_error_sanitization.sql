select plan(3);

select ok(
  pg_get_viewdef('public.vw_analytics_hubspot_sync_progress'::regclass, true) like '%sanitized_error%'
    and pg_get_viewdef('public.vw_analytics_hubspot_sync_progress'::regclass, true) not like '%run.error_message%',
  'read model HubSpot projeta somente erro sanitizado'
);

select ok(
  pg_get_viewdef('public.vw_analytics_hubspot_sync_progress'::regclass, true) like '%A atualização do HubSpot não foi concluída.%',
  'read model possui fallback funcional sanitizado'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_analytics_hubspot_sync_progress', 'SELECT'),
  'usuário autenticado possui apenas leitura no progresso HubSpot'
);

select * from finish();
