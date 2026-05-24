import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const SUPPORT_FIXTURE_SCRIPT = 'supabase/qa/create-local-support-fixture.mjs';
const TENANT_SLUG = 'support-qa-a';
const POPULATED_TICKET_TITLE =
  'QA Support | Operação crítica com histórico extenso, anexos e retorno operacional';
const P2_COMMUNICATION_TICKETS = {
  supportManual: {
    id: '8e5ee201-7e27-45ef-9e61-f3209f6ad201',
    title: 'QA P2 | Ticket criado pelo suporte manual',
    source: 'internal',
  },
  portalOrigin: {
    id: '8e5ee201-7e27-45ef-9e61-f3209f6ad202',
    title: 'QA P2 | Ticket criado pelo portal cliente',
    source: 'portal',
  },
  futureEmail: {
    id: '8e5ee201-7e27-45ef-9e61-f3209f6ad203',
    title: 'QA P2 | Canal email futuro indisponivel',
    source: 'email',
  },
  futureApi: {
    id: '8e5ee201-7e27-45ef-9e61-f3209f6ad204',
    title: 'QA P2 | Canal API futuro indisponivel',
    source: 'api',
  },
};

const USERS = {
  platformAdmin: {
    key: 'platform_admin',
    email: 'qa.local.platform-admin@genius.local',
    password: 'Local-QA-Admin-2026!',
  },
  supportManager: {
    key: 'support_manager',
    email: 'qa.local.support-manager-a@genius.local',
    password: 'Local-QA-Manager-A-2026!',
  },
  supportAgent: {
    key: 'support_agent',
    email: 'qa.local.support-agent-a@genius.local',
    password: 'Local-QA-Agent-A-2026!',
  },
  internalAreaMember: {
    key: 'internal_area_member',
    email: 'qa.local.internal-area-member@genius.local',
    password: 'Local-QA-Internal-Area-2026!',
    fullName: 'QA Local Internal Area Member',
  },
  internalAreaEmpty: {
    key: 'internal_area_empty',
    email: 'qa.local.internal-area-empty@genius.local',
    password: 'Local-QA-Internal-Empty-2026!',
    fullName: 'QA Local Internal Area Empty',
  },
  internalAreaNonMember: {
    key: 'internal_area_non_member',
    email: 'qa.local.internal-area-non-member@genius.local',
    password: 'Local-QA-Internal-NoArea-2026!',
    fullName: 'QA Local Internal Area Non Member',
  },
  engineeringMember: {
    key: 'engineering_member',
    email: 'qa.local.engineering-member-a@genius.local',
    password: 'Local-QA-Engineering-A-2026!',
  },
  customerUser: {
    key: 'customer_user',
    email: 'marina.ops@support-qa-a.local',
    password: 'Local-QA-Customer-A-2026!',
  },
  customerManager: {
    key: 'customer_manager',
    email: 'gestao.portal@support-qa-a.local',
    password: 'Local-QA-Customer-Manager-A-2026!',
  },
};

const INTERNAL_ACTIONS = {
  open: {
    summary: 'QA Functional | Validar cobranca operacional',
    context:
      'Acionamento persistido para QA autenticado da fila da area interna. Validar dados financeiros antes do proximo contato do suporte.',
    supportType: 'analysis',
    priority: 'high',
  },
  returned: {
    summary: 'QA Functional | Retorno financeiro ao suporte',
    context:
      'Acionamento persistido para QA autenticado da devolucao estruturada ao suporte.',
    supportType: 'information_request',
    priority: 'normal',
    comment:
      'Area interna validou o contexto e registrou retorno operacional para o suporte.',
    returnBody:
      'Validacao concluida. Suporte pode responder o cliente sem alterar o status do ticket automaticamente.',
  },
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

function localSupabaseCommandArgs(args) {
  const localSupabaseBinary = join(
    process.cwd(),
    'node_modules',
    'supabase',
    'bin',
    process.platform === 'win32' ? 'supabase.exe' : 'supabase',
  );

  if (existsSync(localSupabaseBinary)) {
    return {
      command: localSupabaseBinary,
      args,
    };
  }

  return {
    command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
    args: ['supabase', ...args],
  };
}

function runProcess(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    ...options,
  });

  if (result.error) {
    fail(result.error.message);
  }

  if (result.status !== 0) {
    const detail = [result.stderr?.trim(), result.stdout?.trim()]
      .filter(Boolean)
      .join('\n');
    fail(detail || `Falha ao executar ${command}.`);
  }

  return result.stdout?.trim() ?? '';
}

