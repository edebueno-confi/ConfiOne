import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { MinimalState } from '../../components/minimal-states';
import { getCsSnapshot } from './analytics-api';
import {
  formatPercent,
  type CsByStatus,
  type CsKpis,
  type CsMonthlyPoint,
  type CsSourcePoint,
  type CsPipelinePoint,
  type CsOwnerPoint,
  type CsPipelineBreakdown,
  type CsSnapshot,
  type AnalyticsFilters,
  DEFAULT_ANALYTICS_FILTERS,
  type AnalyticsSourceConfig,
} from './analytics-model';
import { AnalyticsLoadingState, AnalyticsRetryAction, ChartCard, KpiCard, MetricInfo } from './analytics-ui';
import { AnalyticsFilters as AnalyticsFiltersBar } from './AnalyticsFilters';
import { AnalyticsPipelineCombobox } from './AnalyticsPipelineCombobox';
import { resolveAnalyticsPeriod } from './analytics-periods';
import { TicketMonthlyChart, TicketStatusChart } from './charts/AnalyticsCharts';
import { listAnalyticsSourceConfig } from './analytics-api';
import type { AnalyticsPageProps } from './analytics-model';
import type { AnalyticsBlockState } from '@genius-support-os/contracts';

type State =
  | { phase: 'loading' }
  | { phase: 'ready'; kpis: CsKpis; byStatus: CsByStatus[]; monthly: CsMonthlyPoint[]; bySource: CsSourcePoint[]; byPipeline: CsPipelinePoint[]; byOwner: CsOwnerPoint[]; latestTicketCreatedAt: string | null; state?: AnalyticsBlockState }
  | { phase: 'error'; message: string };

type PipelineFilterOption = AnalyticsSourceConfig & Pick<CsPipelinePoint, 'ticketCount' | 'sourceSummary'>;

