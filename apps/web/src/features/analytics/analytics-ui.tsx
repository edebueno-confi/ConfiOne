import type { ReactNode } from 'react';
import { GeniusMascot } from '../../components/GeniusMascot';

export function AnalyticsLoadingState({ title, description }: { title: string; description: string }) {
  return (
    <section aria-busy="true" aria-label={title} className="space-y-4" role="status">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => <div aria-hidden="true" className={`h-24 animate-pulse rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] ${index < 3 ? 'lg:col-span-2 xl:col-span-1' : 'lg:col-span-3 xl:col-span-1'}`} key={index} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => <div aria-hidden="true" className="h-56 animate-pulse rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)]" key={index} />)}
      </div>
      <div className="flex items-center justify-center gap-3 rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-4 py-3">
        <GeniusMascot alt="Gênio processando os dados do Dashboard" expression="happy" pose="magic" size="sm" surface="loading" />
        <p className="text-sm text-[color:var(--minimal-text-secondary)]">{description}</p>
      </div>
    </section>
  );
}

export function AnalyticsRetryAction({ onRetry }: { onRetry?: () => void }) {
  return onRetry ? <button type="button" onClick={onRetry} className="rounded-lg bg-[color:var(--minimal-text)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-surface)]">Tentar novamente</button> : null;
}

export function KpiCard({ label, value, hint, source, tone = 'neutral', className = '' }: { label: string; value: string; hint?: string; source?: string; tone?: 'neutral' | 'warning' | 'critical'; className?: string }) {
  const toneClass = tone === 'critical' ? 'border-[color:var(--minimal-danger-border)] bg-[color:var(--minimal-danger-surface)]' : tone === 'warning' ? 'border-[color:var(--minimal-warning-border)] bg-[color:var(--minimal-warning-surface)]' : 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)]';
  const valueClass = tone === 'critical' ? 'text-[color:var(--minimal-danger-text)]' : tone === 'warning' ? 'text-[color:var(--minimal-warning-text)]' : 'text-[color:var(--minimal-text)]';
  return <div className={`rounded-xl border px-4 py-3.5 ${toneClass} ${className}`}>
    <p className={`text-2xl font-semibold tabular-nums leading-none ${valueClass}`}>{value}</p>
    <div className="mt-2.5 flex items-center gap-1.5"><p className={`text-sm font-medium ${valueClass}`}>{label}</p>{source ? <MetricInfo text={source} /> : null}</div>
    {hint ? <p className="mt-0.5 text-xs text-[color:var(--minimal-text-tertiary)]">{hint}</p> : null}
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
