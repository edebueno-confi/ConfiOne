create extension if not exists pgtap with schema extensions;

begin;

select plan(20);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-dddd-4111-8111-111111111111', 'authenticated', 'authenticated', 'admin@delivery.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Delivery Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '22222222-dddd-4222-8222-222222222222', 'authenticated', 'authenticated', 'support@delivery.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Delivery Support"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '33333333-dddd-4333-8333-333333333333', 'authenticated', 'authenticated', 'customer@delivery.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Delivery Customer"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('11111111-dddd-4111-8111-111111111111', 'platform_admin', '11111111-dddd-4111-8111-111111111111', '11111111-dddd-4111-8111-111111111111'),
  ('22222222-dddd-4222-8222-222222222222', 'support_agent', '11111111-dddd-4111-8111-111111111111', '11111111-dddd-4111-8111-111111111111');

insert into public.tenants (
  id,
  slug,
  legal_name,
  display_name,
  status,
  created_by_user_id,
  updated_by_user_id
)
values (
  'aaaaaaaa-dddd-4aaa-8aaa-111111111111',
  'delivery-a',
  'Delivery A LTDA',
  'Delivery A',
  'active',
  '11111111-dddd-4111-8111-111111111111',
  '11111111-dddd-4111-8111-111111111111'
);

insert into public.tenant_memberships (
  tenant_id,
  user_id,
  role,
  status,
  invited_by_user_id,
  created_by_user_id,
  updated_by_user_id
)
values
  ('aaaaaaaa-dddd-4aaa-8aaa-111111111111', '22222222-dddd-4222-8222-222222222222', 'tenant_viewer', 'active', '11111111-dddd-4111-8111-111111111111', '11111111-dddd-4111-8111-111111111111', '11111111-dddd-4111-8111-111111111111'),
  ('aaaaaaaa-dddd-4aaa-8aaa-111111111111', '33333333-dddd-4333-8333-333333333333', 'customer_user', 'active', '11111111-dddd-4111-8111-111111111111', '11111111-dddd-4111-8111-111111111111', '11111111-dddd-4111-8111-111111111111');

insert into public.customer_account_features (
  tenant_id,
  feature_key,
  enabled,
  source,
  created_by_user_id,
  updated_by_user_id
)
values (
  'aaaaaaaa-dddd-4aaa-8aaa-111111111111',
  'returns_portal',
  true,
  'contract',
  '11111111-dddd-4111-8111-111111111111',
  '11111111-dddd-4111-8111-111111111111'
);

insert into public.tenant_contacts (
  id,
  tenant_id,
  linked_user_id,
  full_name,
  email,
  is_primary,
  is_active,
  created_by_user_id,
  updated_by_user_id
)
values (
  'aaaaaaaa-dddd-4000-8000-111111111111',
  'aaaaaaaa-dddd-4aaa-8aaa-111111111111',
  '33333333-dddd-4333-8333-333333333333',
  'Cliente Delivery',
  'customer@delivery.local',
  true,
  true,
  '11111111-dddd-4111-8111-111111111111',
  '11111111-dddd-4111-8111-111111111111'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_support_ticket_message_deliveries', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_support_ticket_delivery_capabilities', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_customer_portal_ticket_delivery_state', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_admin_communication_delivery_summary', 'SELECT'),
  'authenticated recebe SELECT apenas nos read models de delivery'
);

select ok(
  not has_table_privilege('authenticated', 'public.ticket_message_deliveries', 'SELECT')
  and not has_table_privilege('authenticated', 'public.ticket_message_deliveries', 'INSERT')
  and not has_table_privilege('authenticated', 'public.ticket_message_deliveries', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.ticket_message_deliveries', 'DELETE'),
  'authenticated nao recebe DML direto no ledger de delivery'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vw_customer_portal_ticket_timeline'
      and column_name = 'delivery_provider_state'
  ),
  0,
  'portal nao expoe provider_state tecnico'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '22222222-dddd-4222-8222-222222222222';

select lives_ok(
  $$
    select public.rpc_create_ticket(
      'aaaaaaaa-dddd-4aaa-8aaa-111111111111'::uuid,
      'Ticket delivery suporte',
      'Criado pelo suporte para validar delivery.',
      'internal'::public.ticket_source,
      'normal'::public.ticket_priority,
      'medium'::public.ticket_severity,
      'aaaaaaaa-dddd-4000-8000-111111111111'::uuid,
      null,
      null
    )
  $$,
  'suporte cria ticket manual para delivery'
);

select lives_ok(
  $$
    select public.rpc_add_ticket_message(
      (select id from public.vw_support_tickets_queue where title = 'Ticket delivery suporte'),
      'Resposta publica disponivel no portal.'
    )
  $$,
  'suporte registra resposta publica com delivery native do Portal'
);

select is(
  (
    select delivery_status
    from public.vw_support_ticket_timeline
    where body = 'Resposta publica disponivel no portal.'
  ),
  'delivered'::public.ticket_delivery_status,
  'timeline de suporte recebe delivery_status delivered'
);

select is(
  (
    select delivery_provider_state
    from public.vw_support_ticket_timeline
    where body = 'Resposta publica disponivel no portal.'
  ),
  'native'::public.ticket_delivery_provider_state,
  'delivery do Portal usa provider_state native'
);

select is(
  (
    select delivery_status_label
    from public.rpc_support_get_ticket_timeline(
      (select id from public.vw_support_tickets_queue where title = 'Ticket delivery suporte'),
      20,
      null,
      null
    )
    where body = 'Resposta publica disponivel no portal.'
  ),
  'Disponivel no Portal',
  'RPC paginada propaga label de delivery sanitizado'
);

select lives_ok(
  $$
    select public.rpc_add_internal_ticket_note(
      (select id from public.vw_support_tickets_queue where title = 'Ticket delivery suporte'),
      'Nota interna sem delivery customer-facing.'
    )
  $$,
  'suporte registra nota interna'
);

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_message_deliveries
    where ticket_id = (select id from public.vw_support_tickets_queue where title = 'Ticket delivery suporte')
      and message_id in (
        select timeline_entry_id
        from public.vw_support_ticket_timeline
        where body = 'Nota interna sem delivery customer-facing.'
      )
  ),
  0,
  'nota interna nao gera delivery customer-facing'
);

