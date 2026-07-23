-- Contrato operacional de Carteira CS.
-- Mantem o seed CS Ops como fonte de QA, mas cria um modelo editavel,
-- auditavel e com proveniencia para a operacao real.

create table public.cs_customer_portfolio_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  portfolio_name text not null default 'Carteira principal',
  assignment_status text not null default 'active',
  owner_user_id uuid references public.profiles (id) on delete set null,
  cluster_key text,
  service_model text,
  contact_frequency text,
  health_status text,
  priority text,
  notes text,
  source text not null default 'manual',
  source_record_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid not null references public.profiles (id),
  updated_by_user_id uuid not null references public.profiles (id),
  constraint cs_customer_portfolio_assignment_tenant_unique unique (tenant_id),
  constraint cs_customer_portfolio_assignment_status_check
    check (assignment_status in ('active', 'paused', 'archived')),
  constraint cs_customer_portfolio_assignment_name_check
    check (nullif(btrim(portfolio_name), '') is not null and char_length(portfolio_name) <= 160),
  constraint cs_customer_portfolio_assignment_text_check
    check (
      (cluster_key is null or char_length(cluster_key) <= 120)
      and (service_model is null or char_length(service_model) <= 120)
      and (contact_frequency is null or char_length(contact_frequency) <= 120)
      and (health_status is null or char_length(health_status) <= 40)
      and (priority is null or char_length(priority) <= 40)
      and (notes is null or char_length(notes) <= 1200)
      and char_length(source) <= 120
      and (source_record_id is null or char_length(source_record_id) <= 240)
    )
);

create index cs_customer_portfolio_assignment_owner_idx
  on public.cs_customer_portfolio_assignments (owner_user_id, assignment_status)
  where owner_user_id is not null;

create index cs_customer_portfolio_assignment_scope_idx
  on public.cs_customer_portfolio_assignments (assignment_status, priority, health_status, updated_at desc);

create table public.cs_customer_portfolio_assignment_history (
  id uuid primary key default extensions.gen_random_uuid(),
  portfolio_assignment_id uuid not null,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  operation text not null,
  changed_at timestamptz not null default timezone('utc', now()),
  changed_by_user_id uuid references public.profiles (id) on delete set null,
  before_state jsonb,
  after_state jsonb,
  constraint cs_customer_portfolio_assignment_history_operation_check
    check (operation in ('insert', 'update', 'delete')),
  constraint cs_customer_portfolio_assignment_history_states_check
    check (before_state is not null or after_state is not null)
);

create index cs_customer_portfolio_assignment_history_lookup_idx
  on public.cs_customer_portfolio_assignment_history (tenant_id, changed_at desc);

