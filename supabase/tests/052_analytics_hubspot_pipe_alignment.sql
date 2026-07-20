begin;
select plan(3);

select is(
  (
    select count(*)::integer
    from public.analytics_source_config
    where domain_key = 'cs'
      and object_type = 'ticket'
      and is_active
  ),
  6,
  'CS possui os seis pipelines ativos configurados'
);

select ok(
  exists (
    select 1
    from public.analytics_source_config
    where domain_key = 'cs'
      and object_type = 'ticket'
      and is_active
      and hubspot_pipeline_id = '1429283'
  ),
  'CS mantém o pipeline operacional legado como fonte configurável'
);

select ok(
  exists (
    select 1
    from public.analytics_source_config
    where domain_key = 'cs'
      and object_type = 'ticket'
      and is_active
      and hubspot_pipeline_id = '5034314'
  ),
  'CS inclui o pipeline Criadouro de Tíquetes como fonte configurável'
);

select * from finish();
rollback;
