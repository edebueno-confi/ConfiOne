create or replace view public.vw_customer_portal_knowledge_articles
with (security_barrier = true)
as
with portal_context as (
  select distinct
    ctx.tenant_id
  from public.vw_customer_portal_auth_context as ctx
),
access_candidates as (
  select
    ctx.tenant_id,
    ka.id as article_id,
    ka.slug,
    ka.title,
    ka.summary,
    kc.name as category_name,
    ka.published_at,
    ka.updated_at,
    'public'::text as source,
    'Público'::text as source_label,
    'Conteúdo público aprovado para leitura.'::text as relation_reason,
    30 as source_rank,
    ka.published_at as access_created_at
  from portal_context as ctx
  join public.knowledge_articles as ka
    on ka.status = 'published'::public.knowledge_article_status
   and ka.visibility = 'public'::public.knowledge_visibility
   and ka.published_at is not null
  join app_private.vw_knowledge_articles_public_contract as pub
    on pub.article_id = ka.id
   and pub.public_article_path is not null
  left join public.knowledge_categories as kc
    on kc.id = ka.category_id

  union all

  select
    ent.tenant_id,
    ka.id as article_id,
    ka.slug,
    ka.title,
    ka.summary,
    kc.name as category_name,
    ka.published_at,
    ka.updated_at,
    'customer_portal'::text as source,
    'Autorizado no portal'::text as source_label,
    coalesce(
      nullif(btrim(ent.relation_reason), ''),
      case
        when ent.entitlement_scope = 'tenant'::public.knowledge_article_entitlement_scope
          then 'Disponível para o seu tenant.'
        else 'Disponível no portal autenticado.'
      end
    ) as relation_reason,
    case
      when ent.entitlement_scope = 'customer_portal'::public.knowledge_article_entitlement_scope then 10
      else 20
    end as source_rank,
    ent.created_at as access_created_at
  from public.knowledge_article_entitlements as ent
  join portal_context as ctx
    on ctx.tenant_id = ent.tenant_id
  join public.knowledge_articles as ka
    on ka.id = ent.article_id
  left join public.knowledge_categories as kc
    on kc.id = ka.category_id
  where ent.archived_at is null
    and ent.status = 'active'::public.knowledge_article_entitlement_status
    and ent.entitlement_scope in (
      'tenant'::public.knowledge_article_entitlement_scope,
      'customer_portal'::public.knowledge_article_entitlement_scope
    )
    and ka.status = 'published'::public.knowledge_article_status
    and ka.visibility in (
      'public'::public.knowledge_visibility,
      'restricted'::public.knowledge_visibility
    )
    and ka.published_at is not null

  union all

  select
    tkl.tenant_id,
    ka.id as article_id,
    ka.slug,
    ka.title,
    ka.summary,
    kc.name as category_name,
    ka.published_at,
    ka.updated_at,
    'ticket_linked'::text as source,
    'Relacionado ao ticket'::text as source_label,
    coalesce(
      nullif(btrim(tkl.note), ''),
      'Relacionado a um ticket autorizado.'
    ) as relation_reason,
    0 as source_rank,
    tkl.created_at as access_created_at
  from public.ticket_knowledge_links as tkl
  join public.knowledge_articles as ka
    on ka.id = tkl.article_id
  left join public.knowledge_categories as kc
    on kc.id = ka.category_id
  where tkl.archived_at is null
    and tkl.link_type = 'sent_to_customer'::public.ticket_knowledge_link_type
    and ka.status = 'published'::public.knowledge_article_status
    and ka.published_at is not null
    and app_private.can_access_customer_ticket(tkl.ticket_id, tkl.tenant_id)
    and (
      ka.visibility = 'public'::public.knowledge_visibility
      or (
        ka.visibility = 'restricted'::public.knowledge_visibility
        and exists (
          select 1
          from public.knowledge_article_entitlements as ent
          where ent.tenant_id = tkl.tenant_id
            and ent.article_id = ka.id
            and ent.archived_at is null
            and ent.status = 'active'::public.knowledge_article_entitlement_status
            and ent.entitlement_scope in (
              'tenant'::public.knowledge_article_entitlement_scope,
              'customer_portal'::public.knowledge_article_entitlement_scope
            )
        )
      )
    )
)
select distinct on (candidate.tenant_id, candidate.article_id)
  candidate.tenant_id,
  candidate.article_id,
  candidate.slug,
  candidate.title,
  candidate.summary,
  candidate.category_name,
  candidate.published_at,
  candidate.updated_at,
  candidate.relation_reason,
  candidate.source,
  candidate.source_label
from access_candidates as candidate
order by
  candidate.tenant_id,
  candidate.article_id,
  candidate.source_rank asc,
  candidate.access_created_at desc,
  candidate.article_id;

