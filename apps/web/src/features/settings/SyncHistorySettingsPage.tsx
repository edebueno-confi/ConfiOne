import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { MinimalState } from '../../components/minimal-states';
import { listAnalyticsSyncHistory } from '../analytics/analytics-api';
import type { AnalyticsSyncHistoryRow } from '../analytics/analytics-model';
import {
  DEFAULT_HISTORY_FILTERS,
  PERIOD_OPTIONS,
  SORT_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
  TRIGGER_OPTIONS,
  UNAVAILABLE_LABEL,
  cycleRowOf,
  filterHistoryGroups,
  groupHistoryRows,
  hasActiveHistoryFilters,
  paginate,
  resolveGroupStatus,
  sortHistoryGroups,
  statusBucket,
  statusLabel,
  summarizeHistoryGroups,
  type HistoryFilters,
} from './history/sync-history-view.mjs';
import { UiBadge } from './ui/UiBadge';
import { UiButton } from './ui/UiButton';
import { UiCard } from './ui/UiCard';
import { UiEmptyState } from './ui/UiEmptyState';
import { UiField } from './ui/UiField';
import { UiIcon } from './ui/UiIcon';
import { UiIconTile } from './ui/UiIconTile';
import { UiMetric } from './ui/UiMetric';
import { UiMetricRow } from './ui/UiMetricRow';
import { UiPage } from './ui/UiPage';
import { UiPageHeader } from './ui/UiPageHeader';
import { UiToolbar } from './ui/UiToolbar';
import type { UiTone } from './ui/ui-types';
import './settings-ui.css';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const BUCKET_TONE: Record<string, UiTone> = { success: 'success', partial: 'warning', failed: 'danger', running: 'primary' };

function historyFiltersFromUrl(params: URLSearchParams): HistoryFilters {
  const defaults = DEFAULT_HISTORY_FILTERS as HistoryFilters;
  return Object.keys(defaults).reduce((next, key) => {
    const value = params.get(key);
    if (value) next[key as keyof HistoryFilters] = value;
    return next;
  }, { ...defaults });
}

function bucketTone(bucket: string): UiTone {
  return BUCKET_TONE[bucket] ?? 'neutral';
}

function formatDate(value: string | null, status?: string) {
  if (value) return new Date(value).toLocaleString('pt-BR');
  if (status === 'timed_out' || status === 'abandoned') return 'Execução interrompida';
  if (status === 'running' || status === 'queued') return 'Execução em andamento';
  return UNAVAILABLE_LABEL;
}

