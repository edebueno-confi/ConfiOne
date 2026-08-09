// Cliente read-only da API oficial Omie - Contas a Receber.
import type { SyncRequestTelemetryEvent } from './sync-request-telemetry.ts';

// A credencial chega do Vault como JSON { app_key, app_secret } ou app_key|app_secret.

const OMIE_BASE_URL = 'https://app.omie.com.br/api/v1/financas/contareceber/';

export interface OmieCredentials { appKey: string; appSecret: string }

export type OmieErrorCode =
  | 'authentication_error'
  | 'invalid_request'
  | 'provider_validation_error'
  | 'provider_transient_error'
  | 'rate_limit'
  | 'timeout'
  | 'network_error'
  | 'malformed_response'
  | 'internal_error';

export type OmieRequestObserver = {
  record(event: SyncRequestTelemetryEvent): void;
};

function recordOmieRequest(observer: OmieRequestObserver | undefined, event: SyncRequestTelemetryEvent) {
  try { observer?.record(event); } catch { /* observabilidade não interrompe o sync */ }
}

export class OmieProviderError extends Error {
  readonly code: OmieErrorCode;
  readonly providerCode: string | null;
  readonly httpStatus: number | null;
  readonly retryable: boolean;
  readonly sanitizedMessage: string;
  readonly internalMessage: string;

  constructor(input: { code: OmieErrorCode; providerCode?: string | null; httpStatus?: number | null; retryable?: boolean; sanitizedMessage: string; internalMessage: string }) {
    super(input.internalMessage);
    this.name = 'OmieProviderError';
    this.code = input.code;
    this.providerCode = input.providerCode ?? null;
    this.httpStatus = input.httpStatus ?? null;
    this.retryable = input.retryable ?? false;
    this.sanitizedMessage = input.sanitizedMessage;
    this.internalMessage = input.internalMessage.slice(0, 2000);
  }
}

export function classifyOmieError(error: unknown): OmieProviderError {
  if (error instanceof OmieProviderError) return error;
  const message = error instanceof Error ? error.message : String(error);
  const httpStatus = Number(message.match(/(?:HTTP\s*)?\b([45]\d{2})\b/i)?.[1] ?? 0) || null;
  if (httpStatus === 429) return new OmieProviderError({ code: 'rate_limit', httpStatus, retryable: true, sanitizedMessage: 'A API OMIE está temporariamente limitada; tente novamente em instantes.', internalMessage: message });
  if (httpStatus !== null && httpStatus >= 500) return new OmieProviderError({ code: 'provider_transient_error', httpStatus, retryable: true, sanitizedMessage: 'A API OMIE não concluiu a consulta neste momento.', internalMessage: message });
  if (httpStatus === 401 || httpStatus === 403) return new OmieProviderError({ code: 'authentication_error', httpStatus, sanitizedMessage: 'A API OMIE recusou a autenticação da integração.', internalMessage: message });
  if (/abort|timeout|timed out/i.test(message)) return new OmieProviderError({ code: 'timeout', retryable: true, sanitizedMessage: 'A API OMIE demorou além do limite esperado.', internalMessage: message });
  if (/network|fetch failed|resposta ausente|falha de rede/i.test(message)) return new OmieProviderError({ code: 'network_error', retryable: true, sanitizedMessage: 'Não foi possível alcançar a API OMIE.', internalMessage: message });
  if (/invalid|invalida|credencial/i.test(message)) return new OmieProviderError({ code: 'invalid_request', sanitizedMessage: 'A configuração enviada à API OMIE não foi aceita.', internalMessage: message });
  if (/malformed|formato|pagina|progresso|COUNT_MISMATCH|EMPTY_PAGE/i.test(message)) return new OmieProviderError({ code: 'malformed_response', sanitizedMessage: 'A API OMIE respondeu em um formato inesperado.', internalMessage: message });
  return new OmieProviderError({ code: 'internal_error', sanitizedMessage: 'Não foi possível concluir a leitura do OMIE.', internalMessage: message });
}

