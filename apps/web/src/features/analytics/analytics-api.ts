import { toAppError } from '../../app/errors';
import { readRuntimeConfig } from '../../app/runtime-config';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';
import {
  mapCommercialByOwner,
  mapCommercialFunnel,
  mapCommercialKpis,
  mapCommercialMonthly,
  mapCsByStatus,
  mapCsKpis,
  mapCsMonthly,
  mapSyncRun,
  mapCommercialSnapshot,
  mapCsSnapshot,
  type CommercialByOwner,
  type CommercialFunnelStage,
  type CommercialKpis,
  type CommercialMonthlyPoint,
  type CsByStatus,
  type CsKpis,
  type CsMonthlyPoint,
  type SyncRun,
  type AnalyticsFilters,
  type CommercialSnapshot,
  type CsSnapshot,
  mapFinanceSnapshot,
  type FinanceSnapshot,
  mapFinanceSourceStatus,
  type FinanceSourceStatus,
  mapCeoSnapshot,
  type CeoSnapshot,
  mapCeoHistory,
  type CeoHistory,
  mapAmbiguousOverdueTitles,
  type AmbiguousOverdueTitle,
  mapReconciliationQuality,
  mapAnalyticsSourceConfig,
  type ReconciliationQualityResult,
  type AnalyticsSourceConfig,
} from './analytics-model';
import { aggregateLatestHubspotSyncRuns } from './analytics-sync-runs.mjs';
import { formatAnalyticsSyncError } from './analytics-sync-errors.mjs';

type Row = Record<string, unknown>;

export async function getCommercialKpis(): Promise<CommercialKpis> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_analytics_commercial_kpis')
    .select('*')
    .maybeSingle();
  if (error) throw toAppError(error, 'Falha ao carregar os KPIs comerciais.');
  return mapCommercialKpis((data as Row) ?? null);
}

export async function getCommercialFunnel(): Promise<CommercialFunnelStage[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_analytics_commercial_funnel')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw toAppError(error, 'Falha ao carregar o funil comercial.');
  return (data ?? []).map((row) => mapCommercialFunnel(row as Row));
}

export async function getCommercialByOwner(): Promise<CommercialByOwner[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_analytics_commercial_by_owner')
    .select('*')
    .order('deal_count', { ascending: false });
  if (error) throw toAppError(error, 'Falha ao carregar deals por responsavel.');
  return (data ?? []).map((row) => mapCommercialByOwner(row as Row));
}

export async function getCommercialMonthly(): Promise<CommercialMonthlyPoint[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_analytics_commercial_monthly')
    .select('*')
    .order('month_start', { ascending: true });
  if (error) throw toAppError(error, 'Falha ao carregar a tendencia mensal comercial.');
  return (data ?? []).map((row) => mapCommercialMonthly(row as Row));
}

export async function getCsKpis(): Promise<CsKpis> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_analytics_cs_kpis')
    .select('*')
    .maybeSingle();
  if (error) throw toAppError(error, 'Falha ao carregar os KPIs de suporte.');
  return mapCsKpis((data as Row) ?? null);
}

export async function getCsByStatus(): Promise<CsByStatus[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_analytics_cs_by_status')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw toAppError(error, 'Falha ao carregar tickets por status.');
  return (data ?? []).map((row) => mapCsByStatus(row as Row));
}

export async function getCsMonthly(): Promise<CsMonthlyPoint[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_analytics_cs_monthly')
    .select('*')
    .order('month_start', { ascending: true });
  if (error) throw toAppError(error, 'Falha ao carregar a tendencia mensal de suporte.');
  return (data ?? []).map((row) => mapCsMonthly(row as Row));
}

