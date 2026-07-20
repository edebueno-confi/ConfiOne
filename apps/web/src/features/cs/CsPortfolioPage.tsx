import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  CsCustomerPortfolio,
  CsCustomerPortfolioProductContext,
  TicketStatus,
} from '../../contracts/support-contracts';
import { MinimalState } from '../../components/minimal-states';
import { MinimalButton, MinimalTextInput } from '../../components/minimal-ui';
import { cx } from '../../components/ui';
import { filterCsCustomerPortfolio } from './cs-api';
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

export function CsPortfolioPage() {
  const { portfolio } = useCsPortfolio();
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

  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(
    portfolio[0]?.tenantId ?? null,
  );

  useEffect(() => {
    if (!filteredPortfolio.some((item: CsCustomerPortfolio) => item.tenantId === selectedTenantId)) {
      setSelectedTenantId(filteredPortfolio[0]?.tenantId ?? null);
    }
  }, [filteredPortfolio, selectedTenantId]);

  const selectedCustomer =
    filteredPortfolio.find((item: CsCustomerPortfolio) => item.tenantId === selectedTenantId) ??
    null;

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
    <div className="flex h-full min-h-0 flex-col bg-[color:var(--minimal-surface)]">
      <header className="flex shrink-0 flex-col gap-3 border-b border-[color:var(--minimal-border)] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">
              Carteira de clientes
            </h1>
            <p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">
              {portfolio.length} cliente(s) no escopo autorizado
            </p>
          </div>
          <MinimalTextInput
            aria-label="Buscar na carteira"
            className="w-full sm:w-72"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cliente, owner, produto ou plano"
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

      <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto border-r border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)]">
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
            filteredPortfolio.map((customer: CsCustomerPortfolio) => (
              <CustomerListItem
                segment={segments[customer.tenantId] ?? null}
                customer={customer}
                key={customer.tenantId}
                onSelect={() => setSelectedTenantId(customer.tenantId)}
                selected={customer.tenantId === selectedTenantId}
              />
            ))
          )}
        </aside>

        {selectedCustomer ? (
          <CustomerDetail customer={selectedCustomer} segment={segments[selectedCustomer.tenantId] ?? null} />
        ) : (
          <div className="flex items-center justify-center p-5">
            <MinimalState
              description="Selecione um cliente para consultar o contexto operacional."
              title="Nenhum cliente selecionado"
            />
          </div>
        )}
      </div>
    </div>
  );
}
