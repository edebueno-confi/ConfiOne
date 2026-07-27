import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AnalyticsDataStatus } from '@genius-support-os/contracts';
import { getCeoHistory, getCeoSnapshot } from './analytics-api';
import type { AnalyticsFilters, AnalyticsPageProps, CeoHistory, CeoSnapshot } from './analytics-model';
import { DEFAULT_ANALYTICS_FILTERS } from './analytics-model';
import { AnalyticsFilters as Filters } from './AnalyticsFilters';
import { AnalyticsLoadingState, AnalyticsRetryAction, AnalyticsStateBadge, KpiCard, formatCountLabel } from './analytics-ui';
import { resolveAnalyticsPeriod } from './analytics-periods';
import { buildExecutiveExceptions, rankExecutivePipelines } from './analytics-executive';
import { analyticsHref } from './analytics-navigation';

const STATUS_LABELS: Record<AnalyticsDataStatus, string> = {
  fresh: 'Dados atualizados',
  stale: 'Dados podem estar atrasados',
  partial: 'Cobertura parcial',
  empty: 'Sem registros no recorte',
  zero: 'Zero real no recorte',
  not_configured: 'Fonte não configurada',
  syncing: 'Sincronização em andamento',
  unavailable: 'Fonte indisponível',
  error: 'Falha na fonte',
};

type MetricDelta = { label: string; tone: 'positive' | 'negative' | 'neutral' } | null;

