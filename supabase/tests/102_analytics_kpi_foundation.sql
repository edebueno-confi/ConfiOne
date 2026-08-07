-- Fundação de KPI: configuração, base canônica de clientes e snapshot histórico.
-- Golden fixtures verificáveis manualmente para cliente ativo, MRR e ligação
-- HubSpot ↔ OMIE por CNPJ normalizado.

begin;

select plan(24);

-- ---------------------------------------------------------------------------
-- Estrutura
-- ---------------------------------------------------------------------------

select has_table('public', 'analytics_kpi_settings', 'tabela de configuração de KPI existe');
select has_table('public', 'analytics_kpi_daily_snapshot', 'tabela de snapshot diário existe');
select has_view('public', 'vw_analytics_customer_base', 'base canônica de clientes existe');
select has_view('public', 'vw_analytics_customer_financial_link', 'ligação HubSpot↔OMIE existe');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.analytics_kpi_settings'::regclass),
  'configuração de KPI tem RLS habilitada'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.analytics_kpi_daily_snapshot'::regclass),
  'snapshot diário tem RLS habilitada'
);

-- A configuração é decisão de negócio: nunca gravável pelo usuário autenticado.
select ok(
  not has_table_privilege('authenticated', 'public.analytics_kpi_settings', 'UPDATE'),
  'usuário autenticado não altera a decisão de MRR ou de cliente ativo'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.rpc_service_capture_analytics_kpi_snapshot(date)',
    'EXECUTE'
  ),
  'captura de snapshot é restrita ao service_role'
);

-- ---------------------------------------------------------------------------
-- Contrato da configuração
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::integer from public.analytics_kpi_settings),
  1,
  'configuração de KPI é linha única'
);

select throws_ok(
  $$ update public.analytics_kpi_settings set mrr_source = 'PLANILHA' where id $$,
  '23514',
  null,
  'fonte de MRR fora do domínio permitido é rejeitada'
);

select throws_ok(
  $$ update public.analytics_kpi_settings set active_customer_rule = 'CHUTE' where id $$,
  '23514',
  null,
  'regra de cliente ativo fora do domínio permitido é rejeitada'
);

select throws_ok(
  $$ insert into public.analytics_kpi_settings (id, mrr_source) values (false, 'UNRESOLVED') $$,
  '23514',
  null,
  'não é possível criar uma segunda linha de configuração'
);

-- ---------------------------------------------------------------------------
-- Divisão por zero e nulos
-- ---------------------------------------------------------------------------

select is(app_private.kpi_ratio(5, 0), null, 'denominador zero devolve nulo, não zero');
select is(app_private.kpi_ratio(5, null), null, 'denominador nulo devolve nulo');
select is(app_private.kpi_ratio(0, 10), 0::numeric, 'numerador zero com denominador válido devolve zero real');
select is(app_private.kpi_ratio(48, 396), 12.12::numeric, 'percentual usa duas casas decimais');

select is(
  app_private.kpi_entry(null, 'deal_closed_at') ->> 'state',
  'unavailable',
  'valor nulo nunca é apresentado como disponível'
);

select is(
  app_private.kpi_entry(10, 'deal_closed_at', 'awaiting_history', 'history_insufficient') ->> 'value',
  null,
  'KPI aguardando histórico não vaza valor parcial'
);

select is(
  app_private.kpi_entry(10, 'deal_closed_at') ->> 'basis',
  'deal_closed_at',
  'todo KPI declara qual data define a coorte'
);

-- ---------------------------------------------------------------------------
-- Golden fixture: cliente ativo, MRR e ligação financeira
-- ---------------------------------------------------------------------------

update public.analytics_kpi_settings
set mrr_source = 'HUBSPOT_RECURRING_REVENUE',
    active_customer_rule = 'HUBSPOT_CLIENT_STATUS'
where id;

insert into public.hubspot_companies (company_id, name, tax_id, mrr, client_status, contract_status, synced_at)
values
  ('kpi-fixture-1', 'Cliente Ativo Com MRR', '11.222.333/0001-44', 1000, 'Cliente', 'Vigente', timezone('utc', now())),
  ('kpi-fixture-2', 'Cliente Ativo Sem MRR', '55.666.777/0001-88', 0, 'Cliente', 'Vigente', timezone('utc', now())),
  ('kpi-fixture-3', 'Empresa Em Churn', '99.888.777/0001-66', 5000, 'Churn', 'Encerrado', timezone('utc', now())),
  ('kpi-fixture-4', 'Prospect Sem Status', '12.121.212/0001-12', 0, null, null, timezone('utc', now()))
on conflict (company_id) do nothing;

insert into public.analytics_finance_receivables (
  id, source_key, source_record_id, client_name, client_tax_id,
  net_amount, received_amount, balance, due_date, is_current, is_cancelled, created_at, updated_at
)
values
  (gen_random_uuid(), 'kpi_fixture', 'kpi-title-1', 'Cliente Ativo Com MRR', '11222333000144',
   700, 0, 700, current_date - 45, true, false, timezone('utc', now()), timezone('utc', now())),
  (gen_random_uuid(), 'kpi_fixture', 'kpi-title-2', 'Cliente Ativo Com MRR', '11222333000144',
   300, 0, 300, current_date + 10, true, false, timezone('utc', now()), timezone('utc', now())),
  (gen_random_uuid(), 'kpi_fixture', 'kpi-title-3', 'Empresa Em Churn', '99888777000166',
   900, 0, 900, current_date - 5, true, true, timezone('utc', now()), timezone('utc', now()));

select is(
  (select is_active_customer from public.vw_analytics_customer_base where company_id = 'kpi-fixture-1'),
  true,
  'empresa com status Cliente é cliente ativo'
);

select is(
  (select is_active_customer from public.vw_analytics_customer_base where company_id = 'kpi-fixture-3'),
  false,
  'empresa em Churn não é cliente ativo'
);

-- MRR zero na origem é ausência de recorrência, não recorrência de zero.
select is(
  (select mrr from public.vw_analytics_customer_base where company_id = 'kpi-fixture-2'),
  null,
  'MRR zero na origem aparece como ausente, não como zero'
);

select is(
  (select open_balance from public.vw_analytics_customer_financial_link where company_id = 'kpi-fixture-1'),
  1000::numeric,
  'títulos em aberto somam pelo CNPJ normalizado, com ou sem máscara'
);

select is(
  (select overdue_balance from public.vw_analytics_customer_financial_link where company_id = 'kpi-fixture-1'),
  700::numeric,
  'somente o título vencido entra no saldo vencido'
);

-- Título cancelado não pode contaminar a inadimplência.
select is(
  (select overdue_balance from public.vw_analytics_customer_financial_link where company_id = 'kpi-fixture-3'),
  0::numeric,
  'título cancelado é excluído do saldo vencido'
);

select * from finish();
rollback;
