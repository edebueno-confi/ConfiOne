select plan(19);

select has_table('public', 'internal_organizational_areas', 'catalogo organizacional existe');
select has_view('public', 'vw_admin_access_internal_users', 'read model de usuarios internos existe');
select has_view('public', 'vw_admin_access_invites', 'read model de convites existe');
select has_view('public', 'vw_admin_access_areas', 'read model de areas existe');
select has_view('public', 'vw_admin_access_functions', 'read model de funcoes existe');
select has_view('public', 'vw_admin_access_profiles', 'read model de perfis existe');
select has_view('public', 'vw_admin_access_overrides', 'read model de overrides existe');
select has_view('public', 'vw_admin_access_profile_capabilities', 'read model de capabilities por perfil existe');
select has_function('public', 'rpc_admin_list_internal_access_users', 'RPC de listagem de usuarios existe');
select has_function('public', 'rpc_admin_create_internal_invitation_v2', 'RPC de convite operacional existe');
select has_function('public', 'rpc_admin_update_internal_access_assignment', 'RPC de atribuicao existe');
select has_function('public', 'rpc_admin_set_internal_user_status', 'RPC de suspensao existe');
select has_function('public', 'rpc_admin_replace_internal_profile_capabilities', 'RPC de capabilities existe');
select has_function('public', 'rpc_admin_upsert_internal_override', 'RPC de override existe');
select is((select count(*)::integer from public.internal_organizational_areas), 10, 'catalogo inicial tem dez areas organizacionais');
select ok(not exists (select 1 from information_schema.columns where table_schema='public' and table_name='vw_admin_access_invites' and column_name in ('token_hash','raw_token')), 'read model de convites nao expõe token');
select ok(not has_table_privilege('anon', 'public.internal_organizational_areas', 'select'), 'anon nao le catalogo interno');
select ok(not has_table_privilege('anon', 'public.vw_admin_access_internal_users', 'select'), 'anon nao le usuarios internos');
select ok(not has_table_privilege('authenticated', 'public.internal_organizational_areas', 'insert'), 'authenticated nao faz DML direto em areas');

select * from finish();
