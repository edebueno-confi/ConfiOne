-- CONCILIACAO OPERACIONAL HUBSPOT <-> OMIE
--
-- O indice de clientes OMIE ja e publicado como snapshot privado durante a
-- sincronizacao. A fila de governanca precisa consumi-lo para nao deixar o
-- usuario apenas com o codigo tecnico do titulo quando o recebivel nao foi
-- enriquecido na mesma chamada.
--
-- Nenhum vinculo e aplicado automaticamente. A decisao continua sendo humana,
-- auditada e restrita ao RPC administrativo existente.

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
with client_index as (
  select c.client_code, c.client_name, c.client_tax_id, c.client_trade_name
  from public.analytics_finance_client_index_state s
  join public.analytics_finance_client_index_cache c
    on c.snapshot_id = s.current_snapshot_id
  where s.cache_key = 'omie_clients' and s.complete
), open_book_base as (
  select
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
  left join client_index i
    on i.client_code = nullif(trim(f.raw_payload ->> 'codigo_cliente_fornecedor'), '')
  where f.source_key = 'omie_receivables_api'
    and f.is_current
    and f.balance > 0
    and (
      nullif(trim(p_client_query), '') is null
      or coalesce(f.client_name, i.client_name, '') ilike '%' || trim(p_client_query) || '%'
      or coalesce(f.client_trade_name, i.client_trade_name, '') ilike '%' || trim(p_client_query) || '%'
      or coalesce(f.raw_payload ->> 'codigo_cliente_fornecedor', '') ilike '%' || trim(p_client_query) || '%'
    )
), identified as (
  select
    b.*,
    coalesce(
      app_private.company_reconciliation_source_key(b.client_name, b.tax_id),
      case when b.omie_client_code is not null then 'omie:' || b.omie_client_code end
    ) as source_key
  from open_book_base b
), classified as (
  select
    b.*,
    coalesce(manual.company_id, exact_company.company_id) as company_id,
    coalesce(manual_company.client_status, exact_company.client_status) as client_status,
    case
      when b.client_name is null and b.trade_name is null and b.tax_id is null then 'identity_missing'
      when b.tax_id is null and manual.company_id is null then 'identity_incomplete'
      when manual.company_id is not null or exact_company.company_id is not null then 'matched'
      else 'no_hubspot_company'
    end as reconciliation_state
  from identified b
  left join public.analytics_company_reconciliation_decisions manual
    on manual.source_key = b.source_key and manual.status = 'confirmed'
  left join lateral (
    select c.client_status
    from public.hubspot_companies c
    where c.company_id = manual.company_id
    limit 1
  ) manual_company on true
  left join lateral (
    select c.company_id, c.client_status
    from public.hubspot_companies c
    where b.tax_id is not null
      and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = b.tax_id
    order by c.company_id
    limit 1
  ) exact_company on true
), by_client_status as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'key', key, 'titles', titles, 'balance', balance, 'overdue_balance', overdue_balance
  ) order by balance desc), '[]'::jsonb) as value
  from (
    select
      case
        when reconciliation_state = 'matched' and nullif(client_status, '') is null then 'Sem status CS'
        when reconciliation_state = 'matched' then client_status
        when reconciliation_state = 'identity_missing' then 'Identidade OMIE indisponivel'
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
    'client', client_name, 'tax_id', tax_id, 'trade_name', trade_name,
    'omie_client_code', omie_client_code, 'titles', titles, 'balance', balance,
    'overdue_balance', overdue_balance, 'name_matches', name_matches
  ) order by balance desc), '[]'::jsonb) as value
  from (
    select
      c.client_name, c.tax_id, max(c.trade_name) as trade_name,
      max(c.omie_client_code) as omie_client_code, count(*)::integer as titles,
      coalesce(sum(c.balance), 0)::numeric as balance,
      coalesce(sum(c.balance) filter (where c.aging_bucket = 'atrasado'), 0)::numeric as overdue_balance,
      (
        select count(*)::integer from public.hubspot_companies h
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
    'omie_client_code', omie_client_code, 'titles', titles, 'balance', balance,
    'overdue_balance', overdue_balance
  ) order by balance desc), '[]'::jsonb) as value
  from (
    select coalesce(omie_client_code, 'Sem codigo OMIE') as omie_client_code,
      count(*)::integer as titles, coalesce(sum(balance), 0)::numeric as balance,
      coalesce(sum(balance) filter (where aging_bucket = 'atrasado'), 0)::numeric as overdue_balance
    from classified
    where reconciliation_state in ('identity_missing', 'identity_incomplete')
    group by 1 order by balance desc
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
  'Read model financeiro que enriquece recebiveis pelo indice de clientes OMIE e respeita vinculos HubSpot confirmados na Governanca.';

create or replace function public.rpc_analytics_company_reconciliation_queue(
  p_limit integer default 100,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_result jsonb;
begin
  if not app_private.can_read_analytics() then raise exception 'Acesso negado.' using errcode = '42501'; end if;
  with client_index as (
    select c.client_code, c.client_name, c.client_tax_id, c.client_trade_name
    from public.analytics_finance_client_index_state s
    join public.analytics_finance_client_index_cache c on c.snapshot_id = s.current_snapshot_id
    where s.cache_key = 'omie_clients' and s.complete
  ), identified as (
    select coalesce(nullif(trim(f.client_name), ''), nullif(trim(i.client_name), '')) as source_name,
      coalesce(nullif(trim(f.client_trade_name), ''), nullif(trim(i.client_trade_name), '')) as source_trade_name,
      coalesce(nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), ''), nullif(regexp_replace(coalesce(i.client_tax_id, ''), '[^0-9]', '', 'g'), '')) as source_tax_id,
      nullif(trim(f.raw_payload ->> 'codigo_cliente_fornecedor'), '') as omie_client_code,
      f.balance, f.aging_bucket,
      coalesce(app_private.company_reconciliation_source_key(
        coalesce(nullif(trim(f.client_name), ''), nullif(trim(i.client_name), '')),
        coalesce(nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), ''), nullif(regexp_replace(coalesce(i.client_tax_id, ''), '[^0-9]', '', 'g'), ''))
      ), case when nullif(trim(f.raw_payload ->> 'codigo_cliente_fornecedor'), '') is not null then 'omie:' || trim(f.raw_payload ->> 'codigo_cliente_fornecedor') end) as source_key
    from public.analytics_finance_receivables f
    left join client_index i on i.client_code = nullif(trim(f.raw_payload ->> 'codigo_cliente_fornecedor'), '')
    where f.source_key = 'omie_receivables_api' and f.is_current and f.balance > 0
  ), source_rows as (
    select source_key, max(source_name) as source_name, max(source_trade_name) as source_trade_name,
      max(source_tax_id) as source_tax_id, max(omie_client_code) as omie_client_code,
      count(*)::integer as title_count, coalesce(sum(balance), 0)::numeric as total_balance,
      coalesce(sum(balance) filter (where aging_bucket = 'atrasado'), 0)::numeric as overdue_balance,
      case when max(source_name) is null and max(source_trade_name) is null and max(source_tax_id) is null then 'identity_unavailable' else 'identified' end as identity_state
    from identified where source_key is not null group by source_key
  ), rows_with_decisions as (
    select s.*, d.company_id as confirmed_company_id
    from source_rows s left join public.analytics_company_reconciliation_decisions d on d.source_key = s.source_key and d.status = 'confirmed'
  ), items as (
    select jsonb_build_object('source_key', r.source_key,
      'source_name', coalesce(r.source_name, r.source_trade_name, 'Cliente OMIE ' || coalesce(r.omie_client_code, 'sem codigo')),
      'source_trade_name', r.source_trade_name, 'source_tax_id', r.source_tax_id,
      'omie_client_code', r.omie_client_code, 'title_count', r.title_count,
      'total_balance', r.total_balance, 'overdue_balance', r.overdue_balance,
      'identity_state', r.identity_state,
      'status', case when r.confirmed_company_id is not null then 'confirmed' else 'pending' end,
      'candidates', coalesce(c.payload, '[]'::jsonb)) as value
    from rows_with_decisions r
    left join lateral (
      select jsonb_agg(jsonb_build_object('company_id', c.company_id, 'company_name', c.name,
        'tax_id', c.tax_id, 'owner_id', c.cs_owner_id, 'client_status', c.client_status,
        'mrr', c.mrr, 'score', round(g.score::numeric, 3),
        'confidence', case when g.score >= 0.99 then 'exact' when g.score >= 0.75 then 'probable' when g.score >= 0.4 then 'weak' else 'inconclusive' end,
        'reason', g.reason, 'matched_fields', g.matched_fields, 'differences', g.differences,
            'source', 'HubSpot companies cache', 'decision', coalesce(d.status, 'suggested')) order by g.score desc nulls last, c.company_id) as payload
      from (select c.* from public.hubspot_companies c
        where c.company_id = r.confirmed_company_id
           or (r.source_tax_id is not null and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = r.source_tax_id)
           or (r.source_name is not null and app_private.normalize_company_name(c.name) = app_private.normalize_company_name(r.source_name))
           or (r.source_trade_name is not null and app_private.normalize_company_name(c.name) = app_private.normalize_company_name(r.source_trade_name))
           or (r.source_name is not null and extensions.similarity(app_private.normalize_company_name(c.name), app_private.normalize_company_name(r.source_name)) >= 0.4)
           or (r.source_trade_name is not null and extensions.similarity(app_private.normalize_company_name(c.name), app_private.normalize_company_name(r.source_trade_name)) >= 0.4)
        order by case when c.company_id = r.confirmed_company_id then 0 else 1 end, c.company_id limit 10) c
      cross join lateral (select
        case when r.source_tax_id is not null and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = r.source_tax_id then 1.0
          when r.source_name is not null and app_private.normalize_company_name(c.name) = app_private.normalize_company_name(r.source_name) then 0.9
          when r.source_trade_name is not null and app_private.normalize_company_name(c.name) = app_private.normalize_company_name(r.source_trade_name) then 0.88
          else greatest(coalesce(extensions.similarity(app_private.normalize_company_name(c.name), app_private.normalize_company_name(r.source_name)), 0), coalesce(extensions.similarity(app_private.normalize_company_name(c.name), app_private.normalize_company_name(r.source_trade_name)), 0)) end as score,
        case when r.source_tax_id is not null and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = r.source_tax_id then 'cnpj_exato'
          when r.source_name is not null and app_private.normalize_company_name(c.name) = app_private.normalize_company_name(r.source_name) then 'nome_exato'
          when r.source_trade_name is not null and app_private.normalize_company_name(c.name) = app_private.normalize_company_name(r.source_trade_name) then 'nome_fantasia_exato' else 'nome_similar' end as reason,
        to_jsonb(array_remove(array[case when r.source_tax_id is not null and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = r.source_tax_id then 'CNPJ' end, case when r.source_name is not null and app_private.normalize_company_name(c.name) = app_private.normalize_company_name(r.source_name) then 'Razao social' end, case when r.source_trade_name is not null and app_private.normalize_company_name(c.name) = app_private.normalize_company_name(r.source_trade_name) then 'Nome fantasia' end], null)) as matched_fields,
        jsonb_strip_nulls(jsonb_build_object('name', case when r.source_name is not null and app_private.normalize_company_name(c.name) <> app_private.normalize_company_name(r.source_name) then jsonb_build_object('omie', r.source_name, 'hubspot', c.name) end, 'tax_id', case when r.source_tax_id is not null and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') <> r.source_tax_id then jsonb_build_object('omie', r.source_tax_id, 'hubspot', c.tax_id) end)) as differences
      ) g
      left join public.analytics_company_reconciliation_decisions d on d.source_key = r.source_key and d.company_id = c.company_id
      where coalesce(d.status, '') <> 'discarded' or c.company_id = r.confirmed_company_id
    ) c on true
  ), paged_items as (select value from items order by value ->> 'status', value ->> 'source_name' limit greatest(1, least(p_limit, 500)) offset greatest(p_offset, 0))
  select jsonb_build_object('summary', jsonb_build_object('total', (select count(*) from source_rows), 'confirmed', (select count(*) from rows_with_decisions where confirmed_company_id is not null), 'pending', (select count(*) from rows_with_decisions where confirmed_company_id is null), 'identity_unavailable', (select count(*) from source_rows where identity_state = 'identity_unavailable'), 'client_index_available', exists (select 1 from client_index)), 'items', coalesce((select jsonb_agg(value order by value ->> 'status', value ->> 'source_name') from paged_items), '[]'::jsonb)) into v_result;
  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_company_reconciliation_queue(integer, integer) is
  'Fila de governanca HubSpot OMIE enriquecida pelo indice de clientes OMIE, com candidatos, evidencias, confianca e impacto financeiro; sugestao nao e vinculo.';
