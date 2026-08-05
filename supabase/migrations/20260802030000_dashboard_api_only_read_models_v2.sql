-- Dashboard Gerencial: contratos forward-only para a superficie API-only.
-- Nao altera nem apaga migrations historicas ou tabelas de migracao.

create or replace function public.rpc_analytics_customer_success_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with book as (
  select
    c.company_id,
    coalesce(nullif(c.name, ''), 'Empresa sem nome') as company_name,
    nullif(c.client_status, '') as client_status,
    nullif(c.contract_status, '') as contract_status,
    nullif(c.cs_owner_id, '') as cs_owner_id,
    coalesce(nullif(o.full_name, ''), nullif(c.cs_owner_id, ''), 'Sem responsavel') as cs_owner_name,
    c.mrr,
    c.synced_at
  from public.hubspot_companies c
  left join public.hubspot_owners o on o.owner_id = c.cs_owner_id
), totals as (
  select
    count(*)::integer as companies_total,
    count(*) filter (where client_status is not null)::integer as client_status_filled,
    count(*) filter (where contract_status is not null)::integer as contract_status_filled,
    count(*) filter (where cs_owner_id is null)::integer as without_owner,
    count(*) filter (where mrr is not null)::integer as mrr_filled,
    max(synced_at) as last_successful_sync_at
  from book
), owners as (
  select cs_owner_id as owner_id, max(cs_owner_name) as owner_name, count(*)::integer as company_count
  from book
  group by cs_owner_id
  order by company_count desc, owner_name
), client_statuses as (
  select coalesce(client_status, 'Indisponivel') as key, count(*)::integer as company_count
  from book
  group by 1
  order by company_count desc, key
), contract_statuses as (
  select coalesce(contract_status, 'Indisponivel') as key, count(*)::integer as company_count
  from book
  group by 1
  order by company_count desc, key
), companies as (
  select company_id, company_name, client_status, contract_status, cs_owner_id, cs_owner_name, synced_at
  from book
  order by lower(company_name), company_id
  limit 100
)
select case when app_private.can_read_analytics() then jsonb_build_object(
  'contract_version', 'customer_success_hubspot_v1',
  'source', 'HubSpot',
  'source_key', 'hubspot_companies',
  'status', case when (select companies_total from totals) = 0 then 'empty' else 'fresh' end,
  'last_successful_sync_at', (select last_successful_sync_at from totals),
  'expected_count', (select companies_total from totals),
  'reason', case when (select companies_total from totals) = 0 then 'O cache de empresas do HubSpot nao possui registros disponiveis.' else null end,
  'kpis', jsonb_build_object(
    'companies_total', (select companies_total from totals),
    'client_status_filled', (select client_status_filled from totals),
    'contract_status_filled', (select contract_status_filled from totals),
    'without_owner', (select without_owner from totals),
    'mrr_filled', (select mrr_filled from totals)
  ),
  'by_owner', coalesce((select jsonb_agg(to_jsonb(owners)) from owners), '[]'::jsonb),
  'by_client_status', coalesce((select jsonb_agg(to_jsonb(client_statuses)) from client_statuses), '[]'::jsonb),
  'by_contract_status', coalesce((select jsonb_agg(to_jsonb(contract_statuses)) from contract_statuses), '[]'::jsonb),
  'companies', coalesce((select jsonb_agg(to_jsonb(companies)) from companies), '[]'::jsonb),
  'limitations', jsonb_build_array(
    'Indisponivel: o cache nao publica regra operacional de cliente ativo neste contrato.',
    'Indisponivel: nenhum campo HubSpot de health foi confirmado neste contrato.',
    'Disponibilidade observada por preenchimento do campo mrr; nenhum valor e inferido.'
  )
) else jsonb_build_object(
  'contract_version', 'customer_success_hubspot_v1',
  'source', 'Indisponivel',
  'status', 'unavailable',
  'reason', 'Acesso negado ao contrato de Customer Success.'
) end;
$$;

revoke all on function public.rpc_analytics_customer_success_snapshot() from public, anon;
grant execute on function public.rpc_analytics_customer_success_snapshot() to authenticated, service_role;

comment on function public.rpc_analytics_customer_success_snapshot() is
  'Read model de Customer Success baseado somente no cache oficial de empresas HubSpot; regras ausentes permanecem indisponiveis.';

