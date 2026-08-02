import type { ReactNode } from 'react';
import { GeniusMascot } from '../../components/GeniusMascot';
import type { AnalyticsBlockState, AnalyticsDataStatus } from '@genius-support-os/contracts';

const STATUS_LABELS: Record<AnalyticsDataStatus, string> = {
  fresh: 'Atualizado',
  stale: 'Pode estar desatualizado',
  partial: 'Dados parciais',
  never_synced: 'Sincronização ainda não realizada',
  empty: 'Nenhum registro no recorte',
  zero: 'Zero real no recorte',
  not_configured: 'Fonte indisponível',
  syncing: 'Sincronizando',
  unavailable: 'Fonte indisponível',
  failed: 'Falha na sincronização',
  error: 'Falha na sincronização',
  unavailable_source: 'Fonte indisponível',
  unavailable_contract: 'Contrato indisponível',
  unavailable_period: 'Período indisponível',
};

function formatStateDate(value: string | null): string {
  if (!value) return 'sincronização não registrada';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'sincronização não registrada' : `última atualização ${date.toLocaleString('pt-BR')}`;
}

export function AnalyticsStateBadge({ state }: { state?: AnalyticsBlockState }) {
  if (!state) return null;
  const tone = state.status === 'fresh' || state.status === 'zero' ? 'text-[color:var(--minimal-action)]' : state.status === 'stale' || state.status === 'partial' || state.status === 'never_synced' || state.status === 'syncing' ? 'text-[color:var(--minimal-warning-text)]' : 'text-[color:var(--minimal-danger-text)]';
  const statusLabel = STATUS_LABELS[state.status];
  const dateLabel = state.status === 'fresh' || state.status === 'stale' || state.status === 'partial' ? formatStateDate(state.lastSuccessfulSyncAt) : state.status === 'syncing' ? 'execução em andamento' : '';
  return <span className={`inline-flex flex-wrap items-center gap-1 text-[11px] ${tone}`} aria-label={`Estado dos dados: ${statusLabel}`}>
    <span className="font-semibold">{statusLabel}</span>
    {dateLabel ? <><span aria-hidden="true">·</span><span>{dateLabel}</span></> : null}
    {state.coverage.expected != null && state.coverage.received != null ? <span>· cobertura {state.coverage.received}/{state.coverage.expected}</span> : null}
  </span>;
}

