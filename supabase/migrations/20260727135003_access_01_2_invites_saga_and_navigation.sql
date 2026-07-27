-- ACCESS-01.2: entrega oficial de convites, aceite idempotente e guardas de
-- continuidade do ultimo administrador. A migration e forward-only; nenhum
-- dado operacional ou segredo e criado por este lote.

alter table public.internal_invites
  add column if not exists auth_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists delivery_attempts integer not null default 0,
  add column if not exists last_delivery_at timestamptz,
  add column if not exists last_delivery_error text;

create index if not exists internal_invites_email_status_idx
  on public.internal_invites (lower(email::text), status, expires_at);

create or replace function app_private.assert_platform_admin_survives(
  p_target_user_id uuid,
  p_action text,
  p_justification text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_count integer;
  v_target_is_admin boolean;
begin
  if nullif(btrim(coalesce(p_justification, '')), '') is null then
    raise exception 'justification is required for privileged access changes' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('gso:last-platform-admin', 0));
  select exists (
    select 1 from public.user_global_roles
    where user_id = p_target_user_id and role = 'platform_admin'::public.platform_role
  ) into v_target_is_admin;

  if not v_target_is_admin then
    return;
  end if;

  select count(*)::integer into v_admin_count
  from public.user_global_roles r
  join public.profiles p on p.id = r.user_id
  where r.role = 'platform_admin'::public.platform_role
    and p.is_active;

  if v_admin_count <= 1 then
    raise exception 'last platform administrator cannot be changed (%).', p_action using errcode = '42501';
  end if;
end;
$$;

create or replace function app_private.guard_last_platform_admin_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.is_active and not new.is_active
     and exists (select 1 from public.user_global_roles where user_id = old.id and role = 'platform_admin'::public.platform_role) then
    perform app_private.assert_platform_admin_survives(old.id, 'profile_suspend', 'system guard');
  end if;
  return new;
end;
$$;

drop trigger if exists guard_last_platform_admin_profile on public.profiles;
create trigger guard_last_platform_admin_profile
before update of is_active on public.profiles
for each row execute function app_private.guard_last_platform_admin_profile();

create or replace function app_private.guard_last_platform_admin_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'platform_admin'::public.platform_role
     and (tg_op = 'DELETE' or new.role <> old.role) then
    perform app_private.assert_platform_admin_survives(old.user_id, 'platform_role_remove', 'system guard');
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists guard_last_platform_admin_role on public.user_global_roles;
create trigger guard_last_platform_admin_role
before update or delete on public.user_global_roles
for each row execute function app_private.guard_last_platform_admin_role();

