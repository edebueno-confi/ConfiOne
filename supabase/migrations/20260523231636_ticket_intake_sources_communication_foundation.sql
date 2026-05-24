create or replace function app_private.ticket_origin_key(p_source public.ticket_source)
returns text
language plpgsql
stable
set search_path = ''
as $$
begin
  return case p_source
    when 'portal'::public.ticket_source then 'customer_portal'
    when 'email'::public.ticket_source then 'email_future'
    when 'chat'::public.ticket_source then 'chat_future'
    when 'api'::public.ticket_source then 'api_future'
    when 'phone'::public.ticket_source then 'suporte_manual'
    when 'internal'::public.ticket_source then 'suporte_manual'
    else 'unknown'
  end;
end;
$$;

create or replace function app_private.ticket_origin_label(p_source public.ticket_source)
returns text
language plpgsql
stable
set search_path = ''
as $$
begin
  return case p_source
    when 'portal'::public.ticket_source then 'Portal do cliente'
    when 'email'::public.ticket_source then 'E-mail preparado para futuro'
    when 'chat'::public.ticket_source then 'Chat preparado para futuro'
    when 'api'::public.ticket_source then 'API preparada para futuro'
    when 'phone'::public.ticket_source then 'Suporte manual'
    when 'internal'::public.ticket_source then 'Suporte manual'
    else 'Origem indisponivel'
  end;
end;
$$;

create or replace function app_private.ticket_channel_key(p_source public.ticket_source)
returns text
language plpgsql
stable
set search_path = ''
as $$
begin
  return case p_source
    when 'portal'::public.ticket_source then 'customer_portal'
    when 'email'::public.ticket_source then 'email'
    when 'chat'::public.ticket_source then 'chat'
    when 'api'::public.ticket_source then 'api'
    when 'phone'::public.ticket_source then 'internal_support'
    when 'internal'::public.ticket_source then 'internal_support'
    else 'unknown'
  end;
end;
$$;

create or replace function app_private.ticket_channel_label(p_source public.ticket_source)
returns text
language plpgsql
stable
set search_path = ''
as $$
begin
  return case p_source
    when 'portal'::public.ticket_source then 'Portal Cliente'
    when 'email'::public.ticket_source then 'E-mail'
    when 'chat'::public.ticket_source then 'Chat'
    when 'api'::public.ticket_source then 'API'
    when 'phone'::public.ticket_source then 'Suporte interno'
    when 'internal'::public.ticket_source then 'Suporte interno'
    else 'Canal indisponivel'
  end;
end;
$$;

create or replace function app_private.ticket_reply_mode(p_source public.ticket_source)
returns text
language plpgsql
stable
set search_path = ''
as $$
begin
  return case p_source
    when 'portal'::public.ticket_source then 'customer_portal_public_reply'
    when 'phone'::public.ticket_source then 'support_public_message'
    when 'internal'::public.ticket_source then 'support_public_message'
    else 'unavailable'
  end;
end;
$$;

create or replace function app_private.ticket_reply_unavailable_reason(
  p_source public.ticket_source,
  p_status public.ticket_status,
  p_can_add_message boolean
)
returns text
language plpgsql
stable
set search_path = ''
as $$
begin
  return case
    when not coalesce(p_can_add_message, false) then 'Seu acesso atual nao permite responder este ticket.'
    when p_status = any(array['closed', 'cancelled']::public.ticket_status[]) then 'Ticket fechado ou cancelado nao aceita novas respostas.'
    when p_source = any(array['email', 'chat', 'api']::public.ticket_source[]) then app_private.ticket_channel_label(p_source) || ' ainda nao esta integrado para resposta direta.'
    else null
  end;
end;
$$;

create or replace function app_private.ticket_can_reply_now(
  p_source public.ticket_source,
  p_status public.ticket_status,
  p_can_add_message boolean
)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
begin
  return coalesce(p_can_add_message, false)
    and p_status <> all(array['closed', 'cancelled']::public.ticket_status[])
    and p_source <> all(array['email', 'chat', 'api']::public.ticket_source[]);
end;
$$;

