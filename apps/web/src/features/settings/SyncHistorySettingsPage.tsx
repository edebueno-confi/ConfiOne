import { useCallback, useEffect, useMemo, useState } from 'react';
import { MinimalState } from '../../components/minimal-states';
import { listAnalyticsSyncHistory } from '../analytics/analytics-api';
import type { AnalyticsSyncHistoryRow } from '../analytics/analytics-model';
import { SettingsPageHeader } from './SettingsPageHeader';
import {
  DEFAULT_HISTORY_FILTERS,
  PERIOD_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
  TRIGGER_OPTIONS,
  UNAVAILABLE_LABEL,
  bucketTone,
  cycleRowOf,
  filterHistoryGroups,
  groupHistoryRows,
  hasActiveHistoryFilters,
  paginate,
  resolveGroupStatus,
  statusBucket,
  statusLabel,
  type HistoryFilters,
} from './history/sync-history-view.mjs';
import './settings-shell.css';

const CONTROL = 'w-full rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-2.5 py-2 text-sm text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]';
const PAGE_SIZE_OPTIONS = [10, 25, 50];

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
  const totalProcessed = steps.reduce((sum, row) => sum + row.processedCount, 0);

  return (
    <li>
      <details className="gso-settings-history-group" open={isLatest}>
        <summary className="gso-settings-history-summary">
        <div>
          <p className="gso-settings-eyebrow">Registro operacional</p>
          <h3>{triggerLabelOf(cycle)}</h3>
          <p>{formatDate(cycle.startedAt, cycle.status)} · {cycle.currentStep ? `etapa atual: ${cycle.currentStep}` : 'HubSpot → OMIE'}</p>
        </div>
        <span className={`gso-settings-status gso-settings-status--${statusBucket(status) === 'failed' ? 'failed' : status}`}>{statusLabel(status)}</span>
        </summary>
        <div className="gso-settings-history-details">
        {steps.length ? steps.map((row) => (
          <div className="gso-settings-history-source" key={`${row.sourceKey}-${row.runId ?? row.cycleId}`}>
            <div><strong>{row.sourceLabel}</strong><span>{statusLabel(row.status)}</span></div>
            <dl>
              <div><dt>Início</dt><dd>{formatDate(row.startedAt, row.status)}</dd></div>
              <div><dt>Fim</dt><dd>{formatDate(row.finishedAt, row.status)}</dd></div>
              <div><dt>Duração</dt><dd>{formatDuration(row.durationMs)}</dd></div>
              <div><dt>Registros lidos</dt><dd>{row.processedCount || UNAVAILABLE_LABEL}</dd></div>
            </dl>
            {row.errorMessage ? <p className="gso-settings-history-error">{row.errorMessage}</p> : null}
          </div>
        )) : <p className="gso-settings-empty">As etapas deste ciclo ainda não foram publicadas.</p>}
        </div>
      <footer className="gso-settings-history-footer">
        {totalProcessed ? `${totalProcessed} registros processados no ciclo.` : cycle.sourceKey ? 'Execução registrada; quantidade processada indisponível.' : 'Quantidade processada indisponível neste ciclo.'}
        {cycle.correlationId ? ` Correlação: ${cycle.correlationId}.` : ''}
      </footer>
        </details>
    </li>
  );
}

/**
 * Historico de sincronizacoes. Os quatro filtros operam sobre as linhas
 * carregadas e todos os numeros da faixa refletem o recorte visivel, para que
 * nenhum indicador contradiga a lista.
 */
