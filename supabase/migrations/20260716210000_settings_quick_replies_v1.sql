-- Parametrizacao: Respostas rapidas + leitura de parametros para o time de suporte.

create table if not exists public.quick_replies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint quick_replies_title_len check (char_length(btrim(title)) between 2 and 80),
  constraint quick_replies_body_len check (char_length(btrim(body)) between 2 and 4000),
  constraint quick_replies_no_secret_words
    check (
      not (coalesce(title, '') || ' ' || coalesce(body, ''))
        ~* '(secret|password|senha|api[_ -]?key|authorization|bearer)'
    )
);

create trigger quick_replies_touch_updated_at
before update on public.quick_replies
for each row
execute function app_private.touch_updated_at();

create trigger quick_replies_audit_row_change
after insert or update or delete on public.quick_replies
for each row
execute function audit.capture_row_change();

alter table public.quick_replies enable row level security;
revoke all on public.quick_replies from anon;
grant select on public.quick_replies to authenticated;
grant select on public.quick_replies to service_role;

drop policy if exists quick_replies_select_operational on public.quick_replies;
create policy quick_replies_select_operational
on public.quick_replies
for select
to authenticated
using (
  app_private.has_global_role('platform_admin'::public.platform_role)
  or app_private.has_global_role('support_manager'::public.platform_role)
  or app_private.has_global_role('support_agent'::public.platform_role)
);

-- Suporte tambem pode LER os demais parametros (uso operacional na Inbox).
drop policy if exists conversation_types_select_support on public.conversation_types;
create policy conversation_types_select_support
on public.conversation_types
for select
to authenticated
using (
  app_private.has_global_role('support_manager'::public.platform_role)
  or app_private.has_global_role('support_agent'::public.platform_role)
);

drop policy if exists priority_levels_select_support on public.priority_levels;
create policy priority_levels_select_support
on public.priority_levels
for select
to authenticated
using (
  app_private.has_global_role('support_manager'::public.platform_role)
  or app_private.has_global_role('support_agent'::public.platform_role)
);

insert into public.quick_replies (title, body, sort_order)
values
  ('Recebido, em análise', 'Olá! Recebemos a sua solicitação e já estamos analisando. Retornamos em breve com uma atualização.', 10),
  ('Pedir mais detalhes', 'Olá! Para avançar na tratativa, você poderia nos enviar mais detalhes (número do pedido, prints ou o passo a passo do que aconteceu)?', 20),
  ('Encaminhado ao time técnico', 'Olá! Encaminhamos o seu caso ao time técnico responsável. Assim que tivermos um retorno, avisamos por aqui.', 30)
on conflict do nothing;

create or replace function public.rpc_admin_create_quick_reply(
  p_title text,
  p_body text,
  p_sort_order integer default 0
)
returns public.quick_replies
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_row public.quick_replies;
begin
  v_actor := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_create_quick_reply denied';
  end if;

  insert into public.quick_replies (title, body, sort_order)
  values (btrim(p_title), btrim(p_body), coalesce(p_sort_order, 0))
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.rpc_admin_archive_quick_reply(
  p_id uuid
)
returns public.quick_replies
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_row public.quick_replies;
begin
  v_actor := app_private.require_active_actor();

  if not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'rpc_admin_archive_quick_reply denied';
  end if;

  update public.quick_replies
  set is_active = false
  where id = p_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'rpc_admin_archive_quick_reply not found';
  end if;

  return v_row;
end;
$$;

grant execute on function public.rpc_admin_create_quick_reply(text, text, integer) to authenticated;
grant execute on function public.rpc_admin_archive_quick_reply(uuid) to authenticated;
