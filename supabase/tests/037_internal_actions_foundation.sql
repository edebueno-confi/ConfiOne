create extension if not exists pgtap with schema extensions;

begin;

select plan(37);

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
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'admin@internal-actions.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Platform Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'support-manager@internal-actions.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support Manager A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'authenticated', 'authenticated', 'engineering-manager@internal-actions.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Engineering Manager A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'authenticated', 'authenticated', 'support-sem-tenant@internal-actions.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support Sem Tenant"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'authenticated', 'authenticated', 'finance-member@internal-actions.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Finance Member A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '12121212-1212-4121-8121-121212121212', 'authenticated', 'authenticated', 'finance-manager@internal-actions.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Finance Manager A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'authenticated', 'authenticated', 'customer-user@internal-actions.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Customer User A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-4999-8999-999999999999', 'authenticated', 'authenticated', 'finance-member-b@internal-actions.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Finance Member B"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'platform_admin', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'support_manager', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
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
  ('11111111-1111-4111-8111-111111111111', 'internal-actions-a', 'Internal Actions A LTDA', 'Internal Actions A', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222', 'internal-actions-b', 'Internal Actions B LTDA', 'Internal Actions B', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
  ('11111111-1111-4111-8111-111111111111', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'tenant_viewer', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('11111111-1111-4111-8111-111111111111', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'tenant_viewer', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('11111111-1111-4111-8111-111111111111', '12121212-1212-4121-8121-121212121212', 'tenant_viewer', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('11111111-1111-4111-8111-111111111111', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'customer_user', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222', '99999999-9999-4999-8999-999999999999', 'tenant_viewer', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into public.internal_area_memberships (
  tenant_id,
  user_id,
  area_key,
  role,
  status,
  created_by_user_id,
  updated_by_user_id
)
values
  ('11111111-1111-4111-8111-111111111111', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'engineering', 'manager', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('11111111-1111-4111-8111-111111111111', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'finance', 'member', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('11111111-1111-4111-8111-111111111111', '12121212-1212-4121-8121-121212121212', 'finance', 'manager', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222', '99999999-9999-4999-8999-999999999999', 'finance', 'member', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
  updated_by_user_id,
  closed_at,
  close_reason
)
values
  ('50000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Ticket A com apoio interno', 'Precisa de revisão financeira e histórico auditável.', 'internal', 'in_progress', 'high', 'medium', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', null, null),
  ('50000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Ticket A encerrado', 'Usado para bloquear criação nova em ticket encerrado.', 'internal', 'closed', 'normal', 'low', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', timezone('utc', now()), 'Encerrado para teste'),
  ('50000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'Ticket B outro tenant', 'Isolamento cross-tenant para fila interna.', 'internal', 'triage', 'normal', 'low', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', null, null);

insert into public.ticket_attachments (
  id,
  tenant_id,
  ticket_id,
  visibility,
  storage_bucket,
  storage_object_path,
  file_name,
  content_type,
  byte_size,
  uploaded_by_user_id,
  status
)
values
  (
    '60000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    '50000000-0000-4000-8000-000000000001',
    'internal'::public.message_visibility,
    'ticket-evidence',
    'tenant/11111111-1111-4111-8111-111111111111/ticket/50000000-0000-4000-8000-000000000001/attachment/60000000-0000-4000-8000-000000000001/comprovante-financeiro.pdf',
    'comprovante-financeiro.pdf',
    'application/pdf',
    4096,
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'available'::public.ticket_attachment_status
  );

select is(
  (select count(*)::integer from public.internal_action_target_areas where status = 'active'),
  6,
  'catalogo governado de areas internas nasce com seis seeds ativos'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select is(
  (
    select count(*)::integer
    from public.rpc_support_list_internal_action_target_areas(
      '50000000-0000-4000-8000-000000000001'::uuid
    )
  ),
  6,
  'suporte autorizado lista areas internas ativas acionaveis para o ticket'
);

select is(
  (
    select count(*)::integer
    from public.vw_support_internal_action_target_areas
    where tenant_id = '11111111-1111-4111-8111-111111111111'
  ),
  6,
  'read model de areas acionaveis filtra tenants acessiveis ao suporte'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

update public.internal_action_target_areas
set status = 'inactive'
where area_key = 'product';

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select is(
  (
    select count(*)::integer
    from public.rpc_support_list_internal_action_target_areas(
      '50000000-0000-4000-8000-000000000001'::uuid
    )
    where area_key = 'product'
  ),
  0,
  'area inativa nao aparece no catalogo acionavel do suporte'
);

select throws_ok(
  $$
    select public.rpc_support_create_internal_action(
      '50000000-0000-4000-8000-000000000001'::uuid,
      'product',
      'analysis'::public.internal_action_support_type,
      'normal'::public.ticket_priority,
      'Tentativa area inativa',
      'Area inativa nao pode receber acionamento.',
      null,
      null
    )
  $$,
  'P0001',
  'internal action target area is not active',
  'criacao usa apenas area_key valida e ativa'
);

select lives_ok(
  $$
    select public.rpc_support_create_internal_action(
      '50000000-0000-4000-8000-000000000001'::uuid,
      'finance',
      'analysis'::public.internal_action_support_type,
      'high'::public.ticket_priority,
      'Validar reembolso operacional',
      'Financeiro precisa confirmar política e comprovantes do cliente.',
      array['60000000-0000-4000-8000-000000000001'::uuid],
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid
    )
  $$,
  'support autorizado cria acionamento interno com área, responsável e evidência do ticket'
);

select throws_ok(
  $$
    select public.rpc_support_create_internal_action(
      '50000000-0000-4000-8000-000000000002'::uuid,
      'finance',
      'approval'::public.internal_action_support_type,
      'normal'::public.ticket_priority,
      'Não deveria abrir',
      'Ticket encerrado não aceita novo acionamento.',
      null,
      null
    )
  $$,
  'P0001',
  'ticket is not eligible for internal action',
  'ticket fechado não aceita criação de novo acionamento interno'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select is(
  (
    select status::text
    from public.vw_support_ticket_detail
    where id = '50000000-0000-4000-8000-000000000001'
  ),
  'in_progress',
  'ticket.status permanece inalterado após criar o acionamento interno'
);

select is(
  (
    select status::text
    from public.vw_support_ticket_internal_actions
    where summary = 'Validar reembolso operacional'
  ),
  'assigned',
  'acionamento criado com responsável inicial nasce em status assigned'
);

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_internal_actions
    where ticket_id = '50000000-0000-4000-8000-000000000001'
  ),
  1,
  'suporte enxerga o acionamento interno vinculado ao ticket'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select ok(
  exists (
    select 1
    from public.ticket_events as event_row
    where event_row.ticket_id = '50000000-0000-4000-8000-000000000001'::uuid
      and event_row.event_type = 'internal_action_created'::public.ticket_event_type
      and event_row.visibility = 'internal'::public.message_visibility
  ),
  'criação do acionamento gera ticket_event interno'
);

select ok(
  exists (
    select 1
    from public.ticket_events as event_row
    where event_row.ticket_id = '50000000-0000-4000-8000-000000000001'::uuid
      and event_row.event_type = 'internal_action_evidence_linked'::public.ticket_event_type
      and not (event_row.metadata ? 'storage_bucket')
      and not (event_row.metadata ? 'storage_object_path')
  ),
  'vínculo de evidência gera ticket_event sem bucket ou path sensível'
);

select ok(
  (
    select count(*)::integer
    from audit.audit_logs as audit_log
    where audit_log.tenant_id = '11111111-1111-4111-8111-111111111111'::uuid
      and audit_log.entity_table in ('internal_actions', 'internal_action_updates', 'internal_action_evidence_links', 'ticket_events')
  ) >= 4,
  'criação do domínio gera audit trail mínimo em tabelas novas e ticket_events'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

select is(
  (
    select count(*)::integer
    from public.vw_internal_action_queue_by_area
    where target_area = 'finance'
  ),
  1,
  'membro da área financeira vê apenas a própria fila contratual'
);

select throws_ok(
  $$
    select public.rpc_internal_action_assign(
      (select internal_action_id from public.vw_internal_action_queue_by_area limit 1),
      '11111111-1111-4111-8111-111111111111'::uuid,
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid
    )
  $$,
  'P0001',
  'rpc_internal_action_assign denied',
  'member da área não reatribui acionamento sem permissão de gestão'
);

select lives_ok(
  $$
    select public.rpc_internal_action_add_comment(
      (select internal_action_id from public.vw_internal_action_queue_by_area limit 1),
      '11111111-1111-4111-8111-111111111111'::uuid,
      'Financeiro iniciou a análise dos comprovantes e da política aplicável.'
    )
  $$,
  'área registra comentário interno no ledger do acionamento'
);

select lives_ok(
  $$
    select public.rpc_internal_action_update_status(
      (select internal_action_id from public.vw_internal_action_queue_by_area limit 1),
      '11111111-1111-4111-8111-111111111111'::uuid,
      'in_progress'::public.internal_action_status,
      'Análise financeira em andamento.'
    )
  $$,
  'área atualiza status para in_progress sem tocar no ticket principal'
);

select lives_ok(
  $$
    select public.rpc_internal_action_return_to_support(
      (select internal_action_id from public.vw_internal_action_queue_by_area limit 1),
      '11111111-1111-4111-8111-111111111111'::uuid,
      'Política validada. Suporte já pode responder o cliente com a devolutiva financeira.'
    )
  $$,
  'área devolve retorno estruturado ao suporte'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select is(
  (
    select status::text
    from public.internal_actions
    where summary = 'Validar reembolso operacional'
  ),
  'returned_to_support',
  'retorno da área move o acionamento para returned_to_support'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select is(
  (
    select count(*)::integer
    from public.vw_internal_action_queue_by_area
    where target_area = 'finance'
  ),
  0,
  'outra área interna não enxerga a fila financeira'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '99999999-9999-4999-8999-999999999999';

select is(
  (
    select count(*)::integer
    from public.vw_internal_action_queue_by_area
    where target_area = 'finance'
  ),
  0,
  'membership da mesma área em outro tenant não atravessa a fila do tenant A'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_internal_actions
  ),
  0,
  'customer-facing não lê o read model interno de suporte'
);

select is(
  (
    select count(*)::integer
    from public.vw_support_internal_action_target_areas
  ),
  0,
  'customer-facing não lê o catálogo interno de áreas acionáveis'
);

select throws_ok(
  $$
    select public.rpc_support_list_internal_action_target_areas(
      '50000000-0000-4000-8000-000000000001'::uuid
    )
  $$,
  'P0001',
  'rpc_support_list_internal_action_target_areas denied',
  'customer-facing não lista áreas internas acionáveis'
);

select throws_ok(
  $$
    select public.rpc_support_create_internal_action(
      '50000000-0000-4000-8000-000000000001'::uuid,
      'finance',
      'analysis'::public.internal_action_support_type,
      'normal'::public.ticket_priority,
      'Tentativa customer',
      'Cliente não pode criar acionamento interno.',
      null,
      null
    )
  $$,
  'P0001',
  'rpc_support_create_internal_action denied',
  'customer-facing não cria acionamento interno'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

select throws_ok(
  $$
    select public.rpc_support_list_internal_action_target_areas(
      '50000000-0000-4000-8000-000000000001'::uuid
    )
  $$,
  'P0001',
  'rpc_support_list_internal_action_target_areas denied',
  'suporte sem membership ativo no tenant não lista áreas internas acionáveis'
);

select throws_ok(
  $$
    select public.rpc_support_create_internal_action(
      '50000000-0000-4000-8000-000000000001'::uuid,
      'finance',
      'analysis'::public.internal_action_support_type,
      'normal'::public.ticket_priority,
      'Tentativa sem tenant',
      'Suporte sem membership não deve criar.',
      null,
      null
    )
  $$,
  'P0001',
  'rpc_support_create_internal_action denied',
  'suporte sem membership ativo no tenant não cria acionamento interno'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select lives_ok(
  $$
    select public.rpc_support_accept_internal_action_return(
      (
        select internal_action_id
        from public.vw_support_ticket_internal_actions
        where summary = 'Validar reembolso operacional'
      ),
      '11111111-1111-4111-8111-111111111111'::uuid,
      'Suporte recebeu o retorno e vai consolidar a devolutiva.'
    )
  $$,
  'suporte aceita o retorno da área sem fechar o ticket principal'
);

select lives_ok(
  $$
    select public.rpc_support_request_internal_action_followup(
      (
        select internal_action_id
        from public.vw_support_ticket_internal_actions
        where summary = 'Validar reembolso operacional'
      ),
      '11111111-1111-4111-8111-111111111111'::uuid,
      'Complementar a base normativa usada na análise.'
    )
  $$,
  'suporte consegue pedir complemento ao subfluxo interno'
);

select lives_ok(
  $$
    select public.rpc_internal_action_assign(
      (
        select internal_action_id
        from public.vw_support_ticket_internal_actions
        where summary = 'Validar reembolso operacional'
      ),
      '11111111-1111-4111-8111-111111111111'::uuid,
      '12121212-1212-4121-8121-121212121212'::uuid
    )
  $$,
  'suporte reatribui o acionamento após follow-up solicitado'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

select lives_ok(
  $$
    select public.rpc_internal_action_update_status(
      (
        select internal_action_id
        from public.vw_internal_action_queue_by_area
        where summary = 'Validar reembolso operacional'
      ),
      '11111111-1111-4111-8111-111111111111'::uuid,
      'in_progress'::public.internal_action_status,
      'Complemento financeiro em andamento.'
    )
  $$,
  'área retoma o acionamento após follow-up'
);

select lives_ok(
  $$
    select public.rpc_internal_action_return_to_support(
      (
        select internal_action_id
        from public.vw_internal_action_queue_by_area
        where summary = 'Validar reembolso operacional'
      ),
      '11111111-1111-4111-8111-111111111111'::uuid,
      'Complemento concluído e pronto para encerramento operacional.'
    )
  $$,
  'área devolve o follow-up concluído ao suporte'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select lives_ok(
  $$
    select public.rpc_support_close_internal_action(
      (
        select internal_action_id
        from public.vw_support_ticket_internal_actions
        where summary = 'Validar reembolso operacional'
      ),
      '11111111-1111-4111-8111-111111111111'::uuid,
      'Acionamento encerrado após resposta consolidada do suporte.'
    )
  $$,
  'suporte encerra o acionamento sem encerrar o ticket principal'
);

select is(
  (
    select status::text
    from public.vw_support_ticket_internal_actions
    where summary = 'Validar reembolso operacional'
  ),
  'closed',
  'acionamento interno encerra em domínio próprio sem tocar no ticket principal'
);

select ok(
  (
    select count(*)::integer
    from public.vw_support_internal_action_timeline
    where internal_action_id = (
      select internal_action_id
      from public.vw_support_ticket_internal_actions
      where summary = 'Validar reembolso operacional'
    )
  ) >= 8,
  'timeline do acionamento acumula ledger completo de criação, comentários, status, retorno, follow-up e fechamento'
);

select throws_ok(
  $$
    insert into public.internal_actions (
      tenant_id,
      ticket_id,
      target_area,
      support_type,
      priority,
      status,
      summary,
      context,
      requested_by_user_id
    )
    values (
      '11111111-1111-4111-8111-111111111111',
      '50000000-0000-4000-8000-000000000001',
      'finance',
      'analysis',
      'normal',
      'open',
      'Insert direto proibido',
      'Tentativa sem RPC',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    )
  $$,
  '42501',
  'permission denied for table internal_actions',
  'DML direto em internal_actions permanece bloqueado'
);

select throws_ok(
  $$
    insert into public.internal_action_updates (
      tenant_id,
      internal_action_id,
      update_kind,
      body,
      created_by_user_id
    )
    values (
      '11111111-1111-4111-8111-111111111111',
      (
        select internal_action_id
        from public.vw_support_ticket_internal_actions
        where summary = 'Validar reembolso operacional'
      ),
      'comment',
      'Insert direto proibido.',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    )
  $$,
  '42501',
  'permission denied for table internal_action_updates',
  'DML direto em internal_action_updates permanece bloqueado'
);

select *
from finish();

rollback;
