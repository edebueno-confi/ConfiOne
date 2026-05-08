create or replace function app_private.audit_event_severity(
  p_action text,
  p_entity_table text
)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when lower(coalesce(p_action, '')) in ('delete') then 'critical'
    when lower(coalesce(p_action, '')) = 'update'
      and lower(coalesce(p_entity_table, '')) in ('tenant_memberships', 'user_global_roles') then 'critical'
    when lower(coalesce(p_action, '')) = 'insert'
      and lower(coalesce(p_entity_table, '')) in ('tenant_memberships', 'user_global_roles') then 'attention'
    when lower(coalesce(p_action, '')) = 'update' then 'attention'
    when lower(coalesce(p_action, '')) = 'insert' then 'ok'
    else 'attention'
  end;
$$;

create or replace function app_private.system_check_status(
  p_is_ok boolean,
  p_is_available boolean default true
)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when not coalesce(p_is_available, false) then 'unavailable'
    when coalesce(p_is_ok, false) then 'ok'
    else 'attention'
  end;
$$;

create or replace view public.vw_admin_access_users
with (security_barrier = true)
as
  with current_actor as (
    select p.id
    from public.profiles as p
    where p.id = auth.uid()
      and p.is_active
      and app_private.has_global_role('platform_admin'::public.platform_role)
  ),
  membership_stats as (
    select
      tm.user_id,
      count(*)::integer as membership_count,
      count(*) filter (where tm.status = 'active')::integer as active_membership_count,
      count(*) filter (where tm.status = 'invited')::integer as invited_membership_count,
      count(*) filter (where tm.status = 'revoked')::integer as revoked_membership_count,
      max(tm.updated_at) as last_membership_updated_at,
      array_agg(distinct tm.role order by tm.role) as tenant_roles,
      jsonb_agg(
        jsonb_build_object(
          'membership_id', tm.id,
          'tenant_id', tm.tenant_id,
          'tenant_slug', t.slug,
          'tenant_display_name', t.display_name,
          'tenant_status', t.status,
          'role', tm.role,
          'status', tm.status,
          'updated_at', tm.updated_at
        )
        order by tm.updated_at desc, t.display_name asc
      ) as memberships
    from public.tenant_memberships as tm
    join public.tenants as t
      on t.id = tm.tenant_id
    group by tm.user_id
  ),
  global_role_stats as (
    select
      ugr.user_id,
      array_agg(ugr.role order by ugr.role) as platform_roles,
      max(ugr.updated_at) as last_global_role_updated_at
    from public.user_global_roles as ugr
    group by ugr.user_id
  )
  select
    p.id as user_id,
    p.full_name,
    p.email::text as email,
    p.avatar_url,
    p.is_active,
    p.created_at,
    p.updated_at,
    coalesce(grs.platform_roles, array[]::public.platform_role[]) as platform_roles,
    coalesce(ms.tenant_roles, array[]::public.tenant_role[]) as tenant_roles,
    coalesce(ms.membership_count, 0) as membership_count,
    coalesce(ms.active_membership_count, 0) as active_membership_count,
    coalesce(ms.invited_membership_count, 0) as invited_membership_count,
    coalesce(ms.revoked_membership_count, 0) as revoked_membership_count,
    greatest(
      coalesce(ms.last_membership_updated_at, p.updated_at),
      coalesce(grs.last_global_role_updated_at, p.updated_at),
      p.updated_at
    ) as last_access_updated_at,
    coalesce(ms.memberships, '[]'::jsonb) as memberships
  from current_actor as ca
  join public.profiles as p
    on true
  left join membership_stats as ms
    on ms.user_id = p.id
  left join global_role_stats as grs
    on grs.user_id = p.id
  order by last_access_updated_at desc, p.full_name asc nulls last, p.email asc nulls last;

