do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'knowledge_article_entitlement_scope'
  ) then
    create type public.knowledge_article_entitlement_scope as enum (
      'public',
      'tenant',
      'customer_portal',
      'ticket_linked'
    );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'knowledge_article_entitlement_status'
  ) then
    create type public.knowledge_article_entitlement_status as enum (
      'active',
      'inactive'
    );
  end if;
end;
$$;

create table if not exists public.knowledge_article_entitlements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  article_id uuid not null references public.knowledge_articles (id) on delete cascade,
  entitlement_scope public.knowledge_article_entitlement_scope not null,
  status public.knowledge_article_entitlement_status not null default 'active',
  relation_reason text,
  archived_at timestamptz,
  archived_by_user_id uuid references public.profiles (id) on delete set null,
  created_by_user_id uuid not null references public.profiles (id) on delete restrict,
  updated_by_user_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint knowledge_article_entitlements_reason_length_check
    check (relation_reason is null or char_length(relation_reason) <= 600),
  constraint knowledge_article_entitlements_reason_safe_check
    check (relation_reason is null or relation_reason !~ '[<>]'),
  constraint knowledge_article_entitlements_archive_pair_check
    check (
      (archived_at is null and archived_by_user_id is null)
      or (archived_at is not null and archived_by_user_id is not null)
    ),
  constraint knowledge_article_entitlements_status_archive_check
    check (
      (status = 'active'::public.knowledge_article_entitlement_status and archived_at is null)
      or (status = 'inactive'::public.knowledge_article_entitlement_status and archived_at is not null)
    )
);

create unique index if not exists knowledge_article_entitlements_active_scope_key
on public.knowledge_article_entitlements (tenant_id, article_id, entitlement_scope)
where archived_at is null;

create index if not exists knowledge_article_entitlements_tenant_scope_idx
on public.knowledge_article_entitlements (tenant_id, entitlement_scope, created_at desc);

create index if not exists knowledge_article_entitlements_article_idx
on public.knowledge_article_entitlements (article_id, created_at desc);

alter table public.knowledge_article_entitlements enable row level security;
alter table public.knowledge_article_entitlements force row level security;

drop policy if exists knowledge_article_entitlements_select_managed on public.knowledge_article_entitlements;
create policy knowledge_article_entitlements_select_managed
on public.knowledge_article_entitlements
for select
using (app_private.can_manage_knowledge_base());

drop policy if exists knowledge_article_entitlements_insert_managed on public.knowledge_article_entitlements;
create policy knowledge_article_entitlements_insert_managed
on public.knowledge_article_entitlements
for insert
with check (app_private.can_manage_knowledge_base());

drop policy if exists knowledge_article_entitlements_update_managed on public.knowledge_article_entitlements;
create policy knowledge_article_entitlements_update_managed
on public.knowledge_article_entitlements
for update
using (app_private.can_manage_knowledge_base())
with check (app_private.can_manage_knowledge_base());

create or replace function app_private.require_customer_portal_knowledge_article_candidate(
  p_article_id uuid
)
returns public.knowledge_articles
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_article public.knowledge_articles;
begin
  select *
  into v_article
  from public.knowledge_articles as ka
  where ka.id = p_article_id;

  if v_article.id is null then
    raise exception 'knowledge article not found';
  end if;

  if v_article.status <> 'published'::public.knowledge_article_status
     or v_article.published_at is null then
    raise exception 'knowledge article must be published before customer portal exposure';
  end if;

  if v_article.visibility = 'internal'::public.knowledge_visibility then
    raise exception 'internal knowledge article cannot be exposed in customer portal';
  end if;

  return v_article;
end;
$$;

drop view if exists public.vw_customer_portal_knowledge_article_detail;
drop view if exists public.vw_customer_portal_knowledge_articles;
drop view if exists public.vw_customer_portal_ticket_knowledge_links;

create view public.vw_customer_portal_knowledge_articles
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
    and ka.visibility in (
      'public'::public.knowledge_visibility,
      'restricted'::public.knowledge_visibility
    )
    and ka.published_at is not null
    and app_private.can_access_customer_ticket(tkl.ticket_id, tkl.tenant_id)
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

