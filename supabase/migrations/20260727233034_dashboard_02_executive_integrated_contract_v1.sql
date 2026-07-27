-- Contrato executivo integrado: amplia o read model existente sem alterar
-- tabelas, historico ou permissoes. Produto e Desenvolvimento permanecem
-- explicitamente sem fonte ate que exista um contrato de origem validado.
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
    (select max(finished_at) from public.hubspot_sync_runs where status in ('success', 'succeeded')) hubspot_source_at
  from matched
), customer_success as (
  select
    count(*) filter (where coalesce(active_subscription_count, 0) > 0 or coalesce(open_ticket_count, 0) > 0)::integer active_customers,
    count(*) filter (where cs_owner_user_id is not null or portfolio_owner_user_id is not null)::integer assigned_customers,
    count(*) filter (where cs_owner_user_id is null and portfolio_owner_user_id is null)::integer customers_without_owner,
    count(*) filter (where lower(coalesce(nullif(portfolio_health_status, ''), nullif(health_summary_status, ''), '')) not in ('', 'unavailable'))::integer health_available,
    count(*) filter (where lower(coalesce(portfolio_health_status, '')) in ('red', 'yellow', 'critical', 'at_risk'))::integer risk_customers,
    count(*)::integer total_rows
  from public.vw_cs_customer_portfolio
), support_cfg as (
  select hubspot_pipeline_id as pipeline_id
  from public.analytics_source_config
  where domain_key = 'cs' and object_type = 'ticket' and is_active
), support_quality as (
  select
    count(*) filter (where nullif(t.owner_id, '') is null)::integer support_unassigned,
    count(*) filter (where nullif(t.source_type, '') is null)::integer support_without_source
  from public.hubspot_tickets t
  join support_cfg c on c.pipeline_id = t.pipeline_id
), finance_payload as (
  select jsonb_build_object('titles', (select count(*) from finance), 'net_amount', (select coalesce(sum(net_amount), 0) from finance), 'balance', (select coalesce(sum(balance), 0) from finance), 'overdue_titles', (select count(*) from finance where aging_bucket = 'atrasado'), 'overdue_balance', (select coalesce(sum(balance) filter (where aging_bucket = 'atrasado'), 0) from finance), 'matched_titles', (select matched_finance_titles from quality), 'unmatched_titles', (select unmatched_finance_titles from quality)) value
), customer_success_payload as (
  select jsonb_build_object(
    'active_customers', active_customers,
    'assigned_customers', assigned_customers,
    'customers_without_owner', customers_without_owner,
    'health_available', health_available,
    'risk_customers', risk_customers,
    'source', 'Carteira CS',
    'as_of', (select hubspot_source_at from quality),
    'last_successful_sync_at', (select hubspot_source_at from quality),
    'status', case when total_rows = 0 then 'empty' else 'fresh' end,
    'reason', case when total_rows = 0 then 'A carteira CS ainda não possui registros disponíveis.' else null end
  ) value
  from customer_success
), updated_quality as (
  select (select to_jsonb(quality) from quality) || jsonb_build_object(
    'support_unassigned', coalesce((select support_unassigned from support_quality), 0),
    'support_without_source', coalesce((select support_without_source from support_quality), 0)
  ) value
)
select case when app_private.can_read_analytics() then
  (select payload from base)
  || jsonb_build_object(
    'finance', (select value from finance_payload),
    'financial_alerts', coalesce((select jsonb_agg(to_jsonb(alerts) order by overdue_balance desc) from alerts), '[]'::jsonb),
    'customer_success', (select value from customer_success_payload),
    'product', jsonb_build_object('status', 'not_configured', 'source', 'Nenhuma fonte de Produto conectada', 'reason', 'O domínio Produto aguarda uma fonte operacional validada.'),
    'development', jsonb_build_object('status', 'not_configured', 'source', 'Nenhuma fonte de Desenvolvimento conectada', 'reason', 'O domínio Desenvolvimento aguarda uma fonte operacional validada.'),
    'data_quality', (select value from updated_quality)
  )
  else '{}'::jsonb end;
$$;

revoke all on function public.rpc_analytics_ceo_snapshot(date, date) from public, anon;
grant execute on function public.rpc_analytics_ceo_snapshot(date, date) to authenticated, service_role;

comment on function public.rpc_analytics_ceo_snapshot(date, date) is
  'Read model executivo integrado: separa Customer Success de Suporte, explicita fontes nao configuradas e preserva estados honestos sem fabricar indicadores.';
