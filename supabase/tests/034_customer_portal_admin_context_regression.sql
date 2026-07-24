create extension if not exists pgtap with schema extensions;

begin;

select plan(11);

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
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
    'authenticated',
    'authenticated',
    'platform-admin@portal-regression.local',
    crypt('password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Platform Admin Regression"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-4bbb-8bbb-111111111111',
    'authenticated',
    'authenticated',
    'customer-user@portal-regression.local',
    crypt('password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Customer User Regression"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  );

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
  'platform_admin',
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111'
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
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-222222222222',
  'portal-regression-tenant',
  'Portal Regression Tenant LTDA',
  'Portal Regression Tenant',
  'active',
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111'
);

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
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-333333333333',
  'aaaaaaaa-aaaa-4aaa-8aaa-222222222222',
  'bbbbbbbb-bbbb-4bbb-8bbb-111111111111',
  'customer_user',
  'active',
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111'
);

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
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-444444444444',
  'aaaaaaaa-aaaa-4aaa-8aaa-222222222222',
  'bbbbbbbb-bbbb-4bbb-8bbb-111111111111',
  'Customer User Regression',
  'customer-user@portal-regression.local',
  true,
  true,
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111'
);

insert into public.customer_account_features (
  tenant_id,
  feature_key,
  enabled,
  source,
  created_by_user_id,
  updated_by_user_id
)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-222222222222',
  'returns_portal',
  true,
  'contract',
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-111111111111'
)
on conflict (tenant_id, lower(feature_key)) do update
set
  enabled = excluded.enabled,
  source = excluded.source,
  updated_by_user_id = excluded.updated_by_user_id;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-111111111111';

select is(
  (select count(*)::integer from public.vw_admin_auth_context),
  1,
  'platform_admin continua resolvendo uma unica linha no auth context'
);

select ok(
  exists(select 1 from public.vw_admin_customer_portal_access_overview),
  'platform_admin continua lendo o overview administrativo do portal cliente'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-111111111111';

select is(
  (select count(*)::integer from public.vw_admin_auth_context),
  1,
  'customer_user continua resolvendo o proprio auth context sem promover sessao admin'
);

select ok(
  not (select roles @> array['platform_admin'::public.platform_role] from public.vw_admin_auth_context),
  'customer_user nao herda role platform_admin ao trocar de superficie'
);

select ok(
  exists(
    select 1
    from public.vw_admin_customer_portal_access_overview
    where tenant_count = 0
      and active_tenant_count = 0
      and portal_user_count = 0
      and active_user_count = 0
      and visible_ticket_count = 0
      and authorized_article_count = 0
  ),
  'customer_user nao recebe dado administrativo util no overview do portal cliente'
);

select is(
  (select count(*)::integer from public.vw_admin_customer_portal_tenant_access),
  0,
  'customer_user nao recebe leitura por tenant do admin customer portal'
);

select is(
  (select count(*)::integer from public.vw_admin_customer_portal_users),
  0,
  'customer_user nao recebe lista administrativa de usuarios customer-facing'
);

select is(
  (select count(*)::integer from public.vw_admin_knowledge_entitlements),
  0,
  'customer_user nao recebe entitlements administrativos'
);

select is(
  (select count(*)::integer from public.vw_admin_ticket_knowledge_links),
  0,
  'customer_user nao recebe vinculos administrativos ticket-knowledge'
);

select ok(
  exists(select 1 from public.vw_customer_portal_profile_context),
  'customer_user continua com o proprio contexto customer-facing disponivel'
);

select ok(
  exists(select 1 from public.vw_customer_portal_auth_context),
  'customer_user continua com auth context customer-facing disponivel'
);

select * from finish();
rollback;
