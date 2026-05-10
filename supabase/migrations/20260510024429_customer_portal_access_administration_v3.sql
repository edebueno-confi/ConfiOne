drop view if exists public.vw_admin_customer_portal_access_overview;
drop view if exists public.vw_admin_customer_portal_users;
drop view if exists public.vw_admin_customer_portal_user_detail;
drop view if exists public.vw_admin_customer_portal_tenant_access;
drop view if exists public.vw_admin_knowledge_entitlements;
drop view if exists public.vw_admin_knowledge_entitlement_detail;
drop view if exists public.vw_admin_ticket_knowledge_links;
drop view if exists public.vw_admin_customer_portal_article_candidates;
drop view if exists public.vw_admin_customer_portal_ticket_candidates;
drop view if exists app_private.vw_admin_customer_portal_article_counts;
drop view if exists app_private.vw_admin_customer_portal_user_access_base;
drop view if exists app_private.vw_admin_customer_portal_ticket_visibility;
drop view if exists app_private.vw_admin_customer_portal_tenant_scope;

create view app_private.vw_admin_customer_portal_tenant_scope as
select distinct tm.tenant_id
from public.tenant_memberships as tm
where tm.role::text in ('customer_user', 'customer_manager')

union

select distinct ent.tenant_id
from public.knowledge_article_entitlements as ent

union

select distinct tkl.tenant_id
from public.ticket_knowledge_links as tkl
where tkl.link_type = 'sent_to_customer'::public.ticket_knowledge_link_type;

create view app_private.vw_admin_customer_portal_article_counts as
with public_articles as (
  select distinct ka.id as article_id
  from public.knowledge_articles as ka
  join app_private.vw_knowledge_articles_public_contract as pub
    on pub.article_id = ka.id
   and pub.public_article_path is not null
  where ka.status = 'published'::public.knowledge_article_status
    and ka.visibility = 'public'::public.knowledge_visibility
    and ka.published_at is not null
),
tenant_articles as (
  select
    ent.tenant_id,
    ent.article_id,
    case
      when ent.entitlement_scope = 'tenant'::public.knowledge_article_entitlement_scope
        then 'tenant'::text
      else 'customer_portal'::text
    end as exposure_source
  from public.knowledge_article_entitlements as ent
  join public.knowledge_articles as ka
    on ka.id = ent.article_id
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
),
ticket_linked_articles as (
  select distinct
    tkl.tenant_id,
    tkl.article_id,
    'ticket_linked'::text as exposure_source
  from public.ticket_knowledge_links as tkl
  join public.knowledge_articles as ka
    on ka.id = tkl.article_id
  where tkl.archived_at is null
    and tkl.link_type = 'sent_to_customer'::public.ticket_knowledge_link_type
    and ka.status = 'published'::public.knowledge_article_status
    and ka.visibility in (
      'public'::public.knowledge_visibility,
      'restricted'::public.knowledge_visibility
    )
    and ka.published_at is not null
),
exposure_catalog as (
  select
    scope.tenant_id,
    article.article_id,
    'public'::text as exposure_source
  from app_private.vw_admin_customer_portal_tenant_scope as scope
  cross join public_articles as article

  union all

  select
    tenant_id,
    article_id,
    exposure_source
  from tenant_articles

  union all

  select
    tenant_id,
    article_id,
    exposure_source
  from ticket_linked_articles
)
select
  scope.tenant_id,
  count(distinct catalog.article_id)::integer as authorized_article_count,
  count(distinct catalog.article_id)
    filter (where catalog.exposure_source = 'public')::integer as public_article_count,
  count(distinct catalog.article_id)
    filter (where catalog.exposure_source = 'tenant')::integer as tenant_article_count,
  count(distinct catalog.article_id)
    filter (where catalog.exposure_source = 'customer_portal')::integer as customer_portal_article_count,
  count(distinct catalog.article_id)
    filter (where catalog.exposure_source = 'ticket_linked')::integer as ticket_linked_article_count
from app_private.vw_admin_customer_portal_tenant_scope as scope
left join exposure_catalog as catalog
  on catalog.tenant_id = scope.tenant_id
group by scope.tenant_id;

