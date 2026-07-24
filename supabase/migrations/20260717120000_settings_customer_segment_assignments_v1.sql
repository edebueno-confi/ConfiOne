-- Clusterizacao de CS: vinculo tenant -> segmento (1 segmento por cliente no MVP).

create table if not exists public.customer_segment_assignments (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  segment_id uuid not null references public.customer_segments (id),
  assigned_by_user_id uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger customer_segment_assignments_touch_updated_at
before update on public.customer_segment_assignments
for each row execute function app_private.touch_updated_at();

create trigger customer_segment_assignments_audit_row_change
after insert or update or delete on public.customer_segment_assignments
for each row execute function audit.capture_row_change();

alter table public.customer_segment_assignments enable row level security;
revoke all on public.customer_segment_assignments from anon;
grant select on public.customer_segment_assignments to authenticated;
grant select on public.customer_segment_assignments to service_role;

drop policy if exists customer_segment_assignments_select_operational on public.customer_segment_assignments;
create policy customer_segment_assignments_select_operational
on public.customer_segment_assignments for select to authenticated
using (
  app_private.has_global_role('platform_admin'::public.platform_role)
  or app_private.has_global_role('support_manager'::public.platform_role)
  or app_private.has_global_role('support_agent'::public.platform_role)
);

create or replace view public.vw_customer_segment_assignments
with (security_invoker = true) as
select
  a.tenant_id,
  a.segment_id,
  s.key as segment_key,
  s.label as segment_label,
  s.color_token as segment_color_token,
  a.updated_at
from public.customer_segment_assignments a
join public.customer_segments s on s.id = a.segment_id;

grant select on public.vw_customer_segment_assignments to authenticated;

create or replace function public.rpc_admin_set_customer_segment(
  p_tenant_id uuid,
  p_segment_id uuid
)
returns public.customer_segment_assignments
language plpgsql security definer set search_path = '' as $$
declare v_actor uuid; v_row public.customer_segment_assignments;
begin
  v_actor := app_private.require_active_actor();
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_set_customer_segment denied';
  end if;
  insert into public.customer_segment_assignments (tenant_id, segment_id, assigned_by_user_id)
  values (p_tenant_id, p_segment_id, v_actor)
  on conflict (tenant_id) do update
    set segment_id = excluded.segment_id, assigned_by_user_id = v_actor
  returning * into v_row;
  return v_row;
end; $$;

create or replace function public.rpc_admin_clear_customer_segment(
  p_tenant_id uuid
)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_actor uuid;
begin
  v_actor := app_private.require_active_actor();
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_clear_customer_segment denied';
  end if;
  delete from public.customer_segment_assignments where tenant_id = p_tenant_id;
  return true;
end; $$;

grant execute on function public.rpc_admin_set_customer_segment(uuid, uuid) to authenticated;
grant execute on function public.rpc_admin_clear_customer_segment(uuid) to authenticated;