export async function getLatestSyncRun(): Promise<SyncRun | null> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_analytics_dashboard_sync_status')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10);
  if (error) throw toAppError(error, 'Falha ao carregar o status da ultima sincronizacao.');
  const runs = (data ?? [])
    .map((row) => mapSyncRun(row as Row))
    .filter((run): run is SyncRun => run !== null);
  const latest = aggregateLatestHubspotSyncRuns(runs);

  // A supervisão do runtime pode cancelar uma execução concorrente depois que
  // outra execução já concluiu o snapshot. Essa execução sem qualquer contador
  // não é uma nova leitura válida e não deve esconder o último snapshot para o
  // cabeçalho; ela continua visível na aba Logs para auditoria.
  const isEmptyRuntimeCancellation =
    latest?.status === 'error' &&
    latest.companiesSynced === 0 &&
    latest.dealsSynced === 0 &&
    latest.ticketsSynced === 0 &&
    latest.stagesSynced === 0 &&
    latest.errorMessage?.includes('Execução concorrente interrompida pelo runtime');

  if (isEmptyRuntimeCancellation) {
    return runs.find((run) => run.status === 'success') ?? latest;
  }

  return latest;
}

export async function listHubspotSyncRuns(): Promise<SyncRun[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_analytics_dashboard_sync_status')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(30);
  if (error) throw toAppError(error, 'Falha ao carregar os logs de sincronização HubSpot.');
  return (data ?? []).map((row) => mapSyncRun(row as Row)).filter((row): row is SyncRun => Boolean(row));
}

function rpcFilters(filters: AnalyticsFilters) {
  return {
    p_from: filters.from || null,
    p_to: filters.to || null,
  };
}

export async function getCommercialSnapshot(filters: AnalyticsFilters, excludedPipelineIds: string[] = []): Promise<CommercialSnapshot> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_commercial_snapshot', {
    ...rpcFilters(filters),
    p_owner_id: filters.ownerId || null,
    p_stage_id: filters.stageId || null,
    p_excluded_pipeline_ids: excludedPipelineIds,
  });
  if (error) throw toAppError(error, 'Falha ao carregar a analise comercial filtrada.');
  return mapCommercialSnapshot(data);
}

export async function getCsSnapshot(filters: AnalyticsFilters, excludedPipelineIds: string[] = []): Promise<CsSnapshot> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_cs_snapshot', {
    ...rpcFilters(filters),
    p_stage_id: filters.stageId || null,
    p_priority: filters.priority || null,
    p_excluded_pipeline_ids: excludedPipelineIds,
  });
  if (error) throw toAppError(error, 'Falha ao carregar a analise de suporte filtrada.');
  return mapCsSnapshot(data);
}

export async function getFinanceSnapshot(filters: AnalyticsFilters, clientQuery = ''): Promise<FinanceSnapshot> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_finance_snapshot', {
    ...rpcFilters(filters),
    p_status: filters.stageId || null,
    p_aging_bucket: filters.priority || null,
    p_client_query: clientQuery.trim() || null,
  });
  if (error) throw toAppError(error, 'Falha ao carregar a analise financeira filtrada.');
  return mapFinanceSnapshot(data);
}

export interface FinanceUnmatchedClient { client: string; taxId: string | null; titles: number; balance: number; overdueBalance: number; nameMatches: number }

export async function getFinanceUnmatchedClients(clientQuery?: string, limit = 100): Promise<FinanceUnmatchedClient[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_finance_unmatched_clients', { p_client_query: clientQuery?.trim() || null, p_limit: limit });
  if (error) throw toAppError(error, 'Falha ao listar empresas sem correspondência no HubSpot.');
  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  return rows.map((row) => ({ client: String(row.client ?? 'Indisponível'), taxId: row.tax_id ? String(row.tax_id) : null, titles: Number(row.titles ?? 0), balance: Number(row.balance ?? 0), overdueBalance: Number(row.overdue_balance ?? 0), nameMatches: Number(row.name_matches ?? 0) }));
}

export async function getFinanceSourceStatus(): Promise<FinanceSourceStatus> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_finance_source_status');
  if (error) throw toAppError(error, 'Falha ao carregar a disponibilidade das fontes financeiras.');
  return mapFinanceSourceStatus(data);
}

