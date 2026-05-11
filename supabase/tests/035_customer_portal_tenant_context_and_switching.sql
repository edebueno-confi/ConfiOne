create extension if not exists pgtap with schema extensions;

begin;

select plan(28);

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
    '71000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'portal-switch-admin@local',
    crypt('password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Portal Switch Admin"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '71000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'portal-switch-multi@local',
    crypt('password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Portal Switch Multi"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '71000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'portal-switch-single@local',
    crypt('password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Portal Switch Single"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  )
on conflict (id) do nothing;

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values (
  '71000000-0000-4000-8000-000000000001',
  'platform_admin',
  '71000000-0000-4000-8000-000000000001',
  '71000000-0000-4000-8000-000000000001'
)
on conflict do nothing;

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
  (
    '71000000-0000-4000-8000-100000000001',
    'portal-switch-tenant-a',
    'Portal Switch Tenant A LTDA',
    'Portal Switch Tenant A',
    'active',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    '71000000-0000-4000-8000-100000000002',
    'portal-switch-tenant-b',
    'Portal Switch Tenant B LTDA',
    'Portal Switch Tenant B',
    'active',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    '71000000-0000-4000-8000-100000000003',
    'portal-switch-tenant-c',
    'Portal Switch Tenant C LTDA',
    'Portal Switch Tenant C',
    'active',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  )
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
  (
    '71000000-0000-4000-8000-200000000001',
    '71000000-0000-4000-8000-100000000001',
    '71000000-0000-4000-8000-000000000002',
    'customer_manager',
    'active',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    '71000000-0000-4000-8000-200000000002',
    '71000000-0000-4000-8000-100000000002',
    '71000000-0000-4000-8000-000000000002',
    'customer_manager',
    'active',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    '71000000-0000-4000-8000-200000000003',
    '71000000-0000-4000-8000-100000000003',
    '71000000-0000-4000-8000-000000000002',
    'customer_manager',
    'active',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    '71000000-0000-4000-8000-200000000004',
    '71000000-0000-4000-8000-100000000001',
    '71000000-0000-4000-8000-000000000003',
    'customer_user',
    'active',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  )
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
  (
    '71000000-0000-4000-8000-300000000001',
    '71000000-0000-4000-8000-100000000001',
    '71000000-0000-4000-8000-000000000002',
    'Portal Switch Multi',
    'portal-switch-multi@local',
    true,
    true,
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    '71000000-0000-4000-8000-300000000002',
    '71000000-0000-4000-8000-100000000002',
    '71000000-0000-4000-8000-000000000002',
    'Portal Switch Multi',
    'portal-switch-multi@local',
    true,
    true,
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    '71000000-0000-4000-8000-300000000003',
    '71000000-0000-4000-8000-100000000003',
    '71000000-0000-4000-8000-000000000002',
    'Portal Switch Multi',
    'portal-switch-multi@local',
    true,
    true,
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    '71000000-0000-4000-8000-300000000004',
    '71000000-0000-4000-8000-100000000001',
    '71000000-0000-4000-8000-000000000003',
    'Portal Switch Single',
    'portal-switch-single@local',
    false,
    true,
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  )
on conflict (id) do nothing;

insert into public.customer_account_profiles (
  tenant_id,
  product_line,
  operational_status,
  account_tier,
  created_by_user_id,
  updated_by_user_id
)
values
  (
    '71000000-0000-4000-8000-100000000001',
    'genius_returns',
    'active',
    'Enterprise',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    '71000000-0000-4000-8000-100000000002',
    'after_sale',
    'limited',
    'Growth',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  )
on conflict (tenant_id) do nothing;

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
    '71000000-0000-4000-8000-100000000001',
    'returns_portal',
    true,
    'contract',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    '71000000-0000-4000-8000-100000000002',
    'returns_portal',
    true,
    'contract',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    '71000000-0000-4000-8000-100000000003',
    'returns_portal',
    false,
    'contract',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  )
on conflict (tenant_id, lower(feature_key)) do update
set
  enabled = excluded.enabled,
  source = excluded.source,
  updated_by_user_id = excluded.updated_by_user_id;

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
  (
    '71000000-0000-4000-8000-400000000001',
    '71000000-0000-4000-8000-100000000001',
    '71000000-0000-4000-8000-300000000001',
    'Ticket do tenant A',
    'Caso do tenant A para validar isolamento no portal.',
    'portal',
    '71000000-0000-4000-8000-000000000002',
    '71000000-0000-4000-8000-000000000002'
  ),
  (
    '71000000-0000-4000-8000-400000000002',
    '71000000-0000-4000-8000-100000000002',
    '71000000-0000-4000-8000-300000000002',
    'Ticket do tenant B',
    'Caso do tenant B para validar troca de contexto ativo.',
    'portal',
    '71000000-0000-4000-8000-000000000002',
    '71000000-0000-4000-8000-000000000002'
)
on conflict (id) do nothing;

insert into public.ticket_attachments (
  id,
  tenant_id,
  ticket_id,
  visibility,
  storage_bucket,
  storage_object_path,
  file_name,
  content_type,
  byte_size,
  uploaded_by_user_id,
  status
)
values (
  '71000000-0000-4000-8000-450000000001',
  '71000000-0000-4000-8000-100000000001',
  '71000000-0000-4000-8000-400000000001',
  'customer',
  'ticket-evidence',
  'customer/tenant-a/evidencia-a.pdf',
  'evidencia-a.pdf',
  'application/pdf',
  2048,
  '71000000-0000-4000-8000-000000000002',
  'available'
)
on conflict (id) do nothing;

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
  (
    '71000000-0000-4000-8000-500000000001',
    (select id from public.knowledge_spaces where slug = 'genius'),
    'restricted',
    'Portal Switch Tenant A',
    'portal-switch-tenant-a',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    '71000000-0000-4000-8000-500000000002',
    (select id from public.knowledge_spaces where slug = 'genius'),
    'restricted',
    'Portal Switch Tenant B',
    'portal-switch-tenant-b',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  )
on conflict (id) do nothing;

insert into public.knowledge_articles (
  id,
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
  (
    '71000000-0000-4000-8000-600000000001',
    '71000000-0000-4000-8000-500000000001',
    'restricted',
    'published',
    'Artigo autenticado tenant A',
    'artigo-autenticado-tenant-a',
    'Resumo do tenant A.',
    'Conteúdo aprovado do tenant A.',
    timezone('utc', now()),
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    '71000000-0000-4000-8000-600000000002',
    '71000000-0000-4000-8000-500000000002',
    'restricted',
    'published',
    'Artigo autenticado tenant B',
    'artigo-autenticado-tenant-b',
    'Resumo do tenant B.',
    'Conteúdo aprovado do tenant B.',
    timezone('utc', now()),
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  )
on conflict (id) do nothing;

insert into public.knowledge_article_entitlements (
  id,
  tenant_id,
  article_id,
  entitlement_scope,
  status,
  relation_reason,
  created_by_user_id,
  updated_by_user_id
)
values
  (
    '71000000-0000-4000-8000-700000000001',
    '71000000-0000-4000-8000-100000000001',
    '71000000-0000-4000-8000-600000000001',
    'customer_portal',
    'active',
    'Liberado para o tenant A.',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    '71000000-0000-4000-8000-700000000002',
    '71000000-0000-4000-8000-100000000002',
    '71000000-0000-4000-8000-600000000002',
    'customer_portal',
    'active',
    'Liberado para o tenant B.',
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000001'
  )
on conflict (tenant_id, article_id, entitlement_scope) where archived_at is null do nothing;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '71000000-0000-4000-8000-000000000003';

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_available_tenants
  ),
  1,
  'customer com um tenant recebe apenas um contexto disponivel'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '71000000-0000-4000-8000-000000000002';

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_available_tenants
  ),
  2,
  'customer multi-tenant lista apenas tenants habilitados no portal'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_available_tenants
    where tenant_id = '71000000-0000-4000-8000-100000000003'
  ),
  0,
  'tenant sem portal habilitado nao aparece como opcao ativa'
);

