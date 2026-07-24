do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'communication_channel_readiness_status'
  ) then
    create type public.communication_channel_readiness_status as enum (
      'active',
      'disabled',
      'not_configured',
      'future',
      'blocked',
      'unavailable'
    );
  end if;
end $$;

create table if not exists public.communication_channel_definitions (
  channel_key public.ticket_delivery_channel primary key,
  label text not null,
  direction_supported text not null
    check (direction_supported in ('inbound', 'outbound', 'bidirectional')),
  is_external boolean not null default true,
  is_real_channel boolean not null default false,
  provider_required boolean not null default true,
  status_global public.communication_channel_readiness_status not null,
  future_provider_type text,
  description text not null,
  unavailable_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint communication_channel_definitions_no_secret_words
    check (
      not (
        coalesce(label, '') || ' ' ||
        coalesce(future_provider_type, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(unavailable_reason, '')
      ) ~* '(token|secret|password|senha|api[_ -]?key|authorization|bearer|webhook[_ -]?secret)'
    ),
  constraint communication_channel_definitions_external_not_real
    check (
      channel_key = 'customer_portal'::public.ticket_delivery_channel
      or (is_real_channel is false and provider_required is true and status_global <> 'active'::public.communication_channel_readiness_status)
    )
);

create trigger communication_channel_definitions_touch_updated_at
before update on public.communication_channel_definitions
for each row
execute function app_private.touch_updated_at();

create trigger communication_channel_definitions_audit_row_change
after insert or update or delete on public.communication_channel_definitions
for each row
execute function audit.capture_row_change();

alter table public.communication_channel_definitions enable row level security;
revoke all on public.communication_channel_definitions from anon, authenticated;
grant select on public.communication_channel_definitions to service_role;

create policy communication_channel_definitions_select_platform_admin
on public.communication_channel_definitions
for select
to authenticated
using (app_private.has_global_role('platform_admin'::public.platform_role));

insert into public.communication_channel_definitions (
  channel_key,
  label,
  direction_supported,
  is_external,
  is_real_channel,
  provider_required,
  status_global,
  future_provider_type,
  description,
  unavailable_reason
)
values
  (
    'customer_portal'::public.ticket_delivery_channel,
    'Portal Cliente',
    'bidirectional',
    false,
    true,
    false,
    'active'::public.communication_channel_readiness_status,
    null,
    'Canal nativo do MVP para conversa customer-facing autenticada no portal.',
    null
  ),
  (
    'email_future'::public.ticket_delivery_channel,
    'E-mail',
    'bidirectional',
    true,
    false,
    true,
    'not_configured'::public.communication_channel_readiness_status,
    'email',
    'Canal futuro para e-mail transacional ou caixa compartilhada, pendente de contrato de provider.',
    'Email ainda nao esta integrado para resposta direta. Provider externo nao configurado; sem envio real nesta versao.'
  ),
  (
    'whatsapp_future'::public.ticket_delivery_channel,
    'WhatsApp',
    'bidirectional',
    true,
    false,
    true,
    'not_configured'::public.communication_channel_readiness_status,
    'whatsapp',
    'Canal futuro para mensageria WhatsApp, pendente de contrato, consentimento e provider oficial.',
    'WhatsApp nao configurado. Sem envio real nesta versao.'
  ),
  (
    'chat_future'::public.ticket_delivery_channel,
    'Chat',
    'bidirectional',
    true,
    false,
    true,
    'future'::public.communication_channel_readiness_status,
    'chat',
    'Canal futuro para chat autenticado ou widget governado, ainda fora do MVP operacional.',
    'Chat preparado para futuro. Sem provider conectado.'
  ),
  (
    'api_future'::public.ticket_delivery_channel,
    'API',
    'bidirectional',
    true,
    false,
    true,
    'blocked'::public.communication_channel_readiness_status,
    'api',
    'Canal futuro para integracoes externas governadas por contrato e idempotencia.',
    'API externa bloqueada ate existir contrato de provider, autenticacao e auditoria de envio.'
  )
on conflict (channel_key) do update
set
  label = excluded.label,
  direction_supported = excluded.direction_supported,
  is_external = excluded.is_external,
  is_real_channel = excluded.is_real_channel,
  provider_required = excluded.provider_required,
  status_global = excluded.status_global,
  future_provider_type = excluded.future_provider_type,
  description = excluded.description,
  unavailable_reason = excluded.unavailable_reason;

create table if not exists public.tenant_communication_channel_settings (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  channel_key public.ticket_delivery_channel not null references public.communication_channel_definitions (channel_key),
  readiness_status public.communication_channel_readiness_status not null,
  is_enabled boolean not null default false,
  can_send boolean not null default false,
  can_receive boolean not null default false,
  reason_if_unavailable text,
  required_setup_summary text not null default 'Indisponivel',
  operational_note text,
  last_checked_at timestamptz not null default timezone('utc', now()),
  managed_by_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (tenant_id, channel_key),
  constraint tenant_channel_settings_reason_required
    check (
      readiness_status = 'active'::public.communication_channel_readiness_status
      or nullif(btrim(coalesce(reason_if_unavailable, '')), '') is not null
    ),
  constraint tenant_channel_settings_external_no_active
    check (
      channel_key = 'customer_portal'::public.ticket_delivery_channel
      or (
        readiness_status <> 'active'::public.communication_channel_readiness_status
        and is_enabled is false
        and can_send is false
        and can_receive is false
      )
    ),
  constraint tenant_channel_settings_portal_active_capability
    check (
      channel_key <> 'customer_portal'::public.ticket_delivery_channel
      or readiness_status <> 'active'::public.communication_channel_readiness_status
      or (is_enabled is true and can_send is true and can_receive is true)
    ),
  constraint tenant_channel_settings_no_secret_words
    check (
      not (
        coalesce(reason_if_unavailable, '') || ' ' ||
        coalesce(required_setup_summary, '') || ' ' ||
        coalesce(operational_note, '')
      ) ~* '(token|secret|password|senha|api[_ -]?key|authorization|bearer|webhook[_ -]?secret|credential|credencial)'
    )
);

create index if not exists tenant_channel_settings_channel_idx
  on public.tenant_communication_channel_settings (channel_key, readiness_status);

create trigger tenant_communication_channel_settings_touch_updated_at
before update on public.tenant_communication_channel_settings
for each row
execute function app_private.touch_updated_at();

create trigger tenant_communication_channel_settings_audit_row_change
after insert or update or delete on public.tenant_communication_channel_settings
for each row
execute function audit.capture_row_change();

alter table public.tenant_communication_channel_settings enable row level security;
revoke all on public.tenant_communication_channel_settings from anon, authenticated;
grant select on public.tenant_communication_channel_settings to service_role;

create policy tenant_channel_settings_select_platform_or_support
on public.tenant_communication_channel_settings
for select
to authenticated
using (
  app_private.has_global_role('platform_admin'::public.platform_role)
  or app_private.can_access_support_workspace(tenant_id)
);

insert into public.tenant_communication_channel_settings (
  tenant_id,
  channel_key,
  readiness_status,
  is_enabled,
  can_send,
  can_receive,
  reason_if_unavailable,
  required_setup_summary,
  operational_note,
  last_checked_at
)
select
  t.id,
  d.channel_key,
  case
    when d.channel_key = 'customer_portal'::public.ticket_delivery_channel
      then 'active'::public.communication_channel_readiness_status
    else d.status_global
  end,
  (d.channel_key = 'customer_portal'::public.ticket_delivery_channel),
  (d.channel_key = 'customer_portal'::public.ticket_delivery_channel),
  (d.channel_key = 'customer_portal'::public.ticket_delivery_channel),
  case
    when d.channel_key = 'customer_portal'::public.ticket_delivery_channel then null::text
    else d.unavailable_reason
  end,
  case
    when d.channel_key = 'customer_portal'::public.ticket_delivery_channel
      then 'Canal nativo ativo no MVP, sem provider externo.'
    when d.channel_key = 'email_future'::public.ticket_delivery_channel
      then 'Definir provider oficial, opt-in, identidade de remetente, templates, bounce handling e auditoria de envio.'
    when d.channel_key = 'whatsapp_future'::public.ticket_delivery_channel
      then 'Definir provider oficial, consentimento, templates aprovados, janela de atendimento e reconciliacao de entrega.'
    when d.channel_key = 'chat_future'::public.ticket_delivery_channel
      then 'Definir superficie de chat autenticada, persistencia de thread, presenca e regras de atendimento.'
    else 'Definir contrato de API, autenticacao, idempotencia, assinatura de eventos e observabilidade.'
  end,
  'Readiness inicial criado automaticamente pelo contrato P2-C.',
  timezone('utc', now())
from public.tenants as t
cross join public.communication_channel_definitions as d
on conflict (tenant_id, channel_key) do nothing;

create or replace function app_private.default_channel_readiness_status(
  p_channel public.ticket_delivery_channel
)
returns public.communication_channel_readiness_status
language sql
stable
set search_path = ''
as $$
  select case
    when p_channel = 'customer_portal'::public.ticket_delivery_channel
      then 'active'::public.communication_channel_readiness_status
    when p_channel = 'email_future'::public.ticket_delivery_channel
      then 'not_configured'::public.communication_channel_readiness_status
    when p_channel = 'whatsapp_future'::public.ticket_delivery_channel
      then 'not_configured'::public.communication_channel_readiness_status
    when p_channel = 'chat_future'::public.ticket_delivery_channel
      then 'future'::public.communication_channel_readiness_status
    when p_channel = 'api_future'::public.ticket_delivery_channel
      then 'blocked'::public.communication_channel_readiness_status
    else 'unavailable'::public.communication_channel_readiness_status
  end;
$$;

create or replace function app_private.default_channel_required_setup_summary(
  p_channel public.ticket_delivery_channel
)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_channel = 'customer_portal'::public.ticket_delivery_channel
      then 'Canal nativo ativo no MVP, sem provider externo.'
    when p_channel = 'email_future'::public.ticket_delivery_channel
      then 'Definir provider oficial, opt-in, identidade de remetente, templates, bounce handling e auditoria de envio.'
    when p_channel = 'whatsapp_future'::public.ticket_delivery_channel
      then 'Definir provider oficial, consentimento, templates aprovados, janela de atendimento e reconciliacao de entrega.'
    when p_channel = 'chat_future'::public.ticket_delivery_channel
      then 'Definir superficie de chat autenticada, persistencia de thread, presenca e regras de atendimento.'
    else 'Definir contrato de API, autenticacao, idempotencia, assinatura de eventos e observabilidade.'
  end;
$$;

create or replace function app_private.default_channel_unavailable_reason(
  p_channel public.ticket_delivery_channel
)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_channel = 'customer_portal'::public.ticket_delivery_channel then null::text
    when p_channel = 'email_future'::public.ticket_delivery_channel then 'Email ainda nao esta integrado para resposta direta. Provider externo nao configurado; sem envio real nesta versao.'
    when p_channel = 'whatsapp_future'::public.ticket_delivery_channel then 'WhatsApp nao configurado. Sem envio real nesta versao.'
    when p_channel = 'chat_future'::public.ticket_delivery_channel then 'Chat preparado para futuro. Sem provider conectado.'
    when p_channel = 'api_future'::public.ticket_delivery_channel then 'API externa bloqueada ate existir contrato de provider, autenticacao e auditoria de envio.'
    else 'Canal indisponivel.'
  end;
$$;

create or replace function app_private.tenant_channel_readiness_row(
  p_tenant_id uuid,
  p_channel public.ticket_delivery_channel
)
returns table (
  readiness_status public.communication_channel_readiness_status,
  is_enabled boolean,
  can_send boolean,
  can_receive boolean,
  reason_if_unavailable text,
  required_setup_summary text,
  operational_note text,
  last_checked_at timestamptz,
  managed_by_user_id uuid,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(s.readiness_status, app_private.default_channel_readiness_status(p_channel)) as readiness_status,
    coalesce(s.is_enabled, p_channel = 'customer_portal'::public.ticket_delivery_channel) as is_enabled,
    coalesce(s.can_send, p_channel = 'customer_portal'::public.ticket_delivery_channel) as can_send,
    coalesce(s.can_receive, p_channel = 'customer_portal'::public.ticket_delivery_channel) as can_receive,
    coalesce(s.reason_if_unavailable, app_private.default_channel_unavailable_reason(p_channel)) as reason_if_unavailable,
    coalesce(s.required_setup_summary, app_private.default_channel_required_setup_summary(p_channel)) as required_setup_summary,
    s.operational_note,
    coalesce(s.last_checked_at, timezone('utc', now())) as last_checked_at,
    s.managed_by_user_id,
    s.updated_at
  from (select 1) as anchor
  left join public.tenant_communication_channel_settings as s
    on s.tenant_id = p_tenant_id
   and s.channel_key = p_channel;
$$;

create or replace function app_private.contains_secret_like_text(p_values text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_to_string(p_values, ' '), '') ~* '(token|secret|password|senha|api[_ -]?key|authorization|bearer|webhook[_ -]?secret|credential|credencial)';
$$;

create or replace view public.vw_admin_communication_channel_readiness
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
  t.id as tenant_id,
  t.slug as tenant_slug,
  t.display_name as tenant_display_name,
  t.status as tenant_status,
  d.channel_key,
  d.label as channel_label,
  d.direction_supported,
  d.is_external,
  d.is_real_channel,
  d.provider_required,
  d.status_global,
  d.future_provider_type,
  d.description,
  coalesce(s.readiness_status, d.status_global) as readiness_status,
  coalesce(s.is_enabled, d.channel_key = 'customer_portal'::public.ticket_delivery_channel) as is_enabled,
  coalesce(s.can_send, d.channel_key = 'customer_portal'::public.ticket_delivery_channel) as can_send,
  coalesce(s.can_receive, d.channel_key = 'customer_portal'::public.ticket_delivery_channel) as can_receive,
  coalesce(s.reason_if_unavailable, d.unavailable_reason) as reason_if_unavailable,
  coalesce(s.required_setup_summary, d.description) as required_setup_summary,
  s.operational_note,
  coalesce(s.last_checked_at, timezone('utc', now())) as last_checked_at,
  s.managed_by_user_id,
  manager.full_name as managed_by_full_name,
  manager.email::text as managed_by_email,
  coalesce(s.updated_at, t.created_at) as updated_at,
  (d.channel_key = 'customer_portal'::public.ticket_delivery_channel) as can_mark_active,
  (d.channel_key <> 'customer_portal'::public.ticket_delivery_channel) as activation_blocked_by_contract
from current_actor as ca
join public.tenants as t
  on true
join public.communication_channel_definitions as d
  on true
left join public.tenant_communication_channel_settings as s
  on s.tenant_id = t.id
 and s.channel_key = d.channel_key
left join public.profiles as manager
  on manager.id = s.managed_by_user_id
order by t.display_name asc, d.channel_key asc;

create or replace view public.vw_support_tenant_communication_capabilities
with (security_barrier = true)
as
select
  t.id as tenant_id,
  t.slug as tenant_slug,
  t.display_name as tenant_display_name,
  d.channel_key,
  d.label as channel_label,
  d.is_external,
  d.is_real_channel,
  d.provider_required,
  d.future_provider_type,
  coalesce(s.readiness_status, d.status_global) as readiness_status,
  coalesce(s.is_enabled, d.channel_key = 'customer_portal'::public.ticket_delivery_channel) as is_enabled,
  coalesce(s.can_send, d.channel_key = 'customer_portal'::public.ticket_delivery_channel) as can_send,
  coalesce(s.can_receive, d.channel_key = 'customer_portal'::public.ticket_delivery_channel) as can_receive,
  coalesce(s.reason_if_unavailable, d.unavailable_reason) as reason_if_unavailable,
  coalesce(s.required_setup_summary, d.description) as required_setup_summary,
  case
    when d.channel_key = 'customer_portal'::public.ticket_delivery_channel
      and coalesce(s.readiness_status, d.status_global) = 'active'::public.communication_channel_readiness_status
      then 'Portal e o canal ativo do MVP.'
    when d.channel_key = 'email_future'::public.ticket_delivery_channel
      then 'E-mail nao configurado.'
    when d.channel_key = 'whatsapp_future'::public.ticket_delivery_channel
      then 'WhatsApp nao configurado.'
    when d.channel_key = 'chat_future'::public.ticket_delivery_channel
      then 'Chat preparado para futuro.'
    when d.channel_key = 'api_future'::public.ticket_delivery_channel
      then 'API externa bloqueada.'
    else 'Canal indisponivel.'
  end as support_status_label
from public.tenants as t
join public.communication_channel_definitions as d
  on true
left join public.tenant_communication_channel_settings as s
  on s.tenant_id = t.id
 and s.channel_key = d.channel_key
where app_private.can_access_support_workspace(t.id)
order by t.display_name asc, d.channel_key asc;

create or replace view public.vw_support_ticket_channel_readiness
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
)
select
  sv.ticket_id,
  sv.tenant_id,
  d.channel_key,
  d.label as channel_label,
  d.is_external,
  d.is_real_channel,
  d.provider_required,
  d.future_provider_type,
  coalesce(s.readiness_status, d.status_global) as readiness_status,
  coalesce(s.is_enabled, d.channel_key = 'customer_portal'::public.ticket_delivery_channel) as is_enabled,
  coalesce(s.can_send, d.channel_key = 'customer_portal'::public.ticket_delivery_channel) as can_send,
  coalesce(s.can_receive, d.channel_key = 'customer_portal'::public.ticket_delivery_channel) as can_receive,
  coalesce(s.reason_if_unavailable, d.unavailable_reason) as reason_if_unavailable,
  coalesce(s.required_setup_summary, d.description) as required_setup_summary,
  case
    when d.channel_key = 'customer_portal'::public.ticket_delivery_channel
      and coalesce(s.readiness_status, d.status_global) = 'active'::public.communication_channel_readiness_status
      then 'Portal e o canal ativo do MVP.'
    when d.channel_key = 'email_future'::public.ticket_delivery_channel
      then 'E-mail nao configurado.'
    when d.channel_key = 'whatsapp_future'::public.ticket_delivery_channel
      then 'WhatsApp nao configurado.'
    when d.channel_key = 'chat_future'::public.ticket_delivery_channel
      then 'Chat preparado para futuro.'
    when d.channel_key = 'api_future'::public.ticket_delivery_channel
      then 'API externa bloqueada.'
    else 'Canal indisponivel.'
  end as support_status_label,
  (
    d.channel_key = case sv.source
      when 'portal' then 'customer_portal'::public.ticket_delivery_channel
      when 'email' then 'email_future'::public.ticket_delivery_channel
      when 'chat' then 'chat_future'::public.ticket_delivery_channel
      when 'api' then 'api_future'::public.ticket_delivery_channel
      else 'customer_portal'::public.ticket_delivery_channel
    end
  ) as is_ticket_current_channel
from support_visible as sv
join public.communication_channel_definitions as d
  on true
left join public.tenant_communication_channel_settings as s
  on s.tenant_id = sv.tenant_id
 and s.channel_key = d.channel_key;

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
    and coalesce(readiness.can_send, channel_map.delivery_channel = 'customer_portal'::public.ticket_delivery_channel)
  ) as can_reply_now,
  case
    when q.can_add_message
      and q.status <> all(array['resolved', 'closed', 'cancelled']::public.ticket_status[])
      and coalesce(readiness.can_send, channel_map.delivery_channel = 'customer_portal'::public.ticket_delivery_channel)
      and q.source = 'portal'::public.ticket_source
      then 'customer_portal_public_reply'
    when q.can_add_message
      and q.status <> all(array['resolved', 'closed', 'cancelled']::public.ticket_status[])
      and coalesce(readiness.can_send, channel_map.delivery_channel = 'customer_portal'::public.ticket_delivery_channel)
      then 'support_public_message'
    else 'unavailable'
  end as reply_mode,
  case
    when q.can_add_message is not true then 'Resposta indisponivel para este ticket.'
    when q.status = any(array['resolved', 'closed', 'cancelled']::public.ticket_status[]) then 'Ticket encerrado nao aceita novas respostas.'
    when coalesce(readiness.can_send, channel_map.delivery_channel = 'customer_portal'::public.ticket_delivery_channel) is not true
      then coalesce(readiness.reason_if_unavailable, definition.unavailable_reason)
    else null::text
  end as reason_if_unavailable,
  q.status,
  q.can_add_message