export async function triggerOmieSync(): Promise<{ totalRows: number; acceptedRows: number }> {
  const config = readRuntimeConfig();
  if (!config.ok) throw new Error('As funcoes seguras do Supabase nao estao disponiveis neste ambiente.');
  const client = requireSupabaseBrowserClient();
  const { data: { session }, error: sessionError } = await client.auth.getSession();
  if (sessionError || !session?.access_token) throw new Error('Sessao ativa indisponivel para sincronizar o Omie.');
  const response = await fetch(`${config.config.supabaseUrl.replace(/\/$/, '')}/functions/v1/omie-sync`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, apikey: config.config.supabaseAnonKey } });
  const payload = await response.json().catch(() => null) as { error?: string; code?: string; message?: string; totalRows?: number; acceptedRows?: number } | null;
  if (!response.ok) throw new Error(formatAnalyticsSyncError({ operation: 'OMIE', status: response.status, payload }));
  return { totalRows: Number(payload?.totalRows ?? 0), acceptedRows: Number(payload?.acceptedRows ?? 0) };
}

export interface IntegrationSchedule {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'off';
  lastRunAt: string | null;
  lastStatus: string | null;
  lastMessage: string | null;
  hubspotEnabled: boolean;
  hubspotFrequency: 'hourly' | 'daily' | 'off';
  hubspotLastRunAt: string | null;
  hubspotLastStatus: string | null;
  hubspotLastMessage: string | null;
}

export async function getIntegrationSchedule(): Promise<IntegrationSchedule | null> {
  const client = requireSupabaseBrowserClient();
  // A agenda e um singleton. Nao filtre pelo campo `id`: em ambientes com
  // schema cache antigo o PostgREST pode interpretar o literal booleano como
  // UUID e devolver `invalid input syntax for type uuid: "true"`.
  const { data, error } = await client.from('vw_analytics_integration_schedule_read').select('enabled,frequency,last_run_at,last_status,last_message,hubspot_enabled,hubspot_frequency,hubspot_last_run_at,hubspot_last_status,hubspot_last_message').limit(1).maybeSingle();
  if (error) throw toAppError(error, 'Falha ao carregar o agendamento da integração.');
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    enabled: row.enabled === true,
    frequency: (['hourly', 'daily', 'off'].includes(String(row.frequency)) ? String(row.frequency) : 'off') as IntegrationSchedule['frequency'],
    lastRunAt: (row.last_run_at as string | null) ?? null,
    lastStatus: (row.last_status as string | null) ?? null,
    lastMessage: (row.last_message as string | null) ?? null,
    hubspotEnabled: row.hubspot_enabled === true,
    hubspotFrequency: (['hourly', 'daily', 'off'].includes(String(row.hubspot_frequency)) ? String(row.hubspot_frequency) : 'off') as IntegrationSchedule['hubspotFrequency'],
    hubspotLastRunAt: (row.hubspot_last_run_at as string | null) ?? null,
    hubspotLastStatus: (row.hubspot_last_status as string | null) ?? null,
    hubspotLastMessage: (row.hubspot_last_message as string | null) ?? null,
  };
}

export async function setIntegrationSchedule(
  enabled: boolean,
  frequency: IntegrationSchedule['frequency'],
  hubspotEnabled = false,
  hubspotFrequency: IntegrationSchedule['hubspotFrequency'] = 'off',
): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_admin_set_sync_schedules', {
    p_omie_enabled: enabled,
    p_omie_frequency: frequency,
    p_hubspot_enabled: hubspotEnabled,
    p_hubspot_frequency: hubspotFrequency,
  });
  if (error) throw toAppError(error, 'Falha ao salvar o agendamento.');
}

export async function runIntegrationNow(): Promise<{ status: 'success' | 'partial'; updated: number; companies: number; omieTitles: number; message?: string }> {
  const config = readRuntimeConfig();
  if (!config.ok) throw new Error('As funções seguras do Supabase não estão disponíveis neste ambiente.');
  const client = requireSupabaseBrowserClient();
  const { data: { session }, error: sessionError } = await client.auth.getSession();
  if (sessionError || !session?.access_token) throw new Error('Sessão ativa indisponível para sincronizar.');
  const response = await fetch(`${config.config.supabaseUrl.replace(/\/$/, '')}/functions/v1/analytics-integration-run`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, apikey: config.config.supabaseAnonKey } });
  const payload = await response.json().catch(() => null) as { error?: string; code?: string; status?: 'success' | 'partial'; updated?: number; companies?: number; omieTitles?: number; message?: string } | null;
  if (!response.ok) throw new Error(formatAnalyticsSyncError({ operation: 'OMIE ↔ HubSpot', status: response.status, payload }));
  return { status: payload?.status === 'partial' ? 'partial' : 'success', updated: Number(payload?.updated ?? 0), companies: Number(payload?.companies ?? 0), omieTitles: Number(payload?.omieTitles ?? 0), message: payload?.message };
}

