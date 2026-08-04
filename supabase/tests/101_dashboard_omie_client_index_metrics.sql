begin;

select plan(5);

select has_view(
  'public',
  'vw_analytics_finance_sync_runs_read',
  'read model financeiro existe'
);

select has_column(
  'public',
  'vw_analytics_finance_sync_runs_read',
  'enrichment_cache_source',
  'read model expõe origem do cache de clientes'
);

select has_column(
  'public',
  'vw_analytics_finance_sync_runs_read',
  'enrichment_cache_age_seconds',
  'read model expõe idade do cache de clientes'
);

select has_column(
  'public',
  'vw_analytics_finance_sync_runs_read',
  'enrichment_cache_rows',
  'read model expõe linhas do cache de clientes'
);

select ok(
  position('r.enrichment' in pg_get_viewdef('public.vw_analytics_finance_sync_runs_read'::regclass, true)) > 0,
  'view deriva as métricas do contrato de enriquecimento persistido'
);

select * from finish();
rollback;
