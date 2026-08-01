begin;

select plan(10);

select ok(not has_table_privilege('anon', 'public.profiles', 'select'), 'anon não lê profiles diretamente');
select ok(not has_table_privilege('anon', 'public.tenants', 'select'), 'anon não lê tenants diretamente');
select ok(not has_table_privilege('anon', 'public.tenant_memberships', 'select'), 'anon não lê memberships diretamente');
select ok(not has_table_privilege('anon', 'public.tickets', 'select'), 'anon não lê tickets diretamente');
select ok(not has_table_privilege('anon', 'public.ticket_messages', 'select'), 'anon não lê mensagens diretamente');
select ok(not has_table_privilege('anon', 'public.knowledge_articles', 'select'), 'anon não lê artigos base diretamente');
select ok(not has_table_privilege('anon', 'public.vw_admin_communication_delivery_summary', 'select'), 'anon não lê read model administrativo');
select ok(not has_table_privilege('anon', 'public.vw_customer_portal_ticket_delivery_state', 'select'), 'anon não lê read model do Portal');
select ok(not has_table_privilege('anon', 'public.vw_support_ticket_delivery_capabilities', 'select'), 'anon não lê read model de Support');
select ok(has_table_privilege('authenticated', 'public.vw_support_ticket_delivery_capabilities', 'select'), 'authenticated preserva read model de Support');

select * from finish();
rollback;
