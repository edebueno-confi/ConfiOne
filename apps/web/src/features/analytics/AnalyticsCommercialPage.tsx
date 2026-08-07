import { useEffect, useState } from 'react';
import { MinimalState } from '../../components/minimal-states';
import { getCommercialKpisV2, getCommercialSnapshot, listAnalyticsSourceConfig, listHubspotSyncRuns } from './analytics-api';
import {
  formatCurrencyBRL,
  formatPercent,
  type CommercialByOwner,
  type CommercialFunnelStage,
  type CommercialKpis,
  type CommercialMonthlyPoint,
  type CommercialByPipeline,
  type CommercialSnapshot,
  type AnalyticsFilters,
  type AnalyticsPageProps,
  type AnalyticsSourceConfig,
  DEFAULT_ANALYTICS_FILTERS,
  analyticsSourceToBlockState,
} from './analytics-model';
import { AnalyticsLoadingState, AnalyticsRetryAction, ChartCard, KpiCard, MetricInfo, formatCountLabel } from './analytics-ui';
import { AnalyticsFilters as AnalyticsFiltersBar } from './AnalyticsFilters';
import { AnalyticsPipelineCombobox } from './AnalyticsPipelineCombobox';
import { resolveAnalyticsPeriod } from './analytics-periods';
import type { AnalyticsBlockState } from '@genius-support-os/contracts';
import { CommercialFunnelChart, CommercialMonthlyChart } from './charts/AnalyticsCharts';
import { AnalyticsExecutionMeta, AnalyticsHdDomainFrame } from './AnalyticsHdDomainFrame';
import { AnalyticsBoardLimitations, AnalyticsKpiBoard, type BoardBand } from './AnalyticsKpiBoard';

// Indicadores com coorte declarada, publicados pelo read model de KPI.
// Pipeline e posicao na data de corte; criados usam data de criacao; ganhos,
// win rate, ticket e ciclo usam data de fechamento. Misturar as tres coortes
// sob o mesmo filtro foi o erro que a versao anterior cometia em silencio.
const COMMERCIAL_BANDS: BoardBand[] = [
  {
    title: 'Agora',
    note: 'Posição na data de hoje; não muda com o período selecionado.',
    items: [
      { key: 'open_pipeline_amount', kind: 'currency', note: 'Soma dos negócios ainda em aberto' },
      { key: 'weighted_pipeline_amount', kind: 'currency', note: 'Ajustado pela chance de fechar de cada etapa' },
    ],
  },
  {
    title: 'No período',
    note: 'Movimento dentro do recorte selecionado acima.',
    items: [
      { key: 'won_amount', kind: 'currency', note: 'Negócios ganhos' },
      { key: 'win_rate', kind: 'percent', note: 'Ganhos sobre tudo que foi encerrado' },
      { key: 'created_deals', kind: 'count', note: 'Novos negócios iniciados' },
      { key: 'median_sales_cycle_days', kind: 'days', note: 'Da abertura até o ganho' },
    ],
  },
  {
    title: 'Apoio',
    dense: true,
    items: [
      { key: 'median_deal_amount', kind: 'currency', note: 'Valor típico; resiste a negócio atípico' },
      { key: 'avg_deal_amount', kind: 'currency', note: 'Complemento do valor típico' },
    ],
  },
];

type State =
  | { phase: 'loading' }
  | {
      phase: 'ready';
      kpis: CommercialKpis;
      funnel: CommercialFunnelStage[];
      byPipeline: CommercialByPipeline[];
      byOwner: CommercialByOwner[];
      monthly: CommercialMonthlyPoint[];
      state?: AnalyticsBlockState;
    }
  | { phase: 'error'; message: string };

