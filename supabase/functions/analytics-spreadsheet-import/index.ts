import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { strFromU8, unzipSync } from 'npm:fflate@0.8.2';
import {
  createServiceClient,
  getAuthorizationHeader,
  jsonResponse,
  optionsResponse,
} from '../_shared/ticket-evidence.ts';
import { CS_OPS_MAPPING_VERSION, CS_OPS_SHEET_NAME, CS_OPS_SOURCE_KEY, isCsOpsHeaderRow, mapCsOpsRows } from '../_shared/cs-ops.ts';

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const OMIE_SOURCE = 'omie_receivables_xlsx_20260622';
const ALLOWED_SOURCES = new Set([OMIE_SOURCE, CS_OPS_SOURCE_KEY]);

function text(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = text(value).replace(/R\$\s?/gi, '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = Number(raw);
  return raw && Number.isFinite(parsed) ? parsed : null;
}

function dateValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 20000 && value < 60000) {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return date.toISOString().slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const raw = text(value);
  if (!raw) return null;
  const br = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function decodeXml(value: string) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function attribute(tag: string, name: string) {
  return tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? '';
}

function columnIndex(reference: string) {
  const letters = reference.match(/^[A-Z]+/i)?.[0]?.toUpperCase() ?? 'A';
  return [...letters].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function excelXmlRows(bytes: Uint8Array, requestedSheet: string | null) {
  const files = unzipSync(bytes);
  const workbookXml = strFromU8(files['xl/workbook.xml']);
  const relsXml = strFromU8(files['xl/_rels/workbook.xml.rels']);
  const sharedStringsXml = files['xl/sharedStrings.xml'] ? strFromU8(files['xl/sharedStrings.xml']) : '';
  const sharedStrings = [...sharedStringsXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    decodeXml([...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((item) => item[1]).join('')),
  );
  const relationships = new Map([...relsXml.matchAll(/<Relationship\s+([^>]+?)\s*\/>/g)].map((match) => [
    attribute(match[1], 'Id'),
    (() => { const target = attribute(match[1], 'Target').replace(/^\//, ''); return target.startsWith('xl/') ? target : `xl/${target}`; })(),
  ]));
  const sheets = [...workbookXml.matchAll(/<sheet\s+([^>]+?)\s*\/>/g)].map((match) => ({
    name: decodeXml(attribute(match[1], 'name')),
    path: relationships.get(attribute(match[1], 'r:id')) ?? `xl/worksheets/sheet${attribute(match[1], 'sheetId')}.xml`,
  }));
  const selected = requestedSheet ? sheets.find((sheet) => sheet.name === requestedSheet) : sheets[0];
  if (!selected) return { sheetNames: sheets.map((sheet) => sheet.name), selectedSheet: null, rows: [] as unknown[][] };
  const sheetXml = strFromU8(files[selected.path]);
  const rows = [...sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const row: unknown[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cellMatch[1];
      const cellBody = cellMatch[2] ?? '';
      const reference = attribute(attrs, 'r');
      const index = columnIndex(reference);
      const type = attribute(attrs, 't');
      const value = cellBody.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '';
      const inline = [...cellBody.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) => match[1]).join('');
      let parsed: unknown = value;
      if (type === 's') parsed = sharedStrings[Number(value)] ?? '';
      else if (type === 'inlineStr') parsed = decodeXml(inline);
      else if (type === 'b') parsed = value === '1';
      else if (value !== '' && Number.isFinite(Number(value))) parsed = Number(value);
      row[index] = parsed;
    }
    return row;
  });
  return { sheetNames: sheets.map((sheet) => sheet.name), selectedSheet: selected.name, rows };
}

function csvRows(textValue: string) {
  return textValue.split(/\r?\n/).filter((line) => line.trim()).map((line) => {
    const cells: string[] = [];
    let current = ''; let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') { current += '"'; index += 1; continue; }
      if (char === '"') { quoted = !quoted; continue; }
      if (char === ',' && !quoted) { cells.push(current); current = ''; continue; }
      current += char;
    }
    cells.push(current);
    return cells;
  });
}

function rowsToObjects(matrix: unknown[][], headerRow: number) {
  const headers = (matrix[headerRow] ?? []).map((value, index) => text(value) || `col_${index + 1}`);
  return matrix.slice(headerRow + 1).filter((row) => row.some((value) => text(value))).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])));
}

