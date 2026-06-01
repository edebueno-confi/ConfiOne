create extension if not exists pgtap with schema extensions;

begin;

select plan(42);

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'commercial_products',
        'commercial_product_plans',
        'commercial_product_modules',
        'commercial_product_features',
        'commercial_plan_features',
        'product_area_ownerships'
      )
  ),
  6,
  'OCP V1-C cria as seis tabelas base do catalogo comercial'
);

select is(
  (
    select count(*)::integer
    from pg_type as t
    join pg_namespace as n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname in (
        'commercial_product_status',
        'commercial_product_plan_status',
        'commercial_product_module_status',
        'commercial_product_feature_status',
        'commercial_plan_feature_inclusion_type',
        'product_area_ownership_role',
        'product_area_ownership_status'
      )
  ),
  7,
  'OCP V1-C cria enums controlados de status, inclusao e ownership'
);

select is(
  (
    select count(*)::integer
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'commercial_products',
        'commercial_product_plans',
        'commercial_product_modules',
        'commercial_product_features',
        'commercial_plan_features',
        'product_area_ownerships'
      )
      and c.relrowsecurity
  ),
  6,
  'tabelas base do catalogo comercial possuem RLS habilitada'
);

select ok(
  not has_table_privilege('authenticated', 'public.commercial_products', 'INSERT')
  and not has_table_privilege('authenticated', 'public.commercial_products', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.commercial_products', 'DELETE')
  and not has_table_privilege('authenticated', 'public.commercial_product_plans', 'INSERT')
  and not has_table_privilege('authenticated', 'public.commercial_product_plans', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.commercial_product_plans', 'DELETE')
  and not has_table_privilege('authenticated', 'public.commercial_product_modules', 'INSERT')
  and not has_table_privilege('authenticated', 'public.commercial_product_modules', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.commercial_product_modules', 'DELETE')
  and not has_table_privilege('authenticated', 'public.commercial_product_features', 'INSERT')
  and not has_table_privilege('authenticated', 'public.commercial_product_features', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.commercial_product_features', 'DELETE')
  and not has_table_privilege('authenticated', 'public.commercial_plan_features', 'INSERT')
  and not has_table_privilege('authenticated', 'public.commercial_plan_features', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.commercial_plan_features', 'DELETE')
  and not has_table_privilege('authenticated', 'public.product_area_ownerships', 'INSERT')
  and not has_table_privilege('authenticated', 'public.product_area_ownerships', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.product_area_ownerships', 'DELETE'),
  'authenticated nao possui DML direto nas tabelas do catalogo comercial'
);

select ok(
  not has_table_privilege('authenticated', 'public.commercial_products', 'SELECT')
  and not has_table_privilege('authenticated', 'public.commercial_product_plans', 'SELECT')
  and not has_table_privilege('authenticated', 'public.commercial_product_modules', 'SELECT')
  and not has_table_privilege('authenticated', 'public.commercial_product_features', 'SELECT')
  and not has_table_privilege('authenticated', 'public.commercial_plan_features', 'SELECT')
  and not has_table_privilege('authenticated', 'public.product_area_ownerships', 'SELECT'),
  'authenticated nao possui SELECT direto nas tabelas base do catalogo comercial'
);

select ok(
  not has_table_privilege('anon', 'public.commercial_products', 'SELECT')
  and not has_table_privilege('anon', 'public.commercial_product_plans', 'SELECT')
  and not has_table_privilege('anon', 'public.commercial_product_modules', 'SELECT')
  and not has_table_privilege('anon', 'public.commercial_product_features', 'SELECT')
  and not has_table_privilege('anon', 'public.commercial_plan_features', 'SELECT')
  and not has_table_privilege('anon', 'public.product_area_ownerships', 'SELECT'),
  'anon nao possui leitura direta do catalogo comercial'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_admin_commercial_products', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_admin_commercial_product_detail', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_admin_commercial_product_plans', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_admin_product_area_ownerships', 'SELECT'),
  'authenticated possui SELECT somente nos read models administrativos'
);

select ok(
  not has_table_privilege('anon', 'public.vw_admin_commercial_products', 'SELECT')
  and not has_table_privilege('anon', 'public.vw_admin_commercial_product_detail', 'SELECT')
  and not has_table_privilege('anon', 'public.vw_admin_commercial_product_plans', 'SELECT')
  and not has_table_privilege('anon', 'public.vw_admin_product_area_ownerships', 'SELECT'),
  'anon nao le read models administrativos do catalogo'
);

select is(
  (
    select count(*)::integer
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'vw_admin_commercial_products',
        'vw_admin_commercial_product_detail',
        'vw_admin_commercial_product_plans',
        'vw_admin_product_area_ownerships'
      )
      and exists (
        select 1
        from unnest(coalesce(c.reloptions, array[]::text[])) as opt
        where opt = 'security_barrier=true'
      )
  ),
  4,
  'read models administrativos do catalogo usam security_barrier'
);

select is(
  (
    select count(*)::integer
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'rpc_admin_create_commercial_product',
        'rpc_admin_update_commercial_product',
        'rpc_admin_create_commercial_product_plan',
        'rpc_admin_update_commercial_product_plan',
        'rpc_admin_create_commercial_product_module',
        'rpc_admin_update_commercial_product_module',
        'rpc_admin_create_commercial_product_feature',
        'rpc_admin_update_commercial_product_feature',
        'rpc_admin_set_commercial_plan_feature',
        'rpc_admin_assign_product_area_ownership',
        'rpc_admin_archive_product_area_ownership'
      )
      and p.prosecdef
      and exists (
        select 1
        from unnest(coalesce(p.proconfig, array[]::text[])) as cfg
        where cfg = 'search_path=""'
      )
  ),
  11,
  'RPCs administrativas do catalogo sao SECURITY DEFINER com search_path vazio'
);

select is(
  (
    select count(distinct p.proname)::integer
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as acl on true
    where n.nspname = 'public'
      and p.proname in (
        'rpc_admin_create_commercial_product',
        'rpc_admin_update_commercial_product',
        'rpc_admin_create_commercial_product_plan',
        'rpc_admin_update_commercial_product_plan',
        'rpc_admin_create_commercial_product_module',
        'rpc_admin_update_commercial_product_module',
        'rpc_admin_create_commercial_product_feature',
        'rpc_admin_update_commercial_product_feature',
        'rpc_admin_set_commercial_plan_feature',
        'rpc_admin_assign_product_area_ownership',
        'rpc_admin_archive_product_area_ownership'
      )
      and acl.grantee = (select oid from pg_roles where rolname = 'authenticated')
  ),
  11,
  'authenticated recebe EXECUTE explicito nas RPCs do catalogo'
);

select is(
  (
    select count(distinct p.proname)::integer
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as acl on true
    where n.nspname = 'public'
      and p.proname in (
        'rpc_admin_create_commercial_product',
        'rpc_admin_update_commercial_product',
        'rpc_admin_create_commercial_product_plan',
        'rpc_admin_update_commercial_product_plan',
        'rpc_admin_create_commercial_product_module',
        'rpc_admin_update_commercial_product_module',
        'rpc_admin_create_commercial_product_feature',
        'rpc_admin_update_commercial_product_feature',
        'rpc_admin_set_commercial_plan_feature',
        'rpc_admin_assign_product_area_ownership',
        'rpc_admin_archive_product_area_ownership'
      )
      and acl.grantee = (select oid from pg_roles where rolname = 'anon')
  ),
  0,
  'anon nao recebe EXECUTE nas RPCs do catalogo'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name in (
        'commercial_products',
        'commercial_product_plans',
        'commercial_product_modules',
        'commercial_product_features',
        'commercial_plan_features',
        'product_area_ownerships'
      )
      and (
        column_name like '%price%'
        or column_name like '%amount%'
        or column_name like '%currency%'
        or column_name like '%invoice%'
        or column_name like '%revenue%'
      )
  ),
  0,
  'catalogo comercial V1-C nao expoe colunas financeiras ou de preco'
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
  ('00000000-0000-0000-0000-000000000000', '46000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'ocp-v1-c-admin@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"OCP V1-C Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '46000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'ocp-v1-c-support@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"OCP V1-C Support"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '46000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'ocp-v1-c-outsider@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"OCP V1-C Outsider"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('46000000-0000-4000-8000-000000000001', 'platform_admin', '46000000-0000-4000-8000-000000000001', '46000000-0000-4000-8000-000000000001'),
  ('46000000-0000-4000-8000-000000000002', 'support_manager', '46000000-0000-4000-8000-000000000001', '46000000-0000-4000-8000-000000000001');

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '46000000-0000-4000-8000-000000000001';

create temporary table ocp_v1_c_created_ids (
  entity text not null,
  lookup_key text not null,
  id uuid not null,
  primary key (entity, lookup_key)
) on commit drop;

with created as (
  select *
  from public.rpc_admin_create_commercial_product(
    'genius_returns',
    'Genius Returns',
    'Produto comercial global para logistica reversa.',
    'active'::public.commercial_product_status
  )
)
insert into ocp_v1_c_created_ids (entity, lookup_key, id)
select 'product', product_key, id
from created;

select ok(
  exists (select 1 from ocp_v1_c_created_ids where entity = 'product' and lookup_key = 'genius_returns'),
  'platform_admin cria produto comercial por RPC'
);

with created as (
  select *
  from public.rpc_admin_create_commercial_product(
    'after_sale',
    'After Sale',
    'Produto futuro usado para validar isolamento cross-product.',
    'draft'::public.commercial_product_status
  )
)
insert into ocp_v1_c_created_ids (entity, lookup_key, id)
select 'product', product_key, id
from created;

select ok(
  exists (select 1 from ocp_v1_c_created_ids where entity = 'product' and lookup_key = 'after_sale'),
  'platform_admin cria segundo produto comercial por RPC'
);

with created as (
  select *
  from public.rpc_admin_create_commercial_product_plan(
    (select id from ocp_v1_c_created_ids where entity = 'product' and lookup_key = 'genius_returns'),
    'standard',
    'Standard',
    'Plano base sem informacao financeira.',
    'active'::public.commercial_product_plan_status,
    10
  )
)
insert into ocp_v1_c_created_ids (entity, lookup_key, id)
select 'plan', plan_key, id
from created;

select ok(
  exists (select 1 from ocp_v1_c_created_ids where entity = 'plan' and lookup_key = 'standard'),
  'platform_admin cria plano comercial por RPC'
);

with created as (
  select *
  from public.rpc_admin_create_commercial_product_module(
    (select id from ocp_v1_c_created_ids where entity = 'product' and lookup_key = 'genius_returns'),
    'returns_ops',
    'Operacao de reversa',
    'Modulo operacional comercializado.',
    'active'::public.commercial_product_module_status,
    10
  )
)
insert into ocp_v1_c_created_ids (entity, lookup_key, id)
select 'module', module_key, id
from created;

select ok(
  exists (select 1 from ocp_v1_c_created_ids where entity = 'module' and lookup_key = 'returns_ops'),
  'platform_admin cria modulo comercial por RPC'
);

with created as (
  select *
  from public.rpc_admin_create_commercial_product_feature(
    (select id from ocp_v1_c_created_ids where entity = 'product' and lookup_key = 'genius_returns'),
    'portal_returns',
    'Portal de reversa',
    (select id from ocp_v1_c_created_ids where entity = 'module' and lookup_key = 'returns_ops'),
    'Feature comercial canonica.',
    'active'::public.commercial_product_feature_status,
    true,
    true,
    10
  )
)
insert into ocp_v1_c_created_ids (entity, lookup_key, id)
select 'feature', feature_key, id
from created;

select ok(
  exists (select 1 from ocp_v1_c_created_ids where entity = 'feature' and lookup_key = 'portal_returns'),
  'platform_admin cria feature comercial por RPC'
);

with created as (
  select *
  from public.rpc_admin_create_commercial_product_feature(
    (select id from ocp_v1_c_created_ids where entity = 'product' and lookup_key = 'after_sale'),
    'after_sale_portal',
    'Portal After Sale',
    null,
    'Feature usada para validar cross-product.',
    'draft'::public.commercial_product_feature_status,
    false,
    true,
    10
  )
)
insert into ocp_v1_c_created_ids (entity, lookup_key, id)
select 'feature', feature_key, id
from created;

select ok(
  exists (select 1 from ocp_v1_c_created_ids where entity = 'feature' and lookup_key = 'after_sale_portal'),
  'platform_admin cria feature de outro produto para teste cross-product'
);

with created as (
  select *
  from public.rpc_admin_set_commercial_plan_feature(
    (select id from ocp_v1_c_created_ids where entity = 'plan' and lookup_key = 'standard'),
    (select id from ocp_v1_c_created_ids where entity = 'feature' and lookup_key = 'portal_returns'),
    'included'::public.commercial_plan_feature_inclusion_type,
    true,
    'monthly_orders',
    1000,
    'orders'
  )
)
insert into ocp_v1_c_created_ids (entity, lookup_key, id)
select 'plan_feature', 'standard_portal_returns', id
from created;

select ok(
  exists (select 1 from ocp_v1_c_created_ids where entity = 'plan_feature' and lookup_key = 'standard_portal_returns'),
  'platform_admin vincula feature ao plano do mesmo produto'
);

with created as (
  select *
  from public.rpc_admin_assign_product_area_ownership(
    (select id from ocp_v1_c_created_ids where entity = 'product' and lookup_key = 'genius_returns'),
    'operations',
    'business_owner'::public.product_area_ownership_role,
    null,
    null,
    'active'::public.product_area_ownership_status
  )
)
insert into ocp_v1_c_created_ids (entity, lookup_key, id)
select 'ownership', 'genius_returns_operations_business_owner', id
from created;

select ok(
  exists (select 1 from ocp_v1_c_created_ids where entity = 'ownership' and lookup_key = 'genius_returns_operations_business_owner'),
  'platform_admin atribui ownership de area existente ao produto'
);

select is(
  (
    select count(*)::integer
    from public.vw_admin_commercial_products
    where product_key in ('genius_returns', 'after_sale')
  ),
  2,
  'platform_admin le produtos comerciais por read model'
);

select is(
  (
    select feature_count
    from public.vw_admin_commercial_product_plans
    where plan_key = 'standard'
  ),
  1,
  'read model de planos agrega features comerciais'
);

select is(
  (
    select jsonb_array_length(features)
    from public.vw_admin_commercial_product_detail
    where product_key = 'genius_returns'
  ),
  1,
  'read model de detalhe agrega features sem expor tabela base'
);

select is(
  (
    select count(*)::integer
    from public.vw_admin_product_area_ownerships
    where product_key = 'genius_returns'
      and area_key = 'operations'
      and ownership_role = 'business_owner'::public.product_area_ownership_role
  ),
  1,
  'read model de ownership mostra area interna responsavel'
);

select ok(
  exists (
    select 1
    from audit.audit_logs as audit_log
    where audit_log.entity_schema = 'public'
      and audit_log.entity_table = 'commercial_products'
      and audit_log.action = 'insert'
      and audit_log.actor_user_id = '46000000-0000-4000-8000-000000000001'
  ),
  'mutacoes do catalogo geram audit trail'
);

select ok(
  (
    select status = 'deprecated'::public.commercial_product_status
    from public.rpc_admin_update_commercial_product(
      (select id from ocp_v1_c_created_ids where entity = 'product' and lookup_key = 'after_sale'),
      'After Sale',
      null,
      'deprecated'::public.commercial_product_status
    )
  ),
  'platform_admin atualiza produto comercial por RPC'
);

select ok(
  (
    select status = 'deprecated'::public.commercial_product_plan_status
    from public.rpc_admin_update_commercial_product_plan(
      (select id from ocp_v1_c_created_ids where entity = 'plan' and lookup_key = 'standard'),
      'Standard',
      null,
      'deprecated'::public.commercial_product_plan_status,
      20
    )
  ),
  'platform_admin atualiza plano comercial por RPC'
);

select ok(
  (
    select status = 'deprecated'::public.commercial_product_module_status
    from public.rpc_admin_update_commercial_product_module(
      (select id from ocp_v1_c_created_ids where entity = 'module' and lookup_key = 'returns_ops'),
      'Operacao de reversa',
      null,
      'deprecated'::public.commercial_product_module_status,
      20
    )
  ),
  'platform_admin atualiza modulo comercial por RPC'
);

select ok(
  (
    select status = 'deprecated'::public.commercial_product_feature_status
    from public.rpc_admin_update_commercial_product_feature(
      (select id from ocp_v1_c_created_ids where entity = 'feature' and lookup_key = 'portal_returns'),
      'Portal de reversa',
      null,
      null,
      'deprecated'::public.commercial_product_feature_status,
      true,
      true,
      20
    )
  ),
  'platform_admin atualiza feature comercial por RPC'
);

select ok(
  (
    select status = 'archived'::public.product_area_ownership_status
    from public.rpc_admin_archive_product_area_ownership(
      (select id from ocp_v1_c_created_ids where entity = 'ownership' and lookup_key = 'genius_returns_operations_business_owner')
    )
  ),
  'platform_admin arquiva ownership por RPC'
);

select throws_ok(
  $$
    select public.rpc_admin_set_commercial_plan_feature(
      (select id from ocp_v1_c_created_ids where entity = 'plan' and lookup_key = 'standard'),
      (select id from ocp_v1_c_created_ids where entity = 'feature' and lookup_key = 'after_sale_portal'),
      'included'::public.commercial_plan_feature_inclusion_type,
      true,
      null,
      null,
      null
    )
  $$,
  'P0001',
  'commercial plan feature must reference same product',
  'RPC rejeita vinculo plano-feature cross-product'
);

select throws_ok(
  $$
    select public.rpc_admin_create_commercial_product_feature(
      (select id from ocp_v1_c_created_ids where entity = 'product' and lookup_key = 'after_sale'),
      'wrong_module_feature',
      'Feature com modulo de outro produto',
      (select id from ocp_v1_c_created_ids where entity = 'module' and lookup_key = 'returns_ops'),
      null,
      'draft'::public.commercial_product_feature_status,
      false,
      true,
      10
    )
  $$,
  'P0001',
  'commercial feature module must reference same product',
  'RPC rejeita feature vinculada a modulo de outro produto'
);

select throws_ok(
  $$
    select public.rpc_admin_assign_product_area_ownership(
      (select id from ocp_v1_c_created_ids where entity = 'product' and lookup_key = 'genius_returns'),
      'area_inexistente',
      'support_owner'::public.product_area_ownership_role,
      null,
      null,
      'active'::public.product_area_ownership_status
    )
  $$,
  'P0001',
  'internal area not found',
  'ownership rejeita area_key inexistente'
);

select throws_ok(
  $$
    insert into public.commercial_products (
      product_key,
      display_name,
      status
    )
    values (
      'direct_insert',
      'Direct Insert',
      'draft'
    )
  $$,
  '42501',
  'permission denied for table commercial_products',
  'authenticated nao consegue DML direto em commercial_products'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '46000000-0000-4000-8000-000000000002';

select is(
  (select count(*)::integer from public.vw_admin_commercial_products),
  0,
  'usuario sem platform_admin nao le read model administrativo de produtos'
);

select is(
  (select count(*)::integer from public.vw_admin_commercial_product_plans),
  0,
  'usuario sem platform_admin nao le read model administrativo de planos'
);

select is(
  (select count(*)::integer from public.vw_admin_product_area_ownerships),
  0,
  'usuario sem platform_admin nao le ownership administrativo'
);

select throws_ok(
  $$
    select public.rpc_admin_create_commercial_product(
      'forbidden',
      'Forbidden',
      null,
      'draft'::public.commercial_product_status
    )
  $$,
  'P0001',
  'commercial catalog admin access denied',
  'RPC de criacao bloqueia usuario sem platform_admin'
);

select throws_ok(
  $$
    select public.rpc_admin_update_commercial_product(
      (select id from ocp_v1_c_created_ids where entity = 'product' and lookup_key = 'genius_returns'),
      'Forbidden update',
      null,
      null
    )
  $$,
  'P0001',
  'commercial catalog admin access denied',
  'RPC de update bloqueia usuario sem platform_admin'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '46000000-0000-4000-8000-000000000003';

select is(
  (select count(*)::integer from public.vw_admin_commercial_product_detail),
  0,
  'usuario autenticado sem permissao recebe zero linhas no detalhe admin'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role anon;

select throws_ok(
  $$ select count(*) from public.vw_admin_commercial_products $$,
  '42501',
  'permission denied for view vw_admin_commercial_products',
  'anon nao acessa read model administrativo de produtos'
);

reset role;

select *
from finish();

rollback;