export function AnalyticsCeoPage({ sharedPeriod, onSharedPeriodChange, onRetry, isDashboardViewer = false }: AnalyticsPageProps) {
  const period = sharedPeriod ?? resolveAnalyticsPeriod('month');
  const [filters, setFilters] = useState<AnalyticsFilters>({ ...DEFAULT_ANALYTICS_FILTERS, ...period });
  const [result, setResult] = useState<{ loading: boolean; data?: CeoSnapshot; history?: CeoHistory; error?: boolean }>({ loading: true });
  const [refreshing, setRefreshing] = useState(false);
  const [domainScope, setDomainScope] = useState<'all' | 'commercial' | 'customer_success' | 'support' | 'finance' | 'product' | 'development'>('all');
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

  const domainCards = [
    { key: 'commercial', title: 'Comercial', description: 'Volume e capacidade de conversão', value: unavailable ? 'Indisponível' : formatCurrency(data.commercial.openPipelineValue), details: `${formatCountLabel(data.commercial.openDeals, 'negócio aberto', 'negócios abertos')} · ciclo médio ${data.commercial.avgSalesCycleDays > 0 ? `${Math.round(data.commercial.avgSalesCycleDays).toLocaleString('pt-BR')} dias` : 'indisponível'}`, href: analyticsHref('commercial') },
    { key: 'customer_success', title: 'Customer Success', description: 'Carteira e cobertura de relacionamento', value: data.customerSuccess.state.status === 'empty' ? 'Indisponível' : formatCountLabel(data.customerSuccess.activeCustomers, 'cliente ativo', 'clientes ativos'), details: `${formatCountLabel(data.customerSuccess.customersWithoutOwner, 'sem responsável', 'sem responsáveis')} · ${formatCountLabel(data.customerSuccess.healthAvailable, 'sinal de saúde disponível', 'sinais de saúde disponíveis')}`, href: analyticsHref('customer-success') },
    { key: 'support', title: 'Suporte', description: 'Volume e risco da fila', value: unavailable ? 'Indisponível' : formatCountLabel(data.support.highPriorityOpen, 'alta prioridade', 'altas prioridades'), details: `${formatPercent(data.support.closedRate)} encerrados · ${formatCountLabel(data.support.closeSlaTracked, 'SLA acompanhado', 'SLAs acompanhados')}`, href: analyticsHref('support') },
    { key: 'finance', title: 'Financeiro', description: 'Qualidade da reconciliação', value: unavailable ? 'Indisponível' : formatCountLabel(data.finance.unmatchedTitles, 'título sem correspondência', 'títulos sem correspondência'), details: `${formatCurrency(data.finance.balance)} em posição atual`, href: analyticsHref('finance') },
    { key: 'product', title: 'Produto', description: 'Fonte de produto', value: 'Fonte ainda não conectada', details: data.product.reason, href: analyticsHref('product') },
    { key: 'development', title: 'Desenvolvimento', description: 'Fonte de desenvolvimento', value: 'Fonte ainda não conectada', details: data.development.reason, href: analyticsHref('development') },
  ];

  const applyFilters = (next: AnalyticsFilters) => { setFilters(next); onSharedPeriodChange?.({ from: next.from, to: next.to }); setMobileFiltersOpen(false); };

  return <div className="space-y-5" data-testid="executive-dashboard">
    <section className="flex flex-col gap-2 border-b border-[color:var(--minimal-border)] pb-3 lg:flex-row lg:items-end lg:justify-between" aria-labelledby="executive-heading">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="executive-heading" className="text-base font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">Visão Executiva</h2>
          {state ? <AnalyticsStateBadge state={state} /> : <span className="text-xs text-[color:var(--minimal-text-tertiary)]">Sem sincronização registrada</span>}
        </div>
        <p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">Desempenho no período, posição atual e exceções que exigem atenção.</p>
      </div>
      <div className="text-xs text-[color:var(--minimal-text-tertiary)]" role="status">
        {state ? formatStatusLabel(state.status, state.lastSuccessfulSyncAt) : 'Fonte sem atualização registrada'}
        {state?.lastSuccessfulSyncAt ? ` · ${formatRelativeSync(state.lastSuccessfulSyncAt)}` : ''}
      </div>
    </section>

    <div className="flex flex-wrap items-center gap-2" aria-label="Contexto e filtros da análise">
      <span className="text-xs font-semibold text-[color:var(--minimal-text)]">Contexto:</span>
      <span className="rounded-full bg-[color:var(--minimal-surface-muted)] px-2.5 py-1 text-xs text-[color:var(--minimal-text-secondary)]">{formatPeriod(filters)}</span>
      <span className="rounded-full bg-[color:var(--minimal-surface-muted)] px-2.5 py-1 text-xs text-[color:var(--minimal-text-secondary)]">{domainScope === 'all' ? 'Todos os domínios' : domainCards.find((card) => card.key === domainScope)?.title ?? 'Todos os domínios'}</span>
      <button type="button" className="ml-auto inline-flex h-9 items-center rounded-lg border border-[color:var(--minimal-border-strong)] px-3 text-sm font-medium text-[color:var(--minimal-text)] sm:hidden" aria-expanded={mobileFiltersOpen} aria-controls="executive-filters-mobile" onClick={() => setMobileFiltersOpen((open) => !open)}>Filtros</button>
    </div>

    <div id="executive-filters-mobile" className={`${mobileFiltersOpen ? 'block' : 'hidden'} sm:block`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-44"><label className="flex flex-col gap-1.5 text-xs font-medium text-[color:var(--minimal-text-secondary)]" htmlFor="executive-domain">Domínio em foco<select id="executive-domain" value={domainScope} onChange={(event) => setDomainScope(event.target.value as typeof domainScope)} className="h-9 rounded-md border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2.5 text-sm font-normal text-[color:var(--minimal-text)]"><option value="all">Todos os domínios</option><option value="commercial">Comercial</option><option value="customer_success">Customer Success</option><option value="support">Suporte</option><option value="finance">Financeiro</option><option value="product">Produto</option><option value="development">Desenvolvimento</option></select></label></div>
        <div className="min-w-0 flex-1"><Filters value={filters} onApply={applyFilters} stageOptions={[]} /></div>
      </div>
    </div>

    {refreshing ? <p className="text-xs text-[color:var(--minimal-text-secondary)]" role="status">Atualizando o período selecionado...</p> : null}
    {state?.status === 'empty' ? <p className="rounded-lg border border-dashed border-[color:var(--minimal-border-strong)] px-3 py-2 text-sm text-[color:var(--minimal-text-secondary)]" role="status">Não há registros no período selecionado. Os indicadores que dependem desse recorte ficam indisponíveis; a posição atual permanece separada.</p> : null}

    <section aria-labelledby="performance-heading"><SectionHeading id="performance-heading" title="Desempenho no período" description="Indicadores afetados pelo recorte selecionado." /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Receita ganha" value={unavailable ? 'Indisponível' : formatCurrency(data.commercial.wonRevenue)} hint={formatCountLabel(data.commercial.wonDeals, 'negócio ganho', 'negócios ganhos')} comparison={comparison.revenue ? comparison.revenue.label : undefined} temporalType="Período selecionado" state={state?.status !== 'fresh' ? state : undefined} />
      <KpiCard label="Negócios ganhos" value={unavailable ? 'Indisponível' : data.commercial.wonDeals.toLocaleString('pt-BR')} hint={formatCountLabel(data.commercial.lostDeals, 'negócio perdido', 'negócios perdidos')} comparison={comparison.deals ? comparison.deals.label : undefined} temporalType="Período selecionado" state={state?.status !== 'fresh' ? state : undefined} />
      <KpiCard label="Conversão" value={unavailable || data.commercial.wonDeals + data.commercial.lostDeals === 0 ? 'Indisponível' : formatPercent(data.commercial.conversionRate)} hint="Ganhos sobre ganhos e perdas" comparison={comparison.conversion ? comparison.conversion.label : undefined} temporalType="Período selecionado" state={state?.status !== 'fresh' ? state : undefined} />
      <KpiCard label="Tickets criados" value={unavailable ? 'Indisponível' : data.support.createdTickets.toLocaleString('pt-BR')} hint={formatCountLabel(data.support.closedTickets, 'ticket encerrado', 'tickets encerrados')} comparison={comparison.tickets ? comparison.tickets.label : undefined} temporalType="Período selecionado" state={state?.status !== 'fresh' ? state : undefined} />
    </div></section>

    <section aria-labelledby="current-heading"><SectionHeading id="current-heading" title="Posição atual" description="Posição atual, não afetada pelo período selecionado." /><div className="grid gap-3 md:grid-cols-3">{currentPosition.map((item) => <KpiCard key={item.label} {...item} />)}</div></section>

    {exceptions.length > 0 ? <section aria-labelledby="exceptions-heading"><SectionHeading id="exceptions-heading" title="Exceções que exigem atenção" description="Sinais operacionais separados da qualidade e do frescor dos dados." /><div className="grid gap-3 lg:grid-cols-3">{exceptions.map((item) => <ExceptionCard key={item.key} item={item} isDashboardViewer={isDashboardViewer} />)}</div></section> : <section className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-4 py-3" role="status"><p className="text-sm font-medium text-[color:var(--minimal-text)]">Nenhuma exceção determinística no recorte.</p></section>}

    <section aria-labelledby="domains-heading"><SectionHeading id="domains-heading" title="Resumo por domínio" description={isDashboardViewer ? 'Resumo informativo das áreas operacionais.' : 'Cada domínio destaca um sinal complementar para orientar o próximo passo.'} /><div className="grid gap-3 lg:grid-cols-3">{domainCards.filter((card) => domainScope === 'all' || card.key === domainScope).map((card) => <div key={card.key} className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] p-4"><h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">{card.title}</h3><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">{card.description}</p><p className="mt-4 text-xl font-semibold tabular-nums text-[color:var(--minimal-text)]">{card.value}</p><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">{card.details}</p>{isDashboardViewer ? <span className="mt-4 inline-block text-xs text-[color:var(--minimal-text-tertiary)]">Detalhamento restrito ao perfil</span> : <Link to={card.href} className="mt-4 inline-block text-xs font-semibold text-[color:var(--minimal-action)]">Abrir domínio <span aria-hidden="true">→</span></Link>}</div>)}</div></section>

    <section aria-labelledby="pipelines-heading"><SectionHeading id="pipelines-heading" title="Pipelines de Suporte prioritários" description="Pipelines de tickets com maior volume no período selecionado." />{pipelines.length ? <div className="overflow-hidden rounded-xl border border-[color:var(--minimal-border)]"><ul className="divide-y divide-[color:var(--minimal-border)]">{pipelines.map((pipeline) => <li key={pipeline.id}><Link to={pipeline.href} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-[color:var(--minimal-surface-muted)]"><span className="min-w-0"><span className="block truncate text-sm font-medium text-[color:var(--minimal-text)]">{pipeline.label}</span><span className="text-xs text-[color:var(--minimal-text-secondary)]">{pipeline.domain}</span></span><span className="shrink-0 text-sm font-semibold tabular-nums text-[color:var(--minimal-text)]">{formatCountLabel(pipeline.count, 'ticket', 'tickets')} <span aria-hidden="true">→</span></span></Link></li>)}</ul></div> : <div className="rounded-xl border border-dashed border-[color:var(--minimal-border-strong)] px-4 py-5 text-sm text-[color:var(--minimal-text-secondary)]">Nenhum pipeline de Suporte com atividade no período selecionado.</div>}</section>

    {isDashboardViewer ? null : <details className="rounded-xl border border-[color:var(--minimal-border)]"><summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[color:var(--minimal-text)]">Análises avançadas</summary><div className="border-t border-[color:var(--minimal-border)] px-4 py-3 text-xs text-[color:var(--minimal-text-secondary)]">Aprofundamentos financeiros e históricos permanecem disponíveis nos domínios correspondentes.</div></details>}
  </div>;
}

function ExceptionCard({ item, isDashboardViewer }: { item: ReturnType<typeof buildExecutiveExceptions>[number]; isDashboardViewer: boolean }) {
  const content = <><span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--minimal-text-secondary)]">{item.domain}</span><h3 className="mt-2 text-sm font-semibold text-[color:var(--minimal-text)]">{item.title}</h3><p className="mt-1 text-sm text-[color:var(--minimal-text-secondary)]">{item.detail}</p>{!isDashboardViewer ? <span className="mt-3 inline-block text-xs font-semibold text-[color:var(--minimal-action)]">{item.action} <span aria-hidden="true">→</span></span> : null}</>;
  return isDashboardViewer ? <div className={`rounded-xl border p-4 ${item.severity === 3 ? 'border-[color:var(--minimal-danger-border)] bg-[color:var(--minimal-danger-surface)]' : 'border-[color:var(--minimal-warning-border)] bg-[color:var(--minimal-warning-surface)]'}`}>{content}</div> : <Link to={item.href} className={`rounded-xl border p-4 transition hover:border-[color:var(--minimal-border-strong)] ${item.severity === 3 ? 'border-[color:var(--minimal-danger-border)] bg-[color:var(--minimal-danger-surface)]' : 'border-[color:var(--minimal-warning-border)] bg-[color:var(--minimal-warning-surface)]'}`}>{content}</Link>;
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) { return <div className="mb-3"><h2 id={id} className="text-sm font-semibold text-[color:var(--minimal-text)]">{title}</h2><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">{description}</p></div>; }
function StatePanel({ title, description, onRetry }: { title: string; description: string; onRetry?: () => void }) { return <section className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] px-5 py-8 text-center" role="alert"><h2 className="text-base font-semibold text-[color:var(--minimal-text)]">{title}</h2><p className="mt-1 text-sm text-[color:var(--minimal-text-secondary)]">{description}</p><div className="mt-4 flex justify-center"><AnalyticsRetryAction onRetry={onRetry} /></div></section>; }
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
