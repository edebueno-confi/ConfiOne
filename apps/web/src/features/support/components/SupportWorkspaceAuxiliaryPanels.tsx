import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatDateTime, humanizeToken } from '../../../app/format';
import { EmptyState, LoadingState } from '../../../components/states';
import { sanitizeOperationalVisibleText } from '../../../lib/operational-copy';
import {
  AppButton,
  GhostButton,
  InlineNotice,
  TextInput,
  cx,
} from '../../../components/ui';
import {
  type SupportCustomer360,
  type SupportCustomer360Contact,
  type SupportKnowledgeArticlePickerItem,
  type SupportTicketDetail,
  type SupportTicketQueueItem,
  type TicketStatus,
  type Uuid,
} from '../../../contracts/support-contracts';
import { SupportBadge } from './SupportWorkspacePrimitives';
import { CompactSupportPill, SupportSurfaceIcon } from './SupportWorkspaceVisuals';

type KnowledgePhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type QueueMetricKind = 'open' | 'urgent' | 'unassigned' | 'waiting_customer' | 'waiting_engineering';
type OperationalQueueBadgeTone = 'default' | 'blue' | 'positive' | 'warning' | 'critical' | 'violet';

function canSendKnowledgeArticleToCustomer(article: SupportKnowledgeArticlePickerItem) {
  return (
    article.canSendToCustomer &&
    article.isCustomerSendAllowed &&
    article.publicArticlePath !== null &&
    article.articleStatus === 'published' &&
    article.articleVisibility === 'public'
  );
}

export function OperationalQueueBadge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: OperationalQueueBadgeTone;
}) {
  return (
    <SupportBadge tone={tone} variant="queue">
      <span className="truncate">{children}</span>
    </SupportBadge>
  );
}

export function queueMetricIcon(kind: QueueMetricKind) {
  const className = 'h-[18px] w-[18px]';

  switch (kind) {
    case 'open':
      return <SupportSurfaceIcon className={className} kind="ticket" />;
    case 'urgent':
      return <SupportSurfaceIcon className={className} kind="alert" />;
    case 'unassigned':
      return <SupportSurfaceIcon className={className} kind="user-plus" />;
    case 'waiting_customer':
      return <SupportSurfaceIcon className={className} kind="clock" />;
    case 'waiting_engineering':
      return <SupportSurfaceIcon className={className} kind="code" />;
    default:
      return null;
  }
}

