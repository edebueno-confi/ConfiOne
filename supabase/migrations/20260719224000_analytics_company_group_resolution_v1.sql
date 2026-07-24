-- Resolucao explicita de grupo economico para diferenciar matriz/filial de
-- duplicidade. Nao inferimos essa relacao apenas porque o CNPJ se repete.
create table public.analytics_company_group_resolution (
  tax_id_normalized text primary key,
  group_label text not null,
  group_type text not null default 'economic_group' check (group_type in ('economic_group')),
  master_company_id text,
  member_company_ids text[] not null default '{}',
  rationale text not null,
  source text not null default 'manual_review',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint analytics_company_group_resolution_tax_id_digits check (tax_id_normalized ~ '^[0-9]{8,20}$')
);

alter table public.analytics_company_group_resolution enable row level security;
create policy analytics_company_group_resolution_read on public.analytics_company_group_resolution
  for select to authenticated using (app_private.can_read_analytics());
revoke all on public.analytics_company_group_resolution from public, anon;
grant select on public.analytics_company_group_resolution to authenticated, service_role;
grant insert, update, delete on public.analytics_company_group_resolution to service_role;

comment on table public.analytics_company_group_resolution is
  'Regras humanas e auditaveis para tratar empresas matriz/filial como grupo economico na reconciliacao financeira.';

create index analytics_company_group_resolution_active_tax_id_idx
  on public.analytics_company_group_resolution (tax_id_normalized)
  where is_active;