create or replace view public.vw_customer_portal_knowledge_article_detail
with (security_barrier = true)
as
with portal_context as (
  select distinct
    ctx.tenant_id
  from public.vw_customer_portal_auth_context as ctx
),
access_candidates as (
  select
    ctx.tenant_id,
    ka.id as article_id,
    ka.slug,
    ka.title,
    ka.summary,
    kc.name as category_name,
    ka.published_at,
    ka.updated_at,
    'public'::text as source,
    'Público'::text as source_label,
    'Conteúdo público aprovado para leitura.'::text as relation_reason,
    30 as source_rank,
    ka.published_at as access_created_at,
    ka.body_md
  from portal_context as ctx
  join public.knowledge_articles as ka
    on ka.status = 'published'::public.knowledge_article_status
   and ka.visibility = 'public'::public.knowledge_visibility
   and ka.published_at is not null
  join app_private.vw_knowledge_articles_public_contract as pub
    on pub.article_id = ka.id
   and pub.public_article_path is not null
  left join public.knowledge_categories as kc
    on kc.id = ka.category_id

  union all

  select
    ent.tenant_id,
    ka.id as article_id,
    ka.slug,
    ka.title,
    ka.summary,
    kc.name as category_name,
    ka.published_at,
    ka.updated_at,
    'customer_portal'::text as source,
    'Autorizado no portal'::text as source_label,
    coalesce(
      nullif(btrim(ent.relation_reason), ''),
      case
        when ent.entitlement_scope = 'tenant'::public.knowledge_article_entitlement_scope
          then 'Disponível para o seu tenant.'
        else 'Disponível no portal autenticado.'
      end
    ) as relation_reason,
    case
      when ent.entitlement_scope = 'customer_portal'::public.knowledge_article_entitlement_scope then 10
      else 20
    end as source_rank,
    ent.created_at as access_created_at,
    ka.body_md
  from public.knowledge_article_entitlements as ent
  join portal_context as ctx
    on ctx.tenant_id = ent.tenant_id
  join public.knowledge_articles as ka
    on ka.id = ent.article_id
  left join public.knowledge_categories as kc
    on kc.id = ka.category_id
  where ent.archived_at is null
    and ent.status = 'active'::public.knowledge_article_entitlement_status
    and ent.entitlement_scope in (
      'tenant'::public.knowledge_article_entitlement_scope,
      'customer_portal'::public.knowledge_article_entitlement_scope
    )
    and ka.status = 'published'::public.knowledge_article_status
    and ka.visibility in (
      'public'::public.knowledge_visibility,
      'restricted'::public.knowledge_visibility
    )
    and ka.published_at is not null

  union all

  select
    tkl.tenant_id,
    ka.id as article_id,
    ka.slug,
    ka.title,
    ka.summary,
    kc.name as category_name,
    ka.published_at,
    ka.updated_at,
    'ticket_linked'::text as source,
    'Relacionado ao ticket'::text as source_label,
    coalesce(
      nullif(btrim(tkl.note), ''),
      'Relacionado a um ticket autorizado.'
    ) as relation_reason,
    0 as source_rank,
    tkl.created_at as access_created_at,
    ka.body_md
  from public.ticket_knowledge_links as tkl
  join public.knowledge_articles as ka
    on ka.id = tkl.article_id
  left join public.knowledge_categories as kc
    on kc.id = ka.category_id
  where tkl.archived_at is null
    and tkl.link_type = 'sent_to_customer'::public.ticket_knowledge_link_type
    and ka.status = 'published'::public.knowledge_article_status
    and ka.published_at is not null
    and app_private.can_access_customer_ticket(tkl.ticket_id, tkl.tenant_id)
    and (
      ka.visibility = 'public'::public.knowledge_visibility
      or (
        ka.visibility = 'restricted'::public.knowledge_visibility
        and exists (
          select 1
          from public.knowledge_article_entitlements as ent
          where ent.tenant_id = tkl.tenant_id
            and ent.article_id = ka.id
            and ent.archived_at is null
            and ent.status = 'active'::public.knowledge_article_entitlement_status
            and ent.entitlement_scope in (
              'tenant'::public.knowledge_article_entitlement_scope,
              'customer_portal'::public.knowledge_article_entitlement_scope
            )
        )
      )
    )
)
select distinct on (candidate.tenant_id, candidate.article_id)
  candidate.tenant_id,
  candidate.article_id,
  candidate.slug,
  candidate.title,
  candidate.summary,
  candidate.category_name,
  candidate.published_at,
  candidate.updated_at,
  candidate.relation_reason,
  candidate.source,
  candidate.source_label,
  candidate.body_md
from access_candidates as candidate
order by
  candidate.tenant_id,
  candidate.article_id,
  candidate.source_rank asc,
  candidate.access_created_at desc,
  candidate.article_id;

create or replace view public.vw_customer_portal_ticket_knowledge_links
with (security_barrier = true)
as
select
  tkl.ticket_id,
  tkl.tenant_id,
  ka.id as article_id,
  ka.slug,
  ka.title,
  ka.summary,
  kc.name as category_name,
  ka.published_at,
  ka.updated_at,
  coalesce(
    nullif(btrim(tkl.note), ''),
    'Relacionado a este ticket.'
  ) as relation_reason,
  'ticket_linked'::text as source,
  'Relacionado ao ticket'::text as source_label
from public.ticket_knowledge_links as tkl
join public.knowledge_articles as ka
  on ka.id = tkl.article_id
left join public.knowledge_categories as kc
  on kc.id = ka.category_id
where tkl.archived_at is null
  and tkl.link_type = 'sent_to_customer'::public.ticket_knowledge_link_type
  and ka.status = 'published'::public.knowledge_article_status
  and ka.published_at is not null
  and app_private.can_access_customer_ticket(tkl.ticket_id, tkl.tenant_id)
  and (
    ka.visibility = 'public'::public.knowledge_visibility
    or (
      ka.visibility = 'restricted'::public.knowledge_visibility
      and exists (
        select 1
        from public.knowledge_article_entitlements as ent
        where ent.tenant_id = tkl.tenant_id
          and ent.article_id = ka.id
          and ent.archived_at is null
          and ent.status = 'active'::public.knowledge_article_entitlement_status
          and ent.entitlement_scope in (
            'tenant'::public.knowledge_article_entitlement_scope,
            'customer_portal'::public.knowledge_article_entitlement_scope
          )
      )
    )
  );
