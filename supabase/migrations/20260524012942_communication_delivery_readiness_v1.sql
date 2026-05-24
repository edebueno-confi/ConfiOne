create type public.ticket_delivery_channel as enum (
  'customer_portal',
  'email_future',
  'whatsapp_future',
  'chat_future',
  'api_future'
);

create type public.ticket_delivery_status as enum (
  'not_required',
  'pending',
  'delivered',
  'blocked',
  'failed',
  'cancelled'
);

create type public.ticket_delivery_direction as enum (
  'inbound',
  'outbound',
  'internal',
  'system'
);

create type public.ticket_delivery_provider_state as enum (
  'native',
  'not_configured',
  'disabled',
  'future'
);

create table public.ticket_message_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  ticket_id uuid not null,
  message_id uuid not null,
  channel public.ticket_delivery_channel not null,
  direction public.ticket_delivery_direction not null,
  status public.ticket_delivery_status not null,
  provider_state public.ticket_delivery_provider_state not null,
  recipient_contact_id uuid null,
  recipient_user_id uuid null references public.profiles (id),
  reason_if_blocked text null,
  delivered_at timestamptz null,
  failed_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid not null references public.profiles (id),
  metadata jsonb not null default '{}'::jsonb,
  constraint ticket_message_deliveries_ticket_fk
    foreign key (ticket_id, tenant_id)
    references public.tickets (id, tenant_id)
    on delete cascade,
  constraint ticket_message_deliveries_message_fk
    foreign key (message_id, tenant_id)
    references public.ticket_messages (id, tenant_id)
    on delete cascade,
  constraint ticket_message_deliveries_recipient_contact_fk
    foreign key (recipient_contact_id, tenant_id)
    references public.tenant_contacts (id, tenant_id),
  constraint ticket_message_deliveries_metadata_object_check
    check (jsonb_typeof(metadata) = 'object'),
  constraint ticket_message_deliveries_metadata_sanitized_check
    check (
      not (
        metadata ?| array[
          'token',
          'secret',
          'password',
          'api_key',
          'apikey',
          'authorization',
          'storage_path',
          'storage_bucket',
          'bucket',
          'raw_payload'
        ]
      )
    ),
  constraint ticket_message_deliveries_blocked_reason_check
    check (
      status <> 'blocked'::public.ticket_delivery_status
      or nullif(btrim(reason_if_blocked), '') is not null
    ),
  constraint ticket_message_deliveries_delivered_at_check
    check (
      status <> 'delivered'::public.ticket_delivery_status
      or delivered_at is not null
    ),
  constraint ticket_message_deliveries_failed_at_check
    check (
      status <> 'failed'::public.ticket_delivery_status
      or failed_at is not null
    )
);

create unique index ticket_message_deliveries_message_channel_key
  on public.ticket_message_deliveries (message_id, channel);

create index ticket_message_deliveries_ticket_created_idx
  on public.ticket_message_deliveries (tenant_id, ticket_id, created_at desc);

create index ticket_message_deliveries_status_idx
  on public.ticket_message_deliveries (tenant_id, status, created_at desc);

create trigger ticket_message_deliveries_prevent_mutation
before update or delete on public.ticket_message_deliveries
for each row
execute function app_private.prevent_ticket_history_mutation();

create trigger ticket_message_deliveries_audit_row_change
after insert or update or delete on public.ticket_message_deliveries
for each row
execute function audit.capture_row_change();

grant select on public.ticket_message_deliveries to service_role;
revoke all on public.ticket_message_deliveries from authenticated;
alter table public.ticket_message_deliveries enable row level security;

create policy ticket_message_deliveries_select_member_or_platform_admin
on public.ticket_message_deliveries
for select
to authenticated
using (
  app_private.has_global_role('platform_admin'::public.platform_role)
  or app_private.is_active_tenant_member(tenant_id)
);

