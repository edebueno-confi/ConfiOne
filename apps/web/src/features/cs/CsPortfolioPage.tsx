import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  CsCustomerPortfolio,
  CsCustomerPortfolioProductContext,
  TicketStatus,
} from '../../contracts/support-contracts';
import { MinimalState } from '../../components/minimal-states';
import { MinimalButton, MinimalTextInput } from '../../components/minimal-ui';
import { cx } from '../../components/ui';
import { filterCsCustomerPortfolio, upsertCsCustomerPortfolio } from './cs-api';
import { useCsPortfolio } from './CsGate';
import { getSegmentAssignments, type SegmentAssignment } from '../customers/customers-api';

const TICKET_STATUS_LABELS: Partial<Record<TicketStatus, string>> = {
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

const OPEN_TICKET_STATUSES: ReadonlySet<string> = new Set([
  'new',
  'triage',
  'in_progress',
  'waiting_customer',
  'waiting_support',
  'waiting_engineering',
]);

type SegmentId = 'all' | 'with_open' | 'without_owner';

const SEGMENTS: ReadonlyArray<{ id: SegmentId; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'with_open', label: 'Com tickets abertos' },
  { id: 'without_owner', label: 'Sem owner CS' },
];

function matchesSegment(customer: CsCustomerPortfolio, segment: SegmentId) {
  if (segment === 'with_open') {
    return customer.openTicketCount > 0;
  }
  if (segment === 'without_owner') {
    return !customer.csOwnerFullName;
  }
  return true;
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Não informado';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  if (!value) {
    return 'Indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

// A leitura de saúde ainda não tem contrato próprio no backend; traduzimos a
// justificativa técnica para linguagem operacional sem prometer um dado que
// ainda não existe.
function sanitizeCsOperationalText(value: string | null | undefined) {
  const base = (value ?? '').trim();
  if (!base) {
    return 'A leitura de saúde da conta ainda não está disponível nesta visão.';
  }

  return base
    .replace(/Health score\s+n[aã]o materializado neste contrato\./gi, 'A leitura de saúde ainda não está disponível nesta visão.')
    .replace(/\bcontratos?\b/gi, 'acordos operacionais')
    .replace(/\bbackend\b/gi, 'operação')
    .replace(/\bRPCs?\b/g, 'rotina operacional')
    .replace(/\btenant\b/gi, 'cliente');
}

type PillTone = 'neutral' | 'info' | 'success' | 'warning';

function Pill({ tone = 'neutral', children }: { tone?: PillTone; children: ReactNode }) {
  const tones: Record<PillTone, string> = {
    neutral:
      'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text-secondary)]',
    info: 'border-[color:var(--color-info-border)] bg-[color:var(--color-info-surface)] text-[color:var(--color-info-text)]',
    success:
      'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-text)]',
    warning:
      'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-text)]',
  };

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

function ProductStatusPill({ status }: { status: CsCustomerPortfolioProductContext['status'] }) {
  return status === 'active' ? (
    <Pill tone="success">Ativa</Pill>
  ) : (
    <Pill tone="warning">Suspensa</Pill>
  );
}

function segmentPillClass(token: string | null): string {
  const map: Record<string, string> = {
    danger: 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] text-[color:var(--color-danger-text)]',
    warning: 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-text)]',
    info: 'border-[color:var(--color-info-border)] bg-[color:var(--color-info-surface)] text-[color:var(--color-info-text)]',
    success: 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-text)]',
  };
  return (token && map[token]) || 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text-secondary)]';
}

