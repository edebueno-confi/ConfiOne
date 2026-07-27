import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AnalyticsDataStatus } from '@genius-support-os/contracts';
import { MinimalState } from '../../components/minimal-states';
import { getCeoSnapshot } from './analytics-api';
import type { AnalyticsPageProps, CeoSnapshot } from './analytics-model';
import { AnalyticsLoadingState, AnalyticsRetryAction, AnalyticsStateBadge, KpiCard } from './analytics-ui';
import { resolveAnalyticsPeriod } from './analytics-periods';
import { analyticsHref } from './analytics-navigation';

const STATUS_LABELS: Record<AnalyticsDataStatus, string> = {
  fresh: 'Carteira atualizada', stale: 'Carteira pode estar atrasada', partial: 'Cobertura parcial', empty: 'Carteira sem registros', zero: 'Zero real no recorte', not_configured: 'Fonte não configurada', syncing: 'Sincronizando', unavailable: 'Fonte indisponível', error: 'Falha na fonte',
};

export function AnalyticsCustomerSuccessPage({ sharedPeriod, onRetry }: AnalyticsPageProps) {
  const period = sharedPeriod ?? resolveAnalyticsPeriod('month');
  const [state, setState] = useState<{ phase: 'loading' } | { phase: 'ready'; data: CeoSnapshot } | { phase: 'error' }>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ phase: 'loading' });
    getCeoSnapshot({ from: period.from, to: period.to, ownerId: '', stageId: '', priority: '' })
      .then((data) => { if (!cancelled) setState({ phase: 'ready', data }); })
      .catch(() => { if (!cancelled) setState({ phase: 'error' }); });
    return () => { cancelled = true; };
  }, [period.from, period.to]);

  if (state.phase === 'loading') return <AnalyticsLoadingState title="Consultando Customer Success" description="Estamos organizando a carteira e os sinais disponíveis para a gestão." />;
  if (state.phase === 'error') return <section role="alert" className="rounded-xl border border-[color:var(--minimal-danger-border)] bg-[color:var(--minimal-danger-surface)] px-5 py-6"><h2 className="text-base font-semibold text-[color:var(--minimal-danger-text)]">Não foi possível carregar Customer Success</h2><p className="mt-1 text-sm text-[color:var(--minimal-text-secondary)]">A carteira não está disponível neste momento.</p><div className="mt-4"><AnalyticsRetryAction onRetry={onRetry} /></div></section>;

  const data = state.data.customerSuccess;
  const isUnavailable = ['empty', 'unavailable', 'error', 'not_configured'].includes(data.state.status);
  const statusLabel = STATUS_LABELS[data.state.status];
  return <div className="space-y-5" data-testid="customer-success-dashboard">
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[color:var(--minimal-border)] pb-3">
      <div><h2 className="text-base font-semibold text-[color:var(--minimal-text)]">Customer Success</h2><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">Carteira, relacionamento e sinais de saúde disponíveis.</p></div>
      <div className="text-right"><span className="text-xs font-medium text-[color:var(--minimal-text-secondary)]">{statusLabel}</span><AnalyticsStateBadge state={data.state} /></div>
    </header>
    <section aria-labelledby="cs-executive-context"><h3 id="cs-executive-context" className="text-sm font-semibold text-[color:var(--minimal-text)]">Leitura da carteira</h3><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">A área usa a carteira estruturada disponível no Genius OS. Health score, renovação e expansão permanecem indisponíveis quando não há contrato de origem.</p></section>
    {!isUnavailable ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Clientes ativos" value={data.activeCustomers.toLocaleString('pt-BR')} hint="Com contexto de produto ou operação" temporalType="Posição atual" state={data.state} />
      <KpiCard label="Com responsável" value={data.assignedCustomers.toLocaleString('pt-BR')} hint="Atribuição de carteira registrada" temporalType="Posição atual" state={data.state} />
      <KpiCard label="Sem responsável" value={data.customersWithoutOwner.toLocaleString('pt-BR')} hint="Exige revisão de cobertura" temporalType="Posição atual" state={data.state} tone={data.customersWithoutOwner > 0 ? 'warning' : 'neutral'} />
      <KpiCard label="Health disponível" value={data.healthAvailable.toLocaleString('pt-BR')} hint="Sem score inventado quando ausente" temporalType="Posição atual" state={data.state} />
    </div> : <MinimalState title="Carteira indisponível no recorte" description={data.state.reason || 'A fonte de Customer Success ainda não possui registros confiáveis para esta leitura.'} />}
    <section className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Aprofundar a leitura</h3><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">A operação detalhada da carteira continua em sua superfície própria.</p></div><Link to="/cs/portfolio" className="text-xs font-semibold text-[color:var(--minimal-action)]">Abrir carteira CS <span aria-hidden="true">→</span></Link></div></section>
    <p className="text-xs text-[color:var(--minimal-text-tertiary)]">Fonte: {data.source}. Esta tela não substitui a operação de carteira nem inventa sinais de risco.</p>
    <Link to={analyticsHref('ceo')} className="inline-flex text-xs font-semibold text-[color:var(--minimal-action)]">Voltar à Visão Geral <span aria-hidden="true">→</span></Link>
  </div>;
}