export async function getCeoSnapshot(filters: AnalyticsFilters): Promise<CeoSnapshot> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_ceo_snapshot', { ...rpcFilters(filters) });
  if (error) throw toAppError(error, 'Falha ao carregar a visão executiva.');
  return mapCeoSnapshot(data);
}

export async function getCeoHistory(filters: AnalyticsFilters): Promise<CeoHistory> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_ceo_history', { ...rpcFilters(filters) });
  if (error) throw toAppError(error, 'Falha ao carregar a evolucao historica executiva.');
  return mapCeoHistory(data);
}

export async function getAmbiguousOverdueTitles(to: string): Promise<AmbiguousOverdueTitle[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_ceo_ambiguous_overdue', { p_to: to || null });
  if (error) throw toAppError(error, 'Falha ao carregar os títulos ambíguos em atraso.');
  return mapAmbiguousOverdueTitles(data);
}

export async function getReconciliationQuality(input: { from?: string; to?: string; status?: 'all' | 'matched' | 'unmatched' | 'ambiguous'; clientQuery?: string; groupResolution?: 'all' | 'economic_group' | 'without_group' }): Promise<ReconciliationQualityResult> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_ceo_reconciliation_quality_grouped', {
    p_from: input.from || null,
    p_to: input.to || null,
    p_status: input.status || 'all',
    p_client_query: input.clientQuery?.trim() || null,
    p_group_resolution: input.groupResolution || 'all',
    p_limit: 500,
    p_offset: 0,
  });
  if (error) throw toAppError(error, 'Falha ao carregar a fila de qualidade dos dados.');
  return mapReconciliationQuality(data);
}

export async function listAnalyticsSourceConfig(): Promise<AnalyticsSourceConfig[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.from('vw_analytics_dashboard_pipeline_catalog').select('*').order('domain_key').order('label');
  if (error) throw toAppError(error, 'Falha ao carregar as fontes configuradas do Dashboard.');
  return (data ?? []).map((row) => mapAnalyticsSourceConfig(row as Row));
}

export async function upsertAnalyticsSourceConfig(input: { id?: string; domainKey: 'commercial' | 'cs'; objectType: 'deal' | 'ticket'; pipelineId: string; label: string; isActive: boolean }): Promise<AnalyticsSourceConfig> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_admin_upsert_analytics_source_config', {
    p_id: input.id || null,
    p_domain_key: input.domainKey,
    p_object_type: input.objectType,
    p_hubspot_pipeline_id: input.pipelineId,
    p_label: input.label,
    p_is_active: input.isActive,
  });
  if (error) throw toAppError(error, 'Falha ao salvar a fonte do Dashboard.');
  return mapAnalyticsSourceConfig((data as Row) ?? {});
}

