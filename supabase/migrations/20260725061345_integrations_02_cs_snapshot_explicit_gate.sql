-- Explicita o gate no wrapper publico; a autorizacao nao depende apenas da
-- funcao legada delegada.
alter function public.rpc_analytics_cs_snapshot(date, date, text, text, text[])
  rename to rpc_analytics_cs_snapshot_impl;

create or replace function public.rpc_analytics_cs_snapshot(
  p_from date, p_to date, p_stage_id text, p_priority text, p_excluded_pipeline_ids text[]
)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not app_private.can_read_analytics() then return '{}'::jsonb; end if;
  return public.rpc_analytics_cs_snapshot_impl(p_from, p_to, p_stage_id, p_priority, p_excluded_pipeline_ids);
end;
$$;

create or replace function public.rpc_analytics_cs_snapshot(
  p_from date default null, p_to date default null, p_stage_id text default null, p_priority text default null
)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select public.rpc_analytics_cs_snapshot(p_from, p_to, p_stage_id, p_priority, '{}'::text[]);
$$;

revoke all on function public.rpc_analytics_cs_snapshot(date, date, text, text, text[]) from public, anon;
revoke all on function public.rpc_analytics_cs_snapshot(date, date, text, text) from public, anon;
revoke all on function public.rpc_analytics_cs_snapshot_impl(date, date, text, text, text[]) from public, anon, authenticated;
grant execute on function public.rpc_analytics_cs_snapshot(date, date, text, text, text[]) to authenticated, service_role;
grant execute on function public.rpc_analytics_cs_snapshot(date, date, text, text) to authenticated, service_role;
