with normalized as (
  select company_id, name, tax_id, domain, contract_status,
    nullif(regexp_replace(coalesce(tax_id, ''), '[^0-9]', '', 'g'), '') as tax_key,
    nullif(lower(regexp_replace(coalesce(name, ''), '[^[:alnum:]]', '', 'g')), '') as name_key
  from public.hubspot_companies
), tax_groups as (
  select tax_key, count(*) as company_count,
    count(*) filter (where coalesce(contract_status, '') <> '') as with_contract
  from normalized where tax_key is not null and tax_key <> '00000000000000'
  group by tax_key having count(*) > 1
), name_groups as (
  select name_key, count(*) as company_count,
    count(*) filter (where coalesce(contract_status, '') <> '') as with_contract
  from normalized where name_key is not null group by name_key having count(*) > 1
)
select jsonb_build_object(
  'hubspot_companies', (select count(*) from normalized),
  'duplicate_tax_groups', (select count(*) from tax_groups),
  'companies_in_duplicate_tax_groups', (select coalesce(sum(company_count), 0) from tax_groups),
  'duplicate_tax_groups_with_contract_signal', (select count(*) from tax_groups where with_contract > 0),
  'duplicate_name_groups', (select count(*) from name_groups),
  'companies_in_duplicate_name_groups', (select coalesce(sum(company_count), 0) from name_groups),
  'duplicate_name_groups_with_contract_signal', (select count(*) from name_groups where with_contract > 0)
) as summary;
