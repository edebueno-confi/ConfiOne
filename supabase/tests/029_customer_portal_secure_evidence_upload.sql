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
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'admin@portal-evidence.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Portal Evidence Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'customer-a@portal-evidence.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Cliente Evidencia A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'customer-b@portal-evidence.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Cliente Evidencia B"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'support@portal-evidence.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support Evidence"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('11111111-1111-4111-8111-111111111111', 'platform_admin', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('44444444-4444-4444-8444-444444444444', 'support_agent', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

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
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'portal-evidence-a', 'Portal Evidence A LTDA', 'Portal Evidence A', 'active', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'portal-evidence-b', 'Portal Evidence B LTDA', 'Portal Evidence B', 'active', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

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
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 'customer_user', 'active', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '33333333-3333-4333-8333-333333333333', 'customer_user', 'active', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '44444444-4444-4444-8444-444444444444', 'tenant_viewer', 'active', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

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
  ('aaaaaaaa-0001-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 'Cliente Evidencia A', 'customer-a@portal-evidence.local', true, '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-0001-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '33333333-3333-4333-8333-333333333333', 'Cliente Evidencia B', 'customer-b@portal-evidence.local', true, '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

insert into public.tickets (
  id,
  tenant_id,
  requester_contact_id,
  title,
  description,
  source,
  status,
  closed_at,
  close_reason,
  created_by_user_id,
  updated_by_user_id
)
values
  ('aaaaaaaa-1000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-0001-4000-8000-000000000001', 'Ticket customer upload aberto', 'Fluxo principal de upload customer-facing.', 'portal', 'waiting_customer', null, null, '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222'),
  ('aaaaaaaa-1000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-0001-4000-8000-000000000001', 'Ticket customer upload fechado', 'Ticket fechado não recebe anexo do cliente.', 'portal', 'closed', timezone('utc', now()), 'Fechado para teste de bloqueio customer upload', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222'),
  ('bbbbbbbb-1000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-0001-4000-8000-000000000001', 'Ticket tenant B upload', 'Ticket isolado para cross-tenant.', 'portal', 'waiting_customer', null, null, '33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333');

select ok(
  exists (
    select 1
    from storage.buckets
    where id = 'ticket-evidence'
      and public = false
  ),
  'bucket ticket-evidence segue privado'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in ('ticket_evidence_customer_insert', 'ticket_evidence_customer_select')
    group by schemaname, tablename
    having count(*) = 2
  ),
  'storage possui policies customer-facing separadas para insert/select'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';

select lives_ok(
  $$
    select public.rpc_customer_create_ticket_attachment_upload(
      'aaaaaaaa-1000-4000-8000-000000000001'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
      'Comprovante loja 01.png',
      'image/png',
      2048
    )
  $$,
  'customer autorizado cria upload intent customer-facing'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

create temporary table test_customer_upload_intent as
select
  intent.id,
  intent.attachment_id,
  intent.storage_bucket,
  intent.storage_object_path
from public.ticket_attachment_upload_intents as intent
where intent.ticket_id = 'aaaaaaaa-1000-4000-8000-000000000001'::uuid
  and intent.visibility = 'customer'::public.message_visibility
order by intent.created_at desc
limit 1;

grant select on test_customer_upload_intent to authenticated;

select ok(
  exists (
    select 1
    from public.ticket_attachment_upload_intents as intent
    where intent.ticket_id = 'aaaaaaaa-1000-4000-8000-000000000001'::uuid
      and intent.tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid
      and intent.visibility = 'customer'::public.message_visibility
      and intent.storage_bucket = 'ticket-evidence'
      and intent.storage_object_path like 'tenant/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/ticket/aaaaaaaa-1000-4000-8000-000000000001/attachment/%'
      and intent.storage_object_path not like '%Comprovante%'
  ),
  'upload intent customer-facing usa bucket privado e path tenant-aware sem filename cru'
);

select ok(
  exists (
    select 1
    from public.ticket_attachment_upload_intents as intent
    where intent.ticket_id = 'aaaaaaaa-1000-4000-8000-000000000001'::uuid
      and intent.visibility = 'customer'::public.message_visibility
      and intent.content_type = 'image/png'
      and intent.size_bytes = 2048
      and format('/functions/v1/ticket-evidence-upload?intent=%s&boundary=customer', intent.id) like '%boundary=customer'
  ),
  'contrato de upload customer-facing aponta para boundary customer sem expor storage path'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';

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
    select
      intent.attachment_id,
      intent.storage_bucket,
      intent.storage_object_path,
      '22222222-2222-4222-8222-222222222222'::uuid,
      '22222222-2222-4222-8222-222222222222',
      'v1',
      jsonb_build_object('size', 2048, 'mimetype', 'image/png')
    from test_customer_upload_intent as intent
  $$,
  'policy customer-facing permite upload apenas com intent autorizada'
);

select lives_ok(
  $$
    select public.rpc_customer_register_ticket_attachment(
      (
        select intent.id
        from test_customer_upload_intent as intent
      )
    )
  $$,
  'customer registra metadata do anexo após upload seguro'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_attachments
    where ticket_id = 'aaaaaaaa-1000-4000-8000-000000000001'::uuid
      and display_name = 'Comprovante loja 01.png'
      and uploaded_by_label = 'Você'
  ),
  1,
  'metadata aparece no portal com label seguro do cliente'
);

select lives_ok(
  $$
    select public.rpc_customer_get_attachment_download_url(
      (
        select intent.attachment_id
        from test_customer_upload_intent as intent
      )
    )
  $$,
  'customer autorizado recebe grant opaco de download temporario'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select is(
  (
    select count(*)::integer
    from public.ticket_events as event_row
    where event_row.ticket_id = 'aaaaaaaa-1000-4000-8000-000000000001'::uuid
      and event_row.event_type = 'attachment_added'::public.ticket_event_type
      and event_row.visibility = 'customer'::public.message_visibility
      and event_row.metadata ->> 'source' = 'customer_portal'
      and not (event_row.metadata ? 'storage_bucket')
      and not (event_row.metadata ? 'storage_object_path')
  ),
  1,
  'registro customer-facing gera ticket_event customer sem bucket/path'
);

select ok(
  exists (
    select 1
    from audit.audit_logs as audit_log
    where audit_log.tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid
      and audit_log.entity_table in ('ticket_attachment_upload_intents', 'ticket_attachments')
      and audit_log.actor_user_id = '22222222-2222-4222-8222-222222222222'::uuid
  ),
  'upload customer-facing gera audit trail'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vw_customer_portal_ticket_attachments'
      and column_name in ('storage_bucket', 'storage_object_path', 'download_url', 'signed_url')
  ),
  0,
  'view customer-facing nao expoe bucket, path ou URL permanente'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_attachments
    where ticket_id = 'aaaaaaaa-1000-4000-8000-000000000001'::uuid
      and display_name = 'Comprovante loja 01.png'
  ),
  1,
  'Support Workspace enxerga evidencia enviada pelo cliente sem path sensivel'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';

select throws_ok(
  $$
    select public.rpc_customer_create_ticket_attachment_upload(
      'aaaaaaaa-1000-4000-8000-000000000001'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
      'payload.json',
      'application/json',
      1024
    )
  $$,
  'P0001',
  'content type is not allowed for customer portal',
  'tipo interno application/json fica bloqueado para customer upload'
);

select throws_ok(
  $$
    select public.rpc_customer_create_ticket_attachment_upload(
      'aaaaaaaa-1000-4000-8000-000000000001'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
      'grande.pdf',
      'application/pdf',
      10485761
    )
  $$,
  'P0001',
  'file size exceeds the customer portal limit',
  'arquivo acima de 10 MB fica bloqueado'
);

select throws_ok(
  $$
    select public.rpc_customer_create_ticket_attachment_upload(
      'bbbbbbbb-1000-4000-8000-000000000001'::uuid,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
      'intrusao.pdf',
      'application/pdf',
      1024
    )
  $$,
  'P0001',
  'rpc_customer_create_ticket_attachment_upload denied',
  'upload cross-tenant fica bloqueado no backend'
);

select throws_ok(
  $$
    select public.rpc_customer_create_ticket_attachment_upload(
      'aaaaaaaa-1000-4000-8000-000000000002'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
      'fechado.pdf',
      'application/pdf',
      1024
    )
  $$,
  'P0001',
  'ticket is not open for customer evidence upload',
  'ticket fechado nao aceita upload customer-facing'
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
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
      'aaaaaaaa-1000-4000-8000-000000000001'::uuid,
      'customer'::public.message_visibility,
      'ticket-evidence',
      'tenant/manual/path.pdf',
      'manual.pdf',
      'application/pdf',
      512,
      '22222222-2222-4222-8222-222222222222'::uuid
    )
  $$,
  '42501',
  'permission denied for table ticket_attachments',
  'customer autenticado nao faz DML direto em ticket_attachments'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';

select throws_ok(
  $$
    select public.rpc_customer_get_attachment_download_url(
      (
        select intent.attachment_id
        from test_customer_upload_intent as intent
      )
    )
  $$,
  'P0001',
  'rpc_customer_get_attachment_download_url denied',
  'download customer cross-tenant fica bloqueado'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
