import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const coverage = fs.readFileSync('apps/web/src/features/analytics/AnalyticsDataCoveragePanel.tsx', 'utf8');
const executive = fs.readFileSync('apps/web/src/features/analytics/AnalyticsCeoPage.tsx', 'utf8');
const shell = fs.readFileSync('apps/web/src/features/analytics/AnalyticsShell.tsx', 'utf8');
const domains = fs.readFileSync('apps/web/src/features/analytics/analytics-domains.ts', 'utf8');

test('visão executiva expõe evolução real por domínio sem misturar unidades', () => {
  assert.match(executive, /<AnalyticsTrendPanel domain="commercial" \/>/);
  assert.match(executive, /<AnalyticsTrendPanel domain="support" \/>/);
  assert.match(executive, /<AnalyticsTrendPanel domain="finance" \/>/);
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
