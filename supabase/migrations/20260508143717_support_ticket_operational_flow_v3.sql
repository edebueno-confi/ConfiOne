create or replace function public.rpc_support_get_ticket_timeline(
  p_ticket_id uuid,
  p_limit integer default 50,
  p_before_occurred_at timestamptz default null,
  p_before_timeline_entry_id uuid default null
)
returns table (
  ticket_id uuid,
  tenant_id uuid,
  tenant_slug text,
  tenant_display_name text,
  timeline_entry_id uuid,
  entry_type text,
  visibility public.message_visibility,
  occurred_at timestamptz,
  actor_user_id uuid,
  actor_full_name text,
  actor_email text,
  message_id uuid,
  event_id uuid,
  event_type public.ticket_event_type,
  assignment_id uuid,
  body text,
  metadata jsonb,
  total_available_count integer,
  page_limit integer,
  has_more boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.tickets;
  v_limit integer;
begin
  perform app_private.require_active_actor();
  v_limit := least(greatest(coalesce(p_limit, 50), 1), 100);

  select *
  into v_ticket
  from public.tickets as t
  where t.id = p_ticket_id;

  if v_ticket.id is null then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_access_support_workspace(v_ticket.tenant_id) then
    raise exception 'rpc_support_get_ticket_timeline denied';
  end if;

  return query
  with visible_entries as (
    select
      tl.ticket_id,
      tl.tenant_id,
      tl.tenant_slug,
      tl.tenant_display_name,
      tl.timeline_entry_id,
      tl.entry_type,
      tl.visibility,
      tl.occurred_at,
      tl.actor_user_id,
      tl.actor_full_name,
      tl.actor_email::text as actor_email,
      tl.message_id,
      tl.event_id,
      tl.event_type,
      tl.assignment_id,
      tl.body,
      tl.metadata,
      count(*) over ()::integer as total_available_count
    from public.vw_support_ticket_timeline as tl
    where tl.ticket_id = p_ticket_id
      and (
        p_before_occurred_at is null
        or tl.occurred_at < p_before_occurred_at
        or (
          tl.occurred_at = p_before_occurred_at
          and tl.timeline_entry_id < p_before_timeline_entry_id
        )
      )
  ),
  page_desc as (
    select *
    from visible_entries as ve
    order by ve.occurred_at desc, ve.timeline_entry_id desc
    limit v_limit
  ),
  page_meta as (
    select
      count(*)::integer as page_count,
      min(pd.occurred_at) as oldest_occurred_at
    from page_desc as pd
  ),
  page_oldest as (
    select pd.timeline_entry_id
    from page_desc as pd
    order by pd.occurred_at asc, pd.timeline_entry_id asc
    limit 1
  )
  select
    pd.ticket_id,
    pd.tenant_id,
    pd.tenant_slug,
    pd.tenant_display_name,
    pd.timeline_entry_id,
    pd.entry_type,
    pd.visibility,
    pd.occurred_at,
    pd.actor_user_id,
    pd.actor_full_name,
    pd.actor_email,
    pd.message_id,
    pd.event_id,
    pd.event_type,
    pd.assignment_id,
    pd.body,
    pd.metadata,
    pd.total_available_count,
    v_limit as page_limit,
    exists (
      select 1
      from visible_entries as older
      cross join page_meta as pm
      cross join page_oldest as po
      where pm.page_count = v_limit
        and (
          older.occurred_at < pm.oldest_occurred_at
          or (
            older.occurred_at = pm.oldest_occurred_at
            and older.timeline_entry_id < po.timeline_entry_id
          )
        )
    ) as has_more
  from page_desc as pd
  order by pd.occurred_at asc, pd.timeline_entry_id asc;
end;
$$;

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
  true as is_customer_send_allowed
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
where app_private.can_access_support_workspace(t.tenant_id);

revoke all on function public.rpc_support_get_ticket_timeline(uuid, integer, timestamptz, uuid) from public, anon, authenticated, service_role;
grant execute on function public.rpc_support_get_ticket_timeline(uuid, integer, timestamptz, uuid) to authenticated, service_role;

revoke all on public.vw_support_knowledge_public_link_candidates from public, anon, authenticated, service_role;
grant select on public.vw_support_knowledge_public_link_candidates to authenticated, service_role;

comment on function public.rpc_support_get_ticket_timeline(uuid, integer, timestamptz, uuid) is
  'Retorna pagina segura da timeline do Support Workspace para um ticket, com isolamento por tenant, permissao de suporte e cursor baseado em occurred_at + timeline_entry_id.';

comment on view public.vw_support_knowledge_public_link_candidates is
  'Read model seguro para artigos publicos publicados que podem ser compartilhados a partir de um ticket, sem expor rascunhos, internos ou restritos.';
