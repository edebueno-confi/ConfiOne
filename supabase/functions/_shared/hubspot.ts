// Cliente minimalista da API REST oficial do HubSpot para o modulo Analytics.
// Autenticacao: Private App Token via Deno.env (HUBSPOT_PRIVATE_APP_TOKEN), nunca no frontend.
// Escopos minimos esperados: crm.objects.deals.read, crm.objects.tickets.read,
// crm.objects.owners.read, crm.schemas.deals.read, crm.schemas.tickets.read.

import { buildHubSpotCompanyBatchUpdatePayload, chunkCompanyUpdates } from './hubspot-company-batch.mjs';
import type { SyncRequestTelemetryEvent } from './sync-request-telemetry.ts';

const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const HUBSPOT_REQUEST_TIMEOUT_MS = 20_000;
export const HUBSPOT_ASSOCIATION_BATCH_LIMIT = 100;
export const HUBSPOT_HISTORY_BATCH_LIMIT = 50;

export interface HubSpotStage {
  stageId: string;
  label: string;
  displayOrder: number;
  isClosed: boolean;
  isWon: boolean;
  metadata: Record<string, unknown>;
}

export interface HubSpotPipelineDefinition {
  pipelineId: string;
  label: string;
  displayOrder: number;
  archived: boolean;
  stages: HubSpotStage[];
  metadata: Record<string, unknown>;
}

export interface HubSpotOwner {
  ownerId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  archived: boolean;
  raw: Record<string, unknown>;
}

export interface HubSpotRecord {
  id: string;
  properties: Record<string, string | null>;
}

export interface HubSpotTicketPipelineEvidence {
  total: number | null;
  pages: number;
  complete: boolean;
}

export interface HubSpotTicketPageOptions {
  cursor?: string | null;
  rangeStartMs?: number;
  rangeEndMs?: number;
  updatedAfterMs?: number;
  telemetry?: HubSpotRequestObserver;
}

export type HubSpotRequestObserver = {
  record(event: SyncRequestTelemetryEvent): void;
};

export function chunkIds(ids: string[], limit: number): string[][] {
  if (!Number.isInteger(limit) || limit <= 0) throw new Error('Limite de lote HubSpot inválido.');
  const chunks: string[][] = [];
  for (let offset = 0; offset < ids.length; offset += limit) chunks.push(ids.slice(offset, offset + limit));
  return chunks;
}

export interface HubSpotTicketPage {
  records: HubSpotRecord[];
  total: number | null;
  nextCursor: string | null;
}

export interface HubSpotObjectPage {
  records: HubSpotRecord[];
  total: number | null;
  nextCursor: string | null;
}

export interface HubSpotMergeResult {
  id?: string;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
  objectWriteTraceId?: string;
  url?: string;
  properties?: Record<string, unknown>;
}