insert into public.analytics_company_group_resolution (
  tax_id_normalized, group_label, master_company_id, member_company_ids, rationale, source
) values (
  '49669856000143', 'Grupo Restoque', '35396127929',
  array['35396127929', '54489440359', '9169451935'],
  'Restoque e a matriz; Le Lis Blanc e empresa do mesmo grupo. O mesmo CNPJ compartilhado nao deve gerar ambiguidade operacional neste recorte.',
  'manual_review_user'
) on conflict (tax_id_normalized) do update set
  group_label = excluded.group_label,
  master_company_id = excluded.master_company_id,
  member_company_ids = excluded.member_company_ids,
  rationale = excluded.rationale,
  source = excluded.source,
  is_active = true,
  updated_at = timezone('utc', now());

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
  select f.* from public.analytics_finance_receivables f
  where (p_from is null or coalesce(f.due_date, f.issued_date) >= p_from)
    and (p_to is null or coalesce(f.due_date, f.issued_date) <= p_to)
    and (nullif(trim(coalesce(p_client_query, '')), '') is null or lower(concat_ws(' ', f.client_name, f.client_tax_id, f.document_number)) like '%' || lower(trim(p_client_query)) || '%')
), resolutions as (
  select r.* from public.analytics_company_group_resolution r where r.is_active
), candidate_rows as (
  select f.id finance_id, c.company_id, c.name company_name, c.domain, c.tax_id, c.contract_status, c.client_status, c.cs_owner_id,
    (select o.full_name from public.hubspot_owners o where o.owner_id = c.cs_owner_id limit 1) cs_owner_name,
    case when nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
      and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g') then 'cnpj'
      when lower(regexp_replace(coalesce(c.name, ''), '[^[:alnum:]]', '', 'g')) = lower(regexp_replace(coalesce(f.client_name, ''), '[^[:alnum:]]', '', 'g')) then 'nome_exato'
      else 'candidata' end match_method
  from finance f join public.hubspot_companies c on (
    nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g')
  ) or (
    nullif(trim(coalesce(f.client_name, '')), '') is not null and lower(regexp_replace(coalesce(c.name, ''), '[^[:alnum:]]', '', 'g')) = lower(regexp_replace(f.client_name, '[^[:alnum:]]', '', 'g'))
  )
), title_rows as (
  select f.id finance_id, f.client_name source_client_name, f.client_tax_id source_tax_id, f.document_number, f.balance, f.due_date, f.issued_date,
    coalesce(case when r.tax_id_normalized is not null then 'economic:' || r.tax_id_normalized end,
      nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), ''),
      nullif(lower(regexp_replace(coalesce(f.client_name, ''), '[^[:alnum:]]', '', 'g')), ''), f.id::text) group_key,
    r.group_type resolution_type, r.group_label resolution_label, r.master_company_id resolution_master_company_id,
    r.member_company_ids resolution_member_company_ids, r.rationale resolution_note,
    count(cr.company_id)::integer candidate_count,
    case when r.tax_id_normalized is not null then 'matched' when count(cr.company_id) = 0 then 'unmatched' when count(cr.company_id) > 1 then 'ambiguous' else 'matched' end match_status,
    coalesce(jsonb_agg(jsonb_build_object('company_id', cr.company_id, 'company_name', cr.company_name, 'domain', cr.domain, 'tax_id', cr.tax_id, 'contract_status', cr.contract_status, 'client_status', cr.client_status, 'cs_owner_id', cr.cs_owner_id, 'cs_owner_name', cr.cs_owner_name, 'match_method', cr.match_method) order by cr.company_id) filter (where cr.company_id is not null), '[]'::jsonb) candidates
  from finance f left join resolutions r on r.tax_id_normalized = nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '')
    left join candidate_rows cr on cr.finance_id = f.id
  group by f.id, f.client_name, f.client_tax_id, f.document_number, f.balance, f.due_date, f.issued_date, r.tax_id_normalized, r.group_type, r.group_label, r.master_company_id, r.member_company_ids, r.rationale
), first_candidates as (
  select distinct on (group_key) group_key, candidates from title_rows order by group_key, finance_id
), group_totals as (
  select group_key, max(source_client_name) source_client_name, max(source_tax_id) source_tax_id, count(*)::integer title_count,
    coalesce(sum(balance), 0)::numeric total_balance, min(due_date) oldest_due_date, max(due_date) latest_due_date, max(candidate_count)::integer candidate_count,
    max(resolution_type) resolution_type, max(resolution_label) resolution_label, max(resolution_master_company_id) resolution_master_company_id,
    max(resolution_member_company_ids) resolution_member_company_ids, max(resolution_note) resolution_note,
    case when bool_or(match_status = 'ambiguous') then 'ambiguous' when bool_or(match_status = 'unmatched') then 'unmatched' else 'matched' end match_status,
    count(*) filter (where match_status = 'matched')::integer matched_titles, count(*) filter (where match_status = 'unmatched')::integer unmatched_titles, count(*) filter (where match_status = 'ambiguous')::integer ambiguous_titles
  from title_rows group by group_key
), groups as (
  select gt.group_key, gt.source_client_name, gt.source_tax_id, gt.title_count, gt.total_balance, gt.oldest_due_date, gt.latest_due_date, gt.candidate_count,
    gt.match_status, gt.matched_titles, gt.unmatched_titles, gt.ambiguous_titles, gt.resolution_type, gt.resolution_label, gt.resolution_master_company_id,
    to_jsonb(gt.resolution_member_company_ids) resolution_member_company_ids, gt.resolution_note, fc.candidates,
    coalesce((select jsonb_agg(to_jsonb(tr) - 'group_key' - 'candidates' order by tr.due_date nulls last, tr.document_number, tr.finance_id) from title_rows tr where tr.group_key = gt.group_key), '[]'::jsonb) titles
  from group_totals gt join first_candidates fc using (group_key)
), filtered as (
  select * from groups where lower(coalesce(p_status, 'all')) = 'all' or match_status = lower(p_status)
), summary as (
  select count(*)::integer groups_total, coalesce(sum(title_count), 0)::integer titles_total, count(*) filter (where match_status = 'matched')::integer matched_groups,
    count(*) filter (where match_status = 'unmatched')::integer unmatched_groups, count(*) filter (where match_status = 'ambiguous')::integer ambiguous_groups,
    coalesce(sum(matched_titles), 0)::integer matched_titles, coalesce(sum(unmatched_titles), 0)::integer unmatched_titles, coalesce(sum(ambiguous_titles), 0)::integer ambiguous_titles
  from groups
), page as (
  select * from filtered order by case match_status when 'ambiguous' then 0 when 'unmatched' then 1 else 2 end, total_balance desc nulls last, source_client_name nulls last
  limit greatest(1, least(coalesce(p_limit, 500), 1000)) offset greatest(coalesce(p_offset, 0), 0)
)
select case when app_private.can_read_analytics() then jsonb_build_object('summary', (select to_jsonb(summary) from summary), 'groups', coalesce((select jsonb_agg(to_jsonb(page)) from page), '[]'::jsonb))
  else jsonb_build_object('summary', jsonb_build_object('groups_total', 0, 'titles_total', 0, 'matched_groups', 0, 'unmatched_groups', 0, 'ambiguous_groups', 0, 'matched_titles', 0, 'unmatched_titles', 0, 'ambiguous_titles', 0), 'groups', '[]'::jsonb) end;
$$;

comment on function public.rpc_analytics_ceo_reconciliation_quality_grouped(date, date, text, text, integer, integer) is
  'Fila agrupada por cliente com resolucoes humanas de grupo economico; titulos permanecem em titles e merge nunca e automatico.';

