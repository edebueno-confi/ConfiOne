import { Suspense, useCallback, useEffect, useState } from 'react';
import { formatDateTime } from '../../app/format';
import { getLatestSyncRun, triggerHubspotSync } from './analytics-api';
import { listEnabledAnalyticsDomains } from './analytics-domains';
import type { SyncRun } from './analytics-model';
import { useAuthContext } from '../auth/auth-context';
import type { AnalyticsSharedPeriod } from './analytics-model';
import { resolveAnalyticsPeriod } from './analytics-periods';
import { AnalyticsReportExport } from './AnalyticsReportExport';
import { GeniusSyncOverlay } from '../../components/GeniusSyncOverlay';
import { MinimalState } from '../../components/minimal-states';

const DOMAINS = listEnabledAnalyticsDomains();

function SyncStatusLabel({ run, error }: { run: SyncRun | null; error?: string | null }) {
  if (error) {
    return <span className="text-xs text-[color:var(--minimal-danger-text)]">Status da sincronização indisponível. Tente novamente mais tarde.</span>;
  }
  if (!run) {
    return <span className="text-xs text-[color:var(--minimal-text-tertiary)]">Nenhuma sincronização registrada ainda.</span>;
  }

  const statusLabel = run.status === 'success' ? 'concluída' : run.status === 'error' ? 'com erro' : 'em andamento';
  const toneClass = run.status === 'error' ? 'text-[color:var(--minimal-danger-text)]' : 'text-[color:var(--minimal-text-tertiary)]';

  return (
    <span className={`text-xs ${toneClass}`}>
      Última sincronização {statusLabel} · {formatDateTime(run.finishedAt ?? run.startedAt)}
      {run.status === 'error' ? ': A sincronização terminou com erro.' : ''}
    </span>
  );
}

