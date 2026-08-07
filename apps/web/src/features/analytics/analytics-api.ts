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
  mapOmieSyncRun,
  mapCommercialSnapshot,
  mapCsSnapshot,
  mapCustomerSuccessSnapshot,
  type CommercialByOwner,
  type CommercialFunnelStage,
  type CommercialKpis,
  type CommercialMonthlyPoint,
  type CsByStatus,
  type CsKpis,
  type CsMonthlyPoint,
  type SyncRun,
  type OmieSyncRun,
  type AnalyticsFilters,
  type CommercialSnapshot,
  type CsSnapshot,
  type CustomerSuccessSnapshot,
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
  mapAnalyticsSyncHistory,
  type AnalyticsSyncHistoryRow,
  mapAnalyticsSourceStatus,
} from './analytics-model';
import type { AnalyticsSourceStatusPayload } from '@genius-support-os/contracts';
import { aggregateLatestHubspotSyncRuns } from './analytics-sync-runs.mjs';
import { analyticsSyncError } from './analytics-sync-errors.mjs';
import { sanitizeCsSyncResult } from './analytics-cs-control.mjs';
import { areAnalyticsSourcesActive } from './analytics-sync-progress.mjs';

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

export async function getAnalyticsSourceStatus(): Promise<AnalyticsSourceStatusPayload> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_source_status');
  if (error) throw toAppError(error, 'Falha ao carregar o estado das fontes do dashboard.');
  return mapAnalyticsSourceStatus(data);
}

export async function waitForAnalyticsSyncCompletion(
  kind: 'full' | 'hubspot' | 'omie',
  options: { pollMs?: number; timeoutMs?: number } = {},
): Promise<{ status: AnalyticsSourceStatusPayload; timedOut: boolean }> {
  const pollMs = Math.max(options.pollMs ?? 1500, 250);
  const timeoutMs = Math.max(options.timeoutMs ?? 5 * 60 * 1000, pollMs);
  const startedAt = Date.now();
  let status = await getAnalyticsSourceStatus();
  while (areAnalyticsSourcesActive(status, kind) && Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, pollMs));
    status = await getAnalyticsSourceStatus();
  }
  return { status, timedOut: areAnalyticsSourcesActive(status, kind) };
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

export async function listOmieSyncRuns(): Promise<OmieSyncRun[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_analytics_finance_sync_runs_read')
    .select('id,source_key,status,total_rows,accepted_rows,rejected_rows,started_at,finished_at,error_message,correlation_id,request_count,request_retry_count,rate_limit_count,provider_error_count,failed_request_count,request_duration_ms,request_average_duration_ms,request_success_rate_percent,last_request_at,enrichment_cache_source,enrichment_cache_age_seconds,enrichment_cache_rows')
    .order('started_at', { ascending: false })
    .limit(30);
  if (error) throw toAppError(error, 'Falha ao carregar os logs de sincronização OMIE.');
  return (data ?? []).map((row) => mapOmieSyncRun(row as Row));
}

export async function getLatestCsSyncRun(): Promise<SyncRun | null> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_analytics_dashboard_sync_status')
    .select('*')
    .eq('domain_key', 'cs')
    .order('started_at', { ascending: false })
    .limit(1);
  if (error) throw toAppError(error, 'Falha ao carregar o status da sincronização de CS.');
  return mapSyncRun((data?.[0] as Row) ?? null);
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

export async function getCustomerSuccessSnapshot(): Promise<CustomerSuccessSnapshot> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_customer_success_snapshot');
  if (error) throw toAppError(error, 'Falha ao carregar a carteira de Customer Success.');
  return mapCustomerSuccessSnapshot(data);
}

// Read models de KPI com estado explícito por indicador. O payload é devolvido
// cru para o contrato de apresentação, que é quem traduz códigos técnicos em
// linguagem gerencial. Nenhuma tela lê os campos internos diretamente.

export async function getCommercialKpisV2(filters: AnalyticsFilters): Promise<unknown> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_commercial_kpis_v2', {
    ...rpcFilters(filters),
    p_owner_id: filters.ownerId || null,
    p_pipeline_id: null,
  });
  if (error) throw toAppError(error, 'Falha ao carregar os indicadores comerciais.');
  return data;
}