function readToken(tokenOverride?: string): string {
  const token = tokenOverride || Deno.env.get('HUBSPOT_PRIVATE_APP_TOKEN');
  if (!token || token.length === 0) {
    throw new Error('Missing HUBSPOT_PRIVATE_APP_TOKEN environment variable.');
  }
  return token;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hubSpotEndpointKey(path: string) {
  const pathname = path.split('?')[0];
  if (pathname.includes('/objects/deals/search')) return 'crm.objects.deals.search';
  if (pathname.includes('/objects/tickets/search')) return 'crm.objects.tickets.search';
  if (pathname.includes('/objects/companies/search')) return 'crm.objects.companies.search';
  if (pathname.includes('/objects/companies/batch/update')) return 'crm.objects.companies.batch_update';
  if (pathname.includes('/objects/companies/merge')) return 'crm.objects.companies.merge';
  if (pathname.includes('/objects/companies')) return 'crm.objects.companies';
  if (pathname.includes('/pipelines/')) return 'crm.pipelines';
  if (pathname.includes('/owners')) return 'crm.owners';
  if (pathname.includes('/properties/companies/groups')) return 'crm.properties.companies.groups';
  if (pathname.includes('/properties/companies')) return 'crm.properties.companies';
  return 'hubspot.unknown';
}

function recordRequest(observer: HubSpotRequestObserver | undefined, event: SyncRequestTelemetryEvent) {
  try { observer?.record(event); } catch { /* observabilidade não interrompe o sync */ }
}

export function nextHubSpotCursor(previous: string | undefined | null, candidate: unknown, context: string): string | null {
  if (candidate === undefined || candidate === null || candidate === '') return null;
  const next = String(candidate).trim();
  if (!next || next === previous) throw new Error(`Cursor HubSpot sem progresso em ${context}.`);
  return next;
}

type HubSpotAssociationBatchResult = {
  from?: { id?: string };
  to?: Array<{ toObjectId?: string; associationTypes?: Array<{ associationCategory?: string; associationTypeId?: number | string }> }>;
};

export async function fetchAssociationsBatch(
  fromObjectType: 'tickets' | 'deals',
  toObjectType: 'companies' | 'contacts',
  ids: string[],
  tokenOverride?: string,
): Promise<Array<{ from_id: string; to_id: string; label: string | null }>> {
  if (ids.length > HUBSPOT_ASSOCIATION_BATCH_LIMIT) {
    throw new Error(`Lote de associations acima do limite de ${HUBSPOT_ASSOCIATION_BATCH_LIMIT}.`);
  }
  if (ids.length === 0) return [];

  const response = await hubspotFetch(
    `/crm/v4/associations/${fromObjectType}/${toObjectType}/batch/read`,
    { method: 'POST', body: JSON.stringify({ inputs: ids.map((id) => ({ id })) }) },
    0,
    tokenOverride,
  );
  const payload = await response.json() as { results?: HubSpotAssociationBatchResult[] };
  const rows: Array<{ from_id: string; to_id: string; label: string | null }> = [];
  for (const result of payload.results ?? []) {
    const fromId = String(result.from?.id ?? '').trim();
    if (!fromId) continue;
    for (const association of result.to ?? []) {
      const toId = String(association.toObjectId ?? '').trim();
      if (!toId) continue;
      const label = association.associationTypes?.[0]?.associationCategory
        ? String(association.associationTypes[0].associationCategory)
        : null;
      rows.push({ from_id: fromId, to_id: toId, label });
    }
  }
  return rows;
}

type HubSpotHistoryValue = { value?: string | null; timestamp?: string | null };
type HubSpotHistoryBatchResult = {
  id?: string;
  properties?: Record<string, string | null>;
  propertiesWithHistory?: Record<string, HubSpotHistoryValue[]>;
};

export async function fetchStageHistoryBatch(
  objectType: 'tickets' | 'deals',
  ids: string[],
  tokenOverride?: string,
): Promise<Array<{ object_id: string; changed_at: string; stage_id: string; pipeline_id: string | null }>> {
  if (ids.length > HUBSPOT_HISTORY_BATCH_LIMIT) {
    throw new Error(`Lote de historico acima do limite de ${HUBSPOT_HISTORY_BATCH_LIMIT}.`);
  }
  if (ids.length === 0) return [];

  const stageProperty = objectType === 'tickets' ? 'hs_pipeline_stage' : 'dealstage';
  const pipelineProperty = objectType === 'tickets' ? 'hs_pipeline' : 'pipeline';
  const response = await hubspotFetch(
    `/crm/v3/objects/${objectType}/batch/read`,
    {
      method: 'POST',
      body: JSON.stringify({
        inputs: ids.map((id) => ({ id })),
        properties: [pipelineProperty],
        propertiesWithHistory: [stageProperty],
      }),
    },
    0,
    tokenOverride,
  );
  const payload = await response.json() as { results?: HubSpotHistoryBatchResult[] };
  const rows: Array<{ object_id: string; changed_at: string; stage_id: string; pipeline_id: string | null }> = [];
  for (const result of payload.results ?? []) {
    const objectId = String(result.id ?? '').trim();
    if (!objectId) continue;
    const pipelineId = result.properties?.[pipelineProperty] ?? null;
    for (const event of result.propertiesWithHistory?.[stageProperty] ?? []) {
      const stageId = String(event.value ?? '').trim();
      const changedAt = event.timestamp ? toTimestamp(event.timestamp) : null;
      if (stageId && changedAt) rows.push({ object_id: objectId, changed_at: changedAt, stage_id: stageId, pipeline_id: pipelineId });
    }
  }
  return rows;
}

// Fetch com backoff em 429/5xx respeitando Retry-After (proteção de rate limit).
async function hubspotFetch(
  path: string,
  init: RequestInit = {},
  attempt = 0,
  tokenOverride?: string,
  observer?: HubSpotRequestObserver,
): Promise<Response> {
  const token = readToken(tokenOverride);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HUBSPOT_REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();
  const method = init.method ?? 'GET';
  let response: Response;
  try {
    response = await fetch(`${HUBSPOT_BASE_URL}${path}`, {
      ...init,
      signal: init.signal ?? controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    recordRequest(observer, {
      endpoint: hubSpotEndpointKey(path),
      method,
      attempt: attempt + 1,
      statusCode: null,
      durationMs: Date.now() - startedAt,
      errorCode: error instanceof DOMException && error.name === 'AbortError' ? 'timeout' : 'network_error',
    });
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`HubSpot ${method} ${path} excedeu o tempo limite de ${HUBSPOT_REQUEST_TIMEOUT_MS / 1000}s.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const retryAfterHeader = response.headers.get('Retry-After');
  const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
  recordRequest(observer, {
    endpoint: hubSpotEndpointKey(path),
    method,
    attempt: attempt + 1,
    statusCode: response.status,
    durationMs: Date.now() - startedAt,
    retryAfterMs: Number.isFinite(retryAfterMs) ? retryAfterMs : null,
    errorCode: response.status === 429 ? 'rate_limit' : response.status >= 500 ? 'provider_transient_error' : response.ok ? null : 'provider_error',
  });

  if ((response.status === 429 || response.status >= 500) && attempt < 6) {
    const waitMs = retryAfterHeader
      ? Number(retryAfterHeader) * 1000
      : Math.min(2 ** attempt * 500, 8000);
    await sleep(Number.isFinite(waitMs) ? waitMs : 1000);
    return hubspotFetch(path, init, attempt + 1, tokenOverride, observer);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`HubSpot ${method} ${path} falhou (${response.status}): ${body.slice(0, 400)}`);
  }

  return response;
}

// GET /crm/v3/pipelines/{objectType}/{pipelineId} -> estagios com rotulos reais.
export async function fetchPipelineStages(
  objectType: 'deals' | 'tickets',
  pipelineId: string,
  tokenOverride?: string,
  observer?: HubSpotRequestObserver,
): Promise<HubSpotStage[]> {
  const response = await hubspotFetch(`/crm/v3/pipelines/${objectType}/${pipelineId}`, {}, 0, tokenOverride, observer);
  const payload = (await response.json()) as {
    stages?: Array<{
      id: string;
      label: string;
      displayOrder?: number;
      metadata?: Record<string, unknown>;
    }>;
  };

  return (payload.stages ?? []).map((stage) => {
    const metadata = stage.metadata ?? {};
    let isClosed = false;
    let isWon = false;

    if (objectType === 'deals') {
      isClosed = String(metadata.isClosed ?? 'false') === 'true';
      const probability = Number(metadata.probability ?? '0');
      isWon = isClosed && probability >= 1;
    } else {
      const ticketState = String(metadata.ticketState ?? 'OPEN').toUpperCase();
      isClosed = ticketState === 'CLOSED';
      isWon = false;
    }

    return {
      stageId: stage.id,
      label: stage.label,
      displayOrder: stage.displayOrder ?? 0,
      isClosed,
      isWon,
      metadata,
    };
  });
}

// GET /crm/v3/pipelines/{objectType} -> catalogo oficial de pipelines.
// O catalogo e somente leitura no HubSpot; o sincronizador o espelha localmente
// para que o administrador possa escolher o recorte do Dashboard.
export async function fetchPipelineDefinitions(
  objectType: 'deals' | 'tickets',
  tokenOverride?: string,
  observer?: HubSpotRequestObserver,
): Promise<HubSpotPipelineDefinition[]> {
  const response = await hubspotFetch(`/crm/v3/pipelines/${objectType}`, {}, 0, tokenOverride, observer);
  const payload = (await response.json()) as {
    results?: Array<{
      id?: string;
      label?: string;
      displayOrder?: number;
      archived?: boolean;
      stages?: Array<{
        id: string;
        label: string;
        displayOrder?: number;
        metadata?: Record<string, unknown>;
      }>;
      metadata?: Record<string, unknown>;
    }>;
  };

  return (payload.results ?? [])
    .map((pipeline) => ({
      pipelineId: String(pipeline.id ?? ''),
      label: String(pipeline.label ?? '').trim(),
      displayOrder: Number(pipeline.displayOrder ?? 0),
      archived: Boolean(pipeline.archived ?? false),
      stages: (pipeline.stages ?? []).map((stage) => {
        const metadata = stage.metadata ?? {};
        const isClosed = objectType === 'deals'
          ? String(metadata.isClosed ?? 'false') === 'true'
          : String(metadata.ticketState ?? 'OPEN').toUpperCase() === 'CLOSED';
        const probability = Number(metadata.probability ?? '0');
        return {
          stageId: stage.id,
          label: stage.label,
          displayOrder: stage.displayOrder ?? 0,
          isClosed,
          isWon: objectType === 'deals' && isClosed && probability >= 1,
          metadata,
        };
      }),
      metadata: pipeline.metadata ?? {},
    }))
    .filter((pipeline) => /^\d+$/.test(pipeline.pipelineId) && pipeline.label.length > 0);
}

// O label do pipeline vem da mesma definicao usada para resolver os estagios.
// Ele e armazenado localmente apenas como referencia; nunca e escrito de volta
// no HubSpot.
export async function fetchPipelineLabel(
  objectType: 'deals' | 'tickets',
  pipelineId: string,
  tokenOverride?: string,
): Promise<string | null> {
  try {
    const response = await hubspotFetch(`/crm/v3/pipelines/${objectType}/${pipelineId}`, {}, 0, tokenOverride);
    const payload = (await response.json()) as { label?: unknown };
    const label = typeof payload.label === 'string' ? payload.label.trim() : '';
    return label || null;
  } catch {
    return null;
  }
}

// GET /crm/v3/owners -> resolve hubspot_owner_id em nome/email. Paginado.
export async function fetchOwners(tokenOverride?: string, observer?: HubSpotRequestObserver): Promise<HubSpotOwner[]> {
  const owners: HubSpotOwner[] = [];
  let after: string | null = null;

  do {
    const query = new URLSearchParams({ limit: '100' });
    if (after) query.set('after', after);
    const response = await hubspotFetch(`/crm/v3/owners?${query.toString()}`, {}, 0, tokenOverride, observer);
    const payload = (await response.json()) as {
      results?: Array<Record<string, unknown>>;
      paging?: { next?: { after?: string } };
    };

    for (const raw of payload.results ?? []) {
      const firstName = (raw.firstName as string | undefined) ?? null;
      const lastName = (raw.lastName as string | undefined) ?? null;
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null;
      owners.push({
        ownerId: String(raw.id ?? ''),
        email: (raw.email as string | undefined) ?? null,
        firstName,
        lastName,
        fullName,
        archived: Boolean(raw.archived ?? false),
        raw,
      });
    }

    after = nextHubSpotCursor(after, payload.paging?.next?.after, 'owners');
    await sleep(120);
  } while (after);

  return owners.filter((owner) => owner.ownerId.length > 0);
}

export interface HubSpotOwnerPage {
  records: HubSpotOwner[];
  nextCursor: string | null;
}

// Página única de owners para que o worker assíncrono não mantenha toda a
// coleção em memória nem perca telemetria ao atingir o limite do runtime.
export async function fetchOwnersPage(
  tokenOverride?: string,
  options: { cursor?: string | null; observer?: HubSpotRequestObserver } = {},
): Promise<HubSpotOwnerPage> {
  const query = new URLSearchParams({ limit: '100' });
  if (options.cursor) query.set('after', options.cursor);
  const response = await hubspotFetch(`/crm/v3/owners?${query.toString()}`, {}, 0, tokenOverride, options.observer);
  const payload = await response.json() as {
    results?: Array<Record<string, unknown>>;
    paging?: { next?: { after?: string } };
  };
  const records = (payload.results ?? []).map((raw) => {
    const firstName = (raw.firstName as string | undefined) ?? null;
    const lastName = (raw.lastName as string | undefined) ?? null;
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null;
    return {
      ownerId: String(raw.id ?? ''),
      email: (raw.email as string | undefined) ?? null,
      firstName,
      lastName,
      fullName,
      archived: Boolean(raw.archived ?? false),
      raw,
    } satisfies HubSpotOwner;
  }).filter((owner) => owner.ownerId.length > 0);
  return { records, nextCursor: nextHubSpotCursor(options.cursor, payload.paging?.next?.after, 'owners page') };
}

// Deals: Search API com filtro de pipeline (volume atual ~1.100, abaixo do teto de 10k).
export async function fetchDealsByPipeline(
  pipelineId: string,
  properties: string[],
  tokenOverride?: string,
): Promise<HubSpotRecord[]> {
  const records: HubSpotRecord[] = [];
  let after: string | undefined;

  do {
    const filters: Array<Record<string, string>> = [
      { propertyName: 'pipeline', operator: 'EQ', value: pipelineId },
    ];
    const body: Record<string, unknown> = {
      filterGroups: [
        {
          filters,
        },
      ],
      properties,
      limit: 100,
      sorts: [{ propertyName: 'createdate', direction: 'ASCENDING' }],
    };
    if (after) body.after = after;

    const response = await hubspotFetch('/crm/v3/objects/deals/search', {
      method: 'POST',
      body: JSON.stringify(body),
    }, 0, tokenOverride);
    const payload = (await response.json()) as {
      results?: HubSpotRecord[];
      paging?: { next?: { after?: string } };
    };

    records.push(...(payload.results ?? []));
    after = nextHubSpotCursor(after, payload.paging?.next?.after, 'deals');
    await sleep(150);
  } while (after);

  return records;
}

export async function fetchDealsPageByPipeline(
  pipelineId: string,
  properties: string[],
  tokenOverride?: string,
  options: { cursor?: string | null; updatedAfterMs?: number; telemetry?: HubSpotRequestObserver } = {},
): Promise<HubSpotObjectPage> {
  const filters: Array<Record<string, string>> = [{ propertyName: 'pipeline', operator: 'EQ', value: pipelineId }];
  if (options.updatedAfterMs !== undefined) filters.push({ propertyName: 'hs_lastmodifieddate', operator: 'GTE', value: String(options.updatedAfterMs) });
  const body: Record<string, unknown> = { filterGroups: [{ filters }], properties, limit: 100, sorts: [{ propertyName: 'createdate', direction: 'ASCENDING' }] };
  if (options.cursor) body.after = options.cursor;
  const response = await hubspotFetch('/crm/v3/objects/deals/search', { method: 'POST', body: JSON.stringify(body) }, 0, tokenOverride, options.telemetry);
  const payload = await response.json() as { results?: HubSpotRecord[]; total?: number; paging?: { next?: { after?: string } } };
  return { records: payload.results ?? [], total: Number.isFinite(Number(payload.total)) ? Number(payload.total) : null, nextCursor: nextHubSpotCursor(options.cursor, payload.paging?.next?.after, 'deals') };
}

export interface HubSpotCompaniesPage {
  records: HubSpotRecord[];
  nextCursor: string | null;
}

// Página única de empresas. O cursor é persistido pelo work item para que a
// leitura incremental/full possa ser retomada sem repetir a coleção inteira.
export async function fetchCompaniesPage(
  properties: string[],
  tokenOverride?: string,
  options: { cursor?: string | null; updatedAfterMs?: number; observer?: HubSpotRequestObserver } = {},
): Promise<HubSpotCompaniesPage> {
  const cursor = options.cursor ?? null;
  const response = options.updatedAfterMs !== undefined
    ? await hubspotFetch('/crm/v3/objects/companies/search', {
      method: 'POST',
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'hs_lastmodifieddate', operator: 'GTE', value: String(options.updatedAfterMs) }] }],
        properties,
        limit: 100,
        sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'ASCENDING' }],
        ...(cursor ? { after: cursor } : {}),
      }),
    }, 0, tokenOverride, options.observer)
    : await hubspotFetch(`/crm/v3/objects/companies?${new URLSearchParams({ limit: '100', properties: properties.join(','), ...(cursor ? { after: cursor } : {}) }).toString()}`, {}, 0, tokenOverride, options.observer);
  const payload = await response.json() as {
    results?: HubSpotRecord[];
    paging?: { next?: { after?: string } };
  };
  return {
    records: payload.results ?? [],
    nextCursor: nextHubSpotCursor(cursor, payload.paging?.next?.after, 'companies page'),
  };
}

// Tickets: Search API filtrada pelo pipe.
// O total da conta (~27k) e grande, mas cada pipe operacional e menor que o
// teto de 10k da Search API; filtrar no servidor evita varrer todos os tickets.
export async function fetchTicketsByPipeline(
  pipelineId: string,
  properties: string[],
  tokenOverride?: string,
  updatedAfterMs?: number,
  evidence?: HubSpotTicketPipelineEvidence,
): Promise<HubSpotRecord[]> {
  // A Search API query cannot paginate beyond 10,000 matching records. The
  // main support pipeline currently exceeds that limit, so partition by the
  // immutable createdate property before following the cursor. The half-open
  // ranges (GTE lower, LT upper) avoid duplicates at split boundaries.
  const searchMaxResults = 10_000;
  const startMs = 0;
  const endMs = Date.UTC(2100, 0, 1);

  type TicketSearchPayload = {
    results?: HubSpotRecord[];
    total?: number;
    paging?: { next?: { after?: string } };
  };

  async function fetchRange(rangeStartMs: number, rangeEndMs: number): Promise<HubSpotRecord[]> {
    const records: HubSpotRecord[] = [];
    let after: string | undefined;
    let firstPage = true;
    let total: number | null = null;

    do {
      const filters: Array<Record<string, string>> = [
        { propertyName: 'hs_pipeline', operator: 'EQ', value: pipelineId },
        { propertyName: 'createdate', operator: 'GTE', value: String(rangeStartMs) },
        { propertyName: 'createdate', operator: 'LT', value: String(rangeEndMs) },
      ];
      if (updatedAfterMs !== undefined) {
        filters.push({ propertyName: 'hs_lastmodifieddate', operator: 'GTE', value: String(updatedAfterMs) });
      }
      const body: Record<string, unknown> = {
        filterGroups: [
          {
            filters,
          },
        ],
        properties,
        limit: 100,
        sorts: [{ propertyName: 'createdate', direction: 'ASCENDING' }],
      };
      if (after) body.after = after;

      let payload: TicketSearchPayload;
      try {
        const response = await hubspotFetch('/crm/v3/objects/tickets/search', {
          method: 'POST',
          body: JSON.stringify(body),
        }, 0, tokenOverride);
        payload = await response.json() as TicketSearchPayload;
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Falha ao buscar tickets do pipeline ${pipelineId} no intervalo ` +
          `${new Date(rangeStartMs).toISOString()} <= createdate < ${new Date(rangeEndMs).toISOString()}: ${detail}`,
        );
      }

      if (firstPage) {
        total = Number.isFinite(Number(payload.total)) ? Number(payload.total) : null;
        if (evidence) evidence.total = total;
        if (total !== null && total > searchMaxResults) {
          const midpoint = rangeStartMs + Math.floor((rangeEndMs - rangeStartMs) / 2);
          if (midpoint <= rangeStartMs || midpoint >= rangeEndMs) {
            throw new Error(
              `Não foi possível particionar a busca de tickets do pipeline ${pipelineId}: ` +
              `${total} registros permanecem no mesmo instante de criação.`,
            );
          }
          const older = await fetchRange(rangeStartMs, midpoint);
          const newer = await fetchRange(midpoint, rangeEndMs);
          if (evidence) evidence.complete = true;
          return [...older, ...newer];
        }
      }

      records.push(...(payload.results ?? []));
      if (evidence) evidence.pages += 1;
      after = nextHubSpotCursor(after, payload.paging?.next?.after, 'tickets');
      firstPage = false;
      await sleep(150);
    } while (after);

    if (evidence) evidence.complete = true;
    return records;
  }

  if (updatedAfterMs === undefined) return fetchRange(startMs, endMs);

  // Na janela incremental, o filtro de última alteração já reduz o conjunto
  // e torna desnecessária a varredura das partições históricas por createdate.
  // Mantemos fallback para a estratégia particionada caso a janela ainda
  // ultrapasse o limite de 10 mil resultados da Search API.
  const recent: HubSpotRecord[] = [];
  let after: string | undefined;
  let total: number | null = null;
  do {
    const body: Record<string, unknown> = {
      filterGroups: [{ filters: [
        { propertyName: 'hs_pipeline', operator: 'EQ', value: pipelineId },
        { propertyName: 'hs_lastmodifieddate', operator: 'GTE', value: String(updatedAfterMs) },
      ] }],
      properties,
      limit: 100,
      sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'ASCENDING' }],
    };
    if (after) body.after = after;
    const response = await hubspotFetch('/crm/v3/objects/tickets/search', {
      method: 'POST',
      body: JSON.stringify(body),
    }, 0, tokenOverride);
    const payload = await response.json() as TicketSearchPayload;
    total = total ?? (Number.isFinite(Number(payload.total)) ? Number(payload.total) : null);
    if (evidence) evidence.total = total;
    if (total !== null && total > searchMaxResults) return fetchRange(startMs, endMs);
    recent.push(...(payload.results ?? []));
    if (evidence) evidence.pages += 1;
    after = nextHubSpotCursor(after, payload.paging?.next?.after, 'tickets incremental');
    await sleep(150);
  } while (after);
  if (evidence) evidence.complete = true;
  return recent;
}

