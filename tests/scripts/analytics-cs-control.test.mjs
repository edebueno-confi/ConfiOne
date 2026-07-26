import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildCsSyncPayload, resolveCsSyncMode, sanitizeCsSyncResult } from '../../apps/web/src/features/analytics/analytics-cs-control.mjs';

const apiSource = await readFile(new URL('../../apps/web/src/features/analytics/analytics-api.ts', import.meta.url), 'utf8');
const configSource = await readFile(new URL('../../apps/web/src/features/analytics/AnalyticsConfigPage.tsx', import.meta.url), 'utf8');
const functionSource = await readFile(new URL('../../supabase/functions/hubspot-sync/index.ts', import.meta.url), 'utf8');

test('controle CS usa carga completa somente sem sucesso anterior e incremental depois', () => {
  assert.equal(resolveCsSyncMode(null), 'full');
  assert.deepEqual(buildCsSyncPayload(null), { scope: 'cs', full: true });
  assert.equal(resolveCsSyncMode({ status: 'error' }), 'full');
  assert.deepEqual(buildCsSyncPayload({ status: 'success' }), { scope: 'cs' });
});

test('resultado CS exibe somente contagens e correlation id sanitizado', () => {
  const result = sanitizeCsSyncResult({ status: 'success', mode: 'full', correlationId: '00000000-0000-4000-8000-000000000000', tickets: 0, owners: 2, stages: 3 });
  assert.deepEqual(result, { status: 'success', mode: 'full', correlationId: '00000000-0000-4000-8000-000000000000', tickets: 0, owners: 2, stages: 3 });
  assert.equal(sanitizeCsSyncResult({ correlationId: 'token-or-secret' }).correlationId, null);
});

test('controle e runner mantêm o escopo CS isolado e autenticado', () => {
  assert.match(apiSource, /body: JSON\.stringify\(buildCsSyncPayload\(latestRun\)\)/);
  assert.match(configSource, /Controle de CS \/ Suporte/);
  assert.match(configSource, /triggerCsSupportSync\(latestCsRun\)/);
  assert.match(functionSource, /const actor = await authorize\(req, client\)/);
  assert.match(functionSource, /scopeType === 'ticket'/);
  assert.doesNotMatch(apiSource, /service_role/i);
  assert.doesNotMatch(configSource, /HUBSPOT_PRIVATE_APP_TOKEN|SUPABASE_SERVICE_ROLE/i);
});

test('controle de CS não usa runner OMIE/Comercial e apresenta partial separadamente', () => {
  assert.doesNotMatch(configSource, /runIntegrationNow\(\).*runCsSupport/);
  assert.match(configSource, /result\.status === 'partial' \? 'Execução parcial'/);
  assert.match(functionSource, /correlationId: runRow\.correlation_id/);
});