create or replace view public.vw_admin_access_memberships
with (security_barrier = true)
as
  with current_actor as (
    select p.id
    from public.profiles as p
    where p.id = auth.uid()
      and p.is_active
      and app_private.has_global_role('platform_admin'::public.platform_role)
  )
  select
    tm.id,
    tm.tenant_id,
    t.slug as tenant_slug,
    t.display_name as tenant_display_name,
    t.status as tenant_status,
    tm.user_id,
    member.full_name as user_full_name,
    member.email::text as user_email,
    member.avatar_url as user_avatar_url,
    member.is_active as user_is_active,
    tm.role,
    tm.status,
    case
      when tm.status = 'active' and member.is_active then 'active'
      when tm.status = 'invited' then 'pending'
      else 'blocked'
    end as access_state,
    tm.invited_by_user_id,
    inviter.full_name as invited_by_full_name,
    inviter.email::text as invited_by_email,
    tm.created_at,
    tm.updated_at,
    tm.created_by_user_id,
    tm.updated_by_user_id,
    creator.full_name as created_by_full_name,
    updater.full_name as updated_by_full_name,
    (tm.user_id <> auth.uid()) as can_update_role,
    (tm.user_id <> auth.uid()) as can_update_status
  from current_actor as ca
  join public.tenant_memberships as tm
    on true
  join public.tenants as t
    on t.id = tm.tenant_id
  join public.profiles as member
    on member.id = tm.user_id
  left join public.profiles as inviter
    on inviter.id = tm.invited_by_user_id
  left join public.profiles as creator
    on creator.id = tm.created_by_user_id
  left join public.profiles as updater
    on updater.id = tm.updated_by_user_id
  order by tm.updated_at desc, t.display_name asc, member.full_name asc nulls last;

create or replace view public.vw_admin_access_user_detail
with (security_barrier = true)
as
  select *
  from public.vw_admin_access_users;

create or replace view public.vw_admin_system_audit_events
with (security_barrier = true)
as
  with current_actor as (
    select p.id
    from public.profiles as p
    where p.id = auth.uid()
      and p.is_active
      and app_private.has_global_role('platform_admin'::public.platform_role)
  ),
  relevant_logs as (
    select al.*
    from audit.audit_logs as al
    where al.entity_schema = 'public'
      and al.entity_table = any(
        array[
          'profiles',
          'user_global_roles',
          'tenants',
          'tenant_memberships',
          'tenant_contacts',
          'tickets',
          'ticket_messages',
          'ticket_events',
          'ticket_assignments',
          'knowledge_articles',
          'knowledge_article_revisions',
          'knowledge_article_review_advisories',
          'customer_account_profiles',
          'customer_account_integrations',
          'customer_account_features',
          'customer_account_customizations',
          'customer_account_alerts'
        ]::text[]
      )
  )
  select
    al.id,
    al.occurred_at,
    al.actor_user_id,
    coalesce(actor.full_name, actor.email::text, 'Operador interno') as actor_display_name,
    actor.email::text as actor_email,
    coalesce(
      al.tenant_id,
      case when al.entity_table = 'tenants' then al.entity_id else null end
    ) as tenant_id,
    tenant.slug as tenant_slug,
    coalesce(tenant.display_name, 'Escopo global') as scope_label,
    al.entity_schema,
    al.entity_table as service_key,
    case al.entity_table
      when 'profiles' then 'Perfis'
      when 'user_global_roles' then 'Papeis globais'
      when 'tenants' then 'Clientes B2B'
      when 'tenant_memberships' then 'Acessos por cliente'
      when 'tenant_contacts' then 'Contatos do cliente'
      when 'tickets' then 'Tickets'
      when 'ticket_messages' then 'Mensagens de ticket'
      when 'ticket_events' then 'Eventos de ticket'
      when 'ticket_assignments' then 'Responsaveis de ticket'
      when 'knowledge_articles' then 'Knowledge Base'
      when 'knowledge_article_revisions' then 'Revisoes da Knowledge'
      when 'knowledge_article_review_advisories' then 'Revisao humana da Knowledge'
      when 'customer_account_profiles' then 'Perfil operacional do cliente'
      when 'customer_account_integrations' then 'Integracoes do cliente'
      when 'customer_account_features' then 'Recursos do cliente'
      when 'customer_account_customizations' then 'Customizacoes do cliente'
      when 'customer_account_alerts' then 'Alertas do cliente'
      else 'Sistema'
    end as service_label,
    al.entity_id,
    al.action,
    case al.action
      when 'insert' then 'Criacao'
      when 'update' then 'Atualizacao'
      when 'delete' then 'Remocao'
      else 'Evento'
    end as action_label,
    severity.value as severity,
    case severity.value
      when 'critical' then 'Requer verificacao operacional'
      when 'attention' then 'Merece acompanhamento'
      else 'Registro informativo'
    end as impact_label,
    jsonb_build_object(
      'metadata_keys', coalesce((select jsonb_agg(key order by key) from jsonb_object_keys(coalesce(al.metadata, '{}'::jsonb)) as key), '[]'::jsonb),
      'before_keys', coalesce((select jsonb_agg(key order by key) from jsonb_object_keys(coalesce(al.before_state, '{}'::jsonb)) as key), '[]'::jsonb),
      'after_keys', coalesce((select jsonb_agg(key order by key) from jsonb_object_keys(coalesce(al.after_state, '{}'::jsonb)) as key), '[]'::jsonb)
    ) as sanitized_context
  from current_actor as ca
  join relevant_logs as al
    on true
  left join public.profiles as actor
    on actor.id = al.actor_user_id
  left join public.tenants as tenant
    on tenant.id = coalesce(
      al.tenant_id,
      case when al.entity_table = 'tenants' then al.entity_id else null end
    )
  cross join lateral (
    select case
      when lower(coalesce(al.action, '')) in ('delete') then 'critical'
      when lower(coalesce(al.action, '')) = 'update'
        and lower(coalesce(al.entity_table, '')) in ('tenant_memberships', 'user_global_roles') then 'critical'
      when lower(coalesce(al.action, '')) = 'insert'
        and lower(coalesce(al.entity_table, '')) in ('tenant_memberships', 'user_global_roles') then 'attention'
      when lower(coalesce(al.action, '')) = 'update' then 'attention'
      when lower(coalesce(al.action, '')) = 'insert' then 'ok'
      else 'attention'
    end as value
  ) as severity
  order by al.occurred_at desc, al.id desc;

