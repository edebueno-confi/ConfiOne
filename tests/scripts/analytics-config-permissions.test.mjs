import assert from 'node:assert/strict';
import test from 'node:test';

import { canManageAnalyticsIntegration } from '../../apps/web/src/features/analytics/analytics-permissions.mjs';

test('somente platform_admin pode alterar ou executar a integração OMIE HubSpot', () => {
  assert.equal(canManageAnalyticsIntegration({ is_platform_admin: true }), true);
  assert.equal(canManageAnalyticsIntegration({ is_platform_admin: false, roles: ['dashboard_viewer'] }), false);
  assert.equal(canManageAnalyticsIntegration(null), false);
});
