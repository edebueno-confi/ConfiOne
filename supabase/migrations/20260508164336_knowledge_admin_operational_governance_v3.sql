create or replace function app_private.public_knowledge_publish_confirmations_complete(
  p_human_confirmations jsonb
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(p_human_confirmations, '{}'::jsonb) @> jsonb_build_object(
    'title_reviewed', true,
    'summary_reviewed', true,
    'body_reviewed', true,
    'category_reviewed', true,
    'visibility_reviewed', true,
    'no_sensitive_data_exposed', true,
    'ready_for_review', true,
    'ready_for_publish', true
  );
$$;

create or replace function app_private.require_public_knowledge_publish_gate(
  p_article_id uuid,
  p_target_visibility public.knowledge_visibility
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_article public.knowledge_articles;
  v_advisory public.knowledge_article_review_advisories;
begin
  select *
  into v_article
  from public.knowledge_articles as ka
  where ka.id = p_article_id;

  if v_article.id is null then
    raise exception 'knowledge article not found';
  end if;

  if p_target_visibility <> 'public'::public.knowledge_visibility then
    return;
  end if;

  select *
  into v_advisory
  from public.knowledge_article_review_advisories as advisory
  where advisory.article_id = p_article_id;

  if v_advisory.id is null then
    raise exception 'public knowledge publish requires reviewed human evidence';
  end if;

  if v_advisory.suggested_visibility <> 'public'::public.knowledge_visibility
     or v_advisory.suggested_classification <> 'public'::public.knowledge_advisory_classification then
    raise exception 'public knowledge publish requires public advisory classification';
  end if;

  if v_advisory.review_status <> 'reviewed'::public.knowledge_article_review_status
     or v_advisory.reviewed_by_user_id is null
     or v_advisory.reviewed_at is null then
    raise exception 'public knowledge publish requires reviewed human evidence';
  end if;

  if not app_private.public_knowledge_publish_confirmations_complete(v_advisory.human_confirmations) then
    raise exception 'public knowledge publish requires complete human confirmations';
  end if;
end;
$$;

create or replace function public.rpc_admin_publish_knowledge_article_v2(
  p_article_id uuid,
  p_knowledge_space_id uuid
)
returns public.knowledge_articles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.knowledge_articles;
  v_article public.knowledge_articles;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.can_manage_knowledge_base() then
    raise exception 'rpc_admin_publish_knowledge_article_v2 denied';
  end if;

  if p_knowledge_space_id is null then
    raise exception 'knowledge space is required';
  end if;

  select *
  into v_existing
  from public.knowledge_articles as ka
  where ka.id = p_article_id;

  if v_existing.id is null then
    raise exception 'knowledge article not found';
  end if;

  if v_existing.knowledge_space_id is distinct from p_knowledge_space_id then
    raise exception 'knowledge article space mismatch';
  end if;

  if v_existing.status <> 'review' then
    raise exception 'knowledge article must be in review before publish';
  end if;

  perform app_private.require_public_knowledge_publish_gate(v_existing.id, v_existing.visibility);

  update public.knowledge_articles
  set
    status = 'published',
    current_revision_number = current_revision_number + 1,
    published_at = timezone('utc', now()),
    archived_at = null,
    updated_by_user_id = v_actor_user_id
  where id = p_article_id
  returning *
  into v_article;

  perform app_private.capture_knowledge_revision(
    v_article.id,
    v_actor_user_id,
    'published via v2 with human evidence gate'
  );

  return v_article;
end;
$$;

create or replace function public.rpc_admin_publish_knowledge_article_editorial_revision_v2(
  p_article_id uuid,
  p_knowledge_space_id uuid
)
returns public.knowledge_articles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_article public.knowledge_articles;
  v_draft public.knowledge_article_editorial_drafts;
  v_revision public.knowledge_article_revisions;
  v_result public.knowledge_articles;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.can_manage_knowledge_base() then
    raise exception 'rpc_admin_publish_knowledge_article_editorial_revision_v2 denied';
  end if;

  if p_knowledge_space_id is null then
    raise exception 'knowledge space is required';
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

  if v_article.status <> 'published' then
    raise exception 'only published knowledge articles support editorial revision';
  end if;

  select *
  into v_draft
  from public.knowledge_article_editorial_drafts as draft
  where draft.article_id = p_article_id
    and draft.knowledge_space_id = p_knowledge_space_id;

  if v_draft.id is null then
    raise exception 'knowledge article editorial revision not found';
  end if;

  if v_draft.visibility = 'public'::public.knowledge_visibility then
    perform app_private.require_public_knowledge_publish_gate(v_article.id, v_draft.visibility);
  end if;

  update public.knowledge_articles
  set
    category_id = v_draft.category_id,
    visibility = v_draft.visibility,
    title = v_draft.title,
    slug = v_draft.slug,
    summary = v_draft.summary,
    body_md = v_draft.body_md,
    source_path = v_draft.source_path,
    source_hash = v_draft.source_hash,
    current_revision_number = current_revision_number + 1,
    published_at = timezone('utc', now()),
    updated_by_user_id = v_actor_user_id
  where id = p_article_id
  returning *
  into v_result;

  v_revision := app_private.capture_knowledge_revision(
    v_result.id,
    v_actor_user_id,
    'published editorial revision via v2 with human evidence gate'
  );

  if v_result.source_path is not null and v_result.source_hash is not null then
    insert into public.knowledge_article_sources (
      article_id,
      revision_id,
      source_kind,
      source_path,
      source_hash,
      source_title,
      source_metadata,
      created_by_user_id,
      updated_by_user_id
    )
    values (
      v_result.id,
      v_revision.id,
      'legacy_octadesk',
      v_result.source_path,
      v_result.source_hash,
      v_result.title,
      jsonb_build_object(
        'updated_status', v_result.status,
        'updated_visibility', v_result.visibility,
        'knowledge_space_id', v_result.knowledge_space_id,
        'editorial_revision', true
      ),
      v_actor_user_id,
      v_actor_user_id
    )
    on conflict (article_id, source_path, source_hash) do nothing;
  end if;

  delete from public.knowledge_article_editorial_drafts
  where id = v_draft.id;

  return v_result;
end;
$$;

revoke all on function public.rpc_admin_publish_knowledge_article_v2(uuid, uuid) from public, anon;
revoke all on function public.rpc_admin_publish_knowledge_article_editorial_revision_v2(uuid, uuid) from public, anon;
revoke all on function app_private.public_knowledge_publish_confirmations_complete(jsonb) from public, anon, authenticated;
revoke all on function app_private.require_public_knowledge_publish_gate(uuid, public.knowledge_visibility) from public, anon, authenticated;

grant execute on function public.rpc_admin_publish_knowledge_article_v2(uuid, uuid) to authenticated, service_role;
grant execute on function public.rpc_admin_publish_knowledge_article_editorial_revision_v2(uuid, uuid) to authenticated, service_role;

comment on function app_private.require_public_knowledge_publish_gate(uuid, public.knowledge_visibility) is
  'Bloqueia publicação pública v2 sem advisory público revisado e confirmações humanas completas.';

comment on function public.rpc_admin_publish_knowledge_article_v2(uuid, uuid) is
  'Publica artigo em review via v2; se a visibilidade for pública, exige evidência humana revisada no backend.';

comment on function public.rpc_admin_publish_knowledge_article_editorial_revision_v2(uuid, uuid) is
  'Aplica revisão editorial v2; se a versão resultante for pública, exige evidência humana revisada no backend.';
