-- Identidades alternativas de empresas HubSpot para triagem de conciliacao OMIE.
-- CNPJ unico continua sendo o unico vinculo automatico. Razao social, nome
-- fantasia e campos equivalentes apenas ampliam candidatas para revisao humana.

create or replace function app_private.hubspot_company_identity_aliases(
  p_name text,
  p_raw jsonb
)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array_remove(array[
    app_private.normalize_company_name(p_name),
    app_private.normalize_company_name(p_raw ->> 'legal_name'),
    app_private.normalize_company_name(p_raw ->> 'razao_social'),
    app_private.normalize_company_name(p_raw ->> 'nome_fantasia___aftersale'),
    app_private.normalize_company_name(p_raw ->> 'nome_fantasia')
  ], null);
$$;

revoke all on function app_private.hubspot_company_identity_aliases(text, jsonb) from public, anon, authenticated;
grant execute on function app_private.hubspot_company_identity_aliases(text, jsonb) to service_role;

create or replace function public.rpc_analytics_company_candidates(
  p_tax_id text default null,
  p_name text default null,
  p_trade_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
  v_tax_id text := nullif(regexp_replace(coalesce(p_tax_id, ''), '[^0-9]', '', 'g'), '');
  v_name text := app_private.normalize_company_name(p_name);
  v_trade_name text := app_private.normalize_company_name(p_trade_name);
begin
  if not (app_private.can_read_analytics() or auth.uid() is null) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  with companies as (
    select c.company_id, c.name, c.tax_id,
      regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') as tax_id_normalized,
      app_private.hubspot_company_identity_aliases(c.name, c.raw) as aliases
    from public.hubspot_companies c
  ), ranked as (
    select c.company_id, c.name, c.tax_id,
      case
        when v_tax_id is not null and c.tax_id_normalized = v_tax_id then 'cnpj_exato'
        when signals.exact_alias then 'identidade_exata'
        when signals.score >= 0.4 then 'identidade_similar'
        else null
      end as reason,
      case
        when v_tax_id is not null and c.tax_id_normalized = v_tax_id then 1.0::numeric
        when signals.exact_alias then 0.9::numeric
        else signals.score
      end as score
    from companies c
    cross join lateral (
      select
        coalesce(bool_or(alias = v_name or alias = v_trade_name), false) as exact_alias,
        greatest(
          coalesce(max(extensions.similarity(alias, v_name)) filter (where v_name is not null), 0),
          coalesce(max(extensions.similarity(alias, v_trade_name)) filter (where v_trade_name is not null), 0)
        )::numeric as score
      from unnest(c.aliases) as alias
    ) signals
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'company_id', company_id,
    'name', name,
    'tax_id', tax_id,
    'reason', reason,
    'score', round(score, 3)
  ) order by score desc, company_id), '[]'::jsonb)
  into result
  from (
    select company_id, name, tax_id, reason, score
    from ranked
    where reason is not null
    order by score desc, company_id
    limit 10
  ) candidates;

  return result;
end;
$$;

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

  with source_rows as (
    select
      app_private.company_reconciliation_source_key(f.client_name, f.client_tax_id) as source_key,
      max(nullif(btrim(f.client_name), '')) as source_name,
      max(nullif(btrim(f.client_trade_name), '')) as source_trade_name,
      max(nullif(btrim(f.client_tax_id), '')) as source_tax_id,
      count(*)::integer as title_count,
      coalesce(sum(f.balance), 0)::numeric as total_balance
    from public.analytics_finance_receivables f
    where app_private.company_reconciliation_source_key(f.client_name, f.client_tax_id) is not null
    group by 1
  ), rows_with_decisions as (
    select s.*, d.company_id as confirmed_company_id,
      app_private.normalize_company_name(s.source_name) as source_name_normalized,
      app_private.normalize_company_name(s.source_trade_name) as source_trade_name_normalized
    from source_rows s
    left join public.analytics_company_reconciliation_decisions d
      on d.source_key = s.source_key and d.status = 'confirmed'
  ), items as (
    select jsonb_build_object(
      'source_key', r.source_key,
      'source_name', r.source_name,
      'source_trade_name', r.source_trade_name,
      'source_tax_id', r.source_tax_id,
      'title_count', r.title_count,
      'total_balance', r.total_balance,
      'status', case when r.confirmed_company_id is not null then 'confirmed' else 'pending' end,
      'candidates', coalesce(c.payload, '[]'::jsonb)
    ) as value
    from rows_with_decisions r
    left join lateral (
      select jsonb_agg(jsonb_build_object(
        'company_id', candidate.company_id,
        'company_name', candidate.name,
        'tax_id', candidate.tax_id,
        'score', round(candidate.score, 3),
        'reason', candidate.reason,
        'decision', coalesce(d.status, 'suggested')
      ) order by candidate.priority, candidate.score desc, candidate.company_id) as payload
      from (
        select c.company_id, c.name, c.tax_id,
          case
            when c.company_id = r.confirmed_company_id then 'confirmada'
            when regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = nullif(regexp_replace(coalesce(r.source_tax_id, ''), '[^0-9]', '', 'g'), '')
              and nullif(regexp_replace(coalesce(r.source_tax_id, ''), '[^0-9]', '', 'g'), '') is not null then 'cnpj_exato'
            when signals.exact_alias then 'identidade_exata'
            else 'identidade_similar'
          end as reason,
          case
            when c.company_id = r.confirmed_company_id then 1.0::numeric
            when regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = nullif(regexp_replace(coalesce(r.source_tax_id, ''), '[^0-9]', '', 'g'), '')
              and nullif(regexp_replace(coalesce(r.source_tax_id, ''), '[^0-9]', '', 'g'), '') is not null then 1.0::numeric
            when signals.exact_alias then 0.9::numeric
            else signals.score
          end as score,
          case when c.company_id = r.confirmed_company_id then 0 else 1 end as priority
        from public.hubspot_companies c
        cross join lateral (
          select
            coalesce(bool_or(alias = r.source_name_normalized or alias = r.source_trade_name_normalized), false) as exact_alias,
            greatest(
              coalesce(max(extensions.similarity(alias, r.source_name_normalized)) filter (where r.source_name_normalized is not null), 0),
              coalesce(max(extensions.similarity(alias, r.source_trade_name_normalized)) filter (where r.source_trade_name_normalized is not null), 0)
            )::numeric as score
          from unnest(app_private.hubspot_company_identity_aliases(c.name, c.raw)) as alias
        ) signals
        where c.company_id = r.confirmed_company_id
           or regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = nullif(regexp_replace(coalesce(r.source_tax_id, ''), '[^0-9]', '', 'g'), '')
           or signals.exact_alias
           or signals.score >= 0.4
        order by priority, score desc, c.company_id
        limit 10
      ) candidate
      left join public.analytics_company_reconciliation_decisions d
        on d.source_key = r.source_key and d.company_id = candidate.company_id
      where coalesce(d.status, '') <> 'discarded' or candidate.company_id = r.confirmed_company_id
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
      'pending', (select count(*) from rows_with_decisions where confirmed_company_id is null)
    ),
    'items', coalesce((select jsonb_agg(value order by value ->> 'status', value ->> 'source_name') from paged_items), '[]'::jsonb)
  ) into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

