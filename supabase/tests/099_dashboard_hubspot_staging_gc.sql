begin;

select plan(14);

set local request.jwt.claim.role = 'service_role';

select has_function(
  'public',
  'rpc_admin_cleanup_hubspot_staging',
  array['integer']::text[],
  'RPC de coleta de staging existe'
);

select ok(
  position('analytics_hubspot_deal_staging' in pg_get_functiondef('public.rpc_admin_cleanup_hubspot_staging(integer)'::regprocedure)) > 0
    and position('analytics_cs_ticket_staging' in pg_get_functiondef('public.rpc_admin_cleanup_hubspot_staging(integer)'::regprocedure)) > 0
    and position('analytics_hubspot_company_staging' in pg_get_functiondef('public.rpc_admin_cleanup_hubspot_staging(integer)'::regprocedure)) > 0,
  'coleta cobre todos os staging de dados'
);

select ok(
  position('status in (''success'', ''succeeded'', ''failed'', ''error'', ''abandoned'', ''cancelled'', ''timed_out'')' in pg_get_functiondef('public.rpc_admin_cleanup_hubspot_staging(integer)'::regprocedure)) > 0
    and position('status in (''pending'', ''leased'', ''running'', ''retrying'')' in pg_get_functiondef('public.rpc_admin_cleanup_hubspot_staging(integer)'::regprocedure)) > 0,
  'coleta exige run terminal sem work item ativo'
);

select ok(
  position('rpc_admin_cleanup_hubspot_staging(604800)' in pg_get_functiondef('public.rpc_admin_reconcile_analytics_sync_runs(integer)'::regprocedure)) > 0,
  'reconciliador chama coleta com retenção conservadora'
);

select is(
  has_function_privilege('service_role', 'public.rpc_admin_cleanup_hubspot_staging(integer)', 'EXECUTE'),
  true,
  'service_role executa coleta'
);

select is(
  has_function_privilege('anon', 'public.rpc_admin_cleanup_hubspot_staging(integer)', 'EXECUTE'),
  false,
  'anon não executa coleta'
);

create temporary table test_staging_gc_context (run_id uuid) on commit drop;

with inserted as (
  insert into public.hubspot_sync_runs (
    provider, domain_key, status, mode, started_at, finished_at, heartbeat_at
  ) values (
    'hubspot', 'all', 'timed_out', 'incremental',
    timezone('utc', now()) - interval '2 hours',
    timezone('utc', now()) - interval '2 hours',
    timezone('utc', now()) - interval '2 hours'
  ) returning id
)
insert into test_staging_gc_context
select id from inserted;

insert into public.analytics_hubspot_deal_staging (parent_run_id, pipeline_id, deal_id)
select run_id, 'pipeline-gc', 'deal-gc' from test_staging_gc_context;
insert into public.analytics_cs_ticket_staging (parent_run_id, pipeline_id, ticket_id)
select run_id, 'pipeline-gc', 'ticket-gc' from test_staging_gc_context;
insert into public.analytics_hubspot_company_staging (parent_run_id, company_id)
select run_id, 'company-gc' from test_staging_gc_context;
insert into public.analytics_hubspot_owner_staging (parent_run_id, owner_id)
select run_id, 'owner-gc' from test_staging_gc_context;
insert into public.analytics_hubspot_pipeline_staging (parent_run_id, object_type, pipeline_id, label)
select run_id, 'deal', 'pipeline-gc', 'Pipeline GC' from test_staging_gc_context;
insert into public.analytics_hubspot_stage_staging (parent_run_id, object_type, pipeline_id, stage_id, label)
select run_id, 'deal', 'pipeline-gc', 'stage-gc', 'Stage GC' from test_staging_gc_context;

select ok(
  ((public.rpc_admin_cleanup_hubspot_staging(3600))->>'eligible_runs')::integer >= 1,
  'coleta encontra run terminal antigo'
);

select is((select count(*)::integer from public.analytics_hubspot_deal_staging where parent_run_id = (select run_id from test_staging_gc_context)), 0, 'coleta remove deal staging antigo');
select is((select count(*)::integer from public.analytics_cs_ticket_staging where parent_run_id = (select run_id from test_staging_gc_context)), 0, 'coleta remove ticket staging antigo');
select is((select count(*)::integer from public.analytics_hubspot_company_staging where parent_run_id = (select run_id from test_staging_gc_context)), 0, 'coleta remove company staging antigo');
select is((select count(*)::integer from public.analytics_hubspot_owner_staging where parent_run_id = (select run_id from test_staging_gc_context)), 0, 'coleta remove owner staging antigo');
select is((select count(*)::integer from public.analytics_hubspot_pipeline_staging where parent_run_id = (select run_id from test_staging_gc_context)), 0, 'coleta remove pipeline staging antigo');
select is((select count(*)::integer from public.analytics_hubspot_stage_staging where parent_run_id = (select run_id from test_staging_gc_context)), 0, 'coleta remove stage staging antigo');

select is(
  (select (result->>'deal_rows')::integer + (result->>'ticket_rows')::integer
   from (select public.rpc_admin_cleanup_hubspot_staging(3600) as result) cleanup),
  0,
  'coleta repetida não remove novas linhas'
);

select * from finish();
rollback;
