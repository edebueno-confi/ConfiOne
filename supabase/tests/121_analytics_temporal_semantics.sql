begin;

select plan(20);

select is(
  app_private.analytics_period_start('2026-08-01')::text,
  '2026-08-01 03:00:00+00',
  'o inicio de agosto de 2026 respeita America/Sao_Paulo'
);

select is(
  app_private.analytics_period_end_exclusive('2026-07-31')::text,
  '2026-08-01 03:00:00+00',
  'o fim exclusivo preserva a fronteira meia-aberta'
);

select ok(
  '2026-08-01T02:59:59Z'::timestamptz >= app_private.analytics_period_start('2026-07-31')
    and '2026-08-01T02:59:59Z'::timestamptz < app_private.analytics_period_end_exclusive('2026-07-31'),
  'evento antes da meia-noite operacional pertence ao dia anterior'
);

select ok(
  not ('2026-08-01T02:59:59Z'::timestamptz >= app_private.analytics_period_start('2026-08-01')
    and '2026-08-01T02:59:59Z'::timestamptz < app_private.analytics_period_end_exclusive('2026-08-01')),
  'contra-teste nao desloca evento de 02:59 UTC para o dia seguinte'
);

select is(
  app_private.analytics_period_start('2018-12-01')::text,
  '2018-12-01 02:00:00+00',
  'data historica usa a regra IANA de horario de verao'
);

select is(
  app_private.analytics_period_start('2019-12-01')::text,
  '2019-12-01 03:00:00+00',
  'a regra IANA nao assume offset fixo'
);

select is(
  (select count(*) from pg_proc where oid = 'public.rpc_analytics_timeseries(text,date,date,text)'::regprocedure
    and pg_get_functiondef(oid) like '%America/Sao_Paulo%'),
  1::bigint,
  'a serie temporal agrupa no timezone operacional'
);

select is(
  (select count(*) from pg_proc where oid = 'public.rpc_analytics_commercial_kpis_v2(date,date,text,text)'::regprocedure
    and pg_get_functiondef(oid) like '%analytics_period_start%'),
  1::bigint,
  'KPIs comerciais usam fronteiras temporais explicitas'
);

select is(
  (select count(*) from pg_proc where oid = 'public.rpc_analytics_support_kpis_v2(date,date,text,text)'::regprocedure
    and pg_get_functiondef(oid) like '%analytics_period_end_exclusive%'),
  1::bigint,
  'KPIs de suporte usam fim exclusivo explicito'
);

select is(
  (select count(*) from pg_proc where oid = 'public.rpc_analytics_ceo_snapshot_legacy(date,date)'::regprocedure
    and pg_get_functiondef(oid) like '%analytics_period_start%'),
  1::bigint,
  'comparativo executivo usa a mesma fronteira operacional'
);

-- Contra-teste comportamental: quatro eventos atravessam as duas fronteiras
-- do dia operacional. Somente o evento na fronteira inicial e o evento na
-- fronteira superior inclusiva devem pertencer a 2099-08-01; o evento em
-- 03:00:00Z já pertence ao dia operacional seguinte.
insert into public.analytics_source_config (
  domain_key, object_type, hubspot_pipeline_id, label, is_active
)
values
  ('commercial', 'deal', 'temporal-semantics-commercial', 'Temporal Comercial', true),
  ('cs', 'ticket', 'temporal-semantics-support', 'Temporal Suporte', true)
on conflict do nothing;

insert into public.hubspot_pipeline_stages (
  object_type, pipeline_id, stage_id, label, display_order, is_closed, is_won, metadata
)
values
  ('deal', 'temporal-semantics-commercial', 'temporal-deal-open', 'Aberto', 1, false, false, '{}'::jsonb),
  ('ticket', 'temporal-semantics-support', 'temporal-ticket-open', 'Aberto', 1, false, false, '{"ticketState":"OPEN"}'::jsonb);

