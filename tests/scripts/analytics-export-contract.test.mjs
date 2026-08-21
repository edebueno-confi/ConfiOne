import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const exportSource = await readFile(new URL('../../apps/web/src/features/analytics/analytics-export.ts', import.meta.url), 'utf8');
const modal = await readFile(new URL('../../apps/web/src/features/analytics/AnalyticsReportExport.tsx', import.meta.url), 'utf8');
const modelSource = await readFile(new URL('../../apps/web/src/features/analytics/analytics-model.ts', import.meta.url), 'utf8');

test('exportação bloqueia relatório sem dados exportáveis', () => {
  assert.match(exportSource, /NON_EXPORTABLE_STATUSES/);
  assert.match(exportSource, /hasExportableAnalyticsData/);
  assert.match(modal, /hasExportableAnalyticsData\(data\)/);
  assert.match(modal, /getCommercialSnapshot\(filters, \[\], groupCompany \|\| null\)/);
  assert.match(modal, /groupCompany \? Promise\.resolve\(undefined\)/);
  assert.match(modal, /disabled=\{!hasExportableData \|\| !selected\.length\}/);
  assert.match(modal, /Não há dados exportáveis nas abas selecionadas/);
  assert.match(modelSource, /conversionRate: conversionRate === null \? null : conversionRate \/ 100/);
  assert.match(exportSource, /formatCommercialConversionRate\(c\.conversionRate\)/);
  assert.match(exportSource, /formatCommercialConversionRate\(data\.ceo\.commercial\.conversionRate\)/);
  assert.doesNotMatch(exportSource, /formatPercent\(c\.conversionRate\)/);
});
