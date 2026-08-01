begin;

select plan(18);

select has_table('public', 'user_actor_contexts', 'contexto explicito de ator existe');
select has_table('public', 'internal_functions', 'catalogo de funcoes existe');
select has_table('public', 'internal_capabilities', 'catalogo de capacidades existe');
select has_table('public', 'internal_invites', 'convites internos existem');
select has_table('public', 'internal_user_capability_overrides', 'overrides existem');
select has_view('public', 'vw_internal_actor_capability_context', 'read model de capacidades existe');
select has_view('public', 'vw_admin_internal_invites', 'read model de convites existe');

select has_column('public', 'internal_screen_catalog', 'release_enabled', 'allowlist possui release_enabled');
select has_column('public', 'internal_screen_catalog', 'release_stage', 'allowlist possui release_stage');
select has_function('app_private', 'has_internal_capability', 'funcao canonica de capacidade existe');
select has_function('public', 'rpc_admin_create_internal_invitation', 'RPC de convite existe');
select has_function('public', 'rpc_accept_internal_invitation', 'RPC de aceite existe');

select is((select release_stage::text from public.internal_screen_catalog where screen_key='analytics'), 'released', 'Dashboard esta liberado');
select is((select release_stage::text from public.internal_screen_catalog where screen_key='knowledge'), 'released', 'Knowledge esta liberado');
select is((select release_stage::text from public.internal_screen_catalog where screen_key='access'), 'released', 'Acessos esta liberado');
select is((select count(*)::int from public.internal_screen_capability_requirements where screen_key='analytics'), 1, 'Dashboard exige uma capacidade canonica');
select is((select count(*)::int from public.internal_role_capability_grants where role='dashboard_viewer'::public.platform_role and capability_key like 'analytics.%'), 6, 'dashboard_viewer possui somente capacidades analiticas');
select ok(not has_table_privilege('anon', 'public.internal_invites', 'select'), 'anon nao le convites');

select * from finish();
rollback;
