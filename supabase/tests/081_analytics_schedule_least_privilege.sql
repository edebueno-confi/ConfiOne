begin;

select plan(7);

select ok(
  position('has_global_role' in pg_get_viewdef('public.vw_analytics_integration_schedule_read'::regclass)) > 0,
  'read model de schedule exige gate administrativo'
);

select ok(
  position('has_global_role' in pg_get_functiondef('public.rpc_admin_set_sync_schedules(boolean,text,boolean,text)'::regprocedure)) > 0,
  'RPC de sincronizacao exige gate administrativo'
);

select ok(
  position('has_global_role' in pg_get_functiondef('public.rpc_admin_set_integration_schedule(boolean,text)'::regprocedure)) > 0,
  'RPC legado de schedule exige gate administrativo'
);

select ok(
  position('has_global_role' in pg_get_expr(polqual, polrelid)) > 0,
  'policy da tabela bruta exige gate administrativo'
)
from pg_policy
where polrelid = 'public.analytics_integration_schedule'::regclass
  and polname = 'analytics_integration_schedule_read';

select ok(
  not has_table_privilege('authenticated', 'public.analytics_integration_schedule', 'update'),
  'authenticated nao atualiza schedule bruto diretamente'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_analytics_integration_schedule_read', 'select'),
  'authenticated possui apenas o contrato de leitura sanitizado'
);

select ok(
  has_table_privilege('authenticated', 'public.analytics_integration_schedule', 'select'),
  'authenticated usa leitura direta somente sob RLS administrativo'
);

select * from finish();
rollback;
