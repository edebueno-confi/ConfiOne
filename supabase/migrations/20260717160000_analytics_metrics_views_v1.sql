-- Analytics/Dashboard Gerencial: views de metricas (v1).
-- Toda a regra de metrica vive aqui (agregacao no Postgres), desacoplada do fetch.
-- Gate de leitura: app_private.can_read_analytics() (platform_admin na v1).
-- Classificacao de estado do deal/ticket vem de hubspot_pipeline_stages (is_won/is_closed),
-- nunca de parsing de rotulo.

-- ===========================================================================
-- COMERCIAL (Deals - pipeline Aftersale)
-- ===========================================================================

-- KPIs consolidados (linha unica). HAVING gate para nao retornar linha a nao-admin.
create or replace view public.vw_analytics_commercial_kpis
with (security_barrier = true) as
  with cfg as (
    select hubspot_pipeline_id as pipeline_id
    from public.analytics_source_config
    where domain_key = 'commercial' and object_type = 'deal' and is_active
    limit 1
  ),
  deals as (
    select
      d.deal_id,
      d.amount_home,
      coalesce(s.is_won, false) as is_won,
      coalesce(s.is_closed, false) as is_closed
    from public.hubspot_deals d
    join cfg on cfg.pipeline_id = d.pipeline_id
    left join public.hubspot_pipeline_stages s
      on s.object_type = 'deal'
     and s.pipeline_id = d.pipeline_id
     and s.stage_id = d.dealstage
  )
  select
    count(*)::integer as total_deals,
    count(*) filter (where not is_closed)::integer as open_deals,
    count(*) filter (where is_won)::integer as won_deals,
    count(*) filter (where is_closed and not is_won)::integer as lost_deals,
    coalesce(sum(amount_home) filter (where is_won), 0)::numeric as won_revenue,
    case
      when count(*) filter (where is_closed) > 0
      then round(
        count(*) filter (where is_won)::numeric
        / count(*) filter (where is_closed)::numeric, 4)
      else 0
    end as conversion_rate,
    case
      when count(*) filter (where is_won) > 0
      then round(
        coalesce(sum(amount_home) filter (where is_won), 0)::numeric
        / count(*) filter (where is_won)::numeric, 2)
      else 0
    end as avg_ticket
  from deals
  having app_private.can_read_analytics();

comment on view public.vw_analytics_commercial_kpis is
  'KPIs comerciais v1: totais, receita ganha (amount_in_home_currency), conversao Ganho/(Ganho+Perdido) e ticket medio. Estado derivado dos estagios do pipeline.';

-- Funil por estagio (inclui estagios vazios, na ordem da API).
create or replace view public.vw_analytics_commercial_funnel
with (security_barrier = true) as
  with cfg as (
    select hubspot_pipeline_id as pipeline_id
    from public.analytics_source_config
    where domain_key = 'commercial' and object_type = 'deal' and is_active
    limit 1
  )
  select
    s.stage_id,
    s.label,
    s.display_order,
    s.is_won,
    s.is_closed,
    count(d.deal_id)::integer as deal_count,
    coalesce(sum(d.amount_home), 0)::numeric as stage_revenue
  from cfg
  join public.hubspot_pipeline_stages s
    on s.object_type = 'deal' and s.pipeline_id = cfg.pipeline_id
  left join public.hubspot_deals d
    on d.pipeline_id = s.pipeline_id and d.dealstage = s.stage_id
  where app_private.can_read_analytics()
  group by s.stage_id, s.label, s.display_order, s.is_won, s.is_closed
  order by s.display_order;

comment on view public.vw_analytics_commercial_funnel is
  'Funil comercial por estagio, ordenado por display_order da API. Estagios sem deals aparecem com contagem zero.';

-- Deals por responsavel (hubspot_owner_id resolvido).
create or replace view public.vw_analytics_commercial_by_owner
with (security_barrier = true) as
  with cfg as (
    select hubspot_pipeline_id as pipeline_id
    from public.analytics_source_config
    where domain_key = 'commercial' and object_type = 'deal' and is_active
    limit 1
  )
  select
    d.owner_id,
    coalesce(nullif(btrim(o.full_name), ''), o.email, 'Sem responsavel') as owner_name,
    count(*)::integer as deal_count,
    count(*) filter (where coalesce(s.is_won, false))::integer as won_count,
    coalesce(sum(d.amount_home) filter (where coalesce(s.is_won, false)), 0)::numeric as won_revenue
  from public.hubspot_deals d
  join cfg on cfg.pipeline_id = d.pipeline_id
  left join public.hubspot_owners o on o.owner_id = d.owner_id
  left join public.hubspot_pipeline_stages s
    on s.object_type = 'deal' and s.pipeline_id = d.pipeline_id and s.stage_id = d.dealstage
  where app_private.can_read_analytics()
  group by d.owner_id, coalesce(nullif(btrim(o.full_name), ''), o.email, 'Sem responsavel')
  order by deal_count desc;

comment on view public.vw_analytics_commercial_by_owner is
  'Deals por responsavel (dono geral do deal, unica quebra confiavel hoje). Contagem e receita ganha por owner.';

