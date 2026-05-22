create or replace function public.rpc_admin_prepare_knowledge_article_publication_evidence_v1(
  p_article_id uuid,
  p_human_confirmations jsonb default '{}'::jsonb,
  p_review_notes text default null
)
returns public.knowledge_article_review_advisories
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_article public.knowledge_articles;
  v_confirmations jsonb;
  v_notes text;
  v_result public.knowledge_article_review_advisories;
begin
  v_actor_user_id := app_private.require_active_actor();
  v_confirmations := coalesce(p_human_confirmations, '{}'::jsonb);
  v_notes := coalesce(
    nullif(btrim(p_review_notes), ''),
    'Evidência pública confirmada no Admin Knowledge.'
  );

  if not app_private.can_manage_knowledge_base() then
    raise exception 'rpc_admin_prepare_knowledge_article_publication_evidence_v1 denied';
  end if;

  if jsonb_typeof(v_confirmations) <> 'object' then
    raise exception 'human confirmations must be a json object';
  end if;

  select *
  into v_article
  from public.knowledge_articles as article
  where article.id = p_article_id;

  if v_article.id is null then
    raise exception 'knowledge article not found';
  end if;

  if v_article.visibility <> 'public' then
    raise exception 'knowledge article must be public before preparing public evidence';
  end if;

  insert into public.knowledge_article_review_advisories (
    article_id,
    source_hash,
    suggested_visibility,
    suggested_classification,
    classification_reason,
    duplicate_group_key,
    risk_flags,
    human_confirmations,
    review_status,
    review_notes,
    reviewed_by_user_id,
    reviewed_at,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_article_id,
    v_article.source_hash,
    'public',
    'public',
    'Publicação manual confirmada no Admin Knowledge.',
    null,
    '[]'::jsonb,
    v_confirmations,
    'reviewed',
    v_notes,
    v_actor_user_id,
    timezone('utc', now()),
    v_actor_user_id,
    v_actor_user_id
  )
  on conflict (article_id) do update
  set
    suggested_visibility = 'public',
    suggested_classification = 'public',
    classification_reason = 'Publicação manual confirmada no Admin Knowledge.',
    risk_flags = '[]'::jsonb,
    human_confirmations = excluded.human_confirmations,
    review_status = 'reviewed',
    review_notes = excluded.review_notes,
    reviewed_by_user_id = v_actor_user_id,
    reviewed_at = timezone('utc', now()),
    updated_by_user_id = v_actor_user_id
  returning *
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.rpc_admin_prepare_knowledge_article_publication_evidence_v1(uuid, jsonb, text)
from public, anon;

grant execute on function public.rpc_admin_prepare_knowledge_article_publication_evidence_v1(uuid, jsonb, text)
to authenticated, service_role;

comment on function public.rpc_admin_prepare_knowledge_article_publication_evidence_v1(uuid, jsonb, text) is
  'Prepara evidência pública revisada para artigo manual da Knowledge Base sem publicar automaticamente.';