export async function getSupportKpisV2(filters: AnalyticsFilters): Promise<unknown> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_support_kpis_v2', {
    ...rpcFilters(filters),
    p_pipeline_id: null,
    p_priority: filters.priority || null,
  });
  if (error) throw toAppError(error, 'Falha ao carregar os indicadores de atendimento.');
  return data;
}

export async function getCustomerSuccessKpisV2(): Promise<unknown> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_customer_success_kpis_v2');
  if (error) throw toAppError(error, 'Falha ao carregar os indicadores da carteira.');
  return data;
}

export async function getExecutiveKpisV2(filters: AnalyticsFilters): Promise<unknown> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_executive_kpis_v2', rpcFilters(filters));
  if (error) throw toAppError(error, 'Falha ao carregar o resumo executivo.');
  return data;
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
  if (!config.ok) throw new Error('A atualização não está disponível neste ambiente. O painel mantém o último estado publicado.');
  const client = requireSupabaseBrowserClient();
  const { data: { session }, error: sessionError } = await client.auth.getSession();
  if (sessionError || !session?.access_token) throw new Error('Sessao ativa indisponivel para sincronizar o Omie.');
  const response = await fetch(`${config.config.supabaseUrl.replace(/\/$/, '')}/functions/v1/omie-sync`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, apikey: config.config.supabaseAnonKey } });
  const payload = await response.json().catch(() => null) as { error?: string; code?: string; message?: string; totalRows?: number; acceptedRows?: number } | null;
  if (!response.ok) throw analyticsSyncError({ operation: 'OMIE', status: response.status, payload });
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
  if (!config.ok) throw new Error('A atualização não está disponível neste ambiente. O painel mantém o último estado publicado.');
  const client = requireSupabaseBrowserClient();
  const { data: { session }, error: sessionError } = await client.auth.getSession();
  if (sessionError || !session?.access_token) throw new Error('Sessão ativa indisponível para sincronizar.');
  const response = await fetch(`${config.config.supabaseUrl.replace(/\/$/, '')}/functions/v1/analytics-integration-run`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, apikey: config.config.supabaseAnonKey } });
  const payload = await response.json().catch(() => null) as { error?: string; code?: string; status?: 'success' | 'partial'; updated?: number; companies?: number; omieTitles?: number; message?: string } | null;
  if (!response.ok) throw analyticsSyncError({ operation: 'OMIE ↔ HubSpot', status: response.status, payload });
  return { status: payload?.status === 'partial' ? 'partial' : 'success', updated: Number(payload?.updated ?? 0), companies: Number(payload?.companies ?? 0), omieTitles: Number(payload?.omieTitles ?? 0), message: payload?.message };
}

