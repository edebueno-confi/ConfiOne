import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MinimalState } from '../../components/minimal-states';
import { MinimalTextInput } from '../../components/minimal-ui';
import { FilterTabs } from '../../components/FilterTabs';
import { cx } from '../../components/ui';
import { useAuthContext } from '../auth/auth-context';
import {
  acceptInternalActionReturn,
  assignTicketTo,
  closeInternalAction,
  createInternalAction,
  listConversation,
  listConversationTypeOptions,
  listInboxItems,
  listInternalActionTargetAreas,
  listQuickReplyOptions,
  listTicketInternalActions,
  saveInternalNote,
  sendPublicReply,
  setTicketConversationType,
  updateTicketPriority,
  updateTicketStatus,
  type ConversationEntry,
  type ConversationTypeOption,
  type InboxItem,
  type InternalActionTargetAreaOption,
  type QuickReplyOption,
  type TicketInternalAction,
} from './inbox-api';

type ViewId = 'todas' | 'nao_atribuidas' | 'aguardando_suporte' | 'aguardando_cliente' | 'urgentes';

const VIEWS: ReadonlyArray<{ id: ViewId; label: string }> = [
  { id: 'todas', label: 'Todas' },
  { id: 'nao_atribuidas', label: 'Não atribuídas' },
  { id: 'aguardando_suporte', label: 'Aguardando suporte' },
  { id: 'aguardando_cliente', label: 'Aguardando cliente' },
  { id: 'urgentes', label: 'Urgentes' },
];

const STATUS_LABELS: Record<string, string> = {
  new: 'Novo',
  triage: 'Triagem',
  in_progress: 'Em andamento',
  waiting_customer: 'Aguardando cliente',
  waiting_support: 'Aguardando suporte',
  waiting_engineering: 'Aguardando engenharia',
  resolved: 'Resolvido',
  closed: 'Fechado',
  cancelled: 'Cancelado',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

const INTERNAL_ACTION_STATUS_LABELS: Record<string, string> = {
  open: 'Aberto',
  assigned: 'Atribuído',
  in_progress: 'Em andamento',
  waiting_support: 'Com o suporte',
  waiting_external: 'Aguardando externo',
  returned_to_support: 'Devolvido ao suporte',
  follow_up_requested: 'Complemento solicitado',
  closed: 'Concluído',
  cancelled: 'Cancelado',
};

const INTERNAL_ACTION_SUPPORT_TYPE_LABELS: Record<string, string> = {
  analysis: 'Análise',
  execution: 'Execução',
  approval: 'Aprovação',
  information_request: 'Pedido de informação',
  external_follow_up: 'Acompanhamento externo',
  technical_investigation: 'Investigação técnica',
};

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

function toneForStatus(status: string): Tone {
  if (status === 'resolved') return 'success';
  if (status === 'closed' || status === 'cancelled') return 'neutral';
  if (status.startsWith('waiting')) return 'warning';
  return 'info';
}

function toneForPriority(priority: string): Tone {
  if (priority === 'urgent') return 'danger';
  if (priority === 'high') return 'warning';
  if (priority === 'normal') return 'info';
  return 'neutral';
}

function toneForInternalActionStatus(status: string): Tone {
  if (status === 'closed') return 'success';
  if (status === 'cancelled') return 'neutral';
  if (status === 'returned_to_support') return 'danger';
  if (status === 'waiting_support' || status === 'follow_up_requested') return 'warning';
  return 'info';
}

function Pill({ tone, children }: { tone: Tone; children: string }) {
  const tones: Record<Tone, string> = {
    neutral: 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text-secondary)]',
    info: 'border-[color:var(--color-info-border)] bg-[color:var(--color-info-surface)] text-[color:var(--color-info-text)]',
    success: 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-text)]',
    warning: 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-text)]',
    danger: 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] text-[color:var(--color-danger-text)]',
  };
  return (
    <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', tones[tone])}>
      {children}
    </span>
  );
}

function formatWhen(value: string | null) {
  if (!value) return 'Indisponível';
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
  }
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function matchesView(item: InboxItem, view: ViewId) {
  if (view === 'nao_atribuidas') return item.isUnassigned;
  if (view === 'aguardando_suporte') return item.isWaitingSupport;
  if (view === 'aguardando_cliente') return item.isWaitingCustomer;
  if (view === 'urgentes') return item.priority === 'urgent' || item.severity === 'critical';
  return true;
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR');
}

