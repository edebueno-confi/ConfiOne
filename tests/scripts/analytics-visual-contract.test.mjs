import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const summaryCharts = await readFile(
  new URL('../../apps/web/src/features/analytics/charts/AnalyticsCharts.tsx', import.meta.url),
  'utf8',
);
const trendCharts = await readFile(
  new URL('../../apps/web/src/features/analytics/charts/AnalyticsTrendCharts.tsx', import.meta.url),
  'utf8',
);
const kpiBoard = await readFile(
  new URL('../../apps/web/src/features/analytics/AnalyticsKpiBoard.tsx', import.meta.url),
  'utf8',
);

test('barras coloridas usam shape público e rótulos de leitura direta', () => {
  assert.doesNotMatch(summaryCharts, /\bCell\b/, 'Cell foi deprecated na linha 3.x');
  assert.match(summaryCharts, /type BarShapeProps/);
  assert.equal((summaryCharts.match(/<LabelList\b/g) ?? []).length, 3);
  assert.match(summaryCharts, /shape=\{ChartBarShape\}/);
});

test('tooltips multi-eixo e legendas seguem a ordem visual declarada', () => {
  for (const axisId of ['mes', 'qtd', 'mov']) {
    assert.match(trendCharts, new RegExp(`<Tooltip[\\s\\S]*?axisId="${axisId}"`),
      `Tooltip precisa seguir o eixo ${axisId}`);
  }
  assert.equal((trendCharts.match(/position="bottom"/g) ?? []).length, 3);
  assert.equal((trendCharts.match(/itemSorter=\{null\}/g) ?? []).length, 3);
});

test('primeiro KPI de cada faixa recebe hierarquia de leitura', () => {
  assert.match(kpiBoard, /data-priority=\{priority\}/);
  assert.match(kpiBoard, /index === 0 \? 'lead' : 'support'/);
});