from public.vw_tickets_list as q
cross join lateral (
  select case q.source
    when 'portal' then 'customer_portal'::public.ticket_delivery_channel
    when 'email' then 'email_future'::public.ticket_delivery_channel
    when 'chat' then 'chat_future'::public.ticket_delivery_channel
    when 'api' then 'api_future'::public.ticket_delivery_channel
    else 'customer_portal'::public.ticket_delivery_channel
  end as delivery_channel
) as channel_map
join public.communication_channel_definitions as definition
  on definition.channel_key = channel_map.delivery_channel
left join public.tenant_communication_channel_settings as readiness
  on readiness.tenant_id = q.tenant_id
 and readiness.channel_key = channel_map.delivery_channel
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
)
select
  sv.ticket_id,
  sv.tenant_id,
  d.channel_key as channel,
  d.label as channel_label,
  case
    when d.channel_key = 'customer_portal'::public.ticket_delivery_channel
      and coalesce(s.readiness_status, d.status_global) = 'active'::public.communication_channel_readiness_status
      then 'native'::public.ticket_delivery_provider_state
    when coalesce(s.readiness_status, d.status_global) = 'disabled'::public.communication_channel_readiness_status
      then 'disabled'::public.ticket_delivery_provider_state
    when coalesce(s.readiness_status, d.status_global) = 'future'::public.communication_channel_readiness_status
      then 'future'::public.ticket_delivery_provider_state
    else 'not_configured'::public.ticket_delivery_provider_state
  end as provider_state,
  (
    coalesce(s.can_send, d.channel_key = 'customer_portal'::public.ticket_delivery_channel)
    and sv.status <> all(array['closed', 'cancelled']::public.ticket_status[])
  ) as can_deliver_now,
  case
    when sv.status = any(array['closed', 'cancelled']::public.ticket_status[]) then 'Ticket encerrado nao aceita novas respostas.'
    when coalesce(s.can_send, d.channel_key = 'customer_portal'::public.ticket_delivery_channel) then null::text
    else coalesce(s.reason_if_unavailable, d.unavailable_reason)
  end as reason_if_unavailable,
  case
    when coalesce(s.can_send, d.channel_key = 'customer_portal'::public.ticket_delivery_channel)
      and sv.status <> all(array['closed', 'cancelled']::public.ticket_status[])
      then 'customer_portal_native'
    when coalesce(s.readiness_status, d.status_global) = 'disabled'::public.communication_channel_readiness_status
      then 'channel_disabled'
    when coalesce(s.readiness_status, d.status_global) = 'future'::public.communication_channel_readiness_status
      then 'provider_future'
    when coalesce(s.readiness_status, d.status_global) = 'blocked'::public.communication_channel_readiness_status
      then 'provider_blocked'
    else 'provider_not_configured'
  end as capability_key
