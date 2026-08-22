import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
  new URL('../../scripts/local-qa/support-operational-write-smoke.mjs', import.meta.url),
  'utf8',
);

test('Support Operational Write Smoke permanece local, temporário e auditável', () => {
  assert.match(source, /ui-writes\.mjs/);
  assert.match(source, /LOCAL_QA_WEB_URL/);
  assert.match(source, /--enable.*support_queue,support_tickets/);
  assert.match(source, /--disable/);
  assert.match(source, /VITE_RELEASE_SURFACE: 'full'/);
  assert.match(source, /assertLocalSupabaseEnvironment/);
});
