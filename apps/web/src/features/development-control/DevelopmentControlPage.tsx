import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { formatDateTime } from '../../app/format';
import { EmptyState, ErrorState, LoadingState } from '../../components/states';
import type { AdminInternalDocumentDetailRow } from '../../contracts/admin-contracts';
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
import { ProductDocReaderPanel } from '../product-docs/ProductDocReaderPanel';
import { getInternalDocumentDetailBySlug } from '../product-docs/product-docs-api';
import {
  addInternalBuildTaskUpdate,
  claimInternalBuildTask,
  createInternalBuildTask,
  editInternalBuildTask,
  listInternalBuildTaskUpdates,
  listInternalBuildTasks,
  updateInternalBuildTask,
} from './development-control-api';

type Phase = 'loading' | 'ready' | 'error';

const BOARD_COLUMNS: Array<{ status: InternalBuildTaskStatus; label: string }> = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'awaiting_agent', label: 'Aguardando agente' },
  { status: 'in_progress', label: 'Em andamento' },
  { status: 'blocked', label: 'Bloqueadas' },
  { status: 'done', label: 'Concluídas' },
  { status: 'cancelled', label: 'Canceladas' },
];

function statusLabel(status: InternalBuildTaskStatus) {
  return BOARD_COLUMNS.find((column) => column.status === status)?.label ?? status;
}

function statusTone(status: InternalBuildTaskStatus) {
  if (status === 'done') return 'positive' as const;
  if (status === 'blocked' || status === 'cancelled') return 'warning' as const;
  if (status === 'in_progress' || status === 'awaiting_agent') return 'accent' as const;
  return 'default' as const;
}

function priorityLabel(priority: InternalBuildTaskPriority) {
  return priority === 'high' ? 'Alta' : priority === 'low' ? 'Baixa' : 'Normal';
}

function priorityTone(priority: InternalBuildTaskPriority) {
  return priority === 'high' ? 'critical' as const : priority === 'low' ? 'positive' as const : 'warning' as const;
}

function allowedStatuses(current: InternalBuildTaskStatus) {
  if (current === 'backlog') return ['backlog', 'awaiting_agent', 'blocked', 'cancelled'] as InternalBuildTaskStatus[];
  if (current === 'awaiting_agent') return ['awaiting_agent', 'in_progress', 'blocked', 'cancelled'] as InternalBuildTaskStatus[];
  if (current === 'in_progress') return ['in_progress', 'blocked', 'done', 'cancelled'] as InternalBuildTaskStatus[];
  if (current === 'blocked') return ['blocked', 'awaiting_agent', 'cancelled'] as InternalBuildTaskStatus[];
  return [current];
}

