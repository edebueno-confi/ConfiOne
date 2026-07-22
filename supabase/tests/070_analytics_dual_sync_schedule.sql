create extension if not exists pgtap with schema extensions;

begin;

select plan(8);

select has_column(
  'public',
  'analytics_integration_schedule',
  'hubspot_enabled',
  'agenda HubSpot possui flag independente'
);

select has_column(
  'public',
  'analytics_integration_schedule',
  'hubspot_frequency',
  'agenda HubSpot possui frequencia independente'
);

select has_column(
  'public',
  'analytics_integration_schedule',
  'hubspot_last_status',
  'agenda HubSpot possui status proprio'
);

select ok(
  to_regprocedure('public.rpc_admin_set_sync_schedules(boolean,text,boolean,text)') is not null,
  'RPC administrativa dos dois agendamentos existe'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.rpc_admin_set_sync_schedules(boolean,text,boolean,text)',
    'EXECUTE'
  ),
  'authenticated pode chamar a RPC e a funcao aplica o gate de platform_admin'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.rpc_admin_set_sync_schedules(boolean,text,boolean,text)',
    'EXECUTE'
  ),
  'anon nao possui EXECUTE na RPC administrativa'
);

select ok(
  (select hubspot_enabled from public.analytics_integration_schedule where id = true) is not null,
  'linha singleton de agenda possui estado HubSpot'
);

select ok(
  (select hubspot_frequency from public.analytics_integration_schedule where id = true) in ('hourly', 'daily', 'off'),
  'frequencia HubSpot possui dominio valido'
);

select * from finish();
rollback;
