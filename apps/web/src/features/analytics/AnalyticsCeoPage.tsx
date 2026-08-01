import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AnalyticsDataStatus } from '@genius-support-os/contracts';
import { getCeoHistory, getCeoSnapshot } from './analytics-api';
import type { AnalyticsFilters, AnalyticsPageProps, CeoHistory, CeoSnapshot } from './analytics-model';
import { DEFAULT_ANALYTICS_FILTERS } from './analytics-model';
import { AnalyticsFilters as Filters } from './AnalyticsFilters';
import { AnalyticsLoadingState, AnalyticsRetryAction, AnalyticsStateBadge, formatCountLabel } from './analytics-ui';
import { resolveAnalyticsPeriod } from './analytics-periods';
import { buildExecutiveExceptions, rankExecutivePipelines } from './analytics-executive';

const STATUS_LABELS: Record<AnalyticsDataStatus, string> = {
  fresh: 'Dados atualizados',
  stale: 'Atualização atrasada',
  partial: 'Dados incompletos',
  empty: 'Sem dados no período',
  not_configured: 'Integração não configurada',
  syncing: 'Atualização em andamento',
  unavailable: 'Dados indisponíveis',
  error: 'Não foi possível atualizar',
};

type MetricDelta = { label: string; tone: 'positive' | 'negative' | 'neutral' } | null;

