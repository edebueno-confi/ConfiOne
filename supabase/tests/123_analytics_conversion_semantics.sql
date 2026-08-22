begin;

select plan(18);

update public.analytics_source_config
set is_active = false
where domain_key = 'commercial' and object_type = 'deal';

insert into public.analytics_source_config (
  domain_key, object_type, hubspot_pipeline_id, label, is_active
)
values ('commercial', 'deal', 'commercial-conversion-semantics-fixture', 'Semantica de Conversao', true)
on conflict do nothing;

insert into public.hubspot_pipeline_stages (
  object_type, pipeline_id, stage_id, label, display_order, is_closed, is_won, metadata
)
values
  ('deal', 'commercial-conversion-semantics-fixture', 'conversion-open', 'Aberto', 1, false, false, '{}'::jsonb),
  ('deal', 'commercial-conversion-semantics-fixture', 'conversion-won-open', 'Ganho ainda aberto', 2, false, true, '{}'::jsonb),
  ('deal', 'commercial-conversion-semantics-fixture', 'conversion-won', 'Ganho', 3, true, true, '{}'::jsonb),
  ('deal', 'commercial-conversion-semantics-fixture', 'conversion-lost', 'Perdido', 4, true, false, '{}'::jsonb)
on conflict (object_type, pipeline_id, stage_id) do nothing;

insert into public.hubspot_deals (
  deal_id, pipeline_id, dealstage, hs_created_at, hs_closed_at, amount_home, synced_at
)
values
  ('commercial-conversion-won-1', 'commercial-conversion-semantics-fixture', 'conversion-won', '2101-01-01T12:00:00Z', '2101-01-10T12:00:00Z', 100, timezone('utc', now())),
  ('commercial-conversion-won-before-created-cohort', 'commercial-conversion-semantics-fixture', 'conversion-won', '2100-12-01T12:00:00Z', '2101-01-11T12:00:00Z', 200, timezone('utc', now())),
  ('commercial-conversion-lost-1', 'commercial-conversion-semantics-fixture', 'conversion-lost', '2101-01-02T12:00:00Z', '2101-01-12T12:00:00Z', 300, timezone('utc', now())),
  ('commercial-conversion-created-not-closed', 'commercial-conversion-semantics-fixture', 'conversion-won', '2101-01-03T12:00:00Z', '2101-02-01T12:00:00Z', 400, timezone('utc', now())),
  ('commercial-conversion-reopened', 'commercial-conversion-semantics-fixture', 'conversion-open', '2101-01-04T12:00:00Z', '2101-01-08T12:00:00Z', 500, timezone('utc', now())),
  ('commercial-conversion-closed-without-date', 'commercial-conversion-semantics-fixture', 'conversion-won', '2101-01-05T12:00:00Z', null, 600, timezone('utc', now())),
  ('commercial-conversion-won-open', 'commercial-conversion-semantics-fixture', 'conversion-won-open', '2101-01-06T12:00:00Z', null, 700, timezone('utc', now()));

select is(
  (public.rpc_analytics_commercial_snapshot(
    '2101-01-01', '2101-01-31', null, null,
    (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[])
       from public.analytics_source_config
      where object_type = 'deal'
        and is_active
        and hubspot_pipeline_id <> 'commercial-conversion-semantics-fixture')
  ) -> 'kpis' ->> 'total_deals')::integer,
  6,
  'a coorte de criacao considera somente os deals criados no periodo'
);

select is(
  (public.rpc_analytics_commercial_snapshot(
    '2101-01-01', '2101-01-31', null, null,
    (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[])
       from public.analytics_source_config
      where object_type = 'deal'
        and is_active
        and hubspot_pipeline_id <> 'commercial-conversion-semantics-fixture')
  ) -> 'kpis' ->> 'won_deals')::integer,
  2,
  'o numerador considera somente ganhos fechados no periodo'
);

select is(
  (public.rpc_analytics_commercial_snapshot(
    '2101-01-01', '2101-01-31', null, null,
    (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[])
       from public.analytics_source_config
      where object_type = 'deal'
        and is_active
        and hubspot_pipeline_id <> 'commercial-conversion-semantics-fixture')
  ) -> 'kpis' ->> 'lost_deals')::integer,
  1,
  'o denominador usa a mesma coorte de fechamentos e exclui reabertos'
);

