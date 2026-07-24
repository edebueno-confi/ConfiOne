import { AppError, toAppError } from '../../app/errors';
import { readRuntimeConfig } from '../../app/runtime-config';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';
import type {
  CustomerPortalActiveTenantContext,
  CustomerPortalAvailableTenant,
  CustomerPortalAuthContext,
  CustomerPortalKnowledgeArticle,
  CustomerPortalKnowledgeArticleDetail,
  CustomerPortalKnowledgeSearchResult,
  CustomerPortalProfileContext,
  CustomerPortalSessionStatus,
  CustomerPortalTicketAttachment,
  CustomerPortalTicketCollaborationState,
  CustomerPortalTicketDetail,
  CustomerPortalTicketKnowledgeLink,
  CustomerPortalTicketListItem,
  CustomerPortalTicketTimelineItem,
  RpcCustomerAcknowledgeTicketUpdatePayload,
  RpcCustomerAcknowledgeTicketUpdateResponse,
  RpcCustomerAddTicketMessagePayload,
  RpcCustomerAddTicketMessageResponse,
  RpcCustomerConfirmTicketResolvedPayload,
  RpcCustomerConfirmTicketResolvedResponse,
  RpcCustomerCreateTicketPayload,
  RpcCustomerCreateTicketResponse,
  RpcCustomerCreateTicketAttachmentUploadResponse,
  RpcCustomerGetAttachmentDownloadUrlPayload,
  RpcCustomerGetAttachmentDownloadUrlResponse,
  RpcCustomerGetPortalSessionStatusResponse,
  RpcCustomerRegisterTicketAttachmentResponse,
  RpcCustomerRequestTicketReopenPayload,
  RpcCustomerRequestTicketReopenResponse,
  RpcCustomerSearchKnowledgeArticlesPayload,
  RpcCustomerSetActiveTenantPayload,
  RpcCustomerSetActiveTenantResponse,
  TicketEventType,
  TicketStatus,
  TicketTimelineEntryType,
  Uuid,
} from '../../contracts/support-contracts';

export const CUSTOMER_PORTAL_ATTACHMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const CUSTOMER_PORTAL_SESSION_TIMEOUT_MS = 8_000;
const CUSTOMER_PORTAL_READ_TIMEOUT_MS = 12_000;
const CUSTOMER_PORTAL_MUTATION_TIMEOUT_MS = 15_000;
const CUSTOMER_PORTAL_UPLOAD_TIMEOUT_MS = 20_000;

export const CUSTOMER_PORTAL_ATTACHMENT_ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

function requireClient() {
  return requireSupabaseBrowserClient();
}

function requireSupabaseFunctionBaseUrl() {
  const config = readRuntimeConfig();

  if (!config.ok) {
    throw new Error('As operações seguras deste ambiente não estão disponíveis agora.');
  }

  return {
    supabaseAnonKey: config.config.supabaseAnonKey,
    supabaseUrl: config.config.supabaseUrl.replace(/\/$/, ''),
  };
}

function createPortalTimeoutError(message: string) {
  return new AppError('network-retryable', message);
}

function humanizePortalContextValue(value: unknown) {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (!normalized) {
    return 'Indisponível';
  }

  if (normalized === 'genius_returns') {
    return 'Genius Returns';
  }

  if (normalized === 'active') {
    return 'Ativo';
  }

  if (normalized === 'enterprise') {
    return 'Plano Enterprise';
  }

  return String(value);
}

async function withPromiseTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number,
  timeoutMessage: string,
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(createPortalTimeoutError(timeoutMessage));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
}

