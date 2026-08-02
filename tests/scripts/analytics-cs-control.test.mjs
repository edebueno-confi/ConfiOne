import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildCsSyncPayload, resolveCsSyncMode, sanitizeCsSyncResult } from '../../apps/web/src/features/analytics/analytics-cs-control.mjs';

const apiSource = await readFile(new URL('../../apps/web/src/features/analytics/analytics-api.ts', import.meta.url), 'utf8');
const configSource = await readFile(new URL('../../apps/web/src/features/settings/DashboardSourcesSettingsPage.tsx', import.meta.url), 'utf8');
const functionSource = await readFile(new URL('../../supabase/functions/hubspot-orchestrator-start/index.ts', import.meta.url), 'utf8');

test('backend decide a janela CS e o frontend envia somente o escopo', () => {
  assert.equal(resolveCsSyncMode(null), 'full');
  assert.deepEqual(buildCsSyncPayload(null), { scope: 'cs' });
  assert.equal(resolveCsSyncMode({ status: 'error' }), 'full');
  assert.deepEqual(buildCsSyncPayload({ status: 'success' }), { scope: 'cs' });
});

test('resultado CS exibe somente contagens e correlation id sanitizado', () => {
  const result = sanitizeCsSyncResult({ status: 'success', mode: 'full', correlationId: '00000000-0000-4000-8000-000000000000', tickets: 0, owners: 2, stages: 3 });
  assert.deepEqual(result, { status: 'success', mode: 'full', correlationId: '00000000-0000-4000-8000-000000000000', tickets: 0, owners: 2, stages: 3, runId: null });
  assert.equal(sanitizeCsSyncResult({ correlationId: 'token-or-secret' }).correlationId, null);
});

test('controle e runner mantêm o escopo CS isolado e autenticado', () => {
  assert.match(apiSource, /hubspot-orchestrator-start/);
  assert.match(configSource, /Atualizar HubSpot/);
  assert.match(configSource, /triggerHubspotSync\(undefined/);
  assert.match(functionSource, /authorizeCsRunner/);
  assert.match(functionSource, /rpc_analytics_hubspot_start_run/);
  assert.doesNotMatch(apiSource, /service_role/i);
  assert.doesNotMatch(configSource, /HUBSPOT_PRIVATE_APP_TOKEN|SUPABASE_SERVICE_ROLE/i);
});

test('controle de CS não usa runner OMIE/Comercial e apresenta partial separadamente', () => {
  assert.doesNotMatch(configSource, /triggerCsSupportSync/);
  assert.match(configSource, /statusLabel\(source\.status\)/);
  assert.match(apiSource, /domain: 'cs_support'/);
});
