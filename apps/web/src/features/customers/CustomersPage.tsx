import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MinimalState } from '../../components/minimal-states';
import { MinimalTextInput } from '../../components/minimal-ui';
import { cx } from '../../components/ui';
import {
  clearCustomerSegment,
  getSegmentAssignments,
  listCustomers,
  listSegmentOptions,
  setCustomerSegment,
  type CustomerAccount,
  type SegmentAssignment,
  type SegmentOption,
} from './customers-api';

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

function segmentPillClass(token: string | null): string {
  const map: Record<string, string> = {
    danger: 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] text-[color:var(--color-danger-text)]',
    warning: 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-text)]',
    info: 'border-[color:var(--color-info-border)] bg-[color:var(--color-info-surface)] text-[color:var(--color-info-text)]',
    success: 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-text)]',
  };
  return (token && map[token]) || 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text-secondary)]';
}

type LoadState = { phase: 'loading' } | { phase: 'ready'; items: CustomerAccount[] } | { phase: 'error' };

function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR');
}

function formatDate(value: string) {
  if (!value) return 'Indisponível';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 py-2.5">
      <p className="text-lg font-semibold tabular-nums leading-none text-[color:var(--minimal-text)]">{value}</p>
      <p className="mt-1.5 text-[11px] text-[color:var(--minimal-text-tertiary)]">{label}</p>
    </div>
  );
}

