-- A ausência de nome/CNPJ no snapshot OMIE não é ausência de empresa no HubSpot.
-- Este contrato mantém as duas situações separadas para que a interface não
-- transforme uma pendência de identidade em uma conclusão sobre o CRM.

create or replace function public.rpc_analytics_finance_reconciliation_v1(
  p_client_query text default null,
  p_limit integer default 200
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with open_book as (
  select
    f.balance,
    f.aging_bucket,
    nullif(trim(f.client_name), '') as client_name,
    nullif(trim(f.client_trade_name), '') as trade_name,
    nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') as tax_id,
    nullif(trim(f.raw_payload ->> 'codigo_cliente_fornecedor'), '') as omie_client_code
  from public.analytics_finance_receivables f
  where f.source_key = 'omie_receivables_api'
    and f.is_current
    and f.balance > 0
    and (
      nullif(trim(p_client_query), '') is null
      or coalesce(f.client_name, '') ilike '%' || trim(p_client_query) || '%'
      or coalesce(f.client_trade_name, '') ilike '%' || trim(p_client_query) || '%'
      or coalesce(f.raw_payload ->> 'codigo_cliente_fornecedor', '') ilike '%' || trim(p_client_query) || '%'
    )
), classified as (
  select
    b.*,
    c.client_status,
    case
      when b.tax_id is null and b.client_name is null then 'identity_missing'
      when b.tax_id is null then 'identity_incomplete'
      when c.company_id is not null then 'matched'
      else 'no_hubspot_company'
    end as reconciliation_state
  from open_book b
  left join lateral (
    select company_id, client_status
    from public.hubspot_companies c
    where regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = b.tax_id
    limit 1
  ) c on b.tax_id is not null
), by_client_status as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', key,
    'titles', titles,
    'balance', balance,
    'overdue_balance', overdue_balance
  ) order by balance desc), '[]'::jsonb) as value
  from (
    select
      case
        when reconciliation_state = 'matched' and nullif(client_status, '') is null then 'Sem status CS'
        when reconciliation_state = 'matched' then client_status
        when reconciliation_state = 'identity_missing' then 'Identidade OMIE indisponível'
        when reconciliation_state = 'identity_incomplete' then 'Identidade OMIE incompleta'
        else 'Sem empresa no HubSpot'
      end as key,
      count(*)::integer as titles,
      coalesce(sum(balance), 0)::numeric as balance,
      coalesce(sum(balance) filter (where aging_bucket = 'atrasado'), 0)::numeric as overdue_balance
    from classified
    group by 1
  ) rows
), summary as (
  select
    coalesce(sum(balance) filter (where reconciliation_state = 'matched'), 0)::numeric as matched_balance,
    coalesce(sum(balance) filter (where reconciliation_state <> 'matched'), 0)::numeric as unmatched_balance,
    coalesce(sum(balance) filter (where reconciliation_state = 'identity_missing'), 0)::numeric as identity_missing_balance,
    coalesce(sum(balance) filter (where reconciliation_state = 'identity_incomplete'), 0)::numeric as identity_incomplete_balance,
    coalesce(sum(balance) filter (where reconciliation_state = 'no_hubspot_company'), 0)::numeric as no_hubspot_company_balance,
    count(*) filter (where reconciliation_state = 'identity_missing')::integer as identity_missing_titles,
    count(*) filter (where reconciliation_state = 'identity_incomplete')::integer as identity_incomplete_titles,
    count(*) filter (where reconciliation_state = 'no_hubspot_company')::integer as no_hubspot_company_titles
  from classified
), unmatched_companies as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'client', client_name,
    'tax_id', tax_id,
    'trade_name', trade_name,
    'titles', titles,
    'balance', balance,
    'overdue_balance', overdue_balance,
    'name_matches', name_matches
  ) order by balance desc), '[]'::jsonb) as value
  from (
    select
      c.client_name,
      c.tax_id,
      max(c.trade_name) as trade_name,
      count(*)::integer as titles,
      coalesce(sum(c.balance), 0)::numeric as balance,
      coalesce(sum(c.balance) filter (where c.aging_bucket = 'atrasado'), 0)::numeric as overdue_balance,
      (
        select count(*)::integer
        from public.hubspot_companies h
        where c.client_name is not null
          and length(regexp_replace(upper(c.client_name), '[^[:alnum:]]', '', 'g')) >= 4
          and upper(regexp_replace(coalesce(h.name, ''), '[^[:alnum:]]', '', 'g')) like '%' || regexp_replace(upper(c.client_name), '[^[:alnum:]]', '', 'g') || '%'
      ) as name_matches
    from classified c
    where c.reconciliation_state = 'no_hubspot_company'
    group by c.client_name, c.tax_id
    order by balance desc
    limit greatest(least(coalesce(p_limit, 200), 500), 1)
  ) rows
), identity_issues as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'omie_client_code', omie_client_code,
    'titles', titles,
    'balance', balance,
    'overdue_balance', overdue_balance
  ) order by balance desc), '[]'::jsonb) as value
  from (
    select
      coalesce(omie_client_code, 'Sem código OMIE') as omie_client_code,
      count(*)::integer as titles,
      coalesce(sum(balance), 0)::numeric as balance,
      coalesce(sum(balance) filter (where aging_bucket = 'atrasado'), 0)::numeric as overdue_balance
    from classified
    where reconciliation_state in ('identity_missing', 'identity_incomplete')
    group by 1
    order by balance desc
    limit greatest(least(coalesce(p_limit, 200), 500), 1)
  ) rows
)
select case when app_private.can_read_analytics() then jsonb_build_object(
  'summary', (select to_jsonb(summary) from summary),
  'by_client_status', (select value from by_client_status),
  'unmatched_companies', (select value from unmatched_companies),
  'identity_issues', (select value from identity_issues)
) else '{}'::jsonb end;
$$;

