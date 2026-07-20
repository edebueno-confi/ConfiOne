create extension if not exists pgtap with schema extensions;

begin;

select plan(12);

select ok(
  exists (select 1 from pg_extension where extname = 'supabase_vault'),
  'Supabase Vault está disponível'
);

select ok(
  exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'managed_integrations' and c.relkind = 'r'),
  'tabela de integrações gerenciadas existe'
);

select ok(
  (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'managed_integrations'),
  'RLS habilitado nas integrações gerenciadas'
);

select ok(
  exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'vw_admin_managed_integrations' and c.relkind = 'v'),
  'view administrativa de integrações existe'
);

select ok(
  exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'vw_admin_managed_integrations'
      and column_name = 'has_credentials'),
  'view expõe somente o estado da credencial'
);

select ok(
  not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'vw_admin_managed_integrations'
      and column_name = 'decrypted_secret'),
  'view não expõe segredo descriptografado'
);

select ok(
  has_function_privilege(
    'authenticated'::name,
    'public.rpc_admin_upsert_managed_integration(text,text,text,text,boolean,jsonb,text)'::text,
    'EXECUTE'::text
  ),
  'usuário autenticado pode chamar RPC administrativa (gate interno valida papel)'
);

select ok(
  not has_function_privilege('anon'::name, 'public.rpc_service_get_managed_integration_secret(text)'::text, 'EXECUTE'::text),
  'anon não pode ler segredo de integração'
);

select ok(
  has_function_privilege('service_role'::name, 'public.rpc_service_get_managed_integration_secret(text)'::text, 'EXECUTE'::text),
  'service_role pode ler segredo somente no backend'
);

select ok(
  (select count(*) from public.managed_integrations) >= 4,
  'fontes iniciais de integração foram registradas'
);

select ok(
  exists (select 1 from public.managed_integrations where integration_key = 'omie' and is_enabled = false),
  'Omie começa desabilitado até receber credencial'
);

select ok(
  exists (select 1 from public.managed_integrations where integration_key = 'hubspot' and provider = 'hubspot'),
  'HubSpot possui configuração gerenciada'
);

select * from finish();
rollback;
