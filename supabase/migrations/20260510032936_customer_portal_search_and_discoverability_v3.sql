create index if not exists knowledge_articles_customer_portal_search_idx
  on public.knowledge_articles
  using gin (
    to_tsvector(
      'portuguese',
      coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(body_md, '')
    )
  )
  where status = 'published'
    and visibility in ('public', 'restricted');

create or replace function public.rpc_customer_search_knowledge_articles(
  p_tenant_id uuid,
  p_search_query text default null,
  p_category_name text default null,
  p_source text default 'all',
  p_ticket_id uuid default null,
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  article_id uuid,
  slug text,
  title text,
  summary text,
  category_name text,
  source text,
  source_label text,
  relation_reason text,
  published_at timestamptz,
  updated_at timestamptz,
  match_reason text
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_requested_source text;
  v_ticket public.tickets;
begin
  perform app_private.require_active_actor();

  if p_tenant_id is null then
    raise exception 'tenant_id is required';
  end if;

  if not app_private.is_customer_portal_member(p_tenant_id) then
    raise exception 'rpc_customer_search_knowledge_articles denied';
  end if;

  v_requested_source := lower(coalesce(nullif(btrim(p_source), ''), 'all'));

  if v_requested_source not in ('all', 'public', 'customer_portal', 'ticket_linked') then
    raise exception 'invalid source filter';
  end if;

  if p_ticket_id is not null then
    select t.*
    into v_ticket
    from public.tickets as t
    where t.id = p_ticket_id
      and t.tenant_id = p_tenant_id
      and app_private.can_access_customer_ticket(t.id, t.tenant_id);

    if v_ticket.id is null then
      raise exception 'ticket search context is not available';
    end if;
  end if;

  return query
  with normalized_input as (
    select
      nullif(regexp_replace(coalesce(p_search_query, ''), '\s+', ' ', 'g'), '') as search_query,
      nullif(btrim(p_category_name), '') as category_name,
      greatest(1, least(coalesce(p_limit, 12), 24)) as result_limit,
      greatest(coalesce(p_offset, 0), 0) as result_offset,
      v_requested_source as requested_source
  ),
  access_pool as (
    select
      article.tenant_id,
      article.article_id,
      article.slug,
      article.title,
      article.summary,
      article.category_name,
      article.source,
      article.source_label,
      article.relation_reason,
      article.published_at,
      article.updated_at,
      null::uuid as related_ticket_id,
      case article.source
        when 'ticket_linked' then 1
        when 'customer_portal' then 2
        else 3
      end as source_rank
    from public.vw_customer_portal_knowledge_articles as article
    cross join normalized_input as input
    where article.tenant_id = p_tenant_id
      and input.requested_source in ('all', article.source)
      and (
        input.category_name is null
        or lower(coalesce(article.category_name, '')) = lower(input.category_name)
      )

    union all

    select
      ticket_article.tenant_id,
      ticket_article.article_id,
      ticket_article.slug,
      ticket_article.title,
      ticket_article.summary,
      ticket_article.category_name,
      ticket_article.source,
      ticket_article.source_label,
      ticket_article.relation_reason,
      ticket_article.published_at,
      ticket_article.updated_at,
      ticket_article.ticket_id as related_ticket_id,
      0 as source_rank
    from public.vw_customer_portal_ticket_knowledge_links as ticket_article
    cross join normalized_input as input
    where p_ticket_id is not null
      and ticket_article.ticket_id = p_ticket_id
      and ticket_article.tenant_id = p_tenant_id
      and input.requested_source in ('all', 'ticket_linked')
      and (
        input.category_name is null
        or lower(coalesce(ticket_article.category_name, '')) = lower(input.category_name)
      )
  ),
  deduplicated_articles as (
    select distinct on (candidate.article_id)
      candidate.article_id,
      candidate.slug,
      candidate.title,
      candidate.summary,
      candidate.category_name,
      candidate.source,
      candidate.source_label,
      candidate.relation_reason,
      candidate.published_at,
      candidate.updated_at,
      candidate.related_ticket_id,
      candidate.source_rank
    from access_pool as candidate
    order by
      candidate.article_id,
      candidate.source_rank asc,
      candidate.updated_at desc nulls last,
      candidate.published_at desc nulls last,
      lower(candidate.title) asc
  ),
  searchable_articles as (
    select
      article.article_id,
      article.slug,
      article.title,
      article.summary,
      article.category_name,
      article.source,
      article.source_label,
      article.relation_reason,
      article.published_at,
      article.updated_at,
      article.related_ticket_id,
      article.source_rank,
      to_tsvector(
        'portuguese',
        coalesce(article.title, '')
        || ' '
        || coalesce(article.summary, '')
        || ' '
        || coalesce(article.category_name, '')
        || ' '
        || coalesce(article.relation_reason, '')
        || ' '
        || coalesce(knowledge.body_md, '')
      ) as search_document
    from deduplicated_articles as article
    join public.knowledge_articles as knowledge
      on knowledge.id = article.article_id
  ),
  query_state as (
    select
      input.search_query,
      input.result_limit,
      input.result_offset,
      input.search_query is not null and char_length(input.search_query) < 2 as search_too_short,
      case
        when input.search_query is not null and char_length(input.search_query) >= 2
          then websearch_to_tsquery('portuguese', input.search_query)
        else null::tsquery
      end as ts_query
    from normalized_input as input
  ),
  filtered_articles as (
    select
      article.article_id,
      article.slug,
      article.title,
      article.summary,
      article.category_name,
      article.source,
      article.source_label,
      article.relation_reason,
      article.published_at,
      article.updated_at,
      article.related_ticket_id,
      article.source_rank,
      case
        when query.search_query is null and p_ticket_id is not null and article.related_ticket_id = p_ticket_id
          then 'Relacionado ao ticket'
        when query.search_query is null
          then null
        when p_ticket_id is not null and article.related_ticket_id = p_ticket_id
          then 'Relacionado ao ticket'
        when lower(article.title) like '%' || lower(query.search_query) || '%'
          then 'Título'
        when lower(coalesce(article.summary, '')) like '%' || lower(query.search_query) || '%'
          then 'Resumo'
        when lower(coalesce(article.category_name, '')) like '%' || lower(query.search_query) || '%'
          then 'Categoria'
        when lower(coalesce(article.relation_reason, '')) like '%' || lower(query.search_query) || '%'
          then 'Contexto do acesso'
        when article.search_document @@ query.ts_query
          then 'Conteúdo aprovado'
        else null
      end as match_reason,
      case
        when query.ts_query is not null
          then ts_rank(article.search_document, query.ts_query)::real
        else 0::real
      end as rank_score
    from searchable_articles as article
    cross join query_state as query
    where not query.search_too_short
      and (
        query.search_query is null
        or article.search_document @@ query.ts_query
        or lower(article.title) like '%' || lower(query.search_query) || '%'
        or lower(coalesce(article.summary, '')) like '%' || lower(query.search_query) || '%'
        or lower(coalesce(article.category_name, '')) like '%' || lower(query.search_query) || '%'
        or lower(coalesce(article.relation_reason, '')) like '%' || lower(query.search_query) || '%'
      )
  )
  select
    filtered.article_id,
    filtered.slug,
    filtered.title,
    filtered.summary,
    filtered.category_name,
    filtered.source,
    filtered.source_label,
    filtered.relation_reason,
    filtered.published_at,
    filtered.updated_at,
    filtered.match_reason
  from filtered_articles as filtered
  cross join query_state as query
  order by
    case
      when p_ticket_id is not null and filtered.related_ticket_id = p_ticket_id then 0
      else 1
    end asc,
    case
      when query.search_query is null then filtered.source_rank
      else 0
    end asc,
    filtered.rank_score desc,
    filtered.updated_at desc nulls last,
    filtered.published_at desc nulls last,
    lower(filtered.title) asc
  limit (select result_limit from query_state)
  offset (select result_offset from query_state);
end;
$$;

revoke all on function public.rpc_customer_search_knowledge_articles(
  uuid,
  text,
  text,
  text,
  uuid,
  integer,
  integer
) from public, anon, authenticated, service_role;

grant execute on function public.rpc_customer_search_knowledge_articles(
  uuid,
  text,
  text,
  text,
  uuid,
  integer,
  integer
) to authenticated, service_role;

comment on function public.rpc_customer_search_knowledge_articles(
  uuid,
  text,
  text,
  text,
  uuid,
  integer,
  integer
) is
  'Busca customer-facing segura da Knowledge do portal, respeitando tenant, entitlement, estado editorial published e contexto opcional de ticket.';
