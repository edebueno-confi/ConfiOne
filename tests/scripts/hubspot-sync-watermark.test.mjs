import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeHubspotSyncScope,
  usesDomainSyncWatermark,
} from '../../supabase/functions/_shared/hubspot-sync-scope.mjs';

test('cada domínio possui marco incremental próprio', () => {
  assert.equal(usesDomainSyncWatermark(normalizeHubspotSyncScope('cs')), true);
  assert.equal(usesDomainSyncWatermark(normalizeHubspotSyncScope('commercial')), true);
  assert.equal(usesDomainSyncWatermark(normalizeHubspotSyncScope('companies')), true);
  assert.equal(usesDomainSyncWatermark(normalizeHubspotSyncScope('all')), false);
});
