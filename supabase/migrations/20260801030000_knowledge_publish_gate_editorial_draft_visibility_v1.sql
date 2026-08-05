-- Corrige impasse circular na publicação pública de artigo já publicado.
--
-- Problema (comprovado em ambiente local):
--   Para um artigo com status='published', o editor grava as alterações no
--   draft editorial (knowledge_article_editorial_drafts), não na linha canônica
--   de knowledge_articles. A visibilidade nova, portanto, vive no draft.
--
--   Mas `rpc_admin_prepare_knowledge_article_publication_evidence_v1` validava
--   `knowledge_articles.visibility = 'public'` — o estado ANTERIOR — e recusava
--   com 'knowledge article must be public before preparing public evidence'.
--
--   Isso fechava um ciclo sem saída pela interface:
--     salvar  -> grava no draft, artigo continua restricted
--     evidência -> exige artigo público  (falha)
--     publicar revisão -> exige evidência (falha)
--     artigo só vira público ao publicar a revisão
--
--   Resultado: era impossível tornar público um artigo já publicado.
--
-- Correção:
--   Introduz `app_private.effective_knowledge_publish_visibility(uuid)`, que
--   devolve a visibilidade REALMENTE submetida — a do draft editorial quando
--   existir, senão a do artigo — e passa a usá-la nas duas validações.
--
-- Governança preservada: nada é afrouxado. Continuam obrigatórios advisory
-- revisado, classificação pública, revisor registrado e as 8 confirmações
-- humanas completas. Muda apenas QUAL linha define a visibilidade avaliada.

-- ---------------------------------------------------------------- helper

create or replace function app_private.effective_knowledge_publish_visibility(
  p_article_id uuid
)
returns public.knowledge_visibility
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select draft.visibility
      from public.knowledge_article_editorial_drafts as draft
      where draft.article_id = p_article_id
      limit 1
    ),
    (
      select article.visibility
      from public.knowledge_articles as article
      where article.id = p_article_id
    )
  );
$$;

comment on function app_private.effective_knowledge_publish_visibility(uuid) is
  'Visibilidade efetivamente submetida à publicação: a do draft editorial quando existir, senão a do artigo.';

revoke all on function app_private.effective_knowledge_publish_visibility(uuid) from public;

-- ------------------------------------------------- gate de publicação pública

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
  v_advisory public.knowledge_article_review_advisories;
  v_visibility public.knowledge_visibility;
begin
  -- A visibilidade que importa é a submetida, não a do parâmetro: para revisão
  -- editorial o chamador informa a linha antiga do artigo.
  v_visibility := coalesce(
    app_private.effective_knowledge_publish_visibility(p_article_id),
    p_target_visibility
  );

  if v_visibility <> 'public' then
    return;
  end if;

  select *
  into v_advisory
  from public.knowledge_article_review_advisories as advisory
  where advisory.article_id = p_article_id;

  if v_advisory.article_id is null then
    raise exception 'public knowledge publish requires reviewed human evidence';
  end if;

  if v_advisory.suggested_visibility <> 'public'
     or v_advisory.suggested_classification <> 'public' then
    raise exception 'public knowledge publish requires public advisory classification';
  end if;

  if v_advisory.review_status <> 'reviewed'
     or v_advisory.reviewed_by_user_id is null
     or v_advisory.reviewed_at is null then
    raise exception 'public knowledge publish requires reviewed human evidence';
  end if;

  if not app_private.public_knowledge_publish_confirmations_complete(
    v_advisory.human_confirmations
  ) then
    raise exception 'public knowledge publish requires complete human confirmations';
  end if;
end;
$$;

comment on function app_private.require_public_knowledge_publish_gate(uuid, public.knowledge_visibility) is
  'Exige evidência editorial humana quando a visibilidade submetida (draft ou artigo) é pública.';
