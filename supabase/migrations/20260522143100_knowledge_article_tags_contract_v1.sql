alter table public.knowledge_articles
  add column if not exists tags text[] not null default '{}'::text[];

comment on column public.knowledge_articles.tags is
  'Tags editoriais normalizadas do artigo de Knowledge. Mantidas por RPC administrativa, limite operacional de 10 tags.';

create or replace function app_private.normalize_knowledge_article_tags(p_tags text[] default '{}'::text[])
returns text[]
language sql
stable
set search_path = ''
as $$
  with raw_tags as (
    select unnest(coalesce(p_tags, '{}'::text[])) as raw_tag
  ),
  normalized as (
    select
      btrim(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              translate(
                lower(btrim(raw_tag)),
                'áàãâäéèêëíìîïóòõôöúùûüçñ',
                'aaaaaeeeeiiiiooooouuuucn'
              ),
              '[^a-z0-9 -]',
              '',
              'g'
            ),
            '\s+',
            '-',
            'g'
          ),
          '-+',
          '-',
          'g'
        ),
        '-'
      ) as tag
    from raw_tags
  ),
  safe_tags as (
    select distinct tag
    from normalized
    where tag ~ '^[a-z0-9][a-z0-9-]{0,31}$'
    order by tag
    limit 11
  )
  select coalesce(array_agg(tag order by tag), '{}'::text[])
  from safe_tags;
$$;

create or replace function public.rpc_admin_replace_knowledge_article_tags_v1(
  p_article_id uuid,
  p_knowledge_space_id uuid,
  p_tags text[] default '{}'::text[]
)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_article public.knowledge_articles;
  v_tags text[];
begin
  if not app_private.can_manage_knowledge_base() then
    raise exception 'rpc_admin_replace_knowledge_article_tags_v1 denied';
  end if;

  select *
  into v_article
  from public.knowledge_articles as ka
  where ka.id = p_article_id;

  if v_article.id is null then
    raise exception 'knowledge article not found';
  end if;

  if v_article.knowledge_space_id is distinct from p_knowledge_space_id then
    raise exception 'knowledge article space mismatch';
  end if;

  if v_article.status = 'archived' then
    raise exception 'archived knowledge article tags are read only';
  end if;

  v_tags := app_private.normalize_knowledge_article_tags(p_tags);

  if cardinality(v_tags) > 10 then
    raise exception 'knowledge article tags limit exceeded';
  end if;

  update public.knowledge_articles
  set
    tags = v_tags,
    updated_by_user_id = v_actor_user_id
  where id = p_article_id
  returning tags
  into v_tags;

  return v_tags;
end;
$$;

create or replace view public.vw_admin_knowledge_articles_list_v2
with (security_barrier = true)
as
  with current_actor as (
    select p.id
    from public.profiles as p
    where p.id = auth.uid()
      and p.is_active
      and app_private.can_manage_knowledge_base()
  ),
  revision_stats as (
    select
      kar.article_id,
      count(*)::integer as revision_count,
      max(kar.created_at) as latest_revision_at
    from public.knowledge_article_revisions as kar
    group by kar.article_id
  )
  select
    ka.id,
    ka.knowledge_space_id,
    ks.slug as knowledge_space_slug,
    ks.display_name as knowledge_space_display_name,
    ks.status as knowledge_space_status,
    o.id as organization_id,
    o.slug as organization_slug,
    o.display_name as organization_display_name,
    ks.owner_tenant_id,
    owner_tenant.slug as owner_tenant_slug,
    owner_tenant.display_name as owner_tenant_display_name,
    ka.tenant_id,
    t.slug as tenant_slug,
    t.display_name as tenant_display_name,
    ka.category_id,
    kc.name as category_name,
    kc.slug as category_slug,
    ka.visibility,
    ka.status,
    ka.title,
    ka.slug,
    ka.summary,
    ka.source_path,
    ka.source_hash,
    ka.current_revision_number,
    coalesce(stats.revision_count, 0) as revision_count,
    stats.latest_revision_at,
    ka.submitted_for_review_at,
    ka.published_at,
    ka.archived_at,
    ka.created_at,
    ka.updated_at,
    creator.full_name as created_by_full_name,
    updater.full_name as updated_by_full_name,
    pub.public_article_path,
    coalesce(editorial_draft.article_id is not null, false) as has_editorial_draft,
    editorial_draft.updated_at as editorial_draft_updated_at,
    ka.tags
  from public.knowledge_articles as ka
  join current_actor
    on true
  join public.knowledge_spaces as ks
    on ks.id = ka.knowledge_space_id
  join public.organizations as o
    on o.id = ks.organization_id
  left join public.tenants as owner_tenant
    on owner_tenant.id = ks.owner_tenant_id
  left join public.tenants as t
    on t.id = ka.tenant_id
  left join public.knowledge_categories as kc
    on kc.id = ka.category_id
  left join revision_stats as stats
    on stats.article_id = ka.id
  left join app_private.vw_knowledge_articles_public_contract as pub
    on pub.article_id = ka.id
  left join public.knowledge_article_editorial_drafts as editorial_draft
    on editorial_draft.article_id = ka.id
  left join public.profiles as creator
    on creator.id = ka.created_by_user_id
  left join public.profiles as updater
    on updater.id = ka.updated_by_user_id;

