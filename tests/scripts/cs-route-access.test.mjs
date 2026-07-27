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

test('allows CS routes only for users with portfolio access', () => {
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
    false,
  );
});

test('uses CS portfolio before generic internal actions for CS members', () => {
  assert.equal(getDefaultInternalLandingRoute(csContext), '/cs/portfolio');
});

test('authorizes contextual screen grants without requiring a global role', () => {
  const contextualContext = {
    roles: [],
    screenKeys: ['analytics', 'knowledge'],
    hasCustomerPortalAccess: false,
    hasInternalActionAreaAccess: false,
    hasCsPortfolioAccess: false,
  };

  assert.equal(canOpenInternalRoute('/admin/analytics', contextualContext), true);
  assert.equal(canOpenInternalRoute('/admin/knowledge', contextualContext), true);
  assert.equal(canOpenInternalRoute('/admin/access', contextualContext), false);
  assert.equal(getDefaultInternalLandingRoute(contextualContext), '/admin/analytics');
});
