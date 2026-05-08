create extension if not exists pgtap with schema extensions;

begin;

select plan(16);

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
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'admin@support-escalation.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Platform Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'support-manager-a@support-escalation.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support Manager A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'authenticated', 'authenticated', 'support-agent-b@support-escalation.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support Agent B"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'platform_admin', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'support_manager', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
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
  ('11111111-1111-4111-8111-111111111111', 'support-escalation-a', 'Support Escalation A LTDA', 'Support Escalation A', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222', 'support-escalation-b', 'Support Escalation B LTDA', 'Support Escalation B', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
  ('22222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'tenant_viewer', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into public.tickets (
  id,
  tenant_id,
  title,
  description,
  source,
  status,
  priority,
  severity,
  close_reason,
  created_by_user_id,
  updated_by_user_id,
  assigned_to_user_id,
  closed_at
)
values
  ('50000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Ticket A elegível para handoff', 'Incidente técnico que precisa de engenharia.', 'internal', 'triage', 'high', 'high', null, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', null),
  ('50000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Ticket A fechado', 'Ticket já encerrado.', 'internal', 'closed', 'normal', 'medium', 'Encerrado para regressão de handoff.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', timezone('utc', now())),
  ('50000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'Ticket B isolado', 'Ticket de outro tenant.', 'internal', 'triage', 'normal', 'medium', null, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', null);

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
  uploaded_by_user_id
)
values
  ('60000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '50000000-0000-4000-8000-000000000001', 'internal', 'support-ticket-evidence', 'tickets/a/evidence-1.pdf', 'evidence-1.pdf', 'application/pdf', 2048, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('60000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', '50000000-0000-4000-8000-000000000003', 'internal', 'support-ticket-evidence', 'tickets/b/evidence-1.pdf', 'evidence-b.pdf', 'application/pdf', 4096, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');

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
values
  ('70000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'bug', 'triage', 'high', 'Work item B existente', 'Usado para validar bloqueio cross-tenant.', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select ok(
  has_table_privilege('authenticated', 'public.vw_support_ticket_attachments', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_support_ticket_engineering_links', 'SELECT'),
  'authenticated recebe SELECT apenas nos read models de anexos e handoff'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vw_support_ticket_attachments'
      and column_name in ('storage_bucket', 'storage_object_path')
  ),
  0,
  'read model de anexos não expõe bucket nem path sensível'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_attachments
    where ticket_id = '50000000-0000-4000-8000-000000000001'::uuid
  ),
  1,
  'support_manager vê os anexos do ticket do próprio tenant'
);

select ok(
  (
    select not bucket_configured
      and not storage_object_present
      and not download_available
    from public.vw_support_ticket_attachments
    where attachment_id = '60000000-0000-4000-8000-000000000001'::uuid
  ),
  'sem bucket e policy, o read model sinaliza anexo sem download governado disponível'
);

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_attachments
    where ticket_id = '50000000-0000-4000-8000-000000000003'::uuid
  ),
  0,
  'cross-tenant de anexos continua bloqueado no read model'
);

select lives_ok(
  $$
    select public.rpc_support_create_engineering_work_item_from_ticket(
      '50000000-0000-4000-8000-000000000001'::uuid,
      'investigation'::public.engineering_work_item_type,
      'Investigar timeout do webhook',
      'Comparar cronologia do incidente, retries e contexto do tenant afetado.',
      'Cliente A com operação bloqueada desde o último deploy.'
    )
  $$,
  'support_manager autorizado cria demanda técnica a partir do ticket'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select is(
  (
    select count(*)::integer
    from public.engineering_work_items
    where tenant_id = '11111111-1111-4111-8111-111111111111'::uuid
  ),
  1,
  'handoff cria engineering_work_item no tenant correto'
);

select is(
  (
    select count(*)::integer
    from public.engineering_ticket_links
    where ticket_id = '50000000-0000-4000-8000-000000000001'::uuid
  ),
  1,
  'handoff cria engineering_ticket_link para o ticket'
);

select is(
  (
    select count(*)::integer
    from public.ticket_events
    where ticket_id = '50000000-0000-4000-8000-000000000001'::uuid
      and event_type in ('escalated_to_engineering', 'linked_to_work_item')
  ),
  2,
  'handoff gera os ticket_events internos obrigatórios'
);

select ok(
  (
    select count(*)::integer
    from audit.audit_logs as audit_log
    where audit_log.tenant_id = '11111111-1111-4111-8111-111111111111'::uuid
      and audit_log.entity_table in ('engineering_work_items', 'engineering_ticket_links', 'ticket_events')
      and audit_log.action = 'insert'
  ) >= 4,
  'handoff gera audit trail nas entidades técnicas e nos eventos do ticket'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_engineering_links
    where ticket_id = '50000000-0000-4000-8000-000000000001'::uuid
  ),
  1,
  'workspace lê o vínculo técnico criado no read model controlado'
);

select throws_ok(
  $$
    select public.rpc_support_link_ticket_to_engineering_work_item(
      '50000000-0000-4000-8000-000000000001'::uuid,
      '70000000-0000-4000-8000-000000000001'::uuid,
      'Tentativa inválida de cruzar work item de outro tenant.'
    )
  $$,
  'P0001',
  'cross-tenant engineering work item link denied',
  'vínculo cross-tenant entre ticket e work item é bloqueado'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select throws_ok(
  $$
    select public.rpc_support_create_engineering_work_item_from_ticket(
      '50000000-0000-4000-8000-000000000001'::uuid,
      'bug'::public.engineering_work_item_type,
      'Tentativa cross-tenant',
      'Usuário de outro tenant não deve conseguir escalar o ticket.',
      null
    )
  $$,
  'P0001',
  'rpc_support_create_engineering_work_item_from_ticket denied',
  'ator de outro tenant não consegue criar handoff técnico'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select throws_ok(
  $$
    select public.rpc_support_create_engineering_work_item_from_ticket(
      '50000000-0000-4000-8000-000000000002'::uuid,
      'investigation'::public.engineering_work_item_type,
      'Tentativa em ticket fechado',
      'Ticket fechado não deve receber novo handoff.',
      null
    )
  $$,
  'P0001',
  'ticket is not eligible for engineering handoff',
  'ticket fechado não aceita novo handoff técnico'
);

select throws_ok(
  $$
    insert into public.engineering_work_items (
      tenant_id,
      work_item_type,
      status,
      priority,
      title,
      description,
      created_by_user_id
    )
    values (
      '11111111-1111-4111-8111-111111111111'::uuid,
      'bug'::public.engineering_work_item_type,
      'triage'::public.engineering_work_item_status,
      'normal'::public.ticket_priority,
      'Insert direto proibido',
      'Authenticated não pode gravar na tabela-base.',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid
    )
  $$,
  '42501',
  'permission denied for table engineering_work_items',
  'DML direto em engineering_work_items falha para authenticated'
);

select throws_ok(
  $$
    insert into public.engineering_ticket_links (
      tenant_id,
      ticket_id,
      engineering_work_item_id,
      created_by_user_id
    )
    values (
      '11111111-1111-4111-8111-111111111111'::uuid,
      '50000000-0000-4000-8000-000000000001'::uuid,
      (
        select id
        from public.engineering_work_items
        where tenant_id = '11111111-1111-4111-8111-111111111111'::uuid
        limit 1
      ),
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid
    )
  $$,
  '42501',
  'permission denied for table engineering_ticket_links',
  'DML direto em engineering_ticket_links falha para authenticated'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