async function withFetchTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('portal-timeout'), timeoutMs);

  try {
    return await run(controller.signal);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw createPortalTimeoutError(timeoutMessage);
    }

    throw toAppError(
      error instanceof Error ? error : new Error(timeoutMessage),
      timeoutMessage,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requireActiveSessionToken() {
  const client = requireClient();
  const {
    data: { session },
    error,
  } = await withPromiseTimeout(
    client.auth.getSession(),
    CUSTOMER_PORTAL_SESSION_TIMEOUT_MS,
    'A validação da sua sessão demorou mais do que o esperado. Tente novamente.',
  );

  if (error || !session?.access_token) {
    throw new AppError(
      'session-expired',
      'Sua sessão não está mais válida para esta operação.',
    );
  }

  return session.access_token;
}

async function callSupabaseFunctionJson<T>(
  relativeUrl: string,
  init: RequestInit = {},
): Promise<T> {
  const { supabaseAnonKey, supabaseUrl } = requireSupabaseFunctionBaseUrl();
  const accessToken = await requireActiveSessionToken();
  let response: Response;
  const timeoutMs =
    String(init.method ?? 'GET').toUpperCase() === 'POST'
      ? CUSTOMER_PORTAL_UPLOAD_TIMEOUT_MS
      : CUSTOMER_PORTAL_MUTATION_TIMEOUT_MS;

  try {
    response = await withFetchTimeout(
      (signal) =>
        fetch(`${supabaseUrl}${relativeUrl}`, {
          ...init,
          signal,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: supabaseAnonKey,
            ...(init.headers ?? {}),
          },
        }),
      timeoutMs,
      'A comunicação segura com o portal demorou mais do que o esperado. Tente novamente.',
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw toAppError(error instanceof Error ? error : new Error('Falha ao chamar função segura.'), 'Falha ao chamar a função segura do portal.');
  }

  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  if (!response.ok) {
    if (response.status === 401) {
      throw new AppError(
        'session-expired',
        'Sua sessão não está mais válida para esta operação.',
      );
    }

    if (response.status === 403) {
      throw new AppError(
        'permission-denied',
        payload?.error ?? 'Seu acesso atual não permite concluir esta operação.',
      );
    }

    throw new AppError(
      'fatal-error',
      payload?.error ?? 'Falha ao chamar a função segura do portal.',
    );
  }

  return payload as T;
}

function mapAttachmentUploadContract(
  row: Record<string, unknown>,
): RpcCustomerCreateTicketAttachmentUploadResponse {
  return {
    attachmentId: String(row.attachment_id),
    uploadIntentId: String(row.upload_intent_id),
    ticketId: String(row.ticket_id),
    tenantId: String(row.tenant_id),
    displayName: String(row.display_name),
    contentType: String(row.content_type),
    sizeBytes: Number(row.size_bytes ?? 0),
    maxSizeBytes: Number(row.max_size_bytes ?? CUSTOMER_PORTAL_ATTACHMENT_MAX_SIZE_BYTES),
    expiresAt: String(row.expires_at),
    uploadUrl: String(row.upload_url),
  };
}

function mapAuthContext(row: Record<string, unknown>): CustomerPortalAuthContext {
  return {
    userId: String(row.user_id),
    userFullName: (row.user_full_name as string | null) ?? null,
    userEmail: (row.user_email as string | null) ?? null,
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: String(row.tenant_display_name),
    tenantLegalName: String(row.tenant_legal_name),
    portalRole: row.portal_role as CustomerPortalAuthContext['portalRole'],
    contactId: String(row.contact_id),
    contactFullName: String(row.contact_full_name),
    contactEmail: (row.contact_email as string | null) ?? null,
    contactJobTitle: (row.contact_job_title as string | null) ?? null,
    canViewTickets: Boolean(row.can_view_tickets),
    canCreateTicket: Boolean(row.can_create_ticket),
    canViewAllTenantTickets: Boolean(row.can_view_all_tenant_tickets),
  };
}

function mapAvailableTenant(
  row: Record<string, unknown>,
): CustomerPortalAvailableTenant {
  return {
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: String(row.tenant_display_name),
    portalRole: row.portal_role as CustomerPortalAvailableTenant['portalRole'],
    accessStatus: humanizePortalContextValue(row.access_status ?? 'Indisponível'),
    canViewTickets: Boolean(row.can_view_tickets),
    canCreateTicket: Boolean(row.can_create_ticket),
    canViewAllTenantTickets: Boolean(row.can_view_all_tenant_tickets),
    isActiveContext: Boolean(row.is_active_context),
    availableTenantCount: Number(row.available_tenant_count ?? 0),
    hasMultipleTenants: Boolean(row.has_multiple_tenants),
  };
}

function mapSessionStatus(
  row: Record<string, unknown>,
): CustomerPortalSessionStatus {
  return {
    sessionState: row.session_state as CustomerPortalSessionStatus['sessionState'],
    reasonCode:
      (row.reason_code as CustomerPortalSessionStatus['reasonCode']) ?? null,
    reasonMessage: (row.reason_message as string | null) ?? null,
    activeTenantId: (row.active_tenant_id as string | null) ?? null,
    activeTenantName: (row.active_tenant_name as string | null) ?? null,
    availableTenantCount: Number(row.available_tenant_count ?? 0),
    contextVersion: (row.context_version as string | null) ?? null,
  };
}

function mapProfileContext(row: Record<string, unknown>): CustomerPortalProfileContext {
  return {
    ...mapAuthContext(row),
    productLine: humanizePortalContextValue(row.product_line ?? 'Indisponível'),
    operationalStatus: humanizePortalContextValue(row.operational_status ?? 'Indisponível'),
    accountTier: humanizePortalContextValue(row.account_tier ?? 'Indisponível'),
  };
}

function mapActiveTenantContext(
  row: Record<string, unknown>,
): CustomerPortalActiveTenantContext {
  return {
    ...mapProfileContext(row),
    availableTenantCount: Number(row.available_tenant_count ?? 0),
    hasMultipleTenants: Boolean(row.has_multiple_tenants),
    contextVersion: String(row.context_version ?? '1970-01-01T00:00:00+00:00'),
  };
}

function mapTicketListItem(row: Record<string, unknown>): CustomerPortalTicketListItem {
  return {
    ticketId: String(row.ticket_id),
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: String(row.tenant_display_name),
    requesterContactId: (row.requester_contact_id as string | null) ?? null,
    requesterContactFullName: (row.requester_contact_full_name as string | null) ?? null,
    title: String(row.title),
    customerStatusLabel: String(row.customer_status_label),
    internalStatus: row.internal_status as TicketStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    lastMessageAt: (row.last_message_at as string | null) ?? null,
    customerMessageCount: Number(row.customer_message_count ?? 0),
    customerAttachmentCount: Number(row.customer_attachment_count ?? 0),
    publicArticleCount: Number(row.public_article_count ?? 0),
    customerOriginLabel: String(row.customer_origin_label ?? 'Atendimento Genius'),
  };
}

function mapTicketDetail(row: Record<string, unknown>): CustomerPortalTicketDetail {
  return {
    ticketId: String(row.ticket_id),
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: String(row.tenant_display_name),
    requesterContactId: (row.requester_contact_id as string | null) ?? null,
    requesterContactFullName: (row.requester_contact_full_name as string | null) ?? null,
    title: String(row.title),
    description: String(row.description),
    customerStatusLabel: String(row.customer_status_label),
    internalStatus: row.internal_status as TicketStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    resolvedAt: (row.resolved_at as string | null) ?? null,
    closedAt: (row.closed_at as string | null) ?? null,
    canAddMessage: Boolean(row.can_add_message),
    canViewAttachments: Boolean(row.can_view_attachments),
    canViewPublicArticles: Boolean(row.can_view_public_articles),
    customerOriginLabel: String(row.customer_origin_label ?? 'Atendimento Genius'),
  };
}

function mapCollaborationState(
  row: Record<string, unknown>,
): CustomerPortalTicketCollaborationState {
  return {
    ticketId: String(row.ticket_id),
    tenantId: String(row.tenant_id),
    internalStatus: row.internal_status as TicketStatus,
    customerStatusLabel: String(row.customer_status_label),
    canReply: Boolean(row.can_reply),
    canAcknowledge: Boolean(row.can_acknowledge),
    canConfirmResolution: Boolean(row.can_confirm_resolution),
    canRequestReopen: Boolean(row.can_request_reopen),
    latestTimelineEntryId: (row.latest_timeline_entry_id as string | null) ?? null,
    latestTimelineEntryAt: (row.latest_timeline_entry_at as string | null) ?? null,
    lastAcknowledgedAt: (row.last_acknowledged_at as string | null) ?? null,
    lastAcknowledgedTimelineEntryId:
      (row.last_acknowledged_timeline_entry_id as string | null) ?? null,
    unreadCount: Number(row.unread_count ?? 0),
    hasNewUpdates: Boolean(row.has_new_updates),
    lastCustomerMessageAt: (row.last_customer_message_at as string | null) ?? null,
    lastSupportResponseAt: (row.last_support_response_at as string | null) ?? null,
  };
}

function mapTimelineItem(row: Record<string, unknown>): CustomerPortalTicketTimelineItem {
  return {
    ticketId: String(row.ticket_id),
    tenantId: String(row.tenant_id),
    timelineEntryId: String(row.timeline_entry_id),
    entryType: row.entry_type as TicketTimelineEntryType,
    occurredAt: String(row.occurred_at),
    actorLabel: String(row.actor_label),
    eventType: (row.event_type as TicketEventType | null) ?? null,
    eventLabel: (row.event_label as string | null) ?? null,
    body: (row.body as string | null) ?? null,
    customerEntryLabel: String(row.customer_entry_label ?? 'Atualização do ticket'),
    customerDeliveryLabel: (row.customer_delivery_label as string | null) ?? null,
  };
}

function mapAttachment(row: Record<string, unknown>): CustomerPortalTicketAttachment {
  return {
    attachmentId: String(row.attachment_id),
    ticketId: String(row.ticket_id),
    tenantId: String(row.tenant_id),
    displayName: String(row.display_name),
    contentType: (row.content_type as string | null) ?? null,
    sizeBytes: Number(row.size_bytes ?? 0),
    sizeLabel: String(row.size_label ?? 'Indisponivel'),
    uploadedByLabel: String(row.uploaded_by_label ?? 'Equipe Genius'),
    createdAt: String(row.created_at),
    status: row.status as CustomerPortalTicketAttachment['status'],
    canDownload: Boolean(row.can_download),
  };
}

function mapKnowledgeArticle(row: Record<string, unknown>): CustomerPortalKnowledgeArticle {
  return {
    tenantId: String(row.tenant_id),
    articleId: String(row.article_id),
    slug: String(row.slug),
    title: String(row.title),
    summary: (row.summary as string | null) ?? null,
    categoryName: (row.category_name as string | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
    updatedAt: (row.updated_at as string | null) ?? null,
    relationReason: (row.relation_reason as string | null) ?? null,
    source: row.source as CustomerPortalKnowledgeArticle['source'],
    sourceLabel: String(row.source_label ?? 'Autorizado'),
  };
}

function mapKnowledgeSearchResult(
  row: Record<string, unknown>,
): CustomerPortalKnowledgeSearchResult {
  return {
    ...mapKnowledgeArticle(row),
    matchReason: (row.match_reason as string | null) ?? null,
  };
}

function mapKnowledgeArticleDetail(
  row: Record<string, unknown>,
): CustomerPortalKnowledgeArticleDetail {
  return {
    ...mapKnowledgeArticle(row),
    bodyMd: String(row.body_md ?? ''),
  };
}

function mapTicketKnowledgeLink(
  row: Record<string, unknown>,
): CustomerPortalTicketKnowledgeLink {
  return {
    ...mapKnowledgeArticle(row),
    ticketId: String(row.ticket_id),
  };
}

async function fetchMany<T>(
  viewName: string,
  mapper: (row: Record<string, unknown>) => T,
  fallbackMessage: string,
) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client.from(viewName).select('*'),
    CUSTOMER_PORTAL_READ_TIMEOUT_MS,
    'A leitura do portal demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, fallbackMessage);
  }

  return (data ?? []).map((row) => mapper(row as Record<string, unknown>));
}

