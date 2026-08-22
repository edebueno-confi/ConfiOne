-- GOVERNANCA DO MAPA PIPELINE -> AREA -> OPERACAO
--
-- O catalogo analytics_source_config e a fonte canonica local. O pipeline_id
-- identifica a origem; area_key e group_company sao classificacoes persistidas
-- e group_company_source='confirmed' e a unica classificacao elegivel para
-- recortes operacionais publicados. Sugestoes, pendencias e conflitos ficam
-- visiveis no inventario, mas nao entram silenciosamente nos KPIs.

create or replace function public.rpc_analytics_pipeline_inventory(
  p_object_type text default 'ticket'
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

  if p_object_type not in ('deal', 'ticket') then
    raise exception 'Objeto de pipeline invalido.' using errcode = '22023';
  end if;

  with source_rows as (
    select
      c.object_type,
      c.hubspot_pipeline_id as pipeline_id,
      coalesce(nullif(btrim(c.hubspot_pipeline_label), ''), c.hubspot_pipeline_id) as pipeline_name,
      nullif(btrim(c.label), '') as pipeline_alias,
      c.domain_key,
      c.area_key,
      coalesce(nullif(btrim(c.group_company), ''), 'a_definir') as group_company,
      c.group_company_source,
      c.is_active,
      coalesce(c.is_archived, false) as is_archived,
      case when p_object_type = 'deal'
        then (select count(*) from public.hubspot_deals d where d.pipeline_id = c.hubspot_pipeline_id)
        else (select count(*) from public.hubspot_tickets t where t.pipeline_id = c.hubspot_pipeline_id)
      end::integer as records
    from public.analytics_source_config c
    where c.object_type = p_object_type
  ),
  canonical_rows as (
    select
      s.object_type,
      s.pipeline_id,
      max(s.pipeline_name) as pipeline_name,
      max(s.pipeline_alias) as pipeline_alias,
      array_agg(distinct s.domain_key order by s.domain_key) as domain_keys,
      array_agg(distinct s.area_key order by s.area_key) as area_keys,
      array_agg(distinct s.group_company order by s.group_company) as group_companies,
      min(s.area_key) as area_key,
      min(s.group_company) as group_company,
      case when count(distinct s.group_company_source) = 1 then min(s.group_company_source) else 'pending' end as group_company_source,
      bool_or(s.is_active) as is_active,
      bool_and(s.is_archived) as is_archived,
      count(distinct concat_ws('|', coalesce(s.area_key, ''), s.group_company)) as mapping_variants,
      max(s.records)::integer as records
    from source_rows s
    group by s.object_type, s.pipeline_id
  ),
  mapped_rows as (
    select
      c.*,
      case
        when c.is_archived or not c.is_active then 'inactive'
        when c.mapping_variants > 1 then 'ambiguous'
        when c.group_company = 'a_definir'
          or c.area_key = 'a_classificar'
          or c.group_company_source <> 'confirmed' then
          case when c.group_company_source = 'suggested' then 'suggested' else 'unclassified' end
        else 'confirmed'
      end as mapping_state
    from canonical_rows c
  ),
  operations as (
    select
      m.group_company as operation,
      count(*)::integer as pipelines,
      coalesce(sum(m.records), 0)::integer as records
    from mapped_rows m
    where m.mapping_state = 'confirmed' and m.is_active
    group by m.group_company
  )
  select jsonb_build_object(
    'object_type', p_object_type,
    'mapping_contract', 'pipeline_id -> area_key -> group_company',
    'eligible_rule', 'is_active and not archived and mapping_state=confirmed',
    'pipelines', coalesce((select jsonb_agg(row_to_json(m) order by m.records desc, m.pipeline_id) from mapped_rows m), '[]'::jsonb),
    'operations', coalesce((select jsonb_agg(jsonb_build_object('operation', o.operation, 'pipelines', o.pipelines, 'records', o.records) order by o.operation) from operations o), '[]'::jsonb),
    'published_records_all_operations', coalesce((select sum(m.records) from mapped_rows m where m.mapping_state = 'confirmed' and m.is_active), 0),
    'undefined_company_records', coalesce((select sum(m.records) from mapped_rows m where m.mapping_state in ('unclassified', 'suggested') and m.is_active), 0),
    'ambiguous_pipelines', coalesce((select count(*) from mapped_rows m where m.mapping_state = 'ambiguous'), 0),
    'inactive_pipelines', coalesce((select count(*) from mapped_rows m where m.mapping_state = 'inactive'), 0),
    'confirmed_pipelines', coalesce((select count(*) from mapped_rows m where m.mapping_state = 'confirmed'), 0),
    'total_pipelines', coalesce((select count(*) from mapped_rows), 0)
  ) into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_pipeline_inventory(text) is
  'Inventario canonico de pipeline_id, area e operacao. Explicita estados confirmed, suggested, unclassified, ambiguous e inactive e reconcilia Todas contra operacoes elegiveis sem inferencia pelo nome.';

-- Customer Success usa carteira de empresas. Quando uma operacao e escolhida,
-- a associacao publicada ticket -> company e o vinculo real disponivel para
-- restringir a carteira. Sem associacao confirmada, o resultado nao e
-- preenchido por nome de pipeline nem por fallback local.
do $$
declare
  v_definition text;
  v_marker constant text := 'from public.vw_analytics_customer_financial_link';
  v_scoped_from constant text :=
    'from public.vw_analytics_customer_financial_link f' || chr(10)
    || '    where (' || chr(10)
    || '      nullif(current_setting(''app.analytics_group_company'', true), '''') is null' || chr(10)
    || '      or exists (' || chr(10)
    || '        select 1' || chr(10)
    || '        from public.analytics_hubspot_associations a' || chr(10)
    || '        join public.hubspot_tickets t on t.ticket_id = a.from_id' || chr(10)
    || '        join public.analytics_source_config c' || chr(10)
    || '          on c.object_type = ''ticket'' and c.hubspot_pipeline_id = t.pipeline_id' || chr(10)
    || '        where a.from_object_type = ''tickets''' || chr(10)
    || '          and a.to_object_type = ''companies''' || chr(10)
    || '          and a.to_id = f.company_id::text' || chr(10)
    || '          and c.is_active' || chr(10)
    || '          and not coalesce(c.is_archived, false)' || chr(10)
    || '          and c.area_key = ''customer_success''' || chr(10)
    || '          and c.group_company_source = ''confirmed''' || chr(10)
    || '          and c.group_company = current_setting(''app.analytics_group_company'', true)' || chr(10)
    || '      )' || chr(10)
    || '    )';
begin
  v_definition := pg_get_functiondef('public.rpc_analytics_customer_success_kpis_v2()'::regprocedure);
  if position('app.analytics_group_company' in v_definition) = 0 then
    if position(v_marker in v_definition) = 0 then
      raise exception 'Contrato inesperado de rpc_analytics_customer_success_kpis_v2';
    end if;
    execute replace(v_definition, v_marker, v_scoped_from);
  end if;
end;
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
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  perform app_private.set_analytics_operation_scope(v_operation);
  v_result := public.rpc_analytics_customer_success_kpis_v2();

  if v_operation is null then
    v_state := 'available';
    v_reason := null;
  elsif exists (
    select 1 from public.analytics_source_config c
    where c.object_type = 'ticket'
      and c.area_key = 'customer_success'
      and c.group_company = v_operation
      and c.group_company_source = 'confirmed'
      and c.is_active
      and not coalesce(c.is_archived, false)
  ) then
    v_state := 'available';
    v_reason := null;
  elsif exists (
    select 1 from public.analytics_source_config c
    where c.object_type = 'ticket'
      and c.area_key = 'customer_success'
      and c.group_company = v_operation
      and c.is_active
      and not coalesce(c.is_archived, false)
  ) then
    v_state := 'unavailable';
    v_reason := 'operation_mapping_unconfirmed';
  else
    v_state := 'unavailable';
    v_reason := 'operation_pipeline_unavailable';
  end if;

  return coalesce(v_result, '{}'::jsonb) || jsonb_build_object(
    'operation_scope', jsonb_build_object(
      'operation', v_operation,
      'source', 'confirmed ticket pipeline -> company association',
      'state', v_state,
      'reason', v_reason
    )
  );
end;
$$;

revoke all on function public.rpc_analytics_customer_success_kpis_by_operation(text) from public, anon;
grant execute on function public.rpc_analytics_customer_success_kpis_by_operation(text) to authenticated, service_role;

comment on function public.rpc_analytics_customer_success_kpis_by_operation(text) is
  'KPIs de Customer Success filtrados server-side por operacao confirmada no pipeline de ticket e associacao ticket-empresa. Sem classificacao confirmada, retorna estado explicito e nao infere pelo nome.';

revoke all on function public.rpc_analytics_pipeline_inventory(text) from public, anon;
grant execute on function public.rpc_analytics_pipeline_inventory(text) to authenticated, service_role;
