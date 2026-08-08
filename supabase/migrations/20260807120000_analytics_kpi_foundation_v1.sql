-- ANALYTICS-KPI-FOUNDATION-V1
--
-- Fundação de KPIs do Dashboard Gerencial (HubSpot operacional + OMIE financeiro).
--
-- Este lote NÃO cria métrica nova a partir de suposição. Ele materializa três
-- coisas que o discovery contra a conta real provou serem necessárias:
--
-- 1. Uma configuração explícita e auditável para as duas decisões que não podem
--    ser inferidas do dado: qual é a fonte oficial de MRR e o que define cliente
--    ativo. Enquanto o valor for 'UNRESOLVED', os KPIs dependentes devem
--    permanecer indisponíveis — nunca estimados.
-- 2. Uma base canônica de clientes, resolvida pela configuração acima, para que
--    nenhuma tela recalcule a regra por conta própria.
-- 3. Uma fundação de histórico (snapshot diário), porque a conta HubSpot não
--    preenche `closedate` em tickets: 31.530 tickets estão em estágios com
--    ticketState = CLOSED e nenhum possui data de fechamento. Sem snapshot não
--    existe backlog histórico, tickets resolvidos por período nem reabertura.
--
-- Evidências do discovery (2026-08-07, portal HubSpot 20108050):
--   - Propriedades reais de Company ingeridas: aftersale___mrr, cnpj,
--     cs_owner___aftersale, status_do_cliente___aftersale, status_do_contrato.
--   - aftersale___mrr > 0 em 251 de 10.168 empresas, somando R$ 546.186,70.
--   - status_do_cliente___aftersale: Cliente (320), Churn (196), Bloqueado (12),
--     Grupo de Empresas (3), POC (2), vazio/nulo (9.635).
--   - Não há ingestão de Contratos de Serviço do OMIE, portanto OMIE_CONTRACTS
--     não é uma fonte de MRR disponível hoje.
--   - Não há ingestão de associations do HubSpot. Ticket ↔ Company e
--     Deal ↔ Company não existem no read model; KPIs que dependem disso ficam
--     bloqueados e assim declarados.
--   - A ligação HubSpot ↔ OMIE usa CNPJ normalizado, o mesmo critério já adotado
--     por rpc_analytics_finance_company_rollup. Nenhuma chave por nome, domínio
--     ou e-mail é usada.

-- ---------------------------------------------------------------------------
-- 1. Configuração de KPI
-- ---------------------------------------------------------------------------

create table if not exists public.analytics_kpi_settings (
  id boolean primary key default true,
  mrr_source text not null default 'UNRESOLVED',
  active_customer_rule text not null default 'UNRESOLVED',
  org_timezone text not null default 'America/Sao_Paulo',
  inactivity_threshold_days integer not null default 30,
  backlog_aging_hours integer[] not null default array[4, 24, 72, 168],
  calculation_version text not null default 'kpi_v1',
  decided_at timestamptz null,
  decided_by uuid null references auth.users (id) on delete set null,
  decision_note text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint analytics_kpi_settings_singleton check (id),
  constraint analytics_kpi_settings_mrr_source check (
    mrr_source in ('OMIE_CONTRACTS', 'HUBSPOT_RECURRING_REVENUE', 'UNRESOLVED')
  ),
  constraint analytics_kpi_settings_active_rule check (
    active_customer_rule in (
      'HUBSPOT_CLIENT_STATUS',
      'HUBSPOT_CLIENT_STATUS_WITH_CONTRACT',
      'HUBSPOT_MRR_POSITIVE',
      'UNRESOLVED'
    )
  ),
  constraint analytics_kpi_settings_inactivity check (inactivity_threshold_days between 1 and 365)
);

comment on table public.analytics_kpi_settings is
  'Decisões de negócio que os KPIs não podem inferir do dado: fonte oficial de MRR, regra de cliente ativo, timezone e limiares. Linha única.';
comment on column public.analytics_kpi_settings.mrr_source is
  'OMIE_CONTRACTS | HUBSPOT_RECURRING_REVENUE | UNRESOLVED. Em UNRESOLVED todos os KPIs de receita recorrente permanecem indisponíveis.';
comment on column public.analytics_kpi_settings.active_customer_rule is
  'Regra que define cliente ativo. Em UNRESOLVED a carteira permanece indisponível.';

alter table public.analytics_kpi_settings enable row level security;

