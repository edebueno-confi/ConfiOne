create extension if not exists pgtap with schema extensions;

begin;

select plan(12);

select ok(
  position('dashboard_viewer' in pg_get_functiondef('app_private.can_manage_knowledge_base()'::regprocedure)) = 0,
  'dashboard_viewer nao participa do gate editorial da Knowledge Base'
);

select ok(
  position('has_any_global_role' in pg_get_functiondef('app_private.can_manage_knowledge_base()'::regprocedure)) > 0
    and position('platform_admin' in pg_get_functiondef('app_private.can_manage_knowledge_base()'::regprocedure)) > 0
    and position('knowledge_manager' in pg_get_functiondef('app_private.can_manage_knowledge_base()'::regprocedure)) > 0,
  'Knowledge Base permanece restrita aos perfis editoriais autorizados'
);

select ok(
  position('can_manage_knowledge_base' in pg_get_viewdef('public.vw_admin_knowledge_spaces'::regclass)) > 0,
  'catalogo administrativo de Knowledge aceita o recorte editorial governado'
);

select ok(
  position('has_global_role(''platform_admin''::public.platform_role)' in pg_get_functiondef('public.rpc_admin_upsert_analytics_source_config(uuid,text,text,text,text,boolean)'::regprocedure)) > 0,
  'RPC de fontes do Dashboard usa o gate de escrita administrativa'
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

select ok(
  position('dashboard_viewer' in pg_get_functiondef('app_private.can_read_knowledge_article_asset(uuid,public.knowledge_visibility,public.knowledge_article_asset_review_status,boolean)'::regprocedure)) = 0,
  'dashboard_viewer nao recebe leitura indireta de assets privados'
);

select * from finish();
rollback;