export function parseOmieCredentials(secret: string): OmieCredentials {
  const trimmed = secret.trim();
  try {
    const parsed = JSON.parse(trimmed) as { app_key?: string; app_secret?: string };
    if (parsed.app_key?.trim() && parsed.app_secret?.trim()) return { appKey: parsed.app_key.trim(), appSecret: parsed.app_secret.trim() };
  } catch { /* fallback legacy */ }
  const separator = trimmed.indexOf('|');
  if (separator > 0 && trimmed.slice(separator + 1).trim()) {
    return { appKey: trimmed.slice(0, separator).trim(), appSecret: trimmed.slice(separator + 1).trim() };
  }
  throw new Error('Credencial Omie inválida. Use JSON com app_key/app_secret ou app_key|app_secret.');
}

export function buildOmieReceivablesRequest(credentials: OmieCredentials, page: number, pageSize: number) {
  // Estrutura oficial de lcrListarRequest (ListarContasReceber): pagina,
  // registros_por_pagina e apenas_importado_api.
  return { call: 'ListarContasReceber', app_key: credentials.appKey, app_secret: credentials.appSecret, param: [{ pagina: page, registros_por_pagina: pageSize, apenas_importado_api: 'N' }] };
}

export function extractOmieReceivablesPage(payload: unknown) {
  const value = (payload ?? {}) as { pagina?: number; total_de_paginas?: number; total_de_registros?: number; conta_receber_cadastro?: unknown[]; lista_contas_receber?: unknown[] };
  const rows = Array.isArray(value.conta_receber_cadastro)
    ? value.conta_receber_cadastro
    : Array.isArray(value.lista_contas_receber) ? value.lista_contas_receber : [];
  return { rows, page: Number(value.pagina ?? 1), totalPages: Number(value.total_de_paginas ?? 1), totalRecords: Number.isFinite(Number(value.total_de_registros)) ? Number(value.total_de_registros) : null };
}

function valueAt(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return null;
}

function stablePart(value: unknown): string {
  return String(value ?? '').trim().normalize('NFKC').toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Identidade de negócio versionada para títulos Omie.
 * O fallback deliberadamente retorna null: títulos sem chave estável não podem
 * ser publicados como se fossem o mesmo registro apenas por posição.
 */
export function deriveOmieSourceRecordId(row: Record<string, unknown>): string | null {
  const official = valueAt(row, 'nCodTitulo', 'codigo_lancamento_omie', 'codigo_lancamento_integracao', 'id');
  if (official !== null) return `omie-v3:id:${stablePart(official)}`;
  const customer = valueAt(row, 'codigo_cliente_fornecedor', 'codigo_cliente_omie', 'codigo_cliente');
  const document = valueAt(row, 'cNumDocFiscal', 'numero_documento_fiscal', 'numero_documento', 'cNumDoc');
  const installment = valueAt(row, 'nParcela', 'parcela', 'numero_parcela');
  const dueDate = valueAt(row, 'dDtVenc', 'data_vencimento', 'vencimento');
  const amount = valueAt(row, 'nValorTitulo', 'valor_documento', 'valor', 'nValor');
  const kind = valueAt(row, 'cTipo', 'tipo_titulo', 'origem');
  if (customer === null || document === null || dueDate === null || amount === null) return null;
  const dueDateCanonical = normalizeCanonicalDate(valueAt(row, 'dDtVenc', 'data_vencimento', 'vencimento'));
  const amountCanonical = normalizeCanonicalNumber(valueAt(row, 'nValorTitulo', 'valor_documento', 'valor', 'nValor'));
  const integrationCode = valueAt(row, 'codigo_lancamento_integracao', 'codigo_integracao');
  const category = valueAt(row, 'cCodCateg', 'categoria', 'categoria_codigo');
  if (dueDateCanonical === null || amountCanonical === null) return null;
  const parts = [customer, document, installment ?? '', kind ?? '', dueDateCanonical, amountCanonical, integrationCode ?? '', category ?? ''].map(stablePart);
  return `omie-v3:composite:${parts.map((part) => encodeURIComponent(part)).join('|')}`;
}

const SENSITIVE_PAYLOAD_KEY = /cpf|cnpj|tax.?id|documento|app.?key|app.?secret|token|password/i;

export function redactSensitivePayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitivePayload);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, child]) => [
    key,
    SENSITIVE_PAYLOAD_KEY.test(key) ? '[REDACTED_PII]' : redactSensitivePayload(child),
  ]));
}