from support_visible as sv
join public.communication_channel_definitions as d
  on true
left join public.tenant_communication_channel_settings as s
  on s.tenant_id = sv.tenant_id
 and s.channel_key = d.channel_key;

drop view if exists public.vw_admin_communication_delivery_summary;

create or replace view public.vw_admin_communication_delivery_summary
with (security_barrier = true)
as
with current_actor as (
  select p.id
  from public.profiles as p
  where p.id = auth.uid()
    and p.is_active
    and app_private.has_global_role('platform_admin'::public.platform_role)
),
delivery as (
  select
    tmd.channel,
    tmd.status,
    tmd.provider_state,
    count(*)::integer as delivery_count,
    max(tmd.created_at) as last_delivery_at
  from public.ticket_message_deliveries as tmd
  group by tmd.channel, tmd.status, tmd.provider_state
),
readiness as (
  select
    channel_key,
    count(*)::integer as tenant_count,
    count(*) filter (where readiness_status = 'active')::integer as active_tenant_count,
    count(*) filter (where readiness_status <> 'active')::integer as unavailable_tenant_count
  from public.vw_admin_communication_channel_readiness
  group by channel_key
)
select
  d.channel_key as channel,
  d.label as channel_label,
  coalesce(r.tenant_count, 0)::integer as tenant_count,
  coalesce(r.active_tenant_count, 0)::integer as active_tenant_count,
  coalesce(r.unavailable_tenant_count, 0)::integer as unavailable_tenant_count,
  coalesce(sum(delivery.delivery_count), 0)::integer as delivery_count,
  coalesce(sum(delivery.delivery_count) filter (where delivery.status = 'delivered'::public.ticket_delivery_status), 0)::integer as delivered_count,
  coalesce(sum(delivery.delivery_count) filter (where delivery.status = 'blocked'::public.ticket_delivery_status), 0)::integer as blocked_count,
  max(delivery.last_delivery_at) as last_delivery_at
