import assert from 'node:assert/strict';
import test from 'node:test';

import {
  filterCsCustomerPortfolio,
  mapCsCustomerPortfolio,
} from '../../apps/web/src/features/cs/cs-model.ts';

const row = {
  tenant_id: 'tenant-a',
  tenant_slug: 'loja-alpha',
  tenant_display_name: 'Loja Alpha',
  tenant_legal_name: 'Alpha Comercio LTDA',
  tenant_status: 'active',
  portfolio_scope: 'customer_success_area',
  cs_owner_user_id: 'owner-a',
  cs_owner_full_name: 'Marina Oliveira',
  cs_owner_email: 'marina@example.com',
  cs_owner_area_key: null,
  cs_owner_area_display_name: null,
  active_subscription_count: 2,
  active_product_count: 2,
  product_contexts: [
    {
      subscriptionId: 'subscription-a',
      productKey: 'genius_returns',
      productDisplayName: 'Genius Returns',
      planKey: 'enterprise',
      planDisplayName: 'Enterprise',
      status: 'active',
      startedAt: '2026-01-01T00:00:00Z',
      endedAt: null,
      renewalAt: '2027-01-01T00:00:00Z',
      activeFeatureCount: 4,
      activeOwnerCount: 2,
    },
  ],
  open_ticket_count: 3,
  total_ticket_count: 8,
  ticket_status_counts: { in_progress: 2, waiting_customer: 1, closed: 5 },
  customer_success_member_count: 2,
  health_summary_status: 'unavailable',
  health_summary_reason: 'Health score nao materializado neste contrato.',
  last_operational_update_at: '2026-06-09T12:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-06-09T12:00:00Z',
};

test('maps the CS portfolio view into the frontend contract', () => {
  const result = mapCsCustomerPortfolio(row);

  assert.equal(result.tenantDisplayName, 'Loja Alpha');
  assert.equal(result.csOwnerFullName, 'Marina Oliveira');
  assert.equal(result.productContexts[0].planDisplayName, 'Enterprise');
  assert.deepEqual(result.ticketStatusCounts, {
    in_progress: 2,
    waiting_customer: 1,
    closed: 5,
  });
  assert.equal(result.healthSummaryStatus, 'unavailable');
});

test('filters by customer, owner, product and plan without changing the source', () => {
  const portfolio = [mapCsCustomerPortfolio(row)];

  for (const term of ['alpha', 'marina', 'genius returns', 'enterprise']) {
    assert.equal(filterCsCustomerPortfolio(portfolio, term).length, 1);
  }

  assert.equal(filterCsCustomerPortfolio(portfolio, 'nao existe').length, 0);
  assert.equal(portfolio.length, 1);
});
