import {
  type ComponentProps,
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime, humanizeToken } from '../../../app/format';
import { LoadingState } from '../../../components/states';
import {
  AppButton,
  Field,
  GhostButton,
  InlineNotice,
  SelectInput,
  StatusPill,
  TextInput,
  TextareaInput,
  cx,
} from '../../../components/ui';
import {
  ENGINEERING_WORK_ITEM_TYPES,
  INTERNAL_ACTION_SUPPORT_TYPES,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  type EngineeringWorkItemType,
  type InternalActionStatus,
  type InternalActionSupportType,
  type SupportCustomerAccountContext,
  type SupportInternalActionDetail,
  type SupportInternalActionTargetArea,
  type SupportInternalActionTimelineEntry,
  type SupportTicketAttachment,
  type SupportTicketClassificationOption,
  type SupportTicketDetail,
  type SupportTicketEngineeringLink,
  type SupportTicketInternalAction,
  type SupportTicketQueueItem,
  type SupportTicketTimelineRecentWindow,
  type TicketPriority,
  type TicketSeverity,
  type TicketStatus,
  type TicketStatusUpdateTarget,
  type Uuid,
} from '../../../contracts/support-contracts';
import { EvidenceFileChip } from './SupportWorkspacePrimitives';
import { CompactSupportPill, SupportSurfaceIcon } from './SupportWorkspaceVisuals';
import { SupportDrawerField, SupportDrawerPill } from './SupportTicketContextPanels';

type AttachmentPhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type EngineeringPhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type InternalActionsPhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type InternalActionDetailPhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type InternalActionTargetAreasPhase =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'contract-unavailable'
  | 'error';
type TicketActionDrawer =
  | 'none'
  | 'classification'
  | 'status'
  | 'evidence'
  | 'knowledge'
  | 'automation'
  | 'handoff'
  | 'related';

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

type CompactPillTone = ComponentProps<typeof CompactSupportPill>['tone'];
type StatusPillTone = ComponentProps<typeof StatusPill>['tone'];

function humanizeInternalActionSupportType(supportType: InternalActionSupportType) {
  switch (supportType) {
    case 'analysis':
      return 'Análise';
    case 'execution':
      return 'Execução';
    case 'approval':
      return 'Aprovação';
    case 'information_request':
      return 'Pedido de informação';
    case 'external_follow_up':
      return 'Acompanhamento externo';
    case 'technical_investigation':
      return 'Investigação técnica';
    default:
      return humanizeToken(supportType).replaceAll('_', ' ');
  }
}

function humanizeInternalActionStatus(status: InternalActionStatus) {
  switch (status) {
    case 'open':
      return 'Aberto';
    case 'assigned':
      return 'Atribuído';
    case 'in_progress':
      return 'Em andamento';
    case 'waiting_support':
      return 'Aguardando suporte';
    case 'waiting_external':
      return 'Aguardando terceiro';
    case 'returned_to_support':
      return 'Retornado ao suporte';
    case 'follow_up_requested':
      return 'Complemento solicitado';
    case 'closed':
      return 'Encerrado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return humanizeToken(status).replaceAll('_', ' ');
  }
}

function toneForInternalActionStatus(status: InternalActionStatus) {
  switch (status) {
    case 'returned_to_support':
      return 'accent' as const;
    case 'closed':
      return 'positive' as const;
    case 'cancelled':
      return 'critical' as const;
    case 'waiting_external':
    case 'waiting_support':
    case 'follow_up_requested':
      return 'warning' as const;
    default:
      return 'default' as const;
  }
}

function humanizeInternalActionUpdateKind(kind: SupportInternalActionTimelineEntry['updateKind']) {
  switch (kind) {
    case 'comment':
      return 'Comentário interno';
    case 'assignment_changed':
      return 'Responsável atualizado';
    case 'status_changed':
      return 'Status atualizado';
    case 'evidence_linked':
      return 'Evidência vinculada';
    case 'returned_to_support':
      return 'Retorno ao suporte';
    case 'support_acceptance':
      return 'Retorno aceito';
    case 'follow_up_requested':
      return 'Complemento solicitado';
    case 'closed':
      return 'Acionamento encerrado';
    case 'cancelled':
      return 'Acionamento cancelado';
    default:
      return humanizeToken(kind).replaceAll('_', ' ');
  }
}

function toneForInternalActionUpdateKind(kind: SupportInternalActionTimelineEntry['updateKind']) {
  switch (kind) {
    case 'returned_to_support':
    case 'support_acceptance':
      return 'accent' as const;
    case 'closed':
      return 'positive' as const;
    case 'cancelled':
      return 'critical' as const;
    case 'follow_up_requested':
      return 'warning' as const;
    default:
      return 'default' as const;
  }
}

function extractTimelineAttachmentIds(entries: SupportInternalActionTimelineEntry[]) {
  return entries.reduce<Uuid[]>((accumulator, entry) => {
    if (entry.updateKind !== 'evidence_linked') {
      return accumulator;
    }

    const candidate = entry.metadata?.ticket_attachment_id;
    if (typeof candidate === 'string' && !accumulator.includes(candidate as Uuid)) {
      accumulator.push(candidate as Uuid);
    }

    return accumulator;
  }, []);
}

