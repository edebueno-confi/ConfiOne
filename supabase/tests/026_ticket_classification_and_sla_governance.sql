create extension if not exists pgtap with schema extensions;

begin;

select plan(23);

create temporary table qa_ticket_classification_ids (
  ticket_id uuid,
  category_id uuid
) on commit drop;

grant select on qa_ticket_classification_ids to authenticated;

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
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'admin@classification.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Platform Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'support@classification.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support Agent"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'authenticated', 'authenticated', 'other@classification.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Other Support"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'platform_admin', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'support_agent', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'support_agent', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
  ('11111111-1111-4111-8111-111111111111', 'classification-a', 'Classification A LTDA', 'Classification A', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222', 'classification-b', 'Classification B LTDA', 'Classification B', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
  ('11111111-1111-4111-8111-111111111111', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'tenant_viewer', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'tenant_viewer', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

select ok(
  has_table_privilege('authenticated', 'public.vw_support_ticket_classification_options', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_support_ticket_sla_context', 'SELECT'),
  'authenticated recebe SELECT nos read models de classificacao e SLA'
);

select is(
  (
    select count(*)::integer
    from information_schema.table_privileges as tp
    where tp.grantee = 'authenticated'
      and tp.privilege_type in ('INSERT', 'UPDATE', 'DELETE')
      and tp.table_schema = 'public'
      and tp.table_name in ('ticket_categories', 'ticket_operational_reasons', 'ticket_sla_policies')
  ),
  0,
  'authenticated nao possui DML direto nas tabelas base de classificacao e SLA'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select ok(
  (
    select count(*)::integer
    from public.vw_support_ticket_classification_options
    where option_kind = 'category'
  ) >= 6,
  'opcoes de categoria operacional ficam disponiveis para suporte autorizado'
);

select lives_ok(
  format(
    $$
      select public.rpc_create_ticket(
        %L::uuid,
        'Ticket com categoria operacional',
        'Criado com categoria e motivo operacional reais.',
        'portal',
        'high',
        'medium',
        null,
        %L::uuid,
        %L::uuid
      )
    $$,
    '11111111-1111-4111-8111-111111111111',
    (
      select option_id
      from public.vw_support_ticket_classification_options
      where option_kind = 'category'
        and slug = 'integracao-tecnica'
      limit 1
    ),
    (
      select option_id
      from public.vw_support_ticket_classification_options
      where option_kind = 'operational_reason'
        and slug = 'classificacao-inicial'
      limit 1
    )
  ),
  'ticket pode ser criado por RPC com categoria e motivo operacional validos'
);

select is(
  (
    select category_slug
    from public.vw_support_tickets_queue
    where title = 'Ticket com categoria operacional'
  ),
  'integracao-tecnica',
  'fila expõe categoria real derivada do backend'
);

select ok(
  (
    select is_sla_available
    from public.vw_support_tickets_queue
    where title = 'Ticket com categoria operacional'
  ),
  'fila expõe SLA interno real quando política existe'
);

select is(
  (
    select sla_status
    from public.vw_support_tickets_queue
    where title = 'Ticket com categoria operacional'
  ),
  'on_track'::public.ticket_sla_status,
  'SLA é derivado no backend como dentro da governanca no ticket novo'
);

select ok(
  (
    select allowed_next_statuses @> array['waiting_customer', 'waiting_engineering', 'resolved']::public.ticket_status[]
    from public.vw_support_ticket_detail
    where title = 'Ticket com categoria operacional'
  ),
  'detalhe expõe próximas transições permitidas pelo backend'
);

select throws_ok(
  format(
    $$
      select public.rpc_support_update_ticket_classification(
        (select id from public.vw_support_ticket_detail where title = 'Ticket com categoria operacional' limit 1),
        %L::uuid,
        null,
        null
      )
    $$,
    '99999999-9999-4999-8999-999999999999'
  ),
  'P0001',
  'ticket category is not active',
  'categoria inválida é bloqueada no backend'
);

select lives_ok(
  format(
    $$
      select public.rpc_support_update_ticket_classification(
        (select id from public.vw_support_ticket_detail where title = 'Ticket com categoria operacional' limit 1),
        %L::uuid,
        %L::uuid,
        'Reclassificado por validação operacional.'
      )
    $$,
    (
      select option_id
      from public.vw_support_ticket_classification_options
      where option_kind = 'category'
        and slug = 'operacao-plataforma'
      limit 1
    ),
    (
      select option_id
      from public.vw_support_ticket_classification_options
      where option_kind = 'operational_reason'
        and slug = 'classificacao-ajustada'
      limit 1
    )
  ),
  'RPC atualiza classificacao operacional com motivo valido'
);

select is(
  (
    select category_slug
    from public.vw_support_ticket_detail
    where title = 'Ticket com categoria operacional'
  ),
  'operacao-plataforma',
  'detalhe reflete a classificacao atualizada'
);

select throws_ok(
  format(
    $$
      select public.rpc_support_update_ticket_status_v2(
        (select id from public.vw_support_ticket_detail where title = 'Ticket com categoria operacional' limit 1),
        'waiting_customer',
        null,
        null
      )
    $$
  ),
  'P0001',
  'operational reason is required for this status transition',
  'motivo obrigatório é exigido para transição operacional sensível'
);

select lives_ok(
  format(
    $$
      select public.rpc_support_update_ticket_status_v2(
        (select id from public.vw_support_ticket_detail where title = 'Ticket com categoria operacional' limit 1),
        'waiting_customer',
        %L::uuid,
        'Aguardando evidencia do cliente.'
      )
    $$,
    (
      select option_id
      from public.vw_support_ticket_classification_options
      where option_kind = 'operational_reason'
        and slug = 'aguardando-cliente'
      limit 1
    )
  ),
  'transição válida com motivo operacional é permitida'
);

select throws_ok(
  format(
    $$
      select public.rpc_support_update_ticket_status_v2(
        (select id from public.vw_support_ticket_detail where title = 'Ticket com categoria operacional' limit 1),
        'closed',
        null,
        null
      )
    $$
  ),
  'P0001',
  'use rpc_close_ticket for closed status',
  'fechamento direto continua bloqueado fora da RPC específica'
);

select lives_ok(
  format(
    $$
      select public.rpc_support_update_ticket_priority_severity(
        (select id from public.vw_support_ticket_detail where title = 'Ticket com categoria operacional' limit 1),
        'urgent',
        'critical',
        %L::uuid,
        'Impacto operacional confirmado.'
      )
    $$,
    (
      select option_id
      from public.vw_support_ticket_classification_options
      where option_kind = 'operational_reason'
        and slug = 'prioridade-ajustada'
      limit 1
    )
  ),
  'prioridade e severidade podem ser alteradas via RPC governada'
);

select is(
  (
    select priority
    from public.vw_support_ticket_detail
    where title = 'Ticket com categoria operacional'
  ),
  'urgent'::public.ticket_priority,
  'detalhe reflete prioridade atualizada'
);

select is(
  (
    select severity
    from public.vw_support_ticket_detail
    where title = 'Ticket com categoria operacional'
  ),
  'critical'::public.ticket_severity,
  'detalhe reflete severidade atualizada'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

insert into qa_ticket_classification_ids (ticket_id, category_id)
select
  (
    select id
    from public.tickets
    where title = 'Ticket com categoria operacional'
    limit 1
  ),
  (
    select id
    from public.ticket_categories
    where slug = 'dados-relatorios'
    limit 1
  );

select ok(
  (
    select count(*)::integer
    from public.ticket_events
    where ticket_id = (
      select id
      from public.tickets
      where title = 'Ticket com categoria operacional'
      limit 1
    )
      and event_type in (
        'ticket_created',
        'classification_changed',
        'status_changed',
        'priority_changed'
      )
  ) >= 4,
  'classificacao, status e prioridade geram ticket_events'
);

select ok(
  (
    select count(*)::integer
    from audit.audit_logs as audit_log
    where audit_log.tenant_id = '11111111-1111-4111-8111-111111111111'::uuid
      and audit_log.entity_table in ('tickets', 'ticket_events')
      and audit_log.action in ('insert', 'update')
  ) >= 4,
  'mutações de classificacao e SLA geram audit trail'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select throws_ok(
  format(
    $$
      select public.rpc_support_update_ticket_classification(
        (select ticket_id from qa_ticket_classification_ids limit 1),
        %L::uuid,
        null,
        null
      )
    $$,
    (
      select category_id
      from qa_ticket_classification_ids
      limit 1
    )
  ),
  'P0001',
  'rpc_support_update_ticket_classification denied',
  'cross-tenant de classificacao é bloqueado por permissão de ticket'
);

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_sla_context
    where tenant_id = '11111111-1111-4111-8111-111111111111'::uuid
  ),
  0,
  'support de outro tenant nao enxerga contexto SLA cross-tenant'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select throws_ok(
  $$
    insert into public.ticket_categories (slug, name)
    values ('categoria-direta', 'Categoria direta')
  $$,
  '42501',
  null,
  'DML direto em categorias operacionais falha para authenticated'
);

select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_sla_context
    where sla_reference ilike '%promessa publica%'
  ),
  (
    select count(*)::integer
    from public.vw_support_ticket_sla_context
  ),
  'SLA é documentado no contrato como governanca interna, nao promessa publica'
);

select * from finish();
rollback;
