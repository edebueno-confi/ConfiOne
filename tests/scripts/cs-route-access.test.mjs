import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canOpenInternalRoute,
  getDefaultInternalLandingRoute,
} from '../../apps/web/src/features/auth/internal-route-access.ts';

const csContext = {
  roles: [],
  hasCustomerPortalAccess: false,
  hasInternalActionAreaAccess: true,
  hasCsPortfolioAccess: true,
};

test('allows CS routes only for platform admins or users with portfolio access', () => {
  assert.equal(canOpenInternalRoute('/cs/portfolio', csContext), true);
  assert.equal(
    canOpenInternalRoute('/cs/portfolio', {
      ...csContext,
      hasCsPortfolioAccess: false,
    }),
    false,
  );
  assert.equal(
    canOpenInternalRoute('/cs/portfolio', {
      ...csContext,
      roles: ['platform_admin'],
      hasCsPortfolioAccess: false,
    }),
    true,
  );
});

test('uses CS portfolio before generic internal actions for CS members', () => {
  assert.equal(getDefaultInternalLandingRoute(csContext), '/cs/portfolio');
});