create view public.vw_customer_portal_knowledge_article_detail
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
    and ka.visibility in (
      'public'::public.knowledge_visibility,
      'restricted'::public.knowledge_visibility
    )
    and ka.published_at is not null
    and app_private.can_access_customer_ticket(tkl.ticket_id, tkl.tenant_id)
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

create view public.vw_customer_portal_ticket_knowledge_links
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
  and ka.visibility in (
    'public'::public.knowledge_visibility,
    'restricted'::public.knowledge_visibility
  )
  and ka.published_at is not null
  and app_private.can_access_customer_ticket(tkl.ticket_id, tkl.tenant_id);

create or replace function public.rpc_admin_grant_knowledge_article_entitlement(
  p_tenant_id uuid,
  p_article_id uuid,
  p_entitlement_scope public.knowledge_article_entitlement_scope,
  p_relation_reason text default null
)
returns public.knowledge_article_entitlements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_article public.knowledge_articles;
  v_existing public.knowledge_article_entitlements;
  v_entitlement public.knowledge_article_entitlements;
  v_reason text;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.can_manage_knowledge_base() then
    raise exception 'rpc_admin_grant_knowledge_article_entitlement denied';
  end if;

  if p_tenant_id is null then
    raise exception 'tenant_id is required';
  end if;

  if p_article_id is null then
    raise exception 'article_id is required';
  end if;

  if p_entitlement_scope is null then
    raise exception 'entitlement_scope is required';
  end if;

  if p_entitlement_scope = 'public'::public.knowledge_article_entitlement_scope then
    raise exception 'public entitlement is derived from the public publish contract';
  end if;

  if p_entitlement_scope = 'ticket_linked'::public.knowledge_article_entitlement_scope then
    raise exception 'ticket_linked entitlement is derived from explicit ticket links';
  end if;

  if not exists (
    select 1
    from public.tenants as tenant
    where tenant.id = p_tenant_id
  ) then
    raise exception 'knowledge entitlement tenant not found';
  end if;

  v_article := app_private.require_customer_portal_knowledge_article_candidate(p_article_id);
  v_reason := nullif(btrim(p_relation_reason), '');

  if v_article.visibility = 'restricted'::public.knowledge_visibility
     and v_reason is null then
    raise exception 'restricted knowledge entitlement requires relation_reason';
  end if;

  select *
  into v_existing
  from public.knowledge_article_entitlements as ent
  where ent.tenant_id = p_tenant_id
    and ent.article_id = p_article_id
    and ent.entitlement_scope = p_entitlement_scope
  order by ent.created_at desc
  limit 1;

  if v_existing.id is not null and v_existing.archived_at is null then
    raise exception 'knowledge article entitlement already active';
  end if;

  if v_existing.id is not null then
    update public.knowledge_article_entitlements
    set status = 'active'::public.knowledge_article_entitlement_status,
        relation_reason = v_reason,
        archived_at = null,
        archived_by_user_id = null,
        updated_by_user_id = v_actor_user_id
    where id = v_existing.id
    returning *
    into v_entitlement;

    return v_entitlement;
  end if;

  insert into public.knowledge_article_entitlements (
    tenant_id,
    article_id,
    entitlement_scope,
    status,
    relation_reason,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_tenant_id,
    p_article_id,
    p_entitlement_scope,
    'active'::public.knowledge_article_entitlement_status,
    v_reason,
    v_actor_user_id,
    v_actor_user_id
  )
  returning *
  into v_entitlement;

  return v_entitlement;
end;
$$;

