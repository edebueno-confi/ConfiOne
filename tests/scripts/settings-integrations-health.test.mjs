import assert from 'node:assert/strict';
import test from 'node:test';

const {
  UNAVAILABLE_LABEL,
  credentialState,
  lastRunState,
  summarizeIntegrations,
  toneClassName,
  toneTextClassName,
} = await import('../../apps/web/src/features/settings/integrations/integration-health.mjs');

function integration(overrides = {}) {
  return {
    label: 'HubSpot',
    isEnabled: true,
    hasCredentials: true,
    lastRunStatus: 'success',
    lastRunAt: '2026-08-04T10:00:00Z',
    updatedAt: '2026-08-04T10:00:00Z',
    ...overrides,
  };
}

test('estado da credencial distingue desativada, pendente e configurada', () => {
  assert.equal(credentialState({ isEnabled: false, hasCredentials: true }).key, 'disabled');
  assert.equal(credentialState({ isEnabled: true, hasCredentials: false }).key, 'pending');
  assert.equal(credentialState({ isEnabled: true, hasCredentials: true }).key, 'configured');
});

test('execução sem registro não é apresentada como sucesso', () => {
  assert.equal(lastRunState({ lastRunStatus: 'never' }).tone, 'muted');
  assert.equal(lastRunState({ lastRunStatus: 'error' }).tone, 'danger');
  assert.equal(lastRunState({ lastRunStatus: 'partial' }).tone, 'warning');
  assert.equal(lastRunState({ lastRunStatus: 'success' }).tone, 'success');
});

test('sem integração ativa o resumo não afirma operação saudável', () => {
  const summary = summarizeIntegrations([integration({ isEnabled: false })]);
  assert.equal(summary.health, 'idle');
  assert.equal(summary.enabled, 0);
  assert.equal(summary.total, 1);
});

test('falha na última execução tem precedência sobre credencial pendente', () => {
  const summary = summarizeIntegrations([
    integration({ label: 'HubSpot', lastRunStatus: 'error' }),
    integration({ label: 'OMIE', hasCredentials: false, lastRunStatus: 'never' }),
  ]);
  assert.equal(summary.health, 'failure');
  assert.match(summary.healthDetail, /HubSpot/);
  assert.equal(summary.pendingCredentials, 1);
});

test('resumo usa a execução mais recente e identifica a fonte', () => {
  const summary = summarizeIntegrations([
    integration({ label: 'HubSpot', lastRunAt: '2026-08-01T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' }),
    integration({ label: 'OMIE', lastRunAt: '2026-08-03T21:30:00Z', updatedAt: '2026-08-03T21:30:00Z' }),
  ]);
  assert.equal(summary.health, 'ok');
  assert.equal(summary.lastRunAt, '2026-08-03T21:30:00Z');
  assert.equal(summary.lastRunLabel, 'OMIE');
  assert.equal(summary.updatedAt, '2026-08-03T21:30:00Z');
});

test('ausência de execução mantém o campo nulo para a interface exibir indisponível', () => {
  const summary = summarizeIntegrations([integration({ lastRunAt: null, lastRunStatus: 'never' })]);
  assert.equal(summary.lastRunAt, null);
  assert.equal(summary.health, 'attention');
  assert.equal(UNAVAILABLE_LABEL, 'Indisponível');
});

test('tons reutilizam as classes publicadas de Configurações', () => {
  assert.equal(toneClassName('danger'), 'gso-settings-status--failed');
  assert.equal(toneClassName('desconhecido'), 'gso-settings-status--muted');
  assert.equal(toneTextClassName('warning'), 'gso-settings-tone-warning');
  assert.equal(toneTextClassName('desconhecido'), 'gso-settings-tone-muted');
});
