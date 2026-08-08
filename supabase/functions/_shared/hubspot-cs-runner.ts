import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { getAuthorizationHeader, jsonResponse } from './ticket-evidence.ts';

// Propriedades reais de ticket desta conta, confirmadas contra a API em
// 2026-08-07 por `scripts/analytics/hubspot-coverage-discovery.mjs`.
//
// Correcao de causa raiz: a lista anterior pedia `closedate`, que **nao existe**
// entre as 1.147 propriedades de ticket do portal. O HubSpot ignora propriedade
// inexistente em silencio, entao a data de encerramento ficava nula em 100% dos
// tickets encerrados sem nenhum erro visivel.
//
// Cobertura medida em 100 tickets encerrados dos pipelines publicados:
//   closed_date                                   100%
//   hs_lastactivitydate                           100%
//   hs_time_to_first_response_in_operating_hours   77%  (valor em milissegundos)
export const CS_TICKET_PROPERTIES = [
  'hs_pipeline', 'hs_pipeline_stage', 'hubspot_owner_id', 'source_type',
  'hs_ticket_priority', 'createdate', 'closed_date',
  'hs_lastactivitydate', 'hs_time_to_first_response_in_operating_hours',
  'hs_time_to_first_response_sla_status', 'hs_time_to_close_sla_status', 'subject',
  // Propriedades que a conta preenche e que a ingestao nao pedia. A auditoria
  // contra a API mostrou a diferenca entre o que existe e o que chegava aqui:
  //
  //   first_agent_reply_date        13.679 na origem, 1.077 do campo em uso
  //   hs_ticket_reopened_at            68 na origem, nenhum ingerido
  //   time_to_close                  medido pelo HubSpot, calculavamos a mao
  //   hs_is_one_touch_ticket         explica os encerramentos instantaneos
  //
  // `subject` ja era pedido e descartado na gravacao, por falta de coluna.
  'first_agent_reply_date', 'hs_ticket_reopened_at', 'time_to_close',
  'hs_is_one_touch_ticket',
  // Campos customizados de conclusao. A hipotese da operacao se confirmou: a
  // equipe registra o desfecho aqui e nem sempre move a etapa, e por isso o
  // painel via como aberto o que ja tinha sido concluido.
  //
  //   tipo_de_fechamento___fale_conosco___confi   1.247 preenchidos, no mesmo
  //     pipeline que tem 1.117 parados
  //   data_de_passgem___concluido                    51 preenchidos
  //
  // Nenhuma regra e aplicada na ingestao: os valores sao gravados como vieram, e
  // a decisao de como interpreta-los fica registrada depois, com pessoa.
  'tipo_de_fechamento___fale_conosco___confi', 'tipo_de_fechamento___b2b___confi',
  'tipo_de_fechamento___confi', 'data_de_passgem___concluido',
  'hs_resolution',
];
export const HUBSPOT_DEAL_PROPERTIES = ['pipeline','dealstage','hubspot_owner_id','amount_in_home_currency','dealtype','dealname','createdate','closedate','hs_lastmodifieddate'];

export type HubSpotErrorCode =
  | 'authentication_error'
  | 'invalid_request'
  | 'provider_validation_error'
  | 'provider_transient_error'
  | 'rate_limit'
  | 'timeout'
  | 'network_error'
  | 'malformed_response'
  | 'internal_error';

export type HubSpotClassifiedError = {
  code: HubSpotErrorCode;
  providerCode: string | null;
  retryable: boolean;
  sanitizedMessage: string;
  internalMessage: string;
};

export async function authorizeCsRunner(req: Request, client: SupabaseClient): Promise<string | null> {
  const configuredSecret = Deno.env.get('ANALYTICS_SYNC_SECRET')?.trim();
  const providedSecret = req.headers.get('x-analytics-sync-secret')?.trim();
  if (configuredSecret && providedSecret && providedSecret === configuredSecret) return 'scheduler';

  const authHeader = getAuthorizationHeader(req);
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  const userId = String(data.claims.sub);
  const { data: roleRow } = await client.from('user_global_roles').select('user_id').eq('user_id', userId).eq('role', 'platform_admin').maybeSingle();
  return roleRow ? userId : null;
}

export async function resolveHubSpotToken(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.rpc('rpc_service_get_managed_integration_secret', { p_integration_key: 'hubspot' });
  if (!error && typeof data === 'string' && data.trim()) return data.trim();
  const fallback = Deno.env.get('HUBSPOT_PRIVATE_APP_TOKEN')?.trim();
  if (fallback) return fallback;
  throw new Error(error ? `Falha ao ler credencial gerenciada do HubSpot: ${error.message}` : 'Credencial do HubSpot não configurada.');
}

export function runnerMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null
      ? String((error as { message?: unknown }).message ?? JSON.stringify(error))
      : String(error);
}

function httpStatusFromMessage(message: string): number | null {
  const match = message.match(/\((\d{3})\)/);
  return match ? Number(match[1]) : null;
}

function redactInternalMessage(message: string): string {
  return message
    .replace(/(Bearer\s+|pat-[A-Za-z0-9_-]+|sb_secret_[A-Za-z0-9_-]+)/gi, '[REDACTED]')
    .replace(/(authorization|token|secret|app_secret)\s*[:=]\s*[^,\s}]+/gi, '$1=[REDACTED]')
    .slice(0, 1000);
}