select is(
  (
    select tenant_id
    from public.vw_customer_portal_auth_context
  ),
  '71000000-0000-4000-8000-100000000001'::uuid,
  'fallback inicial escolhe o tenant alfabeticamente mais estavel quando nao ha preferencia'
);

select is(
  (
    select context_version
    from public.vw_customer_portal_active_tenant_context
  ),
  '1970-01-01 00:00:00+00'::timestamptz,
  'context_version usa fallback estavel enquanto nao existe preferencia persistida'
);

select lives_ok(
  $$
    select public.rpc_customer_set_active_tenant('71000000-0000-4000-8000-100000000002')
  $$,
  'customer seleciona tenant permitido por RPC'
);

select is(
  (
    select tenant_id
    from public.vw_customer_portal_active_tenant_context
  ),
  '71000000-0000-4000-8000-100000000002'::uuid,
  'tenant ativo muda para o tenant selecionado'
);

select isnt(
  (
    select context_version
    from public.vw_customer_portal_active_tenant_context
  ),
  '1970-01-01 00:00:00+00'::timestamptz,
  'context_version muda depois do primeiro switch persistido'
);

select throws_ok(
  $$
    select public.rpc_customer_set_active_tenant('71000000-0000-4000-8000-100000000003')
  $$,
  'P0001',
  'rpc_customer_set_active_tenant denied',
  'customer nao seleciona tenant sem portal habilitado'
);

select throws_ok(
  $$
    select public.rpc_customer_set_active_tenant('71000000-0000-4000-8000-199999999999')
  $$,
  'P0001',
  'rpc_customer_set_active_tenant denied',
  'customer nao seleciona tenant fora do proprio escopo'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_list
    where tenant_id = '71000000-0000-4000-8000-100000000002'
  ),
  1,
  'lista de tickets respeita o tenant ativo apos o switch'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_list
    where tenant_id = '71000000-0000-4000-8000-100000000001'
  ),
  0,
  'tickets do tenant anterior deixam de aparecer apos o switch'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_detail
    where ticket_id = '71000000-0000-4000-8000-400000000001'
  ),
  0,
  'ticket detail cross-tenant fica bloqueado pelo tenant ativo'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_detail
    where ticket_id = '71000000-0000-4000-8000-400000000002'
  ),
  1,
  'ticket detail do tenant ativo permanece acessivel'
);

