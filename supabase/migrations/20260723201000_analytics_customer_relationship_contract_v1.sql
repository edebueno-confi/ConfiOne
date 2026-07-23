-- Contrato de leitura para a futura operação de clientes B2B.
--
-- Não cria um CRM paralelo: usa o cache confiável já existente do HubSpot.
-- Grupo econômico só aparece quando há resolução humana explícita; empresa é
-- a entidade legal disponível no cache; negócio é o deal do HubSpot. Quando a
-- associação empresa-negócio não estiver presente no payload sincronizado, o
-- contrato retorna uma lista vazia, nunca uma associação inventada.

create or replace function public.rpc_analytics_customer_relationship_contract(
  p_limit integer default 100,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with limits as (
  select greatest(1, least(coalesce(p_limit, 100), 500)) as page_limit,
         greatest(coalesce(p_offset, 0), 0) as page_offset
), economic_groups as (
  select r.tax_id_normalized as group_id,
         r.group_label as name,
         r.group_type,
         r.master_company_id,
         r.member_company_ids,
         r.rationale,
         r.source,
         r.updated_at
  from public.analytics_company_group_resolution as r
  where r.is_active
  order by r.group_label, r.tax_id_normalized
), legal_entities as (
  select c.company_id,
         coalesce(nullif(c.raw ->> 'legal_name', ''), nullif(c.raw ->> 'razao_social', ''), c.name) as legal_name,
         c.name as trade_name,
         c.tax_id,
         c.domain,
         c.client_status,
         c.contract_status,
         c.cs_owner_id,
         c.synced_at
  from public.hubspot_companies as c
  order by lower(coalesce(c.name, '')), c.company_id
  limit (select page_limit from limits)
  offset (select page_offset from limits)
), deals as (
  select d.deal_id,
         d.deal_name,
         d.pipeline_id,
         d.dealstage as stage_id,
         d.amount_home,
         d.dealtype,
         d.owner_id,
         d.hs_created_at,
         d.hs_closed_at,
         coalesce(
           array(
             select association ->> 'id'
             from jsonb_array_elements(coalesce(d.raw #> '{associations,companies,results}', '[]'::jsonb)) as association
             where nullif(association ->> 'id', '') is not null
           ),
           '{}'::text[]
         ) as company_ids,
         d.synced_at
  from public.hubspot_deals as d
  order by d.hs_created_at desc nulls last, d.deal_id desc
  limit (select page_limit from limits)
  offset (select page_offset from limits)
), group_payload as (
  select coalesce(jsonb_agg(to_jsonb(g) order by g.name, g.group_id), '[]'::jsonb) as value
  from economic_groups as g
), entity_payload as (
  select coalesce(jsonb_agg(to_jsonb(e) order by e.legal_name, e.company_id), '[]'::jsonb) as value
  from legal_entities as e
), deal_payload as (
  select coalesce(jsonb_agg(to_jsonb(d) order by d.hs_created_at desc nulls last, d.deal_id desc), '[]'::jsonb) as value
  from deals as d
)
select case
  when app_private.can_read_analytics() then jsonb_build_object(
    'contract_version', 'customer_relationship_v1',
    'source_of_truth', 'hubspot_cache',
    'association_policy', 'only_explicit_hubspot_associations',
    'economic_groups', (select value from group_payload),
    'legal_entities', (select value from entity_payload),
    'deals', (select value from deal_payload),
    'meta', jsonb_build_object(
      'economic_groups_total', (select count(*) from economic_groups),
      'legal_entities_total', (select count(*) from public.hubspot_companies),
      'deals_total', (select count(*) from public.hubspot_deals),
      'page_limit', (select page_limit from limits),
      'page_offset', (select page_offset from limits)
    )
  )
  else jsonb_build_object(
    'contract_version', 'customer_relationship_v1',
    'source_of_truth', 'unavailable',
    'economic_groups', '[]'::jsonb,
    'legal_entities', '[]'::jsonb,
    'deals', '[]'::jsonb,
    'meta', jsonb_build_object('economic_groups_total', 0, 'legal_entities_total', 0, 'deals_total', 0)
  )
end;
$$;

revoke all on function public.rpc_analytics_customer_relationship_contract(integer, integer)
  from public, anon;
grant execute on function public.rpc_analytics_customer_relationship_contract(integer, integer)
  to authenticated, service_role;

comment on function public.rpc_analytics_customer_relationship_contract(integer, integer) is
  'Contrato read-only do relacionamento B2B: grupos economicos resolvidos, entidades legais HubSpot e deals paginados. Sem associacoes inferidas.';
