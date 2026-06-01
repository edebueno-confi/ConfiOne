create extension if not exists pgtap with schema extensions;

begin;

select plan(19);

select ok(
  has_table_privilege('authenticated', 'public.vw_admin_internal_areas', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_admin_internal_collaborators', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_internal_area_landing_context', 'SELECT'),
  'authenticated possui SELECT nos read models canonicos OCP V1-A'
);

select ok(
  not has_table_privilege('anon', 'public.vw_admin_internal_areas', 'SELECT')
  and not has_table_privilege('anon', 'public.vw_admin_internal_collaborators', 'SELECT')
  and not has_table_privilege('anon', 'public.vw_internal_area_landing_context', 'SELECT'),
  'anon nao possui SELECT nos read models OCP V1-A'
);

select is(
  (
    select count(*)::integer
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'vw_admin_internal_areas',
        'vw_admin_internal_collaborators',
        'vw_internal_area_landing_context'
      )
      and exists (
        select 1
        from unnest(coalesce(c.reloptions, array[]::text[])) as opt
        where opt = 'security_barrier=true'
      )
  ),
  3,
  'read models OCP V1-A usam security_barrier'
);

select ok(
  not has_table_privilege('authenticated', 'public.internal_action_target_areas', 'INSERT')
  and not has_table_privilege('authenticated', 'public.internal_action_target_areas', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.internal_action_target_areas', 'DELETE')
  and not has_table_privilege('authenticated', 'public.internal_area_memberships', 'INSERT')
  and not has_table_privilege('authenticated', 'public.internal_area_memberships', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.internal_area_memberships', 'DELETE'),
  'authenticated nao possui DML direto nas tabelas base de areas internas'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vw_admin_internal_collaborators'
      and column_name in (
        'avatar_url',
        'raw_app_meta_data',
        'raw_user_meta_data',
        'encrypted_password',
        'metadata',
        'before_state',
        'after_state'
      )
  ),
  0,
  'read model de colaboradores nao expoe payload bruto ou metadados sensiveis'
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
  ('00000000-0000-0000-0000-000000000000', '45000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'ocp-admin@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"OCP Platform Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '45000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'ocp-support@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"OCP Support"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '45000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'ocp-finance@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"OCP Finance"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '45000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'ocp-outsider@genius.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"OCP Outsider"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('45000000-0000-4000-8000-000000000001', 'platform_admin', '45000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001'),
  ('45000000-0000-4000-8000-000000000002', 'support_manager', '45000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001');

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
  ('45000000-0000-4000-8000-000000000010', 'ocp-v1-a-tenant-a', 'OCP V1 A Tenant A LTDA', 'OCP V1 A Tenant A', 'active', '45000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001'),
  ('45000000-0000-4000-8000-000000000020', 'ocp-v1-a-tenant-b', 'OCP V1 A Tenant B LTDA', 'OCP V1 A Tenant B', 'active', '45000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001');

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
  ('45000000-0000-4000-8000-000000000010', '45000000-0000-4000-8000-000000000002', 'tenant_admin', 'active', '45000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001'),
  ('45000000-0000-4000-8000-000000000010', '45000000-0000-4000-8000-000000000003', 'tenant_viewer', 'active', '45000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001'),
  ('45000000-0000-4000-8000-000000000020', '45000000-0000-4000-8000-000000000004', 'tenant_viewer', 'active', '45000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001', '45000000-0000-4000-8000-000000000001');

insert into public.internal_area_memberships (
  tenant_id,
  user_id,
  area_key,
  role,
  status,
  created_by_user_id,
  updated_by_user_id
)
values (
  '45000000-0000-4000-8000-000000000010',
  '45000000-0000-4000-8000-000000000003',
  'finance',
  'member',
  'active',
  '45000000-0000-4000-8000-000000000001',
  '45000000-0000-4000-8000-000000000001'
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
  created_by_user_id,
  updated_by_user_id
)
values (
  '45000000-0000-4000-8000-000000000100',
  '45000000-0000-4000-8000-000000000010',
  'Ticket OCP V1-A',
  'Ticket para validar read models canonicos de areas internas.',
  'internal',
  'in_progress',
  'normal',
  'medium',
  '45000000-0000-4000-8000-000000000002',
  '45000000-0000-4000-8000-000000000002'
);

insert into public.internal_actions (
  id,
  tenant_id,
  ticket_id,
  target_area,
  support_type,
  priority,
  status,
  summary,
  context,
  requested_by_user_id,
  updated_by_user_id
)
values (
  '45000000-0000-4000-8000-000000000200',
  '45000000-0000-4000-8000-000000000010',
  '45000000-0000-4000-8000-000000000100',
  'finance',
  'analysis',
  'normal',
  'open',
  'Validar contrato financeiro OCP',
  'Acionamento aberto apenas para contar demanda operacional da area.',
  '45000000-0000-4000-8000-000000000002',
  '45000000-0000-4000-8000-000000000002'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '45000000-0000-4000-8000-000000000001';

select is(
  (
    select count(*)::integer
    from public.vw_admin_internal_areas
    where area_key in ('finance', 'operations')
  ),
  2,
  'platform_admin le catalogo canonico de areas internas'
);

select ok(
  exists (
    select 1
    from public.vw_admin_internal_areas
    where area_key = 'finance'
      and source_table = 'internal_action_target_areas'
      and can_use_as_operational_area
      and active_membership_count >= 1
      and active_user_count >= 1
      and open_action_count >= 1
  ),
  'area finance reaproveita catalogo existente com contadores operacionais'
);

select ok(
  exists (
    select 1
    from public.vw_admin_internal_collaborators
    where user_id = '45000000-0000-4000-8000-000000000003'
      and user_email = 'ocp-finance@genius.local'
      and active_area_membership_count = 1
      and 'finance' = any(active_area_keys)
  ),
  'platform_admin le colaborador interno derivado de profiles e memberships existentes'
);

select ok(
  exists (
    select 1
    from public.vw_admin_internal_collaborators
    where user_id = '45000000-0000-4000-8000-000000000002'
      and array_position(global_roles, 'support_manager'::public.platform_role) is not null
  ),
  'read model de colaboradores inclui roles globais sem duplicar user_global_roles'
);

select is(
  (
    select count(*)::integer
    from public.vw_admin_internal_area_memberships
    where user_id = '45000000-0000-4000-8000-000000000003'
      and area_key = 'finance'
      and tenant_slug = 'ocp-v1-a-tenant-a'
  ),
  1,
  'view administrativa existente de memberships cobre o contrato necessario'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '45000000-0000-4000-8000-000000000003';

select is(
  (
    select count(*)::integer
    from public.vw_internal_area_landing_context
    where tenant_slug = 'ocp-v1-a-tenant-a'
      and area_key = 'finance'
      and default_landing_path = '/internal-actions'
  ),
  1,
  'membro de area recebe landing context canonico derivado do auth context existente'
);

select is(
  (
    select visible_open_action_count
    from public.vw_internal_area_landing_context
    where tenant_slug = 'ocp-v1-a-tenant-a'
      and area_key = 'finance'
  ),
  1,
  'landing context preserva contagem operacional da area autorizada'
);

select is(
  (select count(*)::integer from public.vw_admin_internal_areas),
  0,
  'usuario sem platform_admin nao le areas administrativas'
);

select is(
  (select count(*)::integer from public.vw_admin_internal_collaborators),
  0,
  'usuario sem platform_admin nao le colaboradores administrativos'
);

select throws_ok(
  $$
    insert into public.internal_action_target_areas (
      area_key,
      display_name,
      status,
      is_system,
      allows_specialized_bridge
    )
    values (
      'ocp_forbidden',
      'OCP Forbidden',
      'active',
      false,
      false
    )
  $$,
  '42501',
  'permission denied for table internal_action_target_areas',
  'DML direto em internal_action_target_areas permanece bloqueado'
);

select throws_ok(
  $$
    update public.internal_area_memberships
    set status = 'inactive'::public.internal_area_membership_status
    where tenant_id = '45000000-0000-4000-8000-000000000010'
      and user_id = '45000000-0000-4000-8000-000000000003'
      and area_key = 'finance'
  $$,
  '42501',
  'permission denied for table internal_area_memberships',
  'DML direto em internal_area_memberships permanece bloqueado'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '45000000-0000-4000-8000-000000000004';

select is(
  (select count(*)::integer from public.vw_internal_area_landing_context),
  0,
  'usuario sem membership de area nao recebe landing context'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role anon;

select throws_ok(
  $$ select count(*) from public.vw_admin_internal_areas $$,
  '42501',
  'permission denied for view vw_admin_internal_areas',
  'anon nao acessa read model admin de areas'
);

select throws_ok(
  $$ select count(*) from public.vw_internal_area_landing_context $$,
  '42501',
  'permission denied for view vw_internal_area_landing_context',
  'anon nao acessa landing context de area interna'
);

reset role;

select *
from finish();

rollback;
