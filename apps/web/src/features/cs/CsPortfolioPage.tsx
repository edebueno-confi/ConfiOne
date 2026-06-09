import { useEffect, useMemo, useState } from 'react';
import type {
  CsCustomerPortfolio,
  TicketStatus,
} from '../../contracts/support-contracts';
import { EmptyState } from '../../components/states';
import { GhostButton, StatusPill, cx } from '../../components/ui';
import { filterCsCustomerPortfolio } from './cs-api';
import { useCsPortfolio } from './CsGate';

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

function formatDate(value: string | null) {
  if (!value) {
    return 'Nao informado';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function CustomerListItem({
  customer,
  selected,
  onSelect,
}: {
  customer: CsCustomerPortfolio;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={cx(
        'w-full rounded-[16px] border px-3.5 py-3 text-left transition',
        selected
          ? 'border-[rgba(48,127,226,0.34)] bg-[rgba(48,127,226,0.09)] shadow-[0_10px_24px_rgba(38,83,162,0.09)]'
          : 'border-transparent bg-transparent hover:border-[color:var(--color-border)] hover:bg-white',
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[color:var(--color-ink)]">
            {customer.tenantDisplayName}
          </p>
          <p className="mt-1 truncate text-xs text-[color:var(--color-muted)]">
            {customer.csOwnerFullName ?? 'Owner CS nao definido'}
          </p>
        </div>
        <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-[rgba(48,127,226,0.1)] px-2 py-1 text-xs font-bold text-[color:var(--color-brand-blue)]">
          {customer.openTicketCount}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {customer.productContexts.slice(0, 2).map((product) => (
          <span
            className="rounded-full border border-[color:var(--color-border)] bg-white/84 px-2 py-1 text-[0.68rem] font-semibold text-[color:var(--color-muted)]"
            key={product.subscriptionId}
          >
            {product.productDisplayName}
          </span>
        ))}
      </div>
    </button>
  );
}

function CustomerDetail({ customer }: { customer: CsCustomerPortfolio }) {
  const ticketStatuses = Object.entries(customer.ticketStatusCounts).filter(
    ([, count]) => Number(count) > 0,
  );

  return (
    <article className="min-h-0 overflow-y-auto rounded-[24px] border border-[color:var(--color-border)] bg-white/94 shadow-[0_18px_42px_rgba(19,33,79,0.08)]">
      <header className="border-b border-[color:var(--color-border)] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-blue)]">
              Cliente B2B
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[color:var(--color-ink)]">
              {customer.tenantDisplayName}
            </h2>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">
              {customer.tenantLegalName}
            </p>
          </div>
          <StatusPill tone={customer.tenantStatus === 'active' ? 'positive' : 'default'}>
            {customer.tenantStatus === 'active' ? 'Conta ativa' : customer.tenantStatus}
          </StatusPill>
        </div>
      </header>

      <div className="divide-y divide-[color:var(--color-border)]">
        <section className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Responsabilidade CS
            </p>
            <p className="mt-3 text-base font-bold text-[color:var(--color-ink)]">
              {customer.csOwnerFullName ?? 'Owner CS nao definido'}
            </p>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">
              {customer.csOwnerEmail ?? 'Sem contato de owner materializado'}
            </p>
            <p className="mt-3 text-xs text-[color:var(--color-muted)]">
              {customer.customerSuccessMemberCount}{' '}
              {customer.customerSuccessMemberCount === 1
                ? 'membro ativo na carteira'
                : 'membros ativos na carteira'}
            </p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Health
            </p>
            <p className="mt-2 text-base font-bold text-[color:var(--color-ink)]">
              Indisponivel
            </p>
            <p className="mt-1 text-sm leading-5 text-[color:var(--color-muted)]">
              {customer.healthSummaryReason}
            </p>
          </div>
        </section>

        <section className="px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Produtos e planos
              </p>
              <p className="mt-2 text-sm text-[color:var(--color-muted)]">
                {customer.activeProductCount} produtos em{' '}
                {customer.activeSubscriptionCount} subscriptions
              </p>
            </div>
          </div>

          {customer.productContexts.length === 0 ? (
            <p className="mt-4 rounded-[16px] bg-[color:var(--color-surface-muted)] px-4 py-4 text-sm text-[color:var(--color-muted)]">
              Nenhum produto ativo ou suspenso nesta conta.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[color:var(--color-border)] border-y border-[color:var(--color-border)]">
              {customer.productContexts.map((product) => (
                <div
                  className="grid gap-3 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(150px,0.7fr)_minmax(180px,0.9fr)] md:items-center"
                  key={product.subscriptionId}
                >
                  <div>
                    <p className="font-bold text-[color:var(--color-ink)]">
                      {product.productDisplayName}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                      Plano {product.planDisplayName}
                    </p>
                  </div>
                  <StatusPill tone={product.status === 'active' ? 'positive' : 'default'}>
                    {product.status === 'active' ? 'Ativa' : 'Suspensa'}
                  </StatusPill>
                  <div className="text-xs leading-5 text-[color:var(--color-muted)]">
                    <p>{product.activeFeatureCount} features ativas</p>
                    <p>Renovacao: {formatDate(product.renewalAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="px-5 py-5 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
            Operacao de tickets
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[140px_140px_minmax(0,1fr)]">
            <div>
              <p className="text-3xl font-bold tracking-[-0.05em] text-[color:var(--color-ink)]">
                {customer.openTicketCount}
              </p>
              <p className="mt-1 text-xs text-[color:var(--color-muted)]">Tickets abertos</p>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-[-0.05em] text-[color:var(--color-ink)]">
                {customer.totalTicketCount}
              </p>
              <p className="mt-1 text-xs text-[color:var(--color-muted)]">Total historico</p>
            </div>
            <div className="flex flex-wrap content-start gap-2">
              {ticketStatuses.length === 0 ? (
                <span className="text-sm text-[color:var(--color-muted)]">
                  Sem tickets registrados.
                </span>
              ) : (
                ticketStatuses.map(([status, count]) => (
                  <span
                    className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-ink)]"
                    key={status}
                  >
                    {TICKET_STATUS_LABELS[status as TicketStatus] ?? status}: {count}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}

export function CsPortfolioPage() {
  const { portfolio } = useCsPortfolio();
  const [searchTerm, setSearchTerm] = useState('');
  const filteredPortfolio = useMemo(
    () => filterCsCustomerPortfolio(portfolio, searchTerm),
    [portfolio, searchTerm],
  );
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(
    portfolio[0]?.tenantId ?? null,
  );

  useEffect(() => {
    if (!filteredPortfolio.some((item) => item.tenantId === selectedTenantId)) {
      setSelectedTenantId(filteredPortfolio[0]?.tenantId ?? null);
    }
  }, [filteredPortfolio, selectedTenantId]);

  const selectedCustomer =
    filteredPortfolio.find((item) => item.tenantId === selectedTenantId) ?? null;
  const latestUpdate = portfolio.reduce<string | null>(
    (latest, customer) =>
      !latest ||
      new Date(customer.lastOperationalUpdateAt) > new Date(latest)
        ? customer.lastOperationalUpdateAt
        : latest,
    null,
  );

  if (portfolio.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-5">
        <EmptyState
          description="Nenhum tenant foi materializado no contrato de carteira CS."
          title="Carteira sem clientes"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,#eef4ff_0%,#f7faff_42%,#f3f6fb_100%)] p-3 sm:p-4">
      <header className="shrink-0 rounded-[22px] border border-[color:var(--color-border)] bg-white/94 px-4 py-4 shadow-[0_14px_30px_rgba(19,33,79,0.07)] sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[color:var(--color-brand-blue)]">
              Customer Success
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[color:var(--color-ink)]">
              Carteira de clientes
            </h1>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">
              {portfolio.length} {portfolio.length === 1 ? 'cliente autorizado' : 'clientes autorizados'}
            </p>
          </div>
          <p className="text-xs text-[color:var(--color-muted)]">
            Atualizacao operacional: {latestUpdate ? formatDateTime(latestUpdate) : 'indisponivel'}
          </p>
        </div>
      </header>

      <div className="mt-3 grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col rounded-[22px] border border-[color:var(--color-border)] bg-white/90 p-3 shadow-[0_14px_30px_rgba(19,33,79,0.06)]">
          <label className="sr-only" htmlFor="cs-portfolio-search">
            Buscar na carteira
          </label>
          <input
            className="h-11 w-full rounded-[14px] border border-[color:var(--color-border)] bg-white px-3.5 text-sm text-[color:var(--color-ink)] outline-none transition placeholder:text-[color:var(--color-muted)] focus:border-[rgba(48,127,226,0.42)] focus:ring-2 focus:ring-[rgba(48,127,226,0.12)]"
            id="cs-portfolio-search"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cliente, owner, produto ou plano"
            type="search"
            value={searchTerm}
          />

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
            {filteredPortfolio.length === 0 ? (
              <div className="px-2 py-8 text-center">
                <p className="text-sm font-bold text-[color:var(--color-ink)]">
                  Nenhum cliente encontrado
                </p>
                <p className="mt-2 text-xs leading-5 text-[color:var(--color-muted)]">
                  Ajuste o termo para consultar a carteira autorizada.
                </p>
                <GhostButton className="mt-4" onClick={() => setSearchTerm('')}>
                  Limpar busca
                </GhostButton>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredPortfolio.map((customer) => (
                  <CustomerListItem
                    customer={customer}
                    key={customer.tenantId}
                    onSelect={() => setSelectedTenantId(customer.tenantId)}
                    selected={customer.tenantId === selectedTenantId}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        <div className="min-h-0">
          {selectedCustomer ? (
            <CustomerDetail customer={selectedCustomer} />
          ) : (
            <EmptyState
              description="Selecione um cliente da carteira para consultar o contexto operacional."
              title="Nenhum cliente selecionado"
            />
          )}
        </div>
      </div>
    </div>
  );
}