drop policy if exists analytics_kpi_settings_read on public.analytics_kpi_settings;
create policy analytics_kpi_settings_read
  on public.analytics_kpi_settings
  for select
  to authenticated
  using (app_private.can_read_analytics());

revoke all on table public.analytics_kpi_settings from public, anon;
grant select on table public.analytics_kpi_settings to authenticated;
grant select, insert, update on table public.analytics_kpi_settings to service_role;

-- Semeadura com as decisões registradas pela operação em 2026-08-07.
-- MRR: HubSpot Company `aftersale___mrr` é a fonte oficial, porque não existe
--      ingestão de Contratos de Serviço do OMIE.
-- Cliente ativo: status_do_cliente___aftersale = 'Cliente'.
insert into public.analytics_kpi_settings (
  id, mrr_source, active_customer_rule, decided_at, decision_note
)
values (
  true,
  'HUBSPOT_RECURRING_REVENUE',
  'HUBSPOT_CLIENT_STATUS',
  timezone('utc', now()),
  'Decisão registrada em 2026-08-07. MRR pela propriedade de Company do HubSpot por ausência de ingestão de Contratos de Serviço no OMIE. Cliente ativo por status do cliente. Divergência conhecida e não reconciliada: a planilha histórica de CS registrava 593 clientes e MRR de R$ 461.032,48.'
)
on conflict (id) do nothing;

create or replace function public.analytics_kpi_settings_touch()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_analytics_kpi_settings_touch on public.analytics_kpi_settings;
create trigger trg_analytics_kpi_settings_touch
  before update on public.analytics_kpi_settings
  for each row execute function public.analytics_kpi_settings_touch();

-- ---------------------------------------------------------------------------
-- 2. Base canônica de clientes
-- ---------------------------------------------------------------------------
--
-- Uma única definição de cliente ativo e de MRR por cliente, resolvida pela
-- configuração. Nenhuma tela e nenhuma outra RPC deve reimplementar a regra.

