with normalized as (
  select company_id, name, tax_id, domain, client_status, contract_status, cs_owner_id,
    nullif(regexp_replace(coalesce(tax_id, ''), '[^0-9]', '', 'g'), '') as tax_key,
    nullif(lower(regexp_replace(coalesce(name, ''), '[^[:alnum:]]', '', 'g')), '') as name_key
  from public.hubspot_companies
), tax_groups as (
  select tax_key, count(*)::integer as company_count,
    string_agg(company_id, ', ' order by company_id) as company_ids,
    string_agg(coalesce(name, '(sem nome)'), ' | ' order by name) as company_names,
    string_agg(coalesce(domain, '(sem dominio)'), ' | ' order by domain) as domains,
    string_agg(coalesce(contract_status, '(sem contrato)'), ' | ' order by contract_status) as contract_statuses,
    string_agg(coalesce(cs_owner_id, '(sem CSM)'), ' | ' order by cs_owner_id) as cs_owner_ids
  from normalized where tax_key is not null group by tax_key having count(*) > 1
), name_groups as (
  select name_key, count(*)::integer as company_count,
    string_agg(company_id, ', ' order by company_id) as company_ids,
    string_agg(coalesce(name, '(sem nome)'), ' | ' order by name) as company_names,
    string_agg(coalesce(domain, '(sem dominio)'), ' | ' order by domain) as domains,
    string_agg(coalesce(tax_id, '(sem CNPJ)'), ' | ' order by tax_id) as tax_ids,
    string_agg(coalesce(contract_status, '(sem contrato)'), ' | ' order by contract_status) as contract_statuses
  from normalized where name_key is not null group by name_key having count(*) > 1
)
select jsonb_build_object(
  'tax_id_groups', coalesce((select jsonb_agg(to_jsonb(g) order by company_count desc, tax_key) from tax_groups g), '[]'::jsonb),
  'name_groups', coalesce((select jsonb_agg(to_jsonb(g) order by company_count desc, name_key) from name_groups g), '[]'::jsonb)
) as duplicate_groups;