function CustomerDetail({
  customer,
  assignment,
  options,
  onSet,
  onClear,
  busy,
}: {
  customer: CustomerAccount;
  assignment: SegmentAssignment | null;
  options: SegmentOption[];
  onSet: (segmentId: string) => void;
  onClear: () => void;
  busy: boolean;
}) {
  const statuses = Object.entries(customer.statusCounts).filter(([, n]: [string, number]) => n > 0);
  return (
    <article className="min-h-0 overflow-y-auto bg-[color:var(--minimal-surface)]">
      <header className="border-b border-[color:var(--minimal-border)] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-[-0.025em] text-[color:var(--minimal-text)]">{customer.displayName}</h2>
            <p className="mt-1 text-sm text-[color:var(--minimal-text-secondary)]">{customer.legalName ?? 'Razão social indisponível'}</p>
          </div>
          <span className={cx(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
            customer.status === 'active'
              ? 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-text)]'
              : 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text-secondary)]',
          )}>
            {customer.status === 'active' ? 'Conta ativa' : customer.status}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <Kpi label="Tickets abertos" value={customer.openTickets} />
          <Kpi label="No histórico" value={customer.totalTickets} />
          <Kpi label="Contatos ativos" value={customer.activeContacts} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[color:var(--minimal-text-tertiary)]">Segmento</span>
          {assignment ? (
            <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', segmentPillClass(assignment.colorToken))}>
              {assignment.segmentLabel}
            </span>
          ) : (
            <span className="text-xs text-[color:var(--minimal-text-secondary)]">Não classificado</span>
          )}
          <select
            aria-label="Definir segmento do cliente"
            className="rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2 py-1 text-xs text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
            disabled={busy}
            onChange={(event) => {
              const value = event.target.value;
              if (value === '') {
                onClear();
              } else {
                onSet(value);
              }
            }}
            value=""
          >
            <option value="">Alterar…</option>
            {options.map((option: SegmentOption) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
            <option value="">Remover classificação</option>
          </select>
        </div>
      </header>

      <div className="divide-y divide-[color:var(--minimal-border)]">
        <section className="px-5 py-5 sm:px-6">
          <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Dados da conta</h3>
          <dl className="mt-3">
            <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-4 border-b border-[color:var(--minimal-border)] py-2.5">
              <dt className="text-xs text-[color:var(--minimal-text-tertiary)]">Código</dt>
              <dd className="text-sm text-[color:var(--minimal-text)]">{customer.slug}</dd>
            </div>
            <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-4 py-2.5">
              <dt className="text-xs text-[color:var(--minimal-text-tertiary)]">Cliente desde</dt>
              <dd className="text-sm text-[color:var(--minimal-text)]">{formatDate(customer.createdAt)}</dd>
            </div>
          </dl>
        </section>

        <section className="px-5 py-5 sm:px-6">
          <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Tickets por status</h3>
          {statuses.length === 0 ? (
            <p className="mt-3 text-sm text-[color:var(--minimal-text-secondary)]">Sem tickets registrados.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {statuses.map(([status, count]: [string, number]) => (
                <span className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-3 py-1.5 text-xs text-[color:var(--minimal-text-secondary)]" key={status}>
                  {STATUS_LABELS[status] ?? status}
                  <span className="tabular-nums font-semibold text-[color:var(--minimal-text)]">{count}</span>
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="px-5 py-5 sm:px-6">
          <Link
            className="inline-flex items-center rounded-lg bg-[color:var(--minimal-action)] px-4 py-2 text-sm font-medium text-[color:var(--minimal-action-ink)] hover:bg-[color:var(--minimal-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
            to="/support/inbox"
          >
            Ver conversas no Atendimento
          </Link>
        </section>
      </div>
    </article>
  );
}

export function CustomersPage() {
  const [state, setState] = useState<LoadState>({ phase: 'loading' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [segmentOptions, setSegmentOptions] = useState<SegmentOption[]>([]);
  const [assignments, setAssignments] = useState<Record<string, SegmentAssignment>>({});
  const [segmentBusy, setSegmentBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listCustomers()
      .then((items) => {
        if (!cancelled) setState({ phase: 'ready', items });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: 'error' });
      });
    listSegmentOptions()
      .then((options) => {
        if (!cancelled) setSegmentOptions(options);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const reloadAssignments = useCallback(async () => {
    try {
      const map = await getSegmentAssignments();
      setAssignments(map);
    } catch {
      setAssignments({});
    }
  }, []);

  useEffect(() => {
    void reloadAssignments();
  }, [reloadAssignments]);

  const handleSetSegment = useCallback(
    async (tenantId: string, segmentId: string) => {
      setSegmentBusy(true);
      try {
        await setCustomerSegment(tenantId, segmentId);
        await reloadAssignments();
      } catch {
        // silencioso: erro raro (permissão); a UI apenas não altera
      } finally {
        setSegmentBusy(false);
      }
    },
    [reloadAssignments],
  );

  const handleClearSegment = useCallback(
    async (tenantId: string) => {
      setSegmentBusy(true);
      try {
        await clearCustomerSegment(tenantId);
        await reloadAssignments();
      } catch {
        // silencioso
      } finally {
        setSegmentBusy(false);
      }
    },
    [reloadAssignments],
  );

  const all = state.phase === 'ready' ? state.items : [];

  const filtered = useMemo(() => {
    const term = normalize(searchTerm.trim());
    if (!term) return all;
    return all.filter((c: CustomerAccount) =>
      normalize([c.displayName, c.legalName ?? '', c.slug].join(' ')).includes(term),
    );
  }, [all, searchTerm]);

  useEffect(() => {
    if (!filtered.some((c: CustomerAccount) => c.tenantId === selectedId)) {
      setSelectedId(filtered[0]?.tenantId ?? null);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((c: CustomerAccount) => c.tenantId === selectedId) ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[color:var(--minimal-surface)]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[color:var(--minimal-border)] px-5 py-4 sm:px-6">
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">Clientes B2B</h1>
          <p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">
            {state.phase === 'ready' ? `${all.length} conta(s) no seu escopo` : 'Contas atendidas'}
          </p>
        </div>
        <MinimalTextInput
          aria-label="Buscar clientes"
          className="w-full sm:w-72"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Nome, razão social ou código"
          type="search"
          value={searchTerm}
        />
      </header>

      <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto border-r border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)]">
          {state.phase === 'loading' ? (
            <p className="p-5 text-sm text-[color:var(--minimal-text-secondary)]">Carregando clientes…</p>
          ) : state.phase === 'error' ? (
            <div className="p-5">
              <MinimalState description="Não foi possível carregar os clientes agora. Atualize a página." title="Falha ao carregar" tone="critical" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-5">
              <p className="text-sm font-medium text-[color:var(--minimal-text)]">Nenhum cliente encontrado</p>
              <p className="mt-1 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">Ajuste a busca para ver outras contas.</p>
            </div>
          ) : (
            filtered.map((c: CustomerAccount) => {
              const active = c.tenantId === selectedId;
              return (
                <button
                  aria-pressed={active}
                  className={cx(
                    'w-full border-b border-[color:var(--minimal-border)] px-4 py-3 text-left transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--minimal-focus)]',
                    active ? 'bg-[color:var(--minimal-selection)]' : 'bg-transparent hover:bg-[color:var(--minimal-surface-muted)]',
                  )}
                  key={c.tenantId}
                  onClick={() => setSelectedId(c.tenantId)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className={cx('min-w-0 truncate text-sm font-medium', active ? 'text-[color:var(--minimal-selection-text)]' : 'text-[color:var(--minimal-text)]')}>
                      {c.displayName}
                    </p>
                    {c.openTickets > 0 ? (
                      <span className="shrink-0 rounded-full border border-[color:var(--color-info-border)] bg-[color:var(--color-info-surface)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-info-text)]">
                        {c.openTickets} abertos
                      </span>
                    ) : (
                      <span className="shrink-0 text-[11px] text-[color:var(--minimal-text-tertiary)]">sem abertos</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[color:var(--minimal-text-secondary)]">
                    {c.activeContacts} contato(s) · {c.totalTickets} no histórico
                  </p>
                  {assignments[c.tenantId] ? (
                    <span className={cx('mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', segmentPillClass(assignments[c.tenantId].colorToken))}>
                      {assignments[c.tenantId].segmentLabel}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </aside>

        {selected ? (
          <CustomerDetail
            assignment={assignments[selected.tenantId] ?? null}
            busy={segmentBusy}
            customer={selected}
            onClear={() => void handleClearSegment(selected.tenantId)}
            onSet={(segmentId) => void handleSetSegment(selected.tenantId, segmentId)}
            options={segmentOptions}
          />
        ) : (
          <div className="flex items-center justify-center p-5">
            <MinimalState description="Selecione um cliente para ver o contexto." title="Nenhum cliente selecionado" />
          </div>
        )}
      </div>
    </div>
  );
}
