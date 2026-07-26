// Edge Function: hubspot-sync
// Sincroniza Deals (Comercial Aftersale), Tickets (Suporte), Owners e estagios de
// pipeline do HubSpot para tabelas locais do SaaS. O dashboard consulta as views
// vw_analytics_* sobre essas tabelas (fetch e agregacao desacoplados).
//
// Seguranca:
//   * Token do HubSpot fica server-side (Deno.env), nunca exposto ao frontend.
//   * Disparo autorizado a platform_admin (via JWT) OU por segredo de agendamento
//     (header x-analytics-sync-secret == ANALYTICS_SYNC_SECRET) para uso futuro em cron.
//   * Escrita nas tabelas usa service role (bypassa RLS).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import {
  createServiceClient,
  getAuthorizationHeader,
  jsonResponse,
  optionsResponse,
} from '../_shared/ticket-evidence.ts';
import {
  fetchDealsByPipeline,
  fetchCompanies,
  fetchOwners,
  fetchPipelineStages,
  fetchPipelineLabel,
  fetchPipelineDefinitions,
  fetchTicketsByPipeline,
  toNumeric,
  toTimestamp,
  type HubSpotRecord,
} from '../_shared/hubspot.ts';
import {
  normalizeHubspotSyncScope,
  scopeObjectType,
  syncsCompanies,
  syncsPipelines,
  usesDomainSyncWatermark,
} from '../_shared/hubspot-sync-scope.mjs';

const DEAL_PROPERTIES = [
  'pipeline',
  'dealstage',
  'hubspot_owner_id',
  'amount_in_home_currency',
  'dealtype',
  'dealname',
  'createdate',
  'closedate',
];

const TICKET_PROPERTIES = [
  'hs_pipeline',
  'hs_pipeline_stage',
  'hubspot_owner_id',
  'source_type',
  'hs_ticket_priority',
  'createdate',
  'closedate',
  'hs_time_to_first_response_sla_status',
  'hs_time_to_close_sla_status',
  'subject',
];

const COMPANY_PROPERTIES = [
  'name',
  'domain',
  'cnpj',
  'aftersale___mrr',
  'status_do_cliente___aftersale',
  'status_do_contrato',
  'cs_owner___aftersale',
];

interface SourceConfigRow {
  domain_key: string;
  object_type: 'deal' | 'ticket';
  hubspot_pipeline_id: string;
  is_active: boolean;
}

async function chunkedUpsert(
  client: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
) {
  const size = 500;
  for (let index = 0; index < rows.length; index += size) {
    const slice = rows.slice(index, index + size);
    const { error } = await client.from(table).upsert(slice, { onConflict });
    if (error) {
      throw new Error(`Falha ao gravar em ${table}: ${error.message}`);
    }
  }
}

async function authorize(req: Request, client: SupabaseClient): Promise<string | null> {
  // Caminho de agendamento (cron): segredo compartilhado.
  const syncSecret = Deno.env.get('ANALYTICS_SYNC_SECRET');
  const providedSecret = req.headers.get('x-analytics-sync-secret');
  if (syncSecret && providedSecret && providedSecret === syncSecret) {
    return 'scheduler';
  }

  // Caminho interativo: JWT de platform_admin.
  const authHeader = getAuthorizationHeader(req);
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  const userId = String(data.claims.sub);

  const { data: roleRow, error: roleError } = await client
    .from('user_global_roles')
    .select('user_id')
    .eq('user_id', userId)
    .eq('role', 'platform_admin')
    .maybeSingle();

  if (roleError || !roleRow) return null;
  return userId;
}

function isDue(frequency: string, lastRunAt: string | null): boolean {
  if (!lastRunAt) return true;
  const last = Date.parse(lastRunAt);
  if (!Number.isFinite(last)) return true;
  if (frequency === 'hourly') return Date.now() - last >= 55 * 60 * 1000;
  if (frequency === 'daily') return new Date(last).toISOString().slice(0, 10) !== new Date().toISOString().slice(0, 10);
  return false;
}

async function resolveHubSpotToken(client: SupabaseClient): Promise<string | undefined> {
  const { data, error } = await client.rpc('rpc_service_get_managed_integration_secret', {
    p_integration_key: 'hubspot',
  });
  if (!error && typeof data === 'string' && data.trim().length > 0) return data.trim();
  const fallback = Deno.env.get('HUBSPOT_PRIVATE_APP_TOKEN')?.trim();
  if (fallback) return fallback;
  if (error) throw new Error(`Falha ao ler credencial gerenciada do HubSpot: ${error.message}`);
  return undefined;
}

