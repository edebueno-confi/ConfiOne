do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'ai_source_type'
  ) then
    create type public.ai_source_type as enum (
      'support_ticket',
      'ticket_timeline',
      'customer_account',
      'knowledge_article_public',
      'knowledge_article_internal',
      'knowledge_article_restricted',
      'customer_portal_ticket',
      'engineering_work_item',
      'internal_action',
      'documentation',
      'audit_summary'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'ai_source_status'
  ) then
    create type public.ai_source_status as enum (
      'allowed',
      'restricted',
      'forbidden',
      'future'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'ai_source_visibility'
  ) then
    create type public.ai_source_visibility as enum (
      'support_only',
      'admin_only',
      'engineering_only',
      'customer_facing',
      'public',
      'system_only'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'ai_intended_use'
  ) then
    create type public.ai_intended_use as enum (
      'summarize',
      'suggest_reply',
      'suggest_article',
      'detect_gap',
      'classify_suggestion',
      'risk_warning',
      'explain_context',
      'draft_internal_note',
      'draft_article'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'ai_action_key'
  ) then
    create type public.ai_action_key as enum (
      'summarize_ticket',
      'suggest_reply',
      'suggest_article',
      'suggest_category',
      'suggest_priority',
      'detect_documentation_gap',
      'summarize_customer',
      'risk_warning',
      'draft_internal_note',
      'draft_article',
      'auto_send',
      'auto_publish',
      'auto_close_ticket',
      'auto_change_status',
      'auto_create_provider_delivery',
      'auto_expose_internal',
      'auto_modify_entitlement',
      'auto_modify_rls',
      'auto_create_internal_action',
      'auto_create_engineering_work_item',
      'read_storage_path',
      'read_secret'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'ai_policy_decision'
  ) then
    create type public.ai_policy_decision as enum (
      'allowed',
      'denied',
      'requires_review',
      'future'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'ai_review_decision'
  ) then
    create type public.ai_review_decision as enum (
      'pending',
      'approved',
      'rejected',
      'discarded'
    );
  end if;
end $$;

create table if not exists public.ai_context_source_policies (
  policy_key text primary key,
  source_type public.ai_source_type not null unique,
  source_status public.ai_source_status not null,
  visibility public.ai_source_visibility not null,
  allowed_uses public.ai_intended_use[] not null default '{}'::public.ai_intended_use[],
  requires_tenant boolean not null default true,
  requires_entitlement boolean not null default false,
  requires_citation boolean not null default true,
  requires_redaction boolean not null default true,
  allowed_destinations text[] not null default array['internal_review'],
  forbidden_destinations text[] not null default array[]::text[],
  policy_summary text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ai_context_source_policies_no_secret_words
    check (
      not app_private.contains_secret_like_text(array[
        policy_summary,
        array_to_string(allowed_destinations, ' '),
        array_to_string(forbidden_destinations, ' ')
      ])
    ),
  constraint ai_context_source_policies_uses_not_null
    check (array_position(allowed_uses, null) is null),
  constraint ai_context_source_policies_destinations_not_null
    check (
      array_position(allowed_destinations, null) is null
      and array_position(forbidden_destinations, null) is null
    )
);

create trigger ai_context_source_policies_touch_updated_at
before update on public.ai_context_source_policies
for each row
execute function app_private.touch_updated_at();

create trigger ai_context_source_policies_audit_row_change
after insert or update or delete on public.ai_context_source_policies
for each row
execute function audit.capture_row_change();

alter table public.ai_context_source_policies enable row level security;
revoke all on public.ai_context_source_policies from public, anon, authenticated;
grant select on public.ai_context_source_policies to service_role;

create policy ai_context_source_policies_select_internal_roles
on public.ai_context_source_policies
for select
to authenticated
using (
  app_private.has_global_role('platform_admin'::public.platform_role)
  or app_private.has_any_global_role(array[
    'support_manager'::public.platform_role,
    'support_agent'::public.platform_role,
    'engineering_manager'::public.platform_role,
    'engineering_member'::public.platform_role
  ])
);

create table if not exists public.ai_action_policies (
  action_key public.ai_action_key primary key,
  decision public.ai_policy_decision not null,
  requires_human_review boolean not null default true,
  allowed_source_types public.ai_source_type[] not null default '{}'::public.ai_source_type[],
  allowed_destinations text[] not null default array['internal_review'],
  forbidden_reason text,
  audit_required boolean not null default true,
  policy_summary text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ai_action_policies_no_secret_words
    check (
      not app_private.contains_secret_like_text(array[
        policy_summary,
        coalesce(forbidden_reason, ''),
        array_to_string(allowed_destinations, ' ')
      ])
    ),
  constraint ai_action_policies_source_types_not_null
    check (array_position(allowed_source_types, null) is null),
  constraint ai_action_policies_destinations_not_null
    check (array_position(allowed_destinations, null) is null),
  constraint ai_action_policies_denied_reason_required
    check (
      decision <> 'denied'::public.ai_policy_decision
      or nullif(btrim(coalesce(forbidden_reason, '')), '') is not null
    )
);

