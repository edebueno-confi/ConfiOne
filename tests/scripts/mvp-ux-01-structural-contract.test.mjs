import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const navigation = await readFile(new URL('../../apps/web/src/features/navigation/minimal-navigation.ts', import.meta.url), 'utf8');
const shell = await readFile(new URL('../../apps/web/src/features/navigation/MinimalAppShell.tsx', import.meta.url), 'utf8');
const shellCss = await readFile(new URL('../../apps/web/src/index.css', import.meta.url), 'utf8');
const settings = await readFile(new URL('../../apps/web/src/features/settings/SettingsPage.tsx', import.meta.url), 'utf8');
const analytics = await readFile(new URL('../../apps/web/src/features/analytics/AnalyticsShell.tsx', import.meta.url), 'utf8');
const domains = await readFile(new URL('../../apps/web/src/features/analytics/analytics-domains.ts', import.meta.url), 'utf8');
const navigationCatalog = navigation.slice(0, navigation.indexOf('export function resolveMinimalRouteLabel'));

test('MVP shell keeps the authorized surface catalog small', () => {
  assert.match(navigation, /Dashboard gerencial/);
  assert.match(navigation, /Conhecimento/);
  assert.match(navigation, /Usuários e acessos/);
  assert.doesNotMatch(navigationCatalog, /Portal do cliente|Contas B2B|Fila operacional|Logs/);
});

test('sidebar sections are independent, persisted and internally scrollable', () => {
  assert.match(shell, /gso-shell-sections/);
  assert.match(shell, /return \{\s*\.\.\.current, \[section\.id\]: !willOpen \}/);
  assert.match(shell, /overflow-y-auto/);
  assert.match(shell, /gso-sidebar-navigation/);
});

test('sidebar follows the approved compact icon geometry', () => {
  assert.match(shell, /<GeniusLamp animated=\{false\} size="sm" \/>/, 'a marca compacta precisa permanecer visível no trilho recolhido');
  assert.match(shell, /className="h-\[18px\] w-\[18px\]"/, 'os ícones lineares da navegação precisam usar 18px');
  assert.match(shell, /className="inline-flex h-\[18px\] w-\[18px\] items-center justify-center"/, 'o invólucro do ícone não pode ampliar o ícone além do blueprint');
});

test('sidebar CSS keeps the rail flush and navigation at blueprint density', () => {
  assert.match(shellCss, /--shell-sidebar-outer-gap:\s*0px;/, 'o desktop não deve criar um cartão solto em volta da sidebar');
  assert.match(shellCss, /--shell-sidebar-nav-item-height:\s*36px;/, 'cada item de navegação deve ficar na faixa compacta do blueprint');
  assert.match(shellCss, /\.gso-ui\.gso-sidebar \{[\s\S]*?height:\s*100dvh !important;[\s\S]*?border-right:/, 'a sidebar precisa ocupar toda a altura e separar-se do conteúdo apenas por uma divisória');
});

test('rail recolhido ancora o submenu no item acionado sem ocupar toda a tela', () => {
  assert.match(shell, /getBoundingClientRect\(\)/, 'o painel precisa medir o item acionado para se ancorar ao rail');
  assert.match(shell, /style=\{\{ top: flyoutAnchor\.top, left: flyoutAnchor\.left \}\}/, 'a posição do flyout precisa vir do gatilho, não de um topo fixo');
  assert.match(shell, /gso-nav-section--collapsed/, 'o rail precisa preservar a semântica de seção ao abrir o submenu');
  assert.match(shellCss, /max-height:\s*min\(420px, calc\(100dvh - 16px\)\);/, 'o submenu deve ter altura própria e permanecer no viewport');
  assert.doesNotMatch(shellCss, /\.gso-nav-flyout \{\s*top:\s*0;\s*bottom:\s*0;/, 'o submenu não pode virar uma coluna de tela inteira');
});

test('rail recolhido abre o submenu no hover e preserva a geometria do blueprint', () => {
  assert.match(shell, /onMouseEnter=\{\(event\) => openFlyoutForSection\(section, event\.currentTarget\)\}/, 'o submenu precisa abrir assim que o cursor entrar no grupo do rail');
  assert.match(shell, /onMouseLeave=\{scheduleFlyoutClose\}/, 'a saída do rail precisa agendar o fechamento sem cortar a passagem para o painel');
  assert.match(shell, /onMouseEnter=\{cancelFlyoutClose\}/, 'o flyout precisa manter-se aberto ao receber o cursor');
  assert.match(shellCss, /--shell-sidebar-collapsed:\s*56px;/, 'o trilho recolhido precisa manter a largura de 56px');
  assert.match(shellCss, /\.gso-nav-group-rail-button \{[\s\S]*?width:\s*40px;[\s\S]*?height:\s*var\(--shell-sidebar-nav-item-height\);/, 'o ícone precisa ficar em alvo de 40px no rail de 56px');
});

test('settings exposes analytics as the integration control plane', () => {
  assert.match(settings, /DASHBOARD_SECTION_IDS/);
  assert.match(settings, /SettingsIntegrationsPanel/);
  assert.match(settings, /DashboardSourcesSettingsPage/);
  assert.match(settings, /SyncHistorySettingsPage/);
  assert.match(settings, /id: 'marcas'/);
  assert.match(settings, /id: 'central-ajuda'/);
});

test('dashboard shell exposes four domains and delegates integrations', () => {
  assert.doesNotMatch(domains, /key: 'logs'|key: 'config'/);
  assert.match(analytics, /Integrações/);
  assert.doesNotMatch(analytics, /Sincronizar HubSpot|Sincronizar OMIE/);
});
