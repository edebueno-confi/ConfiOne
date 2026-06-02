create extension if not exists pgtap with schema extensions;

begin;

select plan(32);

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'customer_product_subscriptions',
        'customer_product_feature_entitlements',
        'customer_product_internal_owners'
      )
  ),
  3,
  'OCP V1-E cria as tres tabelas base de subscriptions'
);

select is(
  (
    select count(*)::integer
    from pg_type as t
    join pg_namespace as n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname in (
        'customer_product_subscription_status',
        'customer_product_feature_entitlement_status',
        'customer_product_feature_entitlement_source',
        'customer_product_internal_owner_role',
        'customer_product_internal_owner_status'
      )
  ),
  5,
  'OCP V1-E cria enums controlados de status, origem e ownership'
);

select is(
  (
    select count(*)::integer
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'customer_product_subscriptions',
        'customer_product_feature_entitlements',
        'customer_product_internal_owners'
      )
      and c.relrowsecurity
  ),
  3,
  'tabelas base de subscriptions possuem RLS habilitada'
);

select ok(
  not has_table_privilege('authenticated', 'public.customer_product_subscriptions', 'SELECT')
  and not has_table_privilege('authenticated', 'public.customer_product_feature_entitlements', 'SELECT')
  and not has_table_privilege('authenticated', 'public.customer_product_internal_owners', 'SELECT')
  and not has_table_privilege('authenticated', 'public.customer_product_subscriptions', 'INSERT')
  and not has_table_privilege('authenticated', 'public.customer_product_feature_entitlements', 'INSERT')
  and not has_table_privilege('authenticated', 'public.customer_product_internal_owners', 'INSERT'),
  'authenticated nao possui leitura ou DML direto nas tabelas base'
);

select ok(
  not has_table_privilege('anon', 'public.customer_product_subscriptions', 'SELECT')
  and not has_table_privilege('anon', 'public.customer_product_feature_entitlements', 'SELECT')
  and not has_table_privilege('anon', 'public.customer_product_internal_owners', 'SELECT'),
  'anon nao possui leitura direta das tabelas base'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_admin_customer_product_subscriptions', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_admin_customer_product_subscription_detail', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_admin_customer_product_feature_entitlements', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_admin_customer_product_internal_owners', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_support_customer_product_context', 'SELECT'),
  'authenticated recebe SELECT apenas nos read models de subscriptions'
);

select ok(
  not has_table_privilege('anon', 'public.vw_admin_customer_product_subscriptions', 'SELECT')
  and not has_table_privilege('anon', 'public.vw_admin_customer_product_subscription_detail', 'SELECT')
  and not has_table_privilege('anon', 'public.vw_admin_customer_product_feature_entitlements', 'SELECT')
  and not has_table_privilege('anon', 'public.vw_admin_customer_product_internal_owners', 'SELECT')
  and not has_table_privilege('anon', 'public.vw_support_customer_product_context', 'SELECT'),
  'anon nao le read models de subscriptions'
);

select is(
  (
    select count(*)::integer
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'vw_admin_customer_product_subscriptions',
        'vw_admin_customer_product_subscription_detail',
        'vw_admin_customer_product_feature_entitlements',
        'vw_admin_customer_product_internal_owners',
        'vw_support_customer_product_context'
      )
      and exists (
        select 1
        from unnest(coalesce(c.reloptions, array[]::text[])) as opt
        where opt = 'security_barrier=true'
      )
  ),
  5,
  'read models de subscriptions usam security_barrier'
);

select is(
  (
    select count(distinct p.proname)::integer
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'rpc_admin_create_customer_product_subscription',
        'rpc_admin_update_customer_product_subscription',
        'rpc_admin_archive_customer_product_subscription',
        'rpc_admin_set_customer_product_feature_entitlement',
        'rpc_admin_archive_customer_product_feature_entitlement',
        'rpc_admin_assign_customer_product_internal_owner',
        'rpc_admin_archive_customer_product_internal_owner'
      )
      and p.prosecdef
      and exists (
        select 1
        from unnest(coalesce(p.proconfig, array[]::text[])) as cfg
        where cfg = 'search_path=""'
      )
  ),
  7,
  'RPCs administrativas de subscriptions sao SECURITY DEFINER com search_path vazio'
);

