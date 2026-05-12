import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatDateTime } from '../../app/format';
import { EmptyState, ErrorState, LoadingState } from '../../components/states';
import {
  AppButton,
  Field,
  GhostButton,
  GovernedActionDrawer,
  InlineNotice,
  SelectInput,
  StatusPill,
  TextareaInput,
  TextInput,
  cx,
} from '../../components/ui';
import {
  ENGINEERING_WORK_ITEM_STATUSES,
  ENGINEERING_WORK_ITEM_TYPES,
  type EngineeringWorkspaceTicketLink,
  type EngineeringWorkspaceUpdate,
  type EngineeringWorkspaceWorkItem,
  type EngineeringWorkItemStatus,
  type EngineeringWorkItemType,
} from '../../contracts/support-contracts';
import { useAuthContext } from '../auth/auth-context';
import { classifyAdminError } from '../admin/admin-errors';
import {
  addEngineeringWorkItemUpdate,
  assignEngineeringWorkItem,
  getEngineeringWorkItemDetail,
  listEngineeringWorkItemTicketLinks,
  listEngineeringWorkItemUpdates,
  listEngineeringWorkItemsQueue,
  returnEngineeringWorkItemToSupport,
  unassignEngineeringWorkItem,
  updateEngineeringWorkItemStatus,
} from './engineering-api';

type Phase = 'loading' | 'ready' | 'contract-unavailable' | 'error';
type EngineeringActionDrawer = 'status' | 'update' | 'return' | null;
type EngineeringQuickFilter =
  | 'all'
  | 'mine'
  | 'unassigned'
  | 'triage'
  | 'returned_to_support'
  | 'waiting_external';

interface WorkItemDetail extends EngineeringWorkspaceWorkItem {
  linkedTickets?: unknown[];
}

interface StatusDraft {
  status: EngineeringWorkItemStatus;
  summary: string;
  nextStep: string;
}

interface UpdateDraft {
  summary: string;
  nextStep: string;
}

function humanizeWorkItemType(type: EngineeringWorkItemType) {
  switch (type) {
    case 'bug':
      return 'Correção';
    case 'improvement':
      return 'Melhoria';
    case 'technical_task':
      return 'Tarefa técnica';
    case 'investigation':
      return 'Investigação';
  }
}

function humanizeEngineeringStatus(status: EngineeringWorkItemStatus) {
  switch (status) {
    case 'triage':
      return 'Triagem';
    case 'accepted':
      return 'Aceito';
    case 'rejected':
      return 'Rejeitado';
    case 'in_progress':
      return 'Em execução';
    case 'waiting_external':
      return 'Aguardando externo';
    case 'returned_to_support':
      return 'Devolvido ao suporte';
    case 'released':
      return 'Liberado';
    case 'cancelled':
      return 'Cancelado';
  }
}

function toneForEngineeringStatus(status: EngineeringWorkItemStatus) {
  if (status === 'released') {
    return 'positive' as const;
  }

  if (status === 'rejected' || status === 'cancelled') {
    return 'critical' as const;
  }

  if (status === 'waiting_external' || status === 'returned_to_support') {
    return 'warning' as const;
  }

  if (status === 'in_progress' || status === 'accepted') {
    return 'accent' as const;
  }

  return 'default' as const;
}

