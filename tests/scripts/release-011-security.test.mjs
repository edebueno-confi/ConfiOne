import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { resolveHelpCenterIntegrationLinks } from '../../apps/web/src/app/runtime-config.ts';

const viewerMigration = fs.readFileSync(
  'supabase/migrations/20260724200000_restrict_dashboard_viewer_knowledge_access.sql',
  'utf8',
);
const reconciliationMigration = fs.readFileSync(
  'supabase/migrations/20260724123000_knowledge_public_asset_reconciliation_v1.sql',
  'utf8',
);
const routeAccess = fs.readFileSync(
  'apps/web/src/features/auth/internal-route-access.ts',
  'utf8',
);

test('correção forward-only mantém dashboard_viewer fora do gate editorial', () => {
  assert.doesNotMatch(viewerMigration, /has_global_role\('dashboard_viewer'/);
  assert.match(viewerMigration, /has_any_global_role/);
  assert.match(viewerMigration, /platform_admin/);
  assert.match(viewerMigration, /knowledge_manager/);
  assert.match(routeAccess, /dashboard_viewer/);
  assert.match(routeAccess, /matchesRoute\(routePathname, '\/admin\/analytics'\)/);
});

test('reconciliação de assets não contém operação destrutiva', () => {
  assert.doesNotMatch(reconciliationMigration, /\b(delete|truncate)\s+from\b/i);
  assert.doesNotMatch(reconciliationMigration, /alter\s+table[\s\S]*\bdrop\b/i);
  assert.match(reconciliationMigration, /update public\.knowledge_article_assets/);
  assert.match(reconciliationMigration, /storage_bucket = 'knowledge-public-assets'/);
  assert.match(reconciliationMigration, /exists\s*\(/);
});

test('URLs externas aceitam apenas HTTPS e preservam fallback seguro', () => {
  const links = resolveHelpCenterIntegrationLinks({
    VITE_HELP_CENTER_API_DOCS_URL: 'https://docs.example.test/openapi',
    VITE_HELP_CENTER_SWAGGER_URL: 'javascript:alert(1)',
    VITE_HELP_CENTER_QA_URL: 'http://qa.example.test',
    VITE_HELP_CENTER_MOCK_URL: 'https://mock.example.test',
  });

  assert.equal(links.apiDocs, 'https://docs.example.test/openapi');
  assert.equal(links.swagger, 'https://integration.geniusreturns.com.br/swagger/index.html');
  assert.equal(links.qa, 'https://integration-qa.geniusreturns.com.br');
  assert.equal(links.mock, 'https://mock.example.test/');
  for (const value of Object.values(links).filter(Boolean)) {
    assert.equal(new URL(value).protocol, 'https:');
  }
});
