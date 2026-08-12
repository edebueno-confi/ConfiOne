-- Nenhuma categoria vazia deve ser exposta como pública.
-- O conteúdo pode ser curado internamente e voltar a público quando houver
-- artigo publicado nela.

begin;

update public.knowledge_categories as category
set visibility = 'internal',
    updated_at = timezone('utc', now())
from public.knowledge_spaces as space
where space.id = category.knowledge_space_id
  and space.slug = 'genius'
  and category.visibility = 'public'
  and not exists (
    select 1
    from public.knowledge_articles as article
    where article.category_id = category.id
      and article.status = 'published'
      and article.visibility = 'public'
  )
  and not exists (
    select 1
    from public.knowledge_categories as child
    join public.knowledge_articles as article
      on article.category_id = child.id
    where child.parent_category_id = category.id
      and article.status = 'published'
      and article.visibility = 'public'
  );

commit;
