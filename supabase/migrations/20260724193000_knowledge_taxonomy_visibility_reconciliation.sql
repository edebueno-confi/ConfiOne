-- TAXONOMY-01.1: restore the legacy integration article to its approved restricted state.
-- The article is retained for internal review; no content or asset is deleted.
begin;

update public.knowledge_articles
set status = 'draft',
    visibility = 'restricted',
    submitted_for_review_at = null,
    published_at = null,
    updated_at = timezone('utc', now())
where id = '964e5bf7-7de7-4bf4-828e-f199ea40e45a'::uuid;

update public.knowledge_article_editorial_drafts
set visibility = 'restricted',
    updated_at = timezone('utc', now())
where article_id = '964e5bf7-7de7-4bf4-828e-f199ea40e45a'::uuid;

commit;
