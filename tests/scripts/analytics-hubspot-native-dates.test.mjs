import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  describeKpiLimitation,
  readKpi,
} from '../../apps/web/src/features/analytics/analytics-kpi-contract.mjs';

const runnerSource = await readFile(
  new URL('../../supabase/functions/_shared/hubspot-cs-runner.ts', import.meta.url),
  'utf8',
);
const workerSource = await readFile(
  new URL('../../supabase/functions/hubspot-orchestrator-worker/index.ts', import.meta.url),
  'utf8',
);
const nativeDatesMigration = await readFile(
  new URL('../../supabase/migrations/20260807160000_analytics_hubspot_native_dates_v1.sql', import.meta.url),
  'utf8',
);
const readModelsV3 = await readFile(
  new URL('../../supabase/migrations/20260807170000_analytics_kpi_read_models_v3.sql', import.meta.url),
  'utf8',
);

test('a propriedade inexistente foi substituída pela real em tickets', () => {
  const properties = runnerSource.slice(
    runnerSource.indexOf('CS_TICKET_PROPERTIES'),
    runnerSource.indexOf('HUBSPOT_DEAL_PROPERTIES'),
  );
  // `closedate` não existe entre as propriedades de ticket desta conta.
  assert.equal(/'closedate'/.test(properties), false, 'ticket não pode mais pedir closedate');
  assert.match(properties, /'closed_date'/);
  assert.match(properties, /'hs_lastactivitydate'/);
  assert.match(properties, /'hs_time_to_first_response_in_operating_hours'/);
});

test('o adapter solicita todos os campos nativos publicados pelo contrato', () => {
  const properties = runnerSource.slice(
    runnerSource.indexOf('CS_TICKET_PROPERTIES'),
    runnerSource.indexOf('HUBSPOT_DEAL_PROPERTIES'),
  );
  for (const property of [
    'subject',
    'first_agent_reply_date',
    'hs_ticket_reopened_at',
    'time_to_close',
    'hs_is_one_touch_ticket',
    'tipo_de_fechamento',
    'data_de_passgem',
  ]) {
    assert.match(properties, new RegExp(`'${property}'`), `campo nativo ausente: ${property}`);
  }
});

test('negócios continuam usando a própria propriedade de fechamento', () => {
  // Em Deals `closedate` existe e está preenchido; a correção é só de tickets.
  const dealProperties = runnerSource.slice(runnerSource.indexOf('HUBSPOT_DEAL_PROPERTIES'));
  assert.match(dealProperties.slice(0, 300), /'closedate'/);
});

test('o mapeamento do ticket lê a propriedade certa', () => {
  assert.match(runnerSource, /hs_closed_at: toIsoTimestamp\(record\.properties\.closed_date\)/);
  assert.match(runnerSource, /last_activity_at: toIsoTimestamp\(record\.properties\.hs_lastactivitydate\)/);
  assert.match(runnerSource, /first_response_ms: toMilliseconds\(record\.properties\.hs_time_to_first_response_in_operating_hours\)/);
  assert.match(runnerSource, /subject: record\.properties\.subject \?\? null/);
  assert.match(runnerSource, /first_agent_reply_at: toIsoTimestamp\(record\.properties\.first_agent_reply_date\)/);
  assert.match(runnerSource, /reopened_at: toIsoTimestamp\(record\.properties\.hs_ticket_reopened_at\)/);
  assert.match(runnerSource, /time_to_close_ms: toMilliseconds\(record\.properties\.time_to_close\)/);
  assert.match(runnerSource, /is_one_touch: toNullableBoolean\(record\.properties\.hs_is_one_touch_ticket\)/);
  assert.match(runnerSource, /closure_type: record\.properties\.tipo_de_fechamento \?\? null/);
  assert.match(runnerSource, /closure_marked_at: toIsoTimestamp\(record\.properties\.data_de_passgem\)/);
  assert.match(runnerSource, /resolution_note: null/);
});

test('duração inválida ou negativa não vira número', () => {
  // Reimplementação do contrato de toMilliseconds, verificada contra a fonte.
  assert.match(runnerSource, /Number\.isFinite\(parsed\) && parsed >= 0 \? Math\.round\(parsed\) : null/);
  assert.match(runnerSource, /if \(value === null \|\| value === undefined \|\| value === ''\) return null/);
});