export function AnalyticsCommercialPage({ sharedPeriod, onSharedPeriodChange, onRetry, sourceStatus }: AnalyticsPageProps) {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const period = sharedPeriod ?? resolveAnalyticsPeriod('month');
  const [filters, setFilters] = useState<AnalyticsFilters>({ ...DEFAULT_ANALYTICS_FILTERS, ...period });
  const [configuredPipelines, setConfiguredPipelines] = useState<AnalyticsSourceConfig[]>([]);
  const [excludedPipelineIds, setExcludedPipelineIds] = useState<string[]>([]);
  const [latestHubspotRun, setLatestHubspotRun] = useState<import('./analytics-model').SyncRun | null>(null);
  const [kpiPayload, setKpiPayload] = useState<unknown>(null);

  useEffect(() => {
    setFilters((current) => current.from === period.from && current.to === period.to ? current : { ...current, ...period });
  }, [period.from, period.to]);

  useEffect(() => {
    let cancelled = false;
    setState((current) => current.phase === 'ready' ? current : { phase: 'loading' });

    void getCommercialKpisV2(filters)
      .then((payload) => { if (!cancelled) setKpiPayload(payload); })
      .catch(() => { if (!cancelled) setKpiPayload(null); });

    Promise.all([getCommercialSnapshot(filters, excludedPipelineIds), listAnalyticsSourceConfig(), listHubspotSyncRuns()])
      .then(([snapshot, configs, runs]) => {
        if (!cancelled) {
          const activeConfigs = configs.filter((config) => config.domainKey === 'commercial' && config.objectType === 'deal' && config.isActive);
          setConfiguredPipelines(activeConfigs);
          setLatestHubspotRun(runs[0] ?? null);
          setState({ phase: 'ready', ...applyConfiguredPipelineLabels(snapshot, activeConfigs) });
        }
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
  }, [filters, excludedPipelineIds]);

  if (state.phase === 'loading') {
    return <AnalyticsHdDomainFrame title="Comercial" description="Receita, pipeline e conversão para decisão comercial." source="HubSpot · Deals"><AnalyticsLoadingState title="Carregando comercial" description="O Gênio está consultando os negócios sincronizados do HubSpot." /></AnalyticsHdDomainFrame>;
  }

  if (state.phase === 'error') {
    return <AnalyticsHdDomainFrame title="Comercial" description="Receita, pipeline e conversão para decisão comercial." source="HubSpot · Deals"><MinimalState tone="critical" title="Não foi possível carregar" description="Os indicadores comerciais estão indisponíveis no momento." actions={<AnalyticsRetryAction onRetry={onRetry} />} /></AnalyticsHdDomainFrame>;
  }

  const { kpis, funnel, byPipeline, byOwner, monthly, state: dataState } = state;
  const displayState = sourceStatus ? analyticsSourceToBlockState(sourceStatus.hubspot) : dataState;
  const stageOptions = funnel.map((stage) => ({ value: stage.stageId, label: stage.label }));
  const ownerOptions = byOwner.filter((owner) => owner.ownerId).map((owner) => ({ value: owner.ownerId as string, label: owner.ownerName }));
  const pipelineOptions = configuredPipelines.map((pipeline) => {
    const observed = byPipeline.find((item) => item.pipelineId === pipeline.pipelineId);
    return { ...pipeline, dealCount: observed?.dealCount ?? 0 };
  });

  return (
    <AnalyticsHdDomainFrame title="Comercial" description="Receita, pipeline e conversão para decisão comercial." source="HubSpot · Deals" state={displayState} headerAside={<AnalyticsExecutionMeta provider="HubSpot" run={latestHubspotRun} />}>
    <div className="gso-hd-domain-surface gso-pilot-commercial space-y-5">
      <AnalyticsFiltersBar value={filters} onApply={(next) => { setFilters(next); onSharedPeriodChange?.({ from: next.from, to: next.to }); }} stageOptions={stageOptions} ownerOptions={ownerOptions} extraFields={pipelineOptions.length > 0 ? <AnalyticsPipelineCombobox inline storageKey="analytics-commercial-pipelines" pipelines={pipelineOptions.map((pipeline) => ({ ...pipeline, count: pipeline.dealCount }))} excludedPipelineIds={excludedPipelineIds} onChange={setExcludedPipelineIds} /> : null} />
      {dataState?.status === 'empty' ? (
        <MinimalState title="Nenhum dado neste recorte" description="Ajuste os filtros ou execute uma sincronização concluída para consultar o histórico." />
      ) : null}
      {kpiPayload ? (
        <>
          <AnalyticsKpiBoard payload={kpiPayload} bands={COMMERCIAL_BANDS} />
          <AnalyticsBoardLimitations payload={kpiPayload} />
        </>
      ) : null}


      {dataState?.status !== 'empty' ? <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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

      {dataState?.status !== 'empty' ? <ChartCard title="Negócios por responsável" description="Responsável pelo negócio no HubSpot.">
        {byOwner.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="gso-analytics-responsive-table w-full min-w-[520px] text-sm">
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
                    <td data-label="Responsável" className="py-2 pr-4 text-[color:var(--minimal-text)]">{owner.ownerName}</td>
                    <td data-label="Negócios" className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text)]">
                      {owner.dealCount.toLocaleString('pt-BR')}
                    </td>
                    <td data-label="Ganhos" className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text)]">
                      {owner.wonCount.toLocaleString('pt-BR')}
                    </td>
                    <td data-label="Receita ganha" className="py-2 text-right tabular-nums text-[color:var(--minimal-text)]">
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
    </AnalyticsHdDomainFrame>
  );
}

function applyConfiguredPipelineLabels(snapshot: CommercialSnapshot, configs: AnalyticsSourceConfig[]): CommercialSnapshot {
  const labels = new Map(configs.map((config) => [config.pipelineId, config.label]));
  return {
    ...snapshot,
    byPipeline: snapshot.byPipeline.map((pipeline) => ({
      ...pipeline,
      label: labels.get(pipeline.pipelineId) || pipeline.label,
    })),
  };
}

function CommercialPipelineScopeFilter({
  pipelines,
  excludedPipelineIds,
  onChange,
}: {
  pipelines: Array<AnalyticsSourceConfig & { dealCount: number }>;
  excludedPipelineIds: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (pipelineId: string) => {
    onChange(excludedPipelineIds.includes(pipelineId)
      ? excludedPipelineIds.filter((id) => id !== pipelineId)
      : [...excludedPipelineIds, pipelineId]);
  };

  return <ChartCard title="Pipelines incluídos no recorte" description="Todos os pipelines comerciais ativos começam selecionados. Desmarque um para analisar somente os negócios desejados; a configuração persistida não é alterada.">
    <div className="flex flex-wrap gap-2">
      {pipelines.map((pipeline) => {
        const included = !excludedPipelineIds.includes(pipeline.pipelineId);
        return <label key={pipeline.id} className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors ${included ? 'border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text)]' : 'border-[color:var(--minimal-border)] text-[color:var(--minimal-text-tertiary)]'}`}>
          <input type="checkbox" checked={included} onChange={() => toggle(pipeline.pipelineId)} className="accent-[color:var(--minimal-text)]" />
          <span className="min-w-0"><span className="block truncate font-medium" title={pipeline.label}>{pipeline.label}</span><span className="block truncate text-[10px] opacity-60" title={pipeline.hubspotLabel || undefined}>HubSpot: {pipeline.hubspotLabel || 'nome ainda não sincronizado'}</span></span>
          <span className="shrink-0 font-mono text-[10px] opacity-60">{pipeline.pipelineId}</span>
          <span className="shrink-0 tabular-nums opacity-70">{pipeline.dealCount.toLocaleString('pt-BR')}</span>
          <MetricInfo ariaLabel={`Origem do pipeline ${pipeline.label}`} content={<div className="space-y-2 text-left"><p className="font-semibold">Origem do pipeline</p><p>Objeto: Deal (Comercial).</p><p>Nome oficial: {pipeline.hubspotLabel || 'aguardando sincronização'}.</p><p>Alias exibido no painel: {pipeline.alias || 'usa o nome oficial do HubSpot'}.</p><p>ID imutável: {pipeline.pipelineId}.</p></div>} />
        </label>;
      })}
      {excludedPipelineIds.length > 0 ? <button type="button" onClick={() => onChange([])} className="rounded-md border border-[color:var(--minimal-border-strong)] px-3 py-2 text-xs font-medium text-[color:var(--minimal-text)] hover:bg-[color:var(--minimal-surface-muted)]">Incluir todos</button> : null}
    </div>
    <p className="mt-3 text-xs text-[color:var(--minimal-text-tertiary)]">{excludedPipelineIds.length ? `${excludedPipelineIds.length} pipeline(s) excluído(s) somente deste recorte.` : 'O recorte atual considera todos os pipelines comerciais ativos configurados.'}</p>
  </ChartCard>;
}
