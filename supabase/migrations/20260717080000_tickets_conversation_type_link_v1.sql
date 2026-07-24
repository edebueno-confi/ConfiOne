-- Ciclo 9: liga o parametro "Tipos de conversa" (Configuracoes) ao ticket.
-- Aditivo e nao destrutivo: coluna nova opcional em tickets, RPC de suporte com
-- validacao + evento auditavel, e a view da fila passa a expor a chave e o rotulo.

-- 1) Coluna aditiva no ticket (opcional; tipos sao arquivados, nunca apagados)
alter table public.tickets
  add column if not exists conversation_type_key text
  references public.conversation_types (key);

create index if not exists tickets_conversation_type_idx
  on public.tickets (conversation_type_key)
  where conversation_type_key is not null;

comment on column public.tickets.conversation_type_key is
  'Tipo de conversa parametrizado em Configuracoes (public.conversation_types.key). Opcional.';

-- 2) RPC de suporte para classificar a conversa (mesmo padrao das demais RPCs de ticket)
create or replace function public.rpc_support_set_ticket_conversation_type(
  p_ticket_id uuid,
  p_conversation_type_key text default null
)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.tickets;
  v_ticket public.tickets;
  v_type public.conversation_types;
  v_key text;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_existing
  from public.tickets as t
  where t.id = p_ticket_id
  for update;

  if v_existing.id is null then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_manage_ticket(v_existing.tenant_id) then
    raise exception 'rpc_support_set_ticket_conversation_type denied';
  end if;

  v_key := nullif(lower(btrim(coalesce(p_conversation_type_key, ''))), '');

  if v_key is not null then
    select *
    into v_type
    from public.conversation_types as ct
    where ct.key = v_key
      and ct.is_active = true;

    if v_type.id is null then
      raise exception 'conversation type is not active';
    end if;
  end if;

  update public.tickets
  set
    conversation_type_key = v_key,
    updated_by_user_id = v_actor_user_id
  where id = p_ticket_id
  returning *
  into v_ticket;

  perform app_private.create_ticket_event(
    v_ticket.id,
    v_ticket.tenant_id,
    'classification_changed'::public.ticket_event_type,
    'internal',
    v_actor_user_id,
    jsonb_build_object(
      'field', 'conversation_type_key',
      'previous_conversation_type_key', v_existing.conversation_type_key,
      'conversation_type_key', v_ticket.conversation_type_key
    )
  );

  return v_ticket;
end;
$$;

grant execute on function public.rpc_support_set_ticket_conversation_type(uuid, text) to authenticated;

comment on function public.rpc_support_set_ticket_conversation_type(uuid, text) is
  'Define (ou limpa, com null) o tipo de conversa do ticket usando o parametro de Configuracoes. Requer can_manage_ticket.';

-- 3) Fila do suporte passa a expor o tipo de conversa (colunas novas ao final da view)
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
  left join public.vw_support_ticket_channel_context as channel
    on channel.ticket_id = q.id
   and channel.tenant_id = q.tenant_id
  left join public.conversation_types as ctype
    on ctype.key = tk.conversation_type_key;
