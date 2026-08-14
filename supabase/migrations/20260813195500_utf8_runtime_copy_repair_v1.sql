-- Corrige mensagens mojibake que já estavam materializadas em funções ativas.
-- Migrations históricas permanecem imutáveis; esta correção é forward-only.

do $$
declare
  v_definition text;
  v_repaired text;
begin
  select pg_get_functiondef(p.oid)
    into v_definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'rpc_analytics_finance_snapshot'
    and pg_get_function_identity_arguments(p.oid) = 'p_from date, p_to date, p_status text, p_aging_bucket text, p_client_query text';

  if v_definition is null then
    raise exception 'rpc_analytics_finance_snapshot definition not found';
  end if;

  v_repaired := v_definition;
  v_repaired := replace(v_repaired, U&'A integra\00c3\00a7\00c3\00a3o OMIE n\00c3\00a3o est\00c3\00a1 configurada.', 'A integração OMIE não está configurada.');
  v_repaired := replace(v_repaired, U&'A sincroniza\00c3\00a7\00c3\00a3o OMIE est\00c3\00a1 em andamento.', 'A sincronização OMIE está em andamento.');
  v_repaired := replace(v_repaired, U&'A \00c3\00baltima sincroniza\00c3\00a7\00c3\00a3o OMIE falhou.', 'A última sincronização OMIE falhou.');
  v_repaired := replace(v_repaired, U&'A sincroniza\00c3\00a7\00c3\00a3o OMIE respondeu sem registros v\00c3\00a1lidos.', 'A sincronização OMIE respondeu sem registros válidos.');
  v_repaired := replace(v_repaired, U&'O \00c3\00baltimo snapshot OMIE v\00c3\00a1lido est\00c3\00a1 desatualizado.', 'O último snapshot OMIE válido está desatualizado.');
  v_repaired := replace(v_repaired, U&'Snapshot OMIE v\00c3\00a1lido dispon\00c3\00advel.', 'Snapshot OMIE válido disponível.');

  if v_repaired = v_definition then
    raise exception 'rpc_analytics_finance_snapshot had no mojibake replacements';
  end if;

  execute v_repaired;
end;
$$;

do $$
declare
  v_definition text;
  v_repaired text;
begin
  select pg_get_functiondef(p.oid)
    into v_definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'rpc_analytics_customer_success_kpis_v2'
    and pg_get_function_identity_arguments(p.oid) = '';

  if v_definition is null then
    raise exception 'rpc_analytics_customer_success_kpis_v2 definition not found';
  end if;

  v_repaired := replace(v_definition, U&'Sem respons\00c3\00a1vel', 'Sem responsável');

  if v_repaired = v_definition then
    raise exception 'rpc_analytics_customer_success_kpis_v2 had no mojibake replacements';
  end if;

  execute v_repaired;
end;
$$;

comment on function public.rpc_analytics_finance_snapshot(date, date, text, text, text) is
  'Cockpit financeiro: somente snapshot OMIE API publicado; planilhas permanecem históricas e não são fallback. Expõe estado de configuração, execução, frescor e vazio.';

comment on function public.rpc_analytics_finance_unmatched_clients(text, integer) is
  'Clientes OMIE atuais sem empresa correspondente no HubSpot por CNPJ. Planilhas históricas não são fallback. Somente leitura.';
