-- Fontes controladas para importação manual. Os mapeamentos específicos de CS e
-- Comercial ficam cadastrados desde já, mas só o Omie V1 publica métricas.
insert into public.analytics_spreadsheet_sources (source_key, label, source_type, mapping_version, is_active)
values
  ('omie_receivables_xlsx_20260622', 'Omie Contas a Receber XLSX', 'xlsx', 'omie-receivables-v1', true),
  ('cs_ops_consolidated', 'Planilha CS consolidada', 'xlsx', 'cs-ops-v1', true),
  ('commercial_daily_tabs', 'Planilha Comercial por abas diárias', 'xlsx', 'commercial-daily-v1', true)
on conflict (source_key) do update
set label = excluded.label,
    source_type = excluded.source_type,
    mapping_version = excluded.mapping_version,
    is_active = excluded.is_active;
