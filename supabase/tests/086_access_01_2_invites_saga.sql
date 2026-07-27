begin;
select plan(10);

select has_function('public', 'rpc_accept_internal_invitation_by_id', 'aceite idempotente por invite id existe');
select has_function('public', 'rpc_internal_invitation_delivery_update', 'atualizacao de entrega server-side existe');
select has_function('public', 'rpc_admin_set_internal_user_status', 'status de usuario preserva RPC administrativa');
select has_column('public', 'internal_invites', 'auth_user_id', 'convite guarda identidade Auth apos aceite');
select has_column('public', 'internal_invites', 'delivery_attempts', 'convite contabiliza tentativas sem token');
select has_column('public', 'internal_invites', 'last_delivery_error', 'convite registra erro sanitizado');
select ok(exists(select 1 from pg_trigger where tgname = 'guard_last_platform_admin_profile'), 'perfil tem guarda do ultimo administrador');
select ok(exists(select 1 from pg_trigger where tgname = 'guard_last_platform_admin_role'), 'papel global tem guarda do ultimo administrador');
select ok(not exists(select 1 from information_schema.routines where routine_schema = 'public' and routine_name = 'rpc_internal_invitation_delivery_update' and specific_name like '%service%'), 'delivery nao expoe assinatura adicional publica');
select ok(exists(select 1 from pg_proc where proname = 'rpc_admin_set_internal_user_status' and pg_get_function_arguments(oid) like '%p_justification%'), 'status privilegiado aceita justificativa');

select * from finish();
rollback;
