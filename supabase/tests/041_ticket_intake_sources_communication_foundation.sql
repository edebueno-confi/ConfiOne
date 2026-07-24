create extension if not exists pgtap with schema extensions;

begin;

select plan(21);

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
  ('00000000-0000-0000-0000-000000000000', '11111111-aaaa-4111-8111-111111111111', 'authenticated', 'authenticated', 'admin@ticket-channel.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Channel Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '22222222-bbbb-4222-8222-222222222222', 'authenticated', 'authenticated', 'support@ticket-channel.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Channel Support"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '33333333-cccc-4333-8333-333333333333', 'authenticated', 'authenticated', 'customer@ticket-channel.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Channel Customer"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('11111111-aaaa-4111-8111-111111111111', 'platform_admin', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111'),
  ('22222222-bbbb-4222-8222-222222222222', 'support_agent', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111');

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
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
  'ticket-channel-a',
  'Ticket Channel A LTDA',
  'Ticket Channel A',
  'active',
  '11111111-aaaa-4111-8111-111111111111',
  '11111111-aaaa-4111-8111-111111111111'
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
  ('aaaaaaaa-aaaa-4aaa-8aaa-111111111111', '22222222-bbbb-4222-8222-222222222222', 'tenant_viewer', 'active', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-111111111111', '33333333-cccc-4333-8333-333333333333', 'customer_user', 'active', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111', '11111111-aaaa-4111-8111-111111111111');

insert into public.customer_account_features (
  tenant_id,
  feature_key,
  enabled,
  source,
  created_by_user_id,
  updated_by_user_id
)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
  'returns_portal',
  true,
  'contract',
  '11111111-aaaa-4111-8111-111111111111',
  '11111111-aaaa-4111-8111-111111111111'
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
  'aaaaaaaa-0001-4000-8000-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
  '33333333-cccc-4333-8333-333333333333',
  'Cliente Channel',
  'customer@ticket-channel.local',
  true,
  true,
  '11111111-aaaa-4111-8111-111111111111',
  '11111111-aaaa-4111-8111-111111111111'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_support_ticket_channel_context', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_support_ticket_communication_capabilities', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_admin_ticket_channel_definitions', 'SELECT'),
  'authenticated recebe SELECT nos read models de origem/canal'
);

select is(
  (
    select count(*)::integer
    from pg_class as c
    join pg_namespace as n
      on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'vw_support_ticket_channel_context',
        'vw_support_ticket_communication_capabilities',
        'vw_admin_ticket_channel_definitions'
      )
      and exists (
        select 1
        from unnest(coalesce(c.reloptions, array[]::text[])) as opt
        where opt = 'security_barrier=true'
      )
  ),
  3,
  'read models de origem/canal usam security_barrier'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '22222222-bbbb-4222-8222-222222222222';

select lives_ok(
  $$
    select public.rpc_create_ticket(
      'aaaaaaaa-aaaa-4aaa-8aaa-111111111111'::uuid,
      'Ticket manual de suporte',
      'Criado manualmente pelo suporte.',
      'internal'::public.ticket_source,
      'normal'::public.ticket_priority,
      'medium'::public.ticket_severity,
      'aaaaaaaa-0001-4000-8000-111111111111'::uuid,
      null,
      null
    )
  $$,
  'suporte cria ticket manual via RPC existente'
);

select is(
  (
    select origin_key
    from public.vw_support_tickets_queue
    where title = 'Ticket manual de suporte'
  ),
  'suporte_manual',
  'fila normaliza origem de ticket manual'
);

select is(
  (
    select channel_key
    from public.vw_support_tickets_queue
    where title = 'Ticket manual de suporte'
  ),
  'internal_support',
  'fila normaliza canal interno de suporte'
);

select ok(
  (
    select can_reply_now
    from public.vw_support_ticket_communication_capabilities
    where ticket_id = (
      select id from public.vw_support_tickets_queue where title = 'Ticket manual de suporte'
    )
  ),
  'ticket manual permite resposta pública registrada no ticket'
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
  'bbbbbbbb-0000-4000-8000-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
  'aaaaaaaa-0001-4000-8000-111111111111',
  'Ticket email futuro',
  'Canal externo ainda indisponivel.',
  'email',
  '22222222-bbbb-4222-8222-222222222222',
  '22222222-bbbb-4222-8222-222222222222'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '22222222-bbbb-4222-8222-222222222222';

select pass('fixture cria ticket com canal externo futuro');

select ok(
  not (
    select can_reply_now
    from public.vw_support_ticket_communication_capabilities
    where ticket_id = 'bbbbbbbb-0000-4000-8000-111111111111'::uuid
  ),
  'canal futuro nao habilita resposta externa falsa'
);

select ok(
  (
    select reason_if_unavailable
    from public.vw_support_ticket_communication_capabilities
    where ticket_id = 'bbbbbbbb-0000-4000-8000-111111111111'::uuid
  ) like '%ainda nao esta integrado%',
  'canal futuro retorna motivo operacional de bloqueio'
);

select lives_ok(
  $$
    select public.rpc_add_ticket_message(
      (select id from public.vw_support_tickets_queue where title = 'Ticket manual de suporte'),
      'Resposta publica registrada pelo suporte.'
    )
  $$,
  'suporte registra mensagem pública com metadata de comunicação'
);

select is(
  (
    select communication_direction
    from public.vw_support_ticket_timeline
    where body = 'Resposta publica registrada pelo suporte.'
  ),
  'outbound',
  'mensagem pública do suporte recebe direction outbound'
);

select lives_ok(
  $$
    select public.rpc_add_internal_ticket_note(
      (select id from public.vw_support_tickets_queue where title = 'Ticket manual de suporte'),
      'Nota interna que nao deve aparecer ao cliente.'
    )
  $$,
  'suporte registra nota interna com metadata de comunicação'
);

select is(
  (
    select communication_direction
    from public.vw_support_ticket_timeline
    where body = 'Nota interna que nao deve aparecer ao cliente.'
  ),
  'internal',
  'timeline de suporte diferencia nota interna'
);

select is(
  (
    select communication_channel_label
    from public.rpc_support_get_ticket_timeline(
      (select id from public.vw_support_tickets_queue where title = 'Ticket manual de suporte'),
      20,
      null,
      null
    )
    where body = 'Resposta publica registrada pelo suporte.'
  ),
  'Suporte interno',
  'RPC paginada de timeline propaga canal normalizado'
);

set local request.jwt.claim.sub = '33333333-cccc-4333-8333-333333333333';

select lives_ok(
  $$
    select public.rpc_customer_create_ticket(
      'aaaaaaaa-aaaa-4aaa-8aaa-111111111111'::uuid,
      'Ticket criado pelo portal P2',
      'Cliente abriu pelo portal.'
    )
  $$,
  'cliente cria ticket pelo portal com source portal'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_detail
    where title = 'Ticket criado pelo portal P2'
  ),
  1,
  'ticket criado pelo portal fica acessivel pelo read model do portal'
);

select is(
  (
    select customer_origin_label
    from public.vw_customer_portal_ticket_detail
    where title = 'Ticket criado pelo portal P2'
  ),
  'Enviado pelo portal',
  'portal recebe label customer-facing sem enum cru'
);

select lives_ok(
  $$
    select public.rpc_customer_add_ticket_message(
      (select ticket_id from public.vw_customer_portal_ticket_detail where title = 'Ticket criado pelo portal P2'),
      'Mensagem enviada pelo cliente no portal.'
    )
  $$,
  'cliente adiciona mensagem pelo portal'
);

set local role postgres;

select is(
  (
    select tm.metadata ->> 'communication_direction'
    from public.ticket_messages as tm
    join public.tickets as t
      on t.id = tm.ticket_id
     and t.tenant_id = tm.tenant_id
    where t.title = 'Ticket criado pelo portal P2'
      and tm.body = 'Mensagem enviada pelo cliente no portal.'
  ),
  'inbound',
  'mensagem do cliente recebe direction inbound'
);

set local role authenticated;
set local request.jwt.claim.sub = '33333333-cccc-4333-8333-333333333333';

select is(
  (
    select customer_entry_label
    from public.vw_customer_portal_ticket_timeline
    where body = 'Mensagem enviada pelo cliente no portal.'
  ),
  'Enviado pelo portal',
  'timeline do portal usa copy customer-facing para mensagem do cliente'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_timeline
    where body = 'Nota interna que nao deve aparecer ao cliente.'
  ),
  0,
  'portal nao recebe nota interna'
);

set local role postgres;

select *
from finish();

rollback;