function excelOrOmieDate(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 20000 && value < 60000) {
    return new Date(Date.UTC(1899, 11, 30) + value * 86400000).toISOString().slice(0, 10);
  }
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : null;
}

export function normalizeCanonicalDate(value: unknown): string | null {
  return excelOrOmieDate(value);
}

function numberValue(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const input = String(value ?? '').trim().replace(/R\$\s?/gi, '').replace(/\s/g, '');
  if (!input) return null;
  const raw = input.includes(',')
    ? input.replace(/\./g, '').replace(',', '.')
    : input;
  const parsed = Number(raw.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeCanonicalNumber(value: unknown): string | null {
  const parsed = numberValue(value);
  return parsed === null ? null : parsed.toFixed(2);
}

function agingBucket(status: string, dueDate: string | null) {
  const normalized = status.toLowerCase();
  if (normalized.includes('cancel')) return 'cancelado';
  if (normalized.includes('parcial')) return 'recebido_parcialmente';
  if (normalized.includes('receb')) return 'recebido';
  if (normalized.includes('atras')) return 'atrasado';
  if (dueDate && dueDate < new Date().toISOString().slice(0, 10)) return 'atrasado';
  if (dueDate === new Date().toISOString().slice(0, 10)) return 'vence_hoje';
  return dueDate ? 'a_vencer' : 'indisponivel';
}

export type RejectedReceivable = { reasonCode: string; message: string; index: number; fields: string[] };
export type NormalizedReceivable = Record<string, unknown> & {
  client_name: string | null;
  client_tax_id: string | null;
  client_trade_name: string | null;
  raw_payload: unknown;
};
export type NormalizedReceivablesResult = { accepted: NormalizedReceivable[]; rejected: RejectedReceivable[]; summary: { received: number; accepted: number; rejected: number } };

export function normalizeOmieApiReceivables(rows: unknown[], syncRunId: string): NormalizedReceivablesResult {
  const accepted: NormalizedReceivable[] = [];
  const rejected: RejectedReceivable[] = [];
  rows.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      rejected.push({ reasonCode: 'invalid_record_shape', message: 'Registro OMIE com formato invalido.', index, fields: [] });
      return;
    }
    const raw = entry as Record<string, unknown>;
    const details = (raw.detalhes && typeof raw.detalhes === 'object' ? raw.detalhes : raw) as Record<string, unknown>;
    const status = String(valueAt(details, 'cStatus', 'status_titulo', 'status') ?? 'Indisponivel').trim();
    const dueDate = excelOrOmieDate(valueAt(details, 'dDtVenc', 'data_vencimento', 'vencimento'));
    const issuedDate = excelOrOmieDate(valueAt(details, 'dDtEmissao', 'data_emissao', 'emissao'));
    const rawAmount = valueAt(details, 'nValorTitulo', 'valor_documento', 'valor', 'nValor');
    const netAmount = numberValue(rawAmount);
    if (rawAmount !== null && netAmount === null) {
      rejected.push({ reasonCode: 'invalid_amount', message: 'Valor do titulo invalido.', index, fields: ['amount'] });
      return;
    }
    if (valueAt(details, 'dDtVenc', 'data_vencimento', 'vencimento') !== null && dueDate === null) {
      rejected.push({ reasonCode: 'invalid_due_date', message: 'Vencimento do titulo invalido.', index, fields: ['due_date'] });
      return;
    }
    // O ListarContasReceber nao retorna valor pago nem saldo; a liquidacao e
    // derivada do status. RECEBIDO conta como recebido integral; CANCELADO sai
    // do saldo; ATRASADO/VENCE HOJE/A VENCER permanecem em aberto pelo valor.
    const statusLower = status.toLowerCase();
    const isReceived = /receb/.test(statusLower) && !/parcial/.test(statusLower);
    const isCancelledStatus = /cancel/.test(statusLower);
    const net = netAmount ?? 0;
    const explicitReceived = numberValue(valueAt(details, 'nValorPago', 'valor_pago', 'valor_recebido'));
    const receivedAmount = explicitReceived ?? (isReceived ? net : 0);
    const sourceRecordId = deriveOmieSourceRecordId(details);
    if (!sourceRecordId) {
      rejected.push({ reasonCode: 'missing_official_id_and_composite_fields', message: 'Titulo sem identificador estavel suficiente.', index, fields: ['customer', 'document', 'due_date', 'amount'] });
      return;
    }
    const clientName = String(valueAt(details, 'cNomeCliente', 'nome_cliente', 'cliente', 'cliente_nome') ?? '').trim() || null;
    const clientTaxId = String(valueAt(details, 'cCPFCNPJ', 'cpf_cnpj', 'cliente_cnpj') ?? '').trim() || null;
    const balance = (isReceived || isCancelledStatus) ? 0 : Math.max(net - receivedAmount, 0);
    accepted.push({
      sync_run_id: syncRunId,
      identity_version: 'omie-v3',
      source_key: 'omie_receivables_api',
      source_record_id: sourceRecordId,
      status_original: status,
      aging_bucket: agingBucket(status, dueDate),
      document_number: String(valueAt(details, 'cNumDocFiscal', 'numero_documento_fiscal', 'numero_documento', 'cNumDoc') ?? '').trim() || null,
      client_name: clientName,
      client_trade_name: null as string | null,
      client_tax_id: clientTaxId,
      net_amount: netAmount,
      received_amount: receivedAmount,
      balance,
      due_date: dueDate,
      issued_date: issuedDate,
      last_received_date: excelOrOmieDate(valueAt(details, 'dDtPagamento', 'data_pagamento')),
      boleto_generated: Boolean(valueAt(details, 'boleto', 'boleto_gerado')),
      is_cancelled: /cancel/i.test(status),
      is_partial: /parcial/i.test(status),
      effective_at: dueDate ? `${dueDate}T00:00:00Z` : null,
      raw_payload: redactSensitivePayload(raw),
    });
  });
  return { accepted, rejected, summary: { received: rows.length, accepted: accepted.length, rejected: rejected.length } };
}