create or replace function app_private.assert_cs_portfolio_text(
  field_name text,
  field_value text,
  max_length integer,
  allow_null boolean default true
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if field_value is null and allow_null then
    return null;
  end if;

  if field_value is null or nullif(btrim(field_value), '') is null then
    raise exception '% must not be blank', field_name;
  end if;

  if char_length(field_value) > max_length then
    raise exception '% exceeds % characters', field_name, max_length;
  end if;

  if app_private.contains_secret_like_text(array[field_value]) then
    raise exception '% cannot contain secrets or credentials', field_name;
  end if;

  return btrim(field_value);
end;
$$;

create or replace function app_private.can_manage_cs_customer_portfolio(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    app_private.has_global_role('platform_admin'::public.platform_role)
    or exists (
      select 1
      from public.internal_area_memberships as membership
      join public.tenant_memberships as tenant_membership
        on tenant_membership.tenant_id = membership.tenant_id
       and tenant_membership.user_id = membership.user_id
       and tenant_membership.status = 'active'::public.membership_status
      join public.profiles as profile
        on profile.id = membership.user_id
       and profile.is_active
      where membership.tenant_id = target_tenant_id
        and membership.user_id = auth.uid()
        and membership.area_key = 'customer_success'
        and membership.role = 'manager'::public.internal_area_membership_role
        and membership.status = 'active'::public.internal_area_membership_status
    );
$$;

create or replace function app_private.assert_cs_portfolio_owner(
  target_tenant_id uuid,
  target_owner_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_owner_user_id is null then
    return null;
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    join public.internal_area_memberships as membership
      on membership.user_id = profile.id
     and membership.tenant_id = target_tenant_id
     and membership.area_key = 'customer_success'
     and membership.status = 'active'::public.internal_area_membership_status
    where profile.id = target_owner_user_id
      and profile.is_active
  ) then
    raise exception 'CS owner must be an active profile with Customer Success membership for this tenant';
  end if;

  return target_owner_user_id;
end;
$$;

create or replace function app_private.snapshot_cs_customer_portfolio_assignment(
  value public.cs_customer_portfolio_assignments
)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', value.id,
    'tenantId', value.tenant_id,
    'portfolioName', value.portfolio_name,
    'assignmentStatus', value.assignment_status,
    'ownerUserId', value.owner_user_id,
    'clusterKey', value.cluster_key,
    'serviceModel', value.service_model,
    'contactFrequency', value.contact_frequency,
    'healthStatus', value.health_status,
    'priority', value.priority,
    'notes', value.notes,
    'source', value.source,
    'sourceRecordId', value.source_record_id
  );
$$;

create or replace function app_private.capture_cs_customer_portfolio_assignment_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.cs_customer_portfolio_assignment_history (
    portfolio_assignment_id,
    tenant_id,
    operation,
    changed_by_user_id,
    before_state,
    after_state
  )
  values (
    coalesce(new.id, old.id),
    coalesce(new.tenant_id, old.tenant_id),
    lower(tg_op),
    coalesce(new.updated_by_user_id, old.updated_by_user_id, auth.uid()),
    case when tg_op in ('UPDATE', 'DELETE') then app_private.snapshot_cs_customer_portfolio_assignment(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then app_private.snapshot_cs_customer_portfolio_assignment(new) end
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger cs_customer_portfolio_assignment_touch_updated_at
before update on public.cs_customer_portfolio_assignments
for each row execute function app_private.touch_updated_at();

create trigger cs_customer_portfolio_assignment_audit_row_change
after insert or update or delete on public.cs_customer_portfolio_assignments
for each row execute function audit.capture_row_change();

create trigger cs_customer_portfolio_assignment_history
after insert or update or delete on public.cs_customer_portfolio_assignments
for each row execute function app_private.capture_cs_customer_portfolio_assignment_history();

alter table public.cs_customer_portfolio_assignments enable row level security;
alter table public.cs_customer_portfolio_assignment_history enable row level security;

create policy cs_customer_portfolio_assignment_select
  on public.cs_customer_portfolio_assignments
  for select
  using (app_private.can_access_cs_customer_portfolio(tenant_id));

revoke all on public.cs_customer_portfolio_assignments from public, anon, authenticated, service_role;
revoke all on public.cs_customer_portfolio_assignment_history from public, anon, authenticated, service_role;
grant select on public.cs_customer_portfolio_assignments to authenticated, service_role;
grant select on public.cs_customer_portfolio_assignment_history to service_role;

create or replace function public.rpc_admin_upsert_cs_customer_portfolio(
  p_tenant_id uuid,
  p_portfolio_name text default 'Carteira principal',
  p_assignment_status text default 'active',
  p_owner_user_id uuid default null,
  p_cluster_key text default null,
  p_service_model text default null,
  p_contact_frequency text default null,
  p_health_status text default null,
  p_priority text default null,
  p_notes text default null,
  p_source text default 'manual',
  p_source_record_id text default null
)
returns public.cs_customer_portfolio_assignments
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid;
  result_row public.cs_customer_portfolio_assignments;
begin
  actor_user_id := auth.uid();

  if actor_user_id is null or not app_private.can_manage_cs_customer_portfolio(p_tenant_id) then
    raise exception 'not authorized to manage CS portfolio';
  end if;

  if not exists (select 1 from public.tenants where id = p_tenant_id) then
    raise exception 'tenant not found';
  end if;

  if p_assignment_status not in ('active', 'paused', 'archived') then
    raise exception 'invalid CS portfolio assignment status';
  end if;

  insert into public.cs_customer_portfolio_assignments (
    tenant_id,
    portfolio_name,
    assignment_status,
    owner_user_id,
    cluster_key,
    service_model,
    contact_frequency,
    health_status,
    priority,
    notes,
    source,
    source_record_id,
    created_by_user_id,
    updated_by_user_id
  )
  values (
    p_tenant_id,
    app_private.assert_cs_portfolio_text('portfolio_name', p_portfolio_name, 160, false),
    p_assignment_status,
    app_private.assert_cs_portfolio_owner(p_tenant_id, p_owner_user_id),
    app_private.assert_cs_portfolio_text('cluster_key', p_cluster_key, 120),
    app_private.assert_cs_portfolio_text('service_model', p_service_model, 120),
    app_private.assert_cs_portfolio_text('contact_frequency', p_contact_frequency, 120),
    app_private.assert_cs_portfolio_text('health_status', p_health_status, 40),
    app_private.assert_cs_portfolio_text('priority', p_priority, 40),
    app_private.assert_cs_portfolio_text('notes', p_notes, 1200),
    app_private.assert_cs_portfolio_text('source', p_source, 120, false),
    app_private.assert_cs_portfolio_text('source_record_id', p_source_record_id, 240),
    actor_user_id,
    actor_user_id
  )
  on conflict (tenant_id)
  do update set
    portfolio_name = excluded.portfolio_name,
    assignment_status = excluded.assignment_status,
    owner_user_id = excluded.owner_user_id,
    cluster_key = excluded.cluster_key,
    service_model = excluded.service_model,
    contact_frequency = excluded.contact_frequency,
    health_status = excluded.health_status,
    priority = excluded.priority,
    notes = excluded.notes,
    source = excluded.source,
    source_record_id = excluded.source_record_id,
    updated_by_user_id = actor_user_id
  returning * into result_row;

  return result_row;
end;
$$;

revoke all on function app_private.assert_cs_portfolio_text(text, text, integer, boolean) from public, anon, authenticated, service_role;
revoke all on function app_private.can_manage_cs_customer_portfolio(uuid) from public, anon, authenticated, service_role;
revoke all on function app_private.assert_cs_portfolio_owner(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function app_private.snapshot_cs_customer_portfolio_assignment(public.cs_customer_portfolio_assignments) from public, anon, authenticated, service_role;
revoke all on function app_private.capture_cs_customer_portfolio_assignment_history() from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_upsert_cs_customer_portfolio(uuid, text, text, uuid, text, text, text, text, text, text, text, text) from public, anon, authenticated, service_role;

grant execute on function app_private.assert_cs_portfolio_text(text, text, integer, boolean) to service_role;
grant execute on function app_private.can_manage_cs_customer_portfolio(uuid) to authenticated, service_role;
grant execute on function app_private.assert_cs_portfolio_owner(uuid, uuid) to service_role;
grant execute on function app_private.snapshot_cs_customer_portfolio_assignment(public.cs_customer_portfolio_assignments) to service_role;
grant execute on function app_private.capture_cs_customer_portfolio_assignment_history() to service_role;
grant execute on function public.rpc_admin_upsert_cs_customer_portfolio(uuid, text, text, uuid, text, text, text, text, text, text, text, text) to authenticated;

alter view public.vw_cs_customer_portfolio rename to vw_cs_customer_portfolio_base;
revoke all on public.vw_cs_customer_portfolio_base from public, anon, authenticated, service_role;
grant select on public.vw_cs_customer_portfolio_base to service_role;

create view public.vw_cs_customer_portfolio
with (security_barrier = true)
as
  select
    base.*,
    assignment.id as portfolio_assignment_id,
    coalesce(assignment.portfolio_name, 'Sem carteira definida') as portfolio_name,
    coalesce(assignment.assignment_status, 'unconfigured') as portfolio_assignment_status,
    assignment.owner_user_id as portfolio_owner_user_id,
    assignment.cluster_key as portfolio_cluster_key,
    assignment.service_model as portfolio_service_model,
    assignment.contact_frequency as portfolio_contact_frequency,
    assignment.health_status as portfolio_health_status,
    assignment.priority as portfolio_priority,
    assignment.source as portfolio_source,
    assignment.updated_at as portfolio_updated_at,
    portfolio_owner.full_name as portfolio_owner_full_name,
    portfolio_owner.email as portfolio_owner_email
  from (
    select * from public.vw_cs_customer_portfolio_base
  ) as base
  left join public.cs_customer_portfolio_assignments as assignment
    on assignment.tenant_id = base.tenant_id
  left join public.profiles as portfolio_owner
    on portfolio_owner.id = assignment.owner_user_id;

revoke all on public.vw_cs_customer_portfolio from public, anon, authenticated, service_role;
grant select on public.vw_cs_customer_portfolio to authenticated, service_role;

comment on table public.cs_customer_portfolio_assignments is
  'Carteira CS operacional editavel por cliente. Atribuicao, cadencia, saude e prioridade com proveniencia e historico.';

comment on table public.cs_customer_portfolio_assignment_history is
  'Historico imutavel das alteracoes da Carteira CS; nao e read model de frontend.';
