import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { areAnalyticsSourcesActive, isAnalyticsSourceActive, syncProgressLabel } from '../../apps/web/src/features/analytics/analytics-sync-progress.mjs';

const sourcesPage = await readFile(new URL('../../apps/web/src/features/settings/DashboardSourcesSettingsPage.tsx', import.meta.url), 'utf8');
const overlay = await readFile(new URL('../../apps/web/src/components/GeniusSyncOverlay.tsx', import.meta.url), 'utf8');
const analyticsShell = await readFile(new URL('../../apps/web/src/features/analytics/AnalyticsShell.tsx', import.meta.url), 'utf8');
const analyticsOverview = await readFile(new URL('../../apps/web/src/features/analytics/AnalyticsCeoPage.tsx', import.meta.url), 'utf8');

const source = (overrides = {}) => ({ status: 'fresh', currentRunStatus: null, ...overrides });

test('identifica execução ativa sem confundir falha publicada com sincronização', () => {
  assert.equal(isAnalyticsSourceActive(source({ status: 'syncing', currentRunStatus: 'running' })), true);
  assert.equal(isAnalyticsSourceActive(source({ status: 'failed', currentRunStatus: 'failed' })), false);
  assert.equal(isAnalyticsSourceActive(source({ status: 'fresh', currentRunStatus: 'queued' })), true);
});

test('Visão Geral oferece o ciclo protegido sem criar uma regra paralela', () => {
  assert.match(analyticsShell, /triggerSequentialAnalyticsSync/);
  assert.match(analyticsShell, /waitForAnalyticsSyncCompletion\('full'\)/);
  assert.match(analyticsShell, /areAnalyticsSourcesActive\(currentStatus, 'full'\)/);
  assert.match(analyticsShell, /canManageAnalyticsIntegration/);
  assert.match(analyticsOverview, /data-testid="overview-sync-sources"/);
  assert.match(analyticsOverview, /Sincronizar bases/);
  assert.match(analyticsOverview, /canSyncSources/);
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
  assert.match(sourcesPage, /GeniusSyncOverlay/);
  assert.match(sourcesPage, /hasValidSnapshot/);
  assert.match(sourcesPage, /terminalSyncState/);
  assert.match(sourcesPage, /currentRunStatus === 'timed_out'/);
  assert.match(sourcesPage, /currentRunStatus === 'abandoned'/);
  assert.match(sourcesPage, /state: 'failed'/);
  assert.match(sourcesPage, /if \(finalState === 'publishing'\) setSyncFeedback\(null\)/);
  assert.match(overlay, /O Gênio está organizando os dados do painel/);
  assert.match(overlay, /O Gênio encontrou um desvio no caminho/);
  assert.match(overlay, /O Gênio ainda está aguardando uma resposta/);
  assert.match(overlay, /O Gênio interrompeu esta tentativa/);
  assert.match(overlay, /Acompanhar no Histórico/);
  assert.doesNotMatch(overlay, /barra|progresso|countdown/i);
});
