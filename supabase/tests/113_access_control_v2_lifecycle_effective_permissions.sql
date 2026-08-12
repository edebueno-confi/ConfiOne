select plan(19);

select has_view('public', 'vw_admin_access_areas', 'read model de areas permanece disponivel');
select has_column('public', 'vw_admin_access_areas', 'dependency_count', 'read model expoe dependencias');
select has_column('public', 'vw_admin_access_areas', 'can_delete', 'read model expoe se exclusao fisica e permitida');
select has_column('public', 'vw_admin_access_areas', 'legacy_action_area_reference', 'read model sinaliza referencia legada');
select has_function('public', 'rpc_admin_delete_internal_area', 'RPC de exclusao condicionada existe');
select has_function('public', 'rpc_admin_update_internal_area', 'RPC de ciclo de vida existe');
select has_function('public', 'rpc_admin_get_internal_access_user', 'RPC de detalhe efetivo existe');
select has_trigger('public', 'internal_organizational_areas', 'internal_organizational_areas_audit_row_change', 'alteracoes de area sao auditadas');
select ok(has_function_privilege('authenticated', 'public.rpc_admin_delete_internal_area(text,boolean)', 'EXECUTE'), 'authenticated so executa exclusao pelo RPC');
select ok(not has_table_privilege('authenticated', 'public.internal_organizational_areas', 'INSERT'), 'authenticated nao insere diretamente em areas');
select ok(not has_table_privilege('authenticated', 'public.internal_organizational_areas', 'DELETE'), 'authenticated nao exclui diretamente areas');
select ok((select count(*)::integer from public.internal_organizational_areas) >= 10, 'catalogo organizacional preserva as areas existentes');
select ok(not exists (select 1 from information_schema.columns where table_schema='public' and table_name='vw_admin_access_areas' and column_name in ('token_hash','raw_token')), 'read model de areas nao expoe tokens');
select ok(not exists (select 1 from information_schema.columns where table_schema='public' and table_name='vw_admin_access_invites' and column_name in ('token_hash','raw_token')), 'read model de convites nao expoe tokens');
select ok((select pg_get_functiondef('public.rpc_admin_delete_internal_area(text,boolean)'::regprocedure) like '%p_confirmed%'), 'exclusao exige confirmacao explicita');
select ok((select pg_get_functiondef('public.rpc_admin_delete_internal_area(text,boolean)'::regprocedure) like '%deactivate it instead%'), 'dependencias bloqueiam exclusao fisica');
select ok((select pg_get_functiondef('public.rpc_admin_get_internal_access_user(uuid)'::regprocedure) like '%effective_permissions%'), 'detalhe devolve permissoes efetivas');
select ok((select pg_get_functiondef('public.rpc_admin_get_internal_access_user(uuid)'::regprocedure) like '%has_conflict%'), 'detalhe devolve conflitos');
select ok((select pg_get_functiondef('public.rpc_admin_get_internal_access_user(uuid)'::regprocedure) like '%sources%'), 'detalhe devolve origem');

select * from finish();