function CustomerListItem({
  customer,
  onSelect,
  selected,
  segment,
}: {
  customer: CsCustomerPortfolio;
  onSelect: () => void;
  selected: boolean;
  segment: SegmentAssignment | null;
}) {
  const productSummary = customer.productContexts
    .slice(0, 2)
    .map((product: CsCustomerPortfolioProductContext) => product.productDisplayName)
    .join(', ');

  return (
    <button
      aria-pressed={selected}
      className={cx(
        'w-full border-b border-[color:var(--minimal-border)] px-4 py-3 text-left transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--minimal-focus)]',
        selected
          ? 'bg-[color:var(--minimal-selection)]'
          : 'bg-transparent hover:bg-[color:var(--minimal-surface-muted)]',
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cx(
            'min-w-0 truncate text-sm font-medium',
            selected
              ? 'text-[color:var(--minimal-selection-text)]'
              : 'text-[color:var(--minimal-text)]',
          )}
        >
          {customer.tenantDisplayName}
        </p>
        {customer.openTicketCount > 0 ? (
          <span className="shrink-0">
            <Pill tone="info">{customer.openTicketCount} abertos</Pill>
          </span>
        ) : (
          <span className="shrink-0 text-[11px] tabular-nums text-[color:var(--minimal-text-tertiary)]">
            sem abertos
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-xs text-[color:var(--minimal-text-secondary)]">
        {customer.csOwnerFullName ?? 'Owner CS não definido'}
      </p>
      <p className="mt-1.5 truncate text-[11px] text-[color:var(--minimal-text-tertiary)]">
        {productSummary || 'Sem produto ativo'}
      </p>
      {segment ? (
        <span className={cx('mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', segmentPillClass(segment.colorToken))}>
          {segment.segmentLabel}
        </span>
      ) : null}
    </button>
  );
}

function KpiCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 py-2.5">
      <p className="text-lg font-semibold tabular-nums leading-none text-[color:var(--minimal-text)]">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] text-[color:var(--minimal-text-tertiary)]">{label}</p>
    </div>
  );
}

function DefinitionRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(110px,0.42fr)_minmax(0,1fr)] gap-4 border-b border-[color:var(--minimal-border)] py-2.5 last:border-b-0">
      <dt className="text-xs text-[color:var(--minimal-text-tertiary)]">{label}</dt>
      <dd className="min-w-0 text-sm text-[color:var(--minimal-text)]">{value}</dd>
    </div>
  );
}

