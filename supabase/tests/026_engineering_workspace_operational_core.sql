create extension if not exists pgtap with schema extensions;

begin;

select plan(17);

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
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'admin@engineering-core.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Platform Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'support@engineering-core.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support Manager"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'authenticated', 'authenticated', 'engineer-a@engineering-core.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Engineer A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'authenticated', 'authenticated', 'support-b@engineering-core.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support B"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'platform_admin', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'support_manager', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'engineering_member', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'support_agent', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
  ('11111111-1111-4111-8111-111111111111', 'engineering-core-a', 'Engineering Core A LTDA', 'Engineering Core A', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222', 'engineering-core-b', 'Engineering Core B LTDA', 'Engineering Core B', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
  ('11111111-1111-4111-8111-111111111111', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'tenant_admin', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('11111111-1111-4111-8111-111111111111', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'tenant_admin', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'tenant_admin', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
values
  ('50000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Ticket A para engenharia', 'Falha técnica com handoff estruturado.', 'internal', 'triage', 'high', 'high', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('50000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'Ticket B isolado', 'Ticket de outro tenant.', 'internal', 'triage', 'normal', 'medium', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select lives_ok(
  $$
    select public.rpc_support_create_engineering_work_item_from_ticket(
      '50000000-0000-4000-8000-000000000001'::uuid,
      'investigation'::public.engineering_work_item_type,
      'Investigar falha de conciliacao',
      'Consolidar eventos, impacto e trilha tecnica antes do retorno ao suporte.',
      'Suporte confirmou impacto operacional no tenant A.'
    )
  $$,
  'support cria handoff tecnico real para a engenharia'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

insert into public.engineering_work_items (
  id,
  tenant_id,
  work_item_type,
  status,
  priority,
  title,
  description,
  created_by_user_id,
  updated_by_user_id
)
values (
  '70000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'investigation',
  'triage',
  'high',
  'Work item A deterministico',
  'Demanda tecnica deterministica para validar workspace de engenharia.',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
),
(
  '70000000-0000-4000-8000-000000000002',
  '22222222-2222-4222-8222-222222222222',
  'bug',
  'triage',
  'normal',
  'Work item B isolado',
  'Demanda de outro tenant para validar isolamento.',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
);

insert into public.engineering_ticket_links (
  id,
  tenant_id,
  ticket_id,
  engineering_work_item_id,
  handoff_note,
  created_by_user_id,
  updated_by_user_id
)
values (
  '71000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '50000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000001',
  'Vinculo deterministico para validar retorno estruturado.',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select is(
  (
    select count(*)::integer
    from public.vw_engineering_work_items_queue
  ),
  2,
  'engenharia le apenas a fila tecnica do tenant permitido'
);

select is(
  (
    select count(*)::integer
    from public.vw_engineering_work_item_detail
    where engineering_work_item_id = '70000000-0000-4000-8000-000000000001'
  ),
  1,
  'engenharia le detalhe tecnico do work item permitido'
);

select lives_ok(
  $$
    select public.rpc_engineering_assign_work_item(
      '70000000-0000-4000-8000-000000000001'::uuid,
      '11111111-1111-4111-8111-111111111111'::uuid,
      null
    )
  $$,
  'engenharia assume work item permitido'
);

select throws_ok(
  $$
    select public.rpc_engineering_assign_work_item(
      '70000000-0000-4000-8000-000000000001'::uuid,
      '11111111-1111-4111-8111-111111111111'::uuid,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid
    )
  $$,
  'P0001',
  'engineering assignee is not eligible',
  'atribuicao para usuario sem papel tecnico e bloqueada'
);

select lives_ok(
  $$
    select public.rpc_engineering_update_work_item_status(
      '70000000-0000-4000-8000-000000000001'::uuid,
      '11111111-1111-4111-8111-111111111111'::uuid,
      'accepted'::public.engineering_work_item_status,
      'Engenharia aceitou a demanda e iniciou a analise.',
      'Validar logs operacionais antes do retorno.'
    )
  $$,
  'status tecnico valido e aceito'
);

select throws_ok(
  $$
    select public.rpc_engineering_update_work_item_status(
      '70000000-0000-4000-8000-000000000001'::uuid,
      '11111111-1111-4111-8111-111111111111'::uuid,
      'triage'::public.engineering_work_item_status,
      'Tentativa de voltar status sem regra valida.',
      null
    )
  $$,
  'P0001',
  'invalid engineering status transition: accepted -> triage',
  'status tecnico invalido e bloqueado'
);

select lives_ok(
  $$
    select public.rpc_engineering_add_work_item_update(
      '70000000-0000-4000-8000-000000000001'::uuid,
      '11111111-1111-4111-8111-111111111111'::uuid,
      'Analise tecnica registrou causa provavel no conciliador.',
      'Preparar retorno estruturado ao suporte.'
    )
  $$,
  'update tecnico estruturado e registrado'
);

select lives_ok(
  $$
    select public.rpc_engineering_return_work_item_to_support(
      '70000000-0000-4000-8000-000000000001'::uuid,
      '11111111-1111-4111-8111-111111111111'::uuid,
      'Causa provavel isolada. Suporte pode orientar reprocessamento assistido.',
      'Confirmar com o cliente a janela para reprocessamento.'
    )
  $$,
  'retorno estruturado ao suporte e registrado'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select is(
  (
    select status::text
    from public.tickets
    where id = '50000000-0000-4000-8000-000000000001'
  ),
  'waiting_support',
  'retorno tecnico move ticket vinculado para aguardando suporte quando transicao permite'
);

select ok(
  (
    select count(*)::integer
    from public.ticket_events
    where ticket_id = '50000000-0000-4000-8000-000000000001'
      and event_type in (
        'engineering_status_updated',
        'engineering_update_added',
        'engineering_returned_to_support'
      )
  ) >= 3,
  'acoes tecnicas geram eventos estruturados no ticket vinculado'
);

select ok(
  (
    select count(*)::integer
    from audit.audit_logs
    where tenant_id = '11111111-1111-4111-8111-111111111111'
      and entity_table in ('engineering_work_items', 'engineering_work_item_updates', 'ticket_events')
  ) >= 5,
  'acoes tecnicas geram audit trail'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select is(
  (
    select count(*)::integer
    from public.vw_engineering_work_item_updates
    where update_kind = 'support_return'
  ),
  1,
  'feed tecnico expõe retorno ao suporte como update estruturado'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_engineering_links
    where ticket_id = '50000000-0000-4000-8000-000000000001'
      and last_update_summary is not null
  ),
  1,
  'suporte enxerga ultimo retorno tecnico no vinculo permitido'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select throws_ok(
  $$
    select public.rpc_engineering_add_work_item_update(
      '70000000-0000-4000-8000-000000000002'::uuid,
      '22222222-2222-4222-8222-222222222222'::uuid,
      'Tentativa cross-tenant.',
      null
    )
  $$,
  'P0001',
  'rpc_engineering_add_work_item_update denied',
  'cross-tenant tecnico e bloqueado'
);

select throws_ok(
  $$
    insert into public.engineering_work_item_updates (
      tenant_id,
      engineering_work_item_id,
      update_kind,
      summary,
      created_by_user_id
    )
    values (
      '11111111-1111-4111-8111-111111111111',
      '70000000-0000-4000-8000-000000000001',
      'progress_update',
      'Insert direto proibido.',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    )
  $$,
  '42501',
  'permission denied for table engineering_work_item_updates',
  'DML direto em updates tecnicos falha para authenticated'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select throws_ok(
  $$
    select public.rpc_engineering_add_work_item_update(
      '70000000-0000-4000-8000-000000000001'::uuid,
      '11111111-1111-4111-8111-111111111111'::uuid,
      'Suporte nao pode escrever no work item tecnico.',
      null
    )
  $$,
  'P0001',
  'rpc_engineering_add_work_item_update denied',
  'suporte le vinculo permitido, mas nao altera work item tecnico'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
