-- Mantem o nome oficial do HubSpot como fallback quando o alias interno
-- estiver vazio. O read model continua sendo a fonte canonica para a UI.

alter function public.rpc_analytics_cs_snapshot(date, date, text, text, text[])
  rename to rpc_analytics_cs_snapshot_alias_legacy;

create or replace function public.rpc_analytics_cs_snapshot(
  p_from date,
  p_to date,
  p_stage_id text,
  p_priority text,
  p_excluded_pipeline_ids text[]
)
returns jsonb
language sql stable security definer set search_path = ''
as $$
with raw as (
  select public.rpc_analytics_cs_snapshot_alias_legacy(
    p_from, p_to, p_stage_id, p_priority, p_excluded_pipeline_ids
  ) payload
), cfg as (
  select hubspot_pipeline_id as pipeline_id,
    coalesce(nullif(label, ''), nullif(hubspot_pipeline_label, ''), hubspot_pipeline_id) as pipeline_label
  from public.analytics_source_config
  where domain_key = 'cs' and object_type = 'ticket' and is_active
), by_pipeline as (
  select coalesce(jsonb_agg(
    jsonb_set(item.value, '{label}', to_jsonb(coalesce(cfg.pipeline_label, item.value->>'label')))
    order by (item.value->>'ticket_count')::integer desc
  ), '[]'::jsonb) value
  from raw
  cross join lateral jsonb_array_elements(coalesce(raw.payload->'by_pipeline', '[]'::jsonb)) item(value)
  left join cfg on cfg.pipeline_id = item.value->>'pipeline_id'
), by_status as (
  select coalesce(jsonb_agg(
    jsonb_set(item.value, '{pipeline_breakdown}', coalesce((
      select jsonb_agg(
        jsonb_set(detail.value, '{pipeline_label}', to_jsonb(coalesce(cfg.pipeline_label, detail.value->>'pipeline_label')))
        order by (detail.value->>'ticket_count')::integer desc
      )
      from jsonb_array_elements(coalesce(item.value->'pipeline_breakdown', '[]'::jsonb)) detail(value)
      left join cfg on cfg.pipeline_id = detail.value->>'pipeline_id'
    ), '[]'::jsonb))
  ), '[]'::jsonb) value
  from raw
  cross join lateral jsonb_array_elements(coalesce(raw.payload->'by_status', '[]'::jsonb)) item(value)
), by_owner as (
  select coalesce(jsonb_agg(
    jsonb_set(item.value, '{pipeline_breakdown}', coalesce((
      select jsonb_agg(
        jsonb_set(detail.value, '{pipeline_label}', to_jsonb(coalesce(cfg.pipeline_label, detail.value->>'pipeline_label')))
        order by (detail.value->>'ticket_count')::integer desc
      )
      from jsonb_array_elements(coalesce(item.value->'pipeline_breakdown', '[]'::jsonb)) detail(value)
      left join cfg on cfg.pipeline_id = detail.value->>'pipeline_id'
    ), '[]'::jsonb))
  ), '[]'::jsonb) value
  from raw
  cross join lateral jsonb_array_elements(coalesce(raw.payload->'by_owner', '[]'::jsonb)) item(value)
)
select jsonb_set(
  jsonb_set(
    jsonb_set(raw.payload, '{by_pipeline}', (select value from by_pipeline)),
    '{by_status}', (select value from by_status)
  ),
  '{by_owner}', (select value from by_owner)
)
from raw;
$$;

revoke all on function public.rpc_analytics_cs_snapshot(date, date, text, text, text[]) from public, anon;
grant execute on function public.rpc_analytics_cs_snapshot(date, date, text, text, text[]) to authenticated, service_role;

comment on function public.rpc_analytics_cs_snapshot(date, date, text, text, text[]) is
  'Snapshot CS com alias interno opcional e fallback para o nome oficial do pipeline no HubSpot.';

create or replace function public.rpc_analytics_cs_snapshot(
  p_from date default null,
  p_to date default null,
  p_stage_id text default null,
  p_priority text default null
)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select public.rpc_analytics_cs_snapshot(p_from, p_to, p_stage_id, p_priority, '{}'::text[]);
$$;

revoke all on function public.rpc_analytics_cs_snapshot(date, date, text, text) from public, anon;
grant execute on function public.rpc_analytics_cs_snapshot(date, date, text, text) to authenticated, service_role;
