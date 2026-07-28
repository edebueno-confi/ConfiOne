select plan(20);

select has_function('public', 'rpc_admin_list_internal_access_profile_capabilities', 'RPC actor-bound de capabilities existe');
select has_function('public', 'rpc_admin_list_internal_access_overrides', 'RPC actor-bound de overrides existe');
select has_function('public', 'rpc_admin_list_internal_access_profile_capabilities_v2', 'RPC jsonb de capabilities existe');
select has_function('public', 'rpc_admin_list_internal_access_overrides_v2', 'RPC jsonb de overrides existe');
select has_function('public', 'rpc_admin_list_internal_access_profiles_v2', 'RPC jsonb de perfis existe');
select has_function('public', 'rpc_admin_list_internal_access_capabilities_v2', 'RPC jsonb de capacidades existe');
select has_view('public', 'vw_admin_access_profile_capabilities', 'view adaptadora de capabilities permanece');
select has_view('public', 'vw_admin_access_overrides', 'view adaptadora de overrides permanece');
select ok(not has_function_privilege('authenticated', 'public.rpc_admin_list_internal_access_profile_capabilities()', 'execute'), 'RPC recordset legado de capabilities fica bloqueado');
select ok(not has_function_privilege('authenticated', 'public.rpc_admin_list_internal_access_overrides()', 'execute'), 'RPC recordset legado de overrides fica bloqueado');
select ok(not has_function_privilege('anon', 'public.rpc_admin_list_internal_access_profile_capabilities()', 'execute'), 'anon nao executa o RPC de capabilities');
select ok(not has_function_privilege('anon', 'public.rpc_admin_list_internal_access_overrides()', 'execute'), 'anon nao executa o RPC de overrides');
select ok(has_function_privilege('authenticated', 'public.rpc_admin_list_internal_access_profile_capabilities_v2()', 'execute'), 'authenticated executa o RPC jsonb de capabilities');
select ok(has_function_privilege('authenticated', 'public.rpc_admin_list_internal_access_overrides_v2()', 'execute'), 'authenticated executa o RPC jsonb de overrides');
select ok(not has_function_privilege('anon', 'public.rpc_admin_list_internal_access_profile_capabilities_v2()', 'execute'), 'anon nao executa o RPC jsonb de capabilities');
select ok(not has_function_privilege('anon', 'public.rpc_admin_list_internal_access_overrides_v2()', 'execute'), 'anon nao executa o RPC jsonb de overrides');
select ok(has_function_privilege('authenticated', 'public.rpc_admin_list_internal_access_profiles_v2()', 'execute'), 'authenticated executa o RPC jsonb de perfis');
select ok(has_function_privilege('authenticated', 'public.rpc_admin_list_internal_access_capabilities_v2()', 'execute'), 'authenticated executa o RPC jsonb de capacidades');
select ok(not has_function_privilege('anon', 'public.rpc_admin_list_internal_access_profiles_v2()', 'execute'), 'anon nao executa o RPC jsonb de perfis');
select ok(not has_function_privilege('anon', 'public.rpc_admin_list_internal_access_capabilities_v2()', 'execute'), 'anon nao executa o RPC jsonb de capacidades');

select * from finish();