comment on function public.rpc_analytics_finance_reconciliation_v1(text, integer) is
  'Read model financeiro: separa empresa OMIE identificada sem cadastro no HubSpot de pendência de identidade no snapshot OMIE.';

revoke all on function public.rpc_analytics_finance_reconciliation_v1(text, integer) from public, anon;
grant execute on function public.rpc_analytics_finance_reconciliation_v1(text, integer) to authenticated, service_role;

create or replace function public.rpc_analytics_customer_success_kpis_v2()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_version text;
  v_mrr_source text;
  v_active_rule text;
  v_threshold integer;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  select calculation_version, mrr_source, active_customer_rule, inactivity_threshold_days
    into v_version, v_mrr_source, v_active_rule, v_threshold
  from public.analytics_kpi_settings where id;
  v_version := coalesce(v_version, 'kpi_v1');
  v_mrr_source := coalesce(v_mrr_source, 'UNRESOLVED');
  v_active_rule := coalesce(v_active_rule, 'UNRESOLVED');
  v_threshold := coalesce(v_threshold, 30);

  with base as (
    select
      company_id, company_name, tax_id_normalized, client_status, contract_status,
      cs_owner_id, cs_owner_name, mrr, is_active_customer, last_activity_at,
      days_since_last_activity, inactivity_threshold_days, has_financial_link,
      open_balance, overdue_balance, open_titles, overdue_titles, max_overdue_days
    from public.vw_analytics_customer_financial_link
  ),
  active as (
    select
      company_id, company_name, tax_id_normalized, client_status, contract_status,
      cs_owner_id, cs_owner_name, mrr, is_active_customer, last_activity_at,
      days_since_last_activity, inactivity_threshold_days, has_financial_link,
      open_balance, overdue_balance, open_titles, overdue_titles, max_overdue_days
    from base
    where is_active_customer is true
  ),
  financial_identity as (
    select
      count(*) filter (where r.aging_bucket = 'atrasado')::integer as overdue_titles,
      coalesce(sum(r.balance) filter (where r.aging_bucket = 'atrasado'), 0)::numeric as overdue_balance,
      count(*) filter (
        where r.aging_bucket = 'atrasado'
          and nullif(trim(r.client_name), '') is null
          and nullif(regexp_replace(coalesce(r.client_tax_id, ''), '[^0-9]', '', 'g'), '') is null
      )::integer as identity_missing_overdue_titles,
      coalesce(sum(r.balance) filter (
        where r.aging_bucket = 'atrasado'
          and nullif(trim(r.client_name), '') is null
          and nullif(regexp_replace(coalesce(r.client_tax_id, ''), '[^0-9]', '', 'g'), '') is null
      ), 0)::numeric as identity_missing_overdue_balance
    from public.analytics_finance_receivables r
    where r.source_key = 'omie_receivables_api'
      and r.is_current
      and r.balance > 0
  ),
  assoc_coverage as (
    select
      (select count(*)::integer from public.hubspot_tickets) as tickets_total,
      (select count(distinct from_id)::integer from public.analytics_hubspot_associations
        where from_object_type = 'tickets' and to_object_type = 'companies') as tickets_linked
  ),
  tickets_by_company as (
    select tc.company_id,
      count(*) filter (where tc.is_open)::integer as open_tickets,
      count(*) filter (where tc.is_open and tc.priority = 'HIGH')::integer as open_critical_tickets
    from public.vw_analytics_ticket_company tc
    where tc.company_id is not null
    group by tc.company_id
  ),
  enriched as (
    select a.*, coalesce(t.open_tickets, 0) as open_tickets,
      coalesce(t.open_critical_tickets, 0) as open_critical_tickets
    from active a
    left join tickets_by_company t on t.company_id = a.company_id
  ),
  activity_coverage as (
    select count(*)::integer as total,
      count(*) filter (where last_activity_at is not null)::integer as with_activity
    from active
  ),
  totals as (
    select
      (select count(*)::integer from active) as active_customers,
      (select count(*)::integer from active where mrr is not null) as active_with_mrr,
      (select round(sum(mrr)::numeric, 2) from active where mrr is not null) as mrr_total,
      (select count(*)::integer from active where overdue_balance > 0) as overdue_customers,
      (select round(sum(mrr)::numeric, 2) from active where overdue_balance > 0 and mrr is not null) as mrr_overdue,
      (select round(sum(overdue_balance)::numeric, 2) from active where overdue_balance > 0) as overdue_amount,
      (select count(*)::integer from active where has_financial_link) as linked_customers,
      (select count(*)::integer from base where client_status = 'Churn') as churn_flagged,
      (select count(*)::integer from enriched where open_tickets > 0) as customers_with_tickets,
      (select round(sum(mrr)::numeric, 2) from enriched where open_critical_tickets > 0 and mrr is not null) as mrr_critical,
      (select count(*)::integer from active where days_since_last_activity > v_threshold) as inactive_customers,
      (select round(sum(mrr)::numeric, 2) from active where days_since_last_activity > v_threshold and mrr is not null) as mrr_inactive
  ),
  by_owner as (
    select coalesce(jsonb_agg(row_to_json(o) order by o.mrr desc nulls last), '[]'::jsonb) as payload
    from (
      select coalesce(e.cs_owner_id, '_unassigned') as owner_id,
        coalesce(e.cs_owner_name, 'Sem responsÃ¡vel') as owner_name,
        count(*)::integer as customers,
        round(sum(e.mrr)::numeric, 2) as mrr,
        count(*) filter (where e.overdue_balance > 0)::integer as overdue_customers,
        round(coalesce(sum(e.overdue_balance), 0)::numeric, 2) as overdue_amount,
        count(*) filter (where e.open_tickets > 0)::integer as customers_with_tickets,
        count(*) filter (where e.days_since_last_activity > v_threshold)::integer as inactive_customers
      from enriched e group by 1, 2
    ) o
  ),
  risk as (
    select coalesce(jsonb_agg(row_to_json(r) order by r.mrr_at_risk desc nulls last), '[]'::jsonb) as payload
    from (
      select 'financial_overdue' as signal, 'Títulos em atraso' as signal_label,
        count(*)::integer as customers, round(sum(mrr)::numeric, 2) as mrr_at_risk
      from enriched where overdue_balance > 0 and mrr is not null
      union all
      select 'contract_not_current', 'Contrato fora de vigência', count(*)::integer, round(sum(mrr)::numeric, 2)
      from enriched where mrr is not null and coalesce(contract_status, '') in ('Vencido', 'Encerrado')
      union all
      select 'critical_ticket_open', 'Atendimento crítico em aberto', count(*)::integer, round(sum(mrr)::numeric, 2)
      from enriched where open_critical_tickets > 0 and mrr is not null
      union all
      select 'no_recent_activity', 'Sem interação recente', count(*)::integer, round(sum(mrr)::numeric, 2)
      from enriched where days_since_last_activity > v_threshold and mrr is not null
    ) r where r.customers > 0
  ),
  top_overdue as (
    select coalesce(jsonb_agg(row_to_json(t) order by t.overdue_balance desc), '[]'::jsonb) as payload
    from (
      select company_id, company_name, cs_owner_name, mrr, overdue_balance,
        overdue_titles, max_overdue_days, open_tickets, days_since_last_activity
      from enriched where overdue_balance > 0
      order by overdue_balance desc limit 20
    ) t
  ),
  assoc_state as (
    select case when ac.tickets_linked = 0 then 'unavailable' when ac.tickets_linked < ac.tickets_total then 'partial' else 'available' end as state,
      case when ac.tickets_linked = 0 then 'associations_missing' when ac.tickets_linked < ac.tickets_total then 'associations_partial' else null end as reason
    from assoc_coverage ac
  ),
  activity_state as (
    select case when acv.with_activity = 0 then 'unavailable' when acv.with_activity < acv.total then 'partial' else 'available' end as state,
      case when acv.with_activity = 0 then 'activity_dates_missing' when acv.with_activity < acv.total then 'activity_partial' else null end as reason
    from activity_coverage acv
  )
  select jsonb_build_object(
    'meta', jsonb_build_object(
      'source', 'hubspot+omie',
      'calculation_version', v_version,
      'mrr_source', v_mrr_source,
      'active_customer_rule', v_active_rule,
      'inactivity_threshold_days', v_threshold,
      'freshness_at', (select max(synced_at) from public.hubspot_companies),
      'coverage_percent', app_private.kpi_ratio(tt.linked_customers, nullif(tt.active_customers, 0)),
      'is_partial', tt.linked_customers < tt.active_customers or fi.identity_missing_overdue_titles > 0,
      'warning_codes',
        (case when v_mrr_source = 'UNRESOLVED' then jsonb_build_array('mrr_source_unresolved') else '[]'::jsonb end)
        || (case when v_active_rule = 'UNRESOLVED' then jsonb_build_array('active_customer_rule_unresolved') else '[]'::jsonb end)
        || (case when tt.linked_customers < tt.active_customers then jsonb_build_array('missing_hubspot_omie_mapping') else '[]'::jsonb end)
        || (case when fi.identity_missing_overdue_titles > 0 then jsonb_build_array('omie_customer_identity_missing') else '[]'::jsonb end)
        || (case when ast.reason is not null then jsonb_build_array(ast.reason) else '[]'::jsonb end)
        || (case when act.reason is not null then jsonb_build_array(act.reason) else '[]'::jsonb end)
    ),
    'kpis', jsonb_build_object(
      'active_customers', app_private.kpi_entry(tt.active_customers::numeric, 'company_status_now', case when v_active_rule = 'UNRESOLVED' then 'unavailable' else 'available' end, case when v_active_rule = 'UNRESOLVED' then 'active_customer_rule_unresolved' else null end),
      'mrr_total', app_private.kpi_entry(tt.mrr_total, 'company_recurring_revenue_now', case when v_mrr_source = 'UNRESOLVED' then 'unavailable' when tt.active_with_mrr < tt.active_customers then 'partial' else 'available' end, case when v_mrr_source = 'UNRESOLVED' then 'mrr_source_unresolved' when tt.active_with_mrr < tt.active_customers then 'mrr_partial_coverage' else null end),
      'arpa', app_private.kpi_entry(case when tt.active_with_mrr > 0 then round(tt.mrr_total / tt.active_with_mrr, 2) else null end, 'company_recurring_revenue_now', case when v_mrr_source = 'UNRESOLVED' then 'unavailable' else 'available' end, case when v_mrr_source = 'UNRESOLVED' then 'mrr_source_unresolved' else null end),
      'overdue_customers', app_private.kpi_entry(case when fi.identity_missing_overdue_titles > 0 then null else tt.overdue_customers::numeric end, 'title_due_date_now', case when fi.identity_missing_overdue_titles > 0 then 'unavailable' else 'available' end, case when fi.identity_missing_overdue_titles > 0 then 'omie_customer_identity_missing' else null end),
      'overdue_amount', app_private.kpi_entry(case when fi.identity_missing_overdue_titles > 0 then null else nullif(tt.overdue_amount, 0) end, 'title_due_date_now', case when fi.identity_missing_overdue_titles > 0 then 'unavailable' else 'available' end, case when fi.identity_missing_overdue_titles > 0 then 'omie_customer_identity_missing' else null end),
      'mrr_overdue', app_private.kpi_entry(case when fi.identity_missing_overdue_titles > 0 then null else tt.mrr_overdue end, 'company_recurring_revenue_now', case when fi.identity_missing_overdue_titles > 0 or v_mrr_source = 'UNRESOLVED' then 'unavailable' else 'partial' end, case when fi.identity_missing_overdue_titles > 0 then 'omie_customer_identity_missing' when v_mrr_source = 'UNRESOLVED' then 'mrr_source_unresolved' else 'missing_hubspot_omie_mapping' end),
      'mapping_coverage_percent', app_private.kpi_entry(app_private.kpi_ratio(tt.linked_customers, nullif(tt.active_customers, 0)), 'company_tax_id_now'),
      'customers_with_open_tickets', app_private.kpi_entry(tt.customers_with_tickets::numeric, 'ticket_state_open_now', ast.state, ast.reason),
      'mrr_with_critical_ticket', app_private.kpi_entry(tt.mrr_critical, 'ticket_state_open_now', ast.state, ast.reason),
      'customers_without_recent_activity', app_private.kpi_entry(tt.inactive_customers::numeric, 'company_last_activity_at', act.state, act.reason),
      'mrr_without_recent_activity', app_private.kpi_entry(tt.mrr_inactive, 'company_last_activity_at', act.state, act.reason),
      'logo_churn_rate', app_private.kpi_entry(null, 'customer_status_transition', 'awaiting_history', 'history_insufficient'),
      'churned_mrr', app_private.kpi_entry(null, 'customer_status_transition', 'awaiting_history', 'history_insufficient'),
      'new_mrr', app_private.kpi_entry(null, 'customer_status_transition', 'awaiting_history', 'history_insufficient'),
      'nrr', app_private.kpi_entry(null, 'customer_status_transition', 'awaiting_history', 'history_insufficient'),
      'grr', app_private.kpi_entry(null, 'customer_status_transition', 'awaiting_history', 'history_insufficient')
    ),
    'by_owner', bo.payload,
    'risk_signals', rk.payload,
    'top_overdue_customers', tov.payload,
    'financial_identity', jsonb_build_object(
      'state', case when fi.identity_missing_overdue_titles > 0 then 'unavailable' else 'available' end,
      'reason', case when fi.identity_missing_overdue_titles > 0 then 'omie_customer_identity_missing' else null end,
      'overdue_titles', fi.overdue_titles,
      'overdue_balance', fi.overdue_balance,
      'identity_missing_overdue_titles', fi.identity_missing_overdue_titles,
      'identity_missing_overdue_balance', fi.identity_missing_overdue_balance
    ),
    'churn_flagged_customers', tt.churn_flagged,
    'source_coverage', jsonb_build_object('tickets', ac.tickets_total, 'tickets_linked', ac.tickets_linked, 'active_customers', acv.total, 'with_activity', acv.with_activity)
  )
  into v_result
  from totals tt
  cross join financial_identity fi
  cross join assoc_coverage ac
  cross join activity_coverage acv
  cross join assoc_state ast
  cross join activity_state act
  cross join by_owner bo
  cross join risk rk
  cross join top_overdue tov;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_customer_success_kpis_v2() is
  'KPIs de Customer Success: valores por cliente só são publicados quando o vínculo HubSpot↔OMIE é identificável; títulos sem identidade OMIE tornam a inadimplência por cliente indisponível.';