create or replace function app_private.ticket_delivery_label(
  p_status public.ticket_delivery_status,
  p_channel public.ticket_delivery_channel,
  p_direction public.ticket_delivery_direction,
  p_provider_state public.ticket_delivery_provider_state
)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_channel = 'customer_portal'::public.ticket_delivery_channel
      and p_direction = 'inbound'::public.ticket_delivery_direction
      and p_status = 'delivered'::public.ticket_delivery_status
      then 'Recebida pelo Portal'
    when p_channel = 'customer_portal'::public.ticket_delivery_channel
      and p_status = 'delivered'::public.ticket_delivery_status
      then 'Disponivel no Portal'
    when p_status = 'blocked'::public.ticket_delivery_status
      and p_provider_state = 'not_configured'::public.ticket_delivery_provider_state
      then 'Canal externo nao configurado'
    when p_status = 'blocked'::public.ticket_delivery_status
      then 'Entrega bloqueada'
    when p_status = 'not_required'::public.ticket_delivery_status
      then 'Entrega nao aplicavel'
    when p_status = 'pending'::public.ticket_delivery_status
      then 'Entrega pendente'
    when p_status = 'failed'::public.ticket_delivery_status
      then 'Falha de entrega'
    when p_status = 'cancelled'::public.ticket_delivery_status
      then 'Entrega cancelada'
    else 'Status de entrega indisponivel'
  end;
$$;

create or replace function app_private.register_customer_portal_delivery(
  p_message public.ticket_messages,
  p_direction public.ticket_delivery_direction,
  p_created_by_user_id uuid
)
returns public.ticket_message_deliveries
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.tickets;
  v_delivery public.ticket_message_deliveries;
begin
  if p_message.id is null then
    raise exception 'message is required';
  end if;

  if p_message.visibility <> 'customer'::public.message_visibility then
    return null;
  end if;

  select *
  into v_ticket
  from public.tickets as t
  where t.id = p_message.ticket_id
    and t.tenant_id = p_message.tenant_id;

  if v_ticket.id is null then
    raise exception 'ticket not found for delivery';
  end if;

  insert into public.ticket_message_deliveries (
    tenant_id,
    ticket_id,
    message_id,
    channel,
    direction,
    status,
    provider_state,
    recipient_contact_id,
    recipient_user_id,
    reason_if_blocked,
    delivered_at,
    failed_at,
    created_by_user_id,
    metadata
  )
  values (
    p_message.tenant_id,
    p_message.ticket_id,
    p_message.id,
    'customer_portal'::public.ticket_delivery_channel,
    p_direction,
    'delivered'::public.ticket_delivery_status,
    'native'::public.ticket_delivery_provider_state,
    case
      when p_direction = 'outbound'::public.ticket_delivery_direction
        then v_ticket.requester_contact_id
      else null::uuid
    end,
    case
      when p_direction = 'outbound'::public.ticket_delivery_direction
        then (
          select tc.linked_user_id
          from public.tenant_contacts as tc
          where tc.id = v_ticket.requester_contact_id
            and tc.tenant_id = v_ticket.tenant_id
        )
      else null::uuid
    end,
    null,
    timezone('utc', now()),
    null,
    p_created_by_user_id,
    jsonb_build_object(
      'delivery_surface', 'customer_portal',
      'provider_state', 'native'
    )
  )
  on conflict (message_id, channel)
  do nothing
  returning *
  into v_delivery;

  if v_delivery.id is null then
    select *
    into v_delivery
    from public.ticket_message_deliveries as tmd
    where tmd.message_id = p_message.id
      and tmd.channel = 'customer_portal'::public.ticket_delivery_channel;
  end if;

  return v_delivery;
end;
$$;

revoke all on function app_private.ticket_delivery_label(public.ticket_delivery_status, public.ticket_delivery_channel, public.ticket_delivery_direction, public.ticket_delivery_provider_state) from public, anon, authenticated, service_role;
revoke all on function app_private.register_customer_portal_delivery(public.ticket_messages, public.ticket_delivery_direction, uuid) from public, anon, authenticated, service_role;
grant execute on function app_private.ticket_delivery_label(public.ticket_delivery_status, public.ticket_delivery_channel, public.ticket_delivery_direction, public.ticket_delivery_provider_state) to service_role;
grant execute on function app_private.register_customer_portal_delivery(public.ticket_messages, public.ticket_delivery_direction, uuid) to service_role;

insert into public.ticket_message_deliveries (
  tenant_id,
  ticket_id,
  message_id,
  channel,
  direction,
  status,
  provider_state,
  recipient_contact_id,
  recipient_user_id,
  delivered_at,
  created_by_user_id,
  metadata
)
select
  tm.tenant_id,
  tm.ticket_id,
  tm.id,
  'customer_portal'::public.ticket_delivery_channel,
  case
    when nullif(tm.metadata ->> 'communication_direction', '') = 'inbound'
      then 'inbound'::public.ticket_delivery_direction
    else 'outbound'::public.ticket_delivery_direction
  end,
  'delivered'::public.ticket_delivery_status,
  'native'::public.ticket_delivery_provider_state,
  case
    when nullif(tm.metadata ->> 'communication_direction', '') = 'inbound'
      then null::uuid
    else t.requester_contact_id
  end,
  case
    when nullif(tm.metadata ->> 'communication_direction', '') = 'inbound'
      then null::uuid
    else requester.linked_user_id
  end,
  tm.created_at,
  tm.created_by_user_id,
  jsonb_build_object(
    'delivery_surface', 'customer_portal',
    'provider_state', 'native',
    'backfilled_from', 'ticket_messages'
  )