create or replace function public.rpc_admin_archive_knowledge_article_entitlement(
  p_tenant_id uuid,
  p_entitlement_id uuid
)
returns public.knowledge_article_entitlements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_entitlement public.knowledge_article_entitlements;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.can_manage_knowledge_base() then
    raise exception 'rpc_admin_archive_knowledge_article_entitlement denied';
  end if;

  if p_tenant_id is null then
    raise exception 'tenant_id is required';
  end if;

  if p_entitlement_id is null then
    raise exception 'entitlement_id is required';
  end if;

  select *
  into v_entitlement
  from public.knowledge_article_entitlements as ent
  where ent.id = p_entitlement_id
    and ent.tenant_id = p_tenant_id;

  if v_entitlement.id is null then
    raise exception 'knowledge article entitlement not found';
  end if;

  if v_entitlement.archived_at is not null then
    raise exception 'knowledge article entitlement already archived';
  end if;

  update public.knowledge_article_entitlements
  set status = 'inactive'::public.knowledge_article_entitlement_status,
      archived_at = timezone('utc', now()),
      archived_by_user_id = v_actor_user_id,
      updated_by_user_id = v_actor_user_id
  where id = p_entitlement_id
  returning *
  into v_entitlement;

  return v_entitlement;
end;
$$;

create or replace function public.rpc_admin_link_knowledge_article_to_ticket(
  p_tenant_id uuid,
  p_ticket_id uuid,
  p_article_id uuid,
  p_relation_reason text default null
)
returns public.ticket_knowledge_links
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_ticket public.tickets;
  v_article public.knowledge_articles;
  v_link public.ticket_knowledge_links;
  v_reason text;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.can_manage_knowledge_base() then
    raise exception 'rpc_admin_link_knowledge_article_to_ticket denied';
  end if;

  if p_tenant_id is null then
    raise exception 'tenant_id is required';
  end if;

  if p_ticket_id is null then
    raise exception 'ticket_id is required';
  end if;

  if p_article_id is null then
    raise exception 'article_id is required';
  end if;

  select *
  into v_ticket
  from public.tickets as t
  where t.id = p_ticket_id
    and t.tenant_id = p_tenant_id;

  if v_ticket.id is null then
    raise exception 'ticket not found for tenant';
  end if;

  v_article := app_private.require_customer_portal_knowledge_article_candidate(p_article_id);
  v_reason := nullif(btrim(p_relation_reason), '');

  if v_article.visibility = 'restricted'::public.knowledge_visibility
     and v_reason is null then
    raise exception 'restricted ticket knowledge link requires relation_reason';
  end if;

  select *
  into v_link
  from public.ticket_knowledge_links as tkl
  where tkl.tenant_id = p_tenant_id
    and tkl.ticket_id = p_ticket_id
    and tkl.article_id = p_article_id
    and tkl.link_type = 'sent_to_customer'::public.ticket_knowledge_link_type
    and tkl.archived_at is null;

  if v_link.id is not null then
    raise exception 'ticket knowledge link already active';
  end if;

  insert into public.ticket_knowledge_links (
    tenant_id,
    ticket_id,
    article_id,
    link_type,
    note,
    created_by_user_id
  )
  values (
    p_tenant_id,
    p_ticket_id,
    p_article_id,
    'sent_to_customer'::public.ticket_knowledge_link_type,
    v_reason,
    v_actor_user_id
  )
  returning *
  into v_link;

  return v_link;
end;
$$;

create or replace function public.rpc_admin_unlink_knowledge_article_from_ticket(
  p_tenant_id uuid,
  p_ticket_knowledge_link_id uuid
)
returns public.ticket_knowledge_links
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_link public.ticket_knowledge_links;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.can_manage_knowledge_base() then
    raise exception 'rpc_admin_unlink_knowledge_article_from_ticket denied';
  end if;

  if p_tenant_id is null then
    raise exception 'tenant_id is required';
  end if;

  if p_ticket_knowledge_link_id is null then
    raise exception 'ticket_knowledge_link_id is required';
  end if;

  select *
  into v_link
  from public.ticket_knowledge_links as tkl
  where tkl.id = p_ticket_knowledge_link_id
    and tkl.tenant_id = p_tenant_id;

  if v_link.id is null then
    raise exception 'ticket knowledge link not found';
  end if;

  if v_link.archived_at is not null then
    raise exception 'ticket knowledge link already archived';
  end if;

  update public.ticket_knowledge_links
  set archived_at = timezone('utc', now()),
      archived_by_user_id = v_actor_user_id
  where id = p_ticket_knowledge_link_id
  returning *
  into v_link;

  return v_link;