export async function mergeHubSpotCompanies(input: { primaryCompanyId: string; objectIdToMerge: string; confirmation: string; reason?: string }): Promise<{ auditId: string; mergedCompanyId: string | null; syncRecommended: boolean; message: string }> {
  const config = readRuntimeConfig();
  if (!config.ok) throw new Error('As funções seguras do Supabase não estão disponíveis neste ambiente.');
  const client = requireSupabaseBrowserClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError || !sessionData.session?.access_token) throw new Error('Sessão ativa indisponível para unificar empresas.');
  const baseUrl = config.config.supabaseUrl.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/functions/v1/hubspot-company-merge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionData.session.access_token}`, apikey: config.config.supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => null) as { error?: string; auditId?: string; mergedCompanyId?: string | null; syncRecommended?: boolean; message?: string } | null;
  if (!response.ok) throw new Error(payload?.error ?? `Unificação recusada pelo servidor (HTTP ${response.status}).`);
  return { auditId: payload?.auditId ?? '', mergedCompanyId: payload?.mergedCompanyId ?? null, syncRecommended: Boolean(payload?.syncRecommended), message: payload?.message ?? 'Unificação concluída.' };
}

export interface FinanceImportRun {
  id: string;
  status: string;
  originalFilename: string;
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  createdAt: string;
  finishedAt: string | null;
}

export async function listFinanceImportRuns(): Promise<FinanceImportRun[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_analytics_spreadsheet_import_runs_read')
    .select('id,status,original_filename,total_rows,accepted_rows,rejected_rows,created_at,finished_at')
    .order('created_at', { ascending: false })
    .limit(8);
  if (error) throw toAppError(error, 'Falha ao carregar o historico de importacoes.');
  return (data ?? []).map((row) => ({
    id: String(row.id),
    status: String(row.status),
    originalFilename: String(row.original_filename),
    totalRows: Number(row.total_rows ?? 0),
    acceptedRows: Number(row.accepted_rows ?? 0),
    rejectedRows: Number(row.rejected_rows ?? 0),
    createdAt: String(row.created_at),
    finishedAt: (row.finished_at as string | null) ?? null,
  }));
}

export async function triggerFinanceSpreadsheetImport(file: File): Promise<void> {
  const config = readRuntimeConfig();
  if (!config.ok) throw new Error('As funcoes seguras do Supabase nao estao disponiveis neste ambiente.');
  const client = requireSupabaseBrowserClient();
  const { data: { session }, error: sessionError } = await client.auth.getSession();
  if (sessionError || !session?.access_token) throw new Error('Sessao ativa indisponivel para importar a planilha.');
  const form = new FormData();
  form.set('source_key', 'omie_receivables_xlsx_20260622');
  form.set('file', file);
  const response = await fetch(`${config.config.supabaseUrl.replace(/\/$/, '')}/functions/v1/analytics-spreadsheet-import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, apikey: config.config.supabaseAnonKey },
    body: form,
  });
  const payload = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) throw new Error(payload?.error ?? `Importacao recusada pelo servidor (HTTP ${response.status}).`);
}