export async function fetchCustomerPortalContexts() {
  return fetchMany(
    'vw_customer_portal_profile_context',
    mapProfileContext,
    'Falha ao carregar o contexto do portal cliente.',
  );
}

export async function fetchCustomerPortalAvailableTenants() {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .from('vw_customer_portal_available_tenants')
      .select('*')
      .order('is_active_context', { ascending: false })
      .order('tenant_display_name', { ascending: true }),
    CUSTOMER_PORTAL_READ_TIMEOUT_MS,
    'A leitura dos tenants disponíveis demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao carregar tenants disponíveis no portal cliente.');
  }

  return (data ?? []).map((row) => mapAvailableTenant(row as Record<string, unknown>));
}

export async function fetchCustomerPortalActiveTenantContext() {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client.from('vw_customer_portal_active_tenant_context').select('*').maybeSingle(),
    CUSTOMER_PORTAL_READ_TIMEOUT_MS,
    'A leitura do tenant ativo demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao carregar o tenant ativo do portal cliente.');
  }

  return data ? mapActiveTenantContext(data as Record<string, unknown>) : null;
}

export async function fetchCustomerPortalSessionStatus() {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client.rpc('rpc_customer_get_portal_session_status').single(),
    CUSTOMER_PORTAL_READ_TIMEOUT_MS,
    'A revalidação da sessão do portal demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao revalidar a sessão do portal.');
  }

  return mapSessionStatus(
    data as Record<string, unknown>,
  ) satisfies RpcCustomerGetPortalSessionStatusResponse;
}

