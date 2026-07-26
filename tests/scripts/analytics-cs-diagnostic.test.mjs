import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const edge = fs.readFileSync('supabase/functions/hubspot-cs-diagnostic/index.ts', 'utf8');
const hubspot = fs.readFileSync('supabase/functions/_shared/hubspot.ts', 'utf8');
const api = fs.readFileSync('apps/web/src/features/analytics/analytics-api.ts', 'utf8');
const card = fs.readFileSync('apps/web/src/features/analytics/HubspotCsDiagnosticCard.tsx', 'utf8');
const config = fs.readFileSync('apps/web/src/features/analytics/AnalyticsConfigPage.tsx', 'utf8');

test('diagnóstico exige platform_admin e consulta apenas tickets', () => {
  assert.match(edge, /getClaims/);
  assert.match(edge, /role.*platform_admin/s);
  assert.match(edge, /fetchTicketPipelineTotal/);
  assert.match(hubspot, /fetchTicketPipelineTotal[\s\S]*properties: \[\]/);
  assert.doesNotMatch(edge, /hubspot-sync|omie-sync/);
  assert.doesNotMatch(edge, /email|phone|response\.body|returnBody/);
});

test('frontend usa cliente Supabase autenticado e não expõe token', () => {
  assert.match(api, /client\.functions\.invoke\('hubspot-cs-diagnostic'/);
  assert.doesNotMatch(api, /localStorage|service_role/);
  assert.match(card, /enabled/);
  assert.match(config, /HubspotCsDiagnosticCard/);
});