select is(
  (
    select count(distinct p.proname)::integer
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as acl on true
    where n.nspname = 'public'
      and p.proname in (
        'rpc_admin_create_customer_product_subscription',
        'rpc_admin_update_customer_product_subscription',
        'rpc_admin_archive_customer_product_subscription',
        'rpc_admin_set_customer_product_feature_entitlement',
        'rpc_admin_archive_customer_product_feature_entitlement',
        'rpc_admin_assign_customer_product_internal_owner',
        'rpc_admin_archive_customer_product_internal_owner'
      )
      and acl.grantee = (select oid from pg_roles where rolname = 'authenticated')
  ),
  7,
  'authenticated recebe EXECUTE explicito nas RPCs administrativas de subscriptions'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name in (
        'customer_product_subscriptions',
        'customer_product_feature_entitlements',
        'customer_product_internal_owners'
      )
      and (
        column_name like '%price%'
        or column_name like '%amount%'
        or column_name like '%currency%'
        or column_name like '%invoice%'
        or column_name like '%revenue%'
        or column_name like '%payment%'
      )
  ),
  0,
  'subscriptions V1-E nao expoe colunas financeiras ou de billing'
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
  ('00000000-0000-0000-0000-000000000000', '47000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'ocp-v1-e-admin@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"OCP V1-E Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '47000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'ocp-v1-e-support@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"OCP V1-E Support"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '47000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'ocp-v1-e-outsider@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"OCP V1-E Outsider"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('47000000-0000-4000-8000-000000000001', 'platform_admin', '47000000-0000-4000-8000-000000000001', '47000000-0000-4000-8000-000000000001'),
  ('47000000-0000-4000-8000-000000000002', 'support_manager', '47000000-0000-4000-8000-000000000001', '47000000-0000-4000-8000-000000000001');

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
  ('47000000-0000-4000-8000-000000000101', 'ocp-v1-e-alpha', 'OCP V1-E Alpha Ltda', 'OCP V1-E Alpha', 'active', '47000000-0000-4000-8000-000000000001', '47000000-0000-4000-8000-000000000001'),
  ('47000000-0000-4000-8000-000000000102', 'ocp-v1-e-beta', 'OCP V1-E Beta Ltda', 'OCP V1-E Beta', 'active', '47000000-0000-4000-8000-000000000001', '47000000-0000-4000-8000-000000000001');

insert into public.tenant_memberships (
  tenant_id,
  user_id,
  role,
  status,
  invited_by_user_id,
  created_by_user_id,
  updated_by_user_id
)
values (
  '47000000-0000-4000-8000-000000000101',
  '47000000-0000-4000-8000-000000000002',
  'tenant_viewer',
  'active',
  '47000000-0000-4000-8000-000000000001',
  '47000000-0000-4000-8000-000000000001',
  '47000000-0000-4000-8000-000000000001'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '47000000-0000-4000-8000-000000000001';

create temporary table ocp_v1_e_created_ids (
  entity text not null,
  lookup_key text not null,
  id uuid not null,
  primary key (entity, lookup_key)
) on commit drop;

with created as (
  select *
  from public.rpc_admin_create_commercial_product(
    'genius_returns_v1e',
    'Genius Returns V1-E',
    'Produto para teste de subscriptions.',
    'active'::public.commercial_product_status
  )
)
insert into ocp_v1_e_created_ids (entity, lookup_key, id)
select 'product', product_key, id
from created;

with created as (
  select *
  from public.rpc_admin_create_commercial_product(
    'after_sale_v1e',
    'After Sale V1-E',
    'Produto distinto para validar isolamento.',
    'active'::public.commercial_product_status
  )
)
insert into ocp_v1_e_created_ids (entity, lookup_key, id)
select 'product', product_key, id
from created;

with created as (
  select *
  from public.rpc_admin_create_commercial_product_plan(
    (select id from ocp_v1_e_created_ids where entity = 'product' and lookup_key = 'genius_returns_v1e'),
    'standard',
    'Standard',
    'Plano operacional sem preco.',
    'active'::public.commercial_product_plan_status,
    10
  )
)
insert into ocp_v1_e_created_ids (entity, lookup_key, id)
select 'plan', 'genius_standard', id
from created;

with created as (
  select *
  from public.rpc_admin_create_commercial_product_plan(
    (select id from ocp_v1_e_created_ids where entity = 'product' and lookup_key = 'after_sale_v1e'),
    'standard',
    'Standard',
    'Plano de outro produto.',
    'active'::public.commercial_product_plan_status,
    10
  )
)
insert into ocp_v1_e_created_ids (entity, lookup_key, id)
select 'plan', 'after_sale_standard', id
from created;

with created as (
  select *
  from public.rpc_admin_create_commercial_product_feature(
    (select id from ocp_v1_e_created_ids where entity = 'product' and lookup_key = 'genius_returns_v1e'),
    'returns_portal',
    'Portal de reversa',
    null,
    'Feature visivel ao suporte.',
    'active'::public.commercial_product_feature_status,
    true,
    true,
    10
  )
)
insert into ocp_v1_e_created_ids (entity, lookup_key, id)
select 'feature', feature_key, id
from created;

with created as (
  select *
  from public.rpc_admin_create_commercial_product_feature(
    (select id from ocp_v1_e_created_ids where entity = 'product' and lookup_key = 'after_sale_v1e'),
    'after_sale_portal',
    'Portal After Sale',
    null,
    'Feature de outro produto.',
    'active'::public.commercial_product_feature_status,
    true,
    true,
    10
  )
)
insert into ocp_v1_e_created_ids (entity, lookup_key, id)
select 'feature', feature_key, id
from created;

with created as (
  select *
  from public.rpc_admin_create_customer_product_subscription(
    '47000000-0000-4000-8000-000000000101',
    (select id from ocp_v1_e_created_ids where entity = 'product' and lookup_key = 'genius_returns_v1e'),
    (select id from ocp_v1_e_created_ids where entity = 'plan' and lookup_key = 'genius_standard'),
    'active'::public.customer_product_subscription_status,
    timezone('utc', now()),
    timezone('utc', now()) + interval '1 year',
    'CONTRACT-LOCAL-001',
    'manual_admin',
    'Assinatura operacional de teste.',
    '{"tier":"standard"}'::jsonb
  )
)
insert into ocp_v1_e_created_ids (entity, lookup_key, id)
select 'subscription', 'alpha_genius_returns', id
from created;

select ok(
  exists (select 1 from ocp_v1_e_created_ids where entity = 'subscription' and lookup_key = 'alpha_genius_returns'),
  'platform_admin cria assinatura tenant-produto-plano por RPC'
);

with created as (
  select *
  from public.rpc_admin_set_customer_product_feature_entitlement(
    (select id from ocp_v1_e_created_ids where entity = 'subscription' and lookup_key = 'alpha_genius_returns'),
    (select id from ocp_v1_e_created_ids where entity = 'feature' and lookup_key = 'returns_portal'),
    'plan'::public.customer_product_feature_entitlement_source,
    'active'::public.customer_product_feature_entitlement_status,
    'Feature incluida no plano.',
    timezone('utc', now()),
    null,
    '{"limit":"base"}'::jsonb
  )
)
insert into ocp_v1_e_created_ids (entity, lookup_key, id)
select 'entitlement', 'returns_portal_plan', id
from created;

select ok(
  exists (select 1 from ocp_v1_e_created_ids where entity = 'entitlement' and lookup_key = 'returns_portal_plan'),
  'platform_admin cria entitlement comercial por RPC'
);

with created as (
  select *
  from public.rpc_admin_assign_customer_product_internal_owner(
    (select id from ocp_v1_e_created_ids where entity = 'subscription' and lookup_key = 'alpha_genius_returns'),
    'support_owner'::public.customer_product_internal_owner_role,
    null,
    'operations',
    'active'::public.customer_product_internal_owner_status,
    'Area responsavel pelo suporte operacional.'
  )
)
insert into ocp_v1_e_created_ids (entity, lookup_key, id)
select 'owner', 'operations_support_owner', id
from created;

select ok(
  exists (select 1 from ocp_v1_e_created_ids where entity = 'owner' and lookup_key = 'operations_support_owner'),
  'platform_admin atribui ownership interno da assinatura por RPC'
);

select is(
  (
    select count(*)::integer
    from public.vw_admin_customer_product_subscriptions
    where tenant_slug = 'ocp-v1-e-alpha'
      and product_key = 'genius_returns_v1e'
  ),
  1,
  'admin le assinatura por read model administrativo'
);

select is(
  (
    select active_entitlement_count
    from public.vw_admin_customer_product_subscriptions
    where tenant_slug = 'ocp-v1-e-alpha'
      and product_key = 'genius_returns_v1e'
  ),
  1,
  'read model administrativo agrega entitlements ativos'
);

select is(
  (
    select jsonb_array_length(entitlements)
    from public.vw_admin_customer_product_subscription_detail
    where tenant_slug = 'ocp-v1-e-alpha'
      and product_key = 'genius_returns_v1e'
  ),
  1,
  'detalhe administrativo agrega entitlements sem SELECT direto na tabela base'
);

select is(
  (
    select jsonb_array_length(owners)
    from public.vw_admin_customer_product_subscription_detail
    where tenant_slug = 'ocp-v1-e-alpha'
      and product_key = 'genius_returns_v1e'
  ),
  1,
  'detalhe administrativo agrega owners internos'
);

select ok(
  exists (
    select 1
    from audit.audit_logs as audit_log
    where audit_log.entity_schema = 'public'
      and audit_log.entity_table = 'customer_product_subscriptions'
      and audit_log.action = 'insert'
      and audit_log.actor_user_id = '47000000-0000-4000-8000-000000000001'
  ),
  'mutacoes de subscriptions geram audit trail'
);

select ok(
  (
    select status = 'suspended'::public.customer_product_subscription_status
    from public.rpc_admin_update_customer_product_subscription(
      (select id from ocp_v1_e_created_ids where entity = 'subscription' and lookup_key = 'alpha_genius_returns'),
      null,
      'suspended'::public.customer_product_subscription_status,
      null,
      null,
      null,
      null,
      'Suspensao operacional de teste.',
      '{"tier":"standard","state":"suspended"}'::jsonb
    )
  ),
  'platform_admin atualiza assinatura por RPC'
);

select ok(
  (
    select status = 'inactive'::public.customer_product_feature_entitlement_status
    from public.rpc_admin_set_customer_product_feature_entitlement(
      (select id from ocp_v1_e_created_ids where entity = 'subscription' and lookup_key = 'alpha_genius_returns'),
      (select id from ocp_v1_e_created_ids where entity = 'feature' and lookup_key = 'returns_portal'),
      'plan'::public.customer_product_feature_entitlement_source,
      'inactive'::public.customer_product_feature_entitlement_status,
      'Feature temporariamente inativa.',
      null,
      null,
      '{}'::jsonb
    )
  ),
  'platform_admin atualiza entitlement existente por chave natural'
);

select ok(
  (
    select status = 'archived'::public.customer_product_internal_owner_status
    from public.rpc_admin_archive_customer_product_internal_owner(
      (select id from ocp_v1_e_created_ids where entity = 'owner' and lookup_key = 'operations_support_owner')
    )
  ),
  'platform_admin arquiva owner interno por RPC'
);

select throws_ok(
  $$
    select public.rpc_admin_create_customer_product_subscription(
      '47000000-0000-4000-8000-000000000102',
      (select id from ocp_v1_e_created_ids where entity = 'product' and lookup_key = 'genius_returns_v1e'),
      (select id from ocp_v1_e_created_ids where entity = 'plan' and lookup_key = 'after_sale_standard'),
      'active'::public.customer_product_subscription_status,
      null,
      null,
      null,
      'manual_admin',
      null,
      '{}'::jsonb
    )
  $$,
  'P0001',
  'subscription plan must reference same product',
  'RPC rejeita assinatura com plano de outro produto'
);

select throws_ok(
  $$
    select public.rpc_admin_set_customer_product_feature_entitlement(
      (select id from ocp_v1_e_created_ids where entity = 'subscription' and lookup_key = 'alpha_genius_returns'),
      (select id from ocp_v1_e_created_ids where entity = 'feature' and lookup_key = 'after_sale_portal'),
      'plan'::public.customer_product_feature_entitlement_source,
      'active'::public.customer_product_feature_entitlement_status,
      null,
      null,
      null,
      '{}'::jsonb
    )
  $$,
  'P0001',
  'subscription feature entitlement must reference same product',
  'RPC rejeita entitlement de feature cross-product'
);

select throws_ok(
  $$
    select public.rpc_admin_create_customer_product_subscription(
      '47000000-0000-4000-8000-000000000102',
      (select id from ocp_v1_e_created_ids where entity = 'product' and lookup_key = 'genius_returns_v1e'),
      (select id from ocp_v1_e_created_ids where entity = 'plan' and lookup_key = 'genius_standard'),
      'active'::public.customer_product_subscription_status,
      null,
      null,
      null,
      'manual_admin',
      'sk_live_secret_should_fail',
      '{}'::jsonb
    )
  $$,
  'P0001',
  'notes_internal cannot contain secrets or credentials',
  'RPC rejeita texto com padrao de segredo'
);

set local request.jwt.claim.sub = '47000000-0000-4000-8000-000000000002';

select is(
  (
    select count(*)::integer
    from public.vw_support_customer_product_context
    where tenant_slug = 'ocp-v1-e-alpha'
      and product_key = 'genius_returns_v1e'
  ),
  1,
  'support_manager com membership ativo le contexto support-safe do tenant'
);

select is(
  (
    select count(*)::integer
    from public.vw_support_customer_product_context
    where tenant_slug = 'ocp-v1-e-beta'
  ),
  0,
  'support_manager nao recebe contexto cross-tenant sem membership'
);

select throws_ok(
  $$
    select public.rpc_admin_archive_customer_product_subscription(
      (select id from ocp_v1_e_created_ids where entity = 'subscription' and lookup_key = 'alpha_genius_returns')
    )
  $$,
  'P0001',
  'commercial catalog admin access denied',
  'support_manager nao executa RPC administrativa de subscription'
);

set local request.jwt.claim.sub = '47000000-0000-4000-8000-000000000003';

select is(
  (
    select count(*)::integer
    from public.vw_support_customer_product_context
  ),
  0,
  'usuario sem role support/admin nao le contexto support-safe'
);

select throws_ok(
  $$
    select count(*) from public.customer_product_subscriptions
  $$,
  '42501',
  'permission denied for table customer_product_subscriptions',
  'SELECT direto em subscriptions permanece bloqueado'
);

set local request.jwt.claim.sub = '47000000-0000-4000-8000-000000000001';

select ok(
  (
    select status = 'cancelled'::public.customer_product_subscription_status
      and archived_at is not null
    from public.rpc_admin_archive_customer_product_subscription(
      (select id from ocp_v1_e_created_ids where entity = 'subscription' and lookup_key = 'alpha_genius_returns')
    )
  ),
  'platform_admin arquiva assinatura por RPC'
);

select throws_ok(
  $$
    select public.rpc_admin_create_customer_product_subscription(
      '47000000-0000-4000-8000-000000000101',
      (select id from ocp_v1_e_created_ids where entity = 'product' and lookup_key = 'genius_returns_v1e'),
      (select id from ocp_v1_e_created_ids where entity = 'plan' and lookup_key = 'genius_standard'),
      'active'::public.customer_product_subscription_status,
      null,
      null,
      null,
      'manual_admin',
      null,
      '{"token":"sk_live_secret_should_fail"}'::jsonb
    )
  $$,
  'P0001',
  'metadata cannot contain secrets or credentials',
  'RPC rejeita metadata com padrao de segredo'
);

select * from finish();

rollback;