export function SupportHelpCenterPanel({
  articles,
  loading,
  message,
  onCopyPublicLink,
  onSearchChange,
  onSendToCustomer,
  phase,
  search,
}: {
  articles: SupportKnowledgeArticlePickerItem[];
  loading: boolean;
  message: string | null;
  onCopyPublicLink: (article: SupportKnowledgeArticlePickerItem) => void;
  onSearchChange: (value: string) => void;
  onSendToCustomer: (articleId: Uuid) => void;
  phase: KnowledgePhase;
  search: string;
}) {
  if (phase === 'loading' || phase === 'idle') {
    return (
      <section className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-3">
        <LoadingState
          title="Carregando central de ajuda"
          description="Estamos preparando os artigos públicos permitidos para esta tratativa."
        />
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="shrink-0 border-b border-[color:var(--color-border)] pb-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Central de ajuda
            </p>
            <h3 className="text-[15px] font-bold tracking-[-0.025em] text-[color:var(--color-ink)]">
              Conteúdo público seguro para apoiar a resposta
            </h3>
          </div>
          <p className="text-[11px] text-[color:var(--color-muted)]">
            Somente artigos com envio permitido ao cliente.
          </p>
        </div>
      </div>

      {phase === 'contract-unavailable' ? (
        <InlineNotice tone="warning">
          {message ?? 'A central de ajuda não ficou disponível para este ticket.'}
        </InlineNotice>
      ) : phase === 'error' ? (
        <InlineNotice tone="critical">
          {message ?? 'Não foi possível carregar os artigos públicos desta tratativa.'}
        </InlineNotice>
      ) : (
        <>
          <div className="shrink-0 rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]">
                  <SupportSurfaceIcon className="h-[14px] w-[14px]" kind="search" />
                </span>
                <TextInput
                  className="h-10 rounded-[12px] border-[rgba(220,228,242,0.96)] bg-[rgba(244,247,252,0.78)] pl-9 text-[13px]"
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Buscar artigo público por título ou resumo..."
                  value={search}
                />
              </div>
              <span className="inline-flex min-h-8 items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-[11px] font-semibold text-[color:var(--color-muted)]">
                {articles.length} artigo(s)
              </span>
            </div>
          </div>

          {articles.length === 0 ? (
            <InlineNotice>Nenhum artigo público permitido apareceu para este ticket.</InlineNotice>
          ) : (
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {articles.slice(0, 6).map((article) => {
                  const canSendToCustomer = canSendKnowledgeArticleToCustomer(article);
                  const blockReason =
                    article.reasonIfBlocked ?? 'Backend não autorizou o envio ao cliente.';

                  return (
                <article
                  className="rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-3 shadow-[0_8px_16px_rgba(19,33,79,0.04)]"
                  key={`help-center:${article.articleId}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <CompactSupportPill>Público</CompactSupportPill>
                        {article.categoryName ? <CompactSupportPill>{article.categoryName}</CompactSupportPill> : null}
                      </div>
                      <h4 className="line-clamp-2 text-[13px] font-semibold leading-[1.25rem] text-[color:var(--color-ink)]">
                        {article.articleTitle}
                      </h4>
                      <p className="line-clamp-2 text-[11.5px] leading-[1.1rem] text-[color:var(--color-muted)]">
                        {article.articleSummary?.trim() || 'Resumo indisponível.'}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      {canSendToCustomer ? (
                        <a
                          className="inline-flex min-h-8 items-center justify-center rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 text-[11px] font-semibold text-[color:var(--color-ink)] transition hover:border-[rgba(47,107,255,0.28)] hover:text-[color:var(--color-brand-blue)]"
                          href={article.publicArticlePath ?? undefined}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Abrir artigo
                        </a>
                      ) : null}
                      <GhostButton
                        className="min-h-8 rounded-[10px] px-2.5 text-[11px]"
                        disabled={loading || !canSendToCustomer}
                        onClick={() => onCopyPublicLink(article)}
                        title={canSendToCustomer ? undefined : blockReason}
                        type="button"
                      >
                        Copiar link
                      </GhostButton>
                      <AppButton
                        className="min-h-8 rounded-[10px] px-2.5 text-[11px]"
                        disabled={loading || !canSendToCustomer}
                        onClick={() => onSendToCustomer(article.articleId)}
                        title={canSendToCustomer ? undefined : blockReason}
                        type="button"
                      >
                        Marcar envio
                      </AppButton>
                    </div>
                  </div>
                </article>
                  );
                })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function SupportSummaryStrip({
  totalOpen,
  waitingCustomer,
  waitingEngineering,
  highAttention,
  unassigned,
}: {
  totalOpen: number;
  waitingCustomer: number;
  waitingEngineering?: number;
  highAttention: number;
  unassigned: number;
}) {
  const items = [
    { icon: 'open' as QueueMetricKind, label: 'Abertos', value: totalOpen, tone: 'blue' },
    { icon: 'urgent' as QueueMetricKind, label: 'Urgentes', value: highAttention, tone: 'rose' },
    { icon: 'unassigned' as QueueMetricKind, label: 'Não atribuídos', value: unassigned, tone: 'orange' },
    {
      icon: 'waiting_customer' as QueueMetricKind,
      label: 'Aguardando cliente',
      value: waitingCustomer,
      tone: 'yellow',
    },
    ...(typeof waitingEngineering === 'number'
      ? [
          {
            icon: 'waiting_engineering' as QueueMetricKind,
            label: 'Aguardando engenharia',
            value: waitingEngineering,
            tone: 'violet',
          },
        ]
      : []),
  ] as const;

  return (
    <div
      className={cx(
        'grid shrink-0 gap-3 sm:grid-cols-2 2xl:gap-4',
        typeof waitingEngineering === 'number' ? 'xl:grid-cols-5' : 'xl:grid-cols-4',
      )}
    >
      {items.map((item) => (
        <div
          className="flex min-h-[88px] items-center gap-3 rounded-[18px] border border-[rgba(220,228,242,0.96)] bg-[color:var(--color-surface-strong)] px-4.5 py-3 shadow-[0_10px_22px_rgba(19,33,79,0.05)]"
          key={item.label}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3.5">
            <span
              className={cx(
                'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                item.tone === 'rose' && 'bg-[rgba(244,63,94,0.1)] text-[rgb(225,29,72)]',
                item.tone === 'orange' && 'bg-[rgba(249,115,22,0.14)] text-[rgb(194,65,12)]',
                item.tone === 'yellow' && 'bg-[rgba(245,184,61,0.18)] text-[rgb(180,83,9)]',
                item.tone === 'blue' && 'bg-[rgba(47,107,255,0.12)] text-[color:var(--color-brand-blue)]',
                item.tone === 'violet' && 'bg-[rgba(124,58,237,0.1)] text-[rgb(109,40,217)]',
              )}
            >
              {queueMetricIcon(item.icon)}
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className="line-clamp-2 text-[11.5px] font-semibold leading-[1rem] text-[color:var(--color-muted)]">
                {item.label}
              </p>
              <p className="truncate text-[1.7rem] font-bold leading-none tracking-[-0.055em] text-[color:var(--color-ink)]">
                {item.value}
              </p>
              <p className="text-[10px] font-medium text-[rgba(107,120,146,0.86)]">Dados atuais</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SupportTicketPreview({
  ticket,
  detail,
  customer,
  compactSlaStatusLabel,
  compactTicketStatusLabel,
  formatSlaDueLabel,
  primaryContactFromCustomer,
  readCustomerDocumentLabel,
  supportTicketCode,
  ticketTenantLabel,
  toneForSlaStatus,
}: {
  ticket: SupportTicketQueueItem | null;
  detail: SupportTicketDetail | null;
  customer: SupportCustomer360 | null;
  compactSlaStatusLabel: (label: string | null | undefined) => string;
  compactTicketStatusLabel: (status: TicketStatus) => string;
  formatSlaDueLabel: (firstResponseDueAt: string | null, resolutionDueAt: string | null) => string;
  primaryContactFromCustomer: (customer: SupportCustomer360) => SupportCustomer360Contact | null;
  readCustomerDocumentLabel: (customer: SupportCustomer360 | null) => string | null;
  supportTicketCode: (id: string | null | undefined) => string;
  ticketTenantLabel: (ticket: SupportTicketQueueItem) => string;
  toneForSlaStatus: (
    status: SupportTicketQueueItem['slaStatus'] | SupportTicketDetail['slaStatus'],
  ) => OperationalQueueBadgeTone;
}) {
  if (!ticket && !detail) {
    return (
      <EmptyState
        title="Nenhum ticket em foco"
        description="Selecione um ticket da fila para abrir a previa operacional."
      />
    );
  }

  const title = detail?.title ?? ticket?.title ?? 'Ticket sem titulo';
  const tenant =
    detail?.tenantDisplayName ??
    detail?.tenantLegalName ??
    (ticket ? ticketTenantLabel(ticket) : 'Cliente não identificado');
  const assigned = detail?.assignedToFullName ?? ticket?.assignedToFullName ?? 'Nao atribuido';
  const category = detail?.categoryName ?? ticket?.categoryName ?? 'Indisponivel';
  const slaLabel = detail?.slaStatusLabel ?? ticket?.slaStatusLabel ?? 'Sem politica definida';
  const slaStatus = detail?.slaStatus ?? ticket?.slaStatus ?? 'unavailable';
  const slaPolicy = detail?.slaPolicyName ?? ticket?.slaPolicyName ?? 'Sem politica definida';
  const slaDue = formatSlaDueLabel(
    detail?.firstResponseDueAt ?? ticket?.firstResponseDueAt ?? null,
    detail?.resolutionDueAt ?? ticket?.resolutionDueAt ?? null,
  );
  const lastActivity = formatDateTime(
    detail?.lastMessageAt ?? detail?.updatedAt ?? ticket?.lastMessageAt ?? ticket?.updatedAt ?? null,
  );
  const tenantId = detail?.tenantId ?? ticket?.tenantId ?? null;
  const ticketId = detail?.id ?? ticket?.id ?? null;
  const requester = customer ? primaryContactFromCustomer(customer) : null;
  const summary = detail?.description?.trim() ?? '';
  const statusTone =
    (detail?.status ?? ticket?.status) === 'waiting_engineering'
      ? 'violet'
      : (detail?.status ?? ticket?.status) === 'waiting_customer'
        ? 'warning'
        : (detail?.priority ?? ticket?.priority) === 'urgent' ||
            (detail?.severity ?? ticket?.severity) === 'critical'
          ? 'critical'
          : 'blue';
  const previewFacts = [
    { label: 'Categoria', value: category },
    { label: 'SLA contratual', value: slaPolicy },
    { label: 'SLA decorrido', value: slaLabel },
    { label: 'Responsavel', value: assigned },
    {
      label: 'Resolucao',
      value:
        slaDue.replace(/^Resolu..o:\s*/u, '').replace(/^Primeira resposta:\s*/u, '') || 'Indisponivel',
    },
    { label: 'Ultima atividade', value: lastActivity },
  ];

  return (
    <div className="support-queue-context-stack">
      <div className="support-queue-context-card">
        <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[color:var(--color-muted)]">Ticket selecionado</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <OperationalQueueBadge tone={statusTone}>
            {compactTicketStatusLabel((detail?.status ?? ticket?.status ?? 'new') as TicketStatus)}
          </OperationalQueueBadge>
          <OperationalQueueBadge
            tone={
              toneForSlaStatus(slaStatus) === 'critical'
                ? 'critical'
                : toneForSlaStatus(slaStatus) === 'warning'
                  ? 'warning'
                  : 'blue'
            }
          >
            {compactSlaStatusLabel(slaLabel)}
          </OperationalQueueBadge>
          <OperationalQueueBadge tone="default">
            {humanizeToken(detail?.priority ?? ticket?.priority ?? 'normal')}
          </OperationalQueueBadge>
        </div>

        <div className="mt-3.5 min-w-0 space-y-2">
          <p className="text-[1.45rem] font-bold leading-none tracking-[-0.06em]">
            {supportTicketCode(ticketId)}
          </p>
          <h3 className="line-clamp-3 text-[1.06rem] font-bold leading-[1.36rem] tracking-[-0.04em] text-[color:var(--color-ink)]">{title}</h3>
          <p className="text-[11.5px] text-[color:var(--color-muted)]">{tenant}</p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-[color:var(--color-border)] pt-3">
            {previewFacts.map((fact) => (
              <div className="min-w-0 space-y-1" key={fact.label}>
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">{fact.label}</p>
                <p className="truncate text-[11.5px] font-semibold text-[color:var(--color-ink)]">{fact.value || 'Indisponivel'}</p>
              </div>
            ))}
          </div>
        </div>

        {ticketId ? (
          <div className="mt-4 flex items-center gap-2.5">
            <Link
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-[12px] bg-[color:var(--color-brand-blue)] px-4 py-2 text-[12.5px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
              to={`/support/tickets/${ticketId}`}
            >
              Abrir ticket
            </Link>
          </div>
        ) : null}
      </div>

      <div className="support-queue-context-card support-queue-context-card--subtle">
        <p className="text-[12.5px] font-semibold text-[color:var(--color-ink)]">Resumo do caso</p>

        <div className="mt-3 space-y-3 text-[11.5px] leading-[1.35rem] text-[color:var(--color-muted)]">
          <div>
            <p className="font-semibold text-[color:var(--color-ink)]">Resumo operacional</p>
            <p className="mt-1">{summary || 'Resumo indisponível.'}</p>
          </div>

          <div className="border-t border-[color:var(--color-border)] pt-3">
            <p className="font-semibold text-[color:var(--color-ink)]">Contato do cliente</p>
            <div className="mt-1.5 space-y-1">
              <p>{sanitizeOperationalVisibleText(requester?.fullName)}</p>
              <p>{requester ? 'Contato principal' : 'Indisponivel'}</p>
              <p>{requester?.email ?? 'Indisponivel'}</p>
              <p>{customer ? `${customer.activeContacts.length} contato(s) ativo(s)` : 'Indisponivel'}</p>
            </div>
          </div>

          <div className="border-t border-[color:var(--color-border)] pt-3">
            <p className="font-semibold text-[color:var(--color-ink)]">Contexto rapido</p>
            <div className="mt-1.5 space-y-1">
              <p>Cliente: {tenant}</p>
              <p>CNPJ: {readCustomerDocumentLabel(customer) ?? 'Indisponivel'}</p>
              <p>Tickets abertos: {customer ? String(customer.openTicketCount) : 'Indisponivel'}</p>
            </div>
          </div>

          {tenantId ? (
            <Link
              className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[color:var(--color-brand-blue)] underline underline-offset-4"
              to={`/support/customers/${tenantId}`}
            >
              <SupportSurfaceIcon className="h-3.5 w-3.5" kind="open" />
              Ver historico do cliente
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
