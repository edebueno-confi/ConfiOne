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
  ('00000000-0000-0000-0000-000000000000', '10111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'admin@portal-knowledge.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Admin Portal Knowledge"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '20222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'customer-a@portal-knowledge.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Cliente Knowledge A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '30333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'manager-a@portal-knowledge.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Gestão Knowledge A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '40444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'customer-b@portal-knowledge.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Cliente Knowledge B"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values (
  '10111111-1111-4111-8111-111111111111',
  'platform_admin',
  '10111111-1111-4111-8111-111111111111',
  '10111111-1111-4111-8111-111111111111'
);

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
  ('aaaaaaaa-aaaa-4aaa-8aaa-111111111111', 'portal-knowledge-a', 'Portal Knowledge A LTDA', 'Portal Knowledge A', 'active', '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-111111111111', 'portal-knowledge-b', 'Portal Knowledge B LTDA', 'Portal Knowledge B', 'active', '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111');

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
  ('aaaaaaaa-aaaa-4aaa-8aaa-111111111111', '20222222-2222-4222-8222-222222222222', 'customer_user', 'active', '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-111111111111', '30333333-3333-4333-8333-333333333333', 'customer_manager', 'active', '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-111111111111', '40444444-4444-4444-8444-444444444444', 'customer_user', 'active', '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111');

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
  ('aaaaaaaa-0001-4000-8000-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-111111111111', '20222222-2222-4222-8222-222222222222', 'Cliente Knowledge A', 'customer-a@portal-knowledge.local', true, '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-0002-4000-8000-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-111111111111', '30333333-3333-4333-8333-333333333333', 'Gestão Knowledge A', 'manager-a@portal-knowledge.local', false, '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-0001-4000-8000-111111111111', 'bbbbbbbb-bbbb-4bbb-8bbb-111111111111', '40444444-4444-4444-8444-444444444444', 'Cliente Knowledge B', 'customer-b@portal-knowledge.local', true, '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111');

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
  ('aaaaaaaa-bbbb-4000-8000-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-111111111111', 'aaaaaaaa-0001-4000-8000-111111111111', 'Ticket Knowledge A', 'Ticket autorizado do tenant A.', 'portal', '20222222-2222-4222-8222-222222222222', '20222222-2222-4222-8222-222222222222'),
  ('bbbbbbbb-cccc-4000-8000-111111111111', 'bbbbbbbb-bbbb-4bbb-8bbb-111111111111', 'bbbbbbbb-0001-4000-8000-111111111111', 'Ticket Knowledge B', 'Ticket do tenant B.', 'portal', '40444444-4444-4444-8444-444444444444', '40444444-4444-4444-8444-444444444444');

update public.knowledge_spaces
set status = 'active'
where slug = 'genius';

insert into public.knowledge_categories (
  id,
  knowledge_space_id,
  visibility,
  name,
  slug,
  created_by_user_id,
  updated_by_user_id
)
values
  ('aaaaaaaa-4000-4000-8000-111111111111', (select id from public.knowledge_spaces where slug = 'genius'), 'public', 'Portal Público', 'portal-publico-v3', '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-4000-4000-8000-222222222222', (select id from public.knowledge_spaces where slug = 'genius'), 'restricted', 'Portal Restrito', 'portal-restrito-v3', '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-4000-4000-8000-333333333333', (select id from public.knowledge_spaces where slug = 'genius'), 'internal', 'Portal Interno', 'portal-interno-v3', '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111');

insert into public.knowledge_articles (
  id,
  knowledge_space_id,
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
  ('aaaaaaaa-5000-4000-8000-111111111111', (select id from public.knowledge_spaces where slug = 'genius'), 'aaaaaaaa-4000-4000-8000-111111111111', 'public', 'published', 'Artigo Público Portal V3', 'artigo-publico-portal-v3', 'Resumo público.', '# Público', timezone('utc', now()), '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-5000-4000-8000-222222222222', (select id from public.knowledge_spaces where slug = 'genius'), 'aaaaaaaa-4000-4000-8000-222222222222', 'restricted', 'published', 'Artigo Restrito Tenant V3', 'artigo-restrito-tenant-v3', 'Resumo restrito por tenant.', '# Restrito', timezone('utc', now()), '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-5000-4000-8000-333333333333', (select id from public.knowledge_spaces where slug = 'genius'), 'aaaaaaaa-4000-4000-8000-222222222222', 'restricted', 'published', 'Artigo Restrito Ticket V3', 'artigo-restrito-ticket-v3', 'Resumo restrito por ticket.', '# Restrito ticket', timezone('utc', now()), '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-5000-4000-8000-444444444444', (select id from public.knowledge_spaces where slug = 'genius'), 'aaaaaaaa-4000-4000-8000-333333333333', 'internal', 'published', 'Artigo Interno Bloqueado V3', 'artigo-interno-bloqueado-v3', 'Resumo interno.', '# Interno', timezone('utc', now()), '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-5000-4000-8000-555555555555', (select id from public.knowledge_spaces where slug = 'genius'), 'aaaaaaaa-4000-4000-8000-222222222222', 'restricted', 'draft', 'Artigo Draft Bloqueado V3', 'artigo-draft-bloqueado-v3', 'Resumo draft.', '# Draft', null, '10111111-1111-4111-8111-111111111111', '10111111-1111-4111-8111-111111111111');

select ok(
  has_table_privilege('authenticated', 'public.vw_customer_portal_knowledge_articles', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_customer_portal_knowledge_article_detail', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_customer_portal_ticket_knowledge_links', 'SELECT'),
  'authenticated recebe SELECT nos read models customer-facing de knowledge'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vw_customer_portal_knowledge_article_detail'
      and column_name in ('source_path', 'source_hash', 'review_status', 'human_confirmations', 'storage_object_path')
  ),
  0,
  'detalhe customer-facing de knowledge nao expoe metadados internos ou path sensivel'
);

select ok(
  not has_function_privilege('anon', 'public.rpc_admin_grant_knowledge_article_entitlement(uuid,uuid,public.knowledge_article_entitlement_scope,text)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.rpc_admin_grant_knowledge_article_entitlement(uuid,uuid,public.knowledge_article_entitlement_scope,text)', 'EXECUTE'),
  'RPC administrativa de entitlement nao fica exposta a anon'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '10111111-1111-4111-8111-111111111111';

select lives_ok(
  $$
    create temporary table customer_portal_entitlement_capture as
    select (
      public.rpc_admin_grant_knowledge_article_entitlement(
        'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
        'aaaaaaaa-5000-4000-8000-222222222222',
        'tenant'::public.knowledge_article_entitlement_scope,
        'Material autorizado para o tenant A.'
      )
    ).id as entitlement_id
  $$,
  'platform_admin concede entitlement tenant para artigo restrito publicado'
);

select lives_ok(
  $$
    select public.rpc_admin_link_knowledge_article_to_ticket(
      'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
      'aaaaaaaa-bbbb-4000-8000-111111111111',
      'aaaaaaaa-5000-4000-8000-333333333333',
      'Guia enviado no contexto deste ticket.'
    )
  $$,
  'platform_admin vincula artigo restrito a ticket permitido'
);

select throws_ok(
  $$
    select public.rpc_admin_grant_knowledge_article_entitlement(
      'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
      'aaaaaaaa-5000-4000-8000-444444444444',
      'tenant'::public.knowledge_article_entitlement_scope,
      'Tentativa inválida.'
    )
  $$,
  'P0001',
  'internal knowledge article cannot be exposed in customer portal',
  'artigo internal segue bloqueado para entitlement customer-facing'
);

select throws_ok(
  $$
    select public.rpc_admin_grant_knowledge_article_entitlement(
      'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
      'aaaaaaaa-5000-4000-8000-555555555555',
      'tenant'::public.knowledge_article_entitlement_scope,
      'Tentativa draft.'
    )
  $$,
  'P0001',
  'knowledge article must be published before customer portal exposure',
  'entitlement nao publica artigo draft automaticamente'
);

reset role;

select is(
  (
    select count(*)::integer
    from audit.audit_logs
    where entity_table = 'knowledge_article_entitlements'
      and actor_user_id = '10111111-1111-4111-8111-111111111111'
  ),
  1,
  'grant de entitlement gera audit_log'
);

select ok(
  exists(
    select 1
    from public.ticket_knowledge_links as tkl
    where tkl.ticket_id = 'aaaaaaaa-bbbb-4000-8000-111111111111'
      and tkl.article_id = 'aaaaaaaa-5000-4000-8000-333333333333'
      and tkl.link_type = 'sent_to_customer'::public.ticket_knowledge_link_type
      and tkl.archived_at is null
  ),
  'link ticket-linked customer-facing foi materializado'
);

set local role anon;
set local request.jwt.claim.role = 'anon';

select is(
  (
    select count(*)::integer
    from public.vw_public_knowledge_articles_list
    where slug in (
      'artigo-publico-portal-v3',
      'artigo-restrito-tenant-v3',
      'artigo-restrito-ticket-v3',
      'artigo-interno-bloqueado-v3',
      'artigo-draft-bloqueado-v3'
    )
  ),
  1,
  'help público continua exibindo apenas artigo público publicado'
);

reset role;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '20222222-2222-4222-8222-222222222222';

select ok(
  exists(
    select 1
    from public.vw_customer_portal_knowledge_articles
    where tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-111111111111'
      and slug = 'artigo-publico-portal-v3'
      and source = 'public'
  ),
  'customer_user ve artigo público na biblioteca autorizada'
);

select ok(
  exists(
    select 1
    from public.vw_customer_portal_knowledge_articles
    where tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-111111111111'
      and slug = 'artigo-restrito-tenant-v3'
      and source = 'customer_portal'
  ),
  'customer_user ve artigo restrito com entitlement tenant'
);

select ok(
  exists(
    select 1
    from public.vw_customer_portal_ticket_knowledge_links
    where ticket_id = 'aaaaaaaa-bbbb-4000-8000-111111111111'
      and slug = 'artigo-restrito-ticket-v3'
      and source = 'ticket_linked'
  ),
  'customer_user ve artigo restrito vinculado a ticket permitido'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_knowledge_links
    where ticket_id = 'bbbbbbbb-cccc-4000-8000-111111111111'
  ),
  0,
  'customer_user nao ve knowledge linkada a ticket de outro tenant'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_knowledge_articles
    where slug in ('artigo-interno-bloqueado-v3', 'artigo-draft-bloqueado-v3')
  ),
  0,
  'customer_user nao ve artigos internal ou draft'
);