create trigger ai_action_policies_touch_updated_at
before update on public.ai_action_policies
for each row
execute function app_private.touch_updated_at();

create trigger ai_action_policies_audit_row_change
after insert or update or delete on public.ai_action_policies
for each row
execute function audit.capture_row_change();

alter table public.ai_action_policies enable row level security;
revoke all on public.ai_action_policies from public, anon, authenticated;
grant select on public.ai_action_policies to service_role;

create policy ai_action_policies_select_internal_roles
on public.ai_action_policies
for select
to authenticated
using (
  app_private.has_global_role('platform_admin'::public.platform_role)
  or app_private.has_any_global_role(array[
    'support_manager'::public.platform_role,
    'support_agent'::public.platform_role,
    'engineering_manager'::public.platform_role,
    'engineering_member'::public.platform_role
  ])
);

create table if not exists public.ai_usage_audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete set null,
  actor_user_id uuid not null references public.profiles (id) on delete restrict,
  source_type public.ai_source_type not null,
  intended_use public.ai_intended_use not null,
  policy_key text references public.ai_context_source_policies (policy_key) on delete restrict,
  source_ids jsonb not null default '[]'::jsonb,
  output_type text not null,
  allowed_destination text not null,
  requires_human_review boolean not null default true,
  review_decision public.ai_review_decision not null default 'pending',
  reviewed_by_user_id uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  provider_key text,
  model_key text,
  prompt_text text,
  output_text text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ai_usage_audit_events_source_ids_array
    check (jsonb_typeof(source_ids) = 'array'),
  constraint ai_usage_audit_events_metadata_object
    check (jsonb_typeof(metadata) = 'object'),
  constraint ai_usage_audit_events_no_provider_or_content
    check (
      provider_key is null
      and model_key is null
      and prompt_text is null
      and output_text is null
    ),
  constraint ai_usage_audit_events_no_secret_words
    check (
      not app_private.contains_secret_like_text(array[
        output_type,
        allowed_destination,
        coalesce(review_note, ''),
        metadata::text
      ])
    ),
  constraint ai_usage_audit_events_review_consistency
    check (
      (review_decision = 'pending'::public.ai_review_decision and reviewed_by_user_id is null and reviewed_at is null)
      or (review_decision <> 'pending'::public.ai_review_decision and reviewed_by_user_id is not null and reviewed_at is not null)
    )
);

create index if not exists ai_usage_audit_events_tenant_created_idx
  on public.ai_usage_audit_events (tenant_id, created_at desc);

create index if not exists ai_usage_audit_events_actor_created_idx
  on public.ai_usage_audit_events (actor_user_id, created_at desc);

create trigger ai_usage_audit_events_touch_updated_at
before update on public.ai_usage_audit_events
for each row
execute function app_private.touch_updated_at();

create trigger ai_usage_audit_events_audit_row_change
after insert or update or delete on public.ai_usage_audit_events
for each row
execute function audit.capture_row_change();

alter table public.ai_usage_audit_events enable row level security;
revoke all on public.ai_usage_audit_events from public, anon, authenticated;
grant select, insert, update on public.ai_usage_audit_events to service_role;

create policy ai_usage_audit_events_select_internal_roles
on public.ai_usage_audit_events
for select
to authenticated
using (
  app_private.has_global_role('platform_admin'::public.platform_role)
  or (
    tenant_id is not null
    and (
      app_private.can_access_support_workspace(tenant_id)
      or app_private.can_access_engineering_workspace(tenant_id)
    )
  )
);

