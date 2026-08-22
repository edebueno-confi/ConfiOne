-- Customer Operations and Migration Domain V1
--
-- Camada backend-only para cadastro operacional, origens, lojas, inventario,
-- projetos e migracoes. `tenants` continua sendo o cliente/conta operacional.
-- After Sale V1 e Genius sao origens distintas. Nenhuma rotina deste arquivo
-- acessa ou escreve sistemas externos.

create type public.customer_source_product as enum ('after_sale', 'genius');
create type public.customer_source_version as enum ('v1', 'current');
create type public.customer_source_status as enum ('identified', 'confirmed', 'inactive');
create type public.customer_store_status as enum ('identified', 'active', 'inactive', 'archived');
create type public.customer_inventory_snapshot_status as enum ('received', 'sanitized', 'accepted', 'rejected', 'superseded');
create type public.customer_feature_contract_status as enum ('unknown', 'contracted', 'not_contracted');
create type public.customer_feature_boss_status as enum ('unknown', 'enabled', 'disabled', 'not_applicable');
create type public.customer_feature_observed_status as enum ('unknown', 'configured', 'found', 'not_found', 'unavailable', 'stale');
create type public.customer_feature_usage_status as enum ('unknown', 'confirmed', 'not_confirmed');
create type public.customer_evidence_type as enum ('html', 'capture', 'json_sanitized', 'csv', 'spreadsheet', 'snapshot', 'report', 'source_evidence', 'boss_evidence', 'genius_evidence', 'target_post_save');
create type public.customer_sanitization_status as enum ('pending', 'sanitized', 'rejected');
create type public.customer_project_type as enum ('migration', 'implementation', 'integration', 'expansion', 'other');
create type public.customer_project_status as enum ('draft', 'inventory_pending', 'inventory_in_progress', 'inventory_ready', 'eligibility_pending', 'eligible', 'eligible_with_restrictions', 'standby', 'planned', 'awaiting_approval', 'ready_to_execute', 'running', 'validating', 'completed', 'blocked', 'cancelled');
create type public.customer_project_risk_level as enum ('low', 'medium', 'high', 'critical');
create type public.customer_migration_eligibility_status as enum ('pending', 'eligible', 'eligible_with_restrictions', 'ineligible', 'stale');
create type public.customer_migration_approval_status as enum ('pending', 'approved', 'rejected', 'revoked');
create type public.customer_migration_execution_status as enum ('not_requested', 'requested', 'running', 'completed', 'failed', 'cancelled');
create type public.customer_migration_validation_status as enum ('validated', 'validated_with_reservation', 'divergent', 'not_validated', 'interrupted');
create type public.customer_project_comment_kind as enum ('operational_comment', 'internal_note', 'migration_decision');
create type public.customer_project_activity_type as enum ('status_change', 'assignment_change', 'deadline_change', 'dependency_change', 'eligibility_change', 'approval_change', 'execution_change', 'validation_change', 'system');

create or replace function app_private.can_read_customer_operations()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active
  ) and (
    app_private.has_global_role('platform_admin'::public.platform_role)
    or app_private.has_global_role('engineering_manager'::public.platform_role)
    or app_private.has_global_role('engineering_member'::public.platform_role)
    or app_private.has_global_role('support_manager'::public.platform_role)
  );
$$;

create or replace function app_private.require_customer_operations_admin()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
begin
  v_actor := app_private.require_active_actor();
  if not (
    app_private.has_global_role('platform_admin'::public.platform_role)
    or app_private.has_global_role('engineering_manager'::public.platform_role)
  ) then
    raise exception 'customer operations administrator required';
  end if;
  return v_actor;
end;
$$;

