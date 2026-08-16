import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

test('knowledge editor resets the new article form and dark canvas tokens', () => {
  const source = fs.readFileSync(path.join(root, 'apps/web/src/features/knowledge/KnowledgeArticleEditorPage.tsx'), 'utf8');
  assert.match(source, /setForm\(EMPTY_FORM\)/);
  assert.match(source, /nextForm \?\? \{[\s\S]+categoryId: loadedCategories\[0\]\?\.id/);
  assert.match(source, /\[data-theme='dark'\] \.knowledge-rich-editor \.ProseMirror p/);
  assert.match(source, /\[data-theme='dark'\] \.knowledge-toolbar-popover input/);
});

test('sync history is collapsible and finance uses the shared editorial KPI grid', () => {
  const history = fs.readFileSync(path.join(root, 'apps/web/src/features/settings/SyncHistorySettingsPage.tsx'), 'utf8');
  const finance = fs.readFileSync(path.join(root, 'apps/web/src/features/analytics/AnalyticsFinancePage.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'apps/web/src/index.css'), 'utf8');
  assert.match(history, /<details className="gso-ui-historygroup"/);
  assert.match(history, /<summary>/);
  assert.match(finance, /gso-pilot-finance/);
  assert.match(finance, /gso-pilot-kpi-grid/);
  assert.match(css, /\.gso-pilot-finance > \.gso-pilot-kpi-grid/);
});