create or replace function public.rpc_admin_set_internal_user_status(
  p_user_id uuid,
  p_is_active boolean,
  p_justification text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_actor uuid;
begin
  v_actor := app_private.require_active_actor();
  perform app_private.require_internal_capability('access.users.manage');
  if nullif(btrim(coalesce(p_justification, '')), '') is null then
    raise exception 'justification is required for user status changes' using errcode = '22023';
  end if;
  if p_user_id = v_actor and not p_is_active then
    raise exception 'cannot suspend the current administrator' using errcode = '42501';
  end if;
  if not p_is_active then
    perform app_private.assert_platform_admin_survives(p_user_id, 'user_suspend', p_justification);
  end if;
  update public.profiles set is_active = p_is_active, updated_by_user_id = v_actor, updated_at = timezone('utc', now()) where id = p_user_id;
  update public.user_actor_contexts set status = case when p_is_active then 'active'::public.internal_actor_context_status else 'suspended'::public.internal_actor_context_status end, updated_by_user_id = v_actor, updated_at = timezone('utc', now()) where user_id = p_user_id and actor_type = 'internal'::public.internal_actor_type;
  update public.internal_area_memberships set status = case when p_is_active then 'active'::public.internal_area_membership_status else 'inactive'::public.internal_area_membership_status end, updated_by_user_id = v_actor, updated_at = timezone('utc', now()) where user_id = p_user_id and status <> 'archived'::public.internal_area_membership_status;
  return public.rpc_admin_get_internal_access_user(p_user_id);
end;
$$;

create or replace function public.rpc_admin_set_internal_user_status(
  p_user_id uuid,
  p_is_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  return public.rpc_admin_set_internal_user_status(p_user_id, p_is_active, null);
end;
$$;

create or replace function public.rpc_accept_internal_invitation_by_id(p_invite_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.internal_invites;
  v_user uuid := auth.uid();
  v_auth_email text;
  v_tenant uuid;
begin
  if v_user is null then raise exception 'authenticated user required' using errcode = '42501'; end if;
  select email::text into v_auth_email from auth.users where id = v_user;
  select * into v_invite from public.internal_invites where id = p_invite_id for update;
  if v_invite.id is null then raise exception 'invite not found'; end if;
  if v_invite.status = 'accepted' and v_invite.accepted_by_user_id = v_user then
    return jsonb_build_object('invite_id', v_invite.id, 'status', 'accepted', 'idempotent', true);
  end if;
  if v_invite.status not in ('pending','sent') or v_invite.expires_at <= timezone('utc', now()) then
    raise exception 'invite invalid, expired or revoked' using errcode = '42501';
  end if;
  if lower(v_auth_email) <> lower(v_invite.email::text) then
    raise exception 'invite email mismatch' using errcode = '42501';
  end if;
  insert into public.user_actor_contexts(user_id, actor_type, is_primary, status, created_by_user_id, updated_by_user_id)
  values(v_user, 'internal', true, 'active', v_user, v_user)
  on conflict (user_id, actor_type) do update set status='active', is_primary=true, updated_at=timezone('utc', now()), updated_by_user_id=v_user;
  insert into public.tenants(slug, legal_name, display_name, status, data_region, created_by_user_id, updated_by_user_id)
  values('genius-internal', 'Genius Returns', 'Operação interna Genius Returns', 'active', 'sa-east-1', v_user, v_user)
  on conflict (lower(slug)) do update set status='active' returning id into v_tenant;
  if v_tenant is null then select id into v_tenant from public.tenants where slug='genius-internal'; end if;
  insert into public.tenant_memberships(tenant_id, user_id, role, status, created_by_user_id, updated_by_user_id)
  values(v_tenant, v_user, 'tenant_viewer', 'active', v_user, v_user)
  on conflict (tenant_id,user_id) do update set status='active', updated_by_user_id=v_user;
  insert into public.internal_area_memberships(tenant_id, user_id, area_key, organizational_area_key, role, status, access_profile_id, permission_mode, created_by_user_id, updated_by_user_id)
  values(v_tenant, v_user, case when exists(select 1 from public.internal_action_target_areas where area_key=v_invite.organizational_area_key) then v_invite.organizational_area_key else 'other_internal' end, v_invite.organizational_area_key, 'member', 'active', v_invite.access_profile_id, case when v_invite.access_profile_id is null then 'custom' else 'profile' end::public.internal_permission_mode, v_user, v_user)
  on conflict (tenant_id,user_id,area_key) do update set organizational_area_key=excluded.organizational_area_key, status='active', access_profile_id=excluded.access_profile_id, permission_mode=excluded.permission_mode, updated_by_user_id=v_user;
  update public.internal_invites set status='accepted', accepted_by_user_id=v_user, auth_user_id=v_user, accepted_at=timezone('utc', now()), updated_at=timezone('utc', now()) where id=v_invite.id;
  return jsonb_build_object('invite_id', v_invite.id, 'status', 'accepted', 'idempotent', false);
end;
$$;

create or replace function public.rpc_internal_invitation_delivery_update(
  p_invite_id uuid,
  p_success boolean,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_row public.internal_invites;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  update public.internal_invites
  set delivery_attempts=delivery_attempts+1,
      last_delivery_at=timezone('utc', now()),
      last_delivery_error=case when p_success then null else left(coalesce(p_error, 'delivery failed'), 500) end,
      status=case when p_success then 'sent'::public.internal_invitation_status else 'failed'::public.internal_invitation_status end,
      sent_at=case when p_success then coalesce(sent_at, timezone('utc', now())) else sent_at end,
      updated_at=timezone('utc', now())
  where id=p_invite_id and status in ('pending','sent')
  returning * into v_row;
  if v_row.id is null then raise exception 'invite not found or no longer deliverable'; end if;
  return jsonb_build_object('invite_id', v_row.id, 'status', v_row.status, 'delivery_attempts', v_row.delivery_attempts);
end;
$$;

revoke all on function app_private.assert_platform_admin_survives(uuid,text,text) from public, anon, authenticated;
revoke all on function app_private.guard_last_platform_admin_profile() from public, anon, authenticated;
revoke all on function app_private.guard_last_platform_admin_role() from public, anon, authenticated;
revoke all on function public.rpc_admin_set_internal_user_status(uuid,boolean,text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_set_internal_user_status(uuid,boolean) from public, anon, authenticated, service_role;
revoke all on function public.rpc_accept_internal_invitation_by_id(uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_internal_invitation_delivery_update(uuid,boolean,text) from public, anon, authenticated, service_role;
grant execute on function public.rpc_admin_set_internal_user_status(uuid,boolean,text) to authenticated, service_role;
grant execute on function public.rpc_admin_set_internal_user_status(uuid,boolean) to authenticated, service_role;
grant execute on function public.rpc_accept_internal_invitation_by_id(uuid) to authenticated, service_role;
grant execute on function public.rpc_internal_invitation_delivery_update(uuid,boolean,text) to service_role;

comment on function public.rpc_accept_internal_invitation_by_id(uuid) is 'Aceite idempotente: Auth prova o email; a RPC materializa contexto, tenant e membership sem expor token.';
comment on function public.rpc_internal_invitation_delivery_update(uuid,boolean,text) is 'Atualizacao de entrega somente pelo backend de convite; nenhum token ou email e registrado em log de erro.';
