create table if not exists public.customer_portal_user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  active_tenant_id uuid not null references public.tenants (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid not null references public.profiles (id) on delete restrict,
  updated_by_user_id uuid not null references public.profiles (id) on delete restrict
);

alter table public.customer_portal_user_preferences enable row level security;
alter table public.customer_portal_user_preferences force row level security;

drop policy if exists customer_portal_user_preferences_select_own on public.customer_portal_user_preferences;
create policy customer_portal_user_preferences_select_own
on public.customer_portal_user_preferences
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists customer_portal_user_preferences_insert_own on public.customer_portal_user_preferences;
create policy customer_portal_user_preferences_insert_own
on public.customer_portal_user_preferences
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists customer_portal_user_preferences_update_own on public.customer_portal_user_preferences;
create policy customer_portal_user_preferences_update_own
on public.customer_portal_user_preferences
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop view if exists public.vw_customer_portal_active_tenant_context;
drop view if exists public.vw_customer_portal_available_tenants;
drop view if exists app_private.vw_customer_portal_available_tenant_scope;

create view app_private.vw_customer_portal_available_tenant_scope
as
select
  profile.id as user_id,
  profile.full_name as user_full_name,
  profile.email as user_email,
  membership.tenant_id,
  tenant.slug as tenant_slug,
  tenant.display_name as tenant_display_name,
  tenant.legal_name as tenant_legal_name,
  membership.role::text as portal_role,
  contact.id as contact_id,
  contact.full_name as contact_full_name,
  contact.email as contact_email,
  contact.job_title as contact_job_title,
  true as can_view_tickets,
  true as can_create_ticket,
  (membership.role::text = 'customer_manager') as can_view_all_tenant_tickets
from public.profiles as profile
join public.tenant_memberships as membership
  on membership.user_id = profile.id
 and membership.status = 'active'::public.membership_status
 and membership.role::text in ('customer_user', 'customer_manager')
join public.tenants as tenant
  on tenant.id = membership.tenant_id
 and tenant.status = 'active'::public.tenant_status
join lateral (
  select
    tenant_contact.id,
    tenant_contact.full_name,
    tenant_contact.email,
    tenant_contact.job_title
  from public.tenant_contacts as tenant_contact
  where tenant_contact.tenant_id = membership.tenant_id
    and tenant_contact.linked_user_id = membership.user_id
    and tenant_contact.is_active
  order by tenant_contact.is_primary desc, tenant_contact.created_at asc
  limit 1
) as contact on true
join public.customer_account_features as feature
  on feature.tenant_id = membership.tenant_id
 and lower(feature.feature_key) = 'returns_portal'
 and feature.enabled
where profile.id = auth.uid()
  and profile.is_active;

create or replace function app_private.is_customer_portal_member(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from app_private.vw_customer_portal_available_tenant_scope as scope
    where scope.tenant_id = p_tenant_id
  );
$$;

create or replace function app_private.customer_portal_active_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  with available as (
    select
      scope.tenant_id,
      scope.tenant_display_name
    from app_private.vw_customer_portal_available_tenant_scope as scope
  ),
  preferred as (
    select preference.active_tenant_id
    from public.customer_portal_user_preferences as preference
    where preference.user_id = auth.uid()
    limit 1
  )
  select coalesce(
    (
      select preferred.active_tenant_id
      from preferred
      join available
        on available.tenant_id = preferred.active_tenant_id
      limit 1
    ),
    (
      select available.tenant_id
      from available
      order by lower(available.tenant_display_name) asc, available.tenant_id asc
      limit 1
    )
  );
$$;

