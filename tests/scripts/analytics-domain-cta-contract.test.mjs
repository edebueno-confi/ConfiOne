import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const analyticsDir = path.join(repoRoot, 'apps/web/src/features/analytics');

const domainFiles = [
  'AnalyticsCeoPage.tsx',
  'AnalyticsCommercialPage.tsx',
  'AnalyticsCustomerSuccessPage.tsx',
  'AnalyticsCsPage.tsx',
  'AnalyticsFinancePage.tsx',
  'AnalyticsUnavailablePages.tsx',
];

test('acoes de sincronizacao ficam centralizadas em Configuracoes', () => {
  const shell = fs.readFileSync(path.join(analyticsDir, 'AnalyticsShell.tsx'), 'utf8');
  const config = fs.readFileSync(path.join(repoRoot, 'apps/web/src/features/settings/DashboardSourcesSettingsPage.tsx'), 'utf8');

  assert.match(shell, /Integrações/);
  assert.doesNotMatch(shell, /Sincronizar (?:HubSpot|OMIE|CS)/);
  assert.match(config, /triggerSequentialAnalyticsSync/);
  assert.match(config, /triggerHubspotSync/);
  assert.match(config, /triggerOmieSync/);
  assert.doesNotMatch(config, /triggerCsSupportSync/);
});

test('nenhum domínio do Analytics publica CTA de sincronização própria', () => {
  for (const filename of domainFiles) {
    const source = fs.readFileSync(path.join(analyticsDir, filename), 'utf8');
    assert.doesNotMatch(source, /runIntegrationNow|triggerHubspotSync|triggerCsSupportSync/,
      `${filename} não deve acionar sincronização dentro do domínio`);
    assert.doesNotMatch(source, /Sincronizar (?:HubSpot|OMIE|CS)/,
      `${filename} não deve publicar CTA de sincronização`);
  }
});

test('Financeiro encaminha falhas para Histórico e não oferece retry direto', () => {
  const finance = fs.readFileSync(path.join(analyticsDir, 'AnalyticsFinancePage.tsx'), 'utf8');
  assert.match(finance, /panel=history/);
  assert.match(finance, /FinanceSourceLinks/);
  assert.doesNotMatch(finance, /AnalyticsRetryAction|Tentar novamente/);
});

test('Resumo usa o estado da fonte correspondente a cada área', () => {
  const ceo = fs.readFileSync(path.join(analyticsDir, 'AnalyticsCeoPage.tsx'), 'utf8');
  const ui = fs.readFileSync(path.join(analyticsDir, 'analytics-ui.tsx'), 'utf8');
  assert.match(ceo, /analyticsSourceToBlockState/);
  assert.match(ceo, /state: hubspotState/);
  assert.match(ceo, /state: omieState/);
  assert.match(ui, /últimos dados válidos/);
});

test('Customer Success não reutiliza snapshot executivo nem dados de tickets', () => {
  const source = fs.readFileSync(path.join(analyticsDir, 'AnalyticsCustomerSuccessPage.tsx'), 'utf8');

  assert.doesNotMatch(source, /getCeoSnapshot|getCsSnapshot/);
  assert.match(source, /getCustomerSuccessSnapshot/);
  assert.match(source, /KpiCard|AnalyticsRetryAction/);
  assert.match(source, /HubSpot/);
  assert.doesNotMatch(source, /getCeoSnapshot|getCsSnapshot/);
});

test('integrações expõem configuração segura e escopo operacional explícito', () => {
  const settings = fs.readFileSync(path.join(repoRoot, 'apps/web/src/features/settings/SettingsPage.tsx'), 'utf8');
  const integrations = fs.readFileSync(path.join(repoRoot, 'apps/web/src/features/settings/SettingsIntegrationsPanel.tsx'), 'utf8');
  assert.match(integrations, /Chave da aplicação/);
  assert.match(integrations, /Segredo da aplicação/);
  assert.match(integrations, /app_key_app_secret/);
  assert.match(integrations, /Fonte dos dados financeiros e contas a receber/);
  assert.match(integrations, /Fonte de dados comerciais, clientes e atendimentos/);
  assert.doesNotMatch(integrations, /Modo|contas_a_receber|Vault/);
  assert.doesNotMatch(settings, /Planilhas CS e Comercial/);
});

test('modelo público financeiro não promove planilha a fonte de snapshot', () => {
  const model = fs.readFileSync(path.join(analyticsDir, 'analytics-model.ts'), 'utf8');

  assert.match(model, /source: 'api' \| 'none'/);
  assert.match(model, /data\.source === 'api' \? 'api' : 'none'/);
  assert.doesNotMatch(model, /sourceValue === 'spreadsheet'/);
  assert.doesNotMatch(model, /fallback: string/);
});

test('dashboard_viewer consulta as cinco áreas sem receber ações administrativas', () => {
  const shell = fs.readFileSync(path.join(analyticsDir, 'AnalyticsShell.tsx'), 'utf8');
  assert.match(shell, /isAnalyticsDomainPublishedInRelease\(domain\.key\)/);
  assert.doesNotMatch(shell, /!isDashboardViewer \|\| domain\.key === 'ceo'/);
  assert.doesNotMatch(shell, /trigger(?:Hubspot|Omie|Sequential)AnalyticsSync/);
});

test('histórico publicado separa ciclos HubSpot e OMIE', () => {
  const logs = fs.readFileSync(path.join(repoRoot, 'apps/web/src/features/settings/SyncHistorySettingsPage.tsx'), 'utf8');
  const api = fs.readFileSync(path.join(analyticsDir, 'analytics-api.ts'), 'utf8');
  assert.match(logs, /listAnalyticsSyncHistory/);
  assert.match(logs, /correlationId/);
  assert.match(api, /vw_admin_analytics_sync_history_v2/);
});

test('superfície de integrações não apresenta provider legado nem componente morto', () => {
  const settings = fs.readFileSync(path.join(repoRoot, 'apps/web/src/features/settings/SettingsIntegrationsPanel.tsx'), 'utf8');
  assert.match(settings, /provider === 'hubspot' \|\| item\.provider === 'omie'/);
  assert.equal(fs.existsSync(path.join(repoRoot, 'apps/web/src/features/settings/IntegrationSettingsPanel.tsx')), false);
});
