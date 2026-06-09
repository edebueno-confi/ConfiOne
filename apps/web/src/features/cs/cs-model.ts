import type {
  CsCustomerPortfolio,
  CsCustomerPortfolioProductContext,
  TicketStatus,
} from '../../contracts/support-contracts';

type PortfolioRow = Record<string, unknown>;

function mapProductContext(value: unknown): CsCustomerPortfolioProductContext | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  return {
    subscriptionId: String(row.subscriptionId),
    productKey: String(row.productKey),
    productDisplayName: String(row.productDisplayName),
    planKey: String(row.planKey),
    planDisplayName: String(row.planDisplayName),
    status: row.status === 'suspended' ? 'suspended' : 'active',
    startedAt: (row.startedAt as string | null) ?? null,
    endedAt: (row.endedAt as string | null) ?? null,
    renewalAt: (row.renewalAt as string | null) ?? null,
    activeFeatureCount: Number(row.activeFeatureCount ?? 0),
    activeOwnerCount: Number(row.activeOwnerCount ?? 0),
  };
}

function mapTicketStatusCounts(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([status, count]) => [
      status as TicketStatus,
      Number(count ?? 0),
    ]),
  ) as Partial<Record<TicketStatus, number>>;
}

export function mapCsCustomerPortfolio(row: PortfolioRow): CsCustomerPortfolio {
  const productContexts = Array.isArray(row.product_contexts)
    ? row.product_contexts.map(mapProductContext).filter((item) => item !== null)
    : [];

  return {
    tenantId: String(row.tenant_id),
    tenantSlug: String(row.tenant_slug),
    tenantDisplayName: String(row.tenant_display_name),
    tenantLegalName: String(row.tenant_legal_name),
    tenantStatus: String(row.tenant_status),
    portfolioScope: 'customer_success_area',
    csOwnerUserId: (row.cs_owner_user_id as string | null) ?? null,
    csOwnerFullName: (row.cs_owner_full_name as string | null) ?? null,
    csOwnerEmail: (row.cs_owner_email as string | null) ?? null,
    csOwnerAreaKey:
      (row.cs_owner_area_key as CsCustomerPortfolio['csOwnerAreaKey']) ?? null,
    csOwnerAreaDisplayName:
      (row.cs_owner_area_display_name as string | null) ?? null,
    activeSubscriptionCount: Number(row.active_subscription_count ?? 0),
    activeProductCount: Number(row.active_product_count ?? 0),
    productContexts,
    openTicketCount: Number(row.open_ticket_count ?? 0),
    totalTicketCount: Number(row.total_ticket_count ?? 0),
    ticketStatusCounts: mapTicketStatusCounts(row.ticket_status_counts),
    customerSuccessMemberCount: Number(row.customer_success_member_count ?? 0),
    healthSummaryStatus: 'unavailable',
    healthSummaryReason: String(row.health_summary_reason ?? ''),
    lastOperationalUpdateAt: String(row.last_operational_update_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function normalizeSearchValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export function filterCsCustomerPortfolio(
  portfolio: CsCustomerPortfolio[],
  rawTerm: string,
) {
  const term = normalizeSearchValue(rawTerm.trim());
  if (!term) {
    return portfolio;
  }

  return portfolio.filter((customer) => {
    const searchable = [
      customer.tenantDisplayName,
      customer.tenantLegalName,
      customer.tenantSlug,
      customer.csOwnerFullName,
      customer.csOwnerEmail,
      ...customer.productContexts.flatMap((product) => [
        product.productDisplayName,
        product.productKey,
        product.planDisplayName,
        product.planKey,
      ]),
    ]
      .filter((value): value is string => Boolean(value))
      .map(normalizeSearchValue)
      .join(' ');

    return searchable.includes(term);
  });
}
