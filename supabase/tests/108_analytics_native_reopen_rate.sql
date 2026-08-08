-- Reabertura nativa: valor nulo significa "nao reabriu" quando a propriedade
-- foi lida da origem. Nao pode manter o KPI em aguardando historico.

begin;

select plan(3);

insert into public.analytics_source_config (domain_key, object_type, hubspot_pipeline_id, label, is_active)
values ('cs', 'ticket', 'native-reopen-pipeline', 'Pipeline de reabertura nativa', true)
on conflict do nothing;

insert into public.hubspot_pipeline_stages (object_type, pipeline_id, stage_id, label, display_order, is_closed, is_won, metadata)
values (
  'ticket', 'native-reopen-pipeline', 'native-reopen-closed', 'Resolvido', 1, true, false,
  '{"ticketState":"CLOSED","isClosed":true}'::jsonb
)
on conflict (object_type, pipeline_id, stage_id) do nothing;

insert into public.hubspot_tickets (
  ticket_id, pipeline_id, pipeline_stage, hs_created_at, hs_closed_at,
  reopened_at, raw, synced_at
)
values
  (
    'native-reopen-yes', 'native-reopen-pipeline', 'native-reopen-closed',
    '2026-08-01T08:00:00Z', '2026-08-02T08:00:00Z', '2026-08-03T08:00:00Z',
    '{"hs_ticket_reopened_at":"2026-08-03T08:00:00Z"}'::jsonb, timezone('utc', now())
  ),
  (
    'native-reopen-no', 'native-reopen-pipeline', 'native-reopen-closed',
    '2026-08-01T09:00:00Z', '2026-08-02T09:00:00Z', null,
    '{"hs_ticket_reopened_at":null}'::jsonb, timezone('utc', now())
  );

select is(
  (public.rpc_analytics_support_kpis_v2('2026-08-01', '2026-08-08', 'native-reopen-pipeline', null)
    -> 'kpis' -> 'reopen_rate' ->> 'state'),
  'available',
  'propriedade nativa lida para todos os tickets torna a taxa de reabertura disponivel'
);

select is(
  (public.rpc_analytics_support_kpis_v2('2026-08-01', '2026-08-08', 'native-reopen-pipeline', null)
    -> 'kpis' -> 'reopen_rate' ->> 'basis'),
  'ticket_reopened_at',
  'KPI declara a fonte nativa de reabertura'
);

select is(
  (public.rpc_analytics_support_kpis_v2('2026-08-01', '2026-08-08', 'native-reopen-pipeline', null)
    -> 'kpis' -> 'reopen_rate' ->> 'value')::numeric,
  50.00::numeric,
  'taxa publica em percentual a marca nativa sobre os tickets resolvidos no periodo'
);

select * from finish();

rollback;