// Página única para o runner assíncrono. O worker persiste o cursor antes de
// encerrar a invocação; não deve ser substituída pela função full acima.
export async function fetchTicketsPageByPipeline(
  pipelineId: string,
  properties: string[],
  tokenOverride: string | undefined,
  options: HubSpotTicketPageOptions = {},
): Promise<HubSpotTicketPage> {
  const rangeStartMs = options.rangeStartMs ?? 0;
  const rangeEndMs = options.rangeEndMs ?? Date.UTC(2100, 0, 1);
  const filters: Array<Record<string, string>> = [
    { propertyName: 'hs_pipeline', operator: 'EQ', value: pipelineId },
    { propertyName: 'createdate', operator: 'GTE', value: String(rangeStartMs) },
    { propertyName: 'createdate', operator: 'LT', value: String(rangeEndMs) },
  ];
  if (options.updatedAfterMs !== undefined) {
    filters.push({ propertyName: 'hs_lastmodifieddate', operator: 'GTE', value: String(options.updatedAfterMs) });
  }
  const body: Record<string, unknown> = {
    filterGroups: [{ filters }],
    properties,
    limit: 100,
    sorts: [{ propertyName: 'createdate', direction: 'ASCENDING' }],
  };
  if (options.cursor) body.after = options.cursor;
  const response = await hubspotFetch('/crm/v3/objects/tickets/search', {
    method: 'POST',
    body: JSON.stringify(body),
  }, 0, tokenOverride, options.telemetry);
  const payload = await response.json() as {
    results?: HubSpotRecord[];
    total?: number;
    paging?: { next?: { after?: string } };
  };
  return {
    records: payload.results ?? [],
    total: Number.isFinite(Number(payload.total)) ? Number(payload.total) : null,
    nextCursor: payload.paging?.next?.after ? String(payload.paging.next.after) : null,
  };
}

