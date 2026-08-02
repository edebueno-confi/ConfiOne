import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const edge = await readFile(new URL('../../supabase/functions/analytics-sequential-sync/index.ts', import.meta.url), 'utf8');
const compatibility = await readFile(new URL('../../supabase/functions/analytics-integration-run/index.ts', import.meta.url), 'utf8');
const config = await readFile(new URL('../../apps/web/src/features/settings/DashboardSourcesSettingsPage.tsx', import.meta.url), 'utf8');
const api = await readFile(new URL('../../apps/web/src/features/analytics/analytics-api.ts', import.meta.url), 'utf8');

test('orquestrador executa HubSpot antes de OMIE', () => {
  const start = edge.indexOf("'hubspot-orchestrator-start'");
  const dispatcher = edge.indexOf("'hubspot-orchestrator-dispatcher'");
  const omie = edge.indexOf("'omie-sync'");
  assert.ok(start >= 0, 'o executor HubSpot precisa ser iniciado');
  assert.ok(dispatcher > start, 'a fila HubSpot precisa ser processada depois do start');
  assert.ok(omie > dispatcher, 'OMIE precisa aparecer depois do processamento HubSpot');
  assert.doesNotMatch(edge, /Promise\.all/, 'a sequência não pode iniciar as fontes em paralelo');
  assert.match(edge, /hubspot\.status === 'running'/);
  assert.match(edge, /omie: \{ status: 'not_started' \}/);
  assert.match(edge, /rpc_service_start_analytics_sync_cycle/);
  assert.match(edge, /analytics_sync_cycle_steps/);
});

test('processamento pendente bloqueia OMIE, mas falha terminal preserva o ciclo parcial', () => {
  assert.match(edge, /if \(hubspot\.status === 'running'\)/);
  assert.match(edge, /return jsonResponse\(\{[\s\S]*omie: \{ status: 'not_started' \}/);
  assert.match(edge, /callFunction\(config\.baseUrl, config\.anonKey, config\.secret, 'omie-sync'/);
  assert.match(edge, /const status = hubspotOk && omieOk \? 'success' : 'partial'/);
  assert.match(edge, /overall_result/);
  assert.match(edge, /sanitized_error/);
});

test('Configuracoes usa o orquestrador novo', () => {
  assert.match(config, /triggerSequentialAnalyticsSync/);
  assert.doesNotMatch(config, /runIntegrationNow/);
  assert.match(api, /functions\/v1\/analytics-sequential-sync/);
});

test('facade legado do analytics permanece sem escrita externa', () => {
  assert.doesNotMatch(compatibility, /updateCompaniesBatch|hubspot-omie-property-sync|rpc_analytics_finance_company_rollup/);
  assert.match(compatibility, /nenhum write externo executado/);
});
