create extension if not exists pgtap with schema extensions;

begin;

select plan(21);

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
  ('00000000-0000-0000-0000-000000000000', '11111111-eeee-4111-8111-111111111111', 'authenticated', 'authenticated', 'admin@channel-readiness.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Channel Readiness Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '22222222-eeee-4222-8222-222222222222', 'authenticated', 'authenticated', 'support@channel-readiness.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Channel Readiness Support"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '33333333-eeee-4333-8333-333333333333', 'authenticated', 'authenticated', 'customer@channel-readiness.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Channel Readiness Customer"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('11111111-eeee-4111-8111-111111111111', 'platform_admin', '11111111-eeee-4111-8111-111111111111', '11111111-eeee-4111-8111-111111111111'),
  ('22222222-eeee-4222-8222-222222222222', 'support_agent', '11111111-eeee-4111-8111-111111111111', '11111111-eeee-4111-8111-111111111111');

insert into public.tenants (
  id,
  slug,
  legal_name,
  display_name,
  status,
  created_by_user_id,
  updated_by_user_id
)
values (
  'aaaaaaaa-eeee-4aaa-8aaa-111111111111',
  'channel-readiness-a',
  'Channel Readiness A LTDA',
  'Channel Readiness A',
  'active',
  '11111111-eeee-4111-8111-111111111111',
  '11111111-eeee-4111-8111-111111111111'
);

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
  ('aaaaaaaa-eeee-4aaa-8aaa-111111111111', '22222222-eeee-4222-8222-222222222222', 'tenant_viewer', 'active', '11111111-eeee-4111-8111-111111111111', '11111111-eeee-4111-8111-111111111111', '11111111-eeee-4111-8111-111111111111'),
  ('aaaaaaaa-eeee-4aaa-8aaa-111111111111', '33333333-eeee-4333-8333-333333333333', 'customer_user', 'active', '11111111-eeee-4111-8111-111111111111', '11111111-eeee-4111-8111-111111111111', '11111111-eeee-4111-8111-111111111111');

insert into public.customer_account_features (
  tenant_id,
  feature_key,
  enabled,
  source,
  created_by_user_id,
  updated_by_user_id
)
values (
  'aaaaaaaa-eeee-4aaa-8aaa-111111111111',
  'returns_portal',
  true,
  'contract',
  '11111111-eeee-4111-8111-111111111111',
  '11111111-eeee-4111-8111-111111111111'
);

insert into public.tenant_contacts (
  id,
  tenant_id,
  linked_user_id,
  full_name,
  email,
  is_primary,
  is_active,
  created_by_user_id,
  updated_by_user_id
)
values (
  'aaaaaaaa-eeee-4000-8000-111111111111',
  'aaaaaaaa-eeee-4aaa-8aaa-111111111111',
  '33333333-eeee-4333-8333-333333333333',
  'Cliente Channel Readiness',
  'customer@channel-readiness.local',
  true,
  true,
  '11111111-eeee-4111-8111-111111111111',
  '11111111-eeee-4111-8111-111111111111'
);

select ok(
  to_regclass('public.communication_channel_definitions') is not null
  and to_regclass('public.tenant_communication_channel_settings') is not null,
  'tabelas de definicao e readiness de canais existem'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_admin_communication_channel_readiness', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_support_tenant_communication_capabilities', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_support_ticket_channel_readiness', 'SELECT'),
  'authenticated recebe SELECT nos read models de readiness'
);

select ok(
  not has_table_privilege('authenticated', 'public.tenant_communication_channel_settings', 'INSERT')
  and not has_table_privilege('authenticated', 'public.tenant_communication_channel_settings', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.tenant_communication_channel_settings', 'DELETE'),
  'authenticated nao possui DML direto em settings de canal'
);

select is(
  (
    select count(*)::integer
    from public.communication_channel_definitions
    where is_external
      and status_global <> 'active'::public.communication_channel_readiness_status
  ),
  4,
  'canais externos globais nascem sem status active'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '11111111-eeee-4111-8111-111111111111';

select is(
  (
    select readiness_status
    from public.vw_admin_communication_channel_readiness
    where tenant_id = 'aaaaaaaa-eeee-4aaa-8aaa-111111111111'
      and channel_key = 'customer_portal'::public.ticket_delivery_channel
  ),
  'active'::public.communication_channel_readiness_status,
  'admin ve Portal ativo por fallback governado'
);

select is(
  (
    select readiness_status
    from public.vw_admin_communication_channel_readiness
    where tenant_id = 'aaaaaaaa-eeee-4aaa-8aaa-111111111111'
      and channel_key = 'email_future'::public.ticket_delivery_channel
  ),
  'not_configured'::public.communication_channel_readiness_status,
  'admin ve email futuro como nao configurado'
);

select throws_ok(
  $$
    select public.rpc_admin_update_tenant_channel_readiness(
      'aaaaaaaa-eeee-4aaa-8aaa-111111111111'::uuid,
      'email_future'::public.ticket_delivery_channel,
      'active'::public.communication_channel_readiness_status,
      null,
      null,
      null
    )
  $$,
  'P0001',
  'external channel cannot be activated without provider contract',
  'RPC bloqueia ativacao de canal externo sem contrato de provider'
);

select throws_ok(
  $$
    select public.rpc_admin_update_tenant_channel_readiness(
      'aaaaaaaa-eeee-4aaa-8aaa-111111111111'::uuid,
      'email_future'::public.ticket_delivery_channel,
      'not_configured'::public.communication_channel_readiness_status,
      'guardar token secreto aqui',
      null,
      null
    )
  $$,
  'P0001',
  'channel readiness cannot store secrets or credentials',
  'RPC bloqueia texto com segredo em readiness'
);

select lives_ok(
  $$
    select public.rpc_admin_mark_channel_future_ready(
      'aaaaaaaa-eeee-4aaa-8aaa-111111111111'::uuid,
      'email_future'::public.ticket_delivery_channel,
      'Provider oficial, identidade de remetente e auditoria de envio antes de ativar.',
      'Observacao administrativa sanitizada.'
    )
  $$,
  'admin pode registrar readiness futura sem ativar envio real'
);

select ok(
  (
    select can_send is false
      and readiness_status = 'future'::public.communication_channel_readiness_status
    from public.vw_admin_communication_channel_readiness
    where tenant_id = 'aaaaaaaa-eeee-4aaa-8aaa-111111111111'
      and channel_key = 'email_future'::public.ticket_delivery_channel
  ),
  'email futuro continua sem can_send apos marca de futuro'
);

set local request.jwt.claim.sub = '22222222-eeee-4222-8222-222222222222';

select is(
  (
    select count(*)::integer
    from public.vw_support_tenant_communication_capabilities
    where tenant_id = 'aaaaaaaa-eeee-4aaa-8aaa-111111111111'
  ),
  5,
  'suporte ve cinco capabilities do tenant autorizado'
);

select lives_ok(
  $$
    select public.rpc_create_ticket(
      'aaaaaaaa-eeee-4aaa-8aaa-111111111111'::uuid,
      'Ticket readiness portal',
      'Ticket para validar readiness de canal.',
      'portal'::public.ticket_source,
      'normal'::public.ticket_priority,
      'medium'::public.ticket_severity,
      'aaaaaaaa-eeee-4000-8000-111111111111'::uuid,
      null,
      null
    )
  $$,
  'suporte cria ticket de portal para validar channel context'
);

select ok(
  (
    select can_reply_now
    from public.vw_support_ticket_channel_context
    where ticket_id = (
      select id
      from public.vw_support_tickets_queue
      where title = 'Ticket readiness portal'
    )
  ),
  'portal ativo permite resposta publica antes de disable'
);

set local request.jwt.claim.sub = '11111111-eeee-4111-8111-111111111111';

select lives_ok(
  $$
    select public.rpc_admin_disable_tenant_channel(
      'aaaaaaaa-eeee-4aaa-8aaa-111111111111'::uuid,
      'customer_portal'::public.ticket_delivery_channel,
      'Portal desabilitado temporariamente por governanca QA.'
    )
  $$,
  'admin desabilita canal nativo por RPC auditada'
);

set local request.jwt.claim.sub = '22222222-eeee-4222-8222-222222222222';

select is(
  (
    select can_reply_now
    from public.vw_support_ticket_channel_context
    where ticket_id = (
      select id
      from public.vw_support_tickets_queue
      where title = 'Ticket readiness portal'
    )
  ),
  false,
  'support context bloqueia resposta quando Portal do tenant esta desabilitado'
);

select is(
  (
    select reason_if_unavailable
    from public.vw_support_ticket_channel_context
    where ticket_id = (
      select id
      from public.vw_support_tickets_queue
      where title = 'Ticket readiness portal'
    )
  ),
  'Portal desabilitado temporariamente por governanca QA.',
  'motivo de bloqueio vem do backend'
);

select is(
  (
    select can_deliver_now
    from public.vw_support_ticket_delivery_capabilities
    where ticket_id = (
      select id
      from public.vw_support_tickets_queue
      where title = 'Ticket readiness portal'
    )
      and channel = 'customer_portal'::public.ticket_delivery_channel
  ),
  false,
  'delivery capability tambem respeita readiness desabilitado'
);

set local request.jwt.claim.sub = '33333333-eeee-4333-8333-333333333333';

select is(
  (
    select count(*)::integer
    from public.vw_support_tenant_communication_capabilities
    where tenant_id = 'aaaaaaaa-eeee-4aaa-8aaa-111111111111'
  ),
  0,
  'customer_user nao le readiness tecnico de suporte'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vw_customer_portal_ticket_detail'
      and column_name in ('provider_state', 'readiness_status', 'reason_if_unavailable')
  ),
  0,
  'portal nao recebe colunas tecnicas de readiness'
);

reset role;

select ok(
  exists (
    select 1
    from audit.audit_logs
    where entity_schema = 'public'
      and entity_table = 'tenant_communication_channel_settings'
      and tenant_id = 'aaaaaaaa-eeee-4aaa-8aaa-111111111111'
  ),
  'mutacao de readiness gera audit log'
);

select is(
  (
    select count(*)::integer
    from public.vw_admin_communication_delivery_summary
  ),
  0,
  'admin delivery summary nao vaza linhas sem ator autenticado'
);

select * from finish();

rollback;
