create unique index if not exists customer_migration_validation_execution_store_key
  on public.customer_migration_validation_results (execution_request_id, store_id);