function runSupportFixture() {
  const result = spawnSync(process.execPath, [SUPPORT_FIXTURE_SCRIPT], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (result.error) {
    fail(result.error.message);
  }

  if (result.status !== 0) {
    fail('Fixture funcional abortada: fixture de suporte nao concluiu com sucesso.');
  }
}

function runSupabaseStatusEnv() {
  const { command, args } = localSupabaseCommandArgs(['status', '-o', 'env']);
  const stdout = runProcess(command, args);
  const envMap = new Map();

  for (const line of stdout.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
    if (!match) {
      continue;
    }

    envMap.set(match[1], match[2]);
  }

  return envMap;
}

function assertLocalOnly(envMap) {
  const apiUrl = envMap.get('API_URL') ?? '';
  const dbUrl = envMap.get('DB_URL') ?? '';
  const serviceRoleKey = envMap.get('SERVICE_ROLE_KEY') ?? '';
  const anonKey = envMap.get('ANON_KEY') ?? '';

  const isLocalApi =
    apiUrl.startsWith('http://127.0.0.1:') || apiUrl.startsWith('http://localhost:');
  const isLocalDb = dbUrl.includes('@127.0.0.1:') || dbUrl.includes('@localhost:');

  if (!isLocalApi || !isLocalDb || !serviceRoleKey || !anonKey) {
    fail(
      'Fixture funcional bloqueada: este script so pode rodar contra Supabase local com API_URL/DB_URL locais e chaves locais validas.',
    );
  }

  return {
    apiUrl,
    serviceRoleKey,
    anonKey,
  };
}

function sqlEscape(value) {
  return String(value).replace(/'/g, "''");
}

function runSupabaseDbQuery(sql) {
  const tempDir = mkdtempSync(join(tmpdir(), 'genius-support-os-functional-fixture-'));
  const tempFile = join(tempDir, 'query.sql');
  writeFileSync(tempFile, `${sql.trim()}\n`, 'utf8');

  const { command, args } = localSupabaseCommandArgs([
    'db',
    'query',
    '--local',
    '--file',
    tempFile,
    '--output',
    'json',
  ]);

  try {
    const stdout = runProcess(command, args);
    let parsed;

    try {
      parsed = JSON.parse(stdout);
    } catch {
      if (/^(INSERT|UPDATE|DELETE|BEGIN|COMMIT|SET|RESET)\b/i.test(stdout.trim())) {
        return { rows: [] };
      }

      throw new Error(stdout);
    }

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.rows)) {
      return parsed;
    }

    if (Array.isArray(parsed)) {
      const rowsEntry = [...parsed].reverse().find((entry) => Array.isArray(entry?.rows));
      return rowsEntry ?? { rows: [] };
    }

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.results)) {
      const rowsEntry = [...parsed.results]
        .reverse()
        .find((entry) => Array.isArray(entry?.rows));
      return rowsEntry ?? { rows: [] };
    }

    return { rows: [] };
  } catch (error) {
    fail(
      error instanceof Error
        ? error.message
        : 'Nao foi possivel interpretar a resposta JSON do Supabase CLI.',
    );
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

async function createOrUpdateAuthUser({
  apiUrl,
  serviceRoleKey,
  email,
  password,
  fullName,
}) {
  const existingUser = queryAuthUserByEmail(email);
  const payload = {
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      name: fullName,
      locale: 'pt-BR',
      timezone: 'America/Sao_Paulo',
    },
  };

  if (existingUser?.id) {
    const updateResponse = await fetch(`${apiUrl}/auth/v1/admin/users/${existingUser.id}`, {
      method: 'PUT',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!updateResponse.ok) {
      const detail = await updateResponse.text();
      fail(`Falha ao atualizar usuario Auth local ${email}: ${updateResponse.status} ${detail}`);
    }

    return updateResponse.json();
  }

  const createResponse = await fetch(`${apiUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!createResponse.ok) {
    const detail = await createResponse.text();
    fail(`Falha ao criar usuario Auth local ${email}: ${createResponse.status} ${detail}`);
  }

  return createResponse.json();
}

function queryAuthUserByEmail(email) {
  const result = runSupabaseDbQuery(`
    select id::text as id
    from auth.users
    where email = '${sqlEscape(email)}'
    limit 1;
  `);

  return result.rows?.[0] ?? null;
}

function queryProfileByEmail(email) {
  const result = runSupabaseDbQuery(`
    select
      id::text as id,
      email::text as email,
      full_name,
      is_active
    from public.profiles
    where email = '${sqlEscape(email)}'
    limit 1;
  `);

  return result.rows?.[0] ?? null;
}

function queryTenantBySlug(slug) {
  const result = runSupabaseDbQuery(`
    select id::text as id, slug, display_name
    from public.tenants
    where slug = '${sqlEscape(slug)}'
    limit 1;
  `);

  return result.rows?.[0] ?? null;
}

function queryTicketByTitle(tenantId, title) {
  const result = runSupabaseDbQuery(`
    select id::text as id, title, status::text as status
    from public.tickets
    where tenant_id = '${sqlEscape(tenantId)}'::uuid
      and title = '${sqlEscape(title)}'
    limit 1;
  `);

  return result.rows?.[0] ?? null;
}

function ensureTenantMembership({ actorUserId, tenantId, userId, role = 'tenant_viewer' }) {
  runSupabaseDbQuery(`
    insert into public.tenant_memberships (
      tenant_id,
      user_id,
      role,
      status,
      invited_by_user_id,
      created_by_user_id,
      updated_by_user_id
    )
    values (
      '${sqlEscape(tenantId)}'::uuid,
      '${sqlEscape(userId)}'::uuid,
      '${role}'::public.tenant_role,
      'active'::public.membership_status,
      '${sqlEscape(actorUserId)}'::uuid,
      '${sqlEscape(actorUserId)}'::uuid,
      '${sqlEscape(actorUserId)}'::uuid
    )
    on conflict (tenant_id, user_id)
    do update
    set
      role = excluded.role,
      status = 'active'::public.membership_status,
      updated_by_user_id = excluded.updated_by_user_id;
  `);
}

function ensureP2CommunicationFixture({ tenantId, supportUserId, customerUserId }) {
  const requester = runSupabaseDbQuery(`
    select id::text as id
    from public.tenant_contacts
    where tenant_id = '${sqlEscape(tenantId)}'::uuid
      and linked_user_id = '${sqlEscape(customerUserId)}'::uuid
      and is_active
    order by is_primary desc, created_at asc
    limit 1;
  `).rows?.[0];

  if (!requester?.id) {
    fail('Fixture P2 abortada: contato customer-facing principal ausente.');
  }

  for (const ticket of Object.values(P2_COMMUNICATION_TICKETS)) {
    const createdBy = ticket.source === 'portal' ? customerUserId : supportUserId;
    runSupabaseDbQuery(`
      insert into public.tickets (
        id,
        tenant_id,
        requester_contact_id,
        title,
        description,
        source,
        priority,
        severity,
        created_by_user_id,
        updated_by_user_id
      )
      values (
        '${sqlEscape(ticket.id)}'::uuid,
        '${sqlEscape(tenantId)}'::uuid,
        '${sqlEscape(requester.id)}'::uuid,
        '${sqlEscape(ticket.title)}',
        'Fixture local sanitizada para validar origem, canal e comunicação de tickets.',
        '${sqlEscape(ticket.source)}'::public.ticket_source,
        'normal'::public.ticket_priority,
        'medium'::public.ticket_severity,
        '${sqlEscape(createdBy)}'::uuid,
        '${sqlEscape(createdBy)}'::uuid
      )
      on conflict (id)
      do update
      set
        title = excluded.title,
        description = excluded.description,
        source = excluded.source,
        requester_contact_id = excluded.requester_contact_id,
        updated_by_user_id = excluded.updated_by_user_id;
    `);
  }

  runSupabaseDbQuery(`
    insert into public.ticket_messages (
      id,
      tenant_id,
      ticket_id,
      visibility,
      body,
      created_by_user_id,
      metadata
    )
    values
      (
        '8e5ee201-7e27-45ef-9e61-f3209f6ad211'::uuid,
        '${sqlEscape(tenantId)}'::uuid,
        '${P2_COMMUNICATION_TICKETS.portalOrigin.id}'::uuid,
        'customer'::public.message_visibility,
        'Mensagem customer-facing enviada pelo portal na fixture P2.',
        '${sqlEscape(customerUserId)}'::uuid,
        jsonb_build_object(
          'visibility', 'customer',
          'communication_direction', 'inbound',
          'communication_channel', 'customer_portal',
          'communication_channel_label', 'Portal Cliente'
        )
      ),
      (
        '8e5ee201-7e27-45ef-9e61-f3209f6ad212'::uuid,
        '${sqlEscape(tenantId)}'::uuid,
        '${P2_COMMUNICATION_TICKETS.portalOrigin.id}'::uuid,
        'customer'::public.message_visibility,
        'Resposta publica do suporte registrada na fixture P2.',
        '${sqlEscape(supportUserId)}'::uuid,
        jsonb_build_object(
          'visibility', 'customer',
          'communication_direction', 'outbound',
          'communication_channel', 'customer_portal',
          'communication_channel_label', 'Portal Cliente'
        )
      ),
      (
        '8e5ee201-7e27-45ef-9e61-f3209f6ad213'::uuid,
        '${sqlEscape(tenantId)}'::uuid,
        '${P2_COMMUNICATION_TICKETS.portalOrigin.id}'::uuid,
        'internal'::public.message_visibility,
        'Nota interna P2 que o portal nao pode ver.',
        '${sqlEscape(supportUserId)}'::uuid,
        jsonb_build_object(
          'visibility', 'internal',
          'communication_direction', 'internal',
          'communication_channel', 'internal_support',
          'communication_channel_label', 'Suporte interno'
        )
      )
    on conflict (id)
    do nothing;
  `);

  runSupabaseDbQuery(`
    insert into public.ticket_message_deliveries (
      id,
      tenant_id,
      ticket_id,
      message_id,
      channel,
      direction,
      status,
      provider_state,
      recipient_contact_id,
      recipient_user_id,
      delivered_at,
      created_by_user_id,
      metadata
    )
    values
      (
        '8e5ee201-7e27-45ef-9e61-f3209f6ad221'::uuid,
        '${sqlEscape(tenantId)}'::uuid,
        '${P2_COMMUNICATION_TICKETS.portalOrigin.id}'::uuid,
        '8e5ee201-7e27-45ef-9e61-f3209f6ad211'::uuid,
        'customer_portal'::public.ticket_delivery_channel,
        'inbound'::public.ticket_delivery_direction,
        'delivered'::public.ticket_delivery_status,
        'native'::public.ticket_delivery_provider_state,
        null,
        null,
        timezone('utc', now()),
        '${sqlEscape(customerUserId)}'::uuid,
        jsonb_build_object(
          'delivery_surface', 'customer_portal',
          'provider_state', 'native',
          'fixture', 'p2_delivery_readiness'
        )
      ),
      (
        '8e5ee201-7e27-45ef-9e61-f3209f6ad222'::uuid,
        '${sqlEscape(tenantId)}'::uuid,
        '${P2_COMMUNICATION_TICKETS.portalOrigin.id}'::uuid,
        '8e5ee201-7e27-45ef-9e61-f3209f6ad212'::uuid,
        'customer_portal'::public.ticket_delivery_channel,
        'outbound'::public.ticket_delivery_direction,
        'delivered'::public.ticket_delivery_status,
        'native'::public.ticket_delivery_provider_state,
        '${sqlEscape(requester.id)}'::uuid,
        '${sqlEscape(customerUserId)}'::uuid,
        timezone('utc', now()),
        '${sqlEscape(supportUserId)}'::uuid,
        jsonb_build_object(
          'delivery_surface', 'customer_portal',
          'provider_state', 'native',
          'fixture', 'p2_delivery_readiness'
        )
      )
    on conflict (message_id, channel)
    do nothing;
  `);
}

async function signInLocalUser({ apiUrl, anonKey, email, password }) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const detail = await response.text();
    fail(`Falha ao autenticar fixture local ${email}: ${response.status} ${detail}`);
  }

  return response.json();
}

async function sessionFor({ apiUrl, anonKey, user }) {
  const session = await signInLocalUser({
    apiUrl,
    anonKey,
    email: user.email,
    password: user.password,
  });

  return {
    apiUrl,
    anonKey,
    accessToken: session.access_token,
  };
}

async function callRpcAsUser({ apiUrl, anonKey, accessToken, rpcName, body }) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/${rpcName}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    fail(`Falha ao executar RPC ${rpcName}: ${response.status} ${detail}`);
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function queryInternalActionBySummary(tenantId, ticketId, summary) {
  const result = runSupabaseDbQuery(`
    select
      id::text as id,
      status::text as status,
      assigned_area_user_id::text as assigned_area_user_id
    from public.internal_actions
    where tenant_id = '${sqlEscape(tenantId)}'::uuid
      and ticket_id = '${sqlEscape(ticketId)}'::uuid
      and summary = '${sqlEscape(summary)}'
    order by created_at desc
    limit 1;
  `);

  return result.rows?.[0] ?? null;
}

async function ensureAreaMembership({ adminSession, tenantId, userId, areaKey = 'finance' }) {
  const membership = await callRpcAsUser({
    apiUrl: adminSession.apiUrl,
    anonKey: adminSession.anonKey,
    accessToken: adminSession.accessToken,
    rpcName: 'rpc_admin_add_internal_area_membership',
    body: {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_area_key: areaKey,
      p_role: 'member',
      p_status: 'active',
    },
  });

  return membership?.id ?? null;
}

async function ensureInternalAction({ supportSession, tenantId, ticketId, action }) {
  const existing = queryInternalActionBySummary(tenantId, ticketId, action.summary);
  if (existing?.id) {
    return existing;
  }

  const created = await callRpcAsUser({
    apiUrl: supportSession.apiUrl,
    anonKey: supportSession.anonKey,
    accessToken: supportSession.accessToken,
    rpcName: 'rpc_support_create_internal_action',
    body: {
      p_ticket_id: ticketId,
      p_target_area: 'finance',
      p_support_type: action.supportType,
      p_priority: action.priority,
      p_summary: action.summary,
      p_context: action.context,
      p_evidence_attachment_ids: null,
      p_assigned_area_user_id: null,
    },
  });

  return {
    id: created?.id ?? queryInternalActionBySummary(tenantId, ticketId, action.summary)?.id,
    status:
      created?.status ?? queryInternalActionBySummary(tenantId, ticketId, action.summary)?.status,
  };
}

async function ensureReturnedInternalAction({
  memberSession,
  tenantId,
  internalActionId,
  action,
}) {
  let current = queryInternalActionById(internalActionId);
  if (!current?.id) {
    current = { id: internalActionId, status: 'open' };
  }

  if (current.status === 'returned_to_support') {
    return current;
  }

  if (current.status === 'open' || current.status === 'follow_up_requested') {
    await callRpcAsUser({
      apiUrl: memberSession.apiUrl,
      anonKey: memberSession.anonKey,
      accessToken: memberSession.accessToken,
      rpcName: 'rpc_internal_action_assign_to_self',
      body: {
        p_internal_action_id: internalActionId,
        p_tenant_id: tenantId,
      },
    });
  }

  await callRpcAsUser({
    apiUrl: memberSession.apiUrl,
    anonKey: memberSession.anonKey,
    accessToken: memberSession.accessToken,
    rpcName: 'rpc_internal_action_add_comment',
    body: {
      p_internal_action_id: internalActionId,
      p_tenant_id: tenantId,
      p_body: action.comment,
    },
  });

  await callRpcAsUser({
    apiUrl: memberSession.apiUrl,
    anonKey: memberSession.anonKey,
    accessToken: memberSession.accessToken,
    rpcName: 'rpc_internal_action_return_to_support',
    body: {
      p_internal_action_id: internalActionId,
      p_tenant_id: tenantId,
      p_body: action.returnBody,
    },
  });

  return queryInternalActionById(internalActionId);
}

function queryInternalActionById(internalActionId) {
  const result = runSupabaseDbQuery(`
    select
      id::text as id,
      status::text as status,
      assigned_area_user_id::text as assigned_area_user_id
    from public.internal_actions
    where id = '${sqlEscape(internalActionId)}'::uuid
    limit 1;
  `);

  return result.rows?.[0] ?? null;
}

function querySummary({ tenantId, ticketId, actionIds }) {
  const result = runSupabaseDbQuery(`
    select jsonb_build_object(
      'tenant', (
        select jsonb_build_object('id', id, 'slug', slug, 'display_name', display_name)
        from public.tenants
        where id = '${sqlEscape(tenantId)}'::uuid
      ),
      'ticket', (
        select jsonb_build_object('id', id, 'title', title, 'status', status)
        from public.tickets
        where id = '${sqlEscape(ticketId)}'::uuid
      ),
      'internal_actions', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', ia.id,
          'summary', ia.summary,
          'status', ia.status,
          'target_area', ia.target_area,
          'ticket_id', ia.ticket_id
        ) order by ia.summary), '[]'::jsonb)
        from public.internal_actions as ia
        where ia.id = any(array[${actionIds
          .map((id) => `'${sqlEscape(id)}'::uuid`)
          .join(', ')}])
      ),
      'engineering_work_item', (
        select jsonb_build_object(
          'id', ewi.id,
          'title', ewi.title,
          'status', ewi.status
        )
        from public.engineering_work_items as ewi
        join public.engineering_ticket_links as etl
          on etl.engineering_work_item_id = ewi.id
        where etl.ticket_id = '${sqlEscape(ticketId)}'::uuid
        order by ewi.created_at desc
        limit 1
      ),
      'customer_account', (
        select jsonb_build_object(
          'profile_id', profile.id,
          'product_line', profile.product_line,
          'operational_status', profile.operational_status,
          'account_tier', profile.account_tier,
          'integrations_count', (
            select count(*)::integer
            from public.customer_account_integrations as integration
            where integration.tenant_id = profile.tenant_id
          ),
          'features_count', (
            select count(*)::integer
            from public.customer_account_features as feature
            where feature.tenant_id = profile.tenant_id
              and feature.enabled
          ),
          'customizations_count', (
            select count(*)::integer
            from public.customer_account_customizations as customization
            where customization.tenant_id = profile.tenant_id
              and customization.status = 'active'
          ),
          'alerts_count', (
            select count(*)::integer
            from public.customer_account_alerts as alert
            where alert.tenant_id = profile.tenant_id
              and alert.active
          )
        )
        from public.customer_account_profiles as profile
        where profile.tenant_id = '${sqlEscape(tenantId)}'::uuid
      ),
      'articles', jsonb_build_object(
        'public_published_slug', 'como-compartilhar-evidencias-em-um-ticket',
        'internal_slug', 'erp-diagnostico-interno-webhook',
        'restricted_entitled_slug', 'expedicao-checklist-autenticado-tenant-a',
        'restricted_without_entitlement_slug', 'erp-observacoes-restritas-rollout'
      ),
      'p2_ticket_intake_sources', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', ticket.id,
          'title', ticket.title,
          'source', ticket.source,
          'origin_key', case ticket.source
            when 'portal' then 'customer_portal'
            when 'internal' then 'suporte_manual'
            when 'email' then 'email_future'
            when 'api' then 'api_future'
            else 'system_future'
          end,
          'channel_key', case ticket.source
            when 'portal' then 'customer_portal'
            when 'email' then 'email'
            when 'api' then 'api'
            else 'internal_support'
          end,
          'channel_label', case ticket.source
            when 'portal' then 'Portal do cliente'
            when 'email' then 'Email'
            when 'api' then 'API'
            else 'Suporte interno'
          end,
          'can_reply_now', (
            ticket.status <> all(array['resolved', 'closed', 'cancelled']::public.ticket_status[])
            and ticket.source <> all(array['email', 'chat', 'api']::public.ticket_source[])
          ),
          'reason_if_unavailable', case
            when ticket.source = 'email'::public.ticket_source then 'Email ainda nao esta integrado para resposta direta.'
            when ticket.source = 'api'::public.ticket_source then 'API ainda nao esta integrado para resposta direta.'
            else null
          end
        ) order by ticket.title), '[]'::jsonb)
        from public.tickets as ticket
        where ticket.id = any(array[
          '${P2_COMMUNICATION_TICKETS.supportManual.id}'::uuid,
          '${P2_COMMUNICATION_TICKETS.portalOrigin.id}'::uuid,
          '${P2_COMMUNICATION_TICKETS.futureEmail.id}'::uuid,
          '${P2_COMMUNICATION_TICKETS.futureApi.id}'::uuid
        ])
      ),
      'p2_delivery_readiness', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'delivery_id', delivery.id,
          'ticket_id', delivery.ticket_id,
          'message_id', delivery.message_id,
          'channel', delivery.channel,
          'direction', delivery.direction,
          'status', delivery.status,
          'provider_state', delivery.provider_state
        ) order by delivery.created_at), '[]'::jsonb)
        from public.ticket_message_deliveries as delivery
        where delivery.message_id = any(array[
          '8e5ee201-7e27-45ef-9e61-f3209f6ad211'::uuid,
          '8e5ee201-7e27-45ef-9e61-f3209f6ad212'::uuid
        ])
      )
    ) as summary;
  `);

  return result.rows?.[0]?.summary ?? {};
}

async function main() {
  runSupportFixture();

  const envMap = runSupabaseStatusEnv();
  const { apiUrl, serviceRoleKey, anonKey } = assertLocalOnly(envMap);
  const tenant = queryTenantBySlug(TENANT_SLUG);

  if (!tenant?.id) {
    fail(`Tenant ${TENANT_SLUG} ausente apos fixture de suporte.`);
  }

  const ticket = queryTicketByTitle(tenant.id, POPULATED_TICKET_TITLE);
  if (!ticket?.id) {
    fail(`Ticket funcional ausente apos fixture de suporte: ${POPULATED_TICKET_TITLE}.`);
  }

  const adminProfile = queryProfileByEmail(USERS.platformAdmin.email);
  if (!adminProfile?.id) {
    fail(`Platform admin local ausente: ${USERS.platformAdmin.email}.`);
  }

  const supportManagerProfile = queryProfileByEmail(USERS.supportManager.email);
  const customerUserProfile = queryProfileByEmail(USERS.customerUser.email);

  if (!supportManagerProfile?.id) {
    fail(`Support manager local ausente: ${USERS.supportManager.email}.`);
  }

  if (!customerUserProfile?.id) {
    fail(`Customer user local ausente: ${USERS.customerUser.email}.`);
  }

  const internalMemberAuth = await createOrUpdateAuthUser({
    apiUrl,
    serviceRoleKey,
    email: USERS.internalAreaMember.email,
    password: USERS.internalAreaMember.password,
    fullName: USERS.internalAreaMember.fullName,
  });
  const internalEmptyAuth = await createOrUpdateAuthUser({
    apiUrl,
    serviceRoleKey,
    email: USERS.internalAreaEmpty.email,
    password: USERS.internalAreaEmpty.password,
    fullName: USERS.internalAreaEmpty.fullName,
  });
  const internalNonMemberAuth = await createOrUpdateAuthUser({
    apiUrl,
    serviceRoleKey,
    email: USERS.internalAreaNonMember.email,
    password: USERS.internalAreaNonMember.password,
    fullName: USERS.internalAreaNonMember.fullName,
  });

  const internalMemberProfile = queryProfileByEmail(USERS.internalAreaMember.email);
  const internalEmptyProfile = queryProfileByEmail(USERS.internalAreaEmpty.email);
  const internalNonMemberProfile = queryProfileByEmail(USERS.internalAreaNonMember.email);

  if (!internalMemberProfile?.id || !internalMemberProfile.is_active) {
    fail(`Profile ativo ausente para ${USERS.internalAreaMember.email}.`);
  }

  if (!internalEmptyProfile?.id || !internalEmptyProfile.is_active) {
    fail(`Profile ativo ausente para ${USERS.internalAreaEmpty.email}.`);
  }

  if (!internalNonMemberProfile?.id || !internalNonMemberProfile.is_active) {
    fail(`Profile ativo ausente para ${USERS.internalAreaNonMember.email}.`);
  }

  ensureTenantMembership({
    actorUserId: adminProfile.id,
    tenantId: tenant.id,
    userId: internalMemberProfile.id,
  });
  ensureTenantMembership({
    actorUserId: adminProfile.id,
    tenantId: tenant.id,
    userId: internalEmptyProfile.id,
  });
  ensureTenantMembership({
    actorUserId: adminProfile.id,
    tenantId: tenant.id,
    userId: internalNonMemberProfile.id,
  });

  ensureP2CommunicationFixture({
    tenantId: tenant.id,
    supportUserId: supportManagerProfile.id,
    customerUserId: customerUserProfile.id,
  });

  const adminSession = await sessionFor({ apiUrl, anonKey, user: USERS.platformAdmin });
  const supportSession = await sessionFor({ apiUrl, anonKey, user: USERS.supportManager });
  const memberSession = await sessionFor({ apiUrl, anonKey, user: USERS.internalAreaMember });

  const membershipId = await ensureAreaMembership({
    adminSession,
    tenantId: tenant.id,
    userId: internalMemberProfile.id,
  });
  const emptyMembershipId = await ensureAreaMembership({
    adminSession,
    tenantId: tenant.id,
    userId: internalEmptyProfile.id,
    areaKey: 'operations',
  });

  const openAction = await ensureInternalAction({
    supportSession,
    tenantId: tenant.id,
    ticketId: ticket.id,
    action: INTERNAL_ACTIONS.open,
  });

  const returnedAction = await ensureInternalAction({
    supportSession,
    tenantId: tenant.id,
    ticketId: ticket.id,
    action: INTERNAL_ACTIONS.returned,
  });

  if (!openAction?.id || !returnedAction?.id) {
    fail('Nao foi possivel materializar os acionamentos internos funcionais.');
  }

  await ensureReturnedInternalAction({
    memberSession,
    tenantId: tenant.id,
    internalActionId: returnedAction.id,
    action: INTERNAL_ACTIONS.returned,
  });

  const summary = querySummary({
    tenantId: tenant.id,
    ticketId: ticket.id,
    actionIds: [openAction.id, returnedAction.id],
  });

  console.log(
    JSON.stringify(
      {
        fixture: 'local-functional-private-routes',
        remote_used: false,
        users: {
          ...USERS,
          internalAreaMember: {
            ...USERS.internalAreaMember,
            user_id: internalMemberAuth.id ?? internalMemberProfile.id,
            profile_id: internalMemberProfile.id,
          },
          internalAreaEmpty: {
            ...USERS.internalAreaEmpty,
            user_id: internalEmptyAuth.id ?? internalEmptyProfile.id,
            profile_id: internalEmptyProfile.id,
          },
          internalAreaNonMember: {
            ...USERS.internalAreaNonMember,
            user_id: internalNonMemberAuth.id ?? internalNonMemberProfile.id,
            profile_id: internalNonMemberProfile.id,
          },
        },
        internal_area_membership: {
          membership_id: membershipId,
          empty_membership_id: emptyMembershipId,
          area_key: 'finance',
          empty_area_key: 'operations',
          member_profile_id: internalMemberProfile.id,
          empty_profile_id: internalEmptyProfile.id,
          non_member_profile_id: internalNonMemberProfile.id,
        },
        ...summary,
      },
      null,
      2,
    ),
  );
}

await main();