select ok(
  exists(
    select 1
    from public.vw_customer_portal_knowledge_article_detail
    where tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-111111111111'
      and slug = 'artigo-restrito-tenant-v3'
      and body_md = '# Restrito'
  ),
  'detalhe customer-facing retorna apenas conteúdo autorizado do artigo'
);

select throws_ok(
  $$
    insert into public.knowledge_article_entitlements (
      tenant_id,
      article_id,
      entitlement_scope,
      created_by_user_id,
      updated_by_user_id
    ) values (
      'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
      'aaaaaaaa-5000-4000-8000-222222222222',
      'tenant'::public.knowledge_article_entitlement_scope,
      '20222222-2222-4222-8222-222222222222',
      '20222222-2222-4222-8222-222222222222'
    )
  $$,
  '42501',
  'permission denied for table knowledge_article_entitlements',
  'authenticated continua sem DML direto em knowledge_article_entitlements'
);

reset role;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '40444444-4444-4444-8444-444444444444';

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_knowledge_articles
    where tenant_id = 'bbbbbbbb-bbbb-4bbb-8bbb-111111111111'
      and slug in (
        'artigo-restrito-tenant-v3',
        'artigo-restrito-ticket-v3'
      )
  ),
  0,
  'customer de outro tenant nao herda entitlement ou ticket link alheio'
);

reset role;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '10111111-1111-4111-8111-111111111111';

select lives_ok(
  $$
    select public.rpc_admin_archive_knowledge_article_entitlement(
      'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
      (select entitlement_id from customer_portal_entitlement_capture limit 1)
    )
  $$,
  'platform_admin arquiva entitlement customer-facing'
);

reset role;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '20222222-2222-4222-8222-222222222222';

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_knowledge_articles
    where tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-111111111111'
      and slug = 'artigo-restrito-tenant-v3'
  ),
  0,
  'entitlement arquivado deixa de expor artigo ao customer'
);

reset role;

select * from finish();
rollback;
