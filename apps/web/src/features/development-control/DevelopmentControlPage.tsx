import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { formatDateTime } from '../../app/format';
import { EmptyState, ErrorState, LoadingState } from '../../components/states';
import {
  AppButton,
  Field,
  GhostButton,
  InlineNotice,
  PageHeader,
  Panel,
  SelectInput,
  StatusPill,
  TextInput,
  TextareaInput,
  cx,
} from '../../components/ui';
import type {
  InternalBuildTask,
  InternalBuildTaskPriority,
  InternalBuildTaskStatus,
  InternalBuildTaskUpdate,
} from '@genius-support-os/contracts';
import {
  addInternalBuildTaskUpdate,
  claimInternalBuildTask,
  createInternalBuildTask,
  listInternalBuildTaskUpdates,
  listInternalBuildTasks,
  updateInternalBuildTask,
} from './development-control-api';

type Phase = 'loading' | 'ready' | 'error';

const BOARD_COLUMNS: Array<{ status: InternalBuildTaskStatus; label: string }> = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'in_progress', label: 'Em andamento' },
  { status: 'blocked', label: 'Bloqueadas' },
  { status: 'done', label: 'Concluídas' },
  { status: 'cancelled', label: 'Canceladas' },
];

const ALL_STATUSES: InternalBuildTaskStatus[] = [
  'backlog',
  'in_progress',
  'blocked',
  'done',
  'cancelled',
];

function statusLabel(status: InternalBuildTaskStatus) {
  return BOARD_COLUMNS.find((column) => column.status === status)?.label ?? status;
}

function statusTone(status: InternalBuildTaskStatus) {
  if (status === 'done') return 'positive' as const;
  if (status === 'blocked' || status === 'cancelled') return 'warning' as const;
  if (status === 'in_progress') return 'accent' as const;
  return 'default' as const;
}

function priorityLabel(priority: InternalBuildTaskPriority) {
  return priority === 'high' ? 'Alta' : priority === 'low' ? 'Baixa' : 'Normal';
}

function priorityTone(priority: InternalBuildTaskPriority) {
  return priority === 'high' ? 'critical' as const : priority === 'low' ? 'positive' as const : 'warning' as const;
}

function allowedStatuses(current: InternalBuildTaskStatus) {
  if (current === 'backlog') return ['backlog', 'in_progress', 'blocked', 'cancelled'] as InternalBuildTaskStatus[];
  if (current === 'in_progress') return ['in_progress', 'blocked', 'done', 'cancelled'] as InternalBuildTaskStatus[];
  if (current === 'blocked') return ['blocked', 'in_progress', 'cancelled'] as InternalBuildTaskStatus[];
  return [current];
}

