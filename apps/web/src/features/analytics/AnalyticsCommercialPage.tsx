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
    return <MinimalState tone="critical" title="Nao foi possivel carregar" description={state.message} />;
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
        <KpiCard label="Deals totais" value={kpis.totalDeals.toLocaleString('pt-BR')} hint="No pipeline configurado" source="Fonte: HubSpot Deals. Contagem dos registros sincronizados no pipeline comercial ativo, respeitando período e filtros." />
        <KpiCard label="Deals abertos" value={kpis.openDeals.toLocaleString('pt-BR')} hint="Fora de estágio fechado" source="Fonte: HubSpot Deals + estágios. Deal aberto é aquele cujo estágio não está marcado como fechado na configuração sincronizada." />
        <KpiCard label="Deals ganhos" value={kpis.wonDeals.toLocaleString('pt-BR')} hint={`${kpis.lostDeals} perdidos`} source="Fonte: HubSpot Deals + pipeline_stages. Ganho usa o estágio cujo is_won veio marcado pela API do HubSpot." />
        <KpiCard label="Receita ganha" value={formatCurrencyBRL(kpis.wonRevenue)} hint="amount_in_home_currency" source="Fonte: HubSpot Deals, propriedade amount_in_home_currency. Soma apenas dos deals em estágio ganho." />
        <KpiCard label="Conversão" value={formatPercent(kpis.conversionRate)} hint="Ganho / (Ganho + Perdido)" source="Cálculo no Postgres: deals ganhos divididos pelos deals em estágios fechados. Deals abertos ficam fora do denominador." />
        <KpiCard label="Ticket médio" value={formatCurrencyBRL(kpis.avgTicket)} hint="Receita ganha / deals ganhos" source="Cálculo no Postgres: receita ganha dividida pela quantidade de deals ganhos no recorte." />
      </div> : null}

      {kpis.totalDeals > 0 ? <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Funil por estagio" description="Contagem de deals em cada estagio do pipeline">
          {funnel.length > 0 ? (
            <CommercialFunnelChart data={funnel} />
          ) : (
            <MinimalState title="Sem estagios" description="Rode a sincronizacao para carregar os estagios." />
          )}
        </ChartCard>

        <ChartCard title="Tendencia mensal" description="Deals criados e ganhos por mes de criacao">
          {monthly.length > 0 ? (
            <CommercialMonthlyChart data={monthly} />
          ) : (
            <MinimalState title="Sem historico" description="Ainda nao ha deals sincronizados." />
          )}
        </ChartCard>
      </div> : null}

      {kpis.totalDeals > 0 ? <ChartCard title="Deals por responsavel" description="Dono geral do deal (hubspot_owner_id)">
        {byOwner.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-[color:var(--minimal-border)] text-left text-xs text-[color:var(--minimal-text-tertiary)]">
                  <th className="py-2 pr-4 font-medium">Responsavel</th>
                  <th className="py-2 pr-4 text-right font-medium">Deals</th>
                  <th className="py-2 pr-4 text-right font-medium">Ganhos</th>
                  <th className="py-2 text-right font-medium">Receita ganha</th>
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
          <MinimalState title="Sem responsaveis" description="Nenhum deal atribuido no periodo." />
        )}
      </ChartCard> : null}
    </div>
  );
}