from current_actor as ca
join public.communication_channel_definitions as d
  on true
left join readiness as r
  on r.channel_key = d.channel_key
left join delivery
  on delivery.channel = d.channel_key
group by d.channel_key, d.label, r.tenant_count, r.active_tenant_count, r.unavailable_tenant_count
order by d.channel_key asc;

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
          'ticket_message_deliveries',
          'knowledge_articles',
          'knowledge_article_revisions',
          'knowledge_article_review_advisories',
          'customer_account_profiles',
          'customer_account_integrations',
          'customer_account_features',
          'customer_account_customizations',
          'customer_account_alerts',
          'communication_channel_definitions',
          'tenant_communication_channel_settings'
        ]::text[]
      )
  )
  select
    al.id,
    al.occurred_at,
    al.actor_user_id,
    coalesce(actor.full_name, actor.email::text, 'Operador interno') as actor_display_name,
    actor.email::text as actor_email,
    coalesce(al.tenant_id, case when al.entity_table = 'tenants' then al.entity_id else null end) as tenant_id,
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
      when 'ticket_message_deliveries' then 'Entregas de mensagens'
      when 'knowledge_articles' then 'Knowledge Base'
      when 'knowledge_article_revisions' then 'Revisoes da Knowledge'
      when 'knowledge_article_review_advisories' then 'Revisao humana da Knowledge'
      when 'customer_account_profiles' then 'Perfil operacional do cliente'
      when 'customer_account_integrations' then 'Integracoes do cliente'
      when 'customer_account_features' then 'Recursos do cliente'
      when 'customer_account_customizations' then 'Customizacoes do cliente'
      when 'customer_account_alerts' then 'Alertas do cliente'
      when 'communication_channel_definitions' then 'Definicoes de canais'
      when 'tenant_communication_channel_settings' then 'Governanca de canais'
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
    on tenant.id = coalesce(al.tenant_id, case when al.entity_table = 'tenants' then al.entity_id else null end)
  cross join lateral (
    select case
      when lower(coalesce(al.action, '')) in ('delete') then 'critical'
      when lower(coalesce(al.action, '')) = 'update'
        and lower(coalesce(al.entity_table, '')) in ('tenant_memberships', 'user_global_roles', 'tenant_communication_channel_settings') then 'critical'
      when lower(coalesce(al.action, '')) = 'insert'
        and lower(coalesce(al.entity_table, '')) in ('tenant_memberships', 'user_global_roles', 'tenant_communication_channel_settings') then 'attention'
      when lower(coalesce(al.action, '')) = 'update' then 'attention'
      when lower(coalesce(al.action, '')) = 'insert' then 'ok'
      else 'attention'
    end as value
  ) as severity
  order by al.occurred_at desc, al.id desc;

