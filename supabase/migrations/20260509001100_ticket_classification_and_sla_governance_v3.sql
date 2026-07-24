create type public.ticket_reference_status as enum ('active', 'inactive', 'archived');
create type public.ticket_operational_reason_type as enum (
  'classification_update',
  'status_transition',
  'priority_change',
  'resolution',
  'cancellation',
  'reopen'
);
create type public.ticket_sla_status as enum (
  'unavailable',
  'on_track',
  'at_risk',
  'breached',
  'complete'
);

create table public.ticket_categories (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  status public.ticket_reference_status not null default 'active',
  sort_order integer not null default 100,
  created_by_user_id uuid references public.profiles (id),
  updated_by_user_id uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ticket_categories_slug_not_blank_check
    check (nullif(btrim(slug), '') is not null),
  constraint ticket_categories_name_not_blank_check
    check (nullif(btrim(name), '') is not null),
  constraint ticket_categories_slug_format_check
    check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.ticket_operational_reasons (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  reason_type public.ticket_operational_reason_type not null,
  applies_to_status public.ticket_status,
  status public.ticket_reference_status not null default 'active',
  sort_order integer not null default 100,
  created_by_user_id uuid references public.profiles (id),
  updated_by_user_id uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ticket_operational_reasons_slug_not_blank_check
    check (nullif(btrim(slug), '') is not null),
  constraint ticket_operational_reasons_name_not_blank_check
    check (nullif(btrim(name), '') is not null),
  constraint ticket_operational_reasons_slug_format_check
    check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.ticket_sla_policies (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category_id uuid references public.ticket_categories (id),
  priority public.ticket_priority,
  severity public.ticket_severity,
  first_response_minutes integer not null,
  resolution_minutes integer not null,
  business_calendar_key text not null default 'continuous_24x7',
  status public.ticket_reference_status not null default 'active',
  sort_order integer not null default 100,
  created_by_user_id uuid references public.profiles (id),
  updated_by_user_id uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ticket_sla_policies_slug_not_blank_check
    check (nullif(btrim(slug), '') is not null),
  constraint ticket_sla_policies_name_not_blank_check
    check (nullif(btrim(name), '') is not null),
  constraint ticket_sla_policies_slug_format_check
    check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint ticket_sla_policies_minutes_check
    check (first_response_minutes > 0 and resolution_minutes > 0),
  constraint ticket_sla_policies_resolution_after_response_check
    check (resolution_minutes >= first_response_minutes),
  constraint ticket_sla_policies_calendar_not_blank_check
    check (nullif(btrim(business_calendar_key), '') is not null)
);

create index ticket_categories_status_order_idx
  on public.ticket_categories (status, sort_order, name);

create index ticket_operational_reasons_type_status_order_idx
  on public.ticket_operational_reasons (reason_type, status, applies_to_status, sort_order, name);

create index ticket_sla_policies_match_idx
  on public.ticket_sla_policies (status, category_id, priority, severity, sort_order);

alter table public.tickets
  add column category_id uuid references public.ticket_categories (id),
  add column initial_operational_reason_id uuid references public.ticket_operational_reasons (id),
  add column current_operational_reason_id uuid references public.ticket_operational_reasons (id),
  add column sla_policy_id uuid references public.ticket_sla_policies (id),
  add column first_response_due_at timestamptz,
  add column resolution_due_at timestamptz;

create index tickets_category_status_idx
  on public.tickets (tenant_id, category_id, status, updated_at desc);

create index tickets_sla_resolution_idx
  on public.tickets (tenant_id, resolution_due_at, status)
  where resolution_due_at is not null;

create or replace function app_private.resolve_ticket_sla_policy(
  p_category_id uuid,
  p_priority public.ticket_priority,
  p_severity public.ticket_severity
)
returns public.ticket_sla_policies
language sql
stable
security definer
set search_path = ''
as $$
  select p.*
  from public.ticket_sla_policies as p
  where p.status = 'active'::public.ticket_reference_status
    and (p.category_id is null or p.category_id = p_category_id)
    and (p.priority is null or p.priority = p_priority)
    and (p.severity is null or p.severity = p_severity)
  order by
    case when p.category_id is null then 0 else 1 end desc,
    case when p.priority is null then 0 else 1 end desc,
    case when p.severity is null then 0 else 1 end desc,
    p.sort_order asc,
    p.created_at asc
  limit 1;
$$;

create or replace function app_private.ticket_sla_status(
  p_ticket_status public.ticket_status,
  p_resolution_due_at timestamptz
)
returns public.ticket_sla_status
language sql
stable
set search_path = ''
as $$
  select case
    when p_resolution_due_at is null then 'unavailable'::public.ticket_sla_status
    when p_ticket_status = any(array['resolved', 'closed', 'cancelled']::public.ticket_status[]) then 'complete'::public.ticket_sla_status
    when timezone('utc', now()) > p_resolution_due_at then 'breached'::public.ticket_sla_status
    when timezone('utc', now()) > (p_resolution_due_at - interval '1 hour') then 'at_risk'::public.ticket_sla_status
    else 'on_track'::public.ticket_sla_status
  end;
$$;

create or replace function app_private.ticket_sla_status_label(
  p_sla_status public.ticket_sla_status
)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_sla_status
    when 'unavailable' then 'Sem politica definida'
    when 'on_track' then 'Dentro da governanca'
    when 'at_risk' then 'Proximo do limite interno'
    when 'breached' then 'Fora da governanca interna'
    when 'complete' then 'Encerrado para SLA'
  end;
$$;

create or replace function app_private.allowed_next_ticket_statuses(
  p_current_status public.ticket_status
)
returns public.ticket_status[]
language sql
immutable
set search_path = ''
as $$
  select case
    when p_current_status = 'new' then array[
      'triage',
      'waiting_customer',
      'waiting_support',
      'waiting_engineering',
      'in_progress',
      'resolved',
      'cancelled'
    ]::public.ticket_status[]
    when p_current_status = 'triage' then array[
      'waiting_customer',
      'waiting_support',
      'waiting_engineering',
      'in_progress',
      'resolved',
      'cancelled'
    ]::public.ticket_status[]
    when p_current_status = 'waiting_support' then array[
      'triage',
      'waiting_customer',
      'waiting_engineering',
      'in_progress',
      'resolved',
      'cancelled'
    ]::public.ticket_status[]
    when p_current_status = 'waiting_customer' then array[
      'waiting_support',
      'in_progress',
      'resolved',
      'cancelled'
    ]::public.ticket_status[]
    when p_current_status = 'waiting_engineering' then array[
      'waiting_support',
      'in_progress',
      'resolved',
      'cancelled'
    ]::public.ticket_status[]
    when p_current_status = 'in_progress' then array[
      'waiting_customer',
      'waiting_support',
      'waiting_engineering',
      'resolved',
      'cancelled'
    ]::public.ticket_status[]
    when p_current_status = 'resolved' then array[
      'closed',
      'waiting_support',
      'in_progress'
    ]::public.ticket_status[]
    when p_current_status = 'closed' then array[
      'waiting_support'
    ]::public.ticket_status[]
    else array[]::public.ticket_status[]
  end;
$$;

create or replace function app_private.apply_ticket_sla(
  p_ticket public.tickets,
  p_actor_user_id uuid
)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_policy public.ticket_sla_policies;
  v_ticket public.tickets;
begin
  select *
  into v_policy
  from app_private.resolve_ticket_sla_policy(
    p_ticket.category_id,
    p_ticket.priority,
    p_ticket.severity
  );

  update public.tickets
  set
    sla_policy_id = v_policy.id,
    first_response_due_at = case
      when v_policy.id is null then null
      else p_ticket.created_at + make_interval(mins => v_policy.first_response_minutes)
    end,
    resolution_due_at = case
      when v_policy.id is null then null
      else p_ticket.created_at + make_interval(mins => v_policy.resolution_minutes)
    end,
    updated_by_user_id = p_actor_user_id
  where id = p_ticket.id
  returning *
  into v_ticket;

  return v_ticket;
end;
$$;

insert into public.ticket_categories (slug, name, description, sort_order)
values
  ('devolucao-troca', 'Devolucao e troca', 'Solicitacoes B2B ligadas a devolucao, troca, coleta, postagem ou retorno operacional.', 10),
  ('estorno-reembolso', 'Estorno e reembolso', 'Casos B2B de estorno, reembolso, credito e conciliacao financeira operacional.', 20),
  ('integracao-tecnica', 'Integracao tecnica', 'Falhas ou duvidas ligadas a ERP, OMS, ecommerce, API, webhook ou gateway.', 30),
  ('operacao-plataforma', 'Operacao da plataforma', 'Uso operacional, configuracao, fila, administracao ou comportamento funcional da plataforma.', 40),
  ('dados-relatorios', 'Dados e relatorios', 'Divergencias de relatorio, indicadores, conciliacao de dados ou leitura operacional.', 50),
  ('acesso-permissao', 'Acesso e permissao', 'Acesso, perfil, convite, membership ou autorizacao operacional.', 60)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  status = 'active'::public.ticket_reference_status,
  updated_at = timezone('utc', now());

insert into public.ticket_operational_reasons (slug, name, description, reason_type, applies_to_status, sort_order)
values
  ('classificacao-inicial', 'Classificacao inicial', 'Categoria definida no intake ou primeira triagem do ticket.', 'classification_update', null, 10),
  ('classificacao-ajustada', 'Classificacao ajustada', 'Categoria revista apos entendimento operacional do caso.', 'classification_update', null, 20),
  ('aguardando-cliente', 'Aguardando cliente', 'Fluxo depende de informacao, evidencia ou decisao do cliente B2B.', 'status_transition', 'waiting_customer', 30),
  ('aguardando-suporte', 'Aguardando suporte', 'Fluxo voltou para acao interna do suporte.', 'status_transition', 'waiting_support', 40),
  ('aguardando-engenharia', 'Aguardando engenharia', 'Fluxo depende de validacao tecnica estruturada.', 'status_transition', 'waiting_engineering', 50),
  ('em-tratativa', 'Em tratativa', 'Caso esta em execucao operacional ativa.', 'status_transition', 'in_progress', 60),
  ('resolucao-operacional', 'Resolucao operacional', 'Suporte considera a tratativa resolvida para o cliente B2B.', 'status_transition', 'resolved', 70),
  ('cancelamento-operacional', 'Cancelamento operacional', 'Ticket cancelado por duplicidade, perda de objeto ou ausencia de continuidade operacional.', 'status_transition', 'cancelled', 80),
  ('prioridade-ajustada', 'Prioridade ajustada', 'Prioridade ou severidade revista por impacto operacional.', 'priority_change', null, 90),
  ('reabertura-operacional', 'Reabertura operacional', 'Ticket reaberto por nova evidencia ou recorrencia do caso.', 'reopen', 'waiting_support', 100)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  reason_type = excluded.reason_type,
  applies_to_status = excluded.applies_to_status,
  sort_order = excluded.sort_order,
  status = 'active'::public.ticket_reference_status,
  updated_at = timezone('utc', now());

insert into public.ticket_sla_policies (
  slug,
  name,
  description,
  priority,
  severity,
  first_response_minutes,
  resolution_minutes,
  sort_order
)
values
  ('default-low', 'Governanca interna baixa', 'Politica interna padrao para impacto baixo.', 'low', null, 480, 7200, 40),
  ('default-normal', 'Governanca interna normal', 'Politica interna padrao para impacto normal.', 'normal', null, 240, 4320, 30),
  ('default-high', 'Governanca interna alta', 'Politica interna padrao para alto impacto operacional.', 'high', null, 120, 2880, 20),
  ('default-urgent', 'Governanca interna urgente', 'Politica interna padrao para casos urgentes.', 'urgent', null, 30, 1440, 10),
  ('critical-severity', 'Governanca interna critica', 'Politica interna para severidade critica, independente da prioridade.', null, 'critical', 30, 1440, 5)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  priority = excluded.priority,
  severity = excluded.severity,
  first_response_minutes = excluded.first_response_minutes,
  resolution_minutes = excluded.resolution_minutes,
  sort_order = excluded.sort_order,
  status = 'active'::public.ticket_reference_status,
  updated_at = timezone('utc', now());

with resolved_policies as (
  select
    t.id as ticket_id,
    t.created_at,
    p.id as policy_id,
    p.first_response_minutes,
    p.resolution_minutes
  from public.tickets as t
  left join lateral app_private.resolve_ticket_sla_policy(
    t.category_id,
    t.priority,
    t.severity
  ) as p
    on true
  where t.sla_policy_id is null
)
update public.tickets as t
set
  sla_policy_id = rp.policy_id,
  first_response_due_at = case
    when rp.policy_id is null then null
    else rp.created_at + make_interval(mins => rp.first_response_minutes)
  end,
  resolution_due_at = case
    when rp.policy_id is null then null
    else rp.created_at + make_interval(mins => rp.resolution_minutes)
  end
from resolved_policies as rp
where rp.ticket_id = t.id;

create trigger ticket_categories_set_updated_at
before update on public.ticket_categories
for each row
execute function app_private.touch_updated_at();

create trigger ticket_operational_reasons_set_updated_at
before update on public.ticket_operational_reasons
for each row
execute function app_private.touch_updated_at();

create trigger ticket_sla_policies_set_updated_at
before update on public.ticket_sla_policies
for each row
execute function app_private.touch_updated_at();

create trigger ticket_categories_audit_row_change
after insert or update or delete on public.ticket_categories
for each row
execute function audit.capture_row_change();

create trigger ticket_operational_reasons_audit_row_change
after insert or update or delete on public.ticket_operational_reasons
for each row
execute function audit.capture_row_change();

create trigger ticket_sla_policies_audit_row_change
after insert or update or delete on public.ticket_sla_policies
for each row
execute function audit.capture_row_change();

grant select on public.ticket_categories to service_role;
grant select on public.ticket_operational_reasons to service_role;
grant select on public.ticket_sla_policies to service_role;

revoke all on public.ticket_categories from authenticated;
revoke all on public.ticket_operational_reasons from authenticated;
revoke all on public.ticket_sla_policies from authenticated;

alter table public.ticket_categories enable row level security;
alter table public.ticket_operational_reasons enable row level security;
alter table public.ticket_sla_policies enable row level security;

create policy ticket_categories_select_support_controlled
on public.ticket_categories
for select
to authenticated
using (
  app_private.has_global_role('platform_admin'::public.platform_role)
  or app_private.has_any_global_role(
    array['support_agent', 'support_manager']::public.platform_role[]
  )
);

create policy ticket_operational_reasons_select_support_controlled
on public.ticket_operational_reasons
for select
to authenticated
using (
  app_private.has_global_role('platform_admin'::public.platform_role)
  or app_private.has_any_global_role(
    array['support_agent', 'support_manager']::public.platform_role[]
  )
);

create policy ticket_sla_policies_select_support_controlled
on public.ticket_sla_policies
for select
to authenticated
using (
  app_private.has_global_role('platform_admin'::public.platform_role)
  or app_private.has_any_global_role(
    array['support_agent', 'support_manager']::public.platform_role[]
  )
);

create or replace view public.vw_support_ticket_classification_options
with (security_barrier = true)
as
  select
    'category'::text as option_kind,
    c.id as option_id,
    c.slug,
    c.name,
    c.description,
    null::public.ticket_operational_reason_type as reason_type,
    null::public.ticket_status as applies_to_status,
    c.status,
    c.sort_order
  from public.ticket_categories as c
  where c.status = 'active'::public.ticket_reference_status
    and (
      app_private.has_global_role('platform_admin'::public.platform_role)
      or app_private.has_any_global_role(
        array['support_agent', 'support_manager']::public.platform_role[]
      )
    )
  union all
  select
    'operational_reason'::text as option_kind,
    r.id as option_id,
    r.slug,
    r.name,
    r.description,
    r.reason_type,
    r.applies_to_status,
    r.status,
    r.sort_order
  from public.ticket_operational_reasons as r
  where r.status = 'active'::public.ticket_reference_status
    and (
      app_private.has_global_role('platform_admin'::public.platform_role)
      or app_private.has_any_global_role(
        array['support_agent', 'support_manager']::public.platform_role[]
      )
    );

create or replace view public.vw_support_ticket_sla_context
with (security_barrier = true)
as
  select
    t.id as ticket_id,
    t.tenant_id,
    t.sla_policy_id,
    p.name as sla_policy_name,
    p.business_calendar_key as sla_business_calendar_key,
    t.first_response_due_at,
    t.resolution_due_at,
    app_private.ticket_sla_status(t.status, t.resolution_due_at) as sla_status,
    app_private.ticket_sla_status_label(app_private.ticket_sla_status(t.status, t.resolution_due_at)) as sla_status_label,
    (t.sla_policy_id is not null) as is_sla_available,
    'Governanca interna; nao e promessa publica automatica.'::text as sla_reference
  from public.tickets as t
  left join public.ticket_sla_policies as p
    on p.id = t.sla_policy_id
  where app_private.can_access_support_workspace(t.tenant_id);

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
    sla.sla_reference
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
    on sla.ticket_id = q.id;

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
    app_private.allowed_next_ticket_statuses(d.status) as allowed_next_statuses
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
    on sla.ticket_id = d.id;

drop function if exists public.rpc_create_ticket(
  uuid,
  text,
  text,
  public.ticket_source,
  public.ticket_priority,
  public.ticket_severity,
  uuid
);

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

create or replace function public.rpc_support_update_ticket_classification(
  p_ticket_id uuid,
  p_category_id uuid,
  p_operational_reason_id uuid default null,
  p_note text default null
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
  v_category public.ticket_categories;
  v_reason public.ticket_operational_reasons;
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
    raise exception 'rpc_support_update_ticket_classification denied';
  end if;

  select *
  into v_category
  from public.ticket_categories as c
  where c.id = p_category_id
    and c.status = 'active'::public.ticket_reference_status;

  if v_category.id is null then
    raise exception 'ticket category is not active';
  end if;

  if p_operational_reason_id is not null then
    select *
    into v_reason
    from public.ticket_operational_reasons as r
    where r.id = p_operational_reason_id
      and r.reason_type = 'classification_update'::public.ticket_operational_reason_type
      and r.status = 'active'::public.ticket_reference_status;

    if v_reason.id is null then
      raise exception 'ticket operational reason is not valid for classification';
    end if;
  end if;

  update public.tickets
  set
    category_id = p_category_id,
    current_operational_reason_id = coalesce(p_operational_reason_id, current_operational_reason_id),
    updated_by_user_id = v_actor_user_id
  where id = p_ticket_id
  returning *
  into v_ticket;

  v_ticket := app_private.apply_ticket_sla(v_ticket, v_actor_user_id);

  perform app_private.create_ticket_event(
    v_ticket.id,
    v_ticket.tenant_id,
    'classification_changed'::public.ticket_event_type,
    'internal',
    v_actor_user_id,
    jsonb_build_object(
      'previous_category_id', v_existing.category_id,
      'category_id', v_ticket.category_id,
      'operational_reason_id', p_operational_reason_id,
      'note', nullif(btrim(coalesce(p_note, '')), ''),
      'sla_policy_id', v_ticket.sla_policy_id,
      'first_response_due_at', v_ticket.first_response_due_at,
      'resolution_due_at', v_ticket.resolution_due_at
    )
  );

  return v_ticket;
end;
$$;

create or replace function public.rpc_support_update_ticket_priority_severity(
  p_ticket_id uuid,
  p_priority public.ticket_priority,
  p_severity public.ticket_severity,
  p_operational_reason_id uuid default null,
  p_note text default null
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
  v_reason public.ticket_operational_reasons;
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
    raise exception 'rpc_support_update_ticket_priority_severity denied';
  end if;

  if p_operational_reason_id is not null then
    select *
    into v_reason
    from public.ticket_operational_reasons as r
    where r.id = p_operational_reason_id
      and r.reason_type = 'priority_change'::public.ticket_operational_reason_type
      and r.status = 'active'::public.ticket_reference_status;

    if v_reason.id is null then
      raise exception 'ticket operational reason is not valid for priority change';
    end if;
  end if;

  update public.tickets
  set
    priority = p_priority,
    severity = p_severity,
    current_operational_reason_id = coalesce(p_operational_reason_id, current_operational_reason_id),
    updated_by_user_id = v_actor_user_id
  where id = p_ticket_id
  returning *
  into v_ticket;

  v_ticket := app_private.apply_ticket_sla(v_ticket, v_actor_user_id);

  perform app_private.create_ticket_event(
    v_ticket.id,
    v_ticket.tenant_id,
    'priority_changed',
    'internal',
    v_actor_user_id,
    jsonb_build_object(
      'previous_priority', v_existing.priority,
      'priority', v_ticket.priority,
      'previous_severity', v_existing.severity,
      'severity', v_ticket.severity,
      'operational_reason_id', p_operational_reason_id,
      'note', nullif(btrim(coalesce(p_note, '')), ''),
      'sla_policy_id', v_ticket.sla_policy_id,
      'first_response_due_at', v_ticket.first_response_due_at,
      'resolution_due_at', v_ticket.resolution_due_at
    )
  );

  return v_ticket;
end;
$$;

create or replace function public.rpc_support_update_ticket_status_v2(
  p_ticket_id uuid,
  p_status public.ticket_status,
  p_operational_reason_id uuid default null,
  p_note text default null
)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_existing public.tickets;
  v_event_type public.ticket_event_type;
  v_reason public.ticket_operational_reasons;
  v_metadata jsonb;
begin
  v_actor_user_id := app_private.require_active_actor();

  select *
  into v_existing
  from public.tickets as t
  where t.id = p_ticket_id;

  if v_existing.id is null then
    raise exception 'ticket not found';
  end if;

  if not app_private.can_manage_ticket(v_existing.tenant_id) then
    raise exception 'rpc_support_update_ticket_status_v2 denied';
  end if;

  if p_status = 'closed' then
    raise exception 'use rpc_close_ticket for closed status';
  end if;

  if v_existing.status = any(array['resolved', 'closed']::public.ticket_status[])
     and p_status = 'waiting_support' then
    raise exception 'use rpc_reopen_ticket to reopen ticket';
  end if;

  if p_status = any(array['waiting_customer', 'waiting_engineering', 'resolved', 'cancelled']::public.ticket_status[])
     and p_operational_reason_id is null then
    raise exception 'operational reason is required for this status transition';
  end if;

  if p_operational_reason_id is not null then
    select *
    into v_reason
    from public.ticket_operational_reasons as r
    where r.id = p_operational_reason_id
      and r.reason_type = 'status_transition'::public.ticket_operational_reason_type
      and r.status = 'active'::public.ticket_reference_status
      and (r.applies_to_status is null or r.applies_to_status = p_status);

    if v_reason.id is null then
      raise exception 'ticket operational reason is not valid for this status transition';
    end if;
  end if;

  v_event_type := case
    when p_status = 'resolved' then 'resolved'::public.ticket_event_type
    when p_status = 'cancelled' then 'cancelled'::public.ticket_event_type
    else 'status_changed'::public.ticket_event_type
  end;

  v_metadata := jsonb_build_object(
    'operational_reason_id', p_operational_reason_id,
    'operational_reason_name', v_reason.name,
    'note', nullif(btrim(coalesce(p_note, '')), '')
  );

  update public.tickets
  set
    current_operational_reason_id = coalesce(p_operational_reason_id, current_operational_reason_id),
    updated_by_user_id = v_actor_user_id
  where id = p_ticket_id;

  return app_private.transition_ticket_status(
    p_ticket_id,
    v_actor_user_id,
    p_status,
    v_event_type,
    v_metadata
  );
end;
$$;

revoke all on function app_private.resolve_ticket_sla_policy(uuid, public.ticket_priority, public.ticket_severity) from public, anon, authenticated, service_role;
revoke all on function app_private.ticket_sla_status(public.ticket_status, timestamptz) from public, anon, authenticated, service_role;
revoke all on function app_private.ticket_sla_status_label(public.ticket_sla_status) from public, anon, authenticated, service_role;
revoke all on function app_private.allowed_next_ticket_statuses(public.ticket_status) from public, anon, authenticated, service_role;
revoke all on function app_private.apply_ticket_sla(public.tickets, uuid) from public, anon, authenticated, service_role;

grant execute on function app_private.resolve_ticket_sla_policy(uuid, public.ticket_priority, public.ticket_severity) to authenticated, service_role;
grant execute on function app_private.ticket_sla_status(public.ticket_status, timestamptz) to authenticated, service_role;
grant execute on function app_private.ticket_sla_status_label(public.ticket_sla_status) to authenticated, service_role;
grant execute on function app_private.allowed_next_ticket_statuses(public.ticket_status) to authenticated, service_role;

revoke all on function public.rpc_create_ticket(uuid, text, text, public.ticket_source, public.ticket_priority, public.ticket_severity, uuid, uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_support_update_ticket_classification(uuid, uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_support_update_ticket_priority_severity(uuid, public.ticket_priority, public.ticket_severity, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_support_update_ticket_status_v2(uuid, public.ticket_status, uuid, text) from public, anon, authenticated, service_role;

grant execute on function public.rpc_create_ticket(uuid, text, text, public.ticket_source, public.ticket_priority, public.ticket_severity, uuid, uuid, uuid) to authenticated;
grant execute on function public.rpc_support_update_ticket_classification(uuid, uuid, uuid, text) to authenticated;
grant execute on function public.rpc_support_update_ticket_priority_severity(uuid, public.ticket_priority, public.ticket_severity, uuid, text) to authenticated;
grant execute on function public.rpc_support_update_ticket_status_v2(uuid, public.ticket_status, uuid, text) to authenticated;

revoke all on public.vw_support_ticket_classification_options from public, anon, authenticated, service_role;
revoke all on public.vw_support_ticket_sla_context from public, anon, authenticated, service_role;
revoke all on public.vw_support_tickets_queue from public, anon, authenticated, service_role;
revoke all on public.vw_support_ticket_detail from public, anon, authenticated, service_role;

grant select on public.vw_support_ticket_classification_options to authenticated, service_role;
grant select on public.vw_support_ticket_sla_context to authenticated, service_role;
grant select on public.vw_support_tickets_queue to authenticated, service_role;
grant select on public.vw_support_ticket_detail to authenticated, service_role;

comment on table public.ticket_categories is
  'Categorias operacionais globais de ticket B2B. Nao se confundem com categorias de Knowledge.';
comment on table public.ticket_operational_reasons is
  'Motivos operacionais auditaveis para classificacao, prioridade e transicao de status.';
comment on table public.ticket_sla_policies is
  'Politicas internas de governanca de SLA. Nao representam promessa publica automatica.';
comment on view public.vw_support_ticket_classification_options is
  'Read model seguro com categorias e motivos operacionais ativos para o Support Workspace.';
comment on view public.vw_support_ticket_sla_context is
  'Contexto de SLA interno derivado no backend por ticket acessivel ao suporte.';
comment on function public.rpc_support_update_ticket_classification(uuid, uuid, uuid, text) is
  'Atualiza classificacao operacional do ticket, recalcula SLA e registra evento/auditoria.';
comment on function public.rpc_support_update_ticket_priority_severity(uuid, public.ticket_priority, public.ticket_severity, uuid, text) is
  'Atualiza prioridade/severidade do ticket por RPC, recalcula SLA e registra evento/auditoria.';
comment on function public.rpc_support_update_ticket_status_v2(uuid, public.ticket_status, uuid, text) is
  'Altera status com motivo operacional quando exigido e transicao validada no backend.';
