-- Parametrizacao: Tipos de conversa (primeiro parametro do modulo de Configuracoes).
-- Config global governada por platform_admin. Aditivo e nao destrutivo.

create table if not exists public.conversation_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text,
  default_area_key text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint conversation_types_key_format
    check (key ~ '^[a-z][a-z0-9_]{1,48}$'),
  constraint conversation_types_no_secret_words
    check (
      not (
        coalesce(label, '') || ' ' || coalesce(description, '') || ' ' || coalesce(default_area_key, '')
      ) ~* '(token|secret|password|senha|api[_ -]?key|authorization|bearer)'
    )
);

create trigger conversation_types_touch_updated_at
before update on public.conversation_types
for each row
execute function app_private.touch_updated_at();

create trigger conversation_types_audit_row_change
after insert or update or delete on public.conversation_types
for each row
execute function audit.capture_row_change();

alter table public.conversation_types enable row level security;
revoke all on public.conversation_types from anon;
grant select on public.conversation_types to authenticated;
grant select on public.conversation_types to service_role;

drop policy if exists conversation_types_select_platform_admin on public.conversation_types;
create policy conversation_types_select_platform_admin
on public.conversation_types
for select
to authenticated
using (app_private.has_global_role('platform_admin'::public.platform_role));

insert into public.conversation_types (key, label, description, default_area_key, sort_order)
values
  ('duvida', 'Dúvida', 'Pergunta do cliente sobre uso, prazos ou funcionamento.', 'suporte', 10),
  ('solicitacao', 'Solicitação', 'Pedido operacional do cliente (ajuste, configuração, informação).', 'suporte', 20),
  ('incidente', 'Incidente / bug', 'Algo não está funcionando como deveria.', 'produto', 30),
  ('melhoria', 'Melhoria', 'Sugestão ou pedido de evolução do produto.', 'produto', 40),
  ('projeto', 'Projeto', 'Demanda maior, com etapas e acompanhamento.', 'produto', 50),
  ('financeiro', 'Financeiro', 'Assunto de cobrança, nota ou pagamento.', 'financeiro', 60)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  default_area_key = excluded.default_area_key,
  sort_order = excluded.sort_order;
