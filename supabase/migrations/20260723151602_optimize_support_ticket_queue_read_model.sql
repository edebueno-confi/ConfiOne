create or replace view public.vw_support_tickets_queue with (security_barrier = true) as
with support_visible as materialized (
  select
    q.id,
    q.tenant_id,
    q.requester_contact_id,
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
    q.can_reopen
  from public.vw_tickets_list as q
  where app_private.can_access_support_workspace(q.tenant_id)
),
sla_context as (
  select
    q.id as ticket_id,
    q.tenant_id,
    t.sla_policy_id,
    p.name as sla_policy_name,
    t.first_response_due_at,
    t.resolution_due_at,
    app_private.ticket_sla_status(t.status, t.resolution_due_at) as sla_status,
    app_private.ticket_sla_status_label(
      app_private.ticket_sla_status(t.status, t.resolution_due_at)
    ) as sla_status_label,
    t.sla_policy_id is not null as is_sla_available,
    case
      when p.id is null then 'Sem politica definida para esta combinacao operacional.'::text
      when p.tenant_id is null then 'Governanca interna por fallback global controlado; nao e promessa publica automatica.'::text
      else 'Governanca interna especifica do tenant; nao e promessa publica automatica.'::text
    end as sla_reference,
    case
      when p.id is null then 'none'::text
      when p.tenant_id is null then 'global_fallback'::text
      else 'tenant'::text
    end as sla_policy_scope,
    bc.name as sla_business_calendar_name,
    bc.timezone as sla_business_calendar_timezone
  from support_visible as q
  join public.tickets as t
    on t.id = q.id
   and t.tenant_id = q.tenant_id
  left join public.ticket_sla_policies as p
    on p.id = t.sla_policy_id
  left join public.business_calendars as bc
    on bc.id = p.business_calendar_id
),
channel_context as (
  select
    q.id as ticket_id,
    q.tenant_id,
    case q.source
      when 'portal'::public.ticket_source then 'customer_portal'::text
      when 'internal'::public.ticket_source then 'suporte_manual'::text
      when 'email'::public.ticket_source then 'email_future'::text
      when 'chat'::public.ticket_source then 'chat_future'::text
      when 'api'::public.ticket_source then 'api_future'::text
      when 'phone'::public.ticket_source then 'suporte_manual'::text
      else 'system_future'::text
    end as origin_key,
    case q.source
      when 'portal'::public.ticket_source then 'Portal do cliente'::text
      when 'internal'::public.ticket_source then 'Suporte manual'::text
      when 'email'::public.ticket_source then 'Email futuro'::text
      when 'chat'::public.ticket_source then 'Chat futuro'::text
      when 'api'::public.ticket_source then 'API futura'::text
      when 'phone'::public.ticket_source then 'Telefone'::text
      else 'Sistema'::text
    end as origin_label,
    case q.source
      when 'portal'::public.ticket_source then 'customer_portal'::text
      when 'internal'::public.ticket_source then 'internal_support'::text
      when 'email'::public.ticket_source then 'email'::text
      when 'chat'::public.ticket_source then 'chat'::text
      when 'api'::public.ticket_source then 'api'::text
      when 'phone'::public.ticket_source then 'internal_support'::text
      else 'internal_support'::text
    end as channel_key,
    case q.source
      when 'portal'::public.ticket_source then 'Portal do cliente'::text
      when 'internal'::public.ticket_source then 'Suporte interno'::text
      when 'email'::public.ticket_source then 'Email'::text
      when 'chat'::public.ticket_source then 'Chat'::text
      when 'api'::public.ticket_source then 'API'::text
      when 'phone'::public.ticket_source then 'Telefone'::text
      else 'Suporte interno'::text
    end as channel_label,
    q.can_add_message
      and q.status <> all (array[
        'resolved'::public.ticket_status,
        'closed'::public.ticket_status,
        'cancelled'::public.ticket_status
      ])
      and coalesce(
        readiness.can_send,
        channel_map.delivery_channel = 'customer_portal'::public.ticket_delivery_channel
      ) as can_reply_now,
    case
      when q.can_add_message
        and q.status <> all (array[
          'resolved'::public.ticket_status,
          'closed'::public.ticket_status,
          'cancelled'::public.ticket_status
        ])
        and coalesce(
          readiness.can_send,
          channel_map.delivery_channel = 'customer_portal'::public.ticket_delivery_channel
        )
        and q.source = 'portal'::public.ticket_source
        then 'customer_portal_public_reply'::text
      when q.can_add_message
        and q.status <> all (array[
          'resolved'::public.ticket_status,
          'closed'::public.ticket_status,
          'cancelled'::public.ticket_status
        ])
        and coalesce(
          readiness.can_send,
          channel_map.delivery_channel = 'customer_portal'::public.ticket_delivery_channel
        )
        then 'support_public_message'::text
      else 'unavailable'::text
    end as reply_mode,
    case
      when q.can_add_message is not true then 'Resposta indisponivel para este ticket.'::text
      when q.status = any (array[
        'resolved'::public.ticket_status,
        'closed'::public.ticket_status,
        'cancelled'::public.ticket_status
      ]) then 'Ticket encerrado nao aceita novas respostas.'::text
      when coalesce(
        readiness.can_send,
        channel_map.delivery_channel = 'customer_portal'::public.ticket_delivery_channel
      ) is not true then coalesce(readiness.reason_if_unavailable, definition.unavailable_reason)
      else null::text
    end as reason_if_unavailable
  from support_visible as q
  cross join lateral (
    select case q.source
      when 'portal'::public.ticket_source then 'customer_portal'::public.ticket_delivery_channel
      when 'email'::public.ticket_source then 'email_future'::public.ticket_delivery_channel
      when 'chat'::public.ticket_source then 'chat_future'::public.ticket_delivery_channel
      when 'api'::public.ticket_source then 'api_future'::public.ticket_delivery_channel
      else 'customer_portal'::public.ticket_delivery_channel
    end as delivery_channel
  ) as channel_map
  join public.communication_channel_definitions as definition
    on definition.channel_key = channel_map.delivery_channel
  left join public.tenant_communication_channel_settings as readiness
    on readiness.tenant_id = q.tenant_id
   and readiness.channel_key = channel_map.delivery_channel
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
  q.assigned_to_user_id is null as is_unassigned,
  q.status = 'waiting_customer'::public.ticket_status as is_waiting_customer,
  q.status = 'waiting_support'::public.ticket_status as is_waiting_support,
  q.status = 'waiting_engineering'::public.ticket_status as is_waiting_engineering,
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
  channel.reason_if_unavailable,
  tk.conversation_type_key,
  ctype.label as conversation_type_label
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
 and sla.tenant_id = q.tenant_id
left join channel_context as channel
  on channel.ticket_id = q.id
 and channel.tenant_id = q.tenant_id
left join public.conversation_types as ctype
  on ctype.key = tk.conversation_type_key;