create or replace function app_private.customer_portal_has_active_tenant(
  p_tenant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_tenant_id is not null
    and p_tenant_id = app_private.customer_portal_active_tenant_id();
$$;

create or replace function app_private.can_access_customer_ticket(
  p_ticket_id uuid,
  p_tenant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tickets as ticket
    where ticket.id = p_ticket_id
      and ticket.tenant_id = p_tenant_id
      and app_private.is_customer_portal_member(ticket.tenant_id)
      and app_private.customer_portal_has_active_tenant(ticket.tenant_id)
      and (
        app_private.is_customer_portal_manager(ticket.tenant_id)
        or ticket.created_by_user_id = auth.uid()
        or ticket.requester_contact_id = app_private.customer_portal_contact_id(ticket.tenant_id, auth.uid())
      )
  );
$$;

create view public.vw_customer_portal_available_tenants
with (security_barrier = true)
as
with active_tenant as (
  select app_private.customer_portal_active_tenant_id() as tenant_id
),
available_rollup as (
  select count(*)::integer as available_tenant_count
  from app_private.vw_customer_portal_available_tenant_scope
)
select
  scope.tenant_id,
  scope.tenant_slug,
  scope.tenant_display_name,
  scope.portal_role,
  'active'::text as access_status,
  scope.can_view_tickets,
  scope.can_create_ticket,
  scope.can_view_all_tenant_tickets,
  (scope.tenant_id = active_tenant.tenant_id) as is_active_context,
  available_rollup.available_tenant_count,
  (available_rollup.available_tenant_count > 1) as has_multiple_tenants
from app_private.vw_customer_portal_available_tenant_scope as scope
cross join active_tenant
cross join available_rollup
order by
  (scope.tenant_id = active_tenant.tenant_id) desc,
  lower(scope.tenant_display_name) asc,
  scope.tenant_id asc;

create or replace view public.vw_customer_portal_auth_context
with (security_barrier = true)
as
select
  scope.user_id,
  scope.user_full_name,
  scope.user_email,
  scope.tenant_id,
  scope.tenant_slug,
  scope.tenant_display_name,
  scope.tenant_legal_name,
  scope.portal_role,
  scope.contact_id,
  scope.contact_full_name,
  scope.contact_email,
  scope.contact_job_title,
  scope.can_view_tickets,
  scope.can_create_ticket,
  scope.can_view_all_tenant_tickets
from app_private.vw_customer_portal_available_tenant_scope as scope
where scope.tenant_id = app_private.customer_portal_active_tenant_id();

create or replace view public.vw_customer_portal_profile_context
with (security_barrier = true)
as
select
  ctx.user_id,
  ctx.user_full_name,
  ctx.user_email,
  ctx.tenant_id,
  ctx.tenant_slug,
  ctx.tenant_display_name,
  ctx.tenant_legal_name,
  ctx.portal_role,
  ctx.contact_id,
  ctx.contact_full_name,
  ctx.contact_email,
  ctx.contact_job_title,
  coalesce(account_profile.product_line::text, 'Indisponivel') as product_line,
  coalesce(account_profile.operational_status::text, 'Indisponivel') as operational_status,
  coalesce(account_profile.account_tier, 'Indisponivel') as account_tier,
  ctx.can_view_tickets,
  ctx.can_create_ticket,
  ctx.can_view_all_tenant_tickets
from public.vw_customer_portal_auth_context as ctx
left join public.customer_account_profiles as account_profile
  on account_profile.tenant_id = ctx.tenant_id;

create view public.vw_customer_portal_active_tenant_context
with (security_barrier = true)
as
with available_rollup as (
  select count(*)::integer as available_tenant_count
  from app_private.vw_customer_portal_available_tenant_scope
)
select
  ctx.user_id,
  ctx.user_full_name,
  ctx.user_email,
  ctx.tenant_id,
  ctx.tenant_slug,
  ctx.tenant_display_name,
  ctx.tenant_legal_name,
  ctx.portal_role,
  ctx.contact_id,
  ctx.contact_full_name,
  ctx.contact_email,
  ctx.contact_job_title,
  ctx.product_line,
  ctx.operational_status,
  ctx.account_tier,
  ctx.can_view_tickets,
  ctx.can_create_ticket,
  ctx.can_view_all_tenant_tickets,
  available_rollup.available_tenant_count,
  (available_rollup.available_tenant_count > 1) as has_multiple_tenants
from public.vw_customer_portal_profile_context as ctx
cross join available_rollup;

create or replace function public.rpc_customer_set_active_tenant(
  p_tenant_id uuid
)
returns table (
  user_id uuid,
  user_full_name text,
  user_email text,
  tenant_id uuid,
  tenant_slug text,
  tenant_display_name text,
  tenant_legal_name text,
  portal_role text,
  contact_id uuid,
  contact_full_name text,
  contact_email text,
  contact_job_title text,
  product_line text,
  operational_status text,
  account_tier text,
  can_view_tickets boolean,
  can_create_ticket boolean,
  can_view_all_tenant_tickets boolean,
  available_tenant_count integer,
  has_multiple_tenants boolean
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_actor_user_id uuid;
  v_existing_preference public.customer_portal_user_preferences;
begin
  v_actor_user_id := app_private.require_active_actor();

  if p_tenant_id is null then
    raise exception 'tenant_id is required';
  end if;

  if not app_private.is_customer_portal_member(p_tenant_id) then
    raise exception 'rpc_customer_set_active_tenant denied';
  end if;

  select *
  into v_existing_preference
  from public.customer_portal_user_preferences as preference
  where preference.user_id = v_actor_user_id
  limit 1;

  if v_existing_preference.user_id is not null
     and v_existing_preference.active_tenant_id = p_tenant_id then
    return query
    select
      ctx.user_id,
      ctx.user_full_name,
      ctx.user_email::text,
      ctx.tenant_id,
      ctx.tenant_slug,
      ctx.tenant_display_name,
      ctx.tenant_legal_name,
      ctx.portal_role,
      ctx.contact_id,
      ctx.contact_full_name,
      ctx.contact_email::text,
      ctx.contact_job_title,
      ctx.product_line,
      ctx.operational_status,
      ctx.account_tier,
      ctx.can_view_tickets,
      ctx.can_create_ticket,
      ctx.can_view_all_tenant_tickets,
      ctx.available_tenant_count,
      ctx.has_multiple_tenants
    from public.vw_customer_portal_active_tenant_context as ctx;
    return;
  end if;

  insert into public.customer_portal_user_preferences (
    user_id,
    active_tenant_id,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    v_actor_user_id,
    p_tenant_id,
    v_actor_user_id,
    v_actor_user_id
  )
  on conflict (user_id)
  do update
  set
    active_tenant_id = excluded.active_tenant_id,
    updated_by_user_id = excluded.updated_by_user_id
  where public.customer_portal_user_preferences.active_tenant_id is distinct from excluded.active_tenant_id;

  return query
  select
    ctx.user_id,
    ctx.user_full_name,
    ctx.user_email::text,
    ctx.tenant_id,
    ctx.tenant_slug,
    ctx.tenant_display_name,
    ctx.tenant_legal_name,
    ctx.portal_role,
    ctx.contact_id,
    ctx.contact_full_name,
    ctx.contact_email::text,
    ctx.contact_job_title,
    ctx.product_line,
    ctx.operational_status,
    ctx.account_tier,
    ctx.can_view_tickets,
    ctx.can_create_ticket,
    ctx.can_view_all_tenant_tickets,
    ctx.available_tenant_count,
    ctx.has_multiple_tenants
  from public.vw_customer_portal_active_tenant_context as ctx
  where ctx.tenant_id = p_tenant_id;
end;
$$;

create or replace function public.rpc_customer_create_ticket(
  p_tenant_id uuid,
  p_title text,
  p_description text
)
returns table (
  ticket_id uuid,
  tenant_id uuid,
  title text,
  customer_status_label text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_actor_user_id uuid;
  v_requester_contact_id uuid;
  v_ticket public.tickets;
begin
  v_actor_user_id := app_private.require_active_actor();

  if p_tenant_id is null then
    raise exception 'tenant_id is required';
  end if;

  if not app_private.customer_portal_has_active_tenant(p_tenant_id) then
    raise exception 'rpc_customer_create_ticket denied';
  end if;

  if nullif(btrim(p_title), '') is null then
    raise exception 'ticket title is required';
  end if;

  if nullif(btrim(p_description), '') is null then
    raise exception 'ticket description is required';
  end if;

  v_requester_contact_id := app_private.customer_portal_contact_id(p_tenant_id, v_actor_user_id);
  if v_requester_contact_id is null then
    raise exception 'customer contact not found for active actor';
  end if;

  insert into public.tickets (
    tenant_id,
    requester_contact_id,
    title,
    description,
    source,
    priority,
    severity,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_tenant_id,
    v_requester_contact_id,
    btrim(p_title),
    btrim(p_description),
    'portal'::public.ticket_source,
    'normal'::public.ticket_priority,
    'medium'::public.ticket_severity,
    v_actor_user_id,
    v_actor_user_id
  )
  returning *
  into v_ticket;

  v_ticket := app_private.apply_ticket_sla(v_ticket, v_actor_user_id);

  perform app_private.create_ticket_event(
    v_ticket.id,
    v_ticket.tenant_id,
    'ticket_created'::public.ticket_event_type,
    'customer'::public.message_visibility,
    v_actor_user_id,
    jsonb_build_object(
      'source', 'portal',
      'requester_contact_id', v_ticket.requester_contact_id
    )
  );

  ticket_id := v_ticket.id;
  tenant_id := v_ticket.tenant_id;
  title := v_ticket.title;
  customer_status_label := app_private.customer_ticket_status_label(v_ticket.status);
  created_at := v_ticket.created_at;

  return next;
end;
$$;

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

  if not app_private.customer_portal_has_active_tenant(p_tenant_id) then
    raise exception 'rpc_customer_search_knowledge_articles denied';
  end if;

  v_requested_source := lower(coalesce(nullif(btrim(p_source), ''), 'all'));

  if v_requested_source not in ('all', 'public', 'customer_portal', 'ticket_linked') then
    raise exception 'invalid source filter';
  end if;

  if p_ticket_id is not null then
    select ticket.*
    into v_ticket
    from public.tickets as ticket
    where ticket.id = p_ticket_id
      and ticket.tenant_id = p_tenant_id
      and app_private.can_access_customer_ticket(ticket.id, ticket.tenant_id);

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

create trigger customer_portal_user_preferences_set_updated_at
before update on public.customer_portal_user_preferences
for each row
execute function app_private.touch_updated_at();

create trigger customer_portal_user_preferences_audit
after insert or update or delete on public.customer_portal_user_preferences
for each row
execute function audit.capture_row_change();

revoke select, insert, update, delete on public.customer_portal_user_preferences from authenticated;

revoke all on function app_private.customer_portal_active_tenant_id() from public, anon, authenticated, service_role;
revoke all on function app_private.customer_portal_has_active_tenant(uuid) from public, anon, authenticated, service_role;
grant execute on function app_private.customer_portal_active_tenant_id() to authenticated, service_role;
grant execute on function app_private.customer_portal_has_active_tenant(uuid) to authenticated, service_role;

revoke all on public.vw_customer_portal_available_tenants from public, anon, authenticated, service_role;
revoke all on public.vw_customer_portal_active_tenant_context from public, anon, authenticated, service_role;
grant select on public.vw_customer_portal_available_tenants to authenticated, service_role;
grant select on public.vw_customer_portal_active_tenant_context to authenticated, service_role;

revoke all on function public.rpc_customer_set_active_tenant(uuid) from public, anon, authenticated, service_role;
grant execute on function public.rpc_customer_set_active_tenant(uuid) to authenticated, service_role;

comment on table public.customer_portal_user_preferences is
  'Preferencia auditavel de tenant ativo para a sessao customer-facing do portal cliente B2B.';

comment on view public.vw_customer_portal_available_tenants is
  'Lista segura dos tenants customer-facing disponiveis para a sessao autenticada, incluindo qual contexto esta ativo.';

comment on view public.vw_customer_portal_active_tenant_context is
  'Contexto ativo customer-facing do portal cliente, derivado pelo backend a partir da preferencia valida ou fallback seguro.';

comment on function app_private.customer_portal_active_tenant_id() is
  'Resolve o tenant ativo efetivo da sessao customer-facing, validando membership, contato ativo, tenant ativo e feature returns_portal.';

comment on function public.rpc_customer_set_active_tenant(uuid) is
  'Seleciona com seguranca o tenant ativo do portal cliente para a sessao autenticada, sem depender de cache local.';
