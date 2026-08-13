-- FINANCE-RECONCILIATION-PERF-V3
-- Reduz o custo do RPC financeiro evitando a busca correlacionada repetida
-- de candidatos exatos para cada título. A regra de vínculo permanece a mesma:
-- CNPJ/código OMIE único ou decisão manual confirmada; nome apenas sugere.

begin;

create index if not exists analytics_company_reconciliation_decisions_decided_by_idx
  on public.analytics_company_reconciliation_decisions (decided_by_user_id);

create index if not exists analytics_company_reconciliation_decisions_company_idx
  on public.analytics_company_reconciliation_decisions (company_id);

create or replace function public.rpc_analytics_finance_reconciliation_v2(
  p_client_query text default null,
  p_limit integer default 200
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with client_index as materialized (
  select c.client_code, c.client_name, c.client_tax_id, c.client_trade_name
  from public.analytics_finance_client_index_state s
  join public.analytics_finance_client_index_cache c on c.snapshot_id = s.current_snapshot_id
  where s.cache_key = 'omie_clients' and s.complete
), open_book as materialized (
  select
    f.id as receivable_id,
    f.balance,
    f.aging_bucket,
    coalesce(nullif(trim(f.client_name), ''), nullif(trim(i.client_name), '')) as client_name,
    coalesce(nullif(trim(f.client_trade_name), ''), nullif(trim(i.client_trade_name), '')) as trade_name,
    coalesce(
      nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), ''),
      nullif(regexp_replace(coalesce(i.client_tax_id, ''), '[^0-9]', '', 'g'), '')
    ) as tax_id,
    nullif(trim(f.raw_payload ->> 'codigo_cliente_fornecedor'), '') as omie_client_code
  from public.analytics_finance_receivables f
  left join client_index i on i.client_code = nullif(trim(f.raw_payload ->> 'codigo_cliente_fornecedor'), '')
  where f.source_key = 'omie_receivables_api'
    and f.is_current
    and f.balance > 0
    and (
      nullif(trim(p_client_query), '') is null
      or coalesce(f.client_name, i.client_name, '') ilike '%' || trim(p_client_query) || '%'
      or coalesce(f.client_trade_name, i.client_trade_name, '') ilike '%' || trim(p_client_query) || '%'
      or coalesce(f.raw_payload ->> 'codigo_cliente_fornecedor', '') ilike '%' || trim(p_client_query) || '%'
    )
), identified as materialized (
  select
    b.*,
    coalesce(
      app_private.company_reconciliation_source_key(b.client_name, b.tax_id),
      case when b.omie_client_code is not null then 'omie:' || b.omie_client_code end
    ) as source_key
  from open_book b
), hubspot_identity as materialized (
  select
    c.company_id,
    c.name,
    c.tax_id,
    c.client_status,
    nullif(regexp_replace(coalesce(
      nullif(c.raw ->> 'cnpj__chave_unica_', ''),
      nullif(c.raw ->> 'cnpj_id', ''),
      c.tax_id,
      ''
    ), '[^0-9]', '', 'g'), '') as omie_tax_id,
    nullif(trim(c.raw ->> 'omie_cliente_id'), '') as omie_client_id
  from public.hubspot_companies c
), exact_candidates as (
  select b.receivable_id, h.company_id, 0 as priority
  from identified b
  join hubspot_identity h on h.omie_client_id = b.omie_client_code
  where b.omie_client_code is not null
  union all
  select b.receivable_id, h.company_id, 1 as priority
  from identified b
  join hubspot_identity h on h.omie_tax_id = b.tax_id
  where b.tax_id is not null
), exact_unique as (
  select receivable_id, min(company_id) as company_id
  from exact_candidates
  group by receivable_id
  having count(*) = 1
), classified as (
  select
    b.*,
    manual.company_id as manual_company_id,
    exact.company_id as exact_company_id,
    coalesce(manual.company_id, exact.company_id) as company_id,
    coalesce(manual_company.client_status, exact_company.client_status) as client_status,
    case
      when b.client_name is null and b.trade_name is null and b.tax_id is null then 'identity_missing'
      when b.tax_id is null and manual.company_id is null and exact.company_id is null then 'identity_incomplete'
      when manual.company_id is not null or exact.company_id is not null then 'matched'
      else 'no_hubspot_company'
    end as reconciliation_state
  from identified b
  left join public.analytics_company_reconciliation_decisions manual
    on manual.source_key = b.source_key and manual.status = 'confirmed'
  left join public.hubspot_companies manual_company on manual_company.company_id = manual.company_id
  left join exact_unique exact on exact.receivable_id = b.receivable_id
  left join hubspot_identity exact_company on exact_company.company_id = exact.company_id
), by_client_status as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', key, 'titles', titles, 'balance', balance, 'overdue_balance', overdue_balance
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
), unmatched_sources as (
  select
    c.client_name,
    c.tax_id,
    max(c.trade_name) as trade_name,
    max(c.omie_client_code) as omie_client_code,
    count(*)::integer as titles,
    coalesce(sum(c.balance), 0)::numeric as balance,
    coalesce(sum(c.balance) filter (where c.aging_bucket = 'atrasado'), 0)::numeric as overdue_balance
  from classified c
  where c.reconciliation_state = 'no_hubspot_company'
  group by c.client_name, c.tax_id
), unmatched_companies as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'client', u.client_name,
    'tax_id', u.tax_id,
    'trade_name', u.trade_name,
    'omie_client_code', u.omie_client_code,
    'titles', u.titles,
    'balance', u.balance,
    'overdue_balance', u.overdue_balance,
    'name_matches', jsonb_array_length(coalesce(candidates.payload, '[]'::jsonb)),
    'candidate_companies', coalesce(candidates.payload, '[]'::jsonb)
  ) order by u.balance desc), '[]'::jsonb) as value
  from unmatched_sources u
  left join lateral (
    select coalesce(jsonb_agg(jsonb_build_object(
      'company_id', ranked.company_id,
      'company_name', ranked.company_name,
      'tax_id', ranked.tax_id,
      'score', round(ranked.score::numeric, 3),
      'confidence', case when ranked.score >= 0.9 then 'probable' when ranked.score >= 0.4 then 'weak' else 'inconclusive' end,
      'reason', ranked.reason,
      'source', 'HubSpot companies cache'
    ) order by ranked.score desc, ranked.company_id), '[]'::jsonb) as payload
    from (
      select ranked.company_id, ranked.company_name, ranked.tax_id, ranked.score,
        case
          when ranked.score >= 0.99 then 'nome_exato'
          else 'nome_similar'
        end as reason
      from (
        select distinct on (h.company_id)
          h.company_id,
          h.name as company_name,
          h.tax_id,
          greatest(
            extensions.similarity(app_private.normalize_company_name(h.name), app_private.normalize_company_name(coalesce(u.client_name, u.trade_name))),
            extensions.similarity(app_private.normalize_company_name(h.name), app_private.normalize_company_name(coalesce(u.trade_name, u.client_name)))
          ) as score
        from public.hubspot_companies h
        where (
          app_private.normalize_company_name(h.name) operator(extensions.%) app_private.normalize_company_name(coalesce(u.client_name, u.trade_name))
          or app_private.normalize_company_name(h.name) operator(extensions.%) app_private.normalize_company_name(coalesce(u.trade_name, u.client_name))
        )
        order by h.company_id, score desc
      ) ranked
      order by ranked.score desc, ranked.company_id
      limit 5
    ) ranked
  ) candidates on true
), identity_issues as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'omie_client_code', omie_client_code, 'titles', titles, 'balance', balance, 'overdue_balance', overdue_balance
  ) order by balance desc), '[]'::jsonb) as value
  from (
    select coalesce(omie_client_code, 'Sem código OMIE') as omie_client_code,
      count(*)::integer as titles, coalesce(sum(balance), 0)::numeric as balance,
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

revoke all on function public.rpc_analytics_finance_reconciliation_v2(text, integer) from public, anon;
grant execute on function public.rpc_analytics_finance_reconciliation_v2(text, integer) to authenticated, service_role;

comment on function public.rpc_analytics_finance_reconciliation_v2(text, integer) is
  'Conciliação financeira HubSpot OMIE otimizada: candidatos exatos são pré-calculados uma vez por título; nomes continuam sendo apenas sugestão.';

commit;