-- O snapshot executivo nao pode consultar linhas produzidas por importacao de
-- planilha nem usar a view de carteira interna como proxy de HubSpot.
create or replace function public.rpc_analytics_ceo_snapshot(
  p_from date default null,
  p_to date default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with base as (
  select public.rpc_analytics_ceo_snapshot_legacy(p_from, p_to) as payload
), finance as (
  select r.id, r.client_tax_id, r.client_name, r.due_date, r.issued_date,
    r.balance, r.net_amount, r.aging_bucket, sr.finished_at as finance_source_at
  from public.analytics_finance_receivables r
  left join public.analytics_finance_sync_runs sr on sr.id = r.sync_run_id
  where r.source_key = 'omie_receivables_api'
    and (p_to is null or coalesce(r.due_date, r.issued_date) <= p_to)
), resolutions as (
  select tax_id_normalized, master_company_id
  from public.analytics_company_group_resolution
  where is_active
), unresolved_finance as (
  select f.id, f.client_tax_id, f.client_name, f.due_date, f.issued_date,
    f.balance, f.net_amount, f.aging_bucket, f.finance_source_at
  from finance f
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
  select finance_id, company_id, company_name, mrr, client_status,
    contract_status, cs_owner_id, cs_owner_name, candidate_count,
    match_confidence, match_method, resolution_type
  from resolved_matches
  union all
  select finance_id, company_id, company_name, mrr, client_status,
    contract_status, cs_owner_id, cs_owner_name, candidate_count,
    match_confidence, match_method, resolution_type
  from tax_matches
  union all
  select finance_id, company_id, company_name, mrr, client_status,
    contract_status, cs_owner_id, cs_owner_name, candidate_count,
    match_confidence, match_method, resolution_type
  from name_matches
), chosen_matches as (
  select distinct on (finance_id) finance_id, company_id, company_name, mrr,
    client_status, contract_status, cs_owner_id, cs_owner_name,
    candidate_count, match_confidence, match_method, resolution_type
  from all_matches
  order by finance_id, case match_method when 'economic_group' then 0 when 'cnpj' then 1 else 2 end, company_id
), matched as (
  select f.id, f.client_name, f.due_date, f.balance, f.aging_bucket,
    f.net_amount, f.finance_source_at, m.company_id, m.company_name, m.mrr,
    m.client_status, m.contract_status, m.cs_owner_id, m.cs_owner_name,
    m.candidate_count, m.match_confidence, m.match_method, m.resolution_type
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
    (select max(finished_at) from public.hubspot_sync_runs where status in ('success', 'succeeded')) hubspot_source_at
  from matched
), customer_success as (
  select
    count(*)::integer companies_total,
    count(*) filter (where c.cs_owner_id is not null)::integer assigned_customers,
    count(*) filter (where c.cs_owner_id is null)::integer customers_without_owner,
    count(*) filter (where nullif(c.client_status, '') is not null)::integer client_status_filled,
    count(*) filter (where nullif(c.contract_status, '') is not null)::integer contract_status_filled,
    max(c.synced_at) hubspot_source_at
  from public.hubspot_companies c
), support_cfg as (
  select hubspot_pipeline_id as pipeline_id
  from public.analytics_source_config
  where domain_key = 'cs' and object_type = 'ticket' and is_active
), support_quality as (
  select count(*) filter (where nullif(t.owner_id, '') is null)::integer support_unassigned,
    count(*) filter (where nullif(t.source_type, '') is null)::integer support_without_source
  from public.hubspot_tickets t join support_cfg c on c.pipeline_id = t.pipeline_id
), finance_payload as (
  select jsonb_build_object('titles', (select count(*) from finance), 'net_amount', (select coalesce(sum(net_amount), 0) from finance), 'balance', (select coalesce(sum(balance), 0) from finance), 'overdue_titles', (select count(*) from finance where aging_bucket = 'atrasado'), 'overdue_balance', (select coalesce(sum(balance) filter (where aging_bucket = 'atrasado'), 0) from finance), 'matched_titles', (select matched_finance_titles from quality), 'unmatched_titles', (select unmatched_finance_titles from quality)) value
), customer_success_payload as (
  select jsonb_build_object(
    'active_customers', null,
    'assigned_customers', assigned_customers,
    'customers_without_owner', customers_without_owner,
    'health_available', null,
    'risk_customers', null,
    'source', 'HubSpot',
    'as_of', hubspot_source_at,
    'last_successful_sync_at', hubspot_source_at,
    'status', case when companies_total = 0 then 'empty' else 'fresh' end,
    'reason', case when companies_total = 0 then 'O cache de empresas HubSpot nao possui registros disponiveis.' else 'Metricas de cliente ativo, health e risco nao possuem regra confirmada neste contrato.' end
  ) value
  from customer_success
), updated_quality as (
  select (select to_jsonb(quality) from quality) || jsonb_build_object(
    'support_unassigned', coalesce((select support_unassigned from support_quality), 0),
    'support_without_source', coalesce((select support_without_source from support_quality), 0)
  ) value
)
select case when app_private.can_read_analytics() then
  (select payload from base) || jsonb_build_object(
    'finance', (select value from finance_payload),
    'financial_alerts', coalesce((select jsonb_agg(to_jsonb(alerts) order by overdue_balance desc) from alerts), '[]'::jsonb),
    'customer_success', (select value from customer_success_payload),
    'product', jsonb_build_object('status', 'not_configured', 'source', 'Nenhuma fonte de Produto conectada', 'reason', 'O dominio Produto aguarda uma fonte operacional validada.'),
    'development', jsonb_build_object('status', 'not_configured', 'source', 'Nenhuma fonte de Desenvolvimento conectada', 'reason', 'O dominio Desenvolvimento aguarda uma fonte operacional validada.'),
    'data_quality', (select value from updated_quality)
  )
  else '{}'::jsonb end;
$$;

revoke all on function public.rpc_analytics_ceo_snapshot(date, date) from public, anon;
grant execute on function public.rpc_analytics_ceo_snapshot(date, date) to authenticated, service_role;

comment on function public.rpc_analytics_ceo_snapshot(date, date) is
  'Read model executivo API-only: financeiro somente OMIE API e relacionamento somente cache HubSpot confirmado.';
