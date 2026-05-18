create extension if not exists pgtap with schema extensions;

begin;

select plan(29);

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
  ('00000000-0000-0000-0000-000000000000', '10101010-1010-4101-8101-101010101010', 'authenticated', 'authenticated', 'internal-docs-admin@test.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Internal Docs Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '20202020-2020-4202-8202-202020202020', 'authenticated', 'authenticated', 'internal-docs-customer@test.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Internal Docs Customer"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '30303030-3030-4303-8303-303030303030', 'authenticated', 'authenticated', 'internal-docs-plain@test.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Internal Docs Plain"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values (
  '10101010-1010-4101-8101-101010101010',
  'platform_admin',
  '10101010-1010-4101-8101-101010101010',
  '10101010-1010-4101-8101-101010101010'
);

select ok(
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name = 'internal_documents'
  ),
  'internal_documents existe'
);

select ok(
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name = 'internal_document_versions'
  ),
  'internal_document_versions existe'
);

select ok(
  exists (
    select 1 from information_schema.views
    where table_schema = 'public'
      and table_name = 'vw_internal_documents_catalog'
  ),
  'vw_internal_documents_catalog existe'
);

select ok(
  exists (
    select 1 from information_schema.views
    where table_schema = 'public'
      and table_name = 'vw_internal_document_detail'
  ),
  'vw_internal_document_detail existe'
);

select ok(
  not has_table_privilege('anon', 'public.internal_documents', 'SELECT'),
  'anon nao recebe SELECT na tabela base internal_documents'
);

select ok(
  not has_table_privilege('anon', 'public.vw_internal_documents_catalog', 'SELECT'),
  'anon nao recebe SELECT no catalogo contratual'
);

select ok(
  not has_table_privilege('authenticated', 'public.internal_documents', 'SELECT'),
  'authenticated nao possui SELECT direto em internal_documents'
);

select ok(
  not has_table_privilege('authenticated', 'public.internal_document_versions', 'SELECT'),
  'authenticated nao possui SELECT direto em internal_document_versions'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_internal_documents_catalog', 'SELECT'),
  'authenticated recebe SELECT apenas na view de catalogo'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_internal_document_detail', 'SELECT'),
  'authenticated recebe SELECT apenas na view de detalhe'
);

