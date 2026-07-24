-- Parametrizacao: Marcas atendidas na plataforma (multi-marca Genius + After Sale).

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  help_center_slug text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint brands_key_format check (key ~ '^[a-z][a-z0-9_]{1,48}$'),
  constraint brands_no_secret_words
    check (not (coalesce(label,'')||' '||coalesce(help_center_slug,'')) ~* '(secret|password|senha|api[_ -]?key|authorization|bearer)')
);

create trigger brands_touch_updated_at
before update on public.brands
for each row execute function app_private.touch_updated_at();

create trigger brands_audit_row_change
after insert or update or delete on public.brands
for each row execute function audit.capture_row_change();

alter table public.brands enable row level security;
revoke all on public.brands from anon;
grant select on public.brands to authenticated;
grant select on public.brands to service_role;

drop policy if exists brands_select_operational on public.brands;
create policy brands_select_operational
on public.brands for select to authenticated
using (
  app_private.has_global_role('platform_admin'::public.platform_role)
  or app_private.has_global_role('support_manager'::public.platform_role)
  or app_private.has_global_role('support_agent'::public.platform_role)
);

insert into public.brands (key, label, help_center_slug, sort_order)
values
  ('genius', 'Genius', 'genius', 10),
  ('after_sale', 'After Sale', 'after-sale', 20)
on conflict (key) do update
set label = excluded.label, help_center_slug = excluded.help_center_slug, sort_order = excluded.sort_order;

create or replace function public.rpc_admin_create_brand(
  p_key text, p_label text, p_help_center_slug text default null, p_sort_order integer default 0
) returns public.brands
language plpgsql security definer set search_path = '' as $$
declare v_actor uuid; v_row public.brands;
begin
  v_actor := app_private.require_active_actor();
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_create_brand denied';
  end if;
  insert into public.brands (key, label, help_center_slug, sort_order)
  values (lower(btrim(p_key)), btrim(p_label), nullif(btrim(coalesce(p_help_center_slug,'')),''), coalesce(p_sort_order,0))
  returning * into v_row;
  return v_row;
end; $$;

create or replace function public.rpc_admin_archive_brand(p_id uuid)
returns public.brands
language plpgsql security definer set search_path = '' as $$
declare v_actor uuid; v_row public.brands;
begin
  v_actor := app_private.require_active_actor();
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_archive_brand denied';
  end if;
  update public.brands set is_active = false where id = p_id returning * into v_row;
  if v_row.id is null then raise exception 'rpc_admin_archive_brand not found'; end if;
  return v_row;
end; $$;

grant execute on function public.rpc_admin_create_brand(text, text, text, integer) to authenticated;
grant execute on function public.rpc_admin_archive_brand(uuid) to authenticated;
