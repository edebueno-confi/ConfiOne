-- Read models de KPI P0: contrato, coortes, estados de indisponibilidade e
-- golden fixtures de win rate, ciclo de vendas, backlog e aging.

begin;

select plan(28);

-- ---------------------------------------------------------------------------
-- Contrato de acesso
-- ---------------------------------------------------------------------------

select has_function('public', 'rpc_analytics_commercial_kpis_v2', 'read model comercial existe');
select has_function('public', 'rpc_analytics_support_kpis_v2', 'read model de suporte existe');
select has_function('public', 'rpc_analytics_customer_success_kpis_v2', 'read model de CS existe');
select has_function('public', 'rpc_analytics_executive_kpis_v2', 'resumo executivo existe');

select ok(
  not has_function_privilege('anon', 'public.rpc_analytics_commercial_kpis_v2(date, date, text, text)', 'EXECUTE'),
  'anônimo não lê KPIs comerciais'
);

select ok(
  not has_function_privilege('anon', 'public.rpc_analytics_customer_success_kpis_v2()', 'EXECUTE'),
  'anônimo não lê KPIs de carteira'
);

-- ---------------------------------------------------------------------------
-- Fixture comercial verificável à mão
-- ---------------------------------------------------------------------------
-- 3 ganhos e 1 perdido fechados dentro do período  → win rate 75,00%.
-- Valores ganhos 1000, 2000 e 9000                 → total 12000, mediana 2000.
-- Ciclos de 2, 4 e 30 dias                         → mediana 4,0 dias.
-- 2 negócios abertos, 5000 a 40% e 5000 a 60%      → ponderado 5000,00.
-- 1 ganho fora do período não pode entrar em nada.

insert into public.analytics_source_config (domain_key, object_type, hubspot_pipeline_id, label, is_active)
values ('commercial', 'deal', 'kpi-pipe', 'Pipeline de teste', true)
on conflict do nothing;

insert into public.hubspot_pipeline_stages (object_type, pipeline_id, stage_id, label, display_order, is_closed, is_won, metadata)
values
  ('deal', 'kpi-pipe', 'st-open-40', 'Aberto 40%', 1, false, false, '{"probability":"0.4","isClosed":false}'::jsonb),
  ('deal', 'kpi-pipe', 'st-open-60', 'Aberto 60%', 2, false, false, '{"probability":"0.6","isClosed":false}'::jsonb),
  ('deal', 'kpi-pipe', 'st-won',     'Ganho',      3, true,  true,  '{"probability":"1.0","isClosed":true}'::jsonb),
  ('deal', 'kpi-pipe', 'st-lost',    'Perdido',    4, true,  false, '{"probability":"0.0","isClosed":true}'::jsonb);

insert into public.hubspot_deals (deal_id, pipeline_id, dealstage, owner_id, amount_home, hs_created_at, hs_closed_at, synced_at)
values
  ('kd-open-1', 'kpi-pipe', 'st-open-40', 'kpi-owner', 5000, '2026-03-01', null, timezone('utc', now())),
  ('kd-open-2', 'kpi-pipe', 'st-open-60', 'kpi-owner', 5000, '2026-03-01', null, timezone('utc', now())),
  ('kd-won-1',  'kpi-pipe', 'st-won',     'kpi-owner', 1000, '2026-03-01', '2026-03-03', timezone('utc', now())),
  ('kd-won-2',  'kpi-pipe', 'st-won',     'kpi-owner', 2000, '2026-03-01', '2026-03-05', timezone('utc', now())),
  ('kd-won-3',  'kpi-pipe', 'st-won',     'kpi-owner', 9000, '2026-03-01', '2026-03-31', timezone('utc', now())),
  ('kd-lost-1', 'kpi-pipe', 'st-lost',    'kpi-owner', 4000, '2026-03-01', '2026-03-10', timezone('utc', now())),
  ('kd-out-1',  'kpi-pipe', 'st-won',     'kpi-owner', 99000, '2025-01-01', '2025-01-05', timezone('utc', now()));

create temporary table kpi_commercial as
select public.rpc_analytics_commercial_kpis_v2('2026-03-01', '2026-03-31', null, 'kpi-pipe') as payload;

select is(
  ((select payload from kpi_commercial) -> 'kpis' -> 'win_rate' ->> 'value')::numeric,
  75.00::numeric,
  'win rate usa a coorte de fechados no período: 3 de 4'
);

select is(
  ((select payload from kpi_commercial) -> 'kpis' -> 'won_amount' ->> 'value')::numeric,
  12000::numeric,
  'receita ganha ignora o negócio fechado fora do período'
);

select is(
  ((select payload from kpi_commercial) -> 'kpis' -> 'median_deal_amount' ->> 'value')::numeric,
  2000::numeric,
  'ticket mediano resiste ao valor extremo que distorce a média'
);

select is(
  ((select payload from kpi_commercial) -> 'kpis' -> 'avg_deal_amount' ->> 'value')::numeric,
  4000::numeric,
  'ticket médio é publicado como complemento da mediana'
);

select is(
  ((select payload from kpi_commercial) -> 'kpis' -> 'median_sales_cycle_days' ->> 'value')::numeric,
  4.0::numeric,
  'ciclo de vendas mediano usa fechamento menos criação dos ganhos'
);

select is(
  ((select payload from kpi_commercial) -> 'kpis' -> 'open_pipeline_amount' ->> 'value')::numeric,
  10000::numeric,
  'pipeline aberto é posição na data de corte, não recorte do período'
);

