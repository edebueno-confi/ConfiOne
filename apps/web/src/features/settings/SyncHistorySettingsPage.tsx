import { useCallback, useEffect, useMemo, useState } from 'react';
import { MinimalState } from '../../components/minimal-states';
import { listAnalyticsSyncHistory } from '../analytics/analytics-api';
import type { AnalyticsSyncHistoryRow } from '../analytics/analytics-model';

function formatDate(value: string | null, status?: string) {
  if (value) return new Date(value).toLocaleString('pt-BR');
  if (status === 'timed_out' || status === 'abandoned') return 'Execução interrompida';
  if (status === 'running' || status === 'queued') return 'Execução em andamento';
  return 'Indisponível';
}

function formatDuration(value: number) {
  if (!value) return 'Indisponível';
  const seconds = Math.max(1, Math.round(value / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
}

function statusLabel(value: string) {
  return ({
    queued: 'Na fila',
    running: 'Em andamento',
    success: 'Concluído',
    succeeded: 'Concluído',
    partial: 'Parcial',
    failed: 'Falhou',
    error: 'Falhou',
    abandoned: 'Interrompida',
    timed_out: 'Tempo excedido',
    cancelled: 'Cancelada',
    empty: 'Sem dados',
  } as Record<string, string>)[value] ?? 'Indisponível';
}

function HistoryGroup({ rows, isLatest = false }: { rows: AnalyticsSyncHistoryRow[]; isLatest?: boolean }) {
  const cycle = rows.find((row) => row.rowKind === 'cycle') ?? rows[0];
  const steps = rows.filter((row) => row.rowKind === 'step');
  const triggerLabel = cycle.sourceKey
    ? 'Execução direta'
    : cycle.triggerKind === 'manual'
      ? 'Ação manual'
      : cycle.triggerKind === 'diagnostic'
        ? 'Diagnóstico'
        : 'Atualização automática';
  const hasFailure = rows.some((row) => ['failed', 'error', 'abandoned', 'timed_out', 'cancelled'].includes(row.status));
  const isParentCycle = cycle.rowKind === 'cycle';
  const status = isParentCycle && cycle.status === 'partial'
    ? 'partial'
    : rows.some((row) => ['running', 'queued'].includes(row.status))
      ? 'running'
      : hasFailure
        ? 'failed'
        : rows.some((row) => row.status === 'partial')
          ? 'partial'
          : cycle.status;
  const totalProcessed = steps.reduce((sum, row) => sum + row.processedCount, 0);

  return (
    <li>
      <details className="gso-settings-history-group" open={isLatest}>
        <summary className="gso-settings-history-summary">
        <div>
          <p className="gso-settings-eyebrow">{triggerLabel}</p>
          <h3>Ciclo de atualização</h3>
          <p>{formatDate(cycle.startedAt, cycle.status)} · {cycle.currentStep ? `etapa atual: ${cycle.currentStep}` : 'HubSpot → OMIE'}</p>
        </div>
        <span className={`gso-settings-status gso-settings-status--${status}`}>{statusLabel(status)}</span>
        </summary>
        <div className="gso-settings-history-details">
        {steps.length ? steps.map((row) => (
          <div className="gso-settings-history-source" key={`${row.sourceKey}-${row.runId ?? row.cycleId}`}>
            <div><strong>{row.sourceLabel}</strong><span>{statusLabel(row.status)}</span></div>
            <dl>
              <div><dt>Início</dt><dd>{formatDate(row.startedAt, row.status)}</dd></div>
              <div><dt>Fim</dt><dd>{formatDate(row.finishedAt, row.status)}</dd></div>
              <div><dt>Duração</dt><dd>{formatDuration(row.durationMs)}</dd></div>
              <div><dt>Registros lidos</dt><dd>{row.processedCount || 'Indisponível'}</dd></div>
            </dl>
            {row.errorMessage ? <p className="gso-settings-history-error">{row.errorMessage}</p> : null}
          </div>
        )) : <p className="gso-settings-empty">As etapas deste ciclo ainda não foram publicadas.</p>}
        </div>
      <footer className="gso-settings-history-footer">{totalProcessed ? `${totalProcessed} registros processados no ciclo.` : cycle.sourceKey ? 'Execução registrada; quantidade processada indisponível.' : 'Quantidade processada indisponível neste ciclo.'}</footer>
        </details>
    </li>
  );
}

export function SyncHistorySettingsPage() {
  const [rows, setRows] = useState<AnalyticsSyncHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listAnalyticsSyncHistory());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o histórico agora.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const groups = useMemo(() => {
    const grouped = new Map<string, AnalyticsSyncHistoryRow[]>();
    for (const row of rows) {
      const key = row.cycleId || row.correlationId || row.runId || `${row.startedAt}-${row.status}`;
      grouped.set(key, [...(grouped.get(key) ?? []), row]);
    }
    return [...grouped.values()];
  }, [rows]);

  if (loading && !rows.length) return <MinimalState loading title="Carregando histórico" description="Consultando os ciclos e etapas registrados das fontes." />;
  if (error && !rows.length) return <MinimalState tone="critical" title="Não foi possível carregar o histórico" description={error} />;

  return (
    <div className="gso-settings-stack gso-settings-history gso-visual-v1-settings">
      <section className="gso-settings-source-overview">
        <div>
          <p className="gso-settings-eyebrow">Rastreabilidade</p>
          <h3>Histórico de atualizações</h3>
          <p>Cada ciclo mostra HubSpot, OMIE, etapa atual, resultado e quantidade processada. Erros são resumidos e nunca expõem credenciais ou detalhes internos.</p>
        </div>
        <button className="gso-settings-button gso-settings-button--secondary" type="button" onClick={() => void load()} disabled={loading}>Atualizar histórico</button>
      </section>
      {error ? <p className="gso-settings-inline-error" role="alert">{error}</p> : null}
      {groups.length ? <ol className="gso-settings-history-list">{groups.map((group) => <HistoryGroup key={group[0].cycleId} rows={group} />)}</ol> : <p className="gso-settings-empty">Nenhuma atualização registrada neste ambiente.</p>}
    </div>
  );
}
