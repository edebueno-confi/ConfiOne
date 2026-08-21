import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const coverage = fs.readFileSync('apps/web/src/features/analytics/AnalyticsDataCoveragePanel.tsx', 'utf8');
const executive = fs.readFileSync('apps/web/src/features/analytics/AnalyticsCeoPage.tsx', 'utf8');
const shell = fs.readFileSync('apps/web/src/features/analytics/AnalyticsShell.tsx', 'utf8');
const domains = fs.readFileSync('apps/web/src/features/analytics/analytics-domains.ts', 'utf8');
const commercialPage = fs.readFileSync('apps/web/src/features/analytics/AnalyticsCommercialPage.tsx', 'utf8');
const supportPage = fs.readFileSync('apps/web/src/features/analytics/AnalyticsCsPage.tsx', 'utf8');
const customerSuccessPage = fs.readFileSync('apps/web/src/features/analytics/AnalyticsCustomerSuccessPage.tsx', 'utf8');
const financePage = fs.readFileSync('apps/web/src/features/analytics/AnalyticsFinancePage.tsx', 'utf8');
const trendPanel = fs.readFileSync('apps/web/src/features/analytics/AnalyticsTrendPanel.tsx', 'utf8');
const analyticsApi = fs.readFileSync('apps/web/src/features/analytics/analytics-api.ts', 'utf8');
const timeseriesScopeMigration = fs.readFileSync('supabase/migrations/20260821090000_analytics_timeseries_operation_scope_v1.sql', 'utf8');

test('visão executiva expõe evolução real por domínio sem misturar unidades', () => {
  assert.match(executive, /<AnalyticsTrendPanel domain="commercial" groupCompany=\{groupCompany\} \/>/);
  assert.match(executive, /<AnalyticsTrendPanel domain="support" groupCompany=\{groupCompany\} \/>/);
  assert.match(executive, /<AnalyticsTrendPanel domain="finance" groupCompany=\{groupCompany\} \/>/);
  assert.match(executive, /Evolução por domínio/);
});

test('cobertura distingue contrato publicado de lacuna de integração', () => {
  assert.match(coverage, /Publicado/);
  assert.match(coverage, /Cobertura parcial/);
  assert.match(coverage, /Indisponível/);
  assert.match(executive, /Atividades · reuniões, tarefas, ligações e e-mails/);
  assert.match(executive, /Conversas e chat/);
  assert.match(executive, /Pagar, centros de custo, projetos e contratos/);
  assert.doesNotMatch(executive, /meetingss*=s*0|taskss*=s*0|conversationss*=s*0/);
});

test('governança permanece uma ação controlada fora dos domínios de leitura', () => {
  assert.match(shell, /to="\/admin\/settings\/dashboard-sources"/);
  assert.match(shell, /Governança de dados/);
  assert.match(coverage, /Revisar governança de dados/);
  assert.match(domains, /conversas ainda não conectadas/);
});

test('domínios exibem performance por pessoa sem fabricar atividades', () => {
  assert.match(commercialPage, /Performance comercial por responsável/);
  assert.match(commercialPage, /CommercialOwnerPerformanceChart/);
  assert.match(commercialPage, /Atividades indisponíveis/);
  assert.match(customerSuccessPage, /Performance da carteira por responsável/);
  assert.match(customerSuccessPage, /customers_with_tickets/);
  assert.match(supportPage, /Performance do suporte por responsável/);
  assert.match(supportPage, /Chat \/ Conversas/);
  assert.match(supportPage, /Atividades indisponíveis/);
});

test('escopo de operação é espelhado nos read models HubSpot e limita domínios sem dimensão publicada', () => {
  assert.match(executive, /getCommercialKpisV2\(filters, groupCompany\)/);
  assert.match(executive, /getSupportKpisV2\(filters, groupCompany\)/);
  assert.match(executive, /getCsSnapshot\(filters, \[\], groupCompany\)/);
  assert.match(executive, /applyOperationScope/);
  assert.match(executive, /Financeiro exibem somente indicadores com dimens.o publicada/);
  assert.match(executive, /maskUnscopedOperationKpis/);
  assert.match(financePage, /Financeiro consolidado fora do recorte/);
  assert.match(financePage, /Abrir Governança/);
  assert.match(executive, /<AnalyticsTrendPanel domain="commercial" groupCompany=\{groupCompany\} \/>/);
  assert.match(executive, /<AnalyticsTrendPanel domain="support" groupCompany=\{groupCompany\} \/>/);
  assert.match(commercialPage, /<AnalyticsTrendPanel domain="commercial" groupCompany=\{groupCompany\} \/>/);
  assert.match(supportPage, /<AnalyticsTrendPanel domain="support" groupCompany=\{groupCompany\} \/>/);
  assert.match(trendPanel, /getAnalyticsTimeseries\(domain, grain, undefined, groupCompany\)/);
  assert.match(analyticsApi, /rpc_analytics_timeseries_by_operation/);
  assert.match(timeseriesScopeMigration, /operation_dimension_unavailable/);
});
