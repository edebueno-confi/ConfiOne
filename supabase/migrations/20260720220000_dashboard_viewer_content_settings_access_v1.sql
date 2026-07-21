-- Amplia o recorte do dashboard_viewer de forma governada.
--
-- O papel continua sem acesso ao console administrativo geral. Ele passa a
-- operar apenas as superfícies que o produto deliberadamente expõe:
-- Dashboard Gerencial, integrações/configuração do Dashboard e Knowledge.
-- A sincronização HubSpot e os segredos continuam server-side.

create or replace function app_private.can_manage_knowledge_base()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid()
      and p.is_active
  )
  and (
    app_private.has_global_role('platform_admin'::public.platform_role)
    or app_private.has_global_role('dashboard_viewer'::public.platform_role)
  );
$$;

comment on function app_private.can_manage_knowledge_base() is
  'Gate editorial da Knowledge Base para platform_admin e dashboard_viewer; publicacao continua sujeita ao fluxo editorial e auditoria.';

-- O catalogo de spaces é necessário para o editor escolher a central, mas a
-- escrita de organizations/knowledge_spaces/branding continua protegida pela
-- função de multi-brand, que permanece exclusiva de platform_admin.
create or replace view public.vw_admin_knowledge_spaces
with (security_barrier = true)
as
  with current_actor as (
    select p.id
    from public.profiles as p
    where p.id = auth.uid()
      and p.is_active
      and app_private.can_manage_knowledge_base()
  ),
  primary_domains as (
    select distinct on (ksd.knowledge_space_id)
      ksd.knowledge_space_id,
      ksd.host as primary_domain_host,
      ksd.path_prefix as primary_domain_path_prefix,
      ksd.status as primary_domain_status
    from public.knowledge_space_domains as ksd
    order by ksd.knowledge_space_id, ksd.is_primary desc, ksd.created_at asc, ksd.id asc
  ),
  category_stats as (
    select
      kc.knowledge_space_id,
      count(*)::integer as category_count
    from public.knowledge_categories as kc
    where kc.knowledge_space_id is not null
    group by kc.knowledge_space_id
  ),
  article_stats as (
    select
      ka.knowledge_space_id,
      count(*)::integer as article_count,
      count(*) filter (where ka.status = 'published')::integer as published_article_count
    from public.knowledge_articles as ka
    where ka.knowledge_space_id is not null
    group by ka.knowledge_space_id
  )
  select
    ks.id,
    ks.organization_id,
    o.slug as organization_slug,
    o.display_name as organization_display_name,
    ks.owner_tenant_id,
    owner_tenant.slug as owner_tenant_slug,
    owner_tenant.display_name as owner_tenant_display_name,
    ks.slug,
    ks.display_name,
    ks.status,
    ks.is_primary,
    ks.default_locale,
    pd.primary_domain_host,
    pd.primary_domain_path_prefix,
    pd.primary_domain_status,
    bs.brand_name,
    bs.logo_asset_url,
    coalesce(cs.category_count, 0) as category_count,
    coalesce(ars.article_count, 0) as article_count,
    coalesce(ars.published_article_count, 0) as published_article_count,
    ks.created_at,
    ks.updated_at,
    ks.created_by_user_id,
    creator.full_name as created_by_full_name,
    ks.updated_by_user_id,
    updater.full_name as updated_by_full_name
  from current_actor as ca
  join public.knowledge_spaces as ks
    on true
  join public.organizations as o
    on o.id = ks.organization_id
  left join public.tenants as owner_tenant
    on owner_tenant.id = ks.owner_tenant_id
  left join primary_domains as pd
    on pd.knowledge_space_id = ks.id
  left join public.brand_settings as bs
    on bs.knowledge_space_id = ks.id
  left join category_stats as cs
    on cs.knowledge_space_id = ks.id
  left join article_stats as ars
    on ars.knowledge_space_id = ks.id
  left join public.profiles as creator
    on creator.id = ks.created_by_user_id
  left join public.profiles as updater
    on updater.id = ks.updated_by_user_id
  order by ks.created_at desc, ks.display_name asc;

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
  if not app_private.can_read_analytics() then
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
    if v_row.id is null then
      raise exception 'configuracao nao encontrada';
    end if;
  end if;

  return to_jsonb(v_row);
end;
$$;

comment on function public.rpc_admin_upsert_analytics_source_config(uuid, text, text, text, text, boolean) is
  'Configura fonte/alias do Dashboard Gerencial para platform_admin e dashboard_viewer; o nome oficial do HubSpot permanece imutavel.';

-- Reafirma os grants da superficie substituida nesta migration para manter o
-- contrato explicito mesmo em uma reconstrução completa do banco.
revoke all on function app_private.can_manage_knowledge_base()
from public, anon, authenticated, service_role;

grant execute on function app_private.can_manage_knowledge_base()
to authenticated, service_role;

revoke all on public.vw_admin_knowledge_spaces
from public, anon, authenticated, service_role;

grant select on public.vw_admin_knowledge_spaces
to authenticated, service_role;

revoke all on function public.rpc_admin_upsert_analytics_source_config(
  uuid, text, text, text, text, boolean
)
from public, anon;

grant execute on function public.rpc_admin_upsert_analytics_source_config(
  uuid, text, text, text, text, boolean
)
to authenticated, service_role;