export async function fetchOmieReceivablesWithMetadata(
  credentials: OmieCredentials,
  fetchImpl: typeof fetch = fetch,
  options: { timeoutMs?: number; maxRetries?: number; observer?: OmieRequestObserver } = {},
) {
  const pageSize = 500;
  const timeoutMs = Math.max(options.timeoutMs ?? 15000, 1000);
  const maxRetries = Math.min(Math.max(options.maxRetries ?? 2, 0), 3);
  const retriableStatus = new Set([429, 500, 502, 503, 504]);

  async function fetchPage(page: number) {
    let response: Response | null = null;
    let lastError: unknown = null;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        response = await fetchImpl(OMIE_BASE_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildOmieReceivablesRequest(credentials, page, pageSize)),
          signal: controller.signal,
        });
      } catch (error) {
        lastError = error;
        response = null;
        recordOmieRequest(options.observer, {
          endpoint: 'financas.contareceber.listar',
          method: 'POST',
          attempt: attempt + 1,
          statusCode: null,
          durationMs: Date.now() - startedAt,
          pageNumber: page,
          errorCode: error instanceof DOMException && error.name === 'AbortError' ? 'timeout' : 'network_error',
        });
        if (attempt === maxRetries) {
          throw new OmieProviderError({
            code: 'network_error',
            retryable: true,
            sanitizedMessage: 'Não foi possível alcançar a API OMIE.',
            internalMessage: `Falha de rede na API Omie: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      } finally {
        clearTimeout(timer);
      }
      if (response) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
        recordOmieRequest(options.observer, {
          endpoint: 'financas.contareceber.listar',
          method: 'POST',
          attempt: attempt + 1,
          statusCode: response.status,
          durationMs: Date.now() - startedAt,
          retryAfterMs: Number.isFinite(retryAfterMs) ? retryAfterMs : null,
          pageNumber: page,
          errorCode: response.status === 429 ? 'rate_limit' : response.status >= 500 ? 'provider_transient_error' : response.ok ? null : 'provider_error',
        });
      }
      if (response && (response.ok || !retriableStatus.has(response.status) || attempt === maxRetries)) break;
      // Backoff progressivo antes de nova tentativa de status transitorio.
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
    if (!response) throw new OmieProviderError({
      code: 'network_error',
      retryable: true,
      sanitizedMessage: 'Não foi possível alcançar a API OMIE.',
      internalMessage: `Falha de rede na API Omie: ${lastError instanceof Error ? lastError.message : 'resposta ausente'}.`,
    });
    if (!response.ok) {
      // A resposta de erro do Omie traz faultstring/faultcode e nao inclui o app_secret.
      let detail = '';
      try {
        const body = await response.text();
        try {
          const fault = JSON.parse(body) as { faultstring?: string; faultcode?: string };
          detail = fault.faultstring ? `${fault.faultcode ?? ''} ${fault.faultstring}`.trim() : body.slice(0, 300);
        } catch { detail = body.slice(0, 300); }
      } catch { /* corpo indisponivel */ }
      const code: OmieErrorCode = response.status === 429
        ? 'rate_limit'
        : response.status >= 500
          ? 'provider_transient_error'
          : response.status === 401 || response.status === 403
            ? 'authentication_error'
            : response.status === 400
              ? 'invalid_request'
              : 'provider_validation_error';
      throw new OmieProviderError({
        code,
        httpStatus: response.status,
        retryable: code === 'rate_limit' || code === 'provider_transient_error',
        sanitizedMessage: code === 'authentication_error'
          ? 'A API OMIE recusou a autenticação da integração.'
          : code === 'invalid_request' || code === 'provider_validation_error'
            ? 'A API OMIE recusou os parâmetros da consulta.'
            : 'A API OMIE não concluiu a consulta neste momento.',
        internalMessage: `Omie Contas a Receber falhou (${response.status})${detail ? `: ${detail}` : ''}.`,
      });
    }
    const payload = await response.json();
    if (payload && typeof payload === 'object' && ('faultstring' in payload || 'faultcode' in payload)) {
      const fault = payload as { faultcode?: unknown; faultstring?: unknown };
      throw new OmieProviderError({
        code: 'provider_validation_error',
        providerCode: fault.faultcode ? String(fault.faultcode).slice(0, 120) : null,
        sanitizedMessage: 'A API OMIE recusou a consulta por validação do provedor.',
        internalMessage: `OMIE_FUNCTIONAL_FAULT ${String(fault.faultcode ?? '')} ${String(fault.faultstring ?? '')}`,
      });
    }
    if (!payload || typeof payload !== 'object') throw new OmieProviderError({ code: 'malformed_response', sanitizedMessage: 'A API OMIE respondeu em um formato inesperado.', internalMessage: 'OMIE_EMPTY_OR_NON_OBJECT_RESPONSE' });
    return extractOmieReceivablesPage(payload);
  }

  // A paginação é serializada: o OMIE rejeita chamadas simultâneas do mesmo
  // método com 8020/REDUNDANT.
  const rows: unknown[] = [];
  let totalRecords: number | null = null;
  let totalPages: number | null = null;
  let previousPage = 0;
  for (let page = 1; page <= 100; page += 1) {
    const parsed = await fetchPage(page);
    if (!Number.isInteger(parsed.page) || parsed.page !== page || parsed.page <= previousPage || !Number.isInteger(parsed.totalPages) || parsed.totalPages < parsed.page) {
      throw new Error(`Resposta Omie sem progresso de pagina: esperado ${page}, recebido ${parsed.page}/${parsed.totalPages}.`);
    }
    previousPage = parsed.page;
    totalPages = parsed.totalPages;
    const parsedRawRecords = (parsed as { totalRecords?: number | null }).totalRecords;
    const parsedRecords = Number(parsedRawRecords);
    if (parsedRawRecords !== null && parsedRawRecords !== undefined && Number.isFinite(parsedRecords) && parsedRecords >= 0) totalRecords = parsedRecords;
    rows.push(...parsed.rows);
    if (parsed.rows.length === 0 && parsed.page < parsed.totalPages) throw new Error('OMIE_EMPTY_PAGE_BEFORE_END');
    if (parsed.page >= parsed.totalPages) {
      if (totalRecords !== null && totalRecords !== rows.length) throw new Error('OMIE_RECORD_COUNT_MISMATCH');
      return { rows, metadata: { totalPages, totalRecords, returnedRecords: rows.length } };
    }
  }
  throw new Error('Omie excedeu o limite de 100 páginas por execução.');
}

export async function fetchOmieReceivables(credentials: OmieCredentials, fetchImpl: typeof fetch = fetch, options: { timeoutMs?: number; maxRetries?: number } = {}) {
  return (await fetchOmieReceivablesWithMetadata(credentials, fetchImpl, options)).rows;
}

// --- Enriquecimento de clientes (read-only) ---------------------------------
// ListarClientesResumido devolve codigo_cliente_omie + razao_social + cnpj_cpf.
// Cruzamos por codigo_cliente_fornecedor dos titulos para preencher nome/CNPJ.

const OMIE_CLIENTS_URL = 'https://app.omie.com.br/api/v1/geral/clientes/';

export interface OmieClientInfo { name: string | null; taxId: string | null; tradeName: string | null }

export function buildOmieClientsRequest(credentials: OmieCredentials, page: number, pageSize: number) {
  return { call: 'ListarClientesResumido', app_key: credentials.appKey, app_secret: credentials.appSecret, param: [{ pagina: page, registros_por_pagina: pageSize }] };
}

export function extractOmieClientsPage(payload: unknown) {
  const value = (payload ?? {}) as { pagina?: number; total_de_paginas?: number; clientes_cadastro_resumido?: unknown[]; clientes_cadastro?: unknown[] };
  const rows = Array.isArray(value.clientes_cadastro_resumido)
    ? value.clientes_cadastro_resumido
    : Array.isArray(value.clientes_cadastro) ? value.clientes_cadastro : [];
  return { rows, page: Number(value.pagina ?? 1), totalPages: Number(value.total_de_paginas ?? 1) };
}

export function normalizeOmieClientCode(row: Record<string, unknown>): string | null {
  const code = valueAt(row, 'codigo_cliente_omie', 'nCod', 'codigo_cliente');
  const value = code === null ? '' : String(code).trim();
  return value || null;
}

// Best-effort: em caso de falha o enriquecimento e ignorado sem quebrar o sync.
export interface OmieClientsIndexFetchResult {
  index: Map<string, OmieClientInfo>;
  complete: boolean;
  pages: number;
  records: number;
}

export async function fetchOmieClientsIndexWithMetadata(
  credentials: OmieCredentials,
  fetchImpl: typeof fetch = fetch,
  options: { timeoutMs?: number; maxRetries?: number; maxPages?: number; observer?: OmieRequestObserver } = {},
): Promise<OmieClientsIndexFetchResult> {
  const index = new Map<string, OmieClientInfo>();
  const pageSize = 500;
  const timeoutMs = Math.max(options.timeoutMs ?? 15000, 1000);
  const maxRetries = Math.min(Math.max(options.maxRetries ?? 2, 0), 3);
  const maxPages = Math.min(Math.max(options.maxPages ?? 60, 1), 200);
  const retriableStatus = new Set([429, 500, 502, 503, 504]);
  let pages = 0;
  let records = 0;

  async function fetchPage(page: number) {
    let response: Response | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        response = await fetchImpl(OMIE_CLIENTS_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildOmieClientsRequest(credentials, page, pageSize)),
          signal: controller.signal,
        });
      } catch (error) {
        response = null;
        recordOmieRequest(options.observer, {
          endpoint: 'geral.clientes_resumido.listar',
          method: 'POST',
          attempt: attempt + 1,
          statusCode: null,
          durationMs: Date.now() - startedAt,
          pageNumber: page,
          errorCode: error instanceof DOMException && error.name === 'AbortError' ? 'timeout' : 'network_error',
        });
      } finally {
        clearTimeout(timer);
      }
      if (response) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
        recordOmieRequest(options.observer, {
          endpoint: 'geral.clientes_resumido.listar',
          method: 'POST',
          attempt: attempt + 1,
          statusCode: response.status,
          durationMs: Date.now() - startedAt,
          retryAfterMs: Number.isFinite(retryAfterMs) ? retryAfterMs : null,
          pageNumber: page,
          errorCode: response.status === 429 ? 'rate_limit' : response.status >= 500 ? 'provider_transient_error' : response.ok ? null : 'provider_error',
        });
      }
      if (response && (response.ok || !retriableStatus.has(response.status) || attempt === maxRetries)) break;
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
    if (!response || !response.ok) return null;
    try {
      return extractOmieClientsPage(await response.json());
    } catch {
      return null;
    }
  }

  function addPageRows(rows: unknown[]) {
    for (const entry of rows) {
      const row = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
      const code = normalizeOmieClientCode(row);
      if (!code) continue;
      const name = String(valueAt(row, 'razao_social', 'nome_fantasia', 'razaoSocial') ?? '').trim() || null;
      const tradeName = String(valueAt(row, 'nome_fantasia', 'nomeFantasia') ?? '').trim() || null;
      const taxId = String(valueAt(row, 'cnpj_cpf', 'cnpjCpf', 'cnpj') ?? '').trim() || null;
      index.set(code, { name, taxId, tradeName });
    }
  }

  const firstPage = await fetchPage(1);
  if (!firstPage) return { index, complete: false, pages, records };
  if (!Number.isInteger(firstPage.page) || firstPage.page !== 1 || !Number.isInteger(firstPage.totalPages) || firstPage.totalPages < firstPage.page) {
    return { index, complete: false, pages, records };
  }
  pages += 1;
  records += firstPage.rows.length;
  addPageRows(firstPage.rows);
  if (firstPage.page >= firstPage.totalPages) return { index, complete: true, pages, records };
  if (firstPage.rows.length === 0) return { index, complete: false, pages, records };

  const totalPages = Math.max(firstPage.totalPages, firstPage.page);
  if (totalPages > maxPages) return { index, complete: false, pages, records };
  for (let page = 2; page <= totalPages; page += 1) {
    const result = await fetchPage(page);
    if (!result) return { index, complete: false, pages, records };
    if (!Number.isInteger(result.page) || result.page !== page || !Number.isInteger(result.totalPages) || result.totalPages < page) {
      return { index, complete: false, pages, records };
    }
    pages += 1;
    records += result.rows.length;
    addPageRows(result.rows);
    if (result.rows.length === 0) return { index, complete: false, pages, records };
  }

  return { index, complete: pages === totalPages, pages, records };
}

export async function fetchOmieClientsIndex(
  credentials: OmieCredentials,
  fetchImpl: typeof fetch = fetch,
  options: { timeoutMs?: number; maxRetries?: number; maxPages?: number; observer?: OmieRequestObserver } = {},
): Promise<Map<string, OmieClientInfo>> {
  return (await fetchOmieClientsIndexWithMetadata(credentials, fetchImpl, options)).index;
}

export function enrichReceivablesWithClients<T extends { client_name: string | null; client_tax_id: string | null; client_trade_name?: string | null; raw_payload: unknown }>(
  rows: T[],
  clients: Map<string, OmieClientInfo>,
): { rows: T[]; stats: { matched: number; unmatched: number; fieldsUpdated: number } } {
  let matched = 0;
  let unmatched = 0;
  let fieldsUpdated = 0;
  for (const row of rows) {
    const raw = (row.raw_payload && typeof row.raw_payload === 'object' ? row.raw_payload : {}) as Record<string, unknown>;
    const code = valueAt(raw, 'codigo_cliente_fornecedor', 'codigo_cliente_omie');
    const key = code === null ? '' : String(code).trim();
    if (!key) { unmatched += 1; continue; }
    const info = clients.get(key);
    if (!info) { unmatched += 1; continue; }
    matched += 1;
    if (!row.client_name && info.name) { row.client_name = info.name; fieldsUpdated += 1; }
    if (!row.client_tax_id && info.taxId) { row.client_tax_id = info.taxId; fieldsUpdated += 1; }
    if (!row.client_trade_name && info.tradeName) { row.client_trade_name = info.tradeName; fieldsUpdated += 1; }
  }
  return { rows, stats: { matched, unmatched, fieldsUpdated } };
}
