import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { formatDateTime } from '../../app/format';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  ContractUnavailableState,
} from '../../components/states';
import {
  AppButton,
  Field,
  GhostButton,
  GovernedActionDrawer,
  InlineNotice,
  SelectInput,
  StatusPill,
  TextareaInput,
  cx,
} from '../../components/ui';
import {
  INTERNAL_ACTION_STATUSES,
  TICKET_PRIORITIES,
  type InternalActionAreaAuthContext,
  type InternalActionAreaDetail,
  type InternalActionAreaKey,
  type InternalActionAreaQueueItem,
  type InternalActionAreaTimelineEntry,
  type InternalActionStatus,
  type TicketPriority,
} from '../../contracts/support-contracts';
import { classifyAdminError } from '../admin/admin-errors';
import { useAuthContext } from '../auth/auth-context';
import {
  addInternalActionComment,
  assignInternalActionToSelf,
  getInternalActionAreaDetail,
  listInternalActionAreaAuthContexts,
  listInternalActionAreaQueue,
  listInternalActionAreaTimeline,
  returnInternalActionToSupport,
  updateInternalActionStatus,
} from './internal-actions-api';

type Phase = 'loading' | 'ready' | 'contract-unavailable' | 'error';
type ActionDrawer = 'comment' | 'status' | 'return' | null;

const AREA_UPDATE_STATUSES: InternalActionStatus[] = [
  'in_progress',
  'waiting_support',
  'waiting_external',
  'cancelled',
];

function humanizeStatus(status: InternalActionStatus) {
  switch (status) {
    case 'open':
      return 'Aberto';
    case 'assigned':
      return 'Assumido';
    case 'in_progress':
      return 'Em execução';
    case 'waiting_support':
      return 'Aguardando suporte';
    case 'waiting_external':
      return 'Aguardando externo';
    case 'returned_to_support':
      return 'Devolvido ao suporte';
    case 'follow_up_requested':
      return 'Complemento solicitado';
    case 'closed':
      return 'Encerrado';
    case 'cancelled':
      return 'Cancelado';
  }
}

function toneForStatus(status: InternalActionStatus) {
  if (status === 'closed' || status === 'returned_to_support') {
    return 'positive' as const;
  }

  if (status === 'cancelled') {
    return 'critical' as const;
  }

  if (status === 'waiting_support' || status === 'waiting_external') {
    return 'warning' as const;
  }

  if (status === 'assigned' || status === 'in_progress') {
    return 'accent' as const;
  }

  return 'default' as const;
}

function humanizePriority(priority: TicketPriority | null | undefined) {
  switch (priority) {
    case 'low':
      return 'Baixa';
    case 'normal':
      return 'Normal';
    case 'high':
      return 'Alta';
    case 'urgent':
      return 'Urgente';
    default:
      return 'Indisponível';
  }
}

function toneForPriority(priority: TicketPriority | null | undefined) {
  if (priority === 'urgent' || priority === 'high') {
    return 'critical' as const;
  }

  if (priority === 'normal') {
    return 'warning' as const;
  }

  if (priority === 'low') {
    return 'positive' as const;
  }

  return 'default' as const;
}

function humanizeSupportType(value: string) {
  return value
    .replace('information_request', 'Solicitação de informação')
    .replace('external_follow_up', 'Acompanhamento externo')
    .replace('technical_investigation', 'Investigação técnica')
    .replace('analysis', 'Análise')
    .replace('execution', 'Execução')
    .replace('approval', 'Aprovação');
}

function compactActionCode(actionId: string) {
  return `IA-${actionId.slice(0, 8).toUpperCase()}`;
}