select is(
  (
    select count(*)::integer
    from public.rpc_customer_search_knowledge_articles(
      '71000000-0000-4000-8000-100000000002',
      'tenant B',
      null,
      'all',
      null,
      12,
      0
    )
  ),
  1,
  'busca autenticada respeita o tenant ativo selecionado'
);

select throws_ok(
  $$
    select public.rpc_customer_search_knowledge_articles(
      '71000000-0000-4000-8000-100000000001',
      'tenant A',
      null,
      'all',
      null,
      12,
      0
    )
  $$,
  'P0001',
  'rpc_customer_search_knowledge_articles denied',
  'busca bloqueia explicitamente o tenant anterior quando o ativo e outro'
);

select throws_ok(
  $$
    select public.rpc_customer_search_knowledge_articles(
      '71000000-0000-4000-8000-100000000003',
      'tenant C',
      null,
      'all',
      null,
      12,
      0
    )
  $$,
  'P0001',
  'rpc_customer_search_knowledge_articles denied',
  'busca nega tenant nao habilitado no portal'
);

select throws_ok(
  $$
    select public.rpc_customer_create_ticket(
      '71000000-0000-4000-8000-100000000001',
      'Ticket stale tenant A',
      'Nao deve criar apos trocar para o tenant B.'
    )
  $$,
  'P0001',
  'rpc_customer_create_ticket denied',
  'criacao de ticket com tenant anterior e bloqueada apos o switch'
);

select throws_ok(
  $$
    select public.rpc_customer_add_ticket_message(
      '71000000-0000-4000-8000-400000000001',
      'Tentativa stale de resposta'
    )
  $$,
  'P0001',
  'rpc_customer_add_ticket_message denied',
  'mensagem em ticket do tenant anterior e bloqueada apos o switch'
);

select throws_ok(
  $$
    select public.rpc_customer_create_ticket_attachment_upload(
      '71000000-0000-4000-8000-400000000001',
      '71000000-0000-4000-8000-100000000001',
      'evidencia-stale.pdf',
      'application/pdf',
      1024
    )
  $$,
  'P0001',
  'rpc_customer_create_ticket_attachment_upload denied',
  'upload de evidencia no tenant anterior e bloqueado apos o switch'
);

select throws_ok(
  $$
    select public.rpc_customer_get_attachment_download_url(
      '71000000-0000-4000-8000-450000000001'
    )
  $$,
  'P0001',
  'rpc_customer_get_attachment_download_url denied',
  'download de evidencia do tenant anterior e bloqueado apos o switch'
);

select throws_ok(
  $$
    select public.rpc_customer_acknowledge_ticket_update(
      '71000000-0000-4000-8000-400000000001',
      null
    )
  $$,
  'P0001',
  'rpc_customer_acknowledge_ticket_update denied',
  'ack em ticket do tenant anterior e bloqueado apos o switch'
);

select throws_ok(
  $$
    select public.rpc_customer_confirm_ticket_resolved(
      '71000000-0000-4000-8000-400000000001'
    )
  $$,
  'P0001',
  'rpc_customer_confirm_ticket_resolved denied',
  'confirmacao de resolucao no tenant anterior e bloqueada apos o switch'
);

select throws_ok(
  $$
    select public.rpc_customer_request_ticket_reopen(
      '71000000-0000-4000-8000-400000000001',
      'Tentativa stale de reabertura'
    )
  $$,
  'P0001',
  'rpc_customer_request_ticket_reopen denied',
  'reabertura no tenant anterior e bloqueada apos o switch'
);

select throws_ok(
  $$
    insert into public.customer_portal_user_preferences (
      user_id,
      active_tenant_id,
      created_by_user_id,
      updated_by_user_id
    )
    values (
      '71000000-0000-4000-8000-000000000002',
      '71000000-0000-4000-8000-100000000001',
      '71000000-0000-4000-8000-000000000002',
      '71000000-0000-4000-8000-000000000002'
    )
  $$,
  '42501',
  'permission denied for table customer_portal_user_preferences',
  'authenticated nao faz DML direto na preferencia de tenant ativo'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '71000000-0000-4000-8000-000000000001';

select ok(
  (
    select count(*)::integer
    from audit.audit_logs
    where entity_table = 'customer_portal_user_preferences'
      and actor_user_id = '71000000-0000-4000-8000-000000000002'
  ) >= 1,
  'troca de tenant ativo gera audit_log pela tabela de preferencias'
);

select is(
  (
    select count(*)::integer
    from public.vw_admin_auth_context
  ),
  1,
  'contexto administrativo segue isolado do tenant ativo customer-facing'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_available_tenants
  ),
  0,
  'platform_admin sem membership customer-facing nao recebe tenant ativo do portal'
);

select * from finish();
rollback;
