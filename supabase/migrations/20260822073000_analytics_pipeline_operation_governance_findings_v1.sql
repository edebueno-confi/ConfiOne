-- CORRECOES DOS FINDINGS F-DATA-001 E F-DATA-002
--
-- A elegibilidade publicada e uma regra server-side comum: somente pipeline
-- ativo e nao arquivado, area conhecida, operacao definida, fonte confirmada e
-- uma unica variante de area/operacao podem alimentar um recorte publicado.
-- A funcao fica em app_private para impedir que a UI replique a regra.

create or replace function app_private.analytics_pipeline_operation_eligible(
  p_object_type text,
  p_pipeline_id text,
  p_group_company text default null,
  p_area_key text default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with active_rows as (
    select
      c.area_key,
      nullif(btrim(c.group_company), '') as group_company,
      c.group_company_source
    from public.analytics_source_config c
    where c.object_type = p_object_type
      and c.hubspot_pipeline_id = p_pipeline_id
      and c.is_active
      and not coalesce(c.is_archived, false)
  ), aggregate_state as (
    select
      count(*) as row_count,
      count(distinct concat_ws('|', coalesce(area_key, ''), coalesce(group_company, ''))) as mapping_variants,
      coalesce(bool_and(group_company_source = 'confirmed'), false) as all_sources_confirmed,
      min(area_key) as area_key,
      min(group_company) as group_company
    from active_rows
  )
  select
    a.row_count > 0
    and a.mapping_variants = 1
    and a.all_sources_confirmed
    and nullif(btrim(a.area_key), '') is not null
    and a.area_key <> 'a_classificar'
    and nullif(btrim(a.group_company), '') is not null
    and a.group_company <> 'a_definir'
    and (nullif(btrim(p_group_company), '') is null or a.group_company = btrim(p_group_company))
    and (nullif(btrim(p_area_key), '') is null or a.area_key = btrim(p_area_key))
  from aggregate_state a;
$$;

revoke all on function app_private.analytics_pipeline_operation_eligible(text, text, text, text) from public, anon, authenticated;

comment on function app_private.analytics_pipeline_operation_eligible(text, text, text, text) is
  'Elegibilidade canonica server-side para pipeline publicado: ativo, nao arquivado, area classificada, operacao confirmada e sem variantes ambiguas.';

do $$
declare
  v_definition text;
  v_old text := 'c.group_company = current_setting(''app.analytics_group_company'', true)';
  v_new text;
begin
  v_definition := pg_get_functiondef('public.rpc_analytics_commercial_kpis_v2(date,date,text,text)'::regprocedure);
  v_new := 'app_private.analytics_pipeline_operation_eligible(''deal'', c.hubspot_pipeline_id, current_setting(''app.analytics_group_company'', true), ''commercial'')';
  if position('analytics_pipeline_operation_eligible' in v_definition) = 0 then
    if position(v_old in v_definition) = 0 then
      raise exception 'Contrato inesperado de rpc_analytics_commercial_kpis_v2';
    end if;
    execute replace(v_definition, v_old, v_new);
  end if;

  v_definition := pg_get_functiondef('public.rpc_analytics_support_kpis_v2(date,date,text,text)'::regprocedure);
  v_new := 'app_private.analytics_pipeline_operation_eligible(''ticket'', c.hubspot_pipeline_id, current_setting(''app.analytics_group_company'', true), ''support'')';
  if position('analytics_pipeline_operation_eligible' in v_definition) = 0 then
    if position(v_old in v_definition) = 0 then
      raise exception 'Contrato inesperado de rpc_analytics_support_kpis_v2';
    end if;
    execute replace(v_definition, v_old, v_new);
    execute replace(
      replace(v_definition, v_old, v_new),
      'where object_type = ''ticket'' and is_active and not coalesce(is_archived, false)',
      'where object_type = ''ticket'' and is_active and not coalesce(is_archived, false)' || chr(10)
        || '      and app_private.analytics_pipeline_operation_eligible(''ticket'', hubspot_pipeline_id, current_setting(''app.analytics_group_company'', true), ''support'')'
    );
  end if;

  v_definition := pg_get_functiondef('public.rpc_analytics_support_stage_breakdown(text)'::regprocedure);
  v_new := 'app_private.analytics_pipeline_operation_eligible(''ticket'', c.hubspot_pipeline_id, current_setting(''app.analytics_group_company'', true), ''support'')';
  if position('analytics_pipeline_operation_eligible' in v_definition) = 0 then
    if position(v_old in v_definition) = 0 then
      raise exception 'Contrato inesperado de rpc_analytics_support_stage_breakdown';
    end if;
    execute replace(v_definition, v_old, v_new);
  end if;

  v_definition := pg_get_functiondef('public.rpc_analytics_support_queue_health()'::regprocedure);
  v_new := 'app_private.analytics_pipeline_operation_eligible(''ticket'', c.hubspot_pipeline_id, current_setting(''app.analytics_group_company'', true), ''support'')';
  if position('analytics_pipeline_operation_eligible' in v_definition) = 0 then
    if position(v_old in v_definition) = 0 then
      raise exception 'Contrato inesperado de rpc_analytics_support_queue_health';
    end if;
    execute replace(v_definition, v_old, v_new);
    execute replace(
      replace(v_definition, v_old, v_new),
      'where object_type = ''ticket'' and is_active and not coalesce(is_archived, false)',
      'where object_type = ''ticket'' and is_active and not coalesce(is_archived, false)' || chr(10)
        || '          and app_private.analytics_pipeline_operation_eligible(''ticket'', hubspot_pipeline_id, current_setting(''app.analytics_group_company'', true), ''support'')'
    );
  end if;

  v_definition := pg_get_functiondef('public.rpc_analytics_customer_success_kpis_v2()'::regprocedure);
  if position('analytics_pipeline_operation_eligible' in v_definition) = 0 then
    if position(v_old in v_definition) = 0 then
      raise exception 'Contrato inesperado de rpc_analytics_customer_success_kpis_v2';
    end if;
    execute replace(
      v_definition,
      v_old,
      'app_private.analytics_pipeline_operation_eligible(''ticket'', c.hubspot_pipeline_id, current_setting(''app.analytics_group_company'', true), ''customer_success'')'
    );
  end if;
end;
$$;

create or replace function public.rpc_analytics_commercial_snapshot_by_operation(
  p_from date default null,
  p_to date default null,
  p_owner_id text default null,
  p_stage_id text default null,
  p_excluded_pipeline_ids text[] default '{}'::text[],
  p_group_company text default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.rpc_analytics_commercial_snapshot(
    p_from,
    p_to,
    p_owner_id,
    p_stage_id,
    coalesce(p_excluded_pipeline_ids, '{}'::text[]) || coalesce((
      select array_agg(p.pipeline_id order by p.pipeline_id)
      from (
        select distinct d.pipeline_id
        from public.hubspot_deals d
        where d.pipeline_id is not null
      ) p
      where not app_private.analytics_pipeline_operation_eligible(
        'deal', p.pipeline_id, nullif(btrim(p_group_company), ''), 'commercial'
      )
    ), '{}'::text[])
  );
$$;

create or replace function public.rpc_analytics_cs_snapshot_by_operation(
  p_from date default null,
  p_to date default null,
  p_stage_id text default null,
  p_priority text default null,
  p_excluded_pipeline_ids text[] default '{}'::text[],
  p_group_company text default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.rpc_analytics_cs_snapshot(
    p_from,
    p_to,
    p_stage_id,
    p_priority,
    coalesce(p_excluded_pipeline_ids, '{}'::text[]) || coalesce((
      select array_agg(p.pipeline_id order by p.pipeline_id)
      from (
        select distinct t.pipeline_id
        from public.hubspot_tickets t
        where t.pipeline_id is not null
      ) p
      where not app_private.analytics_pipeline_operation_eligible(
        'ticket', p.pipeline_id, nullif(btrim(p_group_company), ''), 'support'
      )
    ), '{}'::text[])
  );
$$;

create or replace function public.rpc_analytics_customer_success_kpis_by_operation(
  p_group_company text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_operation text := nullif(btrim(p_group_company), '');
  v_state text;
  v_reason text;
  v_ticket_count integer := 0;
  v_associated_ticket_count integer := 0;
  v_coverage_percent numeric := 0;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  perform app_private.set_analytics_operation_scope(v_operation);
  v_result := public.rpc_analytics_customer_success_kpis_v2();

  with eligible_pipelines as (
    select distinct c.hubspot_pipeline_id
    from public.analytics_source_config c
    where c.object_type = 'ticket'
      and c.area_key = 'customer_success'
      and app_private.analytics_pipeline_operation_eligible(
        'ticket', c.hubspot_pipeline_id, v_operation, 'customer_success'
      )
  ), ticket_rows as (
    select distinct t.ticket_id
    from public.hubspot_tickets t
    join eligible_pipelines p on p.hubspot_pipeline_id = t.pipeline_id
  )
  select
    count(*)::integer,
    count(*) filter (where exists (
      select 1
      from public.analytics_hubspot_associations a
      join public.vw_analytics_customer_financial_link f
        on f.company_id::text = a.to_id
      where a.from_object_type = 'tickets'
        and a.from_id = ticket_rows.ticket_id
        and a.to_object_type = 'companies'
    ))::integer
  into v_ticket_count, v_associated_ticket_count
  from ticket_rows;

  if v_ticket_count = 0 then
    v_state := 'unavailable';
    v_reason := 'operation_ticket_coverage_missing';
  elsif v_associated_ticket_count = 0 then
    v_state := 'unavailable';
    v_reason := 'ticket_company_association_missing';
  elsif v_associated_ticket_count < v_ticket_count then
    v_state := 'partial';
    v_reason := 'ticket_company_association_partial';
  else
    v_state := 'available';
    v_reason := null;
  end if;

  v_coverage_percent := round((v_associated_ticket_count::numeric * 100) / nullif(v_ticket_count, 0), 2);

  return coalesce(v_result, '{}'::jsonb) || jsonb_build_object(
    'operation_scope', jsonb_build_object(
      'operation', v_operation,
      'source', 'confirmed ticket pipeline -> company association',
      'state', v_state,
      'reason', v_reason,
      'ticket_count', v_ticket_count,
      'associated_ticket_count', v_associated_ticket_count,
      'coverage_percent', coalesce(v_coverage_percent, 0)
    )
  );
end;
$$;

revoke all on function public.rpc_analytics_commercial_snapshot_by_operation(date, date, text, text, text[], text) from public, anon;
revoke all on function public.rpc_analytics_cs_snapshot_by_operation(date, date, text, text, text[], text) from public, anon;
revoke all on function public.rpc_analytics_customer_success_kpis_by_operation(text) from public, anon;

grant execute on function public.rpc_analytics_commercial_snapshot_by_operation(date, date, text, text, text[], text) to authenticated, service_role;
grant execute on function public.rpc_analytics_cs_snapshot_by_operation(date, date, text, text, text[], text) to authenticated, service_role;
grant execute on function public.rpc_analytics_customer_success_kpis_by_operation(text) to authenticated, service_role;

comment on function public.rpc_analytics_commercial_snapshot_by_operation(date, date, text, text, text[], text) is
  'Snapshot comercial publica somente pipelines elegiveis por area, operacao confirmada, atividade e ausencia de ambiguidade.';
comment on function public.rpc_analytics_cs_snapshot_by_operation(date, date, text, text, text[], text) is
  'Snapshot de Customer Success publica somente pipelines elegiveis de CS; cobertura ticket-empresa e reportada no wrapper de KPIs.';