export function AnalyticsCeoPage({ sharedPeriod, onSharedPeriodChange, onRetry, isDashboardViewer = false }: AnalyticsPageProps) {
  const period = sharedPeriod ?? resolveAnalyticsPeriod('month');
  const [filters, setFilters] = useState<AnalyticsFilters>({ ...DEFAULT_ANALYTICS_FILTERS, ...period });
  const [result, setResult] = useState<{ loading: boolean; data?: CeoSnapshot; history?: CeoHistory; error?: boolean }>({ loading: true });
  const [refreshing, setRefreshing] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => setFilters((current) => ({ ...current, ...period })), [period.from, period.to]);
  useEffect(() => {
    let cancelled = false;
    setRefreshing(true);
    setResult((current) => current.data ? { ...current, loading: false, error: undefined } : { loading: true });
    Promise.all([getCeoSnapshot(filters), getCeoHistory(filters)])
      .then(([data, history]) => { if (!cancelled) { setResult({ loading: false, data, history }); setRefreshing(false); } })
      .catch(() => { if (!cancelled) { setResult((current) => ({ ...current, loading: false, error: true })); setRefreshing(false); } });
    return () => { cancelled = true; };
  }, [filters]);

  if (result.loading && !result.data) return <AnalyticsLoadingState title="Conjurando seus dados" description="Estamos preparando sua visão executiva." />;
  if (result.error || !result.data) return <StatePanel title="Não foi possível carregar a visão executiva" description="Os indicadores estão indisponíveis no momento. Tente novamente." onRetry={onRetry} />;

  const data = result.data;
  const state = data.state;
  const exceptions = buildExecutiveExceptions(data);
  const pipelines = rankExecutivePipelines(data.support.byPipeline);
  const unavailable = state?.status === 'empty' || state?.status === 'unavailable' || state?.status === 'error' || state?.status === 'not_configured';
  const history = result.history;
  const comparison = history && !unavailable ? {
    revenue: buildDelta(data.commercial.wonRevenue, history.previous.commercial.wonRevenue, 'currency'),
    deals: buildDelta(data.commercial.wonDeals, history.previous.commercial.wonDeals, 'count'),
    conversion: buildPercentagePointDelta(data.commercial.conversionRate, history.previous.commercial.conversionRate, data.commercial.wonDeals + data.commercial.lostDeals, history.previous.commercial.wonDeals + history.previous.commercial.lostDeals),
    tickets: buildDelta(data.support.createdTickets, history.previous.support.createdTickets, 'count'),
  } : { revenue: null, deals: null, conversion: null, tickets: null };

  const currentPosition = [
    { label: 'Saldo vencido', value: unavailable ? 'Indisponível' : data.finance.overdueBalance > 0 ? formatCurrency(data.finance.overdueBalance) : 'R$ 0', hint: formatCountLabel(data.finance.overdueTitles, 'título vencido', 'títulos vencidos'), tone: data.finance.overdueBalance > 0 ? 'critical' as const : 'neutral' as const },
    { label: 'Clientes com alerta', value: unavailable ? 'Indisponível' : data.financialAlerts.length.toLocaleString('pt-BR'), hint: 'Inadimplência reconciliada', tone: data.financialAlerts.length > 0 ? 'warning' as const : 'neutral' as const },
    { label: 'Tickets em aberto', value: unavailable ? 'Indisponível' : data.support.openTickets.toLocaleString('pt-BR'), hint: formatCountLabel(data.support.highPriorityOpen, 'alta prioridade aberta', 'altas prioridades abertas'), tone: data.support.highPriorityOpen > 0 ? 'warning' as const : 'neutral' as const },
  ];

  const periodMetrics = [
    { label: 'Receita ganha', value: unavailable ? 'Indisponível' : formatCurrency(data.commercial.wonRevenue), hint: formatCountLabel(data.commercial.wonDeals, 'ganho', 'ganhos'), delta: comparison.revenue },
    { label: 'Negócios ganhos', value: unavailable ? 'Indisponível' : data.commercial.wonDeals.toLocaleString('pt-BR'), hint: formatCountLabel(data.commercial.lostDeals, 'perdido', 'perdidos'), delta: comparison.deals },
    { label: 'Conversão', value: unavailable || data.commercial.wonDeals + data.commercial.lostDeals === 0 ? 'Indisponível' : formatPercent(data.commercial.conversionRate), hint: 'Ganhos sobre ganhos e perdas', delta: comparison.conversion },
    { label: 'Tickets criados', value: unavailable ? 'Indisponível' : data.support.createdTickets.toLocaleString('pt-BR'), hint: formatCountLabel(data.support.closedTickets, 'ticket encerrado', 'tickets encerrados'), delta: comparison.tickets },
  ];

  const domainCards = [
    { title: 'Comercial', description: 'Volume e capacidade de conversão', value: unavailable ? 'Indisponível' : formatCurrency(data.commercial.openPipelineValue), details: `${formatCountLabel(data.commercial.openDeals, 'negócio aberto', 'negócios abertos')} · ciclo médio ${data.commercial.avgSalesCycleDays > 0 ? `${Math.round(data.commercial.avgSalesCycleDays).toLocaleString('pt-BR')} dias` : 'indisponível'}`, href: '/admin/analytics/commercial' },
    { title: 'CS / Suporte', description: 'Risco operacional da fila', value: unavailable ? 'Indisponível' : formatCountLabel(data.support.highPriorityOpen, 'alta prioridade', 'altas prioridades'), details: `${formatPercent(data.support.closedRate)} encerrados · ${formatCountLabel(data.support.closeSlaTracked, 'SLA acompanhado', 'SLAs acompanhados')}`, href: '/admin/analytics/cs' },
    { title: 'Financeiro', description: 'Qualidade da reconciliação', value: unavailable ? 'Indisponível' : formatCountLabel(data.finance.unmatchedTitles, 'título sem correspondência', 'títulos sem correspondência'), details: `${formatCurrency(data.finance.balance)} em posição atual`, href: '/admin/analytics/finance' },
  ];

  const qualityItems = [
    { label: 'Títulos conciliados', value: data.dataQuality.financeTitles > 0 ? `${data.dataQuality.matchedFinanceTitles.toLocaleString('pt-BR')} / ${data.dataQuality.financeTitles.toLocaleString('pt-BR')}` : 'Indisponível', detail: data.dataQuality.financeTitles > 0 ? 'Cobertura financeira atual' : 'Sem base financeira no recorte' },
    { label: 'Grupos econômicos resolvidos', value: data.dataQuality.financeTitles > 0 ? data.dataQuality.resolvedGroupTitles.toLocaleString('pt-BR') : 'Indisponível', detail: 'Resolução disponível no contrato atual' },
    { label: 'Última leitura HubSpot', value: data.dataQuality.hubspotSourceAt ? formatRelativeSync(data.dataQuality.hubspotSourceAt) : 'Indisponível', detail: 'Fonte operacional' },
  ];
  const focus = exceptions[0];
  const applyFilters = (next: AnalyticsFilters) => { setFilters(next); onSharedPeriodChange?.({ from: next.from, to: next.to }); setMobileFiltersOpen(false); };

  return <div className="gso-executive-focus space-y-4" data-testid="executive-dashboard">
    <section className="gso-executive-hero" aria-labelledby="executive-heading">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--minimal-text-tertiary)]"><span>Genius OS</span><span aria-hidden="true" className="text-[color:var(--minimal-action)]">/</span><span>Leitura executiva</span></div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h2 id="executive-heading" className="text-2xl font-semibold tracking-[-0.045em] text-[color:var(--minimal-text)] sm:text-[2rem]">Cockpit operacional</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--minimal-text-secondary)]">Uma leitura focada no que pede decisão, no que está em movimento e no contexto para agir com segurança.</p></div><div className="flex items-center gap-2" role="status"><span className="gso-status-dot" aria-hidden="true" /><span className="text-xs font-medium text-[color:var(--minimal-text-secondary)]">{state ? formatStatusLabel(state.status, state.lastSuccessfulSyncAt) : 'Atualização ainda não registrada'}</span></div></div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--minimal-border)] pt-4"><div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--minimal-text-secondary)]"><span className="font-medium text-[color:var(--minimal-text)]">Período:</span><span>{formatPeriod(filters)}</span>{state?.lastSuccessfulSyncAt ? <span>· atualizado {formatRelativeSync(state.lastSuccessfulSyncAt)}</span> : null}{refreshing ? <span role="status" className="font-medium text-[color:var(--minimal-action)]">Atualizando...</span> : null}</div><div className="flex items-center gap-2"><button type="button" className="inline-flex h-9 items-center rounded-lg border border-[color:var(--minimal-border-strong)] px-3 text-sm font-medium text-[color:var(--minimal-text)] transition hover:bg-[color:var(--minimal-surface-muted)] sm:hidden" aria-expanded={mobileFiltersOpen} aria-controls="executive-filters-mobile" onClick={() => setMobileFiltersOpen((open) => !open)}>Filtros</button><span className="hidden text-xs text-[color:var(--minimal-text-tertiary)] sm:inline">{isDashboardViewer ? 'Visualização gerencial' : 'Dados contratuais do período'}</span></div></div>
    </section>

    <section className="gso-period-strip" aria-labelledby="performance-heading"><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--minimal-text-tertiary)]">Desempenho no período</p><h3 id="performance-heading" className="mt-1 text-sm font-semibold text-[color:var(--minimal-text)]">O recorte selecionado em quatro sinais</h3></div><span className="text-xs text-[color:var(--minimal-text-secondary)]">Comparações só aparecem com base válida</span></div><div className="grid gap-px overflow-hidden rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-border)] sm:grid-cols-2 xl:grid-cols-4">{periodMetrics.map((metric) => <div key={metric.label} className="bg-[color:var(--minimal-surface)] px-4 py-3.5"><p className="text-xs text-[color:var(--minimal-text-secondary)]">{metric.label}</p><p className="mt-2 text-xl font-semibold tabular-nums tracking-[-0.03em] text-[color:var(--minimal-text)]">{metric.value}</p><p className="mt-1 text-xs text-[color:var(--minimal-text-tertiary)]">{metric.hint}</p>{metric.delta ? <p className={`mt-2 text-[11px] font-semibold ${metric.delta.tone === 'negative' ? 'text-[color:var(--minimal-danger-text)]' : 'text-[color:var(--minimal-action)]'}`}>{metric.delta.label}</p> : null}</div>)}</div></section>

    <div id="executive-filters-mobile" className={`${mobileFiltersOpen ? 'block' : 'hidden'} sm:hidden`}><Filters value={filters} onApply={applyFilters} stageOptions={[]} /></div>

    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_344px]">
      <main className="min-w-0 space-y-4">
        <section className="gso-focus-panel" aria-labelledby="focus-heading"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--minimal-border)] px-5 py-5 sm:px-6"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--minimal-text-tertiary)]">Domínio em foco</p><h3 id="focus-heading" className="mt-2 text-xl font-semibold tracking-[-0.035em] text-[color:var(--minimal-text)]">{focus ? focus.title : 'A operação não tem alertas ativos'}</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--minimal-text-secondary)]">{focus ? focus.detail : 'Nenhum registro no período selecionado. A posição atual continua disponível para consulta.'}</p></div>{focus && !isDashboardViewer ? <Link to={focus.href} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[color:var(--minimal-action)] px-4 text-sm font-semibold text-[color:var(--minimal-action-ink)] transition hover:opacity-90">{focus.action}</Link> : null}</div><div className="px-5 py-5 sm:px-6"><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h4 className="text-sm font-semibold text-[color:var(--minimal-text)]">Sinais operacionais separados da qualidade</h4><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">Prioridades que merecem acompanhamento agora.</p></div>{state ? <AnalyticsStateBadge state={state} /> : null}</div>{exceptions.length > 0 ? <ol className="gso-focus-timeline" aria-label="Alertas operacionais">{exceptions.map((item, index) => <li key={item.key} className="gso-focus-event"><span className={`gso-focus-marker ${item.severity === 3 ? 'gso-focus-marker-critical' : item.severity === 2 ? 'gso-focus-marker-warning' : ''}`} aria-hidden="true">{index + 1}</span><div className="min-w-0 flex-1 rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-4 py-3 transition hover:border-[color:var(--minimal-border-strong)]"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--minimal-text-tertiary)]">{item.domain}</p><h5 className="mt-1 text-sm font-semibold text-[color:var(--minimal-text)]">{item.title}</h5></div>{!isDashboardViewer ? <Link to={item.href} className="shrink-0 text-xs font-semibold text-[color:var(--minimal-action)]">Ver análise</Link> : null}</div><p className="mt-2 text-sm leading-5 text-[color:var(--minimal-text-secondary)]">{item.detail}</p></div></li>)}</ol> : <div className="rounded-xl border border-dashed border-[color:var(--minimal-border-strong)] px-4 py-5 text-sm text-[color:var(--minimal-text-secondary)]" role="status">Nenhum alerta no período.</div>}</div></section>

        <section className="gso-focus-panel" aria-labelledby="pipelines-heading"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-[color:var(--minimal-border)] px-5 py-4 sm:px-6"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--minimal-text-tertiary)]">Fila observada</p><h3 id="pipelines-heading" className="mt-1 text-base font-semibold text-[color:var(--minimal-text)]">Pipelines de atendimento prioritários</h3></div><span className="text-xs text-[color:var(--minimal-text-secondary)]">{formatCountLabel(pipelines.length, 'pipeline', 'pipelines')} com atividade</span></div>{pipelines.length ? <ul className="divide-y divide-[color:var(--minimal-border)]">{pipelines.map((pipeline, index) => <li key={pipeline.id}><Link to={pipeline.href} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-[color:var(--minimal-surface-muted)] sm:px-6"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--minimal-selection)] text-xs font-semibold text-[color:var(--minimal-selection-text)]">{String(index + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-[color:var(--minimal-text)]">{pipeline.label}</span><span className="text-xs text-[color:var(--minimal-text-secondary)]">{pipeline.domain}</span></span><span className="shrink-0 text-sm font-semibold tabular-nums text-[color:var(--minimal-text)]">{formatCountLabel(pipeline.count, 'ticket', 'tickets')}</span><span className="shrink-0 text-xs font-semibold text-[color:var(--minimal-action)]">Abrir</span></Link></li>)}</ul> : <div className="px-5 py-5 text-sm text-[color:var(--minimal-text-secondary)]">Nenhuma fila teve atividade no período.</div>}</section>

        <section aria-labelledby="domains-heading"><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h3 id="domains-heading" className="text-sm font-semibold text-[color:var(--minimal-text)]">Resumo por domínio</h3><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">O sinal principal de cada área, sem misturar posição atual e desempenho do período.</p></div><span className="text-xs text-[color:var(--minimal-text-tertiary)]">Leitura comparável</span></div><div className="grid gap-3 md:grid-cols-3">{domainCards.map((card) => <div key={card.title} className="gso-domain-row"><div className="flex items-start justify-between gap-3"><div><h4 className="text-sm font-semibold text-[color:var(--minimal-text)]">{card.title}</h4><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">{card.description}</p></div><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--minimal-text-tertiary)]">Sinal</span></div><p className="mt-5 text-xl font-semibold tabular-nums tracking-[-0.03em] text-[color:var(--minimal-text)]">{card.value}</p><p className="mt-1 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">{card.details}</p>{isDashboardViewer ? <span className="mt-4 inline-block text-xs text-[color:var(--minimal-text-tertiary)]">Detalhamento restrito ao perfil</span> : <Link to={card.href} className="mt-4 inline-block text-xs font-semibold text-[color:var(--minimal-action)]">Abrir domínio</Link>}</div>)}</div></section>
      </main>

      <aside className="min-w-0 space-y-4 xl:sticky xl:top-4"><section className="gso-context-panel hidden sm:block" aria-label="Filtros da análise"><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--minimal-text-tertiary)]">Recorte</p><h3 className="mt-1 text-base font-semibold text-[color:var(--minimal-text)]">Período da leitura</h3></div><span className="text-xs text-[color:var(--minimal-text-secondary)]">{formatPeriod(filters)}</span></div><div className="mt-4"><Filters value={filters} onApply={applyFilters} stageOptions={[]} /></div></section><section className="gso-context-panel" aria-labelledby="current-heading"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--minimal-text-tertiary)]">Agora</p><h3 id="current-heading" className="mt-1 text-base font-semibold text-[color:var(--minimal-text)]">Posição atual</h3><p className="mt-1 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">Posição atual, não afetada pelo período selecionado.</p></div><span className="text-xs font-medium text-[color:var(--minimal-text-tertiary)]">Ao vivo</span></div><div className="mt-4 divide-y divide-[color:var(--minimal-border)]">{currentPosition.map((item) => <div key={item.label} className="py-3 first:pt-0 last:pb-0"><div className="flex items-end justify-between gap-3"><p className="text-xs text-[color:var(--minimal-text-secondary)]">{item.label}</p><p className={`text-lg font-semibold tabular-nums ${item.tone === 'critical' ? 'text-[color:var(--minimal-danger-text)]' : item.tone === 'warning' ? 'text-[color:var(--minimal-warning-text)]' : 'text-[color:var(--minimal-text)]'}`}>{item.value}</p></div><p className="mt-1 text-right text-[11px] text-[color:var(--minimal-text-tertiary)]">{item.hint}</p></div>)}</div></section><section className="gso-context-panel" aria-labelledby="quality-heading"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--minimal-text-tertiary)]">Confiabilidade</p><h3 id="quality-heading" className="mt-1 text-base font-semibold text-[color:var(--minimal-text)]">Qualidade da leitura</h3><p className="mt-1 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">Origem e cobertura que ajudam a interpretar os sinais.</p></div><div className="mt-4 divide-y divide-[color:var(--minimal-border)]">{qualityItems.map((item) => <div key={item.label} className="py-3 first:pt-0 last:pb-0"><div className="flex items-baseline justify-between gap-3"><p className="text-xs text-[color:var(--minimal-text-secondary)]">{item.label}</p><p className="text-sm font-semibold tabular-nums text-[color:var(--minimal-text)]">{item.value}</p></div><p className="mt-1 text-[11px] leading-4 text-[color:var(--minimal-text-tertiary)]">{item.detail}</p></div>)}</div></section>{isDashboardViewer ? <div className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-4 py-3 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">Visualizador gerencial: leitura autorizada. Detalhamento restrito ao perfil.</div> : <details className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)]"><summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[color:var(--minimal-text)]">Análises avançadas</summary><div className="border-t border-[color:var(--minimal-border)] px-4 py-3 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">Aprofundamentos financeiros e históricos permanecem nos domínios correspondentes.</div></details>}</aside>
    </div>
  </div>;
}

