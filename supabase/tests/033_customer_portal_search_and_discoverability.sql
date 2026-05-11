create extension if not exists pgtap with schema extensions;

begin;

create or replace function pg_temp.safe_bigint(p_sql text)
returns bigint
language plpgsql
as $$
declare
  v_result bigint;
begin
  execute p_sql into v_result;
  return coalesce(v_result, 0);
exception
  when undefined_table or undefined_column or undefined_function then
    return -1;
  when insufficient_privilege then
    return -2;
end;
$$;

create or replace function pg_temp.safe_text(p_sql text)
returns text
language plpgsql
as $$
declare
  v_result text;
begin
  execute p_sql into v_result;
  return coalesce(v_result, '<null>');
exception
  when undefined_table or undefined_column or undefined_function then
    return '<missing>';
  when insufficient_privilege then
    return '<denied>';
end;
$$;

select plan(18);

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
  ('00000000-0000-0000-0000-000000000000', '90000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'portal-search-admin@local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Portal Search Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '90000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'portal-search-customer-a@local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Portal Search Customer A"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '90000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'portal-search-customer-b@local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Portal Search Customer B"}'::jsonb, timezone('utc', now()), timezone('utc', now()))
on conflict (id) do nothing;

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values (
  '90000000-0000-4000-8000-000000000001',
  'platform_admin',
  '90000000-0000-4000-8000-000000000001',
  '90000000-0000-4000-8000-000000000001'
)
on conflict (user_id, role) do nothing;

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
  ('90000000-0000-4000-8000-100000000001', 'portal-search-a', 'Portal Search A LTDA', 'Portal Search A', 'active', '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-100000000002', 'portal-search-b', 'Portal Search B LTDA', 'Portal Search B', 'active', '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

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
  ('90000000-0000-4000-8000-200000000001', '90000000-0000-4000-8000-100000000001', '90000000-0000-4000-8000-000000000002', 'customer_user', 'active', '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-200000000002', '90000000-0000-4000-8000-100000000002', '90000000-0000-4000-8000-000000000003', 'customer_user', 'active', '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

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
  ('90000000-0000-4000-8000-300000000001', '90000000-0000-4000-8000-100000000001', '90000000-0000-4000-8000-000000000002', 'Cliente Busca A', 'portal-search-customer-a@local', true, true, '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-300000000002', '90000000-0000-4000-8000-100000000002', '90000000-0000-4000-8000-000000000003', 'Cliente Busca B', 'portal-search-customer-b@local', true, true, '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001')
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
    '90000000-0000-4000-8000-100000000001',
    'returns_portal',
    true,
    'contract',
    '90000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000001'
  ),
  (
    '90000000-0000-4000-8000-100000000002',
    'returns_portal',
    true,
    'contract',
    '90000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000001'
  )
on conflict (tenant_id, lower(feature_key)) do update
set
  enabled = excluded.enabled,
  source = excluded.source,
  updated_by_user_id = excluded.updated_by_user_id;

update public.knowledge_spaces
set status = 'active'
where slug = 'genius';

insert into public.knowledge_categories (
  id,
  knowledge_space_id,
  visibility,
  name,
  slug,
  created_by_user_id,
  updated_by_user_id
)
values
  ('90000000-0000-4000-8000-400000000001', (select id from public.knowledge_spaces where slug = 'genius'), 'public', 'Busca Pública Portal', 'busca-publica-portal', '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-400000000002', (select id from public.knowledge_spaces where slug = 'genius'), 'restricted', 'Busca Restrita Portal', 'busca-restrita-portal', '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-400000000003', (select id from public.knowledge_spaces where slug = 'genius'), 'internal', 'Busca Interna Portal', 'busca-interna-portal', '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

insert into public.knowledge_articles (
  id,
  knowledge_space_id,
  category_id,
  visibility,
  status,
  title,
  slug,
  summary,
  body_md,
  published_at,
  created_by_user_id,
  updated_by_user_id
)
values
  ('90000000-0000-4000-8000-500000000001', (select id from public.knowledge_spaces where slug = 'genius'), '90000000-0000-4000-8000-400000000001', 'public', 'published', 'Guia público pesquisável', 'guia-publico-pesquisavel', 'Artigo público para busca autenticada do portal.', 'Conteúdo público aprovado para pesquisa no portal.', timezone('utc', now()), '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-500000000002', (select id from public.knowledge_spaces where slug = 'genius'), '90000000-0000-4000-8000-400000000002', 'restricted', 'published', 'Checklist autenticado pesquisável', 'checklist-autenticado-pesquisavel', 'Conteúdo autenticado liberado via entitlement.', 'Conteúdo autenticado seguro para clientes do tenant A.', timezone('utc', now()), '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-500000000003', (select id from public.knowledge_spaces where slug = 'genius'), '90000000-0000-4000-8000-400000000002', 'restricted', 'published', 'Webhook relacionado ao ticket', 'webhook-relacionado-ao-ticket', 'Conteúdo restrito liberado apenas no ticket.', 'Orientação customer-facing aprovada para o ticket do tenant A.', timezone('utc', now()), '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-500000000004', (select id from public.knowledge_spaces where slug = 'genius'), '90000000-0000-4000-8000-400000000002', 'restricted', 'published', 'Playbook restrito sem acesso', 'playbook-restrito-sem-acesso', 'Não pode aparecer sem entitlement.', 'Conteúdo restrito que não deve ser encontrado sem grant.', timezone('utc', now()), '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-500000000005', (select id from public.knowledge_spaces where slug = 'genius'), '90000000-0000-4000-8000-400000000003', 'internal', 'published', 'Operação interna bloqueada', 'operacao-interna-bloqueada', 'Não pode aparecer na busca customer-facing.', 'Conteúdo interno do suporte.', timezone('utc', now()), '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-500000000006', (select id from public.knowledge_spaces where slug = 'genius'), '90000000-0000-4000-8000-400000000002', 'restricted', 'draft', 'Rascunho bloqueado do portal', 'rascunho-bloqueado-do-portal', 'Rascunho que não deve aparecer.', 'Conteúdo draft bloqueado.', null, '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-500000000007', (select id from public.knowledge_spaces where slug = 'genius'), '90000000-0000-4000-8000-400000000002', 'restricted', 'published', 'Restrito do tenant B', 'restrito-do-tenant-b', 'Conteúdo restrito do tenant B.', 'Conteúdo seguro apenas para o tenant B.', timezone('utc', now()), '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

insert into public.tickets (
  id,
  tenant_id,
  requester_contact_id,
  title,
  description,
  source,
  created_by_user_id,
  updated_by_user_id
)
values
  ('90000000-0000-4000-8000-600000000001', '90000000-0000-4000-8000-100000000001', '90000000-0000-4000-8000-300000000001', 'Ticket busca A', 'Ticket customer-facing do tenant A.', 'portal', '90000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000002'),
  ('90000000-0000-4000-8000-600000000002', '90000000-0000-4000-8000-100000000002', '90000000-0000-4000-8000-300000000002', 'Ticket busca B', 'Ticket customer-facing do tenant B.', 'portal', '90000000-0000-4000-8000-000000000003', '90000000-0000-4000-8000-000000000003')
on conflict (id) do nothing;

insert into public.ticket_knowledge_links (
  id,
  ticket_id,
  tenant_id,
  article_id,
  link_type,
  note,
  created_by_user_id
)
values (
  '90000000-0000-4000-8000-700000000001',
  '90000000-0000-4000-8000-600000000001',
  '90000000-0000-4000-8000-100000000001',
  '90000000-0000-4000-8000-500000000003',
  'sent_to_customer',
  'Relacionado ao ticket do tenant A para validação contextual.',
  '90000000-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;

insert into public.knowledge_article_entitlements (
  id,
  tenant_id,
  article_id,
  entitlement_scope,
  relation_reason,
  status,
  created_by_user_id,
  updated_by_user_id
)
values
  ('90000000-0000-4000-8000-800000000001', '90000000-0000-4000-8000-100000000001', '90000000-0000-4000-8000-500000000002', 'customer_portal', 'Entitlement ativo para o tenant A.', 'active', '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-800000000002', '90000000-0000-4000-8000-100000000002', '90000000-0000-4000-8000-500000000007', 'tenant', 'Entitlement ativo para o tenant B.', 'active', '90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

select is(
  (
    select count(distinct gr.routine_name)::integer
    from information_schema.routine_privileges as gr
    where gr.grantee = 'authenticated'
      and gr.privilege_type = 'EXECUTE'
      and gr.specific_schema = 'public'
      and gr.routine_name = 'rpc_customer_search_knowledge_articles'
  ),
  1,
  'authenticated recebe EXECUTE na RPC customer-facing de busca'
);

select ok(
  not has_table_privilege('authenticated', 'public.knowledge_articles', 'INSERT')
  and not has_table_privilege('authenticated', 'public.knowledge_article_entitlements', 'INSERT'),
  'authenticated continua sem DML direto nas tabelas base de knowledge'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '90000000-0000-4000-8000-000000000002';

select is(
  pg_temp.safe_bigint(
    $$select count(*)
      from public.rpc_customer_search_knowledge_articles(
        '90000000-0000-4000-8000-100000000001',
        'público',
        null,
        'all',
        null,
        12,
        0
      )$$
  ),
  1::bigint,
  'customer encontra artigo público pela busca autenticada'
);

select is(
  pg_temp.safe_bigint(
    $$select count(*)
      from public.rpc_customer_search_knowledge_articles(
        '90000000-0000-4000-8000-100000000001',
        'autenticado',
        null,
        'customer_portal',
        null,
        12,
        0
      )$$
  ),
  1::bigint,
  'customer encontra artigo com entitlement do tenant'
);

select is(
  pg_temp.safe_text(
    $$select match_reason
      from public.rpc_customer_search_knowledge_articles(
        '90000000-0000-4000-8000-100000000001',
        'webhook',
        null,
        'ticket_linked',
        '90000000-0000-4000-8000-600000000001',
        12,
        0
      )
      limit 1$$
  ),
  'Relacionado ao ticket',
  'busca contextual do ticket retorna match_reason seguro'
);

select is(
  pg_temp.safe_bigint(
    $$select count(*)
      from public.rpc_customer_search_knowledge_articles(
        '90000000-0000-4000-8000-100000000001',
        'tenant b',
        null,
        'all',
        null,
        12,
        0
      )$$
  ),
  0::bigint,
  'customer não encontra artigo restrito de outro tenant'
);

select is(
  pg_temp.safe_bigint(
    $$select count(*)
      from public.rpc_customer_search_knowledge_articles(
        '90000000-0000-4000-8000-100000000001',
        'rascunho',
        null,
        'all',
        null,
        12,
        0
      )$$
  ),
  0::bigint,
  'customer não encontra draft na busca autenticada'
);

select is(
  pg_temp.safe_bigint(
    $$select count(*)
      from public.rpc_customer_search_knowledge_articles(
        '90000000-0000-4000-8000-100000000001',
        'interna',
        null,
        'all',
        null,
        12,
        0
      )$$
  ),
  0::bigint,
  'customer não encontra artigo internal na busca autenticada'
);

select is(
  pg_temp.safe_bigint(
    $$select count(*)
      from public.rpc_customer_search_knowledge_articles(
        '90000000-0000-4000-8000-100000000001',
        'playbook',
        null,
        'all',
        null,
        12,
        0
      )$$
  ),
  0::bigint,
  'restricted sem entitlement não aparece na busca autenticada'
);

select is(
  pg_temp.safe_bigint(
    $$select count(*)
      from public.rpc_customer_search_knowledge_articles(
        '90000000-0000-4000-8000-100000000001',
        null,
        null,
        'all',
        null,
        12,
        0
      )$$
  ),
  3::bigint,
  'busca vazia retorna apenas a lista segura já autorizada'
);

select throws_ok(
  $$
    select public.rpc_customer_search_knowledge_articles(
      '90000000-0000-4000-8000-100000000001',
      'webhook',
      null,
      'ticket_linked',
      '90000000-0000-4000-8000-600000000002',
      12,
      0
    )
  $$,
  'ticket search context is not available',
  'ticket_id cross-tenant é bloqueado'
);

reset role;
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '90000000-0000-4000-8000-000000000001';

select lives_ok(
  $$
    select public.rpc_admin_archive_knowledge_article_entitlement(
      '90000000-0000-4000-8000-100000000001',
      '90000000-0000-4000-8000-800000000001'
    )
  $$,
  'admin arquiva entitlement usado na busca autenticada'
);

reset role;
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '90000000-0000-4000-8000-000000000002';

select is(
  pg_temp.safe_bigint(
    $$select count(*)
      from public.rpc_customer_search_knowledge_articles(
        '90000000-0000-4000-8000-100000000001',
        'autenticado',
        null,
        'customer_portal',
        null,
        12,
        0
      )$$
  ),
  0::bigint,
  'entitlement arquivado remove o artigo dos resultados'
);

select is(
  pg_temp.safe_text(
    $$select category_name
      from public.rpc_customer_search_knowledge_articles(
        '90000000-0000-4000-8000-100000000001',
        'webhook',
        'Busca Restrita Portal',
        'ticket_linked',
        '90000000-0000-4000-8000-600000000001',
        12,
        0
      )
      limit 1$$
  ),
  'Busca Restrita Portal',
  'filtro por categoria usa dado real retornado pelo backend'
);

reset role;
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '90000000-0000-4000-8000-000000000001';

select lives_ok(
  $$
    select public.rpc_admin_unlink_knowledge_article_from_ticket(
      '90000000-0000-4000-8000-100000000001',
      '90000000-0000-4000-8000-700000000001'
    )
  $$,
  'admin arquiva vínculo ticket-linked usado na busca contextual'
);

reset role;
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '90000000-0000-4000-8000-000000000002';

select is(
  pg_temp.safe_bigint(
    $$select count(*)
      from public.rpc_customer_search_knowledge_articles(
        '90000000-0000-4000-8000-100000000001',
        'webhook',
        null,
        'ticket_linked',
        '90000000-0000-4000-8000-600000000001',
        12,
        0
      )$$
  ),
  0::bigint,
  'ticket_linked arquivado deixa de aparecer na busca contextual'
);

reset role;
set local role anon;
set local request.jwt.claim.role = 'anon';
reset request.jwt.claim.sub;

select is(
  pg_temp.safe_bigint(
    $$select count(*)
      from public.rpc_public_search_knowledge_articles('genius', 'sem acesso', 10)$$
  ),
  0::bigint,
  'busca pública não retorna artigo autenticado do portal'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.rpc_customer_search_knowledge_articles(uuid,text,text,text,uuid,integer,integer)',
    'EXECUTE'
  ),
  'anon não recebe execute na RPC customer-facing de busca'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

select * from finish();

rollback;
