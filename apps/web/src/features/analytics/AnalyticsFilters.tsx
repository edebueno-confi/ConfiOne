import { useEffect, useState, type ReactNode } from 'react';
import type { AnalyticsFilters } from './analytics-model';
import { ANALYTICS_PERIOD_OPTIONS, matchAnalyticsPeriodPreset, resolveAnalyticsPeriod, type AnalyticsPeriodPreset } from './analytics-periods';

interface Option { value: string; label: string }

export function AnalyticsFilters({ value, onApply, stageOptions, ownerOptions = [], priorityOptions = [], stageLabel = 'Estágio' }: { value: AnalyticsFilters; onApply: (next: AnalyticsFilters) => void; stageOptions: Option[]; ownerOptions?: Option[]; priorityOptions?: Option[]; stageLabel?: string }) {
  const [draft, setDraft] = useState(value);
  const [validation, setValidation] = useState<string | null>(null);
  const [preset, setPreset] = useState<AnalyticsPeriodPreset | ''>(() => matchAnalyticsPeriodPreset(value));
  useEffect(() => { setDraft(value); setPreset(matchAnalyticsPeriodPreset(value)); }, [value]);
  const update = (key: keyof AnalyticsFilters, next: string) => setDraft((current) => ({ ...current, [key]: next }));
  const apply = () => { if (draft.from && draft.to && draft.from > draft.to) { setValidation('A data inicial precisa ser anterior ou igual à data final.'); return; } setValidation(null); onApply(draft); };
  const clear = () => { const next = { from: '', to: '', ownerId: '', stageId: '', priority: '' }; setDraft(next); setValidation(null); onApply(next); };
  const applyPreset = (nextPreset: AnalyticsPeriodPreset) => { setPreset(nextPreset); const period = resolveAnalyticsPeriod(nextPreset); setDraft((current) => ({ ...current, ...period })); setValidation(null); onApply({ ...draft, ...period }); };
  const controlClass = 'h-9 rounded-md border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2.5 text-sm font-normal text-[color:var(--minimal-text)] outline-none transition focus:border-[color:var(--minimal-text-secondary)] focus:ring-2 focus:ring-[color:var(--minimal-border-strong)]';
  return <section className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-4 py-3.5" aria-label="Filtros da análise">
    <div className="flex flex-wrap items-end gap-3">
      <FilterField label="Período"><select value={preset} onChange={(event) => applyPreset(event.target.value as AnalyticsPeriodPreset)} className={controlClass}><option value="">Personalizado</option>{ANALYTICS_PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FilterField>
      <FilterField label="De"><input type="date" value={draft.from} onChange={(event) => update('from', event.target.value)} className={controlClass} /></FilterField>
      <FilterField label="Até"><input type="date" value={draft.to} onChange={(event) => update('to', event.target.value)} className={controlClass} /></FilterField>
      {ownerOptions.length > 0 ? <FilterField label="Responsável"><select value={draft.ownerId} onChange={(event) => update('ownerId', event.target.value)} className={`${controlClass} max-w-52`}><option value="">Todos</option>{ownerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FilterField> : null}
      {stageOptions.length > 0 ? <FilterField label={stageLabel}><select value={draft.stageId} onChange={(event) => update('stageId', event.target.value)} className={`${controlClass} max-w-52`}><option value="">Todos</option>{stageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FilterField> : null}
      {priorityOptions.length > 0 ? <FilterField label="Prioridade"><select value={draft.priority} onChange={(event) => update('priority', event.target.value)} className={controlClass}><option value="">Todas</option>{priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FilterField> : null}
      <div className="flex items-center gap-2"><button type="button" onClick={apply} className="h-9 rounded-md bg-[color:var(--minimal-text)] px-3 text-sm font-medium text-[color:var(--minimal-surface)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-border-strong)]">Aplicar</button><button type="button" onClick={clear} className="h-9 rounded-md border border-[color:var(--minimal-border-strong)] px-3 text-sm text-[color:var(--minimal-text)] transition hover:bg-[color:var(--minimal-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-border-strong)]">Limpar</button></div>
    </div>
    <p className="mt-2.5 text-xs text-[color:var(--minimal-text-tertiary)]">O histórico permanece armazenado; os filtros alteram apenas a leitura desta análise.</p>
    {validation ? <p role="alert" className="mt-1 text-xs text-[color:var(--minimal-danger-text)]">{validation}</p> : null}
  </section>;
}

function FilterField({ label, children }: { label: string; children: ReactNode }) { return <label className="flex flex-col gap-1.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]">{label}{children}</label>; }