select is(
  ((select payload from kpi_commercial) -> 'kpis' -> 'weighted_pipeline_amount' ->> 'value')::numeric,
  5000::numeric,
  'pipeline ponderado multiplica valor pela probabilidade do estágio'
);

select is(
  ((select payload from kpi_commercial) -> 'kpis' -> 'created_deals' ->> 'value')::numeric,
  6::numeric,
  'negócios criados usam a data de criação, não a de fechamento'
);

select is(
  ((select payload from kpi_commercial) -> 'kpis' -> 'open_pipeline_amount' ->> 'basis'),
  'stage_open_now',
  'pipeline aberto declara a coorte de posição atual'
);

select is(
  ((select payload from kpi_commercial) -> 'kpis' -> 'win_rate' ->> 'basis'),
  'deal_closed_at',
  'win rate declara a coorte de fechamento'
);

select is(
  ((select payload from kpi_commercial) -> 'kpis' -> 'stage_aging_days' ->> 'state'),
  'awaiting_history',
  'tempo em estágio fica aguardando histórico em vez de exibir número falso'
);

-- Período sem nenhum negócio fechado não pode inventar win rate.
select is(
  (public.rpc_analytics_commercial_kpis_v2('2026-06-01', '2026-06-30', null, 'kpi-pipe')
    -> 'kpis' -> 'win_rate' ->> 'state'),
  'unavailable',
  'período sem fechamento devolve indisponível em vez de 0%'
);

select is(
  (public.rpc_analytics_commercial_kpis_v2('2026-06-01', '2026-06-30', null, 'kpi-pipe')
    -> 'kpis' -> 'win_rate' ->> 'reason'),
  'no_closed_deals_in_period',
  'a ausência de coorte é comunicada por código estável'
);

-- ---------------------------------------------------------------------------
-- Fixture de suporte
-- ---------------------------------------------------------------------------
-- 2 tickets abertos e 1 em estágio fechado, nenhum com data de fechamento,
-- reproduzindo a realidade da conta.

insert into public.analytics_source_config (domain_key, object_type, hubspot_pipeline_id, label, is_active)
values ('cs', 'ticket', 'kpi-tpipe', 'Suporte de teste', true)
on conflict do nothing;

insert into public.hubspot_pipeline_stages (object_type, pipeline_id, stage_id, label, display_order, is_closed, is_won, metadata)
values
  ('ticket', 'kpi-tpipe', 'ts-open',   'Novo',      1, false, false, '{"ticketState":"OPEN","isClosed":false}'::jsonb),
  ('ticket', 'kpi-tpipe', 'ts-closed', 'Resolvido', 2, true,  false, '{"ticketState":"CLOSED","isClosed":true}'::jsonb);

insert into public.hubspot_tickets (ticket_id, pipeline_id, pipeline_stage, owner_id, source_type, priority, hs_created_at, hs_closed_at, synced_at)
values
  ('kt-1', 'kpi-tpipe', 'ts-open',   'kpi-owner', 'EMAIL', 'HIGH',   timezone('utc', now()) - interval '2 hours', null, timezone('utc', now())),
  ('kt-2', 'kpi-tpipe', 'ts-open',   'kpi-owner', 'CHAT',  'MEDIUM', timezone('utc', now()) - interval '10 days', null, timezone('utc', now())),
  ('kt-3', 'kpi-tpipe', 'ts-closed', 'kpi-owner', 'EMAIL', 'LOW',    timezone('utc', now()) - interval '30 days', null, timezone('utc', now()));

create temporary table kpi_support as
select public.rpc_analytics_support_kpis_v2(
  (timezone('utc', now()) - interval '60 days')::date,
  (timezone('utc', now()))::date,
  'kpi-tpipe',
  null
) as payload;

select is(
  ((select payload from kpi_support) -> 'kpis' -> 'open_backlog' ->> 'value')::numeric,
  2::numeric,
  'backlog conta somente estágios com ticketState OPEN'
);

select is(
  ((select payload from kpi_support) -> 'kpis' -> 'created_tickets' ->> 'value')::numeric,
  3::numeric,
  'tickets recebidos usam a data de criação, incluindo os já encerrados'
);

select is(
  ((select payload from kpi_support) -> 'kpis' -> 'resolved_tickets' ->> 'state'),
  'unavailable',
  'tickets resolvidos ficam indisponíveis sem data de fechamento na origem'
);

select is(
  ((select payload from kpi_support) -> 'kpis' -> 'resolved_tickets' ->> 'reason'),
  'ticket_close_date_missing',
  'o motivo do bloqueio de resolvidos é rastreável'
);

select is(
  ((select payload from kpi_support) -> 'kpis' -> 'median_time_to_resolution_days' ->> 'value'),
  null,
  'tempo de resolução não devolve valor derivado de data ausente'
);

select is(
  ((select payload from kpi_support) -> 'kpis' -> 'first_response_sla_coverage_percent' ->> 'state'),
  'unavailable',
  'SLA sem nenhum registro preenchido é indisponível, não 0%'
);

select is(
  (select count(*)::integer
   from jsonb_array_elements((select payload from kpi_support) -> 'aging') a
   where a ->> 'bucket' = '< 4h'),
  1,
  'aging do backlog classifica o ticket recente no primeiro bucket'
);

select ok(
  (select payload from kpi_support) -> 'meta' -> 'warning_codes' @> '["ticket_close_date_missing"]'::jsonb,
  'a limitação da fonte é declarada nos metadados de confiabilidade'
);

select is(
  ((select payload from kpi_support) -> 'source_coverage' ->> 'closed_with_date')::integer,
  0,
  'a cobertura real de data de fechamento é publicada para auditoria'
);

select * from finish();
rollback;
