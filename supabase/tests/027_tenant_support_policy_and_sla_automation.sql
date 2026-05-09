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
  ('00000000-0000-0000-0000-000000000000', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'authenticated', 'authenticated', 'admin@sla.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"SLA Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'authenticated', 'authenticated', 'support-a@sla.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'authenticated', 'authenticated', 'support-b@sla.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support B"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'platform_admin', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'support_agent', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'support_agent', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd');

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
  ('33333333-3333-4333-8333-333333333333', 'sla-tenant-a', 'SLA Tenant A LTDA', 'SLA Tenant A', 'active', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  ('44444444-4444-4444-8444-444444444444', 'sla-tenant-b', 'SLA Tenant B LTDA', 'SLA Tenant B', 'active', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd');

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
  ('33333333-3333-4333-8333-333333333333', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'tenant_viewer', 'active', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  ('44444444-4444-4444-8444-444444444444', 'ffffffff-ffff-4fff-8fff-ffffffffffff', 'tenant_viewer', 'active', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd');

select ok(
  has_table_privilege('authenticated', 'public.vw_admin_ticket_sla_policies', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_support_ticket_sla_context', 'SELECT'),
  'authenticated recebe SELECT nos read models de SLA por tenant'
);

select is(
  (
    select count(*)::integer
    from information_schema.table_privileges as tp
    where tp.grantee = 'authenticated'
      and tp.privilege_type in ('INSERT', 'UPDATE', 'DELETE')
      and tp.table_schema = 'public'
      and tp.table_name in (
        'business_calendars',
        'business_calendar_weekly_hours',
        'business_calendar_holidays',
        'ticket_sla_policies'
      )
  ),
  0,
  'authenticated nao possui DML direto em calendario ou politicas de SLA'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

select lives_ok(
  $$
    select public.rpc_admin_upsert_business_calendar(
      null,
      '33333333-3333-4333-8333-333333333333',
      'sla-tenant-a-8x5',
      'Calendario SLA Tenant A 8x5',
      'America/Sao_Paulo',
      'active'
    )
  $$,
  'platform_admin cria calendario de negocio por RPC'
);

select lives_ok(
  format(
    $$
      select public.rpc_admin_upsert_ticket_sla_policy(
        null,
        %L::uuid,
        'sla-tenant-a-integracao-high-medium',
        'SLA Tenant A Integracao Alta',
        'Politica especifica do tenant A para integracao de alto impacto.',
        %L::uuid,
        'high',
        'medium',
        15,
        60,
        null,
        'active'
      )
    $$,
    '33333333-3333-4333-8333-333333333333',
    (
      select option_id
      from public.vw_support_ticket_classification_options
      where option_kind = 'category'
        and slug = 'integracao-tecnica'
    )
  ),
  'platform_admin cria politica SLA especifica por tenant'
);

select is(
  (
    select count(*)::integer
    from audit.audit_logs
    where entity_table in ('business_calendars', 'ticket_sla_policies')
      and actor_user_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  ),
  2,
  'mutacoes administrativas de calendario e SLA geram audit_log'
);

set local request.jwt.claim.sub = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

select lives_ok(
  format(
    $$
      select public.rpc_create_ticket(
        %L::uuid,
        'Ticket SLA tenant especifico',
        'Caso com politica especifica por tenant.',
        'portal',
        'high',
        'medium',
        null,
        %L::uuid,
        %L::uuid
      )
    $$,
    '33333333-3333-4333-8333-333333333333',
    (
      select option_id
      from public.vw_support_ticket_classification_options
      where option_kind = 'category'
        and slug = 'integracao-tecnica'
    ),
    (
      select option_id
      from public.vw_support_ticket_classification_options
      where option_kind = 'operational_reason'
        and slug = 'classificacao-inicial'
    )
  ),
  'ticket do tenant A usa intake real'
);

select is(
  (
    select sla_policy_name
    from public.vw_support_tickets_queue
    where title = 'Ticket SLA tenant especifico'
  ),
  'SLA Tenant A Integracao Alta',
  'politica especifica por tenant vence fallback global'
);

select is(
  (
    select sla_policy_scope
    from public.vw_support_ticket_sla_context
    where ticket_id = (
      select id
      from public.vw_support_tickets_queue
      where title = 'Ticket SLA tenant especifico'
    )
  ),
  'tenant',
  'read model explicita escopo tenant'
);

select is(
  (
    select extract(epoch from (resolution_due_at - created_at))::integer / 60
    from public.vw_support_tickets_queue
    where title = 'Ticket SLA tenant especifico'
  ),
  60,
  'resolution_due_at e calculado no backend pela politica do tenant'
);

set local request.jwt.claim.sub = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

select lives_ok(
  format(
    $$
      select public.rpc_create_ticket(
        %L::uuid,
        'Ticket SLA fallback global',
        'Caso sem politica especifica por tenant.',
        'portal',
        'high',
        'medium',
        null,
        %L::uuid,
        %L::uuid
      )
    $$,
    '44444444-4444-4444-8444-444444444444',
    (
      select option_id
      from public.vw_support_ticket_classification_options
      where option_kind = 'category'
        and slug = 'integracao-tecnica'
    ),
    (
      select option_id
      from public.vw_support_ticket_classification_options
      where option_kind = 'operational_reason'
        and slug = 'classificacao-inicial'
    )
  ),
  'ticket do tenant B usa fallback global controlado'
);

select is(
  (
    select sla_policy_scope
    from public.vw_support_ticket_sla_context
    where ticket_id = (
      select id
      from public.vw_support_tickets_queue
      where title = 'Ticket SLA fallback global'
    )
  ),
  'global_fallback',
  'tenant sem politica especifica usa fallback global controlado'
);

select throws_ok(
  format(
    $$
      select public.rpc_create_ticket(
        %L::uuid,
        'Ticket cross-tenant bloqueado',
        'Nao deve abrir fora do tenant permitido.',
        'portal',
        'high',
        'medium',
        null,
        %L::uuid,
        %L::uuid
      )
    $$,
    '33333333-3333-4333-8333-333333333333',
    (
      select option_id
      from public.vw_support_ticket_classification_options
      where option_kind = 'category'
        and slug = 'integracao-tecnica'
    ),
    (
      select option_id
      from public.vw_support_ticket_classification_options
      where option_kind = 'operational_reason'
        and slug = 'classificacao-inicial'
    )
  ),
  'P0001',
  'rpc_create_ticket denied',
  'cross-tenant continua bloqueado'
);

reset role;

update public.tickets
set resolution_due_at = timezone('utc', now()) + interval '30 minutes'
where title = 'Ticket SLA tenant especifico';

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

select is(
  (
    select sla_status
    from public.vw_support_tickets_queue
    where title = 'Ticket SLA tenant especifico'
  ),
  'at_risk'::public.ticket_sla_status,
  'sla_status em risco e derivado no backend'
);

reset role;

update public.tickets
set resolution_due_at = timezone('utc', now()) - interval '5 minutes'
where title = 'Ticket SLA tenant especifico';

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

select is(
  (
    select sla_status
    from public.vw_support_tickets_queue
    where title = 'Ticket SLA tenant especifico'
  ),
  'breached'::public.ticket_sla_status,
  'sla_status violado e derivado no backend'
);

select lives_ok(
  $$
    select public.rpc_support_recalculate_ticket_sla(
      (select id from public.vw_support_tickets_queue where title = 'Ticket SLA tenant especifico')
    )
  $$,
  'suporte autorizado recalcula SLA por RPC'
);

reset role;

select ok(
  exists (
    select 1
    from public.ticket_events
    where event_type = 'sla_updated'
      and ticket_id = (
        select id
        from public.vw_support_tickets_queue
        where title = 'Ticket SLA tenant especifico'
      )
  ),
  'recalculo relevante gera ticket_event'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

select throws_ok(
  $$
    insert into public.ticket_sla_policies (
      tenant_id,
      slug,
      name,
      first_response_minutes,
      resolution_minutes
    )
    values (
      '33333333-3333-4333-8333-333333333333',
      'dml-direto-bloqueado',
      'DML direto bloqueado',
      10,
      20
    )
  $$,
  '42501',
  null,
  'DML direto por authenticated falha em ticket_sla_policies'
);

select throws_ok(
  $$
    select public.rpc_admin_upsert_ticket_sla_policy(
      null,
      '33333333-3333-4333-8333-333333333333',
      'suporte-nao-admin',
      'Suporte nao admin',
      null,
      null,
      'normal',
      null,
      30,
      120,
      null,
      'active'
    )
  $$,
  'P0001',
  'rpc_admin_upsert_ticket_sla_policy denied',
  'support_agent nao cria politica administrativa'
);

set local request.jwt.claim.sub = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

select lives_ok(
  $$
    select public.rpc_admin_archive_ticket_sla_policy(
      (select id from public.vw_admin_ticket_sla_policies where slug = 'sla-tenant-a-integracao-high-medium')
    )
  $$,
  'platform_admin arquiva politica sem delete fisico'
);

select is(
  (
    select status
    from public.vw_admin_ticket_sla_policies
    where slug = 'sla-tenant-a-integracao-high-medium'
  ),
  'archived'::public.ticket_reference_status,
  'policy arquivada continua rastreavel no read model admin'
);

select * from finish();
rollback;