create or replace function app_private.customer_migration_project_status_is_valid_transition(
  p_from public.customer_project_status,
  p_to public.customer_project_status
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_from = p_to
    or (p_from = 'draft' and p_to in ('inventory_pending', 'cancelled'))
    or (p_from = 'inventory_pending' and p_to in ('inventory_in_progress', 'standby', 'blocked', 'cancelled'))
    or (p_from = 'inventory_in_progress' and p_to in ('inventory_ready', 'standby', 'blocked', 'cancelled'))
    or (p_from = 'inventory_ready' and p_to in ('eligibility_pending', 'standby', 'blocked', 'cancelled'))
    or (p_from = 'eligibility_pending' and p_to in ('eligible', 'eligible_with_restrictions', 'standby', 'blocked', 'cancelled'))
    or (p_from in ('eligible', 'eligible_with_restrictions') and p_to in ('planned', 'awaiting_approval', 'standby', 'blocked', 'cancelled'))
    or (p_from = 'planned' and p_to in ('awaiting_approval', 'standby', 'blocked', 'cancelled'))
    or (p_from = 'awaiting_approval' and p_to in ('ready_to_execute', 'standby', 'blocked', 'cancelled'))
    or (p_from = 'ready_to_execute' and p_to in ('running', 'standby', 'blocked', 'cancelled'))
    or (p_from = 'running' and p_to in ('validating', 'blocked', 'cancelled'))
    or (p_from = 'validating' and p_to in ('completed', 'running', 'blocked'))
    or (p_from = 'standby' and p_to in ('planned', 'eligibility_pending', 'cancelled'))
    or (p_from = 'blocked' and p_to in ('inventory_pending', 'eligibility_pending', 'planned', 'cancelled'));
$$;

create table public.customer_account_sources (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  source_product public.customer_source_product not null,
  source_version public.customer_source_version not null,
  source_system text not null,
  source_external_id text,
  status public.customer_source_status not null default 'identified',
  target_product text not null default 'after_sale',
  target_version text not null default 'v2',
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid not null references public.profiles (id),
  updated_by_user_id uuid not null references public.profiles (id),
  constraint customer_account_sources_target_check check (target_product = 'after_sale' and target_version = 'v2'),
  constraint customer_account_sources_system_check check (nullif(btrim(source_system), '') is not null),
  constraint customer_account_sources_notes_safe_check check (notes is null or app_private.customer_account_text_is_safe(notes))
);

create unique index customer_account_sources_identity_key
  on public.customer_account_sources (tenant_id, source_product, source_version, lower(source_system), coalesce(source_external_id, ''));
create index customer_account_sources_tenant_idx on public.customer_account_sources (tenant_id, status, source_product);

create table public.customer_account_stores (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  source_id uuid not null references public.customer_account_sources (id) on delete restrict,
  external_store_id text not null,
  display_name text not null,
  platform_name text,
  status public.customer_store_status not null default 'identified',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid not null references public.profiles (id),
  updated_by_user_id uuid not null references public.profiles (id),
  constraint customer_account_stores_external_id_check check (nullif(btrim(external_store_id), '') is not null),
  constraint customer_account_stores_display_name_check check (nullif(btrim(display_name), '') is not null),
  constraint customer_account_stores_notes_safe_check check (notes is null or app_private.customer_account_text_is_safe(notes))
);

create unique index customer_account_stores_source_identity_key
  on public.customer_account_stores (source_id, lower(external_store_id));
create index customer_account_stores_tenant_idx on public.customer_account_stores (tenant_id, status, display_name);

create or replace function app_private.guard_customer_store_source()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_source_tenant uuid;
begin
  select s.tenant_id into v_source_tenant from public.customer_account_sources s where s.id = new.source_id;
  if v_source_tenant is null or v_source_tenant <> new.tenant_id then
    raise exception 'store and source must belong to the same client';
  end if;
  return new;
end;
$$;

create table public.customer_inventory_snapshots (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  source_id uuid not null references public.customer_account_sources (id) on delete restrict,
  store_id uuid not null references public.customer_account_stores (id) on delete restrict,
  source_system text not null,
  schema_version text not null,
  catalog_version text not null,
  extracted_at timestamptz not null,
  received_at timestamptz not null default timezone('utc', now()),
  fingerprint text not null,
  package_manifest jsonb not null default '{}'::jsonb,
  status public.customer_inventory_snapshot_status not null default 'received',
  sanitized boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid not null references public.profiles (id),
  constraint customer_inventory_snapshots_source_check check (nullif(btrim(source_system), '') is not null),
  constraint customer_inventory_snapshots_version_check check (nullif(btrim(schema_version), '') is not null and nullif(btrim(catalog_version), '') is not null),
  constraint customer_inventory_snapshots_fingerprint_check check (nullif(btrim(fingerprint), '') is not null),
  constraint customer_inventory_snapshots_manifest_check check (jsonb_typeof(package_manifest) = 'object'),
  constraint customer_inventory_snapshots_notes_safe_check check (notes is null or app_private.customer_account_text_is_safe(notes))
);

create unique index customer_inventory_snapshots_store_fingerprint_key
  on public.customer_inventory_snapshots (store_id, fingerprint);
create index customer_inventory_snapshots_store_time_idx on public.customer_inventory_snapshots (store_id, extracted_at desc);

create table public.customer_inventory_feature_observations (
  id uuid primary key default extensions.gen_random_uuid(),
  snapshot_id uuid not null references public.customer_inventory_snapshots (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  store_id uuid not null references public.customer_account_stores (id) on delete cascade,
  source_product public.customer_source_product not null,
  source_version public.customer_source_version not null,
  domain text not null,
  feature_key text not null,
  feature_name text not null,
  feature_description text,
  contracted_status public.customer_feature_contract_status not null default 'unknown',
  boss_enabled_status public.customer_feature_boss_status not null default 'not_applicable',
  observed_status public.customer_feature_observed_status not null default 'unknown',
  usage_status public.customer_feature_usage_status not null default 'unknown',
  confidence text not null default 'unverified',
  evidence_id uuid,
  observed_at timestamptz not null,
  catalog_version text not null,
  fingerprint text not null,
  notes text,
  constraint customer_inventory_feature_domain_check check (nullif(btrim(domain), '') is not null),
  constraint customer_inventory_feature_key_check check (nullif(btrim(feature_key), '') is not null),
  constraint customer_inventory_feature_name_check check (nullif(btrim(feature_name), '') is not null),
  constraint customer_inventory_feature_confidence_check check (confidence in ('high', 'medium', 'low', 'unverified')),
  constraint customer_inventory_feature_notes_safe_check check (notes is null or app_private.customer_account_text_is_safe(notes))
);

create unique index customer_inventory_feature_snapshot_key
  on public.customer_inventory_feature_observations (snapshot_id, lower(feature_key));
create index customer_inventory_feature_store_idx on public.customer_inventory_feature_observations (store_id, observed_at desc, domain);

create table public.customer_operation_evidence (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  store_id uuid references public.customer_account_stores (id) on delete set null,
  source_id uuid references public.customer_account_sources (id) on delete set null,
  inventory_snapshot_id uuid references public.customer_inventory_snapshots (id) on delete set null,
  project_id uuid,
  evidence_type public.customer_evidence_type not null,
  storage_bucket text not null,
  storage_path text not null,
  fingerprint text not null,
  sanitized_status public.customer_sanitization_status not null default 'pending',
  captured_at timestamptz not null,
  captured_by_user_id uuid references public.profiles (id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint customer_operation_evidence_private_path_check check (nullif(btrim(storage_bucket), '') is not null and nullif(btrim(storage_path), '') is not null and storage_path !~* '(password|token|secret|cookie|jwt|service.role)'),
  constraint customer_operation_evidence_metadata_check check (jsonb_typeof(metadata) = 'object')
);

create unique index customer_operation_evidence_fingerprint_key
  on public.customer_operation_evidence (tenant_id, fingerprint);
create index customer_operation_evidence_project_idx on public.customer_operation_evidence (project_id, captured_at desc);

create table public.customer_projects (
  id uuid primary key default extensions.gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_type public.customer_project_type not null,
  name text not null,
  description text,
  source_id uuid references public.customer_account_sources (id) on delete restrict,
  owner_user_id uuid references public.profiles (id),
  csm_user_id uuid references public.profiles (id),
  priority integer not null default 3 check (priority between 1 and 5),
  deadline date,
  status public.customer_project_status not null default 'draft',
  risk_level public.customer_project_risk_level not null default 'low',
  next_action text,
  dependencies jsonb not null default '[]'::jsonb,
  standby_reason text,
  blocked_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid not null references public.profiles (id),
  updated_by_user_id uuid not null references public.profiles (id),
  constraint customer_projects_name_check check (nullif(btrim(name), '') is not null),
  constraint customer_projects_name_safe_check check (app_private.customer_account_text_is_safe(name)),
  constraint customer_projects_description_safe_check check (description is null or app_private.customer_account_text_is_safe(description)),
  constraint customer_projects_dependencies_check check (jsonb_typeof(dependencies) = 'array'),
  constraint customer_projects_standby_reason_check check (status <> 'standby' or nullif(btrim(standby_reason), '') is not null),
  constraint customer_projects_blocked_reason_check check (status <> 'blocked' or nullif(btrim(blocked_reason), '') is not null)
);

create index customer_projects_tenant_status_idx on public.customer_projects (tenant_id, status, priority, deadline);
create index customer_projects_owner_idx on public.customer_projects (owner_user_id, status);

create table public.customer_migration_projects (
  project_id uuid primary key references public.customer_projects (id) on delete cascade,
  source_product public.customer_source_product not null,
  source_version public.customer_source_version not null,
  target_product text not null default 'after_sale',
  target_version text not null default 'v2',
  source_adapter text not null,
  inventory_snapshot_id uuid references public.customer_inventory_snapshots (id) on delete restrict,
  eligibility_status public.customer_migration_eligibility_status not null default 'pending',
  approval_status public.customer_migration_approval_status not null default 'pending',
  execution_status public.customer_migration_execution_status not null default 'not_requested',
  batch_id uuid,
  wave_id uuid,
  standby_reason text,
  blocked_reason text,
  constraint customer_migration_targets_check check (target_product = 'after_sale' and target_version = 'v2'),
  constraint customer_migration_adapter_check check (nullif(btrim(source_adapter), '') is not null),
  constraint customer_migration_standby_check check (standby_reason is null or nullif(btrim(standby_reason), '') is not null),
  constraint customer_migration_blocked_check check (blocked_reason is null or nullif(btrim(blocked_reason), '') is not null)
);

create table public.customer_migration_project_stores (
  project_id uuid not null references public.customer_migration_projects (project_id) on delete cascade,
  store_id uuid not null references public.customer_account_stores (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid not null references public.profiles (id),
  primary key (project_id, store_id)
);

create table public.customer_migration_eligibility_evaluations (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.customer_migration_projects (project_id) on delete cascade,
  result public.customer_migration_eligibility_status not null,
  criteria jsonb not null default '{}'::jsonb,
  pending_items jsonb not null default '[]'::jsonb,
  limitations jsonb not null default '[]'::jsonb,
  catalog_version text not null,
  inventory_snapshot_id uuid references public.customer_inventory_snapshots (id) on delete restrict,
  evaluated_at timestamptz not null default timezone('utc', now()),
  evaluated_by_user_id uuid not null references public.profiles (id),
  evidence_id uuid references public.customer_operation_evidence (id) on delete set null,
  constraint customer_migration_eligibility_criteria_check check (jsonb_typeof(criteria) = 'object' and jsonb_typeof(pending_items) = 'array' and jsonb_typeof(limitations) = 'array')
);

create index customer_migration_eligibility_latest_idx on public.customer_migration_eligibility_evaluations (project_id, evaluated_at desc);

create table public.customer_migration_batches (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  description text,
  priority integer not null default 3 check (priority between 1 and 5),
  owner_user_id uuid references public.profiles (id),
  period_start date,
  period_end date,
  status text not null default 'draft',
  dependencies jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid not null references public.profiles (id),
  updated_by_user_id uuid not null references public.profiles (id),
  constraint customer_migration_batches_name_check check (nullif(btrim(name), '') is not null),
  constraint customer_migration_batches_status_check check (status in ('draft', 'planned', 'running', 'completed', 'cancelled')),
  constraint customer_migration_batches_period_check check (period_end is null or period_start is null or period_end >= period_start),
  constraint customer_migration_batches_dependencies_check check (jsonb_typeof(dependencies) = 'array')
);

create table public.customer_migration_waves (
  id uuid primary key default extensions.gen_random_uuid(),
  batch_id uuid not null references public.customer_migration_batches (id) on delete cascade,
  name text not null,
  position integer not null check (position > 0),
  status text not null default 'planned',
  scheduled_for date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid not null references public.profiles (id),
  constraint customer_migration_waves_name_check check (nullif(btrim(name), '') is not null),
  constraint customer_migration_waves_status_check check (status in ('planned', 'running', 'completed', 'cancelled')),
  unique (batch_id, position)
);

create unique index customer_migration_waves_name_key
  on public.customer_migration_waves (batch_id, lower(name));

create table public.customer_migration_batch_items (
  id uuid primary key default extensions.gen_random_uuid(),
  batch_id uuid not null references public.customer_migration_batches (id) on delete cascade,
  wave_id uuid references public.customer_migration_waves (id) on delete set null,
  project_id uuid not null references public.customer_migration_projects (project_id) on delete restrict,
  store_id uuid not null references public.customer_account_stores (id) on delete restrict,
  position integer not null default 1 check (position > 0),
  status text not null default 'planned',
  created_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid not null references public.profiles (id),
  constraint customer_migration_batch_items_status_check check (status in ('planned', 'ready', 'running', 'completed', 'blocked', 'cancelled')),
  unique (batch_id, project_id, store_id)
);

create table public.customer_project_comments (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.customer_projects (id) on delete cascade,
  kind public.customer_project_comment_kind not null,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  created_by_user_id uuid not null references public.profiles (id),
  constraint customer_project_comments_body_check check (nullif(btrim(body), '') is not null and app_private.customer_account_text_is_safe(body))
);

create table public.customer_project_activities (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.customer_projects (id) on delete cascade,
  activity_type public.customer_project_activity_type not null,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  actor_user_id uuid references public.profiles (id),
  constraint customer_project_activities_title_check check (nullif(btrim(title), '') is not null and app_private.customer_account_text_is_safe(title)),
  constraint customer_project_activities_metadata_check check (jsonb_typeof(metadata) = 'object')
);

create table public.customer_migration_approvals (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.customer_migration_projects (project_id) on delete cascade,
  status public.customer_migration_approval_status not null,
  inventory_snapshot_id uuid not null references public.customer_inventory_snapshots (id) on delete restrict,
  stores_confirmed boolean not null,
  origin_confirmed boolean not null,
  critical_blocker_present boolean not null default false,
  decision_note text not null,
  approved_at timestamptz,
  decided_by_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  constraint customer_migration_approvals_note_check check (nullif(btrim(decision_note), '') is not null and app_private.customer_account_text_is_safe(decision_note))
);

create unique index customer_migration_approvals_active_key
  on public.customer_migration_approvals (project_id)
  where status = 'approved';

create table public.customer_migration_execution_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.customer_migration_projects (project_id) on delete cascade,
  batch_id uuid references public.customer_migration_batches (id) on delete set null,
  wave_id uuid references public.customer_migration_waves (id) on delete set null,
  request_fingerprint text not null,
  source_product public.customer_source_product not null,
  source_version public.customer_source_version not null,
  target_product text not null default 'after_sale',
  target_version text not null default 'v2',
  approved_item_ids jsonb not null default '[]'::jsonb,
  decisions jsonb not null default '[]'::jsonb,
  status public.customer_migration_execution_status not null default 'requested',
  external_execution_id text,
  requested_at timestamptz not null default timezone('utc', now()),
  requested_by_user_id uuid not null references public.profiles (id),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint customer_migration_execution_target_check check (target_product = 'after_sale' and target_version = 'v2'),
  constraint customer_migration_execution_payload_check check (jsonb_typeof(approved_item_ids) = 'array' and jsonb_typeof(decisions) = 'array')
);

create unique index customer_migration_execution_fingerprint_key
  on public.customer_migration_execution_requests (project_id, request_fingerprint);

create table public.customer_migration_validation_results (
  id uuid primary key default extensions.gen_random_uuid(),
  execution_request_id uuid not null references public.customer_migration_execution_requests (id) on delete cascade,
  store_id uuid not null references public.customer_account_stores (id) on delete restrict,
  status public.customer_migration_validation_status not null,
  source_observed jsonb not null default '{}'::jsonb,
  target_applied jsonb not null default '{}'::jsonb,
  post_save_evidence_id uuid references public.customer_operation_evidence (id) on delete set null,
  divergence text,
  next_action text,
  validated_at timestamptz not null default timezone('utc', now()),
  validated_by_user_id uuid not null references public.profiles (id),
  constraint customer_migration_validation_payload_check check (jsonb_typeof(source_observed) = 'object' and jsonb_typeof(target_applied) = 'object'),
  constraint customer_migration_validation_divergence_check check (status not in ('divergent', 'validated_with_reservation') or nullif(btrim(divergence), '') is not null)
);

create index customer_migration_validation_execution_idx on public.customer_migration_validation_results (execution_request_id, validated_at desc);
create unique index customer_migration_validation_execution_store_key
  on public.customer_migration_validation_results (execution_request_id, store_id);

alter table public.customer_operation_evidence
  add constraint customer_operation_evidence_project_fk
  foreign key (project_id) references public.customer_projects (id) on delete set null;

alter table public.customer_migration_projects
  add constraint customer_migration_projects_batch_fk
  foreign key (batch_id) references public.customer_migration_batches (id) on delete set null,
  add constraint customer_migration_projects_wave_fk
  foreign key (wave_id) references public.customer_migration_waves (id) on delete set null;

create or replace function app_private.guard_customer_inventory_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_source_tenant uuid;
  v_store_tenant uuid;
  v_store_source uuid;
begin
  select s.tenant_id into v_source_tenant from public.customer_account_sources s where s.id = new.source_id;
  select st.tenant_id, st.source_id into v_store_tenant, v_store_source from public.customer_account_stores st where st.id = new.store_id;
  if v_source_tenant is null or v_store_tenant is null or v_source_tenant <> new.tenant_id or v_store_tenant <> new.tenant_id or v_store_source <> new.source_id then
    raise exception 'inventory snapshot scope must use the same client, source and store';
  end if;
  return new;
end;
$$;

create or replace function app_private.guard_customer_feature_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_snapshot_tenant uuid;
  v_snapshot_store uuid;
begin
  select s.tenant_id, s.store_id into v_snapshot_tenant, v_snapshot_store from public.customer_inventory_snapshots s where s.id = new.snapshot_id;
  if v_snapshot_tenant is null or v_snapshot_tenant <> new.tenant_id or v_snapshot_store <> new.store_id then
    raise exception 'feature observation scope must match its snapshot';
  end if;
  return new;
end;
$$;

create or replace function app_private.guard_migration_project_store_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_project_tenant uuid;
  v_project_source_product public.customer_source_product;
  v_project_source_version public.customer_source_version;
  v_store_tenant uuid;
  v_store_source uuid;
  v_store_source_product public.customer_source_product;
  v_store_source_version public.customer_source_version;
begin
  select p.tenant_id, mp.source_product, mp.source_version
    into v_project_tenant, v_project_source_product, v_project_source_version
  from public.customer_migration_projects mp
  join public.customer_projects p on p.id = mp.project_id
  where mp.project_id = new.project_id;
  select s.tenant_id, s.source_id, src.source_product, src.source_version
    into v_store_tenant, v_store_source, v_store_source_product, v_store_source_version
  from public.customer_account_stores s
  join public.customer_account_sources src on src.id = s.source_id
  where s.id = new.store_id;
  if v_project_tenant is null or v_store_tenant is null or v_project_tenant <> v_store_tenant or v_project_source_product <> v_store_source_product or v_project_source_version <> v_store_source_version then
    raise exception 'migration project and store must share client and origin';
  end if;
  return new;
end;
$$;

create or replace function app_private.guard_batch_item_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
begin
  if new.wave_id is not null and not exists (select 1 from public.customer_migration_waves w where w.id = new.wave_id and w.batch_id = new.batch_id) then
    raise exception 'wave must belong to the selected batch';
  end if;
  if not exists (
    select 1 from public.customer_migration_project_stores ps
    where ps.project_id = new.project_id and ps.store_id = new.store_id
  ) then
    raise exception 'batch item store is outside the project store scope';
  end if;
  return new;
end;
$$;

create trigger customer_account_sources_touch_updated_at before update on public.customer_account_sources for each row execute function app_private.touch_updated_at();
create trigger customer_account_stores_guard_scope before insert or update on public.customer_account_stores for each row execute function app_private.guard_customer_store_source();
create trigger customer_account_stores_touch_updated_at before update on public.customer_account_stores for each row execute function app_private.touch_updated_at();
create trigger customer_inventory_snapshots_guard_scope before insert or update on public.customer_inventory_snapshots for each row execute function app_private.guard_customer_inventory_scope();
create trigger customer_inventory_feature_guard_scope before insert or update on public.customer_inventory_feature_observations for each row execute function app_private.guard_customer_feature_scope();
create trigger customer_projects_touch_updated_at before update on public.customer_projects for each row execute function app_private.touch_updated_at();
create trigger customer_migration_project_stores_guard_scope before insert or update on public.customer_migration_project_stores for each row execute function app_private.guard_migration_project_store_scope();
create trigger customer_migration_batches_touch_updated_at before update on public.customer_migration_batches for each row execute function app_private.touch_updated_at();
create trigger customer_migration_execution_touch_updated_at before update on public.customer_migration_execution_requests for each row execute function app_private.touch_updated_at();

create trigger customer_account_sources_audit after insert or update or delete on public.customer_account_sources for each row execute function audit.capture_row_change();
create trigger customer_account_stores_audit after insert or update or delete on public.customer_account_stores for each row execute function audit.capture_row_change();
create trigger customer_inventory_snapshots_audit after insert or update or delete on public.customer_inventory_snapshots for each row execute function audit.capture_row_change();
create trigger customer_inventory_feature_audit after insert or update or delete on public.customer_inventory_feature_observations for each row execute function audit.capture_row_change();
create trigger customer_operation_evidence_audit after insert or update or delete on public.customer_operation_evidence for each row execute function audit.capture_row_change();
create trigger customer_projects_audit after insert or update or delete on public.customer_projects for each row execute function audit.capture_row_change();
create trigger customer_migration_projects_audit after insert or update or delete on public.customer_migration_projects for each row execute function audit.capture_row_change();
create trigger customer_migration_project_stores_audit after insert or update or delete on public.customer_migration_project_stores for each row execute function audit.capture_row_change();
create trigger customer_migration_eligibility_audit after insert or update or delete on public.customer_migration_eligibility_evaluations for each row execute function audit.capture_row_change();
create trigger customer_migration_batches_audit after insert or update or delete on public.customer_migration_batches for each row execute function audit.capture_row_change();
create trigger customer_migration_waves_audit after insert or update or delete on public.customer_migration_waves for each row execute function audit.capture_row_change();
create trigger customer_migration_batch_items_audit after insert or update or delete on public.customer_migration_batch_items for each row execute function audit.capture_row_change();
create trigger customer_project_comments_audit after insert or update or delete on public.customer_project_comments for each row execute function audit.capture_row_change();
create trigger customer_project_activities_audit after insert or update or delete on public.customer_project_activities for each row execute function audit.capture_row_change();
create trigger customer_migration_approvals_audit after insert or update or delete on public.customer_migration_approvals for each row execute function audit.capture_row_change();
create trigger customer_migration_execution_audit after insert or update or delete on public.customer_migration_execution_requests for each row execute function audit.capture_row_change();
create trigger customer_migration_validation_audit after insert or update or delete on public.customer_migration_validation_results for each row execute function audit.capture_row_change();

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'customer_account_sources', 'customer_account_stores', 'customer_inventory_snapshots',
    'customer_inventory_feature_observations', 'customer_operation_evidence', 'customer_projects',
    'customer_migration_projects', 'customer_migration_project_stores', 'customer_migration_eligibility_evaluations',
    'customer_migration_batches', 'customer_migration_waves', 'customer_migration_batch_items',
    'customer_project_comments', 'customer_project_activities', 'customer_migration_approvals',
    'customer_migration_execution_requests', 'customer_migration_validation_results'
  ] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('revoke all on public.%I from public, anon, authenticated', tbl);
    execute format('grant select on public.%I to authenticated, service_role', tbl);
    execute format('create policy %I on public.%I for select to authenticated using (app_private.can_read_customer_operations())', tbl || '_read', tbl);
  end loop;
end;
$$;

create policy customer_operation_evidence_write
  on public.customer_operation_evidence for insert to authenticated
  with check (app_private.require_customer_operations_admin() is not null);
create policy customer_project_comments_write
  on public.customer_project_comments for insert to authenticated
  with check (app_private.require_customer_operations_admin() is not null);
create policy customer_project_activities_write
  on public.customer_project_activities for insert to authenticated
  with check (app_private.require_customer_operations_admin() is not null);

create or replace view public.vw_admin_customer_operations_directory
with (security_barrier = true)
as
  with actor as (
    select p.id from public.profiles p
    where p.id = auth.uid() and p.is_active and app_private.can_read_customer_operations()
  ), source_stats as (
    select tenant_id, count(*)::integer source_count,
      count(*) filter (where status = 'confirmed')::integer confirmed_source_count
    from public.customer_account_sources group by tenant_id
  ), store_stats as (
    select tenant_id, count(*)::integer store_count,
      count(*) filter (where status in ('identified', 'active'))::integer active_store_count
    from public.customer_account_stores group by tenant_id
  ), project_stats as (
    select tenant_id, count(*)::integer project_count,
      count(*) filter (where status not in ('completed', 'cancelled'))::integer active_project_count
    from public.customer_projects group by tenant_id
  ), cs_owner as (
    select distinct on (tenant_id) tenant_id, owner_user_id, portfolio_name, assignment_status
    from public.cs_customer_portfolio_assignments
    order by tenant_id, updated_at desc
  )
  select t.id as tenant_id, t.slug, t.legal_name, t.display_name, t.status,
    t.organization_id, g.group_id, g.group_display_name, g.group_type,
    coalesce(ss.source_count, 0) source_count, coalesce(ss.confirmed_source_count, 0) confirmed_source_count,
    coalesce(st.store_count, 0) store_count, coalesce(st.active_store_count, 0) active_store_count,
    coalesce(ps.project_count, 0) project_count, coalesce(ps.active_project_count, 0) active_project_count,
    co.owner_user_id as csm_user_id, co.portfolio_name as csm_portfolio_name,
    co.assignment_status as csm_assignment_status,
    t.created_at, t.updated_at
  from actor a
  join public.tenants t on true
  left join public.vw_admin_tenant_group_context g on g.tenant_id = t.id
  left join source_stats ss on ss.tenant_id = t.id
  left join store_stats st on st.tenant_id = t.id
  left join project_stats ps on ps.tenant_id = t.id
  left join cs_owner co on co.tenant_id = t.id;

create or replace view public.vw_admin_customer_inventory_observations
with (security_barrier = true)
as
  select o.id, o.tenant_id, o.store_id, s.display_name as store_display_name,
    src.source_product, src.source_version, src.source_system,
    snap.id as snapshot_id, snap.fingerprint as snapshot_fingerprint,
    snap.catalog_version, snap.extracted_at, snap.status as snapshot_status,
    o.domain, o.feature_key, o.feature_name, o.feature_description,
    o.contracted_status, o.boss_enabled_status, o.observed_status,
    o.usage_status, o.confidence, o.evidence_id, o.observed_at, o.notes
  from public.customer_inventory_feature_observations o
  join public.customer_inventory_snapshots snap on snap.id = o.snapshot_id
  join public.customer_account_stores s on s.id = o.store_id
  join public.customer_account_sources src on src.id = snap.source_id
  where app_private.can_read_customer_operations();

create or replace view public.vw_admin_customer_migration_kanban
with (security_barrier = true)
as
  with latest_eligibility as (
    select distinct on (project_id) project_id, result, criteria, pending_items, limitations, catalog_version, evaluated_at
    from public.customer_migration_eligibility_evaluations
    order by project_id, evaluated_at desc
  ), store_stats as (
    select project_id, count(*)::integer store_count from public.customer_migration_project_stores group by project_id
  )
  select p.id as project_id, p.tenant_id, t.display_name as tenant_display_name,
    p.name, p.description, p.project_type, p.status, p.risk_level, p.priority,
    p.deadline, p.next_action, p.standby_reason, p.blocked_reason,
    mp.source_product, mp.source_version, mp.target_product, mp.target_version,
    mp.source_adapter, mp.eligibility_status, mp.approval_status, mp.execution_status,
    coalesce(ss.store_count, 0) store_count,
    le.result as latest_eligibility_result, le.pending_items, le.limitations, le.catalog_version as latest_catalog_version,
    le.evaluated_at as latest_eligibility_at,
    p.owner_user_id, owner.full_name as owner_full_name,
    p.csm_user_id, csm.full_name as csm_full_name,
    p.created_at, p.updated_at
  from public.customer_projects p
  join public.customer_migration_projects mp on mp.project_id = p.id
  join public.tenants t on t.id = p.tenant_id
  left join store_stats ss on ss.project_id = p.id
  left join latest_eligibility le on le.project_id = p.id
  left join public.profiles owner on owner.id = p.owner_user_id
  left join public.profiles csm on csm.id = p.csm_user_id
  where app_private.can_read_customer_operations();

revoke all on public.vw_admin_customer_operations_directory from public, anon, authenticated, service_role;
revoke all on public.vw_admin_customer_inventory_observations from public, anon, authenticated, service_role;
revoke all on public.vw_admin_customer_migration_kanban from public, anon, authenticated, service_role;
grant select on public.vw_admin_customer_operations_directory to authenticated, service_role;
grant select on public.vw_admin_customer_inventory_observations to authenticated, service_role;
grant select on public.vw_admin_customer_migration_kanban to authenticated, service_role;

comment on table public.customer_account_sources is 'Identidade operacional da origem de um cliente; After Sale V1 e Genius permanecem separados.';
comment on table public.customer_account_stores is 'Loja individual confirmada por fonte autorizada; nenhuma execucao deve misturar lojas implicitamente.';
comment on table public.customer_inventory_snapshots is 'Snapshot versionado e idempotente de inventario de uma loja.';
comment on table public.customer_projects is 'Projeto operacional generico; migracao e um tipo especializado.';
comment on table public.customer_migration_projects is 'Especializacao de projeto para migracao After Sale V1 ou Genius para After Sale V2.';
comment on view public.vw_admin_customer_migration_kanban is 'Read model de projetos de migracao para Kanban futuro; nao publica frontend nesta etapa.';

create or replace function public.rpc_admin_upsert_customer_source(
  p_tenant_id uuid,
  p_source_product public.customer_source_product,
  p_source_version public.customer_source_version,
  p_source_system text,
  p_source_external_id text default null,
  p_status public.customer_source_status default 'identified',
  p_notes text default null
)
returns public.customer_account_sources
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_source public.customer_account_sources;
  v_system text;
  v_external_id text;
begin
  v_actor := app_private.require_customer_operations_admin();
  if not exists (select 1 from public.tenants t where t.id = p_tenant_id) then
    raise exception 'customer tenant not found';
  end if;
  v_system := app_private.assert_customer_account_safe_text('source_system', p_source_system, 120, false);
  v_external_id := app_private.assert_customer_account_safe_text('source_external_id', p_source_external_id, 240, true);
  select * into v_source from public.customer_account_sources s
  where s.tenant_id = p_tenant_id and s.source_product = p_source_product
    and s.source_version = p_source_version and lower(s.source_system) = lower(v_system)
    and s.source_external_id is not distinct from v_external_id
  for update;
  if v_source.id is null then
    insert into public.customer_account_sources (
      tenant_id, source_product, source_version, source_system, source_external_id,
      status, notes, created_by_user_id, updated_by_user_id
    ) values (
      p_tenant_id, p_source_product, p_source_version, v_system, v_external_id,
      coalesce(p_status, 'identified'), app_private.assert_customer_account_safe_text('source_notes', p_notes, 1000, true), v_actor, v_actor
    ) returning * into v_source;
  else
    update public.customer_account_sources
    set status = coalesce(p_status, status),
        notes = app_private.assert_customer_account_safe_text('source_notes', p_notes, 1000, true),
        updated_by_user_id = v_actor,
        confirmed_at = case when p_status = 'confirmed' then timezone('utc', now()) else confirmed_at end
    where id = v_source.id
    returning * into v_source;
  end if;
  return v_source;
end;
$$;

create or replace function public.rpc_admin_upsert_customer_store(
  p_tenant_id uuid,
  p_source_id uuid,
  p_external_store_id text,
  p_display_name text,
  p_platform_name text default null,
  p_status public.customer_store_status default 'identified',
  p_notes text default null
)
returns public.customer_account_stores
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_store public.customer_account_stores;
  v_external_id text;
  v_name text;
begin
  v_actor := app_private.require_customer_operations_admin();
  v_external_id := app_private.assert_customer_account_safe_text('external_store_id', p_external_store_id, 240, false);
  v_name := app_private.assert_customer_account_safe_text('store_display_name', p_display_name, 180, false);
  if not exists (select 1 from public.customer_account_sources s where s.id = p_source_id and s.tenant_id = p_tenant_id) then
    raise exception 'customer source does not belong to tenant';
  end if;
  select * into v_store from public.customer_account_stores s
  where s.source_id = p_source_id and lower(s.external_store_id) = lower(v_external_id)
  for update;
  if v_store.id is null then
    insert into public.customer_account_stores (
      tenant_id, source_id, external_store_id, display_name, platform_name,
      status, notes, created_by_user_id, updated_by_user_id
    ) values (
      p_tenant_id, p_source_id, v_external_id, v_name,
      app_private.assert_customer_account_safe_text('platform_name', p_platform_name, 120, true),
      coalesce(p_status, 'identified'), app_private.assert_customer_account_safe_text('store_notes', p_notes, 1000, true), v_actor, v_actor
    ) returning * into v_store;
  else
    update public.customer_account_stores
    set display_name = v_name,
        platform_name = app_private.assert_customer_account_safe_text('platform_name', p_platform_name, 120, true),
        status = coalesce(p_status, status),
        notes = app_private.assert_customer_account_safe_text('store_notes', p_notes, 1000, true),
        updated_by_user_id = v_actor
    where id = v_store.id
    returning * into v_store;
  end if;
  return v_store;
end;
$$;

create or replace function public.rpc_admin_import_customer_inventory_snapshot(
  p_tenant_id uuid,
  p_source_id uuid,
  p_store_id uuid,
  p_source_system text,
  p_schema_version text,
  p_catalog_version text,
  p_extracted_at timestamptz,
  p_fingerprint text,
  p_package_manifest jsonb,
  p_observations jsonb,
  p_sanitized boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_snapshot public.customer_inventory_snapshots;
  v_item jsonb;
  v_feature_key text;
begin
  v_actor := app_private.require_customer_operations_admin();
  if not p_sanitized then
    raise exception 'inventory package must be sanitized before import';
  end if;
  if jsonb_typeof(coalesce(p_package_manifest, '{}'::jsonb)) <> 'object' or jsonb_typeof(coalesce(p_observations, '[]'::jsonb)) <> 'array' then
    raise exception 'inventory package manifest and observations must have valid JSON types';
  end if;
  if not exists (
    select 1 from public.customer_account_stores st
    join public.customer_account_sources src on src.id = st.source_id
    where st.id = p_store_id and st.tenant_id = p_tenant_id and st.source_id = p_source_id
  ) then
    raise exception 'inventory package client, source and store do not match';
  end if;
  select * into v_snapshot from public.customer_inventory_snapshots s
  where s.store_id = p_store_id and s.fingerprint = p_fingerprint;
  if v_snapshot.id is not null then
    if v_snapshot.tenant_id <> p_tenant_id or v_snapshot.source_id <> p_source_id then
      raise exception 'inventory fingerprint belongs to another client or source';
    end if;
    return v_snapshot.id;
  end if;
  insert into public.customer_inventory_snapshots (
    tenant_id, source_id, store_id, source_system, schema_version, catalog_version,
    extracted_at, fingerprint, package_manifest, status, sanitized, created_by_user_id
  ) values (
    p_tenant_id, p_source_id, p_store_id,
    app_private.assert_customer_account_safe_text('inventory_source_system', p_source_system, 120, false),
    app_private.assert_customer_account_safe_text('inventory_schema_version', p_schema_version, 80, false),
    app_private.assert_customer_account_safe_text('inventory_catalog_version', p_catalog_version, 120, false),
    p_extracted_at, app_private.assert_customer_account_safe_text('inventory_fingerprint', p_fingerprint, 240, false),
    p_package_manifest, 'accepted', true, v_actor
  ) returning * into v_snapshot;

  for v_item in select value from jsonb_array_elements(p_observations)
  loop
    v_feature_key := app_private.assert_customer_account_safe_text('feature_key', v_item ->> 'feature_key', 160, false);
    insert into public.customer_inventory_feature_observations (
      snapshot_id, tenant_id, store_id, source_product, source_version, domain,
      feature_key, feature_name, feature_description, contracted_status,
      boss_enabled_status, observed_status, usage_status, confidence, evidence_id,
      observed_at, catalog_version, fingerprint, notes
    )
    select v_snapshot.id, p_tenant_id, p_store_id, src.source_product, src.source_version,
      app_private.assert_customer_account_safe_text('feature_domain', v_item ->> 'domain', 120, false),
      v_feature_key,
      app_private.assert_customer_account_safe_text('feature_name', v_item ->> 'feature_name', 180, false),
      app_private.assert_customer_account_safe_text('feature_description', v_item ->> 'feature_description', 1000, true),
      coalesce((v_item ->> 'contracted_status')::public.customer_feature_contract_status, 'unknown'),
      coalesce((v_item ->> 'boss_enabled_status')::public.customer_feature_boss_status, 'not_applicable'),
      coalesce((v_item ->> 'observed_status')::public.customer_feature_observed_status, 'unknown'),
      coalesce((v_item ->> 'usage_status')::public.customer_feature_usage_status, 'unknown'),
      coalesce(nullif(v_item ->> 'confidence', ''), 'unverified'),
      nullif(v_item ->> 'evidence_id', '')::uuid,
      coalesce((v_item ->> 'observed_at')::timestamptz, p_extracted_at),
      p_catalog_version,
      p_fingerprint,
      app_private.assert_customer_account_safe_text('feature_notes', v_item ->> 'notes', 1000, true)
    from public.customer_account_sources src where src.id = p_source_id;
  end loop;
  return v_snapshot.id;
exception when unique_violation then
  select * into v_snapshot from public.customer_inventory_snapshots where store_id = p_store_id and fingerprint = p_fingerprint;
  if v_snapshot.id is null then raise; end if;
  return v_snapshot.id;
end;
$$;

create or replace function public.rpc_admin_create_customer_migration_project(
  p_tenant_id uuid,
  p_name text,
  p_source_id uuid,
  p_source_adapter text,
  p_description text default null,
  p_owner_user_id uuid default null,
  p_csm_user_id uuid default null,
  p_priority integer default 3,
  p_deadline date default null,
  p_risk_level public.customer_project_risk_level default 'low'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_project_id uuid;
  v_source public.customer_account_sources;
begin
  v_actor := app_private.require_customer_operations_admin();
  select * into v_source from public.customer_account_sources where id = p_source_id and tenant_id = p_tenant_id;
  if v_source.id is null then raise exception 'migration source does not belong to client'; end if;
  insert into public.customer_projects (
    tenant_id, project_type, name, description, source_id, owner_user_id, csm_user_id,
    priority, deadline, status, risk_level, created_by_user_id, updated_by_user_id
  ) values (
    p_tenant_id, 'migration', app_private.assert_customer_account_safe_text('project_name', p_name, 180, false),
    app_private.assert_customer_account_safe_text('project_description', p_description, 1600, true), p_source_id,
    p_owner_user_id, p_csm_user_id, coalesce(p_priority, 3), p_deadline, 'inventory_pending', coalesce(p_risk_level, 'low'), v_actor, v_actor
  ) returning id into v_project_id;
  insert into public.customer_migration_projects (
    project_id, source_product, source_version, source_adapter
  ) values (v_project_id, v_source.source_product, v_source.source_version,
    app_private.assert_customer_account_safe_text('source_adapter', p_source_adapter, 120, false));
  return v_project_id;
end;
$$;

create or replace function public.rpc_admin_link_migration_project_store(
  p_project_id uuid,
  p_store_id uuid
)
returns public.customer_migration_project_stores
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_link public.customer_migration_project_stores;
begin
  v_actor := app_private.require_customer_operations_admin();
  insert into public.customer_migration_project_stores (project_id, store_id, created_by_user_id)
  values (p_project_id, p_store_id, v_actor)
  on conflict (project_id, store_id) do update set created_by_user_id = excluded.created_by_user_id
  returning * into v_link;
  return v_link;
end;
$$;

create or replace function public.rpc_admin_evaluate_customer_migration(
  p_project_id uuid,
  p_result public.customer_migration_eligibility_status,
  p_criteria jsonb,
  p_pending_items jsonb,
  p_limitations jsonb,
  p_catalog_version text,
  p_inventory_snapshot_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_eval_id uuid;
  v_project public.customer_projects;
begin
  v_actor := app_private.require_customer_operations_admin();
  select p.* into v_project from public.customer_projects p where p.id = p_project_id and p.project_type = 'migration';
  if v_project.id is null then raise exception 'migration project not found'; end if;
  if p_inventory_snapshot_id is not null and not exists (
    select 1 from public.customer_inventory_snapshots s
    where s.id = p_inventory_snapshot_id and s.tenant_id = v_project.tenant_id
      and s.source_id = v_project.source_id
      and exists (select 1 from public.customer_migration_project_stores ps where ps.project_id = p_project_id and ps.store_id = s.store_id)
  ) then raise exception 'inventory snapshot is outside the migration scope'; end if;
  insert into public.customer_migration_eligibility_evaluations (
    project_id, result, criteria, pending_items, limitations, catalog_version,
    inventory_snapshot_id, evaluated_by_user_id
  ) values (
    p_project_id, p_result, coalesce(p_criteria, '{}'::jsonb), coalesce(p_pending_items, '[]'::jsonb),
    coalesce(p_limitations, '[]'::jsonb), app_private.assert_customer_account_safe_text('eligibility_catalog_version', p_catalog_version, 120, false),
    p_inventory_snapshot_id, v_actor
  ) returning id into v_eval_id;
  update public.customer_migration_projects
  set eligibility_status = p_result
  where project_id = p_project_id;
  update public.customer_projects
  set status = case p_result
    when 'eligible' then 'eligible'::public.customer_project_status
    when 'eligible_with_restrictions' then 'eligible_with_restrictions'::public.customer_project_status
    when 'ineligible' then 'blocked'::public.customer_project_status
    else 'eligibility_pending'::public.customer_project_status end,
    blocked_reason = case when p_result = 'ineligible' then 'Elegibilidade reprovada; revisar pendencias e limitacoes.' else null end,
    updated_by_user_id = v_actor
  where id = p_project_id;
  return v_eval_id;
end;
$$;

create or replace function public.rpc_admin_transition_customer_project(
  p_project_id uuid,
  p_status public.customer_project_status,
  p_reason text default null,
  p_next_action text default null
)
returns public.customer_projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_project public.customer_projects;
  v_previous_status public.customer_project_status;
begin
  v_actor := app_private.require_customer_operations_admin();
  select * into v_project from public.customer_projects where id = p_project_id for update;
  if v_project.id is null then raise exception 'customer project not found'; end if;
  if not app_private.customer_migration_project_status_is_valid_transition(v_project.status, p_status) then
    raise exception 'invalid customer project transition from % to %', v_project.status, p_status;
  end if;
  if p_status = 'standby' and nullif(btrim(p_reason), '') is null then raise exception 'standby reason required'; end if;
  if p_status = 'blocked' and nullif(btrim(p_reason), '') is null then raise exception 'blocked reason required'; end if;
  v_previous_status := v_project.status;
  update public.customer_projects
  set status = p_status,
      standby_reason = case when p_status = 'standby' then app_private.assert_customer_account_safe_text('standby_reason', p_reason, 1000, false) else null end,
      blocked_reason = case when p_status = 'blocked' then app_private.assert_customer_account_safe_text('blocked_reason', p_reason, 1000, false) else null end,
      next_action = app_private.assert_customer_account_safe_text('next_action', p_next_action, 1000, true),
      updated_by_user_id = v_actor
  where id = p_project_id
  returning * into v_project;
  insert into public.customer_project_activities (project_id, activity_type, title, description, metadata, actor_user_id)
  values (p_project_id, 'status_change', 'Status do projeto alterado', p_reason, jsonb_build_object('from', v_previous_status, 'to', p_status), v_actor);
  return v_project;
end;
$$;

create or replace function public.rpc_admin_approve_customer_migration(
  p_project_id uuid,
  p_status public.customer_migration_approval_status,
  p_inventory_snapshot_id uuid,
  p_stores_confirmed boolean,
  p_origin_confirmed boolean,
  p_critical_blocker_present boolean,
  p_decision_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_project public.customer_projects;
  v_migration public.customer_migration_projects;
  v_eval public.customer_migration_eligibility_evaluations;
  v_approval_id uuid;
begin
  v_actor := app_private.require_customer_operations_admin();
  select p.* into v_project from public.customer_projects p where p.id = p_project_id and p.project_type = 'migration';
  select * into v_migration from public.customer_migration_projects where project_id = p_project_id;
  select * into v_eval from public.customer_migration_eligibility_evaluations e where e.project_id = p_project_id order by evaluated_at desc limit 1;
  if v_project.id is null or v_migration.project_id is null then raise exception 'migration project not found'; end if;
  if p_status = 'approved' and (not p_stores_confirmed or not p_origin_confirmed or p_critical_blocker_present or v_eval.id is null or v_eval.result not in ('eligible', 'eligible_with_restrictions')) then
    raise exception 'migration approval requires current eligible evaluation, confirmed stores and origin, and no critical blocker';
  end if;
  if p_status = 'approved' and not exists (select 1 from public.customer_migration_project_stores where project_id = p_project_id) then
    raise exception 'migration approval requires at least one store';
  end if;
  insert into public.customer_migration_approvals (
    project_id, status, inventory_snapshot_id, stores_confirmed, origin_confirmed,
    critical_blocker_present, decision_note, approved_at, decided_by_user_id
  ) values (
    p_project_id, p_status, p_inventory_snapshot_id, p_stores_confirmed, p_origin_confirmed,
    p_critical_blocker_present, app_private.assert_customer_account_safe_text('approval_note', p_decision_note, 1600, false),
    case when p_status = 'approved' then timezone('utc', now()) else null end, v_actor
  ) returning id into v_approval_id;
  update public.customer_migration_projects
  set approval_status = p_status
  where project_id = p_project_id;
  if p_status = 'approved' then
    update public.customer_projects set status = 'ready_to_execute', updated_by_user_id = v_actor where id = p_project_id;
  end if;
  return v_approval_id;
end;
$$;

create or replace function public.rpc_admin_create_customer_migration_batch(
  p_name text,
  p_description text default null,
  p_priority integer default 3,
  p_owner_user_id uuid default null,
  p_period_start date default null,
  p_period_end date default null,
  p_notes text default null
)
returns public.customer_migration_batches
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_batch public.customer_migration_batches;
begin
  v_actor := app_private.require_customer_operations_admin();
  insert into public.customer_migration_batches (
    name, description, priority, owner_user_id, period_start, period_end, notes, created_by_user_id, updated_by_user_id
  ) values (
    app_private.assert_customer_account_safe_text('batch_name', p_name, 180, false),
    app_private.assert_customer_account_safe_text('batch_description', p_description, 1600, true),
    coalesce(p_priority, 3), p_owner_user_id, p_period_start, p_period_end,
    app_private.assert_customer_account_safe_text('batch_notes', p_notes, 1000, true), v_actor, v_actor
  ) returning * into v_batch;
  return v_batch;
end;
$$;

create or replace function public.rpc_admin_create_customer_migration_wave(
  p_batch_id uuid,
  p_name text,
  p_position integer,
  p_scheduled_for date default null,
  p_notes text default null
)
returns public.customer_migration_waves
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_wave public.customer_migration_waves;
begin
  v_actor := app_private.require_customer_operations_admin();
  if not exists (select 1 from public.customer_migration_batches where id = p_batch_id) then raise exception 'migration batch not found'; end if;
  insert into public.customer_migration_waves (batch_id, name, position, scheduled_for, notes, created_by_user_id)
  values (p_batch_id, app_private.assert_customer_account_safe_text('wave_name', p_name, 180, false), p_position, p_scheduled_for, app_private.assert_customer_account_safe_text('wave_notes', p_notes, 1000, true), v_actor)
  returning * into v_wave;
  return v_wave;
end;
$$;

create or replace function public.rpc_admin_add_customer_migration_batch_item(
  p_batch_id uuid,
  p_project_id uuid,
  p_store_id uuid,
  p_wave_id uuid default null,
  p_position integer default 1
)
returns public.customer_migration_batch_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_item public.customer_migration_batch_items;
begin
  v_actor := app_private.require_customer_operations_admin();
  insert into public.customer_migration_batch_items (batch_id, wave_id, project_id, store_id, position, created_by_user_id)
  values (p_batch_id, p_wave_id, p_project_id, p_store_id, coalesce(p_position, 1), v_actor)
  on conflict (batch_id, project_id, store_id) do update set wave_id = excluded.wave_id, position = excluded.position
  returning * into v_item;
  return v_item;
end;
$$;

create or replace function public.rpc_admin_request_customer_migration_execution(
  p_project_id uuid,
  p_request_fingerprint text,
  p_batch_id uuid default null,
  p_wave_id uuid default null,
  p_approved_item_ids jsonb default '[]'::jsonb,
  p_decisions jsonb default '[]'::jsonb
)
returns public.customer_migration_execution_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_project public.customer_projects;
  v_migration public.customer_migration_projects;
  v_request public.customer_migration_execution_requests;
begin
  v_actor := app_private.require_customer_operations_admin();
  select p.* into v_project from public.customer_projects p where p.id = p_project_id and p.project_type = 'migration';
  select * into v_migration from public.customer_migration_projects where project_id = p_project_id;
  if v_project.id is null or v_migration.project_id is null then raise exception 'migration project not found'; end if;
  if v_migration.approval_status <> 'approved' or v_migration.eligibility_status not in ('eligible', 'eligible_with_restrictions') then
    raise exception 'execution requires approved and eligible migration';
  end if;
  if not exists (select 1 from public.customer_migration_project_stores where project_id = p_project_id) then
    raise exception 'execution requires explicit store scope';
  end if;
  insert into public.customer_migration_execution_requests (
    project_id, batch_id, wave_id, request_fingerprint, source_product, source_version,
    approved_item_ids, decisions, requested_by_user_id
  ) values (
    p_project_id, p_batch_id, p_wave_id,
    app_private.assert_customer_account_safe_text('request_fingerprint', p_request_fingerprint, 240, false),
    v_migration.source_product, v_migration.source_version, coalesce(p_approved_item_ids, '[]'::jsonb), coalesce(p_decisions, '[]'::jsonb), v_actor
  ) on conflict (project_id, request_fingerprint) do update set updated_at = timezone('utc', now())
  returning * into v_request;
  update public.customer_migration_projects set execution_status = 'requested' where project_id = p_project_id;
  update public.customer_projects set status = 'ready_to_execute', updated_by_user_id = v_actor where id = p_project_id;
  return v_request;
end;
$$;

create or replace function public.rpc_admin_record_customer_migration_validation(
  p_execution_request_id uuid,
  p_store_id uuid,
  p_status public.customer_migration_validation_status,
  p_source_observed jsonb,
  p_target_applied jsonb,
  p_divergence text default null,
  p_next_action text default null,
  p_post_save_evidence_id uuid default null
)
returns public.customer_migration_validation_results
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_request public.customer_migration_execution_requests;
  v_result public.customer_migration_validation_results;
  v_total integer;
  v_done integer;
begin
  v_actor := app_private.require_customer_operations_admin();
  select * into v_request from public.customer_migration_execution_requests where id = p_execution_request_id;
  if v_request.id is null then raise exception 'execution request not found'; end if;
  if not exists (select 1 from public.customer_migration_project_stores where project_id = v_request.project_id and store_id = p_store_id) then
    raise exception 'validation store is outside execution project scope';
  end if;
  insert into public.customer_migration_validation_results (
    execution_request_id, store_id, status, source_observed, target_applied,
    post_save_evidence_id, divergence, next_action, validated_by_user_id
  ) values (
    p_execution_request_id, p_store_id, p_status, coalesce(p_source_observed, '{}'::jsonb), coalesce(p_target_applied, '{}'::jsonb),
    p_post_save_evidence_id, app_private.assert_customer_account_safe_text('validation_divergence', p_divergence, 1600, true),
    app_private.assert_customer_account_safe_text('validation_next_action', p_next_action, 1000, true), v_actor
  ) on conflict (execution_request_id, store_id) do update set
    status = excluded.status,
    source_observed = excluded.source_observed,
    target_applied = excluded.target_applied,
    post_save_evidence_id = excluded.post_save_evidence_id,
    divergence = excluded.divergence,
    next_action = excluded.next_action,
    validated_by_user_id = excluded.validated_by_user_id,
    validated_at = timezone('utc', now())
  returning * into v_result;
  select count(*)::integer into v_total from public.customer_migration_project_stores where project_id = v_request.project_id;
  select count(*)::integer into v_done from public.customer_migration_validation_results r
    join public.customer_migration_execution_requests er on er.id = r.execution_request_id
    where er.project_id = v_request.project_id and r.status in ('validated', 'validated_with_reservation');
  if v_done >= v_total then
    update public.customer_projects set status = 'completed', updated_by_user_id = v_actor where id = v_request.project_id;
    update public.customer_migration_projects set execution_status = 'completed' where project_id = v_request.project_id;
  else
    update public.customer_projects set status = 'validating', updated_by_user_id = v_actor where id = v_request.project_id;
    update public.customer_migration_projects set execution_status = 'running' where project_id = v_request.project_id;
  end if;
  return v_result;
end;
$$;

create or replace function public.rpc_admin_add_customer_project_comment(
  p_project_id uuid,
  p_kind public.customer_project_comment_kind,
  p_body text
)
returns public.customer_project_comments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_comment public.customer_project_comments;
begin
  v_actor := app_private.require_customer_operations_admin();
  insert into public.customer_project_comments (project_id, kind, body, created_by_user_id)
  values (p_project_id, p_kind, app_private.assert_customer_account_safe_text('project_comment', p_body, 3000, false), v_actor)
  returning * into v_comment;
  return v_comment;
end;
$$;

create or replace function public.rpc_admin_record_customer_project_activity(
  p_project_id uuid,
  p_activity_type public.customer_project_activity_type,
  p_title text,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.customer_project_activities
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_activity public.customer_project_activities;
begin
  v_actor := app_private.require_customer_operations_admin();
  insert into public.customer_project_activities (project_id, activity_type, title, description, metadata, actor_user_id)
  values (
    p_project_id, p_activity_type,
    app_private.assert_customer_account_safe_text('activity_title', p_title, 180, false),
    app_private.assert_customer_account_safe_text('activity_description', p_description, 1600, true),
    coalesce(p_metadata, '{}'::jsonb), v_actor
  ) returning * into v_activity;
  return v_activity;
end;
$$;

revoke all on function app_private.can_read_customer_operations() from public, anon, authenticated, service_role;
revoke all on function app_private.require_customer_operations_admin() from public, anon, authenticated, service_role;
revoke all on function app_private.customer_migration_project_status_is_valid_transition(public.customer_project_status, public.customer_project_status) from public, anon, authenticated, service_role;
revoke all on function app_private.guard_customer_store_source() from public, anon, authenticated, service_role;
revoke all on function app_private.guard_customer_inventory_scope() from public, anon, authenticated, service_role;
revoke all on function app_private.guard_customer_feature_scope() from public, anon, authenticated, service_role;
revoke all on function app_private.guard_migration_project_store_scope() from public, anon, authenticated, service_role;
revoke all on function app_private.guard_batch_item_scope() from public, anon, authenticated, service_role;
grant execute on function app_private.can_read_customer_operations() to service_role;

revoke all on function public.rpc_admin_upsert_customer_source(uuid, public.customer_source_product, public.customer_source_version, text, text, public.customer_source_status, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_upsert_customer_store(uuid, uuid, text, text, text, public.customer_store_status, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_import_customer_inventory_snapshot(uuid, uuid, uuid, text, text, text, timestamptz, text, jsonb, jsonb, boolean) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_create_customer_migration_project(uuid, text, uuid, text, text, uuid, uuid, integer, date, public.customer_project_risk_level) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_link_migration_project_store(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_evaluate_customer_migration(uuid, public.customer_migration_eligibility_status, jsonb, jsonb, jsonb, text, uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_transition_customer_project(uuid, public.customer_project_status, text, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_approve_customer_migration(uuid, public.customer_migration_approval_status, uuid, boolean, boolean, boolean, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_create_customer_migration_batch(text, text, integer, uuid, date, date, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_create_customer_migration_wave(uuid, text, integer, date, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_add_customer_migration_batch_item(uuid, uuid, uuid, uuid, integer) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_request_customer_migration_execution(uuid, text, uuid, uuid, jsonb, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_record_customer_migration_validation(uuid, uuid, public.customer_migration_validation_status, jsonb, jsonb, text, text, uuid) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_add_customer_project_comment(uuid, public.customer_project_comment_kind, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_admin_record_customer_project_activity(uuid, public.customer_project_activity_type, text, text, jsonb) from public, anon, authenticated, service_role;

grant execute on function public.rpc_admin_upsert_customer_source(uuid, public.customer_source_product, public.customer_source_version, text, text, public.customer_source_status, text) to authenticated;
grant execute on function public.rpc_admin_upsert_customer_store(uuid, uuid, text, text, text, public.customer_store_status, text) to authenticated;
grant execute on function public.rpc_admin_import_customer_inventory_snapshot(uuid, uuid, uuid, text, text, text, timestamptz, text, jsonb, jsonb, boolean) to authenticated;
grant execute on function public.rpc_admin_create_customer_migration_project(uuid, text, uuid, text, text, uuid, uuid, integer, date, public.customer_project_risk_level) to authenticated;
grant execute on function public.rpc_admin_link_migration_project_store(uuid, uuid) to authenticated;
grant execute on function public.rpc_admin_evaluate_customer_migration(uuid, public.customer_migration_eligibility_status, jsonb, jsonb, jsonb, text, uuid) to authenticated;
grant execute on function public.rpc_admin_transition_customer_project(uuid, public.customer_project_status, text, text) to authenticated;
grant execute on function public.rpc_admin_approve_customer_migration(uuid, public.customer_migration_approval_status, uuid, boolean, boolean, boolean, text) to authenticated;
grant execute on function public.rpc_admin_create_customer_migration_batch(text, text, integer, uuid, date, date, text) to authenticated;
grant execute on function public.rpc_admin_create_customer_migration_wave(uuid, text, integer, date, text) to authenticated;
grant execute on function public.rpc_admin_add_customer_migration_batch_item(uuid, uuid, uuid, uuid, integer) to authenticated;
grant execute on function public.rpc_admin_request_customer_migration_execution(uuid, text, uuid, uuid, jsonb, jsonb) to authenticated;
grant execute on function public.rpc_admin_record_customer_migration_validation(uuid, uuid, public.customer_migration_validation_status, jsonb, jsonb, text, text, uuid) to authenticated;
grant execute on function public.rpc_admin_add_customer_project_comment(uuid, public.customer_project_comment_kind, text) to authenticated;
grant execute on function public.rpc_admin_record_customer_project_activity(uuid, public.customer_project_activity_type, text, text, jsonb) to authenticated;