test('a empresa passa a carregar a última interação', () => {
  assert.match(workerSource, /'notes_last_contacted'/);
  assert.match(workerSource, /last_activity_at:\s*toIsoTimestamp\(r\.properties\.notes_last_contacted\)/);
});

test('a paginação do worker continua usando cursor e checkpoint', () => {
  assert.match(workerSource, /fetchTicketsPageByPipeline\(item\.pipeline_id, CS_TICKET_PROPERTIES, token, \{ cursor: item\.cursor/);
  assert.match(workerSource, /fetchDealsPageByPipeline\(item\.pipeline_id, HUBSPOT_DEAL_PROPERTIES, token, \{ cursor: item\.cursor/);
  assert.match(workerSource, /nextCursor = page\.nextCursor/);
  assert.match(workerSource, /p_next_cursor:nextCursor/);
});

test('a promoção do staging carrega as colunas novas sem perder as antigas', () => {
  const promotion = nativeDatesMigration.slice(nativeDatesMigration.indexOf('insert into public.hubspot_tickets'));
  assert.match(promotion, /last_activity_at,first_response_ms/);
  // As colunas anteriores continuam na promoção.
  for (const column of ['pipeline_stage', 'owner_id', 'source_type', 'priority', 'time_to_close_sla_status']) {
    assert.match(promotion, new RegExp(column), `a promoção não pode perder ${column}`);
  }
  assert.match(nativeDatesMigration, /insert into public\.hubspot_companies[^;]*last_activity_at/);
});

test('a data nativa tem precedência sobre o histórico de estágio', () => {
  assert.match(readModelsV3, /Reabertura continua dependendo do histórico/);
  assert.match(nativeDatesMigration, /when b\.hs_closed_at is not null then b\.hs_closed_at/);
  assert.match(nativeDatesMigration, /else b\.last_closed_at/);
  assert.match(nativeDatesMigration, /when b\.hs_closed_at is not null then 'hubspot_property'/);
});

test('a conversão de milissegundos para horas acontece no read model', () => {
  assert.match(nativeDatesMigration, /b\.first_response_ms::numeric \/ 3600000\.0/);
  // A tela não pode conhecer a unidade da origem.
  assert.equal(/3600000/.test(readModelsV3), false);
});

test('ausência de interação registrada não é lida como inatividade', () => {
  assert.match(nativeDatesMigration, /when c\.last_activity_at is null then null/);
  // O filtro de inatividade usa comparação estrita, que descarta nulo.
  assert.match(readModelsV3, /days_since_last_activity > v_threshold/);
});

test('primeira resposta e inatividade deixaram de ser bloqueio fixo', () => {
  // Antes eram sempre 'unavailable'; agora o estado vem da cobertura medida.
  assert.equal(/'ticket_first_response_at', 'unavailable', 'ticket_first_response_missing'/.test(readModelsV3), false);
  assert.equal(/'company_last_activity_at', 'unavailable', 'activity_dates_missing'/.test(readModelsV3), false);
  assert.match(readModelsV3, /when cv\.with_first_response = 0 then 'unavailable'/);
  assert.match(readModelsV3, /when acv\.with_activity = 0 then 'unavailable'/);
});

test('os códigos novos de cobertura parcial têm frase própria', () => {
  for (const reason of ['ticket_close_date_partial', 'first_response_partial', 'activity_partial']) {
    const entry = { kpis: { x: { state: 'partial', value: 3, basis: null, reason } } };
    const message = describeKpiLimitation(readKpi(entry, 'x'));
    assert.doesNotMatch(message, /_/, `"${reason}" não pode vazar o código`);
    assert.doesNotMatch(message, /limitação de origem/, `"${reason}" precisa de frase própria`);
  }
});

test('o histórico de estágio deixou de ser pré-requisito da resolução', () => {
  // Continua ingerido, mas como reforço e única fonte de reabertura.
  assert.match(readModelsV3, /vira reforço para tickets sem data nativa e fonte única de reabertura/);
});
