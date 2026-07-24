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
  ('00000000-0000-0000-0000-000000000000', '40000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'admin@internal-actions-closure.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Platform Admin Closure"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '40000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'support@internal-actions-closure.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support Closure"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '40000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'finance@internal-actions-closure.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Finance Closure"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '40000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'outsider@internal-actions-closure.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Outsider Closure"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '40000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'operations-empty@internal-actions-closure.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Operations Empty Closure"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('40000000-0000-4000-8000-000000000001', 'platform_admin', '40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('40000000-0000-4000-8000-000000000002', 'support_manager', '40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001');

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
  ('40000000-0000-4000-8000-000000000010', 'internal-actions-closure-a', 'Internal Actions Closure A LTDA', 'Internal Actions Closure A', 'active', '40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('40000000-0000-4000-8000-000000000020', 'internal-actions-closure-b', 'Internal Actions Closure B LTDA', 'Internal Actions Closure B', 'active', '40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001');

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
  ('40000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000002', 'tenant_admin', 'active', '40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('40000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000003', 'tenant_viewer', 'active', '40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('40000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000005', 'tenant_viewer', 'active', '40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('40000000-0000-4000-8000-000000000020', '40000000-0000-4000-8000-000000000004', 'tenant_viewer', 'active', '40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001');

insert into public.tickets (
  id,
  tenant_id,
  title,
  description,
  source,
  status,
  priority,
  severity,
  created_by_user_id,
  updated_by_user_id
)
values (
  '40000000-0000-4000-8000-000000000100',
  '40000000-0000-4000-8000-000000000010',
  'Ticket com acionamento operacional',
  'Ticket usado para testar fila operacional da área interna.',
  'internal',
  'in_progress',
  'high',
  'medium',
  '40000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '40000000-0000-4000-8000-000000000001';

select lives_ok(
  $$
    select public.rpc_admin_add_internal_area_membership(
      '40000000-0000-4000-8000-000000000010'::uuid,
      '40000000-0000-4000-8000-000000000003'::uuid,
      'finance',
      'member'::public.internal_area_membership_role,
      'active'::public.internal_area_membership_status
    )
  $$,
  'platform_admin adiciona membership de área interna por RPC'
);

select lives_ok(
  $$
    select public.rpc_admin_add_internal_area_membership(
      '40000000-0000-4000-8000-000000000010'::uuid,
      '40000000-0000-4000-8000-000000000005'::uuid,
      'operations',
      'member'::public.internal_area_membership_role,
      'active'::public.internal_area_membership_status
    )
  $$,
  'platform_admin adiciona membership de área interna sem acionamentos'
);

select is(
  (
    select count(*)::integer
    from public.vw_admin_internal_area_memberships
    where user_id = '40000000-0000-4000-8000-000000000003'
      and area_key = 'finance'
      and status = 'active'
  ),
  1,
  'admin read model expõe membership criado para governança'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '40000000-0000-4000-8000-000000000005';

select is(
  (
    select count(*)::integer
    from public.vw_internal_action_area_auth_context
    where area_key = 'operations'
      and can_view_queue
  ),
  1,
  'membro com membership ativo e zero acionamentos tem contexto de área'
);

select is(
  (
    select visible_open_action_count
    from public.vw_internal_action_area_auth_context
    where area_key = 'operations'
  ),
  0,
  'contexto de área sem demanda informa zero acionamentos abertos'
);

select is(
  (
    select count(*)::integer
    from public.vw_internal_action_queue_by_area
  ),
  0,
  'membro de área sem demanda não enxerga fila de outra área'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '40000000-0000-4000-8000-000000000002';

select lives_ok(
  $$
    select public.rpc_support_create_internal_action(
      '40000000-0000-4000-8000-000000000100'::uuid,
      'finance',
      'analysis'::public.internal_action_support_type,
      'high'::public.ticket_priority,
      'Validar cobrança operacional',
      'Financeiro precisa validar cobrança antes da resposta final ao cliente.',
      null,
      null
    )
  $$,
  'suporte cria acionamento interno sem responsável inicial'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select is(
  (
    select status::text
    from public.tickets
    where id = '40000000-0000-4000-8000-000000000100'
  ),
  'in_progress',
  'criação do acionamento não altera ticket.status'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '40000000-0000-4000-8000-000000000003';

select is(
  (
    select count(*)::integer
    from public.vw_internal_action_queue_by_area
    where summary = 'Validar cobrança operacional'
  ),
  1,
  'membro ativo da área vê o acionamento na fila própria'
);

select is(
  (
    select count(*)::integer
    from public.vw_internal_action_detail_by_area
    where summary = 'Validar cobrança operacional'
  ),
  1,
  'membro ativo da área abre detalhe operacional do acionamento'
);

select is(
  (
    select count(*)::integer
    from public.vw_internal_action_timeline_by_area
    where internal_action_id = (
      select internal_action_id
      from public.vw_internal_action_queue_by_area
      where summary = 'Validar cobrança operacional'
    )
  ),
  1,
  'membro ativo da área vê timeline sanitizada do acionamento'
);

select lives_ok(
  $$
    select public.rpc_internal_action_assign_to_self(
      (
        select internal_action_id
        from public.vw_internal_action_queue_by_area
        where summary = 'Validar cobrança operacional'
      ),
      '40000000-0000-4000-8000-000000000010'::uuid
    )
  $$,
  'membro ativo assume acionamento para si sem permissão de reatribuição gerencial'
);

select is(
  (
    select status::text
    from public.vw_internal_action_detail_by_area
    where summary = 'Validar cobrança operacional'
  ),
  'assigned',
  'assumir para si move acionamento aberto para assigned'
);

select lives_ok(
  $$
    select public.rpc_internal_action_add_comment(
      (
        select internal_action_id
        from public.vw_internal_action_queue_by_area
        where summary = 'Validar cobrança operacional'
      ),
      '40000000-0000-4000-8000-000000000010'::uuid,
      'Financeiro iniciou validação e conferiu os dados necessários.'
    )
  $$,
  'membro da área registra update interno'
);

select lives_ok(
  $$
    select public.rpc_internal_action_return_to_support(
      (
        select internal_action_id
        from public.vw_internal_action_queue_by_area
        where summary = 'Validar cobrança operacional'
      ),
      '40000000-0000-4000-8000-000000000010'::uuid,
      'Cobrança validada. Suporte pode responder o cliente com segurança.'
    )
  $$,
  'membro da área devolve resposta estruturada ao suporte'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select is(
  (
    select status::text
    from public.tickets
    where id = '40000000-0000-4000-8000-000000000100'
  ),
  'in_progress',
  'devolução ao suporte também não altera ticket.status'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '40000000-0000-4000-8000-000000000004';

select is(
  (
    select count(*)::integer
    from public.vw_internal_action_queue_by_area
    where summary = 'Validar cobrança operacional'
  ),
  0,
  'usuário sem membership no tenant da área não enxerga a fila'
);

select is(
  (
    select count(*)::integer
    from public.vw_internal_action_area_auth_context
  ),
  0,
  'usuário sem membership não recebe contexto de área vazio enganoso'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '40000000-0000-4000-8000-000000000001';

select lives_ok(
  $$
    select public.rpc_admin_archive_internal_area_membership(
      (
        select membership_id
        from public.vw_admin_internal_area_memberships
        where user_id = '40000000-0000-4000-8000-000000000003'
          and area_key = 'finance'
      )
    )
  $$,
  'platform_admin arquiva membership por RPC auditada'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '40000000-0000-4000-8000-000000000003';

select is(
  (
    select count(*)::integer
    from public.vw_internal_action_queue_by_area
    where summary = 'Validar cobrança operacional'
  ),
  0,
  'membership arquivada remove acesso à fila da área'
);

select *
from finish();

rollback;
