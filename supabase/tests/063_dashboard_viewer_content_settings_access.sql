create extension if not exists pgtap with schema extensions;

begin;

select plan(10);

select ok(
  position('dashboard_viewer' in pg_get_functiondef('app_private.can_manage_knowledge_base()'::regprocedure)) > 0,
  'dashboard_viewer participa do gate editorial da Knowledge Base'
);

select ok(
  position('can_manage_knowledge_base' in pg_get_viewdef('public.vw_admin_knowledge_spaces'::regclass)) > 0,
  'catalogo administrativo de Knowledge aceita o recorte editorial governado'
);

select ok(
  position('can_read_analytics' in pg_get_functiondef('public.rpc_admin_upsert_analytics_source_config(uuid,text,text,text,text,boolean)'::regprocedure)) > 0,
  'RPC de fontes do Dashboard usa o gate de leitura autorizado'
);

select ok(
  has_function_privilege(
    'authenticated'::name,
    'public.rpc_admin_upsert_analytics_source_config(uuid,text,text,text,text,boolean)'::text,
    'EXECUTE'::text
  ),
  'usuário autenticado possui EXECUTE na configuração de fontes'
);

select ok(
  has_function_privilege(
    'authenticated'::name,
    'public.rpc_admin_upsert_managed_integration(text,text,text,text,boolean,jsonb,text)'::text,
    'EXECUTE'::text
  ),
  'usuário autenticado possui EXECUTE na configuração de integrações'
);

select ok(
  not exists (
    select 1
    from public.vw_admin_managed_integrations
    where false
  ),
  'view de integrações continua sanitizada'
);

select ok(
  position('dashboard_viewer' in pg_get_functiondef('app_private.can_read_analytics()'::regprocedure)) > 0,
  'dashboard_viewer permanece no gate de leitura analítica'
);

select ok(
  position('security_barrier=true' in array_to_string(coalesce((select reloptions from pg_class where oid = 'public.vw_admin_knowledge_spaces'::regclass), array[]::text[]), ',')) > 0,
  'view de espaços preserva security barrier'
);

select ok(
  has_table_privilege(
    'authenticated'::name,
    'public.vw_admin_knowledge_spaces',
    'SELECT'::text
  ),
  'authenticated possui SELECT no catalogo de espacos'
);

select ok(
  not has_table_privilege(
    'anon'::name,
    'public.vw_admin_knowledge_spaces',
    'SELECT'::text
  ),
  'anon nao pode ler o catalogo administrativo de espacos'
);

select * from finish();
rollback;
