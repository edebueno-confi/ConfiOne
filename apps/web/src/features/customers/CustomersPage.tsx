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
import { getCustomerRelationshipSnapshot } from './customer-relationship-api';
import type { CustomerRelationshipSnapshot } from './customer-relationship-model';

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
  return map[token ?? ''] ?? 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text-secondary)]';
}

type LoadState = { phase: 'loading' } | { phase: 'ready'; items: CustomerAccount[] } | { phase: 'error' };
type RelationshipState =
  | { phase: 'loading' }
  | { phase: 'ready'; snapshot: CustomerRelationshipSnapshot }
  | { phase: 'error' };

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
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
  const statuses = Object.entries(customer.statusCounts).filter(([, count]) => count > 0);
  return (
    <article className="min-h-0 overflow-y-auto bg-[color:var(--minimal-surface)]">
      <header className="border-b border-[color:var(--minimal-border)] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-[-0.025em] text-[color:var(--minimal-text)]">{customer.displayName}</h2>
            <p className="mt-1 text-sm text-[color:var(--minimal-text-secondary)]">{customer.legalName ?? 'Razão social não informada'}</p>
          </div>
          <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs', customer.status === 'active' ? 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-text)]' : 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text-secondary)]')}>
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
          {assignment ? <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', segmentPillClass(assignment.colorToken))}>{assignment.segmentLabel}</span> : <span className="text-xs text-[color:var(--minimal-text-secondary)]">Não classificado</span>}
          <select aria-label="Definir segmento do cliente" className="rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2 py-1 text-xs text-[color:var(--minimal-text)]" disabled={busy} onChange={(event) => event.target.value ? onSet(event.target.value) : onClear()} value="">
            <option value="">Alterar…</option>
            {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            <option value="">Remover classificação</option>
          </select>
        </div>
      </header>
      <div className="divide-y divide-[color:var(--minimal-border)]">
        <section className="px-5 py-5 sm:px-6">
          <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Detalhes da conta</h3>
          <dl className="mt-3">
            <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-4 border-b border-[color:var(--minimal-border)] py-2.5"><dt className="text-xs text-[color:var(--minimal-text-tertiary)]">Código</dt><dd className="text-sm text-[color:var(--minimal-text)]">{customer.slug}</dd></div>
            <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-4 py-2.5"><dt className="text-xs text-[color:var(--minimal-text-tertiary)]">Cliente desde</dt><dd className="text-sm text-[color:var(--minimal-text)]">{formatDate(customer.createdAt)}</dd></div>
          </dl>
        </section>
        <section className="px-5 py-5 sm:px-6">
          <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Tickets por status</h3>
          {statuses.length === 0 ? <p className="mt-3 text-sm text-[color:var(--minimal-text-secondary)]">Sem tickets registrados.</p> : <div className="mt-3 flex flex-wrap gap-2">{statuses.map(([status, count]) => <span className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-3 py-1.5 text-xs text-[color:var(--minimal-text-secondary)]" key={status}>{STATUS_LABELS[status] ?? status}<span className="tabular-nums font-semibold text-[color:var(--minimal-text)]">{count}</span></span>)}</div>}
        </section>
        <section className="px-5 py-5 sm:px-6"><Link className="inline-flex items-center rounded-lg bg-[color:var(--minimal-action)] px-4 py-2 text-sm font-medium text-[color:var(--minimal-action-ink)]" to="/support/inbox">Ver conversas no Atendimento</Link></section>
      </div>
    </article>
  );
}

export function CustomersPage() {
  const [state, setState] = useState<LoadState>({ phase: 'loading' });
  const [relationshipState, setRelationshipState] = useState<RelationshipState>({ phase: 'loading' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [segmentOptions, setSegmentOptions] = useState<SegmentOption[]>([]);
  const [assignments, setAssignments] = useState<Record<string, SegmentAssignment>>({});
  const [segmentBusy, setSegmentBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listCustomers().then((items) => { if (!cancelled) setState({ phase: 'ready', items }); }).catch(() => { if (!cancelled) setState({ phase: 'error' }); });
    listSegmentOptions().then((options) => { if (!cancelled) setSegmentOptions(options); }).catch(() => undefined);
    getCustomerRelationshipSnapshot()
      .then((snapshot) => { if (!cancelled) setRelationshipState({ phase: 'ready', snapshot }); })
      .catch(() => { if (!cancelled) setRelationshipState({ phase: 'error' }); });
    return () => { cancelled = true; };
  }, []);

  const reloadAssignments = useCallback(async () => {
    try { setAssignments(await getSegmentAssignments()); } catch { setAssignments({}); }
  }, []);

  useEffect(() => { void reloadAssignments(); }, [reloadAssignments]);

  const handleSetSegment = useCallback(async (tenantId: string, segmentId: string) => {
    setSegmentBusy(true);
    try { await setCustomerSegment(tenantId, segmentId); await reloadAssignments(); } catch { /* Mantém a leitura anterior em caso de permissão insuficiente. */ } finally { setSegmentBusy(false); }
  }, [reloadAssignments]);

  const handleClearSegment = useCallback(async (tenantId: string) => {
    setSegmentBusy(true);
    try { await clearCustomerSegment(tenantId); await reloadAssignments(); } catch { /* Mantém a leitura anterior em caso de permissão insuficiente. */ } finally { setSegmentBusy(false); }
  }, [reloadAssignments]);

  const all = state.phase === 'ready' ? state.items : [];
  const filtered = useMemo(() => {
    const term = normalize(searchTerm.trim());
    if (!term) return all;
    return all.filter((customer) => normalize([customer.displayName, customer.legalName ?? '', customer.slug].join(' ')).includes(term));
  }, [all, searchTerm]);
  const selected = filtered.find((customer) => customer.tenantId === selectedId) ?? null;

  return (
    <div className="gso-screen-frame relative flex h-full min-h-0 flex-col bg-[color:var(--minimal-surface)]">
      <header className="gso-screen-header flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[color:var(--minimal-border)] px-5 py-4 sm:px-6">
        <div><h1 className="text-lg font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">Clientes B2B</h1><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">{state.phase === 'ready' ? `${all.length} conta(s) disponíveis para gestão` : 'Cockpit de contas e atendimento'}</p></div>
        <MinimalTextInput aria-label="Buscar clientes" className="w-full sm:w-96" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Nome, CNPJ, domínio, razão social ou código" type="search" value={searchTerm} />
      </header>
      <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-[color:var(--minimal-border)] px-5 py-4 sm:grid-cols-4 sm:px-6">
        <Kpi label="Contas no escopo" value={all.length} />
        <Kpi label="Com tickets abertos" value={all.filter((customer) => customer.openTickets > 0).length} />
        <Kpi label="Sem classificação" value={all.filter((customer) => !assignments[customer.tenantId]).length} />
        <Kpi label="Contatos ativos" value={all.reduce((sum, customer) => sum + customer.activeContacts, 0)} />
      </div>
      <section className="shrink-0 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-5 py-3 sm:px-6" aria-label="Contexto global do HubSpot">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[color:var(--minimal-text)]">Contexto do HubSpot</p>
            <p className="mt-0.5 text-[11px] text-[color:var(--minimal-text-tertiary)]">
              Resumo global do cache; nenhuma empresa foi associada automaticamente a uma conta B2B.
            </p>
          </div>
          {relationshipState.phase === 'ready' ? (
            <span className={cx(
              'rounded-full border px-2 py-1 text-[11px] font-medium',
              relationshipState.snapshot.sourceOfTruth === 'hubspot_cache'
                ? 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-text)]'
                : 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-text)]',
            )}>
              {relationshipState.snapshot.sourceOfTruth === 'hubspot_cache' ? 'Cache HubSpot disponível' : 'Fonte indisponível'}
            </span>
          ) : relationshipState.phase === 'error' ? (
            <span className="rounded-full border border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] px-2 py-1 text-[11px] font-medium text-[color:var(--color-warning-text)]">
              Contexto indisponível
            </span>
          ) : (
            <span className="text-[11px] text-[color:var(--minimal-text-tertiary)]">Consultando fonte...</span>
          )}
        </div>
        {relationshipState.phase === 'ready' && relationshipState.snapshot.sourceOfTruth === 'hubspot_cache' ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Kpi label="Entidades legais" value={relationshipState.snapshot.legalEntitiesTotal} />
            <Kpi label="Negócios" value={relationshipState.snapshot.dealsTotal} />
            <Kpi label="Grupos econômicos resolvidos" value={relationshipState.snapshot.economicGroupsTotal} />
          </div>
        ) : null}
      </section>
      <div className="min-h-0 flex-1 overflow-auto px-5 py-5 sm:px-6">
        {state.phase === 'loading' ? <div className="flex min-h-48 items-center justify-center"><MinimalState description="Estamos consultando as contas disponíveis para este perfil." title="Carregando clientes" /></div> : state.phase === 'error' ? <div className="flex min-h-48 items-center justify-center"><MinimalState description="Não foi possível carregar os clientes agora. Atualize a página." title="Falha ao carregar" tone="critical" /></div> : filtered.length === 0 ? <div className="flex min-h-48 items-center justify-center"><MinimalState description="Ajuste a busca para consultar outras contas." title="Nenhum cliente encontrado" /></div> : (
          <div className="overflow-x-auto rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)]">
            <table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-[11px] uppercase tracking-[0.08em] text-[color:var(--minimal-text-tertiary)]"><tr><th className="px-4 py-3 font-medium">Cliente</th><th className="px-4 py-3 font-medium">Status / segmento</th><th className="px-4 py-3 font-medium">Atendimento</th><th className="px-4 py-3 text-right font-medium">Tickets</th><th className="px-4 py-3 text-right font-medium">Ação</th></tr></thead>
              <tbody className="divide-y divide-[color:var(--minimal-border)]">{filtered.map((customer) => { const attention = customer.openTickets > 0 || !assignments[customer.tenantId]; return <tr className="hover:bg-[color:var(--minimal-surface-muted)]" key={customer.tenantId}><td className="px-4 py-3"><button className="text-left" onClick={() => setSelectedId(customer.tenantId)} type="button"><span className="block max-w-[300px] truncate font-medium text-[color:var(--minimal-text)]">{customer.displayName}</span><span className="mt-0.5 block max-w-[300px] truncate text-xs text-[color:var(--minimal-text-secondary)]">{customer.legalName ?? 'Razão social não informada'}</span></button></td><td className="px-4 py-3"><span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', attention ? 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-text)]' : 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-text)]')}>{attention ? 'Atenção' : 'Estável'}</span><span className="mt-1 block text-xs text-[color:var(--minimal-text-secondary)]">{assignments[customer.tenantId]?.segmentLabel ?? 'Sem classificação'}</span></td><td className="px-4 py-3 text-[color:var(--minimal-text-secondary)]">{customer.activeContacts} contato(s)</td><td className="px-4 py-3 text-right tabular-nums text-[color:var(--minimal-text)]">{customer.openTickets} / {customer.totalTickets}</td><td className="px-4 py-3 text-right"><button className="rounded-lg border border-[color:var(--minimal-border)] px-3 py-1.5 text-xs font-medium text-[color:var(--minimal-text)] hover:bg-[color:var(--minimal-surface-muted)]" onClick={() => setSelectedId(customer.tenantId)} type="button">Abrir</button></td></tr>; })}</tbody>
            </table>
          </div>
        )}
      </div>
      {selected ? <div className="absolute inset-0 z-20 flex justify-end bg-black/20 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={`Detalhes de ${selected.displayName}`}><div className="flex h-full w-full max-w-2xl flex-col overflow-hidden border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] shadow-2xl sm:rounded-2xl"><div className="flex shrink-0 items-center justify-between border-b border-[color:var(--minimal-border)] px-5 py-3"><span className="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--minimal-text-tertiary)]">Detalhes da conta</span><button aria-label="Fechar detalhes" className="rounded-lg border border-[color:var(--minimal-border)] px-3 py-1.5 text-xs text-[color:var(--minimal-text-secondary)]" onClick={() => setSelectedId(null)} type="button">Fechar</button></div><CustomerDetail assignment={assignments[selected.tenantId] ?? null} busy={segmentBusy} customer={selected} onClear={() => void handleClearSegment(selected.tenantId)} onSet={(segmentId) => void handleSetSegment(selected.tenantId, segmentId)} options={segmentOptions} /></div></div> : null}
    </div>
  );
}