// Consulta somente o total autoritativo do Search API, sem baixar registros.
// Usado pelo diagnóstico de origem; não grava nem expõe propriedades.
export async function fetchTicketPipelineTotal(pipelineId: string, tokenOverride?: string): Promise<number> {
  const response = await hubspotFetch('/crm/v3/objects/tickets/search', {
    method: 'POST',
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'hs_pipeline', operator: 'EQ', value: pipelineId }] }],
      properties: [],
      limit: 1,
    }),
  }, 0, tokenOverride);
  const payload = await response.json() as { total?: unknown };
  const total = Number(payload.total);
  if (!Number.isFinite(total) || total < 0) throw new Error(`Total de tickets inválido para o pipeline ${pipelineId}.`);
  return total;
}

// Empresas: cache completo para reconciliação read-only com fontes financeiras.
// O endpoint de busca é paginado e não depende de pipeline.
export async function fetchCompanies(
  properties: string[],
  tokenOverride?: string,
  updatedAfterMs?: number,
  observer?: HubSpotRequestObserver,
): Promise<HubSpotRecord[]> {
  const records: HubSpotRecord[] = [];
  let after: string | undefined;

  if (updatedAfterMs !== undefined) {
    do {
      const body: Record<string, unknown> = {
        filterGroups: [{ filters: [{ propertyName: 'hs_lastmodifieddate', operator: 'GTE', value: String(updatedAfterMs) }] }],
        properties,
        limit: 100,
        sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'ASCENDING' }],
      };
      if (after) body.after = after;
      const response = await hubspotFetch('/crm/v3/objects/companies/search', {
        method: 'POST',
        body: JSON.stringify(body),
      }, 0, tokenOverride, observer);
      const payload = (await response.json()) as {
        results?: HubSpotRecord[];
        paging?: { next?: { after?: string } };
      };
      records.push(...(payload.results ?? []));
      after = nextHubSpotCursor(after, payload.paging?.next?.after, 'companies incremental');
      await sleep(120);
    } while (after);

    return records;
  }

  do {
    const query = new URLSearchParams({ limit: '100', properties: properties.join(',') });
    if (after) query.set('after', after);
    const response = await hubspotFetch(`/crm/v3/objects/companies?${query.toString()}`, {}, 0, tokenOverride, observer);
    const payload = (await response.json()) as {
      results?: HubSpotRecord[];
      paging?: { next?: { after?: string } };
    };
    records.push(...(payload.results ?? []));
    after = nextHubSpotCursor(after, payload.paging?.next?.after, 'companies');
    await sleep(120);
  } while (after);

  return records;
}

