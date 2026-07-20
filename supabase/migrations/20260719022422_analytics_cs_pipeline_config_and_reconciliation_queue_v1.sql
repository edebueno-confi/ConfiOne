-- Analytics: CS Support multi-pipeline, observabilidade de fontes e fila de
-- reconciliacao financeira. Nenhuma escrita no HubSpot acontece nesta migration.

alter table public.analytics_source_config
  drop constraint if exists analytics_source_config_domain_key_object_type_key;

alter table public.analytics_source_config
  add constraint analytics_source_config_domain_object_pipeline_key
  unique (domain_key, object_type, hubspot_pipeline_id);

comment on table public.analytics_source_config is
  'Fontes HubSpot configuraveis por dominio. Um dominio pode reunir varios pipelines ativos; a administracao ocorre no Dashboard Gerencial.';

insert into public.analytics_source_config (domain_key, object_type, hubspot_pipeline_id, label, is_active)
values
  ('commercial', 'deal', '892833861', 'Comercial Aftersale', true),
  ('cs', 'ticket', '5034314', 'Criadouro de Tiquetes | Aftersale', true),
  ('cs', 'ticket', '95268403', 'Confi | Whatsapp', true),
  ('cs', 'ticket', '2013870', 'Suporte B2B | Confi', true),
  ('cs', 'ticket', '23949674', 'Fale conosco | Confi', true),
  ('cs', 'ticket', '53130860', 'Atendimento | Confi Analytics', true)
on conflict (domain_key, object_type, hubspot_pipeline_id)
do update set label = excluded.label, is_active = excluded.is_active;

-- O registro legado "Suporte" (1429283 / CS Neotrust) explicava o painel com
-- apenas 12 tickets. Ele permanece no catalogo para auditoria, mas nao entra
-- no escopo operacional de CS Support sem uma habilitacao explicita.
update public.analytics_source_config
set is_active = false
where domain_key = 'cs' and object_type = 'ticket' and hubspot_pipeline_id = '1429283';

alter table public.hubspot_tickets add column if not exists owner_id text;
create index if not exists hubspot_tickets_owner_idx on public.hubspot_tickets (owner_id);
comment on column public.hubspot_tickets.owner_id is
  'hubspot_owner_id resolvido do ticket; usado para volume por responsavel sem alterar o fluxo operacional de suporte.';