async function syncStages(
  client: SupabaseClient,
  objectType: 'deal' | 'ticket',
  pipelineId: string,
  token: string,
): Promise<number> {
  const stages = await fetchPipelineStages(objectType === 'deal' ? 'deals' : 'tickets', pipelineId, token);
  const rows = stages.map((stage) => ({
    object_type: objectType,
    pipeline_id: pipelineId,
    stage_id: stage.stageId,
    label: stage.label,
    display_order: stage.displayOrder,
    is_closed: stage.isClosed,
    is_won: stage.isWon,
    metadata: stage.metadata,
    synced_at: new Date().toISOString(),
  }));
  await chunkedUpsert(client, 'hubspot_pipeline_stages', rows, 'object_type,pipeline_id,stage_id');
  return rows.length;
}

async function syncPipelineCatalog(
  client: SupabaseClient,
  domainKey: 'commercial' | 'cs',
  objectType: 'deal' | 'ticket',
  token: string,
): Promise<number> {
  const definitions = await fetchPipelineDefinitions(objectType === 'deal' ? 'deals' : 'tickets', token);
  const activeDefinitions = definitions.filter((definition) => !definition.archived);
  if (activeDefinitions.length === 0) return 0;

  // Insere apenas pipelines descobertos. O estado e o alias de uma fonte
  // existente pertencem ao administrador e nao podem ser sobrescritos pelo
  // catalogo do HubSpot.
  const { error: catalogError } = await client.from('analytics_source_config').upsert(
    activeDefinitions.map((definition) => ({
      domain_key: domainKey,
      object_type: objectType,
      hubspot_pipeline_id: definition.pipelineId,
      hubspot_pipeline_label: definition.label,
      label: null,
      is_active: false,
    })),
    { onConflict: 'domain_key,object_type,hubspot_pipeline_id', ignoreDuplicates: true },
  );
  if (catalogError) throw new Error(`Falha ao atualizar catalogo de pipelines: ${catalogError.message}`);

  for (const definition of activeDefinitions) {
    const { error: labelError } = await client
      .from('analytics_source_config')
      .update({ hubspot_pipeline_label: definition.label })
      .eq('domain_key', domainKey)
      .eq('object_type', objectType)
      .eq('hubspot_pipeline_id', definition.pipelineId);
    if (labelError) throw new Error(`Falha ao atualizar nome de pipeline: ${labelError.message}`);
  }

  return activeDefinitions.length;
}

async function syncDeals(client: SupabaseClient, pipelineId: string, token: string): Promise<number> {
  // O catálogo deste portal não expôs hs_lastmodifieddate para Deals. Mantemos
  // a carga completa desse objeto (volume pequeno) para não enviar um filtro
  // inválido e deixar mudanças de etapa/valor sem atualização.
  const records = await fetchDealsByPipeline(pipelineId, DEAL_PROPERTIES, token);
  const now = new Date().toISOString();
  const rows = records.map((record: HubSpotRecord) => ({
    deal_id: record.id,
    pipeline_id: record.properties.pipeline ?? pipelineId,
    dealstage: record.properties.dealstage ?? null,
    owner_id: record.properties.hubspot_owner_id ?? null,
    amount_home: toNumeric(record.properties.amount_in_home_currency),
    dealtype: record.properties.dealtype ?? null,
    deal_name: record.properties.dealname ?? null,
    hs_created_at: toTimestamp(record.properties.createdate),
    hs_closed_at: toTimestamp(record.properties.closedate),
    raw: record.properties,
    synced_at: now,
  }));
  await chunkedUpsert(client, 'hubspot_deals', rows, 'deal_id');
  return rows.length;
}

