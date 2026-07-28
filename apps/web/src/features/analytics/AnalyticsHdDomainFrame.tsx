import type { ReactNode } from 'react';
import type { AnalyticsBlockState } from '@genius-support-os/contracts';
import { AnalyticsStateBadge } from './analytics-ui';

const STATUS_LABEL: Record<string, string> = {
  fresh: 'Atualizado',
  stale: 'Pode estar atrasado',
  partial: 'Cobertura parcial',
  empty: 'Sem registros no recorte',
  zero: 'Zero real no recorte',
  not_configured: 'Fonte não configurada',
  syncing: 'Sincronizando',
  unavailable: 'Fonte indisponível',
  error: 'Falha na fonte',
};

export function AnalyticsHdDomainFrame({
  title,
  description,
  source,
  state,
  children,
}: {
  title: string;
  description: string;
  source: string;
  state?: AnalyticsBlockState;
  children: ReactNode;
}) {
  return (
    <section className="gso-hd-domain-frame" aria-labelledby={`analytics-domain-${title.toLowerCase().replace(/\W+/g, '-')}`}>
      <header className="gso-hd-domain-frame-header">
        <div className="gso-hd-domain-frame-heading">
          <span className="gso-hd-domain-frame-source">{source}</span>
          <h2 id={`analytics-domain-${title.toLowerCase().replace(/\W+/g, '-')}`}>{title}</h2>
          <p>{description}</p>
        </div>
        {state ? (
          <div className="gso-hd-domain-frame-status">
            <span>{STATUS_LABEL[state.status] ?? 'Estado da fonte'}</span>
            <AnalyticsStateBadge state={state} />
          </div>
        ) : null}
      </header>
      {children}
    </section>
  );
}
