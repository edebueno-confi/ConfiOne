begin;

select plan(2);

select has_function(
  'public',
  'rpc_admin_set_analytics_pipeline_operation',
  array['uuid', 'text'],
  'platform_admin confirma ou corrige a operacao dona de um pipeline'
);

select has_column(
  'public',
  'analytics_source_config',
  'group_company_source',
  'a origem da operacao permanece explicitamente auditavel'
);

select * from finish();
rollback;