export function AnalyticsShell() {
  const { gate } = useAuthContext();
  const isPlatformAdmin = gate.actor?.is_platform_admin === true;
  const isDashboardViewer = !isPlatformAdmin && gate.actor?.roles.includes('dashboard_viewer') === true;
  const visibleDomains = isDashboardViewer ? DOMAINS.filter((domain) => domain.key === 'ceo') : DOMAINS;
  const [activeKey, setActiveKey] = useState(visibleDomains[0]?.key ?? 'commercial');
  const [reloadKey, setReloadKey] = useState(0);
  const [latestRun, setLatestRun] = useState<SyncRun | null>(null);
  const [syncStatusError, setSyncStatusError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [sharedPeriod, setSharedPeriod] = useState<AnalyticsSharedPeriod>(() => resolveAnalyticsPeriod('month'));
  const [reportOpen, setReportOpen] = useState(false);

  const activeDomain = visibleDomains.find((domain) => domain.key === activeKey) ?? visibleDomains[0];

  const refreshLatestRun = useCallback(() => {
    setSyncStatusError(null);
    getLatestSyncRun()
      .then(setLatestRun)
      .catch(() => {
        setLatestRun(null);
        setSyncStatusError('unavailable');
      });
  }, []);

  useEffect(() => {
    refreshLatestRun();
  }, [refreshLatestRun]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncMessage(null);
    try {
      const result = await triggerHubspotSync();
      setSyncMessage(
        `${result.mode === 'incremental' ? 'Atualização incremental' : 'Carga completa'} iniciada. O Dashboard será atualizado quando o orquestrador concluir a execução.`,
      );
      refreshLatestRun();
      setReloadKey((current) => current + 1);
    } catch (error) {
      setSyncError(
        'Não foi possível concluir a sincronização com o HubSpot. Tente novamente mais tarde.',
      );
    } finally {
      setSyncing(false);
    }
  }, [refreshLatestRun]);

  const ActiveComponent = activeDomain?.Component;

  return (
    <div className="gso-screen-frame gso-analytics-shell flex h-full min-h-0 flex-col overflow-y-auto bg-[color:var(--minimal-surface)]">
      <header className="gso-screen-header gso-workspace-header border-b border-[color:var(--minimal-border)] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">
              Dashboard Gerencial
            </h1>
            <p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">
              Visão executiva integrada a HubSpot, OMIE e fontes operacionais.
            </p>
            {isDashboardViewer ? <p className="mt-1 text-xs font-medium text-[color:var(--minimal-text-tertiary)]">Visualizador gerencial · acesso ao Dashboard</p> : null}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex flex-wrap justify-end gap-2">
              {isPlatformAdmin ? <button type="button" onClick={() => setReportOpen(true)} className="inline-flex items-center rounded-lg border border-[color:var(--minimal-action)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-action)] transition hover:bg-[color:var(--minimal-surface-muted)]">
                Exportar relatório
              </button> : null}
              {isPlatformAdmin && activeKey === 'ceo' ? <button type="button" onClick={() => void handleSync()} disabled={syncing} className="inline-flex items-center rounded-lg bg-[color:var(--minimal-action)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-action-ink)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">{syncing ? 'Sincronizando...' : 'Sincronizar HubSpot'}</button> : null}
            </div>
              <SyncStatusLabel run={latestRun} error={syncStatusError} />
            {syncError ? (
              <span className="text-xs text-[color:var(--minimal-danger-text)]">{syncError}</span>
            ) : null}
            {syncMessage ? (
              <span role="status" className="max-w-[38rem] text-right text-xs text-[color:var(--minimal-text-tertiary)]">{syncMessage}</span>
            ) : null}
          </div>
        </div>

        <nav className="gso-workspace-tabs mt-4 flex max-w-full flex-nowrap gap-1 overflow-x-auto pb-1 pr-4 sm:flex-wrap sm:overflow-visible sm:pb-0 sm:pr-0" aria-label="Áreas do dashboard">
          {visibleDomains.map((domain) => {
            const isActive = domain.key === activeKey;
            return (
              <button
                key={domain.key}
                type="button"
                onClick={() => setActiveKey(domain.key)}
                aria-current={isActive ? 'page' : undefined}
                title={domain.description}
                className={`gso-workspace-tab flex-none whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text)]'
                    : 'text-[color:var(--minimal-text-secondary)] hover:text-[color:var(--minimal-text)]'
                }`}
              >
                {domain.label}
              </button>
            );
          })}
        </nav>
      </header>

      {isPlatformAdmin && activeKey !== 'ceo' ? (
        <div className="gso-command-strip flex flex-wrap items-center justify-end gap-3 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-5 py-2.5 sm:px-6">
          <span className="mr-auto text-xs text-[color:var(--minimal-text-tertiary)]">
            Atualize o cache do Dashboard Gerencial quando precisar consultar dados recentes.
          </span>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="inline-flex items-center rounded-lg border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] px-3 py-1.5 text-sm font-medium text-[color:var(--minimal-text)] transition hover:border-[color:var(--minimal-border-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar HubSpot'}
          </button>
        </div>
      ) : null}

      <div className="px-5 py-5 sm:px-6">
        <Suspense
          fallback={
            <MinimalState
              loading
              title="Carregando área do dashboard"
              description="Estamos preparando os indicadores deste recorte."
            />
          }
        >
          {ActiveComponent ? (
            <ActiveComponent
              key={`${activeKey}-${reloadKey}`}
                  sharedPeriod={sharedPeriod}
                  onSharedPeriodChange={setSharedPeriod}
                  onRetry={() => setReloadKey((current) => current + 1)}
                  isDashboardViewer={isDashboardViewer}
                />
          ) : null}
        </Suspense>
      </div>
      <AnalyticsReportExport open={reportOpen} period={sharedPeriod} onClose={() => setReportOpen(false)} />
      {syncing ? <GeniusSyncOverlay source="HubSpot" detail="Empresas, negócios, tickets e responsáveis serão recarregados ao final." /> : null}
    </div>
  );
}