create or replace function app_private.ticket_timeline_direction(
  p_tenant_id uuid,
  p_visibility public.message_visibility,
  p_actor_user_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return case
    when p_visibility = 'internal'::public.message_visibility then 'internal'
    when exists (
      select 1
      from public.tenant_contacts as tc
      where tc.tenant_id = p_tenant_id
        and tc.linked_user_id = p_actor_user_id
        and tc.is_active
    ) then 'inbound'
    else 'outbound'
  end;
end;
$$;

create or replace function app_private.ticket_customer_timeline_label(
  p_entry_type text,
  p_event_type public.ticket_event_type,
  p_tenant_id uuid,
  p_actor_user_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return case
    when p_entry_type = 'message'
      and app_private.ticket_timeline_direction(p_tenant_id, 'customer'::public.message_visibility, p_actor_user_id) = 'inbound'
      then 'Enviado pelo portal'
    when p_entry_type = 'message' then 'Resposta do suporte'
    when p_event_type = 'ticket_created'::public.ticket_event_type then 'Ticket criado'
    else 'Atualizacao do ticket'
  end;
end;
$$;

revoke all on function app_private.ticket_origin_key(public.ticket_source) from public, anon, authenticated, service_role;
revoke all on function app_private.ticket_origin_label(public.ticket_source) from public, anon, authenticated, service_role;
revoke all on function app_private.ticket_channel_key(public.ticket_source) from public, anon, authenticated, service_role;
revoke all on function app_private.ticket_channel_label(public.ticket_source) from public, anon, authenticated, service_role;
revoke all on function app_private.ticket_reply_mode(public.ticket_source) from public, anon, authenticated, service_role;
revoke all on function app_private.ticket_reply_unavailable_reason(public.ticket_source, public.ticket_status, boolean) from public, anon, authenticated, service_role;
revoke all on function app_private.ticket_can_reply_now(public.ticket_source, public.ticket_status, boolean) from public, anon, authenticated, service_role;
revoke all on function app_private.ticket_timeline_direction(uuid, public.message_visibility, uuid) from public, anon, authenticated, service_role;
revoke all on function app_private.ticket_customer_timeline_label(text, public.ticket_event_type, uuid, uuid) from public, anon, authenticated, service_role;

grant execute on function app_private.ticket_origin_key(public.ticket_source) to service_role;
grant execute on function app_private.ticket_origin_label(public.ticket_source) to service_role;
grant execute on function app_private.ticket_channel_key(public.ticket_source) to service_role;
grant execute on function app_private.ticket_channel_label(public.ticket_source) to service_role;
grant execute on function app_private.ticket_reply_mode(public.ticket_source) to service_role;
grant execute on function app_private.ticket_reply_unavailable_reason(public.ticket_source, public.ticket_status, boolean) to service_role;
grant execute on function app_private.ticket_can_reply_now(public.ticket_source, public.ticket_status, boolean) to service_role;
grant execute on function app_private.ticket_timeline_direction(uuid, public.message_visibility, uuid) to service_role;
grant execute on function app_private.ticket_customer_timeline_label(text, public.ticket_event_type, uuid, uuid) to service_role;

create or replace view public.vw_admin_ticket_channel_definitions
with (security_barrier = true)
as
select
  source_value::public.ticket_source as source,
  case source_value::public.ticket_source
    when 'portal' then 'customer_portal'
    when 'internal' then 'suporte_manual'
    when 'email' then 'email_future'
    when 'chat' then 'chat_future'
    when 'api' then 'api_future'
    when 'phone' then 'suporte_manual'
    else 'system_future'
  end as origin_key,
  case source_value::public.ticket_source
    when 'portal' then 'Portal do cliente'
    when 'internal' then 'Suporte manual'
    when 'email' then 'Email futuro'
    when 'chat' then 'Chat futuro'
    when 'api' then 'API futura'
    when 'phone' then 'Telefone'
    else 'Sistema'
  end as origin_label,
  case source_value::public.ticket_source
    when 'portal' then 'customer_portal'
    when 'internal' then 'internal_support'
    when 'email' then 'email'
    when 'chat' then 'chat'
    when 'api' then 'api'
    when 'phone' then 'internal_support'
    else 'internal_support'
  end as channel_key,
  case source_value::public.ticket_source
    when 'portal' then 'Portal do cliente'
    when 'internal' then 'Suporte interno'
    when 'email' then 'Email'
    when 'chat' then 'Chat'
    when 'api' then 'API'
    when 'phone' then 'Telefone'
    else 'Suporte interno'
  end as channel_label,
  (source_value::public.ticket_source <> all(array['email', 'chat', 'api']::public.ticket_source[])) as is_currently_integrated,
  case
    when source_value::public.ticket_source = any(array['email', 'chat', 'api']::public.ticket_source[]) then 'unavailable'
    else 'customer_message'
  end as reply_mode,
  case
    when source_value::public.ticket_source = any(array['email', 'chat', 'api']::public.ticket_source[])
      then case source_value::public.ticket_source
        when 'email' then 'Email'
        when 'chat' then 'Chat'
        when 'api' then 'API'
        else 'Canal externo'
      end || ' esta preparado para futuro, mas ainda nao envia nem recebe respostas externas.'
    else null::text
  end as reason_if_unavailable
from unnest(enum_range(null::public.ticket_source)) as source_value
where app_private.has_global_role('platform_admin'::public.platform_role);

create or replace view public.vw_ticket_timeline
with (security_barrier = true)
as
  with accessible_tickets as (
    select
      t.id,
      t.tenant_id,
      t.source,
      app_private.can_view_internal_ticket_content(t.tenant_id) as can_view_internal
    from public.tickets as t
    where app_private.has_global_role('platform_admin'::public.platform_role)
       or app_private.is_active_tenant_member(t.tenant_id)
  )
  select
    tm.ticket_id,
    tm.tenant_id,
    tm.id as timeline_entry_id,
    'message'::text as entry_type,
    tm.visibility,
    tm.created_at as occurred_at,
    tm.created_by_user_id as actor_user_id,
    tm.id as message_id,
    null::uuid as event_id,
    null::public.ticket_event_type as event_type,
    null::uuid as assignment_id,
    tm.body,
    tm.metadata,
    coalesce(
      nullif(tm.metadata ->> 'communication_direction', ''),
      case
        when tm.visibility = 'internal'::public.message_visibility then 'internal'
        else 'outbound'
      end
    ) as communication_direction,
    coalesce(
      nullif(tm.metadata ->> 'communication_channel', ''),
      case
        when tm.visibility = 'internal'::public.message_visibility then 'internal_support'
        when at.source = 'portal'::public.ticket_source then 'customer_portal'
        when at.source = 'email'::public.ticket_source then 'email'
        when at.source = 'chat'::public.ticket_source then 'chat'
        when at.source = 'api'::public.ticket_source then 'api'
        else 'internal_support'
      end
    ) as communication_channel,
    coalesce(
      nullif(tm.metadata ->> 'communication_channel_label', ''),
      case
        when tm.visibility = 'internal'::public.message_visibility then 'Suporte interno'
        when at.source = 'portal'::public.ticket_source then 'Portal do cliente'
        when at.source = 'email'::public.ticket_source then 'Email'
        when at.source = 'chat'::public.ticket_source then 'Chat'
        when at.source = 'api'::public.ticket_source then 'API'
        when at.source = 'phone'::public.ticket_source then 'Telefone'
        else 'Suporte interno'
      end
    ) as communication_channel_label,
    (tm.visibility = 'customer'::public.message_visibility) as is_customer_visible
  from accessible_tickets as at
  join public.ticket_messages as tm
    on tm.ticket_id = at.id
   and tm.tenant_id = at.tenant_id
   and (
     tm.visibility = 'customer'
     or at.can_view_internal
   )
  union all
  select
    te.ticket_id,
    te.tenant_id,
    te.id as timeline_entry_id,
    'event'::text as entry_type,
    te.visibility,
    te.occurred_at,
    te.actor_user_id,
    te.message_id,
    te.id as event_id,
    te.event_type,
    te.assignment_id,
    null::text as body,
    te.metadata,
    coalesce(nullif(te.metadata ->> 'communication_direction', ''), 'system') as communication_direction,
    coalesce(
      nullif(te.metadata ->> 'communication_channel', ''),
      case
        when at.source = 'portal'::public.ticket_source then 'customer_portal'
        when at.source = 'email'::public.ticket_source then 'email'
        when at.source = 'chat'::public.ticket_source then 'chat'
        when at.source = 'api'::public.ticket_source then 'api'
        else 'internal_support'
      end
    ) as communication_channel,
    coalesce(
      nullif(te.metadata ->> 'communication_channel_label', ''),
      case
        when at.source = 'portal'::public.ticket_source then 'Portal do cliente'
        when at.source = 'email'::public.ticket_source then 'Email'
        when at.source = 'chat'::public.ticket_source then 'Chat'
        when at.source = 'api'::public.ticket_source then 'API'
        when at.source = 'phone'::public.ticket_source then 'Telefone'
        else 'Suporte interno'
      end
    ) as communication_channel_label,
    (te.visibility = 'customer'::public.message_visibility) as is_customer_visible
  from accessible_tickets as at
  join public.ticket_events as te
    on te.ticket_id = at.id
   and te.tenant_id = at.tenant_id
   and (
     te.visibility = 'customer'
     or at.can_view_internal
   );

create or replace view public.vw_support_ticket_channel_context
with (security_barrier = true)
as
select
  q.id as ticket_id,
  q.tenant_id,
  q.source,
  case q.source
    when 'portal' then 'customer_portal'
    when 'internal' then 'suporte_manual'
    when 'email' then 'email_future'
    when 'chat' then 'chat_future'
    when 'api' then 'api_future'
    when 'phone' then 'suporte_manual'
    else 'system_future'
  end as origin_key,
  case q.source
    when 'portal' then 'Portal do cliente'
    when 'internal' then 'Suporte manual'
    when 'email' then 'Email futuro'
    when 'chat' then 'Chat futuro'
    when 'api' then 'API futura'
    when 'phone' then 'Telefone'
    else 'Sistema'
  end as origin_label,
  case q.source
    when 'portal' then 'customer_portal'
    when 'internal' then 'internal_support'
    when 'email' then 'email'
    when 'chat' then 'chat'
    when 'api' then 'api'
    when 'phone' then 'internal_support'
    else 'internal_support'
  end as channel_key,
  case q.source
    when 'portal' then 'Portal do cliente'
    when 'internal' then 'Suporte interno'
    when 'email' then 'Email'
    when 'chat' then 'Chat'
    when 'api' then 'API'
    when 'phone' then 'Telefone'
    else 'Suporte interno'
  end as channel_label,
  (
    q.can_add_message
    and q.status <> all(array['resolved', 'closed', 'cancelled']::public.ticket_status[])
    and q.source <> all(array['email', 'chat', 'api']::public.ticket_source[])
  ) as can_reply_now,
  case
    when q.source = any(array['email', 'chat', 'api']::public.ticket_source[]) then 'unavailable'
    else 'customer_message'
  end as reply_mode,
  case
    when q.can_add_message is not true then 'Resposta indisponivel para este ticket.'
    when q.status = any(array['resolved', 'closed', 'cancelled']::public.ticket_status[]) then 'Ticket encerrado nao aceita novas respostas.'
    when q.source = 'email'::public.ticket_source then 'Email ainda nao esta integrado para resposta direta.'
    when q.source = 'chat'::public.ticket_source then 'Chat ainda nao esta integrado para resposta direta.'
    when q.source = 'api'::public.ticket_source then 'API ainda nao esta integrado para resposta direta.'
    else null::text
  end as reason_if_unavailable,
  q.status,
  q.can_add_message
from public.vw_tickets_list as q
where app_private.can_access_support_workspace(q.tenant_id);

create or replace view public.vw_support_ticket_communication_capabilities
with (security_barrier = true)
as
select
  ticket_id,
  tenant_id,
  channel_key,
  channel_label,
  can_reply_now,
  reply_mode,
  reason_if_unavailable
from public.vw_support_ticket_channel_context;

create or replace view public.vw_support_tickets_queue
with (security_barrier = true)
as
  with support_visible as (
    select
      q.*
    from public.vw_tickets_list as q
    where app_private.can_access_support_workspace(q.tenant_id)
  ),
  sla_context as (
    select *
    from public.vw_support_ticket_sla_context
  )
  select
    q.id,
    q.tenant_id,
    t.slug as tenant_slug,
    t.display_name as tenant_display_name,
    t.legal_name as tenant_legal_name,
    q.requester_contact_id,
    requester.full_name as requester_contact_full_name,
    requester.email as requester_contact_email,
    q.title,
    q.source,
    q.status,
    q.priority,
    q.severity,
    q.created_by_user_id,
    q.created_by_full_name,
    q.assigned_to_user_id,
    q.assigned_to_full_name,
    q.created_at,
    q.updated_at,
    q.resolved_at,
    q.closed_at,
    q.last_message_at,
    q.customer_message_count,
    q.internal_message_count,
    q.can_view_internal,
    q.can_add_message,
    q.can_update_status,
    q.can_add_internal_note,
    q.can_assign,
    q.can_close,
    q.can_reopen,
    (q.assigned_to_user_id is null) as is_unassigned,
    (q.status = 'waiting_customer') as is_waiting_customer,
    (q.status = 'waiting_support') as is_waiting_support,
    (q.status = 'waiting_engineering') as is_waiting_engineering,
    tk.category_id,
    category.slug as category_slug,
    category.name as category_name,
    category.description as category_description,
    tk.current_operational_reason_id,
    reason.name as current_operational_reason_name,
    sla.sla_policy_id,
    sla.sla_policy_name,
    sla.first_response_due_at,
    sla.resolution_due_at,
    sla.sla_status,
    sla.sla_status_label,
    sla.is_sla_available,
    sla.sla_reference,
    sla.sla_policy_scope,
    sla.sla_business_calendar_name,
    sla.sla_business_calendar_timezone,
    channel.origin_key,
    channel.origin_label,
    channel.channel_key,
    channel.channel_label,
    channel.can_reply_now,
    channel.reply_mode,
    channel.reason_if_unavailable
  from support_visible as q
  join public.tickets as tk
    on tk.id = q.id
   and tk.tenant_id = q.tenant_id
  join public.tenants as t
    on t.id = q.tenant_id
  left join public.tenant_contacts as requester
    on requester.id = q.requester_contact_id
   and requester.tenant_id = q.tenant_id
  left join public.ticket_categories as category
    on category.id = tk.category_id
  left join public.ticket_operational_reasons as reason
    on reason.id = tk.current_operational_reason_id
  left join sla_context as sla
    on sla.ticket_id = q.id
  left join public.vw_support_ticket_channel_context as channel
    on channel.ticket_id = q.id
   and channel.tenant_id = q.tenant_id;

create or replace view public.vw_support_ticket_detail
with (security_barrier = true)
as
  with support_visible as (
    select
      d.*
    from public.vw_ticket_detail as d
    where app_private.can_access_support_workspace(d.tenant_id)
  ),
  sla_context as (
    select *
    from public.vw_support_ticket_sla_context
  )
  select
    d.id,
    d.tenant_id,
    t.slug as tenant_slug,
    t.display_name as tenant_display_name,
    t.legal_name as tenant_legal_name,
    t.status as tenant_status,
    d.requester_contact_id,
    d.requester_contact_full_name,
    d.requester_contact_email,
    d.title,
    d.description,
    d.source,
    d.status,
    d.priority,
    d.severity,
    d.close_reason,
    d.created_by_user_id,
    d.created_by_full_name,
    d.assigned_to_user_id,
    d.assigned_to_full_name,
    d.created_at,
    d.updated_at,
    d.resolved_at,
    d.closed_at,
    d.last_message_at,
    d.customer_message_count,
    d.internal_message_count,
    d.customer_attachment_count,
    d.internal_attachment_count,
    d.can_view_internal,
    d.can_add_message,
    d.can_update_status,
    d.can_add_internal_note,
    d.can_assign,
    d.can_close,
    d.can_reopen,
    tk.category_id,
    category.slug as category_slug,
    category.name as category_name,
    category.description as category_description,
    tk.initial_operational_reason_id,
    initial_reason.name as initial_operational_reason_name,
    tk.current_operational_reason_id,
    current_reason.name as current_operational_reason_name,
    sla.sla_policy_id,
    sla.sla_policy_name,
    sla.sla_business_calendar_key,
    sla.first_response_due_at,
    sla.resolution_due_at,
    sla.sla_status,
    sla.sla_status_label,
    sla.is_sla_available,
    sla.sla_reference,
    app_private.allowed_next_ticket_statuses(d.status) as allowed_next_statuses,
    sla.sla_policy_scope,
    sla.sla_business_calendar_name,
    sla.sla_business_calendar_timezone,
    channel.origin_key,
    channel.origin_label,
    channel.channel_key,
    channel.channel_label,
    channel.can_reply_now,
    channel.reply_mode,
    channel.reason_if_unavailable
  from support_visible as d
  join public.tickets as tk
    on tk.id = d.id
   and tk.tenant_id = d.tenant_id
  join public.tenants as t
    on t.id = d.tenant_id
  left join public.ticket_categories as category
    on category.id = tk.category_id
  left join public.ticket_operational_reasons as initial_reason
    on initial_reason.id = tk.initial_operational_reason_id
  left join public.ticket_operational_reasons as current_reason
    on current_reason.id = tk.current_operational_reason_id
  left join sla_context as sla
    on sla.ticket_id = d.id
  left join public.vw_support_ticket_channel_context as channel
    on channel.ticket_id = d.id
   and channel.tenant_id = d.tenant_id;

create or replace view public.vw_support_ticket_timeline
with (security_barrier = true)
as
  with support_visible as (
    select
      tl.*
    from public.vw_ticket_timeline as tl
    where app_private.can_access_support_workspace(tl.tenant_id)
  )
  select
    tl.ticket_id,
    tl.tenant_id,
    t.slug as tenant_slug,
    t.display_name as tenant_display_name,
    tl.timeline_entry_id,
    tl.entry_type,
    tl.visibility,
    tl.occurred_at,
    tl.actor_user_id,
    actor.full_name as actor_full_name,
    actor.email as actor_email,
    tl.message_id,
    tl.event_id,
    tl.event_type,
    tl.assignment_id,
    tl.body,
    tl.metadata,
    tl.communication_direction,
    tl.communication_channel,
    tl.communication_channel_label,
    tl.is_customer_visible
  from support_visible as tl
  join public.tenants as t
    on t.id = tl.tenant_id
  left join public.profiles as actor
    on actor.id = tl.actor_user_id;

create or replace view public.vw_support_ticket_timeline_recent
with (security_barrier = true)
as
  with support_visible as (
    select
      tl.*
    from public.vw_ticket_timeline as tl
    where app_private.can_access_support_workspace(tl.tenant_id)
  ),
  ranked as (
    select
      tl.*,
      row_number() over (
        partition by tl.ticket_id
        order by tl.occurred_at desc, tl.timeline_entry_id desc
      )::integer as recent_rank,
      count(*) over (
        partition by tl.ticket_id
      )::integer as total_available_count
    from support_visible as tl
  )
  select
    tl.ticket_id,
    tl.tenant_id,
    t.slug as tenant_slug,
    t.display_name as tenant_display_name,
    tl.timeline_entry_id,
    tl.entry_type,
    tl.visibility,
    tl.occurred_at,
    tl.actor_user_id,
    actor.full_name as actor_full_name,
    actor.email as actor_email,
    tl.message_id,
    tl.event_id,
    tl.event_type,
    tl.assignment_id,
    tl.body,
    tl.metadata,
    tl.recent_rank,
    tl.total_available_count,
    25::integer as recent_limit,
    (tl.total_available_count > 25) as has_more,
    tl.communication_direction,
    tl.communication_channel,
    tl.communication_channel_label,
    tl.is_customer_visible
  from ranked as tl
  join public.tenants as t
    on t.id = tl.tenant_id
  left join public.profiles as actor
    on actor.id = tl.actor_user_id
  where tl.recent_rank <= 25;

drop function if exists public.rpc_support_get_ticket_timeline(uuid, integer, timestamptz, uuid);

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
  has_more boolean,
  communication_direction text,
  communication_channel text,
  communication_channel_label text,
  is_customer_visible boolean
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
      tl.communication_direction,
      tl.communication_channel,
      tl.communication_channel_label,
      tl.is_customer_visible,
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
    ) as has_more,
    pd.communication_direction,
    pd.communication_channel,
    pd.communication_channel_label,
    pd.is_customer_visible
  from page_desc as pd
  order by pd.occurred_at asc, pd.timeline_entry_id asc;
end;
$$;

create or replace view public.vw_customer_portal_ticket_list
with (security_barrier = true)
as
select
  t.id as ticket_id,
  t.tenant_id,
  tenant.slug as tenant_slug,
  tenant.display_name as tenant_display_name,
  t.requester_contact_id,
  requester.full_name as requester_contact_full_name,
  t.title,
  app_private.customer_ticket_status_label(t.status) as customer_status_label,
  t.status as internal_status,
  t.created_at,
  t.updated_at,
  last_customer_message.last_message_at,
  coalesce(customer_messages.message_count, 0)::integer as customer_message_count,
  coalesce(customer_attachments.attachment_count, 0)::integer as customer_attachment_count,
  coalesce(public_links.article_count, 0)::integer as public_article_count,
  case
    when t.source = 'portal'::public.ticket_source then 'Enviado pelo portal'
    else 'Atendimento Genius'
  end as customer_origin_label
from public.tickets as t
join public.tenants as tenant
  on tenant.id = t.tenant_id
left join public.tenant_contacts as requester
  on requester.id = t.requester_contact_id
 and requester.tenant_id = t.tenant_id
left join lateral (
  select max(tm.created_at) as last_message_at
  from public.ticket_messages as tm
  where tm.ticket_id = t.id
    and tm.tenant_id = t.tenant_id
    and tm.visibility = 'customer'::public.message_visibility
) as last_customer_message on true
left join lateral (
  select count(*) as message_count
  from public.ticket_messages as tm
  where tm.ticket_id = t.id
    and tm.tenant_id = t.tenant_id
    and tm.visibility = 'customer'::public.message_visibility
) as customer_messages on true
left join lateral (
  select count(*) as attachment_count
  from public.ticket_attachments as ta
  where ta.ticket_id = t.id
    and ta.tenant_id = t.tenant_id
    and ta.visibility = 'customer'::public.message_visibility
    and ta.status = 'available'::public.ticket_attachment_status
    and ta.archived_at is null
) as customer_attachments on true
left join lateral (
  select count(*) as article_count
  from public.ticket_knowledge_links as tkl
  join public.knowledge_articles as ka
    on ka.id = tkl.article_id
  where tkl.ticket_id = t.id
    and tkl.tenant_id = t.tenant_id
    and tkl.archived_at is null
    and tkl.link_type = 'sent_to_customer'::public.ticket_knowledge_link_type
    and ka.visibility = 'public'::public.knowledge_visibility
    and ka.status = 'published'::public.knowledge_article_status
    and ka.published_at is not null
) as public_links on true
where app_private.can_access_customer_ticket(t.id, t.tenant_id);

create or replace view public.vw_customer_portal_ticket_detail
with (security_barrier = true)
as
select
  t.id as ticket_id,
  t.tenant_id,
  tenant.slug as tenant_slug,
  tenant.display_name as tenant_display_name,
  t.requester_contact_id,
  requester.full_name as requester_contact_full_name,
  t.title,
  t.description,
  app_private.customer_ticket_status_label(t.status) as customer_status_label,
  t.status as internal_status,
  t.created_at,
  t.updated_at,
  t.resolved_at,
  t.closed_at,
  (t.status <> all(array['resolved', 'closed', 'cancelled']::public.ticket_status[])) as can_add_message,
  true as can_view_attachments,
  true as can_view_public_articles,
  case
    when t.source = 'portal'::public.ticket_source then 'Enviado pelo portal'
    else 'Atendimento Genius'
  end as customer_origin_label
from public.tickets as t
join public.tenants as tenant
  on tenant.id = t.tenant_id
left join public.tenant_contacts as requester
  on requester.id = t.requester_contact_id
 and requester.tenant_id = t.tenant_id
where app_private.can_access_customer_ticket(t.id, t.tenant_id);

create or replace view public.vw_customer_portal_ticket_timeline
with (security_barrier = true)
as
select
  tm.ticket_id,
  tm.tenant_id,
  tm.id as timeline_entry_id,
  'message'::text as entry_type,
  tm.created_at as occurred_at,
  app_private.customer_portal_actor_label(tm.tenant_id, tm.created_by_user_id) as actor_label,
  null::public.ticket_event_type as event_type,
  null::text as event_label,
  tm.body,
  '{}'::jsonb as metadata,
  case
    when nullif(tm.metadata ->> 'communication_direction', '') = 'inbound' then 'Enviado pelo portal'
    else 'Resposta do suporte'
  end as customer_entry_label
from public.ticket_messages as tm
where tm.visibility = 'customer'::public.message_visibility
  and app_private.can_access_customer_ticket(tm.ticket_id, tm.tenant_id)

union all

select
  te.ticket_id,
  te.tenant_id,
  te.id as timeline_entry_id,
  'event'::text as entry_type,
  te.occurred_at,
  app_private.customer_portal_actor_label(te.tenant_id, te.actor_user_id) as actor_label,
  te.event_type,
  app_private.customer_ticket_event_label(te.event_type) as event_label,
  null::text as body,
  '{}'::jsonb as metadata,
  case
    when te.event_type = 'ticket_created'::public.ticket_event_type then 'Ticket criado'
    else 'Atualizacao do ticket'
  end as customer_entry_label
from public.ticket_events as te
where te.visibility = 'customer'::public.message_visibility
  and te.event_type = any(
    array[
      'ticket_created',
      'message_added',
      'attachment_added',
      'status_changed',
      'resolved',
      'closed',
      'reopened',
      'cancelled'
    ]::public.ticket_event_type[]
  )
  and app_private.can_access_customer_ticket(te.ticket_id, te.tenant_id);

create or replace function public.rpc_create_ticket(
  p_tenant_id uuid,
  p_title text,
  p_description text,
  p_source public.ticket_source,
  p_priority public.ticket_priority default 'normal',
  p_severity public.ticket_severity default 'medium',
  p_requester_contact_id uuid default null,
  p_category_id uuid default null,
  p_operational_reason_id uuid default null
)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_ticket public.tickets;
  v_requester_contact_id uuid;
  v_category public.ticket_categories;
  v_reason public.ticket_operational_reasons;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.can_create_ticket(p_tenant_id) then
    raise exception 'rpc_create_ticket denied';
  end if;

  if p_requester_contact_id is not null then
    if not exists (
      select 1
      from public.tenant_contacts as tc
      where tc.id = p_requester_contact_id
        and tc.tenant_id = p_tenant_id
        and tc.is_active
    ) then
      raise exception 'requester contact not found for tenant';
    end if;

    v_requester_contact_id := p_requester_contact_id;
  else
    select tc.id
    into v_requester_contact_id
    from public.tenant_contacts as tc
    where tc.tenant_id = p_tenant_id
      and tc.linked_user_id = v_actor_user_id
      and tc.is_active
    order by tc.is_primary desc, tc.created_at asc
    limit 1;
  end if;

  if p_category_id is not null then
    select *
    into v_category
    from public.ticket_categories as c
    where c.id = p_category_id
      and c.status = 'active'::public.ticket_reference_status;

    if v_category.id is null then
      raise exception 'ticket category is not active';
    end if;
  end if;

  if p_operational_reason_id is not null then
    select *
    into v_reason
    from public.ticket_operational_reasons as r
    where r.id = p_operational_reason_id
      and r.reason_type = 'classification_update'::public.ticket_operational_reason_type
      and r.status = 'active'::public.ticket_reference_status;

    if v_reason.id is null then
      raise exception 'ticket operational reason is not valid for intake';
    end if;
  end if;

  insert into public.tickets (
    tenant_id,
    requester_contact_id,
    title,
    description,
    source,
    priority,
    severity,
    category_id,
    initial_operational_reason_id,
    current_operational_reason_id,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_tenant_id,
    v_requester_contact_id,
    btrim(p_title),
    btrim(p_description),
    p_source,
    p_priority,
    p_severity,
    p_category_id,
    p_operational_reason_id,
    p_operational_reason_id,
    v_actor_user_id,
    v_actor_user_id
  )
  returning *
  into v_ticket;

  v_ticket := app_private.apply_ticket_sla(v_ticket, v_actor_user_id);

  perform app_private.create_ticket_event(
    v_ticket.id,
    v_ticket.tenant_id,
    'ticket_created',
    'customer',
    v_actor_user_id,
    jsonb_build_object(
      'source', v_ticket.source,
      'origin_key', app_private.ticket_origin_key(v_ticket.source),
      'origin_label', app_private.ticket_origin_label(v_ticket.source),
      'communication_direction', 'system',
      'communication_channel', app_private.ticket_channel_key(v_ticket.source),
      'communication_channel_label', app_private.ticket_channel_label(v_ticket.source),
      'priority', v_ticket.priority,
      'severity', v_ticket.severity,
      'requester_contact_id', v_ticket.requester_contact_id,
      'category_id', v_ticket.category_id,
      'operational_reason_id', v_ticket.initial_operational_reason_id,
      'sla_policy_id', v_ticket.sla_policy_id,
      'first_response_due_at', v_ticket.first_response_due_at,
      'resolution_due_at', v_ticket.resolution_due_at
    )
  );

  return v_ticket;
end;
$$;

create or replace function public.rpc_add_ticket_message(
  p_ticket_id uuid,
  p_body text
)
returns public.ticket_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_ticket public.tickets;
  v_message public.ticket_messages;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_ticket
  from public.tickets as t
  where t.id = p_ticket_id;

  if v_ticket.id is null then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_create_ticket(v_ticket.tenant_id) then
    raise exception 'rpc_add_ticket_message denied';
  end if;

  if v_ticket.status = any(array['closed', 'cancelled']::public.ticket_status[]) then
    raise exception 'ticket is not open for public messages';
  end if;

  insert into public.ticket_messages (
    tenant_id,
    ticket_id,
    visibility,
    body,
    created_by_user_id,
    metadata
  )
  values (
    v_ticket.tenant_id,
    v_ticket.id,
    'customer',
    btrim(p_body),
    v_actor_user_id,
    jsonb_build_object(
      'visibility', 'customer',
      'communication_direction', 'outbound',
      'communication_channel', app_private.ticket_channel_key(v_ticket.source),
      'communication_channel_label', app_private.ticket_channel_label(v_ticket.source)
    )
  )
  returning *
  into v_message;

  perform app_private.create_ticket_event(
    v_ticket.id,
    v_ticket.tenant_id,
    'message_added',
    'customer',
    v_actor_user_id,
    jsonb_build_object(
      'visibility', v_message.visibility,
      'communication_direction', 'outbound',
      'communication_channel', app_private.ticket_channel_key(v_ticket.source),
      'communication_channel_label', app_private.ticket_channel_label(v_ticket.source)
    ),
    v_message.id
  );

  return v_message;
end;
$$;

create or replace function public.rpc_add_internal_ticket_note(
  p_ticket_id uuid,
  p_body text
)
returns public.ticket_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_ticket public.tickets;
  v_message public.ticket_messages;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_ticket
  from public.tickets as t
  where t.id = p_ticket_id;

  if v_ticket.id is null then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_manage_ticket(v_ticket.tenant_id) then
    raise exception 'rpc_add_internal_ticket_note denied';
  end if;

  insert into public.ticket_messages (
    tenant_id,
    ticket_id,
    visibility,
    body,
    created_by_user_id,
    metadata
  )
  values (
    v_ticket.tenant_id,
    v_ticket.id,
    'internal',
    btrim(p_body),
    v_actor_user_id,
    jsonb_build_object(
      'visibility', 'internal',
      'communication_direction', 'internal',
      'communication_channel', 'internal_support',
      'communication_channel_label', 'Suporte interno'
    )
  )
  returning *
  into v_message;

  perform app_private.create_ticket_event(
    v_ticket.id,
    v_ticket.tenant_id,
    'internal_note_added',
    'internal',
    v_actor_user_id,
    jsonb_build_object(
      'visibility', v_message.visibility,
      'communication_direction', 'internal',
      'communication_channel', 'internal_support',
      'communication_channel_label', 'Suporte interno'
    ),
    v_message.id
  );

  return v_message;
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
      'origin_key', 'customer_portal',
      'origin_label', 'Portal do cliente',
      'communication_direction', 'inbound',
      'communication_channel', 'customer_portal',
      'communication_channel_label', 'Portal Cliente',
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

create or replace function public.rpc_customer_add_ticket_message(
  p_ticket_id uuid,
  p_body text
)
returns table (
  message_id uuid,
  ticket_id uuid,
  tenant_id uuid,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_actor_user_id uuid;
  v_ticket public.tickets;
  v_message public.ticket_messages;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_ticket
  from public.tickets as t
  where t.id = p_ticket_id
  for update;

  if v_ticket.id is null then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_access_customer_ticket(v_ticket.id, v_ticket.tenant_id) then
    raise exception 'rpc_customer_add_ticket_message denied';
  end if;

  if v_ticket.status = any(array['resolved', 'closed', 'cancelled']::public.ticket_status[]) then
    raise exception 'ticket is not open for customer messages';
  end if;

  if nullif(btrim(p_body), '') is null then
    raise exception 'ticket message body is required';
  end if;

  if char_length(btrim(p_body)) > 4000 then
    raise exception 'ticket message body is too long';
  end if;

  insert into public.ticket_messages (
    tenant_id,
    ticket_id,
    visibility,
    body,
    created_by_user_id,
    metadata
  )
  values (
    v_ticket.tenant_id,
    v_ticket.id,
    'customer'::public.message_visibility,
    btrim(p_body),
    v_actor_user_id,
    jsonb_build_object(
      'visibility', 'customer',
      'communication_direction', 'inbound',
      'communication_channel', 'customer_portal',
      'communication_channel_label', 'Portal Cliente'
    )
  )
  returning *
  into v_message;

  perform app_private.create_ticket_event(
    v_ticket.id,
    v_ticket.tenant_id,
    'message_added'::public.ticket_event_type,
    'customer'::public.message_visibility,
    v_actor_user_id,
    jsonb_build_object(
      'visibility', 'customer',
      'source', 'customer_portal',
      'communication_direction', 'inbound',
      'communication_channel', 'customer_portal',
      'communication_channel_label', 'Portal Cliente'
    ),
    v_message.id
  );

  if v_ticket.status = 'waiting_customer'::public.ticket_status then
    perform app_private.transition_ticket_status(
      v_ticket.id,
      v_actor_user_id,
      'waiting_support'::public.ticket_status,
      'status_changed'::public.ticket_event_type,
      jsonb_build_object(
        'source', 'customer_portal',
        'communication_direction', 'inbound',
        'communication_channel', 'customer_portal',
        'communication_channel_label', 'Portal Cliente',
        'reason', 'customer_replied'
      )
    );
  end if;

  message_id := v_message.id;
  ticket_id := v_message.ticket_id;
  tenant_id := v_message.tenant_id;
  body := v_message.body;
  created_at := v_message.created_at;

  return next;
end;
$$;

revoke all on public.vw_admin_ticket_channel_definitions from public, anon, authenticated, service_role;
revoke all on public.vw_support_ticket_channel_context from public, anon, authenticated, service_role;
revoke all on public.vw_support_ticket_communication_capabilities from public, anon, authenticated, service_role;
revoke all on public.vw_support_tickets_queue from public, anon, authenticated, service_role;
revoke all on public.vw_support_ticket_detail from public, anon, authenticated, service_role;
revoke all on public.vw_support_ticket_timeline from public, anon, authenticated, service_role;
revoke all on public.vw_support_ticket_timeline_recent from public, anon, authenticated, service_role;
revoke all on public.vw_customer_portal_ticket_list from public, anon, authenticated, service_role;
revoke all on public.vw_customer_portal_ticket_detail from public, anon, authenticated, service_role;
revoke all on public.vw_customer_portal_ticket_timeline from public, anon, authenticated, service_role;

grant select on public.vw_admin_ticket_channel_definitions to authenticated, service_role;
grant select on public.vw_support_ticket_channel_context to authenticated, service_role;
grant select on public.vw_support_ticket_communication_capabilities to authenticated, service_role;
grant select on public.vw_support_tickets_queue to authenticated, service_role;
grant select on public.vw_support_ticket_detail to authenticated, service_role;
grant select on public.vw_support_ticket_timeline to authenticated, service_role;
grant select on public.vw_support_ticket_timeline_recent to authenticated, service_role;
grant select on public.vw_customer_portal_ticket_list to authenticated, service_role;
grant select on public.vw_customer_portal_ticket_detail to authenticated, service_role;
grant select on public.vw_customer_portal_ticket_timeline to authenticated, service_role;

revoke all on function public.rpc_support_get_ticket_timeline(uuid, integer, timestamptz, uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_create_ticket(uuid, text, text, public.ticket_source, public.ticket_priority, public.ticket_severity, uuid, uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_add_ticket_message(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_add_internal_ticket_note(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_customer_create_ticket(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_customer_add_ticket_message(uuid, text) from public, anon, authenticated, service_role;

grant execute on function public.rpc_support_get_ticket_timeline(uuid, integer, timestamptz, uuid) to authenticated, service_role;
grant execute on function public.rpc_create_ticket(uuid, text, text, public.ticket_source, public.ticket_priority, public.ticket_severity, uuid, uuid, uuid) to authenticated;
grant execute on function public.rpc_add_ticket_message(uuid, text) to authenticated;
grant execute on function public.rpc_add_internal_ticket_note(uuid, text) to authenticated;
grant execute on function public.rpc_customer_create_ticket(uuid, text, text) to authenticated, service_role;
grant execute on function public.rpc_customer_add_ticket_message(uuid, text) to authenticated, service_role;

comment on view public.vw_support_ticket_channel_context is
  'Contexto normalizado de origem/canal de tickets para o Support Workspace, sem habilitar canais externos futuros.';
comment on view public.vw_support_ticket_communication_capabilities is
  'Capacidades de comunicacao por ticket calculadas pelo backend para evitar botoes de envio externo falso.';
comment on view public.vw_admin_ticket_channel_definitions is
  'Catalogo read-only de origens/canais de ticket, separando canais operacionais atuais de preparacao futura.';
