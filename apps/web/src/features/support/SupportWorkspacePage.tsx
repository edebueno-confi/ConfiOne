import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import {
  formatDateTime,
  humanizeToken,
} from '../../app/format';
import {
  ContractUnavailableState,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/states';
import { Avatar } from '../../components/Avatar';
import { FilterTabs } from '../../components/FilterTabs';
import {
  AppButton,
  GhostButton,
  InlineNotice,
  Panel,
  SelectInput,
  StatusPill,
  TextInput,
  TextareaInput,
  cx,
} from '../../components/ui';
import { useAuthContext } from '../auth/auth-context';
import { classifyAdminError } from '../admin/admin-errors';
import {
  addInternalTicketNote,
  addInternalActionEvidenceLink,
  addTicketMessage,
  acceptSupportInternalActionReturn,
  archiveSupportTicketArticleLink,
  assignTicket,
  closeSupportInternalAction,
  closeTicket,
  createTicket,
  createSupportInternalAction,
  createSupportEngineeringWorkItemFromTicket,
  getSupportInternalActionDetail,
  getSupportTicketAttachmentSignedUrl,
  getSupportCustomerAccountContext,
  listSupportCustomerProductContexts,
  getSupportCustomer360,
  getSupportCustomerRecentEvents,
  getSupportCustomerRecentTickets,
  getSupportTicketDetail,
  listSupportInternalActionTargetAreas,
  listSupportInternalActionTimeline,
  listSupportTicketInternalActions,
  listSupportTicketAttachments,
  listSupportTicketEngineeringLinks,
  getSupportTicketKnowledgeLinks,
  getSupportTicketTimelinePage,
  getSupportTicketTimelineRecent,
  linkSupportTicketArticle,
  listSupportAssignableAgents,
  listSupportTicketIntakeContacts,
  listSupportTicketIntakeTenants,
  listSupportTicketClassificationOptions,
  listSupportKnowledgeArticlePicker,
  listSupportCustomers360,
  markSupportArticleNeedsUpdate,
  markSupportDocumentationGap,
  listSupportTicketsQueue,
  SUPPORT_QUEUE_PAGE_SIZE,
  reopenTicket,
  requestSupportInternalActionFollowup,
  uploadSupportTicketAttachment,
  updateTicketClassification,
  updateTicketPrioritySeverity,
  updateTicketStatus,
} from './support-api';
import {
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  TICKET_SOURCES,
  TICKET_STATUSES,
  type InternalActionSupportType,
  type SupportInternalActionTargetArea,
  type SupportInternalActionDetail,
  type SupportInternalActionTimelineEntry,
  type EngineeringWorkItemType,
  type SupportAssignableAgent,
  type SupportCustomerAccountAlert,
  type SupportCustomerAccountContext,
  type SupportCustomerAccountCustomization,
  type SupportCustomerProductContext,
  type SupportCustomer360,
  type SupportCustomer360Contact,
  type SupportCustomerRecentEventsWindow,
  type SupportCustomerRecentTicketsWindow,
  type SupportCustomer360RecentEvent,
  type SupportCustomer360RecentTicket,
  type SupportKnowledgeArticlePickerItem,
  type SupportTicketIntakeContact,
  type SupportTicketIntakeTenant,
  type SupportTicketClassificationOption,
  type SupportTicketDetail,
  type SupportTicketAttachment,
  type SupportTicketEngineeringLink,
  type SupportTicketInternalAction,
  type SupportTicketKnowledgeLink,
  type SupportTicketQueueItem,
  type SupportTicketTimelineItem,
  type SupportTicketTimelineRecentWindow,
  type TicketKnowledgeLinkType,
  type TicketPriority,
  type TicketSeverity,
  type TicketSource,
  type TicketStatus,
  type TicketStatusUpdateTarget,
  type Uuid,
} from '../../contracts/support-contracts';
import {
  OperationalField,
  OperationalFooterActions,
  OperationalFormGrid,
  OperationalModal,
  SupportConversationMessage,
  SupportIconActionButton,
  SupportInternalNote,
  SupportSearchInput,
  SupportSystemEvent,
  SupportWorkspaceGrid,
} from './components/SupportWorkspacePrimitives';
import { SupportTicketComposerSection } from './components/SupportTicketComposerSection';
import {
  SupportClassificationDrawerPanel,
  SupportEvidenceDrawerPanel,
  SupportKnowledgeDrawerPanel,
  SupportRelatedDrawerPanel,
  SupportStatusDrawerPanel,
} from './components/SupportTicketContextPanels';
import {
  SupportEngineeringHandoffDrawerPanel,
  SupportInternalActionsDrawerPanel,
} from './components/SupportTicketAdvancedContextPanels';
import { SupportTicketContextRail } from './components/SupportTicketContextRail';
import { SupportTicketConversationSection } from './components/SupportTicketConversationSection';
import { SupportTicketQueue } from './components/SupportTicketQueue';
import { SupportTicketRightRail } from './components/SupportTicketRightRail';
import { SupportTicketWorkspaceHeader } from './components/SupportTicketWorkspaceHeader';
import {
  SupportSummaryStrip,
} from './components/SupportWorkspaceAuxiliaryPanels';
import { SupportQueueLoadingScaffold, SupportTicketLoadingScaffold } from './components/SupportWorkspaceStates';
import { CompactSupportPill, SupportSurfaceIcon } from './components/SupportWorkspaceVisuals';
import {
  formatSupportShortTime,
  humanizeKnowledgeLinkType,
  humanizeKnowledgeStatus,
  humanizeKnowledgeVisibility,
  humanizePriority,
  humanizeSeverity,
  humanizeStatus,
  primaryContactFromCustomer,
  readCustomerDocumentLabel,
  supportTicketCode,
  ticketTenantLabel,
  toneForTicketStatus,
  compactTicketStatusLabel,
} from './lib/SupportWorkspacePresentation';
import {
  supportActionDrawerSize,
  supportActionDrawerWidthVariant,
} from './lib/SupportWorkspaceContextRail';
import type {
  KnowledgePhase,
  QueueFilters,
  TicketActionDrawer,
} from './lib/SupportWorkspaceTypes';

type PagePhase = 'loading' | 'ready' | 'contract-unavailable' | 'error';
type DetailPhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type AgentsPhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type IntakePhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type AttachmentPhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type EngineeringPhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type InternalActionsPhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type InternalActionDetailPhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type InternalActionTargetAreasPhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type WorkspaceVariant = 'queue' | 'tickets';
type ComposerMode = 'public' | 'internal';
type TicketInboxScope = 'open' | 'closed';
type TicketInboxFilter =
  | 'all'
  | 'in_progress'
  | 'awaiting'
  | 'urgent'
  | 'operations'
  | 'engineering'
  | 'all_closed'
  | 'resolved'
  | 'closed'
  | 'cancelled';
const TICKET_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
const TICKET_ATTACHMENT_ACCEPT =
  '.pdf,.json,.jpg,.jpeg,.png,.webp,.csv,.txt,application/pdf,application/json,image/jpeg,image/png,image/webp,text/csv,text/plain';

interface TicketIntakeDraft {
  tenantId: Uuid | '';
  requesterContactId: Uuid | '';
  source: TicketSource;
  priority: TicketPriority;
  severity: TicketSeverity;
  categoryId: Uuid | '';
  operationalReasonId: Uuid | '';
  title: string;
  description: string;
}
interface TicketClassificationDraft {
  categoryId: Uuid | '';
  operationalReasonId: Uuid | '';
  note: string;
}
interface TicketPrioritySeverityDraft {
  priority: TicketPriority;
  severity: TicketSeverity;
  operationalReasonId: Uuid | '';
  note: string;
}

interface EngineeringHandoffDraft {
  workItemType: EngineeringWorkItemType;
  title: string;
  description: string;
  handoffNote: string;
  impactSummary: string;
  reproductionSteps: string;
  expectedResult: string;
  currentResult: string;
  relatedEvidence: string;
  technicalUrgency: TicketPriority;
}

interface InternalActionCreateDraft {
  targetArea: string;
  supportType: InternalActionSupportType | '';
  priority: TicketPriority;
  summary: string;
  context: string;
  evidenceAttachmentIds: Uuid[];
}

interface TicketAttachmentUploadDraft {
  files: File[];
  note: string;
  errors: Record<string, string>;
}

interface SupportCustomerPreviewSnapshot {
  customer: SupportCustomer360;
  accountContext: SupportCustomerAccountContext | null;
  productContexts: SupportCustomerProductContext[];
  recentTicketsWindow: SupportCustomerRecentTicketsWindow;
  recentEventsWindow: SupportCustomerRecentEventsWindow;
}

const OPEN_TICKET_FILTERS = ['all', 'in_progress', 'awaiting', 'urgent', 'operations', 'engineering'] as const;
const CLOSED_TICKET_FILTERS = ['all_closed', 'resolved', 'closed', 'cancelled'] as const;

function defaultTicketInboxFilterForScope(scope: TicketInboxScope): TicketInboxFilter {
  return scope === 'open' ? 'all' : 'all_closed';
}

function ticketInboxFilterMatchesScope(filter: TicketInboxFilter, scope: TicketInboxScope) {
  return scope === 'open'
    ? OPEN_TICKET_FILTERS.some((candidate) => candidate === filter)
    : CLOSED_TICKET_FILTERS.some((candidate) => candidate === filter);
}

function toneForPriority(priority: TicketPriority) {
  if (priority === 'urgent') {
    return 'critical' as const;
  }

  if (priority === 'high') {
    return 'warning' as const;
  }

  return 'default' as const;
}

function toneForSeverity(severity: TicketSeverity) {
  if (severity === 'critical') {
    return 'critical' as const;
  }

  if (severity === 'high') {
    return 'warning' as const;
  }

  return 'default' as const;
}

function humanizeSlaPolicyScope(scope: SupportTicketQueueItem['slaPolicyScope'] | SupportTicketDetail['slaPolicyScope']) {
  if (scope === 'tenant') {
    return 'Política do cliente';
  }

  if (scope === 'global_fallback') {
    return 'Fallback interno';
  }

  return 'Sem política definida';
}

function approximateSlaPercent(detail: SupportTicketDetail) {
  const dueAt = detail.resolutionDueAt ?? detail.firstResponseDueAt;
  if (!dueAt) {
    return detail.slaStatus === 'breached' ? 100 : detail.slaStatus === 'at_risk' ? 72 : 48;
  }

  const dueMs = Date.parse(dueAt);
  const startMs = Date.parse(detail.createdAt);
  if (!Number.isFinite(dueMs) || !Number.isFinite(startMs) || dueMs <= startMs) {
    return detail.slaStatus === 'breached' ? 100 : detail.slaStatus === 'at_risk' ? 72 : 48;
  }

  const nowMs = Date.now();
  const elapsed = Math.max(0, nowMs - startMs);
  const total = dueMs - startMs;
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

function formatRemainingTimeLabel(targetIso: string | null) {
  if (!targetIso) {
    return 'Prazo indisponível';
  }

  const delta = Date.parse(targetIso) - Date.now();
  const absoluteMinutes = Math.max(0, Math.round(Math.abs(delta) / 60000));
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  const compact = `${hours}h ${String(minutes).padStart(2, '0')}m`;

  return delta >= 0 ? `${compact} restantes` : `${compact} em atraso`;
}

function humanizeVisibility(value: string) {
  return value === 'internal' ? 'Nota interna' : 'Resposta pública';
}

function formatAttachmentSize(sizeBytes: number) {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return 'Tamanho indisponível';
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${Math.round((sizeBytes / (1024 * 1024)) * 10) / 10} MB`;
}

function initialsFromSupportLabel(value: string | null | undefined) {
  const parts = (value ?? 'IN')
    .split(/[\s@._-]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.length > 0
    ? parts.map((part) => part[0]?.toLocaleUpperCase('pt-BR') ?? '').join('')
    : 'IN';
}

function LoadingBlock({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        'animate-pulse rounded-[18px] bg-[linear-gradient(90deg,rgba(226,232,240,0.9),rgba(241,245,249,0.95),rgba(226,232,240,0.9))]',
        className,
      )}
    />
  );
}

function humanizeAttachmentStatus(status: SupportTicketAttachment['status']) {
  return status === 'archived' ? 'Arquivado' : 'Disponível';
}

function attachmentKind(attachment: SupportTicketAttachment) {
  const name = attachment.displayName.toLocaleLowerCase('pt-BR');
  const contentType = attachment.contentType?.toLocaleLowerCase('pt-BR') ?? '';

  if (contentType.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(name)) {
    return 'Imagem';
  }

  if (contentType.includes('json') || contentType.includes('text') || /\.(json|txt|log|csv)$/i.test(name)) {
    return 'Log';
  }

  return 'Documento';
}

function sanitizeSupportVisibleText(value: string | null | undefined) {
  const sanitized = (value ?? 'Indisponível')
    .replace(/\bpayload\b/gi, 'conteúdo técnico')
    .replace(/\bbackend\b/gi, 'operação')
    .replace(/\bprovider\b/gi, 'serviço externo')
    .replace(/\bcontratos?\b/gi, 'acordos operacionais')
    .replace(/\btenant\b/gi, 'cliente')
    .replace(/\bfixture\b/gi, 'registro de validação')
    .replace(/\bRPCs?\b/g, 'processo operacional')
    .replace(/\bRLS\b/g, 'regra de acesso')
    .replace(/\bSupabase\b/g, 'plataforma')
    .replace(/\bschema\b/gi, 'estrutura');

  return sanitized.length > 320 ? `${sanitized.slice(0, 317).trimEnd()}...` : sanitized;
}

function toneForAttachmentStatus(status: SupportTicketAttachment['status']) {
  return status === 'archived' ? ('warning' as const) : ('positive' as const);
}

function friendlyAttachmentUploadErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes('content type is not allowed')) {
    return 'O tipo de arquivo não está liberado para evidências deste ticket.';
  }

  if (normalized.includes('file size exceeds')) {
    return 'O arquivo ultrapassa o limite de 10 MB para evidências.';
  }

  if (normalized.includes('file size must be greater than zero')) {
    return 'Selecione um arquivo com conteúdo antes de enviar.';
  }

  if (normalized.includes('ticket is not eligible')) {
    return 'Este ticket não aceita novas evidências no status atual.';
  }

  if (normalized.includes('ticket not found')) {
    return 'A leitura de evidências deste ticket não ficou disponível agora.';
  }

  if (normalized.includes('upload intent expired')) {
    return 'O preparo do upload expirou. Tente enviar o arquivo novamente.';
  }

  if (normalized.includes('rpc_support_create_ticket_attachment_upload denied')) {
    return 'Seu acesso atual não permite enviar evidências para este ticket.';
  }

  return message;
}

function friendlyAttachmentDownloadErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('download grant not found') ||
    normalized.includes('download grant expired')
  ) {
    return 'O link temporário expirou antes do download. Tente novamente.';
  }

  if (
    normalized.includes('rpc_support_get_ticket_attachment_download_url denied') ||
    normalized.includes('ticket attachment is not available')
  ) {
    return 'A evidência não está disponível para download com o acesso atual.';
  }

  return message;
}

function humanizeSource(source: TicketSource) {
  switch (source) {
    case 'portal':
      return 'Portal';
    case 'email':
      return 'E-mail';
    case 'chat':
      return 'Chat';
    case 'phone':
      return 'Telefone';
    case 'api':
      return 'API';
    case 'internal':
      return 'Interno';
    default:
      return humanizeToken(source);
  }
}

function humanizeCustomerValue(value: string) {
  return humanizeToken(value).replaceAll('_', ' ');
}

function humanizeTenantStatus(value: string) {
  if (value === 'active') {
    return 'Ativo';
  }

  if (value === 'suspended') {
    return 'Suspenso';
  }

  if (value === 'archived') {
    return 'Arquivado';
  }

  return humanizeCustomerValue(value);
}

function labelForCustomerProductSubscriptionStatus(
  value: SupportCustomerProductContext['status'],
) {
  const labels: Record<SupportCustomerProductContext['status'], string> = {
    active: 'Ativa',
    suspended: 'Suspensa',
  };

  return labels[value];
}

function toneForCustomerProductSubscriptionStatus(
  value: SupportCustomerProductContext['status'],
) {
  return value === 'active' ? 'positive' as const : 'warning' as const;
}

function labelForCustomerProductEntitlementSource(
  value: SupportCustomerProductContext['activeSupportFeatures'][number]['entitlementSource'],
) {
  const labels: Record<
    SupportCustomerProductContext['activeSupportFeatures'][number]['entitlementSource'],
    string
  > = {
    addon: 'Add-on',
    migration: 'Migração',
    ops_override: 'Override operacional',
    pilot: 'Piloto',
    plan: 'Plano',
  };

  return labels[value];
}

function labelForCustomerProductOwnerRole(
  value: SupportCustomerProductContext['activeInternalOwners'][number]['ownerRole'],
) {
  const labels: Record<
    SupportCustomerProductContext['activeInternalOwners'][number]['ownerRole'],
    string
  > = {
    account_owner: 'Account owner',
    cs_owner: 'CS',
    finance_owner: 'Financeiro operacional',
    implementation_owner: 'Implantação',
    support_owner: 'Suporte',
    technical_owner: 'Técnico',
  };

  return labels[value];
}

function primaryCustomerProductContext(productContexts: SupportCustomerProductContext[]) {
  return (
    productContexts.find((productContext) => productContext.status === 'active') ??
    productContexts[0] ??
    null
  );
}

function displayCustomerProductLabel(
  accountContext: SupportCustomerAccountContext | null,
  productContexts: SupportCustomerProductContext[],
) {
  const primaryProduct = primaryCustomerProductContext(productContexts);

  if (primaryProduct) {
    return primaryProduct.productDisplayName;
  }

  return displayCustomerValue(
    accountContext?.productLine ? humanizeCustomerValue(accountContext.productLine) : null,
  );
}

function displayCustomerPlanLabel(
  accountContext: SupportCustomerAccountContext | null,
  productContexts: SupportCustomerProductContext[],
) {
  const primaryProduct = primaryCustomerProductContext(productContexts);

  if (primaryProduct) {
    return primaryProduct.planDisplayName;
  }

  return displayCustomerValue(
    accountContext?.accountTier ? humanizeCustomerValue(accountContext.accountTier) : null,
  );
}

function SupportCustomerProductsPanel({
  productContexts,
}: {
  productContexts: SupportCustomerProductContext[];
}) {
  if (productContexts.length === 0) {
    return (
      <InlineNotice>
        Nenhuma subscription ativa ou suspensa ficou disponível para esta conta.
      </InlineNotice>
    );
  }

  return (
    <div className="space-y-3">
      {productContexts.map((productContext) => (
        <div
          className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-4"
          key={productContext.subscriptionId}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={toneForCustomerProductSubscriptionStatus(productContext.status)}>
                  {labelForCustomerProductSubscriptionStatus(productContext.status)}
                </StatusPill>
                <StatusPill>{productContext.planDisplayName}</StatusPill>
              </div>
              <h3 className="text-[1rem] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                {productContext.productDisplayName}
              </h3>
            </div>
            <div className="text-right text-[12px] leading-5 text-[color:var(--color-muted)]">
              <p>Renovação</p>
              <p className="font-semibold text-[color:var(--color-ink)]">
                {productContext.renewalAt ? formatDateTime(productContext.renewalAt) : 'Indisponível'}
              </p>
            </div>
          </div>

          <dl className="mt-3 grid gap-2 text-[12px] leading-5 text-[color:var(--color-muted)] md:grid-cols-3">
            <div>
              <dt className="font-semibold uppercase tracking-[0.14em]">Início</dt>
              <dd>{productContext.startedAt ? formatDateTime(productContext.startedAt) : 'Indisponível'}</dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-[0.14em]">Fim</dt>
              <dd>{productContext.endedAt ? formatDateTime(productContext.endedAt) : 'Indisponível'}</dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-[0.14em]">Features</dt>
              <dd>{productContext.activeSupportFeatures.length}</dd>
            </div>
          </dl>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Features visíveis ao suporte
              </p>
              <div className="flex flex-wrap gap-2">
                {productContext.activeSupportFeatures.length === 0 ? (
                  <StatusPill>Indisponível</StatusPill>
                ) : (
                  productContext.activeSupportFeatures.map((feature) => (
                    <StatusPill key={`${productContext.subscriptionId}-${feature.featureKey}`}>
                      {feature.displayName} · {labelForCustomerProductEntitlementSource(feature.entitlementSource)}
                    </StatusPill>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Responsáveis internos
              </p>
              <div className="space-y-2">
                {productContext.activeInternalOwners.length === 0 ? (
                  <p className="text-sm text-[color:var(--color-muted)]">Indisponível</p>
                ) : (
                  productContext.activeInternalOwners.map((owner, index) => (
                    <div
                      className="rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
                      key={`${productContext.subscriptionId}-${owner.ownerRole}-${owner.areaKey ?? index}`}
                    >
                      <p className="font-semibold text-[color:var(--color-ink)]">
                        {labelForCustomerProductOwnerRole(owner.ownerRole)}
                      </p>
                      <p className="text-[color:var(--color-muted)]">
                        {displayCustomerValue(owner.areaDisplayName)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function extractPublicArticleBasePath(publicArticlePath: string | null | undefined) {
  if (!publicArticlePath) {
    return null;
  }

  const marker = '/articles/';
  const markerIndex = publicArticlePath.indexOf(marker);

  if (markerIndex <= 0) {
    return null;
  }

  return publicArticlePath.slice(0, markerIndex);
}

function buildAbsoluteAppUrl(path: string) {
  if (typeof window === 'undefined') {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

function getKnowledgeCustomerSendBlockReason(
  article: Pick<
    SupportKnowledgeArticlePickerItem,
    | 'articleStatus'
    | 'articleVisibility'
    | 'canSendToCustomer'
    | 'isCustomerSendAllowed'
    | 'publicArticlePath'
    | 'reasonIfBlocked'
  >,
) {
  if (!article.canSendToCustomer || !article.isCustomerSendAllowed) {
    return article.reasonIfBlocked ?? 'Backend não autorizou o envio ao cliente.';
  }

  if (!article.publicArticlePath) {
    return 'Rota pública indisponível.';
  }

  if (article.articleStatus !== 'published') {
    return 'Artigo ainda não publicado.';
  }

  if (article.articleVisibility !== 'public') {
    return 'Conteúdo não é público.';
  }

  return null;
}

function humanizeTicketEventLabel(eventType: SupportTicketTimelineItem['eventType']) {
  const normalizedEventType = String(eventType ?? '').toLocaleLowerCase('pt-BR');

  switch (normalizedEventType) {
    case 'ticket_created':
      return 'Ticket criado';
    case 'assigned':
      return 'Responsável atualizado';
    case 'status_changed':
      return 'Status atualizado';
    case 'classification_changed':
    case 'classification_updated':
      return 'Classificação atualizada';
    case 'priority_changed':
    case 'priority_severity_changed':
    case 'priority_severity_updated':
      return 'Prioridade e severidade atualizadas';
    case 'sla_policy_changed':
    case 'sla_policy_updated':
      return 'SLA atualizado';
    case 'message_added':
      return 'Mensagem registrada';
    case 'internal_note_added':
      return 'Nota interna registrada';
    case 'attachment_added':
      return 'Evidência registrada';
    case 'escalated_to_engineering':
      return 'Escalado para engenharia';
    case 'linked_to_work_item':
      return 'Vinculado a demanda técnica';
    case 'engineering_update_added':
      return 'Retorno técnico registrado';
    case 'engineering_status_updated':
      return 'Andamento técnico atualizado';
    case 'resolved':
      return 'Ticket resolvido';
    case 'cancelled':
      return 'Ticket cancelado';
    default:
      return 'Evento operacional registrado';
  }
}

function toneForAlertSeverity(severity: SupportCustomerAccountAlert['severity']) {
  if (severity === 'critical') {
    return 'critical' as const;
  }

  if (severity === 'high' || severity === 'warning') {
    return 'warning' as const;
  }

  return 'default' as const;
}

function toneForCustomizationRisk(
  riskLevel: SupportCustomerAccountCustomization['riskLevel'],
) {
  if (riskLevel === 'critical') {
    return 'critical' as const;
  }

  if (riskLevel === 'high' || riskLevel === 'medium') {
    return 'warning' as const;
  }

  return 'default' as const;
}

function humanizeSupportRole(role: SupportAssignableAgent['role']) {
  if (role === 'platform_admin') {
    return 'Administrador da plataforma';
  }

  if (role === 'support_manager') {
    return 'Gestor de suporte';
  }

  return 'Agente de suporte';
}

function buildSupportCustomerRecentEventKey(
  event: SupportCustomer360RecentEvent,
  index: number,
) {
  const actorKey = event.actorUserId ?? 'no-actor';
  return [
    'customer-event',
    event.ticketId,
    event.eventType,
    event.visibility,
    event.occurredAt,
    actorKey,
    index,
  ].join(':');
}

function humanizeEngineeringWorkItemType(workItemType: EngineeringWorkItemType) {
  switch (workItemType) {
    case 'bug':
      return 'Bug';
    case 'improvement':
      return 'Melhoria';
    case 'technical_task':
      return 'Tarefa técnica';
    case 'investigation':
      return 'Investigação';
    default:
      return humanizeToken(workItemType).replaceAll('_', ' ');
  }
}

function humanizeEngineeringWorkItemStatus(
  status: SupportTicketEngineeringLink['workItemStatus'],
) {
  switch (status) {
    case 'triage':
      return 'Triagem';
    case 'accepted':
      return 'Aceito';
    case 'rejected':
      return 'Rejeitado';
    case 'in_progress':
      return 'Em andamento';
    case 'waiting_external':
      return 'Aguardando externo';
    case 'released':
      return 'Liberado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return humanizeToken(status).replaceAll('_', ' ');
  }
}

function toneForEngineeringWorkItemStatus(
  status: SupportTicketEngineeringLink['workItemStatus'],
) {
  if (status === 'released') {
    return 'positive' as const;
  }

  if (status === 'rejected' || status === 'cancelled') {
    return 'critical' as const;
  }

  if (status === 'triage' || status === 'waiting_external') {
    return 'warning' as const;
  }

  return 'default' as const;
}

function formatAssignableAgentLabel(agent: SupportAssignableAgent) {
  return `${agent.fullName} · ${humanizeSupportRole(agent.role)}`;
}

function formatAssignedAgentSummary(agent: SupportAssignableAgent | null) {
  if (!agent) {
    return null;
  }

  return agent.fullName;
}

function intakeTenantLabel(
  tenant: Pick<SupportTicketIntakeTenant, 'tenantDisplayName' | 'tenantLegalName' | 'tenantSlug'>,
) {
  return tenant.tenantDisplayName ?? tenant.tenantLegalName ?? 'Cliente indisponível';
}

function displaySupportCustomerName(
  customer: Pick<SupportCustomer360, 'tenantDisplayName' | 'tenantLegalName'>,
) {
  return customer.tenantDisplayName ?? customer.tenantLegalName ?? 'Cliente indisponível';
}

function emptyFilters(): QueueFilters {
  return {
    status: 'all',
    priority: 'all',
    severity: 'all',
    categoryId: 'all',
    tenantId: 'all',
    assignedToUserId: 'all',
  };
}

function emptyTimelineWindow(): SupportTicketTimelineRecentWindow {
  return {
    entries: [],
    totalAvailableCount: 0,
    recentLimit: 25,
    hasMore: false,
  };
}

function emptyTicketIntakeDraft(): TicketIntakeDraft {
  return {
    tenantId: '',
    requesterContactId: '',
    source: 'internal',
    priority: 'normal',
    severity: 'medium',
    categoryId: '',
    operationalReasonId: '',
    title: '',
    description: '',
  };
}

function emptyTicketClassificationDraft(): TicketClassificationDraft {
  return {
    categoryId: '',
    operationalReasonId: '',
    note: '',
  };
}

function emptyTicketPrioritySeverityDraft(): TicketPrioritySeverityDraft {
  return {
    priority: 'normal',
    severity: 'medium',
    operationalReasonId: '',
    note: '',
  };
}

function emptyCustomerRecentTicketsWindow(): SupportCustomerRecentTicketsWindow {
  return {
    tickets: [],
    totalAvailableCount: 0,
    recentLimit: 6,
    hasMore: false,
  };
}

function emptyCustomerRecentEventsWindow(): SupportCustomerRecentEventsWindow {
  return {
    events: [],
    totalAvailableCount: 0,
    recentLimit: 8,
    hasMore: false,
  };
}

function emptyTicketKnowledgeLinks(): SupportTicketKnowledgeLink[] {
  return [];
}

function emptyKnowledgeArticlePicker(): SupportKnowledgeArticlePickerItem[] {
  return [];
}

function emptyTicketAttachments(): SupportTicketAttachment[] {
  return [];
}

function emptyTicketEngineeringLinks(): SupportTicketEngineeringLink[] {
  return [];
}

function emptyEngineeringHandoffDraft(): EngineeringHandoffDraft {
  return {
    workItemType: 'investigation',
    title: '',
    description: '',
    handoffNote: '',
    impactSummary: '',
    reproductionSteps: '',
    expectedResult: '',
    currentResult: '',
    relatedEvidence: '',
    technicalUrgency: 'high',
  };
}

function emptyInternalActionCreateDraft(): InternalActionCreateDraft {
  return {
    targetArea: '',
    supportType: 'analysis',
    priority: 'normal',
    summary: '',
    context: '',
    evidenceAttachmentIds: [],
  };
}

function emptyAttachmentUploadDraft(): TicketAttachmentUploadDraft {
  return {
    files: [],
    note: '',
    errors: {},
  };
}

function buildStatusChoices(
  currentStatus: TicketStatus,
  allowedNextStatuses: TicketStatus[] = [],
): TicketStatusUpdateTarget[] {
  const backendAllowed = allowedNextStatuses.length > 0 ? allowedNextStatuses : TICKET_STATUSES;
  const choices: TicketStatusUpdateTarget[] = [];

  for (const status of backendAllowed) {
    if (status !== 'closed' && status !== currentStatus) {
      choices.push(status);
    }
  }

  return choices;
}

function requiresOperationalReasonForStatus(status: TicketStatusUpdateTarget) {
  return (
    status === 'waiting_customer' ||
    status === 'waiting_engineering' ||
    status === 'resolved' ||
    status === 'cancelled'
  );
}

function friendlyTicketStatusErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('invalid ticket status transition') ||
    normalized.includes('status transition')
  ) {
    return 'Não foi possível alterar o status. Verifique a etapa atual do ticket e tente novamente.';
  }

  return message;
}

function summarizeTimelineEvent(entry: SupportTicketTimelineItem) {
  if (entry.entryType === 'message') {
    return sanitizeSupportVisibleText(entry.body ?? '');
  }

  const previousStatus = readTimelineMetadataString(entry, 'previous_status', 'previousStatus');
  const nextStatus = readTimelineMetadataString(entry, 'new_status', 'newStatus', 'status');
  const assignedToUserId = readTimelineMetadataString(entry, 'assigned_to_user_id');
  const note = readTimelineMetadataString(entry, 'note');
  const operationalReasonName = readTimelineMetadataString(
    entry,
    'operational_reason_name',
    'operationalReasonName',
  );

  if (
    (entry.eventType === 'status_changed' ||
      entry.eventType === 'resolved' ||
      entry.eventType === 'closed' ||
      entry.eventType === 'cancelled' ||
      entry.eventType === 'reopened') &&
    nextStatus
  ) {
    const summary = previousStatus
      ? `Status alterado de ${humanizeStatus(previousStatus as TicketStatus)} para ${humanizeStatus(nextStatus as TicketStatus)}.`
      : `Status movido para ${humanizeStatus(nextStatus as TicketStatus)}.`;

    if (operationalReasonName) {
      return `${summary} Motivo: ${operationalReasonName}.`;
    }

    return summary;
  }

  if (entry.eventType === 'escalated_to_engineering') {
    const workItemType = readTimelineMetadataString(entry, 'work_item_type');
    return workItemType
      ? `Handoff técnico aberto como ${humanizeEngineeringWorkItemType(workItemType as EngineeringWorkItemType)}.`
      : 'Handoff técnico registrado para a equipe de engenharia.';
  }

  if (entry.eventType === 'linked_to_work_item') {
    const workItemStatus = readTimelineMetadataString(entry, 'work_item_status');
    return workItemStatus
      ? `Ticket vinculado a uma demanda técnica em ${humanizeEngineeringWorkItemStatus(workItemStatus as SupportTicketEngineeringLink['workItemStatus'])}.`
      : 'Ticket vinculado a uma demanda técnica existente.';
  }

  if (
    (entry.eventType as string) === 'engineering_update_added' ||
    (entry.eventType as string) === 'engineering_status_updated' ||
    (entry.eventType as string) === 'work_item_update_added'
  ) {
    const summary = readTimelineMetadataString(entry, 'summary');
    const nextStep = readTimelineMetadataString(entry, 'next_step');

    if (summary && nextStep) {
      return sanitizeSupportVisibleText(`${summary} Próximo passo: ${nextStep}`);
    }

    return summary
      ? sanitizeSupportVisibleText(summary)
      : 'Retorno técnico registrado para apoiar a tratativa.';
  }

  if (entry.eventType === 'attachment_added') {
    const attachmentName = readTimelineMetadataString(entry, 'attachment_name');
    const attachmentSize = readTimelineMetadataString(entry, 'attachment_size_label');
    return attachmentName
      ? `Evidência registrada: ${attachmentName}${attachmentSize ? ` · ${attachmentSize}` : ''}.`
      : 'Evidência registrada no ticket.';
  }

  if (entry.eventType === 'assigned') {
    if (entry.actorFullName) {
      return `${entry.actorFullName} atualizou a responsavel do ticket.`;
    }

    if (assignedToUserId) {
      return 'Responsavel do ticket atualizado.';
    }
  }

  if (entry.eventType === 'ticket_created') {
    return 'Ticket aberto na fila de atendimento.';
  }

  if (entry.eventType === 'message_added') {
    return 'Mensagem registrada no ticket.';
  }

  if (entry.eventType === 'internal_note_added') {
    return 'Nota interna registrada na tratativa.';
  }

  if (entry.eventType === 'resolved') {
    return 'Ticket marcado como resolvido.';
  }

  if (entry.eventType === 'cancelled') {
    return 'Ticket cancelado.';
  }

  if (note) {
    return sanitizeSupportVisibleText(note);
  }

  return sanitizeSupportVisibleText(humanizeTicketEventLabel(entry.eventType));
}

type ConversationLane = 'customer' | 'agent' | 'internal';

type ConversationAttachment = {
  name: string;
  sizeLabel: string | null;
};

function readTimelineMetadata(entry: SupportTicketTimelineItem) {
  if (!entry.metadata || typeof entry.metadata !== 'object' || Array.isArray(entry.metadata)) {
    return null;
  }

  return entry.metadata;
}

function readTimelineMetadataString(
  entry: SupportTicketTimelineItem,
  ...keys: string[]
) {
  const metadata = readTimelineMetadata(entry);
  if (!metadata) {
    return null;
  }

  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function resolveConversationLane(
  entry: SupportTicketTimelineItem,
  requesterName?: string | null,
): ConversationLane {
  const metadataLane = readTimelineMetadataString(
    entry,
    'conversation_lane',
    'conversationLane',
    'lane',
  );

  if (metadataLane === 'customer' || metadataLane === 'agent' || metadataLane === 'internal') {
    return metadataLane;
  }

  if (entry.visibility === 'internal') {
    return 'internal';
  }

  const actorName = `${entry.actorFullName ?? ''} ${entry.actorEmail ?? ''}`.toLowerCase();
  const requesterToken = String(requesterName ?? '').trim().toLowerCase();
  if (requesterToken && actorName.includes(requesterToken)) {
    return 'customer';
  }

  return entry.actorUserId ? 'agent' : 'customer';
}

function resolveConversationAuthor(
  entry: SupportTicketTimelineItem,
  requesterName?: string | null,
) {
  const metadataAuthor = readTimelineMetadataString(
    entry,
    'conversation_author',
    'conversationAuthor',
    'author_label',
  );

  if (metadataAuthor) {
    return metadataAuthor;
  }

  if (entry.visibility === 'internal') {
    return entry.actorFullName ?? entry.actorEmail ?? 'Equipe interna';
  }

  if (entry.actorUserId) {
    return entry.actorFullName ?? entry.actorEmail ?? 'Agente Genius';
  }

  return entry.actorFullName ?? entry.actorEmail ?? requesterName ?? 'Cliente';
}

function resolveConversationAttachment(
  entry: SupportTicketTimelineItem,
): ConversationAttachment | null {
  const attachmentName = readTimelineMetadataString(
    entry,
    'attachment_name',
    'attachmentName',
    'attachment_label',
  );

  if (!attachmentName) {
    return null;
  }

  const sizeLabel =
    readTimelineMetadataString(entry, 'attachment_size_label', 'attachmentSizeLabel') ??
    (() => {
      const metadata = readTimelineMetadata(entry);
      if (!metadata) {
        return null;
      }

      const sizeKb = metadata.attachment_size_kb ?? metadata.attachmentSizeKb;
      if (typeof sizeKb === 'number' && Number.isFinite(sizeKb)) {
        return `${sizeKb} KB`;
      }

      return null;
    })();

  return {
    name: attachmentName,
    sizeLabel,
  };
}

function buildConversationDividerLabel(entries: SupportTicketTimelineItem[]) {
  if (entries.length === 0) {
    return null;
  }

  const latest = new Date(entries[entries.length - 1].occurredAt);
  const now = new Date();
  const sameDay =
    latest.getFullYear() === now.getFullYear() &&
    latest.getMonth() === now.getMonth() &&
    latest.getDate() === now.getDate();

  if (sameDay) {
    return 'Hoje';
  }

  return latest.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function shouldHideConversationEvent(entry: SupportTicketTimelineItem) {
  if (entry.entryType !== 'event') {
    return false;
  }

  const haystack = `${entry.eventType ?? ''} ${summarizeTimelineEvent(entry)}`
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  return (
    haystack.includes('mensagem registrada') ||
    haystack.includes('nota interna registrada') ||
    haystack.includes('evidencia registrada') ||
    haystack.includes('anexo registrado')
  );
}

function ConversationEntry({
  entry,
  requesterName,
}: {
  entry: SupportTicketTimelineItem;
  requesterName?: string | null;
}) {
  const summary = summarizeTimelineEvent(entry);
  const lane = resolveConversationLane(entry, requesterName);
  const author = resolveConversationAuthor(entry, requesterName);
  const attachment = resolveConversationAttachment(entry);
  const label =
    lane === 'internal'
      ? 'Nota interna'
      : lane === 'agent'
        ? 'Agente'
        : 'Cliente';
  const timestamp = formatDateTime(entry.occurredAt);
  if (lane === 'internal') {
    return (
      <SupportInternalNote timestamp={timestamp}>
        {summary}
      </SupportInternalNote>
    );
  }

  return (
    <SupportConversationMessage
      author={author}
      avatar={
        <Avatar
          email={entry.actorEmail}
          fallbackMascot
          label={`Avatar de ${author}`}
          name={author}
          size="md"
          className={cx(
            'border text-[12px] font-semibold',
            lane === 'agent'
              ? 'border-[rgba(240,74,174,0.22)] bg-[rgba(240,74,174,0.08)] text-[color:var(--color-brand-pink)]'
              : 'border-[rgba(47,107,255,0.14)] bg-[rgba(47,107,255,0.08)] text-[color:var(--color-brand-blue)]',
          )}
        />
      }
      attachment={
        attachment ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-[color:var(--color-support-border)] bg-[color:var(--color-surface-strong)]/92 px-3 py-2 text-[11px]">
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[9px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-brand-blue)]">
                <SupportSurfaceIcon className="h-[12px] w-[12px]" kind="attachment" />
              </span>
              <p className="truncate font-medium text-[color:var(--color-ink)]">
                {attachment.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {attachment.sizeLabel ? (
                <span className="shrink-0 text-[10px] text-[color:var(--color-muted)]">
                  {attachment.sizeLabel}
                </span>
              ) : null}
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-muted)]">
                <SupportSurfaceIcon className="h-[11px] w-[11px]" kind="open" />
              </span>
            </div>
          </div>
        ) : null
      }
      lane={lane === 'agent' ? 'agent' : 'customer'}
      meta={
        <>
          <span className="text-[color:var(--color-muted)]">•</span>
          <span className="text-[color:var(--color-muted)]">{label}</span>
          <span className="text-[color:var(--color-muted)]">·</span>
          <span className="text-[color:var(--color-muted)]">
            {entry.communicationChannelLabel ?? 'Canal indisponível'}
          </span>
          {entry.deliveryStatusLabel ? (
            <>
              <span className="text-[color:var(--color-muted)]">·</span>
              <span className="text-[color:var(--color-muted)]">
                {entry.deliveryStatusLabel}
              </span>
            </>
          ) : null}
          <span className="text-[color:var(--color-muted)]">{timestamp}</span>
        </>
      }
    >
      {summary}
    </SupportConversationMessage>
  );
}

function TechnicalTimelineRow({
  entry,
}: {
  entry: SupportTicketTimelineItem;
}) {
  const summary = summarizeTimelineEvent(entry);

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={entry.visibility === 'internal' ? 'critical' : 'default'}>
            {entry.eventType ? humanizeToken(entry.eventType) : 'evento'}
          </StatusPill>
          <StatusPill tone={entry.isCustomerVisible ? 'accent' : 'default'}>
            {entry.communicationDirection === 'system'
              ? 'Sistema'
              : entry.communicationChannelLabel ?? 'Canal indisponível'}
          </StatusPill>
          <p className="text-xs text-[color:var(--color-muted)]">
                    {entry.actorFullName ?? entry.actorEmail ?? 'Autor não identificado'}
          </p>
        </div>
        <p className="text-sm leading-6 text-[color:var(--color-ink)]">{summary}</p>
      </div>
      <p className="text-xs text-[color:var(--color-muted)]">{formatDateTime(entry.occurredAt)}</p>
    </div>
  );
}

function ConversationEventEntry({
  entry,
}: {
  entry: SupportTicketTimelineItem;
}) {
  return (
    <SupportSystemEvent
      icon={<SupportSurfaceIcon className="h-[10px] w-[10px]" kind="ticket" />}
      label={`${humanizeTicketEventLabel(entry.eventType)} · ${entry.communicationChannelLabel ?? 'Canal indisponível'}`}
      summary={summarizeTimelineEvent(entry)}
      timestamp={formatDateTime(entry.occurredAt)}
    />
  );
}

function SupportConversation({
  window,
  requesterName,
  loadingMore = false,
  onLoadMore,
}: {
  window: SupportTicketTimelineRecentWindow;
  requesterName?: string | null;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const entries = window.entries.filter((entry) => !shouldHideConversationEvent(entry));
  const conversationEntries = entries.filter((entry) => entry.entryType === 'message');
  const eventEntries = entries.filter((entry) => entry.entryType === 'event');
  const dividerLabel = buildConversationDividerLabel(conversationEntries);

  if (conversationEntries.length === 0 && eventEntries.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center px-4 py-10 text-center">
        <div className="max-w-sm">
          <h3 className="text-sm font-medium text-[color:var(--minimal-text)]">Conversa vazia</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--minimal-text-secondary)]">
            Este ticket ainda não recebeu mensagens, notas internas nem eventos adicionais.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dividerLabel ? (
        <div className="flex items-center justify-center">
          <span className="rounded-full border border-[color:var(--color-support-border)] bg-[color:var(--color-support-surface)] px-2.5 py-1 text-[9.5px] font-semibold text-[color:var(--color-muted)]">
            {dividerLabel}
          </span>
        </div>
      ) : null}
      <div className="space-y-3">
        {entries.map((entry) =>
          entry.entryType === 'message' ? (
            <ConversationEntry
              entry={entry}
              key={entry.timelineEntryId}
              requesterName={requesterName}
            />
          ) : (
            <ConversationEventEntry entry={entry} key={entry.timelineEntryId} />
          ),
        )}
      </div>

      {window.hasMore ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-dashed border-[color:var(--color-support-border)] bg-[color:var(--color-support-surface)] px-4 py-3">
          <p className="text-xs leading-5 text-[color:var(--color-muted)]">
            Há histórico anterior disponível para consulta.
          </p>
          {onLoadMore ? (
            <GhostButton disabled={loadingMore} onClick={onLoadMore} type="button">
              {loadingMore ? 'Carregando histórico' : 'Carregar histórico anterior'}
            </GhostButton>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SupportTechnicalHistory({
  window,
}: {
  window: SupportTicketTimelineRecentWindow;
}) {
  const eventEntries = window.entries.filter((entry) => entry.entryType === 'event');

  if (eventEntries.length === 0) {
    return (
      <p className="text-sm leading-6 text-[color:var(--color-muted)]">
        Nenhum registro adicional apareceu fora da conversa principal.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs leading-5 text-[color:var(--color-muted)]">
        Mostrando {eventEntries.length} registro(s) de apoio dentro de {window.totalAvailableCount} itens recentes.
      </p>
      {eventEntries.map((entry) => (
        <TechnicalTimelineRow key={entry.timelineEntryId} entry={entry} />
      ))}
    </div>
  );
}

function SupportQueueItem({
  ticket,
  isSelected,
  isBulkSelected,
  onSelect,
  onToggleBulk,
}: {
  ticket: SupportTicketQueueItem;
  isSelected: boolean;
  isBulkSelected: boolean;
  onSelect: () => void;
  onToggleBulk: () => void;
}) {
  const slaTone =
    ticket.slaStatus === 'breached'
      ? 'critical'
      : ticket.slaStatus === 'at_risk'
        ? 'warning'
        : 'default';
  const assigneeLabel = ticket.assignedToFullName ?? 'Sem responsável';
  const slaLabel = ticket.slaStatusLabel ?? 'Indisponível';

  return (
    <article
      className={cx(
        'grid min-h-[84px] cursor-pointer grid-cols-[44px_minmax(0,1fr)_96px] items-center gap-3 border-b border-[color:var(--minimal-border)] px-3 py-3 text-left transition-colors duration-150 lg:min-h-[76px] lg:grid-cols-[28px_minmax(220px,1.45fr)_minmax(150px,0.8fr)_minmax(130px,0.65fr)_minmax(150px,0.75fr)_120px] lg:gap-4 lg:px-4',
        'focus-within:ring-2 focus-within:ring-inset focus-within:ring-[color:var(--minimal-focus)]',
        isSelected
          ? 'bg-[color:var(--minimal-selection)]'
          : 'bg-[color:var(--minimal-surface)] hover:bg-[color:var(--minimal-surface-muted)]',
        isBulkSelected && 'bg-[color:var(--minimal-selection)]',
      )}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <button
        aria-label={`${isBulkSelected ? 'Remover' : 'Selecionar'} ${supportTicketCode(ticket.id)} para ação em massa`}
        aria-pressed={isBulkSelected}
        className={cx(
          'inline-flex h-10 w-10 items-center justify-center rounded border text-[10px] lg:h-4 lg:w-4',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]',
          isBulkSelected
            ? 'border-[color:var(--minimal-action)] bg-[color:var(--minimal-action)] text-[color:var(--minimal-action-ink)]'
            : 'border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] text-transparent',
        )}
        onClick={(event) => {
          event.stopPropagation();
          onToggleBulk();
        }}
        type="button"
      >
        {isBulkSelected ? '✓' : ''}
      </button>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[color:var(--minimal-text-tertiary)]">
            {supportTicketCode(ticket.id)}
          </span>
          <span className="text-[11px] text-[color:var(--minimal-text-tertiary)]">
            {formatSupportShortTime(ticket.createdAt ?? ticket.updatedAt)}
          </span>
        </div>
        <h3 className="mt-1 truncate text-sm font-medium text-[color:var(--minimal-text)]">
          {sanitizeSupportVisibleText(ticket.title)}
        </h3>
        <p className="mt-1 truncate text-xs text-[color:var(--minimal-text-secondary)]">
          {ticket.categoryName ?? 'Sem categoria'} · {ticket.channelLabel ?? 'Canal indisponível'}
        </p>
        <p className="mt-1 truncate text-xs text-[color:var(--minimal-text-tertiary)] lg:hidden">
          {compactTicketStatusLabel(ticket.status)} · {humanizePriority(ticket.priority)}
        </p>
      </div>

      <div className="hidden min-w-0 lg:block">
        <p className="truncate text-sm text-[color:var(--minimal-text)]">
          {ticketTenantLabel(ticket)}
        </p>
        <p className="mt-1 truncate text-xs text-[color:var(--minimal-text-tertiary)]">
          {sanitizeSupportVisibleText(ticket.requesterContactFullName)}
        </p>
      </div>

      <div className="hidden min-w-0 lg:block">
        <p className="text-sm text-[color:var(--minimal-text)]">
          {compactTicketStatusLabel(ticket.status)}
        </p>
        <p className="mt-1 text-xs text-[color:var(--minimal-text-tertiary)]">
          {humanizePriority(ticket.priority)}
        </p>
      </div>

      <div className="hidden min-w-0 lg:block">
        <p className="truncate text-sm text-[color:var(--minimal-text)]">{assigneeLabel}</p>
        <p className="mt-1 text-xs text-[color:var(--minimal-text-tertiary)]">
          {ticket.assignedToFullName ? 'Operação CX' : 'Precisa de dono'}
        </p>
      </div>

      <div
        className={cx(
          'min-w-0 text-right',
          slaTone === 'critical' && 'text-[color:var(--minimal-danger-text)]',
          slaTone === 'warning' && 'text-[color:var(--minimal-warning-text)]',
          slaTone === 'default' && 'text-[color:var(--minimal-text-secondary)]',
        )}
      >
        <p className="truncate text-sm font-medium">{slaLabel}</p>
        <p className="mt-1 text-xs">
          {ticket.slaStatus === 'breached' ? 'Vencido' : 'Dentro do prazo'}
        </p>
      </div>
    </article>
  );
}

function SupportTicketInboxItem({
  ticket,
  isSelected,
  onSelect,
}: {
  ticket: SupportTicketQueueItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={cx(
        'block w-full rounded-md border px-3 py-2.5 text-left transition-colors',
        isSelected
          ? 'border-[color:var(--minimal-action)] bg-[color:var(--minimal-selection)]'
          : 'border-transparent bg-transparent hover:bg-[color:var(--minimal-surface-muted)]',
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-center justify-between gap-2 text-[11px] text-[color:var(--minimal-text-tertiary)]">
        <span>{supportTicketCode(ticket.id)}</span>
        <span>{formatSupportShortTime(ticket.lastMessageAt ?? ticket.updatedAt)}</span>
      </div>
      <p className="mt-1 truncate text-sm font-medium text-[color:var(--minimal-text)]">{sanitizeSupportVisibleText(ticket.title)}</p>
      <p className="mt-1 truncate text-xs text-[color:var(--minimal-text-secondary)]">
        {ticketTenantLabel(ticket)}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[color:var(--minimal-text-tertiary)]">
        <span>{compactTicketStatusLabel(ticket.status)}</span>
        <span
          className={cx(
            ticket.slaStatus === 'breached' && 'text-[color:var(--minimal-danger-text)]',
            ticket.slaStatus === 'at_risk' && 'text-[color:var(--minimal-warning-text)]',
          )}
        >
          {ticket.slaStatusLabel ?? 'SLA indisponível'}
        </span>
      </div>
    </button>
  );
}

function SupportCustomerRail({
  accountContext,
  customer,
  recentTicketsWindow,
  recentEventsWindow,
  compact = false,
}: {
  accountContext: SupportCustomerAccountContext | null;
  customer: SupportCustomer360 | null;
  recentTicketsWindow: SupportCustomerRecentTicketsWindow;
  recentEventsWindow: SupportCustomerRecentEventsWindow;
  compact?: boolean;
}) {
  if (!customer) {
    return (
        <EmptyState
                    title="Contexto do cliente indisponível"
            description="O contexto deste cliente ainda não ficou disponível para a tratativa."
        />
    );
  }

  const contacts = customer.activeContacts.slice(0, compact ? 2 : 4);
  const recentTickets = recentTicketsWindow.tickets.slice(0, compact ? 3 : recentTicketsWindow.tickets.length);
  const recentEvents = recentEventsWindow.events.slice(0, compact ? 2 : recentEventsWindow.events.length);
  const primaryContact = primaryContactFromCustomer(customer);

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill>{humanizeTenantStatus(customer.tenantStatus)}</StatusPill>
            </div>
            <h3 className="text-base font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
              {displaySupportCustomerName(customer)}
            </h3>
            <p className="text-sm leading-6 text-[color:var(--color-muted)]">
              {customer.activeContactsCount} contatos ativos · {customer.openTicketCount} tickets abertos
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--color-border)] px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-blue)]"
            to={`/support/customers/${customer.tenantId}`}
          >
            Abrir cliente
          </Link>
        </div>

        <SupportAccountContextCompact accountContext={accountContext} customer={customer} />

        <details className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-[color:var(--color-ink)]">
            Atividade recente e contato
          </summary>
          <div className="mt-3 space-y-3">
            {primaryContact ? (
              <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[color:var(--color-ink)]">{sanitizeSupportVisibleText(primaryContact.fullName)}</p>
                  {primaryContact.isPrimary ? <StatusPill tone="accent">principal</StatusPill> : null}
                </div>
                <p className="mt-1 text-sm text-[color:var(--color-muted)]">{primaryContact.email}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Tickets recentes
              </p>
              {recentTickets.length === 0 ? (
                  <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                    Nenhum ticket recente apareceu por aqui.
                  </p>
              ) : (
                <div className="space-y-2">
                  {recentTickets.map((ticket) => (
                    <SupportRecentTicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Eventos recentes
              </p>
              {recentEvents.length === 0 ? (
                  <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                    Nenhum evento recente apareceu por aqui.
                  </p>
              ) : (
                recentEvents.map((event, index) => (
                  <SupportRecentEventCard
                    event={event}
                    key={buildSupportCustomerRecentEventKey(event, index)}
                  />
                ))
              )}
            </div>
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill>{humanizeTenantStatus(customer.tenantStatus)}</StatusPill>
            </div>
            <h3 className="text-base font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
              {displaySupportCustomerName(customer)}
            </h3>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[color:var(--color-border)] px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-blue)]"
            to={`/support/customers/${customer.tenantId}`}
          >
            Ver contexto
          </Link>
        </div>
        <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
                  {customer.tenantLegalName ?? 'Razão social não identificada'}
        </p>
      </div>

      <div className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-4">
        <SupportAccountContextCompact accountContext={accountContext} customer={customer} />
      </div>

      <div className="space-y-2 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-4">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-[color:var(--color-ink)]">Tickets recentes</h4>
            <p className="text-xs leading-5 text-[color:var(--color-muted)]">
              Mostrando {recentTickets.length} de {recentTicketsWindow.totalAvailableCount} tickets recentes.
            </p>
        </div>
        {recentTickets.length === 0 ? (
          <p className="text-sm leading-6 text-[color:var(--color-muted)]">
            Nenhum ticket recente apareceu por aqui.
          </p>
        ) : (
          recentTickets.map((ticket) => <SupportRecentTicketCard key={ticket.id} ticket={ticket} />)
        )}
      </div>

      <details className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-4">
        <summary className="cursor-pointer text-sm font-semibold text-[color:var(--color-ink)]">
          Contatos e eventos recentes
        </summary>
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[color:var(--color-ink)]">Contatos ativos</h4>
            {contacts.length === 0 ? (
              <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                Nenhum contato ativo disponível no momento.
              </p>
            ) : (
              contacts.map((contact) => <SupportContactCard key={contact.id} contact={contact} />)
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs leading-5 text-[color:var(--color-muted)]">
              Mostrando {recentEvents.length} de {recentEventsWindow.totalAvailableCount} registros recentes.
            </p>
            {recentEvents.length === 0 ? (
              <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                Nenhum evento recente apareceu por aqui.
              </p>
            ) : (
              recentEvents.map((event, index) => (
                <SupportRecentEventCard
                  key={buildSupportCustomerRecentEventKey(event, index)}
                  event={event}
                />
              ))
            )}
          </div>
        </div>
      </details>
    </div>
  );
}

function SupportContactCard({
  contact,
}: {
  contact: SupportCustomer360Contact;
}) {
  return (
    <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-[color:var(--color-ink)]">{sanitizeSupportVisibleText(contact.fullName)}</p>
        {contact.isPrimary ? <StatusPill tone="accent">principal</StatusPill> : null}
      </div>
      <p className="mt-1 text-sm text-[color:var(--color-muted)]">{contact.email}</p>
    </div>
  );
}

function SupportRecentTicketCard({
  ticket,
}: {
  ticket: SupportCustomer360RecentTicket;
}) {
  return (
    <Link
      className="block rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 transition hover:bg-[color:var(--color-surface-strong)]"
      to={`/support/tickets/${ticket.id}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusPill tone={toneForTicketStatus(ticket.status)}>{humanizeStatus(ticket.status)}</StatusPill>
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                            {humanizePriority(ticket.priority)}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 font-medium text-[color:var(--color-ink)]">{sanitizeSupportVisibleText(ticket.title)}</p>
      <p className="mt-1 text-xs text-[color:var(--color-muted)]">
        Atualizado em {formatDateTime(ticket.updatedAt)}
      </p>
    </Link>
  );
}

function SupportRecentEventCard({
  event,
}: {
  event: SupportCustomer360RecentEvent;
}) {
  return (
    <Link
      className="block rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 transition hover:bg-[color:var(--color-surface-strong)]"
      to={`/support/tickets/${event.ticketId}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusPill tone={event.visibility === 'internal' ? 'critical' : 'accent'}>{humanizeVisibility(event.visibility)}</StatusPill>
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
          {humanizeToken(event.eventType)}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 font-medium text-[color:var(--color-ink)]">{event.ticketTitle}</p>
      <p className="mt-1 text-xs text-[color:var(--color-muted)]">
        {formatDateTime(event.occurredAt)}
      </p>
    </Link>
  );
}

function isOperationsQueueTicket(ticket: SupportTicketQueueItem) {
  const candidate = `${ticket.categorySlug ?? ''} ${ticket.categoryName ?? ''}`.toLocaleLowerCase('pt-BR');
  return (
    candidate.includes('opera') ||
    candidate.includes('support') ||
    candidate.includes('suporte')
  );
}

function ticketMatchesInboxScope(
  ticket: SupportTicketQueueItem,
  scope: TicketInboxScope,
) {
  if (scope === 'open') {
    return (
      ticket.status === 'new' ||
      ticket.status === 'triage' ||
      ticket.status === 'waiting_customer' ||
      ticket.status === 'waiting_support' ||
      ticket.status === 'waiting_engineering' ||
      ticket.status === 'in_progress'
    );
  }

  return (
    ticket.status === 'resolved' ||
    ticket.status === 'closed' ||
    ticket.status === 'cancelled'
  );
}

function ticketMatchesInboxFilter(
  ticket: SupportTicketQueueItem,
  filter: TicketInboxFilter,
) {
  switch (filter) {
    case 'in_progress':
      return ticket.status === 'in_progress';
    case 'awaiting':
      return (
        ticket.isWaitingCustomer ||
        ticket.isWaitingEngineering ||
        ticket.status === 'waiting_customer' ||
        ticket.status === 'waiting_engineering'
      );
    case 'urgent':
      return (
        ticket.priority === 'urgent' ||
        ticket.severity === 'critical' ||
        ticket.slaStatus === 'at_risk' ||
        ticket.slaStatus === 'breached'
      );
    case 'operations':
      return isOperationsQueueTicket(ticket);
    case 'engineering':
      return ticket.isWaitingEngineering;
    case 'resolved':
      return ticket.status === 'resolved';
    case 'closed':
      return ticket.status === 'closed';
    case 'cancelled':
      return ticket.status === 'cancelled';
    case 'all_closed':
    case 'all':
    default:
      return true;
  }
}

function primaryPlatformFromContext(accountContext: SupportCustomerAccountContext | null) {
  return (
    accountContext?.integrations.find(
      (integration) => integration.integrationType === 'ecommerce_platform',
    ) ?? null
  );
}

function visibleOperationalIntegrations(accountContext: SupportCustomerAccountContext | null, limit: number) {
  if (!accountContext) {
    return [];
  }

  return accountContext.integrations
    .filter((integration) => integration.integrationType !== 'ecommerce_platform')
    .slice(0, limit);
}

function visibleRiskCustomizations(accountContext: SupportCustomerAccountContext | null, limit: number) {
  if (!accountContext) {
    return [];
  }

  return accountContext.activeCustomizations
    .filter((customization) => customization.riskLevel === 'high' || customization.riskLevel === 'critical')
    .slice(0, limit);
}

function visibleFeatureSlice(accountContext: SupportCustomerAccountContext | null, limit: number) {
  if (!accountContext) {
    return [];
  }

  return accountContext.enabledFeatures.slice(0, limit);
}

function visibleAlertSlice(accountContext: SupportCustomerAccountContext | null, limit: number) {
  if (!accountContext) {
    return [];
  }

  return accountContext.activeAlerts.slice(0, limit);
}

function SupportAccountContextCompact({
  accountContext,
  customer,
}: {
  accountContext: SupportCustomerAccountContext | null;
  customer: SupportCustomer360;
}) {
  if (!accountContext || !accountContext.profileId) {
    return (
      <InlineNotice tone="warning">
                Perfil operacional ainda não cadastrado para este cliente. O suporte segue com contatos e tickets recentes, mas sem contexto enriquecido.
      </InlineNotice>
    );
  }

  const primaryPlatform = primaryPlatformFromContext(accountContext);
  const integrations = visibleOperationalIntegrations(accountContext, 3);
  const features = visibleFeatureSlice(accountContext, 4);
  const alerts = visibleAlertSlice(accountContext, 2);
  const riskyCustomizations = visibleRiskCustomizations(accountContext, 2);
  const primaryContact = primaryContactFromCustomer(customer);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {accountContext.productLine ? (
          <StatusPill tone="accent">{humanizeCustomerValue(accountContext.productLine)}</StatusPill>
        ) : null}
        {accountContext.operationalStatus ? (
          <StatusPill tone={accountContext.operationalStatus === 'active' ? 'positive' : 'warning'}>
            {humanizeCustomerValue(accountContext.operationalStatus)}
          </StatusPill>
        ) : null}
        {accountContext.accountTier ? (
          <StatusPill>{humanizeCustomerValue(accountContext.accountTier)}</StatusPill>
        ) : null}
      </div>

      <div className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4">
        <dl className="grid gap-3 text-sm leading-6 text-[color:var(--color-muted)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <dt className="font-medium text-[color:var(--color-ink)]">Plataforma</dt>
            <dd className="text-right">
                {primaryPlatform ? primaryPlatform.provider : 'Indisponível'}
            </dd>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3 border-t border-[color:var(--color-border)] pt-3">
            <dt className="font-medium text-[color:var(--color-ink)]">Integrações</dt>
            <dd className="text-right">
              {integrations.length > 0
                ? integrations.map((integration) => integration.provider).join(' · ')
                : 'Indisponível'}
            </dd>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3 border-t border-[color:var(--color-border)] pt-3">
            <dt className="font-medium text-[color:var(--color-ink)]">Contato operacional</dt>
            <dd className="text-right">
                {primaryContact ? `${sanitizeSupportVisibleText(primaryContact.fullName)} · ${primaryContact.email}` : 'Indisponível'}
            </dd>
          </div>
        </dl>
      </div>

      {alerts.length > 0 ? (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <InlineNotice key={alert.id} tone={toneForAlertSeverity(alert.severity)}>
              <span className="font-semibold">{alert.title}</span>
              {`: ${alert.description}`}
            </InlineNotice>
          ))}
        </div>
      ) : null}

      {features.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
            Recursos ativos
          </p>
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <StatusPill key={feature.featureKey}>{humanizeCustomerValue(feature.featureKey)}</StatusPill>
            ))}
          </div>
        </div>
      ) : null}

      {riskyCustomizations.length > 0 ? (
        <div className="space-y-2 rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
            Customizações com risco
          </p>
          <div className="space-y-2">
            {riskyCustomizations.map((customization) => (
              <div key={customization.id} className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-[color:var(--color-ink)]">
                    {customization.title}
                  </p>
                  <StatusPill tone={toneForCustomizationRisk(customization.riskLevel)}>
                    {humanizeCustomerValue(customization.riskLevel)}
                  </StatusPill>
                </div>
                <p className="line-clamp-3 text-sm leading-6 text-[color:var(--color-muted)]">
                  {customization.operationalNote ?? customization.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <details className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-[color:var(--color-ink)]">
          Detalhes operacionais recolhidos
        </summary>
        <div className="mt-3 space-y-3">
          {accountContext.integrations.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Integrações registradas
              </p>
              <div className="space-y-2">
                {accountContext.integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="rounded-[16px] bg-[color:var(--color-surface)] px-3 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-[color:var(--color-ink)]">
                        {integration.provider}
                      </p>
                      <StatusPill>{humanizeCustomerValue(integration.integrationType)}</StatusPill>
                      <StatusPill tone={integration.status === 'active' ? 'positive' : 'warning'}>
                        {humanizeCustomerValue(integration.status)}
                      </StatusPill>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--color-muted)]">
                      Ambiente: {humanizeCustomerValue(integration.environment)}
                      {integration.notes ? ` · ${integration.notes}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {accountContext.internalNotes ? (
            <div className="space-y-1 rounded-[16px] bg-[color:var(--color-surface)] px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Observação interna
              </p>
              <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                {accountContext.internalNotes}
              </p>
            </div>
          ) : null}
        </div>
      </details>
    </div>
  );
}

function SupportTicketCustomerSnapshot({
  accountContext,
  customer,
}: {
  accountContext: SupportCustomerAccountContext | null;
  customer: SupportCustomer360 | null;
}) {
  if (!customer) {
    return (
      <InlineNotice tone="warning">
                O contexto resumido do cliente ainda não ficou disponível para esta tratativa.
      </InlineNotice>
    );
  }

  const primaryContact = primaryContactFromCustomer(customer);

  if (!accountContext || !accountContext.profileId) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-[color:var(--color-ink)]">
              {displaySupportCustomerName(customer)}
            </p>
            <p className="text-[12px] leading-5 text-[color:var(--color-muted)]">
                {primaryContact ? `${sanitizeSupportVisibleText(primaryContact.fullName)} · ${primaryContact.email}` : 'Contato principal não identificado'}
            </p>
          </div>
          <Link
            className="inline-flex min-h-9 items-center justify-center rounded-full border border-[color:var(--color-border)] px-3 py-1.5 text-[13px] font-semibold text-[color:var(--color-brand-blue)]"
            to={`/support/customers/${customer.tenantId}`}
          >
            Ver detalhes do cliente
          </Link>
        </div>
        <InlineNotice tone="warning">
                Perfil operacional ainda não cadastrado. A tratativa segue com o contato principal e o histórico recente do cliente.
        </InlineNotice>
      </div>
    );
  }

  const primaryPlatform = primaryPlatformFromContext(accountContext);

  return (
    <div className="space-y-1.5">
      <div className="space-y-1">
        <div className="min-w-0 space-y-1">
          <p className="text-[13px] font-semibold text-[color:var(--color-ink)]">
            {displaySupportCustomerName(customer)}
          </p>
          <div className="flex flex-wrap gap-1">
            {accountContext.productLine ? (
              <StatusPill tone="accent">{humanizeCustomerValue(accountContext.productLine)}</StatusPill>
            ) : null}
            {accountContext.operationalStatus ? (
              <StatusPill tone={accountContext.operationalStatus === 'active' ? 'positive' : 'warning'}>
                {humanizeCustomerValue(accountContext.operationalStatus)}
              </StatusPill>
            ) : null}
              {accountContext.accountTier ? (
                <StatusPill>{humanizeCustomerValue(accountContext.accountTier)}</StatusPill>
              ) : null}
          </div>
        </div>
        <Link
          className="inline-flex min-h-7.5 w-full items-center justify-center rounded-full border border-[rgba(48,127,226,0.26)] px-3 py-1.5 text-[11px] font-semibold text-[color:var(--color-brand-blue)]"
          to={`/support/customers/${customer.tenantId}`}
        >
          Ver detalhes do cliente
        </Link>
      </div>

      <div className="rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 py-2">
        <dl className="grid gap-0.5 text-[11px] leading-5 text-[color:var(--color-muted)]">
          <div className="flex items-start justify-between gap-3">
            <dt className="font-medium text-[color:var(--color-ink)]">Plataforma</dt>
            <dd className="text-right">
                {primaryPlatform ? primaryPlatform.provider : 'Não registrada'}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3 border-t border-[color:var(--color-border)] pt-0.5">
            <dt className="font-medium text-[color:var(--color-ink)]">Produto</dt>
            <dd className="text-right">
                {accountContext.productLine ? humanizeCustomerValue(accountContext.productLine) : 'Indisponível'}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3 border-t border-[color:var(--color-border)] pt-0.5">
            <dt className="font-medium text-[color:var(--color-ink)]">Porte / tier</dt>
            <dd className="text-right">
                {accountContext.accountTier
                  ? humanizeCustomerValue(accountContext.accountTier)
                  : 'Indisponível'}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3 border-t border-[color:var(--color-border)] pt-0.5">
            <dt className="font-medium text-[color:var(--color-ink)]">Contato principal</dt>
            <dd className="text-right">
                {sanitizeSupportVisibleText(primaryContact?.fullName)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3 border-t border-[color:var(--color-border)] pt-0.5">
            <dt className="font-medium text-[color:var(--color-ink)]">E-mail</dt>
            <dd className="text-right break-all">
                {primaryContact?.email ?? 'Indisponível'}
            </dd>
          </div>
        </dl>
      </div>

    </div>
  );
}

function SupportAccountContextOverview({
  accountContext,
  customer,
}: {
  accountContext: SupportCustomerAccountContext | null;
  customer: SupportCustomer360;
}) {
  if (!accountContext || !accountContext.profileId) {
    return (
      <InlineNotice tone="warning">
                Este cliente ainda não tem um perfil operacional enriquecido. O suporte pode seguir com contatos e tickets recentes, mas sem contexto consolidado.
      </InlineNotice>
    );
  }

  const primaryPlatform = primaryPlatformFromContext(accountContext);
  const primaryContact = primaryContactFromCustomer(customer);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatusPill tone="accent">{humanizeCustomerValue(accountContext.productLine ?? 'other')}</StatusPill>
        {accountContext.operationalStatus ? (
          <StatusPill tone={accountContext.operationalStatus === 'active' ? 'positive' : 'warning'}>
            {humanizeCustomerValue(accountContext.operationalStatus)}
          </StatusPill>
        ) : null}
        {accountContext.accountTier ? (
          <StatusPill>{humanizeCustomerValue(accountContext.accountTier)}</StatusPill>
        ) : null}
      </div>

      {accountContext.activeAlerts.length > 0 ? (
        <div className="space-y-2">
          {accountContext.activeAlerts.map((alert) => (
            <InlineNotice key={alert.id} tone={toneForAlertSeverity(alert.severity)}>
              <span className="font-semibold">{alert.title}</span>
              {`: ${alert.description}`}
            </InlineNotice>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-4 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Plataforma e ambiente
            </p>
            <p className="text-sm font-medium text-[color:var(--color-ink)]">
                {primaryPlatform ? primaryPlatform.provider : 'Indisponível'}
            </p>
            <p className="text-sm leading-6 text-[color:var(--color-muted)]">
              {primaryPlatform
                ? `Ambiente ${humanizeCustomerValue(primaryPlatform.environment)} · ${humanizeCustomerValue(primaryPlatform.status)}`
                : 'Sem ambiente de e-commerce consolidado no perfil.'}
            </p>
          </div>

          <div className="space-y-2">
            {accountContext.integrations.length === 0 ? (
              <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                Nenhuma integração registrada no perfil.
              </p>
            ) : (
              accountContext.integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[color:var(--color-ink)]">
                      {integration.provider}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill>{humanizeCustomerValue(integration.integrationType)}</StatusPill>
                      <StatusPill tone={integration.status === 'active' ? 'positive' : 'warning'}>
                        {humanizeCustomerValue(integration.status)}
                      </StatusPill>
                    </div>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--color-muted)]">
                    Ambiente {humanizeCustomerValue(integration.environment)}
                    {integration.notes ? ` · ${integration.notes}` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Features, risco e contato
            </p>
            <p className="text-sm leading-6 text-[color:var(--color-muted)]">
              Somente o que altera a resposta operacional do suporte.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {accountContext.enabledFeatures.length === 0 ? (
              <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                Nenhuma feature ativa registrada.
              </p>
            ) : (
              accountContext.enabledFeatures.map((feature) => (
                <StatusPill key={feature.featureKey}>{humanizeCustomerValue(feature.featureKey)}</StatusPill>
              ))
            )}
          </div>

          {accountContext.activeCustomizations.length > 0 ? (
            <div className="space-y-2">
              {accountContext.activeCustomizations.map((customization) => (
                <div
                  key={customization.id}
                  className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[color:var(--color-ink)]">
                      {customization.title}
                    </p>
                    <StatusPill tone={toneForCustomizationRisk(customization.riskLevel)}>
                      {humanizeCustomerValue(customization.riskLevel)}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--color-muted)]">
                    {customization.operationalNote ?? customization.description}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {primaryContact ? (
            <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Contato principal
              </p>
              <p className="mt-1 text-sm font-medium text-[color:var(--color-ink)]">
                {sanitizeSupportVisibleText(primaryContact.fullName)}
              </p>
              <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                {primaryContact.email}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <details className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-4">
        <summary className="cursor-pointer text-sm font-semibold text-[color:var(--color-ink)]">
          Observações internas e flags controladas
        </summary>
        <div className="mt-3 space-y-3">
          {accountContext.internalNotes ? (
            <div className="rounded-[16px] bg-[color:var(--color-surface)] px-3 py-3">
              <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                {accountContext.internalNotes}
              </p>
            </div>
          ) : (
            <p className="text-sm leading-6 text-[color:var(--color-muted)]">
              Nenhuma observação interna controlada registrada.
            </p>
          )}
          <div className="rounded-[16px] bg-[color:var(--color-surface)] px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Flags operacionais
            </p>
            <p className="mt-2 text-xs leading-6 text-[color:var(--color-muted)]">
              {summarizeOperationalFlags(accountContext.operationalFlags)}
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}

function SupportWorkspaceView({
  variant,
  focusTicketId,
}: {
  variant: WorkspaceVariant;
  focusTicketId?: string | null;
}) {
  const navigate = useNavigate();
  const { user, markSessionExpired } = useAuthContext();
  const didBootstrapRef = useRef(false);
  const [backendDenied, setBackendDenied] = useState(false);
  const [phase, setPhase] = useState<PagePhase>('loading');
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicketQueueItem[]>([]);
  const [queueTotalCount, setQueueTotalCount] = useState(0);
  const [queueScopeCounts, setQueueScopeCounts] = useState({ open: 0, closed: 0 });
  const [queueFilterCounts, setQueueFilterCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<QueueFilters>(emptyFilters);
  const [ticketInboxScope, setTicketInboxScope] = useState<TicketInboxScope>('open');
  const [ticketInboxFilter, setTicketInboxFilter] = useState<TicketInboxFilter>('all');
  const [ticketInboxSearch, setTicketInboxSearch] = useState('');
  const [ticketInboxPage, setTicketInboxPage] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(focusTicketId ?? null);
  const [detailPhase, setDetailPhase] = useState<DetailPhase>('idle');
  const [detailMessage, setDetailMessage] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<SupportTicketDetail | null>(null);
  const [timelineWindow, setTimelineWindow] = useState<SupportTicketTimelineRecentWindow>(
    emptyTimelineWindow(),
  );
  const [timelineLoadingMore, setTimelineLoadingMore] = useState(false);
  const [customer, setCustomer] = useState<SupportCustomer360 | null>(null);
  const [customerAccountContext, setCustomerAccountContext] =
    useState<SupportCustomerAccountContext | null>(null);
  const [customerRecentTickets, setCustomerRecentTickets] =
    useState<SupportCustomerRecentTicketsWindow>(emptyCustomerRecentTicketsWindow());
  const [customerRecentEvents, setCustomerRecentEvents] =
    useState<SupportCustomerRecentEventsWindow>(emptyCustomerRecentEventsWindow());
  const [knowledgeLinks, setKnowledgeLinks] =
    useState<SupportTicketKnowledgeLink[]>(emptyTicketKnowledgeLinks());
  const [knowledgeArticlePicker, setKnowledgeArticlePicker] =
    useState<SupportKnowledgeArticlePickerItem[]>(emptyKnowledgeArticlePicker());
  const [attachments, setAttachments] =
    useState<SupportTicketAttachment[]>(emptyTicketAttachments());
  const [attachmentPhase, setAttachmentPhase] = useState<AttachmentPhase>('idle');
  const [attachmentMessage, setAttachmentMessage] = useState<string | null>(null);
  const [attachmentSubmitting, setAttachmentSubmitting] = useState(false);
  const [attachmentDownloadingId, setAttachmentDownloadingId] = useState<Uuid | null>(null);
  const [attachmentUploadDraft, setAttachmentUploadDraft] =
    useState<TicketAttachmentUploadDraft>(emptyAttachmentUploadDraft());
  const [engineeringLinks, setEngineeringLinks] =
    useState<SupportTicketEngineeringLink[]>(emptyTicketEngineeringLinks());
  const [engineeringPhase, setEngineeringPhase] = useState<EngineeringPhase>('idle');
  const [engineeringMessage, setEngineeringMessage] = useState<string | null>(null);
  const [internalActions, setInternalActions] = useState<SupportTicketInternalAction[]>([]);
  const [internalActionsPhase, setInternalActionsPhase] = useState<InternalActionsPhase>('idle');
  const [internalActionsMessage, setInternalActionsMessage] = useState<string | null>(null);
  const [internalActionTargetAreas, setInternalActionTargetAreas] =
    useState<SupportInternalActionTargetArea[]>([]);
  const [internalActionTargetAreasPhase, setInternalActionTargetAreasPhase] =
    useState<InternalActionTargetAreasPhase>('idle');
  const [internalActionTargetAreasMessage, setInternalActionTargetAreasMessage] =
    useState<string | null>(null);
  const [internalActionCreateDraft, setInternalActionCreateDraft] =
    useState<InternalActionCreateDraft>(emptyInternalActionCreateDraft());
  const [selectedInternalActionId, setSelectedInternalActionId] = useState<Uuid | null>(null);
  const [internalActionDetail, setInternalActionDetail] =
    useState<SupportInternalActionDetail | null>(null);
  const [internalActionTimeline, setInternalActionTimeline] =
    useState<SupportInternalActionTimelineEntry[]>([]);
  const [internalActionDetailPhase, setInternalActionDetailPhase] =
    useState<InternalActionDetailPhase>('idle');
  const [internalActionDetailMessage, setInternalActionDetailMessage] =
    useState<string | null>(null);
  const [internalActionSupportNote, setInternalActionSupportNote] = useState('');
  const [internalActionEvidenceAttachmentId, setInternalActionEvidenceAttachmentId] =
    useState<Uuid | ''>('');
  const [internalActionEvidenceNote, setInternalActionEvidenceNote] = useState('');
  const [internalActionSubmitting, setInternalActionSubmitting] = useState(false);
  const [knowledgePhase, setKnowledgePhase] = useState<KnowledgePhase>('idle');
  const [knowledgeMessage, setKnowledgeMessage] = useState<string | null>(null);
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [knowledgeNoteDraft, setKnowledgeNoteDraft] = useState('');
  const [knowledgeSubmitting, setKnowledgeSubmitting] = useState(false);
  const [assignableAgents, setAssignableAgents] = useState<SupportAssignableAgent[]>([]);
  const [agentsPhase, setAgentsPhase] = useState<AgentsPhase>('idle');
  const [agentsMessage, setAgentsMessage] = useState<string | null>(null);
  const [intakePhase, setIntakePhase] = useState<IntakePhase>('idle');
  const [intakeMessage, setIntakeMessage] = useState<string | null>(null);
  const [intakeContactsMessage, setIntakeContactsMessage] = useState<string | null>(null);
  const [intakeContactsLoading, setIntakeContactsLoading] = useState(false);
  const [intakeSubmitting, setIntakeSubmitting] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [intakeTenants, setIntakeTenants] = useState<SupportTicketIntakeTenant[]>([]);
  const [intakeContacts, setIntakeContacts] = useState<SupportTicketIntakeContact[]>([]);
  const [classificationOptions, setClassificationOptions] =
    useState<SupportTicketClassificationOption[]>([]);
  const [classificationOptionsMessage, setClassificationOptionsMessage] = useState<string | null>(null);
  const [intakeDraft, setIntakeDraft] = useState<TicketIntakeDraft>(emptyTicketIntakeDraft());
  const [classificationDraft, setClassificationDraft] =
    useState<TicketClassificationDraft>(emptyTicketClassificationDraft());
  const [prioritySeverityDraft, setPrioritySeverityDraft] =
    useState<TicketPrioritySeverityDraft>(emptyTicketPrioritySeverityDraft());
  const [handoffDraft, setHandoffDraft] =
    useState<EngineeringHandoffDraft>(emptyEngineeringHandoffDraft());
  const [handoffSubmitting, setHandoffSubmitting] = useState(false);
  const [statusDraft, setStatusDraft] = useState<TicketStatusUpdateTarget>('triage');
  const [statusReasonId, setStatusReasonId] = useState<Uuid | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [closeReason, setCloseReason] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [composerMode, setComposerMode] = useState<ComposerMode>('public');
  const [workspaceTab, setWorkspaceTab] = useState<
    'conversation' | 'details' | 'activities' | 'related' | 'sla' | 'history'
  >('conversation');
  const [assignDraft, setAssignDraft] = useState('');
  const [detailNotice, setDetailNotice] = useState<string | null>(null);
  const [detailNoticeTone, setDetailNoticeTone] = useState<'default' | 'critical'>('default');
  const [submitting, setSubmitting] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<TicketActionDrawer>('none');
  const [showQueueFilters, setShowQueueFilters] = useState(false);
  const [bulkSelectedTicketIds, setBulkSelectedTicketIds] = useState<Uuid[]>([]);
  const threadScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingThreadScrollRef = useRef<'idle' | 'latest'>('idle');
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const loadQueue = useEffectEvent(async (preferredTicketId?: string | null) => {
    try {
      const data = await listSupportTicketsQueue({
        ...filters,
        scope: ticketInboxScope,
        inboxFilter: ticketInboxFilter,
        search: ticketInboxSearch,
        page: ticketInboxPage,
        pageSize: SUPPORT_QUEUE_PAGE_SIZE,
      });
      setBackendDenied(false);
      setTickets(data.items);
      setQueueTotalCount(data.totalCount);
      setQueueScopeCounts(data.scopeCounts);
      setQueueFilterCounts(data.filterCounts);
      setPhase('ready');
      setPageMessage(null);
      setSelectedTicketId((current) => {
        if (variant === 'queue' && !preferredTicketId && !focusTicketId) {
          return data.items.some((ticket) => ticket.id === current) ? current : null;
        }

        const nextSelected =
          preferredTicketId ??
          focusTicketId ??
          (data.items.some((ticket) => ticket.id === current) ? current : null) ??
          data.items[0]?.id ??
          null;
        return nextSelected;
      });
    } catch (error) {
      const classified = classifyAdminError(
        error,
          'Falha ao carregar a fila oficial do suporte.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setTickets([]);
      setQueueTotalCount(0);
      setQueueScopeCounts({ open: 0, closed: 0 });
      setQueueFilterCounts({});
      setSelectedTicketId(null);
      setPageMessage(classified.message);
      setPhase(
        classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
      );
    }
  });

  const loadIntakeTenants = useEffectEvent(async (preferredTenantId?: Uuid | null) => {
    setIntakePhase('loading');
    setIntakeMessage(null);

    try {
      const rows = await listSupportTicketIntakeTenants();
      setIntakeTenants(rows);
      setIntakePhase('ready');
      setIntakeMessage(null);
      setIntakeDraft((current) => {
        const fallbackTenantId =
          preferredTenantId && rows.some((row) => row.tenantId === preferredTenantId)
            ? preferredTenantId
            : current.tenantId && rows.some((row) => row.tenantId === current.tenantId)
              ? current.tenantId
              : rows.length === 1
                ? rows[0]?.tenantId ?? ''
                : '';

        if (fallbackTenantId === current.tenantId) {
          return current;
        }

        return {
          ...current,
          tenantId: fallbackTenantId,
          requesterContactId: '',
        };
      });
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao carregar os clientes elegíveis para abrir ticket.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      setIntakeTenants([]);
      setIntakeContacts([]);
      setIntakeContactsMessage(null);
      setIntakeContactsLoading(false);
      setIntakeMessage(classified.message);
      setIntakePhase(
        classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
      );
    }
  });

  const loadIntakeContacts = useEffectEvent(async (tenantId: Uuid) => {
    setIntakeContactsLoading(true);
    setIntakeContactsMessage(null);

    try {
      const rows = await listSupportTicketIntakeContacts(tenantId);
      setIntakeContacts(rows);
      setIntakeContactsMessage(null);
      setIntakeDraft((current) => {
        if (
          current.requesterContactId &&
          rows.some((contact) => contact.id === current.requesterContactId)
        ) {
          return current;
        }

        const primaryContact =
          rows.find((contact) => contact.isPrimary) ?? rows[0] ?? null;

        return {
          ...current,
          requesterContactId: primaryContact?.id ?? '',
        };
      });
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao carregar os contatos elegíveis para abrir ticket.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      setIntakeContacts([]);
      setIntakeContactsMessage(classified.message);
    } finally {
      setIntakeContactsLoading(false);
    }
  });

  const loadClassificationOptions = useEffectEvent(async () => {
    setClassificationOptionsMessage(null);

    try {
      const rows = await listSupportTicketClassificationOptions();
      setClassificationOptions(rows);
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao carregar categorias e motivos operacionais.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      setClassificationOptions([]);
      setClassificationOptionsMessage(classified.message);
    }
  });

  const loadDetail = useEffectEvent(
    async (
      ticketId: string,
      options?: {
        preserveSurfaceState?: boolean;
      },
    ) => {
    setDetailPhase('loading');
    setDetailMessage(null);
    setAgentsPhase('loading');
    setAgentsMessage(null);
    setAttachmentPhase('loading');
    setAttachmentMessage(null);
    setEngineeringPhase('loading');
    setEngineeringMessage(null);
    setInternalActionsPhase('loading');
    setInternalActionsMessage(null);
    setInternalActionTargetAreasPhase('loading');
    setInternalActionTargetAreasMessage(null);
    setInternalActionDetailPhase('idle');
    setInternalActionDetailMessage(null);
    setInternalActionDetail(null);
    setInternalActionTimeline([]);
    setKnowledgePhase('loading');
    setKnowledgeMessage(null);

    try {
      const [detail, timelineRecent] = await Promise.all([
        getSupportTicketDetail(ticketId),
        getSupportTicketTimelineRecent(ticketId),
      ]);

      setBackendDenied(false);

      if (!detail) {
        setTicketDetail(null);
        setTimelineWindow(emptyTimelineWindow());
        setTimelineLoadingMore(false);
        setCustomer(null);
        setCustomerRecentTickets(emptyCustomerRecentTicketsWindow());
        setCustomerRecentEvents(emptyCustomerRecentEventsWindow());
        setAttachments(emptyTicketAttachments());
        setAttachmentPhase('idle');
        setAttachmentMessage(null);
        setEngineeringLinks(emptyTicketEngineeringLinks());
        setEngineeringPhase('idle');
        setEngineeringMessage(null);
        setInternalActions([]);
        setInternalActionsPhase('idle');
        setInternalActionsMessage(null);
        setInternalActionTargetAreas([]);
        setInternalActionTargetAreasPhase('idle');
        setInternalActionTargetAreasMessage(null);
        setInternalActionCreateDraft(emptyInternalActionCreateDraft());
        setSelectedInternalActionId(null);
        setInternalActionDetail(null);
        setInternalActionTimeline([]);
        setInternalActionDetailPhase('idle');
        setInternalActionDetailMessage(null);
        setKnowledgeLinks(emptyTicketKnowledgeLinks());
        setKnowledgeArticlePicker(emptyKnowledgeArticlePicker());
        setKnowledgePhase('idle');
        setDetailPhase('error');
        setDetailMessage('O ticket solicitado não apareceu na leitura operacional disponível.');
        return;
      }

      const [customerRow, customerAccountRow, recentTicketsWindow, recentEventsWindow] = await Promise.all([
        getSupportCustomer360(detail.tenantId),
        getSupportCustomerAccountContext(detail.tenantId),
        getSupportCustomerRecentTickets(detail.tenantId),
        getSupportCustomerRecentEvents(detail.tenantId),
      ]);
      setTicketDetail(detail);
      setTimelineWindow(timelineRecent);
      setTimelineLoadingMore(false);
      setCustomer(customerRow);
      setCustomerAccountContext(customerAccountRow);
      setCustomerRecentTickets(recentTicketsWindow);
      setCustomerRecentEvents(recentEventsWindow);
      setDetailPhase('ready');
      setStatusDraft(
        buildStatusChoices(detail.status, detail.allowedNextStatuses)[0] ??
          (detail.status === 'closed' ? 'triage' : (detail.status as TicketStatusUpdateTarget)),
      );
      setStatusReasonId('');
      setClassificationDraft({
        categoryId: detail.categoryId ?? '',
        operationalReasonId: '',
        note: '',
      });
      setPrioritySeverityDraft({
        priority: detail.priority,
        severity: detail.severity,
        operationalReasonId: '',
        note: '',
      });
      setAssignDraft(detail.assignedToUserId ?? '');
      if (!options?.preserveSurfaceState) {
        setHandoffDraft(emptyEngineeringHandoffDraft());
      }
      if (!options?.preserveSurfaceState) {
        setActiveDrawer('none');
      }
      setComposerMode((currentMode) => {
        if (options?.preserveSurfaceState) {
          if (currentMode === 'internal' && detail.canAddInternalNote) {
            return 'internal';
          }

          if (currentMode === 'public' && detail.canAddMessage) {
            return 'public';
          }
        }

        return detail.canAddMessage ? 'public' : detail.canAddInternalNote ? 'internal' : 'public';
      });
      setKnowledgeSearch('');
      setKnowledgeNoteDraft('');
      setInternalActionSupportNote('');
      setInternalActionEvidenceAttachmentId('');
      setInternalActionEvidenceNote('');
      setInternalActionCreateDraft(emptyInternalActionCreateDraft());

      try {
        const agentRows = await listSupportAssignableAgents(detail.tenantId);
        setAssignableAgents(agentRows);
        setAgentsPhase('ready');
      } catch (error) {
        const classified = classifyAdminError(
          error,
          'Falha ao carregar o diretorio de agentes atribuiveis.',
        );

        if (classified.kind === 'session-expired') {
          markSessionExpired();
          return;
        }

        setAssignableAgents([]);
        setAgentsMessage(classified.message);
        setAgentsPhase(
          classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
        );
      }

      try {
        const [attachmentRows, engineeringLinkRows] = await Promise.all([
          listSupportTicketAttachments(detail.id),
          listSupportTicketEngineeringLinks(detail.id),
        ]);
        setAttachments(attachmentRows);
        setAttachmentPhase('ready');
        setEngineeringLinks(engineeringLinkRows);
        setEngineeringPhase('ready');
      } catch (error) {
        const classified = classifyAdminError(
          error,
          'Falha ao carregar as evidências e os handoffs técnicos do ticket.',
        );

        if (classified.kind === 'session-expired') {
          markSessionExpired();
          return;
        }

        setAttachments(emptyTicketAttachments());
        setAttachmentMessage(classified.message);
        setAttachmentPhase(
          classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
        );
        setEngineeringLinks(emptyTicketEngineeringLinks());
        setEngineeringMessage(classified.message);
        setEngineeringPhase(
          classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
        );
      }

      try {
        const [internalActionRows, targetAreaRows] = await Promise.all([
          listSupportTicketInternalActions(detail.id),
          listSupportInternalActionTargetAreas(detail.id),
        ]);
        setInternalActions(internalActionRows);
        setInternalActionsPhase('ready');
        setInternalActionsMessage(null);
        setInternalActionTargetAreas(targetAreaRows);
        setInternalActionTargetAreasPhase('ready');
        setInternalActionTargetAreasMessage(null);
        setInternalActionCreateDraft((current) => ({
          ...current,
          targetArea:
            current.targetArea && targetAreaRows.some((area) => area.areaKey === current.targetArea)
              ? current.targetArea
              : targetAreaRows[0]?.areaKey ?? '',
        }));
        setSelectedInternalActionId((current) => {
          if (current && internalActionRows.some((row) => row.internalActionId === current)) {
            return current;
          }

          return internalActionRows[0]?.internalActionId ?? null;
        });
      } catch (error) {
        const classified = classifyAdminError(
          error,
          'Falha ao carregar os acionamentos internos deste ticket.',
        );

        if (classified.kind === 'session-expired') {
          markSessionExpired();
          return;
        }

        setInternalActions([]);
        setInternalActionsMessage(classified.message);
        setInternalActionsPhase(
          classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
        );
        setInternalActionTargetAreas([]);
        setInternalActionTargetAreasMessage(classified.message);
        setInternalActionTargetAreasPhase(
          classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
        );
        setSelectedInternalActionId(null);
      }

      try {
        const [ticketKnowledgeLinks, articlePickerRows] = await Promise.all([
          getSupportTicketKnowledgeLinks(detail.id),
          listSupportKnowledgeArticlePicker(detail.id),
        ]);
        setKnowledgeLinks(ticketKnowledgeLinks);
        setKnowledgeArticlePicker(articlePickerRows);
        setKnowledgePhase('ready');
      } catch (error) {
        const classified = classifyAdminError(
          error,
          'Falha ao carregar o painel de conhecimento relacionado.',
        );

        if (classified.kind === 'session-expired') {
          markSessionExpired();
          return;
        }

        setKnowledgeLinks(emptyTicketKnowledgeLinks());
        setKnowledgeArticlePicker(emptyKnowledgeArticlePicker());
        setKnowledgeMessage(classified.message);
        setKnowledgePhase(
          classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
        );
      }
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao carregar o contexto do ticket de suporte.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setTicketDetail(null);
      setTimelineWindow(emptyTimelineWindow());
      setTimelineLoadingMore(false);
      setCustomer(null);
      setCustomerAccountContext(null);
      setCustomerRecentTickets(emptyCustomerRecentTicketsWindow());
      setCustomerRecentEvents(emptyCustomerRecentEventsWindow());
      setAttachments(emptyTicketAttachments());
      setAttachmentPhase('idle');
      setAttachmentMessage(null);
      setEngineeringLinks(emptyTicketEngineeringLinks());
      setEngineeringPhase('idle');
      setEngineeringMessage(null);
      setInternalActions([]);
      setInternalActionsPhase('idle');
      setInternalActionsMessage(null);
      setInternalActionTargetAreas([]);
      setInternalActionTargetAreasPhase('idle');
      setInternalActionTargetAreasMessage(null);
      setInternalActionCreateDraft(emptyInternalActionCreateDraft());
      setSelectedInternalActionId(null);
      setInternalActionDetail(null);
      setInternalActionTimeline([]);
      setInternalActionDetailPhase('idle');
      setInternalActionDetailMessage(null);
      setKnowledgeLinks(emptyTicketKnowledgeLinks());
      setKnowledgeArticlePicker(emptyKnowledgeArticlePicker());
      setKnowledgePhase('idle');
      setKnowledgeMessage(null);
      setAssignableAgents([]);
      setAgentsPhase('idle');
      setDetailMessage(classified.message);
      setDetailPhase(
        classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
      );
    }
    },
  );

  useEffect(() => {
    if (didBootstrapRef.current) {
      return;
    }

    didBootstrapRef.current = true;
    void loadQueue(focusTicketId ?? null);
    void loadClassificationOptions();
  }, []);

  useEffect(() => {
    if (variant !== 'queue') {
      return;
    }

    void loadIntakeTenants();
  }, [variant]);

  useEffect(() => {
    void loadQueue(focusTicketId ?? null);
  }, [
    filters.assignedToUserId,
    filters.priority,
    filters.severity,
    filters.status,
    filters.categoryId,
    filters.tenantId,
    ticketInboxScope,
    ticketInboxFilter,
    ticketInboxSearch,
    ticketInboxPage,
    focusTicketId,
  ]);

  useEffect(() => {
    if (!selectedTicketId) {
      setDetailPhase('idle');
      setTicketDetail(null);
      setTimelineWindow(emptyTimelineWindow());
      setTimelineLoadingMore(false);
      setCustomer(null);
      setCustomerAccountContext(null);
      setCustomerRecentTickets(emptyCustomerRecentTicketsWindow());
      setCustomerRecentEvents(emptyCustomerRecentEventsWindow());
      setAttachments(emptyTicketAttachments());
      setAttachmentPhase('idle');
      setAttachmentMessage(null);
      setEngineeringLinks(emptyTicketEngineeringLinks());
      setEngineeringPhase('idle');
      setEngineeringMessage(null);
      setInternalActions([]);
      setInternalActionsPhase('idle');
      setInternalActionsMessage(null);
      setInternalActionTargetAreas([]);
      setInternalActionTargetAreasPhase('idle');
      setInternalActionTargetAreasMessage(null);
      setInternalActionCreateDraft(emptyInternalActionCreateDraft());
      setSelectedInternalActionId(null);
      setInternalActionDetail(null);
      setInternalActionTimeline([]);
      setInternalActionDetailPhase('idle');
      setInternalActionDetailMessage(null);
      setKnowledgeLinks(emptyTicketKnowledgeLinks());
      setKnowledgeArticlePicker(emptyKnowledgeArticlePicker());
      setKnowledgePhase('idle');
      setKnowledgeMessage(null);
      setAssignableAgents([]);
      setAgentsPhase('idle');
      setAgentsMessage(null);
      return;
    }

    void loadDetail(selectedTicketId);
  }, [selectedTicketId]);

  useEffect(() => {
    if (!intakeDraft.tenantId) {
      setIntakeContacts([]);
      setIntakeContactsMessage(null);
      setIntakeContactsLoading(false);
      return;
    }

    void loadIntakeContacts(intakeDraft.tenantId);
  }, [intakeDraft.tenantId]);

  useEffect(() => {
    setDetailNotice(null);
    pendingThreadScrollRef.current = 'idle';
    setTimelineLoadingMore(false);
  }, [selectedTicketId]);

  useEffect(() => {
    if (pendingThreadScrollRef.current !== 'latest') {
      return;
    }

    const syncThreadScroll = () => {
        const threadNode = threadScrollContainerRef.current;

        if (!threadNode) {
          return;
        }

        threadNode.scrollTop = threadNode.scrollHeight;
    };

    const frame = window.requestAnimationFrame(syncThreadScroll);
    const retries = [90, 220, 420].map((delay) =>
      window.setTimeout(() => {
        syncThreadScroll();
        if (delay === 420) {
          pendingThreadScrollRef.current = 'idle';
        }
      }, delay),
    );

    return () => {
      window.cancelAnimationFrame(frame);
      for (const retry of retries) {
        window.clearTimeout(retry);
      }
    };
  }, [detailNotice, timelineWindow]);

  const tenantOptions = useMemo(() => {
    const items = new Map<string, { id: string; label: string }>();

    for (const ticket of tickets) {
      if (!items.has(ticket.tenantId)) {
        items.set(ticket.tenantId, {
          id: ticket.tenantId,
          label: ticketTenantLabel(ticket),
        });
      }
    }

    return Array.from(items.values()).sort((left, right) =>
      left.label.localeCompare(right.label, 'pt-BR'),
    );
  }, [tickets]);

  const assigneeOptions = useMemo(() => {
    const items = new Map<string, { id: string; label: string }>();

    for (const ticket of tickets) {
      if (ticket.assignedToUserId && !items.has(ticket.assignedToUserId)) {
        items.set(ticket.assignedToUserId, {
          id: ticket.assignedToUserId,
          label: ticket.assignedToFullName ?? ticket.assignedToUserId,
        });
      }
    }

    return Array.from(items.values()).sort((left, right) =>
      left.label.localeCompare(right.label, 'pt-BR'),
    );
  }, [tickets]);

  const ticketCategoryOptions = useMemo(
    () => classificationOptions.filter((option) => option.optionKind === 'category'),
    [classificationOptions],
  );
  const classificationReasonOptions = useMemo(
    () =>
      classificationOptions.filter(
        (option) =>
          option.optionKind === 'operational_reason' &&
          option.reasonType === 'classification_update',
      ),
    [classificationOptions],
  );
  const priorityReasonOptions = useMemo(
    () =>
      classificationOptions.filter(
        (option) =>
          option.optionKind === 'operational_reason' &&
          option.reasonType === 'priority_change',
      ),
    [classificationOptions],
  );
  const statusReasonOptions = useMemo(
    () =>
      classificationOptions.filter((option) => {
        if (option.optionKind !== 'operational_reason') {
          return false;
        }

        if (option.appliesToStatus && option.appliesToStatus !== statusDraft) {
          return false;
        }

        if (statusDraft === 'resolved') {
          return option.reasonType === 'resolution' || option.reasonType === 'status_transition';
        }

        if (statusDraft === 'cancelled') {
          return option.reasonType === 'cancellation' || option.reasonType === 'status_transition';
        }

        return option.reasonType === 'status_transition';
      }),
    [classificationOptions, statusDraft],
  );

  const selectedTicketSummary =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;
  const filteredKnowledgeArticles = useMemo(() => {
    const term = knowledgeSearch.trim().toLocaleLowerCase('pt-BR');

    if (term.length === 0) {
      return knowledgeArticlePicker.slice(0, 6);
    }

    return knowledgeArticlePicker
      .filter((article) => {
        const haystack = [
          article.articleTitle,
          article.articleSummary ?? '',
          article.categoryName ?? '',
        ]
          .join(' ')
          .toLocaleLowerCase('pt-BR');

        return haystack.includes(term);
      })
      .slice(0, 8);
  }, [knowledgeArticlePicker, knowledgeSearch]);
  const currentAssignedAgent =
    ticketDetail?.assignedToUserId
      ? assignableAgents.find((agent) => agent.userId === ticketDetail.assignedToUserId) ?? null
      : null;
  const currentUserAssignableAgent =
    user?.id ? assignableAgents.find((agent) => agent.userId === user.id) ?? null : null;
  const ticketInboxScopeTickets = tickets;
  const ticketInboxScopeCounts = queueScopeCounts;
  const totalOpen = queueScopeCounts.open;
  const waitingCustomer = queueFilterCounts.waiting_customer ?? 0;
  const highAttention = queueFilterCounts.high_attention ?? 0;
  const unassigned = queueFilterCounts.unassigned ?? 0;
  const waitingEngineering = queueFilterCounts.waiting_engineering ?? 0;
  const ticketInboxTabs = useMemo(
    () =>
      ticketInboxScope === 'open'
        ? [
            { key: 'all' as const, label: 'Todos', count: queueFilterCounts.all ?? 0 },
            {
              key: 'in_progress' as const,
              label: 'Em tratativa',
              count: queueFilterCounts.in_progress ?? 0,
            },
            {
              key: 'awaiting' as const,
              label: 'Aguardando',
              count: queueFilterCounts.awaiting ?? 0,
            },
            {
              key: 'urgent' as const,
              label: 'Urgentes',
              count: queueFilterCounts.urgent ?? 0,
            },
            {
              key: 'operations' as const,
              label: 'Operações',
              count: queueFilterCounts.operations ?? 0,
            },
            {
              key: 'engineering' as const,
              label: 'Dependências',
              count: queueFilterCounts.engineering ?? 0,
            },
          ]
        : [
            { key: 'all_closed' as const, label: 'Todos fechados', count: queueFilterCounts.all_closed ?? 0 },
            {
              key: 'resolved' as const,
              label: 'Resolvidos',
              count: queueFilterCounts.resolved ?? 0,
            },
            {
              key: 'closed' as const,
              label: 'Fechados',
              count: queueFilterCounts.closed ?? 0,
            },
            {
              key: 'cancelled' as const,
              label: 'Cancelados',
              count: queueFilterCounts.cancelled ?? 0,
            },
          ],
    [ticketInboxScope, ticketInboxScopeTickets],
  );
  const ticketInboxFilteredTickets = useMemo(() => {
    const search = ticketInboxSearch.trim().toLocaleLowerCase('pt-BR');

    return ticketInboxScopeTickets.filter((ticket) => {
      if (!ticketMatchesInboxFilter(ticket, ticketInboxFilter)) {
        return false;
      }

      if (search.length === 0) {
        return true;
      }

      const haystack = [
        supportTicketCode(ticket.id),
        ticket.title,
        ticketTenantLabel(ticket),
        ticket.tenantSlug,
        ticket.categoryName ?? '',
        ticket.assignedToFullName ?? '',
        ticket.slaStatusLabel ?? '',
      ]
        .join(' ')
        .toLocaleLowerCase('pt-BR');

      return haystack.includes(search);
    });
  }, [ticketInboxFilter, ticketInboxScopeTickets, ticketInboxSearch]);
  const ticketInboxPageSize = SUPPORT_QUEUE_PAGE_SIZE;
  const ticketInboxTotalPages = Math.max(
    1,
    Math.ceil(queueTotalCount / ticketInboxPageSize),
  );
  const safeTicketInboxPage = Math.min(ticketInboxPage, ticketInboxTotalPages);
  const ticketInboxVisibleTickets = ticketInboxFilteredTickets;
  const ticketInboxStart =
    queueTotalCount === 0 ? 0 : (safeTicketInboxPage - 1) * ticketInboxPageSize + 1;
  const ticketInboxEnd = Math.min(
    queueTotalCount,
    safeTicketInboxPage * ticketInboxPageSize,
  );

  function resetTicketInboxFilters(scope: TicketInboxScope = ticketInboxScope) {
    setTicketInboxSearch('');
    setTicketInboxFilter(defaultTicketInboxFilterForScope(scope));
  }

  function handleChangeTicketInboxScope(scope: TicketInboxScope) {
    if (scope === ticketInboxScope) {
      return;
    }

    setTicketInboxScope(scope);
    setTicketInboxFilter(defaultTicketInboxFilterForScope(scope));
  }

  function handleSelectTicket(ticketId: string) {
    setBulkSelectedTicketIds([]);
    setSelectedTicketId(ticketId);
    setActiveDrawer('none');
    setAttachmentUploadDraft(emptyAttachmentUploadDraft());
    if (variant === 'tickets') {
      void navigate(`/support/tickets/${ticketId}`);
    }
  }

  function handleToggleQueueBulkTicket(ticketId: Uuid) {
    setBulkSelectedTicketIds((current) =>
      current.includes(ticketId)
        ? current.filter((id) => id !== ticketId)
        : [...current, ticketId],
    );
    setActiveDrawer('none');
  }

  function handleSelectAllQueueVisibleTickets() {
    setBulkSelectedTicketIds(queueVisibleTickets.map((ticket) => ticket.id));
    setSelectedTicketId(null);
    setActiveDrawer('none');
  }

  function handleClearQueueBulkSelection() {
    setBulkSelectedTicketIds([]);
  }

  function applySuccess(message: string) {
    setDetailNotice(message);
    setDetailNoticeTone('default');
  }

  function applyFailure(message: string) {
    setDetailNotice(message);
    setDetailNoticeTone('critical');
  }

  function openAttachmentPicker() {
    setActiveDrawer('evidence');
    attachmentInputRef.current?.click();
  }

  async function handleDownloadAttachment(attachmentId: Uuid) {
    setAttachmentDownloadingId(attachmentId);
    setDetailNotice(null);

    try {
      const payload = await getSupportTicketAttachmentSignedUrl(attachmentId);

      if (typeof window !== 'undefined' && typeof window.open === 'function') {
        window.open(payload.signedUrl, '_blank', 'noopener,noreferrer');
      }

      applySuccess('Download temporário preparado com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao preparar o download seguro da evidência.',
      );
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(friendlyAttachmentDownloadErrorMessage(classified.message));
    } finally {
      setAttachmentDownloadingId(null);
    }
  }

  function handleAttachmentSelection(fileList: FileList | File[] | File | null) {
    const files =
      fileList instanceof File
        ? [fileList]
        : fileList
          ? Array.from(fileList)
          : [];

    if (files.length === 0) {
      return;
    }

    const nextFiles: File[] = [];
    const nextErrors: Record<string, string> = {};

    files.forEach((file, index) => {
      const key = `${file.name}:${index}`;
      if (file.size <= 0) {
        nextErrors[key] = 'Arquivo vazio.';
        return;
      }

      if (file.size > TICKET_ATTACHMENT_MAX_BYTES) {
        nextErrors[key] = 'Ultrapassa 10 MB.';
        return;
      }

      if (!file.type) {
        nextErrors[key] = 'Tipo indisponível.';
        return;
      }

      nextFiles.push(file);
    });

    setAttachmentUploadDraft((current) => ({
      ...current,
      files: [...current.files, ...nextFiles],
      errors: { ...current.errors, ...nextErrors },
    }));
    setDetailNotice(null);
    setActiveDrawer('evidence');

    if (Object.keys(nextErrors).length > 0 && nextFiles.length === 0) {
      applyFailure('Alguns arquivos não puderam ser preparados para upload.');
    }
  }

  function handleRemoveDraftAttachment(indexToRemove: number) {
    setAttachmentUploadDraft((current) => ({
      ...current,
      files: current.files.filter((_, index) => index !== indexToRemove),
      errors: Object.fromEntries(
        Object.entries(current.errors).filter((_, index) => index !== indexToRemove),
      ),
    }));
  }

  async function handleSubmitAttachmentUpload() {
    if (!ticketDetail || attachmentUploadDraft.files.length === 0) {
      return;
    }

    setAttachmentSubmitting(true);
    setDetailNotice(null);

    const failedFiles: File[] = [];
    const failedErrors: Record<string, string> = {};
    let successCount = 0;

    try {
      for (const [index, file] of attachmentUploadDraft.files.entries()) {
        const key = `${file.name}:${index}`;
        try {
          await uploadSupportTicketAttachment({
            ticketId: ticketDetail.id,
            tenantId: ticketDetail.tenantId,
            file,
          });
          successCount += 1;
        } catch (error) {
          const classified = classifyAdminError(
            error,
            'Falha ao enviar a evidência para o ticket.',
          );
          if (classified.kind === 'session-expired') {
            markSessionExpired();
            return;
          }

          failedFiles.push(file);
          failedErrors[key] = friendlyAttachmentUploadErrorMessage(classified.message);
        }
      }

      if (successCount > 0) {
        await loadDetail(ticketDetail.id, { preserveSurfaceState: true });
      }

      setAttachmentUploadDraft((current) => ({
        ...current,
        files: failedFiles,
        errors: failedErrors,
        note: failedFiles.length === 0 ? '' : current.note,
      }));

      if (successCount > 0 && failedFiles.length === 0) {
        applySuccess(
          successCount === 1
            ? 'Evidência enviada com sucesso.'
            : `${successCount} evidências enviadas com sucesso.`,
        );
        setActiveDrawer('evidence');
      } else if (successCount > 0) {
        applyFailure(
          `${successCount} arquivo(s) enviado(s), mas ainda há itens com falha.`,
        );
      } else {
        applyFailure('Nenhum arquivo pôde ser enviado agora.');
      }
    } finally {
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
      setAttachmentSubmitting(false);
    }
  }

  async function handleCopyPublicKnowledgeLink(
    article: Pick<
      SupportKnowledgeArticlePickerItem,
      | 'articleStatus'
      | 'articleVisibility'
      | 'canSendToCustomer'
      | 'isCustomerSendAllowed'
      | 'publicArticlePath'
      | 'reasonIfBlocked'
    >,
  ) {
    const blockReason = getKnowledgeCustomerSendBlockReason(article);

    if (blockReason) {
      applyFailure(blockReason);
      return;
    }

    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.clipboard ||
        typeof navigator.clipboard.writeText !== 'function'
      ) {
        throw new Error('clipboard unavailable');
      }

      await navigator.clipboard.writeText(buildAbsoluteAppUrl(article.publicArticlePath ?? ''));
      applySuccess('Link público copiado com sucesso.');
    } catch {
      applyFailure('Não foi possível copiar o link público agora.');
    }
  }

  function handleOpenKnowledgeArticle(article: SupportKnowledgeArticlePickerItem) {
    const blockReason = getKnowledgeCustomerSendBlockReason(article);

    if (blockReason) {
      applyFailure(blockReason);
      return;
    }

    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(buildAbsoluteAppUrl(article.publicArticlePath ?? ''), '_blank', 'noopener,noreferrer');
    }
  }

  function handleUseArticleInReply(article: SupportKnowledgeArticlePickerItem) {
    const blockReason = getKnowledgeCustomerSendBlockReason(article);

    if (blockReason) {
      applyFailure(blockReason);
      return;
    }

    setComposerMode('public');
    setActiveDrawer('none');
    setMessageDraft((current) => {
      const link = buildAbsoluteAppUrl(article.publicArticlePath ?? '');
      if (current.includes(link)) {
        return current;
      }

      return current.trim().length === 0 ? link : `${current.trim()}\n${link}`;
    });
    applySuccess('Link preparado na resposta pública.');
  }

  async function handleLoadOlderTimeline() {
    if (!ticketDetail || !timelineWindow.hasMore || timelineLoadingMore) {
      return;
    }

    const oldestEntry = [...timelineWindow.entries].sort((left, right) => {
      const occurredDiff =
        new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime();

      if (occurredDiff !== 0) {
        return occurredDiff;
      }

      return left.timelineEntryId.localeCompare(right.timelineEntryId);
    })[0];

    if (!oldestEntry) {
      return;
    }

    setTimelineLoadingMore(true);
    setDetailNotice(null);

    try {
      const olderPage = await getSupportTicketTimelinePage(ticketDetail.id, {
        limit: 25,
        beforeOccurredAt: oldestEntry.occurredAt,
        beforeTimelineEntryId: oldestEntry.timelineEntryId,
      });

      setTimelineWindow((current) => {
        const existingIds = new Set(
          current.entries.map((entry) => entry.timelineEntryId),
        );
        const olderEntries = olderPage.entries.filter(
          (entry) => !existingIds.has(entry.timelineEntryId),
        );
        const mergedEntries = [...olderEntries, ...current.entries].sort((left, right) => {
          const occurredDiff =
            new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime();

          if (occurredDiff !== 0) {
            return occurredDiff;
          }

          return left.timelineEntryId.localeCompare(right.timelineEntryId);
        });

        return {
          entries: mergedEntries,
          totalAvailableCount:
            olderPage.totalAvailableCount || current.totalAvailableCount,
          recentLimit: current.recentLimit + olderEntries.length,
          hasMore: olderPage.hasMore,
        };
      });
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao carregar o histórico anterior do ticket.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      applyFailure(classified.message);
    } finally {
      setTimelineLoadingMore(false);
    }
  }

  async function runAssignment(targetUserId: string | null) {
    if (!ticketDetail) {
      return;
    }

    setSubmitting(true);
    setDetailNotice(null);

    try {
      await assignTicket({
        ticketId: ticketDetail.id,
        assignedToUserId: targetUserId,
      });
      await refreshDetail(ticketDetail.id);
      applySuccess(targetUserId ? 'Responsavel atualizado com sucesso.' : 'Ticket desatribuido com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(error, 'Falha ao atualizar o responsavel.');
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function refreshDetail(
    ticketId: string,
    options: {
      preserveSurfaceState?: boolean;
    } = { preserveSurfaceState: true },
  ) {
    await Promise.all([loadQueue(ticketId), loadDetail(ticketId, options)]);
  }

  const loadSelectedInternalAction = useEffectEvent(async (internalActionId: Uuid) => {
    setInternalActionDetailPhase('loading');
    setInternalActionDetailMessage(null);

    try {
      const [detailRow, timelineRows] = await Promise.all([
        getSupportInternalActionDetail(internalActionId),
        listSupportInternalActionTimeline(internalActionId),
      ]);

      if (!detailRow) {
        setInternalActionDetail(null);
        setInternalActionTimeline([]);
        setInternalActionDetailPhase('error');
        setInternalActionDetailMessage(
          'O acionamento selecionado não apareceu na leitura interna disponível.',
        );
        return;
      }

      setInternalActionDetail(detailRow);
      setInternalActionTimeline(timelineRows);
      setInternalActionDetailPhase('ready');
      setInternalActionDetailMessage(null);
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao carregar o detalhe do acionamento interno.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      setInternalActionDetail(null);
      setInternalActionTimeline([]);
      setInternalActionDetailMessage(classified.message);
      setInternalActionDetailPhase(
        classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
      );
    }
  });

  async function handleSubmitTicketIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = intakeDraft.title.trim();
    const description = intakeDraft.description.trim();

    if (!intakeDraft.tenantId || title.length === 0 || description.length === 0) {
      return;
    }

    setIntakeSubmitting(true);
    setDetailNotice(null);

    try {
      const created = await createTicket({
        tenantId: intakeDraft.tenantId,
        requesterContactId: intakeDraft.requesterContactId || null,
        source: intakeDraft.source,
        priority: intakeDraft.priority,
        severity: intakeDraft.severity,
        categoryId: intakeDraft.categoryId || null,
        operationalReasonId: intakeDraft.operationalReasonId || null,
        title,
        description,
      });
      setShowCreateTicket(false);
      setIntakeDraft({
        ...emptyTicketIntakeDraft(),
        tenantId: created.tenantId,
      });
      await loadIntakeTenants(created.tenantId);
      await loadQueue(created.id);
      void navigate(`/support/tickets/${created.id}`);
    } catch (error) {
      const classified = classifyAdminError(error, 'Falha ao abrir o ticket operacional.');

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      applyFailure(classified.message);
    } finally {
      setIntakeSubmitting(false);
    }
  }

  function optionalKnowledgeNote() {
    const trimmed = knowledgeNoteDraft.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  async function handleCreateEngineeringHandoff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ticketDetail) {
      return;
    }

    const title = handoffDraft.title.trim();
    const baseDescription = handoffDraft.description.trim();
    const impactSummary = handoffDraft.impactSummary.trim();
    const reproductionSteps = handoffDraft.reproductionSteps.trim();
    const expectedResult = handoffDraft.expectedResult.trim();
    const currentResult = handoffDraft.currentResult.trim();
    const relatedEvidence = handoffDraft.relatedEvidence.trim();
    const technicalUrgency = handoffDraft.technicalUrgency;
    const description = [
      baseDescription,
      impactSummary ? `Impacto: ${impactSummary}` : null,
      reproductionSteps ? `Passos para reproduzir: ${reproductionSteps}` : null,
      expectedResult ? `Resultado esperado: ${expectedResult}` : null,
      currentResult ? `Resultado atual: ${currentResult}` : null,
    ]
      .filter((value): value is string => Boolean(value))
      .join('\n\n');
    const handoffNote = [
      relatedEvidence ? `Evidências relacionadas: ${relatedEvidence}` : null,
      technicalUrgency ? `Urgência técnica: ${humanizePriority(technicalUrgency)}` : null,
      handoffDraft.handoffNote.trim() || null,
    ]
      .filter((value): value is string => Boolean(value))
      .join('\n');

    if (!ticketDetail.canUpdateStatus || title.length === 0 || description.length === 0) {
      return;
    }

    setHandoffSubmitting(true);
    setDetailNotice(null);

    try {
      await createSupportEngineeringWorkItemFromTicket({
        ticketId: ticketDetail.id,
        workItemType: handoffDraft.workItemType,
        title,
        description,
        handoffNote: handoffNote || null,
      });
      setHandoffDraft(emptyEngineeringHandoffDraft());
      await refreshDetail(ticketDetail.id);
      setActiveDrawer('handoff');
      applySuccess('Demanda técnica criada e vinculada ao ticket com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao criar a demanda técnica vinculada a este ticket.',
      );
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setHandoffSubmitting(false);
    }
  }

  async function handleCreateInternalAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ticketDetail) {
      return;
    }

    const targetArea = internalActionCreateDraft.targetArea.trim();
    const supportType = internalActionCreateDraft.supportType;
    const summary = internalActionCreateDraft.summary.trim();
    const context = internalActionCreateDraft.context.trim();
    const selectedArea = internalActionTargetAreas.find((area) => area.areaKey === targetArea);

    if (!targetArea || !supportType || !internalActionCreateDraft.priority || summary.length === 0 || context.length === 0) {
      applyFailure('Preencha área, tipo de apoio, prioridade, resumo e contexto do acionamento.');
      return;
    }

    if (!selectedArea?.canCreateAction) {
      applyFailure('Esta área interna não está disponível para acionamento neste ticket.');
      return;
    }

    setInternalActionSubmitting(true);
    setDetailNotice(null);

    try {
      const created = await createSupportInternalAction({
        ticketId: ticketDetail.id,
        targetArea,
        supportType,
        priority: internalActionCreateDraft.priority,
        summary,
        context,
        evidenceAttachmentIds:
          internalActionCreateDraft.evidenceAttachmentIds.length > 0
            ? internalActionCreateDraft.evidenceAttachmentIds
            : null,
      });

      setInternalActionCreateDraft({
        ...emptyInternalActionCreateDraft(),
        targetArea: internalActionTargetAreas[0]?.areaKey ?? '',
      });
      setSelectedInternalActionId(created.id);
      await refreshDetail(ticketDetail.id);
      setSelectedInternalActionId(created.id);
      setActiveDrawer('automation');
      applySuccess('Acionamento interno criado com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(error, 'Falha ao criar o acionamento interno.');
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setInternalActionSubmitting(false);
    }
  }

  async function handleArchiveKnowledgeLink(linkId: Uuid) {
    if (!ticketDetail) {
      return;
    }

    setKnowledgeSubmitting(true);
    setDetailNotice(null);

    try {
      await archiveSupportTicketArticleLink({
        ticketKnowledgeLinkId: linkId,
      });
      await refreshDetail(ticketDetail.id);
      applySuccess('Vinculo de conhecimento arquivado com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao arquivar o vinculo de conhecimento.',
      );
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setKnowledgeSubmitting(false);
    }
  }

  async function handleLinkKnowledgeArticle(
    articleId: Uuid,
    linkType: Extract<TicketKnowledgeLinkType, 'reference_internal' | 'sent_to_customer'>,
  ) {
    if (!ticketDetail) {
      return;
    }

    if (linkType === 'sent_to_customer') {
      const article = knowledgeArticlePicker.find((item) => item.articleId === articleId);
      const blockReason = article
        ? getKnowledgeCustomerSendBlockReason(article)
        : 'Artigo indisponível no contexto autorizado deste ticket.';

      if (blockReason) {
        applyFailure(blockReason);
        return;
      }
    }

    setKnowledgeSubmitting(true);
    setDetailNotice(null);

    try {
      await linkSupportTicketArticle({
        ticketId: ticketDetail.id,
        articleId,
        linkType,
        note: optionalKnowledgeNote(),
      });
      await refreshDetail(ticketDetail.id);
      applySuccess(
        linkType === 'sent_to_customer'
          ? 'Link público relacionado ao ticket com sucesso.'
          : 'Referencia interna relacionada ao ticket com sucesso.',
      );
    } catch (error) {
      const classified = classifyAdminError(
        error,
        linkType === 'sent_to_customer'
          ? 'Falha ao registrar o link público para o cliente.'
          : 'Falha ao relacionar a referência interna.',
      );
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setKnowledgeSubmitting(false);
    }
  }

  async function handleMarkDocumentationGap() {
    if (!ticketDetail) {
      return;
    }

    setKnowledgeSubmitting(true);
    setDetailNotice(null);

    try {
      await markSupportDocumentationGap({
        ticketId: ticketDetail.id,
        note: optionalKnowledgeNote(),
      });
      await refreshDetail(ticketDetail.id);
      applySuccess('Lacuna de documentação registrada com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao registrar a lacuna de documentação.',
      );
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setKnowledgeSubmitting(false);
    }
  }

  async function handleMarkKnowledgeNeedsUpdate(articleId: Uuid) {
    if (!ticketDetail) {
      return;
    }

    setKnowledgeSubmitting(true);
    setDetailNotice(null);

    try {
      await markSupportArticleNeedsUpdate({
        ticketId: ticketDetail.id,
        articleId,
        note: optionalKnowledgeNote(),
      });
      await refreshDetail(ticketDetail.id);
      applySuccess('Artigo marcado para revisão com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao marcar que o artigo precisa de revisão.',
      );
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setKnowledgeSubmitting(false);
    }
  }

  async function handleAcceptInternalActionReturn() {
    if (!ticketDetail || !internalActionDetail) {
      return;
    }

    setInternalActionSubmitting(true);
    setDetailNotice(null);

    try {
      await acceptSupportInternalActionReturn({
        internalActionId: internalActionDetail.internalActionId,
        tenantId: internalActionDetail.tenantId,
        note: internalActionSupportNote.trim() || null,
      });
      await refreshDetail(ticketDetail.id);
      await loadSelectedInternalAction(internalActionDetail.internalActionId);
      setInternalActionSupportNote('');
      applySuccess('Retorno do acionamento aceito com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao aceitar o retorno deste acionamento.',
      );
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setInternalActionSubmitting(false);
    }
  }

  async function handleRequestInternalActionFollowup() {
    if (!ticketDetail || !internalActionDetail) {
      return;
    }

    const note = internalActionSupportNote.trim();
    if (note.length === 0) {
      applyFailure('Descreva o complemento solicitado à área interna.');
      return;
    }

    setInternalActionSubmitting(true);
    setDetailNotice(null);

    try {
      await requestSupportInternalActionFollowup({
        internalActionId: internalActionDetail.internalActionId,
        tenantId: internalActionDetail.tenantId,
        note,
      });
      await refreshDetail(ticketDetail.id);
      await loadSelectedInternalAction(internalActionDetail.internalActionId);
      setInternalActionSupportNote('');
      applySuccess('Complemento solicitado à área interna com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao solicitar complemento deste acionamento.',
      );
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setInternalActionSubmitting(false);
    }
  }

  async function handleCloseInternalAction() {
    if (!ticketDetail || !internalActionDetail) {
      return;
    }

    setInternalActionSubmitting(true);
    setDetailNotice(null);

    try {
      await closeSupportInternalAction({
        internalActionId: internalActionDetail.internalActionId,
        tenantId: internalActionDetail.tenantId,
        note: internalActionSupportNote.trim() || null,
      });
      await refreshDetail(ticketDetail.id);
      await loadSelectedInternalAction(internalActionDetail.internalActionId);
      setInternalActionSupportNote('');
      applySuccess('Acionamento encerrado com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(error, 'Falha ao encerrar este acionamento.');
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setInternalActionSubmitting(false);
    }
  }

  async function handleLinkInternalActionEvidence() {
    if (!ticketDetail || !internalActionDetail || !internalActionEvidenceAttachmentId) {
      return;
    }

    setInternalActionSubmitting(true);
    setDetailNotice(null);

    try {
      await addInternalActionEvidenceLink({
        internalActionId: internalActionDetail.internalActionId,
        tenantId: internalActionDetail.tenantId,
        ticketAttachmentId: internalActionEvidenceAttachmentId,
        note: internalActionEvidenceNote.trim() || null,
      });
      await refreshDetail(ticketDetail.id);
      await loadSelectedInternalAction(internalActionDetail.internalActionId);
      setInternalActionEvidenceAttachmentId('');
      setInternalActionEvidenceNote('');
      applySuccess('Evidência vinculada ao acionamento com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao vincular a evidência a este acionamento.',
      );
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setInternalActionSubmitting(false);
    }
  }

  async function handleUpdateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ticketDetail) {
      return;
    }

    const nextStatusChoices = buildStatusChoices(ticketDetail.status, ticketDetail.allowedNextStatuses);

    if (nextStatusChoices.length === 0) {
      applyFailure('Nenhuma transição de status está disponível para este ticket.');
      return;
    }

    if (requiresOperationalReasonForStatus(statusDraft) && !statusReasonId) {
      applyFailure('Informe o motivo da mudança de status.');
      return;
    }

    setSubmitting(true);
    setDetailNotice(null);

    try {
      await updateTicketStatus({
        ticketId: ticketDetail.id,
        status: statusDraft,
        operationalReasonId: statusReasonId || null,
        note: statusNote.trim() || null,
      });
      setStatusNote('');
      setStatusReasonId('');
      await refreshDetail(ticketDetail.id);
      setActiveDrawer((current) => (current === 'status' ? 'none' : current));
      applySuccess('Status atualizado com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(error, 'Falha ao atualizar o status do ticket.');
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(friendlyTicketStatusErrorMessage(classified.message));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveClassificationDrawer() {
    if (!ticketDetail) {
      return;
    }

    if (!classificationDraft.categoryId) {
      applyFailure('Selecione a categoria operacional antes de salvar.');
      return;
    }

    setSubmitting(true);
    setDetailNotice(null);

    try {
      await updateTicketClassification({
        ticketId: ticketDetail.id,
        categoryId: classificationDraft.categoryId,
        operationalReasonId: classificationDraft.operationalReasonId || null,
        note: classificationDraft.note.trim() || null,
      });

      await updateTicketPrioritySeverity({
        ticketId: ticketDetail.id,
        priority: prioritySeverityDraft.priority,
        severity: prioritySeverityDraft.severity,
        operationalReasonId: prioritySeverityDraft.operationalReasonId || null,
        note: prioritySeverityDraft.note.trim() || null,
      });

      await refreshDetail(ticketDetail.id);
      setActiveDrawer('none');
      applySuccess('Classificação operacional atualizada com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao salvar a classificação operacional do ticket.',
      );
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateClassification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ticketDetail || !classificationDraft.categoryId) {
      return;
    }

    setSubmitting(true);
    setDetailNotice(null);

    try {
      await updateTicketClassification({
        ticketId: ticketDetail.id,
        categoryId: classificationDraft.categoryId,
        operationalReasonId: classificationDraft.operationalReasonId || null,
        note: classificationDraft.note.trim() || null,
      });
      await refreshDetail(ticketDetail.id);
      applySuccess('Classificação atualizada com a governança operacional da plataforma.');
    } catch (error) {
      const classified = classifyAdminError(error, 'Falha ao atualizar a classificação do ticket.');
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdatePrioritySeverity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ticketDetail) {
      return;
    }

    setSubmitting(true);
    setDetailNotice(null);

    try {
      await updateTicketPrioritySeverity({
        ticketId: ticketDetail.id,
        priority: prioritySeverityDraft.priority,
        severity: prioritySeverityDraft.severity,
        operationalReasonId: prioritySeverityDraft.operationalReasonId || null,
        note: prioritySeverityDraft.note.trim() || null,
      });
      await refreshDetail(ticketDetail.id);
      applySuccess('Prioridade, severidade e SLA recalculados pela governança operacional da plataforma.');
    } catch (error) {
      const classified = classifyAdminError(error, 'Falha ao atualizar prioridade e severidade.');
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAssignment(assignDraft.trim() || null);
  }

  async function handleSubmitComposer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ticketDetail) {
      return;
    }

    const draft = composerMode === 'public' ? messageDraft : noteDraft;
    const body = draft.trim();

    if (body.length === 0) {
      return;
    }

    setSubmitting(true);
    setDetailNotice(null);

    try {
      if (composerMode === 'public') {
        await addTicketMessage({
          ticketId: ticketDetail.id,
          body,
        });
        setMessageDraft('');
        applySuccess('Resposta pública adicionada com sucesso.');
      } else {
        await addInternalTicketNote({
          ticketId: ticketDetail.id,
          body,
        });
        setNoteDraft('');
        applySuccess('Nota interna adicionada com sucesso.');
      }

      pendingThreadScrollRef.current = 'latest';
      await refreshDetail(ticketDetail.id);
    } catch (error) {
      pendingThreadScrollRef.current = 'idle';
      const classified = classifyAdminError(
        error,
        composerMode === 'public'
          ? 'Falha ao adicionar a resposta pública.'
          : 'Falha ao adicionar a nota interna.',
      );
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ticketDetail) {
      return;
    }

    setSubmitting(true);
    setDetailNotice(null);

    try {
      await closeTicket({
        ticketId: ticketDetail.id,
        closeReason: closeReason.trim(),
      });
      setCloseReason('');
      await refreshDetail(ticketDetail.id);
      applySuccess('Ticket fechado com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(error, 'Falha ao fechar o ticket.');
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReopen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ticketDetail) {
      return;
    }

    setSubmitting(true);
    setDetailNotice(null);

    try {
      await reopenTicket({
        ticketId: ticketDetail.id,
        reopenReason: reopenReason.trim() || null,
      });
      setReopenReason('');
      await refreshDetail(ticketDetail.id);
      applySuccess('Ticket reaberto com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(error, 'Falha ao reabrir o ticket.');
      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }
      applyFailure(classified.message);
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    setTicketInboxPage(1);
  }, [ticketInboxFilter, ticketInboxScope, ticketInboxSearch]);

  useEffect(() => {
    if (ticketInboxFilterMatchesScope(ticketInboxFilter, ticketInboxScope)) {
      return;
    }

    setTicketInboxFilter(defaultTicketInboxFilterForScope(ticketInboxScope));
  }, [ticketInboxFilter, ticketInboxScope]);

  useEffect(() => {
    setAttachmentUploadDraft(emptyAttachmentUploadDraft());
  }, [ticketDetail?.id]);

  useEffect(() => {
    setInternalActionSupportNote('');
    setInternalActionEvidenceAttachmentId('');
    setInternalActionEvidenceNote('');
  }, [selectedInternalActionId]);

  useEffect(() => {
    if (activeDrawer !== 'automation' || !selectedInternalActionId) {
      setInternalActionDetailPhase('idle');
      setInternalActionDetailMessage(null);
      setInternalActionDetail(null);
      setInternalActionTimeline([]);
      return;
    }

    void loadSelectedInternalAction(selectedInternalActionId);
  }, [activeDrawer, selectedInternalActionId]);

  useEffect(() => {
    if (ticketInboxFilteredTickets.length === 0) {
      return;
    }

    const selectedIsVisible =
      selectedTicketId !== null &&
      ticketInboxFilteredTickets.some((ticket) => ticket.id === selectedTicketId);

    if (selectedIsVisible) {
      return;
    }

    if (variant === 'queue') {
      if (selectedTicketId !== null) {
        setSelectedTicketId(null);
        setActiveDrawer('none');
        setAttachmentUploadDraft(emptyAttachmentUploadDraft());
      }
      return;
    }

    const nextSelectedTicketId = ticketInboxFilteredTickets[0]?.id ?? null;
    if (!nextSelectedTicketId) {
      return;
    }

    setSelectedTicketId(nextSelectedTicketId);
    setActiveDrawer('none');
    setAttachmentUploadDraft(emptyAttachmentUploadDraft());
    if (variant === 'tickets') {
      void navigate(`/support/tickets/${nextSelectedTicketId}`);
    }
  }, [navigate, selectedTicketId, ticketInboxFilteredTickets, variant]);

  if (backendDenied) {
    return <Navigate replace state={{ reason: 'missing-authorized-workspace' }} to="/access-denied" />;
  }

  if (phase === 'loading') {
    return focusTicketId ? <SupportTicketLoadingScaffold /> : <SupportQueueLoadingScaffold />;
  }

  if (phase === 'contract-unavailable') {
    return <ContractUnavailableState contractName="fila operacional de tickets" />;
  }

  if (phase === 'error') {
    return (
        <ErrorState
          description={pageMessage ?? 'A fila operacional não ficou disponível neste ambiente.'}
        action={<AppButton onClick={() => void loadQueue(focusTicketId ?? null)}>Tentar novamente</AppButton>}
      />
    );
  }

  const composerDraft = composerMode === 'public' ? messageDraft : noteDraft;
  const composerDisabled =
    submitting ||
    (composerMode === 'public'
      ? !ticketDetail?.canReplyNow
      : !ticketDetail?.canAddInternalNote);

  const canUsePublicComposer = ticketDetail?.canReplyNow ?? false;
  const canUseInternalComposer = ticketDetail?.canAddInternalNote ?? false;
  const knowledgeBusy = knowledgeSubmitting;
  const canCreateEngineeringHandoff =
    (ticketDetail?.canUpdateStatus ?? false) &&
    engineeringPhase !== 'contract-unavailable' &&
    engineeringPhase !== 'error';
  const selectedQueueTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;
  const previewTicket = ticketDetail ?? null;
  const selectedIntakeTenant =
    intakeDraft.tenantId
      ? intakeTenants.find((tenant) => tenant.tenantId === intakeDraft.tenantId) ?? null
      : null;
  const selectedIntakeContact =
    intakeDraft.requesterContactId
      ? intakeContacts.find((contact) => contact.id === intakeDraft.requesterContactId) ?? null
      : null;
  const selectedIntakeCategory =
    intakeDraft.categoryId
      ? ticketCategoryOptions.find((category) => category.optionId === intakeDraft.categoryId) ?? null
      : null;
  const selectedIntakeReason =
    intakeDraft.operationalReasonId
      ? classificationReasonOptions.find((reason) => reason.optionId === intakeDraft.operationalReasonId) ?? null
      : null;
  const canOpenIntake = intakePhase === 'ready' && intakeTenants.length > 0;
  const intakeActionLabel =
    intakePhase === 'contract-unavailable'
      ? 'Intake indisponível'
      : intakePhase === 'error'
        ? 'Intake com falha'
        : 'Abrir ticket';
  const intakeSubmitDisabled =
    intakeSubmitting ||
    intakePhase !== 'ready' ||
    !intakeDraft.tenantId ||
    intakeDraft.title.trim().length === 0 ||
    intakeDraft.description.trim().length === 0;
  const mineCount = currentUserAssignableAgent?.userId
    ? tickets.filter((ticket) => ticket.assignedToUserId === currentUserAssignableAgent.userId).length
    : null;
  const queueShortcuts = [
    {
      key: 'mine',
      label: 'Meus tickets',
      helper: 'fila pessoal',
      value: mineCount,
      active:
        filters.assignedToUserId !== 'all' &&
        currentUserAssignableAgent?.userId != null &&
        filters.assignedToUserId === currentUserAssignableAgent.userId,
      apply: () =>
        setFilters({
          ...filters,
          assignedToUserId: currentUserAssignableAgent?.userId ?? 'all',
        }),
      disabled: !currentUserAssignableAgent?.userId,
    },
    {
      key: 'unassigned',
      label: 'Não atribuídos',
      helper: 'pedem dono',
      value: unassigned,
      active: filters.assignedToUserId === 'unassigned',
      apply: () => setFilters({ ...filters, assignedToUserId: 'unassigned' }),
      disabled: false,
    },
    {
      key: 'urgent',
      label: 'Urgentes',
      helper: 'alta prioridade',
      value: highAttention,
      active: filters.priority === 'urgent' || filters.severity === 'critical',
      apply: () =>
        setFilters({ ...filters, priority: 'urgent', severity: 'all' }),
      disabled: false,
    },
    {
      key: 'waiting-customer',
      label: 'Aguardando cliente',
      helper: 'retorno externo',
      value: waitingCustomer,
      active: filters.status === 'waiting_customer',
      apply: () => setFilters({ ...filters, status: 'waiting_customer' }),
      disabled: false,
    },
    {
      key: 'waiting-engineering',
      label: 'Dependências internas',
      helper: 'áreas internas',
      value: waitingEngineering,
      active: filters.status === 'waiting_engineering',
      apply: () => setFilters({ ...filters, status: 'waiting_engineering' }),
      disabled: false,
    },
  ] as const;
  const activeQueueShortcut = queueShortcuts.find((shortcut) => shortcut.active)?.key ?? 'all';
  const queueSummaryItems = [
    {
      key: 'open',
      label: 'Abertos',
      value: totalOpen,
      helper: 'fila ativa',
      tone: 'default' as const,
    },
    {
      key: 'unassigned',
      label: 'Sem responsável',
      value: unassigned,
      helper: 'pedem dono',
      tone: 'attention' as const,
    },
    {
      key: 'waiting_customer',
      label: 'Aguardando cliente',
      value: waitingCustomer,
      helper: 'retorno externo',
      tone: 'warning' as const,
    },
    {
      key: 'waiting_engineering',
      label: 'Dependências internas',
      value: waitingEngineering,
      helper: 'áreas internas',
      tone: 'internal' as const,
    },
    {
      key: 'urgent',
      label: 'Urgentes',
      value: highAttention,
      helper: 'prioridade ou SLA',
      tone: 'critical' as const,
    },
  ];
  const queueSearchTerm = ticketInboxSearch.trim().toLocaleLowerCase('pt-BR');
  const queueVisibleTickets =
    queueSearchTerm.length === 0
      ? tickets
      : tickets.filter((ticket) => {
          const haystack = [
            supportTicketCode(ticket.id),
            ticket.title,
            ticketTenantLabel(ticket),
            ticket.tenantSlug ?? '',
            ticket.categoryName ?? '',
            ticket.assignedToFullName ?? '',
          ]
            .join(' ')
            .toLocaleLowerCase('pt-BR');
          return haystack.includes(queueSearchTerm);
        });
  const bulkSelectedTickets = queueVisibleTickets.filter((ticket) =>
    bulkSelectedTicketIds.includes(ticket.id),
  );
  const isQueueBulkMode = bulkSelectedTicketIds.length > 1;
  const selectedQueueContextTicket = isQueueBulkMode ? null : selectedQueueTicket;
  const requesterLabel =
    ticketDetail?.requesterContactFullName ??
    ticketDetail?.requesterContactEmail ??
    'Cliente B2B';
  const primaryCustomerContact = customer ? primaryContactFromCustomer(customer) : null;
  const customerDocumentLabel = readCustomerDocumentLabel(customer);
  const currentAssignedLabel =
    formatAssignedAgentSummary(currentAssignedAgent) ??
    ticketDetail?.assignedToFullName ??
    'Sem responsavel definido';
  const pendingCloseItems = [
    !ticketDetail?.categoryName ? 'Definir categoria operacional.' : null,
    !ticketDetail?.assignedToUserId ? 'Atribuir responsável pela tratativa.' : null,
    ticketDetail?.status === 'waiting_customer' ? 'Aguardar retorno do cliente antes do encerramento.' : null,
    ticketDetail?.status === 'waiting_engineering' ? 'Consolidar retorno da engenharia antes do encerramento.' : null,
    ticketDetail && !ticketDetail.canClose ? 'Encerramento indisponível para este ticket no momento.' : null,
  ].filter((item): item is string => Boolean(item));
  const slaProgress = ticketDetail ? approximateSlaPercent(ticketDetail) : 0;
  const slaDueAt = ticketDetail?.resolutionDueAt ?? ticketDetail?.firstResponseDueAt ?? null;

  function closeAuxiliarySurface() {
    setActiveDrawer('none');
  }

  function closeTicketIntakeModal() {
    if (intakeSubmitting) {
      return;
    }

    setShowCreateTicket(false);
    setDetailNotice(null);
  }

  function openClassificationSurface() {
    setActiveDrawer('classification');
  }

  function openStatusSurface() {
    setActiveDrawer('status');
  }

  function openKnowledgeSurface() {
    setActiveDrawer('knowledge');
  }

  function openEvidenceSurface() {
    setActiveDrawer('evidence');
  }

  function openAutomationSurface() {
    setActiveDrawer('automation');
  }

  function openHandoffSurface() {
    setActiveDrawer('handoff');
  }

  function openRelatedSurface() {
    setActiveDrawer('related');
  }

  function renderTicketIntakeModal() {
    return (
      <OperationalModal
        description="Abra um ticket com contexto claro para que o time possa agir com mais agilidade."
        labelledById="support-ticket-intake-title"
        onClose={closeTicketIntakeModal}
        open={showCreateTicket}
        title="Novo ticket"
        footer={
          intakePhase === 'ready' && intakeTenants.length > 0 ? (
            <OperationalFooterActions
              note="As informações serão registradas com trilha de auditoria."
            >
              <GhostButton
                className="rounded-[12px] px-4 text-[12px]"
                disabled={intakeSubmitting}
                onClick={closeTicketIntakeModal}
                type="button"
              >
                Cancelar
              </GhostButton>
              <AppButton
                className="rounded-[12px] px-4 text-[12px]"
                disabled={intakeSubmitDisabled}
                form="support-ticket-intake-form"
                type="submit"
              >
                {intakeSubmitting ? 'Criando ticket' : 'Criar ticket'}
              </AppButton>
            </OperationalFooterActions>
          ) : null
        }
      >
        {intakePhase === 'loading' ? (
          <LoadingState
            title="Carregando intake"
            description="Estamos preparando os clientes e contatos elegíveis para abrir ticket."
          />
        ) : intakePhase === 'contract-unavailable' ? (
          <ContractUnavailableState contractName="intake operacional de tickets" />
        ) : intakePhase === 'error' ? (
          <ErrorState
            action={<AppButton onClick={() => void loadIntakeTenants()}>Tentar novamente</AppButton>}
            description={intakeMessage ?? 'O intake operacional não ficou disponível neste ambiente.'}
          />
        ) : intakeTenants.length === 0 ? (
          <EmptyState
            title="Nenhum cliente elegível para intake"
            description="Nenhum cliente com acesso disponível foi liberado para abrir ticket nesta sessão."
          />
        ) : (
          <form
            className="support-ticket-intake-form"
            id="support-ticket-intake-form"
            onSubmit={(event) => void handleSubmitTicketIntake(event)}
          >
            <div className="support-ticket-intake-form__main">
              <section className="support-ticket-intake-form__section">
                <div className="support-ticket-intake-form__section-header">
                  <p className="support-ticket-intake-form__section-title">Informações do ticket</p>
                  <p className="support-ticket-intake-form__section-helper">Contexto mínimo para abrir a triagem.</p>
                </div>

                <OperationalFormGrid>
                  <OperationalField
                    label="Cliente B2B"
                    description="Obrigatório para abrir o ticket no escopo correto."
                    span="wide"
                  >
                    <SelectInput
                      autoFocus
                      className="support-operational-control"
                      disabled={intakeSubmitting}
                      onChange={(event) =>
                        setIntakeDraft((current) => ({
                          ...current,
                          tenantId: event.target.value as Uuid | '',
                          requesterContactId: '',
                        }))
                      }
                      value={intakeDraft.tenantId}
                    >
                      <option value="">Selecione um cliente</option>
                      {intakeTenants.map((tenant) => (
                        <option key={tenant.tenantId} value={tenant.tenantId}>
                          {intakeTenantLabel(tenant)}
                        </option>
                      ))}
                    </SelectInput>
                  </OperationalField>

                  <OperationalField label="Contato solicitante">
                    <SelectInput
                      className="support-operational-control"
                      disabled={!intakeDraft.tenantId || intakeContactsLoading || intakeSubmitting}
                      onChange={(event) =>
                        setIntakeDraft((current) => ({
                          ...current,
                          requesterContactId: event.target.value as Uuid | '',
                        }))
                      }
                      value={intakeDraft.requesterContactId}
                    >
                      <option value="">
                        {intakeContactsLoading
                          ? 'Carregando contatos'
                          : intakeContacts.length === 0
                            ? 'Indisponível'
                            : 'Sem solicitante vinculado'}
                      </option>
                      {intakeContacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {sanitizeSupportVisibleText(contact.fullName)} · {contact.email}
                        </option>
                      ))}
                    </SelectInput>
                  </OperationalField>

                  <OperationalField label="Origem">
                    <SelectInput
                      className="support-operational-control"
                      disabled={intakeSubmitting}
                      onChange={(event) =>
                        setIntakeDraft((current) => ({
                          ...current,
                          source: event.target.value as TicketSource,
                        }))
                      }
                      value={intakeDraft.source}
                    >
                      {TICKET_SOURCES.map((source) => (
                        <option key={source} value={source}>
                          {humanizeSource(source)}
                        </option>
                      ))}
                    </SelectInput>
                  </OperationalField>

                  <OperationalField label="Prioridade">
                    <SelectInput
                      className="support-operational-control"
                      disabled={intakeSubmitting}
                      onChange={(event) =>
                        setIntakeDraft((current) => ({
                          ...current,
                          priority: event.target.value as TicketPriority,
                        }))
                      }
                      value={intakeDraft.priority}
                    >
                      {TICKET_PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {humanizePriority(priority)}
                        </option>
                      ))}
                    </SelectInput>
                  </OperationalField>

                  <OperationalField label="Severidade">
                    <SelectInput
                      className="support-operational-control"
                      disabled={intakeSubmitting}
                      onChange={(event) =>
                        setIntakeDraft((current) => ({
                          ...current,
                          severity: event.target.value as TicketSeverity,
                        }))
                      }
                      value={intakeDraft.severity}
                    >
                      {TICKET_SEVERITIES.map((severity) => (
                        <option key={severity} value={severity}>
                          {humanizeSeverity(severity)}
                        </option>
                      ))}
                    </SelectInput>
                  </OperationalField>

                  <OperationalField label="Categoria operacional">
                    <SelectInput
                      className="support-operational-control"
                      disabled={intakeSubmitting || ticketCategoryOptions.length === 0}
                      onChange={(event) =>
                        setIntakeDraft((current) => ({
                          ...current,
                          categoryId: event.target.value as Uuid | '',
                          operationalReasonId: event.target.value ? current.operationalReasonId : '',
                        }))
                      }
                      value={intakeDraft.categoryId}
                    >
                      <option value="">Indisponível/sem categoria inicial</option>
                      {ticketCategoryOptions.map((category) => (
                        <option key={category.optionId} value={category.optionId}>
                          {category.name}
                        </option>
                      ))}
                    </SelectInput>
                  </OperationalField>

                  <OperationalField label="Motivo operacional inicial" span="wide">
                    <SelectInput
                      className="support-operational-control"
                      disabled={
                        intakeSubmitting ||
                        !intakeDraft.categoryId ||
                        classificationReasonOptions.length === 0
                      }
                      onChange={(event) =>
                        setIntakeDraft((current) => ({
                          ...current,
                          operationalReasonId: event.target.value as Uuid | '',
                        }))
                      }
                      value={intakeDraft.operationalReasonId}
                    >
                      <option value="">Sem motivo inicial</option>
                      {classificationReasonOptions.map((reason) => (
                        <option key={reason.optionId} value={reason.optionId}>
                          {reason.name}
                        </option>
                      ))}
                    </SelectInput>
                  </OperationalField>
                </OperationalFormGrid>

                {classificationOptionsMessage ? (
                  <InlineNotice tone="warning">{classificationOptionsMessage}</InlineNotice>
                ) : null}

                {intakeContactsMessage ? (
                  <InlineNotice tone="warning">{intakeContactsMessage}</InlineNotice>
                ) : null}

                {!intakeContactsLoading &&
                intakeDraft.tenantId &&
                intakeContacts.length === 0 ? (
                  <InlineNotice>
                    Nenhum contato ativo apareceu para este cliente. O ticket pode ser aberto
                    sem solicitante vinculado se a plataforma aceitar esse contexto.
                  </InlineNotice>
                ) : null}

                <div className="support-ticket-intake-form__subsection">
                  <div>
                    <p className="support-ticket-intake-form__section-title">Assunto e contexto</p>
                    <p className="support-ticket-intake-form__section-helper">Descreva o impacto para iniciar a análise.</p>
                  </div>
                </div>

                {detailNotice && detailNoticeTone === 'critical' ? (
                  <InlineNotice tone="critical">{detailNotice}</InlineNotice>
                ) : null}

                <OperationalFormGrid>
                  <OperationalField label="Título" span="wide">
                    <TextInput
                      className="support-operational-control"
                      disabled={intakeSubmitting}
                      onChange={(event) =>
                        setIntakeDraft((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Resumo objetivo do caso operacional"
                      value={intakeDraft.title}
                    />
                  </OperationalField>

                  <OperationalField label="Descrição" span="wide">
                    <TextareaInput
                      className="support-operational-control support-operational-control--textarea"
                      disabled={intakeSubmitting}
                      onChange={(event) =>
                        setIntakeDraft((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Contexto mínimo para iniciar a triagem."
                      rows={4}
                      value={intakeDraft.description}
                    />
                  </OperationalField>
                </OperationalFormGrid>
                <div className="support-ticket-intake-form__evidence">
                  <div className="support-ticket-intake-form__evidence-icon">
                    <SupportSurfaceIcon className="h-[15px] w-[15px]" kind="attachment" />
                  </div>
                  <div className="min-w-0">
                    <p>Anexe evidências quando ajudarem na análise.</p>
                    <span>Arquivos podem ser adicionados na tratativa assim que o ticket for criado.</span>
                  </div>
                  <button disabled type="button">Disponível após criar ticket</button>
                </div>
              </section>
            </div>

            <aside className="support-ticket-intake-form__aside">
              <section className="support-ticket-intake-form__summary">
                <div className="support-ticket-intake-form__summary-header">
                  <p className="support-ticket-intake-form__section-title">Resumo do ticket</p>
                  <span>Novo</span>
                </div>
                <dl className="support-ticket-intake-form__summary-list">
                  <div>
                    <dt>Cliente</dt>
                    <dd>{selectedIntakeTenant ? intakeTenantLabel(selectedIntakeTenant) : 'Indisponível'}</dd>
                  </div>
                  <div>
                    <dt>Conta</dt>
                    <dd>
                      {selectedIntakeTenant
                        ? `${humanizeTenantStatus(selectedIntakeTenant.tenantStatus)} · ${selectedIntakeTenant.activeContactsCount} contatos`
                        : 'Indisponível'}
                    </dd>
                  </div>
                  <div>
                    <dt>Solicitante</dt>
                    <dd>{sanitizeSupportVisibleText(selectedIntakeContact?.fullName)}</dd>
                  </div>
                  <div>
                    <dt>Origem</dt>
                    <dd>{humanizeSource(intakeDraft.source)}</dd>
                  </div>
                  <div>
                    <dt>Prioridade</dt>
                    <dd>{humanizePriority(intakeDraft.priority)}</dd>
                  </div>
                  <div>
                    <dt>Severidade</dt>
                    <dd>{humanizeSeverity(intakeDraft.severity)}</dd>
                  </div>
                  <div>
                    <dt>Classificação</dt>
                    <dd>{selectedIntakeCategory?.name ?? 'Indisponível'}</dd>
                  </div>
                  <div>
                    <dt>Motivo</dt>
                    <dd>{selectedIntakeReason?.name ?? 'Indisponível'}</dd>
                  </div>
                </dl>
              </section>
              <section className="support-ticket-intake-form__summary support-ticket-intake-form__summary--sla">
                <p className="support-ticket-intake-form__section-title">SLA estimado</p>
                <div className="support-ticket-intake-form__sla-row">
                  <span>Status</span>
                  <strong>Indisponível</strong>
                </div>
                <div className="support-ticket-intake-form__sla-row">
                  <span>Previsão de resposta</span>
                  <strong>Indisponível</strong>
                </div>
                <p>O prazo será calculado após a criação, conforme a política operacional configurada.</p>
              </section>
            </aside>
          </form>
        )}
      </OperationalModal>
    );
  }

  function renderBlueprintLayout() {
    if (!ticketDetail || !selectedTicketSummary) {
      return null;
    }

    const detail = ticketDetail;
    const contextRailTitle =
      activeDrawer === 'classification'
        ? 'Classificar conversa'
        : activeDrawer === 'status'
          ? 'Alterar status'
        : activeDrawer === 'evidence'
          ? 'Evidências e relacionados'
              : activeDrawer === 'knowledge'
                ? 'Conhecimento relacionado'
                : activeDrawer === 'automation'
              ? 'Acionamentos'
              : activeDrawer === 'handoff'
                ? 'Handoff técnico'
                : activeDrawer === 'related'
                  ? 'Relacionados'
              : null;
    const contextRailSubtitle =
      activeDrawer === 'classification'
        ? 'Classifique este ticket para ajudar na triagem e na análise do time.'
        : activeDrawer === 'status'
          ? 'Atualize o andamento da tratativa sem sair da conversa.'
        : activeDrawer === 'evidence'
          ? 'Anexe e consulte evidências sem expor armazenamento interno.'
              : activeDrawer === 'knowledge'
                ? 'Busque artigos seguros e vínculos usados nesta conversa.'
                : activeDrawer === 'automation'
              ? 'Acione outras áreas para apoiar na resolução deste ticket.'
              : activeDrawer === 'handoff'
                ? 'Escalone para engenharia mantendo o ticket como fonte da tratativa.'
                : activeDrawer === 'related'
                  ? 'Consulte tickets, artigos e vínculos disponíveis para este caso.'
              : null;
    const contextRailDrawerSize = supportActionDrawerSize(activeDrawer);
    const contextRailWidthVariant = supportActionDrawerWidthVariant(activeDrawer);
    const workspaceTabs = [
      { key: 'conversation', label: 'Conversa', count: null },
      { key: 'details', label: 'Detalhes', count: null },
      { key: 'activities', label: 'Atividades', count: timelineWindow.entries.length },
      { key: 'related', label: 'Relacionados', count: knowledgeLinks.length + engineeringLinks.length },
      { key: 'sla', label: 'SLA', count: null },
      { key: 'history', label: 'Histórico', count: null },
    ] as const;
    const workspaceTabPanel =
      workspaceTab === 'conversation' ? (
        <SupportConversation
          loadingMore={timelineLoadingMore}
          onLoadMore={() => void handleLoadOlderTimeline()}
          requesterName={requesterLabel}
          window={timelineWindow}
        />
      ) : workspaceTab === 'details' ? (
        <div className="support-ticket-tab-panel">
          <h3>Detalhes do ticket</h3>
          <div className="support-ticket-tab-grid">
            <span><small>Status</small><strong>{compactTicketStatusLabel(detail.status)}</strong></span>
            <span><small>Prioridade</small><strong>{humanizePriority(detail.priority)}</strong></span>
            <span><small>Severidade</small><strong>{humanizeSeverity(detail.severity)}</strong></span>
            <span><small>Categoria</small><strong>{detail.categoryName ?? 'Indisponível'}</strong></span>
            <span><small>Origem</small><strong>{detail.originLabel ?? humanizeSource(detail.source)}</strong></span>
            <span><small>Canal</small><strong>{detail.channelLabel ?? 'Indisponível'}</strong></span>
            <span><small>Solicitante</small><strong>{requesterLabel}</strong></span>
            <span><small>Responsável</small><strong>{currentAssignedLabel}</strong></span>
          </div>
        </div>
      ) : workspaceTab === 'activities' ? (
        <div className="support-ticket-tab-panel">
          <h3>Atividades</h3>
          <SupportTechnicalHistory window={timelineWindow} />
        </div>
      ) : workspaceTab === 'related' ? (
        <div className="support-ticket-tab-panel">
          <h3>Relacionados</h3>
          <div className="support-ticket-tab-list">
            {knowledgeLinks.length === 0 && engineeringLinks.length === 0 ? (
              <InlineNotice>Nenhum vínculo operacional apareceu para este ticket.</InlineNotice>
            ) : (
              <>
                {knowledgeLinks.slice(0, 4).map((link) => (
                  <article key={link.ticketKnowledgeLinkId}>
                    <strong>{link.articleTitle ?? 'Artigo indisponível'}</strong>
                    <span>
                      {humanizeKnowledgeLinkType(link.linkType)} · {link.articleVisibility ? humanizeKnowledgeVisibility(link.articleVisibility) : 'Visibilidade indisponível'}
                    </span>
                  </article>
                ))}
                {engineeringLinks.slice(0, 4).map((link) => (
                  <article key={link.engineeringTicketLinkId}>
                    <strong>{link.workItemTitle}</strong>
                    <span>{humanizeEngineeringWorkItemType(link.workItemType)} · {humanizeEngineeringWorkItemStatus(link.workItemStatus)}</span>
                  </article>
                ))}
              </>
            )}
          </div>
        </div>
      ) : workspaceTab === 'sla' ? (
        <div className="support-ticket-tab-panel">
          <h3>SLA</h3>
          <div className="support-ticket-tab-grid">
            <span><small>Política</small><strong>{detail.slaPolicyName ?? 'Fallback interno'}</strong></span>
            <span><small>Referência</small><strong>{detail.slaReference || 'Governança operacional'}</strong></span>
            <span><small>Resposta</small><strong>{slaDueAt ? formatDateTime(slaDueAt) : 'Indisponível'}</strong></span>
            <span><small>Resolução</small><strong>{detail.resolutionDueAt ? formatDateTime(detail.resolutionDueAt) : 'Indisponível'}</strong></span>
          </div>
        </div>
      ) : (
        <div className="support-ticket-tab-panel">
          <h3>Histórico</h3>
          <SupportConversation
            loadingMore={timelineLoadingMore}
            onLoadMore={() => void handleLoadOlderTimeline()}
            requesterName={requesterLabel}
            window={timelineWindow}
          />
        </div>
      );

    const quickActions = [
      {
        key: 'classification',
        icon: <SupportSurfaceIcon className="h-[12px] w-[12px]" kind="filter" />,
        label: 'Classificar',
        onClick: openClassificationSurface,
      },
      {
        key: 'status',
        icon: <SupportSurfaceIcon className="h-[12px] w-[12px]" kind="clock" />,
        label: 'Alterar status',
        onClick: openStatusSurface,
      },
      {
        key: 'evidence',
        icon: <SupportSurfaceIcon className="h-[12px] w-[12px]" kind="attachment" />,
        label: 'Evidências',
        onClick: openEvidenceSurface,
      },
      {
        key: 'knowledge',
        icon: <SupportSurfaceIcon className="h-[12px] w-[12px]" kind="open" />,
        label: 'Conhecimento',
        onClick: openKnowledgeSurface,
      },
      {
        key: 'automation',
        icon: <SupportSurfaceIcon className="h-[12px] w-[12px]" kind="alert" />,
        label: 'Acionamentos',
        onClick: openAutomationSurface,
      },
      {
        key: 'related',
        icon: <SupportSurfaceIcon className="h-[12px] w-[12px]" kind="open" />,
        label: 'Relacionados',
        onClick: openRelatedSurface,
      },
    ];

    const defaultRail = (
      <SupportTicketRightRail
        assigneeOptions={assignableAgents.map((agent) => ({
          id: agent.userId,
          label: formatAssignableAgentLabel(agent),
        }))}
        assignedLabel={currentAssignedLabel}
        assignmentSubmitting={submitting}
        assignmentValue={assignDraft}
        categoryLabel={detail.categoryName ?? 'Indisponível'}
        customerDocumentLabel={customerDocumentLabel ?? 'Indisponível'}
        priorityIndicator={<span className="text-[color:var(--color-brand-pink)]">↑</span>}
        priorityLabel={humanizePriority(detail.priority)}
        quickActions={quickActions}
        relatedArticles={filteredKnowledgeArticles.slice(0, 3).map((article) => ({
          id: article.articleId,
          title: article.articleTitle,
          summary: article.articleSummary,
        }))}
        requesterLabel={requesterLabel}
        onAssignmentChange={setAssignDraft}
        onAssignmentSubmit={() => void runAssignment(assignDraft.trim() || null)}
        resolutionDueLabel={detail.resolutionDueAt ? formatDateTime(detail.resolutionDueAt) : 'Indisponível'}
        slaDueLabel={slaDueAt ? formatDateTime(slaDueAt) : 'Indisponível'}
        slaPolicyName={detail.slaPolicyName ?? 'Fallback interno'}
        slaPriorityBadge={
          <CompactSupportPill tone={toneForPriority(detail.priority)}>
            {humanizePriority(detail.priority)}
          </CompactSupportPill>
        }
        slaProgress={slaProgress}
        slaReference={detail.slaReference || 'Governança interna urgente'}
        slaRemainingLabel={formatRemainingTimeLabel(slaDueAt)}
        sourceBadge={
          <CompactSupportPill>
            {detail.originLabel ?? humanizeSource(detail.source)} · {detail.channelLabel ?? 'Canal indisponível'}
          </CompactSupportPill>
        }
        statusLabel={compactTicketStatusLabel(detail.status)}
        tenantLabel={sanitizeSupportVisibleText(detail.tenantDisplayName ?? detail.tenantLegalName)}
      />
    );

    const contextPanel =
      activeDrawer === 'classification' ? (
        <SupportClassificationDrawerPanel
          classificationDraft={classificationDraft}
          classificationOptionsMessage={classificationOptionsMessage}
          classificationReasonOptions={classificationReasonOptions}
          humanizePriority={humanizePriority}
          humanizeSeverity={humanizeSeverity}
          onClassificationDraftChange={(patch) =>
            setClassificationDraft((current) => ({
              ...current,
              ...patch,
            }))
          }
          onPrioritySeverityDraftChange={(patch) =>
            setPrioritySeverityDraft((current) => ({
              ...current,
              ...patch,
            }))
          }
          priorityReasonOptions={priorityReasonOptions}
          prioritySeverityDraft={prioritySeverityDraft}
          submitting={submitting}
          ticketCategoryOptions={ticketCategoryOptions}
        />
      ) : activeDrawer === 'status' ? (
        <SupportStatusDrawerPanel
          humanizeStatus={humanizeStatus}
          nextStatusChoices={buildStatusChoices(detail.status, detail.allowedNextStatuses)}
          onStatusDraftChange={(status) => {
            setStatusDraft(status);
            setStatusReasonId('');
          }}
          onStatusNoteChange={setStatusNote}
          onStatusReasonChange={setStatusReasonId}
          onSubmit={(event) => void handleUpdateStatus(event)}
          requireStatusReason={requiresOperationalReasonForStatus(statusDraft)}
          statusDraft={statusDraft}
          statusNote={statusNote}
          statusReasonId={statusReasonId}
          statusReasonOptions={statusReasonOptions}
          submitting={submitting}
          ticketDetail={detail}
        />
      ) : activeDrawer === 'knowledge' ? (
        <SupportKnowledgeDrawerPanel
          articles={filteredKnowledgeArticles}
          humanizeKnowledgeLinkType={humanizeKnowledgeLinkType}
          humanizeKnowledgeStatus={humanizeKnowledgeStatus}
          humanizeKnowledgeVisibility={humanizeKnowledgeVisibility}
          links={knowledgeLinks}
          loading={knowledgeSubmitting || knowledgePhase === 'loading'}
          noteDraft={knowledgeNoteDraft}
          onArchive={(linkId) => void handleArchiveKnowledgeLink(linkId)}
          onCopyPublicLink={handleCopyPublicKnowledgeLink}
          onLinkInternal={(articleId) => void handleLinkKnowledgeArticle(articleId, 'reference_internal')}
          onMarkGap={() => void handleMarkDocumentationGap()}
          onNeedsUpdate={(articleId) => void handleMarkKnowledgeNeedsUpdate(articleId)}
          onNoteChange={setKnowledgeNoteDraft}
          onSearchChange={setKnowledgeSearch}
          onSendToCustomer={(articleId) => void handleLinkKnowledgeArticle(articleId, 'sent_to_customer')}
          search={knowledgeSearch}
        />
      ) : activeDrawer === 'evidence' ? (
        <SupportEvidenceDrawerPanel
          attachmentUploadDraft={attachmentUploadDraft}
          attachments={attachments}
          formatAttachmentSize={formatAttachmentSize}
          onNoteChange={(value) =>
            setAttachmentUploadDraft((current) => ({
              ...current,
              note: value,
            }))
          }
          onRemoveDraftFile={handleRemoveDraftAttachment}
          onSelectFiles={() => attachmentInputRef.current?.click()}
        />
      ) : activeDrawer === 'automation' ? (
        <SupportInternalActionsDrawerPanel
          attachmentKind={attachmentKind}
          attachments={attachments}
          formatAttachmentSize={formatAttachmentSize}
          humanizeAttachmentStatus={humanizeAttachmentStatus}
          humanizePriority={humanizePriority}
          internalActionDetail={internalActionDetail}
          internalActionDetailMessage={internalActionDetailMessage}
          internalActionDetailPhase={internalActionDetailPhase}
          internalActionCreateDraft={internalActionCreateDraft}
          internalActionEvidenceAttachmentId={internalActionEvidenceAttachmentId}
          internalActionEvidenceNote={internalActionEvidenceNote}
          internalActionSubmitting={internalActionSubmitting}
          internalActionSupportNote={internalActionSupportNote}
          internalActionTargetAreas={internalActionTargetAreas}
          internalActionTargetAreasMessage={internalActionTargetAreasMessage}
          internalActionTargetAreasPhase={internalActionTargetAreasPhase}
          internalActions={internalActions}
          internalActionsMessage={internalActionsMessage}
          internalActionsPhase={internalActionsPhase}
          onAcceptReturn={() => void handleAcceptInternalActionReturn()}
          onCloseAction={() => void handleCloseInternalAction()}
          onCreateDraftChange={(patch) =>
            setInternalActionCreateDraft((current) => ({
              ...current,
              ...patch,
            }))
          }
          onCreateSubmit={(event) => void handleCreateInternalAction(event)}
          onEvidenceAttachmentChange={setInternalActionEvidenceAttachmentId}
          onEvidenceNoteChange={setInternalActionEvidenceNote}
          onLinkEvidence={() => void handleLinkInternalActionEvidence()}
          onOpenHandoff={openHandoffSurface}
          onRequestFollowup={() => void handleRequestInternalActionFollowup()}
          onSelectInternalAction={setSelectedInternalActionId}
          onSupportNoteChange={setInternalActionSupportNote}
          selectedInternalActionId={selectedInternalActionId}
          timelineEntries={internalActionTimeline}
          toneForAttachmentStatus={toneForAttachmentStatus}
          toneForPriority={toneForPriority}
        />
      ) : activeDrawer === 'handoff' ? (
        <SupportEngineeringHandoffDrawerPanel
          attachments={attachments}
          canCreateEngineeringHandoff={canCreateEngineeringHandoff}
          handoffDraft={handoffDraft}
          handoffSubmitting={handoffSubmitting}
          humanizeEngineeringWorkItemType={humanizeEngineeringWorkItemType}
          onEngineeringHandoffDraftChange={(patch) =>
            setHandoffDraft((current) => ({
              ...current,
              ...patch,
            }))
          }
          onEngineeringHandoffSubmit={(event) => void handleCreateEngineeringHandoff(event)}
        />
      ) : activeDrawer === 'related' ? (
        <SupportRelatedDrawerPanel
          attachmentKind={attachmentKind}
          attachments={attachments}
          compactTicketStatusLabel={compactTicketStatusLabel}
          engineeringLinks={engineeringLinks}
          formatAttachmentSize={formatAttachmentSize}
          humanizeEngineeringWorkItemStatus={humanizeEngineeringWorkItemStatus}
          humanizeEngineeringWorkItemType={humanizeEngineeringWorkItemType}
          humanizeKnowledgeLinkType={humanizeKnowledgeLinkType}
          humanizePriority={humanizePriority}
          humanizeSeverity={humanizeSeverity}
          knowledgeLinks={knowledgeLinks}
          recentTickets={customerRecentTickets.tickets.filter((ticket) => ticket.id !== detail.id).slice(0, 4)}
          supportTicketCode={supportTicketCode}
          toneForTicketStatus={toneForTicketStatus}
        />
      ) : null;

    const contextRailFooter =
      activeDrawer === 'classification' ? (
        <div className="support-drawer-footer-actions">
          <GhostButton className="support-drawer-footer-button" onClick={closeAuxiliarySurface} type="button">
            Cancelar
          </GhostButton>
          <AppButton
            className="support-drawer-footer-button"
            disabled={submitting || !classificationDraft.categoryId}
            onClick={() => void handleSaveClassificationDrawer()}
            type="button"
          >
            {submitting ? 'Salvando...' : 'Salvar classificação'}
          </AppButton>
        </div>
      ) : activeDrawer === 'status' ? (
        <div className="support-drawer-footer-actions">
          <GhostButton className="support-drawer-footer-button" onClick={closeAuxiliarySurface} type="button">
            Cancelar
          </GhostButton>
          <AppButton
            className="support-drawer-footer-button"
            disabled={
              submitting ||
              !detail.canUpdateStatus ||
              buildStatusChoices(detail.status, detail.allowedNextStatuses).length === 0
            }
            form="support-ticket-status-form"
            type="submit"
          >
            {submitting ? 'Salvando...' : 'Salvar status'}
          </AppButton>
        </div>
      ) : activeDrawer === 'evidence' ? (
        <div className="support-drawer-footer-actions">
          <GhostButton className="support-drawer-footer-button" onClick={closeAuxiliarySurface} type="button">
            Cancelar
          </GhostButton>
          <AppButton
            className="support-drawer-footer-button"
            disabled={attachmentSubmitting || attachmentUploadDraft.files.length === 0}
            onClick={() => void handleSubmitAttachmentUpload()}
            type="button"
          >
            {attachmentSubmitting ? 'Enviando...' : 'Anexar evidência'}
          </AppButton>
        </div>
      ) : activeDrawer === 'handoff' ? (
        <div className="support-drawer-footer-actions">
          <GhostButton className="support-drawer-footer-button" onClick={closeAuxiliarySurface} type="button">
            Cancelar
          </GhostButton>
          <AppButton
            className="support-drawer-footer-button"
            disabled={
              handoffSubmitting ||
              !canCreateEngineeringHandoff ||
              handoffDraft.title.trim().length === 0 ||
              handoffDraft.description.trim().length === 0
            }
            form="support-engineering-handoff-form"
            type="submit"
          >
            {handoffSubmitting ? 'Escalando...' : 'Escalar para engenharia'}
          </AppButton>
        </div>
      ) : null;

    const contextRail = (
      <SupportTicketContextRail
        defaultRail={defaultRail}
        drawerSize={contextRailDrawerSize}
        footer={contextRailFooter}
        onClose={closeAuxiliarySurface}
        panel={contextPanel}
        subtitle={contextRailSubtitle}
        title={contextRailTitle}
      />
    );

    return (
      <>
        <SupportWorkspaceGrid
          mainPane={
            <SupportTicketConversationSection
              composer={
                <SupportTicketComposerSection
                  attachmentIcon={<SupportSurfaceIcon className="h-[13px] w-[13px]" kind="attachment" />}
                  canUseInternalComposer={canUseInternalComposer}
                  canUsePublicComposer={canUsePublicComposer}
                  composerDisabled={composerDisabled}
                  composerDraft={composerDraft}
                  composerMode={composerMode}
                  publicReplyLabel={
                    detail.replyMode === 'customer_portal_public_reply'
                      ? 'Resposta pública via Portal'
                      : 'Resposta pública registrada no ticket'
                  }
                  publicReplyUnavailableReason={
                    detail.reasonIfUnavailable
                      ? sanitizeSupportVisibleText(detail.reasonIfUnavailable)
                      : null
                  }
                  onComposerDraftChange={(value) =>
                    composerMode === 'public' ? setMessageDraft(value) : setNoteDraft(value)
                  }
                  onOpenEvidenceSurface={openEvidenceSurface}
                  onOpenStatusSurface={() => {
                    setStatusDraft((current) =>
                      buildStatusChoices(detail.status, detail.allowedNextStatuses).includes(current)
                        ? current
                        : buildStatusChoices(detail.status, detail.allowedNextStatuses)[0] ?? 'triage',
                    );
                    openStatusSurface();
                  }}
                  onSelectInternalMode={() => setComposerMode('internal')}
                  onSelectPublicMode={() => setComposerMode('public')}
                  onSubmit={handleSubmitComposer}
                  submitting={submitting}
                />
              }
              detailNotice={detailNotice}
              detailNoticeTone={detailNoticeTone}
              header={
                <SupportTicketWorkspaceHeader
                  badges={
                    <>
                      <CompactSupportPill tone={toneForTicketStatus(detail.status)}>
                        {compactTicketStatusLabel(detail.status)}
                      </CompactSupportPill>
                      <CompactSupportPill tone={toneForPriority(detail.priority)}>
                        {humanizePriority(detail.priority)}
                      </CompactSupportPill>
                    </>
                  }
                  menuAction={
                    <SupportIconActionButton
                      ariaLabel="Mais ações do ticket"
                      className="h-8 w-8 rounded-[10px]"
                    >
                      <SupportSurfaceIcon className="h-[13px] w-[13px]" kind="more" />
                    </SupportIconActionButton>
                  }
                  assignedLabel={currentAssignedLabel}
                  requesterLabel={requesterLabel}
                  ticketCode={supportTicketCode(detail.id)}
                  title={detail.title}
                />
              }
              tabs={
                <div className="flex flex-wrap items-center gap-x-1 px-3 pt-1 sm:px-5" role="tablist" aria-label="Seções da tratativa">
                  {workspaceTabs.map((tab) => (
                    <button
                      aria-selected={workspaceTab === tab.key}
                      className={cx(
                        'inline-flex min-h-9 items-center gap-1.5 border-b-2 px-2 text-xs',
                        workspaceTab === tab.key
                          ? 'border-[color:var(--minimal-action)] font-medium text-[color:var(--minimal-text)]'
                          : 'border-transparent text-[color:var(--minimal-text-secondary)]',
                      )}
                      key={tab.key}
                      onClick={() => setWorkspaceTab(tab.key)}
                      role="tab"
                      type="button"
                    >
                      <span>{tab.label}</span>
                      {tab.count !== null ? (
                        <small className="text-[10px] text-[color:var(--minimal-text-tertiary)]">{tab.count}</small>
                      ) : null}
                    </button>
                  ))}
                </div>
              }
              thread={workspaceTabPanel}
              threadScrollRef={threadScrollContainerRef}
            />
          }
          queuePanel={
            <SupportTicketQueue
              activeTab={ticketInboxFilter}
              canGoNext={safeTicketInboxPage < ticketInboxTotalPages}
              canGoPrevious={safeTicketInboxPage > 1}
              currentPageLabel={safeTicketInboxPage}
              filterIcon={<SupportSurfaceIcon className="h-[14px] w-[14px]" kind="filter" />}
              onNextPage={() => setTicketInboxPage((current) => Math.min(ticketInboxTotalPages, current + 1))}
              onPreviousPage={() => setTicketInboxPage((current) => Math.max(1, current - 1))}
              onReset={resetTicketInboxFilters}
              onScopeChange={handleChangeTicketInboxScope}
              onSearchChange={setTicketInboxSearch}
              onTabChange={(tabKey) => setTicketInboxFilter(tabKey as TicketInboxFilter)}
              pageLabel={
                <>
                  {ticketInboxStart}-{ticketInboxEnd} de {ticketInboxFilteredTickets.length}
                </>
              }
              scope={ticketInboxScope}
              scopeCounts={ticketInboxScopeCounts}
              search={ticketInboxSearch}
              searchIcon={<SupportSurfaceIcon className="h-[14px] w-[14px]" kind="search" />}
              tabs={ticketInboxTabs}
              ticketsContent={
                ticketInboxVisibleTickets.length === 0 ? (
                  <InlineNotice>Nenhum ticket encontrado com os filtros atuais.</InlineNotice>
                ) : (
                  <div className="space-y-2">
                    {ticketInboxVisibleTickets.map((ticket) => (
                      <SupportTicketInboxItem
                        isSelected={ticket.id === selectedTicketId}
                        key={ticket.id}
                        onSelect={() => handleSelectTicket(ticket.id)}
                        ticket={ticket}
                      />
                    ))}
                  </div>
                )
              }
              totalCount={ticketInboxScopeTickets.length}
            />
          }
          rightPaneWidth={contextRailWidthVariant}
          rightRail={contextRail}
          showDrawer={false}
        />
        <input
          accept={TICKET_ATTACHMENT_ACCEPT}
          className="hidden"
          multiple
          onChange={(event) => void handleAttachmentSelection(event.currentTarget.files)}
          ref={attachmentInputRef}
          type="file"
        />
      </>
    );
  }

  return (
    <div
      className={cx(
        variant === 'tickets'
          ? 'gso-screen-frame flex h-full min-h-0 flex-col overflow-hidden'
          : 'gso-screen-frame flex h-full min-h-0 flex-col gap-[var(--workspace-panel-gap)] overflow-hidden',
      )}
    >
      {variant === 'tickets' ? (
        <section className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-4 py-2 sm:px-5">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-[color:var(--minimal-text)]">
              Tickets
            </h1>
          </div>

            <div className="flex items-center gap-1">
              <button
                className="h-8 rounded-md px-2.5 text-xs text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)]"
                disabled={!ticketDetail}
                onClick={() => {
                  if (ticketDetail) {
                    window.open(`/portal/tickets/${ticketDetail.id}`, '_blank', 'noopener,noreferrer');
                  }
                }}
                type="button"
              >
                Ver no portal
              </button>
              <button
                className="h-8 rounded-md px-2.5 text-xs text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)]"
                disabled={!ticketDetail}
                onClick={openRelatedSurface}
                type="button"
              >
                Mais ações
              </button>
            </div>
        </section>
      ) : null}

      {variant === 'queue' ? (
        <section className="flex shrink-0 items-center justify-between gap-4 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-lg font-semibold tracking-[-0.02em]">Fila operacional</h1>
              <span className="text-xs text-[color:var(--minimal-text-secondary)]">
                {queueTotalCount.toLocaleString('pt-BR')} ticket(s) no recorte
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[color:var(--minimal-text-secondary)]">
              {queueSummaryItems.slice(0, 4).map((item) => (
                <span key={`queue-summary:${item.key}`}>
                  <strong className="font-medium text-[color:var(--minimal-text)]">
                    {item.value}
                  </strong>{' '}
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              aria-label="Recarregar fila"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
              onClick={() => void loadQueue(focusTicketId ?? null)}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path d="M19 8a7 7 0 1 0 1 5M19 4v4h-4" />
              </svg>
            </button>
            <button
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-[color:var(--minimal-action)] bg-[color:var(--minimal-action)] px-3.5 text-sm font-medium text-[color:var(--minimal-action-ink)] hover:bg-[color:var(--minimal-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)] disabled:cursor-not-allowed disabled:opacity-55"
                disabled={!canOpenIntake}
                onClick={() => {
                  setBulkSelectedTicketIds([]);
                  setSelectedTicketId(null);
                  setShowCreateTicket(true);
                  setDetailNotice(null);
                  if (!intakeDraft.tenantId && intakeTenants[0]?.tenantId) {
                    setIntakeDraft((current) => ({
                      ...current,
                      tenantId: intakeTenants[0]?.tenantId ?? '',
                    }));
                  }
                }}
              type="button"
              >
                {intakeActionLabel}
            </button>
          </div>
        </section>
      ) : null}

      {variant === 'queue' ? (
        <div
          className={cx(
            'grid min-h-0 flex-1 overflow-hidden bg-[color:var(--minimal-surface)]',
            selectedQueueContextTicket || isQueueBulkMode
              ? 'xl:grid-cols-[minmax(720px,1fr)_320px]'
              : 'grid-cols-1',
          )}
        >
          <section className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-[color:var(--minimal-border)]">
            <div className="shrink-0 border-b border-[color:var(--minimal-border)] px-3 py-2 sm:px-4">
              <FilterTabs
                ariaLabel="Recortes da fila"
                activeId={activeQueueShortcut}
                items={[
                  { id: 'all', label: 'Todos', count: queueTotalCount },
                  ...queueShortcuts.map((shortcut) => ({
                    id: shortcut.key,
                    label: shortcut.label.replace('Meus tickets', 'Meus'),
                    count: shortcut.value ?? 0,
                    disabled: shortcut.disabled,
                  })),
                ]}
                onChange={(id) => {
                  if (id === 'all') {
                    setFilters(emptyFilters());
                    return;
                  }
                  queueShortcuts.find((shortcut) => shortcut.key === id)?.apply();
                }}
              />
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[color:var(--minimal-border)] px-4 py-3">
              <SupportSearchInput
                className="min-w-[240px] max-w-md"
                icon={<SupportSurfaceIcon className="h-[15px] w-[15px]" kind="search" />}
                onChange={setTicketInboxSearch}
                placeholder="Buscar por ID, cliente, assunto ou contato..."
                value={ticketInboxSearch}
              />
              <button
                aria-expanded={showQueueFilters}
                className={cx(
                  'inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]',
                  showQueueFilters
                    ? 'border-[color:var(--minimal-action)] bg-[color:var(--minimal-selection)] text-[color:var(--minimal-selection-text)]'
                    : 'border-[color:var(--minimal-border-strong)] text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)]',
                )}
                onClick={() => setShowQueueFilters((current) => !current)}
                type="button"
              >
                <SupportSurfaceIcon className="h-[15px] w-[15px]" kind="filter" />
                Filtros
              </button>
              {filters.status !== 'all' ? (
                <button
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[color:var(--minimal-surface-muted)] px-2.5 text-xs text-[color:var(--minimal-text-secondary)]"
                  onClick={() => setFilters({ ...filters, status: 'all' })}
                  type="button"
                >
                  Status: {humanizeStatus(filters.status)}
                  <SupportSurfaceIcon className="h-[12px] w-[12px]" kind="close" />
                </button>
              ) : null}
              {filters.priority !== 'all' ? (
                <button
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[color:var(--minimal-surface-muted)] px-2.5 text-xs text-[color:var(--minimal-text-secondary)]"
                  onClick={() => setFilters({ ...filters, priority: 'all' })}
                  type="button"
                >
                  Prioridade: {humanizePriority(filters.priority)}
                  <SupportSurfaceIcon className="h-[12px] w-[12px]" kind="close" />
                </button>
              ) : null}
              <button
                className="ml-auto text-xs text-[color:var(--minimal-text-secondary)] hover:text-[color:var(--minimal-text)]"
                onClick={() => {
                  setFilters(emptyFilters());
                  setTicketInboxSearch('');
                }}
                type="button"
              >
                Limpar tudo
              </button>
            </div>

            {showQueueFilters ? (
              <div className="grid shrink-0 gap-3 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)] px-4 py-3 sm:grid-cols-2 xl:grid-cols-5">
                <label>
                  <span className="mb-1 block text-xs text-[color:var(--minimal-text-secondary)]">Status</span>
                  <SelectInput
                    onChange={(event) => setFilters({ ...filters, status: event.target.value as QueueFilters['status'] })}
                    value={filters.status}
                  >
                    <option value="all">Todos</option>
                    {TICKET_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanizeStatus(status)}
                      </option>
                    ))}
                  </SelectInput>
                </label>
                <label>
                  <span className="mb-1 block text-xs text-[color:var(--minimal-text-secondary)]">Prioridade</span>
                  <SelectInput
                    onChange={(event) => setFilters({ ...filters, priority: event.target.value as QueueFilters['priority'] })}
                    value={filters.priority}
                  >
                    <option value="all">Todas</option>
                    {TICKET_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {humanizePriority(priority)}
                      </option>
                    ))}
                  </SelectInput>
                </label>
                <label>
                  <span className="mb-1 block text-xs text-[color:var(--minimal-text-secondary)]">Severidade</span>
                  <SelectInput
                    onChange={(event) => setFilters({ ...filters, severity: event.target.value as QueueFilters['severity'] })}
                    value={filters.severity}
                  >
                    <option value="all">Todas</option>
                    {TICKET_SEVERITIES.map((severity) => (
                      <option key={severity} value={severity}>
                        {humanizeSeverity(severity)}
                      </option>
                    ))}
                  </SelectInput>
                </label>
                <label>
                  <span className="mb-1 block text-xs text-[color:var(--minimal-text-secondary)]">Responsável</span>
                  <SelectInput
                    onChange={(event) => setFilters({ ...filters, assignedToUserId: event.target.value as QueueFilters['assignedToUserId'] })}
                    value={filters.assignedToUserId}
                  >
                    <option value="all">Todos</option>
                    <option value="unassigned">Sem responsável</option>
                    {assigneeOptions.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.label}
                      </option>
                    ))}
                  </SelectInput>
                </label>
                <label>
                  <span className="mb-1 block text-xs text-[color:var(--minimal-text-secondary)]">Cliente</span>
                  <SelectInput
                    onChange={(event) => setFilters({ ...filters, tenantId: event.target.value as QueueFilters['tenantId'] })}
                    value={filters.tenantId}
                  >
                    <option value="all">Todos</option>
                    {tenantOptions.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.label}
                      </option>
                    ))}
                  </SelectInput>
                </label>
              </div>
            ) : null}

            {bulkSelectedTicketIds.length > 0 ? (
              <div className="flex shrink-0 items-center justify-between border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-selection)] px-4 py-2 text-xs">
                <span>{bulkSelectedTicketIds.length} ticket(s) selecionado(s)</span>
                <button onClick={handleClearQueueBulkSelection} type="button">
                  Limpar seleção
                </button>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-auto" role="table" aria-label="Fila operacional de tickets">
              <div className="sticky top-0 z-10 hidden grid-cols-[28px_minmax(220px,1.45fr)_minmax(150px,0.8fr)_minmax(130px,0.65fr)_minmax(150px,0.75fr)_120px] items-center gap-4 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)] px-4 py-2 text-xs text-[color:var(--minimal-text-tertiary)] lg:grid" role="row">
                <button
                  aria-label="Selecionar todos os tickets visíveis para ações em massa"
                  className="inline-flex h-4 w-4 items-center justify-center rounded border border-[color:var(--minimal-border-strong)]"
                  disabled={queueVisibleTickets.length === 0}
                  onClick={handleSelectAllQueueVisibleTickets}
                  type="button"
                >
                  {bulkSelectedTicketIds.length > 1 ? '✓' : ''}
                </button>
                <span>Ticket</span>
                <span>Cliente</span>
                <span>Estado</span>
                <span>Responsável</span>
                <span>SLA</span>
              </div>

              {queueVisibleTickets.length === 0 ? (
                <EmptyState
                  title="Sem tickets para esta combinação de filtros"
                  description="Nenhum ticket apareceu com esse recorte. Ajuste filtros, busca ou recarregue a fila."
                />
              ) : (
                <div>
                  {queueVisibleTickets.map((ticket) => (
                    <SupportQueueItem
                      isBulkSelected={bulkSelectedTicketIds.includes(ticket.id)}
                      isSelected={ticket.id === selectedTicketId}
                      key={ticket.id}
                      onSelect={() => handleSelectTicket(ticket.id)}
                      onToggleBulk={() => handleToggleQueueBulkTicket(ticket.id)}
                      ticket={ticket}
                    />
                  ))}
                </div>
              )}
            </div>

            <footer className="flex shrink-0 items-center justify-between border-t border-[color:var(--minimal-border)] px-4 py-2 text-xs text-[color:var(--minimal-text-secondary)]">
              <span>
                Mostrando {queueVisibleTickets.length === 0 ? 0 : 1}-{queueVisibleTickets.length} de {tickets.length} tickets
              </span>
              <span>{queueVisibleTickets.length} por página</span>
            </footer>
          </section>

          {isQueueBulkMode ? (
            <aside className="support-true-bulk-panel">
              <div className="support-true-panel-title-row">
                <div>
                  <h2>Ações em massa</h2>
                  <p>{bulkSelectedTicketIds.length} tickets selecionados</p>
                </div>
                <button aria-label="Fechar ações em massa" onClick={handleClearQueueBulkSelection} type="button">
                  <SupportSurfaceIcon kind="close" />
                </button>
              </div>
              <p className="support-true-panel-copy">
                As ações abaixo dependem das permissões, do status e da governança da fila.
              </p>
              <div className="support-true-bulk-summary">
                <span>{bulkSelectedTickets.filter((ticket) => ticket.isUnassigned).length} sem responsável</span>
                <span>{bulkSelectedTickets.filter((ticket) => ticket.isWaitingCustomer).length} aguardando cliente</span>
                <span>{bulkSelectedTickets.filter((ticket) => ticket.isWaitingEngineering).length} dependência interna</span>
              </div>
              {[
                'Exportar',
                'Finalizar',
                'Transferir',
                'Atribuir responsável',
                'Alterar prioridade',
                'Adicionar tag',
                'Vincular acionamento',
                'Mais ações',
              ].map((label) => (
                <button className="support-true-bulk-action" disabled key={label} type="button">
                  {label}
                </button>
              ))}
              <div className="support-true-bulk-warning">
                Algumas ações dependem do status e da governança aplicada aos tickets selecionados.
              </div>
            </aside>
          ) : selectedQueueContextTicket ? (
            <aside className="support-true-queue-context">
              <div className="support-true-panel-title-row">
                <div>
                  <h2>{supportTicketCode(selectedQueueContextTicket.id)}</h2>
                  <p>{selectedQueueContextTicket.slaPolicyName ?? 'Sem política definida'}</p>
                </div>
                <button aria-label="Fechar contexto" onClick={() => setSelectedTicketId(null)} type="button">
                  <SupportSurfaceIcon kind="close" />
                </button>
              </div>
              {detailPhase === 'loading' ? (
                <LoadingState title="Carregando prévia" description="Preparando a leitura operacional." />
              ) : detailPhase === 'contract-unavailable' ? (
                <ContractUnavailableState contractName="prévia operacional do ticket" />
              ) : detailPhase === 'error' ? (
                <ErrorState description={detailMessage ?? 'A prévia do ticket não ficou disponível.'} />
              ) : (
                <>
                  <div className="support-true-context-customer">
                    <strong>{ticketTenantLabel(selectedQueueContextTicket)}</strong>
                    <span>{sanitizeSupportVisibleText(selectedQueueContextTicket.requesterContactFullName)}</span>
                    <span>{selectedQueueContextTicket.requesterContactEmail ?? 'E-mail indisponível'}</span>
                  </div>
                  <div className="support-true-context-tiles">
                    <span>
                      <small>SLA</small>
                      <strong>{selectedQueueContextTicket.slaStatusLabel ?? 'Indisponível'}</strong>
                    </span>
                    <span>
                      <small>Prioridade</small>
                      <strong>{humanizePriority(selectedQueueContextTicket.priority)}</strong>
                    </span>
                  </div>
                  <div className="support-true-context-summary">
                    <strong>Resumo operacional</strong>
                    <p>{sanitizeSupportVisibleText(previewTicket?.description ?? selectedQueueContextTicket.title)}</p>
                  </div>
                  <div className="support-true-context-timeline">
                    <strong>Linha do tempo</strong>
                    <span>Hoje · {formatSupportShortTime(selectedQueueContextTicket.updatedAt)}</span>
                    <p>{compactTicketStatusLabel(selectedQueueContextTicket.status)} · {selectedQueueContextTicket.originLabel}</p>
                  </div>
                  <button
                    className="support-true-context-primary"
                    onClick={() => void navigate(`/support/tickets/${selectedQueueContextTicket.id}`)}
                    type="button"
                  >
                    Abrir tratativa
                    <span>→</span>
                  </button>
                </>
              )}
            </aside>
          ) : null}
        </div>
      ) : detailPhase === 'idle' ? (
        <Panel
          className="bg-[color:var(--color-surface-strong)]"
          title="Nenhum ticket em tratativa"
          description="Abra um ticket pela fila para entrar no fluxo de atendimento."
        >
          <EmptyState
            title="Sem ticket selecionado"
            description="Use a fila operacional para escolher o ticket que sera tratado agora."
          />
        </Panel>
      ) : detailPhase === 'loading' ? (
        <LoadingState
          title="Montando tratativa"
          description="Estamos preparando a conversa, o contexto do cliente e a operação do ticket."
        />
      ) : detailPhase === 'contract-unavailable' ? (
        <ContractUnavailableState contractName="detalhe do ticket, conversa recente e contexto do cliente" />
      ) : detailPhase === 'error' || !ticketDetail || !selectedTicketSummary ? (
        focusTicketId ? (
          <section className="rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/95 px-6 py-6 shadow-[0_18px_34px_rgba(19,33,79,0.08)]">
            <EmptyState
              title="Ticket não encontrado"
              description={detailMessage ?? 'O ticket solicitado não apareceu na leitura operacional disponível.'}
              action={
                <Link to="/support/queue">
                  <AppButton>Voltar para a fila</AppButton>
                </Link>
              }
            />
          </section>
        ) : (
          <ErrorState
            description={detailMessage ?? 'O painel operacional do ticket não ficou disponível.'}
          />
        )
      ) : (
        <>
          {renderBlueprintLayout()}
        <input
          accept={TICKET_ATTACHMENT_ACCEPT}
          className="hidden"
          multiple
          onChange={(event) => void handleAttachmentSelection(event.currentTarget.files)}
          ref={attachmentInputRef}
          type="file"
        />
        </>
      )}

      {variant === 'queue' ? renderTicketIntakeModal() : null}
    </div>
  );
}

export function SupportQueuePage() {
  return <SupportWorkspaceView variant="queue" />;
}

export function SupportTicketsPage() {
  return <SupportWorkspaceView variant="tickets" />;
}

export function SupportTicketPage() {
  const { ticketId } = useParams();

  return <SupportWorkspaceView focusTicketId={ticketId ?? null} variant="tickets" />;
}

function readCountFromJson(counts: Record<string, unknown>, key: string) {
  const value = counts[key];

  return typeof value === 'number' ? value : 0;
}

function displayCustomerValue(value: string | null | undefined) {
  if (!value || value.trim().length === 0) {
    return 'Indisponível';
  }

  return sanitizeSupportVisibleText(value);
}

function summarizeOperationalFlags(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'Nenhum sinal operacional registrado.';
  }

  const availableSignals = Object.values(value).filter((entry) => {
    if (entry === null || entry === undefined || entry === false) {
      return false;
    }

    if (typeof entry === 'string') {
      return entry.trim().length > 0;
    }

    return true;
  }).length;

  return availableSignals > 0
    ? `${availableSignals} sinal(is) operacional(is) registrado(s).`
    : 'Nenhum sinal operacional registrado.';
}

function resolveSupportCustomerOwner(
  customer: SupportCustomer360,
  recentTicketsWindow: SupportCustomerRecentTicketsWindow,
) {
  return (
    recentTicketsWindow.tickets.find((ticket) => ticket.assignedToFullName)?.assignedToFullName ??
    primaryContactFromCustomer(customer)?.fullName ??
    null
  );
}

function resolveLatestCustomerActivity(
  customer: SupportCustomer360,
  recentTicketsWindow: SupportCustomerRecentTicketsWindow,
  recentEventsWindow: SupportCustomerRecentEventsWindow,
) {
  const candidates = [
    customer.tenantUpdatedAt,
    recentTicketsWindow.tickets[0]?.updatedAt ?? null,
    recentEventsWindow.events[0]?.occurredAt ?? null,
  ].filter((value): value is string => Boolean(value));

  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort((left, right) => right.localeCompare(left))[0] ?? null;
}

function resolveCustomerRiskProfile(accountContext: SupportCustomerAccountContext | null) {
  if (!accountContext || !accountContext.profileId) {
    return {
      label: 'Sem contexto',
      tone: 'default' as const,
      healthLabel: 'Contexto em aberto',
      accentClassName: 'bg-[color:var(--color-divider)]',
    };
  }

  const criticalAlerts = accountContext.activeAlerts.filter(
    (alert) => alert.severity === 'critical' || alert.severity === 'high',
  ).length;
  const riskyCustomizations = accountContext.activeCustomizations.filter(
    (customization) =>
      customization.riskLevel === 'critical' || customization.riskLevel === 'high',
  ).length;

  if (criticalAlerts > 0 || riskyCustomizations > 1) {
    return {
      label: 'Risco alto',
      tone: 'critical' as const,
      healthLabel: 'Atenção imediata',
      accentClassName: 'bg-[color:var(--color-danger-text)]',
    };
  }

  if (accountContext.operationalStatus === 'limited' || accountContext.activeAlerts.length > 0) {
    return {
      label: 'Em atenção',
      tone: 'warning' as const,
      healthLabel: 'Monitoramento ativo',
      accentClassName: 'bg-[color:var(--color-warning-text)]',
    };
  }

  return {
        label: 'Operação estável',
    tone: 'positive' as const,
        healthLabel: 'Saúde controlada',
    accentClassName: 'bg-[color:var(--color-success-text)]',
  };
}

function resolveMigrationCard(accountContext: SupportCustomerAccountContext | null) {
  if (!accountContext || !accountContext.profileId) {
    return {
      phase: 'Indisponível',
      accentTone: 'default' as const,
      steps: [
        { label: 'Descoberta', state: 'pending' as const },
        { label: 'Planejamento', state: 'pending' as const },
        { label: 'Execucao', state: 'pending' as const },
        { label: 'Validação', state: 'pending' as const },
      ],
    };
  }

  if (accountContext.operationalStatus === 'onboarding') {
    return {
      phase: 'Em migração',
      accentTone: 'warning' as const,
      steps: [
        { label: 'Descoberta', state: 'done' as const },
        { label: 'Planejamento', state: 'active' as const },
        { label: 'Execucao', state: 'pending' as const },
        { label: 'Validação', state: 'pending' as const },
      ],
    };
  }

  if (accountContext.operationalStatus === 'limited') {
    return {
      phase: 'Execucao',
      accentTone: 'warning' as const,
      steps: [
        { label: 'Descoberta', state: 'done' as const },
        { label: 'Planejamento', state: 'done' as const },
        { label: 'Execucao', state: 'active' as const },
        { label: 'Validação', state: 'pending' as const },
      ],
    };
  }

  return {
        phase: 'Operação ativa',
    accentTone: 'positive' as const,
    steps: [
      { label: 'Descoberta', state: 'done' as const },
      { label: 'Planejamento', state: 'done' as const },
      { label: 'Execucao', state: 'done' as const },
      { label: 'Validação', state: 'active' as const },
    ],
  };
}

function SupportCustomerDetailCard({
  title,
  description,
  children,
  className,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section
      className={cx(
        'rounded-[26px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/94 px-5 py-5 shadow-[0_16px_34px_rgba(16,30,74,0.08)]',
        className,
      )}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-[1.04rem] font-semibold tracking-[-0.035em] text-[color:var(--color-ink)]">
            {title}
          </h2>
          {description ? (
            <p className="text-sm leading-6 text-[color:var(--color-muted)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

function SupportCustomerMetricTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-[1.9rem] font-semibold tracking-[-0.05em] text-[color:var(--color-ink)]">
        {value}
      </p>
      {helper ? (
        <p className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">{helper}</p>
      ) : null}
    </div>
  );
}

export function SupportCustomersPage() {
  const { markSessionExpired } = useAuthContext();
  const didBootstrapRef = useRef(false);
  const previewCacheRef = useRef(new Map<Uuid, SupportCustomerPreviewSnapshot>());
  const selectedPreviewRequestRef = useRef(0);
  const [backendDenied, setBackendDenied] = useState(false);
  const [phase, setPhase] = useState<PagePhase>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [customers, setCustomers] = useState<SupportCustomer360[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<Uuid | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<SupportCustomer360 | null>(null);
  const [selectedAccountContext, setSelectedAccountContext] =
    useState<SupportCustomerAccountContext | null>(null);
  const [selectedProductContexts, setSelectedProductContexts] = useState<
    SupportCustomerProductContext[]
  >([]);
  const [selectedRecentTicketsWindow, setSelectedRecentTicketsWindow] =
    useState<SupportCustomerRecentTicketsWindow>(emptyCustomerRecentTicketsWindow());
  const [selectedRecentEventsWindow, setSelectedRecentEventsWindow] =
    useState<SupportCustomerRecentEventsWindow>(emptyCustomerRecentEventsWindow());
  const [selectedPhase, setSelectedPhase] = useState<DetailPhase>('idle');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  function applySelectedPreviewSnapshot(snapshot: SupportCustomerPreviewSnapshot) {
    setSelectedCustomer(snapshot.customer);
    setSelectedAccountContext(snapshot.accountContext);
    setSelectedProductContexts(snapshot.productContexts);
    setSelectedRecentTicketsWindow(snapshot.recentTicketsWindow);
    setSelectedRecentEventsWindow(snapshot.recentEventsWindow);
  }

  const loadCustomers = useEffectEvent(async (preferredTenantId?: Uuid | null) => {
    try {
      const data = await listSupportCustomers360();
      setBackendDenied(false);
      setCustomers(data);
      setPhase('ready');
      setMessage(null);

      const nextSelectedTenantId =
        preferredTenantId ??
        (data.some((customer) => customer.tenantId === selectedTenantId)
          ? selectedTenantId
          : null) ??
        data[0]?.tenantId ??
        null;

      setSelectedTenantId(nextSelectedTenantId);
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao carregar o hub de clientes do suporte.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      previewCacheRef.current.clear();
      setCustomers([]);
      setSelectedTenantId(null);
      setSelectedCustomer(null);
      setSelectedProductContexts([]);
      setMessage(classified.message);
      setPhase(
        classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
      );
    }
  });

  const loadSelectedCustomer = useEffectEvent(async (tenantId: Uuid) => {
    const requestId = selectedPreviewRequestRef.current + 1;
    selectedPreviewRequestRef.current = requestId;
    const cachedPreview = previewCacheRef.current.get(tenantId);

    if (cachedPreview) {
      applySelectedPreviewSnapshot(cachedPreview);
      setSelectedMessage(null);
      setSelectedPhase('ready');
    } else if (!selectedCustomer || selectedCustomer.tenantId !== tenantId) {
      const customerSummary =
        customers.find((customer) => customer.tenantId === tenantId) ?? null;

      if (customerSummary) {
        setSelectedCustomer(customerSummary);
      }

      setSelectedAccountContext(null);
      setSelectedProductContexts([]);
      setSelectedRecentTicketsWindow(emptyCustomerRecentTicketsWindow());
      setSelectedRecentEventsWindow(emptyCustomerRecentEventsWindow());
      setSelectedMessage(null);
      setSelectedPhase(customerSummary ? 'ready' : 'loading');
    }

    try {
      const [detail, context, productContexts, recentTickets, recentEvents] = await Promise.all([
        getSupportCustomer360(tenantId),
        getSupportCustomerAccountContext(tenantId),
        listSupportCustomerProductContexts(tenantId),
        getSupportCustomerRecentTickets(tenantId),
        getSupportCustomerRecentEvents(tenantId),
      ]);

      if (selectedPreviewRequestRef.current !== requestId) {
        return;
      }

      if (!detail) {
        throw new Error('O cliente selecionado não ficou disponível para a visão rápida.');
      }

      const snapshot = {
        customer: detail,
        accountContext: context,
        productContexts,
        recentTicketsWindow: recentTickets,
        recentEventsWindow: recentEvents,
      } satisfies SupportCustomerPreviewSnapshot;

      previewCacheRef.current.set(tenantId, snapshot);
      applySelectedPreviewSnapshot(snapshot);
      setSelectedMessage(null);
      setSelectedPhase('ready');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao carregar a visão rápida operacional do cliente.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (selectedPreviewRequestRef.current !== requestId) {
        return;
      }

      setSelectedCustomer(null);
      setSelectedAccountContext(null);
      setSelectedProductContexts([]);
      setSelectedRecentTicketsWindow(emptyCustomerRecentTicketsWindow());
      setSelectedRecentEventsWindow(emptyCustomerRecentEventsWindow());
      setSelectedMessage(classified.message);
      setSelectedPhase(
        classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
      );
    }
  });

  useEffect(() => {
    if (didBootstrapRef.current) {
      return;
    }

    didBootstrapRef.current = true;
    void loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');

    if (normalizedQuery.length === 0) {
      return customers;
    }

    return customers.filter((customer) =>
      [
        customer.tenantDisplayName,
        customer.tenantLegalName,
        customer.tenantSlug,
      ]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(normalizedQuery),
    );
  }, [customers, query]);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((customer) => customer.tenantStatus === 'active').length;
  const openTickets = customers.reduce((sum, customer) => sum + customer.openTicketCount, 0);
  const activeContacts = customers.reduce((sum, customer) => sum + customer.activeContactsCount, 0);

  useEffect(() => {
    if (!selectedTenantId && filteredCustomers[0]) {
      setSelectedTenantId(filteredCustomers[0].tenantId);
    }
  }, [filteredCustomers, selectedTenantId]);

  useEffect(() => {
    if (!selectedTenantId) {
      setSelectedPhase('idle');
      return;
    }

    if (phase !== 'ready') {
      return;
    }

    void loadSelectedCustomer(selectedTenantId);
  }, [phase, selectedTenantId]);

  if (backendDenied) {
    return <Navigate replace state={{ reason: 'missing-authorized-workspace' }} to="/access-denied" />;
  }

  if (phase === 'loading') {
    return (
      <div className="space-y-5">
        <section className="rounded-[26px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/95 px-5 py-5 shadow-[0_16px_30px_rgba(19,33,79,0.08)]">
          <div className="h-6 w-44 animate-pulse rounded-full bg-[color:var(--color-divider)]" />
          <div className="mt-3 h-10 w-[420px] max-w-full animate-pulse rounded-[22px] bg-[color:var(--color-divider)]" />
        </section>
        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <LoadingBlock className="h-[520px] rounded-[26px]" />
          <LoadingBlock className="h-[520px] rounded-[26px]" />
        </div>
      </div>
    );
  }

  if (phase === 'contract-unavailable') {
    return <ContractUnavailableState contractName="hub de clientes do suporte" />;
  }

  if (phase === 'error') {
    return (
      <ErrorState
          description={message ?? 'Não foi possível carregar a carteira de clientes desta área.'}
        action={<AppButton onClick={() => void loadCustomers(selectedTenantId)}>Tentar novamente</AppButton>}
      />
    );
  }

  if (customers.length === 0) {
    return (
      <EmptyState
        title="Nenhum cliente disponível"
          description="Ainda não existe conta operacional disponível para esta área do suporte."
      />
    );
  }

  const previewLabel =
    selectedCustomer?.tenantDisplayName ??
    selectedCustomer?.tenantLegalName ??
    'Cliente indisponível';
  const selectedRiskProfile = resolveCustomerRiskProfile(selectedAccountContext);
  const selectedMigrationCard = resolveMigrationCard(selectedAccountContext);
  const selectedOwner =
    selectedCustomer && selectedPhase === 'ready'
      ? resolveSupportCustomerOwner(selectedCustomer, selectedRecentTicketsWindow)
      : null;
  const selectedPrimaryProduct = primaryCustomerProductContext(selectedProductContexts);
  const activePreviewTabs = [
    { id: 'accounts', label: 'Contas', active: true },
    { id: 'contacts', label: 'Contatos', active: false },
    { id: 'migration', label: 'Migrações', active: false },
    { id: 'health', label: 'Saúde', active: false },
  ];

  return (
    <div className="space-y-4 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:overflow-hidden">
      <section className="rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/96 px-4 py-4 shadow-[0_14px_26px_rgba(19,33,79,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="accent">Clientes</StatusPill>
              <StatusPill>Cockpit B2B</StatusPill>
            </div>
            <div className="space-y-1">
              <h1 className="text-[1.7rem] font-semibold tracking-[-0.06em] text-[color:var(--color-ink)]">
                Clientes
              </h1>
              <p className="text-[13px] leading-5 text-[color:var(--color-muted)]">
                Contas, contatos, migração e saúde operacional sem virar CRM genérico.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {activePreviewTabs.map((tab) => (
              <span
                className={cx(
                  'inline-flex min-h-9 items-center rounded-full border px-3.5 text-[12px] font-semibold',
                  tab.active
                    ? 'border-[rgba(48,127,226,0.28)] bg-[rgba(48,127,226,0.1)] text-[color:var(--color-brand-blue)]'
                    : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] text-[color:var(--color-muted)]',
                )}
                key={tab.id}
              >
                {tab.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[276px_minmax(0,1fr)_360px]">
        <aside className="space-y-3 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/96 px-3.5 py-3 shadow-[0_12px_22px_rgba(19,33,79,0.07)]">
          <div className="space-y-2">
            <div className="space-y-1">
              <h2 className="text-[1rem] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                Segmentação
              </h2>
              <p className="text-[12px] leading-5 text-[color:var(--color-muted)]">
                Recorte rápido da carteira ativa no suporte.
              </p>
            </div>

            <TextInput
              className="h-10 rounded-[12px] px-3 text-[12px]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome ou slug"
              value={query}
            />
          </div>

          <div className="space-y-2 rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Recortes rápidos
            </p>
            {[
              { label: 'Clientes ativos', value: activeCustomers, helper: 'contas em operação' },
              { label: 'Tickets abertos', value: openTickets, helper: 'triagem em andamento' },
              { label: 'Contatos ativos', value: activeContacts, helper: 'pontos de contato' },
              { label: 'Sem responsável', value: customers.filter((customer) => customer.openTicketCount === 0).length, helper: 'sem fila recente' },
            ].map((item) => (
              <div
                className="flex items-center justify-between rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-2.5"
                key={item.label}
              >
                <div>
                  <p className="text-[13px] font-semibold text-[color:var(--color-ink)]">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-[color:var(--color-muted)]">{item.helper}</p>
                </div>
                <span className="text-[1.05rem] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <GhostButton
            className="min-h-10 w-full rounded-[12px] px-4 text-[12px]"
            onClick={() => void loadCustomers(selectedTenantId)}
          >
            Recarregar carteira
          </GhostButton>
        </aside>

        <div className="space-y-3 xl:min-h-0 xl:flex xl:flex-col xl:overflow-hidden">
          <SupportSummaryStrip
            highAttention={customers.filter((customer) => customer.openTicketCount > 0).length}
            totalOpen={openTickets}
            unassigned={customers.filter((customer) => customer.totalTicketCount === 0).length}
            waitingCustomer={customers.filter((customer) => customer.activeContactsCount === 0).length}
          />

          <section className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-4 shadow-[0_12px_24px_rgba(19,33,79,0.07)] xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:overflow-hidden">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-[1.04rem] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                  Contas prioritárias
                </h2>
                <p className="text-[12px] leading-5 text-[color:var(--color-muted)]">
                  Lista central dominante para abrir a conta certa sem sair do contexto.
                </p>
              </div>
              <p className="text-[12px] text-[color:var(--color-muted)]">
                {filteredCustomers.length} conta(s) no recorte atual
              </p>
            </div>

            {filteredCustomers.length === 0 ? (
              <EmptyState
                title="Nenhum cliente apareceu neste recorte"
                description="Ajuste a busca ou recarregue a carteira para continuar."
              />
            ) : (
              <div className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
                <div className="space-y-2.5">
                  {filteredCustomers.map((customer) => {
                    const selected = customer.tenantId === selectedTenantId;
                    const customerLabel = displaySupportCustomerName(customer);

                    return (
                      <button
                        className={cx(
                          'w-full rounded-[18px] border px-4 py-3 text-left transition',
                          selected
                            ? 'border-[rgba(48,127,226,0.42)] bg-[rgba(48,127,226,0.08)] shadow-[0_8px_18px_rgba(19,33,79,0.06)]'
                            : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] hover:border-[rgba(48,127,226,0.24)] hover:bg-[color:var(--color-surface)]',
                        )}
                        key={customer.tenantId}
                        onClick={() => setSelectedTenantId(customer.tenantId)}
                        type="button"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill tone={customer.tenantStatus === 'active' ? 'positive' : 'warning'}>
                                {humanizeTenantStatus(customer.tenantStatus)}
                              </StatusPill>
                            </div>
                            <h3 className="truncate text-[1rem] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                              {customerLabel}
                            </h3>
                          </div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                            {customer.openTicketCount} em aberto
                          </p>
                        </div>

                        <div className="mt-2 grid gap-2 text-[12px] leading-5 text-[color:var(--color-muted)] md:grid-cols-4">
                          <span>Histórico: {customer.totalTicketCount}</span>
                          <span>Contatos: {customer.activeContactsCount}</span>
                          <span>Razão social: {displayCustomerValue(customer.tenantLegalName)}</span>
                          <span>Última atualização: {formatDateTime(customer.tenantUpdatedAt)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-4 shadow-[0_12px_24px_rgba(19,33,79,0.07)] xl:flex xl:min-h-0 xl:flex-col xl:overflow-hidden">
          <div className="mb-3 space-y-1">
            <h2 className="text-[1.04rem] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
              Visão rápida do cliente
            </h2>
            <p className="text-[12px] leading-5 text-[color:var(--color-muted)]">
              Contexto operacional da conta antes de abrir o perfil completo.
            </p>
          </div>

          {selectedPhase === 'loading' ? (
            <LoadingState
              title="Carregando visão rápida"
              description="Estamos preparando o contexto operacional desta conta."
            />
          ) : selectedPhase === 'contract-unavailable' ? (
            <ContractUnavailableState resourceName="a visão rápida do cliente" />
          ) : selectedPhase === 'error' ? (
            <ErrorState description={selectedMessage ?? 'A visão rápida deste cliente não ficou disponível.'} />
          ) : selectedCustomer ? (
            <div className="space-y-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
              <div className="rounded-[20px] border border-[rgba(48,127,226,0.22)] bg-[linear-gradient(180deg,rgba(17,28,66,1),rgba(24,42,97,0.98))] px-4 py-4 text-white">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={selectedRiskProfile.tone}>{selectedRiskProfile.label}</StatusPill>
                  <StatusPill tone={selectedMigrationCard.accentTone}>{selectedMigrationCard.phase}</StatusPill>
                </div>
                <div className="mt-3 space-y-1.5">
                  <h3 className="text-[1.22rem] font-semibold tracking-[-0.05em]">{previewLabel}</h3>
                  <div className="space-y-1 text-[12px] leading-5 text-white/76">
                    <p>Produto: {displayCustomerProductLabel(selectedAccountContext, selectedProductContexts)}</p>
                    <p>Plano: {displayCustomerPlanLabel(selectedAccountContext, selectedProductContexts)}</p>
                    <p>Responsável: {displayCustomerValue(selectedOwner)}</p>
                    <p>Última atividade: {formatDateTime(selectedCustomer.tenantUpdatedAt)}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--color-surface-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--color-brand-navy)]"
                    to={`/support/customers/${selectedCustomer.tenantId}`}
                  >
                    Abrir cliente
                  </Link>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/22 px-4 py-2 text-sm font-semibold text-white"
                    to="/support/queue"
                  >
                    Ver tickets
                  </Link>
                </div>
              </div>

              <div className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3">
                <p className="text-[13px] font-semibold text-[color:var(--color-ink)]">Resumo operacional</p>
                <div className="mt-2 space-y-1.5 text-[12px] leading-5 text-[color:var(--color-muted)]">
                  <p>Tickets abertos: {selectedCustomer.openTicketCount}</p>
                  <p>Total de tickets: {selectedCustomer.totalTicketCount}</p>
                  <p>Contatos ativos: {selectedCustomer.activeContactsCount}</p>
                  <p>Subscriptions: {selectedProductContexts.length}</p>
                </div>
              </div>

              <div className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-3">
                <p className="text-[13px] font-semibold text-[color:var(--color-ink)]">Contato principal</p>
                <div className="mt-2 space-y-1.5 text-[12px] leading-5 text-[color:var(--color-muted)]">
                  <p>
                    {sanitizeSupportVisibleText(primaryContactFromCustomer(selectedCustomer)?.fullName)}
                  </p>
                  <p className="break-all">
                    {displayCustomerValue(primaryContactFromCustomer(selectedCustomer)?.email)}
                  </p>
                </div>
              </div>

              <div className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-3">
                <p className="text-[13px] font-semibold text-[color:var(--color-ink)]">Sinais da conta</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusPill tone={selectedCustomer.tenantStatus === 'active' ? 'positive' : 'warning'}>
                    {humanizeTenantStatus(selectedCustomer.tenantStatus)}
                  </StatusPill>
                  <StatusPill>
                    {displayCustomerPlanLabel(selectedAccountContext, selectedProductContexts)}
                  </StatusPill>
                  <StatusPill>
                    {displayCustomerValue(
                      selectedPrimaryProduct
                        ? labelForCustomerProductSubscriptionStatus(selectedPrimaryProduct.status)
                        : null,
                    )}
                  </StatusPill>
                  <StatusPill>
                    {displayCustomerValue(
                      primaryPlatformFromContext(selectedAccountContext)?.provider ?? null,
                    )}
                  </StatusPill>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Nenhum cliente selecionado"
              description="Escolha uma conta da lista para abrir a visão rápida operacional."
            />
          )}
        </aside>
      </div>
    </div>
  );
}

export function SupportCustomerPage() {
  const { markSessionExpired } = useAuthContext();
  const { tenantId } = useParams();
  const didBootstrapRef = useRef(false);
  const [backendDenied, setBackendDenied] = useState(false);
  const [phase, setPhase] = useState<PagePhase>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [customer, setCustomer] = useState<SupportCustomer360 | null>(null);
  const [accountContext, setAccountContext] =
    useState<SupportCustomerAccountContext | null>(null);
  const [productContexts, setProductContexts] = useState<SupportCustomerProductContext[]>([]);
  const [recentTicketsWindow, setRecentTicketsWindow] =
    useState<SupportCustomerRecentTicketsWindow>(emptyCustomerRecentTicketsWindow());
  const [recentEventsWindow, setRecentEventsWindow] =
    useState<SupportCustomerRecentEventsWindow>(emptyCustomerRecentEventsWindow());

  const loadCustomer = useEffectEvent(async () => {
    if (!tenantId) {
      setCustomer(null);
      setAccountContext(null);
      setProductContexts([]);
      setRecentTicketsWindow(emptyCustomerRecentTicketsWindow());
      setRecentEventsWindow(emptyCustomerRecentEventsWindow());
      setPhase('error');
      setMessage('Cliente ausente na rota desta tela.');
      return;
    }

    try {
      const [detail, context, customerProductContexts, recentTickets, recentEvents] = await Promise.all([
        getSupportCustomer360(tenantId),
        getSupportCustomerAccountContext(tenantId),
        listSupportCustomerProductContexts(tenantId),
        getSupportCustomerRecentTickets(tenantId),
        getSupportCustomerRecentEvents(tenantId),
      ]);

      setBackendDenied(false);
      setCustomer(detail);
      setAccountContext(context);
      setProductContexts(customerProductContexts);
      setRecentTicketsWindow(recentTickets);
      setRecentEventsWindow(recentEvents);
      setMessage(null);
      setPhase('ready');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao carregar o contexto do cliente.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setCustomer(null);
      setAccountContext(null);
      setProductContexts([]);
      setRecentTicketsWindow(emptyCustomerRecentTicketsWindow());
      setRecentEventsWindow(emptyCustomerRecentEventsWindow());
      setMessage(classified.message);
      setPhase(
        classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
      );
    }
  });

  useEffect(() => {
    void loadCustomer();
  }, [tenantId]);

  if (backendDenied) {
    return <Navigate replace state={{ reason: 'missing-authorized-workspace' }} to="/access-denied" />;
  }

  if (phase === 'loading') {
    return (
      <div className="space-y-5">
        <div className="space-y-3 rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/94 px-6 py-6 shadow-[0_16px_34px_rgba(16,30,74,0.08)]">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="accent">Clientes</StatusPill>
            <StatusPill>Resumo</StatusPill>
          </div>
          <div className="space-y-2">
            <LoadingBlock className="h-7 w-56" />
            <LoadingBlock className="h-4 w-[420px] max-w-full" />
          </div>
          <LoadingBlock className="h-20 rounded-[22px]" />
          <div className="flex flex-wrap gap-3">
            <LoadingBlock className="h-11 w-24 rounded-full" />
            <LoadingBlock className="h-11 w-24 rounded-full" />
            <LoadingBlock className="h-11 w-24 rounded-full" />
            <LoadingBlock className="h-11 w-24 rounded-full" />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[294px_minmax(0,1.28fr)_318px]">
          <div className="space-y-5">
            <LoadingBlock className="h-[318px] rounded-[26px]" />
            <LoadingBlock className="h-[190px] rounded-[26px]" />
            <LoadingBlock className="h-[172px] rounded-[26px]" />
          </div>
          <div className="space-y-5">
            <LoadingBlock className="h-[184px] rounded-[26px]" />
            <LoadingBlock className="h-[272px] rounded-[26px]" />
            <LoadingBlock className="h-[286px] rounded-[26px]" />
          </div>
          <div className="space-y-5">
            <LoadingBlock className="h-[178px] rounded-[26px]" />
            <LoadingBlock className="h-[224px] rounded-[26px]" />
            <LoadingBlock className="h-[204px] rounded-[26px]" />
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'contract-unavailable') {
    return <ContractUnavailableState contractName="resumo operacional do cliente" />;
  }

  if (phase === 'error') {
    return (
      <ErrorState
          description={message ?? 'O contexto deste cliente não ficou disponível neste ambiente.'}
        action={<AppButton onClick={() => void loadCustomer()}>Tentar novamente</AppButton>}
      />
    );
  }

  if (!customer) {
    return (
      <EmptyState
        title="Cliente não encontrado"
        description="O cliente solicitado não apareceu na leitura operacional disponível."
      />
    );
  }

  const primaryContact = primaryContactFromCustomer(customer);
  const primaryPlatform = primaryPlatformFromContext(accountContext);
  const ownerName = resolveSupportCustomerOwner(customer, recentTicketsWindow);
  const latestActivity = resolveLatestCustomerActivity(
    customer,
    recentTicketsWindow,
    recentEventsWindow,
  );
  const riskProfile = resolveCustomerRiskProfile(accountContext);
  const migrationCard = resolveMigrationCard(accountContext);
  const openWaitingCount =
    readCountFromJson(customer.ticketStatusCounts as Record<string, unknown>, 'waiting_customer') +
    readCountFromJson(customer.ticketStatusCounts as Record<string, unknown>, 'waiting_support') +
    readCountFromJson(customer.ticketStatusCounts as Record<string, unknown>, 'waiting_engineering');
  const criticalSignals =
    accountContext?.activeAlerts.filter(
      (alert) => alert.severity === 'critical' || alert.severity === 'high',
    ).length ?? 0;
  const highRiskCustomizations = visibleRiskCustomizations(accountContext, 3);
  const visibleFeatures = visibleFeatureSlice(accountContext, 5);
  const visibleAlerts = visibleAlertSlice(accountContext, 3);
  const visibleIntegrations = visibleOperationalIntegrations(accountContext, 4);
  const primaryProductContext = primaryCustomerProductContext(productContexts);
  const customerLabel = displaySupportCustomerName(customer);
  const customerTabs = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'produtos', label: 'Produtos' },
    { id: 'contatos', label: 'Contatos' },
    { id: 'tickets', label: 'Tickets' },
    { id: 'migracao', label: 'Migração' },
    { id: 'saude', label: 'Saúde' },
    { id: 'atividade', label: 'Atividade' },
  ];

  return (
    <div className="space-y-4 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:overflow-hidden">
      <section className="rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/96 px-4 py-4 shadow-[0_14px_26px_rgba(16,30,74,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="accent">Clientes</StatusPill>
              <StatusPill>{displayCustomerProductLabel(accountContext, productContexts)}</StatusPill>
              <StatusPill tone={riskProfile.tone}>{riskProfile.label}</StatusPill>
            </div>
            <div className="space-y-1">
              <h1 className="text-[1.85rem] font-semibold tracking-[-0.06em] text-[color:var(--color-ink)]">
                {customerLabel}
              </h1>
              <p className="text-[13px] leading-5 text-[color:var(--color-muted)]">
                Contexto operacional completo da conta, contatos, tickets e sinais de saúde.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <GhostButton className="min-h-10 rounded-[12px] px-4 text-[12px]" onClick={() => window.history.back()}>
              Voltar
            </GhostButton>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-2 text-[12px] font-semibold text-[color:var(--color-brand-blue)]"
              to="/support/queue"
            >
              Abrir fila
            </Link>
          </div>
        </div>

        <div className="mt-4 rounded-[18px] border border-[color:var(--color-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-3.5 py-3.5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {[
              { label: 'Cliente', value: customerLabel },
              {
                label: 'Produto',
                value: displayCustomerProductLabel(accountContext, productContexts),
              },
              {
                label: 'Plataforma',
                value: displayCustomerValue(primaryPlatform?.provider ?? null),
              },
              {
                label: 'Plano',
                  value: displayCustomerPlanLabel(accountContext, productContexts),
              },
              {
                label: 'Responsavel',
                value: displayCustomerValue(ownerName),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-2.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                  {item.label}
                </p>
                <p className="mt-1.5 text-[13px] font-semibold text-[color:var(--color-ink)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <nav className="mt-4 flex flex-wrap gap-2 border-b border-[color:var(--color-border)] pb-2">
          {customerTabs.map((tab) => (
            <a
              className={cx(
                'inline-flex min-h-9 items-center rounded-full px-3.5 text-[12px] font-semibold transition',
                tab.id === 'resumo'
                  ? 'bg-[rgba(48,127,226,0.1)] text-[color:var(--color-brand-blue)] shadow-[inset_0_-2px_0_var(--color-brand-blue)]'
                  : 'text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-ink)]',
              )}
              href={`#${tab.id}`}
              key={tab.id}
            >
              {tab.label}
            </a>
          ))}
        </nav>
      </section>

      <div className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[272px_minmax(0,1fr)_318px]">
        <aside className="space-y-4">
          <section className="overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#071942_0%,#0b235b_58%,#103071_100%)] px-4 py-4 text-white shadow-[0_18px_34px_rgba(8,22,61,0.26)]">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-surface-strong)]/92 text-base font-semibold text-[color:var(--color-brand-blue)]">
                    {customerLabel
                      .split(' ')
                      .slice(0, 2)
                      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
                      .join('')}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-[1.28rem] font-semibold tracking-[-0.05em]">{customerLabel}</h2>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill tone={customer.tenantStatus === 'active' ? 'positive' : 'warning'}>
                        {displayCustomerValue(humanizeTenantStatus(customer.tenantStatus))}
                      </StatusPill>
                      <StatusPill tone={migrationCard.accentTone}>{migrationCard.phase}</StatusPill>
                    </div>
                  </div>
                </div>
              </div>

              <StatusPill tone={riskProfile.tone}>{riskProfile.label}</StatusPill>

              <dl className="space-y-2.5 text-[13px]">
                {[
                  {
                    label: 'Plataforma',
                    value: displayCustomerValue(primaryPlatform?.provider ?? null),
                  },
                  {
                    label: 'Produto',
                    value: displayCustomerProductLabel(accountContext, productContexts),
                  },
                  {
                    label: 'Plano',
                    value: displayCustomerPlanLabel(accountContext, productContexts),
                  },
                  {
                    label: 'Subscription',
                    value: displayCustomerValue(
                      primaryProductContext
                        ? labelForCustomerProductSubscriptionStatus(primaryProductContext.status)
                        : null,
                    ),
                  },
                  {
                    label: 'Responsável',
                    value: displayCustomerValue(ownerName),
                  },
                  {
                    label: 'Última atividade',
                    value: latestActivity ? formatDateTime(latestActivity) : 'Indisponível',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-2.5 last:border-b-0 last:pb-0"
                  >
                    <dt className="text-white/68">{item.label}</dt>
                    <dd className="text-right font-medium text-white">{item.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="space-y-2 pt-1">
                <Link
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#1e63ff,#2e7cf5)] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_16px_28px_rgba(18,81,213,0.35)]"
                  to="/support/queue"
                >
                  Abrir tickets
                </Link>
                <button
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-[14px] border border-white/18 bg-transparent px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[color:var(--color-surface-strong)]/8"
                  onClick={() => window.history.back()}
                  type="button"
                >
                  Voltar para a conta anterior
                </button>
              </div>
            </div>
          </section>

          <SupportCustomerDetailCard
            className="px-4 py-4"
            description="Contato operacional mais confiavel para continuar a tratativa."
            title="Contato principal"
          >
            {primaryContact ? (
              <div className="space-y-3">
                <div className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4">
                  <p className="font-semibold text-[color:var(--color-ink)]">{sanitizeSupportVisibleText(primaryContact.fullName)}</p>
                  <p className="mt-1 break-all text-sm text-[color:var(--color-muted)]">
                    {displayCustomerValue(primaryContact.email)}
                  </p>
                </div>
                <div className="grid gap-2 text-sm leading-6 text-[color:var(--color-muted)]">
                  <p>
                    Vinculo principal: {primaryContact.isPrimary ? 'Sim' : 'Indisponível'}
                  </p>
                <p>Usuário vinculado: {primaryContact.linkedUserId ? 'Ativo' : 'Indisponível'}</p>
                </div>
              </div>
            ) : (
              <InlineNotice tone="warning">
                Nenhum contato principal foi resolvido para esta conta.
              </InlineNotice>
            )}
          </SupportCustomerDetailCard>
        </aside>

        <div className="space-y-4 xl:min-h-0 xl:overflow-y-auto xl:pr-1">
          <div id="resumo">
            <SupportCustomerDetailCard
              title="Resumo operacional"
              description="Os indicadores que mais ajudam o suporte e o CS a decidir o proximo passo."
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <SupportCustomerMetricTile
                  helper="Tickets ativos desta conta."
                  label="Tickets abertos"
                  value={String(customer.openTicketCount)}
                />
                <SupportCustomerMetricTile
                  helper="Produtos ativos ou suspensos desta conta."
                  label="Subscriptions"
                  value={String(productContexts.length)}
                />
                <SupportCustomerMetricTile
                  helper="Itens aguardando retorno ou ação."
                  label="Em espera"
                  value={String(openWaitingCount)}
                />
                <SupportCustomerMetricTile
                  helper="Contatos ativos na leitura atual."
                  label="Contatos ativos"
                  value={String(customer.activeContactsCount)}
                />
                <SupportCustomerMetricTile
                  helper="Alertas criticos e sinais fortes de risco."
                  label="Sinais criticos"
                  value={String(criticalSignals)}
                />
              </div>
            </SupportCustomerDetailCard>
          </div>

          <div id="produtos">
            <SupportCustomerDetailCard
              description="Leitura support-safe dos produtos, planos, features e responsáveis internos deste cliente."
              title="Produtos contratados"
            >
              <SupportCustomerProductsPanel productContexts={productContexts} />
            </SupportCustomerDetailCard>
          </div>

          <div id="tickets">
            <SupportCustomerDetailCard
              actions={
                <Link
                  className="text-sm font-semibold text-[color:var(--color-brand-blue)]"
                  to="/support/queue"
                >
                  Ver fila
                </Link>
              }
              description={`Mostrando ${recentTicketsWindow.tickets.length} de ${recentTicketsWindow.totalAvailableCount} tickets recentes.`}
              title="Tickets recentes"
            >
              {recentTicketsWindow.tickets.length === 0 ? (
                <InlineNotice>Nenhum ticket recente apareceu para esta conta.</InlineNotice>
              ) : (
                <div className="overflow-hidden rounded-[20px] border border-[color:var(--color-border)]">
                  <div className="hidden grid-cols-[122px_minmax(0,1.35fr)_minmax(140px,0.9fr)_148px] gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)] md:grid">
                    <span>Status</span>
                    <span>Ticket</span>
                    <span>Responsavel</span>
                    <span>Atualização</span>
                  </div>
                  <div className="divide-y divide-[color:var(--color-border)]">
                    {recentTicketsWindow.tickets.map((ticket) => (
                      <Link
                        className="grid gap-3 px-4 py-4 transition hover:bg-[color:var(--color-surface)] md:grid-cols-[122px_minmax(0,1.35fr)_minmax(140px,0.9fr)_148px]"
                        key={ticket.id}
                        to={`/support/tickets/${ticket.id}`}
                      >
                        <div className="min-w-0">
                          <StatusPill tone={toneForTicketStatus(ticket.status)}>
                            {humanizeStatus(ticket.status)}
                          </StatusPill>
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="line-clamp-2 text-sm font-semibold text-[color:var(--color-ink)]">
                            {sanitizeSupportVisibleText(ticket.title)}
                          </p>
                          <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                            {humanizePriority(ticket.priority)} · {humanizeSeverity(ticket.severity)}
                          </p>
                        </div>
                        <div className="min-w-0 text-sm text-[color:var(--color-muted)]">
                          {displayCustomerValue(ticket.assignedToFullName)}
                        </div>
                        <div className="text-sm text-[color:var(--color-muted)]">
                          {formatDateTime(ticket.updatedAt)}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </SupportCustomerDetailCard>
          </div>

          <SupportCustomerDetailCard
            description={`Mostrando ${recentEventsWindow.events.length} de ${recentEventsWindow.totalAvailableCount} registros recentes.`}
            title="Timeline operacional"
          >
            {recentEventsWindow.events.length === 0 ? (
                  <InlineNotice>Nenhuma atividade operacional recente ficou disponível.</InlineNotice>
            ) : (
              <div className="space-y-4" id="atividade">
                {recentEventsWindow.events.map((event, index) => (
                  <div
                    className="grid gap-3 md:grid-cols-[28px_minmax(0,1fr)_164px]"
                    key={buildSupportCustomerRecentEventKey(event, index)}
                  >
                    <div className="relative flex justify-center">
                      <span className="mt-2 inline-flex h-3.5 w-3.5 rounded-full bg-[color:var(--color-brand-blue)]" />
                      {index < recentEventsWindow.events.length - 1 ? (
                        <span className="absolute top-5 h-[calc(100%+0.5rem)] w-px bg-[rgba(48,127,226,0.28)]" />
                      ) : null}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                          {humanizeToken(event.eventType)}
                        </p>
                        <StatusPill tone={event.visibility === 'internal' ? 'warning' : 'accent'}>
                          {humanizeVisibility(event.visibility)}
                        </StatusPill>
                      </div>
                      <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                        {event.ticketTitle}
                      </p>
                    </div>
                    <div className="text-sm text-[color:var(--color-muted)]">
                      {formatDateTime(event.occurredAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SupportCustomerDetailCard>
        </div>

        <aside className="space-y-4 xl:min-h-0 xl:overflow-y-auto xl:pr-1">
          <SupportCustomerDetailCard
            className="px-4 py-4"
            description="Leitura curta da conta para decidir se a tratativa pede atenção extra."
            title="Saúde da conta"
          >
            <div className="space-y-4" id="saude">
              <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[color:var(--color-ink)]">Saúde geral</p>
                <StatusPill tone={riskProfile.tone}>{riskProfile.healthLabel}</StatusPill>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[color:var(--color-divider)]">
                <div
                  className={cx(
                    'h-full rounded-full',
                    riskProfile.accentClassName,
                    riskProfile.tone === 'positive' && 'w-[28%]',
                    riskProfile.tone === 'warning' && 'w-[64%]',
                    riskProfile.tone === 'critical' && 'w-[82%]',
                    riskProfile.tone === 'default' && 'w-[44%]',
                  )}
                />
              </div>
              <div className="space-y-2 text-sm leading-6 text-[color:var(--color-muted)]">
                <p>{visibleAlerts.length} alerta(s) ativo(s) na leitura operacional.</p>
                <p>{highRiskCustomizations.length} customização(ões) com atenção operacional.</p>
                <p>{customer.openTicketCount} ticket(s) ainda em aberto para esta conta.</p>
              </div>
            </div>
          </SupportCustomerDetailCard>

          <SupportCustomerDetailCard
            className="px-4 py-4"
            description="Passos e sinais que mostram o momento operacional da conta."
            title="Migração"
          >
            <div className="space-y-4" id="migracao">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[color:var(--color-ink)]">Fase atual</p>
                <StatusPill tone={migrationCard.accentTone}>{migrationCard.phase}</StatusPill>
              </div>
              <div className="space-y-3">
                {migrationCard.steps.map((step) => (
                  <div className="flex items-center gap-3" key={step.label}>
                    <span
                      className={cx(
                        'inline-flex h-4 w-4 rounded-full border',
                        step.state === 'done' && 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-text)]',
                        step.state === 'active' && 'border-[color:var(--color-brand-blue)] bg-[color:var(--color-brand-blue)]',
                        step.state === 'pending' && 'border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]',
                      )}
                    />
                    <p
                      className={cx(
                        'text-sm',
                        step.state === 'pending'
                          ? 'text-[color:var(--color-muted)]'
                          : 'font-medium text-[color:var(--color-ink)]',
                      )}
                    >
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid gap-2 text-sm leading-6 text-[color:var(--color-muted)]">
                <p>Integrações operacionais: {visibleIntegrations.length}</p>
                <p>Recursos ativos: {visibleFeatures.length}</p>
                <p>Última consolidação: {latestActivity ? formatDateTime(latestActivity) : 'Indisponível'}</p>
              </div>
            </div>
          </SupportCustomerDetailCard>

          <SupportCustomerDetailCard
            className="px-4 py-4"
            description="Tickets, contatos e sinais que ajudam a seguir a conta sem trocar de tela."
            title="Contexto complementar"
          >
            <div className="space-y-4">
              <div className="space-y-2" id="contatos">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                  Contatos ativos
                </p>
                {customer.activeContacts.length === 0 ? (
                  <p className="text-sm leading-6 text-[color:var(--color-muted)]">Indisponível</p>
                ) : (
                  customer.activeContacts.slice(0, 3).map((contact) => (
                    <div
                      className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3"
                      key={contact.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-[color:var(--color-ink)]">
                          {sanitizeSupportVisibleText(contact.fullName)}
                        </p>
                        {contact.isPrimary ? <StatusPill tone="accent">principal</StatusPill> : null}
                      </div>
                      <p className="mt-1 break-all text-sm text-[color:var(--color-muted)]">
                        {displayCustomerValue(contact.email)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                  Sinais da conta
                </p>
                <div className="flex flex-wrap gap-2">
                  {visibleFeatures.length > 0 ? (
                    visibleFeatures.map((feature) => (
                      <StatusPill key={feature.featureKey}>
                        {humanizeCustomerValue(feature.featureKey)}
                      </StatusPill>
                    ))
                  ) : (
                    <StatusPill>Indisponível</StatusPill>
                  )}
                  {visibleIntegrations.map((integration) => (
                    <StatusPill key={integration.id}>{integration.provider}</StatusPill>
                  ))}
                </div>
              </div>
            </div>
          </SupportCustomerDetailCard>
        </aside>
      </div>
    </div>
  );
}