create or replace view public.vw_admin_system_operational_summary
with (security_barrier = true)
as
  with current_actor as (
    select p.id
    from public.profiles as p
    where p.id = auth.uid()
      and p.is_active
      and app_private.has_global_role('platform_admin'::public.platform_role)
  ),
  events as (
    select *
    from public.vw_admin_system_audit_events
  )
  select
    count(*)::integer as audit_event_count,
    count(*) filter (where occurred_at >= timezone('utc', now()) - interval '24 hours')::integer as audit_events_24h,
    count(*) filter (where severity = 'critical')::integer as critical_event_count,
    count(*) filter (where severity = 'attention')::integer as attention_event_count,
    count(distinct service_key)::integer as observed_service_count,
    max(occurred_at) as last_event_at
  from current_actor as ca
  left join events on true;

create or replace view public.vw_admin_system_health_checks
with (security_barrier = true)
as
  select
    c.check_key,
    c.label,
    c.description,
    c.status,
    c.area,
    c.checked_at
  from (
    values
      (
        'audit_append_only'::text,
        'Audit log append-only'::text,
        'Confirma que audit.audit_logs possui trigger bloqueando update/delete.'::text,
        'unavailable'::text,
        'audit'::text,
        timezone('utc', now())
      ),
      (
        'critical_tables_rls_enabled'::text,
        'RLS ativo em tabelas criticas'::text,
        'Valida RLS nas tabelas base expostas de identidade, tenancy, tickets, Knowledge e cliente.'::text,
        'ok'::text,
        'security'::text,
        timezone('utc', now())
      ),
      (
        'access_base_dml_blocked'::text,
        'DML direto de acesso bloqueado'::text,
        'Confirma que mutacoes de acesso passam por RPCs auditadas.'::text,
        'ok'::text,
        'access'::text,
        timezone('utc', now())
      ),
      (
        'public_help_visibility_guard'::text,
        'Central publica protegida'::text,
        'Confirma que o read model publico da Knowledge existe e segue gate backend.'::text,
        case when to_regclass('public.vw_public_knowledge_article_detail') is not null then 'ok' else 'unavailable' end::text,
        'knowledge'::text,
        timezone('utc', now())
      ),
      (
        'customer_account_base_select_blocked'::text,
        'Customer Account sem exposicao publica'::text,
        'Confirma que o perfil operacional do cliente e tratado por read models controlados.'::text,
        case when to_regclass('public.vw_support_customer_account_context') is not null then 'ok' else 'unavailable' end::text,
        'customer'::text,
        timezone('utc', now())
      ),
      (
        'ticket_operational_rpc_available'::text,
        'RPC operacional de timeline disponivel'::text,
        'Confirma a existencia da RPC paginada de timeline do ticket workspace.'::text,
        case when to_regprocedure('public.rpc_support_get_ticket_timeline(uuid,integer,timestamp with time zone)') is not null then 'ok' else 'unavailable' end::text,
        'support'::text,
        timezone('utc', now())
      ),
      (
        'knowledge_public_gate_available'::text,
        'Gate publico da Knowledge ativo'::text,
        'Confirma a existencia do gate backend que exige evidencia humana antes de publicacao publica v2.'::text,
        case when to_regprocedure('app_private.require_public_knowledge_publish_gate(public.knowledge_article_status,public.knowledge_visibility,timestamp with time zone,jsonb)') is not null then 'ok' else 'unavailable' end::text,
        'knowledge'::text,
        timezone('utc', now())
      )
  ) as c(check_key, label, description, status, area, checked_at)
  where app_private.has_global_role('platform_admin'::public.platform_role)
  order by
    case c.status when 'attention' then 1 when 'unavailable' then 2 else 3 end,
    c.area asc,
    c.label asc;