export function classifyHubSpotError(error: unknown): HubSpotClassifiedError {
  const internalMessage = redactInternalMessage(runnerMessage(error));
  const status = httpStatusFromMessage(internalMessage);
  const providerCode = status ? String(status) : null;

  if (status === 401 || status === 403 || /authentication credentials|authentication required|unauthorized|forbidden|credencial.*hubspot|missing.*hubspot.*token|hubspot_private_app_token/i.test(internalMessage)) {
    return { code: 'authentication_error', providerCode, retryable: false, sanitizedMessage: 'A autenticação do HubSpot foi recusada. Verifique a credencial configurada.', internalMessage };
  }
  if (status === 429 || /rate limit|too many requests/i.test(internalMessage)) {
    return { code: 'rate_limit', providerCode, retryable: true, sanitizedMessage: 'O HubSpot limitou temporariamente a consulta. Tente novamente após o intervalo de segurança.', internalMessage };
  }
  if (status !== null && status >= 500) {
    return { code: 'provider_transient_error', providerCode, retryable: true, sanitizedMessage: 'O HubSpot não concluiu a consulta neste momento.', internalMessage };
  }
  if (/abort|timeout|timed out|tempo limite/i.test(internalMessage)) {
    return { code: 'timeout', providerCode, retryable: true, sanitizedMessage: 'O HubSpot demorou além do limite esperado.', internalMessage };
  }
  if (/network|fetch failed|falha de rede|conex[aã]o/i.test(internalMessage)) {
    return { code: 'network_error', providerCode, retryable: true, sanitizedMessage: 'Não foi possível alcançar o HubSpot.', internalMessage };
  }
  if (status === 400 || /invalid|inválida|invalida|bad request/i.test(internalMessage)) {
    return { code: 'invalid_request', providerCode, retryable: false, sanitizedMessage: 'A solicitação enviada ao HubSpot não foi aceita.', internalMessage };
  }
  if (/malformed|formato inesperado|resposta ausente/i.test(internalMessage)) {
    return { code: 'malformed_response', providerCode, retryable: false, sanitizedMessage: 'O HubSpot respondeu em um formato inesperado.', internalMessage };
  }
  return { code: 'internal_error', providerCode, retryable: false, sanitizedMessage: 'Não foi possível concluir a leitura do HubSpot.', internalMessage };
}

export function runnerError(error: unknown, status = 502) {
  const classified = classifyHubSpotError(error);
  return jsonResponse({ error: classified.sanitizedMessage, code: classified.code }, { status });
}

export function toIsoTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function toTicketStagingRow(record: { id: string; properties: Record<string, string | null> }, pipelineId: string, parentRunId: string, pageNumber: number) {
  return {
    parent_run_id: parentRunId,
    pipeline_id: record.properties.hs_pipeline ?? pipelineId,
    ticket_id: record.id,
    pipeline_stage: record.properties.hs_pipeline_stage ?? null,
    owner_id: record.properties.hubspot_owner_id ?? null,
    source_type: record.properties.source_type ?? null,
    priority: record.properties.hs_ticket_priority ?? null,
    hs_created_at: toIsoTimestamp(record.properties.createdate),
    hs_closed_at: toIsoTimestamp(record.properties.closed_date),
    last_activity_at: toIsoTimestamp(record.properties.hs_lastactivitydate),
    first_response_ms: toMilliseconds(record.properties.hs_time_to_first_response_in_operating_hours),
    time_to_first_response_sla_status: record.properties.hs_time_to_first_response_sla_status ?? null,
    time_to_close_sla_status: record.properties.hs_time_to_close_sla_status ?? null,
    subject: record.properties.subject ?? null,
    // A data da primeira resposta do agente tem cobertura mais de dez vezes
    // maior que o tempo em horas de SLA que usavamos.
    first_agent_reply_at: toIsoTimestamp(record.properties.first_agent_reply_date),
    // Reabertura nativa: dispensa o historico de etapas, que nunca foi ingerido.
    reopened_at: toIsoTimestamp(record.properties.hs_ticket_reopened_at),
    time_to_close_ms: toMilliseconds(record.properties.time_to_close),
    // Guardados sem interpretacao. O painel nao pode tratar "Solicitacao
    // concluida" como encerramento por conta propria: isso seria inventar regra
    // de negocio a partir de um texto livre.
    closure_type: record.properties.tipo_de_fechamento___fale_conosco___confi
      ?? record.properties.tipo_de_fechamento___b2b___confi
      ?? record.properties.tipo_de_fechamento___confi
      ?? null,
    closure_marked_at: toIsoTimestamp(record.properties.data_de_passgem___concluido),
    resolution_note: record.properties.hs_resolution ?? null,
    is_one_touch: record.properties.hs_is_one_touch_ticket === 'true'
      ? true
      : record.properties.hs_is_one_touch_ticket === 'false' ? false : null,
    raw: record.properties,
    source_page: pageNumber,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Duracoes do HubSpot chegam como string de milissegundos. O nome
 * `hs_time_to_first_response_in_operating_hours` sugere horas, mas o valor
 * medido na conta e em milissegundos; a conversao acontece no read model.
 */
export function toMilliseconds(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
}

export function toDealStagingRow(record: { id: string; properties: Record<string, string | null> }, pipelineId: string, parentRunId: string, pageNumber: number) {
  const amount = Number(record.properties.amount_in_home_currency ?? '');
  const timestamp = (value: string | null | undefined) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  };
  return {
    parent_run_id: parentRunId,
    pipeline_id: record.properties.pipeline ?? pipelineId,
    deal_id: record.id,
    dealstage: record.properties.dealstage ?? null,
    owner_id: record.properties.hubspot_owner_id ?? null,
    amount_home: Number.isFinite(amount) ? amount : null,
    dealtype: record.properties.dealtype ?? null,
    deal_name: record.properties.dealname ?? null,
    hs_created_at: timestamp(record.properties.createdate),
    hs_closed_at: timestamp(record.properties.closedate),
    raw: record.properties,
    source_page: pageNumber,
    updated_at: new Date().toISOString(),
  };
}
