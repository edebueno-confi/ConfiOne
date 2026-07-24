create extension if not exists pgtap with schema extensions;

begin;

select plan(3);

select ok(
  to_regprocedure('public.rpc_analytics_ceo_snapshot_legacy(date,date)') is not null,
  'RPC legada do snapshot executivo existe'
);

select ok(
  not has_function_privilege(
    'anon'::name,
    'public.rpc_analytics_ceo_snapshot_legacy(date,date)'::text,
    'EXECUTE'::text
  ),
  'anon nao possui EXECUTE na RPC legada'
);

select ok(
  not has_function_privilege(
    'authenticated'::name,
    'public.rpc_analytics_ceo_snapshot_legacy(date,date)'::text,
    'EXECUTE'::text
  ),
  'authenticated nao possui EXECUTE na RPC legada'
);

select * from finish();
rollback;
