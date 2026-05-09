create extension if not exists pgtap with schema extensions;

begin;

select plan(26);

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
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'admin@portal.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Portal Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'customer-a@portal.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Cliente A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'manager-a@portal.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Manager A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'customer-b@portal.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Cliente B"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'support@portal.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support Portal"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('11111111-1111-4111-8111-111111111111', 'platform_admin', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('55555555-5555-4555-8555-555555555555', 'support_agent', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

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
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'portal-tenant-a', 'Portal Tenant A LTDA', 'Portal Tenant A', 'active', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'portal-tenant-b', 'Portal Tenant B LTDA', 'Portal Tenant B', 'active', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

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
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '33333333-3333-4333-8333-333333333333', 'customer_manager', 'active', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '44444444-4444-4444-8444-444444444444', 'customer_user', 'active', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '55555555-5555-4555-8555-555555555555', 'tenant_viewer', 'active', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

insert into public.tenant_contacts (
  id,
  tenant_id,
  linked_user_id,
  full_name,
  email,
  job_title,
  is_primary,
  created_by_user_id,
  updated_by_user_id
)
values
  ('aaaaaaaa-0001-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 'Cliente A', 'customer-a@portal.local', 'Operação', true, '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-0002-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '33333333-3333-4333-8333-333333333333', 'Manager A', 'manager-a@portal.local', 'Gestão', false, '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-0001-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '44444444-4444-4444-8444-444444444444', 'Cliente B', 'customer-b@portal.local', 'Operação', true, '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

insert into public.customer_account_profiles (
  tenant_id,
  product_line,
  operational_status,
  account_tier,
  created_by_user_id,
  updated_by_user_id
)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'genius_returns',
  'active',
  'Enterprise',
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111'
);

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
values
  ('aaaaaaaa-1000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-0001-4000-8000-000000000001', 'Portal ticket visivel ao cliente A', 'Caso do cliente A.', 'portal', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222'),
  ('aaaaaaaa-1000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-0002-4000-8000-000000000002', 'Portal ticket visivel ao manager', 'Caso do manager A.', 'portal', '33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333'),
  ('bbbbbbbb-1000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-0001-4000-8000-000000000001', 'Portal ticket tenant B', 'Caso do cliente B.', 'portal', '44444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444');

insert into public.ticket_messages (
  id,
  tenant_id,
  ticket_id,
  visibility,
  body,
  created_by_user_id
)
values
  ('aaaaaaaa-2000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-1000-4000-8000-000000000001', 'customer', 'Mensagem visivel ao cliente.', '22222222-2222-4222-8222-222222222222'),
  ('aaaaaaaa-2000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-1000-4000-8000-000000000001', 'internal', 'Nota interna proibida no portal.', '55555555-5555-4555-8555-555555555555');

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
  ('aaaaaaaa-3000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-1000-4000-8000-000000000001', 'customer', 'ticket-evidence', 'tenant/hidden/customer.pdf', 'evidencia-cliente.pdf', 'application/pdf', 1200, '22222222-2222-4222-8222-222222222222', 'available'),
  ('aaaaaaaa-3000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-1000-4000-8000-000000000001', 'internal', 'ticket-evidence', 'tenant/hidden/internal.pdf', 'evidencia-interna.pdf', 'application/pdf', 1200, '55555555-5555-4555-8555-555555555555', 'available');

insert into public.knowledge_categories (
  id,
  visibility,
  name,
  slug,
  created_by_user_id,
  updated_by_user_id
)
values (
  'aaaaaaaa-4000-4000-8000-000000000001',
  'public',
  'Portal Publico',
  'portal-publico',
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111'
);

insert into public.knowledge_articles (
  id,
  category_id,
  visibility,
  status,
  title,
  slug,
  summary,
  body_md,
  published_at,
  created_by_user_id,
  updated_by_user_id
)
values
  ('aaaaaaaa-5000-4000-8000-000000000001', 'aaaaaaaa-4000-4000-8000-000000000001', 'public', 'published', 'Artigo publico do portal', 'artigo-publico-portal', 'Resumo publico.', 'Conteudo publico.', timezone('utc', now()), '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-5000-4000-8000-000000000002', 'aaaaaaaa-4000-4000-8000-000000000001', 'internal', 'published', 'Artigo interno bloqueado', 'artigo-interno-bloqueado', 'Resumo interno.', 'Conteudo interno.', timezone('utc', now()), '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

insert into public.ticket_knowledge_links (
  tenant_id,
  ticket_id,
  article_id,
  link_type,
  created_by_user_id
)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'aaaaaaaa-1000-4000-8000-000000000001',
  'aaaaaaaa-5000-4000-8000-000000000001',
  'sent_to_customer',
  '55555555-5555-4555-8555-555555555555'
);

select app_private.create_ticket_event(
  'aaaaaaaa-1000-4000-8000-000000000001',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'message_added',
  'customer',
  '22222222-2222-4222-8222-222222222222',
  jsonb_build_object('safe', true),
  'aaaaaaaa-2000-4000-8000-000000000001'
);

select app_private.create_ticket_event(
  'aaaaaaaa-1000-4000-8000-000000000001',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'internal_note_added',
  'internal',
  '55555555-5555-4555-8555-555555555555',
  jsonb_build_object('secret', 'blocked'),
  'aaaaaaaa-2000-4000-8000-000000000002'
);

select ok(
  enum_range(null::public.tenant_role) @> array['customer_user', 'customer_manager']::public.tenant_role[],
  'roles customer-facing existem no enum tenant_role'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_customer_portal_ticket_list', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_customer_portal_ticket_detail', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_customer_portal_ticket_timeline', 'SELECT'),
  'authenticated recebe SELECT nos read models do portal cliente'
);

select ok(
  not has_function_privilege('anon', 'public.rpc_customer_create_ticket(uuid,text,text)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.rpc_customer_create_ticket(uuid,text,text)', 'EXECUTE'),
  'RPCs customer-facing nao ficam expostas a anon'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vw_customer_portal_ticket_attachments'
      and column_name in ('storage_bucket', 'storage_object_path', 'download_url')
  ),
  0,
  'view customer-facing de anexos nao expoe bucket, path ou URL'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vw_customer_portal_ticket_timeline'
      and column_name in ('assignment_id', 'metadata_raw', 'internal_note')
  ),
  0,
  'timeline customer-facing nao expoe campos internos'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_auth_context
  ),
  1,
  'customer_user ativo com contato vinculado possui contexto autenticado'
);