create view app_private.vw_admin_customer_portal_user_access_base as
with portal_memberships as (
  select
    tm.id as membership_id,
    tm.tenant_id,
    tenant.slug as tenant_slug,
    tenant.display_name as tenant_display_name,
    tenant.legal_name as tenant_legal_name,
    tenant.status as tenant_status,
    tm.user_id,
    profile.full_name as user_full_name,
    profile.email as user_email,
    profile.is_active as user_is_active,
    contact.id as linked_contact_id,
    contact.full_name as linked_contact_full_name,
    contact.email as linked_contact_email,
    contact.job_title as linked_contact_job_title,
    coalesce(contact.is_primary, false) as linked_contact_is_primary,
    coalesce(contact.is_active, false) as linked_contact_is_active,
    tm.role::text as portal_role,
    tm.status as membership_status,
    tm.created_at,
    tm.updated_at,
    created_by.full_name as created_by_full_name,
    updated_by.full_name as updated_by_full_name,
    auth_user.last_sign_in_at as last_access_at
  from public.tenant_memberships as tm
  join public.tenants as tenant
    on tenant.id = tm.tenant_id
  join public.profiles as profile
    on profile.id = tm.user_id
  left join lateral (
    select
      tc.id,
      tc.full_name,
      tc.email,
      tc.job_title,
      tc.is_primary,
      tc.is_active
    from public.tenant_contacts as tc
    where tc.tenant_id = tm.tenant_id
      and tc.linked_user_id = tm.user_id
    order by tc.is_active desc, tc.is_primary desc, tc.created_at asc
    limit 1
  ) as contact on true
  left join public.profiles as created_by
    on created_by.id = tm.created_by_user_id
  left join public.profiles as updated_by
    on updated_by.id = tm.updated_by_user_id
  left join auth.users as auth_user
    on auth_user.id = tm.user_id
  where tm.role::text in ('customer_user', 'customer_manager')
),
visible_tickets as (
  select
    membership.membership_id,
    count(distinct ticket.id)::integer as visible_ticket_count
  from portal_memberships as membership
  left join public.tickets as ticket
    on ticket.tenant_id = membership.tenant_id
   and membership.membership_status = 'active'::public.membership_status
   and membership.tenant_status = 'active'::public.tenant_status
   and membership.user_is_active
   and membership.linked_contact_id is not null
   and membership.linked_contact_is_active
   and (
     membership.portal_role = 'customer_manager'
     or ticket.requester_contact_id = membership.linked_contact_id
   )
  group by membership.membership_id
)
select
  membership.membership_id,
  membership.tenant_id,
  membership.tenant_slug,
  membership.tenant_display_name,
  membership.tenant_legal_name,
  membership.tenant_status,
  membership.user_id,
  membership.user_full_name,
  membership.user_email,
  membership.user_is_active,
  membership.linked_contact_id,
  membership.linked_contact_full_name,
  membership.linked_contact_email,
  membership.linked_contact_job_title,
  membership.linked_contact_is_primary,
  membership.linked_contact_is_active,
  membership.portal_role,
  membership.membership_status,
  case
    when membership.membership_status = 'active'::public.membership_status
      and membership.tenant_status = 'active'::public.tenant_status
      and membership.user_is_active
      and membership.linked_contact_id is not null
      and membership.linked_contact_is_active
      then 'active'
    when membership.membership_status = 'invited'::public.membership_status
      or membership.linked_contact_id is null
      or not membership.linked_contact_is_active
      then 'pending'
    else 'blocked'
  end as access_status,
  (membership.portal_role = 'customer_manager') as can_view_all_tenant_tickets,
  coalesce(visible_tickets.visible_ticket_count, 0)::integer as visible_ticket_count,
  membership.last_access_at,
  membership.created_at,
  membership.updated_at,
  membership.created_by_full_name,
  membership.updated_by_full_name,
  (membership.linked_contact_id is null) as missing_contact,
  (membership.linked_contact_id is not null and not membership.linked_contact_is_active) as inactive_contact,
  nullif(
    concat_ws(
      '; ',
      case when membership.membership_status = 'invited'::public.membership_status then 'Convite pendente de ativação.' end,
      case when membership.membership_status = 'revoked'::public.membership_status then 'Acesso revogado no vínculo do tenant.' end,
      case when membership.tenant_status <> 'active'::public.tenant_status then 'Tenant fora do estado ativo.' end,
      case when not membership.user_is_active then 'Profile autenticado inativo.' end,
      case when membership.linked_contact_id is null then 'Contato customer-facing ainda não está vinculado.' end,
      case when membership.linked_contact_id is not null and not membership.linked_contact_is_active then 'Contato vinculado está inativo.' end
    ),
    ''
  ) as risk_summary
