-- ANALYTICS-KPI-DAILY-JOBS-V1
--
-- Agendamento das duas rotinas que sustentam os KPIs históricos e híbridos.
--
-- 1. Captura diária de snapshot
-- -----------------------------
-- É o item cuja perda é irreversível. Churn, novo MRR, NRR, GRR, backlog
-- histórico e aging histórico só existem se houver série temporal, e a série só
-- pode começar a partir da primeira captura. Cada dia sem execução é um ponto
-- que não se recupera depois, porque a origem não guarda o estado passado.
--
-- Executa às 06:10 UTC, depois da sincronização incremental das 02h e 03h, para
-- que o snapshot registre o estado já atualizado do dia.
--
-- 2. Convergência dos vínculos
-- ----------------------------
-- A ingestão de vínculos é retomável e idempotente, mas cada execução cobre uma
-- fatia da base dentro do orçamento de tempo. Rodando diariamente, a cobertura
-- converge sozinha e passa a acompanhar tickets e negócios novos, sem operação
-- manual. Ao terminar a base, a marca d'água zera e o ciclo recomeça, o que
-- também captura vínculos criados ou removidos depois.
--
-- Ambas usam o mesmo padrão de segurança das rotinas existentes: o segredo vive
-- no Vault e é lido dentro de função `security definer`.

create or replace function app_private.enqueue_analytics_kpi_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  -- A captura roda inteiramente no banco: não há chamada HTTP, então não existe
  -- teto de tempo de função de borda nem dependência de rede.
  set local statement_timeout = '120s';
  select public.rpc_service_capture_analytics_kpi_snapshot(null) into v_result;
  return v_result;
end;
$$;

comment on function app_private.enqueue_analytics_kpi_snapshot() is
  'Executa a captura diária do snapshot de KPIs. Roda no banco, sem chamada externa. Restrita a postgres e service_role.';

revoke all on function app_private.enqueue_analytics_kpi_snapshot() from public, anon, authenticated;
grant execute on function app_private.enqueue_analytics_kpi_snapshot() to postgres, service_role;