function StatePanel({ title, description, onRetry }: { title: string; description: string; onRetry?: () => void }) {
  return <section className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-5 py-8 text-center" role="alert"><h2 className="text-base font-semibold text-[color:var(--minimal-text)]">{title}</h2><p className="mt-1 text-sm text-[color:var(--minimal-text-secondary)]">{description}</p><div className="mt-4 flex justify-center"><AnalyticsRetryAction onRetry={onRetry} /></div></section>;
}

function formatCurrency(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }); }
function formatPercent(value: number) { return `${(value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`; }
function formatPeriod(filters: AnalyticsFilters) { return filters.from && filters.to ? `${formatDate(filters.from)} a ${formatDate(filters.to)}` : 'Período padrão'; }
function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR'); }
function formatRelativeSync(value: string) { return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }
function formatStatusLabel(status: AnalyticsDataStatus, lastSuccessfulSyncAt: string | null) { return status === 'fresh' && !lastSuccessfulSyncAt ? 'Dados recebidos' : STATUS_LABELS[status]; }
function buildDelta(current: number, previous: number, kind: 'currency' | 'count'): MetricDelta {
  if (previous === 0) return null;
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const sign = change > 0 ? '+' : '';
  const value = kind === 'currency' ? `${sign}${change.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : `${sign}${change.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  return { label: `${value} vs. período anterior`, tone: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral' };
}
function buildPercentagePointDelta(current: number, previous: number, currentDenominator: number, previousDenominator: number): MetricDelta {
  if (currentDenominator === 0 || previousDenominator === 0) return null;
  const change = (current - previous) * 100;
  const sign = change > 0 ? '+' : '';
  return { label: `${sign}${change.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} p.p. vs. período anterior`, tone: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral' };
}
