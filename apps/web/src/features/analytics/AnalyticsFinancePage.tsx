import { useEffect, useState } from 'react';
import { MinimalState } from '../../components/minimal-states';
import { getFinanceSnapshot, getFinanceSourceStatus, listFinanceImportRuns, triggerFinanceSpreadsheetImport, triggerOmieSync, type FinanceImportRun } from './analytics-api';
import { ChartCard, KpiCard } from './analytics-ui';
import { formatCurrencyBRL, formatPercent, type AnalyticsFilters, DEFAULT_ANALYTICS_FILTERS, type FinanceSnapshot, type FinanceSourceStatus } from './analytics-model';
import { ANALYTICS_PERIOD_OPTIONS, resolveAnalyticsPeriod, type AnalyticsPeriodPreset } from './analytics-periods';
import type { AnalyticsPageProps } from './analytics-model';

const STATUS_OPTIONS = ['Recebido', 'Vence hoje (boleto gerado)', 'Atrasado', 'A vencer (boleto gerado)', 'Recebido (cancelado)', 'Cancelado', 'Atrasado (boleto gerado)', 'Recebido Parcialmente'];
const AGING_OPTIONS = [
  ['recebido', 'Recebido'], ['atrasado', 'Atrasado'], ['vence_hoje', 'Vence hoje'],
  ['a_vencer', 'A vencer'], ['cancelado', 'Cancelado'], ['recebido_parcialmente', 'Recebido parcialmente'],
];

type FinanceFilters = AnalyticsFilters & { clientQuery: string };

