create or replace view public.vw_support_ticket_intake_tenants
with (security_barrier = true)
as
  with accessible_tenants as (
    select
      t.id,
      t.slug,
      t.display_name,
      t.legal_name,
      t.status,
      t.created_at,
      t.updated_at
    from public.tenants as t
    where app_private.can_access_support_workspace(t.id)
  ),
  active_contacts as (
    select
      tc.tenant_id,
      count(*)::integer as active_contacts_count
    from public.tenant_contacts as tc
    where tc.is_active
    group by tc.tenant_id
  )
  select
    t.id as tenant_id,
    t.slug as tenant_slug,
    t.display_name as tenant_display_name,
    t.legal_name as tenant_legal_name,
    t.status as tenant_status,
    t.created_at as tenant_created_at,
    t.updated_at as tenant_updated_at,
    coalesce(ac.active_contacts_count, 0) as active_contacts_count,
    (coalesce(ac.active_contacts_count, 0) > 0) as has_active_contacts
  from accessible_tenants as t
  left join active_contacts as ac
    on ac.tenant_id = t.id;

create or replace view public.vw_support_ticket_intake_contacts
with (security_barrier = true)
as
  select
    tc.id,
    tc.tenant_id,
    tc.linked_user_id,
    tc.full_name,
    tc.email,
    tc.phone,
    tc.job_title,
    tc.is_primary,
    tc.created_at
  from public.tenant_contacts as tc
  where tc.is_active
    and app_private.can_access_support_workspace(tc.tenant_id);

revoke all on public.vw_support_ticket_intake_tenants from public, anon, authenticated, service_role;
revoke all on public.vw_support_ticket_intake_contacts from public, anon, authenticated, service_role;

grant select on public.vw_support_ticket_intake_tenants to authenticated, service_role;
grant select on public.vw_support_ticket_intake_contacts to authenticated, service_role;

comment on view public.vw_support_ticket_intake_tenants is
  'Read model contratual de tenants elegiveis para intake no Support Workspace, restrito a platform_admin e support roles com membership ativo.';
comment on view public.vw_support_ticket_intake_contacts is
  'Read model contratual de contatos ativos elegiveis para intake de tickets, filtrado por tenant acessivel no Support Workspace.';
