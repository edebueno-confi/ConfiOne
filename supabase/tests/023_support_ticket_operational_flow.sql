create extension if not exists pgtap with schema extensions;

begin;

select plan(19);

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
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'admin@support-flow.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Platform Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'support-a@support-flow.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'authenticated', 'authenticated', 'tenant-a@support-flow.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Tenant A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'authenticated', 'authenticated', 'support-b@support-flow.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Support B"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'platform_admin', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'support_agent', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'support_agent', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
  ('11111111-1111-4111-8111-111111111111', 'support-flow-a', 'Support Flow A LTDA', 'Support Flow A', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222', 'support-flow-b', 'Support Flow B LTDA', 'Support Flow B', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
  ('11111111-1111-4111-8111-111111111111', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'tenant_viewer', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'tenant_viewer', 'active', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

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
values
  ('30000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', null, 'Contato A', 'contato-a@support-flow.local', true, true, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('30000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', null, 'Contato B', 'contato-b@support-flow.local', true, true, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into public.tickets (
  id,
  tenant_id,
  requester_contact_id,
  title,
  description,
  source,
  status,
  priority,
  severity,
  created_by_user_id,
  assigned_to_user_id,
  updated_by_user_id
)
values
  ('10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '30000000-0000-4000-8000-000000000001', 'Ticket operacional A', 'Descricao operacional A', 'portal', 'in_progress', 'high', 'medium', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('20000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', '30000000-0000-4000-8000-000000000002', 'Ticket operacional B', 'Descricao operacional B', 'portal', 'new', 'normal', 'low', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd');

insert into public.ticket_messages (
  id,
  tenant_id,
  ticket_id,
  visibility,
  body,
  created_by_user_id,
  metadata,
  created_at,
  updated_at
)
select
  ('50000000-0000-4000-8000-' || lpad(gs::text, 12, '0'))::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid,
  '10000000-0000-4000-8000-000000000001'::uuid,
  case when gs = 2 then 'internal'::public.message_visibility else 'customer'::public.message_visibility end,
  format('Mensagem operacional %s', gs),
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
  jsonb_build_object('fixture_index', gs),
  '2026-05-08 10:00:00+00'::timestamptz + make_interval(mins => gs),
  '2026-05-08 10:00:00+00'::timestamptz + make_interval(mins => gs)
from generate_series(1, 6) as gs;

insert into public.ticket_events (
  id,
  tenant_id,
  ticket_id,
  event_type,
  visibility,
  actor_user_id,
  metadata,
  occurred_at
)
values
  ('60000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000000001', 'ticket_created', 'customer', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '{}'::jsonb, '2026-05-08 10:00:30+00'::timestamptz),
  ('60000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000000001', 'assigned', 'internal', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '{}'::jsonb, '2026-05-08 10:03:30+00'::timestamptz);

select has_function(
  'public',
  'rpc_support_get_ticket_timeline',
  array['uuid', 'integer', 'timestamp with time zone', 'uuid'],
  'rpc_support_get_ticket_timeline existe com cursor explicito'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_support_knowledge_public_link_candidates', 'SELECT')
  and has_function_privilege(
    'authenticated',
    'public.rpc_support_get_ticket_timeline(uuid, integer, timestamp with time zone, uuid)',
    'EXECUTE'
  ),
  'authenticated recebe apenas contrato de leitura/RPC operacional'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select is(
  (
    select count(*)::integer
    from public.rpc_support_get_ticket_timeline(
      '10000000-0000-4000-8000-000000000001'::uuid,
      3,
      null,
      null
    )
  ),
  3,
  'timeline paginada respeita limite solicitado'
);

select is(
  (
    select max(total_available_count)
    from public.rpc_support_get_ticket_timeline(
      '10000000-0000-4000-8000-000000000001'::uuid,
      3,
      null,
      null
    )
  ),
  8,
  'timeline paginada preserva contagem total disponivel'
);

select ok(
  (
    select bool_and(has_more)
    from public.rpc_support_get_ticket_timeline(
      '10000000-0000-4000-8000-000000000001'::uuid,
      3,
      null,
      null
    )
  ),
  'timeline paginada indica quando existem paginas anteriores'
);

select is(
  (
    with first_page as (
      select *
      from public.rpc_support_get_ticket_timeline(
        '10000000-0000-4000-8000-000000000001'::uuid,
        3,
        null,
        null
      )
    ),
    cursor_row as (
      select occurred_at, timeline_entry_id
      from first_page
      order by occurred_at asc, timeline_entry_id asc
      limit 1
    )
    select count(*)::integer
    from public.rpc_support_get_ticket_timeline(
      '10000000-0000-4000-8000-000000000001'::uuid,
      3,
      (select occurred_at from cursor_row),
      (select timeline_entry_id from cursor_row)
    )
  ),
  3,
  'timeline paginada retorna pagina anterior por cursor'
);

select throws_ok(
  $$
    select *
    from public.rpc_support_get_ticket_timeline(
      '20000000-0000-4000-8000-000000000001'::uuid,
      3,
      null,
      null
    )
  $$,
  'P0001',
  'rpc_support_get_ticket_timeline denied',
  'support_agent de outro tenant nao executa timeline cross-tenant'
);

select lives_ok(
  $$
    select public.rpc_add_ticket_message(
      '10000000-0000-4000-8000-000000000001'::uuid,
      'Resposta publica pelo fluxo operacional.'
    )
  $$,
  'resposta publica segue RPC real'
);

select lives_ok(
  $$
    select public.rpc_add_internal_ticket_note(
      '10000000-0000-4000-8000-000000000001'::uuid,
      'Nota interna pelo fluxo operacional.'
    )
  $$,
  'nota interna segue RPC real'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select ok(
  exists (
    select 1
    from public.ticket_events as te
    where te.ticket_id = '10000000-0000-4000-8000-000000000001'::uuid
      and te.event_type = 'message_added'::public.ticket_event_type
  )
  and exists (
    select 1
    from public.ticket_events as te
    where te.ticket_id = '10000000-0000-4000-8000-000000000001'::uuid
      and te.event_type = 'internal_note_added'::public.ticket_event_type
  ),
  'mutacoes de mensagem e nota interna geram ticket_events'
);

select ok(
  exists (
    select 1
    from audit.audit_logs as audit_log
    where audit_log.entity_table = 'ticket_messages'
      and audit_log.action = 'insert'
      and audit_log.tenant_id = '11111111-1111-4111-8111-111111111111'::uuid
  )
  and exists (
    select 1
    from audit.audit_logs as audit_log
    where audit_log.entity_table = 'ticket_events'
      and audit_log.action = 'insert'
      and audit_log.tenant_id = '11111111-1111-4111-8111-111111111111'::uuid
  ),
  'mutacoes de ticket geram audit_logs via triggers existentes'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select throws_ok(
  $$
    select *
    from public.rpc_support_get_ticket_timeline(
      '10000000-0000-4000-8000-000000000001'::uuid,
      3,
      null,
      null
    )
  $$,
  'P0001',
  'rpc_support_get_ticket_timeline denied',
  'membro de tenant sem role de suporte nao executa timeline operacional'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select lives_ok(
  $$
    select public.rpc_admin_create_knowledge_category(
      'Publica Support Flow',
      'publica-support-flow',
      'Categoria publica support flow.',
      'public',
      null,
      '11111111-1111-4111-8111-111111111111'::uuid
    )
  $$,
  'platform_admin cria categoria publica para contrato de link'
);

select lives_ok(
  $$
    select public.rpc_admin_create_knowledge_category(
      'Interna Support Flow',
      'interna-support-flow',
      'Categoria interna support flow.',
      'internal',
      null,
      '11111111-1111-4111-8111-111111111111'::uuid
    )
  $$,
  'platform_admin cria categoria interna para validar filtro publico'
);

select lives_ok(
  $$
    select public.rpc_admin_create_knowledge_article_draft(
      'Artigo publico support flow',
      'artigo-publico-support-flow',
      'Resumo publico.',
      'Corpo publico.',
      (select id from public.vw_admin_knowledge_categories where slug = 'publica-support-flow'),
      'public',
      '11111111-1111-4111-8111-111111111111'::uuid,
      null,
      null
    )
  $$,
  'platform_admin cria artigo publico para candidato de link'
);

select lives_ok(
  $$
    select public.rpc_admin_create_knowledge_article_draft(
      'Artigo interno support flow',
      'artigo-interno-support-flow',
      'Resumo interno.',
      'Corpo interno.',
      (select id from public.vw_admin_knowledge_categories where slug = 'interna-support-flow'),
      'internal',
      '11111111-1111-4111-8111-111111111111'::uuid,
      null,
      null
    )
  $$,
  'platform_admin cria artigo interno para validar bloqueio de link publico'
);

select lives_ok(
  $$
    select public.rpc_admin_submit_knowledge_article_for_review(
      (select id from public.vw_admin_knowledge_articles_list where slug = 'artigo-publico-support-flow')
    );
    select public.rpc_admin_publish_knowledge_article(
      (select id from public.vw_admin_knowledge_articles_list where slug = 'artigo-publico-support-flow')
    );
    select public.rpc_admin_submit_knowledge_article_for_review(
      (select id from public.vw_admin_knowledge_articles_list where slug = 'artigo-interno-support-flow')
    );
    select public.rpc_admin_publish_knowledge_article(
      (select id from public.vw_admin_knowledge_articles_list where slug = 'artigo-interno-support-flow')
    );
  $$,
  'platform_admin publica artigos publico e interno'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

update public.knowledge_spaces
set status = 'active'
where slug = 'genius';

update public.knowledge_categories
set knowledge_space_id = (select id from public.knowledge_spaces where slug = 'genius')
where slug in ('publica-support-flow', 'interna-support-flow')
  and knowledge_space_id is null;

update public.knowledge_articles
set knowledge_space_id = (select id from public.knowledge_spaces where slug = 'genius')
where slug in ('artigo-publico-support-flow', 'artigo-interno-support-flow')
  and knowledge_space_id is null;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select is(
  (
    select count(*)::integer
    from public.vw_support_knowledge_public_link_candidates
    where ticket_id = '10000000-0000-4000-8000-000000000001'::uuid
      and article_slug = 'artigo-publico-support-flow'
      and public_article_path = '/help/genius/articles/artigo-publico-support-flow'
  ),
  1,
  'contrato de link publico seguro expoe artigo publico publicado com rota resolvida'
);

select is(
  (
    select count(*)::integer
    from public.vw_support_knowledge_public_link_candidates
    where ticket_id = '10000000-0000-4000-8000-000000000001'::uuid
      and article_slug = 'artigo-interno-support-flow'
  ),
  0,
  'contrato de link publico seguro nao expoe artigo interno'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select * from finish();
rollback;