-- A captura é `security definer` e exige `service_role`; ao ser chamada pelo
-- cron o papel corrente é `postgres`, então a verificação precisa aceitar os
-- dois. Nenhuma outra porta é aberta: `authenticated` e `anon` seguem sem grant.
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
  if auth.role() is distinct from 'service_role'
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  select calculation_version into v_version from public.analytics_kpi_settings where id;
  v_version := coalesce(v_version, 'kpi_v1');
  v_date := coalesce(p_snapshot_date, (timezone('utc', now()))::date);

  insert into public.analytics_kpi_daily_snapshot as t (
    snapshot_date, metric_key, dimension_key, numeric_value, count_value, calculation_version, source
  )
  select v_date, 'support_backlog_open', coalesce(k.pipeline_id, '_unknown'), null, k.open_tickets, v_version, 'hubspot'
  from (
    select tk.pipeline_id, count(*)::integer as open_tickets
    from public.hubspot_tickets tk
    join public.hubspot_pipeline_stages s
      on s.object_type = 'ticket' and s.pipeline_id = tk.pipeline_id and s.stage_id = tk.pipeline_stage
    join public.analytics_source_config c
      on c.object_type = 'ticket' and c.hubspot_pipeline_id = tk.pipeline_id
     and c.is_active and not coalesce(c.is_archived, false)
    where coalesce(s.metadata ->> 'ticketState', '') = 'OPEN'
    group by tk.pipeline_id
  ) k
  on conflict (snapshot_date, metric_key, dimension_key) do update
    set count_value = excluded.count_value, numeric_value = excluded.numeric_value,
        calculation_version = excluded.calculation_version, captured_at = timezone('utc', now());
  get diagnostics v_rows = row_count;

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
    set count_value = excluded.count_value, calculation_version = excluded.calculation_version,
        captured_at = timezone('utc', now());

  insert into public.analytics_kpi_daily_snapshot as t (
    snapshot_date, metric_key, dimension_key, numeric_value, count_value, calculation_version, source
  )
  select v_date, 'recurring_revenue_total', '_total',
         round(sum(b.mrr)::numeric, 2), count(*)::integer, v_version, 'hubspot'
  from public.vw_analytics_customer_base b
  where b.is_active_customer is true and b.mrr is not null
  having count(*) > 0
  on conflict (snapshot_date, metric_key, dimension_key) do update
    set numeric_value = excluded.numeric_value, count_value = excluded.count_value,
        calculation_version = excluded.calculation_version, captured_at = timezone('utc', now());

  insert into public.analytics_kpi_daily_snapshot as t (
    snapshot_date, metric_key, dimension_key, numeric_value, count_value, calculation_version, source
  )
  select v_date, 'active_customers', '_total', null, count(*)::integer, v_version, 'hubspot'
  from public.vw_analytics_customer_base b
  where b.is_active_customer is true
  having count(*) > 0
  on conflict (snapshot_date, metric_key, dimension_key) do update
    set count_value = excluded.count_value, calculation_version = excluded.calculation_version,
        captured_at = timezone('utc', now());

  -- Recorrência por cliente: é o grão que permite reconstruir novo MRR,
  -- expansão, contração e churn comparando dois dias quaisquer da série.
  insert into public.analytics_kpi_daily_snapshot as t (
    snapshot_date, metric_key, dimension_key, numeric_value, count_value, calculation_version, source
  )
  select v_date, 'recurring_revenue_by_customer', b.company_id, round(b.mrr::numeric, 2), 1, v_version, 'hubspot'
  from public.vw_analytics_customer_base b
  where b.is_active_customer is true and b.mrr is not null
  on conflict (snapshot_date, metric_key, dimension_key) do update
    set numeric_value = excluded.numeric_value, calculation_version = excluded.calculation_version,
        captured_at = timezone('utc', now());

  insert into public.analytics_kpi_daily_snapshot as t (
    snapshot_date, metric_key, dimension_key, numeric_value, count_value, calculation_version, source
  )
  select v_date, 'recurring_revenue_by_owner', coalesce(b.cs_owner_id, '_unassigned'),
         round(sum(b.mrr)::numeric, 2), count(*)::integer, v_version, 'hubspot'
  from public.vw_analytics_customer_base b
  where b.is_active_customer is true and b.mrr is not null
  group by coalesce(b.cs_owner_id, '_unassigned')
  on conflict (snapshot_date, metric_key, dimension_key) do update
    set numeric_value = excluded.numeric_value, count_value = excluded.count_value,
        calculation_version = excluded.calculation_version, captured_at = timezone('utc', now());

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
    where r.is_current and not coalesce(r.is_cancelled, false)
      and coalesce(r.balance, 0) > 0 and r.due_date is not null
  ) q
  group by bucket
  on conflict (snapshot_date, metric_key, dimension_key) do update
    set numeric_value = excluded.numeric_value, count_value = excluded.count_value,
        calculation_version = excluded.calculation_version, captured_at = timezone('utc', now());

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
    set numeric_value = excluded.numeric_value, count_value = excluded.count_value,
        calculation_version = excluded.calculation_version, captured_at = timezone('utc', now());

  return jsonb_build_object(
    'snapshot_date', v_date, 'calculation_version', v_version,
    'backlog_dimensions', v_rows, 'captured_at', timezone('utc', now())
  );
end;
$$;

revoke all on function public.rpc_service_capture_analytics_kpi_snapshot(date) from public, anon, authenticated;
grant execute on function public.rpc_service_capture_analytics_kpi_snapshot(date) to service_role, postgres;

-- ---------------------------------------------------------------------------
-- Agendas
-- ---------------------------------------------------------------------------

do $$
declare
  v_job_id bigint;
begin
  if to_regclass('cron.job') is null then
    raise exception 'Extensão pg_cron não materializou o catálogo cron.job.';
  end if;

  select jobid into v_job_id from cron.job where jobname = 'analytics-kpi-daily-snapshot' limit 1;
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;

  perform cron.schedule(
    'analytics-kpi-daily-snapshot',
    '10 6 * * *',
    $cron$ select app_private.enqueue_analytics_kpi_snapshot(); $cron$
  );

  select jobid into v_job_id from cron.job where jobname = 'analytics-associations-daily' limit 1;
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;

  perform cron.schedule(
    'analytics-associations-daily',
    '30 6 * * *',
    $cron$ select app_private.enqueue_hubspot_associations_sync('tickets'); $cron$
  );

  select jobid into v_job_id from cron.job where jobname = 'analytics-associations-deals-daily' limit 1;
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;

  perform cron.schedule(
    'analytics-associations-deals-daily',
    '40 6 * * *',
    $cron$ select app_private.enqueue_hubspot_associations_sync('deals'); $cron$
  );
end $$;