function splitDocumentSlugs(value: string) {
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function newTaskDraft() {
  return {
    title: '',
    description: '',
    priority: 'normal' as InternalBuildTaskPriority,
    area: '',
    documents: '',
  };
}

function TaskCard({
  task,
  selected,
  onSelect,
}: {
  task: InternalBuildTask;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={cx(
        'w-full rounded-xl border p-3 text-left transition-colors',
        selected
          ? 'border-[color:var(--minimal-action)] bg-[color:var(--minimal-selection)]'
          : 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] hover:border-[color:var(--minimal-border-strong)]',
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-3 text-sm font-semibold text-[color:var(--minimal-text)]">{task.title}</span>
        <StatusPill tone={priorityTone(task.priority)}>{priorityLabel(task.priority)}</StatusPill>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">{task.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.68rem] text-[color:var(--minimal-text-tertiary)]">
        {task.area ? <span>{task.area}</span> : null}
        {task.assignedToFullName ? <span>· {task.assignedToFullName}</span> : null}
      </div>
    </button>
  );
}

function TaskDetail({
  task,
  updates,
  busy,
  onClaim,
  onUpdate,
  onAddUpdate,
}: {
  task: InternalBuildTask;
  updates: InternalBuildTaskUpdate[];
  busy: boolean;
  onClaim: () => void;
  onUpdate: (payload: {
    status: InternalBuildTaskStatus;
    outcome: string;
    validationSummary: string;
    blockedReason: string;
    relatedDocumentSlugs: string[];
  }) => Promise<void>;
  onAddUpdate: (summary: string, nextStep: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(task.status);
  const [outcome, setOutcome] = useState(task.outcome ?? '');
  const [validationSummary, setValidationSummary] = useState(task.validationSummary ?? '');
  const [blockedReason, setBlockedReason] = useState(task.blockedReason ?? '');
  const [documents, setDocuments] = useState(task.relatedDocumentSlugs.join(', '));
  const [summary, setSummary] = useState('');
  const [nextStep, setNextStep] = useState('');

  useEffect(() => {
    setStatus(task.status);
    setOutcome(task.outcome ?? '');
    setValidationSummary(task.validationSummary ?? '');
    setBlockedReason(task.blockedReason ?? '');
    setDocuments(task.relatedDocumentSlugs.join(', '));
    setSummary('');
    setNextStep('');
  }, [task]);

  async function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onUpdate({
      status,
      outcome,
      validationSummary,
      blockedReason,
      relatedDocumentSlugs: splitDocumentSlugs(documents),
    });
  }

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!summary.trim()) return;
    await onAddUpdate(summary, nextStep);
    setSummary('');
    setNextStep('');
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--minimal-text-tertiary)]">Detalhe da tarefa</p>
          <h2 className="mt-1 text-xl font-semibold text-[color:var(--minimal-text)]">{task.title}</h2>
        </div>
        <StatusPill tone={statusTone(task.status)}>{statusLabel(task.status)}</StatusPill>
      </div>

      <p className="text-sm leading-6 text-[color:var(--minimal-text-secondary)]">{task.description}</p>

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div><span className="text-[color:var(--minimal-text-tertiary)]">Área</span><p className="font-medium text-[color:var(--minimal-text)]">{task.area || 'Não definida'}</p></div>
        <div><span className="text-[color:var(--minimal-text-tertiary)]">Executor</span><p className="font-medium text-[color:var(--minimal-text)]">{task.assignedToFullName || 'Ainda não assumida'}</p></div>
        <div><span className="text-[color:var(--minimal-text-tertiary)]">Criada em</span><p className="font-medium text-[color:var(--minimal-text)]">{formatDateTime(task.createdAt)}</p></div>
        <div><span className="text-[color:var(--minimal-text-tertiary)]">Atualizada em</span><p className="font-medium text-[color:var(--minimal-text)]">{formatDateTime(task.updatedAt)}</p></div>
      </div>

      {task.assignedToUserId ? (
        <InlineNotice tone="default">Esta tarefa está atribuída a {task.assignedToFullName || 'um executor'}. O lock simples evita assumir o mesmo card em paralelo.</InlineNotice>
      ) : (
        <AppButton disabled={busy} onClick={onClaim}>Assumir tarefa</AppButton>
      )}

      <form className="space-y-4 border-t border-[color:var(--minimal-border)] pt-5" onSubmit={(event) => void submitUpdate(event)}>
        <Field label="Status">
          <SelectInput value={status} onChange={(event) => setStatus(event.target.value as InternalBuildTaskStatus)}>
            {allowedStatuses(task.status).map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
          </SelectInput>
        </Field>
        <Field label="Resultado" description="Preencha ao concluir para registrar o que foi entregue.">
          <TextareaInput value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder="O que foi feito?" />
        </Field>
        <Field label="Validação" description="Registre testes, revisão ou evidência usada.">
          <TextareaInput value={validationSummary} onChange={(event) => setValidationSummary(event.target.value)} placeholder="Como foi validado?" />
        </Field>
        {status === 'blocked' ? (
          <Field label="Motivo do bloqueio">
            <TextareaInput value={blockedReason} onChange={(event) => setBlockedReason(event.target.value)} placeholder="O que falta para continuar?" />
          </Field>
        ) : null}
        <Field label="Documentos relacionados" description="Use slugs do Product Docs separados por vírgula.">
          <TextInput value={documents} onChange={(event) => setDocuments(event.target.value)} placeholder="project-state, architecture-rules" />
        </Field>
        <AppButton disabled={busy} type="submit">Salvar atualização</AppButton>
      </form>

      <form className="space-y-4 border-t border-[color:var(--minimal-border)] pt-5" onSubmit={(event) => void submitNote(event)}>
        <div>
          <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Registro rápido</h3>
          <p className="mt-1 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">Use para deixar uma nota curta durante a execução.</p>
        </div>
        <Field label="O que mudou?"><TextareaInput value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Ex.: contrato revisado e teste focado executado." /></Field>
        <Field label="Próximo passo"><TextInput value={nextStep} onChange={(event) => setNextStep(event.target.value)} placeholder="Opcional" /></Field>
        <GhostButton disabled={busy || !summary.trim()} type="submit">Registrar nota</GhostButton>
      </form>

      {task.relatedDocumentSlugs.length > 0 ? (
        <div className="border-t border-[color:var(--minimal-border)] pt-5">
          <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Documentos relacionados</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {task.relatedDocumentSlugs.map((slug) => <Link className="text-sm text-[color:var(--minimal-action)] underline-offset-2 hover:underline" key={slug} to={`/admin/product-docs?doc=${encodeURIComponent(slug)}`}>{slug}</Link>)}
          </div>
        </div>
      ) : null}

      <div className="border-t border-[color:var(--minimal-border)] pt-5">
        <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Histórico curto</h3>
        {updates.length === 0 ? <p className="mt-2 text-sm text-[color:var(--minimal-text-secondary)]">Ainda não há atualizações registradas.</p> : (
          <div className="mt-3 space-y-3">
            {updates.map((update) => (
              <article className="border-l-2 border-[color:var(--minimal-border-strong)] pl-3" key={update.updateId}>
                <p className="text-sm text-[color:var(--minimal-text)]">{update.summary}</p>
                {update.nextStep ? <p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">Próximo: {update.nextStep}</p> : null}
                <p className="mt-1 text-[0.68rem] text-[color:var(--minimal-text-tertiary)]">{update.createdByFullName || 'Executor'} · {formatDateTime(update.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function DevelopmentControlPage() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [tasks, setTasks] = useState<InternalBuildTask[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updates, setUpdates] = useState<InternalBuildTaskUpdate[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState(newTaskDraft());

  const selectedTask = useMemo(() => tasks.find((task) => task.taskId === selectedId) ?? null, [selectedId, tasks]);
  const counts = useMemo(() => Object.fromEntries(BOARD_COLUMNS.map((column) => [column.status, tasks.filter((task) => task.status === column.status).length])), [tasks]);

  async function reload(preferredId = selectedId) {
    const nextTasks = await listInternalBuildTasks();
    setTasks(nextTasks);
    setSelectedId(preferredId && nextTasks.some((task) => task.taskId === preferredId) ? preferredId : nextTasks[0]?.taskId ?? null);
  }

  async function loadUpdates(taskId: string | null) {
    if (!taskId) {
      setUpdates([]);
      return;
    }
    setUpdates(await listInternalBuildTaskUpdates(taskId));
  }

  useEffect(() => {
    void (async () => {
      try {
        await reload(null);
        setPhase('ready');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Não foi possível carregar o painel.');
        setPhase('error');
      }
    })();
  }, []);

  useEffect(() => {
    void loadUpdates(selectedId).catch((error) => setErrorMessage(error instanceof Error ? error.message : 'Não foi possível carregar o histórico.'));
  }, [selectedId]);

  async function runAction(action: () => Promise<string | void>, successMessage: string) {
    setBusy(true);
    setErrorMessage(null);
    setMessage(null);
    try {
      const preferredTaskId = await action();
      await reload(preferredTaskId ?? undefined);
      if (selectedId) await loadUpdates(selectedId);
      setMessage(successMessage);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível concluir a ação.');
    } finally {
      setBusy(false);
    }
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const created = await createInternalBuildTask({
        title: draft.title,
        description: draft.description,
        priority: draft.priority,
        area: draft.area.trim() || null,
        relatedDocumentSlugs: splitDocumentSlugs(draft.documents),
      });
      setDraft(newTaskDraft());
      setShowCreate(false);
      return String(created.id);
    }, 'Tarefa criada no backlog.');
  }

  if (phase === 'loading') return <LoadingState title="Carregando painel" description="Estamos preparando o acompanhamento do desenvolvimento." />;
  if (phase === 'error') return <ErrorState description={errorMessage ?? 'Não foi possível carregar o painel de desenvolvimento.'} />;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="ConfiOne · desenvolvimento"
        title="Painel de desenvolvimento"
        description="Um controle simples do que entrou no backlog, do que está sendo executado e do que já foi validado."
        action={<AppButton onClick={() => setShowCreate((value) => !value)}>{showCreate ? 'Fechar cadastro' : 'Nova tarefa'}</AppButton>}
      />

      {message ? <InlineNotice tone="positive">{message}</InlineNotice> : null}
      {errorMessage ? <InlineNotice tone="critical">{errorMessage}</InlineNotice> : null}

      {showCreate ? (
        <Panel title="Adicionar ao backlog" description="Registre apenas o contexto necessário para começar.">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => void submitCreate(event)}>
            <Field label="Título"><TextInput required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Ex.: Revisar documentação do módulo X" /></Field>
            <Field label="Prioridade"><SelectInput value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as InternalBuildTaskPriority })}><option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option></SelectInput></Field>
            <Field label="Descrição" description="O que precisa ser feito e por quê."><TextareaInput required value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Descreva a demanda em linguagem simples." /></Field>
            <div className="space-y-4"><Field label="Área"><TextInput value={draft.area} onChange={(event) => setDraft({ ...draft, area: event.target.value })} placeholder="Produto, banco, documentação..." /></Field><Field label="Documentos relacionados"><TextInput value={draft.documents} onChange={(event) => setDraft({ ...draft, documents: event.target.value })} placeholder="project-state, product-vision" /></Field></div>
            <div className="flex flex-wrap gap-2 md:col-span-2"><AppButton disabled={busy} type="submit">Criar tarefa</AppButton><GhostButton onClick={() => setShowCreate(false)}>Cancelar</GhostButton></div>
          </form>
        </Panel>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {BOARD_COLUMNS.map((column) => <div className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-3 py-3" key={column.status}><p className="text-xs uppercase tracking-[0.14em] text-[color:var(--minimal-text-tertiary)]">{column.label}</p><p className="mt-2 text-2xl font-semibold text-[color:var(--minimal-text)]">{counts[column.status] ?? 0}</p></div>)}
      </div>

      {tasks.length === 0 ? <Panel title="Ainda não há tarefas" description="Crie a primeira demanda para começar a usar o painel."><EmptyState title="Backlog vazio" description="As tarefas criadas aqui ficam disponíveis para execução e acompanhamento." action={<AppButton onClick={() => setShowCreate(true)}>Criar primeira tarefa</AppButton>} /></Panel> : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
          <Panel title="Quadro" description="Clique em um card para registrar execução, resultado e validação.">
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {BOARD_COLUMNS.filter((column) => column.status !== 'cancelled' || tasks.some((task) => task.status === 'cancelled')).map((column) => (
                <section className="min-h-40 rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-3" key={column.status}>
                  <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">{column.label}</h3><StatusPill tone={statusTone(column.status)}>{counts[column.status] ?? 0}</StatusPill></div>
                  <div className="space-y-2">{tasks.filter((task) => task.status === column.status).map((task) => <TaskCard key={task.taskId} task={task} selected={task.taskId === selectedId} onSelect={() => setSelectedId(task.taskId)} />)}</div>
                </section>
              ))}
            </div>
          </Panel>
          <Panel title="Execução" description="O painel registra o estado do card, sem substituir o trabalho no repositório.">
            {selectedTask ? <TaskDetail task={selectedTask} updates={updates} busy={busy} onClaim={() => void runAction(async () => { await claimInternalBuildTask(selectedTask.taskId); }, 'Tarefa assumida.')} onUpdate={(payload) => runAction(async () => { await updateInternalBuildTask({ taskId: selectedTask.taskId, ...payload }); }, 'Tarefa atualizada.')} onAddUpdate={(summary, nextStep) => runAction(async () => { await addInternalBuildTaskUpdate({ taskId: selectedTask.taskId, summary, nextStep: nextStep.trim() || null }); }, 'Nota registrada.')} /> : <EmptyState title="Selecione uma tarefa" description="Escolha um card no quadro para ver o contexto e atualizar o andamento." />}
          </Panel>
        </div>
      )}
    </div>
  );
}
