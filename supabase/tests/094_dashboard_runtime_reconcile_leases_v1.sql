begin;
select plan(5);

select ok(
  to_regprocedure('public.rpc_admin_reconcile_analytics_sync_runs(integer)') is not null,
  'RPC de reconciliacao continua disponivel'
);
select ok(
  position('analytics_cs_sync_work_items' in pg_get_functiondef('public.rpc_admin_reconcile_analytics_sync_runs(integer)'::regprocedure)) > 0,
  'reconciliador examina work items HubSpot'
);
select ok(
  position('lease_owner = null' in pg_get_functiondef('public.rpc_admin_reconcile_analytics_sync_runs(integer)'::regprocedure)) > 0
    and position('lease_expires_at = null' in pg_get_functiondef('public.rpc_admin_reconcile_analytics_sync_runs(integer)'::regprocedure)) > 0,
  'reconciliador libera owner e expiracao da lease'
);
select ok(
  position('PARENT_RUN_RECONCILED' in pg_get_functiondef('public.rpc_admin_reconcile_analytics_sync_runs(integer)'::regprocedure)) > 0,
  'reconciliador registra motivo sanitizado no work item'
);
select ok(
  position('hubspot_work_items' in pg_get_functiondef('public.rpc_admin_reconcile_analytics_sync_runs(integer)'::regprocedure)) > 0,
  'RPC retorna contagem de work items reconciliados'
);

select * from finish();
rollback;