create or replace function public.rpc_admin_upsert_analytics_source_config(
  p_id uuid default null,
  p_domain_key text default null,
  p_object_type text default null,
  p_hubspot_pipeline_id text default null,
  p_label text default null,
  p_is_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.analytics_source_config;
  v_domain text := lower(trim(coalesce(p_domain_key, '')));
  v_object text := lower(trim(coalesce(p_object_type, '')));
  v_pipeline text := trim(coalesce(p_hubspot_pipeline_id, ''));
  v_label text := trim(coalesce(p_label, ''));
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_upsert_analytics_source_config denied';
  end if;
  if v_domain not in ('commercial', 'cs') then
    raise exception 'domain_key invalido';
  end if;
  if v_object not in ('deal', 'ticket') then
    raise exception 'object_type invalido';
  end if;
  if v_pipeline !~ '^[0-9]+$' then
    raise exception 'hubspot_pipeline_id deve conter apenas numeros';
  end if;
  if v_label = '' then
    raise exception 'label obrigatorio';
  end if;

  if p_id is null then
    insert into public.analytics_source_config
      (domain_key, object_type, hubspot_pipeline_id, label, is_active)
    values (v_domain, v_object, v_pipeline, v_label, coalesce(p_is_active, true))
    on conflict (domain_key, object_type, hubspot_pipeline_id)
    do update set label = excluded.label, is_active = excluded.is_active
    returning * into v_row;
  else
    update public.analytics_source_config
      set domain_key = v_domain,
          object_type = v_object,
          hubspot_pipeline_id = v_pipeline,
          label = v_label,
          is_active = coalesce(p_is_active, true)
    where id = p_id
    returning * into v_row;
    if v_row.id is null then raise exception 'configuracao nao encontrada'; end if;
  end if;
  return to_jsonb(v_row);
end;
$$;

revoke all on function public.rpc_admin_upsert_analytics_source_config(uuid, text, text, text, text, boolean) from public, anon;
grant execute on function public.rpc_admin_upsert_analytics_source_config(uuid, text, text, text, text, boolean) to authenticated;

-- Snapshot filtravel: todos os pipelines ativos do dominio entram no escopo.
create or replace function public.rpc_analytics_commercial_snapshot(
  p_from date default null,
  p_to date default null,
  p_owner_id text default null,
  p_stage_id text default null
)
returns jsonb
language sql stable security definer set search_path = ''
as $$
with cfg as (
  select hubspot_pipeline_id as pipeline_id from public.analytics_source_config
  where domain_key = 'commercial' and object_type = 'deal' and is_active
), scoped as (
  select d.*, coalesce(s.is_won, false) as is_won, coalesce(s.is_closed, false) as is_closed,
    s.label as stage_label, s.display_order, s.is_won as stage_is_won, s.is_closed as stage_is_closed,
    coalesce(nullif(btrim(o.full_name), ''), o.email, 'Sem responsavel') as owner_name
  from public.hubspot_deals d join cfg on cfg.pipeline_id = d.pipeline_id
  left join public.hubspot_pipeline_stages s on s.object_type = 'deal' and s.pipeline_id = d.pipeline_id and s.stage_id = d.dealstage
  left join public.hubspot_owners o on o.owner_id = d.owner_id
  where (p_from is null or d.hs_created_at >= p_from::timestamptz)
    and (p_to is null or d.hs_created_at < (p_to + 1)::timestamptz)
    and (p_owner_id is null or d.owner_id = p_owner_id)
    and (p_stage_id is null or d.dealstage = p_stage_id)
), kpis as (
  select count(*)::integer total_deals, count(*) filter (where not is_closed)::integer open_deals,
    count(*) filter (where is_won)::integer won_deals, count(*) filter (where is_closed and not is_won)::integer lost_deals,
    coalesce(sum(amount_home) filter (where is_won), 0)::numeric won_revenue,
    case when count(*) filter (where is_closed) > 0 then round(count(*) filter (where is_won)::numeric / count(*) filter (where is_closed)::numeric, 4) else 0 end conversion_rate,
    case when count(*) filter (where is_won) > 0 then round(coalesce(sum(amount_home) filter (where is_won), 0)::numeric / count(*) filter (where is_won)::numeric, 2) else 0 end avg_ticket
  from scoped
), funnel as (
  select coalesce(stage_label, 'Estagio sem rotulo') label, coalesce(dealstage, '') stage_id, coalesce(display_order, 0) display_order,
    coalesce(stage_is_won, false) is_won, coalesce(stage_is_closed, false) is_closed, count(*)::integer deal_count,
    coalesce(sum(amount_home), 0)::numeric stage_revenue
  from scoped group by stage_id, stage_label, display_order, stage_is_won, stage_is_closed
), owners as (
  select owner_id, owner_name, count(*)::integer deal_count, count(*) filter (where is_won)::integer won_count,
    coalesce(sum(amount_home) filter (where is_won), 0)::numeric won_revenue
  from scoped group by owner_id, owner_name order by deal_count desc
), monthly as (
  select date_trunc('month', hs_created_at)::date month_start, count(*)::integer created_count,
    count(*) filter (where is_won)::integer won_count, coalesce(sum(amount_home) filter (where is_won), 0)::numeric won_revenue
  from scoped where hs_created_at is not null group by 1 order by 1
)
select case when app_private.can_read_analytics() then jsonb_build_object(
  'kpis', (select to_jsonb(kpis) from kpis),
  'funnel', coalesce((select jsonb_agg(to_jsonb(funnel) order by display_order) from funnel), '[]'::jsonb),
  'by_owner', coalesce((select jsonb_agg(to_jsonb(owners) order by deal_count desc) from owners), '[]'::jsonb),
  'monthly', coalesce((select jsonb_agg(to_jsonb(monthly) order by month_start) from monthly), '[]'::jsonb)
) else '{}'::jsonb end;
$$;

create or replace function public.rpc_analytics_cs_snapshot(
  p_from date default null,
  p_to date default null,
  p_stage_id text default null,
  p_priority text default null
)
returns jsonb
language sql stable security definer set search_path = ''
as $$
with cfg as (
  select hubspot_pipeline_id as pipeline_id, label as pipeline_label from public.analytics_source_config
  where domain_key = 'cs' and object_type = 'ticket' and is_active
), scoped as (
  select t.*, cfg.pipeline_label, coalesce(s.is_closed, false) is_closed, s.label stage_label, s.display_order, s.is_closed stage_is_closed
  from public.hubspot_tickets t join cfg on cfg.pipeline_id = t.pipeline_id
  left join public.hubspot_pipeline_stages s on s.object_type = 'ticket' and s.pipeline_id = t.pipeline_id and s.stage_id = t.pipeline_stage
  where (p_from is null or t.hs_created_at >= p_from::timestamptz)
    and (p_to is null or t.hs_created_at < (p_to + 1)::timestamptz)
    and (p_stage_id is null or t.pipeline_stage = p_stage_id)
    and (p_priority is null or t.priority = p_priority)
), kpis as (
  select count(*)::integer total_tickets, count(*) filter (where not is_closed)::integer open_tickets,
    count(*) filter (where is_closed)::integer closed_tickets,
    case when count(*) > 0 then round(count(*) filter (where is_closed)::numeric / count(*)::numeric, 4) else 0 end closed_rate
  from scoped
), statuses as (
  select coalesce(stage_label, 'Status sem rotulo') label, coalesce(pipeline_stage, '') stage_id, coalesce(display_order, 0) display_order,
    coalesce(stage_is_closed, false) is_closed, count(*)::integer ticket_count
  from scoped group by stage_id, stage_label, display_order, stage_is_closed
), monthly as (
  select coalesce(created.month_start, closed.month_start) month_start, coalesce(created.created_count, 0) created_count, coalesce(closed.closed_count, 0) closed_count
  from (select date_trunc('month', hs_created_at)::date month_start, count(*)::integer created_count from scoped where hs_created_at is not null group by 1) created
  full outer join (select date_trunc('month', hs_closed_at)::date month_start, count(*)::integer closed_count from scoped where hs_closed_at is not null group by 1) closed using (month_start)
), sources as (
  select coalesce(nullif(source_type, ''), 'Sem fonte') label, count(*)::integer ticket_count from scoped group by 1 order by ticket_count desc
), pipelines as (
  select pipeline_label label, pipeline_id, count(*)::integer ticket_count from scoped group by pipeline_label, pipeline_id order by ticket_count desc
), owners as (
  select coalesce(nullif(o.full_name, ''), nullif(o.email, ''), 'Sem responsavel') owner_name, s.owner_id, count(*)::integer ticket_count
  from scoped s left join public.hubspot_owners o on o.owner_id = s.owner_id
  group by s.owner_id, o.full_name, o.email order by ticket_count desc
)
select case when app_private.can_read_analytics() then jsonb_build_object(
  'kpis', (select to_jsonb(kpis) from kpis),
  'by_status', coalesce((select jsonb_agg(to_jsonb(statuses) order by display_order, label) from statuses), '[]'::jsonb),
  'monthly', coalesce((select jsonb_agg(to_jsonb(monthly) order by month_start) from monthly), '[]'::jsonb),
  'by_source', coalesce((select jsonb_agg(to_jsonb(sources) order by ticket_count desc) from sources), '[]'::jsonb),
  'by_pipeline', coalesce((select jsonb_agg(to_jsonb(pipelines) order by ticket_count desc) from pipelines), '[]'::jsonb),
  'by_owner', coalesce((select jsonb_agg(to_jsonb(owners) order by ticket_count desc) from owners), '[]'::jsonb),
  'latest_ticket_created_at', (select max(hs_created_at) from scoped)
) else '{}'::jsonb end;
$$;

-- Fila completa: o status e por titulo financeiro, nao apenas por cliente vencido.
create or replace function public.rpc_analytics_ceo_reconciliation_quality(
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
), grouped as (
  select f.id finance_id, f.client_name source_client_name, f.client_tax_id source_tax_id, f.document_number, f.balance, f.due_date, f.issued_date,
    count(cr.company_id)::integer candidate_count,
    case when count(cr.company_id) = 0 then 'unmatched' when count(cr.company_id) > 1 then 'ambiguous' else 'matched' end match_status,
    coalesce(jsonb_agg(jsonb_build_object('company_id', cr.company_id, 'company_name', cr.company_name, 'domain', cr.domain, 'tax_id', cr.tax_id, 'contract_status', cr.contract_status, 'client_status', cr.client_status, 'cs_owner_id', cr.cs_owner_id, 'cs_owner_name', cr.cs_owner_name, 'match_method', cr.match_method) order by cr.company_id) filter (where cr.company_id is not null), '[]'::jsonb) candidates
  from finance f left join candidate_rows cr on cr.finance_id = f.id
  group by f.id, f.client_name, f.client_tax_id, f.document_number, f.balance, f.due_date, f.issued_date
), filtered as (
  select * from grouped where (lower(coalesce(p_status, 'all')) = 'all' or match_status = lower(p_status))
), summary as (
  select count(*)::integer rows_total,
    count(*) filter (where match_status = 'matched')::integer matched_titles,
    count(*) filter (where match_status = 'unmatched')::integer unmatched_titles,
    count(*) filter (where match_status = 'ambiguous')::integer ambiguous_titles
  from grouped
), page as (
  select * from filtered order by case match_status when 'ambiguous' then 0 when 'unmatched' then 1 else 2 end, balance desc nulls last, source_client_name nulls last
  limit greatest(1, least(coalesce(p_limit, 500), 1000)) offset greatest(coalesce(p_offset, 0), 0)
)
select case when app_private.can_read_analytics() then jsonb_build_object(
  'summary', (select to_jsonb(summary) from summary),
  'rows', coalesce((select jsonb_agg(to_jsonb(page)) from page), '[]'::jsonb)
) else jsonb_build_object('summary', jsonb_build_object('rows_total', 0, 'matched_titles', 0, 'unmatched_titles', 0, 'ambiguous_titles', 0), 'rows', '[]'::jsonb) end;
$$;

revoke all on function public.rpc_analytics_ceo_reconciliation_quality(date, date, text, text, integer, integer) from public, anon;
grant execute on function public.rpc_analytics_ceo_reconciliation_quality(date, date, text, text, integer, integer) to authenticated, service_role;

comment on function public.rpc_analytics_ceo_reconciliation_quality(date, date, text, text, integer, integer) is
  'Fila paginada de titulos financeiros classificados como matched, unmatched ou ambiguous; somente leitura, sem escolha automatica de mestre.';

create or replace function public.rpc_analytics_ceo_snapshot_legacy(
  p_from date default null,
  p_to date default null
)
returns jsonb
language sql stable security definer set search_path = ''
as $$
with commercial_cfg as (
  select hubspot_pipeline_id pipeline_id from public.analytics_source_config
  where domain_key = 'commercial' and object_type = 'deal' and is_active
), commercial as (
  select d.*, coalesce(s.is_won, false) is_won, coalesce(s.is_closed, false) is_closed
  from public.hubspot_deals d join commercial_cfg c on c.pipeline_id = d.pipeline_id
  left join public.hubspot_pipeline_stages s on s.object_type = 'deal' and s.pipeline_id = d.pipeline_id and s.stage_id = d.dealstage
  where (p_from is null or d.hs_created_at >= p_from::timestamptz) and (p_to is null or d.hs_created_at < (p_to + 1)::timestamptz)
), support_cfg as (
  select hubspot_pipeline_id pipeline_id, label pipeline_label from public.analytics_source_config
  where domain_key = 'cs' and object_type = 'ticket' and is_active
), support as (
  select t.*, c.pipeline_label, coalesce(s.is_closed, false) is_closed
  from public.hubspot_tickets t join support_cfg c on c.pipeline_id = t.pipeline_id
  left join public.hubspot_pipeline_stages s on s.object_type = 'ticket' and s.pipeline_id = t.pipeline_id and s.stage_id = t.pipeline_stage
  where (p_from is null or t.hs_created_at >= p_from::timestamptz) and (p_to is null or t.hs_created_at < (p_to + 1)::timestamptz)
), support_sources as (
  select coalesce(nullif(source_type, ''), 'Sem fonte') label, count(*)::integer ticket_count from support group by 1
), support_pipelines as (
  select pipeline_label label, pipeline_id, count(*)::integer ticket_count from support group by pipeline_label, pipeline_id
), support_owners as (
  select coalesce(nullif(o.full_name, ''), nullif(o.email, ''), 'Sem responsavel') owner_name, s.owner_id, count(*)::integer ticket_count
  from support s left join public.hubspot_owners o on o.owner_id = s.owner_id group by s.owner_id, o.full_name, o.email
)
select jsonb_build_object(
  'commercial', jsonb_build_object(
    'total_deals', (select count(*) from commercial), 'open_deals', (select count(*) from commercial where not is_closed),
    'won_deals', (select count(*) from commercial where is_won), 'lost_deals', (select count(*) from commercial where is_closed and not is_won),
    'open_pipeline_value', (select coalesce(sum(amount_home), 0) from commercial where not is_closed), 'won_revenue', (select coalesce(sum(amount_home), 0) from commercial where is_won),
    'conversion_rate', (select case when count(*) filter (where is_closed) > 0 then round(count(*) filter (where is_won)::numeric / count(*) filter (where is_closed)::numeric, 4) else 0 end from commercial),
    'avg_ticket', (select case when count(*) filter (where is_won) > 0 then round(coalesce(sum(amount_home) filter (where is_won), 0) / count(*) filter (where is_won), 2) else 0 end from commercial),
    'avg_sales_cycle_days', (select round(avg(extract(epoch from (hs_closed_at - hs_created_at)) / 86400)::numeric, 1) from commercial where is_won and hs_closed_at is not null and hs_created_at is not null),
    'unassigned_deals', (select count(*) from commercial where nullif(owner_id, '') is null)
  ),
  'support', jsonb_build_object(
    'total_tickets', (select count(*) from support), 'created_tickets', (select count(*) from support),
    'open_tickets', (select count(*) from support where not is_closed), 'closed_tickets', (select count(*) from support where is_closed),
    'closed_rate', (select case when count(*) > 0 then round(count(*) filter (where is_closed)::numeric / count(*)::numeric, 4) else 0 end from support),
    'high_priority_open', (select count(*) from support where not is_closed and upper(coalesce(priority, '')) = 'HIGH'),
    'first_response_sla_tracked', (select count(*) from support where nullif(time_to_first_response_sla_status, '') is not null),
    'close_sla_tracked', (select count(*) from support where nullif(time_to_close_sla_status, '') is not null),
    'source_filled', (select count(*) from support where nullif(source_type, '') is not null),
    'by_source', coalesce((select jsonb_agg(to_jsonb(s) order by s.ticket_count desc) from support_sources s), '[]'::jsonb),
    'by_pipeline', coalesce((select jsonb_agg(to_jsonb(s) order by s.ticket_count desc) from support_pipelines s), '[]'::jsonb),
    'by_owner', coalesce((select jsonb_agg(to_jsonb(s) order by s.ticket_count desc) from support_owners s), '[]'::jsonb),
    'latest_ticket_created_at', (select max(hs_created_at) from support)
  ),
  'finance', '{}'::jsonb
);
$$;

revoke all on function public.rpc_analytics_ceo_snapshot_legacy(date, date) from public, anon, authenticated, service_role;
grant execute on function public.rpc_analytics_ceo_snapshot_legacy(date, date) to authenticated, service_role;
