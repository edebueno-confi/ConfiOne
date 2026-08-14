create extension if not exists pgtap with schema extensions;

begin;

select plan(21);

select ok(
  exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'internal_build_tasks'
  ),
  'internal_build_tasks existe'
);

select ok(
  exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'internal_build_task_updates'
  ),
  'internal_build_task_updates existe'
);

select ok(
  exists (
    select 1
    from information_schema.views
    where table_schema = 'public'
      and table_name = 'vw_internal_build_tasks_board'
  ),
  'vw_internal_build_tasks_board existe'
);

select ok(
  exists (
    select 1
    from information_schema.views
    where table_schema = 'public'
      and table_name = 'vw_internal_build_task_updates'
  ),
  'vw_internal_build_task_updates existe'
);

select ok(
  exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'internal_build_task_status'
  ),
  'status do painel existe'
);

select ok(
  exists (
    select 1
    from pg_enum
    where enumtypid = 'public.internal_build_task_status'::regtype
      and enumlabel = 'awaiting_agent'
  ),
  'status aguardando agente existe'
);

select ok(
  exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'internal_build_task_priority'
  ),
  'prioridade do painel existe'
);

select ok(
  has_function_privilege('authenticated', 'app_private.can_access_internal_build_control()', 'EXECUTE')
  and not has_function_privilege('anon', 'app_private.can_access_internal_build_control()', 'EXECUTE'),
  'helper de acesso fica disponivel apenas para authenticated e service_role'
);

select ok(
  has_function_privilege('service_role', 'app_private.can_access_internal_build_control()', 'EXECUTE'),
  'service_role executa o helper de acesso'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rpc_internal_build_task_create'
      and p.pronargs = 5
  ),
  'RPC de criacao existe'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rpc_internal_build_task_claim'
      and p.pronargs = 1
  ),
  'RPC de assumir existe'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rpc_internal_build_task_update'
      and p.pronargs = 6
  ),
  'RPC de atualizacao existe'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rpc_internal_build_task_add_update'
      and p.pronargs = 3
  ),
  'RPC de nota existe'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_internal_build_tasks_board', 'SELECT'),
  'authenticated le o board pela view'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_internal_build_task_updates', 'SELECT'),
  'authenticated le atualizacoes pela view'
);

select ok(
  not has_table_privilege('authenticated', 'public.internal_build_tasks', 'SELECT')
  and not has_table_privilege('authenticated', 'public.internal_build_tasks', 'INSERT')
  and not has_table_privilege('authenticated', 'public.internal_build_tasks', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.internal_build_tasks', 'DELETE'),
  'authenticated nao possui acesso direto a tabela de cards'
);

select ok(
  not has_table_privilege('authenticated', 'public.internal_build_task_updates', 'SELECT')
  and not has_table_privilege('authenticated', 'public.internal_build_task_updates', 'INSERT')
  and not has_table_privilege('authenticated', 'public.internal_build_task_updates', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.internal_build_task_updates', 'DELETE'),
  'authenticated nao possui acesso direto a tabela de atualizacoes'
);

select ok(
  has_function_privilege('authenticated', 'public.rpc_internal_build_task_create(text,text,public.internal_build_task_priority,text,text[])', 'EXECUTE'),
  'authenticated executa criacao por RPC'
);

select ok(
  has_function_privilege('authenticated', 'public.rpc_internal_build_task_claim(uuid)', 'EXECUTE'),
  'authenticated executa assumir por RPC'
);

select ok(
  has_function_privilege('authenticated', 'public.rpc_internal_build_task_update(uuid,public.internal_build_task_status,text,text,text,text[])', 'EXECUTE'),
  'authenticated executa atualizacao por RPC'
);

select ok(
  pg_get_viewdef('public.vw_internal_build_tasks_board'::regclass, true) like '%confi_one_development%'
  and pg_get_viewdef('public.vw_internal_build_tasks_board'::regclass, true) like '%can_access_internal_build_control%',
  'board filtra escopo e acesso interno'
);

select * from finish();

rollback;