from portal_memberships as membership
left join visible_tickets
  on visible_tickets.membership_id = membership.membership_id;

create view app_private.vw_admin_customer_portal_ticket_visibility as
select
  base.tenant_id,
  ticket.id as ticket_id
from app_private.vw_admin_customer_portal_user_access_base as base
join public.tickets as ticket
  on ticket.tenant_id = base.tenant_id
where base.access_status = 'active'
  and (
    base.portal_role = 'customer_manager'
    or ticket.requester_contact_id = base.linked_contact_id
  );

create view public.vw_admin_customer_portal_tenant_access
with (security_barrier = true)
as
with tenant_scope as (
  select
    scope.tenant_id,
    tenant.slug as tenant_slug,
    tenant.display_name as tenant_display_name,
    tenant.status as tenant_status
  from app_private.vw_admin_customer_portal_tenant_scope as scope
  join public.tenants as tenant
    on tenant.id = scope.tenant_id
),
membership_rollup as (
  select
    base.tenant_id,
    count(*)::integer as portal_user_count,
    count(*) filter (where base.access_status = 'active')::integer as active_user_count,
    count(*) filter (where base.membership_status = 'invited'::public.membership_status)::integer as invited_user_count,
    count(*) filter (
      where base.access_status = 'blocked'
         or base.membership_status = 'revoked'::public.membership_status
    )::integer as blocked_user_count,
    count(*) filter (where base.portal_role = 'customer_manager')::integer as manager_count,
    bool_or(base.portal_role = 'customer_manager' and base.access_status = 'active') as has_active_manager,
    count(*) filter (where base.missing_contact)::integer as missing_contact_count,
    count(*) filter (where base.inactive_contact)::integer as inactive_contact_count,
    max(base.last_access_at) as last_access_at
  from app_private.vw_admin_customer_portal_user_access_base as base
  group by base.tenant_id
),
ticket_rollup as (
  select
    visibility.tenant_id,
    count(distinct visibility.ticket_id)::integer as visible_ticket_count
  from app_private.vw_admin_customer_portal_ticket_visibility as visibility
  group by visibility.tenant_id
),
entitlement_rollup as (
  select
    ent.tenant_id,
    count(*) filter (where ent.archived_at is null)::integer as active_entitlement_count
  from public.knowledge_article_entitlements as ent
  group by ent.tenant_id
),
ticket_link_rollup as (
  select
    tkl.tenant_id,
    count(*) filter (
      where tkl.archived_at is null
        and tkl.link_type = 'sent_to_customer'::public.ticket_knowledge_link_type
    )::integer as active_ticket_link_count
  from public.ticket_knowledge_links as tkl
  group by tkl.tenant_id
)
select
  tenant_scope.tenant_id,
  tenant_scope.tenant_slug,
  tenant_scope.tenant_display_name,
  tenant_scope.tenant_status,
  coalesce(membership_rollup.portal_user_count, 0)::integer as portal_user_count,
  coalesce(membership_rollup.active_user_count, 0)::integer as active_user_count,
  coalesce(membership_rollup.invited_user_count, 0)::integer as invited_user_count,
  coalesce(membership_rollup.blocked_user_count, 0)::integer as blocked_user_count,
  coalesce(membership_rollup.manager_count, 0)::integer as manager_count,
  coalesce(ticket_rollup.visible_ticket_count, 0)::integer as visible_ticket_count,
  coalesce(article_counts.authorized_article_count, 0)::integer as authorized_article_count,
  coalesce(entitlement_rollup.active_entitlement_count, 0)::integer as active_entitlement_count,
  coalesce(ticket_link_rollup.active_ticket_link_count, 0)::integer as active_ticket_link_count,
  membership_rollup.last_access_at,
  coalesce(membership_rollup.has_active_manager, false) as has_active_manager,
  coalesce(membership_rollup.missing_contact_count, 0)::integer as missing_contact_count,
  coalesce(membership_rollup.inactive_contact_count, 0)::integer as inactive_contact_count,
  nullif(
    concat_ws(
      '; ',
      case when coalesce(membership_rollup.portal_user_count, 0) = 0 then 'Nenhum usuário customer-facing vinculado.' end,
      case when not coalesce(membership_rollup.has_active_manager, false) then 'Tenant sem gestão customer-facing ativa.' end,
      case when coalesce(membership_rollup.missing_contact_count, 0) > 0 then 'Há vínculos sem contato customer-facing associado.' end,
      case when coalesce(membership_rollup.inactive_contact_count, 0) > 0 then 'Há contatos vinculados em estado inativo.' end
    ),
    ''
  ) as risk_summary
