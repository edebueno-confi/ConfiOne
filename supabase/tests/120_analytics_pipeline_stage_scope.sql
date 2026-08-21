begin;

select plan(8);

insert into public.analytics_source_config (
  domain_key, object_type, hubspot_pipeline_id, label, group_company,
  group_company_source, is_active
)
values
  ('commercial', 'deal', 'stage-scope-commercial-a', 'Comercial A', 'Confi', 'confirmed', true),
  ('commercial', 'deal', 'stage-scope-commercial-b', 'Comercial B', 'Confi', 'confirmed', true),
  ('commercial', 'deal', 'stage-scope-commercial-other', 'Comercial Outro', 'Aftersale', 'confirmed', true),
  ('cs', 'ticket', 'stage-scope-cs-a', 'Suporte A', 'Confi', 'confirmed', true),
  ('cs', 'ticket', 'stage-scope-cs-other', 'Suporte Outro', 'Aftersale', 'confirmed', true);

insert into public.hubspot_pipeline_stages (
  object_type, pipeline_id, stage_id, label, display_order, is_closed, is_won, metadata
)
values
  ('deal', 'stage-scope-commercial-a', 'stage-a', 'Aberto', 1, false, false, '{}'::jsonb),
  ('deal', 'stage-scope-commercial-b', 'stage-b', 'Aberto', 1, false, false, '{}'::jsonb),
  ('deal', 'stage-scope-commercial-other', 'stage-other', 'Aberto', 1, false, false, '{}'::jsonb),
  ('ticket', 'stage-scope-cs-a', 'status-a', 'Novo', 1, false, false, '{"ticketState":"OPEN"}'::jsonb),
  ('ticket', 'stage-scope-cs-other', 'status-other', 'Novo', 1, false, false, '{"ticketState":"OPEN"}'::jsonb);

insert into public.hubspot_deals (deal_id, pipeline_id, dealstage, hs_created_at, synced_at)
values
  ('stage-scope-deal-a', 'stage-scope-commercial-a', 'stage-a', '2026-08-01T09:00:00Z', timezone('utc', now())),
  ('stage-scope-deal-b', 'stage-scope-commercial-b', 'stage-b', '2026-08-01T09:00:00Z', timezone('utc', now())),
  ('stage-scope-deal-other', 'stage-scope-commercial-other', 'stage-other', '2026-08-01T09:00:00Z', timezone('utc', now()));

insert into public.hubspot_tickets (ticket_id, pipeline_id, pipeline_stage, hs_created_at, synced_at)
values
  ('stage-scope-ticket-a', 'stage-scope-cs-a', 'status-a', '2026-08-01T09:00:00Z', timezone('utc', now())),
  ('stage-scope-ticket-other', 'stage-scope-cs-other', 'status-other', '2026-08-01T09:00:00Z', timezone('utc', now()));

select ok(
  jsonb_path_exists(
    public.rpc_analytics_commercial_snapshot_by_operation(null, null, null, null, '{}'::text[], 'Confi'),
    '$.funnel[*].pipeline_breakdown[*] ? (@.pipeline_id == "stage-scope-commercial-a")'
  ),
  'snapshot comercial publica a origem do stage por pipeline'
);

select ok(
  not jsonb_path_exists(
    public.rpc_analytics_commercial_snapshot_by_operation(null, null, null, null, '{}'::text[], 'Confi'),
    '$.funnel[*].pipeline_breakdown[*] ? (@.pipeline_id == "stage-scope-commercial-other")'
  ),
  'operacao nao publica stages de outra operacao'
);

select is(
  (public.rpc_analytics_commercial_snapshot_by_operation(null, null, null, 'stage-a', '{}'::text[], 'Confi')->'kpis'->>'total_deals')::integer,
  1,
  'stage comercial selecionado retorna somente o stage compatível'
);

select is(
  (public.rpc_analytics_commercial_snapshot_by_operation(null, null, null, 'stage-other', '{}'::text[], 'Confi')->'kpis'->>'total_deals')::integer,
  0,
  'stage de outra operacao nao vira zero global nem cruza o escopo'
);

select ok(
  jsonb_path_exists(
    public.rpc_analytics_cs_snapshot_by_operation(null, null, null, null, '{}'::text[], 'Confi'),
    '$.by_status[*].pipeline_breakdown[*] ? (@.pipeline_id == "stage-scope-cs-a")'
  ),
  'snapshot de suporte preserva a origem do status por pipeline'
);

select ok(
  not jsonb_path_exists(
    public.rpc_analytics_cs_snapshot_by_operation(null, null, null, null, '{}'::text[], 'Confi'),
    '$.by_status[*].pipeline_breakdown[*] ? (@.pipeline_id == "stage-scope-cs-other")'
  ),
  'snapshot de suporte nao publica status de outra operacao'
);

select is(
  (public.rpc_analytics_cs_snapshot_by_operation(null, null, 'status-a', null, '{}'::text[], 'Confi')->'kpis'->>'total_tickets')::integer,
  1,
  'status de suporte selecionado retorna somente o status compatível'
);

select is(
  (public.rpc_analytics_cs_snapshot_by_operation(null, null, 'status-other', null, '{}'::text[], 'Confi')->'kpis'->>'total_tickets')::integer,
  0,
  'status de outra operacao nao cruza o recorte selecionado'
);

select * from finish();
rollback;
