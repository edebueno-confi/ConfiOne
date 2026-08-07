import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  describeKpiLimitation,
  readKpi,
} from '../../apps/web/src/features/analytics/analytics-kpi-contract.mjs';

const sharedSource = await readFile(
  new URL('../../supabase/functions/_shared/hubspot.ts', import.meta.url),
  'utf8',
);
const associationsFn = await readFile(
  new URL('../../supabase/functions/hubspot-associations-sync/index.ts', import.meta.url),
  'utf8',
);
const historyFn = await readFile(
  new URL('../../supabase/functions/hubspot-stage-history-sync/index.ts', import.meta.url),
  'utf8',
);
const relationsMigration = await readFile(
  new URL('../../supabase/migrations/20260807140000_analytics_hubspot_relations_and_history_v1.sql', import.meta.url),
  'utf8',
);
const readModelsV2 = await readFile(
  new URL('../../supabase/migrations/20260807150000_analytics_kpi_read_models_v2.sql', import.meta.url),
  'utf8',
);
const discoveryScript = await readFile(
  new URL('../../scripts/analytics/hubspot-coverage-discovery.mjs', import.meta.url),
  'utf8',
);

test('a ingestão é somente leitura no HubSpot', () => {
  // Nenhuma escrita em associations ou objetos: só batch read.
  for (const source of [associationsFn, historyFn]) {
    assert.equal(/associations\/.+\/batch\/create/.test(source), false);
    assert.equal(/associations\/.+\/batch\/archive/.test(source), false);
    assert.equal(/batch\/update/.test(source), false);
  }
  assert.match(sharedSource, /crm\/v4\/associations\/\$\{fromObjectType\}\/\$\{toObjectType\}\/batch\/read/);
  assert.match(sharedSource, /crm\/v3\/objects\/\$\{objectType\}\/batch\/read/);
});

test('os limites de lote do HubSpot são respeitados', () => {
  assert.match(sharedSource, /HUBSPOT_ASSOCIATION_BATCH_LIMIT = 100/);
  // Batch read com histórico de propriedade aceita menos itens por chamada.
  assert.match(sharedSource, /HUBSPOT_HISTORY_BATCH_LIMIT = 50/);
  assert.match(sharedSource, /Lote de associations acima do limite/);
  assert.match(sharedSource, /Lote de historico acima do limite/);
});

test('o histórico usa a propriedade de estágio correta para cada objeto', () => {
  assert.match(sharedSource, /objectType === 'tickets' \? 'hs_pipeline_stage' : 'dealstage'/);
  assert.match(sharedSource, /objectType === 'tickets' \? 'hs_pipeline' : 'pipeline'/);
});

test('a ingestão é retomável e idempotente', () => {
  // Marca d'água persistida no banco, não em memória do processo.
  assert.match(historyFn, /analytics_hubspot_history_sync_state/);
  assert.match(historyFn, /p_last_object_id/);
  assert.match(historyFn, /restart/);
  // Chaves compostas garantem que reprocessar não duplica.
  assert.match(relationsMigration, /primary key \(from_object_type, from_id, to_object_type, to_id\)/);
  assert.match(relationsMigration, /primary key \(object_type, object_id, changed_at\)/);
  assert.match(relationsMigration, /on conflict \(from_object_type, from_id, to_object_type, to_id\) do update/);
  assert.match(relationsMigration, /on conflict \(object_type, object_id, changed_at\) do update/);
});

test('as funções de ingestão exigem autorização e não são anônimas', () => {
  for (const source of [associationsFn, historyFn]) {
    assert.match(source, /authorizeCsRunner/);
    assert.match(source, /Requer platform_admin/);
  }
  const grants = relationsMigration.match(/grant execute on function[^;]+;/g) ?? [];
  assert.ok(grants.length >= 2);
  for (const grant of grants) {
    assert.equal(/\banon\b/.test(grant), false, `grant não pode incluir anon: ${grant}`);
  }
  // As gravações de serviço não podem ser expostas ao usuário autenticado.
  assert.match(relationsMigration, /rpc_service_upsert_hubspot_associations\(text, text, jsonb\)\s*\n\s*from public, anon, authenticated/);
});

test('a execução tem orçamento de tempo para não estourar o limite da função', () => {
  for (const source of [associationsFn, historyFn]) {
    assert.match(source, /TIME_BUDGET_MS/);
    assert.match(source, /Date\.now\(\) - startedAt < TIME_BUDGET_MS/);
  }
});

test('o estado dos KPIs acompanha a cobertura real da ingestão', () => {
  // Sem nada ingerido continua indisponível; parcial enquanto carrega.
  assert.match(readModelsV2, /when cv\.with_history = 0 then 'unavailable'/);
  assert.match(readModelsV2, /when cv\.with_history < cv\.total_rows then 'partial'/);
  assert.match(readModelsV2, /when ac\.tickets_linked = 0 then 'unavailable'/);
  assert.match(readModelsV2, /when ac\.tickets_linked < ac\.tickets_total then 'partial'/);
  // Primeira resposta e última interação continuam bloqueadas: não há fonte.
  assert.match(readModelsV2, /'ticket_first_response_at', 'unavailable', 'ticket_first_response_missing'/);
  assert.match(readModelsV2, /'company_last_activity_at', 'unavailable', 'activity_dates_missing'/);
});

test('resolução distingue ausência de histórico de ausência de resolução', () => {
  assert.match(relationsMigration, /a\.ticket_id is not null as has_history/);
  // Só publica data de resolução para ticket que está encerrado agora.
  assert.match(relationsMigration, /when coalesce\(cur\.metadata ->> 'ticketState', ''\) = 'CLOSED' then a\.last_closed_at/);
});

test('os códigos de cobertura parcial têm tradução gerencial', () => {
  for (const reason of ['ticket_history_partial', 'associations_partial']) {
    const entry = { kpis: { x: { state: 'partial', value: 10, basis: null, reason } } };
    const message = describeKpiLimitation(readKpi(entry, 'x'));
    assert.doesNotMatch(message, /_/, `"${reason}" não pode vazar o código`);
    assert.doesNotMatch(message, /limitação de origem/, `"${reason}" precisa de frase própria`);
    assert.ok(message.length > 20);
  }
});

test('o script de discovery nunca imprime nem grava a credencial', () => {
  // O token só aparece no cabeçalho da requisição.
  const tokenUses = discoveryScript.match(/\btoken\b/g) ?? [];
  assert.ok(tokenUses.length > 0);
  assert.equal(/console\.log\([^)]*token[^)]*\)/i.test(discoveryScript), false);
  assert.equal(/JSON\.stringify\([^)]*token/i.test(discoveryScript), false);
  // O relatório gravado não inclui credencial.
  assert.match(discoveryScript, /Nenhuma credencial foi incluída/);
  // Erros são sanitizados em vez de ecoar o corpo bruto.
  assert.match(discoveryScript, /payload\?\.category \|\| payload\?\.message/);
});

test('o script de discovery só faz leitura', () => {
  assert.equal(/method: 'PATCH'/.test(discoveryScript), false);
  assert.equal(/method: 'PUT'/.test(discoveryScript), false);
  assert.equal(/method: 'DELETE'/.test(discoveryScript), false);
  // Os POST existentes são apenas de busca e leitura em lote.
  const posts = discoveryScript.match(/\/crm\/v[34]\/[^`']*/g) ?? [];
  for (const endpoint of posts) {
    assert.equal(/batch\/(create|archive|update)/.test(endpoint), false, `endpoint de escrita proibido: ${endpoint}`);
  }
});