from tenant_scope
left join membership_rollup
  on membership_rollup.tenant_id = tenant_scope.tenant_id
left join ticket_rollup
  on ticket_rollup.tenant_id = tenant_scope.tenant_id
left join app_private.vw_admin_customer_portal_article_counts as article_counts
  on article_counts.tenant_id = tenant_scope.tenant_id
left join entitlement_rollup
  on entitlement_rollup.tenant_id = tenant_scope.tenant_id
left join ticket_link_rollup
  on ticket_link_rollup.tenant_id = tenant_scope.tenant_id
where app_private.has_global_role('platform_admin'::public.platform_role);

create view public.vw_admin_customer_portal_access_overview
with (security_barrier = true)
as
select
  count(*)::integer as tenant_count,
  count(*) filter (where tenant_access.tenant_status = 'active'::public.tenant_status)::integer as active_tenant_count,
  coalesce(sum(tenant_access.portal_user_count), 0)::integer as portal_user_count,
  coalesce(sum(tenant_access.active_user_count), 0)::integer as active_user_count,
  coalesce(sum(tenant_access.invited_user_count), 0)::integer as invited_user_count,
  coalesce(sum(tenant_access.blocked_user_count), 0)::integer as blocked_user_count,
  coalesce(sum(tenant_access.manager_count), 0)::integer as manager_count,
  coalesce(sum(tenant_access.visible_ticket_count), 0)::integer as visible_ticket_count,
  coalesce(sum(tenant_access.authorized_article_count), 0)::integer as authorized_article_count,
  count(*) filter (where not tenant_access.has_active_manager)::integer as tenant_without_manager_count,
  coalesce(sum(tenant_access.missing_contact_count), 0)::integer as missing_contact_count,
  coalesce(sum(tenant_access.inactive_contact_count), 0)::integer as inactive_contact_count
from public.vw_admin_customer_portal_tenant_access as tenant_access
where app_private.has_global_role('platform_admin'::public.platform_role);

create view public.vw_admin_customer_portal_users
with (security_barrier = true)
as
select
  base.membership_id,
  base.tenant_id,
  base.tenant_slug,
  base.tenant_display_name,
  base.tenant_status,
  base.user_id,
  base.user_full_name,
  base.user_email,
  base.user_is_active,
  base.linked_contact_id,
  base.linked_contact_full_name,
  base.linked_contact_email,
  base.linked_contact_job_title,
  base.linked_contact_is_primary,
  base.linked_contact_is_active,
  base.portal_role,
  base.membership_status,
  base.access_status,
  base.can_view_all_tenant_tickets,
  base.visible_ticket_count,
  coalesce(article_counts.authorized_article_count, 0)::integer as authorized_article_count,
  base.last_access_at,
  base.created_at,
  base.updated_at,
  base.created_by_full_name,
  base.updated_by_full_name,
  base.risk_summary,
  base.missing_contact,
  base.inactive_contact
from app_private.vw_admin_customer_portal_user_access_base as base
left join app_private.vw_admin_customer_portal_article_counts as article_counts
  on article_counts.tenant_id = base.tenant_id
where app_private.has_global_role('platform_admin'::public.platform_role);

create view public.vw_admin_customer_portal_user_detail
with (security_barrier = true)
as
select
  users.*,
  base.tenant_legal_name,
  coalesce(article_counts.public_article_count, 0)::integer as public_article_count,
  coalesce(article_counts.tenant_article_count, 0)::integer as tenant_article_count,
  coalesce(article_counts.customer_portal_article_count, 0)::integer as customer_portal_article_count,
  coalesce(article_counts.ticket_linked_article_count, 0)::integer as ticket_linked_article_count
from public.vw_admin_customer_portal_users as users
join app_private.vw_admin_customer_portal_user_access_base as base
  on base.membership_id = users.membership_id
left join app_private.vw_admin_customer_portal_article_counts as article_counts
  on article_counts.tenant_id = users.tenant_id
where app_private.has_global_role('platform_admin'::public.platform_role);