create or replace function public.rpc_admin_update_tenant_channel_readiness(
  p_tenant_id uuid,
  p_channel public.ticket_delivery_channel,
  p_readiness_status public.communication_channel_readiness_status,
  p_reason_if_unavailable text default null,
  p_required_setup_summary text default null,
  p_operational_note text default null
)
returns public.tenant_communication_channel_settings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_definition public.communication_channel_definitions;
  v_setting public.tenant_communication_channel_settings;
  v_reason text;
  v_required_setup text;
begin
  v_actor_user_id := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_update_tenant_channel_readiness denied';
  end if;

  if p_tenant_id is null or p_channel is null or p_readiness_status is null then
    raise exception 'tenant, channel and readiness status are required';
  end if;

  if not exists (select 1 from public.tenants as t where t.id = p_tenant_id) then
    raise exception 'tenant not found';
  end if;

  select *
  into v_definition
  from public.communication_channel_definitions as d
  where d.channel_key = p_channel;

  if not found then
    raise exception 'channel definition not found';
  end if;

  if app_private.contains_secret_like_text(array[p_reason_if_unavailable, p_required_setup_summary, p_operational_note]) then
    raise exception 'channel readiness cannot store secrets or credentials';
  end if;

  if p_channel <> 'customer_portal'::public.ticket_delivery_channel
     and p_readiness_status = 'active'::public.communication_channel_readiness_status then
    raise exception 'external channel cannot be activated without provider contract';
  end if;

  v_reason := nullif(btrim(coalesce(p_reason_if_unavailable, '')), '');
  v_required_setup := nullif(btrim(coalesce(p_required_setup_summary, '')), '');

  if p_readiness_status <> 'active'::public.communication_channel_readiness_status
     and v_reason is null then
    v_reason := coalesce(v_definition.unavailable_reason, app_private.default_channel_unavailable_reason(p_channel));
  end if;

  if v_required_setup is null then
    v_required_setup := app_private.default_channel_required_setup_summary(p_channel);
  end if;

  insert into public.tenant_communication_channel_settings (
    tenant_id,
    channel_key,
    readiness_status,
    is_enabled,
    can_send,
    can_receive,
    reason_if_unavailable,
    required_setup_summary,
    operational_note,
    last_checked_at,
    managed_by_user_id
  )
  values (
    p_tenant_id,
    p_channel,
    p_readiness_status,
    (p_channel = 'customer_portal'::public.ticket_delivery_channel and p_readiness_status = 'active'::public.communication_channel_readiness_status),
    (p_channel = 'customer_portal'::public.ticket_delivery_channel and p_readiness_status = 'active'::public.communication_channel_readiness_status),
    (p_channel = 'customer_portal'::public.ticket_delivery_channel and p_readiness_status = 'active'::public.communication_channel_readiness_status),
    case when p_readiness_status = 'active'::public.communication_channel_readiness_status then null::text else v_reason end,
    v_required_setup,
    nullif(btrim(coalesce(p_operational_note, '')), ''),
    timezone('utc', now()),
    v_actor_user_id
  )
  on conflict (tenant_id, channel_key) do update
  set
    readiness_status = excluded.readiness_status,
    is_enabled = excluded.is_enabled,
    can_send = excluded.can_send,
    can_receive = excluded.can_receive,
    reason_if_unavailable = excluded.reason_if_unavailable,
    required_setup_summary = excluded.required_setup_summary,
    operational_note = excluded.operational_note,
    last_checked_at = excluded.last_checked_at,
    managed_by_user_id = excluded.managed_by_user_id
  returning *
  into v_setting;

  return v_setting;
