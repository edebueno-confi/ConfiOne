begin;

select plan(6);

select has_function(
  'public',
  'rpc_analytics_timeseries_by_operation',
  array['text', 'date', 'date', 'text', 'text'],
  'evolucao aceita o recorte de operacao'
);

insert into public.analytics_source_config (
  domain_key, object_type, hubspot_pipeline_id, label, group_company,
  group_company_source, is_active
)
values
  ('cs', 'ticket', 'operation-timeseries-neotrust', 'CS Neotrust', 'Neotrust', 'confirmed', true),
  ('cs', 'ticket', 'operation-timeseries-aftersale', 'CS Aftersale', 'Aftersale', 'confirmed', true);

insert into public.hubspot_pipeline_stages (
  object_type, pipeline_id, stage_id, label, display_order, is_closed, is_won, metadata
)
values
  ('ticket', 'operation-timeseries-neotrust', 'open', 'Aberto', 1, false, false, '{"ticketState":"OPEN"}'::jsonb),
  ('ticket', 'operation-timeseries-aftersale', 'open', 'Aberto', 1, false, false, '{"ticketState":"OPEN"}'::jsonb);

insert into public.hubspot_tickets (
  ticket_id, pipeline_id, pipeline_stage, hs_created_at, synced_at
)
values
  ('operation-timeseries-ticket-neotrust', 'operation-timeseries-neotrust', 'open', '2099-08-01T09:00:00Z', timezone('utc', now())),
  ('operation-timeseries-ticket-aftersale', 'operation-timeseries-aftersale', 'open', '2099-08-01T10:00:00Z', timezone('utc', now()));

select is(
  (
    select coalesce(sum((point ->> 'opened')::integer), 0)
    from jsonb_array_elements(public.rpc_analytics_timeseries_by_operation(
      'support', '2099-08-01', '2099-08-01', 'month', 'Neotrust'
    ) -> 'series') as point
  ),
  1::bigint,
  'evolucao de Suporte inclui somente a operacao selecionada'
);

select is(
  (
    select coalesce(sum((point ->> 'opened')::integer), 0)
    from jsonb_array_elements(public.rpc_analytics_timeseries_by_operation(
      'support', '2099-08-01', '2099-08-01', 'month', 'Aftersale'
    ) -> 'series') as point
  ),
  1::bigint,
  'evolucao troca corretamente para outra operacao'
);

select is(
  (
    select coalesce(sum((point ->> 'opened')::integer), 0)
    from jsonb_array_elements(public.rpc_analytics_timeseries_by_operation(
      'support', '2099-08-01', '2099-08-01', 'month', 'Operacao inexistente'
    ) -> 'series') as point
  ),
  0::bigint,
  'contra-teste impede que o total global seja reutilizado no recorte'
);

select is(
  public.rpc_analytics_timeseries_by_operation(
    'finance', '2099-08-01', '2099-08-01', 'month', 'Neotrust'
  ) ->> 'unavailable_reason',
  'operation_dimension_unavailable',
  'Financeiro nao fabrica serie quando a fonte nao publica operacao'
);

select is(
  jsonb_array_length(public.rpc_analytics_timeseries_by_operation(
    'support', '2099-08-01', '2099-08-01', 'month', 'Neotrust'
  ) -> 'series'),
  1,
  'o recorte de operacao preserva a serie e seus buckets'
);

select * from finish();

rollback;
