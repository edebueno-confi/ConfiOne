import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { MetricInfo } from './analytics-ui';

export interface AnalyticsPipelineFilterOption {
  id: string;
  pipelineId: string;
  label: string;
  hubspotLabel?: string | null;
  count: number;
  info?: ReactNode;
}

export function AnalyticsPipelineFilter({ pipelines, excludedPipelineIds, onChange, noun }: {
  pipelines: AnalyticsPipelineFilterOption[];
  excludedPipelineIds: string[];
  onChange: (next: string[]) => void;
  noun: string;
}) {
  const [open, setOpen] = useState(false);
  const includedCount = pipelines.length - excludedPipelineIds.length;
  const allIncluded = excludedPipelineIds.length === 0;
  const selectedLabel = allIncluded ? 'Todos os pipelines' : `${includedCount} de ${pipelines.length} selecionados`;
  const excluded = useMemo(() => new Set(excludedPipelineIds), [excludedPipelineIds]);
  const toggle = (pipelineId: string) => onChange(excluded.has(pipelineId) ? excludedPipelineIds.filter((id) => id !== pipelineId) : [...excludedPipelineIds, pipelineId]);

  return <div className="relative min-w-0 sm:min-w-[18rem]" data-testid="analytics-pipeline-filter">
    <div className="flex items-end gap-2">
      <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]" htmlFor="analytics-pipeline-scope">
        Filtro rápido · Pipeline
        <button id="analytics-pipeline-scope" type="button" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((current) => !current)} className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] px-2.5 text-left text-sm font-normal text-[color:var(--minimal-text)] outline-none transition hover:border-[color:var(--minimal-border-hover)] focus-visible:ring-2 focus-visible:ring-[color:var(--focus)]">
          <span className="truncate">{selectedLabel}</span><span aria-hidden="true" className="text-xs text-[color:var(--minimal-text-tertiary)]">⌄</span>
        </button>
      </label>
      <MetricInfo ariaLabel="Como o filtro de pipeline funciona" text={`O recorte considera ${noun} somente nos pipelines selecionados. A configuração persistida não é alterada.`} />
    </div>
    {open ? <div className="absolute right-0 top-[calc(100%+0.35rem)] z-30 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] p-1.5 shadow-lg" role="listbox" aria-label="Pipelines disponíveis">
      <button type="button" onClick={() => onChange([])} className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-semibold text-[color:var(--minimal-text)] hover:bg-[color:var(--minimal-surface-muted)]"><span className={`flex h-4 w-4 items-center justify-center rounded border ${allIncluded ? 'border-[color:var(--minimal-action)] bg-[color:var(--minimal-action)] text-[color:var(--minimal-action-ink)]' : 'border-[color:var(--minimal-border-strong)]'}`} aria-hidden="true">{allIncluded ? '✓' : ''}</span>Todos os pipelines</button>
      <div className="my-1 border-t border-[color:var(--minimal-border)]" />
      <div className="max-h-64 space-y-0.5 overflow-y-auto">{pipelines.map((pipeline) => { const included = !excluded.has(pipeline.pipelineId); return <div key={pipeline.id} role="option" aria-selected={included} tabIndex={0} onClick={() => toggle(pipeline.pipelineId)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(pipeline.pipelineId); } }} className={`flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition hover:bg-[color:var(--minimal-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)] ${included ? 'text-[color:var(--minimal-text)]' : 'text-[color:var(--minimal-text-tertiary)]'}`}><span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${included ? 'border-[color:var(--minimal-action)] bg-[color:var(--minimal-action)] text-[color:var(--minimal-action-ink)]' : 'border-[color:var(--minimal-border-strong)]'}`} aria-hidden="true">{included ? '✓' : ''}</span><span className="min-w-0 flex-1"><span className="block truncate font-medium">{pipeline.label}</span><span className="block truncate text-[10px] opacity-70">{pipeline.hubspotLabel || 'HubSpot: aguardando sincronização'}</span></span><span className="shrink-0 tabular-nums text-[10px] opacity-70">{pipeline.count.toLocaleString('pt-BR')}</span>{pipeline.info ? <MetricInfo ariaLabel={`Origem do pipeline ${pipeline.label}`} content={pipeline.info} /> : null}</div>; })}</div>
      {excludedPipelineIds.length > 0 ? <button type="button" onClick={() => onChange([])} className="mt-1 w-full rounded-md border border-[color:var(--minimal-border-strong)] px-2.5 py-2 text-xs font-medium text-[color:var(--minimal-text)] hover:bg-[color:var(--minimal-surface-muted)]">Incluir todos</button> : null}
    </div> : null}
  </div>;
}
