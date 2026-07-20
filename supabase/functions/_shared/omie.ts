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
  return { call: 'ListarContasReceber', app_key: credentials.appKey, app_secret: credentials.appSecret, param: [{ nPagina: page, nRegPorPagina: pageSize }] };
}

export function extractOmieReceivablesPage(payload: unknown) {
  const value = (payload ?? {}) as { pagina?: number; total_de_paginas?: number; lista_contas_receber?: unknown[] };
  return { rows: Array.isArray(value.lista_contas_receber) ? value.lista_contas_receber : [], page: Number(value.pagina ?? 1), totalPages: Number(value.total_de_paginas ?? 1) };
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
    const receivedAmount = numberValue(valueAt(details, 'nValorPago', 'valor_pago', 'valor_recebido')) ?? 0;
    const sourceRecordId = String(valueAt(details, 'nCodTitulo', 'codigo_lancamento_omie', 'codigo_lancamento_integracao', 'id') ?? '').trim();
    const clientName = String(valueAt(details, 'cNomeCliente', 'nome_cliente', 'cliente', 'cliente_nome') ?? '').trim() || null;
    const clientTaxId = String(valueAt(details, 'cCPFCNPJ', 'cpf_cnpj', 'cliente_cnpj') ?? '').trim() || null;
    const balance = netAmount === null ? 0 : Math.max(netAmount - receivedAmount, 0);
    return {
      sync_run_id: syncRunId,
      source_key: 'omie_receivables_api',
      source_record_id: sourceRecordId || `omie-row:${index + 1}`,
      status_original: status,
      aging_bucket: agingBucket(status, dueDate),
      document_number: String(valueAt(details, 'cNumDocFiscal', 'numero_documento_fiscal', 'cNumDoc') ?? '').trim() || null,
      client_name: clientName,
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
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        response = await fetchImpl(OMIE_BASE_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildOmieReceivablesRequest(credentials, page, pageSize)),
          signal: controller.signal,
        });
        if (response.ok || ![408, 425, 429, 500, 502, 503, 504].includes(response.status) || attempt === maxRetries) break;
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) throw new Error(`Falha de rede na API Omie: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        clearTimeout(timer);
      }
    }
    if (!response) throw new Error(`Falha de rede na API Omie: ${lastError instanceof Error ? lastError.message : 'resposta ausente'}.`);
    if (!response.ok) throw new Error(`Omie Contas a Receber falhou (${response.status}).`);
    const parsed = extractOmieReceivablesPage(await response.json());
    rows.push(...parsed.rows);
    if (parsed.page >= parsed.totalPages || parsed.rows.length === 0) return rows;
  }
  throw new Error('Omie excedeu o limite de 100 páginas por execução.');
}