insert into public.ai_context_source_policies (
  policy_key,
  source_type,
  source_status,
  visibility,
  allowed_uses,
  requires_tenant,
  requires_entitlement,
  requires_citation,
  requires_redaction,
  allowed_destinations,
  forbidden_destinations,
  policy_summary
)
values
  ('support_ticket_context_v1', 'support_ticket', 'restricted', 'support_only', array['summarize','suggest_reply','suggest_article','detect_gap','classify_suggestion','risk_warning','explain_context','draft_internal_note']::public.ai_intended_use[], true, false, true, true, array['support_internal_review','support_reply_draft','support_internal_note_draft'], array['customer_auto_send'], 'Tickets de suporte podem alimentar apenas rascunhos e explicacoes revisados por humano autorizado ao tenant.'),
  ('ticket_timeline_context_v1', 'ticket_timeline', 'restricted', 'support_only', array['summarize','suggest_reply','detect_gap','risk_warning','explain_context','draft_internal_note']::public.ai_intended_use[], true, false, true, true, array['support_internal_review','support_reply_draft','support_internal_note_draft'], array['customer_auto_send'], 'Timeline de ticket exige redaction de notas internas e citacao de eventos/fontes antes de qualquer uso assistivo.'),
  ('customer_account_context_v1', 'customer_account', 'restricted', 'support_only', array['summarize','risk_warning','explain_context']::public.ai_intended_use[], true, false, true, true, array['support_internal_review'], array['customer_facing'], 'Conta B2B pode resumir contexto operacional para suporte, sem expor alertas, integracoes ou customizacoes ao cliente.'),
  ('knowledge_public_context_v1', 'knowledge_article_public', 'allowed', 'public', array['suggest_reply','suggest_article','detect_gap','explain_context','draft_article']::public.ai_intended_use[], false, false, true, false, array['support_internal_review','support_reply_draft','public_citation'], array['auto_publish'], 'Artigos publicos publicados podem ser usados como fonte citavel, sempre sem publicacao automatica.'),
  ('knowledge_internal_context_v1', 'knowledge_article_internal', 'restricted', 'support_only', array['suggest_article','detect_gap','explain_context','draft_article']::public.ai_intended_use[], true, false, true, true, array['support_internal_review','editorial_draft'], array['customer_facing','customer_auto_send'], 'Knowledge interna pode apoiar operador/editor, mas nunca vira resposta customer-facing sem reclassificacao humana.'),
  ('knowledge_restricted_context_v1', 'knowledge_article_restricted', 'restricted', 'customer_facing', array['suggest_article','explain_context']::public.ai_intended_use[], true, true, true, true, array['support_internal_review','entitled_customer_reply_draft'], array['customer_auto_send'], 'Knowledge restrita exige entitlement antes de qualquer rascunho customer-facing e sempre requer revisao humana.'),
  ('customer_portal_ticket_context_v1', 'customer_portal_ticket', 'future', 'customer_facing', array['summarize','explain_context']::public.ai_intended_use[], true, true, true, true, array['customer_portal_assistive_future'], array['customer_auto_send'], 'Assistencia de IA no portal fica futura; cliente nao recebe readiness nem geracao nesta fase.'),
  ('engineering_work_item_context_v1', 'engineering_work_item', 'restricted', 'engineering_only', array['summarize','risk_warning','explain_context']::public.ai_intended_use[], true, false, true, true, array['engineering_internal_review','support_return_draft'], array['customer_facing'], 'Itens de engenharia podem apoiar resumo tecnico interno, sem conversa direta com cliente.'),
  ('internal_action_context_v1', 'internal_action', 'restricted', 'support_only', array['summarize','risk_warning','explain_context']::public.ai_intended_use[], true, false, true, true, array['internal_area_review','support_return_draft'], array['customer_facing'], 'Acionamentos internos podem apoiar retorno ao suporte, sem alterar ticket nem expor ao portal.'),
  ('documentation_context_v1', 'documentation', 'allowed', 'public', array['explain_context','detect_gap','draft_article']::public.ai_intended_use[], false, false, true, false, array['internal_review','editorial_draft'], array['auto_publish'], 'Documentacao oficial pode apoiar explicacao e lacunas, sempre com citacao e sem publicacao automatica.'),
  ('audit_summary_context_v1', 'audit_summary', 'restricted', 'admin_only', array['summarize','risk_warning','explain_context']::public.ai_intended_use[], true, false, true, true, array['admin_internal_review'], array['customer_facing'], 'Audit bruto nunca e fonte direta; apenas sumarios administrativos sanitizados podem ser usados.')
on conflict (source_type) do update
set
  policy_key = excluded.policy_key,
  source_status = excluded.source_status,
  visibility = excluded.visibility,
  allowed_uses = excluded.allowed_uses,
  requires_tenant = excluded.requires_tenant,
  requires_entitlement = excluded.requires_entitlement,
  requires_citation = excluded.requires_citation,
  requires_redaction = excluded.requires_redaction,
  allowed_destinations = excluded.allowed_destinations,
  forbidden_destinations = excluded.forbidden_destinations,
  policy_summary = excluded.policy_summary;