insert into public.hubspot_deals (
  deal_id, pipeline_id, dealstage, hs_created_at, synced_at
)
values
  ('temporal-deal-before', 'temporal-semantics-commercial', 'temporal-deal-open', '2099-08-01T02:59:59Z', timezone('utc', now())),
  ('temporal-deal-start',  'temporal-semantics-commercial', 'temporal-deal-open', '2099-08-01T03:00:00Z', timezone('utc', now())),
  ('temporal-deal-end',    'temporal-semantics-commercial', 'temporal-deal-open', '2099-08-02T02:59:59Z', timezone('utc', now())),
  ('temporal-deal-after',  'temporal-semantics-commercial', 'temporal-deal-open', '2099-08-02T03:00:00Z', timezone('utc', now()));

insert into public.hubspot_tickets (
  ticket_id, pipeline_id, pipeline_stage, hs_created_at, synced_at
)
values
  ('temporal-ticket-before', 'temporal-semantics-support', 'temporal-ticket-open', '2099-08-01T02:59:59Z', timezone('utc', now())),
  ('temporal-ticket-start',  'temporal-semantics-support', 'temporal-ticket-open', '2099-08-01T03:00:00Z', timezone('utc', now())),
  ('temporal-ticket-end',    'temporal-semantics-support', 'temporal-ticket-open', '2099-08-02T02:59:59Z', timezone('utc', now())),
  ('temporal-ticket-after',  'temporal-semantics-support', 'temporal-ticket-open', '2099-08-02T03:00:00Z', timezone('utc', now()));

select is(
  (public.rpc_analytics_commercial_kpis_v2('2099-08-01', '2099-08-01', null, 'temporal-semantics-commercial')
    -> 'kpis' -> 'created_deals' ->> 'value')::integer,
  2,
  'KPI comercial inclui somente criado na fronteira inicial e no limite superior do dia'
);

select is(
  (public.rpc_analytics_commercial_kpis_v2('2099-08-02', '2099-08-02', null, 'temporal-semantics-commercial')
    -> 'kpis' -> 'created_deals' ->> 'value')::integer,
  1,
  'KPI comercial exclui evento exatamente no inicio do dia seguinte'
);

select is(
  (public.rpc_analytics_support_kpis_v2('2099-08-01', '2099-08-01', 'temporal-semantics-support', null)
    -> 'kpis' -> 'created_tickets' ->> 'value')::integer,
  2,
  'KPI de suporte respeita as duas fronteiras do dia operacional'
);

select is(
  (public.rpc_analytics_support_kpis_v2('2099-08-02', '2099-08-02', 'temporal-semantics-support', null)
    -> 'kpis' -> 'created_tickets' ->> 'value')::integer,
  1,
  'KPI de suporte exclui evento posterior ao fim exclusivo'
);

select is(
  (
    select coalesce(sum((point ->> 'opened')::integer), 0)
    from jsonb_array_elements(public.rpc_analytics_timeseries(
      'support', '2099-08-01', '2099-08-01', 'day'
    ) -> 'series') as point
  ),
  2::bigint,
  'timeseries de suporte classifica os eventos do dia operacional'
);

select is(
  (
    select coalesce(sum((point ->> 'opened')::integer), 0)
    from jsonb_array_elements(public.rpc_analytics_timeseries(
      'support', '2099-08-02', '2099-08-02', 'day'
    ) -> 'series') as point
  ),
  1::bigint,
  'timeseries de suporte nao inclui evento na fronteira do dia seguinte'
);

select is(
  (public.rpc_analytics_commercial_snapshot(
    '2099-08-01', '2099-08-01', null, null, '{}'::text[]
  ) -> 'kpis' ->> 'total_deals')::integer,
  2,
  'snapshot comercial executa a mesma janela temporal dos KPIs'
);

select is(
  (public.rpc_analytics_cs_snapshot_alias_legacy(
    '2099-08-01', '2099-08-01', null, null, '{}'::text[]
  ) -> 'kpis' ->> 'total_tickets')::integer,
  2,
  'snapshot de CS executa a mesma janela temporal dos KPIs'
);

select is(
  (public.rpc_analytics_ceo_snapshot_legacy('2099-08-01', '2099-08-01')
    -> 'commercial' ->> 'total_deals')::integer,
  2,
  'wrapper executivo comercial preserva o recorte operacional'
);

select is(
  (public.rpc_analytics_ceo_snapshot_legacy('2099-08-01', '2099-08-01')
    -> 'support' ->> 'total_tickets')::integer,
  2,
  'wrapper executivo de suporte preserva o recorte operacional'
);

select * from finish();

rollback;