select is(
  (
    select account_tier
    from public.vw_customer_portal_profile_context
    where tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  'Enterprise',
  'profile context expoe somente contexto operacional seguro do proprio tenant'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_list
  ),
  1,
  'customer_user ve apenas tickets vinculados ao proprio contato'
);

select is(
  (
    select title
    from public.vw_customer_portal_ticket_list
  ),
  'Portal ticket visivel ao cliente A',
  'customer_user nao ve ticket de outro contato no mesmo tenant'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_timeline
    where ticket_id = 'aaaaaaaa-1000-4000-8000-000000000001'
      and (body = 'Nota interna proibida no portal.' or event_type = 'internal_note_added')
  ),
  0,
  'timeline do portal remove notas e eventos internos'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_attachments
    where ticket_id = 'aaaaaaaa-1000-4000-8000-000000000001'
  ),
  1,
  'portal lista apenas evidencias customer-facing'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_knowledge_articles
    where ticket_id = 'aaaaaaaa-1000-4000-8000-000000000001'
  ),
  1,
  'portal expoe apenas knowledge publica enviada ao cliente'
);

select lives_ok(
  $$
    select public.rpc_customer_add_ticket_message(
      'aaaaaaaa-1000-4000-8000-000000000001',
      'Resposta do cliente pelo portal.'
    )
  $$,
  'customer_user adiciona mensagem customer-facing por RPC'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_timeline
    where ticket_id = 'aaaaaaaa-1000-4000-8000-000000000001'
      and event_type = 'message_added'
  ),
  2,
  'mensagem customer-facing gera ticket_event customer'
);

select throws_ok(
  $$
    select public.rpc_customer_get_attachment_download_url('aaaaaaaa-3000-4000-8000-000000000002')
  $$,
  'P0001',
  'attachment is not available for customer portal',
  'download de anexo interno fica bloqueado'
);

select lives_ok(
  $$
    select public.rpc_customer_get_attachment_download_url('aaaaaaaa-3000-4000-8000-000000000001')
  $$,
  'download de anexo customer-facing autorizado gera grant curto'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.ticket_attachment_download_grants
    where attachment_id = 'aaaaaaaa-3000-4000-8000-000000000001'
      and granted_to_user_id = '22222222-2222-4222-8222-222222222222'
  ),
  1,
  'RPC de download registra grant vinculado ao ator'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';

select lives_ok(
  $$
    select public.rpc_customer_acknowledge_ticket_update(
      'aaaaaaaa-1000-4000-8000-000000000001',
      'aaaaaaaa-2000-4000-8000-000000000001'
    )
  $$,
  'cliente registra acknowledgement por RPC'
);

reset role;

select is(
  (
    select count(*)::integer
    from audit.audit_logs
    where entity_table = 'customer_ticket_update_acknowledgements'
      and actor_user_id = '22222222-2222-4222-8222-222222222222'
  ),
  1,
  'acknowledgement customer-facing gera audit_log'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';

select throws_ok(
  $$
    select public.rpc_customer_add_ticket_message(
      'bbbbbbbb-1000-4000-8000-000000000001',
      'Tentativa cross-tenant.'
    )
  $$,
  'P0001',
  'rpc_customer_add_ticket_message denied',
  'customer_user nao altera ticket de outro tenant'
);

select lives_ok(
  $$
    select public.rpc_customer_create_ticket(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'Ticket criado pelo portal',
      'Descricao criada por cliente autenticado.'
    )
  $$,
  'cliente cria ticket portal com tenant e contato validados'
);

reset role;

select is(
  (
    select source
    from public.tickets
    where title = 'Ticket criado pelo portal'
  ),
  'portal'::public.ticket_source,
  'ticket criado pelo portal usa source portal no backend'
);

select ok(
  (
    select count(*)::integer
    from audit.audit_logs
    where entity_table = 'tickets'
      and actor_user_id = '22222222-2222-4222-8222-222222222222'
      and after_state ->> 'title' = 'Ticket criado pelo portal'
  ) >= 1,
  'criacao de ticket pelo portal gera audit_log'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_list
    where tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  3,
  'customer_manager ve tickets do proprio tenant'
);

set local request.jwt.claim.sub = '55555555-5555-4555-8555-555555555555';

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_list
  ),
  0,
  'operador interno sem papel customer-facing nao acessa portal do cliente'
);

select is(
  (
    select count(*)::integer
    from information_schema.table_privileges as tp
    where tp.grantee = 'authenticated'
      and tp.privilege_type in ('INSERT', 'UPDATE', 'DELETE')
      and tp.table_schema = 'public'
      and tp.table_name in ('tickets', 'ticket_messages', 'ticket_attachments', 'customer_ticket_update_acknowledgements')
  ),
  0,
  'authenticated nao possui DML direto nas bases usadas pelo portal'
);

select * from finish();
rollback;
