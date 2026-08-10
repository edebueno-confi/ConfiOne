-- Alinhamento das fontes de ticket do HubSpot.
--
-- Este teste travava a contagem de pipelines de CS em exatamente 6. Esse numero
-- era um retrato do catalogo anterior, quando so 6 dos 24 pipelines de ticket
-- do HubSpot eram conhecidos e nenhum estava classificado como Customer
-- Success. A migracao 20260810200000 (classificacao por marca/operacao)
-- reclassificou o catalogo por decisao de produto — CS, Comercial e Suporte,
-- separados por negocio (Confi, Aftersale, Neotrust, Confi Analytics) — e a
-- contagem passou a 20 ativos.
--
-- Congelar a contagem transformaria toda decisao de produto sobre quais
-- pipelines alimentam o dashboard em falha de CI. O que precisa ser garantido
-- e outra coisa: que os pipelines operacionais nomeados continuem existindo e
-- ativos, que nenhuma fonte ativa fique sem identificacao de pipeline, e que
-- CS nao volte a ficar vazia — que era o defeito original.

begin;
select plan(5);

select ok(
  (
    select count(*)::integer
    from public.analytics_source_config
    where domain_key = 'cs'
      and object_type = 'ticket'
      and is_active
  ) >= 6,
  'CS mantem ao menos os seis pipelines de ticket ativos do catalogo original'
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

select is(
  (
    select count(*)::integer
    from public.analytics_source_config
    where object_type = 'ticket'
      and is_active
      and nullif(trim(coalesce(hubspot_pipeline_id, '')), '') is null
  ),
  0,
  'Nenhuma fonte de ticket ativa fica sem identificacao de pipeline no HubSpot'
);

select is(
  (
    select count(*)::integer
    from public.analytics_source_config
    where object_type = 'ticket'
      and is_active
      and domain_key is null
  ),
  0,
  'Toda fonte de ticket ativa tem dominio definido'
);

select * from finish();
rollback;
