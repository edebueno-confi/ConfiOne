import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../apps/web/src/features/settings/settings-api.ts', import.meta.url), 'utf8');

test('a API ativa de integrações publica somente HubSpot e OMIE', () => {
  assert.match(source, /provider: 'hubspot' \| 'omie';/);
  assert.match(source, /isPublishedIntegrationProvider/);
  assert.match(source, /\.filter\(\(row\) => isPublishedIntegrationProvider/);
  assert.doesNotMatch(source, /provider: 'hubspot' \| 'omie' \| 'google_sheets'/);
});

console.log('analytics-settings-api-contract: ok');
