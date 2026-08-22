import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const component = await readFile(
  new URL('../../apps/web/src/features/analytics/AnalyticsOperationScope.tsx', import.meta.url),
  'utf8',
);

test('seletor de operacao publica cada operacao somente uma vez', () => {
  assert.match(component, /dedupeAnalyticsOperationOptions/);
  assert.match(component, /new Map/);
  assert.match(component, /toLocaleLowerCase\('pt-BR'\)/);
  assert.match(component, /options\.filter\(\(candidate\) => candidate\.source === 'confirmed'\)/);
});