export async function setCustomerPortalActiveTenant(
  payload: RpcCustomerSetActiveTenantPayload,
) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .rpc('rpc_customer_set_active_tenant', {
        p_tenant_id: payload.tenantId,
      })
      .single(),
    CUSTOMER_PORTAL_MUTATION_TIMEOUT_MS,
    'A troca de tenant demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao trocar o tenant ativo do portal cliente.');
  }

  return mapActiveTenantContext(
    data as Record<string, unknown>,
  ) satisfies RpcCustomerSetActiveTenantResponse;
}

export async function fetchCustomerPortalTickets() {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .from('vw_customer_portal_ticket_list')
      .select('*')
      .order('updated_at', { ascending: false }),
    CUSTOMER_PORTAL_READ_TIMEOUT_MS,
    'A leitura dos tickets demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao carregar tickets do portal cliente.');
  }

  return (data ?? []).map((row) => mapTicketListItem(row as Record<string, unknown>));
}

export async function fetchCustomerPortalTicketDetail(ticketId: Uuid) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .from('vw_customer_portal_ticket_detail')
      .select('*')
      .eq('ticket_id', ticketId)
      .maybeSingle(),
    CUSTOMER_PORTAL_READ_TIMEOUT_MS,
    'A leitura do ticket demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao carregar o ticket do portal cliente.');
  }

  return data ? mapTicketDetail(data as Record<string, unknown>) : null;
}