function CustomerDetail({ customer, segment }: { customer: CsCustomerPortfolio; segment: SegmentAssignment | null }) {
  const ticketStatuses = Object.entries(customer.ticketStatusCounts).filter(
    ([, count]) => Number(count) > 0,
  );

  return (
    <article className="min-h-0 overflow-y-auto bg-[color:var(--minimal-surface)]">
      <header className="border-b border-[color:var(--minimal-border)] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-[-0.025em] text-[color:var(--minimal-text)]">
              {customer.tenantDisplayName}
            </h2>
            <p className="mt-1 text-sm text-[color:var(--minimal-text-secondary)]">
              {customer.tenantLegalName}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {customer.tenantStatus === 'active' ? (
              <Pill tone="success">Conta ativa</Pill>
            ) : (
              <Pill tone="neutral">{customer.tenantStatus}</Pill>
            )}
            {segment ? (
              <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', segmentPillClass(segment.colorToken))}>
                {segment.segmentLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <KpiCell label="Tickets abertos" value={customer.openTicketCount} />
          <KpiCell label="No histórico" value={customer.totalTicketCount} />
          <KpiCell label="Produtos" value={customer.activeProductCount} />
          <KpiCell label="Assinaturas" value={customer.activeSubscriptionCount} />
        </div>
      </header>

      <div className="divide-y divide-[color:var(--minimal-border)]">
        <section className="grid gap-7 px-5 py-5 sm:px-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">
              Responsabilidade
            </h3>
            <dl className="mt-3">
              <DefinitionRow label="Owner CS" value={customer.csOwnerFullName ?? 'Não definido'} />
              <DefinitionRow label="Contato" value={customer.csOwnerEmail ?? 'Indisponível'} />
              <DefinitionRow
                label="Área"
                value={customer.csOwnerAreaDisplayName ?? 'Indisponível'}
              />
              <DefinitionRow
                label="Equipe"
                value={`${customer.customerSuccessMemberCount} membro(s) ativo(s)`}
              />
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">
              Leitura operacional
            </h3>
            <dl className="mt-3">
              <DefinitionRow label="Saúde da conta" value={<Pill tone="neutral">Indisponível</Pill>} />
              <DefinitionRow
                label="Atualização"
                value={formatDateTime(customer.lastOperationalUpdateAt)}
              />
            </dl>
            <p className="mt-3 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">
              {sanitizeCsOperationalText(customer.healthSummaryReason)}
            </p>
          </div>
        </section>

        <section className="px-5 py-5 sm:px-6">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">
              Produtos e planos
            </h3>
            <p className="text-xs text-[color:var(--minimal-text-tertiary)]">
              {customer.activeProductCount} produto(s)
            </p>
          </div>

          {customer.productContexts.length === 0 ? (
            <p className="mt-4 text-sm text-[color:var(--minimal-text-secondary)]">
              Nenhum produto ativo ou suspenso nesta conta.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-[color:var(--minimal-border)] text-xs text-[color:var(--minimal-text-tertiary)]">
                  <tr>
                    <th className="py-2 font-medium">Produto</th>
                    <th className="py-2 font-medium">Plano</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Recursos</th>
                    <th className="py-2 text-right font-medium">Renovação</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.productContexts.map((product: CsCustomerPortfolioProductContext) => (
                    <tr
                      className="border-b border-[color:var(--minimal-border)] last:border-b-0"
                      key={product.subscriptionId}
                    >
                      <td className="py-3 font-medium text-[color:var(--minimal-text)]">
                        {product.productDisplayName}
                      </td>
                      <td className="py-3 text-[color:var(--minimal-text-secondary)]">
                        {product.planDisplayName}
                      </td>
                      <td className="py-3">
                        <ProductStatusPill status={product.status} />
                      </td>
                      <td className="py-3 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">
                        {product.activeFeatureCount}
                      </td>
                      <td className="py-3 text-right text-[color:var(--minimal-text-secondary)]">
                        {formatDate(product.renewalAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Tickets</h3>
            <p className="text-xs text-[color:var(--minimal-text-secondary)]">
              {customer.openTicketCount} abertos, {customer.totalTicketCount} no histórico
            </p>
          </div>
          <div className="mt-3">
            {ticketStatuses.length === 0 ? (
              <p className="text-sm text-[color:var(--minimal-text-secondary)]">
                Sem tickets registrados.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ticketStatuses.map(([status, count]) => (
                  <span
                    className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-3 py-1.5 text-xs text-[color:var(--minimal-text-secondary)]"
                    key={status}
                  >
                    {TICKET_STATUS_LABELS[status as TicketStatus] ?? status}
                    <span
                      className={cx(
                        'tabular-nums font-semibold',
                        OPEN_TICKET_STATUSES.has(status)
                          ? 'text-[color:var(--color-info-text)]'
                          : 'text-[color:var(--minimal-text)]',
                      )}
                    >
                      {Number(count)}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}

function PortfolioEditor({
  customer,
  onSaved,
}: {
  customer: CsCustomerPortfolio;
  onSaved: () => Promise<void>;
}) {
  const assignment = customer.portfolioAssignment;
  const [name, setName] = useState(assignment.name === 'Sem carteira definida' ? 'Carteira principal' : assignment.name);
  const [serviceModel, setServiceModel] = useState(assignment.serviceModel ?? '');
  const [contactFrequency, setContactFrequency] = useState(assignment.contactFrequency ?? '');
  const [healthStatus, setHealthStatus] = useState(assignment.healthStatus ?? '');
  const [priority, setPriority] = useState(assignment.priority ?? '');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <section className="border-t border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-5 py-5 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Editar carteira</h3>
          <p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">
            Alterações ficam registradas com origem e histórico no banco.
          </p>
        </div>
        {saved ? <Pill tone="success">Salvo</Pill> : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-[color:var(--minimal-text-secondary)]">
          Nome da carteira
          <input className="mt-1 w-full rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 py-2 text-sm text-[color:var(--minimal-text)]" onChange={(event) => setName(event.target.value)} value={name} />
        </label>
        <label className="text-xs text-[color:var(--minimal-text-secondary)]">
          Modelo de atendimento
          <input className="mt-1 w-full rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 py-2 text-sm text-[color:var(--minimal-text)]" onChange={(event) => setServiceModel(event.target.value)} placeholder="Ex.: high_touch" value={serviceModel} />
        </label>
        <label className="text-xs text-[color:var(--minimal-text-secondary)]">
          Frequência de contato
          <input className="mt-1 w-full rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 py-2 text-sm text-[color:var(--minimal-text)]" onChange={(event) => setContactFrequency(event.target.value)} placeholder="Ex.: mensal" value={contactFrequency} />
        </label>
        <label className="text-xs text-[color:var(--minimal-text-secondary)]">
          Saúde
          <select className="mt-1 w-full rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 py-2 text-sm text-[color:var(--minimal-text)]" onChange={(event) => setHealthStatus(event.target.value)} value={healthStatus}>
            <option value="">Não informado</option>
            <option value="healthy">Saudável</option>
            <option value="attention">Atenção</option>
            <option value="risk">Risco</option>
          </select>
        </label>
        <label className="text-xs text-[color:var(--minimal-text-secondary)]">
          Prioridade
          <select className="mt-1 w-full rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 py-2 text-sm text-[color:var(--minimal-text)]" onChange={(event) => setPriority(event.target.value)} value={priority}>
            <option value="">Não informado</option>
            <option value="low">Baixa</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
          </select>
        </label>
        <label className="text-xs text-[color:var(--minimal-text-secondary)] sm:col-span-2">
          Observações da operação
          <textarea className="mt-1 min-h-20 w-full rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 py-2 text-sm text-[color:var(--minimal-text)]" onChange={(event) => setNotes(event.target.value)} placeholder="Registre apenas contexto operacional, sem credenciais." value={notes} />
        </label>
      </div>
      {error ? <p className="mt-3 text-xs text-[color:var(--color-danger-text)]">{error}</p> : null}
      <div className="mt-4 flex justify-end">
        <MinimalButton
          disabled={busy || !name.trim()}
          onClick={() => {
            setBusy(true);
            setError(null);
            setSaved(false);
            void upsertCsCustomerPortfolio({
              tenantId: customer.tenantId,
              portfolioName: name.trim(),
              assignmentStatus: assignment.status === 'unconfigured' ? 'active' : assignment.status,
              ownerUserId: assignment.ownerUserId,
              clusterKey: assignment.clusterKey,
              serviceModel: serviceModel.trim() || null,
              contactFrequency: contactFrequency.trim() || null,
              healthStatus: healthStatus || null,
              priority: priority || null,
              notes: notes.trim() || null,
              source: assignment.source ?? 'manual',
            })
              .then(async () => {
                setSaved(true);
                await onSaved();
              })
              .catch((cause: unknown) => {
                setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a carteira.');
              })
              .finally(() => setBusy(false));
          }}
          variant="primary"
        >
          {busy ? 'Salvando…' : 'Salvar carteira'}
        </MinimalButton>
      </div>
    </section>
  );
}

export function CsPortfolioPage() {
  const { portfolio, refreshPortfolio } = useCsPortfolio();
  const [segments, setSegments] = useState<Record<string, SegmentAssignment>>({});

  useEffect(() => {
    let cancelled = false;
    getSegmentAssignments()
      .then((map) => {
        if (!cancelled) setSegments(map);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [segment, setSegment] = useState<SegmentId>('all');

  const segmentCounts = useMemo(() => {
    return {
      all: portfolio.length,
      with_open: portfolio.filter((customer: CsCustomerPortfolio) => customer.openTicketCount > 0)
        .length,
      without_owner: portfolio.filter(
        (customer: CsCustomerPortfolio) => !customer.csOwnerFullName,
      ).length,
    } satisfies Record<SegmentId, number>;
  }, [portfolio]);

  const filteredPortfolio = useMemo(() => {
    const searched = filterCsCustomerPortfolio(portfolio, searchTerm);
    return searched.filter((customer: CsCustomerPortfolio) => matchesSegment(customer, segment));
  }, [portfolio, searchTerm, segment]);

  const [selectedCustomer, setSelectedCustomer] = useState<CsCustomerPortfolio | null>(null);

  if (portfolio.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-5">
        <MinimalState
          description="Nenhuma conta foi disponibilizada para a carteira CS."
          title="Carteira sem clientes"
        />
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-[color:var(--minimal-surface)]">
      <header className="flex shrink-0 flex-col gap-3 border-b border-[color:var(--minimal-border)] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">
              Carteira CS
            </h1>
            <p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">
              {portfolio.length} cliente(s) no escopo autorizado
            </p>
          </div>
            <MinimalTextInput
            aria-label="Buscar na carteira"
            className="w-full sm:w-72"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cliente, CNPJ, grupo, owner ou produto"
            type="search"
            value={searchTerm}
          />
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Segmentos da carteira">
          {SEGMENTS.map((item) => {
            const active = segment === item.id;
            return (
              <button
                aria-pressed={active}
                className={cx(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]',
                  active
                    ? 'border-transparent bg-[color:var(--minimal-action)] text-[color:var(--minimal-action-ink)]'
                    : 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] text-[color:var(--minimal-text-secondary)] hover:text-[color:var(--minimal-text)]',
                )}
                key={item.id}
                onClick={() => setSegment(item.id)}
                type="button"
              >
                {item.label}
                <span
                  className={cx(
                    'tabular-nums',
                    active ? 'text-[color:var(--minimal-action-ink)]' : 'text-[color:var(--minimal-text-tertiary)]',
                  )}
                >
                  {segmentCounts[item.id]}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-5 py-5 sm:px-6">
          {filteredPortfolio.length === 0 ? (
            <div className="p-5">
              <p className="text-sm font-medium text-[color:var(--minimal-text)]">
                Nenhum cliente encontrado
              </p>
              <p className="mt-1 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">
                Ajuste o termo ou o segmento para consultar a carteira autorizada.
              </p>
              <MinimalButton
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setSegment('all');
                }}
                variant="secondary"
              >
                Limpar filtros
              </MinimalButton>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)]">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-[11px] font-medium text-[color:var(--minimal-text-tertiary)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Carteira / cluster</th>
                    <th className="px-4 py-3 font-medium">Responsável</th>
                    <th className="px-4 py-3 font-medium">Saúde</th>
                    <th className="px-4 py-3 text-right font-medium">Tickets</th>
                    <th className="px-4 py-3 text-right font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--minimal-border)]">
                  {filteredPortfolio.map((customer: CsCustomerPortfolio) => {
                    const assignment = customer.portfolioAssignment;
                    const attention = customer.openTicketCount > 0 || assignment.healthStatus === 'risk' || !customer.csOwnerFullName;
                    return (
                      <tr className="group hover:bg-[color:var(--minimal-surface-muted)]" key={customer.tenantId}>
                        <td className="px-4 py-3">
                          <button className="text-left" onClick={() => setSelectedCustomer(customer)} type="button">
                            <span className="block max-w-[280px] truncate font-medium text-[color:var(--minimal-text)]">{customer.tenantDisplayName}</span>
                            <span className="mt-0.5 block max-w-[280px] truncate text-xs text-[color:var(--minimal-text-secondary)]">{customer.tenantLegalName}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="block text-[color:var(--minimal-text)]">{assignment.name}</span>
                          <span className="mt-0.5 block text-xs text-[color:var(--minimal-text-secondary)]">{assignment.clusterKey ?? 'Cluster não definido'}</span>
                        </td>
                        <td className="px-4 py-3 text-[color:var(--minimal-text-secondary)]">{customer.csOwnerFullName ?? 'Sem responsável'}</td>
                        <td className="px-4 py-3">
                          <Pill tone={attention ? 'warning' : 'success'}>{attention ? 'Atenção' : 'Estável'}</Pill>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-[color:var(--minimal-text)]">
                          {customer.openTicketCount} / {customer.totalTicketCount}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <MinimalButton onClick={() => setSelectedCustomer(customer)} variant="secondary">Abrir</MinimalButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {selectedCustomer ? (
        <div className="absolute inset-0 z-20 flex justify-end bg-black/20 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={`Detalhes de ${selectedCustomer.tenantDisplayName}`}>
          <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] shadow-2xl sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-[color:var(--minimal-border)] px-5 py-3">
              <span className="text-xs font-medium text-[color:var(--minimal-text-tertiary)]">Detalhes da conta</span>
              <button aria-label="Fechar detalhes" className="rounded-lg border border-[color:var(--minimal-border)] px-3 py-1.5 text-xs text-[color:var(--minimal-text-secondary)]" onClick={() => setSelectedCustomer(null)} type="button">Fechar</button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <CustomerDetail customer={selectedCustomer} segment={segments[selectedCustomer.tenantId] ?? null} />
              <PortfolioEditor customer={selectedCustomer} onSaved={async () => { await refreshPortfolio(); setSelectedCustomer(null); }} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
