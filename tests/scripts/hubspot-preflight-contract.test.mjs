import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const preflight = await readFile(new URL('../../supabase/functions/analytics-hubspot-preflight/index.ts', import.meta.url), 'utf8');

test('preflight HubSpot é protegido, read-only e sanitizado', () => {
  assert.match(preflight, /authorizeCsRunner/);
  assert.match(preflight, /resolveHubSpotToken/);
  assert.match(preflight, /fetchPipelineDefinitions\('deals', token\)/);
  assert.match(preflight, /writesExternalData: false/);
  assert.match(preflight, /classifyHubSpotError/);
  assert.doesNotMatch(preflight, /rpc_analytics_hubspot_start_run|analytics_sync_cycles/);
  assert.doesNotMatch(preflight, /console\.log|token\s*[,}]/);
});