export async function fetchCustomerPortalTicketTimeline(ticketId: Uuid) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .from('vw_customer_portal_ticket_timeline')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('occurred_at', { ascending: true }),
    CUSTOMER_PORTAL_READ_TIMEOUT_MS,
    'A leitura da timeline demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao carregar a timeline do portal cliente.');
  }

  return (data ?? []).map((row) => mapTimelineItem(row as Record<string, unknown>));
}

export async function fetchCustomerPortalTicketCollaborationState(ticketId: Uuid) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .from('vw_customer_portal_ticket_collaboration_state')
      .select('*')
      .eq('ticket_id', ticketId)
      .maybeSingle(),
    CUSTOMER_PORTAL_READ_TIMEOUT_MS,
    'A leitura da colaboração do ticket demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao carregar colaboração do ticket.');
  }

  return data ? mapCollaborationState(data as Record<string, unknown>) : null;
}

export async function fetchCustomerPortalTicketAttachments(ticketId: Uuid) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .from('vw_customer_portal_ticket_attachments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false }),
    CUSTOMER_PORTAL_READ_TIMEOUT_MS,
    'A leitura das evidências demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao carregar evidências do portal cliente.');
  }

  return (data ?? []).map((row) => mapAttachment(row as Record<string, unknown>));
}

export async function fetchCustomerPortalKnowledgeArticles(tenantId: Uuid) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .from('vw_customer_portal_knowledge_articles')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('source', { ascending: true })
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('published_at', { ascending: false, nullsFirst: false }),
    CUSTOMER_PORTAL_READ_TIMEOUT_MS,
    'A leitura da central autorizada demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao carregar a central de ajuda autorizada.');
  }

  return (data ?? []).map((row) => mapKnowledgeArticle(row as Record<string, unknown>));
}

