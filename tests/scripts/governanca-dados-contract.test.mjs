import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('governanca de dados expoe nomenclatura e quatro abas sem alterar a rota', () => {
  const page = read('apps/web/src/features/settings/DashboardSourcesSettingsPage.tsx');
  const navigation = read('apps/web/src/features/navigation/minimal-navigation.ts');
  const settings = read('apps/web/src/features/settings/SettingsPage.tsx');

  assert.match(page, /useSearchParams/);
  assert.match(page, /sources.*Fontes/s);
  assert.match(page, /pipelines.*Pipelines/s);
  assert.match(page, /stages.*Etapas/s);
  assert.match(page, /reconciliation.*Concilia/s);
  assert.match(navigation, /label:\s*['"]Governan.*dados['"]/);
  assert.match(settings, /label:\s*['"]Governan.*dados['"]/);
});

test('indicadores de governanca nao usam metricas fabricadas', () => {
  const page = read('apps/web/src/features/settings/DashboardSourcesSettingsPage.tsx');

  for (const forbidden of ['Hoje, 08:45', '3 de 5', '2 fontes aguardando', 'activeCount || 3', 'pendingCount || 2']) {
    assert.doesNotMatch(page, new RegExp(escapeRegExp(forbidden)));
  }

  assert.match(page, /sourcePills\.filter/);
  assert.match(page, /rows\.filter\(\(row\) => row\.isActive\)/);
  assert.match(page, /lastSuccessAt/);
});

test('conciliacao usa paginacao real, filtros e primitives do design system', () => {
  const panel = read('apps/web/src/features/settings/CompanyReconciliationPanel.tsx');
  const api = read('apps/web/src/features/settings/company-reconciliation-api.ts');
  const runtimeConfig = read('apps/web/src/app/runtime-config.ts');

  assert.match(api, /p_limit/);
  assert.match(api, /p_offset/);
  assert.match(panel, /UiSearchField/);
  assert.match(panel, /UiToolbar/);
  assert.match(panel, /UiPagination/);
  assert.match(panel, /UiMetricRow/);
  assert.match(panel, /UiSortHeader/);
  assert.match(panel, /gso-ui-split--wide-detail/);
  assert.match(panel, /Sugest/);
  assert.match(panel, /buildHubSpotCompanyUrl/);
  assert.match(runtimeConfig, /VITE_HUBSPOT_PORTAL_ID/);
  assert.match(runtimeConfig, /app\.hubspot\.com\/contacts/);
});

test('telas de governanca nao carregam nomes de fixtures de QA como dados de produto', () => {
  const source = [
    read('apps/web/src/features/settings/DashboardSourcesSettingsPage.tsx'),
    read('apps/web/src/features/settings/StageMappingSettings.tsx'),
    read('apps/web/src/features/settings/CompanyReconciliationPanel.tsx'),
    read('apps/web/src/features/settings/PipelineRoleSettings.tsx'),
  ].join('\n');

  for (const fixtureName of ['QA Local Comercial', 'QA Aurora Comércio', 'QA Horizonte Digital', 'QA Atlas Operações']) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(fixtureName)));
  }
});

test('harness cobre indicadores proibidos e quatro abas de governanca', () => {
  const harness = read('scripts/local-qa/verify-mock-removal-and-layout-v1.mjs');

  for (const forbidden of ['Hoje, 08:45', '3 de 5', '2 fontes aguardando']) {
    assert.match(harness, new RegExp(escapeRegExp(forbidden)));
  }

  for (const tab of ['?tab=sources', '?tab=pipelines', '?tab=stages', '?tab=reconciliation']) {
    assert.match(harness, new RegExp(escapeRegExp(tab)));
  }
});
