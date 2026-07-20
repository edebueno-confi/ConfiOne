-- Parametrizacao: Segmentos/clusters de cliente (base para clusterizacao de CS).

create table if not exists public.customer_segments (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  color_token text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint customer_segments_key_format check (key ~ '^[a-z][a-z0-9_]{1,48}$'),
  constraint customer_segments_color_check
    check (color_token is null or color_token in ('danger','warning','info','success','neutral')),
  constraint customer_segments_no_secret_words
    check (not (coalesce(label,'')||' '||coalesce(description,'')) ~* '(secret|password|senha|api[_ -]?key|authorization|bearer)')
);

create trigger customer_segments_touch_updated_at
before update on public.customer_segments
for each row execute function app_private.touch_updated_at();

create trigger customer_segments_audit_row_change
after insert or update or delete on public.customer_segments
for each row execute function audit.capture_row_change();

alter table public.customer_segments enable row level security;
revoke all on public.customer_segments from anon;
grant select on public.customer_segments to authenticated;
grant select on public.customer_segments to service_role;

drop policy if exists customer_segments_select_operational on public.customer_segments;
create policy customer_segments_select_operational
on public.customer_segments for select to authenticated
using (
  app_private.has_global_role('platform_admin'::public.platform_role)
  or app_private.has_global_role('support_manager'::public.platform_role)
  or app_private.has_global_role('support_agent'::public.platform_role)
);

insert into public.customer_segments (key, label, description, color_token, sort_order)
values
  ('enterprise', 'Enterprise', 'Grandes contas estratégicas.', 'info', 10),
  ('medio', 'Médio porte', 'Contas de porte intermediário.', 'neutral', 20),
  ('pequeno', 'Pequeno porte', 'Contas menores.', 'neutral', 30),
  ('onboarding', 'Em onboarding', 'Clientes em fase de implantação.', 'warning', 40),
  ('risco', 'Em risco', 'Contas com sinais de risco de saída.', 'danger', 50)
on conflict (key) do update
set label = excluded.label, description = excluded.description, color_token = excluded.color_token, sort_order = excluded.sort_order;

create or replace function public.rpc_admin_create_customer_segment(
  p_key text, p_label text, p_description text default null, p_color_token text default null, p_sort_order integer default 0
) returns public.customer_segments
language plpgsql security definer set search_path = '' as $$
declare v_actor uuid; v_row public.customer_segments;
begin
  v_actor := app_private.require_active_actor();
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_create_customer_segment denied';
  end if;
  insert into public.customer_segments (key, label, description, color_token, sort_order)
  values (lower(btrim(p_key)), btrim(p_label), nullif(btrim(coalesce(p_description,'')),''), nullif(btrim(coalesce(p_color_token,'')),''), coalesce(p_sort_order,0))
  returning * into v_row;
  return v_row;
end; $$;

create or replace function public.rpc_admin_archive_customer_segment(p_id uuid)
returns public.customer_segments
language plpgsql security definer set search_path = '' as $$
declare v_actor uuid; v_row public.customer_segments;
begin
  v_actor := app_private.require_active_actor();
  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_archive_customer_segment denied';
  end if;
  update public.customer_segments set is_active = false where id = p_id returning * into v_row;
  if v_row.id is null then raise exception 'rpc_admin_archive_customer_segment not found'; end if;
  return v_row;
end; $$;

grant execute on function public.rpc_admin_create_customer_segment(text, text, text, text, integer) to authenticated;
grant execute on function public.rpc_admin_archive_customer_segment(uuid) to authenticated;