end;
$$;

create or replace function public.rpc_admin_disable_tenant_channel(
  p_tenant_id uuid,
  p_channel public.ticket_delivery_channel,
  p_reason_if_unavailable text default 'Canal desabilitado por governanca administrativa.'
)
returns public.tenant_communication_channel_settings
language sql
security definer
set search_path = ''
as $$
  select public.rpc_admin_update_tenant_channel_readiness(
    p_tenant_id,
    p_channel,
    'disabled'::public.communication_channel_readiness_status,
    p_reason_if_unavailable,
    app_private.default_channel_required_setup_summary(p_channel),
    'Canal desabilitado por governanca administrativa.'
  );
$$;

create or replace function public.rpc_admin_mark_channel_future_ready(
  p_tenant_id uuid,
  p_channel public.ticket_delivery_channel,
  p_required_setup_summary text default null,
  p_operational_note text default null
)
returns public.tenant_communication_channel_settings
language sql
security definer
set search_path = ''
as $$
  select public.rpc_admin_update_tenant_channel_readiness(
    p_tenant_id,
    p_channel,
    'future'::public.communication_channel_readiness_status,
    coalesce(app_private.default_channel_unavailable_reason(p_channel), 'Canal preparado para futuro, sem envio real nesta versao.'),
    p_required_setup_summary,
    p_operational_note
  );
