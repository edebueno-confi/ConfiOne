import { useEffect, useMemo, useState } from 'react';
import type {
  CsCustomerPortfolio,
  TicketStatus,
} from '../../contracts/support-contracts';
import { MinimalState } from '../../components/minimal-states';
import {
  MinimalButton,
  MinimalTextInput,
} from '../../components/minimal-ui';
import { cx } from '../../components/ui';
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
    return 'Não informado';
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

function sanitizeCsOperationalText(value: string | null | undefined) {
  return (value ?? 'IndisponÃ­vel')
    .replace(/Health score\s+n[aã]o materializado neste contrato\./gi, 'Health ainda indisponÃ­vel nesta visÃ£o.')
    .replace(/\bcontratos?\b/gi, 'acordos operacionais')
    .replace(/\bbackend\b/gi, 'operaÃ§Ã£o')
    .replace(/\bRPCs?\b/g, 'rotina operacional')
    .replace(/\btenant\b/gi, 'cliente');
}

function CustomerListItem({
  customer,
  onSelect,
  selected,
}: {
  customer: CsCustomerPortfolio;
  onSelect: () => void;
  selected: boolean;
}) {
  const productSummary = customer.productContexts
    .slice(0, 2)
    .map((product) => product.productDisplayName)
    .join(', ');

  return (
    <button
      aria-pressed={selected}
      className={cx(
        'w-full border-b border-[color:var(--minimal-border)] px-4 py-3.5 text-left transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--minimal-focus)]',
        selected
          ? 'bg-[color:var(--minimal-selection)]'
          : 'bg-transparent hover:bg-[color:var(--minimal-surface-muted)]',
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[color:var(--minimal-text)]">
            {customer.tenantDisplayName}
          </p>
          <p className="mt-1 truncate text-xs text-[color:var(--minimal-text-secondary)]">
            {customer.csOwnerFullName ?? 'Owner CS não definido'}
          </p>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-[color:var(--minimal-text-secondary)]">
          {customer.openTicketCount} abertos
        </span>
      </div>
      <p className="mt-2 truncate text-xs text-[color:var(--minimal-text-tertiary)]">
        {productSummary || 'Sem produto ativo'}
      </p>
    </button>
  );
}

function DefinitionRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="grid grid-cols-[minmax(110px,0.42fr)_minmax(0,1fr)] gap-4 border-b border-[color:var(--minimal-border)] py-2.5 last:border-b-0">
      <dt className="text-xs text-[color:var(--minimal-text-tertiary)]">{label}</dt>
      <dd className="min-w-0 text-sm text-[color:var(--minimal-text)]">{value}</dd>
    </div>
  );
}

function CustomerDetail({ customer }: { customer: CsCustomerPortfolio }) {
  const ticketStatuses = Object.entries(customer.ticketStatusCounts).filter(
    ([, count]) => Number(count) > 0,
  );

  return (
    <article className="min-h-0 overflow-y-auto bg-[color:var(--minimal-surface)]">
      <header className="border-b border-[color:var(--minimal-border)] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-[-0.025em]">
              {customer.tenantDisplayName}
            </h2>
            <p className="mt-1 text-sm text-[color:var(--minimal-text-secondary)]">
              {customer.tenantLegalName}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--minimal-border)] px-2.5 py-1 text-xs text-[color:var(--minimal-text-secondary)]">
            <span
              aria-hidden="true"
              className={cx(
                'h-1.5 w-1.5 rounded-full',
                customer.tenantStatus === 'active'
                  ? 'bg-emerald-500'
                  : 'bg-[color:var(--minimal-text-tertiary)]',
              )}
            />
            {customer.tenantStatus === 'active' ? 'Conta ativa' : customer.tenantStatus}
          </span>
        </div>
      </header>

      <div className="divide-y divide-[color:var(--minimal-border)]">
        <section className="grid gap-7 px-5 py-5 sm:px-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Responsabilidade</h3>
            <dl className="mt-3">
              <DefinitionRow
                label="Owner CS"
                value={customer.csOwnerFullName ?? 'Não definido'}
              />
              <DefinitionRow
                label="Contato"
                value={customer.csOwnerEmail ?? 'Indisponível'}
              />
              <DefinitionRow
                label="Equipe"
                value={`${customer.customerSuccessMemberCount} membro(s) ativo(s)`}
              />
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Leitura operacional</h3>
            <dl className="mt-3">
              <DefinitionRow label="Health" value="Indisponível" />
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
            <h3 className="text-sm font-semibold">Produtos e planos</h3>
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
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-[color:var(--minimal-border)] text-xs text-[color:var(--minimal-text-tertiary)]">
                  <tr>
                    <th className="py-2 font-medium">Produto</th>
                    <th className="py-2 font-medium">Plano</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Renovação</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.productContexts.map((product) => (
                    <tr
                      className="border-b border-[color:var(--minimal-border)] last:border-b-0"
                      key={product.subscriptionId}
                    >
                      <td className="py-3 font-medium">{product.productDisplayName}</td>
                      <td className="py-3 text-[color:var(--minimal-text-secondary)]">
                        {product.planDisplayName}
                      </td>
                      <td className="py-3 text-[color:var(--minimal-text-secondary)]">
                        {product.status === 'active' ? 'Ativa' : 'Suspensa'}
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
            <h3 className="text-sm font-semibold">Tickets</h3>
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
              <dl>
                {ticketStatuses.map(([status, count]) => (
                  <DefinitionRow
                    key={status}
                    label={TICKET_STATUS_LABELS[status as TicketStatus] ?? status}
                    value={Number(count)}
                  />
                ))}
              </dl>
            )}
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
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[color:var(--minimal-border)] px-5 py-4 sm:px-6">
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.02em]">Carteira de clientes</h1>
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
      </header>

      <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto border-r border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)]">
          {filteredPortfolio.length === 0 ? (
            <div className="p-5">
              <p className="text-sm font-medium">Nenhum cliente encontrado</p>
              <p className="mt-1 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">
                Ajuste o termo para consultar a carteira autorizada.
              </p>
              <MinimalButton
                className="mt-4"
                onClick={() => setSearchTerm('')}
                variant="secondary"
              >
                Limpar busca
              </MinimalButton>
            </div>
          ) : (
            filteredPortfolio.map((customer) => (
              <CustomerListItem
                customer={customer}
                key={customer.tenantId}
                onSelect={() => setSelectedTenantId(customer.tenantId)}
                selected={customer.tenantId === selectedTenantId}
              />
            ))
          )}
        </aside>

        {selectedCustomer ? (
          <CustomerDetail customer={selectedCustomer} />
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