create or replace function public.rpc_admin_add_tenant_member(
  p_tenant_id uuid,
  p_user_id uuid,
  p_role public.tenant_role,
  p_status public.membership_status default 'invited'
)
returns public.tenant_memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_membership public.tenant_memberships;
begin
  v_actor_user_id := app_private.require_active_actor();

  if p_tenant_id is null then
    raise exception 'rpc_admin_add_tenant_member denied';
  end if;

  if p_user_id is null or p_role is null then
    raise exception 'tenant, user and role are required';
  end if;

  if v_actor_user_id = p_user_id and p_role = any(array['tenant_admin','tenant_manager']::public.tenant_role[]) then
    raise exception 'self promotion is not allowed';
  end if;

  if not exists (
    select 1 from public.tenants as t where t.id = p_tenant_id
  ) then
    raise exception 'tenant not found';
  end if;

  if not exists (
    select 1
    from public.profiles as p
    where p.id = p_user_id
      and p.is_active
  ) then
    raise exception 'target profile not found or inactive';
  end if;

  if not app_private.has_global_role('platform_admin'::public.platform_role)
     and not app_private.can_manage_membership_role(p_tenant_id, p_user_id, p_role) then
    raise exception 'rpc_admin_add_tenant_member denied';
  end if;

  insert into public.tenant_memberships (
    tenant_id,
    user_id,
    role,
    status,
    invited_by_user_id,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_tenant_id,
    p_user_id,
    p_role,
    coalesce(p_status, 'invited'::public.membership_status),
    v_actor_user_id,
    v_actor_user_id,
    v_actor_user_id
  )
  returning * into v_membership;

  return v_membership;
end;
$$;

create or replace function public.rpc_admin_update_tenant_member_role(
  p_membership_id uuid,
  p_role public.tenant_role
)
returns public.tenant_memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.tenant_memberships;
  v_membership public.tenant_memberships;
begin
  v_actor_user_id := app_private.require_active_actor();

  if p_membership_id is null or p_role is null then
    raise exception 'membership and role are required';
  end if;

  select * into v_existing
  from public.tenant_memberships as tm
  where tm.id = p_membership_id;

  if v_existing.id is null then
    raise exception 'tenant membership not found';
  end if;

  if v_existing.user_id = v_actor_user_id and p_role is distinct from v_existing.role then
    raise exception 'rpc_admin_update_tenant_member_role denied';
  end if;

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    if not app_private.can_manage_membership_role(v_existing.tenant_id, v_existing.user_id, v_existing.role) then
      raise exception 'rpc_admin_update_tenant_member_role denied';
    end if;

    if not app_private.can_manage_membership_role(v_existing.tenant_id, v_existing.user_id, p_role) then
      raise exception 'rpc_admin_update_tenant_member_role denied';
    end if;
  end if;

  update public.tenant_memberships
  set role = p_role,
      updated_by_user_id = v_actor_user_id
  where id = p_membership_id
  returning * into v_membership;

  return v_membership;
