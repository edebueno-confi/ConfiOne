-- Central de Ajuda: contatos públicos configuráveis por knowledge space.
-- Os contatos pertencem ao branding do space e não devem ser duplicados nos artigos.

create or replace view public.vw_admin_knowledge_space_support_contacts
with (security_barrier = true)
as
  select
    ks.id as knowledge_space_id,
    ks.slug as knowledge_space_slug,
    ks.display_name as knowledge_space_display_name,
    coalesce(bs.brand_name, ks.display_name) as brand_name,
    coalesce(bs.support_contacts, '{}'::jsonb) as support_contacts,
    coalesce(bs.updated_at, ks.updated_at) as updated_at
  from public.knowledge_spaces as ks
  left join public.brand_settings as bs
    on bs.knowledge_space_id = ks.id
  where app_private.can_manage_multi_brand_foundation();

revoke all on public.vw_admin_knowledge_space_support_contacts
from public, anon, authenticated, service_role;

grant select on public.vw_admin_knowledge_space_support_contacts to authenticated, service_role;

create or replace function public.rpc_admin_update_knowledge_space_support_contacts(
  p_knowledge_space_id uuid,
  p_email text default null,
  p_whatsapp text default null,
  p_website_url text default null,
  p_status_page_url text default null,
  p_docs_url text default null
)
returns public.brand_settings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.brand_settings;
  v_updated public.brand_settings;
  v_email text := nullif(btrim(p_email), '');
  v_whatsapp text := nullif(btrim(p_whatsapp), '');
  v_website_url text := nullif(btrim(p_website_url), '');
  v_status_page_url text := nullif(btrim(p_status_page_url), '');
  v_docs_url text := nullif(btrim(p_docs_url), '');
begin
  if not app_private.can_manage_multi_brand_foundation() then
    raise exception 'rpc_admin_update_knowledge_space_support_contacts denied';
  end if;

  if not exists (
    select 1
    from public.knowledge_spaces as ks
    where ks.id = p_knowledge_space_id
      and ks.status <> 'archived'
  ) then
    raise exception 'knowledge space not found or archived';
  end if;

  if v_email is not null and (
    length(v_email) > 254
    or v_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  ) then
    raise exception 'support email is invalid';
  end if;

  if v_whatsapp is not null and length(v_whatsapp) > 40 then
    raise exception 'support whatsapp is too long';
  end if;

  if (v_website_url is not null and (length(v_website_url) > 2048 or v_website_url !~* '^(https?://|/)[^[:space:]]+$'))
    or (v_status_page_url is not null and (length(v_status_page_url) > 2048 or v_status_page_url !~* '^(https?://|/)[^[:space:]]+$'))
    or (v_docs_url is not null and (length(v_docs_url) > 2048 or v_docs_url !~* '^(https?://|/)[^[:space:]]+$')) then
    raise exception 'support URL is invalid';
  end if;

  select *
  into v_existing
  from public.brand_settings
  where knowledge_space_id = p_knowledge_space_id
  for update;

  if v_existing is null then
    insert into public.brand_settings (
      knowledge_space_id,
      brand_name,
      support_contacts,
      created_by_user_id,
      updated_by_user_id
    )
    select
      ks.id,
      ks.display_name,
      jsonb_strip_nulls(jsonb_build_object(
        'email', v_email,
        'whatsapp', v_whatsapp,
        'websiteUrl', v_website_url,
        'statusPageUrl', v_status_page_url,
        'docsUrl', v_docs_url
      )),
      auth.uid(),
      auth.uid()
    from public.knowledge_spaces as ks
    where ks.id = p_knowledge_space_id
    returning * into v_updated;
  else
    update public.brand_settings
    set
      support_contacts = jsonb_strip_nulls(jsonb_build_object(
        'email', v_email,
        'whatsapp', v_whatsapp,
        'websiteUrl', v_website_url,
        'statusPageUrl', v_status_page_url,
        'docsUrl', v_docs_url
      )),
      updated_by_user_id = auth.uid()
    where knowledge_space_id = p_knowledge_space_id
    returning * into v_updated;
  end if;

  return v_updated;
end;
$$;

revoke all on function public.rpc_admin_update_knowledge_space_support_contacts(uuid, text, text, text, text, text)
from public, anon, authenticated, service_role;

grant execute on function public.rpc_admin_update_knowledge_space_support_contacts(uuid, text, text, text, text, text)
to authenticated, service_role;

comment on view public.vw_admin_knowledge_space_support_contacts is
  'Read model administrativo dos contatos públicos configuráveis da Central de Ajuda por knowledge space.';

comment on function public.rpc_admin_update_knowledge_space_support_contacts(uuid, text, text, text, text, text) is
  'Atualiza de forma auditada os contatos públicos exibidos no rodapé da Central de Ajuda.';
