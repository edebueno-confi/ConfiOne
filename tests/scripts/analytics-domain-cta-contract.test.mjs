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
  const config = fs.readFileSync(path.join(analyticsDir, 'AnalyticsConfigPage.tsx'), 'utf8');

  assert.match(shell, /Gerenciar integrações/);
  assert.doesNotMatch(shell, /Sincronizar (?:HubSpot|OMIE|CS)/);
  assert.match(config, /triggerSequentialAnalyticsSync/);
  assert.match(config, /triggerHubspotSync/);
  assert.match(config, /triggerCsSupportSync/);
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

test('Customer Success não reutiliza snapshot executivo nem dados de tickets', () => {
  const source = fs.readFileSync(path.join(analyticsDir, 'AnalyticsCustomerSuccessPage.tsx'), 'utf8');

  assert.doesNotMatch(source, /getCeoSnapshot|getCsSnapshot/);
  assert.doesNotMatch(source, /KpiCard|AnalyticsRetryAction/);
  assert.match(source, /Indicadores de Customer Success ainda não configurados/);
  assert.match(source, /contrato de origem próprio/);
  assert.match(source, /Nenhum indicador foi inferido .* tickets/);
});

test('modelo público financeiro não promove planilha a fonte de snapshot', () => {
  const model = fs.readFileSync(path.join(analyticsDir, 'analytics-model.ts'), 'utf8');

  assert.match(model, /source: 'api' \| 'none'/);
  assert.match(model, /data\.source === 'api' \? 'api' : 'none'/);
  assert.doesNotMatch(model, /sourceValue === 'spreadsheet'/);
});