type ListState = { phase: 'loading' } | { phase: 'ready'; items: InboxItem[] } | { phase: 'error' };
type ThreadState = { phase: 'loading' } | { phase: 'ready'; entries: ConversationEntry[] } | { phase: 'error' };

function ConversationBubble({ entry }: { entry: ConversationEntry }) {
  if (entry.kind === 'system_event') {
    return (
      <div className="self-center rounded-full border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-3 py-1 text-[11px] text-[color:var(--minimal-text-tertiary)]">
        Atualização do sistema · {formatWhen(entry.occurredAt)}
      </div>
    );
  }

  if (entry.kind === 'internal_note') {
    return (
      <div className="self-stretch rounded-xl border border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] px-3.5 py-2.5">
        <p className="text-[11px] font-medium text-[color:var(--color-warning-text)]">
          Nota interna · {entry.actorName ?? 'Equipe'} · {formatWhen(entry.occurredAt)} · não visível ao cliente
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--color-warning-text)]">{entry.body}</p>
      </div>
    );
  }

  if (entry.kind === 'customer_message') {
    return (
      <div className="max-w-[82%] self-start rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3.5 py-2.5">
        <p className="text-[11px] text-[color:var(--minimal-text-tertiary)]">
          {entry.actorName ?? 'Cliente'} · cliente · {formatWhen(entry.occurredAt)}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--minimal-text)]">{entry.body}</p>
      </div>
    );
  }

  return (
    <div className="max-w-[82%] self-end rounded-xl border border-[color:var(--color-info-border)] bg-[color:var(--color-info-surface)] px-3.5 py-2.5">
      <p className="text-[11px] text-[color:var(--color-info-text)]">
        {entry.actorName ?? 'Equipe'} · resposta pública · {formatWhen(entry.occurredAt)}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--color-info-text)]">{entry.body}</p>
    </div>
  );
}

