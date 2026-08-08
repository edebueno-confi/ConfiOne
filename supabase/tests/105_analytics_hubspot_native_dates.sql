-- Datas nativas do HubSpot: precedência sobre o histórico, conversão de unidade
-- e estado por cobertura. Golden fixtures verificáveis à mão.

begin;

select plan(22);

-- ---------------------------------------------------------------------------
-- Estrutura
-- ---------------------------------------------------------------------------

select has_column('public', 'hubspot_tickets', 'last_activity_at', 'ticket guarda a última atividade');
select has_column('public', 'hubspot_tickets', 'first_response_ms', 'ticket guarda o tempo de primeira resposta');
select has_column('public', 'hubspot_companies', 'last_activity_at', 'empresa guarda a última interação');
select has_column('public', 'analytics_cs_ticket_staging', 'first_response_ms', 'staging propaga o tempo de primeira resposta');
select has_column('public', 'analytics_hubspot_company_staging', 'last_activity_at', 'staging propaga a última interação');
select has_column('public', 'vw_analytics_customer_base', 'days_since_last_activity', 'base de clientes expõe dias sem interação');
select has_column('public', 'vw_analytics_ticket_resolution', 'resolution_source', 'resolução declara qual fonte usou');

-- ---------------------------------------------------------------------------
-- Fixture
-- ---------------------------------------------------------------------------
-- nat-1: data nativa presente e histórico ausente  → fonte nativa, 2 dias
-- nat-2: data nativa ausente e histórico presente  → fonte histórico, 5 dias
-- nat-3: ambas presentes e divergentes             → nativa vence
-- nat-4: encerrado sem nenhuma das duas            → sem data, sem invenção

insert into public.analytics_source_config (domain_key, object_type, hubspot_pipeline_id, label, is_active)
values ('cs', 'ticket', 'nat-pipe', 'Suporte de teste', true)
on conflict do nothing;

insert into public.hubspot_pipeline_stages (object_type, pipeline_id, stage_id, label, display_order, is_closed, is_won, metadata)
values
  ('ticket', 'nat-pipe', 'ns-open',   'Aberto',    1, false, false, '{"ticketState":"OPEN","isClosed":false}'::jsonb),
  ('ticket', 'nat-pipe', 'ns-closed', 'Resolvido', 2, true,  false, '{"ticketState":"CLOSED","isClosed":true}'::jsonb);

insert into public.hubspot_tickets
  (ticket_id, pipeline_id, pipeline_stage, hs_created_at, hs_closed_at, first_response_ms, synced_at)
values
  ('nat-1', 'nat-pipe', 'ns-closed', '2026-03-01T00:00:00Z', '2026-03-03T00:00:00Z', 3600000, timezone('utc', now())),
  ('nat-2', 'nat-pipe', 'ns-closed', '2026-03-01T00:00:00Z', null,                    null,    timezone('utc', now())),
  ('nat-3', 'nat-pipe', 'ns-closed', '2026-03-01T00:00:00Z', '2026-03-04T00:00:00Z', 1800000, timezone('utc', now())),
  ('nat-4', 'nat-pipe', 'ns-closed', '2026-03-01T00:00:00Z', null,                    null,    timezone('utc', now()));

insert into public.analytics_hubspot_stage_events (object_type, object_id, changed_at, stage_id, pipeline_id)
values
  ('ticket', 'nat-2', '2026-03-06T00:00:00Z', 'ns-closed', 'nat-pipe'),
  ('ticket', 'nat-3', '2026-03-20T00:00:00Z', 'ns-closed', 'nat-pipe');

-- ---------------------------------------------------------------------------
-- Precedência
-- ---------------------------------------------------------------------------

select is(
  (select resolution_source from public.vw_analytics_ticket_resolution where ticket_id = 'nat-1'),
  'hubspot_property',
  'com data nativa a fonte declarada é a propriedade do HubSpot'
);

select is(
  (select resolution_days from public.vw_analytics_ticket_resolution where ticket_id = 'nat-1'),
  2.00::numeric,
  'tempo de resolução usa a data nativa'
);

select is(
  (select resolution_source from public.vw_analytics_ticket_resolution where ticket_id = 'nat-2'),
  'stage_history',
  'sem data nativa a resolução recorre ao histórico de estágio'
);