export async function triggerCsOpsSpreadsheetImport(file: File): Promise<void> {
  const config = readRuntimeConfig();
  if (!config.ok) throw new Error('As funcoes seguras do Supabase nao estao disponiveis neste ambiente.');
  const client = requireSupabaseBrowserClient();
  const { data: { session }, error: sessionError } = await client.auth.getSession();
  if (sessionError || !session?.access_token) throw new Error('Sessao ativa indisponivel para importar a planilha CS Ops.');
  const form = new FormData();
  form.set('source_key', 'cs_ops_consolidated');
  form.set('file', file);
  const response = await fetch(`${config.config.supabaseUrl.replace(/\/$/, '')}/functions/v1/analytics-spreadsheet-import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, apikey: config.config.supabaseAnonKey },
    body: form,
  });
  const payload = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) throw new Error(payload?.error ?? `Importacao CS Ops recusada pelo servidor (HTTP ${response.status}).`);
}

export interface CsOpsImportRun {
  id: string;
  status: string;
  originalFilename: string;
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  createdAt: string;
}

export async function listCsOpsImportRuns(): Promise<CsOpsImportRun[]> {
  const client = requireSupabaseBrowserClient();
  const { data: sources, error: sourceError } = await client
    .from('analytics_spreadsheet_sources')
    .select('id')
    .eq('source_key', 'cs_ops_consolidated');
  if (sourceError) throw toAppError(sourceError, 'Falha ao carregar a fonte CS Ops.');
  const sourceIds = (sources ?? []).map((row) => String(row.id));
  if (!sourceIds.length) return [];
  const { data, error } = await client
    .from('vw_analytics_spreadsheet_import_runs_read')
    .select('id,status,original_filename,total_rows,accepted_rows,rejected_rows,created_at')
    .in('source_id', sourceIds)
    .order('created_at', { ascending: false })
    .limit(8);
  if (error) throw toAppError(error, 'Falha ao carregar os lotes CS Ops.');
  return (data ?? []).map((row) => ({
    id: String(row.id),
    status: String(row.status),
    originalFilename: String(row.original_filename),
    totalRows: Number(row.total_rows ?? 0),
    acceptedRows: Number(row.accepted_rows ?? 0),
    rejectedRows: Number(row.rejected_rows ?? 0),
    createdAt: String(row.created_at),
  }));
}

export interface CsOpsMigrationPreflight {
  mode: 'dry_run' | 'apply';
  sourceRows: number;
  validSourceRows: number;
  hubspotCompaniesLoaded: number;
  hubspotOwnersLoaded: number;
  companyCatalog: 'local_cache' | 'hubspot_live';
  requiresRehydrate: boolean;
  canApply: boolean;
}

export async function runCsOpsMigration(sourceImportRunId: string, mode: 'dry_run' | 'apply' = 'dry_run', maxRows = 1000): Promise<{ migrationRunId: string; sourceImportRunId: string; status: string; counts: Record<string, number>; preflight?: CsOpsMigrationPreflight; message: string }> {
  const config = readRuntimeConfig();
  if (!config.ok) throw new Error('As funcoes seguras do Supabase nao estao disponiveis neste ambiente.');
  const client = requireSupabaseBrowserClient();
  const { data: { session }, error: sessionError } = await client.auth.getSession();
  if (sessionError || !session?.access_token) throw new Error('Sessao ativa indisponivel para simular a migracao CS Ops.');
  const baseUrl = config.config.supabaseUrl.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/functions/v1/hubspot-cs-migration`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, apikey: config.config.supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceImportRunId, mode, maxRows, ...(mode === 'apply' ? { confirmation: 'MIGRAR_CS_OPS' } : {}) }),
  });
  const payload = await response.json().catch(() => null) as { error?: string; migrationRunId?: string; sourceImportRunId?: string; status?: string; counts?: Record<string, number>; preflight?: CsOpsMigrationPreflight; message?: string } | null;
  if (!response.ok) throw new Error(payload?.error ?? `Migracao CS Ops recusada pelo servidor (HTTP ${response.status}).`);
  return { migrationRunId: String(payload?.migrationRunId ?? ''), sourceImportRunId: String(payload?.sourceImportRunId ?? sourceImportRunId), status: String(payload?.status ?? 'unknown'), counts: payload?.counts ?? {}, preflight: payload?.preflight, message: String(payload?.message ?? 'Simulacao concluida.') };
}

// Dispara a Edge Function hubspot-sync com o JWT da sessao ativa (platform_admin).
export interface HubspotSyncResult {
  mode: 'full' | 'incremental';
  deals: number;
  tickets: number;
  owners: number;
  stages: number;
  companies: number;
}

/**
 * Erro de gateway, não de negócio.
 *
 * A sincronização HubSpot é executada de forma síncrona e já foi medida em mais
 * de três minutos por etapa. O gateway encerra a conexão antes disso (502/504),
 * mas a Edge Function continua rodando e conclui normalmente — o resultado fica
 * registrado em `hubspot_sync_runs`.
 *
 * Tratar essa desconexão como falha produzia um falso negativo: a interface
 * dizia "a sincronização terminou com erro" sobre uma execução bem-sucedida.
 * Um status errado é pior que a demora, porque leva o operador a disparar a
 * sincronização de novo e criar execuções concorrentes.
 */
function isGatewayTimeout(status: number) {
  return status === 502 || status === 503 || status === 504;
}

const SYNC_POLL_INTERVAL_MS = 5_000;
const SYNC_POLL_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Acompanha uma execução já iniciada no servidor até ela terminar.
 *
 * Usa o read model existente (`vw_analytics_dashboard_sync_status`) em vez de
 * criar um contrato novo. Só é chamado quando a conexão caiu no gateway, ou
 * seja, quando o cliente perdeu a resposta mas o servidor não perdeu o trabalho.
 */
