create extension if not exists pgtap with schema extensions;

begin;

select plan(9);

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
    '72000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'portal-session-admin@local',
    crypt('password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Portal Session Admin"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '72000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'portal-session-ready@local',
    crypt('password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Portal Session Ready"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '72000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'portal-session-no-portal@local',
    crypt('password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Portal Session No Portal"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '72000000-0000-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'portal-session-revoked@local',
    crypt('password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Portal Session Revoked"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '72000000-0000-4000-8000-000000000005',
    'authenticated',
    'authenticated',
    'portal-session-inactive@local',
    crypt('password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Portal Session Inactive"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  )
on conflict (id) do nothing;

insert into public.profiles (
  id,
  email,
  full_name,
  is_active,
  created_by_user_id,
  updated_by_user_id
)
values
  (
    '72000000-0000-4000-8000-000000000001',
    'portal-session-admin@local',
    'Portal Session Admin',
    true,
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  ),
  (
    '72000000-0000-4000-8000-000000000002',
    'portal-session-ready@local',
    'Portal Session Ready',
    true,
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  ),
  (
    '72000000-0000-4000-8000-000000000003',
    'portal-session-no-portal@local',
    'Portal Session No Portal',
    true,
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  ),
  (
    '72000000-0000-4000-8000-000000000004',
    'portal-session-revoked@local',
    'Portal Session Revoked',
    true,
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  ),
  (
    '72000000-0000-4000-8000-000000000005',
    'portal-session-inactive@local',
    'Portal Session Inactive',
    false,
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  )
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  is_active = excluded.is_active,
  updated_by_user_id = excluded.updated_by_user_id;

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values (
  '72000000-0000-4000-8000-000000000001',
  'platform_admin',
  '72000000-0000-4000-8000-000000000001',
  '72000000-0000-4000-8000-000000000001'
)
on conflict do nothing;

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
  (
    '72000000-0000-4000-8000-100000000001',
    'portal-session-tenant-a',
    'Portal Session Tenant A LTDA',
    'Portal Session Tenant A',
    'active',
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  ),
  (
    '72000000-0000-4000-8000-100000000002',
    'portal-session-tenant-b',
    'Portal Session Tenant B LTDA',
    'Portal Session Tenant B',
    'active',
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  )
on conflict (id) do nothing;

insert into public.customer_account_features (
  tenant_id,
  feature_key,
  enabled,
  source,
  created_by_user_id,
  updated_by_user_id
)
values
  (
    '72000000-0000-4000-8000-100000000001',
    'returns_portal',
    true,
    'contract',
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  ),
  (
    '72000000-0000-4000-8000-100000000002',
    'returns_portal',
    false,
    'contract',
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
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
values
  (
    '72000000-0000-4000-8000-200000000001',
    '72000000-0000-4000-8000-100000000001',
    '72000000-0000-4000-8000-000000000002',
    'customer_user',
    'active',
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  ),
  (
    '72000000-0000-4000-8000-200000000002',
    '72000000-0000-4000-8000-100000000002',
    '72000000-0000-4000-8000-000000000003',
    'customer_user',
    'active',
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  ),
  (
    '72000000-0000-4000-8000-200000000003',
    '72000000-0000-4000-8000-100000000001',
    '72000000-0000-4000-8000-000000000004',
    'customer_user',
    'revoked',
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  ),
  (
    '72000000-0000-4000-8000-200000000004',
    '72000000-0000-4000-8000-100000000001',
    '72000000-0000-4000-8000-000000000005',
    'customer_user',
    'active',
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  )
on conflict (id) do update
set
  role = excluded.role,
  status = excluded.status,
  updated_by_user_id = excluded.updated_by_user_id;

insert into public.tenant_contacts (
  id,
  tenant_id,
  full_name,
  email,
  linked_user_id,
  is_active,
  is_primary,
  created_by_user_id,
  updated_by_user_id
)
values
  (
    '72000000-0000-4000-8000-300000000001',
    '72000000-0000-4000-8000-100000000001',
    'Portal Session Ready',
    'portal-session-ready@local',
    '72000000-0000-4000-8000-000000000002',
    true,
    true,
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  ),
  (
    '72000000-0000-4000-8000-300000000002',
    '72000000-0000-4000-8000-100000000002',
    'Portal Session No Portal',
    'portal-session-no-portal@local',
    '72000000-0000-4000-8000-000000000003',
    true,
    true,
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  ),
  (
    '72000000-0000-4000-8000-300000000003',
    '72000000-0000-4000-8000-100000000001',
    'Portal Session Revoked',
    'portal-session-revoked@local',
    '72000000-0000-4000-8000-000000000004',
    true,
    false,
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  ),
  (
    '72000000-0000-4000-8000-300000000004',
    '72000000-0000-4000-8000-100000000001',
    'Portal Session Inactive',
    'portal-session-inactive@local',
    '72000000-0000-4000-8000-000000000005',
    true,
    false,
    '72000000-0000-4000-8000-000000000001',
    '72000000-0000-4000-8000-000000000001'
  )
on conflict (id) do nothing;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '72000000-0000-4000-8000-000000000002';

select is(
  (
    select session_state
    from public.rpc_customer_get_portal_session_status()
  ),
  'ready',
  'status do portal retorna ready para customer com tenant ativo válido'
);

select is(
  (
    select available_tenant_count
    from public.rpc_customer_get_portal_session_status()
  ),
  1,
  'status do portal devolve a contagem segura de tenants disponíveis'
);

set local request.jwt.claim.sub = '72000000-0000-4000-8000-000000000003';

select is(
  (
    select session_state
    from public.rpc_customer_get_portal_session_status()
  ),
  'tenant_unavailable',
  'customer com membership ativa mas sem returns_portal recebe tenant_unavailable'
);

select is(
  (
    select reason_code
    from public.rpc_customer_get_portal_session_status()
  ),
  'returns_portal_disabled',
  'tenant sem returns_portal habilitado devolve motivo explícito'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_active_tenant_context
  ),
  0,
  'tenant indisponível não materializa active tenant context'
);

set local request.jwt.claim.sub = '72000000-0000-4000-8000-000000000004';

select is(
  (
    select reason_code
    from public.rpc_customer_get_portal_session_status()
  ),
  'membership_revoked',
  'membership removido ou inativo devolve access_revoked no backend'
);

set local request.jwt.claim.sub = '72000000-0000-4000-8000-000000000005';

select is(
  (
    select reason_code
    from public.rpc_customer_get_portal_session_status()
  ),
  'profile_inactive',
  'perfil customer inativo devolve access_revoked com motivo explícito'
);

select throws_ok(
  $$
    insert into public.customer_portal_user_preferences (
      user_id,
      active_tenant_id,
      created_by_user_id,
      updated_by_user_id
    )
    values (
      '72000000-0000-4000-8000-000000000005',
      '72000000-0000-4000-8000-100000000001',
      '72000000-0000-4000-8000-000000000005',
      '72000000-0000-4000-8000-000000000005'
    )
  $$,
  '42501',
  'permission denied for table customer_portal_user_preferences',
  'authenticated não faz DML direto na preferência customer-facing'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '72000000-0000-4000-8000-000000000001';

select is(
  (
    select count(*)::integer
    from public.vw_admin_auth_context
  ),
  1,
  'contexto administrativo segue isolado da semântica de sessão customer-facing'
);

select * from finish();
rollback;
