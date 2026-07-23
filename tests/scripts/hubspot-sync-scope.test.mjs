import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeHubspotSyncScope,
  scopeObjectType,
  syncsCompanies,
  syncsPipelines,
} from '../../supabase/functions/_shared/hubspot-sync-scope.mjs';

test('normaliza escopos conhecidos e protege entrada inválida', () => {
  assert.equal(normalizeHubspotSyncScope('companies'), 'companies');
  assert.equal(normalizeHubspotSyncScope('COMMERCIAL'), 'commercial');
  assert.equal(normalizeHubspotSyncScope('cs'), 'cs');
  assert.equal(normalizeHubspotSyncScope('desconhecido'), 'all');
  assert.equal(normalizeHubspotSyncScope(null), 'all');
});

test('separa carga de empresas da carga por pipeline', () => {
  assert.equal(syncsCompanies('all'), true);
  assert.equal(syncsCompanies('companies'), true);
  assert.equal(syncsCompanies('commercial'), false);
  assert.equal(syncsPipelines('companies'), false);
  assert.equal(syncsPipelines('commercial'), true);
  assert.equal(syncsPipelines('cs'), true);
});

test('mapeia escopos de pipeline para o tipo HubSpot correto', () => {
  assert.equal(scopeObjectType('commercial'), 'deal');
  assert.equal(scopeObjectType('cs'), 'ticket');
  assert.equal(scopeObjectType('companies'), null);
  assert.equal(scopeObjectType('all'), null);
});