-- Tendencia mensal de criacao e ganho.
create or replace view public.vw_analytics_commercial_monthly
with (security_barrier = true) as
  with cfg as (
    select hubspot_pipeline_id as pipeline_id
    from public.analytics_source_config
    where domain_key = 'commercial' and object_type = 'deal' and is_active
    limit 1
  )
  select
    date_trunc('month', d.hs_created_at)::date as month_start,
    count(*)::integer as created_count,
    count(*) filter (where coalesce(s.is_won, false))::integer as won_count,
    coalesce(sum(d.amount_home) filter (where coalesce(s.is_won, false)), 0)::numeric as won_revenue
  from public.hubspot_deals d
  join cfg on cfg.pipeline_id = d.pipeline_id
  left join public.hubspot_pipeline_stages s
    on s.object_type = 'deal' and s.pipeline_id = d.pipeline_id and s.stage_id = d.dealstage
  where app_private.can_read_analytics()
    and d.hs_created_at is not null
  group by date_trunc('month', d.hs_created_at)
  order by month_start;

comment on view public.vw_analytics_commercial_monthly is
  'Tendencia mensal de criacao de deals (createdate) e deals ganhos por mes de criacao.';

-- ===========================================================================
-- CS / SUPORTE (Tickets)
-- ===========================================================================

create or replace view public.vw_analytics_cs_kpis
with (security_barrier = true) as
  with cfg as (
    select hubspot_pipeline_id as pipeline_id
    from public.analytics_source_config
    where domain_key = 'cs' and object_type = 'ticket' and is_active
    limit 1
  ),
  tickets as (
    select
      t.ticket_id,
      coalesce(s.is_closed, false) as is_closed
    from public.hubspot_tickets t
    join cfg on cfg.pipeline_id = t.pipeline_id
    left join public.hubspot_pipeline_stages s
      on s.object_type = 'ticket'
     and s.pipeline_id = t.pipeline_id
     and s.stage_id = t.pipeline_stage
  )
  select
    count(*)::integer as total_tickets,
    count(*) filter (where not is_closed)::integer as open_tickets,
    count(*) filter (where is_closed)::integer as closed_tickets,
    case
      when count(*) > 0
      then round(count(*) filter (where is_closed)::numeric / count(*)::numeric, 4)
      else 0
    end as closed_rate
  from tickets
  having app_private.can_read_analytics();

comment on view public.vw_analytics_cs_kpis is
  'KPIs de suporte v1: total, abertos vs encerrados e percentual encerrado. Estado derivado do estagio do ticket.';

create or replace view public.vw_analytics_cs_by_status
with (security_barrier = true) as
  with cfg as (
    select hubspot_pipeline_id as pipeline_id
    from public.analytics_source_config
    where domain_key = 'cs' and object_type = 'ticket' and is_active
    limit 1
  )
  select
    s.stage_id,
    s.label,
    s.display_order,
    s.is_closed,
    count(t.ticket_id)::integer as ticket_count
  from cfg
  join public.hubspot_pipeline_stages s
    on s.object_type = 'ticket' and s.pipeline_id = cfg.pipeline_id
  left join public.hubspot_tickets t
    on t.pipeline_id = s.pipeline_id and t.pipeline_stage = s.stage_id
  where app_private.can_read_analytics()
  group by s.stage_id, s.label, s.display_order, s.is_closed
  order by s.display_order;

comment on view public.vw_analytics_cs_by_status is
  'Tickets por status/estagio do pipeline de suporte, na ordem da API.';

create or replace view public.vw_analytics_cs_monthly
with (security_barrier = true) as
  with cfg as (
    select hubspot_pipeline_id as pipeline_id
    from public.analytics_source_config
    where domain_key = 'cs' and object_type = 'ticket' and is_active
    limit 1
  ),
  scoped as (
    select t.ticket_id, t.hs_created_at, t.hs_closed_at
    from public.hubspot_tickets t
    join cfg on cfg.pipeline_id = t.pipeline_id
    where app_private.can_read_analytics()
  ),
  created as (
    select date_trunc('month', hs_created_at)::date as month_start, count(*)::integer as created_count
    from scoped
    where hs_created_at is not null
    group by 1
  ),
  closed as (
    select date_trunc('month', hs_closed_at)::date as month_start, count(*)::integer as closed_count
    from scoped
    where hs_closed_at is not null
    group by 1
  )
  select
    coalesce(created.month_start, closed.month_start) as month_start,
    coalesce(created.created_count, 0) as created_count,
    coalesce(closed.closed_count, 0) as closed_count
  from created
  full outer join closed on closed.month_start = created.month_start
  order by month_start;

comment on view public.vw_analytics_cs_monthly is
  'Tendencia mensal de tickets: criados por mes (createdate) e encerrados por mes (closedate).';

-- ===========================================================================
-- Grants: expostas ao PostgREST apenas via views, gate por can_read_analytics().
-- ===========================================================================
revoke all on public.vw_analytics_commercial_kpis from public, anon;
revoke all on public.vw_analytics_commercial_funnel from public, anon;
revoke all on public.vw_analytics_commercial_by_owner from public, anon;
revoke all on public.vw_analytics_commercial_monthly from public, anon;
revoke all on public.vw_analytics_cs_kpis from public, anon;
revoke all on public.vw_analytics_cs_by_status from public, anon;
revoke all on public.vw_analytics_cs_monthly from public, anon;

grant select on public.vw_analytics_commercial_kpis to authenticated, service_role;
grant select on public.vw_analytics_commercial_funnel to authenticated, service_role;
grant select on public.vw_analytics_commercial_by_owner to authenticated, service_role;
grant select on public.vw_analytics_commercial_monthly to authenticated, service_role;
grant select on public.vw_analytics_cs_kpis to authenticated, service_role;
grant select on public.vw_analytics_cs_by_status to authenticated, service_role;
grant select on public.vw_analytics_cs_monthly to authenticated, service_role;
