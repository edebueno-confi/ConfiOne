create extension if not exists pgtap with schema extensions;

begin;

select plan(25);

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
  ('00000000-0000-0000-0000-000000000000', '11111111-faaa-4111-8111-111111111111', 'authenticated', 'authenticated', 'admin@ai-readiness.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"AI Readiness Admin"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '22222222-faaa-4222-8222-222222222222', 'authenticated', 'authenticated', 'support@ai-readiness.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"AI Readiness Support"}'::jsonb, timezone('utc', now()), timezone('utc', now())),
  ('00000000-0000-0000-0000-000000000000', '33333333-faaa-4333-8333-333333333333', 'authenticated', 'authenticated', 'customer@ai-readiness.local', crypt('password', gen_salt('bf')), timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"AI Readiness Customer"}'::jsonb, timezone('utc', now()), timezone('utc', now()));

insert into public.user_global_roles (
  user_id,
  role,
  created_by_user_id,
  updated_by_user_id
)
values
  ('11111111-faaa-4111-8111-111111111111', 'platform_admin', '11111111-faaa-4111-8111-111111111111', '11111111-faaa-4111-8111-111111111111'),
  ('22222222-faaa-4222-8222-222222222222', 'support_agent', '11111111-faaa-4111-8111-111111111111', '11111111-faaa-4111-8111-111111111111');

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
  'aaaaaaaa-faaa-4aaa-8aaa-111111111111',
  'ai-readiness-a',
  'AI Readiness A LTDA',
  'AI Readiness A',
  'active',
  '11111111-faaa-4111-8111-111111111111',
  '11111111-faaa-4111-8111-111111111111'
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
  ('aaaaaaaa-faaa-4aaa-8aaa-111111111111', '22222222-faaa-4222-8222-222222222222', 'tenant_viewer', 'active', '11111111-faaa-4111-8111-111111111111', '11111111-faaa-4111-8111-111111111111', '11111111-faaa-4111-8111-111111111111'),
  ('aaaaaaaa-faaa-4aaa-8aaa-111111111111', '33333333-faaa-4333-8333-333333333333', 'customer_user', 'active', '11111111-faaa-4111-8111-111111111111', '11111111-faaa-4111-8111-111111111111', '11111111-faaa-4111-8111-111111111111');

insert into public.customer_account_features (
  tenant_id,
  feature_key,
  enabled,
  source,
  created_by_user_id,
  updated_by_user_id
)
values (
  'aaaaaaaa-faaa-4aaa-8aaa-111111111111',
  'returns_portal',
  true,
  'contract',
  '11111111-faaa-4111-8111-111111111111',
  '11111111-faaa-4111-8111-111111111111'
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
  'aaaaaaaa-faaa-4000-8000-111111111111',
  'aaaaaaaa-faaa-4aaa-8aaa-111111111111',
  '33333333-faaa-4333-8333-333333333333',
  'Cliente AI Readiness',
  'customer@ai-readiness.local',
  true,
  true,
  '11111111-faaa-4111-8111-111111111111',
  '11111111-faaa-4111-8111-111111111111'
);

select ok(
  to_regclass('public.ai_context_source_policies') is not null
  and to_regclass('public.ai_action_policies') is not null
  and to_regclass('public.ai_usage_audit_events') is not null,
  'tabelas AI-native de policies e auditoria existem'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_ai_context_source_policies', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_ai_action_policies', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_ai_operational_context_readiness', 'SELECT')
  and has_table_privilege('authenticated', 'public.vw_ai_usage_audit_events', 'SELECT'),
  'authenticated recebe SELECT apenas nos read models AI-native'
);