insert into public.ai_action_policies (
  action_key,
  decision,
  requires_human_review,
  allowed_source_types,
  allowed_destinations,
  forbidden_reason,
  audit_required,
  policy_summary
)
values
  ('summarize_ticket', 'requires_review', true, array['support_ticket','ticket_timeline']::public.ai_source_type[], array['support_internal_review'], null, true, 'Resumo de ticket pode ser preparado como apoio interno e exige revisao humana.'),
  ('suggest_reply', 'requires_review', true, array['support_ticket','ticket_timeline','knowledge_article_public','knowledge_article_restricted']::public.ai_source_type[], array['support_reply_draft','entitled_customer_reply_draft'], null, true, 'Sugestao de resposta e sempre rascunho revisado por humano; nunca envio automatico.'),
  ('suggest_article', 'requires_review', true, array['support_ticket','ticket_timeline','knowledge_article_public','knowledge_article_internal','knowledge_article_restricted']::public.ai_source_type[], array['support_internal_review'], null, true, 'Sugestao de artigo exige fonte citavel e decisao humana.'),
  ('suggest_category', 'requires_review', true, array['support_ticket','ticket_timeline']::public.ai_source_type[], array['support_internal_review'], null, true, 'Classificacao sugerida nao altera categoria/status sem operador.'),
  ('suggest_priority', 'requires_review', true, array['support_ticket','ticket_timeline','customer_account']::public.ai_source_type[], array['support_internal_review'], null, true, 'Prioridade sugerida nao altera prioridade real sem operador.'),
  ('detect_documentation_gap', 'requires_review', true, array['support_ticket','ticket_timeline','knowledge_article_public','knowledge_article_internal','documentation']::public.ai_source_type[], array['editorial_draft','support_internal_review'], null, true, 'Lacuna documental pode virar rascunho humano, nao publicacao.'),
  ('summarize_customer', 'requires_review', true, array['customer_account']::public.ai_source_type[], array['support_internal_review'], null, true, 'Resumo de cliente B2B e interno e precisa preservar redaction.'),
  ('risk_warning', 'requires_review', true, array['support_ticket','ticket_timeline','customer_account','engineering_work_item','internal_action','audit_summary']::public.ai_source_type[], array['support_internal_review','admin_internal_review'], null, true, 'Aviso de risco e sinal assistivo, nao decisao operacional automatica.'),
  ('draft_internal_note', 'requires_review', true, array['support_ticket','ticket_timeline']::public.ai_source_type[], array['support_internal_note_draft'], null, true, 'Nota interna pode ser rascunhada para humano, sem escrita automatica no ticket.'),
  ('draft_article', 'requires_review', true, array['knowledge_article_public','knowledge_article_internal','documentation']::public.ai_source_type[], array['editorial_draft'], null, true, 'Rascunho editorial exige revisao humana e fluxo de Knowledge governado.'),
  ('auto_send', 'denied', true, '{}'::public.ai_source_type[], '{}'::text[], 'IA nao envia mensagem ao cliente automaticamente.', true, 'Envio automatico ao cliente e proibido.'),
  ('auto_publish', 'denied', true, '{}'::public.ai_source_type[], '{}'::text[], 'IA nao publica artigo automaticamente.', true, 'Publicacao automatica e proibida.'),
  ('auto_close_ticket', 'denied', true, '{}'::public.ai_source_type[], '{}'::text[], 'IA nao fecha ticket automaticamente.', true, 'Fechamento automatico e proibido.'),
  ('auto_change_status', 'denied', true, '{}'::public.ai_source_type[], '{}'::text[], 'IA nao altera status automaticamente.', true, 'Mudanca automatica de status e proibida.'),
  ('auto_create_provider_delivery', 'denied', true, '{}'::public.ai_source_type[], '{}'::text[], 'IA nao cria delivery externo ou provider.', true, 'Delivery externo automatico e proibido.'),
  ('auto_expose_internal', 'denied', true, '{}'::public.ai_source_type[], '{}'::text[], 'IA nao expoe conteudo interno ao cliente.', true, 'Exposicao automatica de interno e proibida.'),
  ('auto_modify_entitlement', 'denied', true, '{}'::public.ai_source_type[], '{}'::text[], 'IA nao altera entitlement.', true, 'Entitlement e permissao nao sao modificados por IA.'),
  ('auto_modify_rls', 'denied', true, '{}'::public.ai_source_type[], '{}'::text[], 'IA nao altera RLS ou permissao.', true, 'RLS e permissoes nao sao modificadas por IA.'),
  ('auto_create_internal_action', 'denied', true, '{}'::public.ai_source_type[], '{}'::text[], 'IA nao cria acionamento interno automaticamente.', true, 'Criacao automatica de internal action e proibida.'),
  ('auto_create_engineering_work_item', 'denied', true, '{}'::public.ai_source_type[], '{}'::text[], 'IA nao cria work item tecnico automaticamente.', true, 'Criacao automatica de engenharia e proibida.'),
  ('read_storage_path', 'denied', true, '{}'::public.ai_source_type[], '{}'::text[], 'IA nao acessa storage path bruto.', true, 'Storage path bruto e proibido como fonte de IA.'),
  ('read_secret', 'denied', true, '{}'::public.ai_source_type[], '{}'::text[], 'IA nao le informacao sigilosa operacional.', true, 'Informacao sigilosa operacional e proibida como fonte de IA.')
on conflict (action_key) do update
set
  decision = excluded.decision,
  requires_human_review = excluded.requires_human_review,
  allowed_source_types = excluded.allowed_source_types,
  allowed_destinations = excluded.allowed_destinations,
  forbidden_reason = excluded.forbidden_reason,
  audit_required = excluded.audit_required,
  policy_summary = excluded.policy_summary;

