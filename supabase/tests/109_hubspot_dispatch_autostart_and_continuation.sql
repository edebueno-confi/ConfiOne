begin;

select plan(5);

select has_function(
  'app_private',
  'enqueue_hubspot_dispatch_after_start',
  array[]::text[],
  'a funcao privada de acionamento automatico do dispatcher existe'
);

select has_trigger(
  'public',
  'hubspot_sync_runs',
  'hubspot_sync_runs_enqueue_dispatch',
  'uma execucao HubSpot enfileirada aciona o dispatcher'
);

select ok(
  position(
    'app_private.enqueue_hubspot_dispatch()' in pg_get_functiondef(
      'app_private.enqueue_hubspot_dispatch_after_start()'::regprocedure
    )
  ) > 0,
  'o gatilho reutiliza o enfileirador que le o segredo somente no Vault'
);

select is(
  has_function_privilege(
    'authenticated',
    'app_private.enqueue_hubspot_dispatch_after_start()',
    'EXECUTE'
  ),
  false,
  'usuarios autenticados nao podem executar diretamente o acionador privado'
);

select is(
  has_function_privilege(
    'service_role',
    'app_private.enqueue_hubspot_dispatch_after_start()',
    'EXECUTE'
  ),
  false,
  'service_role tambem aciona apenas pelo trigger, nao pela API'
);

select * from finish();

rollback;