export function SupportInternalActionsDrawerPanel({
  attachmentKind,
  attachments,
  formatAttachmentSize,
  humanizeAttachmentStatus,
  humanizePriority,
  internalActionDetail,
  internalActionDetailMessage,
  internalActionDetailPhase,
  internalActionCreateDraft,
  internalActionEvidenceAttachmentId,
  internalActionEvidenceNote,
  internalActionSubmitting,
  internalActionSupportNote,
  internalActionTargetAreas,
  internalActionTargetAreasMessage,
  internalActionTargetAreasPhase,
  internalActions,
  internalActionsMessage,
  internalActionsPhase,
  onAcceptReturn,
  onCloseAction,
  onCreateDraftChange,
  onCreateSubmit,
  onEvidenceAttachmentChange,
  onEvidenceNoteChange,
  onLinkEvidence,
  onOpenHandoff,
  onRequestFollowup,
  onSelectInternalAction,
  onSupportNoteChange,
  selectedInternalActionId,
  timelineEntries,
  toneForAttachmentStatus,
  toneForPriority,
}: {
  attachmentKind: (attachment: SupportTicketAttachment) => string;
  attachments: SupportTicketAttachment[];
  formatAttachmentSize: (sizeBytes: number) => string;
  humanizeAttachmentStatus: (status: SupportTicketAttachment['status']) => string;
  humanizePriority: (priority: TicketPriority) => string;
  internalActionDetail: SupportInternalActionDetail | null;
  internalActionDetailMessage: string | null;
  internalActionDetailPhase: InternalActionDetailPhase;
  internalActionCreateDraft: InternalActionCreateDraft;
  internalActionEvidenceAttachmentId: Uuid | '';
  internalActionEvidenceNote: string;
  internalActionSubmitting: boolean;
  internalActionSupportNote: string;
  internalActionTargetAreas: SupportInternalActionTargetArea[];
  internalActionTargetAreasMessage: string | null;
  internalActionTargetAreasPhase: InternalActionTargetAreasPhase;
  internalActions: SupportTicketInternalAction[];
  internalActionsMessage: string | null;
  internalActionsPhase: InternalActionsPhase;
  onAcceptReturn: () => void;
  onCloseAction: () => void;
  onCreateDraftChange: (patch: Partial<InternalActionCreateDraft>) => void;
  onCreateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEvidenceAttachmentChange: (value: Uuid | '') => void;
  onEvidenceNoteChange: (value: string) => void;
  onLinkEvidence: () => void;
  onOpenHandoff: () => void;
  onRequestFollowup: () => void;
  onSelectInternalAction: (internalActionId: Uuid) => void;
  onSupportNoteChange: (value: string) => void;
  selectedInternalActionId: Uuid | null;
  timelineEntries: SupportInternalActionTimelineEntry[];
  toneForAttachmentStatus: (status: SupportTicketAttachment['status']) => CompactPillTone;
  toneForPriority: (priority: TicketPriority) => CompactPillTone;
}) {
  const linkedAttachmentIds = extractTimelineAttachmentIds(timelineEntries);
  const linkedAttachments = attachments.filter((attachment) =>
    linkedAttachmentIds.includes(attachment.attachmentId),
  );
  const availableAttachments = attachments.filter(
    (attachment) =>
      attachment.status === 'available' &&
      !linkedAttachmentIds.includes(attachment.attachmentId),
  );
  const canAcceptReturn = internalActionDetail?.status === 'returned_to_support';
  const canRequestFollowup =
    internalActionDetail?.status === 'returned_to_support' ||
    internalActionDetail?.status === 'waiting_support';
  const canCloseAction = canRequestFollowup;
  const isImmutable =
    internalActionDetail?.status === 'closed' || internalActionDetail?.status === 'cancelled';

  return (
    <div className="support-drawer-stack">
      <section className="support-drawer-section">
        <div>
          <p className="support-drawer-section__title">Novo acionamento</p>
          <p className="support-drawer-section__helper">
            O ticket continua sob responsabilidade do Suporte. O histórico abaixo é interno e não aparece para o cliente.
          </p>
        </div>
        {internalActionTargetAreasPhase === 'loading' ||
        internalActionTargetAreasPhase === 'idle' ? (
          <LoadingState
            title="Carregando áreas"
            description="Estamos preparando as áreas internas disponíveis para este ticket."
          />
        ) : internalActionTargetAreasPhase === 'contract-unavailable' ? (
          <InlineNotice tone="warning">
            {internalActionTargetAreasMessage ??
              'As áreas internas disponíveis ainda não ficaram disponíveis nesta leitura.'}
          </InlineNotice>
        ) : internalActionTargetAreasPhase === 'error' ? (
          <InlineNotice tone="critical">
            {internalActionTargetAreasMessage ??
              'Não foi possível carregar as áreas internas disponíveis para este ticket.'}
          </InlineNotice>
        ) : internalActionTargetAreas.length === 0 ? (
          <InlineNotice>Nenhuma área interna disponível para acionamento neste tenant.</InlineNotice>
        ) : (
          <form className="support-drawer-card space-y-3" onSubmit={onCreateSubmit}>
            <div className="grid gap-3 md:grid-cols-3">
              <SupportDrawerField label="Área acionada">
                <SelectInput
                  className="support-drawer-select"
                  onChange={(event) => onCreateDraftChange({ targetArea: event.target.value })}
                  value={internalActionCreateDraft.targetArea}
                >
                  <option value="">Selecione</option>
                  {internalActionTargetAreas.map((area) => (
                    <option
                      disabled={!area.canCreateAction}
                      key={area.areaKey}
                      value={area.areaKey}
                    >
                      {area.displayName}
                    </option>
                  ))}
                </SelectInput>
              </SupportDrawerField>

              <SupportDrawerField label="Tipo de apoio">
                <SelectInput
                  className="support-drawer-select"
                  onChange={(event) =>
                    onCreateDraftChange({
                      supportType: event.target.value as InternalActionSupportType,
                    })
                  }
                  value={internalActionCreateDraft.supportType}
                >
                  {INTERNAL_ACTION_SUPPORT_TYPES.map((supportType) => (
                    <option key={supportType} value={supportType}>
                      {humanizeInternalActionSupportType(supportType)}
                    </option>
                  ))}
                </SelectInput>
              </SupportDrawerField>

              <SupportDrawerField label="Prioridade">
                <SelectInput
                  className="support-drawer-select"
                  onChange={(event) =>
                    onCreateDraftChange({ priority: event.target.value as TicketPriority })
                  }
                  value={internalActionCreateDraft.priority}
                >
                  {TICKET_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {humanizePriority(priority)}
                    </option>
                  ))}
                </SelectInput>
              </SupportDrawerField>
            </div>

            <SupportDrawerField label="Resumo">
              <TextInput
                className="support-drawer-input"
                onChange={(event) => onCreateDraftChange({ summary: event.target.value })}
                placeholder="Resumo curto do apoio necessário"
                value={internalActionCreateDraft.summary}
              />
            </SupportDrawerField>

            <SupportDrawerField label="Contexto">
              <TextareaInput
                className="support-drawer-textarea border-[color:var(--color-support-border)]"
                onChange={(event) => onCreateDraftChange({ context: event.target.value })}
                placeholder="Explique o contexto interno, o que precisa ser analisado e o retorno esperado."
                value={internalActionCreateDraft.context}
              />
            </SupportDrawerField>

            {attachments.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                  Evidências existentes
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {attachments
                    .filter((attachment) => attachment.status === 'available')
                    .map((attachment) => {
                      const checked = internalActionCreateDraft.evidenceAttachmentIds.includes(
                        attachment.attachmentId,
                      );

                      return (
                        <label
                          className="flex items-center gap-2 rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-[11px] font-semibold text-[color:var(--color-ink)]"
                          key={attachment.attachmentId}
                        >
                          <input
                            checked={checked}
                            className="h-4 w-4 accent-[color:var(--color-brand-blue)]"
                            onChange={(event) => {
                              const nextIds = event.currentTarget.checked
                                ? [
                                    ...internalActionCreateDraft.evidenceAttachmentIds,
                                    attachment.attachmentId,
                                  ]
                                : internalActionCreateDraft.evidenceAttachmentIds.filter(
                                    (attachmentId) => attachmentId !== attachment.attachmentId,
                                  );
                              onCreateDraftChange({ evidenceAttachmentIds: nextIds });
                            }}
                            type="checkbox"
                          />
                          <span className="min-w-0 truncate">{attachment.displayName}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <AppButton
                className="support-drawer-footer-button"
                disabled={internalActionSubmitting}
                type="submit"
              >
                {internalActionSubmitting ? 'Criando...' : 'Criar acionamento'}
              </AppButton>
            </div>
          </form>
        )}
        <div className="support-drawer-card support-drawer-card--compact">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="support-drawer-card__title">Handoff técnico existente</p>
              <p className="support-drawer-card__summary">
                O fluxo legado com Engenharia continua separado até existir bridge formal entre domínios.
              </p>
            </div>
            <GhostButton className="support-drawer-footer-button" onClick={onOpenHandoff} type="button">
              Abrir handoff
            </GhostButton>
          </div>
        </div>
      </section>

      <div className="support-drawer-scroll support-drawer-stack pr-1">
        <section className="support-drawer-section">
          <div>
            <p className="support-drawer-section__title">Acionamentos do ticket</p>
            <p className="support-drawer-section__helper">
              Lista interna de acionamentos já registrados para este ticket.
            </p>
          </div>

          {internalActionsPhase === 'loading' || internalActionsPhase === 'idle' ? (
            <LoadingState
              title="Carregando acionamentos"
              description="Estamos preparando o histórico interno vinculado a este ticket."
            />
          ) : internalActionsPhase === 'contract-unavailable' ? (
            <InlineNotice tone="warning">
              {internalActionsMessage ?? 'Os acionamentos internos ainda não ficaram disponíveis nesta leitura.'}
            </InlineNotice>
          ) : internalActionsPhase === 'error' ? (
            <InlineNotice tone="critical">
              {internalActionsMessage ?? 'Não foi possível carregar os acionamentos internos deste ticket.'}
            </InlineNotice>
          ) : internalActions.length === 0 ? (
            <InlineNotice>Nenhum acionamento interno criado para este ticket.</InlineNotice>
          ) : (
            <div className="space-y-2">
              {internalActions.map((action) => {
                const isSelected = action.internalActionId === selectedInternalActionId;
                const updateSummary =
                  action.lastUpdateSummary?.trim() ||
                  (action.lastUpdateKind
                    ? humanizeInternalActionUpdateKind(action.lastUpdateKind)
                    : 'Sem atualização registrada');

                return (
                  <button
                    className={cx(
                      'support-drawer-card w-full text-left transition',
                      isSelected
                        ? 'border-[rgba(47,107,255,0.3)] bg-[rgba(47,107,255,0.06)]'
                        : 'hover:border-[rgba(47,107,255,0.18)]',
                    )}
                    key={action.internalActionId}
                    onClick={() => onSelectInternalAction(action.internalActionId)}
                    type="button"
                  >
                    <div className="support-drawer-card__eyebrow">
                      <SupportDrawerPill tone={toneForInternalActionStatus(action.status)}>
                        {humanizeInternalActionStatus(action.status)}
                      </SupportDrawerPill>
                      <SupportDrawerPill tone={toneForPriority(action.priority)}>
                        {humanizePriority(action.priority)}
                      </SupportDrawerPill>
                      {action.hasPendingReturn ? (
                        <SupportDrawerPill tone="accent">Retorno pendente</SupportDrawerPill>
                      ) : null}
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="support-drawer-card__title">{action.summary}</p>
                        <p className="support-drawer-card__summary">
                          {action.targetAreaLabel} · {humanizeInternalActionSupportType(action.supportType)} ·{' '}
                          {action.assignedAreaUserName ?? 'Sem responsável da área'}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-[color:var(--color-muted)]">
                        {formatDateTime(action.updatedAt)}
                      </span>
                    </div>
                    <div className="mt-3 rounded-[14px] bg-[color:var(--color-surface)] px-3 py-2 text-[11px] leading-5 text-[color:var(--color-muted)]">
                      <p className="font-semibold text-[color:var(--color-ink)]">Último update</p>
                      <p>{updateSummary}</p>
                      <p className="mt-1">
                        Criado em {formatDateTime(action.createdAt)}
                        {action.lastUpdateAt ? ` · Última movimentação ${formatDateTime(action.lastUpdateAt)}` : ''}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="support-drawer-section">
          <div>
            <p className="support-drawer-section__title">Detalhe do acionamento</p>
            <p className="support-drawer-section__helper">
              Contexto, evidências internas e retorno da área vinculados ao acionamento selecionado.
            </p>
          </div>

          {internalActionsPhase !== 'ready' ? null : internalActions.length === 0 ? (
            <InlineNotice>Selecione um ticket com acionamentos para ver o detalhe interno.</InlineNotice>
          ) : internalActionDetailPhase === 'loading' || internalActionDetailPhase === 'idle' ? (
            <LoadingState
              title="Carregando detalhe"
              description="Estamos preparando o contexto interno do acionamento selecionado."
            />
          ) : internalActionDetailPhase === 'contract-unavailable' ? (
            <InlineNotice tone="warning">
              {internalActionDetailMessage ?? 'O detalhe deste acionamento ainda não ficou disponível nesta leitura.'}
            </InlineNotice>
          ) : internalActionDetailPhase === 'error' ? (
            <InlineNotice tone="critical">
              {internalActionDetailMessage ?? 'Não foi possível carregar o detalhe deste acionamento.'}
            </InlineNotice>
          ) : !internalActionDetail ? (
            <InlineNotice>Nenhum acionamento interno foi selecionado.</InlineNotice>
          ) : (
            <div className="space-y-3">
              <article className="support-drawer-card">
                <div className="support-drawer-card__eyebrow">
                  <SupportDrawerPill tone={toneForInternalActionStatus(internalActionDetail.status)}>
                    {humanizeInternalActionStatus(internalActionDetail.status)}
                  </SupportDrawerPill>
                  <SupportDrawerPill tone={toneForPriority(internalActionDetail.priority)}>
                    {humanizePriority(internalActionDetail.priority)}
                  </SupportDrawerPill>
                  <SupportDrawerPill>{internalActionDetail.targetAreaLabel}</SupportDrawerPill>
                </div>
                <p className="support-drawer-card__title">{internalActionDetail.summary}</p>
                <p className="support-drawer-card__summary">{internalActionDetail.context}</p>

                <div className="mt-3 grid gap-2 text-[11px] leading-5 text-[color:var(--color-muted)] md:grid-cols-2">
                  <p>
                    <span className="font-semibold text-[color:var(--color-ink)]">Tipo:</span>{' '}
                    {humanizeInternalActionSupportType(internalActionDetail.supportType)}
                  </p>
                  <p>
                    <span className="font-semibold text-[color:var(--color-ink)]">Responsável da área:</span>{' '}
                    {internalActionDetail.assignedAreaUserName ?? 'Ainda não atribuído'}
                  </p>
                  <p>
                    <span className="font-semibold text-[color:var(--color-ink)]">Solicitado por:</span>{' '}
                    {internalActionDetail.requestedByUserName ?? 'Indisponível'}
                  </p>
                  <p>
                    <span className="font-semibold text-[color:var(--color-ink)]">Última atualização:</span>{' '}
                    {internalActionDetail.lastUpdateAt ? formatDateTime(internalActionDetail.lastUpdateAt) : 'Sem movimentação'}
                  </p>
                  <p>
                    <span className="font-semibold text-[color:var(--color-ink)]">Criado em:</span>{' '}
                    {formatDateTime(internalActionDetail.createdAt)}
                  </p>
                  <p>
                    <span className="font-semibold text-[color:var(--color-ink)]">Atualizado em:</span>{' '}
                    {formatDateTime(internalActionDetail.updatedAt)}
                  </p>
                </div>

                {internalActionDetail.hasPendingReturn ? (
                  <div className="mt-3 support-drawer-note">
                    Existe retorno pendente da área interna. Esta alteração será registrada no histórico do ticket.
                  </div>
                ) : null}
              </article>

              <article className="support-drawer-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="support-drawer-card__title">Evidências vinculadas</p>
                    <p className="support-drawer-card__summary">
                      {internalActionDetail.linkedEvidenceCount} evidência(s) já relacionada(s) a este acionamento.
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {linkedAttachments.length === 0 ? (
                    <InlineNotice>Nenhuma evidência vinculada a este acionamento até agora.</InlineNotice>
                  ) : (
                    linkedAttachments.map((attachment) => (
                      <div className="support-drawer-compact-item" key={attachment.attachmentId}>
                        <div className="support-drawer-compact-item__row">
                          <p className="support-drawer-compact-item__title">{attachment.displayName}</p>
                          <SupportDrawerPill tone={toneForAttachmentStatus(attachment.status)}>
                            {humanizeAttachmentStatus(attachment.status)}
                          </SupportDrawerPill>
                        </div>
                        <p className="support-drawer-compact-item__meta">
                          {attachmentKind(attachment)} · {formatAttachmentSize(attachment.sizeBytes)} · {formatDateTime(attachment.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {!isImmutable ? (
                  <div className="mt-3 space-y-3">
                    {availableAttachments.length > 0 ? (
                      <>
                        <SupportDrawerField label="Vincular evidência existente">
                          <SelectInput
                            className="support-drawer-select"
                            disabled={internalActionSubmitting}
                            onChange={(event) =>
                              onEvidenceAttachmentChange(event.target.value as Uuid | '')
                            }
                            value={internalActionEvidenceAttachmentId}
                          >
                            <option value="">Selecionar evidência do ticket</option>
                            {availableAttachments.map((attachment) => (
                              <option key={attachment.attachmentId} value={attachment.attachmentId}>
                                {attachment.displayName}
                              </option>
                            ))}
                          </SelectInput>
                        </SupportDrawerField>
                        <SupportDrawerField label="Observação da evidência">
                          <TextareaInput
                            className="support-drawer-textarea border-[color:var(--color-support-border)]"
                            disabled={internalActionSubmitting}
                            onChange={(event) => onEvidenceNoteChange(event.target.value)}
                            placeholder="Contexto curto sobre o que este arquivo comprova."
                            value={internalActionEvidenceNote}
                          />
                        </SupportDrawerField>
                        <div className="support-drawer-card__actions">
                          <AppButton
                            className="support-drawer-footer-button"
                            disabled={internalActionSubmitting || !internalActionEvidenceAttachmentId}
                            onClick={onLinkEvidence}
                            type="button"
                          >
                            {internalActionSubmitting ? 'Salvando...' : 'Vincular evidência'}
                          </AppButton>
                        </div>
                      </>
                    ) : (
                      <div className="support-drawer-note">
                        Todas as evidências disponíveis do ticket já foram vinculadas a este acionamento.
                      </div>
                    )}
                  </div>
                ) : null}
              </article>

              <article className="support-drawer-card">
                <p className="support-drawer-card__title">Ações do suporte</p>
                <p className="support-drawer-card__summary">
                  Aceite retorno, solicite complemento ou encerre o acionamento sem alterar o status principal do ticket.
                </p>

                {isImmutable ? (
                  <div className="mt-3 support-drawer-note">
                    Este acionamento já foi encerrado e não aceita novas ações mutáveis nesta fase.
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <SupportDrawerField label="Observação do suporte">
                      <TextareaInput
                        className="support-drawer-textarea border-[color:var(--color-support-border)]"
                        disabled={internalActionSubmitting}
                        onChange={(event) => onSupportNoteChange(event.target.value)}
                        placeholder="Registre o aceite, o complemento solicitado ou a observação final deste acionamento."
                        value={internalActionSupportNote}
                      />
                    </SupportDrawerField>

                    <div className="support-drawer-card__actions">
                      {canAcceptReturn ? (
                        <AppButton
                          className="support-drawer-footer-button"
                          disabled={internalActionSubmitting}
                          onClick={onAcceptReturn}
                          type="button"
                        >
                          {internalActionSubmitting ? 'Salvando...' : 'Aceitar retorno'}
                        </AppButton>
                      ) : null}

                      {canRequestFollowup ? (
                        <GhostButton
                          className="support-drawer-footer-button"
                          disabled={internalActionSubmitting || internalActionSupportNote.trim().length === 0}
                          onClick={onRequestFollowup}
                          type="button"
                        >
                          Pedir complemento
                        </GhostButton>
                      ) : null}

                      {canCloseAction ? (
                        <GhostButton
                          className="support-drawer-footer-button"
                          disabled={internalActionSubmitting}
                          onClick={onCloseAction}
                          type="button"
                        >
                          Encerrar acionamento
                        </GhostButton>
                      ) : null}
                    </div>

                    {!canAcceptReturn && !canRequestFollowup && !canCloseAction ? (
                      <div className="support-drawer-note">
                        Este acionamento ainda está em fluxo da área interna e não aceita ações do suporte neste estado.
                      </div>
                    ) : null}
                  </div>
                )}
              </article>

              <article className="support-drawer-card">
                <p className="support-drawer-card__title">Timeline interna</p>
                <p className="support-drawer-card__summary">
                  Histórico operacional compacto do acionamento, separado da conversa pública com o cliente.
                </p>

                <div className="mt-3 space-y-2">
                  {timelineEntries.length === 0 ? (
                    <InlineNotice>Nenhuma atualização interna apareceu para este acionamento.</InlineNotice>
                  ) : (
                    timelineEntries.map((entry) => (
                      <div className="support-drawer-compact-item" key={entry.internalActionUpdateId}>
                        <div className="support-drawer-compact-item__row">
                          <p className="support-drawer-compact-item__title">
                            {humanizeInternalActionUpdateKind(entry.updateKind)}
                          </p>
                          <SupportDrawerPill tone={toneForInternalActionUpdateKind(entry.updateKind)}>
                            {entry.createdByUserName ?? 'Equipe interna'}
                          </SupportDrawerPill>
                        </div>
                        <p className="support-drawer-compact-item__meta">
                          {formatDateTime(entry.createdAt)}
                          {entry.statusBefore && entry.statusAfter
                            ? ` · ${humanizeInternalActionStatus(entry.statusBefore)} → ${humanizeInternalActionStatus(entry.statusAfter)}`
                            : ''}
                        </p>
                        {entry.body ? <p className="mt-1 text-[11px] leading-5 text-[color:var(--color-ink)]">{entry.body}</p> : null}
                      </div>
                    ))
                  )}
                </div>
              </article>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function SupportEngineeringHandoffDrawerPanel({
  attachments,
  canCreateEngineeringHandoff,
  handoffDraft,
  handoffSubmitting,
  humanizeEngineeringWorkItemType,
  onEngineeringHandoffDraftChange,
  onEngineeringHandoffSubmit,
}: {
  attachments: SupportTicketAttachment[];
  canCreateEngineeringHandoff: boolean;
  handoffDraft: EngineeringHandoffDraft;
  handoffSubmitting: boolean;
  humanizeEngineeringWorkItemType: (value: EngineeringWorkItemType) => string;
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
            onChange={(event) =>
              onEngineeringHandoffDraftChange({ description: event.target.value })
            }
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

function SupportClassificationPanel({
  buildStatusChoices,
  classificationDraft,
  classificationOptionsMessage,
  classificationReasonOptions,
  compactSlaStatusLabel,
  compactTicketStatusLabel,
  currentAssignedLabel,
  customerAccountContext,
  humanizeCustomerValue,
  humanizePriority,
  humanizeSeverity,
  humanizeStatus,
  humanizeTicketEventLabel,
  onClassificationDraftChange,
  onPrioritySeverityDraftChange,
  onStatusDraftChange,
  onStatusNoteChange,
  onStatusReasonChange,
  onSubmitClassification,
  onSubmitPrioritySeverity,
  onSubmitStatus,
  pendingCloseItems,
  priorityReasonOptions,
  prioritySeverityDraft,
  requiresOperationalReasonForStatus,
  statusDraft,
  statusNote,
  statusReasonId,
  statusReasonOptions,
  submitting,
  summarizeTimelineEvent,
  ticketCategoryOptions,
  ticketDetail,
  timelineWindow,
}: {
  buildStatusChoices: (
    status: TicketStatus,
    allowedNextStatuses: SupportTicketDetail['allowedNextStatuses'],
  ) => TicketStatusUpdateTarget[];
  classificationDraft: TicketClassificationDraft;
  classificationOptionsMessage: string | null;
  classificationReasonOptions: SupportTicketClassificationOption[];
  compactSlaStatusLabel: (label: string | null | undefined) => string;
  compactTicketStatusLabel: (status: TicketStatus) => string;
  currentAssignedLabel: string;
  customerAccountContext: SupportCustomerAccountContext | null;
  humanizeCustomerValue: (value: string) => string;
  humanizePriority: (priority: TicketPriority) => string;
  humanizeSeverity: (severity: TicketSeverity) => string;
  humanizeStatus: (status: TicketStatus | TicketStatusUpdateTarget) => string;
  humanizeTicketEventLabel: (eventType: SupportTicketTimelineRecentWindow['entries'][number]['eventType']) => string;
  onClassificationDraftChange: (patch: Partial<TicketClassificationDraft>) => void;
  onPrioritySeverityDraftChange: (patch: Partial<TicketPrioritySeverityDraft>) => void;
  onStatusDraftChange: (status: TicketStatusUpdateTarget) => void;
  onStatusNoteChange: (value: string) => void;
  onStatusReasonChange: (value: Uuid | '') => void;
  onSubmitClassification: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitPrioritySeverity: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitStatus: (event: FormEvent<HTMLFormElement>) => void;
  pendingCloseItems: string[];
  priorityReasonOptions: SupportTicketClassificationOption[];
  prioritySeverityDraft: TicketPrioritySeverityDraft;
  requiresOperationalReasonForStatus: (status: TicketStatusUpdateTarget) => boolean;
  statusDraft: TicketStatusUpdateTarget;
  statusNote: string;
  statusReasonId: Uuid | '';
  statusReasonOptions: SupportTicketClassificationOption[];
  submitting: boolean;
  summarizeTimelineEvent: (entry: SupportTicketTimelineRecentWindow['entries'][number]) => string;
  ticketCategoryOptions: SupportTicketClassificationOption[];
  ticketDetail: SupportTicketDetail;
  timelineWindow: SupportTicketTimelineRecentWindow;
}) {
  const nextStatusChoices = buildStatusChoices(ticketDetail.status, ticketDetail.allowedNextStatuses);
  const missingClassification = !ticketDetail.categoryName;

  return (
    <section className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
        {missingClassification ? (
          <InlineNotice tone="warning">Classificação obrigatória para encerrar o ticket.</InlineNotice>
        ) : null}
        {classificationOptionsMessage ? (
          <InlineNotice tone="warning">{classificationOptionsMessage}</InlineNotice>
        ) : null}

        <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
          <div className="space-y-1">
            <h3 className="text-[14px] font-semibold text-[color:var(--color-ink)]">
              Classificação operacional
            </h3>
            <p className="text-[11px] leading-4 text-[color:var(--color-muted)]">
              Registre categoria e motivo antes do encerramento do caso.
            </p>
          </div>

          <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={onSubmitClassification}>
            <Field label="Categoria operacional">
              <SelectInput
                className="h-10 rounded-[12px] px-3 text-[13px]"
                disabled={submitting || ticketCategoryOptions.length === 0}
                onChange={(event) =>
                  onClassificationDraftChange({ categoryId: event.target.value as Uuid | '' })
                }
                value={classificationDraft.categoryId}
              >
                <option value="">Indisponível</option>
                {ticketCategoryOptions.map((category) => (
                  <option key={category.optionId} value={category.optionId}>
                    {category.name}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Motivo operacional">
              <SelectInput
                className="h-10 rounded-[12px] px-3 text-[13px]"
                disabled={submitting || classificationReasonOptions.length === 0}
                onChange={(event) =>
                  onClassificationDraftChange({
                    operationalReasonId: event.target.value as Uuid | '',
                  })
                }
                value={classificationDraft.operationalReasonId}
              >
                <option value="">Sem motivo adicional</option>
                {classificationReasonOptions.map((reason) => (
                  <option key={reason.optionId} value={reason.optionId}>
                    {reason.name}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <div className="rounded-[13px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                Impacto resumido
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[color:var(--color-ink)]">
                {ticketDetail.description?.trim() || 'Indisponível'}
              </p>
            </div>

            <div className="rounded-[13px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                Ambiente afetado
              </p>
              <p className="mt-1 text-[12px] font-semibold text-[color:var(--color-ink)]">
                {customerAccountContext?.productLine
                  ? humanizeCustomerValue(customerAccountContext.productLine)
                  : 'Indisponível'}
              </p>
            </div>

            <div className="rounded-[13px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 md:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                Integração afetada
              </p>
              <p className="mt-1 text-[12px] font-semibold text-[color:var(--color-ink)]">
                {ticketDetail.categoryName ?? 'Indisponível'}
              </p>
              <p className="mt-1 text-[11px] text-[color:var(--color-muted)]">
                O contrato atual ainda não expõe um campo dedicado de edição para integração afetada.
              </p>
            </div>

            <TextareaInput
              className="min-h-[84px] text-[12px] md:col-span-2"
              disabled={submitting}
              onChange={(event) => onClassificationDraftChange({ note: event.target.value })}
              placeholder="Observação operacional complementar"
              value={classificationDraft.note}
            />

            <AppButton
              className="min-h-10 rounded-[12px] px-4 text-[13px] md:col-span-2 md:justify-self-start"
              disabled={submitting || !ticketDetail.canUpdateStatus || !classificationDraft.categoryId}
              type="submit"
            >
              Salvar classificação
            </AppButton>
          </form>
        </section>

        <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
          <div className="space-y-1">
            <h3 className="text-[14px] font-semibold text-[color:var(--color-ink)]">
              Prioridade e severidade
            </h3>
            <p className="text-[11px] leading-4 text-[color:var(--color-muted)]">
              Ajuste governado pela política interna sem sair do workspace.
            </p>
          </div>

          <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={onSubmitPrioritySeverity}>
            <Field label="Prioridade">
              <SelectInput
                className="h-10 rounded-[12px] px-3 text-[13px]"
                disabled={submitting}
                onChange={(event) =>
                  onPrioritySeverityDraftChange({
                    priority: event.target.value as TicketPriority,
                  })
                }
                value={prioritySeverityDraft.priority}
              >
                {TICKET_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {humanizePriority(priority)}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Severidade">
              <SelectInput
                className="h-10 rounded-[12px] px-3 text-[13px]"
                disabled={submitting}
                onChange={(event) =>
                  onPrioritySeverityDraftChange({
                    severity: event.target.value as TicketSeverity,
                  })
                }
                value={prioritySeverityDraft.severity}
              >
                {TICKET_SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>
                    {humanizeSeverity(severity)}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Motivo operacional">
              <SelectInput
                className="h-10 rounded-[12px] px-3 text-[13px]"
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
            </Field>

            <AppButton
              className="min-h-10 rounded-[12px] px-4 text-[13px] self-end"
              disabled={submitting || !ticketDetail.canUpdateStatus}
              type="submit"
            >
              Atualizar prioridade
            </AppButton>
          </form>
        </section>

        <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
          <div className="space-y-1">
            <h3 className="text-[14px] font-semibold text-[color:var(--color-ink)]">
              Andamento atual
            </h3>
            <p className="text-[11px] leading-4 text-[color:var(--color-muted)]">
              Atualize o status operacional sem abrir fluxos paralelos.
            </p>
          </div>

          <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={onSubmitStatus}>
            <Field label="Status atual">
              <SelectInput
                className="h-10 rounded-[12px] px-3 text-[13px]"
                onChange={(event) => onStatusDraftChange(event.target.value as TicketStatusUpdateTarget)}
                value={statusDraft}
              >
                {nextStatusChoices.length === 0 ? (
                  <option value={statusDraft}>Sem transição disponível</option>
                ) : null}
                {nextStatusChoices.map((status) => (
                  <option key={status} value={status}>
                    {humanizeStatus(status)}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Motivo operacional">
              <SelectInput
                className="h-10 rounded-[12px] px-3 text-[13px]"
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
            </Field>

            <TextareaInput
              className="min-h-[84px] text-[12px] md:col-span-2"
              disabled={submitting}
              onChange={(event) => onStatusNoteChange(event.target.value)}
              placeholder="Contexto operacional da mudança de status"
              value={statusNote}
            />

            {requiresOperationalReasonForStatus(statusDraft) && !statusReasonId ? (
              <p className="text-[11px] leading-4 text-[color:var(--color-muted)] md:col-span-2">
                Esta transição exige motivo operacional registrado pela plataforma.
              </p>
            ) : null}

            <AppButton
              className="min-h-10 rounded-[12px] px-4 text-[13px] md:col-span-2 md:justify-self-start"
              disabled={
                submitting ||
                !ticketDetail.canUpdateStatus ||
                nextStatusChoices.length === 0 ||
                (requiresOperationalReasonForStatus(statusDraft) && !statusReasonId)
              }
              type="submit"
            >
              Salvar andamento
            </AppButton>
          </form>
        </section>
      </div>

      <aside className="min-h-0 space-y-3 overflow-y-auto pr-1">
        <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
          <h4 className="text-[13px] font-semibold text-[color:var(--color-ink)]">Resumo operacional</h4>
          <div className="mt-3 space-y-2 text-[12px] leading-5">
            <div className="rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                SLA aplicado
              </p>
              <p className="mt-1 font-semibold text-[color:var(--color-ink)]">
                {ticketDetail.slaPolicyName ?? 'Indisponível'}
              </p>
              <p className="text-[11px] text-[color:var(--color-muted)]">
                {compactSlaStatusLabel(ticketDetail.slaStatusLabel)}
              </p>
            </div>

            <div className="rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                Status atual
              </p>
              <p className="mt-1 font-semibold text-[color:var(--color-ink)]">
                {compactTicketStatusLabel(ticketDetail.status)}
              </p>
              <p className="text-[11px] text-[color:var(--color-muted)]">
                Responsável: {currentAssignedLabel}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
          <h4 className="text-[13px] font-semibold text-[color:var(--color-ink)]">
            Pendências para encerramento
          </h4>
          <div className="mt-3 space-y-2">
            {pendingCloseItems.length === 0 ? (
              <InlineNotice tone="positive">Nenhuma pendência operacional crítica identificada.</InlineNotice>
            ) : (
              pendingCloseItems.map((item) => (
                <div
                  className="rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-[12px] leading-5 text-[color:var(--color-ink)]"
                  key={item}
                >
                  {item}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
          <h4 className="text-[13px] font-semibold text-[color:var(--color-ink)]">
            Histórico recente
          </h4>
          <div className="mt-3 space-y-2">
            {timelineWindow.entries
              .filter((entry) => entry.entryType === 'event')
              .slice(0, 5)
              .map((entry) => (
                <div
                  className="rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2"
                  key={`classification-history:${entry.timelineEntryId}`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                    {formatDateTime(entry.occurredAt)}
                  </p>
                  <p className="mt-1 text-[12px] font-semibold text-[color:var(--color-ink)]">
                    {humanizeTicketEventLabel(entry.eventType)}
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-[color:var(--color-muted)]">
                    {summarizeTimelineEvent(entry)}
                  </p>
                </div>
              ))}
          </div>
        </section>
      </aside>
    </section>
  );
}

function SupportTicketAttachmentsPanel({
  attachmentKind,
  attachments,
  currentAssignedLabel,
  downloadingAttachmentId,
  formatAttachmentSize,
  humanizeAttachmentStatus,
  message,
  onBack,
  onDownload,
  onUpload,
  phase,
  supportTicketCode,
  ticketDetail,
  toneForAttachmentStatus,
}: {
  attachmentKind: (attachment: SupportTicketAttachment) => string;
  attachments: SupportTicketAttachment[];
  currentAssignedLabel: string;
  downloadingAttachmentId: string | null;
  formatAttachmentSize: (sizeBytes: number) => string;
  humanizeAttachmentStatus: (status: SupportTicketAttachment['status']) => string;
  message: string | null;
  onBack: () => void;
  onDownload: (attachmentId: Uuid) => void;
  onUpload: () => void;
  phase: AttachmentPhase;
  supportTicketCode: (ticketId: Uuid) => string;
  ticketDetail: SupportTicketDetail;
  toneForAttachmentStatus: (status: SupportTicketAttachment['status']) => CompactPillTone;
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [uploaderFilter, setUploaderFilter] = useState('all');
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<Uuid | null>(
    attachments[0]?.attachmentId ?? null,
  );

  const uploaderOptions = useMemo(
    () =>
      Array.from(
        new Set(
          attachments
            .map((attachment) => attachment.uploadedByName?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [attachments],
  );
  const typeOptions = useMemo(
    () => Array.from(new Set(attachments.map((attachment) => attachmentKind(attachment)))),
    [attachments, attachmentKind],
  );
  const filteredAttachments = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');

    return attachments.filter((attachment) => {
      if (typeFilter !== 'all' && attachmentKind(attachment) !== typeFilter) {
        return false;
      }

      if (
        uploaderFilter !== 'all' &&
        (attachment.uploadedByName?.trim() || 'Indisponível') !== uploaderFilter
      ) {
        return false;
      }

      if (term.length === 0) {
        return true;
      }

      const haystack = [
        attachment.displayName,
        attachment.contentType ?? '',
        attachment.uploadedByName ?? '',
        attachmentKind(attachment),
      ]
        .join(' ')
        .toLocaleLowerCase('pt-BR');

      return haystack.includes(term);
    });
  }, [attachments, search, typeFilter, uploaderFilter, attachmentKind]);

  const selectedAttachment =
    filteredAttachments.find((attachment) => attachment.attachmentId === selectedAttachmentId) ??
    filteredAttachments[0] ??
    null;

  if (phase === 'loading' || phase === 'idle') {
    return (
      <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3">
        <LoadingState
          title="Carregando evidências"
          description="Estamos preparando os arquivos vinculados a este ticket."
        />
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="shrink-0 rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-[15px] font-bold tracking-[-0.025em] text-[color:var(--color-ink)]">
              Evidências do ticket
            </h3>
            <p className="text-[12px] leading-5 text-[color:var(--color-muted)]">
              Arquivos seguros anexados ao ticket principal para consulta, download e vínculo com acionamentos internos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <GhostButton className="min-h-10 rounded-[12px] px-4 text-[12px]" onClick={onBack} type="button">
              Voltar
            </GhostButton>
            <AppButton
              className="min-h-10 rounded-[12px] bg-[color:var(--color-brand-blue)] px-4 text-[12px] text-white"
              onClick={onUpload}
              type="button"
            >
              Adicionar evidência
            </AppButton>
          </div>
        </div>
      </div>

      {phase === 'contract-unavailable' ? (
        <InlineNotice tone="warning">
          {message ?? 'A leitura de evidências ainda não ficou disponível neste ticket.'}
        </InlineNotice>
      ) : phase === 'error' ? (
        <InlineNotice tone="critical">
          {message ?? 'Não foi possível carregar os arquivos vinculados a este ticket.'}
        </InlineNotice>
      ) : attachments.length === 0 ? (
        <InlineNotice>Nenhuma evidência enviada até agora.</InlineNotice>
      ) : (
        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
            <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-4 py-3">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <div className="relative min-w-[220px] flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]">
                      <SupportSurfaceIcon className="h-[14px] w-[14px]" kind="search" />
                    </span>
                    <TextInput
                      className="h-10 rounded-[12px] border-[rgba(220,228,242,0.96)] bg-[rgba(244,247,252,0.72)] pl-9 text-[13px]"
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar evidências..."
                      value={search}
                    />
                  </div>
                  <SelectInput
                    className="h-10 min-w-[140px] rounded-[12px] px-3 text-[12px]"
                    onChange={(event) => setTypeFilter(event.target.value)}
                    value={typeFilter}
                  >
                    <option value="all">Tipo: Todos</option>
                    {typeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </SelectInput>
                  <SelectInput
                    className="h-10 min-w-[160px] rounded-[12px] px-3 text-[12px]"
                    onChange={(event) => setUploaderFilter(event.target.value)}
                    value={uploaderFilter}
                  >
                    <option value="all">Enviado por: Todos</option>
                    {uploaderOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </SelectInput>
                </div>
                <div className="text-[11px] text-[color:var(--color-muted)]">
                  {filteredAttachments.length} evidência(s)
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-[minmax(220px,1.8fr)_96px_minmax(140px,1.15fr)_168px_96px_110px_34px] gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-[10px] font-semibold text-[color:var(--color-muted)]">
                <span>Nome do arquivo</span>
                <span>Tipo</span>
                <span>Enviado por</span>
                <span>Data do envio</span>
                <span>Tamanho</span>
                <span>Status</span>
                <span />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {filteredAttachments.length === 0 ? (
                  <div className="px-4 py-4">
                    <InlineNotice>Nenhuma evidência encontrada com os filtros atuais.</InlineNotice>
                  </div>
                ) : (
                  filteredAttachments.map((attachment) => {
                    const isSelected = attachment.attachmentId === selectedAttachment?.attachmentId;

                    return (
                      <button
                        className={cx(
                          'grid min-h-[58px] w-full grid-cols-[minmax(220px,1.8fr)_96px_minmax(140px,1.15fr)_168px_96px_110px_34px] items-center gap-3 border-b border-[color:var(--color-border)] px-4 py-2 text-left transition last:border-b-0',
                          isSelected
                            ? 'bg-[rgba(47,107,255,0.06)] shadow-[inset_0_0_0_1px_rgba(47,107,255,0.36)]'
                            : 'hover:bg-[rgba(244,247,252,0.72)]',
                        )}
                        key={attachment.attachmentId}
                        onClick={() => setSelectedAttachmentId(attachment.attachmentId)}
                        type="button"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-brand-navy)]">
                            <SupportSurfaceIcon className="h-[13px] w-[13px]" kind="attachment" />
                          </span>
                          <p className="truncate text-[12px] font-semibold text-[color:var(--color-ink)]">
                            {attachment.displayName}
                          </p>
                        </div>
                        <CompactSupportPill>{attachmentKind(attachment)}</CompactSupportPill>
                        <p className="truncate text-[11px] font-semibold text-[color:var(--color-ink)]">
                          {attachment.uploadedByName ?? 'Indisponível'}
                        </p>
                        <p className="text-[10.5px] leading-4 text-[color:var(--color-muted)]">
                          {formatDateTime(attachment.createdAt)}
                        </p>
                        <span className="text-[11px] text-[color:var(--color-muted)]">
                          {formatAttachmentSize(attachment.sizeBytes)}
                        </span>
                        <CompactSupportPill tone={toneForAttachmentStatus(attachment.status)}>
                          {humanizeAttachmentStatus(attachment.status)}
                        </CompactSupportPill>
                        <span className="text-center text-[color:var(--color-muted)]">…</span>
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <aside className="min-h-0 space-y-3 overflow-y-auto pr-1">
            <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[13px] font-semibold text-[color:var(--color-ink)]">Detalhes da evidência</h4>
                <button className="text-[color:var(--color-muted)]" onClick={onBack} type="button">
                  <SupportSurfaceIcon className="h-[13px] w-[13px]" kind="close" />
                </button>
              </div>

              {selectedAttachment ? (
                <div className="mt-3 space-y-4">
                  <div className="rounded-[14px] border border-[rgba(22,42,93,0.08)] bg-[linear-gradient(180deg,#0c1730_0%,#17284d_100%)] px-3 py-3 text-white/78">
                    <div className="space-y-1 font-mono text-[10px] leading-5">
                      <p>{formatDateTime(selectedAttachment.createdAt)} INFO Arquivo preparado para leitura segura</p>
                      <p>{formatDateTime(selectedAttachment.createdAt)} INFO Tipo detectado: {attachmentKind(selectedAttachment)}</p>
                      <p>{formatDateTime(selectedAttachment.createdAt)} INFO Status atual: {humanizeAttachmentStatus(selectedAttachment.status)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-brand-navy)]">
                      <SupportSurfaceIcon className="h-[14px] w-[14px]" kind="attachment" />
                    </span>
                    <p className="min-w-0 truncate text-[13px] font-semibold text-[color:var(--color-ink)]">
                      {selectedAttachment.displayName}
                    </p>
                  </div>

                  <div className="grid gap-3 text-[12px] leading-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[color:var(--color-muted)]">Tipo</span>
                      <span className="text-right font-semibold text-[color:var(--color-ink)]">
                        {attachmentKind(selectedAttachment)}{selectedAttachment.contentType ? ` (${selectedAttachment.contentType})` : ''}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[color:var(--color-muted)]">Tamanho</span>
                      <span className="text-right font-semibold text-[color:var(--color-ink)]">
                        {formatAttachmentSize(selectedAttachment.sizeBytes)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[color:var(--color-muted)]">Enviado por</span>
                      <span className="text-right font-semibold text-[color:var(--color-ink)]">
                        {selectedAttachment.uploadedByName ?? 'Indisponível'}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[color:var(--color-muted)]">Data do envio</span>
                      <span className="text-right font-semibold text-[color:var(--color-ink)]">
                        {formatDateTime(selectedAttachment.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[color:var(--color-muted)]">Status</span>
                      <CompactSupportPill tone={toneForAttachmentStatus(selectedAttachment.status)}>
                        {humanizeAttachmentStatus(selectedAttachment.status)}
                      </CompactSupportPill>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[color:var(--color-muted)]">Ticket</span>
                      <span className="text-right font-semibold text-[color:var(--color-brand-blue)]">
                        {supportTicketCode(selectedAttachment.ticketId)}
                      </span>
                    </div>
                    <div className="border-t border-[color:var(--color-border)] pt-3">
                      <p className="text-[color:var(--color-muted)]">Armazenamento</p>
                      <div className="mt-2 rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-[11px] leading-5 text-[color:var(--color-muted)]">
                        Genius · Seguro e criptografado. Retenção conforme política de dados.
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <GhostButton
                      className="min-h-10 rounded-[12px] px-4 text-[12px]"
                      disabled={!selectedAttachment.canDownload || downloadingAttachmentId === selectedAttachment.attachmentId}
                      onClick={() => onDownload(selectedAttachment.attachmentId)}
                      type="button"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <SupportSurfaceIcon className="h-[13px] w-[13px]" kind="open" />
                        {downloadingAttachmentId === selectedAttachment.attachmentId ? 'Abrindo...' : 'Visualizar'}
                      </span>
                    </GhostButton>
                    <AppButton
                      className="min-h-10 rounded-[12px] bg-[color:var(--color-brand-blue)] px-4 text-[12px] text-white"
                      disabled={!selectedAttachment.canDownload || downloadingAttachmentId === selectedAttachment.attachmentId}
                      onClick={() => onDownload(selectedAttachment.attachmentId)}
                      type="button"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <SupportSurfaceIcon className="h-[13px] w-[13px]" kind="download" />
                        {downloadingAttachmentId === selectedAttachment.attachmentId ? 'Preparando...' : 'Baixar'}
                      </span>
                    </AppButton>
                  </div>
                </div>
              ) : (
                <InlineNotice>Nenhuma evidência disponível com os filtros atuais.</InlineNotice>
              )}
            </section>

            <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
              <div className="space-y-1">
                <h4 className="text-[13px] font-semibold text-[color:var(--color-ink)]">Resumo do ticket</h4>
                <p className="text-[11px] leading-5 text-[color:var(--color-muted)]">
                  Evidências já vinculadas ao atendimento principal.
                </p>
              </div>
              <div className="mt-3 space-y-2 text-[12px] leading-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[color:var(--color-muted)]">Ticket</span>
                  <span className="font-semibold text-[color:var(--color-brand-blue)]">
                    {supportTicketCode(ticketDetail.id)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[color:var(--color-muted)]">Responsável</span>
                  <span className="text-right font-semibold text-[color:var(--color-ink)]">
                    {currentAssignedLabel}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[color:var(--color-muted)]">Quantidade</span>
                  <span className="font-semibold text-[color:var(--color-ink)]">
                    {attachments.length} arquivo(s)
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      )}
    </section>
  );
}

function SupportEngineeringLinkCard({
  humanizeEngineeringWorkItemStatus,
  humanizeEngineeringWorkItemType,
  humanizePriority,
  link,
  sanitizeSupportVisibleText,
  toneForEngineeringWorkItemStatus,
}: {
  humanizeEngineeringWorkItemStatus: (status: SupportTicketEngineeringLink['workItemStatus']) => string;
  humanizeEngineeringWorkItemType: (type: SupportTicketEngineeringLink['workItemType']) => string;
  humanizePriority: (priority: TicketPriority) => string;
  link: SupportTicketEngineeringLink;
  sanitizeSupportVisibleText: (value: string | null | undefined) => string;
  toneForEngineeringWorkItemStatus: (
    status: SupportTicketEngineeringLink['workItemStatus'],
  ) => StatusPillTone;
}) {
  return (
    <article className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-[color:var(--color-ink)]">
            {link.workItemTitle}
          </p>
          <p className="text-[12px] uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
            {humanizeEngineeringWorkItemType(link.workItemType)} · {humanizePriority(link.workItemPriority)}
          </p>
        </div>
        <StatusPill tone={toneForEngineeringWorkItemStatus(link.workItemStatus)}>
          {humanizeEngineeringWorkItemStatus(link.workItemStatus)}
        </StatusPill>
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
        {sanitizeSupportVisibleText(link.workItemDescription)}
      </p>
      {link.handoffNote ? (
        <div className="mt-2 rounded-[14px] border border-dashed border-[rgba(48,127,226,0.24)] bg-white px-3 py-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
            Contexto do handoff
          </p>
          <p className="mt-1 text-sm leading-6 text-[color:var(--color-ink)]">{sanitizeSupportVisibleText(link.handoffNote)}</p>
        </div>
      ) : null}
      {link.lastUpdateSummary ? (
        <div className="mt-2 rounded-[14px] border border-[rgba(48,127,226,0.18)] bg-white px-3 py-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
            Último retorno técnico
          </p>
          <p className="mt-1 text-sm leading-6 text-[color:var(--color-ink)]">{sanitizeSupportVisibleText(link.lastUpdateSummary)}</p>
          {link.lastUpdateNextStep ? (
            <p className="mt-1 text-[12px] leading-5 text-[color:var(--color-muted)]">
              Próximo passo: {sanitizeSupportVisibleText(link.lastUpdateNextStep)}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[color:var(--color-muted)]">
        <span>
          Criado por {link.createdByFullName ?? 'Operador não identificado'} em {formatDateTime(link.createdAt)}
        </span>
        <span>Responsável: {link.assignedToFullName ?? 'Indisponível'}</span>
      </div>
      <Link
        className="mt-2 inline-flex text-[12px] font-semibold text-[color:var(--color-brand-blue)]"
        to={`/engineering/work-items/${link.engineeringWorkItemId}`}
      >
        Abrir na engenharia
      </Link>
    </article>
  );
}

function SupportMoreActionsPanel({
  attachments,
  canCreateEngineeringHandoff,
  compactTicketStatusLabel,
  currentAssignedLabel,
  engineeringLinks,
  engineeringMessage,
  engineeringPhase,
  handoffDraft,
  handoffSubmitting,
  humanizeEngineeringWorkItemStatus,
  humanizeEngineeringWorkItemType,
  humanizePriority,
  onCancel,
  onEngineeringHandoffDraftChange,
  onEngineeringHandoffSubmit,
  sanitizeSupportVisibleText,
  supportTicketCode,
  ticketDetail,
  toneForEngineeringWorkItemStatus,
  toneForPriority,
  toneForTicketStatus,
}: {
  attachments: SupportTicketAttachment[];
  canCreateEngineeringHandoff: boolean;
  compactTicketStatusLabel: (status: TicketStatus) => string;
  currentAssignedLabel: string;
  engineeringLinks: SupportTicketEngineeringLink[];
  engineeringMessage: string | null;
  engineeringPhase: EngineeringPhase;
  handoffDraft: EngineeringHandoffDraft;
  handoffSubmitting: boolean;
  humanizeEngineeringWorkItemStatus: (status: SupportTicketEngineeringLink['workItemStatus']) => string;
  humanizeEngineeringWorkItemType: (type: SupportTicketEngineeringLink['workItemType']) => string;
  humanizePriority: (priority: TicketPriority) => string;
  onCancel: () => void;
  onEngineeringHandoffDraftChange: (patch: Partial<EngineeringHandoffDraft>) => void;
  onEngineeringHandoffSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sanitizeSupportVisibleText: (value: string | null | undefined) => string;
  supportTicketCode: (ticketId: Uuid) => string;
  ticketDetail: SupportTicketDetail;
  toneForEngineeringWorkItemStatus: (
    status: SupportTicketEngineeringLink['workItemStatus'],
  ) => StatusPillTone;
  toneForPriority: (priority: TicketPriority) => CompactPillTone;
  toneForTicketStatus: (status: TicketStatus) => CompactPillTone;
}) {
  return (
    <section className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_292px]">
      <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
        <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-[1.12rem] font-bold tracking-[-0.03em] text-[color:var(--color-ink)]">
                Escalonar para engenharia
              </h3>
              <p className="text-[12px] leading-5 text-[color:var(--color-muted)]">
                Crie uma demanda técnica vinculada a este ticket. O ticket principal permanece como a fonte da tratativa com o cliente.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <GhostButton className="min-h-10 rounded-[12px] px-4 text-[12px]" onClick={onCancel} type="button">
                Cancelar
              </GhostButton>
              <AppButton
                className="min-h-10 rounded-[12px] bg-[color:var(--color-brand-blue)] px-4 text-[12px] text-white"
                disabled={
                  handoffSubmitting ||
                  !canCreateEngineeringHandoff ||
                  handoffDraft.title.trim().length === 0 ||
                  handoffDraft.description.trim().length === 0
                }
                type="submit"
                form="support-engineering-handoff-form"
              >
                {handoffSubmitting ? 'Abrindo demanda...' : 'Abrir demanda técnica'}
              </AppButton>
            </div>
          </div>
        </section>

        <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[1.02rem] font-extrabold tracking-[-0.04em] text-[color:var(--color-brand-navy)]">
              {supportTicketCode(ticketDetail.id)}
            </span>
            <CompactSupportPill tone={toneForTicketStatus(ticketDetail.status)}>
              {compactTicketStatusLabel(ticketDetail.status)}
            </CompactSupportPill>
            <CompactSupportPill tone={toneForPriority(ticketDetail.priority)}>
              {humanizePriority(ticketDetail.priority)}
            </CompactSupportPill>
          </div>

          <div className="mt-3 grid gap-y-2 rounded-[14px] border border-[rgba(220,228,242,0.92)] bg-[rgba(246,249,255,0.86)] px-3 py-2.5 text-[10.5px] md:grid-cols-2 xl:grid-cols-6 xl:gap-y-0 xl:divide-x xl:divide-[rgba(220,228,242,0.92)]">
            <div className="min-w-0 px-1 xl:px-2">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">Cliente</p>
              <p className="truncate font-semibold leading-4 text-[color:var(--color-ink)]">
                {ticketDetail.tenantDisplayName ?? ticketDetail.tenantLegalName ?? ticketDetail.tenantSlug}
              </p>
            </div>
            <div className="min-w-0 px-1 xl:px-2">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">Solicitante</p>
              <p className="truncate font-semibold leading-4 text-[color:var(--color-ink)]">
                {ticketDetail.requesterContactFullName ?? ticketDetail.requesterContactEmail ?? 'Indisponível'}
              </p>
            </div>
            <div className="min-w-0 px-1 xl:px-2">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">Categoria</p>
              <p className="truncate font-semibold leading-4 text-[color:var(--color-ink)]">
                {ticketDetail.categoryName ?? 'Indisponível'}
              </p>
            </div>
            <div className="min-w-0 px-1 xl:px-2">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">SLA interno</p>
              <p className="truncate font-semibold leading-4 text-[color:var(--color-ink)]">
                {ticketDetail.slaStatusLabel ?? 'Indisponível'}
              </p>
            </div>
            <div className="min-w-0 px-1 xl:px-2">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">Responsável</p>
              <p className="truncate font-semibold leading-4 text-[color:var(--color-ink)]">
                {currentAssignedLabel}
              </p>
            </div>
            <div className="min-w-0 px-1 xl:px-2">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">Última atualização</p>
              <p className="truncate font-semibold leading-4 text-[color:var(--color-ink)]">
                {formatDateTime(ticketDetail.lastMessageAt ?? ticketDetail.updatedAt)}
              </p>
            </div>
          </div>

          <form className="mt-4 space-y-4" id="support-engineering-handoff-form" onSubmit={onEngineeringHandoffSubmit}>
            <div className="space-y-1">
              <h4 className="text-[13px] font-semibold text-[color:var(--color-ink)]">Detalhes da demanda técnica</h4>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Tipo de demanda">
                <SelectInput
                  className="h-11 rounded-[12px] px-3 text-[13px]"
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
              </Field>

              <Field label="Severidade técnica">
                <SelectInput
                  className="h-11 rounded-[12px] px-3 text-[13px]"
                  onChange={(event) =>
                    onEngineeringHandoffDraftChange({
                      technicalUrgency: event.target.value as TicketPriority,
                    })
                  }
                  value={handoffDraft.technicalUrgency}
                >
                  {TICKET_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {humanizePriority(priority)}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Título técnico">
                <TextInput
                  className="h-11 rounded-[12px] text-[13px]"
                  onChange={(event) =>
                    onEngineeringHandoffDraftChange({ title: event.target.value })
                  }
                  placeholder="Resumo curto e objetivo do problema técnico."
                  value={handoffDraft.title}
                />
              </Field>

              <Field label="Impacto técnico">
                <TextInput
                  className="h-11 rounded-[12px] text-[13px]"
                  onChange={(event) =>
                    onEngineeringHandoffDraftChange({ impactSummary: event.target.value })
                  }
                  placeholder="Descreva o impacto técnico observado."
                  value={handoffDraft.impactSummary}
                />
              </Field>
            </div>

            <Field label="Resumo técnico">
              <div className="space-y-1.5">
                <TextareaInput
                  className="min-h-[98px] rounded-[14px] text-[12px]"
                  maxLength={400}
                  onChange={(event) =>
                    onEngineeringHandoffDraftChange({ description: event.target.value })
                  }
                  placeholder="Descreva de forma objetiva o problema observado."
                  value={handoffDraft.description}
                />
                <div className="text-right text-[10px] text-[color:var(--color-muted)]">
                  {handoffDraft.description.length}/400
                </div>
              </div>
            </Field>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Passos para reproduzir">
                <div className="space-y-1.5">
                  <TextareaInput
                    className="min-h-[92px] rounded-[14px] text-[12px]"
                    maxLength={1000}
                    onChange={(event) =>
                      onEngineeringHandoffDraftChange({ reproductionSteps: event.target.value })
                    }
                    placeholder="Liste os passos necessários para reproduzir o problema."
                    value={handoffDraft.reproductionSteps}
                  />
                  <div className="text-right text-[10px] text-[color:var(--color-muted)]">
                    {handoffDraft.reproductionSteps.length}/1000
                  </div>
                </div>
              </Field>

              <Field label="Resultado atual">
                <div className="space-y-1.5">
                  <TextareaInput
                    className="min-h-[92px] rounded-[14px] text-[12px]"
                    maxLength={500}
                    onChange={(event) =>
                      onEngineeringHandoffDraftChange({ currentResult: event.target.value })
                    }
                    placeholder="Descreva o comportamento atual observado."
                    value={handoffDraft.currentResult}
                  />
                  <div className="text-right text-[10px] text-[color:var(--color-muted)]">
                    {handoffDraft.currentResult.length}/500
                  </div>
                </div>
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Resultado esperado">
                <div className="space-y-1.5">
                  <TextareaInput
                    className="min-h-[86px] rounded-[14px] text-[12px]"
                    maxLength={500}
                    onChange={(event) =>
                      onEngineeringHandoffDraftChange({ expectedResult: event.target.value })
                    }
                    placeholder="Descreva o comportamento esperado."
                    value={handoffDraft.expectedResult}
                  />
                  <div className="text-right text-[10px] text-[color:var(--color-muted)]">
                    {handoffDraft.expectedResult.length}/500
                  </div>
                </div>
              </Field>

              <Field label="Evidências e anexos do ticket">
                <div className="rounded-[14px] border border-dashed border-[rgba(220,228,242,0.96)] bg-[rgba(248,250,255,0.85)] px-4 py-5 text-center">
                  <p className="text-[12px] font-medium text-[color:var(--color-ink)]">
                    {attachments.length > 0
                      ? `${attachments.length} evidência(s) já vinculada(s) ao ticket`
                      : 'Nenhuma evidência vinculada ao ticket'}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-[color:var(--color-muted)]">
                    {attachments.length > 0
                      ? 'As evidências já enviadas na conversa serão usadas como referência neste handoff.'
                      : 'Use a aba de evidências ou o composer da conversa para anexar arquivos antes do envio, quando necessário.'}
                  </p>
                  <TextInput
                    className="mt-3 h-10 rounded-[12px] text-[13px]"
                    onChange={(event) =>
                      onEngineeringHandoffDraftChange({ relatedEvidence: event.target.value })
                    }
                    placeholder="Descreva os arquivos, prints ou logs relevantes."
                    value={handoffDraft.relatedEvidence}
                  />
                </div>
              </Field>
            </div>

            <Field label="Contexto adicional (opcional)">
              <div className="space-y-1.5">
                <TextareaInput
                  className="min-h-[84px] rounded-[14px] text-[12px]"
                  maxLength={800}
                  onChange={(event) =>
                    onEngineeringHandoffDraftChange({ handoffNote: event.target.value })
                  }
                  placeholder="Informações técnicas relevantes, logs, integrações envolvidas, observações, etc."
                  value={handoffDraft.handoffNote}
                />
                <div className="text-right text-[10px] text-[color:var(--color-muted)]">
                  {handoffDraft.handoffNote.length}/800
                </div>
              </div>
            </Field>

            {!canCreateEngineeringHandoff ? (
              <p className="text-[12px] leading-5 text-[color:var(--color-muted)]">
                A criação de handoff técnico não está disponível para este ticket no contexto atual.
              </p>
            ) : null}
          </form>
        </section>

        {engineeringPhase === 'contract-unavailable' ? (
          <InlineNotice tone="warning">
            {engineeringMessage ?? 'A leitura do handoff técnico não ficou disponível neste ambiente.'}
          </InlineNotice>
        ) : engineeringPhase === 'error' ? (
          <InlineNotice tone="warning">
            {engineeringMessage ?? 'Não foi possível carregar o handoff técnico deste ticket.'}
          </InlineNotice>
        ) : engineeringLinks.length > 0 ? (
          <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Demandas de engenharia vinculadas
              </p>
              <h4 className="text-[14px] font-semibold text-[color:var(--color-ink)]">
                Handoffs já abertos para este ticket
              </h4>
            </div>
            <div className="mt-3 space-y-2.5">
              {engineeringLinks.map((link) => (
                <SupportEngineeringLinkCard
                  humanizeEngineeringWorkItemStatus={humanizeEngineeringWorkItemStatus}
                  humanizeEngineeringWorkItemType={humanizeEngineeringWorkItemType}
                  humanizePriority={humanizePriority}
                  key={link.engineeringTicketLinkId}
                  link={link}
                  sanitizeSupportVisibleText={sanitizeSupportVisibleText}
                  toneForEngineeringWorkItemStatus={toneForEngineeringWorkItemStatus}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <aside className="min-h-0 space-y-3 overflow-y-auto pr-1">
        <section className="rounded-[16px] border border-[rgba(48,127,226,0.18)] bg-[linear-gradient(180deg,#071942_0%,#10245f_100%)] px-4 py-3.5 text-white shadow-[0_16px_28px_rgba(8,22,61,0.16)]">
          <h4 className="text-[13px] font-semibold text-white">Resumo do handoff</h4>
          <p className="mt-2 text-[12px] leading-5 text-white/72">
            A demanda será criada vinculada ao ticket principal. Ambos manterão histórico independente e auditável.
          </p>
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-white/12 bg-white/6 text-white/90">
                <SupportSurfaceIcon className="h-[15px] w-[15px]" kind="ticket" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-white">Ticket principal (origem)</p>
                <p className="mt-1 text-[12px] font-semibold text-white/86">{supportTicketCode(ticketDetail.id)}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-white/68">{ticketDetail.title}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-white/12 bg-white/6 text-white/90">
                <SupportSurfaceIcon className="h-[15px] w-[15px]" kind="code" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-white">Demanda técnica (nova)</p>
                <p className="mt-1 text-[11px] leading-5 text-white/68">
                  Será criada após envio. Visível apenas para Engenharia.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-white/12 bg-white/6 text-white/90">
                <SupportSurfaceIcon className="h-[15px] w-[15px]" kind="open" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-white">Retorno para suporte</p>
                <p className="mt-1 text-[11px] leading-5 text-white/68">
                  Após análise, o time técnico retornará com atualização ou solução.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
          <h4 className="text-[13px] font-semibold text-[color:var(--color-ink)]">Informações do ticket</h4>
          <div className="mt-3 space-y-2 text-[12px] leading-5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[color:var(--color-muted)]">Cliente</span>
              <span className="text-right font-semibold text-[color:var(--color-ink)]">
                {ticketDetail.tenantDisplayName ?? ticketDetail.tenantLegalName ?? ticketDetail.tenantSlug}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[color:var(--color-muted)]">Solicitante</span>
              <span className="text-right font-semibold text-[color:var(--color-ink)]">
                {ticketDetail.requesterContactFullName ?? ticketDetail.requesterContactEmail ?? 'Indisponível'}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[color:var(--color-muted)]">Categoria</span>
              <span className="text-right font-semibold text-[color:var(--color-ink)]">
                {ticketDetail.categoryName ?? 'Indisponível'}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[color:var(--color-muted)]">SLA interno</span>
              <span className="text-right font-semibold text-[color:var(--color-ink)]">
                {ticketDetail.slaStatusLabel ?? 'Indisponível'}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[color:var(--color-muted)]">Responsável atual</span>
              <span className="text-right font-semibold text-[color:var(--color-ink)]">
                {currentAssignedLabel}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[color:var(--color-muted)]">Criado em</span>
              <span className="text-right font-semibold text-[color:var(--color-ink)]">
                {formatDateTime(ticketDetail.createdAt)}
              </span>
            </div>
          </div>
          <Link
            className="mt-3 inline-flex min-h-[34px] w-full items-center justify-center rounded-[12px] border border-[rgba(47,107,255,0.24)] px-3 text-[11px] font-semibold text-[color:var(--color-brand-blue)]"
            to={`/support/tickets/${ticketDetail.id}`}
          >
            Abrir ticket em nova aba
          </Link>
        </section>

        <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
          <h4 className="text-[13px] font-semibold text-[color:var(--color-ink)]">Boas práticas</h4>
          <ul className="mt-3 space-y-2 text-[11.5px] leading-5 text-[color:var(--color-muted)]">
            <li>Inclua o máximo de evidências possível.</li>
            <li>Descreva os passos para reproduzir.</li>
            <li>Informe impacto e resultado esperado.</li>
            <li>Evite dados sensíveis em anexos.</li>
          </ul>
        </section>
      </aside>
    </section>
  );
}

export function SupportOperationalWorkbenchPanel({
  activeSurface,
  attachmentDownloadingId,
  attachmentKind,
  attachmentMessage,
  attachmentPhase,
  attachments,
  buildStatusChoices,
  canCreateEngineeringHandoff,
  classificationDraft,
  classificationOptionsMessage,
  classificationReasonOptions,
  compactSlaStatusLabel,
  compactTicketStatusLabel,
  currentAssignedLabel,
  customerAccountContext,
  engineeringLinks,
  engineeringMessage,
  engineeringPhase,
  formatAttachmentSize,
  handoffDraft,
  handoffSubmitting,
  humanizeAttachmentStatus,
  humanizeCustomerValue,
  humanizeEngineeringWorkItemStatus,
  humanizeEngineeringWorkItemType,
  humanizePriority,
  humanizeSeverity,
  humanizeStatus,
  humanizeTicketEventLabel,
  onClassificationDraftChange,
  onDownloadAttachment,
  onEngineeringHandoffDraftChange,
  onEngineeringHandoffSubmit,
  onPrioritySeverityDraftChange,
  onStatusDraftChange,
  onStatusNoteChange,
  onStatusReasonChange,
  onSubmitClassification,
  onSubmitPrioritySeverity,
  onSubmitStatus,
  onUploadAttachment,
  pendingCloseItems,
  priorityReasonOptions,
  prioritySeverityDraft,
  requiresOperationalReasonForStatus,
  sanitizeSupportVisibleText,
  setActiveSurface,
  statusDraft,
  statusNote,
  statusReasonId,
  statusReasonOptions,
  submitting,
  summarizeTimelineEvent,
  supportTicketCode,
  ticketCategoryOptions,
  ticketDetail,
  timelineWindow,
  toneForAttachmentStatus,
  toneForEngineeringWorkItemStatus,
  toneForPriority,
  toneForTicketStatus,
}: {
  activeSurface: TicketActionDrawer;
  attachmentDownloadingId: string | null;
  attachmentKind: (attachment: SupportTicketAttachment) => string;
  attachmentMessage: string | null;
  attachmentPhase: AttachmentPhase;
  attachments: SupportTicketAttachment[];
  buildStatusChoices: (
    status: TicketStatus,
    allowedNextStatuses: SupportTicketDetail['allowedNextStatuses'],
  ) => TicketStatusUpdateTarget[];
  canCreateEngineeringHandoff: boolean;
  classificationDraft: TicketClassificationDraft;
  classificationOptionsMessage: string | null;
  classificationReasonOptions: SupportTicketClassificationOption[];
  compactSlaStatusLabel: (label: string | null | undefined) => string;
  compactTicketStatusLabel: (status: TicketStatus) => string;
  currentAssignedLabel: string;
  customerAccountContext: SupportCustomerAccountContext | null;
  engineeringLinks: SupportTicketEngineeringLink[];
  engineeringMessage: string | null;
  engineeringPhase: EngineeringPhase;
  formatAttachmentSize: (sizeBytes: number) => string;
  handoffDraft: EngineeringHandoffDraft;
  handoffSubmitting: boolean;
  humanizeAttachmentStatus: (status: SupportTicketAttachment['status']) => string;
  humanizeCustomerValue: (value: string) => string;
  humanizeEngineeringWorkItemStatus: (status: SupportTicketEngineeringLink['workItemStatus']) => string;
  humanizeEngineeringWorkItemType: (type: SupportTicketEngineeringLink['workItemType']) => string;
  humanizePriority: (priority: TicketPriority) => string;
  humanizeSeverity: (severity: TicketSeverity) => string;
  humanizeStatus: (status: TicketStatus | TicketStatusUpdateTarget) => string;
  humanizeTicketEventLabel: (eventType: SupportTicketTimelineRecentWindow['entries'][number]['eventType']) => string;
  onClassificationDraftChange: (patch: Partial<TicketClassificationDraft>) => void;
  onDownloadAttachment: (attachmentId: Uuid) => void;
  onEngineeringHandoffDraftChange: (patch: Partial<EngineeringHandoffDraft>) => void;
  onEngineeringHandoffSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPrioritySeverityDraftChange: (patch: Partial<TicketPrioritySeverityDraft>) => void;
  onStatusDraftChange: (status: TicketStatusUpdateTarget) => void;
  onStatusNoteChange: (value: string) => void;
  onStatusReasonChange: (value: Uuid | '') => void;
  onSubmitClassification: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitPrioritySeverity: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitStatus: (event: FormEvent<HTMLFormElement>) => void;
  onUploadAttachment: () => void;
  pendingCloseItems: string[];
  priorityReasonOptions: SupportTicketClassificationOption[];
  prioritySeverityDraft: TicketPrioritySeverityDraft;
  requiresOperationalReasonForStatus: (status: TicketStatusUpdateTarget) => boolean;
  sanitizeSupportVisibleText: (value: string | null | undefined) => string;
  setActiveSurface: (surface: TicketActionDrawer) => void;
  statusDraft: TicketStatusUpdateTarget;
  statusNote: string;
  statusReasonId: Uuid | '';
  statusReasonOptions: SupportTicketClassificationOption[];
  submitting: boolean;
  summarizeTimelineEvent: (entry: SupportTicketTimelineRecentWindow['entries'][number]) => string;
  supportTicketCode: (ticketId: Uuid) => string;
  ticketCategoryOptions: SupportTicketClassificationOption[];
  ticketDetail: SupportTicketDetail;
  timelineWindow: SupportTicketTimelineRecentWindow;
  toneForAttachmentStatus: (status: SupportTicketAttachment['status']) => CompactPillTone;
  toneForEngineeringWorkItemStatus: (status: SupportTicketEngineeringLink['workItemStatus']) => StatusPillTone;
  toneForPriority: (priority: TicketPriority) => CompactPillTone;
  toneForTicketStatus: (status: TicketStatus) => CompactPillTone;
}) {
  const surfaceButtons = [
    { key: 'classification' as const, label: 'Classificação' },
    { key: 'evidence' as const, label: 'Evidências' },
    { key: 'handoff' as const, label: 'Handoff técnico' },
  ];

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {activeSurface === 'classification' ? (
        <div className="shrink-0 rounded-[16px] border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.05)]">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Mais ações
              </p>
              <h3 className="text-[15px] font-bold tracking-[-0.025em] text-[color:var(--color-ink)]">
                Operação complementar do ticket
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {surfaceButtons.map((surface) => (
                <button
                  className={cx(
                    'inline-flex min-h-8 items-center rounded-full border px-3 text-[11px] font-semibold transition',
                    activeSurface === surface.key
                      ? 'border-[rgba(47,107,255,0.24)] bg-[rgba(47,107,255,0.08)] text-[color:var(--color-brand-blue)]'
                      : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]',
                  )}
                  key={`surface:${surface.key}`}
                  onClick={() => setActiveSurface(surface.key)}
                  type="button"
                >
                  {surface.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {activeSurface === 'classification' ? (
          <SupportClassificationPanel
            buildStatusChoices={buildStatusChoices}
            classificationDraft={classificationDraft}
            classificationOptionsMessage={classificationOptionsMessage}
            classificationReasonOptions={classificationReasonOptions}
            compactSlaStatusLabel={compactSlaStatusLabel}
            compactTicketStatusLabel={compactTicketStatusLabel}
            currentAssignedLabel={currentAssignedLabel}
            customerAccountContext={customerAccountContext}
            humanizeCustomerValue={humanizeCustomerValue}
            humanizePriority={humanizePriority}
            humanizeSeverity={humanizeSeverity}
            humanizeStatus={humanizeStatus}
            humanizeTicketEventLabel={humanizeTicketEventLabel}
            onClassificationDraftChange={onClassificationDraftChange}
            onPrioritySeverityDraftChange={onPrioritySeverityDraftChange}
            onStatusDraftChange={onStatusDraftChange}
            onStatusNoteChange={onStatusNoteChange}
            onStatusReasonChange={onStatusReasonChange}
            onSubmitClassification={onSubmitClassification}
            onSubmitPrioritySeverity={onSubmitPrioritySeverity}
            onSubmitStatus={onSubmitStatus}
            pendingCloseItems={pendingCloseItems}
            priorityReasonOptions={priorityReasonOptions}
            prioritySeverityDraft={prioritySeverityDraft}
            requiresOperationalReasonForStatus={requiresOperationalReasonForStatus}
            statusDraft={statusDraft}
            statusNote={statusNote}
            statusReasonId={statusReasonId}
            statusReasonOptions={statusReasonOptions}
            submitting={submitting}
            summarizeTimelineEvent={summarizeTimelineEvent}
            ticketCategoryOptions={ticketCategoryOptions}
            ticketDetail={ticketDetail}
            timelineWindow={timelineWindow}
          />
        ) : activeSurface === 'evidence' ? (
          <SupportTicketAttachmentsPanel
            attachmentKind={attachmentKind}
            attachments={attachments}
            currentAssignedLabel={currentAssignedLabel}
            downloadingAttachmentId={attachmentDownloadingId}
            formatAttachmentSize={formatAttachmentSize}
            humanizeAttachmentStatus={humanizeAttachmentStatus}
            message={attachmentMessage}
            onBack={() => setActiveSurface('classification')}
            onDownload={onDownloadAttachment}
            onUpload={onUploadAttachment}
            phase={attachmentPhase}
            supportTicketCode={supportTicketCode}
            ticketDetail={ticketDetail}
            toneForAttachmentStatus={toneForAttachmentStatus}
          />
        ) : (
          <SupportMoreActionsPanel
            attachments={attachments}
            canCreateEngineeringHandoff={canCreateEngineeringHandoff}
            compactTicketStatusLabel={compactTicketStatusLabel}
            currentAssignedLabel={currentAssignedLabel}
            engineeringLinks={engineeringLinks}
            engineeringMessage={engineeringMessage}
            engineeringPhase={engineeringPhase}
            handoffDraft={handoffDraft}
            handoffSubmitting={handoffSubmitting}
            humanizeEngineeringWorkItemStatus={humanizeEngineeringWorkItemStatus}
            humanizeEngineeringWorkItemType={humanizeEngineeringWorkItemType}
            humanizePriority={humanizePriority}
            onCancel={() => setActiveSurface('classification')}
            onEngineeringHandoffDraftChange={onEngineeringHandoffDraftChange}
            onEngineeringHandoffSubmit={onEngineeringHandoffSubmit}
            sanitizeSupportVisibleText={sanitizeSupportVisibleText}
            supportTicketCode={supportTicketCode}
            ticketDetail={ticketDetail}
            toneForEngineeringWorkItemStatus={toneForEngineeringWorkItemStatus}
            toneForPriority={toneForPriority}
            toneForTicketStatus={toneForTicketStatus}
          />
        )}
      </div>
    </section>
  );
}
