-- Extensão server-side do recorte por grupo econômico. A função legada continua
-- disponível para compatibilidade; esta assinatura aplica o recorte antes da
-- paginação da resposta entregue ao dashboard.

create or replace function public.rpc_analytics_ceo_reconciliation_quality_grouped(
  p_from date default null,
  p_to date default null,
  p_status text default 'all',
  p_client_query text default null,
  p_group_resolution text default 'all',
  p_limit integer default 500,
  p_offset integer default 0
)
returns jsonb
language sql stable security definer set search_path = ''
as $$
with base as (
  select public.rpc_analytics_ceo_reconciliation_quality_grouped(p_from, p_to, p_status, p_client_query, 1000, 0) as payload
), groups as (
  select value
  from base, jsonb_array_elements(coalesce(payload -> 'groups', '[]'::jsonb)) as item(value)
), filtered as (
  select value
  from groups
  where lower(coalesce(p_group_resolution, 'all')) = 'all'
    or (lower(p_group_resolution) = 'economic_group' and value ->> 'resolution_type' = 'economic_group')
    or (lower(p_group_resolution) = 'without_group' and coalesce(value ->> 'resolution_type', '') = '')
), summary as (
  select
    count(*)::integer as groups_total,
    coalesce(sum((value ->> 'title_count')::integer), 0)::integer as titles_total,
    count(*) filter (where value ->> 'match_status' = 'matched')::integer as matched_groups,
    count(*) filter (where value ->> 'match_status' = 'unmatched')::integer as unmatched_groups,
    count(*) filter (where value ->> 'match_status' = 'ambiguous')::integer as ambiguous_groups,
    coalesce(sum((value ->> 'matched_titles')::integer), 0)::integer as matched_titles,
    coalesce(sum((value ->> 'unmatched_titles')::integer), 0)::integer as unmatched_titles,
    coalesce(sum((value ->> 'ambiguous_titles')::integer), 0)::integer as ambiguous_titles
  from filtered
), page as (
  select value
  from filtered
  order by case value ->> 'match_status' when 'ambiguous' then 0 when 'unmatched' then 1 else 2 end,
    (value ->> 'total_balance')::numeric desc nulls last,
    value ->> 'source_client_name' nulls last
  limit greatest(1, least(coalesce(p_limit, 500), 1000))
  offset greatest(coalesce(p_offset, 0), 0)
)
select case when app_private.can_read_analytics() then jsonb_build_object(
  'summary', (select to_jsonb(summary) from summary),
  'groups', coalesce((select jsonb_agg(value) from page), '[]'::jsonb)
) else jsonb_build_object(
  'summary', jsonb_build_object('groups_total', 0, 'titles_total', 0, 'matched_groups', 0, 'unmatched_groups', 0, 'ambiguous_groups', 0, 'matched_titles', 0, 'unmatched_titles', 0, 'ambiguous_titles', 0),
  'groups', '[]'::jsonb
) end;
$$;

revoke all on function public.rpc_analytics_ceo_reconciliation_quality_grouped(date, date, text, text, text, integer, integer) from public, anon;
grant execute on function public.rpc_analytics_ceo_reconciliation_quality_grouped(date, date, text, text, text, integer, integer) to authenticated, service_role;
