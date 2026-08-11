import { Link } from 'react-router';
import { ChartCard } from './analytics-ui';

export type AnalyticsCoverageStatus = 'available' | 'partial' | 'unavailable';

export interface AnalyticsCoverageItem {
  key: string;
  label: string;
  source: string;
  status: AnalyticsCoverageStatus;
  detail: string;
}

const STATUS_LABEL: Record<AnalyticsCoverageStatus, string> = {
  available: 'Publicado',
  partial: 'Cobertura parcial',
  unavailable: 'Indisponível',
};

const STATUS_CLASS: Record<AnalyticsCoverageStatus, string> = {
  available: 'text-[color:var(--minimal-action)]',
  partial: 'text-[color:var(--minimal-warning-text)]',
  unavailable: 'text-[color:var(--minimal-text-tertiary)]',
};

export function analyticsCoverageStatus(status?: string | null): AnalyticsCoverageStatus {
  if (status === 'fresh' || status === 'zero') return 'available';
  if (status === 'partial' || status === 'stale' || status === 'syncing') return 'partial';
  return 'unavailable';
}

export function AnalyticsDataCoveragePanel({
  items,
  canOpenGovernance = false,
}: {
  items: AnalyticsCoverageItem[];
  canOpenGovernance?: boolean;
}) {
  return (
    <ChartCard
      title="Cobertura operacional"
      description="O que tem contrato publicado nesta leitura e o que ainda depende de uma fonte validada."
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.key} className="rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-3">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-xs font-semibold leading-4 text-[color:var(--minimal-text)]">{item.label}</h4>
              <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[item.status]}`}>
                {STATUS_LABEL[item.status]}
              </span>
            </div>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]">Fonte · {item.source}</p>
            <p className="mt-1 text-xs leading-4 text-[color:var(--minimal-text-secondary)]">{item.detail}</p>
          </article>
        ))}
      </div>
      {canOpenGovernance ? (
        <Link
          to="/admin/settings/dashboard-sources"
          className="mt-4 inline-flex min-h-9 items-center rounded-lg border border-[color:var(--minimal-border-strong)] px-3 py-2 text-xs font-medium text-[color:var(--minimal-text)] hover:bg-[color:var(--minimal-surface-muted)]"
        >
          Revisar governança de dados
        </Link>
      ) : null}
    </ChartCard>
  );
}