function humanizePriority(priority: string) {
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

function humanizeOperationalText(value: string | null | undefined, fallback = 'Indisponível') {
  if (!value) {
    return fallback;
  }

  return value
    .replace(/\bpayload sensível\b/gi, 'conteúdo sensível')
    .replace(/\bpayload\b/gi, 'conteúdo sensível')
    .replace(/\bendpoint\b/gi, 'serviço de integração');
}

function emptyStatusDraft(currentStatus: EngineeringWorkItemStatus = 'triage'): StatusDraft {
  return {
    status: currentStatus,
    summary: '',
    nextStep: '',
  };
}

function emptyUpdateDraft(): UpdateDraft {
  return {
    summary: '',
    nextStep: '',
  };
}

function WorkItemRow({
  active,
  item,
}: {
  active: boolean;
  item: EngineeringWorkspaceWorkItem;
}) {
  return (
    <Link
      className={cx(
        'grid min-h-[70px] grid-cols-[minmax(190px,1.45fr)_120px_120px_minmax(130px,0.85fr)_110px_126px] items-center gap-3 border-b border-[color:var(--color-border)] px-3 py-2.5 text-left transition last:border-b-0',
        active
          ? 'rounded-[14px] border border-[rgba(48,127,226,0.4)] bg-[rgba(48,127,226,0.07)] shadow-[0_8px_16px_rgba(19,33,79,0.06)]'
          : 'hover:bg-[color:var(--color-surface)]',
      )}
      to={`/engineering/work-items/${item.engineeringWorkItemId}`}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-brand-blue)]">
          {item.engineeringWorkItemId.slice(0, 8)}
        </p>
        <p className="mt-1 line-clamp-1 text-[13px] font-semibold text-[color:var(--color-ink)]">
          {item.title}
        </p>
        <p className="mt-1 line-clamp-1 text-[11px] text-[color:var(--color-muted)]">
          {humanizeOperationalText(item.description)}
        </p>
      </div>
      <StatusPill>{humanizeWorkItemType(item.workItemType)}</StatusPill>
      <StatusPill tone={toneForEngineeringStatus(item.status)}>
        {humanizeEngineeringStatus(item.status)}
      </StatusPill>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-semibold text-[color:var(--color-ink)]">
          {item.tenantName ?? 'Indisponível'}
        </p>
        <p className="text-[10px] text-[color:var(--color-muted)]">Cliente</p>
      </div>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-semibold text-[color:var(--color-ink)]">
          {item.assignedToFullName ?? 'Indisponível'}
        </p>
        <p className="text-[10px] text-[color:var(--color-muted)]">Responsável</p>
      </div>
      <div className="text-right">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink)]">
          {humanizePriority(item.priority)}
        </p>
        <p className="mt-1 text-[10px] text-[color:var(--color-muted)]">
          {formatDateTime(item.updatedAt)}
        </p>
      </div>
    </Link>
  );
}

