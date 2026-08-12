import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const shell = read('apps/web/src/features/navigation/MinimalAppShell.tsx');
const access = read('apps/web/src/features/access/AccessPage.tsx');
const ui = read('apps/web/src/components/ui.tsx');
const css = read('apps/web/src/index.css');
const analyticsCss = read('apps/web/src/features/analytics/high-density.css');
const settingsCss = read('apps/web/src/features/settings/settings-ui.css');
const router = read('apps/web/src/app/router.tsx');
const navigation = read('apps/web/src/features/navigation/minimal-navigation.ts');

test('canvas principal preserva rolagem vertical e navegação mobile acessível', () => {
  assert.match(shell, /gso-main-canvas[^\n]*overflow-x-hidden overflow-y-auto/);
  assert.match(shell, /aria-expanded=\{mobileNavigationOpen\}/);
  assert.match(shell, /aria-controls="gso-mobile-navigation"/);
  assert.match(shell, /role="dialog"/);
  assert.match(shell, /gso-sidebar-drawer/);
  assert.match(shell, /overflow-y-auto/);
  assert.match(shell, /gso-topbar-mobile-genius lg:hidden/);
});

test('contrato de tabelas responsivas usa overflow horizontal controlado', () => {
  assert.ok((access.match(/data-responsive-table-scroll="true"/g) ?? []).length >= 2);
  assert.match(css, /\.gso-responsive-table-scroll\s*\{/);
  assert.match(css, /\.gso-responsive-table-scroll[\s\S]*?overflow-x:\s*auto/);
  assert.match(analyticsCss, /gso-analytics-responsive-table/);
  assert.match(analyticsCss, /data-label/);
  assert.match(settingsCss, /\.gso-ui-table--brands/);
  assert.match(settingsCss, /\.gso-ui-table--access-users/);
});

test('drawers compartilhados respeitam a viewport e mantêm corpo rolável', () => {
  assert.match(ui, /data-responsive-drawer="true"/);
  assert.match(ui, /h-dvh[\s\S]*overflow-hidden/);
  assert.match(ui, /flex-1 overflow-y-auto/);
  assert.match(css, /\[data-responsive-drawer='true'\]/);
  assert.match(css, /width: min\(100vw, 100%\)/);
});

test('proteções de shell não removem o contrato legado de Governança de dados', () => {
  assert.match(router, /dashboard-sources/);
  assert.match(navigation, /label: 'Governan/);
});
