create extension if not exists pgtap with schema extensions;

begin;

select plan(5);

select ok(
  to_regprocedure('public.rpc_admin_set_global_role(uuid,public.platform_role,boolean)') is not null,
  'RPC de controle do papel dashboard_viewer existe'
);

select ok(
  has_function_privilege(
    'authenticated'::name,
    'public.rpc_admin_set_global_role(uuid,public.platform_role,boolean)'::text,
    'EXECUTE'::text
  ),
  'usuário autenticado possui EXECUTE na RPC de acesso gerencial'
);

select ok(
  not has_function_privilege(
    'anon'::name,
    'public.rpc_admin_set_global_role(uuid,public.platform_role,boolean)'::text,
    'EXECUTE'::text
  ),
  'anon não pode alterar papéis globais'
);

select ok(
  position('dashboard_viewer' in pg_get_functiondef('public.rpc_admin_set_global_role(uuid,public.platform_role,boolean)'::regprocedure)) > 0,
  'RPC restringe o papel administrável ao dashboard_viewer'
);

select ok(
  position('has_global_role' in pg_get_functiondef('public.rpc_admin_set_global_role(uuid,public.platform_role,boolean)'::regprocedure)) > 0,
  'RPC exige ator com permissão de administrador da plataforma'
);

select * from finish();
rollback;
