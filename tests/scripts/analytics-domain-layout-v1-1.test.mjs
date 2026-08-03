import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const shell = await readFile(new URL('../../apps/web/src/features/analytics/AnalyticsShell.tsx', import.meta.url), 'utf8');
const filters = await readFile(new URL('../../apps/web/src/features/analytics/AnalyticsFilters.tsx', import.meta.url), 'utf8');
const domains = await readFile(new URL('../../apps/web/src/features/analytics/analytics-domains.ts', import.meta.url), 'utf8');
const waiting = await readFile(new URL('../../apps/web/src/features/analytics/AnalyticsUnavailablePages.tsx', import.meta.url), 'utf8');
const ceo = await readFile(new URL('../../apps/web/src/features/analytics/AnalyticsCeoPage.tsx', import.meta.url), 'utf8');
const ui = await readFile(new URL('../../apps/web/src/features/analytics/analytics-ui.tsx', import.meta.url), 'utf8');
const charts = await readFile(new URL('../../apps/web/src/features/analytics/charts/AnalyticsCharts.tsx', import.meta.url), 'utf8');

test('dashboard por domínio não renderiza container global nem filtro de domínio', () => {
  assert.doesNotMatch(shell, /gso-source-rail/);
  assert.doesNotMatch(filters, /Todos os domínios|Domínio em foco/);
  assert.match(ceo, /AnalyticsStateBadge/);
});

test('navegação publica Produto e Desenvolvimento em uma única aba de espera', () => {
  assert.match(domains, /key: 'product-development'[\s\S]*enabled: true/);
  assert.match(waiting, /Modo de espera por integração/);
  assert.match(waiting, /GitHub/);
  assert.doesNotMatch(waiting, /fetch\(|supabase|axios|XMLHttpRequest/);
});

test('KPIs e gráficos compactos possuem semântica de leitura', () => {
  assert.match(ui, /data-kpi-role=\{resolvedSemantic\}/);
  assert.match(ui, /gso-kpi-snapshot-marker/);
  assert.match(charts, /CompactSummary/);
  assert.match(charts, /CompactTemporalSummary/);
});