export function formatCountLabel(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${count.toLocaleString('pt-BR')} ${count === 1 ? singular : plural}`;
}

export function AnalyticsLoadingState({ title, description }: { title: string; description: string }) {
  return (
    <section aria-busy="true" aria-label={title} className="flex min-h-[170px] flex-col items-center justify-center gap-3 px-4 py-5 text-center sm:min-h-[240px]" role="status">
      <div className="flex h-36 w-36 items-center justify-center sm:h-44 sm:w-44">
        <div className="scale-[0.7] sm:scale-[0.9]">
          <GeniusMascot alt="Gênio consultando os dados do Dashboard" expression="happy" pose="magic" size="xl" surface="loading" />
        </div>
      </div>
      <div className="max-w-md">
        <h2 className="text-base font-semibold text-[color:var(--minimal-text)]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[color:var(--minimal-text-secondary)]">{description}</p>
      </div>
    </section>
  );
}

export function AnalyticsRetryAction({ onRetry }: { onRetry?: () => void }) {
  return onRetry ? <button type="button" onClick={onRetry} className="rounded-lg bg-[color:var(--minimal-text)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-surface)]">Tentar novamente</button> : null;
}

export function KpiCard({ label, value, hint, source, tone = 'neutral', className = '', state, temporalType, comparison }: { label: string; value: string; hint?: string; source?: string; tone?: 'neutral' | 'warning' | 'critical'; className?: string; state?: AnalyticsBlockState; temporalType?: string; comparison?: string }) {
  const toneClass = tone === 'critical' ? 'border-[color:var(--minimal-danger-border)] bg-[color:var(--minimal-danger-surface)]' : tone === 'warning' ? 'border-[color:var(--minimal-warning-border)] bg-[color:var(--minimal-warning-surface)]' : 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)]';
  const valueClass = tone === 'critical' ? 'text-[color:var(--minimal-danger-text)]' : tone === 'warning' ? 'text-[color:var(--minimal-warning-text)]' : 'text-[color:var(--minimal-text)]';
  return <div className={`rounded-xl border px-4 py-3.5 ${toneClass} ${className}`}>
    <p className={`text-2xl font-semibold tabular-nums leading-none ${valueClass}`}>{value}</p>
    <div className="mt-2.5 flex items-center gap-1.5"><p className={`text-sm font-medium ${valueClass}`}>{label}</p>{source ? <MetricInfo text={source} /> : null}</div>
    {hint ? <p className="mt-0.5 text-xs text-[color:var(--minimal-text-tertiary)]">{hint}</p> : null}
    {comparison ? <p className="mt-1 text-xs font-medium text-[color:var(--minimal-action)]">{comparison}</p> : null}
    {temporalType ? <p className="mt-2 text-[11px] text-[color:var(--minimal-text-secondary)]">{temporalType}</p> : null}
    <div className="mt-1"><AnalyticsStateBadge state={state} /></div>
  </div>;
}

export function MetricInfo({ text, content, ariaLabel = 'Como esta métrica é calculada' }: { text?: string; content?: ReactNode; ariaLabel?: string }) {
  const tooltip = content ?? text;
  return <span className="group relative inline-flex"><button type="button" aria-label={ariaLabel} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[color:var(--minimal-border-strong)] text-xs font-semibold text-[color:var(--minimal-text-secondary)] transition hover:bg-[color:var(--minimal-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-border-strong)]" title={typeof tooltip === 'string' ? tooltip : undefined}>i</button><span role="tooltip" className="pointer-events-none absolute left-7 top-0 z-20 hidden w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] p-3 text-xs font-normal leading-5 text-[color:var(--minimal-text-secondary)] shadow-lg group-hover:block group-focus-within:block">{tooltip}</span></span>;
}

export function ChartCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="genius-tech-card rounded-xl border border-[color:var(--minimal-border)] px-5 py-4">
    <header className="mb-4"><h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">{title}</h3>{description ? <p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">{description}</p> : null}</header>
    {children}
  </section>;
}

export function CollapsibleChartCard({ title, description, summary, children, tone = 'neutral' }: { title: string; description?: string; summary?: ReactNode; children: ReactNode; tone?: 'neutral' | 'warning' | 'critical' }) {
  const toneClass = tone === 'critical'
    ? 'border-[color:var(--minimal-danger-border)]'
    : tone === 'warning'
      ? 'border-[color:var(--minimal-warning-border)]'
      : 'border-[color:var(--minimal-border)]';
  return <details className={`genius-tech-card group rounded-xl border ${toneClass}`}>
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition hover:bg-[color:var(--minimal-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--minimal-focus)] [&::-webkit-details-marker]:hidden">
      <span className="flex min-w-0 items-start gap-3">
        <span aria-hidden="true" className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[color:var(--minimal-border-strong)] text-xs text-[color:var(--minimal-text-secondary)] transition-transform group-open:rotate-90">›</span>
        <span className="min-w-0"><span className="block text-sm font-semibold text-[color:var(--minimal-text)]">{title}</span>{description ? <span className="mt-1 block text-xs text-[color:var(--minimal-text-secondary)]">{description}</span> : null}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2 text-right">{summary}<span className="hidden text-xs font-medium text-[color:var(--minimal-action)] sm:inline">Detalhar</span></span>
    </summary>
    <div className="border-t border-[color:var(--minimal-border)] px-5 py-4">{children}</div>
  </details>;
}
