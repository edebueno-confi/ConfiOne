create extension if not exists pgtap with schema extensions;

begin;

select plan(5);

select ok(
  to_regprocedure('public.rpc_internal_build_task_edit(uuid,text,text,public.internal_build_task_priority,text,text[])') is not null,
  'edit RPC exists'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.rpc_internal_build_task_edit(uuid,text,text,public.internal_build_task_priority,text,text[])',
    'EXECUTE'
  ),
  'authenticated can execute edit RPC'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.rpc_internal_build_task_edit(uuid,text,text,public.internal_build_task_priority,text,text[])',
    'EXECUTE'
  ),
  'anon cannot execute edit RPC'
);

select ok(
  pg_get_functiondef('public.rpc_internal_build_task_edit(uuid,text,text,public.internal_build_task_priority,text,text[])'::regprocedure)
    like '%workspace_key = ''confi_one_development''%'
    and pg_get_functiondef('public.rpc_internal_build_task_edit(uuid,text,text,public.internal_build_task_priority,text,text[])'::regprocedure)
      like '%can_access_internal_build_control%'
    and pg_get_functiondef('public.rpc_internal_build_task_edit(uuid,text,text,public.internal_build_task_priority,text,text[])'::regprocedure)
      like '%updated_by_user_id%',
  'edit RPC enforces scope, access and actor audit'
);

select ok(
  pg_get_functiondef('public.rpc_internal_build_task_edit(uuid,text,text,public.internal_build_task_priority,text,text[])'::regprocedure)
    like '%cancelled internal build task cannot be edited%',
  'cancelled cards stay immutable through the edit flow'
);

select * from finish();

rollback;
