import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import {
  createServiceClient,
  getAuthorizationHeader,
  jsonResponse,
  optionsResponse,
} from '../_shared/ticket-evidence.ts';
import {
  createCompany,
  fetchCompanies,
  fetchOwners,
  updateCompany,
  type HubSpotOwner,
  type HubSpotRecord,
} from '../_shared/hubspot.ts';
import {
  buildCompanyProperties,
  matchCsCompany,
  resolveOwnerId,
  toHubSpotRecord,
  type CsMigrationRow,
  type CsCompanyMatch,
} from '../_shared/cs-migration.ts';

const CS_SOURCE_KEY = 'cs_ops_consolidated';
const MAX_ROWS = 1000;
const COMPANY_PROPERTIES = [
  'name',
  'domain',
  'cnpj',
  'aftersale___mrr',
  'status_do_cliente___aftersale',
  'status_do_contrato',
  'cs_owner___aftersale',
];

interface MigrationRequest {
  sourceImportRunId?: unknown;
  mode?: unknown;
  confirmation?: unknown;
  maxRows?: unknown;
}

interface PlannedItem {
  row: CsMigrationRow;
  match: CsCompanyMatch;
  status: 'planned' | 'updated' | 'created' | 'skipped' | 'ambiguous' | 'failed';
  operation: 'update' | 'create' | null;
  ownerId: string | null;
  properties: Record<string, string>;
  errorMessage: string | null;
  priorCompanyId: string | null;
  itemId: string | null;
}

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function authorize(req: Request, client: SupabaseClient): Promise<string | null> {
  const token = getAuthorizationHeader(req).replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  const userId = String(data.claims.sub);
  const { data: role, error: roleError } = await client
    .from('user_global_roles')
    .select('user_id')
    .eq('user_id', userId)
    .eq('role', 'platform_admin')
    .maybeSingle();
  return roleError || !role ? null : userId;
}

async function resolveHubSpotToken(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.rpc('rpc_service_get_managed_integration_secret', { p_integration_key: 'hubspot' });
  if (!error && typeof data === 'string' && data.trim()) return data.trim();
  const fallback = Deno.env.get('HUBSPOT_PRIVATE_APP_TOKEN')?.trim();
  if (fallback) return fallback;
  throw new Error(error?.message ?? 'Credencial gerenciada do HubSpot indisponível.');
}

async function loadSourceRun(client: SupabaseClient, id: string) {
  const { data: run, error: runError } = await client
    .from('analytics_spreadsheet_import_runs')
    .select('id,source_id,status')
    .eq('id', id)
    .maybeSingle();
  if (runError) throw new Error(`Falha ao ler o lote de origem: ${runError.message}`);
  if (!run) throw new Error('Lote de origem não encontrado.');
  const { data: source, error: sourceError } = await client
    .from('analytics_spreadsheet_sources')
    .select('source_key,mapping_version')
    .eq('id', run.source_id)
    .maybeSingle();
  if (sourceError) throw new Error(`Falha ao ler a fonte do lote: ${sourceError.message}`);
  if (!source || source.source_key !== CS_SOURCE_KEY) throw new Error('O lote informado não é da fonte CS Ops aprovada.');
  if (!['completed', 'partial'].includes(String(run.status))) throw new Error('O lote CS Ops precisa estar concluído ou parcial antes da migração.');
  return run;
}

async function loadCompanies(client: SupabaseClient, token: string | null): Promise<HubSpotRecord[]> {
  if (token) return (await fetchCompanies(COMPANY_PROPERTIES, token));
  const { data, error } = await client
    .from('hubspot_companies')
    .select('company_id,name,tax_id,mrr,client_status,contract_status,cs_owner_id,raw')
    .limit(20000);
  if (error) throw new Error(`Falha ao ler cache local de empresas: ${error.message}`);
  return (data ?? []).map((row) => toHubSpotRecord(row as Record<string, unknown>));
}

async function loadOwners(client: SupabaseClient, token: string | null): Promise<HubSpotOwner[]> {
  if (token) return fetchOwners(token);
  const { data, error } = await client.from('hubspot_owners').select('owner_id,email,first_name,last_name,full_name,archived,raw').limit(1000);
  if (error) throw new Error(`Falha ao ler cache local de owners: ${error.message}`);
  return (data ?? []).map((row) => ({
    ownerId: text(row.owner_id),
    email: row.email ? text(row.email) : null,
    firstName: row.first_name ? text(row.first_name) : null,
    lastName: row.last_name ? text(row.last_name) : null,
    fullName: row.full_name ? text(row.full_name) : null,
    archived: Boolean(row.archived),
    raw: (row.raw ?? {}) as Record<string, unknown>,
  }));
}

