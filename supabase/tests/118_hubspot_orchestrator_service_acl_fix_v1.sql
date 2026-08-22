begin;
select plan(3);

select ok(
  has_table_privilege('service_role', 'public.hubspot_sync_runs', 'SELECT'),
  'service_role pode ler o contexto das execucoes HubSpot no worker'
);
select ok(
  has_table_privilege('service_role', 'public.hubspot_sync_runs', 'UPDATE'),
  'service_role pode persistir erro sanitizado da execucao HubSpot'
);
select ok(
  not has_table_privilege('authenticated', 'public.hubspot_sync_runs', 'UPDATE'),
  'authenticated nao recebe escrita direta em execucoes HubSpot'
);

select * from finish();
rollback;
