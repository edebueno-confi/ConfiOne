create extension if not exists pgtap with schema extensions;

begin;

select plan(12);

select ok(
  has_table_privilege('authenticated', 'public.cs_customer_portfolio_assignments', 'SELECT')
  and not has_table_privilege('anon', 'public.cs_customer_portfolio_assignments', 'SELECT'),
  'Carteira CS possui leitura autenticada e bloqueia anon'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_cs_customer_portfolio', 'SELECT')
  and not has_table_privilege('anon', 'public.vw_cs_customer_portfolio', 'SELECT'),
  'Read model da Carteira CS segue ACL autenticada'
);

select ok(
  has_function_privilege('authenticated', 'public.rpc_admin_upsert_cs_customer_portfolio(uuid,text,text,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.rpc_admin_upsert_cs_customer_portfolio(uuid,text,text,uuid,text,text,text,text,text,text,text,text)', 'EXECUTE'),
  'RPC de carteira e autenticada e nao e anon'
);

select ok(
  has_function_privilege('authenticated', 'app_private.can_manage_cs_customer_portfolio(uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'app_private.can_manage_cs_customer_portfolio(uuid)', 'EXECUTE'),
  'Gate de escrita da carteira fica restrito ao contexto autenticado'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cs_customer_portfolio_assignments'
      and column_name in ('owner_user_id', 'cluster_key', 'service_model', 'contact_frequency', 'health_status', 'priority', 'source', 'source_record_id')
  ),
  8,
  'Carteira possui campos estruturados de operacao, ownership e proveniencia'
);

select is(
  (
    select count(*)::integer
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname = 'vw_cs_customer_portfolio_base'
  ),
  1,
  'Read model anterior foi preservado como base interna'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '49000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'cs-real-admin@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"CS Real Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '49000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'cs-real-manager@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"CS Real Manager"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '49000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'cs-real-owner@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"CS Real Owner"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '49000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'cs-real-outsider@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"CS Real Outsider"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (user_id, role, created_by_user_id, updated_by_user_id)
values ('49000000-0000-4000-8000-000000000001', 'platform_admin', '49000000-0000-4000-8000-000000000001', '49000000-0000-4000-8000-000000000001');

insert into public.tenants (id, slug, legal_name, display_name, status, created_by_user_id, updated_by_user_id)
values ('49000000-0000-4000-8000-000000000010', 'cs-real-portfolio', 'CS Real Portfolio LTDA', 'CS Real Portfolio', 'active', '49000000-0000-4000-8000-000000000001', '49000000-0000-4000-8000-000000000001');

insert into public.tenant_memberships (tenant_id, user_id, role, status, invited_by_user_id, created_by_user_id, updated_by_user_id)
values
  ('49000000-0000-4000-8000-000000000010', '49000000-0000-4000-8000-000000000002', 'tenant_viewer', 'active', '49000000-0000-4000-8000-000000000001', '49000000-0000-4000-8000-000000000001', '49000000-0000-4000-8000-000000000001'),
  ('49000000-0000-4000-8000-000000000010', '49000000-0000-4000-8000-000000000003', 'tenant_viewer', 'active', '49000000-0000-4000-8000-000000000001', '49000000-0000-4000-8000-000000000001', '49000000-0000-4000-8000-000000000001');

insert into public.internal_area_memberships (tenant_id, user_id, area_key, role, status, created_by_user_id, updated_by_user_id)
values
  ('49000000-0000-4000-8000-000000000010', '49000000-0000-4000-8000-000000000002', 'customer_success', 'manager', 'active', '49000000-0000-4000-8000-000000000001', '49000000-0000-4000-8000-000000000001'),
  ('49000000-0000-4000-8000-000000000010', '49000000-0000-4000-8000-000000000003', 'customer_success', 'member', 'active', '49000000-0000-4000-8000-000000000001', '49000000-0000-4000-8000-000000000001');

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '49000000-0000-4000-8000-000000000002';

select lives_ok(
  $$ select public.rpc_admin_upsert_cs_customer_portfolio(
    '49000000-0000-4000-8000-000000000010',
    'Carteira Estratégica', 'active', '49000000-0000-4000-8000-000000000003',
    'enterprise', 'high_touch', 'monthly', 'healthy', 'high',
    'Registro operacional editável.', 'cs_ops_fixture', 'cliente-001'
  ) $$,
  'gestor CS pode criar ou atualizar sua carteira'
);

select ok(
  exists (
    select 1
    from public.vw_cs_customer_portfolio
    where tenant_slug = 'cs-real-portfolio'
      and portfolio_name = 'Carteira Estratégica'
      and portfolio_assignment_status = 'active'
      and portfolio_owner_full_name = 'CS Real Owner'
      and portfolio_cluster_key = 'enterprise'
      and portfolio_priority = 'high'
  ),
  'read model expõe campos estruturados e owner validado'
);

reset role;

set local role service_role;

select is(
  (select count(*)::integer from public.cs_customer_portfolio_assignment_history where tenant_id = '49000000-0000-4000-8000-000000000010'),
  1,
  'primeira atribuição gera histórico'
);

reset role;
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '49000000-0000-4000-8000-000000000002';

select throws_ok(
  $$ select public.rpc_admin_upsert_cs_customer_portfolio('49000000-0000-4000-8000-000000000010', 'Carteira', 'active', '49000000-0000-4000-8000-000000000004') $$,
  'P0001',
  'CS owner must be an active profile with Customer Success membership for this tenant',
  'owner sem membership CS nao pode ser atribuido'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '49000000-0000-4000-8000-000000000004';

select throws_ok(
  $$ select public.rpc_admin_upsert_cs_customer_portfolio('49000000-0000-4000-8000-000000000010') $$,
  'P0001',
  'not authorized to manage CS portfolio',
  'usuario fora do contexto CS nao pode editar a carteira'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role anon;

select throws_ok(
  $$ select count(*) from public.vw_cs_customer_portfolio $$,
  '42501',
  'permission denied for view vw_cs_customer_portfolio',
  'anon nao acessa a carteira'
);

reset role;

select * from finish();

rollback;
