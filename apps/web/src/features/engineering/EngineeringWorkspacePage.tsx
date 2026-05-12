import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  type TicketStatus,
  type Uuid,
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

function humanizeTicketStatus(status: TicketStatus) {
  switch (status) {
    case 'new':
      return 'Novo';
    case 'triage':
      return 'Triagem';
    case 'waiting_customer':
      return 'Aguardando cliente';
    case 'waiting_support':
      return 'Aguardando suporte';
    case 'waiting_engineering':
      return 'Aguardando engenharia';
    case 'in_progress':
      return 'Em andamento';
    case 'resolved':
      return 'Resolvido';
    case 'closed':
      return 'Fechado';
    case 'cancelled':
      return 'Cancelado';
  }
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
        'block rounded-[18px] border px-4 py-3 text-left transition',
        active
          ? 'border-[rgba(48,127,226,0.38)] bg-[rgba(48,127,226,0.08)] shadow-[0_12px_24px_rgba(19,33,79,0.08)]'
          : 'border-[color:var(--color-border)] bg-white/86 hover:border-[rgba(48,127,226,0.28)] hover:bg-white',
      )}
      to={`/engineering/work-items/${item.engineeringWorkItemId}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
            {item.title}
          </p>
          <p className="mt-1 truncate text-xs text-[color:var(--color-muted)]">
            {item.tenantName ?? 'Indisponível'} · {humanizeWorkItemType(item.workItemType)}
          </p>
        </div>
        <StatusPill tone={toneForEngineeringStatus(item.status)}>
          {humanizeEngineeringStatus(item.status)}
        </StatusPill>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-muted)]">
        <span>{humanizePriority(item.priority)}</span>
        <span>·</span>
        <span>{item.assignedToFullName ?? 'Sem responsável'}</span>
        <span>·</span>
        <span>{item.linkedTicketsCount} ticket(s)</span>
      </div>
    </Link>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-[color:var(--color-border)] bg-white/88 px-4 py-4">
      <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">{title}</h3>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function EngineeringWorkspacePage() {
  const { workItemId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [phase, setPhase] = useState<Phase>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [items, setItems] = useState<EngineeringWorkspaceWorkItem[]>([]);
  const [selected, setSelected] = useState<WorkItemDetail | null>(null);
  const [links, setLinks] = useState<EngineeringWorkspaceTicketLink[]>([]);
  const [updates, setUpdates] = useState<EngineeringWorkspaceUpdate[]>([]);
  const [statusFilter, setStatusFilter] = useState<EngineeringWorkItemStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EngineeringWorkItemType | 'all'>('all');
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
      waitingSupport: items.filter((item) => item.status === 'returned_to_support').length,
      unassigned: items.filter((item) => !item.assignedToUserId).length,
    };
  }, [items]);

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
        description={message ?? 'O contrato de engenharia ainda não está disponível.'}
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
      <header className="rounded-[22px] border border-[color:var(--color-border)] bg-white/92 px-4 py-3 shadow-[0_14px_28px_rgba(19,33,79,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
              Engenharia
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
              Demandas técnicas vinculadas ao suporte
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill>{counts.total} total</StatusPill>
            <StatusPill tone="accent">{counts.open} abertas</StatusPill>
            <StatusPill tone="warning">{counts.waitingSupport} com retorno</StatusPill>
            <StatusPill>{counts.unassigned} sem responsável</StatusPill>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col rounded-[22px] border border-[color:var(--color-border)] bg-white/92 p-3 shadow-[0_14px_28px_rgba(19,33,79,0.08)]">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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

          <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <EmptyState
                title="Sem demandas técnicas"
                description="Nenhum work item técnico está disponível para a sua conta neste filtro."
              />
            ) : (
              items.map((item) => (
                <WorkItemRow
                  active={item.engineeringWorkItemId === selectedId}
                  item={item}
                  key={item.engineeringWorkItemId}
                />
              ))
            )}
          </div>
        </aside>

        <main className="min-h-0 overflow-y-auto rounded-[22px] border border-[color:var(--color-border)] bg-white/78 p-4 shadow-[0_14px_28px_rgba(19,33,79,0.08)]">
          {!selected ? (
            <EmptyState
              title="Selecione uma demanda"
              description="A fila técnica carregou, mas nenhum item está selecionado para detalhamento."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="min-w-0 space-y-4">
                <div className="rounded-[20px] border border-[color:var(--color-border)] bg-white px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <StatusPill tone={toneForEngineeringStatus(selected.status)}>
                          {humanizeEngineeringStatus(selected.status)}
                        </StatusPill>
                        <StatusPill>{humanizeWorkItemType(selected.workItemType)}</StatusPill>
                        <StatusPill>{humanizePriority(selected.priority)}</StatusPill>
                      </div>
                      <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                        {selected.title}
                      </h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-muted)]">
                        {selected.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <AppButton disabled={submitting} onClick={handleAssignToMe}>
                        Assumir
                      </AppButton>
                      <GhostButton disabled={submitting} onClick={handleUnassign}>
                        Remover responsável
                      </GhostButton>
                    </div>
                  </div>
                  {actionMessage ? (
                    <div className="mt-3">
                      <InlineNotice>{actionMessage}</InlineNotice>
                    </div>
                  ) : null}
                </div>

                <DetailSection title="Tickets vinculados">
                  {links.length === 0 ? (
                    <p className="text-sm text-[color:var(--color-muted)]">
                      Nenhum ticket vinculado foi retornado pelo contrato.
                    </p>
                  ) : (
                    links.map((link) => (
                      <Link
                        className="block rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 transition hover:border-[rgba(48,127,226,0.32)] hover:bg-white"
                        key={link.engineeringTicketLinkId}
                        to={`/support/tickets/${link.ticketId}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                            {link.ticketTitle}
                          </p>
                          <StatusPill>{humanizeTicketStatus(link.ticketStatus)}</StatusPill>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[color:var(--color-muted)]">
                          {link.handoffNote ?? 'Sem nota de handoff registrada.'}
                        </p>
                      </Link>
                    ))
                  )}
                </DetailSection>

                <DetailSection title="Atualizações técnicas">
                  {updates.length === 0 ? (
                    <p className="text-sm text-[color:var(--color-muted)]">
                      Nenhuma atualização técnica estruturada foi registrada ainda.
                    </p>
                  ) : (
                    updates.map((update) => (
                      <article
                        className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3"
                        key={update.engineeringWorkItemUpdateId}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <StatusPill
                            tone={
                              update.updateKind === 'support_return'
                                ? 'warning'
                                : update.updateKind === 'status_update'
                                  ? 'accent'
                                  : 'default'
                            }
                          >
                            {update.updateKind === 'support_return'
                              ? 'Retorno ao suporte'
                              : update.updateKind === 'status_update'
                                ? 'Status'
                                : 'Atualização'}
                          </StatusPill>
                          <span className="text-xs text-[color:var(--color-muted)]">
                            {formatDateTime(update.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--color-ink)]">
                          {update.summary}
                        </p>
                        {update.nextStep ? (
                          <p className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">
                            Próximo passo: {update.nextStep}
                          </p>
                        ) : null}
                      </article>
                    ))
                  )}
                </DetailSection>
              </section>

              <aside className="min-w-0 space-y-4">
                <DetailSection title="Contexto">
                  <div className="grid gap-2 text-sm text-[color:var(--color-muted)]">
                    <p>Cliente: {selected.tenantName ?? 'Indisponível'}</p>
                    <p>Responsável: {selected.assignedToFullName ?? 'Indisponível'}</p>
                    <p>Criado por: {selected.createdByFullName ?? 'Indisponível'}</p>
                    <p>Atualizado em: {formatDateTime(selected.updatedAt)}</p>
                    {selected.originTicketId ? (
                      <button
                        className="mt-1 text-left text-sm font-semibold text-[color:var(--color-brand-blue)]"
                        onClick={() => navigate(`/support/tickets/${selected.originTicketId}`)}
                        type="button"
                      >
                        Abrir ticket de origem
                      </button>
                    ) : null}
                  </div>
                </DetailSection>

                <DetailSection title="Alterar status">
                  <div className="space-y-3">
                    <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                      Status, resumo e próximo passo usam painel dedicado para manter a demanda legível.
                    </p>
                    <AppButton
                      className="min-h-10 w-full"
                      disabled={submitting}
                      onClick={() => setActiveActionDrawer('status')}
                      type="button"
                    >
                      Atualizar status
                    </AppButton>
                  </div>
                </DetailSection>

                <DetailSection title="Registrar atualização">
                  <div className="space-y-3">
                    <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                      Registre update técnico com área ampla para texto e próximos passos.
                    </p>
                    <GhostButton
                      className="min-h-10 w-full"
                      disabled={submitting}
                      onClick={() => setActiveActionDrawer('update')}
                      type="button"
                    >
                      Registrar update
                    </GhostButton>
                  </div>
                </DetailSection>

                <DetailSection title="Devolver ao suporte">
                  <div className="space-y-3">
                    <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                      A devolução exige resumo e próximo passo em superfície operacional própria.
                    </p>
                    <AppButton
                      className="min-h-10 w-full"
                      disabled={submitting}
                      onClick={() => setActiveActionDrawer('return')}
                      type="button"
                    >
                      Devolver ao suporte
                    </AppButton>
                  </div>
                </DetailSection>
              </aside>
            </div>
          )}
        </main>
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
              Registrar update
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