from public.ticket_messages as tm
join public.tickets as t
  on t.id = tm.ticket_id
 and t.tenant_id = tm.tenant_id
left join public.tenant_contacts as requester
  on requester.id = t.requester_contact_id
 and requester.tenant_id = t.tenant_id
where tm.visibility = 'customer'::public.message_visibility
on conflict (message_id, channel)
do nothing;

create or replace view public.vw_support_ticket_message_deliveries
with (security_barrier = true)
as
select
  tmd.id as delivery_id,
  tmd.tenant_id,
  tmd.ticket_id,
  tmd.message_id,
  tmd.channel,
  case tmd.channel
    when 'customer_portal'::public.ticket_delivery_channel then 'Portal Cliente'
    when 'email_future'::public.ticket_delivery_channel then 'E-mail'
    when 'whatsapp_future'::public.ticket_delivery_channel then 'WhatsApp'
    when 'chat_future'::public.ticket_delivery_channel then 'Chat'
    when 'api_future'::public.ticket_delivery_channel then 'API'
  end as channel_label,
  tmd.direction,
  tmd.status,
  tmd.provider_state,
  case
    when tmd.channel = 'customer_portal'::public.ticket_delivery_channel
      and tmd.direction = 'inbound'::public.ticket_delivery_direction
      and tmd.status = 'delivered'::public.ticket_delivery_status
      then 'Recebida pelo Portal'
    when tmd.channel = 'customer_portal'::public.ticket_delivery_channel
      and tmd.status = 'delivered'::public.ticket_delivery_status
      then 'Disponivel no Portal'
    when tmd.status = 'blocked'::public.ticket_delivery_status
      and tmd.provider_state = 'not_configured'::public.ticket_delivery_provider_state
      then 'Canal externo nao configurado'
    when tmd.status = 'blocked'::public.ticket_delivery_status
      then 'Entrega bloqueada'
    when tmd.status = 'not_required'::public.ticket_delivery_status
      then 'Entrega nao aplicavel'
    when tmd.status = 'pending'::public.ticket_delivery_status
      then 'Entrega pendente'
    when tmd.status = 'failed'::public.ticket_delivery_status
      then 'Falha de entrega'
    when tmd.status = 'cancelled'::public.ticket_delivery_status
      then 'Entrega cancelada'
    else 'Status de entrega indisponivel'
  end as delivery_status_label,
  tmd.reason_if_blocked,
  tmd.delivered_at,
  tmd.failed_at,
  tmd.created_at,
  tmd.created_by_user_id
from public.ticket_message_deliveries as tmd
where app_private.can_access_support_workspace(tmd.tenant_id);

create or replace view public.vw_support_ticket_delivery_capabilities
with (security_barrier = true)
as
with support_visible as (
  select
    t.id as ticket_id,
    t.tenant_id,
    t.source,
    t.status
  from public.tickets as t
  where app_private.can_access_support_workspace(t.tenant_id)
),
channels as (
  select *
  from (
    values
      ('customer_portal'::public.ticket_delivery_channel, 'Portal Cliente'::text, 'native'::public.ticket_delivery_provider_state),
      ('email_future'::public.ticket_delivery_channel, 'E-mail'::text, 'not_configured'::public.ticket_delivery_provider_state),
      ('whatsapp_future'::public.ticket_delivery_channel, 'WhatsApp'::text, 'not_configured'::public.ticket_delivery_provider_state),
      ('chat_future'::public.ticket_delivery_channel, 'Chat'::text, 'not_configured'::public.ticket_delivery_provider_state),
      ('api_future'::public.ticket_delivery_channel, 'API'::text, 'not_configured'::public.ticket_delivery_provider_state)
  ) as c(channel, channel_label, provider_state)
)
select
  sv.ticket_id,
  sv.tenant_id,
  c.channel,
  c.channel_label,
  c.provider_state,
  (c.channel = 'customer_portal'::public.ticket_delivery_channel
    and sv.status <> all(array['closed', 'cancelled']::public.ticket_status[])) as can_deliver_now,
  case
    when c.channel = 'customer_portal'::public.ticket_delivery_channel
      and sv.status = any(array['closed', 'cancelled']::public.ticket_status[])
      then 'Ticket encerrado nao aceita novas respostas.'
    when c.channel = 'customer_portal'::public.ticket_delivery_channel
      then null::text
    else c.channel_label || ' ainda nao possui provider configurado.'
  end as reason_if_unavailable,
  case
    when c.channel = 'customer_portal'::public.ticket_delivery_channel
      and sv.status <> all(array['closed', 'cancelled']::public.ticket_status[])
      then 'customer_portal_native'
    else 'provider_not_configured'
  end as capability_key
