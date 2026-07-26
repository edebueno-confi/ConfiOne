import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const component = await readFile(new URL('../../apps/web/src/features/analytics/AnalyticsPipelineCombobox.tsx', import.meta.url), 'utf8');
const commercial = await readFile(new URL('../../apps/web/src/features/analytics/AnalyticsCommercialPage.tsx', import.meta.url), 'utf8');
const support = await readFile(new URL('../../apps/web/src/features/analytics/AnalyticsCsPage.tsx', import.meta.url), 'utf8');

test('combobox oferece todos, busca, selecao e persistencia por aba', () => {
  assert.match(component, /Todos os pipelines/);
  assert.match(component, /Buscar pipeline/);
  assert.match(component, /role="listbox"/);
  assert.match(component, /sessionStorage/);
  assert.match(component, /analytics-pipeline-combobox/);
  assert.match(commercial, /analytics-commercial-pipelines/);
  assert.match(support, /analytics-cs-pipelines/);
});
