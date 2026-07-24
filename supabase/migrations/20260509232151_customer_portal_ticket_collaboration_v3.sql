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
  true as can_view_public_articles
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
  '{}'::jsonb as metadata
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
  '{}'::jsonb as metadata
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

create or replace view public.vw_customer_portal_ticket_collaboration_state
with (security_barrier = true)
as
select
  t.id as ticket_id,
  t.tenant_id,
  t.status as internal_status,
  app_private.customer_ticket_status_label(t.status) as customer_status_label,
  (t.status <> all(array['resolved', 'closed', 'cancelled']::public.ticket_status[])) as can_reply,
  latest.timeline_entry_id is not null as can_acknowledge,
  (t.status = 'resolved'::public.ticket_status) as can_confirm_resolution,
  (t.status = any(array['resolved', 'closed']::public.ticket_status[])) as can_request_reopen,
  latest.timeline_entry_id as latest_timeline_entry_id,
  latest.occurred_at as latest_timeline_entry_at,
  ack.acknowledged_at as last_acknowledged_at,
  ack.last_timeline_entry_id as last_acknowledged_timeline_entry_id,
  coalesce(unread.unread_count, 0)::integer as unread_count,
  (coalesce(unread.unread_count, 0) > 0) as has_new_updates,
  last_customer_message.last_message_at as last_customer_message_at,
  last_support_response.last_message_at as last_support_response_at
