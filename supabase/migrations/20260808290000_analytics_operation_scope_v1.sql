-- ESCOPO DE OPERACAO NOS READ MODELS DE ANALYTICS
--
-- A operacao e uma preferencia de leitura, nao uma permissao. A atribuicao
-- vem de analytics_source_config e pode continuar sugerida: a interface deve
-- declarar essa condicao, mas os numeros nunca podem misturar pipelines de
-- operacoes distintas depois que o recorte foi selecionado.

create or replace function app_private.set_analytics_operation_scope(p_group_company text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform set_config(
    'app.analytics_group_company',
    coalesce(nullif(btrim(p_group_company), ''), ''),
    true
  );
end;
$$;

revoke all on function app_private.set_analytics_operation_scope(text) from public, anon, authenticated;

do $$
declare
  v_definition text;
  v_scope_predicate constant text :=
    '(nullif(current_setting(''app.analytics_group_company'', true), '''') is null' || chr(10)
    || '       or c.group_company = current_setting(''app.analytics_group_company'', true))';
begin
  -- Mantem os contratos existentes e injeta o predicado em seus CTEs. As RPCs
  -- por operacao abaixo configuram o valor somente durante a transacao atual.
  v_definition := pg_get_functiondef('public.rpc_analytics_commercial_kpis_v2(date,date,text,text)'::regprocedure);
  if position('where (p_owner_id is null or d.owner_id = p_owner_id)' in v_definition) = 0 then
    raise exception 'Contrato inesperado de rpc_analytics_commercial_kpis_v2';
  end if;
  execute replace(
    v_definition,
    'where (p_owner_id is null or d.owner_id = p_owner_id)',
    'where ' || v_scope_predicate || chr(10) || '      and (p_owner_id is null or d.owner_id = p_owner_id)'
  );

  v_definition := pg_get_functiondef('public.rpc_analytics_support_kpis_v2(date,date,text,text)'::regprocedure);
  if position('where (p_pipeline_id is null or t.pipeline_id = p_pipeline_id)' in v_definition) = 0 then
    raise exception 'Contrato inesperado de rpc_analytics_support_kpis_v2';
  end if;
  execute replace(
    v_definition,
    'where (p_pipeline_id is null or t.pipeline_id = p_pipeline_id)',
    'where ' || v_scope_predicate || chr(10) || '      and (p_pipeline_id is null or t.pipeline_id = p_pipeline_id)'
  );

  v_definition := pg_get_functiondef('public.rpc_analytics_support_stage_breakdown(text)'::regprocedure);
  if position('where (p_pipeline_id is null or t.pipeline_id = p_pipeline_id)' in v_definition) = 0 then
    raise exception 'Contrato inesperado de rpc_analytics_support_stage_breakdown';
  end if;
  execute replace(
    v_definition,
    'where (p_pipeline_id is null or t.pipeline_id = p_pipeline_id)',
    'where ' || v_scope_predicate || chr(10) || '      and (p_pipeline_id is null or t.pipeline_id = p_pipeline_id)'
  );

  v_definition := pg_get_functiondef('public.rpc_analytics_support_queue_health()'::regprocedure);
  if position('and c.is_active and not coalesce(c.is_archived, false)' in v_definition) = 0 then
    raise exception 'Contrato inesperado de rpc_analytics_support_queue_health';
  end if;
  execute replace(
    v_definition,
    'and c.is_active and not coalesce(c.is_archived, false)',
    'and c.is_active and not coalesce(c.is_archived, false)' || chr(10) || '     and ' || v_scope_predicate
  );
end;
$$;

create or replace function public.rpc_analytics_commercial_kpis_by_operation(
  p_from date,
  p_to date,
  p_owner_id text default null,
  p_group_company text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app_private.set_analytics_operation_scope(p_group_company);
  return public.rpc_analytics_commercial_kpis_v2(p_from, p_to, p_owner_id, null);
end;
$$;

create or replace function public.rpc_analytics_support_kpis_by_operation(
  p_from date,
  p_to date,
  p_priority text default null,
  p_group_company text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app_private.set_analytics_operation_scope(p_group_company);
  return public.rpc_analytics_support_kpis_v2(p_from, p_to, null, p_priority);
end;
$$;

create or replace function public.rpc_analytics_support_stage_breakdown_by_operation(
  p_pipeline_id text default null,
  p_group_company text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app_private.set_analytics_operation_scope(p_group_company);
  return public.rpc_analytics_support_stage_breakdown(p_pipeline_id);
end;
$$;

create or replace function public.rpc_analytics_support_queue_health_by_operation(
  p_group_company text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app_private.set_analytics_operation_scope(p_group_company);
  return public.rpc_analytics_support_queue_health();
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
      select array_agg(c.hubspot_pipeline_id order by c.hubspot_pipeline_id)
      from public.analytics_source_config c
      where c.object_type = 'deal'
        and c.is_active
        and not coalesce(c.is_archived, false)
        and nullif(btrim(p_group_company), '') is not null
        and c.group_company is distinct from p_group_company
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
      select array_agg(c.hubspot_pipeline_id order by c.hubspot_pipeline_id)
      from public.analytics_source_config c
      where c.object_type = 'ticket'
        and c.is_active
        and not coalesce(c.is_archived, false)
        and nullif(btrim(p_group_company), '') is not null
        and c.group_company is distinct from p_group_company
    ), '{}'::text[])
  );
$$;

revoke all on function public.rpc_analytics_commercial_kpis_by_operation(date, date, text, text) from public, anon;
revoke all on function public.rpc_analytics_support_kpis_by_operation(date, date, text, text) from public, anon;
revoke all on function public.rpc_analytics_support_stage_breakdown_by_operation(text, text) from public, anon;
revoke all on function public.rpc_analytics_support_queue_health_by_operation(text) from public, anon;
revoke all on function public.rpc_analytics_commercial_snapshot_by_operation(date, date, text, text, text[], text) from public, anon;
revoke all on function public.rpc_analytics_cs_snapshot_by_operation(date, date, text, text, text[], text) from public, anon;

grant execute on function public.rpc_analytics_commercial_kpis_by_operation(date, date, text, text) to authenticated, service_role;
grant execute on function public.rpc_analytics_support_kpis_by_operation(date, date, text, text) to authenticated, service_role;
grant execute on function public.rpc_analytics_support_stage_breakdown_by_operation(text, text) to authenticated, service_role;
grant execute on function public.rpc_analytics_support_queue_health_by_operation(text) to authenticated, service_role;
grant execute on function public.rpc_analytics_commercial_snapshot_by_operation(date, date, text, text, text[], text) to authenticated, service_role;
grant execute on function public.rpc_analytics_cs_snapshot_by_operation(date, date, text, text, text[], text) to authenticated, service_role;

comment on function public.rpc_analytics_commercial_kpis_by_operation(date, date, text, text) is
  'KPIs comerciais no recorte de uma operacao do grupo. A operacao e preferencia de leitura, nao permissao.';
comment on function public.rpc_analytics_support_kpis_by_operation(date, date, text, text) is
  'KPIs de suporte no recorte de uma operacao do grupo. A operacao e preferencia de leitura, nao permissao.';

drop view if exists public.vw_admin_analytics_pipeline_catalog_v2;

create view public.vw_admin_analytics_pipeline_catalog_v2
with (security_barrier = true)
as
select
  c.id,
  c.domain_key,
  c.object_type,
  c.hubspot_pipeline_id,
  c.hubspot_pipeline_label,
  coalesce(nullif(btrim(c.label), ''), nullif(btrim(c.hubspot_pipeline_label), ''), c.hubspot_pipeline_id) as label,
  nullif(btrim(c.label), '') is not null
    and nullif(btrim(c.label), '') <> nullif(btrim(c.hubspot_pipeline_label), '') as has_alias,
  c.label as alias,
  c.area_key,
  c.classification_source,
  c.group_company,
  c.group_company_source,
  c.is_active,
  c.is_archived,
  c.discovery_status,
  c.last_discovered_at,
  c.updated_at
from public.analytics_source_config c
where app_private.can_read_analytics();

revoke all on public.vw_admin_analytics_pipeline_catalog_v2 from public, anon;
grant select on public.vw_admin_analytics_pipeline_catalog_v2 to authenticated, service_role;