function EngineeringSummaryStrip({
  triage,
  inProgress,
  waitingExternal,
  returnedToSupport,
  released,
}: {
  triage: number;
  inProgress: number;
  waitingExternal: number;
  returnedToSupport: number;
  released: number;
}) {
  const items = [
    { label: 'Em triagem', value: triage },
    { label: 'Em execução', value: inProgress },
    { label: 'Aguardando externo', value: waitingExternal },
    { label: 'Prontos para retorno', value: returnedToSupport },
    { label: 'Concluídos', value: released },
  ];

  return (
    <div className="grid shrink-0 gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div
          className="flex min-h-[76px] items-center justify-between rounded-[16px] border border-[color:var(--color-border)] bg-white/94 px-3.5 py-3 shadow-[0_8px_16px_rgba(19,33,79,0.04)]"
          key={item.label}
        >
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              {item.label}
            </p>
            <p className="text-[12px] text-[color:var(--color-muted)]">pulso técnico</p>
          </div>
          <span className="text-[1.2rem] font-semibold tracking-[-0.04em] text-[color:var(--color-ink)]">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function WorkItemRail({
  selected,
  links,
  updates,
  submitting,
  onAssignToMe,
  onUnassign,
  onOpenStatus,
  onOpenUpdate,
  onOpenReturn,
}: {
  selected: WorkItemDetail | null;
  links: EngineeringWorkspaceTicketLink[];
  updates: EngineeringWorkspaceUpdate[];
  submitting: boolean;
  onAssignToMe: () => void;
  onUnassign: () => void;
  onOpenStatus: () => void;
  onOpenUpdate: () => void;
  onOpenReturn: () => void;
}) {
  if (!selected) {
    return (
      <EmptyState
        title="Nenhum item técnico selecionado"
        description="Selecione um item técnico para ver contexto, vínculo com suporte e ações disponíveis."
      />
    );
  }

  const originLink = links[0] ?? null;
  const latestUpdate = updates[0] ?? null;

  return (
    <div className="space-y-3">
      <div className="rounded-[22px] border border-[rgba(48,127,226,0.22)] bg-[linear-gradient(180deg,rgba(17,28,66,1),rgba(24,42,97,0.98))] px-4 py-4 text-white">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={toneForEngineeringStatus(selected.status)}>
            {humanizeEngineeringStatus(selected.status)}
          </StatusPill>
          <StatusPill>{humanizeWorkItemType(selected.workItemType)}</StatusPill>
          <StatusPill tone={selected.priority === 'urgent' || selected.priority === 'high' ? 'critical' : 'default'}>
            {humanizePriority(selected.priority)}
          </StatusPill>
        </div>

        <div className="mt-3.5 min-w-0 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62">
            Item selecionado
          </p>
          <h2 className="line-clamp-3 text-[1.18rem] font-semibold tracking-[-0.05em]">
            {selected.title}
          </h2>
          <p className="line-clamp-4 text-[12px] leading-5 text-white/74">
            {humanizeOperationalText(selected.description)}
          </p>
        </div>

        <div className="mt-4 space-y-2 text-[12px] leading-5 text-white/76">
          <p>Cliente: {selected.tenantName ?? 'Indisponível'}</p>
          <p>Responsável: {selected.assignedToFullName ?? 'Indisponível'}</p>
          <p>Atualizado em: {formatDateTime(selected.updatedAt)}</p>
          <p>Tickets vinculados: {selected.linkedTicketsCount}</p>
        </div>
      </div>

      <section className="rounded-[18px] border border-[color:var(--color-border)] bg-white px-4 py-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
          Vínculo com suporte
        </p>
        {originLink ? (
          <Link
            className="mt-3 block rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 transition hover:border-[rgba(48,127,226,0.28)] hover:bg-white"
            to={`/support/tickets/${originLink.ticketId}`}
          >
            <p className="text-sm font-semibold text-[color:var(--color-brand-blue)]">
              Abrir ticket de origem
            </p>
            <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[color:var(--color-muted)]">
              {originLink.ticketTitle}
            </p>
          </Link>
        ) : selected.originTicketId ? (
          <Link
            className="mt-3 block rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 text-sm font-semibold text-[color:var(--color-brand-blue)] transition hover:border-[rgba(48,127,226,0.28)] hover:bg-white"
            to={`/support/tickets/${selected.originTicketId}`}
          >
            Abrir ticket de origem
          </Link>
        ) : (
          <p className="mt-3 text-sm text-[color:var(--color-muted)]">Indisponível</p>
        )}
      </section>

      <section className="rounded-[18px] border border-[color:var(--color-border)] bg-white px-4 py-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
          Última devolutiva
        </p>
        <p className="mt-3 text-sm leading-6 text-[color:var(--color-ink)]">
          {humanizeOperationalText(latestUpdate?.summary ?? selected.lastUpdateSummary)}
        </p>
        <p className="mt-2 text-[12px] leading-5 text-[color:var(--color-muted)]">
          Próximo passo: {humanizeOperationalText(latestUpdate?.nextStep ?? selected.lastUpdateNextStep)}
        </p>
      </section>

      <section className="rounded-[18px] border border-[color:var(--color-border)] bg-white px-4 py-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
          Ações
        </p>
        <div className="mt-3 grid gap-2">
          <AppButton className="min-h-10 w-full" disabled={submitting} onClick={onOpenUpdate}>
            Registrar atualização
          </AppButton>
          <GhostButton className="min-h-10 w-full" disabled={submitting} onClick={onOpenStatus}>
            Alterar status
          </GhostButton>
          <GhostButton className="min-h-10 w-full" disabled={submitting} onClick={onAssignToMe}>
            Assumir para mim
          </GhostButton>
          <GhostButton
            className="min-h-10 w-full"
            disabled={submitting || !selected.assignedToUserId}
            onClick={onUnassign}
          >
            Remover responsável
          </GhostButton>
          <GhostButton className="min-h-10 w-full" disabled={submitting} onClick={onOpenReturn}>
            Retornar ao suporte
          </GhostButton>
        </div>
      </section>
    </div>
  );
}

export function EngineeringWorkspacePage() {
  const { workItemId } = useParams();
  const { user } = useAuthContext();
  const [phase, setPhase] = useState<Phase>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [items, setItems] = useState<EngineeringWorkspaceWorkItem[]>([]);
  const [selected, setSelected] = useState<WorkItemDetail | null>(null);
  const [links, setLinks] = useState<EngineeringWorkspaceTicketLink[]>([]);
  const [updates, setUpdates] = useState<EngineeringWorkspaceUpdate[]>([]);
  const [statusFilter, setStatusFilter] = useState<EngineeringWorkItemStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EngineeringWorkItemType | 'all'>('all');
  const [quickFilter, setQuickFilter] = useState<EngineeringQuickFilter>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusDraft, setStatusDraft] = useState<StatusDraft>(emptyStatusDraft());
  const [updateDraft, setUpdateDraft] = useState<UpdateDraft>(emptyUpdateDraft());
  const [returnDraft, setReturnDraft] = useState<UpdateDraft>(emptyUpdateDraft());
  const [activeActionDrawer, setActiveActionDrawer] = useState<EngineeringActionDrawer>(null);

  const selectedId = workItemId ?? items[0]?.engineeringWorkItemId ?? null;

  async function loadWorkspace() {
    setPhase('loading');
    setMessage(null);

    try {
      const queue = await listEngineeringWorkItemsQueue({
        status: statusFilter,
        workItemType: typeFilter,
      });
      setItems(queue);

      const nextSelectedId = workItemId ?? queue[0]?.engineeringWorkItemId ?? null;
      if (!nextSelectedId) {
        setSelected(null);
        setLinks([]);
        setUpdates([]);
        setPhase('ready');
        return;
      }

      const [detail, linkRows, updateRows] = await Promise.all([
        getEngineeringWorkItemDetail(nextSelectedId),
        listEngineeringWorkItemTicketLinks(nextSelectedId),
        listEngineeringWorkItemUpdates(nextSelectedId),
      ]);

      setSelected(detail);
      setLinks(linkRows);
      setUpdates(updateRows);
      setStatusDraft(emptyStatusDraft(detail?.status ?? 'triage'));
      setPhase('ready');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível carregar o workspace de engenharia agora.',
      );
      setMessage(classified.message);
      setPhase(classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error');
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, [statusFilter, typeFilter, workItemId]);

  const counts = useMemo(() => {
    return {
      total: items.length,
      open: items.filter((item) => !['released', 'rejected', 'cancelled'].includes(item.status))
        .length,
      triage: items.filter((item) => item.status === 'triage').length,
      inProgress: items.filter((item) => item.status === 'in_progress' || item.status === 'accepted')
        .length,
      waitingExternal: items.filter((item) => item.status === 'waiting_external').length,
      waitingSupport: items.filter((item) => item.status === 'returned_to_support').length,
      unassigned: items.filter((item) => !item.assignedToUserId).length,
      mine: user?.id ? items.filter((item) => item.assignedToUserId === user.id).length : null,
      released: items.filter((item) => item.status === 'released').length,
    };
  }, [items, user?.id]);

  const visibleItems = useMemo(() => {
    switch (quickFilter) {
      case 'mine':
        return user?.id ? items.filter((item) => item.assignedToUserId === user.id) : [];
      case 'unassigned':
        return items.filter((item) => !item.assignedToUserId);
      case 'triage':
        return items.filter((item) => item.status === 'triage');
      case 'returned_to_support':
        return items.filter((item) => item.status === 'returned_to_support');
      case 'waiting_external':
        return items.filter((item) => item.status === 'waiting_external');
      case 'all':
      default:
        return items;
    }
  }, [items, quickFilter, user?.id]);

  const quickFilters = [
    {
      key: 'all',
      label: 'Todos',
      helper: 'fila técnica',
      value: counts.total,
      disabled: false,
    },
    {
      key: 'mine',
      label: 'Meus itens',
      helper: 'sob minha responsabilidade',
      value: counts.mine,
      disabled: !user?.id,
    },
    {
      key: 'unassigned',
      label: 'Não atribuídos',
      helper: 'precisam de responsável',
      value: counts.unassigned,
      disabled: false,
    },
    {
      key: 'triage',
      label: 'Em triagem',
      helper: 'a qualificar',
      value: counts.triage,
      disabled: false,
    },
    {
      key: 'returned_to_support',
      label: 'Aguardando suporte',
      helper: 'prontos para retorno',
      value: counts.waitingSupport,
      disabled: false,
    },
    {
      key: 'waiting_external',
      label: 'Aguardando externo',
      helper: 'bloqueio fora do time',
      value: counts.waitingExternal,
      disabled: false,
    },
  ] satisfies Array<{
    key: EngineeringQuickFilter;
    label: string;
    helper: string;
    value: number | null;
    disabled: boolean;
  }>;

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setSubmitting(true);
    setActionMessage(null);

    try {
      await action();
      setActionMessage(successMessage);
      await loadWorkspace();
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível concluir a ação técnica agora.',
      );
      setActionMessage(classified.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleAssignToMe() {
    if (!selected) {
      return;
    }

    void runAction(
      () =>
        assignEngineeringWorkItem({
          engineeringWorkItemId: selected.engineeringWorkItemId,
          tenantId: selected.tenantId,
          assignedToUserId: user?.id ?? null,
        }),
      'Responsável técnico atualizado.',
    );
  }

  function handleUnassign() {
    if (!selected) {
      return;
    }

    void runAction(
      () =>
        unassignEngineeringWorkItem({
          engineeringWorkItemId: selected.engineeringWorkItemId,
          tenantId: selected.tenantId,
        }),
      'Responsável técnico removido.',
    );
  }

  function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      return;
    }

    void runAction(
      () =>
        updateEngineeringWorkItemStatus({
          engineeringWorkItemId: selected.engineeringWorkItemId,
          tenantId: selected.tenantId,
          status: statusDraft.status,
          summary: statusDraft.summary,
          nextStep: statusDraft.nextStep || null,
        }),
      'Status técnico atualizado.',
    );
  }

  function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      return;
    }

    void runAction(
      () =>
        addEngineeringWorkItemUpdate({
          engineeringWorkItemId: selected.engineeringWorkItemId,
          tenantId: selected.tenantId,
          summary: updateDraft.summary,
          nextStep: updateDraft.nextStep || null,
        }),
      'Atualização técnica registrada.',
    );
    setUpdateDraft(emptyUpdateDraft());
  }

  function handleReturnSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      return;
    }

    void runAction(
      () =>
        returnEngineeringWorkItemToSupport({
          engineeringWorkItemId: selected.engineeringWorkItemId,
          tenantId: selected.tenantId,
          summary: returnDraft.summary,
          nextStep: returnDraft.nextStep,
        }),
      'Demanda devolvida ao suporte.',
    );
    setReturnDraft(emptyUpdateDraft());
  }

  if (phase === 'loading') {
    return <LoadingState title="Carregando engenharia" />;
  }

  if (phase === 'contract-unavailable') {
    return (
      <ErrorState
        title="Workspace de engenharia indisponível"
        description={message ?? 'A área de engenharia ainda não está disponível.'}
        action={<GhostButton onClick={() => void loadWorkspace()}>Tentar novamente</GhostButton>}
      />
    );
  }

  if (phase === 'error') {
    return (
      <ErrorState
        description={message ?? 'Não foi possível carregar o workspace de engenharia.'}
        action={<GhostButton onClick={() => void loadWorkspace()}>Tentar novamente</GhostButton>}
      />
    );
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
        <header className="shrink-0 rounded-[22px] border border-[color:var(--color-border)] bg-white/94 px-4 py-3 shadow-[0_10px_22px_rgba(19,33,79,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-[-0.045em] text-[color:var(--color-ink)]">
                Engenharia
              </h1>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                Demandas técnicas vinculadas ao suporte e à operação.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <GhostButton onClick={() => void loadWorkspace()} type="button">
                Recarregar
              </GhostButton>
            </div>
          </div>
        </header>

        <EngineeringSummaryStrip
          inProgress={counts.inProgress}
          released={counts.released}
          returnedToSupport={counts.waitingSupport}
          triage={counts.triage}
          waitingExternal={counts.waitingExternal}
        />

        {actionMessage ? <InlineNotice>{actionMessage}</InlineNotice> : null}

        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)_352px]">
          <aside className="flex min-h-0 flex-col gap-3 overflow-hidden rounded-[22px] border border-[color:var(--color-border)] bg-white/92 p-3 shadow-[0_12px_24px_rgba(19,33,79,0.06)]">
            <section className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
              <h2 className="text-base font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                Triagem técnica
              </h2>
              <p className="mt-1 text-[12px] leading-5 text-[color:var(--color-muted)]">
                Recorte os itens sem tirar a lista do centro da operação.
              </p>
            </section>

            <section className="rounded-[18px] border border-[color:var(--color-border)] bg-white px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                Fila rápida
              </p>
              <div className="mt-2 grid gap-1.5">
                {quickFilters.map((filter) => (
                  <button
                    className={cx(
                      'flex min-h-9 items-center justify-between rounded-[12px] border px-3 py-2 text-left transition',
                      quickFilter === filter.key
                        ? 'border-[rgba(48,127,226,0.28)] bg-[rgba(48,127,226,0.09)] text-[color:var(--color-brand-blue)]'
                        : 'border-[color:var(--color-border)] bg-white text-[color:var(--color-ink)] hover:border-[rgba(48,127,226,0.22)] hover:bg-[color:var(--color-surface)]',
                      filter.disabled ? 'cursor-not-allowed opacity-55 hover:bg-white' : '',
                    )}
                    disabled={filter.disabled}
                    key={filter.key}
                    onClick={() => setQuickFilter(filter.key)}
                    type="button"
                  >
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold">{filter.label}</span>
                      <span className="block truncate text-[10px] text-[color:var(--color-muted)]">
                        {filter.helper}
                      </span>
                    </span>
                    <span className="text-sm font-semibold">{filter.value ?? 'Indisponível'}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="min-h-0 flex-1 overflow-y-auto rounded-[18px] border border-[color:var(--color-border)] bg-white px-3 py-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                  Filtros
                </p>
                <button
                  className="text-[11px] font-semibold text-[color:var(--color-brand-blue)] disabled:text-[color:var(--color-muted)]"
                  disabled={statusFilter === 'all' && typeFilter === 'all' && quickFilter === 'all'}
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setQuickFilter('all');
                  }}
                  type="button"
                >
                  Limpar filtros
                </button>
              </div>
              <div className="grid gap-3">
                <Field label="Status">
                  <SelectInput
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as EngineeringWorkItemStatus | 'all')
                    }
                  >
                    <option value="all">Todos</option>
                    {ENGINEERING_WORK_ITEM_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanizeEngineeringStatus(status)}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Tipo">
                  <SelectInput
                    value={typeFilter}
                    onChange={(event) =>
                      setTypeFilter(event.target.value as EngineeringWorkItemType | 'all')
                    }
                  >
                    <option value="all">Todos</option>
                    {ENGINEERING_WORK_ITEM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {humanizeWorkItemType(type)}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
            </section>
          </aside>

          <main className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[22px] border border-[color:var(--color-border)] bg-white/90 shadow-[0_12px_24px_rgba(19,33,79,0.06)]">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[color:var(--color-border)] px-4 py-3">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                  Itens técnicos
                </h2>
                <p className="mt-0.5 text-[12px] text-[color:var(--color-muted)]">
                  {visibleItems.length} item(ns) no recorte atual
                </p>
              </div>
              <StatusPill>{counts.open} em aberto</StatusPill>
            </div>
            <div className="hidden grid-cols-[minmax(190px,1.45fr)_120px_120px_minmax(130px,0.85fr)_110px_126px] gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)] xl:grid">
              <span>Item</span>
              <span>Tipo</span>
              <span>Status</span>
              <span>Cliente</span>
              <span>Responsável</span>
              <span className="text-right">Prioridade</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {visibleItems.length === 0 ? (
                <EmptyState
                  title="Nenhum item técnico neste recorte"
                  description="Ajuste a fila rápida ou os filtros operacionais para ampliar a visão."
                />
              ) : (
                <div className="grid gap-2 xl:block">
                  {visibleItems.map((item) => (
                    <WorkItemRow
                      active={item.engineeringWorkItemId === selectedId}
                      item={item}
                      key={item.engineeringWorkItemId}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>

          <aside className="min-h-0 overflow-y-auto rounded-[22px] border border-[color:var(--color-border)] bg-white/92 p-3 shadow-[0_12px_24px_rgba(19,33,79,0.06)]">
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                Item selecionado
              </p>
              <h2 className="mt-1 text-base font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                Contexto técnico
              </h2>
            </div>
            <WorkItemRail
              links={links}
              onAssignToMe={handleAssignToMe}
              onOpenReturn={() => setActiveActionDrawer('return')}
              onOpenStatus={() => setActiveActionDrawer('status')}
              onOpenUpdate={() => setActiveActionDrawer('update')}
              onUnassign={handleUnassign}
              selected={selected}
              submitting={submitting}
              updates={updates}
            />
          </aside>
        </div>
      </div>
    {activeActionDrawer === 'status' && selected ? (
      <GovernedActionDrawer
        description="Atualize o andamento técnico com resumo e próximo passo."
        footer={
          <>
            <GhostButton onClick={() => setActiveActionDrawer(null)} type="button">
              Cancelar
            </GhostButton>
            <AppButton disabled={submitting} form="engineering-status-form" type="submit">
              Atualizar status
            </AppButton>
          </>
        }
        onClose={() => setActiveActionDrawer(null)}
        title="Alterar status técnico"
      >
        <form className="space-y-5" id="engineering-status-form" onSubmit={handleStatusSubmit}>
          <section className="rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
            <p className="text-lg font-semibold tracking-[-0.035em] text-[color:var(--color-ink)]">
              {selected.title}
            </p>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">
              {selected.tenantName ?? 'Cliente indisponível'}
            </p>
          </section>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Novo status">
              <SelectInput
                value={statusDraft.status}
                onChange={(event) =>
                  setStatusDraft((current) => ({
                    ...current,
                    status: event.target.value as EngineeringWorkItemStatus,
                  }))
                }
              >
                {ENGINEERING_WORK_ITEM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeEngineeringStatus(status)}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Próximo passo">
              <TextInput
                onChange={(event) =>
                  setStatusDraft((current) => ({
                    ...current,
                    nextStep: event.target.value,
                  }))
                }
                value={statusDraft.nextStep}
              />
            </Field>
          </div>
          <Field label="Resumo">
            <TextareaInput
              className="min-h-[180px]"
              minLength={8}
              onChange={(event) =>
                setStatusDraft((current) => ({
                  ...current,
                  summary: event.target.value,
                }))
              }
              required
              value={statusDraft.summary}
            />
          </Field>
        </form>
      </GovernedActionDrawer>
    ) : null}

    {activeActionDrawer === 'update' && selected ? (
      <GovernedActionDrawer
        description="Registre uma atualização técnica ampla e objetiva."
        footer={
          <>
            <GhostButton onClick={() => setActiveActionDrawer(null)} type="button">
              Cancelar
            </GhostButton>
            <AppButton disabled={submitting} form="engineering-update-form" type="submit">
              Registrar atualização
            </AppButton>
          </>
        }
        onClose={() => setActiveActionDrawer(null)}
        title="Registrar atualização"
      >
        <form className="space-y-5" id="engineering-update-form" onSubmit={handleUpdateSubmit}>
          <Field label="Resumo técnico">
            <TextareaInput
              className="min-h-[220px]"
              minLength={8}
              onChange={(event) =>
                setUpdateDraft((current) => ({
                  ...current,
                  summary: event.target.value,
                }))
              }
              required
              value={updateDraft.summary}
            />
          </Field>
          <Field label="Próximo passo">
            <TextInput
              onChange={(event) =>
                setUpdateDraft((current) => ({
                  ...current,
                  nextStep: event.target.value,
                }))
              }
              value={updateDraft.nextStep}
            />
          </Field>
        </form>
      </GovernedActionDrawer>
    ) : null}

    {activeActionDrawer === 'return' && selected ? (
      <GovernedActionDrawer
        description="Devolva a demanda ao suporte com contexto suficiente para continuidade."
        footer={
          <>
            <GhostButton onClick={() => setActiveActionDrawer(null)} type="button">
              Cancelar
            </GhostButton>
            <AppButton disabled={submitting} form="engineering-return-form" type="submit">
              Devolver ao suporte
            </AppButton>
          </>
        }
        onClose={() => setActiveActionDrawer(null)}
        title="Devolver ao suporte"
      >
        <form className="space-y-5" id="engineering-return-form" onSubmit={handleReturnSubmit}>
          <Field label="Resumo para suporte">
            <TextareaInput
              className="min-h-[220px]"
              minLength={8}
              onChange={(event) =>
                setReturnDraft((current) => ({
                  ...current,
                  summary: event.target.value,
                }))
              }
              required
              value={returnDraft.summary}
            />
          </Field>
          <Field label="Próximo passo para suporte">
            <TextInput
              minLength={4}
              onChange={(event) =>
                setReturnDraft((current) => ({
                  ...current,
                  nextStep: event.target.value,
                }))
              }
              required
              value={returnDraft.nextStep}
            />
          </Field>
        </form>
      </GovernedActionDrawer>
    ) : null}
    </>
  );
}
