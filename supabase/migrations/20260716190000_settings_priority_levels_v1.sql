-- Parametrizacao: Niveis de prioridade (parametro do modulo de Configuracoes).
-- Mesmo padrao de conversation_types: config global governada por platform_admin.

create table if not exists public.priority_levels (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  weight integer not null default 0,
  color_token text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint priority_levels_key_format
    check (key ~ '^[a-z][a-z0-9_]{1,48}$'),
  constraint priority_levels_color_token_check
    check (color_token is null or color_token in ('danger', 'warning', 'info', 'success', 'neutral')),
  constraint priority_levels_no_secret_words
    check (
      not (
        coalesce(label, '') || ' ' || coalesce(color_token, '')
      ) ~* '(secret|password|senha|api[_ -]?key|authorization|bearer)'
    )
);

create trigger priority_levels_touch_updated_at
before update on public.priority_levels
for each row
execute function app_private.touch_updated_at();

create trigger priority_levels_audit_row_change
after insert or update or delete on public.priority_levels
for each row
execute function audit.capture_row_change();

alter table public.priority_levels enable row level security;
revoke all on public.priority_levels from anon;
grant select on public.priority_levels to authenticated;
grant select on public.priority_levels to service_role;

drop policy if exists priority_levels_select_platform_admin on public.priority_levels;
create policy priority_levels_select_platform_admin
on public.priority_levels
for select
to authenticated
using (app_private.has_global_role('platform_admin'::public.platform_role));

insert into public.priority_levels (key, label, weight, color_token, sort_order)
values
  ('baixa', 'Baixa', 10, 'neutral', 10),
  ('normal', 'Normal', 20, 'info', 20),
  ('alta', 'Alta', 30, 'warning', 30),
  ('urgente', 'Urgente', 40, 'danger', 40)
on conflict (key) do update
set
  label = excluded.label,
  weight = excluded.weight,
  color_token = excluded.color_token,
  sort_order = excluded.sort_order;