select is(
  (select resolution_days from public.vw_analytics_ticket_resolution where ticket_id = 'nat-2'),
  5.00::numeric,
  'o histórico de estágio preenche a lacuna da propriedade ausente'
);

-- A propriedade nativa é a fonte oficial e vence o histórico em divergência.
select is(
  (select resolved_at from public.vw_analytics_ticket_resolution where ticket_id = 'nat-3'),
  '2026-03-04T00:00:00Z'::timestamptz,
  'em divergência a data nativa prevalece sobre o histórico'
);

select is(
  (select resolved_at from public.vw_analytics_ticket_resolution where ticket_id = 'nat-4'),
  null,
  'sem nenhuma das duas fontes não se inventa data de resolução'
);

-- ---------------------------------------------------------------------------
-- Unidade da primeira resposta
-- ---------------------------------------------------------------------------
-- A origem entrega milissegundos apesar do nome sugerir horas.

select is(
  (select first_response_hours from public.vw_analytics_ticket_resolution where ticket_id = 'nat-1'),
  1.00::numeric,
  'uma hora em milissegundos vira 1,00 hora no read model'
);

select is(
  (select first_response_hours from public.vw_analytics_ticket_resolution where ticket_id = 'nat-3'),
  0.50::numeric,
  'meia hora em milissegundos vira 0,50 hora'
);

select is(
  (select first_response_hours from public.vw_analytics_ticket_resolution where ticket_id = 'nat-2'),
  null,
  'sem tempo registrado o valor permanece ausente, não zero'
);

-- ---------------------------------------------------------------------------
-- Estado por cobertura
-- ---------------------------------------------------------------------------
-- 3 de 4 encerrados têm data (2 nativas + 1 por histórico) → parcial.

select is(
  (public.rpc_analytics_support_kpis_v2('2026-03-01', '2026-03-31', 'nat-pipe', null)
    -> 'kpis' -> 'resolved_tickets' ->> 'state'),
  'partial',
  'cobertura incompleta de data de encerramento mantém o indicador parcial'
);

select is(
  (public.rpc_analytics_support_kpis_v2('2026-03-01', '2026-03-31', 'nat-pipe', null)
    -> 'kpis' -> 'resolved_tickets' ->> 'reason'),
  'ticket_close_date_partial',
  'o motivo distingue cobertura parcial de ausência total de fonte'
);

select is(
  (public.rpc_analytics_support_kpis_v2('2026-03-01', '2026-03-31', 'nat-pipe', null)
    -> 'kpis' -> 'median_first_response_hours' ->> 'value')::numeric,
  0.75::numeric,
  'mediana de primeira resposta em horas, a partir de milissegundos'
);

-- ---------------------------------------------------------------------------
-- Clientes sem interação recente
-- ---------------------------------------------------------------------------

update public.analytics_kpi_settings
set active_customer_rule = 'HUBSPOT_CLIENT_STATUS', inactivity_threshold_days = 30
where id;

insert into public.hubspot_companies (company_id, name, client_status, last_activity_at, synced_at)
values
  ('nat-co-1', 'Contato recente', 'Cliente', timezone('utc', now()) - interval '5 days', timezone('utc', now())),
  ('nat-co-2', 'Contato antigo',  'Cliente', timezone('utc', now()) - interval '90 days', timezone('utc', now())),
  ('nat-co-3', 'Sem registro',    'Cliente', null, timezone('utc', now()));

select is(
  (select days_since_last_activity from public.vw_analytics_customer_base where company_id = 'nat-co-1'),
  5,
  'dias sem interação são contados a partir da última interação registrada'
);

select is(
  (select days_since_last_activity from public.vw_analytics_customer_base where company_id = 'nat-co-3'),
  null,
  'cliente sem interação registrada não vira zero dias'
);

-- Ausência de registro não pode ser lida como inatividade.
select ok(
  (select count(*)::integer from public.vw_analytics_customer_base
   where company_id = 'nat-co-3' and days_since_last_activity > 30) = 0,
  'cliente sem registro de interação não é contado como inativo'
);

select * from finish();
rollback;
