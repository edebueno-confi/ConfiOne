create extension if not exists pgtap with schema extensions;

begin;

select plan(19);

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
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'admin@support-intake.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Platform Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'support-a@support-intake.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'authenticated', 'authenticated', 'support-b@support-intake.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support B"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'platform_admin', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'support_agent', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'support_agent', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
  ('11111111-1111-4111-8111-111111111111', 'support-intake-a', 'Support Intake A LTDA', 'Support Intake A', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222', 'support-intake-b', 'Support Intake B LTDA', 'Support Intake B', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('33333333-3333-4333-8333-333333333333', 'support-intake-c', 'Support Intake C LTDA', 'Support Intake C', 'suspended', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
  ('11111111-1111-4111-8111-111111111111', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'tenant_viewer', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('33333333-3333-4333-8333-333333333333', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'tenant_viewer', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'tenant_viewer', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
values
  ('30000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', null, 'Contato A', 'contato-a@support-intake.local', true, true, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('30000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', null, 'Contato B', 'contato-b@support-intake.local', true, true, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select ok(
  has_table_privilege('authenticated', 'public.vw_support_ticket_intake_tenants', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_support_ticket_intake_contacts', 'SELECT'),
  'authenticated recebe apenas SELECT nos read models de intake'
);

select is(
  (
    select count(*)::integer
    from pg_class as c
    join pg_namespace as n
      on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('vw_support_ticket_intake_tenants', 'vw_support_ticket_intake_contacts')
      and exists (
        select 1
        from unnest(coalesce(c.reloptions, array[]::text[])) as opt
        where opt = 'security_barrier=true'
      )
  ),
  2,
  'views de intake usam security_barrier como hardening explícito'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_intake_tenants
  ),
  2,
  'support_agent vê apenas os tenants elegíveis do próprio escopo operacional'
);

select is(
  (
    select active_contacts_count
    from public.vw_support_ticket_intake_tenants
    where tenant_id = '11111111-1111-4111-8111-111111111111'::uuid
  ),
  1,
  'tenant com contato ativo expõe contagem correta no intake'
);

select ok(
  (
    select not has_active_contacts
    from public.vw_support_ticket_intake_tenants
    where tenant_id = '33333333-3333-4333-8333-333333333333'::uuid
  ),
  'tenant sem contato ativo permanece elegível com flag explícita de indisponibilidade'
);

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_intake_contacts
    where tenant_id = '11111111-1111-4111-8111-111111111111'::uuid
  ),
  1,
  'intake de contatos retorna somente contatos ativos do tenant elegível'
);

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_intake_contacts
    where tenant_id = '33333333-3333-4333-8333-333333333333'::uuid
  ),
  0,
  'tenant sem contato ativo não vaza linha fantasma no read model de contatos'
);

select lives_ok(
  $$
    select public.rpc_create_ticket(
      '33333333-3333-4333-8333-333333333333'::uuid,
      'Ticket intake sem solicitante',
      'Criado via fluxo real de intake sem contato ativo disponível.',
      'internal',
      'normal',
      'medium',
      null
    )
  $$,
  'support_agent cria ticket por RPC mesmo sem solicitante vinculado quando o tenant é elegível'
);

select is(
  (
    select count(*)::integer
    from public.vw_support_tickets_queue
    where title = 'Ticket intake sem solicitante'
  ),
  1,
  'ticket criado por intake entra na fila real de suporte'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select is(
  (
    select count(*)::integer
    from public.ticket_events
    where ticket_id = (
      select id
      from public.tickets
      where title = 'Ticket intake sem solicitante'
      limit 1
    )
      and event_type = 'ticket_created'
  ),
  1,
  'criação via intake registra ticket_event inicial'
);

select ok(
  (
    select count(*)::integer
    from audit.audit_logs as audit_log
    where audit_log.tenant_id = '33333333-3333-4333-8333-333333333333'::uuid
      and audit_log.entity_table in ('tickets', 'ticket_events')
      and audit_log.action = 'insert'
  ) >= 2,
  'criação via intake gera audit trail para ticket e evento inicial'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select throws_ok(
  $$
    select public.rpc_create_ticket(
      '33333333-3333-4333-8333-333333333333'::uuid,
      'Ticket cross requester',
      'Tentativa inválida com contato de outro tenant.',
      'internal',
      'normal',
      'medium',
      '30000000-0000-4000-8000-000000000002'::uuid
    )
  $$,
  'P0001',
  'requester contact not found for tenant',
  'requester_contact_id precisa pertencer ao tenant explícito do intake'
);

select throws_ok(
  $$
    select public.rpc_create_ticket(
      null,
      'Ticket sem tenant',
      'Falha esperada por tenant ausente.',
      'internal',
      'normal',
      'medium',
      null
    )
  $$,
  'P0001',
  'rpc_create_ticket denied',
  'tenant explícito continua obrigatório para abertura de ticket'
);

select throws_ok(
  $$
    select public.rpc_create_ticket(
      '11111111-1111-4111-8111-111111111111'::uuid,
      '   ',
      'Descricao com título vazio.',
      'internal',
      'normal',
      'medium',
      null
    )
  $$,
  '23514',
  'new row for relation "tickets" violates check constraint "tickets_title_not_blank_check"',
  'título em branco é bloqueado no backend'
);

select throws_ok(
  $$
    select public.rpc_create_ticket(
      '11111111-1111-4111-8111-111111111111'::uuid,
      'Ticket com origem inválida',
      'Payload com enum inválido.',
      'fax',
      'normal',
      'medium',
      null
    )
  $$,
  '22P02',
  'invalid input value for enum ticket_source: "fax"',
  'origem fora do contrato é rejeitada no backend'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';

select throws_ok(
  $$
    select public.rpc_create_ticket(
      '11111111-1111-4111-8111-111111111111'::uuid,
      'Ticket sem ator',
      'A autenticação é obrigatória.',
      'internal',
      'normal',
      'medium',
      null
    )
  $$,
  'P0001',
  'authentication required',
  'RPC de intake exige ator autenticado ativo'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_intake_tenants
  ),
  1,
  'support_agent de outro tenant vê apenas o próprio tenant elegível'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_intake_tenants
  ),
  3,
  'platform_admin vê todos os tenants elegíveis para intake'
);

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_intake_contacts
  ),
  2,
  'platform_admin vê apenas contatos ativos realmente existentes'
);

select * from finish();
rollback;
