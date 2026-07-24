create extension if not exists pgtap with schema extensions;

begin;

select plan(28);

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
  ('00000000-0000-0000-0000-000000000000', '11111111-aaaa-4111-8111-111111111111', 'authenticated', 'authenticated', 'admin@collab.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Admin Collab"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '22222222-aaaa-4222-8222-222222222222', 'authenticated', 'authenticated', 'customer-a@collab.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Cliente Collab A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '33333333-aaaa-4333-8333-333333333333', 'authenticated', 'authenticated', 'manager-a@collab.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Manager Collab A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '44444444-aaaa-4444-8444-444444444444', 'authenticated', 'authenticated', 'customer-b@collab.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Cliente Collab B"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '55555555-aaaa-4555-8555-555555555555', 'authenticated', 'authenticated', 'support@collab.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support Collab"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('11111111-aaaa-4111-8111-111111111111', 'platform_admin', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111'),
  ('55555555-aaaa-4555-8555-555555555555', 'support_agent', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111');

insert into public.tenants (
  id,
  slug,
  legal_name,
  display_name,
  status,
  created_by_user_id,
  updated_by_user_id
)
values
  ('aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', 'collab-tenant-a', 'Collab Tenant A LTDA', 'Collab Tenant A', 'active', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111'),
  ('bbbbbbbb-cccc-4bbb-8bbb-bbbbbbbbbbbb', 'collab-tenant-b', 'Collab Tenant B LTDA', 'Collab Tenant B', 'active', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111');

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
  ('aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', '22222222-aaaa-4222-8222-222222222222', 'customer_user', 'active', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111'),
  ('aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', '33333333-aaaa-4333-8333-333333333333', 'customer_manager', 'active', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111'),
  ('bbbbbbbb-cccc-4bbb-8bbb-bbbbbbbbbbbb', '44444444-aaaa-4444-8444-444444444444', 'customer_user', 'active', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111');

insert into public.tenant_contacts (
  id,
  tenant_id,
  linked_user_id,
  full_name,
  email,
  is_primary,
  created_by_user_id,
  updated_by_user_id
)
values
  ('aaaaaaaa-bbbb-4000-8000-000000000001', 'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', '22222222-aaaa-4222-8222-222222222222', 'Cliente Collab A', 'customer-a@collab.local', true, '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111'),
  ('aaaaaaaa-bbbb-4000-8000-000000000002', 'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', '33333333-aaaa-4333-8333-333333333333', 'Manager Collab A', 'manager-a@collab.local', false, '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111'),
  ('bbbbbbbb-cccc-4000-8000-000000000001', 'bbbbbbbb-cccc-4bbb-8bbb-bbbbbbbbbbbb', '44444444-aaaa-4444-8444-444444444444', 'Cliente Collab B', 'customer-b@collab.local', true, '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111');

insert into public.customer_account_features (
  tenant_id,
  feature_key,
  enabled,
  source,
  created_by_user_id,
  updated_by_user_id
)
values
  ('aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', 'returns_portal', true, 'contract', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111'),
  ('bbbbbbbb-cccc-4bbb-8bbb-bbbbbbbbbbbb', 'returns_portal', true, 'contract', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111')
on conflict (tenant_id, lower(feature_key)) do update
set
  enabled = excluded.enabled,
  source = excluded.source,
  updated_by_user_id = excluded.updated_by_user_id;

insert into public.tickets (
  id,
  tenant_id,
  requester_contact_id,
  title,
  description,
  source,
  status,
  created_by_user_id,
  updated_by_user_id,
  resolved_at,
  closed_at,
  close_reason
)
values
  ('aaaaaaaa-bbbb-4000-8000-100000000001', 'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-bbbb-4000-8000-000000000001', 'Ticket aguardando cliente', 'Ticket para colaboração.', 'portal', 'waiting_customer', '22222222-aaaa-4222-8222-222222222222', '55555555-aaaa-4555-8555-555555555555', null, null, null),
  ('aaaaaaaa-bbbb-4000-8000-100000000002', 'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-bbbb-4000-8000-000000000001', 'Ticket resolvido pelo suporte', 'Ticket pronto para confirmação.', 'portal', 'resolved', '22222222-aaaa-4222-8222-222222222222', '55555555-aaaa-4555-8555-555555555555', timezone('utc', now()) - interval '1 hour', null, null),
  ('aaaaaaaa-bbbb-4000-8000-100000000003', 'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-bbbb-4000-8000-000000000001', 'Ticket encerrado', 'Ticket encerrado para reabertura.', 'portal', 'closed', '22222222-aaaa-4222-8222-222222222222', '55555555-aaaa-4555-8555-555555555555', timezone('utc', now()) - interval '2 hour', timezone('utc', now()) - interval '1 hour', 'Encerrado para validar reabertura no portal.'),
  ('bbbbbbbb-cccc-4000-8000-100000000001', 'bbbbbbbb-cccc-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-cccc-4000-8000-000000000001', 'Ticket tenant B', 'Ticket cross-tenant.', 'portal', 'waiting_customer', '44444444-aaaa-4444-8444-444444444444', '44444444-aaaa-4444-8444-444444444444', null, null, null);

insert into public.ticket_messages (
  id,
  tenant_id,
  ticket_id,
  visibility,
  body,
  created_by_user_id,
  created_at
)
values
  ('aaaaaaaa-bbbb-4000-8000-200000000001', 'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-bbbb-4000-8000-100000000001', 'customer', 'Mensagem pública inicial.', '22222222-aaaa-4222-8222-222222222222', timezone('utc', now()) - interval '30 minutes'),
  ('aaaaaaaa-bbbb-4000-8000-200000000002', 'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-bbbb-4000-8000-100000000001', 'customer', 'Resposta pública do suporte.', '55555555-aaaa-4555-8555-555555555555', timezone('utc', now()) - interval '20 minutes'),
  ('aaaaaaaa-bbbb-4000-8000-200000000003', 'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-bbbb-4000-8000-100000000001', 'internal', 'Nota interna proibida.', '55555555-aaaa-4555-8555-555555555555', timezone('utc', now()) - interval '10 minutes'),
  ('bbbbbbbb-cccc-4000-8000-200000000001', 'bbbbbbbb-cccc-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-cccc-4000-8000-100000000001', 'customer', 'Mensagem de outro tenant.', '44444444-aaaa-4444-8444-444444444444', timezone('utc', now()) - interval '10 minutes');

select app_private.create_ticket_event(
  'aaaaaaaa-bbbb-4000-8000-100000000001',
  'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa',
  'message_added',
  'customer',
  '55555555-aaaa-4555-8555-555555555555',
  jsonb_build_object('safe', true),
  'aaaaaaaa-bbbb-4000-8000-200000000002'
);

select app_private.create_ticket_event(
  'aaaaaaaa-bbbb-4000-8000-100000000001',
  'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa',
  'internal_note_added',
  'internal',
  '55555555-aaaa-4555-8555-555555555555',
  jsonb_build_object('secret', 'blocked'),
  'aaaaaaaa-bbbb-4000-8000-200000000003'
);

select app_private.create_ticket_event(
  'aaaaaaaa-bbbb-4000-8000-100000000001',
  'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa',
  'engineering_update_added',
  'internal',
  '55555555-aaaa-4555-8555-555555555555',
  jsonb_build_object('engineering', 'blocked')
);

select ok(
  has_table_privilege('authenticated', 'public.vw_customer_portal_ticket_collaboration_state', 'SELECT'),
  'authenticated pode ler o read model de colaboracao customer-facing'
);

select ok(
  not has_function_privilege('anon', 'public.rpc_customer_confirm_ticket_resolved(uuid)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.rpc_customer_confirm_ticket_resolved(uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.rpc_customer_request_ticket_reopen(uuid,text)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.rpc_customer_request_ticket_reopen(uuid,text)', 'EXECUTE'),
  'RPCs de resolucao/reabertura do cliente nao ficam expostas a anon'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vw_customer_portal_ticket_collaboration_state'
      and column_name in ('metadata', 'audit_log_id', 'engineering_work_item_id', 'internal_note')
  ),
  0,
  'estado de colaboracao nao expoe campos internos'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '22222222-aaaa-4222-8222-222222222222';

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_timeline
    where ticket_id = 'aaaaaaaa-bbbb-4000-8000-100000000001'
      and (
        body = 'Nota interna proibida.'
        or event_type in ('internal_note_added', 'engineering_update_added')
      )
  ),
  0,
  'timeline customer-facing nao expoe nota interna nem engenharia'
);

select ok(
  (
    select has_new_updates and unread_count > 0
    from public.vw_customer_portal_ticket_collaboration_state
    where ticket_id = 'aaaaaaaa-bbbb-4000-8000-100000000001'
  ),
  'estado de colaboracao deriva novas atualizacoes antes do ack'
);

select throws_ok(
  $$
    select public.rpc_customer_acknowledge_ticket_update(
      'aaaaaaaa-bbbb-4000-8000-100000000001',
      '99999999-9999-4999-8999-999999999999'
    )
  $$,
  'P0001',
  'timeline entry is not available for acknowledgement',
  'ack rejeita timeline entry indisponivel'
);

select lives_ok(
  $$
    select public.rpc_customer_acknowledge_ticket_update(
      'aaaaaaaa-bbbb-4000-8000-100000000001',
      'aaaaaaaa-bbbb-4000-8000-200000000002'
    )
  $$,
  'ack aceita timeline entry customer-facing valido'
);

select lives_ok(
  $$
    select public.rpc_customer_acknowledge_ticket_update(
      'aaaaaaaa-bbbb-4000-8000-100000000001',
      'aaaaaaaa-bbbb-4000-8000-200000000002'
    )
  $$,
  'ack e idempotente por usuario/ticket'
);

select is(
  (
    select unread_count
    from public.vw_customer_portal_ticket_collaboration_state
    where ticket_id = 'aaaaaaaa-bbbb-4000-8000-100000000001'
  ),
  0,
  'unread_count volta a zero apos ack'
);

select lives_ok(
  $$
    select public.rpc_customer_add_ticket_message(
      'aaaaaaaa-bbbb-4000-8000-100000000001',
      'Resposta do cliente depois do ack.'
    )
  $$,
  'customer responde ticket permitido'
);

select is(
  (
    select internal_status
    from public.vw_customer_portal_ticket_detail
    where ticket_id = 'aaaaaaaa-bbbb-4000-8000-100000000001'
  ),
  'waiting_support'::public.ticket_status,
  'resposta do cliente move ticket waiting_customer para waiting_support pelo backend'
);

select ok(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_timeline
    where ticket_id = 'aaaaaaaa-bbbb-4000-8000-100000000001'
      and event_type in ('message_added', 'status_changed')
  ) >= 2,
  'resposta do cliente gera ticket_event customer-facing'
);

select throws_ok(
  $$ select public.rpc_customer_add_ticket_message('aaaaaaaa-bbbb-4000-8000-100000000001', '   ') $$,
  'P0001',
  'ticket message body is required',
  'body vazio bloqueado'
);

select throws_ok(
  $$ select public.rpc_customer_add_ticket_message('aaaaaaaa-bbbb-4000-8000-100000000001', repeat('x', 4001)) $$,
  'P0001',
  'ticket message body is too long',
  'body grande bloqueado'
);

select throws_ok(
  $$ select public.rpc_customer_add_ticket_message('bbbbbbbb-cccc-4000-8000-100000000001', 'cross tenant') $$,
  'P0001',
  'rpc_customer_add_ticket_message denied',
  'resposta cross-tenant bloqueada'
);

select throws_ok(
  $$ select public.rpc_customer_add_ticket_message('aaaaaaaa-bbbb-4000-8000-100000000002', 'resposta em resolvido') $$,
  'P0001',
  'ticket is not open for customer messages',
  'cliente nao responde ticket resolvido; deve confirmar ou reabrir'
);

select ok(
  (
    select can_confirm_resolution and can_request_reopen and not can_reply
    from public.vw_customer_portal_ticket_collaboration_state
    where ticket_id = 'aaaaaaaa-bbbb-4000-8000-100000000002'
  ),
  'ticket resolvido expõe confirmacao e reabertura, mas nao resposta livre'
);

select lives_ok(
  $$ select public.rpc_customer_confirm_ticket_resolved('aaaaaaaa-bbbb-4000-8000-100000000002') $$,
  'cliente confirma resolucao de ticket resolvido'
);

select is(
  (
    select internal_status
    from public.vw_customer_portal_ticket_detail
    where ticket_id = 'aaaaaaaa-bbbb-4000-8000-100000000002'
  ),
  'closed'::public.ticket_status,
  'confirmacao do cliente fecha somente ticket resolvido'
);

select throws_ok(
  $$ select public.rpc_customer_confirm_ticket_resolved('aaaaaaaa-bbbb-4000-8000-100000000001') $$,
  'P0001',
  'ticket is not resolved',
  'cliente nao fecha ticket arbitrariamente'
);

select throws_ok(
  $$ select public.rpc_customer_request_ticket_reopen('aaaaaaaa-bbbb-4000-8000-100000000003', '   ') $$,
  'P0001',
  'reopen reason is required',
  'reabertura exige motivo'
);

select lives_ok(
  $$ select public.rpc_customer_request_ticket_reopen('aaaaaaaa-bbbb-4000-8000-100000000003', 'O problema voltou a ocorrer na operacao.') $$,
  'cliente solicita reabertura de ticket encerrado'
);

select is(
  (
    select internal_status
    from public.vw_customer_portal_ticket_detail
    where ticket_id = 'aaaaaaaa-bbbb-4000-8000-100000000003'
  ),
  'waiting_support'::public.ticket_status,
  'solicitacao de reabertura volta ticket para suporte'
);

select throws_ok(
  $$ select public.rpc_customer_request_ticket_reopen('aaaaaaaa-bbbb-4000-8000-100000000001', 'Tentar reabrir ticket aberto') $$,
  'P0001',
  'ticket is not reopenable',
  'cliente nao reabre ticket que ainda esta aberto'
);

reset role;

select ok(
  (
    select count(*)::integer
    from audit.audit_logs
    where actor_user_id = '22222222-aaaa-4222-8222-222222222222'
      and entity_table in ('tickets', 'ticket_messages', 'customer_ticket_update_acknowledgements')
  ) >= 4,
  'mutacoes customer-facing geram audit_log'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '22222222-aaaa-4222-8222-222222222222';

select throws_like(
  $$
    insert into public.ticket_messages (
      tenant_id,
      ticket_id,
      visibility,
      body,
      created_by_user_id
    )
    values (
      'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa',
      'aaaaaaaa-bbbb-4000-8000-100000000001',
      'customer',
      'DML direto proibido',
      '22222222-aaaa-4222-8222-222222222222'
    )
  $$,
  '%permission denied%',
  'DML direto em ticket_messages falha para authenticated'
);

set local request.jwt.claim.sub = '33333333-aaaa-4333-8333-333333333333';

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_collaboration_state
    where tenant_id = 'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  3,
  'customer_manager le estado de colaboracao dos tickets do proprio tenant'
);

set local request.jwt.claim.sub = '44444444-aaaa-4444-8444-444444444444';

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_collaboration_state
    where tenant_id = 'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  0,
  'customer de outro tenant nao le estado de colaboracao cross-tenant'
);

reset role;

select * from finish();
rollback;