async function syncTickets(client: SupabaseClient, pipelineId: string, token: string, updatedAfterMs?: number): Promise<number> {
  const records = await fetchTicketsByPipeline(pipelineId, TICKET_PROPERTIES, token, updatedAfterMs);
  const now = new Date().toISOString();
  const rows = records.map((record: HubSpotRecord) => ({
    ticket_id: record.id,
    pipeline_id: record.properties.hs_pipeline ?? pipelineId,
    pipeline_stage: record.properties.hs_pipeline_stage ?? null,
    owner_id: record.properties.hubspot_owner_id ?? null,
    source_type: record.properties.source_type ?? null,
    priority: record.properties.hs_ticket_priority ?? null,
    hs_created_at: toTimestamp(record.properties.createdate),
    hs_closed_at: toTimestamp(record.properties.closedate),
    time_to_first_response_sla_status:
      record.properties.hs_time_to_first_response_sla_status ?? null,
    time_to_close_sla_status: record.properties.hs_time_to_close_sla_status ?? null,
    raw: record.properties,
    synced_at: now,
  }));
  await chunkedUpsert(client, 'hubspot_tickets', rows, 'ticket_id');
  return rows.length;
}

async function syncOwners(client: SupabaseClient, token: string): Promise<number> {
  const owners = await fetchOwners(token);
  const now = new Date().toISOString();
  const rows = owners.map((owner) => ({
    owner_id: owner.ownerId,
    email: owner.email,
    first_name: owner.firstName,
    last_name: owner.lastName,
    full_name: owner.fullName,
    archived: owner.archived,
    raw: owner.raw,
    synced_at: now,
  }));
  await chunkedUpsert(client, 'hubspot_owners', rows, 'owner_id');
  return rows.length;
}

function normalizeTaxId(value: string | null | undefined): string | null {
  const normalized = (value ?? '').replace(/\D/g, '');
  return normalized || null;
}

