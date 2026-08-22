create extension if not exists pgtap with schema extensions;

begin;

select plan(24);

select has_table(
  'public',
  'customer_account_groups',
  'tabela de agrupamentos internos de clientes existe'
);

select has_table(
  'public',
  'customer_account_group_members',
  'tabela de membros de agrupamento existe'
);

select has_view(
  'public',
  'vw_admin_customer_account_groups_list',
  'read model de lista de agrupamentos existe'
);

select is(
  (select release_enabled from public.internal_screen_catalog where screen_key = 'tenants'),
  true,
  'Central de Clientes esta publicada no catalogo de telas'
);

select is(
  (select count(*)::integer from public.internal_screen_capability_requirements where screen_key = 'tenants' and capability_key = 'screen.tenants.view'),
  1,
  'Central de Clientes possui capacidade de leitura explicita'
);

select has_view(
  'public',
  'vw_admin_customer_account_group_detail',
  'read model de detalhe de agrupamento existe'
);

select has_view(
  'public',
  'vw_admin_tenant_group_context',
  'read model de contexto de grupo por tenant existe'
);

select has_function(
  'public',
  'rpc_admin_create_customer_account_group',
  'RPC de criacao de agrupamento existe'
);

select has_function(
  'public',
  'rpc_admin_add_customer_account_group_member',
  'RPC de vinculo de membro existe'
);

select has_function(
  'public',
  'rpc_admin_archive_customer_account_group_member',
  'RPC de arquivamento de membro existe'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.customer_account_groups'::regclass),
  'agrupamentos possuem RLS'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.customer_account_group_members'::regclass),
  'membros de agrupamento possuem RLS'
);

select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'customer_account_groups'),
  2,
  'agrupamentos possuem politicas de leitura e escrita'
);

select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'customer_account_group_members'),
  2,
  'membros possuem politicas de leitura e escrita'
);

select has_column('public', 'customer_account_groups', 'group_type', 'grupo declara o tipo de relacionamento');
select has_column('public', 'customer_account_group_members', 'member_kind', 'membro declara se e tenant ou marca');
select has_column('public', 'customer_account_group_members', 'relationship', 'membro declara a relacao operacional');
select has_column('public', 'customer_account_group_members', 'source_system', 'membro preserva a origem do vinculo');
select has_column('public', 'customer_account_group_members', 'source_external_id', 'membro preserva a chave externa sem escrita externa');

select is(
  (select count(*)::integer from information_schema.role_table_grants where table_schema = 'public' and table_name = 'customer_account_groups' and grantee = 'anon'),
  0,
  'anon nao recebe acesso direto aos agrupamentos'
);

select is(
  (select count(*)::integer from information_schema.role_table_grants where table_schema = 'public' and table_name = 'customer_account_group_members' and grantee = 'anon'),
  0,
  'anon nao recebe acesso direto aos membros'
);

select is(
  (select count(*)::integer from information_schema.role_routine_grants where routine_schema = 'public' and routine_name like 'rpc_admin_%customer_account_group%' and grantee = 'authenticated'),
  3,
  'as tres RPCs sao executaveis por authenticated'
);

select is(
  (select count(*)::integer from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'rpc_admin_%customer_account_group%' and p.prosecdef),
  3,
  'as tres RPCs executam como security definer'
);

select is(
  (select count(*)::integer from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('vw_admin_customer_account_groups_list', 'vw_admin_customer_account_group_detail', 'vw_admin_tenant_group_context') and 'security_barrier=true' = any(coalesce(c.reloptions, array[]::text[]))),
  3,
  'os tres read models usam security barrier'
);

select * from finish();
rollback;
