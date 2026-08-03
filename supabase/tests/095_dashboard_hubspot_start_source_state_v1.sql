begin;

select plan(5);

select has_function(
  'public',
  'rpc_analytics_hubspot_start_run',
  array['text', 'text', 'uuid']::text[],
  'o RPC de início do HubSpot permanece disponível'
);

select ok(
  position(
    'source_state = null' in pg_get_functiondef('public.rpc_analytics_hubspot_start_run(text,text,uuid)'::regprocedure)
  ) > 0,
  'o enfileiramento não publica evidência antes do worker'
);

select ok(
  position(
    'source_state = ''queued''' in pg_get_functiondef('public.rpc_analytics_hubspot_start_run(text,text,uuid)'::regprocedure)
  ) = 0,
  'o RPC não grava queued no campo de evidência da fonte'
);

select ok(
  position(
    'queued' in (
      select pg_get_constraintdef(oid)
      from pg_constraint
      where conname = 'hubspot_sync_runs_source_state_check'
        and conrelid = 'public.hubspot_sync_runs'::regclass
    )
  ) = 0,
  'a constraint de source_state não mistura execução com evidência'
);

select is(
  has_function_privilege(
    'authenticated',
    'public.rpc_analytics_hubspot_start_run(text,text,uuid)',
    'EXECUTE'
  ),
  true,
  'usuários autenticados mantêm o caminho protegido de início'
);

select * from finish();

rollback;
