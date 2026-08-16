import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const api = await readFile(new URL('../../apps/web/src/features/analytics/analytics-api.ts', import.meta.url), 'utf8');

test('diagnóstico financeiro normaliza coleções opcionais antes da renderização', () => {
  assert.match(api, /Array\.isArray\(summary\.by_client_status\)/);
  assert.match(api, /Array\.isArray\(summary\.unmatched_companies\)/);
  assert.match(api, /Array\.isArray\(summary\.identity_issues\)/);
});
