import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('diagnóstico legado não é publicado nem possui consumidor', () => {
  assert.equal(fs.existsSync('supabase/functions/hubspot-cs-diagnostic/index.ts'), false);
  assert.equal(fs.existsSync('apps/web/src/features/analytics/HubspotCsDiagnosticCard.tsx'), false);
  assert.equal(fs.existsSync('apps/web/src/features/analytics/AnalyticsConfigPage.tsx'), false);
  assert.equal(fs.existsSync('apps/web/src/features/analytics/AnalyticsLogsPage.tsx'), false);
  const config = fs.readFileSync('supabase/config.toml', 'utf8');
  assert.doesNotMatch(config, /hubspot-cs-diagnostic/);
});
