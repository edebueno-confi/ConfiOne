begin;

select plan(9);

select has_function(
  'public',
  'rpc_analytics_commercial_kpis_by_operation',
  array['date', 'date', 'text', 'text'],
  'KPIs comerciais aceitam escopo de operacao'
);

insert into public.analytics_source_config (
  domain_key, object_type, hubspot_pipeline_id, label, group_company,
  area_key, group_company_source, is_active
)
values
  ('cs', 'ticket', 'operation-scope-neotrust', 'CS Neotrust', 'Neotrust', 'support', 'confirmed', true),
  ('cs', 'ticket', 'operation-scope-aftersale', 'CS Aftersale', 'Aftersale', 'support', 'confirmed', true);

insert into public.hubspot_pipeline_stages (
  object_type, pipeline_id, stage_id, label, display_order, is_closed, is_won, metadata
)
values
  ('ticket', 'operation-scope-neotrust', 'open', 'Aberto', 1, false, false, '{"ticketState":"OPEN"}'::jsonb),
  ('ticket', 'operation-scope-aftersale', 'open', 'Aberto', 1, false, false, '{"ticketState":"OPEN"}'::jsonb);

insert into public.hubspot_tickets (
  ticket_id, pipeline_id, pipeline_stage, hs_created_at, synced_at
)
values
  ('operation-scope-ticket-neotrust', 'operation-scope-neotrust', 'open', '2026-08-01T09:00:00Z', timezone('utc', now())),
  ('operation-scope-ticket-aftersale', 'operation-scope-aftersale', 'open', '2026-08-01T10:00:00Z', timezone('utc', now()));

select is(
  (public.rpc_analytics_support_kpis_by_operation('2026-08-01', '2026-08-01', null, 'Neotrust')
    -> 'kpis' -> 'created_tickets' ->> 'value')::numeric,
  1::numeric,
  'KPI de suporte inclui somente os tickets da operacao selecionada'
);

select is(
  (
    select coalesce(sum((stage ->> 'open_tickets')::integer), 0)
    from jsonb_array_elements(
      public.rpc_analytics_support_stage_breakdown_by_operation(
        'operation-scope-aftersale',
        'Aftersale'
      ) -> 'stages'
    ) as stage
  ),
  1::bigint,
  'fila por etapa inclui somente os tickets da operacao selecionada'
);

select is(
  jsonb_array_length(
    public.rpc_analytics_support_stage_breakdown_by_operation(
      'operation-scope-aftersale',
      'Neotrust'
    ) -> 'stages'
  ),
  0,
  'fila por etapa nao mistura pipeline Aftersale na operacao Neotrust'
);

select has_function(
  'public',
  'rpc_analytics_support_kpis_by_operation',
  array['date', 'date', 'text', 'text'],
  'KPIs de suporte aceitam escopo de operacao'
);

select has_function(
  'public',
  'rpc_analytics_commercial_snapshot_by_operation',
  array['date', 'date', 'text', 'text', 'text[]', 'text'],
  'snapshot comercial recebe o escopo de operacao junto do recorte manual'
);

select has_function(
  'public',
  'rpc_analytics_cs_snapshot_by_operation',
  array['date', 'date', 'text', 'text', 'text[]', 'text'],
  'snapshot de suporte recebe o escopo de operacao junto do recorte manual'
);

select has_function(
  'public',
  'rpc_analytics_support_stage_breakdown_by_operation',
  array['text', 'text'],
  'a fila por etapa recebe o escopo de operacao'
);

select has_function(
  'public',
  'rpc_analytics_support_queue_health_by_operation',
  array['text'],
  'a saude da fila recebe o escopo de operacao'
);

select * from finish();

rollback;
