import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { canOpenInternalRoute } from '../../apps/web/src/features/auth/internal-route-access.ts';

const analyticsShell = fs.readFileSync('apps/web/src/features/analytics/AnalyticsShell.tsx', 'utf8');
const ceoPage = fs.readFileSync('apps/web/src/features/analytics/AnalyticsCeoPage.tsx', 'utf8');
const adminShell = fs.readFileSync('apps/web/src/features/admin-shell/AdminConsoleShell.tsx', 'utf8');
const adminGate = fs.readFileSync('apps/web/src/features/auth/AdminGate.tsx', 'utf8');
const minimalNavigation = fs.readFileSync('apps/web/src/features/navigation/minimal-navigation.ts', 'utf8');

const viewerContext = {
  roles: ['dashboard_viewer'],
  screenKeys: [],
  hasCustomerPortalAccess: false,
  hasInternalActionAreaAccess: false,
  hasCsPortfolioAccess: false,
};

test('dashboard_viewer abre somente o Dashboard Gerencial dentro do Admin', () => {
  assert.equal(canOpenInternalRoute('/admin/analytics', viewerContext), true);
  for (const route of ['/admin/customer-portal', '/admin/knowledge', '/admin/settings', '/admin/system', '/admin/logs']) {
    assert.equal(canOpenInternalRoute(route, viewerContext), false, `rota indevidamente liberada: ${route}`);
  }
});

test('navegação visível do dashboard_viewer contém somente o Dashboard gerencial', () => {
  const viewerBranch = minimalNavigation.match(/if \(isDashboardViewer\) \{([\s\S]*?)\n  \}/)?.[1] ?? '';
  assert.match(viewerBranch, /label: 'Dashboard gerencial'/);
  assert.doesNotMatch(viewerBranch, /customer-area-config|help-center|knowledge-content|dashboard-settings/);
  assert.equal((viewerBranch.match(/id: 'dashboard-operational'/g) ?? []).length, 1);
});

test('shell do dashboard viewer não expõe configuração, logs, sincronização ou exportação administrativa', () => {
  assert.match(analyticsShell, /DOMAINS\.filter/);
  assert.match(analyticsShell, /logs|config/);
  assert.match(analyticsShell, /isPlatformAdmin/);
  assert.match(analyticsShell, /onRetry|retry|Tentar novamente/);
  assert.match(analyticsShell, /!\['logs', 'config'\]\.includes\(domain\.key\)/);
  assert.match(adminGate, /canOpenInternalRoute/);
});

test('Dashboard Gerencial distribui cinco KPIs em grade 3 + 2 a partir de 1024px', () => {
  assert.match(ceoPage, /grid-cols-2 gap-3 lg:grid-cols-6 xl:grid-cols-5/);
  assert.match(ceoPage, /lg:col-span-3 xl:col-span-1/);
  assert.match(fs.readFileSync('apps/web/src/features/analytics/analytics-ui.tsx', 'utf8'), /grid-cols-2 gap-3 lg:grid-cols-6 xl:grid-cols-5/);
  assert.match(ceoPage, /Sem dados neste período/);
  assert.match(fs.readFileSync('apps/web/src/features/analytics/analytics-ui.tsx', 'utf8'), /Array\.from\(\{ length: 5/);
});

test('status de sincronização distingue delta processado do snapshot acumulado', () => {
  assert.match(analyticsShell, /Última sincronização/);
});
