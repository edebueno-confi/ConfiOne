import assert from 'node:assert/strict';
import test from 'node:test';

import { parseCommercialDailySheets } from '../../scripts/analytics/commercial-daily-sheet-parser.mjs';

test('normaliza abas diarias comerciais em fatos metricos com provenance', () => {
  const result = parseCommercialDailySheets({
    spreadsheetId: 'commercial-sheet',
    mappingVersion: 'commercial_daily_v1',
    sheets: [
      {
        sheetId: 17,
        title: '17/07/2026',
        values: [
          ['Cintia'],
          ['Leads Minerados:', '9'],
          ['Msg Enviaddas:', '33'],
          ['Reuniões Agendadas:', '1', 'Ikesaki respondeu'],
        ],
      },
    ],
  });

  assert.equal(result.accepted.length, 3);
  assert.deepEqual(result.accepted[0], {
    source_system: 'google_sheets_comercial',
    source_record_id: 'commercial-sheet:17:2',
    source_sheet_id: '17',
    source_sheet_name: '17/07/2026',
    observed_at: '2026-07-17',
    operator_name: 'Cintia',
    metric_key: 'leads_minerados',
    metric_label: 'Leads Minerados',
    metric_value: 9,
    observation: null,
    mapping_version: 'commercial_daily_v1',
    quality_status: 'valid',
  });
  assert.equal(result.accepted[1].metric_key, 'mensagens_enviadas');
  assert.equal(result.accepted[2].observation, 'Ikesaki respondeu');
});

test('rejeita abas sem data e linhas com valor invalido sem fabricar metricas', () => {
  const result = parseCommercialDailySheets({
    spreadsheetId: 'commercial-sheet',
    sheets: [
      { sheetId: 18, title: 'Página18', values: [['Cintia'], ['Leads Minerados:', '9']] },
      { sheetId: 19, title: ' 16/07/2026', values: [['Cintia'], ['Hubspot:', 'não informado']] },
    ],
  });

  assert.equal(result.accepted.length, 0);
  assert.equal(result.rejected.length, 2);
  assert.match(result.rejected[0].rejection_reason, /data/i);
  assert.match(result.rejected[1].rejection_reason, /valor/i);
});
