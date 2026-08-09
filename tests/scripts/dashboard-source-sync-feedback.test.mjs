import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../../apps/web/src/features/settings/DashboardSourcesSettingsPage.tsx', import.meta.url), 'utf8');

test('conflito de sincronização mantém o acompanhamento ativo em vez de exibir falha', () => {
  assert.match(source, /function isSyncAlreadyRunning/);
  assert.match(source, /if \(isSyncAlreadyRunning\(cause\)\)/);
  assert.match(source, /getAnalyticsSourceStatus\(\)\.catch\(\(\) => null\)/);
});
