begin;

select plan(5);

select ok(
  not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.hubspot_sync_runs'::regclass
      and tgname = 'hubspot_sync_runs_enqueue_dispatch'
      and not tgisinternal
  ),
  'start manual nao depende de trigger de banco para acionar o dispatcher'
);

select ok(
  to_regprocedure('app_private.enqueue_hubspot_dispatch_after_start()') is null,
  'acionador legado baseado em trigger foi removido'
);

select has_function(
  'app_private',
  'enqueue_hubspot_dispatch',
  array[]::text[],
  'enfileirador privado do scheduler permanece disponivel'
);

select is(
  has_function_privilege(
    'authenticated',
    'app_private.enqueue_hubspot_dispatch()',
    'EXECUTE'
  ),
  false,
  'usuarios autenticados nao podem executar diretamente o enfileirador privado'
);

select is(
  has_function_privilege(
    'service_role',
    'app_private.enqueue_hubspot_dispatch()',
    'EXECUTE'
  ),
  true,
  'service_role preserva o acionamento interno do scheduler'
);

select * from finish();

rollback;
