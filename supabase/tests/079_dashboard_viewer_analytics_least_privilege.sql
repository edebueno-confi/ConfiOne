begin;
select plan(11);

select ok(
  has_function_privilege(
  'authenticated',
  'app_private.can_read_analytics()',
  'execute'
  ),
  'authenticated pode avaliar o gate de leitura analítica'
);

select ok(
  has_table_privilege(
  'authenticated',
  'public.vw_analytics_dashboard_pipeline_catalog',
  'select'
  ),
  'viewer possui leitura do catálogo restrito'
);

select ok(
  has_table_privilege(
  'authenticated',
  'public.vw_analytics_dashboard_sync_status',
  'select'
  ),
  'viewer possui leitura do status de sincronização'
);

select ok(
  not has_table_privilege(
  'authenticated',
  'public.analytics_source_config',
  'select'
  ),
  'viewer não possui leitura direta da configuração bruta'
);

select ok(
  not has_table_privilege(
  'authenticated',
  'public.analytics_finance_receivables',
  'select'
  ),
  'viewer não possui leitura direta dos recebíveis brutos'
);

select ok(not has_table_privilege('authenticated', 'public.hubspot_companies', 'select'), 'viewer sem leitura direta de empresas HubSpot');
select ok(not has_table_privilege('authenticated', 'public.hubspot_deals', 'select'), 'viewer sem leitura direta de deals HubSpot');
select ok(not has_table_privilege('authenticated', 'public.hubspot_tickets', 'select'), 'viewer sem leitura direta de tickets HubSpot');
select ok(not has_table_privilege('authenticated', 'public.hubspot_owners', 'select'), 'viewer sem leitura direta de owners HubSpot');
select ok(not has_table_privilege('authenticated', 'public.hubspot_pipeline_stages', 'select'), 'viewer sem leitura direta de estagios HubSpot');

select is(
  (select count(*)::int from public.internal_role_screen_grants where role = 'dashboard_viewer'::public.platform_role and screen_key <> 'analytics'),
  0,
  'dashboard_viewer não possui grants de telas fora do Dashboard'
);

select * from finish();
rollback;
