-- Lista detalhada dos titulos atrasados cuja correspondencia HubSpot possui
-- mais de uma empresa candidata. O RPC nao escolhe mestre nem altera CRM.

create or replace function public.rpc_analytics_ceo_ambiguous_overdue(
  p_to date default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with candidate_rows as (
  select
    f.id as finance_id,
    f.client_name as source_client_name,
    f.client_tax_id as source_tax_id,
    f.document_number,
    f.balance,
    f.due_date,
    f.issued_date,
    c.company_id,
    c.name as company_name,
    c.domain,
    c.contract_status,
    c.client_status,
    c.cs_owner_id,
    (select o.full_name from public.hubspot_owners o where o.owner_id = c.cs_owner_id limit 1) as cs_owner_name,
    count(*) over (partition by f.id)::integer as candidate_count,
    case
      when nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
        and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g') then 'cnpj'
      when lower(regexp_replace(coalesce(c.name, ''), '[^[:alnum:]]', '', 'g')) = lower(regexp_replace(coalesce(f.client_name, ''), '[^[:alnum:]]', '', 'g')) then 'nome_exato'
      else null
    end as match_method
  from public.analytics_finance_receivables f
  join public.hubspot_companies c on (
    nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
      and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g')
  ) or (
    nullif(trim(coalesce(f.client_name, '')), '') is not null
      and lower(regexp_replace(coalesce(c.name, ''), '[^[:alnum:]]', '', 'g')) = lower(regexp_replace(f.client_name, '[^[:alnum:]]', '', 'g'))
  )
  where f.aging_bucket = 'atrasado'
    and f.balance > 0
    and (p_to is null or coalesce(f.due_date, f.issued_date) <= p_to)
), grouped as (
  select
    finance_id,
    max(source_client_name) as source_client_name,
    max(source_tax_id) as source_tax_id,
    max(document_number) as document_number,
    max(balance) as balance,
    max(due_date) as due_date,
    max(issued_date) as issued_date,
    max(candidate_count) as candidate_count,
    jsonb_agg(jsonb_build_object(
      'company_id', company_id,
      'company_name', company_name,
      'domain', domain,
      'contract_status', contract_status,
      'client_status', client_status,
      'cs_owner_id', cs_owner_id,
      'cs_owner_name', cs_owner_name,
      'match_method', match_method
    ) order by company_id) as candidates
  from candidate_rows
  group by finance_id
  having max(candidate_count) > 1
)
select case when app_private.can_read_analytics() then jsonb_build_object(
  'count', (select count(*) from grouped),
  'titles', coalesce((select jsonb_agg(to_jsonb(grouped) order by balance desc, due_date asc) from grouped), '[]'::jsonb)
) else jsonb_build_object('count', 0, 'titles', '[]'::jsonb) end;
$$;

revoke all on function public.rpc_analytics_ceo_ambiguous_overdue(date) from public, anon;
grant execute on function public.rpc_analytics_ceo_ambiguous_overdue(date) to authenticated, service_role;

comment on function public.rpc_analytics_ceo_ambiguous_overdue(date) is
  'Lista titulos OMIE atrasados com mais de uma empresa HubSpot candidata para revisao humana; somente leitura.';