export function AnalyticsCsPage({ sharedPeriod, onSharedPeriodChange, onRetry }: AnalyticsPageProps) {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const period = sharedPeriod ?? resolveAnalyticsPeriod('month');
  const [filters, setFilters] = useState<AnalyticsFilters>({ ...DEFAULT_ANALYTICS_FILTERS, ...period });
  const [configuredPipelines, setConfiguredPipelines] = useState<AnalyticsSourceConfig[]>([]);
  const [excludedPipelineIds, setExcludedPipelineIds] = useState<string[]>([]);

  useEffect(() => { setFilters((current) => ({ ...current, ...period })); }, [period.from, period.to]);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: 'loading' });

    Promise.all([getCsSnapshot(filters, excludedPipelineIds), listAnalyticsSourceConfig()])
      .then(([snapshot, configs]) => {
        if (!cancelled) {
          const activeConfigs = configs.filter((config) => config.domainKey === 'cs' && config.objectType === 'ticket' && config.isActive);
          const labeledSnapshot = applyConfiguredPipelineLabels(snapshot, activeConfigs);
          setConfiguredPipelines(activeConfigs);
          setState({ phase: 'ready', ...labeledSnapshot });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            phase: 'error',
            message:
              error instanceof Error ? error.message : 'Falha ao carregar os dados de suporte.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filters, excludedPipelineIds]);

  if (state.phase === 'loading') {
    return (
      <AnalyticsLoadingState title="Carregando suporte" description="O Gênio está consultando os tickets sincronizados do HubSpot." />
    );
  }

  if (state.phase === 'error') {
    return <MinimalState tone="critical" title="Não foi possível carregar" description="Os indicadores de suporte estão indisponíveis no momento." actions={<AnalyticsRetryAction onRetry={onRetry} />} />;
  }

  const { kpis, byStatus, monthly, bySource, byPipeline, byOwner, latestTicketCreatedAt, state: dataState } = state;
  const stageOptions = byStatus.map((status) => ({ value: status.stageId, label: status.label }));
  const priorityOptions = [{ value: 'HIGH', label: 'Alta' }, { value: 'MEDIUM', label: 'Média' }, { value: 'LOW', label: 'Baixa' }];
  const pipelineOptions: PipelineFilterOption[] = configuredPipelines.map((pipeline) => {
    const observed = byPipeline.find((item) => item.pipelineId === pipeline.pipelineId);
    return { ...pipeline, ticketCount: observed?.ticketCount ?? 0, sourceSummary: observed?.sourceSummary ?? [] };
  });

  return (
    <div className="space-y-5">
      <AnalyticsFiltersBar value={filters} onApply={(next) => { setFilters(next); onSharedPeriodChange?.({ from: next.from, to: next.to }); }} stageOptions={stageOptions} priorityOptions={priorityOptions} stageLabel="Status" />
      {pipelineOptions.length > 0 ? <AnalyticsPipelineCombobox storageKey="analytics-cs-pipelines" pipelines={pipelineOptions.map((pipeline) => ({ ...pipeline, count: pipeline.ticketCount }))} excludedPipelineIds={excludedPipelineIds} onChange={setExcludedPipelineIds} /> : null}
      {dataState?.status === 'empty' ? <MinimalState title="Nenhum dado neste recorte" description="Ajuste os filtros ou execute uma sincronização concluída para consultar o histórico." /> : null}
      {dataState?.status !== 'empty' ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard state={dataState} temporalType="Fluxo no período" label="Tickets totais" value={kpis.totalTickets.toLocaleString('pt-BR')} hint="Nos pipelines de suporte" source="Total de tickets nos pipelines de suporte ativos, considerando o período e os filtros selecionados." />
        <KpiCard state={dataState} temporalType="Posição dos registros" label="Abertos" value={kpis.openTickets.toLocaleString('pt-BR')} hint="Ainda não encerrados" source="Tickets que ainda não estão em um estágio de encerrado." />
        <KpiCard state={dataState} temporalType="Fluxo no período" label="Encerrados" value={kpis.closedTickets.toLocaleString('pt-BR')} hint="Em estágio de encerrado" source="Tickets que já estão em um estágio de encerrado." />
        <KpiCard state={dataState} temporalType="Fluxo no período" label="% Encerrados" value={formatPercent(kpis.closedRate)} hint="Encerrados sobre o total" source="Tickets encerrados divididos pelo total de tickets do período." />
      </div> : null}

      {dataState?.status !== 'empty' ? <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Tickets por status" description="Status com o mesmo nome são consolidados; o tooltip mostra a distribuição por pipeline.">
          {byStatus.length > 0 ? (
            <TicketStatusChart data={byStatus} />
          ) : (
            <MinimalState title="Sem estágios" description="Execute uma sincronização para carregar os estágios." />
          )}
        </ChartCard>

        <ChartCard title="Tendência mensal" description="Tickets criados e encerrados por mês.">
          {monthly.length > 0 ? (
            <TicketMonthlyChart data={monthly} />
          ) : (
            <MinimalState title="Sem histórico" description="Ainda não há tickets sincronizados no período." />
          )}
        </ChartCard>
      </div> : null}
      {dataState?.status !== 'empty' ? <ChartCard title="Origem, pipeline e responsável" description={`O recorte reúne os pipelines ativos de CS / Suporte. Último ticket criado no cache: ${latestTicketCreatedAt ? new Date(latestTicketCreatedAt).toLocaleString('pt-BR') : 'indisponível'}.`}>
        <div className="grid gap-4 lg:grid-cols-3"><Breakdown title="Por origem" rows={bySource.map((row) => ({ label: row.label, value: row.ticketCount }))} /><Breakdown title="Por pipeline" rows={byPipeline.map((row) => ({ label: row.label, value: row.ticketCount }))} /><Breakdown title="Por responsável" rows={byOwner.slice(0, 8).map((row) => ({ label: row.ownerName, value: row.ticketCount }))} /></div>
        <OwnerPipelineNote owners={byOwner.slice(0, 8)} />
      </ChartCard> : null}
    </div>
  );
}

function applyConfiguredPipelineLabels(snapshot: CsSnapshot, configs: AnalyticsSourceConfig[]): CsSnapshot {
  const labels = new Map(configs.map((config) => [config.pipelineId, config.label]));
  const label = (pipelineId: string, current: string) => current || labels.get(pipelineId) || pipelineId;
  const breakdown = (rows?: CsPipelineBreakdown[]) => rows?.map((row) => ({ ...row, pipelineLabel: label(row.pipelineId, row.pipelineLabel) }));
  return {
    ...snapshot,
    byPipeline: snapshot.byPipeline.map((row) => ({ ...row, label: label(row.pipelineId, row.label) })),
    byStatus: snapshot.byStatus.map((row) => ({ ...row, pipelineBreakdown: breakdown(row.pipelineBreakdown) })),
    byOwner: snapshot.byOwner.map((row) => ({ ...row, pipelineBreakdown: breakdown(row.pipelineBreakdown) })),
  };
}

function PipelineScopeFilter({ pipelines, excludedPipelineIds, onChange }: { pipelines: PipelineFilterOption[]; excludedPipelineIds: string[]; onChange: (next: string[]) => void }) {
  const toggle = (pipelineId: string) => {
    onChange(excludedPipelineIds.includes(pipelineId) ? excludedPipelineIds.filter((id) => id !== pipelineId) : [...excludedPipelineIds, pipelineId]);
  };
  return <ChartCard title="Pipelines incluídos no recorte" description="Todos começam selecionados. Desmarque um pipeline para recalcular somente o atendimento desejado; a configuração persistida permanece intacta.">
    <div className="flex flex-wrap gap-2">
      {pipelines.map((pipeline) => {
        const included = !excludedPipelineIds.includes(pipeline.pipelineId);
        return <label key={pipeline.id} className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors ${included ? 'border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text)]' : 'border-[color:var(--minimal-border)] text-[color:var(--minimal-text-tertiary)]'}`}>
          <input type="checkbox" checked={included} onChange={() => toggle(pipeline.pipelineId)} className="accent-[color:var(--minimal-text)]" />
          <span className="min-w-0"><span className="block truncate font-medium" title={pipeline.label}>{pipeline.label}</span><span className="block truncate text-[10px] opacity-60" title={pipeline.hubspotLabel || undefined}>HubSpot: {pipeline.hubspotLabel || 'nome ainda não sincronizado'}</span></span>
          <span className="shrink-0 font-mono text-[10px] opacity-60">{pipeline.pipelineId}</span>
          <MetricInfo ariaLabel={`Origem do pipeline ${pipeline.label}`} content={<PipelineOriginHint pipeline={pipeline} />} />
        </label>;
      })}
      {excludedPipelineIds.length > 0 ? <button type="button" onClick={() => onChange([])} className="rounded-md border border-[color:var(--minimal-border-strong)] px-3 py-2 text-xs font-medium text-[color:var(--minimal-text)] hover:bg-[color:var(--minimal-surface-muted)]">Incluir todos</button> : null}
    </div>
    <p className="mt-3 text-xs text-[color:var(--minimal-text-tertiary)]">{excludedPipelineIds.length ? `${excludedPipelineIds.length} pipeline(s) excluído(s) temporariamente deste recorte.` : 'O recorte atual considera todos os pipelines CS / Suporte ativos.'}</p>
  </ChartCard>;
}

function PipelineOriginHint({ pipeline }: { pipeline: PipelineFilterOption }) {
  const sources = pipeline.sourceSummary ?? [];
  const total = pipeline.ticketCount;
  const missing = sources.find((source) => source.label.toLowerCase() === 'sem fonte')?.ticketCount ?? 0;
  const known = sources.filter((source) => source.label.toLowerCase() !== 'sem fonte');
  const knownTotal = known.reduce((sum, source) => sum + source.ticketCount, 0);
  const confidence = !sources.length || !known.length ? 'Indisponível' : missing ? 'Parcial' : 'Observada';

  return <div className="space-y-3 text-left">
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]">Origem do pipeline</p>
      <p className="mt-1 font-semibold text-[color:var(--minimal-text)]">{pipeline.label}</p>
      <p className="mt-1 text-[11px] text-[color:var(--minimal-text-secondary)]">HubSpot: {pipeline.hubspotLabel || 'nome ainda não sincronizado'}</p>
      <p className="mt-0.5 font-mono text-[11px] text-[color:var(--minimal-text-tertiary)]">ID {pipeline.pipelineId}</p>
    </div>

    <InfoRow label="Evidência usada">
      Origem do ticket informada pelo HubSpot, no recorte atual.
    </InfoRow>

    <InfoRow label={`Distribuição observada · ${total.toLocaleString('pt-BR')} ticket(s)`}>
      {known.length ? <ul className="space-y-1">
        {known.slice(0, 5).map((source) => <li key={source.label} className="flex items-center justify-between gap-3"><span>{formatTicketSource(source.label)}</span><span className="font-semibold tabular-nums text-[color:var(--minimal-text)]">{source.ticketCount.toLocaleString('pt-BR')} <span className="font-normal text-[color:var(--minimal-text-tertiary)]">({formatShare(source.ticketCount, total)})</span></span></li>)}
        {known.length > 5 ? <li className="text-[color:var(--minimal-text-tertiary)]">+ {known.length - 5} outras classificações.</li> : null}
      </ul> : <span>Nenhum ticket veio com a origem preenchida.</span>}
    </InfoRow>

    <InfoRow label="Cobertura da evidência">
      <span className={confidence === 'Observada' ? 'font-semibold text-[color:var(--minimal-action)]' : 'font-semibold text-[color:var(--minimal-warning-text)]'}>{confidence}</span>{' · '}{knownTotal.toLocaleString('pt-BR')} ticket(s) classificados{missing ? `; ${missing.toLocaleString('pt-BR')} sem origem preenchida` : ''}.
    </InfoRow>

    <InfoRow label="O que ainda não é possível afirmar">
      <span>O painel não recebeu o identificador do widget, formulário, URL do site, inbox ou número de WhatsApp. Portanto, <strong>Chat/widget</strong>, <strong>Formulário</strong> e <strong>WhatsApp</strong> são canais observados, não uma prova do ponto de entrada específico.</span>
    </InfoRow>
  </div>;
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="border-t border-[color:var(--minimal-border)] pt-2 first:border-0 first:pt-0"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]">{label}</p><div className="text-[11px] leading-4 text-[color:var(--minimal-text-secondary)]">{children}</div></div>;
}

function formatShare(value: number, total: number): string {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function formatTicketSource(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'CHAT') return 'Chat/widget';
  if (normalized === 'FORM') return 'Formulário';
  if (normalized === 'EMAIL') return 'E-mail';
  if (normalized === 'PHONE') return 'Telefone';
  if (normalized === 'WHTASAPP' || normalized === 'WHATSAPP') return 'WhatsApp';
  if (normalized === 'BOT') return 'Bot';
  return value;
}

function Breakdown({ title, rows }: { title: string; rows: Array<{ label: string; value: number }> }) {
  return <div><h4 className="mb-2 text-xs font-semibold text-[color:var(--minimal-text)]">{title}</h4><div className="space-y-1.5">{rows.length ? rows.map((row) => <div key={row.label} className="flex items-center justify-between gap-3 rounded-md bg-[color:var(--minimal-surface-muted)] px-2.5 py-2 text-xs"><span className="truncate text-[color:var(--minimal-text-secondary)]" title={row.label}>{row.label}</span><span className="font-semibold tabular-nums text-[color:var(--minimal-text)]">{row.value.toLocaleString('pt-BR')}</span></div>) : <p className="text-xs text-[color:var(--minimal-text-tertiary)]">Sem dados.</p>}</div></div>;
}

function OwnerPipelineNote({ owners }: { owners: CsOwnerPoint[] }) {
  return <div className="mt-4 rounded-md border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-3">
    <div className="flex items-center gap-1.5"><h4 className="text-xs font-semibold text-[color:var(--minimal-text)]">Detalhamento dos responsáveis por pipeline</h4><MetricInfo ariaLabel="Como os responsáveis são consolidados" text="Responsáveis com o mesmo nome são consolidados no total. Esta lista mostra em quais pipelines cada responsável aparece e quantos tickets foram encontrados em cada um." /></div>
    <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">{owners.length ? owners.map((owner) => <div key={`${owner.ownerId ?? 'none'}-${owner.ownerName}`} className="rounded-md border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2.5 py-2 text-[11px]"><div className="flex items-center justify-between gap-2"><span className="truncate font-medium text-[color:var(--minimal-text)]" title={owner.ownerName}>{owner.ownerName}</span><span className="font-semibold tabular-nums text-[color:var(--minimal-text)]">{owner.ticketCount.toLocaleString('pt-BR')}</span></div><p className="mt-1 text-[color:var(--minimal-text-tertiary)]">{formatPipelineBreakdown(owner.pipelineBreakdown) || 'Pipeline indisponível'}</p></div>) : <p className="text-xs text-[color:var(--minimal-text-tertiary)]">Sem dados.</p>}</div>
  </div>;
}

function formatPipelineBreakdown(rows?: CsPipelineBreakdown[]): string {
  if (!rows?.length) return '';
  return rows.map((row) => `${row.pipelineLabel}: ${row.ticketCount.toLocaleString('pt-BR')}`).join(' · ');
}
