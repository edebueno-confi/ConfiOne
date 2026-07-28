import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../app/format';
import { getLatestSyncRun } from './analytics-api';
import { listEnabledAnalyticsDomains } from './analytics-domains';
import type { SyncRun, AnalyticsSharedPeriod } from './analytics-model';
import { useAuthContext } from '../auth/auth-context';
import { resolveAnalyticsPeriod } from './analytics-periods';
import { AnalyticsReportExport } from './AnalyticsReportExport';
import { MinimalState } from '../../components/minimal-states';
import { analyticsDomainFromTab, analyticsTabForDomain, normalizeAnalyticsSearch } from './analytics-navigation';

const DOMAINS = listEnabledAnalyticsDomains();

function SyncStatusLabel({ run, error }: { run: SyncRun | null; error?: string | null }) {
  if (error) return <span className="text-xs text-[color:var(--minimal-danger-text)]">Status da sincronização indisponível.</span>;
  if (!run) return <span className="text-xs text-[color:var(--minimal-text-tertiary)]">Nenhuma sincronização registrada.</span>;
  const statusLabel = run.status === 'success' ? 'concluída' : run.status === 'error' ? 'com erro' : 'em andamento';
  return <span className={`text-xs ${run.status === 'error' ? 'text-[color:var(--minimal-danger-text)]' : 'text-[color:var(--minimal-text-tertiary)]'}`}>Última sincronização {statusLabel} · {formatDateTime(run.finishedAt ?? run.startedAt)}</span>;
}

export function AnalyticsShell() {
  const { gate } = useAuthContext();
  const isPlatformAdmin = gate.actor?.is_platform_admin === true;
  const isDashboardViewer = !isPlatformAdmin && gate.actor?.roles.includes('dashboard_viewer') === true;
  // O dashboard_viewer recebe a mesma leitura dos domínios executivos, sem
  // ganhar ações administrativas. A autorização de rota e os read models
  // continuam sendo a fonte da permissão; aqui só evitamos esconder dados
  // aprovados da navegação.
  const visibleDomains = DOMAINS;
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = useMemo(() => normalizeAnalyticsSearch(location.search), [location.search]);
  const activeKey = analyticsDomainFromTab(urlParams.get('tab'));
  const [reloadKey, setReloadKey] = useState(0);
  const [latestRun, setLatestRun] = useState<SyncRun | null>(null);
  const [syncStatusError, setSyncStatusError] = useState<string | null>(null);
  const [sharedPeriod, setSharedPeriod] = useState<AnalyticsSharedPeriod>(() => {
    const fallback = resolveAnalyticsPeriod('month');
    return { ...fallback, from: urlParams.get('from') ?? fallback.from, to: urlParams.get('to') ?? fallback.to };
  });
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    const from = urlParams.get('from');
    const to = urlParams.get('to');
    if (from && to) setSharedPeriod((current) => current.from === from && current.to === to ? current : { from, to });
  }, [urlParams]);

  const activeDomain = visibleDomains.find((domain) => domain.key === activeKey) ?? visibleDomains[0];
  const refreshLatestRun = useCallback(() => {
    setSyncStatusError(null);
    getLatestSyncRun().then(setLatestRun).catch(() => { setLatestRun(null); setSyncStatusError('unavailable'); });
  }, []);
  useEffect(() => { refreshLatestRun(); }, [refreshLatestRun]);
  const ActiveComponent = activeDomain?.Component;

  return (
    <div className="gso-screen-frame gso-analytics-shell flex h-full min-h-0 flex-col overflow-y-auto bg-[color:var(--minimal-surface)]">
      <header className="gso-screen-header gso-workspace-header shrink-0 border-b border-[color:var(--minimal-border)] px-5 py-3 sm:px-6">
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">Dashboard Gerencial</h1>
            <p className="truncate text-xs text-[color:var(--minimal-text-secondary)]">Visão executiva integrada a HubSpot, OMIE e fontes operacionais.</p>
            {isDashboardViewer ? <span className="text-[11px] font-medium text-[color:var(--minimal-text-tertiary)]">Visualizador gerencial</span> : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {isPlatformAdmin ? <button type="button" onClick={() => setReportOpen(true)} className="inline-flex h-9 items-center rounded-lg border border-[color:var(--minimal-action)] px-3 text-sm font-medium text-[color:var(--minimal-action)] transition hover:bg-[color:var(--minimal-surface-muted)]">Exportar relatório</button> : null}
            {isPlatformAdmin ? <Link to="/admin/settings?section=analytics" className="text-xs font-medium text-[color:var(--minimal-action)] hover:underline">Gerenciar integrações</Link> : null}
            <SyncStatusLabel run={latestRun} error={syncStatusError} />
          </div>
        </div>
        <nav className="gso-workspace-tabs gso-analytics-domain-tabs mt-2 flex max-w-full flex-nowrap gap-1 overflow-x-auto pb-1 pr-4" aria-label="Áreas do dashboard">
          {visibleDomains.map((domain) => {
            const isActive = domain.key === activeKey;
            return <button key={domain.key} type="button" onClick={() => { const next = normalizeAnalyticsSearch(location.search); next.set('tab', analyticsTabForDomain(domain.key)); if (domain.key !== 'support') next.delete('pipeline'); navigate({ pathname: '/admin/analytics', search: `?${next.toString()}` }); }} aria-current={isActive ? 'page' : undefined} title={domain.description} className={`gso-workspace-tab flex-none whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive ? 'bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text)]' : 'text-[color:var(--minimal-text-secondary)] hover:text-[color:var(--minimal-text)]'}`}>{domain.label}</button>;
          })}
        </nav>
        <label className="gso-analytics-domain-select mt-2">
          <span>Área do dashboard</span>
          <select
            value={activeDomain?.key ?? ''}
            onChange={(event) => {
              const domain = visibleDomains.find((item) => item.key === event.target.value);
              if (!domain) return;
              const next = normalizeAnalyticsSearch(location.search);
              next.set('tab', analyticsTabForDomain(domain.key));
              if (domain.key !== 'support') next.delete('pipeline');
              navigate({ pathname: '/admin/analytics', search: `?${next.toString()}` });
            }}
          >
            {visibleDomains.map((domain) => <option key={domain.key} value={domain.key}>{domain.label}</option>)}
          </select>
        </label>
      </header>
      <div className="gso-analytics-content px-5 py-4 sm:px-6">
        <Suspense fallback={<MinimalState loading title="Carregando área do dashboard" description="Estamos preparando os indicadores deste recorte." />}>
          {ActiveComponent ? <ActiveComponent key={`${activeKey}-${reloadKey}`} sharedPeriod={sharedPeriod} onSharedPeriodChange={setSharedPeriod} onRetry={() => setReloadKey((current) => current + 1)} isDashboardViewer={isDashboardViewer} /> : null}
        </Suspense>
      </div>
      <AnalyticsReportExport open={reportOpen} period={sharedPeriod} onClose={() => setReportOpen(false)} />
    </div>
  );
}