export async function triggerSequentialAnalyticsSync(): Promise<{ status: 'success' | 'partial'; updated: number; companies: number; omieTitles: number; message?: string }> {
  const config = readRuntimeConfig();
  if (!config.ok) throw new Error('A atualização não está disponível neste ambiente. O painel mantém o último estado publicado.');
  const client = requireSupabaseBrowserClient();
  const { data: { session }, error: sessionError } = await client.auth.getSession();
  if (sessionError || !session?.access_token) throw new Error('Sessao ativa indisponivel para sincronizar.');
  const response = await fetch(`${config.config.supabaseUrl.replace(/\/$/, '')}/functions/v1/analytics-sequential-sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, apikey: config.config.supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const payload = await response.json().catch(() => null) as { error?: string; status?: 'success' | 'partial' | 'blocked'; hubspot?: { runId?: string; recordsPromoted?: number }; omie?: { totalRows?: number; acceptedRows?: number }; message?: string } | null;
  if (!response.ok && response.status !== 202) throw analyticsSyncError({ operation: 'HubSpot e OMIE', status: response.status, payload });
  const blocked = payload?.status === 'blocked';
  return {
    status: blocked || payload?.status === 'partial' ? 'partial' : 'success',
    updated: Number(payload?.hubspot?.recordsPromoted ?? 0),
    companies: 0,
    omieTitles: blocked ? 0 : Number(payload?.omie?.totalRows ?? 0),
    message: blocked ? `HubSpot ainda em processamento; OMIE nao iniciado. Execucao: ${payload?.hubspot?.runId ?? 'indisponivel'}.` : payload?.message,
  };
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
  const { data, error } = await client.from('vw_admin_analytics_pipeline_catalog_v2').select('*').order('object_type').order('label');
  if (error) throw toAppError(error, 'Falha ao carregar as fontes configuradas do Dashboard.');
  return (data ?? []).map((row) => mapAnalyticsSourceConfig(row as Row));
}

export async function updateAnalyticsPipelineConfig(input: { id: string; areaKey: AnalyticsSourceConfig['areaKey']; alias: string; isActive: boolean }): Promise<AnalyticsSourceConfig> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_admin_update_analytics_pipeline_config', {
    p_id: input.id,
    p_area_key: input.areaKey,
    p_alias: input.alias.trim() || null,
    p_is_active: input.isActive,
  });
  if (error) throw toAppError(error, 'Falha ao salvar a configuração do pipeline.');
  return mapAnalyticsSourceConfig((data as Row) ?? {});
}

export async function listAnalyticsSyncHistory(): Promise<AnalyticsSyncHistoryRow[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_admin_analytics_sync_history_v2')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(100);
  if (error) throw toAppError(error, 'Falha ao carregar o histórico de sincronizações.');
  return (data ?? []).map((row) => mapAnalyticsSyncHistory(row as Row));
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
  if (!config.ok) throw new Error('A atualização não está disponível neste ambiente. O painel mantém o último estado publicado.');
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

// Dispara a Edge Function hubspot-sync com o JWT da sessao ativa (platform_admin).
export interface HubspotSyncResult {
  mode: 'full' | 'incremental';
  deals: number;
  tickets: number;
  owners: number;
  stages: number;
  companies: number;
  status?: 'queued' | 'success' | 'partial';
  runId?: string;
}

export async function triggerHubspotSync(
  domain?: 'commercial' | 'cs',
  options: { full?: boolean; phased?: boolean } = {},
): Promise<HubspotSyncResult> {
  const config = readRuntimeConfig();
  if (!config.ok) {
    throw new Error('A atualização não está disponível neste ambiente. O painel mantém o último estado publicado.');
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
  const response = await fetch(`${baseUrl}/functions/v1/hubspot-orchestrator-start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: config.config.supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...(domain ? { domain } : {}),
        ...(options.full ? { full: true } : {}),
      }),
    });

    const payload = (await response.json().catch(() => null)) as ({ error?: string; code?: string; message?: string } & Partial<HubspotSyncResult>) | null;
    if (!response.ok) {
      throw analyticsSyncError({ operation: 'HubSpot', status: response.status, payload });
    }
  const rawRunId = payload as (Partial<HubspotSyncResult> & { run_id?: string }) | null;
  return { mode: rawRunId?.mode === 'full' ? 'full' : 'incremental', deals: 0, tickets: 0, owners: 0, stages: 0, companies: 0, status: 'queued', runId: rawRunId?.runId ?? rawRunId?.run_id };
}

export interface CsSupportSyncResult {
  status: 'queued' | 'success' | 'partial';
  mode: 'full' | 'incremental';
  correlationId: string | null;
  tickets: number;
  owners: number;
  stages: number;
}

export interface CsSyncProgress {
  runId: string;
  status: SyncRun['status'];
  pipelinesTotal: number;
  pipelinesCompleted: number;
  pages: number;
  received: number;
  accepted: number;
  rejected: number;
  promoted: number;
  retries: number;
  watermarkAdvanced: boolean;
  lastActivity: string | null;
  error: string | null;
}

export async function getCsSyncProgress(runId: string): Promise<CsSyncProgress | null> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.from('vw_analytics_hubspot_sync_progress').select('*').eq('run_id', runId).maybeSingle();
  if (error) throw toAppError(error, 'Falha ao carregar o progresso da sincronização de CS.');
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    runId,
    status: String(row.status ?? 'queued') as SyncRun['status'],
    pipelinesTotal: Number(row.pipelines_total ?? 0),
    pipelinesCompleted: Number(row.completed_items ?? row.pipelines_completed ?? 0),
    pages: Number(row.source_pages ?? 0),
    received: Number(row.source_records_received ?? 0),
    accepted: Number(row.records_accepted ?? 0),
    rejected: Number(row.records_rejected ?? 0),
    promoted: Number(row.records_promoted ?? 0),
    retries: Number(row.retries ?? 0),
    watermarkAdvanced: row.watermark_advanced === true,
    lastActivity: row.last_item_activity ? String(row.last_item_activity) : null,
    error: row.error_message ? String(row.error_message) : null,
  };
}

