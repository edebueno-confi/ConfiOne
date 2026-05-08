create extension if not exists pgtap with schema extensions;

begin;

select plan(15);

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
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'admin@ticket-evidence.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Platform Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'support-manager-a@ticket-evidence.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support Manager A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'authenticated', 'authenticated', 'support-agent-b@ticket-evidence.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support Agent B"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

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
  ('11111111-1111-4111-8111-111111111111', 'ticket-evidence-a', 'Ticket Evidence A LTDA', 'Ticket Evidence A', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222', 'ticket-evidence-b', 'Ticket Evidence B LTDA', 'Ticket Evidence B', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
  ('22222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'tenant_admin', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
  assigned_to_user_id
)
values
  ('50000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Ticket A com evidência segura', 'Fluxo principal para validar upload governado.', 'internal', 'in_progress', 'high', 'medium', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('50000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'Ticket B isolado', 'Usado para validar bloqueio cross-tenant.', 'internal', 'triage', 'normal', 'low', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');

select ok(
  exists (
    select 1
    from storage.buckets
    where id = 'ticket-evidence'
      and public = false
  ),
  'bucket ticket-evidence existe e permanece privado'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_support_ticket_attachments', 'SELECT')
  and not has_table_privilege('anon', 'public.vw_support_ticket_attachments', 'SELECT'),
  'somente authenticated lê o read model sanitizado de anexos'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select lives_ok(
  $$
    select public.rpc_support_create_ticket_attachment_upload(
      '50000000-0000-4000-8000-000000000001'::uuid,
      '11111111-1111-4111-8111-111111111111'::uuid,
      'Evidencia Cliente A!.pdf',
      'application/pdf',
      2048
    )
  $$,
  'support_manager autorizado prepara a intenção de upload seguro'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select ok(
  exists (
    select 1
    from public.ticket_attachment_upload_intents as intent
    where intent.ticket_id = '50000000-0000-4000-8000-000000000001'::uuid
      and intent.storage_bucket = 'ticket-evidence'
      and intent.storage_object_path like 'tenant/11111111-1111-4111-8111-111111111111/ticket/50000000-0000-4000-8000-000000000001/attachment/%'
      and intent.storage_object_path not like '% %'
  ),
  'intenção de upload usa bucket privado e path tenant-aware sem nome cru exposto'
);

insert into public.ticket_attachment_upload_intents (
  id,
  attachment_id,
  tenant_id,
  ticket_id,
  visibility,
  original_filename,
  content_type,
  size_bytes,
  storage_bucket,
  storage_object_path,
  created_by_user_id,
  expires_at
)
values (
  '61000000-0000-4000-8000-000000000001',
  '60000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '50000000-0000-4000-8000-000000000001',
  'internal'::public.message_visibility,
  'Evidencia Cliente A!.pdf',
  'application/pdf',
  2048,
  'ticket-evidence',
  'tenant/11111111-1111-4111-8111-111111111111/ticket/50000000-0000-4000-8000-000000000001/attachment/60000000-0000-4000-8000-000000000001/evidencia-cliente-a.pdf',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  timezone('utc', now()) + interval '15 minutes'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select lives_ok(
  $$
    insert into storage.objects (
      id,
      bucket_id,
      name,
      owner,
      owner_id,
      version,
      metadata
    )
    values (
      '60000000-0000-4000-8000-000000000001'::uuid,
      'ticket-evidence',
      'tenant/11111111-1111-4111-8111-111111111111/ticket/50000000-0000-4000-8000-000000000001/attachment/60000000-0000-4000-8000-000000000001/evidencia-cliente-a.pdf',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'v1',
      jsonb_build_object('size', 2048, 'mimetype', 'application/pdf')
    )
  $$,
  'policy de storage permite inserir o objeto apenas para a intenção autorizada'
);

select lives_ok(
  $$
    select public.rpc_support_register_ticket_attachment(
      '61000000-0000-4000-8000-000000000001'::uuid
    )
  $$,
  'registro final da evidência valida objeto no storage e cria metadata do anexo'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select ok(
  exists (
    select 1
    from public.ticket_attachments as ta
    where ta.ticket_id = '50000000-0000-4000-8000-000000000001'::uuid
      and ta.status = 'available'::public.ticket_attachment_status
  ),
  'metadata do anexo é persistida com status disponível'
);

select ok(
  exists (
    select 1
    from public.ticket_events as event_row
    where event_row.ticket_id = '50000000-0000-4000-8000-000000000001'::uuid
      and event_row.event_type = 'attachment_added'::public.ticket_event_type
      and not (event_row.metadata ? 'storage_bucket')
      and not (event_row.metadata ? 'storage_object_path')
  ),
  'registro do anexo gera ticket_event sem bucket ou path sensível'
);

select ok(
  exists (
    select 1
    from audit.audit_logs as audit_log
    where audit_log.tenant_id = '11111111-1111-4111-8111-111111111111'::uuid
      and audit_log.entity_table = 'ticket_attachments'
      and audit_log.action = 'insert'
  ),
  'anexo registrado gera audit trail de insert'
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
  'read model sanitizado não expõe bucket nem path interno'
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
  'support_manager vê a evidência do ticket do próprio tenant no read model'
);

select throws_ok(
  $$
    select public.rpc_support_create_ticket_attachment_upload(
      '50000000-0000-4000-8000-000000000002'::uuid,
      '22222222-2222-4222-8222-222222222222'::uuid,
      'intrusao.pdf',
      'application/pdf',
      1024
    )
  $$,
  'P0001',
  'rpc_support_create_ticket_attachment_upload denied',
  'upload cross-tenant é bloqueado no backend'
);

select lives_ok(
  $$
    select public.rpc_support_get_ticket_attachment_download_url(
      '60000000-0000-4000-8000-000000000001'::uuid
    )
  $$,
  'usuário autorizado recebe contrato opaco de download temporário'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select throws_ok(
  $$
    select public.rpc_support_get_ticket_attachment_download_url(
      '60000000-0000-4000-8000-000000000001'::uuid
    )
  $$,
  'P0001',
  'rpc_support_get_ticket_attachment_download_url denied',
  'download cross-tenant é bloqueado no backend'
);

select throws_ok(
  $$
    insert into public.ticket_attachments (
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
    values (
      '22222222-2222-4222-8222-222222222222'::uuid,
      '50000000-0000-4000-8000-000000000002'::uuid,
      'internal'::public.message_visibility,
      'ticket-evidence',
      'tenant/22222222-2222-4222-8222-222222222222/ticket/50000000-0000-4000-8000-000000000002/attachment/manual.pdf',
      'manual.pdf',
      'application/pdf',
      512,
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid
    )
  $$,
  '42501',
  'permission denied for table ticket_attachments',
  'frontend autenticado não faz DML direto na tabela base de anexos'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
