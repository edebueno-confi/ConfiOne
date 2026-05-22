create or replace view public.vw_support_knowledge_article_picker
with (security_barrier = true)
as
select
  t.id as ticket_id,
  ka.id as article_id,
  ka.title as article_title,
  ka.slug as article_slug,
  ka.summary as article_summary,
  kc.name as category_name,
  ka.visibility as article_visibility,
  ka.status as article_status,
  (
    pub.public_article_path is not null
    and ka.status = 'published'::public.knowledge_article_status
    and ka.visibility = 'public'::public.knowledge_visibility
  ) as is_customer_send_allowed,
  pub.public_article_path,
  (
    pub.public_article_path is not null
    and ka.status = 'published'::public.knowledge_article_status
    and ka.visibility = 'public'::public.knowledge_visibility
  ) as can_send_to_customer,
  case
    when ka.status <> 'published'::public.knowledge_article_status then 'Artigo ainda não publicado.'
    when ka.visibility <> 'public'::public.knowledge_visibility then 'Conteúdo não é público.'
    when pub.public_article_path is null then 'Rota pública indisponível.'
    else null
  end as reason_if_blocked
from public.tickets as t
join public.knowledge_articles as ka
  on ka.archived_at is null
left join app_private.vw_knowledge_articles_public_contract as pub
  on pub.article_id = ka.id
left join public.knowledge_categories as kc
  on kc.id = ka.category_id
where app_private.can_access_support_workspace(t.tenant_id)
  and (
    pub.public_article_path is not null
    or (
      (
        ka.tenant_id = t.tenant_id
        or exists (
          select 1
          from public.knowledge_spaces as ks
          where ks.id = ka.knowledge_space_id
            and ks.owner_tenant_id = t.tenant_id
        )
      )
      and app_private.can_read_knowledge_article(
        ka.tenant_id,
        ka.visibility,
        ka.status
      )
    )
  );

create or replace view public.vw_support_knowledge_public_link_candidates
with (security_barrier = true)
as
select
  t.id as ticket_id,
  t.tenant_id,
  tenant.slug as tenant_slug,
  tenant.display_name as tenant_display_name,
  ka.id as article_id,
  ka.title as article_title,
  ka.slug as article_slug,
  ka.summary as article_summary,
  kc.name as category_name,
  pub.public_article_path,
  true as is_customer_send_allowed,
  ka.visibility as article_visibility,
  ka.status as article_status,
  true as can_send_to_customer,
  null::text as reason_if_blocked
from public.tickets as t
join public.tenants as tenant
  on tenant.id = t.tenant_id
join public.knowledge_articles as ka
  on ka.archived_at is null
join app_private.vw_knowledge_articles_public_contract as pub
  on pub.article_id = ka.id
 and pub.public_article_path is not null
left join public.knowledge_categories as kc
  on kc.id = ka.category_id
where app_private.can_access_support_workspace(t.tenant_id)
  and ka.status = 'published'::public.knowledge_article_status
  and ka.visibility = 'public'::public.knowledge_visibility;

revoke all on public.vw_support_knowledge_article_picker from public, anon, authenticated, service_role;
grant select on public.vw_support_knowledge_article_picker to authenticated, service_role;

revoke all on public.vw_support_knowledge_public_link_candidates from public, anon, authenticated, service_role;
grant select on public.vw_support_knowledge_public_link_candidates to authenticated, service_role;

comment on view public.vw_support_knowledge_article_picker is
  'Read model do Support Workspace para vinculos de Knowledge, projetando elegibilidade backend-safe de envio ao cliente e motivo operacional de bloqueio.';

comment on view public.vw_support_knowledge_public_link_candidates is
  'Read model seguro para artigos publicos publicados que podem ser compartilhados a partir de um ticket, com can_send_to_customer explicito e rota publica governada pelo backend.';