function formatDuration(value: number) {
  if (!value) return UNAVAILABLE_LABEL;
  const seconds = Math.max(1, Math.round(value / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
}

function triggerLabelOf(cycle: AnalyticsSyncHistoryRow) {
  if (cycle.sourceKey) return 'Execução direta';
  if (cycle.triggerKind === 'manual') return 'Ação manual';
  if (cycle.triggerKind === 'diagnostic') return 'Diagnóstico';
  return 'Atualização automática';
}

function HistoryGroup({ rows, isLatest = false }: { rows: AnalyticsSyncHistoryRow[]; isLatest?: boolean }) {
  const cycle = cycleRowOf(rows);
  const steps = rows.filter((row) => row.rowKind === 'step');
  const status = resolveGroupStatus(rows);
  const tone = bucketTone(statusBucket(status));
  const totalProcessed = steps.reduce((sum, row) => sum + row.processedCount, 0);

  return (
    <li>
      <details className="gso-ui-historygroup" open={isLatest}>
        <summary>
          <div className="gso-ui-historysummary">
            <UiIconTile icon={cycle.sourceKey ? 'refresh' : 'clock'} tone={tone} />
            <div>
              <h3>{triggerLabelOf(cycle)}</h3>
              <p>{formatDate(cycle.startedAt, cycle.status)} · {cycle.currentStep ? `etapa atual: ${cycle.currentStep}` : 'HubSpot → OMIE'}</p>
            </div>
            <UiBadge dot tone={tone}>{statusLabel(status)}</UiBadge>
          </div>
        </summary>
        <div className="gso-ui-historybody">
          {steps.length ? steps.map((row) => (
            <div className="gso-ui-historysource" key={`${row.sourceKey}-${row.runId ?? row.cycleId}`}>
              <div className="gso-ui-historysource-head">
                <strong>{row.sourceLabel}</strong>
                <UiBadge tone={bucketTone(statusBucket(row.status))}>{statusLabel(row.status)}</UiBadge>
              </div>
              <dl>
                <div><dt>Início</dt><dd>{formatDate(row.startedAt, row.status)}</dd></div>
                <div><dt>Fim</dt><dd>{formatDate(row.finishedAt, row.status)}</dd></div>
                <div><dt>Duração</dt><dd>{formatDuration(row.durationMs)}</dd></div>
                <div><dt>Registros lidos</dt><dd>{row.processedCount || UNAVAILABLE_LABEL}</dd></div>
              </dl>
              {row.errorMessage ? <p className="gso-ui-historysource-error">{row.errorMessage}</p> : null}
            </div>
          )) : <UiEmptyState icon="list" title="As etapas deste ciclo ainda não foram publicadas." />}
        </div>
        <footer className="gso-ui-historyfoot">
          {totalProcessed ? `${totalProcessed.toLocaleString('pt-BR')} registros processados no ciclo.` : cycle.sourceKey ? 'Execução registrada; quantidade processada indisponível.' : 'Quantidade processada indisponível neste ciclo.'}
          {cycle.correlationId ? ` Correlação: ${cycle.correlationId}.` : ''}
        </footer>
      </details>
    </li>
  );
}

export function SyncHistorySettingsPage() {
  const [rows, setRows] = useState<AnalyticsSyncHistoryRow[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadedAtMs, setLoadedAtMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HistoryFilters>(() => historyFiltersFromUrl(searchParams));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listAnalyticsSyncHistory());
      setLoadedAtMs(Date.now());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o histórico agora.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const groups = useMemo(() => groupHistoryRows(rows), [rows]);
  const visibleGroups = useMemo(() => sortHistoryGroups(filterHistoryGroups(groups, filters, loadedAtMs), filters.sort), [filters, groups, loadedAtMs]);
  const counts = useMemo(() => summarizeHistoryGroups(visibleGroups), [visibleGroups]);
  const rateLabel = (value: number) => counts.total
    ? `${((value / counts.total) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% do recorte`
    : 'Sem execuções no recorte';
  const totalPages = Math.max(1, Math.ceil(visibleGroups.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageInfo = useMemo(() => paginate(visibleGroups, currentPage, pageSize), [visibleGroups, currentPage, pageSize]);
  const filtersActive = useMemo(() => hasActiveHistoryFilters(filters), [filters]);

  const updateFilter = <K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    const nextParams = new URLSearchParams(searchParams);
    if (value === DEFAULT_HISTORY_FILTERS[key]) nextParams.delete(key);
    else nextParams.set(key, value);
    setSearchParams(nextParams, { replace: true });
    setPage(1);
  };
  const resetFilters = () => {
    setFilters(DEFAULT_HISTORY_FILTERS);
    const nextParams = new URLSearchParams(searchParams);
    Object.keys(DEFAULT_HISTORY_FILTERS).forEach((key) => nextParams.delete(key));
    setSearchParams(nextParams, { replace: true });
    setPage(1);
  };

  if (loading && !rows.length) return <MinimalState loading title="Carregando histórico" description="Consultando os ciclos e etapas registrados das fontes." />;
  if (error && !rows.length) return <MinimalState tone="critical" title="Não foi possível carregar o histórico" description={error} />;

  return (
    <UiPage className="gso-po-v2-history">
      <UiPageHeader
        actions={<UiButton disabled={loading} icon="refresh" onClick={() => void load()}>{loading ? 'Atualizando…' : 'Atualizar'}</UiButton>}
        description="Ciclos e etapas registrados pelas atualizações do Dashboard, por fonte, resultado e quantidade processada."
        meta={`${groups.length} ciclos carregados${loadedAtMs ? ` · leitura de ${new Date(loadedAtMs).toLocaleTimeString('pt-BR')}` : ''}`}
        title="Histórico de sincronizações"
        titleId="settings-sync-history-title"
      />

      <UiToolbar actions={<button className="gso-ui-linkbutton" disabled={!filtersActive} onClick={resetFilters} type="button">Limpar filtros</button>} label="Filtros do histórico">
        <div className="gso-ui-toolbar-field"><UiField label="Período"><select className="gso-ui-control gso-ui-select" onChange={(event) => updateFilter('period', event.target.value)} value={filters.period}>{PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></UiField></div>
        <div className="gso-ui-toolbar-field"><UiField label="Fonte"><select className="gso-ui-control gso-ui-select" onChange={(event) => updateFilter('source', event.target.value)} value={filters.source}>{SOURCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></UiField></div>
        <div className="gso-ui-toolbar-field"><UiField label="Resultado"><select className="gso-ui-control gso-ui-select" onChange={(event) => updateFilter('status', event.target.value)} value={filters.status}>{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></UiField></div>
        <div className="gso-ui-toolbar-field"><UiField label="Gatilho"><select className="gso-ui-control gso-ui-select" onChange={(event) => updateFilter('trigger', event.target.value)} value={filters.trigger}>{TRIGGER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></UiField></div>
        <div className="gso-ui-toolbar-field"><UiField label="Ordem"><select className="gso-ui-control gso-ui-select" onChange={(event) => updateFilter('sort', event.target.value)} value={filters.sort}>{SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></UiField></div>
      </UiToolbar>

      <UiMetricRow label="Resumo do recorte">
        <UiMetric icon="refresh" label="Execuções no recorte" sub={`${groups.length} ciclos carregados`} tone="primary" value={counts.total} />
        <UiMetric icon="check" label="Concluídas" sub={rateLabel(counts.success)} tone="success" value={counts.success} valueTone="success" />
        <UiMetric icon="alert" label="Parciais" sub={rateLabel(counts.partial)} tone="warning" value={counts.partial} valueTone="warning" />
        <UiMetric icon="x" label="Falhas" sub={rateLabel(counts.failed)} tone="danger" value={counts.failed} valueTone="danger" />
        <UiMetric icon="clock" label="Tempo médio" sub="Por ciclo com duração publicada" tone="neutral" value={formatDuration(counts.averageDurationMs)} />
      </UiMetricRow>

      {error ? <p className="gso-ui-alert gso-ui-alert--error" role="alert">{error}</p> : null}
      {!groups.length ? <UiCard><UiEmptyState icon="clock" title="Nenhuma atualização registrada neste ambiente." /></UiCard> : !visibleGroups.length ? <UiCard><UiEmptyState action={<button className="gso-ui-linkbutton" onClick={resetFilters} type="button">Limpar filtros</button>} description="Nenhuma execução corresponde aos filtros escolhidos." icon="filter" title="Nada neste recorte" /></UiCard> : (
        <>
          <ol className="gso-ui-historylist">
            {pageInfo.slice.map((group, index) => <HistoryGroup isLatest={pageInfo.page === 1 && index === 0} key={cycleRowOf(group).cycleId} rows={group} />)}
          </ol>
          <UiCard>
            <footer className="gso-ui-pagination">
              <span>Exibindo {pageInfo.from} a {pageInfo.to} de {pageInfo.total} execuções</span>
              <div className="gso-ui-pagination-controls">
                <select aria-label="Execuções por página" className="gso-ui-control gso-ui-select" onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} value={pageSize}>{PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option} por página</option>)}</select>
                <button aria-label="Página anterior" className="gso-ui-page-button" disabled={pageInfo.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button"><UiIcon name="chevron-left" /></button>
                <span>{pageInfo.page} / {pageInfo.pageCount}</span>
                <button aria-label="Próxima página" className="gso-ui-page-button" disabled={pageInfo.page >= pageInfo.pageCount} onClick={() => setPage((current) => current + 1)} type="button"><UiIcon name="chevron-right" /></button>
              </div>
            </footer>
            <p className="gso-ui-note">O histórico lê até 100 linhas publicadas pelo read model. Use a ordem e os filtros para alternar a leitura do recorte carregado; recortes mais antigos não estão disponíveis nesta tela.</p>
          </UiCard>
        </>
      )}
    </UiPage>
  );
}
