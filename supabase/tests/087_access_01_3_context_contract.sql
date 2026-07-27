create extension if not exists pgtap with schema extensions;

begin;

select plan(12);

select ok(
  to_regclass('public.vw_admin_auth_context') is not null,
  'read model do contexto administrativo existe'
);

select ok(
  to_regclass('public.vw_internal_actor_workspace_context') is not null,
  'read model das telas autorizadas existe'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_admin_auth_context', 'select'),
  'authenticated pode consultar seu contexto administrativo'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_internal_actor_workspace_context', 'select'),
  'authenticated pode consultar as telas autorizadas'
);

select ok(
  not has_table_privilege('anon', 'public.vw_admin_auth_context', 'select'),
  'anon nao pode consultar o contexto administrativo'
);

select ok(
  not has_table_privilege('anon', 'public.vw_internal_actor_workspace_context', 'select'),
  'anon nao pode consultar as telas autorizadas'
);

select ok(
  position('auth.uid()' in pg_get_viewdef('public.vw_admin_auth_context'::regclass, true)) > 0,
  'contexto administrativo permanece vinculado ao actor autenticado'
);

select ok(
  position('auth.uid()' in pg_get_functiondef('app_private.internal_actor_workspace_context()'::regprocedure)) > 0,
  'telas autorizadas permanecem vinculadas ao actor autenticado'
);

select ok(
  to_regprocedure('app_private.internal_actor_workspace_context()') is not null,
  'contexto autenticado possui um read model privado de runtime'
);

select ok(
  position('rpc_internal_actor_workspace_context' in pg_get_viewdef('public.vw_internal_actor_workspace_context'::regclass, true)) > 0,
  'view publico delega a leitura para o rpc de runtime'
);

select ok(
  to_regprocedure('public.rpc_internal_actor_workspace_context()') is not null,
  'rpc de contexto autenticado existe'
);

select ok(
  has_function_privilege('authenticated', 'public.rpc_internal_actor_workspace_context()', 'execute'),
  'authenticated pode executar o rpc de contexto'
);

select * from finish();
rollback;