function splitDocumentSlugs(value: string) {
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
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
        'gso-development-task-card w-full rounded-xl border p-3 text-left transition-colors',
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

function TaskEditor({
  mode,
  task,
  busy,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit';
  task?: InternalBuildTask | null;
  busy: boolean;
  onSubmit: (payload: {
    title: string;
    description: string;
    priority: InternalBuildTaskPriority;
    area: string | null;
    relatedDocumentSlugs: string[];
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<InternalBuildTaskPriority>(task?.priority ?? 'normal');
  const [area, setArea] = useState(task?.area ?? '');
  const [documents, setDocuments] = useState(task?.relatedDocumentSlugs.join(', ') ?? '');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      title,
      description,
      priority,
      area: area.trim() || null,
      relatedDocumentSlugs: splitDocumentSlugs(documents),
    });
  }

  return (
    <form className="gso-development-editor space-y-4" onSubmit={(event) => void submit(event)}>
      <div className="gso-development-editor__intro">
        <p className="gso-development-inspector__eyebrow">{mode === 'create' ? 'NEW TASK / BACKLOG' : 'TASK EDITOR / METADATA'}</p>
        <h3>{mode === 'create' ? 'Adicionar ao backlog' : 'Editar tarefa'}</h3>
        <p>{mode === 'create' ? 'Registre o contexto necessário para começar.' : 'Ajuste o texto e os vínculos do card. O histórico de execução permanece preservado.'}</p>
      </div>
      <Field label="Título"><TextInput required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Revisar documentação do módulo X" /></Field>
      <Field label="Descrição" description="O que precisa ser feito e por quê."><TextareaInput required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descreva a demanda em linguagem simples." /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prioridade"><SelectInput value={priority} onChange={(event) => setPriority(event.target.value as InternalBuildTaskPriority)}><option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option></SelectInput></Field>
        <Field label="Área"><TextInput value={area} onChange={(event) => setArea(event.target.value)} placeholder="Produto, banco, documentação..." /></Field>
      </div>
      <Field label="Documentos relacionados" description="Use slugs do Product Docs separados por vírgula."><TextInput value={documents} onChange={(event) => setDocuments(event.target.value)} placeholder="project-state, product-vision" /></Field>
      <div className="flex flex-wrap gap-2 border-t border-[color:var(--minimal-border)] pt-4">
        <AppButton disabled={busy} type="submit">{mode === 'create' ? 'Criar tarefa' : 'Salvar edição'}</AppButton>
        <GhostButton disabled={busy} onClick={onCancel} type="button">Cancelar</GhostButton>
      </div>
    </form>
  );
}

function TaskDetail({
  task,
  updates,
  busy,
  onClaim,
  onEdit,
  onUpdate,
  onAddUpdate,
}: {
  task: InternalBuildTask;
  updates: InternalBuildTaskUpdate[];
  busy: boolean;
  onClaim: () => void;
  onEdit: () => void;
  onUpdate: (payload: {
    status: InternalBuildTaskStatus;
    outcome: string;
    validationSummary: string;
    blockedReason: string;
    relatedDocumentSlugs: string[];
  }) => void | Promise<void>;
  onAddUpdate: (summary: string, nextStep: string) => void | Promise<void>;
}) {
  const [status, setStatus] = useState(task.status);
  const [outcome, setOutcome] = useState(task.outcome ?? '');
  const [validationSummary, setValidationSummary] = useState(task.validationSummary ?? '');
  const [blockedReason, setBlockedReason] = useState(task.blockedReason ?? '');
  const [documents, setDocuments] = useState(task.relatedDocumentSlugs.join(', '));
  const [selectedDocumentSlug, setSelectedDocumentSlug] = useState<string | null>(task.relatedDocumentSlugs[0] ?? null);
  const [selectedDocument, setSelectedDocument] = useState<AdminInternalDocumentDetailRow | null>(null);
  const [documentPhase, setDocumentPhase] = useState<'idle' | 'loading' | 'ready' | 'error' | 'unavailable'>('idle');
  const [documentMessage, setDocumentMessage] = useState('');
  const [summary, setSummary] = useState('');
  const [nextStep, setNextStep] = useState('');

  useEffect(() => {
    setStatus(task.status);
    setOutcome(task.outcome ?? '');
    setValidationSummary(task.validationSummary ?? '');
    setBlockedReason(task.blockedReason ?? '');
    setDocuments(task.relatedDocumentSlugs.join(', '));
    setSelectedDocumentSlug(task.relatedDocumentSlugs[0] ?? null);
    setSelectedDocument(null);
    setDocumentPhase('idle');
    setDocumentMessage('');
    setSummary('');
    setNextStep('');
  }, [task]);

  useEffect(() => {
    if (!selectedDocumentSlug) {
      setSelectedDocument(null);
      setDocumentPhase('idle');
      return;
    }

    let cancelled = false;
    setDocumentPhase('loading');
    setDocumentMessage('');

    void getInternalDocumentDetailBySlug(selectedDocumentSlug, 'product-docs')
      .then((document) => {
        if (cancelled) return;
        if (!document) {
          setSelectedDocument(null);
          setDocumentPhase('unavailable');
          setDocumentMessage('Documento indisponível ou sem permissão.');
          return;
        }
        setSelectedDocument(document);
        setDocumentPhase('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        setSelectedDocument(null);
        setDocumentPhase('error');
        setDocumentMessage(error instanceof Error ? error.message : 'Não foi possível abrir o documento oficial.');
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDocumentSlug]);

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
        <div className="flex items-center gap-2">
          <StatusPill tone={statusTone(task.status)}>{statusLabel(task.status)}</StatusPill>
          <GhostButton onClick={onEdit}>Editar</GhostButton>
        </div>
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
      ) : task.status === 'awaiting_agent' ? (
        <AppButton disabled={busy} onClick={onClaim}>Assumir tarefa</AppButton>
      ) : (
        <InlineNotice tone="default">Mova o card para “Aguardando agente” quando quiser entregá-lo para execução.</InlineNotice>
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

      <div id="fontes-do-cockpit" className="gso-development-task-documents border-t border-[color:var(--minimal-border)] pt-5">
        {task.relatedDocumentSlugs.length > 0 ? (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Documentos relacionados</h3>
                <p className="mt-1 text-xs text-[color:var(--minimal-text-tertiary)]">Resumo e leitura sanitizada vindos da fonte oficial.</p>
              </div>
              {selectedDocument ? <Link className="text-xs text-[color:var(--minimal-action)] underline-offset-2 hover:underline" target="_blank" to={`/admin/product-docs?surface=development&doc=${encodeURIComponent(selectedDocument.slug)}`}>Abrir fonte oficial ↗</Link> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2" role="list" aria-label="Documentos relacionados à tarefa">
              {task.relatedDocumentSlugs.map((slug) => (
                <button
                  aria-pressed={selectedDocumentSlug === slug}
                  className={cx(
                    'max-w-full truncate rounded border px-2 py-1 text-left text-[0.68rem] transition-colors',
                    selectedDocumentSlug === slug
                      ? 'border-[color:var(--cockpit-red)] bg-[color:var(--cockpit-red-soft)] text-[color:var(--minimal-text)]'
                      : 'border-[color:var(--minimal-border)] text-[color:var(--minimal-text-secondary)] hover:border-[color:var(--minimal-border-strong)]',
                  )}
                  key={slug}
                  onClick={() => setSelectedDocumentSlug(slug)}
                  title={slug}
                  type="button"
                >
                  {slug}
                </button>
              ))}
            </div>
            {documentPhase === 'loading' ? <p className="mt-3 text-xs text-[color:var(--minimal-text-tertiary)]">Carregando documento oficial…</p> : null}
            {documentPhase === 'error' || documentPhase === 'unavailable' ? <p className="mt-3 text-xs text-[color:var(--cockpit-red)]">{documentMessage}</p> : null}
            {selectedDocument ? (
              <div className="mt-3 space-y-2">
                <div className="gso-development-document-summary rounded border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-3 py-2">
                  <p className="text-xs font-semibold text-[color:var(--minimal-text)]">{selectedDocument.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">{selectedDocument.description || 'Documento interno oficial controlado.'}</p>
                </div>
                <ProductDocReaderPanel
                  className="gso-development-document-reader"
                  document={selectedDocument}
                  showOfficialLink={false}
                />
              </div>
            ) : null}
          </div>
        ) : <p className="text-xs text-[color:var(--minimal-text-tertiary)]">Nenhum documento relacionado neste card.</p>}
      </div>

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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inspectorMode, setInspectorMode] = useState<'detail' | 'create' | 'edit' | null>(null);
  const inspectorCloseButtonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!inspectorMode) return undefined;

    inspectorCloseButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setInspectorMode(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inspectorMode]);

  async function runAction(action: () => Promise<string | void>, successMessage: string) {
    setBusy(true);
    setErrorMessage(null);
    setMessage(null);
    try {
      const preferredTaskId = await action();
      await reload(preferredTaskId ?? undefined);
      if (selectedId) await loadUpdates(selectedId);
      setMessage(successMessage);
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível concluir a ação.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitTaskEditor(payload: {
    title: string;
    description: string;
    priority: InternalBuildTaskPriority;
    area: string | null;
    relatedDocumentSlugs: string[];
  }) {
    const succeeded = await runAction(async () => {
      if (inspectorMode === 'edit' && selectedTask) {
        await editInternalBuildTask({ taskId: selectedTask.taskId, ...payload });
        return selectedTask.taskId;
      }

      const created = await createInternalBuildTask(payload);
      return String(created.id);
    }, inspectorMode === 'edit' ? 'Tarefa editada.' : 'Tarefa criada no backlog.');

    if (succeeded) setInspectorMode(null);
  }

  if (phase === 'loading') return <LoadingState title="Carregando painel" description="Estamos preparando o acompanhamento do desenvolvimento." />;
  if (phase === 'error') return <ErrorState description={errorMessage ?? 'Não foi possível carregar o painel de desenvolvimento.'} />;

  const visibleBoardColumns = BOARD_COLUMNS.filter((column) => column.status !== 'cancelled' || tasks.some((task) => task.status === 'cancelled'));

  return (
    <div className="gso-development-cockpit mx-auto w-full max-w-[1680px] space-y-4 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <PageHeader
        eyebrow="ConfiOne · desenvolvimento"
        title="Painel de desenvolvimento"
        description="Um controle simples do que entrou no backlog, do que está sendo executado e do que já foi validado."
        action={<AppButton onClick={() => setInspectorMode('create')}>Nova tarefa</AppButton>}
      />

      {message ? <InlineNotice tone="positive">{message}</InlineNotice> : null}
      {errorMessage ? <InlineNotice tone="critical">{errorMessage}</InlineNotice> : null}

      <div aria-label="Resumo operacional do fluxo" className="gso-development-metrics">
        <span className="gso-development-metrics__lead">FLUXO / {tasks.length} CARDS</span>
        {BOARD_COLUMNS.map((column) => <span className="gso-development-metric" key={column.status}><span>{column.label}</span><strong>{counts[column.status] ?? 0}</strong></span>)}
        <span className="gso-development-metrics__hint">Selecione um card para inspecionar</span>
      </div>

      {tasks.length === 0 ? <Panel title="Ainda não há tarefas" description="Crie a primeira demanda para começar a usar o painel."><EmptyState title="Backlog vazio" description="As tarefas criadas aqui ficam disponíveis para execução e acompanhamento." action={<AppButton onClick={() => setInspectorMode('create')}>Criar primeira tarefa</AppButton>} /></Panel> : (
        <div className="gso-development-workspace">
          <section className="gso-development-board-stage" id="quadro-desenvolvimento">
            <Panel title="Quadro" description="Leia o fluxo da esquerda para a direita. Selecione um card para abrir o inspetor lateral.">
              <div className="gso-development-board-rail" role="region" aria-label="Quadro Kanban de desenvolvimento" tabIndex={0}>
                <div className={cx('gso-development-board-grid', visibleBoardColumns.length === 6 && 'gso-development-board-grid--six')}>
                  {visibleBoardColumns.map((column) => (
                    <section className="gso-development-board-column min-h-40 rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-3" key={column.status}>
                      <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">{column.label}</h3><StatusPill tone={statusTone(column.status)}>{counts[column.status] ?? 0}</StatusPill></div>
                        <div className="space-y-2">{tasks.filter((task) => task.status === column.status).map((task) => <TaskCard key={task.taskId} task={task} selected={task.taskId === selectedId} onSelect={() => { setSelectedId(task.taskId); setInspectorMode('detail'); }} />)}</div>
                    </section>
                  ))}
                </div>
              </div>
            </Panel>
          </section>

        </div>
      )}

      {inspectorMode ? (
        <div className="gso-development-inspector-layer">
          <button aria-label="Fechar inspetor da tarefa" className="gso-development-inspector-scrim" onClick={() => setInspectorMode(null)} type="button" />
          <aside aria-label="Inspetor de execução" aria-modal="true" className="gso-development-inspector" role="dialog">
            <header className="gso-development-inspector__header">
              <div className="min-w-0">
                <p className="gso-development-inspector__eyebrow">{inspectorMode === 'detail' ? 'TASK INSPECTOR / EXECUTION' : inspectorMode === 'edit' ? 'TASK EDITOR / METADATA' : 'NEW TASK / BACKLOG'}</p>
                <h2 className="truncate">{inspectorMode === 'create' ? 'Nova tarefa' : inspectorMode === 'edit' ? 'Editar tarefa' : selectedTask?.title ?? 'Tarefa selecionada'}</h2>
              </div>
              <button aria-label="Fechar inspetor da tarefa" className="gso-development-inspector__close" onClick={() => setInspectorMode(null)} ref={inspectorCloseButtonRef} type="button">×</button>
            </header>
            <div className="gso-development-inspector__body">
              {inspectorMode === 'create' ? <TaskEditor key="create" busy={busy} mode="create" onCancel={() => setInspectorMode(null)} onSubmit={submitTaskEditor} /> : inspectorMode === 'edit' && selectedTask ? <TaskEditor key={`edit-${selectedTask.taskId}`} busy={busy} mode="edit" onCancel={() => setInspectorMode('detail')} onSubmit={submitTaskEditor} task={selectedTask} /> : selectedTask ? <TaskDetail key={`detail-${selectedTask.taskId}`} task={selectedTask} updates={updates} busy={busy} onClaim={() => void runAction(async () => { await claimInternalBuildTask(selectedTask.taskId); }, 'Tarefa assumida.')} onEdit={() => setInspectorMode('edit')} onUpdate={(payload) => void runAction(async () => { await updateInternalBuildTask({ taskId: selectedTask.taskId, ...payload }); }, 'Tarefa atualizada.')} onAddUpdate={(summary, nextStep) => void runAction(async () => { await addInternalBuildTaskUpdate({ taskId: selectedTask.taskId, summary, nextStep: nextStep.trim() || null }); }, 'Nota registrada.')} /> : <EmptyState title="Selecione uma tarefa" description="Escolha um card no quadro para abrir o contexto e atualizar o andamento." />}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