export function SyncHistorySettingsPage() {
  const [rows, setRows] = useState<AnalyticsSyncHistoryRow[]>([]);
  const [loadedAtMs, setLoadedAtMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_HISTORY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await listAnalyticsSyncHistory();
      setRows(next);
      // O recorte de período é calculado a partir do instante da leitura, não de
      // um relógio lido durante o render: o filtro precisa ser estável.
      setLoadedAtMs(new Date().getTime());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o histórico agora.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const groups = useMemo(() => groupHistoryRows(rows), [rows]);
  const visibleGroups = useMemo(() => filterHistoryGroups(groups, filters, loadedAtMs), [groups, filters, loadedAtMs]);
  const counts = useMemo(() => {
    const list = visibleGroups;
    let success = 0;
    let partial = 0;
    let failed = 0;
    let running = 0;
    for (const group of list) {
      const bucket = statusBucket(resolveGroupStatus(group));
      if (bucket === 'success') success += 1;
      else if (bucket === 'partial') partial += 1;
      else if (bucket === 'failed') failed += 1;
      else if (bucket === 'running') running += 1;
    }
    return { total: list.length, success, partial, failed, running };
  }, [visibleGroups]);
  const pageInfo = useMemo(() => paginate(visibleGroups, page, pageSize), [visibleGroups, page, pageSize]);

  const updateFilter = (key: keyof HistoryFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const resetFilters = () => {
    setFilters(DEFAULT_HISTORY_FILTERS);
    setPage(1);
  };
  const filtersActive = hasActiveHistoryFilters(filters);

  if (loading && !rows.length) return <MinimalState loading title="Carregando histórico" description="Consultando os ciclos e etapas registrados das fontes." />;
  if (error && !rows.length) return <MinimalState tone="critical" title="Não foi possível carregar o histórico" description={error} />;

  return (
    <div className="gso-settings-page gso-settings-history gso-visual-v1-settings">
      <SettingsPageHeader
        actions={
          <button className="gso-settings-button gso-settings-button--secondary" disabled={loading} onClick={() => void load()} type="button">
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
        }
        description="Ciclos e etapas registrados pelas atualizações do Dashboard, por fonte, resultado e quantidade processada."
        meta={`${rows.length} execuções carregadas${loadedAtMs ? ` · leitura de ${new Date(loadedAtMs).toLocaleTimeString('pt-BR')}` : ''}`}
        title="Histórico de sincronizações"
        titleId="settings-sync-history-title"
      />

      <section aria-label="Filtros do histórico" className="gso-settings-toolbar">
        <label className="gso-settings-toolbar-field">
          <span>Período</span>
          <select className={CONTROL} onChange={(event) => updateFilter('period', event.target.value)} value={filters.period}>
            {PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="gso-settings-toolbar-field">
          <span>Fonte</span>
          <select className={CONTROL} onChange={(event) => updateFilter('source', event.target.value)} value={filters.source}>
            {SOURCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="gso-settings-toolbar-field">
          <span>Resultado</span>
          <select className={CONTROL} onChange={(event) => updateFilter('status', event.target.value)} value={filters.status}>
            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="gso-settings-toolbar-field">
          <span>Gatilho</span>
          <select className={CONTROL} onChange={(event) => updateFilter('trigger', event.target.value)} value={filters.trigger}>
            {TRIGGER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <div className="gso-settings-toolbar-actions">
          <button className="gso-settings-toolbar-reset" disabled={!filtersActive} onClick={resetFilters} type="button">
            Limpar filtros
          </button>
        </div>
      </section>

      <section aria-label="Resumo do recorte" className="gso-settings-metrics">
        <div className="gso-settings-metric gso-settings-metric--accent">
          <span>No recorte</span>
          <strong>{counts.total}</strong>
          <small>execuções visíveis</small>
        </div>
        <div className="gso-settings-metric">
          <span>Concluídas</span>
          <strong className={counts.success ? bucketToneClass('success') : undefined}>{counts.success}</strong>
          <small>sem falha nas etapas</small>
        </div>
        <div className="gso-settings-metric">
          <span>Parciais</span>
          <strong className={counts.partial ? bucketToneClass('partial') : undefined}>{counts.partial}</strong>
          <small>parte da carga concluída</small>
        </div>
        <div className="gso-settings-metric">
          <span>Com falha</span>
          <strong className={counts.failed ? bucketToneClass('failed') : undefined}>{counts.failed}</strong>
          <small>etapa interrompida ou recusada</small>
        </div>
        <div className="gso-settings-metric">
          <span>Em andamento</span>
          <strong className={counts.running ? bucketToneClass('running') : undefined}>{counts.running}</strong>
          <small>ciclo ainda aberto</small>
        </div>
      </section>

      {error ? <p className="gso-settings-inline-error" role="alert">{error}</p> : null}

      {!groups.length ? (
        <p className="gso-settings-empty">Nenhuma atualização registrada neste ambiente.</p>
      ) : !visibleGroups.length ? (
        <p className="gso-settings-empty">
          Nenhuma execução corresponde aos filtros escolhidos.{' '}
          <button className="gso-settings-toolbar-reset" onClick={resetFilters} type="button">Limpar filtros</button>
        </p>
      ) : (
        <>
          <ol className="gso-settings-history-list">
            {pageInfo.slice.map((group, index) => (
              <HistoryGroup isLatest={pageInfo.page === 1 && index === 0} key={cycleRowOf(group).cycleId} rows={group} />
            ))}
          </ol>
          <footer className="gso-settings-pagination">
            <span>
              Exibindo {pageInfo.from} a {pageInfo.to} de {pageInfo.total} execuções
            </span>
            <div className="gso-settings-pagination-controls">
              <label className="gso-settings-toolbar-field">
                <span className="sr-only">Execuções por página</span>
                <select
                  aria-label="Execuções por página"
                  className={CONTROL}
                  onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
                  value={pageSize}
                >
                  {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option} por página</option>)}
                </select>
              </label>
              <button
                aria-label="Página anterior"
                className="gso-settings-pagination-button"
                disabled={pageInfo.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                type="button"
              >
                ‹
              </button>
              <span>
                {pageInfo.page} / {pageInfo.pageCount}
              </span>
              <button
                aria-label="Próxima página"
                className="gso-settings-pagination-button"
                disabled={pageInfo.page >= pageInfo.pageCount}
                onClick={() => setPage((current) => current + 1)}
                type="button"
              >
                ›
              </button>
            </div>
          </footer>
          <p className="gso-settings-help">
            O histórico lê as 100 execuções mais recentes registradas. Recortes mais antigos não estão disponíveis nesta tela.
          </p>
        </>
      )}
    </div>
  );
}

function bucketToneClass(bucket: 'success' | 'partial' | 'failed' | 'running') {
  return `gso-settings-tone-${bucketTone(bucket)}`;
}