function ConversationPane({ item, onChanged }: { item: InboxItem; onChanged: () => void }) {
  const { user } = useAuthContext();
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function runAction(action: () => Promise<void>, friendlyError: string) {
    setActionBusy(true);
    setActionError(null);
    try {
      await action();
      onChanged();
    } catch {
      setActionError(friendlyError);
    } finally {
      setActionBusy(false);
    }
  }

  const [thread, setThread] = useState<ThreadState>({ phase: 'loading' });
  const [mode, setMode] = useState<'public' | 'internal'>('public');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<QuickReplyOption[]>([]);
  const [typeOptions, setTypeOptions] = useState<ConversationTypeOption[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    listConversationTypeOptions()
      .then((options) => {
        if (!cancelled) setTypeOptions(options);
      })
      .catch(() => {
        if (!cancelled) setTypeOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listQuickReplyOptions()
      .then((options) => {
        if (!cancelled) setQuickReplies(options);
      })
      .catch(() => {
        if (!cancelled) setQuickReplies([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadThread = useCallback(async () => {
    setThread({ phase: 'loading' });
    try {
      const entries = await listConversation(item.id);
      setThread({ phase: 'ready', entries });
    } catch {
      setThread({ phase: 'error' });
    }
  }, [item.id]);

  useEffect(() => {
    void loadThread();
    setDraft('');
    setSendError(null);
    setMode('public');
  }, [loadThread]);

  useEffect(() => {
    if (thread.phase === 'ready' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread]);

  async function handleSend() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setSendError(null);
    try {
      if (mode === 'public') {
        await sendPublicReply(item.id, body);
      } else {
        await saveInternalNote(item.id, body);
      }
      setDraft('');
      await loadThread();
    } catch {
      setSendError(
        mode === 'public'
          ? 'Não foi possível enviar a resposta agora. Tente novamente.'
          : 'Não foi possível salvar a nota agora. Tente novamente.',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="flex min-h-0 flex-col bg-[color:var(--minimal-canvas)]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-5 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-[color:var(--minimal-text)]">{item.title}</h2>
          <p className="truncate text-xs text-[color:var(--minimal-text-secondary)]">
            {item.tenantDisplayName ?? 'Cliente indisponível'}
            {item.assignedToFullName ? ` · ${item.assignedToFullName}` : ' · sem responsável'}
            {item.isSlaAvailable ? ` · ${item.slaStatusLabel}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Pill tone={toneForStatus(item.status)}>{STATUS_LABELS[item.status] ?? item.status}</Pill>
          <Pill tone={toneForPriority(item.priority)}>{PRIORITY_LABELS[item.priority] ?? item.priority}</Pill>
          <Link
            className="ml-1 rounded-lg border border-[color:var(--minimal-border)] px-2.5 py-1 text-xs font-medium text-[color:var(--minimal-text-secondary)] hover:text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
            title="Abrir tratativa completa (status, anexos, acionamentos)"
            to={`/support/tickets/${item.id}`}
          >
            Mais ações
          </Link>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-5 py-2">
        <button
          className="rounded-lg border border-[color:var(--minimal-border)] px-2.5 py-1 text-xs font-medium text-[color:var(--minimal-text-secondary)] hover:text-[color:var(--minimal-text)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
          disabled={actionBusy || !user?.id}
          onClick={() =>
            void runAction(
              () => assignTicketTo(item.id, user?.id ?? null),
              'Não foi possível assumir esta conversa agora.',
            )
          }
          type="button"
        >
          Assumir conversa
        </button>
        <label className="flex items-center gap-1.5 text-xs text-[color:var(--minimal-text-tertiary)]">
          Status
          <select
            className="rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2 py-1 text-xs text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
            disabled={actionBusy}
            onChange={(event) =>
              void runAction(
                () => updateTicketStatus(item.id, event.target.value),
                'Esta mudança de status não é permitida na etapa atual.',
              )
            }
            value={item.status}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]: [string, string]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-[color:var(--minimal-text-tertiary)]">
          Prioridade
          <select
            className="rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2 py-1 text-xs text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
            disabled={actionBusy}
            onChange={(event) =>
              void runAction(
                () => updateTicketPriority(item.id, event.target.value, item.severity),
                'Não foi possível alterar a prioridade agora.',
              )
            }
            value={item.priority}
          >
            {Object.entries(PRIORITY_LABELS).map(([value, label]: [string, string]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-[color:var(--minimal-text-tertiary)]">
          Tipo
          <select
            className="rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2 py-1 text-xs text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
            disabled={actionBusy || typeOptions.length === 0}
            onChange={(event) =>
              void runAction(
                () => setTicketConversationType(item.id, event.target.value || null),
                'Não foi possível alterar o tipo de conversa agora.',
              )
            }
            value={item.conversationTypeKey ?? ''}
          >
            <option value="">Sem tipo</option>
            {item.conversationTypeKey &&
            !typeOptions.some((option: ConversationTypeOption) => option.key === item.conversationTypeKey) ? (
              <option value={item.conversationTypeKey}>
                {item.conversationTypeLabel ?? item.conversationTypeKey}
              </option>
            ) : null}
            {typeOptions.map((option: ConversationTypeOption) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {actionError ? (
          <span className="text-xs text-[color:var(--color-danger-text)]">{actionError}</span>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4" ref={scrollRef}>
        {thread.phase === 'loading' ? (
          <p className="text-sm text-[color:var(--minimal-text-secondary)]">Carregando conversa…</p>
        ) : thread.phase === 'error' ? (
          <MinimalState description="Não foi possível carregar a conversa agora. Atualize a página." title="Falha ao carregar" tone="critical" />
        ) : thread.entries.length === 0 ? (
          <p className="text-sm text-[color:var(--minimal-text-secondary)]">Sem mensagens nesta conversa ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {thread.entries.map((entry: ConversationEntry) => (
              <ConversationBubble entry={entry} key={entry.id} />
            ))}
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-5 py-3">
        <div className="mb-2 flex gap-1.5" role="group" aria-label="Tipo de mensagem">
          <button
            aria-pressed={mode === 'public'}
            className={cx(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              mode === 'public'
                ? 'border-transparent bg-[color:var(--minimal-action)] text-[color:var(--minimal-action-ink)]'
                : 'border-[color:var(--minimal-border)] text-[color:var(--minimal-text-secondary)]',
            )}
            onClick={() => setMode('public')}
            type="button"
          >
            Resposta pública
          </button>
          <button
            aria-pressed={mode === 'internal'}
            className={cx(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              mode === 'internal'
                ? 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-text)]'
                : 'border-[color:var(--minimal-border)] text-[color:var(--minimal-text-secondary)]',
            )}
            onClick={() => setMode('internal')}
            type="button"
          >
            Nota interna
          </button>
          {mode === 'public' && quickReplies.length > 0 ? (
            <select
              aria-label="Resposta rápida"
              className="ml-auto rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2 py-1 text-xs text-[color:var(--minimal-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
              onChange={(event) => {
                const found = quickReplies.find((option: QuickReplyOption) => option.id === event.target.value);
                if (found) {
                  setDraft((current) => (current.trim() ? `${current}
${found.body}` : found.body));
                }
                event.target.value = '';
              }}
              value=""
            >
              <option value="">Resposta rápida…</option>
              {quickReplies.map((option: QuickReplyOption) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        <textarea
          className={cx(
            'w-full resize-none rounded-lg border px-3 py-2 text-sm text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]',
            mode === 'internal'
              ? 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)]'
              : 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)]',
          )}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={mode === 'public' ? 'Escreva para o cliente…' : 'Escreva uma nota interna (o cliente não vê)…'}
          rows={3}
          value={draft}
        />
        {sendError ? <p className="mt-1.5 text-xs text-[color:var(--color-danger-text)]">{sendError}</p> : null}
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[11px] text-[color:var(--minimal-text-tertiary)]">
            {mode === 'public' ? 'Visível para o cliente no portal.' : 'Somente a equipe interna vê.'}
          </p>
          <button
            className="inline-flex items-center rounded-lg bg-[color:var(--minimal-action)] px-4 py-2 text-sm font-medium text-[color:var(--minimal-action-ink)] hover:bg-[color:var(--minimal-action-hover)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
            disabled={sending || !draft.trim()}
            onClick={() => void handleSend()}
            type="button"
          >
            {sending ? 'Enviando…' : mode === 'public' ? 'Enviar resposta' : 'Salvar nota interna'}
          </button>
        </div>
      </footer>
    </section>
  );
}

function RailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[color:var(--minimal-border)] py-2.5 last:border-b-0">
      <p className="text-[11px] uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]">{label}</p>
      <div className="mt-1 text-sm text-[color:var(--minimal-text)]">{children}</div>
    </div>
  );
}

type InternalActionsState =
  | { phase: 'loading' }
  | { phase: 'ready'; actions: TicketInternalAction[] }
  | { phase: 'error' };

function InternalActionsSection({ ticketId }: { ticketId: string }) {
  const [state, setState] = useState<InternalActionsState>({ phase: 'loading' });
  const [areas, setAreas] = useState<InternalActionTargetAreaOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [areaKey, setAreaKey] = useState('');
  const [supportType, setSupportType] = useState('analysis');
  const [priority, setPriority] = useState('normal');
  const [summary, setSummary] = useState('');
  const [context, setContext] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadActions = useCallback(async () => {
    setState({ phase: 'loading' });
    try {
      const actions = await listTicketInternalActions(ticketId);
      setState({ phase: 'ready', actions });
    } catch {
      setState({ phase: 'error' });
    }
  }, [ticketId]);

  useEffect(() => {
    void loadActions();
    setShowForm(false);
    setSummary('');
    setContext('');
    setFeedback(null);
  }, [loadActions]);

  useEffect(() => {
    let cancelled = false;
    listInternalActionTargetAreas(ticketId)
      .then((options) => {
        if (!cancelled) {
          setAreas(options);
          const firstAvailable = options.find(
            (option: InternalActionTargetAreaOption) => option.canCreateAction,
          );
          setAreaKey(firstAvailable?.key ?? '');
        }
      })
      .catch(() => {
        if (!cancelled) setAreas([]);
      });
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  async function handleCreate() {
    const summaryText = summary.trim();
    const contextText = context.trim();
    if (!areaKey || !summaryText || !contextText) return;
    setBusy(true);
    setFeedback(null);
    try {
      await createInternalAction({
        ticketId,
        targetAreaKey: areaKey,
        supportType,
        priority,
        summary: summaryText,
        context: contextText,
      });
      setSummary('');
      setContext('');
      setShowForm(false);
      await loadActions();
    } catch {
      setFeedback('Não foi possível acionar a área agora. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function handleReturnDecision(action: TicketInternalAction, decision: 'accept' | 'close') {
    setBusy(true);
    setFeedback(null);
    try {
      if (decision === 'accept') {
        await acceptInternalActionReturn(action.id, action.tenantId);
      } else {
        await closeInternalAction(action.id, action.tenantId);
      }
      await loadActions();
    } catch {
      setFeedback('Não foi possível concluir esta ação agora. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2 py-1.5 text-xs text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]';

  return (
    <section className="mt-4 border-t border-[color:var(--minimal-border)] pt-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]">
          Acionamentos entre áreas
        </h3>
        <button
          className="rounded-lg border border-[color:var(--minimal-border)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--minimal-text-secondary)] hover:text-[color:var(--minimal-text)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
          disabled={busy || areas.length === 0}
          onClick={() => setShowForm((current) => !current)}
          type="button"
        >
          {showForm ? 'Fechar' : 'Acionar área'}
        </button>
      </div>
      <p className="mt-1 text-[11px] text-[color:var(--minimal-text-tertiary)]">
        Interno à equipe — o cliente nunca vê.
      </p>

      {showForm ? (
        <div className="mt-2 flex flex-col gap-2 rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-2.5">
          <label className="flex flex-col gap-1 text-[11px] text-[color:var(--minimal-text-tertiary)]">
            Área acionada
            <select
              className={inputClass}
              disabled={busy}
              onChange={(event) => setAreaKey(event.target.value)}
              value={areaKey}
            >
              {areas.map((option: InternalActionTargetAreaOption) => (
                <option disabled={!option.canCreateAction} key={option.key} value={option.key}>
                  {option.label}
                  {option.canCreateAction ? '' : ` (${option.unavailableReason ?? 'indisponível'})`}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-[11px] text-[color:var(--minimal-text-tertiary)]">
              O que você precisa
              <select
                className={inputClass}
                disabled={busy}
                onChange={(event) => setSupportType(event.target.value)}
                value={supportType}
              >
                {Object.entries(INTERNAL_ACTION_SUPPORT_TYPE_LABELS).map(
                  ([value, label]: [string, string]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-[color:var(--minimal-text-tertiary)]">
              Prioridade
              <select
                className={inputClass}
                disabled={busy}
                onChange={(event) => setPriority(event.target.value)}
                value={priority}
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]: [string, string]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-[11px] text-[color:var(--minimal-text-tertiary)]">
            Resumo do pedido
            <input
              className={inputClass}
              disabled={busy}
              maxLength={160}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Ex.: validar cobrança duplicada da fatura de julho"
              type="text"
              value={summary}
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-[color:var(--minimal-text-tertiary)]">
            Contexto para a área
            <textarea
              className={cx(inputClass, 'resize-none')}
              disabled={busy}
              onChange={(event) => setContext(event.target.value)}
              placeholder="O que já foi verificado, o que a área precisa saber para agir…"
              rows={3}
              value={context}
            />
          </label>
          <button
            className="inline-flex items-center justify-center rounded-lg bg-[color:var(--minimal-action)] px-3 py-1.5 text-xs font-medium text-[color:var(--minimal-action-ink)] hover:bg-[color:var(--minimal-action-hover)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
            disabled={busy || !areaKey || !summary.trim() || !context.trim()}
            onClick={() => void handleCreate()}
            type="button"
          >
            {busy ? 'Acionando…' : 'Acionar área'}
          </button>
        </div>
      ) : null}

      {feedback ? <p className="mt-2 text-[11px] text-[color:var(--color-danger-text)]">{feedback}</p> : null}

      <div className="mt-2 flex flex-col gap-2">
        {state.phase === 'loading' ? (
          <p className="text-xs text-[color:var(--minimal-text-secondary)]">Carregando acionamentos…</p>
        ) : state.phase === 'error' ? (
          <p className="text-xs text-[color:var(--color-danger-text)]">
            Não foi possível carregar os acionamentos agora.
          </p>
        ) : state.actions.length === 0 ? (
          <p className="text-xs text-[color:var(--minimal-text-secondary)]">
            Nenhuma área acionada nesta conversa.
          </p>
        ) : (
          state.actions.map((action: TicketInternalAction) => (
            <article
              className={cx(
                'rounded-xl border p-2.5',
                action.hasPendingReturn
                  ? 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)]'
                  : 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)]',
              )}
              key={action.id}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-semibold text-[color:var(--minimal-text)]">
                  {action.targetAreaLabel}
                </p>
                <Pill tone={toneForInternalActionStatus(action.status)}>
                  {INTERNAL_ACTION_STATUS_LABELS[action.status] ?? action.status}
                </Pill>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--minimal-text-secondary)]">
                {action.summary}
              </p>
              <p className="mt-1 text-[11px] text-[color:var(--minimal-text-tertiary)]">
                {INTERNAL_ACTION_SUPPORT_TYPE_LABELS[action.supportType] ?? action.supportType}
                {' · '}
                {PRIORITY_LABELS[action.priority] ?? action.priority}
                {action.assignedAreaUserName ? ` · ${action.assignedAreaUserName}` : ''}
                {' · '}
                {formatWhen(action.lastUpdateAt ?? action.createdAt)}
              </p>
              {action.lastUpdateSummary ? (
                <p className="mt-1 line-clamp-2 text-[11px] italic text-[color:var(--minimal-text-tertiary)]">
                  “{action.lastUpdateSummary}”
                </p>
              ) : null}
              {action.hasPendingReturn ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    className="rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2 py-1 text-[11px] font-medium text-[color:var(--minimal-text)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
                    disabled={busy}
                    onClick={() => void handleReturnDecision(action, 'accept')}
                    type="button"
                  >
                    Aceitar retorno
                  </button>
                  <button
                    className="rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2 py-1 text-[11px] font-medium text-[color:var(--minimal-text)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
                    disabled={busy}
                    onClick={() => void handleReturnDecision(action, 'close')}
                    type="button"
                  >
                    Concluir acionamento
                  </button>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function ContextRail({ item }: { item: InboxItem }) {
  return (
    <aside className="hidden min-h-0 overflow-y-auto border-l border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-4 py-4 xl:block">
      <h2 className="text-sm font-semibold text-[color:var(--minimal-text)]">Contexto</h2>
      <dl className="mt-2">
        <RailRow label="Cliente">{item.tenantDisplayName ?? 'Indisponível'}</RailRow>
        <RailRow label="Solicitante">{item.requesterName ?? 'Não informado'}</RailRow>
        <RailRow label="Responsável">{item.assignedToFullName ?? 'Sem responsável'}</RailRow>
        <RailRow label="Categoria">{item.categoryName ?? 'Sem categoria'}</RailRow>
        <RailRow label="Tipo de conversa">{item.conversationTypeLabel ?? 'Sem tipo'}</RailRow>
        <RailRow label="Origem">{item.originLabel}</RailRow>
        <RailRow label="Status">
          <Pill tone={toneForStatus(item.status)}>{STATUS_LABELS[item.status] ?? item.status}</Pill>
        </RailRow>
        <RailRow label="Prioridade">
          <Pill tone={toneForPriority(item.priority)}>{PRIORITY_LABELS[item.priority] ?? item.priority}</Pill>
        </RailRow>
        <RailRow label="Prazo (SLA)">{item.isSlaAvailable ? item.slaStatusLabel : 'Indisponível'}</RailRow>
        <RailRow label="Mensagens do cliente">{String(item.customerMessageCount)}</RailRow>
        <RailRow label="Aberto em">{formatWhen(item.createdAt)}</RailRow>
      </dl>
      <InternalActionsSection ticketId={item.id} />
      <Link
        className="mt-4 inline-flex items-center rounded-lg border border-[color:var(--minimal-border)] px-3 py-1.5 text-xs font-medium text-[color:var(--minimal-text-secondary)] hover:text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
        to={item.tenantId ? `/support/customers/${item.tenantId}` : '/support/customers'}
      >
        {item.tenantId ? 'Abrir cockpit do cliente' : 'Ver clientes B2B'}
      </Link>
    </aside>
  );
}

export function InboxPage() {
  const [state, setState] = useState<ListState>({ phase: 'loading' });
  const [view, setView] = useState<ViewId>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const items = await listInboxItems();
      setState({ phase: 'ready', items });
    } catch {
      setState({ phase: 'error' });
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const allItems = state.phase === 'ready' ? state.items : [];

  const viewCounts = useMemo(() => {
    const counts = { todas: allItems.length, nao_atribuidas: 0, aguardando_suporte: 0, aguardando_cliente: 0, urgentes: 0 };
    for (const item of allItems) {
      if (item.isUnassigned) counts.nao_atribuidas += 1;
      if (item.isWaitingSupport) counts.aguardando_suporte += 1;
      if (item.isWaitingCustomer) counts.aguardando_cliente += 1;
      if (item.priority === 'urgent' || item.severity === 'critical') counts.urgentes += 1;
    }
    return counts;
  }, [allItems]);

  const filtered = useMemo(() => {
    const term = normalize(searchTerm.trim());
    return allItems.filter((item: InboxItem) => {
      if (!matchesView(item, view)) return false;
      if (!term) return true;
      const haystack = normalize(
        [item.title, item.tenantDisplayName ?? '', item.requesterName ?? '', item.categoryName ?? ''].join(' '),
      );
      return haystack.includes(term);
    });
  }, [allItems, view, searchTerm]);

  useEffect(() => {
    if (!filtered.some((item: InboxItem) => item.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((item: InboxItem) => item.id === selectedId) ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[color:var(--minimal-surface)]">
      <header className="flex shrink-0 flex-col gap-3 border-b border-[color:var(--minimal-border)] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">Atendimento</h1>
            <p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">
              Todas as conversas e demandas em um só lugar.
            </p>
          </div>
          <MinimalTextInput
            aria-label="Buscar conversas"
            className="w-full sm:w-72"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cliente, título ou categoria"
            type="search"
            value={searchTerm}
          />
        </div>
        <div aria-label="Visões da fila" className="flex flex-wrap gap-1.5" role="group">
          <FilterTabs
            ariaLabel="Visões da fila"
            activeId={view}
            items={VIEWS.map((entry) => ({ ...entry, count: viewCounts[entry.id] }))}
            onChange={(id) => setView(id as ViewId)}
          />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_320px]">
        <aside className="min-h-0 overflow-y-auto border-r border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)]">
          {state.phase === 'loading' ? (
            <p className="p-5 text-sm text-[color:var(--minimal-text-secondary)]">Carregando conversas…</p>
          ) : state.phase === 'error' ? (
            <div className="p-5">
              <MinimalState description="Não foi possível carregar a fila agora. Atualize a página." title="Falha ao carregar" tone="critical" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-5">
              <p className="text-sm font-medium text-[color:var(--minimal-text)]">Nenhuma conversa encontrada</p>
              <p className="mt-1 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">
                Ajuste a busca ou o filtro para ver outras conversas.
              </p>
            </div>
          ) : (
            filtered.map((item: InboxItem) => {
              const active = item.id === selectedId;
              return (
                <button
                  aria-pressed={active}
                  className={cx(
                    'w-full border-b border-[color:var(--minimal-border)] px-4 py-3 text-left transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--minimal-focus)]',
                    active ? 'bg-[color:var(--minimal-selection)]' : 'bg-transparent hover:bg-[color:var(--minimal-surface-muted)]',
                  )}
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className={cx('min-w-0 truncate text-sm font-medium', active ? 'text-[color:var(--minimal-selection-text)]' : 'text-[color:var(--minimal-text)]')}>
                      {item.title}
                    </p>
                    <span className="shrink-0 text-[11px] tabular-nums text-[color:var(--minimal-text-tertiary)]">
                      {formatWhen(item.lastMessageAt ?? item.updatedAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[color:var(--minimal-text-secondary)]">
                    {item.tenantDisplayName ?? 'Cliente indisponível'}
                    {item.assignedToFullName ? ` · ${item.assignedToFullName}` : ' · sem responsável'}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Pill tone={toneForStatus(item.status)}>{STATUS_LABELS[item.status] ?? item.status}</Pill>
                    {item.priority === 'urgent' || item.priority === 'high' ? (
                      <Pill tone={toneForPriority(item.priority)}>{PRIORITY_LABELS[item.priority] ?? item.priority}</Pill>
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </aside>

        {selected ? (
          <ConversationPane item={selected} onChanged={() => void loadItems()} />
        ) : (
          <div className="flex items-center justify-center p-5">
            <MinimalState description="Selecione uma conversa para responder." title="Nenhuma conversa selecionada" />
          </div>
        )}
        {selected ? <ContextRail item={selected} /> : null}
      </div>
    </div>
  );
}
