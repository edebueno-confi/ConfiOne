import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const page = fs.readFileSync('apps/web/src/features/analytics/AnalyticsCeoPage.tsx', 'utf8');
const executive = fs.readFileSync('apps/web/src/features/analytics/analytics-executive.ts', 'utf8');
const shell = fs.readFileSync('apps/web/src/features/analytics/AnalyticsShell.tsx', 'utf8');

test('visão executiva mantém período separado da posição atual', () => {
  assert.match(page, /Desempenho no período/);
  assert.match(page, /Posição atual, não afetada pelo período selecionado/);
  assert.match(page, /Domínio em foco/);
});

test('ranking de pipelines é determinístico e limitado a cinco', () => {
  assert.match(executive, /sort\(\(left, right\) => right\.ticketCount - left\.ticketCount/);
  assert.match(executive, /slice\(0, limit\)/);
  assert.match(executive, /limit = 5/);
});

test('exceções são rastreáveis e usam somente rotas existentes', () => {
  assert.match(executive, /severity/);
  assert.match(executive, /\/admin\/analytics\/commercial/);
  assert.match(executive, /\/admin\/analytics\/cs/);
  assert.match(executive, /\/admin\/analytics\/finance/);
  assert.doesNotMatch(executive, /analytics\/pipelines/);
  assert.match(executive, /slice\(0, 3\)/);
});

test('dashboard_viewer recebe apenas a Visão executiva no shell', () => {
  assert.match(shell, /DOMAINS\.filter\(\(domain\) => domain\.key === 'ceo'\)/);
  assert.match(shell, /isDashboardViewer/);
});

test('não existe CTA geral para rota de pipelines ainda inexistente', () => {
  assert.doesNotMatch(page, /Ver todos os pipelines/);
  assert.doesNotMatch(page, /href=.*analytics\/pipelines/);
});
