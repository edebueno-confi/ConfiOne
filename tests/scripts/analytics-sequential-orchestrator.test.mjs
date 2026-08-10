import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const edge = await readFile(new URL('../../supabase/functions/analytics-sequential-sync/index.ts', import.meta.url), 'utf8');
const compatibility = await readFile(new URL('../../supabase/functions/analytics-integration-run/index.ts', import.meta.url), 'utf8');
const omieEntry = await readFile(new URL('../../supabase/functions/omie-sync/index.ts', import.meta.url), 'utf8');
const omieService = await readFile(new URL('../../supabase/functions/_shared/omie-sync-service.ts', import.meta.url), 'utf8');
const serviceIdentityMigration = await readFile(new URL('../../supabase/migrations/20260802180000_dashboard_hubspot_service_identity_v2.sql', import.meta.url), 'utf8');
const runner = await readFile(new URL('../../supabase/functions/_shared/hubspot-cs-runner.ts', import.meta.url), 'utf8');
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
  assert.match(edge, /'x-analytics-cycle-id'/);
  assert.match(edge, /run_id: omiePayload\.syncRunId/);
  assert.match(edge, /\.order\('started_at', \{ ascending: false \}\)/);
  assert.doesNotMatch(edge, /\.order\('created_at', \{ ascending: false \}\)/);
});

test('processamento pendente bloqueia OMIE, mas falha terminal preserva o ciclo parcial', () => {
  assert.match(edge, /if \(hubspot\.status === 'running'\)/);
  assert.match(edge, /return jsonResponse\(\{[\s\S]*omie: \{ status: 'not_started' \}/);
  assert.match(edge, /callFunction\(config\.baseUrl, config\.anonKey, auth, 'omie-sync'/);
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

test('run OMIE fica vinculado ao ciclo somente pelo orquestrador interno', () => {
  assert.match(edge, /'x-analytics-cycle-id'/);
  assert.match(edge, /run_id: omiePayload\.syncRunId/);
  assert.match(omieEntry, /const cycleId = scheduled &&/);
  assert.match(omieEntry, /runOmieSnapshot\([^;]+cycleId\)/);
  assert.match(omieService, /cycle_id: cycleId/);
});

test('RPC HubSpot aceita identidade interna sem exigir sub de usuario', () => {
  assert.match(serviceIdentityMigration, /v_is_service_role boolean := app_private\.is_internal_service_request\(\)/);
  assert.doesNotMatch(serviceIdentityMigration, /v_is_service_role boolean := coalesce\(current_setting\('request\.jwt\.claim\.role'/);
});

test('erros de autenticação do HubSpot chegam ao ciclo somente sanitizados', () => {
  assert.match(runner, /classifyHubSpotError/);
  assert.match(edge, /classifyHubSpotError\(new Error/);
  assert.match(edge, /sanitized_error: classified\.sanitizedMessage/);
});

test('orquestrador importa o formatador usado nas falhas do OMIE', () => {
  assert.match(edge, /import \{[^}]*runnerMessage[^}]*\} from '\.\.\/_shared\/hubspot-cs-runner\.ts';/);
});

test('execução manual delega o JWT já autorizado às funções internas', () => {
  assert.match(edge, /const requester = await authorizeCsRunner\(req, client\);/);
  assert.match(edge, /authorization: requester === 'scheduler' \? null : req\.headers\.get\('authorization'\)/);
  assert.match(edge, /\.\.\.\(auth\.authorization \? \{ Authorization: auth\.authorization \} : \{\}\)/);
  assert.match(edge, /\.\.\.\(auth\.secret \? \{ 'x-analytics-sync-secret': auth\.secret \} : \{\}\)/);
});
