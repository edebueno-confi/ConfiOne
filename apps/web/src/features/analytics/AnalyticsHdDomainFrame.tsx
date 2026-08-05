import type { ReactNode } from 'react';
import type { AnalyticsBlockState } from '@genius-support-os/contracts';
import { AnalyticsStateBadge } from './analytics-ui';
import type { OmieSyncRun, SyncRun } from './analytics-model';

export function AnalyticsExecutionMeta({
  provider,
  run,
}: {
  provider: 'HubSpot' | 'OMIE';
  run: SyncRun | OmieSyncRun | null;
}) {
  const status = run?.status ?? 'not_registered';
  const statusLabel = status === 'success' || status === 'succeeded' || status === 'completed'
    ? 'Concluída'
    : status === 'running' || status === 'processing'
      ? 'Em andamento'
      : status === 'failed' || status === 'error'
        ? 'Falhou'
        : status === 'partial'
          ? 'Parcial'
          : 'Não registrada';
  const finishedAt = run?.finishedAt ?? run?.startedAt ?? null;
  const rowCount = run && 'totalRows' in run
    ? run.totalRows
    : run && 'recordsPromoted' in run
      ? (run.recordsPromoted || run.recordsAccepted || run.companiesSynced || run.dealsSynced || run.ticketsSynced)
      : null;
  const requestCount = run?.requestCount ?? null;
  const requestRetryCount = run?.requestRetryCount ?? null;
  const requestAverageDurationMs = run?.requestAverageDurationMs ?? null;
  const requestSuccessRatePercent = run?.requestSuccessRatePercent ?? null;
  const telemetrySummary = requestCount !== null
    ? ` · ${requestCount.toLocaleString('pt-BR')} chamadas${requestRetryCount ? ` · ${requestRetryCount.toLocaleString('pt-BR')} retries` : ''}${requestAverageDurationMs !== null ? ` · ${requestAverageDurationMs.toLocaleString('pt-BR')} ms/call` : ''}${requestSuccessRatePercent !== null ? ` · ${requestSuccessRatePercent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% sucesso` : ''}`
    : '';
  const enrichmentSummary = provider === 'OMIE' && run && 'enrichmentCacheSource' in run && run.enrichmentCacheSource
    ? ` · cadastro de clientes: ${run.enrichmentCacheSource === 'stale_cache' ? 'dados antigos' : run.enrichmentCacheSource === 'cache' ? 'dados atuais' : run.enrichmentCacheSource === 'api' ? 'fonte conectada' : 'parcial'}`
    : '';

  return (
    <div className="gso-analytics-execution-meta" aria-label={`Última execução ${provider}`}>
      <span className="gso-analytics-execution-meta__label">Última execução</span>
      <strong>{provider} · {statusLabel}</strong>
      <span>
        {finishedAt ? new Date(finishedAt).toLocaleString('pt-BR') : 'Atualização não registrada'}
        {rowCount !== null && rowCount !== undefined ? ` · ${rowCount.toLocaleString('pt-BR')} registros` : ''}
        {telemetrySummary}{enrichmentSummary}
      </span>
    </div>
  );
}

export function AnalyticsHdDomainFrame({
  title,
  description,
  source,
  state,
  headerAside,
  children,
}: {
  title: string;
  description: string;
  source: string;
  state?: AnalyticsBlockState;
  headerAside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="gso-hd-domain-frame gso-visual-v1-domain-frame" aria-labelledby={`analytics-domain-${title.toLowerCase().replace(/\W+/g, '-')}`}>
      <header className="gso-hd-domain-frame-header">
        <div className="gso-hd-domain-frame-heading">
          <span className="gso-hd-domain-frame-source">{source}</span>
          <h2 id={`analytics-domain-${title.toLowerCase().replace(/\W+/g, '-')}`}>{title}</h2>
          <p>{description}</p>
        </div>
        {headerAside || state ? <div className="gso-hd-domain-frame-aside">
          {headerAside}
          {state ? <div className="gso-hd-domain-frame-status"><AnalyticsStateBadge state={state} /></div> : null}
        </div> : null}
      </header>
      {children}
    </section>
  );
}
