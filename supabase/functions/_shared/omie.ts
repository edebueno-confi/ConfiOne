// Cliente read-only da API oficial Omie - Contas a Receber.
// A credencial chega do Vault como JSON { app_key, app_secret } ou app_key|app_secret.

const OMIE_BASE_URL = 'https://app.omie.com.br/api/v1/financas/contareceber/';

export interface OmieCredentials { appKey: string; appSecret: string }

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
  const value = (payload ?? {}) as { pagina?: number; total_de_paginas?: number; conta_receber_cadastro?: unknown[]; lista_contas_receber?: unknown[] };
  const rows = Array.isArray(value.conta_receber_cadastro)
    ? value.conta_receber_cadastro
    : Array.isArray(value.lista_contas_receber) ? value.lista_contas_receber : [];
  return { rows, page: Number(value.pagina ?? 1), totalPages: Number(value.total_de_paginas ?? 1) };
}

function valueAt(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return null;
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

export function normalizeOmieApiReceivables(rows: unknown[], syncRunId: string) {
  return rows.map((entry, index) => {
    const raw = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
    const details = (raw.detalhes && typeof raw.detalhes === 'object' ? raw.detalhes : raw) as Record<string, unknown>;
    const status = String(valueAt(details, 'cStatus', 'status_titulo', 'status') ?? 'Indisponivel').trim();
    const dueDate = excelOrOmieDate(valueAt(details, 'dDtVenc', 'data_vencimento', 'vencimento'));
    const issuedDate = excelOrOmieDate(valueAt(details, 'dDtEmissao', 'data_emissao', 'emissao'));
    const netAmount = numberValue(valueAt(details, 'nValorTitulo', 'valor_documento', 'valor', 'nValor'));
    // O ListarContasReceber nao retorna valor pago nem saldo; a liquidacao e
    // derivada do status. RECEBIDO conta como recebido integral; CANCELADO sai
    // do saldo; ATRASADO/VENCE HOJE/A VENCER permanecem em aberto pelo valor.
    const statusLower = status.toLowerCase();
    const isReceived = /receb/.test(statusLower) && !/parcial/.test(statusLower);
    const isCancelledStatus = /cancel/.test(statusLower);
    const net = netAmount ?? 0;
    const explicitReceived = numberValue(valueAt(details, 'nValorPago', 'valor_pago', 'valor_recebido'));
    const receivedAmount = explicitReceived ?? (isReceived ? net : 0);
    const sourceRecordId = String(valueAt(details, 'nCodTitulo', 'codigo_lancamento_omie', 'codigo_lancamento_integracao', 'id') ?? '').trim();
    const clientName = String(valueAt(details, 'cNomeCliente', 'nome_cliente', 'cliente', 'cliente_nome') ?? '').trim() || null;
    const clientTaxId = String(valueAt(details, 'cCPFCNPJ', 'cpf_cnpj', 'cliente_cnpj') ?? '').trim() || null;
    const balance = (isReceived || isCancelledStatus) ? 0 : Math.max(net - receivedAmount, 0);
    return {
      sync_run_id: syncRunId,
      source_key: 'omie_receivables_api',
      source_record_id: sourceRecordId || `omie-row:${index + 1}`,
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
      raw_payload: raw,
    };
  });
}

export async function fetchOmieReceivables(
  credentials: OmieCredentials,
  fetchImpl: typeof fetch = fetch,
  options: { timeoutMs?: number; maxRetries?: number } = {},
) {
  const rows: unknown[] = [];
  const pageSize = 500;
  const timeoutMs = Math.max(options.timeoutMs ?? 15000, 1000);
  const maxRetries = Math.min(Math.max(options.maxRetries ?? 2, 0), 3);
  for (let page = 1; page <= 100; page += 1) {
    let response: Response | null = null;
    let lastError: unknown = null;
    // Somente status realmente transitorios sao re-tentados. O Omie usa HTTP 500
    // para faults de negocio (ex.: SOAP-ENV:Client-6 REDUNDANT); re-tentar o mesmo
    // payload imediatamente provocaria o proprio "consumo redundante".
    const retriableStatus = new Set([429, 502, 503, 504]);
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
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
        if (attempt === maxRetries) throw new Error(`Falha de rede na API Omie: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        clearTimeout(timer);
      }
      if (response && (response.ok || !retriableStatus.has(response.status) || attempt === maxRetries)) break;
      // Backoff progressivo antes de nova tentativa de status transitorio.
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
    if (!response) throw new Error(`Falha de rede na API Omie: ${lastError instanceof Error ? lastError.message : 'resposta ausente'}.`);
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
      throw new Error(`Omie Contas a Receber falhou (${response.status})${detail ? `: ${detail}` : ''}.`);
    }
    const parsed = extractOmieReceivablesPage(await response.json());
    rows.push(...parsed.rows);
    if (parsed.page >= parsed.totalPages || parsed.rows.length === 0) return rows;
  }
  throw new Error('Omie excedeu o limite de 100 páginas por execução.');
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
export async function fetchOmieClientsIndex(
  credentials: OmieCredentials,
  fetchImpl: typeof fetch = fetch,
  options: { timeoutMs?: number; maxRetries?: number; maxPages?: number } = {},
): Promise<Map<string, OmieClientInfo>> {
  const index = new Map<string, OmieClientInfo>();
  const pageSize = 500;
  const timeoutMs = Math.max(options.timeoutMs ?? 15000, 1000);
  const maxRetries = Math.min(Math.max(options.maxRetries ?? 2, 0), 3);
  const maxPages = Math.min(Math.max(options.maxPages ?? 60, 1), 200);
  const retriableStatus = new Set([429, 502, 503, 504]);
  for (let page = 1; page <= maxPages; page += 1) {
    let response: Response | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        response = await fetchImpl(OMIE_CLIENTS_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildOmieClientsRequest(credentials, page, pageSize)),
          signal: controller.signal,
        });
      } catch {
        response = null;
      } finally {
        clearTimeout(timer);
      }
      if (response && (response.ok || !retriableStatus.has(response.status) || attempt === maxRetries)) break;
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
    if (!response || !response.ok) return index;
    const parsed = extractOmieClientsPage(await response.json());
    for (const entry of parsed.rows) {
      const row = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
      const code = normalizeOmieClientCode(row);
      if (!code) continue;
      const name = String(valueAt(row, 'razao_social', 'nome_fantasia', 'razaoSocial') ?? '').trim() || null;
      const tradeName = String(valueAt(row, 'nome_fantasia', 'nomeFantasia') ?? '').trim() || null;
      const taxId = String(valueAt(row, 'cnpj_cpf', 'cnpjCpf', 'cnpj') ?? '').trim() || null;
      index.set(code, { name, taxId, tradeName });
    }
    if (parsed.page >= parsed.totalPages || parsed.rows.length === 0) break;
  }
  return index;
}

export function enrichReceivablesWithClients<T extends { client_name: string | null; client_tax_id: string | null; client_trade_name?: string | null; raw_payload: unknown }>(
  rows: T[],
  clients: Map<string, OmieClientInfo>,
): T[] {
  if (clients.size === 0) return rows;
  for (const row of rows) {
    const raw = (row.raw_payload && typeof row.raw_payload === 'object' ? row.raw_payload : {}) as Record<string, unknown>;
    const code = valueAt(raw, 'codigo_cliente_fornecedor', 'codigo_cliente_omie');
    const key = code === null ? '' : String(code).trim();
    if (!key) continue;
    const info = clients.get(key);
    if (!info) continue;
    if (!row.client_name && info.name) row.client_name = info.name;
    if (!row.client_tax_id && info.taxId) row.client_tax_id = info.taxId;
    if (!row.client_trade_name && info.tradeName) row.client_trade_name = info.tradeName;
  }
  return rows;
}