function find(row: Record<string, unknown>, ...names: string[]) {
  for (const name of names) {
    const key = Object.keys(row).find((candidate) => candidate.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
    if (key) return row[key];
  }
  return null;
}

function agingBucket(status: string, dueDate: string | null) {
  const normalized = status.toLowerCase();
  if (normalized.includes('cancel')) return 'cancelado';
  if (normalized.includes('parcial')) return 'recebido_parcialmente';
  if (normalized.includes('receb')) return 'recebido';
  if (dueDate) {
    if (dueDate < new Date().toISOString().slice(0, 10)) return 'atrasado';
    if (dueDate === new Date().toISOString().slice(0, 10)) return 'vence_hoje';
  }
  return 'a_vencer';
}

async function authorize(req: Request, client: ReturnType<typeof createServiceClient>) {
  const token = getAuthorizationHeader(req).replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data } = await client.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: role } = await client.from('user_global_roles').select('user_id').eq('user_id', String(userId)).eq('role', 'platform_admin').maybeSingle();
  return role ? String(userId) : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
  const contentType = req.headers.get('content-type') ?? '';
  if (!/^multipart\/form-data(?:;|$)/i.test(contentType)) {
    return jsonResponse({ error: 'Envie a planilha como multipart/form-data, usando o campo file.' }, { status: 400 });
  }
  const client = createServiceClient();
  const actorId = await authorize(req, client);
  if (!actorId) return jsonResponse({ error: 'Acesso negado. Requer platform_admin.' }, { status: 403 });

  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return jsonResponse({ error: 'Não foi possível interpretar o formulário multipart da planilha.' }, { status: 400 });
    }
    const sourceKey = text(form.get('source_key')) || OMIE_SOURCE;
    const file = form.get('file');
    if (!ALLOWED_SOURCES.has(sourceKey)) return jsonResponse({ error: 'Esta fonte ainda nao possui um mapeamento operacional aprovado.' }, { status: 422 });
    if (!(file instanceof File)) return jsonResponse({ error: 'Envie um arquivo XLSX ou CSV.' }, { status: 400 });
    if (!/\.(xlsx|csv)$/i.test(file.name)) return jsonResponse({ error: 'Formato invalido. Envie um arquivo XLSX ou CSV.' }, { status: 415 });
    if (file.size > MAX_FILE_BYTES) return jsonResponse({ error: 'O arquivo excede o limite de 15 MB.' }, { status: 413 });

    const bytes = new Uint8Array(await file.arrayBuffer());
    console.info(JSON.stringify({ event: 'spreadsheet_payload_received', sourceKey, fileSize: file.size, byteLength: bytes.length, magic: Array.from(bytes.slice(0, 4)) }));
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    const { data: source, error: sourceError } = await client.from('analytics_spreadsheet_sources').select('id,mapping_version').eq('source_key', sourceKey).maybeSingle();
    if (sourceError || !source) return jsonResponse({ error: 'Fonte de planilha nao cadastrada.' }, { status: 409 });
    const mappingVersion = String(source.mapping_version);
    const { data: existing } = await client.from('analytics_spreadsheet_import_runs').select('id,status,total_rows,accepted_rows,rejected_rows').eq('source_id', source.id).eq('file_sha256', hash).eq('mapping_version', mappingVersion).maybeSingle();
    if (existing) return jsonResponse({ ok: true, duplicate: true, run: existing });

    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const parsed = isCsv ? { sheetNames: ['CSV'], selectedSheet: 'CSV', rows: csvRows(new TextDecoder().decode(bytes)) } : excelXmlRows(bytes, sourceKey === CS_OPS_SOURCE_KEY ? CS_OPS_SHEET_NAME : null);
    console.info(JSON.stringify({ event: 'spreadsheet_workbook_parsed', sourceKey, sheetCount: parsed.sheetNames.length, selectedSheet: parsed.selectedSheet, parser: isCsv ? 'csv' : 'xlsx-xml' }));
    const sheetName = parsed.selectedSheet;
    if (!sheetName) {
      return jsonResponse({ error: sourceKey === CS_OPS_SOURCE_KEY ? `A planilha precisa conter a aba ${CS_OPS_SHEET_NAME}.` : 'A planilha nao possui abas.' }, { status: 422 });
    }
    const csHeaderRow = sourceKey === CS_OPS_SOURCE_KEY ? parsed.rows.findIndex((row) => isCsOpsHeaderRow(row)) : 0;
    if (sourceKey === CS_OPS_SOURCE_KEY && csHeaderRow < 0) {
      return jsonResponse({ error: `A aba ${sheetName} precisa conter os cabeçalhos Cliente_ID e Nome_Plataforma.` }, { status: 422 });
    }
    const rows = rowsToObjects(parsed.rows, sourceKey === CS_OPS_SOURCE_KEY ? csHeaderRow : 0);
    if (!rows.length) return jsonResponse({ error: 'A primeira aba nao possui linhas de dados.' }, { status: 422 });
    let runId: string | null = null;
    const { data: run, error: runError } = await client.from('analytics_spreadsheet_import_runs').insert({ source_id: source.id, status: 'processing', original_filename: file.name, file_sha256: hash, file_size_bytes: file.size, mapping_version: mappingVersion, started_at: new Date().toISOString(), triggered_by_user_id: actorId }).select('id').single();
    if (runError || !run) throw new Error(runError?.message ?? 'Falha ao criar lote de importacao.');
    runId = String(run.id);

    if (sourceKey === CS_OPS_SOURCE_KEY) {
      const mapped = mapCsOpsRows(rows);
      const stagingRows = mapped.mapped.map((item) => ({
        import_run_id: run.id,
        sheet_name: sheetName,
        row_number: Number(item.payload.source_row_number),
        external_row_key: item.sourceRecordId,
        source_record_id: item.sourceRecordId,
        payload: item.payload,
        quality_status: item.qualityStatus,
        rejection_reason: item.rejectionReason,
      }));
      const { error: stagingError } = await client.from('analytics_spreadsheet_rows').insert(stagingRows);
      if (stagingError) throw new Error(stagingError.message);
      const finishedAt = new Date().toISOString();
      const { error: finishError } = await client.from('analytics_spreadsheet_import_runs').update({
        status: mapped.rejected ? 'partial' : 'completed',
        finished_at: finishedAt,
        total_rows: rows.length,
        accepted_rows: mapped.accepted,
        rejected_rows: mapped.rejected,
      }).eq('id', run.id);
      if (finishError) throw new Error(finishError.message);
      return jsonResponse({ ok: true, duplicate: false, run: { id: run.id, status: mapped.rejected ? 'partial' : 'completed', totalRows: rows.length, acceptedRows: mapped.accepted, rejectedRows: mapped.rejected, mappingVersion: mappingVersion || CS_OPS_MAPPING_VERSION } });
    }

    const mappedRows = rows.map((row, index) => {
      const status = text(find(row, 'situacao', 'situacao original', 'status')) || 'indisponivel';
      const dueDate = dateValue(find(row, 'vencimento', 'data de vencimento', 'due_date'));
      const netAmount = numberValue(find(row, 'valor', 'valor liquido', 'valor da parcela', 'net_amount'));
      const receivedAmount = numberValue(find(row, 'valor recebido', 'recebido', 'received_amount')) ?? 0;
      const explicitBalance = numberValue(find(row, 'saldo', 'saldo em aberto', 'balance'));
      const balance = Math.max(0, explicitBalance ?? ((netAmount ?? 0) - receivedAmount));
      const sourceRecordId = text(find(row, 'nota fiscal', 'nota fiscal / cupom fiscal', 'documento', 'id')) || `${sheetName}:${index + 2}`;
      const clientName = text(find(row, 'cliente', 'cliente (nome fantasia)', 'cliente nome fantasia')) || null;
      const rejectionReasons = [
        clientName ? null : 'cliente ausente',
        netAmount === null ? 'valor liquido ausente ou invalido' : null,
        status === 'indisponivel' ? 'situacao ausente' : null,
      ].filter((reason): reason is string => Boolean(reason));
      const base = { import_run_id: run.id, source_key: sourceKey, source_record_id: sourceRecordId, status_original: status, aging_bucket: agingBucket(status, dueDate), document_number: text(find(row, 'nota fiscal', 'documento')) || null, client_name: clientName, client_tax_id: text(find(row, 'cnpj', 'cpf/cnpj')) || null, net_amount: netAmount, received_amount: receivedAmount, balance, due_date: dueDate, issued_date: dateValue(find(row, 'emissao', 'data de emissao', 'issued_date')), last_received_date: dateValue(find(row, 'ultimo recebimento', 'last_received_date')), boleto_generated: /boleto/i.test(status), is_cancelled: /cancel/i.test(status), is_partial: /parcial/i.test(status), effective_at: dueDate ? `${dueDate}T00:00:00Z` : null, raw_payload: row };
      return { base, qualityStatus: rejectionReasons.length ? 'rejected' : 'valid', rejectionReason: rejectionReasons.join('; ') || null };
    });
    const financeRows = mappedRows.filter((row) => row.qualityStatus === 'valid').map((row) => row.base);
    if (financeRows.length) {
      const { error } = await client.from('analytics_finance_receivables').upsert(financeRows, { onConflict: 'source_key,source_record_id' });
      if (error) throw new Error(error.message);
      const stagingRows = mappedRows.map((mapped, index) => ({ import_run_id: run.id, sheet_name: sheetName, row_number: index + 2, source_record_id: String(mapped.base.source_record_id), payload: rows[index], quality_status: mapped.qualityStatus, rejection_reason: mapped.rejectionReason }));
      const { error: stagingError } = await client.from('analytics_spreadsheet_rows').insert(stagingRows);
      if (stagingError) throw new Error(stagingError.message);
    } else {
      const stagingRows = mappedRows.map((mapped, index) => ({ import_run_id: run.id, sheet_name: sheetName, row_number: index + 2, source_record_id: String(mapped.base.source_record_id), payload: rows[index], quality_status: mapped.qualityStatus, rejection_reason: mapped.rejectionReason }));
      const { error: stagingError } = await client.from('analytics_spreadsheet_rows').insert(stagingRows);
      if (stagingError) throw new Error(stagingError.message);
    }
    const finishedAt = new Date().toISOString();
    const rejectedRows = mappedRows.length - financeRows.length;
    const { error: finishError } = await client.from('analytics_spreadsheet_import_runs').update({ status: rejectedRows ? 'partial' : 'completed', finished_at: finishedAt, total_rows: rows.length, accepted_rows: financeRows.length, rejected_rows: rejectedRows }).eq('id', run.id);
    if (finishError) throw new Error(finishError.message);
    return jsonResponse({ ok: true, duplicate: false, run: { id: run.id, status: rejectedRows ? 'partial' : 'completed', totalRows: rows.length, acceptedRows: financeRows.length, rejectedRows } });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : 'Falha ao importar planilha.';
    if (runId) {
      await client.from('analytics_spreadsheet_import_runs').update({ status: 'failed', finished_at: new Date().toISOString(), error_message: message }).eq('id', runId);
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
});
