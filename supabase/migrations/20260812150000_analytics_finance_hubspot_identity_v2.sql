-- FINANCEIRO <-> HUBSPOT: identidade OMIE e candidatos de conciliação
--
-- O CNPJ exibido no cadastro HubSpot pode ser o CNPJ de uma filial, enquanto
-- cnpj__chave_unica_ representa a chave fiscal usada pela operação. O campo
-- tax_id continua preservando o CNPJ canônico já armazenado; a chave OMIE é
-- lida do raw apenas para reconciliação, sem sobrescrever o cadastro original.

begin;

create index if not exists hubspot_companies_omie_tax_id_idx
  on public.hubspot_companies (
    regexp_replace(
      coalesce(nullif(raw ->> 'cnpj__chave_unica_', ''), nullif(raw ->> 'cnpj_id', ''), tax_id, ''),
      '[^0-9]', '', 'g'
    )
  );

create index if not exists hubspot_companies_omie_client_id_idx
  on public.hubspot_companies (nullif(raw ->> 'omie_cliente_id', ''));

create or replace function public.rpc_analytics_finance_company_rollup()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
  v_source_key text;
begin
  if not (app_private.can_read_analytics() or auth.uid() is null) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  select case
    when exists (select 1 from public.analytics_finance_receivables where source_key = 'omie_receivables_api')
      then 'omie_receivables_api'
    else (
      select source_key from public.analytics_finance_receivables
      where source_key <> 'omie_receivables_api'
      order by created_at desc
      limit 1
    )
  end into v_source_key;

  with hubspot_identity as (
    select
      c.company_id,
      c.name,
      c.client_status,
      nullif(regexp_replace(
        coalesce(nullif(c.raw ->> 'cnpj__chave_unica_', ''), nullif(c.raw ->> 'cnpj_id', ''), c.tax_id, ''),
        '[^0-9]', '', 'g'
      ), '') as omie_tax_id,
      nullif(trim(c.raw ->> 'omie_cliente_id'), '') as omie_client_id
    from public.hubspot_companies c
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'company_id', company_id,
    'company_name', company_name,
    'omie_client_code', omie_client_code,
    'saldo_aberto', saldo_aberto,
    'saldo_vencido', saldo_vencido,
    'titulos_abertos', titulos_abertos,
    'atraso_medio_dias', atraso_medio_dias,
    'situacao', situacao
  ) order by saldo_aberto desc), '[]'::jsonb)
  into result
  from (
    select
      c.company_id,
      max(c.name) as company_name,
      max(nullif(trim(f.raw_payload ->> 'codigo_cliente_fornecedor'), '')) as omie_client_code,
      round(sum(f.balance)::numeric, 2) as saldo_aberto,
      round(coalesce(sum(f.balance) filter (where f.aging_bucket = 'atrasado'), 0)::numeric, 2) as saldo_vencido,
      count(*)::integer as titulos_abertos,
      coalesce(round(avg(current_date - f.due_date) filter (where f.aging_bucket = 'atrasado' and f.due_date is not null), 0), 0)::integer as atraso_medio_dias,
      case
        when coalesce(sum(f.balance) filter (where f.aging_bucket = 'atrasado'), 0) = 0 then 'a_vencer'
        when sum(f.balance) filter (where f.aging_bucket = 'atrasado') >= 0.5 * sum(f.balance) then 'critico'
        else 'vencido'
      end as situacao
    from public.analytics_finance_receivables f
    join hubspot_identity c
      on (
        nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
        and c.omie_tax_id = nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '')
      )
      or (
        nullif(trim(f.raw_payload ->> 'codigo_cliente_fornecedor'), '') is not null
        and c.omie_client_id = nullif(trim(f.raw_payload ->> 'codigo_cliente_fornecedor'), '')
      )
    where v_source_key is not null
      and f.source_key = v_source_key
      and f.balance > 0
    group by c.company_id
  ) x;

  return result;
end;
$$;