from support_visible as sv
cross join channels as c;

create or replace view public.vw_customer_portal_ticket_delivery_state
with (security_barrier = true)
as
select
  tmd.ticket_id,
  tmd.tenant_id,
  tmd.message_id,
  case
    when tmd.direction = 'inbound'::public.ticket_delivery_direction then 'Enviado pelo portal'
    else 'Resposta do suporte'
  end as customer_delivery_label,
  tmd.delivered_at as available_at
from public.ticket_message_deliveries as tmd
where tmd.channel = 'customer_portal'::public.ticket_delivery_channel
  and tmd.status = 'delivered'::public.ticket_delivery_status
  and app_private.can_access_customer_ticket(tmd.ticket_id, tmd.tenant_id);

create or replace view public.vw_admin_communication_delivery_summary
with (security_barrier = true)
as
select
  tmd.channel,
  case tmd.channel
    when 'customer_portal'::public.ticket_delivery_channel then 'Portal Cliente'
    when 'email_future'::public.ticket_delivery_channel then 'E-mail'
    when 'whatsapp_future'::public.ticket_delivery_channel then 'WhatsApp'
    when 'chat_future'::public.ticket_delivery_channel then 'Chat'
    when 'api_future'::public.ticket_delivery_channel then 'API'
  end as channel_label,
  tmd.status,
  tmd.provider_state,
  count(*)::integer as delivery_count,
  max(tmd.created_at) as last_delivery_at
from public.ticket_message_deliveries as tmd
where app_private.has_global_role('platform_admin'::public.platform_role)
group by tmd.channel, tmd.status, tmd.provider_state;

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
    tl.is_customer_visible,
    delivery.channel as delivery_channel,
    delivery.status as delivery_status,
    delivery.provider_state as delivery_provider_state,
    case
      when delivery.message_id is null then null::text
      when delivery.channel = 'customer_portal'::public.ticket_delivery_channel
        and delivery.direction = 'inbound'::public.ticket_delivery_direction
        and delivery.status = 'delivered'::public.ticket_delivery_status
        then 'Recebida pelo Portal'
      when delivery.channel = 'customer_portal'::public.ticket_delivery_channel
        and delivery.status = 'delivered'::public.ticket_delivery_status
        then 'Disponivel no Portal'
      when delivery.status = 'blocked'::public.ticket_delivery_status
        and delivery.provider_state = 'not_configured'::public.ticket_delivery_provider_state
        then 'Canal externo nao configurado'
      when delivery.status = 'blocked'::public.ticket_delivery_status
        then 'Entrega bloqueada'
      when delivery.status = 'not_required'::public.ticket_delivery_status
        then 'Entrega nao aplicavel'
      when delivery.status = 'pending'::public.ticket_delivery_status
        then 'Entrega pendente'
      when delivery.status = 'failed'::public.ticket_delivery_status
        then 'Falha de entrega'
      when delivery.status = 'cancelled'::public.ticket_delivery_status
        then 'Entrega cancelada'
      else 'Status de entrega indisponivel'
    end as delivery_status_label,
    delivery.reason_if_blocked as delivery_reason_if_blocked,
    delivery.delivered_at as delivery_delivered_at,
    delivery.failed_at as delivery_failed_at
  from support_visible as tl
  join public.tenants as t
    on t.id = tl.tenant_id
  left join public.profiles as actor
    on actor.id = tl.actor_user_id
  left join public.ticket_message_deliveries as delivery
    on delivery.message_id = tl.message_id
   and delivery.tenant_id = tl.tenant_id
   and delivery.channel = 'customer_portal'::public.ticket_delivery_channel;

