-- Alias interno opcional: o nome oficial do HubSpot permanece imutavel.

alter table public.analytics_source_config
  alter column label drop not null;

create or replace function public.rpc_admin_upsert_analytics_source_config(
  p_id uuid default null,
  p_domain_key text default null,
  p_object_type text default null,
  p_hubspot_pipeline_id text default null,
  p_label text default null,
  p_is_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.analytics_source_config;
  v_domain text := lower(trim(coalesce(p_domain_key, '')));
  v_object text := lower(trim(coalesce(p_object_type, '')));
  v_pipeline text := trim(coalesce(p_hubspot_pipeline_id, ''));
  v_label text := nullif(trim(coalesce(p_label, '')), '');
begin
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_upsert_analytics_source_config denied';
  end if;
  if v_domain not in ('commercial', 'cs') then
    raise exception 'domain_key invalido';
  end if;
  if v_object not in ('deal', 'ticket') then
    raise exception 'object_type invalido';
  end if;
  if v_pipeline !~ '^[0-9]+$' then
    raise exception 'hubspot_pipeline_id deve conter apenas numeros';
  end if;

  if p_id is null then
    insert into public.analytics_source_config
      (domain_key, object_type, hubspot_pipeline_id, label, is_active)
    values (v_domain, v_object, v_pipeline, v_label, coalesce(p_is_active, true))
    on conflict (domain_key, object_type, hubspot_pipeline_id)
    do update set label = excluded.label, is_active = excluded.is_active
    returning * into v_row;
  else
    update public.analytics_source_config
      set domain_key = v_domain,
          object_type = v_object,
          hubspot_pipeline_id = v_pipeline,
          label = v_label,
          is_active = coalesce(p_is_active, true)
    where id = p_id
    returning * into v_row;
    if v_row.id is null then raise exception 'configuracao nao encontrada'; end if;
  end if;
  return to_jsonb(v_row);
end;
$$;

revoke all on function public.rpc_admin_upsert_analytics_source_config(uuid, text, text, text, text, boolean) from public, anon;
grant execute on function public.rpc_admin_upsert_analytics_source_config(uuid, text, text, text, text, boolean) to authenticated;

comment on column public.analytics_source_config.label is
  'Alias interno opcional. Quando nulo, a interface usa hubspot_pipeline_label e nunca altera o nome oficial no HubSpot.';