create or replace function app_private.ai_context_access_decision(
  p_source_type public.ai_source_type,
  p_tenant_id uuid default null,
  p_source_id uuid default null,
  p_intended_use public.ai_intended_use default null,
  p_destination text default 'internal_review'
)
returns table (
  allowed boolean,
  decision public.ai_policy_decision,
  requires_human_review boolean,
  reason text,
  policy_key text
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_policy public.ai_context_source_policies%rowtype;
  v_tenant_id uuid := p_tenant_id;
  v_source_visibility public.knowledge_visibility;
  v_source_status public.knowledge_article_status;
  v_source_area text;
begin
  perform app_private.require_active_actor();

  select *
  into v_policy
  from public.ai_context_source_policies
  where source_type = p_source_type;

  if v_policy.policy_key is null then
    return query select false, 'denied'::public.ai_policy_decision, true, 'Fonte sem policy AI-native cadastrada.'::text, null::text;
    return;
  end if;

  if v_policy.source_status = 'forbidden'::public.ai_source_status then
    return query select false, 'denied'::public.ai_policy_decision, true, 'Fonte proibida para IA.'::text, v_policy.policy_key;
    return;
  end if;

  if v_policy.source_status = 'future'::public.ai_source_status then
    return query select false, 'future'::public.ai_policy_decision, true, 'Fonte preparada para futuro; IA real nao esta ativa.'::text, v_policy.policy_key;
    return;
  end if;

  if p_intended_use is not null and not p_intended_use = any(v_policy.allowed_uses) then
    return query select false, 'denied'::public.ai_policy_decision, true, 'Uso pretendido nao permitido para esta fonte.'::text, v_policy.policy_key;
    return;
  end if;

  if p_destination = any(v_policy.forbidden_destinations)
     or (
       p_destination in ('customer_facing', 'customer_auto_send')
       and p_source_type in (
         'customer_account'::public.ai_source_type,
         'knowledge_article_internal'::public.ai_source_type,
         'engineering_work_item'::public.ai_source_type,
         'internal_action'::public.ai_source_type,
         'audit_summary'::public.ai_source_type
       )
     ) then
    return query select false, 'denied'::public.ai_policy_decision, true, 'Destino bloqueado para preservar boundary customer-facing.'::text, v_policy.policy_key;
    return;
  end if;

  if v_policy.requires_tenant and v_tenant_id is null and p_source_id is null then
    return query select false, 'denied'::public.ai_policy_decision, true, 'tenant_id ou source_id explicito e obrigatorio.'::text, v_policy.policy_key;
    return;
  end if;

  if p_source_type = any(array[
    'support_ticket',
    'ticket_timeline',
    'customer_portal_ticket'
  ]::public.ai_source_type[]) and p_source_id is not null then
    select tenant_id
    into v_tenant_id
    from public.tickets
    where id = p_source_id;
  elsif p_source_type = 'engineering_work_item'::public.ai_source_type and p_source_id is not null then
    select tenant_id
    into v_tenant_id
    from public.engineering_work_items
    where id = p_source_id;
  elsif p_source_type = 'internal_action'::public.ai_source_type and p_source_id is not null then
    select tenant_id, target_area
    into v_tenant_id, v_source_area
    from public.internal_actions
    where id = p_source_id;
  elsif p_source_type = any(array[
    'knowledge_article_public',
    'knowledge_article_internal',
    'knowledge_article_restricted'
  ]::public.ai_source_type[]) and p_source_id is not null then
    select tenant_id, visibility, status
    into v_tenant_id, v_source_visibility, v_source_status
    from public.knowledge_articles
    where id = p_source_id;
  end if;

  if v_policy.requires_tenant and v_tenant_id is null then
    return query select false, 'denied'::public.ai_policy_decision, true, 'Fonte nao encontrada ou sem tenant autorizado.'::text, v_policy.policy_key;
    return;
  end if;

  if p_source_type = 'knowledge_article_public'::public.ai_source_type
     and p_source_id is not null
     and (v_source_visibility <> 'public'::public.knowledge_visibility or v_source_status <> 'published'::public.knowledge_article_status) then
    return query select false, 'denied'::public.ai_policy_decision, true, 'Knowledge publica exige artigo published/public.'::text, v_policy.policy_key;
    return;
  end if;

  if p_source_type = 'knowledge_article_internal'::public.ai_source_type
     and p_source_id is not null
     and v_source_visibility <> 'internal'::public.knowledge_visibility then
    return query select false, 'denied'::public.ai_policy_decision, true, 'Fonte nao corresponde a Knowledge interna.'::text, v_policy.policy_key;
    return;
  end if;

  if p_source_type = 'knowledge_article_restricted'::public.ai_source_type
     and p_source_id is not null
     and v_source_visibility <> 'restricted'::public.knowledge_visibility then
    return query select false, 'denied'::public.ai_policy_decision, true, 'Fonte nao corresponde a Knowledge restrita.'::text, v_policy.policy_key;
    return;
  end if;

  if app_private.has_global_role('platform_admin'::public.platform_role) then
    return query select true, 'requires_review'::public.ai_policy_decision, true, 'Acesso autorizado para governanca administrativa; revisao humana obrigatoria.'::text, v_policy.policy_key;
    return;
  end if;

  if p_source_type in (
    'support_ticket'::public.ai_source_type,
    'ticket_timeline'::public.ai_source_type,
    'customer_account'::public.ai_source_type,
    'knowledge_article_internal'::public.ai_source_type,
    'knowledge_article_restricted'::public.ai_source_type
  ) and v_tenant_id is not null and app_private.can_access_support_workspace(v_tenant_id) then
    return query select true, 'requires_review'::public.ai_policy_decision, true, 'Acesso de suporte autorizado; revisao humana obrigatoria.'::text, v_policy.policy_key;
    return;
  end if;

  if p_source_type = 'knowledge_article_public'::public.ai_source_type
     and app_private.has_any_global_role(array[
       'support_manager'::public.platform_role,
       'support_agent'::public.platform_role,
       'engineering_manager'::public.platform_role,
       'engineering_member'::public.platform_role
     ]) then
    return query select true, 'requires_review'::public.ai_policy_decision, true, 'Knowledge publica autorizada como fonte citavel; revisao humana obrigatoria.'::text, v_policy.policy_key;
    return;
  end if;

  if p_source_type = 'engineering_work_item'::public.ai_source_type
     and v_tenant_id is not null
     and app_private.can_access_engineering_workspace(v_tenant_id) then
    return query select true, 'requires_review'::public.ai_policy_decision, true, 'Acesso de engenharia autorizado; revisao humana obrigatoria.'::text, v_policy.policy_key;
    return;
  end if;

  if p_source_type = 'internal_action'::public.ai_source_type
     and v_tenant_id is not null
     and (
       app_private.can_access_support_workspace(v_tenant_id)
       or (v_source_area is not null and app_private.can_access_internal_action_area(v_tenant_id, v_source_area))
     ) then
    return query select true, 'requires_review'::public.ai_policy_decision, true, 'Acesso ao acionamento interno autorizado; revisao humana obrigatoria.'::text, v_policy.policy_key;
    return;
  end if;

  return query select false, 'denied'::public.ai_policy_decision, true, 'Usuario sem permissao para fonte AI-native solicitada.'::text, v_policy.policy_key;
end;
$$;

create or replace view public.vw_ai_context_source_policies
with (security_barrier = true)
as
select
  p.policy_key,
  p.source_type,
  p.source_status,
  p.visibility,
  p.allowed_uses,
  p.requires_tenant,
  p.requires_entitlement,
  p.requires_citation,
  p.requires_redaction,
  p.allowed_destinations,
  p.forbidden_destinations,
  p.policy_summary,
  p.updated_at
from public.ai_context_source_policies as p
where app_private.has_global_role('platform_admin'::public.platform_role)
   or (
     app_private.has_any_global_role(array[
       'support_manager'::public.platform_role,
       'support_agent'::public.platform_role
     ])
     and p.visibility in ('support_only'::public.ai_source_visibility, 'public'::public.ai_source_visibility, 'customer_facing'::public.ai_source_visibility)
   )
   or (
     app_private.has_any_global_role(array[
       'engineering_manager'::public.platform_role,
       'engineering_member'::public.platform_role
     ])
     and p.visibility in ('engineering_only'::public.ai_source_visibility, 'public'::public.ai_source_visibility)
   );

create or replace view public.vw_ai_action_policies
with (security_barrier = true)
as
select
  p.action_key,
  p.decision,
  p.requires_human_review,
  p.allowed_source_types,
  p.allowed_destinations,
  p.forbidden_reason,
  p.audit_required,
  p.policy_summary,
  p.updated_at
from public.ai_action_policies as p
where app_private.has_global_role('platform_admin'::public.platform_role)
   or app_private.has_any_global_role(array[
     'support_manager'::public.platform_role,
     'support_agent'::public.platform_role,
     'engineering_manager'::public.platform_role,
     'engineering_member'::public.platform_role
   ]);

create or replace view public.vw_ai_operational_context_readiness
with (security_barrier = true)
as
select
  'ai_native_operational_readiness'::text as readiness_key,
  'prepared_not_active'::text as readiness_status,
  'IA operacional: preparada, nao ativa.'::text as readiness_label,
  count(*) filter (where source_status = 'allowed'::public.ai_source_status) as allowed_source_count,
  count(*) filter (where source_status = 'restricted'::public.ai_source_status) as restricted_source_count,
  count(*) filter (where source_status = 'future'::public.ai_source_status) as future_source_count,
  count(*) filter (where requires_citation) as citation_required_count,
  count(*) filter (where requires_redaction) as redaction_required_count,
  true as human_review_required,
  true as audit_required,
  false as llm_provider_configured,
  false as embeddings_enabled,
  false as auto_send_enabled,
  false as auto_publish_enabled
from public.ai_context_source_policies
where app_private.has_global_role('platform_admin'::public.platform_role);

create or replace view public.vw_ai_support_ticket_context_readiness
with (security_barrier = true)
as
select
  t.id as ticket_id,
  t.tenant_id,
  t.status as ticket_status,
  'support_ticket'::public.ai_source_type as source_type,
  d.allowed,
  d.decision,
  d.requires_human_review,
  d.reason,
  d.policy_key,
  false as can_auto_send,
  false as can_auto_change_status
from public.tickets as t
cross join lateral app_private.ai_context_access_decision(
  'support_ticket'::public.ai_source_type,
  t.tenant_id,
  t.id,
  'summarize'::public.ai_intended_use,
  'support_internal_review'
) as d
where app_private.can_access_support_workspace(t.tenant_id);

create or replace view public.vw_ai_customer_account_context_readiness
with (security_barrier = true)
as
select
  t.id as tenant_id,
  t.slug as tenant_slug,
  t.display_name as tenant_display_name,
  'customer_account'::public.ai_source_type as source_type,
  d.allowed,
  d.decision,
  d.requires_human_review,
  d.reason,
  d.policy_key,
  false as customer_visible,
  false as can_auto_expose_internal
from public.tenants as t
cross join lateral app_private.ai_context_access_decision(
  'customer_account'::public.ai_source_type,
  t.id,
  null,
  'summarize'::public.ai_intended_use,
  'support_internal_review'
) as d
where app_private.can_access_support_workspace(t.id);

create or replace view public.vw_ai_knowledge_context_readiness
with (security_barrier = true)
as
select
  ka.id as article_id,
  ka.tenant_id,
  ka.title,
  ka.visibility,
  ka.status,
  case
    when ka.visibility = 'public'::public.knowledge_visibility then 'knowledge_article_public'::public.ai_source_type
    when ka.visibility = 'internal'::public.knowledge_visibility then 'knowledge_article_internal'::public.ai_source_type
    else 'knowledge_article_restricted'::public.ai_source_type
  end as source_type,
  p.source_status,
  p.requires_entitlement,
  p.requires_citation,
  p.requires_redaction,
  (ka.visibility = 'public'::public.knowledge_visibility and ka.status = 'published'::public.knowledge_article_status) as public_citable_now,
  false as can_auto_publish
from public.knowledge_articles as ka
join public.ai_context_source_policies as p
  on p.source_type = case
    when ka.visibility = 'public'::public.knowledge_visibility then 'knowledge_article_public'::public.ai_source_type
    when ka.visibility = 'internal'::public.knowledge_visibility then 'knowledge_article_internal'::public.ai_source_type
    else 'knowledge_article_restricted'::public.ai_source_type
  end
where app_private.has_global_role('platform_admin'::public.platform_role)
   or app_private.has_any_global_role(array[
     'support_manager'::public.platform_role,
     'support_agent'::public.platform_role
   ]);

create or replace view public.vw_ai_usage_audit_events
with (security_barrier = true)
as
select
  e.id,
  e.tenant_id,
  t.slug as tenant_slug,
  t.display_name as tenant_display_name,
  e.actor_user_id,
  actor.full_name as actor_full_name,
  actor.email::text as actor_email,
  e.source_type,
  e.intended_use,
  e.policy_key,
  e.source_ids,
  e.output_type,
  e.allowed_destination,
  e.requires_human_review,
  e.review_decision,
  e.reviewed_by_user_id,
  reviewer.full_name as reviewed_by_full_name,
  reviewer.email::text as reviewed_by_email,
  e.reviewed_at,
  e.review_note,
  e.metadata,
  e.created_at,
  e.updated_at,
  false as provider_configured,
  false as prompt_stored,
  false as output_stored
from public.ai_usage_audit_events as e
left join public.tenants as t
  on t.id = e.tenant_id
left join public.profiles as actor
  on actor.id = e.actor_user_id
left join public.profiles as reviewer
  on reviewer.id = e.reviewed_by_user_id
where app_private.has_global_role('platform_admin'::public.platform_role)
   or (
     e.tenant_id is not null
     and (
       app_private.can_access_support_workspace(e.tenant_id)
       or app_private.can_access_engineering_workspace(e.tenant_id)
     )
   );

create or replace function public.rpc_ai_validate_context_access(
  p_source_type public.ai_source_type,
  p_tenant_id uuid default null,
  p_source_id uuid default null,
  p_intended_use public.ai_intended_use default null,
  p_destination text default 'internal_review'
)
returns table (
  allowed boolean,
  decision public.ai_policy_decision,
  requires_human_review boolean,
  reason text,
  policy_key text
)
language sql
volatile
security definer
set search_path = ''
as $$
  select *
  from app_private.ai_context_access_decision(
    p_source_type,
    p_tenant_id,
    p_source_id,
    p_intended_use,
    p_destination
  );
$$;

create or replace function public.rpc_ai_log_usage_event(
  p_tenant_id uuid,
  p_source_type public.ai_source_type,
  p_intended_use public.ai_intended_use,
  p_source_ids jsonb default '[]'::jsonb,
  p_output_type text default 'readiness_event',
  p_allowed_destination text default 'internal_review',
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_validation record;
  v_event_id uuid;
begin
  v_actor_user_id := app_private.require_active_actor();

  if p_tenant_id is null then
    raise exception 'tenant_id is required for AI usage audit';
  end if;

  if jsonb_typeof(coalesce(p_source_ids, '[]'::jsonb)) <> 'array' then
    raise exception 'source_ids must be a json array';
  end if;

  if jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'metadata must be a json object';
  end if;

  if app_private.contains_secret_like_text(array[
    coalesce(p_output_type, ''),
    coalesce(p_allowed_destination, ''),
    coalesce(p_metadata::text, '')
  ]) then
    raise exception 'AI usage audit cannot store secrets or credentials';
  end if;

  select *
  into v_validation
  from app_private.ai_context_access_decision(
    p_source_type,
    p_tenant_id,
    null,
    p_intended_use,
    p_allowed_destination
  );

  if coalesce(v_validation.allowed, false) is false then
    raise exception 'AI context access denied: %', coalesce(v_validation.reason, 'policy denied');
  end if;

  insert into public.ai_usage_audit_events (
    tenant_id,
    actor_user_id,
    source_type,
    intended_use,
    policy_key,
    source_ids,
    output_type,
    allowed_destination,
    requires_human_review,
    metadata
  )
  values (
    p_tenant_id,
    v_actor_user_id,
    p_source_type,
    p_intended_use,
    v_validation.policy_key,
    coalesce(p_source_ids, '[]'::jsonb),
    p_output_type,
    p_allowed_destination,
    true,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

create or replace function public.rpc_ai_register_human_review_decision(
  p_usage_event_id uuid,
  p_review_decision public.ai_review_decision,
  p_review_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid;
  v_event public.ai_usage_audit_events%rowtype;
begin
  v_actor_user_id := app_private.require_active_actor();

  if p_review_decision = 'pending'::public.ai_review_decision then
    raise exception 'human review decision must be approved, rejected or discarded';
  end if;

  if app_private.contains_secret_like_text(array[coalesce(p_review_note, '')]) then
    raise exception 'AI human review note cannot store secrets or credentials';
  end if;

  select *
  into v_event
  from public.ai_usage_audit_events
  where id = p_usage_event_id;

  if v_event.id is null then
    raise exception 'AI usage event not found';
  end if;

  if not (
    app_private.has_global_role('platform_admin'::public.platform_role)
    or (
      v_event.tenant_id is not null
      and (
        app_private.can_access_support_workspace(v_event.tenant_id)
        or app_private.can_access_engineering_workspace(v_event.tenant_id)
      )
    )
  ) then
    raise exception 'AI usage event review not allowed for actor';
  end if;

  update public.ai_usage_audit_events
  set
    review_decision = p_review_decision,
    reviewed_by_user_id = v_actor_user_id,
    reviewed_at = timezone('utc', now()),
    review_note = nullif(btrim(p_review_note), '')
  where id = p_usage_event_id;

  return p_usage_event_id;
end;
$$;

revoke all on function app_private.ai_context_access_decision(public.ai_source_type, uuid, uuid, public.ai_intended_use, text) from public, anon, authenticated, service_role;
grant execute on function app_private.ai_context_access_decision(public.ai_source_type, uuid, uuid, public.ai_intended_use, text) to service_role;

revoke all on function public.rpc_ai_validate_context_access(public.ai_source_type, uuid, uuid, public.ai_intended_use, text) from public, anon, authenticated, service_role;
revoke all on function public.rpc_ai_log_usage_event(uuid, public.ai_source_type, public.ai_intended_use, jsonb, text, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.rpc_ai_register_human_review_decision(uuid, public.ai_review_decision, text) from public, anon, authenticated, service_role;
grant execute on function public.rpc_ai_validate_context_access(public.ai_source_type, uuid, uuid, public.ai_intended_use, text) to authenticated, service_role;
grant execute on function public.rpc_ai_log_usage_event(uuid, public.ai_source_type, public.ai_intended_use, jsonb, text, text, jsonb) to authenticated, service_role;
grant execute on function public.rpc_ai_register_human_review_decision(uuid, public.ai_review_decision, text) to authenticated, service_role;

revoke all on public.vw_ai_context_source_policies from public, anon, authenticated, service_role;
revoke all on public.vw_ai_action_policies from public, anon, authenticated, service_role;
revoke all on public.vw_ai_operational_context_readiness from public, anon, authenticated, service_role;
revoke all on public.vw_ai_support_ticket_context_readiness from public, anon, authenticated, service_role;
revoke all on public.vw_ai_customer_account_context_readiness from public, anon, authenticated, service_role;
revoke all on public.vw_ai_knowledge_context_readiness from public, anon, authenticated, service_role;
revoke all on public.vw_ai_usage_audit_events from public, anon, authenticated, service_role;
grant select on public.vw_ai_context_source_policies to authenticated, service_role;
grant select on public.vw_ai_action_policies to authenticated, service_role;
grant select on public.vw_ai_operational_context_readiness to authenticated, service_role;
grant select on public.vw_ai_support_ticket_context_readiness to authenticated, service_role;
grant select on public.vw_ai_customer_account_context_readiness to authenticated, service_role;
grant select on public.vw_ai_knowledge_context_readiness to authenticated, service_role;
grant select on public.vw_ai_usage_audit_events to authenticated, service_role;
