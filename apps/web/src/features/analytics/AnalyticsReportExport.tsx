import { useEffect, useMemo, useState } from 'react';
import { getCeoSnapshot, getCommercialSnapshot, getCsSnapshot, getFinanceSnapshot } from './analytics-api';
import { formatCommercialConversionRate, formatCurrencyBRL, type AnalyticsFilters } from './analytics-model';
import { downloadAnalyticsPng, hasExportableAnalyticsData, printAnalyticsReport, type AnalyticsReportData, type AnalyticsReportSection } from './analytics-export';

type ReportPayload = Pick<AnalyticsReportData, 'ceo' | 'commercial' | 'cs' | 'finance'>;
type Props = { open: boolean; period: { from: string; to: string }; groupCompany?: string; onClose: () => void };
const OPTIONS: Array<{ key: AnalyticsReportSection; label: string; description: string }> = [
  { key: 'ceo', label: 'Visão executiva', description: 'Resumo de receita, conversão, risco financeiro e tickets.' },
  { key: 'commercial', label: 'Comercial', description: 'Funil e KPIs do período.' },
  { key: 'cs', label: 'CS / Suporte', description: 'Volume, abertura e encerramento de tickets.' },
  { key: 'finance', label: 'Financeiro', description: 'Contas a receber, saldo e vencidos.' },
];

export function AnalyticsReportExport({ open, period, groupCompany = '', onClose }: Props) {
  const [selected, setSelected] = useState<AnalyticsReportSection[]>(['ceo', 'commercial', 'cs', 'finance']);
  const [payload, setPayload] = useState<ReportPayload>({});
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState('');
  const filters: AnalyticsFilters = useMemo(() => ({ from: period.from, to: period.to, ownerId: '', stageId: '', priority: '' }), [period.from, period.to]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState('loading');
    setError('');
    Promise.all([
      groupCompany ? Promise.resolve(undefined) : getCeoSnapshot(filters),
      getCommercialSnapshot(filters, [], groupCompany || null),
      getCsSnapshot(filters, [], groupCompany || null),
      groupCompany ? Promise.resolve(undefined) : getFinanceSnapshot(filters),
    ])
      .then(([ceo, commercial, cs, finance]) => { if (!cancelled) { setPayload({ ceo, commercial, cs, finance }); setState('ready'); } })
      .catch((reason) => { if (!cancelled) { setState('error'); setError(reason instanceof Error ? reason.message : 'Não foi possível preparar o relatório.'); } });
    return () => { cancelled = true; };
  }, [filters, groupCompany, open]);

  if (!open) return null;
  const data: AnalyticsReportData = { ...payload, from: period.from, to: period.to, selected };
  const hasExportableData = state === 'ready' && hasExportableAnalyticsData(data);
  const toggle = (key: AnalyticsReportSection) => setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  const handlePrint = () => { if (!selected.length || !hasExportableData) return; if (!printAnalyticsReport(data)) setError('O navegador bloqueou a janela do relatório. Permita pop-ups para gerar o PDF.'); };
  const handlePng = async () => { if (!selected.length || !hasExportableData) return; try { await downloadAnalyticsPng(data); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível gerar o PNG.'); } };
  const ceo = payload.ceo;
  const commercial = payload.commercial;
  const cs = payload.cs;
  const finance = payload.finance;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--minimal-overlay)] p-4" role="dialog" aria-modal="true" aria-labelledby="analytics-report-title">
    <section className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] p-5 shadow-[var(--minimal-shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--minimal-action)]">Exportação visual</p><h2 id="analytics-report-title" className="mt-1 text-lg font-semibold text-[color:var(--minimal-text)]">Montar relatório gerencial</h2><p className="mt-1 text-sm text-[color:var(--minimal-text-secondary)]">Escolha as abas. O PDF abre um documento próprio, sem menu ou shell do sistema.</p>{groupCompany ? <p className="mt-2 text-xs text-[color:var(--minimal-warning-text)]">Recorte de operação ativo: Visão executiva e Financeiro não são exportados porque não publicam essa dimensão.</p> : null}</div><button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)]">Fechar</button></div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">{OPTIONS.map((option) => <label key={option.key} className="flex cursor-pointer gap-3 rounded-lg border border-[color:var(--minimal-border)] p-3 hover:bg-[color:var(--minimal-surface-muted)]"><input type="checkbox" checked={selected.includes(option.key)} onChange={() => toggle(option.key)} className="mt-1" /><span><span className="block text-sm font-medium text-[color:var(--minimal-text)]">{option.label}</span><span className="mt-1 block text-xs text-[color:var(--minimal-text-secondary)]">{option.description}</span></span></label>)}</div>
      <div className="mt-4 rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-3"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]">Prévia · {period.from || 'início'} a {period.to || 'fim'}</div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Preview label="Receita ganha" value={ceo ? formatCurrencyBRL(ceo.commercial.wonRevenue) : commercial ? formatCurrencyBRL(commercial.kpis.wonRevenue) : '—'} /><Preview label="Conversão" value={commercial ? formatCommercialConversionRate(commercial.kpis.conversionRate) : '—'} /><Preview label="Tickets abertos" value={cs ? cs.kpis.openTickets.toLocaleString('pt-BR') : '—'} /><Preview label="Saldo vencido" value={finance ? formatCurrencyBRL(finance.kpis.overdueBalance) : ceo ? formatCurrencyBRL(ceo.finance.overdueBalance) : '—'} /></div></div>
      {state === 'loading' ? <p className="mt-4 text-sm text-[color:var(--minimal-text-secondary)]">Preparando dados das abas...</p> : null}
      {state === 'error' ? <p role="alert" className="mt-4 text-sm text-[color:var(--minimal-danger-text)]">{error}</p> : null}
      {state === 'ready' && selected.length > 0 && !hasExportableData ? <p role="status" className="mt-4 text-sm text-[color:var(--minimal-text-secondary)]">Não há dados exportáveis nas abas selecionadas.</p> : null}
      {error && state !== 'error' ? <p role="alert" className="mt-4 text-sm text-[color:var(--minimal-danger-text)]">{error}</p> : null}
      <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={handlePng} disabled={!hasExportableData || !selected.length} title={!hasExportableData ? 'Não há dados exportáveis nas abas selecionadas.' : undefined} className="rounded-md border border-[color:var(--minimal-border-strong)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-text)] disabled:cursor-not-allowed disabled:opacity-50">Baixar PNG</button><button type="button" onClick={handlePrint} disabled={!hasExportableData || !selected.length} title={!hasExportableData ? 'Não há dados exportáveis nas abas selecionadas.' : undefined} className="rounded-md bg-[color:var(--minimal-text)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-surface)] disabled:cursor-not-allowed disabled:opacity-50">Gerar PDF</button></div>
    </section>
  </div>;
}

function Preview({ label, value }: { label: string; value: string }) { return <div className="rounded-md border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] p-2.5"><div className="text-xs text-[color:var(--minimal-text-secondary)]">{label}</div><div className="mt-1 font-semibold tabular-nums text-[color:var(--minimal-text)]">{value}</div></div>; }
