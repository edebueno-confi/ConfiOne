-- A operacao dona do pipeline e uma decisao humana. A sugestao derivada do
-- nome oficial serve apenas para orientar a tela e nunca deve virar verdade
-- publicada sem confirmacao de platform_admin.

create table public.analytics_pipeline_operation_decision_events (
  id uuid primary key default extensions.gen_random_uuid(),
  source_config_id uuid not null references public.analytics_source_config(id),
  previous_group_company text not null,
  decided_group_company text not null,
  actor_user_id uuid not null references auth.users(id),
  occurred_at timestamptz not null default timezone('utc', now())
);

alter table public.analytics_pipeline_operation_decision_events enable row level security;
revoke all on public.analytics_pipeline_operation_decision_events from public, anon, authenticated;

create or replace function public.rpc_admin_set_analytics_pipeline_operation(
  p_id uuid,
  p_group_company text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_row public.analytics_source_config;
  v_group_company text := nullif(btrim(p_group_company), '');
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if v_group_company is null then
    raise exception 'Operacao e obrigatoria.' using errcode = '22023';
  end if;

  select * into v_row from public.analytics_source_config where id = p_id for update;
  if not found then
    raise exception 'Pipeline nao encontrado.' using errcode = 'P0002';
  end if;

  insert into public.analytics_pipeline_operation_decision_events (
    source_config_id, previous_group_company, decided_group_company, actor_user_id
  ) values (
    v_row.id, v_row.group_company, v_group_company, auth.uid()
  );

  update public.analytics_source_config
  set group_company = v_group_company,
      group_company_source = case when v_group_company = 'a_definir' then 'pending' else 'confirmed' end,
      updated_at = timezone('utc', now())
  where id = v_row.id
  returning * into v_row;

  return jsonb_build_object(
    'id', v_row.id,
    'domain_key', v_row.domain_key,
    'object_type', v_row.object_type,
    'hubspot_pipeline_id', v_row.hubspot_pipeline_id,
    'hubspot_pipeline_label', v_row.hubspot_pipeline_label,
    'label', v_row.label,
    'alias', case when v_row.label = v_row.hubspot_pipeline_label then null else v_row.label end,
    'area_key', v_row.area_key,
    'classification_source', v_row.classification_source,
    'group_company', v_row.group_company,
    'group_company_source', v_row.group_company_source,
    'is_active', v_row.is_active,
    'is_archived', v_row.is_archived,
    'discovery_status', v_row.discovery_status,
    'last_discovered_at', v_row.last_discovered_at,
    'updated_at', v_row.updated_at
  );
end;
$$;

revoke all on function public.rpc_admin_set_analytics_pipeline_operation(uuid, text) from public, anon, authenticated;
grant execute on function public.rpc_admin_set_analytics_pipeline_operation(uuid, text) to authenticated;

comment on function public.rpc_admin_set_analytics_pipeline_operation(uuid, text) is
  'Registra a confirmacao humana da operacao dona de um pipeline, preservando a sugestao separada da decisao e o historico de autoria.';