function CompactPill({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'positive' | 'warning' | 'critical';
}) {
  const classes = {
    default: 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-ink)]',
    accent: 'border-[rgba(48,127,226,0.28)] bg-[rgba(48,127,226,0.1)] text-[color:var(--color-brand-blue)]',
    positive: 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-text)]',
    warning: 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-text)]',
    critical: 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] text-[color:var(--color-danger-text)]',
  }[tone];

  return (
    <span
      className={cx(
        'inline-flex max-w-full items-center rounded-full border px-2 py-1 text-[9px] font-semibold uppercase leading-none tracking-[0.14em]',
        classes,
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

function QueueRow({
  active,
  item,
}: {
  active: boolean;
  item: InternalActionAreaQueueItem;
}) {
  return (
    <Link
      className={cx(
        'flex min-h-[70px] flex-col gap-2 border-b border-[color:var(--color-border)] px-3 py-2 text-left transition last:border-b-0 lg:grid lg:grid-cols-[minmax(280px,1.35fr)_minmax(260px,1fr)_116px] lg:items-center',
        active
          ? 'rounded-[12px] border border-[rgba(48,127,226,0.55)] bg-[rgba(48,127,226,0.08)]'
          : 'hover:bg-[color:var(--color-surface)]',
      )}
      to={`/internal-actions/${item.internalActionId}`}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-brand-blue)]">
          {compactActionCode(item.internalActionId)}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[12.5px] font-semibold text-[color:var(--color-ink)]">
          {item.summary}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[10.5px] text-[color:var(--color-muted)]">
          {item.ticketTitle}
        </p>
      </div>
      <div className="grid min-w-0 gap-1 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
        <CompactPill tone={toneForStatus(item.status)}>
          {humanizeStatus(item.status)}
        </CompactPill>
        <p className="truncate text-[12px] font-semibold text-[color:var(--color-ink)]">
          {item.targetAreaLabel}
        </p>
        <p className="truncate text-[12px] text-[color:var(--color-muted)]">
          {item.assignedAreaUserName ?? 'Sem responsável'}
        </p>
      </div>
      <p className="text-right text-[11px] leading-4 text-[color:var(--color-muted)]">
        {formatDateTime(item.updatedAt)}
      </p>
    </Link>
  );
}

function DetailLine({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const content = href ? (
    <Link className="font-semibold text-[color:var(--color-brand-blue)] hover:underline" to={href}>
      {value}
    </Link>
  ) : (
    <span className="font-semibold text-[color:var(--color-ink)]">{value}</span>
  );

  return (
    <div className="grid grid-cols-[132px_minmax(0,1fr)] gap-3 border-b border-[color:var(--color-border)] py-2 last:border-b-0">
      <span className="text-[11px] text-[color:var(--color-muted)]">{label}</span>
      <span className="min-w-0 truncate text-[12px]">{content}</span>
    </div>
  );
}

function DetailPanel({
  currentUserId,
  detail,
  onAssign,
  onOpenComment,
  onOpenReturn,
  onOpenStatus,
  submitting,
  timeline,
}: {
  currentUserId: string | null;
  detail: InternalActionAreaDetail | null;
  onAssign: () => void;
  onOpenComment: () => void;
  onOpenReturn: () => void;
  onOpenStatus: () => void;
  submitting: boolean;
  timeline: InternalActionAreaTimelineEntry[];
}) {
  if (!detail) {
    return (
      <EmptyState
        title="Nenhum acionamento selecionado"
        description="Selecione um acionamento da fila para ver contexto, timeline e ações reais da área."
      />
    );
  }

  const terminal = ['closed', 'cancelled', 'returned_to_support'].includes(detail.status);
  const assignedToAnother = Boolean(
    detail.assignedAreaUserId &&
      currentUserId &&
      detail.assignedAreaUserId !== currentUserId,
  );
  const canAssign = !terminal && !detail.assignedAreaUserId;

  return (
    <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(280px,1.1fr)_minmax(230px,0.9fr)_minmax(250px,1fr)]">
      <section className="rounded-[16px] border border-[rgba(48,127,226,0.22)] bg-[linear-gradient(180deg,rgba(8,24,61,1),rgba(13,36,92,0.98))] px-4 py-3 text-white xl:col-span-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-[1.25rem] font-semibold tracking-[-0.045em]">
            {compactActionCode(detail.internalActionId)}
          </h2>
          <StatusPill tone={toneForStatus(detail.status)}>
            {humanizeStatus(detail.status)}
          </StatusPill>
          <StatusPill tone={toneForPriority(detail.priority)}>
            {humanizePriority(detail.priority)}
          </StatusPill>
        </div>
        <h3 className="mt-2 line-clamp-2 text-[1rem] font-semibold leading-tight tracking-[-0.035em]">
          {detail.summary}
        </h3>
        <p className="mt-1 line-clamp-3 text-[12px] leading-5 text-white/74">
          {detail.context}
        </p>
      </section>

      <div className="xl:col-span-3">
        <InlineNotice>
          Este workspace opera apenas o acionamento interno. O ticket permanece com o suporte,
          sem mudança automática de status e sem exposição no Portal Cliente.
        </InlineNotice>
      </div>

      <section className="rounded-[14px] border border-[color:var(--color-border)] bg-white px-4 py-3">
        <DetailLine label="Cliente" value={detail.tenantDisplayName ?? 'Cliente indisponível'} />
        <DetailLine
          href={`/support/tickets/${detail.ticketId}`}
          label="Ticket de origem"
          value={`#${detail.ticketId.slice(0, 8)} · ${detail.ticketTitle}`}
        />
        <DetailLine label="Área" value={detail.targetAreaLabel} />
        <DetailLine label="Tipo de apoio" value={humanizeSupportType(detail.supportType)} />
        <DetailLine label="Solicitante" value={detail.requestedByUserName ?? 'Indisponível'} />
        <DetailLine label="Responsável" value={detail.assignedAreaUserName ?? 'Sem responsável'} />
        <DetailLine label="Evidências vinculadas" value={String(detail.linkedEvidenceCount)} />
        <DetailLine label="Última atualização" value={formatDateTime(detail.updatedAt)} />
      </section>

      <section className="rounded-[14px] border border-[color:var(--color-border)] bg-white px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
          Ações da área
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <AppButton disabled={!canAssign || submitting} onClick={onAssign} type="button">
            Assumir acionamento
          </AppButton>
          <GhostButton disabled={terminal || submitting} onClick={onOpenComment} type="button">
            Registrar update
          </GhostButton>
          <GhostButton disabled={terminal || submitting} onClick={onOpenStatus} type="button">
            Atualizar andamento
          </GhostButton>
          <AppButton
            disabled={terminal || assignedToAnother || submitting}
            onClick={onOpenReturn}
            type="button"
          >
            Devolver ao suporte
          </AppButton>
        </div>
        {!canAssign && !terminal ? (
          <p className="mt-2 text-[11px] text-[color:var(--color-muted)]">
            Assumir fica indisponível quando já existe responsável registrado.
          </p>
        ) : null}
      </section>

      <section className="min-h-0 rounded-[14px] border border-[color:var(--color-border)] bg-white px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
          Timeline interna
        </p>
        <div className="mt-3 max-h-[300px] space-y-2 overflow-y-auto">
          {timeline.length === 0 ? (
            <p className="text-[12px] text-[color:var(--color-muted)]">Nenhum evento registrado.</p>
          ) : (
            timeline.map((entry) => (
              <article
                className="rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2"
                key={entry.internalActionUpdateId}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <CompactPill>{entry.updateKind.replaceAll('_', ' ')}</CompactPill>
                  <span className="text-[11px] text-[color:var(--color-muted)]">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-5 text-[color:var(--color-ink)]">
                  {entry.body}
                </p>
                <p className="mt-1 text-[11px] text-[color:var(--color-muted)]">
                  Por {entry.createdByUserName ?? 'usuário interno'}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export function InternalActionsWorkspacePage() {
  const { actionId } = useParams();
  const navigate = useNavigate();
  const { gate, user } = useAuthContext();
  const [phase, setPhase] = useState<Phase>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [areaContexts, setAreaContexts] = useState<InternalActionAreaAuthContext[]>([]);
  const [items, setItems] = useState<InternalActionAreaQueueItem[]>([]);
  const [detail, setDetail] = useState<InternalActionAreaDetail | null>(null);
  const [timeline, setTimeline] = useState<InternalActionAreaTimelineEntry[]>([]);
  const [statusFilter, setStatusFilter] = useState<InternalActionStatus | 'all'>('all');
  const [areaFilter, setAreaFilter] = useState<InternalActionAreaKey | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [drawer, setDrawer] = useState<ActionDrawer>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState<{
    status: InternalActionStatus;
    body: string;
  }>({ status: 'in_progress', body: '' });
  const [returnDraft, setReturnDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const selectedId = actionId ?? items[0]?.internalActionId ?? null;

  const loadWorkspace = useCallback(async () => {
    setPhase('loading');
    setMessage(null);
    try {
      const [contexts, queue] = await Promise.all([
        listInternalActionAreaAuthContexts(),
        listInternalActionAreaQueue({
          priority: priorityFilter,
          status: statusFilter,
          targetArea: areaFilter,
        }),
      ]);
      setAreaContexts(contexts);
      setItems(queue);

      const nextSelectedId = actionId ?? queue[0]?.internalActionId ?? null;
      if (nextSelectedId) {
        const [nextDetail, nextTimeline] = await Promise.all([
          getInternalActionAreaDetail(nextSelectedId),
          listInternalActionAreaTimeline(nextSelectedId),
        ]);
        setDetail(nextDetail);
        setTimeline(nextTimeline);
      } else {
        setDetail(null);
        setTimeline([]);
      }

      setPhase('ready');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao carregar acionamentos internos.',
      );
      setPhase(classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error');
      setMessage(classified.message);
    }
  }, [actionId, areaFilter, priorityFilter, statusFilter]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!actionId && items[0]?.internalActionId) {
      navigate(`/internal-actions/${items[0].internalActionId}`, { replace: true });
    }
  }, [actionId, items, navigate]);

  const counts = useMemo(() => {
    return {
      open: items.filter((item) => !['closed', 'cancelled'].includes(item.status)).length,
      waitingSupport: items.filter((item) => item.status === 'waiting_support').length,
      returned: items.filter((item) => item.status === 'returned_to_support').length,
    };
  }, [items]);

  const areaOptions = useMemo(() => {
    return Array.from(
      new Map([
        ...areaContexts.map((context) => [context.areaKey, context.areaLabel] as const),
        ...items.map((item) => [item.targetArea, item.targetAreaLabel] as const),
      ]).entries(),
    ).sort((left, right) => left[1].localeCompare(right[1]));
  }, [areaContexts, items]);

  const isPlatformAdmin = gate.actor?.is_platform_admin === true;
  const gateStillResolving = gate.phase === 'idle' || gate.phase === 'loading';
  const hasInternalAreaContext = areaContexts.some((context) => context.canViewQueue);
  const filtersAreBroad = statusFilter === 'all' && areaFilter === 'all' && priorityFilter === 'all';
  const visibleAreaLabels = areaContexts
    .map((context) => context.areaLabel)
    .filter((label, index, labels) => labels.indexOf(label) === index)
    .join(', ');
  const emptyQueueTitle =
    filtersAreBroad && hasInternalAreaContext
      ? 'Nenhum acionamento pendente para sua área.'
      : 'Nenhum acionamento neste recorte';
  const emptyQueueDescription =
    filtersAreBroad && hasInternalAreaContext
      ? `Quando o suporte acionar ${visibleAreaLabels || 'sua área'}, os itens aparecerão aqui.`
      : 'Ajuste os filtros ou atualize a fila para consultar novamente os acionamentos autorizados para sua área.';

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setSubmitting(true);
    setActionMessage(null);
    try {
      await action();
      setActionMessage(successMessage);
      setDrawer(null);
      setCommentDraft('');
      setReturnDraft('');
      await loadWorkspace();
    } catch (error) {
      const classified = classifyAdminError(error, 'Falha ao executar ação do acionamento.');
      setActionMessage(classified.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleAssign() {
    if (!detail) {
      return;
    }

    void runAction(
      () =>
        assignInternalActionToSelf({
          internalActionId: detail.internalActionId,
          tenantId: detail.tenantId,
        }),
      'Acionamento assumido pela área interna.',
    );
  }

  function handleCommentSubmit(event: FormEvent) {
    event.preventDefault();
    if (!detail || !commentDraft.trim()) {
      return;
    }

    void runAction(
      () =>
        addInternalActionComment({
          internalActionId: detail.internalActionId,
          tenantId: detail.tenantId,
          body: commentDraft.trim(),
        }),
      'Update interno registrado.',
    );
  }

  function handleStatusSubmit(event: FormEvent) {
    event.preventDefault();
    if (!detail || !statusDraft.body.trim()) {
      return;
    }

    void runAction(
      () =>
        updateInternalActionStatus({
          internalActionId: detail.internalActionId,
          tenantId: detail.tenantId,
          status: statusDraft.status,
          body: statusDraft.body.trim(),
        }),
      'Andamento do acionamento atualizado.',
    );
  }

  function handleReturnSubmit(event: FormEvent) {
    event.preventDefault();
    if (!detail || !returnDraft.trim()) {
      return;
    }

    void runAction(
      () =>
        returnInternalActionToSupport({
          internalActionId: detail.internalActionId,
          tenantId: detail.tenantId,
          body: returnDraft.trim(),
        }),
      'Acionamento devolvido ao suporte.',
    );
  }

  if (phase === 'loading') {
    return (
      <LoadingState
        title="Carregando acionamentos"
        description="Estamos carregando os acionamentos autorizados para sua área."
      />
    );
  }

  if (phase === 'contract-unavailable') {
    return (
      <ContractUnavailableState
        contractName={message ?? undefined}
        resourceName="os acionamentos internos"
        action={<GhostButton onClick={() => void loadWorkspace()}>Tentar novamente</GhostButton>}
      />
    );
  }

  if (phase === 'error') {
    return (
      <ErrorState
        description={message ?? 'Não foi possível carregar acionamentos internos.'}
        action={<GhostButton onClick={() => void loadWorkspace()}>Tentar novamente</GhostButton>}
      />
    );
  }

  if (
    phase === 'ready' &&
    items.length === 0 &&
    !hasInternalAreaContext &&
    !isPlatformAdmin &&
    !gateStillResolving
  ) {
    return (
      <Navigate
        replace
        to="/access-denied"
        state={{ reason: 'missing-authorized-workspace' }}
      />
    );
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-[var(--workspace-panel-gap)] overflow-hidden">
        <header className="shrink-0 rounded-[18px] border border-[color:var(--color-border)] bg-white/95 px-4 py-[var(--workspace-header-y)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[1.55rem] font-semibold leading-tight tracking-[-0.045em] text-[color:var(--color-ink)]">
                Acionamentos internos
              </h1>
              <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
                Fila operacional para áreas acionadas pelo suporte, mantendo o ticket com o time de atendimento.
              </p>
            </div>
            <GhostButton className="min-h-9 rounded-[12px] px-4 text-[12px]" onClick={() => void loadWorkspace()} type="button">
              Recarregar
            </GhostButton>
          </div>
        </header>

        <div className="grid shrink-0 gap-[var(--workspace-panel-gap)] lg:grid-cols-3">
          <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white/95 px-4 py-3">
            <p className="text-[11px] font-semibold text-[color:var(--color-muted)]">Em aberto</p>
            <p className="mt-1 text-[1.25rem] font-semibold text-[color:var(--color-ink)]">{counts.open}</p>
          </section>
          <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white/95 px-4 py-3">
            <p className="text-[11px] font-semibold text-[color:var(--color-muted)]">Aguardando suporte</p>
            <p className="mt-1 text-[1.25rem] font-semibold text-[color:var(--color-ink)]">{counts.waitingSupport}</p>
          </section>
          <section className="rounded-[16px] border border-[color:var(--color-border)] bg-white/95 px-4 py-3">
            <p className="text-[11px] font-semibold text-[color:var(--color-muted)]">Devolvidos</p>
            <p className="mt-1 text-[1.25rem] font-semibold text-[color:var(--color-ink)]">{counts.returned}</p>
          </section>
        </div>

        {actionMessage ? <InlineNotice>{actionMessage}</InlineNotice> : null}

        <div className="grid min-h-0 flex-1 gap-[var(--workspace-panel-gap)] overflow-y-auto lg:grid-cols-[minmax(250px,286px)_minmax(0,1fr)] lg:overflow-hidden">
          <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-[var(--workspace-panel-gap)] overflow-hidden rounded-[18px] border border-[color:var(--color-border)] bg-white/93 p-3">
            <section className="rounded-[14px] border border-[color:var(--color-border)] bg-white px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                Filtros
              </p>
              <div className="mt-2 grid gap-2">
                <Field label="Status">
                  <SelectInput
                    className="h-8.5 rounded-[12px] px-3 text-[12px]"
                    onChange={(event) => setStatusFilter(event.target.value as InternalActionStatus | 'all')}
                    value={statusFilter}
                  >
                    <option value="all">Todos</option>
                    {INTERNAL_ACTION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanizeStatus(status)}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Área">
                  <SelectInput
                    className="h-8.5 rounded-[12px] px-3 text-[12px]"
                    onChange={(event) => setAreaFilter(event.target.value as InternalActionAreaKey | 'all')}
                    value={areaFilter}
                  >
                    <option value="all">Todas</option>
                    {areaOptions.map(([areaKey, label]) => (
                      <option key={areaKey} value={areaKey}>
                        {label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Prioridade">
                  <SelectInput
                    className="h-8.5 rounded-[12px] px-3 text-[12px]"
                    onChange={(event) => setPriorityFilter(event.target.value as TicketPriority | 'all')}
                    value={priorityFilter}
                  >
                    <option value="all">Todas</option>
                    {TICKET_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {humanizePriority(priority)}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
            </section>

            <section className="min-h-0 overflow-y-auto rounded-[14px] border border-[color:var(--color-border)] bg-white px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                Recorte atual
              </p>
              <p className="mt-1 text-[12px] text-[color:var(--color-muted)]">
                {items.length} acionamento(s) visíveis para sua área.
              </p>
            </section>
          </aside>

          <main className="flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-[color:var(--color-border)] bg-white/95 lg:min-h-0">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-4 py-2.5">
              <div>
                <h2 className="text-[1rem] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                  Fila da área
                </h2>
                <p className="mt-0.5 text-[12px] text-[color:var(--color-muted)]">
                  Apenas acionamentos autorizados para sua área.
                </p>
              </div>
              <StatusPill>{items.length} itens</StatusPill>
            </div>
            <div className="hidden grid-cols-[minmax(280px,1.35fr)_minmax(260px,1fr)_116px] gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)] lg:grid">
              <span>Acionamento</span>
              <span>Status, área e responsável</span>
              <span className="text-right">Atualizado</span>
            </div>
            <div className="min-h-0 flex-[0.9] overflow-y-auto px-3 py-2">
              {items.length === 0 ? (
                <EmptyState
                  title={emptyQueueTitle}
                  description={emptyQueueDescription}
                  action={
                    <GhostButton onClick={() => void loadWorkspace()} type="button">
                      Atualizar fila
                    </GhostButton>
                  }
                />
              ) : (
                <div className="overflow-hidden rounded-[14px] border border-[color:var(--color-border)] bg-white">
                  {items.map((item) => (
                    <QueueRow
                      active={item.internalActionId === selectedId}
                      item={item}
                      key={item.internalActionId}
                    />
                  ))}
                </div>
              )}
            </div>
            <section className="min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
              <DetailPanel
                currentUserId={user?.id ?? null}
                detail={detail}
                onAssign={handleAssign}
                onOpenComment={() => setDrawer('comment')}
                onOpenReturn={() => setDrawer('return')}
                onOpenStatus={() => {
                  setStatusDraft({
                    status:
                      detail?.status && AREA_UPDATE_STATUSES.includes(detail.status)
                        ? detail.status
                        : 'in_progress',
                    body: '',
                  });
                  setDrawer('status');
                }}
                submitting={submitting}
                timeline={timeline}
              />
            </section>
          </main>
        </div>
      </div>

      {drawer === 'comment' && detail ? (
        <GovernedActionDrawer
          description="Registre uma atualização interna visível para suporte e membros da área autorizada."
          footer={
            <>
              <GhostButton onClick={() => setDrawer(null)} type="button">
                Cancelar
              </GhostButton>
              <AppButton disabled={submitting} form="internal-action-comment-form" type="submit">
                Registrar update
              </AppButton>
            </>
          }
          onClose={() => setDrawer(null)}
          title="Registrar update interno"
        >
          <form className="space-y-5" id="internal-action-comment-form" onSubmit={handleCommentSubmit}>
            <Field label="Update">
              <TextareaInput
                className="min-h-[220px]"
                minLength={8}
                onChange={(event) => setCommentDraft(event.target.value)}
                required
                value={commentDraft}
              />
            </Field>
          </form>
        </GovernedActionDrawer>
      ) : null}

      {drawer === 'status' && detail ? (
        <GovernedActionDrawer
          description="Atualize o andamento do acionamento. Encerramento final segue com suporte após retorno."
          footer={
            <>
              <GhostButton onClick={() => setDrawer(null)} type="button">
                Cancelar
              </GhostButton>
              <AppButton disabled={submitting} form="internal-action-status-form" type="submit">
                Atualizar andamento
              </AppButton>
            </>
          }
          onClose={() => setDrawer(null)}
          title="Atualizar andamento"
        >
          <form className="space-y-5" id="internal-action-status-form" onSubmit={handleStatusSubmit}>
            <Field label="Status">
              <SelectInput
                onChange={(event) =>
                  setStatusDraft((current) => ({
                    ...current,
                    status: event.target.value as InternalActionStatus,
                  }))
                }
                value={statusDraft.status}
              >
                {AREA_UPDATE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeStatus(status)}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Resumo da mudança">
              <TextareaInput
                className="min-h-[180px]"
                minLength={8}
                onChange={(event) =>
                  setStatusDraft((current) => ({ ...current, body: event.target.value }))
                }
                required
                value={statusDraft.body}
              />
            </Field>
          </form>
        </GovernedActionDrawer>
      ) : null}

      {drawer === 'return' && detail ? (
        <GovernedActionDrawer
          description="Devolva ao suporte com resposta estruturada. O ticket não muda de status automaticamente."
          footer={
            <>
              <GhostButton onClick={() => setDrawer(null)} type="button">
                Cancelar
              </GhostButton>
              <AppButton disabled={submitting} form="internal-action-return-form" type="submit">
                Devolver ao suporte
              </AppButton>
            </>
          }
          onClose={() => setDrawer(null)}
          title="Devolver ao suporte"
        >
          <form className="space-y-5" id="internal-action-return-form" onSubmit={handleReturnSubmit}>
            <Field label="Resposta para o suporte">
              <TextareaInput
                className="min-h-[220px]"
                minLength={8}
                onChange={(event) => setReturnDraft(event.target.value)}
                required
                value={returnDraft}
              />
            </Field>
          </form>
        </GovernedActionDrawer>
      ) : null}
    </>
  );
}
