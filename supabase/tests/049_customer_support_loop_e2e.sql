create extension if not exists pgtap with schema extensions;

begin;

select plan(10);

-- =============================================================================
-- 049 — Loop cliente <-> suporte de ponta a ponta (Ciclo 11 do build autônomo)
-- Valida, pelos contratos reais (RPCs + views), que:
--   1. o cliente abre chamado e conversa pelo portal;
--   2. a resposta pública do suporte aparece na timeline do portal;
--   3. a nota interna do suporte NUNCA aparece no portal;
--   4. o suporte enxerga tudo na timeline operacional;
--   5. o cliente não consegue escrever nota interna.
-- =============================================================================

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '99999999-e2ee-4999-8999-999999999901', 'authenticated', 'authenticated', 'admin@loop-e2e.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Admin Loop"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '99999999-e2ee-4999-8999-999999999902', 'authenticated', 'authenticated', 'cliente@loop-e2e.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Cliente Loop"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '99999999-e2ee-4999-8999-999999999903', 'authenticated', 'authenticated', 'suporte@loop-e2e.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Suporte Loop"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('99999999-e2ee-4999-8999-999999999901', 'platform_admin', '99999999-e2ee-4999-8999-999999999901', '99999999-e2ee-4999-8999-999999999901'),
  ('99999999-e2ee-4999-8999-999999999903', 'support_agent', '99999999-e2ee-4999-8999-999999999901', '99999999-e2ee-4999-8999-999999999901');

insert into public.tenants (
  id,
  slug,
  legal_name,
  display_name,
  status,
  created_by_user_id,
  updated_by_user_id
)
values
  ('cccccccc-e2ee-4ccc-8ccc-cccccccccc01', 'loop-e2e-tenant', 'Loop E2E LTDA', 'Loop E2E', 'active', '99999999-e2ee-4999-8999-999999999901', '99999999-e2ee-4999-8999-999999999901');

insert into public.tenant_memberships (
  tenant_id,
  user_id,
  role,
  status,
  invited_by_user_id,
  created_by_user_id,
  updated_by_user_id
)
values
  ('cccccccc-e2ee-4ccc-8ccc-cccccccccc01', '99999999-e2ee-4999-8999-999999999902', 'customer_user', 'active', '99999999-e2ee-4999-8999-999999999901', '99999999-e2ee-4999-8999-999999999901', '99999999-e2ee-4999-8999-999999999901'),
  ('cccccccc-e2ee-4ccc-8ccc-cccccccccc01', '99999999-e2ee-4999-8999-999999999903', 'tenant_viewer', 'active', '99999999-e2ee-4999-8999-999999999901', '99999999-e2ee-4999-8999-999999999901', '99999999-e2ee-4999-8999-999999999901');

insert into public.tenant_contacts (
  id,
  tenant_id,
  linked_user_id,
  full_name,
  email,
  is_primary,
  created_by_user_id,
  updated_by_user_id
)
values
  ('cccccccc-e2ee-4ccc-8ccc-cccccccccc02', 'cccccccc-e2ee-4ccc-8ccc-cccccccccc01', '99999999-e2ee-4999-8999-999999999902', 'Cliente Loop', 'cliente@loop-e2e.local', true, '99999999-e2ee-4999-8999-999999999901', '99999999-e2ee-4999-8999-999999999901');

insert into public.customer_account_features (
  tenant_id,
  feature_key,
  enabled,
  source,
  created_by_user_id,
  updated_by_user_id
)
values
  ('cccccccc-e2ee-4ccc-8ccc-cccccccccc01', 'returns_portal', true, 'contract', '99999999-e2ee-4999-8999-999999999901', '99999999-e2ee-4999-8999-999999999901')
on conflict (tenant_id, lower(feature_key)) do update
set
  enabled = excluded.enabled,
  source = excluded.source,
  updated_by_user_id = excluded.updated_by_user_id;

-- Contexto compartilhado entre os passos (preenchido após o cliente criar o chamado).
create temporary table e2e_ctx (ticket_id uuid);
grant select on e2e_ctx to authenticated;

