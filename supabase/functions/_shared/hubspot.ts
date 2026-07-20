// Cliente minimalista da API REST oficial do HubSpot para o modulo Analytics.
// Autenticacao: Private App Token via Deno.env (HUBSPOT_PRIVATE_APP_TOKEN), nunca no frontend.
// Escopos minimos esperados: crm.objects.deals.read, crm.objects.tickets.read,
// crm.objects.owners.read, crm.schemas.deals.read, crm.schemas.tickets.read.

const HUBSPOT_BASE_URL = 'https://api.hubapi.com';

export interface HubSpotStage {
  stageId: string;
  label: string;
  displayOrder: number;
  isClosed: boolean;
  isWon: boolean;
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

// Fetch com backoff em 429/5xx respeitando Retry-After (proteção de rate limit).
async function hubspotFetch(
  path: string,
  init: RequestInit = {},
  attempt = 0,
  tokenOverride?: string,
): Promise<Response> {
  const token = readToken(tokenOverride);
  const response = await fetch(`${HUBSPOT_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if ((response.status === 429 || response.status >= 500) && attempt < 6) {
    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfterMs = retryAfterHeader
      ? Number(retryAfterHeader) * 1000
      : Math.min(2 ** attempt * 500, 8000);
    await sleep(Number.isFinite(retryAfterMs) ? retryAfterMs : 1000);
    return hubspotFetch(path, init, attempt + 1, tokenOverride);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`HubSpot ${init.method ?? 'GET'} ${path} falhou (${response.status}): ${body.slice(0, 400)}`);
  }

  return response;
}

// GET /crm/v3/pipelines/{objectType}/{pipelineId} -> estagios com rotulos reais.
export async function fetchPipelineStages(
  objectType: 'deals' | 'tickets',
  pipelineId: string,
  tokenOverride?: string,
): Promise<HubSpotStage[]> {
  const response = await hubspotFetch(`/crm/v3/pipelines/${objectType}/${pipelineId}`, {}, 0, tokenOverride);
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
export async function fetchOwners(tokenOverride?: string): Promise<HubSpotOwner[]> {
  const owners: HubSpotOwner[] = [];
  let after: string | null = null;

  do {
    const query = new URLSearchParams({ limit: '100' });
    if (after) query.set('after', after);
    const response = await hubspotFetch(`/crm/v3/owners?${query.toString()}`, {}, 0, tokenOverride);
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

    after = payload.paging?.next?.after ?? null;
    await sleep(120);
  } while (after);

  return owners.filter((owner) => owner.ownerId.length > 0);
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
    const body: Record<string, unknown> = {
      filterGroups: [
        {
          filters: [{ propertyName: 'pipeline', operator: 'EQ', value: pipelineId }],
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
    after = payload.paging?.next?.after;
    await sleep(150);
  } while (after);

  return records;
}

// Tickets: Search API filtrada pelo pipe.
// O total da conta (~27k) e grande, mas cada pipe operacional e menor que o
// teto de 10k da Search API; filtrar no servidor evita varrer todos os tickets.
export async function fetchTicketsByPipeline(
  pipelineId: string,
  properties: string[],
  tokenOverride?: string,
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
      const body: Record<string, unknown> = {
        filterGroups: [
          {
            filters: [
              { propertyName: 'hs_pipeline', operator: 'EQ', value: pipelineId },
              { propertyName: 'createdate', operator: 'GTE', value: String(rangeStartMs) },
              { propertyName: 'createdate', operator: 'LT', value: String(rangeEndMs) },
            ],
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
          return [...older, ...newer];
        }
      }

      records.push(...(payload.results ?? []));
      after = payload.paging?.next?.after;
      firstPage = false;
      await sleep(150);
    } while (after);

    return records;
  }

  return fetchRange(startMs, endMs);
}

// Empresas: cache completo para reconciliação read-only com fontes financeiras.
// O endpoint de busca é paginado e não depende de pipeline.
export async function fetchCompanies(
  properties: string[],
  tokenOverride?: string,
): Promise<HubSpotRecord[]> {
  const records: HubSpotRecord[] = [];
  let after: string | undefined;

  do {
    const query = new URLSearchParams({ limit: '100', properties: properties.join(',') });
    if (after) query.set('after', after);
    const response = await hubspotFetch(`/crm/v3/objects/companies?${query.toString()}`, {}, 0, tokenOverride);
    const payload = (await response.json()) as {
      results?: HubSpotRecord[];
      paging?: { next?: { after?: string } };
    };
    records.push(...(payload.results ?? []));
    after = payload.paging?.next?.after;
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
  const raw = (cnpj ?? '').trim();
  if (!raw) return [];
  try {
    const response = await hubspotFetch('/crm/v3/objects/companies/search', {
      method: 'POST',
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'cnpj', operator: 'EQ', value: raw }] }],
        properties: ['name', 'cnpj'],
        limit: 5,
      }),
    }, 0, tokenOverride);
    const data = await response.json().catch(() => ({})) as { results?: HubSpotRecord[] };
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return [];
  }
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
