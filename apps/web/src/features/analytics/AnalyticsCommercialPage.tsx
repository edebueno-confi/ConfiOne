import { useEffect, useState } from 'react';
import { MinimalState } from '../../components/minimal-states';
import { getCommercialSnapshot } from './analytics-api';
import {
  formatCurrencyBRL,
  formatPercent,
  type CommercialByOwner,
  type CommercialFunnelStage,
  type CommercialKpis,
  type CommercialMonthlyPoint,
  type AnalyticsFilters,
  DEFAULT_ANALYTICS_FILTERS,
} from './analytics-model';
import { ChartCard, KpiCard } from './analytics-ui';
import { AnalyticsFilters as AnalyticsFiltersBar } from './AnalyticsFilters';
import { resolveAnalyticsPeriod } from './analytics-periods';
import type { AnalyticsPageProps } from './analytics-model';
import { CommercialFunnelChart, CommercialMonthlyChart } from './charts/AnalyticsCharts';

type State =
  | { phase: 'loading' }
  | {
      phase: 'ready';
      kpis: CommercialKpis;
      funnel: CommercialFunnelStage[];
      byOwner: CommercialByOwner[];
      monthly: CommercialMonthlyPoint[];
    }
  | { phase: 'error'; message: string };

export function AnalyticsCommercialPage({ sharedPeriod, onSharedPeriodChange }: AnalyticsPageProps) {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const period = sharedPeriod ?? resolveAnalyticsPeriod('month');
  const [filters, setFilters] = useState<AnalyticsFilters>({ ...DEFAULT_ANALYTICS_FILTERS, ...period });

  useEffect(() => { setFilters((current) => ({ ...current, ...period })); }, [period.from, period.to]);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: 'loading' });

    getCommercialSnapshot(filters)
      .then((snapshot) => {
        if (!cancelled) setState({ phase: 'ready', ...snapshot });
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            phase: 'error',
            message:
              error instanceof Error ? error.message : 'Falha ao carregar os dados comerciais.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  if (state.phase === 'loading') {
    return (
      <MinimalState
        loading
        title="Carregando comercial"
        description="O Gênio está consultando os deals sincronizados do HubSpot."
      />
    );
  }

  if (state.phase === 'error') {
    return <MinimalState tone="critical" title="Não foi possível carregar" description={state.message} />;
  }

  const { kpis, funnel, byOwner, monthly } = state;
  const stageOptions = funnel.map((stage) => ({ value: stage.stageId, label: stage.label }));
  const ownerOptions = byOwner.filter((owner) => owner.ownerId).map((owner) => ({ value: owner.ownerId as string, label: owner.ownerName }));

  return (
    <div className="space-y-5">
      <AnalyticsFiltersBar value={filters} onApply={(next) => { setFilters(next); onSharedPeriodChange?.({ from: next.from, to: next.to }); }} stageOptions={stageOptions} ownerOptions={ownerOptions} />
      {kpis.totalDeals === 0 ? (
        <MinimalState title="Nenhum dado neste recorte" description="Ajuste os filtros ou execute uma sincronização concluída para consultar o histórico." />
      ) : null}
      {kpis.totalDeals > 0 ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Negócios totais" value={kpis.totalDeals.toLocaleString('pt-BR')} hint="No funil comercial" source="Total de negócios no funil comercial, considerando o período e os filtros selecionados." />
        <KpiCard label="Em aberto" value={kpis.openDeals.toLocaleString('pt-BR')} hint="Ainda não fechados" source="Negócios que ainda não chegaram a um estágio de fechado (nem ganho, nem perdido)." />
        <KpiCard label="Ganhos" value={kpis.wonDeals.toLocaleString('pt-BR')} hint={`${kpis.lostDeals.toLocaleString('pt-BR')} perdidos`} source="Negócios fechados como ganhos no período." />
        <KpiCard label="Receita ganha" value={formatCurrencyBRL(kpis.wonRevenue)} hint="Negócios ganhos" source="Soma do valor dos negócios ganhos no período." />
        <KpiCard label="Conversão" value={formatPercent(kpis.conversionRate)} hint="Ganhos sobre fechados" source="Negócios ganhos divididos pelo total de negócios fechados (ganhos mais perdidos). Os em aberto não entram na conta." tone={kpis.conversionRate >= 0.3 ? 'neutral' : 'warning'} />
        <KpiCard label="Ticket médio" value={formatCurrencyBRL(kpis.avgTicket)} hint="Por negócio ganho" source="Receita ganha dividida pela quantidade de negócios ganhos no período." />
      </div> : null}

      {kpis.totalDeals > 0 ? <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Funil por estágio" description="Quantidade de negócios em cada estágio do funil comercial.">
          {funnel.length > 0 ? (
            <CommercialFunnelChart data={funnel} />
          ) : (
            <MinimalState title="Sem estágios" description="Execute uma sincronização para carregar os estágios do funil." />
          )}
        </ChartCard>

        <ChartCard title="Tendência mensal" description="Negócios criados e ganhos por mês.">
          {monthly.length > 0 ? (
            <CommercialMonthlyChart data={monthly} />
          ) : (
            <MinimalState title="Sem histórico" description="Ainda não há negócios sincronizados no período." />
          )}
        </ChartCard>
      </div> : null}

      {kpis.totalDeals > 0 ? <ChartCard title="Negócios por responsável" description="Responsável pelo negócio no HubSpot.">
        {byOwner.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-[color:var(--minimal-border)] text-left text-[11px] font-semibold uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]">
                  <th className="py-2 pr-4">Responsável</th>
                  <th className="py-2 pr-4 text-right">Negócios</th>
                  <th className="py-2 pr-4 text-right">Ganhos</th>
                  <th className="py-2 text-right">Receita ganha</th>
                </tr>
              </thead>
              <tbody>
                {byOwner.map((owner) => (
                  <tr
                    key={owner.ownerId ?? owner.ownerName}
                    className="border-b border-[color:var(--minimal-border)] last:border-0"
                  >
                    <td className="py-2 pr-4 text-[color:var(--minimal-text)]">{owner.ownerName}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text)]">
                      {owner.dealCount.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text)]">
                      {owner.wonCount.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 text-right tabular-nums text-[color:var(--minimal-text)]">
                      {formatCurrencyBRL(owner.wonRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <MinimalState title="Sem responsáveis" description="Nenhum negócio atribuído no período." />
        )}
      </ChartCard> : null}
    </div>
  );
}
