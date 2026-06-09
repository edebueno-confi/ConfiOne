import assert from 'node:assert/strict';
import test from 'node:test';

import { runReconciledMutation } from '../../scripts/lib/reconciled-mutation.mjs';

test('returns the persisted result after an ambiguous transport failure without duplicating the mutation', async () => {
  let mutationAttempts = 0;

  const result = await runReconciledMutation({
    mutate: async () => {
      mutationAttempts += 1;
      throw new TypeError('fetch failed');
    },
    reconcile: async () => 'persisted-ticket-id',
  });

  assert.equal(result, 'persisted-ticket-id');
  assert.equal(mutationAttempts, 1);
});

test('retries once when reconciliation confirms that nothing was persisted', async () => {
  let mutationAttempts = 0;

  const result = await runReconciledMutation({
    mutate: async () => {
      mutationAttempts += 1;
      if (mutationAttempts === 1) {
        throw new TypeError('fetch failed');
      }

      return 'created-ticket-id';
    },
    reconcile: async () => null,
  });

  assert.equal(result, 'created-ticket-id');
  assert.equal(mutationAttempts, 2);
});
