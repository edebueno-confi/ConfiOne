create extension if not exists pgtap with schema extensions;

begin;

select plan(12);

select ok(
  has_table_privilege('authenticated', 'public.vw_cs_customer_portfolio', 'SELECT'),
  'authenticated possui SELECT no read model CS Portfolio'
);

select ok(
  not has_table_privilege('anon', 'public.vw_cs_customer_portfolio', 'SELECT'),
  'anon nao possui SELECT no read model CS Portfolio'
);

select ok(
  has_function_privilege('authenticated', 'app_private.can_access_cs_customer_portfolio(uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'app_private.can_access_cs_customer_portfolio(uuid)', 'EXECUTE'),
  'gate CS Portfolio segue padrao app_private can_access exposto a authenticated e bloqueado para anon'
);

select is(
  (
    select count(*)::integer
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'vw_cs_customer_portfolio'
      and exists (
        select 1
        from unnest(coalesce(c.reloptions, array[]::text[])) as opt
        where opt = 'security_barrier=true'
      )
  ),
  1,
  'vw_cs_customer_portfolio usa security_barrier'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vw_cs_customer_portfolio'
      and column_name in (
        'notes_internal',
        'contract_reference',
        'metadata',
        'price',
        'invoice',
        'payment',
        'revenue',
        'storage_object_path',
        'before_state',
        'after_state'
      )
  ),
  0,
  'CS Portfolio nao expoe billing, financeiro, payload bruto ou metadados sensiveis'
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
  ('00000000-0000-0000-0000-000000000000', '48000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'cs-admin@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"CS Platform Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '48000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'cs-member@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"CS Portfolio Member"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '48000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'finance-member@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Finance Member"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '48000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'cs-outsider@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"CS Outsider"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values (
  '48000000-0000-4000-8000-000000000001',
  'platform_admin',
  '48000000-0000-4000-8000-000000000001',
  '48000000-0000-4000-8000-000000000001'
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
  ('48000000-0000-4000-8000-000000000010', 'cs-portfolio-alpha', 'CS Portfolio Alpha LTDA', 'CS Portfolio Alpha', 'active', '48000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000001'),
  ('48000000-0000-4000-8000-000000000020', 'cs-portfolio-beta', 'CS Portfolio Beta LTDA', 'CS Portfolio Beta', 'active', '48000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000001');

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
  ('48000000-0000-4000-8000-000000000010', '48000000-0000-4000-8000-000000000002', 'tenant_viewer', 'active', '48000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000001'),
  ('48000000-0000-4000-8000-000000000020', '48000000-0000-4000-8000-000000000002', 'tenant_viewer', 'active', '48000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000001'),
  ('48000000-0000-4000-8000-000000000010', '48000000-0000-4000-8000-000000000003', 'tenant_viewer', 'active', '48000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000001');

insert into public.internal_area_memberships (
  tenant_id,
  user_id,
  area_key,
  role,
  status,
  created_by_user_id,
  updated_by_user_id
)
values
  ('48000000-0000-4000-8000-000000000010', '48000000-0000-4000-8000-000000000002', 'customer_success', 'member', 'active', '48000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000001'),
  ('48000000-0000-4000-8000-000000000010', '48000000-0000-4000-8000-000000000003', 'finance', 'member', 'active', '48000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000001');

insert into public.commercial_products (
  id,
  product_key,
  display_name,
  description,
  status,
  created_by_user_id,
  updated_by_user_id
)
values (
  '48000000-0000-4000-8000-000000000100',
  'genius_returns_cs',
  'Genius Returns CS',
  'Produto para teste CS Portfolio.',
  'active',
  '48000000-0000-4000-8000-000000000001',
  '48000000-0000-4000-8000-000000000001'
);

insert into public.commercial_product_plans (
  id,
  product_id,
  plan_key,
  display_name,
  status,
  created_by_user_id,
  updated_by_user_id
)
values (
  '48000000-0000-4000-8000-000000000110',
  '48000000-0000-4000-8000-000000000100',
  'enterprise',
  'Enterprise',
  'active',
  '48000000-0000-4000-8000-000000000001',
  '48000000-0000-4000-8000-000000000001'
);

insert into public.customer_product_subscriptions (
  id,
  tenant_id,
  product_id,
  plan_id,
  status,
  started_at,
  renewal_at,
  contract_reference,
  source,
  notes_internal,
  created_by_user_id,
  updated_by_user_id
)
values (
  '48000000-0000-4000-8000-000000000120',
  '48000000-0000-4000-8000-000000000010',
  '48000000-0000-4000-8000-000000000100',
  '48000000-0000-4000-8000-000000000110',
  'active',
  timezone('utc', now()),
  timezone('utc', now()) + interval '1 year',
  'CS-SHOULD-NOT-APPEAR',
  'manual_admin',
  'Internal note should not appear in CS view.',
  '48000000-0000-4000-8000-000000000001',
  '48000000-0000-4000-8000-000000000001'
);

insert into public.customer_product_internal_owners (
  id,
  subscription_id,
  owner_user_id,
  area_key,
  owner_role,
  status,
  notes_internal,
  created_by_user_id,
  updated_by_user_id
)
values (
  '48000000-0000-4000-8000-000000000130',
  '48000000-0000-4000-8000-000000000120',
  '48000000-0000-4000-8000-000000000002',
  null,
  'cs_owner',
  'active',
  'Owner note should not appear.',
  '48000000-0000-4000-8000-000000000001',
  '48000000-0000-4000-8000-000000000001'
);

insert into public.tickets (
  id,
  tenant_id,
  title,
  description,
  source,
  status,
  priority,
  severity,
  closed_at,
  close_reason,
  created_by_user_id,
  updated_by_user_id
)
values
  ('48000000-0000-4000-8000-000000000200', '48000000-0000-4000-8000-000000000010', 'CS open ticket', 'Open ticket for CS aggregate.', 'internal', 'in_progress', 'normal', 'medium', null, null, '48000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000001'),
  ('48000000-0000-4000-8000-000000000201', '48000000-0000-4000-8000-000000000010', 'CS closed ticket', 'Closed ticket for CS aggregate.', 'internal', 'closed', 'normal', 'medium', timezone('utc', now()), 'Closed in pgTAP fixture.', '48000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000001');

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '48000000-0000-4000-8000-000000000002';

select is(
  (select count(*)::integer from public.vw_cs_customer_portfolio),
  1,
  'membro customer_success le apenas tenant da propria carteira CS'
);

select ok(
  exists (
    select 1
    from public.vw_cs_customer_portfolio
    where tenant_slug = 'cs-portfolio-alpha'
      and active_subscription_count = 1
      and active_product_count = 1
      and open_ticket_count = 1
      and total_ticket_count = 2
      and cs_owner_email = 'cs-member@genius.local'
      and health_summary_status = 'unavailable'
      and product_contexts @> '[{"productKey":"genius_returns_cs","planKey":"enterprise","status":"active"}]'::jsonb
  ),
  'CS Portfolio retorna produto, plano, owner, tickets e health indisponivel por contrato'
);

select is(
  (
    select count(*)::integer
    from public.vw_cs_customer_portfolio
    where tenant_slug = 'cs-portfolio-beta'
  ),
  0,
  'membro CS nao le tenant sem membership customer_success ativa'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '48000000-0000-4000-8000-000000000003';

select is(
  (select count(*)::integer from public.vw_cs_customer_portfolio),
  0,
  'membro de outra area nao recebe Portfolio CS'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '48000000-0000-4000-8000-000000000004';

select is(
  (select count(*)::integer from public.vw_cs_customer_portfolio),
  0,
  'usuario sem membership de area nao recebe Portfolio CS'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '48000000-0000-4000-8000-000000000001';

select is(
  (
    select count(*)::integer
    from public.vw_cs_customer_portfolio
    where tenant_slug in ('cs-portfolio-alpha', 'cs-portfolio-beta')
  ),
  2,
  'platform_admin le todos os tenants criados pelo contrato CS'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role anon;

select throws_ok(
  $$ select count(*) from public.vw_cs_customer_portfolio $$,
  '42501',
  'permission denied for view vw_cs_customer_portfolio',
  'anon nao acessa CS Portfolio'
);

reset role;

select *
from finish();

rollback;
