const METRIC_ALIASES = new Map([
  ['leads minerados', 'leads_minerados'],
  ['conexoes linkedin', 'conexoes_linkedin'],
  ['e mails enviados', 'emails_enviados'],
  ['emails enviados', 'emails_enviados'],
  ['msg enviaddas', 'mensagens_enviadas'],
  ['msg enviadas', 'mensagens_enviadas'],
  ['mensagens enviadas', 'mensagens_enviadas'],
  ['ligacoes', 'ligacoes'],
  ['fup', 'fup'],
  ['reunioes agendadas', 'reunioes_agendadas'],
  ['demos realizadas', 'demos_realizadas'],
  ['propostas enviadas', 'propostas_enviadas'],
  ['hubspot', 'hubspot'],
  ['agendas extra comercial', 'agendas_extra_comercial'],
  ['stand by', 'stand_by'],
]);

function cleanText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeMetricLabel(value) {
  return cleanText(value)
    .replace(/:+$/, '')
    .toLowerCase();
}

function parseSheetDate(title) {
  const match = cleanText(title).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const rawYear = Number(match[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function parseMetricValue(value) {
  const text = cleanText(value);
  if (!text) return null;

  const normalized = text.includes(',')
    ? text.replace(/\./g, '').replace(',', '.')
    : text.replace(/\s/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function rejected(sheet, rowNumber, reason) {
  return {
    source_sheet_id: String(sheet.sheetId ?? ''),
    source_sheet_name: cleanText(sheet.title),
    row_number: rowNumber,
    rejection_reason: reason,
    quality_status: 'rejected',
  };
}

export function parseCommercialDailySheets({
  spreadsheetId,
  mappingVersion = 'commercial_daily_v1',
  sheets = [],
}) {
  const accepted = [];
  const rejectedRows = [];

  for (const sheet of sheets) {
    const observedAt = parseSheetDate(sheet.title);
    if (!observedAt) {
      rejectedRows.push(rejected(sheet, 0, 'aba sem data operacional reconhecivel'));
      continue;
    }

    const values = Array.isArray(sheet.values) ? sheet.values : [];
    const operatorName = cleanText(values[0]?.[0]) || null;

    values.forEach((row, index) => {
      if (index === 0 || !Array.isArray(row) || row.length === 0) return;

      const rawLabel = cleanText(row[0]);
      const metricLabel = rawLabel.replace(/:+$/, '').trim();
      const metricKey = METRIC_ALIASES.get(normalizeMetricLabel(rawLabel));
      if (!metricKey) return;

      const metricValue = parseMetricValue(row[1]);
      if (metricValue === null) {
        rejectedRows.push(rejected(sheet, index + 1, `valor invalido para ${metricLabel}`));
        return;
      }

      const observation = row
        .slice(2)
        .map(cleanText)
        .filter(Boolean)
        .join(' | ') || null;

      accepted.push({
        source_system: 'google_sheets_comercial',
        source_record_id: `${spreadsheetId}:${sheet.sheetId}:${index + 1}`,
        source_sheet_id: String(sheet.sheetId ?? ''),
        source_sheet_name: cleanText(sheet.title),
        observed_at: observedAt,
        operator_name: operatorName,
        metric_key: metricKey,
        metric_label: metricLabel,
        metric_value: metricValue,
        observation,
        mapping_version: mappingVersion,
        quality_status: 'valid',
      });
    });
  }

  const deduped = Array.from(
    new Map(accepted.map((row) => [row.source_record_id, row])).values(),
  );

  return {
    accepted: deduped,
    rejected: rejectedRows,
    summary: {
      total: deduped.length + rejectedRows.length,
      accepted: deduped.length,
      rejected: rejectedRows.length,
    },
  };
}