export function AnalyticsFinancePage({ sharedPeriod, onSharedPeriodChange }: AnalyticsPageProps) {
  const period = sharedPeriod ?? resolveAnalyticsPeriod('month');
  const [filters, setFilters] = useState<FinanceFilters>({ ...DEFAULT_ANALYTICS_FILTERS, ...period, clientQuery: '' });
  const [draft, setDraft] = useState(filters);
  const [state, setState] = useState<{ phase: 'loading' } | { phase: 'ready'; snapshot: FinanceSnapshot } | { phase: 'error'; message: string }>({ phase: 'loading' });
  const [imports, setImports] = useState<FinanceImportRun[]>([]);
  const [sourceStatus, setSourceStatus] = useState<FinanceSourceStatus | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [syncingOmie, setSyncingOmie] = useState(false);
  const [preset, setPreset] = useState<AnalyticsPeriodPreset | ''>('month');

  useEffect(() => { setFilters((current) => ({ ...current, ...period })); setDraft((current) => ({ ...current, ...period })); }, [period.from, period.to]);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: 'loading' });
    getFinanceSnapshot(filters, filters.clientQuery)
      .then((snapshot) => { if (!cancelled) setState({ phase: 'ready', snapshot }); })
      .catch((error) => { if (!cancelled) setState({ phase: 'error', message: error instanceof Error ? error.message : 'Falha ao carregar o financeiro.' }); });
    return () => { cancelled = true; };
  }, [filters]);

  useEffect(() => { listFinanceImportRuns().then(setImports).catch(() => setImports([])); getFinanceSourceStatus().then(setSourceStatus).catch(() => setSourceStatus(null)); }, []);

  const importFile = async () => {
    if (!file) return;
    setImporting(true);
    setImportMessage(null);
    try {
      await triggerFinanceSpreadsheetImport(file);
      setImportMessage('Importacao concluida. O historico financeiro foi atualizado.');
      setFile(null);
      setImports(await listFinanceImportRuns());
      setFilters((current) => ({ ...current }));
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Falha ao importar a planilha.');
    } finally { setImporting(false); }
  };

  const syncOmie = async () => {
    setSyncingOmie(true); setImportMessage(null);
    try { const result = await triggerOmieSync(); setImportMessage(`Sincronização OMIE concluída: ${result.acceptedRows.toLocaleString('pt-BR')} títulos recebidos pela API.`); setSourceStatus(await getFinanceSourceStatus()); setFilters((current) => ({ ...current })); }
    catch (error) { setImportMessage(error instanceof Error ? error.message : 'Falha ao sincronizar o OMIE.'); }
    finally { setSyncingOmie(false); }
  };

  const apply = () => {
    if (draft.from && draft.to && draft.from > draft.to) return;
    setFilters(draft);
    onSharedPeriodChange?.({ from: draft.from, to: draft.to });
  };
  const applyPreset = (nextPreset: AnalyticsPeriodPreset) => {
    setPreset(nextPreset);
    const period = resolveAnalyticsPeriod(nextPreset);
    const next = { ...draft, ...period };
    setDraft(next);
    setFilters(next);
    onSharedPeriodChange?.(period);
  };

  if (state.phase === 'loading') return <MinimalState title="Carregando financeiro" description="Consultando Contas a Receber persistidas." />;
  if (state.phase === 'error') return <MinimalState tone="critical" title="Nao foi possivel carregar" description={state.message} />;
  const { snapshot } = state;
  const { kpis } = snapshot;

  return <div className="space-y-5">
    <section className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-sm font-semibold text-[color:var(--minimal-text)]">Atualizar fonte financeira</h2><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">Importe um XLSX/CSV exportado do OMIE. O lote é idempotente e não apaga o histórico.</p></div>
        <div className="flex flex-wrap items-center gap-2"><input accept=".csv,.xlsx" aria-label="Arquivo financeiro OMIE" className="max-w-[260px] text-xs text-[color:var(--minimal-text-secondary)]" onChange={(event) => setFile(event.target.files?.[0] ?? null)} type="file" /><button type="button" disabled={!file || importing} onClick={() => void importFile()} className="rounded-lg bg-[color:var(--minimal-text)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-surface)] disabled:opacity-50">{importing ? 'Importando...' : 'Importar arquivo'}</button><button type="button" disabled={syncingOmie || !sourceStatus?.api.configured} onClick={() => void syncOmie()} className="rounded-lg border border-[color:var(--minimal-action)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-action)] disabled:opacity-50">{syncingOmie ? 'Sincronizando...' : 'Sincronizar OMIE API'}</button></div>
      </div>
      {sourceStatus ? <div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-3 text-xs"><div className="font-semibold text-[color:var(--minimal-text)]">API OMIE · {sourceStatus.api.configured ? 'configurada' : 'aguardando chave'}</div><p className="mt-1 text-[color:var(--minimal-text-secondary)]">{sourceStatus.api.configured ? `Última sincronização: ${sourceStatus.api.lastSyncAt ? new Date(sourceStatus.api.lastSyncAt).toLocaleString('pt-BR') : 'ainda não executada'}.` : sourceStatus.api.fallback}</p><div className="mt-2 flex flex-wrap gap-1">{sourceStatus.api.metrics.map((metric) => <span key={metric} className="rounded-full bg-[color:var(--minimal-surface)] px-2 py-1 text-[11px] text-[color:var(--minimal-text-secondary)]">{metric}</span>)}</div></div><div className="rounded-lg border border-[color:var(--minimal-border)] p-3 text-xs"><div className="font-semibold text-[color:var(--minimal-text)]">Fallback atual · planilha OMIE</div><p className="mt-1 text-[color:var(--minimal-text-secondary)]">{sourceStatus.spreadsheet.available ? `Disponível; última carga: ${sourceStatus.spreadsheet.lastImportAt ? new Date(sourceStatus.spreadsheet.lastImportAt).toLocaleString('pt-BR') : 'indisponível'}.` : 'Nenhuma carga financeira disponível.'}</p></div></div> : null}
      {importMessage ? <p className="mt-3 text-xs text-[color:var(--minimal-text-secondary)]">{importMessage}</p> : null}
      {imports.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-xs"><thead><tr className="border-b border-[color:var(--minimal-border)] text-left text-[color:var(--minimal-text-tertiary)]"><th className="py-2">Arquivo</th><th className="py-2">Status</th><th className="py-2 text-right">Linhas</th><th className="py-2 text-right">Recebido em</th></tr></thead><tbody>{imports.map((item) => <tr key={item.id} className="border-b border-[color:var(--minimal-border)] last:border-0"><td className="py-2">{item.originalFilename}</td><td className="py-2">{item.status}</td><td className="py-2 text-right">{item.acceptedRows}/{item.totalRows}</td><td className="py-2 text-right">{new Date(item.createdAt).toLocaleString('pt-BR')}</td></tr>)}</tbody></table></div> : null}
    </section>
    <section className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] p-4">
      <div className="grid gap-3 md:grid-cols-5">
        <label className="text-xs text-[color:var(--minimal-text-secondary)]">Período<select value={preset} onChange={(e) => applyPreset(e.target.value as AnalyticsPeriodPreset)} className="mt-1 block w-full rounded-lg border border-[color:var(--minimal-border-strong)] bg-transparent px-2 py-1.5 text-sm text-[color:var(--minimal-text)]"><option value="">Personalizado</option>{ANALYTICS_PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="text-xs text-[color:var(--minimal-text-secondary)]">De<input type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} className="mt-1 block w-full rounded-lg border border-[color:var(--minimal-border-strong)] bg-transparent px-2 py-1.5 text-sm text-[color:var(--minimal-text)]" /></label>
        <label className="text-xs text-[color:var(--minimal-text-secondary)]">Até<input type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} className="mt-1 block w-full rounded-lg border border-[color:var(--minimal-border-strong)] bg-transparent px-2 py-1.5 text-sm text-[color:var(--minimal-text)]" /></label>
        <label className="text-xs text-[color:var(--minimal-text-secondary)]">Situação<select value={draft.stageId} onChange={(e) => setDraft({ ...draft, stageId: e.target.value })} className="mt-1 block w-full rounded-lg border border-[color:var(--minimal-border-strong)] bg-transparent px-2 py-1.5 text-sm text-[color:var(--minimal-text)]"><option value="">Todas</option>{STATUS_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="text-xs text-[color:var(--minimal-text-secondary)]">Aging<select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })} className="mt-1 block w-full rounded-lg border border-[color:var(--minimal-border-strong)] bg-transparent px-2 py-1.5 text-sm text-[color:var(--minimal-text)]"><option value="">Todos</option>{AGING_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-xs text-[color:var(--minimal-text-secondary)]">Cliente<input value={draft.clientQuery} onChange={(e) => setDraft({ ...draft, clientQuery: e.target.value })} placeholder="Nome ou parte do nome" className="mt-1 block w-full rounded-lg border border-[color:var(--minimal-border-strong)] bg-transparent px-2 py-1.5 text-sm text-[color:var(--minimal-text)]" /></label>
      </div>
      <div className="mt-3 flex gap-2"><button type="button" onClick={apply} className="rounded-lg bg-[color:var(--minimal-text)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-surface)]">Aplicar</button><button type="button" onClick={() => { const next = { ...DEFAULT_ANALYTICS_FILTERS, ...resolveAnalyticsPeriod('month'), clientQuery: '' }; setPreset('month'); setDraft(next); setFilters(next); onSharedPeriodChange?.({ from: next.from, to: next.to }); }} className="rounded-lg border border-[color:var(--minimal-border-strong)] px-3 py-1.5 text-sm text-[color:var(--minimal-text)]">Limpar</button></div>
      <p className="mt-3 text-xs text-[color:var(--minimal-text-tertiary)]">O histórico permanece armazenado; os filtros alteram apenas a leitura desta análise.</p>
    </section>
    {kpis.totalTitles === 0 ? <MinimalState title="Nenhum dado financeiro neste recorte" description="Importe uma planilha Omie ou configure a API read-only para preencher este read model." /> : <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><KpiCard label="Títulos" value={kpis.totalTitles.toLocaleString('pt-BR')} hint="Contas a receber" /><KpiCard label="Valor líquido" value={formatCurrencyBRL(kpis.netAmount)} hint="Fonte financeira" /><KpiCard label="Recebido" value={formatCurrencyBRL(kpis.receivedAmount)} hint={`${formatPercent(kpis.receivedRate)} do valor líquido`} /><KpiCard label="Saldo em aberto" value={formatCurrencyBRL(kpis.balance)} hint={`${kpis.overdueTitles} em atraso`} /></div>
      <div className="grid gap-4 xl:grid-cols-2"><Breakdown title="Por situação" rows={snapshot.byStatus} /><Breakdown title="Por aging" rows={snapshot.byAging} /></div>
      <ChartCard title="Tendência mensal" description="Saldo em aberto por mês de vencimento ou emissão"><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead><tr className="border-b border-[color:var(--minimal-border)] text-left text-xs text-[color:var(--minimal-text-tertiary)]"><th className="py-2">Mês</th><th className="py-2 text-right">Títulos</th><th className="py-2 text-right">Saldo</th></tr></thead><tbody>{snapshot.monthly.map((row) => <tr key={row.month} className="border-b border-[color:var(--minimal-border)] last:border-0"><td className="py-2">{row.month}</td><td className="py-2 text-right">{row.titles.toLocaleString('pt-BR')}</td><td className="py-2 text-right">{formatCurrencyBRL(row.balance)}</td></tr>)}</tbody></table></div></ChartCard>
    </>}
  </div>;
}

function Breakdown({ title, rows }: { title: string; rows: { key: string; titles: number; balance: number }[] }) {
  return <ChartCard title={title} description="Distribuição calculada no backend"><div className="space-y-2">{rows.map((row) => <div key={row.key} className="flex items-center justify-between gap-3 border-b border-[color:var(--minimal-border)] pb-2 text-sm last:border-0"><span>{row.key}</span><span className="text-right tabular-nums">{row.titles.toLocaleString('pt-BR')} · {formatCurrencyBRL(row.balance)}</span></div>)}</div></ChartCard>;
}
