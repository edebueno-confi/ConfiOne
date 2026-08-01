import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pages = await Promise.all([
  readFile('apps/web/src/features/analytics/AnalyticsCommercialPage.tsx', 'utf8'),
  readFile('apps/web/src/features/analytics/AnalyticsCsPage.tsx', 'utf8'),
  readFile('apps/web/src/features/analytics/AnalyticsFinancePage.tsx', 'utf8'),
]);

test('abas analíticas preservam dados prontos durante atualização parcial', () => {
  for (const source of pages) {
    assert.match(source, /setState\(\(current\) => current\.phase === 'ready' \? current : \{ phase: 'loading' \}\)/);
  }
});

test('sincronização do período não cria estado novo quando as datas já estão alinhadas', () => {
  for (const source of pages) {
    assert.match(source, /current\.from === period\.from && current\.to === period\.to/);
  }
});
