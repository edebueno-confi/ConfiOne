begin;
select plan(6);

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

select is(
  (select count(*)::int from public.internal_role_screen_grants where role = 'dashboard_viewer'::public.platform_role and screen_key not in ('home', 'analytics')),
  0,
  'dashboard_viewer não possui grants de telas fora do Dashboard'
);

select * from finish();
rollback;