$$;

revoke all on function app_private.default_channel_readiness_status(public.ticket_delivery_channel) from public, anon, authenticated, service_role;
revoke all on function app_private.default_channel_required_setup_summary(public.ticket_delivery_channel) from public, anon, authenticated, service_role;
revoke all on function app_private.default_channel_unavailable_reason(public.ticket_delivery_channel) from public, anon, authenticated, service_role;
revoke all on function app_private.tenant_channel_readiness_row(uuid, public.ticket_delivery_channel) from public, anon, authenticated, service_role;
revoke all on function app_private.contains_secret_like_text(text[]) from public, anon, authenticated, service_role;
grant execute on function app_private.default_channel_readiness_status(public.ticket_delivery_channel) to service_role;
grant execute on function app_private.default_channel_required_setup_summary(public.ticket_delivery_channel) to service_role;
grant execute on function app_private.default_channel_unavailable_reason(public.ticket_delivery_channel) to service_role;
grant execute on function app_private.tenant_channel_readiness_row(uuid, public.ticket_delivery_channel) to service_role;
grant execute on function app_private.contains_secret_like_text(text[]) to service_role;

revoke all on function public.rpc_admin_update_tenant_channel_readiness(uuid, public.ticket_delivery_channel, public.communication_channel_readiness_status, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_disable_tenant_channel(uuid, public.ticket_delivery_channel, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_mark_channel_future_ready(uuid, public.ticket_delivery_channel, text, text) from public, anon, authenticated, service_role;
grant execute on function public.rpc_admin_update_tenant_channel_readiness(uuid, public.ticket_delivery_channel, public.communication_channel_readiness_status, text, text, text) to authenticated;
grant execute on function public.rpc_admin_disable_tenant_channel(uuid, public.ticket_delivery_channel, text) to authenticated;
grant execute on function public.rpc_admin_mark_channel_future_ready(uuid, public.ticket_delivery_channel, text, text) to authenticated;

revoke all on public.vw_admin_communication_channel_readiness from public, anon, authenticated, service_role;
revoke all on public.vw_support_tenant_communication_capabilities from public, anon, authenticated, service_role;
revoke all on public.vw_support_ticket_channel_readiness from public, anon, authenticated, service_role;
grant select on public.vw_admin_communication_channel_readiness to authenticated, service_role;
grant select on public.vw_support_tenant_communication_capabilities to authenticated, service_role;
grant select on public.vw_support_ticket_channel_readiness to authenticated, service_role;

comment on table public.communication_channel_definitions is
  'Definicoes globais e sem segredo dos canais de comunicacao. Canais externos ficam futuros/bloqueados ate contrato real de provider.';
comment on table public.tenant_communication_channel_settings is
  'Readiness governado por tenant para canais de comunicacao, sem token, segredo, job externo ou provider fake.';
comment on view public.vw_admin_communication_channel_readiness is
  'Read model administrativo de readiness de canais por tenant, filtrado para platform_admin e sanitizado.';
comment on view public.vw_support_tenant_communication_capabilities is
  'Read model de capacidades de comunicacao por tenant para o suporte, com motivos operacionais de indisponibilidade.';
comment on view public.vw_support_ticket_channel_readiness is
  'Read model de readiness por ticket/canal para o Support Workspace, sem habilitar envio externo.';
comment on function public.rpc_admin_update_tenant_channel_readiness(uuid, public.ticket_delivery_channel, public.communication_channel_readiness_status, text, text, text) is
  'Atualiza readiness governado por tenant. Bloqueia segredos e ativacao de canal externo sem provider real.';