export async function triggerCsSupportSync(latestRun: SyncRun | null): Promise<CsSupportSyncResult> {
  const config = readRuntimeConfig();
  if (!config.ok) throw new Error('A atualização não está disponível neste ambiente. O painel mantém o último estado publicado.');
  const client = requireSupabaseBrowserClient();
  const { data: { session }, error: sessionError } = await client.auth.getSession();
  if (sessionError || !session?.access_token) throw new Error('Sessão ativa indisponível para sincronizar CS / Suporte.');
  const correlationId = crypto.randomUUID();
  const response = await fetch(`${config.config.supabaseUrl.replace(/\/$/, '')}/functions/v1/hubspot-orchestrator-start`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: config.config.supabaseAnonKey,
      'Content-Type': 'application/json',
      'x-analytics-correlation-id': correlationId,
    },
    body: JSON.stringify({ domain: 'cs_support', correlationId }),
  });
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) throw analyticsSyncError({ operation: 'HubSpot CS / Suporte', status: response.status, payload });
  return { ...sanitizeCsSyncResult(payload), status: 'queued', mode: 'full' };
}

/** Uma linha do cruzamento de etapas, já em linguagem de tela. */
export interface StageMappingRow {
  pipelineId: string;
  pipelineLabel: string;
  pipelineActive: boolean;
  stageId: string;
  sourceLabel: string | null;
  canonicalKey: string;
  canonicalLabel: string;
  canonicalOrder: number;
  isReviewed: boolean;
  ticketCount: number;
}

export async function listAnalyticsStageMapping(objectType = 'ticket'): Promise<StageMappingRow[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_stage_mapping_list', { p_object_type: objectType });
  if (error) throw toAppError(error, 'Falha ao carregar o cruzamento de etapas.');
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row: Record<string, unknown>) => ({
    pipelineId: String(row.pipeline_id ?? ''),
    pipelineLabel: String(row.pipeline_label ?? ''),
    pipelineActive: row.pipeline_active === true,
    stageId: String(row.stage_id ?? ''),
    sourceLabel: row.source_label ? String(row.source_label) : null,
    canonicalKey: String(row.canonical_key ?? ''),
    canonicalLabel: String(row.canonical_label ?? ''),
    canonicalOrder: Number(row.canonical_order ?? 100),
    isReviewed: row.is_reviewed === true,
    ticketCount: Number(row.ticket_count ?? 0),
  }));
}

export async function updateAnalyticsStageMapping(input: {
  objectType: string;
  pipelineId: string;
  stageId: string;
  canonicalLabel: string;
}): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_admin_update_analytics_stage_mapping', {
    p_object_type: input.objectType,
    p_pipeline_id: input.pipelineId,
    p_stage_id: input.stageId,
    p_canonical_label: input.canonicalLabel,
    p_canonical_order: null,
  });
  if (error) throw toAppError(error, 'Falha ao salvar o cruzamento de etapas.');
}

export async function seedAnalyticsStageMapping(): Promise<{ processed: number; pendingReview: number }> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_admin_seed_analytics_stage_mapping');
  if (error) throw toAppError(error, 'Falha ao buscar etapas novas.');
  const payload = (data ?? {}) as Record<string, unknown>;
  return {
    processed: Number(payload.processed ?? 0),
    pendingReview: Number(payload.pending_review ?? 0),
  };
}

/** Distribuição da fila por etapa canônica, já cruzada entre pipelines. */
export async function getSupportStageBreakdown(pipelineId: string | null = null): Promise<unknown> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc('rpc_analytics_support_stage_breakdown', { p_pipeline_id: pipelineId });
  if (error) throw toAppError(error, 'Falha ao carregar a distribuição por etapa.');
  return data;
}