-- A mesma resolucao precisa alimentar os KPIs executivos; caso contrario a
-- tabela ficaria correta, mas o cartao de qualidade continuaria alarmando.
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
), matched as (
  select f.*, m.company_id, m.company_name, m.mrr, m.client_status, m.contract_status, m.cs_owner_id, m.cs_owner_name,
    m.candidate_count, m.match_confidence, m.match_method, m.resolution_type
  from finance f
  left join lateral (
    select c.company_id, c.name as company_name, c.mrr, c.client_status, c.contract_status, c.cs_owner_id,
      (select o.full_name from public.hubspot_owners o where o.owner_id = c.cs_owner_id limit 1) as cs_owner_name,
      case when r.tax_id_normalized is not null then 1 else count(*) over ()::integer end as candidate_count,
      case when r.tax_id_normalized is not null then 1.0
        when nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g') then 1.0
        when lower(regexp_replace(coalesce(c.name, ''), '[^[:alnum:]]', '', 'g')) = lower(regexp_replace(coalesce(f.client_name, ''), '[^[:alnum:]]', '', 'g')) then 0.8 else 0.0 end as match_confidence,
      case when r.tax_id_normalized is not null then 'economic_group'
        when nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g') then 'cnpj'
        when lower(regexp_replace(coalesce(c.name, ''), '[^[:alnum:]]', '', 'g')) = lower(regexp_replace(coalesce(f.client_name, ''), '[^[:alnum:]]', '', 'g')) then 'nome_exato' else null end as match_method,
      r.group_type resolution_type
    from public.hubspot_companies c
    left join public.analytics_company_group_resolution r on r.is_active and r.tax_id_normalized = nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '')
    where (r.master_company_id is not null and c.company_id = r.master_company_id)
      or (r.tax_id_normalized is null and ((nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g'))
        or (nullif(trim(coalesce(f.client_name, '')), '') is not null and lower(regexp_replace(coalesce(c.name, ''), '[^[:alnum:]]', '', 'g')) = lower(regexp_replace(f.client_name, '[^[:alnum:]]', '', 'g')))))
    order by case when r.master_company_id is not null and c.company_id = r.master_company_id then 0 when r.tax_id_normalized is not null then 1 when nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(f.client_tax_id, '[^0-9]', '', 'g') then 2 else 3 end, c.company_id
    limit 1
  ) m on true
), alerts as (
  select coalesce(company_id, 'unmatched:' || lower(regexp_replace(coalesce(client_name, 'Sem cliente'), '[^[:alnum:]]', '', 'g'))) as alert_key,
    max(company_id) as company_id, max(company_name) as company_name, max(client_name) as source_client_name, max(cs_owner_id) as cs_owner_id, max(cs_owner_name) as cs_owner_name, max(mrr) as mrr,
    max(client_status) as client_status, max(contract_status) as contract_status, sum(balance)::numeric as overdue_balance, count(*)::integer as overdue_titles, max((current_date - due_date))::integer as max_days_overdue,
    min(due_date) as oldest_due_date, max(match_confidence) as match_confidence, max(match_method) as match_method, max(candidate_count) as candidate_count
  from matched where aging_bucket = 'atrasado' and balance > 0 group by 1
), quality as (
  select count(*)::integer as finance_titles, count(*) filter (where company_id is not null and match_confidence >= 0.8)::integer as matched_finance_titles,
    count(*) filter (where company_id is null)::integer as unmatched_finance_titles,
    count(*) filter (where candidate_count > 1 and resolution_type is null)::integer as ambiguous_finance_titles,
    count(*) filter (where resolution_type = 'economic_group')::integer as resolved_group_titles,
    max(finance_source_at) as finance_source_at, (select max(finished_at) from public.hubspot_sync_runs where status = 'success') as hubspot_source_at
  from matched
), finance_payload as (
  select jsonb_build_object('titles', (select count(*) from finance), 'net_amount', (select coalesce(sum(net_amount), 0) from finance), 'balance', (select coalesce(sum(balance), 0) from finance), 'overdue_titles', (select count(*) from finance where aging_bucket = 'atrasado'), 'overdue_balance', (select coalesce(sum(balance) filter (where aging_bucket = 'atrasado'), 0) from finance), 'matched_titles', (select matched_finance_titles from quality), 'unmatched_titles', (select unmatched_finance_titles from quality)) as value
)
select case when app_private.can_read_analytics() then (select payload from base) || jsonb_build_object('finance', (select value from finance_payload), 'financial_alerts', coalesce((select jsonb_agg(to_jsonb(alerts) order by overdue_balance desc) from alerts), '[]'::jsonb), 'data_quality', (select to_jsonb(quality) from quality)) else '{}'::jsonb end;
$$;

revoke all on function public.rpc_analytics_ceo_snapshot(date, date) from public, anon;
grant execute on function public.rpc_analytics_ceo_snapshot(date, date) to authenticated, service_role;
