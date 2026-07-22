import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateLatestHubspotSyncRuns } from '../../apps/web/src/features/analytics/analytics-sync-runs.mjs';

function run(domainKey, startedAt, counts = {}, status = 'success') {
  return {
    id: `${domainKey}-${startedAt}`,
    domainKey,
    status,
    startedAt,
    finishedAt: startedAt,
    dealsSynced: counts.deals ?? 0,
    ticketsSynced: counts.tickets ?? 0,
    ownersSynced: counts.owners ?? 0,
    stagesSynced: counts.stages ?? 0,
    companiesSynced: counts.companies ?? 0,
    errorMessage: null,
  };
}

test('agrega a execução faseada mais recente somente quando as três etapas estão completas', () => {
  const runs = [
    run('cs', '2026-07-21T22:22:46.000Z', { stages: 31 }),
    run('commercial', '2026-07-21T22:22:38.000Z', { deals: 1147, stages: 12 }),
    run('companies', '2026-07-21T22:22:37.000Z', { companies: 2, owners: 31 }),
    run('cs', '2026-07-21T22:22:01.000Z', { stages: 31 }),
  ];

  const result = aggregateLatestHubspotSyncRuns(runs);

  assert.equal(result.domainKey, 'phased');
  assert.equal(result.companiesSynced, 2);
  assert.equal(result.dealsSynced, 1147);
  assert.equal(result.ticketsSynced, 0);
  assert.equal(result.ownersSynced, 31);
  assert.equal(result.stagesSynced, 43);
  assert.equal(result.startedAt, '2026-07-21T22:22:37.000Z');
});

test('não agrupa etapas antigas, incompletas ou uma etapa intermediária', () => {
  const incomplete = [
    run('commercial', '2026-07-21T22:22:38.000Z', { deals: 1147 }),
    run('companies', '2026-07-21T22:22:37.000Z', { companies: 2 }),
  ];
  assert.equal(aggregateLatestHubspotSyncRuns(incomplete), incomplete[0]);

  const stale = [
    run('cs', '2026-07-21T22:22:46.000Z'),
    run('commercial', '2026-07-21T22:19:00.000Z'),
    run('companies', '2026-07-21T22:18:00.000Z'),
  ];
  assert.equal(aggregateLatestHubspotSyncRuns(stale), stale[0]);
});
