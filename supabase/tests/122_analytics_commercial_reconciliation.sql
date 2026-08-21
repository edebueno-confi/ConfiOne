begin;

select plan(8);

insert into public.analytics_source_config (
  domain_key, object_type, hubspot_pipeline_id, label, is_active
)
values ('commercial', 'deal', 'commercial-reconciliation-fixture', 'Reconciliação Comercial', true)
on conflict do nothing;

insert into public.hubspot_pipeline_stages (
  object_type, pipeline_id, stage_id, label, display_order, is_closed, is_won, metadata
)
values
  ('deal', 'commercial-reconciliation-fixture', 'reconciliation-open', 'Aberto', 1, false, false, '{}'::jsonb),
  ('deal', 'commercial-reconciliation-fixture', 'reconciliation-won', 'Ganho', 2, true, true, '{}'::jsonb),
  ('deal', 'commercial-reconciliation-fixture', 'reconciliation-lost', 'Perdido', 3, true, false, '{}'::jsonb)
on conflict (object_type, pipeline_id, stage_id) do nothing;

insert into public.hubspot_deals (
  deal_id, pipeline_id, dealstage, hs_created_at, hs_closed_at, amount_home, synced_at
)
values
  ('commercial-reconciliation-created-open', 'commercial-reconciliation-fixture', 'reconciliation-open', '2100-01-05T12:00:00Z', null, 100, timezone('utc', now())),
  ('commercial-reconciliation-created-closed-later', 'commercial-reconciliation-fixture', 'reconciliation-won', '2100-01-06T12:00:00Z', '2100-02-05T12:00:00Z', 200, timezone('utc', now())),
  ('commercial-reconciliation-created-lost', 'commercial-reconciliation-fixture', 'reconciliation-lost', '2100-01-07T12:00:00Z', '2100-01-20T12:00:00Z', 300, timezone('utc', now())),
  ('commercial-reconciliation-created-before-closed', 'commercial-reconciliation-fixture', 'reconciliation-won', '2099-12-20T12:00:00Z', '2100-01-21T12:00:00Z', 400, timezone('utc', now()));

select is(
  (public.rpc_analytics_commercial_snapshot(
    '2100-01-01', '2100-01-31', null, null,
    (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[])
       from public.analytics_source_config
      where object_type = 'deal'
        and is_active
        and hubspot_pipeline_id <> 'commercial-reconciliation-fixture')
  ) -> 'kpis' ->> 'total_deals')::integer,
  3,
  'total_deals usa a coorte de criacao do periodo'
);

select is(
  (public.rpc_analytics_commercial_snapshot(
    '2100-01-01', '2100-01-31', null, null,
    (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[]) from public.analytics_source_config where object_type = 'deal' and is_active and hubspot_pipeline_id <> 'commercial-reconciliation-fixture')
  ) -> 'kpis' ->> 'open_deals')::integer,
  1,
  'open_deals representa a posicao atual e nao apenas criacoes do periodo'
);

select is(
  (public.rpc_analytics_commercial_snapshot(
    '2100-01-01', '2100-01-31', null, null,
    (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[]) from public.analytics_source_config where object_type = 'deal' and is_active and hubspot_pipeline_id <> 'commercial-reconciliation-fixture')
  ) -> 'kpis' ->> 'won_deals')::integer,
  1,
  'won_deals usa a data de fechamento do periodo'
);

select is(
  (public.rpc_analytics_commercial_snapshot(
    '2100-01-01', '2100-01-31', null, null,
    (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[]) from public.analytics_source_config where object_type = 'deal' and is_active and hubspot_pipeline_id <> 'commercial-reconciliation-fixture')
  ) -> 'kpis' ->> 'lost_deals')::integer,
  1,
  'lost_deals usa a data de fechamento do periodo'
);

select is(
  (public.rpc_analytics_commercial_snapshot(
    '2100-01-01', '2100-01-31', null, null,
    (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[]) from public.analytics_source_config where object_type = 'deal' and is_active and hubspot_pipeline_id <> 'commercial-reconciliation-fixture')
  ) -> 'kpis' ->> 'conversion_rate')::numeric,
  '0.5',
  'conversion_rate tem denominador explicito de fechados no periodo'
);

select is(
  (public.rpc_analytics_commercial_snapshot(
    '2100-01-01', '2100-01-31', null, null,
    (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[]) from public.analytics_source_config where object_type = 'deal' and is_active and hubspot_pipeline_id <> 'commercial-reconciliation-fixture')
  ) -> 'meta' -> 'cohorts' ->> 'total_deals'),
  'created_at',
  'o contrato declara a base temporal de total_deals'
);

select is(
  (public.rpc_analytics_commercial_snapshot(
    '2100-01-01', '2100-01-31', null, null,
    (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[]) from public.analytics_source_config where object_type = 'deal' and is_active and hubspot_pipeline_id <> 'commercial-reconciliation-fixture')
  ) -> 'meta' ->> 'period_to'),
  '2100-01-31',
  'o contrato preserva o periodo solicitado'
);

select ok(
  (public.rpc_analytics_commercial_snapshot(
    '2100-01-01', '2100-01-31', null, null,
    (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[]) from public.analytics_source_config where object_type = 'deal' and is_active and hubspot_pipeline_id <> 'commercial-reconciliation-fixture')
  ) -> 'kpis' ->> 'total_deals')::integer
    <> ((public.rpc_analytics_commercial_snapshot(
      '2100-01-01', '2100-01-31', null, null,
      (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[]) from public.analytics_source_config where object_type = 'deal' and is_active and hubspot_pipeline_id <> 'commercial-reconciliation-fixture')
    ) -> 'kpis' ->> 'won_deals')::integer
      + (public.rpc_analytics_commercial_snapshot(
        '2100-01-01', '2100-01-31', null, null,
        (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[]) from public.analytics_source_config where object_type = 'deal' and is_active and hubspot_pipeline_id <> 'commercial-reconciliation-fixture')
      ) -> 'kpis' ->> 'lost_deals')::integer),
  'contra-teste impede somar criados e fechados como se fossem a mesma coorte'
);

select * from finish();

rollback;