// POST /crm/objects/2026-03/companies/merge. Requer crm.objects.companies.write.
export async function mergeCompanies(
  primaryObjectId: string,
  objectIdToMerge: string,
  tokenOverride?: string,
): Promise<HubSpotMergeResult> {
  const response = await hubspotFetch('/crm/objects/2026-03/companies/merge', {
    method: 'POST',
    body: JSON.stringify({ primaryObjectId, objectIdToMerge }),
  }, 0, tokenOverride);
  return await response.json() as HubSpotMergeResult;
}

export async function updateCompany(
  companyId: string,
  properties: Record<string, string>,
  tokenOverride?: string,
): Promise<HubSpotRecord> {
  if (!/^\d{1,30}$/.test(companyId)) throw new Error('ID de empresa HubSpot inválido.');
  const response = await hubspotFetch(`/crm/v3/objects/companies/${encodeURIComponent(companyId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ properties }),
  }, 0, tokenOverride);
  return await response.json() as HubSpotRecord;
}

export async function updateCompaniesBatch(
  updates: Array<{ id: string; properties: Record<string, string> }>,
  tokenOverride?: string,
): Promise<number> {
  let updated = 0;
  for (const batch of chunkCompanyUpdates(updates)) {
    const response = await hubspotFetch('/crm/v3/objects/companies/batch/update', {
      method: 'POST',
      body: JSON.stringify(buildHubSpotCompanyBatchUpdatePayload(batch)),
    }, 0, tokenOverride);
    const payload = await response.json().catch(() => null) as { results?: unknown[] } | null;
    updated += Array.isArray(payload?.results) ? payload.results.length : batch.length;
  }
  return updated;
}

export async function createCompany(
  properties: Record<string, string>,
  tokenOverride?: string,
): Promise<HubSpotRecord> {
  const response = await hubspotFetch('/crm/v3/objects/companies', {
    method: 'POST',
    body: JSON.stringify({ properties }),
  }, 0, tokenOverride);
  return await response.json() as HubSpotRecord;
}

// Busca best-effort por CNPJ para dedupe antes de criar empresa. Requer
// crm.objects.companies.read. Nunca lanca: retorna [] em qualquer falha.
export async function searchCompaniesByCnpj(
  cnpj: string,
  tokenOverride?: string,
): Promise<HubSpotRecord[]> {
  try {
    return await searchCompaniesByCnpjStrict(cnpj, tokenOverride);
  } catch {
    return [];
  }
}

export async function searchCompaniesByCnpjStrict(
  cnpj: string,
  tokenOverride?: string,
): Promise<HubSpotRecord[]> {
  const raw = (cnpj ?? '').trim();
  if (!raw) return [];
  const digits = raw.replace(/\D/g, '');
  const variants = [digits, raw, digits.length === 14 ? `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}` : ''].filter((value, index, values) => value && values.indexOf(value) === index);
  const records = new Map<string, HubSpotRecord>();
  for (const value of variants) {
    const response = await hubspotFetch('/crm/v3/objects/companies/search', {
    method: 'POST',
      body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: 'cnpj', operator: 'EQ', value }] }], properties: ['name', 'cnpj'], limit: 5 }),
    }, 0, tokenOverride);
    const data = await response.json().catch(() => ({})) as { results?: HubSpotRecord[] };
    for (const record of Array.isArray(data.results) ? data.results : []) if (record.id) records.set(String(record.id), record);
  }
  return [...records.values()];
}

// --- Propriedades de empresa (schema) para a central de integracao ----------
export async function listCompanyPropertyNames(tokenOverride?: string): Promise<Set<string>> {
  const response = await hubspotFetch('/crm/v3/properties/companies', {}, 0, tokenOverride);
  const data = await response.json() as { results?: Array<{ name?: string }> };
  return new Set((data.results ?? []).map((r) => String(r.name ?? '')));
}

export async function listCompanyPropertyGroupNames(tokenOverride?: string): Promise<Set<string>> {
  const response = await hubspotFetch('/crm/v3/properties/companies/groups', {}, 0, tokenOverride);
  const data = await response.json() as { results?: Array<{ name?: string }> };
  return new Set((data.results ?? []).map((r) => String(r.name ?? '')));
}

export async function createCompanyPropertyGroup(name: string, label: string, tokenOverride?: string): Promise<unknown> {
  const response = await hubspotFetch('/crm/v3/properties/companies/groups', { method: 'POST', body: JSON.stringify({ name, label }) }, 0, tokenOverride);
  return await response.json();
}

export async function createCompanyProperty(def: Record<string, unknown>, tokenOverride?: string): Promise<unknown> {
  const response = await hubspotFetch('/crm/v3/properties/companies', { method: 'POST', body: JSON.stringify(def) }, 0, tokenOverride);
  return await response.json();
}

export function toTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function toNumeric(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
