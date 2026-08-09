import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const api = await readFile(
  new URL('../../apps/web/src/features/settings/settings-api.ts', import.meta.url),
  'utf8',
);

test('Integrações combina credencial com o read model canônico de execuções', () => {
  assert.match(api, /rpc\('rpc_analytics_source_status'\)/);
  assert.match(api, /lastAttemptAt/);
  assert.match(api, /lastRunStatus/);
});