select ok(
  not has_table_privilege('authenticated', 'public.internal_documents', 'INSERT')
  and not has_table_privilege('authenticated', 'public.internal_documents', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.internal_documents', 'DELETE'),
  'authenticated nao possui DML direto em internal_documents'
);

select ok(
  not has_table_privilege('authenticated', 'public.internal_document_versions', 'INSERT')
  and not has_table_privilege('authenticated', 'public.internal_document_versions', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.internal_document_versions', 'DELETE'),
  'authenticated nao possui DML direto em internal_document_versions'
);

insert into public.internal_documents (
  id,
  slug,
  source_path,
  title,
  category,
  status,
  sensitivity,
  owner,
  surfaces,
  allow_inline_reader,
  description,
  archived_at
)
values
  ('40404040-4040-4404-8404-404040404001', 'published-doc', 'docs/PUBLISHED_DOC.md', 'Published Doc', 'Governança', 'published', 'internal', 'Engenharia', array['product-docs', 'build-journal'], true, 'Documento publicado para teste.', null),
  ('40404040-4040-4404-8404-404040404002', 'archived-doc', 'docs/ARCHIVED_DOC.md', 'Archived Doc', 'Governança', 'archived', 'internal', 'Engenharia', array['product-docs'], false, 'Documento arquivado para teste.', timezone('utc', now())),
  ('40404040-4040-4404-8404-404040404003', 'blocked-doc', 'docs/BLOCKED_DOC.md', 'Blocked Doc', 'Governança', 'blocked', 'restricted', 'Engenharia', array['product-docs'], false, 'Documento bloqueado para teste.', null);

insert into public.internal_document_versions (
  id,
  document_id,
  source_hash,
  body_md_sanitized,
  original_size_bytes,
  sanitized_size_bytes,
  version_number,
  validation_status,
  validation_warnings,
  published_at
)
values
  ('50505050-5050-4505-8505-505050505001', '40404040-4040-4404-8404-404040404001', repeat('a', 64), '# Published', 11, 12, 1, 'valid', '[]'::jsonb, timezone('utc', now())),
  ('50505050-5050-4505-8505-505050505002', '40404040-4040-4404-8404-404040404002', repeat('b', 64), '# Archived', 10, 11, 1, 'valid', '[]'::jsonb, timezone('utc', now())),
  ('50505050-5050-4505-8505-505050505003', '40404040-4040-4404-8404-404040404003', repeat('c', 64), '# Blocked', 9, 10, 1, 'blocked', '[{"id":"jwt","count":1}]'::jsonb, null);

update public.internal_documents
set
  current_version_id = case slug
    when 'published-doc' then '50505050-5050-4505-8505-505050505001'::uuid
    when 'archived-doc' then '50505050-5050-4505-8505-505050505002'::uuid
    when 'blocked-doc' then '50505050-5050-4505-8505-505050505003'::uuid
  end,
  archived_at = case
    when slug = 'archived-doc' then timezone('utc', now())
    else archived_at
  end;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '10101010-1010-4101-8101-101010101010';

select is(
  (select count(*)::integer from public.vw_internal_documents_catalog),
  1,
  'platform_admin le apenas documentos publicados e nao bloqueados no catalogo'
);

select is(
  (select body_md_sanitized from public.vw_internal_document_detail where slug = 'published-doc'),
  '# Published',
  'platform_admin le detalhe sanitizado do documento publicado'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '20202020-2020-4202-8202-202020202020';

select is(
  (select count(*)::integer from public.vw_internal_documents_catalog),
  0,
  'customer-facing sem platform_admin nao le catalogo interno'
);

select is(
  (select count(*)::integer from public.vw_internal_document_detail),
  0,
  'customer-facing sem platform_admin nao le detalhe interno'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '30303030-3030-4303-8303-303030303030';

select is(
  (select count(*)::integer from public.vw_internal_documents_catalog),
  0,
  'authenticated sem permissao nao le catalogo interno'
);

select throws_ok(
  $$
    insert into public.internal_documents (
      slug,
      source_path,
      title,
      category,
      status,
      sensitivity,
      owner,
      surfaces
    )
    values (
      'direct-insert',
      'docs/DIRECT_INSERT.md',
      'Direct Insert',
      'Governança',
      'published',
      'internal',
      'Engenharia',
      array['product-docs']
    )
  $$,
  '42501',
  'permission denied for table internal_documents',
  'DML direto em internal_documents permanece bloqueado para authenticated'
);

reset role;
reset request.jwt.claim.role;
reset request.jwt.claim.sub;

set local role anon;

select throws_ok(
  $$ select count(*) from public.vw_internal_documents_catalog $$,
  '42501',
  'permission denied for view vw_internal_documents_catalog',
  'anon nao acessa catalogo contratual'
);

reset role;

select throws_ok(
  $$
    insert into public.internal_documents (
      slug,
      source_path,
      title,
      category,
      status,
      sensitivity,
      owner,
      surfaces
    )
    values (
      'invalid-status',
      'docs/INVALID_STATUS.md',
      'Invalid Status',
      'Governança',
      'invalid',
      'internal',
      'Engenharia',
      array['product-docs']
    )
  $$,
  '23514',
  null,
  'constraint bloqueia status invalido'
);

select throws_ok(
  $$
    insert into public.internal_documents (
      slug,
      source_path,
      title,
      category,
      status,
      sensitivity,
      owner,
      surfaces
    )
    values (
      'invalid-sensitivity',
      'docs/INVALID_SENSITIVITY.md',
      'Invalid Sensitivity',
      'Governança',
      'published',
      'secret',
      'Engenharia',
      array['product-docs']
    )
  $$,
  '23514',
  null,
  'constraint bloqueia sensitivity invalida'
);

select throws_ok(
  $$
    insert into public.internal_document_versions (
      document_id,
      source_hash,
      body_md_sanitized,
      original_size_bytes,
      sanitized_size_bytes,
      version_number,
      validation_status
    )
    values (
      '40404040-4040-4404-8404-404040404001',
      repeat('d', 64),
      '# Invalid',
      9,
      10,
      2,
      'needs-review'
    )
  $$,
  '23514',
  null,
  'constraint bloqueia validation_status invalido'
);

select throws_ok(
  $$
    insert into public.internal_documents (
      slug,
      source_path,
      title,
      category,
      status,
      sensitivity,
      owner,
      surfaces
    )
    values (
      'published-doc',
      'docs/DUPLICATE_SLUG.md',
      'Duplicate Slug',
      'Governança',
      'published',
      'internal',
      'Engenharia',
      array['product-docs']
    )
  $$,
  '23505',
  null,
  'slug unico permanece garantido'
);

select throws_ok(
  $$
    insert into public.internal_documents (
      slug,
      source_path,
      title,
      category,
      status,
      sensitivity,
      owner,
      surfaces
    )
    values (
      'duplicate-source',
      'docs/PUBLISHED_DOC.md',
      'Duplicate Source',
      'Governança',
      'published',
      'internal',
      'Engenharia',
      array['product-docs']
    )
  $$,
  '23505',
  null,
  'source_path unico permanece garantido'
);

select throws_ok(
  $$
    insert into public.internal_documents (
      id,
      slug,
      source_path,
      title,
      category,
      status,
      sensitivity,
      owner,
      surfaces
    )
    values (
      '40404040-4040-4404-8404-404040404004',
      'cross-version-doc',
      'docs/CROSS_VERSION.md',
      'Cross Version',
      'Governança',
      'published',
      'internal',
      'Engenharia',
      array['product-docs']
    );

    update public.internal_documents
    set current_version_id = '50505050-5050-4505-8505-505050505001'
    where id = '40404040-4040-4404-8404-404040404004';

    set constraints internal_documents_current_version_integrity immediate;
  $$,
  'P0001',
  'current_version_id must reference a version from the same internal document',
  'current_version_id precisa apontar para versao do proprio documento'
);

select is(
  (
    select count(*)::integer
    from public.vw_internal_documents_catalog
    where slug in ('archived-doc', 'blocked-doc')
  ),
  0,
  'views nao expoem documentos archived ou blocked'
);

select is(
  (
    select count(*)::integer
    from public.vw_internal_document_detail
    where slug in ('archived-doc', 'blocked-doc')
  ),
  0,
  'detalhe nao expoe documentos archived ou blocked'
);

select ok(
  has_table_privilege('service_role', 'public.internal_documents', 'INSERT')
  and has_table_privilege('service_role', 'public.internal_document_versions', 'INSERT'),
  'service_role pode escrever via pipeline server-side controlado'
);

select ok(
  not has_table_privilege('authenticated', 'public.internal_documents', 'DELETE')
  and not has_table_privilege('service_role', 'public.internal_documents', 'DELETE'),
  'delete fisico nao foi concedido para authenticated nem service_role'
);

select *
from finish();

rollback;