select is(
  (public.rpc_analytics_commercial_snapshot(
    '2101-01-01', '2101-01-31', null, null,
    (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[])
       from public.analytics_source_config
      where object_type = 'deal'
        and is_active
        and hubspot_pipeline_id <> 'commercial-conversion-semantics-fixture')
  ) -> 'kpis' ->> 'conversion_rate')::numeric,
  66.67::numeric,
  'conversion_rate e ganhos divididos pelos tres fechados do periodo, nao pelos cinco criados'
);

select ok(
  (public.rpc_analytics_commercial_snapshot(
    '2101-01-01', '2101-01-31', null, null,
    (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[])
       from public.analytics_source_config
      where object_type = 'deal'
        and is_active
        and hubspot_pipeline_id <> 'commercial-conversion-semantics-fixture')
  ) -> 'kpis' ->> 'conversion_rate')::numeric between 0 and 100,
  'snapshot nunca publica percentual fora do intervalo de 0 a 100'
);

select is(
  (public.rpc_analytics_commercial_kpis_v2('2101-01-01', '2101-01-31', null, 'commercial-conversion-semantics-fixture') -> 'kpis' -> 'win_rate' ->> 'value')::numeric,
  66.67::numeric,
  'win_rate usa a mesma coorte e unidade percentual do snapshot'
);

select is(
  (public.rpc_analytics_commercial_kpis_v2('2101-01-01', '2101-01-31', null, 'commercial-conversion-semantics-fixture') -> 'kpis' -> 'created_deals' ->> 'value')::numeric,
  6::numeric,
  'created_deals permanece separado da coorte de fechamentos'
);

select is(
  (public.rpc_analytics_commercial_kpis_v2('2101-01-01', '2101-01-31', null, 'commercial-conversion-semantics-fixture') -> 'kpis' -> 'win_rate' ->> 'basis'),
  'deal_closed_at',
  'win_rate declara a data de fechamento como base'
);

select is(
  (public.rpc_analytics_commercial_snapshot(
    '2101-03-01', '2101-03-31', null, null,
    '{}'::text[]
  ) -> 'kpis' ->> 'conversion_rate'),
  null,
  'snapshot sem fechamentos devolve conversao nula, nao zero'
);

select is(
  (public.rpc_analytics_commercial_kpis_v2('2101-03-01', '2101-03-31', null, 'commercial-conversion-semantics-fixture') -> 'kpis' -> 'win_rate' ->> 'state'),
  'unavailable',
  'read model sem fechamentos marca win_rate como indisponivel'
);

select is(
  (public.rpc_analytics_commercial_kpis_v2('2101-03-01', '2101-03-31', null, 'commercial-conversion-semantics-fixture') -> 'kpis' -> 'win_rate' ->> 'value'),
  null,
  'read model sem fechamentos nao inventa valor para win_rate'
);

select is(app_private.kpi_ratio(-1, 4), null, 'numerador negativo invalido nao vira percentual negativo');
select is(app_private.kpi_ratio(5, 4), null, 'numerador maior que denominador nao vira percentual acima de 100');
select is(app_private.kpi_ratio(5, -1), null, 'denominador negativo invalido nao produz percentual');

select is(
  (public.rpc_analytics_commercial_snapshot(
    '2101-01-01', '2101-01-31', null, null,
    (select coalesce(array_agg(hubspot_pipeline_id), '{}'::text[])
       from public.analytics_source_config
      where object_type = 'deal'
        and is_active
        and hubspot_pipeline_id <> 'commercial-conversion-semantics-fixture')
  ) -> 'meta' -> 'cohorts' ->> 'conversion_rate'),
  'closed_at',
  'snapshot declara closed_at como base de conversao'
);

select is(
  (select conversion_rate from public.vw_analytics_commercial_kpis)::numeric,
  75::numeric,
  'view legada exclui ganhos ainda abertos e fechados sem hs_closed_at da coorte'
);

select is(
  (public.rpc_analytics_ceo_snapshot_legacy('2101-01-01', '2101-01-31') -> 'commercial' ->> 'conversion_rate')::numeric,
  66.67::numeric,
  'snapshot executivo legado usa a coorte de fechamento do periodo'
);

select is(
  public.rpc_analytics_ceo_snapshot_legacy('2101-03-01', '2101-03-31') -> 'commercial' ->> 'conversion_rate',
  null,
  'exportacao executiva recebe conversao nula quando nao ha fechamentos'
);

select * from finish();

rollback;