create or replace view public.vw_admin_knowledge_article_detail_v2
with (security_barrier = true)
as
  with current_actor as (
    select p.id
    from public.profiles as p
    where p.id = auth.uid()
      and p.is_active
      and app_private.can_manage_knowledge_base()
  ),
  revisions_json as (
    select
      kar.article_id,
      jsonb_agg(
        jsonb_build_object(
          'id', kar.id,
          'revision_number', kar.revision_number,
          'status_snapshot', kar.status_snapshot,
          'visibility', kar.visibility,
          'title', kar.title,
          'slug', kar.slug,
          'summary', kar.summary,
          'body_md', kar.body_md,
          'source_path', kar.source_path,
          'source_hash', kar.source_hash,
          'change_note', kar.change_note,
          'created_at', kar.created_at,
          'created_by_user_id', kar.created_by_user_id
        )
        order by kar.revision_number desc, kar.created_at desc
      ) as revisions
    from public.knowledge_article_revisions as kar
    group by kar.article_id
  ),
  sources_json as (
    select
      kas.article_id,
      jsonb_agg(
        jsonb_build_object(
          'id', kas.id,
          'revision_id', kas.revision_id,
          'source_kind', kas.source_kind,
          'source_path', kas.source_path,
          'source_hash', kas.source_hash,
          'source_title', kas.source_title,
          'source_metadata', kas.source_metadata,
          'created_at', kas.created_at
        )
        order by kas.created_at desc, kas.id desc
      ) as sources
    from public.knowledge_article_sources as kas
    group by kas.article_id
  ),
  editorial_drafts_json as (
    select
      draft.article_id,
      jsonb_build_object(
        'id', draft.id,
        'article_id', draft.article_id,
        'knowledge_space_id', draft.knowledge_space_id,
        'tenant_id', draft.tenant_id,
        'category_id', draft.category_id,
        'visibility', draft.visibility,
        'title', draft.title,
        'slug', draft.slug,
        'summary', draft.summary,
        'body_md', draft.body_md,
        'source_path', draft.source_path,
        'source_hash', draft.source_hash,
        'based_on_revision_number', draft.based_on_revision_number,
        'created_at', draft.created_at,
        'updated_at', draft.updated_at,
        'created_by_user_id', draft.created_by_user_id,
        'updated_by_user_id', draft.updated_by_user_id,
        'created_by_full_name', creator.full_name,
        'updated_by_full_name', updater.full_name
      ) as editorial_draft
    from public.knowledge_article_editorial_drafts as draft
    left join public.profiles as creator
      on creator.id = draft.created_by_user_id
    left join public.profiles as updater
      on updater.id = draft.updated_by_user_id
  )
  select
    ka.id,
    ka.knowledge_space_id,
    ks.slug as knowledge_space_slug,
    ks.display_name as knowledge_space_display_name,
    ks.status as knowledge_space_status,
    o.id as organization_id,
    o.slug as organization_slug,
    o.display_name as organization_display_name,
    ks.owner_tenant_id,
    owner_tenant.slug as owner_tenant_slug,
    owner_tenant.display_name as owner_tenant_display_name,
    ka.tenant_id,
    t.slug as tenant_slug,
    t.display_name as tenant_display_name,
    ka.category_id,
    kc.name as category_name,
    kc.slug as category_slug,
    ka.visibility,
    ka.status,
    ka.title,
    ka.slug,
    ka.summary,
    ka.body_md,
    ka.source_path,
    ka.source_hash,
    ka.current_revision_number,
    ka.submitted_for_review_at,
    ka.published_at,
    ka.archived_at,
    ka.created_at,
    ka.updated_at,
    creator.full_name as created_by_full_name,
    updater.full_name as updated_by_full_name,
    coalesce(revisions_json.revisions, '[]'::jsonb) as revisions,
    coalesce(sources_json.sources, '[]'::jsonb) as sources,
    pub.public_article_path,
    editorial_drafts_json.editorial_draft,
    ka.tags
  from public.knowledge_articles as ka
  join current_actor
    on true
  join public.knowledge_spaces as ks
    on ks.id = ka.knowledge_space_id
  join public.organizations as o
    on o.id = ks.organization_id
  left join public.tenants as owner_tenant
    on owner_tenant.id = ks.owner_tenant_id
  left join public.tenants as t
    on t.id = ka.tenant_id
  left join public.knowledge_categories as kc
    on kc.id = ka.category_id
  left join revisions_json
    on revisions_json.article_id = ka.id
  left join sources_json
    on sources_json.article_id = ka.id
  left join app_private.vw_knowledge_articles_public_contract as pub
    on pub.article_id = ka.id
  left join editorial_drafts_json
    on editorial_drafts_json.article_id = ka.id
  left join public.profiles as creator
    on creator.id = ka.created_by_user_id
  left join public.profiles as updater
    on updater.id = ka.updated_by_user_id;

revoke all on function app_private.normalize_knowledge_article_tags(text[]) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_replace_knowledge_article_tags_v1(uuid, uuid, text[]) from public, anon;
grant execute on function public.rpc_admin_replace_knowledge_article_tags_v1(uuid, uuid, text[]) to authenticated, service_role;

revoke all on public.vw_admin_knowledge_articles_list_v2 from public, anon, authenticated, service_role;
revoke all on public.vw_admin_knowledge_article_detail_v2 from public, anon, authenticated, service_role;
grant select on public.vw_admin_knowledge_articles_list_v2 to authenticated, service_role;
grant select on public.vw_admin_knowledge_article_detail_v2 to authenticated, service_role;

comment on function public.rpc_admin_replace_knowledge_article_tags_v1(uuid, uuid, text[]) is
  'Substitui tags editoriais normalizadas de um artigo Knowledge por RPC administrativa governada.';