from public.tickets as t
left join lateral (
  select cta.*
  from public.customer_ticket_update_acknowledgements as cta
  where cta.ticket_id = t.id
    and cta.tenant_id = t.tenant_id
    and cta.acknowledged_by_user_id = auth.uid()
  order by cta.acknowledged_at desc
  limit 1
) as ack on true
left join lateral (
  select vt.timeline_entry_id, vt.occurred_at
  from public.vw_customer_portal_ticket_timeline as vt
  where vt.ticket_id = t.id
    and vt.tenant_id = t.tenant_id
  order by vt.occurred_at desc, vt.timeline_entry_id desc
  limit 1
) as latest on true
left join lateral (
  select count(*) as unread_count
  from public.vw_customer_portal_ticket_timeline as vt
  where vt.ticket_id = t.id
    and vt.tenant_id = t.tenant_id
    and (
      ack.acknowledged_at is null
      or vt.occurred_at > ack.acknowledged_at
    )
) as unread on true
left join lateral (
  select max(tm.created_at) as last_message_at
  from public.ticket_messages as tm
  where tm.ticket_id = t.id
    and tm.tenant_id = t.tenant_id
    and tm.visibility = 'customer'::public.message_visibility
    and exists (
      select 1
      from public.tenant_contacts as tc
      where tc.tenant_id = tm.tenant_id
        and tc.linked_user_id = tm.created_by_user_id
        and tc.is_active
    )
) as last_customer_message on true
left join lateral (
  select max(tm.created_at) as last_message_at
  from public.ticket_messages as tm
  where tm.ticket_id = t.id
    and tm.tenant_id = t.tenant_id
    and tm.visibility = 'customer'::public.message_visibility
    and not exists (
      select 1
      from public.tenant_contacts as tc
      where tc.tenant_id = tm.tenant_id
        and tc.linked_user_id = tm.created_by_user_id
        and tc.is_active
    )
) as last_support_response on true
where app_private.can_access_customer_ticket(t.id, t.tenant_id);

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
    created_by_user_id
  )
  values (
    v_ticket.tenant_id,
    v_ticket.id,
    'customer'::public.message_visibility,
    btrim(p_body),
    v_actor_user_id
  )
  returning *
  into v_message;

  perform app_private.create_ticket_event(
    v_ticket.id,
    v_ticket.tenant_id,
    'message_added'::public.ticket_event_type,
    'customer'::public.message_visibility,
    v_actor_user_id,
    jsonb_build_object('visibility', 'customer', 'source', 'customer_portal'),
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

create or replace function public.rpc_customer_acknowledge_ticket_update(
  p_ticket_id uuid,
  p_last_timeline_entry_id uuid default null
)
returns table (
  ticket_id uuid,
  tenant_id uuid,
  acknowledged_at timestamptz,
  last_timeline_entry_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_actor_user_id uuid;
  v_ticket public.tickets;
  v_ack public.customer_ticket_update_acknowledgements;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_ticket
  from public.tickets as t
  where t.id = p_ticket_id;

  if v_ticket.id is null then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_access_customer_ticket(v_ticket.id, v_ticket.tenant_id) then
    raise exception 'rpc_customer_acknowledge_ticket_update denied';
  end if;

  if p_last_timeline_entry_id is not null
     and not exists (
       select 1
       from public.vw_customer_portal_ticket_timeline as vt
       where vt.ticket_id = v_ticket.id
         and vt.tenant_id = v_ticket.tenant_id
         and vt.timeline_entry_id = p_last_timeline_entry_id
     ) then
    raise exception 'timeline entry is not available for acknowledgement';
  end if;

  insert into public.customer_ticket_update_acknowledgements (
    tenant_id,
    ticket_id,
    acknowledged_by_user_id,
    last_timeline_entry_id,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    v_ticket.tenant_id,
    v_ticket.id,
    v_actor_user_id,
    p_last_timeline_entry_id,
    v_actor_user_id,
    v_actor_user_id
  )
  on conflict (tenant_id, ticket_id, acknowledged_by_user_id)
  do update
  set
    last_timeline_entry_id = excluded.last_timeline_entry_id,
    acknowledged_at = timezone('utc', now()),
    updated_by_user_id = excluded.updated_by_user_id
  returning *
  into v_ack;

  ticket_id := v_ack.ticket_id;
  tenant_id := v_ack.tenant_id;
  acknowledged_at := v_ack.acknowledged_at;
  last_timeline_entry_id := v_ack.last_timeline_entry_id;

  return next;
end;
$$;

create or replace function public.rpc_customer_confirm_ticket_resolved(
  p_ticket_id uuid
)
returns table (
  ticket_id uuid,
  tenant_id uuid,
  customer_status_label text,
  status public.ticket_status,
  closed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_actor_user_id uuid;
  v_existing public.tickets;
  v_ticket public.tickets;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_existing
  from public.tickets as t
  where t.id = p_ticket_id;

  if v_existing.id is null then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_access_customer_ticket(v_existing.id, v_existing.tenant_id) then
    raise exception 'rpc_customer_confirm_ticket_resolved denied';
  end if;

  if v_existing.status <> 'resolved'::public.ticket_status then
    raise exception 'ticket is not resolved';
  end if;

  v_ticket := app_private.transition_ticket_status(
    v_existing.id,
    v_actor_user_id,
    'closed'::public.ticket_status,
    'closed'::public.ticket_event_type,
    jsonb_build_object(
      'source', 'customer_portal',
      'reason', 'customer_confirmed_resolution'
    ),
    'Resolucao confirmada pelo cliente no portal.'
  );

  ticket_id := v_ticket.id;
  tenant_id := v_ticket.tenant_id;
  customer_status_label := app_private.customer_ticket_status_label(v_ticket.status);
  status := v_ticket.status;
  closed_at := v_ticket.closed_at;

  return next;
end;
$$;

create or replace function public.rpc_customer_request_ticket_reopen(
  p_ticket_id uuid,
  p_reason text
)
returns table (
  ticket_id uuid,
  tenant_id uuid,
  customer_status_label text,
  status public.ticket_status,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_actor_user_id uuid;
  v_existing public.tickets;
  v_ticket public.tickets;
  v_reason text;
begin
  v_actor_user_id := app_private.require_active_actor();
  v_reason := btrim(coalesce(p_reason, ''));

  select *
  into v_existing
  from public.tickets as t
  where t.id = p_ticket_id;

  if v_existing.id is null then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_access_customer_ticket(v_existing.id, v_existing.tenant_id) then
    raise exception 'rpc_customer_request_ticket_reopen denied';
  end if;

  if v_existing.status not in ('resolved', 'closed') then
    raise exception 'ticket is not reopenable';
  end if;

  if nullif(v_reason, '') is null then
    raise exception 'reopen reason is required';
  end if;

  if char_length(v_reason) > 1200 then
    raise exception 'reopen reason is too long';
  end if;

  v_ticket := app_private.transition_ticket_status(
    v_existing.id,
    v_actor_user_id,
    'waiting_support'::public.ticket_status,
    'reopened'::public.ticket_event_type,
    jsonb_build_object(
      'source', 'customer_portal',
      'reopen_reason', v_reason
    )
  );

  ticket_id := v_ticket.id;
  tenant_id := v_ticket.tenant_id;
  customer_status_label := app_private.customer_ticket_status_label(v_ticket.status);
  status := v_ticket.status;
  updated_at := v_ticket.updated_at;

  return next;
end;
$$;

revoke all on public.vw_customer_portal_ticket_collaboration_state from public, anon, authenticated, service_role;
grant select on public.vw_customer_portal_ticket_collaboration_state to authenticated, service_role;

revoke all on function public.rpc_customer_confirm_ticket_resolved(uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_customer_request_ticket_reopen(uuid, text) from public, anon, authenticated, service_role;

grant execute on function public.rpc_customer_confirm_ticket_resolved(uuid) to authenticated, service_role;
grant execute on function public.rpc_customer_request_ticket_reopen(uuid, text) to authenticated, service_role;

comment on view public.vw_customer_portal_ticket_collaboration_state is
  'Estado de colaboracao customer-facing do ticket: leitura/ack, novas atualizacoes e acoes permitidas sem expor operacao interna.';

comment on function public.rpc_customer_confirm_ticket_resolved(uuid) is
  'Cliente confirma resolucao de ticket ja resolvido; backend fecha o ticket com audit trail e evento customer-facing.';

comment on function public.rpc_customer_request_ticket_reopen(uuid, text) is
  'Cliente solicita reabertura de ticket resolvido ou encerrado; backend move para suporte com motivo obrigatorio.';