export async function fetchCustomerPortalKnowledgeArticleDetail(
  tenantId: Uuid,
  articleSlug: string,
) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .from('vw_customer_portal_knowledge_article_detail')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('slug', articleSlug)
      .maybeSingle(),
    CUSTOMER_PORTAL_READ_TIMEOUT_MS,
    'A leitura do artigo autorizado demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao carregar o artigo autorizado do portal.');
  }

  return data ? mapKnowledgeArticleDetail(data as Record<string, unknown>) : null;
}

export async function fetchCustomerPortalTicketKnowledgeLinks(ticketId: Uuid) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .from('vw_customer_portal_ticket_knowledge_links')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('published_at', { ascending: false, nullsFirst: false }),
    CUSTOMER_PORTAL_READ_TIMEOUT_MS,
    'A leitura dos artigos relacionados demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao carregar artigos relacionados ao ticket.');
  }

  return (data ?? []).map((row) => mapTicketKnowledgeLink(row as Record<string, unknown>));
}

export async function searchCustomerPortalKnowledgeArticles(
  payload: RpcCustomerSearchKnowledgeArticlesPayload,
) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client.rpc('rpc_customer_search_knowledge_articles', {
      p_tenant_id: payload.tenantId,
      p_search_query: payload.searchQuery ?? null,
      p_category_name: payload.categoryName ?? null,
      p_source: payload.source ?? 'all',
      p_ticket_id: payload.ticketId ?? null,
      p_limit: payload.limit ?? 12,
      p_offset: payload.offset ?? 0,
    }),
    CUSTOMER_PORTAL_READ_TIMEOUT_MS,
    'A busca de artigos autorizados demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao buscar artigos autorizados do portal.');
  }

  return (data ?? []).map((row: unknown) =>
    mapKnowledgeSearchResult(row as Record<string, unknown>),
  );
}

export async function createCustomerPortalTicket(payload: RpcCustomerCreateTicketPayload) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .rpc('rpc_customer_create_ticket', {
        p_description: payload.description,
        p_tenant_id: payload.tenantId,
        p_title: payload.title,
      })
      .single(),
    CUSTOMER_PORTAL_MUTATION_TIMEOUT_MS,
    'A criação do ticket demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao criar ticket pelo portal cliente.');
  }

  const row = data as Record<string, unknown>;
  return {
    ticketId: String(row.ticket_id),
    tenantId: String(row.tenant_id),
    title: String(row.title),
    customerStatusLabel: String(row.customer_status_label),
    createdAt: String(row.created_at),
  } satisfies RpcCustomerCreateTicketResponse;
}

export async function addCustomerPortalTicketMessage(
  payload: RpcCustomerAddTicketMessagePayload,
) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .rpc('rpc_customer_add_ticket_message', {
        p_body: payload.body,
        p_ticket_id: payload.ticketId,
      })
      .single(),
    CUSTOMER_PORTAL_MUTATION_TIMEOUT_MS,
    'O envio da mensagem demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao registrar a mensagem do cliente.');
  }

  const row = data as Record<string, unknown>;
  return {
    body: String(row.body),
    createdAt: String(row.created_at),
    messageId: String(row.message_id),
    tenantId: String(row.tenant_id),
    ticketId: String(row.ticket_id),
  } satisfies RpcCustomerAddTicketMessageResponse;
}

export async function getCustomerPortalAttachmentDownloadUrl(
  payload: RpcCustomerGetAttachmentDownloadUrlPayload,
) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .rpc('rpc_customer_get_attachment_download_url', {
        p_attachment_id: payload.attachmentId,
      })
      .single(),
    CUSTOMER_PORTAL_MUTATION_TIMEOUT_MS,
    'A preparação do download demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao preparar o download seguro da evidência.');
  }

  const row = data as Record<string, unknown>;
  return {
    attachmentId: String(row.attachment_id),
    downloadUrl: String(row.download_url),
    expiresAt: String(row.expires_at),
  } satisfies RpcCustomerGetAttachmentDownloadUrlResponse;
}

export async function downloadCustomerPortalTicketAttachment(attachmentId: Uuid) {
  const downloadContract = await getCustomerPortalAttachmentDownloadUrl({ attachmentId });

  return await callSupabaseFunctionJson<{
    attachmentId: Uuid;
    signedUrl: string;
    expiresAt: string;
  }>(downloadContract.downloadUrl);
}

