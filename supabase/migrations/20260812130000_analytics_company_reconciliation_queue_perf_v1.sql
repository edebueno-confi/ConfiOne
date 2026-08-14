-- DASHBOARD-RECONCILIATION-PERF-V1
-- A fila de conciliacao consulta identidades OMIE reais contra o catalogo
-- HubSpot. Os candidatos por similaridade precisam usar o mesmo normalizador
-- do contrato para evitar uma varredura completa do catalogo a cada item.

begin;

create index if not exists hubspot_companies_reconciliation_name_trgm_idx
  on public.hubspot_companies
  using gin (app_private.normalize_company_name(name) extensions.gin_trgm_ops);

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
declare
  v_result jsonb;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  with client_index as (
    select c.client_code, c.client_name, c.client_tax_id, c.client_trade_name
    from public.analytics_finance_client_index_state s
    join public.analytics_finance_client_index_cache c
      on c.snapshot_id = s.current_snapshot_id
    where s.cache_key = 'omie_clients' and s.complete
  ), identified as (
    select
      coalesce(nullif(trim(f.client_name), ''), nullif(trim(i.client_name), '')) as source_name,
      coalesce(nullif(trim(f.client_trade_name), ''), nullif(trim(i.client_trade_name), '')) as source_trade_name,
      coalesce(
        nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), ''),
        nullif(regexp_replace(coalesce(i.client_tax_id, ''), '[^0-9]', '', 'g'), '')
      ) as source_tax_id,
      nullif(trim(f.raw_payload ->> 'codigo_cliente_fornecedor'), '') as omie_client_code,
      f.balance,
      f.aging_bucket,
      coalesce(
        app_private.company_reconciliation_source_key(
          coalesce(nullif(trim(f.client_name), ''), nullif(trim(i.client_name), '')),
          coalesce(
            nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), ''),
            nullif(regexp_replace(coalesce(i.client_tax_id, ''), '[^0-9]', '', 'g'), '')
          )
        ),
        case
          when nullif(trim(f.raw_payload ->> 'codigo_cliente_fornecedor'), '') is not null
            then 'omie:' || trim(f.raw_payload ->> 'codigo_cliente_fornecedor')
        end
      ) as source_key
    from public.analytics_finance_receivables f
    left join client_index i
      on i.client_code = nullif(trim(f.raw_payload ->> 'codigo_cliente_fornecedor'), '')
    where f.source_key = 'omie_receivables_api'
      and f.is_current
      and f.balance > 0
  ), source_rows as (
    select
      source_key,
      max(source_name) as source_name,
      max(source_trade_name) as source_trade_name,
      max(source_tax_id) as source_tax_id,
      max(omie_client_code) as omie_client_code,
      app_private.normalize_company_name(max(source_name)) as source_name_normalized,
      app_private.normalize_company_name(max(source_trade_name)) as source_trade_name_normalized,
      count(*)::integer as title_count,
      coalesce(sum(balance), 0)::numeric as total_balance,
      coalesce(sum(balance) filter (where aging_bucket = 'atrasado'), 0)::numeric as overdue_balance,
      case
        when max(source_name) is null
          and max(source_trade_name) is null
          and max(source_tax_id) is null
          then 'identity_unavailable'
        else 'identified'
      end as identity_state
    from identified
    where source_key is not null
    group by source_key
  ), rows_with_decisions as (
    select s.*, d.company_id as confirmed_company_id, d.status as decision_status
    from source_rows s
    left join public.analytics_company_reconciliation_decisions d
      on d.source_key = s.source_key
     and d.status = 'confirmed'
  ), items as (
    select jsonb_build_object(
      'source_key', r.source_key,
      'source_name', coalesce(r.source_name, r.source_trade_name, 'Cliente OMIE ' || coalesce(r.omie_client_code, 'sem codigo')),
      'source_trade_name', r.source_trade_name,
      'source_tax_id', r.source_tax_id,
      'omie_client_code', r.omie_client_code,
      'title_count', r.title_count,
      'total_balance', r.total_balance,
      'overdue_balance', r.overdue_balance,
      'identity_state', r.identity_state,
      'status', case when r.confirmed_company_id is not null then 'confirmed' else 'pending' end,
      'candidates', coalesce(c.payload, '[]'::jsonb)
    ) as value
    from rows_with_decisions r
    left join lateral (
      with candidate_companies as (
        select distinct on (candidate.company_id)
          candidate.company_id,
          candidate.name,
          candidate.tax_id,
          candidate.candidate_source
        from (
          select c.company_id, c.name, c.tax_id, 0::integer as candidate_source
          from public.hubspot_companies c
          where c.company_id = r.confirmed_company_id
          union all
          select c.company_id, c.name, c.tax_id, 1::integer
          from public.hubspot_companies c
          where r.source_tax_id is not null
            and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = r.source_tax_id
          union all
          select c.company_id, c.name, c.tax_id, 2::integer
          from public.hubspot_companies c
          where r.source_name_normalized is not null
            and app_private.normalize_company_name(c.name) = r.source_name_normalized
          union all
          select c.company_id, c.name, c.tax_id, 3::integer
          from public.hubspot_companies c
          where r.source_trade_name_normalized is not null
            and app_private.normalize_company_name(c.name) = r.source_trade_name_normalized
          union all
          select c.company_id, c.name, c.tax_id, 4::integer
          from public.hubspot_companies c
          where r.source_name_normalized is not null
            and app_private.normalize_company_name(c.name) operator(extensions.%) r.source_name_normalized
          union all
          select c.company_id, c.name, c.tax_id, 5::integer
          from public.hubspot_companies c
          where r.source_trade_name_normalized is not null
            and app_private.normalize_company_name(c.name) operator(extensions.%) r.source_trade_name_normalized
        ) candidate
        order by candidate.company_id, candidate.candidate_source
        limit 50
      ), scored as (
        select
          c.company_id,
          c.name,
          c.tax_id,
          case
            when r.source_tax_id is not null
              and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = r.source_tax_id
              then 1.0
            when r.source_name_normalized is not null
              and app_private.normalize_company_name(c.name) = r.source_name_normalized
              then 0.9
            when r.source_trade_name_normalized is not null
              and app_private.normalize_company_name(c.name) = r.source_trade_name_normalized
              then 0.88
            else greatest(
              coalesce(extensions.similarity(app_private.normalize_company_name(c.name), r.source_name_normalized), 0),
              coalesce(extensions.similarity(app_private.normalize_company_name(c.name), r.source_trade_name_normalized), 0)
            )
          end as score
        from candidate_companies c
      ), ranked as (
        select s.company_id, s.name, s.tax_id, s.score,
          c.cs_owner_id, c.client_status, c.mrr, d.status as decision_status
        from scored s
        join public.hubspot_companies c on c.company_id = s.company_id
        left join public.analytics_company_reconciliation_decisions d
          on d.source_key = r.source_key and d.company_id = s.company_id
        where (coalesce(d.status, '') <> 'discarded' or s.company_id = r.confirmed_company_id)
          and (s.score >= 0.4 or s.company_id = r.confirmed_company_id)
        order by s.score desc nulls last, s.company_id
        limit 10
      )
      select jsonb_agg(jsonb_build_object(
        'company_id', s.company_id,
        'company_name', s.name,
        'tax_id', s.tax_id,
        'owner_id', s.cs_owner_id,
        'client_status', s.client_status,
        'mrr', s.mrr,
        'score', round(s.score::numeric, 3),
        'confidence', case when s.score >= 0.99 then 'exact' when s.score >= 0.75 then 'probable' when s.score >= 0.4 then 'weak' else 'inconclusive' end,
        'reason', case
          when r.source_tax_id is not null and regexp_replace(coalesce(s.tax_id, ''), '[^0-9]', '', 'g') = r.source_tax_id then 'cnpj_exato'
          when r.source_name_normalized is not null and app_private.normalize_company_name(s.name) = r.source_name_normalized then 'nome_exato'
          when r.source_trade_name_normalized is not null and app_private.normalize_company_name(s.name) = r.source_trade_name_normalized then 'nome_fantasia_exato'
          else 'nome_similar'
        end,
        'matched_fields', to_jsonb(array_remove(array[
          case when r.source_tax_id is not null and regexp_replace(coalesce(s.tax_id, ''), '[^0-9]', '', 'g') = r.source_tax_id then 'CNPJ' end,
          case when r.source_name_normalized is not null and app_private.normalize_company_name(s.name) = r.source_name_normalized then 'Razao social' end,
          case when r.source_trade_name_normalized is not null and app_private.normalize_company_name(s.name) = r.source_trade_name_normalized then 'Nome fantasia' end
        ], null)),
        'differences', jsonb_strip_nulls(jsonb_build_object(
          'name', case when r.source_name is not null and app_private.normalize_company_name(s.name) <> r.source_name_normalized then jsonb_build_object('omie', r.source_name, 'hubspot', s.name) end,
          'tax_id', case when r.source_tax_id is not null and regexp_replace(coalesce(s.tax_id, ''), '[^0-9]', '', 'g') <> r.source_tax_id then jsonb_build_object('omie', r.source_tax_id, 'hubspot', s.tax_id) end
        )),
        'source', 'HubSpot companies cache',
        'decision', coalesce(s.decision_status, 'suggested')
      ) order by s.score desc nulls last, s.company_id) as payload
      from ranked s
    ) c on true
  ), paged_items as (
    select value
    from items
    order by value ->> 'status', value ->> 'source_name'
    limit greatest(1, least(p_limit, 500))
    offset greatest(p_offset, 0)
  )
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'total', (select count(*) from source_rows),
      'confirmed', (select count(*) from rows_with_decisions where confirmed_company_id is not null),
      'pending', (select count(*) from rows_with_decisions where confirmed_company_id is null),
      'identity_unavailable', (select count(*) from source_rows where identity_state = 'identity_unavailable'),
      'client_index_available', exists (select 1 from client_index)
    ),
    'items', coalesce((select jsonb_agg(value order by value ->> 'status', value ->> 'source_name') from paged_items), '[]'::jsonb)
  )
  into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_company_reconciliation_queue(integer, integer) is
  'Fila de governanca HubSpot OMIE enriquecida pelo indice de clientes OMIE, com candidatos, evidencias, confianca e impacto financeiro; sugestao nao e vinculo. Usa candidatos exatos e trigramas indexados.';

commit;