create or replace view public.vw_support_ticket_timeline_recent
with (security_barrier = true)
as
  with support_visible as (
    select
      tl.*
    from public.vw_support_ticket_timeline as tl
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
    tl.tenant_slug,
    tl.tenant_display_name,
    tl.timeline_entry_id,
    tl.entry_type,
    tl.visibility,
    tl.occurred_at,
    tl.actor_user_id,
    tl.actor_full_name,
    tl.actor_email,
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
    tl.is_customer_visible,
    tl.delivery_channel,
    tl.delivery_status,
    tl.delivery_provider_state,
    tl.delivery_status_label,
    tl.delivery_reason_if_blocked,
    tl.delivery_delivered_at,
    tl.delivery_failed_at
  from ranked as tl
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
  is_customer_visible boolean,
  delivery_channel public.ticket_delivery_channel,
  delivery_status public.ticket_delivery_status,
  delivery_provider_state public.ticket_delivery_provider_state,
  delivery_status_label text,
  delivery_reason_if_blocked text,
  delivery_delivered_at timestamptz,
  delivery_failed_at timestamptz
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
      tl.delivery_channel,
      tl.delivery_status,
      tl.delivery_provider_state,
      tl.delivery_status_label,
      tl.delivery_reason_if_blocked,
      tl.delivery_delivered_at,
      tl.delivery_failed_at,
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
    pd.is_customer_visible,
    pd.delivery_channel,
    pd.delivery_status,
    pd.delivery_provider_state,
    pd.delivery_status_label,
    pd.delivery_reason_if_blocked,
    pd.delivery_delivered_at,
    pd.delivery_failed_at
  from page_desc as pd
  order by pd.occurred_at asc, pd.timeline_entry_id asc;
end;
$$;

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
  end as customer_entry_label,
  case
    when delivery.direction = 'inbound'::public.ticket_delivery_direction then 'Enviado pelo portal'
    when delivery.status = 'delivered'::public.ticket_delivery_status then 'Resposta do suporte'
    else 'Atualizacao do ticket'
  end as customer_delivery_label
from public.ticket_messages as tm
left join public.ticket_message_deliveries as delivery
  on delivery.message_id = tm.id
 and delivery.tenant_id = tm.tenant_id
 and delivery.channel = 'customer_portal'::public.ticket_delivery_channel
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
  end as customer_entry_label,
  case
    when te.event_type = 'message_added'::public.ticket_event_type then 'Atualizacao do ticket'
    else null::text
  end as customer_delivery_label
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

  if v_ticket.source = any(array['email', 'chat', 'api']::public.ticket_source[]) then
    raise exception '%', app_private.ticket_reply_unavailable_reason(v_ticket.source, v_ticket.status, true);
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

  perform app_private.register_customer_portal_delivery(
    v_message,
    'outbound'::public.ticket_delivery_direction,
    v_actor_user_id
  );

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
      'communication_channel_label', app_private.ticket_channel_label(v_ticket.source),
      'delivery_channel', 'customer_portal',
      'delivery_status', 'delivered',
      'delivery_status_label', 'Disponivel no Portal'
    ),
    v_message.id
  );

  return v_message;
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

  perform app_private.register_customer_portal_delivery(
    v_message,
    'inbound'::public.ticket_delivery_direction,
    v_actor_user_id
  );

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
      'communication_channel_label', 'Portal Cliente',
      'delivery_channel', 'customer_portal',
      'delivery_status', 'delivered',
      'delivery_status_label', 'Recebida pelo Portal'
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
        'reason', 'customer_replied',
        'source', 'customer_portal'
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

grant select on public.vw_support_ticket_message_deliveries to authenticated;
grant select on public.vw_support_ticket_delivery_capabilities to authenticated;
grant select on public.vw_customer_portal_ticket_delivery_state to authenticated;
grant select on public.vw_admin_communication_delivery_summary to authenticated;

comment on table public.ticket_message_deliveries is
  'Append-only ledger de disponibilidade customer-facing de mensagens. Customer Portal e o unico canal real neste corte; canais externos permanecem bloqueados sem provider.';

comment on view public.vw_support_ticket_message_deliveries is
  'Read model de suporte para status sanitizado de delivery por mensagem.';

comment on view public.vw_support_ticket_delivery_capabilities is
  'Capabilities de entrega por ticket/canal, com canais externos bloqueados por falta de provider.';

comment on view public.vw_customer_portal_ticket_delivery_state is
  'Estado customer-facing sanitizado de disponibilidade de mensagens no Portal, sem provider ou metadata tecnica.';

comment on view public.vw_admin_communication_delivery_summary is
  'Resumo administrativo sanitizado de delivery, sem configuracao de provider externo.';
