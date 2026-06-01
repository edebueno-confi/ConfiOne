import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../../../app/format';
import {
  AppButton,
  GhostButton,
  InlineNotice,
  SelectInput,
  TextInput,
  TextareaInput,
  cx,
} from '../../../components/ui';
import {
  ENGINEERING_WORK_ITEM_TYPES,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  type EngineeringWorkItemType,
  type SupportCustomer360RecentTicket,
  type SupportKnowledgeArticlePickerItem,
  type SupportTicketAttachment,
  type SupportTicketClassificationOption,
  type SupportTicketDetail,
  type SupportTicketEngineeringLink,
  type SupportTicketKnowledgeLink,
  type TicketKnowledgeLinkType,
  type TicketPriority,
  type TicketSeverity,
  type TicketStatus,
  type TicketStatusUpdateTarget,
  type Uuid,
} from '../../../contracts/support-contracts';
import { CompactSupportPill, SupportSurfaceIcon } from './SupportWorkspaceVisuals';
import { EvidenceFileChip, SupportBadge } from './SupportWorkspacePrimitives';

type AttachmentPhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';

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

interface TicketAttachmentUploadDraft {
  files: File[];
  note: string;
  errors: Record<string, string>;
}

export function SupportDrawerPill({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'positive' | 'warning' | 'critical';
}) {
  return (
    <SupportBadge className="support-drawer-pill" tone={tone}>
      <span className="truncate">{children}</span>
    </SupportBadge>
  );
}

export function SupportDrawerField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <label className="support-drawer-field">
      <span className="support-drawer-field__label">{label}</span>
      {children}
      {description ? <span className="support-drawer-field__description">{description}</span> : null}
    </label>
  );
}

function SupportDrawerSecondaryMenu({
  actions,
}: {
  actions: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }>;
}) {
  const visibleActions = actions.filter((action) => Boolean(action.label));

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <details className="support-drawer-secondary-menu">
      <summary className="support-drawer-secondary-menu__trigger">Mais ações</summary>
      <div className="support-drawer-secondary-menu__panel">
        {visibleActions.map((action) => (
          <button
            className="support-drawer-secondary-menu__action"
            disabled={action.disabled}
            key={action.label}
            onClick={action.onClick}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>
    </details>
  );
}

function SupportPriorityOptionCard({
  active,
  helper,
  label,
  onClick,
  tone = 'default',
}: {
  active: boolean;
  helper: string;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'warning' | 'critical' | 'positive';
}) {
  return (
    <button
      className={cx(
        'flex min-h-[50px] w-full items-center gap-2 rounded-[12px] border px-3 py-2 text-left transition',
        active
          ? tone === 'critical'
            ? 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)]'
            : tone === 'warning'
              ? 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)]'
              : tone === 'positive'
                ? 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)]'
                : 'border-[rgba(47,107,255,0.28)] bg-[rgba(47,107,255,0.08)]'
          : 'border-[color:var(--color-support-border)] bg-white hover:border-[rgba(47,107,255,0.22)]',
      )}
      onClick={onClick}
      type="button"
    >
      <span
        className={cx(
          'inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border',
          active
            ? tone === 'critical'
              ? 'border-[color:var(--color-danger-text)] text-[color:var(--color-danger-text)]'
              : tone === 'warning'
                ? 'border-[color:var(--color-warning-text)] text-[color:var(--color-warning-text)]'
                : tone === 'positive'
                  ? 'border-[color:var(--color-success-text)] text-[color:var(--color-success-text)]'
                  : 'border-[color:var(--color-brand-blue)] text-[color:var(--color-brand-blue)]'
            : 'border-[color:var(--color-border)] text-transparent',
        )}
      >
        ●
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-[color:var(--color-ink)]">{label}</p>
        <p className="text-[11px] leading-4 text-[color:var(--color-muted)]">{helper}</p>
      </div>
    </button>
  );
}

