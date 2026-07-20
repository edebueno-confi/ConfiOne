create extension if not exists pgtap with schema extensions;

begin;

select plan(14);

select ok(
  exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'analytics_spreadsheet_sources'
      and c.relkind = 'r'
  ),
  'tabela de fontes de planilha existe'
);

select ok(
  exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'analytics_spreadsheet_import_runs'
      and c.relkind = 'r'
  ),
  'tabela de execucoes de importacao existe'
);

select ok(
  exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'analytics_spreadsheet_rows'
      and c.relkind = 'r'
  ),
  'tabela de linhas brutas existe'
);

select ok(
  (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'analytics_spreadsheet_sources'),
  'RLS habilitado nas fontes'
);

select ok(
  (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'analytics_spreadsheet_import_runs'),
  'RLS habilitado nas execucoes'
);

select ok(
  (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'analytics_spreadsheet_rows'),
  'RLS habilitado nas linhas brutas'
);

select ok(
  has_table_privilege(
    'service_role'::name,
    'public.analytics_spreadsheet_import_runs'::text,
    'INSERT'::text
  ),
  'service_role pode registrar execucoes'
);

select ok(
  has_table_privilege(
    'service_role'::name,
    'public.analytics_spreadsheet_rows'::text,
    'INSERT'::text
  ),
  'service_role pode registrar linhas brutas'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'analytics_spreadsheet_sources'
      and policyname = 'analytics_spreadsheet_sources_admin_read'
  ),
  'fontes possuem politica de leitura autenticada'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'analytics_spreadsheet_import_runs'
      and policyname = 'analytics_spreadsheet_import_runs_admin_read'
  ),
  'execucoes possuem politica de leitura autenticada'
);

select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'analytics_spreadsheet_rows'
      and roles @> array['authenticated'::name]
  ),
  'linhas brutas nao possuem politica autenticada'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'analytics_spreadsheet_import_runs'
      and indexdef like '%source_id%file_sha256%mapping_version%'
      and indexdef like '%UNIQUE%'
  ),
  'execucoes possuem chave de idempotencia'
);

select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'analytics_spreadsheet_rows'
      and column_name = 'source_record_id'
  ),
  'linhas preservam identificador do registro de origem'
);

select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'analytics_spreadsheet_rows'
      and column_name = 'quality_status'
  ),
  'linhas preservam status de qualidade'
);

select * from finish();
rollback;