end;
$$;

create trigger knowledge_article_entitlements_set_updated_at
before update on public.knowledge_article_entitlements
for each row
execute function app_private.touch_updated_at();

create trigger knowledge_article_entitlements_audit
after insert or update or delete on public.knowledge_article_entitlements
for each row
execute function audit.capture_row_change();

revoke select, insert, update, delete on public.knowledge_article_entitlements from authenticated;

revoke all on function app_private.require_customer_portal_knowledge_article_candidate(uuid) from public, anon, authenticated, service_role;
grant execute on function app_private.require_customer_portal_knowledge_article_candidate(uuid) to authenticated, service_role;

revoke all on public.vw_customer_portal_knowledge_articles from public, anon, authenticated, service_role;
revoke all on public.vw_customer_portal_knowledge_article_detail from public, anon, authenticated, service_role;
revoke all on public.vw_customer_portal_ticket_knowledge_links from public, anon, authenticated, service_role;

grant select on public.vw_customer_portal_knowledge_articles to authenticated, service_role;
grant select on public.vw_customer_portal_knowledge_article_detail to authenticated, service_role;
grant select on public.vw_customer_portal_ticket_knowledge_links to authenticated, service_role;

revoke all on function public.rpc_admin_grant_knowledge_article_entitlement(uuid, uuid, public.knowledge_article_entitlement_scope, text) from public, anon;
revoke all on function public.rpc_admin_archive_knowledge_article_entitlement(uuid, uuid) from public, anon;
revoke all on function public.rpc_admin_link_knowledge_article_to_ticket(uuid, uuid, uuid, text) from public, anon;
revoke all on function public.rpc_admin_unlink_knowledge_article_from_ticket(uuid, uuid) from public, anon;
revoke all on function app_private.require_customer_portal_knowledge_article_candidate(uuid) from public, anon, authenticated;

grant execute on function public.rpc_admin_grant_knowledge_article_entitlement(uuid, uuid, public.knowledge_article_entitlement_scope, text) to authenticated, service_role;
grant execute on function public.rpc_admin_archive_knowledge_article_entitlement(uuid, uuid) to authenticated, service_role;
grant execute on function public.rpc_admin_link_knowledge_article_to_ticket(uuid, uuid, uuid, text) to authenticated, service_role;
grant execute on function public.rpc_admin_unlink_knowledge_article_from_ticket(uuid, uuid) to authenticated, service_role;

comment on table public.knowledge_article_entitlements is
  'Entitlements customer-facing de artigos da Knowledge por tenant, sem substituir o gate editorial de publicação.';

comment on view public.vw_customer_portal_knowledge_articles is
  'Lista customer-facing de artigos públicos ou autorizados por tenant/portal/ticket, já sanitizada e deduplicada no backend.';

comment on view public.vw_customer_portal_knowledge_article_detail is
  'Detalhe customer-facing de artigo autorizado da Knowledge, sem advisory, revisão interna ou metadata sensível.';

comment on view public.vw_customer_portal_ticket_knowledge_links is
  'Artigos autorizados vinculados a tickets acessíveis no portal cliente, incluindo conteúdo restrito explicitamente autorizado.';

comment on function public.rpc_admin_grant_knowledge_article_entitlement(uuid, uuid, public.knowledge_article_entitlement_scope, text) is
  'Cria ou reativa entitlement customer-facing de artigo publicado da Knowledge para um tenant autorizado.';

comment on function public.rpc_admin_archive_knowledge_article_entitlement(uuid, uuid) is
  'Arquiva entitlement customer-facing existente sem apagar histórico.';

comment on function public.rpc_admin_link_knowledge_article_to_ticket(uuid, uuid, uuid, text) is
  'Vincula artigo publicado e elegível da Knowledge a um ticket para exposição customer-facing governada.';

comment on function public.rpc_admin_unlink_knowledge_article_from_ticket(uuid, uuid) is
  'Arquiva vínculo customer-facing de artigo com ticket sem apagar histórico.';
