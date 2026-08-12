begin;

select plan(3);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'hubspot_companies'
      and indexname = 'hubspot_companies_reconciliation_name_trgm_idx'
  ),
  'fila de conciliacao possui indice trigramas para nomes normalizados'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'hubspot_companies_reconciliation_name_trgm_idx'
      and indexdef like '%gin_trgm_ops%'
  ),
  'indice da fila usa operador trigramas do PostgreSQL'
);

select has_function(
  'public',
  'rpc_analytics_company_reconciliation_queue',
  array['integer', 'integer'],
  'fila de conciliacao permanece exposta pelo contrato existente'
);

select * from finish();
rollback;
