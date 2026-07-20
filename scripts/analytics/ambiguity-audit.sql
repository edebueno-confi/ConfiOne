with candidates as (
  select
    f.id as finance_id,
    f.client_name as finance_client_name,
    f.client_tax_id as finance_tax_id,
    f.balance,
    f.aging_bucket,
    f.due_date,
    c.company_id,
    c.name as hubspot_company_name,
    c.tax_id as hubspot_tax_id,
    c.client_status,
    c.contract_status,
    c.cs_owner_id,
    count(c.company_id) over (partition by f.id)::integer as candidate_count,
    case
      when nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
        and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g') then 'cnpj'
      when lower(regexp_replace(coalesce(c.name, ''), '[^[:alnum:]]', '', 'g')) = lower(regexp_replace(coalesce(f.client_name, ''), '[^[:alnum:]]', '', 'g')) then 'nome_exato'
      else null
    end as match_method
  from public.analytics_finance_receivables f
  left join public.hubspot_companies c on (
    nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
      and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g')
  ) or (
    nullif(trim(coalesce(f.client_name, '')), '') is not null
      and lower(regexp_replace(coalesce(c.name, ''), '[^[:alnum:]]', '', 'g')) = lower(regexp_replace(f.client_name, '[^[:alnum:]]', '', 'g'))
  )
), per_title as (
  select finance_id, max(finance_client_name) as finance_client_name,
    max(finance_tax_id) as finance_tax_id, max(balance) as balance,
    max(aging_bucket) as aging_bucket, max(due_date) as due_date,
    max(candidate_count) as candidate_count,
    string_agg(distinct company_id, ', ' order by company_id) filter (where company_id is not null) as company_ids,
    string_agg(distinct hubspot_company_name, ' | ' order by hubspot_company_name) filter (where hubspot_company_name is not null) as company_names,
    string_agg(distinct match_method, ', ' order by match_method) filter (where match_method is not null) as match_methods
  from candidates group by finance_id
)
select jsonb_build_object(
  'finance_titles', (select count(*) from per_title),
  'matched_titles', (select count(*) from per_title where candidate_count >= 1),
  'unmatched_titles', (select count(*) from per_title where candidate_count = 0),
  'ambiguous_titles', (select count(*) from per_title where candidate_count > 1),
  'ambiguous_overdue_titles', (select count(*) from per_title where candidate_count > 1 and aging_bucket = 'atrasado' and balance > 0),
  'ambiguous_overdue_balance', (select coalesce(sum(balance), 0) from per_title where candidate_count > 1 and aging_bucket = 'atrasado' and balance > 0),
  'duplicate_candidate_companies', (select count(*) from (select company_id from candidates where company_id is not null group by company_id having count(distinct finance_id) > 1) repeated),
  'ambiguous_examples', coalesce((select jsonb_agg(to_jsonb(sample) order by sample.balance desc nulls last) from (select * from per_title where candidate_count > 1 order by balance desc nulls last limit 25) sample), '[]'::jsonb)
) as audit;