create view public.vw_admin_knowledge_entitlements
with (security_barrier = true)
as
select
  ent.id as entitlement_id,
  ent.tenant_id,
  tenant.slug as tenant_slug,
  tenant.display_name as tenant_display_name,
  ka.id as article_id,
  ka.title as article_title,
  ka.slug as article_slug,
  kc.name as category_name,
  ka.visibility as article_visibility,
  ka.status as article_status,
  ent.entitlement_scope::text as entitlement_scope,
  case
    when ent.archived_at is null then 'active'
    else 'archived'
  end as entitlement_status,
  ent.relation_reason,
  case
    when ka.visibility = 'public'::public.knowledge_visibility then 'public'
    else 'customer_portal'
  end as exposure_source,
  ent.created_by_user_id,
  created_by.full_name as created_by_full_name,
  ent.created_at,
  ent.archived_at,
  ent.archived_by_user_id,
  archived_by.full_name as archived_by_full_name
from public.knowledge_article_entitlements as ent
join public.tenants as tenant
  on tenant.id = ent.tenant_id
join public.knowledge_articles as ka
  on ka.id = ent.article_id
left join public.knowledge_categories as kc
  on kc.id = ka.category_id
left join public.profiles as created_by
  on created_by.id = ent.created_by_user_id
left join public.profiles as archived_by
  on archived_by.id = ent.archived_by_user_id
where ka.status = 'published'::public.knowledge_article_status
  and ka.visibility in (
    'public'::public.knowledge_visibility,
    'restricted'::public.knowledge_visibility
  )
  and app_private.has_global_role('platform_admin'::public.platform_role);

create view public.vw_admin_knowledge_entitlement_detail
with (security_barrier = true)
as
select
  entitlements.*,
  ka.published_at,
  ka.updated_at,
  (
    select count(*)::integer
    from public.ticket_knowledge_links as tkl
    where tkl.tenant_id = entitlements.tenant_id
      and tkl.article_id = entitlements.article_id
      and tkl.link_type = 'sent_to_customer'::public.ticket_knowledge_link_type
      and tkl.archived_at is null
  ) as active_ticket_link_count
from public.vw_admin_knowledge_entitlements as entitlements
join public.knowledge_articles as ka
  on ka.id = entitlements.article_id
where app_private.has_global_role('platform_admin'::public.platform_role);

create view public.vw_admin_ticket_knowledge_links
with (security_barrier = true)
as
select
  tkl.id as ticket_knowledge_link_id,
  tkl.tenant_id,
  tenant.slug as tenant_slug,
  tenant.display_name as tenant_display_name,
  ticket.id as ticket_id,
  ticket.title as ticket_title,
  ticket.status::text as ticket_status,
  ka.id as article_id,
  ka.title as article_title,
  ka.slug as article_slug,
  kc.name as category_name,
  ka.visibility as article_visibility,
  ka.status as article_status,
  coalesce(nullif(btrim(tkl.note), ''), 'Relacionado ao ticket.') as relation_reason,
  case
    when tkl.archived_at is null then 'active'
    else 'archived'
  end as link_status,
  'ticket_linked'::text as exposure_source,
  tkl.created_by_user_id,
  created_by.full_name as created_by_full_name,
  tkl.created_at,
  tkl.archived_at,
  tkl.archived_by_user_id,
  archived_by.full_name as archived_by_full_name
from public.ticket_knowledge_links as tkl
join public.tickets as ticket
  on ticket.id = tkl.ticket_id
 and ticket.tenant_id = tkl.tenant_id
join public.tenants as tenant
  on tenant.id = tkl.tenant_id
join public.knowledge_articles as ka
  on ka.id = tkl.article_id
left join public.knowledge_categories as kc
  on kc.id = ka.category_id
left join public.profiles as created_by
  on created_by.id = tkl.created_by_user_id
left join public.profiles as archived_by
  on archived_by.id = tkl.archived_by_user_id
where tkl.link_type = 'sent_to_customer'::public.ticket_knowledge_link_type
  and ka.status = 'published'::public.knowledge_article_status
  and ka.visibility in (
    'public'::public.knowledge_visibility,
    'restricted'::public.knowledge_visibility
  )
  and app_private.has_global_role('platform_admin'::public.platform_role);