-- ---------------------------------------------------------------------------
-- Passo 1 — cliente abre chamado pelo portal (RPC real)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '99999999-e2ee-4999-8999-999999999902';

select lives_ok(
  $$ select public.rpc_customer_create_ticket('cccccccc-e2ee-4ccc-8ccc-cccccccccc01', 'Chamado do loop E2E', 'Chamado criado para validar o loop cliente-suporte.') $$,
  'cliente cria chamado pelo portal'
);

reset role;

insert into e2e_ctx (ticket_id)
select t.id
from public.tickets as t
where t.tenant_id = 'cccccccc-e2ee-4ccc-8ccc-cccccccccc01'
  and t.title = 'Chamado do loop E2E';

-- ---------------------------------------------------------------------------
-- Passo 2 — chamado aparece na lista do portal e cliente conversa
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '99999999-e2ee-4999-8999-999999999902';

select ok(
  exists (
    select 1
    from public.vw_customer_portal_ticket_list
    where ticket_id = (select ticket_id from e2e_ctx)
  ),
  'chamado criado aparece na lista do portal do cliente'
);

select lives_ok(
  $$ select public.rpc_customer_add_ticket_message((select ticket_id from e2e_ctx), 'Mensagem do cliente no loop E2E.') $$,
  'cliente envia mensagem pelo portal'
);

-- Cliente NÃO consegue registrar nota interna (fronteira de escrita).
select throws_ok(
  $$ select public.rpc_add_internal_ticket_note((select ticket_id from e2e_ctx), 'Cliente tentando nota interna.') $$,
  'P0001',
  'rpc_add_internal_ticket_note denied',
  'cliente nao consegue registrar nota interna'
);

-- ---------------------------------------------------------------------------
-- Passo 3 — suporte responde (público) e registra nota interna
-- ---------------------------------------------------------------------------
set local request.jwt.claim.sub = '99999999-e2ee-4999-8999-999999999903';

select lives_ok(
  $$ select public.rpc_add_ticket_message((select ticket_id from e2e_ctx), 'Resposta publica do suporte no loop E2E.') $$,
  'suporte envia resposta publica'
);

select lives_ok(
  $$ select public.rpc_add_internal_ticket_note((select ticket_id from e2e_ctx), 'Nota interna do suporte no loop E2E.') $$,
  'suporte registra nota interna'
);

-- Suporte enxerga as tres entradas na timeline operacional.
select is(
  (
    select count(*)::integer
    from public.vw_support_ticket_timeline_recent
    where ticket_id = (select ticket_id from e2e_ctx)
      and body in (
        'Mensagem do cliente no loop E2E.',
        'Resposta publica do suporte no loop E2E.',
        'Nota interna do suporte no loop E2E.'
      )
  ),
  3,
  'timeline do suporte mostra mensagem do cliente, resposta publica e nota interna'
);

-- ---------------------------------------------------------------------------
-- Passo 4 — visão do cliente: resposta pública entra, nota interna nunca
-- ---------------------------------------------------------------------------
set local request.jwt.claim.sub = '99999999-e2ee-4999-8999-999999999902';

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_timeline
    where ticket_id = (select ticket_id from e2e_ctx)
      and body = 'Resposta publica do suporte no loop E2E.'
  ),
  1,
  'resposta publica do suporte aparece na timeline do portal'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_timeline
    where ticket_id = (select ticket_id from e2e_ctx)
      and body = 'Mensagem do cliente no loop E2E.'
  ),
  1,
  'mensagem do cliente aparece na timeline do portal'
);

select is(
  (
    select count(*)::integer
    from public.vw_customer_portal_ticket_timeline
    where ticket_id = (select ticket_id from e2e_ctx)
      and (
        body = 'Nota interna do suporte no loop E2E.'
        or event_type in ('internal_note_added', 'engineering_update_added')
      )
  ),
  0,
  'nota interna do suporte nunca aparece na timeline do portal'
);

reset role;

select * from finish();
rollback;
