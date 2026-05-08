create extension if not exists pgtap with schema extensions;

begin;

select plan(23);

select is(
  (
    select count(*)::integer
    from information_schema.table_privileges as tp
    where tp.grantee = 'authenticated'
      and tp.privilege_type = 'SELECT'
      and tp.table_schema = 'public'
      and tp.table_name in (
        'vw_admin_access_users',
        'vw_admin_access_user_detail',
        'vw_admin_access_memberships',
        'vw_admin_system_audit_events',
        'vw_admin_system_health_checks',
        'vw_admin_system_operational_summary'
      )
  ),
  6,
  'authenticated possui SELECT nos read models contratuais de Access/System'
);

select is(
  (
    select count(*)::integer
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'vw_admin_access_users',
        'vw_admin_access_user_detail',
        'vw_admin_access_memberships',
        'vw_admin_system_audit_events',
        'vw_admin_system_health_checks',
        'vw_admin_system_operational_summary'
      )
      and exists (
        select 1
        from unnest(coalesce(c.reloptions, array[]::text[])) as opt
        where opt = 'security_barrier=true'
      )
  ),
  6,
  'read models de Access/System usam security_barrier'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vw_admin_system_audit_events'
      and column_name in ('before_state', 'after_state', 'metadata')
  ),
  0,
  'feed sanitizado de system nao expoe before_state, after_state ou metadata bruta'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vw_admin_system_audit_events'
      and column_name = 'sanitized_context'
  ),
  'feed sanitizado expoe apenas contexto resumido'
);

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
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated',
    'authenticated',
    'access-admin@genius.local',
    crypt('password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Access Platform Admin"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'authenticated',
    'authenticated',
    'access-tenant-admin@tenant.local',
    crypt('password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Access Tenant Admin"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'authenticated',
    'authenticated',
    'access-tenant-manager@tenant.local',
    crypt('password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Access Tenant Manager"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'authenticated',
    'authenticated',
    'access-viewer@tenant.local',
    crypt('password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Access Viewer"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  );

select is(
  app_private.bootstrap_first_platform_admin(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
    'pgTAP access system hardening'
  )::text,
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bootstrap do platform_admin permanece funcional'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select lives_ok(
  $$
    select public.rpc_admin_create_tenant(
      'access-system-a',
      'Access System A LTDA',
      'Access System A',
      'sa-east-1'
    )
  $$,
  'platform_admin cria tenant para teste de access'
);

select lives_ok(
  $$
    select public.rpc_admin_add_tenant_member(
      (select id from public.tenants where slug = 'access-system-a'),
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
      'tenant_admin',
      'active'
    )
  $$,
  'platform_admin adiciona tenant_admin'
);

select lives_ok(
  $$
    select public.rpc_admin_add_tenant_member(
      (select id from public.tenants where slug = 'access-system-a'),
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid,
      'tenant_manager',
      'active'
    )
  $$,
  'platform_admin adiciona tenant_manager'
);

select lives_ok(
  $$
    select public.rpc_admin_add_tenant_member(
      (select id from public.tenants where slug = 'access-system-a'),
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid,
      'tenant_viewer',
      'invited'
    )
  $$,
  'platform_admin adiciona viewer convidado'
);

select is(
  (select count(*)::integer from public.vw_admin_access_users),
  4,
  'platform_admin le usuarios operacionais pelo read model de Access'
);

select is(
  (select count(*)::integer from public.vw_admin_access_memberships),
  3,
  'platform_admin le memberships pelo read model de Access'
);

select is(
  (select count(*)::integer from public.vw_admin_system_health_checks),
  7,
  'system expoe sete checks operacionais reais'
);

select is(
  (
    select count(*)::integer
    from public.vw_admin_system_health_checks
    where status not in ('ok', 'attention', 'unavailable')
  ),
  0,
  'system checks retornam apenas estados contratuais'
);

select ok(
  exists (
    select 1
    from public.vw_admin_system_audit_events
    where service_key = 'tenant_memberships'
      and severity in ('attention', 'critical')
  ),
  'eventos de acesso recebem severidade derivada no backend'
);

select ok(
  exists (
    select 1
    from public.vw_admin_system_operational_summary
    where audit_event_count > 0
  ),
  'summary operacional deriva contadores reais do audit log'
);

select throws_like(
  $$
    update public.tenant_memberships
    set status = 'revoked'
    where user_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid
  $$,
  '%permission denied%',
  'authenticated nao faz DML direto em tenant_memberships'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select throws_ok(
  $$
    select public.rpc_admin_update_tenant_member_role(
      (
        select id
        from public.tenant_memberships
        where user_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid
      ),
      'tenant_admin'
    )
  $$,
  'P0001',
  'rpc_admin_update_tenant_member_role denied',
  'tenant_manager nao promove tenant_admin'
);

select throws_ok(
  $$
    select public.rpc_admin_update_tenant_member_role(
      (
        select id
        from public.tenant_memberships
        where user_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid
      ),
      'tenant_admin'
    )
  $$,
  'P0001',
  'rpc_admin_update_tenant_member_role denied',
  'autopromocao de membership e bloqueada no backend'
);

select is(
  (select count(*)::integer from public.vw_admin_access_users),
  0,
  'tenant_manager nao le read model global de access'
);

select is(
  (select count(*)::integer from public.vw_admin_system_audit_events),
  0,
  'tenant_manager nao le audit system global'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select is(
  (
    public.rpc_admin_update_tenant_member_status(
      (
        select id
        from public.tenant_memberships
        where user_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid
      ),
      'active'
    )
  ).status::text,
  'active',
  'platform_admin reativa membership via RPC real'
);

select ok(
  exists (
    select 1
    from public.vw_admin_system_audit_events
    where service_key = 'tenant_memberships'
      and action = 'update'
  ),
  'mutacao administrativa de access gera evento de auditoria sanitizado'
);

select ok(
  not exists (
    select 1
    from public.vw_admin_system_audit_events
    where sanitized_context::text ~* '(password|token|secret|authorization|bearer)'
  ),
  'contexto sanitizado nao expoe chaves sensiveis obvias'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select *
from finish();

rollback;
