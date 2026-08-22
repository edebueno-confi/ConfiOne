-- ACL hardening for internal helper functions introduced by the migration domain.
revoke all on function app_private.customer_migration_project_status_is_valid_transition(public.customer_project_status, public.customer_project_status) from public, anon, authenticated, service_role;
revoke all on function app_private.guard_customer_store_source() from public, anon, authenticated, service_role;
revoke all on function app_private.guard_customer_inventory_scope() from public, anon, authenticated, service_role;
revoke all on function app_private.guard_customer_feature_scope() from public, anon, authenticated, service_role;
revoke all on function app_private.guard_migration_project_store_scope() from public, anon, authenticated, service_role;
revoke all on function app_private.guard_batch_item_scope() from public, anon, authenticated, service_role;
revoke execute on function app_private.can_read_customer_operations() from authenticated;
