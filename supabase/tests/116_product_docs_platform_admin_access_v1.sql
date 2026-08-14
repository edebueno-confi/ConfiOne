create extension if not exists pgtap with schema extensions;

begin;

select plan(6);

select ok(
  exists (
    select 1
    from public.internal_capabilities
    where capability_key = 'product_docs.view'
      and is_active
  ),
  'capacidade product_docs.view existe e esta ativa'
);

select ok(
  exists (
    select 1
    from public.internal_screen_capability_requirements
    where screen_key = 'product_docs'
      and capability_key = 'product_docs.view'
  ),
  'Documentos exige a capacidade product_docs.view'
);

select ok(
  exists (
    select 1
    from public.internal_role_capability_grants
    where role = 'platform_admin'::public.platform_role
      and capability_key = 'product_docs.view'
  ),
  'platform_admin recebe a capacidade de Documentos'
);

select ok(
  exists (
    select 1
    from public.internal_screen_catalog
    where screen_key = 'product_docs'
      and is_active
      and release_enabled
      and release_stage = 'released'
  ),
  'Documentos esta publicado no catalogo de telas'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.rpc_admin_update_profile_display_name(uuid,text)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'public.rpc_admin_update_profile_display_name(uuid,text)',
    'EXECUTE'
  ),
  'alteracao de nome fica disponivel apenas para authenticated e service_role'
);

select ok(
  pg_get_functiondef('app_private.internal_actor_workspace_context()'::regprocedure)
    like '%release_enabled%'
    and pg_get_functiondef('app_private.internal_actor_workspace_context()'::regprocedure)
      like '%has_internal_capability%',
  'contexto de telas respeita release e capacidade'
);

select * from finish();

rollback;
