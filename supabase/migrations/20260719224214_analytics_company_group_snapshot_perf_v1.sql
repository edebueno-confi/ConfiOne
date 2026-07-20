-- Reescreve o enriquecimento financeiro com joins indexaveis. A versao
-- anterior usava OR dentro de uma lateral por titulo e atingia timeout com
-- milhares de empresas.
create or replace function public.rpc_analytics_ceo_snapshot(
  p_from date default null,
  p_to date default null
)
returns jsonb
language sql stable security definer set search_path = ''
as $$
with base as (
  select public.rpc_analytics_ceo_snapshot_legacy(p_from, p_to) as payload
), finance as (
  select r.*, ir.created_at as finance_source_at from public.analytics_finance_receivables r
  left join public.analytics_spreadsheet_import_runs ir on ir.id = r.import_run_id
  where p_to is null or coalesce(r.due_date, r.issued_date) <= p_to
), resolutions as (
  select * from public.analytics_company_group_resolution where is_active
), unresolved_finance as (
  select f.* from finance f
  where not exists (select 1 from resolutions r where r.tax_id_normalized = nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), ''))
), resolved_matches as (
  select f.id finance_id, c.company_id, c.name company_name, c.mrr, c.client_status, c.contract_status, c.cs_owner_id,
    (select o.full_name from public.hubspot_owners o where o.owner_id = c.cs_owner_id limit 1) cs_owner_name,
    1::integer candidate_count, 1.0::numeric match_confidence, 'economic_group'::text match_method, 'economic_group'::text resolution_type
  from finance f join resolutions r on r.tax_id_normalized = nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '')
  join public.hubspot_companies c on c.company_id = r.master_company_id
), tax_matches as (
  select f.id finance_id, c.company_id, c.name company_name, c.mrr, c.client_status, c.contract_status, c.cs_owner_id,
    (select o.full_name from public.hubspot_owners o where o.owner_id = c.cs_owner_id limit 1) cs_owner_name,
    count(*) over (partition by f.id)::integer candidate_count, 1.0::numeric match_confidence, 'cnpj'::text match_method, null::text resolution_type
  from unresolved_finance f join public.hubspot_companies c on regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '')
  where nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
), name_matches as (
  select f.id finance_id, c.company_id, c.name company_name, c.mrr, c.client_status, c.contract_status, c.cs_owner_id,
    (select o.full_name from public.hubspot_owners o where o.owner_id = c.cs_owner_id limit 1) cs_owner_name,
    count(*) over (partition by f.id)::integer candidate_count, 0.8::numeric match_confidence, 'nome_exato'::text match_method, null::text resolution_type
  from unresolved_finance f join public.hubspot_companies c on lower(regexp_replace(coalesce(c.name, ''), '[^[:alnum:]]', '', 'g')) = lower(regexp_replace(coalesce(f.client_name, ''), '[^[:alnum:]]', '', 'g'))
  where nullif(trim(coalesce(f.client_name, '')), '') is not null
    and not exists (select 1 from tax_matches t where t.finance_id = f.id)
), all_matches as (
  select * from resolved_matches union all select * from tax_matches union all select * from name_matches
), chosen_matches as (
  select distinct on (finance_id) * from all_matches order by finance_id, case match_method when 'economic_group' then 0 when 'cnpj' then 1 else 2 end, company_id
), matched as (
  select f.*, m.company_id, m.company_name, m.mrr, m.client_status, m.contract_status, m.cs_owner_id, m.cs_owner_name, m.candidate_count, m.match_confidence, m.match_method, m.resolution_type
  from finance f left join chosen_matches m on m.finance_id = f.id
), alerts as (
  select coalesce(company_id, 'unmatched:' || lower(regexp_replace(coalesce(client_name, 'Sem cliente'), '[^[:alnum:]]', '', 'g'))) as alert_key,
    max(company_id) company_id, max(company_name) company_name, max(client_name) source_client_name, max(cs_owner_id) cs_owner_id, max(cs_owner_name) cs_owner_name, max(mrr) mrr,
    max(client_status) client_status, max(contract_status) contract_status, sum(balance)::numeric overdue_balance, count(*)::integer overdue_titles, max((current_date - due_date))::integer max_days_overdue,
    min(due_date) oldest_due_date, max(match_confidence) match_confidence, max(match_method) match_method, max(candidate_count) candidate_count
  from matched where aging_bucket = 'atrasado' and balance > 0 group by 1
), quality as (
  select count(*)::integer finance_titles, count(*) filter (where company_id is not null and match_confidence >= 0.8)::integer matched_finance_titles,
    count(*) filter (where company_id is null)::integer unmatched_finance_titles, count(*) filter (where candidate_count > 1 and resolution_type is null)::integer ambiguous_finance_titles,
    count(*) filter (where resolution_type = 'economic_group')::integer resolved_group_titles, max(finance_source_at) finance_source_at,
    (select max(finished_at) from public.hubspot_sync_runs where status = 'success') hubspot_source_at
  from matched
), finance_payload as (
  select jsonb_build_object('titles', (select count(*) from finance), 'net_amount', (select coalesce(sum(net_amount), 0) from finance), 'balance', (select coalesce(sum(balance), 0) from finance), 'overdue_titles', (select count(*) from finance where aging_bucket = 'atrasado'), 'overdue_balance', (select coalesce(sum(balance) filter (where aging_bucket = 'atrasado'), 0) from finance), 'matched_titles', (select matched_finance_titles from quality), 'unmatched_titles', (select unmatched_finance_titles from quality)) value
)
select case when app_private.can_read_analytics() then (select payload from base) || jsonb_build_object('finance', (select value from finance_payload), 'financial_alerts', coalesce((select jsonb_agg(to_jsonb(alerts) order by overdue_balance desc) from alerts), '[]'::jsonb), 'data_quality', (select to_jsonb(quality) from quality)) else '{}'::jsonb end;
$$;

revoke all on function public.rpc_analytics_ceo_snapshot(date, date) from public, anon;
grant execute on function public.rpc_analytics_ceo_snapshot(date, date) to authenticated, service_role;
