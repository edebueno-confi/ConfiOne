import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const navigation = await readFile(new URL('../../apps/web/src/features/navigation/minimal-navigation.ts', import.meta.url), 'utf8');
const shell = await readFile(new URL('../../apps/web/src/features/navigation/MinimalAppShell.tsx', import.meta.url), 'utf8');
const settings = await readFile(new URL('../../apps/web/src/features/settings/SettingsPage.tsx', import.meta.url), 'utf8');
const analytics = await readFile(new URL('../../apps/web/src/features/analytics/AnalyticsShell.tsx', import.meta.url), 'utf8');
const domains = await readFile(new URL('../../apps/web/src/features/analytics/analytics-domains.ts', import.meta.url), 'utf8');
const navigationCatalog = navigation.slice(0, navigation.indexOf('export function resolveMinimalRouteLabel'));

test('MVP shell keeps the authorized surface catalog small', () => {
  assert.match(navigation, /Dashboard gerencial/);
  assert.match(navigation, /Conhecimento/);
  assert.match(navigation, /Acessos e áreas/);
  assert.doesNotMatch(navigationCatalog, /Portal do cliente|Contas B2B|Fila operacional|Logs/);
});

test('sidebar sections are independent, persisted and internally scrollable', () => {
  assert.match(shell, /gso-shell-sections/);
  assert.match(shell, /\{ \.\.\.current, \[section\.id\]: !willOpen \}/);
  assert.match(shell, /overflow-y-auto overscroll-contain/);
});

test('settings exposes analytics as the integration control plane', () => {
  assert.match(settings, /section.*analytics|analytics.*section/);
  assert.match(settings, /AnalyticsConfigPage/);
  assert.match(settings, /central-ajuda.*marcas|marcas.*central-ajuda/);
});

test('dashboard shell exposes four domains and delegates integrations', () => {
  assert.doesNotMatch(domains, /key: 'logs'|key: 'config'/);
  assert.match(analytics, /Gerenciar integrações/);
  assert.doesNotMatch(analytics, /Sincronizar HubSpot|Sincronizar OMIE/);
});