comment on function public.rpc_analytics_finance_company_rollup() is
  'Rollup financeiro por empresa HubSpot usando CNPJ OMIE, chave fiscal alternativa e código OMIE já publicado; somente leitura.';

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
  join public.analytics_finance_client_index_cache c on c.snapshot_id = s.current_snapshot_id
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
), identified as (
  select
    b.*,
    coalesce(
      app_private.company_reconciliation_source_key(b.client_name, b.tax_id),
      case when b.omie_client_code is not null then 'omie:' || b.omie_client_code end
    ) as source_key
  from open_book_base b
), hubspot_identity as (
  select
    c.company_id,
    c.name,
    c.tax_id,
    c.client_status,
    c.cs_owner_id,
    c.mrr,
    nullif(regexp_replace(
      coalesce(nullif(c.raw ->> 'cnpj__chave_unica_', ''), nullif(c.raw ->> 'cnpj_id', ''), c.tax_id, ''),
      '[^0-9]', '', 'g'
    ), '') as omie_tax_id,
    nullif(trim(c.raw ->> 'omie_cliente_id'), '') as omie_client_id
  from public.hubspot_companies c
), classified as (
  select
    b.*,
    coalesce(manual.company_id, exact_company.company_id) as company_id,
    coalesce(manual_company.client_status, exact_company.client_status) as client_status,
    coalesce(
      case when manual.company_id is not null then 'vinculo_confirmado' end,
      exact_company.match_method
    ) as match_method,
    case
      when b.client_name is null and b.trade_name is null and b.tax_id is null then 'identity_missing'
      when b.tax_id is null and manual.company_id is null and exact_company.company_id is null then 'identity_incomplete'
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
    select h.company_id, h.client_status,
      case
        when b.omie_client_code is not null and h.omie_client_id = b.omie_client_code then 'omie_id_exato'
        when b.tax_id is not null and h.omie_tax_id = b.tax_id then 'cnpj_omie_exato'
        else 'cnpj_exato'
      end as match_method
    from hubspot_identity h
    where (
      (b.omie_client_code is not null and h.omie_client_id = b.omie_client_code)
      or (b.tax_id is not null and h.omie_tax_id = b.tax_id)
    )
    and (
      select count(*) from hubspot_identity h2
      where (b.omie_client_code is not null and h2.omie_client_id = b.omie_client_code)
         or (b.tax_id is not null and h2.omie_tax_id = b.tax_id)
    ) = 1
    order by case when b.omie_client_code is not null and h.omie_client_id = b.omie_client_code then 0 else 1 end, h.company_id
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
      'reason', ranked.reason
    ) order by ranked.score desc, ranked.company_id), '[]'::jsonb) as payload
    from (
      select h.company_id, h.name as company_name, h.tax_id,
        case
          when app_private.normalize_company_name(h.name) = app_private.normalize_company_name(coalesce(u.trade_name, u.client_name)) then 0.95
          when length(coalesce(app_private.normalize_company_name(h.name), '')) >= 4
            and position(app_private.normalize_company_name(h.name) in app_private.normalize_company_name(coalesce(u.client_name, u.trade_name))) > 0 then 0.82
          when length(coalesce(app_private.normalize_company_name(coalesce(u.trade_name, u.client_name)), '')) >= 4
            and position(app_private.normalize_company_name(coalesce(u.trade_name, u.client_name)) in app_private.normalize_company_name(h.name)) > 0 then 0.82
          else greatest(
            coalesce(extensions.similarity(app_private.normalize_company_name(h.name), app_private.normalize_company_name(u.client_name)), 0),
            coalesce(extensions.similarity(app_private.normalize_company_name(h.name), app_private.normalize_company_name(u.trade_name)), 0)
          )
        end as score,
        case
          when app_private.normalize_company_name(h.name) = app_private.normalize_company_name(coalesce(u.trade_name, u.client_name)) then 'nome_exato'
          when length(coalesce(app_private.normalize_company_name(h.name), '')) >= 4
            and (position(app_private.normalize_company_name(h.name) in app_private.normalize_company_name(coalesce(u.client_name, u.trade_name))) > 0
              or position(app_private.normalize_company_name(coalesce(u.trade_name, u.client_name)) in app_private.normalize_company_name(h.name)) > 0) then 'nome_contido'
          else 'nome_similar'
        end as reason
      from hubspot_identity h
      where (
        app_private.normalize_company_name(h.name) = app_private.normalize_company_name(coalesce(u.trade_name, u.client_name))
        or (
          length(coalesce(app_private.normalize_company_name(h.name), '')) >= 4
          and (
            position(app_private.normalize_company_name(h.name) in app_private.normalize_company_name(coalesce(u.client_name, u.trade_name))) > 0
            or position(app_private.normalize_company_name(coalesce(u.trade_name, u.client_name)) in app_private.normalize_company_name(h.name)) > 0
          )
        )
        or extensions.similarity(app_private.normalize_company_name(h.name), app_private.normalize_company_name(u.client_name)) >= 0.4
        or extensions.similarity(app_private.normalize_company_name(h.name), app_private.normalize_company_name(u.trade_name)) >= 0.4
      )
      order by score desc, h.company_id
      limit 5
    ) ranked
  ) candidates on true
  limit greatest(least(coalesce(p_limit, 200), 500), 1)
), identity_issues as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'omie_client_code', omie_client_code, 'titles', titles, 'balance', balance, 'overdue_balance', overdue_balance
  ) order by balance desc), '[]'::jsonb) as value
  from (
    select coalesce(omie_client_code, 'Sem codigo OMIE') as omie_client_code,
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
  'Read model financeiro com CNPJ OMIE, chave fiscal alternativa, candidatos por nome e vínculo por código OMIE; nenhuma sugestão de nome é aplicada automaticamente.';

revoke all on function public.rpc_analytics_finance_company_rollup() from public, anon;
grant execute on function public.rpc_analytics_finance_company_rollup() to authenticated, service_role;
revoke all on function public.rpc_analytics_finance_reconciliation_v1(text, integer) from public, anon;
grant execute on function public.rpc_analytics_finance_reconciliation_v1(text, integer) to authenticated, service_role;

commit;