export function SupportClassificationDrawerPanel({
  classificationDraft,
  classificationOptionsMessage,
  classificationReasonOptions,
  humanizePriority,
  humanizeSeverity,
  onClassificationDraftChange,
  onPrioritySeverityDraftChange,
  priorityReasonOptions,
  prioritySeverityDraft,
  submitting,
  ticketCategoryOptions,
}: {
  classificationDraft: TicketClassificationDraft;
  classificationOptionsMessage: string | null;
  classificationReasonOptions: SupportTicketClassificationOption[];
  humanizePriority: (priority: TicketPriority) => string;
  humanizeSeverity: (severity: TicketSeverity) => string;
  onClassificationDraftChange: (patch: Partial<TicketClassificationDraft>) => void;
  onPrioritySeverityDraftChange: (patch: Partial<TicketPrioritySeverityDraft>) => void;
  priorityReasonOptions: SupportTicketClassificationOption[];
  prioritySeverityDraft: TicketPrioritySeverityDraft;
  submitting: boolean;
  ticketCategoryOptions: SupportTicketClassificationOption[];
}) {
  const selectedCategory = ticketCategoryOptions.find(
    (category) => category.optionId === classificationDraft.categoryId,
  );
  const selectedReason = classificationReasonOptions.find(
    (reason) => reason.optionId === classificationDraft.operationalReasonId,
  );

  return (
    <div className="support-drawer-stack">
      <div className="support-drawer-section">
        {classificationOptionsMessage ? (
          <InlineNotice tone="warning">{classificationOptionsMessage}</InlineNotice>
        ) : null}
        <div className="support-drawer-section">
          <SupportDrawerField label="Categoria operacional *">
            <SelectInput
              className="support-drawer-select"
              disabled={submitting || ticketCategoryOptions.length === 0}
              onChange={(event) =>
                onClassificationDraftChange({ categoryId: event.target.value as Uuid | '' })
              }
              value={classificationDraft.categoryId}
            >
              <option value="">Selecionar</option>
              {ticketCategoryOptions.map((category) => (
                <option key={category.optionId} value={category.optionId}>
                  {category.name}
                </option>
              ))}
            </SelectInput>
          </SupportDrawerField>

          <SupportDrawerField label="Motivo operacional *">
            <SelectInput
              className="support-drawer-select"
              disabled={submitting || classificationReasonOptions.length === 0}
              onChange={(event) =>
                onClassificationDraftChange({
                  operationalReasonId: event.target.value as Uuid | '',
                })
              }
              value={classificationDraft.operationalReasonId}
            >
              <option value="">Selecionar</option>
              {classificationReasonOptions.map((reason) => (
                <option key={reason.optionId} value={reason.optionId}>
                  {reason.name}
                </option>
              ))}
            </SelectInput>
          </SupportDrawerField>

          <div className="support-drawer-section">
            <p className="support-drawer-section__title">Prioridade *</p>
            <div className="support-drawer-option-grid">
              {TICKET_PRIORITIES.map((priority) => (
                <SupportPriorityOptionCard
                  active={prioritySeverityDraft.priority === priority}
                  helper={
                    priority === 'urgent'
                      ? 'Impacto crítico'
                      : priority === 'high'
                        ? 'Impacto alto'
                        : priority === 'normal'
                          ? 'Impacto moderado'
                          : 'Sem impacto significativo'
                  }
                  key={priority}
                  label={humanizePriority(priority)}
                  onClick={() => onPrioritySeverityDraftChange({ priority })}
                  tone={
                    priority === 'urgent'
                      ? 'critical'
                      : priority === 'high'
                        ? 'warning'
                        : 'default'
                  }
                />
              ))}
            </div>
          </div>

          <div className="support-drawer-section">
            <p className="support-drawer-section__title">Severidade *</p>
            <div className="support-drawer-option-grid">
              {TICKET_SEVERITIES.map((severity) => (
                <SupportPriorityOptionCard
                  active={prioritySeverityDraft.severity === severity}
                  helper={
                    severity === 'critical'
                      ? 'Risco crítico'
                      : severity === 'high'
                        ? 'Risco alto'
                        : severity === 'medium'
                          ? 'Risco moderado'
                          : 'Risco baixo'
                  }
                  key={severity}
                  label={humanizeSeverity(severity)}
                  onClick={() => onPrioritySeverityDraftChange({ severity })}
                  tone={
                    severity === 'critical'
                      ? 'critical'
                      : severity === 'high'
                        ? 'warning'
                        : severity === 'low'
                          ? 'positive'
                          : 'default'
                  }
                />
              ))}
            </div>
          </div>

          <SupportDrawerField label="Motivo da prioridade">
            <SelectInput
              className="support-drawer-select"
              disabled={submitting || priorityReasonOptions.length === 0}
              onChange={(event) =>
                onPrioritySeverityDraftChange({
                  operationalReasonId: event.target.value as Uuid | '',
                })
              }
              value={prioritySeverityDraft.operationalReasonId}
            >
              <option value="">Sem motivo adicional</option>
              {priorityReasonOptions.map((reason) => (
                <option key={reason.optionId} value={reason.optionId}>
                  {reason.name}
                </option>
              ))}
            </SelectInput>
          </SupportDrawerField>

          <SupportDrawerField
            description="Opcional; use apenas quando a decisão precisar ficar clara para a equipe."
            label="Observação para histórico"
          >
            <TextareaInput
              className="support-drawer-textarea border-[color:var(--color-support-border)]"
              disabled={submitting}
              onChange={(event) => onClassificationDraftChange({ note: event.target.value })}
              placeholder="Explique brevemente o critério usado nesta classificação."
              value={classificationDraft.note}
            />
          </SupportDrawerField>

          <section className="support-drawer-card support-drawer-classification-summary">
            <div>
              <p className="support-drawer-card__title">Resumo da classificação</p>
              <p className="support-drawer-card__summary">
                Revise os campos principais antes de salvar.
              </p>
            </div>
            <dl className="support-drawer-summary-list">
              <div>
                <dt>Categoria</dt>
                <dd>{selectedCategory?.name ?? 'Indisponível'}</dd>
              </div>
              <div>
                <dt>Motivo</dt>
                <dd>{selectedReason?.name ?? 'Indisponível'}</dd>
              </div>
              <div>
                <dt>Prioridade</dt>
                <dd>{humanizePriority(prioritySeverityDraft.priority)}</dd>
              </div>
              <div>
                <dt>Severidade</dt>
                <dd>{humanizeSeverity(prioritySeverityDraft.severity)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

export function SupportStatusDrawerPanel({
  humanizeStatus,
  nextStatusChoices,
  onStatusDraftChange,
  onStatusNoteChange,
  onStatusReasonChange,
  onSubmit,
  requireStatusReason,
  statusDraft,
  statusNote,
  statusReasonId,
  statusReasonOptions,
  submitting,
  ticketDetail,
}: {
  humanizeStatus: (status: TicketStatus | TicketStatusUpdateTarget) => string;
  nextStatusChoices: TicketStatusUpdateTarget[];
  onStatusDraftChange: (status: TicketStatusUpdateTarget) => void;
  onStatusNoteChange: (value: string) => void;
  onStatusReasonChange: (value: Uuid | '') => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  requireStatusReason: boolean;
  statusDraft: TicketStatusUpdateTarget;
  statusNote: string;
  statusReasonId: Uuid | '';
  statusReasonOptions: SupportTicketClassificationOption[];
  submitting: boolean;
  ticketDetail: SupportTicketDetail;
}) {
  return (
    <form className="support-drawer-stack" id="support-ticket-status-form" onSubmit={onSubmit}>
      <div className="support-drawer-section">
        <div className="support-drawer-note">Esta alteração será registrada no histórico do ticket.</div>

        <SupportDrawerField label="Status atual">
          <SelectInput className="support-drawer-select" disabled value={ticketDetail.status}>
            <option value={ticketDetail.status}>{humanizeStatus(ticketDetail.status)}</option>
          </SelectInput>
        </SupportDrawerField>

        <div className="support-drawer-section">
          <p className="support-drawer-section__title">Novo status</p>
          {nextStatusChoices.length === 0 ? (
            <InlineNotice>Sem transição disponível para o status atual.</InlineNotice>
          ) : (
            <div className="support-status-choice-list">
              {nextStatusChoices.map((status) => (
                <button
                  className={cx('support-status-choice', statusDraft === status && 'is-selected')}
                  disabled={submitting}
                  key={status}
                  onClick={() => onStatusDraftChange(status)}
                  type="button"
                >
                  <span>{humanizeStatus(status)}</span>
                  <small>
                    {status === 'new'
                      ? 'Aberto e aguardando triagem'
                      : status === 'triage'
                        ? 'Em triagem operacional'
                      : status === 'in_progress'
                        ? 'Sendo tratado pela equipe'
                        : status === 'waiting_customer'
                          ? 'Aguardando retorno do cliente'
                          : status === 'waiting_support'
                            ? 'Aguardando ação do suporte'
                          : status === 'waiting_engineering'
                            ? 'Aguardando dependência técnica'
                            : status === 'resolved'
                              ? 'Concluído e validado'
                              : 'Cancelado'}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>

        <SupportDrawerField label="Motivo da mudança de status">
          <SelectInput
            className="support-drawer-select"
            disabled={submitting || statusReasonOptions.length === 0}
            onChange={(event) => onStatusReasonChange(event.target.value as Uuid | '')}
            value={statusReasonId}
          >
            <option value="">Sem motivo adicional</option>
            {statusReasonOptions.map((reason) => (
              <option key={reason.optionId} value={reason.optionId}>
                {reason.name}
              </option>
            ))}
          </SelectInput>
        </SupportDrawerField>

        {requireStatusReason && !statusReasonId ? (
          <InlineNotice tone="warning">Informe o motivo da mudança de status.</InlineNotice>
        ) : null}

        <SupportDrawerField label="Observação interna">
          <TextareaInput
            className="support-drawer-textarea border-[color:var(--color-support-border)]"
            disabled={submitting}
            onChange={(event) => onStatusNoteChange(event.target.value)}
            placeholder="Observação interna opcional"
            value={statusNote}
          />
        </SupportDrawerField>
      </div>
    </form>
  );
}

export function SupportKnowledgeDrawerPanel({
  articles,
  humanizeKnowledgeLinkType,
  humanizeKnowledgeStatus,
  humanizeKnowledgeVisibility,
  links,
  loading,
  noteDraft,
  onArchive,
  onCopyPublicLink,
  onLinkInternal,
  onMarkGap,
  onNeedsUpdate,
  onNoteChange,
  onSearchChange,
  onSendToCustomer,
  search,
}: {
  articles: SupportKnowledgeArticlePickerItem[];
  humanizeKnowledgeLinkType: (linkType: TicketKnowledgeLinkType) => string;
  humanizeKnowledgeStatus: (status: SupportKnowledgeArticlePickerItem['articleStatus']) => string;
  humanizeKnowledgeVisibility: (visibility: SupportKnowledgeArticlePickerItem['articleVisibility']) => string;
  links: SupportTicketKnowledgeLink[];
  loading: boolean;
  noteDraft: string;
  onArchive: (linkId: Uuid) => void;
  onCopyPublicLink: (
    article: Pick<
      SupportKnowledgeArticlePickerItem,
      | 'articleStatus'
      | 'articleVisibility'
      | 'canSendToCustomer'
      | 'isCustomerSendAllowed'
      | 'publicArticlePath'
      | 'reasonIfBlocked'
    >,
  ) => void;
  onLinkInternal: (articleId: Uuid) => void;
  onMarkGap: () => void;
  onNeedsUpdate: (articleId: Uuid) => void;
  onNoteChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSendToCustomer: (articleId: Uuid) => void;
  search: string;
}) {
  const suggestedArticles = articles.slice(0, 4);
  const linkedArticles = links.filter((link) => link.linkType !== 'documentation_gap').slice(0, 3);
  const reviewItems = links
    .filter((link) => link.linkType === 'documentation_gap' || link.linkType === 'needs_update')
    .slice(0, 3);
  const publicCount = articles.filter((article) => article.articleVisibility === 'public').length;
  const internalCount = articles.filter((article) => article.articleVisibility === 'internal').length;
  const canSendToCustomer = (article: SupportKnowledgeArticlePickerItem) =>
    article.canSendToCustomer &&
    article.isCustomerSendAllowed &&
    article.publicArticlePath !== null &&
    article.articleStatus === 'published' &&
    article.articleVisibility === 'public';

  return (
    <div className="support-drawer-stack">
      <div className="support-drawer-section">
        <SupportDrawerField label="Buscar na base">
          <div className="support-drawer-section">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]">
                <SupportSurfaceIcon className="h-[13px] w-[13px]" kind="search" />
              </span>
              <TextInput
                className="support-drawer-input border-[color:var(--color-support-border)] bg-[color:var(--color-support-muted)] pl-9"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar artigo, palavra-chave ou categoria"
                value={search}
              />
            </div>
            <div className="support-drawer-tag-row">
              <SupportDrawerPill>Público {publicCount}</SupportDrawerPill>
              <SupportDrawerPill>Interno {internalCount}</SupportDrawerPill>
              <SupportDrawerPill tone="accent">Vinculados {links.length}</SupportDrawerPill>
              <SupportDrawerPill tone="positive">Sugeridos {suggestedArticles.length}</SupportDrawerPill>
            </div>
          </div>
        </SupportDrawerField>
      </div>

      <div className="support-drawer-scroll support-drawer-stack pr-1">
        <section className="support-drawer-section">
          <div>
            <p className="support-drawer-section__title">Artigos sugeridos</p>
            <p className="support-drawer-section__helper">
              Resultados úteis para a tratativa atual, mantendo visibilidade e contexto do artigo.
            </p>
          </div>
          {suggestedArticles.length === 0 ? (
            <InlineNotice>Nenhum artigo compatível apareceu para esta busca.</InlineNotice>
          ) : (
            suggestedArticles.map((article) => (
              <article className="support-drawer-card support-drawer-card--compact" key={article.articleId}>
                <div className="support-drawer-card__eyebrow">
                  <SupportDrawerPill>{humanizeKnowledgeVisibility(article.articleVisibility)}</SupportDrawerPill>
                  {article.categoryName ? <SupportDrawerPill tone="accent">{article.categoryName}</SupportDrawerPill> : null}
                  <SupportDrawerPill tone={article.articleStatus === 'review' ? 'warning' : 'default'}>
                    {humanizeKnowledgeStatus(article.articleStatus)}
                  </SupportDrawerPill>
                </div>
                <p className="support-drawer-card__title">{article.articleTitle}</p>
                <p className="support-drawer-card__summary">
                  {article.articleSummary?.trim() || 'Resumo indisponível.'}
                </p>
                <div className="support-drawer-card__actions">
                  <button
                    className="support-drawer-inline-action"
                    disabled={loading}
                    onClick={() => onLinkInternal(article.articleId)}
                    type="button"
                  >
                    Vincular
                  </button>
                  <button
                    className="support-drawer-inline-action"
                    disabled={loading || !canSendToCustomer(article)}
                    onClick={() => onCopyPublicLink(article)}
                    title={
                      canSendToCustomer(article)
                        ? undefined
                        : article.reasonIfBlocked ?? 'Envio ao cliente indisponível para este artigo.'
                    }
                    type="button"
                  >
                    Copiar link
                  </button>
                  <button
                    className="support-drawer-inline-action"
                    disabled={loading || !canSendToCustomer(article)}
                    onClick={() => onSendToCustomer(article.articleId)}
                    title={
                      canSendToCustomer(article)
                        ? undefined
                        : article.reasonIfBlocked ?? 'Envio ao cliente indisponível para este artigo.'
                    }
                    type="button"
                  >
                    Marcar como enviado
                  </button>
                  <SupportDrawerSecondaryMenu
                    actions={[
                      {
                        disabled: loading,
                        label: 'Precisa revisão',
                        onClick: () => onNeedsUpdate(article.articleId),
                      },
                    ]}
                  />
                </div>
              </article>
            ))
          )}
        </section>

        <section className="support-drawer-section">
          <div>
            <p className="support-drawer-section__title">Artigos vinculados</p>
            <p className="support-drawer-section__helper">
              Referências já relacionadas ao ticket, incluindo links públicos enviados ao cliente.
            </p>
          </div>
          {linkedArticles.length === 0 ? (
            <InlineNotice>Nenhum artigo vinculado apareceu para este ticket.</InlineNotice>
          ) : (
            linkedArticles.map((link) => (
              <article className="support-drawer-card support-drawer-card--compact" key={link.ticketKnowledgeLinkId}>
                <div className="support-drawer-card__eyebrow">
                  <SupportDrawerPill tone={link.linkType === 'sent_to_customer' ? 'positive' : 'accent'}>
                    {humanizeKnowledgeLinkType(link.linkType)}
                  </SupportDrawerPill>
                </div>
                <p className="support-drawer-card__title">
                  {link.articleTitle ?? 'Vínculo sem artigo associado'}
                </p>
                <p className="support-drawer-card__meta">{formatDateTime(link.createdAt)}</p>
                <div className="support-drawer-card__actions">
                  {link.publicArticlePath ? (
                    <button
                      className="support-drawer-inline-action"
                      disabled={
                        !link.canSendToCustomer ||
                        !link.isCustomerSendAllowed ||
                        link.articleStatus !== 'published' ||
                        link.articleVisibility !== 'public'
                      }
                      onClick={() =>
                        onCopyPublicLink({
                          articleStatus: link.articleStatus ?? 'draft',
                          articleVisibility: link.articleVisibility ?? 'internal',
                          canSendToCustomer: link.canSendToCustomer,
                          isCustomerSendAllowed: link.isCustomerSendAllowed,
                          publicArticlePath: link.publicArticlePath,
                          reasonIfBlocked: link.canSendToCustomer
                            ? null
                            : 'Disponível apenas como referência interna.',
                        })
                      }
                      type="button"
                    >
                      Copiar link
                    </button>
                  ) : null}
                  <button
                    className="support-drawer-inline-action"
                    onClick={() => onArchive(link.ticketKnowledgeLinkId)}
                    type="button"
                  >
                    Arquivar vínculo
                  </button>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="support-drawer-section">
          <div>
            <p className="support-drawer-section__title">Lacunas e revisões</p>
            <p className="support-drawer-section__helper">
              Registre ausência de documentação ou marque materiais que precisam de revisão editorial.
            </p>
          </div>
          {reviewItems.length > 0 ? (
            reviewItems.map((link) => (
              <article className="support-drawer-card support-drawer-card--compact" key={link.ticketKnowledgeLinkId}>
                <div className="support-drawer-card__eyebrow">
                  <SupportDrawerPill tone="warning">
                    {humanizeKnowledgeLinkType(link.linkType)}
                  </SupportDrawerPill>
                </div>
                <p className="support-drawer-card__title">
                  {link.articleTitle ?? 'Lacuna sem artigo associado'}
                </p>
                <p className="support-drawer-card__meta">{formatDateTime(link.createdAt)}</p>
              </article>
            ))
          ) : (
            <div className="support-drawer-note">
              Nenhuma lacuna ou revisão formal apareceu ainda para este ticket.
            </div>
          )}
          <SupportDrawerField label="Observação operacional">
            <TextareaInput
              className="support-drawer-textarea border-[color:var(--color-support-border)]"
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Descreva objetivamente o que faltou na documentação deste caso."
              value={noteDraft}
            />
          </SupportDrawerField>
          <div className="support-drawer-card__actions">
            <button
              className="support-drawer-inline-action"
              disabled={loading}
              onClick={onMarkGap}
              type="button"
            >
              Registrar lacuna
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function SupportEvidenceDrawerPanel({
  attachmentUploadDraft,
  attachments,
  formatAttachmentSize,
  onNoteChange,
  onRemoveDraftFile,
  onSelectFiles,
}: {
  attachmentUploadDraft: TicketAttachmentUploadDraft;
  attachments: SupportTicketAttachment[];
  formatAttachmentSize: (sizeBytes: number) => string;
  onNoteChange: (value: string) => void;
  onRemoveDraftFile: (index: number) => void;
  onSelectFiles: () => void;
}) {
  const visibleDraftFiles = attachmentUploadDraft.files;

  return (
    <div className="support-drawer-stack">
      <SupportDrawerField label="Selecionar arquivos">
        <button className="support-drawer-upload-dropzone" onClick={onSelectFiles} type="button">
          <SupportSurfaceIcon className="h-8 w-8 text-[color:var(--color-brand-navy)]" kind="upload" />
          <p className="support-drawer-upload-dropzone__title">
            Arraste arquivos aqui ou clique para selecionar
          </p>
          <p className="mt-1 support-drawer-upload-dropzone__helper">
            Até 10 MB por arquivo em fluxo governado de evidências
          </p>
          <p className="mt-1 support-drawer-upload-dropzone__types">
            PDF, PNG, JPG, WEBP, CSV, TXT e JSON
          </p>
        </button>
      </SupportDrawerField>

      <div className="support-drawer-scroll support-drawer-stack pr-1">
        <section className="support-drawer-section">
          {visibleDraftFiles.length > 0
            ? visibleDraftFiles.map((file, index) => (
                <EvidenceFileChip
                  actions={
                    <>
                      <span />
                      <button
                        className="font-semibold text-[color:var(--color-muted)]"
                        onClick={() => onRemoveDraftFile(index)}
                        type="button"
                      >
                        Remover
                      </button>
                    </>
                  }
                  key={`${file.name}:${index}`}
                  meta={formatAttachmentSize(file.size)}
                  title={file.name}
                />
              ))
            : attachments.slice(0, 3).map((attachment) => (
                <EvidenceFileChip
                  key={attachment.attachmentId}
                  meta={`${formatAttachmentSize(attachment.sizeBytes)} · ${formatDateTime(attachment.createdAt)}`}
                  title={attachment.displayName}
                />
              ))}
        </section>

        <section className="support-drawer-section">
          <SupportDrawerField label="Descrição opcional">
            <TextareaInput
              className="support-drawer-textarea border-[color:var(--color-support-border)]"
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Informe um contexto sobre estas evidências para facilitar a análise."
              value={attachmentUploadDraft.note}
            />
          </SupportDrawerField>
          <p className="support-drawer-section__helper">
            Os anexos ficam disponíveis para a análise do suporte sem expor detalhes internos de armazenamento.
          </p>
        </section>
      </div>
    </div>
  );
}

export function SupportAutomationDrawerPanel({
  canRecalculateSla,
  onOpenHandoff,
  onRecalculateSla,
  submitting,
}: {
  canRecalculateSla: boolean;
  onOpenHandoff: () => void;
  onRecalculateSla: () => void;
  submitting: boolean;
}) {
  const items = [
    {
      key: 'sla',
      title: 'Recalcular SLA',
      description: 'Executa o recálculo interno com base na política já aplicada ao ticket.',
      actionLabel: submitting ? 'Recalculando...' : 'Executar',
      onClick: onRecalculateSla,
      disabled: !canRecalculateSla || submitting,
      status: canRecalculateSla ? 'Disponível' : 'Indisponível',
    },
    {
      key: 'playbook',
      title: 'Executar playbook',
      description: 'Fluxo ainda indisponível para este ticket.',
      actionLabel: 'Indisponível',
      onClick: undefined,
      disabled: true,
      status: 'Indisponível',
    },
    {
      key: 'task',
      title: 'Criar tarefa',
      description: 'A criação de tarefa operacional ainda não está disponível para este ticket.',
      actionLabel: 'Indisponível',
      onClick: undefined,
      disabled: true,
      status: 'Indisponível',
    },
    {
      key: 'share',
      title: 'Compartilhar ticket',
      description: 'O compartilhamento governado ainda não foi materializado para esta superfície.',
      actionLabel: 'Indisponível',
      onClick: undefined,
      disabled: true,
      status: 'Indisponível',
    },
  ] as const;

  return (
    <div className="support-drawer-stack">
      <div className="support-drawer-note">
        <p>
          Ações indisponíveis permanecem bloqueadas. A interface não simula SLA, playbook, tarefa ou compartilhamento.
        </p>
      </div>

      <div className="support-drawer-section">
        {items.map((item) => (
          <div className="support-drawer-card" key={item.key}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="support-drawer-card__title">{item.title}</p>
                <p className="support-drawer-card__summary">{item.description}</p>
              </div>
              <SupportDrawerPill tone={item.disabled ? 'default' : 'accent'}>
                {item.status}
              </SupportDrawerPill>
            </div>
            <div className="support-drawer-card__actions">
              <AppButton
                className="support-drawer-footer-button"
                disabled={item.disabled}
                onClick={item.onClick}
                type="button"
              >
                {item.actionLabel}
              </AppButton>
            </div>
          </div>
        ))}
      </div>

      <div className="support-drawer-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="support-drawer-card__title">Handoff técnico</p>
            <p className="support-drawer-card__summary">
              Abra o drawer dedicado quando a tratativa precisar escalar o caso para Engenharia.
            </p>
          </div>
          <GhostButton className="support-drawer-footer-button" onClick={onOpenHandoff} type="button">
            Abrir handoff
          </GhostButton>
        </div>
      </div>
    </div>
  );
}

export function SupportInternalActionsDrawerPanel({
  attachments,
  canCreateEngineeringHandoff,
  handoffDraft,
  humanizeEngineeringWorkItemType,
  onEngineeringHandoffDraftChange,
  onEngineeringHandoffSubmit,
}: {
  attachments: SupportTicketAttachment[];
  canCreateEngineeringHandoff: boolean;
  handoffDraft: EngineeringHandoffDraft;
  humanizeEngineeringWorkItemType: (type: EngineeringWorkItemType) => string;
  onEngineeringHandoffDraftChange: (patch: Partial<EngineeringHandoffDraft>) => void;
  onEngineeringHandoffSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="support-drawer-stack" id="support-engineering-handoff-form" onSubmit={onEngineeringHandoffSubmit}>
      <div className="support-drawer-section">
        <div className="support-drawer-note">
          Engenharia disponível. Demais áreas seguem indisponíveis nesta versão.
        </div>

        <SupportDrawerField label="Tipo de acionamento">
          <SelectInput className="support-drawer-select" disabled value="internal">
            <option value="internal">Solicitação interna</option>
          </SelectInput>
        </SupportDrawerField>

        <SupportDrawerField label="Área acionada">
          <SelectInput className="support-drawer-select" disabled value="engineering">
            <option value="engineering">Engenharia</option>
          </SelectInput>
        </SupportDrawerField>

        <SupportDrawerField label="Tipo de apoio">
          <SelectInput
            className="support-drawer-select"
            onChange={(event) =>
              onEngineeringHandoffDraftChange({
                workItemType: event.target.value as EngineeringWorkItemType,
              })
            }
            value={handoffDraft.workItemType}
          >
            {ENGINEERING_WORK_ITEM_TYPES.map((item) => (
              <option key={item} value={item}>
                {humanizeEngineeringWorkItemType(item)}
              </option>
            ))}
          </SelectInput>
        </SupportDrawerField>

        <SupportDrawerField label="Resumo técnico">
          <TextInput
            className="support-drawer-input"
            onChange={(event) => onEngineeringHandoffDraftChange({ title: event.target.value })}
            placeholder="Resumo curto do apoio necessário"
            value={handoffDraft.title}
          />
        </SupportDrawerField>

        <SupportDrawerField label="Contexto e impacto">
          <TextareaInput
            className="support-drawer-textarea border-[color:var(--color-support-border)]"
            onChange={(event) => onEngineeringHandoffDraftChange({ description: event.target.value })}
            placeholder="Descreva o contexto, sinais observados e impacto no atendimento."
            value={handoffDraft.description}
          />
        </SupportDrawerField>

        {attachments.length > 0 ? (
          <div className="support-drawer-note">
            {attachments.length} evidência(s) disponível(is) para apoiar este acionamento.
          </div>
        ) : null}
      </div>

      {!canCreateEngineeringHandoff ? (
        <InlineNotice tone="warning">
          O handoff técnico não está disponível para este ticket no contexto atual.
        </InlineNotice>
      ) : null}
    </form>
  );
}

export function SupportAttachmentsReadPanel({
  attachmentKind,
  attachmentMessage,
  attachmentPhase,
  attachments,
  downloadingAttachmentId,
  formatAttachmentSize,
  humanizeAttachmentStatus,
  onDownload,
  toneForAttachmentStatus,
}: {
  attachmentKind: (attachment: SupportTicketAttachment) => string;
  attachmentMessage: string | null;
  attachmentPhase: AttachmentPhase;
  attachments: SupportTicketAttachment[];
  downloadingAttachmentId: string | null;
  formatAttachmentSize: (sizeBytes: number) => string;
  humanizeAttachmentStatus: (status: string) => string;
  onDownload: (attachmentId: Uuid) => void;
  toneForAttachmentStatus: (
    status: SupportTicketAttachment['status'],
  ) => 'default' | 'accent' | 'positive' | 'warning' | 'critical';
}) {
  if (attachmentPhase === 'loading' || attachmentPhase === 'idle') {
    return (
      <div className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-4 text-[12px] text-[color:var(--color-muted)]">
        Estamos preparando os arquivos já vinculados ao ticket.
      </div>
    );
  }

  if (attachmentPhase === 'contract-unavailable' || attachmentPhase === 'error') {
    return <InlineNotice tone="warning">{attachmentMessage ?? 'Anexos indisponíveis nesta versão.'}</InlineNotice>;
  }

  if (attachments.length === 0) {
    return <InlineNotice>Nenhum anexo vinculado a este ticket.</InlineNotice>;
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <EvidenceFileChip
          actions={
            <>
              <span />
              <button
                className="font-semibold text-[color:var(--color-brand-blue)]"
                disabled={!attachment.canDownload || downloadingAttachmentId === attachment.attachmentId}
                onClick={() => onDownload(attachment.attachmentId)}
                type="button"
              >
                {downloadingAttachmentId === attachment.attachmentId ? 'Abrindo...' : 'Visualizar'}
              </button>
            </>
          }
          key={attachment.attachmentId}
          meta={`${attachmentKind(attachment)} · ${formatAttachmentSize(attachment.sizeBytes)} · ${formatDateTime(attachment.createdAt)}`}
          statusBadge={
            <CompactSupportPill tone={toneForAttachmentStatus(attachment.status)}>
              {humanizeAttachmentStatus(attachment.status)}
            </CompactSupportPill>
          }
          title={attachment.displayName}
        />
      ))}
    </div>
  );
}

export function SupportRelatedDrawerPanel({
  attachmentKind,
  attachments,
  compactTicketStatusLabel,
  engineeringLinks,
  formatAttachmentSize,
  humanizeEngineeringWorkItemStatus,
  humanizeEngineeringWorkItemType,
  humanizeKnowledgeLinkType,
  humanizePriority,
  humanizeSeverity,
  knowledgeLinks,
  recentTickets,
  supportTicketCode,
  toneForTicketStatus,
}: {
  attachmentKind: (attachment: SupportTicketAttachment) => string;
  attachments: SupportTicketAttachment[];
  compactTicketStatusLabel: (status: TicketStatus) => string;
  engineeringLinks: SupportTicketEngineeringLink[];
  formatAttachmentSize: (sizeBytes: number) => string;
  humanizeEngineeringWorkItemStatus: (status: SupportTicketEngineeringLink['workItemStatus']) => string;
  humanizeEngineeringWorkItemType: (type: EngineeringWorkItemType) => string;
  humanizeKnowledgeLinkType: (linkType: TicketKnowledgeLinkType) => string;
  humanizePriority: (priority: TicketPriority) => string;
  humanizeSeverity: (severity: TicketSeverity) => string;
  knowledgeLinks: SupportTicketKnowledgeLink[];
  recentTickets: SupportCustomer360RecentTicket[];
  supportTicketCode: (ticketId: Uuid) => string;
  toneForTicketStatus: (
    status: TicketStatus,
  ) => 'default' | 'accent' | 'positive' | 'warning' | 'critical';
}) {
  const hasContent =
    recentTickets.length > 0 ||
    attachments.length > 0 ||
    engineeringLinks.length > 0 ||
    knowledgeLinks.length > 0;

  if (!hasContent) {
    return (
      <InlineNotice>
        Nenhum item relacionado apareceu para este ticket.
      </InlineNotice>
    );
  }

  return (
    <div className="support-drawer-stack">
      <section className="support-drawer-section">
        <div>
          <p className="support-drawer-section__title">Tickets recentes do cliente</p>
          <p className="support-drawer-section__helper">
            Histórico curto do mesmo cliente para identificar recorrência, contexto ou impacto cruzado.
          </p>
        </div>
        {recentTickets.length === 0 ? (
          <InlineNotice>Nenhum outro ticket recente apareceu para este cliente.</InlineNotice>
        ) : (
          <div className="support-drawer-compact-list">
            {recentTickets.map((ticket) => (
              <Link className="support-drawer-compact-link" key={ticket.id} to={`/support/tickets/${ticket.id}`}>
                <div className="support-drawer-compact-item__row">
                  <p className="support-drawer-compact-item__code">{supportTicketCode(ticket.id)}</p>
                  <SupportDrawerPill tone={toneForTicketStatus(ticket.status)}>
                    {compactTicketStatusLabel(ticket.status)}
                  </SupportDrawerPill>
                </div>
                <p className="support-drawer-compact-item__title">{ticket.title}</p>
                <p className="support-drawer-compact-item__meta">
                  {humanizePriority(ticket.priority)} · {humanizeSeverity(ticket.severity)} · {formatDateTime(ticket.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {knowledgeLinks.length > 0 ? (
        <section className="support-drawer-section">
          <div>
            <p className="support-drawer-section__title">Artigos vinculados</p>
            <p className="support-drawer-section__helper">
              Base de conhecimento já usada na tratativa ou relevante para continuidade do caso.
            </p>
          </div>
          <div className="support-drawer-compact-list">
            {knowledgeLinks.slice(0, 4).map((link) => (
              <div className="support-drawer-compact-item" key={link.ticketKnowledgeLinkId}>
                <div className="support-drawer-compact-item__row">
                  <p className="support-drawer-compact-item__title">
                    {link.articleTitle ?? 'Vínculo sem artigo associado'}
                  </p>
                  <SupportDrawerPill tone={link.linkType === 'sent_to_customer' ? 'positive' : 'accent'}>
                    {humanizeKnowledgeLinkType(link.linkType)}
                  </SupportDrawerPill>
                </div>
                <p className="support-drawer-compact-item__meta">
                  {humanizeKnowledgeLinkType(link.linkType)} · {formatDateTime(link.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {engineeringLinks.length > 0 ? (
        <section className="support-drawer-section">
          <div>
            <p className="support-drawer-section__title">Vínculos técnicos</p>
            <p className="support-drawer-section__helper">
              Itens técnicos já relacionados ao ticket para apoiar a continuidade da tratativa.
            </p>
          </div>
          <div className="support-drawer-compact-list">
            {engineeringLinks.slice(0, 4).map((link) => (
              <div className="support-drawer-compact-item" key={link.engineeringWorkItemId}>
                <p className="support-drawer-compact-item__title">{link.workItemTitle}</p>
                <p className="support-drawer-compact-item__meta">
                  {humanizeEngineeringWorkItemType(link.workItemType)} · {humanizeEngineeringWorkItemStatus(link.workItemStatus)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {attachments.length > 0 ? (
        <section className="support-drawer-section">
          <div>
            <p className="support-drawer-section__title">Evidências relevantes</p>
            <p className="support-drawer-section__helper">
              Arquivos e anexos recentes que ajudam a compor a continuidade operacional do caso.
            </p>
          </div>
          <div className="support-drawer-compact-list">
            {attachments.slice(0, 4).map((attachment) => (
              <div className="support-drawer-compact-item" key={attachment.attachmentId}>
                <p className="support-drawer-compact-item__title">{attachment.displayName}</p>
                <p className="support-drawer-compact-item__meta">
                  {attachmentKind(attachment)} · {formatAttachmentSize(attachment.sizeBytes)} · {formatDateTime(attachment.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function SupportLinksReadPanel({
  attachmentKind,
  attachments,
  engineeringLinks,
  formatAttachmentSize,
  humanizeEngineeringWorkItemStatus,
  humanizeEngineeringWorkItemType,
  humanizeKnowledgeLinkType,
  knowledgeLinks,
}: {
  attachmentKind: (attachment: SupportTicketAttachment) => string;
  attachments: SupportTicketAttachment[];
  engineeringLinks: SupportTicketEngineeringLink[];
  formatAttachmentSize: (sizeBytes: number) => string;
  humanizeEngineeringWorkItemStatus: (status: SupportTicketEngineeringLink['workItemStatus']) => string;
  humanizeEngineeringWorkItemType: (type: EngineeringWorkItemType) => string;
  humanizeKnowledgeLinkType: (linkType: TicketKnowledgeLinkType) => string;
  knowledgeLinks: SupportTicketKnowledgeLink[];
}) {
  const hasContent =
    attachments.length > 0 || engineeringLinks.length > 0 || knowledgeLinks.length > 0;

  if (!hasContent) {
    return <InlineNotice>Nenhum vínculo real apareceu para este ticket.</InlineNotice>;
  }

  return (
    <div className="space-y-3">
      {knowledgeLinks.length > 0 ? (
        <section className="space-y-2">
          <h4 className="text-[12px] font-semibold text-[color:var(--color-ink)]">Artigos vinculados</h4>
          {knowledgeLinks.slice(0, 4).map((link) => (
            <EvidenceFileChip
              key={link.ticketKnowledgeLinkId}
              meta={`${humanizeKnowledgeLinkType(link.linkType)} · ${formatDateTime(link.createdAt)}`}
              statusBadge={
                <CompactSupportPill tone={link.linkType === 'sent_to_customer' ? 'positive' : 'accent'}>
                  {humanizeKnowledgeLinkType(link.linkType)}
                </CompactSupportPill>
              }
              title={link.articleTitle ?? 'Vínculo sem artigo associado'}
            />
          ))}
        </section>
      ) : null}

      {attachments.length > 0 ? (
        <section className="space-y-2">
          <h4 className="text-[12px] font-semibold text-[color:var(--color-ink)]">Evidências</h4>
          {attachments.slice(0, 4).map((attachment) => (
            <EvidenceFileChip
              key={attachment.attachmentId}
              meta={`${attachmentKind(attachment)} · ${formatAttachmentSize(attachment.sizeBytes)}`}
              title={attachment.displayName}
            />
          ))}
        </section>
      ) : null}

      {engineeringLinks.length > 0 ? (
        <section className="space-y-2">
          <h4 className="text-[12px] font-semibold text-[color:var(--color-ink)]">
            Acionamentos e demandas técnicas
          </h4>
          {engineeringLinks.slice(0, 4).map((link) => (
            <EvidenceFileChip
              key={link.engineeringWorkItemId}
              meta={`${humanizeEngineeringWorkItemType(link.workItemType)} · ${humanizeEngineeringWorkItemStatus(link.workItemStatus)}`}
              title={link.workItemTitle}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}