create or replace function public.rpc_analytics_finance_unmatched_clients(
  p_client_query text default null,
  p_limit integer default 100
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado ao Analytics Financeiro';
  end if;

  with grouped as (
    select
      coalesce(f.client_name, '(sem nome)') as client,
      max(f.client_tax_id) as tax_id,
      max(f.client_trade_name) as trade_name,
      count(*)::integer as titles,
      coalesce(sum(f.balance), 0)::numeric as balance,
      coalesce(sum(f.balance) filter (where f.aging_bucket = 'atrasado'), 0)::numeric as overdue_balance,
      app_private.normalize_company_name(f.client_name) as client_name_normalized,
      app_private.normalize_company_name(f.client_trade_name) as client_trade_name_normalized
    from public.analytics_finance_receivables f
    where f.source_key = 'omie_receivables_api'
      and f.is_current
      and f.balance > 0
      and (nullif(trim(p_client_query), '') is null or f.client_name ilike '%' || trim(p_client_query) || '%')
      and not exists (
        select 1 from public.hubspot_companies c
        where nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
          and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g')
      )
    group by f.client_name, f.client_trade_name
    order by balance desc
    limit greatest(least(coalesce(p_limit, 100), 500), 1)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'client', client,
    'tax_id', tax_id,
    'trade_name', trade_name,
    'titles', titles,
    'balance', balance,
    'overdue_balance', overdue_balance,
    'name_matches', name_matches
  ) order by balance desc), '[]'::jsonb)
  into result
  from (
    select g.*, (
      select count(*)::integer
      from public.hubspot_companies c
      where exists (
        select 1
        from unnest(app_private.hubspot_company_identity_aliases(c.name, c.raw)) as alias
        where alias = g.client_name_normalized
           or alias = g.client_trade_name_normalized
           or (g.client_name_normalized is not null and length(g.client_name_normalized) >= 4 and extensions.similarity(alias, g.client_name_normalized) >= 0.4)
           or (g.client_trade_name_normalized is not null and length(g.client_trade_name_normalized) >= 4 and extensions.similarity(alias, g.client_trade_name_normalized) >= 0.4)
      )
    ) as name_matches
    from grouped g
  ) candidates;

  return result;
end;
$$;

comment on function public.rpc_analytics_company_candidates(text, text, text) is
  'Candidatos HubSpot por CNPJ e aliases normalizados (nome, razao social e nome fantasia). Similaridade nunca confirma vinculo.';

comment on function public.rpc_analytics_company_reconciliation_queue(integer, integer) is
  'Fila read-only de candidatas HubSpot para identidades financeiras OMIE. CNPJ e aliases ampliam a busca; somente decisao confirmada vale como vinculo.';

comment on function public.rpc_analytics_finance_unmatched_clients(text, integer) is
  'Pendencias financeiras OMIE sem CNPJ conciliado. name_matches conta candidatas por nome, razao social ou nome fantasia; nao representa vinculo confirmado.';

revoke all on function public.rpc_analytics_company_candidates(text, text, text) from public, anon;
grant execute on function public.rpc_analytics_company_candidates(text, text, text) to authenticated, service_role;

revoke all on function public.rpc_analytics_company_reconciliation_queue(integer, integer) from public, anon;
grant execute on function public.rpc_analytics_company_reconciliation_queue(integer, integer) to authenticated, service_role;

revoke all on function public.rpc_analytics_finance_unmatched_clients(text, integer) from public, anon;
grant execute on function public.rpc_analytics_finance_unmatched_clients(text, integer) to authenticated, service_role;