create view public.vw_admin_customer_portal_article_candidates
with (security_barrier = true)
as
select
  ka.id as article_id,
  ka.title as article_title,
  ka.slug as article_slug,
  kc.name as category_name,
  ka.visibility as article_visibility,
  ka.status as article_status,
  ks.slug as knowledge_space_slug,
  ks.display_name as knowledge_space_display_name,
  ka.published_at
from public.knowledge_articles as ka
left join public.knowledge_categories as kc
  on kc.id = ka.category_id
left join public.knowledge_spaces as ks
  on ks.id = ka.knowledge_space_id
where ka.status = 'published'::public.knowledge_article_status
  and ka.visibility in (
    'public'::public.knowledge_visibility,
    'restricted'::public.knowledge_visibility
  )
  and ka.published_at is not null
  and app_private.has_global_role('platform_admin'::public.platform_role);

create view public.vw_admin_customer_portal_ticket_candidates
with (security_barrier = true)
as
select
  ticket.id as ticket_id,
  ticket.tenant_id,
  tenant.slug as tenant_slug,
  tenant.display_name as tenant_display_name,
  ticket.title as ticket_title,
  app_private.customer_ticket_status_label(ticket.status) as customer_status_label,
  ticket.updated_at,
  requester.full_name as requester_contact_full_name
from public.tickets as ticket
join app_private.vw_admin_customer_portal_tenant_scope as scope
  on scope.tenant_id = ticket.tenant_id
join public.tenants as tenant
  on tenant.id = ticket.tenant_id
left join public.tenant_contacts as requester
  on requester.id = ticket.requester_contact_id
 and requester.tenant_id = ticket.tenant_id
where app_private.has_global_role('platform_admin'::public.platform_role);

revoke all on public.vw_admin_customer_portal_access_overview from public, anon;
revoke all on public.vw_admin_customer_portal_users from public, anon;
revoke all on public.vw_admin_customer_portal_user_detail from public, anon;
revoke all on public.vw_admin_customer_portal_tenant_access from public, anon;
revoke all on public.vw_admin_knowledge_entitlements from public, anon;
revoke all on public.vw_admin_knowledge_entitlement_detail from public, anon;
revoke all on public.vw_admin_ticket_knowledge_links from public, anon;
revoke all on public.vw_admin_customer_portal_article_candidates from public, anon;
revoke all on public.vw_admin_customer_portal_ticket_candidates from public, anon;

grant select on public.vw_admin_customer_portal_access_overview to authenticated, service_role;
grant select on public.vw_admin_customer_portal_users to authenticated, service_role;
grant select on public.vw_admin_customer_portal_user_detail to authenticated, service_role;
grant select on public.vw_admin_customer_portal_tenant_access to authenticated, service_role;
grant select on public.vw_admin_knowledge_entitlements to authenticated, service_role;
grant select on public.vw_admin_knowledge_entitlement_detail to authenticated, service_role;
grant select on public.vw_admin_ticket_knowledge_links to authenticated, service_role;
grant select on public.vw_admin_customer_portal_article_candidates to authenticated, service_role;
grant select on public.vw_admin_customer_portal_ticket_candidates to authenticated, service_role;

comment on view public.vw_admin_customer_portal_access_overview is
  'Resumo administrativo do acesso customer-facing por tenant, com contagens reais e sem dados sensíveis.';
comment on view public.vw_admin_customer_portal_users is
  'Lista administrativa sanitizada dos usuários customer-facing por tenant.';
comment on view public.vw_admin_customer_portal_user_detail is
  'Detalhe administrativo de um vínculo customer-facing com contagens reais de exposição de knowledge.';
comment on view public.vw_admin_customer_portal_tenant_access is
  'Panorama administrativo por tenant do portal cliente B2B.';
comment on view public.vw_admin_knowledge_entitlements is
  'Entitlements administrativos de Knowledge customer-facing sem expor rascunhos ou notas editoriais internas.';
comment on view public.vw_admin_knowledge_entitlement_detail is
  'Detalhe administrativo de um entitlement customer-facing de Knowledge.';
comment on view public.vw_admin_ticket_knowledge_links is
  'Vínculos administrativos entre tickets e artigos enviados ao cliente.';
comment on view public.vw_admin_customer_portal_article_candidates is
  'Artigos publicados e elegíveis para concessão ou vínculo customer-facing.';
comment on view public.vw_admin_customer_portal_ticket_candidates is
  'Tickets elegíveis para vínculo customer-facing com artigos autorizados.';
