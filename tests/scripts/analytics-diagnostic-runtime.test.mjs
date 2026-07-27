import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const api = await readFile(new URL('../../apps/web/src/features/analytics/analytics-api.ts', import.meta.url), 'utf8');

test('diagnóstico HubSpot normaliza arrays opcionais antes da renderização', () => {
  assert.match(api, /Array\.isArray\(payload\.scopesPresent\)/);
  assert.match(api, /Array\.isArray\(payload\.scopesAbsent\)/);
  assert.match(api, /Array\.isArray\(payload\.pipelines\)/);
});