create or replace view public.vw_analytics_customer_base
with (security_invoker = true)
as
with settings as (
  select * from public.analytics_kpi_settings where id
)
select
  c.company_id,
  c.name as company_name,
  nullif(regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g'), '') as tax_id_normalized,
  nullif(btrim(coalesce(c.client_status, '')), '') as client_status,
  nullif(btrim(coalesce(c.contract_status, '')), '') as contract_status,
  c.cs_owner_id,
  o.full_name as cs_owner_name,
  -- MRR só existe quando a fonte oficial foi resolvida.
  case
    when s.mrr_source = 'HUBSPOT_RECURRING_REVENUE' then nullif(greatest(coalesce(c.mrr, 0), 0), 0)
    else null
  end as mrr,
  -- Cliente ativo segundo a regra configurada. NULL quando não resolvida.
  case s.active_customer_rule
    when 'HUBSPOT_CLIENT_STATUS'
      then btrim(coalesce(c.client_status, '')) = 'Cliente'
    when 'HUBSPOT_CLIENT_STATUS_WITH_CONTRACT'
      then btrim(coalesce(c.client_status, '')) = 'Cliente'
        and btrim(coalesce(c.contract_status, '')) in ('Vigente', 'Com Contrato')
    when 'HUBSPOT_MRR_POSITIVE'
      then coalesce(c.mrr, 0) > 0
    else null
  end as is_active_customer,
  s.mrr_source,
  s.active_customer_rule,
  s.calculation_version,
  c.synced_at as freshness_at
from public.hubspot_companies c
cross join settings s
left join public.hubspot_owners o on o.owner_id = c.cs_owner_id;

comment on view public.vw_analytics_customer_base is
  'Base canônica de clientes do Dashboard. Cliente ativo e MRR são resolvidos pela configuração em analytics_kpi_settings; quando a decisão está UNRESOLVED o campo retorna NULL em vez de zero.';

revoke all on public.vw_analytics_customer_base from public, anon;
grant select on public.vw_analytics_customer_base to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Ligação HubSpot ↔ OMIE por CNPJ normalizado
-- ---------------------------------------------------------------------------
--
-- Prioridade de chave definida na especificação: (1) ID explícito de integração,
-- (2) CNPJ/CPF normalizado, (3) tabela manual auditável. A conta não possui
-- chave explícita de integração em nenhum dos dois lados, portanto a chave
-- corrente é o CNPJ com apenas dígitos. Nome, razão social, nome fantasia,
-- domínio e e-mail não são usados como match.

create or replace view public.vw_analytics_customer_financial_link
with (security_invoker = true)
as
with receivables as (
  select
    nullif(regexp_replace(coalesce(r.client_tax_id, ''), '[^0-9]', '', 'g'), '') as tax_id_normalized,
    r.balance,
    r.due_date
  from public.analytics_finance_receivables r
  where r.is_current
    and not coalesce(r.is_cancelled, false)
    and coalesce(r.balance, 0) > 0
), aggregated as (
  select
    tax_id_normalized,
    round(sum(balance)::numeric, 2) as open_balance,
    round(coalesce(sum(balance) filter (where due_date < current_date), 0)::numeric, 2) as overdue_balance,
    count(*)::integer as open_titles,
    count(*) filter (where due_date < current_date)::integer as overdue_titles,
    max(current_date - due_date) filter (where due_date < current_date)::integer as max_overdue_days
  from receivables
  where tax_id_normalized is not null
  group by tax_id_normalized
)
select
  b.company_id,
  b.company_name,
  b.tax_id_normalized,
  b.client_status,
  b.contract_status,
  b.cs_owner_id,
  b.cs_owner_name,
  b.mrr,
  b.is_active_customer,
  a.tax_id_normalized is not null as has_financial_link,
  coalesce(a.open_balance, 0)::numeric as open_balance,
  coalesce(a.overdue_balance, 0)::numeric as overdue_balance,
  coalesce(a.open_titles, 0)::integer as open_titles,
  coalesce(a.overdue_titles, 0)::integer as overdue_titles,
  a.max_overdue_days
from public.vw_analytics_customer_base b
left join aggregated a on a.tax_id_normalized = b.tax_id_normalized;

comment on view public.vw_analytics_customer_financial_link is
  'Ligação auditável entre a Company do HubSpot e os títulos do OMIE por CNPJ normalizado. Nunca faz match por nome, domínio ou e-mail. has_financial_link expõe a cobertura real do mapeamento.';

revoke all on public.vw_analytics_customer_financial_link from public, anon;
grant select on public.vw_analytics_customer_financial_link to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Fundação de histórico: snapshot diário
-- ---------------------------------------------------------------------------
--
-- Nenhum histórico anterior a hoje é fabricado. A série começa na primeira
-- captura e cresce a partir dela. Métricas históricas (churn, NRR, GRR, backlog
-- histórico, reopen rate, MRR movements) permanecem indisponíveis até existir
-- janela suficiente.

create table if not exists public.analytics_kpi_daily_snapshot (
  snapshot_date date not null,
  metric_key text not null,
  dimension_key text not null default '_total',
  numeric_value numeric null,
  count_value integer null,
  calculation_version text not null,
  source text not null,
  captured_at timestamptz not null default timezone('utc', now()),
  primary key (snapshot_date, metric_key, dimension_key)
);

comment on table public.analytics_kpi_daily_snapshot is
  'Snapshot diário idempotente para KPIs que exigem histórico. A chave primária por (data, métrica, dimensão) garante que recapturar o mesmo dia sobrescreve em vez de duplicar.';

create index if not exists analytics_kpi_daily_snapshot_metric_date_idx
  on public.analytics_kpi_daily_snapshot (metric_key, snapshot_date desc);

alter table public.analytics_kpi_daily_snapshot enable row level security;

drop policy if exists analytics_kpi_daily_snapshot_read on public.analytics_kpi_daily_snapshot;
create policy analytics_kpi_daily_snapshot_read
  on public.analytics_kpi_daily_snapshot
  for select
  to authenticated
  using (app_private.can_read_analytics());

revoke all on table public.analytics_kpi_daily_snapshot from public, anon;
grant select on table public.analytics_kpi_daily_snapshot to authenticated;
grant select, insert, update on table public.analytics_kpi_daily_snapshot to service_role;

create or replace function public.rpc_service_capture_analytics_kpi_snapshot(
  p_snapshot_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_date date;
  v_version text;
  v_rows integer := 0;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  select calculation_version into v_version from public.analytics_kpi_settings where id;
  v_version := coalesce(v_version, 'kpi_v1');
  v_date := coalesce(p_snapshot_date, (timezone('utc', now()))::date);

  -- Backlog de tickets por estágio aberto, na data da captura.
  insert into public.analytics_kpi_daily_snapshot as t (
    snapshot_date, metric_key, dimension_key, numeric_value, count_value, calculation_version, source
  )
  select
    v_date,
    'support_backlog_open',
    coalesce(k.pipeline_id, '_unknown'),
    null,
    k.open_tickets,
    v_version,
    'hubspot'
  from (
    select tk.pipeline_id, count(*)::integer as open_tickets
    from public.hubspot_tickets tk
    join public.hubspot_pipeline_stages s
      on s.object_type = 'ticket'
     and s.pipeline_id = tk.pipeline_id
     and s.stage_id = tk.pipeline_stage
    join public.analytics_source_config c
      on c.object_type = 'ticket'
     and c.hubspot_pipeline_id = tk.pipeline_id
     and c.is_active
     and not coalesce(c.is_archived, false)
    where coalesce(s.metadata ->> 'ticketState', '') = 'OPEN'
    group by tk.pipeline_id
  ) k
  on conflict (snapshot_date, metric_key, dimension_key) do update
    set count_value = excluded.count_value,
        numeric_value = excluded.numeric_value,
        calculation_version = excluded.calculation_version,
        captured_at = timezone('utc', now());
  get diagnostics v_rows = row_count;

  -- Estágio corrente de cada ticket aberto, para permitir reconstruir
  -- transições a partir de agora. Guardado agregado, não por ticket.
  insert into public.analytics_kpi_daily_snapshot as t (
    snapshot_date, metric_key, dimension_key, numeric_value, count_value, calculation_version, source
  )
  select v_date, 'support_backlog_by_stage', tk.pipeline_stage, null, count(*)::integer, v_version, 'hubspot'
  from public.hubspot_tickets tk
  join public.hubspot_pipeline_stages s
    on s.object_type = 'ticket' and s.pipeline_id = tk.pipeline_id and s.stage_id = tk.pipeline_stage
  join public.analytics_source_config c
    on c.object_type = 'ticket' and c.hubspot_pipeline_id = tk.pipeline_id
   and c.is_active and not coalesce(c.is_archived, false)
  where coalesce(s.metadata ->> 'ticketState', '') = 'OPEN'
  group by tk.pipeline_stage
  on conflict (snapshot_date, metric_key, dimension_key) do update
    set count_value = excluded.count_value,
        calculation_version = excluded.calculation_version,
        captured_at = timezone('utc', now());

  -- MRR e carteira ativa. Só grava quando as decisões estão resolvidas;
  -- não existe snapshot de valor estimado.
  insert into public.analytics_kpi_daily_snapshot as t (
    snapshot_date, metric_key, dimension_key, numeric_value, count_value, calculation_version, source
  )
  select v_date, 'recurring_revenue_total', '_total',
         round(sum(b.mrr)::numeric, 2), count(*)::integer, v_version, 'hubspot'
  from public.vw_analytics_customer_base b
  where b.is_active_customer is true and b.mrr is not null
  having count(*) > 0
  on conflict (snapshot_date, metric_key, dimension_key) do update
    set numeric_value = excluded.numeric_value,
        count_value = excluded.count_value,
        calculation_version = excluded.calculation_version,
        captured_at = timezone('utc', now());

  insert into public.analytics_kpi_daily_snapshot as t (
    snapshot_date, metric_key, dimension_key, numeric_value, count_value, calculation_version, source
  )
  select v_date, 'active_customers', '_total', null, count(*)::integer, v_version, 'hubspot'
  from public.vw_analytics_customer_base b
  where b.is_active_customer is true
  having count(*) > 0
  on conflict (snapshot_date, metric_key, dimension_key) do update
    set count_value = excluded.count_value,
        calculation_version = excluded.calculation_version,
        captured_at = timezone('utc', now());

  -- MRR por carteira de CS, base para NRR/GRR por carteira quando houver série.
  insert into public.analytics_kpi_daily_snapshot as t (
    snapshot_date, metric_key, dimension_key, numeric_value, count_value, calculation_version, source
  )
  select v_date, 'recurring_revenue_by_owner', coalesce(b.cs_owner_id, '_unassigned'),
         round(sum(b.mrr)::numeric, 2), count(*)::integer, v_version, 'hubspot'
  from public.vw_analytics_customer_base b
  where b.is_active_customer is true and b.mrr is not null
  group by coalesce(b.cs_owner_id, '_unassigned')
  on conflict (snapshot_date, metric_key, dimension_key) do update
    set numeric_value = excluded.numeric_value,
        count_value = excluded.count_value,
        calculation_version = excluded.calculation_version,
        captured_at = timezone('utc', now());

  -- Aging de recebíveis, por bucket, na data da captura.
  insert into public.analytics_kpi_daily_snapshot as t (
    snapshot_date, metric_key, dimension_key, numeric_value, count_value, calculation_version, source
  )
  select v_date, 'receivables_aging', bucket, round(sum(balance)::numeric, 2), count(*)::integer, v_version, 'omie'
  from (
    select
      case
        when r.due_date >= current_date then 'a_vencer'
        when current_date - r.due_date between 1 and 7 then '1_7'
        when current_date - r.due_date between 8 and 30 then '8_30'
        when current_date - r.due_date between 31 and 60 then '31_60'
        when current_date - r.due_date between 61 and 90 then '61_90'
        else '90_plus'
      end as bucket,
      r.balance
    from public.analytics_finance_receivables r
    where r.is_current
      and not coalesce(r.is_cancelled, false)
      and coalesce(r.balance, 0) > 0
      and r.due_date is not null
  ) q
  group by bucket
  on conflict (snapshot_date, metric_key, dimension_key) do update
    set numeric_value = excluded.numeric_value,
        count_value = excluded.count_value,
        calculation_version = excluded.calculation_version,
        captured_at = timezone('utc', now());

  -- Pipeline comercial aberto na data da captura.
  insert into public.analytics_kpi_daily_snapshot as t (
    snapshot_date, metric_key, dimension_key, numeric_value, count_value, calculation_version, source
  )
  select v_date, 'commercial_open_pipeline', '_total',
         round(coalesce(sum(d.amount_home), 0)::numeric, 2), count(*)::integer, v_version, 'hubspot'
  from public.hubspot_deals d
  join public.hubspot_pipeline_stages s
    on s.object_type = 'deal' and s.pipeline_id = d.pipeline_id and s.stage_id = d.dealstage
  join public.analytics_source_config c
    on c.object_type = 'deal' and c.hubspot_pipeline_id = d.pipeline_id
   and c.is_active and not coalesce(c.is_archived, false)
  where not coalesce(s.is_closed, false)
  having count(*) > 0
  on conflict (snapshot_date, metric_key, dimension_key) do update
    set numeric_value = excluded.numeric_value,
        count_value = excluded.count_value,
        calculation_version = excluded.calculation_version,
        captured_at = timezone('utc', now());

  return jsonb_build_object(
    'snapshot_date', v_date,
    'calculation_version', v_version,
    'backlog_dimensions', v_rows,
    'captured_at', timezone('utc', now())
  );
end;
$$;

comment on function public.rpc_service_capture_analytics_kpi_snapshot(date) is
  'Captura idempotente do snapshot diário de KPIs. Reexecutar o mesmo dia sobrescreve os valores. Restrita a service_role.';

revoke all on function public.rpc_service_capture_analytics_kpi_snapshot(date) from public, anon, authenticated;
grant execute on function public.rpc_service_capture_analytics_kpi_snapshot(date) to service_role;

-- ---------------------------------------------------------------------------
-- 5. Leitura da configuração pelo produto
-- ---------------------------------------------------------------------------

create or replace function public.rpc_analytics_kpi_settings()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when app_private.can_read_analytics() then
    (
      select jsonb_build_object(
        'mrr_source', s.mrr_source,
        'active_customer_rule', s.active_customer_rule,
        'org_timezone', s.org_timezone,
        'inactivity_threshold_days', s.inactivity_threshold_days,
        'calculation_version', s.calculation_version,
        'decided_at', s.decided_at,
        'history_since', (
          select min(snapshot_date) from public.analytics_kpi_daily_snapshot
        ),
        'history_days', (
          select count(distinct snapshot_date)::integer from public.analytics_kpi_daily_snapshot
        )
      )
      from public.analytics_kpi_settings s
      where s.id
    )
  else '{}'::jsonb end;
$$;

comment on function public.rpc_analytics_kpi_settings() is
  'Expõe ao produto as decisões vigentes de MRR e cliente ativo e o tamanho real da série histórica já capturada.';

revoke all on function public.rpc_analytics_kpi_settings() from public, anon;
grant execute on function public.rpc_analytics_kpi_settings() to authenticated, service_role;
