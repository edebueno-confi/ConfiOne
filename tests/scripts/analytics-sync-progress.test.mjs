import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { areAnalyticsSourcesActive, isAnalyticsSourceActive, syncProgressLabel } from '../../apps/web/src/features/analytics/analytics-sync-progress.mjs';

const sourcesPage = await readFile(new URL('../../apps/web/src/features/settings/DashboardSourcesSettingsPage.tsx', import.meta.url), 'utf8');

const source = (overrides = {}) => ({ status: 'fresh', currentRunStatus: null, ...overrides });

test('identifica execução ativa sem confundir falha publicada com sincronização', () => {
  assert.equal(isAnalyticsSourceActive(source({ status: 'syncing', currentRunStatus: 'running' })), true);
  assert.equal(isAnalyticsSourceActive(source({ status: 'failed', currentRunStatus: 'failed' })), false);
  assert.equal(isAnalyticsSourceActive(source({ status: 'fresh', currentRunStatus: 'queued' })), true);
});

test('polling respeita a fonte solicitada e o ciclo completo', () => {
  const payload = { hubspot: source({ currentRunStatus: 'running' }), omie: source({ status: 'failed', currentRunStatus: 'failed' }) };
  assert.equal(areAnalyticsSourcesActive(payload, 'hubspot'), true);
  assert.equal(areAnalyticsSourcesActive(payload, 'omie'), false);
  assert.equal(areAnalyticsSourcesActive(payload, 'full'), true);
});

test('mensagem de timeout não promete conclusão', () => {
  assert.match(syncProgressLabel('full', true), /continua no servidor/i);
  assert.match(syncProgressLabel('full'), /concluídos/i);
});

test('atualização dos dashboards mantém o Gênio animado até confirmar o estado publicado', () => {
  assert.match(sourcesPage, /waitForAnalyticsSyncCompletion\(kind\)/);
  assert.match(sourcesPage, /GeniusMascot/);
  assert.match(sourcesPage, /aria-busy="true"/);
  assert.match(sourcesPage, /A tela será liberada somente após confirmar o estado publicado/);
});