function countPlan(items: PlannedItem[]) {
  return {
    totalRows: items.length,
    plannedRows: items.filter((item) => item.operation && ['planned', 'updated', 'created'].includes(item.status)).length,
    ambiguousRows: items.filter((item) => item.status === 'ambiguous').length,
    createRows: items.filter((item) => item.operation === 'create' && ['planned', 'created'].includes(item.status)).length,
    updateRows: items.filter((item) => item.operation === 'update' && ['planned', 'updated'].includes(item.status)).length,
    skippedRows: items.filter((item) => item.status === 'skipped').length,
    failedRows: items.filter((item) => item.status === 'failed').length,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });

  const client = createServiceClient();
  const actorId = await authorize(req, client);
  if (!actorId) return jsonResponse({ error: 'Acesso negado. Requer platform_admin.' }, { status: 403 });

  try {
    const body = await req.json() as MigrationRequest;
    const sourceImportRunId = text(body.sourceImportRunId);
    const mode = text(body.mode || 'dry_run') as 'dry_run' | 'apply';
    const confirmation = text(body.confirmation);
    const requestedMaxRows = Number(body.maxRows ?? MAX_ROWS);
    const maxRows = Number.isFinite(requestedMaxRows) ? Math.min(Math.max(Math.floor(requestedMaxRows), 1), MAX_ROWS) : MAX_ROWS;
    if (!isUuid(sourceImportRunId)) return jsonResponse({ error: 'Informe um sourceImportRunId válido.' }, { status: 422 });
    if (!['dry_run', 'apply'].includes(mode)) return jsonResponse({ error: 'mode deve ser dry_run ou apply.' }, { status: 422 });
    if (mode === 'apply' && confirmation !== 'MIGRAR_CS_OPS') {
      return jsonResponse({ error: 'Confirmação inválida. Digite MIGRAR_CS_OPS para autorizar a aplicação.' }, { status: 422 });
    }

    const sourceRun = await loadSourceRun(client, sourceImportRunId);
    if (mode === 'apply') {
      const { data: activeRun, error: activeError } = await client
        .from('analytics_hubspot_cs_migration_runs')
        .select('id')
        .eq('source_import_run_id', sourceImportRunId)
        .eq('mode', 'apply')
        .in('status', ['requested', 'running'])
        .limit(1)
        .maybeSingle();
      if (activeError) throw new Error(`Falha ao verificar migração em andamento: ${activeError.message}`);
      if (activeRun) return jsonResponse({ error: 'Já existe uma migração de aplicação em andamento para este lote.' }, { status: 409 });
    }

    const { data: sourceRows, error: rowsError } = await client
      .from('analytics_spreadsheet_rows')
      .select('id,sheet_name,row_number,source_record_id,quality_status,rejection_reason,payload')
      .eq('import_run_id', sourceImportRunId)
      .order('row_number', { ascending: true })
      .limit(maxRows);
    if (rowsError) throw new Error(`Falha ao ler staging CS Ops: ${rowsError.message}`);
    const rows = (sourceRows ?? []) as CsMigrationRow[];
    if (!rows.length) return jsonResponse({ error: 'O lote CS Ops não possui linhas para migrar.' }, { status: 422 });

    const token = mode === 'apply' ? await resolveHubSpotToken(client) : null;
    const companies = await loadCompanies(client, token);
    const owners = await loadOwners(client, token);
    const { data: priorItems, error: priorError } = await client
      .from('analytics_hubspot_cs_migration_items')
      .select('source_record_id,status,hubspot_company_id')
      .eq('source_import_run_id', sourceImportRunId)
      .in('status', ['created', 'updated']);
    if (priorError) throw new Error(`Falha ao verificar idempotência do lote: ${priorError.message}`);
    const priorByRecord = new Map((priorItems ?? []).map((item) => [String(item.source_record_id), item]));

    const plan: PlannedItem[] = rows.map((row) => {
      if (row.quality_status !== 'valid') {
        return { row, match: { status: 'none', method: 'none', company: null, candidates: [] }, status: 'skipped', operation: null, ownerId: null, properties: {}, errorMessage: row.rejection_reason || 'linha rejeitada no staging', priorCompanyId: null, itemId: null };
      }
      const match = matchCsCompany(row.payload, companies);
      if (match.status === 'ambiguous') return { row, match, status: 'ambiguous', operation: null, ownerId: null, properties: {}, errorMessage: 'Correspondência ambígua; revisão humana obrigatória.', priorCompanyId: null, itemId: null };
      const prior = priorByRecord.get(row.source_record_id);
      if (prior) return { row, match, status: 'skipped', operation: null, ownerId: null, properties: {}, errorMessage: 'Linha já aplicada anteriormente neste lote de origem.', priorCompanyId: text(prior.hubspot_company_id) || null, itemId: null };
      const ownerId = resolveOwnerId(row.payload.responsavel_final, owners);
      const properties = buildCompanyProperties(row.payload, ownerId);
      if (!properties.name) return { row, match, status: 'failed', operation: null, ownerId, properties, errorMessage: 'Empresa sem nome para atualização/criação.', priorCompanyId: match.company?.id ?? null, itemId: null };
      return { row, match, status: 'planned', operation: match.status === 'unique' ? 'update' : 'create', ownerId, properties, errorMessage: null, priorCompanyId: match.company?.id ?? null, itemId: null };
    });
    const counts = countPlan(plan);
    const { data: migrationRun, error: migrationError } = await client.from('analytics_hubspot_cs_migration_runs').insert({
      source_import_run_id: sourceImportRunId,
      mode,
      status: 'running',
      requested_by_user_id: actorId,
      ...counts,
    }).select('id').single();
    if (migrationError || !migrationRun) throw new Error(`Falha ao criar ledger de migração: ${migrationError?.message ?? 'registro ausente'}`);

    const itemRows = plan.map((item) => ({
      migration_run_id: migrationRun.id,
      source_import_run_id: sourceImportRunId,
      sheet_row: item.row.row_number,
      source_record_id: item.row.source_record_id,
      status: mode === 'apply' && item.status === 'planned' ? 'planned' : item.status,
      match_method: item.match.method,
      hubspot_company_id: item.priorCompanyId,
      candidate_company_ids: item.match.candidates.map((candidate) => candidate.id),
      source_payload: item.row.payload,
      hubspot_before: item.match.company?.properties ?? null,
      hubspot_after: Object.keys(item.properties).length ? item.properties : null,
      error_message: item.errorMessage,
    }));
    const { data: insertedItems, error: itemsError } = await client.from('analytics_hubspot_cs_migration_items').insert(itemRows).select('id,source_record_id');
    if (itemsError) throw new Error(`Falha ao registrar itens da migração: ${itemsError.message}`);
    const itemIdByRecord = new Map((insertedItems ?? []).map((item) => [String(item.source_record_id), String(item.id)]));
    plan.forEach((item) => { item.itemId = itemIdByRecord.get(item.row.source_record_id) ?? null; });

    if (mode === 'apply') {
      for (const item of plan.filter((candidate) => candidate.status === 'planned' && candidate.itemId)) {
        try {
          const result = item.operation === 'update' && item.match.company
            ? await updateCompany(item.match.company.id, item.properties, token ?? undefined)
            : await createCompany(item.properties, token ?? undefined);
          const finalStatus = item.operation === 'update' ? 'updated' : 'created';
          item.status = finalStatus;
          item.priorCompanyId = result.id;
          await client.from('analytics_hubspot_cs_migration_items').update({ status: finalStatus, hubspot_company_id: result.id, hubspot_after: result.properties ?? item.properties, error_message: null }).eq('id', item.itemId);
        } catch (error) {
          item.status = 'failed';
          item.errorMessage = error instanceof Error ? error.message.slice(0, 1000) : 'Falha desconhecida ao aplicar empresa.';
          await client.from('analytics_hubspot_cs_migration_items').update({ status: 'failed', error_message: item.errorMessage }).eq('id', item.itemId);
        }
      }
    }

    const finalCounts = countPlan(plan);
    const finalStatus = finalCounts.failedRows > 0 ? 'partial' : 'completed';
    const { error: finishError } = await client.from('analytics_hubspot_cs_migration_runs').update({ status: finalStatus, ...finalCounts, finished_at: new Date().toISOString() }).eq('id', migrationRun.id);
    if (finishError) throw new Error(`Falha ao finalizar ledger de migração: ${finishError.message}`);
    return jsonResponse({ ok: true, migrationRunId: migrationRun.id, sourceImportRunId: sourceRun.id, mode, status: finalStatus, counts: finalCounts, syncRecommended: mode === 'apply', message: mode === 'dry_run' ? 'Simulação concluída; nenhuma empresa foi alterada.' : 'Migração aplicada com auditoria por linha. Execute uma sincronização HubSpot para atualizar o cache local.' });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Falha na migração CS Ops.' }, { status: 502 });
  }
});