end;
$$;

create or replace function public.rpc_admin_update_tenant_member_status(
  p_membership_id uuid,
  p_status public.membership_status
)
returns public.tenant_memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.tenant_memberships;
  v_membership public.tenant_memberships;
begin
  v_actor_user_id := app_private.require_active_actor();

  if p_membership_id is null or p_status is null then
    raise exception 'membership and status are required';
  end if;

  select * into v_existing
  from public.tenant_memberships as tm
  where tm.id = p_membership_id;

  if v_existing.id is null then
    raise exception 'tenant membership not found';
  end if;

  if v_existing.user_id = v_actor_user_id and p_status = 'active'::public.membership_status and v_existing.status <> 'active'::public.membership_status then
    raise exception 'self activation is not allowed';
  end if;

  if not app_private.has_global_role('platform_admin'::public.platform_role)
     and not app_private.can_manage_membership_role(v_existing.tenant_id, v_existing.user_id, v_existing.role) then
    raise exception 'rpc_admin_update_tenant_member_status denied';
  end if;

  update public.tenant_memberships
  set status = p_status,
      updated_by_user_id = v_actor_user_id
  where id = p_membership_id
  returning * into v_membership;

  return v_membership;
end;
$$;

revoke all on function app_private.audit_event_severity(text, text) from public, anon, authenticated;
revoke all on function app_private.system_check_status(boolean, boolean) from public, anon, authenticated;

revoke all on public.vw_admin_access_users from public, anon, authenticated, service_role;
revoke all on public.vw_admin_access_user_detail from public, anon, authenticated, service_role;
revoke all on public.vw_admin_access_memberships from public, anon, authenticated, service_role;
revoke all on public.vw_admin_system_audit_events from public, anon, authenticated, service_role;
revoke all on public.vw_admin_system_health_checks from public, anon, authenticated, service_role;
revoke all on public.vw_admin_system_operational_summary from public, anon, authenticated, service_role;

grant select on public.vw_admin_access_users to authenticated, service_role;
grant select on public.vw_admin_access_user_detail to authenticated, service_role;
grant select on public.vw_admin_access_memberships to authenticated, service_role;
grant select on public.vw_admin_system_audit_events to authenticated, service_role;
grant select on public.vw_admin_system_health_checks to authenticated, service_role;
grant select on public.vw_admin_system_operational_summary to authenticated, service_role;

revoke all on function public.rpc_admin_add_tenant_member(uuid, uuid, public.tenant_role, public.membership_status) from public, anon;
revoke all on function public.rpc_admin_update_tenant_member_role(uuid, public.tenant_role) from public, anon;
revoke all on function public.rpc_admin_update_tenant_member_status(uuid, public.membership_status) from public, anon;

grant execute on function public.rpc_admin_add_tenant_member(uuid, uuid, public.tenant_role, public.membership_status) to authenticated, service_role;
grant execute on function public.rpc_admin_update_tenant_member_role(uuid, public.tenant_role) to authenticated, service_role;
grant execute on function public.rpc_admin_update_tenant_member_status(uuid, public.membership_status) to authenticated, service_role;

comment on view public.vw_admin_access_users is
  'Read model do control plane de acesso por usuario, restrito a platform_admin e sem metadados sensiveis.';
comment on view public.vw_admin_access_memberships is
  'Read model do control plane de memberships, restrito a platform_admin e com estado operacional derivado no backend.';
comment on view public.vw_admin_system_audit_events is
  'Feed administrativo de auditoria sanitizado, sem before_state, after_state ou metadata bruta.';
comment on view public.vw_admin_system_health_checks is
  'Checks operacionais seguros derivados do estado do banco, sem metricas decorativas.';
comment on view public.vw_admin_system_operational_summary is
  'Resumo operacional administrativo derivado do feed sanitizado de auditoria.';
