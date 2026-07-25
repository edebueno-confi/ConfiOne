import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = join(process.cwd(), 'tests', 'fixtures', 'analytics');
const files = [
  'commercial.snapshot.json',
  'cs.snapshot.json',
  'finance.snapshot.json',
  'ceo.snapshot-period-comparison.json',
  'empty.snapshots.json',
  'sync-runs-states.json',
];

test('fixtures do Dashboard-02 cobrem estados e não contêm segredos', async () => {
  const contents = await Promise.all(files.map((file) => readFile(join(root, file), 'utf8')));
  const combined = contents.join('\n');
  assert.match(combined, /"status": "empty"/);
  assert.match(combined, /"status": "partial"/);
  assert.match(combined, /"status": "stale"/);
  assert.match(combined, /"status": "not_configured"/);
  assert.match(combined, /"status": "unavailable"/);
  assert.doesNotMatch(combined, /(Bearer |service_role|access_token|client_secret|password)/i);
  for (const content of contents) assert.doesNotThrow(() => JSON.parse(content));
});
