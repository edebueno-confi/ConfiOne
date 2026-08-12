import test from 'node:test';
import assert from 'node:assert/strict';
import { mapCommercialKpiDetails } from '../../apps/web/src/features/analytics/analytics-model.ts';

test('preserva ganhos fechados por responsável e o detalhamento auditável do período', () => {
  const result = mapCommercialKpiDetails({
    by_owner: [
      { owner_id: 'owner-pedro', owner_name: 'Pedro Santos', open_deals: 22, won_deals: 1, won_amount: 4000 },
      { owner_id: 'owner-lucas', owner_name: 'Lucas Sacramento', open_deals: 24, won_deals: 1, won_amount: 3000 },
    ],
    closed_wins: [
      { deal_id: '54744523356', deal_name: 'Contrato Pedro', owner_name: 'Pedro Santos', closed_on: '2026-08-06', amount_home: 4000 },
      { deal_id: '59854632523', deal_name: 'Contrato Lucas', owner_name: 'Lucas Sacramento', closed_on: '2026-08-06', amount_home: 3000 },
    ],
  });

  assert.deepEqual(result.byOwner, [
    { ownerId: 'owner-pedro', ownerName: 'Pedro Santos', openDeals: 22, openAmount: 0, wonDeals: 1, lostDeals: 0, wonAmount: 4000, winRate: null, medianCycleDays: null },
    { ownerId: 'owner-lucas', ownerName: 'Lucas Sacramento', openDeals: 24, openAmount: 0, wonDeals: 1, lostDeals: 0, wonAmount: 3000, winRate: null, medianCycleDays: null },
  ]);
  assert.deepEqual(result.closedWins, [
    { dealId: '54744523356', dealName: 'Contrato Pedro', ownerName: 'Pedro Santos', closedOn: '2026-08-06', amountHome: 4000 },
    { dealId: '59854632523', dealName: 'Contrato Lucas', ownerName: 'Lucas Sacramento', closedOn: '2026-08-06', amountHome: 3000 },
  ]);
});