set local role postgres;

insert into public.tickets (
  id,
  tenant_id,
  requester_contact_id,
  title,
  description,
  source,
  created_by_user_id,
  updated_by_user_id
)
values (
  'bbbbbbbb-dddd-4000-8000-111111111111',
  'aaaaaaaa-dddd-4aaa-8aaa-111111111111',
  'aaaaaaaa-dddd-4000-8000-111111111111',
  'Ticket email futuro delivery',
  'Canal externo bloqueado para readiness.',
  'email',
  '22222222-dddd-4222-8222-222222222222',
  '22222222-dddd-4222-8222-222222222222'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '22222222-dddd-4222-8222-222222222222';

select ok(
  not (
    select can_deliver_now
    from public.vw_support_ticket_delivery_capabilities
    where ticket_id = 'bbbbbbbb-dddd-4000-8000-111111111111'::uuid
      and channel = 'email_future'::public.ticket_delivery_channel
  ),
  'email futuro nao habilita delivery'
);

select is(
  (
    select provider_state
    from public.vw_support_ticket_delivery_capabilities
    where ticket_id = 'bbbbbbbb-dddd-4000-8000-111111111111'::uuid
      and channel = 'email_future'::public.ticket_delivery_channel
  ),
  'not_configured'::public.ticket_delivery_provider_state,
  'email futuro fica not_configured'
);

select throws_like(
  $$
    select public.rpc_add_ticket_message(
      'bbbbbbbb-dddd-4000-8000-111111111111'::uuid,
      'Nao deve simular envio externo.'
    )
  $$,
  '%ainda nao esta integrado%',
  'RPC bloqueia resposta publica em canal externo futuro'
);

set local request.jwt.claim.sub = '33333333-dddd-4333-8333-333333333333';

select lives_ok(
  $$
    select public.rpc_customer_create_ticket(
      'aaaaaaaa-dddd-4aaa-8aaa-111111111111'::uuid,
      'Ticket portal delivery',
      'Cliente abriu pelo portal.'
    )
  $$,
  'cliente cria ticket pelo Portal'
);

select lives_ok(
  $$
    select public.rpc_customer_add_ticket_message(
      (select ticket_id from public.vw_customer_portal_ticket_detail where title = 'Ticket portal delivery'),
      'Mensagem inbound pelo portal.'
    )
  $$,
  'cliente registra mensagem inbound com delivery native'
);

select is(
  (
    select customer_delivery_label
    from public.vw_customer_portal_ticket_timeline
    where body = 'Mensagem inbound pelo portal.'
  ),
  'Enviado pelo portal',
  'portal ve apenas label customer-facing de delivery'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_timeline
    where body = 'Nota interna sem delivery customer-facing.'
  ),
  0,
  'portal segue sem nota interna'
);

set local role postgres;

select is(
  (
    select count(*)::integer
    from audit.audit_logs
    where entity_table = 'ticket_message_deliveries'
      and entity_id in (
        select delivery.id
        from public.ticket_message_deliveries as delivery
        join public.ticket_messages as message
          on message.id = delivery.message_id
        where message.body in (
          'Resposta publica disponivel no portal.',
          'Mensagem inbound pelo portal.'
        )
      )
  ),
  2,
  'ledger de delivery gera audit log por insert'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '22222222-dddd-4222-8222-222222222222';

select throws_like(
  $$
    insert into public.ticket_message_deliveries (
      tenant_id,
      ticket_id,
      message_id,
      channel,
      direction,
      status,
      provider_state,
      created_by_user_id
    )
    values (
      'aaaaaaaa-dddd-4aaa-8aaa-111111111111'::uuid,
      (select id from public.vw_support_tickets_queue where title = 'Ticket delivery suporte'),
      (select message_id from public.vw_support_ticket_timeline where body = 'Resposta publica disponivel no portal.'),
      'customer_portal'::public.ticket_delivery_channel,
      'outbound'::public.ticket_delivery_direction,
      'delivered'::public.ticket_delivery_status,
      'native'::public.ticket_delivery_provider_state,
      '22222222-dddd-4222-8222-222222222222'::uuid
    )
  $$,
  '%permission denied%',
  'DML direto no ledger de delivery falha para authenticated'
);

set local role postgres;

select is(
  (
    select count(*)::integer
    from public.vw_admin_communication_delivery_summary
  ),
  0,
  'admin summary respeita contexto e nao vaza sem actor platform_admin'
);

set local role postgres;

select *
from finish();

rollback;