async function syncCompanies(client: SupabaseClient, token: string, updatedAfterMs?: number): Promise<number> {
  const records = await fetchCompanies(COMPANY_PROPERTIES, token, updatedAfterMs);
  if (records.length === 0 && updatedAfterMs === undefined) {
    throw new Error('O HubSpot retornou zero empresas; o cache anterior foi preservado por segurança.');
  }
  if (records.length === 0) return 0;
  const now = new Date().toISOString();
  const rows = records.map((record: HubSpotRecord) => ({
    company_id: record.id,
    name: record.properties.name ?? null,
    domain: record.properties.domain ?? null,
    tax_id: normalizeTaxId(record.properties.cnpj),
    mrr: toNumeric(record.properties.aftersale___mrr),
    client_status: record.properties.status_do_cliente___aftersale ?? null,
    contract_status: record.properties.status_do_contrato ?? null,
    cs_owner_id: record.properties.cs_owner___aftersale ?? null,
    raw: record.properties,
    synced_at: now,
  }));
  await chunkedUpsert(client, 'hubspot_companies', rows, 'company_id');

  // A API de objetos não retorna empresas arquivadas/mescladas por padrão.
  // Depois que todos os lotes foram gravados, removemos somente os IDs que
  // ficaram fora deste snapshot. O corte por timestamp evita que uma execução
  // concorrente mais antiga remova dados gravados por uma execução mais nova.
  if (updatedAfterMs === undefined) {
    const { error: staleError } = await client
      .from('hubspot_companies')
      .delete()
      .lt('synced_at', now);
    if (staleError) {
      throw new Error(`Falha ao remover empresas ausentes do snapshot HubSpot: ${staleError.message}`);
    }
  }
  return rows.length;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req);
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
  }

  const client = createServiceClient();

  const actor = await authorize(req, client);
  if (!actor) {
    return jsonResponse({ error: 'Acesso negado. Requer platform_admin.' }, { status: 403 });
  }

  const { data: syncSchedule } = await client
    .from('analytics_integration_schedule')
    .select('hubspot_enabled,hubspot_frequency,hubspot_last_run_at')
    .limit(1)
    .maybeSingle();
  if (actor === 'scheduler') {
    const enabled = syncSchedule?.hubspot_enabled === true;
    const frequency = String(syncSchedule?.hubspot_frequency ?? 'off');
    if (!enabled || frequency === 'off' || !isDue(frequency, syncSchedule?.hubspot_last_run_at ?? null)) {
      return jsonResponse({ ok: true, skipped: true, reason: !enabled || frequency === 'off' ? 'desativado' : 'ainda não vencido' });
    }
  }

  // Escopo opcional: { "domain": "commercial" | "cs" }.
  let requestedDomain: string | null = null;
  let scope = 'all';
  let fullRefresh = false;
  try {
    const body = (await req.json().catch(() => null)) as { domain?: string; scope?: string; full?: boolean } | null;
    requestedDomain = body?.domain?.trim() || null;
    scope = normalizeHubspotSyncScope(body?.scope);
    fullRefresh = body?.full === true;
  } catch {
    requestedDomain = null;
  }

  const { data: configRows, error: configError } = await client
    .from('analytics_source_config')
    .select('domain_key, object_type, hubspot_pipeline_id, is_active')
    .eq('is_active', true);

  if (configError) {
    return jsonResponse({ error: `Falha ao ler configuracao: ${configError.message}` }, { status: 500 });
  }

  const scopeDomain = scope === 'commercial' ? 'commercial' : scope === 'cs' ? 'cs' : null;
  const effectiveDomain = requestedDomain ?? scopeDomain;
  const scopeType = scopeObjectType(scope);
  const configs = (configRows ?? []).filter((row: SourceConfigRow) => {
    if (effectiveDomain && row.domain_key !== effectiveDomain) return false;
    if (scopeType && row.object_type !== scopeType) return false;
    return true;
  }) as SourceConfigRow[];
  const uniqueConfigs = Array.from(
    new Map(configs.map((config) => [`${config.domain_key}:${config.object_type}:${config.hubspot_pipeline_id}`, config])).values(),
  );

  if (syncsPipelines(scope) && uniqueConfigs.length === 0) {
    return jsonResponse({ error: 'Nenhuma fonte ativa para o escopo solicitado.' }, { status: 400 });
  }

  const staleRunningCutoff = Date.now() - 15 * 60 * 1000;
  const { data: runningRuns, error: runningRunsError } = await client
    .from('hubspot_sync_runs')
    .select('id,started_at')
    .eq('status', 'running')
    .order('started_at', { ascending: false })
    .limit(10);
  if (runningRunsError) {
    return jsonResponse({ error: `Falha ao verificar execucoes em andamento: ${runningRunsError.message}` }, { status: 500 });
  }
  const activeRun = (runningRuns ?? []).find((run) => {
    const startedAt = Date.parse(String(run.started_at ?? ''));
    return Number.isFinite(startedAt) && startedAt > staleRunningCutoff;
  });
  if (activeRun) {
    return jsonResponse({ error: 'Já existe uma sincronização do HubSpot em andamento. Aguarde a conclusão antes de iniciar outra.' }, { status: 409 });
  }
  const staleRuns = (runningRuns ?? []).filter((run) => {
    const startedAt = Date.parse(String(run.started_at ?? ''));
    return String(run.id ?? '') !== String(activeRun?.id ?? '') && Number.isFinite(startedAt) && startedAt <= staleRunningCutoff;
  });
  if (staleRuns.length > 0) {
    await client
      .from('hubspot_sync_runs')
      .update({
        status: 'error',
        finished_at: new Date().toISOString(),
        error_message: 'Execução concorrente interrompida pelo runtime; nenhum snapshot novo foi confirmado.',
      })
      .in('id', staleRuns.map((run) => run.id));
  }

  const { data: runRow, error: runError } = await client
    .from('hubspot_sync_runs')
    .insert({
      domain_key: scope === 'all' ? requestedDomain : scope,
      status: 'running',
      triggered_by: actor === 'scheduler' ? null : actor,
      correlation_id: (() => {
        const header = req.headers.get('x-analytics-correlation-id');
        return header && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(header) ? header : crypto.randomUUID();
      })(),
    })
    .select('id,correlation_id')
    .single();

  if (runError || !runRow) {
    return jsonResponse({ error: `Falha ao registrar execucao: ${runError?.message}` }, { status: 500 });
  }

  const runId = runRow.id as string;
  const counters = { deals: 0, tickets: 0, owners: 0, stages: 0, companies: 0 };

  try {
    let previousSuccessQuery = client
      .from('hubspot_sync_runs')
      .select('finished_at')
      .eq('status', 'success')
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false });
    if (usesDomainSyncWatermark(scope)) {
      previousSuccessQuery = previousSuccessQuery.eq('domain_key', scope);
    }
    // O primeiro lote após uma execução legada pode não ter `domain_key`
    // preenchido por escopo. Um snapshot global bem-sucedido ainda é uma
    // fronteira válida para a janela incremental de empresas/tickets.
    const { data: previousSuccess } = await previousSuccessQuery.limit(1).maybeSingle();
    const previousFinishedAt = previousSuccess?.finished_at ? Date.parse(String(previousSuccess.finished_at)) : Number.NaN;
    const updatedAfterMs = !fullRefresh && Number.isFinite(previousFinishedAt)
      ? Math.max(0, previousFinishedAt - 5 * 60 * 1000)
      : undefined;
    const hubspotToken = await resolveHubSpotToken(client);
    if (!hubspotToken) throw new Error('Credencial do HubSpot não configurada. Cadastre-a em Admin > Configurações > Integrações.');
    if (syncsCompanies(scope)) {
      counters.owners = await syncOwners(client, hubspotToken);
      counters.companies = await syncCompanies(client, hubspotToken, updatedAfterMs);
    }

    if (syncsPipelines(scope)) {
      // Descobre novos pipelines sem ativá-los automaticamente. Assim o
      // administrador pode avaliar a atividade real e habilitar somente o
      // recorte comercial desejado na tela de Configuração.
      if (!scopeType || scopeType === 'deal') {
        try {
          await syncPipelineCatalog(client, 'commercial', 'deal', hubspotToken);
        } catch {
          // O catalogo e complementar; a sincronizacao das fontes ja
          // configuradas continua mesmo se a descoberta nao estiver disponivel.
        }
      }
      if (!scopeType || scopeType === 'ticket') {
        try {
          await syncPipelineCatalog(client, 'cs', 'ticket', hubspotToken);
        } catch {
          // Ver comentario acima: descoberta nao deve derrubar o sync.
        }
      }
      for (const config of uniqueConfigs) {
        const pipelineLabel = await fetchPipelineLabel(
          config.object_type === 'deal' ? 'deals' : 'tickets',
          config.hubspot_pipeline_id,
          hubspotToken,
        );
        if (pipelineLabel) {
          await client
            .from('analytics_source_config')
            .update({ hubspot_pipeline_label: pipelineLabel })
            .eq('domain_key', config.domain_key)
            .eq('object_type', config.object_type)
            .eq('hubspot_pipeline_id', config.hubspot_pipeline_id);
        }
        counters.stages += await syncStages(client, config.object_type, config.hubspot_pipeline_id, hubspotToken);
        if (config.object_type === 'deal') {
          counters.deals += await syncDeals(client, config.hubspot_pipeline_id, hubspotToken);
        } else {
          counters.tickets += await syncTickets(client, config.hubspot_pipeline_id, hubspotToken, updatedAfterMs);
        }
      }
    }

    await client
      .from('hubspot_sync_runs')
      .update({
        status: 'success',
        finished_at: new Date().toISOString(),
        deals_synced: counters.deals,
        tickets_synced: counters.tickets,
        owners_synced: counters.owners,
        stages_synced: counters.stages,
        companies_synced: counters.companies,
      })
      .eq('id', runId);

    if (actor === 'scheduler') {
      await client.from('analytics_integration_schedule').update({
        hubspot_last_run_at: new Date().toISOString(),
        hubspot_last_status: 'success',
        hubspot_last_message: `HubSpot ${counters.companies} empresas, ${counters.deals} deals, ${counters.tickets} tickets, ${counters.owners} responsÃ¡veis e ${counters.stages} estÃ¡gios.`,
      }).limit(1);
    }

    return jsonResponse({ ok: true, runId, correlationId: runRow.correlation_id, mode: updatedAfterMs === undefined ? 'full' : 'incremental', ...counters });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await client
      .from('hubspot_sync_runs')
      .update({
        status: 'error',
        finished_at: new Date().toISOString(),
        deals_synced: counters.deals,
        tickets_synced: counters.tickets,
        owners_synced: counters.owners,
        stages_synced: counters.stages,
        companies_synced: counters.companies,
        error_message: message.slice(0, 1000),
      })
      .eq('id', runId);

    if (actor === 'scheduler') {
      await client.from('analytics_integration_schedule').update({
        hubspot_last_run_at: new Date().toISOString(),
        hubspot_last_status: 'error',
        hubspot_last_message: message.slice(0, 500),
      }).limit(1);
    }

    return jsonResponse({ error: message }, { status: 502 });
  }
});