export async function uploadCustomerPortalTicketAttachment(input: {
  file: File;
  tenantId: Uuid;
  ticketId: Uuid;
}): Promise<RpcCustomerRegisterTicketAttachmentResponse> {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client.rpc('rpc_customer_create_ticket_attachment_upload', {
      p_content_type: input.file.type,
      p_original_filename: input.file.name,
      p_size_bytes: input.file.size,
      p_tenant_id: input.tenantId,
      p_ticket_id: input.ticketId,
    }),
    CUSTOMER_PORTAL_MUTATION_TIMEOUT_MS,
    'A preparação do upload demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao preparar o upload seguro da evidência.');
  }

  const contractRow = Array.isArray(data) ? data[0] : data;
  if (!contractRow) {
    throw new Error('A plataforma não retornou a preparação esperada para o envio.');
  }

  const uploadContract = mapAttachmentUploadContract(
    contractRow as Record<string, unknown>,
  );
  const formData = new FormData();
  formData.append('file', input.file);

  const payload = await callSupabaseFunctionJson<{
    attachment?: Record<string, unknown>;
  }>(uploadContract.uploadUrl, {
    body: formData,
    method: 'POST',
  });

  if (!payload.attachment) {
    throw new Error('A função segura não devolveu a evidência registrada.');
  }

  return mapAttachment(payload.attachment) satisfies RpcCustomerRegisterTicketAttachmentResponse;
}

export async function acknowledgeCustomerPortalTicketUpdate(
  payload: RpcCustomerAcknowledgeTicketUpdatePayload,
) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .rpc('rpc_customer_acknowledge_ticket_update', {
        p_last_timeline_entry_id: payload.lastTimelineEntryId ?? null,
        p_ticket_id: payload.ticketId,
      })
      .single(),
    CUSTOMER_PORTAL_MUTATION_TIMEOUT_MS,
    'O registro de leitura demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao marcar atualização como lida.');
  }

  const row = data as Record<string, unknown>;
  return {
    acknowledgedAt: String(row.acknowledged_at),
    lastTimelineEntryId: (row.last_timeline_entry_id as string | null) ?? null,
    tenantId: String(row.tenant_id),
    ticketId: String(row.ticket_id),
  } satisfies RpcCustomerAcknowledgeTicketUpdateResponse;
}

export async function confirmCustomerPortalTicketResolved(
  payload: RpcCustomerConfirmTicketResolvedPayload,
) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .rpc('rpc_customer_confirm_ticket_resolved', {
        p_ticket_id: payload.ticketId,
      })
      .single(),
    CUSTOMER_PORTAL_MUTATION_TIMEOUT_MS,
    'A confirmação da resolução demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao confirmar resolução do ticket.');
  }

  const row = data as Record<string, unknown>;
  return {
    closedAt: (row.closed_at as string | null) ?? null,
    customerStatusLabel: String(row.customer_status_label),
    status: row.status as TicketStatus,
    tenantId: String(row.tenant_id),
    ticketId: String(row.ticket_id),
  } satisfies RpcCustomerConfirmTicketResolvedResponse;
}

export async function requestCustomerPortalTicketReopen(
  payload: RpcCustomerRequestTicketReopenPayload,
) {
  const client = requireClient();
  const { data, error } = await withPromiseTimeout(
    client
      .rpc('rpc_customer_request_ticket_reopen', {
        p_reason: payload.reason,
        p_ticket_id: payload.ticketId,
      })
      .single(),
    CUSTOMER_PORTAL_MUTATION_TIMEOUT_MS,
    'A solicitação de reabertura demorou mais do que o esperado. Tente novamente.',
  );

  if (error) {
    throw toAppError(error, 'Falha ao solicitar reabertura do ticket.');
  }

  const row = data as Record<string, unknown>;
  return {
    customerStatusLabel: String(row.customer_status_label),
    status: row.status as TicketStatus,
    tenantId: String(row.tenant_id),
    ticketId: String(row.ticket_id),
    updatedAt: String(row.updated_at),
  } satisfies RpcCustomerRequestTicketReopenResponse;
}
