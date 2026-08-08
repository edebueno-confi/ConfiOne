#!/usr/bin/env node
// Discovery somente leitura da conta HubSpot, para responder duas perguntas com
// evidência em vez de suposição:
//
//   1. Existe alguma propriedade de ticket que carregue a data de encerramento,
//      já que `closedate` está vazio em 100% dos tickets encerrados?
//   2. As associations Ticket ↔ Company e Deal ↔ Company estão disponíveis para
//      o token atual e realmente populadas na conta?
//
// Segurança
// ---------
// O token é lido de HUBSPOT_PRIVATE_APP_TOKEN ou de apps/web/.env.local e nunca
// é impresso, gravado, logado ou incluído no relatório. Nenhuma escrita é feita
// no HubSpot: o script usa apenas GET e o endpoint de leitura em lote de
// associations. Nenhum dado pessoal de contato é coletado.
//
// Uso
// ---
//   node scripts/analytics/hubspot-coverage-discovery.mjs
//   node scripts/analytics/hubspot-coverage-discovery.mjs --sample 200
//   node scripts/analytics/hubspot-coverage-discovery.mjs --out docs/reports/x.json

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const REPO_ROOT = path.resolve(new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const BASE = 'https://api.hubapi.com';

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const SAMPLE_SIZE = Math.min(Number(arg('sample', '100')) || 100, 100);

async function resolveToken() {
  const fromEnv = process.env.HUBSPOT_PRIVATE_APP_TOKEN?.trim();
  if (fromEnv) return { token: fromEnv, origin: 'variável de ambiente' };

  const envFile = path.join(REPO_ROOT, 'apps', 'web', '.env.local');
  if (existsSync(envFile)) {
    const content = await readFile(envFile, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?HUBSPOT_PRIVATE_APP_TOKEN\s*=\s*(.+)\s*$/);
      if (match) {
        const value = match[1].trim().replace(/^["']|["']$/g, '');
        if (value) return { token: value, origin: 'arquivo de ambiente local' };
      }
    }
  }
  throw new Error(
    'Credencial do HubSpot não encontrada. Defina HUBSPOT_PRIVATE_APP_TOKEN no ambiente antes de executar.',
  );
}

async function call(token, endpoint, { method = 'GET', body } = {}) {
  const response = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
  if (!response.ok) {
    // Mensagem sanitizada: nunca ecoa cabeçalho, token ou corpo bruto completo.
    const detail = payload?.category || payload?.message || 'resposta não detalhada';
    const error = new Error(`HTTP ${response.status} em ${endpoint.split('?')[0]}: ${detail}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

/** Propriedades de ticket que plausivelmente carregam data ou duração de encerramento. */
const CLOSE_CANDIDATE_PATTERN = /clos|resolv|encerr|finaliz|time_to|last_?activity|lastmodified/i;

async function discoverTicketProperties(token) {
  const payload = await call(token, '/crm/v3/properties/tickets');
  const all = payload?.results ?? [];
  const candidates = all
    .filter((property) => CLOSE_CANDIDATE_PATTERN.test(property.name) || CLOSE_CANDIDATE_PATTERN.test(property.label ?? ''))
    .map((property) => ({
      name: property.name,
      label: property.label,
      type: property.type,
      fieldType: property.fieldType,
      calculated: property.calculated === true,
      hubspotDefined: property.hubspotDefined === true,
    }));
  return { totalProperties: all.length, candidates };
}

/** Mede o preenchimento real das propriedades candidatas em tickets já encerrados. */
async function measureCloseCoverage(token, propertyNames) {
  const results = await call(token, '/crm/v3/objects/tickets/search', {
    method: 'POST',
    body: {
      filterGroups: [{ filters: [{ propertyName: 'hs_pipeline_stage', operator: 'HAS_PROPERTY' }] }],
      properties: ['hs_pipeline', 'hs_pipeline_stage', 'createdate', ...propertyNames],
      limit: SAMPLE_SIZE,
      sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'DESCENDING' }],
    },
  });
  const rows = results?.results ?? [];
  const filled = {};
  for (const name of propertyNames) filled[name] = 0;
  for (const row of rows) {
    for (const name of propertyNames) {
      const value = row.properties?.[name];
      if (value !== null && value !== undefined && String(value).trim() !== '') filled[name] += 1;
    }
  }
  return {
    sampled: rows.length,
    filled: Object.entries(filled)
      .map(([name, count]) => ({ name, count, percent: rows.length ? Math.round((count / rows.length) * 1000) / 10 : 0 }))
      .sort((a, b) => b.count - a.count),
    sampleTicketIds: rows.slice(0, 3).map((row) => row.id),
  };
}

/**
 * Verifica se o histórico de propriedade permite reconstruir a data em que o
 * ticket entrou no estágio encerrado. É a fonte mais confiável para tempo de
 * resolução, reabertura e tempo em estágio.
 */
async function probeStageHistory(token, ticketIds) {
  if (ticketIds.length === 0) return { available: false, reason: 'nenhum ticket amostrado' };
  const [ticketId] = ticketIds;
  try {
    const payload = await call(
      token,
      `/crm/v3/objects/tickets/${ticketId}?propertiesWithHistory=hs_pipeline_stage`,
    );
    const history = payload?.propertiesWithHistory?.hs_pipeline_stage ?? [];
    return {
      available: history.length > 0,
      versionsOnSampledTicket: history.length,
      oldestChangeAt: history.length ? history[history.length - 1].timestamp : null,
      newestChangeAt: history.length ? history[0].timestamp : null,
      note: history.length > 0
        ? 'O histórico de estágio está acessível e permite derivar a data de encerramento real.'
        : 'O histórico veio vazio para o ticket amostrado.',
    };
  } catch (error) {
    return { available: false, reason: error.message };
  }
}

/** Confere se as associations existem e estão populadas, sem escrever nada. */
async function probeAssociations(token, fromType, toType, ids) {
  if (ids.length === 0) return { available: false, reason: 'nenhum registro amostrado' };
  try {
    const payload = await call(token, `/crm/v4/associations/${fromType}/${toType}/batch/read`, {
      method: 'POST',
      body: { inputs: ids.map((id) => ({ id })) },
    });
    const results = payload?.results ?? [];
    const withAssociation = results.filter((row) => (row.to ?? []).length > 0).length;
    return {
      available: true,
      probed: ids.length,
      withAssociation,
      percent: ids.length ? Math.round((withAssociation / ids.length) * 1000) / 10 : 0,
    };
  } catch (error) {
    return { available: false, reason: error.message, missingScope: error.status === 403 };
  }
}

/**
 * Amostra dirigida: tickets encerrados dentro dos pipelines que o Dashboard
 * realmente publica. A primeira sondagem usou a base inteira e podia estar
 * enviesada por tickets antigos de pipelines inativos.
 */
async function probeClosedTicketDates(token, pipelineIds, propertyNames) {
  const payload = await call(token, '/crm/v3/objects/tickets/search', {
    method: 'POST',
    body: {
      filterGroups: [{
        filters: [
          { propertyName: 'hs_pipeline', operator: 'IN', values: pipelineIds },
          { propertyName: 'hs_is_closed', operator: 'EQ', value: 'true' },
        ],
      }],
      properties: ['hs_pipeline', 'createdate', ...propertyNames],
      limit: SAMPLE_SIZE,
      sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
    },
  });
  const rows = payload?.results ?? [];
  const filled = Object.fromEntries(propertyNames.map((name) => [name, 0]));
  for (const row of rows) {
    for (const name of propertyNames) {
      const value = row.properties?.[name];
      if (value !== null && value !== undefined && String(value).trim() !== '') filled[name] += 1;
    }
  }
  return {
    sampled: rows.length,
    total: payload?.total ?? null,
    filled: Object.entries(filled)
      .map(([name, count]) => ({ name, count, percent: rows.length ? Math.round((count / rows.length) * 1000) / 10 : 0 }))
      .sort((a, b) => b.count - a.count),
  };
}

/** Amostra de tickets recentes, para medir association sem viés de base antiga. */
async function probeRecentTicketAssociations(token, pipelineIds) {
  const payload = await call(token, '/crm/v3/objects/tickets/search', {
    method: 'POST',
    body: {
      filterGroups: [{ filters: [{ propertyName: 'hs_pipeline', operator: 'IN', values: pipelineIds }] }],
      properties: ['hs_pipeline'],
      limit: SAMPLE_SIZE,
      sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
    },
  });
  const ids = (payload?.results ?? []).map((row) => row.id);
  return probeAssociations(token, 'tickets', 'companies', ids);
}

/** Última interação por empresa: desbloqueia clientes sem contato recente. */
async function probeCompanyActivity(token) {
  const payload = await call(token, '/crm/v3/properties/companies');
  const all = payload?.results ?? [];
  const candidates = all
    .filter((property) => /last_?activity|last_?contacted|last_?engagement|notes_last/i.test(property.name))
    .map((property) => property.name)
    .slice(0, 10);
  if (candidates.length === 0) return { totalProperties: all.length, candidates: [], filled: [] };

  const sample = await call(token, '/crm/v3/objects/companies/search', {
    method: 'POST',
    body: {
      filterGroups: [{ filters: [{ propertyName: 'status_do_cliente___aftersale', operator: 'EQ', value: 'Cliente' }] }],
      properties: ['name', ...candidates],
      limit: SAMPLE_SIZE,
    },
  });
  const rows = sample?.results ?? [];
  const filled = Object.fromEntries(candidates.map((name) => [name, 0]));
  for (const row of rows) {
    for (const name of candidates) {
      const value = row.properties?.[name];
      if (value !== null && value !== undefined && String(value).trim() !== '') filled[name] += 1;
    }
  }
  return {
    totalProperties: all.length,
    candidates,
    sampled: rows.length,
    filled: Object.entries(filled)
      .map(([name, count]) => ({ name, count, percent: rows.length ? Math.round((count / rows.length) * 1000) / 10 : 0 }))
      .sort((a, b) => b.count - a.count),
  };
}

async function sampleDealIds(token) {
  const payload = await call(token, `/crm/v3/objects/deals?limit=${SAMPLE_SIZE}&properties=pipeline`);
  return (payload?.results ?? []).map((row) => row.id);
}

async function sampleTicketIds(token) {
  const payload = await call(token, `/crm/v3/objects/tickets?limit=${SAMPLE_SIZE}&properties=hs_pipeline`);
  return (payload?.results ?? []).map((row) => row.id);
}

async function main() {
  const { token, origin } = await resolveToken();
  console.log(`Credencial carregada de ${origin}. O valor não é exibido nem gravado.`);
  console.log(`Amostra por consulta: ${SAMPLE_SIZE} registros. Somente leitura.\n`);

  const properties = await discoverTicketProperties(token);
  console.log(`Propriedades de ticket na conta: ${properties.totalProperties}`);
  console.log(`Candidatas a data/duração de encerramento: ${properties.candidates.length}`);
  for (const candidate of properties.candidates) {
    console.log(`  · ${candidate.name} (${candidate.type}) — ${candidate.label}`);
  }

  const candidateNames = properties.candidates.map((c) => c.name).slice(0, 25);
  const coverage = await measureCloseCoverage(token, candidateNames);
  console.log(`\nPreenchimento real em ${coverage.sampled} tickets amostrados:`);
  for (const row of coverage.filled) {
    console.log(`  · ${row.name}: ${row.count}/${coverage.sampled} (${row.percent}%)`);
  }

  const stageHistory = await probeStageHistory(token, coverage.sampleTicketIds);
  console.log('\nHistórico de estágio do ticket:');
  console.log(`  disponível: ${stageHistory.available ? 'sim' : 'não'}`);
  if (stageHistory.note) console.log(`  ${stageHistory.note}`);
  if (stageHistory.reason) console.log(`  motivo: ${stageHistory.reason}`);

  const ticketIds = await sampleTicketIds(token);
  const dealIds = await sampleDealIds(token);
  const ticketCompany = await probeAssociations(token, 'tickets', 'companies', ticketIds);
  const dealCompany = await probeAssociations(token, 'deals', 'companies', dealIds);

  console.log('\nAssociations:');
  console.log(`  Ticket → Company: ${ticketCompany.available
    ? `${ticketCompany.withAssociation}/${ticketCompany.probed} (${ticketCompany.percent}%)`
    : `indisponível — ${ticketCompany.reason}`}`);
  console.log(`  Deal → Company:   ${dealCompany.available
    ? `${dealCompany.withAssociation}/${dealCompany.probed} (${dealCompany.percent}%)`
    : `indisponível — ${dealCompany.reason}`}`);

  // Sondagem dirigida aos pipelines que o Dashboard publica de verdade.
  const activePipelines = String(arg('pipelines', '')).split(',').map((v) => v.trim()).filter(Boolean);
  let closedDates = null;
  let recentAssociations = null;
  let companyActivity = null;

  if (activePipelines.length > 0) {
    closedDates = await probeClosedTicketDates(token, activePipelines, [
      'closed_date',
      'hs_last_closed_date',
      'time_to_close',
      'time_to_first_agent_reply',
      'hs_time_to_first_response_in_operating_hours',
      'hs_lastactivitydate',
    ]);
    console.log(`\nTickets encerrados nos pipelines publicados (${closedDates.sampled} de ${closedDates.total ?? '?'}):`);
    for (const row of closedDates.filled) {
      console.log(`  · ${row.name}: ${row.count}/${closedDates.sampled} (${row.percent}%)`);
    }

    recentAssociations = await probeRecentTicketAssociations(token, activePipelines);
    console.log(`\nAssociation em tickets recentes: ${recentAssociations.available
      ? `${recentAssociations.withAssociation}/${recentAssociations.probed} (${recentAssociations.percent}%)`
      : `indisponível — ${recentAssociations.reason}`}`);
  }

  companyActivity = await probeCompanyActivity(token);
  console.log('\nÚltima interação por empresa (clientes ativos):');
  if (companyActivity.filled.length === 0) {
    console.log('  nenhuma propriedade candidata encontrada');
  } else {
    for (const row of companyActivity.filled) {
      console.log(`  · ${row.name}: ${row.count}/${companyActivity.sampled} (${row.percent}%)`);
    }
  }

  const report = {
    generated_at: new Date().toISOString(),
    sample_size: SAMPLE_SIZE,
    ticket_properties: properties,
    close_date_coverage: coverage,
    closed_tickets_in_published_pipelines: closedDates,
    stage_history: stageHistory,
    associations: {
      ticket_to_company: ticketCompany,
      ticket_to_company_recent: recentAssociations,
      deal_to_company: dealCompany,
    },
    company_activity: companyActivity,
  };

  const out = arg('out', path.join('docs', 'reports', 'hubspot-coverage-discovery.json'));
  const target = path.isAbsolute(out) ? out : path.join(REPO_ROOT, out);
  await writeFile(target, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`\nRelatório gravado em ${out}. Nenhuma credencial foi incluída.`);
}

main().catch((error) => {
  console.error(`Discovery interrompido: ${error.message}`);
  process.exitCode = 1;
});