async function awaitRunningHubspotSync(startedAfter: number): Promise<HubspotSyncResult> {
  const deadline = Date.now() + SYNC_POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, SYNC_POLL_INTERVAL_MS));

    let run: SyncRun | null = null;
    try {
      run = await getLatestSyncRun();
    } catch {
      // Falha de leitura durante o acompanhamento não é falha da sincronização.
      continue;
    }

    // Descarta execuções anteriores ao disparo atual.
    const startedAt = run?.startedAt ? Date.parse(run.startedAt) : Number.NaN;
    if (!run || Number.isNaN(startedAt) || startedAt < startedAfter) continue;

    if (run.status === 'running') continue;

    if (run.status === 'error') {
      throw new Error(
        run.errorMessage?.trim() ||
          'A sincronização com o HubSpot terminou com erro. Consulte Configurações > Histórico de sincronizações.',
      );
    }

    return {
      mode: 'incremental',
      deals: run.dealsSynced ?? 0,
      tickets: run.ticketsSynced ?? 0,
      owners: run.ownersSynced ?? 0,
      stages: run.stagesSynced ?? 0,
      companies: run.companiesSynced ?? 0,
    };
  }

  throw new Error(
    'A sincronização continua em andamento no servidor e ultrapassou o tempo de acompanhamento. Não dispare novamente: acompanhe o resultado em Configurações > Histórico de sincronizações.',
  );
}

export async function triggerHubspotSync(
  domain?: 'commercial' | 'cs',
  options: { full?: boolean; phased?: boolean } = {},
): Promise<HubspotSyncResult> {
  const config = readRuntimeConfig();
  if (!config.ok) {
    throw new Error('As funcoes seguras do Supabase nao estao disponiveis neste ambiente.');
  }

  const client = requireSupabaseBrowserClient();
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error('Sessao ativa indisponivel para disparar a sincronizacao.');
  }

  const baseUrl = config.config.supabaseUrl.replace(/\/$/, '');
  const scopes: Array<'companies' | 'commercial' | 'cs' | undefined> =
    options.phased === false || domain ? [undefined] : ['companies', 'commercial', 'cs'];
  const aggregate: HubspotSyncResult = { mode: 'incremental', deals: 0, tickets: 0, owners: 0, stages: 0, companies: 0 };

  for (const scope of scopes) {
    // Marca de tempo anterior ao disparo: se a conexão cair, é por ela que
    // identificamos a execução desta etapa e ignoramos execuções antigas.
    const dispatchedAt = Date.now() - 1_000;

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/functions/v1/hubspot-sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: config.config.supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(domain ? { domain } : {}),
          ...(scope ? { scope } : {}),
          ...(options.full ? { full: true } : {}),
        }),
      });
    } catch {
      // A conexão caiu antes da resposta. O servidor continua trabalhando.
      const observed = await awaitRunningHubspotSync(dispatchedAt);
      aggregate.deals += observed.deals;
      aggregate.tickets += observed.tickets;
      aggregate.owners += observed.owners;
      aggregate.stages += observed.stages;
      aggregate.companies += observed.companies;
      continue;
    }

    if (isGatewayTimeout(response.status)) {
      const observed = await awaitRunningHubspotSync(dispatchedAt);
      aggregate.deals += observed.deals;
      aggregate.tickets += observed.tickets;
      aggregate.owners += observed.owners;
      aggregate.stages += observed.stages;
      aggregate.companies += observed.companies;
      continue;
    }

    const payload = (await response.json().catch(() => null)) as ({ error?: string; code?: string; message?: string } & Partial<HubspotSyncResult>) | null;
    if (!response.ok) {
      const label = scope ? ` na etapa ${scope}` : '';
      throw new Error(formatAnalyticsSyncError({ operation: `HubSpot${label}`, status: response.status, payload }));
    }
    aggregate.mode = payload?.mode === 'full' ? 'full' : aggregate.mode;
    aggregate.deals += Number(payload?.deals ?? 0);
    aggregate.tickets += Number(payload?.tickets ?? 0);
    aggregate.owners += Number(payload?.owners ?? 0);
    aggregate.stages += Number(payload?.stages ?? 0);
    aggregate.companies += Number(payload?.companies ?? 0);
  }

  return aggregate;
}
