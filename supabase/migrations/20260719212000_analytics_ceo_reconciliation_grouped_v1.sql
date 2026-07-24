-- Agrupa a fila de reconciliacao por cliente sem descartar os titulos individuais.
-- A fila anterior continua disponivel para compatibilidade; esta e a leitura operacional.
create or replace function public.rpc_analytics_ceo_reconciliation_quality_grouped(
  p_from date default null,
  p_to date default null,
  p_status text default 'all',
  p_client_query text default null,
  p_limit integer default 500,
  p_offset integer default 0
)
returns jsonb
language sql stable security definer set search_path = ''
as $$
with finance as (
  select f.*
  from public.analytics_finance_receivables f
  where (p_from is null or coalesce(f.due_date, f.issued_date) >= p_from)
    and (p_to is null or coalesce(f.due_date, f.issued_date) <= p_to)
    and (nullif(trim(coalesce(p_client_query, '')), '') is null or lower(concat_ws(' ', f.client_name, f.client_tax_id, f.document_number)) like '%' || lower(trim(p_client_query)) || '%')
), candidate_rows as (
  select f.id finance_id, c.company_id, c.name company_name, c.domain, c.tax_id,
    c.contract_status, c.client_status, c.cs_owner_id,
    (select o.full_name from public.hubspot_owners o where o.owner_id = c.cs_owner_id limit 1) cs_owner_name,
    case when nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
      and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g') then 'cnpj'
      when lower(regexp_replace(coalesce(c.name, ''), '[^[:alnum:]]', '', 'g')) = lower(regexp_replace(coalesce(f.client_name, ''), '[^[:alnum:]]', '', 'g')) then 'nome_exato'
      else 'candidata' end match_method
  from finance f
  join public.hubspot_companies c on (
    nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
    and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g')
  ) or (
    nullif(trim(coalesce(f.client_name, '')), '') is not null
    and lower(regexp_replace(coalesce(c.name, ''), '[^[:alnum:]]', '', 'g')) = lower(regexp_replace(f.client_name, '[^[:alnum:]]', '', 'g'))
  )
), title_rows as (
  select f.id finance_id, f.client_name source_client_name, f.client_tax_id source_tax_id,
    f.document_number, f.balance, f.due_date, f.issued_date,
    coalesce(
      nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), ''),
      nullif(lower(regexp_replace(coalesce(f.client_name, ''), '[^[:alnum:]]', '', 'g')), ''),
      f.id::text
    ) group_key,
    count(cr.company_id)::integer candidate_count,
    case when count(cr.company_id) = 0 then 'unmatched' when count(cr.company_id) > 1 then 'ambiguous' else 'matched' end match_status,
    coalesce(jsonb_agg(jsonb_build_object(
      'company_id', cr.company_id, 'company_name', cr.company_name, 'domain', cr.domain,
      'tax_id', cr.tax_id, 'contract_status', cr.contract_status, 'client_status', cr.client_status,
      'cs_owner_id', cr.cs_owner_id, 'cs_owner_name', cr.cs_owner_name, 'match_method', cr.match_method
    ) order by cr.company_id) filter (where cr.company_id is not null), '[]'::jsonb) candidates
  from finance f left join candidate_rows cr on cr.finance_id = f.id
  group by f.id, f.client_name, f.client_tax_id, f.document_number, f.balance, f.due_date, f.issued_date
), first_candidates as (
  select distinct on (group_key) group_key, candidates
  from title_rows
  order by group_key, finance_id
), group_totals as (
  select group_key,
    max(source_client_name) source_client_name,
    max(source_tax_id) source_tax_id,
    count(*)::integer title_count,
    coalesce(sum(balance), 0)::numeric total_balance,
    min(due_date) oldest_due_date,
    max(due_date) latest_due_date,
    max(candidate_count)::integer candidate_count,
    case when bool_or(match_status = 'ambiguous') then 'ambiguous'
      when bool_or(match_status = 'unmatched') then 'unmatched' else 'matched' end match_status,
    count(*) filter (where match_status = 'matched')::integer matched_titles,
    count(*) filter (where match_status = 'unmatched')::integer unmatched_titles,
    count(*) filter (where match_status = 'ambiguous')::integer ambiguous_titles
  from title_rows
  group by group_key
), groups as (
  select gt.group_key, gt.source_client_name, gt.source_tax_id, gt.title_count,
    gt.total_balance, gt.oldest_due_date, gt.latest_due_date, gt.candidate_count,
    gt.match_status, gt.matched_titles, gt.unmatched_titles, gt.ambiguous_titles,
    fc.candidates,
    coalesce((select jsonb_agg(to_jsonb(tr) - 'group_key' - 'candidates' order by tr.due_date nulls last, tr.document_number, tr.finance_id)
      from title_rows tr where tr.group_key = gt.group_key), '[]'::jsonb) titles
  from group_totals gt join first_candidates fc using (group_key)
), filtered as (
  select * from groups
  where lower(coalesce(p_status, 'all')) = 'all' or match_status = lower(p_status)
), summary as (
  select count(*)::integer groups_total,
    coalesce(sum(title_count), 0)::integer titles_total,
    count(*) filter (where match_status = 'matched')::integer matched_groups,
    count(*) filter (where match_status = 'unmatched')::integer unmatched_groups,
    count(*) filter (where match_status = 'ambiguous')::integer ambiguous_groups,
    coalesce(sum(matched_titles), 0)::integer matched_titles,
    coalesce(sum(unmatched_titles), 0)::integer unmatched_titles,
    coalesce(sum(ambiguous_titles), 0)::integer ambiguous_titles
  from groups
), page as (
  select * from filtered
  order by case match_status when 'ambiguous' then 0 when 'unmatched' then 1 else 2 end,
    total_balance desc nulls last, source_client_name nulls last
  limit greatest(1, least(coalesce(p_limit, 500), 1000)) offset greatest(coalesce(p_offset, 0), 0)
)
select case when app_private.can_read_analytics() then jsonb_build_object(
  'summary', (select to_jsonb(summary) from summary),
  'groups', coalesce((select jsonb_agg(to_jsonb(page)) from page), '[]'::jsonb)
) else jsonb_build_object(
  'summary', jsonb_build_object('groups_total', 0, 'titles_total', 0, 'matched_groups', 0, 'unmatched_groups', 0, 'ambiguous_groups', 0, 'matched_titles', 0, 'unmatched_titles', 0, 'ambiguous_titles', 0),
  'groups', '[]'::jsonb
) end;
$$;

revoke all on function public.rpc_analytics_ceo_reconciliation_quality_grouped(date, date, text, text, integer, integer) from public, anon;
grant execute on function public.rpc_analytics_ceo_reconciliation_quality_grouped(date, date, text, text, integer, integer) to authenticated, service_role;

comment on function public.rpc_analytics_ceo_reconciliation_quality_grouped(date, date, text, text, integer, integer) is
  'Fila de reconciliacao agrupada por cliente; titulos permanecem em titles para auditoria e nenhuma unificacao e automatica.';