select ok(
  not has_table_privilege('authenticated', 'public.ai_context_source_policies', 'INSERT')
  and not has_table_privilege('authenticated', 'public.ai_action_policies', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.ai_usage_audit_events', 'DELETE'),
  'authenticated nao possui DML direto nas tabelas AI-native'
);

select is(
  (select count(*)::integer from public.ai_context_source_policies),
  11,
  'catalogo AI-readable possui onze fontes canonicas'
);

select is(
  (select count(*)::integer from public.ai_action_policies where decision = 'denied'::public.ai_policy_decision),
  12,
  'catalogo de acoes bloqueia doze automacoes proibidas'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '11111111-faaa-4111-8111-111111111111';

select ok(
  (
    select readiness_status = 'prepared_not_active'
      and llm_provider_configured is false
      and embeddings_enabled is false
      and auto_send_enabled is false
      and auto_publish_enabled is false
    from public.vw_ai_operational_context_readiness
  ),
  'admin ve IA operacional preparada, nao ativa, sem provider, embedding ou automacao'
);

select is(
  (
    select decision
    from public.vw_ai_action_policies
    where action_key = 'auto_send'::public.ai_action_key
  ),
  'denied'::public.ai_policy_decision,
  'auto_send e proibido por policy'
);

select is(
  (
    select requires_human_review
    from public.vw_ai_action_policies
    where action_key = 'suggest_reply'::public.ai_action_key
  ),
  true,
  'suggest_reply exige revisao humana'
);

set local request.jwt.claim.sub = '22222222-faaa-4222-8222-222222222222';

select lives_ok(
  $$
    select public.rpc_create_ticket(
      'aaaaaaaa-faaa-4aaa-8aaa-111111111111'::uuid,
      'Ticket AI readiness',
      'Ticket para validar policy AI-native.',
      'internal'::public.ticket_source,
      'normal'::public.ticket_priority,
      'medium'::public.ticket_severity,
      'aaaaaaaa-faaa-4000-8000-111111111111'::uuid,
      null,
      null
    )
  $$,
  'suporte cria ticket para validar readiness AI-native'
);

select is(
  (
    select count(*)::integer
    from public.vw_ai_context_source_policies
  ),
  9,
  'suporte ve apenas policies aplicaveis a suporte/public/customer-facing'
);

select ok(
  (
    select allowed
      and decision = 'requires_review'::public.ai_policy_decision
      and requires_human_review
    from public.rpc_ai_validate_context_access(
      'support_ticket'::public.ai_source_type,
      'aaaaaaaa-faaa-4aaa-8aaa-111111111111'::uuid,
      (select id from public.vw_support_tickets_queue where title = 'Ticket AI readiness'),
      'summarize'::public.ai_intended_use,
      'support_internal_review'
    )
  ),
  'suporte autorizado valida fonte support_ticket apenas como rascunho revisado'
);

select ok(
  not (
    select allowed
    from public.rpc_ai_validate_context_access(
      'knowledge_article_internal'::public.ai_source_type,
      'aaaaaaaa-faaa-4aaa-8aaa-111111111111'::uuid,
      null,
      'suggest_article'::public.ai_intended_use,
      'customer_facing'
    )
  ),
  'Knowledge interna nao pode virar destino customer-facing'
);

select is(
  (
    select decision
    from public.rpc_ai_validate_context_access(
      'customer_portal_ticket'::public.ai_source_type,
      'aaaaaaaa-faaa-4aaa-8aaa-111111111111'::uuid,
      null,
      'summarize'::public.ai_intended_use,
      'customer_portal_assistive_future'
    )
  ),
  'future'::public.ai_policy_decision,
  'assistencia AI no portal permanece futura'
);

select lives_ok(
  $$
    select public.rpc_ai_log_usage_event(
      'aaaaaaaa-faaa-4aaa-8aaa-111111111111'::uuid,
      'support_ticket'::public.ai_source_type,
      'summarize'::public.ai_intended_use,
      jsonb_build_array((select id from public.vw_support_tickets_queue where title = 'Ticket AI readiness')),
      'ticket_summary_draft',
      'support_internal_review',
      jsonb_build_object('phase', 'p3_readiness')
    )
  $$,
  'suporte registra evento de uso AI-native sem prompt/output'
);

select is(
  (
    select count(*)::integer
    from public.vw_ai_usage_audit_events
    where tenant_id = 'aaaaaaaa-faaa-4aaa-8aaa-111111111111'
      and provider_configured is false
      and prompt_stored is false
      and output_stored is false
  ),
  1,
  'ledger de uso nao armazena provider, modelo, prompt ou output'
);

select throws_ok(
  $$
    select public.rpc_ai_log_usage_event(
      'aaaaaaaa-faaa-4aaa-8aaa-111111111111'::uuid,
      'support_ticket'::public.ai_source_type,
      'summarize'::public.ai_intended_use,
      '[]'::jsonb,
      'ticket_summary_draft',
      'support_internal_review',
      '{"token":"nao pode"}'::jsonb
    )
  $$,
  'P0001',
  'AI usage audit cannot store secrets or credentials',
  'ledger bloqueia metadata com segredo'
);

select throws_ok(
  $$
    select public.rpc_ai_log_usage_event(
      'aaaaaaaa-faaa-4aaa-8aaa-111111111111'::uuid,
      'customer_portal_ticket'::public.ai_source_type,
      'summarize'::public.ai_intended_use,
      '[]'::jsonb,
      'portal_assistive_future',
      'customer_portal_assistive_future',
      '{}'::jsonb
    )
  $$,
  'P0001',
  'AI context access denied: Fonte preparada para futuro; IA real nao esta ativa.',
  'ledger bloqueia fonte futura do portal'
);

select lives_ok(
  $$
    select public.rpc_ai_register_human_review_decision(
      (select id from public.vw_ai_usage_audit_events where tenant_id = 'aaaaaaaa-faaa-4aaa-8aaa-111111111111' order by created_at desc limit 1),
      'approved'::public.ai_review_decision,
      'Revisao humana aprovada para validar ledger.'
    )
  $$,
  'decisao humana pode aprovar evento auditado'
);

select is(
  (
    select review_decision
    from public.vw_ai_usage_audit_events
    where tenant_id = 'aaaaaaaa-faaa-4aaa-8aaa-111111111111'
    order by created_at desc
    limit 1
  ),
  'approved'::public.ai_review_decision,
  'evento registra decisao humana'
);

select throws_ok(
  $$
    select public.rpc_ai_register_human_review_decision(
      (select id from public.vw_ai_usage_audit_events where tenant_id = 'aaaaaaaa-faaa-4aaa-8aaa-111111111111' order by created_at desc limit 1),
      'pending'::public.ai_review_decision,
      null
    )
  $$,
  'P0001',
  'human review decision must be approved, rejected or discarded',
  'review nao aceita pending como decisao final'
);

select throws_ok(
  $$
    select public.rpc_ai_register_human_review_decision(
      (select id from public.vw_ai_usage_audit_events where tenant_id = 'aaaaaaaa-faaa-4aaa-8aaa-111111111111' order by created_at desc limit 1),
      'rejected'::public.ai_review_decision,
      'continha token operacional'
    )
  $$,
  'P0001',
  'AI human review note cannot store secrets or credentials',
  'review note bloqueia segredo'
);

select ok(
  (
    select requires_citation and source_status = 'allowed'::public.ai_source_status
    from public.vw_ai_context_source_policies
    where source_type = 'knowledge_article_public'::public.ai_source_type
  ),
  'Knowledge publica exige citacao'
);

set local request.jwt.claim.sub = '33333333-faaa-4333-8333-333333333333';

select is(
  (select count(*)::integer from public.vw_ai_context_source_policies),
  0,
  'customer_user nao ve policies AI internas'
);

select ok(
  not (
    select allowed
    from public.rpc_ai_validate_context_access(
      'support_ticket'::public.ai_source_type,
      'aaaaaaaa-faaa-4aaa-8aaa-111111111111'::uuid,
      null,
      'summarize'::public.ai_intended_use,
      'support_internal_review'
    )
  ),
  'customer_user nao valida contexto de suporte'
);

select is(
  (select count(*)::integer from public.vw_ai_usage_audit_events),
  0,
  'customer_user nao ve ledger AI interno'
);

select * from finish();

rollback;
