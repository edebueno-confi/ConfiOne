create extension if not exists pgtap with schema extensions;

begin;

select plan(18);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'admin@portal-access-admin.local', crypt('password', gen_salt('bf')), timezone('utc', now()), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Admin Portal Access"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'customer-a@portal-access-admin.local', crypt('password', gen_salt('bf')), timezone('utc', now()), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Cliente Portal A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'manager-a@portal-access-admin.local', crypt('password', gen_salt('bf')), timezone('utc', now()), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Gestão Portal A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'customer-b@portal-access-admin.local', crypt('password', gen_salt('bf')), timezone('utc', now()), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Cliente Portal B"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values (
  '11111111-1111-4111-8111-111111111111',
  'platform_admin',
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111'
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
  ('aaaaaaaa-aaaa-4aaa-8aaa-222222222222', 'portal-admin-a', 'Portal Admin A LTDA', 'Portal Admin A', 'active', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-222222222222', 'portal-admin-b', 'Portal Admin B LTDA', 'Portal Admin B', 'active', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

insert into public.tenant_memberships (
  id,
  tenant_id,
  user_id,
  role,
  status,
  invited_by_user_id,
  created_by_user_id,
  updated_by_user_id
)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-222222222222', '22222222-2222-4222-8222-222222222222', 'customer_user', 'active', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-444444444444', 'aaaaaaaa-aaaa-4aaa-8aaa-222222222222', '33333333-3333-4333-8333-333333333333', 'customer_manager', 'active', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-333333333333', 'bbbbbbbb-bbbb-4bbb-8bbb-222222222222', '44444444-4444-4444-8444-444444444444', 'customer_user', 'invited', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

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
  ('aaaaaaaa-1000-4000-8000-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-222222222222', '22222222-2222-4222-8222-222222222222', 'Cliente Portal A', 'customer-a@portal-access-admin.local', true, true, '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-2000-4000-8000-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-222222222222', '33333333-3333-4333-8333-333333333333', 'Gestão Portal A', 'manager-a@portal-access-admin.local', false, true, '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

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
  ('aaaaaaaa-bbbb-4000-8000-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-222222222222', 'aaaaaaaa-1000-4000-8000-111111111111', 'Ticket Portal Admin A', 'Ticket customer-facing do tenant A.', 'portal', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222'),
  ('bbbbbbbb-cccc-4000-8000-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-222222222222', null, 'Ticket Portal Admin B', 'Ticket do tenant B sem contato customer-facing ativo.', 'portal', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

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
  ('aaaaaaaa-3000-4000-8000-111111111111', (select id from public.knowledge_spaces where slug = 'genius'), 'public', 'Portal Público Admin', 'portal-publico-admin', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-3000-4000-8000-222222222222', (select id from public.knowledge_spaces where slug = 'genius'), 'restricted', 'Portal Restrito Admin', 'portal-restrito-admin', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-3000-4000-8000-333333333333', (select id from public.knowledge_spaces where slug = 'genius'), 'internal', 'Portal Interno Admin', 'portal-interno-admin', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

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
  ('aaaaaaaa-5000-4000-8000-666666666661', (select id from public.knowledge_spaces where slug = 'genius'), 'aaaaaaaa-3000-4000-8000-111111111111', 'public', 'published', 'Artigo Público Admin', 'artigo-publico-admin', 'Resumo público admin.', '# Público', timezone('utc', now()), '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-5000-4000-8000-666666666662', (select id from public.knowledge_spaces where slug = 'genius'), 'aaaaaaaa-3000-4000-8000-222222222222', 'restricted', 'published', 'Artigo Restrito Admin', 'artigo-restrito-admin', 'Resumo restrito admin.', '# Restrito', timezone('utc', now()), '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-5000-4000-8000-666666666663', (select id from public.knowledge_spaces where slug = 'genius'), 'aaaaaaaa-3000-4000-8000-333333333333', 'internal', 'published', 'Artigo Interno Admin', 'artigo-interno-admin', 'Resumo interno admin.', '# Interno', timezone('utc', now()), '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-5000-4000-8000-666666666664', (select id from public.knowledge_spaces where slug = 'genius'), 'aaaaaaaa-3000-4000-8000-222222222222', 'restricted', 'draft', 'Artigo Draft Admin', 'artigo-draft-admin', 'Resumo draft admin.', '# Draft', null, '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

select ok(
  has_table_privilege('authenticated', 'public.vw_admin_customer_portal_access_overview', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_admin_customer_portal_users', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_admin_knowledge_entitlements', 'SELECT'),
  'authenticated recebe SELECT nas views administrativas do portal cliente'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vw_admin_customer_portal_users'
      and column_name in ('encrypted_password', 'storage_object_path', 'metadata', 'token')
  ),
  0,
  'view administrativa de usuários customer-facing não expõe segredo nem path sensível'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select lives_ok(
  $$
    create temporary table customer_portal_admin_entitlement_capture as
    select (
      public.rpc_admin_grant_knowledge_article_entitlement(
        'aaaaaaaa-aaaa-4aaa-8aaa-222222222222',
        'aaaaaaaa-5000-4000-8000-666666666662',
        'customer_portal'::public.knowledge_article_entitlement_scope,
        'Liberado para o portal autenticado do tenant A.'
      )
    ).id as entitlement_id
  $$,
  'platform_admin concede entitlement customer_portal'
);

select lives_ok(
  $$
    create temporary table customer_portal_admin_link_capture as
    select (
      public.rpc_admin_link_knowledge_article_to_ticket(
        'aaaaaaaa-aaaa-4aaa-8aaa-222222222222',
        'aaaaaaaa-bbbb-4000-8000-222222222222',
        'aaaaaaaa-5000-4000-8000-666666666662',
        'Vínculo seguro com o ticket do tenant A.'
      )
    ).id as link_id
  $$,
  'platform_admin vincula artigo autorizado a ticket customer-facing'
);

select ok(
  exists(
    select 1
    from public.vw_admin_customer_portal_access_overview
    where portal_user_count = 3
      and active_user_count = 2
      and invited_user_count = 1
      and blocked_user_count = 0
  ),
  'overview administrativo resume usuários customer-facing e estados reais'
);

select ok(
  exists(
    select 1
    from public.vw_admin_customer_portal_users
    where membership_id = 'aaaaaaaa-aaaa-4aaa-8aaa-333333333333'
      and portal_role = 'customer_user'
      and access_status = 'active'
      and visible_ticket_count = 1
  ),
  'lista administrativa de usuários mostra papel, acesso e tickets visíveis reais'
);

select ok(
  exists(
    select 1
    from public.vw_admin_customer_portal_user_detail
    where membership_id = 'aaaaaaaa-aaaa-4aaa-8aaa-333333333333'
      and authorized_article_count >= 2
      and customer_portal_article_count >= 1
  ),
  'detalhe administrativo do usuário expõe contagem autorizada sem depender do frontend'
);

select ok(
  exists(
    select 1
    from public.vw_admin_knowledge_entitlements
    where article_slug = 'artigo-restrito-admin'
      and entitlement_status = 'active'
      and exposure_source = 'customer_portal'
  ),
  'admin vê entitlement ativo do artigo restrito publicado'
);

select is(
  (
    select count(*)::integer
    from public.vw_admin_knowledge_entitlements
    where article_slug in ('artigo-interno-admin', 'artigo-draft-admin')
  ),
  0,
  'admin do portal cliente não recebe draft ou internal nas views sanitizadas de entitlement'
);

select ok(
  exists(
    select 1
    from public.vw_admin_ticket_knowledge_links
    where ticket_id = 'aaaaaaaa-bbbb-4000-8000-222222222222'
      and article_slug = 'artigo-restrito-admin'
      and link_status = 'active'
      and tenant_slug = 'portal-admin-a'
  ),
  'admin vê o vínculo ticket-artigo sanitizado e tenant-aware'
);

select lives_ok(
  $$
    select public.rpc_admin_update_tenant_member_role(
      'bbbbbbbb-bbbb-4bbb-8bbb-333333333333',
      'customer_manager'::public.tenant_role
    )
  $$,
  'platform_admin atualiza role customer-facing com RPC genérica governada'
);

select lives_ok(
  $$
    select public.rpc_admin_update_tenant_member_status(
      'bbbbbbbb-bbbb-4bbb-8bbb-333333333333',
      'revoked'::public.membership_status
    )
  $$,
  'platform_admin atualiza status customer-facing com RPC genérica governada'
);

select ok(
  exists(
    select 1
    from public.vw_admin_customer_portal_users
    where membership_id = 'bbbbbbbb-bbbb-4bbb-8bbb-333333333333'
      and portal_role = 'customer_manager'
      and membership_status = 'revoked'::public.membership_status
  ),
  'mudanças de role e status aparecem no read model administrativo'
);

select lives_ok(
  $$
    select public.rpc_admin_archive_knowledge_article_entitlement(
      'aaaaaaaa-aaaa-4aaa-8aaa-222222222222',
      (select entitlement_id from customer_portal_admin_entitlement_capture)
    )
  $$,
  'platform_admin arquiva entitlement customer-facing'
);

reset role;

select is(
  (
    select count(*)::integer
    from audit.audit_logs
    where entity_table = 'knowledge_article_entitlements'
      and actor_user_id = '11111111-1111-4111-8111-111111111111'
  ),
  2,
  'grant e archive de entitlement geram audit_log'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_knowledge_articles
    where tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-222222222222'
      and slug = 'artigo-restrito-admin'
  ),
  1,
  'customer mantém somente o acesso ticket-linked após arquivamento do entitlement'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_knowledge_articles
    where slug = 'artigo-interno-admin'
  ),
  0,
  'customer não recebe knowledge internal após a administração do portal'
);

reset role;

select ok(
  not has_table_privilege('authenticated', 'public.knowledge_article_entitlements', 'INSERT')
  and not has_table_privilege('authenticated', 'public.knowledge_article_entitlements', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.ticket_knowledge_links', 'INSERT'),
  'authenticated continua sem DML direto nas tabelas base de entitlement e ticket link'
);

select *
from finish();

rollback;
