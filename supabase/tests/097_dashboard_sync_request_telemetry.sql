begin;

select plan(9);

select has_table(
  'public',
  'analytics_sync_request_attempts',
  'telemetria por tentativa existe'
);

select has_column(
  'public',
  'analytics_sync_request_attempts',
  'endpoint_key',
  'telemetria usa endpoint sanitizado'
);

select has_column(
  'public',
  'analytics_sync_request_attempts',
  'duration_ms',
  'telemetria registra duracao'
);

select has_view(
  'public',
  'vw_analytics_sync_request_metrics_read',
  'read model agregado de telemetria existe'
);

select ok(
  position('attempt_number > 1' in pg_get_viewdef('public.vw_analytics_sync_request_metrics_read'::regclass, true)) > 0,
  'retry conta somente tentativas adicionais'
);

select ok(
  position('status_code = 429' in pg_get_viewdef('public.vw_analytics_sync_request_metrics_read'::regclass, true)) > 0,
  'rate limit e agregado sem expor resposta'
);

select is(
  has_table_privilege('authenticated', 'public.analytics_sync_request_attempts', 'INSERT'),
  false,
  'authenticated nao insere telemetria'
);

select is(
  has_table_privilege('service_role', 'public.analytics_sync_request_attempts', 'INSERT'),
  true,
  'service_role insere telemetria'
);

select is(
  has_table_privilege('authenticated', 'public.vw_analytics_sync_request_metrics_read', 'SELECT'),
  true,
  'authenticated le somente o agregado'
);

select * from finish();

rollback;
