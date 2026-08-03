-- DASHBOARD-HUBSPOT-CATALOG-SERVICE-IDENTITY-V1
-- O worker usa o cliente service-side protegido. A checagem anterior dependia
-- diretamente de request.jwt.claim.role e rejeitava esse caminho no runtime
-- local, embora o RPC estivesse corretamente restrito a service_role.

create or replace function public.rpc_service_reconcile_hubspot_pipeline_catalog(
  p_object_type text,
  p_pipelines jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pipeline jsonb;
  v_pipeline_id text;
  v_label text;
  v_count integer := 0;
  v_existing public.analytics_source_config;
begin
  if not app_private.is_internal_service_request() then
    raise exception 'Somente o serviço de sincronização pode reconciliar o catálogo.' using errcode = '42501';
  end if;
  if p_object_type not in ('deal', 'ticket') or jsonb_typeof(p_pipelines) <> 'array' then
    raise exception 'Catálogo de pipelines inválido.' using errcode = '22023';
  end if;

  for v_pipeline in select value from jsonb_array_elements(p_pipelines)
  loop
    v_pipeline_id := nullif(btrim(v_pipeline->>'pipeline_id'), '');
    v_label := nullif(btrim(v_pipeline->>'label'), '');
    if v_pipeline_id is null or v_label is null then
      continue;
    end if;

    select *
    into v_existing
    from public.analytics_source_config
    where object_type = p_object_type
      and hubspot_pipeline_id = v_pipeline_id
    order by case when domain_key in ('commercial', 'cs') then 0 else 1 end, created_at
    limit 1
    for update;

    if v_existing.id is null then
      insert into public.analytics_source_config(
        domain_key,
        object_type,
        hubspot_pipeline_id,
        hubspot_pipeline_label,
        label,
        is_active,
        area_key,
        classification_source,
        is_archived,
        discovery_status,
        last_discovered_at
      )
      values(
        case when p_object_type = 'deal' then 'commercial' else 'unclassified' end,
        p_object_type,
        v_pipeline_id,
        v_label,
        v_label,
        true,
        case when p_object_type = 'deal' then 'commercial' else 'a_classificar' end,
        'pending',
        false,
        'active',
        timezone('utc', now())
      );
    else
      update public.analytics_source_config
      set hubspot_pipeline_label = v_label,
          is_archived = false,
          discovery_status = 'active',
          last_discovered_at = timezone('utc', now()),
          is_active = case when v_existing.classification_source = 'pending' then true else v_existing.is_active end,
          updated_at = timezone('utc', now())
      where id = v_existing.id;
    end if;
    v_count := v_count + 1;
  end loop;

  update public.analytics_source_config c
  set is_archived = true,
      discovery_status = 'archived',
      is_active = false,
      updated_at = timezone('utc', now())
  where c.object_type = p_object_type
    and c.last_discovered_at is not null
    and not exists(
      select 1
      from jsonb_array_elements(p_pipelines) item
      where item->>'pipeline_id' = c.hubspot_pipeline_id
    );

  return v_count;
end;
$$;

revoke all on function public.rpc_service_reconcile_hubspot_pipeline_catalog(text, jsonb) from public, anon, authenticated;
grant execute on function public.rpc_service_reconcile_hubspot_pipeline_catalog(text, jsonb) to service_role;
